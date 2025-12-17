import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText } from 'lucide-react';
import { api } from '../../services/api';
import './ClientDetail.css';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await api.clients.getById(id);
                setClient(data);
            } catch (error) {
                console.error('Failed to fetch client', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [id]);

    if (loading) return <div className="loading-state">Loading Client Details...</div>;
    if (!client) return <div className="error-state">Client not found</div>;

    return (
        <div className="client-detail-page">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={20} />
                    Back to Clients
                </button>
                <div className="header-content">
                    <div className="avatar-lg">{client.name.charAt(0)}</div>
                    <div className="title-info">
                        <h1>{client.name}</h1>
                        <span className={`status-badge ${client.status.toLowerCase()}`}>{client.status}</span>
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                <div className="info-card">
                    <h3>Contact Information</h3>
                    <div className="info-list">
                        <div className="info-item">
                            <Mail size={18} />
                            <span>{client.email}</span>
                        </div>
                        <div className="info-item">
                            <Phone size={18} />
                            <span>{client.phone}</span>
                        </div>
                        <div className="info-item">
                            <MapPin size={18} />
                            <span>{client.address || 'No address provided'}</span>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <h3>Budget Overview</h3>
                    <div className="budget-display">
                        <span className="currency">₹</span>
                        <span className="amount">{(client.budget / 100000).toFixed(2)}L</span>
                        <span className="label">Planned Budget</span>
                    </div>

                    <div className="divider"></div>

                    <h3>Notes</h3>
                    <p className="notes-text">{client.notes}</p>
                </div>

                <div className="related-lists">
                    <div className="section-card">
                        <div className="card-header">
                            <Building size={18} />
                            <h3>Projects</h3>
                        </div>
                        <div className="simple-list">
                            {client.projects && client.projects.map(p => (
                                <div key={p.id} className="list-item">
                                    <span className="item-name">{p.name}</span>
                                    <span className="item-meta">{p.status}</span>
                                </div>
                            ))}
                            {(!client.projects || client.projects.length === 0) && <p className="empty-text">No projects linked.</p>}
                        </div>
                    </div>

                    <div className="section-card">
                        <div className="card-header">
                            <FileText size={18} />
                            <h3>Recent Invoices</h3>
                        </div>
                        <div className="simple-list">
                            {client.invoices && client.invoices.map(inv => (
                                <div key={inv.id} className="list-item">
                                    <span className="item-name">{inv.id}</span>
                                    <span className="item-amount">₹{inv.amount.toLocaleString()}</span>
                                    <span className={`status-dot ${inv.status}`}></span>
                                </div>
                            ))}
                            {(!client.invoices || client.invoices.length === 0) && <p className="empty-text">No invoices found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
