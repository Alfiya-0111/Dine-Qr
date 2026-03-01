import React, { useState, useEffect } from 'react';
import { ref as rtdbRef, onValue, update, remove } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function KitchenLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new'); // new, preparing, ready
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to kitchen orders for this restaurant
    const kitchenRef = rtdbRef(realtimeDB, `kitchenOrders/${user.uid}`);
    
    const unsubscribe = onValue(kitchenRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([id, order]) => ({
          id,
          ...order
        }));
        setOrders(ordersList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    const user = auth.currentUser;
    const orderRef = rtdbRef(realtimeDB, `kitchenOrders/${user.uid}/${orderId}`);
    
    await update(orderRef, {
      status: newStatus,
      updatedAt: Date.now()
    });
  };

  const completeOrder = async (orderId) => {
    const user = auth.currentUser;
    // Move to completed orders or delete
    await remove(rtdbRef(realtimeDB, `kitchenOrders/${user.uid}/${orderId}`));
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'new') return order.status === 'pending';
    if (activeTab === 'preparing') return order.status === 'preparing';
    if (activeTab === 'ready') return order.status === 'ready';
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-red-100 text-red-800 border-red-300';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔥 Kitchen Live Orders</h1>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['new', 'preparing', 'ready'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium capitalize ${
                activeTab === tab 
                  ? 'bg-[#8A244B] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab} ({orders.filter(o => o.status === (tab === 'new' ? 'pending' : tab)).length})
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
              {/* Header */}
              <div className={`p-4 border-b ${getStatusColor(order.status)}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">#{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-sm font-medium capitalize">{order.status}</span>
                </div>
                <div className="text-sm mt-1">
                  {order.type === 'dine-in' ? `🪑 Table ${order.tableNumber}` : 
                   order.type === 'whatsapp' ? `💬 WhatsApp` : '📦 Delivery'}
                </div>
              </div>

              {/* Items */}
              <div className="p-4 max-h-48 overflow-y-auto">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 text-sm ml-2">×{item.quantity}</span>
                    </div>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="font-bold text-lg">₹{order.totalAmount}</span>
                </div>
                
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600"
                    >
                      Start Cooking
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                    >
                      Mark Ready
                    </button>
                  )}
                  
                  {order.status === 'ready' && (
                    <button
                      onClick={() => completeOrder(order.id)}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <p className="text-lg">No {activeTab} orders</p>
          </div>
        )}
      </div>
    </div>
  );
}