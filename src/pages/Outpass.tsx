import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, QrCode, CheckCircle, Search, FileCheck, AlertTriangle, Clock, Calendar, ArrowDownToLine, Bell } from 'lucide-react';
import { format, isPast, differenceInMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

interface OutpassRecord {
  id: string;
  student_name: string;
  register_number: string;
  department: string;
  reason: string;
  exit_time: string;
  return_time: string | null;
  returned_at: string | null;
  status: string;
  created_at: string;
}

export default function Outpass() {
  const { user, role, profile } = useAuth();
  // MD, Principal, HOD, Staff can create outpasses; Watchman verifies
  const canCreate = role && ['md', 'principal', 'hod', 'staff'].includes(role);
  const isWatchman = role === 'watchman';

  const [form, setForm] = useState({
    student_name: '',
    register_number: '',
    department: '',
    reason: '',
    exit_time: '',
    return_time: '',
  });

  useEffect(() => {
    if (profile?.department && !form.department) {
      setForm(prev => ({ ...prev, department: profile.department }));
    }
  }, [profile]);

  const [isFullDay, setIsFullDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<OutpassRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [qrDialog, setQrDialog] = useState<OutpassRecord | null>(null);
  const [verifyRegNo, setVerifyRegNo] = useState('');
  const [verifiedOutpass, setVerifiedOutpass] = useState<OutpassRecord | null>(null);
  const [returnRegNo, setReturnRegNo] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchOutpasses = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let query = supabase
      .from('outpasses')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (role === 'watchman') {
      // Watchman only needs to see approved and returned outpasses
      query = query.in('status', ['active', 'returned']);
    } else if (role === 'staff') {
      // Staff sees their own outpasses
      query = query.eq('created_by', user?.id ?? '');
    } else if (role === 'hod' && profile?.department) {
      // HOD sees outpasses for their department (case-insensitive)
      query = query.ilike('department', profile.department);
    }

    const { data } = await query;
    setRecords((data as any) || []);
    setFetching(false);
  };

  useEffect(() => { fetchOutpasses(); }, [user, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name || !form.register_number || !form.department || !form.reason || !form.exit_time) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!isFullDay && !form.return_time) {
      toast.error('Please set a return time or enable Full Day Outpass');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('outpasses').insert({
      student_name: form.student_name.trim(),
      register_number: form.register_number.trim().toUpperCase(),
      department: form.department.trim(),
      reason: form.reason.trim(),
      exit_time: new Date(form.exit_time).toISOString(),
      return_time: isFullDay ? null : new Date(form.return_time).toISOString(),
      created_by: user?.id,
      institute: profile?.institute || null,
      status: role === 'staff' ? 'pending' : 'active',
    } as any);

    if (error) {
      toast.error(error.message || 'Failed to create outpass');
    } else {
      toast.success(isFullDay ? 'Full day outpass created!' : 'Outpass created!');
      setForm({ student_name: '', register_number: '', department: '', reason: '', exit_time: '', return_time: '' });
      setIsFullDay(false);
      fetchOutpasses();
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!verifyRegNo.trim()) {
      toast.error('Enter a register number');
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('outpasses')
      .select('*')
      .eq('register_number', verifyRegNo.trim().toUpperCase())
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error('No outpass found for this register number today');
      setVerifiedOutpass(null);
      return;
    }
    setVerifiedOutpass(data);
  };

  const sendLateNotification = async (outpass: OutpassRecord) => {
    // Get all watchman user IDs
    const { data: watchmanRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'watchman');
    const watchmanIds = (watchmanRoles || []).map((r) => r.user_id);

    // Get the staff who created this outpass
    const { data: outpassData } = await supabase
      .from('outpasses')
      .select('created_by')
      .eq('id', outpass.id)
      .single();

    const targetUsers = new Set<string>(watchmanIds);
    if (outpassData?.created_by) targetUsers.add(outpassData.created_by);

    const lateMins = outpass.return_time ? differenceInMinutes(new Date(), new Date(outpass.return_time)) : 0;
    const lateText = lateMins > 0 ? ` (${formatLateDuration(lateMins)})` : '';
    const title = `⚠️ Late Return: ${outpass.student_name}${lateText}`;
    const message = `${outpass.register_number} (${outpass.department}) returned late${lateText}. Expected: ${outpass.return_time ? format(new Date(outpass.return_time), 'dd MMM, hh:mm a') : 'N/A'}`;

    // Check if notification already exists
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('outpass_id', outpass.id)
      .eq('type', 'late_student')
      .limit(1);

    if (existing && existing.length > 0) {
      toast.info('Notification already sent for this student');
      return;
    }

    const inserts = Array.from(targetUsers).map((uid) => ({
      user_id: uid,
      outpass_id: outpass.id,
      type: 'late_student',
      title,
      message,
    }));

    const { error } = await supabase.from('notifications').insert(inserts);
    if (error) {
      toast.error('Failed to send notification');
    } else {
      toast.success('Late student notification sent!');
    }
  };

  const confirmVerify = async () => {
    if (!verifiedOutpass) return;
    const studentIsLate = verifiedOutpass.return_time && isPast(new Date(verifiedOutpass.return_time));
    await supabase.from('outpasses').update({ status: 'returned', returned_at: new Date().toISOString() } as any).eq('id', verifiedOutpass.id);

    // Auto-send notification if student is late
    if (studentIsLate) {
      await sendLateNotification(verifiedOutpass);
    }

    toast.success(`Outpass verified & closed for ${verifiedOutpass.student_name}`);
    setVerifiedOutpass(null);
    setVerifyRegNo('');
    fetchOutpasses();
  };

  const markReturned = async (record: OutpassRecord) => {
    const now = new Date();
    const nowISO = now.toISOString();
    const wasLate = record.return_time && now > new Date(record.return_time);
    const lateMins = wasLate ? differenceInMinutes(now, new Date(record.return_time!)) : 0;

    const { error } = await supabase
      .from('outpasses')
      .update({ returned_at: nowISO, status: 'returned' } as any)
      .eq('id', record.id);

    if (error) {
      console.error('Update Error:', error);
      toast.error(`Failed to mark as returned: ${error.message} (${error.code})`);
      return;
    }

    if (wasLate) {
      await sendLateNotification(record);
    }

    toast.success(`${record.student_name} marked as returned${wasLate ? ` (${formatLateDuration(lateMins)})` : ''}`);
    fetchOutpasses();
  };

  const handleMarkReturnByRegNo = async () => {
    if (!returnRegNo.trim()) {
      toast.error('Enter a register number');
      return;
    }
    setReturnLoading(true);
    const { data, error } = await supabase
      .from('outpasses')
      .select('*')
      .eq('register_number', returnRegNo.trim().toUpperCase())
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Fetch Active Error:', error);
      toast.error(error ? `Error fetching outpass: ${error.message}` : 'No active outpass found for this register number');
      setReturnLoading(false);
      return;
    }
    await markReturned(data);
    setReturnRegNo('');
    setReturnLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('outpasses').update({ status: newStatus } as any).eq('id', id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(`Outpass ${newStatus === 'active' ? 'approved' : 'rejected'}!`);
      fetchOutpasses();
    }
  };

  const getLateMinutes = (record: OutpassRecord) => {
    if (!record.return_time) return 0;
    const returnedTime = record.returned_at ? new Date(record.returned_at) : new Date();
    const expectedTime = new Date(record.return_time);
    if (returnedTime <= expectedTime) return 0;
    return differenceInMinutes(returnedTime, expectedTime);
  };

  const isLate = (record: OutpassRecord) => {
    if (!record.return_time || record.status !== 'active') return false;
    return isPast(new Date(record.return_time));
  };

  const formatLateDuration = (mins: number) => {
    if (mins < 60) return `${mins} min late`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hrs}h ${remainMins}m late` : `${hrs}h late`;
  };

  const statusBadge = (record: OutpassRecord) => {
    // Returned
    if (record.returned_at) {
      const wasLate = record.return_time && new Date(record.returned_at) > new Date(record.return_time);
      if (wasLate) {
        const lateMins = getLateMinutes(record);
        return (
          <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20">
            <Clock className="h-3 w-3" /> Returned Late ({formatLateDuration(lateMins)})
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-success/15 text-success border border-success/20">
          <CheckCircle className="h-3 w-3" /> Returned
        </span>
      );
    }
    if (isLate(record)) {
      const lateMins = getLateMinutes(record);
      return (
        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20 animate-pulse">
          <AlertTriangle className="h-3 w-3" /> LATE ({formatLateDuration(lateMins)})
        </span>
      );
    }
    if (!record.return_time && record.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-warning/15 text-warning border border-warning/20">
          <Calendar className="h-3 w-3" /> Full Day
        </span>
      );
    }
    const styles: Record<string, string> = {
      active: 'bg-primary/15 text-primary border border-primary/20',
      returned: 'bg-success/15 text-success border border-success/20',
      used: 'bg-muted text-muted-foreground border border-border',
      expired: 'bg-destructive/15 text-destructive border border-destructive/20',
      pending: 'bg-warning/15 text-warning border border-warning/20',
      rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
    };
    const labels: Record<string, string> = {
      active: 'Approved',
      returned: 'Returned',
      used: 'Used',
      expired: 'Expired',
      pending: 'Pending Approval',
      rejected: 'Rejected',
    };
    return (
      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[record.status] || ''}`}>
        {labels[record.status] || record.status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="gradient-text">Student</span> Outpass
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {canCreate ? 'Create outpasses for students' : 'Verify student outpasses by register number'}
        </p>
      </motion.div>

      {/* Verify section (for watchmen) */}
      {isWatchman && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="page-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-accent)' }}>
              <Search className="h-4 w-4" />
            </div>
            <h3 className="font-display text-base font-semibold text-card-foreground">Verify Outpass</h3>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Enter student register number..."
              value={verifyRegNo}
              onChange={(e) => setVerifyRegNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="max-w-sm"
            />
            <Button onClick={handleVerify} className="text-white rounded-xl" style={{ background: 'var(--gradient-accent)' }}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </div>
        </motion.div>
      )}

      {/* Mark Return section (for watchmen) */}
      {isWatchman && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="page-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg, hsl(152 60% 40%), hsl(160 65% 45%))' }}>
              <ArrowDownToLine className="h-4 w-4" />
            </div>
            <h3 className="font-display text-base font-semibold text-card-foreground">Mark Student Return</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Enter the register number of the returning student to mark them as returned.</p>
          <div className="flex gap-3">
            <Input
              placeholder="Enter student register number..."
              value={returnRegNo}
              onChange={(e) => setReturnRegNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMarkReturnByRegNo()}
              className="max-w-sm"
            />
            <Button onClick={handleMarkReturnByRegNo} disabled={returnLoading} className="text-white rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(152 60% 40%), hsl(160 65% 45%))' }}>
              {returnLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownToLine className="mr-2 h-4 w-4" />}
              Mark Returned
            </Button>
          </div>
        </motion.div>
      )}

      {/* Create form */}
      {canCreate && (
        <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="page-card">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'var(--gradient-primary)' }}>
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="font-display text-base font-semibold text-card-foreground">Create New Outpass</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Name</Label>
              <Input value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} required maxLength={100} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Register Number</Label>
              <Input value={form.register_number} onChange={(e) => setForm({ ...form, register_number: e.target.value })} required maxLength={30} placeholder="e.g. 22CSE001" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required maxLength={50} placeholder="e.g. CSE" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for Leaving</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required maxLength={200} placeholder="e.g. Medical appointment" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exit Time</Label>
              <Input type="datetime-local" value={form.exit_time} onChange={(e) => setForm({ ...form, exit_time: e.target.value })} required />
            </div>
            {!isFullDay && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Return</Label>
                <Input type="datetime-local" value={form.return_time} onChange={(e) => setForm({ ...form, return_time: e.target.value })} required />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Switch checked={isFullDay} onCheckedChange={setIsFullDay} />
            <div>
              <p className="text-sm font-medium text-foreground">Full Day Outpass</p>
              <p className="text-xs text-muted-foreground">No expected return time</p>
            </div>
          </div>
          <Button type="submit" className="mt-6 h-11 rounded-xl font-bold text-white" disabled={loading} style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isFullDay ? 'Create Full Day Outpass' : 'Create Outpass'}
          </Button>
        </motion.form>
      )}

      {/* Records */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Today's Outpasses
        </h2>
        {fetching ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="page-card flex flex-col items-center justify-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No outpasses found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dept</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exit</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Return</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Returned</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">QR</th>
                  {isWatchman && <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>}
                  {role === 'hod' && <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approval</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r) => (
                  <tr key={r.id} className={`table-row ${isLate(r) ? 'bg-destructive/5' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{r.student_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{r.register_number}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.department}</td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.exit_time), 'dd MMM, hh:mm a')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {r.return_time ? format(new Date(r.return_time), 'dd MMM, hh:mm a') : (
                        <span className="text-warning font-medium">Full Day</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.returned_at ? (
                        <div className="flex flex-col gap-1">
                          {r.return_time && new Date(r.returned_at) > new Date(r.return_time) ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                                <Clock className="h-3 w-3" /> Returned Late
                              </span>
                              <span className="text-[10px] text-destructive/80 font-medium">{formatLateDuration(getLateMinutes(r))}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(r.returned_at), 'hh:mm a')}</span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                                <CheckCircle className="h-3 w-3" /> Returned
                              </span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(r.returned_at), 'hh:mm a')}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                            <AlertTriangle className="h-3 w-3" /> Not Returned
                          </span>
                          {isWatchman && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => sendLateNotification(r)}
                              title="Send late notification"
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(r)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setQrDialog(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="View QR Code"
                      >
                        <QrCode size={16} />
                      </button>
                    </td>
                    {isWatchman && (
                      <td className="px-5 py-3.5">
                        {!r.returned_at && r.status === 'active' ? (
                          <Button size="sm" variant="outline" onClick={() => markReturned(r)} className="text-xs">
                            <ArrowDownToLine className="mr-1 h-3 w-3" />
                            Mark Returned
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    )}
                    {role === 'hod' && (
                      <td className="px-5 py-3.5">
                        {r.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateStatus(r.id, 'active')} className="h-7 text-xs bg-success hover:bg-success/90">Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'rejected')} className="h-7 text-xs">Reject</Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Outpass QR Code</DialogTitle>
          </DialogHeader>
          {qrDialog && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
                <QRCodeSVG value={qrDialog.register_number} size={200} />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-display font-semibold text-foreground">{qrDialog.student_name}</p>
                <p className="font-mono text-xs">{qrDialog.register_number} • {qrDialog.department}</p>
                <p className="mt-2 text-xs"><strong>Reason:</strong> {qrDialog.reason}</p>
                <p className="mt-1">Exit: {format(new Date(qrDialog.exit_time), 'dd MMM, hh:mm a')}</p>
                <p>Return: {qrDialog.return_time ? format(new Date(qrDialog.return_time), 'dd MMM, hh:mm a') : 'Full Day'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verified Outpass Detail Dialog (watchman) */}
      <Dialog open={!!verifiedOutpass} onOpenChange={() => setVerifiedOutpass(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {verifiedOutpass?.status === 'active' && !verifiedOutpass?.returned_at ? (
                <><CheckCircle className="h-5 w-5 text-success" /> Approved — Can Go Outside</>
              ) : verifiedOutpass?.returned_at ? (
                <><CheckCircle className="h-5 w-5 text-primary" /> Already Returned</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-destructive" /> Outpass Status</>
              )}
            </DialogTitle>
          </DialogHeader>
          {verifiedOutpass && (
            <div className="space-y-4">
              {/* Status Banner */}
              {verifiedOutpass.status === 'active' && !verifiedOutpass.returned_at && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-success text-sm font-bold">
                  <CheckCircle className="h-4 w-4" />
                  Status: APPROVED — Student is allowed to go outside
                </div>
              )}
              {verifiedOutpass.returned_at && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-primary text-sm font-bold">
                  <CheckCircle className="h-4 w-4" />
                  Status: RETURNED — Already came back at {format(new Date(verifiedOutpass.returned_at), 'hh:mm a')}
                </div>
              )}
              {verifiedOutpass.status !== 'active' && !verifiedOutpass.returned_at && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-destructive text-sm font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Status: NOT APPROVED — Cannot go outside
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</span>
                  <span className="font-medium text-foreground">{verifiedOutpass.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reg No</span>
                  <span className="font-mono text-sm text-foreground">{verifiedOutpass.register_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</span>
                  <span className="text-foreground">{verifiedOutpass.department}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for Leaving</span>
                  <p className="mt-1 text-foreground font-medium">{verifiedOutpass.reason}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exit Time</span>
                  <span className="text-foreground">{format(new Date(verifiedOutpass.exit_time), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Return</span>
                  <span className={`font-medium ${verifiedOutpass.return_time && isPast(new Date(verifiedOutpass.return_time)) ? 'text-destructive' : 'text-foreground'}`}>
                    {verifiedOutpass.return_time ? format(new Date(verifiedOutpass.return_time), 'dd MMM yyyy, hh:mm a') : 'Full Day (No Return)'}
                  </span>
                </div>
                {verifiedOutpass.return_time && isPast(new Date(verifiedOutpass.return_time)) && !verifiedOutpass.returned_at && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-destructive text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    This student is LATE — exceeded return time and NOT returned!
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {/* Only show action buttons if active and not returned */}
                {verifiedOutpass.status === 'active' && !verifiedOutpass.returned_at && (
                  <>
                    {verifiedOutpass.return_time && isPast(new Date(verifiedOutpass.return_time)) && (
                      <Button
                        variant="destructive"
                        onClick={() => sendLateNotification(verifiedOutpass)}
                        className="flex-1"
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Send Late Notification
                      </Button>
                    )}
                    <Button onClick={confirmVerify} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Returned
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setVerifiedOutpass(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
