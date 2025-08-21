class WebRTCService {
  private localStream: MediaStream | null = null
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private remoteStreams: Map<string, MediaStream> = new Map()
  private audioContext: AudioContext | null = null
  private gainNodes: Map<string, GainNode> = new Map()
  private panNodes: Map<string, StereoPannerNode> = new Map()
  private isEnabled = false

  // STUN servers for NAT traversal
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  constructor() {
    this.setupAudioContext()
  }

  private async setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error('Failed to create AudioContext:', error)
    }
  }

  async initialize(audioEnabled = true, videoEnabled = false) {
    try {
      console.log('🎤 Initializing WebRTC with audio:', audioEnabled, 'video:', videoEnabled)
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }
      
      console.log('📊 Checking current media permissions...')
      
      // Check permission status first
      if (navigator.permissions) {
        try {
          const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          const videoPermission = videoEnabled ? await navigator.permissions.query({ name: 'camera' as PermissionName }) : null
          
          console.log('🎤 Microphone permission:', audioPermission.state)
          if (videoPermission) {
            console.log('📹 Camera permission:', videoPermission.state)
          }
        } catch (permError) {
          console.warn('⚠️ Permission API not available:', permError)
        }
      }
      
      console.log('🚀 Requesting media stream with constraints:', { audio: audioEnabled, video: videoEnabled })
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled
      })
      
      // Verify the stream and tracks
      console.log('📺 Media stream received:', this.localStream)
      console.log('🎵 Audio tracks:', this.localStream.getAudioTracks())
      console.log('📹 Video tracks:', this.localStream.getVideoTracks())
      
      // Check track states
      this.localStream.getTracks().forEach((track, index) => {
        console.log(`📌 Track ${index}:`, {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        })
      })

      this.isEnabled = true
      console.log('✅ WebRTC initialized successfully with', this.localStream.getTracks().length, 'tracks')
      return this.localStream
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error)
      const errorObj = error as Error
      console.error('❌ Error details:', {
        name: errorObj.name || 'Unknown',
        message: errorObj.message || 'Unknown error',
        constraint: (error as any).constraint || 'N/A'
      })
      throw error
    }
  }

  async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })
    this.peerConnections.set(userId, pc)

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!)
      })
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📺 Received remote stream from:', userId)
      const remoteStream = event.streams[0]
      this.remoteStreams.set(userId, remoteStream)
      this.setupSpatialAudio(userId, remoteStream)
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('remoteStreamReceived', { 
        detail: { userId, stream: remoteStream } 
      }))
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', userId)
        this.sendSignal('iceCandidate', userId, { candidate: event.candidate })
      }
    }

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state with', userId + ':', pc.connectionState)
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.cleanupPeerConnection(userId)
      }
    }

    return pc
  }

  private setupSpatialAudio(userId: string, stream: MediaStream) {
    if (!this.audioContext) return

    try {
      const audioTrack = stream.getAudioTracks()[0]
      if (!audioTrack) return

      // Create audio elements for spatial processing
      const audio = new Audio()
      audio.srcObject = stream
      audio.play().catch(console.error)

      // Create audio nodes for spatial audio
      const source = this.audioContext.createMediaStreamSource(stream)
      const gainNode = this.audioContext.createGain()
      const panNode = this.audioContext.createStereoPanner()
      
      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(panNode)
      panNode.connect(this.audioContext.destination)
      
      // Store nodes for later manipulation
      this.gainNodes.set(userId, gainNode)
      this.panNodes.set(userId, panNode)

      console.log('🔊 Spatial audio setup for:', userId)
    } catch (error) {
      console.error('Failed to setup spatial audio:', error)
    }
  }

  updateSpatialAudio(userId: string, distance: number, angle: number) {
    const gainNode = this.gainNodes.get(userId)
    const panNode = this.panNodes.get(userId)
    
    if (!gainNode || !panNode) return

    // Calculate volume based on distance (closer = louder)
    const maxDistance = 200 // pixels
    const volume = Math.max(0, 1 - (distance / maxDistance))
    gainNode.gain.value = volume * 0.8 // Max volume at 80%

    // Calculate stereo panning based on angle
    // -1 = left ear, 0 = center, 1 = right ear
    const pan = Math.max(-1, Math.min(1, Math.sin(angle)))
    panNode.pan.value = pan

    console.log('🎧 Updated spatial audio for', userId + ':', { distance, angle, volume, pan })
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const pc = await this.createPeerConnection(userId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    
    console.log('📤 Created offer for:', userId)
    this.sendSignal('callOffer', userId, { offer })
    return offer
  }

  async createAnswer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = await this.createPeerConnection(userId)
    await pc.setRemoteDescription(offer)
    
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    console.log('📤 Created answer for:', userId)
    this.sendSignal('callAnswer', userId, { answer })
    return answer
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(userId)
    if (pc) {
      await pc.setRemoteDescription(answer)
      console.log('📥 Received answer from:', userId)
    }
  }

  async handleIceCandidate(userId: string, candidate: RTCIceCandidate) {
    const pc = this.peerConnections.get(userId)
    if (pc) {
      await pc.addIceCandidate(candidate)
      console.log('🧊 Added ICE candidate from:', userId)
    }
  }

  private sendSignal(type: string, targetUserId: string, data: any) {
    // Import socketService dynamically to avoid circular dependency
    import('./socketService').then(({ socketService }) => {
      switch (type) {
        case 'callOffer':
          socketService.sendCallOffer(targetUserId, data.offer)
          break
        case 'callAnswer':
          socketService.sendCallAnswer(targetUserId, data.answer)
          break
        case 'iceCandidate':
          socketService.sendIceCandidate(targetUserId, data.candidate)
          break
        default:
          console.warn('Unknown WebRTC signal type:', type)
      }
    }).catch(console.error)
  }

  private cleanupPeerConnection(userId: string) {
    console.log('🧹 Cleaning up peer connection for:', userId)
    
    // Close peer connection
    const pc = this.peerConnections.get(userId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }

    // Clean up audio nodes
    const gainNode = this.gainNodes.get(userId)
    const panNode = this.panNodes.get(userId)
    if (gainNode) {
      gainNode.disconnect()
      this.gainNodes.delete(userId)
    }
    if (panNode) {
      panNode.disconnect()
      this.panNodes.delete(userId)
    }

    // Remove remote stream
    this.remoteStreams.delete(userId)

    // Dispatch cleanup event
    window.dispatchEvent(new CustomEvent('peerDisconnected', { detail: { userId } }))
  }

  disconnect(userId?: string) {
    if (userId) {
      this.cleanupPeerConnection(userId)
    } else {
      // Disconnect all peers
      this.peerConnections.forEach((_, id) => {
        this.cleanupPeerConnection(id)
      })
    }
  }

  async toggleAudio(enabled: boolean) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
        console.log('🎤 Audio', enabled ? 'enabled' : 'disabled')
      }
    }
  }

  async toggleVideo(enabled: boolean) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
        console.log('📹 Video', enabled ? 'enabled' : 'disabled')
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null
  }

  isInitialized(): boolean {
    return this.isEnabled
  }

  getConnectedUsers(): string[] {
    return Array.from(this.peerConnections.keys())
  }

  destroy() {
    console.log('🧹 Destroying WebRTC service')
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Close all peer connections
    this.disconnect()

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.isEnabled = false
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService()