"use client";

import React, { useEffect, useState } from 'react';

interface Option {
  id: number;
  text: string;
}

interface Poll {
  id: number;
  question: string;
  isActive: boolean;
  createdAt: string;
  options: Option[];
  endsAt?: string;
}

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    fetchPolls();
  }, []);

  async function fetchPolls() {
    const res = await fetch('/api/polls');
    const data = await res.json();
    setPolls(data);
  }

  function handleOptionChange(idx: number, value: string) {
    setOptions(opts => opts.map((opt, i) => (i === idx ? value : opt)));
  }

  function addOption() {
    setOptions([...options, '']);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(opts => opts.filter((_, i) => i !== idx));
  }

  function startEdit(poll: Poll) {
    setEditingId(poll.id);
    setQuestion(poll.question);
    setOptions(poll.options.map(o => o.text));
    if (poll.endsAt) {
      const diff = Math.round((new Date(poll.endsAt).getTime() - Date.now()) / 60000);
      setCountdown(diff > 0 ? String(diff) : '');
      setEndsAt(poll.endsAt);
    } else {
      setCountdown('');
      setEndsAt(null);
    }
  }

  function resetForm() {
    setEditingId(null);
    setQuestion('');
    setOptions(['', '']);
    setCountdown('');
    setEndsAt(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let endsAtValue: string | null = null;
      if (countdown && !isNaN(Number(countdown))) {
        endsAtValue = new Date(Date.now() + Number(countdown) * 60000).toISOString();
      }
      const body = JSON.stringify({ question, options, endsAt: endsAtValue, countdownMinutes: countdown ? Number(countdown) : undefined });
      let res;
      if (editingId) {
        res = await fetch(`/api/polls/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } else {
        res = await fetch('/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      }
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Error');
      } else {
        resetForm();
        fetchPolls();
      }
    } finally {
      setLoading(false);
    }
  }

  async function activatePoll(id: number) {
    setLoading(true);
    await fetch(`/api/polls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    fetchPolls();
    setLoading(false);
  }

  async function deactivatePoll(id: number) {
    setLoading(true);
    await fetch(`/api/polls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    fetchPolls();
    setLoading(false);
  }

  async function deletePoll(id: number) {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    setLoading(true);
    await fetch(`/api/polls/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    fetchPolls();
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Polls</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2 text-gray-800">{editingId ? 'Edit Poll' : 'Create Poll'}</h2>
        <input
          className="border p-2 w-full mb-2 placeholder-gray-500 text-black"
          placeholder="Poll question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          required
        />
        <label className="block mb-2 text-gray-700 font-medium">Countdown (optional):</label>
        <select
          className="border p-2 w-full mb-2 text-black"
          value={countdown}
          onChange={e => setCountdown(e.target.value)}
        >
          <option value="">None</option>
          <option value="3">3 minutes</option>
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="30">30 minutes</option>
        </select>
        {endsAt && (
          <div className="mb-2 text-sm text-gray-500">
            Ends at: {new Date(endsAt).toLocaleString()}
          </div>
        )}
        {options.map((opt, idx) => (
          <div key={idx} className="flex mb-2">
            <input
              className="border p-2 flex-1 placeholder-gray-500 text-black"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              required
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(idx)} className="ml-2 text-red-500">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addOption} className="text-blue-500 mb-2">+ Add Option</button>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          )}
        </div>
      </form>
      <h2 className="font-semibold mb-2 text-white">All Polls</h2>
      <table className="w-full bg-gray-800 rounded shadow text-white">
        <thead>
          <tr className="bg-gray-900">
            <th className="p-2 text-left">Question</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {polls.map((poll, idx) => (
            <tr key={poll.id} className={poll.isActive ? 'bg-green-900' : idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
              <td className="p-2">{poll.question}</td>
              <td className="p-2 text-center">{poll.isActive ? 'Active' : 'Inactive'}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => startEdit(poll)} className="text-blue-300">Edit</button>
                {poll.isActive ? (
                  <button onClick={() => deactivatePoll(poll.id)} className="text-yellow-300">Deactivate</button>
                ) : (
                  <button onClick={() => activatePoll(poll.id)} className="text-green-300">Activate</button>
                )}
                <button onClick={() => deletePoll(poll.id)} className="text-red-400">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 