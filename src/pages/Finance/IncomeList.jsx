import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, MoreHorizontal, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import IncomeForm from './IncomeForm';
import IncomeDetail from './IncomeDetail';
import './Finance.css';

export default function IncomeList() {
    const [income, setIncome] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedIncome, setSelectedIncome] = useState(null);

    // Menu State
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        loadIncome();
    }, []);

    const loadIncome = async () => {
        try {
            const data = await api.income.getAll();
            setIncome(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleNewIncome = () => {
        setSelectedIncome(null);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleEditIncome = (e, item) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedIncome(item);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handlePrint = (e, item) => {
        if (e && e.stopPropagation) e.stopPropagation();
        window.print(); // Simplistic print for now, ideally use PrintableInvoice adaptation
    };

    const toggleMenu = (e, id) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setTimeout(() => setSelectedIncome(null), 300);
    };

    const handleFormSuccess = () => {
        loadIncome();
        handleDrawerClose();
    };

    const filteredIncome = income.filter(item =>
        (item.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.project?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="finance-page">
            <div className="page-header">
                <h1>Income</h1>
            </div>

            <div className="page-actions">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search income..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={handleNewIncome}>
                    <Plus size={18} /> New Income
                </button>
            </div>

            <div className="finance-table-container">
                {loading ? <div>Loading...</div> : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Invoice</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th className="text-right">Amount</th>
                                <th className="action-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIncome.map(item => (
                                <tr key={item.id} onClick={() => { setSelectedIncome(item); setDrawerMode('view'); setDrawerOpen(true); }}>
                                    <td>{formatDate(item.receivedDate || item.date)}</td>
                                    <td>{item.client || 'N/A'}</td>
                                    <td className="text-muted">{item.project || item.description || 'Other Income'}</td>
                                    <td>{item.invoiceNumber || '-'}</td>
                                    <td>{item.paymentMethod || item.method}</td>
                                    <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                                    <td className="text-right text-success font-medium">₹{(item.amountReceived || item.amount || 0).toLocaleString()}</td>
                                    <td className="action-col">
                                        <div className="action-flex">
                                            <button
                                                className="icon-btn-sm"
                                                onClick={(e) => handleEditIncome(e, item)}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="icon-btn-sm"
                                                onClick={(e) => handlePrint(e, item)}
                                                title="Print"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <div className="menu-wrapper">
                                                <button
                                                    className="icon-btn-sm"
                                                    onClick={(e) => toggleMenu(e, item.id)}
                                                    title="More Actions"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {activeMenu === item.id && (
                                                    <div className="dropdown-menu">
                                                        <button onClick={(e) => handleEditIncome(e, item)}>
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

            <RightDrawer
                isOpen={drawerOpen}
                onClose={handleDrawerClose}
                title={drawerMode === 'view' ? 'Income Details' : (selectedIncome ? 'Edit Income' : 'New Income')}
                width="50%"
            >
                {drawerMode === 'view' && selectedIncome && (
                    <IncomeDetail
                        incomeData={selectedIncome}
                        isDrawer={true}
                        onEdit={handleEditIncome}
                        onPrint={handlePrint}
                    />
                )}
                {drawerMode === 'edit' && (
                    <IncomeForm
                        initialData={selectedIncome}
                        onSuccess={handleFormSuccess}
                        onCancel={handleDrawerClose}
                    />
                )}
            </RightDrawer>
        </div>
    );
}
