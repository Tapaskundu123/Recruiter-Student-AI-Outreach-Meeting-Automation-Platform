import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions
export const api = {
    // Waitlist
    joinWaitlist: (data) => apiClient.post('/waitlist', data),
    getWaitlistCount: () => apiClient.get('/waitlist/count'),
    getWaitlistStats: () => apiClient.get('/waitlist/stats'),

    // Scrapers
    bulkScrape: (data) => apiClient.post('/scrapers/bulk', data),
    startRecruiterScraping: (data) => apiClient.post('/scrapers/recruiters', data),
    startStudentScraping: (data) => apiClient.post('/scrapers/students', data),
    getScrapingStatus: (logId) => apiClient.get(`/scrapers/status/${logId}`),
    getScrapingLogs: (params) => apiClient.get('/scrapers/logs', { params }),
    getScrapingStats: () => apiClient.get('/scrapers/stats'),

    // Campaigns
    createCampaign: (data) => apiClient.post('/campaigns', data),
    getCampaigns: (params) => apiClient.get('/campaigns', { params }),
    getCampaign: (id) => apiClient.get(`/campaigns/${id}`),
    updateCampaign: (id, data) => apiClient.patch(`/campaigns/${id}`, data),
    sendCampaign: (id) => apiClient.post(`/campaigns/${id}/send`),
    deleteCampaign: (id) => apiClient.delete(`/campaigns/${id}`),

    // Meetings
    createMeeting: (data) => apiClient.post('/meetings', data),
    getMeetings: (params) => apiClient.get('/meetings', { params }),
    getMeeting: (id) => apiClient.get(`/meetings/${id}`),
    updateMeeting: (id, data) => apiClient.patch(`/meetings/${id}`, data),
    deleteMeeting: (id) => apiClient.delete(`/meetings/${id}`),

    // Analytics
    getDashboardStats: () => apiClient.get('/analytics/dashboard'),
    getCampaignAnalytics: () => apiClient.get('/analytics/campaigns'),
    getMeetingAnalytics: () => apiClient.get('/analytics/meetings'),
    getScrapingAnalytics: () => apiClient.get('/analytics/scraping'),

    // Admin
    getRecruiters: (params) => apiClient.get('/admin/recruiters', { params }),
    getStudents: (params) => apiClient.get('/admin/students', { params }),
    getAdminStats: () => apiClient.get('/admin/stats'),
    exportRecruiters: () => apiClient.post('/admin/export/recruiters'),
    exportStudents: () => apiClient.post('/admin/export/students'),
    deleteRecruiter: (id) => apiClient.delete(`/admin/recruiters/${id}`),
    deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),
};

export default apiClient;
