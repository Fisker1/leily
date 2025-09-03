import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SecurityAlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  className?: string;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ type, title, description, className = '' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <ShieldCheck className="h-4 w-4" />;
      case 'warning':
        return <ShieldAlert className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;