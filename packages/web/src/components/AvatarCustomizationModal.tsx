import React, { useState } from 'react'
import { Modal, Tabs, Card, Button, Row, Col, Typography, Divider } from 'antd'
import { HeartOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { updateUser } from '../store/authSlice'
import { apiService } from '../services/apiService'

const { Title, Text } = Typography

interface AvatarCustomizationModalProps {
  visible: boolean
  onCancel: () => void
}

// Chinese-style avatar options
const AVATAR_STYLES = {
  classic: {
    name: '经典风格',
    description: '传统商务形象',
    seeds: ['classic1', 'classic2', 'classic3', 'classic4', 'classic5', 'classic6']
  },
  modern: {
    name: '现代风格', 
    description: '时尚都市形象',
    seeds: ['modern1', 'modern2', 'modern3', 'modern4', 'modern5', 'modern6']
  },
  casual: {
    name: '休闲风格',
    description: '轻松自在形象',
    seeds: ['casual1', 'casual2', 'casual3', 'casual4', 'casual5', 'casual6']
  },
  professional: {
    name: '专业风格',
    description: '精英职场形象',
    seeds: ['prof1', 'prof2', 'prof3', 'prof4', 'prof5', 'prof6']
  }
}

const AVATAR_THEMES = {
  spring: {
    name: '春意盎然',
    description: '清新春日主题',
    modifier: 'spring'
  },
  autumn: {
    name: '金秋时节',
    description: '温暖秋日主题', 
    modifier: 'autumn'
  },
  festival: {
    name: '节日庆典',
    description: '传统节日主题',
    modifier: 'festival'
  },
  business: {
    name: '商务正装',
    description: '正式商务主题',
    modifier: 'business'
  }
}

const AVATAR_ACCESSORIES = [
  { id: 'glasses', name: '眼镜', icon: '👓' },
  { id: 'hat', name: '帽子', icon: '🎩' },
  { id: 'scarf', name: '围巾', icon: '🧣' },
  { id: 'tie', name: '领带', icon: '👔' },
  { id: 'earrings', name: '耳环', icon: '💎' },
  { id: 'watch', name: '手表', icon: '⌚' }
]

const AvatarCustomizationModal: React.FC<AvatarCustomizationModalProps> = ({ visible, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [selectedStyle, setSelectedStyle] = useState('classic')
  const [selectedTheme, setSelectedTheme] = useState('business')
  const [selectedSeed, setSelectedSeed] = useState(0)
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Generate avatar URL based on selections
  const generateAvatarUrl = (style: string, theme: string, seed: number, accessories: string[] = []) => {
    const styleSeed = AVATAR_STYLES[style as keyof typeof AVATAR_STYLES].seeds[seed]
    const themeModifier = AVATAR_THEMES[theme as keyof typeof AVATAR_THEMES].modifier
    const accessoryParams = accessories.length > 0 ? `&accessories=${accessories.join(',')}` : ''
    
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${styleSeed}-${themeModifier}-${user?.username}${accessoryParams}&backgroundColor=f0f0f0`
  }

  const currentAvatarUrl = generateAvatarUrl(selectedStyle, selectedTheme, selectedSeed, selectedAccessories)

  const handleStyleSelect = (styleKey: string) => {
    setSelectedStyle(styleKey)
    setSelectedSeed(0) // Reset seed when changing style
  }

  const handleAccessoryToggle = (accessoryId: string) => {
    setSelectedAccessories(prev => 
      prev.includes(accessoryId) 
        ? prev.filter(id => id !== accessoryId)
        : [...prev, accessoryId]
    )
  }

  const handleSaveAvatar = async () => {
    if (!user) return

    setLoading(true)
    try {
      const newAvatarUrl = currentAvatarUrl
      
      const response = await apiService.updateProfile({
        avatar: newAvatarUrl
      })

      if (response.success && response.data) {
        dispatch(updateUser({
          avatar: newAvatarUrl
        }))
        
        // Update localStorage
        const updatedUser = { ...user, avatar: newAvatarUrl }
        localStorage.setItem('user_data', JSON.stringify(updatedUser))
        
        onCancel()
      }
    } catch (error: any) {
      console.error('Failed to update avatar:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRandomAvatar = () => {
    const styles = Object.keys(AVATAR_STYLES)
    const themes = Object.keys(AVATAR_THEMES)
    
    const randomStyle = styles[Math.floor(Math.random() * styles.length)]
    const randomTheme = themes[Math.floor(Math.random() * themes.length)]
    const randomSeed = Math.floor(Math.random() * 6)
    const randomAccessories = AVATAR_ACCESSORIES
      .filter(() => Math.random() > 0.7)
      .map(acc => acc.id)
    
    setSelectedStyle(randomStyle)
    setSelectedTheme(randomTheme)
    setSelectedSeed(randomSeed)
    setSelectedAccessories(randomAccessories)
  }

  const styleOptions = (
    <Row gutter={[16, 16]}>
      {Object.entries(AVATAR_STYLES).map(([key, style]) => (
        <Col span={12} key={key}>
          <Card
            hoverable
            className={selectedStyle === key ? 'selected-card' : ''}
            onClick={() => handleStyleSelect(key)}
            style={{
              border: selectedStyle === key ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: '8px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <img
                src={generateAvatarUrl(key, selectedTheme, 0)}
                alt={style.name}
                style={{ width: 60, height: 60, borderRadius: '50%' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text strong>{style.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>{style.description}</Text>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const themeOptions = (
    <Row gutter={[16, 16]}>
      {Object.entries(AVATAR_THEMES).map(([key, theme]) => (
        <Col span={12} key={key}>
          <Card
            hoverable
            className={selectedTheme === key ? 'selected-card' : ''}
            onClick={() => setSelectedTheme(key)}
            style={{
              border: selectedTheme === key ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: '8px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <img
                src={generateAvatarUrl(selectedStyle, key, selectedSeed)}
                alt={theme.name}
                style={{ width: 60, height: 60, borderRadius: '50%' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text strong>{theme.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>{theme.description}</Text>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const seedOptions = (
    <Row gutter={[8, 8]}>
      {AVATAR_STYLES[selectedStyle as keyof typeof AVATAR_STYLES].seeds.map((_, index) => (
        <Col span={8} key={index}>
          <Card
            hoverable
            onClick={() => setSelectedSeed(index)}
            style={{
              border: selectedSeed === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: '8px',
              textAlign: 'center',
              padding: '8px'
            }}
          >
            <img
              src={generateAvatarUrl(selectedStyle, selectedTheme, index, selectedAccessories)}
              alt={`变体 ${index + 1}`}
              style={{ width: 50, height: 50, borderRadius: '50%' }}
            />
            <div style={{ marginTop: 4, fontSize: '12px' }}>变体 {index + 1}</div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const accessoryOptions = (
    <Row gutter={[8, 8]}>
      {AVATAR_ACCESSORIES.map(accessory => (
        <Col span={8} key={accessory.id}>
          <Card
            hoverable
            onClick={() => handleAccessoryToggle(accessory.id)}
            style={{
              border: selectedAccessories.includes(accessory.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: '8px',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: selectedAccessories.includes(accessory.id) ? '#f0f8ff' : 'white'
            }}
          >
            <div style={{ fontSize: '24px' }}>{accessory.icon}</div>
            <div style={{ marginTop: 4, fontSize: '12px' }}>{accessory.name}</div>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const tabItems = [
    {
      key: 'style',
      label: '风格选择',
      children: styleOptions
    },
    {
      key: 'theme',
      label: '主题装扮',
      children: themeOptions
    },
    {
      key: 'variant',
      label: '外观变体',
      children: seedOptions
    },
    {
      key: 'accessories',
      label: '配饰装扮',
      children: accessoryOptions
    }
  ]

  return (
    <Modal
      title="头像定制"
      open={visible}
      onCancel={onCancel}
      width={720}
      centered
      footer={[
        <Button key="random" onClick={generateRandomAvatar}>
          <StarOutlined /> 随机生成
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSaveAvatar}>
          <HeartOutlined /> 保存头像
        </Button>
      ]}
    >
      <Row gutter={24}>
        <Col span={8}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4}>
              <CrownOutlined style={{ color: '#1890ff' }} /> 预览效果
            </Title>
            <div style={{
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              border: '2px dashed #d9d9d9'
            }}>
              <img
                src={currentAvatarUrl}
                alt="Avatar Preview"
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <div style={{ marginTop: 12 }}>
                <Text strong style={{ fontSize: '16px' }}>
                  {user?.username}
                </Text>
                <br />
                <Text type="secondary">
                  {AVATAR_STYLES[selectedStyle as keyof typeof AVATAR_STYLES].name} · {AVATAR_THEMES[selectedTheme as keyof typeof AVATAR_THEMES].name}
                </Text>
              </div>
            </div>
          </div>
        </Col>
        
        <Col span={16}>
          <Tabs
            items={tabItems}
            size="small"
            tabBarStyle={{ marginBottom: 16 }}
          />
        </Col>
      </Row>
      
      <Divider />
      
      <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
        💡 提示：选择不同的风格和主题来打造您独特的虚拟形象
      </div>
    </Modal>
  )
}

export default AvatarCustomizationModal