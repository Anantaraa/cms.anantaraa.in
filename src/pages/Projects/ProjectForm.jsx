import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './ProjectForm.css'; // Assuming you have or will create this, otherwise reuse common styles

export default function ProjectForm() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        status: 'Planning',
        start_date: '',
        end_date: '',
        description: '',
        budget: '',
        location: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadClients = async () => {
            const data = await api.clients.getAll();
            setClients(data);
        };
        loadClients();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.projects.create(formData);
            navigate('/projects');
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="project-form-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/projects')}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h2>New Project</h2>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
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
                                <option value="Planning">Planning</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Halted">Halted</option>
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
                            <label>End Date (Est.)</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Project details..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/projects')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
