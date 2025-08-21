interface AvatarConfig {
  userId: string
  username: string
  seed: string // For consistent avatar generation
  colors: {
    skin: number
    hair: number
    shirt: number
    pants: number
  }
  style: {
    hairStyle: 'short' | 'long' | 'bald' | 'curly'
    bodyType: 'slim' | 'normal' | 'broad'
  }
}

interface DirectionalSprite {
  down: string   // Front facing (default)
  up: string     // Back facing
  left: string   // Left facing
  right: string  // Right facing
}

class AvatarSpriteGenerator {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Generate avatar config from user data
  generateAvatarConfig(userId: string, username: string): AvatarConfig {
    // Use username as seed for consistent generation
    const seed = username + userId
    const hash = this.simpleHash(seed)
    
    // Generate consistent colors based on hash
    const skinTones = [0xfdbcb4, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524]
    const hairColors = [0x2c2c2c, 0x8B4513, 0xDAA520, 0xFF4500, 0x4B0082]
    const shirtColors = [0xffffff, 0x87CEEB, 0x98FB98, 0xFFA07A, 0xDDA0DD]
    const pantsColors = [0x2c3e50, 0x8B4513, 0x2F4F4F, 0x696969, 0x556B2F]
    
    const hairStyles = ['short', 'long', 'bald', 'curly'] as const
    const bodyTypes = ['slim', 'normal', 'broad'] as const
    
    return {
      userId,
      username,
      seed,
      colors: {
        skin: skinTones[hash % skinTones.length],
        hair: hairColors[(hash >> 2) % hairColors.length],
        shirt: shirtColors[(hash >> 4) % shirtColors.length],
        pants: pantsColors[(hash >> 6) % pantsColors.length]
      },
      style: {
        hairStyle: hairStyles[(hash >> 8) % hairStyles.length],
        bodyType: bodyTypes[(hash >> 10) % bodyTypes.length]
      }
    }
  }

  // Create all 4-directional sprites for an avatar
  createDirectionalSprites(config: AvatarConfig): DirectionalSprite {
    const baseKey = `avatar-${config.userId}`
    
    return {
      down: this.createAvatarSprite(config, 'down', `${baseKey}-down`),
      up: this.createAvatarSprite(config, 'up', `${baseKey}-up`),
      left: this.createAvatarSprite(config, 'left', `${baseKey}-left`),
      right: this.createAvatarSprite(config, 'right', `${baseKey}-right`)
    }
  }

  private createAvatarSprite(config: AvatarConfig, direction: 'down' | 'up' | 'left' | 'right', textureKey: string): string {
    // Safety check to ensure scene is properly initialized
    if (!this.scene || !this.scene.add) {
      console.error('❌ Scene not initialized properly for avatar creation')
      throw new Error('Scene context is null - cannot create avatar sprite')
    }
    
    const graphics = this.scene.add.graphics()
    const { colors, style } = config
    
    // Clear any existing texture
    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.remove(textureKey)
    }
    
    // Base dimensions
    const width = 32
    const height = 40
    
    // Body positioning based on body type
    const bodyWidth = style.bodyType === 'slim' ? 6 : style.bodyType === 'broad' ? 10 : 8
    const bodyX = (width - bodyWidth) / 2
    
    // Draw body (shirt)
    graphics.fillStyle(colors.shirt)
    graphics.fillRect(bodyX, 16, bodyWidth, 12)
    
    // Draw pants/legs
    graphics.fillStyle(colors.pants)
    graphics.fillRect(bodyX + 1, 28, Math.floor(bodyWidth/2) - 1, 8) // Left leg
    graphics.fillRect(bodyX + Math.ceil(bodyWidth/2), 28, Math.floor(bodyWidth/2) - 1, 8) // Right leg
    
    // Draw head (consistent position for all directions)
    graphics.fillStyle(colors.skin)
    graphics.fillCircle(width/2, 12, 6)
    
    // Draw hair based on direction and style
    this.drawHair(graphics, colors.hair, style.hairStyle, direction, width/2, 12)
    
    // Draw face features based on direction
    this.drawFace(graphics, direction, width/2, 12)
    
    // Draw arms based on direction
    this.drawArms(graphics, colors.skin, colors.shirt, direction, bodyX, bodyWidth)
    
    // Draw shoes
    graphics.fillStyle(0x1a1a1a)
    graphics.fillRect(bodyX + 1, 35, Math.floor(bodyWidth/2) - 1, 3) // Left shoe
    graphics.fillRect(bodyX + Math.ceil(bodyWidth/2), 35, Math.floor(bodyWidth/2) - 1, 3) // Right shoe
    
    // Generate texture
    graphics.generateTexture(textureKey, width, height)
    graphics.destroy()
    
    return textureKey
  }

  private drawHair(graphics: Phaser.GameObjects.Graphics, color: number, style: string, direction: string, centerX: number, centerY: number) {
    graphics.fillStyle(color)
    
    switch (style) {
      case 'short':
        graphics.fillEllipse(centerX, centerY - 3, 10, 6)
        break
      case 'long':
        graphics.fillEllipse(centerX, centerY - 3, 12, 8)
        // Add hair flowing down sides
        if (direction === 'left') {
          graphics.fillEllipse(centerX - 4, centerY + 2, 4, 8)
        } else if (direction === 'right') {
          graphics.fillEllipse(centerX + 4, centerY + 2, 4, 8)
        } else {
          graphics.fillEllipse(centerX - 3, centerY + 2, 3, 8)
          graphics.fillEllipse(centerX + 3, centerY + 2, 3, 8)
        }
        break
      case 'curly':
        // Curly hair - multiple small circles
        graphics.fillCircle(centerX - 3, centerY - 4, 2)
        graphics.fillCircle(centerX + 3, centerY - 4, 2)
        graphics.fillCircle(centerX, centerY - 5, 2.5)
        graphics.fillCircle(centerX - 2, centerY - 2, 2)
        graphics.fillCircle(centerX + 2, centerY - 2, 2)
        break
      case 'bald':
        // No hair, maybe a small tuft
        graphics.fillEllipse(centerX, centerY - 4, 4, 2)
        break
    }
  }

  private drawFace(graphics: Phaser.GameObjects.Graphics, direction: string, centerX: number, centerY: number) {
    graphics.fillStyle(0x2c2c2c)
    
    switch (direction) {
      case 'down': // Front view
        graphics.fillCircle(centerX - 2, centerY - 1, 1) // Left eye
        graphics.fillCircle(centerX + 2, centerY - 1, 1) // Right eye
        // Smile
        graphics.lineStyle(1, 0x2c2c2c)
        graphics.beginPath()
        graphics.arc(centerX, centerY + 1, 2, 0, Math.PI)
        graphics.strokePath()
        break
      case 'up': // Back view - no face visible
        break
      case 'left': // Left side view
        graphics.fillCircle(centerX - 1, centerY - 1, 1) // Left eye
        // Side mouth
        graphics.fillRect(centerX - 2, centerY + 1, 2, 1)
        break
      case 'right': // Right side view  
        graphics.fillCircle(centerX + 1, centerY - 1, 1) // Right eye
        // Side mouth
        graphics.fillRect(centerX, centerY + 1, 2, 1)
        break
    }
  }

  private drawArms(graphics: Phaser.GameObjects.Graphics, skinColor: number, shirtColor: number, direction: string, bodyX: number, bodyWidth: number) {
    graphics.fillStyle(shirtColor)
    
    switch (direction) {
      case 'down':
      case 'up':
        // Arms at sides
        graphics.fillRect(bodyX - 3, 18, 3, 8) // Left arm
        graphics.fillRect(bodyX + bodyWidth, 18, 3, 8) // Right arm
        // Hands
        graphics.fillStyle(skinColor)
        graphics.fillCircle(bodyX - 1, 22, 2) // Left hand
        graphics.fillCircle(bodyX + bodyWidth + 1, 22, 2) // Right hand
        break
      case 'left':
        // Right arm visible behind, left arm in front
        graphics.fillRect(bodyX + bodyWidth - 1, 18, 3, 8) // Right arm (behind)
        graphics.fillRect(bodyX - 2, 18, 3, 8) // Left arm (in front)
        graphics.fillStyle(skinColor)
        graphics.fillCircle(bodyX + bodyWidth, 22, 2) // Right hand
        graphics.fillCircle(bodyX - 1, 22, 2) // Left hand
        break
      case 'right':
        // Left arm visible behind, right arm in front
        graphics.fillRect(bodyX - 2, 18, 3, 8) // Left arm (behind)
        graphics.fillRect(bodyX + bodyWidth - 1, 18, 3, 8) // Right arm (in front)
        graphics.fillStyle(skinColor)
        graphics.fillCircle(bodyX - 1, 22, 2) // Left hand
        graphics.fillCircle(bodyX + bodyWidth, 22, 2) // Right hand
        break
    }
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

export { AvatarSpriteGenerator, type AvatarConfig, type DirectionalSprite }