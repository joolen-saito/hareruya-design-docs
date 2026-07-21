import re,html as H,glob,json,os
from collections import Counter,defaultdict
OUT='/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad'
PANEL=re.compile(r'<section class="sheet-panel(?: is-active)?" id="(sheet-\d+)">')
ROW=re.compile(r'<tr id="(item-sheet-[\d-]+)">(.*?)</tr>',re.S)
TD=re.compile(r'<td[^>]*>(.*?)</td>',re.S)
DS=re.compile(r'data-source="(functions/[^"]+)"')
def clean(s):
    s=re.sub(r'<br\s*/?>','\n',s); s=re.sub(r'<[^>]+>','',s)
    return H.unescape(s).replace('\t',' ').strip()

rows=[]
for f in sorted(glob.glob('excel_to_html/output/*.html')):
    txt=open(f,encoding='utf-8').read()
    book=os.path.basename(f)[:4]
    # split into sheet panels
    parts=PANEL.split(txt)
    # parts: [pre, id1, body1, id2, body2...]
    for i in range(1,len(parts),2):
        sid=parts[i]; body=parts[i+1]
        ds=DS.search(body)
        src=ds.group(1) if ds else ''
        system=src.split('/')[1] if src else ''
        for m in ROW.finditer(body):
            tds=[clean(x) for x in TD.findall(m.group(2))]
            if len(tds)<7: continue
            iid,label,form,req,mx,init,desc=tds[:7]
            rows.append(dict(book=book,sheet=sid,rowid=m.group(1),no=iid,label=label,
                fmt=form,req=req,maxlen=mx,init=init,desc=desc,embed=src,system=system))
json.dump(rows,open(OUT+'/items.json','w'),ensure_ascii=False)
print('rows extracted:',len(rows))
print('by system:',Counter(r['system'] or '(none)' for r in rows).most_common())
sheets={(r['book'],r['sheet']) for r in rows}
print('sheets with item tables:',len(sheets))
nos=Counter(r['system'] or '(none)' for r in rows if r['req'] in('◯','○','〇') or re.search(r'\d',r['maxlen']))
print('constraint-bearing by system:',nos.most_common())
