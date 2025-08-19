// Theme System Test Script
// Run this in browser console to test theme functionality

console.log('🎨 Testing Theme System...')

// Import theme manager (this would be available in browser context)
// const { themeManager, SEASONAL_THEMES } = require('./src/services/themeService')

// Test 1: Check current theme
console.log('Current Theme:', {
  id: window.themeManager?.getCurrentTheme()?.id || 'themeManager not available',
  name: window.themeManager?.getCurrentTheme()?.nameChinese || 'N/A'
})

// Test 2: Check all available themes
console.log('Available Themes:', window.SEASONAL_THEMES ? Object.keys(window.SEASONAL_THEMES) : 'SEASONAL_THEMES not available')

// Test 3: Test theme switching
const themes = ['spring', 'summer', 'autumn', 'winter', 'business']
themes.forEach((themeId, index) => {
  setTimeout(() => {
    if (window.themeManager) {
      console.log(`Switching to theme: ${themeId}`)
      window.themeManager.setTheme(themeId)
      
      // Check CSS variables
      const root = document.documentElement
      const primaryColor = getComputedStyle(root).getPropertyValue('--theme-primary')
      console.log(`Theme ${themeId} primary color:`, primaryColor)
    }
  }, index * 2000) // Switch every 2 seconds
})

// Test 4: Check seasonal auto-detection
setTimeout(() => {
  if (window.themeManager) {
    console.log('🌸 Testing seasonal auto-detection...')
    
    // Mock different dates to test auto-detection
    const testDates = [
      new Date('2024-02-10'), // Spring Festival
      new Date('2024-06-15'), // Dragon Boat Festival
      new Date('2024-09-15'), // Mid-Autumn Festival
      new Date('2024-12-21'), // Winter Solstice
      new Date('2024-07-01')  // Regular business day
    ]
    
    testDates.forEach((testDate, index) => {
      console.log(`Testing date: ${testDate.toDateString()}`)
      // This would require modifying the themeManager to accept test dates
      // For now, just log what theme should be active
      const month = testDate.getMonth() + 1
      const day = testDate.getDate()
      
      let expectedTheme = 'business'
      if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
        expectedTheme = 'spring'
      } else if (month === 6 && day >= 10 && day <= 20) {
        expectedTheme = 'summer'
      } else if (month === 9 && day >= 10 && day <= 25) {
        expectedTheme = 'autumn'
      } else if (month === 12 && day >= 20) {
        expectedTheme = 'winter'
      }
      
      console.log(`Expected theme for ${testDate.toDateString()}: ${expectedTheme}`)
    })
  }
}, 10000) // Run after 10 seconds

console.log('🎨 Theme system test script loaded. Check console for results.')