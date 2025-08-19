// Seasonal theme system for Chinese cultural elements
export interface SeasonalTheme {
  id: string
  name: string
  nameChinese: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  decorations: {
    lanterns?: boolean
    plumBlossoms?: boolean
    bamboo?: boolean
    lotus?: boolean
    maple?: boolean
    snow?: boolean
  }
  festival?: {
    name: string
    elements: string[]
  }
}

export const SEASONAL_THEMES: Record<string, SeasonalTheme> = {
  spring: {
    id: 'spring',
    name: 'Spring Festival',
    nameChinese: '春节主题',
    description: '新春佳节，红红火火',
    colors: {
      primary: '#DC143C', // Chinese red
      secondary: '#FFD700', // Gold
      accent: '#FF6347', // Warm red
      background: '#FFF8DC', // Cornsilk
      text: '#8B0000' // Dark red
    },
    decorations: {
      lanterns: true,
      plumBlossoms: true,
      bamboo: false,
      lotus: false,
      maple: false,
      snow: false
    },
    festival: {
      name: '春节',
      elements: ['红包', '对联', '鞭炮', '舞龙']
    }
  },
  
  summer: {
    id: 'summer',
    name: 'Dragon Boat Festival',
    nameChinese: '端午主题',
    description: '夏日清香，龙舟竞渡',
    colors: {
      primary: '#228B22', // Forest green
      secondary: '#32CD32', // Lime green
      accent: '#98FB98', // Pale green
      background: '#F0FFF0', // Honeydew
      text: '#006400' // Dark green
    },
    decorations: {
      lanterns: false,
      plumBlossoms: false,
      bamboo: true,
      lotus: true,
      maple: false,
      snow: false
    },
    festival: {
      name: '端午节',
      elements: ['粽子', '龙舟', '艾草', '香囊']
    }
  },

  autumn: {
    id: 'autumn',
    name: 'Mid-Autumn Festival',
    nameChinese: '中秋主题',
    description: '金桂飘香，月圆人团圆',
    colors: {
      primary: '#CD853F', // Peru
      secondary: '#DEB887', // Burlywood
      accent: '#F4A460', // Sandy brown
      background: '#FFF8DC', // Cornsilk
      text: '#8B4513' // Saddle brown
    },
    decorations: {
      lanterns: true,
      plumBlossoms: false,
      bamboo: false,
      lotus: false,
      maple: true,
      snow: false
    },
    festival: {
      name: '中秋节',
      elements: ['月饼', '桂花', '玉兔', '嫦娥']
    }
  },

  winter: {
    id: 'winter',
    name: 'Winter Solstice',
    nameChinese: '冬至主题',
    description: '雪花纷飞，温暖如春',
    colors: {
      primary: '#4682B4', // Steel blue
      secondary: '#B0C4DE', // Light steel blue
      accent: '#E6E6FA', // Lavender
      background: '#F8F8FF', // Ghost white
      text: '#2F4F4F' // Dark slate gray
    },
    decorations: {
      lanterns: false,
      plumBlossoms: true,
      bamboo: true,
      lotus: false,
      maple: false,
      snow: true
    },
    festival: {
      name: '冬至',
      elements: ['饺子', '汤圆', '梅花', '雪花']
    }
  },

  business: {
    id: 'business',
    name: 'Professional',
    nameChinese: '商务主题',
    description: '专业商务，简约大气',
    colors: {
      primary: '#1890ff', // Ant Design blue
      secondary: '#722ed1', // Ant Design purple
      accent: '#52c41a', // Ant Design green
      background: '#f0f2f5', // Light gray
      text: '#262626' // Dark gray
    },
    decorations: {
      lanterns: false,
      plumBlossoms: false,
      bamboo: false,
      lotus: false,
      maple: false,
      snow: false
    }
  }
}

export class ThemeManager {
  private currentTheme: SeasonalTheme = SEASONAL_THEMES.business
  private callbacks: Array<(theme: SeasonalTheme) => void> = []

  constructor() {
    // Auto-detect seasonal theme based on current date
    this.autoDetectSeason()
  }

  private autoDetectSeason() {
    const now = new Date()
    const month = now.getMonth() + 1 // JavaScript months are 0-indexed
    const day = now.getDate()

    // Chinese festival dates (approximate, as they follow lunar calendar)
    if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
      this.setTheme('spring') // Spring Festival period
    } else if (month === 6 && day >= 10 && day <= 20) {
      this.setTheme('summer') // Dragon Boat Festival period
    } else if (month === 9 && day >= 10 && day <= 25) {
      this.setTheme('autumn') // Mid-Autumn Festival period
    } else if (month === 12 && day >= 20) {
      this.setTheme('winter') // Winter Solstice period
    } else {
      this.setTheme('business') // Default business theme
    }
  }

  setTheme(themeId: string) {
    const theme = SEASONAL_THEMES[themeId]
    if (theme) {
      this.currentTheme = theme
      this.notifyCallbacks()
      console.log(`🎨 Theme changed to: ${theme.nameChinese}`)
    }
  }

  getCurrentTheme(): SeasonalTheme {
    return this.currentTheme
  }

  getAllThemes(): SeasonalTheme[] {
    return Object.values(SEASONAL_THEMES)
  }

  subscribe(callback: (theme: SeasonalTheme) => void) {
    this.callbacks.push(callback)
    // Immediately call with current theme
    callback(this.currentTheme)
  }

  unsubscribe(callback: (theme: SeasonalTheme) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback)
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.currentTheme))
  }

  // Apply theme to CSS variables
  applyThemeToCSS() {
    const theme = this.currentTheme
    const root = document.documentElement

    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-text', theme.colors.text)
  }

  // Get festival-specific decorations for the office scene
  getOfficeDecorations() {
    const theme = this.currentTheme
    const decorations = []

    if (theme.decorations.lanterns) {
      decorations.push({
        type: 'lantern',
        color: theme.colors.primary,
        positions: [
          { x: 400, y: 120 },
          { x: 800, y: 120 },
          { x: 600, y: 140 }
        ]
      })
    }

    if (theme.decorations.plumBlossoms) {
      decorations.push({
        type: 'plumBlossom',
        color: '#FFB6C1', // Light pink
        positions: [
          { x: 150, y: 100 },
          { x: 1050, y: 100 },
          { x: 500, y: 80 }
        ]
      })
    }

    if (theme.decorations.bamboo) {
      decorations.push({
        type: 'bamboo',
        color: '#228B22',
        positions: [
          { x: 80, y: 400 },
          { x: 1120, y: 400 },
          { x: 200, y: 600 }
        ]
      })
    }

    if (theme.decorations.lotus) {
      decorations.push({
        type: 'lotus',
        color: '#FFB6C1',
        positions: [
          { x: 1000, y: 580 } // In the zen garden pond
        ]
      })
    }

    if (theme.decorations.maple) {
      decorations.push({
        type: 'maple',
        color: '#FF4500', // Orange red
        positions: [
          { x: 100, y: 200 },
          { x: 1100, y: 200 },
          { x: 600, y: 700 }
        ]
      })
    }

    if (theme.decorations.snow) {
      decorations.push({
        type: 'snow',
        color: '#FFFFFF',
        positions: [] // Snow will be handled as a scene effect
      })
    }

    return decorations
  }
}

// Export singleton instance
export const themeManager = new ThemeManager()