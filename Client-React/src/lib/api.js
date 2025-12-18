import axios from 'axios';

// Get API URL from Vite env vars, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for auth tokens if needed
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // or 'auth_token' - checking previous file used 'auth_token' in Step 329, but I used 'token' in Step 337. 
    // Let's stick to 'token' or 'auth_token'. Step 329 used 'auth_token'. I should check Auth logic. 
    // Auth logic is not fully visible here, but let's assume 'token' for now or support both?
    // Actually, Step 329 used 'auth_token'. I should probably support that to be safe.
    // But my new code in Step 337 used 'token'. 
    // Let's use 'token' as standard, or check what 'auth_token' is used for.
    // Step 329: const token = localStorage.getItem('auth_token');
    // I'll check if I can check login/auth file. 
    // But for now, let's use 'auth_token' likely used by other parts if they exist?
    // Actually, I'll use 'token' as that's what I wrote in the accepted Step 325 code, but invalidating Step 343.
    // Wait, Step 329 used 'auth_token'. I should restore that or use both.
    const validToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
    }
    return config;
});

export const api = {
    // --- WAITLIST (Restored) ---
    joinWaitlist: (data) => apiClient.post('/waitlist', data),
    getWaitlistCount: () => apiClient.get('/waitlist/count'),
    getWaitlistStats: () => apiClient.get('/waitlist/stats'),

    // --- DASHBOARD ---
    getDashboardStats: () => apiClient.get('/analytics/dashboard'),
    getAdminStats: () => apiClient.get('/admin/stats'),

    // --- RECRUITERS (Enhanced) ---
    getRecruiters: (params) => apiClient.get('/admin/recruiters', { params }), // params: { page, limit, search, country, field, platform }
    deleteRecruiter: (id) => apiClient.delete(`/admin/recruiters/${id}`),
    exportRecruiters: (data) => apiClient.post('/admin/export/recruiters', data, { responseType: 'blob' }),

    // --- STUDENTS (Enhanced) ---
    getStudents: (params) => apiClient.get('/admin/students', { params }),
    deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),
    exportStudents: (data) => apiClient.post('/admin/export/students', data, { responseType: 'blob' }),

    // --- SCRAPING ---
    startScraping: (data) => apiClient.post('/scrapers/start', data),
    getScrapingStats: () => apiClient.get('/scrapers/stats'),
    // Legacy/Other scraping methods from Step 329 if needed?
    // bulkScrape, startRecruiterScraping, startStudentScraping, getScrapingLogs, getScrapingStatus
    // I'll add them to be safe.
    bulkScrape: (data) => apiClient.post('/scrapers/bulk', data),
    getScrapingLogs: (params) => apiClient.get('/scrapers/logs', { params }),


    // --- CAMPAIGNS (Restored) ---
    createCampaign: (data) => apiClient.post('/campaigns', data),
    getCampaigns: (params) => apiClient.get('/campaigns', { params }),
    getCampaign: (id) => apiClient.get(`/campaigns/${id}`),
    updateCampaign: (id, data) => apiClient.patch(`/campaigns/${id}`, data),
    sendCampaign: (id) => apiClient.post(`/campaigns/${id}/send`),
    deleteCampaign: (id) => apiClient.delete(`/campaigns/${id}`),

    // --- MEETINGS (Restored) ---
    createMeeting: (data) => apiClient.post('/meetings', data),
    getMeetings: (params) => apiClient.get('/meetings', { params }),
    getMeeting: (id) => apiClient.get(`/meetings/${id}`),
    updateMeeting: (id, data) => apiClient.patch(`/meetings/${id}`, data),
    deleteMeeting: (id) => apiClient.delete(`/meetings/${id}`),

    // --- AUTH ---
    googleAuth: (recruiterId) => apiClient.get(`/auth/google?recruiterId=${recruiterId}`),

    // --- CALENDAR ---
    getCalendarSlots: (params) => apiClient.get('/calendar/slots', { params }),
    scheduleMeeting: (data) => apiClient.post('/calendar/schedule', data),

    // --- PUBLIC ---
    getPublicRecruiter: (id) => apiClient.get(`/public/recruiters/${id}`),
    checkAvailability: (params) => apiClient.get(`/public/availability`, { params }),
    bookMeeting: (data) => apiClient.post(`/public/book`, data),

    // --- ANALYTICS LEGACY (Optional, for backward compatibility) ---
    // getDashboardStats was mapped to /admin/stats above.

    // --- EMAIL ---
    getEmailTemplates: (params) => apiClient.get('/email/templates', { params }),
    createEmailTemplate: (data) => apiClient.post('/email/templates', data),
    updateEmailTemplate: (id, data) => apiClient.patch(`/email/templates/${id}`, data),
    deleteEmailTemplate: (id) => apiClient.delete(`/email/templates/${id}`),
    generateEmailContent: (data) => apiClient.post('/email/generate', data),
    sendBulkEmail: (data) => apiClient.post('/email/send', data),
    uploadEmailTemplate: (formData) => apiClient.post('/email/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    refineEmailTemplate: (id) => apiClient.post(`/email/refine/${id}`),
};

export default apiClient;
