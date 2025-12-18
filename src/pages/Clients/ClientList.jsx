import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail, Edit2, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import RightDrawer from '../../components/common/RightDrawer';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import ProjectDetail from '../Projects/ProjectDetail';
import InvoiceDetail from '../Invoices/InvoiceDetail';
import './ClientList.css';

export default function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedClient, setSelectedClient] = useState(null);

    // Nested View State
    const [viewSubMode, setViewSubMode] = useState('client'); // 'client', 'project', 'invoice'
    const [subViewData, setSubViewData] = useState(null);

    // Menu & Status State
    const [activeMenu, setActiveMenu] = useState(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusClient, setStatusClient] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await api.clients.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewClient = (client) => {
        setSelectedClient(client);
        setDrawerMode('view');
        setViewSubMode('client');
        setDrawerOpen(true);
    };

    const handleEditClient = (e, client) => {
        if (e && e.stopPropagation) e.stopPropagation(); // Prevent row click
        setSelectedClient(client);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleNewClient = () => {
        setSelectedClient(null);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            setSelectedClient(null);
            setViewSubMode('client');
            setSubViewData(null);
        }, 300); // Wait for animation
    };

    const handleFormSuccess = () => {
        loadClients(); // Refresh list
        handleDrawerClose();
    };

    // --- Action Handlers ---
    const toggleMenu = (e, id) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    const openStatusModal = (e, client) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(null);
        setStatusClient(client);
        setNewStatus(client.status);
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusClient || !newStatus) return;
        try {
            await api.clients.update(statusClient.id, { ...statusClient, status: newStatus });
            setStatusModalOpen(false);
            setStatusClient(null);
            loadClients();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // Nested Navigation
    const handleNestedNavigate = (mode, data) => {
        setViewSubMode(mode);
        setSubViewData(data);
    };

    const handleBack = () => {
        if (viewSubMode !== 'client') {
            setViewSubMode('client');
            setSubViewData(null);
        } else if (drawerMode === 'edit' && selectedClient) {
            setDrawerMode('view');
        }
    };

    const getDrawerTitle = () => {
        if (drawerMode === 'edit') return selectedClient ? 'Edit Client' : 'New Client';
        if (viewSubMode === 'project') return 'Project Details';
        if (viewSubMode === 'invoice') return 'Invoice Details';
        return 'Client Details';
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="client-list-page">
            {/* ... (Search and filter - kept implicit via context or if simple replacement, need to be careful not to delete) 
                Wait, I am replacing the whole file structure somewhat. 
                I need to match the StartLine/EndLine or replace the whole file? 
                The provided TargetContent seems to be the whole file content mostly.
                I will replace from imports down to valid return block.
            */}

            <div className="page-actions">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="action-buttons">
                    <button className="btn-secondary">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="btn-primary" onClick={handleNewClient}>
                        <Plus size={18} />
                        New Client
                    </button>
                </div>
            </div>

            <div className="clients-table-container">
                {loading ? (
                    <div className="loading-state">Loading Clients...</div>
                ) : (
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Budget</th>
                                <th>Projects</th>
                                <th>Status</th>
                                <th className="action-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr
                                    key={client.id}
                                    onClick={() => handleViewClient(client)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>
                                        <div className="client-name-cell">
                                            <div className="avatar-sm">{client.name.charAt(0)}</div>
                                            <span className="font-medium">{client.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="client-contact">
                                            <div className="contact-item">
                                                <Mail size={12} /> {client.email}
                                            </div>
                                            {client.phone && (
                                                <div className="contact-item">
                                                    <Phone size={12} /> {client.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="font-mono">
                                        ₹{(client.budget / 1000).toFixed(1)}K
                                    </td>
                                    <td>{client.projectCount}</td>
                                    <td>
                                        <span className={`status-badge ${client.status.toLowerCase()}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="action-col">
                                        <div className="action-flex">
                                            <button
                                                className="icon-btn-sm"
                                                onClick={(e) => openStatusModal(e, client)}
                                                title="Update Status"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <div className="menu-wrapper">
                                                <button
                                                    className="icon-btn-sm"
                                                    onClick={(e) => toggleMenu(e, client.id)}
                                                    title="More Actions"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {activeMenu === client.id && (
                                                    <div className="dropdown-menu">
                                                        <button onClick={(e) => handleEditClient(e, client)}>
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
                            <p>Modifying status for <b>{statusClient?.name}</b></p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Lead">Lead</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setStatusModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateStatus}>Update Status</button>
                        </div>
                    </div>
                </div>
            )}

            <RightDrawer
                isOpen={drawerOpen}
                onClose={handleDrawerClose}
                onBack={(drawerMode === 'edit' && selectedClient) || viewSubMode !== 'client' ? handleBack : null}
                title={getDrawerTitle()}
                width="50%"
            >
                {drawerMode === 'view' && selectedClient && (
                    <>
                        {viewSubMode === 'client' && (
                            <ClientDetail
                                clientData={selectedClient}
                                isDrawer={true}
                                onEdit={handleEditClient}
                                onStatusUpdate={openStatusModal}
                                onNavigate={handleNestedNavigate}
                            />
                        )}
                        {viewSubMode === 'project' && (
                            <ProjectDetail
                                projectData={subViewData}
                                isDrawer={true}
                                isNested={true}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceDetail
                                invoiceData={subViewData}
                                isDrawer={true}
                            />
                        )}
                    </>
                )}
                {drawerMode === 'edit' && (
                    <ClientForm
                        initialData={selectedClient}
                        onSuccess={handleFormSuccess}
                        onCancel={selectedClient ? () => setDrawerMode('view') : handleDrawerClose}
                    />
                )}
            </RightDrawer>
        </div>
    );
}
