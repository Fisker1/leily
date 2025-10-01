-- Allow users to view their own audit log entries
CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
USING (auth.uid() = user_id);