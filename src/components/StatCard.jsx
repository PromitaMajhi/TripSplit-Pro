import React from 'react';

const StatCard = ({ label, value, subtext, gradient, badge }) => {
    return (
        <div className={`card stat-card float ${gradient} p-xl animate-scale-up`}>
            <div className="flex-between">
                <div>
                    <span className="text-sm uppercase opacity-80">{label}</span>
                    <h3 className={gradient === 'gradient-1' ? 'h1 mt-sm' : 'h2 mt-sm'}>{value}</h3>
                    <div className="mt-md text-xs opacity-70">{subtext}</div>
                </div>
                {badge !== undefined && (
                    <div className="h3 gradient-text">{badge}</div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
