#!/usr/bin/env python3
"""機能ごとのFPを出し、IPA の密度から結合テストのケース数の目安を出して、実際のケース数と比べる。

入力
  out/fp_transactions.tsv, out/fp_files.tsv  ../build_fp.py を今の ee で流し直したもの（data/routes.json は 2026-10-23 採取）
  work/transactions.tsv                       処理単位（ルート785件）＋業務バッチのコマンド
  work/assign_*.tsv                           処理単位 → 機能ID の割り当て（根拠付き。work/ASSIGN_BRIEF.md の手順）
  work/functions.tsv                          機能一覧（functions/todo-list.md）＋ケース数＋状態
  ../../endpoint_reports/function_dependency_inventory.tsv  機能ごとの利用・更新テーブル（データFPの配り先）
  data/standard_transactions.json             パッケージ標準（ee main 11c2897e3b）の処理単位

機能のFP = 処理FP（割り当てた処理単位の重み。複数機能で共有する処理は等分）
         + データFP（テーブル1つ10FPを、そのテーブルを更新する機能で等分。更新する機能が無ければ使う機能で等分。
                    どちらも無いテーブルと外部連携(EIF)は、処理FPの比で全機能に配る）
目安のケース数 = 機能のFP × IPA『ソフトウェア開発分析データ集2022』表5-2-1 全開発種別 結合テスト 件/KFP（P25・中央・P75）
"""
import collections, csv, glob, json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
W = {"EI": 4, "EO": 5, "EQ": 4}
ILF_W, EIF_W = 10, 7
OUT = HERE / "out"


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def bench():
    b = {}
    for r in rd(HERE / "data/ipa_2022_benchmark.tsv"):
        if r["規模基準"] == "FP" and r["指標"] == "結合テスト(テストケース)":
            b[r["開発種別"]] = {k: (float(r[k]) if r[k] not in ("", "―") else None) for k in ("P25", "中央", "P75")}
    return b


def main():
    fns = {r["機能ID"]: r for r in rd(HERE / "work/functions.tsv")}
    tx = {r["ID"]: r for r in rd(HERE / "work/transactions.tsv")}
    asg = {}
    for p in sorted(glob.glob(str(HERE / "work/assign_G*.tsv"))):
        for r in rd(p):
            assert r["ID"] not in asg, f"割り当てが重複: {r['ID']} {p}"
            asg[r["ID"]] = r
    miss = sorted(set(tx) - set(asg))
    assert not miss, f"割り当ての無い処理単位: {len(miss)}件 {miss[:5]}"
    extra = sorted(set(asg) - set(tx))
    assert not extra, f"処理単位に無いID: {extra[:5]}"

    std = json.load(open(HERE / "data/standard_transactions.json", encoding="utf-8"))
    std_act = {s["action"] for s in std}
    std_route = {x for s in std for x in s["routes"].split(",") if x}

    tfp = collections.defaultdict(float)        # 処理FP
    tfp_std = collections.defaultdict(float)    # うちパッケージ標準由来
    tfp_batch = collections.defaultdict(float)  # うちバッチコマンド
    ntx = collections.defaultdict(float)
    outside = collections.Counter()             # 対象外の理由ごとのFP
    bad = []
    for i, a in asg.items():
        kind = (a["FP種別"] or "").strip()
        if kind not in W:
            bad.append((i, "FP種別", kind)); continue
        t = tx[i]
        is_std = t["種類"] == "ルート" and (t["コントローラアクション"] in std_act or set(t["ルート名"].split(",")) & std_route)
        ids = [x.strip().upper() for x in a["機能ID"].split(",") if x.strip()]
        if ids == ["対象外"] or (not ids and a["対象外の理由"].strip()):   # 機能IDを空にして理由だけ書いた行も対象外
            outside[a["対象外の理由"] or "（理由なし）"] += W[kind]; continue
        unknown = [x for x in ids if x not in fns]
        if not ids or unknown:
            bad.append((i, "機能ID", a["機能ID"])); continue
        for f in ids:
            tfp[f] += W[kind] / len(ids); ntx[f] += 1 / len(ids)
            if is_std: tfp_std[f] += W[kind] / len(ids)
            if t["種類"] == "バッチコマンド": tfp_batch[f] += W[kind] / len(ids)
    assert not bad, f"割り当てに不備: {bad[:10]}"

    # データFP
    files = rd(OUT / "fp_files.tsv")
    ilf = [r["名称"] for r in files if r["種別"] == "ILF"]
    eif_fp = EIF_W * sum(1 for r in files if r["種別"] == "EIF")
    upd, use = collections.defaultdict(set), collections.defaultdict(set)
    for r in rd(ROOT / "endpoint_reports/function_dependency_inventory.tsv"):
        f = r["id"].upper()
        if f not in fns: continue
        for x in r["update_tables"].split(","):
            if x: upd[x].add(f)
        for x in r["tables"].split(","):
            if x: use[x].add(f)
    dfp = collections.defaultdict(float)
    how = collections.Counter()
    pool = eif_fp
    for t in ilf:
        owners = upd.get(t) or use.get(t)
        if owners:
            how["更新する機能" if upd.get(t) else "使う機能"] += 1
            for f in owners: dfp[f] += ILF_W / len(owners)
        else:
            how["配り先なし"] += 1; pool += ILF_W
    tot_t = sum(tfp.values())
    for f, v in tfp.items():
        dfp[f] += pool * v / tot_t

    b = bench()["全開発種別"]
    rows = []
    for f, r in fns.items():
        fp = tfp[f] + dfp[f]
        n = int(r["ケース数"])
        lo, mid, hi = (fp * b[k] / 1000 for k in ("P25", "中央", "P75"))
        if fp == 0:
            j = "FPなし（処理単位の割り当てが無い）"
        elif n == 0:
            j = "ケースなし"
        elif n < lo:
            j = "少ない（P25未満）"
        elif n > hi:
            j = "多い（P75超）"
        else:
            j = "範囲内"
        rows.append({"機能ID": f, "区分": r["区分"], "分類": r["分類"], "機能名": r["機能名"], "カスタマイズ区分": r["カスタマイズ区分"],
                     "状態": r["状態"], "処理単位数": round(ntx[f], 2), "処理FP": round(tfp[f], 1), "うち標準由来の処理FP": round(tfp_std[f], 1),
                     "うちバッチFP": round(tfp_batch[f], 1), "データFP": round(dfp[f], 1), "FP": round(fp, 1),
                     "目安P25": round(lo), "目安中央": round(mid), "目安P75": round(hi), "ケース数": n,
                     "ケース/目安中央": round(n / mid, 2) if mid else "", "判定": j})
    rows.sort(key=lambda x: x["機能ID"])
    with open(OUT / "function_fp.tsv", "w", encoding="utf-8", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(rows[0]), delimiter="\t", lineterminator="\n"); w.writeheader(); w.writerows(rows)

    tot_fp = sum(x["FP"] for x in rows) + sum(outside.values())
    summ = {"機能に割り当てた処理FP": round(tot_t, 1), "対象外の処理FP": dict(outside), "データFP(ILF+EIF)": ILF_W * len(ilf) + eif_fp,
            "データFPの配り方(テーブル数)": dict(how), "処理FPの比で配ったデータFP": pool, "FP合計(バッチ込み)": round(tot_fp, 1),
            "判定": dict(collections.Counter(x["判定"] for x in rows)), "IPA全開発種別(件/KFP)": b}
    json.dump(summ, open(OUT / "function_fp_summary.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(summ, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
