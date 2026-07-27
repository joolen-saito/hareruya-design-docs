#!/usr/bin/env python3
"""Backlog API v2 の薄いクライアント。

安全方針:
- 書き込み系メソッドは allow_write=True で構築したクライアントでしか呼べない。
  ハーネス側では --apply を指定したときだけ allow_write を立てる。
- APIキーはリポジトリに置かない。環境変数 BACKLOG_API_KEY → ~/.config/backlog/credentials の順に読む。
- 課題一覧・コメント一覧はページングを実装する。コメント一覧は offset ではなく
  minId カーソル方式（1回最大100件）なので、件数が100を超えても取りこぼさない。
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import requests

DEFAULT_SPACE = "joolen.backlog.com"
CREDENTIALS_PATH = Path.home() / ".config" / "backlog" / "credentials"
_MAX_RETRY = 3


class BacklogError(Exception):
    pass


class BacklogAuthError(BacklogError):
    pass


def load_credentials() -> tuple[str, str]:
    """(space, api_key) を返す。見つからなければ手順付きで例外。"""
    space = os.environ.get("BACKLOG_SPACE", "").strip()
    api_key = os.environ.get("BACKLOG_API_KEY", "").strip()

    if not api_key and CREDENTIALS_PATH.is_file():
        for raw in CREDENTIALS_PATH.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip().upper()
            value = value.strip().strip('"').strip("'")
            if key == "BACKLOG_API_KEY" and not api_key:
                api_key = value
            elif key == "BACKLOG_SPACE" and not space:
                space = value

    if not api_key:
        raise BacklogAuthError(
            "Backlog APIキーが見つからない。次のいずれかで設定すること:\n"
            f"  1) {CREDENTIALS_PATH} を作成する（推奨）\n"
            "       mkdir -p ~/.config/backlog\n"
            "       cat > ~/.config/backlog/credentials <<'EOF'\n"
            f"       BACKLOG_SPACE={DEFAULT_SPACE}\n"
            "       BACKLOG_API_KEY=（ここに発行したAPIキー）\n"
            "       EOF\n"
            "       chmod 600 ~/.config/backlog/credentials\n"
            "  2) 環境変数 BACKLOG_API_KEY を設定して実行する\n"
            f"キーの発行: Backlog の 個人設定 > API  ( https://{DEFAULT_SPACE}/EditApiSettings.action )"
        )
    return space or DEFAULT_SPACE, api_key


class BacklogClient:
    def __init__(self, space: str, api_key: str, *, allow_write: bool = False, timeout: int = 30):
        self.space = space
        self._api_key = api_key
        self.allow_write = allow_write
        self.timeout = timeout
        self.base = f"https://{space}/api/v2"
        self._session = requests.Session()

    @classmethod
    def from_environment(cls, *, allow_write: bool = False) -> "BacklogClient":
        space, api_key = load_credentials()
        return cls(space, api_key, allow_write=allow_write)

    # ---- 低レベル ----------------------------------------------------------

    def _request(self, method: str, path: str, *, params: Any = None, data: Any = None) -> Any:
        if method != "GET" and not self.allow_write:
            raise PermissionError(
                f"書き込み操作 {method} {path} は allow_write=False のクライアントでは実行できない"
            )
        url = f"{self.base}{path}"
        query = dict(params or {})
        query["apiKey"] = self._api_key

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRY):
            try:
                response = self._session.request(
                    method, url, params=query, data=data, timeout=self.timeout
                )
            except requests.RequestException as exc:  # ネットワーク断
                last_error = exc
                time.sleep(2**attempt)
                continue

            if response.status_code == 401:
                raise BacklogAuthError(
                    "Backlog APIが401を返した。APIキーが無効か、スペースが違う可能性がある。"
                )
            if response.status_code == 404:
                raise BacklogError(f"404 Not Found: {method} {path}")
            if response.status_code == 429 or 500 <= response.status_code < 600:
                wait = int(response.headers.get("Retry-After") or 2**attempt)
                last_error = BacklogError(f"{response.status_code} {response.text[:200]}")
                time.sleep(min(wait, 30))
                continue
            if not response.ok:
                raise BacklogError(
                    f"{response.status_code} {method} {path}: {response.text[:500]}"
                )
            if not response.content:
                return None
            return response.json()

        raise BacklogError(f"リトライ上限に到達: {method} {path}: {last_error}")

    def get(self, path: str, params: Any = None) -> Any:
        return self._request("GET", path, params=params)

    # ---- プロジェクトメタ --------------------------------------------------

    def get_project(self, project_key: str) -> dict:
        return self.get(f"/projects/{project_key}")

    def get_issue_types(self, project_key: str) -> list[dict]:
        return self.get(f"/projects/{project_key}/issueTypes")

    def get_statuses(self, project_key: str) -> list[dict]:
        return self.get(f"/projects/{project_key}/statuses")

    def get_custom_fields(self, project_key: str) -> list[dict]:
        return self.get(f"/projects/{project_key}/customFields")

    def get_resolutions(self) -> list[dict]:
        return self.get("/resolutions")

    # ---- 課題 --------------------------------------------------------------

    def list_issues(
        self,
        *,
        project_id: int,
        issue_type_ids: list[int] | None = None,
        status_ids: list[int] | None = None,
        keyword: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        """条件に合う課題を全ページ取得する（1回最大100件、offset ページング）。"""
        collected: list[dict] = []
        offset = 0
        while True:
            page = min(100, (limit - len(collected)) if limit else 100)
            if page <= 0:
                break
            params: dict[str, Any] = {
                "projectId[]": [project_id],
                "count": page,
                "offset": offset,
                "sort": "created",
                "order": "asc",
            }
            if issue_type_ids:
                params["issueTypeId[]"] = issue_type_ids
            if status_ids:
                params["statusId[]"] = status_ids
            if keyword:
                params["keyword"] = keyword
            batch = self.get("/issues", params) or []
            collected.extend(batch)
            if len(batch) < page:
                break
            offset += len(batch)
        return collected

    def get_issue(self, issue_key: str) -> dict:
        return self.get(f"/issues/{issue_key}")

    def count_comments(self, issue_key: str) -> int:
        payload = self.get(f"/issues/{issue_key}/comments/count") or {}
        return int(payload.get("count", 0))

    def get_comments(self, issue_key: str) -> list[dict]:
        """全コメントを昇順で取得する。minId カーソルでページングする。"""
        collected: list[dict] = []
        min_id: int | None = None
        while True:
            params: dict[str, Any] = {"count": 100, "order": "asc"}
            if min_id is not None:
                params["minId"] = min_id
            batch = self.get(f"/issues/{issue_key}/comments", params) or []
            if min_id is not None:
                batch = [c for c in batch if int(c.get("id", 0)) > min_id]
            if not batch:
                break
            collected.extend(batch)
            min_id = max(int(c.get("id", 0)) for c in batch)
            if len(batch) < 100:
                break
        return collected

    # ---- 書き込み（allow_write 必須） --------------------------------------

    def update_issue(
        self,
        issue_key: str,
        *,
        status_id: int | None = None,
        resolution_id: int | None = None,
        comment: str | None = None,
        custom_fields: dict[int, Any] | None = None,
    ) -> dict:
        """状態・完了理由・カスタム属性の更新とコメント投稿を1リクエストで行う。"""
        data: dict[str, Any] = {}
        if status_id is not None:
            data["statusId"] = status_id
        if resolution_id is not None:
            data["resolutionId"] = resolution_id
        if comment:
            data["comment"] = comment
        for field_id, value in (custom_fields or {}).items():
            if isinstance(value, list):
                data[f"customField_{field_id}[]"] = value
            else:
                data[f"customField_{field_id}"] = value
        if not data:
            raise BacklogError("update_issue に更新内容が無い")
        return self._request("PATCH", f"/issues/{issue_key}", data=data)

    def add_comment(self, issue_key: str, content: str) -> dict:
        return self._request("POST", f"/issues/{issue_key}/comments", data={"content": content})


# ---- 名前 → ID 解決 --------------------------------------------------------


def pick_by_name(items: list[dict], name: str, *, label: str) -> dict:
    """名称からマスタ項目を一意に解決する。曖昧なら候補を出して例外。"""
    import unicodedata

    def norm(value: str) -> str:
        return unicodedata.normalize("NFKC", str(value or "")).replace(" ", "").replace("　", "")

    key = norm(name)
    exact = [i for i in items if norm(i.get("name")) == key]
    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        raise BacklogError(f"{label} {name!r} が複数一致: {[i.get('name') for i in exact]}")
    partial = [i for i in items if key and key in norm(i.get("name"))]
    if len(partial) == 1:
        return partial[0]
    raise BacklogError(
        f"{label} {name!r} を一意に解決できない。\n利用可能な{label}:\n  "
        + "\n  ".join(f"{i.get('id')}\t{i.get('name')}" for i in items)
    )
