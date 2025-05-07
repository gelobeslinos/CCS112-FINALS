import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();            // Clear auth state
    navigate('/login');  // Redirect to login page
  };

  return (
    <div>
      <h1>Welcome, Employee! You can create new items here.</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
