import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckSquare, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import './ProjectDetail.css';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await api.projects.getById(id);
                setProject(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="project-detail-page">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate('/projects')}>
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="header-main">
                    <div>
                        <h1>{project.name}</h1>
                        <p className="subtitle">{project.client} • {project.type}</p>
                    </div>
                    <span className={`status-badge-lg ${project.status}`}>{project.status}</span>
                </div>
            </div>

            <div className="project-grid">
                <div className="main-col">
                    <div className="card overview-card">
                        <h3>Overview</h3>
                        <p className="desc">{project.description}</p>
                        <div className="meta-row">
                            <div className="meta-item">
                                <MapPin size={16} /> {project.location}
                            </div>
                            <div className="meta-item">
                                <Calendar size={16} /> {project.startDate} — {project.endDate}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Financials</h3>
                        <div className="financial-row">
                            <div className="fin-stat">
                                <span className="label">Total Budget</span>
                                <span className="val">₹{(project.budget / 100000).toFixed(2)}L</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Income</span>
                                <span className="val success">₹{(project.income / 100000).toFixed(2)}L</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Expense</span>
                                <span className="val danger">₹{(project.expense / 100000).toFixed(2)}L</span>
                            </div>
                            <div className="fin-stat">
                                <span className="label">Net Profit</span>
                                <span className="val">₹{((project.income - project.expense) / 100000).toFixed(2)}L</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="side-col">
                    <div className="card">
                        <h3>Team</h3>
                        <div className="team-list">
                            {project.team.map((member, i) => (
                                <div key={i} className="team-member">
                                    <div className="avatar-xs">{member.charAt(0)}</div>
                                    <span>{member}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
