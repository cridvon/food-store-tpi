from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status

from app.core.deps import AdminUser
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoNoEncontrado, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

router = APIRouter(prefix="/productos", tags=["Productos"])

IdProducto = Annotated[int, Path(gt=0)]


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


Service = Annotated[ProductoService, Depends(get_producto_service)]


@router.get("", response_model=ProductosPaginados)
def listar_productos(
    service: Service,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=100, description="Busca en el nombre")] = None,
    categoria_id: Annotated[int | None, Query(gt=0)] = None,
    disponible: bool | None = None,
) -> ProductosPaginados:
    return service.listar(
        skip=skip, limit=limit, search=search, categoria_id=categoria_id, disponible=disponible
    )


@router.get("/{id}", response_model=ProductoRead)
def obtener_producto(id: IdProducto, service: Service) -> ProductoRead:
    try:
        return service.obtener(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(datos: ProductoCreate, _admin: AdminUser, service: Service) -> ProductoRead:
    try:
        return service.crear(datos)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e


@router.put("/{id}", response_model=ProductoRead)
def actualizar_producto(
    id: IdProducto, datos: ProductoUpdate, _admin: AdminUser, service: Service
) -> ProductoRead:
    try:
        return service.actualizar(id, datos)
    except (ProductoNoEncontrado, CategoriaNoEncontrada) as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e


@router.patch("/{id}/stock", response_model=ProductoRead)
def actualizar_stock(
    id: IdProducto, datos: ProductoStockUpdate, _admin: AdminUser, service: Service
) -> ProductoRead:
    try:
        return service.actualizar_stock(id, datos)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(id: IdProducto, _admin: AdminUser, service: Service) -> Response:
    try:
        service.eliminar(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e
    return Response(status_code=status.HTTP_204_NO_CONTENT)
