import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Filter, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEventDialog } from './CalendarEventDialog';
import { CalendarEventFilters } from './CalendarEventFilters';
import { IndexRegulationDialog } from './IndexRegulationDialog';

interface RentalCalendarProps {
  className?: string;
}

export const RentalCalendar: React.FC<RentalCalendarProps> = ({ className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [showIndexRegulation, setShowIndexRegulation] = useState(false);

  const { events, loading, getEventsForDate } = useCalendarEvents(filters);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add days from previous/next month to fill the calendar grid
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleCloseEventDialog = () => {
    setShowEventDialog(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const getEventsForDay = (date: Date) => {
    return getEventsForDate(date);
  };

  const getEventTypeConfig = (eventType: string) => {
    return EVENT_TYPE_CONFIG[eventType as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.custom;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Leiekalender</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Laster kalender...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leiekalender</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIndexRegulation(true)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Indeksregulering
              </Button>
              <Button
                size="sm"
                onClick={() => handleDateClick(new Date())}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ny hendelse
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <CalendarEventFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: nb })}
            </h2>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[100px] p-1 border border-border cursor-pointer hover:bg-muted/50
                    ${!isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''}
                    ${isSelected ? 'bg-primary/10 border-primary' : ''}
                    ${isTodayDate ? 'bg-primary/5 border-primary/30' : ''}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-sm font-medium
                      ${isTodayDate ? 'text-primary font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const config = getEventTypeConfig(event.event_type);
                      return (
                        <div
                          key={event.id}
                          className={`
                            text-xs p-1 rounded cursor-pointer truncate
                            ${config.color}
                            ${event.is_completed ? 'opacity-50 line-through' : ''}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          title={event.title}
                        >
                          <span className="mr-1">{config.icon}</span>
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} flere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event dialog */}
      <CalendarEventDialog
        open={showEventDialog}
        onOpenChange={handleCloseEventDialog}
        event={editingEvent}
        selectedDate={selectedDate}
      />

      {/* Index regulation dialog */}
      <IndexRegulationDialog
        open={showIndexRegulation}
        onOpenChange={setShowIndexRegulation}
      />
    </>
  );
};
