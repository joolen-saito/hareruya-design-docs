import re,sys,html
def load(p, strip_embed=True):
    s=open(p,encoding='utf-8').read()
    if strip_embed:
        s=re.sub(r'<!-- function-design-embed:start.*?function-design-embed:end[^>]*-->','',s,flags=re.S)
    s=re.sub(r'<(script|style)\b.*?</\1>','',s,flags=re.S|re.I)
    s=re.sub(r'\ssrc="data:[^"]*"',' src="[IMG]"',s)
    s=re.sub(r'<br\s*/?>','\n',s,flags=re.I)
    s=re.sub(r'<[^>]+>','\n',s)
    t=[html.unescape(x).strip() for x in s.split('\n')]
    return [x for x in t if x]
a=load(sys.argv[1]); b=load(sys.argv[2], strip_embed=False)
import collections
ca,cb=collections.Counter(a),collections.Counter(b)
only_a=ca-cb; only_b=cb-ca
print('現行(埋め込み除去) 行数',len(a),'/ 新生成 行数',len(b))
print('現行のみ %d種 %d行 / 新生成のみ %d種 %d行'%(len(only_a),sum(only_a.values()),len(only_b),sum(only_b.values())))
print('--- 現行にあって新生成に無い(上位40) ---')
for k,v in only_a.most_common(40): print(v,'|',k[:160])
print('--- 新生成にあって現行に無い(上位40) ---')
for k,v in only_b.most_common(40): print(v,'|',k[:160])
