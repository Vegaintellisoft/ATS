from dotenv import load_dotenv
from fastapi import FastAPI
from api.routes import router

load_dotenv()

app = FastAPI(
    title="ATS AI Service",
    version="1.0.0",
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "ATS AI Service",
        "status": "running",
        "version": "1.0.0"
    }