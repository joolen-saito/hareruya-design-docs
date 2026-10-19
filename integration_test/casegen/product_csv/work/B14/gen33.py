import re,sys
rows=[l.rstrip('\n').split('\t') for l in open('in/M03-33.tsv')]
hdr,rows=rows[0],rows[1:]
P_RE=re.compile(r'^商品登録画面で商品名と商品名\(英\)に(?:任意の名称（例: (?P<n1>.+?)）|「(?P<n2>.+?)」)を入れ、カテゴリを1つ選び、(?P<tag>タグで「取込前タグ」だけを選び|タグは選ばず)、(?:公開状態で「公開」を選び、)?「商品を登録」ボタンを押し、登録後の商品登録画面に表示された商品IDを控える（(?P<lp>〔[^〕]+〕)）$')
C_RE=re.compile(r'^その商品の「この商品の規格を確認」から商品規格一覧を開いて「新規登録」を押し、商品規格登録画面で商品コードに(?P<code>[^、]+)、基準価格に(?P<base>\d+)、販売価格に(?P<sell>\d+)、買取価格に(?P<buy>\d+)(?:、帯URLに(?P<belt>[^、]+?)を入れ|を入れ)、高額商品コード(?P<hpc>に任意の値（例: 商品コードと同じ値）を入れ|は空のままにし)、セールフラグにチェックを(?P<sale>入れず|入れ)、スマレジ連携フラグで「連携しない」を選び、言語と公開ステータスは選択肢から選んで、「商品規格を登録」ボタンを押し、登録後の商品規格登録画面に表示された商品規格IDを控える（(?P<lc>〔[^〕]+〕)）$')
if __name__=='__main__':
    for r in rows:
        ss=r[5].split('。')
        seq=''.join('P' if P_RE.match(s) else 'C' if C_RE.match(s) else '' for s in ss)
        left=[s[:60] for s in ss if (('商品登録画面で' in s or '新規登録」を押し' in s) and not (P_RE.match(s) or C_RE.match(s)))]
        print(r[0],seq,left)
