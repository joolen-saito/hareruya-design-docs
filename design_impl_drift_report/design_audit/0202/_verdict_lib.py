import csv, os, re
BASE=os.path.dirname(os.path.abspath(__file__))
REQ=os.path.join(BASE,'requirements.tsv')
VER=os.path.join(BASE,'verdicts.tsv')
COLS=["要求ID","判定","重要度","指摘区分","乖離種別","設計根拠_引用","設計期待値","実装参照","実装実態","判定根拠","画像確認メモ","確信度"]
def reqs():
    return list(csv.DictReader(open(REQ,encoding='utf-8'),delimiter='\t'))
def load():
    if not os.path.exists(VER): return {}
    return {r['要求ID']:r for r in csv.DictReader(open(VER,encoding='utf-8'),delimiter='\t')}
def save(d):
    with open(VER,'w',encoding='utf-8',newline='') as fh:
        w=csv.DictWriter(fh,fieldnames=COLS,delimiter='\t',lineterminator='\n'); w.writeheader()
        for k in sorted(d, key=lambda x:(int(x.split('-')[1]), x)):
            w.writerow({c:d[k].get(c,'') for c in COLS})
def put(d, rid, **kw):
    row={c:'' for c in COLS}; row['要求ID']=rid; row.update(kw); d[rid]=row
def item_rows(rs, sheet):
    """項目表の行（先頭セルが数字）を (番号, 項目名, 要求ID) で返す"""
    out=[]
    for r in rs:
        if r['シート']!=sheet: continue
        c=r['要求文'].split('\t')
        if c and re.fullmatch(r'\d+',c[0].strip()) and len(c)>1 and c[1].strip():
            out.append((int(c[0]),c[1].strip(),r['要求ID'],r['要求文']))
    return sorted(out)
