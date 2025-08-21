# Altogether (在一起) - Virtual Office Platform

A Chinese remote team collaboration platform providing immersive virtual office experiences.

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev          # Web frontend (port 3000)
npm run server:dev   # Backend server (port 3001)

# Build for production
npm run build
```

## Project Structure

```
altogether/
├── packages/
│   ├── web/         # React + Phaser.js web application
│   ├── server/      # Node.js + Socket.IO backend
│   ├── shared/      # Shared types and utilities
│   ├── desktop/     # Electron apps (coming soon)
│   └── mobile/      # React Native apps (coming soon)
├── docs/           # Documentation
└── ...
```

## Features

- 🏢 **Virtual Office Spaces** - 2D virtual environments with spatial audio
- 💬 **Real-time Communication** - Text chat, voice, and video calls
- 🎮 **Interactive Avatars** - Move around and interact naturally
- 🇨🇳 **Chinese Localization** - Full Chinese language support
- 📱 **Cross-platform** - Web, desktop, and mobile support

## Tech Stack

- **Frontend**: React 18, TypeScript, Phaser.js, Ant Design
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL, Redis, MongoDB
- **Real-time**: WebRTC for peer-to-peer communication

## Development

### Debug Console

The application includes a powerful debug console for developers. Open browser devtools (F12) and use these commands:

```javascript
// WebRTC Debug Panel - Shows real-time audio/video testing interface
debug.showWebRTC()    // Show WebRTC debug panel
debug.hideWebRTC()    // Hide WebRTC debug panel
debug.toggleWebRTC()  // Toggle WebRTC panel on/off

// Future debug features (coming soon)
debug.showGame()      // Game debug information
debug.showSocket()    // Socket connection debug

// Utility commands
debug.help()          // Show all available commands
debug.status()        // Show current debug panel states
debug.showAll()       // Enable all debug features
debug.hideAll()       // Disable all debug features
```

**Example usage:**
1. Open browser console (F12)
2. Type `debug.help()` to see all commands
3. Use `debug.showWebRTC()` to display the WebRTC testing panel
4. Test camera/microphone permissions and real-time functionality

### Package Documentation

Each package has its own README with detailed setup instructions:

- [Web App](./packages/web/README.md)
- [Server](./packages/server/README.md)
- [Shared](./packages/shared/README.md)

## License

MIT © Altogether Team