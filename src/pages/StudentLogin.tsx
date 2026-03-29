import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const { token, student } = await api.auth.studentLogin(username.trim(), password);
      setToken(token);
      login('student', student);
      toast.success('Logged in');
      navigate('/student');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 flex justify-center items-center min-h-[70vh]">
          <Card className="glass-card w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Student Login</CardTitle>
                  <CardDescription>Sign in with credentials provided by admin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentLogin;
