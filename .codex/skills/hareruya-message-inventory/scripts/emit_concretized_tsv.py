#!/usr/bin/env python3
"""候補md(§4具体化ケース＋§8会計)から、母集合 all_it_cases.tsv と同一テンプレート(11列)の
concretized.tsv を出力する。

出力: integration_test/e2e/exec/tsv/<fid>_<slug>_concretized.tsv
- 列は all_it_cases.tsv と同一: 機能名/テストID/I/FID/テスト観点/優先度/テスト項目名/
  前提条件/入力データ/リクエスト内容/操作手順/実行方法/期待結果／レスポンス/実行方法
- 各母集合行(テストID=IT-<FID>-...-NNN)を保持し、§8の会計に従い:
    bound  → §7-10(前提/入力/手順/期待)を対応§4ケースの具体値へ差し替え・実行方法を精緻化・[L1:..]付与
    TBD    → 期待に「【TBD】理由」、実行方法「保留(TBD)」
    excluded → 期待に「【対象外(excluded)】理由」、実行方法「対象外(excluded)」
母集合のテストID・機能名・I/FID・観点・優先度・項目名は原則保持（監査追跡性）。

使い方: python3 emit_concretized_tsv.py --fid m03-02
"""
from __future__ import annotations

import argparse
import csv
import glob
import re
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
DRAFT_DIR = ROOT / "integration_test/e2e/exec/_drafts"
OUT_DIR = ROOT / "integration_test/e2e/exec/tsv"
ALL_IT = ROOT / "integration_test/all_it_cases.tsv"
COLS = ["機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
        "前提条件", "入力データ/リクエスト内容", "操作手順/実行方法", "期待結果／レスポンス", "実行方法"]


def load_all_it(fid: str):
    """母集合の <fid> 行を テストID末尾NNN→(11列list) で返す。"""
    pref = f"IT-{fid.upper()}-"
    out = {}
    with ALL_IT.open(encoding="utf-8", newline="") as fh:
        r = csv.reader(fh, delimiter="\t")
        header = next(r)
        idx = {c: i for i, c in enumerate(header)}
        for row in r:
            tid = row[idx["テストID"]]
            if tid.startswith(pref):
                m = re.search(r"-(\d{3})$", tid)
                if m:
                    out[m.group(1)] = [row[idx[c]] if idx.get(c) is not None and idx[c] < len(row) else "" for c in COLS]
    return out


def _norm_cell(s: str) -> str:
    return s.replace("*", "").strip()


def _expand_nums(text: str) -> list[str]:
    """'-019〜-032' や '-073,-074' や '-078' 混在から NNN リストを展開。"""
    out = set()
    # 範囲 -NNN〜-MMM / -NNN～-MMM
    for a, b in re.findall(r"-(\d{3})\s*[〜～]\s*-?(\d{3})", text):
        for i in range(int(a), int(b) + 1):
            out.add(f"{i:03d}")
    # 単体 -NNN（範囲で消費済みも含め全部拾って良い）
    for n in re.findall(r"-(\d{3})\b", text):
        out.add(n)
    return sorted(out)


def parse_section8(dtext: str):
    """§8: 会計サマリ(範囲/列挙のTBD・excluded)＋対応表(per-row bound)を統合。
    NNN → (disposition, cref, 要旨)。per-rowを優先。"""
    disp = {}
    # 1) サマリ行: | **TBD** | 3 | -073,-074（…）／-078（…） |  等
    for line in dtext.splitlines():
        m = re.match(r"^\|\s*\**\s*(TBD|excluded|DELEG)\s*\**\s*\|\s*\**\d+\**\s*\|\s*(.*?)\s*\|\s*$", line)
        if m:
            d, body = m.group(1), m.group(2)
            for nnn in _expand_nums(body):
                disp.setdefault(nnn, (d, "", body[:80]))
    # 2) per-row対応表: | NNN | 要旨 | 会計(bold可) | C-ref |
    for line in dtext.splitlines():
        m = re.match(r"^\|\s*(\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$", line)
        if not m:
            continue
        nnn, yoshi, dcell, cref = m.group(1), m.group(2), _norm_cell(m.group(3)), m.group(4)
        dm = re.match(r"(bound|TBD|excluded|DELEG|要ソース確認)", dcell)
        if not dm:
            continue
        cm = re.search(r"C-(\d{3}[A-Z]?)", cref)
        disp[nnn] = (dm.group(1), cm.group(1) if cm else "", yoshi)  # per-row優先
    return disp


def parse_seed_map(dtext: str) -> dict:
    """§2 SEED三段参照表: | SEED-XXX | 内容 | 用途 | → SEED-XXX→短い人間向けラベル。"""
    m = {}
    for line in dtext.splitlines():
        row = re.match(r"^\|\s*(SEED-[A-Z0-9\-]+)\s*\|\s*(.+?)\s*\|", line)
        if row:
            code, desc = row.group(1), row.group(2)
            # 内容の先頭句（最初の「・」「。」まで・括弧のidは残す）を短ラベルに
            short = re.split(r"[・。]", desc)[0].strip().strip("`")
            m[code] = short or code
    # 汎用
    m.setdefault("SEED-M01-ADMIN", "管理者でログイン済み")
    return m


def humanize(text: str, seed: dict) -> str:
    """機械タグ・内部コードを人間可読の自然文へ。内容(意味)は変えない。"""
    if not text or text == "—":
        return text
    t = text
    # 追跡タグ除去（L1・fixture・候補§参照は正本md/oracle側に保持）
    t = re.sub(r"\s*\[L1:[^\]]*\]", "", t)
    t = re.sub(r"\s*\[候補§4対応[^\]]*\]", "", t)
    t = re.sub(r"\s*\(?（?候補§[0-9.．/／ ]*参照）?\)?", "", t)
    t = t.replace("@TBD-D5", "")
    t = re.sub(r"\s*fixture\s*:\s*", "", t)
    # SEEDコード→人間向けラベル
    for code, label in sorted(seed.items(), key=lambda x: -len(x[0])):
        t = t.replace(code, label)
    t = re.sub(r"SEED-[A-Z0-9\-]+", "所定の前提データ", t)  # 未定義SEEDの保険
    # URL/技術トークンの緩和
    t = t.replace("%eccube_admin_route%", "管理画面ルート").replace("/%eccube_admin_route%", "/管理画面ルート")
    t = re.sub(r"GET\s+", "", t)  # 「GET …/edit を開く」→「…/edit を開く」
    t = t.replace("…/", "管理画面の /").replace("…", "")  # 省略記号を可読化
    # 手順の「1. … 2. …」区切りを読点/改行で自然に
    t = re.sub(r"\s*/\s*(?=\d\.)", "／", t)
    t = re.sub(r"\s{2,}", " ", t).strip("／ ").strip()
    return t or "—"


def tbd_reason(text: str) -> str:
    """TBD期待テキストから人の対応カテゴリを推定。"""
    if "観測" in text or "計装" in text or "通知" in text or "ログ" in text:
        return "観測手段が未整備（外部通知・ログ等）。計装/モック追加の要否を判断、または手動確認"
    if "実機" in text:
        return "稼働環境で実挙動を観測して期待値を確定"
    return "設計/発注者判断で仕様を確定（一次資料に一意な記載なし）"


def parse_section4(dtext: str, fid: str):
    """§4 14列TSV: E2E-<...>C-NNN → dict(前提/入力/手順/期待/観点/優先/項目/実行方法推定)。"""
    slug_key = f"{fid.lower()}_"
    cases = {}
    for line in dtext.splitlines():
        if not line.lstrip().startswith(slug_key):
            continue
        f = line.split("\t")
        if len(f) < 10:
            continue
        m = re.search(r"C-(\d{3}[A-Z]?)$", f[1].strip())
        if not m:
            continue
        pre, inp, ope, exp = f[6], f[7], f[8], f[9]
        # 実行方法推定
        blob = (inp + ope + exp).lower()
        if "db.ts" in blob or "dbで" in ope or "db.tsで" in ope:
            method = "Playwright+DB確認"
        elif "非ui" in blob or "直post" in blob or "request契約" in blob or "curl" in blob:
            method = "非UI"
        else:
            method = "Playwright"
        cases[m.group(1)] = {"前提": pre, "入力": inp, "操作": ope, "期待": exp, "method": method}
    return cases


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid", required=True)
    args = ap.parse_args()
    fid = args.fid

    dr = sorted(DRAFT_DIR.glob(f"{fid.lower()}_*_executable_draft.md"))
    if not dr:
        print(f"NG: draft 未検出 ({fid})")
        return 1
    draft = dr[0]
    dtext = draft.read_text(encoding="utf-8")
    slug = draft.name[:-len("_executable_draft.md")]  # <fid>_<...>

    pop = load_all_it(fid)
    disp = parse_section8(dtext)
    cases = parse_section4(dtext, fid)
    if not pop:
        print(f"NG: 母集合行なし (IT-{fid.upper()}-...)")
        return 1

    seedmap = parse_seed_map(dtext)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    n_bound = n_tbd = n_excl = n_raw = 0
    all_rows = []       # 全数(母集合1:1)
    exec_rows = []      # bound(実行可能)のみ
    for nnn in sorted(pop):
        row = list(pop[nnn])  # 11列(母集合原本)
        d = disp.get(nnn)
        is_exec = False
        if d is None:
            n_raw += 1
        else:
            dstat, cref, yoshi = d
            yoshi_h = humanize(yoshi, seedmap)
            if dstat == "bound":
                if cref in cases:
                    c = cases[cref]
                    row[6] = humanize(c["前提"], seedmap)
                    row[7] = humanize(c["入力"], seedmap)
                    row[8] = humanize(c["操作"], seedmap)
                    row[9] = humanize(c["期待"], seedmap)
                    row[10] = c["method"]
                else:
                    row[9] = yoshi_h  # §4対応が引けない(shared) → 要旨
                n_bound += 1; is_exec = True
            elif dstat in ("TBD", "要ソース確認"):
                row[6] = "—"
                row[7] = "—"
                row[8] = "自動判定はできない。下記の理由に従い、人が仕様確認または実機確認で期待値を確定する。"
                row[9] = f"【要確認】期待する挙動: {yoshi_h}。／ 人の対応: {tbd_reason(yoshi)}"
                row[10] = "保留(TBD)"; n_tbd += 1
            elif dstat in ("excluded", "DELEG"):
                if dstat == "DELEG":
                    tag, act = "対象外（別導線に委譲）", "実際の処理・DB更新は別機能の担当。当機能では画面側の表示のみ扱う。"
                else:
                    tag, act = "対象外（この機能に該当なし）", "母集合が観点テンプレートから機械生成した行で、当機能には該当機能がない。試験不要。"
                row[6] = "—"
                row[7] = "—"
                row[8] = "—"
                row[9] = f"【{tag}】{act}（該当観点: {row[3]}）"
                row[10] = "対象外"; n_excl += 1
        all_rows.append(row)
        if is_exec:
            exec_rows.append(row)

    # ★1:1 不変条件（ハードゲート）: concretized の テストID集合＝母集合と完全一致
    tid_i = COLS.index("テストID")
    cset = {r[tid_i] for r in all_rows}
    mset = {f"IT-{fid.upper()}-" for _ in [0]}  # プレースホルダ(下で実集合)
    mset = set()
    pref = f"IT-{fid.upper()}-"
    with ALL_IT.open(encoding="utf-8", newline="") as fh:
        rr = csv.reader(fh, delimiter="\t"); hh = {c: i for i, c in enumerate(next(rr))}
        for row in rr:
            t = row[hh["テストID"]]
            if t.startswith(pref):
                mset.add(t)
    if cset != mset or len(all_rows) != len(mset):
        print("NG 1:1不変条件違反: concretized テストID集合が母集合と不一致")
        print("  母集合のみ:", sorted(mset - cset)[:5], "／ concretizedのみ:", sorted(cset - mset)[:5],
              "／ 重複:", len(all_rows) - len(cset))
        return 1

    def write(path, rows):
        with path.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, delimiter="\t", lineterminator="\n")
            w.writerow(COLS)
            w.writerows(rows)

    full = OUT_DIR / f"{slug}_concretized.tsv"
    execp = OUT_DIR / f"{slug}_executable.tsv"
    write(full, all_rows)
    write(execp, exec_rows)
    print(f"出力(全数・母集合1:1): {full.relative_to(ROOT)}  {len(all_rows)}行")
    print(f"出力(bound実行可能のみ): {execp.relative_to(ROOT)}  {len(exec_rows)}行")
    print(f"  内訳: bound{n_bound} / TBD{n_tbd} / excluded・DELEG{n_excl} / 未分類{n_raw}")
    print("  1:1不変条件: PASS（母集合とテストID完全一致・追加/欠落/重複0）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
