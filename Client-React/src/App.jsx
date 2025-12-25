import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CsvUploadManager from './pages/CsvUploadManager';
import CampaignManager from './pages/CampaignManager';
import MeetingScheduler from './pages/MeetingScheduler';
import LeadManager from './pages/LeadManager';
import Analytics from './pages/Analytics';
import PublicBookingPage from './pages/PublicBookingPage';
import ConnectCalendar from './components/ConnectCalendar';
import AdminAvailabilityDashboard from './pages/AdminAvailabilityDashboard';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/book/:recruiterId" element={<PublicBookingPage />} />
        <Route path="/dashboard/:recruiterId" element={<ConnectCalendar />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/csv-upload" element={<ProtectedRoute><CsvUploadManager /></ProtectedRoute>} />
        <Route path="/admin/campaigns" element={<ProtectedRoute><CampaignManager /></ProtectedRoute>} />
        <Route path="/admin/meetings" element={<ProtectedRoute><MeetingScheduler /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute><LeadManager /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/admin/availability" element={<ProtectedRoute><AdminAvailabilityDashboard /></ProtectedRoute>} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default App;
