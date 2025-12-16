import React, { useState } from 'react';
import { X, Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EventCreationModal = ({ isOpen, onClose, selectedDate, recruiterId, onEventCreated }) => {
    const [formData, setFormData] = useState({
        startTime: '10:00',
        duration: 30
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate || isNaN(new Date(selectedDate).getTime())) {
            toast.error('Invalid date selected. Please try again.');
            return;
        }

        setLoading(true);

        try {
            // Combine date and time
            const [hours, minutes] = formData.startTime.split(':');
            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Calculate end time
            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(formData.duration));

            const payload = {
                recruiterId,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                duration: parseInt(formData.duration)
            };

            const res = await axios.post(`${API_BASE_URL}/availability/mark`, payload);

            toast.success('Availability saved successfully! 🎉', {
                description: 'Details saved. Confirmation email and meeting link will be sent in the next 24 hours after admin assigns a student.'
            });

            if (onEventCreated) {
                onEventCreated(res.data.availability);
            }

            // Reset and close
            setFormData({
                startTime: '10:00',
                duration: 30
            });
            onClose();

        } catch (error) {
            console.error('Availability marking error:', error);

            // Handle validation errors array
            if (error.response?.data?.details) {
                const messages = error.response.data.details.map(err => err.msg).join(', ');
                toast.error(`Validation Error: ${messages}`);
            } else {
                toast.error(error.response?.data?.error || 'Failed to mark availability. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header with Gradient */}
                        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Mark Availability</h2>
                                    <p className="text-indigo-100 text-sm">
                                        📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Time and Duration Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Start Time */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Clock className="w-4 h-4" />
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Duration
                                    </label>
                                    <select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="15">15 min</option>
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                    </select>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">✨</div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-semibold mb-1">What happens next?</p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                                            <li>Your availability is marked for this time slot</li>
                                            <li>Admin will review and assign a student from waitlist</li>
                                            <li>You'll receive confirmation once meeting is scheduled</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Marking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Mark Available
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EventCreationModal;
