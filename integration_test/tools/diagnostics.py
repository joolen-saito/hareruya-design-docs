#!/usr/bin/env python3
"""量産前診断 — レビューが出した3仮説の実サイズを機械的に測る。

D1 NO_INPUT偽陰性率: input_fields=空(=NO_INPUT誘発)なのに、正本HTMLに入力面の
   シグナル(別ヘッダのフォーム表・検索条件表・input/select/textarea・モーダル)が
   実在する機能 = パーサ取りこぼしの偽陰性候補。
D2 機能区分の誤区分リスク: 詳細設計HTMLに区分語が複数種あり(=正規表現が最初の1つを
   採るので誤り得る)機能数、区分語ゼロ(不明)機能数、新規実装のExcel索引欠落の真因。
D3 オラクル未引用行率: 承認済み機能で、オラクル(Excel/詳細設計)の仕様行のうち
   ケースが引用していない行の割合(=書かれてるのに誰も追跡しない/G8原型)。
"""
from __future__ import annotations
import glob, html, re, sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import spec_parser as sp
import oracle_router as orr
import excel_spec_parser as ex

ITCASES = sorted(glob.glob("integration_test/*_it_cases.md"))

# 入力面シグナル（single-patternパーサが拾えない別形式）
FORM_HDR = re.compile(r"(検索条件|検索項目|入力欄|フォーム|登録項目|編集項目|項目\s*[|｜])")
INPUT_TAG = re.compile(r"<(input|select|textarea)\b", re.I)
INPUT_WORD = re.compile(r"(モーダル|検索フォーム|入力チェック|バリデーション|必須項目|入力して|選択して)")
KUBUN_ALL = re.compile(r"(標準|新規実装|現行踏襲|カスタマイズ)")
KUBUN_CTX = re.compile(r"(?:カスタマイズ区分|機能区分)")


def iter_funcs():
    for it in ITCASES:
        p = Path(it)
        dh = orr._detail_html_of_itcase(p)
        fid = orr._fid_of_itcase(p)
        if dh and fid and dh.exists():
            yield fid, dh, p


def d1_no_input_false_neg():
    print("=" * 70)
    print("D1  NO_INPUT偽陰性率（input_fields空なのに入力面シグナル実在）")
    print("=" * 70)
    empty = []       # input_fields空の機能
    fn_cand = []     # 偽陰性候補（シグナルあり）
    for fid, dh, _ in iter_funcs():
        try:
            parsed = sp.parse_html(dh)
        except Exception:
            continue
        if parsed["input_fields"]:
            continue
        empty.append(fid)
        raw = dh.read_text(encoding="utf-8")
        txt = html.unescape(re.sub(r"<[^>]+>", " ", raw))
        sigs = []
        if INPUT_TAG.search(raw): sigs.append("inputタグ")
        if FORM_HDR.search(txt):  sigs.append("別形式フォーム表/検索条件")
        if INPUT_WORD.search(txt): sigs.append("入力/モーダル語")
        if sigs:
            fn_cand.append((fid, sigs))
    print(f"input_fields空の機能: {len(empty)}")
    print(f"うち入力面シグナル実在（偽陰性候補）: {len(fn_cand)}"
          f"  = {len(fn_cand)/max(1,len(empty))*100:.0f}%")
    sc = Counter(s for _, sigs in fn_cand for s in sigs)
    for s, n in sc.most_common():
        print(f"    {n:3d}  {s}")
    print("  例:", ", ".join(f"{f}({'/'.join(s)})" for f, s in fn_cand[:8]))
    return empty, fn_cand


def d2_kubun_misroute():
    print("=" * 70)
    print("D2  機能区分の誤区分リスク")
    print("=" * 70)
    idx = ex.build_index()
    multi = []       # 区分語が複数種
    unknown = []     # 区分語なし
    ctx_absent = []  # 区分語はあるが「区分」文脈語が無い（誤検出リスク）
    dist = Counter()
    for fid, dh, _ in iter_funcs():
        t = html.unescape(re.sub(r"<[^>]+>", " ", dh.read_text(encoding="utf-8")))
        kinds = set(KUBUN_ALL.findall(t))
        r = orr.route(fid, dh, idx)
        dist[r["kubun"]] += 1
        if r["kubun"] == "不明":
            unknown.append(fid)
        else:
            if len(kinds) >= 2:
                multi.append((fid, r["kubun"], sorted(kinds)))
            if not KUBUN_CTX.search(t):
                ctx_absent.append((fid, r["kubun"]))
    print("区分分布:", dict(dist))
    print(f"区分語が複数種(正規表現が最初の1つ採用=誤り得る): {len(multi)}")
    print("  例:", ", ".join(f"{f}→{k}[{'/'.join(ks)}]" for f, k, ks in multi[:8]))
    print(f"区分文脈語(カスタマイズ区分/機能区分)なしで区分確定: {len(ctx_absent)}")
    print("  例:", ", ".join(f"{f}→{k}" for f, k in ctx_absent[:8]))
    print(f"区分不明: {len(unknown)}  例: {', '.join(unknown[:10])}")
    # 新規実装のExcel索引欠落 真因
    print("-" * 40)
    print("新規実装のExcel索引欠落 真因:")
    miss = []
    for fid, dh, _ in iter_funcs():
        r = orr.route(fid, dh, idx)
        if r["kubun"] == "新規実装" and not r["excel_ok"]:
            exkey = r["excel_key"]
            # 近傍キー（同プレフィクス）を探す
            pref = exkey.split("-")[0]
            near = [k for k in idx if k.startswith(pref)]
            miss.append((fid, exkey, near[:6]))
    for fid, exkey, near in miss:
        print(f"    {fid}: Excelキー={exkey} 索引に無し／同系列在庫={near}")
    return multi, unknown, miss


def _cited_lines(md_text, prefix=None):
    """ケースmdが引用する行番号集合。prefixありなら 'NNNN:Lxxx' のみ、なしは 'Lxxx'。"""
    if prefix:
        return {int(m) for m in re.findall(rf"{prefix}:L(\d+)", md_text)}
    # 詳細設計の bare Lxxx（0203: の様な prefix付きは除外）
    lines = set()
    for m in re.finditer(r"(?<![:\d])L(\d+)", md_text):
        lines.add(int(m.group(1)))
    return lines


# Excel-to-HTMLのノイズ行（仕様挙動でない=分母から除外）
NOISE = re.compile(
    r"(図形・テキストボックス|/ image|/ B\d+ /|^GET POST|^https?://|^[A-Z ]+有 無|"
    r"^\W*$|概要$|機能仕様|処理概要|★は|一覧\(検索入力\)|画面イメージ|項番|区分$)")


def _is_spec_row(text):
    """真の仕様挙動行らしいか（日本語を含み・十分長く・ノイズでない）。"""
    if len(text) < 15:
        return False
    if NOISE.search(text):
        return False
    if not re.search(r"[ぁ-んァ-ヶ一-龠]", text):  # 日本語なし=表ラベル/英字のみ
        return False
    return True


def d3_uncited(approved):
    print("=" * 70)
    print("D3  オラクル未引用行率（承認済み機能・G8原型／ノイズ除外後の真の分母）")
    print("=" * 70)
    idx = ex.build_index()
    for fid, kind, oracle_prefix in approved:
        md = list(glob.glob(f"integration_test/_poc_{fid.replace('-','_')}_*.md"))
        if not md:
            print(f"  {fid}: ケースmd無し")
            continue
        text = Path(md[0]).read_text(encoding="utf-8")
        exkey = orr.fid_excel(fid)
        blk = ex.extract(exkey, idx)
        if not blk:
            print(f"  {fid}: Excelブロック無し")
            continue
        raw_lines = {b["line"] for b in blk["body"] if len(b["text"]) >= 12}
        spec_lines = {b["line"] for b in blk["body"] if _is_spec_row(b["text"])}
        cited = _cited_lines(text, prefix=oracle_prefix)
        cited_in = spec_lines & cited
        uncited = spec_lines - cited
        rate = len(uncited) / max(1, len(spec_lines)) * 100
        print(f"  {fid}({kind}) Excel {Path(blk['doc']).name} L{blk['start']}-{blk['end']}: "
              f"全body{len(raw_lines)}→真の仕様行{len(spec_lines)}／引用{len(cited_in)} "
              f"未引用{len(uncited)} = 未引用率{rate:.0f}%")
        um = [b for b in blk["body"] if b["line"] in uncited and _is_spec_row(b["text"])]
        for b in um[:6]:
            print(f"      未引用 L{b['line']}: {b['text'][:74]}")


if __name__ == "__main__":
    d1_no_input_false_neg()
    print()
    d2_kubun_misroute()
    print()
    # 承認済み: Excelオラクル機能のみ未引用率を測る（a01-01=0501, m05-01=0203）
    d3_uncited([("a01-01", "新規実装", "0501"), ("m05-01", "カスタマイズ", "0203")])
