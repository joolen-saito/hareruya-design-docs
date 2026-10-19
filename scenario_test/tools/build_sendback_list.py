#!/usr/bin/env python3
"""Export every researched lineage gap; the TSV is the durable answer master."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path

SOURCE = "scenario_test/coverage/lineage_resolution_review.tsv"
DESTINATION = "scenario_test/scenario/12_優先差し戻しリスト"
IDENTITY = ("業務", "産出工程", "データ/帳票", "消費工程")
ANSWERS = ("業務回答", "確定照合キー・比較規則", "根拠資料・備考")
COLUMNS = ("差戻ID", "一覧区分", "優先度", "観点", *IDENTITY, "残件種別", "対象件数",
           "対象SCN/連鎖ID", "未確定理由", "調査出典", "必要な判断", *ANSWERS)
SOURCE_COLUMNS = ("業務", "成果物", "産出工程", "消費工程", "残件種別", "対象件数",
                  "対象SCN/連鎖ID", "未確定理由", "調査出典", "必要な判断")
CATEGORIES = {
    "金銭": ("返金", "決済", "入金", "出金", "振込", "銀行", "売上", "請求", "ポイント", "買取", "価格"),
    "在庫": ("在庫", "入庫", "出庫", "棚卸", "欠品", "移動", "補充", "仕入", "引当"),
    "受注状態": ("受注", "注文", "出荷", "配送", "発送", "ピッキング", "ピック"),
}


def read_tsv(path: Path, required=()) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file, delimiter="\t")
        if not set(required).issubset(reader.fieldnames or []):
            raise ValueError(f"{path}: required columns are missing")
        rows = list(reader)
    if any(None in row or any(value is None for value in row.values()) for row in rows):
        raise ValueError(f"{path}: malformed TSV; existing answers were not overwritten")
    return rows


def identity(row: dict[str, str]) -> tuple[str, ...]:
    return tuple(re.sub(r"\s+", " ", row.get(key, "")).strip() for key in IDENTITY)


def stable_id(row: dict[str, str]) -> str:
    encoded = json.dumps(identity(row), ensure_ascii=False, separators=(",", ":")).encode()
    return "SB-" + hashlib.sha256(encoded).hexdigest()[:12].upper()


def classify(row: dict[str, str]) -> tuple[str, str]:
    text = " ".join(row.get(key, "") for key in IDENTITY)
    for category, words in CATEGORIES.items():
        if any(word in text for word in words):
            return "P1", category
    return "P2", "業務データ"


def target_refs(value: str) -> list[str]:
    return [part.strip() for part in value.split(" / ") if part.strip()]


def old_answers(row: dict[str, str]) -> dict[str, str]:
    result = {key: row.get(key, "") for key in ANSWERS}
    # Preserve legacy responses verbatim without interpreting B as test exclusion.
    for old, new in (("業務判定(A/B/C)", ANSWERS[0]), ("確定照合キー", ANSWERS[1]), ("消費先/備考", ANSWERS[2])):
        if row.get(old, "").strip():
            value = f"旧形式の回答: {row[old]}" if old == "業務判定(A/B/C)" else row[old]
            result[new] = result[new] + "\n" + value if result[new] else value
    return result


def build_rows(source: list[dict[str, str]], previous: list[dict[str, str]]) -> list[dict[str, str]]:
    existing = {}
    for row in previous:
        sid = row.get("差戻ID") or stable_id(row)
        if sid in existing:
            raise ValueError(f"duplicate previous review ID: {sid}; answers were not overwritten")
        existing[sid] = row
    current, seen, all_refs = [], set(), set()
    for source_row in source:
        row = {key: source_row.get(key, "") for key in COLUMNS}
        row["データ/帳票"] = source_row["成果物"]
        row["差戻ID"] = stable_id(row)
        if row["差戻ID"] in seen:
            raise ValueError(f"duplicate researched gap: {row['差戻ID']}")
        seen.add(row["差戻ID"])
        refs = target_refs(row["対象SCN/連鎖ID"])
        if not refs or len(refs) != int(row["対象件数"]) or len(refs) != len(set(refs)):
            raise ValueError(f"{row['差戻ID']}: occurrence count differs from SCN/DL references")
        if any(not re.fullmatch(r"SCN-.+/DL-[\w-]+", ref) or ref in all_refs for ref in refs):
            raise ValueError(f"{row['差戻ID']}: malformed or duplicate SCN/DL reference")
        all_refs.update(refs)
        for required in ("未確定理由", "調査出典", "必要な判断"):
            if not row[required].strip():
                raise ValueError(f"{row['差戻ID']}: missing {required}")
        row["一覧区分"] = "現行残件"
        row["優先度"], row["観点"] = classify(row)
        row.update(old_answers(existing.pop(row["差戻ID"], {})))
        current.append(row)
    # Removed or re-keyed gaps retain answers as history, never on a guessed match.
    history = []
    for sid, old in existing.items():
        answers = old_answers(old)
        if not any(value.strip() for value in answers.values()):
            continue
        row = {key: old.get(key, "") for key in COLUMNS}
        row.update(answers)
        row["差戻ID"], row["一覧区分"] = sid, "回答履歴（現行残件対象外）"
        history.append(row)
    current.sort(key=lambda row: (row["優先度"], row["観点"], row["業務"], row["データ/帳票"], row["差戻ID"]))
    return current + sorted(history, key=lambda row: row["差戻ID"])


def md_cell(value: str) -> str:
    return value.replace("&", "&amp;").replace("|", "&#124;").replace("\r\n", "\n").replace("\n", "<br>")


def source_links(repo: Path, output: Path, text: str) -> str:
    pattern = r"(?:scenario_test|excel_to_html)/[^\s]+?\.(?:md|tsv|json|html)(?:#sheet-\d+)?"
    def replace(match):
        reference = match.group()
        path, _, anchor = reference.partition("#")
        if not (repo / path).is_file():
            return reference
        relative = os.path.relpath(repo / path, output.parent) + ("#" + anchor if anchor else "")
        return f"[{path.rsplit('/', 1)[-1]}](<{relative}>)"
    return re.sub(pattern, replace, text)


def render(repo: Path, rows: list[dict[str, str]], output: Path) -> str:
    current = [row for row in rows if row["一覧区分"] == "現行残件"]
    history = [row for row in rows if row["一覧区分"] != "現行残件"]
    priorities = Counter(row["優先度"] for row in current)
    occurrences = sum(int(row["対象件数"]) for row in current)
    lines = ["# 優先差し戻しリスト（調査済み残件の確認依頼）", "",
             f"現行の未解決事項は **{len(current)}種類・{occurrences}出現** です。P1は{priorities['P1']}件、P2は{priorities['P2']}件です。全件を掲載しています。", "",
             "- 生成元: [データ連鎖の残件調査台帳](../coverage/lineage_resolution_review.tsv)。調査理由・出典・必要な判断を引き継いでいます。",
             "- P1は金銭・在庫・受注状態に関係する項目、P2はその他の業務データです。いずれも未解決事項で、優先度は確認順の目安です。",
             "- 終端の成果物も内容の照合が必要です。産出元が不明な入力は、取得元と原本を確定して受領内容を確認します。",
             "- 回答を受けた後、根拠を照合してシナリオと判定条件へ反映します。回答だけで合格・網羅済みにはしません。", "",
             "## 回答方法", "",
             "[回答用TSV](12_優先差し戻しリスト.tsv)の末尾3列「業務回答」「確定照合キー・比較規則」「根拠資料・備考」に記入してください。各項目の「必要な判断」に沿い、実ファイル、項目名、取得元、比較方法を示してください。", "",
             "TSVを回答の正本とし、このMarkdownは閲覧用です。差戻IDと自動生成列は変更せず、Markdownの回答欄は直接編集しないでください。再生成時は同じ差戻IDの回答を保持し、現行残件から外れた回答も履歴として残します。", "",
             "## 現行残件一覧", "",
             "| 差戻ID | 優先度 | 観点 | 業務 | データ/帳票 | 残件種別 | 出現数 |",
             "|---|---|---|---|---|---|---:|"]
    for row in current:
        lines.append("| " + " | ".join([f"[{row['差戻ID']}](#{row['差戻ID'].lower()})", row["優先度"], row["観点"], row["業務"],
                                            md_cell(row["データ/帳票"]), row["残件種別"], row["対象件数"]]) + " |")
    lines += ["", "## 項目別の調査内容", ""]
    for row in current + history:
        lines += [f"<a id=\"{row['差戻ID'].lower()}\"></a>", f"### {row['差戻ID']} — {row['業務']} / {row['データ/帳票']}", "",
                  f"- 一覧区分: {row['一覧区分']} / 優先度: {row['優先度']} / 観点: {row['観点']}",
                  f"- 原典の接続: {row['産出工程']} → {row['データ/帳票']} → {row['消費工程']}",
                  f"- 残件種別: {row['残件種別']}", f"- 未確定理由: {row['未確定理由']}",
                  f"- 必要な判断: {row['必要な判断']}", "", "**調査出典**", "", source_links(repo, output, row["調査出典"]), "", "**対象シナリオと連鎖**", ""]
        for ref in target_refs(row["対象SCN/連鎖ID"]):
            sid = ref.rsplit("/", 1)[0]
            paths = sorted((repo / "scenario_test/scenario").glob(f"{sid}_*.md"))
            if row["一覧区分"] == "現行残件" and len(paths) != 1:
                raise ValueError(f"{ref}: current scenario cannot be resolved uniquely")
            link = f"[{ref}](<{os.path.relpath(paths[0], output.parent)}>)" if len(paths) == 1 else ref
            lines.append("- " + link)
        lines += ["", "**記入済み回答（TSVから反映）**", ""]
        lines.extend(f"- {key}: {md_cell(row[key]) if row[key].strip() else '未記入'}" for key in ANSWERS)
        lines.append("")
    if history:
        lines += [f"回答履歴は{len(history)}件です。現行残件の件数には含めていません。", ""]
    lines += ["---", "", "再生成: `python3 scenario_test/tools/build_sendback_list.py --repo .`", ""]
    return "\n".join(lines)


def generate(repo: Path) -> tuple[int, int, int]:
    source_path = repo / SOURCE
    if not source_path.is_file():
        raise FileNotFoundError(source_path)
    tsv, md = (repo / (DESTINATION + suffix) for suffix in (".tsv", ".md"))
    rows = build_rows(read_tsv(source_path, SOURCE_COLUMNS), read_tsv(tsv))
    markdown = render(repo, rows, md)  # Validate all references before writing.
    with tsv.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=COLUMNS, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)
    md.write_text(markdown, encoding="utf-8")
    current = [row for row in rows if row["一覧区分"] == "現行残件"]
    return len(current), sum(int(row["対象件数"]) for row in current), len(rows) - len(current)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    args = parser.parse_args()
    count, occurrences, history = generate(Path(args.repo).resolve())
    print(f"sendback: {count} current gaps / {occurrences} occurrences / {history} retained answer history")


if __name__ == "__main__":
    main()
