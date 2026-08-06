class AppError(Exception):
    """Base class for domain errors raised by the service layer."""


class NotFoundError(AppError):
    def __init__(self, entity: str, id_: int) -> None:
        self.entity = entity
        self.id_ = id_
        super().__init__(f"{entity} with id {id_} not found")


class ConflictError(AppError):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)
