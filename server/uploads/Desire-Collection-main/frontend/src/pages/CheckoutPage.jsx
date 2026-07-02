import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User as UserIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';


function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get cart items
      const cartResponse = await axios.get(`${BACKEND_URL}/api/cart`, {
        withCredentials: true
      });
      
      const cartItems = cartResponse.data;
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50; // +50 for shipping
      
      // Create order
      const orderData = {
        items: cartItems,
        total_amount: totalAmount,
        shipping_address: formData
      };
      
      const orderResponse = await axios.post(
        `${BACKEND_URL}/api/orders/create`,
        orderData,
        { withCredentials: true }
      );
      
      // In production, integrate with Razorpay here
      // For now, simulate payment
      await axios.post(
        `${BACKEND_URL}/api/orders/${orderResponse.data.order_id}/verify-payment`,
        { razorpay_payment_id: 'simulated_payment' },
        { withCredentials: true }
      );
      
      alert('Order placed successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />
      
      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" data-testid="checkout-title">Checkout</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Information */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-indigo-600" />
                Shipping Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    data-testid="checkout-name-input"
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
                    data-testid="checkout-email-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    data-testid="checkout-phone-input"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    data-testid="checkout-address-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-indigo-600" />
                Payment Method
              </h2>
              <p className="text-slate-600 mb-4">
                Payment will be processed securely through Razorpay
              </p>
            </div>
            
            {/* Place Order */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-indigo-600 text-white px-8 py-4 font-bold text-lg shadow-lg hover:scale-105 transition-all"
              data-testid="place-order-button"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;

