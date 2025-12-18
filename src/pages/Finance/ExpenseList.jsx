import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, MoreHorizontal } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import ExpenseForm from './ExpenseForm';
import ExpenseDetail from './ExpenseDetail';
import './Finance.css';

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('view'); // 'view' or 'edit'
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Menu State
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const data = await api.expenses.getAll();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleNewExpense = () => {
        setSelectedExpense(null);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };

    const handleEditExpense = (e, item) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedExpense(item);
        setDrawerMode('edit');
        setDrawerOpen(true);
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
        setTimeout(() => setSelectedExpense(null), 300);
    };

    const handleFormSuccess = () => {
        loadExpenses();
        handleDrawerClose();
    };

    const filteredExpenses = expenses.filter(item =>
        (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.responsiblePerson?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.project?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="finance-page">
            <div className="page-header">
                <h1>Expenses</h1>
            </div>

            <div className="page-actions">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={handleNewExpense}>
                    <Plus size={18} /> New Expense
                </button>
            </div>

            <div className="finance-table-container">
                {loading ? <div>Loading...</div> : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Project</th>
                                <th>Description</th>
                                <th>Paid By</th>
                                <th>Status</th>
                                <th className="text-right">Amount</th>
                                <th className="action-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(item => (
                                <tr key={item.id} onClick={() => { setSelectedExpense(item); setDrawerMode('view'); setDrawerOpen(true); }}>
                                    <td>{formatDate(item.expenseDate || item.date)}</td>
                                    <td>{item.project || 'N/A'}</td>
                                    <td>{item.description}</td>
                                    <td>{item.responsiblePerson}</td>
                                    <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                                    <td className="text-right text-danger font-medium">₹{item.amount.toLocaleString()}</td>
                                    <td className="action-col">
                                        <div className="action-flex">
                                            <button
                                                className="icon-btn-sm"
                                                onClick={(e) => handleEditExpense(e, item)}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
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
                                                        <button onClick={(e) => handleEditExpense(e, item)}>
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
                title={drawerMode === 'view' ? 'Expense Details' : (selectedExpense ? 'Edit Expense' : 'New Expense')}
                width="50%"
            >
                {drawerMode === 'view' && selectedExpense && (
                    <ExpenseDetail
                        expenseData={selectedExpense}
                        isDrawer={true}
                        onEdit={handleEditExpense}
                    />
                )}
                {drawerMode === 'edit' && (
                    <ExpenseForm
                        initialData={selectedExpense}
                        onSuccess={handleFormSuccess}
                        onCancel={handleDrawerClose}
                    />
                )}
            </RightDrawer>
        </div>
    );
}
