import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface VisitorRecord {
  id: string;
  visitor_name: string;
  phone: string;
  purpose: string;
  meeting_person: string;
  entry_time: string;
}

export default function Visitors() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ visitor_name: '', phone: '', purpose: '', meeting_person: '' });
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchTodayVisitors = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('visitors')
      .select('id, visitor_name, phone, purpose, meeting_person, entry_time')
      .gte('entry_time', todayStart.toISOString())
      .order('entry_time', { ascending: false });
    setRecords(data || []);
    setFetching(false);
  };

  useEffect(() => { fetchTodayVisitors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name.trim() || !form.phone.trim() || !form.purpose.trim() || !form.meeting_person.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('visitors').insert({
      visitor_name: form.visitor_name.trim(),
      phone: form.phone.trim(),
      purpose: form.purpose.trim(),
      meeting_person: form.meeting_person.trim(),
      created_by: user?.id,
      institute: profile?.institute || null,
    } as any);
    if (error) {
      toast.error('Failed to add visitor');
    } else {
      toast.success('Visitor entry recorded!');
      setForm({ visitor_name: '', phone: '', purpose: '', meeting_person: '' });
      fetchTodayVisitors();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Visitor</span> Entry
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Record visitor details at the campus gate</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="page-card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-warm)' }}>
            <Plus className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-card-foreground">New Visitor</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visitor Name</Label>
            <Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} required maxLength={100} placeholder="Full name" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={15} placeholder="+91 9876543210" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose</Label>
            <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required maxLength={200} placeholder="Reason for visit" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Person to Meet</Label>
            <Input value={form.meeting_person} onChange={(e) => setForm({ ...form, meeting_person: e.target.value })} required maxLength={100} placeholder="Staff name" className="h-11 rounded-xl" />
          </div>
        </div>
        <Button type="submit" className="mt-6 h-11 rounded-xl font-bold text-white" disabled={loading} style={{ background: 'var(--gradient-warm)' }}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Add Visitor
        </Button>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Today's Visitors</h2>
        {fetching ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : records.length === 0 ? (
          <div className="page-card flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No visitors today</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Meeting</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{r.visitor_name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.phone}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.purpose}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.meeting_person}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(r.entry_time), 'hh:mm a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
