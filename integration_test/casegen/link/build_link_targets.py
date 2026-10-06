#!/usr/bin/env python3
"""機能間データ連携（観点表 IT-0332〜0339）の適用先候補を作る。

1行＝上流機能1つ。下流候補は機械で引いた「候補」であり、確定ではない。
著者が設計書で両側の記述を確認できた組だけをケースにする（GEN_LINK_PROMPT_TEMPLATE.md）。

材料:
  - 画面遷移      : ../chains.tsv の別機能への辺（引継データあり）
  - それ以外3方向 : endpoint_reports/function_dependency_inventory.tsv の tables / update_tables
    （機能設計書から機械抽出した表。更新の誤検出があるので候補にしか使わない）
"""
import csv, collections, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[3]
CG = ROOT / "integration_test/casegen"
OUT = CG / "link"

# 依頼者が挙げた公開側の登録（注文・会員登録・買取申込）と、その実体
FRONT = {
    "F04-02": "dtb_order", "F04-04": "dtb_order",
    "F06-01": "dtb_customer", "F06-02": "dtb_customer",
    "F05-06": "dtb_buy_order", "F08-03": "dtb_otc_buy_order",
}
# どの機能も触るので、連携の根拠にならない表
NOISE = {"dtb_base_info", "dtb_member", "dtb_csv", "dtb_search_pattern", "mtb_page_max",
         "dtb_csv_import_history", "mtb_csv_import_type", "dtb_messenger_job", "mtb_option"}
SCREEN = re.compile(r"検索|一覧|編集|詳細|情報")
# 引き継ぐ値が無い辺
NOCARRY = re.compile(r"表示要求|画面固有の入力は無い|^遷移先の入力: なし|入力項目は無い")


def main():
    inv = {r["id"].upper(): r for r in csv.DictReader(
        (ROOT / "endpoint_reports/function_dependency_inventory.tsv").open(encoding="utf-8"), delimiter="\t")}
    has_cases = {p.name.split("_")[0] for p in (CG / "cases").glob("*_test_cases.tsv")}
    T = lambda r, k: {x for x in r[k].split(",") if x.strip()} - NOISE
    rows = []

    for fid, tb in FRONT.items():
        cand = sorted(i for i, r in inv.items() if r["layer"] == "admin" and tb in T(r, "tables")
                      and SCREEN.search(r["title"]))
        rows.append(["公開側→管理画面", fid, "IT-0332,IT-0333", ",".join(cand), tb, ""])

    for fid, r in sorted(inv.items()):
        if r["layer"] != "batch" or not T(r, "update_tables"):
            continue
        u = T(r, "update_tables")
        cand = sorted(i for i, x in inv.items() if x["layer"] in ("admin", "front") and u & T(x, "tables"))
        rows.append(["バッチ→画面", fid, "IT-0334", ",".join(cand), ",".join(sorted(u)), ""])

    for fid, r in sorted(inv.items()):
        if r["layer"] != "admin":
            continue
        u = T(r, "update_tables")
        key = {x for x in u if x.startswith("mtb_")}
        if fid[:3] in ("M10", "M11"):
            key |= u
        if not key:
            continue
        cand = sorted(i for i, x in inv.items() if i != fid and x["layer"] in ("admin", "front")
                      and key & T(x, "tables"))
        if cand:
            rows.append(["マスタ・設定→利用側", fid, "IT-0335,IT-0336,IT-0337", ",".join(cand),
                         ",".join(sorted(key)), ""])

    # 店舗設定・システム設定は、どの機能も読む表（基本情報など）へ書くので上の絞り込みで候補が0件になる。
    # 設定値で別機能の挙動が変わる方向の本命なので、候補なしで載せる。
    # 下流は上流の設計書の「設定値の利用先」などの記述から著者が特定する。
    done3 = {r[1] for r in rows if r[0] == "マスタ・設定→利用側"}
    for fid, r in sorted(inv.items()):
        if r["layer"] == "admin" and fid[:3] in ("M10", "M11") and fid not in done3 \
                and r["update_tables"].strip():
            rows.append(["マスタ・設定→利用側", fid, "IT-0335,IT-0336,IT-0337",
                         "（機械候補なし。上流の設計書が挙げる利用先と、その設定を参照すると書く機能設計書から特定する）",
                         "", ""])

    # 共有する表からは引けなかったマスタ（最終レビュー codex_final_b 指摘18〜21）。下流は設計書の記述で確認済みのもの。
    EXTRA = {"M03-13": "M03-02", "M03-22": "M03-02", "M11-05": "F06-01", "M16-04": "M15-08"}
    have3 = {r[1] for r in rows if r[0] == "マスタ・設定→利用側"}
    for fid, cand in EXTRA.items():
        if fid not in have3:
            rows.append(["マスタ・設定→利用側", fid, "IT-0335,IT-0336,IT-0337", cand, "（レビューで追加）", ""])

    edges = collections.defaultdict(list)
    for x in csv.DictReader((CG / "chains.tsv").open(encoding="utf-8"), delimiter="\t"):
        s, d = x["遷移元機能"].strip(), x["遷移先機能"].strip()
        if s and d and s != d and x["引継データ"].strip() and not NOCARRY.search(x["引継データ"]):
            edges[s].append((d, x["連鎖ID"]))
    for s in sorted(edges):
        rows.append(["画面遷移の引継ぎ", s, "IT-0338,IT-0339",
                     ",".join(sorted({d for d, _ in edges[s]})), "", ",".join(c for _, c in edges[s])])

    with (OUT / "link_targets.tsv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["方向", "上流機能", "判定ID", "下流候補", "候補の根拠（共有する表）", "連鎖ID", "既存ケース"])
        for r in rows:
            w.writerow(r + ["あり" if r[1] in has_cases else "なし"])
    c = collections.Counter(r[0] for r in rows)
    print(len(rows), dict(c))
    print("既存ケースの無い上流:", sorted(r[1] for r in rows if r[1] not in has_cases))


if __name__ == "__main__":
    main()
