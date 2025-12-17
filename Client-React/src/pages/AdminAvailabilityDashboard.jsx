import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminAvailabilityDashboard = () => {
  const queryClient = useQueryClient();

  // Global selected student (shared across the page)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Pending Slots
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['admin-pending-slots'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/admin/pending-slots`);
      return res.data;
    },
  });

  // Fetch Waitlisted Students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-waitlisted-students'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/admin/waitlisted-students`);
      return res.data;
    },
  });

  // Confirm Meeting Mutation
  const confirmMutation = useMutation({
    mutationFn: async ({ availabilitySlotId, studentId }) => {
      const res = await axios.post(`${API_BASE_URL}/admin/confirm-meeting`, {
        availabilitySlotId,
        studentId,
        agenda: `Introductory meeting`,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Meeting Confirmed!', {
        description: `${data.meeting.student.name} → ${data.meeting.recruiter.name}`,
      });
      setSelectedStudent(null); // Reset selection
      queryClient.invalidateQueries({ queryKey: ['admin-pending-slots'] });
      queryClient.invalidateQueries({ queryKey: ['admin-waitlisted-students'] });
    },
    onError: (error) => {
      toast.error('Failed to confirm', {
        description: error.response?.data?.error || error.message,
      });
    },
  });

  // Filter students once (for sidebar)
  const filteredStudents = studentsData?.students?.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.university?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    pendingSlots: slotsData?.slots?.length || 0,
    waitlistedStudents: studentsData?.students?.length || 0,
  };

  if (slotsLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meeting Arrangements</h1>
          <p className="text-gray-500 mt-1">Assign students to recruiter availability slots</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-100">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{stats.pendingSlots}</span>
            <span className="text-sm opacity-80">Pending Slots</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg border border-purple-100">
            <Users className="w-5 h-5" />
            <span className="font-semibold">{stats.waitlistedStudents}</span>
            <span className="text-sm opacity-80">Waitlisted</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Slots */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Pending Availability Slots
          </h2>

          {slotsData?.slots?.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No pending slots at the moment</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {slotsData.slots.map((slot) => (
                <Card key={slot.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                          {slot.recruiter.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{slot.recruiter.name}</h3>
                          <p className="text-sm text-gray-500">{slot.recruiter.company || 'No company'}</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(slot.startTime), 'PPP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(slot.startTime), 'p')} • {slot.duration} min
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Assign Button - only enabled if a student is selected */}
                      <Button
                        onClick={() =>
                          confirmMutation.mutate({
                            availabilitySlotId: slot.id,
                            studentId: selectedStudent.id,
                          })
                        }
                        disabled={!selectedStudent || confirmMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 min-w-[160px]"
                      >
                        {confirmMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : selectedStudent ? (
                          <>
                            Assign to {selectedStudent.name.split(' ')[0]}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          'Select a student first'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Waitlisted Students Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Waitlisted Students
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No students found</p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {student.university || 'No university'} • {student.major || 'General'}
                      </p>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedStudent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 font-medium">
                ✅ Ready to assign: <strong>{selectedStudent.name}</strong>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedStudent(null)}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAvailabilityDashboard;