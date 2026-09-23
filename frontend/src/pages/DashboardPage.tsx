import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getDashboardMetrics } from "../services/dashboardService";

import "./DashboardPage.css";

interface DashboardData {
  users: number;
  campaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  criticalEvents: number;
  openEvents: number;
  recentActivity: any[];
}

const DashboardPage = () => {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboardMetrics();

      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-state">
          <div className="spinner" />
          <h2>Loading Dashboard...</h2>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="dashboard-state">
          <h2>No Dashboard Data Found</h2>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: data.users,
      to: "/users",
      accent: "accent-blue",
      icon: "◉",
    },
    {
      label: "Total Campaigns",
      value: data.campaigns,
      to: "/campaigns",
      accent: "accent-indigo",
      icon: "◈",
    },
    {
      label: "Active Campaigns",
      value: data.activeCampaigns || 0,
      to: "/campaigns",
      accent: "accent-green",
      icon: "▶",
    },
    {
      label: "Completed Campaigns",
      value: data.completedCampaigns || 0,
      to: "/campaigns",
      accent: "accent-blue",
      icon: "✔",
    },
    {
      label: "Critical Events",
      value: data.criticalEvents,
      to: "/events",
      accent: "accent-red",
      icon: "⚠",
    },
    {
      label: "Open Events",
      value: data.openEvents,
      to: "/events",
      accent: "accent-amber",
      icon: "◔",
    },
  ];

  return (
    <Layout>
      <div className="dashboard">

        <div className="dashboard-header">
          <div>
            <h1>Deep Trace Cybernetics</h1>
            <p>Multi-Tenant Security Management Platform</p>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="profile-info">
              <h3>{user?.name}</h3>
              <span>Role: {user?.role}</span>
              <span>Tenant ID: {user?.tenantId}</span>
            </div>
          </div>
        </div>

        <div className="cards">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`card ${card.accent}`}
            >
              <div className="card-top">
                <span className="card-icon">{card.icon}</span>
                <span className="card-label">{card.label}</span>
              </div>

              <h2 className="card-value">{card.value}</h2>

              <Link to={card.to} className="details-btn">
                View Details
              </Link>
            </div>
          ))}
        </div>

        <div className="activity-section">

          <div className="activity-header">
            <h2>Recent Security Activity</h2>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>

              <tbody>
                {data.recentActivity.length > 0 ? (
                  data.recentActivity.map((log: any) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.entity}</td>
                      <td>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="empty-row">
                      No Activity Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default DashboardPage;