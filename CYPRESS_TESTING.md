# 🎭 Cypress End-to-End Testing Guide

This document provides comprehensive guidance on using Cypress for end-to-end testing in the Party
Games platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Custom Commands](#custom-commands)
- [Writing New Tests](#writing-new-tests)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [Best Practices](#best-practices)

## 🔍 Overview

Our Cypress e2e test suite covers the complete user journey across all three party games:

- **Lobby System**: Creating and joining game lobbies
- **Two Truths and a Lie**: Statement submission, guessing, and results
- **Would You Rather**: Scenario creation, voting, and multi-round gameplay
- **Quick Draw**: Canvas drawing, real-time sync, and guessing mechanics

### Test Coverage

- ✅ **User Interface**: All interactive elements and navigation
- ✅ **Game Logic**: Complete gameplay flows for all games
- ✅ **Real-time Features**: WebSocket communication and live updates
- ✅ **Responsive Design**: Mobile, tablet, and desktop viewports
- ✅ **Accessibility**: Keyboard navigation and ARIA compliance
- ✅ **Error Handling**: Network issues and invalid inputs
- ✅ **Performance**: Canvas rendering and rapid interactions

## 🛠️ Setup

### Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm ci`)
- Both frontend and backend servers running

### Installation

Cypress is already configured in the project. Dependencies are installed when you run:

```bash
npm ci
```

### Configuration

Cypress configuration is located in `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 390, // iPhone 12/13/14 Pro
    viewportHeight: 844,
    video: true,
    screenshotOnRunFailure: true,
    // ... other settings
  },
});
```

## 🚀 Running Tests

### Development Mode (Interactive)

```bash
# Start both servers first
npm run dev

# In another terminal, open Cypress Test Runner
npm run test:e2e:open
```

### Headless Mode (CI-style)

```bash
# Start servers and run tests automatically
npm run test:e2e:dev

# Or run tests against already running servers
npm run test:e2e
```

### CI Mode

```bash
# Used in GitHub Actions
npm run test:e2e:ci
```

## 📁 Test Structure

```
cypress/
├── e2e/                    # Test files
│   ├── lobby-system.cy.ts  # Lobby creation/joining
│   ├── two-truths-and-a-lie.cy.ts
│   ├── would-you-rather.cy.ts
│   └── quick-draw.cy.ts
├── fixtures/               # Test data
│   └── gameData.json      # Sample statements, scenarios, etc.
├── support/               # Support files
│   ├── commands.ts        # Custom commands
│   ├── e2e.ts            # Global setup
│   └── component.ts      # Component testing setup
├── screenshots/          # Auto-generated on failures
└── videos/              # Auto-generated test recordings
```

## 🎯 Custom Commands

We've created custom commands to simplify game testing:

### Lobby Management

```typescript
cy.createGameLobby('two-truths-and-a-lie', 'PlayerName');
cy.joinGameLobby('LOBBY123', 'PlayerName');
cy.waitForGameStart();
```

### Two Truths and a Lie

```typescript
cy.submitTruths('Truth 1', 'Truth 2', 'Lie');
cy.selectStatementAsLie(1); // Select statement index as lie
cy.waitForTwoTruthsResults();
```

### Would You Rather

```typescript
cy.submitScenario('Would you rather have wings or be invisible?');
cy.selectChoice(0); // Select first choice
cy.waitForWouldYouRatherResults();
```

### Quick Draw

```typescript
cy.drawOnCanvas([
  { x: 100, y: 100 },
  { x: 150, y: 150 },
]);
cy.submitGuess('house');
cy.clearCanvas();
cy.waitForQuickDrawResults();
```

### Utilities

```typescript
cy.setMobileViewport();
cy.setTabletViewport();
cy.setDesktopViewport();
cy.waitForSocketConnection();
```

## ✍️ Writing New Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.fixture('gameData').as('gameData');
  });

  it('should perform specific action', function () {
    // Use this.gameData to access fixture data
    const testData = this.gameData.someProperty;

    // Create lobby and start game
    cy.createGameLobby('game-type', 'PlayerName');
    cy.waitForGameStart();

    // Test specific functionality
    cy.get('[data-cy="element"]').should('be.visible');
    cy.get('[data-cy="button"]').click();

    // Assert expected outcomes
    cy.get('[data-cy="result"]').should('contain', 'Expected Text');
  });
});
```

### Data Attributes

Use `data-cy` attributes for reliable element selection:

```html
<!-- Good -->
<button data-cy="submit-button">Submit</button>

<!-- Avoid -->
<button className="btn btn-primary">Submit</button>
```

### Assertions

```typescript
// Visibility
cy.get('[data-cy="element"]').should('be.visible');
cy.get('[data-cy="element"]').should('not.exist');

// Content
cy.get('[data-cy="element"]').should('contain', 'text');
cy.get('[data-cy="element"]').should('have.class', 'active');

// URLs
cy.url().should('include', '/lobby/');

// Attributes
cy.get('[data-cy="input"]').should('have.attr', 'disabled');
```

## 🏗️ CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
e2e-tests:
  name: 🎭 E2E Tests (Cypress)
  runs-on: ubuntu-latest
  needs: [backend, frontend]

  steps:
    - name: Start servers for E2E testing
    - name: Run Cypress E2E tests
    - name: Upload screenshots/videos on failure
```

### Artifacts

- **Screenshots**: Captured on test failures
- **Videos**: Recorded for all test runs
- **Test Results**: Detailed reports with timing

## 🐛 Debugging

### Local Debugging

```bash
# Open Cypress Test Runner for interactive debugging
npm run test:e2e:open
```

### Debug Strategies

1. **Screenshots**: Automatic on failures
2. **Videos**: Full test recordings
3. **Browser DevTools**: Available in Test Runner
4. **Console Logs**: Captured in test output

### Common Issues

#### WebSocket Connection

```typescript
// Wait for WebSocket connection
cy.waitForSocketConnection();

// Check connection status
cy.get('[data-cy="connection-status"]').should('contain', 'Connected');
```

#### Canvas Testing

```typescript
// Verify canvas is ready
cy.get('[data-cy="drawing-canvas"]').should('be.visible');

// Check canvas has drawing
cy.get('[data-cy="drawing-canvas"]').should('have.attr', 'data-has-drawing', 'true');
```

#### Timing Issues

```typescript
// Use explicit waits
cy.get('[data-cy="element"]', { timeout: 10000 }).should('be.visible');

// Wait for specific conditions
cy.waitForSocketConnection();
cy.waitForGameStart();
```

## 📚 Best Practices

### 1. Test Data Management

```typescript
// Use fixtures for consistent test data
cy.fixture('gameData').then((data) => {
  cy.submitTruths(
    data.twoTruthsAndALie.sampleStatements.player1.statements[0],
    data.twoTruthsAndALie.sampleStatements.player1.statements[1],
    data.twoTruthsAndALie.sampleStatements.player1.statements[2]
  );
});
```

### 2. Page Object Pattern

```typescript
// Create reusable page objects
class GameLobbyPage {
  createLobby(gameType: string) {
    cy.get(`[data-cy="game-type-${gameType}"]`).click();
    cy.get('[data-cy="create-lobby-button"]').click();
    return this;
  }

  startGame() {
    cy.get('[data-cy="start-game-button"]').click();
    return this;
  }
}
```

### 3. Error Handling

```typescript
// Handle network errors gracefully
cy.on('uncaught:exception', (err) => {
  if (err.message.includes('NetworkError')) {
    return false; // Don't fail test
  }
  return true;
});
```

### 4. Mobile-First Testing

```typescript
beforeEach(() => {
  cy.setMobileViewport(); // Test mobile first
});

it('should work on different viewports', () => {
  // Test mobile
  cy.setMobileViewport();
  cy.get('[data-cy="mobile-menu"]').should('be.visible');

  // Test tablet
  cy.setTabletViewport();
  cy.get('[data-cy="tablet-layout"]').should('be.visible');

  // Test desktop
  cy.setDesktopViewport();
  cy.get('[data-cy="desktop-sidebar"]').should('be.visible');
});
```

### 5. Accessibility Testing

```typescript
it('should be accessible', () => {
  // Check ARIA labels
  cy.get('[data-cy="button"]').should('have.attr', 'aria-label');

  // Test keyboard navigation
  cy.get('[data-cy="input"]').focus();
  cy.get('[data-cy="input"]').type('{tab}');
  cy.focused().should('have.attr', 'data-cy', 'next-element');
});
```

## 🎮 Game-Specific Guidelines

### Two Truths and a Lie

- Test statement validation (length, uniqueness)
- Verify guessing phase progression
- Check scoring calculations

### Would You Rather

- Test scenario format validation
- Verify round progression (3 rounds)
- Check voting mechanics and results

### Quick Draw

- Test canvas drawing functionality
- Verify real-time stroke synchronization
- Check guess submission and validation
- Test timer functionality

## 📊 Reporting

Test results are automatically uploaded to GitHub Actions artifacts:

- **cypress-screenshots**: Screenshots from failed tests
- **cypress-videos**: Video recordings of all tests
- **cypress-test-results**: Detailed test reports

## 🔧 Configuration Options

### Environment Variables

```bash
CYPRESS_baseUrl=http://localhost:5173
CYPRESS_env_backendUrl=http://localhost:3001
```

### Custom Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    defaultCommandTimeout: 10000, // Command timeout
    requestTimeout: 15000, // Network request timeout
    responseTimeout: 15000, // Response timeout
    pageLoadTimeout: 30000, // Page load timeout
    viewportWidth: 390, // Default viewport
    viewportHeight: 844,
    video: true, // Record videos
    screenshotOnRunFailure: true, // Screenshots on failure
  },
});
```

---

## 🆘 Need Help?

- Check existing tests for examples
- Review custom commands in `cypress/support/commands.ts`
- Look at fixture data in `cypress/fixtures/gameData.json`
- Refer to [Cypress Documentation](https://docs.cypress.io/)

Happy testing! 🎉
