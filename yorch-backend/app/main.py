from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.routers import chat_router, clientes_router, movimientos_router, sobres_router

app = FastAPI(
    title=settings.APP_NAME,
    description="API para gestión de préstamos con agente IA",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(clientes_router, prefix=settings.API_V1_PREFIX)
app.include_router(movimientos_router, prefix=settings.API_V1_PREFIX)
app.include_router(sobres_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"message": f"Bienvenido a {settings.APP_NAME} API", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Servir archivos estáticos (imágenes de sobres)
uploads_path = Path(__file__).parent.parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")
