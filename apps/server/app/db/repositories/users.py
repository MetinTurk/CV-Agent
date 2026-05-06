# Module: Provides user persistence operations behind a repository boundary.
from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.db.models.user import UserRecord


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users_by_id: dict[str, UserRecord] = {}
        self._user_ids_by_email: dict[str, str] = {}

    def get_by_id(self, user_id: str) -> UserRecord | None:
        return self._users_by_id.get(user_id)

    def get_by_email(self, email: str) -> UserRecord | None:
        user_id = self._user_ids_by_email.get(email.lower())
        if user_id is None:
            return None

        return self._users_by_id.get(user_id)

    def create(
        self,
        *,
        email: str,
        first_name: str,
        last_name: str,
        password_hash: str,
    ) -> UserRecord:
        normalized_email = email.lower()
        user = UserRecord(
            id=str(uuid4()),
            email=normalized_email,
            first_name=first_name,
            last_name=last_name,
            password_hash=password_hash,
            created_at=datetime.now(UTC),
        )

        self._users_by_id[user.id] = user
        self._user_ids_by_email[normalized_email] = user.id

        return user
