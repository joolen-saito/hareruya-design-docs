"""出典付きHTML補完・業務間連鎖を通常のSCN/STIパイプラインへ載せる。"""
from __future__ import annotations

import json
from pathlib import Path

RECORDS: dict[str, dict] = {}


def append(repo: Path, scenarios: list, docs: list, g) -> None:
    import source_contract_adapter as adapter
    RECORDS.clear()
    path = repo / "scenario_test/coverage/source_contracts.json"
    data = json.loads(path.read_text())
    pairs = [(data, category) for category in ("missing_pattern_resolutions", "cross_business_routes", "html_routes")]
    # 観点の当てはめで足す経路（scenario_id を必ず持つ）。
    viewpoint_path = repo / "scenario_test/coverage/viewpoint_contracts.json"
    if viewpoint_path.is_file():
        pairs.append((json.loads(viewpoint_path.read_text()), "routes"))
    for data, category in pairs:
        for record in data.get(category, []):
            if not record["disposition"].startswith("adopted"):
                continue
            cross = category == "cross_business_routes"
            sid = record.get("scenario_id") or ("SCN-TSUHAN-購入入金国内出荷連鎖-901" if cross else "SCN-TSUHAN-在庫移動準備業務-900")
            source = record.get("source_file", "scenario_test/coverage/source_contracts.json")
            rows = []
            for step in record["steps"]:
                row = f"- R{step['no']}: {record.get('pattern_number', '99')}-{step['no']} {step['screen']} {step['operation']}"
                g.ROW_SUMMARY[row] = step["screen"]
                rows.append(row)
                adapter.CONTRACTS.append({
                    **step, "business": record["business"], "source_action": g.business_action_from_row(row, record["pattern_name"]),
                    "source_evidence": [], "disposition": "adopted", "reason": "HTML/業務フローの明記を補完。出典は確認対象を参照。",
                })
            pattern = g.Pattern(record.get("pattern_number", "連鎖01"), record["pattern_name"], rows, source_path=source)
            evidence = record["basis"] + " " + " / ".join(record.get("known_limits", []))
            route = g.BusinessRoute("R01", record["route_kind"], record.get("route_name", record["pattern_name"]),
                                    record.get("condition", record["precondition"]), record["final_state"].rstrip("。") + "ことを確認できること。", tuple(rows), (), record["precondition"],
                                    tuple(record["seed"].items()), evidence)
            features = {f for step in record["steps"] for f in step["function_ids"]}
            references = {e["file"] for step in record["steps"] for e in step["evidence"]}
            feature_docs = [d for d in docs if d.kind == "function" and d.feature_no in features]
            html_docs = [d for d in docs if d.kind == "basic-html" and str(d.path) in references]
            scenario = g.Scenario(sid, route.title, record["business"], Path(source), pattern, route, feature_docs,
                                  html_docs, g.coverage_for(record["business"], pattern, feature_docs, route))
            scenarios.append(scenario)
            RECORDS[sid] = record
            if not cross:
                g.MISSING_PATTERNS[:] = [item for item in g.MISSING_PATTERNS if not (str(item[0]) == source and item[1] == record["pattern_number"] and item[3].startswith("本文欠落"))]


def seed(sid: str) -> dict[str, str] | None:
    record = RECORDS.get(sid)
    if not record:
        return None
    values = {"担当者アカウント": "各担当者の実在テストアカウントを役割と店舗権限に対応付けて記録する", **record["seed"]}
    if record["contract_id"] == "SUP-TSUHAN-13":
        values["対象ID"] = "開始前に準備した2件の在庫移動・振替IDを記録する"
        values["移動指示ID"] = "工程1で実際に採番されたIDを記録し工程2〜4で保持する"
    return values


def chain_rows(sid: str) -> str | None:
    record = RECORDS.get(sid)
    if not record:
        return None
    first, *remaining = record["steps"]
    rows = []
    cross = "CROSS" in record["contract_id"]
    primary_key = record.get("primary_key") or ("実受注番号" if cross else "移動指示ID")
    for step in remaining:
        key = primary_key + "=工程1で実際に採番した値を全工程で保持・記録（再シード不可）"
        artifact = record.get("chain_artifact") or ("同一受注の対象記録" if cross else "在庫移動指示・送り状データ")
        expected = f"工程1で採番した{primary_key}と工程{step['no']}の対象が同一であり、{'・'.join(step['matching_keys'])}を工程間の実行記録で照合できること。"
        evidence = " / ".join(f"{e['file']}:{e['line']}" for e in step["evidence"])
        rows.append(f"| DL-{len(rows)+1:02d} | #1 {first['screen']} | {artifact} | #{step['no']} {step['screen']} | {expected} 出典: {evidence} | {key} | 連鎖あり（HTML・業務フローの同一対象照合） |")
    if record["contract_id"] == "SUP-TSUHAN-13":
        rows.append("| DL-04 | #3 ゆうプリR | 送り状No. | #4 送り状番号登録 | ゆうプリRで取得した送り状No.が同じ移動指示へ登録され、発送状況=済・移動ステータス=移動中となること。出典: 0202 sheet-32 | 移動指示ID・送り状No.=工程1・3で実際に採番した値 | 連鎖あり（HTML明記） |")
    return "\n".join(rows)


def step_target(sid: str, number: int, values: dict[str, str]) -> str | None:
    record = RECORDS.get(sid)
    if not record:
        return None
    step = record["steps"][number - 1]
    return " / ".join(key + "=" + values.get(key, "前工程の実行記録にある値。初回採番時は当該登録後に記録する") for key in step["matching_keys"])
