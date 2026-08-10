from celery.utils.log import get_task_logger

from app.celery_app import celery_app
from app.db.session import SessionLocal

logger = get_task_logger(__name__)


@celery_app.task(name="app.services.backup.tasks.check_scheduled_backup")
def check_scheduled_backup() -> None:
    from app.services.backup_service import BackupService

    db = SessionLocal()
    try:
        BackupService(db).run_scheduled_if_due()
    except Exception:
        logger.exception("Scheduled backup check failed")
    finally:
        db.close()


@celery_app.task(name="app.services.backup.tasks.execute_backup_run")
def execute_backup_run(run_id: int) -> None:
    from app.services.backup_service import BackupService

    db = SessionLocal()
    try:
        BackupService(db).execute_pending_run(run_id)
    except Exception:
        logger.exception("Backup run %s failed", run_id)
    finally:
        db.close()
