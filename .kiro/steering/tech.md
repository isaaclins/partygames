# Technology Stack

## Architecture

**Monorepo structure** with npm workspaces containing frontend, backend, and shared type
definitions.

## Frontend Stack

- **React 18** with TypeScript for UI components
- **Vite** for build tooling and development server
- **TailwindCSS** for styling with mobile-first approach
- **Zustand** for state management
- **React Router** for client-side routing
- **Socket.io-client** for real-time WebSocket communication
- **Vite PWA plugin** for Progressive Web App features
- **Lucide React** for icons

## Backend Stack

- **Node.js** with Express.js server
- **TypeScript** for type safety
- **Socket.io** for WebSocket server implementation
- **CORS, Helmet, Rate Limiting** for security
- **Compression** for response optimization

## Development Tools

- **ESLint + Prettier** for code formatting and linting
- **Vitest** for frontend testing
- **Jest** for backend testing
- **Cypress** for end-to-end testing
- **Husky** for git hooks
- **TypeScript** strict mode across all packages

## Common Commands

### Development

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only (port 3000)
npm run dev:backend      # Backend only (port 3001)
```

### Building

```bash
npm run build            # Build both frontend and backend
npm run build:frontend   # Frontend production build
npm run build:backend    # Backend TypeScript compilation
```

### Testing

```bash
npm run test             # Run all tests (frontend + backend)
npm run test:e2e         # Cypress end-to-end tests
npm run test:coverage    # Test coverage reports
```

### Code Quality

```bash
npm run lint             # ESLint across all workspaces
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier formatting
npm run type-check       # TypeScript type checking
```

## Requirements

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
