"""HTML・業務フローを人手照合した工程契約を生成器へ適用する。"""
from __future__ import annotations

import json
import re
from pathlib import Path

CONTRACTS: list[dict] = []


def configure(repo: Path) -> None:
    CONTRACTS.clear()
    path = repo / "scenario_test/coverage/source_contracts.json"
    if path.is_file():
        from execution_repairs import contracts
        CONTRACTS.extend(contracts(repo))


def find(business: str, pattern, row: str, action: str) -> dict | None:
    """完全な行動一致を優先。継続行補正後は出典ファイル・R番号で同じ原典行に限る。"""
    candidates = [c for c in CONTRACTS if c["business"] == business]
    for contract in candidates:
        if contract["source_action"] == action:
            return contract
    match = re.search(r"(?:^|[ *-])R(\d+)(?:\*\*)?:", row)
    if not match:
        return None
    for contract in candidates:
        for evidence in contract["source_evidence"]:
            if evidence["file"] == pattern.source_path and evidence.get("source_row") == "R" + match[1]:
                # 分岐専用に書き換えた行へ共通ルートの操作を戻さない。継続行の追記だけを許容する。
                old = re.sub(r"\s+", "", contract["source_action"])
                new = re.sub(r"\s+", "", action)
                if old in new:
                    return contract
    return None


def citations(contract: dict) -> str:
    return " / ".join(f"{e['file']}:{e['line']}" + (f"#{e['section']}" if e.get("section") else "") for e in contract["evidence"])


def apply(contract: dict | None, values: tuple, g) -> tuple:
    if contract is None:
        return values
    actor, action, screen, feature, expected, observation = values
    kind = contract["kind"]
    actor = contract.get("actor") or actor
    if kind in ("system", "mixed"):
        screen = contract["screen"]
        feature = "・".join(contract["function_ids"]) or "-"
        if not contract["function_ids"]:
            # 例: スマレジで決済→EC-CUBEの結果確認。EC-CUBE画面操作へ誤置換しない。
            screen = g.EXTERNAL_SCREEN
    elif kind == "physical":
        screen, feature = g.PHYSICAL_SCREEN, "-"
    elif kind == "external":
        screen, feature = g.EXTERNAL_SCREEN, "-"
    elif kind == "subflow" and contract.get("subflow_targets"):
        screen, feature = "別業務フロー参照（対象工程・共通キーは実行手順参照）", "-"
    elif kind in ("heading", "expanded"):
        screen, feature = "業務判断（展開済み詳細工程との対応確認）", "-"
    elif kind == "decision":
        screen, feature = g.DECISION_SCREEN, "-"
    else:
        screen, feature = g.FLOW_ONLY_SCREEN, "-"
    expected = contract.get("expected_result") or expected
    # Readiness belongs to preparation/operation and evidence notes. The expected
    # result remains the actual business outcome even while execution is held.
    observation = "照合キー: " + "・".join(contract["matching_keys"]) + " / 出典: " + citations(contract)
    if contract.get("reason"):
        observation += " / 設計差・留意点: " + contract["reason"]
    return actor, action, screen, feature, expected, observation


def operation(contract: dict | None, default: str) -> str:
    if not contract:
        return default
    value = contract.get("operation") or default
    if contract["disposition"] != "adopted":
        value += "（実施保留条件: " + contract["reason"] + "）"
    return value


def augment_seed(s, seed: dict[str, str], g) -> dict[str, str]:
    pattern = g.scenario_route_pattern(s)
    for row in g.normal_flow_rows(pattern):
        contract = find(s.business_title, pattern, row, g.business_action_from_row(row, pattern.name))
        if not contract or not contract.get("subflow_targets"):
            continue
        needed = set(contract["matching_keys"])
        for target in contract["subflow_targets"]:
            needed.update(target["matching_keys"])
        conditions = " ".join(target.get("condition", "") for target in contract["subflow_targets"])
        for key, value in contract.get("parameter_values", {}).items():
            if key in needed or key in conditions or key in ("本人確認状態", "実在庫登録状態"):
                seed.setdefault(key, value)
        for key, value in contract.get("runtime_keys", {}).items():
            if key in needed:
                seed.setdefault(key, "未採番時は登録後に記録: " + value)
    return seed
