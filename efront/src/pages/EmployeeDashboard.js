import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Modal, Button, Form } from 'react-bootstrap';

export default function EmployeeDashboard() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', description: '', quantity: '', price: '', image: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get('/items', { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/orders/accepted', { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data);
      setShowTransactions(true);
    } catch (err) {
      alert('Failed to fetch transactions.');
    }
  };

  const toggleNotifications = async () => {
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await axios.post(`/orders/${orderId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Order accepted!');
      fetchNotifications(); // Refresh notifications
      fetchTransactions(); // Refresh transactions if needed
    } catch (err) {
      alert('Failed to accept order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      await axios.post(`/orders/${orderId}/decline`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Order declined!');
      fetchNotifications(); // Refresh notifications
      fetchTransactions(); // Refresh transactions if needed
    } catch (err) {
      alert('Failed to decline order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (let key in form) {
      formData.append(key, form[key]);
    }
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };
      if (form.id) {
        await axios.post(`/items/${form.id}?_method=PUT`, formData, config);
      } else {
        await axios.post('/items', formData, config);
      }
      setForm({ id: null, name: '', description: '', quantity: '', price: '', image: null });
      setPreviewImage(null);
      fetchItems();
      setShowModal(false);
    } catch (err) {
      alert('Failed to save item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditItem = (item) => {
    setForm({ id: item.id, name: item.name, description: item.description, quantity: item.quantity, price: item.price, image: null });
    setPreviewImage(item.image ? `http://localhost:8000/storage/${item.image}` : null);
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchItems();
      } catch (err) {
        alert('Failed to delete item: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [fetchItems, user]);

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <h2>Employee Dashboard</h2>
        <div className="d-flex gap-2">
          <button onClick={toggleNotifications} className="btn btn-primary">
            🔔 Notifications {notifications.length > 0 && `(${notifications.length})`}
          </button>
          <button onClick={fetchTransactions} className="btn btn-info">
            Transactions
          </button>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>

      {showNotifications && (
        <div className="mb-4 p-3 border rounded bg-light">
          <h5>Order Notifications</h5>
          {notifications.length === 0 ? (
            <p>No notifications available.</p>
          ) : (
            notifications.map((notification, idx) => (
              <div key={idx} className="border p-2 mb-2 bg-white rounded">
                <p><strong>Ordered by:</strong> {notification.data.customer_name}</p>
                <p><strong>Item:</strong> {notification.data.item_name}</p>
                <p><strong>Quantity:</strong> {notification.data.quantity}</p>
                <p><strong>Status:</strong> {notification.data.status}</p>

                {notification.data.status === 'pending' && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={() => handleAcceptOrder(notification.data.order_id, notification.id)}>Accept</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDeclineOrder(notification.data.order_id, notification.id)}>Decline</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showTransactions && (
        <div className="mt-4 p-3 border rounded bg-light">
          <h5>Accepted Orders</h5>
          {transactions.length === 0 ? (
            <p>No accepted orders yet.</p>
          ) : (
            transactions.map((order) => (
              <div key={order.id} className="border p-2 mb-2 bg-white rounded">
                <p><strong>Item:</strong> {order.item?.name}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <button
            onClick={() => {
              setForm({ id: null, name: '', description: '', quantity: '', price: '', image: null });
              setPreviewImage(null);
              setShowModal(true);
            }}
            className="btn btn-success w-100"
          >
            Add Item
          </button>
        </div>
        <div className="col-md-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="form-control"
          />
        </div>
      </div>

      <div className="row g-4">
        {filteredItems.map((item) => (
          <div className="col-md-6 col-lg-4" key={item.id}>
            <div className="card h-100 shadow-sm">
              <img
                src={item.image ? `http://localhost:8000/storage/${item.image}` : 'https://via.placeholder.com/150'}
                alt={item.name}
                className="card-img-top object-fit-cover"
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">{item.description}</p>
                <p className="card-text text-muted">Quantity: {item.quantity}</p>
                <p className="card-text text-muted">Price: ${item.price}</p>
                <div className="d-flex justify-content-end gap-2">
                  <button onClick={() => handleEditItem(item)} className="btn btn-warning btn-sm">Edit</button>
                  <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit Item */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? 'Edit Item' : 'Create Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Description"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formQuantity">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleInputChange}
                placeholder="Quantity"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="Price"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formImage">
              <Form.Label>Image</Form.Label>
              <Form.Control
                type="file"
                name="image"
                onChange={handleImageChange}
              />
            </Form.Group>
            {previewImage && (
              <div className="mb-3">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="img-thumbnail"
                  style={{ height: '150px', objectFit: 'cover' }}
                />
              </div>
            )}
            <Button variant="primary" type="submit">
              Save Item
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
