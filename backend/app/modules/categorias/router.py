from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Response, status

from app.core.deps import AdminUser
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["Categorías"])

IdCategoria = Annotated[int, Path(gt=0)]


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


Service = Annotated[CategoriaService, Depends(get_categoria_service)]


def _a_http(error: Exception) -> HTTPException:
    """Traduce las excepciones de dominio a respuestas HTTP."""
    if isinstance(error, CategoriaNoEncontrada):
        return HTTPException(status.HTTP_404_NOT_FOUND, str(error))
    if isinstance(error, NombreDuplicado):
        return HTTPException(status.HTTP_409_CONFLICT, str(error))
    return HTTPException(status.HTTP_400_BAD_REQUEST, str(error))


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: Service) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead)
def obtener_categoria(id: IdCategoria, service: Service) -> CategoriaRead:
    try:
        return service.obtener(id)
    except CategoriaNoEncontrada as e:
        raise _a_http(e) from e


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(datos: CategoriaCreate, _admin: AdminUser, service: Service) -> CategoriaRead:
    try:
        return service.crear(datos)
    except NombreDuplicado as e:
        raise _a_http(e) from e


@router.put("/{id}", response_model=CategoriaRead)
def actualizar_categoria(
    id: IdCategoria, datos: CategoriaUpdate, _admin: AdminUser, service: Service
) -> CategoriaRead:
    try:
        return service.actualizar(id, datos)
    except (CategoriaNoEncontrada, NombreDuplicado) as e:
        raise _a_http(e) from e


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(id: IdCategoria, _admin: AdminUser, service: Service) -> Response:
    try:
        service.eliminar(id)
    except CategoriaNoEncontrada as e:
        raise _a_http(e) from e
    return Response(status_code=status.HTTP_204_NO_CONTENT)
