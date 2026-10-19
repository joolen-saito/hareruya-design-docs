#!/usr/bin/env python3
"""商品登録画面で商品を作っているかもしれないシードを抜き出す。 extract.py

依頼者決定（2026-10-19「商品登録画面で商品を作るシードも直して」）の対象を拾う。
刷新後は商品の新規登録が禁止（M03-02 L0075〜L0077。URL は404、E2E では403）で、商品を新しく作れるのは
グッズ商品CSV登録（M03-27）とカード商品CSV登録（M03-26）だけ。既存の商品の編集（商品登録編集画面）と、
規格の追加（商品規格登録編集画面、M03-09）は刷新後も使える。

拾う語は広めに取る（編集だけのシードも混ざる。直すかどうかは担当が1件ずつ決める）。
対象は ../cases/ に今あるシード（除外したケースのシードは除外の表へ移っているので入らない）。
パイプラインを最後まで流した状態（exclude_scope.py の後）で流す。

  targets.tsv        機能ID・シードID・一致した語・使うケース・元の状態・属性・元の投入方法（apply.py が流し直しの照合に使う）
  in/<機能ID>.tsv    担当に渡す。シード表の行＋使うケース
"""
import collections, pathlib, re

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
PAT = re.compile(r"商品登録(?!CSV)|商品を(新規|新しく|[0-9０-９一二三四五]+件|[0-9]+点)?登録|商品編集画面|product/product/new|商品の登録|商品の新規登録|商品新規登録")


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def main():
    import sys
    if any((P / "out").glob("*.tsv")) and "--force" not in sys.argv:
        sys.exit("out/ に書き直しがある。targets.tsv の元の文は書き直し前の文でないといけないので、流し直さない（--force で強行）")
    out, per = [], collections.defaultdict(list)
    for sp in sorted(CG.glob("cases/*_seed_data.tsv")):
        fid = sp.name[:6]
        sh, S = rows(sp)
        ch, C = rows(CG / f"cases/{fid}_test_cases.tsv")
        ui = ch.index("使用シード")
        use = collections.defaultdict(list)
        for c in C:
            for s in [s.strip() for s in c[ui].split(",") if s.strip()]:
                use[s].append(c[0])
        mi = sh.index("投入方法")
        ai = sh.index("状態・属性")
        for s in S:
            hits = sorted({m.group(0) for m in PAT.finditer(s[mi])})
            if not hits:
                continue
            out.append([fid, s[0], "・".join(hits), ",".join(use.get(s[0], [])), s[ai], s[mi]])
            per[fid].append(s + [",".join(use.get(s[0], []))])
    with open(P / "targets.tsv", "w", encoding="utf-8") as w:
        w.write("機能ID\tシードID\t一致した語\t使うケース\t元の状態・属性\t元の投入方法\n")
        for r in out:
            w.write("\t".join(r) + "\n")
    for f in (P / "in").glob("*.tsv"):
        f.unlink()
    for fid, rs in per.items():
        with open(P / f"in/{fid}.tsv", "w", encoding="utf-8") as w:
            w.write("\t".join(sh + ["使うケース"]) + "\n")
            for r in rs:
                w.write("\t".join(r) + "\n")
    print(len(out), "シード /", len(per), "機能")


if __name__ == "__main__":
    main()
