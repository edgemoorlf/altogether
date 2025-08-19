import React, { useState } from 'react'
import { Modal, Form, Input, Button, Avatar, message, Space } from 'antd'
import { UserOutlined, MailOutlined, CameraOutlined, CrownOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { updateUser } from '../store/authSlice'
import { apiService } from '../services/apiService'
import AvatarCustomizationModal from './AvatarCustomizationModal'

interface UserProfileModalProps {
  visible: boolean
  onCancel: () => void
}

interface ProfileForm {
  username: string
  email: string
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '')
  const [showAvatarCustomization, setShowAvatarCustomization] = useState(false)

  // Generate new avatar based on username
  const generateNewAvatar = (username: string) => {
    const seed = username + Date.now() // Add timestamp for uniqueness
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
  }

  const handleSave = async (values: ProfileForm) => {
    if (!user) return

    setLoading(true)
    try {
      console.log('更新个人资料:', values)

      // Call real API
      const response = await apiService.updateProfile({
        username: values.username,
        email: values.email,
        avatar: avatarUrl
      })

      if (response.success && response.data) {
        dispatch(updateUser({
          username: response.data.user.username,
          email: response.data.user.email,
          avatar: response.data.user.avatar
        }))
        
        // Update localStorage
        const updatedUser = { ...user, ...response.data.user }
        localStorage.setItem('user_data', JSON.stringify(updatedUser))
        
        message.success('个人资料更新成功！')
        onCancel()
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error: any) {
      console.error('更新失败:', error)
      message.error(error.message || '个人资料更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAvatar = () => {
    if (!user) return
    const newAvatar = generateNewAvatar(user.username)
    setAvatarUrl(newAvatar)
    message.info('已生成新头像')
  }

  // Initialize form values when modal opens
  React.useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email
      })
      setAvatarUrl(user.avatar)
    }
  }, [visible, user, form])

  if (!user) return null

  return (
    <Modal
      title="个人资料"
      open={visible}
      onCancel={onCancel}
      width={500}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          保存
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        size="large"
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={80}
            src={avatarUrl}
            icon={<UserOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button
                type="link"
                icon={<CameraOutlined />}
                onClick={handleGenerateAvatar}
              >
                快速生成
              </Button>
              <Button
                type="primary"
                icon={<CrownOutlined />}
                onClick={() => setShowAvatarCustomization(true)}
              >
                定制头像
              </Button>
            </Space>
          </div>
        </div>

        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱地址"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱地址"
          />
        </Form.Item>

        <div style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 8,
          marginTop: 16
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>账户信息</h4>
          <Space direction="vertical" size="small">
            <div style={{ fontSize: '12px', color: '#999' }}>
              用户ID: {user.id}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              在线状态: {user.isOnline ? '在线' : '离线'}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              连接状态: {user.socketId ? '已连接' : '未连接'}
            </div>
          </Space>
        </div>
      </Form>

      <AvatarCustomizationModal
        visible={showAvatarCustomization}
        onCancel={() => {
          setShowAvatarCustomization(false)
          // Refresh avatar URL when customization is closed
          if (user) {
            setAvatarUrl(user.avatar)
          }
        }}
      />
    </Modal>
  )
}

export default UserProfileModal