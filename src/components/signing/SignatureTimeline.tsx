import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, FileText, Send, CheckCircle } from "lucide-react";

interface TimelineEvent {
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface SignatureTimelineProps {
  createdAt: string;
  signatureInitiatedAt?: string;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  completedAt?: string;
  landlordName?: string;
  tenantName: string;
}

export function SignatureTimeline({
  createdAt,
  signatureInitiatedAt,
  landlordSignedAt,
  tenantSignedAt,
  completedAt,
  landlordName = "Utleier",
  tenantName,
}: SignatureTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const events: TimelineEvent[] = [
    {
      title: 'Leieavtale opprettet',
      description: 'Avtalen ble opprettet i systemet',
      timestamp: createdAt,
      completed: true,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: 'Sendt til signering',
      description: 'BankID-signering ble aktivert',
      timestamp: signatureInitiatedAt,
      completed: !!signatureInitiatedAt,
      icon: <Send className="h-4 w-4" />,
    },
    {
      title: `${landlordName} signerte`,
      description: 'Utleier signerte med BankID',
      timestamp: landlordSignedAt,
      completed: !!landlordSignedAt,
      icon: <Check className="h-4 w-4" />,
    },
    {
      title: `${tenantName} signerte`,
      description: 'Leietaker signerte med BankID',
      timestamp: tenantSignedAt,
      completed: !!tenantSignedAt,
      icon: <Check className="h-4 w-4" />,
    },
    {
      title: 'Leieavtale fullført',
      description: 'Avtalen er nå juridisk bindende',
      timestamp: completedAt,
      completed: !!completedAt,
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signeringsforløp</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Icon circle */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    event.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted text-muted-foreground'
                  }`}
                >
                  {event.completed ? event.icon : <Clock className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <p
                    className={`font-medium ${
                      event.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {event.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
