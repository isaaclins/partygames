/// <reference types="cypress" />

describe('Would You Rather Game', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.fixture('gameData').as('gameData');
  });

  describe('Game Setup and Flow', () => {
    it('should complete a full Would You Rather game', function () {
      // Create game lobby
      cy.createGameLobby('would-you-rather', 'Player1');

      // Start the game
      cy.waitForGameStart();

      // Verify game has started
      cy.get('[data-cy="game-container"]').should('be.visible');
      cy.get('[data-cy="game-title"]').should('contain', 'Would You Rather');
      cy.get('[data-cy="game-phase"]').should('contain', 'Submit');
    });

    it('should display correct game instructions', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="game-instructions"]').should('be.visible');
      cy.get('[data-cy="game-instructions"]').should(
        'contain',
        'Create a Would You Rather scenario'
      );
    });

    it('should show round information', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="round-indicator"]').should('be.visible');
      cy.get('[data-cy="round-indicator"]').should('contain', 'Round 1 of 3');
    });
  });

  describe('Scenario Submission Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();
    });

    it('should allow players to submit scenarios', function () {
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];

      cy.get('[data-cy="scenario-input"]').should('be.visible');
      cy.get('[data-cy="scenario-input"]').should('have.attr', 'placeholder');

      cy.submitScenario(scenario);

      // Verify submission was successful
      cy.get('[data-cy="submission-success"]').should('be.visible');
      cy.get('[data-cy="waiting-message"]').should(
        'contain',
        'Waiting for other players'
      );
    });

    it('should validate scenario input', function () {
      cy.get('[data-cy="submit-scenario-button"]').click();

      // Should show validation error for empty input
      cy.get('[data-cy="validation-error"]').should('be.visible');
      cy.get('[data-cy="scenario-input"]').should('have.class', 'error');
    });

    it('should enforce character limits', function () {
      const longScenario = 'Would you rather ' + 'a'.repeat(200); // Assuming character limit

      cy.get('[data-cy="scenario-input"]').type(longScenario);
      cy.get('[data-cy="character-count"]').should('be.visible');
      cy.get('[data-cy="character-count"]').should('have.class', 'text-red');
    });

    it('should provide helpful placeholder text', function () {
      cy.get('[data-cy="scenario-input"]')
        .should('have.attr', 'placeholder')
        .and('contain', 'Would you rather');
    });

    it('should allow editing scenario before submission', function () {
      cy.get('[data-cy="scenario-input"]').type('Initial scenario');
      cy.get('[data-cy="scenario-input"]').clear();
      cy.get('[data-cy="scenario-input"]').type('Updated scenario');

      cy.get('[data-cy="scenario-input"]').should(
        'have.value',
        'Updated scenario'
      );
    });

    it('should show scenario preview', function () {
      const scenario = 'Would you rather have wings or be invisible?';
      cy.get('[data-cy="scenario-input"]').type(scenario);

      cy.get('[data-cy="scenario-preview"]').should('be.visible');
      cy.get('[data-cy="scenario-preview"]').should('contain', scenario);
    });
  });

  describe('Voting Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      // Submit scenario to advance to voting phase
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);

      // Simulate advancing to voting phase
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();
    });

    it('should display current scenario for voting', function () {
      cy.get('[data-cy="game-phase"]').should('contain', 'Vote');
      cy.get('[data-cy="current-scenario"]').should('be.visible');
      cy.get('[data-cy="choice-0"]').should('be.visible');
      cy.get('[data-cy="choice-1"]').should('be.visible');
    });

    it('should allow selecting between two choices', function () {
      cy.selectChoice(0); // Select first choice

      cy.get('[data-cy="choice-0"]').should('have.class', 'selected');
      cy.get('[data-cy="choice-1"]').should('not.have.class', 'selected');

      // Should be able to change selection
      cy.selectChoice(1);
      cy.get('[data-cy="choice-0"]').should('not.have.class', 'selected');
      cy.get('[data-cy="choice-1"]').should('have.class', 'selected');
    });

    it('should submit vote when choice is made', function () {
      cy.selectChoice(1);

      cy.get('[data-cy="vote-submitted"]').should('be.visible');
      cy.get('[data-cy="waiting-message"]').should(
        'contain',
        'Waiting for other players'
      );
    });

    it('should show voting progress', function () {
      cy.get('[data-cy="voting-progress"]').should('be.visible');
      cy.get('[data-cy="current-scenario-author"]').should('be.visible');
    });

    it('should display choice options clearly', function () {
      cy.get('[data-cy="choice-0"]').should('have.class', 'choice-button');
      cy.get('[data-cy="choice-1"]').should('have.class', 'choice-button');

      cy.get('[data-cy="choice-0"]').should('contain.text', 'A');
      cy.get('[data-cy="choice-1"]').should('contain.text', 'B');
    });

    it('should handle multiple rounds', function () {
      cy.selectChoice(0);

      // Advance to next round
      cy.get('[data-cy="advance-to-next-round"]', { timeout: 10000 }).click();

      cy.get('[data-cy="round-indicator"]').should('contain', 'Round 2 of 3');
      cy.get('[data-cy="new-scenario"]').should('be.visible');
    });
  });

  describe('Results Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      // Complete submission and voting for a round
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();
      cy.selectChoice(0);

      // Advance to results
      cy.get('[data-cy="advance-to-results"]', { timeout: 10000 }).click();
    });

    it('should display round results', function () {
      cy.waitForWouldYouRatherResults();

      cy.get('[data-cy="round-results"]').should('be.visible');
      cy.get('[data-cy="voting-breakdown"]').should('be.visible');
    });

    it('should show vote percentages', function () {
      cy.get('[data-cy="choice-percentage-0"]').should('be.visible');
      cy.get('[data-cy="choice-percentage-1"]').should('be.visible');

      cy.get('[data-cy="vote-count-0"]').should('be.visible');
      cy.get('[data-cy="vote-count-1"]').should('be.visible');
    });

    it('should display scenario author and points earned', function () {
      cy.get('[data-cy="scenario-author"]').should('be.visible');
      cy.get('[data-cy="author-points"]').should('be.visible');
    });

    it('should show who voted for what', function () {
      cy.get('[data-cy="voter-breakdown"]').should('be.visible');
      cy.get('[data-cy="choice-0-voters"]').should('be.visible');
      cy.get('[data-cy="choice-1-voters"]').should('be.visible');
    });

    it('should continue to next round if not final', function () {
      cy.get('[data-cy="continue-button"]').should('be.visible');
      cy.get('[data-cy="continue-button"]').click();

      cy.get('[data-cy="round-indicator"]').should('contain', 'Round 2');
    });
  });

  describe('Final Results', () => {
    beforeEach(function () {
      // Complete all three rounds
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      // Simulate completing all rounds
      for (let round = 1; round <= 3; round++) {
        const scenario =
          this.gameData.wouldYouRather.sampleScenarios[round - 1];
        cy.submitScenario(scenario);
        cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();
        cy.selectChoice(round % 2); // Alternate choices

        if (round < 3) {
          cy.get('[data-cy="advance-to-next-round"]', {
            timeout: 10000,
          }).click();
        } else {
          cy.get('[data-cy="advance-to-final-results"]', {
            timeout: 10000,
          }).click();
        }
      }
    });

    it('should display final game results', function () {
      cy.get('[data-cy="final-results"]').should('be.visible');
      cy.get('[data-cy="final-scores"]').should('be.visible');
      cy.get('[data-cy="winner-announcement"]').should('be.visible');
    });

    it('should show complete scoring breakdown', function () {
      cy.get('[data-cy="player-scores"]').should('be.visible');
      cy.get('[data-cy="score-breakdown"]').should('be.visible');
    });

    it('should display all scenarios from the game', function () {
      cy.get('[data-cy="game-summary"]').should('be.visible');
      cy.get('[data-cy="all-scenarios"]').should('be.visible');
    });

    it('should offer play again options', function () {
      cy.get('[data-cy="play-again-button"]').should('be.visible');
      cy.get('[data-cy="new-game-button"]').should('be.visible');
      cy.get('[data-cy="return-to-lobby-button"]').should('be.visible');
    });
  });

  describe('Multi-player Simulation', () => {
    it('should handle multiple players submitting scenarios', function () {
      cy.createGameLobby('would-you-rather', 'Player1');

      // Mock multiple players
      cy.window().then((win) => {
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

      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);

      cy.get('[data-cy="submission-count"]').should('contain', '1 of 3');
    });

    it('should rotate through different players scenarios', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      // In round 1, should vote on Player1's scenario
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();

      cy.get('[data-cy="current-scenario-author"]').should(
        'contain',
        'Player1'
      );
    });
  });

  describe('Responsive Design', () => {
    beforeEach(function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();
    });

    it('should display choices properly on mobile', function () {
      cy.setMobileViewport();

      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();

      cy.get('[data-cy="choice-0"]').should('be.visible');
      cy.get('[data-cy="choice-1"]').should('be.visible');

      // Choices should be stacked on mobile
      cy.get('[data-cy="choices-container"]').should('have.class', 'flex-col');
    });

    it('should work correctly on tablet viewport', function () {
      cy.setTabletViewport();

      cy.get('[data-cy="scenario-input"]').should('be.visible');
      cy.get('[data-cy="game-instructions"]').should('be.visible');
    });

    it('should work correctly on desktop viewport', function () {
      cy.setDesktopViewport();

      cy.get('[data-cy="scenario-input"]').should('be.visible');
      cy.get('[data-cy="game-instructions"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();
    });

    it('should be keyboard navigable', function () {
      cy.get('[data-cy="scenario-input"]').focus();
      cy.get('[data-cy="scenario-input"]').type('{tab}');
      cy.focused().should('have.attr', 'data-cy', 'submit-scenario-button');
    });

    it('should have proper ARIA labels', function () {
      cy.get('[data-cy="scenario-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="submit-scenario-button"]').should(
        'have.attr',
        'aria-label'
      );
    });

    it('should announce round changes', function () {
      cy.get('[data-cy="round-announcement"]').should(
        'have.attr',
        'role',
        'status'
      );
    });

    it('should have accessible voting buttons', function () {
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();

      cy.get('[data-cy="choice-0"]').should('have.attr', 'role', 'button');
      cy.get('[data-cy="choice-1"]').should('have.attr', 'role', 'button');
      cy.get('[data-cy="choice-0"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="choice-1"]').should('have.attr', 'aria-label');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket disconnection during voting', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();

      // Simulate connection loss
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_DISCONNECT' }, '*');
      });

      cy.get('[data-cy="connection-status"]').should('contain', 'Reconnecting');
    });

    it('should validate scenario format', function () {
      cy.get('[data-cy="scenario-input"]').type(
        'This is not a would you rather question'
      );
      cy.get('[data-cy="submit-scenario-button"]').click();

      cy.get('[data-cy="format-error"]').should('be.visible');
      cy.get('[data-cy="format-error"]').should(
        'contain',
        'must be a "Would you rather" question'
      );
    });

    it('should handle empty or invalid votes', function () {
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();

      // Try to proceed without voting
      cy.get('[data-cy="skip-vote-button"]').should('not.exist');

      // Must select a choice to proceed
      cy.get('[data-cy="choice-0"]').should('be.visible');
      cy.get('[data-cy="choice-1"]').should('be.visible');
    });
  });

  describe('Game State Persistence', () => {
    it('should maintain game state on page refresh', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);

      // Refresh page
      cy.reload();

      // Should maintain game state
      cy.get('[data-cy="game-container"]').should('be.visible');
      cy.get('[data-cy="submission-success"]').should('be.visible');
    });

    it('should remember round progress', function () {
      cy.createGameLobby('would-you-rather', 'Player1');
      cy.waitForGameStart();

      // Complete first round
      const scenario = this.gameData.wouldYouRather.sampleScenarios[0];
      cy.submitScenario(scenario);
      cy.get('[data-cy="advance-to-voting"]', { timeout: 10000 }).click();
      cy.selectChoice(0);
      cy.get('[data-cy="advance-to-next-round"]', { timeout: 10000 }).click();

      cy.get('[data-cy="round-indicator"]').should('contain', 'Round 2');

      // Refresh should maintain round progress
      cy.reload();
      cy.get('[data-cy="round-indicator"]').should('contain', 'Round 2');
    });
  });
});
