import React, { useEffect, useState } from 'react';
import { Users, Folder, FileText, CheckCircle, AlertCircle, Clock, Calendar, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/dashboard/KPICard';
import ProjectProfitability from '../components/dashboard/ProjectProfitability';
import OutstandingInvoices from '../components/dashboard/OutstandingInvoices';
import RightDrawer from '../components/common/RightDrawer';
import ProjectDetail from './Projects/ProjectDetail';
import ProjectForm from './Projects/ProjectForm';
import ClientDetail from './Clients/ClientDetail';
import ClientForm from './Clients/ClientForm';
import InvoiceDetail from './Invoices/InvoiceDetail';
import InvoiceForm from './Invoices/InvoiceForm';
import { api } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Navigation Stack for infinite nesting
  const [navStack, setNavStack] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

        // Store all projects for filtering
        setProjects(projectsData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter projects by status
  const getFilteredProjects = () => {
    if (projectFilter === 'All') return projects;

    return projects.filter(p => {
      const status = p.status || '';
      return status.toLowerCase() === projectFilter.toLowerCase();
    });
  };

  const filteredProjects = getFilteredProjects();

  const statusColors = {
    'Ongoing': 'blue',
    'Planning': 'orange',
    'Completed': 'green',
    'Halted': 'red'
  };

  // Navigation Stack Management
  const pushToStack = (type, data, mode = 'view') => {
    console.log('Pushing to stack:', { type, data, mode, currentDepth: navStack.length });
    setNavStack(prev => [...prev, { type, data, mode }]);
    setDrawerOpen(true);
  };

  const popFromStack = () => {
    console.log('Popping from stack, current depth:', navStack.length);
    setNavStack(prev => {
      const newStack = prev.slice(0, -1);
      if (newStack.length === 0) {
        setDrawerOpen(false);
      }
      return newStack;
    });
  };

  const updateTopOfStack = (updates) => {
    setNavStack(prev => {
      const newStack = [...prev];
      if (newStack.length > 0) {
        newStack[newStack.length - 1] = { ...newStack[newStack.length - 1], ...updates };
      }
      return newStack;
    });
  };

  const handleProjectClick = (project) => {
    pushToStack('project', project, 'view');
  };

  const handleNestedNavigate = (type, data, mode = 'view') => {
    pushToStack(type, data, mode);
  };

  const handleEdit = () => {
    console.log('Edit clicked at level:', navStack.length);
    updateTopOfStack({ mode: 'edit' });
  };

  const handleStatusUpdate = async (type, data) => {
    // Refresh the item after status update
    console.log('Status update for:', type, data);
    try {
      let freshData;
      if (type === 'project') {
        freshData = await api.projects.getById(data.id);
      } else if (type === 'client') {
        freshData = await api.clients.getById(data.id);
      } else if (type === 'invoice') {
        freshData = await api.invoices.getById(data.id);
      }
      if (freshData) {
        updateTopOfStack({ data: freshData });
      }
    } catch (error) {
      console.error('Failed to refresh after status update', error);
    }
  };

  const handlePrint = (invoice) => {
    console.log('Print invoice at level:', navStack.length, invoice);
    // Trigger browser print
    window.print();
  };

  const handleCancelEdit = () => {
    const currentItem = navStack[navStack.length - 1];
    if (currentItem && currentItem.data) {
      updateTopOfStack({ mode: 'view' });
    } else {
      popFromStack();
    }
  };

  const handleFormSuccess = async () => {
    const currentItem = navStack[navStack.length - 1];
    if (currentItem) {
      // Refresh the current item's data
      try {
        let freshData;
        if (currentItem.type === 'project') {
          freshData = await api.projects.getById(currentItem.data.id);
        } else if (currentItem.type === 'client') {
          freshData = await api.clients.getById(currentItem.data.id);
        } else if (currentItem.type === 'invoice') {
          freshData = await api.invoices.getById(currentItem.data.id);
        }
        updateTopOfStack({ data: freshData, mode: 'view' });
      } catch (error) {
        console.error('Failed to refresh data', error);
      }
    }
  };

  const handleDrawerClose = () => {
    setNavStack([]);
    setDrawerOpen(false);
  };

  const currentItem = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const getDrawerTitle = () => {
    if (!currentItem) return '';
    const { type, mode } = currentItem;
    if (mode === 'edit') {
      if (type === 'project') return 'Edit Project';
      if (type === 'client') return 'Edit Client';
      if (type === 'invoice') return 'Edit Invoice';
    }
    if (type === 'project') return 'Project Details';
    if (type === 'client') return 'Client Details';
    if (type === 'invoice') return 'Invoice Details';
    return '';
  };

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
          onClick={() => navigate('/clients')}
        />
        <KPICard
          label="Running Projects"
          value={stats.runningProjects}
          subValue={`${stats.notStartedProjects} Planned`}
          icon={Folder}
          onClick={() => navigate('/projects')}
        />
        <KPICard
          label="Completed Projects"
          value={stats.completedProjects}
          icon={CheckCircle}
          onClick={() => navigate('/projects')}
        />
        <KPICard
          label="Outstanding Invoices"
          value={`₹${(stats.outstandingInvoicesAmount / 1000).toFixed(1)}k`}
          subValue={`${stats.outstandingInvoicesCount} Pending`}
          icon={AlertCircle}
          className="highlight-card"
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* Projects Section with Filters */}
      <div className="dashboard-projects-section">
        <div className="projects-filter-tabs">
          {['All', 'Ongoing', 'Planning', 'Completed'].map(status => (
            <button
              key={status}
              className={`filter-tab ${projectFilter === status ? 'active' : ''}`}
              onClick={() => setProjectFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="dashboard-projects-grid">
          {filteredProjects.length === 0 ? (
            <div className="no-projects">No projects found</div>
          ) : (
            filteredProjects.slice(0, 3).map(project => (
              <div key={project.id} className="dashboard-project-card" onClick={() => handleProjectClick(project)}>
                <div className="card-top">
                  <span className={`status-badge ${statusColors[project.status] || 'gray'}`}>
                    {project.status}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="project-client">{project.client}</span>
                    <button
                      className="icon-btn-sm"
                      title="More"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/projects');
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="project-name">{project.name}</h3>

                <div className="project-dates">
                  <Calendar size={14} />
                  <span>{formatDate(project.startDate)} — {formatDate(project.expectedEndDate)}</span>
                </div>

                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${project.completion || 0}%` }}></div>
                  </div>
                  <span className="progress-text">{project.completion || 0}% Complete</span>
                </div>

                <div className="card-footer">
                  <div className="financial-mini">
                    <span className="label">Project Value</span>
                    <span className="value">₹{((project.projectValue || 0) / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-grid">
        <div className="analytics-main">
          <ProjectProfitability
            data={profitabilityData}
            onProjectClick={async (projectData) => {
              try {
                const fullProject = await api.projects.getById(projectData.id);
                handleProjectClick(fullProject);
              } catch (error) {
                console.error('Failed to load project', error);
              }
            }}
          />
        </div>
        <div className="analytics-side">
          <OutstandingInvoices
            invoices={invoices}
            onInvoiceClick={(invoice) => {
              pushToStack('invoice', invoice, 'view');
            }}
            onViewAll={() => navigate('/invoices')}
          />
        </div>
      </div>

      {/* Drawer with Stack-based Navigation */}
      <RightDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onBack={navStack.length > 1 ? popFromStack : null}
        title={getDrawerTitle()}
        width="50%"
        depth={navStack.length - 1}
      >
        {currentItem && (
          <>
            {currentItem.type === 'project' && currentItem.mode === 'view' && (
              <ProjectDetail
                projectData={currentItem.data}
                isDrawer={true}
                onEdit={handleEdit}
                onStatusUpdate={(e, proj) => handleStatusUpdate('project', proj)}
                onNavigate={(type, data) => handleNestedNavigate(type, data, 'view')}
                onDeleteSuccess={popFromStack}
              />
            )}
            {currentItem.type === 'project' && currentItem.mode === 'edit' && (
              <ProjectForm
                initialData={currentItem.data}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelEdit}
              />
            )}
            {currentItem.type === 'client' && currentItem.mode === 'view' && (
              <ClientDetail
                clientData={currentItem.data}
                isDrawer={true}
                isNested={true}
                onEdit={handleEdit}
                onStatusUpdate={(e, client) => handleStatusUpdate('client', client)}
                onNavigate={(type, data) => handleNestedNavigate(type, data, 'view')}
                onDeleteSuccess={popFromStack}
              />
            )}
            {currentItem.type === 'client' && currentItem.mode === 'edit' && (
              <ClientForm
                initialData={currentItem.data}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelEdit}
              />
            )}
            {currentItem.type === 'invoice' && currentItem.mode === 'view' && (
              <InvoiceDetail
                invoiceData={currentItem.data}
                isDrawer={true}
                onEdit={handleEdit}
                onStatusUpdate={(e, inv) => handleStatusUpdate('invoice', inv)}
                onPrint={(e, inv) => handlePrint(inv || currentItem.data)}
                onDeleteSuccess={popFromStack}
              />
            )}
            {currentItem.type === 'invoice' && currentItem.mode === 'edit' && (
              <InvoiceForm
                initialData={currentItem.data}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelEdit}
              />
            )}
          </>
        )}
      </RightDrawer>
    </div>
  );
}
