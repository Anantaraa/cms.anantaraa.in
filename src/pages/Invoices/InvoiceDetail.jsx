import React, { useEffect, useState } from 'react'; // Consolidated imports
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, Briefcase, Edit2, Printer, RefreshCw, Trash2, X } from 'lucide-react'; // Added X
import { api } from '../../services/api';
import { formatDate, formatApiDate } from '../../utils/dateUtils';
import DateInput from '../../components/common/DateInput';
import './InvoiceDetail.css';

export default function InvoiceDetail({ invoiceData, isDrawer = false, onEdit, onStatusUpdate, onPrint, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(invoiceData || null);
    const [loading, setLoading] = useState(!invoiceData);

    // Status Modal State
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    // Payment recording state (when marking as paid)
    const [paymentDetails, setPaymentDetails] = useState({
        amount_received: '',
        received_date: '',
        payment_method: ''
    });

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

    const handleOpenStatusModal = () => {
        setNewStatus(invoice.status || 'draft');
        // Pre-fill payment details if changing to paid
        setPaymentDetails({
            amount_received: invoice.amount || '',
            received_date: new Date().toISOString().split('T')[0], // Today's date in yyyy-mm-dd
            payment_method: ''
        });
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        try {
            // If marking as paid, record payment instead of just updating status
            if (newStatus === 'paid') {
                // Validate payment details
                if (!paymentDetails.amount_received || !paymentDetails.received_date) {
                    alert('Please enter payment amount and date');
                    return;
                }

                // Create income record (backend will auto-update invoice status to paid)
                await api.income.create({
                    invoice_id: invoice.id,
                    amount_received: Number(paymentDetails.amount_received),
                    received_date: formatApiDate(paymentDetails.received_date),
                    payment_method: paymentDetails.payment_method || 'Cash',
                    status: 'received'
                });
            } else {
                // For other status changes, just update the status
                await api.invoices.update(invoice.id, { status: newStatus });
            }

            setStatusModalOpen(false);

            // Refetch or update local state
            const updatedInvoice = await api.invoices.getById(invoice.id);
            setInvoice(updatedInvoice);

            // Notify parent if needed (e.g. to refresh list)
            if (onStatusUpdate) onStatusUpdate(null, updatedInvoice);

        } catch (error) {
            console.error("Failed to update invoice status", error);
            alert("Failed to update status");
        }
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
                        <button className="icon-btn" onClick={handleOpenStatusModal} title="Update Status">
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

            {/* Status Update Modal */}
            {statusModalOpen && (
                <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Update Invoice Status</h3>
                            <button onClick={() => setStatusModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p>Modifying status for <b>{invoice?.invoiceNumber}</b></p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Show payment details form when status is "paid" */}
                            {newStatus === 'paid' && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                                    <h4 style={{ marginBottom: '15px', color: '#0369a1' }}>Record Payment Details</h4>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                                            Amount Received <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentDetails.amount_received}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, amount_received: e.target.value })}
                                            placeholder="Enter amount"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            required
                                        />
                                        <small style={{ color: '#64748b' }}>Invoice Amount: ₹{Number(invoice.amount || 0).toLocaleString()}</small>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                                            Payment Date <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <DateInput
                                            value={paymentDetails.received_date}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, received_date: e.target.value })}
                                            style={{ width: '100%' }}
                                            required
                                        />
                                    </div>

                                    <div style={{ marginBottom: '0' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentDetails.payment_method}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_method: e.target.value })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        >
                                            <option value="">Select method</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Card">Card</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setStatusModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateStatus}>
                                {newStatus === 'paid' ? 'Record Payment' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
