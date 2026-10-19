#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path


REQUIRED_SECTIONS = [
    "## 概要",
    "## アクター",
    "## 事前条件・テストデータ・環境",
    "## 実行用テストデータ",
    "## データパターン",
    "## メインフロー（正常系）",
    "## 実行手順（正常系）",
    "## 代替フロー / 異常系分岐",
    "## 実行手順（代替系・異常系）",
    "## 完了条件（業務的ゴール／データ状態の最終確認）",
    "## システムテストカバレッジ",
    "## エッジケース要約",
    "## トレーサビリティ",
]
FORBIDDEN = ("設計どおり", "設計書に記載のとおり", "UI標準")
UNRESOLVED = ("UNRESOLVED_FUNCTION_SPEC", "UNRESOLVED_HTML_DESIGN_DOC")
# `要確認` は**全面禁止**（曖昧なまま出荷しない）。依頼者確定: テストケースに「要確認」表現を
# 残さない。全工程を種別ごとに具体手順化する（EC-CUBE=機能No/物理=現物観測/外部=外部記録＋
# 業務結果観測/バッチ=コマンド＋DB観測/判断=分岐評価/設計書不在=業務フロー記載の操作＋業務結果）。
# 08_要確認トリアージ.tsv（人手判定・機能No実在検証済み）を生成器が接続して解決する。
# 許可ラベルは空。以降、出力に `要確認` が1つでもあれば検証エラー＝要確認ゼロを機械保証する。
ALLOWED_UNRESOLVED_LABELS: tuple[str, ...] = ()
VAGUE_EXECUTION = ("実行できる注文、商品、会員、在庫、買取、イベント等の対象データ", "対象業務が次の担当者へ引き渡せる状態")
GENERIC_FINAL_STATES = ("対象データが完了状態として追跡できる", "原典終端まで到達する")

# 業務フロー冒頭の正本方針と同じ規則。旧版・非採用To-Beをトレース元に戻す退行を検出する。
CANONICAL_PATTERN_SOURCES: dict[str, dict[str, str]] = {
    "店頭買取": {"*": "06_店頭買取.md"},
    "在庫管理": {"*": "12_在庫管理.md"},
    "商品登録・編集": {
        "1": "09_商品登録・編集.md", "2": "09_商品登録・編集.md",
        "3": "09_商品登録・編集.md", "4": "10_商品登録・編集_tobe.md",
        "5": "09_商品登録・編集.md", "6": "10_商品登録・編集_tobe.md",
        "7": "10_商品登録・編集_tobe.md", "8": "09_商品登録・編集.md",
        "9": "10_商品登録・編集_tobe.md",
    },
    "通販受注管理": {
        "4": "17_通販受注管理_tobe.md",
        "13": "17_通販受注管理_tobe.md",
        "*": "16_通販受注管理.md",
    },
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def cell(value: str) -> str:
    value = value.replace("<br>", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("`", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def split_md_row(line: str) -> list[str]:
    return [cell(part) for part in line.strip().strip("|").split("|")]


def table_after(text: str, heading: str) -> list[dict[str, str]]:
    m = re.search(rf"^{re.escape(heading)}\n(?P<body>(?:\|.*\|\n)+)", text, re.M)
    if not m:
        return []
    lines = [line for line in m.group("body").splitlines() if line.startswith("|")]
    if len(lines) < 2:
        return []
    header = split_md_row(lines[0])
    rows: list[dict[str, str]] = []
    for line in lines[2:]:
        parts = split_md_row(line)
        if len(parts) != len(header):
            continue
        rows.append(dict(zip(header, parts)))
    return rows


def validate_data_patterns(text: str) -> list[str]:
    errors: list[str] = []
    rows = table_after(text, "## データパターン")
    if not rows:
        return ["missing data pattern rows"]
    required = ("パターンID", "種別", "対象ステップ/分岐ID", "目的", "前提差分", "入力データ", "期待観測点")
    header_match = re.search(r"^## データパターン\n(\|.+\|)", text, re.M)
    header = header_match.group(1) if header_match else ""
    for column in required:
        if column not in header:
            errors.append(f"data pattern table missing column: {column}")
    ids = [row.get("パターンID", "") for row in rows]
    if len(set(ids)) != len(ids):
        errors.append("duplicate data pattern id")
    # 境界値データパターン(DP-B*)は必須にしない。境界値は業務フロー・HTML設計書に無い値であり、
    # 結合テスト層で網羅する（依頼者確定）。本層のDPは原典由来(DP-N代表 + フロー分岐由来 DP-E/DP-A)
    # に限るため、分岐が無いパターンはDP-N001の1件だけが正しい姿。
    if not any(pid.startswith("DP-N") for pid in ids):
        errors.append("missing normal representative data pattern DP-N*")
    for row in rows:
        pid = row.get("パターンID", "")
        if not re.match(r"^DP-[NAEB]\d{3}$", pid):
            errors.append(f"invalid data pattern id: {pid}")
        for column in required[1:]:
            if not row.get(column, "").strip():
                errors.append(f"data pattern {pid}: empty {column}")
    # 業務分岐0件の経路はプレースホルダ行（分岐ID=`-`）を出す。実分岐IDだけを対象にする。
    branch_ids = {row.get("分岐ID", "") for row in table_after(text, "## 実行手順（代替系・異常系）")}
    pattern_targets = " ".join(row.get("対象ステップ/分岐ID", "") for row in rows)
    for branch_id in sorted(b for b in branch_ids if re.fullmatch(r"[AE]\d+", b)):
        if branch_id not in pattern_targets:
            errors.append(f"branch {branch_id} has no data pattern")
    return errors


def bullet_value(text: str, label: str) -> str:
    m = re.search(rf"- \*\*{re.escape(label)}\*\*:\s*(.+)", text)
    return cell(m.group(1)) if m else ""


def plain_list_value(text: str, label: str) -> str:
    m = re.search(rf"^\s*-\s+{re.escape(label)}:\s*(.+)$", text, re.M)
    return cell(m.group(1)) if m else ""


def feature_list(text: str, label: str) -> list[str]:
    value = bullet_value(text, label)
    return [part.strip().upper() for part in value.split(",") if re.match(r"^[A-Z]\d{2}-\d{2}$", part.strip(), re.I)]


def observable_assertion(value: str) -> bool:
    """特定の文末ではなく、判定できる結果と観測対象があるかを見る。

    留保注記は本文の合否条件とは分ける。『作業が完了すること』だけでは
    保存先/状態/照合先が分からないため受理しない。
    """
    core = value.split("実施保留条件:", 1)[0]
    if "確認できること" in core:
        return True
    target = re.search(r"受注|注文|申込|商品|在庫|数量|金額|ポイント|会員|参加者|大会|デッキ|タグ|カード|CSV|帳票|メール|送り状|氏名|日付|日時|情報|内容|ファイル|記録|結果|条件|状態|担当|工数|店舗|引渡し|処理|番号|ID", core)
    outcome = re.search(r"一致|照合|記録|保存|登録|更新|反映|表示|除外|含まれない|加算|減算|増加|減少|紐づ|紐付|受信|受け付け|取得|出力|引き継|渡せる|共有|指定できる|開始できる|進める|フラグが立つ|済みとなる|済みになる|中となる|が付けられ|が採番|入庫待ち|未登録在庫あり|入庫完了|増える|減る|確定できる", core)
    return bool(target and outcome)


def validate_route_metadata(text: str) -> list[str]:
    errors: list[str] = []
    required = ("経路ID", "経路種別", "親業務フローパターン", "業務経路条件", "最終業務状態")
    for label in required:
        value = bullet_value(text, label)
        if not value or value == "-":
            errors.append(f"missing route metadata: {label}")
    route_id = bullet_value(text, "経路ID")
    if route_id and not re.match(r"^R\d{2}$", route_id):
        errors.append(f"invalid route id: {route_id}")
    route_kind = bullet_value(text, "経路種別")
    if route_kind and route_kind not in {"正常代表", "主要代替", "業務異常"}:
        errors.append(f"invalid route kind: {route_kind}")
    flow_no = plain_list_value(text, "業務フロー番号")
    if not flow_no:
        errors.append("missing business flow number")
    elif not re.search(r"/\s*経路\d+", flow_no):
        errors.append("business flow number does not include route number")
    linked = feature_list(text, "シナリオに紐づく機能No")
    used = {f for row in table_after(text,"## メインフロー（正常系）")
            for f in re.findall(r"[A-Z]\d{2}-\d{2}",row.get("利用画面・機能",""))}
    if used - set(linked):
        errors.append(f"main-flow functions missing in linked function numbers: {', '.join(sorted(used-set(linked)))}")
    if set(linked) - used:
        errors.append(f"linked functions not used in main flow: {', '.join(sorted(set(linked)-used))}")
    final_state = bullet_value(text, "最終業務状態")
    for phrase in GENERIC_FINAL_STATES:
        if phrase in final_state:
            errors.append(f"generic final state is not a test oracle: {phrase}")
    if final_state and not observable_assertion(final_state):
        errors.append("final business state does not identify an observable pass/fail result")
    if route_kind in {"主要代替", "業務異常"}:
        condition = bullet_value(text, "業務経路条件")
        if "実線" not in condition and "原典本文" not in condition:
            errors.append("alternative/error route has no solid edge or quoted source paragraph")
    return errors


def validate_canonical_source(text: str) -> list[str]:
    parent = bullet_value(text, "親業務フローパターン")
    source = re.search(r"^\s*- 出典: `scenario_test/markdown/([^`]+\.md)`", text, re.M)
    match = re.match(r"(.+?)\s*/\s*パターン(\d+)\s*/", parent)
    if not match or not source:
        return []
    business, number = match.group(1).strip(), match.group(2)
    rules = CANONICAL_PATTERN_SOURCES.get(business)
    if not rules:
        return []
    expected = rules.get(number, rules.get("*"))
    if expected and source.group(1) != expected:
        return [f"non-canonical business-flow source: {source.group(1)} (expected {expected})"]
    return []


def validate_operation_direction(text: str) -> list[str]:
    errors: list[str] = []
    for row in table_after(text, "## メインフロー（正常系）"):
        action = row.get("業務行動", "").lower()
        screen = row.get("利用画面・機能", "").lower()
        action_input = any(word in action for word in ("インポート", "取込", "取り込", "アップロード", "csv登録"))
        action_output = any(word in action for word in ("エクスポート", "出力", "ダウンロード"))
        screen_input = any(word in screen for word in ("インポート", "取込", "import", "csv登録"))
        screen_output = any(word in screen for word in ("エクスポート", "出力", "ダウンロード", "export"))
        if action_input and screen_output and not screen_input and not (action_output and any(word in action for word in ("lineworks", "ラインワークス", "共有フォルダー", "共有フォルダ"))):
            errors.append(f"input operation is mapped to an output function: {row.get('#', '?')}")
        if action_output and screen_input and not screen_output:
            errors.append(f"output operation is mapped to an input function: {row.get('#', '?')}")
    return errors


def validate_file(repo: Path, path: Path, strict: bool) -> list[str]:
    text = read(path)
    errors: list[str] = []
    if not re.search(r"^#\s+SCN-[^\s]+\s+", text, re.M):
        errors.append("missing SCN heading")
    for section in REQUIRED_SECTIONS:
        if section == "## メインフロー（正常系）":
            ok = re.search(r"^## メインフロー（正常系", text, re.M)
        else:
            ok = section in text
        if not ok:
            errors.append(f"missing section: {section}")
    for phrase in FORBIDDEN:
        if phrase in text:
            errors.append(f"forbidden phrase: {phrase}")
    # 許可ラベル以外の `要確認` は、曖昧さを残したまま出荷している証拠なのでエラーにする。
    stripped = text
    for label in ALLOWED_UNRESOLVED_LABELS:
        stripped = stripped.replace(label, "")
    if "要確認" in stripped:
        errors.append("forbidden phrase: 要確認（許可された未確定ラベル以外）")
    for phrase in UNRESOLVED:
        if phrase in text:
            errors.append(f"unresolved traceability: {phrase}")
    for phrase in VAGUE_EXECUTION:
        if phrase in text:
            errors.append(f"vague execution phrase: {phrase}")
    for src in re.findall(r"`(scenario_test/markdown/[^`]+\.md)`", text):
        if not (repo / src).exists():
            errors.append(f"missing trace source: {src}")
    for src in re.findall(r"`(functions/[^`]+\.md)`", text):
        if not (repo / src).exists():
            errors.append(f"missing function spec: {src}")
    for src in re.findall(r"`(excel_to_html/output/[^`]+\.html)`", text):
        if not (repo / src).exists():
            errors.append(f"missing html design doc: {src}")
    if strict and "> [要確認]" in text:
        errors.append("strict mode disallows unresolved > [要確認]")
    main_header = re.search(r"^## メインフロー（正常系.*?\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not main_header:
        errors.append("missing main-flow table")
    else:
        header = main_header.group(1)
        for column in ("担当者", "業務行動", "利用画面・機能", "確認する業務結果"):
            if column not in header:
                errors.append(f"main-flow table missing business column: {column}")
        if "画面（機能No）" in header or "操作" in header:
            errors.append("main-flow table still uses screen-first columns")
    if re.search(r"^\| \d+ \| [^|]+ \| - R\d+:", text, re.M):
        errors.append("main-flow action still starts with raw row ID")
    seed_header = re.search(r"^## 実行用テストデータ\n\| 項目 \| 値 \|\n\|[-|]+\|", text, re.M)
    if not seed_header:
        errors.append("missing executable seed data table")
    if not re.search(r"ST-(ORDER|PICKUP|STOCK|BUY|OBUY|PURCHASE|PRODUCT|PRICE|EVENT|DECK|CARD|DATA)-", text):
        errors.append("missing fixed ST-* seed identifier")
    errors.extend(validate_route_metadata(text))
    errors.extend(validate_canonical_source(text))
    errors.extend(validate_operation_direction(text))
    errors.extend(validate_data_patterns(text))
    evidence = bullet_value(text, "分岐根拠")
    if evidence.startswith("原典本文"):
        match = re.match(r"原典本文 (.+?\.md) .+?「(.+)」$", evidence)
        if not match:
            errors.append("source paragraph evidence has no file/quote")
        else:
            source_path = repo / "scenario_test/markdown" / match.group(1)
            source_text = read(source_path) if source_path.exists() else ""
            if match.group(2) not in source_text:
                errors.append("source paragraph evidence quote no longer exists")
    exec_header = re.search(r"^## 実行手順（正常系）\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not exec_header:
        errors.append("missing executable normal procedure table")
    else:
        header = exec_header.group(1)
        for column in ("担当者", "操作", "入力/対象", "期待結果", "確認対象"):
            if column not in header:
                errors.append(f"execution procedure table missing column: {column}")
    exec_rows = re.findall(r"^\| \d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not exec_rows:
        errors.append("missing executable procedure rows")
    for row in table_after(text, "## 実行手順（正常系）"):
        if not observable_assertion(row.get("期待結果", "")):
            errors.append(f"normal step {row.get('#', '?')} has no observable pass/fail assertion")
        if not row.get("確認対象", "") or row.get("確認対象") == "-":
            errors.append(f"normal step {row.get('#', '?')} has no observation target")
    alt_header = re.search(r"^## 代替フロー / 異常系分岐\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not alt_header:
        errors.append("missing alternative/error branch table")
    elif "確認対象" not in alt_header.group(1):
        errors.append("alternative/error branch table missing 確認対象 column")
    # 物理作業・外部システム作業に EC-CUBE の機能Noを付けてはならない。付けると、その画面では
    # 観測できない期待結果（「納品書にサインを頂くこと。」を A05-03 で確認する等）が生まれ、
    # テストが実行不能になる。機能No列は `-` でなければならない。
    for line in text.splitlines():
        if not line.startswith("| "):
            continue
        if "該当なし（物理作業" in line or "該当なし（外部システム" in line or line.count("要確認（") and "|" in line:
            cells = [c.strip() for c in line.strip("|").split("|")]
            for cell in cells:
                if any(tag in cell for tag in ("該当なし（物理作業", "該当なし（外部システム", "要確認（")):
                    feature = re.search(r"（([A-Z]\d{2}-\d{2})）\s*$", cell)
                    if feature:
                        errors.append(
                            f"physical/external/unresolved step must not carry an EC-CUBE feature number: {feature.group(1)}"
                        )
    # 業務フローに分岐が無い経路は「分岐0件」が正しい姿。ただし黙って0にすると「試験していない」
    # ことが隠れるため、機構的異常系を結合テストのケースIDへ委譲した表を必須にする。
    delegated = "## 他層委譲（結合テスト）" in text
    branch_rows = re.findall(r"^\| [AE]\d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not branch_rows and not delegated:
        errors.append("missing edge-case branch rows (業務分岐0件なら ## 他層委譲（結合テスト） が必須)")
    alt_exec_header = re.search(r"^## 実行手順（代替系・異常系）\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not alt_exec_header:
        errors.append("missing alternative/error execution procedure table")
    else:
        header = alt_exec_header.group(1)
        for column in ("分岐ID", "担当者", "操作", "入力/対象", "期待結果", "確認対象"):
            if column not in header:
                errors.append(f"alternative/error execution table missing column: {column}")
    alt_exec_rows = re.findall(r"^\| \d+ \| [AE]\d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not alt_exec_rows and not delegated:
        errors.append("missing alternative/error executable procedure rows")
    if len(alt_exec_rows) < len(branch_rows):
        errors.append("alternative/error execution rows fewer than branch rows")
    if "**期待する主要機能No**" not in text:
        errors.append("missing expected function numbers")
    if "**シナリオに紐づく機能No**" not in text:
        errors.append("missing linked function numbers")
    summary = re.search(r"^## エッジケース要約\n\| 件数 \| 主なエッジケース \| 確認対象 \|\n\|[-|]+\|\n\| (\d+) \|", text, re.M)
    if not summary:
        errors.append("missing edge-case summary row")
    elif int(summary.group(1)) < 1 and not delegated:
        errors.append("edge-case summary count is 0 but ## 他層委譲（結合テスト） is missing")
    if delegated:
        delegation_rows = table_after(text,"## 他層委譲（結合テスト）")
        if not delegation_rows:
            section=re.search(r"^## 他層委譲（結合テスト）\n(.*?)(?=^## |\Z)",text,re.M|re.S)
            body=section.group(1) if section else ""
            delegation_rows=re.findall(r"^\| [^|]+ \| IT[AB]-[^|]+ \| [^|]+ \| [^|]+ \|$",body,re.M)
        if not delegation_rows:
            errors.append("他層委譲 table has no delegation rows")
    return errors


def validate_coverage_table(repo: Path, scenario_files: list[Path]) -> list[str]:
    coverage_path = repo / "scenario_test" / "scenario" / "03_カバレッジ表.md"
    if not coverage_path.exists():
        return ["missing coverage table: scenario_test/scenario/03_カバレッジ表.md"]
    text = read(coverage_path)
    errors: list[str] = []
    linked_by_id={re.search(r"^# (SCN-\S+)",read(path),re.M).group(1):feature_list(read(path),"シナリオに紐づく機能No")
                  for path in scenario_files if re.search(r"^# (SCN-\S+)",read(path),re.M)}
    required_columns = ("経路ID", "経路種別", "業務経路条件", "最終業務状態", "正常系", "代替系", "異常系", "外部連携", "データ更新", "経路手順数", "代替/異常手順数", "期待機能不足", "HTML不足", "実行エッジ数", "主なエッジケース", "確認対象", "他層委譲", "委譲未整備", "非EC-CUBE作業", "番号重複警告")
    for column in required_columns:
        if column not in text:
            errors.append(f"coverage table missing column: {column}")
    for path in scenario_files:
        scenario_id = re.search(r"(SCN-[^_]+)", path.name)
        if scenario_id and scenario_id.group(1) not in text:
            errors.append(f"coverage table missing scenario: {scenario_id.group(1)}")
    for line in text.splitlines():
        if "| SCN-" not in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 25:
            errors.append(f"coverage table row has too few columns: {cells[2] if len(cells) > 2 else line}")
            continue
        try:
            normal_count = int(cells[14])
            edge_count = int(cells[18])
            delegated_ok = int(cells[21])
            delegated_gap = int(cells[22])
        except ValueError:
            errors.append(f"coverage table invalid procedure/edge count: {cells[2]}")
            continue
        abnormal_mark = cells[9]
        if normal_count < 1:
            errors.append(f"coverage table route procedure count must be >= 1: {cells[2]}")
        # 業務分岐0件は許容する（業務フローに分岐が無い経路は実在する）。ただし
        # (1) 異常系を○と偽らないこと、(2) 機構的異常系の委譲先が示されていること、を強制する。
        if edge_count == 0:
            if abnormal_mark != "-":
                errors.append(f"coverage table marks 異常系=○ with 0 execution edges: {cells[2]}")
            if delegated_ok + delegated_gap < 1 and linked_by_id.get(cells[2]):
                errors.append(f"coverage table has 0 edges and no delegation rows: {cells[2]}")
    return errors


def validate_feature_ledger(repo: Path) -> list[str]:
    ledger = repo / "scenario_test" / "scenario" / "05_設計書カバレッジ.md"
    if not ledger.exists():
        return ["missing feature ledger: scenario_test/scenario/05_設計書カバレッジ.md"]
    text = read(ledger)
    errors: list[str] = []
    for section in ("## サマリ", "## 要判定リスト", "## プレフィックス別ロールアップ", "## out-of-scope 明細"):
        if section not in text:
            errors.append(f"feature ledger missing section: {section}")
    for label in ("covered", "source-backed-uncovered", "excluded-ph2"):
        if label not in text:
            errors.append(f"feature ledger missing classification: {label}")
    return errors


def validate_source_coverage(repo: Path, scenario_files: list[Path]) -> list[str]:
    coverage = repo / "scenario_test" / "scenario" / "04_業務フロー正本カバレッジ.md"
    if not coverage.exists():
        return ["missing canonical source coverage: scenario_test/scenario/04_業務フロー正本カバレッジ.md"]
    text = read(coverage)
    errors: list[str] = []
    for column in ("業務", "出典", "原典パターン番号", "パターン名", "状態", "生成SCN数"):
        if column not in text:
            errors.append(f"canonical source coverage missing column: {column}")
    generated_total = 0
    for line in text.splitlines():
        if not line.startswith("| ") or "`scenario_test/" not in line:
            continue
        cells = split_md_row(line)
        if len(cells) != 6:
            errors.append(f"canonical source coverage row has invalid columns: {line[:80]}")
            continue
        try:
            count = int(cells[5])
        except ValueError:
            errors.append(f"canonical source coverage has invalid SCN count: {cells[1]}")
            continue
        if cells[4].startswith("生成済み"):
            generated_total += count
        if "本文欠落" in cells[4] and count != 0:
            errors.append(f"missing-body pattern must have 0 generated scenarios: {cells[1]} #{cells[2]}")
    if generated_total != len(scenario_files):
        errors.append(f"canonical source coverage count mismatch: ledger={generated_total} files={len(scenario_files)}")
    return errors


def validate_route_groups(repo: Path, scenario_files: list[Path]) -> list[str]:
    groups: dict[str, set[str]] = {}
    for path in scenario_files:
        text = read(path)
        parent = bullet_value(text, "親業務フローパターン")
        route_id = bullet_value(text, "経路ID")
        if parent and route_id:
            groups.setdefault(parent, set()).add(route_id)
    errors: list[str] = []
    if not any(len(route_ids) > 1 for route_ids in groups.values()):
        errors.append("no parent business-flow pattern expands to multiple route scenarios")
    # 以前はパターン別に最低ルート数（デッキ登録>=5, 商品登録>=2）を課していたが、これは
    # 固定辞書由来のルート水増しを前提とした下限であり、捏造ゼロ（ルートは業務フロー由来の
    # 分岐のみ）と矛盾する。フローに分岐が無いパターンは正常系1本が正しいので撤去した。
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--generated-only", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    files = sorted((repo / "scenario_test" / "scenario").glob("SCN-*.md"))
    if args.generated_only:
        files = [p for p in files if "<!-- generated-by: hareruya-scenario-test-cases -->" in read(p)]
    if not files:
        print("no scenario files found")
        return 1
    failed = 0
    for path in files:
        errors = validate_file(repo, path, args.strict)
        if errors:
            failed += 1
            print(f"NG {path.relative_to(repo)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK {path.relative_to(repo)}")
    for error in validate_coverage_table(repo, files):
        failed += 1
        print(f"NG scenario_test/scenario/03_カバレッジ表.md")
        print(f"  - {error}")
    for error in validate_feature_ledger(repo):
        failed += 1
        print(f"NG scenario_test/scenario/05_設計書カバレッジ.md")
        print(f"  - {error}")
    for error in validate_source_coverage(repo, files):
        failed += 1
        print("NG scenario_test/scenario/04_業務フロー正本カバレッジ.md")
        print(f"  - {error}")
    for error in validate_route_groups(repo, files):
        failed += 1
        print("NG scenario route grouping")
        print(f"  - {error}")
    print(f"checked={len(files)} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
