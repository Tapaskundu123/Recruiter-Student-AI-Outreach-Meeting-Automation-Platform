import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StudentSearch = ({ selectedStudent, onSelectStudent }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setStudents([]);
            setShowDropdown(false);
            return;
        }

        // Debounce search
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/events/students/search`, {
                    params: { q: searchQuery }
                });
                setStudents(res.data.students || []);
                setShowDropdown(true);
            } catch (error) {
                console.error('Student search error:', error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, [searchQuery]);

    const handleSelect = (student) => {
        onSelectStudent(student);
        setSearchQuery('');
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
            </label>

            {selectedStudent ? (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <div>
                        <div className="font-semibold text-gray-900">{selectedStudent.name}</div>
                        <div className="text-xs text-gray-600">{selectedStudent.email}</div>
                        {selectedStudent.university && (
                            <div className="text-xs text-gray-500">{selectedStudent.university}</div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelectStudent(null)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search student by name or email..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        {loading && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
                        )}
                    </div>

                    <AnimatePresence>
                        {showDropdown && students.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
                            >
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => handleSelect(student)}
                                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                    >
                                        <div className="font-semibold text-gray-900">{student.name}</div>
                                        <div className="text-xs text-gray-600">{student.email}</div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            {student.university && <span>🎓 {student.university}</span>}
                                            {student.major && <span>• {student.major}</span>}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StudentSearch;
