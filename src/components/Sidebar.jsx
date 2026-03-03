import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings as SettingsIcon, PlusCircle } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    return (
        <aside id="sidebar" className={isOpen ? 'open' : ''}>
            <div className="sidebar-header">
                <div className="logo h3 font-bold gradient-text">TripSplit Pro</div>
                <div className="text-xs text-muted">Premium Expense Multiplier</div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/members" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <Users size={20} />
                    <span>Members</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <SettingsIcon size={20} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/create-trip" className="btn-primary w-full flex-center gap-sm py-md" onClick={onClose}>
                    <PlusCircle size={18} />
                    <span>New Trip</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
