import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Space, Tooltip } from 'antd'
import { AudioOutlined, AudioMutedOutlined, VideoCameraOutlined, VideoCameraAddOutlined } from '@ant-design/icons'
import { RootState } from '../store'
import { toggleAudio, toggleVideo } from '../store/gameSlice'

const ControlPanel: React.FC = () => {
  const dispatch = useDispatch()
  const { isAudioEnabled, isVideoEnabled } = useSelector((state: RootState) => state.game)
  const { onlineUsers } = useSelector((state: RootState) => state.user)

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 8,
      padding: '12px 20px',
      backdropFilter: 'blur(10px)'
    }}>
      <Space size="middle">
        <Tooltip title={isAudioEnabled ? '静音' : '开启麦克风'}>
          <Button
            type={isAudioEnabled ? 'primary' : 'default'}
            shape="circle"
            icon={isAudioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
            onClick={() => dispatch(toggleAudio())}
          />
        </Tooltip>
        
        <Tooltip title={isVideoEnabled ? '关闭摄像头' : '开启摄像头'}>
          <Button
            type={isVideoEnabled ? 'primary' : 'default'}
            shape="circle"
            icon={isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
            onClick={() => dispatch(toggleVideo())}
          />
        </Tooltip>

        <div style={{ color: 'white', fontSize: '14px' }}>
          在线用户: {onlineUsers.length + 1} {/* +1 for current user */}
        </div>
      </Space>
    </div>
  )
}

export default ControlPanel