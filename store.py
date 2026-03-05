import json
import os
from models import Member, Trip, Expense, Settings, Template, AppData, asdict

class Store:
    def __init__(self, filename='tripsplit_data.json'):
        self.filename = filename
        self.data = self.load()

    def load(self) -> AppData:
        if not os.path.exists(self.filename):
            return self.get_defaults()
        
        try:
            with open(self.filename, 'r') as f:
                raw_data = json.load(f)
                
            return AppData(
                members=[Member(**m) for m in raw_data.get('members', [])],
                trips=[Trip(**t) for t in raw_data.get('trips', [])],
                expenses=[Expense(**e) for e in raw_data.get('expenses', [])],
                settings=Settings(**raw_data.get('settings', {})),
                templates=[Template(**tm) for tm in raw_data.get('templates', [])],
                currentTripId=raw_data.get('currentTripId')
            )
        except Exception as e:
            print(f"Error loading data: {e}")
            return self.get_defaults()

    def get_defaults(self) -> AppData:
        default_members = [
            Member(id='m1', name='Shuvo', whatsapp='8801765245872'),
            Member(id='m2', name='Promita', whatsapp='8801912790430'),
            Member(id='m3', name='Monami', whatsapp='917044528716'),
            Member(id='m4', name='Setu', whatsapp='919933493538'),
            Member(id='m5', name='Arpita', whatsapp='8801923701861'),
            Member(id='m6', name='Dipanjon', whatsapp='918016370668'),
            Member(id='m7', name='Srijan', whatsapp='8801643116647')
        ]
        default_template = Template(
            id='default', 
            name='Standard Summary', 
            body='Trip: {trip_name}\nMember: {member_name}\nTotal Trip Exp: {total}\nYour Share: {amount}'
        )
        return AppData(members=default_members, templates=[default_template])

    def save(self):
        try:
            # Using asdict with a custom encoder or manual conversion for dataclasses
            data_to_save = {
                "members": [asdict(m) for m in self.data.members],
                "trips": [asdict(t) for t in self.data.trips],
                "expenses": [asdict(e) for e in self.data.expenses],
                "settings": asdict(self.data.settings),
                "templates": [asdict(tm) for tm in self.data.templates],
                "currentTripId": self.data.currentTripId
            }
            with open(self.filename, 'w') as f:
                json.dump(data_to_save, f, indent=4)
        except Exception as e:
            print(f"Error saving data: {e}")

    # Helper methods mirroring script.js
    def add_member(self, member: Member):
        self.data.members.append(member)
        self.save()

    def get_members(self):
        return self.data.members

    def create_trip(self, trip: Trip):
        self.data.trips.append(trip)
        self.data.currentTripId = trip.id
        self.save()

    def get_current_trip(self) -> Optional[Trip]:
        for t in self.data.trips:
            if t.id == self.data.currentTripId:
                return t
        return None

    def add_expense(self, expense: Expense):
        self.data.expenses.append(expense)
        self.save()

    def get_trip_expenses(self, trip_id: str):
        return [e for e in self.data.expenses if e.tripId == trip_id]
