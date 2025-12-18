import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, DollarSign, User, Briefcase, Edit2, Printer, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import './InvoiceDetail.css';

export default function InvoiceDetail({ invoiceData, isDrawer = false, onEdit, onStatusUpdate, onPrint }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(invoiceData || null);
    const [loading, setLoading] = useState(!invoiceData);

    useEffect(() => {
        if (invoiceData) {
            setInvoice(invoiceData);
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const data = await api.invoices.getById(id);
                setInvoice(data);
            } catch (error) {
                console.error('Failed to fetch invoice', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchInvoice();
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
                                <div className="info-value">{invoice.client}</div>
                            </div>
                        </div>
                        <div className="info-item">
                            <Briefcase size={18} />
                            <div>
                                <div className="info-label">Project</div>
                                <div className="info-value">{invoice.project}</div>
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
            </div>
        </div>
    );
}
