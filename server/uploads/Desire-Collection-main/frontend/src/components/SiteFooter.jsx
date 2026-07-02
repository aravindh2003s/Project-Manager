import { Instagram, Facebook, Twitter } from 'lucide-react';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <h4>Menu</h4>
          <a href="/">Home</a>
          <a href="/customize">Customize</a>
          <a href="/products">Shop</a>
          <a href="/help">About</a>
          <a href="/contact">Contact</a>
        </div>
        <div>
          <h4>Categories</h4>
          <a href="/products">Men</a>
          <a href="/products">Women</a>
          <a href="/products">Oversized</a>
          <a href="/products">Hoodies</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="/help">FAQ</a>
          <a href="/help">Returns</a>
          <a href="/contact">Live Chat</a>
        </div>
        <div>
          <h4>Social Media</h4>
          <a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" /> Instagram</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer"><Facebook className="h-4 w-4" /> Facebook</a>
          <a href="https://x.com" target="_blank" rel="noreferrer"><Twitter className="h-4 w-4" /> Twitter</a>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
