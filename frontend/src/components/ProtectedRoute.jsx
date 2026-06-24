import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  // Check the browser's local memory for the digital ID badge
  const token = localStorage.getItem('pulseflow_token');
  const role = localStorage.getItem('pulseflow_role'); 

  // 1. If they have no token at all, kick them out to the login page
  if (!token) {
    return <Navigate to={`/${allowedRole}/login`} replace />;
  }

  // 2. If a Receptionist tries to access the Doctor URL, redirect them to their own dashboard
  if (role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  // 3. They are authenticated and have the right role. Let them in!
  return children;
}