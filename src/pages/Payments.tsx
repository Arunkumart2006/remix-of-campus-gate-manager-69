import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  CreditCard, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Crown,
  Loader2,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  status: string;
  end_date: string | null;
  amount: number | null;
  institute: string | null;
  updated_at: string;
}

export default function Payments() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        const subs = (data || []) as Subscription[];
        setSubscriptions(subs);
        const total = subs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        setTotalRevenue(total);
      }
      setLoading(false);
    };

    fetchPayments();
  }, []);

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.institute?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Subscription</span> Payments
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Monitor revenue and manage institute subscription plans
        </p>
      </motion.div>

      {/* Revenue Snapshot */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="stat-card p-6 border-2 border-emerald-500/20 bg-emerald-500/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Total Revenue</span>
          </div>
          <p className="text-4xl font-extrabold font-display text-foreground">₹{totalRevenue.toLocaleString()}</p>
          <p className="mt-2 text-xs text-muted-foreground font-medium">Accumulated from all active accounts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="stat-card p-6 border-2 border-amber-500/20 bg-amber-500/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Crown className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">Active Plans</span>
          </div>
          <p className="text-4xl font-extrabold font-display text-foreground">{subscriptions.filter(s => s.status === 'active').length}</p>
          <p className="mt-2 text-xs text-muted-foreground font-medium">Institutes with premium status</p>
        </motion.div>
      </div>

      {/* Main Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by institute name..." 
              className="pl-10 h-11 rounded-xl border-border bg-card shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-11 px-4 rounded-xl border-border gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="page-card flex flex-col items-center justify-center py-20 text-center border-dashed border-2">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No payments found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">Try adjusting your search or check again later.</p>
          </div>
        ) : (
          <div className="page-card p-0 overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Institute</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Contribution</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Updated</th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredSubscriptions.map((sub, i) => (
                    <motion.tr 
                      key={sub.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-muted/50 transition-all cursor-default"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            {sub.institute?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-base">{sub.institute}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-emerald-600 font-display text-xl font-bold">
                          ₹{(sub.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                          sub.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${sub.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_hsl(142_76%_36%/0.5)]' : 'bg-rose-500 shadow-[0_0_8px_hsl(346_84%_61%/0.5)]'}`} />
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-medium text-muted-foreground italic">
                        {sub.updated_at ? format(new Date(sub.updated_at), 'dd MMM, HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-5 font-display font-bold text-foreground">
                        {sub.end_date ? (
                          <div className="flex flex-col">
                            <span>{format(new Date(sub.end_date), 'dd MMM yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Auto-renews at midnight</span>
                          </div>
                        ) : 'No Active Plan'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
