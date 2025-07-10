/// <reference types="cypress" />

describe('Two Truths and a Lie Game', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.fixture('gameData').as('gameData');
  });

  describe('Game Setup and Flow', () => {
    it('should complete a full Two Truths and a Lie game', function () {
      // Create game lobby
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');

      // Start the game
      cy.waitForGameStart();

      // Verify game has started
      cy.get('[data-cy="game-container"]').should('be.visible');
      cy.get('[data-cy="game-title"]').should(
        'contain',
        'Two Truths and a Lie'
      );
      cy.get('[data-cy="game-phase"]').should('contain', 'Submit');
    });

    it('should display correct game instructions', function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="game-instructions"]').should('be.visible');
      cy.get('[data-cy="game-instructions"]').should(
        'contain',
        'Submit two truths and one lie'
      );
    });
  });

  describe('Statement Submission Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();
    });

    it('should allow players to submit three statements', function () {
      const statements =
        this.gameData.twoTruthsAndALie.sampleStatements.player1.statements;

      cy.get('[data-cy="statement-input-0"]').should('be.visible');
      cy.get('[data-cy="statement-input-1"]').should('be.visible');
      cy.get('[data-cy="statement-input-2"]').should('be.visible');

      cy.submitTruths(statements[0], statements[1], statements[2]);

      // Verify submission was successful
      cy.get('[data-cy="submission-success"]').should('be.visible');
      cy.get('[data-cy="waiting-message"]').should(
        'contain',
        'Waiting for other players'
      );
    });

    it('should validate that all fields are filled', function () {
      cy.get('[data-cy="statement-input-0"]').type('First statement');
      cy.get('[data-cy="submit-statements-button"]').click();

      // Should show validation error
      cy.get('[data-cy="validation-error"]').should('be.visible');
      cy.get('[data-cy="statement-input-1"]').should('have.class', 'error');
      cy.get('[data-cy="statement-input-2"]').should('have.class', 'error');
    });

    it('should prevent duplicate statements', function () {
      const duplicateStatement = 'This is the same statement';

      cy.get('[data-cy="statement-input-0"]').type(duplicateStatement);
      cy.get('[data-cy="statement-input-1"]').type(duplicateStatement);
      cy.get('[data-cy="statement-input-2"]').type('Different statement');
      cy.get('[data-cy="submit-statements-button"]').click();

      // Should show validation error
      cy.get('[data-cy="validation-error"]').should('be.visible');
      cy.get('[data-cy="validation-error"]').should(
        'contain',
        'must be different'
      );
    });

    it('should enforce character limits', function () {
      const longStatement = 'a'.repeat(201); // Assuming 200 char limit

      cy.get('[data-cy="statement-input-0"]').type(longStatement);
      cy.get('[data-cy="character-count-0"]').should('contain', '200');
      cy.get('[data-cy="character-count-0"]').should('have.class', 'text-red');
    });

    it('should allow editing statements before submission', function () {
      cy.get('[data-cy="statement-input-0"]').type('Initial statement');
      cy.get('[data-cy="statement-input-0"]').clear();
      cy.get('[data-cy="statement-input-0"]').type('Updated statement');

      cy.get('[data-cy="statement-input-0"]').should(
        'have.value',
        'Updated statement'
      );
    });
  });

  describe('Guessing Phase', () => {
    beforeEach(function () {
      // This would normally require multiple players or mocked game state
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      // Submit statements to advance to guessing phase
      const statements =
        this.gameData.twoTruthsAndALie.sampleStatements.player1.statements;
      cy.submitTruths(statements[0], statements[1], statements[2]);

      // Simulate advancing to guessing phase (this would normally happen via WebSocket)
      cy.get('[data-cy="advance-to-guessing"]', { timeout: 10000 }).click();
    });

    it('should display other players statements for guessing', function () {
      cy.get('[data-cy="game-phase"]').should('contain', 'Guess');
      cy.get('[data-cy="current-player-statements"]').should('be.visible');
      cy.get('[data-cy="statement-0"]').should('be.visible');
      cy.get('[data-cy="statement-1"]').should('be.visible');
      cy.get('[data-cy="statement-2"]').should('be.visible');
    });

    it('should allow selecting which statement is the lie', function () {
      cy.selectStatementAsLie(1); // Select second statement as lie

      cy.get('[data-cy="guess-submitted"]').should('be.visible');
      cy.get('[data-cy="waiting-message"]').should(
        'contain',
        'Waiting for other players'
      );
    });

    it('should highlight selected statement', function () {
      cy.get('[data-cy="statement-1"]').click();
      cy.get('[data-cy="statement-1"]').should('have.class', 'selected');

      // Should be able to change selection
      cy.get('[data-cy="statement-2"]').click();
      cy.get('[data-cy="statement-1"]').should('not.have.class', 'selected');
      cy.get('[data-cy="statement-2"]').should('have.class', 'selected');
    });

    it('should show current player being guessed', function () {
      cy.get('[data-cy="current-player-name"]').should('be.visible');
      cy.get('[data-cy="player-indicator"]').should('be.visible');
    });

    it('should show progress through all players', function () {
      cy.get('[data-cy="guessing-progress"]').should('be.visible');
      cy.get('[data-cy="progress-indicator"]').should('contain', '1 of');
    });
  });

  describe('Results Phase', () => {
    beforeEach(function () {
      // Set up a completed game scenario
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      // Complete submission phase
      const statements =
        this.gameData.twoTruthsAndALie.sampleStatements.player1.statements;
      cy.submitTruths(statements[0], statements[1], statements[2]);

      // Complete guessing phase
      cy.get('[data-cy="advance-to-guessing"]', { timeout: 10000 }).click();
      cy.selectStatementAsLie(2); // Correct answer from fixture

      // Advance to results
      cy.get('[data-cy="advance-to-results"]', { timeout: 10000 }).click();
    });

    it('should display final results and scores', function () {
      cy.waitForTwoTruthsResults();

      cy.get('[data-cy="game-results"]').should('be.visible');
      cy.get('[data-cy="final-scores"]').should('be.visible');
      cy.get('[data-cy="winner-announcement"]').should('be.visible');
    });

    it('should show correct answers for each player', function () {
      cy.get('[data-cy="player-results"]').should('be.visible');
      cy.get('[data-cy="correct-answers"]').should('be.visible');
      cy.get('[data-cy="lie-reveal"]').should('be.visible');
    });

    it('should display who guessed correctly', function () {
      cy.get('[data-cy="guess-results"]').should('be.visible');
      cy.get('[data-cy="correct-guessers"]').should('be.visible');
    });

    it('should show play again option', function () {
      cy.get('[data-cy="play-again-button"]').should('be.visible');
      cy.get('[data-cy="new-game-button"]').should('be.visible');
    });

    it('should allow returning to lobby', function () {
      cy.get('[data-cy="return-to-lobby-button"]').should('be.visible');
      cy.get('[data-cy="return-to-lobby-button"]').click();

      cy.url().should('include', '/lobby/');
    });
  });

  describe('Multi-player Simulation', () => {
    it('should handle multiple players in the same game', function () {
      // This test would require WebSocket mocking or multiple browser instances
      // For now, we'll test the UI can handle multiple player data

      cy.createGameLobby('two-truths-and-a-lie', 'Player1');

      // Simulate having multiple players in the game
      cy.window().then((win) => {
        // Mock game state with multiple players
        win.postMessage(
          {
            type: 'MOCK_GAME_STATE',
            payload: {
              players: [
                { id: '1', name: 'Player1' },
                { id: '2', name: 'Player2' },
                { id: '3', name: 'Player3' },
              ],
            },
          },
          '*'
        );
      });

      cy.waitForGameStart();
      cy.get('[data-cy="player-count"]').should('contain', '3');
    });
  });

  describe('Game State Persistence', () => {
    it('should maintain game state on page refresh', function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      const statements =
        this.gameData.twoTruthsAndALie.sampleStatements.player1.statements;
      cy.submitTruths(statements[0], statements[1], statements[2]);

      // Refresh page
      cy.reload();

      // Should maintain game state
      cy.get('[data-cy="game-container"]').should('be.visible');
      cy.get('[data-cy="submission-success"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();
    });

    it('should be keyboard navigable', function () {
      cy.get('[data-cy="statement-input-0"]').focus();
      cy.get('[data-cy="statement-input-0"]').type('{tab}');
      cy.focused().should('have.attr', 'data-cy', 'statement-input-1');
    });

    it('should have proper ARIA labels', function () {
      cy.get('[data-cy="statement-input-0"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="submit-statements-button"]').should(
        'have.attr',
        'aria-label'
      );
    });

    it('should announce game phase changes', function () {
      cy.get('[data-cy="game-phase-announcement"]').should(
        'have.attr',
        'role',
        'status'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket disconnection gracefully', function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      // Simulate connection loss
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_DISCONNECT' }, '*');
      });

      cy.get('[data-cy="connection-status"]').should('contain', 'Reconnecting');
      cy.get('[data-cy="offline-indicator"]').should('be.visible');
    });

    it('should show appropriate error messages', function () {
      cy.createGameLobby('two-truths-and-a-lie', 'Player1');
      cy.waitForGameStart();

      // Try to submit without statements
      cy.get('[data-cy="submit-statements-button"]').click();

      cy.get('[data-cy="error-message"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should(
        'contain',
        'Please fill in all statements'
      );
    });
  });
});
