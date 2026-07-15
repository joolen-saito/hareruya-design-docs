#!/usr/bin/env python3
"""再生成ジェネレータ — 結合テスト再生成パイプライン Phase3。

spec_parser（構造化）＋ judge_viewpoints（判定コード）から、
実施ケースTSV・DDTデータ表・SEED雛形・判定台帳・除外一覧を自動生成する。

捏造ゼロの担保（構造的）:
  - 各実施ケースの「期待結果」は、判定根拠の file:line が指す **正本の該当行テキスト（verbatim）** を充当する。
    ＝ 発明された期待値を出力しようがない（プロンプト合成をしない）。
  - `OUT`/`NO_IF`/`MERGE`/`要判定` は実施ケースにせず、根拠付きで台帳へ。
  - phase2/superseded は §0（テスト対象外）へ。

出力は Markdown（人手/LLM がプロンプト無しで prose を磨く土台）。
"""
from __future__ import annotations
import argparse, re, sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import spec_parser as sp
import judge_viewpoints as jv

EXEC_CODES = {"EXEC", "EXEC-UI", "EXEC-UI:DDT", "EXEC-UI+EXEC-MAN", "CONTRACT", "DELEG-STATIC"}


def spec_text_at(raw, line, maxlen=220):
    """正本の該当行から始まる verbatim テキストと、実際に採用した行番号を返す。
    根拠が見出し行のときは直後の実内容行（>=20字）まで前進する（→根拠も内容行を指す）。"""
    if not line or line < 1 or line > len(raw):
        return "", line
    for i in range(line, min(line + 4, len(raw) + 1)):
        t = sp.strip_tags(raw[i - 1])
        if len(t) >= 20:  # 実質的な内容行
            return t[:maxlen], i
    return sp.strip_tags(raw[line - 1])[:maxlen], line


def root_line(root: str):
    m = re.search(r":(\d+)", root)
    return int(m.group(1)) if m else None


def ddt_rows(input_fields):
    """入力項目の制約から境界データ表を生成（項目×境界種）。"""
    rows = []
    for f in input_fields:
        fl = f["flags"]
        if fl["nolimit"] and not fl["has_num"]:
            continue  # 上限なし＝境界テスト対象外（OUT側）
        if fl["has_len"] and not fl["has_num"]:  # 数値項目は数値境界のみ
            for label, val in [("最大長", "max"), ("最大長+1", "max+1"),
                               ("最小長", "min"), ("最小長-1", "min-1")]:
                rows.append((f["name"], label, val, "エラー無し" if "+1" not in label and "-1" not in label else "エラー"))
        if fl["has_num"]:
            for label, val in [("正の値", "+n"), ("0", "0"), ("負の結果", "-n"), ("型不正", "非数値")]:
                rows.append((f["name"], label, val, "要正本照合（非負/下限/型）"))
    return rows


def generate(html_path: Path, it_path: Path, inv_path: Path):
    parsed = sp.parse_html(html_path)
    jv.parsed_text_cache[html_path.name] = html_path.read_text(encoding="utf-8")
    raw = html_path.read_text(encoding="utf-8").splitlines()
    externals = jv.load_externals(inv_path, parsed["meta"]["id"])
    fid = parsed["meta"]["id"]
    hn = html_path.name

    # 母集合スタブ（優先度も拾う: col5）
    stubs = []
    for l in it_path.read_text(encoding="utf-8").splitlines():
        if "\tIT-" not in l:
            continue
        p = l.split("\t")
        if len(p) < 5:
            continue
        itid, vp, pri = p[2].strip(), p[3].strip(), p[4].strip()
        code, root = jv.judge_stub(itid, vp, parsed, externals, hn)
        stubs.append({"itid": itid, "vp": vp, "pri": pri, "code": code, "root": root})

    out = []
    ap = out.append
    ap(f"# {fid} — 自動再生成ケース（Phase3ジェネレータ出力・prose未整形）\n")
    ap(f"正本: `{html_path}`")
    ap(f"> 本ファイルは spec_parser＋judge_viewpoints＋generate_cases が機械生成した**土台**。")
    ap(f"> 各実施ケースの期待は判定根拠 file:line の**正本verbatim**。prose整形と SEED 具体化は後段（人手/LLM）で行う。\n")

    # §0 除外
    ap("## §0. テスト対象外（Phase2・廃止＝正本が明示）")
    ex = parsed["excluded"]
    if not ex["phase2"] and not ex["superseded"]:
        ap("（なし）")
    for it in ex["phase2"]:
        ap(f"- [Phase2] {it['text'][:80]}（{hn}:{it['line']}）")
    for it in ex["superseded"]:
        ap(f"- [廃止] {it['text'][:80]}（{hn}:{it['line']}）")

    # §1 SEED雛形（権限・DBカラムから）
    ap("\n## §1. SEED雛形（要具体化）")
    perm = parsed["tables"].get("権限・認可")
    dbc = parsed["tables"].get("DBカラム")
    if perm:
        ap(f"- 権限・ステータス前提の分離が必要（{hn}:{perm['line']}）: " +
           " / ".join(" ".join(r)[:60] for r in perm["rows"][1:4]))
    if dbc:
        ap(f"- 副作用テーブル（{hn}:{dbc['line']}）: " +
           " / ".join(r[0] for r in dbc["rows"][1:] if r))

    # §2 DDT表（入力項目の境界）
    ap("\n## §2. DDT データ表（入力項目×境界・要正本照合で期待確定）")
    dr = ddt_rows(parsed["input_fields"])
    if not dr:
        ap("（境界テスト対象の入力項目なし。上限なし項目は§4のOUT参照）")
    else:
        ap("| 項目 | 境界 | 入力 | 期待(要正本照合) |")
        ap("|---|---|---|---|")
        for name, label, val, exp in dr:
            ap(f"| {name} | {label} | {val} | {exp} |")

    # §3 実施ケースTSV（期待=正本verbatim）
    ap("\n## §3. 実施ケース（期待=正本verbatim・要prose整形）")
    ap("```tsv")
    ap("テストID\t判定コード\t観点\t優先度\t期待(正本verbatim)\t正本根拠")
    n = 0
    for s in stubs:
        if s["code"] not in EXEC_CODES:
            continue
        n += 1
        ln = root_line(s["root"])
        exp, used = spec_text_at(raw, ln)
        exp = exp or "（根拠行のテキスト取得不可＝要確認）"
        root = re.sub(r":\d+", f":{used}", s["root"]) if used else s["root"]
        ap(f"RG-{fid}-{n:03d}\t{s['code']}\t{s['vp']}\t{s['pri']}\t{exp}\t{root}")
    ap("```")

    # §4 台帳（OUT/NO_IF/MERGE/要判定）
    ap("\n## §4. 台帳（非実施・根拠付き）")
    ap("| 観点 | 判定 | 根拠 |")
    ap("|---|---|---|")
    for s in stubs:
        if s["code"] in EXEC_CODES:
            continue
        ap(f"| {s['vp']} | {s['code']} | {s['root']} |")

    # サマリ
    c = Counter(s["code"].split("→")[0] for s in stubs)
    ap(f"\n## §5. サマリ  母集合={len(stubs)}／実施={n}／" +
       "／".join(f"{k}:{v}" for k, v in c.most_common()))
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", required=True)
    ap.add_argument("--it", required=True)
    ap.add_argument("--inv", default="endpoint_reports/function_dependency_inventory.tsv")
    ap.add_argument("--out", help="出力先md（省略時stdout）")
    args = ap.parse_args()
    md = generate(Path(args.html), Path(args.it), Path(args.inv))
    if args.out:
        Path(args.out).write_text(md, encoding="utf-8")
        print(f"written: {args.out}")
    else:
        print(md)


if __name__ == "__main__":
    main()
