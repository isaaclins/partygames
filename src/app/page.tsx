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

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && players.length < maxPlayers) {
      setPlayers([...players, name.trim()]);
      setName("");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
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
          >
            Start Game
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
