import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import CustomizePage from './pages/CustomizePage';
import StickerMakerPage from './pages/StickerMakerPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

const pageTransition = {
  initial: { opacity: 0, y: 14, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.995 },
};

function TransitionPage({ children }) {
  return (
    <motion.div
      className="route-transition"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<TransitionPage><LandingPage /></TransitionPage>} />
        <Route path="/products" element={<TransitionPage><ProductsPage /></TransitionPage>} />
        <Route path="/customize" element={<TransitionPage><ProtectedRoute><CustomizePage /></ProtectedRoute></TransitionPage>} />
        <Route path="/sticker-maker" element={<TransitionPage><ProtectedRoute><StickerMakerPage /></ProtectedRoute></TransitionPage>} />
        <Route path="/cart" element={<TransitionPage><ProtectedRoute><CartPage /></ProtectedRoute></TransitionPage>} />
        <Route path="/checkout" element={<TransitionPage><ProtectedRoute><CheckoutPage /></ProtectedRoute></TransitionPage>} />
        <Route path="/profile" element={<TransitionPage><ProtectedRoute><ProfilePage /></ProtectedRoute></TransitionPage>} />
        <Route path="/contact" element={<TransitionPage><ContactPage /></TransitionPage>} />
        <Route path="/help" element={<TransitionPage><HelpPage /></TransitionPage>} />
        <Route path="/admin" element={<TransitionPage><ProtectedRoute><AdminPage /></ProtectedRoute></TransitionPage>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
