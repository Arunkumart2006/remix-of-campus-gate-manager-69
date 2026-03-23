import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Bus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface BusRecord {
  id: string;
  bus_number: string;
  driver_name: string | null;
  entry_time: string;
}

export default function BusEntry() {
  const { user, profile } = useAuth();
  const [busNumber, setBusNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<BusRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);

  const fetchTodayBuses = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('buses')
      .select('id, bus_number, driver_name, entry_time')
      .gte('entry_time', todayStart.toISOString())
      .order('entry_time', { ascending: false });
    setRecords(data || []);
    setFetching(false);
  };

  useEffect(() => { fetchTodayBuses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNumber.trim()) {
      toast.error('Bus number is required');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('buses').insert({
      bus_number: busNumber.trim().toUpperCase(),
      driver_name: driverName.trim() || null,
      created_by: user?.id,
      institute: profile?.institute || null,
    } as any);
    if (error) {
      toast.error('Failed to add bus entry');
    } else {
      toast.success('Bus entry recorded!');
      setBusNumber('');
      setDriverName('');
      fetchTodayBuses();
    }
    setLoading(false);
  };

  const filtered = records.filter((r) =>
    r.bus_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Bus</span> Entry
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Record bus entries at the campus gate</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="page-card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-warm)' }}>
            <Plus className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-card-foreground">New Entry</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bus Number</Label>
            <Input placeholder="e.g. TN-01-AB-1234" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required maxLength={20} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver Name</Label>
            <Input placeholder="Optional" value={driverName} onChange={(e) => setDriverName(e.target.value)} maxLength={100} className="h-11 rounded-xl" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 rounded-xl font-bold text-white" style={{ background: 'var(--gradient-warm)' }}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Entry
            </Button>
          </div>
        </div>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-foreground">Today's Entries</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search bus number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
          </div>
        </div>

        {fetching ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="page-card flex flex-col items-center justify-center py-12">
            <Bus className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No bus entries found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Bus Number</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="px-5 py-3.5 font-bold text-foreground">{r.bus_number}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.driver_name || '—'}</td>
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
