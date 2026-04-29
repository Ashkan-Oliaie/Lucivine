"""VAPID keypair resolution — zero-config.

Order of precedence:
  1. Env vars (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) — explicit, always wins.
  2. On-disk cache at BASE_DIR/.vapid.json — survives container restarts in dev
     because the backend dir is volume-mounted by docker-compose.
  3. Generate a fresh P-256 keypair and persist it.

Net effect: `make up` is enough. No keys to copy, no `.env` to edit.

For production we recommend setting the env vars explicitly so keys survive
ephemeral filesystems (e.g. Cloud Run replicas, fresh deploys). If the public
key changes, every browser sub is invalidated and clients must re-subscribe —
the frontend self-heals on the next visit.
"""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.conf import settings

log = logging.getLogger(__name__)


def _b64u(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _generate_pair() -> tuple[str, str]:
    priv = ec.generate_private_key(ec.SECP256R1())
    priv_b64 = _b64u(priv.private_numbers().private_value.to_bytes(32, "big"))
    pub_b64 = _b64u(
        priv.public_key().public_bytes(
            serialization.Encoding.X962,
            serialization.PublicFormat.UncompressedPoint,
        )
    )
    return pub_b64, priv_b64


def _key_file() -> Path:
    return Path(settings.BASE_DIR) / ".vapid.json"


_cache: dict[str, str] | None = None


def get_keys() -> tuple[str, str]:
    """Return (public, private) URL-safe base64 VAPID keys."""
    global _cache
    if _cache is not None:
        return _cache["public"], _cache["private"]

    # 1. Env vars take precedence.
    env_pub = getattr(settings, "VAPID_PUBLIC_KEY", "") or ""
    env_priv = getattr(settings, "VAPID_PRIVATE_KEY", "") or ""
    if env_pub and env_priv:
        _cache = {"public": env_pub, "private": env_priv}
        return env_pub, env_priv

    # 2. Persisted file from a previous boot.
    f = _key_file()
    if f.exists():
        try:
            data = json.loads(f.read_text())
            if data.get("public") and data.get("private"):
                _cache = {"public": data["public"], "private": data["private"]}
                log.info("Loaded VAPID keypair from %s", f)
                return _cache["public"], _cache["private"]
        except (json.JSONDecodeError, OSError) as exc:
            log.warning("VAPID file at %s unreadable, regenerating: %s", f, exc)

    # 3. Generate fresh and persist.
    pub, priv = _generate_pair()
    try:
        f.write_text(json.dumps({"public": pub, "private": priv}))
        try:
            f.chmod(0o600)
        except OSError:
            pass  # not all FS support chmod (e.g. some bind mounts)
        log.info("Generated VAPID keypair, persisted to %s", f)
    except OSError as exc:
        log.warning("Couldn't persist VAPID keys to %s: %s", f, exc)
    _cache = {"public": pub, "private": priv}
    return pub, priv


def public_key() -> str:
    return get_keys()[0]


def private_key() -> str:
    return get_keys()[1]
