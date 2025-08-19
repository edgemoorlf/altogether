import React, { useState } from 'react'
import { Modal, Tabs, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { login, register } from '../store/authSlice'
import { apiService } from '../services/apiService'

interface AuthModalProps {
  visible: boolean
  onCancel: () => void
}

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  const handleLogin = async (values: LoginForm) => {
    setLoading(true)
    try {
      console.log('登录:', values)
      
      // Call real API
      const response = await apiService.login({
        username: values.username,
        password: values.password
      })

      if (response.success && response.data) {
        dispatch(login({
          user: {
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email,
            avatar: response.data.user.avatar,
            isOnline: response.data.user.isOnline,
            socketId: response.data.user.socketId || ''
          },
          token: response.data.token
        }))
        message.success('登录成功！')
        onCancel()
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      message.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: RegisterForm) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      console.log('注册:', values)
      
      // Call real API
      const response = await apiService.register({
        username: values.username,
        email: values.email,
        password: values.password
      })

      if (response.success && response.data) {
        dispatch(register({
          user: {
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email,
            avatar: response.data.user.avatar,
            isOnline: response.data.user.isOnline,
            socketId: response.data.user.socketId || ''
          },
          token: response.data.token
        }))
        message.success('注册成功！')
        onCancel()
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      message.error(error.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{ width: '100%' }}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  )

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
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

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        rules={[
          { required: true, message: '请确认密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{ width: '100%' }}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  )

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginForm,
    },
    {
      key: 'register',
      label: '注册',
      children: registerForm,
    },
  ]

  return (
    <Modal
      title="欢迎来到 在一起 Altogether"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ marginBottom: 16, textAlign: 'center', color: '#666' }}>
        登录或注册以开始使用虚拟办公室
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        centered
      />

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: '12px', color: '#999' }}>
        首次使用？点击上方"注册"标签创建账户
      </div>
    </Modal>
  )
}

export default AuthModal