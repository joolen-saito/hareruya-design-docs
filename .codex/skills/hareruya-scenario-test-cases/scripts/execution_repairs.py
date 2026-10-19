"""原典照合済みの実施手順補正を両生成器へ同じ順序で適用する。"""
from __future__ import annotations

import importlib
import json
import re
from pathlib import Path

DOMAINS = ("inventory", "orders", "catalog")
REPO = Path(__file__).resolve().parents[4]
_CONFIGURED = {}


def modules():
    for domain in DOMAINS:
        name = "execution_repairs_" + domain
        if Path(__file__).with_name(name + ".py").exists():
            yield importlib.import_module(name)


def contracts(repo: Path) -> list[dict]:
    base = json.loads((repo / "scenario_test/coverage/source_contracts.json").read_text())["step_resolutions"]
    indexed = {c["contract_id"]: {**c, "contract_file": "scenario_test/coverage/source_contracts.json"} for c in base}
    for domain in DOMAINS:
        path = repo / f"scenario_test/coverage/execution_repairs/{domain}_contracts.json"
        if path.exists():
            data = json.loads(path.read_text())
            rows = data if isinstance(data, list) else data["step_resolutions"]
            for record in rows:
                cid = record["contract_id"]
                indexed[cid] = {**indexed.get(cid, {}), **record, "contract_file": str(path.relative_to(repo))}
    return list(indexed.values())


def configure(repo, g):
    global REPO
    REPO = Path(repo)
    for module in modules():
        if hasattr(module, "configure"):
            module.configure(repo, g)
        _CONFIGURED[module.__name__] = Path(repo).resolve()


def ensure_configured(repo):
    for module in modules():
        if _CONFIGURED.get(module.__name__) != Path(repo).resolve():
            if hasattr(module, "configure"):
                module.configure(repo, None)
            _CONFIGURED[module.__name__] = Path(repo).resolve()


def prepare_scenario(s, g):
    for module in modules():
        if hasattr(module, "prepare_scenario"):
            value = module.prepare_scenario(s, g)
            if value is not None:
                s = value
    return s


def exclude_data_link(s, link):
    return any(getattr(module, "exclude_data_link", lambda *_: False)(s, link) for module in modules())


def transform(name, s, values, g):
    for module in modules():
        method = getattr(module, name, None)
        if method:
            value = method(s, values, g)
            if value is not None:
                values = value
    return values


def preparation(s, row_no=None, route=False):
    ensure_configured(s.repo)
    result = []
    for module in modules():
        if hasattr(module, "preparation"):
            result.extend(module.preparation(s, row_no=row_no, route=route) or [])
    return result


def resolve_link_identity(artifact, producer, business):
    artifact = re.sub(r"^#\d+\s*", "", artifact).strip()
    for module in modules():
        method = getattr(module, "resolve_link_identity", None)
        if method:
            value = method(artifact, producer, business)
            if value:
                return value
    return None


def resolve_link_origin(artifact, producer, business):
    artifact = re.sub(r"^#\d+\s*", "", artifact).strip()
    for module in modules():
        method = getattr(module, "resolve_link_origin", None)
        if method:
            value = method(artifact, producer, business)
            if value:
                return value
    return None
