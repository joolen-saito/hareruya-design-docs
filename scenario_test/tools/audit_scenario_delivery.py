#!/usr/bin/env python3
"""シナリオ・項目・配布用TSV・実行可否台帳の参照整合を実ファイルで検証する。"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "scenario_test"
sys.path.insert(0, str(ROOT / ".codex/skills/hareruya-scenario-test-cases/scripts"))
import execution_repairs


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def table(text: str, title: str) -> list[list[str]]:
    section = re.search(r"^## " + re.escape(title) + r"[^\n]*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not section:
        return []
    rows = []
    for line in section[1].splitlines():
        if not line.startswith("|") or re.fullmatch(r"[| :\-]+", line):
            continue
        rows.append([v.strip() for v in line.strip("|").split("|")])
    return rows[1:]


def main() -> None:
    csv.field_size_limit(10**7)
    contracts = json.loads((BASE / "coverage/source_contracts.json").read_text())
    contracts["step_resolutions"] = execution_repairs.contracts(ROOT)
    normalized_sources = {}
    raw_sources = {}
    evidence_count = 0
    for contract in contracts["step_resolutions"] + contracts["missing_pattern_resolutions"] + contracts["cross_business_routes"] + contracts.get("html_routes", []):
        evidence = contract.get("evidence", []) + [e for step in contract.get("steps", []) for e in step["evidence"]]
        for item in evidence:
            source = item["file"]
            if source not in normalized_sources:
                raw = (ROOT / source).read_text()
                raw_sources[source] = re.sub(r"\s+", "", html.unescape(raw))
                normalized_sources[source] = re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", raw)))
            quote = re.sub(r"\s+", "", html.unescape(item["quote"]))
            assert quote and (quote in normalized_sources[source] or quote in raw_sources[source]), f"出典引用が原典に存在しない: {contract['contract_id']} {source}"
            evidence_count += 1
    paths = sorted((BASE / "scenario").glob("SCN-*.md"))
    scns = {p.name.split("_", 1)[0]: p for p in paths}
    assert len(scns) == len(paths), "SCN-ID重複"
    aggregate = read_tsv(BASE / "scenario/all_scenarios.tsv")
    assert Counter(r["シナリオID"] for r in aggregate) == Counter(scns.keys()), "SCN集約の欠落・重複"
    for row in aggregate:
        assert (ROOT / row["SCNファイル"]).resolve() == scns[row["シナリオID"]].resolve(), row["SCNファイル"]
    items = read_tsv(BASE / "test_items/all_scenario_test_items.tsv")
    item_ids = Counter(r["テストID"] for r in items)
    assert all(v == 1 for v in item_ids.values()), "STI-ID重複"
    by_scn: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in items:
        sid = re.search(r"元シナリオ: (\S+)", row["前提条件"])[1]
        assert sid in scns, f"項目から存在しないSCNを参照: {sid}"
        by_scn[sid].append(row)
    assert set(by_scn) == set(scns), "項目化されないSCN"
    for sid, rows in by_scn.items():
        assert sum(r["テスト観点"] == "業務経路" for r in rows) == 1, sid
    files = sorted((BASE / "exec/tsv").glob("*.tsv"))
    execution = [r for p in files for r in read_tsv(p)]
    assert Counter(r["テストID"] for r in execution) == item_ids, "配布用TSVの欠落・旧ID残存"
    steps = read_tsv(BASE / "exec/feasibility/feasibility_by_step.tsv")
    feasibility = read_tsv(BASE / "exec/feasibility/feasibility_by_scenario.tsv")
    assert Counter(r["シナリオID"] for r in feasibility) == Counter(scns.keys()), "可否台帳のSCN不一致"
    expected_steps = Counter((sid, r[0]) for sid, p in scns.items() for r in table(p.read_text(), "メインフロー"))
    assert Counter((r["シナリオID"], r["工程#"]) for r in steps) == expected_steps, "可否台帳の工程不一致"
    for row in steps:
        for tid in re.findall(r"STI-[A-Z0-9-]+", row["対応テストID"]):
            assert tid in item_ids, f"可否台帳に旧テストID: {tid}"
    active_cases = {r["テストID"] for r in read_tsv(ROOT / "integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv")}
    delegation = Counter()
    chain_rows = []
    for sid, path in scns.items():
        text = path.read_text()
        for row in table(text, "他層委譲（結合テスト）"):
            delegation[row[-1]] += 1
            for tid in re.findall(r"`(IT-[^`]+)`", row[2]):
                assert tid in active_cases, f"結合ケース参照切れ: {tid}"
        for row in table(text, "データ連鎖"):
            if row[0].startswith("DL-"):
                chain_rows.append((sid, row))
                assert any(row[0] in r["入力データ/リクエスト内容"] + r["テスト項目名"] for r in by_scn[sid]), f"連鎖の未項目化: {sid}/{row[0]}"
    summary = {
        "scenario_count": len(scns), "item_count": len(items), "step_count": len(steps),
        "execution_files": len(files), "chain_count": len(chain_rows),
        "by_business": dict(Counter(r["機能名"].split(" — ")[0] for r in items)),
        "by_viewpoint": dict(Counter(r["テスト観点"] for r in items)),
        "scenario_feasibility": dict(Counter(r["判定"] for r in feasibility)),
        "step_feasibility": dict(Counter(r["判定"] for r in steps)),
        "delegation": dict(delegation),
        "checks": "SCN一覧・STI・配布TSV・可否台帳の集合一致、データ連鎖の項目化、現行結合ケースの参照実在を検証",
        "runtime_test_executed": False,
        "verified_source_quotes": evidence_count,
    }
    out = BASE / "coverage"
    out.mkdir(exist_ok=True)
    (out / "delivery_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    sources = sorted(set(
        paths + files + list((BASE / "test_items").glob("STI-*.md"))
        + [BASE / "test_items/all_scenario_test_items.tsv", BASE / "scenario/all_scenarios.tsv", BASE / "coverage/source_contracts.json"]
        + list((BASE / "coverage/execution_repairs").glob("*_contracts.json"))
        + list((BASE / "exec/feasibility").glob("*.tsv"))
        + [ROOT / source for source in normalized_sources]
    ))
    with (out / "delivery_sha256.tsv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["ファイル", "SHA256"])
        for path in sources:
            writer.writerow([str(path.relative_to(ROOT)), hashlib.sha256(path.read_bytes()).hexdigest()])
    publish(summary, items, files)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def publish(summary: dict, items: list[dict], files: list[Path]) -> None:
    lines = ["# 作成済みシナリオテストの観点一覧", "", "<!-- generated-by: audit_scenario_delivery.py -->", "",
             "- 集計元: `test_items/all_scenario_test_items.tsv`", "- 補完・再照合日: 2026-10-09",
             f"- シナリオ: {summary['scenario_count']}件 / テスト項目: {summary['item_count']}件 / 業務工程: {summary['step_count']}件", "",
             "HTML設計書と採用業務フローを根拠に作成した項目の集計。件数自体は要件網羅率や実機合格率を示さない。", "",
             "目的は、システムが業務に必要な品質を満たし、実際の業務が開始から完了まで回ることを判断できるケースにすること。[目的と完了基準](システムテストの目的と完了基準.md)に従う。", "",
             "| テスト観点 | 項目数 | 対象業務 |", "|---|---:|---|"]
    for viewpoint, count in sorted(summary["by_viewpoint"].items()):
        businesses = sorted({r["機能名"].split(" — ")[0] for r in items if r["テスト観点"] == viewpoint})
        lines.append(f"| {viewpoint} | {count} | {' / '.join(businesses)} |")
    lines.extend(["", "- 業務分岐とその出典は各SCNの経路条件・データパターンに記載する。",
                  "- データ連鎖は産出側と消費側の照合項目を作成する。照合キー未確定は実施保留として残す。",
                  "- 他層委譲は現行の結合テスト正本に実在するIDを参照する。未対応・準備未確定を別表示し、実行済みとは扱わない。",
                  "- [同期検証結果](coverage/delivery_summary.json) / [出典補完記録](coverage/source_contracts.json)",
                  "- [実施手順の修正結果と現在の準備条件](coverage/execution_repairs/README.md)", ""])
    (BASE / "シナリオテスト観点.md").write_text("\n".join(lines))
    lines = ["# シナリオテスト 実行用TSV", "", "<!-- generated-by: audit_scenario_delivery.py -->", "",
             f"正本 `../test_items/all_scenario_test_items.tsv` の{summary['item_count']}項目を、業務別の14列TSVへ変換した。", "",
             "[目的と完了基準](../システムテストの目的と完了基準.md)に従い、各経路の全必須判定と最終業務状態から業務成立を判定する。[必須判定一覧](../coverage/business_goal_review/route_acceptance.tsv)で経路と個別判定を対応付ける。", "",
             "| ファイル | 業務 | 項目数 |", "|---|---|---:|"]
    for path in files:
        rows = read_tsv(path)
        lines.append(f"| [ {path.name} ](tsv/{path.name}) | {rows[0]['機能名'].split(' — ')[0]} | {len(rows)} |")
    lines.extend(["", "元の11列に使用シード・自動検証・実行方法を加える。前提条件から移した情報は逆変換で照合し、操作の改行は ` ⏎ ` として保持する。",
                  "最新版の[項目別実施条件と修正記録](../coverage/execution_repairs/README.md)を確認する。旧テストIDからの対応表もここに保存している。",
                  "実行方法はテスト実施方法として手動。自動検証欄の `—` は業務データの更新がないことを意味しない。実施保留・条件付きの項目は準備手順と理由を確認してから実施する。", "",
                  "再生成: `python3 scenario_test/tools/emit_scenario_concretized_tsv.py`。構造・逆変換・件数ゲートで情報欠落を検出する。",
                  "同期検証: `python3 scenario_test/tools/audit_scenario_delivery.py`。SCN・項目・実行用表・可否台帳のIDと工程を照合する。", "",
                  "実機でのテスト実行結果は含まない。設計どおりに動作するかは実施時に判定する。", ""])
    (BASE / "exec/README.md").write_text("\n".join(lines))
    lines = ["# 業務完遂可否の事前検証（机上）", "", "<!-- generated-by: audit_scenario_delivery.py -->", "",
             "最新SCNの工程と機能Noを、既存の未解決実装乖離台帳に照合した結果。機能単位の指摘のため、当該操作に該当するかは実施前に確認する。", "",
             "以前の設計なし判定は現在HTMLの補完結果で再評価した。実行手段未特定は設計書が存在しないという断定ではない。", ""]
    for name, data in [("シナリオ", summary["scenario_feasibility"]), ("工程", summary["step_feasibility"])]:
        lines.extend([f"## {name}単位", "", "| 机上判定 | 件数 |", "|---|---:|"])
        lines.extend(f"| {key} | {value} |" for key, value in data.items())
        lines.append("")
    lines.extend(["『実行可(乖離指摘なし)』は使用機能に台帳上の未解決指摘がないという意味で、実機合格を保証しない。現場・外部システム作業は別担当の準備と証跡も必要。", "",
                  "生成: `python3 scenario_test/tools/build_feasibility_ledger.py`。項目を生成した後にも再実行し、対応テストIDを同期する。", "",
                  "出典調査と残件: [source_contracts.json](../../coverage/source_contracts.json)。項目の実施保留条件は当該STIを参照する。", ""])
    lines.extend(["工程台帳に加え、外部原本・先行工程・データ連鎖も含めた最新の項目別判定は[実施条件一覧](../../coverage/execution_repairs/item_readiness.tsv)を参照する。", ""])
    (BASE / "exec/feasibility/README.md").write_text("\n".join(lines))


if __name__ == "__main__":
    main()
