from common import *
ix,rows=load("M03-23")
R={r[0]:r for r in rows}
out={}
def multi_csv(rows_):
    n=len(rows_)
    head=("グッズ商品CSV登録で雛形ファイルをダウンロードし、"+f"{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
          f"（各行共通: 商品IDは空・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・原価単価10・地域別販売制限は0（日英の両サイト）・部門IDは空。")
    parts=[]
    for k,d in enumerate(rows_,1):
        parts.append(f"{k}行目は 商品コード=「{d['code']}」、商品名(日)=「{d['jp']}」、商品名(英)=「{d['en']}」、基準価格=「{d['base']}」、販売価格=「{d['base']}」、買取価格=「{d['buy']}」")
    return head+"。".join(parts)+"）。グッズ商品は、各行の商品ごとに状態ニアミントの規格が1件作られる。"
def loop_spec(n, prod_edit="", extra=""):
    return (f"取り込んだ{n}件それぞれについて、商品マスター(検索入力)で商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、{prod_edit}"
            f"「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミント・日本語の規格の行から商品規格登録編集画面を開き、{extra}部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
WHY=("元のシードは商品登録編集で商品を作り、続けて規格設定から規格を足していた。商品はグッズ商品CSV登録で作り、取り込みで作られたニアミント・日本語の規格を規格の画面で直す形にした。"
     "元のシードの『そのほかの必須項目には任意の有効な値』『基準価格・買取価格・部門を入れ』は、CSVの必須列の都合で、基準価格・販売価格は1000、買取価格は100（買取価格は販売価格を上回れない M03-27 L0119）、部門は選択肢の先頭にした。"
     "商品名(英)・商品コードは元のシードで指定が無いものを商品名(日)や識別子から決めた。商品カテゴリはサプライ・グッズ（取り込みはその配下しか選べない M03-27 L0123）。"
     "取り込みで作られる規格の価格履歴は、元のシードが規格の登録時に作っていた履歴と同じく変更後価格つきで1件できる（M03-27 L0170）。")
def done(sid,new,why,eb=""):
    out[sid]=[sid,"直す",new,"",BASIS+"、M03-09 L0059〜L0062・L0086〜L0087・L0189"+eb,why]
def region(old,a,b):
    i=old.index(a); j=old.index(b,i); return i,j
def get(sid): return R[sid][ix["投入方法"]]

# ---- FILTER / DPEXP / DPLANG (カードを付ける型) ----
CARDSENT="カード詳細(登録・編集・削除)でカード名(日)・カード名(英)・点数で見たマナ・コストを入れ、詳細情報にカードセット・レアリティ・レイアウト・プロモ種別・Foil・フレームを選んで「登録」を押す。"
def card_proc(codewords, namewords, langwords, catwords, extra_edit=""):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
      f"（商品IDは空・商品コードは{codewords}・商品名(日)と商品名(英)は{namewords}・言語(ID)は{langwords}・商品公開ステータスは下記の値（1 非公開／2 公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・基準価格1000・販売価格1000・買取価格100・原価単価10・地域別販売制限は0（日英の両サイト）・部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。"
      "商品マスター(検索入力)で商品コードにCSVに書いた商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開く。「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカードの詳細情報を選び、カード指定で自動で入った商品名(日)・商品名(英)をCSVに書いた値に入れ直す。"
      +catwords+"割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
      "続けて「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミントの規格の行から商品規格登録編集画面を開き、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す（セールフラグは付けない。取り込みで規格が1件作られると、その規格の価格履歴が変更後価格つきで1件できる）。")

sid="S-M03-23-FILTER"; old=get(sid)
i,j=region(old,"商品は1件ずつ次の操作で作る。","値は次のとおり入れる。")
proc=("商品は1件ずつ次の操作で作る。"+CARDSENT+card_proc(
   "下記の識別子（状態がその他の3件だけ識別子の末尾に「-CSV」を付けた値）",
   "組の語と識別子をハイフンでつないだ名前（例: CATSET-CAT-PARENT-001）",
   "下記の言語のID（指定が無いものは日本語のID）",
   "商品カテゴリは下記の値にし（CATSETの3件はサプライ・グッズの選択を外して下記のカテゴリを選び、ほかの商品はサプライ・グッズのままにする）、"))
tail=("状態がその他の3件（CUSTOM-OK-001・CUSTOM-STATUS-DIFF-001・CUSTOM-RARITY-DIFF-001）は、上の規格の画面の操作のあとに、商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態にその他、状態名に任意の値、商品コードに識別子、基準価格に1000、販売価格に1000、買取価格に100を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
      "そのあと、取り込みで作られたニアミントの規格（商品コードは識別子に「-CSV」を付けた値）の行から商品規格登録編集画面を開き、「商品規格を削除」ボタンを押し、その規格の価格履歴（変更前価格が空のもの）はDBから直接削除する。")
new=old[:i]+proc+old[j:]+tail
assert "商品登録編集では" not in new
done(sid,new,WHY+"ケースに影響: 状態がその他の3件は、取り込みでニアミントの規格が余るので、その他の規格を足してからニアミントの規格と履歴を削除する。商品コードが重ならないよう取り込み側に『-CSV』を付けた。規格の削除が許されない場合・削除した規格の履歴が検索に残る場合は、公開状態・レアリティ・状態の絞り込みのケースが崩れる。")

for sid,tag,lang in [("S-M03-23-DPEXP-041","EXP","日本語のID"),("S-M03-23-DPLANG-042","LANG","下記の言語のID")]:
    old=get(sid)
    i,j=region(old,"商品は1件ずつ次の操作で作る。","値は次のとおり入れる。")
    codewords="下記の各識別子"
    namewords=f"下記の名前（「M0323-04{1 if tag=='EXP' else 2}-{tag}商品」に識別子を続けた名前）"
    proc=("商品は1件ずつ次の操作で作る。"+(CARDSENT)+card_proc(codewords,namewords,lang,""))
    # 商品公開ステータスは公開のみ
    proc=proc.replace("商品公開ステータスは下記の値（1 非公開／2 公開）","商品公開ステータスは2（公開）")
    new=old[:i]+proc+old[j:]
    done(sid,new,WHY)

# ---- KEYWORD ----
sid="S-M03-23-KEYWORD"; old=get(sid)
i,j=region(old,"商品は1件ずつ次の操作で作る。","値は次のとおり入れる（")
seg=old[i:j]
k0=seg.index("カード名を持たせる商品だけ"); k1=seg.index("商品登録編集では"); k2=seg.index("どの商品も商品公開ステータス=公開")
cardonly=seg[k0:k1]; tail_=seg[k2:]
krows=[("OR-JP-001","ORKEY日本語商品","KW-OR-JP-001"),("OR-EN-001","KW日本語-OR-EN-001","ORKEY English Product"),("OR-CARD-001","KW日本語-OR-CARD-001","KW-OR-CARD-001"),
 ("ORKEY-OR-CODE-001","KW日本語-OR-CODE-001","KW-OR-CODE-001"),("OR-MEMO-001","KW日本語-OR-MEMO-001","KW-OR-MEMO-001"),("AND-BOTH-001","ALPHA商品-AND-BOTH-001","KW-AND-BOTH-001"),
 ("AND-ALPHA-001","ALPHA商品-AND-ALPHA-001","KW-AND-ALPHA-001"),("AND-BETA-001","BETA商品-AND-BETA-001","KW-AND-BETA-001"),("PERCENT-001","100%商品","KW-PERCENT-001"),("UNDERSCORE-001","KW日本語-UNDERSCORE-001","KW-UNDERSCORE-001")]
proc=("商品は1件ずつ次の操作で作る。"+cardonly
  +multi_csv([dict(code=c,jp=a,en=b,base=1000,buy=100) for c,a,b in krows])
  +"取り込んだ10件のうち、OR-CARD-001は商品マスター(検索入力)で商品コードに「OR-CARD-001」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカードの詳細情報を選び、カード指定で自動で入った商品名(日)・商品名(英)をCSVに書いた値に入れ直し、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
  +"OR-MEMO-001・AND-BOTH-001・UNDERSCORE-001は同じ要領で商品登録編集画面を開き、ショップ用メモ欄にそれぞれ「ORKEY」「BETA」「UNDER_SCORE」を入れ、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
  +loop_spec(10)+tail_)
new=old[:i]+proc+old[j:]
done(sid,new,WHY+"商品名・商品名(英)は、元のシードが『ORKEYを含む名前』などと条件だけを書いていたので、条件に合う値を決めた（ORKEY・ALPHA・BETA・%・_ は指定の商品にだけ入れ、ほかは『KW日本語-識別子』『KW-識別子』）。ショップ用メモ欄はCSVに列が無いので、取り込んだあと編集画面で入れる。")

# ---- RANGE ----
sid="S-M03-23-RANGE"; old=get(sid)
i,j=region(old,"商品6件を1件ずつ次の操作で作る。","どの商品も商品名に「RANGESET」")
rr=[("SALE-MATCH-001",1400,100),("SALE-OLD-001",1500,100),("BUY-ONLY-RANGE-001",1000,300),("BUY-MATCH-001",1000,400),("BUY-OLD-001",1000,500),("SELL-ONLY-RANGE-001",1700,100)]
proc="商品6件を次の操作で作る。"+multi_csv([dict(code=c,jp="RANGESET商品-"+c,en="RANGESET Product "+c,base=b,buy=u) for c,b,u in rr])+loop_spec(6)
new=old[:i]+proc+old[j:]
assert "商品規格の登録時にできた価格履歴6件" in new
new=new.replace("商品規格の登録時にできた価格履歴6件","取り込みでできた価格履歴6件")
done(sid,new,WHY+"元のシードは買取価格を変える商品（BUY-*）の基準価格を指定していなかったので1000にした（『基準価格は買取価格より大きい値にする』を満たす）。販売価格を変える商品（SALE-*・SELL-*）の買取価格は100にした。")

# ---- DATE ----
sid="S-M03-23-DATE"; old=get(sid)
i,j=region(old,"商品4件を1件ずつ次の操作で作る。","どの商品も商品名に「DATESET」")
dr=["DATE-BEFORE-001","DATE-START-001","DATE-END-001","DATE-AFTER-001"]
proc="商品4件を次の操作で作る。"+multi_csv([dict(code=c,jp="DATESET商品-"+c,en="DATESET Product "+c,base=1000,buy=100) for c in dr])+loop_spec(4)
done(sid,old[:i]+proc+old[j:],WHY)

# ---- CORE ----
sid="S-M03-23-CORE"; old=get(sid)
i,j=region(old,"商品4件を1件ずつ次の操作で作る。","どの商品も商品コードに識別子")
cr=[dict(code="HIST-DISPLAY-001",jp="履歴表示商品",en="History Display Product",base=1000,buy=600),
    dict(code="HIST-BUY-ONLY-001",jp="履歴基本商品-HIST-BUY-ONLY-001",en="History Core Product HIST-BUY-ONLY-001",base=1000,buy=300),
    dict(code="HIST-SELL-ONLY-001",jp="履歴基本商品-HIST-SELL-ONLY-001",en="History Core Product HIST-SELL-ONLY-001",base=1300,buy=100),
    dict(code="MULTI-001",jp="履歴基本商品-MULTI-001",en="History Core Product MULTI-001",base=1000,buy=100)]
proc="商品4件を次の操作で作る。"+multi_csv(cr)+loop_spec(4,extra="（HIST-DISPLAY-001だけは、先にセールフラグにチェックを入れ、販売価格に1200を入れる）")
# loop_spec の extra は部門の前に入る
proc=proc.replace("（HIST-DISPLAY-001だけは、先にセールフラグにチェックを入れ、販売価格に1200を入れる）","HIST-DISPLAY-001だけは、セールフラグにチェックを入れ、販売価格に1200を入れ、")
new=old[:i]+proc+old[j:]
o1="HIST-DISPLAY-001: 商品名「履歴表示商品」、言語=日本語で、セールフラグを付けて基準価格1000・販売価格1200・買取価格600で商品規格を登録する（登録者はログイン中の M03-23試験管理者 になる）。"
assert o1 in new
n1=("HIST-DISPLAY-001: 商品名「履歴表示商品」、言語=日本語で、取り込んだあと規格の画面でセールフラグを付けて販売価格1200を入れ、基準価格1000・販売価格1200・買取価格600の商品規格にする（登録者はログイン中の M03-23試験管理者 になる）。"
    "取り込みでできた価格履歴（変更前価格が空のもの）はDBから直接削除し、規格の編集でできた価格履歴を1件だけ残して、その履歴の変更後基準価格を1000、変更後販売価格を1200、変更後買取価格を600にDBで直接設定する。")
new=new.replace(o1,n1)
assert "HIST-BUY-ONLY-001とHIST-SELL-ONLY-001の、商品規格の登録時にできた" in new
new=new.replace("HIST-BUY-ONLY-001とHIST-SELL-ONLY-001の、商品規格の登録時にできた","HIST-BUY-ONLY-001とHIST-SELL-ONLY-001の、取り込みでできた")
done(sid,new,WHY+"HIST-DISPLAY-001の販売価格1200は、取り込みの新規の規格が販売価格を基準価格にする（M03-09 L0086〜L0087）ため、規格の画面でセールフラグを付けて入れる。ケースに影響: この規格の編集で価格履歴が1件増えるので、取り込みでできた履歴を削除して編集でできた履歴1件に変更前後の値を設定し直す手順を足した。他の3商品の名前は元のシードに指定が無いので『履歴基本商品-識別子』にした。")

# ---- INBOUND ----
sid="S-M03-23-INBOUND"; old=get(sid)
i,j=region(old,"商品2件を次の操作で作る。","1件目の商品には、商品規格登録編集で")
ir=[dict(code="INBOUND-A-NM",jp="遷移検索商品A",en="Transition Search Product A",base=1000,buy=100),dict(code="INBOUND-B-NM",jp="遷移検索商品B",en="Transition Search Product B",base=1000,buy=100)]
proc="商品2件を次の操作で作る。"+multi_csv(ir)+loop_spec(2)
new=old[:i]+proc+old[j:]
o2="1件目の商品には、商品規格登録編集で状態がNM・SP・HPの商品規格を1件ずつ計3件登録する（価格履歴が状態ごとに1件できる）。2件目の商品には商品規格を1件登録する。"
assert o2 in new
n2=("1件目の商品には、商品規格一覧の「新規作成」を押し、商品規格登録編集で言語に日本語、状態にスライトリープレイド（SP）、商品コードに「INBOUND-A-SP」、基準価格・販売価格に1000、買取価格に100を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押し、同じ要領で状態にヘビープレイド（HP）、商品コードに「INBOUND-A-HP」の規格も足す。NMの規格は取り込みで作られているので、これで状態がNM・SP・HPの商品規格が1件ずつ計3件になる（価格履歴が状態ごとに1件できる）。2件目の商品の規格は取り込みで作られた1件のままにする。")
new=new.replace(o2,n2)
done(sid,new,WHY+"商品名・商品コードは元のシードに指定が無いので『遷移検索商品A/B』『INBOUND-A-NM』などに決めた（INBOUND-NONEを含めない条件を満たす）。")

# ---- SORT ----
sid="S-M03-23-SORT"; old=get(sid)
i,j=region(old,"商品2件を次の順で作る。","どちらも商品名に「SORTSET」")
proc=("商品2件を次の順で作る。"
  +csv_one("SORT-001","SORTSET商品-1","SORTSET Product 1",1000,1000,100)+open_prod("SORT-001")+spec_fix()
  +csv_one("SORT-002","SORTSET商品-2","SORTSET Product 2",1000,1000,100)+open_prod("SORT-002")+spec_fix())
done(sid,old[:i]+proc+old[j:],WHY+"ケースに影響: 元のシードは商品と規格を1件ずつ順に登録していた。ここでも1件目の取り込みと規格の画面の操作を終えてから2件目を取り込むので、規格IDの大小は変わらない。")

# ---- RETAIN / CORRECT ----
sid="S-M03-23-RETAIN"; old=get(sid)
i,j=region(old,"商品登録編集で商品名・商品名(英)","どの商品も商品名に「RETAIN」")
rows_=[dict(code=f"RETAIN-{n:03d}",jp=f"RETAIN RESET商品-{n:03d}",en=f"RETAIN RESET Product {n:03d}",base=1000,buy=100) for n in range(1,12)]
proc=multi_csv(rows_)+"行はRETAIN-001からRETAIN-011の順に並べる。"+loop_spec(11)
done(sid,old[:i]+proc+old[j:],WHY+"ケースに影響: 元のシードは1件ずつ登録して商品規格IDを昇順に振っていた。ここは1つのCSVの行順で取り込むので、行順どおりに規格IDが昇順に振られることが前提（取り込みの作成順の記述は設計書に無い）。崩れる場合はCSVを1行ずつに分ける。")
sid="S-M03-23-CORRECTION-033"; old=get(sid)
i,j=region(old,"商品登録編集で商品名・商品名(英)","どの商品も商品名に「CORRECTSET」")
letters="ABCDEFGHIJK"
rows_=[dict(code=f"M0323-033-{c}",jp=f"CORRECTSET商品-{c}",en=f"CORRECTSET Product {c}",base=1000,buy=100) for c in letters]
proc=multi_csv(rows_)+"行はM0323-033-AからM0323-033-Kの順に並べる。"+loop_spec(11)
done(sid,old[:i]+proc+old[j:],WHY+"ケースに影響: 元のシードは1件ずつ登録して最初の商品の規格IDを最小にしていた。ここは1つのCSVの行順で取り込むので、行順どおりに規格IDが昇順に振られることが前提（取り込みの作成順の記述は設計書に無い）。崩れる場合はCSVを1行ずつに分ける。")

results=[out[r[0]] for r in rows]
write_out("M03-23",results)
print(len(results))
