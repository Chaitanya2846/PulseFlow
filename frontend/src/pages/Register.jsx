import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Building, UserPlus, KeyRound, CheckCircle } from 'lucide-react';

export default function Register() {
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' or 'receptionist'
  const [formData, setFormData] = useState({
    clinicName: '', doctorName: '', 
    clinicCode: '', receptionistName: '', 
    username: '', password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = activeTab === 'doctor' ? '/register/doctor' : '/register/receptionist';
    
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (activeTab === 'doctor') {
          // Show the generated code to the doctor
          setGeneratedCode(data.clinicCode);
        } else {
          // Receptionist successfully joined, send to login
          alert("Joined clinic successfully! You can now log in.");
          navigate('/login');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  // SUCCESS SCREEN FOR DOCTORS
  if (generatedCode) {
    return (
      <div className="min-h-screen bg-[#b3ffb3] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-lg w-full text-center">
          <CheckCircle className="w-24 h-24 stroke-[3px] mx-auto mb-6 text-[#2eb82e]" />
          <h1 className="text-4xl font-black uppercase tracking-widest mb-4">Clinic Created</h1>
          <p className="font-bold text-gray-600 mb-8">Share this unique code with your receptionists so they can join your clinic's queue system.</p>
          
          <div className="bg-[#ffe600] border-4 border-black p-6 mb-8">
            <p className="text-sm font-black uppercase tracking-widest mb-2">Your Clinic Code</p>
            <p className="text-5xl font-black tracking-tighter">{generatedCode}</p>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-black text-white border-4 border-black py-4 text-2xl font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
  return (
    <div className="min-h-screen bg-[#f4f4f0] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-2xl w-full">
        
        <div className="text-center mb-8 border-b-4 border-black pb-8">
          <Activity className="w-16 h-16 stroke-[3px] mx-auto mb-4" />
          <h1 className="text-4xl font-black uppercase tracking-widest mb-2">PulseFlow</h1>
          <p className="font-bold text-gray-500 uppercase tracking-widest">Platform Onboarding</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-4 border-black mb-8">
          <button 
            type="button"
            onClick={() => { setActiveTab('doctor'); setError(''); }}
            className={`flex-1 py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'doctor' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Building className="w-5 h-5" /> Create Clinic
          </button>
          <div className="w-1 bg-black"></div>
          <button 
            type="button"
            onClick={() => { setActiveTab('receptionist'); setError(''); }}
            className={`flex-1 py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'receptionist' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <UserPlus className="w-5 h-5" /> Join Clinic
          </button>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          
          {/* DYNAMIC FIELDS BASED ON TAB */}
          {activeTab === 'doctor' ? (
            <>
              <div className="bg-[#e6f2ff] border-4 border-black p-6 mb-2">
                <p className="font-bold text-[#0066cc] uppercase tracking-widest mb-4">Doctor Details</p>
                <input 
                  type="text" name="clinicName" value={formData.clinicName} onChange={handleChange}
                  placeholder="CLINIC NAME (e.g. Smile Care)"
                  className="w-full bg-white border-4 border-black p-4 text-xl font-bold mb-4 focus:outline-none" required
                />
                <input 
                  type="text" name="doctorName" value={formData.doctorName} onChange={handleChange}
                  placeholder="DOCTOR NAME (e.g. Dr. Sharma)"
                  className="w-full bg-white border-4 border-black p-4 text-xl font-bold focus:outline-none" required
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#ffe6e6] border-4 border-black p-6 mb-2">
                <p className="font-bold text-[#cc0000] uppercase tracking-widest mb-4 flex items-center gap-2"><KeyRound/> Authorization</p>
                <input 
                  type="text" name="clinicCode" value={formData.clinicCode} onChange={handleChange}
                  placeholder="ENTER CLINIC CODE (e.g. SC-7X4K92)"
                  className="w-full bg-white border-4 border-black p-4 text-xl font-black uppercase focus:outline-none" required
                />
                <input 
                  type="text" name="receptionistName" value={formData.receptionistName} onChange={handleChange}
                  placeholder="YOUR NAME (e.g. Priya)"
                  className="w-full bg-white border-4 border-black p-4 text-xl font-bold mt-4 focus:outline-none" required
                />
              </div>
            </>
          )}

          {/* COMMON CREDENTIAL FIELDS */}
          <div className="flex gap-4">
            <input 
              type="text" name="username" value={formData.username} onChange={handleChange}
              placeholder="USERNAME"
              className="w-full bg-gray-100 border-4 border-black p-4 text-xl font-bold focus:outline-none focus:bg-[#ffffb3]" required
            />
            <input 
              type="password" name="password" value={formData.password} onChange={handleChange}
              placeholder="PASSWORD"
              className="w-full bg-gray-100 border-4 border-black p-4 text-xl font-bold focus:outline-none focus:bg-[#ffffb3]" required
            />
          </div>
          
          {error && <p className="text-[#ff4d4d] font-bold uppercase text-center">{error}</p>}

          <button type="submit" disabled={isLoading} className="bg-black text-white border-4 border-black py-4 text-2xl font-black uppercase tracking-wider hover:bg-gray-800 transition-colors mt-2">
            {isLoading ? 'Processing...' : (activeTab === 'doctor' ? 'Create Clinic' : 'Join Staff')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="font-bold text-gray-500 uppercase hover:text-black hover:underline">
            Already registered? Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}