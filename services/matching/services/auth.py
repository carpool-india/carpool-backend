import os

import httpx
from fastapi import Header, HTTPException


async def require_auth_user(authorization: str | None = Header(default=None)) -> str:
    """Validate the caller's Supabase access token the same way the Node
    services do (POST to /auth/v1/user), so /match and /intermediate-stops
    can't be scraped by anyone who finds the URL. Returns the auth user id.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[len("Bearer ") :].strip()

    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    anon_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{supabase_url}/auth/v1/user",
            headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    data = response.json()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return str(user_id)
