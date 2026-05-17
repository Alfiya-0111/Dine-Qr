import React, { useState, useEffect } from 'react';
import { ref as rtdbRef, onValue, update, remove, push, set } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function WhatsAppOrders() {
  const [orders, setOrders] = useState([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerPhone: '',
    customerName: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });
    console.log("WhatsApp handler triggered");
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const whatsappRef = rtdbRef(realtimeDB, `whatsappOrders/${user.uid}`);
    
    const unsubscribe = onValue(whatsappRef, (snapshot) => {
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

  const addWhatsAppOrder = async () => {
    const user = auth.currentUser;
    const orderRef = push(rtdbRef(realtimeDB, `whatsappOrders/${user.uid}`));
    
    await set(orderRef, {
      ...newOrder,
      restaurantId: user.uid,
      status: 'new',
      createdAt: Date.now(),
      source: 'whatsapp'
    });

    // Also add to kitchen
    await set(rtdbRef(realtimeDB, `kitchenOrders/${user.uid}/${orderRef.key}`), {
      ...newOrder,
      restaurantId: user.uid,
      status: 'pending',
      type: 'whatsapp',
      createdAt: Date.now()
    });

    setShowNewOrderModal(false);
    setNewOrder({ customerPhone: '', customerName: '', items: [{ name: '', quantity: 1, price: 0 }] });
  };

  const confirmOrder = async (orderId) => {
    const user = auth.currentUser;
    await update(rtdbRef(realtimeDB, `whatsappOrders/${user.uid}/${orderId}`), {
      status: 'confirmed',
      confirmedAt: Date.now()
    });
  };

  const sendWhatsAppMessage = (phone, message) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">💬 WhatsApp Orders</h1>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            + New WhatsApp Order
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{order.customerName || 'Unknown'}</h3>
                  <p className="text-gray-500 text-sm">📱 {order.customerPhone}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'new' ? 'bg-red-100 text-red-800' :
                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {order.status === 'new' && (
                  <>
                    <button
                      onClick={() => confirmOrder(order.id)}
                      className="flex-1 py-2 bg-[#8A244B] text-white rounded-lg hover:bg-[#f18e49]"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => sendWhatsAppMessage(order.customerPhone, `Hi ${order.customerName}, your order has been received! Total: ₹${order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}. We'll start preparing soon.`)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      📱
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => sendWhatsAppMessage(order.customerPhone, `Hi ${order.customerName}, your order is ready for pickup/delivery!`)}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Send Ready Message
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p>No WhatsApp orders yet</p>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">New WhatsApp Order</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Phone (+91...)"
                value={newOrder.customerPhone}
                onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Customer Name"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              
              <div className="space-y-2">
                <h4 className="font-medium">Items:</h4>
                {newOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => {
                        const items = [...newOrder.items];
                        items[idx].name = e.target.value;
                        setNewOrder({...newOrder, items});
                      }}
                      className="flex-1 p-2 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const items = [...newOrder.items];
                        items[idx].quantity = parseInt(e.target.value);
                        setNewOrder({...newOrder, items});
                      }}
                      className="w-20 p-2 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => {
                        const items = [...newOrder.items];
                        items[idx].price = parseInt(e.target.value);
                        setNewOrder({...newOrder, items});
                      }}
                      className="w-24 p-2 border rounded"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setNewOrder({
                    ...newOrder, 
                    items: [...newOrder.items, { name: '', quantity: 1, price: 0 }]
                  })}
                  className="text-blue-600 text-sm"
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="flex-1 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addWhatsAppOrder}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg"
              >
                Add Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}