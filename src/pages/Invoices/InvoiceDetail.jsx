import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, DollarSign, User, Briefcase, Edit2, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import './InvoiceDetail.css';

export default function InvoiceDetail({ invoiceData, isDrawer = false, onEdit, onStatusUpdate, onPrint, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(invoiceData || null);
    const [loading, setLoading] = useState(!invoiceData);

    useEffect(() => {
        // Strategy: Stale-While-Revalidate
        // Always fetch fresh data to ensure we have the full details (client name, project name, etc.)
        // even if partial data was passed from a list view.

        let initialLoadDone = false;
        if (invoiceData && !initialLoadDone) {
            setInvoice(invoiceData);
            setLoading(false);
            initialLoadDone = true;
        }

        const targetId = id || invoiceData?.id;

        const fetchInvoice = async () => {
            if (!targetId) return;
            try {
                if (!invoiceData) setLoading(true); // Only show loading if we have NO data at all
                const data = await api.invoices.getById(targetId);
                setInvoice(data);
            } catch (error) {
                console.error('Failed to fetch invoice', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id, invoiceData]);

    if (loading) return <div className="loading-state">Loading Invoice Details...</div>;
    if (!invoice) return <div className="error-state">Invoice not found</div>;

    const handleEdit = () => {
        if (onEdit) onEdit(null, invoice);
    };

    const handleStatus = () => {
        if (onStatusUpdate) onStatusUpdate(null, invoice);
    };

    const handlePrint = () => {
        if (onPrint) onPrint(null, invoice);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            return;
        }

        try {
            await api.invoices.delete(invoice.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess(); // Refresh list and close drawer
            } else if (isDrawer && onClose) {
                onClose();
            } else {
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Failed to delete invoice', error);
            alert('Failed to delete invoice');
        }
    };

    return (
        <div className={`invoice-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header">
                {!isDrawer && (
                    <button className="back-btn" onClick={() => navigate('/invoices')}>
                        <ArrowLeft size={20} />
                        Back to Invoices
                    </button>
                )}
                <div className="header-container-flex" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-content" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="invoice-icon-lg">
                            <FileText size={32} />
                        </div>
                        <div className="title-info">
                            <h1>{invoice.invoiceNumber}</h1>
                            <span className={`status-badge ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                        </div>
                    </div>
                    <div className="header-actions-right" style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" onClick={handleStatus} title="Update Status">
                            <RefreshCw size={20} />
                        </button>
                        <button className="icon-btn" onClick={handleEdit} title="Edit">
                            <Edit2 size={20} />
                        </button>
                        <button className="icon-btn" onClick={handlePrint} title="Print">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                <div className="info-card">
                    <h3>Invoice Information</h3>
                    <div className="info-list">

                        <div className="info-item">
                            <User size={18} />
                            <div>
                                <div className="info-label">Client</div>
                                <div
                                    className={`info-value ${invoice.clientId ? 'clickable-link' : ''}`}
                                    onClick={() => invoice.clientId && navigate(`/clients/${invoice.clientId}`)}
                                    style={invoice.clientId ? { cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 500 } : {}}
                                >
                                    {invoice.client || invoice.clientName || 'Unknown Client'}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <Briefcase size={18} />
                            <div>
                                <div className="info-label">Project</div>
                                <div
                                    className={`info-value ${invoice.projectId ? 'clickable-link' : ''}`}
                                    onClick={() => invoice.projectId && navigate(`/projects/${invoice.projectId}`)}
                                    style={invoice.projectId ? { cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 500 } : {}}
                                >
                                    {invoice.project || invoice.projectName || 'Unknown Project'}
                                </div>
                            </div>
                        </div>
                        <div className="info-item">
                            <Calendar size={18} />
                            <div>
                                <div className="info-label">Invoice Date</div>
                                <div className="info-value">{formatDate(invoice.date || invoice.generatedDate)}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <Calendar size={18} />
                            <div>
                                <div className="info-label">Due Date</div>
                                <div className="info-value">{formatDate(invoice.dueDate)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <h3>Amount</h3>
                    <div className="amount-display">
                        <span className="currency">₹</span>
                        <span className="amount">{invoice.amount.toLocaleString()}</span>
                    </div>
                </div>

                {invoice.items && invoice.items.length > 0 && (
                    <div className="related-lists">
                        <div className="section-card">
                            <div className="card-header">
                                <FileText size={18} />
                                <h3>Invoice Items</h3>
                            </div>
                            <div className="simple-list">
                                {invoice.items.map((item, index) => (
                                    <div key={index} className="list-item">
                                        <span className="item-name">{item.description}</span>
                                        <span className="item-amount">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
                        Delete Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
