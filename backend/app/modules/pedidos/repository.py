from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import EstadoPedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: int | None,
        *,
        estado: EstadoPedido | None,
        skip: int,
        limit: int,
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos de un usuario, o de todos si usuario_id es None. Más nuevos primero."""
        filtros = []
        if usuario_id is not None:
            filtros.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            filtros.append(Pedido.estado == estado.value)

        total = self.session.exec(select(func.count()).select_from(Pedido).where(*filtros)).one()
        consulta = (
            select(Pedido)
            .where(*filtros)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        )
        return total, self.session.exec(consulta).all()

    def count_by_estado(self) -> dict[str, int]:
        consulta = select(Pedido.estado, func.count()).group_by(Pedido.estado)
        return {estado: cantidad for estado, cantidad in self.session.exec(consulta).all()}

    def count_desde(self, desde: datetime) -> int:
        consulta = select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)
        return self.session.exec(consulta).one()

    def suma_total_por_estado(self, estado: EstadoPedido) -> float:
        consulta = select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado.value)
        return float(self.session.exec(consulta).one())
