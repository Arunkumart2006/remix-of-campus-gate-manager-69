
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Watchman and staff can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'watchman'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'md'::app_role) OR
    has_role(auth.uid(), 'principal'::app_role) OR
    has_role(auth.uid(), 'hod'::app_role)
  );
