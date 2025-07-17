"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PlayerSetup() {
  const [players, setPlayers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [spies, setSpies] = useState(1);
  const maxPlayers = 16;
  const minPlayers = 3;
  const maxSpies = 3;
  const [phase, setPhase] = useState<'setup' | 'reveal'>('setup');
  const [roles, setRoles] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && players.length < maxPlayers) {
      setPlayers([...players, name.trim()]);
      setName("");
    }
  };

  const startGame = () => {
    // Assign roles: randomly select spies, rest are non-spies
    const indices = Array.from({ length: players.length }, (_, i) => i);
    const spyIndices = indices.sort(() => 0.5 - Math.random()).slice(0, spies);
    const rolesArr = players.map((_, i) => spyIndices.includes(i) ? 'Spy' : 'Not Spy');
    setRoles(rolesArr);
    setPhase('reveal');
    setCurrent(0);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      {phase === 'setup' ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h1 className="text-2xl font-bold">Spyfall: Player Setup</h1>
            <p className="text-sm text-neutral-500">Enter player names (3-16 players)</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="spy-count" className="mb-1 block">Number of Spies</Label>
              <select
                id="spy-count"
                value={spies}
                onChange={e => setSpies(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <form onSubmit={addPlayer} className="flex gap-2 mb-4">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Player name"
                disabled={players.length >= maxPlayers}
                maxLength={24}
                className="w-full"
              />
              <Button type="submit" disabled={!name.trim() || players.length >= maxPlayers}>
                Add
              </Button>
            </form>
            <ul className="mb-4 space-y-1">
              {players.map((p, i) => (
                <li key={i} className="text-base text-neutral-800">
                  {i + 1}. {p}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              disabled={players.length < minPlayers || spies >= players.length}
              variant="default"
              size="lg"
              onClick={startGame}
            >
              Start Game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">{players[current]}'s Card</h2>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <p className="mb-4 text-lg text-neutral-700">Tap to reveal your role</p>
            <Button
              className="mb-4"
              size="lg"
              onClick={() => setCurrent(c => c + 1)}
              disabled={current >= players.length - 1}
            >
              {roles[current] === 'Spy' ? 'You are the Spy' : 'You are NOT the Spy'}
            </Button>
            {current < players.length - 1 ? (
              <p className="text-sm text-neutral-500">Pass to the next player</p>
            ) : (
              <p className="text-sm text-neutral-500">All roles revealed. (Voting phase coming soon)</p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
