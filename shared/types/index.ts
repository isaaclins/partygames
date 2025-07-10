// Shared types and interfaces
export interface User {
  id: string;
  name: string;
}

export interface GameSession {
  id: string;
  players: User[];
  gameType: string;
}
