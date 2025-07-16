describe('Spyfall Game E2E Tests', () => {
  beforeEach(() => {
    // Visit homepage
    cy.visit('/');
  });

  describe('Game Creation and Lobby', () => {
    it('should create a Spyfall game and show lobby', () => {
      // Create a new game
      cy.get('[data-cy="create-game"]').click();
      
      // Fill in host name
      cy.get('[data-cy="host-name-input"]').type('TestHost');
      
      // Select Spyfall game (should be the only option)
      cy.get('[data-cy="game-type-spyfall"]').click();
      
      // Create the game
      cy.get('[data-cy="create-game-button"]').click();
      
      // Should be redirected to lobby
      cy.url().should('include', '/lobby/');
      cy.contains('Spyfall').should('be.visible');
      cy.contains('TestHost').should('be.visible');
    });

    it('should allow players to join Spyfall lobby', () => {
      // First create a game
      cy.get('[data-cy="create-game"]').click();
      cy.get('[data-cy="host-name-input"]').type('Host');
      cy.get('[data-cy="game-type-spyfall"]').click();
      cy.get('[data-cy="create-game-button"]').click();
      
      // Get lobby code from URL
      cy.url().then((url) => {
        const lobbyCode = url.split('/lobby/')[1];
        
        // Open new tab as second player
        cy.window().then((win) => {
          const newTab = win.open('/');
          cy.wrap(newTab).its('document').should('exist');
        });
        
        // Join the game
        cy.visit('/');
        cy.get('[data-cy="join-game"]').click();
        cy.get('[data-cy="lobby-code-input"]').type(lobbyCode);
        cy.get('[data-cy="player-name-input"]').type('Player2');
        cy.get('[data-cy="join-game-button"]').click();
        
        // Should be in the same lobby
        cy.url().should('include', `/lobby/${lobbyCode}`);
        cy.contains('Host').should('be.visible');
        cy.contains('Player2').should('be.visible');
      });
    });
  });

  describe('Game Start and Role Assignment', () => {
    beforeEach(() => {
      // Create a game with multiple players
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
    });

    it('should start game when host clicks start and all players ready', () => {
      // Mark all players as ready (simulated)
      cy.get('[data-cy="ready-button"]').click();
      
      // Host starts the game
      cy.get('[data-cy="start-game-button"]').click();
      
      // Should show countdown and then redirect to game
      cy.contains('Starting in').should('be.visible');
      cy.url().should('include', '/game/', { timeout: 5000 });
    });

    it('should assign roles correctly in game', () => {
      // Start the game
      cy.get('[data-cy="ready-button"]').click();
      cy.get('[data-cy="start-game-button"]').click();
      cy.url().should('include', '/game/', { timeout: 5000 });
      
      // Should show Spyfall game interface
      cy.contains('Spyfall').should('be.visible');
      cy.contains('Your Role').should('be.visible');
      
      // Should show either spy or non-spy role
      cy.get('body').should('satisfy', ($body) => {
        return $body.text().includes('You are the SPY!') || 
               $body.text().includes('You are:'); // Non-spy with role
      });
    });

    it('should display location and role for non-spy', () => {
      cy.startSpyfallGame();
      
      // Check if this player is not the spy
      cy.get('body').then(($body) => {
        if (!$body.text().includes('You are the SPY!')) {
          // Should show location and role
          cy.get('[data-cy="player-location"]').should('be.visible');
          cy.get('[data-cy="player-role"]').should('be.visible');
          cy.contains('Ask questions to find the spy').should('be.visible');
        }
      });
    });

    it('should hide location from spy', () => {
      cy.startSpyfallGame();
      
      // Check if this player is the spy
      cy.get('body').then(($body) => {
        if ($body.text().includes('You are the SPY!')) {
          // Should not show location or role
          cy.get('[data-cy="player-location"]').should('not.exist');
          cy.get('[data-cy="player-role"]').should('not.exist');
          cy.contains('Listen carefully to figure out the location').should('be.visible');
        }
      });
    });
  });

  describe('Game Phases', () => {
    beforeEach(() => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
    });

    it('should allow players to mark ready for voting', () => {
      cy.contains('Ready to Vote').should('be.visible');
      cy.get('[data-cy="ready-vote-button"]').click();
      
      // Should show updated ready count
      cy.contains('of 3 players ready').should('be.visible');
    });

    it('should transition to voting phase when all ready', () => {
      // Simulate all players ready (in real test would need multiple browser sessions)
      cy.get('[data-cy="ready-vote-button"]').click();
      
      // Mock other players being ready
      cy.window().its('io').then((io) => {
        // Simulate other players marking ready
        io.emit('game:stateUpdate', {
          phase: 'voting',
          playersReadyToVote: 3,
          totalPlayers: 3
        });
      });
      
      // Should show voting interface
      cy.contains('Voting Phase').should('be.visible');
      cy.contains('Vote to eliminate').should('be.visible');
    });

    it('should allow voting for other players', () => {
      // Transition to voting phase
      cy.transitionToVotingPhase();
      
      // Should show other players as voting options
      cy.get('[data-cy="vote-option"]').should('have.length.at.least', 2);
      
      // Select a player to vote for
      cy.get('[data-cy="vote-option"]').first().click();
      cy.get('[data-cy="submit-vote-button"]').click();
      
      // Should show voted confirmation
      cy.contains('You have voted').should('be.visible');
    });

    it('should not allow voting for self', () => {
      cy.transitionToVotingPhase();
      
      // Should not show current player in vote options
      cy.contains('Host').should('not.exist').within('[data-cy="vote-options"]');
    });
  });

  describe('Spy Guess Phase', () => {
    beforeEach(() => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
    });

    it('should allow spy to guess location when voted out', () => {
      // Simulate being voted out as spy
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'spy_guess',
          votedOutPlayerId: Cypress.currentUser.playerId,
          winner: null
        });
      });
      
      // Should show location guess interface
      cy.contains('You were voted out').should('be.visible');
      cy.get('[data-cy="location-guess-input"]').should('be.visible');
      
      // Enter location guess
      cy.get('[data-cy="location-guess-input"]').type('Pirate Ship');
      cy.get('[data-cy="submit-guess-button"]').click();
      
      // Should submit the guess
      cy.contains('Submitting Guess').should('be.visible');
    });

    it('should show waiting message for non-spy when spy guessing', () => {
      // Simulate another player being voted out as spy
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'spy_guess',
          votedOutPlayerId: 'other-player-id',
          winner: null
        });
      });
      
      // Should show waiting message
      cy.contains('was voted out and is the spy').should('be.visible');
      cy.get('[data-cy="location-guess-input"]').should('not.exist');
    });
  });

  describe('Game Results', () => {
    beforeEach(() => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
    });

    it('should display spy wins result', () => {
      // Simulate spy winning
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'finished',
          winner: 'spy',
          location: 'Pirate Ship',
          spyId: 'spy-player-id',
          locationGuess: {
            spyId: 'spy-player-id',
            guessedLocation: 'Pirate Ship',
            isCorrect: true
          }
        });
      });
      
      // Should show spy wins message
      cy.contains('Spy Wins!').should('be.visible');
      cy.contains('correctly guessed').should('be.visible');
      cy.contains('Pirate Ship').should('be.visible');
    });

    it('should display non-spies win result', () => {
      // Simulate non-spies winning
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'finished',
          winner: 'non_spies',
          location: 'Space Station',
          spyId: 'spy-player-id',
          locationGuess: {
            spyId: 'spy-player-id',
            guessedLocation: 'Wrong Guess',
            isCorrect: false
          }
        });
      });
      
      // Should show non-spies win message
      cy.contains('Non-Spies Win!').should('be.visible');
      cy.contains('failed to guess').should('be.visible');
    });

    it('should display game reveal information', () => {
      // Simulate game ending
      cy.simulateGameEnd({
        winner: 'spy',
        location: 'Casino',
        spyId: 'player2',
        votedOutPlayerId: 'player3'
      });
      
      // Should show game reveal
      cy.contains('Game Reveal').should('be.visible');
      cy.contains('Location:').should('be.visible');
      cy.contains('Casino').should('be.visible');
      cy.contains('Spy:').should('be.visible');
    });
  });

  describe('Role Privacy Features', () => {
    beforeEach(() => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
    });

    it('should allow hiding role information', () => {
      // Should show role by default
      cy.get('[data-cy="your-role"]').should('be.visible');
      
      // Click hide button
      cy.get('[data-cy="hide-role-button"]').click();
      
      // Should hide role information
      cy.contains('Role hidden for privacy').should('be.visible');
      cy.get('[data-cy="player-location"]').should('not.be.visible');
    });

    it('should allow showing role again after hiding', () => {
      // Hide role first
      cy.get('[data-cy="hide-role-button"]').click();
      cy.contains('Role hidden for privacy').should('be.visible');
      
      // Show role again
      cy.get('[data-cy="show-role-button"]').click();
      
      // Should show role information again
      cy.get('[data-cy="your-role"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice']);
      cy.startSpyfallGame();
      
      // Simulate network error
      cy.intercept('POST', '/api/game/action', { forceNetworkError: true });
      
      // Try to perform an action
      cy.get('[data-cy="ready-vote-button"]').click();
      
      // Should show error message
      cy.contains('Failed to mark ready').should('be.visible');
    });

    it('should validate vote selection', () => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
      cy.transitionToVotingPhase();
      
      // Try to submit without selecting anyone
      cy.get('[data-cy="submit-vote-button"]').click();
      
      // Should show validation error
      cy.contains('Please select a player').should('be.visible');
    });

    it('should validate location guess input', () => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
      
      // Simulate being the spy in guess phase
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'spy_guess',
          votedOutPlayerId: Cypress.currentUser.playerId
        });
      });
      
      // Try to submit empty guess
      cy.get('[data-cy="submit-guess-button"]').click();
      
      // Should show validation error
      cy.contains('Please enter your location guess').should('be.visible');
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(() => {
      cy.createSpyfallGameWithPlayers(['Host', 'Alice', 'Bob']);
      cy.startSpyfallGame();
    });

    it('should update ready count in real-time', () => {
      // Initial state
      cy.contains('0 of 3 players ready').should('be.visible');
      
      // Simulate another player marking ready
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          playersReadyToVote: 1,
          totalPlayers: 3
        });
      });
      
      // Should update count
      cy.contains('1 of 3 players ready').should('be.visible');
    });

    it('should update voting progress in real-time', () => {
      cy.transitionToVotingPhase();
      
      // Simulate other players voting
      cy.window().its('io').then((io) => {
        io.emit('game:stateUpdate', {
          phase: 'voting',
          votes: [
            { voterId: 'other-player', targetPlayerId: 'target-player' }
          ],
          totalPlayers: 3
        });
      });
      
      // Should show updated vote count
      cy.contains('(1/3)').should('be.visible');
    });
  });
});

// Custom Cypress commands for Spyfall testing
Cypress.Commands.add('createSpyfallGameWithPlayers', (playerNames: string[]) => {
  // Create game as first player
  cy.get('[data-cy="create-game"]').click();
  cy.get('[data-cy="host-name-input"]').type(playerNames[0]);
  cy.get('[data-cy="game-type-spyfall"]').click();
  cy.get('[data-cy="create-game-button"]').click();
  
  // Mock additional players joining
  cy.window().its('io').then((io) => {
    const players = playerNames.map((name, index) => ({
      id: `player${index + 1}`,
      name,
      isHost: index === 0,
      isReady: true,
      isConnected: true
    }));
    
    io.emit('lobby:updated', {
      players,
      maxPlayers: 8,
      gameType: 'spyfall'
    });
  });
});

Cypress.Commands.add('startSpyfallGame', () => {
  cy.get('[data-cy="ready-button"]').click();
  cy.get('[data-cy="start-game-button"]').click();
  cy.url().should('include', '/game/', { timeout: 5000 });
});

Cypress.Commands.add('transitionToVotingPhase', () => {
  cy.window().its('io').then((io) => {
    io.emit('game:stateUpdate', {
      phase: 'voting',
      playersReadyToVote: 3,
      totalPlayers: 3,
      votes: []
    });
  });
});

Cypress.Commands.add('simulateGameEnd', (gameResult: any) => {
  cy.window().its('io').then((io) => {
    io.emit('game:stateUpdate', {
      phase: 'finished',
      ...gameResult
    });
  });
});

// TypeScript declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      createSpyfallGameWithPlayers(playerNames: string[]): Chainable<void>;
      startSpyfallGame(): Chainable<void>;
      transitionToVotingPhase(): Chainable<void>;
      simulateGameEnd(gameResult: any): Chainable<void>;
    }
    
    interface Window {
      io: any;
    }
    
    const currentUser: {
      playerId: string;
    };
  }
} 
