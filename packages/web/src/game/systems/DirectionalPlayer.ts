import { AvatarSpriteGenerator, AvatarConfig, DirectionalSprite } from './AvatarSystem'

type Direction = 'down' | 'up' | 'left' | 'right'

class DirectionalPlayer {
  private sprite: Phaser.Physics.Arcade.Sprite
  private avatarGenerator: AvatarSpriteGenerator
  private sprites: DirectionalSprite
  private currentDirection: Direction = 'down'

  constructor(scene: Phaser.Scene, x: number, y: number, avatarConfig: AvatarConfig) {
    this.avatarGenerator = new AvatarSpriteGenerator(scene)
    
    // Generate all directional sprites
    this.sprites = this.avatarGenerator.createDirectionalSprites(avatarConfig)
    
    // Create physics sprite starting with down direction
    this.sprite = scene.physics.add.sprite(x, y, this.sprites.down)
    
    // Configure collision properties
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDisplaySize(32, 40)
    
    // Ensure physics body is properly configured
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.setCollideWorldBounds(true)
      body.setSize(28, 36) // Set collision box size (slightly smaller than display size)
      body.setOffset(2, 2) // Center the collision box
      console.log('🔧 DirectionalPlayer collision configured:', {
        collideWorldBounds: body.collideWorldBounds,
        bodySize: { width: body.width, height: body.height },
        bodyOffset: { x: body.offset.x, y: body.offset.y }
      })
    } else {
      console.error('❌ DirectionalPlayer: No physics body created!')
    }
  }

  update() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    const velocityX = body.velocity.x
    const velocityY = body.velocity.y
    
    // Determine direction based on velocity
    let newDirection: Direction = this.currentDirection
    
    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      // Horizontal movement is stronger
      newDirection = velocityX > 0 ? 'right' : 'left'
    } else if (Math.abs(velocityY) > 0) {
      // Vertical movement
      newDirection = velocityY > 0 ? 'down' : 'up'
    }
    // If no movement, keep current direction
    
    // Update sprite texture if direction changed
    if (newDirection !== this.currentDirection) {
      this.currentDirection = newDirection
      this.sprite.setTexture(this.sprites[newDirection])
    }
  }

  // Proxy methods to the underlying sprite
  setVelocity(x: number, y: number) {
    this.sprite.setVelocity(x, y)
  }

  setVelocityX(x: number) {
    this.sprite.setVelocityX(x)
  }

  setVelocityY(y: number) {
    this.sprite.setVelocityY(y)
  }

  get x() {
    return this.sprite.x
  }

  get y() {
    return this.sprite.y
  }

  get body() {
    return this.sprite.body
  }

  setCollideWorldBounds(value: boolean) {
    this.sprite.setCollideWorldBounds(value)
  }

  setDisplaySize(width: number, height: number) {
    this.sprite.setDisplaySize(width, height)
  }

  destroy() {
    this.sprite.destroy()
  }

  getCurrentDirection(): Direction {
    return this.currentDirection
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite
  }
}

export { DirectionalPlayer, type Direction }