#!/bin/bash
# usage: launch_split.sh <巡> <機能ID> <件数>   件数の多い機能を前半・後半の2本に分けて codex レビューを起動する
cd "$(dirname "$0")/.."
r=$1; f=$2; n=$3; h=$(( (n + 1) / 2 ))
python3 review/make_prompts.py "$r" "$f" >/dev/null
for part in "a:$(printf '%03d' 1)〜$(printf '%03d' $h)" "b:$(printf '%03d' $((h + 1)))〜$(printf '%03d' $n)"; do
  k=${part%%:*}; rng=${part#*:}
  sed "s|## 重点観点|## 分担\n\nケースが${n}件あるので2人で分担する。あなたの担当は IT-${f}-${rng} である。担当外のケースは、重複や取りこぼしを判断するために読むだけにし、指摘は担当分と、担当分が出典にしているシートの取りこぼしに限る。指摘は最大20件。\n\n## 重点観点|; s|最大15件|最大20件|" "review/${f}_r${r}_prompt.md" > "review/${f}${k}_r${r}_prompt.md"
  nohup bash review/run_codex.sh "review/${f}${k}_r${r}_prompt.md" "review/${f}${k}_r${r}_out.txt" >/dev/null 2>&1 &
done
rm "review/${f}_r${r}_prompt.md"; echo "$f r$r 前半・後半を起動"
