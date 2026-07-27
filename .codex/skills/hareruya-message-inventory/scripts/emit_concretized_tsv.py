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
            if dstat == "bound" and cref in cases:
                c = cases[cref]
                row[6], row[7], row[8], row[9], row[10] = c["前提"], c["入力"], c["操作"], c["期待"], c["method"]
                n_bound += 1; is_exec = True
            elif dstat == "bound":
                row[9] = f"{yoshi}（[候補§4対応 C-{cref} 参照]）" if cref else yoshi
                n_bound += 1; is_exec = True
            elif dstat in ("TBD", "要ソース確認"):
                row[9] = f"【TBD】{yoshi}（一次資料で一意判定不能=要ソース確認/要実機。候補§9参照）"
                row[10] = "保留(TBD)"; n_tbd += 1
            elif dstat in ("excluded", "DELEG"):
                tag = "対象外(DELEG=別導線)" if dstat == "DELEG" else "対象外(excluded)"
                row[9] = f"【{tag}】{yoshi}（候補§8/§9参照）"
                row[10] = tag; n_excl += 1
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
