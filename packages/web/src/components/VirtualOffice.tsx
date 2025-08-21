import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Spin } from 'antd'
import { RootState } from '../store'
import { setGameLoaded, setPlayerPosition } from '../store/gameSlice'
import { initializeGame } from '../game/GameManager'
import { socketService } from '../services/socketService'
import ControlPanel from './ControlPanel'
import ChatPanel from './ChatPanel'
import VoiceVideoManager from './VoiceVideoManager'
import WebRTCDebugPanel from './WebRTCDebugPanel'

const VirtualOffice: React.FC = () => {
  const dispatch = useDispatch()
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<Phaser.Game | null>(null)
  const { isGameLoaded } = useSelector((state: RootState) => state.game)
  const { onlineUsers } = useSelector((state: RootState) => state.user)
  const { showWebRTCPanel } = useSelector((state: RootState) => state.debug)
  const { user, token } = useSelector((state: RootState) => state.auth)

  // State for tracking user positions for VoiceVideoManager
  const [userPositions, setUserPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [currentUserPosition, setCurrentUserPosition] = useState<{ x: number; y: number } | null>(null)

  // Socket connection effect
  useEffect(() => {
    console.log('🔌 Setting up socket connection...')
    
    // Connect to Socket.IO server with user info
    const userInfo = user && token ? {
      username: user.username,
      token: token
    } : undefined

    console.log('🔌 Connecting with user info:', userInfo?.username || 'anonymous')
    socketService.connect(userInfo)

    // Join the main office room
    socketService.joinRoom('office-main')

    return () => {
      console.log('🔌 Cleaning up socket connection...')
      socketService.disconnect()
    }
  }, [user, token])

  // Listen for user position updates from the game
  useEffect(() => {
    const handlePositionUpdate = (event: CustomEvent) => {
      const { userPositions: gameUserPositions, currentUserPosition: gameCurrentUserPosition } = event.detail
      setUserPositions(new Map(gameUserPositions))
      setCurrentUserPosition(gameCurrentUserPosition)
    }

    const handleLocalPlayerMoved = (event: CustomEvent) => {
      const { x, y } = event.detail || {}
      
      // Validate movement coordinates
      if (typeof x !== 'number' || typeof y !== 'number' || 
          isNaN(x) || isNaN(y) || 
          x === null || x === undefined || 
          y === null || y === undefined) {
        console.warn('⚠️ Invalid local movement data received:', { x, y, detail: event.detail })
        return
      }
      
      // Additional sanity check for reasonable coordinates
      if (x < -1000 || x > 2000 || y < -1000 || y > 1500) {
        console.warn('⚠️ Local movement coordinates out of bounds:', { x, y })
        return
      }
      
      console.log('📤 Sending local player movement to server:', { x, y })
      
      // Send validated player movement to server
      socketService.sendPlayerMove({ x, y })
      // Update local position tracking
      dispatch(setPlayerPosition({ x, y }))
    }

    window.addEventListener('userPositionUpdate', handlePositionUpdate as EventListener)
    window.addEventListener('localPlayerMoved', handleLocalPlayerMoved as EventListener)

    return () => {
      window.removeEventListener('userPositionUpdate', handlePositionUpdate as EventListener)
      window.removeEventListener('localPlayerMoved', handleLocalPlayerMoved as EventListener)
    }
  }, [])

  // Game initialization effect
  useEffect(() => {
    if (isGameLoaded || gameInstanceRef.current) {
      console.log('🎮 Game already loaded or instance exists, skipping...')
      return
    }

    console.log('🎯 Game effect triggered, checking container...')
    
    const initializeWhenReady = () => {
      if (!gameContainerRef.current) {
        console.log('📦 Container not ready, retrying in 50ms...')
        setTimeout(initializeWhenReady, 50)
        return
      }

      console.log('🚀 Starting game initialization with container ready...')
      
      // Initialize Phaser game
      const game = initializeGame(gameContainerRef.current)
      
      if (game) {
        // Use Phaser's event system instead of polling
        console.log('🎮 Game created successfully, setting up event listeners...')
        gameInstanceRef.current = game
        
        // Set up timeout fallback in case events don't fire
        const fallbackTimeout = setTimeout(() => {
          console.log('🔄 Fallback timeout reached, loading game anyway')
          dispatch(setGameLoaded(true))
        }, 5000)
        
        // Listen for scene ready event directly from MainScene
        const handleSceneReady = () => {
          console.log('🎯 MainScene ready event fired!')
          clearTimeout(fallbackTimeout)
          dispatch(setGameLoaded(true))
          
          // Mock initial player position
          const initialPosition = { x: 400, y: 300 }
          dispatch(setPlayerPosition(initialPosition))
          
          // Send initial position to server after a short delay
          setTimeout(() => {
            socketService.sendPlayerMove(initialPosition)
          }, 1000)
        }
        
        // Try multiple ways to detect when the scene is ready
        try {
          // Method 1: Listen for the 'ready' event from MainScene
          const scene = game.scene.getScene('MainScene')
          if (scene && scene.events) {
            scene.events.once('ready', handleSceneReady)
            console.log('📡 Listening for MainScene ready event...')
          } else {
            console.warn('⚠️ Scene or scene.events not available, using fallback')
          }
          
          // Method 2: Simple timeout as additional fallback
          setTimeout(() => {
            const currentScene = game.scene.getScene('MainScene')
            if (currentScene) {
              console.log('🔍 Timeout check: Scene exists, assuming ready')
              clearTimeout(fallbackTimeout)
              handleSceneReady()
            }
          }, 2000)
          
        } catch (eventError) {
          console.error('❌ Error setting up scene events:', eventError)
          // Use the fallback timeout
        }
      } else {
        console.error('❌ Failed to create game')
      }
    }

    // Start the initialization process
    initializeWhenReady()

    return () => {
      if (gameInstanceRef.current) {
        console.log('🧹 Destroying game instance...')
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
        dispatch(setGameLoaded(false))
      }
    }
  }, [dispatch]) // Remove isGameLoaded from dependencies to prevent re-initialization

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Game container - always present */}
      <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Loading overlay */}
      {!isGameLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 1000
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>
            正在加载虚拟办公室...
          </div>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
            {socketService.connected ? '已连接到服务器' : '正在连接服务器...'}
          </div>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
            游戏状态: {isGameLoaded ? '已加载' : '加载中'}
          </div>
        </div>
      )}
      
      {/* Game UI - only show when loaded */}
      {isGameLoaded && (
        <>
          <ControlPanel />
          <ChatPanel />
          <VoiceVideoManager 
            userPositions={userPositions} 
            currentUserPosition={currentUserPosition}
          />
          
          {/* Debug panel for WebRTC testing - controlled by console toggle */}
          {showWebRTCPanel && <WebRTCDebugPanel />}
          
          {/* Online users indicator */}
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: '14px'
          }}>
            在线用户: {onlineUsers.length}
          </div>
        </>
      )}
    </div>
  )
}

export default VirtualOffice