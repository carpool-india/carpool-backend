from pathlib import Path
import importlib.util
import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _load_root_env() -> None:
    # Best-effort local-dev convenience only: walk up from this file looking
    # for a .env, however many levels that takes (monorepo, standalone repo,
    # or none at all inside a Docker container, where env vars come from the
    # platform directly and no .env file exists).
    env_path = next((p / ".env" for p in Path(__file__).resolve().parents if (p / ".env").is_file()), None)
    if env_path is None:
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_root_env()

app = FastAPI(title="RideShare India Matching", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "service": "matching", "ts": int(time.time() * 1000)}


_router_path = Path(__file__).parent / "routers" / "match.router.py"
_spec = importlib.util.spec_from_file_location("match_router", _router_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError("Unable to load matching router")
_match_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_match_module)
app.include_router(_match_module.router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("MATCHING_SERVICE_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
