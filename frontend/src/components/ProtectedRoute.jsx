import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const currentRole = localStorage.getItem('pulseflow_role');
  const token = localStorage.getItem('pulseflow_token');

  // If no token or role doesn't match, bounce to login
  if (!token || currentRole !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}