import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Clock, FileCheck, XCircle, FileClock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Outpass {
  id: string;
  student_name: string;
  register_number: string;
  department: string;
  reason: string;
  exit_time: string;
  return_time: string | null;
  status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [regNumber, setRegNumber] = useState(profile?.register_number || '');
  const [reason, setReason] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.register_number && !regNumber) {
      setRegNumber(profile.register_number);
    }
  }, [profile]);

  const fetchOutpasses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('outpasses')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutpasses(data || []);
    } catch (error) {
      console.error('Error fetching outpasses:', error);
      toast.error('Failed to load outpasses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error('User profile not fully loaded yet.');
      return;
    }

    if (!regNumber || !reason || !exitTime) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // By using our RLS, we don't have to specify md_id explicitly, it assumes the default from the helper
      const { error } = await supabase.from('outpasses').insert({
        student_name: profile.full_name || user.email,
        register_number: regNumber,
        department: profile.department || 'Unknown',
        reason: reason,
        exit_time: new Date(exitTime).toISOString(),
        return_time: expectedReturn ? new Date(expectedReturn).toISOString() : null,
        created_by: user.id,
        status: 'pending' // Enforced by default DB behavior but explicitly set here just in case
      });

      if (error) throw error;
      
      toast.success('Outpass requested successfully!');
      setReason('');
      setExitTime('');
      setExpectedReturn('');
      
      fetchOutpasses();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error('Failed to submit outpass request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return <FileClock className="h-4 w-4 text-amber-500" />;
      case 'active': return <FileCheck className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'returned': return <FileCheck className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'returned': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">My</span> Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Hello {profile?.full_name}, request and track your outpasses here.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <motion.div 
          className="md:col-span-1"
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="page-card sticky top-24">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-primary)' }}>
                <Plus className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-card-foreground">Request Outpass</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Register Number</Label>
                <Input 
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)} 
                  placeholder="e.g. 731120104001" 
                  required 
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</Label>
                <Textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="Why do you need an outpass?" 
                  required 
                  className="rounded-xl resize-none min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exit Time</Label>
                <Input 
                  type="datetime-local" 
                  value={exitTime} 
                  onChange={(e) => setExitTime(e.target.value)} 
                  required 
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expected Return (Optional)</Label>
                <Input 
                  type="datetime-local" 
                  value={expectedReturn} 
                  onChange={(e) => setExpectedReturn(e.target.value)} 
                  className="rounded-xl h-11"
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting} 
                className="w-full h-11 font-bold rounded-xl mt-2" 
                style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Request"}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* History Column */}
        <motion.div 
          className="md:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground">Recent Requests</h2>
            <Button variant="outline" size="sm" onClick={fetchOutpasses} disabled={loading} className="rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {loading ? (
             <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : outpasses.length === 0 ? (
            <div className="page-card flex flex-col items-center justify-center py-16 text-center">
               <FileClock className="h-12 w-12 text-muted-foreground/20 mb-4" />
               <h3 className="text-lg font-bold text-card-foreground">No Outpasses Yet</h3>
               <p className="text-sm text-muted-foreground mt-1 max-w-xs">You haven't requested any outpasses. Fill the form to create your first request.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {outpasses.map((pass) => (
                <div key={pass.id} className="page-card p-5 border border-border/50 hover:border-border transition-colors">
                   <div className="flex items-start justify-between mb-3">
                     <div>
                       <h4 className="font-bold text-base">{pass.reason}</h4>
                       <p className="text-xs text-muted-foreground mt-0.5">
                         Requested on: {format(new Date(pass.created_at), 'MMM dd, yyyy h:mm a')}
                       </p>
                     </div>
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(pass.status)} capitalize`}>
                       {getStatusIcon(pass.status)}
                       {pass.status}
                     </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Exit Time</p>
                        <p className="text-sm font-medium">{format(new Date(pass.exit_time), 'MMM dd, h:mm a')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Expected Return</p>
                        <p className="text-sm font-medium">{pass.return_time ? format(new Date(pass.return_time), 'MMM dd, h:mm a') : '—'}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
