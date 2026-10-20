#!/usr/bin/env python3
"""シナリオ・項目・配布用TSV・実行可否台帳の参照整合を実ファイルで検証する。"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import posixpath
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
    # 観点の当てはめ契約（項目・経路）の引用も同じ方法で照合する。
    viewpoint_path = BASE / "coverage/viewpoint_contracts.json"
    viewpoint_contracts = json.loads(viewpoint_path.read_text()) if viewpoint_path.is_file() else {}
    step_targets = [{**t, "contract_id": f"{t['scenario_id']}#{t['step']}"} for t in viewpoint_contracts.get("step_targets", [])]
    for contract in viewpoint_contracts.get("items", []) + viewpoint_contracts.get("routes", []) + step_targets:
        evidence = contract.get("evidence", []) + [e for step in contract.get("steps", []) for e in step.get("evidence", [])]
        assert evidence, f"観点の契約に根拠が無い: {contract['contract_id']}"
        for item in evidence:
            source = item["file"]
            # functions/ec-cube-enterprise/ は新実装から起こした資料で、期待値の根拠にしない。
            assert not source.startswith("functions/ec-cube-enterprise/"), f"観点の契約が新実装の資料を根拠にしている: {contract['contract_id']} {source}"
            if source not in normalized_sources:
                raw = (ROOT / source).read_text()
                raw_sources[source] = re.sub(r"\s+", "", html.unescape(raw))
                normalized_sources[source] = re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", raw)))
            quote = re.sub(r"\s+", "", html.unescape(item["quote"]))
            assert quote and (quote in normalized_sources[source] or quote in raw_sources[source]), f"観点の契約の引用が原典に存在しない: {contract['contract_id']} {source}"
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


def viewpoint_contracts_routes() -> list[dict]:
    path = BASE / "coverage/viewpoint_contracts.json"
    return json.loads(path.read_text()).get("routes", []) if path.is_file() else []


def publish(summary: dict, items: list[dict], files: list[Path]) -> None:
    # 第1部（観点の体系）は 外部資料観点/tools/build.py が生成した断片を取り込む。
    framework_dir = BASE / "外部資料観点"
    framework = (framework_dir / "観点体系.md").read_text().rstrip()
    # 断片のリンクは 外部資料観点/ からの相対なので、この文書（scenario_test/）からの相対に直す。
    framework = re.sub(r"\]\((?!https?:|#|/)([^)]+)\)",
                       lambda m: "](" + posixpath.normpath("外部資料観点/" + m[1]) + ")", framework)
    label_map = {r["テスト観点"]: r for r in read_tsv(framework_dir / "label_map.tsv")}
    # 観点の当てはめ契約から作った項目は「SV-xx-yy 観点名」を値に持つので、その観点自身に対応づける。
    for viewpoint in summary["by_viewpoint"]:
        m = re.match(r"(SV-\d\d-\d\d) (.+)$", viewpoint)
        if m and viewpoint not in label_map:
            label_map[viewpoint] = {"テスト観点": viewpoint, "対応する観点": m[1], "観点名": m[2], "分類": m[1][:5], "関連する観点": ""}
    unmapped = sorted(set(summary["by_viewpoint"]) - set(label_map))
    assert not unmapped, f"観点の対応が未定義のテスト観点（外部資料観点/tools/spec.py の LABEL_MAP に追加する）: {unmapped}"
    groups = re.findall(r"^\| (SV-\d\d) \| ([^|]+?) \| (\d+) \|$", framework, re.M)
    n_viewpoints = sum(int(n) for _, _, n in groups)
    viewpoint_rows = re.findall(r"^\| (SV-\d\d)-\d\d \|", framework, re.M)
    assert groups and Counter(viewpoint_rows) == {g: int(n) for g, _, n in groups}, "観点体系.md の分類表と観点の行が一致しない（第1部の取り込み失敗）"
    group_ids = {g for g, _, _ in groups}
    for label, row in label_map.items():
        assert row["分類"] in group_ids and f"| {row['対応する観点']} |" in framework, f"対応表の観点が第1部に無い: {label} {row['対応する観点']}"
    lines = ["# シナリオテスト観点", "", "<!-- generated-by: audit_scenario_delivery.py（第1部は 外部資料観点/観点体系.md を取り込む） -->", "",
             "シナリオテストで確認すべき観点と、作成済みテスト項目の観点をまとめる。目的は、システムが業務に必要な品質を満たし、実際の業務が開始から完了まで回ることを判断できるケースにすること。[目的と完了基準](システムテストの目的と完了基準.md)に従う。", "",
             f"- 第1部 観点の体系: 確認すべき観点（{len(groups)}分類・{n_viewpoints}件）。IPA などの公開資料から整理した。",
             "- 第2部 作成済みテスト項目の観点: `test_items/all_scenario_test_items.tsv` の集計と、第1部の観点への対応。", "",
             "## 第1部 観点の体系", "", framework, "",
             "## 第2部 作成済みテスト項目の観点", "",
             "- 集計元: `test_items/all_scenario_test_items.tsv`", "- 補完・再照合日: 2026-10-09",
             f"- シナリオ: {summary['scenario_count']}件 / テスト項目: {summary['item_count']}件 / 業務工程: {summary['step_count']}件", "",
             "HTML設計書と採用業務フローを根拠に作成した項目の集計。件数自体は要件網羅率や実機合格率を示さない。", "",
             "「対応する観点」は、テスト観点の付与規則から著者が対応づけた第1部の観点（[対応表](外部資料観点/label_map.tsv)）。項目のテスト観点の値そのものは変えていない。", "",
             "| テスト観点 | 項目数 | 対象業務 | 対応する観点 |", "|---|---:|---|---|"]
    for viewpoint, count in sorted(summary["by_viewpoint"].items()):
        businesses = sorted({r["機能名"].split(" — ")[0] for r in items if r["テスト観点"] == viewpoint})
        mapping = label_map[viewpoint]
        related = f"（関連: {mapping['関連する観点']}）" if mapping["関連する観点"] else ""
        lines.append(f"| {viewpoint} | {count} | {' / '.join(businesses)} | {mapping['対応する観点']} {mapping['観点名']}{related} |")
    by_group: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for viewpoint, count in sorted(summary["by_viewpoint"].items()):
        by_group[label_map[viewpoint]["分類"]].append((viewpoint, count))
    lines.extend(["", "### 分類ごとの作成済み項目", "",
                  "各テスト観点を「対応する観点」の分類で数えた。テスト観点は1項目に1つなので、0件の分類は、その分類を主な観点とする項目が無いことを示す。項目の内容が他の分類の観点を含むことはある。権限・入力検証・重複処理などは機能・結合テストとの対応も含めて評価し、性能・同時実行・復旧などは受入要件がある場合にその要件に対応するテストと結果で評価する（[目的と完了基準](システムテストの目的と完了基準.md)「品質を判断する範囲」）。", "",
                  "| 分類 | 名前 | 作成済みのテスト観点 | 項目数 |", "|---|---|---|---:|"])
    for gid, gname, _ in groups:
        members = by_group.get(gid, [])
        names = " / ".join(f"{v}（{c}）" for v, c in members) or "—"
        lines.append(f"| {gid} | {gname} | {names} | {sum(c for _, c in members)} |")
    # 業務ごとの観点の当てはめ（判定台帳）と、観点で足した経路
    ledgers = sorted((BASE / "coverage/viewpoint_application").glob("*.tsv"))
    if ledgers:
        kinds = ["既存項目で確認済み", "追加", "他層で確認", "根拠待ち", "適用外"]
        lines.extend(["", "### 業務ごとの観点の当てはめ", "",
                      "第1部の観点を業務のシナリオに当てはめ、観点ごとに判定した結果（判定台帳）。「追加」は既存シナリオへの項目追加か新しい経路で確かめる観点、"
                      "「根拠待ち」は当てはまるが業務フロー・設計書に期待結果を決める記述が無い観点。台帳の無い業務はまだ当てはめていない。", "",
                      "| 業務 | 判定した観点 | " + " | ".join(kinds) + " | 台帳 |", "|---|---:|" + "---:|" * len(kinds) + "---|"])
        group_rows = []
        for path in ledgers:
            rows = read_tsv(path)
            counts = Counter(next((k for k in kinds if r["判定"].startswith(k)), r["判定"]) for r in rows)
            lines.append(f"| {path.stem} | {len(rows)} | " + " | ".join(str(counts.get(k, 0)) for k in kinds)
                         + f" | [{path.name}](coverage/viewpoint_application/{path.name}) |")
            by = defaultdict(Counter)
            for r in rows:
                by[r["観点ID"][:5]][next((k for k in kinds if r["判定"].startswith(k)), r["判定"])] += 1
            group_rows.append((path.stem, by))
        for business, by in group_rows:
            lines.extend(["", f"{business}の分類ごとの判定:", "", "| 分類 | 名前 | " + " | ".join(kinds) + " |", "|---|---|" + "---:|" * len(kinds)])
            for gid, gname, _ in groups:
                lines.append(f"| {gid} | {gname} | " + " | ".join(str(by[gid].get(k, 0)) for k in kinds) + " |")
        routes = viewpoint_contracts_routes()
        if routes:
            lines.extend(["", "観点の当てはめで足した経路（シナリオ）:", "", "| シナリオ | 経路 | 観点 |", "|---|---|---|"])
            for route in routes:
                lines.append(f"| {route['scenario_id']} | {route['route_name']} | {'・'.join(route['viewpoint'])} |")
    lines.extend(["", "- 業務分岐とその出典は各SCNの経路条件・データパターンに記載する。",
                  "- データ連鎖は産出側と消費側の照合項目を作成する。終端の工程では成果物を作業元の確定値と照合し、後続工程への受け渡しは判定しない。照合キー未確定は実施保留として残す。",
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
