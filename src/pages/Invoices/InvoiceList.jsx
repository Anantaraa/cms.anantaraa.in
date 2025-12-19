import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit2, MoreHorizontal, Printer, RefreshCw, X, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate, formatApiDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import InvoiceDetail from './InvoiceDetail';
import InvoiceForm from './InvoiceForm';
import PrintableInvoice from './PrintableInvoice';
import DateInput from '../../components/common/DateInput';
import './InvoiceList.css';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Filter State
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: [],
        dateFrom: '',
        dateTo: ''
    });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Menu & Action States
    const [activeMenu, setActiveMenu] = useState(null); // ID of invoice with active menu
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusInvoice, setStatusInvoice] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    // Payment recording state (when marking as paid)
    const [paymentDetails, setPaymentDetails] = useState({
        amount_received: '',
        received_date: '',
        payment_method: ''
    });

    // Print State
    const [printingInvoice, setPrintingInvoice] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await api.invoices.getAll();
            setInvoices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setDrawerMode('view');
        setDrawerOpen(true);
    };

    const handleEditInvoice = (e, invoice) => {
        if (e && e.stopPropagation) e.stopPropagation(); // Prevent row click
        setSelectedInvoice(invoice);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleNewInvoice = () => {
        setSelectedInvoice(null);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setTimeout(() => setSelectedInvoice(null), 300); // Wait for animation
    };

    const handleFormSuccess = () => {
        loadInvoices(); // Refresh list
        handleDrawerClose();
    };

    const handleDeleteSuccess = () => {
        loadInvoices(); // Refresh list
        handleDrawerClose();
    };

    // ...

    // --- Action Handlers ---
    const toggleMenu = (e, id) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    // ...

    const handlePrint = (e, invoice) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(null);
        setPrintingInvoice(invoice);
        // Allow state to set then print
        setTimeout(() => {
            window.print();
            // Reset after print dialog closes (approximate)
            setTimeout(() => setPrintingInvoice(null), 1000);
        }, 100);
    };

    const openStatusModal = (e, invoice) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(null);
        setStatusInvoice(invoice);
        setNewStatus(invoice.status);
        // Pre-fill payment details if changing to paid
        setPaymentDetails({
            amount_received: invoice.amount || '',
            received_date: new Date().toISOString().split('T')[0], // Today's date in yyyy-mm-dd
            payment_method: ''
        });
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusInvoice || !newStatus) return;

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
                    invoice_id: statusInvoice.id,
                    amount_received: Number(paymentDetails.amount_received),
                    received_date: formatApiDate(paymentDetails.received_date),
                    payment_method: paymentDetails.payment_method || 'Cash',
                    status: 'received'
                });
            } else {
                // For other status changes, just update the status
                await api.invoices.update(statusInvoice.id, { status: newStatus });
            }

            setStatusModalOpen(false);
            setStatusInvoice(null);
            loadInvoices();
        } catch (error) {
            console.error("Failed to update status", error);
            alert(error.response?.data?.message || 'Failed to update invoice status');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const sortedInvoices = [...invoices].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert to numbers for numeric fields
        if (sortConfig.key === 'amount') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        // String comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Apply filters
    const applyFilters = (invoices) => {
        return invoices.filter(invoice => {
            // Status filter
            if (filters.status.length > 0 && !filters.status.includes(invoice.status.toLowerCase())) {
                return false;
            }
            // Date range filter (on generated date)
            if (filters.dateFrom || filters.dateTo) {
                const invoiceDate = new Date(invoice.generatedDate || invoice.date);
                if (filters.dateFrom && invoiceDate < new Date(filters.dateFrom)) {
                    return false;
                }
                if (filters.dateTo && invoiceDate > new Date(filters.dateTo)) {
                    return false;
                }
            }
            // Search filter
            if (searchTerm && !(
                (invoice.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (invoice.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (invoice.project?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            )) {
                return false;
            }
            return true;
        });
    };

    const filteredInvoices = applyFilters(sortedInvoices);

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            const newStatus = filters.status.includes(value)
                ? filters.status.filter(s => s !== value)
                : [...filters.status, value];
            setFilters({ ...filters, status: newStatus });
        } else {
            setFilters({ ...filters, [type]: value });
        }
    };

    const clearFilters = () => {
        setFilters({ status: [], dateFrom: '', dateTo: '' });
    };

    const activeFilterCount = filters.status.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

    return (
        <div className="invoice-list-page">
            <div className="page-header-actions">
                <h2>Invoices</h2>
                <div className="actions">
                    <div className="search-box-simple">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-secondary" onClick={() => setFilterModalOpen(true)}>
                        <Filter size={16} />
                        Filter
                        {activeFilterCount > 0 && (
                            <span style={{
                                marginLeft: '6px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button className="btn-primary" onClick={handleNewInvoice}>
                        <Plus size={16} /> New Invoice
                    </button>
                </div>
            </div>

            <div className="table-card">
                {loading ? <div>Loading...</div> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('invoiceNumber')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Invoice Number {getSortIcon('invoiceNumber')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('client')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Client {getSortIcon('client')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('project')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Project {getSortIcon('project')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Date {getSortIcon('date')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Due Date {getSortIcon('dueDate')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('amount')} className="text-right" style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                        Amount {getSortIcon('amount')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} className="text-center" style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr
                                    key={inv.id}
                                    onClick={() => handleViewInvoice(inv)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td className="font-mono">{inv.invoiceNumber || inv.id?.substring(0, 8)}</td>
                                    <td>{inv.client}</td>
                                    <td className="text-muted">{inv.project}</td>
                                    <td>{formatDate(inv.date || inv.generatedDate)}</td>
                                    <td>{formatDate(inv.dueDate)}</td>
                                    <td className="text-right font-medium">₹{Number(inv.amount).toLocaleString()}</td>
                                    <td className="text-center">
                                        <span className={`status-badge ${inv.status}`}>{inv.status}</span>
                                    </td>
                                    <td className="action-col">
                                        <div className="action-flex">
                                            <button
                                                className="icon-btn-sm"
                                                title="Update Status"
                                                onClick={(e) => openStatusModal(e, inv)}
                                            >
                                                <RefreshCw size={18} />
                                            </button>

                                            <button
                                                className="icon-btn-sm"
                                                title="Print"
                                                onClick={(e) => handlePrint(e, inv)}
                                            >
                                                <Printer size={18} />
                                            </button>

                                            <div className="menu-wrapper">
                                                <button
                                                    className="icon-btn-sm"
                                                    onClick={(e) => toggleMenu(e, inv.id)}
                                                    title="More Actions"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {activeMenu === inv.id && (
                                                    <div className="dropdown-menu">
                                                        <button onClick={(e) => handleEditInvoice(e, inv)}>
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Filter Modal */}
            {filterModalOpen && (
                <div className="modal-overlay" onClick={() => setFilterModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Filter Invoices</h3>
                            <button onClick={() => setFilterModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Status</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {['draft', 'sent', 'overdue', 'paid'].map(status => (
                                        <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={filters.status.includes(status)}
                                                onChange={() => handleFilterChange('status', status)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Date Range</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>From</label>
                                        <DateInput
                                            value={filters.dateFrom}
                                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>To</label>
                                        <DateInput
                                            value={filters.dateTo}
                                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={clearFilters}>Clear All</button>
                            <button className="btn-primary" onClick={() => setFilterModalOpen(false)}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {statusModalOpen && (
                <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Update Status</h3>
                            <button onClick={() => setStatusModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p>Modifying status for invoice <b>{statusInvoice?.invoiceNumber}</b></p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="overdue">Overdue</option>
                                <option value="paid">Paid</option>
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
                                        <small style={{ color: '#64748b' }}>Invoice Amount: ₹{Number(statusInvoice?.amount || 0).toLocaleString()}</small>
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

            {/* Hidden Printable Invoice */}
            <PrintableInvoice ref={printRef} invoice={printingInvoice} />

            <RightDrawer
                isOpen={drawerOpen}
                onClose={handleDrawerClose}
                onBack={drawerMode === 'edit' && selectedInvoice ? () => setDrawerMode('view') : null}
                title={drawerMode === 'view' ? 'Invoice Details' : (selectedInvoice ? 'Edit Invoice' : 'New Invoice')}
                width="50%"
            >
                {drawerMode === 'view' && selectedInvoice && (
                    <InvoiceDetail
                        invoiceData={selectedInvoice}
                        isDrawer={true}
                        onEdit={handleEditInvoice}
                        onStatusUpdate={openStatusModal}
                        onPrint={handlePrint}
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                )}
                {drawerMode === 'edit' && (
                    <InvoiceForm
                        initialData={selectedInvoice}
                        onSuccess={handleFormSuccess}
                        onCancel={selectedInvoice ? () => setDrawerMode('view') : handleDrawerClose}
                    />
                )}
            </RightDrawer>
        </div>
    );
}
