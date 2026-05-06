# Module: Defines the internal user record stored by authentication repositories.
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class UserRecord:
    id: str
    email: str
    first_name: str
    last_name: str
    password_hash: str
    created_at: datetime
