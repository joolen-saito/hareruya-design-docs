# -*- coding: utf-8 -*-
"""FUNCTION_RANK.tsv の C1/C2/C3 を 乖離1,034 + Backlog247 = 1,281件に適用して集計する。"""
import csv, os, re, collections
csv.field_size_limit(10**9)
BASE='/home/y-saito/Developments/hareruya-design-docs'
R=os.path.join(BASE,'design_impl_drift_report')

rank={}; rname={}; rmod=collections.defaultdict(collections.Counter)
for r in csv.DictReader(open(os.path.join(R,'FUNCTION_RANK.tsv'),encoding='utf-8'),delimiter='\t'):
    rank[r['機能No']]=r['ランク']; rname[r['機能No']]=r['機能名']
    rmod[r['モジュール']][r['ランク']]+=1
# モジュール既定ランク＝そのモジュールの最頻ランク
modrank={m:c.most_common(1)[0][0] for m,c in rmod.items()}

def norm(s):
    s=(s or '').strip()
    s=re.sub(r'[\s　]','',s)
    s=s.replace('（','(').replace('）',')').replace('／','/').replace('・','')
    return s
byname=collections.defaultdict(set)
for fid,nm in rname.items(): byname[norm(nm)].add(fid)

# ---------- 乖離 1,034 ----------
drift=list(csv.DictReader(open(os.path.join(R,'drift_findings_list_triaged.tsv'),encoding='utf-8'),delimiter='\t'))
miss=set()
for d in drift:
    fid=d['機能No'].strip()
    d['_rank']=rank.get(fid) or modrank.get(fid.split('-')[0]) or '不明'
    d['_src']='機能No一致' if fid in rank else ('モジュール既定' if fid.split('-')[0] in modrank else '不明')
    if fid not in rank: miss.add(fid)
    st=d['優先度']
    d['_state']={'D':'D 設計判断待ち','R':'R 要再調査','-':'— クローズ'}.get(st,'採番対象')

# ---------- Backlog 247 ----------
bl=list(csv.DictReader(open(os.path.join(R,'backlog_wip/backlog_bug_classified.tsv'),encoding='utf-8'),delimiter='\t'))
doc={}
for r in csv.DictReader(open(os.path.join(R,'backlog_wip/backlog_bug_wip_by_doc.tsv'),encoding='utf-8'),delimiter='\t'):
    doc[r['課題キー']]=r
DOC2MOD={'0201':'M11','0202':'M04','0203':'M05','0204':'M03','0205':'M06','0206':'M07','0207':'M08',
 '0208':'M14','0209':'M10','0210':'M09','0211':'M12','0212':'M15','0213':'M16','0214':'M13',
 '0301':'F01','0302':'F02','0303':'F03','0304':'F04','0305':'F05','0306':'F06','0307':'F07','0308':'F08',
 '0404':'B02','0405':'B05','0406':'B06','0408':'B08','0413':'B13','0416':'B16',
 '0501':'A01','0502':'A02','0505':'A05','0506':'A06','0507':'A07','0514':'A14','0515':'A15','0516':'A16','0517':'A17'}
for b in bl:
    d=doc.get(b['課題キー'])
    b['_fid']=''; b['_rank']='不明'; b['_src']='設計書未紐づけ'; b['_mod']=''
    if d:
        cands=byname.get(norm(d['機能']),set())
        m=DOC2MOD.get(d['設計書コード'].strip(),'')
        b['_mod']=m
        same=[f for f in cands if f.split('-')[0]==m]
        pick=same[0] if len(same)==1 else (list(cands)[0] if len(cands)==1 else '')
        if pick:
            b['_fid']=pick; b['_rank']=rank[pick]; b['_src']='機能名一致'
        elif m in modrank:
            b['_rank']=modrank[m]; b['_src']='モジュール既定'
    st=b['優先度(実害基準)']
    b['_state']={'D':'D 設計判断待ち','R':'R 要再調査'}.get(st,'採番対象')

# ---------- 集計 ----------
L=[];A=L.append
def tbl(head,rows):
    A('| '+' | '.join(head)+' |'); A('|'+'|'.join(['---']*(len(head)-1)+['---:'])+'|' if False else '|'+'|'.join(['---']*len(head))+'|')
    for r in rows: A('| '+' | '.join(str(x) for x in r)+' |')
    A('')

RK=['C1','C2','C3','不明']
A('# 機能ランク別 集計（乖離1,034 ＋ Backlog247 ＝ 1,281件）\n')
A(f'分類基準: `design_impl_drift_report/FUNCTION_RANK.tsv`（機能マスタ394件＋補遺7件、ユニーク機能No {len(rank)}件を機能単位で C1/C2/C3 に分類）')
A('対象: `drift_findings_list_triaged.tsv` 1,034件 ／ `backlog_wip/backlog_bug_classified.tsv` 247件\n')
A('> 本集計は**軸2（機能ランク C）だけ**を当てたもの。優先度 P1〜P3 の確定には軸1（業務停止性 B）が必要で、')
A('> その入力である回避策 `W` は既存データに存在しないため、本書では P は算出していない。\n')
A('---\n')

A('## 1. 全体\n')
rows=[]
for k in RK:
    dn=sum(1 for d in drift if d['_rank']==k); bn=sum(1 for b in bl if b['_rank']==k)
    rows.append([k,dn,bn,dn+bn,f'{(dn+bn)/1281*100:.1f}%'])
rows.append(['**計**,'.replace(',',''),len(drift),len(bl),len(drift)+len(bl),'100.0%'])
tbl(['ランク','乖離','Backlog','計','比率'],rows)

A('## 2. 状態別（優先度を付ける対象かどうか）\n')
states=['採番対象','D 設計判断待ち','R 要再調査','— クローズ']
rows=[]
for s in states:
    dd=[d for d in drift if d['_state']==s]; bb=[b for b in bl if b['_state']==s]
    row=[s]
    for k in RK: row.append(sum(1 for x in dd if x['_rank']==k)+sum(1 for x in bb if x['_rank']==k))
    row.append(len(dd)+len(bb)); rows.append(row)
row=['**計**']
for k in RK: row.append(sum(1 for x in drift if x['_rank']==k)+sum(1 for x in bl if x['_rank']==k))
row.append(1281); rows.append(row)
tbl(['状態']+RK+['計'],rows)

A('## 3. 採番対象のみ（1,176件）× ランク\n')
dd=[d for d in drift if d['_state']=='採番対象']; bb=[b for b in bl if b['_state']=='採番対象']
rows=[]
for k in RK:
    a=sum(1 for x in dd if x['_rank']==k); b_=sum(1 for x in bb if x['_rank']==k)
    rows.append([k,a,b_,a+b_,f'{(a+b_)/(len(dd)+len(bb))*100:.1f}%'])
rows.append(['**計**',len(dd),len(bb),len(dd)+len(bb),'100.0%'])
tbl(['ランク','乖離','Backlog','計','比率'],rows)

A('## 4. 判定確度 × ランク（1,281件）\n')
A('`機能単位` ＝ 機能Noまたは機能名から機能を特定してランクを引いたもの（確定）。')
A('`モジュール既定` ＝ 機能を特定できず、モジュールの最頻ランクで代用したもの（暫定）。\n')
rows=[]
for lab,pred in [('機能単位（確定）',lambda x:x['_src'] in ('機能No一致','機能名一致')),
                 ('モジュール既定（暫定）',lambda x:x['_src']=='モジュール既定'),
                 ('未特定',lambda x:x['_src'] in ('不明','設計書未紐づけ'))]:
    row=[lab]
    tot=0
    for k in RK:
        n=sum(1 for x in drift if pred(x) and x['_rank']==k)+sum(1 for x in bl if pred(x) and x['_rank']==k)
        row.append(n or '-'); tot+=n
    row.append(tot); rows.append(row)
tbl(['判定確度']+RK+['計'],rows)

A('## 5. モジュール別 × ランク（1,281件）\n')
mm=collections.defaultdict(collections.Counter)
for d in drift: mm[d['機能No'].split('-')[0]][d['_rank']]+=1
for b in bl: mm[b['_mod'] or '(未紐づけ)'][b['_rank']]+=1
rows=[]
for m in sorted(mm,key=lambda x:-sum(mm[x].values())):
    c=mm[m]; rows.append([m]+[c[k] or '-' for k in RK]+[sum(c.values())])
tbl(['モジュール']+RK+['計'],rows)

A('## 6. ランク × 指摘区分\n')
rows=[]
for k in RK:
    a=collections.Counter(d['指摘区分'] for d in drift if d['_rank']==k)
    b_=collections.Counter(x['指摘区分'] for x in bl if x['_rank']==k)
    rows.append([k,a['未実装']+b_['未実装'],a['実装違い']+b_['実装違い'],
                 sum(a.values())+sum(b_.values())])
tbl(['ランク','未実装','実装違い','計'],rows)

A('## 7. ランク × 既存の実害（参考。実害列は本定義で廃止予定）\n')
rows=[]
for k in RK:
    c=collections.Counter()
    for d in drift:
        if d['_rank']==k: c[(d['再検証_実害'] or d['重要度'])]+=1
    for x in bl:
        if x['_rank']==k: c[x['実害']]+=1
    rows.append([k,c['high'],c['med'],c['low'],sum(c.values())])
tbl(['ランク','high','med','low','計'],rows)

A('## 8. C1 の内訳 上位20機能（乖離のみ・機能No判明分）\n')
c=collections.Counter(d['機能No'] for d in drift if d['_rank']=='C1')
rows=[[f,rname.get(f,'(マスタ外)'),n] for f,n in c.most_common(20)]
tbl(['機能No','機能名','件数'],rows)

A('## 9. 分類の確からしさ（判定元の内訳）\n')
rows=[]
for src in ['機能No一致','モジュール既定','不明']:
    rows.append([f'乖離: {src}',sum(1 for d in drift if d['_src']==src)])
for src in ['機能名一致','モジュール既定','設計書未紐づけ']:
    rows.append([f'Backlog: {src}',sum(1 for b in bl if b['_src']==src)])
tbl(['判定元','件数'],rows)
A(f'- 乖離側でマスタに存在しない機能No: {len(miss)}件 {sorted(miss) if miss else ""}')
A(f'- Backlog側で機能Noまで特定できたのは {sum(1 for b in bl if b["_src"]=="機能名一致")}/247件。')
A('  残りは設計書コード→モジュールの最頻ランクで代用しており、同一モジュール内でランクが割れる機能')
A('  （例: M04 は C1 29件・C2 5件）では誤りが混入する。**Backlog側のランクは暫定値**。')
A('')
open(os.path.join(R,'PRIORITY_C_RANK_SUMMARY.md'),'w',encoding='utf-8').write('\n'.join(L))
print('\n'.join(L[:60]))
print('...')
print('written:', os.path.join(R,'PRIORITY_C_RANK_SUMMARY.md'))
