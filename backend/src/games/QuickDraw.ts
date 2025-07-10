import {
  GameSession,
  QuickDrawGameState,
  QuickDrawRound,
  QuickDrawPrompt,
  QuickDrawGuess,
  QuickDrawGameAction,
  DrawingCanvas,
  DrawingStroke,
} from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

// Word prompts for drawing challenges
const WORD_PROMPTS: QuickDrawPrompt[] = [
  // Easy words
  { id: '1', word: 'cat', category: 'animals', difficulty: 'easy', hints: ['pet', 'meows'] },
  { id: '2', word: 'house', category: 'objects', difficulty: 'easy', hints: ['building', 'home'] },
  { id: '3', word: 'sun', category: 'nature', difficulty: 'easy', hints: ['bright', 'sky'] },
  { id: '4', word: 'car', category: 'vehicles', difficulty: 'easy', hints: ['wheels', 'drive'] },
  { id: '5', word: 'tree', category: 'nature', difficulty: 'easy', hints: ['leaves', 'trunk'] },
  { id: '6', word: 'fish', category: 'animals', difficulty: 'easy', hints: ['water', 'swim'] },
  { id: '7', word: 'book', category: 'objects', difficulty: 'easy', hints: ['read', 'pages'] },
  { id: '8', word: 'flower', category: 'nature', difficulty: 'easy', hints: ['petals', 'garden'] },
  
  // Medium words
  { id: '9', word: 'elephant', category: 'animals', difficulty: 'medium', hints: ['trunk', 'large'] },
  { id: '10', word: 'pizza', category: 'food', difficulty: 'medium', hints: ['cheese', 'slice'] },
  { id: '11', word: 'guitar', category: 'instruments', difficulty: 'medium', hints: ['strings', 'music'] },
  { id: '12', word: 'bicycle', category: 'vehicles', difficulty: 'medium', hints: ['pedals', 'two wheels'] },
  { id: '13', word: 'computer', category: 'technology', difficulty: 'medium', hints: ['screen', 'keyboard'] },
  { id: '14', word: 'rainbow', category: 'nature', difficulty: 'medium', hints: ['colors', 'arc'] },
  { id: '15', word: 'astronaut', category: 'people', difficulty: 'medium', hints: ['space', 'helmet'] },
  { id: '16', word: 'lighthouse', category: 'buildings', difficulty: 'medium', hints: ['beacon', 'ocean'] },

  // Hard words
  { id: '17', word: 'democracy', category: 'concepts', difficulty: 'hard', hints: ['voting', 'government'] },
  { id: '18', word: 'microscope', category: 'science', difficulty: 'hard', hints: ['magnify', 'small'] },
  { id: '19', word: 'waterfall', category: 'nature', difficulty: 'hard', hints: ['cascade', 'rocks'] },
  { id: '20', word: 'volcano', category: 'nature', difficulty: 'hard', hints: ['eruption', 'lava'] },
  { id: '21', word: 'submarine', category: 'vehicles', difficulty: 'hard', hints: ['underwater', 'periscope'] },
  { id: '22', word: 'chandelier', category: 'objects', difficulty: 'hard', hints: ['ceiling', 'crystal'] },
  { id: '23', word: 'tornado', category: 'weather', difficulty: 'hard', hints: ['spiral', 'wind'] },
  { id: '24', word: 'archaeology', category: 'science', difficulty: 'hard', hints: ['dig', 'ancient'] },
];

export class QuickDrawGame {
  private gameState: QuickDrawGameState;
  private roundTimer: NodeJS.Timeout | null = null;
  private usedPrompts: Set<string> = new Set();

  constructor(private lobby: GameSession) {
    // Shuffle player order for fair turn distribution
    const playerOrder = [...this.lobby.players.map(p => p.id)];
    this.shuffleArray(playerOrder);

    this.gameState = {
      currentRound: 0,
      totalRounds: Math.min(playerOrder.length * 2, 8), // 2 rounds per player, max 8
      rounds: [],
      scores: {},
      playerOrder,
      gamePhase: 'setup',
    };

    // Initialize scores
    this.lobby.players.forEach(player => {
      this.gameState.scores[player.id] = 0;
    });
  }

  public handleAction(action: QuickDrawGameAction): any {
    switch (action.type) {
      case 'start_drawing':
        return this.handleStartDrawing(action);
      case 'add_stroke':
        return this.handleAddStroke(action);
      case 'submit_guess':
        return this.handleSubmitGuess(action);
      case 'clear_canvas':
        return this.handleClearCanvas(action);
      case 'undo_stroke':
        return this.handleUndoStroke(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleStartDrawing(action: QuickDrawGameAction): any {
    if (this.gameState.gamePhase !== 'setup' && this.gameState.gamePhase !== 'playing') {
      throw new Error('Game is not in a state to start drawing');
    }

    this.startNewRound();
    return this.getGameState();
  }

  private handleAddStroke(action: QuickDrawGameAction): any {
    if (!action.data.stroke) {
      throw new Error('Stroke data is required');
    }

    const currentRound = this.getCurrentRound();
    if (!currentRound) {
      throw new Error('No active round');
    }

    if (currentRound.drawerId !== action.playerId) {
      throw new Error('Only the current drawer can add strokes');
    }

    if (currentRound.phase !== 'drawing' && currentRound.phase !== 'guessing') {
      throw new Error('Not in drawing phase');
    }

    // Add stroke to canvas
    currentRound.canvas.strokes.push(action.data.stroke);
    
    return this.getGameState();
  }

  private handleSubmitGuess(action: QuickDrawGameAction): any {
    if (!action.data.guess) {
      throw new Error('Guess is required');
    }

    const currentRound = this.getCurrentRound();
    if (!currentRound) {
      throw new Error('No active round');
    }

    if (currentRound.drawerId === action.playerId) {
      throw new Error('The drawer cannot submit guesses');
    }

    if (currentRound.phase !== 'guessing') {
      throw new Error('Not in guessing phase');
    }

    // Check if player already guessed correctly
    const existingGuess = currentRound.guesses.find(
      g => g.playerId === action.playerId && g.isCorrect
    );
    if (existingGuess) {
      throw new Error('You already guessed correctly');
    }

    const guess = action.data.guess.toLowerCase().trim();
    const correctWord = currentRound.prompt.word.toLowerCase();
    const isCorrect = guess === correctWord;

    const guessData: QuickDrawGuess = {
      playerId: action.playerId,
      guess: action.data.guess.trim(),
      timestamp: new Date(),
      isCorrect,
    };

    currentRound.guesses.push(guessData);

    // Award points if correct
    if (isCorrect) {
      this.awardPointsForCorrectGuess(action.playerId, currentRound);
    }

    // Check if round should end
    this.checkRoundCompletion(currentRound);

    return this.getGameState();
  }

  private handleClearCanvas(action: QuickDrawGameAction): any {
    const currentRound = this.getCurrentRound();
    if (!currentRound) {
      throw new Error('No active round');
    }

    if (currentRound.drawerId !== action.playerId) {
      throw new Error('Only the current drawer can clear the canvas');
    }

    currentRound.canvas.strokes = [];
    return this.getGameState();
  }

  private handleUndoStroke(action: QuickDrawGameAction): any {
    const currentRound = this.getCurrentRound();
    if (!currentRound) {
      throw new Error('No active round');
    }

    if (currentRound.drawerId !== action.playerId) {
      throw new Error('Only the current drawer can undo strokes');
    }

    if (currentRound.canvas.strokes.length > 0) {
      currentRound.canvas.strokes.pop();
    }

    return this.getGameState();
  }

  private startNewRound(): void {
    this.gameState.currentRound++;
    
    if (this.gameState.currentRound > this.gameState.totalRounds) {
      this.endGame();
      return;
    }

    const drawerIndex = (this.gameState.currentRound - 1) % this.gameState.playerOrder.length;
    const drawerId = this.gameState.playerOrder[drawerIndex];
    const prompt = this.getRandomPrompt();

    const newRound: QuickDrawRound = {
      roundNumber: this.gameState.currentRound,
      drawerId,
      prompt,
      canvas: {
        strokes: [],
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      },
      guesses: [],
      timeLimit: 90, // 90 seconds per round
      timeRemaining: 90,
      phase: 'drawing',
      startedAt: new Date(),
    };

    this.gameState.rounds.push(newRound);
    this.gameState.gamePhase = 'playing';

    // Start round timer
    this.startRoundTimer(newRound);
  }

  private startRoundTimer(round: QuickDrawRound): void {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }

    this.roundTimer = setInterval(() => {
      round.timeRemaining--;

      // Transition from drawing to guessing phase at 30 seconds remaining
      if (round.timeRemaining === 30 && round.phase === 'drawing') {
        round.phase = 'guessing';
      }

      // End round when time runs out
      if (round.timeRemaining <= 0) {
        this.endRound(round);
      }
    }, 1000);
  }

  private endRound(round: QuickDrawRound): void {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }

    round.phase = 'reveal';
    round.completedAt = new Date();

    // Award points to drawer if anyone guessed correctly
    const correctGuesses = round.guesses.filter(g => g.isCorrect);
    if (correctGuesses.length > 0) {
      this.gameState.scores[round.drawerId] += correctGuesses.length * 2; // 2 points per correct guess
    }

    // Move to next round after a delay
    setTimeout(() => {
      if (this.gameState.currentRound >= this.gameState.totalRounds) {
        this.endGame();
      } else {
        this.startNewRound();
      }
    }, 5000); // 5 second reveal phase
  }

  private checkRoundCompletion(round: QuickDrawRound): void {
    // End round early if all players guessed correctly
    const nonDrawerPlayers = this.lobby.players.filter(p => p.id !== round.drawerId);
    const correctGuesses = round.guesses.filter(g => g.isCorrect);
    
    if (correctGuesses.length >= nonDrawerPlayers.length) {
      this.endRound(round);
    }
  }

  private awardPointsForCorrectGuess(playerId: string, round: QuickDrawRound): void {
    const correctGuessCount = round.guesses.filter(g => g.isCorrect).length;
    
    // First correct guess gets 10 points, subsequent guesses get decreasing points
    let points = Math.max(10 - (correctGuessCount - 1) * 2, 2);
    
    // Bonus points for speed (based on time remaining)
    if (round.timeRemaining > 60) {
      points += 3; // Speed bonus
    } else if (round.timeRemaining > 30) {
      points += 1;
    }

    this.gameState.scores[playerId] += points;
  }

  private endGame(): void {
    this.gameState.gamePhase = 'finished';
    
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }

  private getRandomPrompt(): QuickDrawPrompt {
    // Filter out already used prompts
    const availablePrompts = WORD_PROMPTS.filter(p => !this.usedPrompts.has(p.id));
    
    // If all prompts used, reset the pool
    if (availablePrompts.length === 0) {
      this.usedPrompts.clear();
      return WORD_PROMPTS[Math.floor(Math.random() * WORD_PROMPTS.length)];
    }

    const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    this.usedPrompts.add(selectedPrompt.id);
    
    return selectedPrompt;
  }

  private getCurrentRound(): QuickDrawRound | undefined {
    return this.gameState.rounds[this.gameState.currentRound - 1];
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  public getGameState(): any {
    const currentRound = this.getCurrentRound();
    
    return {
      ...this.gameState,
      currentRoundData: currentRound,
      canDraw: currentRound?.phase === 'drawing' || currentRound?.phase === 'guessing',
      canGuess: currentRound?.phase === 'guessing',
    };
  }

  public isGameComplete(): boolean {
    return this.gameState.gamePhase === 'finished';
  }

  public getWinner(): string | null {
    if (!this.isGameComplete()) return null;

    const sortedScores = Object.entries(this.gameState.scores)
      .sort(([,a], [,b]) => b - a);

    return sortedScores.length > 0 ? sortedScores[0][0] : null;
  }

  public getFinalResults(): any {
    return {
      finalScores: this.gameState.scores,
      winner: this.getWinner(),
      summary: `Game completed after ${this.gameState.totalRounds} rounds`,
      totalRounds: this.gameState.totalRounds,
      rounds: this.gameState.rounds,
    };
  }

  public cleanup(): void {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }
} 
