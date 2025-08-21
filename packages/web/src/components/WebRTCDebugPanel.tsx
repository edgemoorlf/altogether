import React, { useState, useEffect } from 'react'
import { Card, Button, Typography, Divider, Tag } from 'antd'
import { webRTCService } from '../services/webRTCService'

const { Text, Title } = Typography

const WebRTCDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const testWebRTC = async () => {
    try {
      console.log('🧪 Starting WebRTC debug test...')
      const testStream = await webRTCService.initialize(true, true) // Test both audio and video
      setStream(testStream)
      setIsInitialized(true)
      
      const info = {
        streamId: testStream.id,
        audioTracks: testStream.getAudioTracks().map(track => ({
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          settings: track.getSettings ? track.getSettings() : 'N/A',
          capabilities: track.getCapabilities ? track.getCapabilities() : 'N/A'
        })),
        videoTracks: testStream.getVideoTracks().map(track => ({
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          settings: track.getSettings ? track.getSettings() : 'N/A',
          capabilities: track.getCapabilities ? track.getCapabilities() : 'N/A'
        }))
      }
      
      setDebugInfo(info)
      console.log('🧪 WebRTC debug info:', info)
    } catch (error) {
      console.error('🧪 WebRTC debug test failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : 'Unknown'
      setDebugInfo({ error: errorMessage, errorName })
    }
  }

  const checkPermissions = async () => {
    if (!navigator.permissions) {
      setDebugInfo((prev: any) => ({ ...prev, permissionsAPI: 'Not available' }))
      return
    }

    try {
      const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      setDebugInfo((prev: any) => ({
        ...prev,
        permissions: {
          microphone: audioPermission.state,
          camera: cameraPermission.state
        }
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDebugInfo((prev: any) => ({ ...prev, permissionError: errorMessage }))
    }
  }

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track.kind, track.label)
        track.stop()
      })
      setStream(null)
      setIsInitialized(false)
      webRTCService.destroy()
    }
  }

  useEffect(() => {
    checkPermissions()
  }, [])

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>WebRTC Debug Panel</span>
          <Button 
            size="small" 
            type="text" 
            onClick={() => console.log("💡 Use 'debug.hideWebRTC()' to hide this panel")}
            style={{ fontSize: '12px', opacity: 0.7 }}
          >
            💡 Hide via console
          </Button>
        </div>
      }
      style={{ 
        position: 'fixed', 
        top: 20, 
        right: 20, 
        width: 400, 
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button onClick={testWebRTC} type="primary" size="small">
          Test WebRTC
        </Button>
        <Button onClick={stopStream} danger size="small" disabled={!isInitialized}>
          Stop Stream
        </Button>
        <Button onClick={checkPermissions} size="small">
          Check Permissions
        </Button>
      </div>

      {debugInfo.permissions && (
        <>
          <Title level={5}>Permissions</Title>
          <div>
            <Tag color={debugInfo.permissions.microphone === 'granted' ? 'green' : 'red'}>
              Microphone: {debugInfo.permissions.microphone}
            </Tag>
            <Tag color={debugInfo.permissions.camera === 'granted' ? 'green' : 'red'}>
              Camera: {debugInfo.permissions.camera}
            </Tag>
          </div>
          <Divider />
        </>
      )}

      {debugInfo.error && (
        <>
          <Title level={5}>Error</Title>
          <Text type="danger">{debugInfo.errorName}: {debugInfo.error}</Text>
          <Divider />
        </>
      )}

      {stream && (
        <>
          <Title level={5}>Stream Info</Title>
          <Text>Stream ID: {debugInfo.streamId}</Text>
          <br />
          <Text>Audio Tracks: {debugInfo.audioTracks?.length || 0}</Text>
          <br />
          <Text>Video Tracks: {debugInfo.videoTracks?.length || 0}</Text>
          <Divider />
        </>
      )}

      {debugInfo.audioTracks && debugInfo.audioTracks.length > 0 && (
        <>
          <Title level={5}>Audio Tracks</Title>
          {debugInfo.audioTracks.map((track: any, index: number) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Text strong>Track {index + 1}:</Text>
              <br />
              <Text>Label: {track.label || 'Default'}</Text>
              <br />
              <Text>State: </Text>
              <Tag color={track.readyState === 'live' ? 'green' : 'red'}>
                {track.readyState}
              </Tag>
              <Tag color={track.enabled ? 'green' : 'red'}>
                {track.enabled ? 'Enabled' : 'Disabled'}
              </Tag>
              <Tag color={track.muted ? 'red' : 'green'}>
                {track.muted ? 'Muted' : 'Unmuted'}
              </Tag>
            </div>
          ))}
          <Divider />
        </>
      )}

      {debugInfo.videoTracks && debugInfo.videoTracks.length > 0 && (
        <>
          <Title level={5}>Video Tracks</Title>
          {debugInfo.videoTracks.map((track: any, index: number) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Text strong>Track {index + 1}:</Text>
              <br />
              <Text>Label: {track.label || 'Default'}</Text>
              <br />
              <Text>State: </Text>
              <Tag color={track.readyState === 'live' ? 'green' : 'red'}>
                {track.readyState}
              </Tag>
              <Tag color={track.enabled ? 'green' : 'red'}>
                {track.enabled ? 'Enabled' : 'Disabled'}
              </Tag>
              <Tag color={track.muted ? 'red' : 'green'}>
                {track.muted ? 'Muted' : 'Unmuted'}
              </Tag>
            </div>
          ))}
          <Divider />
        </>
      )}

      {stream && (
        <>
          <Title level={5}>Live Test</Title>
          <video
            ref={(video) => {
              if (video && stream) {
                video.srcObject = stream
                video.play().catch(console.error)
              }
            }}
            style={{ width: '100%', maxHeight: 200 }}
            autoPlay
            muted
            playsInline
          />
        </>
      )}
    </Card>
  )
}

export default WebRTCDebugPanel