import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bus, FileCheck, Users, Loader2, Clock, CheckCircle, TrendingUp, AlertTriangle, Crown, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Stats {
  totalOutpasses: number;
  activeOutpasses: number;
  usedOutpasses: number;
  busesToday: number;
  visitorsToday: number;
  totalAccounts: number;
}

interface LateStudent {
  id: string;
  student_name: string;
  register_number: string;
  department: string;
  reason: string;
  return_time: string;
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
  const [stats, setStats] = useState<Stats>({ totalOutpasses: 0, activeOutpasses: 0, usedOutpasses: 0, busesToday: 0, visitorsToday: 0, totalAccounts: 0 });
  const [lateStudents, setLateStudents] = useState<LateStudent[]>([]);
  const [loading, setLoading] = useState(true);

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

      const newStats: Stats = { totalOutpasses: 0, activeOutpasses: 0, usedOutpasses: 0, busesToday: 0, visitorsToday: 0, totalAccounts: 0 };

      if (role === 'watchman') {
        const [busRes, outpassRes, visitorRes] = await Promise.all([
          supabase.from('buses').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
        ]);
        newStats.busesToday = busRes.count ?? 0;
        newStats.activeOutpasses = outpassRes.count ?? 0;
        newStats.visitorsToday = visitorRes.count ?? 0;
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
        const [totalRes, activeRes, usedRes, busRes, visitorRes, accountsRes] = await Promise.all([
          supabase.from('outpasses').select('id', { count: 'exact', head: true }),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('outpasses').select('id', { count: 'exact', head: true }).eq('status', 'used'),
          supabase.from('buses').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('entry_time', todayISO),
          supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('created_by', user.id),
        ]);
        newStats.totalOutpasses = totalRes.count ?? 0;
        newStats.activeOutpasses = activeRes.count ?? 0;
        newStats.usedOutpasses = usedRes.count ?? 0;
        newStats.busesToday = busRes.count ?? 0;
        newStats.visitorsToday = visitorRes.count ?? 0;
        newStats.totalAccounts = accountsRes.count ?? 0;
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

      {/* Late Students Alert */}
      {lateStudents.length > 0 && (
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
    </div>
  );
}
