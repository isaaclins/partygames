# 🎉 Party Games PWA

A mobile-first Progressive Web Application for real-time multiplayer party games. Built with React,
TypeScript, and WebSockets for seamless cross-platform gaming experiences.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

## ✨ Features

### 🎮 **Available Games**

- **Two Truths and a Lie** - Classic deception game where players guess which statement is false
- **Would You Rather** - Choose between challenging scenarios and see what others pick
- **Quick Draw** - Fast-paced drawing and guessing game with real-time collaboration

### 🚀 **Core Features**

- **Real-time Multiplayer** - WebSocket-powered live game sessions
- **Progressive Web App** - Install directly on mobile devices
- **Cross-Platform** - Works seamlessly on mobile, tablet, and desktop
- **Responsive Design** - Mobile-first UI with touch optimizations
- **Offline Capability** - Service worker support for offline functionality
- **Modern UI** - Clean, intuitive interface with smooth animations

### 🔧 **Technical Highlights**

- **TypeScript** - Full type safety across frontend and backend
- **Modular Architecture** - Easy to add new games and features
- **Comprehensive Testing** - 293 passing tests with 100% success rate
- **Modern Tooling** - Vite, ESLint, Prettier, and automated workflows
- **Monorepo Structure** - Organized workspace with shared types

## 🏗️ Architecture

```
partygames/
├── frontend/          # React PWA with Vite
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── games/        # Game implementations
│   │   ├── pages/        # Application pages
│   │   ├── stores/       # Zustand state management
│   │   └── hooks/        # Custom React hooks
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── games/        # Game logic classes
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── websockets/   # Real-time communication
├── shared/            # Shared TypeScript types
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd partygames
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3001) servers
concurrently.

### Alternative Commands

```bash
# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

## 📱 PWA Installation

### Mobile Devices

1. Open the app in your mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow installation prompts
4. Launch from your home screen like a native app

### Desktop Browsers

1. Look for install icon in address bar (Chrome/Edge)
2. Click "Install" when prompted
3. App will appear in your applications folder

## 🎮 How to Play

### Creating a Game

1. Open the app and click **"Create Game"**
2. Select your desired game type
3. Configure game settings (if applicable)
4. Share the game code with friends

### Joining a Game

1. Click **"Join Game"**
2. Enter the game code provided by the host
3. Enter your display name
4. Wait for the host to start the game

### Game Flow

- Each game has its own unique mechanics and rules
- Real-time updates keep all players synchronized
- Mobile-optimized controls for touch devices
- Automatic reconnection if connection drops

## 🛠️ Development

### Tech Stack

**Frontend:**

- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Zustand for state management
- Socket.io-client for WebSockets
- Lucide React for icons
- React Router for navigation

**Backend:**

- Node.js with Express
- TypeScript for type safety
- Socket.io for real-time communication
- CORS and Helmet for security
- Express Rate Limiter for protection

**Development Tools:**

- ESLint + Prettier for code quality
- Vitest for frontend testing
- Jest for backend testing
- Husky for git hooks
- Cypress for E2E testing

### Adding New Games

1. **Create game component** in `frontend/src/games/`
2. **Implement game logic** in `backend/src/games/`
3. **Add shared types** in `shared/types/`
4. **Write comprehensive tests**
5. **Update routing and navigation**

See existing games (`TwoTruthsAndALie.tsx`, `WouldYouRather.tsx`, `QuickDraw.tsx`) for
implementation patterns.

### Testing

The project maintains high test coverage across all components:

```bash
# Run all tests
npm run test

# Frontend tests with UI
npm run test:ui --workspace=frontend

# Backend tests with coverage
npm run test:coverage --workspace=backend

# E2E tests
npm run test:e2e
```

**Current test status:** ✅ 293/293 tests passing (100% success rate)

### Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

## 🚀 Deployment

### Build for Production

```bash
# Build both frontend and backend
npm run build

# Build specific workspace
npm run build:frontend
npm run build:backend
```

### Environment Variables

Create `.env` files in respective directories:

**Backend (.env):**

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend (.env):**

```env
VITE_API_URL=https://your-backend-domain.com
```

### Deployment Options

- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Railway, Render, Heroku, AWS
- **Full Stack**: Railway, Render (monorepo support)

## 📄 API Documentation

### WebSocket Events

```typescript
// Join game lobby
socket.emit('join-lobby', { gameCode: string, playerName: string });

// Game state updates
socket.on('game-state-update', (gameState: GameState) => {});

// Player actions
socket.emit('player-action', { action: string, data: any });
```

### REST Endpoints

```
GET  /api/health          # Health check
POST /api/games           # Create new game
GET  /api/games/:code     # Get game info
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- **TypeScript**: All code must be properly typed
- **Testing**: Maintain 90%+ test coverage
- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: Follow WCAG guidelines
- **Performance**: Optimize for mobile networks

## 📋 Project Status

- ✅ **Core Infrastructure** - Complete
- ✅ **Frontend PWA** - Complete with responsive design
- ✅ **Backend API** - Complete with WebSocket support
- ✅ **Game Engine** - Modular architecture implemented
- ✅ **Three Games** - Two Truths and a Lie, Would You Rather, Quick Draw
- ✅ **Real-time Communication** - WebSocket implementation complete
- ✅ **Comprehensive Testing** - 293 tests passing
- 🚧 **PWA Features** - Service workers and offline support
- 📋 **Additional Games** - Planned for future releases
- 📋 **Deployment Pipeline** - CI/CD setup

## 📖 Documentation

- [Project Roadmap](PROJECT_ROADMAP.md) - Detailed development plan
- [Architecture Rules](cursor/rules/) - Code standards and patterns
- [Game Development Guide](docs/) - How to add new games

## 📞 Support

For questions, bug reports, or feature requests:

1. Check existing [Issues](../../issues)
2. Create a new issue with detailed description
3. Include browser/device information for bugs
4. Provide steps to reproduce

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for bringing people together through games**

[🎮 Play Now](#) | [📖 Documentation](#) | [🤝 Contribute](#contributing)

</div>
