import React, { useEffect, useState } from 'react';
import { Users, Folder, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import ProjectProfitability from '../components/dashboard/ProjectProfitability';
import OutstandingInvoices from '../components/dashboard/OutstandingInvoices';
import { api } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, projectsData, invoicesData] = await Promise.all([
          api.clients.getAll(),
          api.projects.getAll(),
          api.invoices.getAll()
        ]);

        // Calculate Stats
        const totalClients = clientsData.length;
        const activeClients = clientsData.filter(c => c.status === 'Active').length;

        const runningProjects = projectsData.filter(p => p.status === 'Ongoing' || p.status === 'In Progress').length;
        const notStartedProjects = projectsData.filter(p => p.status === 'Planned' || p.status === 'Not Started').length;
        const completedProjects = projectsData.filter(p => p.status === 'Completed').length;

        const outstandingInvoicesList = invoicesData.filter(i => i.status === 'pending' || i.status === 'overdue');
        const outstandingInvoicesCount = outstandingInvoicesList.length;
        const outstandingInvoicesAmount = outstandingInvoicesList.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

        setStats({
          totalClients,
          activeClients,
          runningProjects,
          notStartedProjects,
          completedProjects,
          outstandingInvoicesCount,
          outstandingInvoicesAmount
        });

        // Calculate Profitability
        const profData = projectsData
          .map(p => ({
            id: p.id,
            name: p.name,
            income: Number(p.income) || 0,
            expense: Number(p.expense) || 0,
            profit: (Number(p.income) || 0) - (Number(p.expense) || 0)
          }))
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5);
        setProfitabilityData(profData);

        // Get Outstanding Invoices for List
        setInvoices(outstandingInvoicesList.slice(0, 5));

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  if (!stats) {
    return <div className="dashboard-error">Failed to load dashboard data. Please try again.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* KPI Section */}
      <div className="kpi-grid">
        <KPICard
          label="Total Clients"
          value={stats.totalClients}
          subValue={`${stats.activeClients} Active`}
          icon={Users}
        />
        <KPICard
          label="Running Projects"
          value={stats.runningProjects}
          subValue={`${stats.notStartedProjects} Planned`}
          icon={Folder}
        />
        <KPICard
          label="Completed Projects"
          value={stats.completedProjects}
          icon={CheckCircle}
        />
        <KPICard
          label="Outstanding Invoices"
          value={`₹${(stats.outstandingInvoicesAmount / 1000).toFixed(1)}k`}
          subValue={`${stats.outstandingInvoicesCount} Pending`}
          icon={AlertCircle}
          className="highlight-card"
        />
      </div>

      {/* Analytics Section */}
      <div className="analytics-grid">
        <div className="analytics-main">
          <ProjectProfitability data={profitabilityData} />
        </div>
        <div className="analytics-side">
          <OutstandingInvoices invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
