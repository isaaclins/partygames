# Implementation Plan

- [ ] 1. Create offline game types and utilities
  - Define TypeScript interfaces for offline game state, player roles, votes, and results
  - Create utility functions for role assignment and vote processing
  - Write unit tests for role assignment algorithm and vote counting logic
  - _Requirements: 2.2, 4.1, 5.1_

- [ ] 2. Implement Spyfall mode selection component
  - Create SpyfallModeSelection component with Online/Offline buttons
  - Add routing for `/spyfall/mode-select` path
  - Style component to match existing UI patterns
  - Write component tests for navigation behavior
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Build player setup component
  - Create PlayerSetup component for entering player names
  - Implement name validation (minimum 3 players, no duplicates, no empty names)
  - Add player list display with remove functionality
  - Create unit tests for validation logic and component interactions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Develop role reveal card system
  - Create RoleRevealCard component with card flip interaction
  - Implement privacy screen with "Make sure others can't see" messaging
  - Add role display logic (location + role for non-spies, "You are the Spy" for spy)
  - Write tests for card reveal states and role display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.2, 6.3, 6.4_

- [ ] 5. Create voting interface component
  - Build VotingInterface component with player grid layout
  - Implement current voter display and player selection
  - Add vote confirmation dialog
  - Create tests for voting interactions and player selection
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 6.5_

- [ ] 6. Implement game results component
  - Create OfflineGameResults component for displaying voting outcomes
  - Add winner determination logic and role reveals
  - Implement tie handling that returns to discussion phase
  - Write tests for result display and restart functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Build main offline game orchestrator
  - Create OfflineSpyfallGame component to manage game phases
  - Implement state management for setup → role-reveal → voting → results flow
  - Add phase transition logic and game state updates
  - Write integration tests for complete game flow
  - _Requirements: 2.5, 3.5, 4.1, 4.6, 5.1_

- [ ] 8. Add offline routing and navigation
  - Create `/spyfall/offline` route in App.tsx
  - Update CreateGamePage to navigate to mode selection for Spyfall
  - Add navigation between offline game phases
  - Test routing and navigation flow
  - _Requirements: 1.2, 1.3_

- [ ] 9. Integrate offline mode with existing UI
  - Add offline game instructions and help text
  - Ensure consistent styling with existing online game components
  - Add privacy reminders and transition guidance
  - Test UI consistency and user experience
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 10. Add comprehensive error handling and validation
  - Implement error boundaries for offline game components
  - Add validation for all user inputs and game state transitions
  - Create user-friendly error messages and recovery options
  - Write tests for error scenarios and edge cases
  - _Requirements: 2.1, 2.2, 2.3, 4.4, 6.1_

- [ ] 11. Create end-to-end tests for offline gameplay
  - Write Cypress tests for complete offline game flow
  - Test single-device usage patterns and role privacy
  - Verify voting system and tie handling
  - Test game restart and multiple rounds
  - _Requirements: 1.4, 2.5, 3.5, 4.6, 5.6_
