import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Button, Input, List, Avatar, Typography } from 'antd'
import { SendOutlined, MessageOutlined, CloseOutlined } from '@ant-design/icons'
import { RootState } from '../store'
import { socketService } from '../services/socketService'

const { Text } = Typography

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: string
  isOwn: boolean
}

const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useSelector((state: RootState) => state.user)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Listen for chat messages
    const handleChatMessage = (event: CustomEvent) => {
      const { userId, username, message, timestamp } = event.detail
      const newMessage: ChatMessage = {
        id: `${userId}-${Date.now()}`,
        userId,
        username,
        message,
        timestamp,
        isOwn: userId === socketService.socketId
      }
      setMessages(prev => [...prev, newMessage])
    }

    window.addEventListener('chatMessage', handleChatMessage as EventListener)
    return () => {
      window.removeEventListener('chatMessage', handleChatMessage as EventListener)
    }
  }, [])

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const message = inputValue.trim()
    const timestamp = new Date().toISOString()
    
    // Add own message immediately
    const ownMessage: ChatMessage = {
      id: `own-${Date.now()}`,
      userId: socketService.socketId || 'unknown',
      username: currentUser?.username || '我',
      message,
      timestamp,
      isOwn: true
    }
    setMessages(prev => [...prev, ownMessage])

    // Send to server
    socketService.sendChatMessage(message)
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Chat toggle button */}
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      />

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 320,
          height: 400,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
            borderRadius: '8px 8px 0 0'
          }}>
            <Text strong>聊天室</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              {messages.length} 条消息
            </Text>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px 0'
          }}>
            <List
              dataSource={messages}
              renderItem={(msg) => (
                <List.Item
                  style={{
                    padding: '4px 16px',
                    borderBottom: 'none',
                    justifyContent: msg.isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    textAlign: msg.isOwn ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 4,
                      justifyContent: msg.isOwn ? 'flex-end' : 'flex-start'
                    }}>
                      {!msg.isOwn && (
                        <Avatar size="small" style={{ marginRight: 8 }}>
                          {msg.username[0]}
                        </Avatar>
                      )}
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {msg.isOwn ? '我' : msg.username} • {formatTime(msg.timestamp)}
                      </Text>
                      {msg.isOwn && (
                        <Avatar size="small" style={{ marginLeft: 8 }}>
                          我
                        </Avatar>
                      )}
                    </div>
                    <div style={{
                      background: msg.isOwn ? '#1890ff' : '#f6f6f6',
                      color: msg.isOwn ? 'white' : '#333',
                      padding: '8px 12px',
                      borderRadius: 8,
                      display: 'inline-block',
                      wordBreak: 'break-word'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: 12,
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa'
          }}>
            <Input.Group compact>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                style={{ width: 'calc(100% - 40px)' }}
                maxLength={500}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                style={{ width: 40 }}
              />
            </Input.Group>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatPanel