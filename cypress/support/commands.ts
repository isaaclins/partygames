/// <reference types="cypress" />

// Custom commands for Party Games testing

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>
      setTabletViewport(): Chainable<void>
      setDesktopViewport(): Chainable<void>
      
      // Lobby and game flow commands
      createGameLobby(gameType: string, playerName?: string): Chainable<void>
      joinGameLobby(lobbyId: string, playerName?: string): Chainable<void>
      waitForGameStart(): Chainable<void>
      
      // Two Truths and a Lie commands
      submitTruths(truth1: string, truth2: string, lie: string): Chainable<void>
      selectStatementAsLie(statementIndex: number): Chainable<void>
      waitForTwoTruthsResults(): Chainable<void>
      
      // Would You Rather commands
      submitScenario(scenario: string): Chainable<void>
      selectChoice(choiceIndex: number): Chainable<void>
      waitForWouldYouRatherResults(): Chainable<void>
      
      // Quick Draw commands
      drawOnCanvas(strokes: Array<{x: number, y: number}>): Chainable<void>
      submitGuess(guess: string): Chainable<void>
      waitForQuickDrawResults(): Chainable<void>
      clearCanvas(): Chainable<void>
      
      // Utility commands
      waitForSocketConnection(): Chainable<void>
      checkGameInProgress(): Chainable<void>
      checkLobbyState(expectedPlayerCount?: number): Chainable<void>
    }
  }
}

// Lobby and game flow commands
Cypress.Commands.add('createGameLobby', (gameType: string, playerName = 'TestPlayer') => {
  cy.visit('/')
  cy.get('[data-cy="player-name-input"]').clear().type(playerName)
  cy.get('[data-cy="create-game-button"]').click()
  cy.get(`[data-cy="game-type-${gameType}"]`).click()
  cy.get('[data-cy="create-lobby-button"]').click()
  cy.url().should('include', '/lobby/')
  cy.get('[data-cy="lobby-id"]').should('be.visible')
})

Cypress.Commands.add('joinGameLobby', (lobbyId: string, playerName = 'TestPlayer2') => {
  cy.visit('/')
  cy.get('[data-cy="player-name-input"]').clear().type(playerName)
  cy.get('[data-cy="join-game-button"]').click()
  cy.get('[data-cy="lobby-id-input"]').clear().type(lobbyId)
  cy.get('[data-cy="join-lobby-button"]').click()
  cy.url().should('include', `/lobby/${lobbyId}`)
})

Cypress.Commands.add('waitForGameStart', () => {
  cy.get('[data-cy="start-game-button"]').click()
  cy.url().should('include', '/game/')
  cy.get('[data-cy="game-container"]').should('be.visible')
})

Cypress.Commands.add('waitForSocketConnection', () => {
  cy.window().its('__socketConnected__').should('equal', true, { timeout: 10000 })
})

// Two Truths and a Lie commands
Cypress.Commands.add('submitTruths', (truth1: string, truth2: string, lie: string) => {
  cy.get('[data-cy="statement-input-0"]').clear().type(truth1)
  cy.get('[data-cy="statement-input-1"]').clear().type(truth2)
  cy.get('[data-cy="statement-input-2"]').clear().type(lie)
  cy.get('[data-cy="submit-statements-button"]').click()
})

Cypress.Commands.add('selectStatementAsLie', (statementIndex: number) => {
  cy.get(`[data-cy="statement-${statementIndex}"]`).click()
  cy.get('[data-cy="submit-guess-button"]').click()
})

Cypress.Commands.add('waitForTwoTruthsResults', () => {
  cy.get('[data-cy="game-results"]').should('be.visible', { timeout: 15000 })
  cy.get('[data-cy="final-scores"]').should('be.visible')
})

// Would You Rather commands
Cypress.Commands.add('submitScenario', (scenario: string) => {
  cy.get('[data-cy="scenario-input"]').clear().type(scenario)
  cy.get('[data-cy="submit-scenario-button"]').click()
})

Cypress.Commands.add('selectChoice', (choiceIndex: number) => {
  cy.get(`[data-cy="choice-${choiceIndex}"]`).click()
})

Cypress.Commands.add('waitForWouldYouRatherResults', () => {
  cy.get('[data-cy="round-results"]').should('be.visible', { timeout: 15000 })
})

// Quick Draw commands
Cypress.Commands.add('drawOnCanvas', (strokes: Array<{x: number, y: number}>) => {
  cy.get('[data-cy="drawing-canvas"]').then($canvas => {
    const canvas = $canvas[0] as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    
    strokes.forEach((point, index) => {
      const x = rect.left + point.x
      const y = rect.top + point.y
      
      if (index === 0) {
        cy.get('[data-cy="drawing-canvas"]').trigger('mousedown', { 
          clientX: x, 
          clientY: y 
        })
      }
      
      cy.get('[data-cy="drawing-canvas"]').trigger('mousemove', { 
        clientX: x, 
        clientY: y 
      })
    })
    
    cy.get('[data-cy="drawing-canvas"]').trigger('mouseup')
  })
})

Cypress.Commands.add('submitGuess', (guess: string) => {
  cy.get('[data-cy="guess-input"]').clear().type(guess)
  cy.get('[data-cy="submit-guess-button"]').click()
})

Cypress.Commands.add('clearCanvas', () => {
  cy.get('[data-cy="clear-canvas-button"]').click()
})

Cypress.Commands.add('waitForQuickDrawResults', () => {
  cy.get('[data-cy="round-results"]').should('be.visible', { timeout: 15000 })
})

// Utility commands
Cypress.Commands.add('checkGameInProgress', () => {
  cy.get('[data-cy="game-status"]').should('contain', 'In Progress')
})

Cypress.Commands.add('checkLobbyState', (expectedPlayerCount?: number) => {
  cy.get('[data-cy="player-list"]').should('be.visible')
  if (expectedPlayerCount) {
    cy.get('[data-cy="player-item"]').should('have.length', expectedPlayerCount)
  }
}) 
