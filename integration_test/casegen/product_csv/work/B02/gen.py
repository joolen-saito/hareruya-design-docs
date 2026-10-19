import re,sys
P='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/'
lines=open(P+'in/M04-09.tsv',encoding='utf-8').read().split('\n')
hdr=lines[0].split('\t'); rows=[l.split('\t') for l in lines[1:] if l]
ROLE={
 'S-M04-09-MOVE-FINAL':['M409-FIN-DONE','M409-FIN-REJ'],
 'S-M04-09-TRANSFER-FINAL':['M409-TRF-DONE-A','M409-TRF-DONE-TO','M409-TRF-REJ-A','M409-TRF-REJ-TO'],
 'S-M04-09-MOVE-DIFF-BOUNDARY-051':['M409-MOV-A-051','M409-MOV-B-051'],
 'S-M04-09-MOVE-INWAIT-SHORT-059':['M409-MOV-B-059'],
 'S-M04-09-TRANSFER-BOUNDARY-073':['M409-TR-MIN-TO-073','M409-TR-MAX-TO-073'],
}
for n in ('079','082','083','084'): ROLE['S-M04-09-TRANSFER-WAIT-'+n]=[f'M409-TR-A-{n}',f'M409-TR-TO-A-{n}']
for n in ('080','081','085'): ROLE['S-M04-09-TRANSFER-WAIT-'+n]=[f'M409-TR-A-{n}',f'M409-TR-TO-A-{n}',f'M409-TR-B-{n}',f'M409-TR-TO-B-{n}']
SEG=re.compile(r'商品を登録できるメンバーで管理画面にログインし、商品登録画面で商品名(?:に「([^」]*)」)?ほか必須項目を入れて登録し、続けて商品規格登録画面で、商品コード=(.*?)、スマレジ連携フラグ=連携しない、(?:買取価格=(\d+)、)?指定のない(?:基準価格・買取価格|基準価格)ほか必須項目には任意の値を入れて「商品規格を登録」を押す。(?:これを[^。]*。)?')
CAT='サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）'
def csvrow(p):
    return ('商品IDは空・商品コードは「%s」・商品名(日)は「%s」・商品名(英)は「%s」・言語(ID)は%sのID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は%s・購入グループ名称は既存の購入グループの名称・基準価格%d・販売価格%d・買取価格%d・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空'
      %(p['code'],p['csvname'],p['csvname'],'英語' if p['en'] else '日本語',CAT,p['base'],p['base'],p['buy']))
def edit(p):
    if not (p['card'] or p['cat'] or p['hc']): return ''
    s='商品マスター(検索入力)で商品コードに「%s」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、'%p['code']
    if p['card']:
        s+='「カード指定 >」ボタンを押し、カード検索ポップアップで検索結果の先頭の行の決定ボタンを押す（カード指定で商品名(日)・商品名(英)などにカードの値が自動で入る。この値はそのままにする）。続けて、'
    if p['cat']:
        s+='商品カテゴリはサプライ・グッズの選択を外して試験カテゴリAを選び、'
    s+='割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。'
    if p['hc']:
        s+=('商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で高額商品コードに「%s」、基準価格(円)に%d、販売価格(円)に%d、買取価格(円)に%dを入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。'%(p['hc'],p['base'],p['base'],p['buy']))
    return s
def build(sid,m,state):
    topname,codes,buy0=m.group(1),m.group(2),m.group(3)
    ents=codes.split('／商品コード=')
    prods=[]
    for e in ents:
        role=state['role']
        if 'このシード専用に' in e:
            code=role.pop(0); desc=''
        else:
            code=re.split('（',e)[0]; desc=e[len(code):]
        nm=re.search(r'商品名=「([^」]*)」',desc)
        bp=re.search(r'基準価格=(\d+)',desc)
        base=int(bp.group(1)) if bp else 1000
        buy=int(buy0) if buy0 else base
        name=topname or (nm.group(1) if nm else code)
        card='カード詳細検索でカード詳細を紐付ける' in desc
        prods.append(dict(code=code,csvname=code if card else name,en='言語=英語' in desc,base=base,buy=buy,card=card,
            cat='カテゴリ=試験カテゴリA' in desc,hc=None,desc=desc,nofoil='紐付けない' in desc))
        if '高額商品コード' in desc and '任意の値を入れる' in desc:
            prods[-1]['hc']='M409'+re.sub('[^A-Za-z0-9]','',code[5:])
    n=len(prods)
    s='管理画面にログインし、グッズ商品CSV登録で雛形ファイルをダウンロードし、%sをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（'%('1行を書いたCSV' if n==1 else '%d行を書いたCSV'%n)
    if n==1: s+=csvrow(prods[0])
    else: s+='／'.join('%d行目は%s'%(i+1,csvrow(p)) for i,p in enumerate(prods))
    s+='）。グッズ商品は状態ニアミントの規格が%s作られる。'%('1件' if n==1 else '商品ごとに1件ずつ')
    for p in prods: s+=edit(p)
    if any(p['nofoil'] for p in prods): s+='カード指定は押さない（カード詳細を紐付けないので、Foilは「-」＝なしで表示される）。'
    state['prods'].extend(prods)
    return s
out=[]
for r in rows:
    sid=r[0]; old=r[5]; state=dict(role=list(ROLE.get(sid,[])),prods=[])
    notes=[]
    if sid=='S-M04-09-QE-SALE-148':
        i=old.index('【商品】'); j=old.index('【在庫】')
        k=old.index('【商品規格】')
        tail=old[k:j]; ptail=tail[tail.index('を入れて「商品規格を登録」を押す')+len('を入れて「商品規格を登録」を押す'):]
        idm=re.search(r'商品一覧でこの商品名の行に表示されたIDを控える（〔商品ID-M0409-001〕）。',old[i:k]).group(0)
        p=dict(code='QE0409-001-CODE',csvname='QE0409-001-NAME',en=False,base=1,buy=1)
        new=(old[:i]+'【商品】管理画面にログインし、グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（'+csvrow(p)+'）。グッズ商品は状態ニアミントの規格が1件作られる。商品マスター(検索入力)で商品コードに「QE0409-001-CODE」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、タグの「固定のセールタグ」にチェックを入れ、割引率に販売割引率に登録済みのものを選んで「商品を登録」を押す。'+idm
          +'【商品規格】商品の「規格設定」から商品規格一覧を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面でセールフラグをチェックし、基準価格(円)=1、販売価格(円)=1、買取価格(円)=1、部門は選択肢の先頭、公開ステータス=公開を入れて「商品規格を登録」を押す'+ptail+old[j:])
        why='商品の属性のうち、商品名・商品コード・基準価格1・販売価格1・買取価格1・日本語・NM・支店の商品公開ステータス公開・公開状態公開はCSVで入れ、固定のセールタグは取り込み後の商品登録編集画面で入れ、セールフラグは商品規格登録編集画面で入れる（M03-27 L0125〜L0126・L0224、M03-09 L0086〜L0087）。商品カテゴリは元が「1つ以上」としか書いていないのでサプライ・グッズのままにした。元の「カード指定は任意」は押さない形にした。部門は元が「任意の有効な部門」なので、規格の編集画面で選択肢の先頭を選ぶ。'
        basis='M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0224・L0232、M03-02 L0075〜L0077・L0092・L0146、M03-09 L0086〜L0087'
        out.append([sid,'直す',new,'','' if False else basis,why]); continue
    cnt=[0]
    def rep(m):
        cnt[0]+=1
        return build(sid,m,state)
    new=SEG.sub(rep,old)
    assert cnt[0]>=1,sid
    assert not state['role'],(sid,state['role'])
    ps=state['prods']; why=[]
    roles=ROLE.get(sid)
    if roles: why.append('元は商品コードを「試験者が決める」としていたので、シード専用の商品コード %s を決めた（ケースは「…の商品」の呼び名で参照しているので、呼び名は変えていない）。'%'・'.join(roles))
    if any(p['card'] for p in ps): why.append('カード詳細を紐付ける商品は、取り込み後に商品登録編集画面（既存の商品の編集）で「カード指定 >」から検索結果の先頭のカード詳細を選ぶ。元は「カード詳細」としか書いていないので特定のカードにしていない。商品カテゴリは元が指定していないためサプライ・グッズのままにした。')
    if any(p['hc'] for p in ps): why.append('高額商品コードはグッズ商品CSVに列が無いため、取り込み後に商品規格登録編集画面で半角英数の値を入れる（M03-09 L0152）。値は元が「任意」なのでシード専用に決めた。')
    if any(p['cat'] for p in ps): why.append('試験カテゴリAはサプライ・グッズ配下ではないので、CSVにはサプライ・グッズのカテゴリIDを入れ、取り込み後に商品登録編集画面で試験カテゴリAに付け替える（M03-27 L0123）。')
    if any(p['en'] for p in ps): why.append('元の言語=英語は、言語(ID)の列に英語のIDを入れて表す（M03-27 Excel L0196）。')
    if any(not p['card'] and not p['csvname']!=p['code'] for p in ps) and False: pass
    basis='M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0232・L0233、M03-02 L0075〜L0077'
    if any(p['card'] or p['cat'] or p['hc'] for p in ps): basis+='・L0092・L0146'
    if any(p['hc'] for p in ps): basis+='、M03-09 L0152'
    out.append([sid,'直す',new,'',basis,''.join(why)])
with open(P+'out/M04-09.tsv','w',encoding='utf-8') as f:
    f.write('\t'.join(['シードID','判定','新しい投入方法','新しい状態・属性','根拠','理由'])+'\n')
    for o in out:
        assert all('\t' not in c and '\n' not in c for c in o)
        f.write('\t'.join(o)+'\n')
print(len(out))
