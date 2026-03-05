import streamlit as st
import datetime
import uuid
import pandas as pd
from models import Member, Trip, Expense, Settings, Template
from store import Store

# Page Configuration
st.set_page_config(
    page_title="TripSplit Pro",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Store
if 'store' not in st.session_state:
    st.session_state.store = Store()

store = st.session_state.store

# Custom CSS for Glassmorphism & Premium UI
st.markdown("""
    <style>
    :root {
        --glass-bg: rgba(255, 255, 255, 0.1);
        --glass-border: rgba(255, 255, 255, 0.2);
        --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        --radius-md: 16px;
    }
    
    .stApp {
        background: radial-gradient(circle at top right, #1e1b4b, #030712);
        color: white;
    }
    
    [data-testid="stSidebar"] {
        background: rgba(15, 23, 42, 0.8) !important;
        backdrop-filter: blur(10px);
        border-right: 1px solid var(--glass-border);
    }
    
    .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 24px;
        margin-bottom: 16px;
    }
    
    .gradient-text {
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
    }
    
    .stat-card {
        text-align: center;
        padding: 20px;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        margin: 8px 0;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    button[kind="primary"] {
        background: var(--primary-gradient) !important;
        border: none !important;
        border-radius: 8px !important;
    }
    
    /* Hide default Streamlit elements for cleaner look */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    </style>
    """, unsafe_allow_html=True)

# Helper Functions
def get_currency_symbol():
    mapping = {"INR": "₹", "USD": "$", "EUR": "€"}
    return mapping.get(store.data.settings.currency, "₹")

# Sidebar Navigation
with st.sidebar:
    st.markdown("<h1 class='gradient-text'>TripSplit Pro</h1>", unsafe_allow_html=True)
    
    nav = st.radio("Navigation", ["Dashboard", "Members", "Settings"], label_visibility="collapsed")
    
    st.divider()
    
    current_trip = store.get_current_trip()
    if current_trip:
        st.info(f"📍 {current_trip.location}")
        if st.button("➕ Add Expense", use_container_width=True, type="primary"):
            st.session_state.show_expense_modal = True
    else:
        st.warning("No active trip. Create one to start!")

# View: Dashboard
if nav == "Dashboard":
    if not current_trip:
        st.markdown("### ✈️ Start a New Trip")
        with st.form("new_trip_form"):
            t_name = st.text_input("Trip Name", placeholder="e.g. Goa Vacation")
            t_loc = st.text_input("Location", placeholder="e.g. North Goa, India")
            col1, col2 = st.columns(2)
            t_start = col1.date_input("Start Date")
            t_end = col2.date_input("End Date")
            
            members = store.get_members()
            member_ids = [m.id for m in members]
            member_names = [m.name for m in members]
            
            selected_members = st.multiselect("Select Members", options=member_ids, format_func=lambda x: next(m.name for m in members if m.id == x), default=member_ids)
            
            submit = st.form_submit_button("Create Trip ✨", use_container_width=True)
            if submit:
                if not t_name or not selected_members:
                    st.error("Please provide a name and select members.")
                else:
                    new_trip = Trip(
                        id=str(uuid.uuid4()),
                        name=t_name,
                        location=t_loc,
                        startDate=t_start.isoformat(),
                        endDate=t_end.isoformat(),
                        memberIds=selected_members
                    )
                    store.create_trip(new_trip)
                    st.rerun()
    else:
        # Dashboard Content
        st.markdown(f"<h2 class='gradient-text'>{current_trip.name} Dashboard</h2>", unsafe_allow_html=True)
        
        expenses = store.get_trip_expenses(current_trip.id)
        total_spent = sum(e.amount for e in expenses)
        per_person = total_spent / len(current_trip.memberIds) if current_trip.memberIds else 0
        symbol = get_currency_symbol()
        
        # Stats Row
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown(f"""
                <div class="glass-card stat-card">
                    <div class="stat-label">Total Spent</div>
                    <div class="stat-value">{symbol}{total_spent:,.0f}</div>
                </div>
            """, unsafe_allow_html=True)
        with col2:
            st.markdown(f"""
                <div class="glass-card stat-card">
                    <div class="stat-label">Per Person Share</div>
                    <div class="stat-value">{symbol}{per_person:,.0f}</div>
                </div>
            """, unsafe_allow_html=True)
        with col3:
            st.markdown(f"""
                <div class="glass-card stat-card">
                    <div class="stat-label">Members</div>
                    <div class="stat-value">{len(current_trip.memberIds)}</div>
                </div>
            """, unsafe_allow_html=True)

        # Charts and History
        tab1, tab2, tab3 = st.tabs(["📊 Spending History", "👥 Member Balances", "🧾 Recent Expenses"])
        
        with tab1:
            if expenses:
                df = pd.DataFrame([{"Date": e.date[:10], "Amount": e.amount} for e in expenses])
                df['Date'] = pd.to_datetime(df['Date'])
                daily = df.groupby('Date')['Amount'].sum().reset_index()
                st.bar_chart(daily.set_index('Date'))
            else:
                st.write("No expenses added yet.")
                
        with tab2:
            members = [m for m in store.get_members() if m.id in current_trip.memberIds]
            for m in members:
                paid = sum(e.amount for e in expenses if e.paidBy == m.id)
                share = 0
                for e in expenses:
                    if m.id in e.splitBetweenIds:
                        share += e.amount / len(e.splitBetweenIds)
                balance = paid - share
                color = "#10b981" if balance >= 0 else "#ef4444"
                sign = "+" if balance >= 0 else ""
                
                st.markdown(f"""
                    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 40px; height: 40px; background: #334155; border-radius: 50%; display: flex; justify-content: center; align-items: center;">👤</div>
                            <div>
                                <div style="font-weight: bold;">{m.name}</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">Paid: {symbol}{paid:,.0f}</div>
                            </div>
                        </div>
                        <div style="font-weight: bold; color: {color};">{sign}{symbol}{balance:,.0f}</div>
                    </div>
                """, unsafe_allow_html=True)

        with tab3:
            if expenses:
                for e in reversed(expenses):
                    payer = next((m.name for m in store.get_members() if m.id == e.paidBy), "Unknown")
                    st.markdown(f"""
                        <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px;">
                            <div>
                                <div style="font-weight: bold;">{e.title}</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">Paid by {payer}</div>
                            </div>
                            <div style="font-weight: bold;" class="gradient-text">{symbol}{e.amount:,.0f}</div>
                        </div>
                    """, unsafe_allow_html=True)
            else:
                st.write("No expenses to show.")

# View: Members
elif nav == "Members":
    st.markdown("<h2 class='gradient-text'>Trip Members</h2>", unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        members = store.get_members()
        for m in members:
            with st.container():
                st.markdown(f"""
                    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 50px; height: 50px; background: #334155; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.5rem;">👤</div>
                            <div>
                                <div style="font-weight: bold; font-size: 1.1rem;">{m.name}</div>
                                <div style="font-size: 0.85rem; color: #94a3b8;">{m.whatsapp}</div>
                            </div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("### Add New Member")
        with st.form("add_member"):
            m_name = st.text_input("Name")
            m_phone = st.text_input("WhatsApp Number")
            submit = st.form_submit_button("Add Member", use_container_width=True)
            if submit:
                if m_name and m_phone:
                    store.add_member(Member(id=str(uuid.uuid4()), name=m_name, whatsapp=m_phone))
                    st.success(f"Added {m_name}")
                    st.rerun()

# View: Settings
elif nav == "Settings":
    st.markdown("<h2 class='gradient-text'>App Settings</h2>", unsafe_allow_html=True)
    
    with st.container():
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        new_currency = st.selectbox("Currency", ["INR", "USD", "EUR"], index=["INR", "USD", "EUR"].index(store.data.settings.currency))
        new_theme = st.selectbox("Theme", ["Dark", "Light", "System"], index=["Dark", "Light", "System"].index(store.data.settings.theme.capitalize()))
        
        if st.button("Save Settings", type="primary"):
            store.data.settings.currency = new_currency
            store.data.settings.theme = new_theme.lower()
            store.save()
            st.success("Settings saved!")
        st.markdown('</div>', unsafe_allow_html=True)

# Expense Modal (using a simple flag-based container)
if st.session_state.get('show_expense_modal', False):
    st.markdown("---")
    st.markdown("### 💸 Add New Expense")
    trip = store.get_current_trip()
    members = [m for m in store.get_members() if m.id in trip.memberIds]
    
    with st.form("expense_form"):
        e_title = st.text_input("Title", placeholder="e.g. Dinner")
        e_amount = st.number_input("Amount", min_value=0.0, step=10.0)
        e_payer = st.selectbox("Paid By", options=[m.id for m in members], format_func=lambda x: next(m.name for m in members if m.id == x))
        e_split = st.multiselect("Split Between", options=[m.id for m in members], default=[m.id for m in members], format_func=lambda x: next(m.name for m in members if m.id == x))
        
        col1, col2 = st.columns(2)
        submit = col1.form_submit_button("Add Expense", use_container_width=True)
        cancel = col2.form_submit_button("Cancel", use_container_width=True)
        
        if submit:
            if e_amount > 0 and e_split:
                exp = Expense(
                    id=str(uuid.uuid4()),
                    tripId=trip.id,
                    title=e_title,
                    amount=e_amount,
                    paidBy=e_payer,
                    splitBetweenIds=e_split
                )
                store.add_expense(exp)
                st.session_state.show_expense_modal = False
                st.rerun()
            else:
                st.error("Please enter an amount and select members to split between.")
        if cancel:
            st.session_state.show_expense_modal = False
            st.rerun()
