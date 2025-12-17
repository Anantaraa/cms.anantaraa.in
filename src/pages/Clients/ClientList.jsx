import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail } from 'lucide-react';
import { api } from '../../services/api';
import './ClientList.css';

export default function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="client-list-page">
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
                    <button className="btn-primary" onClick={() => navigate('/clients/new')}>
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
                                <th className="action-col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr
                                    key={client.id}
                                    onClick={() => navigate(`/clients/${client.id}`)}
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
                                            <div className="contact-item">
                                                <Phone size={12} /> {client.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="font-mono">₹{(client.budget / 100000).toFixed(1)}L</td>
                                    <td>{client.projectCount}</td>
                                    <td>
                                        <span className={`status-badge ${client.status.toLowerCase()}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="action-col">
                                        <button className="icon-btn-sm">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
