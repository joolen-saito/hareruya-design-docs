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
    # 観点の当てはめで見つけた工程の補正（同じ contract_id なら既存を上書きする）。
    viewpoint = repo / "scenario_test/coverage/viewpoint_contracts.json"
    if viewpoint.exists():
        for record in json.loads(viewpoint.read_text()).get("step_resolutions", []):
            cid = record["contract_id"]
            indexed[cid] = {**indexed.get(cid, {}), **record, "contract_file": str(viewpoint.relative_to(repo))}
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
    if name == "seed":
        # 観点の当てはめで足した工程ごとの対象（別の受注など）。代表データは変えずに項目を足す。
        additions = _viewpoint(getattr(s, "repo", REPO)).get("seed_additions", {}).get(s.sid, {})
        values = {**values, **additions} if additions else values
    return values


def _viewpoint(repo) -> dict:
    path = Path(repo) / "scenario_test/coverage/viewpoint_contracts.json"
    return json.loads(path.read_text()) if path.exists() else {}


def retired_scenarios(repo) -> dict[str, str]:
    """業務の裁定で成り立たなくなったシナリオ（scenario_id → 理由）。生成しない。"""
    return {r["scenario_id"]: r["reason"] for r in _viewpoint(repo).get("retired_scenarios", [])}


def step_target(s, number: int, seed: dict) -> tuple[str, str | None] | None:
    """観点の当てはめ契約の step_targets から、工程 number の対象（入力/対象の文）と照合キーの項目名を返す。"""
    for record in _viewpoint(getattr(s, "repo", REPO)).get("step_targets", []):
        if record["scenario_id"] == s.sid and int(record["step"]) == number:
            keys = re.findall(r"\{([^}]+)\}", record["target"])
            missing = [k for k in keys if not seed.get(k)]
            if missing:
                raise ValueError(f"工程の対象に使う項目が実行用テストデータに無い: {s.sid} #{number} {missing}")
            text = re.sub(r"\{([^}]+)\}", lambda m: seed[m.group(1)], record["target"])
            return text, record.get("chain_key")
    return None


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
