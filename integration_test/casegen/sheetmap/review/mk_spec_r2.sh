#!/bin/bash
# usage: mk_spec_r2.sh <機能ID>  機能設計書の2巡目の依頼文を1巡目から作って codex に掛ける
python3 - "$1" <<'PY'
import pathlib,sys
f=sys.argv[1]; s=pathlib.Path(f+'_spec_r1_prompt.md').read_text(encoding='utf-8')
s=s.replace('の機能設計書\n','の機能設計書（2巡目）\n',1).replace('## 重点観点','これは2巡目である。1巡目の指摘は反映済みで、Excel が定めていることは意図的に削ってある。残っている事実の誤りと、反映で新たに入った誤りだけを挙げよ。\n\n## 重点観点')
pathlib.Path(f+'_spec_r2_prompt.md').write_text(s,encoding='utf-8')
PY
nohup bash "$(dirname "$0")/run_codex.sh" "$1_spec_r2_prompt.md" "$1_spec_r2_out.txt" >/dev/null 2>&1 &
