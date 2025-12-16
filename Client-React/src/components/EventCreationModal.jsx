import React, { useState } from 'react';
import { X, Calendar, Clock, Briefcase, Target, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import StudentSearch from './StudentSearch';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EventCreationModal = ({ isOpen, onClose, selectedDate, recruiterId, onEventCreated }) => {
    const [formData, setFormData] = useState({
        eventName: '',
        eventField: '',
        keyAreas: [],
        time: '10:00',
        duration: 30
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [keyAreaInput, setKeyAreaInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addKeyArea = () => {
        if (keyAreaInput.trim() && formData.keyAreas.length < 5) {
            setFormData(prev => ({
                ...prev,
                keyAreas: [...prev.keyAreas, keyAreaInput.trim()]
            }));
            setKeyAreaInput('');
        }
    };

    const removeKeyArea = (index) => {
        setFormData(prev => ({
            ...prev,
            keyAreas: prev.keyAreas.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStudent) {
            toast.error('Please select a student');
            return;
        }

        if (!formData.eventName.trim()) {
            toast.error('Please enter an event name');
            return;
        }

        setLoading(true);

        try {
            // Combine date and time
            const [hours, minutes] = formData.time.split(':');
            const scheduledDateTime = new Date(selectedDate);
            scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const payload = {
                recruiterId,
                studentId: selectedStudent.id,
                eventName: formData.eventName,
                eventField: formData.eventField || undefined,
                keyAreas: formData.keyAreas,
                scheduledTime: scheduledDateTime.toISOString(),
                duration: parseInt(formData.duration)
            };

            const res = await axios.post(`${API_BASE_URL}/events/create`, payload);

            toast.success('Event created successfully! 🎉', {
                description: 'Confirmation emails have been sent to both parties.'
            });

            if (onEventCreated) {
                onEventCreated(res.data.meeting);
            }

            // Reset and close
            setFormData({
                eventName: '',
                eventField: '',
                keyAreas: [],
                time: '10:00',
                duration: 30
            });
            setSelectedStudent(null);
            onClose();

        } catch (error) {
            console.error('Event creation error:', error);
            toast.error(error.response?.data?.error || 'Failed to create event');
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
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header with Gradient */}
                        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Create New Event</h2>
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
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Event Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Event Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="eventName"
                                    value={formData.eventName}
                                    onChange={handleChange}
                                    placeholder="e.g., Technical Interview, Product Demo"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* Student Search */}
                            <StudentSearch
                                selectedStudent={selectedStudent}
                                onSelectStudent={setSelectedStudent}
                            />

                            {/* Event Field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4" />
                                    Event Field
                                </label>
                                <input
                                    type="text"
                                    name="eventField"
                                    value={formData.eventField}
                                    onChange={handleChange}
                                    placeholder="e.g., Technology, Finance, Marketing"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Key Areas */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Target className="w-4 h-4" />
                                    Key Discussion Areas
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={keyAreaInput}
                                        onChange={(e) => setKeyAreaInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addKeyArea();
                                            }
                                        }}
                                        placeholder="Add a topic (max 5)"
                                        disabled={formData.keyAreas.length >= 5}
                                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={addKeyArea}
                                        disabled={!keyAreaInput.trim() || formData.keyAreas.length >= 5}
                                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {formData.keyAreas.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.keyAreas.map((area, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300 rounded-full text-sm font-medium text-indigo-700"
                                            >
                                                {area}
                                                <button
                                                    type="button"
                                                    onClick={() => removeKeyArea(index)}
                                                    className="ml-1 text-indigo-500 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Time and Duration Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Time */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Clock className="w-4 h-4" />
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Duration (minutes)
                                    </label>
                                    <select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                    </select>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">💡</div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-semibold mb-1">What happens next?</p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                                            <li>Google Meet link will be generated automatically</li>
                                            <li>Both parties receive immediate email confirmation</li>
                                            <li>They'll get reminder emails 24 hours before the event</li>
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
                                    disabled={loading || !selectedStudent}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-5 h-5" />
                                            Create Event
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
