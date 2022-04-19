from datetime import datetime, timedelta
from http import HTTPStatus
from typing import Generic, List, Optional, TypeVar

from fastapi import HTTPException
from sqlalchemy import and_, exists
from sqlalchemy.orm import Session

from flotilla.api.pagination import PaginationParams
from flotilla.database.db import Base
from flotilla.database.models import EventDBModel, ReportDBModel, ReportStatus
from flotilla.database.models import (
    CapabilityDBModel,
    EventDBModel,
    InspectionType,
    ReportDBModel,
    ReportStatus,
    RobotDBModel,
    RobotStatus,
)

T = TypeVar("T", bound=Base)  # Generic type for db models


def read_list_paginated(
    modelType: type[T], db: Session, params: PaginationParams = PaginationParams()
) -> List[T]:  # Generic function to wrap pagination functionality
    return (
        db.query(modelType)
        .offset(params.page * params.page_size)
        .limit(params.page_size)
        .all()
    )

def read_by_id(modelType: type[T], db: Session, item_id: int) -> T:
    item: Optional[T] = db.query(modelType).filter(modelType.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND.value,
            detail=f"No item with id {item_id}",
        )
    return item

def create_robot(
    db: Session,
    name: str,
    model: str,
    serial_number: str,
    host: str,
    port: int,
    enabled: bool,
    capabilities: List[str],
) -> int:

    robot: RobotDBModel = RobotDBModel(
        name=name,
        model=model,
        serial_number=serial_number,
        host=host,
        port=port,
        status=RobotStatus.available,
        enabled=enabled,
    )

    _check_non_duplicate_robot(db=db, robot=robot)

    _add_capabilities_to_robot(robot=robot, capabilities=capabilities)

    db.add(robot)
    db.commit()

    return robot.id


def _add_capabilities_to_robot(robot: RobotDBModel, capabilities: List[str]) -> None:
    for capability in capabilities:
        if not InspectionType.has_value(capability):
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST.value,
                detail="Invalid format for robot capabilities",
            )

        CapabilityDBModel(robot=robot, capability=InspectionType(capability))


def _check_non_duplicate_robot(db: Session, robot: RobotDBModel):
    name_exists: bool = db.query(
        exists().where(RobotDBModel.name == robot.name)
    ).scalar()

    serial_number_exists: bool = db.query(
        exists().where(RobotDBModel.serial_number == robot.serial_number)
    ).scalar()

    if name_exists or serial_number_exists:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT.value,
            detail="A robot with that name/serial number already exists",
        )


def read_events_by_robot_id_and_time_span(
    db: Session,
    robot_id: int,
    start_time: datetime,
    end_time: datetime,
) -> List[EventDBModel]:
    return (
        db.query(EventDBModel)
        .filter(EventDBModel.robot_id == robot_id)
        .filter(
            and_(
                EventDBModel.start_time < end_time,
                EventDBModel.end_time > start_time,
            )
        )
        .all()
    )


def create_event(
    db: Session,
    robot_id: int,
    echo_mission_id: int,
    start_time: datetime,
    estimated_duration: timedelta,
) -> int:

    event: EventDBModel = EventDBModel(
        robot_id=robot_id,
        echo_mission_id=echo_mission_id,
        report_id=None,
        start_time=start_time,
        estimated_duration=estimated_duration,
    )
    db.add(event)
    db.commit()
    return event.id


def remove_event(db: Session, event_id: int) -> None:
    event: EventDBModel = read_by_id(EventDBModel, db, event_id)
    db.delete(event)
    db.commit()
    return


def create_report(
    db: Session,
    robot_id: int,
    isar_mission_id: str,
    echo_mission_id: int,
    report_status: ReportStatus,
) -> int:
    report: ReportDBModel = ReportDBModel(
        robot_id=robot_id,
        isar_mission_id=isar_mission_id,
        echo_mission_id=echo_mission_id,
        log="",
        status=report_status,
    )
    db.add(report)
    db.commit()
    return report.id
