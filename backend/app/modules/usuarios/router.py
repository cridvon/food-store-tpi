from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.deps import AdminUser
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioNoEncontrado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios (admin)"])

IdUsuario = Annotated[int, Path(gt=0)]


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


Service = Annotated[UsuarioService, Depends(get_usuario_service)]


@router.get("", response_model=list[UserPublic])
def listar_usuarios(_admin: AdminUser, service: Service) -> list[UserPublic]:
    return service.listar()


@router.post("/{id}/activar", response_model=UserPublic)
def activar_usuario(id: IdUsuario, _admin: AdminUser, service: Service) -> UserPublic:
    try:
        return service.activar(id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("/{id}/desactivar", response_model=UserPublic)
def desactivar_usuario(id: IdUsuario, admin: AdminUser, service: Service) -> UserPublic:
    try:
        return service.desactivar(id, admin_id=admin.id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
