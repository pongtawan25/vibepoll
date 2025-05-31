"use client";
import React, { useEffect, useState } from "react";

interface Option {
  id: number;
  text: string;
  _count?: { votes: number };
}

interface Poll {
  id: number;
  question: string;
  options: Option[];
  endsAt?: string;
}

export default function VotePage() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);

  useEffect(() => {
    fetchPoll();
  }, []);

  useEffect(() => {
    if (poll && poll.endsAt) {
      const update = () => {
        if (!poll.endsAt) return setTimeLeft(null);
        const diff = Math.floor((new Date(poll.endsAt as string).getTime() - Date.now()) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [poll]);

  async function fetchPoll() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vote");
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "No active poll");
        setPoll(null);
      } else {
        const data = await res.json();
        setPoll(data);
        // Check if already voted for this poll
        if (typeof window !== "undefined") {
          const votedPollId = localStorage.getItem("votedPollId");
          const votedOptionId = localStorage.getItem("votedOptionId");
          setVoted(votedPollId === String(data.id));
          setVotedOptionId(votedPollId === String(data.id) && votedOptionId ? Number(votedOptionId) : null);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !poll) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Vote failed");
      } else {
        setVoted(true);
        setVotedOptionId(selected);
        if (typeof window !== "undefined") {
          localStorage.setItem("votedPollId", String(poll.id));
          localStorage.setItem("votedOptionId", String(selected));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const votingEnded = !!(poll && poll.endsAt && typeof timeLeft === 'number' && timeLeft <= 0);

  if (loading) return <div className="max-w-xl mx-auto p-4 text-center">Loading...</div>;
  if (error) return <div className="max-w-xl mx-auto p-4 text-center text-red-500">{error}</div>;
  if (!poll) return null;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Vote</h1>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4 text-gray-800 text-center">{poll.question}</h2>
        {poll.endsAt && timeLeft !== null && !votingEnded && (
          <div className="text-center text-blue-600 font-semibold mb-4">
            Time left: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
        {votingEnded ? (
          <div className="text-red-600 text-center font-semibold">Voting has ended.</div>
        ) : voted ? (
          <div className="text-green-600 text-center font-semibold">
            Thank you for voting!<br />
            {votedOptionId && poll.options.find(o => o.id === votedOptionId) && (
              <span className="block mt-2 text-gray-800">You voted: <b>{poll.options.find(o => o.id === votedOptionId)?.text}</b></span>
            )}
          </div>
        ) : (
          <form onSubmit={handleVote} className="flex flex-col gap-4 items-center">
            {poll.options.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="radio"
                  name="option"
                  value={opt.id}
                  checked={selected === opt.id}
                  onChange={() => setSelected(opt.id)}
                  className="accent-blue-600"
                  required
                  disabled={Boolean(votingEnded)}
                />
                <span className="text-gray-800">{opt.text}</span>
              </label>
            ))}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded w-full max-w-xs"
              disabled={selected === null || loading || Boolean(votingEnded)}
            >
              Vote
            </button>
            {error && <div className="text-red-500 text-center">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
} 