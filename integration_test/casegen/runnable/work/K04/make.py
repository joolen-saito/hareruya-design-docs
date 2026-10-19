import re,sys
R='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/'
H="種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由"
CONF="表示された確認モーダルでアップロードを確定"
def load(n):
    ls=[l.rstrip('\n').split('\t') for l in open(R+f'kept/in/{n}.tsv',encoding='utf-8')]
    return [dict(zip(ls[0],r)) for r in ls[1:] if r]
def write(n,out):
    with open(R+f'kept/out/{n}.tsv','w',encoding='utf-8') as f:
        f.write(H+"\n")
        for o in out: f.write("\t".join(o)+"\n")

def add_modal(t):
    # 「CSVファイルのアップロード」を押 + (す|して) の直後に確認モーダルの確定を挿入
    def rep(m):
        tail=m.group(1)
        if tail=='す': return '「CSVファイルのアップロード」を押し、'+CONF+'する'
        return '「CSVファイルのアップロード」を押し、'+CONF+'して'
    new,k=re.subn(r'「CSVファイルのアップロード」を押(す|して)',rep,t)
    return new,k
out=[]
for n in ['F03-07','F03-08']:
    out=[]
    for r in load(n):
        t=r['今の文']; new,k=add_modal(t)
        if r['項目'].startswith('割引率'):
            a='商品公開ステータスを「非公開」にして「商品を登録」を押す'
            assert t.count(a)==1
            new=new.replace(a,'商品公開ステータスを「非公開」にし、割引率を販売割引率に登録済みのものから選び、「商品を登録」を押す')
        assert k==t.count('「CSVファイルのアップロード」を押'),(r['対象ID'],k)
        assert k>=1
        ne=("M03-27 L0092（CSVファイルのアップロードは押下後に確認モーダルを表示）"
            +("・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）" if '割引率' in r['項目'] else ""))
        reason=''
        if r['項目'].startswith('割引率'):
            reason='割引率は元のシードが指定していないため、販売割引率に登録済みのものから選ぶと書いた'
        out.append(['シード',r['対象ID'],r['列'],'直す',new,ne,reason])
    write(n,out)

# F04-02
I=load('F04-02'); out=[]
CSVT=("管理画面のグッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"+CONF+
"する（商品IDは空・商品コードは「{code}」・商品名(日)は「{nm}」・商品名(英)は「{nm}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）・購入グループ名称は既存の購入グループの名称・基準価格は{pr}・販売価格は{pr}・買取価格は1・原価単価は1・販売制限数は空・部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。")
for r in I:
    sid=r['対象ID']; t=r['今の文']
    if sid.startswith('S-F04-02-PA-ORDER'):
        m=re.search(r'管理画面の商品登録編集画面で、商品名に「([^」]+)」、商品コードに「([^」]+)」、販売価格に(\d+)円、販売種別に先頭の商品種別を入れ、購入制限数は入れず、公開にして登録し、',t)
        seg=m.group(0)
        new=t.replace(seg,CSVT.format(code=m.group(2),nm=m.group(1),pr=m.group(3))+'')
        ne="M03-27 L0092・L0119・L0124・L0129・Excel L0194〜L0238（列）。ee: src/Eccube/Repository/ProductClassRepository.php insertProductClass（販売種別は固定でSALE_TYPE_NORMAL=1を付ける）、app/DoctrineMigrations/sql/baseline_database_records.sql L6003〜L6005（販売種別id=1が先頭でsort_no=0）"
        reason="グッズ商品CSVが付ける販売種別（id=1）がマスターの先頭の販売種別と同じなので、CSVだけで元の「先頭の商品種別」になる。購入制限なしは販売制限数の列を空にして表した。買取価格・原価単価は元のシードに値が無いため、販売価格以下の1にした。気づいた点（直していない）: 元の文の在庫変更CSV取り込みのあとに、承認一覧での承認（product_csv/PROMPT.mdの在庫の書き方）が書かれていないため、在庫が反映されない恐れがある"
        out.append(['シード',sid,'投入方法','直す',new,ne,reason])
    elif sid in('S-F04-02-L-ORD-080','S-F04-02-L-ORD-081'):
        m=re.search(r'管理画面の商品登録編集画面で、商品名にケース専用の名称、商品コードに「([^」]+)」、販売価格に(\d+)円、販売種別に宅配便とゆうパックの両方が選べる販売種別を入れ、公開にして登録し、',t)
        seg=m.group(0)
        code=m.group(1)
        csv=CSVT.format(code=code,nm='連携商品'+code.replace('-',''),pr=m.group(2))
        db="グッズ商品CSVには販売種別の列が無く、取り込みはマスターの先頭の販売種別を規格に付けるため、配送方法設定の画面で宅配便とゆうパックの両方が紐づく販売種別を確かめ、DBで、この商品の規格の販売種別をその販売種別にする（取り込みが付ける販売種別と同じなら変わらない）。"
        new=t.replace(seg,csv+db)
        ne="M03-27 L0092・L0124・Excel L0194〜L0238（販売種別の列が無い）。ee: src/Eccube/Repository/ProductClassRepository.php insertProductClass（販売種別は固定でSALE_TYPE_NORMAL=1）、baseline_database_records.sql L6003〜L6005（id=1が先頭）と同L10754〜L10766（配送方法ゆうパック=id3は販売種別1、サンプル宅配=id2は販売種別2）"
        reason="宅配便とゆうパックの両方が紐づく販売種別が、取り込みの付ける販売種別（id=1）と同じか、シード・設計書・初期データの範囲では確定できなかった（初期データにはゆうパックがid=1、「宅配便」の名の配送方法は無く「サンプル宅配」がid=2）。そのため画面+DBとし、同じなら変わらない書き方にした。商品名(日)(英)は元が「ケース専用の名称」のため商品コードから作った。買取価格・原価単価は元に値が無く販売価格以下の1にした。気づいた点（直していない）: 元の文の在庫変更CSV取り込みのあとに承認の操作が書かれていない"
        out.append(['シード',sid,'投入方法','直す',new,ne,reason])
    elif sid in('S-F04-02-POINT-FULL-049','S-F04-02-ZERO-TOTAL-103'):
        m=re.search(r'管理画面の商品登録編集画面で、商品名にケース専用の名称、商品コードに「([^」]+)」、販売価格・送料・手数料の合計が1400円となる額を入れ、公開にして登録し、',t)
        seg=m.group(0); code=m.group(1)
        if sid.endswith('049'):
            fee="配送方法設定の画面でこの会員の配送先宛ての送料を、支払方法設定の画面で6種類の支払方法のうち最初にご注文方法指定画面で選ばれるものの手数料を確かめ、販売価格（税込み）・送料・手数料の合計が1400円になる額"
        else:
            fee="配送方法設定の画面でこの会員の配送先宛ての送料を、支払方法設定の画面でコンビニ決済の手数料を確かめ、販売価格（税込み）・送料・手数料の合計が1400円になる額"
        nm='連携商品'+code.replace('-','')
        csv=CSVT.format(code=code,nm=nm,pr='「'+fee+'」').replace('基準価格は「','基準価格は「').replace('は「「','は「')
        csv=csv.replace('基準価格は「'+fee+'」・販売価格は「'+fee+'」','基準価格と販売価格はどちらも、'+fee)
        csv=csv.replace('基準価格と販売価格はどちらも、'+fee+'・買取価格','基準価格と販売価格はどちらも、'+fee+'を入れる。買取価格')
        new=t.replace(seg,csv)
        ne="M03-27 L0092・L0119・L0124・Excel L0194〜L0238。product_csv/PROMPT.md「送料・手数料から価格を逆算する」（値がどこにも無いときの書き方）。F04-02 L0319（価格は税込み）"
        reason="送料・手数料の値は、この機能のシード表にも共通環境にも無い（試験環境の初期データ任せ）ため、画面で確かめて合計1400円にする書き方にした。"+("049は6種類の支払方法を表示にしており手数料は支払方法ごとに違うため、合計1400円が成り立つのは確かめた支払方法を選んだときだけで、ケースが支払方法を選び替える手順の前後で前注文金額1400円が保たれるかは確認が要る。" if sid.endswith('049') else "")+"買取価格・原価単価は元に値が無く1にした。気づいた点（直していない）: 元の文の在庫変更CSV取り込みのあとに承認の操作が書かれていない"
        out.append(['シード',sid,'投入方法','直す',new,ne,reason])
    else: raise SystemExit(sid)
write('F04-02',out)
