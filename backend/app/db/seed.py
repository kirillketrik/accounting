from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.asset import Asset, AssetStatus
from app.models.asset_event import AssetEvent
from app.models.asset_history import AssetHistory
from app.models.asset_type import AssetType
from app.models.event_type import EventType

ASSET_TYPES = [
    ("Картридж", "Тонер-картриджи и картриджи с чернилами"),
]

EVENT_TYPES = [
    ("Отправить на заправку", "Актив отправлен на заправку", AssetStatus.ON_REFILL, "Заправлялся {n} раз"),
    ("Забрать с заправки", "Актив возвращён с заправки на склад", AssetStatus.IN_STORAGE, "Возвращался с заправки {n} раз"),
    ("Установить", "Актив введён в эксплуатацию", AssetStatus.IN_USE, "Устанавливался {n} раз"),
    ("Списать", "Актив выведен из эксплуатации и утилизирован", AssetStatus.DISPOSED, "Списывался {n} раз"),
]


def seed_if_empty(db: Session) -> None:
    if db.query(AssetType).count() > 0:
        return

    asset_types = {name: AssetType(name=name, description=desc) for name, desc in ASSET_TYPES}
    event_types = {
        name: EventType(name=name, description=desc, target_status=status, counter_label=label)
        for name, desc, status, label in EVENT_TYPES
    }
    db.add_all(asset_types.values())
    db.add_all(event_types.values())
    db.flush()

    now = datetime.now(timezone.utc)

    assets = [
        Asset(
            asset_type=asset_types["Картридж"],
            name="Canon 728 Toner",
            inventory_number="INV-1001",
            serial_number="SN-CN-9931",
            status=AssetStatus.IN_USE,
            location="2 этаж - Бухгалтерия",
            responsible_person="Дана Коэн",
            notes="Установлен в принтер отдела бухгалтерии.",
        ),
        Asset(
            asset_type=asset_types["Картридж"],
            name="HP 26A Toner",
            inventory_number="INV-1002",
            serial_number="SN-HP-2260",
            status=AssetStatus.ON_REFILL,
            location="Сервисный центр PrintCare",
            responsible_person="Омер Леви",
            notes="Отправлен на заправку из-за низкого уровня тонера.",
        ),
        Asset(
            asset_type=asset_types["Картридж"],
            name="Xerox 106R Toner",
            inventory_number="INV-1003",
            serial_number="SN-XR-1188",
            status=AssetStatus.IN_STORAGE,
            location="Склад",
            responsible_person="Омер Леви",
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
            performed_by="ИТ-поддержка",
        ),
        AssetEvent(
            asset=cartridge_b,
            event_type=event_types["Установить"],
            event_date=now - timedelta(days=200),
            performed_by="ИТ-поддержка",
        ),
        AssetEvent(
            asset=cartridge_b,
            event_type=event_types["Отправить на заправку"],
            event_date=now - timedelta(days=3),
            description="Низкий уровень тонера.",
            performed_by="Омер Леви",
        ),
        AssetEvent(
            asset=cartridge_c,
            event_type=event_types["Забрать с заправки"],
            event_date=now - timedelta(days=1),
            description="Возвращён поставщиком после диагностики.",
            performed_by="ИТ-поддержка",
        ),
    ]
    db.add_all(events)

    disposed_history = AssetHistory(
        asset_name="Brother TN-2420 Toner",
        asset_type_name="Картридж",
        inventory_number="INV-0900",
        serial_number="SN-BR-3345",
        location="Хранилище",
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
