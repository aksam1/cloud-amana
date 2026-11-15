"""Runs the daily job once a day at the hour chosen in Settings."""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from . import pipeline

log = logging.getLogger("leadcrm.scheduler")
_scheduler: BackgroundScheduler | None = None


def start(hour: int) -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(pipeline.run_daily, CronTrigger(hour=hour, minute=0), id="daily", replace_existing=True)
    _scheduler.start()
    log.info("Daily job scheduled for %02d:00", hour)


def reschedule(hour: int) -> None:
    if _scheduler is not None:
        _scheduler.reschedule_job("daily", trigger=CronTrigger(hour=hour, minute=0))


def stop() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
