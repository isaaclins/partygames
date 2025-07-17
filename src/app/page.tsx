"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem } from "@/components/ui/form";

export default function PlayerSetup() {
  const [players, setPlayers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const maxPlayers = 16;

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
            disabled={players.length < 3}
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
