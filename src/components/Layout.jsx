import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useTrip } from '../context/TripContext';

const Layout = ({ children }) => {
    const { data } = useTrip();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    React.useEffect(() => {
        const theme = data.settings.theme;
        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);
    }, [data.settings.theme]);

    return (
        <div className="app-container">
            <div
                id="sidebar-overlay"
                className={isSidebarOpen ? 'show' : ''}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <header className="mobile-header">
                <div className="logo h4 font-bold gradient-text">TripSplit Pro</div>
                <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="main-content">
                <div className="view-container animate-in">
                    {children}
                </div>
            </main>

            <div id="toast-container"></div>
        </div>
    );
};

export default Layout;
