import React from 'react';
import { useTrip } from '../context/TripContext';

const getCategoryIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('food') || t.includes('eat') || t.includes('dinner')) return '🍔';
    if (t.includes('fuel') || t.includes('petrol') || t.includes('gas')) return '⛽';
    if (t.includes('hotel') || t.includes('stay') || t.includes('room')) return '🏨';
    if (t.includes('ticket') || t.includes('flight') || t.includes('train')) return '🎫';
    if (t.includes('drink') || t.includes('beer') || t.includes('bar')) return '🍻';
    return '💸';
};

const ExpenseList = ({ expenses, currency }) => {
    const { data } = useTrip();
    const currencySymbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : '€');

    if (expenses.length === 0) {
        return (
            <div className="card glass text-center py-xl text-secondary">No expenses yet.</div>
        );
    }

    const grouped = expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
        .reduce((acc, exp) => {
            const date = new Date(exp.date).toLocaleDateString('en-IN', { dateStyle: 'long' });
            if (!acc[date]) acc[date] = [];
            acc[date].push(exp);
            return acc;
        }, {});

    return (
        <div className="flex-col gap-lg">
            {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="expense-group">
                    <div className="text-xs text-muted mb-sm uppercase font-bold tracking-wider">{date}</div>
                    <div className="flex-col gap-sm">
                        {items.map(exp => {
                            const payer = data.members.find(m => m.id === exp.paidBy);
                            return (
                                <div key={exp.id} className="card glass animate-in p-md flex-between" style={{ cursor: 'pointer' }}>
                                    <div className="flex-center gap-md">
                                        <div className="avatar-sm flex-center">{getCategoryIcon(exp.title)}</div>
                                        <div>
                                            <strong className="block text-sm">{exp.title}</strong>
                                            <span className="text-xs text-secondary">Paid by {payer ? payer.name : 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold gradient-text">{currencySymbol}{parseFloat(exp.amount).toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExpenseList;
