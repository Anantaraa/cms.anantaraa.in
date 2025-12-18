import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckSquare, Wallet, User, FileText, ArrowRight, ArrowUpRight, RefreshCw, Edit2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import ClientDetail from '../Clients/ClientDetail';
import InvoiceDetail from '../Invoices/InvoiceDetail';
import './ProjectDetail.css';

export default function ProjectDetail({ projectData, isDrawer = false, onEdit, onStatusUpdate, activeView = 'project', subViewData, onNavigate }) {
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

    useEffect(() => {
        if (projectData) {
            setProject(projectData);
            setLoading(false);
        } else if (id) {
            const fetchProject = async () => {
                try {
                    const data = await api.projects.getById(id);
                    setProject(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProject();
        }
    }, [id, projectData]);

    // Data is now included in project object via updated API mappers
    // But we can keep local state for them if we want to support the list rendering
    useEffect(() => {
        if (project) {
            // If project loaded via new API, it has these arrays. 
            // If not (e.g. passed from list without full details? List mapper now includes them too usually, or at least subset).
            // Let's rely on what's in 'project'.
            // If 'project' from List view doesn't have them, we might need to fetch. 
            // But 'getById' definitely has them.
            // Let's just trust 'project' object structure from the mapper.
        }
    }, [project]);

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
                                <User size={14} /> {project.client} <ArrowUpRight size={12} />
                            </p>
                        </div>
                        <span className={`status-badge-lg ${project.status}`}>{project.status}</span>
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
                                <MapPin size={16} /> {project.location || 'No location'}
                            </div>
                            <div className="meta-item">
                                <Calendar size={16} /> {formatDate(project.startDate)} — {formatDate(project.endDate)}
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
                                <span className="val success">₹{((project.income || 0) / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Expense</span>
                                <span className="val danger">₹{((project.expense || 0) / 1000).toFixed(1)}K</span>
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
                                            {project.invoices.map(inv => (
                                                <tr key={inv.id} onClick={() => handleViewInvoice(inv)} style={{ cursor: 'pointer' }}>
                                                    <td>{inv.invoiceNumber}</td>
                                                    <td>{formatDate(inv.generatedDate || inv.date)}</td>
                                                    <td>₹{inv.amount.toLocaleString()}</td>
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
                                            {project.expenses.map(exp => (
                                                <tr key={exp.id}>
                                                    <td>{formatDate(exp.expenseDate || exp.date)}</td>
                                                    <td>{exp.description}</td>
                                                    <td><span className="badge-gray">{exp.responsiblePerson}</span></td>
                                                    <td className="text-danger">₹{exp.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-muted">No expenses found.</p>}
                            </div>
                        </div>
                    </div>
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
