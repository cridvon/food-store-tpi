from sqlmodel import SQLModel


class LoginResponse(SQLModel):
    message: str


class LogoutResponse(SQLModel):
    message: str
