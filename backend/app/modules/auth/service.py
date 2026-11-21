from fastapi import HTTPException, status

from app.core.deps import CUENTA_DESACTIVADA
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, datos: UserCreate) -> UserPublic:
        with self.uow as uow:
            if uow.usuarios.get_by_username(datos.username):
                raise HTTPException(status.HTTP_409_CONFLICT, "El nombre de usuario ya existe")
            if uow.usuarios.get_by_email(datos.email):
                raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado")
            # El registro público siempre crea usuarios con rol "user"
            usuario = Usuario(
                username=datos.username,
                full_name=datos.full_name,
                email=datos.email,
                hashed_password=hash_password(datos.password),
                role="user",
            )
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)

    def login(self, username: str, password: str) -> str:
        """Verifica las credenciales y devuelve el JWT para la cookie."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos")
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, CUENTA_DESACTIVADA)
            return create_access_token(usuario.username, usuario.role)
