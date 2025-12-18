import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, RefreshCw, Edit2 } from 'lucide-react';
import { api } from '../../services/api';
import './ClientDetail.css';

export default function ClientDetail({ clientData, isDrawer = false, onEdit, onStatusUpdate, onNavigate }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(clientData || null);
    const [loading, setLoading] = useState(!clientData);

    const handleEdit = () => {
        if (onEdit) onEdit(null, client);
        else console.log('Edit clicked in standalone mode');
    };

    const handleStatus = () => {
        if (onStatusUpdate) onStatusUpdate(null, client);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // If we have full data passed in, use it, but we might still need to fetch related items if they are missing
                let currentClient = clientData;

                if (!currentClient && id) {
                    currentClient = await api.clients.getById(id);
                }

                if (currentClient) {
                    // Fetch related data if not present
                    if (!currentClient.projects || !currentClient.invoices) {
                        const [allProjects, allInvoices] = await Promise.all([
                            api.projects.getAll(),
                            api.invoices.getAll()
                        ]);

                        const relatedProjects = allProjects.filter(p =>
                            String(p.clientId) === String(currentClient.id) ||
                            p.client === currentClient.name
                        );

                        const relatedInvoices = allInvoices.filter(inv =>
                            String(inv.clientId) === String(currentClient.id) ||
                            inv.client === currentClient.name
                        );

                        currentClient = {
                            ...currentClient,
                            projects: relatedProjects,
                            invoices: relatedInvoices
                        };
                    }
                    setClient(currentClient);
                }
            } catch (error) {
                console.error('Failed to load client data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, clientData]);

    if (loading) return <div className="loading-state">Loading Client Details...</div>;
    if (!client) return <div className="error-state">Client not found</div>;

    return (
        <div className={`client-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header">
                {!isDrawer && (
                    <button className="back-btn" onClick={() => navigate('/clients')}>
                        <ArrowLeft size={20} />
                        Back to Clients
                    </button>
                )}
                <div className="header-container-flex" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-content" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="avatar-lg" style={{ width: '64px', height: '64px', fontSize: '24px' }}>{client.name.charAt(0)}</div>
                        <div className="title-info">
                            <h1>{client.name}</h1>
                            <span className={`status-badge ${client.status.toLowerCase()}`}>{client.status}</span>
                        </div>
                    </div>
                    <div className="header-actions-right">
                        <button className="icon-btn" onClick={handleStatus} title="Update Status">
                            <RefreshCw size={20} />
                        </button>
                        <button className="icon-btn" onClick={handleEdit} title="Edit">
                            <Edit2 size={20} />
                        </button>
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
                        <span className="amount">{(client.budget / 1000).toFixed(2)}K</span>
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
                                <div
                                    key={p.id}
                                    className="list-item clickable"
                                    onClick={() => onNavigate && onNavigate('project', p)}
                                    style={{ cursor: onNavigate ? 'pointer' : 'default' }}
                                >
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
                                <div
                                    key={inv.id}
                                    className="list-item clickable"
                                    onClick={() => onNavigate && onNavigate('invoice', inv)}
                                    style={{ cursor: onNavigate ? 'pointer' : 'default' }}
                                >
                                    <span className="item-name">{inv.invoiceNumber || inv.id?.substring(0, 8) + '...'}</span>
                                    <span className="item-amount">₹{inv.amount.toLocaleString()}</span>
                                    <span className={`status-badge-sm ${inv.status}`}>{inv.status}</span>
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
