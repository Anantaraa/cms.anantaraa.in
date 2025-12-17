import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Calendar, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import './ProjectList.css';

export default function ProjectList() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

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
                <button className="btn-primary" onClick={() => navigate('/projects/new')}>
                    <Plus size={18} /> New Project
                </button>
            </div>

            <div className="projects-grid">
                {loading ? <div className="loading">Loading...</div> : filteredProjects.map(project => (
                    <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                        <div className="card-top">
                            <span className={`status-badge ${statusColors[project.status]}`}>{project.status}</span>
                            <span className="project-client">{project.client}</span>
                        </div>

                        <h3 className="project-name">{project.name}</h3>

                        <div className="project-dates">
                            <Calendar size={14} />
                            <span>{project.startDate} — {project.endDate}</span>
                        </div>

                        <div className="project-progress">
                            <div className="progress-bar">
                                <div className="fill" style={{ width: `${project.completion}%` }}></div>
                            </div>
                            <span className="progress-text">{project.completion}% Complete</span>
                        </div>

                        <div className="card-footer">
                            <div className="financial-mini">
                                <span className="label">Profit</span>
                                <span className="value">₹{((project.income - project.expense) / 1000).toFixed(1)}k</span>
                            </div>
                            <div className="financial-mini">
                                <span className="label">Margin</span>
                                <span className="value">
                                    {project.income > 0 ? Math.round(((project.income - project.expense) / project.income) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
