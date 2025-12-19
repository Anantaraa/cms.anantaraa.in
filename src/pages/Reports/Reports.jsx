import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { api } from '../../services/api';
import './Reports.css';

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);
    const [projectStatusData, setProjectStatusData] = useState([]);
    const [summaryMetrics, setSummaryMetrics] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        const fetchReportsData = async () => {
            try {
                const [incomeData, expenseData, projectsData, invoicesData] = await Promise.all([
                    api.income.getAll(),
                    api.expenses.getAll(),
                    api.projects.getAll(),
                    api.invoices.getAll()
                ]);

                // Calculate monthly income and expenses (last 6 months)
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentDate = new Date();
                const last6Months = [];

                for (let i = 5; i >= 0; i--) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                    const monthName = monthNames[date.getMonth()];
                    const year = date.getFullYear();
                    const month = date.getMonth();

                    // Calculate income for this month
                    const monthIncome = incomeData
                        .filter(inc => {
                            // Parse date (assuming dd/mm/yyyy format from API)
                            const dateStr = inc.receivedDate || inc.date;
                            if (!dateStr) return false;
                            const [day, monthPart, yearPart] = dateStr.split('/');
                            const incDate = new Date(yearPart, monthPart - 1, day);
                            return incDate.getMonth() === month && incDate.getFullYear() === year;
                        })
                        .reduce((sum, inc) => sum + (Number(inc.amount) || Number(inc.amountReceived) || 0), 0);

                    // Calculate expenses for this month
                    const monthExpense = expenseData
                        .filter(exp => {
                            const dateStr = exp.expenseDate || exp.date;
                            if (!dateStr) return false;
                            const [day, monthPart, yearPart] = dateStr.split('/');
                            const expDate = new Date(yearPart, monthPart - 1, day);
                            return expDate.getMonth() === month && expDate.getFullYear() === year;
                        })
                        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

                    last6Months.push({
                        name: monthName,
                        income: monthIncome,
                        expense: monthExpense
                    });
                }

                setMonthlyData(last6Months);

                // Calculate project status distribution
                const statusCounts = {};
                projectsData.forEach(project => {
                    const status = project.status || 'Unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });

                const statusData = Object.entries(statusCounts).map(([name, value]) => ({
                    name,
                    value
                }));

                setProjectStatusData(statusData);

                // Calculate summary metrics
                const totalIncome = incomeData.reduce((sum, inc) => sum + (Number(inc.amount) || Number(inc.amountReceived) || 0), 0);
                const totalExpense = expenseData.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
                const profit = totalIncome - totalExpense;
                const profitMargin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0;
                const avgProjectValue = projectsData.length > 0
                    ? projectsData.reduce((sum, p) => sum + (Number(p.projectValue) || Number(p.project_value) || 0), 0) / projectsData.length
                    : 0;

                setSummaryMetrics({
                    totalIncome,
                    totalExpense,
                    profitMargin,
                    avgProjectValue
                });

            } catch (error) {
                console.error('Failed to fetch reports data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportsData();
    }, []);

    if (loading) {
        return <div className="dashboard-loading">Loading Reports...</div>;
    }

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h2>Reports & Analytics</h2>
                <button className="btn-secondary">
                    <Download size={16} /> Export PDF
                </button>
            </div>

            <div className="reports-grid">
                <div className="report-card full-width">
                    <h3>Annual Income vs Expense</h3>
                    <div className="chart-container-lg">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="income" fill="var(--color-text-main)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="var(--color-text-muted)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="report-card">
                    <h3>Project Distributions</h3>
                    <div className="chart-container-md">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projectStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="legend">
                            {projectStatusData.map((entry, index) => (
                                <div key={index} className="legend-item">
                                    <span className="dot" style={{ background: COLORS[index % COLORS.length] }}></span>
                                    <span className="label">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-card">
                    <h3>Summary Metrics</h3>
                    <div className="metrics-list">
                        <div className="metric-item">
                            <span className="label">Total Income</span>
                            <span className="value">₹{summaryMetrics?.totalIncome?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Total Expense</span>
                            <span className="value">₹{summaryMetrics?.totalExpense?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Profit Margin</span>
                            <span className={`value ${Number(summaryMetrics?.profitMargin) > 0 ? 'success' : 'error'}`}>
                                {summaryMetrics?.profitMargin || '0'}%
                            </span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Avg. Project Value</span>
                            <span className="value">₹{summaryMetrics?.avgProjectValue?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
