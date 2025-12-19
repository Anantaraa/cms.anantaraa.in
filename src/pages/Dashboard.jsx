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
        const [clientsData, projectsData, invoicesData, incomeData, expenseData] = await Promise.all([
          api.clients.getAll(),
          api.projects.getAll(),
          api.invoices.getAll(),
          api.income.getAll(),
          api.expenses.getAll()
        ]);

        // Calculate Stats
        const totalClients = clientsData.length;
        const activeClients = clientsData.filter(c => c.status === 'active' || c.status === 'Active').length;

        const runningProjects = projectsData.filter(p => {
          const status = p.status?.toLowerCase();
          return status === 'ongoing' || status === 'in progress';
        }).length;

        const notStartedProjects = projectsData.filter(p => {
          const status = p.status?.toLowerCase();
          return status === 'planned' || status === 'not started';
        }).length;

        const completedProjects = projectsData.filter(p => {
          const status = p.status?.toLowerCase();
          return status === 'completed';
        }).length;

        const outstandingInvoicesList = invoicesData.filter(i => {
          const status = i.status?.toLowerCase();
          return status === 'pending' || status === 'overdue' || status === 'sent' || status === 'draft';
        });
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

        // Calculate Profitability from real income and expense data
        const profitabilityByProject = projectsData.map(project => {
          // Sum all income for this project
          const projectIncome = incomeData
            .filter(inc => inc.projectId === project.id || inc.project_id === project.id)
            .reduce((sum, inc) => sum + (Number(inc.amount) || Number(inc.amountReceived) || 0), 0);

          // Sum all expenses for this project
          const projectExpense = expenseData
            .filter(exp => exp.projectId === project.id || exp.project_id === project.id)
            .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

          return {
            id: project.id,
            name: project.name,
            income: projectIncome,
            expense: projectExpense,
            profit: projectIncome - projectExpense
          };
        });

        // Sort by profit and take top 5
        const topProfitableProjects = profitabilityByProject
          .filter(p => p.income > 0 || p.expense > 0) // Only show projects with financial activity
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5);

        setProfitabilityData(topProfitableProjects);

        // Get Outstanding Invoices for List (top 5 most urgent)
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
