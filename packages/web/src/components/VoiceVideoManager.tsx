import React, { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button, message, Tooltip } from 'antd'
import { PhoneFilled, VideoCameraOutlined, AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'
import { RootState } from '../store'
import { toggleAudio, toggleVideo } from '../store/gameSlice'
import { webRTCService } from '../services/webRTCService'
import { socketService } from '../services/socketService'

interface VoiceVideoManagerProps {
  userPositions: Map<string, { x: number; y: number }>
  currentUserPosition: { x: number; y: number } | null
}

const VoiceVideoManager: React.FC<VoiceVideoManagerProps> = ({ userPositions, currentUserPosition }) => {
  const dispatch = useDispatch()
  const { isAudioEnabled, isVideoEnabled } = useSelector((state: RootState) => state.game)
  const [isWebRTCInitialized, setIsWebRTCInitialized] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set())
  const [proximityUsers, setProximityUsers] = useState<Set<string>>(new Set())

  // Distance threshold for voice chat (in pixels)
  const VOICE_DISTANCE_THRESHOLD = 150

  useEffect(() => {
    // Initialize WebRTC when component mounts
    const initWebRTC = async () => {
      try {
        await webRTCService.initialize(true, false) // Audio only initially
        setIsWebRTCInitialized(true)
        message.success('语音聊天已启用')
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error)
        message.error('无法启用语音聊天，请检查麦克风权限')
      }
    }

    initWebRTC()

    // Setup WebRTC event listeners
    const handleCallOffer = (event: CustomEvent) => {
      const { userId, offer } = event.detail
      console.log('📞 Handling call offer from:', userId)
      webRTCService.createAnswer(userId, offer)
    }

    const handleCallAnswer = (event: CustomEvent) => {
      const { userId, answer } = event.detail
      console.log('📞 Handling call answer from:', userId)
      webRTCService.handleAnswer(userId, answer)
    }

    const handleIceCandidate = (event: CustomEvent) => {
      const { userId, candidate } = event.detail
      console.log('🧊 Handling ICE candidate from:', userId)
      webRTCService.handleIceCandidate(userId, candidate)
    }

    const handleRemoteStream = (event: CustomEvent) => {
      const { userId } = event.detail
      console.log('📺 Remote stream received from:', userId)
      setConnectedUsers(prev => new Set(prev).add(userId))
    }

    const handlePeerDisconnected = (event: CustomEvent) => {
      const { userId } = event.detail
      console.log('📵 Peer disconnected:', userId)
      setConnectedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }

    // Add event listeners
    window.addEventListener('webrtcCallOffer', handleCallOffer as EventListener)
    window.addEventListener('webrtcCallAnswer', handleCallAnswer as EventListener)
    window.addEventListener('webrtcIceCandidate', handleIceCandidate as EventListener)
    window.addEventListener('remoteStreamReceived', handleRemoteStream as EventListener)
    window.addEventListener('peerDisconnected', handlePeerDisconnected as EventListener)

    return () => {
      // Cleanup
      window.removeEventListener('webrtcCallOffer', handleCallOffer as EventListener)
      window.removeEventListener('webrtcCallAnswer', handleCallAnswer as EventListener)
      window.removeEventListener('webrtcIceCandidate', handleIceCandidate as EventListener)
      window.removeEventListener('remoteStreamReceived', handleRemoteStream as EventListener)
      window.removeEventListener('peerDisconnected', handlePeerDisconnected as EventListener)
      
      webRTCService.destroy()
    }
  }, [])

  // Memoize current user position for stable comparisons
  const currentPos = useMemo(() => currentUserPosition, [currentUserPosition?.x, currentUserPosition?.y])

  // Separate effect to handle position updates and spatial audio (no state changes)
  useEffect(() => {
    if (!currentPos || !isWebRTCInitialized) return

    // Update spatial audio for all connected users
    userPositions.forEach((position, userId) => {
      if (userId === socketService.socketId) return // Skip self
      if (!connectedUsers.has(userId)) return // Only for connected users

      const distance = Math.sqrt(
        Math.pow(position.x - currentPos.x, 2) + 
        Math.pow(position.y - currentPos.y, 2)
      )

      // Calculate angle for spatial audio
      const angle = Math.atan2(
        position.y - currentPos.y,
        position.x - currentPos.x
      )

      // Update spatial audio
      webRTCService.updateSpatialAudio(userId, distance, angle)
    })
  }, [userPositions, currentPos, isWebRTCInitialized, connectedUsers])

  // Separate effect to handle proximity connections
  useEffect(() => {
    if (!currentPos || !isWebRTCInitialized) return

    const nearbyUsers = new Set<string>()
    const farUsers = new Set<string>()

    // Check distance to each user
    userPositions.forEach((position, userId) => {
      if (userId === socketService.socketId) return // Skip self

      const distance = Math.sqrt(
        Math.pow(position.x - currentPos.x, 2) + 
        Math.pow(position.y - currentPos.y, 2)
      )

      if (distance <= VOICE_DISTANCE_THRESHOLD) {
        nearbyUsers.add(userId)
      } else {
        farUsers.add(userId)
      }
    })

    // Start calls with nearby users not already connected
    nearbyUsers.forEach(userId => {
      if (!connectedUsers.has(userId)) {
        console.log('🔊 Starting voice call with nearby user:', userId)
        webRTCService.createOffer(userId)
      }
    })

    // Disconnect from far users
    farUsers.forEach(userId => {
      if (connectedUsers.has(userId)) {
        console.log('🔇 Ending voice call with distant user:', userId)
        webRTCService.disconnect(userId)
      }
    })

    setProximityUsers(nearbyUsers)
  }, [userPositions, currentPos, isWebRTCInitialized]) // Removed connectedUsers to prevent cycles

  // Handle audio toggle
  const handleAudioToggle = () => {
    const newAudioState = !isAudioEnabled
    dispatch(toggleAudio())
    webRTCService.toggleAudio(newAudioState)
    message.info(newAudioState ? '麦克风已开启' : '麦克风已关闭')
  }

  // Handle video toggle (for future implementation)
  const handleVideoToggle = () => {
    const newVideoState = !isVideoEnabled
    dispatch(toggleVideo())
    webRTCService.toggleVideo(newVideoState)
    message.info(newVideoState ? '摄像头已开启' : '摄像头已关闭')
  }

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* Voice status indicator */}
      {isWebRTCInitialized && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <PhoneFilled style={{ color: connectedUsers.size > 0 ? '#52c41a' : '#999' }} />
          语音通话: {connectedUsers.size} 人
        </div>
      )}

      {/* Proximity indicator */}
      {proximityUsers.size > 0 && (
        <div style={{
          background: 'rgba(82, 196, 26, 0.8)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: 4,
          fontSize: '11px'
        }}>
          📍 附近 {proximityUsers.size} 人可通话
        </div>
      )}

      {/* WebRTC controls */}
      {isWebRTCInitialized && (
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '6px',
          borderRadius: 6
        }}>
          <Tooltip title={isAudioEnabled ? '关闭麦克风' : '开启麦克风'}>
            <Button
              type={isAudioEnabled ? 'primary' : 'default'}
              size="small"
              shape="circle"
              icon={isAudioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={handleAudioToggle}
            />
          </Tooltip>

          <Tooltip title={isVideoEnabled ? '关闭摄像头' : '开启摄像头'}>
            <Button
              type={isVideoEnabled ? 'primary' : 'default'}
              size="small"
              shape="circle"
              icon={<VideoCameraOutlined />}
              onClick={handleVideoToggle}
              disabled // Video disabled for now
            />
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export default VoiceVideoManager