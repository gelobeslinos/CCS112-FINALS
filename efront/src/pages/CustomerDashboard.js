import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function CustomerDashboard() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(true);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/items-for-sale', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch items:', err.response?.data || err.message);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await axios.get('/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err.response?.data || err.message);
      }
    };

    fetchItems();
    fetchOrders();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleAddToCart = (item) => {
    const alreadyInCart = cartItems.find(cart => cart.id === item.id);
    if (!alreadyInCart) {
      setCartItems([...cartItems, item]);
      alert(`"${item.name}" added to your cart.`);
    } else {
      alert(`"${item.name}" is already in your cart.`);
    }
  };

  const handleBuy = async (item) => {
    if (!item || !item.name) {
      alert('Invalid item selected.');
      return;
    }

    const quantity = prompt(`Enter quantity to buy (Available: ${item.quantity}):`);
    if (!quantity || isNaN(quantity) || quantity <= 0) return;

    try {
      await axios.post(
        '/buy-item',
        { item_id: item.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order placed! Awaiting employee approval.');

      setCartItems(cartItems.filter(cartItem => cartItem.id !== item.id));

      const res = await axios.get('/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      alert(`Failed to place order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleReceived = async (orderId) => {
    try {
      await axios.post(
        `/mark-received/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order marked as received!');
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'received' } : order
        )
      );
    } catch (err) {
      alert(`Failed to mark as received: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>🛍️ Customer Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-secondary" onClick={() => setShowCart(true)}>
          🛒 Your Cart ({cartItems.length})
        </button>
        <button className="btn btn-info" onClick={() => setShowCart(false)}>
          📦 Your Orders ({orders.length})
        </button>
      </div>

      {/* Orders Section */}
      {!showCart && (
        <div className="card mb-4 p-3">
          <h5>📦 Your Orders:</h5>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul className="list-group">
              {orders.map(order => (
                <li key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                  <strong>Item: {order.item?.name || 'Unknown'}</strong>
                  <br />
                    Quantity: {order.quantity}<br />
                    Status:{' '}
                    <span className={
                      order.status === 'pending' ? 'badge bg-warning' :
                      order.status === 'accepted' ? 'badge bg-success' :
                      order.status === 'declined' ? 'badge bg-danger' :
                      order.status === 'received' ? 'badge bg-secondary' :
                      'badge bg-light text-dark'
                    }>
                      {order.status}
                    </span>
                  </div>
                  {order.status === 'accepted' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleReceived(order.id)}>
                      Received
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Cart Section */}
      {showCart && (
        <div className="card mb-4 p-3">
          <h5>🛒 Cart Items:</h5>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="list-group">
              {cartItems.map(item => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={item.id}>
                  <div>
                    <strong>{item.name}</strong> - ${item.price}
                  </div>
                  <button className="btn btn-sm btn-success" onClick={() => handleBuy(item)}>
                    Buy
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="form-control"
        />
      </div>

      {/* Item cards */}
      <div className="row g-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 shadow-sm">
                <img
                  src={item.image ? `http://localhost:8000/storage/${item.image}` : 'https://via.placeholder.com/150'}
                  alt={item.name || 'No image available'}
                  className="card-img-top"
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{item.name || 'Unknown Item'}</h5>
                  <p className="card-text">{item.description || 'No description available'}</p>
                  <p className="card-text text-muted">Quantity: {item.quantity}</p>
                  <p className="card-text text-muted">Price: ${item.price}</p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => handleAddToCart(item)}>
                      Add to Cart
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => handleBuy(item)}>
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No items found</p>
        )}
      </div>
    </div>
  );
}
