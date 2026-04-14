'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE = 'http://127.0.0.1:8000';

interface Competition {
  id: string;
  title: string;
  prompt: string;
  max_iterations: number;
  min_agents: number;
}

interface Submission {
  agent_id: string;
  image_url: string;
  score: number;
}

interface LeaderboardEntry {
  agent_id: string;
  score: number;
}

export default function App() {
  const [mode, setMode] = useState<'creator' | 'agent'>('creator');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  
  // Creator form states
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState('5');
  const [minAgents, setMinAgents] = useState('2');
  
  // Agent states
  const [agentId, setAgentId] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch competitions on mount
  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await fetch(`${API_BASE}/competitions`);
      const data = await res.json();
      setCompetitions(data);
    } catch (err) {
      console.error('Failed to fetch competitions:', err);
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/competition/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          prompt,
          max_iterations: parseInt(maxIterations),
          min_agents: parseInt(minAgents),
        }),
      });
      if (res.ok) {
        setTitle('');
        setPrompt('');
        setMaxIterations('5');
        setMinAgents('2');
        fetchCompetitions();
      }
    } catch (err) {
      console.error('Failed to create competition:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompetition = async (compId: string) => {
    if (!agentId.trim()) {
      alert('Please enter an agent ID');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/competition/${compId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      if (res.ok) {
        setSelectedCompetition(compId);
        fetchSubmissions(compId);
        fetchLeaderboard(compId);
      } else {
        alert('Failed to join competition');
      }
    } catch (err) {
      console.error('Failed to join competition:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (compId: string) => {
    try {
      const res = await fetch(`${API_BASE}/competition/${compId}/submissions`);
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const fetchLeaderboard = async (compId: string) => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard/${compId}`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">AI Agent Competition</h1>
        <p className="text-muted-foreground mb-8">Create competitions and compete with agents</p>

        {/* Mode Toggle */}
        <Tabs defaultValue="creator" value={mode} onValueChange={(v) => setMode(v as 'creator' | 'agent')}>
          <TabsList className="mb-6">
            <TabsTrigger value="creator">Creator</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
          </TabsList>

          {/* Creator Mode */}
          <TabsContent value="creator" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create Competition</h2>
              <form onSubmit={handleCreateCompetition} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Competition title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Competition prompt"
                    className="w-full p-2 border rounded bg-input text-foreground"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Iterations</label>
                    <Input
                      type="number"
                      value={maxIterations}
                      onChange={(e) => setMaxIterations(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Agents</label>
                    <Input
                      type="number"
                      value={minAgents}
                      onChange={(e) => setMinAgents(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Competition'}
                </Button>
              </form>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4">Active Competitions</h2>
              <div className="grid gap-4">
                {competitions.map((comp) => (
                  <Card key={comp.id} className="p-4">
                    <h3 className="font-bold text-lg">{comp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{comp.prompt}</p>
                    <div className="flex gap-4 text-sm">
                      <span>Max Iterations: {comp.max_iterations}</span>
                      <span>Min Agents: {comp.min_agents}</span>
                    </div>
                  </Card>
                ))}
                {competitions.length === 0 && (
                  <p className="text-muted-foreground">No competitions yet</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Agent Mode */}
          <TabsContent value="agent" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Join Competition</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Agent ID</label>
                  <Input
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Your agent ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Competition</label>
                  <div className="grid gap-3">
                    {competitions.map((comp) => (
                      <Button
                        key={comp.id}
                        onClick={() => handleJoinCompetition(comp.id)}
                        disabled={loading}
                        variant={selectedCompetition === comp.id ? 'default' : 'outline'}
                        className="text-left h-auto p-4 justify-start"
                      >
                        <div>
                          <div className="font-bold">{comp.title}</div>
                          <div className="text-sm opacity-75">{comp.prompt}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {selectedCompetition && (
              <>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Submissions</h2>
                  <div className="grid gap-4">
                    {submissions.map((sub, idx) => (
                      <div key={idx} className="border rounded p-4">
                        <p className="font-medium mb-2">{sub.agent_id}</p>
                        {sub.image_url && (
                          <img
                            src={sub.image_url}
                            alt="Submission"
                            className="max-w-full h-auto rounded mb-2"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">Score: {sub.score}</p>
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <p className="text-muted-foreground">No submissions yet</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                  <div className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-card border rounded"
                      >
                        <span className="font-medium">{entry.agent_id}</span>
                        <span className="text-muted-foreground">Score: {entry.score}</span>
                      </div>
                    ))}
                    {leaderboard.length === 0 && (
                      <p className="text-muted-foreground">No entries yet</p>
                    )}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
