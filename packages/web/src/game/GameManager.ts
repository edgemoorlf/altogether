import Phaser from 'phaser'
import MainScene from './scenes/MainScene'

export const initializeGame = (container: HTMLElement): Phaser.Game | null => {
  try {
    console.log('🎮 Initializing Phaser game...')
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      parent: container,
      backgroundColor: '#2c3e50',
      scene: [MainScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // No gravity for top-down view
          debug: process.env.NODE_ENV === 'development'
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      // Disable audio to prevent AudioContext errors
      audio: {
        disableWebAudio: true,
        noAudio: true
      },
      // Reduce unnecessary features for better performance
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
      }
    }

    console.log('📏 Game dimensions:', config.width, 'x', config.height)

    const game = new Phaser.Game(config)
    
    // Handle window resize
    const handleResize = () => {
      if (game && container) {
        const newWidth = container.clientWidth || 800
        const newHeight = container.clientHeight || 600
        console.log('🔄 Resizing game to:', newWidth, 'x', newHeight)
        game.scale.resize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    
    // Store cleanup function
    game.events.once('destroy', () => {
      console.log('🧹 Cleaning up game...')
      window.removeEventListener('resize', handleResize)
    })

    // Listen for scene ready
    game.scene.getScene('MainScene')?.events.once('ready', () => {
      console.log('🎯 Main scene is ready!')
    })

    console.log('✅ Phaser game initialized successfully')
    return game
  } catch (error) {
    console.error('❌ Failed to initialize game:', error)
    return null
  }
}