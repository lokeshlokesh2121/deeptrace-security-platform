import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import CampaignsPage from "./pages/CampaignsPage";
import EventsPage from "./pages/EventsPage";
import AuditLogsPage from "./pages/AuditLogsPage";

import ProtectedRoute from "./components/ProtectedRoute";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import CreateEventPage from "./pages/CreateEventPage";

const AppRoutes = () => {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/login" />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <CampaignsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />

      <Route
  path="/campaigns/create"
  element={
    <ProtectedRoute>
      <CreateCampaignPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/events/create"
  element={
    <ProtectedRoute>
      <CreateEventPage />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
};

export default AppRoutes;