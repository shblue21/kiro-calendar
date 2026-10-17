"""One clock zone: the operating system running the Crew gateway."""

import os
import platform
from pathlib import Path
from zoneinfo import ZoneInfo
from .domain import StorageUnavailable


def system_timezone() -> str:
    try:
        if platform.system() == "Windows":
            # Crew ships tzlocal/tzdata on Windows; it maps registry names to IANA.
            from tzlocal import get_localzone_name

            name = get_localzone_name()
        else:
            name = os.environ.get("TZ", "").lstrip(":")
            if not name or name.startswith("/"):
                target = str(Path(name or "/etc/localtime").resolve(strict=True))
                if "/zoneinfo/" in target:
                    name = target.split("/zoneinfo/", 1)[1]
                else:
                    name = Path("/etc/timezone").read_text(encoding="utf-8").strip()
        ZoneInfo(name)
        return name
    except (ImportError, OSError, ValueError, TypeError, KeyError) as exc:
        raise StorageUnavailable("OS 시스템 시간대를 확인하지 못했습니다.") from exc
