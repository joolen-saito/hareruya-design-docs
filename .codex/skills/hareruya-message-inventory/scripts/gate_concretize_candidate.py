#!/usr/bin/env python3
"""ケース具体化候補の決定的品質ゲート(Gate A)。codexレビュー前に必ず実行し、exit1で停止。

M03-01(codex 8周)の反省から、codex前に機械検査で潰せる既知クラスを前段ゲート化する。
対象: integration_test/e2e/exec/_drafts/<fid>_*_executable_draft.md ＋
      e2e/fixtures/oracle/_drafts/<fid>_*_oracle_draft.json

検査(いずれかNGでexit1):
  G1 JSON妥当＋L1 claim数が md§1表の行数と一致
  G2 source_class純度: oracle値が excel/pf-fallback 始まりのみ(standard-src/design/implementation禁止)
  G3 md↔oracle整合: L1 id集合が一致・source_class文字列が全件一致
  G4 _drafts隔離: 当fidのoracle/draftが _drafts/ 以外(正式パス)に存在しない
  G5 母集合会計: 宣言合計(bound+TBD+excluded)=母集合件数N、かつ draftが -001..-N を全言及(欠番0)
  G6 stale-ref: TBD/excluded に分類した -NNN が §7 実行対象(Playwright/非UI列挙)に残存しない
  G7 逐語(best-effort): 各oracle claimの source の file:line のファイルが実在

使い方: python3 gate_concretize_candidate.py --fid m03-02
"""
from __future__ import annotations

import argparse
import glob
import json
import re
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
DEV = ROOT.parent  # 根拠パス 'ec-cube-enterprise/...' の親
DRAFT_DIR = ROOT / "integration_test/e2e/exec/_drafts"
ORACLE_DIR = ROOT / "e2e/fixtures/oracle/_drafts"
ALL_IT = ROOT / "integration_test/all_it_cases.tsv"


def find_one(base: Path, fid: str, suffix: str) -> Path | None:
    hits = sorted(base.glob(f"{fid.lower()}_*{suffix}"))
    return hits[0] if hits else None


def population_n(fid: str) -> int:
    """all_it_cases.tsv の テストID接頭 IT-<FID>- 件数。"""
    pref = f"IT-{fid.upper()}-"
    n = 0
    with ALL_IT.open(encoding="utf-8") as fh:
        for line in fh:
            if pref in line:
                n += 1
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid", required=True)
    args = ap.parse_args()
    fid = args.fid
    fails: list[str] = []
    warns: list[str] = []

    draft = find_one(DRAFT_DIR, fid, "_executable_draft.md")
    oracle = find_one(ORACLE_DIR, fid, "_oracle_draft.json")
    if not draft:
        print(f"NG: draft 未検出 ({fid})")
        return 1
    if not oracle:
        print(f"NG: oracle 未検出 ({fid})")
        return 1
    dtext = draft.read_text(encoding="utf-8")

    # G1 JSON妥当＋claim数
    try:
        od = json.loads(oracle.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"NG G1: oracle JSON パース失敗: {e}")
        return 1
    o_ids = {k for k in od if k.startswith("L1")}
    md_ids = set(re.findall(r"^\|\s*(L1-[A-Z0-9]+-\d{3})\s*\|", dtext, re.M))
    if len(o_ids) != len(md_ids):
        fails.append(f"G1 claim数不一致: md表={len(md_ids)} oracle={len(o_ids)}")

    # G2 source_class純度
    ALLOWED = ("excel", "pf-fallback")
    bad_sc = []
    for k in o_ids:
        sc = (od[k].get("source_class") or "")
        if not any(sc.startswith(a) for a in ALLOWED):
            bad_sc.append((k, sc))
    if bad_sc:
        fails.append(f"G2 禁止source_class {len(bad_sc)}件: {bad_sc[:3]}")

    # G3 md↔oracle整合(id集合＋source_class文字列)
    if o_ids != md_ids:
        fails.append(f"G3 id集合不一致: md-only={sorted(md_ids-o_ids)[:3]} oracle-only={sorted(o_ids-md_ids)[:3]}")
    else:
        # md表の source_class 列(最後から2番目)を取り、oracleと突合
        md_sc = {}
        for line in dtext.splitlines():
            m = re.match(r"^\|\s*(L1-[A-Z0-9]+-\d{3})\s*\|", line)
            if m:
                cells = [c.strip() for c in line.split("|")]
                if len(cells) >= 8:
                    md_sc[m.group(1)] = cells[-3]
        mism = [(k, md_sc.get(k), od[k].get("source_class")) for k in o_ids
                if md_sc.get(k) != od[k].get("source_class")]
        if mism:
            fails.append(f"G3 source_class文字列不一致 {len(mism)}件: {mism[:2]}")

    # G4 _drafts隔離(正式パスに当fidの成果物が無い)
    formal = glob.glob(str(ROOT / f"e2e/fixtures/oracle/{fid.lower()}_*.json"))
    formal += glob.glob(str(ROOT / f"integration_test/e2e/exec/tsv/{fid.lower()}_*.tsv"))
    if formal:
        fails.append(f"G4 正式パス混入: {formal[:2]}")

    # G5 母集合会計
    N = population_n(fid)
    m = re.search(r"bound\s*(\d+)\s*[／/]\s*TBD\s*(\d+)\s*[／/]\s*excluded\s*(\d+)", dtext)
    if not m:
        m = re.search(r"bound\s*(\d+).{0,4}TBD\s*(\d+).{0,4}excluded\s*(\d+)", dtext)
    if not m:
        warns.append("G5 宣言会計(bound/TBD/excluded)を本文から抽出できず(書式要確認)")
    else:
        b, t, e = map(int, m.groups())
        if b + t + e != N:
            fails.append(f"G5 会計合計≠母集合: bound{b}+TBD{t}+excluded{e}={b+t+e} != N={N}")
    refs = set(re.findall(r"-(\d{3})\b", dtext))
    missing = [f"{i:03d}" for i in range(1, N + 1) if f"{i:03d}" not in refs]
    if missing:
        fails.append(f"G5 母集合欠番(本文未言及) {len(missing)}件: {missing[:8]}")

    # G6 stale-ref: TBD/excluded番号が §7 実行対象に残存しないか
    def section(title_re):
        lines = dtext.splitlines()
        s = next((i for i, l in enumerate(lines) if re.match(title_re, l)), None)
        if s is None:
            return ""
        e = next((i for i in range(s + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
        return "\n".join(lines[s:e])
    sec7 = section(r"^##\s*§?7")
    # TBD/excluded番号を §8/§9 の TBD・excluded 記述から収集
    tbd_excl = set()
    for line in dtext.splitlines():
        if re.search(r"(TBD|excluded|DELEG|要ソース確認)", line):
            tbd_excl |= set(re.findall(r"-(\d{3})\b", line))
    # §7 の Playwright/非UI 実行対象列挙(「(GUI):」「(db.ts):」行)にTBD/excl番号が出るか
    exec_nums = set()
    for line in sec7.splitlines():
        if re.search(r"(Playwright|非UI|db\.ts|実行対象)", line):
            exec_nums |= set(re.findall(r"[/CE\-](\d{3})\b", line))
    stale = sorted(exec_nums & tbd_excl)
    if stale:
        warns.append(f"G6 §7実行対象にTBD/excl番号が残存の可能性 {stale[:8]}（要目視: bound側の同番号と重複しうる）")

    # G7 逐語(best-effort): source の file:line のファイル実在
    miss_files = set()
    for k in o_ids:
        src = str(od[k].get("source", ""))
        for fp in re.findall(r"([A-Za-z0-9_./\-]+\.(?:md|yaml|xlf|html|php|twig))", src):
            cand = [ROOT / fp, DEV / fp]
            if not any(c.exists() for c in cand):
                miss_files.add(fp)
    if miss_files:
        warns.append(f"G7 source file実在せず {len(miss_files)}件: {sorted(miss_files)[:3]}")

    # 出力
    print(f"=== Gate A: {fid} (母集合N={N}, L1={len(o_ids)}) ===")
    for w in warns:
        print("  WARN:", w)
    if fails:
        for f in fails:
            print("  NG:", f)
        print(f"Gate A: FAIL ({len(fails)}件)")
        return 1
    print("Gate A: PASS" + (f"（WARN {len(warns)}件は要目視）" if warns else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
