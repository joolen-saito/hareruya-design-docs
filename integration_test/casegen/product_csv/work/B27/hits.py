import sys,re
f=sys.argv[1]
ls=[l.rstrip("\n").split("\t") for l in open(f"in/{f}.tsv")]
pat=re.compile(r"商品登録|商品を登録|カード指定|product/new|商品新規|商品.{0,6}新規|CSV|商品規格|商品を作|商品を新|商品マスタ")
for r in ls[1:]:
    print("=====",r[0],"|",r[-1],"|",r[2])
    sents=[s for s in re.split(r"(?<=。)",r[5]) if pat.search(s)]
    print("  CSV系文数:",len(sents),"/",len([s for s in re.split(r"(?<=。)",r[5]) if s]))
    for s in sents: print("  -",s[:260])
