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
  const [phase, setPhase] = useState<"setup" | "reveal" | "voting" | "results">(
    "setup"
  );
  const [roles, setRoles] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [votingOrder, setVotingOrder] = useState<number[]>([]);
  const [voteIndex, setVoteIndex] = useState(0);
  // Each element in votes is an array of indices voted for by that player
  const [votes, setVotes] = useState<number[][]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);

  // Spyfall locations and roles
  const LOCATIONS = [
    {
      name: "Pirate Ship",
      roles: [
        "Captain",
        "First Mate",
        "Cook",
        "Navigator",
        "Sailor",
        "Prisoner",
        "Stowaway",
        "Cannoneer",
      ],
    },
    {
      name: "Space Station",
      roles: [
        "Commander",
        "Scientist",
        "Engineer",
        "Pilot",
        "Doctor",
        "Alien",
        "Security Officer",
        "Technician",
      ],
    },
    {
      name: "Casino",
      roles: [
        "Dealer",
        "Gambler",
        "Security",
        "Bartender",
        "Manager",
        "Waiter",
        "Entertainer",
        "VIP",
      ],
    },
    {
      name: "Movie Studio",
      roles: [
        "Director",
        "Actor",
        "Cameraman",
        "Makeup Artist",
        "Producer",
        "Stunt Double",
        "Screenwriter",
        "Sound Engineer",
      ],
    },
    {
      name: "Hospital",
      roles: [
        "Doctor",
        "Nurse",
        "Patient",
        "Surgeon",
        "Receptionist",
        "Anesthetist",
        "Janitor",
        "Pharmacist",
      ],
    },
    {
      name: "Circus",
      roles: [
        "Ringmaster",
        "Clown",
        "Acrobat",
        "Animal Trainer",
        "Magician",
        "Juggler",
        "Strongman",
        "Tightrope Walker",
      ],
    },
    {
      name: "Submarine",
      roles: [
        "Captain",
        "Sonar Operator",
        "Cook",
        "Navigator",
        "Engineer",
        "Medic",
        "Weapons Officer",
        "Diver",
      ],
    },
    {
      name: "Theater",
      roles: [
        "Director",
        "Lead Actor",
        "Stagehand",
        "Lighting Tech",
        "Audience Member",
        "Usher",
        "Musician",
        "Playwright",
      ],
    },
    {
      name: "Restaurant",
      roles: [
        "Chef",
        "Waiter",
        "Manager",
        "Customer",
        "Dishwasher",
        "Host",
        "Sommelier",
        "Busser",
      ],
    },
    {
      name: "School",
      roles: [
        "Teacher",
        "Student",
        "Principal",
        "Janitor",
        "Counselor",
        "Coach",
        "Librarian",
        "Nurse",
      ],
    },
  ];

  const [playerRoles, setPlayerRoles] = useState<
    { role: string; location: string }[]
  >([]);

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && players.length < maxPlayers) {
      setPlayers([...players, name.trim()]);
      setName("");
    }
  };

  const startGame = () => {
    // Pick a random location
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    // setLocation(loc.name); // Removed unused variable
    // Assign spies
    const indices = Array.from({ length: players.length }, (_, i) => i);
    const spyIndices = indices.sort(() => 0.5 - Math.random()).slice(0, spies);
    // Assign unique roles to non-spies
    let availableRoles = [...loc.roles];
    // If more non-spies than roles, repeat roles
    while (availableRoles.length < players.length - spies) {
      availableRoles = availableRoles.concat(loc.roles);
    }
    availableRoles = availableRoles.slice(0, players.length - spies);
    let roleIdx = 0;
    const playerRolesArr = players.map((_, i) => {
      if (spyIndices.includes(i)) {
        return { role: "Spy", location: "" };
      } else {
        const role = availableRoles[roleIdx++];
        return { role, location: loc.name };
      }
    });
    setPlayerRoles(playerRolesArr);
    setRoles(playerRolesArr.map((r) => r.role));
    setPhase("reveal");
    setCurrent(0);
  };

  // Results calculation
  let results = null;
  if (phase === "results" && votes.length === players.length) {
    // Tally votes
    const tally = Array(players.length).fill(0);
    votes.forEach((voteArr) => {
      voteArr?.forEach((v) => {
        if (typeof v === "number") tally[v]++;
      });
    });
    const maxVotes = Math.max(...tally);
    const winners = tally
      .map((v, i) => (v === maxVotes ? i : null))
      .filter((i) => i !== null) as number[];
    const isTie = winners.length > 1;
    const spyIndices = roles
      .map((r, i) => (r === "Spy" ? i : null))
      .filter((i) => i !== null) as number[];
    const spyCaught = winners.some((i) => roles[i] === "Spy");
    results = { tally, maxVotes, winners, isTie, spyIndices, spyCaught };
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      {phase === "setup" ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h1 className="text-2xl font-bold">Spyfall: Player Setup</h1>
            <p className="text-sm text-neutral-500">
              Enter player names (3-16 players)
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="spy-count" className="mb-1 block">
                Number of Spies
              </Label>
              <select
                id="spy-count"
                value={spies}
                onChange={(e) => setSpies(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {Array.from({ length: maxPlayers }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  )
                )}
              </select>
            </div>
            <form onSubmit={addPlayer} className="flex gap-2 mb-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player name"
                disabled={players.length >= maxPlayers}
                maxLength={24}
                className="w-full"
              />
              <Button
                type="submit"
                disabled={!name.trim() || players.length >= maxPlayers}
              >
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
      ) : phase === "reveal" ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              {players[current]}&apos;s Card
            </h2>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {!revealed ? (
              <>
                <p className="mb-4 text-lg text-neutral-700">
                  {players[current]}
                </p>
                <Button
                  className="mb-4"
                  size="lg"
                  onClick={() => setRevealed(true)}
                >
                  Reveal Role
                </Button>
                <p className="text-sm text-neutral-500">
                  Make sure others can&apos;t see your screen!
                </p>
              </>
            ) : (
              <>
                {playerRoles[current]?.role === "Spy" ? (
                  <>
                    <p className="mb-4 text-lg text-neutral-700">
                      You are the Spy
                    </p>
                    <p className="mb-2 text-neutral-500">
                      Try to figure out the location!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-lg text-neutral-700">
                      Location:{" "}
                      <span className="font-semibold">
                        {playerRoles[current]?.location}
                      </span>
                    </p>
                    <p className="mb-4 text-lg text-neutral-700">
                      Your Role:{" "}
                      <span className="font-semibold">
                        {playerRoles[current]?.role}
                      </span>
                    </p>
                  </>
                )}
                <Button
                  className="mb-4"
                  size="lg"
                  onClick={() => {
                    setRevealed(false);
                    setCurrent((c) => c + 1);
                  }}
                  disabled={current >= players.length - 1}
                >
                  {current < players.length - 1 ? "Next Player" : "Continue"}
                </Button>
                <p className="text-sm text-neutral-500">
                  Hide your role before passing the device.
                </p>
              </>
            )}
            {current >= players.length - 1 && revealed && (
              <Button
                className="mt-4"
                onClick={() => {
                  // Prepare voting phase
                  const order = Array.from(
                    { length: players.length },
                    (_, i) => i
                  ).sort(() => 0.5 - Math.random());
                  setVotingOrder(order);
                  setVoteIndex(0);
                  setVotes([]);
                  setPhase("voting");
                }}
              >
                Start Voting
              </Button>
            )}
          </CardContent>
        </Card>
      ) : phase === "voting" ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">Voting Phase</h2>
            <p className="text-sm text-neutral-500 mb-2">
              {players[votingOrder[voteIndex]]}, it&apos;s your turn to vote
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-neutral-700">
              Votes remaining: {spies - (votes[voteIndex]?.length || 0)}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.map(
                (p, i) =>
                  i !== votingOrder[voteIndex] &&
                  !votes[voteIndex]?.includes(i) && (
                    <Button
                      key={i}
                      variant={confirming === i ? "default" : "outline"}
                      onClick={() => setConfirming(i)}
                      className="truncate"
                    >
                      {p}
                    </Button>
                  )
              )}
            </div>
            {confirming !== null && (
              <div className="mb-2">
                <p className="text-sm mb-2">
                  Vote for{" "}
                  <span className="font-semibold">{players[confirming]}</span>?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setVotes((vs) => {
                        const newVotes = [...vs];
                        if (!newVotes[voteIndex]) newVotes[voteIndex] = [];
                        newVotes[voteIndex] = [
                          ...newVotes[voteIndex],
                          confirming,
                        ];
                        return newVotes;
                      });
                      setConfirming(null);
                    }}
                  >
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {(votes[voteIndex]?.length || 0) === spies && (
              <Button
                className="w-full mt-2"
                onClick={() => {
                  if (voteIndex < players.length - 1) {
                    setVoteIndex(voteIndex + 1);
                  } else {
                    setPhase("results");
                  }
                }}
              >
                Submit Votes
              </Button>
            )}
            <p className="text-xs text-neutral-400">
              You cannot vote for yourself. You must select {spies} different
              players.
            </p>
          </CardContent>
        </Card>
      ) : phase === "results" ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">Results</h2>
          </CardHeader>
          <CardContent>
            {results && (
              <>
                <p className="mb-2 text-lg font-semibold">
                  {results.isTie
                    ? "There is a tie! Vote again."
                    : results.spyCaught
                    ? "The spy was caught! Non-spies win."
                    : "The spy wins!"}
                </p>
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Votes:</h3>
                  <ul className="text-sm mb-2">
                    {players.map((p, i) => (
                      <li key={i}>
                        {p}: {results.tally[i]} vote
                        {results.tally[i] !== 1 ? "s" : ""}
                        {results.spyIndices.includes(i) ? " (Spy)" : ""}
                      </li>
                    ))}
                  </ul>
                  <h3 className="font-semibold mb-1">Roles:</h3>
                  <ul className="text-sm">
                    {players.map((p, i) => (
                      <li key={i}>
                        {p}: {roles[i]}
                      </li>
                    ))}
                  </ul>
                </div>
                {results.isTie ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setVotes([]);
                      setVoteIndex(0);
                      setConfirming(null);
                      setPhase("voting");
                    }}
                  >
                    Revote
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    Start New Game
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
