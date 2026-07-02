import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, Shirt, Wand2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';

const showcaseCards = [
  { name: 'Classic White Tee', price: 'From Rs.499', image: '/products/classic-tee.jpg' },
  { name: 'Premium Hoodie', price: 'From Rs.1299', image: '/products/premium-hoodie.jpg' },
  { name: 'Oversized Street Tee', price: 'From Rs.699', image: '/products/oversized-tshirt.jpg' },
  { name: 'Long Sleeve Essential', price: 'From Rs.549', image: '/products/long-sleeve-tee.jpg' },
];

const featureCards = [
  { icon: ShieldCheck, title: 'High-Quality Prints', text: 'Sharp colors and durable prints on premium fabrics.' },
  { icon: Truck, title: 'Fast Delivery', text: 'Quick production and reliable shipping across India.' },
  { icon: Wand2, title: 'Easy Customization', text: 'Drag, drop, edit text, and preview in real time.' },
  { icon: Shirt, title: 'Premium Fabric', text: 'Comfort-first fits with fashion-ready silhouettes.' },
];

function LandingPage() {
  return (
    <div className="fashion-page">
      <Navbar />

      <section className="hero-banner">
        <img src="/desire-logo.jpg?v=1" alt="Desire Collection" className="hero-banner__bg" />
        <div className="hero-banner__overlay" />
        <div className="hero-banner__content">
          <p className="hero-eyebrow">Premium Custom Studio</p>
          <h1>Design Your Own T-Shirt<br />Wear Your Style</h1>
          <p>
            Build premium streetwear in minutes. Add text, upload art, place stickers, and preview your final design instantly.
          </p>
          <div className="hero-cta-row">
            <Link to="/customize" className="cta-primary">Start Customizing</Link>
            <Link to="/products" className="cta-secondary">Browse Designs</Link>
          </div>
        </div>

        <Link to="/customize" className="floating-customize">
          <Sparkles className="h-4 w-4" /> Customize Now
        </Link>
      </section>

      <section className="fashion-section shell">
        <div className="section-head">
          <h2>Most Popular Templates</h2>
          <p>Pick a base design and customize everything from color to graphics.</p>
        </div>

        <div className="product-grid">
          {showcaseCards.map((item) => (
            <article key={item.name} className="product-card">
              <img src={item.image} alt={item.name} />
              <div className="product-card__body">
                <h3>{item.name}</h3>
                <p>{item.price}</p>
                <Link to="/customize" className="product-card__btn">Customize</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fashion-section shell">
        <div className="feature-grid">
          {featureCards.map((item) => (
            <article key={item.title} className="feature-card">
              <item.icon className="h-6 w-6" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band shell">
        <div>
          <h2>Create Your Unique T-Shirt Today</h2>
          <p>Minimal setup. Maximum creativity. Start now and turn your idea into wearable style.</p>
        </div>
        <Link to="/customize" className="cta-primary">Customize Now</Link>
      </section>

      <SiteFooter />
    </div>
  );
}

export default LandingPage;


