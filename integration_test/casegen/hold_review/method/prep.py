"""保留ケースをバッチに分け、機能ごとの最新出典テキストと差分を書き出す。"""
import csv, json, sys, pathlib, collections, importlib.util
S = pathlib.Path(sys.argv[1]); NEW = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs')
spec = importlib.util.spec_from_file_location("sd", S/"srcdiff_lib.py"); sd = importlib.util.module_from_spec(spec); spec.loader.exec_module(sd)
diff = json.load(open(S/"srcdiff.json", encoding="utf-8"))
rows = list(csv.reader(open(NEW/"integration_test/casegen/all_test_cases.tsv", encoding="utf-8"), delimiter="\t"))   # 一覧はセル内で改行している（2026-10-19）。行で切らない
hdr, rows = rows[0], rows[1:]
# 一覧のテストIDは機能ごとに振り直した連番なので（2026-10-23）、対応表で cases/ のテストIDを引く
to_cases = {r["一覧のテストID"]: r["cases/のテストID"] for r in csv.DictReader(open(NEW/"integration_test/casegen/all_test_cases_id_map.tsv", encoding="utf-8"), delimiter="\t")}
for r in rows: r[0] = to_cases[r[0]]
ik = hdr.index("検証方法")   # 一覧の列は変わることがある（2026-10-16 に要求ID・優先度を外した。2026-10-20 に実行区分の見出しを検証方法にした）。位置でなく見出しで引く
byf = collections.defaultdict(list)
for r in rows:
    if r[ik] == "保留": byf["-".join(r[0].split("-")[1:3])].append(r)
(S/"src").mkdir(exist_ok=True); (S/"batch").mkdir(exist_ok=True); (S/"judge").mkdir(exist_ok=True)
for fid in byf:
    (S/f"src/{fid}.txt").write_text("\n".join(sd.sources(NEW, fid)) + "\n", encoding="utf-8")
    d = diff[fid]
    (S/f"src/{fid}.diff.txt").write_text("## 生成後に追加された行\n" + "\n".join(d["added"]) + "\n\n## 生成後に消えた行\n" + "\n".join(d["removed"]) + "\n", encoding="utf-8")
# 機能順に約80件ずつ、機能を割らずに切る
batches, cur = [], []
for fid in sorted(byf):
    if cur and sum(len(byf[f]) for f in cur) + len(byf[fid]) > 80:
        batches.append(cur); cur = []
    cur.append(fid)
batches.append(cur)
for i, fs in enumerate(batches, 1):
    with open(S/f"batch/b{i:02d}.tsv", "w", encoding="utf-8", newline="") as w:
        cw = csv.writer(w, delimiter="\t", lineterminator="\n")
        cw.writerow(hdr)
        for f in fs:
            cw.writerows(byf[f])
    print(f"b{i:02d}", sum(len(byf[f]) for f in fs), fs[0], "..", fs[-1], len(fs))
