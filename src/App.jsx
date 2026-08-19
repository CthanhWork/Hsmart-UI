import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import AssistantWidget from './components/Chat/AssistantWidget';
import { RealtimeProvider } from './context/RealtimeContext';
import Footer from './components/Layout/Footer';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Admin area is lazy-loaded so its heavy charting deps (recharts) stay out of
// the public bundle and only load when an admin opens /admin.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const OverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const ReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const SystemAccountPage = lazy(() => import('./pages/admin/SystemAccountPage'));
import Chat from './pages/Chat';
import Marketplace from './pages/Marketplace';
import MyHub from './pages/MyHub';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Orders from './pages/Orders';
import PaymentResult from './pages/PaymentResult';
import ProductDetail from './pages/ProductDetail';
import ProductEdit from './pages/ProductEdit';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import SearchResults from './pages/SearchResults';
import SmartUpload from './pages/SmartUpload';
import VerifyEmail from './pages/VerifyEmail';
import Wishlist from './pages/Wishlist';

const protectedPage = (page, adminOnly = false) => (
  <ProtectedRoute adminOnly={adminOnly}>{page}</ProtectedRoute>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const AppShell = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className={isAdmin ? 'page-container is-admin' : 'page-container'}>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? 'app-main app-main--admin' : 'app-main'}>
        <Suspense fallback={isAdmin ? <div className="adm-route-loading">Đang tải khu quản trị…</div> : null}>
        <Routes>
              <Route path="/" element={<Marketplace />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/sell" element={protectedPage(<SmartUpload />)} />
              <Route path="/products/:id/edit" element={protectedPage(<ProductEdit />)} />
              <Route path="/listings" element={protectedPage(<MyHub />)} />
              <Route path="/profile" element={protectedPage(<Profile />)} />
              <Route path="/wishlist" element={protectedPage(<Wishlist />)} />
              <Route path="/orders" element={protectedPage(<Orders />)} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/notifications" element={protectedPage(<Notifications />)} />
              <Route path="/chat" element={protectedPage(<Chat />)} />
              <Route path="/admin" element={protectedPage(<AdminLayout />, true)}>
                <Route index element={<OverviewPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="system-account" element={<SystemAccountPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
              </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!isAdmin && <AssistantWidget />}
      {!isAdmin && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <RealtimeProvider>
        <AppShell />
      </RealtimeProvider>
    </BrowserRouter>
  );
}

export default App;
