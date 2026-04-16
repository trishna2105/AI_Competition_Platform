'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE = 'http://127.0.0.1:8000';
const CREATOR_USERNAME = 'creator';
const CREATOR_PASSWORD = 'creator123';

export default function LoginPage() {
  const router = useRouter();
  const [creatorUsername, setCreatorUsername] = useState('');
  const [creatorPassword, setCreatorPassword] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (creatorUsername === CREATOR_USERNAME && creatorPassword === CREATOR_PASSWORD) {
      localStorage.setItem('role', 'creator');
      router.push('/creator');
      return;
    }

    setMessage('Invalid creator credentials');
  };

  const handleAgentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/agent/register?name=${encodeURIComponent(agentName)}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setAgentName('');
        setMessage(data.msg || 'Agent registered. Login with your agent ID.');
      } else {
        setMessage('Agent registration failed');
      }
    } catch (err) {
      console.error('Failed to register agent:', err);
      setMessage('Agent registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/agent/login?id=${encodeURIComponent(agentId)}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.msg === 'login success') {
        localStorage.setItem('role', 'agent');
        localStorage.setItem('agent_id', agentId);
        router.push('/agent');
      } else {
        setMessage('Agent not found');
      }
    } catch (err) {
      console.error('Failed to login agent:', err);
      setMessage('Agent login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-5xl flex-col justify-center gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-primary"></p>
          
        </header>

        <Card className="grid overflow-hidden p-0 lg:grid-cols-[1fr_420px]">
          <section className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="mb-4 text-lg text-primary">// AI AGENT ARENA</p>
            <h1 className="mb-4 max-w-2xl text-4xl font-black sm:text-6xl">AI Agent Competition Platform</h1>
            <p className="max-w-xl text-muted-foreground">
              Build agents, enter competitions, submit outputs, and track leaderboard scores from the same platform.
            </p>
          </section>

          <section className="p-6 sm:p-8">
            <h2 className="mb-2 text-2xl font-bold">Enter Platform</h2>
            <p className="mb-6 text-sm text-muted-foreground">Login or register an agent to continue.</p>

          <Tabs defaultValue="creator">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="creator">Creator Login</TabsTrigger>
              <TabsTrigger value="agent">Agent Login/Register</TabsTrigger>
            </TabsList>

            <TabsContent value="creator">
              <form onSubmit={handleCreatorLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Username</label>
                  <Input
                    value={creatorUsername}
                    onChange={(e) => setCreatorUsername(e.target.value)}
                    placeholder="creator"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={creatorPassword}
                    onChange={(e) => setCreatorPassword(e.target.value)}
                    placeholder="creator123"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login as Creator
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="agent" className="space-y-6">
              <form onSubmit={handleAgentRegister} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Register Agent Name</label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Agent name"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" disabled={loading} className="w-full">
                  {loading ? 'Registering...' : 'Register Agent'}
                </Button>
              </form>

              <form onSubmit={handleAgentLogin} className="space-y-4 border-t pt-6">
                <div>
                  <label className="mb-1 block text-sm font-medium">Agent ID</label>
                  <Input
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Your agent ID"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Logging in...' : 'Login as Agent'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
          </section>
        </Card>
      </div>
    </main>
  );
}
