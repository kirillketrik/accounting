import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.asset import Asset
from app.models.asset_event import AssetEvent
from app.models.asset_history import AssetHistory
from app.models.asset_status import AssetStatus
from app.models.asset_type import AssetType
from app.models.event_type import EventType
from app.models.place import Place
from app.models.user import User

logger = logging.getLogger(__name__)

ASSET_TYPES = [
    ("Картридж", "Тонер-картриджи и картриджи с чернилами"),
]

ASSET_STATUSES = [
    ("На заправке", "Актив отправлен на заправку", False, False),
    ("На складе", "Актив хранится на складе", True, False),
    ("Используется", "Актив введён в эксплуатацию", False, False),
    ("Списан", "Актив выведен из эксплуатации", False, True),
]

PLACES = [
    ("2 этаж - Бухгалтерия", None),
    ("Сервисный центр PrintCare", None),
    ("Склад", None),
]

EVENT_TYPES = [
    ("Отправить на заправку", "Актив отправлен на заправку", "На заправке", "Заправлялся {n} раз"),
    ("Забрать с заправки", "Актив возвращён с заправки на склад", "На складе", "Возвращался с заправки {n} раз"),
    ("Установить", "Актив введён в эксплуатацию", "Используется", "Устанавливался {n} раз"),
    ("Списать", "Актив выведен из эксплуатации и утилизирован", "Списан", "Списывался {n} раз"),
]


def ensure_seed_admin(db: Session) -> None:
    """Idempotently create the initial admin account so there's always a way to log in.

    Runs unconditionally (unlike seed_if_empty, which is dev-sample-data only and gated
    behind SEED_ON_STARTUP) because a production deploy still needs an admin account.
    """
    if db.query(User).count() > 0:
        return

    settings = get_settings()
    password = settings.seed_admin_password
    if not password:
        password = secrets.token_urlsafe(12)
        logger.warning(
            "No SEED_ADMIN_PASSWORD configured — generated a random initial password "
            "for admin user '%s': %s (change it after first login)",
            settings.seed_admin_username,
            password,
        )

    admin = User(
        username=settings.seed_admin_username,
        password_hash=hash_password(password),
        first_name="Vlad",
        last_name="Rak",
        is_admin=True,
        is_active=True,
    )
    db.add(admin)
    db.commit()


def seed_if_empty(db: Session) -> None:
    if db.query(AssetType).count() > 0:
        return

    admin = db.scalar(select(User).order_by(User.id).limit(1))

    asset_types = {name: AssetType(name=name, description=desc) for name, desc in ASSET_TYPES}
    statuses = {
        name: AssetStatus(name=name, description=desc, is_default=is_default, is_disposal=is_disposal)
        for name, desc, is_default, is_disposal in ASSET_STATUSES
    }
    places = {name: Place(name=name, description=desc) for name, desc in PLACES}
    event_types = {
        name: EventType(
            name=name, description=desc, target_status=statuses[status_name], counter_label=label
        )
        for name, desc, status_name, label in EVENT_TYPES
    }
    db.add_all(asset_types.values())
    db.add_all(statuses.values())
    db.add_all(places.values())
    db.add_all(event_types.values())
    db.flush()

    now = datetime.now(timezone.utc)

    assets = [
        Asset(
            asset_type=asset_types["Картридж"],
            name="Canon 728 Toner",
            inventory_number="INV-1001",
            serial_number="SN-CN-9931",
            status=statuses["Используется"],
            place=places["2 этаж - Бухгалтерия"],
            responsible_user=admin,
            notes="Установлен в принтер отдела бухгалтерии.",
        ),
        Asset(
            asset_type=asset_types["Картридж"],
            name="HP 26A Toner",
            inventory_number="INV-1002",
            serial_number="SN-HP-2260",
            status=statuses["На заправке"],
            place=places["Сервисный центр PrintCare"],
            responsible_user=admin,
            notes="Отправлен на заправку из-за низкого уровня тонера.",
        ),
        Asset(
            asset_type=asset_types["Картридж"],
            name="Xerox 106R Toner",
            inventory_number="INV-1003",
            serial_number="SN-XR-1188",
            status=statuses["На складе"],
            place=places["Склад"],
            responsible_user=admin,
            notes="Ожидает установки.",
        ),
    ]
    db.add_all(assets)
    db.flush()

    cartridge_a, cartridge_b, cartridge_c = assets

    events = [
        AssetEvent(
            asset=cartridge_a,
            event_type=event_types["Установить"],
            event_date=now - timedelta(days=400),
            description="Первичная установка в принтер отдела бухгалтерии.",
            performed_by_user=admin,
        ),
        AssetEvent(
            asset=cartridge_b,
            event_type=event_types["Установить"],
            event_date=now - timedelta(days=200),
            performed_by_user=admin,
        ),
        AssetEvent(
            asset=cartridge_b,
            event_type=event_types["Отправить на заправку"],
            event_date=now - timedelta(days=3),
            description="Низкий уровень тонера.",
            performed_by_user=admin,
        ),
        AssetEvent(
            asset=cartridge_c,
            event_type=event_types["Забрать с заправки"],
            event_date=now - timedelta(days=1),
            description="Возвращён поставщиком после диагностики.",
            performed_by_user=admin,
        ),
    ]
    db.add_all(events)

    disposed_history = AssetHistory(
        asset_name="Brother TN-2420 Toner",
        asset_type_name="Картридж",
        inventory_number="INV-0900",
        serial_number="SN-BR-3345",
        place_name="Хранилище",
        responsible_person="Омер Леви",
        notes="Заменён более новой моделью.",
        asset_created_at=now - timedelta(days=900),
        disposed_at=now - timedelta(days=15),
        events=[
            {
                "event_type_name": "Установить",
                "event_date": (now - timedelta(days=900)).isoformat(),
                "description": None,
                "performed_by": "ИТ-поддержка",
                "created_at": (now - timedelta(days=900)).isoformat(),
            },
            {
                "event_type_name": "Списать",
                "event_date": (now - timedelta(days=15)).isoformat(),
                "description": "Выведен из эксплуатации из-за повторяющихся аппаратных сбоев.",
                "performed_by": "ИТ-поддержка",
                "created_at": (now - timedelta(days=15)).isoformat(),
            },
        ],
    )
    db.add(disposed_history)

    db.commit()
