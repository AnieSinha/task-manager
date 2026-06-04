from fastapi import Header, HTTPException
from jose import jwt, JWTError

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"

def verify_token(authorization: str = Header(default=None, alias="Authorization")):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Token missing"
        )

    try:
        token = authorization.split(" ")[1]

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )