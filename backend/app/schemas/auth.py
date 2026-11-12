from pydantic import BaseModel, EmailStr
from datetime import datetime
from pydantic import ConfigDict

class UserCreate(BaseModel):
    full_name: str
    college_email: EmailStr
    username: str
    password: str
    gender: str | None = None
    roll_number: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_year_back: bool = False
    is_alumni: bool = False
    id_card_url: str | None = None
    linkedin_url: str | None = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    college_email: EmailStr
    is_verified: bool
    gender: str | None = None
    created_at: datetime
    bio: str | None = None
    profile_picture: str | None = None
    roll_number: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_year_back: bool = False
    is_alumni: bool = False
    id_card_url: str | None = None
    is_id_verified: bool = False
    linkedin_url: str | None = None
    last_academic_verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class VerifyEmailResponse(BaseModel):
    status: str
    verified: bool
    message: str
    access_token: str
    token_type: str
    user: UserResponse

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
