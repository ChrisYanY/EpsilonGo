from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict

from ai import get_random_move

app = FastAPI()

# Allow CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GameState(BaseModel):
    board: List[List[Optional[str]]] # 'black', 'white', or None
    player: Literal['black', 'white']
    difficulty: str = 'beginner'
    prisoners: Dict[str, int] = {'black': 0, 'white': 0}

@app.get("/")
def read_root():
    return {"message": "EpsilonGo Backend Ready"}

@app.post("/move")
def predict_move(state: GameState):
    move, win_rate, lead = get_random_move(state.board, state.player, state.prisoners)
    
    response = {
        "pass": False,
        "resign": False,
        "win_rate": win_rate, # From AI perspective
        "lead": lead          # From AI perspective
    }
    
    if move == "RESIGN":
        response["resign"] = True
        return response
    
    if move is None:
        response["pass"] = True
        return response
        
    response["row"] = move[0]
    response["col"] = move[1]
    return response
