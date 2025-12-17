import React from 'react';
import { Bell, Search } from 'lucide-react';
import './TopHeader.css';

export default function TopHeader({ title }) {
    return (
        <header className="top-header">
            <div className="header-title">
                <h1>{title}</h1>
            </div>

            <div className="header-actions">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search..." />
                </div>

                <button className="icon-btn">
                    <Bell size={20} />
                    <span className="badge">2</span>
                </button>
            </div>
        </header>
    );
}
