/// <reference types="cypress" />

describe('Quick Draw Game', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.fixture('gameData').as('gameData');
  });

  describe('Game Setup and Flow', () => {
    it('should complete a full Quick Draw game', function () {
      // Create game lobby
      cy.createGameLobby('quick-draw', 'Player1');

      // Start the game
      cy.waitForGameStart();

      // Verify game has started
      cy.get('[data-cy="game-container"]').should('be.visible');
      cy.get('[data-cy="game-title"]').should('contain', 'Quick Draw');
      cy.get('[data-cy="game-phase"]').should('contain', 'Drawing');
    });

    it('should display correct game instructions', function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="game-instructions"]').should('be.visible');
      cy.get('[data-cy="game-instructions"]').should(
        'contain',
        'Draw the word shown below'
      );
    });

    it('should show round information and timer', function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="round-indicator"]').should('be.visible');
      cy.get('[data-cy="timer"]').should('be.visible');
      cy.get('[data-cy="current-word"]').should('be.visible');
    });
  });

  describe('Drawing Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();
    });

    it('should display drawing canvas and tools', function () {
      cy.get('[data-cy="drawing-canvas"]').should('be.visible');
      cy.get('[data-cy="canvas-tools"]').should('be.visible');
      cy.get('[data-cy="brush-tool"]').should('be.visible');
      cy.get('[data-cy="eraser-tool"]').should('be.visible');
      cy.get('[data-cy="clear-canvas-button"]').should('be.visible');
    });

    it('should show the word to draw', function () {
      cy.get('[data-cy="current-word"]').should('be.visible');
      cy.get('[data-cy="current-word"]').should('not.be.empty');
    });

    it('should allow drawing on canvas', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;

      cy.drawOnCanvas(drawingPath);

      // Verify drawing was registered
      cy.get('[data-cy="drawing-canvas"]').should(
        'have.attr',
        'data-has-drawing',
        'true'
      );
    });

    it('should provide different brush sizes', function () {
      cy.get('[data-cy="brush-size-small"]').should('be.visible');
      cy.get('[data-cy="brush-size-medium"]').should('be.visible');
      cy.get('[data-cy="brush-size-large"]').should('be.visible');

      cy.get('[data-cy="brush-size-large"]').click();
      cy.get('[data-cy="brush-size-large"]').should('have.class', 'selected');
    });

    it('should provide different colors', function () {
      cy.get('[data-cy="color-black"]').should('be.visible');
      cy.get('[data-cy="color-red"]').should('be.visible');
      cy.get('[data-cy="color-blue"]').should('be.visible');
      cy.get('[data-cy="color-green"]').should('be.visible');

      cy.get('[data-cy="color-red"]').click();
      cy.get('[data-cy="color-red"]').should('have.class', 'selected');
    });

    it('should allow switching between brush and eraser', function () {
      cy.get('[data-cy="brush-tool"]').should('have.class', 'selected');

      cy.get('[data-cy="eraser-tool"]').click();
      cy.get('[data-cy="eraser-tool"]').should('have.class', 'selected');
      cy.get('[data-cy="brush-tool"]').should('not.have.class', 'selected');
    });

    it('should clear canvas when clear button is clicked', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);

      cy.clearCanvas();

      cy.get('[data-cy="drawing-canvas"]').should(
        'have.attr',
        'data-has-drawing',
        'false'
      );
    });

    it('should support undo functionality', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);

      cy.get('[data-cy="undo-button"]').should('be.visible');
      cy.get('[data-cy="undo-button"]').click();

      // Should have fewer strokes after undo
      cy.get('[data-cy="stroke-count"]').should(
        'not.contain',
        drawingPath.length.toString()
      );
    });

    it('should show drawing timer countdown', function () {
      cy.get('[data-cy="timer"]').should('be.visible');
      cy.get('[data-cy="timer"]').should('contain', '60'); // 60 second drawing phase

      // Wait a second and check timer decreases
      cy.wait(1000);
      cy.get('[data-cy="timer"]').should('contain', '59');
    });

    it('should automatically advance when drawing time expires', function () {
      // Fast-forward time or mock timer
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_TIMER_EXPIRE' }, '*');
      });

      cy.get('[data-cy="game-phase"]').should('contain', 'Guessing', {
        timeout: 5000,
      });
    });

    it('should sync drawing in real-time', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.cat;
      cy.drawOnCanvas(drawingPath);

      // Verify strokes are being sent
      cy.get('[data-cy="sync-indicator"]').should('contain', 'Synced');
    });
  });

  describe('Guessing Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      // Complete drawing phase
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);

      // Advance to guessing phase
      cy.get('[data-cy="advance-to-guessing"]', { timeout: 10000 }).click();
    });

    it('should display other players drawing', function () {
      cy.get('[data-cy="game-phase"]').should('contain', 'Guessing');
      cy.get('[data-cy="drawing-display"]').should('be.visible');
      cy.get('[data-cy="current-drawer"]').should('be.visible');
    });

    it('should allow submitting guesses', function () {
      const guess = this.gameData.quickDraw.sampleGuesses[0];

      cy.get('[data-cy="guess-input"]').should('be.visible');
      cy.submitGuess(guess);

      cy.get('[data-cy="guess-submitted"]').should('be.visible');
      cy.get('[data-cy="guess-list"]').should('contain', guess);
    });

    it('should validate guess input', function () {
      cy.get('[data-cy="submit-guess-button"]').click();

      // Should show validation for empty guess
      cy.get('[data-cy="guess-input"]').should('have.class', 'error');
    });

    it('should show live guesses from other players', function () {
      cy.get('[data-cy="live-guesses"]').should('be.visible');

      // Mock incoming guess
      cy.window().then((win) => {
        win.postMessage(
          {
            type: 'MOCK_GUESS',
            payload: { player: 'Player2', guess: 'house' },
          },
          '*'
        );
      });

      cy.get('[data-cy="live-guesses"]').should('contain', 'Player2: house');
    });

    it('should show guessing timer', function () {
      cy.get('[data-cy="timer"]').should('be.visible');
      cy.get('[data-cy="timer"]').should('contain', '30'); // 30 second guessing phase
    });

    it('should highlight correct guesses', function () {
      // Submit correct guess
      cy.submitGuess('house'); // Assuming house is the correct word

      cy.get('[data-cy="correct-guess-indicator"]').should('be.visible');
      cy.get('[data-cy="points-earned"]').should('be.visible');
    });

    it('should allow multiple guess attempts', function () {
      cy.submitGuess('cat');
      cy.submitGuess('dog');
      cy.submitGuess('house');

      cy.get('[data-cy="guess-list"]').should('contain', 'cat');
      cy.get('[data-cy="guess-list"]').should('contain', 'dog');
      cy.get('[data-cy="guess-list"]').should('contain', 'house');
    });

    it('should prevent duplicate guesses', function () {
      cy.submitGuess('house');
      cy.submitGuess('house');

      cy.get('[data-cy="duplicate-guess-warning"]').should('be.visible');
    });

    it('should show current drawer information', function () {
      cy.get('[data-cy="current-drawer"]').should('be.visible');
      cy.get('[data-cy="drawer-name"]').should('not.be.empty');
      cy.get('[data-cy="word-length-hint"]').should('be.visible');
    });
  });

  describe('Results Phase', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      // Complete drawing and guessing phases
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);
      cy.get('[data-cy="advance-to-guessing"]', { timeout: 10000 }).click();
      cy.submitGuess('house');
      cy.get('[data-cy="advance-to-results"]', { timeout: 10000 }).click();
    });

    it('should display round results', function () {
      cy.waitForQuickDrawResults();

      cy.get('[data-cy="round-results"]').should('be.visible');
      cy.get('[data-cy="word-reveal"]').should('be.visible');
      cy.get('[data-cy="drawing-reveal"]').should('be.visible');
    });

    it('should show correct word and drawing', function () {
      cy.get('[data-cy="correct-word"]').should('be.visible');
      cy.get('[data-cy="final-drawing"]').should('be.visible');
      cy.get('[data-cy="drawer-name"]').should('be.visible');
    });

    it('should display scoring breakdown', function () {
      cy.get('[data-cy="scoring-breakdown"]').should('be.visible');
      cy.get('[data-cy="drawer-points"]').should('be.visible');
      cy.get('[data-cy="guesser-points"]').should('be.visible');
    });

    it('should show who guessed correctly', function () {
      cy.get('[data-cy="correct-guessers"]').should('be.visible');
      cy.get('[data-cy="guess-times"]').should('be.visible');
    });

    it('should display speed bonuses', function () {
      cy.get('[data-cy="speed-bonus"]').should('be.visible');
      cy.get('[data-cy="bonus-explanation"]').should('be.visible');
    });

    it('should continue to next player turn', function () {
      cy.get('[data-cy="next-turn-button"]').should('be.visible');
      cy.get('[data-cy="next-turn-button"]').click();

      cy.get('[data-cy="next-drawer"]').should('be.visible');
    });
  });

  describe('Final Results', () => {
    beforeEach(function () {
      // Complete a full game (all players have drawn)
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      // Simulate completing all turns
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_GAME_COMPLETE' }, '*');
      });
    });

    it('should display final game results', function () {
      cy.get('[data-cy="final-results"]').should('be.visible');
      cy.get('[data-cy="final-scores"]').should('be.visible');
      cy.get('[data-cy="winner-announcement"]').should('be.visible');
    });

    it('should show complete game summary', function () {
      cy.get('[data-cy="game-summary"]').should('be.visible');
      cy.get('[data-cy="all-drawings"]').should('be.visible');
      cy.get('[data-cy="drawing-gallery"]').should('be.visible');
    });

    it('should display player statistics', function () {
      cy.get('[data-cy="player-stats"]').should('be.visible');
      cy.get('[data-cy="best-drawer"]').should('be.visible');
      cy.get('[data-cy="fastest-guesser"]').should('be.visible');
    });

    it('should offer play again options', function () {
      cy.get('[data-cy="play-again-button"]').should('be.visible');
      cy.get('[data-cy="new-game-button"]').should('be.visible');
      cy.get('[data-cy="return-to-lobby-button"]').should('be.visible');
    });
  });

  describe('Canvas Interactions', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();
    });

    it('should support touch drawing on mobile', function () {
      cy.setMobileViewport();

      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.cat;

      // Use touch events instead of mouse events
      cy.get('[data-cy="drawing-canvas"]').then(($canvas) => {
        const canvas = $canvas[0] as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        cy.get('[data-cy="drawing-canvas"]').trigger('touchstart', {
          touches: [{ clientX: rect.left + 100, clientY: rect.top + 100 }],
        });

        cy.get('[data-cy="drawing-canvas"]').trigger('touchmove', {
          touches: [{ clientX: rect.left + 150, clientY: rect.top + 150 }],
        });

        cy.get('[data-cy="drawing-canvas"]').trigger('touchend');
      });

      cy.get('[data-cy="drawing-canvas"]').should(
        'have.attr',
        'data-has-drawing',
        'true'
      );
    });

    it('should prevent drawing outside canvas bounds', function () {
      // Try to draw outside canvas
      cy.get('body').trigger('mousedown', { clientX: 10, clientY: 10 });
      cy.get('body').trigger('mousemove', { clientX: 50, clientY: 50 });
      cy.get('body').trigger('mouseup');

      // Canvas should not register drawing
      cy.get('[data-cy="drawing-canvas"]').should(
        'have.attr',
        'data-has-drawing',
        'false'
      );
    });

    it('should handle canvas resize correctly', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);

      // Resize viewport
      cy.setTabletViewport();

      // Drawing should still be visible
      cy.get('[data-cy="drawing-canvas"]').should(
        'have.attr',
        'data-has-drawing',
        'true'
      );
    });

    it('should support pressure-sensitive drawing', function () {
      // This would test pressure sensitivity on supported devices
      cy.get('[data-cy="drawing-canvas"]').then(($canvas) => {
        const canvas = $canvas[0] as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        cy.get('[data-cy="drawing-canvas"]').trigger('pointerdown', {
          clientX: rect.left + 100,
          clientY: rect.top + 100,
          pressure: 0.5,
        });
      });
    });
  });

  describe('Real-time Synchronization', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();
    });

    it('should sync drawing strokes in real-time', function () {
      const drawingPath = this.gameData.quickDraw.sampleDrawingPaths.house;
      cy.drawOnCanvas(drawingPath);

      // Verify sync indicators
      cy.get('[data-cy="sync-status"]').should('contain', 'Synced');
      cy.get('[data-cy="stroke-count"]').should('be.visible');
    });

    it('should handle connection interruptions gracefully', function () {
      cy.drawOnCanvas(this.gameData.quickDraw.sampleDrawingPaths.cat);

      // Simulate connection loss
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_DISCONNECT' }, '*');
      });

      cy.get('[data-cy="offline-mode"]').should('be.visible');
      cy.get('[data-cy="sync-pending"]').should('be.visible');
    });

    it('should queue strokes during disconnection', function () {
      // Simulate offline drawing
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_DISCONNECT' }, '*');
      });

      cy.drawOnCanvas(this.gameData.quickDraw.sampleDrawingPaths.house);

      cy.get('[data-cy="queued-strokes"]').should('not.contain', '0');
    });
  });

  describe('Accessibility', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();
    });

    it('should provide keyboard navigation for tools', function () {
      cy.get('[data-cy="brush-tool"]').focus();
      cy.get('[data-cy="brush-tool"]').type('{tab}');
      cy.focused().should('have.attr', 'data-cy', 'eraser-tool');
    });

    it('should have proper ARIA labels for canvas tools', function () {
      cy.get('[data-cy="drawing-canvas"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="brush-tool"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="eraser-tool"]').should('have.attr', 'aria-label');
    });

    it('should announce drawing actions', function () {
      cy.get('[data-cy="drawing-announcements"]').should(
        'have.attr',
        'role',
        'status'
      );
    });

    it('should provide alternative input methods', function () {
      // For users who cannot draw
      cy.get('[data-cy="skip-drawing-button"]').should('be.visible');
      cy.get('[data-cy="template-shapes"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    beforeEach(function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();
    });

    it('should handle many rapid strokes without lag', function () {
      // Simulate rapid drawing
      const rapidStrokes = Array.from({ length: 50 }, (_, i) => ({
        x: 100 + i,
        y: 100 + i,
      }));

      cy.drawOnCanvas(rapidStrokes);

      // Should remain responsive
      cy.get('[data-cy="drawing-canvas"]').should('be.visible');
      cy.get('[data-cy="performance-indicator"]').should('not.contain', 'lag');
    });

    it('should optimize canvas rendering', function () {
      cy.window()
        .its('performance')
        .then((performance) => {
          const startTime = performance.now();

          cy.drawOnCanvas(
            this.gameData.quickDraw.sampleDrawingPaths.house
          ).then(() => {
            cy.window()
              .its('performance')
              .then((performance) => {
                const endTime = performance.now();
                expect(endTime - startTime).to.be.lessThan(1000); // Should complete within 1 second
              });
          });
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas initialization errors', function () {
      // Mock canvas context failure
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_CANVAS_ERROR' }, '*');
      });

      cy.visit('/');
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      cy.get('[data-cy="canvas-error"]').should('be.visible');
      cy.get('[data-cy="fallback-mode"]').should('be.visible');
    });

    it('should recover from drawing errors', function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      // Simulate drawing error
      cy.window().then((win) => {
        win.postMessage({ type: 'MOCK_DRAWING_ERROR' }, '*');
      });

      cy.get('[data-cy="drawing-error"]').should('be.visible');
      cy.get('[data-cy="retry-drawing"]').click();

      // Should recover
      cy.get('[data-cy="drawing-canvas"]').should('be.visible');
    });

    it('should handle invalid guess formats', function () {
      cy.createGameLobby('quick-draw', 'Player1');
      cy.waitForGameStart();

      // Complete drawing and enter guessing phase
      cy.drawOnCanvas(this.gameData.quickDraw.sampleDrawingPaths.house);
      cy.get('[data-cy="advance-to-guessing"]', { timeout: 10000 }).click();

      // Try invalid guesses
      cy.submitGuess(''); // Empty
      cy.get('[data-cy="validation-error"]').should('be.visible');

      cy.submitGuess('a'.repeat(51)); // Too long
      cy.get('[data-cy="validation-error"]').should('contain', 'too long');
    });
  });
});
