import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Menu, Plus, Search, Settings, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    getDay, addMonths, subMonths, isSameDay, isToday,
    startOfWeek, endOfWeek, addWeeks, subWeeks,
    addDays, subDays, startOfDay, endOfDay,
    isSameMonth, parseISO
} from 'date-fns';

const API_Base_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ConnectCalendar = ({ embeddedRecruiterId }) => {
    const [searchParams] = useSearchParams();
    const { recruiterId: paramRecruiterId } = useParams();
    const navigate = useNavigate();

    // Use prop if embedded, otherwise param
    const recruiterId = embeddedRecruiterId || paramRecruiterId;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [events, setEvents] = useState([]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [interviews, setInterviews] = useState([]);

    // --- ACTIONS ---
    const createTestEvent = async () => {
        try {
            toast.loading("Creating test event...");
            await axios.post(`${API_Base_URL}/calendar/schedule`, {
                recruiterId,
                title: "Test Event - AI Outreach",
                time: new Date().toISOString(),
                duration: 30
            });
            toast.dismiss();
            toast.success("Test event created! Check your Google Calendar.");
            fetchEvents(); // Refresh data
        } catch (err) {
            toast.dismiss();
            toast.error("Failed to create event. Check console.");
            console.error(err);
        }
    };

    // Status check from URL (post-oauth)
    useEffect(() => {
        const status = searchParams.get("status");
        if (status === "calendar_connected") {
            setIsConnected(true);
            toast.success("Calendar connected!");
            // Clean URL
            // navigate(`/dashboard/${recruiterId}`, { replace: true });
        } else if (status === "calendar_failed") {
            toast.error("Connection failed");
        }
    }, [searchParams, navigate, recruiterId]);

    // Initial Check (Simulated for now, real app would check /api/recruiter/:id status)
    useEffect(() => {
        if (recruiterId) {
            checkConnectionStatus();
        }
    }, [recruiterId]);

    const checkConnectionStatus = async () => {
        try {
            const res = await axios.get(`${API_Base_URL}/public/recruiters/${recruiterId}`);
            // In a real app, I'd check a specific field 'isCalendarConnected'
            // For now, let's assume if we can fetch events, it's connected.
            // Or checking if public profile exists is enough to try fetching events.
            fetchEvents();
            setIsConnected(true); // Optimistic or based on API
        } catch (err) {
            console.error("Not connected or not found");
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        if (!recruiterId) return;
        try {
            // Fetch for current view range
            let start, end;
            if (view === 'month') {
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
            } else if (view === 'week') {
                start = startOfWeek(currentDate);
                end = endOfWeek(currentDate);
            } else {
                start = startOfDay(currentDate);
                end = endOfDay(currentDate);
            }

            const res = await axios.get(`${API_Base_URL}/calendar/slots`, {
                params: {
                    recruiterId,
                    date: currentDate.toISOString(),
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            });
            setEvents(res.data.events || []);
            setInterviews(res.data.interviews || []);
        } catch (err) {
            console.error("Failed to fetch events");
            setIsConnected(false); // Likely auth failed
        }
    };

    // Re-fetch when date/view changes
    useEffect(() => {
        if (isConnected) fetchEvents();
    }, [currentDate, view, isConnected]);


    const handleConnect = () => {
        window.location.href = `${API_Base_URL}/auth/google?recruiterId=${recruiterId}`;
    };

    const next = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    };

    const prev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    };

    const today = () => setCurrentDate(new Date());

    if (!recruiterId) return <div className="p-8 text-center text-red-500">Recruiter ID Missing</div>;
    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200 shadow-sm h-[600px]">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Connect Google Calendar</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                    Sync your meetings, check availability, and schedule calls directly from this dashboard.
                </p>
                <Button onClick={handleConnect} size="lg" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm gap-3">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                </Button>
            </div>
        );
    }

    // --- GOOGLE CALENDAR UI CLONE ---

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} className="text-gray-600">
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Logo" className="w-8 h-8" />
                        <span className="text-xl font-normal text-gray-700 hidden md:block">Calendar</span>
                    </div>
                    <Button variant="outline" className="ml-8 mr-2 px-4 h-9" onClick={today}>Today</Button>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 rounded-full"><ChevronRight className="w-5 h-5" /></Button>
                    </div>
                    <h2 className="text-xl font-normal text-gray-700 ml-2">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-md p-0.5">
                        {['Day', 'Week', 'Month'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v.toLowerCase())}
                                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${view === v.toLowerCase() ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <Avatar className="h-8 w-8 ml-4">
                        <AvatarFallback className="bg-purple-600 text-white">R</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                {showSidebar && (
                    <aside className="w-64 border-r flex flex-col p-4 hidden md:flex bg-white">
                        <Button className="w-32 rounded-full h-12 shadow-lg mb-6 bg-white hover:bg-gray-50 text-gray-700 border flex items-center gap-2 pl-3 justify-start">
                            <span className="text-3xl font-light text-red-500">+</span>
                            <span className="font-medium">Create</span>
                        </Button>

                        {/* Mini Calendar (Static for visual) */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-sm font-medium text-gray-700">{format(currentDate, 'MMMM yyyy')}</span>
                                <div className="flex gap-1">
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 text-center text-xs gap-y-2">
                                {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) }).slice(0, 35).map((day, i) => (
                                    <div key={i} className={`h-6 w-6 mx-auto flex items-center justify-center rounded-full ${isSameDay(day, currentDate) ? 'bg-blue-600 text-white' : isSameMonth(day, currentDate) ? 'text-gray-700' : 'text-gray-300'}`}>
                                        {format(day, 'd')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-600 mb-2 flex justify-between items-center">
                                My calendars <ChevronLeft className="w-4 h-4 rotate-90" />
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-white text-[10px]">✔</div>
                                    <span>{recruiterId ? "Recruiter" : "User"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-4 h-4 rounded border-2 border-gray-400"></div>
                                    <span>Birthdays</span>
                                </div>

                                {/* Test Integration Button */}
                                <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={createTestEvent}>
                                    <Settings className="w-3 h-3 mr-2" />
                                    Test Connection
                                </Button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Main Calendar View */}
                <main className="flex-1 overflow-y-auto bg-white">
                    {view === 'month' && <MonthView currentDate={currentDate} events={events} interviews={interviews} />}
                    {view === 'week' && <WeekView currentDate={currentDate} events={events} />}
                    {view === 'day' && <DayView currentDate={currentDate} events={events} />}
                </main>
            </div>
        </div>
    );
};


// --- SUB COMPONENTS ---

const MonthView = ({ currentDate, events, interviews = [] }) => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });

    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 border-l first:border-l-0">
                        {day}
                    </div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 (or-auto)">
                {days.map((day, i) => {
                    const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));
                    const dayInterviews = interviews.filter(e => isSameDay(parseISO(e.start), day));
                    const hasInterviews = dayInterviews.length > 0;
                    return (
                        <div key={day.toISOString()} className={`border-b border-r min-h-[100px] p-1 flex flex-col hover:bg-gray-50 ${isSameMonth(day, currentDate) ? 'bg-white' : 'bg-gray-50/50'} ${hasInterviews ? 'ring-2 ring-indigo-200 ring-inset' : ''}`}>
                            <div className="text-center mb-1 relative">
                                <span className={`text-xs p-1 rounded-full ${isToday(day) ? 'bg-blue-600 text-white px-2' : 'text-gray-700'}`}>
                                    {format(day, 'd')}
                                    {i === 0 && <span className="ml-1">{format(day, 'MMM')}</span>}
                                </span>
                                {hasInterviews && (
                                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {dayInterviews.length}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                                {dayInterviews.map(interview => (
                                    <div key={interview.id} className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded truncate border-l-2 border-indigo-600 cursor-pointer hover:bg-indigo-200 font-medium">
                                        🎯 {format(parseISO(interview.start), 'HH:mm')} {interview.title}
                                    </div>
                                ))}
                                {dayEvents.map(event => (
                                    <div key={event.id} className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate border-l-2 border-blue-500 cursor-pointer hover:bg-blue-200">
                                        {format(parseISO(event.start), 'HH:mm')} {event.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Simplified Week/Day Views for brevity but retaining structure
const WeekView = ({ currentDate, events }) => {
    const start = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end: endOfWeek(currentDate) });

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10 w-full min-w-[800px]">
                <div className="w-16 border-r p-2 text-xs text-gray-400 text-right mt-8">GMT+0</div>
                {days.map(day => (
                    <div key={day.toISOString()} className="border-r flex flex-col items-center py-2">
                        <span className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</span>
                        <span className={`text-xl font-normal mt-1 w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                            {format(day, 'd')}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-1 min-w-[800px] relative">
                <div className="w-16 border-r flex flex-col">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="h-14 border-b text-[10px] text-gray-500 text-right pr-2 -mt-2 relative">
                            {i > 0 && <span className="absolute -top-2 right-2">{i > 12 ? i - 12 + ' PM' : i + ' AM'}</span>}
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7">
                    {days.map(day => (
                        <div key={day.toISOString()} className="border-r relative h-[1344px]"> {/* 24 * 56px */}
                            {Array.from({ length: 24 }).map((_, i) => <div key={i} className="h-14 border-b border-gray-100" />)}

                            {/* Render Events */}
                            {events.filter(e => isSameDay(parseISO(e.start), day)).map(event => {
                                const start = parseISO(event.start);
                                const end = parseISO(event.end);
                                const top = (start.getHours() * 60 + start.getMinutes()) * (56 / 60); // 56px per hour
                                const duration = (end - start) / 60000;
                                const height = duration * (56 / 60);
                                return (
                                    <div
                                        key={event.id}
                                        style={{ top: `${top}px`, height: `${Math.max(20, height)}px` }}
                                        className="absolute inset-x-1 bg-blue-100 text-blue-700 text-[10px] p-1 rounded border-l-2 border-blue-500 overflow-hidden leading-tight hover:z-20 hover:scale-105 transition-all shadow-sm"
                                    >
                                        <div className="font-semibold">{event.title}</div>
                                        <div>{format(start, 'h:mm a')}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DayView = ({ currentDate, events }) => {
    return <WeekView currentDate={currentDate} events={events} />; // Reuse logic but just 1 column ideally. Lazy impl for now.
};


export default ConnectCalendar;