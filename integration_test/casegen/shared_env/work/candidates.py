"""共有の開発環境で1件しかない設定を書き換えうるシードの候補を広めに拾う（判定は人・担当が行う）"""
import csv,re,glob,collections,pathlib
CG=pathlib.Path(__file__).resolve().parents[2]
pats=collections.OrderedDict([
 ('店舗基本設定', r'(基本設定|基本情報管理|店舗基本設定|ショップマスター)'),
 ('送料無料', r'送料無料'),
 ('追加システム設定', r'追加システム設定'),
 ('セキュリティ管理', r'セキュリティ管理|IP制限|許可リスト|拒否リスト'),
 ('メール設定', r'メール設定|テンプレート一覧|メールテンプレート'),
 ('CSV出力項目設定', r'CSV出力項目設定'),
 ('設定ファイル', r'設定ファイル|環境変数|\.env|再起動|設定値を|アプリケーション設定'),
 ('配送・支払', r'(配送方法|配送業者|支払方法|支払い方法)(設定|管理|登録|一覧|編集)'),
 ('権限管理', r'権限管理'),
 ('ポイント設定', r'ポイント設定|ポイント付与率|基本ポイント'),
 ('税率', r'税率設定|税率'),
 ('会員規約・特商法', r'会員規約|特定商取引'),
 ('店舗の設定', r'店舗の設定|店舗登録|店舗一覧'),
])
uses=collections.defaultdict(list)
for f in glob.glob(str(CG/'cases/*_test_cases.tsv')):
    for r in csv.reader(open(f,encoding='utf-8'),delimiter='\t'):
        if len(r)>=7 and r[0]!='テストID':
            for s in r[6].split(','):
                if s.strip(): uses[s.strip()].append(r[0])
out=[]
for f in sorted(glob.glob(str(CG/'cases/*_seed_data.tsv'))):
    fid=pathlib.Path(f).name[:6]
    for r in csv.reader(open(f,encoding='utf-8'),delimiter='\t'):
        if len(r)<7 or r[0]=='シードID': continue
        text=r[5]
        hits=[k for k,p in pats.items() if re.search(p,text)]
        if hits: out.append([fid,r[0],r[6],'/'.join(hits),str(len(uses[r[0]])),r[2],r[3],r[4],r[5]])
w=csv.writer(open(pathlib.Path(__file__).parent/'candidates.tsv','w',encoding='utf-8'),delimiter='\t',lineterminator='\n')
w.writerow(['機能','シードID','共有','拾った語','使うケース数','論理名','状態・属性','用途','投入方法'])
w.writerows(out)
c=collections.Counter(); 
for o in out:
    for h in o[3].split('/'): c[h]+=1
print(len(out),'件',len({o[0] for o in out}),'機能'); print(c.most_common())
