from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
import sqlite3
import os

app = FastAPI(title="Pory-Web API", version="1.0.0")

# CORS - Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://velocity915.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Default admin credentials (change in production!)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database setup
def get_db():
    db_path = os.path.join(os.path.dirname(__file__), "pory.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            dex_no INTEGER NOT NULL,
            pokemon_name TEXT NOT NULL,
            is_shiny BOOLEAN DEFAULT FALSE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Create default admin user if not exists
    existing_admin = conn.execute(
        "SELECT id FROM users WHERE username = ?", (ADMIN_USERNAME,)
    ).fetchone()

    if not existing_admin:
        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        conn.execute(
            "INSERT INTO users (username, email, hashed_password, is_admin) VALUES (?, ?, ?, ?)",
            (ADMIN_USERNAME, "admin@pory-web.local", hashed, True)
        )

    conn.commit()
    conn.close()

init_db()

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool = False

class UserAdminView(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    created_at: str
    pokemon_count: int

class Token(BaseModel):
    access_token: str
    token_type: str

class PokemonAdd(BaseModel):
    dex_no: int
    pokemon_name: str
    is_shiny: bool = False

class PokemonResponse(BaseModel):
    id: int
    dex_no: int
    pokemon_name: str
    is_shiny: bool

# Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()

    if user is None:
        raise credentials_exception
    return dict(user)

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Routes
@app.get("/")
def root():
    return {"message": "Pory-Web API", "version": "1.0.0"}

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate):
    conn = get_db()

    # Check if user exists
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (user.username, user.email)
    ).fetchone()

    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed = hash_password(user.password)
    cursor = conn.execute(
        "INSERT INTO users (username, email, hashed_password, is_admin) VALUES (?, ?, ?, ?)",
        (user.username, user.email, hashed, False)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return {"id": user_id, "username": user.username, "email": user.email, "is_admin": False}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?", (form_data.username,)
    ).fetchone()
    conn.close()

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False)
    }

# Collection endpoints
@app.get("/collection", response_model=list[PokemonResponse])
async def get_collection(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    pokemon = conn.execute(
        "SELECT id, dex_no, pokemon_name, is_shiny FROM collections WHERE user_id = ?",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(p) for p in pokemon]

@app.post("/collection", response_model=PokemonResponse)
async def add_to_collection(pokemon: PokemonAdd, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO collections (user_id, dex_no, pokemon_name, is_shiny) VALUES (?, ?, ?, ?)",
        (current_user["id"], pokemon.dex_no, pokemon.pokemon_name, pokemon.is_shiny)
    )
    conn.commit()
    pokemon_id = cursor.lastrowid
    conn.close()

    return {
        "id": pokemon_id,
        "dex_no": pokemon.dex_no,
        "pokemon_name": pokemon.pokemon_name,
        "is_shiny": pokemon.is_shiny
    }

@app.delete("/collection/{pokemon_id}")
async def remove_from_collection(pokemon_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    result = conn.execute(
        "DELETE FROM collections WHERE id = ? AND user_id = ?",
        (pokemon_id, current_user["id"])
    )
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pokemon not found in collection")

    return {"message": "Pokemon removed from collection"}

# Admin endpoints
@app.get("/admin/users", response_model=list[UserAdminView])
async def get_all_users(admin: dict = Depends(get_admin_user)):
    conn = get_db()
    users = conn.execute("""
        SELECT u.id, u.username, u.email, u.is_admin, u.created_at,
               COUNT(c.id) as pokemon_count
        FROM users u
        LEFT JOIN collections c ON u.id = c.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    """).fetchall()
    conn.close()
    return [dict(u) for u in users]

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, admin: dict = Depends(get_admin_user)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    conn = get_db()

    # Delete user's collection first
    conn.execute("DELETE FROM collections WHERE user_id = ?", (user_id,))

    # Delete user
    result = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted"}

@app.get("/admin/stats")
async def get_stats(admin: dict = Depends(get_admin_user)):
    conn = get_db()

    user_count = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
    pokemon_count = conn.execute("SELECT COUNT(*) as count FROM collections").fetchone()["count"]
    shiny_count = conn.execute("SELECT COUNT(*) as count FROM collections WHERE is_shiny = 1").fetchone()["count"]

    conn.close()

    return {
        "total_users": user_count,
        "total_pokemon": pokemon_count,
        "total_shinies": shiny_count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
