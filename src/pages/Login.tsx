import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Invalid credentials. Please contact the app admin to get an account.');
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated background orbs */}
      <div className="floating-orb w-96 h-96 -top-48 -left-48 bg-primary" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="floating-orb w-80 h-80 -bottom-40 -right-40 bg-accent" style={{ animation: 'float 10s ease-in-out infinite 2s' }} />
      <div className="floating-orb w-64 h-64 top-1/4 right-1/4 bg-primary-glow" style={{ animation: 'float 12s ease-in-out infinite 4s' }} />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}>
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            <span className="gradient-text">CampusGate</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground tracking-wide">Smart Campus Gate Management</p>
        </motion.div>

        {/* Login card */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative rounded-3xl border border-border/30 bg-card/80 backdrop-blur-xl p-8 space-y-6"
          style={{ boxShadow: 'var(--shadow-card-hover)' }}
        >
          {/* Gradient top border */}
          <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full" style={{ background: 'var(--gradient-primary)' }} />
          
          <div>
            <h2 className="font-display text-2xl font-bold text-card-foreground">Welcome Back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 pl-10 rounded-xl bg-background/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12 pl-10 rounded-xl bg-background/50" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-sm font-bold rounded-xl relative overflow-hidden"
            disabled={loading}
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-1">
            Contact the app admin to get an account
          </p>
        </motion.form>

        {/* Bottom accent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground/50">Secured with end-to-end encryption</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
