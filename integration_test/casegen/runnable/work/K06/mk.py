import re, collections
rows=[l.rstrip('\n').split('\t') for l in open('kept/in/F10-03.tsv',encoding='utf-8')][1:]
NUM=re.compile(r'(?<![\d〔-])9100\d{5}(?!\d)')
IDRE=re.compile(r'(商品規格ID|商品ID|会員ID|カードID) ?(9100\d{5})')
def caseno(sid): return re.search(r'(\d{3})$',sid).group(1) if re.search(r'\d{3}$',sid) else None
states={r[2]:r[4] for r in rows if r[1]=='シード' and r[3]=='状態・属性'}
meth={r[2]:r[4] for r in rows if r[1]=='シード' and r[3]=='投入方法'}
gmap={}   # number -> (kind,label)
seedinfo={}
for sid,t in states.items():
    cn=caseno(sid)
    ids=list(IDRE.finditer(t))
    if not ids: continue
    prods=[m for m in ids if m.group(1)=='商品ID']
    info={'prods':[], 'member':None,'spec':None,'card':None}
    for m in ids:
        kind,num=m.group(1),m.group(2)
        if kind=='商品ID':
            pre=t[:m.start()]
            lm=re.search(r'商品([A-Z])（$',pre)
            letter=lm.group(1) if lm and len(prods)>1 else ''
            lab=f'〔商品ID-F1003-{cn}{letter}〕'
            info['prods'].append((num,lab))
        elif kind=='会員ID':
            lab=f'〔会員ID-F1003-{cn}〕'; info['member']=(num,lab)
        elif kind=='商品規格ID':
            lab=f'〔商品規格ID-F1003-{cn}〕'; info['spec']=(num,lab)
        else:
            lab=f'〔カードID-F1003-{cn}〕'; info['card']=(num,lab)
        gmap[num]=(kind,lab)
    seedinfo[sid]=info
def notestate(t):
    def f(m):
        kind,num=m.group(1),m.group(2)
        lab=gmap[num][1]
        return f'{kind}は登録時に画面が振る（控える。以下{lab}）'
    return IDRE.sub(f,t)
def repnum(t):
    return NUM.sub(lambda m: gmap[m.group(0)][1], t)
out=[]
cardseeds={s for s,i in seedinfo.items() if i['card']}
for r in rows:
    item,kind,tid,col,old=r[0],r[1],r[2],r[3],r[4]
    res=None
    if kind=='シード':
        sid=tid
        if sid=='S-F10-03-WAITLIST-048':
            a='「CSVファイルのアップロード」を押す（新規の商品規格は'
            assert old.count(a)==1
            new=old.replace(a,'「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（新規の商品規格は')
            res=('直す',new,'グッズ商品CSV登録の「CSVファイルのアップロード」は押下後に確認モーダルを表示する（M03-27 design.txt L0092）','')
        elif sid not in seedinfo:
            assert not NUM.search(old)
            why={'S-F10-03-ENV':'固定の番号を含まない（店舗設定の操作だけ）','S-F10-03-UNI':'固定の番号を含まない（システム設定の値だけ）','S-F10-03-GF-ADMIN':'固定の番号を含まない。管理者IDは使われず、ログインIDは画面で入力する値'}[sid]
            res=('直さない','','',why)
        elif col=='状態・属性':
            if sid in cardseeds:
                res=('直せない','','','カードIDは、このシードの操作（グッズ商品CSV登録）が作る・振る番号ではなく、2商品を同じカードに紐付ける操作も投入方法に書かれていないため、登録時に控える番号に置き換えられない。紐付けの作り方を決めてから直す（元の文の欠け）')
            else:
                res=('直す',notestate(old),'seed_screen/README.md「控えた番号の書き方」（状態・属性は固定の番号を消し登録時に画面が振る旨を書く）','')
        else:
            info=seedinfo[sid]
            new=old
            ev=[]
            if info['member']:
                num,lab=info['member']
                em=re.search(r'メールアドレス (\S+?@example\.test)',states[sid]).group(1)
                first='管理画面の会員登録画面で会員を登録する。'
                assert new.startswith(first)
                new=first+f'管理画面の会員一覧をメールアドレス {em} で検索し、その行に表示された会員IDを控える（{lab}）。'+new[len(first):]
                ev.append('ee admin/Customer/index.twig L453（会員一覧の行に会員ID表示）')
            if info['prods']:
                codes=re.findall(r'商品コードは「([^」]+)」',old)
                assert len(codes)==len(info['prods']),(sid,codes,info['prods'])
                m=re.search(r'グッズ商品は状態ニアミントの規格が[^。]*作られる。',new)
                assert m,sid
                ins=''.join(f'商品マスター(検索入力)で商品コードに「{c}」を入れて「検索する >」を押し、商品マスター(検索結果)の行に表示された商品IDを控える（{lab}）。' for c,(n,lab) in zip(codes,info['prods']))
                new=new[:m.end()]+ins+new[m.end():]
                ev.append('ee admin/Product/index.twig L569（商品マスター検索結果の行に商品ID表示）')
            if info['spec']:
                num,lab=info['spec']
                if 'PL' in states[sid] and '商品規格PL（商品規格ID' in states[sid]:
                    desc='商品規格一覧で言語英語・状態PLの規格の行を開き'
                else:
                    desc='商品規格一覧で言語日本語・状態SPの規格の行を開き'
                new=new.rstrip('。')+f'。{desc}、商品規格登録編集画面に表示された商品規格IDを控える（{lab}）'
                ev.append('ee admin/Product/ProductClass/edit.twig L257（商品規格登録編集画面に商品規格ID表示）')
            if info['card']:
                pass
            res=('直す',new,'seed_screen/README.md「控えた番号の書き方」・'+'・'.join(ev),'')
    else:
        if not NUM.search(old):
            res=('直さない','','','固定の番号を含まない')
        elif re.search(r'カードID',old):
            res=('直せない','','','カードIDは、シードの操作が作る・振る番号ではなく、2商品を同じカードに紐付ける操作も投入方法に書かれていないため、控えた番号に置き換えられない（シード側の欠け）')
        else:
            res=('直す',repnum(old),f'シード側の呼び名の定義（{col}の固定の商品ID等を、同じシードで控える呼び名に置換のみ）','')
    out.append([kind,tid,col,res[0],res[1],res[2],res[3]])
hd=['種別','対象ID','列','判定','新しい文','根拠','理由']
with open('kept/out/F10-03.tsv','w',encoding='utf-8') as f:
    f.write('\t'.join(hd)+'\n')
    for o in out:
        assert all('\t' not in c and '\n' not in c for c in o)
        f.write('\t'.join(o)+'\n')
print(collections.Counter((o[0],o[3]) for o in out))
