# WHEN, THEN and SHALL

This adds the Spyfall game, allowing players to use a single
device without internet connectivity. Players enter their names and then view individual
role cards one at a time by tapping through each player's card.

## Requirements

### Requirement 1

**User Story:** As a game organizer, I want to enter player names for the game, so that each
player can be identified when viewing their role card.

#### Acceptance Criteria

1. WHEN the setup screen loads THEN the system SHALL display a form to enter player names and select the number of spies
2. WHEN a player name is entered and submitted THEN the system SHALL add it to the player list
3. WHEN at least 3 players are entered THEN the system SHALL enable the "Start Game" button
4. WHEN the maximum of 16 players is reached THEN the system SHALL disable adding more players
5. WHEN "Start Game" is clicked THEN the system SHALL generate roles (including the selected number of spies) and proceed to role reveal

### Requirement 2

**User Story:** As a player, I want to view my role privately using individual player cards, so that
I can see my assignment without others seeing it.

#### Acceptance Criteria

1. WHEN the game starts THEN the system SHALL display the first player's name card
2. WHEN a player name card is displayed THEN the system SHALL show only the player's name initially
3. WHEN the name card is clicked THEN the system SHALL reveal the player's role (location or "You
   are the Spy")
4. WHEN the role is revealed and the card is clicked again THEN the system SHALL hide the role and
   show the next player's name card
5. WHEN all players have viewed their roles THEN the system SHALL proceed to the voting phase

### Requirement 3

**User Story:** As a group of players, I want to participate in a voting phase to identify the spy,
so that we can play the strategic elimination aspect of Spyfall.

#### Acceptance Criteria

1. WHEN all role cards have been revealed THEN the system SHALL proceed to the voting phase
2. WHEN the voting phase starts THEN the system SHALL randomly select the first player to vote
3. WHEN a player's turn to vote THEN the system SHALL display their name and a grid of all other
   players' names (excluding their own)
4. WHEN the voting player selects a suspect THEN the system SHALL require confirmation of their vote
5. WHEN a vote is confirmed THEN the system SHALL proceed to the next random player's voting turn
6. WHEN all players have voted THEN the system SHALL calculate and display who received the most
   votes

### Requirement 4

**User Story:** As a player, I want to see the voting results and game outcome, so that I know
whether the spy was successfully identified.

#### Acceptance Criteria

1. WHEN voting is complete THEN the system SHALL reveal who received the most votes
2. WHEN the results are shown THEN the system SHALL display all player roles for verification
3. WHEN there's a tie in votes THEN the system SHALL return to the game phase for continued
   discussion
4. WHEN the spy receives the most votes THEN the system SHALL indicate the non-spy players won
5. WHEN a non-spy receives the most votes THEN the system SHALL indicate the spy won
6. WHEN results are displayed THEN the system SHALL provide option to start a new offline game

### Requirement 5

**User Story:** As a player, I want clear instructions and privacy protection during play,
so that the game runs smoothly and fairly.

#### Acceptance Criteria

1. WHEN entering the page THEN the system SHALL display brief instructions on single-device
   gameplay and rules
2. WHEN viewing role cards THEN the system SHALL provide privacy reminders like "Make sure others
   can't see"
3. WHEN transitioning between cards THEN the system SHALL provide clear visual cues about what to do
   next
4. WHEN the spy card is revealed THEN the system SHALL clearly indicate "You are the Spy" without
   showing the location
5. WHEN voting begins THEN the system SHALL explain the voting process and rules
