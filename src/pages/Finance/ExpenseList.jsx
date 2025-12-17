import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import './Finance.css';

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.finance.getExpenses();
            setExpenses(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="finance-page">
            <div className="finance-header">
                <h2>Expenses</h2>
                <button className="btn-primary" onClick={() => window.location.href = '/expenses/new'}><Plus size={16} /> New Expense</button>
            </div>
            <div className="finance-table-container">
                {loading ? <div>Loading...</div> : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Responsible</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(item => (
                                <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td><span className="cat-badge">{item.category}</span></td>
                                    <td>{item.description}</td>
                                    <td>{item.responsible}</td>
                                    <td className="text-right text-danger font-medium">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
