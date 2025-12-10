from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Autenticacion de usuario unico.
    Devuelve un token JWT si las credenciales son correctas.
    """
    # Verificar usuario y contraseña
    if request.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear token (expira en 6 horas)
    access_token = create_access_token(
        data={"sub": request.username},
        expires_delta=timedelta(hours=6)
    )

    return TokenResponse(access_token=access_token)


@router.get("/verify")
async def verify_token_endpoint():
    """
    Endpoint publico para verificar si el servidor esta activo.
    La verificacion real del token se hace con el middleware.
    """
    return {"status": "ok"}
