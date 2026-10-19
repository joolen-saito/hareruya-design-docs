import re
R="/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/"
CAT="商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
MODAL="、表示された確認モーダルでアップロードを確定する"
UP="「CSVファイルのアップロード」を押す"
DISC="割引率を販売割引率に登録済みのものから選び"
def load(f):
    ls=open(R+f"kept/in/{f}.tsv",encoding="utf-8").read().split("\n")
    return [l.split("\t") for l in ls[1:] if l]
def csvrow(code,name,extra="",prices="基準価格1000・販売価格1000・買取価格100・原価単価10"):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで"+UP+MODAL+
      f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{name}」・商品名(英)は「{name}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・{prices}{extra}・部門IDは空）")
out={}
def res(f,i,verdict,new="",basis="",reason=""):
    out.setdefault(f,{})[i]=(verdict,new,basis,reason)

# F04-03
f="F04-03"; rows=load(f)
for i,c in enumerate(rows):
    t=c[4]
    m=re.search(r"管理画面の商品登録編集画面で、商品名に「([^」]+)」、商品コードに「([^」]+)」、販売価格に1000円、販売種別に先頭の商品種別を入れ、購入制限数は入れず、公開にして登録(し、|する。)",t)
    assert m,c[2]
    new=t.replace(m.group(0), csvrow(m.group(2),m.group(1),"・販売制限数は空")+"。グッズ商品CSVの取り込みが規格に付ける販売種別は先頭の商品種別（販売種別の並びの先頭）と同じなので、販売種別の指定は要らない。")
    res(f,i,"直す",new,"M03-27 L0092・L0124・L0194〜L0238。実装 ec-cube-enterprise src/Eccube/Repository/ProductClassRepository.php insertProductClass（販売種別は SaleType::SALE_TYPE_NORMAL=1 で固定）、src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php L668-L692。SALE_TYPE_NORMAL=1 は販売種別の並び順0（先頭）：eccube_db_20260907.sql.gz の販売種別マスター","product_csv は販売種別の列が無いとして直せないとしたが、ee の取り込みは常に先頭の販売種別（id1・並び順0）で規格を作るので、CSVだけで元の「先頭の商品種別」になる。気づいた誤り（直していない）: 在庫変更CSV登録の取り込みに承認の操作が書かれていない。")
out[f]=out[f]
# F04-04
f="F04-04"; rows=load(f)
t=rows[0][4]
old="管理画面の商品登録画面で、商品名に「F0404-UNLIM-050」、商品コードに「F0404-UNLIM-050」、公開状態に「公開」、在庫数無制限にチェックを入れる、販売価格など残りの必須項目に任意の有効な値を入れて登録ボタンを押す。"
assert old in t
old2="在庫数は画面で指定できないためDBで商品コード「F0404-UNLIM-050」の在庫数を1に直接設定する。"
assert old2 in t
new=t.replace(old,csvrow("F0404-UNLIM-050","F0404-UNLIM-050")+"。").replace(old2,"在庫無制限と在庫数は画面で指定できないため（規格の画面に在庫無制限・在庫数の入力欄が無い）、DBで商品コード「F0404-UNLIM-050」の規格の在庫無制限を有効にし、在庫数を1に直接設定する。")
res(f,0,"直す",new,"M03-27 L0092・L0124・L0129・L0194〜L0238、M03-09 L0095・L0097（規格の画面に在庫数・在庫無制限の入力欄が無い）","CSVで作った規格は在庫0・在庫無制限なし。ケース IT-F04-04-050 は在庫無制限そのものを確かめるので、在庫変更CSVで入庫する形にはせず、DBで在庫無制限と在庫数1を直接設定する。")
# F05-03
f="F05-03"; rows=load(f)
t=rows[0][4]
s=t.index("次の6商品を1商品ずつ"); e=t.index("ELIGIBLE-NOSTOCK-024の在庫は登録直後の0のままにする。")
seg=t[s:e]
assert "値は次のとおり。" in seg
newseg=("次の6商品を、グッズ商品CSV登録で6行を書いた1つのCSVにして作る。グッズ商品CSV登録で雛形ファイルをダウンロードし、6行を書いたCSVをCSVファイル選択で選んで"+UP+MODAL+
 f"（どの行も商品IDは空・商品コードと商品名(日)・商品名(英)は商品IDの文字列・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・検索ワードは「F0503-ELIGIBILITY-024」・サイズ1・重量1・{CAT}・原価単価10・部門IDは空。購入グループ名称は、RESERVED-024だけ予約商品フラグが付いた購入グループの名称、ほかの5商品は予約商品フラグが付いていない既存の購入グループの名称。基準価格と販売価格は同じ値で、ELIGIBLE-NOSTOCK-024は基準価格1000・販売価格1000・買取価格1、ELIGIBLE-STOCK-024は基準価格9999・販売価格9999・買取価格600、BUY-ZERO-024は基準価格1000・販売価格1000・買取価格0、STATE-EX-024・HIGH-CODE-024・RESERVED-024は基準価格1000・販売価格1000・買取価格600）。"
 "グッズ商品は状態ニアミントの規格が1件ずつ作られる。値は次のとおり。ELIGIBLE-NOSTOCK-024は販売価格(円)「0」・買取価格(円)「1」・状態「NM」・高額商品コードは空（買取価格は販売価格を上回れないため画面でもCSVでも作れない値なので、取り込んだあとDBで、この商品の規格の販売価格を0円に直接設定する）。ELIGIBLE-STOCK-024は販売価格(円)「9999」・買取価格(円)「600」・状態「NM」・高額商品コードは空。BUY-ZERO-024は買取価格(円)「0」・状態「NM」・高額商品コードは空。"
 "STATE-EX-024は買取価格(円)「600」・状態「EX」・高額商品コードは空（商品規格一覧の「新規作成」から商品規格登録編集画面で、言語は日本語、状態「EX」、商品コードに「STATE-EX-024」、販売価格1000、買取価格600、公開状態を「公開」にして「商品規格を登録」を押してEXの規格を足し、そのあと取り込みが作ったニアミントの規格を商品規格登録編集画面の「商品規格を削除」で削除する。最後の1件の規格は削除できないので、EXを足してから削除する）。"
 "HIGH-CODE-024は買取価格(円)「600」・状態「NM」・高額商品コードに「F0503-HIGH-024」（商品規格一覧から取り込みが作った規格を開いて商品規格登録編集画面で高額商品コードに入れ、「商品規格を登録」を押す）。RESERVED-024は買取価格(円)「600」・状態「NM」・高額商品コードは空。")
new=t.replace(seg,newseg)
res(f,0,"直す",new,"M03-27 L0092・L0119・L0123・L0124・L0194〜L0238、M03-09 L0059・L0152（高額商品コード）・L0159・L0197・L0198（最後の1件の規格は削除できない）","ELIGIBLE-NOSTOCK-024 の販売価格0円・買取価格1円は入力チェックを通らないため、通る値で作ってDBで販売価格を0にした。STATE-EX-024 と高額商品コードの手順は設計書の項目表（M03-09 L0152・L0159）に沿って推定したので、レビューで確認してほしい。EXの規格の商品コードが取り込みの規格と同じ値になる点は、ee の規格編集の実装に商品コードの重複検査が見当たらないため許容と判断した（未実機確認）。")
# F05-03 #1 割引率
t=rows[1][4]
old="除いて「商品を登録」を押す"; assert old in t
res(f,1,"直す",t.replace(old,"除いて、"+DISC+"、「商品を登録」を押す"),"functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）；グッズ商品CSVに割引率の列が無い（M03-27 L0194〜L0238）","元のシードは割引率を指定していないので「販売割引率に登録済みのもの」とした。")
# F06-05
f="F06-05"; rows=load(f)
for i,c in enumerate(rows):
    t=c[4]; assert t.count(UP)==1
    res(f,i,"直す",t.replace(UP,UP+MODAL),"M03-27 L0092（グッズ商品CSVの「CSVファイルのアップロード」は押下後に確認モーダルを表示）","")
# F06-06/07
for f in ["F06-06","F06-07"]:
    rows=load(f)
    for i,c in enumerate(rows):
        t=c[4]
        m=re.search(r"商品新規登録は使えない（アクセスすると404になる）ため、グッズ商品CSV登録で作る。商品名「([^」]+)」・商品コード「([^」]+)」の非公開の商品と規格を1行で記したグッズ商品CSVを、文字コードUTF-8・カンマ区切りで手で作る（ファイル名([^。]+?)。商品IDは空欄[^）]*）。管理画面のグッズ商品CSV登録画面でそのファイルを選んで取り込む。商品規格登録編集画面でその商品の規格を開き、在庫無制限にチェックを入れて登録ボタンを押す。商品編集画面でその商品の商品公開ステータスを「公開」にして登録する。",t)
        assert m,c[2]
        N,C,F=m.groups()
        newseg=(f"グッズ商品CSV登録で作る。商品名「{N}」・商品コード「{C}」の非公開の商品と規格を1行で記したグッズ商品CSVを、文字コードUTF-8・カンマ区切りで手で作る（ファイル名{F}。商品IDは空欄・商品公開ステータスは1（非公開）・商品名(日)と商品名(英)は{N}・商品コードは{C}・言語(ID)は日本語のID・支店の商品公開ステータスは1（公開）・サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・基準価格1000・販売価格1000・買取価格100・原価単価10・部門IDは空）。"
          "管理画面のグッズ商品CSV登録画面でそのファイルを"+"CSVファイル選択で選び、"+UP+MODAL+"。"
          "DBで、この商品の規格の在庫無制限を有効にする（商品規格登録編集画面に在庫無制限の入力欄が無いため）。"
          f"商品編集画面でその商品の商品公開ステータスを「公開」にし、{DISC}、「商品を登録」を押す。")
        res(f,i,"直す",t.replace(m.group(0),newseg),"M03-27 L0092・L0124・L0194〜L0238、M03-09 L0095・L0097（規格の画面に在庫無制限の入力欄が無い）、functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）","元の「販売価格に1000円、基準価格と買取価格は買取価格が販売価格以下になる値」を具体値（基準価格1000・買取価格100）にした。ケースが在庫無制限を使うため、規格の画面ではなくDBで設定する書き方にした。")
# F06-26
f="F06-26"; rows=load(f); t=rows[0][4]; assert t.count(UP)==1
res(f,0,"直す",t.replace(UP,UP+MODAL),"M03-27 L0092","")
# F05-01
f="F05-01"; rows=load(f)
for i,c in enumerate(rows):
    t=c[4]; n=t.count(UP); assert n>=1
    new=t.replace(UP,UP+MODAL)
    items=c[0].split(",")
    basis="M03-27 L0092（グッズ商品CSV）"
    if "カード商品CSV登録画面" in t: basis+="・M03-26 L0094（カード商品CSV。押下後に確認モーダルを表示）"
    if "割引率" in items:
        pat=None
        for p in ["戻して「商品を登録」","選び、「商品を登録」"]:
            if p in new: pat=p;break
        assert pat,c[2]
        new=new.replace(pat,pat[:-7]+"、"*(pat[0]!="選") + DISC+"、「商品を登録」" if pat.startswith("戻") else pat[:-7]+DISC+"、「商品を登録」")
        basis+="・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）"
    res(f,i,"直す",new,basis,"")
# F06-11
f="F06-11"; rows=load(f)
for i,c in enumerate(rows):
    res(f,i,"直さない","", "シードの投入方法の文末に「ネット買取の申込みを行わない」とある"+("（店頭買取は規約同意のチェック・次のページへ進むを記載済み）" if "店頭" in c[2] or "STORE" in c[2] else ""),"ネット買取の申込み（F05-06）の操作が無い。規約同意のチェックとモーダルの「申込み」を足す対象でない。")
# F06-15
f="F06-15"; rows=load(f)
OLD="適格請求発行事業者の確認に「いいえ」を入れて「申込み」ボタンを押す"
NEW="適格請求発行事業者の確認に「いいえ」を入れ、「ネット買取規約同意」にチェックを入れて「申込み」ボタンを押し、表示されたモーダルの「申込み」ボタンを押す"
for i,c in enumerate(rows):
    t=c[4]; assert t.count(OLD)==1
    res(f,i,"直す",t.replace(OLD,NEW),"F05-06 L0060・L0062〜L0066・L0108、rulings.tsv K03 の2つ目の置換（お手本）","")
# F08-02
f="F08-02"; rows=load(f)
t=rows[0][4]; old="ほかの必須項目に任意の有効な値を入れて「申込み」ボタンを押す。⑤"; assert old in t
res(f,0,"直す",t.replace(old,"ほかの必須項目に任意の有効な値を入れ、「ネット買取規約同意」にチェックを入れて「申込み」ボタンを押し、表示されたモーダルの「申込み」ボタンを押す。⑤"),"F05-06 L0060・L0062〜L0066・L0108（ネット買取の申込みは規約同意のチェックとモーダルの「申込み」が要る）","")
res(f,1,"直さない","","買取申込みを行わない（投入方法に「買取申込みも行わない」とある）","ネット買取の申込みの操作が無いので、規約同意を足す対象でない。")
# write
names="F04-03 F04-04 F05-01 F05-03 F06-05 F06-06 F06-07 F06-11 F06-15 F06-26 F08-02".split()
import collections
for f in names:
    rows=load(f); lines=["\t".join(["種別","対象ID","列","判定","新しい文","根拠","理由"])]
    cnt=collections.Counter()
    for i,c in enumerate(rows):
        v,new,basis,reason=out[f][i]
        for x in (new,basis,reason): assert "\t" not in x and "\n" not in x
        lines.append("\t".join([c[1],c[2],c[3],v,new,basis,reason])); cnt[v]+=1
    open(R+f"kept/out/{f}.tsv","w",encoding="utf-8").write("\n".join(lines)+"\n")
    print(f,dict(cnt))
