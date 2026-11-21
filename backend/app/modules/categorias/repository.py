from collections.abc import Sequence

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """Busca sin distinguir mayúsculas, entre activas e inactivas."""
        consulta = select(Categoria).where(func.lower(Categoria.nombre) == nombre.strip().lower())
        return self.session.exec(consulta).first()

    def list_activas(self) -> Sequence[Categoria]:
        consulta = select(Categoria).where(col(Categoria.activo).is_(True)).order_by(col(Categoria.nombre))
        return self.session.exec(consulta).all()
