#!/usr/bin/env python3
"""捏造ゼロ・ゲート機械検査 — 結合テスト再生成パイプライン Phase4（一次防御）。

再生成ケースファイル（Markdown中のTSV）を、正本HTMLに対して機械検証する。
LLM敵対レビューの前に、機械で確実に弾けるものを弾く:

  G1 TSV整合      : 全データ行が同じ列数
  G2 根拠の実在   : 各実施行の file:line 根拠が正本の実在行（1..行数）を指す
  G3 見出し行引用 : 根拠が節見出し行（短い/既知節名）だけを指していないか（内容行を指すべき）
  G4 OUTの否定文  : 判定=OUT の行の根拠行に、明示的否定文が実在するか（偽OUT検出）
  G5 phase2/廃止  : 実施行が Phase2/廃止項目の語を期待に含んでいないか（逆捏造検出）

exit code: 違反があれば 1（CI用）。--json で機械可読出力。
"""
from __future__ import annotations
import argparse, io, csv, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import spec_parser as sp

NEG = re.compile("|".join(sp.NEGATION_PATTERNS))


def extract_tsv(md: str):
    m = re.search(r"```tsv\n(.*?)\n```", md, re.S)
    if not m:
        return None, None
    rows = list(csv.reader(io.StringIO(m.group(1)), delimiter="\t", quotechar='"'))
    return rows[0], rows[1:]


def html_path_of(md: str, override):
    if override:
        return Path(override)
    m = re.search(r"正本[^`]*`([^`]+\.html)`", md)
    return Path(m.group(1)) if m else None


def col_index(header, *names):
    for i, h in enumerate(header):
        if any(n in h for n in names):
            return i
    return -1


def line_nums(cell):
    return [int(x) for x in re.findall(r"(?:L|:)(\d+)", cell)]


def run(md_path: Path, html_override=None):
    md = md_path.read_text(encoding="utf-8")
    header, rows = extract_tsv(md)
    viol = []
    if not header:
        return [{"gate": "G1", "row": "-", "msg": "TSVブロックが見つからない"}]
    ncol = len(header)
    hp = html_path_of(md, html_override)
    raw = hp.read_text(encoding="utf-8").splitlines() if hp and hp.exists() else None
    parsed = sp.parse_html(hp) if hp and hp.exists() else None
    neg_lines = {n["line"] for n in parsed["negations"]} if parsed else set()
    excluded_words = []
    if parsed:
        for it in parsed["excluded"]["phase2"] + parsed["excluded"]["superseded"]:
            excluded_words += [w for w in re.split(r"[ 　（）\(\)]", it["text"]) if len(w) >= 3][:3]

    i_id = col_index(header, "テストID")
    i_code = col_index(header, "判定コード")
    i_root = col_index(header, "根拠")
    i_exp = col_index(header, "期待")

    for r in rows:
        rid = r[i_id] if i_id >= 0 and i_id < len(r) else "?"
        # G1
        if len(r) != ncol:
            viol.append({"gate": "G1", "row": rid, "msg": f"列数{len(r)}≠{ncol}"})
            continue
        code = r[i_code].strip() if i_code >= 0 else ""
        root = r[i_root] if i_root >= 0 else ""
        exp = r[i_exp] if i_exp >= 0 else ""
        lns = line_nums(root)
        # G2 根拠の実在
        if code and code != "要判定":
            if not lns:
                viol.append({"gate": "G2", "row": rid, "msg": f"根拠に行番号なし: {root[:40]}"})
            elif raw:
                bad = [n for n in lns if n < 1 or n > len(raw)]
                if bad:
                    viol.append({"gate": "G2", "row": rid, "msg": f"存在しない行 {bad}（HTML {len(raw)}行）"})
        # G3 見出し行引用（実内容が20字未満の行のみを指す）
        if raw and lns:
            if all(len(sp.strip_tags(raw[n - 1])) < 12 for n in lns if 1 <= n <= len(raw)):
                viol.append({"gate": "G3", "row": rid, "msg": f"見出し行のみ引用 L{lns}"})
        # G4 OUTの否定文
        if code == "OUT" and raw:
            ok = any(
                (n in neg_lines) or NEG.search(sp.strip_tags(raw[n - 1]) if 1 <= n <= len(raw) else "")
                for n in lns
            )
            if not ok:
                viol.append({"gate": "G4", "row": rid, "msg": f"OUTだが根拠行に明示的否定文なし L{lns}"})
        # G5 phase2/廃止の逆捏造
        for w in excluded_words:
            if w and w in exp:
                viol.append({"gate": "G5", "row": rid, "msg": f"廃止/Ph2の語『{w}』を期待に含む"})
                break
    return viol


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("md")
    ap.add_argument("--html", help="正本HTML（省略時はmdヘッダから）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    viol = run(Path(args.md), args.html)
    if args.json:
        print(json.dumps(viol, ensure_ascii=False, indent=2))
    else:
        if not viol:
            print("✅ 捏造ゼロ・ゲート: 違反なし")
        else:
            from collections import Counter
            c = Counter(v["gate"] for v in viol)
            print(f"❌ 違反 {len(viol)}件: " + " ".join(f"{k}:{n}" for k, n in sorted(c.items())))
            for v in viol[:40]:
                print(f"  [{v['gate']}] {v['row']}: {v['msg']}")
    sys.exit(1 if viol else 0)


if __name__ == "__main__":
    main()
