import re,sys
sys.path.insert(0,'work/B14')
from parse08 import rows,classify
LANG={'日本語':'日本語のID','英語':'英語のID','その他言語':'その他言語のID'}
CAT='サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）'
out=[]
for r in rows:
    ss=r[5].split('。')
    new=[];i=0
    while i<len(ss):
        k,g=classify(ss[i])
        if k=='A':
            X,S=g
            k2,(P,V)=classify(ss[i+1])
            assert k2=='B'
            k3,(Lp,)=classify(ss[i+2]); assert k3=='C'
            k4,(P4,)=classify(ss[i+3]); assert k4=='D' and P4==P
            k5,(n,lang,st,code,price)=classify(ss[i+4]); assert k5=='E' and st=='NM' and n=='1'
            k6,(Lf,)=classify(ss[i+5]); assert k6=='F'
            stat='2（公開）' if V=='公開' else '1（非公開）'
            assert V in('公開','非公開')
            new.append(f'グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（商品IDは空・商品コードは「{code}」・言語(ID)は{LANG[lang]}・商品公開ステータスは{stat}・支店の商品公開ステータスは1（公開）・商品名(日)は「{P}」・商品名(英)は「{P}」・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・基準価格{price}・販売価格{price}・買取価格{price}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）')
            new.append('グッズ商品は状態ニアミントの規格が1件作られる')
            new.append(f'商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（{Lp}）')
            new.append(f'商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード検索ポップアップでカード名『{X}』を検索して、カードセットが『{S}』の行を選ぶ')
            new.append(f'続けて商品名(日)に『{P}』、商品名(英)に『{P}』を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、商品公開ステータスで「{V}」を選んで「商品を登録」ボタンを押す')
            new.append('商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く')
            new.append(f'（1）商品規格一覧で言語{lang}・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で商品コードに『{code}』、基準価格(円)に{price}、販売価格(円)に{price}、買取価格(円)に{price}を入れ、部門は選択肢の先頭を選び、公開ステータスで「公開」を選んで「商品規格を登録」ボタンを押す')
            new.append(ss[i+5])
            i+=6
            # remaining specs of this product
            nxt=classify(ss[i])[0] if i<len(ss) else None
            if nxt=='E':
                new.append('以降の規格は、商品規格一覧の「新規作成」を押して1件ずつ登録する')
            continue
        new.append(ss[i]); i+=1
    out.append((r,'。'.join(new)))
if __name__=='__main__':
    with open('out/F09-08.tsv','w',encoding='utf-8') as f:
        f.write('\t'.join(["シードID","判定","新しい投入方法","新しい状態・属性","根拠","理由"])+'\n')
        for r,n in out:
            assert '\t' not in n and '\n' not in n
            f.write('\t'.join([r[0],'直す',n,'','M03-27 L0092 L0119 L0123 L0124 L0129 L0134 L0196 L0197 L0198、M03-02 L0073 L0075-L0077 L0092 L0146、M03-09 L0123-L0172','元は商品の新規登録画面でカード指定から商品を作っていたので、グッズ商品CSV登録で作り、既存の商品の編集でカードを指定する形に直した。元に商品カテゴリの指定が無く（商品登録編集の必須項目）、単体カードのカテゴリを選ぶと補った（A07-06の直しと同じ）。CSVの基準価格・買取価格は元に定めが無いので販売価格と同額にした（買取価格は販売価格を上回れない M03-27 L0119）。'])+'\n')
