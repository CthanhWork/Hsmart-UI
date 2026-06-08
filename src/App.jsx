import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AssistantWidget from './components/Chat/AssistantWidget';
import Footer from './components/Layout/Footer';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import Marketplace from './pages/Marketplace';
import MyHub from './pages/MyHub';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Orders from './pages/Orders';
import ProductDetail from './pages/ProductDetail';
import ProductEdit from './pages/ProductEdit';
import Profile from './pages/Profile';
import SmartUpload from './pages/SmartUpload';
import Wishlist from './pages/Wishlist';

const protectedPage = (page, adminOnly = false) => (
  <ProtectedRoute adminOnly={adminOnly}>{page}</ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <div className="page-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/sell" element={protectedPage(<SmartUpload />)} />
            <Route path="/products/:id/edit" element={protectedPage(<ProductEdit />)} />
            <Route path="/listings" element={protectedPage(<MyHub />)} />
            <Route path="/profile" element={protectedPage(<Profile />)} />
            <Route path="/wishlist" element={protectedPage(<Wishlist />)} />
            <Route path="/orders" element={protectedPage(<Orders />)} />
            <Route path="/notifications" element={protectedPage(<Notifications />)} />
            <Route path="/chat" element={protectedPage(<Chat />)} />
            <Route path="/admin" element={protectedPage(<Admin />, true)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <AssistantWidget />
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
