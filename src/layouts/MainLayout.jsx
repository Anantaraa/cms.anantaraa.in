import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopHeader from '../components/layout/TopHeader';
import './MainLayout.css';

export default function MainLayout({ pageTitle = 'Dashboard' }) {
    return (
        <div className="main-layout">
            <Sidebar />
            <div className="main-content-wrapper">
                <TopHeader title={pageTitle} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
