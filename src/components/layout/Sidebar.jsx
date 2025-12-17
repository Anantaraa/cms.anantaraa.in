import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Folder,
    FileText,
    Wallet,
    Receipt,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Building2
} from 'lucide-react';
import clsx from 'clsx';
import './Sidebar.css';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/clients', icon: Users, label: 'Clients' },
        { to: '/projects', icon: Folder, label: 'Projects' },
        { to: '/invoices', icon: FileText, label: 'Invoices' },
        { to: '/income', icon: Wallet, label: 'Income' },
        { to: '/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
    ];

    return (
        <aside className={clsx("sidebar", { collapsed })}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <Building2 className="logo-icon" />
                    <span className="logo-text">ARCH.CMS</span>
                </div>
                <button
                    className="collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => clsx("nav-item", { active: isActive })}
                        title={collapsed ? item.label : ''}
                    >
                        <item.icon className="nav-icon" size={20} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">AD</div>
                    <div className="user-info">
                        <span className="user-name">Admin User</span>
                        <span className="user-role">Architect</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
