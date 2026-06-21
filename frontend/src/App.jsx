import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// --- PUBLIC & PATIENT PAGES ---
import Landing from './pages/Landing';
import MobileTracking from './pages/MobileTracking';
import WaitingRoom from './pages/WaitingRoom';

// --- AUTHENTICATION PAGES ---
import DoctorRegister from './pages/DoctorRegister';
import DoctorLogin from './pages/DoctorLogin';
import ReceptionistRegister from './pages/ReceptionistRegister';
import ReceptionistLogin from './pages/ReceptionistLogin';

// --- DASHBOARDS ---
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
        <Routes>
          {/* 1. Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* 2. Authentication Routes */}
          <Route path="/doctor/register" element={<DoctorRegister />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/receptionist/register" element={<ReceptionistRegister />} />
          <Route path="/receptionist/login" element={<ReceptionistLogin />} />

          {/* 3. Public Patient Routes */}
          <Route path="/display/:clinicCode" element={<WaitingRoom />} />
          <Route path="/track/:trackingId" element={<MobileTracking />} />

          {/* 4. Secured Dashboard Routes */}
          <Route 
            path="/receptionist/dashboard" 
            element={
              <ProtectedRoute allowedRole="receptionist">
                <ReceptionistDashboard /> 
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/doctor/dashboard" 
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}