from fastapi import FastAPI
from models import Base
from database import engine
from routers import attractions, auth, stamps, me, markers, rankings

Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "온땅 백엔드 작동 중"}


app.include_router(attractions.router)
app.include_router(auth.router)
app.include_router(stamps.router)
app.include_router(me.router)
app.include_router(markers.router)
app.include_router(rankings.router)