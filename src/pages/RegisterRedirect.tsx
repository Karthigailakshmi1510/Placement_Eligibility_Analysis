import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * /register - redirects to the right place so "registration link" doesn't show 404.
 * Students -> dashboard; not logged in -> student login; admin -> home.
 */
const RegisterRedirect = () => {
  const { userRole, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (userRole === 'student') return <Navigate to="/student" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/student-login" replace />;
};

export default RegisterRedirect;
