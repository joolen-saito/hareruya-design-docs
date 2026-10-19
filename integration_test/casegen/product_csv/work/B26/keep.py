from common import *
def run(fid, f):
    ix,rows=load(fid)
    res=[]
    for r in rows:
        b,w=f(r[0],r[ix["投入方法"]])
        res.append([r[0],"直さない","","",b,w])
    write_out(fid,res)

B_CARD="M03-26（カード商品CSV登録）、M03-02 L0075〜L0077"
B_GOODS="M03-27 L0092・L0123・L0124、M03-02 L0075〜L0077"
CARDNOTE="商品はカード商品CSV登録で作っていて、商品登録画面では作っていない。商品登録編集画面は既存の商品の編集（略称タグ・公開ステータスの変更など）にだけ使う。なお、カード商品CSV登録は規格の数と価格が割引率の設定で変わる（M03-26 L0150・L0165）が、元のシードは取り込み後に規格を削除し、価格を規格の画面で入れ直しているので、ここでは書き換えない。"
def a0608(sid,old):
    if sid.endswith("NOTFOUND-012"): return ("M03-02 L0075〜L0077","商品を作らない（商品名が『A06-08不存在』で始まる商品が0件であることを確かめ、あれば削除するだけ）。")
    extra=""
    if "新規登録画面で" in old: extra="規格の画面での新規登録（商品規格登録）は既存の商品に規格を足す操作で、商品の新規登録ではない。"
    return (B_CARD, CARDNOTE+extra)
run("A06-08",a0608)

def a1705(sid,old):
    w="商品はグッズ商品CSV登録で作っていて、商品登録画面では作っていない。商品登録編集画面は取り込んだ商品の編集にだけ使い、規格は商品規格一覧の『新規作成』（既存の商品に規格を足す操作）で足している。"
    if "GROUPING" in sid: w+="カードはカード新規登録の画面で作り、商品への紐づけは既存の商品を開いて『カード指定』で行う。"
    return (B_GOODS,w)
run("A17-05",a1705)

def f0504(sid,old):
    if sid.endswith("NOT-FOUND-043"): return ("M03-02 L0075〜L0077","商品を作らない（商品ID 999999が0件であることを確かめ、あれば削除するだけ）。")
    if "SUPPLY" in sid: return (B_CARD+"、M03-27 L0092",CARDNOTE+"サプライ商品はグッズ商品CSV登録で作っている。")
    return (B_CARD,CARDNOTE)
run("F05-04",f0504)

def m0306(sid,old):
    if sid.endswith("ZERO-008"): return ("M03-02 L0075〜L0077","商品を作らない（商品ID 999999の商品登録編集画面が404になることを確かめるだけ）。")
    return (B_GOODS,"商品はグッズ商品CSV登録で作っていて、商品登録画面では作っていない。商品登録編集画面は規格設定へ進む入口として既存の商品を開くだけ。")
run("M03-06",m0306)

def m0328(sid,old):
    if "CASE-02" in sid: return ("M03-02 L0075〜L0077","商品を作らない。商品タグ更新CSVの列数不一致を確かめるファイルを作るだけ。")
    if "QB-CSV" in sid: return ("M03-02 L0075〜L0077","商品を作らない。商品タグ更新CSVのファイルを作るだけ（商品IDは商品QB-PRODを作ったあとに書き込む）。")
    w="商品はグッズ商品CSV登録で作っていて、商品登録画面では作っていない。商品登録編集画面は既存の商品の編集（タグの付け外し・割引率・規格のセール設定）にだけ使う。"
    if sid.endswith(("PROD-043","PROD-044")): w+="気づいた誤り（直していない）: 『最新入荷アイテム』のタグを外す編集で『商品を登録』を押すが、商品登録編集画面は割引率が空だと登録できない（functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目）のに、割引率を選ぶ記述が無い。グッズ商品CSVには割引率の列が無い。"
    return (B_GOODS,w)
run("M03-28",m0328)
