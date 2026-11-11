from pydantic import BaseModel, EmailStr
from datetime import datetime
from pydantic import ConfigDict

class UserCreate(BaseModel):
    full_name: str
    college_email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    college_email: EmailStr
    is_verified: bool
    created_at: datetime
    bio: str | None = None
    profile_picture: str | None = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class VerifyEmail(BaseModel):
    college_email: EmailStr
    otp: str

class ResendOTP(BaseModel):
    college_email: EmailStr

class ForgotPassword(BaseModel):
    college_email: EmailStr

class ResetPassword(BaseModel):
    college_email: EmailStr
    otp: str
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str
