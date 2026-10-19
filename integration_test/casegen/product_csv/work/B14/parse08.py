import re
rows=[l.rstrip('\n').split('\t') for l in open('in/F09-08.tsv')][1:]
RA=re.compile(r'^商品登録編集（新規登録）画面で「カード指定 >」を押し、カード検索ポップアップでカード名『(.+?)』を検索して、カードセットが『(.+?)』の行を選ぶ$')
RB=re.compile(r'^商品名に『(.+?)』を入れ、商品公開ステータスで「(.+?)」を選んで「商品を登録」を押す$')
RC=re.compile(r'^登録後の商品登録編集画面に表示された商品IDを控える（(〔.+?〕)）$')
RD=re.compile(r'^商品『(.+?)』の「規格設定」から商品規格一覧を開き、次の規格を1件ずつ「新規作成」で登録する$')
RE=re.compile(r'^（(\d)）商品規格登録画面で、言語で「(.+?)」、状態で「(.+?)」を選び、商品コードに『(.+?)』、販売価格に(\d+)を入れ、公開ステータスで「公開」を選び、基準価格・買取価格・部門には任意の有効な値を入れて「商品規格を登録」を押す$')
RF=re.compile(r'^登録後の商品規格編集画面に表示された商品規格IDを控える（(〔.+?〕)）$')
def classify(s):
    for n,r in zip('ABCDEF',[RA,RB,RC,RD,RE,RF]):
        m=r.match(s)
        if m: return n,m.groups()
    return None,None
if __name__=='__main__':
    for r in rows:
        ss=r[5].split('。')
        out=[]
        for i,s in enumerate(ss):
            k,g=classify(s)
            if k: out.append(k+(str(g[2]) if k=='E' else ''))
        print(r[0][-3:],''.join(out))
