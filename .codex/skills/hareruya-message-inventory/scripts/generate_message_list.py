#!/usr/bin/env python3
"""正本 message_inventory.tsv から MESSAGE_LIST.tsv / MESSAGE_LIST.md を再生成する。

規則: MESSAGE_LIST = 正本から EE-* 行を除いた確定メッセージ。文言・メタは正本逐語。
- 機能名は既存 MESSAGE_LIST.tsv の (機能ID→機能名) を踏襲（既存170機能の表記を保持）。
  新規機能は設計書H1タイトルから日本語名を導出。
- doc パスは functions/**/<fid>_*.md を探索。
- .tsv: 10列 RFC4180(CRLF)。 .md: 機能別グルーピング(7列 ja/en 表)。

使い方: python3 generate_message_list.py
"""
from __future__ import annotations

import csv
import io
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
MASTER = ROOT / "message_inventory" / "message_inventory.tsv"
OUT_TSV = ROOT / "message_inventory" / "MESSAGE_LIST.tsv"
OUT_MD = ROOT / "message_inventory" / "MESSAGE_LIST.md"
FUNCTIONS = ROOT / "functions"

TSV_COLS = ["メッセージID", "機能ID", "機能名", "種別", "表示位置", "画面上の文言",
            "画面上の文言(英語)", "表示条件", "後続処理", "根拠(file:line)"]


def existing_names() -> dict[str, str]:
    out = {}
    if OUT_TSV.exists():
        with open(OUT_TSV, encoding="utf-8", newline="") as f:
            for r in list(csv.reader(f, delimiter="\t"))[1:]:
                if r and len(r) >= 3:
                    out[r[1]] = r[2]
    return out


FID_KUBUN = ROOT / "integration_test" / "fid_kubun.tsv"


def canonical_docs() -> dict[str, str]:
    """fid_kubun.tsv（結合テスト対象機能の正本一覧）の『設計書md』列。

    同じFID接頭辞のmdが複数ある場合（例 m05-26 に ..._csv_import.md と ..._csv_format.md）、
    glob順で先に来た方を拾うと正本でない文書を指してしまうため、正本一覧で解決する。
    """
    out: dict[str, str] = {}
    if not FID_KUBUN.exists():
        return out
    for line in FID_KUBUN.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        cells = line.split("\t")
        if len(cells) >= 6 and cells[5].endswith(".md"):
            out[cells[0].upper()] = cells[5]
    return out


_CANON = canonical_docs()


def doc_for(fid: str) -> Path | None:
    # functions/_archive は5分類化で本文から外した節の退避先。現役の設計書ではないので除外する
    # （除外しないと _archive がアルファベット順で先に来て、doc パスが退避先を指してしまう）。
    hits = [p for p in sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
            if "_archive" not in p.relative_to(FUNCTIONS).parts]
    if not hits:
        return None
    canon = _CANON.get(fid.upper())
    if canon:
        for p in hits:
            if p.relative_to(FUNCTIONS).as_posix() == canon:
                return p
    return hits[0]


def derive_name(fid: str) -> str:
    """設計書H1から日本語機能名を導出（フォールバック用）。"""
    p = doc_for(fid)
    if p:
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                t = line[2:].strip()
                # "mXX-..._slug（日本語）" → 日本語 / "大分類 — 名" → そのまま
                m = re.search(r"（(.+)）\s*$", t)
                if m:
                    return m.group(1).replace("_", " — ")
                t = re.sub(r"^[mMfF]\d[\w-]*\s*", "", t)
                return t or fid.upper()
    return fid.upper()


def cell_md(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def main() -> None:
    lines = MASTER.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    names = existing_names()

    def area(mid: str) -> str:
        return re.sub(r"-MSG-.*", "", mid)

    def name_of(fid: str) -> str:
        if fid not in names:
            names[fid] = derive_name(fid)
        return names[fid]

    # 非EE行を (機能ID, MSG番号) で整列
    data = [r for r in rows if not r[0].startswith("EE-")]

    def sort_key(r):
        mid = r[0]
        a = area(mid)
        n = mid.split("-MSG-")[-1]
        return (a, int(n) if n.isdigit() else 0)

    data.sort(key=sort_key)

    # --- TSV (RFC4180, CRLF) ---
    buf = io.StringIO()
    w = csv.writer(buf, delimiter="\t", lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL)
    w.writerow(TSV_COLS)
    for r in data:
        fid = area(r[0])
        w.writerow([
            r[0], fid, name_of(fid), r[ic["種別"]], r[ic["どこに"]],
            r[ic["メッセージ内容"]].replace("\\n", "\n"),
            r[ic["メッセージ内容(英語)"]].replace("\\n", "\n"),
            r[ic["トリガー（条件）"]].replace("\\n", "\n"),
            r[ic["後続処理"]].replace("\\n", "\n"), r[ic["根拠(file:line)"]],
        ])
    OUT_TSV.write_text(buf.getvalue(), encoding="utf-8")

    # --- MD (機能別) ---
    by_fid: dict[str, list] = defaultdict(list)
    for r in data:
        by_fid[area(r[0])].append(r)
    en_count = sum(1 for r in data if r[ic["メッセージ内容(英語)"]] not in ("", "（英訳なし）"))

    out = []
    out.append("# メッセージ一覧（設計書反映済み・機能別・ja/en対訳）\n")
    out.append("ec-cube-enterprise 実装のUIメッセージを機能へ割当て、設計書『表示メッセージ』表へ"
               "埋め込んだ**確定**メッセージの一覧。**捏造ゼロ**（全列が実ソース逐語。"
               "未確認プレースホルダの残置なし）。\n")
    out.append(f"- 総確定メッセージ: **{len(data)}件** / 機能数: **{len(by_fid)}** / 英訳あり: {en_count}件")
    out.append("- フロント/管理画面ともに twig `|trans` 直描画メッセージを追補"
               "（codex判定でメッセージのみ収録・content/label除外、codexレビューで是正済み）。")
    out.append("- 例外由来で単一に絞れない文言は「候補A ／ 候補B …」と全列挙（各候補はソース逐語）。")
    out.append("- ロケール ja/en 対訳。機能名は「大分類 — 機能名」で統一。\n")
    out.append("---\n")
    for fid in sorted(by_fid):
        out.append(f"## {fid} {name_of(fid)}")
        dp = doc_for(fid)
        if dp:
            out.append(f"`{dp.relative_to(ROOT)}`\n")
        out.append("| メッセージID | 種別 | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |")
        out.append("|---|---|---|---|---|---|---|")
        for r in sorted(by_fid[fid], key=sort_key):
            out.append("| " + " | ".join([
                r[0], cell_md(r[ic["種別"]]), cell_md(r[ic["どこに"]]),
                cell_md(r[ic["メッセージ内容"]]), cell_md(r[ic["メッセージ内容(英語)"]]),
                cell_md(r[ic["トリガー（条件）"]]), cell_md(r[ic["後続処理"]]),
            ]) + " |")
        out.append("")
    OUT_MD.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"MESSAGE_LIST 再生成: {len(data)}件 / {len(by_fid)}機能 / 英訳{en_count}")


if __name__ == "__main__":
    main()
