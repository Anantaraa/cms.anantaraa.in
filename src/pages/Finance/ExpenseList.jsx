import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, MoreHorizontal, Filter, ChevronUp, ChevronDown, X } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import ExpenseForm from './ExpenseForm';
import ExpenseDetail from './ExpenseDetail';
import DateInput from '../../components/common/DateInput';
import './Finance.css';

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Filter State
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: [],
        dateFrom: '',
        dateTo: ''
    });

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

    const handleDeleteSuccess = () => {
        loadExpenses(); // Refresh list
        handleDrawerClose();
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const sortedExpenses = [...expenses].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert to numbers for numeric fields
        if (sortConfig.key === 'amount') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        }

        // String comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = (bValue || '').toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Apply filters
    const applyFilters = (expenseItems) => {
        return expenseItems.filter(item => {
            // Status filter
            if (filters.status.length > 0 && !filters.status.includes(item.status.toLowerCase())) {
                return false;
            }
            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                const itemDate = new Date(item.expenseDate || item.date);
                if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
                    return false;
                }
                if (filters.dateTo && itemDate > new Date(filters.dateTo)) {
                    return false;
                }
            }
            // Search filter
            if (searchTerm && !(
                (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.responsiblePerson?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.project?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            )) {
                return false;
            }
            return true;
        });
    };

    const filteredExpenses = applyFilters(sortedExpenses);

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            const newStatus = filters.status.includes(value)
                ? filters.status.filter(s => s !== value)
                : [...filters.status, value];
            setFilters({ ...filters, status: newStatus });
        } else {
            setFilters({ ...filters, [type]: value });
        }
    };

    const clearFilters = () => {
        setFilters({ status: [], dateFrom: '', dateTo: '' });
    };

    const activeFilterCount = filters.status.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

    return (
        <div className="finance-page">
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
                <div className="action-buttons">
                    <button className="btn-secondary" onClick={() => setFilterModalOpen(true)}>
                        <Filter size={18} />
                        Filter
                        {activeFilterCount > 0 && (
                            <span style={{
                                marginLeft: '6px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button className="btn-primary" onClick={handleNewExpense}>
                        <Plus size={18} />
                        New Expense
                    </button>
                </div>
            </div>

            <div className="finance-table-container">
                {loading ? <div>Loading...</div> : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('expenseDate')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Date {getSortIcon('expenseDate')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('project')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Project {getSortIcon('project')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Description {getSortIcon('description')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('responsiblePerson')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Paid By {getSortIcon('responsiblePerson')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('amount')} className="text-right" style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                        Amount {getSortIcon('amount')}
                                    </div>
                                </th>
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

            {/* Filter Modal */}
            {filterModalOpen && (
                <div className="modal-overlay" onClick={() => setFilterModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Filter Expenses</h3>
                            <button onClick={() => setFilterModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Status</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {['pending', 'approved', 'rejected'].map(status => (
                                        <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={filters.status.includes(status)}
                                                onChange={() => handleFilterChange('status', status)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Date Range</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>From</label>
                                        <DateInput
                                            value={filters.dateFrom}
                                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>To</label>
                                        <DateInput
                                            value={filters.dateTo}
                                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={clearFilters}>Clear All</button>
                            <button className="btn-primary" onClick={() => setFilterModalOpen(false)}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

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
                        onDeleteSuccess={handleDeleteSuccess}
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
