import re
base='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/kept/'
def load(n):
    ls=[l.rstrip('\n').split('\t') for l in open(base+'in/%s.tsv'%n,encoding='utf-8')]
    return ls[1:]
H='種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由'
def save(n,out):
    open(base+'out/%s.tsv'%n,'w',encoding='utf-8').write(H+'\n'+'\n'.join('\t'.join(o) for o in out)+'\n')
# M14
for n in ['M14-04','M14-05']:
    out=[]
    for r in load(n):
        t=r[4]; old='「CSVファイルのアップロード」を押す（共通の値は'
        assert t.count(old)==1
        new=t.replace(old,'「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（共通の値は')
        out.append([r[1],r[2],r[3],'直す',new,'M03-27 L0092（CSVファイルのアップロード押下後に確認モーダルを表示）；グッズ商品CSVのアップロードだけに足した（カード登録CSVアップロードは足していない）','']) 
    save(n,out)
# M13-02
N='〔管理者ID-M1302-共有〕'
out=[]
for r in load('M13-02'):
    t=r[4]
    if r[1]=='ケース':
        assert '管理者ID 1302' in t
        new=t.replace('管理者ID 1302','管理者ID '+N)
        out.append([r[1],r[2],r[3],'直す',new,'e2e/HANDOFF_codex.md 4章の1（管理者ID 1302は画面のメンバー登録で指定できない）；S-M13-02-ADMで控える呼び名に置換','' ])
    elif r[3]=='状態・属性':
        assert t.startswith('管理者ID=1302／')
        new='管理者IDは登録時に画面が振る（控える。以下'+N+'）／'+t[len('管理者ID=1302／'):]
        out.append([r[1],r[2],r[3],'直す',new,'e2e/HANDOFF_codex.md 4章の1；同機能のS-M13-02-ADM-014の書き方に合わせた','ログインID・パスワードなど画面で入力する値は変えていない'])
    else:
        new=t+'。登録したあと、遷移したメンバー編集画面のアドレス欄の「member/」の直後に表示された番号を管理者IDとして控える（'+N+'）。'
        out.append([r[1],r[2],r[3],'直す',new,'同機能のS-M13-02-ADM-014の投入方法（メンバー編集画面のアドレス欄の「member/」の直後の番号を控える）と同じ書き方；e2e/HANDOFF_codex.md 4章の1','元の文末に句点が無いので「。」を補って書き足した'])
save('M13-02',out)
