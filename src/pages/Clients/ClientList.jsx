import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail, Edit2, RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import RightDrawer from '../../components/common/RightDrawer';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';
import ProjectDetail from '../Projects/ProjectDetail';
import ProjectForm from '../Projects/ProjectForm';
import InvoiceDetail from '../Invoices/InvoiceDetail';
import InvoiceForm from '../Invoices/InvoiceForm';
import './ClientList.css';

export default function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
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

    const handleDeleteSuccess = () => {
        loadClients(); // Refresh list
        handleDrawerClose();
    };

    const handleNestedItemChange = async () => {
        // When a nested item (project/invoice) is modified/deleted, refresh the selected client
        if (selectedClient && selectedClient.id) {
            try {
                const freshClient = await api.clients.getById(selectedClient.id);
                setSelectedClient(freshClient);
                // Return to client view after nested item change
                setViewSubMode('client');
                setSubViewData(null);
            } catch (error) {
                console.error('Failed to refresh client data', error);
            }
        }
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
            await api.clients.update(statusClient.id, { status: newStatus });
            setStatusModalOpen(false);
            setStatusClient(null);
            loadClients();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // Nested Navigation
    const handleNestedNavigate = (mode, data) => {
        if (mode === 'edit-project') {
            setViewSubMode('project');
            setSubViewData(data);
            setDrawerMode('edit');
        } else if (mode === 'edit-invoice') {
            setViewSubMode('invoice');
            setSubViewData(data);
            setDrawerMode('edit');
        } else {
            setViewSubMode(mode);
            setSubViewData(data);
            setDrawerMode('view');
        }
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

    const sortedClients = [...clients].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle budget sorting
        if (sortConfig.key === 'budget') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        // Handle project count sorting
        if (sortConfig.key === 'projectCount') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        // String comparison for name, email, status
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Apply filters
    const applyFilters = (clients) => {
        return clients.filter(client => {
            // Status filter
            if (filters.status.length > 0 && !filters.status.includes(client.status.toLowerCase())) {
                return false;
            }
            // Search filter
            if (searchTerm && !(
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(searchTerm.toLowerCase())
            )) {
                return false;
            }
            return true;
        });
    };

    const filteredClients = applyFilters(sortedClients);

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
                    <button className="btn-secondary" onClick={() => setFilterModalOpen(true)}>
                        <Filter size={18} />
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
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Name {getSortIcon('name')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Contact {getSortIcon('email')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('budget')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Budget {getSortIcon('budget')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('projectCount')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Projects {getSortIcon('projectCount')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
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
                                            {(client.contactNumber || client.phone) && (
                                                <div className="contact-item">
                                                    <Phone size={12} /> {client.contactNumber || client.phone}
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

            {/* Filter Modal */}
            {filterModalOpen && (
                <div className="modal-overlay" onClick={() => setFilterModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Filter Clients</h3>
                            <button onClick={() => setFilterModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Status</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {['active', 'inactive', 'archived'].map(status => (
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
                            <p>Modifying status for <b>{statusClient?.name}</b></p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
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
                                onClose={handleDrawerClose}
                                onDeleteSuccess={handleDeleteSuccess}
                            />
                        )}
                        {viewSubMode === 'project' && (
                            <ProjectDetail
                                projectData={subViewData}
                                isDrawer={true}
                                isNested={true}
                                onEdit={(e, proj) => handleNestedNavigate('edit-project', proj)}
                                onDeleteSuccess={handleNestedItemChange}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceDetail
                                invoiceData={subViewData}
                                isDrawer={true}
                                onDeleteSuccess={handleNestedItemChange}
                            />
                        )}
                    </>
                )}
                {drawerMode === 'edit' && (
                    <>
                        {viewSubMode === 'client' && (
                            <ClientForm
                                initialData={selectedClient}
                                onSuccess={handleFormSuccess}
                                onCancel={selectedClient ? () => setDrawerMode('view') : handleDrawerClose}
                            />
                        )}
                        {viewSubMode === 'project' && (
                            <ProjectForm
                                initialData={subViewData}
                                onSuccess={() => {
                                    handleNestedItemChange();
                                }}
                                onCancel={() => setDrawerMode('view')}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceForm
                                initialData={subViewData}
                                onSuccess={() => {
                                    handleNestedItemChange();
                                }}
                                onCancel={() => setDrawerMode('view')}
                            />
                        )}
                    </>
                )}
            </RightDrawer>
        </div>
    );
}
