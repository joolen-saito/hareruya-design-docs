import re,sys,html,csv,collections
def strip(s):
    s=re.sub(r'<(script|style)\b.*?</\1>','',s,flags=re.S|re.I)
    s=re.sub(r'\ssrc="data:[^"]*"','',s)
    s=re.sub(r'<br\s*/?>','\n',s,flags=re.I)
    s=re.sub(r'<[^>]+>','\n',s)
    return [html.unescape(x).strip() for x in s.split('\n') if html.unescape(x).strip()]
cur=open(sys.argv[1],encoding='utf-8').read()
new=open(sys.argv[2],encoding='utf-8').read()
cur_body=re.sub(r'<!-- function-design-embed:start.*?function-design-embed:end[^>]*-->','',cur,flags=re.S)
ca=collections.Counter(strip(cur_body)); cb=collections.Counter(strip(new))
only=ca-cb
# 説明源1: 図形テキスト台帳
ledger=set()
for r in csv.DictReader(open(sys.argv[3],encoding='utf-8')):
    for col in ('text','text_source','struck_text'):
        for ln in (r.get(col) or '').split('\n'):
            if ln.strip(): ledger.add(ln.strip())
# 説明源2: 取り消し線span
struck=set()
for m in re.findall(r'<span class="cell-strike">(.*?)</span>', cur, flags=re.S):
    for ln in re.split(r'\n', re.sub(r'<br\s*/?>','\n',m)):
        t=html.unescape(re.sub(r'<[^>]+>','',ln)).strip()
        if t: struck.add(t)
# 説明源3: 実装差分追補ブロック
supp=set()
for m in re.findall(r'<!-- endpoint-supplement:start -->(.*?)<!-- endpoint-supplement:end -->', cur, flags=re.S):
    supp.update(strip(m))
# 説明源4: 図形セクション（shape-block）
shape=set()
for m in re.findall(r'<section class="[^"]*shape[^"]*">.*?</section>', cur, flags=re.S):
    shape.update(strip(m))
cats=collections.Counter(); un=collections.Counter()
for k,v in only.items():
    if k in shape: cats['図形セクション']+=v
    elif k in ledger: cats['図形テキスト台帳']+=v
    elif k in supp: cats['実装差分追補']+=v
    elif k in struck: cats['取り消し線']+=v
    elif k.startswith('図形・テキストボックス内テキスト'): cats['図形セクション見出し']+=v
    elif re.fullmatch(r'[A-Z]{1,3}\d{1,5}|位置|テキスト', k): cats['図形セクションの列/位置']+=v
    else: un[k]=v
print('現行のみ 合計 %d行'%sum(only.values()))
for k,v in cats.most_common(): print('  説明済:',k,v,'行')
print('  未説明:',sum(un.values()),'行 /',len(un),'種')
for k,v in un.most_common(30): print('    ',v,'|',k[:180])
