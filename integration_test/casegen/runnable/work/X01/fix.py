import re,os
base='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/'
rows=open(base+'fix2/in/B08-07.tsv',encoding='utf-8').read().split('\n')
def nm(n):
    c=int(n[3:6]); k=int(n[6:])
    if c>=29:
        return '〔会員ID-B0807-%03d%s〕'%(c,'' if k==1 else '-%d'%k)
    return '〔会員ID-'+n+'〕'
out=['種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由']
for l in rows[1:]:
    if not l.strip(): continue
    f=l.split('\t')
    typ,tid,col,txt=f[1],f[2],f[3],f[4]
    new=re.sub(r'(?:会員ID )?(?<!\d)(8070\d{5})(?!\d)',lambda m:nm(m.group(1)),txt)
    if new==txt:
        out.append('\t'.join([typ,tid,col,'直さない','','','固定の会員IDが無い']))
    else:
        out.append('\t'.join([typ,tid,col,'直す',new,'シードS-B08-07-*が定義した呼び名〔会員ID-…〕(入力の手がかり)','']))
open(base+'fix2/out/B08-07.tsv','w',encoding='utf-8').write('\n'.join(out)+'\n')
