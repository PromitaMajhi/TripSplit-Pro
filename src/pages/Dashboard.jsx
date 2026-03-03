import React, { useMemo } from 'react';
import { useTrip } from '../context/TripContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Plane } from 'lucide-react';
import StatCard from '../components/StatCard';
import SpendingChart from '../components/SpendingChart';
import ExpenseList from '../components/ExpenseList';
import SettlementSummary from '../components/SettlementSummary';
import Modal from '../components/Modal';

const Dashboard = () => {
    const { data, getCurrentTrip, addExpense } = useTrip();
    const navigate = useNavigate();
    const trip = getCurrentTrip();

    const [isModalOpen, setModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        amount: '',
        paidBy: '',
        splitBetweenIds: []
    });

    const expenses = useMemo(() => {
        if (!trip) return [];
        return data.expenses.filter(e => e.tripId === trip.id);
    }, [data.expenses, trip]);

    // Set default payer and split when trip changes or modal opens
    useEffect(() => {
        if (trip && trip.memberIds.length > 0) {
            setExpenseForm(prev => ({
                ...prev,
                paidBy: trip.memberIds[0],
                splitBetweenIds: [...trip.memberIds]
            }));
        }
    }, [trip, isModalOpen]);

    const stats = useMemo(() => {
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const perPerson = trip && trip.memberIds.length ? total / trip.memberIds.length : 0;
        return { total, perPerson };
    }, [expenses, trip]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (expenseForm.splitBetweenIds.length === 0) {
            alert('Please select at least one person to split with!');
            return;
        }
        addExpense({
            ...expenseForm,
            tripId: trip.id,
            date: new Date().toISOString()
        });
        setModalOpen(false);
        setExpenseForm({ title: '', amount: '', paidBy: trip.memberIds[0], splitBetweenIds: [...trip.memberIds] });
    };

    const toggleSplitMember = (id) => {
        setExpenseForm(prev => ({
            ...prev,
            splitBetweenIds: prev.splitBetweenIds.includes(id)
                ? prev.splitBetweenIds.filter(mid => mid !== id)
                : [...prev.splitBetweenIds, id]
        }));
    };

    if (!trip) {
        return (
            <div className="flex-center flex-col text-center py-xl animate-in" style={{ minHeight: '60vh' }}>
                <div className="glass p-xl mb-xl flex-center" style={{ borderRadius: '50%', width: 120, height: 120, fontSize: '3rem' }}>✈️</div>
                <h2 className="h2 mb-md">Welcome to TripSplit Pro!</h2>
                <p className="text-secondary max-w-sm mb-xl">Your adventure starts here. Create a trip to track expenses, split costs with friends, and see where your money goes.</p>
                <button className="btn-primary py-lg px-xl" onClick={() => navigate('/create-trip')}>✨ Create Your First Trip</button>
            </div>
        );
    }

    const currencySymbol = data.settings.currency === 'INR' ? '₹' : (data.settings.currency === 'USD' ? '$' : '€');

    return (
        <div className="flex-col gap-xl animate-in">
            <div className="grid-2 gap-xl">
                <StatCard
                    label="Total Trip Expense"
                    value={`${currencySymbol}${stats.total.toLocaleString()}`}
                    subtext={trip.location}
                    gradient="gradient-1"
                />
                <StatCard
                    label="Per Person Share"
                    value={`${currencySymbol}${stats.perPerson.toLocaleString()}`}
                    subtext={`${trip.memberIds.length} members active`}
                    gradient="glass"
                    badge={trip.memberIds.length}
                />
            </div>

            <div className="card glass p-xl">
                <div className="flex-between mb-xl">
                    <h3 className="h4">Daily Spending Trend</h3>
                    <span className="badge text-xs">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                </div>
                <SpendingChart expenses={expenses} currency={data.settings.currency} />
            </div>

            <div className="grid-2 gap-xl items-start">
                <div className="expense-records">
                    <div className="flex-between mb-lg">
                        <h3 className="h4">Expense Records</h3>
                        <button className="btn-secondary text-xs py-xs px-md flex-center gap-xs" onClick={() => setModalOpen(true)}>
                            <Plus size={14} /> Add New
                        </button>
                    </div>
                    <ExpenseList expenses={expenses} currency={data.settings.currency} />
                </div>
                <div className="settlement-summary">
                    <div className="flex-between mb-lg">
                        <h3 className="h4">Settlement Summary</h3>
                        <button className="btn-outline text-xs py-xs px-md flex-center gap-xs">
                            <Send size={14} /> Send WhatsApp
                        </button>
                    </div>
                    <SettlementSummary trip={trip} expenses={expenses} currency={data.settings.currency} />
                </div>
            </div>

            <Modal title="Add New Expense" isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleAddExpense} className="flex-col gap-lg">
                    <div className="form-group">
                        <label>Expense Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Dinner at Beach"
                            value={expenseForm.title}
                            onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="number"
                            required
                            placeholder="0.00"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label>Paid By</label>
                        <select
                            required
                            value={expenseForm.paidBy}
                            onChange={e => setExpenseForm(prev => ({ ...prev, paidBy: e.target.value }))}
                        >
                            {data.members.filter(m => trip.memberIds.includes(m.id)).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Split Between</label>
                        <div className="flex-col gap-sm mt-sm">
                            {data.members.filter(m => trip.memberIds.includes(m.id)).map(m => (
                                <label key={m.id} className="flex-between" style={{ fontWeight: 400, cursor: 'pointer' }}>
                                    <span>{m.name}</span>
                                    <input
                                        type="checkbox"
                                        checked={expenseForm.splitBetweenIds.includes(m.id)}
                                        onChange={() => toggleSplitMember(m.id)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full mt-lg py-md">Add Expense</button>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
