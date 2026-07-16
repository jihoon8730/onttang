from fastapi import FastAPI
from models import Base
from database import engine
from routers import attractions, auth

Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "온땅 백엔드 작동 중"}


app.include_router(attractions.router)
app.include_router(auth.router)