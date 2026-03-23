import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Runs periodically to check for late students and create notifications
 * for the watchman role users and the staff who created the outpass.
 * Only runs for watchman role to avoid duplicate notifications.
 */
export function useLateStudentChecker() {
  const { user, role } = useAuth();
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only watchman triggers the check to avoid duplicates
    if (!user || role !== 'watchman') return;

    const checkLateStudents = async () => {
      const { data: lateOutpasses } = await supabase
        .from('outpasses')
        .select('id, student_name, register_number, department, return_time, created_by')
        .eq('status', 'active')
        .not('return_time', 'is', null)
        .lt('return_time', new Date().toISOString());

      if (!lateOutpasses || lateOutpasses.length === 0) return;

      // Get all watchman user IDs
      const { data: watchmanRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'watchman');

      const watchmanIds = (watchmanRoles || []).map((r) => r.user_id);

      for (const outpass of lateOutpasses) {
        if (checkedRef.current.has(outpass.id)) continue;
        checkedRef.current.add(outpass.id);

        const title = `⚠️ Late Student: ${outpass.student_name}`;
        const message = `${outpass.register_number} (${outpass.department}) has not returned. Expected: ${new Date(outpass.return_time!).toLocaleString()}`;

        // Collect target user IDs (watchmen + creating staff)
        const targetUsers = new Set<string>(watchmanIds);
        if (outpass.created_by) targetUsers.add(outpass.created_by);

        // Insert notifications for each target
        const inserts = Array.from(targetUsers).map((uid) => ({
          user_id: uid,
          outpass_id: outpass.id,
          type: 'late_student',
          title,
          message,
        }));

        // Check if notification already exists for this outpass to avoid spam
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('outpass_id', outpass.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert(inserts);
        }
      }
    };

    checkLateStudents();
    const interval = setInterval(checkLateStudents, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, role]);
}
