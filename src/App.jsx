import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import SmartUpload from './pages/SmartUpload';
import MyHub from './pages/MyHub';

function App() {
  return (
    <Router>
      <div className="page-container">
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/sell" element={<SmartUpload />} />
            <Route path="/myhub" element={<MyHub />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
