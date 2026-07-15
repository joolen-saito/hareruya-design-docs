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


def excel_refs(cell):
    """セル内の Excel 引用 '0203:L1152' → [(prefix, line)...]。"""
    return [(m.group(1), int(m.group(2))) for m in re.finditer(r"(\d{4}):L(\d+)", cell)]


def excel_path_of(md, override):
    if override:
        return Path(override)
    m = re.search(r"`(excel_to_html/output/[^`]+\.html)`", md)
    return Path(m.group(1)) if m else None


def run(md_path: Path, html_override=None, excel_override=None):
    md = md_path.read_text(encoding="utf-8")
    header, rows = extract_tsv(md)
    viol = []
    if not header:
        return [{"gate": "G1", "row": "-", "msg": "TSVブロックが見つからない"}]
    ncol = len(header)
    hp = html_path_of(md, html_override)
    raw = hp.read_text(encoding="utf-8").splitlines() if hp and hp.exists() else None
    parsed = sp.parse_html(hp) if hp and hp.exists() else None
    # Excelオラクル（多オラクル機能の 'NNNN:Lxxx' 照合用）
    ep = excel_path_of(md, excel_override)
    excel_raw = ep.read_text(encoding="utf-8").splitlines() if ep and ep.exists() else None
    excel_prefix = re.match(r"(\d{4})", ep.name).group(1) if ep and re.match(r"(\d{4})", ep.name) else None
    neg_lines = {n["line"] for n in parsed["negations"]} if parsed else set()
    STOP = {"買取詳細", "識別ID", "フェーズ", "実装不要", "基本設計", "原文", "要件",
            "対応", "本節", "記述", "刷新後", "これに伴い"}
    excluded_words = []
    if parsed:
        for it in parsed["excluded"]["phase2"] + parsed["excluded"]["superseded"]:
            for w in re.split(r"[ 　。、：:／/（）\(\)]", it["text"]):  # ＆は割らず複合語を保つ
                w = w.strip()
                if len(w) >= 5 and not re.fullmatch(r"[0-9A-Za-z_]+", w) and w not in STOP:
                    excluded_words.append(w)
    excluded_words = list(dict.fromkeys(excluded_words))[:8]

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
        # G6 総称オラクル検出（正本が汎用テンプレ＝Excel設計書源が必要）
        for g in GENERIC_ORACLE:
            if g in exp:
                viol.append({"gate": "G6", "row": rid, "msg": "期待が総称テンプレ文＝具体オラクル化にExcel設計書源が必要"})
                break
        # G7 Excel引用の実在（期待/根拠セル内の 'NNNN:Lxxx' をExcel文書の実行行と照合）
        if excel_raw and excel_prefix:
            for pfx, en in excel_refs(exp) + excel_refs(root):
                if pfx == excel_prefix:
                    if en < 1 or en > len(excel_raw):
                        viol.append({"gate": "G7", "row": rid, "msg": f"存在しないExcel行 {pfx}:L{en}（Excel {len(excel_raw)}行）"})
                    elif len(sp.strip_tags(excel_raw[en - 1])) < 6:
                        viol.append({"gate": "G7", "row": rid, "msg": f"Excel空/極短行の引用 {pfx}:L{en}"})
    return viol


# 正本が汎用テンプレのとき期待に現れる総称文（具体オラクルになっていない印）。
GENERIC_ORACLE = (
    "利用者または外部システムが対象機能を開始する",
    "いずれかの主処理を実行する",
    "対象機能を実行する",
)


# ハードゲート（違反ならCI失敗）: TSV整合・根拠の実在・OUTの否定文照合。
# 助言（warning・失敗にしない）: G3 見出し引用・G5 逆捏造の疑い（機能名の偶発一致が多く人手確認向き）。
HARD = {"G1", "G2", "G4", "G7"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("md")
    ap.add_argument("--html", help="正本HTML（省略時はmdヘッダから）")
    ap.add_argument("--excel", help="Excelオラクル文書（省略時はmdヘッダの excel_to_html/output/... から）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    viol = run(Path(args.md), args.html, args.excel)
    hard = [v for v in viol if v["gate"] in HARD]
    warn = [v for v in viol if v["gate"] not in HARD]
    if args.json:
        print(json.dumps({"hard": hard, "warn": warn}, ensure_ascii=False, indent=2))
    else:
        from collections import Counter
        if not hard:
            print("✅ 捏造ゼロ・ゲート(ハード): 違反なし" +
                  (f"／助言 {len(warn)}件" if warn else ""))
        else:
            c = Counter(v["gate"] for v in hard)
            print(f"❌ ハード違反 {len(hard)}件: " + " ".join(f"{k}:{n}" for k, n in sorted(c.items())))
        for v in (hard + warn)[:40]:
            tag = "❌" if v["gate"] in HARD else "⚠"
            print(f"  {tag}[{v['gate']}] {v['row']}: {v['msg']}")
    sys.exit(1 if hard else 0)


if __name__ == "__main__":
    main()
