import logging
import time
from typing import Optional
import redis
from app.core import config

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None
_last_attempt_time: float = 0.0
_COOLDOWN_SECONDS: float = 30.0


def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client, _last_attempt_time
    if _redis_client is not None:
        return _redis_client

    now = time.time()
    if now - _last_attempt_time < _COOLDOWN_SECONDS:
        return None

    _last_attempt_time = now
    try:
        client = redis.from_url(
            config.get_redis_url(),
            decode_responses=True,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
        )
        # Test connection
        client.ping()
        _redis_client = client
        logger.info("Connected to Redis successfully.")
        return _redis_client
    except Exception as e:
        logger.warning("Redis is not available: %s. Proceeding without caching.", e)
        _redis_client = None
        return None


class RedisCacheService:
    @staticmethod
    def get(key: str) -> Optional[str]:
        client = get_redis_client()
        if not client:
            return None
        try:
            return client.get(key)
        except Exception as e:
            logger.warning("Failed to get cache for key %s: %s", key, e)
            return None

    @staticmethod
    def set(key: str, value: str, ttl: int = config.REDIS_CACHE_TTL) -> bool:
        client = get_redis_client()
        if not client:
            return False
        try:
            client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.warning("Failed to set cache for key %s: %s", key, e)
            return False

    @staticmethod
    def delete(key: str) -> bool:
        client = get_redis_client()
        if not client:
            return False
        try:
            client.delete(key)
            return True
        except Exception as e:
            logger.warning("Failed to delete cache for key %s: %s", key, e)
            return False

    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        """
        Deletes all keys matching a glob-style pattern, e.g. 'products:*'
        """
        client = get_redis_client()
        if not client:
            return 0
        try:
            keys = client.keys(pattern)
            if keys:
                return client.delete(*keys)
            return 0
        except Exception as e:
            logger.warning("Failed to invalidate cache pattern %s: %s", pattern, e)
            return 0
