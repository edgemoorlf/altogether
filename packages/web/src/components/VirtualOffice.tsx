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

const VirtualOffice: React.FC = () => {
  const dispatch = useDispatch()
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<Phaser.Game | null>(null)
  const { isGameLoaded } = useSelector((state: RootState) => state.game)
  const { onlineUsers } = useSelector((state: RootState) => state.user)

  // State for tracking user positions for VoiceVideoManager
  const [userPositions, setUserPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [currentUserPosition, setCurrentUserPosition] = useState<{ x: number; y: number } | null>(null)

  // Socket connection effect
  useEffect(() => {
    console.log('🔌 Setting up socket connection...')
    
    // Connect to Socket.IO server
    socketService.connect()

    // Join the main office room
    socketService.joinRoom('office-main')

    return () => {
      console.log('🔌 Cleaning up socket connection...')
      socketService.disconnect()
    }
  }, [])

  // Listen for user position updates from the game
  useEffect(() => {
    const handlePositionUpdate = (event: CustomEvent) => {
      const { userPositions: gameUserPositions, currentUserPosition: gameCurrentUserPosition } = event.detail
      setUserPositions(new Map(gameUserPositions))
      setCurrentUserPosition(gameCurrentUserPosition)
    }

    window.addEventListener('userPositionUpdate', handlePositionUpdate as EventListener)

    return () => {
      window.removeEventListener('userPositionUpdate', handlePositionUpdate as EventListener)
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
        console.log('🎮 Game created successfully, storing reference...')
        gameInstanceRef.current = game
        
        // Use a timeout to ensure the game scene is fully loaded
        const checkGameReady = () => {
          const scene = game.scene.getScene('MainScene')
          console.log('🔍 Checking game readiness:', {
            sceneExists: !!scene,
            isActive: scene?.scene.isActive(),
            isVisible: scene?.scene.isVisible()
          })
          
          if (scene && scene.scene.isActive()) {
            console.log('🎯 Game scene is active, updating state...')
            dispatch(setGameLoaded(true))
            
            // Mock initial player position
            const initialPosition = { x: 400, y: 300 }
            dispatch(setPlayerPosition(initialPosition))
            
            // Send initial position to server after a short delay
            setTimeout(() => {
              socketService.sendPlayerMove(initialPosition)
            }, 1000)
          } else {
            console.log('⏱️ Game scene not ready yet, waiting...')
            setTimeout(checkGameReady, 100)
          }
        }

        // Start checking after a small delay
        setTimeout(checkGameReady, 500)
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