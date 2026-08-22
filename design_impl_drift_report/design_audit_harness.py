#!/usr/bin/env python3
"""HTML設計書を正とした実装乖離監査ハーネス（母数TSV非依存・新規調査用）。

`recheck_harness.py` との違い:
  recheck_harness は既存の指摘一覧(`drift_findings_list_remaining.tsv`)を再判定する。
  本ハーネスは**その一覧を一切読まない**。正本HTML設計書から要求を機械抽出して母集合を作り、
  1要求ずつ `ec-cube-enterprise`(ee) 実装と突き合わせる。出力は新規のMD/TSV。

絶対規約:
  1. 入力は正本HTML(`excel_to_html/output/*.html`)と ee リポジトリだけ。
     既存の指摘一覧・findings.json の類は読まない（読む実装を置かない）。
  2. **正本HTMLに書かれていないことは指摘にできない。**
     判定行の `設計根拠_引用` は該当シート本文に実在すること（空白を詰めた部分一致で機械照合）。
     不一致は RuntimeError で build を落とす。
  3. `実装参照` は ee 内に実在するファイル:行のみ。存在しない・行数超過は RuntimeError。
  4. **判定漏れ0**: 抽出した全要求に判定が付くまで build は成功しない。
     取り込まない要求も OUT_OF_SCOPE / UNVERIFIABLE として理由付きで必ず残す。

使い方:
  python3 design_audit_harness.py inventory --doc 0203   # 要求母集合 + 画像を書き出す
  python3 design_audit_harness.py build     --doc 0203   # verdicts.tsv を検証してMD/TSVを出力
"""

from __future__ import annotations

import argparse
import base64
import csv
import difflib
import functools
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib_design_doc as L  # noqa: E402

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent.parent
IMPL_ROOT = WORKSPACE / "ec-cube-enterprise"
AUDIT_DIR = ROOT / "design_audit"

# 書籍番号だけでは一意に決まらない設計書のエイリアス（0211 は基本設計と詳細設計の2冊ある）
DOC_ALIAS = {
    "0211": "0211_基本設計仕様書(分析・集計管理機能)",
    "0211_詳細設計": "0211_基本設計仕様書(分析・集計管理機能)_詳細設計",
}


def resolve_doc(doc_key: str) -> Path:
    return L.resolve_book(DOC_ALIAS.get(doc_key, doc_key))

# ---- 要求抽出 ---------------------------------------------------------------

SECTION_MARKS = [
    (re.compile(r"^処理概要（★はカスタマイズ項目）$"), "OVERVIEW"),
    (re.compile(r"^レイアウト図$"), "LAYOUT"),
    (re.compile(r"^(カスタマイズ説明|機能について|機能仕様)"), "SPEC"),
    # 「要件説明」はレイアウト図の直後に置かれることが多く、LAYOUT のまま捨てると
    # 要件そのものが母集合から落ちる（0201 だけで 30行）。独立した節として拾う。
    (re.compile(r"^要件説明"), "REQUIREMENT"),
    (re.compile(r"^識別ID\t"), "ITEMS"),
    (re.compile(r"^(番号pin対応台帳|コネクタ解決台帳)"), "LEDGER"),
    (re.compile(r"^Source:$"), "SOURCE"),
    (re.compile(r"^現行仕様$"), "CURRENT"),
    (re.compile(r"^リニューアル後の仕様$"), "RENEWED"),
    (re.compile(r"^表示メッセージ$"), "MESSAGES"),
    (re.compile(r"^メッセージID\t"), "MESSAGES"),
]

# 見出し・体裁だけの行（要求ではない）
NOISE = re.compile(
    r"^(ドキュメント名|セクション|プロジェクト名|作成者|作成日|更新者|更新日|機能No|機能名|概要|"
    r"受注管理　基本設計|—|・カスタマイズ要件|カスタマイズ説明|レイアウト図|Source:|現行仕様|"
    r"リニューアル後の仕様|表示メッセージ|業務ロジック|入出力|処理概要（★はカスタマイズ項目）|"
    r"機能仕様機能について|機能仕様処理概要（★はカスタマイズ項目）|機能について)\s*$"
)
# レイアウト図のピン番号・画像キャプション
PIN = re.compile(r"^\(?\d+(-\d+)?\)?$")
IMG_CAPTION = re.compile(r"/ [A-Z]{1,3}\d+ / image \d+$|^画像レイヤー（\d+枚）:")
DATE_LIKE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# 表のヘッダ行。全セルが短いラベルで、仕様の語（助詞・述語）を含まない行を見出しとみなす。
_HEADER_LABELS = {
    "識別ID", "メッセージID", "項目名", "項目", "種類", "内容", "条件", "備考", "説明", "コード",
    "操作", "契機", "事象", "扱い", "順序", "判定", "結果", "処理", "エラー内容", "書式・制限",
    "必須", "最大値", "初期値", "表示位置", "画面上の文言", "表示文言", "文言", "No", "No.",
    "パラメータ", "型", "必須/任意", "値", "説明・制約", "区分", "対象", "分類",
}


def _is_table_header(line: str) -> bool:
    cells = [c.strip() for c in line.split("\t") if c.strip()]
    return len(cells) >= 2 and all(c in _HEADER_LABELS for c in cells)


class _HeaderRe:
    """re 互換の薄いラッパ（既存の match() 呼び出しに合わせる）。"""
    @staticmethod
    def match(line: str):
        return _is_table_header(line) or None


TABLE_HEADER_RE = _HeaderRe


def classify_sections(lines: list[str]) -> list[str]:
    """行ごとのセクション名を返す。

    `Source:` は取り込み元の明示であって、それ以降が要求でないという意味ではない。
    見出し行とその次の1行（取り込み元パス）だけを SOURCE とし、以降は本文として拾い直す。
    ここを「以降ずっと SOURCE」にすると、Markdown起点の設計書（節見出しが業務ロジック等で
    SECTION_MARKS に無い）で本文が丸ごと母集合から落ちる。
    """
    out, cur = [], "HEADER"
    src_left = 0
    imported = "BODY"      # Source: の直後に見出しが来ないときの既定区分
    for line in lines:
        matched = None
        for rx, name in SECTION_MARKS:
            if rx.match(line):
                matched = name
                break
        if matched == "SOURCE":
            cur, src_left = "SOURCE", 1
            out.append(cur)
            continue
        if cur == "SOURCE":
            if src_left:
                # この行が取り込み元のパス。どのリポジトリのリバースかで既定区分が決まる。
                # pf-* は現行システムのリバース＝踏襲対象の「現行仕様」、
                # ec-cube-enterprise は移行先自身のリバース＝「刷新仕様」。
                imported = "RENEWED" if "ec-cube-enterprise" in line else (
                    "CURRENT" if line.strip().startswith("functions/") else "BODY")
                src_left -= 1
                out.append(cur)
                continue
            cur = matched if matched else imported
        elif matched:
            cur = matched
        out.append(cur)
    return out


def extract_requirements(sheet_id: str, title: str, lines: list[str]) -> list[dict]:
    """1シートから要求候補を切り出す。落とした行は理由付きで別途数える。

    節見出し（処理概要／カスタマイズ説明／識別ID表／現行仕様…）を1つも持たないシートは、
    セクション判定が HEADER のまま進み全行が落ちる。別添資料のように本文だけのシートが
    丸ごと素通りするため、その場合は HEADER 以降を「本文」として拾い直す。
    """
    secs = classify_sections(lines)
    if all(s == "HEADER" for s in secs):
        secs = ["HEADER"] + ["BODY"] * (len(lines) - 1)
    else:
        # 冒頭のメタ情報（ドキュメント名〜機能名〜概要）より後ろは、節見出しが現れるまで本文として拾う。
        # 節見出しを持たない「処理」「要件説明」等の塊が HEADER 扱いで丸ごと落ちるのを防ぐ。
        meta_end = 0
        for i, line in enumerate(lines[:40]):
            if line.strip() in ("概要", "機能名"):
                meta_end = i + 1  # ラベル行の次（値）まで
        for i in range(meta_end + 1, len(lines)):
            if secs[i] == "HEADER":
                secs[i] = "BODY"
            else:
                break
    reqs: list[dict] = []
    seq = 0
    table_header = ""
    for i, (line, sec) in enumerate(zip(lines, secs), start=1):
        if sec in ("HEADER", "LAYOUT", "LEDGER", "SOURCE"):
            continue
        if NOISE.match(line) or PIN.match(line) or IMG_CAPTION.search(line) or DATE_LIKE.match(line):
            continue
        if not line.strip(" 　\t-"):
            continue
        kind = {
            "OVERVIEW": "処理概要",
            "SPEC": "機能仕様",
            "ITEMS": "項目定義",
            "CURRENT": "現行仕様",
            "RENEWED": "刷新仕様",
            "MESSAGES": "表示メッセージ",
            "REQUIREMENT": "要件説明",
            "BODY": "本文",
        }.get(sec, sec)
        # 表のヘッダ行は要求ではないが、**捨てずに覚える**。
        # Excelは同一行の別セルに備考を書くため、どの列が何かを知らないと
        # 「備考」を仕様と読み違えて誤った指摘が出る（利用者指摘 2026-08-22）。
        if sec == "ITEMS" and line.startswith("識別ID\t"):
            table_header = line
            continue
        if sec == "MESSAGES" and line.startswith("メッセージID\t"):
            table_header = line
            continue
        if "\t" in line and TABLE_HEADER_RE.match(line):
            table_header = line
            continue
        seq += 1
        reqs.append({
            "要求ID": f"{sheet_id}-R{seq:03d}",
            "シート": sheet_id,
            "シート名": title,
            "区分": kind,
            "シート内行": str(i),
            "表ヘッダ": table_header,
            "要求文": line,
        })
    return reqs


def sheet_line_offset(book: Path, sheet) -> tuple[int, int]:
    raw = book.read_text(encoding="utf-8", errors="ignore")
    offs, pos = [], 0
    for line in raw.splitlines():
        offs.append(pos)
        pos += len(line) + 1
    lo = next(i for i, o in enumerate(offs, 1) if o >= sheet.start)
    hi = max(i for i, o in enumerate(offs, 1) if o < sheet.end)
    return lo, hi



# ---- ゲート用の台帳（利用者決定 2026-08-22） --------------------------------
#
# 過剰指摘を止める設計。**判定の機会が増えるほど誤判定の機会も増える**という理由で、
# 「見出し・表のヘッダ・Ph2・廃止」のように規約で既に対象外と決まっているものは
# エージェントに判定させず機械で落とす。落とすのは確実なものだけで、迷ったら残す。

REPO = ROOT.parent            # 設計書リポジトリのルート
NON_REQ_LEDGER = ROOT / "non_requirement_lines.tsv"
_JSON_PUNCT_RE = re.compile(r"^[\s{}\[\],]+$")


@functools.lru_cache(maxsize=1)
def non_requirement_lines() -> tuple[frozenset[str], bool]:
    """(完全一致で落とす行の集合, JSON構造記号を落とすか)。"""
    exact: set[str] = set()
    json_punct = False
    if not NON_REQ_LEDGER.is_file():
        return frozenset(), False
    for raw in NON_REQ_LEDGER.read_text(encoding="utf-8").splitlines():
        if raw.startswith("#") or not raw.strip():
            continue
        cells = raw.split("\t")
        if cells[0] == "種別":
            continue
        if cells[0] == "EXACT" and len(cells) >= 2:
            # 値そのものにタブを含む表ヘッダがあるため、末尾の理由列だけを落として復元する。
            exact.add("\t".join(cells[1:-1]) if len(cells) > 2 else cells[1])
        elif cells[0] == "JSON_PUNCT":
            json_punct = True
    return frozenset(exact), json_punct


def non_requirement_reason(text: str) -> str:
    """要求ではないと機械で断定できるなら理由を返す。断定できなければ空文字。"""
    t = text.strip()
    exact, json_punct = non_requirement_lines()
    if t in exact:
        return "非要求行の台帳に一致（見出し・表のヘッダ・表紙）"
    if json_punct and t and _JSON_PUNCT_RE.match(t):
        return "JSONサンプルの構造記号だけの行"
    return ""


@functools.lru_cache(maxsize=1)
def scoped_out_entries() -> tuple[dict, ...]:
    """Ph2・廃止の台帳を1つに束ねる。ITEM_SCOPE も含めて全件返す。"""
    out = []
    for path, kind in ((REPO / "functions" / "phase2_specs.json", "フェーズ2対応"),
                       (REPO / "functions" / "superseded_specs.json", "廃止")):
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        recs = next((v for v in data.values() if isinstance(v, list)), []) if isinstance(data, dict) else data
        for r in recs:
            if r.get("verdict") == "not-superseded":
                continue
            out.append({
                "kind": kind, "id": r.get("id", ""), "book": r.get("book", ""),
                "scope": r.get("scope", ""), "target": (r.get("target") or "").strip(),
                "identifierId": (r.get("identifierId") or "").strip(),
                "sheetIds": {sh.get("sheetId") for sh in r.get("sheets", []) if sh.get("sheetId")},
            })
    return tuple(out)


# 行そのものが「これはPh2だ／廃止だ」と宣言している型。これは確実なので機械で落とす。
_DECLARES_RE = re.compile(
    r"はフェーズ2対応|フェーズ1では実装しない|により廃止|刷新後は実装しない"
    r"|フェーズ2以降で設計予定|本節はフェーズ1の実装・テスト対象")


def scoped_out_reason(req: dict) -> str:
    """Ph2・廃止と機械で断定できるなら理由を返す。曖昧なものは空文字（＝人が判定）。

    確実と見なすのは次の2つだけ:
      1. 行そのものが宣言している（「…はフェーズ2対応」「…により廃止」）。
      2. 項目定義の行の識別IDが、台帳の identifierId と一致する。
    target の部分一致だけでは落とさない。機能はフェーズ1で項目だけがPh2という
    ITEM_SCOPE があり、target 語を含むフェーズ1の要求を巻き添えにするため。
    """
    text = req.get("要求文", "")
    if _DECLARES_RE.search(text):
        return "行そのものがPh2・廃止を宣言している（台帳と同義）"
    if req.get("区分") != "項目定義":
        return ""
    m = re.match(r"\s*([0-9]+(?:-[0-9]+)*)\t", text)
    if not m:
        return ""
    ident = m.group(1)
    for e in scoped_out_entries():
        if not e["identifierId"] or e["identifierId"] != ident:
            continue
        if e["sheetIds"] and req.get("シート") not in e["sheetIds"]:
            continue
        return f"{e['kind']}の台帳 {e['id']}（識別ID {ident}「{e['target']}」）に一致"
    return ""


# ---- ゲート5: シート単位の除外（利用者決定 2026-08-22） -------------------
#
# シートまるごとが廃止／Ph2のことがあり、その場合そのシートの要求は全て調査対象外。
# 標準機能（EC-CUBE標準のまま使う28機能）も調査対象外。
# 行単位のゲート1では「宣言している行」と「識別ID一致」しか落ちないため、
# シート全体が対象外のときに残りの行が判定へ流れてしまう。

ATTRIBUTION = REPO / "functions" / "source-attribution-all.tsv"
SHEET_MAP = REPO / "functions" / "function-sheet-map.tsv"


@functools.lru_cache(maxsize=1)
def sheet_exclusions() -> dict[tuple[str, str], str]:
    """(書番, シートID) -> 除外理由。理由が付くシートは全要求を対象外にする。"""
    out: dict[tuple[str, str], str] = {}

    # 1) 標準機能のシート。
    #    シート対応は **状態=確定（一致根拠=機能No欄が一致・スコア1.00）** の行だけを使う。
    #    候補行はシート名が似ているだけで付くため、これを信じると
    #    「標準機能が同居している」と誤認してカスタマイズ機能のシートを巻き添えにする
    #    （2026-08-22 実測: 0201/sheet-6 は M11-03 カスタマイズが確定なのに、
    #     M11-04 標準がスコア0.00の候補として並んでいた）。
    #    なお確定行395件に標準機能は1件も無い。標準28機能はExcel設計書のシートを持たない。
    #    したがって現状この経路で落ちるシートは0件で、将来標準シートが現れたときの備えである。
    kubun: dict[str, str] = {}
    if ATTRIBUTION.is_file():
        for r in csv.DictReader(ATTRIBUTION.open(encoding="utf-8"), delimiter="\t"):
            kubun[(r.get("機能No") or "").strip()] = (r.get("カスタマイズ区分") or "").strip()
    per_sheet: dict[tuple[str, str], list[str]] = {}
    if SHEET_MAP.is_file():
        for r in csv.DictReader(SHEET_MAP.open(encoding="utf-8"), delimiter="\t"):
            if (r.get("状態") or "").strip() != "確定":
                continue
            book, sid = (r.get("ブック") or "").strip(), (r.get("シートID") or "").strip()
            fno = (r.get("機能No") or "").strip()
            if book and sid and book != "-" and fno:
                per_sheet.setdefault((book, sid), []).append(fno)
    for key, fnos in per_sheet.items():
        known = [kubun.get(f) for f in fnos if kubun.get(f)]
        if known and all(k == "標準" for k in known):
            out[key] = f"標準機能のシート（{'/'.join(fnos)}）。調査対象外"

    # 2) シートまるごとが廃止／Ph2。FUNCTION_SCOPE のものだけを対象にする
    #    （ITEM_SCOPE は機能自体がフェーズ1対象なのでシートごと落としてはいけない）。
    for e in scoped_out_entries():
        if e["scope"] != "FUNCTION_SCOPE":
            continue
        for sid in e["sheetIds"]:
            out.setdefault((e["book"], sid),
                           f"シートまるごと{e['kind']}（台帳 {e['id']}「{e['target']}」）。調査対象外")
    return out


def sheet_exclusion_reason(book: str, sheet_id: str) -> str:
    return sheet_exclusions().get((book, sheet_id), "")


# ---- ブロック文脈（利用者指摘 2026-08-22） ---------------------------------
#
# Excel設計書は1つの仕様を複数行に分けて書く。カスタマイズの★は先頭行にしか付かず、
# 後続行にも同じカスタマイズ要件が続く。行を単位に切ると、
#   ★権限による制御            ← 見出しだけで仕様が無い
#   ・識別ID:5「会場」に…       ← 実体。★が無い
#   ・エンハンスで対応済みであり、対応内容を踏襲する   ← 直前行の但し書き
# のように、単独では判定できない断片が母集合に並ぶ。単独で判定させると誤った指摘が出る。
# 抽出の単位は行のままにして（判定漏れ0を保つため）、**各行に所属ブロックを持たせる**。

_BLOCK_HEAD_RE = re.compile(r"^\s*[★☆]")


def assign_blocks(reqs: list[dict]) -> None:
    """同一シート内で連続する要求を意味のまとまりへ束ね、各行に文脈を持たせる。

    切れ目は「★で始まる行」「区分が変わる」「シートが変わる」「行番号が飛ぶ」。
    ★の属性はブロック内の後続行へ伝播させる（★は先頭行にしか付かないため）。
    """
    blk = 0
    prev = None
    for r in reqs:
        head = _BLOCK_HEAD_RE.match(r["要求文"] or "")
        gap = prev is not None and (
            r["シート"] != prev["シート"] or r["区分"] != prev["区分"]
            or int(r["シート内行"]) != int(prev["シート内行"]) + 1)
        if head or gap or prev is None:
            blk += 1
            cur_head = r["要求文"].strip() if head else ""
            cur_custom = "★" if head else ""
        r["ブロックID"] = f"{r['シート']}-B{blk:03d}"
        r["ブロック見出し"] = cur_head
        r["カスタマイズ"] = cur_custom
        prev = r
    # ブロックに属する要求IDを相互に持たせる（判定時に前後を必ず読ませるため）
    members: dict[str, list[str]] = {}
    for r in reqs:
        members.setdefault(r["ブロックID"], []).append(r["要求ID"])
    for r in reqs:
        ids = members[r["ブロックID"]]
        r["同ブロック"] = ",".join(x for x in ids if x != r["要求ID"])


def cmd_inventory(doc_key: str) -> None:
    book = resolve_doc(doc_key)
    raw = book.read_text(encoding="utf-8", errors="ignore")
    outdir = AUDIT_DIR / doc_key
    (outdir / "sheets").mkdir(parents=True, exist_ok=True)
    (outdir / "images").mkdir(parents=True, exist_ok=True)

    all_reqs: list[dict] = []
    sheet_rows: list[dict] = []
    for s in L.sheet_index(book):
        text = L.sheet_text(book, s)
        lines = text.splitlines()
        lo, hi = sheet_line_offset(book, s)
        frag = raw[s.start:s.end]
        imgs = re.findall(r'<img[^>]+src="data:image/(\w+);base64,([^"]+)"', frag)
        (outdir / "sheets" / f"{s.sheet_id}.txt").write_text(
            f"# {s.sheet_id} {s.title} (HTML行 {lo}-{hi} / 画像 {len(imgs)}枚)\n\n" + text,
            encoding="utf-8")
        for n, (ext, b64) in enumerate(imgs, start=1):
            path = outdir / "images" / f"{s.sheet_id}_img{n}.{ext}"
            path.write_bytes(base64.b64decode(b64))
        reqs = extract_requirements(s.sheet_id, s.title, lines)
        for r in reqs:
            r["書番"] = doc_key.split("_")[0]
        if not reqs and imgs:
            # 本文テキストを持たず画像だけのシート。判定漏れで素通りしないよう1件立てる。
            reqs = [{
                "要求ID": f"{s.sheet_id}-R001", "シート": s.sheet_id, "シート名": s.title,
                "区分": "画像のみ", "シート内行": "1",
                "要求文": f"本シートは本文テキストを持たない。埋め込み画像{len(imgs)}枚を目視し、"
                          f"実装対象の要求が描かれていないかを確認すること。",
            }]
        for r in reqs:
            r["HTML行"] = str(lo + int(r["シート内行"]) - 1)  # 参考値（本文行と一致しない場合あり）
        all_reqs.extend(reqs)
        sheet_rows.append({
            "シート": s.sheet_id, "シート名": s.title,
            "HTML行範囲": f"{lo}-{hi}", "本文行数": str(len(lines)),
            "画像": str(len(imgs)), "要求候補": str(len(reqs)),
        })

    assign_blocks(all_reqs)
    cols = ["要求ID", "書番", "シート", "シート名", "区分", "シート内行", "HTML行",
            "ブロックID", "ブロック見出し", "カスタマイズ", "同ブロック", "表ヘッダ", "要求文"]
    with (outdir / "requirements.tsv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, delimiter="\t", lineterminator="\n")
        w.writeheader()
        for r in all_reqs:
            w.writerow({c: r.get(c, "") for c in cols})
    with (outdir / "sheets.tsv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(sheet_rows[0]), delimiter="\t", lineterminator="\n")
        w.writeheader()
        w.writerows(sheet_rows)
    print(f"inventory: {len(all_reqs)}要求 / {len(sheet_rows)}シート -> {outdir}")
    for r in sheet_rows:
        print(f"  {r['シート']}\t{r['要求候補']:>4}件\t画像{r['画像']}\t{r['シート名']}")


# ---- 判定の検証・出力 -------------------------------------------------------

VERDICT_COLUMNS = [
    "要求ID", "判定", "重要度", "指摘区分", "乖離種別",
    "設計根拠_引用", "設計期待値", "実装参照", "実装実態", "判定根拠", "画像確認メモ", "確信度",
    # 同じ1つの実装欠陥から出た指摘に共通して付ける短いキー。設計書1冊の中で一意にする。
    # 実装実態のバイト一致だけで畳んでいたころは、書き手が変わると同じ欠陥が畳まれず件数が膨らんだ。
    "根本原因",
]
VALID = {
    "MATCHED",        # 設計どおり実装されている
    "DRIFT",          # 実装はあるが設計と違う
    "NOT_IMPLEMENTED",# 設計の要求に対応する実装が無い
    "DESIGN_ISSUE",   # 正本内部で記述が矛盾し、設計裁定待ち
    "UNVERIFIABLE",   # 静的解析では判定できない（理由必須）
    "OUT_OF_SCOPE",   # 実装対象の要求ではない（見出し・凡例・他機能の記述など。理由必須）
}
FINDING = {"DRIFT", "NOT_IMPLEMENTED"}

# 指摘の設計根拠として認める引用の最小長。表のセル片・見出しを弾くための下限で、
# 「文として読める単位か」を機械で近似する（利用者決定 2026-08-22）。
MIN_QUOTE_CHARS = 12
# 見出しだけ・セル片だけの引用。★見出しは後続行に本体があるため単独では根拠にできない。
_FRAGMENT_RE = re.compile(r"^[★☆]\S{0,14}$|^[-・|\s]*$")

# ---- 指摘ポリシー（利用者指示 2026-08-19 / 機械ゲート化） -------------------
#
# 1. ★書きの識別IDずれは指摘にしない。
#    カスタマイズ説明の「★識別ID:N「X」を追加」が項目表の識別IDとずれている件は、
#    どの列を足すかは項目表で決まっており実装は追随済みのため、指摘対象にしない。
#    → 該当行は build 時に自動で OUT_OF_SCOPE へ落とす（人が判定を書いても上書きする）。
#
# 2. 実装手段の差は指摘にしない。
#    通信方式・認可設定・受付先・内部配線・検証順序・トランザクション境界・
#    セッションキー・ルート名・join の種類などは、それ自体を設計期待値にしない。
#    → 設計期待値がこれらの語で書かれていたら build を落とす。結果の言葉へ書き直す。
#
# 3. 実装違いは I/O とふるまいに限る。
#    → DRIFT / NOT_IMPLEMENTED には 乖離種別（IO か ふるまい）の明示を必須にする。
#
# 「原因」を判定根拠や実装実態に書くのは可。禁じるのは設計期待値を実装手段で書くこと。

STAR_ID_SHIFT_RE = re.compile(r"^★?\s*識別ID[:：]\s*\d+")

DRIFT_KINDS = {"IO", "ふるまい"}

IMPL_MEANS_RE = re.compile(
    r"トランザクション|セッションキー|ルート名|ルート定義|"
    r"inner\s*join|left\s*join|leftJoin|innerJoin|"
    r"通信方式|認可設定|受付先|エンドポイント|内部配線|呼び出し順|"
    # 「イベント」はこのプロジェクトではイベント管理という業務ドメイン語でもあるため、
    # 実装手段としての用法（ディスパッチ・リスナ・購読）に限って弾く。
    r"クラス名|メソッド名|パラメータ名|DIコンテナ|イベント(?:ディスパッチ|リスナ|購読|を発火)|キャッシュを持つ",
    re.IGNORECASE,
)
REPORTED = {"DRIFT", "NOT_IMPLEMENTED", "DESIGN_ISSUE"}  # 成果物に載せる判定
QUOTE_REQUIRED = REPORTED  # 載るものだけ逐語引用を必須にする（捏造ゲート）


def norm(text: str) -> str:
    t = unicodedata.normalize("NFKC", text or "").replace("　", "")
    t = re.sub(r"\s+", "", t)
    t = t.replace("｢", "「").replace("｣", "」")
    return re.sub(r"[\"'`´’‘“”]", "", t)


# 重要度は業務影響で P1/P2/P3 に分類する（利用者指示 2026-08-20）。
#   P1 業務が回らず商売が止まる／データ整合性が壊れる／手作業でも代替できない
#   P2 迂回すれば回る（手作業・再実行・別経路で完了できるが、正しさ・効率・顧客体験を損なう）
#   P3 業務は回る（見出し・文言・列名・並び順・桁区切りなど、完了・データ・判断に影響しない）
# 成果物に出す判定の表記（判定TSVの入力値は英字のまま。出力だけ日本語にする）
VERDICT_JA = {
    "NOT_IMPLEMENTED": "未実装",
    "DRIFT": "実装違い",
    "DESIGN_ISSUE": "設計裁定待ち",
    "MATCHED": "設計どおり",
    "OUT_OF_SCOPE": "対象外",
    "UNVERIFIABLE": "確定不能",
}

SEVERITY_LEVELS = ("P1", "P2", "P3")
SEVERITY_ORDER = {"P1": 0, "P2": 1, "P3": 2}


# 代表を選ぶときの区分の優先順。ラベル・項目の定義は項目表（項目定義）が正本のため先に採る。
SECTION_ORDER = {"項目定義": 0, "機能仕様": 1, "処理概要": 2, "現行仕様": 3}


def dedupe_by_impl_actual(reported: list[dict], reqs: dict) -> tuple[list[dict], dict[str, list[str]], int]:
    """実装実態が同一の指摘は重複とみなし、代表1件だけを成果物に載せる（利用者指示 2026-08-20）。

    代表は 重要度(P1>P2>P3) → 区分(項目定義を優先) → 要求ID の順で選ぶ。折り畳んだ要求IDは代表行に持たせ、
    成果物にも必ず出す（黙って落とさない）。DESIGN_ISSUE は実装実態を持たないため対象外。
    """
    groups: dict[str, list[dict]] = {}
    passthrough: list[dict] = []
    for v in reported:
        # 根本原因が書かれていればそれで畳む。書き手ごとに文言が揺れても同じ欠陥は1件になる。
        key = norm(v.get("根本原因", "")) or norm(v.get("実装実態", ""))
        if v["判定"] not in FINDING or key == "":
            passthrough.append(v)
            continue
        groups.setdefault(key, []).append(v)

    kept: list[dict] = list(passthrough)
    folded: dict[str, list[str]] = {}
    folded_count = 0
    for members in groups.values():
        members.sort(key=lambda x: (SEVERITY_ORDER.get(x.get("重要度", ""), 9),
                                    SECTION_ORDER.get(reqs[x["要求ID"]]["区分"], 9),
                                    x["要求ID"]))
        rep, rest = members[0], members[1:]
        kept.append(rep)
        if rest:
            folded[rep["要求ID"]] = [x["要求ID"] for x in rest]
            folded_count += len(rest)

    kept, folded, folded_count = fold_similar(kept, reqs, folded, folded_count)
    return kept, folded, folded_count


# 類似指摘の折りたたみ（利用者指示 2026-08-22）
#
# 根本原因キーの完全一致だけで畳んでいたころ、書き手が並列だとキーの文言が揺れて
# 同じ欠陥が畳まれず件数が膨らんだ（実測: 折込率 73% → 7%、指摘 35件 → 161件）。
# キーが揺れても畳めるよう、正規化した文字列の類似度で2巡目を回す。
SIMILARITY_THRESHOLD = 0.86


def _fold_signature(v: dict) -> str:
    """畳むかどうかを測る対象。根本原因＋実装実態＋設計期待値をつないだもの。"""
    return norm(v.get("根本原因", "")) + "|" + norm(v.get("実装実態", "")) + "|" + norm(v.get("設計期待値", ""))


def fold_similar(kept: list[dict], reqs: dict, folded: dict[str, list[str]],
                 folded_count: int) -> tuple[list[dict], dict[str, list[str]], int]:
    """完全一致で畳み残った指摘のうち、類似しているものを代表1件へ寄せる。

    代表の選び方は完全一致の折りたたみと同じ（重要度 → 区分 → 要求ID）。
    畳んだ要求IDは代表に持たせ、成果物にも必ず出す（黙って落とさない）。
    """
    findings = [v for v in kept if v.get("判定") in FINDING]
    others = [v for v in kept if v.get("判定") not in FINDING]
    findings.sort(key=lambda x: (SEVERITY_ORDER.get(x.get("重要度", ""), 9),
                                 SECTION_ORDER.get(reqs[x["要求ID"]]["区分"], 9),
                                 x["要求ID"]))
    reps: list[dict] = []
    sigs: list[str] = []
    for v in findings:
        sig = _fold_signature(v)
        hit = -1
        for i, other in enumerate(sigs):
            if sig and other and difflib.SequenceMatcher(None, sig, other).ratio() >= SIMILARITY_THRESHOLD:
                hit = i
                break
        if hit < 0:
            reps.append(v)
            sigs.append(sig)
            continue
        rep_id = reps[hit]["要求ID"]
        folded.setdefault(rep_id, []).extend([v["要求ID"]] + folded.pop(v["要求ID"], []))
        folded_count += 1
    return others + reps, folded, folded_count


_IMPL_REF_RE = re.compile(r"^([\w./\-]+\.[A-Za-z0-9]+)(?::(\d+)(?:-(\d+))?)?$")

# 判定根拠の文中に埋め込まれた実装引用（例: src/Eccube/.../MemberController.php:63）を拾う。
# MATCHED は「設計どおり実装されている」という主張なので、その根拠となる実在の位置を必ず1つ以上要求する。
# ここを空けておくと、母集合を全部 MATCHED にする手抜きが捏造ゼロゲートを素通りしてしまう。
_INLINE_REF_RE = re.compile(
    r"(?:src|app|codeception|tests|bin|config)/[\w./\-]+\.(?:php|twig|yaml|yml|js|json|xml|sql|md)"
    r"(?::\d+(?:-\d+)?)?"
)


def inline_impl_refs(text: str) -> list[str]:
    return _INLINE_REF_RE.findall(text or "")


def verify_impl_ref(ref: str) -> list[str]:
    bad = []
    for part in re.split(r"[;、]", ref or ""):
        part = part.strip()
        if not part:
            continue
        m = _IMPL_REF_RE.match(part)
        if not m:
            bad.append(f"{part}(書式不正)")
            continue
        path = IMPL_ROOT / m.group(1)
        if not path.is_file():
            bad.append(f"{part}(ファイル無し)")
            continue
        if m.group(2):
            total = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
            if int(m.group(3) or m.group(2)) > total:
                bad.append(f"{part}(行数超過: 実{total}行)")
    return bad


def impl_head() -> str:
    return subprocess.run(["git", "-C", str(IMPL_ROOT), "rev-parse", "--short=10", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()


class Sheets:
    def __init__(self, doc_key: str):
        self.book = resolve_doc(doc_key)
        self.index = {s.sheet_id: s for s in L.sheet_index(self.book)}
        self._norm: dict[str, str] = {}

    def norm_text(self, sheet_id: str) -> str:
        if sheet_id not in self._norm:
            self._norm[sheet_id] = norm(L.sheet_text(self.book, self.index[sheet_id]))
        return self._norm[sheet_id]

    def title(self, sheet_id: str) -> str:
        return self.index[sheet_id].title


def validate_verdict(v: dict, req: dict, sheets: "Sheets") -> list[str]:
    """判定1行を検査し、違反の説明を返す。cmd_build と audit_part.py が同じゲートを共有する。

    ★識別IDずれの自動 OUT_OF_SCOPE 化（ポリシー1）はここで v を書き換える。
    """
    rid = (v.get("要求ID") or "").strip()
    errors: list[str] = []
    verdict = (v.get("判定") or "").strip()
    if verdict not in VALID:
        return [f"{rid}: 判定が不正 {verdict!r} (許可: {sorted(VALID)})"]

    # --- ポリシー1: ★識別IDずれは自動で対象外へ落とす ---
    if STAR_ID_SHIFT_RE.match(req["要求文"].strip()) and req["区分"] == "機能仕様":
        if verdict != "OUT_OF_SCOPE":
            v["判定"] = verdict = "OUT_OF_SCOPE"
            v["判定根拠"] = ("[policy] カスタマイズ説明の★識別IDずれは指摘対象外（利用者指示 2026-08-19）。"
                           "追加すべき列は項目表側の識別IDで決まり、実装は追随済み。"
                           + (v.get("判定根拠") or ""))

    # --- ゲート5: シートまるごと対象外（標準機能／シート単位の廃止・Ph2） ---
    reason = sheet_exclusion_reason(req.get("書番", ""), req.get("シート", ""))
    if reason and verdict != "OUT_OF_SCOPE":
        v["判定"] = verdict = "OUT_OF_SCOPE"
        v["判定根拠"] = f"[gate5] {reason}。" + (v.get("判定根拠") or "")

    # --- ゲート1: Ph2・廃止は機械で対象外へ落とす（利用者決定 2026-08-22） ---
    # 規約（AUDIT_SCOPE）で既に対象外と決まっているものをエージェントに判定させない。
    # 判定の機会が増えるほど誤判定の機会も増えるため。落とすのは確実なものだけ。
    reason = scoped_out_reason(req)
    if reason and verdict != "OUT_OF_SCOPE":
        v["判定"] = verdict = "OUT_OF_SCOPE"
        v["判定根拠"] = f"[gate1] {reason}。" + (v.get("判定根拠") or "")

    # --- ゲート2: 見出し・表のヘッダ・表紙は機械で対象外へ落とす ---
    reason = non_requirement_reason(req.get("要求文", ""))
    if reason and verdict != "OUT_OF_SCOPE":
        v["判定"] = verdict = "OUT_OF_SCOPE"
        v["判定根拠"] = f"[gate2] {reason}。" + (v.get("判定根拠") or "")

    quote = (v.get("設計根拠_引用") or "").strip()
    if verdict in QUOTE_REQUIRED:
        if not quote:
            errors.append(f"{rid}: {verdict} には 設計根拠_引用 が必須")
        elif norm(quote) not in sheets.norm_text(req["シート"]):
            errors.append(f"{rid}: 引用が {req['シート']} 本文に存在しない（捏造ゲート）: {quote[:60]!r}")
    if verdict in FINDING:
        # --- ゲート4: 断片行だけを根拠に指摘を立てない（利用者指摘 2026-08-22） ---
        # Excel設計書は1つの仕様を複数行・同一行の別セルに分けて書く。表のセル片や
        # ★見出しだけを引用して指摘を立てると、但し書き（「エンハンスで対応済み」等）を
        # 読み落とした誤指摘になる。引用は文として読める単位を要求する。
        if quote and len(norm(quote)) < MIN_QUOTE_CHARS:
            errors.append(
                f"{rid}: 設計根拠_引用が短すぎる（{len(norm(quote))}字 < {MIN_QUOTE_CHARS}字）。"
                "表のセル片や見出しだけを根拠にしない。同ブロックの行や同一行の他セルを"
                "含めて、文として読める単位で引用すること")
        if quote and _FRAGMENT_RE.match(quote.strip()):
            errors.append(
                f"{rid}: 設計根拠_引用が見出し・セル片（{quote.strip()[:24]!r}）。"
                "その見出しが説明している本体を引用すること")
        # --- ポリシー3: I/O かふるまいかの明示を必須にする ---
        kind = (v.get("乖離種別") or "").strip()
        if kind not in DRIFT_KINDS:
            errors.append(f"{rid}: 乖離種別は {sorted(DRIFT_KINDS)} のいずれか"
                          "（実装違いは I/O とふるまいに限る）")
        # --- ポリシー2: 設計期待値を実装手段の語で書かない ---
        hit = IMPL_MEANS_RE.search(v.get("設計期待値") or "")
        if hit:
            errors.append(f"{rid}: 設計期待値が実装手段の語で書かれている（{hit.group(0)!r}）。"
                          "結果・ふるまいの言葉へ書き直すか、指摘を取り下げること")
        impl = (v.get("実装参照") or "").strip()
        if not impl:
            errors.append(f"{rid}: {verdict} には 実装参照 が必須（不在なら探索したファイルを書く）")
        else:
            bad = verify_impl_ref(impl)
            if bad:
                errors.append(f"{rid}: 実装参照が実在しない: {', '.join(bad)}")
        if (v.get("重要度") or "").strip() not in SEVERITY_LEVELS:
            errors.append(f"{rid}: 重要度は {'/'.join(SEVERITY_LEVELS)}")
        if (v.get("指摘区分") or "").strip() not in ("未実装", "実装違い"):
            errors.append(f"{rid}: 指摘区分は 未実装/実装違い")
        if not (v.get("設計期待値") or "").strip():
            errors.append(f"{rid}: 設計期待値 が空")
        if not (v.get("実装実態") or "").strip():
            errors.append(f"{rid}: 実装実態 が空")
        if not (v.get("根本原因") or "").strip():
            errors.append(f"{rid}: 根本原因 が空（同じ実装欠陥から出た指摘には同じキーを書く。"
                          "1つの欠陥を要求の数だけ指摘に割らないこと）")
    if verdict == "MATCHED":
        # 実装のどこを見て「設計どおり」と判断したのかを、実在するファイル:行で必ず示させる。
        refs = inline_impl_refs(v.get("判定根拠", "")) + inline_impl_refs(v.get("実装参照", ""))
        if not refs:
            errors.append(f"{rid}: MATCHED には実装の位置（例 src/Eccube/...php:123）を"
                          "判定根拠か実装参照に最低1つ書くこと")
        else:
            bad = verify_impl_ref(";".join(refs))
            if bad:
                errors.append(f"{rid}: 判定根拠の実装引用が実在しない: {', '.join(bad)}")
    if not (v.get("判定根拠") or "").strip():
        errors.append(f"{rid}: 判定根拠 が空")
    if (v.get("確信度") or "").strip() not in ("high", "med", "low"):
        errors.append(f"{rid}: 確信度は high/med/low")
    return errors


def cmd_build(doc_key: str, partial: bool = False) -> None:
    outdir = AUDIT_DIR / doc_key
    req_path, ver_path = outdir / "requirements.tsv", outdir / "verdicts.tsv"
    if not req_path.is_file():
        raise RuntimeError(f"先に inventory を実行すること: {req_path} が無い")
    if not ver_path.is_file():
        raise RuntimeError(f"判定TSVが無い: {ver_path}")

    with req_path.open(encoding="utf-8") as fh:
        reqs = {r["要求ID"]: r for r in csv.DictReader(fh, delimiter="\t")}
    with ver_path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        missing = [c for c in VERDICT_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise RuntimeError(f"verdicts.tsv の列不足: {missing}")
        verdicts = list(reader)

    sheets = Sheets(doc_key)
    errors: list[str] = []
    seen: set[str] = set()
    policy_star = 0
    for v in verdicts:
        rid = (v.get("要求ID") or "").strip()
        if rid not in reqs:
            errors.append(f"{rid}: requirements.tsv に無い要求ID")
            continue
        if rid in seen:
            errors.append(f"{rid}: 重複行")
        seen.add(rid)
        before = v.get("判定")
        errors.extend(validate_verdict(v, reqs[rid], sheets))
        if before != v.get("判定"):
            policy_star += 1

    unjudged = sorted(set(reqs) - seen)
    if unjudged and not partial:
        errors.append(f"判定漏れ {len(unjudged)}件（全要求に判定が要る）: {unjudged[:20]}"
                      + (" ..." if len(unjudged) > 20 else ""))
    if unjudged and partial:
        # --partial: 完全性だけ警告に落とす。捏造ゲート・実装参照の実在チェックはそのまま効かせる。
        print(f"[partial] 未判定 {len(unjudged)}件を残したまま途中経過を出力する")
    if errors:
        raise RuntimeError("監査ゲート違反 %d件:\n  - %s" % (len(errors), "\n  - ".join(errors)))

    if policy_star:
        print(f"[policy] ★識別IDずれ {policy_star}件を自動で対象外にした")

    head = impl_head()
    # TSV の列は利用者指示（2026-08-20）で絞る。
    # HTML行・要求文・実装参照・画像確認メモ・確信度・重複要求ID・ee_HEAD は出力しない
    # 設計要件 列は verdicts.tsv の 設計期待値 をそのまま出す（利用者指示 2026-08-21）
    # （いずれも AUDIT_*.md と design_audit/<doc>/verdicts.tsv には残る）。
    # 判定（未実装／実装違い）と 指摘区分 は同じ値になるため、判定だけを残す
    outcols = ["要求ID", "シート名", "区分",
               "判定", "重要度", "乖離種別", "設計要件", "実装実態", "判定根拠"]
    # 掲載しないもの: 実装実態が空欄 / 区分が「表示メッセージ」（いずれも利用者指示 2026-08-20）
    reported_all = [v for v in verdicts
                    if v["判定"] in REPORTED and (v.get("実装実態") or "").strip()
                    and reqs[v["要求ID"]]["区分"] != "表示メッセージ"]
    no_actual = [v for v in verdicts
                 if v["判定"] in REPORTED and not (v.get("実装実態") or "").strip()]
    msg_excluded = [v for v in verdicts
                    if v["判定"] in REPORTED and (v.get("実装実態") or "").strip()
                    and reqs[v["要求ID"]]["区分"] == "表示メッセージ"]
    reported, folded, folded_count = dedupe_by_impl_actual(reported_all, reqs)
    tsv_out = ROOT / f"AUDIT_{doc_key}.tsv"
    with tsv_out.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=outcols, delimiter="\t", lineterminator="\n")
        w.writeheader()
        for v in sorted(reported, key=lambda x: x["要求ID"]):
            r = reqs[v["要求ID"]]
            row = dict(v)
            row.update({"判定": VERDICT_JA.get(v["判定"], v["判定"]),
                        "設計要件": v.get("設計期待値", ""),
                        "要求ID": v["要求ID"], "シート": r["シート"], "シート名": r["シート名"],
                        "区分": r["区分"], "HTML行": r["HTML行"], "要求文": r["要求文"],
                        "重複要求ID": ";".join(folded.get(v["要求ID"], [])),
                        "ee_HEAD": head})
            w.writerow({c: row.get(c, "") for c in outcols})

    md_out = ROOT / f"AUDIT_{doc_key}.md"
    write_markdown(md_out, doc_key, sheets, reqs, verdicts, head, unjudged=len(unjudged),
                   folded=folded, folded_count=folded_count, no_actual=len(no_actual),
                   msg_excluded=len(msg_excluded))
    print(f"build 完了: {tsv_out}\n           {md_out}")
    print(f"  判定済 {len(verdicts)}要求 / 成果物に載せた指摘 {len(reported)}件"
          f"（実装実態が同一の {folded_count}件は重複として代表へ折り畳み、"
          f"実装実態が空欄の {len(no_actual)}件と区分「表示メッセージ」の {len(msg_excluded)}件は掲載しない。"
          f"MATCHED・OUT_OF_SCOPE・UNVERIFIABLE も利用者指示により出力しない）")


def write_markdown(path: Path, doc_key: str, sheets: Sheets, reqs: dict,
                   verdicts: list[dict], head: str, unjudged: int = 0,
                   folded: dict[str, list[str]] | None = None, folded_count: int = 0,
                   no_actual: int = 0, msg_excluded: int = 0) -> None:
    """成果物は指摘（DRIFT / NOT_IMPLEMENTED / DESIGN_ISSUE）だけを載せる。

    MATCHED・OUT_OF_SCOPE・UNVERIFIABLE は利用者指示により出力しない。ただし
    「何件を判定した結果その指摘に絞られたか」が分からないと網羅性を確認できないため、
    母数と内訳件数だけはサマリに残す。
    """
    counts: dict[str, int] = {}
    for v in verdicts:
        counts[v["判定"]] = counts.get(v["判定"], 0) + 1
    folded = folded or {}
    folded_ids = {i for ids in folded.values() for i in ids}
    findings = [v for v in verdicts
                if v["判定"] in ("DRIFT", "NOT_IMPLEMENTED")
                and v["要求ID"] not in folded_ids
                and (v.get("実装実態") or "").strip()
                and reqs[v["要求ID"]]["区分"] != "表示メッセージ"]
    findings.sort(key=lambda v: (SEVERITY_ORDER.get(v.get("重要度", ""), 9), v["要求ID"]))

    A: list[str] = []
    a = A.append
    a(f"# 実装乖離監査 — {sheets.book.name}")
    a("")
    a(f"- 正本: `excel_to_html/output/{sheets.book.name}`（HTML設計書。**これだけを正とする**）")
    a(f"- 実装: `ec-cube-enterprise` HEAD `{head}`")
    a(f"- 母数: 正本HTMLから機械抽出した **{len(reqs)}要求**（既存の指摘一覧は参照していない）")
    if unjudged:
        a(f"- **⚠ 途中経過。未判定 {unjudged}要求が残っている**"
          f"（判定済 {len(verdicts)} / {len(reqs)}、{len(verdicts) * 100 // len(reqs)}%）。"
          "未着手のシートからは指摘が出ていないだけで、無いとは限らない")
    a("- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。"
      "HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、"
      "不一致・判定漏れがあれば build を落とす）")
    a("- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・"
      "静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない")
    a("- 指摘ポリシー（harness が機械で強制）: "
      "①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす "
      "③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする "
      "④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） "
      "⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない")
    a("")
    a("## 母数の内訳")
    a("")
    a("| 判定 | 意味 | 件数 | 掲載 |")
    a("| --- | --- | ---: | :---: |")
    meaning = [
        ("NOT_IMPLEMENTED", "設計の要求に対応する実装が無い", "○"),
        ("DRIFT", "実装はあるが設計と違う", "○"),
        ("DESIGN_ISSUE", "正本内部で記述が矛盾し設計裁定待ち", "—"),
        ("MATCHED", "設計どおり実装されている", "—"),
        ("OUT_OF_SCOPE", "見出し・表示メッセージ節など実装対象の記述でない", "—"),
        ("UNVERIFIABLE", "実データ・実行時挙動に依存し静的解析では確定できない", "—"),
    ]
    for k, m, shown in meaning:
        a(f"| {VERDICT_JA.get(k, k)} | {m} | {counts.get(k, 0)} | {shown} |")
    a(f"| **合計** | | **{len(verdicts)}** | |")
    a("")
    sev: dict[str, int] = {}
    for f in findings:
        sev[f["重要度"]] = sev.get(f["重要度"], 0) + 1
    a(f"## 不具合 {len(findings)}件"
      f"（P1 {sev.get('P1', 0)} / P2 {sev.get('P2', 0)} / P3 {sev.get('P3', 0)}）")
    a("")
    a("- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない")
    a("- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、"
      "コア業務の正しさ・効率、または顧客体験を損なう")
    a("- **P3**: 業務は回る。業務の完了・データ・判断に影響しない"
      "（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）")
    a("")
    if folded_count:
        a(f"実装実態が同一の指摘 {folded_count}件は重複として代表へ折り畳んだ"
          f"（判定そのものは {len(findings) + folded_count}件。折り畳んだ要求IDは各指摘の"
          "「同じ実装実態でまとまる要求」に全件を書く）。")
        a("")
    if findings:
        a("| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |")
        a("| --- | --- | --- | --- | --- | --- |")
        for f in findings:
            r = reqs[f["要求ID"]]
            summ = (f.get("設計期待値") or "").replace("|", "／").replace("\n", " ")
            a(f"| {f['要求ID']} | {r['シート名']} | {f.get('指摘区分','')} | "
              f"{f.get('乖離種別','')} | {f.get('重要度','')} | {summ[:100]} |")
        a("")
        for f in findings:
            r = reqs[f["要求ID"]]
            a(f"### {f['要求ID']} {r['シート名']} — {f.get('指摘区分','')}／{f.get('乖離種別','')}／{f.get('重要度','')}")
            a("")
            a(f"- 正本: {r['シート']}（{r['シート名']}） HTML行 {r['HTML行']} 付近")
            a(f"- 正本引用: 「{f.get('設計根拠_引用','')}」")
            a(f"- 設計期待値: {f.get('設計期待値','')}")
            if f.get("画像確認メモ"):
                a(f"- 画像確認: {f['画像確認メモ']}")
            a(f"- 実装参照: `{f.get('実装参照','')}`")
            a(f"- 実装実態: {f.get('実装実態','')}")
            if folded.get(f["要求ID"]):
                by_id = {v["要求ID"]: v for v in verdicts}
                parts = []
                for i in folded[f["要求ID"]]:
                    ref = (by_id.get(i, {}).get("実装参照") or "").strip()
                    label = f"{i}（{reqs[i]['シート名']}"
                    if ref and ref != (f.get("実装参照") or "").strip():
                        label += f" / 実装参照 `{ref}`"
                    parts.append(label + "）")
                a(f"- 同じ実装実態でまとまる要求: {'、'.join(parts)}")
            a(f"- 判定根拠: {f.get('判定根拠','')}")
            a(f"- 確信度: {f.get('確信度','')}")
            a("")

    if no_actual or msg_excluded:
        a("## 掲載しなかった判定")
        a("")
        if no_actual:
            a(f"- 実装実態が空欄の判定 {no_actual}件（正本内部の記述が食い違い、実装と突き合わせる前に"
              "設計裁定が要るもの）")
        if msg_excluded:
            a(f"- 区分が「表示メッセージ」の指摘 {msg_excluded}件")
        a("")
        a("いずれも利用者指示により本書に載せない。判定そのものは "
          f"`design_audit/{doc_key}/verdicts.tsv` に残している。")
        a("")

    a("## シート別の網羅状況")
    a("")
    a("判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている"
      "（掲載件数は「不具合」の節を見ること）。")
    a("")
    a("| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |")
    a("| --- | --- | ---: | ---: | ---: | ---: | ---: |")
    by_sheet: dict[str, list[dict]] = {}
    for v in verdicts:
        by_sheet.setdefault(reqs[v["要求ID"]]["シート"], []).append(v)
    for sid in sorted(by_sheet, key=lambda x: int(x.split("-")[1])):
        rows = by_sheet[sid]
        c = {k: sum(1 for x in rows if x["判定"] == k) for k in VALID}
        a(f"| {sid} | {reqs[rows[0]['要求ID']]['シート名']} | {len(rows)} | "
          f"{c['NOT_IMPLEMENTED']} | {c['DRIFT']} | {c['DESIGN_ISSUE']} | "
          f"{c['MATCHED'] + c['OUT_OF_SCOPE'] + c['UNVERIFIABLE']} |")
    a("")
    path.write_text("\n".join(A) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["inventory", "build"])
    ap.add_argument("--doc", required=True)
    ap.add_argument("--partial", action="store_true",
                    help="未判定を残したまま途中経過を出力する（捏造ゲートは効かせる）")
    args = ap.parse_args()
    if args.command == "inventory":
        cmd_inventory(args.doc)
    else:
        cmd_build(args.doc, partial=args.partial)


if __name__ == "__main__":
    main()
