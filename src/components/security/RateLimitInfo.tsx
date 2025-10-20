import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, Zap, Info } from 'lucide-react';

const ENDPOINT_LIMITS = [
  {
    endpoint: 'Authentication Login',
    limit: '5 attempts per 15 minutes',
    description: 'Prevents brute force login attempts',
    severity: 'high'
  },
  {
    endpoint: 'User Registration',
    limit: '3 attempts per hour',
    description: 'Prevents spam account creation',
    severity: 'high'
  },
  {
    endpoint: 'Password Reset',
    limit: '3 attempts per hour',
    description: 'Prevents email flooding and abuse',
    severity: 'medium'
  },
  {
    endpoint: 'Tenant Data Access',
    limit: '10 requests per 5 minutes',
    description: 'Protects sensitive personal information',
    severity: 'critical'
  },
  {
    endpoint: 'Payment Creation',
    limit: '3 requests per 15 minutes',
    description: 'Prevents payment system abuse',
    severity: 'high'
  },
  {
    endpoint: 'Admin Operations',
    limit: '2 requests per hour',
    description: 'Protects administrative functions',
    severity: 'critical'
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
};

export const RateLimitInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Rate Limiting Protection
          </CardTitle>
          <CardDescription>
            Our security system automatically limits requests to prevent abuse and protect sensitive data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Rate limits are applied per user and endpoint to ensure fair usage and security. 
              When limits are exceeded, you'll need to wait before making additional requests.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Current Limits
            </h4>
            
            <div className="grid gap-3">
              {ENDPOINT_LIMITS.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{item.endpoint}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getSeverityColor(item.severity) as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                      {item.limit}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold">What happens when limits are reached?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You'll receive a "Rate limit exceeded" message</li>
              <li>• The system will indicate how long to wait before retrying</li>
              <li>• Repeated violations may trigger additional security measures</li>
              <li>• All attempts are logged for security monitoring</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rate limits reset automatically after the time window</span>
              <Badge variant="outline" className="text-xs">
                Automated Protection
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};