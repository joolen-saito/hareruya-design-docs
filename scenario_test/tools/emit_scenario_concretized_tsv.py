#!/usr/bin/env python3
"""シナリオテスト項目(scenario_test/test_items/all_scenario_test_items.tsv・11列)を、
結合テストの具体化TSV(integration_test/e2e/exec/tsv/*_concretized.tsv・13列)と
同じ列構成・同じ整形規則へ機械変換する。

出力: scenario_test/exec/tsv/sti-<業務コード>_concretized.tsv（業務別10本・14列）

列構成（先頭13列は結合テスト具体化TSVと同一。14列目はシナリオ層固有）:
  機能名 / テストID / I/FID / テスト観点 / 優先度 / テスト項目名 / 前提条件 /
  使用シード / 入力データ/リクエスト内容 / 操作手順/実行方法 / 期待結果／レスポンス /
  自動検証（内部: session/DB/URL） / 実行方法 / 確認対象

変換規則（すべて元TSVからの決定的な導出。値の新規創作はしない）:
  - 前提条件: 12キーの構造化ブロブを分解し、機能名・期待結果と重複するキー
    （業務／業務経路条件／最終業務状態／データパターンID・種別）を落として1行に再構成。
  - 使用シード: 前提条件の「シードデータ:」以降を分離して独立列にする（実値をそのまま転記）。
  - 入力データ: データパターンID・種別・目的・入力を1行へ。
  - 操作手順: セル内改行を除去し「1. … 2. …」の1行に平坦化。冗長な先頭行
    「担当者: X」は前提条件の主アクターと重複するため除去し、続く「対象: …」行は
    直前の手順へ併合する。
  - 期待結果: 文末の句点を落として「〜こと」で統一（結合テスト側 Gate B13 と同一）。
  - 自動検証（内部）: シナリオ層は業務要件の充足を画面・現物で観測する層であり、
    元データに内部状態(session/DB/URL)の観測仕様が存在しないため一律「—」。
  - 実行方法: 確認対象から機械導出（下記 EXEC_RULES）。シナリオ層に自動実行ハーネスは
    存在しないため一律「手動」で、確認手段の種別が一意に決まる場合のみ括弧で補記する。
  - 確認対象: 元の値を順序保持で重複除去して転記。

使い方: python3 scenario_test/tools/emit_scenario_concretized_tsv.py
"""
from __future__ import annotations

import csv
import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
OUT_DIR = ROOT / "scenario_test/exec/tsv"

OUT_COLS = [
    "機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
    "前提条件", "使用シード", "入力データ/リクエスト内容", "操作手順/実行方法",
    "期待結果／レスポンス", "自動検証（内部: session/DB/URL）", "実行方法", "確認対象",
]

# 前提条件ブロブの固定キー（出現順・全1,067行で不変であることを検証する）
PRE_KEYS = ["元シナリオ", "業務", "経路ID", "経路種別", "業務経路条件", "最終業務状態",
            "主アクター", "関連システム", "データパターンID", "データパターン種別",
            "前提差分", "シードデータ"]

# 実行方法の導出規則: 確認対象の各要素を上から順に判定し、最初に一致した確認手段に分類する
EXEC_RULES = [
    (("現物・現品",), "現物確認"),
    (("外部システム", "外部アプリ"), "外部システム確認"),
    (("送信されたメール", "メール/通知"), "メール/通知確認"),
    (("出力されたCSV", "CSV/帳票"), "CSV/帳票確認"),
]
EXEC_DEFAULT = "EC-CUBE画面確認"


def parse_precondition(text: str) -> "OrderedDict[str, str]":
    """『元シナリオ: … / 業務: … / … / シードデータ: …』を分解する。
    値自身が ' / ' を含む（シードデータ）ため、既知キーの出現位置で切り出す。"""
    marks = []
    pos = 0
    for key in PRE_KEYS:
        pat = re.compile((r"^" if not marks else r"\s/\s") + re.escape(key) + r":\s")
        m = pat.search(text, pos) if marks else pat.match(text)
        if not m:
            raise ValueError(f"前提条件のキー '{key}' を検出できない: {text[:120]}")
        marks.append((key, m.end()))
        pos = m.end()
    out = OrderedDict()
    for i, (key, start) in enumerate(marks):
        end = len(text) if i + 1 == len(marks) else text.rindex(f" / {marks[i + 1][0]}: ", start)
        out[key] = text[start:end].strip()
    return out


def build_precondition(p: "OrderedDict[str, str]") -> str:
    """機能名・期待結果と重複しないキーだけで前提条件を1行に再構成する。
    落とすキー: 業務(機能名に内包) / 業務経路条件(前提差分に内包) /
    最終業務状態(期待結果に内包) / データパターンID・種別(入力データ列へ) / シードデータ(使用シード列へ)。"""
    scn = p["元シナリオ"].split(" ", 1)[0]          # SCN-… のIDのみ（表題は機能名にある）
    parts = [
        f"元シナリオ {scn}",
        f"経路{p['経路ID']}（{p['経路種別']}）",
        f"主アクター: {p['主アクター']}",
        p["前提差分"].rstrip("。") + "。",
        f"関連システム: {p['関連システム']}",
    ]
    return "／".join(x for x in parts if x and x != "。")


def build_input(text: str) -> str:
    """『データパターンID=… / 種別=… / 目的=… / 入力=…』を1行に整える。"""
    m = re.match(r"データパターンID=(.*?) / 種別=(.*?) / 目的=(.*?)(?: / 入力=(.*))?$",
                 text, flags=re.S)
    if not m:
        return one_line(text) or "—"
    dpid, kind, purpose, data = m.group(1), m.group(2), m.group(3), m.group(4) or ""
    head = f"{dpid}（{kind}）"
    parts = [head, f"目的: {one_line(purpose).rstrip('。')}"]
    if data.strip():
        parts.append(f"入力: {one_line(data)}")
    return "／".join(parts)


def build_steps(text: str) -> str:
    """複数行の手順を『1. … 2. …』の1行へ平坦化する。
    先頭の『担当者: X』行は前提条件の主アクターと重複するため落とし、
    『対象: …』の従属行は直前の手順へ併合する。"""
    steps: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("担当者: "):
            continue
        if re.match(r"^\d+\.\s", line):
            steps.append(line)
        elif steps:
            steps[-1] += f"、{line}"
        else:
            steps.append(line)
    return one_line(" ".join(steps)) or "—"


def norm_expect(text: str) -> str:
    """期待結果の文末を『〜こと』で統一する（結合テスト具体化TSVと同じ規則）。"""
    t = one_line(text).rstrip("。、 ")
    if not t:
        return "—"
    return t if t.endswith("こと") else t + "こと"


def dedupe_targets(text: str) -> str:
    """確認対象の重複を順序保持で除去する。"""
    seen, out = set(), []
    for part in (x.strip() for x in text.split(" / ")):
        if part and part not in seen:
            seen.add(part)
            out.append(part)
    return " / ".join(out) or "—"


def exec_method(targets: str) -> str:
    """確認対象から実行方法を導出する。シナリオ層に自動実行ハーネスは無いため常に手動で、
    確認手段の種別を括弧で補記する。確認対象が複数種別にまたがる場合は先頭種別＋『ほか』。"""
    if targets == "—":
        return "手動"
    cats: list[str] = []
    for part in targets.split(" / "):
        cat = next((label for words, label in EXEC_RULES if any(w in part for w in words)),
                   EXEC_DEFAULT)
        if cat not in cats:
            cats.append(cat)
    return f"手動（{cats[0]}{'ほか' if len(cats) > 1 else ''}）"


def one_line(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").replace("　", " ")).strip()


def biz_code(test_id: str) -> str:
    return test_id.split("-")[1].lower()


def main() -> int:
    csv.field_size_limit(10 ** 7)
    with SRC.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        idx = {c: i for i, c in enumerate(header)}
        src_rows = list(reader)

    groups: "OrderedDict[str, list[list[str]]]" = OrderedDict()
    codes: dict[str, str] = {}
    for row in src_rows:
        get = lambda c: row[idx[c]] if idx[c] < len(row) else ""  # noqa: E731
        pre = parse_precondition(get("前提条件"))
        targets = dedupe_targets(get("確認対象"))
        out = [
            one_line(get("機能名")),
            one_line(get("テストID")),
            one_line(get("I/FID")) if get("I/FID").strip() not in ("", "-") else "—",
            one_line(get("テスト観点")),
            one_line(get("優先度")),
            one_line(get("テスト項目名")),
            build_precondition(pre),
            one_line(pre["シードデータ"]) or "—",
            build_input(get("入力データ/リクエスト内容")),
            build_steps(get("操作手順/実行方法")),
            norm_expect(get("期待結果／レスポンス")),
            "—",
            exec_method(targets),
            targets,
        ]
        biz = out[0].split(" — ")[0]
        groups.setdefault(biz, []).append(out)
        codes[biz] = biz_code(out[1])

    # ハードゲート: 入出力の行数一致・セル内改行ゼロ・列数一致
    total = sum(len(v) for v in groups.values())
    if total != len(src_rows):
        print(f"NG 行数不一致: 入力{len(src_rows)} → 出力{total}")
        return 1
    for biz, rows in groups.items():
        for r in rows:
            if len(r) != len(OUT_COLS):
                print(f"NG 列数不正: {r[1]} {len(r)}列")
                return 1
            if any("\n" in c or "\t" in c for c in r):
                print(f"NG セル内改行/タブ残存: {r[1]}")
                return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for biz, rows in groups.items():
        path = OUT_DIR / f"sti-{codes[biz]}_concretized.tsv"
        with path.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, delimiter="\t", lineterminator="\n")
            w.writerow(OUT_COLS)
            w.writerows(rows)
        print(f"出力: {path.relative_to(ROOT)}  {len(rows)}行  ({biz})")
    print(f"合計 {total}行 / {len(groups)}ファイル  行数一致・改行残存0: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
