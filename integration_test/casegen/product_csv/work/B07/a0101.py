import re
L=[l.rstrip("\n").split("\t") for l in open("in/A01-01.tsv",encoding="utf-8")]
H=L[0]; ix={h:i for i,h in enumerate(H)}
PAREN="（登録と同時にスマレジ試験環境へ商品が登録され、店舗ごと・在庫場所ごとの在庫が0で、店頭受取分ではない在庫として作られる）"
def csv(code, base=1000, buy=100):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
     f"（商品IDは空・商品コードは「{code}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「{code}」・商品名(英)は「{code}」・サイズ1・重量1"
     "・商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）・購入グループ名称は既存の購入グループの名称"
     f"・基準価格{base}・販売価格{base}・買取価格{buy}・原価単価0・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。")
def search(code, label=None):
    s=f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
    if label: s+=f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。商品マスター(検索結果)の行から"
    else: s+="商品マスター(検索結果)の行から"
    return s+"商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
def edit(scode, num=""):
    return (f"商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面でスマレジ連携フラグに「連携する」、スマレジ商品コードに「{scode}」{num}、部門に選択肢の先頭を入れて「商品規格を登録」を押す"+PAREN)
def new(code, scode, label=None, base=1000, buy=100, num=""):
    return csv(code,base,buy)+search(code,label)+edit(scode,num)

# A: standard
RA=re.compile(r"商品登録画面で、カード詳細を持たない商品（[^）]*）を公開状態で1件登録し、続けて商品規格登録画面で、商品コード=([^、]+)、スマレジ連携フラグ=連携する、スマレジ商品コード=([^、]+)、部門=任意の有効な部門、基準価格=任意の金額を入れて「商品規格を登録」を押す"+re.escape(PAREN))
# AA
RAA=re.compile(r"商品登録画面で、カード詳細を持たない商品（[^）]*）を公開状態で1件登録し、続けて商品規格登録画面で、商品コード=([^、]+)、スマレジ連携フラグ=連携する、スマレジ商品コード=([^、（]+)（数値）、部門=任意の有効な部門、基準価格=1000、販売価格=1000、買取価格=100を入れて「商品規格を登録」を押す。商品規格登録画面に表示された商品IDを控える（〔([^〕]+)〕）"+re.escape(PAREN))
# B pick first
RB=re.compile(r"管理画面の商品登録画面で、カード詳細を持たない商品（[^）]*）を公開状態で1件登録し、続けて商品規格登録画面で、スマレジ連携フラグ=連携する、スマレジ商品コード=([^、]+)、部門=任意の有効な部門、基準価格=任意の金額を入れて「商品規格を登録」を押す（登録と同時にスマレジ試験環境へ商品が登録され、店舗ごと・在庫場所ごとの在庫が0で作られる）")
RB2=re.compile(r"商品登録画面でカード詳細を持たない商品を公開状態でもう1件登録し、商品規格登録画面でスマレジ連携フラグ=連携する、スマレジ商品コード=([^、]+)、部門=任意の有効な部門、基準価格=任意の金額を入れて「商品規格を登録」を押す")
PAREN_B="（登録と同時にスマレジ試験環境へ商品が登録され、店舗ごと・在庫場所ごとの在庫が0で作られる）"
out=[]
for r in L[1:]:
    t=r[ix["投入方法"]]; n=t; cnt=0
    def fa(m):
        global cnt; cnt+=1
        return new(m.group(1),m.group(2))
    n=RA.sub(fa,n)
    def faa(m):
        global cnt; cnt+=1
        return new(m.group(1),m.group(2),label=m.group(3),num="（数値）")
    n=RAA.sub(faa,n)
    def fb(m):
        global cnt; cnt+=1
        c=m.group(1)
        return csv(c)+search(c)+edit(c).replace(PAREN,PAREN_B)
    n=RB.sub(fb,n)
    def fb2(m):
        global cnt; cnt+=1
        c=m.group(1)
        return csv(c)+search(c)+edit(c).replace("を押す"+PAREN,"を押す")
    n=RB2.sub(fb2,n)
    # B variant: wrap first-case: 管理画面の prefix
    if cnt==0 or "商品登録画面で" in n.replace("商品登録編集画面","").replace("商品規格登録編集画面",""):
        print("UNMATCHED",r[0],cnt)
    out.append((r[0],cnt,n))
import json
json.dump(out,open("work/B07/a0101.json","w"),ensure_ascii=False)
print(len(out),[o[1] for o in out])
