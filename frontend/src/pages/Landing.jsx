import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Users, ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      
      {/* NAVIGATION */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-blue-600">
          <Activity className="w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight">PulseFlow</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/receptionist/login')}
            className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2 transition-colors"
          >
            Staff Login
          </button>
          <button 
            onClick={() => navigate('/doctor/login')}
            className="bg-white text-blue-600 border border-blue-200 shadow-sm hover:shadow-md px-5 py-2 rounded-lg font-medium transition-all"
          >
            Doctor Login
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Queue Management
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          Wait less. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Care more.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          The intelligent, real-time queueing system that eliminates crowded waiting rooms and keeps patients informed directly on their phones.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/doctor/register')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          >
            Register Clinic <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const trackingId = window.prompt("Enter your Tracking ID (e.g., PF-1234):");
              if (trackingId) navigate(`/track/${trackingId}`);
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-semibold text-lg shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            Track Token
          </button>
        </div>
      </main>

      {/* FEATURES GRID */}
      <section className="bg-white border-t border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for modern clinics</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to streamline patient flow and reduce administrative anxiety.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Smartphone />}
              title="Live Patient Tracking"
              desc="Patients receive a secure link to track their exact place in line and estimated wait time from their phone."
            />
            <FeatureCard 
              icon={<Users />}
              title="Role-Based Dashboards"
              desc="Isolated controls for Doctors and Receptionists to ensure data privacy and prevent workflow collisions."
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Multi-Tenant Architecture"
              desc="Bank-grade isolation ensures that your clinic's queue data never overlaps with another facility."
            />
          </div>
        </div>
      </section>

    </div>
  );
}

// Reusable UI Component for the Features
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}