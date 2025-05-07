import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();            // Clear stored user/token
    navigate('/login');  // Redirect to login
  };

  return (
    <div>
      <h1>Welcome, Customer! Here are the items for sale.</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
