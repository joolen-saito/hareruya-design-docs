#!/usr/bin/env python3
"""バッチ独立検証: 各_poc2をgate再チェック＋実装値混入スキャン。使い方: verify_batch.py _batchN.json"""
import re, json, glob, subprocess, sys
from pathlib import Path
ASSERT=re.compile(r'実装は|実装値|実装済み|未実装|enterpriseは|enterprise実装|pf-eccube3|pf現行|コード上は|ソース上|実コードで')
SRC=re.compile(r'を正典|ec-cube-enterprise\s*を正|実ソースを正|DB正として|移行先を正')  # 「Excelを正」等の正当形は除外
def scan(p):
    txt=Path(p).read_text(encoding='utf-8').splitlines()
    inblk=False;hdr=None;exp_i=None;bad=[];nc=0
    for l in txt:
        if l.strip()=='```tsv':inblk=True;continue
        if inblk and l.strip()=='```':inblk=False;continue
        if inblk:
            c=l.split('\t')
            if hdr is None:hdr=c;exp_i=next((i for i,h in enumerate(c) if '期待' in h),None);continue
            if re.match(r'(RG|BT|DA|DT|DP)-',c[0]):nc+=1
            if exp_i is None or len(c)<=exp_i:continue
            cell=c[exp_i];framed=('付帯表4' in cell)or('要実機' in cell)or('要仕様確認' in cell)
            if (ASSERT.search(cell) and not framed) or SRC.search(cell):bad.append(c[0])
    return nc,bad
batch=json.load(open(sys.argv[1],encoding='utf-8'))
hard=0;miss=0;viol=[];tot=0
for f in batch:
    fid=f['fid'];p=f"integration_test/_poc2_{fid}.md"
    if not Path(p).exists():print(f"  {fid} ❌欠落");miss+=1;continue
    nc,bad=scan(p);tot+=nc
    if f['kubun']=='標準':bad=[]  # 標準は実ソースが正当オラクル＝混入スキャン対象外
    cmd=["python3","integration_test/tools/gate_check.py",p,"--html",f['detail']]
    if f['excel_ok']:cmd+=["--excel",f"excel_to_html/output/{f['excel_doc']}"]
    g=subprocess.run(cmd,capture_output=True,text=True).stdout
    gh="違反なし" not in g
    if gh:hard+=1
    if bad:viol.append((fid,bad))
    print(f"  {fid:8s} {f['kubun']:6s} ケース{nc:3d} "+(f"⚠{bad}" if bad else ("❌gate" if gh else "✅")))
print(f"\n欠落:{miss} gateハード:{hard} 混入:{len(viol)}機能 総ケース:{tot} 新規実装:{sum(1 for f in batch if f['kubun']=='新規実装')}")
