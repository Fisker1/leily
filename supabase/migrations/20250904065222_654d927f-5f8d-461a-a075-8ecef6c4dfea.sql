-- Fix Payment Records RLS Security Issue
-- Add comprehensive UPDATE and DELETE policies for payment_records table

-- Create policy for users to update their own payment records (only status updates allowed)
CREATE POLICY "Users can update their own payment status" 
ON public.payment_records 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND payment_status IN ('completed', 'failed', 'cancelled'));

-- Create policy for users to delete their own payment records (only pending/failed records)
CREATE POLICY "Users can delete their own failed payment records" 
ON public.payment_records 
FOR DELETE 
USING (
  auth.uid() = user_id AND 
  payment_status IN ('pending', 'failed', 'cancelled')
);

-- Create admin policy for managing all payment records
CREATE POLICY "Admins can manage all payment records" 
ON public.payment_records 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add audit logging for payment record changes
CREATE OR REPLACE FUNCTION public.log_payment_record_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'payment_records',
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'payment_id', COALESCE(NEW.id, OLD.id),
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.payment_status END,
      'new_status', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.payment_status END,
      'amount', COALESCE(NEW.amount, OLD.amount),
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for payment record audit logging
DROP TRIGGER IF EXISTS payment_record_audit_trigger ON public.payment_records;
CREATE TRIGGER payment_record_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_record_changes();