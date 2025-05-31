"use client";
import React, { useEffect, useState } from "react";

interface Option {
  id: number;
  text: string;
  _count: { votes: number };
}

interface Poll {
  id: number;
  question: string;
  options: Option[];
  endsAt?: string;
}

export default function ResultsPage() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
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

  async function fetchResults() {
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
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="max-w-xl mx-auto p-4 text-center">Loading...</div>;
  if (error) return <div className="max-w-xl mx-auto p-4 text-center text-red-500">{error}</div>;
  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt._count.votes || 0), 0);
  const pollEnded = poll && poll.endsAt && timeLeft !== null && timeLeft <= 0;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Results</h1>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4 text-gray-800 text-center">{poll.question}</h2>
        {poll.endsAt && timeLeft !== null && !pollEnded && (
          <div className="text-center text-blue-600 font-semibold mb-4">
            Time left: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
        {pollEnded && (
          <div className="text-red-600 text-center font-semibold mb-4">Poll ended.</div>
        )}
        <ul className="space-y-4">
          {poll.options.map((opt) => {
            const votes = opt._count.votes || 0;
            const percent = totalVotes ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
            return (
              <li key={opt.id} className="flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">{opt.text}</span>
                  <span className="font-mono text-gray-600">{votes} votes ({percent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-3 mt-1">
                  <div
                    className="bg-blue-500 h-3 rounded"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="text-center text-gray-500 mt-4 text-sm">Total votes: {totalVotes}</div>
      </div>
    </div>
  );
} 