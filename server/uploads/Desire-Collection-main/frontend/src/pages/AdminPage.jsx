import { useState, useEffect } from 'react';
import { Users, Package, MessageSquare, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';


function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    fetchAdminData();
  }, []);
  
  const fetchAdminData = async () => {
    try {
      const [ordersRes, usersRes, messagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/orders`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/messages`, { withCredentials: true })
      ]);
      
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 403) {
        alert('Admin access required');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen theme-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  
  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />
      
      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" data-testid="admin-title">Admin Dashboard</h1>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-indigo-100 rounded-xl p-3">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-pink-100 rounded-xl p-3">
                  <Package className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-amber-100 rounded-xl p-3">
                  <Users className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-green-100 rounded-xl p-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Messages</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            {['overview', 'orders', 'users', 'messages'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-bold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Content */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.order_id} className="glass rounded-2xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold mb-1">Order #{order.order_id}</h3>
                      <p className="text-sm text-slate-600">User: {order.user_id}</p>
                      <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                        {order.status}
                      </span>
                      <p className="text-xl font-bold text-indigo-600 mt-2">₹{order.total_amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.user_id} className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.message_id} className="glass rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold mb-1">{msg.name}</h3>
                      <p className="text-sm text-slate-600">{msg.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      msg.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      msg.status === 'read' ? 'bg-slate-100 text-slate-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-2">{msg.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Quick Overview</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Recent Orders</h3>
                  <div className="space-y-2">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.order_id} className="flex justify-between py-2 border-b border-slate-200">
                        <span className="text-sm">#{order.order_id}</span>
                        <span className="text-sm font-medium">₹{order.total_amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-bold mb-2">New Messages</h3>
                  <div className="space-y-2">
                    {messages.filter(m => m.status === 'new').slice(0, 5).map(msg => (
                      <div key={msg.message_id} className="py-2 border-b border-slate-200">
                        <p className="text-sm font-medium">{msg.name}</p>
                        <p className="text-xs text-slate-600 truncate">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;

