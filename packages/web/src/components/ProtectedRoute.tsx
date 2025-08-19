import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { initializeAuth } from '../store/authSlice'
import AuthModal from './AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth)
  const [showAuthModal, setShowAuthModal] = React.useState(false)

  useEffect(() => {
    // Initialize auth state from localStorage on component mount
    dispatch(initializeAuth())
  }, [dispatch])

  useEffect(() => {
    // Show auth modal if not authenticated and not loading
    if (!isAuthenticated && !loading) {
      setShowAuthModal(true)
    } else {
      setShowAuthModal(false)
    }
  }, [isAuthenticated, loading])

  const handleAuthModalCancel = () => {
    // Don't allow closing the modal without authentication
    // User must login or register to continue
    if (!isAuthenticated) {
      setShowAuthModal(true)
    }
  }

  return (
    <>
      {isAuthenticated ? (
        children
      ) : (
        <div style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          flexDirection: 'column'
        }}>
          <div style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            在一起 Altogether
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            新一代虚拟办公室协作平台<br />
            与团队成员实时交流，打造沉浸式办公体验
          </div>
        </div>
      )}

      <AuthModal
        visible={showAuthModal}
        onCancel={handleAuthModalCancel}
      />
    </>
  )
}

export default ProtectedRoute