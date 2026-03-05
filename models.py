from dataclasses import dataclass, field, asdict
from typing import List, Optional
import datetime

@dataclass
class Member:
    id: str
    name: str
    whatsapp: str
    photo: str = ""  # Base64 string

@dataclass
class Expense:
    id: str
    tripId: str
    title: str
    amount: float
    paidBy: str  # Member ID
    splitBetweenIds: List[str]  # List of Member IDs
    date: str = field(default_factory=lambda: datetime.datetime.now().isoformat())

@dataclass
class Trip:
    id: str
    name: str
    location: str
    startDate: str
    endDate: str
    memberIds: List[str]
    createdAt: str = field(default_factory=lambda: datetime.datetime.now().isoformat())

@dataclass
class Settings:
    theme: str = "system"
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"

@dataclass
class Template:
    id: str
    name: str
    body: str

@dataclass
class AppData:
    members: List[Member] = field(default_factory=list)
    trips: List[Trip] = field(default_factory=list)
    expenses: List[Expense] = field(default_factory=list)
    settings: Settings = field(default_factory=Settings)
    templates: List[Template] = field(default_factory=list)
    currentTripId: Optional[str] = None
