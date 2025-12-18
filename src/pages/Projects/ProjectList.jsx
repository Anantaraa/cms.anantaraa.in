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
            await api.projects.update(statusProject.id, { ...statusProject, status: newStatus });
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

    const filteredProjects = filter === 'All'
        ? projects
        : projects.filter(p => p.status === filter);

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
                <button className="btn-primary" onClick={handleNewProject}>
                    <Plus size={18} /> New Project
                </button>
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
                            <span>{formatDate(project.startDate)} — {formatDate(project.endDate)}</span>
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
                                <option value="Planning">Planning</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Halted">Halted</option>
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
                    <ProjectDetail
                        projectData={selectedProject}
                        isDrawer={true}
                        onEdit={handleEditProject}
                        onStatusUpdate={openStatusModal}
                        activeView={viewSubMode}
                        subViewData={subViewData}
                        onNavigate={handleNestedNavigate}
                    />
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
                                    // Maybe refresh projects too if client name changed?
                                    setDrawerMode('view'); // Go back to viewing client
                                    // Ideally refresh client data
                                }}
                                onCancel={() => setDrawerMode('view')}
                            />
                        )}
                        {viewSubMode === 'invoice' && (
                            <InvoiceForm
                                initialData={subViewData}
                                onSuccess={() => setDrawerMode('view')}
                                onCancel={() => setDrawerMode('view')}
                            />
                        )}
                    </>
                )}
            </RightDrawer>
        </div>
    );
}
