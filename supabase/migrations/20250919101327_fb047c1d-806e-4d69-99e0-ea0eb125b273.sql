-- Enhanced Security Monitoring and Data Retention
-- Add automated cleanup function for old audit logs
CREATE OR REPLACE FUNCTION public.enhanced_security_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archive critical security logs older than 1 year
  UPDATE public.audit_log 
  SET details = details || jsonb_build_object('archived', true, 'archived_at', now())
  WHERE created_at < now() - interval '1 year'
    AND (details->>'security_level')::text IN ('CRITICAL', 'CRITICAL_SECURITY_VIOLATION', 'CRITICAL_ALERT')
    AND (details->>'archived') IS NULL;
  
  -- Delete non-critical logs older than 6 months
  DELETE FROM public.audit_log 
  WHERE created_at < now() - interval '6 months'
    AND (details->>'security_level')::text NOT IN ('CRITICAL', 'CRITICAL_SECURITY_VIOLATION', 'CRITICAL_ALERT');
  
  -- Log cleanup activity
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'audit_log', 'AUTOMATED_SECURITY_CLEANUP', null,
    jsonb_build_object(
      'timestamp', now(),
      'retention_policy', 'critical_1_year_noncritical_6_months',
      'cleanup_type', 'automated_security_maintenance'
    )
  );
END;
$$;

-- Enhanced IP tracking for failed authentication attempts
CREATE OR REPLACE FUNCTION public.track_failed_auth_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_email text;
  failure_count integer;
BEGIN
  -- Check for excessive failed attempts from same email in last hour
  FOR suspicious_email IN 
    SELECT details->>'email' as email
    FROM public.audit_log 
    WHERE action IN ('auth_failure', 'signup_failure')
      AND created_at > now() - interval '1 hour'
      AND details->>'email' IS NOT NULL
    GROUP BY details->>'email'
    HAVING COUNT(*) >= 5
  LOOP
    -- Log security alert for potential brute force attempt
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'POTENTIAL_BRUTE_FORCE_DETECTED', null,
      jsonb_build_object(
        'email', suspicious_email,
        'detection_time', now(),
        'security_level', 'CRITICAL_SECURITY_ALERT',
        'threat_type', 'AUTHENTICATION_BRUTE_FORCE',
        'recommendation', 'TEMPORARY_ACCOUNT_LOCKOUT_RECOMMENDED',
        'detection_window', '1_hour'
      )
    );
  END LOOP;
END;
$$;

-- Function to check password against common weak passwords
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  score integer := 0;
  issues text[] := '{}';
  common_passwords text[] := ARRAY[
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'shadow', 'jesus', 'michael', 'superman'
  ];
BEGIN
  -- Check minimum length (12 characters for high security)
  IF length(password_text) < 12 THEN
    issues := array_append(issues, 'Passordet må være minst 12 tegn langt for høy sikkerhet');
  ELSE
    score := score + 25;
  END IF;
  
  -- Check for uppercase letters
  IF password_text !~ '[A-Z]' THEN
    issues := array_append(issues, 'Må inneholde minst én stor bokstav');
  ELSE
    score := score + 20;
  END IF;
  
  -- Check for lowercase letters
  IF password_text !~ '[a-z]' THEN
    issues := array_append(issues, 'Må inneholde minst én liten bokstav');
  ELSE
    score := score + 20;
  END IF;
  
  -- Check for numbers
  IF password_text !~ '[0-9]' THEN
    issues := array_append(issues, 'Må inneholde minst ett tall');
  ELSE
    score := score + 15;
  END IF;
  
  -- Check for special characters
  IF password_text !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    issues := array_append(issues, 'Må inneholde minst ett spesialtegn (!@#$%^&* etc.)');
  ELSE
    score := score + 20;
  END IF;
  
  -- Check against common weak passwords
  IF lower(password_text) = ANY(common_passwords) THEN
    issues := array_append(issues, 'Dette passordet er for vanlig og lett å gjette');
    score := 0; -- Override score for common passwords
  END IF;
  
  -- Bonus points for length
  IF length(password_text) >= 16 THEN
    score := score + 10;
  END IF;
  
  -- Calculate final strength
  result := jsonb_build_object(
    'score', LEAST(score, 100),
    'strength', CASE 
      WHEN score < 40 THEN 'SVAKT'
      WHEN score < 70 THEN 'MIDDELS'
      WHEN score < 90 THEN 'STERKT'
      ELSE 'VELDIG_STERKT'
    END,
    'issues', to_jsonb(issues),
    'is_strong', score >= 70
  );
  
  RETURN result;
END;
$$;

-- Enhanced rate limiting with progressive penalties
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  endpoint_name text,
  identifier_key text,
  max_requests integer DEFAULT 10,
  window_minutes integer DEFAULT 60,
  penalty_multiplier numeric DEFAULT 2.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
  violation_count integer;
  final_limit integer;
  result jsonb;
BEGIN
  -- Calculate dynamic window start
  window_start_time := now() - (window_minutes || ' minutes')::interval;
  
  -- Check for previous violations to apply progressive penalties
  SELECT COUNT(*) INTO violation_count
  FROM public.audit_log
  WHERE action = 'RATE_LIMIT_VIOLATION'
    AND details->>'identifier' = identifier_key
    AND details->>'endpoint' = endpoint_name
    AND created_at > now() - interval '24 hours';
  
  -- Apply progressive penalty (reduce limit for repeat offenders)
  final_limit := GREATEST(1, (max_requests / (1 + violation_count * penalty_multiplier))::integer);
  
  -- Get current request count
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE endpoint = endpoint_name
    AND identifier = identifier_key
    AND window_start > window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= final_limit THEN
    -- Log rate limit violation
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'rate_limits', 'RATE_LIMIT_VIOLATION', auth.uid(),
      jsonb_build_object(
        'endpoint', endpoint_name,
        'identifier', identifier_key,
        'current_count', current_count,
        'limit', final_limit,
        'window_minutes', window_minutes,
        'violation_count', violation_count,
        'timestamp', now(),
        'security_level', CASE 
          WHEN violation_count > 3 THEN 'CRITICAL'
          WHEN violation_count > 1 THEN 'HIGH'
          ELSE 'MEDIUM'
        END
      )
    );
    
    result := jsonb_build_object(
      'allowed', false,
      'current_count', current_count,
      'limit', final_limit,
      'reset_time', now() + (window_minutes || ' minutes')::interval,
      'violation_level', violation_count
    );
  ELSE
    -- Update or insert rate limit record
    INSERT INTO public.rate_limits (endpoint, identifier, request_count, window_start)
    VALUES (endpoint_name, identifier_key, 1, now())
    ON CONFLICT (endpoint, identifier, window_start)
    DO UPDATE SET 
      request_count = rate_limits.request_count + 1,
      updated_at = now();
    
    result := jsonb_build_object(
      'allowed', true,
      'current_count', current_count + 1,
      'limit', final_limit,
      'remaining', final_limit - (current_count + 1)
    );
  END IF;
  
  RETURN result;
END;
$$;