#!/usr/bin/env python3
"""Backlog カテゴリ「不具合（バグ）」／状態「処理中」の課題を設計書単位に分類する。

分類根拠は各課題の本文「基本情報」ブロックにある `設計書：` 行（起票者が明示した設計書）。
本文中には関連設計書が別途言及されることがあるため、コード全走査ではなく
**最初の `設計書：` 行**だけを採用する（例: ECCUBE_HARERUYA-1760 は本文に0202も出るが正は0404）。

出力:
  backlog_wip/backlog_bug_wip_by_doc.tsv   1課題1行
  backlog_wip/BACKLOG_BUG_WIP_BY_DOC.md    設計書別サマリ
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_backlog import BacklogClient  # noqa: E402

PROJECT_ID = 160026
CATEGORY_BUG = 511360
STATUS_INPROGRESS = 2
OUT_DIR = Path(__file__).resolve().parent / "backlog_wip"

# 分類先の設計書（利用者指定の38本）。コード -> HTMLファイル名
DOCS: dict[str, str] = {
    "0201": "0201_基本設計仕様書(システム設定).html",
    "0202": "0202_基本設計仕様書(在庫管理機能).html",
    "0203": "0203_基本設計仕様書(受注管理機能).html",
    "0204": "0204_基本設計仕様書(商品管理).html",
    "0205": "0205_基本設計仕様書(店頭買取管理).html",
    "0206": "0206_基本設計仕様書(ネット買取管理機能).html",
    "0207": "0207_基本設計仕様書(会員管理機能).html",
    "0208": "0208_基本設計仕様書(カード管理).html",
    "0209": "0209_基本設計仕様書(基本情報設定).html",
    "0210": "0210_基本設計仕様書(コンテンツ管理).html",
    "0211": "0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html",
    "0212": "0212_基本設計仕様書(デッキ管理).html",
    "0213": "0213_基本設計仕様書(データ管理).html",
    "0214": "0214_基本設計仕様書(イベント管理).html",
    "0301": "0301_基本設計仕様書(フロント_トップ).html",
    "0302": "0302_基本設計仕様書(フロント_グローバルナビ).html",
    "0303": "0303_基本設計仕様書(フロント_商品).html",
    "0304": "0304_基本設計仕様書(フロント_注文).html",
    "0305": "0305_基本設計仕様書(フロント_ネット買取).html",
    "0306": "0306_基本設計仕様書(フロント_会員).html",
    "0307": "0307_基本設計仕様書(フロント_イベント).html",
    "0308": "0308_基本設計仕様書(フロント_店頭買取).html",
    "0402": "0402_基本設計仕様書(バッチ_在庫管理).html",
    "0404": "0404_基本設計仕様書(バッチ_商品管理).html",
    "0405": "0405_基本設計仕様書(バッチ_受注管理).html",
    "0406": "0406_基本設計仕様書(バッチ_店頭買取管理) .html",
    "0408": "0408_基本設計仕様書(バッチ_会員).html",
    "0413": "0413_基本設計仕様書(バッチ_イベント).html",
    "0416": "0416_基本設計仕様書(バッチ_インフラ).html",
    "0501": "0501_基本設計仕様書(API_在庫管理).html",
    "0502": "0502_基本設計仕様書(API_商品管理).html",
    "0505": "0505_基本設計仕様書(API_受注管理).html",
    "0506": "0506_基本設計仕様書(API_店頭買取管理).html",
    "0507": "0507_基本設計仕様書(API_ネット買取管理).html",
    "0514": "0514_基本設計仕様書(API_カード管理).html",
    "0516": "0516_基本設計仕様書(API_データ管理).html",
    "0517": "0517_基本設計仕様書(API_その他).html",
    "0601": "0601_基本設計仕様書(その他_MTGBuyer).html",
}

FIELD_RE = "^[ 　]*{}[ 　]*[：:][ 　]*(.*)$"
DOC_CODE_RE = re.compile(r"(0[2-6]\d\d)_基本設計仕様書")


def field(desc: str, name: str) -> str:
    m = re.search(FIELD_RE.format(name), desc, re.M)
    return m.group(1).strip() if m else ""


def fetch(client: BacklogClient) -> list[dict]:
    collected: list[dict] = []
    offset = 0
    while True:
        params = {
            "projectId[]": [PROJECT_ID],
            "categoryId[]": [CATEGORY_BUG],
            "statusId[]": [STATUS_INPROGRESS],
            "count": 100,
            "offset": offset,
            "sort": "created",
            "order": "asc",
        }
        batch = client.get("/issues", params) or []
        collected.extend(batch)
        if len(batch) < 100:
            break
        offset += len(batch)
    return collected


def classify(issue: dict) -> dict:
    desc = issue.get("description") or ""
    declared = field(desc, "設計書")
    m = DOC_CODE_RE.match(declared)
    code = m.group(1) if m else ""
    unresolved = ""
    if not code:
        # 宣言行が無い/読めない場合のみ、本文全体から一意に決まるときだけ拾う
        codes = sorted(set(DOC_CODE_RE.findall(desc)))
        if len(codes) == 1:
            code = codes[0]
            unresolved = "設計書行なし（本文中の一意コードで補完）"
        else:
            unresolved = f"分類不能（候補: {','.join(codes) or 'なし'}）"
    doc = DOCS.get(code, "")
    if code and not doc:
        unresolved = f"指定38本の対象外（{code}）"
    return {
        "課題キー": issue["issueKey"],
        "設計書コード": code,
        "設計書": doc or declared,
        "分類": field(desc, "分類"),
        "機能": field(desc, "機能"),
        "件名": (issue.get("summary") or "").replace("\t", " ").replace("\n", " "),
        "種別": issue["issueType"]["name"],
        "優先度": (issue.get("priority") or {}).get("name", ""),
        "担当者": (issue.get("assignee") or {}).get("name", "") if issue.get("assignee") else "",
        "状態": issue["status"]["name"],
        "本文の設計書行": declared,
        "備考": unresolved,
        "URL": f"https://joolen.backlog.com/view/{issue['issueKey']}",
    }


COLUMNS = [
    "課題キー", "設計書コード", "設計書", "分類", "機能", "件名",
    "種別", "優先度", "担当者", "状態", "本文の設計書行", "備考", "URL",
]


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = BacklogClient.from_environment()
    issues = fetch(client)
    (OUT_DIR / "issues_bug_wip.json").write_text(
        json.dumps(issues, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    rows = [classify(i) for i in issues]
    rows.sort(key=lambda r: (r["設計書コード"] or "zzzz", r["機能"], r["課題キー"]))

    tsv = OUT_DIR / "backlog_bug_wip_by_doc.tsv"
    with tsv.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS, delimiter="\t", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    by_doc: Counter[str] = Counter(r["設計書コード"] for r in rows)
    func_by_doc: dict[str, Counter[str]] = defaultdict(Counter)
    for r in rows:
        func_by_doc[r["設計書コード"]][r["機能"] or "(機能記載なし)"] += 1

    md: list[str] = []
    md.append("# Backlog「不具合（バグ）」×「処理中」チケットの設計書別分類\n")
    md.append(
        f"取得元: Backlog API v2 / プロジェクト `ECCUBE_HARERUYA` (id {PROJECT_ID}) / "
        f"カテゴリ `不具合（バグ）` (id {CATEGORY_BUG}) / 状態 `処理中` (id {STATUS_INPROGRESS})。\n"
    )
    md.append(f"母集合 **{len(rows)}件**。明細は `backlog_wip/backlog_bug_wip_by_doc.tsv`、生データは同 `issues_bug_wip.json`。\n")
    md.append(
        "分類根拠は各チケット本文の `設計書：` 行（起票者が明示した設計書）。"
        "推測は入れていない。本文が複数の設計書に触れる場合も、この宣言行を正とする。\n"
    )

    md.append("\n## 設計書別 件数\n")
    md.append("| 設計書 | 件数 |")
    md.append("|---|---:|")
    for code in DOCS:
        n = by_doc.get(code, 0)
        if n:
            md.append(f"| {DOCS[code]} | {n} |")
    md.append(f"| **計** | **{sum(by_doc.values())}** |")

    zero = [DOCS[c] for c in DOCS if not by_doc.get(c)]
    md.append(f"\n該当0件の設計書（{len(zero)}本）:\n")
    for name in zero:
        md.append(f"- {name}")

    md.append("\n## 設計書別 機能内訳\n")
    for code in DOCS:
        if not by_doc.get(code):
            continue
        md.append(f"### {DOCS[code]} — {by_doc[code]}件\n")
        md.append("| 機能 | 件数 |")
        md.append("|---|---:|")
        for func, n in sorted(func_by_doc[code].items(), key=lambda kv: (-kv[1], kv[0])):
            md.append(f"| {func} | {n} |")
        md.append("")

    (OUT_DIR.parent / "BACKLOG_BUG_WIP_BY_DOC.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    unresolved = [r for r in rows if r["備考"]]
    print(f"rows={len(rows)} docs={len(by_doc)} unresolved={len(unresolved)}")
    for r in unresolved:
        print("  ", r["課題キー"], r["備考"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
