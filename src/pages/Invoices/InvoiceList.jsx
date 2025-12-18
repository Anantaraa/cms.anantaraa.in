import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit2, MoreHorizontal, Printer, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import InvoiceDetail from './InvoiceDetail';
import InvoiceForm from './InvoiceForm';
import PrintableInvoice from './PrintableInvoice';
import './InvoiceList.css';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Menu & Action States
    const [activeMenu, setActiveMenu] = useState(null); // ID of invoice with active menu
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusInvoice, setStatusInvoice] = useState(null);
    const [newStatus, setNewStatus] = useState('');

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
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusInvoice || !newStatus) return;
        try {
            await api.invoices.update(statusInvoice.id, { ...statusInvoice, status: newStatus });
            setStatusModalOpen(false);
            setStatusInvoice(null);
            loadInvoices();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        (invoice.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.project?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

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
                                <th>Invoice Number</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th className="text-right">Amount</th>
                                <th className="text-center">Status</th>
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
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setStatusModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateStatus}>Update Status</button>
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
