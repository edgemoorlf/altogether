import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Layout, Typography, Button, Dropdown } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { RootState, AppDispatch } from './store'
import { logout } from './store/authSlice'
import { apiService } from './services/apiService'
import { themeManager } from './services/themeService'
import { setupDebugConsole } from './utils/debugConsole'
import VirtualOffice from './components/VirtualOffice'
import ProtectedRoute from './components/ProtectedRoute'
import UserProfileModal from './components/UserProfileModal'
import './App.css'
import './styles/chinese-design-system.css'

const { Header, Content } = Layout
const { Title } = Typography

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    // Initialize application
    console.log('Altogether (在一起) - Virtual Office Platform Initialized')
    
    // Setup debug console helpers
    setupDebugConsole()
    
    // Initialize theme system and apply CSS variables
    themeManager.applyThemeToCSS()
    
    // Subscribe to theme changes
    const handleThemeChange = () => {
      themeManager.applyThemeToCSS()
    }
    
    themeManager.subscribe(handleThemeChange)
    
    // Cleanup subscription on unmount
    return () => {
      themeManager.unsubscribe(handleThemeChange)
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API (optional, as we clear local storage anyway)
      await apiService.logout()
    } catch (error) {
      console.log('Logout API call failed, but continuing with local logout')
    } finally {
      // Always dispatch logout to clear Redux state and localStorage
      dispatch(logout())
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => {
        setShowProfileModal(true)
      }
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => {
        // TODO: Open settings modal
        console.log('打开设置')
      }
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout
    }
  ]

  return (
    <ProtectedRoute>
      <Layout className="app-layout">
        <Header className="app-header">
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            在一起 Altogether
          </Title>
          
          {isAuthenticated && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                欢迎，{user.username}
              </span>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="text"
                  shape="circle"
                  style={{
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%'
                    }}
                  />
                </Button>
              </Dropdown>
            </div>
          )}
        </Header>
        <Content className="app-content">
          <VirtualOffice />
        </Content>
      </Layout>

      <UserProfileModal
        visible={showProfileModal}
        onCancel={() => setShowProfileModal(false)}
      />
    </ProtectedRoute>
  )
}

export default App