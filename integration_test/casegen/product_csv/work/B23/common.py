import re, pathlib
P = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv")
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
PG_NORMAL = "予約商品フラグの付いていない既存の購入グループの名称"


def load(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write(fid, rows):
    with open(P / f"out/{fid}.tsv", "w", encoding="utf-8") as o:
        o.write("\t".join(HDR) + "\n")
        for r in rows:
            assert len(r) == 6, r[0]
            for c in r:
                assert "\t" not in c and "\n" not in c, r[0]
            o.write("\t".join(r) + "\n")


def summarize(label, vals, codes, fmt=lambda v: v):
    """行ごとの値。全部同じなら『全行とも』、少数の例外ならその行だけ、それ以外は順に並べる"""
    n = len(vals)
    if n == 1:
        return f"{label}は{fmt(vals[0])}"
    uniq = []
    for v in vals:
        if v not in uniq:
            uniq.append(v)
    if len(uniq) == 1:
        return f"{label}は全行とも{fmt(vals[0])}"
    base = max(uniq, key=vals.count)
    exc = [(c, v) for c, v in zip(codes, vals) if v != base]
    if n > 4 and len(exc) <= 3:
        return f"{label}は" + "、".join(f"{c}の行だけ{fmt(v)}" for c, v in exc) + f"、ほかの行は{fmt(base)}"
    return f"{label}は順に" + "・".join(fmt(v) for v in vals)


def q(v):
    return f"「{v}」"
