import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Video,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Loader2,
    CalendarClock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { format, formatDistance, isPast, isFuture } from 'date-fns';

const API_Base_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InterviewScheduleManager = ({ recruiterId }) => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('upcoming'); // 'all', 'upcoming', 'completed', 'cancelled'

    // Fetch meetings
    const { data: meetingsData, isLoading } = useQuery({
        queryKey: ['meetings', recruiterId, filter],
        queryFn: async () => {
            const params = filter === 'upcoming' ? { upcoming: 'true' } : {};
            const res = await axios.get(`${API_Base_URL}/dashboard/meetings/${recruiterId}`, { params });
            return res.data;
        },
        enabled: !!recruiterId,
        refetchInterval: 30000 // Auto-refetch every 30 seconds
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['meeting-stats', recruiterId],
        queryFn: async () => {
            const res = await axios.get(`${API_Base_URL}/dashboard/stats/${recruiterId}`);
            return res.data;
        },
        enabled: !!recruiterId,
        refetchInterval: 30000
    });

    // Update meeting status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ meetingId, status }) => {
            const res = await axios.patch(`${API_Base_URL}/dashboard/meetings/${meetingId}`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['meetings']);
            queryClient.invalidateQueries(['meeting-stats']);
            toast.success('Meeting status updated successfully');
        },
        onError: () => {
            toast.error('Failed to update meeting status');
        }
    });

    // Fetch availability slots
    const { data: availabilityData } = useQuery({
        queryKey: ['availability', recruiterId],
        queryFn: async () => {
            const res = await axios.get(`${API_Base_URL}/availability/recruiter/${recruiterId}`);
            return res.data;
        },
        enabled: !!recruiterId,
        refetchInterval: 30000
    });

    const meetings = meetingsData?.meetings || [];
    const availabilitySlots = availabilityData?.availabilities || [];
    const stats = statsData?.stats || {};

    const getStatusConfig = (status) => {
        const configs = {
            scheduled: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Scheduled', icon: CalendarClock },
            confirmed: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Confirmed', icon: CheckCircle },
            completed: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Completed', icon: CheckCircle },
            cancelled: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled', icon: XCircle },
            'no-show': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'No Show', icon: AlertCircle },
            pending: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Availability Marked', icon: Clock }
        };
        return configs[status] || configs.scheduled;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Meetings"
                    value={stats.totalMeetings || 0}
                    icon={Calendar}
                    color="purple"
                />
                <StatCard
                    title="Upcoming"
                    value={stats.upcomingMeetings || 0}
                    icon={CalendarClock}
                    color="blue"
                />
                <StatCard
                    title="Today"
                    value={stats.todaysMeetings || 0}
                    icon={Clock}
                    color="green"
                />
                <StatCard
                    title="Completed"
                    value={stats.completedMeetings || 0}
                    icon={CheckCircle}
                    color="gray"
                />
            </div>

            {/* Next Meeting Highlight */}
            {stats.nextMeeting && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-900">Next Meeting</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{stats.nextMeeting.title}</h3>
                            <p className="text-gray-600 mb-3">
                                with <strong>{stats.nextMeeting.student.name}</strong>
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{format(new Date(stats.nextMeeting.scheduledTime), 'PPP')}</span>
                                <span>•</span>
                                <span>{format(new Date(stats.nextMeeting.scheduledTime), 'p')}</span>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">
                                    {formatDistance(new Date(stats.nextMeeting.scheduledTime), new Date(), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                        {stats.nextMeeting.googleMeetLink && (
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => window.open(stats.nextMeeting.googleMeetLink, '_blank')}
                            >
                                <Video className="w-4 h-4 mr-2" />
                                Join Meeting
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['upcoming', 'all', 'availability', 'completed', 'cancelled'].map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className={filter === f ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                    >
                        {f === 'availability' ? 'Availability Slots' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {/* Render Availability Slots if filter matches */}
                {(filter === 'all' || filter === 'availability') && availabilitySlots.map((slot, index) => (
                    <AvailabilityCard
                        key={slot.id}
                        slot={slot}
                        index={index}
                        onCancel={async () => {
                            // Implement cancel logic if needed
                            toast.info('Cancel functionality coming soon');
                        }}
                    />
                ))}

                {/* Render Meetings */}
                {(filter !== 'availability') && meetings.length === 0 && (filter === 'upcoming' || filter === 'completed' || filter === 'cancelled') ? (
                    <EmptyState filter={filter} />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {(filter !== 'availability') && meetings.map((meeting, index) => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                index={index}
                                onUpdateStatus={(status) =>
                                    updateStatusMutation.mutate({ meetingId: meeting.id, status })
                                }
                                getStatusConfig={getStatusConfig}
                            />
                        ))}
                    </AnimatePresence>
                )}

                {filter === 'availability' && availabilitySlots.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Availability Marked</h3>
                        <p className="text-gray-500 mb-6 max-w-md">Mark your availability on the calendar to allow students to be assigned.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        gray: 'from-gray-500 to-gray-600'
    };

    return (
        <Card className="overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full -mr-12 -mt-12`} />
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Meeting Card Component
const MeetingCard = ({ meeting, index, onUpdateStatus, getStatusConfig }) => {
    const statusConfig = getStatusConfig(meeting.status);
    const StatusIcon = statusConfig.icon;
    const meetingDate = new Date(meeting.scheduledTime);
    const isUpcoming = isFuture(meetingDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left Section */}
                        <div className="flex-1">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{meeting.title}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="w-4 h-4" />
                                            <span>{meeting.student.name}</span>
                                            {meeting.student.university && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-gray-500">{meeting.student.university}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(meetingDate, 'PPP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{format(meetingDate, 'p')}</span>
                                            <span>•</span>
                                            <span>{meeting.duration} min</span>
                                            {isUpcoming && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-indigo-600 font-medium">
                                                        {formatDistance(meetingDate, new Date(), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-end gap-3">
                            <Badge className={`${statusConfig.color} border px-3 py-1`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                            </Badge>

                            <div className="flex gap-2">
                                {meeting.googleMeetLink && isUpcoming && (
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => window.open(meeting.googleMeetLink, '_blank')}
                                    >
                                        <Video className="w-4 h-4 mr-1" />
                                        Join
                                    </Button>
                                )}

                                {meeting.status === 'scheduled' && isUpcoming && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateStatus('confirmed')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Confirm
                                    </Button>
                                )}

                                {meeting.status === 'confirmed' && isPast(meetingDate) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateStatus('completed')}
                                    >
                                        Mark Complete
                                    </Button>
                                )}

                                {isUpcoming && meeting.status !== 'cancelled' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onUpdateStatus('cancelled')}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Empty State Component
const EmptyState = ({ filter }) => {
    const messages = {
        upcoming: {
            title: 'No Upcoming Interviews',
            description: 'Share your booking link with students to schedule interviews.'
        },
        all: {
            title: 'No Interviews Yet',
            description: 'Your scheduled interviews will appear here.'
        },
        completed: {
            title: 'No Completed Interviews',
            description: 'Mark interviews as completed after they finish.'
        },
        cancelled: {
            title: 'No Cancelled Interviews',
            description: 'Cancelled interviews will appear here.'
        }
    };

    const config = messages[filter] || messages.all;

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CalendarClock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
            <p className="text-gray-500 mb-6 max-w-md">{config.description}</p>
        </div>
    );
};

// Availability Card Component
const AvailabilityCard = ({ slot, index, onCancel }) => {
    const slotDate = new Date(slot.startTime);
    const isUpcoming = isFuture(slotDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-purple-50/10">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left Section */}
                        <div className="flex-1">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-gray-900">Available Slot</h3>
                                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Pending Confirmation</Badge>
                                    </div>

                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(slotDate, 'PPP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{format(slotDate, 'p')}</span>
                                            <span>•</span>
                                            <span>{slot.duration} min</span>
                                            {isUpcoming && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-purple-600 font-medium">
                                                        {formatDistance(slotDate, new Date(), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Waiting for admin to assign a student</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-end gap-3">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={onCancel}
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Remove Slot
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default InterviewScheduleManager;
