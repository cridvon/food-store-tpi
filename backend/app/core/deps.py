from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie

from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

COOKIE_NAME = "access_token"
CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"

# Esquema de cookie: el frontend nunca lee el token, lo adjunta el navegador
cookie_scheme = APIKeyCookie(name=COOKIE_NAME, auto_error=False)

_no_autenticado = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No autenticado o la sesión venció",
)


def get_current_user(token: Annotated[str | None, Depends(cookie_scheme)]) -> UserPublic:
    """Lee la cookie, valida firma y expiración y carga el usuario."""
    if not token:
        raise _no_autenticado
    payload = decode_access_token(token)
    if payload is None or not isinstance(payload.get("sub"), str):
        raise _no_autenticado
    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.get_by_username(payload["sub"])
        if usuario is None:
            raise _no_autenticado
        return UserPublic.model_validate(usuario)


def get_current_active_user(
    usuario: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return usuario


def require_role(roles: list[str]) -> Callable[[UserPublic], UserPublic]:
    """Dependencia que responde 403 si el rol del usuario no está en la lista."""

    def verificar(usuario: Annotated[UserPublic, Depends(get_current_active_user)]) -> UserPublic:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para esta operación",
            )
        return usuario

    return verificar


CurrentUser = Annotated[UserPublic, Depends(get_current_active_user)]
AdminUser = Annotated[UserPublic, Depends(require_role(["admin"]))]
