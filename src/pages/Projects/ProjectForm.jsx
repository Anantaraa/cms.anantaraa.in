import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './ProjectForm.css'; // Assuming you have or will create this, otherwise reuse common styles


export default function ProjectForm({ initialData, onSuccess, onCancel }) {
    const navigate = useNavigate();
    const isEditMode = !!initialData;
    const [clients, setClients] = useState([]);

    // Initialize state with API-compatible keys
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        location: initialData?.location || '',
        type: initialData?.type || '',
        status: initialData?.status || 'planned',
        client_id: initialData?.clientId || initialData?.client_id || '',
        start_date: initialData?.startDate || initialData?.start_date || '',
        expected_end_date: initialData?.endDate || initialData?.expected_end_date || '',
        project_value: initialData?.projectValue || initialData?.project_value || '',
        ...(initialData || {})
    });
    const [loading, setLoading] = useState(false);

    // Debug logging
    console.log("ProjectForm rendering", { isEditMode, initialData });

    useEffect(() => {
        const loadClients = async () => {
            console.log("Loading clients...");
            try {
                const data = await api.clients.getAll();
                console.log("Clients loaded:", data);
                setClients(data);
            } catch (e) {
                console.error("Error loading clients:", e);
            }
        };
        loadClients();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitting...", formData);
        setLoading(true);
        try {
            let result;
            if (isEditMode) {
                console.log("Updating project:", initialData.id);
                result = await api.projects.update(initialData.id, formData);
            } else {
                console.log("Creating project");
                result = await api.projects.create(formData);
            }
            console.log("API Success:", result);

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error('Failed to save project', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log("Field change:", name, value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="project-form-page">
            {!onCancel && (
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/projects')}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h2>{isEditMode ? 'Edit Project' : 'New Project'}</h2>
                </div>
            )}

            <div className={`form-container ${onCancel ? 'drawer-form' : ''}`}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label>Project Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Modern Villa Design"
                            />
                        </div>

                        <div className="form-field">
                            <label>Client</label>
                            <select
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="planned">Planning</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Expected End Date</label>
                            <input
                                type="date"
                                name="expected_end_date"
                                value={formData.expected_end_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Project Value</label>
                            <input
                                name="project_value"
                                type="number"
                                value={formData.project_value}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        <div className="form-field">
                            <label>Type</label>
                            <input
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                placeholder="e.g. Interior, Structure"
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Location</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Project Address"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel || (() => navigate('/projects'))}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : (isEditMode ? 'Update Project' : 'Save Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
