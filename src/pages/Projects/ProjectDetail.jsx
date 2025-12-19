import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckSquare, Wallet, User, FileText, ArrowRight, ArrowUpRight, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import ClientDetail from '../Clients/ClientDetail';
import InvoiceDetail from '../Invoices/InvoiceDetail';
import './ProjectDetail.css';

export default function ProjectDetail({ projectData, isDrawer = false, onEdit, onStatusUpdate, activeView = 'project', subViewData, onNavigate, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core Data
    const [project, setProject] = useState(projectData || null);
    const [loading, setLoading] = useState(!projectData);

    const handleEdit = () => {
        if (onEdit) onEdit(null, project);
    };

    const handleStatus = () => {
        if (onStatusUpdate) onStatusUpdate(null, project);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            await api.projects.delete(project.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess(); // Refresh list and close drawer
            } else if (isDrawer && onClose) {
                onClose();
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error('Failed to delete project', error);
            alert('Failed to delete project');
        }
    };

    useEffect(() => {
        // Strategy: Stale-While-Revalidate
        // 1. If projectData is passed (from list), use it immediately for instant render.
        // 2. But ALWAYS fetch the full fresh data by ID to get nested relations (invoices, expenses) 
        //    which might be missing or empty in the list view object.

        let initialLoadDone = false;

        if (projectData && !initialLoadDone) {
            setProject(projectData);
            setLoading(false);
            initialLoadDone = true;
        }

        const targetId = id || projectData?.id;

        const fetchProject = async () => {
            if (!targetId) return;
            try {
                // If we didn't have projectData, we are loading.
                if (!projectData) setLoading(true);

                const data = await api.projects.getById(targetId);
                setProject(data);
            } catch (error) {
                console.error("Failed to load project details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id, projectData]);

    // --- Navigation Handlers ---
    const handleViewClient = () => {
        if (project.clientId && onNavigate) {
            onNavigate('client', { id: project.clientId });
        } else {
            console.warn("No Client ID found");
        }
    };

    const handleViewInvoice = (inv) => {
        if (onNavigate) {
            onNavigate('invoice', inv);
        }
    };

    // If Loading
    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    // --- RENDER SUB-VIEWS ---
    if (activeView === 'client') {
        return (
            <div className="nested-view">
                <ClientDetailWrapper clientId={project.clientId} />
            </div>
        );
    }

    if (activeView === 'invoice') {
        return (
            <div className="nested-view">
                <InvoiceDetail invoiceData={subViewData} isDrawer={true} />
            </div>
        );
    }

    // --- MAIN PROJECT VIEW ---
    return (
        <div className={`project-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header">
                {!isDrawer && (
                    <button className="back-btn" onClick={() => navigate('/projects')}>
                        <ArrowLeft size={20} /> Back
                    </button>
                )}
                <div className="header-container-flex" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-main">
                        <div>
                            <h1>{project.name}</h1>
                            <p className="subtitle" onClick={handleViewClient} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={14} /> {project?.client || 'Unknown'} <ArrowUpRight size={12} />
                            </p>
                        </div>
                        <span className={`status-badge-lg ${project?.status || 'planned'}`}>{project?.status || 'Planned'}</span>
                    </div>

                    <div className="header-actions-right">
                        <button className="icon-btn" onClick={handleStatus} title="Update Status">
                            <RefreshCw size={20} />
                        </button>
                        <button className="icon-btn" onClick={handleEdit} title="Edit">
                            <Edit2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="project-grid">
                <div className="main-col">
                    <div className="card overview-card">
                        <h3>Overview</h3>
                        <p className="desc">{project.description}</p>
                        <div className="meta-row">
                            <div className="meta-item">
                                <MapPin size={16} /> {project?.location || 'No location'}
                            </div>
                            <div className="meta-item">
                                <Calendar size={16} /> {formatDate(project?.startDate)} — {formatDate(project?.expectedEndDate)}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Financials</h3>
                        <div className="financial-row">
                            <div className="fin-stat">
                                <span className="label">Project Value</span>
                                <span className="val">₹{((project.projectValue || 0) / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Income</span>
                                <span className="val success">₹{((project?.income || 0) / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Expense</span>
                                <span className="val danger">₹{((project?.expense || 0) / 1000).toFixed(1)}K</span>
                            </div>
                        </div>
                    </div>

                    <div className="lists-row">
                        {/* INVOICES SECTION */}
                        <div className="card">
                            <h3>Invoices</h3>
                            <div className="table-responsive">
                                {(project.invoices && project.invoices.length > 0) ? (
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(project.invoices || []).map(inv => (
                                                <tr key={inv.id} onClick={() => handleViewInvoice(inv)} style={{ cursor: 'pointer' }}>
                                                    <td>{inv.invoiceNumber}</td>
                                                    <td>{formatDate(inv.generatedDate || inv.date)}</td>
                                                    <td>₹{(inv.amount || 0).toLocaleString()}</td>
                                                    <td><span className={`status-badge-sm ${inv.status}`}>{inv.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-muted">No invoices found.</p>}
                            </div>
                        </div>

                        {/* EXPENSES SECTION */}
                        <div className="card">
                            <h3>Expenses</h3>
                            <div className="table-responsive">
                                {(project.expenses && project.expenses.length > 0) ? (
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Paid By</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(project.expenses || []).map(exp => (
                                                <tr key={exp.id}>
                                                    <td>{formatDate(exp.expenseDate || exp.date)}</td>
                                                    <td>{exp.description}</td>
                                                    <td><span className="badge-gray">{exp.responsiblePerson}</span></td>
                                                    <td className="text-danger">₹{(exp.amount || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-muted">No expenses found.</p>}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Delete Action - Pushed to bottom */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                        onClick={handleDelete}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#fecaca';
                            e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fecaca';
                        }}
                    >
                        <Trash2 size={16} />
                        Delete Project
                    </button>
                </div>
            </div>
        </div>
    );
}

// Wrapper to fetch client data if only ID is known, then render ClientDetail
function ClientDetailWrapper({ clientId, onBack }) {
    const [clientData, setClientData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.clients.getById(clientId);
                setClientData(data);
            } catch (e) { console.error(e); }
        };
        if (clientId) fetch();
    }, [clientId]);

    if (!clientData) return <div>Loading client...</div>;

    return <ClientDetail clientData={clientData} isDrawer={true} />;
}
