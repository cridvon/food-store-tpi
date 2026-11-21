from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import COOKIE_NAME, CurrentUser
from app.modules.auth.schemas import LoginResponse, LogoutResponse
from app.modules.auth.service import AuthService
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


Service = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def registrar(datos: UserCreate, service: Service) -> UserPublic:
    return service.registrar(datos)


@router.post("/token", response_model=LoginResponse)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: Service,
) -> LoginResponse:
    token = service.login(form.username, form.password)
    # El token viaja solo en la cookie HttpOnly: el cuerpo no lo incluye
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # en producción con HTTPS: True
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return LoginResponse(message="Login exitoso")


@router.post("/logout", response_model=LogoutResponse)
def logout(response: Response) -> LogoutResponse:
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return LogoutResponse(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def perfil(usuario: CurrentUser) -> UserPublic:
    return usuario
