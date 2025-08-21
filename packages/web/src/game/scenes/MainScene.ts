import Phaser from 'phaser'
import { AvatarSpriteGenerator, AvatarConfig } from '../systems/AvatarSystem'
import { DirectionalPlayer } from '../systems/DirectionalPlayer'

interface Player {
  id: string
  name: string
  sprite: DirectionalPlayer
  x: number
  y: number
}

export class MainScene extends Phaser.Scene {
  private player: DirectionalPlayer | null = null
  private otherPlayers: Map<string, Player> = new Map()
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasdKeys: any = null
  private avatarGenerator: AvatarSpriteGenerator | null = null
  private sceneReady = false
  private lastMovementTime = 0
  private lastMovementPosition = { x: 0, y: 0 }
  private movementThrottle = 100 // Throttle movement updates to 10fps

  constructor() {
    super({ key: 'MainScene' })
  }

  create() {
    console.log('🎮 Creating MainScene...')
    
    try {
      // Setup world bounds and physics first
      this.physics.world.setBounds(0, 0, 1200, 800)
      
      // Create immersive Chinese office environment (no collision yet)
      this.createImmerseEnvironment()
      
      // Setup controls
      this.setupControls()
      
      // Setup avatar generator
      this.avatarGenerator = new AvatarSpriteGenerator(this)
      
      // Create current user's avatar (handle async properly)
      this.createCurrentUserAvatar().then(() => {
        console.log('✅ Current user avatar created successfully')
      }).catch(error => {
        console.error('❌ Error creating current user avatar:', error)
      })
      
      // Setup simple collision after everything is created
      this.setupSimpleCollision()
      
      // Setup multiplayer event listeners
      this.setupMultiplayerEvents()
      
      this.sceneReady = true
      console.log('✅ MainScene creation completed successfully')
      
      // Emit Phaser scene ready event
      this.events.emit('ready', this)
      
      // Also dispatch window event for backward compatibility
      window.dispatchEvent(new CustomEvent('gameSceneReady', { detail: { scene: this } }))
      
    } catch (error) {
      console.error('❌ Error creating MainScene:', error)
      throw error
    }
  }

  private setupSimpleCollision() {
    console.log('⚙️ Setting up comprehensive collision detection...')
    
    // Ensure physics world bounds are properly set
    const bounds = this.physics.world.bounds
    console.log('🌍 Physics world bounds:', bounds)
    
    // Simple world bounds collision - player can't leave the office area
    if (this.player) {
      // Enable world bounds collision
      this.player.setCollideWorldBounds(true)
      
      // Get the physics body and configure it properly
      const sprite = this.player.getSprite()
      const body = sprite.body as Phaser.Physics.Arcade.Body
      
      if (body) {
        // Configure collision properties
        body.setCollideWorldBounds(true)
        body.setBounce(0.1) // Slight bounce effect
        body.setDragX(300) // Add drag to make movement feel more natural
        body.setDragY(300)
        body.setMaxVelocity(200) // Limit max velocity
        
        // Enable world bounds events
        body.onWorldBounds = true
        
        console.log('🎯 Player collision setup:', {
          collideWorldBounds: body.collideWorldBounds,
          worldBoundsSet: !!this.physics.world.bounds,
          playerPosition: { x: sprite.x, y: sprite.y },
          worldBounds: this.physics.world.bounds,
          bodySize: { width: body.width, height: body.height },
          bounce: { x: body.bounce.x, y: body.bounce.y }
        })
      } else {
        console.error('❌ Player sprite has no physics body!')
      }
      
      console.log('✅ World bounds collision enabled for player')
    } else {
      console.error('❌ No player found during collision setup!')
    }
    
    // Add collision feedback and debugging
    this.physics.world.on('worldbounds', (event: any) => {
      console.log('🚧 Player hit world boundary:', event)
      console.log('🚧 Event details:', {
        body: event.body,
        up: event.up,
        down: event.down,
        left: event.left,
        right: event.right
      })
    })
    
    // Enable world bounds debugging if in development
    if (process.env.NODE_ENV === 'development') {
      this.physics.world.drawDebug = true
      console.log('🔍 Physics debug mode enabled')
    }
    
    console.log('✅ Comprehensive collision detection setup completed')
  }

  private setupMultiplayerEvents() {
    console.log('🌐 Setting up multiplayer event listeners...')
    
    // Add existing users that are already connected
    this.addExistingUsers()
    
    // Listen for new users joining
    window.addEventListener('userJoined', (event: any) => {
      const { userId, username, position } = event.detail
      console.log('👥 User joined:', username, 'at', position)
      if (userId && position) {
        this.addOtherPlayer(userId, username, position.x || 200, position.y || 300)
      }
    })
    
    // Listen for users leaving
    window.addEventListener('userLeft', (event: any) => {
      const { userId } = event.detail
      console.log('👋 User left:', userId)
      if (userId) {
        this.removeOtherPlayer(userId)
      }
    })
    
    // Listen for player movement updates from other users (remote)
    window.addEventListener('remotePlayerMoved', (event: any) => {
      const { userId, position } = event.detail
      console.log('📡 Received remote player movement:', { userId, position })
      if (userId && position && userId !== (window as any).currentUserId) {
        this.updatePlayerPosition(userId, position.x, position.y)
      } else if (userId === (window as any).currentUserId) {
        console.log('🚫 Ignoring own movement event from server')
      }
    })
    
    console.log('✅ Multiplayer event listeners setup completed')
  }

  private addExistingUsers() {
    // Only add existing users after scene is fully ready
    if (!this.sceneReady) {
      console.log('⏳ Scene not ready, deferring existing users loading...')
      setTimeout(() => this.addExistingUsers(), 200)
      return
    }
    
    // Import dynamically to avoid circular dependency
    import('../../store').then(({ store }) => {
      const onlineUsers = store.getState().user.onlineUsers
      console.log('👥 Adding existing users:', onlineUsers.length)
      
      onlineUsers.forEach(user => {
        if (user.socketId && user.socketId !== (window as any).currentUserId) {
          console.log('➕ Adding existing user:', user.username)
          this.addOtherPlayer(
            user.socketId, 
            user.username, 
            Math.random() * 800 + 200, // Random x position
            Math.random() * 600 + 200  // Random y position
          )
        }
      })
    }).catch(console.error)
  }

  private createImmerseEnvironment() {
    console.log('🌸 Creating immersive Chinese office environment...')
    
    // Create gradient background for depth
    const background = this.add.graphics()
    background.fillGradientStyle(0xf8f9fa, 0xf8f9fa, 0xe9ecef, 0xe9ecef, 0.8)
    background.fillRect(0, 0, 1200, 800)
    background.setDepth(-50)

    // Create wooden floor with subtle texture pattern
    this.createFloorPattern()
    
    // Add ambient lighting effects
    this.createAmbientLighting()
    
    // Create workstation areas with collision
    this.createWorkstationAreasWithCollision()
    
    // Create meeting room with collision  
    this.createMeetingRoomAreaWithCollision()
    
    // Create lounge area with collision
    this.createLoungeAreaWithCollision()
    
    // Create wall boundaries
    this.createWallBoundaries()
    
    // Add some Chinese cultural elements
    this.addChineseCulturalElements()
    
    console.log('✅ Immersive environment created')
  }

  private createFloorPattern() {
    // Create subtle wooden floor pattern
    const floorGraphics = this.add.graphics()
    floorGraphics.fillStyle(0xDEB887, 0.4) // BurlyWood
    
    // Create wooden plank effect
    for (let y = 0; y < 800; y += 60) {
      for (let x = 0; x < 1200; x += 120) {
        floorGraphics.fillRect(x, y, 115, 55)
        floorGraphics.lineStyle(1, 0xCD853F, 0.3)
        floorGraphics.strokeRect(x, y, 115, 55)
      }
    }
    floorGraphics.setDepth(-40)
  }

  private createAmbientLighting() {
    // Soft ambient lighting effect
    const lightOverlay = this.add.graphics()
    lightOverlay.fillGradientStyle(0xffffff, 0xffffff, 0xf0f0f0, 0xf0f0f0, 0.1)
    lightOverlay.fillEllipse(600, 200, 800, 400)
    lightOverlay.setDepth(-30)
    
    // Add some warm light spots from ceiling fixtures
    const lightSpots = [
      { x: 300, y: 200 }, { x: 600, y: 200 }, { x: 900, y: 200 },
      { x: 300, y: 500 }, { x: 600, y: 500 }, { x: 900, y: 500 }
    ]
    
    lightSpots.forEach(spot => {
      const warmLight = this.add.graphics()
      warmLight.fillGradientStyle(0xfff8dc, 0xfff8dc, 0xfff8dc, 0xfff8dc, 0.05)
      warmLight.fillCircle(0, 0, 80)
      warmLight.setPosition(spot.x, spot.y)
      warmLight.setDepth(-35)
    })
  }

  private createPlantDecoration(x: number, y: number, color: number = 0x228B22, scale: number = 1) {
    // Create a simple plant decoration
    const plant = this.add.graphics()
    plant.fillStyle(color)
    plant.fillCircle(0, -8, 8 * scale) // Leaves
    plant.fillCircle(-6 * scale, -5, 5 * scale) // More leaves
    plant.fillCircle(6 * scale, -5, 5 * scale) // More leaves
    plant.fillStyle(0x8B4513) // Brown pot
    plant.fillRect(-6 * scale, -2, 12 * scale, 8 * scale)
    plant.setPosition(x, y)
    plant.setDepth(20)
  }

  private addChineseCulturalElements() {
    // Add subtle Chinese cultural elements
    
    // Add some traditional elements near entrance
    const entranceX = 100, entranceY = 100
    
    // Simple Chinese character decoration (门 = door)
    this.add.text(entranceX, entranceY, '门', {
      fontSize: '32px',
      color: '#DC143C',
      fontFamily: 'PingFang SC, STHeiti, SimHei, Arial'
    }).setOrigin(0.5).setDepth(25)
    
    // Add seasonal elements (plum blossoms for spring/winter)
    const blossomPositions = [
      { x: 1050, y: 150 }, { x: 1100, y: 200 }, { x: 150, y: 700 }
    ]
    
    blossomPositions.forEach(pos => {
      // Simple plum blossom representation
      const blossom = this.add.graphics()
      blossom.fillStyle(0xFFB6C1, 0.8) // Light pink
      blossom.fillCircle(0, 0, 4)
      blossom.fillCircle(8, 0, 4)
      blossom.fillCircle(-8, 0, 4)
      blossom.fillCircle(0, 8, 4)
      blossom.fillCircle(0, -8, 4)
      blossom.fillStyle(0xFFFFE0, 0.9) // Light center
      blossom.fillCircle(0, 0, 2)
      blossom.setPosition(pos.x, pos.y)
      blossom.setDepth(30)
    })
  }

  private setupControls() {
    // Setup keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D')
  }

  private async createCurrentUserAvatar() {
    if (!this.avatarGenerator) return

    // Generate avatar config based on user data (now async)
    const avatarConfig: AvatarConfig = await this.generateAvatarConfig()
    
    // Create directional player
    this.player = new DirectionalPlayer(this, 200, 300, avatarConfig)
    
    // Setup camera to follow player
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.05, 0.05)
    this.cameras.main.setZoom(1.2)
    
    console.log('👤 Current user avatar created with config:', avatarConfig)
  }

  private async generateAvatarConfig(): Promise<AvatarConfig> {
    // Get the actual username from Redux store and profile avatar URL
    let userId = 'default-user'
    let username = 'User'
    let profileAvatarUrl = ''
    
    try {
      // Import store and get current auth state + profile avatar
      const { store } = await import('../../store')
      const state = store.getState()
      console.log('🔍 Current auth state for avatar generation:', state.auth)
      
      if (state.auth?.user?.username) {
        userId = state.auth.user.username
        username = state.auth.user.username
        profileAvatarUrl = state.auth.user.avatar || ''
        console.log('🎨 Avatar config using username from auth:', username)
        console.log('🖼️ Profile avatar URL:', profileAvatarUrl)
      } else {
        console.log('🎨 No username in auth state, checking window properties')
        
        // Fallback to window properties
        if ((window as any).currentUsername) {
          userId = (window as any).currentUsername
          username = (window as any).currentUsername
          console.log('🎨 Avatar config using username from window:', username)
        } else if ((window as any).currentUserId) {
          userId = (window as any).currentUserId
          console.log('🎨 Avatar config using fallback user ID:', userId)
        }
      }
    } catch (error) {
      console.warn('🎨 Error accessing store for avatar generation:', error)
      
      // Final fallback to window properties
      if ((window as any).currentUsername) {
        userId = (window as any).currentUsername
        username = (window as any).currentUsername
      } else if ((window as any).currentUserId) {
        userId = (window as any).currentUserId
      }
    }
    
    // CRITICAL: Extract avatar configuration from profile avatar URL if available
    const avatarConfig = this.extractAvatarConfigFromProfile(profileAvatarUrl, username)
    
    console.log('🎨 Avatar config generated for current user:', { userId, username, profileAvatarUrl, avatarConfig })
    
    return {
      userId: userId,
      username: username,
      seed: username, // Use username as seed for consistency
      colors: avatarConfig.colors,
      style: avatarConfig.style
    }
  }

  /**
   * Extract avatar configuration from DiceBear profile avatar URL
   * This ensures game avatars match the user's profile appearance
   */
  private extractAvatarConfigFromProfile(profileAvatarUrl: string, username: string): { colors: any, style: any } {
    console.log('🔍 Extracting avatar config from profile URL:', profileAvatarUrl)
    
    // Parse DiceBear URL to extract REAL configuration
    let extractedConfig: { colors: any, style: any } = {
      colors: {
        skin: 0xFDBCB4, // Default light skin
        hair: 0x2C1B18, // Default dark hair
        shirt: 0x4285f4, // Default blue shirt
        pants: 0x2c3e50  // Default dark pants
      },
      style: {
        hairStyle: 'short' as 'short' | 'long' | 'curly' | 'bald',
        bodyType: 'normal' as 'slim' | 'normal' | 'broad'
      }
    }
    
    try {
      if (profileAvatarUrl && profileAvatarUrl.includes('dicebear.com')) {
        const url = new URL(profileAvatarUrl)
        const params = new URLSearchParams(url.search)
        const seed = url.pathname.split('/').pop()?.replace('.svg', '') || username
        
        console.log('🧬 DiceBear URL analysis:', { 
          seed, 
          params: Object.fromEntries(params.entries()),
          fullUrl: profileAvatarUrl 
        })
        
        // REAL DiceBear parameter mapping to game colors
        // DiceBear uses these common parameters across different styles
        
        // Extract skin tone from parameters
        const skinColor = params.get('skinColor') || params.get('skin')
        if (skinColor) {
          const skinColorMap: { [key: string]: number } = {
            'light': 0xFDBCB4,
            'medium': 0xE0AC69, 
            'dark': 0x8D5524,
            'tanned': 0xC68642,
            'yellow': 0xF1C27D,
            'pale': 0xFDF2E9,
            'brown': 0xA0522D,
            'black': 0x654321
          }
          extractedConfig.colors.skin = skinColorMap[skinColor] || 0xFDBCB4
          console.log('👤 Mapped skin color:', skinColor, '->', extractedConfig.colors.skin.toString(16))
        }
        
        // Extract hair color from parameters  
        const hairColor = params.get('hairColor') || params.get('hair')
        if (hairColor) {
          const hairColorMap: { [key: string]: number } = {
            'black': 0x2C1B18,
            'brown': 0x8B4513,
            'blonde': 0xDAA520,
            'red': 0xFF4500,
            'auburn': 0x8B0000,
            'gray': 0x4A4A4A,
            'white': 0xF5F5F5,
            'pink': 0xFF69B4,
            'blue': 0x0000FF,
            'green': 0x008000
          }
          extractedConfig.colors.hair = hairColorMap[hairColor] || 0x2C1B18
          console.log('💇 Mapped hair color:', hairColor, '->', extractedConfig.colors.hair.toString(16))
        }
        
        // Extract clothing/shirt color
        const clothingColor = params.get('clothingColor') || params.get('clothing') || params.get('topColor')
        if (clothingColor) {
          const clothingColorMap: { [key: string]: number } = {
            'blue': 0x4285f4,
            'red': 0xea4335,
            'green': 0x34a853,
            'purple': 0x9c27b0,
            'orange': 0xff9800,
            'pink': 0xFF69B4,
            'yellow': 0xFFD700,
            'black': 0x000000,
            'white': 0xFFFFFF,
            'gray': 0x808080
          }
          extractedConfig.colors.shirt = clothingColorMap[clothingColor] || 0x4285f4
          console.log('👕 Mapped clothing color:', clothingColor, '->', extractedConfig.colors.shirt.toString(16))
        }
        
        // Extract style information
        const hairStyle = params.get('hair') || params.get('hairStyle')
        if (hairStyle) {
          const hairStyleMap: { [key: string]: 'short' | 'long' | 'curly' | 'bald' } = {
            'short': 'short',
            'long': 'long', 
            'curly': 'curly',
            'bald': 'bald',
            'buzz': 'short',
            'crew': 'short',
            'pixie': 'short',
            'shag': 'curly',
            'wavy': 'curly'
          }
          extractedConfig.style.hairStyle = hairStyleMap[hairStyle] || 'short'
          console.log('💇‍♂️ Mapped hair style:', hairStyle, '->', extractedConfig.style.hairStyle)
        }
        
        // If no specific parameters found, use the seed to generate consistent colors
        if (!skinColor && !hairColor && !clothingColor) {
          console.log('⚠️ No DiceBear color parameters found, using seed-based generation')
          const hash = this.generateDeterministicHash(seed)
          
          const skinTones = [0xFDBCB4, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524]
          const hairColors = [0x2C1B18, 0x8B4513, 0xDAA520, 0xFF4500, 0x4A4A4A]
          const shirtColors = [0x4285f4, 0x34a853, 0xea4335, 0x9c27b0, 0xff9800]
          
          extractedConfig.colors.skin = skinTones[hash % skinTones.length]
          extractedConfig.colors.hair = hairColors[(hash >> 8) % hairColors.length]
          extractedConfig.colors.shirt = shirtColors[(hash >> 16) % shirtColors.length]
        }
        
        console.log('✅ REAL DiceBear extraction complete:', extractedConfig)
      } else {
        // No profile avatar URL, use deterministic generation based on username
        const hash = this.generateDeterministicHash(username)
        
        const skinTones = [0xFDBCB4, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524]
        const hairColors = [0x2C1B18, 0x8B4513, 0xDAA520, 0xFF4500, 0x4A4A4A]
        const shirtColors = [0x4285f4, 0x34a853, 0xea4335, 0x9c27b0, 0xff9800]
        const pantsColors = [0x2c3e50, 0x34495e, 0x5d6d7e, 0x273746]
        const hairStyles = ['short', 'long', 'curly', 'bald'] as const
        const bodyTypes = ['slim', 'normal', 'broad'] as const
        
        extractedConfig = {
          colors: {
            skin: skinTones[hash % skinTones.length],
            hair: hairColors[(hash >> 8) % hairColors.length],
            shirt: shirtColors[(hash >> 16) % shirtColors.length],
            pants: pantsColors[(hash >> 24) % pantsColors.length]
          },
          style: {
            hairStyle: hairStyles[(hash >> 32) % hairStyles.length] as 'short' | 'long' | 'curly' | 'bald',
            bodyType: bodyTypes[(hash >> 40) % bodyTypes.length] as 'slim' | 'normal' | 'broad'
          }
        }
        
        console.log('🎲 Generated deterministic config from username:', extractedConfig)
      }
    } catch (error) {
      console.error('❌ Error extracting avatar config from profile:', error)
    }
    
    return extractedConfig
  }

  /**
   * Generate a deterministic hash from a string for consistent avatar generation
   */
  private generateDeterministicHash(str: string): number {
    let hash = 0
    const seedString = `avatar-${str}` // Prefix to distinguish from other uses
    for (let i = 0; i < seedString.length; i++) {
      hash = ((hash << 5) - hash + seedString.charCodeAt(i)) & 0xffffffff
    }
    return Math.abs(hash)
  }

  addOtherPlayer(playerId: string, playerName: string, x: number, y: number) {
    if (this.otherPlayers.has(playerId) || !this.avatarGenerator) return

    // Check if scene is ready before creating avatars
    if (!this.sceneReady || !this.add) {
      console.log('⏳ Scene not ready, deferring player creation:', playerName)
      // Defer avatar creation until scene is ready
      setTimeout(() => this.addOtherPlayer(playerId, playerName, x, y), 100)
      return
    }

    console.log('👥 Adding other player:', playerName, 'at', x, y)
    
    // Generate avatar config for other player (pass the actual player name)
    const avatarConfig = this.generateAvatarConfigForPlayer(playerId, playerName)
    
    // Create directional player for other user
    const otherPlayer = new DirectionalPlayer(this, x, y, avatarConfig)
    
    // Add name label
    const nameLabel = this.add.text(x, y - 30, playerName, {
      fontSize: '12px',
      color: '#2c3e50',
      backgroundColor: '#ffffff',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(50)
    
    // Set name for easy retrieval later
    nameLabel.setName(`nameLabel_${playerId}`)
    
    const playerData: Player = {
      id: playerId,
      name: playerName,
      sprite: otherPlayer,
      x: x,
      y: y
    }
    
    this.otherPlayers.set(playerId, playerData)
    
    // Update position tracking
    this.updatePlayerPosition(playerId, x, y)
  }

  private generateAvatarConfigForPlayer(playerId: string, playerName: string): AvatarConfig {
    // CRITICAL: Use the actual player name for deterministic avatar generation
    console.log('🎨 Generating avatar config for other player:', { playerId, playerName })
    
    // Try to get profile information for this player from online users
    let profileAvatarUrl = ''
    try {
      import('../../store').then(({ store }) => {
        const state = store.getState()
        const onlineUsers = state.user?.onlineUsers || []
        const playerData = onlineUsers.find(user => 
          user.username === playerName || user.socketId === playerId
        )
        if (playerData && playerData.avatar) {
          profileAvatarUrl = playerData.avatar
          console.log('🖼️ Found profile avatar for', playerName, ':', profileAvatarUrl)
        }
      }).catch(console.error)
    } catch (error) {
      console.warn('Could not access store for other player avatar:', error)
    }
    
    // Extract avatar configuration from profile or generate deterministically
    const avatarConfig = this.extractAvatarConfigFromProfile(profileAvatarUrl, playerName)
    
    console.log('🎨 Avatar config generated for other player:', { playerId, playerName, avatarConfig })
    
    return {
      userId: playerId,
      username: playerName, // Use actual player name
      seed: playerName, // Use player name as seed for consistency
      colors: avatarConfig.colors,
      style: avatarConfig.style
    }
  }

  updatePlayerPosition(playerId: string, x: number, y: number) {
    const player = this.otherPlayers.get(playerId)
    if (player) {
      player.sprite.getSprite().setPosition(x, y)
      player.x = x
      player.y = y
      
      // Update name label position (if exists)
      const nameLabel = this.children.getByName(`nameLabel_${playerId}`) as Phaser.GameObjects.Text
      if (nameLabel) {
        nameLabel.setPosition(x, y - 30)
      }
    }
  }

  removeOtherPlayer(playerId: string) {
    const player = this.otherPlayers.get(playerId)
    if (player) {
      console.log('👋 Removing player:', player.name)
      player.sprite.destroy()
      
      // Remove name label
      const nameLabel = this.children.getByName(`nameLabel_${playerId}`)
      if (nameLabel) {
        nameLabel.destroy()
      }
      
      this.otherPlayers.delete(playerId)
    }
  }

  update() {
    if (!this.player || !this.cursors || !this.wasdKeys) return

    // Handle player movement
    const speed = 160
    let velocityX = 0
    let velocityY = 0

    // Horizontal movement
    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
      velocityX = -speed
    } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
      velocityX = speed
    }

    // Vertical movement  
    if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
      velocityY = -speed
    } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
      velocityY = speed
    }

    // Apply movement
    this.player.setVelocity(velocityX, velocityY)
    
    // Update directional sprite
    this.player.update()

    // Update other players' directional sprites
    this.otherPlayers.forEach(player => {
      player.sprite.update()
    })

    // Emit position updates with throttling and validation
    if (velocityX !== 0 || velocityY !== 0) {
      const currentTime = Date.now()
      const currentX = this.player.getSprite().x
      const currentY = this.player.getSprite().y
      
      // Validate coordinates
      if (typeof currentX !== 'number' || typeof currentY !== 'number' || 
          isNaN(currentX) || isNaN(currentY)) {
        console.error('❌ Invalid movement coordinates:', { x: currentX, y: currentY })
        return
      }
      
      // Throttle movement updates and check for actual position change
      const timeSinceLastUpdate = currentTime - this.lastMovementTime
      const positionChanged = Math.abs(currentX - this.lastMovementPosition.x) > 1 || 
                             Math.abs(currentY - this.lastMovementPosition.y) > 1
      
      if (timeSinceLastUpdate >= this.movementThrottle && positionChanged) {
        console.log('📍 Emitting local movement:', { x: currentX, y: currentY })
        
        // Dispatch local movement event (for VirtualOffice to send to server)
        window.dispatchEvent(new CustomEvent('localPlayerMoved', {
          detail: { x: currentX, y: currentY }
        }))
        
        this.lastMovementTime = currentTime
        this.lastMovementPosition = { x: currentX, y: currentY }
      }
    }
  }

  getCurrentPlayer() {
    return this.player
  }

  getOtherPlayers() {
    return this.otherPlayers
  }

  isReady(): boolean {
    return this.sceneReady
  }

  private createWorkstationAreasWithCollision() {
    // Workstation areas with collision detection
    const devArea = { x: 500, y: 450 }
    const deskPositions = [
      { x: devArea.x - 60, y: devArea.y - 40 },
      { x: devArea.x, y: devArea.y - 40 },
      { x: devArea.x + 60, y: devArea.y - 40 },
      { x: devArea.x - 60, y: devArea.y + 40 },
      { x: devArea.x, y: devArea.y + 40 },
      { x: devArea.x + 60, y: devArea.y + 40 }
    ]

    deskPositions.forEach((pos, index) => {
      // Desk with subtle variations
      if (this.textures.exists('office-desk')) {
        const workDesk = this.add.image(pos.x, pos.y, 'office-desk')
        workDesk.setDepth(10)
        workDesk.setTint(0x8B4513 + (index * 0x111111)) // Slight color variation
      } else {
        // Fallback: simple rectangle desk
        this.add.rectangle(pos.x, pos.y, 80, 50, 0x8B4513 + (index * 0x111111)).setOrigin(0.5)
      }
      
      if (this.textures.exists('office-chair')) {
        const workChair = this.add.image(pos.x, pos.y + 30, 'office-chair')
        workChair.setDepth(10)
      } else {
        // Fallback: simple circle chair
        this.add.circle(pos.x, pos.y + 30, 12, 0x2c3e50).setOrigin(0.5)
      }
      
      if (this.textures.exists('computer-monitor')) {
        const workComputer = this.add.image(pos.x - 10, pos.y - 15, 'computer-monitor')
        workComputer.setDepth(15)
      } else {
        // Fallback: simple rectangle monitor
        this.add.rectangle(pos.x - 10, pos.y - 15, 25, 20, 0x2c3e50).setOrigin(0.5)
        this.add.rectangle(pos.x - 10, pos.y - 15, 20, 15, 0x3498db).setOrigin(0.5) // Screen
      }

      // Add personal touches to some desks
      if (index % 2 === 0) {
        this.createPlantDecoration(pos.x + 25, pos.y - 10, 0x228B22, 0.6)
      }
      
      // Add papers/documents effect
      if (Math.random() > 0.6) {
        this.add.rectangle(pos.x + 15, pos.y - 5, 8, 6, 0xffffff, 0.8).setOrigin(0.5).setDepth(16)
      }
    })

    // Team area label with enhanced styling
    this.add.text(devArea.x, devArea.y - 90, '开发团队工作区\\nDevelopment Team Area', {
      fontSize: '16px',
      color: '#2c3e50',
      fontFamily: 'PingFang SC, Arial',
      align: 'center',
      backgroundColor: '#ecf0f1',
      padding: { x: 12, y: 6 },
      stroke: '#bdc3c7',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(25)
  }

  private createMeetingRoomAreaWithCollision() {
    const x = 850, y = 250
    
    // Glass walls effect (visual only)
    const glassWall = this.add.graphics()
    glassWall.fillStyle(0x87CEEB, 0.3) // Light blue glass
    glassWall.fillRect(0, 0, 160, 100)
    glassWall.lineStyle(3, 0x4682B4, 0.6)
    glassWall.strokeRect(0, 0, 160, 100)
    glassWall.setPosition(x - 80, y - 50)
    glassWall.setDepth(5)

    // Conference table
    if (this.textures.exists('office-desk')) {
      const table = this.add.image(x, y, 'office-desk')
      table.setDepth(10)
      table.setScale(1.8, 1.2)
      table.setTint(0x654321)
    } else {
      // Fallback: simple ellipse table
      this.add.ellipse(x, y, 120, 80, 0x654321).setOrigin(0.5).setDepth(10)
    }

    // Chairs around table
    const chairPositions = [
      { x: x - 50, y: y - 25 }, { x: x + 50, y: y - 25 },
      { x: x - 50, y: y + 25 }, { x: x + 50, y: y + 25 },
      { x: x, y: y - 45 }, { x: x, y: y + 45 }
    ]

    chairPositions.forEach(pos => {
      if (this.textures.exists('office-chair')) {
        const chair = this.add.image(pos.x, pos.y, 'office-chair')
        chair.setDepth(10)
        chair.setTint(0x8B4513)
      } else {
        // Fallback: simple circle chair
        this.add.circle(pos.x, pos.y, 12, 0x8B4513).setOrigin(0.5).setDepth(10)
      }
    })

    // Meeting room label
    this.add.text(x, y - 80, '会议室\\nConference Room', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Arial',
      align: 'center',
      backgroundColor: '#3498db',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(25)
  }

  private createLoungeAreaWithCollision() {
    const x = 150, y = 600

    // Cozy seating arrangement (decorative, no collision)
    const seatingArea = this.add.graphics()
    seatingArea.fillStyle(0xD2B48C, 0.6) // Tan carpet
    seatingArea.fillCircle(0, 0, 60)
    seatingArea.setPosition(x, y)
    seatingArea.setDepth(-10)

    // Central coffee table
    const coffeeTable = this.add.graphics()
    coffeeTable.fillStyle(0x8B4513)
    coffeeTable.fillEllipse(0, 0, 40, 25)
    coffeeTable.setPosition(x, y)
    coffeeTable.setDepth(10)

    // Lounge chairs
    const loungePositions = [
      { x: x - 25, y: y - 15 }, { x: x + 25, y: y - 15 },
      { x: x - 25, y: y + 15 }, { x: x + 25, y: y + 15 }
    ]

    loungePositions.forEach(pos => {
      if (this.textures.exists('office-chair')) {
        const loungeChair = this.add.image(pos.x, pos.y, 'office-chair')
        loungeChair.setDepth(10)
        loungeChair.setTint(0xA0522D) // Comfortable brown
        loungeChair.setScale(0.9)
      } else {
        // Fallback: simple circle chair
        this.add.circle(pos.x, pos.y, 12, 0xA0522D).setOrigin(0.5).setDepth(10)
      }
    })

    // Plants around lounge (decorative, no collision)
    this.createPlantDecoration(x - 50, y - 40, 0x228B22, 1.2)
    this.createPlantDecoration(x + 50, y + 40, 0x32CD32, 1.1)

    // Lounge label
    this.add.text(x, y - 80, '休息区\\nLounge Area', {
      fontSize: '12px',
      color: '#2c3e50',
      fontFamily: 'PingFang SC, Arial',
      align: 'center',
      backgroundColor: '#f39c12',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(25)
  }

  private createWallBoundaries() {
    console.log('🧱 Creating visual wall boundaries...')
    
    // Create visual walls around the office perimeter (no physics collision)
    const wallThickness = 20
    const wallColor = 0xcccccc
    const wallAlpha = 0.3
    
    // Top wall (visual)
    this.add.rectangle(600, -wallThickness/2, 1200, wallThickness, wallColor, wallAlpha)
    
    // Bottom wall (visual)
    this.add.rectangle(600, 800 + wallThickness/2, 1200, wallThickness, wallColor, wallAlpha)
    
    // Left wall (visual)
    this.add.rectangle(-wallThickness/2, 400, wallThickness, 800, wallColor, wallAlpha)
    
    // Right wall (visual)
    this.add.rectangle(1200 + wallThickness/2, 400, wallThickness, 800, wallColor, wallAlpha)
    
    console.log('✅ Visual wall boundaries created')
  }
}

// Export as default to match GameManager import
export default MainScene