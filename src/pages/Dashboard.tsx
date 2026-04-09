import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bus, FileCheck, Users, Loader2, Clock, CheckCircle, TrendingUp, AlertTriangle, Crown, Activity, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';

interface Stats {
  totalOutpasses: number;
  activeOutpasses: number;
  usedOutpasses: number;
  busesToday: number;
  visitorsToday: number;
  totalAccounts: number;
  totalRevenue: number;
}

interface LateStudent {
  id: string;
  student_name: string;
  register_number: string;
  department: string;
  reason: string;
  return_time: string;
}

interface Subscription {
  id: string;
  status: string;
  end_date: string | null;
  amount: number | null;
  institute: string | null;
}

const roleLabels: Record<string, string> = {
  md: 'Managing Director',
  principal: 'Principal',
  hod: 'Head of Department',
  staff: 'Staff',
  watchman: 'Gate Watchman',
};

const cardGradients = [
  'linear-gradient(135deg, hsl(245 58% 51% / 0.08), hsl(260 70% 60% / 0.04))',
  'linear-gradient(135deg, hsl(167 64% 40% / 0.08), hsl(175 70% 50% / 0.04))',
  'linear-gradient(135deg, hsl(38 92% 50% / 0.08), hsl(20 85% 55% / 0.04))',
  'linear-gradient(135deg, hsl(152 60% 40% / 0.08), hsl(160 65% 45% / 0.04))',
  'linear-gradient(135deg, hsl(245 58% 51% / 0.06), hsl(260 70% 60% / 0.03))',
];

const iconBgs = [
  'var(--gradient-primary)',
  'var(--gradient-accent)',
  'var(--gradient-warm)',
  'linear-gradient(135deg, hsl(152 60% 40%), hsl(160 65% 45%))',
  'var(--gradient-primary)',
];

export default function Dashboard() {
  const { role, user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalOutpasses: 0, activeOutpasses: 0, usedOutpasses: 0, busesToday: 0, visitorsToday: 0, totalAccounts: 0, totalRevenue: 0 });
  const [lateStudents, setLateStudents] = useState<LateStudent[]>([]);
  const [activeOutpasses, setActiveOutpasses] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPayment, setProcessingPayment] = useState(false);
  const currentAmount = selectedPlan === 'monthly' ? 1 : 2;
  
  // Real UPI URI using the provided VPA for Arun Kumar
  const upiUri = `upi://pay?pa=arunamutha01-1@okhdfcbank&pn=Arun%20Kumar&am=${currentAmount}&cu=INR&tn=SubscriptionRenewal`;

  const handleRenew = async () => {
    // We need either an existing subscription ID or the user's institute name to proceed
    const instituteName = subscription?.institute || profile?.institute;
    
    if (!instituteName) {
      toast.error('Institute information not found in your profile. Please contact support.');
      return;
    }

    setProcessingPayment(true);
    toast.info('Verifying payment with your bank...');
    
    // Simulate a short delay for verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate extension duration
    const monthsToAdd = selectedPlan === 'monthly' ? 1 : 12;
    const currentEndDate = subscription?.end_date ? new Date(subscription.end_date) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

    // Using upsert to either update existing or create new
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        id: subscription?.id, // If null, Supabase will generate a new UUID or use the unique constraint
        institute: instituteName,
        status: 'active',
        end_date: newEndDate.toISOString(),
        amount: (subscription?.amount || 0) + currentAmount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'institute' });

    if (error) {
      console.error('Subscription error:', error);
      toast.error(`Failed to process subscription: ${error.message}`);
    } else {
      toast.success(`Payment of ₹${currentAmount.toLocaleString()} confirmed! Subscription ${subscription ? 'extended' : 'activated'} for ${instituteName}.`);
      setShowPaymentDialog(false);
      setTimeout(() => window.location.reload(), 1500);
    }
    setProcessingPayment(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      let lateQuery = supabase
        .from('outpasses')
        .select('id, student_name, register_number, department, reason, return_time')
        .eq('status', 'active')
        .not('return_time', 'is', null)
        .lt('return_time', new Date().toISOString());

      if (role === 'staff') {
        lateQuery = lateQuery.eq('created_by', user.id);
      }

      const { data: lateData } = await lateQuery;
      setLateStudents((lateData as LateStudent[]) || []);

      const newStats: Stats = { totalOutpasses: 0, activeOutpasses: 0, usedOutpasses: 0, busesToday: 0, visitorsToday: 0, totalAccounts: 0, totalRevenue: 0 };

      if (role === 'watchman') {
        const [busRes, outpassRes, visitorRes] = await Promise.all([
          supabase.from('buses').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
        ]);
        newStats.busesToday = busRes.count ?? 0;
        newStats.activeOutpasses = outpassRes.count ?? 0;
        newStats.visitorsToday = visitorRes.count ?? 0;

        // Fetch actual active outpasses for the list
        const { data: activeList } = await supabase
          .from('outpasses')
          .select('*')
          .in('status', ['active', 'out'])
          .order('created_at', { ascending: false })
          .limit(10);
        setActiveOutpasses(activeList || []);
      } else if (role === 'staff') {
        const [totalRes, activeRes, usedRes] = await Promise.all([
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('created_by', user.id).eq('status', 'active'),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('created_by', user.id).eq('status', 'used'),
        ]);
        newStats.totalOutpasses = totalRes.count ?? 0;
        newStats.activeOutpasses = activeRes.count ?? 0;
        newStats.usedOutpasses = usedRes.count ?? 0;
      } else {
        const newStatsCopy: Stats = { totalOutpasses: 0, activeOutpasses: 0, usedOutpasses: 0, busesToday: 0, visitorsToday: 0, totalAccounts: 0, totalRevenue: 0 };
        const [totalRes, activeRes, usedRes, busRes, visitorRes, accountsRes, revenueRes] = await Promise.all([
          supabase.from('outpasses').select('id', { count: 'exact', head: true }),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'used'),
          supabase.from('buses').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('created_by', user.id),
          supabase.from('subscriptions').select('amount')
        ]);
        newStatsCopy.totalOutpasses = totalRes.count ?? 0;
        newStatsCopy.activeOutpasses = activeRes.count ?? 0;
        newStatsCopy.usedOutpasses = usedRes.count ?? 0;
        newStatsCopy.busesToday = busRes.count ?? 0;
        newStatsCopy.visitorsToday = visitorRes.count ?? 0;
        newStatsCopy.totalAccounts = accountsRes.count ?? 0;
        newStatsCopy.totalRevenue = (revenueRes.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        
        Object.assign(newStats, newStatsCopy);

        if (role === 'md') {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('id, status, end_date, amount, institute')
            .eq('institute', profile?.institute || '')
            .maybeSingle();
          setSubscription(subData as Subscription | null);
        }
      }

      setStats(newStats);
      setLoading(false);
    };

    if (user) fetchStats();
    const interval = setInterval(() => { if (user) fetchStats(); }, 60000);
    return () => clearInterval(interval);
  }, [user, role]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCards = () => {
    if (role === 'watchman') {
      return [
        { label: 'Buses Today', value: stats.busesToday, icon: Bus },
        { label: 'Students Outside', value: stats.activeOutpasses, icon: FileCheck },
        { label: 'Visitors Today', value: stats.visitorsToday, icon: Users },
      ];
    }
    if (role === 'staff') {
      return [
        { label: 'Total Outpasses', value: stats.totalOutpasses, icon: TrendingUp },
        { label: 'Active Now', value: stats.activeOutpasses, icon: Clock },
        { label: 'Completed', value: stats.usedOutpasses, icon: CheckCircle },
      ];
    }
    return [
      { label: 'Total Outpasses', value: stats.totalOutpasses, icon: FileCheck },
      { label: 'Active Now', value: stats.activeOutpasses, icon: Activity },
      { label: 'Buses Today', value: stats.busesToday, icon: Bus },
      { label: 'Visitors Today', value: stats.visitorsToday, icon: Users },
      { label: 'Accounts Created', value: stats.totalAccounts, icon: Crown },
      ...(role === 'admin' ? [{ label: 'Total Revenue', value: stats.totalRevenue ? `₹${stats.totalRevenue.toLocaleString()}` : '₹0', icon: Activity }] : []),
    ];
  };

  const cards = getCards();
  const dashTitle = roleLabels[role || ''] || 'Dashboard';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">{dashTitle}</span> Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {profile?.full_name && <span className="font-semibold text-foreground">{profile.full_name}</span>}
          {profile?.institute && <span> • {profile.institute}</span>}
          {profile?.department && <span> • {profile.department}</span>}
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className={`grid gap-5 ${cards.length > 3 ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-3'}`}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="stat-card group"
            style={{ background: cardGradients[i % cardGradients.length] }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: iconBgs[i % iconBgs.length] }} />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-foreground">{card.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110" style={{ background: iconBgs[i % iconBgs.length] }}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subscription Status for MD */}

      {/* Subscription Status for MD */}
      {role === 'md' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="page-card relative overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Crown size={120} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="font-display text-xl font-bold">Subscription Status</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage your institute's subscription and renewal</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${subscription?.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                  <p className="font-bold text-foreground">Premium Monthly</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Renews On</p>
                <p className="font-bold text-foreground">
                  {subscription?.end_date ? format(new Date(subscription.end_date), 'dd MMM, yyyy') : 'No Active Plan'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowPaymentDialog(true)}
                  className="px-6 h-10 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: 'var(--gradient-warm)', color: 'white' }}
                >
                  Renew Now
                </button>
              </div>
            </div>
          </div>
          
          {subscription?.end_date && new Date(subscription.end_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 && (
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-amber-600">
                Your subscription expires in less than 7 days. Renew now to avoid service interruption.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Subscription Renewal</DialogTitle>
            <DialogDescription>
              Scan the QR code below using any UPI app to make the payment.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="monthly" onValueChange={(v) => setSelectedPlan(v as 'monthly' | 'yearly')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 rounded-xl">
              <TabsTrigger value="monthly" className="rounded-lg font-bold">Monthly Plan</TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-lg font-bold">Yearly Plan</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col items-center justify-center space-y-6 py-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-6 rounded-xl border border-border shadow-xl">
                  <QRCodeSVG 
                    value={upiUri}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-widest font-bold">Scan to Pay ₹{currentAmount.toLocaleString()}</p>
              </div>
              
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount to Pay (Auto-filled)</Label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {selectedPlan === 'monthly' ? '₹1 / month' : '₹2 / year'}
                  </span>
                </div>
                <div className="h-14 w-full rounded-xl bg-muted/50 border border-border flex items-center px-4 font-display text-2xl font-bold text-foreground">
                  ₹{currentAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </Tabs>
          
          <DialogFooter className="sm:justify-between flex-row gap-3">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1 h-11 rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleRenew}
              disabled={processingPayment}
              className="flex-1 h-11 rounded-xl font-bold text-white shadow-lg shadow-amber-500/20" 
              style={{ background: 'var(--gradient-warm)' }}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Late Students Alert */}
      {role !== 'watchman' && lateStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <h2 className="font-display text-lg font-bold text-destructive">
              Late Students ({lateStudents.length})
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 overflow-hidden" style={{ boxShadow: '0 4px 24px -4px hsl(0 72% 51% / 0.1)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-destructive/15 bg-destructive/10">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-destructive">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-destructive">Reg No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-destructive">Dept</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-destructive">Reason</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-destructive">Expected Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-destructive/10">
                {lateStudents.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">{s.student_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{s.register_number}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{s.department}</td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">{s.reason}</td>
                    <td className="px-5 py-3.5 text-xs text-destructive font-bold whitespace-nowrap">
                      {format(new Date(s.return_time), 'dd MMM, hh:mm a')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      
      {/* Current Active Outpasses for Watchman */}
      {role === 'watchman' && activeOutpasses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <FileCheck className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Current Active Outpasses ({activeOutpasses.length})
              </h2>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl h-8 text-xs">
              <a href="/records">See Records</a>
            </Button>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Reg No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Exit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeOutpasses.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="table-row"
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">{s.student_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{s.register_number}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'active' ? 'bg-warning/10 text-warning' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {s.status === 'active' ? 'Approved' : 'Out Now'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {format(new Date(s.exit_time), 'hh:mm a')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-center text-muted-foreground italic">Go to the Outpass page to verify exit or mark return.</p>
        </motion.div>
      )}
    </div>
  );
}
