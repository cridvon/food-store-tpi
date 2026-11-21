from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    """Abre la sesión en __enter__ y hace commit o rollback y close en __exit__.

    Es el único lugar donde se confirma una transacción: ningún Service ni Router
    llama a session.commit(). Cada módulo hereda y crea sus repositorios en
    _crear_repositorios(), todos sobre la misma sesión.
    """

    def __init__(self, factory: Callable[[], Session] = session_factory) -> None:
        self._factory = factory
        self._session: Session | None = None

    @property
    def session(self) -> Session:
        if self._session is None:
            raise RuntimeError("El Unit of Work se usa dentro de un bloque with")
        return self._session

    def __enter__(self) -> Self:
        self._session = self._factory()
        self._crear_repositorios()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()
            self._session = None

    def _crear_repositorios(self) -> None:
        """Las subclases crean aquí sus repositorios."""
