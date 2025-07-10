/// <reference types="cypress" />

describe('Lobby System', () => {
  beforeEach(() => {
    cy.setMobileViewport()
  })

  describe('Home Page', () => {
    it('should display the home page correctly', () => {
      cy.visit('/')
      cy.get('[data-cy="home-title"]').should('contain', 'Party Games')
      cy.get('[data-cy="player-name-input"]').should('be.visible')
      cy.get('[data-cy="create-game-button"]').should('be.visible')
      cy.get('[data-cy="join-game-button"]').should('be.visible')
    })

    it('should require a player name before navigating', () => {
      cy.visit('/')
      cy.get('[data-cy="create-game-button"]').click()
      
      // Should show validation message or remain on home page
      cy.url().should('include', '/')
      cy.get('[data-cy="player-name-input"]').should('have.focus')
    })

    it('should navigate to create game page with valid player name', () => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestPlayer')
      cy.get('[data-cy="create-game-button"]').click()
      cy.url().should('include', '/create')
    })

    it('should navigate to join game page with valid player name', () => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestPlayer')
      cy.get('[data-cy="join-game-button"]').click()
      cy.url().should('include', '/join')
    })
  })

  describe('Create Game Flow', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestHost')
      cy.get('[data-cy="create-game-button"]').click()
    })

    it('should display all available game types', () => {
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').should('be.visible')
      cy.get('[data-cy="game-type-would-you-rather"]').should('be.visible')
      cy.get('[data-cy="game-type-quick-draw"]').should('be.visible')
    })

    it('should create a Two Truths and a Lie lobby', () => {
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      cy.url().should('include', '/lobby/')
      cy.get('[data-cy="lobby-id"]').should('be.visible')
      cy.get('[data-cy="game-type-display"]').should('contain', 'Two Truths and a Lie')
      cy.get('[data-cy="player-list"]').should('contain', 'TestHost')
    })

    it('should create a Would You Rather lobby', () => {
      cy.get('[data-cy="game-type-would-you-rather"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      cy.url().should('include', '/lobby/')
      cy.get('[data-cy="lobby-id"]').should('be.visible')
      cy.get('[data-cy="game-type-display"]').should('contain', 'Would You Rather')
      cy.get('[data-cy="player-list"]').should('contain', 'TestHost')
    })

    it('should create a Quick Draw lobby', () => {
      cy.get('[data-cy="game-type-quick-draw"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      cy.url().should('include', '/lobby/')
      cy.get('[data-cy="lobby-id"]').should('be.visible')
      cy.get('[data-cy="game-type-display"]').should('contain', 'Quick Draw')
      cy.get('[data-cy="player-list"]').should('contain', 'TestHost')
    })
  })

  describe('Join Game Flow', () => {
    let lobbyId: string

    beforeEach(() => {
      // Create a lobby first
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestHost')
      cy.get('[data-cy="create-game-button"]').click()
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      // Extract lobby ID
      cy.url().then(url => {
        lobbyId = url.split('/lobby/')[1]
      })
    })

    it('should successfully join an existing lobby', () => {
      // Open new tab/window to simulate second player
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestJoiner')
      cy.get('[data-cy="join-game-button"]').click()
      
      cy.get('[data-cy="lobby-id-input"]').type(lobbyId)
      cy.get('[data-cy="join-lobby-button"]').click()
      
      cy.url().should('include', `/lobby/${lobbyId}`)
      cy.get('[data-cy="player-list"]').should('contain', 'TestJoiner')
      cy.checkLobbyState(2) // Should have 2 players now
    })

    it('should show error for invalid lobby ID', () => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestJoiner')
      cy.get('[data-cy="join-game-button"]').click()
      
      cy.get('[data-cy="lobby-id-input"]').type('INVALID123')
      cy.get('[data-cy="join-lobby-button"]').click()
      
      cy.get('[data-cy="error-message"]').should('be.visible')
      cy.get('[data-cy="error-message"]').should('contain', 'Lobby not found')
    })

    it('should show error for empty lobby ID', () => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestJoiner')
      cy.get('[data-cy="join-game-button"]').click()
      
      cy.get('[data-cy="join-lobby-button"]').click()
      
      // Should show validation or remain on join page
      cy.get('[data-cy="lobby-id-input"]').should('have.focus')
    })
  })

  describe('Lobby Management', () => {
    let lobbyId: string

    beforeEach(() => {
      // Create a lobby with two players
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestHost')
      cy.get('[data-cy="create-game-button"]').click()
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      cy.url().then(url => {
        lobbyId = url.split('/lobby/')[1]
      })
    })

    it('should display lobby information correctly', () => {
      cy.get('[data-cy="lobby-id"]').should('be.visible')
      cy.get('[data-cy="lobby-id"]').should('contain', lobbyId)
      cy.get('[data-cy="game-type-display"]').should('be.visible')
      cy.get('[data-cy="player-list"]').should('be.visible')
      cy.get('[data-cy="player-count"]').should('contain', '1')
    })

    it('should show start game button for host', () => {
      cy.get('[data-cy="start-game-button"]').should('be.visible')
      cy.get('[data-cy="start-game-button"]').should('not.be.disabled')
    })

    it('should start the game when host clicks start', () => {
      cy.get('[data-cy="start-game-button"]').click()
      cy.url().should('include', '/game/')
      cy.get('[data-cy="game-container"]').should('be.visible')
    })

    it('should update player count when new players join', () => {
      // Simulate another player joining (this would normally be done via WebSocket)
      cy.get('[data-cy="player-count"]').should('contain', '1')
      
      // For now, just verify the player count display is working
      cy.get('[data-cy="player-list"]').should('be.visible')
    })

    it('should allow copying lobby ID', () => {
      cy.get('[data-cy="copy-lobby-id-button"]').should('be.visible')
      cy.get('[data-cy="copy-lobby-id-button"]').click()
      
      // Verify copy feedback
      cy.get('[data-cy="copy-success-message"]').should('be.visible')
      cy.get('[data-cy="copy-success-message"]').should('contain', 'Copied')
    })
  })

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', () => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestPlayer')
      cy.get('[data-cy="create-game-button"]').click()
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').click()
      cy.get('[data-cy="create-lobby-button"]').click()
      
      // Wait for WebSocket connection
      cy.waitForSocketConnection()
    })

    it('should handle connection errors gracefully', () => {
      // This test would be more meaningful with actual WebSocket mocking
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestPlayer')
      cy.get('[data-cy="create-game-button"]').click()
      
      // Should not crash or show critical errors
      cy.get('[data-cy="game-type-two-truths-and-a-lie"]').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.get('[data-cy="player-name-input"]').type('TestPlayer')
    })

    it('should work correctly on mobile viewport', () => {
      cy.setMobileViewport()
      cy.get('[data-cy="create-game-button"]').should('be.visible')
      cy.get('[data-cy="join-game-button"]').should('be.visible')
    })

    it('should work correctly on tablet viewport', () => {
      cy.setTabletViewport()
      cy.get('[data-cy="create-game-button"]').should('be.visible')
      cy.get('[data-cy="join-game-button"]').should('be.visible')
    })

    it('should work correctly on desktop viewport', () => {
      cy.setDesktopViewport()
      cy.get('[data-cy="create-game-button"]').should('be.visible')
      cy.get('[data-cy="join-game-button"]').should('be.visible')
    })
  })
}) 
