#!/usr/bin/env bash
# gate_dry.sh <作業用の写しの置き場>  合流前に、作業用の写しで合流から前提条件の検査までを流し、
# 今回足したケース・シードに当たる不合格を review/<機能ID>_gate.txt に機能ごとに書く（不合格の無い機能のファイルは消す）。
# ../combination/gate_dry.sh を 2026-10-23 に写した。本物の cases/ には触れない。流し終えたら写しは消す（マシンの資源を節約する）。
set -eu
trap 'echo "止まった行: $LINENO" >&2' ERR
CG=$(cd "$(dirname "$0")/.." && pwd)
W=$1/casegen
mkdir -p "$W"
nice rsync -a --delete --exclude coverage_audit/ --exclude datapattern/units/ --exclude datapattern/audit/ --exclude datapattern/verify/ \
  --exclude datapattern/review/ --exclude gapfill/review/ --exclude combination/units/ --exclude combination/review/ \
  --exclude combination/factors/ --exclude dedup/inputs/ --exclude dedup/judg/ --exclude dedup/prompts/ --exclude ut_layer/inputs/ --exclude ut_layer/judg/ --exclude ut_layer/prompts/ \
  --exclude precond/gen/ --exclude precond/review/ --exclude '*/review/*_out.txt' "$CG/" "$W/"
cd "$W"
# いまの cases/ は merge_dp・merge_cb・merge_added・seed_screen/apply・apply_rulings を当てて除外を済ませた状態。
# apply_rulings を流し直すと、外したケースのシードを「当てる先が無い」で止まる（2026-10-23 に確かめた）。
# 追加ケースは著者が最終の形（画面で作るシード・商品はCSV登録・置き換え済みのURL）で書くので、合流のあとは除外の4段からでよい。
nice python3 fp_gap/merge_fg.py >/dev/null
nice python3 exclude_open.py >/dev/null
nice python3 exclude_scope.py >/dev/null
nice python3 exclude_dup.py >/dev/null
nice python3 exclude_ut.py >/dev/null
nice python3 build_all_test_cases.py > "$1/build_all.txt"
nice python3 precond/gate_precond.py --all > "$1/gate_all.txt" || true
: > "$1/gate.txt"
for f in $(awk '$2 != "OK" && $1 ~ /^[A-Z][0-9][0-9]-[0-9][0-9]$/ {print $1}' "$1/gate_all.txt"); do
  nice python3 precond/gate_precond.py "$f" >> "$1/gate.txt" || true
done
# 外れたケース（未確定の前提などで exclude_* が外したもの）のうち、今回足した分
python3 - "$W" "$CG/fp_gap" > "$1/excluded_mine.txt" <<'E'
import sys, csv, glob, pathlib
W, G = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
mine = set()
for p in glob.glob(str(G / "cases/*_fg_test_cases.tsv")):
    mine |= {l.split("\t", 1)[0] for l in open(p, encoding="utf-8").read().split("\n")[1:] if l.strip()}
for fn in ("excluded_open_cases.tsv", "excluded_scope_cases.tsv", "excluded_dup_cases.tsv", "excluded_ut_cases.tsv", "excluded_hold_cases.tsv"):
    for r in csv.DictReader(open(W / fn, encoding="utf-8"), delimiter="\t"):
        if r["テストID"] in mine:
            print(fn, r["テストID"], (r.get("未確定の内容") or r.get("理由") or r.get("除外理由") or "")[:200], sep="\t")
E
mkdir -p "$CG/fp_gap/review"
python3 - "$1/gate.txt" "$CG/fp_gap" <<'E'
import sys, re, glob, pathlib, collections
out, G = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"), pathlib.Path(sys.argv[2])
mine = {}
for p in glob.glob(str(G / "cases/*_fg_test_cases.tsv")):
    f = pathlib.Path(p).name.split("_")[0]
    for l in open(p, encoding="utf-8").read().split("\n")[1:]:
        if l.strip():
            mine[l.split("\t", 1)[0]] = f
    for l in open(G / f"cases/{f}_fg_seed_data.tsv", encoding="utf-8").read().split("\n")[1:]:
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
    if re.fullmatch(r"[A-Z]\d\d-\d\d_gate\.txt", pathlib.Path(p).name):
        pathlib.Path(p).unlink()
for f, ls in by.items():
    (G / f"review/{f}_gate.txt").write_text("\n".join(ls) + "\n", encoding="utf-8")
print(len(by), "機能", sum(map(len, by.values())), "件", sorted(by))
E
tail -3 "$1/gate_all.txt"
echo "外れた追加ケース: $(wc -l < "$1/excluded_mine.txt") 件（$1/excluded_mine.txt）"
rm -rf "$W"
