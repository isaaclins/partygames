# Project Structure

## Monorepo Organization

```
partygames/
├── frontend/          # React PWA application
├── backend/           # Express.js API server
├── shared/            # Shared TypeScript types
├── cypress/           # E2E test specifications
├── cursor/            # Cursor AI rules (legacy)
├── docs/              # Project documentation
└── node_modules/      # Root dependencies
```

## Frontend Structure (`frontend/`)

```
src/
├── components/        # Reusable UI components
│   └── ui/           # Base UI components (Button, Input, Modal, etc.)
├── games/            # Game-specific React components
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks
├── services/         # API and WebSocket services
├── stores/           # Zustand state management
├── types/            # Frontend-specific types
├── utils/            # Utility functions
└── __tests__/        # Test files mirroring src structure
```

## Backend Structure (`backend/`)

```
src/
├── games/            # Game logic classes
├── routes/           # Express route handlers
├── services/         # Business logic services
├── websockets/       # Socket.io event handlers
├── types/            # Backend-specific types
└── __tests__/        # Test files mirroring src structure
```

## Shared Types (`shared/`)

Contains TypeScript interfaces and types used across frontend and backend, including:

- Game session and player types
- WebSocket event definitions
- API request/response interfaces
- Game-specific data structures

## File Naming Conventions

- **React components**: PascalCase (e.g., `GameLobbyPage.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useGameSession.ts`)
- **Services**: PascalCase (e.g., `WebSocketService.ts`)
- **Types/Interfaces**: PascalCase (e.g., `GameSession`, `Player`)
- **Test files**: Match source file name with `.test.ts/.tsx` suffix

## Import Aliases

- `@/` - Frontend src root
- `@/components` - UI components
- `@/pages` - Page components
- `@/games` - Game components
- `@shared` - Shared types package

## Code Organization Principles

- **Feature-based grouping** for games and pages
- **Shared UI components** in dedicated ui folder
- **Colocation of tests** with source files
- **Separation of concerns** between presentation, logic, and data
- **Type-first development** with shared interfaces
