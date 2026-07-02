import { useState, useEffect } from 'react';
import { Package, User as UserIcon, LogOut, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [deletingDesignId, setDeletingDesignId] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchOrders();
    fetchDesigns();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/orders`, {
        withCredentials: true,
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/designs`, {
        withCredentials: true,
      });
      setDesigns(response.data);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  const handleDeleteDesign = async (designId) => {
    if (!designId) return;

    const confirmed = window.confirm('Delete this design permanently? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingDesignId(designId);
    try {
      await axios.delete(`${BACKEND_URL}/api/designs/${designId}`, {
        withCredentials: true,
      });

      setDesigns((prev) => prev.filter((d) => d.design_id !== designId));
    } catch (error) {
      console.error('Error deleting design:', error);
      alert(error?.response?.data?.detail || 'Failed to delete design. Please try again.');
    } finally {
      setDeletingDesignId('');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId) return;

    const confirmed = window.confirm('Delete this order from your history?');
    if (!confirmed) return;

    setDeletingOrderId(orderId);
    try {
      await axios.delete(`${BACKEND_URL}/api/orders/${orderId}`, {
        withCredentials: true,
      });
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      if (error?.response?.status === 404) {
        setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
        alert('Order already removed. Refreshed your list.');
      } else {
        alert(error?.response?.data?.detail || 'Failed to delete order. Please try again.');
      }
    } finally {
      setDeletingOrderId('');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />

      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-6">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-indigo-600" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" data-testid="profile-name">
                  {user?.name}
                </h1>
                <p className="text-slate-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 font-bold transition-colors flex items-center gap-2"
                data-testid="profile-logout-button"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              data-testid="orders-tab"
            >
              My Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('designs')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'designs' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              data-testid="designs-tab"
            >
              My Designs ({designs.length})
            </button>
          </div>

          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.order_id} className="glass rounded-2xl p-6" data-testid={`order-${order.order_id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">Order #{order.order_id}</h3>
                        <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full font-medium ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-700'
                            : order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-600 mb-2">{order.items.length} item(s)</p>
                      <p className="text-xl font-bold text-indigo-600 mb-3">Total: Rs.{order.total_amount}</p>
                      <button
                        onClick={() => handleDeleteOrder(order.order_id)}
                        disabled={deletingOrderId === order.order_id}
                        className="rounded-full bg-red-100 text-red-700 px-4 py-2 font-bold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        data-testid={`delete-order-${order.order_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingOrderId === order.order_id ? 'Deleting...' : 'Delete Order'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.length === 0 ? (
                <div className="col-span-full glass rounded-2xl p-12 text-center">
                  <p className="text-slate-600">No saved designs yet</p>
                </div>
              ) : (
                designs.map((design) => (
                  <div key={design.design_id} className="glass rounded-2xl p-4 hover:shadow-xl transition-shadow" data-testid={`design-${design.design_id}`}>
                    <div className="aspect-square rounded-xl mb-4" style={{ backgroundColor: design.product_color }} />
                    <h3 className="font-bold mb-2">{design.product_id}</h3>
                    <p className="text-sm text-slate-600 mb-4">{new Date(design.created_at).toLocaleDateString()}</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate('/customize', { state: { design } })}
                        className="w-full rounded-full bg-indigo-600 text-white px-4 py-2 font-bold hover:bg-indigo-700 transition-colors"
                      >
                        Edit Design
                      </button>
                      <button
                        onClick={() => handleDeleteDesign(design.design_id)}
                        disabled={deletingDesignId === design.design_id}
                        className="w-full rounded-full bg-red-100 text-red-700 px-4 py-2 font-bold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        data-testid={`delete-design-${design.design_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingDesignId === design.design_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
