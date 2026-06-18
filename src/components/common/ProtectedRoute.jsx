import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useUser();
  const location = useLocation();

  if (loading) {
    return <div className="page-state">Đang tải tài khoản...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ signInRequired: true, from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
