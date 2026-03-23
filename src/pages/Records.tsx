import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, FileSearch } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function Records() {
  const { role } = useAuth();
  const showBusTab = role === 'watchman' || role === 'md' || role === 'principal' || role === 'hod' || role === 'staff';
  const showVisitorTab = role === 'watchman' || role === 'md';

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [busResults, setBusResults] = useState<any[]>([]);
  const [outpassResults, setOutpassResults] = useState<any[]>([]);
  const [visitorResults, setVisitorResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('outpasses');

  const handleSearch = async () => {
    setLoading(true);
    const query = searchQuery.trim().toLowerCase();

    if (activeTab === 'buses') {
      let q = supabase.from('buses').select('*').order('entry_time', { ascending: false }).limit(100);
      if (query) q = q.ilike('bus_number', `%${query}%`);
      if (dateFilter) {
        const start = new Date(dateFilter); start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter); end.setHours(23, 59, 59, 999);
        q = q.gte('entry_time', start.toISOString()).lte('entry_time', end.toISOString());
      }
      const { data } = await q;
      setBusResults(data || []);
    } else if (activeTab === 'outpasses') {
      let q = supabase.from('outpasses').select('*').order('created_at', { ascending: false }).limit(100);
      if (query) q = q.or(`student_name.ilike.%${query}%,register_number.ilike.%${query}%`);
      if (dateFilter) {
        const start = new Date(dateFilter); start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter); end.setHours(23, 59, 59, 999);
        q = q.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }
      const { data } = await q;
      setOutpassResults(data || []);
    } else {
      let q = supabase.from('visitors').select('*').order('entry_time', { ascending: false }).limit(100);
      if (query) q = q.or(`visitor_name.ilike.%${query}%,phone.ilike.%${query}%`);
      if (dateFilter) {
        const start = new Date(dateFilter); start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter); end.setHours(23, 59, 59, 999);
        q = q.gte('entry_time', start.toISOString()).lte('entry_time', end.toISOString());
      }
      const { data } = await q;
      setVisitorResults(data || []);
    }
    setLoading(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/15 text-success border border-success/20',
      used: 'bg-muted text-muted-foreground border border-border',
    };
    return (
      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Records</span> & Search
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Search past entries across all categories</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setBusResults([]); setOutpassResults([]); setVisitorResults([]); }}>
          <TabsList className="h-11 rounded-xl bg-secondary/60 p-1">
            {showBusTab && <TabsTrigger value="buses" className="text-xs font-bold rounded-lg">Buses</TabsTrigger>}
            <TabsTrigger value="outpasses" className="text-xs font-bold rounded-lg">Outpasses</TabsTrigger>
            {showVisitorTab && <TabsTrigger value="visitors" className="text-xs font-bold rounded-lg">Visitors</TabsTrigger>}
          </TabsList>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</Label>
              <Input
                placeholder={activeTab === 'buses' ? 'Bus number...' : activeTab === 'outpasses' ? 'Name or reg no...' : 'Name or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-56 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-44 h-11 rounded-xl" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="h-11 rounded-xl font-bold text-white" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>

          {showBusTab && (
            <TabsContent value="buses" className="mt-5">
              {busResults.length === 0 ? (
                <div className="page-card flex flex-col items-center justify-center py-12">
                  <FileSearch className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No results. Use search above.</p>
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
                      {busResults.map((r: any) => (
                        <tr key={r.id} className="table-row">
                          <td className="px-5 py-3.5 font-bold text-foreground">{r.bus_number}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{r.driver_name || '—'}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(r.entry_time), 'dd MMM yyyy, hh:mm a')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="outpasses" className="mt-5">
            {outpassResults.length === 0 ? (
              <div className="page-card flex flex-col items-center justify-center py-12">
                <FileSearch className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No results. Use search above.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Student</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Reg No</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Dept</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {outpassResults.map((r: any) => (
                      <tr key={r.id} className="table-row">
                        <td className="px-5 py-3.5 font-semibold text-foreground">{r.student_name}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{r.register_number}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{r.department}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{r.reason}</td>
                        <td className="px-5 py-3.5">{statusBadge(r.status)}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {showVisitorTab && (
            <TabsContent value="visitors" className="mt-5">
              {visitorResults.length === 0 ? (
                <div className="page-card flex flex-col items-center justify-center py-12">
                  <FileSearch className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No results. Use search above.</p>
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
                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visitorResults.map((r: any) => (
                        <tr key={r.id} className="table-row">
                          <td className="px-5 py-3.5 font-semibold text-foreground">{r.visitor_name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{r.phone}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{r.purpose}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{r.meeting_person}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(r.entry_time), 'dd MMM yyyy, hh:mm a')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}
