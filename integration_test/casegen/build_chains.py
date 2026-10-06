#!/usr/bin/env python3
"""機能間の連鎖を辺単位で作る。

1行＝1辺（遷移元→遷移先）。契機・引継データ・出典・根拠の強さを各辺へ持たせる。
「機能の並び」では証拠が粗く、契機や引継データが失われる（codex R1）。

材料はHTML設計書だけ。表の構造を使って列から採る。
文字列を平文で拾うと契機と後続処理が混ざる（「商品」→「検索・一覧画面」のような欠損が出た）。

  1. 表示メッセージ表  : 表示条件 → 後続処理  （契機と遷移先が列で分かれている）
  2. 画面項目表        : 画面部品の説明の「押下すると〜画面へ遷移」
  3. ステータス遷移図  : data-transition-inferred="1" は幾何推定なので根拠状態を分ける

シートの境界は <section ... id="sheet-N"> で切る。見出しの直近一致で判定すると
境界を越えて拾う（M03-01の辺が136本になり、実際は3本だった）。
"""
import csv, collections, glob, io, os, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "integration_test/casegen"

# 「〜画面へ遷移」だけでなく「買取・基準価格一括編集に遷移する」のように
# 画面が付かない記述もある。語尾を限定せず、遷移の動詞の直前を遷移先とする。
DEST = re.compile(r"([^、。\s|]{2,30}?)(?:へ|に)(?:遷移|リダイレクト|戻[るり])")
CARRY = re.compile(r"(?:保持|引き継|引継|渡[すし]|保存|付与)[^。、]{0,34}")
TRIG = re.compile(r"(?:押下|クリック|選択|送信|実行|保存|登録|完了|成功|失敗)")


def strip(x):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", x)).strip()


def tables(chunk):
    for tb in re.findall(r"<table.*?</table>", chunk, re.S):
        rows = []
        for tr in re.findall(r"<tr.*?</tr>", tb, re.S):
            rows.append([strip(c) for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", tr, re.S)])
        if rows:
            yield rows


def input_of(fid, cache={}):
    """機能の入出力節「入力」を返す。遷移先の引継データを補うために使う。"""
    import glob
    if fid in cache:
        return cache[fid]
    val = ""
    for p in glob.glob(str(ROOT / f"functions/*/{fid.lower()}_*.md")):
        if "_archive" in p:
            continue
        t = open(p, encoding="utf-8").read()
        m = re.search(r"^## 入出力\n(.*?)(?=^## |\Z)", t, re.M | re.S)
        if not m:
            continue
        for line in m.group(1).splitlines():
            c = [x.strip() for x in line.strip().strip("|").split("|")]
            if len(c) >= 2 and c[0] == "入力":
                val = c[1]
    cache[fid] = val
    return val


def sheet_spans(html):
    marks = [(m.start(), m.group(1)) for m in re.finditer(r'id="(sheet-\d+)"', html)]
    return [(p, marks[i + 1][0] if i + 1 < len(marks) else len(html), sid)
            for i, (p, sid) in enumerate(marks)]


def main():
    fid_by_sheet, name_by_sheet = collections.defaultdict(list), {}
    for r in csv.DictReader((ROOT / "functions/function-sheet-map.tsv").open(encoding="utf-8"),
                            delimiter="\t"):
        k = (r["ブック"].strip(), r["シートID"].strip())
        name_by_sheet[k] = r["シート見出し"].strip()
        if r["状態"].strip() == "確定":
            fid_by_sheet[k].append(r["機能No"].strip())

    edges, excluded, n = [], [], 0
    for p in sorted(glob.glob(str(ROOT / "excel_to_html/output/*.html"))):
        base = os.path.basename(p)
        if base == "index.html":
            continue
        book = base[:4]
        html = open(p, encoding="utf-8", errors="ignore").read()
        for s, e, sid in sheet_spans(html):
            chunk = html[s:e]
            k = (book, sid)
            sname = name_by_sheet.get(k, sid)
            src = fid_by_sheet.get(k, [""])[0]
            src_out = f"{base} / {sname}"
            for rows in tables(chunk):
                hdr = rows[0]
                # 表示メッセージ表: 表示条件 → 後続処理
                if "表示条件" in hdr and "後続処理" in hdr:
                    ci, co = hdr.index("表示条件"), hdr.index("後続処理")
                    for r in rows[1:]:
                        if len(r) <= max(ci, co):
                            continue
                        d = DEST.search(r[co])
                        if not d:
                            continue
                        n += 1
                        c = CARRY.search(r[co])
                        edges.append([f"CH-{n:04d}", book, sname, src, d.group(1),
                                      r[ci][:70], c.group(0)[:60] if c else "", "", "",
                                      src_out, "明示（表示メッセージ表）"])
                # 業務ロジックの判定結果表（判定・結果・遷移先などの列を持つ）
                elif any("結果" in h or "処理" in h or "後続" in h for h in hdr) and len(hdr) >= 2:
                    ci = next((i for i, h in enumerate(hdr)
                               if "結果" in h or "処理" in h or "後続" in h), None)
                    for r in rows[1:]:
                        if ci is None or len(r) <= ci:
                            continue
                        d = DEST.search(r[ci])
                        if not d:
                            continue
                        n += 1
                        c = CARRY.search(r[ci])
                        edges.append([f"CH-{n:04d}", book, sname, src, d.group(1),
                                      " / ".join(r[:ci])[:70],
                                      c.group(0)[:60] if c else "", "", "",
                                      src_out, "明示（業務ロジック表）"])
                # 画面項目表: 画面部品の説明
                elif "画面部品の説明" in hdr:
                    ci = hdr.index("画面部品の説明")
                    li = hdr.index("ラベル") if "ラベル" in hdr else None
                    for r in rows[1:]:
                        if len(r) <= ci:
                            continue
                        # 「/」で切ると「商品詳細/編集画面へ遷移する」を分断して辺を落とす
                        for sent in re.split(r"[。\n]", r[ci]):
                            d = DEST.search(sent)
                            if not d or not TRIG.search(sent):
                                continue
                            n += 1
                            c = CARRY.search(sent)
                            label = r[li] if li is not None and len(r) > li else ""
                            edges.append([f"CH-{n:04d}", book, sname, src, d.group(1),
                                          (f"「{label}」" if label else "") + sent[:60],
                                          c.group(0)[:60] if c else "", "", "",
                                          src_out, "明示（画面項目表）"])
            for m in re.finditer(r'data-transition-inferred="1"[^>]*>([^<]{0,40})', chunk):
                excluded.append([book, sname, src, m.group(1).strip()[:60], src_out,
                                 "図形の最近傍で補完した辺。明示の接続が設計書に無い"])
    # 遷移先の機能を引き当て、引継データが空なら遷移先の入力節で補う
    # 機能名は一意でない（買取情報編集＝M06-03とM07-03、手動メール通知＝M07-04とM08-08 など）。
    # 先着で1つに決めると別の業務領域の機能へ結び付く（2026-10-06 に42本を fix_chain_dest.py で直した）。
    # 同名の候補はすべて持ち、遷移元と同じブックの機能を優先する。
    name2fids, books_of = collections.defaultdict(list), collections.defaultdict(set)
    for r in csv.DictReader((ROOT / "functions/function-sheet-map.tsv").open(encoding="utf-8"),
                            delimiter="\t"):
        if r["状態"].strip() == "確定":
            f = r["機能No"].strip()
            books_of[f].add(r["ブック"].strip())
            if f not in name2fids[r["機能名"].strip()]:
                name2fids[r["機能名"].strip()].append(f)
    LAYER = {"02": "M", "03": "F"}      # ブック番号の先頭2桁 → その領域の機能の頭文字
    # 遷移先画面の名前から機能を引く。部分一致の先着では
    # 「売上分析タグ登録/編集画面」に「タグ登録/編集」が当たり、M03-17をM03-13と誤る。
    # 最も長く一致した機能名を採り、同じ長さで複数当たるときは特定できないものとして空にする。
    for e in edges:
        dest = e[4]
        book = e[1]
        # 管理画面のブックからフロントの機能へ（またはその逆へ）名前だけで結び付く候補は、
        # 同じ画面名を持つ別領域の機能である（「商品一覧」「カテゴリ一覧」）。先に外してから最長一致を選ぶ。
        # 外した後に残る短い候補が正しいことがある（支店ECTOP→「…絞り込まれた商品一覧」は F03-01）。
        lay = LAYER.get(book[:2])

        def ok(f):
            return not (lay and book not in books_of[f] and f[0] in "MF" and f[0] != lay)

        cand = []
        for nm, fs in name2fids.items():
            keep = [f for f in fs if ok(f)]
            if nm and nm in dest and keep:
                cand.append((len(nm), nm, keep))
        hit = ""
        if cand:
            top = max(c[0] for c in cand)
            best = [c for c in cand if c[0] == top]
            if len(best) == 1:
                fs = best[0][2]
                same = [f for f in fs if book in books_of[f]]
                hit = same[0] if len(same) == 1 else (fs[0] if len(fs) == 1 else "")
        e.insert(5, hit)
        if not e[7] and hit:
            v = input_of(hit)
            if v:
                e[7] = f"遷移先の入力: {v[:60]}"

    b2 = io.StringIO()
    w2 = csv.writer(b2, delimiter="\t", lineterminator="\n")
    w2.writerow(["書番", "シート", "遷移元機能", "契機", "出典", "除外理由"])
    w2.writerows(excluded)
    (OUT / "chains_excluded.tsv").write_text(b2.getvalue(), encoding="utf-8")

    b = io.StringIO()
    w = csv.writer(b, delimiter="\t", lineterminator="\n")
    w.writerow(["連鎖ID", "書番", "シート", "遷移元機能", "遷移先画面", "遷移先機能", "契機",
                "引継データ", "遷移前状態", "遷移後状態", "出典", "根拠状態"])
    w.writerows(edges)
    (OUT / "chains.tsv").write_text(b.getvalue(), encoding="utf-8")
    print(f"除外（推定辺）: {len(excluded)} 本 → chains_excluded.tsv")
    for k, v in collections.Counter(e[11] for e in edges).most_common():
        print(f"  {k}: {v}")
    print(f"辺 {len(edges)} 本 / 遷移元が特定できた {sum(1 for e in edges if e[3])}"
          f" / 遷移先機能が特定できた {sum(1 for e in edges if e[5])}"
          f" / 引継データあり {sum(1 for e in edges if e[7])}")
    c = collections.Counter(e[3] for e in edges if e[3])
    print(f"辺を持つ機能 {len(c)} / 上位 {c.most_common(5)}")


if __name__ == "__main__":
    main()
