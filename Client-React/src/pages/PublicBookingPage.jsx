import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Briefcase, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const API_Base_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublicBookingPage = () => {
    const { recruiterId } = useParams();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get('studentId'); // In real app, this might come from auth or token

    const [recruiter, setRecruiter] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Recruiter Profile
    useEffect(() => {
        const fetchRecruiter = async () => {
            try {
                const res = await axios.get(`${API_Base_URL}/public/recruiters/${recruiterId}`);
                setRecruiter(res.data);
            } catch (err) {
                setError("Recruiter not found or unavailable.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecruiter();
    }, [recruiterId]);

    // Fetch Availability when date changes
    useEffect(() => {
        if (!recruiter) return;

        const fetchAvailability = async () => {
            try {
                const res = await axios.get(`${API_Base_URL}/public/availability`, {
                    params: {
                        recruiterId,
                        date: selectedDate.toISOString()
                    }
                });
                setAvailableSlots(res.data.slots);
            } catch (err) {
                console.error("Failed to fetch slots");
            }
        };

        fetchAvailability();
    }, [recruiterId, selectedDate, recruiter]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleBookMeeting = async () => {
        if (!selectedSlot || !studentId) {
            alert("Please select a slot and ensure you are using a valid booking link.");
            return;
        }

        setBookingLoading(true);
        try {
            await axios.post(`${API_Base_URL}/public/book`, {
                recruiterId,
                studentId,
                startTime: selectedSlot,
                title: `Intro Call: ${recruiter.name}`
            });
            setBookingSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to book meeting.");
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

    if (bookingSuccess) {
        return (
            <div className="flex bg-gray-50 min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-fit">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Meeting Scheduled!</CardTitle>
                        <CardDescription>
                            Your meeting with {recruiter.name} has been confirmed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            A calendar invitation with the Google Meet link has been sent to your email.
                        </p>
                        <div className="bg-gray-100 p-4 rounded-lg text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                    {new Date(selectedSlot).toLocaleString(undefined, {
                                        dateStyle: 'full',
                                        timeStyle: 'short'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>Google Meet</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Panel: Recruiter Info */}
                <div className="md:col-span-1">
                    <Card className="h-full shadow-lg border-t-4 border-indigo-600">
                        <CardHeader className="text-center">
                            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-sm">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                                    {recruiter.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <CardTitle>{recruiter.name}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {recruiter.jobTitle} at {recruiter.company}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-gray-600">
                                <p className="mb-2">
                                    Looking for candidates in <strong>{recruiter.field}</strong>.
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {recruiter.country || 'Remote'}
                                </p>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">About the call</h4>
                                <p className="text-sm text-gray-600">
                                    30-minute introductory call to discuss opportunities and your background.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Calendar & Slots */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Calendar */}
                        <Card className="flex-1 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Select a Date</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Simple implementation of a calendar or using input[type=date] for now as specific calendar lib not installed */}
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => handleDateSelect(new Date(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Select a date to see available times.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Slots */}
                        <Card className="flex-1 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Available Times</CardTitle>
                                <CardDescription>
                                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {availableSlots.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No slots available for this date.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {availableSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                variant={selectedSlot === slot ? "default" : "outline"}
                                                className={`w-full ${selectedSlot === slot ? "bg-indigo-600 hover:bg-indigo-700" : "hover:border-indigo-300"}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Action */}
                    <Card className="shadow-lg border-indigo-100 bg-white">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {selectedSlot ? (
                                        <span>
                                            {new Date(selectedSlot).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Select a time to book</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500">30 min • Google Meet</p>
                            </div>
                            <Button
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                disabled={!selectedSlot || bookingLoading}
                                onClick={handleBookMeeting}
                            >
                                {bookingLoading ? "Scheduling..." : "Confirm Booking"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PublicBookingPage;
