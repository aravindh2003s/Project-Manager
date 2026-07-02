import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';


function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${BACKEND_URL}/api/contact`, formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />
      
      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-slate-600">We'd love to hear from you</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              
              {submitted ? (
                <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl p-6 text-center">
                  <p className="font-bold mb-2">Thank you!</p>
                  <p>We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      data-testid="contact-email-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      data-testid="contact-message-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-indigo-600 text-white px-8 py-3 font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                    data-testid="contact-submit-button"
                  >
                    <Send className="h-5 w-5" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 rounded-xl p-3">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-slate-600">support@vibestitch.com</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-100 rounded-xl p-3">
                    <Phone className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Phone</h3>
                    <p className="text-slate-600">+91 1234 567 890</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 rounded-xl p-3">
                    <MapPin className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Location</h3>
                    <p className="text-slate-600">Mumbai, India</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {['Twitter', 'Instagram', 'Facebook'].map(social => (
                    <a
                      key={social}
                      href="#"
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

