import Phaser from 'phaser'
import { socketService } from '../../services/socketService'
import { themeManager, SeasonalTheme } from '../../services/themeService'

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: any
  private otherPlayers!: Phaser.GameObjects.Group
  private lastEmittedPosition = { x: 0, y: 0 }
  private emitThreshold = 10 // pixels
  private userPositions = new Map<string, { x: number; y: number }>()
  private currentUserPosition = { x: 400, y: 300 }
  private currentTheme: SeasonalTheme

  constructor() {
    super({ key: 'MainScene' })
    this.currentTheme = themeManager.getCurrentTheme()
  }

  preload() {
    console.log('🔄 MainScene preload started...')
    
    // Create beautiful textured sprites for immersive environment
    this.createTextureSprites()
    
    console.log('✅ MainScene preload completed')
  }

  private createEnvironmentalSprites() {
    // Create simple environmental effects
    const dustParticle = this.add.graphics()
    dustParticle.fillStyle(0xffffff, 0.3)
    dustParticle.fillCircle(2, 2, 1)
    dustParticle.generateTexture('dust-particle', 4, 4)
    dustParticle.destroy()
  }

  create() {
    console.log('🏗️ MainScene create started...')
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, 1200, 800)

    // Create immersive 3D-style office environment
    this.createImmersiveEnvironment()
    
    // Create some office furniture as placeholders
    this.createOfficeFurniture()

    // Create player - check if sprite exists, fallback to simple rectangle if needed
    try {
      this.player = this.physics.add.sprite(400, 300, 'player-avatar')
      this.player.setCollideWorldBounds(true)
      this.player.setDisplaySize(32, 40)
      console.log('✅ Player avatar created successfully')
    } catch (error) {
      console.warn('⚠️ Player avatar failed, creating fallback:', error)
      // Fallback: create simple colored rectangle
      this.add.graphics()
        .fillStyle(0x3498db)
        .fillRect(0, 0, 32, 40)
        .generateTexture('player-fallback', 32, 40)
      
      this.player = this.physics.add.sprite(400, 300, 'player-fallback')
      this.player.setCollideWorldBounds(true)
      this.player.setDisplaySize(32, 40)
    }

    // Create group for other players
    this.otherPlayers = this.add.group()

    // Camera follows player
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setZoom(1)

    // Input handling
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D')

    // Welcome message
    this.add.text(600, 100, '欢迎来到 Altogether 虚拟办公室!', {
      fontSize: '24px',
      color: '#2c3e50',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.add.text(600, 140, '使用方向键或 WASD 移动', {
      fontSize: '16px',
      color: '#7f8c8d',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Setup socket event listeners for other players
    this.setupSocketListeners()
    
    console.log('✅ MainScene create completed')
    
    // Emit ready event
    this.events.emit('ready')
  }

  private setupSocketListeners() {
    // Listen for other player movements
    window.addEventListener('playerMoved', (event: any) => {
      const { userId, position } = event.detail
      this.updateOtherPlayer(userId, position)
    })
    
    // Listen for user disconnections
    window.addEventListener('userLeft', (event: any) => {
      const { userId } = event.detail
      this.removeOtherPlayer(userId)
      // Also remove from position tracking
      this.userPositions.delete(userId)
    })
  }

  private updateOtherPlayer(userId: string, position: { x: number; y: number }) {
    // Update position tracking
    this.userPositions.set(userId, position)
    
    // Dispatch position update for voice chat
    window.dispatchEvent(new CustomEvent('userPositionUpdate', { 
      detail: { 
        userPositions: this.userPositions,
        currentUserPosition: this.currentUserPosition
      } 
    }))
    
    // Find existing player or create new one
    let otherPlayer = this.otherPlayers.children.entries.find(
      (player: any) => player.userId === userId
    ) as any

    if (!otherPlayer) {
      // Create new other player with random avatar variant
      const avatarVariants = ['other-player-1', 'other-player-2', 'other-player-3']
      const randomAvatar = avatarVariants[Math.floor(Math.random() * avatarVariants.length)]
      
      try {
        otherPlayer = this.physics.add.sprite(position.x, position.y, randomAvatar) as any
        otherPlayer.setDisplaySize(32, 40)
        otherPlayer.userId = userId
        console.log(`✅ Other player avatar created: ${randomAvatar}`)
      } catch (error) {
        console.warn('⚠️ Other player avatar failed, creating fallback:', error)
        // Fallback
        otherPlayer = this.physics.add.sprite(position.x, position.y, 'player-fallback') as any
        if (!this.textures.exists('player-fallback')) {
          this.add.graphics()
            .fillStyle(0x27ae60)
            .fillRect(0, 0, 32, 40)
            .generateTexture('other-player-fallback', 32, 40)
          otherPlayer = this.physics.add.sprite(position.x, position.y, 'other-player-fallback') as any
        }
        otherPlayer.setDisplaySize(32, 40)
        otherPlayer.userId = userId
      }
      
      // Add username label
      const nameText = this.add.text(position.x, position.y - 20, `用户-${userId.slice(0, 6)}`, {
        fontSize: '12px',
        color: '#2c3e50',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      otherPlayer.nameText = nameText

      this.otherPlayers.add(otherPlayer)
    } else {
      // Update existing player position smoothly
      this.tweens.add({
        targets: otherPlayer,
        x: position.x,
        y: position.y,
        duration: 100,
        ease: 'Linear'
      })

      // Update name text position
      if (otherPlayer.nameText) {
        this.tweens.add({
          targets: otherPlayer.nameText,
          x: position.x,
          y: position.y - 20,
          duration: 100,
          ease: 'Linear'
        })
      }
    }
  }

  private removeOtherPlayer(userId: string) {
    const otherPlayer = this.otherPlayers.children.entries.find(
      (player: any) => player.userId === userId
    ) as any

    if (otherPlayer) {
      if (otherPlayer.nameText) {
        otherPlayer.nameText.destroy()
      }
      otherPlayer.destroy()
    }
  }

  update() {
    // Player movement
    const speed = 200

    // Reset velocity
    this.player.setVelocity(0)

    let moved = false

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      this.player.setVelocityX(-speed)
      moved = true
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      this.player.setVelocityX(speed)
      moved = true
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      this.player.setVelocityY(-speed)
      moved = true
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      this.player.setVelocityY(speed)
      moved = true
    }

    // Emit position to server if moved significantly
    if (moved) {
      const currentPos = { x: this.player.x, y: this.player.y }
      const distance = Phaser.Math.Distance.Between(
        currentPos.x, currentPos.y,
        this.lastEmittedPosition.x, this.lastEmittedPosition.y
      )

      if (distance > this.emitThreshold) {
        socketService.sendPlayerMove(currentPos)
        this.lastEmittedPosition = { ...currentPos }
      }

      // Update current user position for spatial audio
      this.currentUserPosition = currentPos
      
      // Dispatch position update for voice chat every frame when moving
      window.dispatchEvent(new CustomEvent('userPositionUpdate', { 
        detail: { 
          userPositions: this.userPositions,
          currentUserPosition: this.currentUserPosition
        } 
      }))
    }
  }

  private createOfficeFurniture() {
    // This method is now replaced by createImmersiveEnvironment()
    // Keeping for compatibility, but all logic moved to new system
  }

  private createChineseOfficeLayout() {
    // Office floor with marble-like pattern
    this.createFloorTiles()
    
    // Reception area with Chinese elements
    this.createReceptionArea()
    
    // Meeting rooms with different styles
    this.createMeetingRooms()
    
    // Workstation clusters
    this.createWorkstationClusters()
    
    // Tea corner (very Chinese!)
    this.createTeaCorner()
    
    // Feng shui garden corner
    this.createFengShuiGarden()
    
    // Storage and utility areas
    this.createUtilityAreas()
    
    // Decorative elements
    this.createDecorativeElements()
    
    // Seasonal decorations based on current theme
    this.createSeasonalDecorations()
  }

  private createFloorTiles() {
    // Create sophisticated floor pattern
    const tileSize = 64
    const floorColor = 0xf5f5f0 // Light cream color
    const accentColor = 0xe8e8e0 // Slightly darker accent
    
    for (let x = 0; x < 1200; x += tileSize) {
      for (let y = 0; y < 800; y += tileSize) {
        const isAccent = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 4 === 0
        const color = isAccent ? accentColor : floorColor
        
        const tile = this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, color)
        tile.setStrokeStyle(1, 0xdddddd, 0.3)
      }
    }
  }

  private createReceptionArea() {
    // Reception desk with Chinese design
    const deskX = 150
    const deskY = 150
    
    // Main reception desk (darker wood color)
    const receptionDesk = this.add.rectangle(deskX, deskY, 200, 80, 0x8B4513).setOrigin(0.5)
    receptionDesk.setStrokeStyle(3, 0x654321)
    
    // Reception desk details
    this.add.rectangle(deskX, deskY - 15, 180, 10, 0xA0522D).setOrigin(0.5) // Top trim
    this.add.rectangle(deskX, deskY + 25, 160, 15, 0x654321).setOrigin(0.5) // Bottom detail
    
    // Welcome sign with Chinese characters
    this.add.text(deskX, deskY - 50, '欢迎\nWelcome', {
      fontSize: '14px',
      color: '#8B4513',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
    
    // Reception area plants
    this.add.circle(deskX - 120, deskY, 25, 0x228B22).setOrigin(0.5) // Plant pot
    this.add.circle(deskX + 120, deskY, 25, 0x228B22).setOrigin(0.5) // Plant pot
  }

  private createMeetingRooms() {
    // Large executive meeting room
    const execRoomX = 300
    const execRoomY = 250
    
    this.add.rectangle(execRoomX, execRoomY, 200, 120, 0x2F4F4F).setOrigin(0.5)
    this.add.rectangle(execRoomX, execRoomY, 180, 100, 0x708090).setOrigin(0.5) // Inner space
    
    // Conference table
    this.add.ellipse(execRoomX, execRoomY, 120, 60, 0x8B4513).setOrigin(0.5)
    
    // Executive meeting room label
    this.add.text(execRoomX, execRoomY - 70, '行政会议室\nExecutive Room', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Small discussion room
    const smallRoomX = 600
    const smallRoomY = 200
    
    this.add.rectangle(smallRoomX, smallRoomY, 120, 100, 0x4682B4).setOrigin(0.5)
    this.add.rectangle(smallRoomX, smallRoomY, 100, 80, 0x87CEEB).setOrigin(0.5)
    
    // Small round table
    this.add.circle(smallRoomX, smallRoomY, 30, 0x8B4513).setOrigin(0.5)
    
    this.add.text(smallRoomX, smallRoomY - 60, '讨论室\nDiscussion', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Innovation/brainstorming room
    const innovationRoomX = 900
    const innovationRoomY = 180
    
    this.add.rectangle(innovationRoomX, innovationRoomY, 150, 100, 0x9932CC).setOrigin(0.5)
    this.add.rectangle(innovationRoomX, innovationRoomY, 130, 80, 0xDDA0DD).setOrigin(0.5)
    
    // Whiteboard representation
    this.add.rectangle(innovationRoomX - 40, innovationRoomY - 20, 60, 40, 0xFFFFFF).setOrigin(0.5)
    this.add.rectangle(innovationRoomX - 40, innovationRoomY - 20, 58, 38, 0xF0F0F0).setOrigin(0.5)
    
    this.add.text(innovationRoomX, innovationRoomY - 60, '创新室\nInnovation Lab', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  private createWorkstationClusters() {
    // Modern workstation cluster 1
    const cluster1X = 400
    const cluster1Y = 450
    
    for (let i = 0; i < 6; i++) {
      const offsetX = (i % 3) * 80 - 80
      const offsetY = Math.floor(i / 3) * 70 - 35
      
      // Desk
      this.add.rectangle(cluster1X + offsetX, cluster1Y + offsetY, 70, 45, 0xDEB887).setOrigin(0.5)
      this.add.rectangle(cluster1X + offsetX, cluster1Y + offsetY, 68, 43, 0xF5DEB3).setOrigin(0.5)
      
      // Computer monitor
      this.add.rectangle(cluster1X + offsetX, cluster1Y + offsetY - 10, 25, 15, 0x2F2F2F).setOrigin(0.5)
      this.add.rectangle(cluster1X + offsetX, cluster1Y + offsetY - 10, 23, 13, 0x4169E1).setOrigin(0.5)
      
      // Chair
      this.add.circle(cluster1X + offsetX, cluster1Y + offsetY + 35, 15, 0x8B4513).setOrigin(0.5)
    }
    
    this.add.text(cluster1X, cluster1Y - 80, '开发团队\nDev Team', {
      fontSize: '12px',
      color: '#4169E1',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Traditional Chinese workstation cluster
    const cluster2X = 750
    const cluster2Y = 450
    
    for (let i = 0; i < 4; i++) {
      const offsetX = (i % 2) * 100 - 50
      const offsetY = Math.floor(i / 2) * 80 - 40
      
      // Traditional style desk (darker wood)
      this.add.rectangle(cluster2X + offsetX, cluster2Y + offsetY, 80, 50, 0x8B4513).setOrigin(0.5)
      this.add.rectangle(cluster2X + offsetX, cluster2Y + offsetY - 5, 75, 8, 0xA0522D).setOrigin(0.5)
      
      // Computer
      this.add.rectangle(cluster2X + offsetX, cluster2Y + offsetY - 8, 30, 18, 0x2F2F2F).setOrigin(0.5)
      
      // Traditional chair
      this.add.rectangle(cluster2X + offsetX, cluster2Y + offsetY + 40, 20, 20, 0x654321).setOrigin(0.5)
    }
    
    this.add.text(cluster2X, cluster2Y - 80, '运营团队\nOperations', {
      fontSize: '12px',
      color: '#8B4513',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  private createTeaCorner() {
    const teaX = 150
    const teaY = 600
    
    // Tea corner base
    this.add.rectangle(teaX, teaY, 120, 100, 0x8FBC8F).setOrigin(0.5)
    this.add.rectangle(teaX, teaY, 100, 80, 0x98FB98).setOrigin(0.5)
    
    // Tea table
    this.add.circle(teaX, teaY, 30, 0x8B4513).setOrigin(0.5)
    
    // Tea set (small circles representing cups and teapot)
    this.add.circle(teaX - 10, teaY - 8, 4, 0xFFFFFF).setOrigin(0.5) // Cup 1
    this.add.circle(teaX + 10, teaY - 8, 4, 0xFFFFFF).setOrigin(0.5) // Cup 2
    this.add.circle(teaX - 10, teaY + 8, 4, 0xFFFFFF).setOrigin(0.5) // Cup 3
    this.add.circle(teaX + 8, teaY + 5, 6, 0x8B4513).setOrigin(0.5) // Teapot
    
    // Bamboo plants around tea corner
    this.add.rectangle(teaX - 40, teaY - 30, 8, 40, 0x228B22).setOrigin(0.5)
    this.add.rectangle(teaX + 40, teaY + 20, 8, 35, 0x228B22).setOrigin(0.5)
    
    this.add.text(teaX, teaY - 70, '茶水间\nTea Corner', {
      fontSize: '12px',
      color: '#2F4F4F',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  private createFengShuiGarden() {
    const gardenX = 1000
    const gardenY = 550
    
    // Garden base
    this.add.rectangle(gardenX, gardenY, 150, 120, 0x9ACD32).setOrigin(0.5)
    this.add.rectangle(gardenX, gardenY, 130, 100, 0xADFF2F).setOrigin(0.5)
    
    // Zen stones arrangement
    this.add.circle(gardenX - 30, gardenY - 20, 12, 0x708090).setOrigin(0.5)
    this.add.circle(gardenX, gardenY, 15, 0x2F4F4F).setOrigin(0.5)
    this.add.circle(gardenX + 25, gardenY + 15, 10, 0x696969).setOrigin(0.5)
    
    // Small pond
    this.add.ellipse(gardenX - 20, gardenY + 25, 40, 25, 0x4682B4).setOrigin(0.5)
    this.add.ellipse(gardenX - 20, gardenY + 25, 35, 20, 0x87CEEB).setOrigin(0.5)
    
    // Bamboo features
    this.add.rectangle(gardenX + 40, gardenY - 35, 6, 35, 0x228B22).setOrigin(0.5)
    this.add.rectangle(gardenX + 50, gardenY - 30, 6, 40, 0x228B22).setOrigin(0.5)
    this.add.rectangle(gardenX + 35, gardenY + 30, 6, 30, 0x228B22).setOrigin(0.5)
    
    this.add.text(gardenX, gardenY - 80, '禅意花园\nZen Garden', {
      fontSize: '11px',
      color: '#2F4F4F',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  private createUtilityAreas() {
    // Storage room
    const storageX = 950
    const storageY = 350
    
    this.add.rectangle(storageX, storageY, 80, 60, 0x708090).setOrigin(0.5)
    this.add.rectangle(storageX, storageY, 70, 50, 0x778899).setOrigin(0.5)
    
    // Storage shelves
    this.add.rectangle(storageX - 20, storageY, 15, 40, 0x8B4513).setOrigin(0.5)
    this.add.rectangle(storageX + 15, storageY, 15, 35, 0x8B4513).setOrigin(0.5)
    
    this.add.text(storageX, storageY - 40, '储物间\nStorage', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Printer area
    const printerX = 200
    const printerY = 350
    
    this.add.rectangle(printerX, printerY, 60, 40, 0xD3D3D3).setOrigin(0.5)
    this.add.rectangle(printerX, printerY, 50, 30, 0xE6E6FA).setOrigin(0.5)
    
    // Printer representation
    this.add.rectangle(printerX, printerY, 35, 20, 0x2F2F2F).setOrigin(0.5)
    this.add.rectangle(printerX, printerY - 5, 30, 8, 0x4169E1).setOrigin(0.5)
    
    this.add.text(printerX, printerY - 30, '打印区\nPrint Area', {
      fontSize: '9px',
      color: '#2F2F2F',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  private createDecorativeElements() {
    // Chinese calligraphy artwork on walls
    this.add.rectangle(100, 400, 15, 60, 0x8B4513).setOrigin(0.5)
    this.add.rectangle(100, 400, 12, 55, 0xF5DEB3).setOrigin(0.5)
    this.add.text(100, 400, '和\n谐\n共\n进', {
      fontSize: '10px',
      color: '#8B4513',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Company values wall
    this.add.rectangle(600, 100, 200, 30, 0x4682B4).setOrigin(0.5)
    this.add.text(600, 100, '团结 · 创新 · 卓越 · 共赢', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Feng shui mirror (octagonal)
    this.add.polygon(1100, 200, [
      [-15, -15], [15, -15], [25, -5], [25, 5], 
      [15, 15], [-15, 15], [-25, 5], [-25, -5]
    ], 0xFFD700).setOrigin(0.5)
    
    this.add.polygon(1100, 200, [
      [-12, -12], [12, -12], [20, -3], [20, 3], 
      [12, 12], [-12, 12], [-20, 3], [-20, -3]
    ], 0xE6E6FA).setOrigin(0.5)

    // Traditional Chinese red lanterns
    this.add.ellipse(400, 120, 25, 35, 0xDC143C).setOrigin(0.5)
    this.add.ellipse(400, 120, 20, 30, 0xFF6347).setOrigin(0.5)
    this.add.rectangle(400, 105, 3, 15, 0x8B4513).setOrigin(0.5) // Lantern string

    this.add.ellipse(800, 120, 25, 35, 0xDC143C).setOrigin(0.5)
    this.add.ellipse(800, 120, 20, 30, 0xFF6347).setOrigin(0.5)
    this.add.rectangle(800, 105, 3, 15, 0x8B4513).setOrigin(0.5)

    // Prosperity plants in corners
    this.add.circle(80, 720, 20, 0x228B22).setOrigin(0.5)
    this.add.circle(1120, 720, 20, 0x228B22).setOrigin(0.5)
    this.add.circle(80, 80, 18, 0x228B22).setOrigin(0.5)
    this.add.circle(1120, 80, 18, 0x228B22).setOrigin(0.5)
  }

  private createSeasonalDecorations() {
    const decorations = themeManager.getOfficeDecorations()
    
    decorations.forEach(decoration => {
      switch (decoration.type) {
        case 'lantern':
          decoration.positions.forEach(pos => {
            this.createLantern(pos.x, pos.y, decoration.color)
          })
          break
          
        case 'plumBlossom':
          decoration.positions.forEach(pos => {
            this.createPlumBlossom(pos.x, pos.y)
          })
          break
          
        case 'bamboo':
          decoration.positions.forEach(pos => {
            this.createBambooDecoration(pos.x, pos.y)
          })
          break
          
        case 'lotus':
          decoration.positions.forEach(pos => {
            this.createLotusDecoration(pos.x, pos.y)
          })
          break
          
        case 'maple':
          decoration.positions.forEach(pos => {
            this.createMapleLeaves(pos.x, pos.y)
          })
          break
          
        case 'snow':
          this.createSnowEffect()
          break
      }
    })

    // Add festival-specific elements
    if (this.currentTheme.festival) {
      this.createFestivalBanner()
    }
  }

  private createLantern(x: number, y: number, color: string) {
    // Enhanced lantern design with theme colors
    const lanternColor = parseInt(color.replace('#', ''), 16)
    
    this.add.ellipse(x, y, 30, 40, lanternColor).setOrigin(0.5)
    this.add.ellipse(x, y, 25, 35, 0xFF6347).setOrigin(0.5) // Inner glow
    this.add.rectangle(x, y - 25, 4, 20, 0x8B4513).setOrigin(0.5) // Lantern string
    
    // Lantern tassels
    this.add.rectangle(x - 8, y + 25, 2, 15, lanternColor).setOrigin(0.5)
    this.add.rectangle(x + 8, y + 25, 2, 15, lanternColor).setOrigin(0.5)
    this.add.rectangle(x, y + 25, 2, 15, lanternColor).setOrigin(0.5)
    
    // Chinese character on lantern
    this.add.text(x, y, '福', {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
  }

  private createPlumBlossom(x: number, y: number) {
    // Plum blossom branches and flowers
    const branchColor = 0x8B4513
    const flowerColor = 0xFF69B4
    
    // Branch
    this.add.rectangle(x, y, 3, 40, branchColor).setOrigin(0.5)
    this.add.rectangle(x + 15, y - 10, 25, 2, branchColor).setOrigin(0.5)
    this.add.rectangle(x - 12, y + 8, 20, 2, branchColor).setOrigin(0.5)
    
    // Flowers
    for (let i = 0; i < 5; i++) {
      const offsetX = (i - 2) * 8
      const offsetY = (i % 2) * 6 - 3
      this.add.circle(x + offsetX, y + offsetY, 3, flowerColor).setOrigin(0.5)
      this.add.circle(x + offsetX, y + offsetY, 2, 0xFFB6C1).setOrigin(0.5) // Inner petal
    }
  }

  private createBambooDecoration(x: number, y: number) {
    // Enhanced bamboo with nodes
    const bambooColor = 0x228B22
    const nodeColor = 0x32CD32
    
    // Main bamboo stem
    this.add.rectangle(x, y, 8, 60, bambooColor).setOrigin(0.5)
    
    // Bamboo nodes
    for (let i = 0; i < 4; i++) {
      const nodeY = y - 25 + i * 15
      this.add.rectangle(x, nodeY, 10, 3, nodeColor).setOrigin(0.5)
    }
    
    // Bamboo leaves
    this.add.ellipse(x - 6, y - 20, 12, 20, bambooColor).setOrigin(0.5).setRotation(-0.3)
    this.add.ellipse(x + 8, y - 10, 10, 16, bambooColor).setOrigin(0.5).setRotation(0.4)
    this.add.ellipse(x - 4, y + 5, 14, 18, bambooColor).setOrigin(0.5).setRotation(-0.2)
  }

  private createLotusDecoration(x: number, y: number) {
    // Lotus flower in the zen garden pond
    const lotusColor = 0xFFB6C1
    const centerColor = 0xFFD700
    
    // Lotus petals (multiple layers)
    for (let layer = 0; layer < 3; layer++) {
      const radius = 15 - layer * 3
      const petalCount = 8 - layer
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + layer * 0.2
        const petalX = x + Math.cos(angle) * radius
        const petalY = y + Math.sin(angle) * radius
        
        this.add.ellipse(petalX, petalY, 8, 4, lotusColor).setOrigin(0.5).setRotation(angle)
      }
    }
    
    // Lotus center
    this.add.circle(x, y, 4, centerColor).setOrigin(0.5)
  }

  private createMapleLeaves(x: number, y: number) {
    // Scattered maple leaves
    const colors = [0xFF4500, 0xFF6347, 0xCD853F, 0xD2691E]
    
    for (let i = 0; i < 8; i++) {
      const leafX = x + (Math.random() - 0.5) * 60
      const leafY = y + (Math.random() - 0.5) * 40
      const color = colors[Math.floor(Math.random() * colors.length)]
      const rotation = Math.random() * Math.PI * 2
      
      // Maple leaf shape (simplified)
      this.add.polygon(leafX, leafY, [
        [-6, -8], [0, -12], [6, -8], [8, -2], [4, 0],
        [6, 4], [2, 8], [0, 6], [-2, 8], [-6, 4],
        [-4, 0], [-8, -2]
      ], color).setOrigin(0.5).setRotation(rotation)
    }
  }

  private createSnowEffect() {
    // Create subtle snow particles (winter theme)
    for (let i = 0; i < 20; i++) {
      const snowX = Math.random() * 1200
      const snowY = Math.random() * 800
      
      const snowflake = this.add.circle(snowX, snowY, 2, 0xFFFFFF).setOrigin(0.5)
      snowflake.setAlpha(0.7)
      
      // Add gentle floating animation
      this.tweens.add({
        targets: snowflake,
        y: snowY + 10,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      })
    }
  }

  private createFestivalBanner() {
    if (!this.currentTheme.festival) return
    
    const bannerX = 600
    const bannerY = 60
    
    // Festival banner background
    this.add.rectangle(bannerX, bannerY, 300, 40, parseInt(this.currentTheme.colors.primary.replace('#', ''), 16)).setOrigin(0.5)
    this.add.rectangle(bannerX, bannerY, 290, 30, parseInt(this.currentTheme.colors.secondary.replace('#', ''), 16)).setOrigin(0.5)
    
    // Festival name
    this.add.text(bannerX, bannerY, `🎉 ${this.currentTheme.festival.name} 快乐！🎉`, {
      fontSize: '16px',
      color: this.currentTheme.colors.text,
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
  }

  // ==================== NEW IMMERSIVE GRAPHICS SYSTEM ====================

  private createTextureSprites() {
    console.log('🎨 Creating texture sprites...')
    try {
      // Create beautiful textured sprites for immersive environment
      this.createFloorTextures()
      this.createAvatarSprites()
      this.createFurnitureSprites()
      this.createEnvironmentalSprites()
      console.log('✅ All texture sprites created successfully')
    } catch (error) {
      console.error('❌ Error creating texture sprites:', error)
    }
  }

  private createFloorTextures() {
    // Create marble floor texture
    const marbleFloor = this.add.graphics()
    marbleFloor.fillStyle(0xf5f5f0) // Base cream color
    marbleFloor.fillRect(0, 0, 64, 64)
    
    // Add marble veining pattern
    marbleFloor.lineStyle(1, 0xe8e8e0, 0.6)
    for (let i = 0; i < 8; i++) {
      const x1 = Math.random() * 64
      const y1 = Math.random() * 64
      const x2 = x1 + (Math.random() - 0.5) * 20
      const y2 = y1 + (Math.random() - 0.5) * 20
      marbleFloor.lineBetween(x1, y1, x2, y2)
    }
    
    marbleFloor.generateTexture('marble-floor', 64, 64)
    marbleFloor.destroy()
  }

  private createAvatarSprites() {
    console.log('👤 Creating avatar sprites...')
    try {
      // Create beautiful animated avatar sprites
      this.createPlayerAvatar()
      this.createOtherPlayerAvatars()
      console.log('✅ Avatar sprites created successfully')
    } catch (error) {
      console.error('❌ Error creating avatar sprites:', error)
    }
  }

  private createPlayerAvatar() {
    // Create main player avatar with Chinese business style
    const player = this.add.graphics()
    
    // Avatar body (business suit)
    player.fillStyle(0x2c3e50) // Dark blue suit
    player.fillRect(12, 16, 8, 12) // Body
    
    // Avatar head (skin tone)
    player.fillStyle(0xfdbcb4) // Asian skin tone
    player.fillCircle(16, 12, 6) // Head
    
    // Hair (black)
    player.fillStyle(0x2c2c2c)
    player.fillEllipse(16, 9, 10, 6) // Hair
    
    // Shirt (white)
    player.fillStyle(0xffffff)
    player.fillRect(13, 17, 6, 8) // Shirt
    
    // Tie (red - Chinese style)
    player.fillStyle(0xDC143C)
    player.fillRect(15, 18, 2, 6) // Tie
    
    // Arms
    player.fillStyle(0x2c3e50)
    player.fillRect(8, 18, 3, 8) // Left arm
    player.fillRect(21, 18, 3, 8) // Right arm
    
    // Hands
    player.fillStyle(0xfdbcb4)
    player.fillCircle(9, 22, 2) // Left hand
    player.fillCircle(23, 22, 2) // Right hand
    
    // Legs
    player.fillStyle(0x2c3e50)
    player.fillRect(13, 28, 3, 8) // Left leg
    player.fillRect(16, 28, 3, 8) // Right leg
    
    // Shoes (black)
    player.fillStyle(0x1a1a1a)
    player.fillRect(12, 35, 4, 3) // Left shoe
    player.fillRect(16, 35, 4, 3) // Right shoe
    
    // Face details
    player.fillStyle(0x2c2c2c) // Eyes
    player.fillCircle(14, 11, 1)
    player.fillCircle(18, 11, 1)
    
    // Smile
    player.lineStyle(1, 0x2c2c2c)
    player.beginPath()
    player.arc(16, 13, 2, 0, Math.PI)
    player.strokePath()
    
    player.generateTexture('player-avatar', 32, 40)
    player.destroy()
  }

  private createOtherPlayerAvatars() {
    const avatarVariants = [
      { suit: 0x34495e, tie: 0x27ae60, name: 'other-player-1' },
      { suit: 0x8e44ad, tie: 0xf39c12, name: 'other-player-2' },
      { suit: 0x16a085, tie: 0xe74c3c, name: 'other-player-3' }
    ]

    avatarVariants.forEach(variant => {
      const avatar = this.add.graphics()
      
      // Body and other parts (same structure as player)
      avatar.fillStyle(variant.suit)
      avatar.fillRect(12, 16, 8, 12)
      avatar.fillStyle(0xfdbcb4)
      avatar.fillCircle(16, 12, 6)
      avatar.fillStyle(0x2c2c2c)
      avatar.fillEllipse(16, 9, 10, 6)
      avatar.fillStyle(0xffffff)
      avatar.fillRect(13, 17, 6, 8)
      avatar.fillStyle(variant.tie)
      avatar.fillRect(15, 18, 2, 6)
      
      avatar.generateTexture(variant.name, 32, 40)
      avatar.destroy()
    })
  }

  private createFurnitureSprites() {
    // Modern office desk
    const desk = this.add.graphics()
    desk.fillStyle(0x8B4513)
    desk.fillRect(0, 0, 80, 50)
    desk.generateTexture('office-desk', 80, 50)
    desk.destroy()

    // Office chair
    const chair = this.add.graphics()
    chair.fillStyle(0x2c3e50)
    chair.fillEllipse(16, 20, 24, 20)
    chair.fillRoundedRect(6, 8, 20, 16, 4)
    chair.generateTexture('office-chair', 32, 40)
    chair.destroy()

    // Computer monitor
    const monitor = this.add.graphics()
    monitor.fillStyle(0x2c3e50)
    monitor.fillRect(8, 30, 16, 8)
    monitor.fillStyle(0x1a1a1a)
    monitor.fillRect(4, 8, 24, 18)
    monitor.fillStyle(0x3498db)
    monitor.fillRect(6, 10, 20, 14)
    monitor.generateTexture('computer-monitor', 32, 40)
    monitor.destroy()
  }

  private createImmersiveEnvironment() {
    console.log('🏢 Creating immersive environment...')
    try {
      // Create textured floor
      if (this.textures.exists('marble-floor')) {
        for (let x = 0; x < 1200; x += 64) {
          for (let y = 0; y < 800; y += 64) {
            const floor = this.add.image(x + 32, y + 32, 'marble-floor')
            floor.setDepth(-50)
            
            // Add subtle lighting variation to floor tiles
            const lightVariation = 0.9 + Math.random() * 0.2
            floor.setAlpha(lightVariation)
          }
        }
      } else {
        console.warn('⚠️ marble-floor texture not found, creating simple background')
        this.add.rectangle(600, 400, 1200, 800, 0xf5f5f0).setOrigin(0.5)
      }

      // Add ambient lighting effects
      this.createAmbientLighting()

      // Create immersive office layout
      this.createImmersiveOfficeLayout()
      
      console.log('✅ Immersive environment created successfully')
    } catch (error) {
      console.error('❌ Error creating immersive environment:', error)
    }
  }

  private createAmbientLighting() {
    console.log('💡 Creating ambient lighting...')
    try {
      // Create soft light sources throughout the office
      const lightPositions = [
        { x: 200, y: 200 }, { x: 600, y: 200 }, { x: 1000, y: 200 },
        { x: 200, y: 400 }, { x: 600, y: 400 }, { x: 1000, y: 400 },
        { x: 200, y: 600 }, { x: 600, y: 600 }, { x: 1000, y: 600 }
      ]

      lightPositions.forEach(pos => {
        // Create light circle with proper Phaser graphics
        const lightRadius = 80 + Math.random() * 40
        const light = this.add.graphics()
        
        // Create radial gradient effect using proper Phaser method
        light.fillStyle(0xffffe0, 0.15) // Very soft yellow light
        light.fillCircle(0, 0, lightRadius)
        light.setPosition(pos.x, pos.y)
        light.setDepth(5)
        
        // Add gentle pulsing animation
        this.tweens.add({
          targets: light,
          alpha: 0.1,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 4000 + Math.random() * 2000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        })
      })

      // Add window light effect
      const windowLight = this.add.graphics()
      windowLight.fillStyle(0xe8f4fd, 0.2) // Soft blue-white from windows
      windowLight.fillRect(0, 0, 1200, 150) // Top area lit by windows
      windowLight.setDepth(1)
      
      // Add subtle color variations throughout the day
      this.tweens.add({
        targets: windowLight,
        alpha: 0.1,
        duration: 15000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      })
      
      console.log('✅ Ambient lighting created successfully')
    } catch (error) {
      console.error('❌ Error creating ambient lighting:', error)
      // Simple fallback lighting
      const simpleBg = this.add.rectangle(600, 400, 1200, 800, 0xf8f8f8, 0.1)
      simpleBg.setDepth(1)
    }
  }

  private createImmersiveOfficeLayout() {
    console.log('🏗️ Creating immersive office layout...')
    try {
      // Reception area
      const receptionX = 150, receptionY = 150
      
      if (this.textures.exists('office-desk')) {
        const desk = this.add.image(receptionX, receptionY, 'office-desk')
        desk.setDepth(10)
        desk.setTint(0x8B4513) // Rich wood color
      } else {
        // Fallback: simple rectangle desk
        this.add.rectangle(receptionX, receptionY, 80, 50, 0x8B4513).setOrigin(0.5)
      }
      
      if (this.textures.exists('office-chair')) {
        const chair = this.add.image(receptionX, receptionY + 40, 'office-chair')
        chair.setDepth(10)
        chair.setTint(0x654321) // Executive brown
      } else {
        // Fallback: simple circle chair
        this.add.circle(receptionX, receptionY + 40, 15, 0x654321).setOrigin(0.5)
      }
      
      if (this.textures.exists('computer-monitor')) {
        const computer = this.add.image(receptionX - 20, receptionY - 10, 'computer-monitor')
        computer.setDepth(15)
      } else {
        // Fallback: simple rectangle monitor
        this.add.rectangle(receptionX - 20, receptionY - 10, 25, 20, 0x2c3e50).setOrigin(0.5)
      }

      // Add reception plants for ambiance (always create these as graphics)
      this.createPlantDecoration(receptionX - 60, receptionY, 0x228B22)
      this.createPlantDecoration(receptionX + 60, receptionY, 0x32CD32)

      // Reception area sign
      this.add.text(receptionX, receptionY - 60, '前台接待\\nReception', {
        fontSize: '14px',
        color: '#2c3e50',
        fontFamily: 'PingFang SC, Arial',
        align: 'center',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 4 },
        stroke: '#cccccc',
        strokeThickness: 1
      }).setOrigin(0.5).setDepth(20)

      // Create workstation areas
      this.createWorkstationAreas()

      // Create meeting room
      this.createMeetingRoomArea()
      
      // Create lounge area
      this.createLoungeAreaSimple()

      // Add Chinese decorations
      this.addChineseDecorationsSimple()
      
      console.log('✅ Office layout created successfully')
    } catch (error) {
      console.error('❌ Error creating office layout:', error)
      // Create simple fallback layout
      this.add.rectangle(150, 150, 80, 50, 0x8B4513).setOrigin(0.5) // Simple desk
      this.add.circle(150, 200, 15, 0x2c3e50).setOrigin(0.5) // Simple chair
    }
  }

  private createWorkstationAreas() {
    // Workstation areas with better arrangement
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

  private createMeetingRoomArea() {
    const x = 850, y = 250
    
    // Glass walls effect
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

  private createLoungeAreaSimple() {
    const x = 150, y = 600

    // Cozy seating arrangement
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

    // Plants around lounge
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

  private addChineseDecorationsSimple() {
    // Traditional scrolls on walls
    const scrollPositions = [
      { x: 50, y: 300 }, { x: 1150, y: 300 },
      { x: 50, y: 500 }, { x: 1150, y: 500 }
    ]

    scrollPositions.forEach(pos => {
      const scroll = this.add.graphics()
      
      // Scroll background
      scroll.fillStyle(0xfff8dc)
      scroll.fillRect(0, 0, 20, 60)
      
      // Scroll edges
      scroll.fillStyle(0x8B4513)
      scroll.fillRect(-2, 0, 2, 60)
      scroll.fillRect(20, 0, 2, 60)
      
      // Chinese characters (simplified)
      scroll.fillStyle(0x2c2c2c)
      scroll.fillRect(6, 10, 2, 8)   // 和
      scroll.fillRect(12, 10, 2, 8)
      scroll.fillRect(6, 22, 2, 8)   // 谐
      scroll.fillRect(12, 22, 2, 8)
      scroll.fillRect(6, 34, 2, 8)   // 共
      scroll.fillRect(12, 34, 2, 8)
      scroll.fillRect(6, 46, 2, 8)   // 进
      scroll.fillRect(12, 46, 2, 8)
      
      scroll.setPosition(pos.x, pos.y)
      scroll.setDepth(30)
    })

    // Add some floating lanterns (seasonal)
    if (this.currentTheme.decorations.lanterns) {
      const lanternPositions = [
        { x: 300, y: 80 }, { x: 600, y: 80 }, { x: 900, y: 80 }
      ]

      lanternPositions.forEach(pos => {
        const lantern = this.add.graphics()
        
        // Lantern body
        lantern.fillStyle(0xDC143C)
        lantern.fillEllipse(0, 0, 24, 32)
        
        // Lantern details
        lantern.lineStyle(2, 0x8B0000)
        lantern.strokeEllipse(0, 0, 24, 32)
        
        // Chinese character
        lantern.fillStyle(0xFFD700)
        lantern.fillRect(-4, -2, 8, 2)
        lantern.fillRect(-4, 2, 8, 2)
        
        lantern.setPosition(pos.x, pos.y)
        lantern.setDepth(50)
        
        // Gentle swaying animation
        this.tweens.add({
          targets: lantern,
          rotation: 0.1,
          duration: 3000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        })
      })
    }
  }

  private createPlantDecoration(x: number, y: number, color: number, scale: number = 1) {
    const plant = this.add.graphics()
    
    // Pot
    plant.fillStyle(0x8B4513)
    plant.fillEllipse(0, 15, 16 * scale, 8 * scale)
    
    // Plant stems
    plant.fillStyle(color)
    for (let i = 0; i < 5; i++) {
      const stemX = (i - 2) * 2 * scale
      const stemHeight = (10 + Math.random() * 8) * scale
      plant.fillRect(stemX, 15 - stemHeight, 2 * scale, stemHeight)
    }
    
    // Leaves
    plant.fillStyle(color, 0.8)
    for (let i = 0; i < 8; i++) {
      const leafX = (Math.random() - 0.5) * 12 * scale
      const leafY = (Math.random() * 8) * scale
      plant.fillEllipse(leafX, leafY, 6 * scale, 3 * scale)
    }
    
    plant.setPosition(x, y)
    plant.setDepth(15)
    
    // Add gentle swaying animation
    this.tweens.add({
      targets: plant,
      rotation: 0.05,
      duration: 2000 + Math.random() * 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }
}