"""現行の結合テスト正本から、操作条件まで一致するケースだけを参照する。

観点IDや期待結果のキーワードだけでは委譲完了としない。ケースの存在と
実行準備・実施結果も区別する。機能ごとの未対応を別機能のケースで隠さない。
"""
from __future__ import annotations

import csv
import re
from functools import lru_cache
from pathlib import Path

SOURCE = "integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv"
MECHANISMS = (
    ("担当者に必要な権限がない", "ITA-19", "permission"),
    ("入力値の必須項目不足または形式不正がある", "ITA-10", "invalid"),
    ("同一対象に対して同じ処理を重複実行する", "ITA-15 / ITA-17 / ITB-16", "duplicate"),
    ("検索条件に一致する対象データが存在しない", "ITA-08 / ITB-10", "zero"),
)


def matches(row: dict[str, str], mechanism: str) -> bool:
    # 第1行の画面名に「再送」「権限」等があっても条件を準備した証拠にはならない。
    actions = "\n".join(row["手順"].splitlines()[1:])
    expected = row["期待結果"]
    viewpoints = set(row["観点ID"].split(","))
    if mechanism == "permission":
        return bool(re.search(r"権限(?:が|の)?ない|権限不足|権限を持たない|権限の無い|非管理者|未認証", actions)) and bool(re.search(r"拒否|できない|されない|403|401", expected))
    if mechanism == "invalid":
        return "ITA-10" in viewpoints and bool(re.search(r"空に|未入力|不正|必須.*(?:除|抜|欠)", actions)) and bool(re.search(r"エラー|されず|拒否|されない", expected))
    if mechanism == "duplicate":
        return bool(viewpoints & {"ITA-15", "ITA-17", "ITB-16"}) and bool(re.search(r"再送する|複数回|二重クリック|重複実行|2回|二回|同じ.*(?:再実行|送信)", actions)) and bool(re.search(r"二重|重複|一度|1回", expected))
    if mechanism == "zero":
        return bool(viewpoints & {"ITA-08", "ITB-10"}) and "0件" in actions and "0件" in expected
    raise ValueError(mechanism)


@lru_cache(maxsize=None)
def case_index(repo: Path) -> dict[str, list[dict[str, str]]]:
    path = repo / SOURCE
    if not path.is_file():
        raise ValueError(f"結合テスト正本が存在しません: {path}")
    index: dict[str, list[dict[str, str]]] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle, delimiter="\t"):
            match = re.match(r"IT-([A-Z]\d{2}-\d{2})-", row["テストID"])
            if match:
                index.setdefault(match[1], []).append(row)
    return index


def delegation_rows(repo: Path, features: list[str]) -> list[tuple[str, str, str, str]]:
    index = case_index(repo)
    features = sorted(set(f.upper() for f in features if f != "-"))
    rows = []
    for label, viewpoint, key in MECHANISMS:
        if not features:
            rows.append((label, viewpoint, "-", "対象機能なし（現場・外部作業の適用要否は別途確認）"))
        for feature in features:
            cases = [r for r in index.get(feature, []) if matches(r, key)]
            if not cases:
                rows.append((f"{label}（{feature}）", viewpoint, "-", "対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない）"))
                continue
            ids = "<br>".join(f"`{r['テストID']}`" for r in cases)
            incomplete = any("TBD" in r["事前準備"] or "設計書に記載なし" in r["事前準備"] for r in cases)
            state = "参照ケースあり・実行準備未確定" if incomplete else "参照ケースあり・実行結果未確認"
            rows.append((f"{label}（{feature}）", " / ".join(sorted({v for r in cases for v in r["観点ID"].split(",") if v})), ids, state))
    return rows
