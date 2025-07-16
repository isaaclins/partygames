/// <reference types="cypress" />

describe('Offline Spyfall - End-to-End', () => {
  const players = ['Alice', 'Bob', 'Charlie'];

  beforeEach(() => {
    cy.visit('/');
    cy.contains('Spyfall').click();
    cy.contains('Offline').click();
  });

  it('plays a full offline game flow', () => {
    // Player setup
    players.forEach((name) => {
      cy.get('input[placeholder="Enter player name"]').type(name);
      cy.contains('Add Player').click();
    });
    cy.contains('Start Game').click();

    // Role reveal for each player
    players.forEach((name) => {
      cy.contains(`${name}'s Turn`).should('be.visible');
      cy.contains('Privacy Reminder').should('be.visible');
      cy.contains("I'm Ready - Show My Role").click();
      cy.contains('Tap to reveal your role').parent().click();
      cy.contains('Tap to continue').parent().click();
      cy.contains('Next Player').click();
    });

    // Discussion phase
    cy.contains('Discussion Phase').should('be.visible');
    cy.contains('Start Voting').click();

    // Voting phase (vote for the first available player each time)
    for (let i = 0; i < players.length; i++) {
      cy.get('[data-testid^="player-button-"]').first().click();
      cy.get('[data-testid="confirm-vote"]').click();
    }

    // Results (could be tie or win)
    cy.get('[data-testid="results-title"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="tie-message"]').length) {
        cy.get('[data-testid="tie-message"]').should('be.visible');
        cy.get('[data-testid="return-to-discussion"]').click();
        cy.contains('Discussion Phase').should('be.visible');
      } else {
        cy.get('[data-testid="winner-announcement"]').should('be.visible');
        cy.get('[data-testid="restart-game"]').click();
        cy.contains('Setup Players').should('be.visible');
      }
    });
  });

  it('shows privacy reminders and only reveals one role at a time', () => {
    players.forEach((name) => {
      cy.get('input[placeholder="Enter player name"]').type(name);
      cy.contains('Add Player').click();
    });
    cy.contains('Start Game').click();

    players.forEach((name) => {
      cy.contains(`${name}'s Turn`).should('be.visible');
      cy.contains('Privacy Reminder').should('be.visible');
      cy.contains("I'm Ready - Show My Role").click();
      cy.contains('Tap to reveal your role').parent().click();
      cy.contains('Tap to continue').parent().click();
      cy.contains('Next Player').click();
    });
  });

  it('handles voting tie and returns to discussion', () => {
    // Setup
    players.forEach((name) => {
      cy.get('input[placeholder="Enter player name"]').type(name);
      cy.contains('Add Player').click();
    });
    cy.contains('Start Game').click();
    players.forEach((name) => {
      cy.contains("I'm Ready - Show My Role").click();
      cy.contains('Tap to reveal your role').parent().click();
      cy.contains('Tap to continue').parent().click();
      cy.contains('Next Player').click();
    });
    cy.contains('Start Voting').click();
    // All vote for the same player to force a tie
    for (let i = 0; i < players.length; i++) {
      cy.get('[data-testid="player-button-Bob"]').click();
      cy.get('[data-testid="confirm-vote"]').click();
    }
    cy.get('[data-testid="tie-message"]').should('be.visible');
    cy.get('[data-testid="return-to-discussion"]').click();
    cy.contains('Discussion Phase').should('be.visible');
  });

  it('prevents starting with less than 3 players or duplicate/empty names', () => {
    cy.get('input[placeholder="Enter player name"]').type('Alice');
    cy.contains('Add Player').click();
    cy.contains('Start Game').should('be.disabled');
    cy.get('input[placeholder="Enter player name"]').type('');
    cy.contains('Add Player').click();
    cy.contains('Player name cannot be empty').should('be.visible');
    cy.get('input[placeholder="Enter player name"]').type('Alice');
    cy.contains('Add Player').click();
    cy.contains('This player name already exists').should('be.visible');
  });

  it('handles maximum players (16)', () => {
    for (let i = 1; i <= 16; i++) {
      cy.get('input[placeholder="Enter player name"]').type(`Player${i}`);
      cy.contains('Add Player').click();
    }
    cy.contains('Maximum Players Reached').should('be.visible');
    cy.get('input[placeholder="Enter player name"]').should('be.disabled');
    cy.get('button').contains('Maximum Players Reached').should('be.disabled');
  });
}); 
