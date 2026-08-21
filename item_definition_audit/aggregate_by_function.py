#!/usr/bin/env python3
"""画面項目定義の監査所見（FINDINGS_DETAIL）を機能単位（設計書×シート）で集計する。

母集合は起票前の原本 `FINDINGS_DETAIL.tsv.bak`（226件）。
`FINDINGS_DETAIL_backlog_matched.tsv` の 元行番号 で Backlog 起票済みを判定し、
機能単位に「起票済 / 未起票」を分けて出す。

参考として、同じ設計書に紐づく Backlog「不具合（バグ）×処理中」チケット数
（design_impl_drift_report/backlog_wip/backlog_bug_wip_by_doc.tsv）を並べる。

出力:
  findings_by_function.tsv   設計書×シート×見出し の件数
  BY_FUNCTION.md             設計書別サマリ＋シート別内訳
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
BAK = HERE / "FINDINGS_DETAIL.tsv.bak"
MATCHED = HERE / "FINDINGS_DETAIL_backlog_matched.tsv"
BUG_TSV = REPO / "design_impl_drift_report" / "backlog_wip" / "backlog_bug_wip_by_doc.tsv"

DOC_NAMES = {
    "0201": "システム設定", "0202": "在庫管理機能", "0203": "受注管理機能",
    "0204": "商品管理", "0205": "店頭買取管理", "0206": "ネット買取管理機能",
    "0207": "会員管理機能", "0208": "カード管理", "0209": "基本情報設定",
    "0210": "コンテンツ管理", "0211": "分析・集計管理機能", "0212": "デッキ管理",
    "0213": "データ管理", "0214": "イベント管理",
    "0301": "フロント_トップ", "0302": "フロント_グローバルナビ", "0303": "フロント_商品",
    "0304": "フロント_注文", "0305": "フロント_ネット買取", "0306": "フロント_会員",
    "0307": "フロント_イベント", "0308": "フロント_店頭買取",
}


# 内訳セル用の短縮ラベル（見出しの先頭一致で引く）
ABBR = {
    "D_HTML孤立": "D(設計値が pf/ee 双方と不一致)",
    "D2_HTML≠ee": "D2(設計値がeeと不一致)",
    "C_HTML=pf≠ee": "C(設計=pf、eeのみ差異)",
    "ND1_": "ND1(設計上限>実装上限)",
    "ND2_": "ND2(設計上限<実装上限)",
    "設計は必須◯": "必須欠落(設計◯・実装NotBlank無)",
    "設計は任意": "過剰必須(設計-・実装NotBlank有)",
}


def short_heading(heading: str) -> str:
    """見出しから件数の丸括弧を落として短縮キーにする。"""
    return re.sub(r"（.*$", "", heading).strip()


def abbr(heading: str) -> str:
    for prefix, label in ABBR.items():
        if heading.startswith(prefix):
            return label
    return heading


def main() -> int:
    rows = list(csv.DictReader(BAK.open(encoding="utf-8"), delimiter="\t"))
    matched_lines = {
        int(r["元行番号"]) for r in csv.DictReader(MATCHED.open(encoding="utf-8"), delimiter="\t")
    }
    # 元行番号は BAK のファイル行番号（1=ヘッダ）。DictReader の i 番目は行番号 i+2。
    for i, r in enumerate(rows):
        r["_line"] = i + 2
        r["_ticketed"] = r["_line"] in matched_lines
        r["_heading"] = short_heading(r["見出し"])

    scoped = [r for r in rows if r["書番"]]
    unscoped = [r for r in rows if not r["書番"]]

    # 設計書×シート×見出し
    cell: dict[tuple[str, str, str], list[int]] = defaultdict(lambda: [0, 0])
    for r in scoped:
        c = cell[(r["書番"], r["シート"], r["_heading"])]
        c[0] += 1
        if r["_ticketed"]:
            c[1] += 1

    with (HERE / "findings_by_function.tsv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", lineterminator="\n")
        w.writerow(["書番", "設計書", "シート(機能)", "所見区分", "件数", "Backlog起票済", "未起票"])
        for (doc, sheet, head), (n, t) in sorted(cell.items()):
            w.writerow([doc, DOC_NAMES.get(doc, ""), sheet, head, n, t, n - t])

    # Backlog 不具合×処理中 の設計書別件数（前段の成果物があれば併記）
    bug_by_doc: Counter[str] = Counter()
    if BUG_TSV.is_file():
        for r in csv.DictReader(BUG_TSV.open(encoding="utf-8"), delimiter="\t"):
            bug_by_doc[r["設計書コード"]] += 1

    by_doc: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    sheets_by_doc: dict[str, set[str]] = defaultdict(set)
    for r in scoped:
        by_doc[r["書番"]][0] += 1
        if r["_ticketed"]:
            by_doc[r["書番"]][1] += 1
        sheets_by_doc[r["書番"]].add(r["シート"])

    md: list[str] = []
    md.append("# 画面項目定義の監査所見 — 機能単位の集計\n")
    md.append(
        f"母集合は起票前の原本 `FINDINGS_DETAIL.tsv.bak` の **{len(rows)}件**。"
        f"うち設計書×シートに紐づく **{len(scoped)}件** を機能単位で集計した。"
        f"残り {len(unscoped)}件 は所見自体が DB列/ラベル横断で、設計書シートに紐づかない（末尾に別掲）。\n"
    )
    md.append(
        "「起票済」は `FINDINGS_DETAIL_backlog_matched.tsv` で Backlog 課題に突合済みの件数。"
        "「未起票」がそのまま残作業。\n"
    )

    md.append("\n## 設計書別サマリ\n")
    md.append("| 設計書 | 対象シート数 | 所見 | 起票済 | 未起票 | 参考: 不具合×処理中チケット |")
    md.append("|---|---:|---:|---:|---:|---:|")
    for doc in sorted(by_doc):
        n, t = by_doc[doc]
        md.append(
            f"| {doc}_基本設計仕様書({DOC_NAMES.get(doc,'')}) | {len(sheets_by_doc[doc])} | "
            f"{n} | {t} | {n - t} | {bug_by_doc.get(doc, 0) if bug_by_doc else '-'} |"
        )
    tot_n = sum(v[0] for v in by_doc.values())
    tot_t = sum(v[1] for v in by_doc.values())
    md.append(f"| **計** | | **{tot_n}** | **{tot_t}** | **{tot_n - tot_t}** | |")

    md.append("\n## 所見区分別\n")
    hc: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for r in scoped:
        hc[r["_heading"]][0] += 1
        if r["_ticketed"]:
            hc[r["_heading"]][1] += 1
    md.append("| 所見区分 | 件数 | 起票済 | 未起票 |")
    md.append("|---|---:|---:|---:|")
    for head, (n, t) in sorted(hc.items(), key=lambda kv: -kv[1][0]):
        md.append(f"| {head} | {n} | {t} | {n - t} |")

    md.append("\n## 設計書×シート（機能）別 内訳\n")
    for doc in sorted(by_doc):
        n, t = by_doc[doc]
        md.append(f"### {doc}_基本設計仕様書({DOC_NAMES.get(doc,'')}) — {n}件（起票済 {t} / 未起票 {n-t}）\n")
        md.append("| シート(機能) | 所見 | 起票済 | 未起票 | 区分内訳 |")
        md.append("|---|---:|---:|---:|---|")
        per_sheet: dict[str, list[int]] = defaultdict(lambda: [0, 0])
        per_sheet_head: dict[str, Counter[str]] = defaultdict(Counter)
        for r in scoped:
            if r["書番"] != doc:
                continue
            per_sheet[r["シート"]][0] += 1
            if r["_ticketed"]:
                per_sheet[r["シート"]][1] += 1
            per_sheet_head[r["シート"]][r["_heading"]] += 1
        for sheet, (sn, st) in sorted(per_sheet.items(), key=lambda kv: (-kv[1][0], kv[0])):
            detail = " / ".join(
                f"{abbr(h)}×{c}"
                for h, c in sorted(per_sheet_head[sheet].items(), key=lambda kv: -kv[1])
            )
            md.append(f"| {sheet} | {sn} | {st} | {sn - st} | {detail} |")
        md.append("")

    md.append("## 機能に紐づかない所見（別掲）\n")
    uc: Counter[str] = Counter(r["_heading"] for r in unscoped)
    md.append("| 所見区分 | 件数 |")
    md.append("|---|---:|")
    for head, n in sorted(uc.items(), key=lambda kv: -kv[1]):
        md.append(f"| {head} | {n} |")
    md.append(f"| **計** | **{len(unscoped)}** |")
    md.append("\nいずれも Entity/DB列・ラベル横断の所見で、原本に書番・シートの記載が無い。")
    md.append(
        f"このうち {len(matched_lines) - tot_t}件 は Backlog 起票済みで、"
        f"起票済みの総数は {len(matched_lines)}件（= 機能単位 {tot_t}件 ＋ 別掲 {len(matched_lines) - tot_t}件）。"
    )

    md.append("\n## 読むときの注意\n")
    md.append(
        "- シート名は原本の時点で先頭12文字前後に切れているものがある"
        "（例: `日別・月別集計 集計一覧(検`、`特集タグ編集CSVダウンロー`、`カード詳細(登録・編集・削除`）。"
        "切れた結果、日別と月別のように別シートが同名に潰れている箇所がある（0211 の6件は日別3・月別3）。"
    )
    md.append(
        "- 0210/0301/0302/0303/0307 など、この監査で所見0の設計書は"
        "「項目定義に差異が無い」ではなく「この監査の対象範囲に入っていない」可能性がある。"
        "母集合の由来は `README.md` を参照。"
    )

    (HERE / "BY_FUNCTION.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"scoped={len(scoped)} unscoped={len(unscoped)} docs={len(by_doc)} ticketed={tot_t}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
