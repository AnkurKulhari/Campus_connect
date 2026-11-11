from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
from app.core.config import settings
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
        try:
            return int(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=401, detail="Invalid Token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_id = verify_access_token(token)
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user