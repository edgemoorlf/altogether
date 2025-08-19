import React from 'react'
import { Button, Space, Typography, Card } from 'antd'
import { themeManager, SEASONAL_THEMES } from '../services/themeService'

const { Text, Title } = Typography

const ThemeTestPanel: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme())

  React.useEffect(() => {
    const handleThemeChange = (theme: any) => {
      setCurrentTheme(theme)
    }

    themeManager.subscribe(handleThemeChange)
    return () => themeManager.unsubscribe(handleThemeChange)
  }, [])

  const handleThemeSwitch = (themeId: string) => {
    themeManager.setTheme(themeId)
  }

  return (
    <Card
      title="🎨 主题测试面板 Theme Test Panel"
      style={{
        position: 'fixed',
        top: 100,
        right: 20,
        width: 300,
        zIndex: 1000,
        backgroundColor: 'var(--theme-background)',
        borderColor: 'var(--theme-primary)'
      }}
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ margin: 0, color: 'var(--theme-text)' }}>
            当前主题 Current Theme
          </Title>
          <Text style={{ color: 'var(--theme-secondary)' }}>
            {currentTheme.nameChinese} - {currentTheme.name}
          </Text>
        </div>

        <div>
          <Text strong style={{ color: 'var(--theme-text)' }}>切换主题 Switch Theme:</Text>
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              {Object.entries(SEASONAL_THEMES).map(([key, theme]) => (
                <Button
                  key={key}
                  size="small"
                  type={currentTheme.id === key ? 'primary' : 'default'}
                  onClick={() => handleThemeSwitch(key)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    height: 'auto'
                  }}
                >
                  {theme.nameChinese}
                </Button>
              ))}
            </Space>
          </div>
        </div>

        <div style={{
          padding: 8,
          backgroundColor: 'var(--theme-primary)',
          color: 'white',
          borderRadius: 4,
          fontSize: '12px'
        }}>
          🎉 主题色彩预览 Theme Colors Preview
        </div>

        {currentTheme.festival && (
          <div style={{
            padding: 8,
            backgroundColor: 'var(--theme-secondary)',
            color: 'var(--theme-text)',
            borderRadius: 4,
            fontSize: '12px'
          }}>
            🎊 节日主题: {currentTheme.festival.name}
          </div>
        )}
      </Space>
    </Card>
  )
}

export default ThemeTestPanel