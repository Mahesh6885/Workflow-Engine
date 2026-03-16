import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import WorkflowBuilder from './pages/WorkflowBuilder';
import Monitor from './pages/Monitor';
import ApprovalCenter from './pages/ApprovalCenter';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import api from './api';

function App() {
  const { isAuthenticated, login } = useAuthStore();
  const [loading, setLoading] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      // Auto-login test user for demo
      api.post('/auth/login/', { email: 'admin@example.com', password: 'Admin123!' })
        .then(res => {
          login(res.access, res.user);
        })
        .catch(err => {
          console.error('Failed to auto-login. Have you run seeds?');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, login]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-background text-white">Authenticating...</div>;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workflows" element={<WorkflowList />} />
          <Route path="/workflows/build/:id" element={<WorkflowBuilder />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/approvals" element={<ApprovalCenter />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
