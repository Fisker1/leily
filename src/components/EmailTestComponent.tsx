import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';

/**
 * Email Test Component
 * 
 * This component provides a testing interface for the Microsoft Exchange email service.
 * It should only be used in development/staging environments.
 */
export function EmailTestComponent() {
  const { toast } = useToast();
  const { sendEmail, isLoading, error } = useEmailService();
  
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'account_created' | 'password_reset' | 'lease_agreement_ready'>('account_created');

  const handleSendTestEmail = async () => {
    if (!testEmail || !testName) {
      toast({
        title: 'Error',
        description: 'Please fill in both email and name fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      let templateData;
      const emailType = selectedTemplate;

      switch (selectedTemplate) {
        case 'account_created':
          templateData = {
            recipientEmail: testEmail,
            recipientName: testName,
            supportEmail: 'kontakt@leily.no'
          };
          break;
        case 'password_reset':
          templateData = {
            recipientEmail: testEmail,
            recipientName: testName,
            resetPasswordUrl: 'https://leily.no/reset-password?token=test-token'
          };
          break;
        case 'lease_agreement_ready':
          templateData = {
            recipientEmail: testEmail,
            recipientName: testName,
            propertyAddress: 'Testveien 123',
            propertyCity: 'Oslo',
            monthlyRent: 15000,
            signingUrl: 'https://leily.no/sign-lease?token=test-token',
            landlordName: 'Test Utleier',
            leaseStartDate: '2024-02-01'
          };
          break;
        default:
          throw new Error('Invalid template selected');
      }

      const result = await sendEmail(
        emailType,
        templateData,
        {
          to: [{ email: testEmail, name: testName }]
        }
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Test email sent successfully! Message ID: ${result.messageId}`,
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to send email: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Only show in development/staging
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>📧 Email Service Test</CardTitle>
        <CardDescription>
          Test the Microsoft Exchange email service with different templates.
          This component is only visible in development/staging environments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-name">Test Name</Label>
            <Input
              id="test-name"
              type="text"
              placeholder="Test User"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-select">Email Template</Label>
          <select
            id="template-select"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as 'account_created' | 'password_reset' | 'lease_agreement_ready')}
          >
            <option value="account_created">Account Created (Welcome)</option>
            <option value="password_reset">Password Reset</option>
            <option value="lease_agreement_ready">Lease Agreement Ready</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <Button 
          onClick={handleSendTestEmail}
          disabled={isLoading || !testEmail || !testName}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Note:</strong> This will send a real email using Microsoft Exchange.</p>
          <p><strong>Templates available:</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>Account Created - Welcome email for new users</li>
            <li>Password Reset - Password reset link email</li>
            <li>Lease Agreement Ready - Lease signing notification</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
