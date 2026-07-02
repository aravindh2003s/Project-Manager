import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL, clearDemoSession, getDemoSession } from '../lib/api';
import AuthModal from './AuthModal';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user && !user.is_demo) {
      fetchCartCount();
    }
  }, [user]);

  const checkAuth = async () => {
    const demoUser = getDemoSession();
    if (demoUser) {
      setUser(demoUser);
      setCartCount(0);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cart`, {
        withCredentials: true,
      });
      setCartCount(response.data.length);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    navigate('/customize');
  };

  const handleLogout = async () => {
    try {
      if (user?.is_demo) {
        clearDemoSession();
      } else {
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          {
            withCredentials: true,
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearDemoSession();
      setUser(null);
      setCartCount(0);
      navigate('/');
    }
  };

  const navItems = [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'customize', label: 'Customize', path: '/customize' },
    { key: 'sticker-maker', label: 'Sticker Maker', path: '/sticker-maker' },
    { key: 'shop', label: 'Shop', path: '/products' },
    { key: 'about', label: 'About', path: '/help' },
    { key: 'contact', label: 'Contact', path: '/contact' },
  ];

  const isHome = location.pathname === '/';
  const navClass = `fashion-nav ${isHome && !isScrolled ? 'fashion-nav--hero' : 'fashion-nav--solid'}`;

  return (
    <>
      <nav className={navClass}>
        <div className="fashion-nav__inner">
          <div className="fashion-nav__left hidden md:flex">
            {navItems.map((item) => (
              <Link key={item.key} to={item.path} className="fashion-nav__link">
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/" className="fashion-nav__brand" aria-label="Desire Collection Home">
            Desire Collection
          </Link>

          <div className="fashion-nav__right hidden md:flex">
            <button className="icon-btn" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
            {user ? (
              <>
                <Link to="/profile" className="icon-btn" aria-label="Profile">
                  {user.picture ? <img src={user.picture} alt={user.name} className="h-7 w-7 rounded-full" /> : <User className="h-4 w-4" />}
                </Link>
                <Link to="/cart" className="icon-btn relative" data-testid="cart-button" aria-label="Cart">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="fashion-badge" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="fashion-nav__auth">Logout</button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="fashion-nav__auth" data-testid="login-button">
                Sign In
              </button>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden icon-btn" aria-label="menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="fashion-mobile-menu md:hidden">
            {navItems.map((item) => (
              <Link key={item.key} to={item.path} onClick={() => setIsMenuOpen(false)} className="fashion-mobile-link">
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="fashion-mobile-link">Profile</Link>
                <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="fashion-mobile-link">Cart ({cartCount})</Link>
                <button onClick={handleLogout} className="fashion-mobile-link text-left">Logout</button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }} className="fashion-mobile-link text-left">Sign In</button>
            )}
          </div>
        )}
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
    </>
  );
}

export default Navbar;

