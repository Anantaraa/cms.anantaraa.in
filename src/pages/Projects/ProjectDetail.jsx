import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckSquare, Wallet, User, FileText, ArrowRight, ArrowUpRight, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import ClientDetail from '../Clients/ClientDetail';
import InvoiceDetail from '../Invoices/InvoiceDetail';
import html2pdf from 'html2pdf.js';
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

    const handleGeneratePDF = () => {
        const isPlanning = project.status === 'planned';
        const docTitle = isPlanning ? 'Quotation' : 'Invoice List';

        // Create a temporary container for PDF content
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.innerHTML = `
            <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h1 style="margin: 0; color: #000000;">Anantaraa Design Studio</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #444;">+91 9574652320 | hello@anantaraa.in</p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #444;">341, Avadh Arena, VIP Road, Vesu, Surat, Gujarat 395007</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; color: #000;">${docTitle.toUpperCase()}</h2>
                    <p style="margin: 5px 0; font-size: 12px;">Date: ${new Date().toLocaleDateString('en-GB')}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Project Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Project Name:</td>
                        <td>${project.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Client:</td>
                        <td>${project.clientName || project.client || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                        <td>${project.location || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                        <td>${project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unknown'}</td>
                    </tr>
                </table>
            </div>

            <div>
                <h3 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                    ${isPlanning ? 'Quotation Items' : 'Invoices'}
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: left; color: #475569;">#</th>
                            <th style="padding: 12px; text-align: left; color: #475569;">Description</th>
                            <th style="padding: 12px; text-align: right; color: #475569;">Due Date</th>
                            <th style="padding: 12px; text-align: right; color: #475569;">Amount</th>
                        </tr>
                    </thead>
                    </thead>
                    <tbody>
                        ${(isPlanning ? (project.quotations || []) : (project.invoices || [])).map((item, index) => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #334155;">${isPlanning ? index + 1 : item.invoiceNumber}</td>
                                <td style="padding: 12px; color: #334155;">${item.description || (isPlanning ? 'Quotation Item' : 'Invoice')}</td>
                                <td style="padding: 12px; text-align: right; color: #334155;">${formatDate(item.date || item.dueDate || item.due_date)}</td>
                                <td style="padding: 12px; text-align: right; font-weight: bold; color: #0f172a;">₹${(item.amount || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f8fafc; font-weight: bold;">
                            <td colspan="3" style="padding: 12px; text-align: right;">Total:</td>
                            <td style="padding: 12px; text-align: right; color: #2563eb;">
                                ₹${(isPlanning ? (project.quotations || []) : (project.invoices || [])).reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>This is a computer generated document.</p>
            </div>
        `;

        const opt = {
            margin: 10,
            filename: `${project.name.replace(/\s+/g, '_')}_${docTitle}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
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
    const handleViewClient = async () => {
        if (project.clientId && onNavigate) {
            try {
                const clientData = await api.clients.getById(project.clientId);
                onNavigate('client', clientData);
            } catch (error) {
                console.error("Failed to load client", error);
            }
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
                        <span className={`status-badge-lg ${(project?.status || 'planned').toLowerCase()}`}>
                            {project?.status || 'Planned'}
                        </span>
                    </div>

                    <div className="header-actions-right">
                        <button className="icon-btn" onClick={handleGeneratePDF} title="Download PDF">
                            <FileText size={20} />
                        </button>
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
                            <h3>{project.status === 'planned' ? 'Quotations' : 'Invoices'}</h3>
                            <div className="table-responsive">
                                {(project.status === 'planned' ? (project.quotations && project.quotations.length > 0) : (project.invoices && project.invoices.length > 0)) ? (
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Due Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(project.status === 'planned' ? (project.quotations || []) : (project.invoices || [])).map((item, index) => (
                                                <tr key={item.id} onClick={() => project.status !== 'planned' && handleViewInvoice(item)} style={{ cursor: project.status !== 'planned' ? 'pointer' : 'default' }}>
                                                    <td>{project.status === 'planned' ? index + 1 : item.invoiceNumber}</td>
                                                    <td>{formatDate(item.date || item.dueDate || item.due_date)}</td>
                                                    <td>₹{(item.amount || 0).toLocaleString()}</td>
                                                    <td><span className={`status-badge-sm ${item.status}`}>{item.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-muted">No {project.status === 'planned' ? 'quotations' : 'invoices'} found.</p>}
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
