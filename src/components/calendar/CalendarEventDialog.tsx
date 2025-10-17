import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, CreateCalendarEventData, EVENT_TYPE_CONFIG, CalendarEventType } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { usePropertyData } from '@/hooks/usePropertyData';
import { cn } from '@/lib/utils';

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
}

export const CalendarEventDialog: React.FC<CalendarEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  selectedDate
}) => {
  const { toast } = useToast();
  const { createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { properties } = usePropertyData();
  
  const [formData, setFormData] = useState<CreateCalendarEventData>({
    event_type: 'custom',
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    property_id: '',
    lease_id: '',
    is_recurring: false,
    recurring_pattern: 'yearly',
    reminder_days: [7, 3, 1]
  });
  
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (event) {
      setFormData({
        event_type: event.event_type,
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        event_time: event.event_time || '',
        property_id: event.property_id || '',
        lease_id: event.lease_id || '',
        is_recurring: event.is_recurring,
        recurring_pattern: event.recurring_pattern || 'yearly',
        reminder_days: event.reminder_days
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        event_date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date) {
      toast({
        title: "Feil",
        description: "Tittel og dato er påkrevd",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (event) {
        await updateEvent(event.id, formData);
        toast({
          title: "Suksess",
          description: "Hendelse oppdatert"
        });
      } else {
        await createEvent(formData);
        toast({
          title: "Suksess", 
          description: "Hendelse opprettet"
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre hendelse",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    if (window.confirm('Er du sikker på at du vil slette denne hendelsen?')) {
      setLoading(true);
      try {
        await deleteEvent(event.id);
        toast({
          title: "Suksess",
          description: "Hendelse slettet"
        });
        onOpenChange(false);
      } catch (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke slette hendelse",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof CreateCalendarEventData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getEventTypeConfig = (eventType: CalendarEventType) => {
    return EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.custom;
  };

  const selectedEventConfig = getEventTypeConfig(formData.event_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn("p-2 rounded", selectedEventConfig.color)}>
              {selectedEventConfig.icon}
            </span>
            {event ? 'Rediger hendelse' : 'Ny hendelse'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Hendelsestype</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => handleInputChange('event_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="F.eks. Indeksregulering 2024"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Ekstra detaljer om hendelsen..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dato *</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.event_date ? 
                      format(new Date(formData.event_date), "PPP", { locale: nb }) : 
                      "Velg dato"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.event_date ? new Date(formData.event_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('event_date', format(date, 'yyyy-MM-dd'));
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tid (valgfri)</Label>
              <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_time && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.event_time || "Velg tid"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => handleInputChange('event_time', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Property */}
          <div className="space-y-2">
            <Label>Eiendom (valgfri)</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => handleInputChange('property_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg eiendom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ingen eiendom</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{property.address}, {property.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
              />
              <Label htmlFor="recurring">Gjentakende hendelse</Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-2">
                <Label>Gjentakelse</Label>
                <Select
                  value={formData.recurring_pattern}
                  onValueChange={(value) => handleInputChange('recurring_pattern', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Årlig</SelectItem>
                    <SelectItem value="monthly">Månedlig</SelectItem>
                    <SelectItem value="quarterly">Kvartalsvis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Reminder Days */}
          <div className="space-y-2">
            <Label>Påminnelser (dager før hendelsen)</Label>
            <div className="flex flex-wrap gap-2">
              {[30, 14, 7, 3, 1].map(day => (
                <Badge
                  key={day}
                  variant={formData.reminder_days.includes(day) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newReminders = formData.reminder_days.includes(day)
                      ? formData.reminder_days.filter(d => d !== day)
                      : [...formData.reminder_days, day].sort((a, b) => b - a);
                    handleInputChange('reminder_days', newReminders);
                  }}
                >
                  {day} dager
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Slett
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Lagrer...' : event ? 'Oppdater' : 'Opprett'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};





