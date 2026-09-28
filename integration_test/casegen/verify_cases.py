#!/usr/bin/env python3
"""テストケースを検証する。形式と、出典との突合の両方を見る。

形式だけの検査では捏造を止められなかったので、出典との突合を必ず入れる。
  - 制約値（桁数・上限）が出典にあるか。境界+1は許す
  - 「」で囲んだ引用が出典にあるか
  - 実在しない観点ID・要求IDを使っていないか
  - シードが定義されているか
  - SCOPE違反（画面文言の逐語照合）
  - 禁止語・内部表現
"""
import csv, glob, re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[2]
CG = ROOT / "integration_test/casegen"
BAN = re.compile(r"失敗させる|該当する操作|同上|いくつか|別の画面")
INTERNAL = re.compile(r"受け付けられない|受け付けない$")
LIMIT = re.compile(r"(\d{1,6})\s*(?:文字|桁|件|以下|以上|まで|上限|最大)")


def sources(fid):
    txt = ""
    for p in glob.glob(str(ROOT / f"functions/*/{fid.lower()}_*.md")):
        if "_archive" not in p:
            txt += open(p, encoding="utf-8").read()
    for r in csv.DictReader((ROOT / "functions/function-sheet-map.tsv").open(encoding="utf-8"),
                            delimiter="\t"):
        if r["機能No"].strip() != fid or r["状態"].strip() != "確定":
            continue
        for p in glob.glob(str(ROOT / f"excel_to_html/output/{r['ブック'].strip()}_*.html")):
            h = open(p, encoding="utf-8", errors="ignore").read()
            m = re.search(rf'id="{r["シートID"].strip()}"', h)
            if not m:
                continue
            n = re.search(r'id="sheet-\d+"', h[m.end():])
            # ブックの最後のシートは後ろにシートが無いので、ファイル末尾まで取る
            end = m.end() + n.start() if n else len(h)
            txt += re.sub(r"<[^>]+>", " ", h[m.start():end])
    # 画面項目の原データも出典に含める（HTMLは列幅で値が切れる）
    for x in csv.DictReader((ROOT / "item_definition_audit/item_definition_audit.tsv").open(encoding="utf-8"),
                            delimiter="\t"):
        txt += " " + x.get("最大文字数または最大値", "") + " " + x.get("ee_Form上限", "")
    return txt


def main(fids):
    VP = {r["観点ID"] for r in csv.DictReader(
        (CG / "../viewpoint_canonical/viewpoints_canonical.tsv").open(encoding="utf-8"), delimiter="\t")}
    tot = collections.Counter()
    print(f"{'機能':8s} {'件数':>4s} {'空欄':>4s} {'不明ID':>6s} {'禁止語':>5s} {'内部':>4s} "
          f"{'重複':>4s} {'値不一致':>7s} {'引用不一致':>8s} {'シード未定':>8s} {'保留':>4s}")
    for fid in fids:
        f = CG / f"cases/{fid}_test_cases.tsv"
        if not f.exists():
            print(f"{fid:8s} ケースが無い"); continue
        C = list(csv.DictReader(f.open(encoding="utf-8"), delimiter="\t"))
        src = sources(fid)
        req = {x["要求ID"] for x in csv.DictReader(
            (CG / f"materials/{fid}_requirements.tsv").open(encoding="utf-8"), delimiter="\t")}
        sf = CG / f"cases/{fid}_seed_data.tsv"
        S = {r[list(r)[0]] for r in csv.DictReader(sf.open(encoding="utf-8"), delimiter="\t")} if sf.exists() else set()
        blank = sum(1 for x in C if not x["出典"].strip() or not x["観点ID"].strip()
                    or not x["使用シード"].strip())
        badid = sum(1 for x in C for v in x["観点ID"].split(",") if v.strip() and v.strip() not in VP)
        badid += sum(1 for x in C for q in x["要求ID"].split(",") if q.strip() and q.strip() not in req)
        ban = sum(1 for x in C if BAN.search(x["手順"] + x["事前準備"]))
        intn = sum(1 for x in C if INTERNAL.search(x["期待結果"]))
        dup = len(C) - len({(x["事前準備"], x["手順"], x["期待結果"]) for x in C})
        # 制約値は期待結果だけを見る。手順には値の組み立ての内訳が出る
        # （「a」を243文字＋「@example.com」で255文字、の243）ので混ぜると誤検出になる。
        badv = sum(1 for x in C for n in set(LIMIT.findall(x["期待結果"]))
                   if n not in src and str(int(n) - 1) not in src)
        # 引用の検査は「設計書の文言を引いたもの」だけを対象にする。
        # シードで用意したテストデータの名前（「Aテンプレート」等）は設計書に無くて当然で、
        # これを混ぜると誤検出が108件出た。シード表に出る語は除く。
        # シード表は全文で部分一致させる。区切り記号（= ・ ／）で切ると
        # 「Aテンプレート」が長い塊に埋もれて一致しない。
        seed_text = sf.read_text(encoding="utf-8") if sf.exists() else ""
        # ケース側の事前準備・手順で定義した値も、期待結果で引いてよい
        own_text = " ".join(x["事前準備"] + " " + x["手順"] for x in C)
        badq = 0
        bad_list = []
        for x in C:
            for q in re.findall(r"「([^」]{6,60})」", x["期待結果"]):
                if q in src or q in seed_text or q in own_text:
                    continue
                # 「〜が表示される」形の文言照合だけを見る。データ名は対象外
                if not re.search(r"(?:表示|メッセージ|文言|と表示)", x["期待結果"]):
                    continue
                badq += 1
                bad_list.append((x["テストID"], q))
        used = set()
        for x in C:
            used |= {y.strip() for y in x["使用シード"].split(",") if y.strip() and y.strip() != "—"}
        hold = sum(1 for x in C if x["実行区分"] == "保留")
        print(f"{fid:8s} {len(C):>4d} {blank:>4d} {badid:>6d} {ban:>5d} {intn:>4d} {dup:>4d} "
              f"{badv:>7d} {badq:>8d} {len(used - S):>8d} {hold:>4d}")
        for t, q in bad_list[:3]:
            print(f"         引用不一致: {t} 「{q[:40]}」")
        for k, v in [("件数", len(C)), ("空欄", blank), ("不明ID", badid), ("禁止語", ban),
                     ("内部", intn), ("重複", dup), ("値不一致", badv), ("引用不一致", badq),
                     ("シード未定", len(used - S)), ("保留", hold)]:
            tot[k] += v
    print(f"\n合計: " + " / ".join(f"{k}={v}" for k, v in tot.items()))


if __name__ == "__main__":
    main(sys.argv[1:])
