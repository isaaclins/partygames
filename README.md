# Party Games PWA

A mobile-first Progressive Web Application for real-time multiplayer party games. Built with React,
TypeScript, and Node.js with WebSocket support for live gameplay.

## 🎮 Features

- **Real-time Multiplayer**: Live gameplay with WebSocket connections
- **Mobile-First Design**: Optimized for touch devices and mobile browsers
- **Progressive Web App**: Installable, offline-capable, and app-like experience
- **Multiple Games**: Growing collection of party games for groups
- **No Registration**: Jump right into games with simple lobby codes
- **Cross-Platform**: Works on iOS, Android, and desktop browsers

## 🎯 Planned Games

- **Quick Draw**: Drawing and guessing game with real-time canvas sharing
- **Two Truths and a Lie**: Social deduction with voting mechanics
- **Word Association Chain**: Fast-paced word connection game

## 🏗️ Architecture

### Frontend

- **React 18+** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for mobile-first responsive design
- **PWA** with Service Workers for offline capability
- **Deployment**: GitHub Pages

### Backend

- **Node.js** with TypeScript
- **Express.js** with WebSocket support
- **In-memory state** for lobbies and games (no database)
- **CORS** configured for GitHub Pages
- **Deployment**: Render

## 📁 Project Structure

```
partygames/
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route-based pages
│   │   ├── games/        # Game-specific components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API communication
│   │   └── types/        # TypeScript definitions
│   └── public/           # Static assets & PWA manifest
├── backend/           # Node.js/Express server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── games/        # Game engine & logic
│   │   └── websockets/   # Real-time communication
└── shared/            # Shared types & utilities
```

## 🚀 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd partygames

# Install dependencies (after setup)
npm install

# Start development servers (after setup)
npm run dev
```

## 🎯 Core Principles

1. **Mobile-First**: All interfaces designed for touch
2. **Real-Time**: Live updates for all game actions
3. **Stateless**: No persistent storage, memory-only
4. **Modular**: Easy to add new games
5. **PWA Standards**: Installable and offline-capable

## 📝 Status

🚧 **In Development** - Currently setting up project foundation

See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for detailed development plan and progress.

## 📄 License

MIT License - see LICENSE file for details
