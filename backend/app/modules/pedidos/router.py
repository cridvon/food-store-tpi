from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.deps import AdminUser, CurrentUser
from app.modules.pedidos.models import EstadoPedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ReglaDeNegocio,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

IdPedido = Annotated[int, Path(gt=0)]


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


Service = Annotated[PedidoService, Depends(get_pedido_service)]


def _a_http(error: Exception) -> HTTPException:
    """Traduce las excepciones de dominio a códigos HTTP."""
    if isinstance(error, (PedidoNoEncontrado, ProductoNoEncontrado)):
        return HTTPException(status.HTTP_404_NOT_FOUND, str(error))
    if isinstance(error, PedidoAjeno):
        return HTTPException(status.HTTP_403_FORBIDDEN, str(error))
    return HTTPException(status.HTTP_400_BAD_REQUEST, str(error))


ERRORES = (PedidoNoEncontrado, ProductoNoEncontrado, PedidoAjeno, ReglaDeNegocio)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoCreate, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.crear(datos, usuario)
    except ERRORES as e:
        raise _a_http(e) from e


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: CurrentUser,
    service: Service,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoPedido | None = None,
) -> PedidosPaginados:
    return service.listar(usuario, estado=estado, skip=skip, limit=limit)


# Se declara antes de /{id} para que "resumen" no se tome como un id
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(_admin: AdminUser, service: Service) -> ResumenPedidos:
    return service.resumen()


@router.get("/{id}", response_model=PedidoRead)
def obtener_pedido(id: IdPedido, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.obtener(id, usuario)
    except ERRORES as e:
        raise _a_http(e) from e


@router.patch("/{id}/estado", response_model=PedidoRead)
def cambiar_estado(id: IdPedido, datos: CambioEstado, _admin: AdminUser, service: Service) -> PedidoRead:
    try:
        return service.cambiar_estado(id, datos.estado)
    except ERRORES as e:
        raise _a_http(e) from e


@router.patch("/{id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(id: IdPedido, usuario: CurrentUser, service: Service) -> PedidoRead:
    try:
        return service.cancelar_propio(id, usuario)
    except ERRORES as e:
        raise _a_http(e) from e
