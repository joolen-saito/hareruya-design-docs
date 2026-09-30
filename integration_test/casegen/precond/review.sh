#!/usr/bin/env bash
# ゲート合格の全機能を10機能ずつ codex でレビューする。4本並列。
#   review.sh            未レビューのグループを全部
# 出力: review/rv_NN.txt（入力は review/rv_NN_prompt.md、対象は review/groups.tsv）
set -uo pipefail
PC=/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond
LOG=$PC/PROGRESS.log
PAR=4
python3 - <<'PY'
import csv, os
PC='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond'
CG=os.path.dirname(PC)
order=[x['機能No'] for x in csv.DictReader(open(f'{CG}/execution_order.tsv'),delimiter='\t')]
fids=[f[:-15] for f in os.listdir(f'{PC}/baseline') if f.endswith('_test_cases.tsv')]
fids=sorted(fids, key=lambda f:(order.index(f) if f in order else 999, f))
# 保留しかない機能はレビュー不要
def has_exec(f):
    return any(r['実行区分']!='保留' for r in csv.DictReader(open(f'{CG}/cases/{f}_test_cases.tsv'),delimiter='\t'))
fids=[f for f in fids if has_exec(f)]
t=open(f'{PC}/REVIEW_TEMPLATE.md').read()
os.makedirs(f'{PC}/review',exist_ok=True)
with open(f'{PC}/review/groups.tsv','w') as g:
    g.write('グループ\t機能\n')
    for i in range(0,len(fids),10):
        n=f'{i//10+1:02d}'; grp=fids[i:i+10]
        g.write(f'{n}\t{" ".join(grp)}\n')
        open(f'{PC}/review/rv_{n}_prompt.md','w').write(t.replace('{FIDS}','、'.join(grp)))
print(len(fids),'機能',(len(fids)+9)//10,'グループ')
PY
GRPS=$(tail -n +2 $PC/review/groups.tsv | cut -f1)
running=()
for n in $GRPS; do
  out=$PC/review/rv_$n.txt
  grep -q 'tokens used' $out 2>/dev/null && continue
  while [ $(jobs -rp | wc -l) -ge $PAR ]; do sleep 30; done
  echo "  レビュー rv_$n 起動 $(date '+%m-%d %H:%M')" >> $LOG
  ( codex exec --skip-git-repo-check --sandbox read-only --cd /home/y-saito/Developments - \
      < $PC/review/rv_${n}_prompt.md > $out 2>&1 ) &
done
wait
echo "review.sh 終了 $(date '+%m-%d %H:%M')" >> $LOG
