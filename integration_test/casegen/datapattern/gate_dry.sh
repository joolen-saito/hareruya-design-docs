#!/usr/bin/env bash
# gate_dry.sh <作業用の写しの置き場>  合流前に、作業用の写しで merge → apply → exclude_open → build_all → gate_precond を流し、
# 今回足したケース・シードに当たる不合格を review/<機能ID>_gate.txt（前の回の分は直した後に <機能ID>_r<巡>_gate.txt へ改名して残す）に機能ごとに書く（不合格の無い機能のファイルは消す）。
# 本物の cases/ には触れない。
set -eu
CG=$(cd "$(dirname "$0")/.." && pwd)
W=$1/casegen
mkdir -p "$W"
rsync -a --delete --exclude coverage_audit/ --exclude datapattern/units/ --exclude datapattern/audit/ --exclude datapattern/verify/ \
  --exclude datapattern/review/ --exclude gapfill/review/ --exclude '*/review/*_out.txt' "$CG/" "$W/"
cd "$W"
python3 datapattern/merge_dp.py >/dev/null
python3 seed_screen/apply.py >/dev/null
python3 exclude_open.py >/dev/null
python3 build_all_test_cases.py >/dev/null
python3 precond/gate_precond.py --all > "$1/gate_all.txt" || true
# --all は機能ごとの件数だけを出すので、不合格の機能を1つずつ流し直して明細を取る
: > "$1/gate.txt"
for f in $(awk '$2 != "OK" && $1 ~ /^[A-Z][0-9][0-9]-[0-9][0-9]$/ {print $1}' "$1/gate_all.txt"); do
  python3 precond/gate_precond.py "$f" >> "$1/gate.txt" || true
done
python3 - "$1/gate.txt" "$CG/datapattern" <<'E'
import sys, re, glob, pathlib, collections
out, G = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"), pathlib.Path(sys.argv[2])
mine = {}
for p in glob.glob(str(G / "cases/*_dp_test_cases.tsv")):
    f = pathlib.Path(p).name.split("_")[0]
    for l in open(p, encoding="utf-8").read().split("\n")[1:]:
        if l.strip():
            mine[l.split("\t", 1)[0]] = f
    for l in open(G / f"cases/{f}_dp_seed_data.tsv", encoding="utf-8").read().split("\n")[1:]:
        if l.strip():
            mine[l.split("\t", 1)[0]] = f
by = collections.defaultdict(list)
for l in out.split("\n"):
    m = re.match(r"\s+(G\d+\S*) (\S+): (.*)", l)
    if not m:
        continue
    hit = {mine[t] for t in re.findall(r"(?:IT|S)-[A-Z]\d\d-\d\d-[\w\-]+", l) if t in mine}
    for f in hit:
        by[f].append(l.strip())
for p in glob.glob(str(G / "review/*_gate.txt")):
    if re.fullmatch(r"[A-Z]\d\d-\d\d_gate\.txt", pathlib.Path(p).name):   # 前の回の <機能ID>_r<巡>_gate.txt は残す
        pathlib.Path(p).unlink()
for f, ls in by.items():
    (G / f"review/{f}_gate.txt").write_text("\n".join(ls) + "\n", encoding="utf-8")
print(len(by), "機能", sum(map(len, by.values())), "件", sorted(by))
E
tail -3 "$1/gate_all.txt"
