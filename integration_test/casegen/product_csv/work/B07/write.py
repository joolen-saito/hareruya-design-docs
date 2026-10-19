import json,re
L=[l.rstrip("\n").split("\t") for l in open("in/A01-01.tsv",encoding="utf-8")]
ix={h:i for i,h in enumerate(L[0])}
new={a:(c,n) for a,c,n in json.load(open("work/B07/a0101.json"))}
H=["シードID","判定","新しい投入方法","新しい状態・属性","根拠","理由"]
rows=[]
BASIS="M03-27 L0124・L0129・L0134・L0192-L0238、M03-09 L0099-L0103・L0126-L0129・L0158、M03-02 L0075-L0077・L0092"
for r in L[1:]:
    sid=r[0]; c,n=new[sid]
    attr=""
    if "-AA-" in sid:
        a=r[ix["状態・属性"]]
        attr=a.replace("（登録時に振られた商品IDを控える）","（グッズ商品CSV登録の取り込み後に、商品マスター(検索結果)の行の商品IDから控える）")
        assert attr!=a
    why=("元は商品登録画面で商品を新規登録していたので、グッズ商品CSV登録（スマレジ連携フラグ0・スマレジ商品コードと部門IDは空）で作り、取り込み後に商品規格登録編集画面でスマレジ連携フラグ・スマレジ商品コード・部門を入れて「商品規格を登録」を押す形にした"
         "（連携フラグを有効にしたCSVは部門IDが必須で、部門IDの控え先が無いため。元のシードも同じ画面の同じ項目を入れている）。"
         "元のシードに商品名・価格の指定が無かったので、商品名は商品コードと同じ値、基準価格1000・販売価格1000・買取価格100・原価単価0とした（販売価格はスマレジ連携の閾値300円以上。買取価格は販売価格を上回れない M03-27 L0119）。"
         "スマレジ連携に当たる。")
    if "-PICK" in sid:
        why+="元のシードに商品コードの指定が無かったので、スマレジ商品コードと同じ値を商品コードにした（在庫一覧の確認で同じ値を商品コードとして使っているため）。"
    if "-AA-" not in sid:
        why+="気づいた誤り（直していない）: スマレジ商品コードは設計書では数値（M03-27 L0233、M03-09 L0127）だが、元のシードの値は「SMA-…」の文字列。"
    else:
        why+="商品IDの控え先を、規格登録画面から取り込み後の商品マスター(検索結果)に変えた（呼び名は同じ）。"
    rows.append([sid,"直す",n,attr,BASIS,why])
hdr="\t".join(H)
with open("out/A01-01.tsv","w",encoding="utf-8") as f:
    f.write(hdr+"\n")
    for r in rows:
        assert all("\t" not in x and "\n" not in x for x in r)
        f.write("\t".join(r)+"\n")
# M03-30
M=[l.rstrip("\n").split("\t") for l in open("in/M03-30.tsv",encoding="utf-8")]
mi={h:i for i,h in enumerate(M[0])}
rows=[]
for r in M[1:]:
    t=r[mi["投入方法"]]; sid=r[0]
    why="商品はすでにグッズ商品CSV登録で作っている。商品マスターで検索して開く商品登録編集画面は既存の商品の編集で、商品規格一覧の「新規登録」は規格の追加なので、商品の新規登録は無い。"
    if ("カード指定" in t or "商品を登録" in t) and "割引率" not in t:
        why+="気づいた誤り（直していない）: 取り込んだ商品を商品登録編集画面で「商品を登録」するが割引率の選択が無い（割引率は空・未選択では登録できない M03-02 L0146）。"
    if sid.endswith("QC-MASTERS"):
        why+="「商品登録画面の割引率」は商品を作る手順ではなく、割引率Aを選べることの確認（商品登録編集画面の表記ゆれ）。"
    rows.append([sid,"直さない","","","M03-27 L0124・L0192-L0238、M03-02 L0075-L0077・L0092・L0146、M03-09 L0130-L0134",why])
with open("out/M03-30.tsv","w",encoding="utf-8") as f:
    f.write(hdr+"\n")
    for r in rows: f.write("\t".join(r)+"\n")
