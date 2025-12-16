import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ScrapingMonitor from './pages/ScrapingMonitor';
import CampaignManager from './pages/CampaignManager';
import MeetingScheduler from './pages/MeetingScheduler';
import LeadManager from './pages/LeadManager';
import Analytics from './pages/Analytics';
import PublicBookingPage from './pages/PublicBookingPage';
import ConnectCalendar from './components/ConnectCalendar';
import AdminAvailabilityDashboard from './pages/AdminAvailabilityDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/scraping" element={<ScrapingMonitor />} />
      <Route path="/admin/campaigns" element={<CampaignManager />} />
      <Route path="/admin/meetings" element={<MeetingScheduler />} />
      <Route path="/admin/leads" element={<LeadManager />} />
      <Route path="/admin/analytics" element={<Analytics />} />
      <Route path="/admin/availability" element={<AdminAvailabilityDashboard />} />
      <Route path="/book/:recruiterId" element={<PublicBookingPage />} />
      <Route path="/dashboard/:recruiterId" element={<ConnectCalendar />} />
    </Routes>
  );
}

export default App;
