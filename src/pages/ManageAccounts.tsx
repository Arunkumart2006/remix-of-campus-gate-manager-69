import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus, Users, Crown, GraduationCap, Briefcase, Eye, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const roleLabels: Record<string, string> = {
  md: 'Managing Director',
  principal: 'Principal',
  hod: 'Head of Department',
  staff: 'Staff',
  watchman: 'Watchman',
};

const roleIcons: Record<string, typeof Crown> = {
  md: Crown,
  principal: GraduationCap,
  hod: Briefcase,
  staff: Users,
  watchman: Eye,
};

interface CreatedUser {
  user_id: string;
  full_name: string;
  role: string;
  institute: string | null;
  department: string | null;
  created_at: string;
}

export default function ManageAccounts() {
  const { role, user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [institute, setInstitute] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [fetching, setFetching] = useState(true);

  const allowedRoles: Record<string, AppRole[]> = {
    md: ['principal', 'hod', 'staff', 'watchman'],
    principal: ['hod', 'staff'],
    hod: ['staff'],
  };

  const creatableRoles = role ? (allowedRoles[role] || []) : [];

  const fetchCreatedUsers = async () => {
    if (!user) return;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, institute, department, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map((p: any) => p.user_id);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
      setCreatedUsers(profiles.map((p: any) => ({ ...p, role: roleMap.get(p.user_id) || 'unknown' })));
    }
    setFetching(false);
  };

  useEffect(() => { fetchCreatedUsers(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim() || !selectedRole) {
      toast.error('Please fill in all fields');
      return;
    }
    if (selectedRole === 'principal' && !institute.trim()) {
      toast.error('Please enter the institute name for the Principal');
      return;
    }
    if (selectedRole === 'hod' && !department.trim()) {
      toast.error('Please enter the department for the HOD');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: email.trim(),
          password,
          role: selectedRole,
          full_name: fullName.trim(),
          institute: selectedRole === 'principal' ? institute.trim() : (profile?.institute || institute.trim() || null),
          department: (selectedRole === 'hod' || selectedRole === 'staff') ? department.trim() : (profile?.department || null),
        },
      });

      if (error) { toast.error('Failed to create account'); return; }
      if (data?.error) { toast.error(data.error); return; }

      toast.success(`${roleLabels[selectedRole]} account created!`);
      setEmail(''); setPassword(''); setFullName(''); setSelectedRole(''); setInstitute(''); setDepartment('');
      fetchCreatedUsers();
    } finally {
      setLoading(false);
    }
  };

  if (creatableRoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">You don't have permission to manage accounts</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Manage</span> Accounts
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Create accounts for {creatableRoles.map(r => roleLabels[r]).join(', ')}
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleCreate}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="page-card"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-primary)' }}>
            <UserPlus className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-card-foreground">Create New Account</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Full name" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@college.edu" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {creatableRoles.map(r => (
                  <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(selectedRole === 'principal' || (role === 'md' && (selectedRole === 'hod' || selectedRole === 'staff'))) && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institute</Label>
              <Input value={institute} onChange={(e) => setInstitute(e.target.value)} required={selectedRole === 'principal'} placeholder="e.g. XYZ Engineering College" className="h-11 rounded-xl" />
            </div>
          )}
          {(selectedRole === 'hod' || selectedRole === 'staff') && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} required={selectedRole === 'hod'} placeholder="e.g. Computer Science" className="h-11 rounded-xl" />
            </div>
          )}
        </div>

        {selectedRole && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {selectedRole === 'principal' && 'Principal can create HOD and Staff accounts for their institute'}
              {selectedRole === 'hod' && 'HOD can create Staff accounts for their department'}
              {selectedRole === 'staff' && 'Staff can issue outpasses for students'}
              {selectedRole === 'watchman' && 'Watchman can verify outpasses, log buses and visitors at the gate'}
            </p>
          </div>
        )}

        <Button type="submit" className="mt-6 h-11 rounded-xl font-bold" disabled={loading} style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Create Account
        </Button>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Created Accounts</h2>
        {fetching ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : createdUsers.length === 0 ? (
          <div className="page-card flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No accounts created yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Institute</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdUsers.map((u) => {
                  const Icon = roleIcons[u.role] || Users;
                  return (
                    <tr key={u.user_id} className="table-row">
                      <td className="px-5 py-3.5 font-semibold text-foreground">{u.full_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: 'var(--gradient-primary)' }}>
                          <Icon className="h-3 w-3" />
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{u.institute || '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{u.department || '—'}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
