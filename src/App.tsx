import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { checkAndUpdateRoomStatus } from './lib/autoCheckout';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import Bookings from './pages/Bookings';
import KitchenOrders from './pages/KitchenOrders';
import BarOrders from './pages/BarOrders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Preloader from './components/Preloader';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Preloader />;
  }
  
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check for expired bookings
    checkAndUpdateRoomStatus();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkAndUpdateRoomStatus, 5 * 60 * 1000);

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <PrivateRoute>
                <Rooms />
              </PrivateRoute>
            }
          />
          <Route
            path="/guests"
            element={
              <PrivateRoute>
                <Guests />
              </PrivateRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <PrivateRoute>
                <Bookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/kitchen-orders"
            element={
              <PrivateRoute>
                <KitchenOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/bar-orders"
            element={
              <PrivateRoute>
                <BarOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;