"""観点の当てはめ契約（scenario_test/coverage/viewpoint_contracts.json の items）をテスト項目にする。

契約は観点ごとに「どのシナリオで・何を・どう確かめるか」を原典の引用付きで書いたもの。
項目は既存の項目の後ろに足し、既存のテストIDを振り直さない。テスト観点の値は「SV-xx-yy 観点名」。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

CONTRACT_PATH = "scenario_test/coverage/viewpoint_contracts.json"
FRAMEWORK_PATH = "scenario_test/外部資料観点/観点体系.md"
FLOW_TYPES = ("正常系", "代替系", "異常系")

_by_scenario: dict[str, list[dict]] | None = None
_names: dict[str, str] = {}


def _repo() -> Path:
    return Path(__file__).resolve().parents[4]


def load(repo: Path | None = None) -> dict[str, list[dict]]:
    global _by_scenario
    if _by_scenario is not None:
        return _by_scenario
    root = repo or _repo()
    _by_scenario = {}
    framework = root / FRAMEWORK_PATH
    if framework.is_file():
        for vid, name in re.findall(r"^\| (SV-\d\d-\d\d) \| ([^|]+?) \|", framework.read_text(encoding="utf-8"), re.M):
            _names[vid] = name
    path = root / CONTRACT_PATH
    if not path.is_file():
        return _by_scenario
    data = json.loads(path.read_text(encoding="utf-8"))
    for contract in data.get("items", []):
        if not contract.get("disposition", "adopted").startswith("adopted"):
            continue
        vid = contract["viewpoint"]
        if vid not in _names:
            raise ValueError(f"観点の契約が第1部に無い観点を指している: {contract['contract_id']} {vid}")
        if contract.get("flow_type") not in FLOW_TYPES:
            raise ValueError(f"観点の契約の flow_type が不正: {contract['contract_id']}")
        for marker in ("【準備確認】", "【操作】", "【操作後確認】"):
            if marker not in contract["operation"]:
                raise ValueError(f"観点の契約の操作に {marker} が無い: {contract['contract_id']}")
        if not contract.get("evidence"):
            raise ValueError(f"観点の契約に根拠が無い: {contract['contract_id']}")
        _by_scenario.setdefault(contract["scenario_id"], []).append(contract)
    return _by_scenario


def label(viewpoint_id: str) -> str:
    return f"{viewpoint_id} {_names[viewpoint_id]}"


def citations(contract: dict) -> str:
    return " / ".join(f"{e['file']}:{e['line']}" for e in contract["evidence"])


def reserved_numbers(sid: str) -> set[int]:
    """業務の裁定で外した作り直し前のテストID（retired_items）の番号。欠番として残し、振り直さない。"""
    path = _repo() / CONTRACT_PATH
    if not path.is_file():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return {int(r["test_id"].rsplit("-", 1)[1]) for r in data.get("retired_items", []) if r["scenario_id"] == sid}


def items_for(s, start: int, g) -> list:
    """g は generate_test_items モジュール（補助関数と TestItem を使う）。"""
    contracts = load().get(s.sid, [])
    reserved = reserved_numbers(s.sid)
    if reserved:
        # 外したIDは既存の項目の後ろにだけある前提（途中にあると既存の項目のIDがずれる）
        if min(reserved) < start:
            raise ValueError(f"外したテストIDが既存の項目の途中にある: {s.sid} {sorted(reserved)} start={start}")
        start = max(reserved) + 1
    result = []
    pattern = g.normal_representative_pattern(s)
    for contract in contracts:
        tid = f"STI-{g.scenario_suffix(s.sid)}-{start + len(result):03d}"
        ifid = contract.get("function_id") or "-"
        flow = contract["flow_type"]
        expected = g.normalize_expected_result(contract["expected_result"])
        refs = citations(contract)
        precondition = g.build_precondition(s, pattern, ifid, contract["item_name"])
        precondition += (f"\n- 観点: {label(contract['viewpoint'])}（観点の当てはめ契約 {contract['contract_id']}）"
                         f"\n- 観点の準備: {contract['precondition']}\n- 判定根拠: {refs}")
        location = re.sub(r"^確認場所[:：]\s*", "", contract["observation"].strip())
        observation = g.build_observation(s, tid, ifid, expected, location, operation=contract["item_name"])
        observation += f"\n判定根拠: {refs}"
        pattern_id = pattern.pattern_id if pattern else "-"
        head, _, rest = contract["operation"].partition("【準備確認】")
        steps = f"{head}【準備確認】\n経路ID: {s.route_id} / データパターンID: {pattern_id}\n{rest.lstrip()}"
        input_data = g.pattern_input(pattern, g.primary_seed(s.seed)) + f"\n観点の入力: {contract['input']}"
        priority = "P1" if flow == "異常系" else s.priority
        result.append(g.TestItem(
            g.function_display_name(s), tid, ifid, label(contract["viewpoint"]), priority,
            f"{flow} 観点{contract['viewpoint']}: {contract['item_name']}", precondition, input_data,
            steps, expected, observation, flow, s.sid))
    return result
