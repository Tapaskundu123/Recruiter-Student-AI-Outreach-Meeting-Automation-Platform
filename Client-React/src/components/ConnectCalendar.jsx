import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, startOfDay, addMinutes } from 'date-fns';

const API_Base_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ConnectCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]); // [{start: ISO, end: ISO}]
  const [events, setEvents] = useState([]); // Optional: if backend returns busy events
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // URL Params
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const { recruiterId } = useParams();
  
  const studentId = "student_123_id"; // Replace with real

  useEffect(() => {
    if (status === "calendar_connected") {
      setIsConnected(true);
      toast.success("Google Calendar connected successfully!");
    } else if (status === "calendar_failed") {
      toast.error("Connection failed");
    }
    setLoading(false);
  }, [status]);

  // Fetch availability/events for selected date (when in day view)
  useEffect(() => {
    if (isConnected && recruiterId && view === 'day') {
      fetchAvailability();
    }
  }, [isConnected, recruiterId, selectedDate, view]);

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`${API_Base_URL}/calendar/slots`, {
        params: { recruiterId, date: format(selectedDate, 'yyyy-MM-dd') }
      });
      setAvailableSlots(res.data.slots || res.data); // Adjust based on your API response
      // setEvents(res.data.events || []); // If you return busy events
    } catch (err) {
      toast.error("Failed to load calendar");
    }
  };

  const handleConnect = () => {
    if (!recruiterId) return toast.error("Recruiter ID missing");
    window.location.href = `${API_Base_URL}/auth/google?recruiterId=${recruiterId}`;
  };

  const handleBookSlot = async (slotStart) => {
    setBookingLoading(true);
    try {
      await axios.post(`${API_Base_URL}/calendar/schedule`, {
        recruiterId,
        studentId,
        time: slotStart,
        duration: 30
      });
      setBookingSuccess(true);
      toast.success("Meeting booked!");
      fetchAvailability(); // Refresh
    } catch (err) {
      toast.error("Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Monthly View Days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOffset = getDay(monthStart); // 0=Sun

  if (loading) return <Card className="p-8 text-center">Loading...</Card>;

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Google Calendar
          </CardTitle>
          <CardDescription>Connect to view and schedule from your real calendar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} className="w-full gap-2 bg-white text-gray-800 border hover:bg-gray-50">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Connect Google Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Google-like Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-normal text-gray-800">Calendar</h1>
          <Button variant="outline" onClick={goToToday}>Today</Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></Button>
          </div>
          <span className="text-xl font-medium">{format(currentDate, 'MMMM yyyy')}</span>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>Day</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Month</Button>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="p-4">
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
            {monthDays.map(day => (
              <div
                key={day.toString()}
                onClick={() => { setSelectedDate(day); setView('day'); }}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition
                  ${isToday(day) ? 'bg-blue-100 text-blue-900 font-bold' : ''}
                  ${isSameDay(day, selectedDate) ? 'ring-2 ring-blue-600' : 'hover:bg-gray-100'}
                `}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                {/* Mini dots for events if you have them */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="flex h-screen">
          <div className="w-16 border-r">
            {/* Time labels */}
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="h-16 text-xs text-right pr-2 pt-1 text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="h-16 border-b relative">
                {/* Hourly slots - generate 30-min intervals */}
                {[0, 30].map(min => {
                  const slotStart = startOfDay(selectedDate);
                  slotStart.setHours(hour, min);
                  const slotISO = slotStart.toISOString();

                  const isAvailable = availableSlots.some(slot => slot.start === slotISO);

                  return (
                    <div key={min} className="absolute inset-x-0 h-16">
                      {isAvailable && (
                        <Button
                          disabled={bookingLoading}
                          onClick={() => handleBookSlot(slotISO)}
                          className="absolute inset-x-4 top-2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
                        >
                          {format(slotStart, 'h:mm a')} - {format(addMinutes(slotStart, 30), 'h:mm a')}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Meeting Scheduled!</h2>
            <p className="text-gray-600 mt-2">Check your Google Calendar and email for the Meet link.</p>
            <Button className="mt-6" onClick={() => setBookingSuccess(false)}>Close</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConnectCalendar;