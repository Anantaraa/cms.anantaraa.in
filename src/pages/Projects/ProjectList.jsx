import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Calendar, Edit2, RefreshCw, MoreHorizontal, X } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import ProjectDetail from './ProjectDetail';
import ProjectForm from './ProjectForm';
import ClientDetail from '../Clients/ClientDetail'; // Needed if we want to ensure imports are clean
import ClientForm from '../Clients/ClientForm';
import InvoiceDetail from '../Invoices/InvoiceDetail'; // Needed?
import InvoiceForm from '../Invoices/InvoiceForm';
import './ProjectList.css';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    // Date Filter State
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [dateFilters, setDateFilters] = useState({
        dateFrom: '',
        dateTo: ''
    });

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedProject, setSelectedProject] = useState(null);

    // Nested View State (Lifted from ProjectDetail)
    const [viewSubMode, setViewSubMode] = useState('project'); // 'project', 'client', 'invoice'
    const [subViewData, setSubViewData] = useState(null);

    // ... (Menu & Status State)
    const [activeMenu, setActiveMenu] = useState(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusProject, setStatusProject] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await api.projects.getAll();
            setProjects(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewProject = () => {
        setSelectedProject(null);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleViewProject = (project) => {
        setSelectedProject(project);
        setDrawerMode('view');
        setViewSubMode('project'); // Reset sub-view
        setDrawerOpen(true);
    };

    const handleEditProject = (e, project) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedProject(project);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            setSelectedProject(null);
            setViewSubMode('project');
            setDrawerMode('view');
            setSubViewData(null);
        }, 300);
    };

    const handleFormSuccess = () => {
        loadProjects();
        handleDrawerClose();
    };

    const handleDeleteSuccess = () => {
        loadProjects();
        handleDrawerClose();
    };

    const handleNestedItemChange = async () => {
        // When a nested item (client/invoice) is modified/deleted, refresh the selected project
        if (selectedProject && selectedProject.id) {
            try {
                const freshProject = await api.projects.getById(selectedProject.id);
                setSelectedProject(freshProject);
                // Return to project view after nested item change
                setViewSubMode('project');
                setSubViewData(null);
            } catch (error) {
                console.error('Failed to refresh project data', error);
            }
        }
    };

    // --- Action Handlers --- (toggleMenu, openStatusModal, handleUpdateStatus...)
    const toggleMenu = (e, id) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const openStatusModal = (e, project) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(null);
        setStatusProject(project);
        setNewStatus(project.status);
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusProject || !newStatus) return;
        try {
            await api.projects.update(statusProject.id, { status: newStatus });
            setStatusModalOpen(false);
            setStatusProject(null);
            loadProjects();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // Nested Navigation Handlers
    const handleNestedNavigate = (mode, data) => {
        if (mode === 'edit-client') {
            setViewSubMode('client');
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
        if (drawerMode === 'edit') {
            setDrawerMode('view'); // Switch back to view mode for the current item
        } else if (viewSubMode !== 'project') {
            setViewSubMode('project');
            setSubViewData(null);
        }
    };

    const getDrawerTitle = () => {
        if (viewSubMode === 'client') return drawerMode === 'edit' ? 'Edit Client' : 'Client Details';
        if (viewSubMode === 'invoice') return drawerMode === 'edit' ? 'Edit Invoice' : 'Invoice Details';
        // Default to project
        return drawerMode === 'edit' ? (selectedProject ? 'Edit Project' : 'New Project') : 'Project Details';
    };

    const statusColors = {
        'Ongoing': 'blue',
        'Planning': 'orange',
        'Completed': 'green',
        'Halted': 'red'
    };

    // Apply filters
    const applyFilters = (projectList) => {
        let result = projectList;

        // Status filter (from tabs)
        if (filter !== 'All') {
            result = result.filter(p => p.status === filter);
        }

        // Date range filter
        if (dateFilters.dateFrom || dateFilters.dateTo) {
            result = result.filter(p => {
                const projectStartDate = new Date(p.startDate);
                if (dateFilters.dateFrom && projectStartDate < new Date(dateFilters.dateFrom)) {
                    return false;
                }
                if (dateFilters.dateTo && projectStartDate > new Date(dateFilters.dateTo)) {
                    return false;
                }
                return true;
            });
        }

        return result;
    };

    const filteredProjects = applyFilters(projects);

    const handleDateFilterChange = (type, value) => {
        setDateFilters({ ...dateFilters, [type]: value });
    };

    const clearDateFilters = () => {
        setDateFilters({ dateFrom: '', dateTo: '' });
    };

    const activeDateFilterCount = (dateFilters.dateFrom ? 1 : 0) + (dateFilters.dateTo ? 1 : 0);

    return (
        <div className="project-list-page">
            {/* ... Page Actions (Tabs/New) ... */}
            <div className="page-actions">
                <div className="tabs">
                    {['All', 'Ongoing', 'Planning', 'Completed'].map(status => (
                        <button
                            key={status}
                            className={`tab-btn ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setFilterModalOpen(true)}>
                        <Filter size={18} />
                        Date Filter
                        {activeDateFilterCount > 0 && (
                            <span style={{
                                marginLeft: '6px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {activeDateFilterCount}
                            </span>
                        )}
                    </button>
                    <button className="btn-primary" onClick={handleNewProject}>
                        <Plus size={18} /> New Project
                    </button>
                </div>
            </div>

            {/* ... Grid ... */}
            <div className="projects-grid">
                {loading ? <div className="loading">Loading...</div> : filteredProjects.map(project => (
                    <div key={project.id} className="project-card" onClick={() => handleViewProject(project)}>
                        <div className="card-top">
                            <span className={`status-badge ${statusColors[project.status] || 'gray'}`}>{project.status}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="project-client">{project.client}</span>
                                <div className="action-flex-proj">
                                    <button
                                        className="icon-btn-sm"
                                        onClick={(e) => openStatusModal(e, project)}
                                        title="Update Status"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    <div className="menu-wrapper">
                                        <button
                                            className="icon-btn-sm"
                                            onClick={(e) => toggleMenu(e, project.id)}
                                            title="More Actions"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>
                                        {activeMenu === project.id && (
                                            <div className="dropdown-menu">
                                                <button onClick={(e) => handleEditProject(e, project)}>
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="project-name">{project.name}</h3>

                        <div className="project-dates">
                            <Calendar size={14} />
                            <span>{formatDate(project.startDate)} — {formatDate(project.expectedEndDate)}</span>
                        </div>

                        <div className="project-progress">
                            <div className="progress-bar">
                                <div className="fill" style={{ width: `${project.completion}%` }}></div>
                            </div>
                            <span className="progress-text">{project.completion}% Complete</span>
                        </div>

                        <div className="card-footer">
                            <div className="financial-mini">
                                <span className="label">Project Value</span>
                                <span className="value">₹{(project.projectValue / 1000).toFixed(1)}k</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Date Filter Modal */}
            {filterModalOpen && (
                <div className="modal-overlay" onClick={() => setFilterModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Filter by Date Range</h3>
                            <button onClick={() => setFilterModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Start Date Range</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>From</label>
                                        <input
                                            type="date"
                                            value={dateFilters.dateFrom}
                                            onChange={(e) => handleDateFilterChange('dateFrom', e.target.value)}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>To</label>
                                        <input
                                            type="date"
                                            value={dateFilters.dateTo}
                                            onChange={(e) => handleDateFilterChange('dateTo', e.target.value)}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={clearDateFilters}>Clear All</button>
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
                            <p>Modifying status for <b>{statusProject?.name}</b></p>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                <option value="planned">Planning</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
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
                onBack={(drawerMode === 'edit' && (selectedProject || subViewData)) || viewSubMode !== 'project' ? handleBack : null}
                title={getDrawerTitle()}
                width="50%"
            >
                {drawerMode === 'view' && selectedProject && (
                    <>
                        {viewSubMode === 'project' && (
                            <ProjectDetail
                                projectData={selectedProject}
                                isDrawer={true}
                                onEdit={handleEditProject}
                                onStatusUpdate={openStatusModal}
                                activeView={viewSubMode}
                                subViewData={subViewData}
                                onNavigate={handleNestedNavigate}
                                onClose={handleDrawerClose}
                                onDeleteSuccess={handleDeleteSuccess}
                            />
                        )}
                        {viewSubMode === 'client' && (
                            <ClientDetail
                                clientData={subViewData}
                                isDrawer={true}
                                isNested={true}
                                onEdit={(e, client) => handleNestedNavigate('edit-client', client)}
                                onDeleteSuccess={handleNestedItemChange}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceDetail
                                invoiceData={subViewData}
                                isDrawer={true}
                                onEdit={(e, invoice) => handleNestedNavigate('edit-invoice', invoice)}
                                onDeleteSuccess={handleNestedItemChange}
                            />
                        )}
                    </>
                )}
                {drawerMode === 'edit' && (
                    <>
                        {viewSubMode === 'project' && (
                            <ProjectForm
                                initialData={selectedProject}
                                onSuccess={handleFormSuccess}
                                onCancel={selectedProject ? () => setDrawerMode('view') : handleDrawerClose}
                            />
                        )}
                        {viewSubMode === 'client' && (
                            <ClientForm
                                initialData={subViewData}
                                onSuccess={() => {
                                    // Refresh project after client changes
                                    handleNestedItemChange();
                                }}
                                onCancel={() => setDrawerMode('view')}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceForm
                                initialData={subViewData}
                                onSuccess={() => {
                                    // Refresh project after invoice changes
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
