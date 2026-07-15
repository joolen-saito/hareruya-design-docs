#!/usr/bin/env python3
"""全機能バッチ再生成 — 結合テスト再生成パイプライン Phase3-4 の一括実行。

各 *_it_cases.md が宣言する正本HTML（『元設計:』/『正本:』行）を使い、
generate_cases で土台TSVを生成 → gate_check で捏造ゼロ・ゲート機械検査。
出力: integration_test/_generated/<fid>.md と _SUMMARY.md。
"""
from __future__ import annotations
import glob, re, sys, traceback
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cases as gc
import gate_check as gk

OUTDIR = Path("integration_test/_generated")
INV = Path("endpoint_reports/function_dependency_inventory.tsv")
HTML_ROOT = "function_spec_html_preview"


def html_of_itcase(it_path: Path):
    txt = it_path.read_text(encoding="utf-8")
    m = re.search(r"(?:元設計|正本)[^`]*`([^`]+\.html)`", txt)
    if m:
        p = Path(m.group(1))
        if p.exists():
            return p
    # fallback: fid一致
    fm = re.match(r"([a-z0-9]+)(\d+)_(\d+)_", it_path.name)
    if not fm:
        return None
    fid = f"{fm.group(1)}{fm.group(2)}-{fm.group(3)}"
    for h in glob.glob(f"{HTML_ROOT}/**/*.html", recursive=True):
        hm = re.match(r"([a-z0-9]+)-(\d+)_", Path(h).name)
        if hm and f"{hm.group(1)}-{hm.group(2)}" == fid:
            return Path(h)
    return None


def main():
    OUTDIR.mkdir(exist_ok=True)
    its = sorted(glob.glob("integration_test/*_it_cases.md"))
    total = gen_ok = gate_pass = no_html = err = 0
    agg = Counter()
    exec_total = 0
    rows = []
    for it in its:
        it_p = Path(it)
        total += 1
        hp = html_of_itcase(it_p)
        fid = re.sub(r"_it_cases\.md$", "", it_p.name)
        if not hp:
            no_html += 1
            rows.append((fid, "HTML無し", "-", "-"))
            continue
        try:
            md = gc.generate(hp, it_p, INV)
            outp = OUTDIR / (re.match(r"([a-z0-9]+\d+_\d+)", it_p.name).group(1) + ".md")
            outp.write_text(md, encoding="utf-8")
            gen_ok += 1
            gk.__dict__  # ensure imported
            viol = gk.run(outp, str(hp))
            hard = [v for v in viol if v["gate"] in gk.HARD]
            gp = "OK" if not hard else f"ハード{len(hard)}"
            if not hard:
                gate_pass += 1
            # サマリ集計
            m = re.search(r"実施=(\d+)", md)
            exec_n = int(m.group(1)) if m else 0
            exec_total += exec_n
            for code, cnt in re.findall(r"([A-Z][A-Za-z:_\-+]+|要判定):(\d+)", md.split("§5")[-1]):
                agg[code] += int(cnt)
            rows.append((fid, "生成", exec_n, gp))
        except Exception as e:
            err += 1
            rows.append((fid, f"ERROR {type(e).__name__}", "-", "-"))
            traceback.print_exc(file=sys.stderr)

    # サマリ出力
    lines = ["# 全機能バッチ再生成 サマリ\n",
             f"- 母集合it_cases: {total}",
             f"- 生成成功: {gen_ok}（HTML無し {no_html} / エラー {err}）",
             f"- 機械ゲート通過: {gate_pass} / {gen_ok}",
             f"- 生成実施ケース総数: {exec_total}",
             f"- 判定コード集計: " + " ".join(f"{k}:{v}" for k, v in agg.most_common()),
             "\n| fid | 状態 | 実施 | ゲート |", "|---|---|---:|---|"]
    for fid, st, ex, gp in rows:
        lines.append(f"| {fid} | {st} | {ex} | {gp} |")
    (OUTDIR / "_SUMMARY.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"母集合={total} 生成成功={gen_ok} HTML無し={no_html} エラー={err}")
    print(f"機械ゲート通過={gate_pass}/{gen_ok}  生成実施ケース総数={exec_total}")
    print("判定コード集計:", dict(agg.most_common()))
    print(f"→ {OUTDIR}/_SUMMARY.md と各 <fid>.md を出力")


if __name__ == "__main__":
    main()
