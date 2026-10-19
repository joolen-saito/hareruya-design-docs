#!/usr/bin/env python3
"""書かれたとおりに実行できるようにする直しの入力を作る。 build.py [kept|env|fix2] [--force]

依頼者決定（2026-10-19）:
  「おすすめで進めて」= 人なら補って実行できるもの（決まった番号の読み替え・手順の抜け）と、
  画面で作れないものを DB へ直接入れる書き方（2026-10-09 の決まり）で、ケースに書き足す。
  「バッチの実行、スマレジなど外部の試験環境、メールの受け取りは環境準備できる」= それだけが理由で
  作り方が未確定として外したケースは、作り方を書いて戻す。中継・模擬応答、時刻の固定、障害を起こす手段は用意しない。

作るもの
  kept/in/<機能ID>.tsv      いまケース一覧にあるケースの直し（商品・控えた番号・割引率・規約同意・確認モーダル）
  env/in/<機能ID>.tsv       作り方が未確定で外したケースを止めている項目（未確定のシード・未確定の前提の行）
  env/in/<機能ID>_cases.tsv その機能の外したケースと、止めている項目
  fix2/in/<機能ID>.tsv      2回目の直し。kept・env の直しを仮に重ねた文から、戻るケースと今あるケースに残る抜けを拾う（kept と同じ形）
in/ が既にあれば作り直さない（--force で作り直す）。
"""
import csv, glob, hashlib, pathlib, re, sys, collections

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
csv.field_size_limit(10**9)
UNS = re.compile(r"未確定|未整備")
NEWREG = re.compile(r"product/product/new|商品新規登録|商品の新規登録|商品を新規登録|新規登録状態の商品|商品登録画面（新規）|商品登録編集画面（新規）|新規の商品登録")
F1003_ID = re.compile(r"(?<![\d〔-])9100\d{5}(?!\d)")
KEPT_HDR = ["項目", "種別", "対象ID", "列", "今の文", "使うケース", "手がかり"]
ENV_HDR = ["種別", "対象ID", "列", "今の文", "状態・属性", "止めているケース", "手がかり"]
ENVC_HDR = ["テストID", "除外理由", "止めている項目", "使用シード"]
# 判断が要るので扱わない（返品の並び順の値が決まっていない。決めると期待結果を左右する）
SKIP_SEEDS = {"S-M07-01-RETURN-SORT-065"}
SPLIT = 60   # env の1ファイルの項目数の目安


def rows(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


def write(p, hdr, rs):
    p.parent.mkdir(parents=True, exist_ok=True)
    for r in rs:
        for c in hdr:
            if "\t" in str(r.get(c, "")) or "\n" in str(r.get(c, "")):
                raise SystemExit(f"タブか改行が入っている {p} {r.get('対象ID')} {c}")
    p.write_text("".join("\t".join(str(r.get(c, "")) for c in hdr) + "\n" for r in [dict(zip(hdr, hdr))] + rs), encoding="utf-8")


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s or "") if x.strip() and x.strip() != "—"]


def op_key(r):
    return "前提-" + hashlib.sha1("\t".join([r["機能"], r["対象"], r["未確定の内容"]]).encode("utf-8")).hexdigest()[:10]


def load():
    cases, seeds = {}, {}          # テストID → row（＋機能）、シードID → row（＋機能・所在）
    seed_files = collections.defaultdict(list)
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        fid = pathlib.Path(p).name[:6]
        for r in rows(p):
            r["_fid"] = fid
            cases[r["テストID"]] = r
    for p in sorted(glob.glob(str(CG / "cases/*_seed_data.tsv"))):
        fid = pathlib.Path(p).name[:6]
        for r in rows(p):
            seed_files[r["シードID"]].append(fid)
            # 複数の機能の表にある共有シードは、シードIDの機能の表を正にする（無ければ最初の表）
            if r["シードID"] not in seeds or r["シードID"].startswith(f"S-{fid}-"):
                r["_fid"], r["_where"] = fid, "cases"
                seeds[r["シードID"]] = r
    for r in rows(CG / "excluded_open_seeds.tsv"):
        r["_fid"], r["_where"] = r["機能ID"], "excluded"
        seeds.setdefault(r["シードID"], r)
    return cases, seeds, seed_files


def uses(cases):
    u = collections.defaultdict(list)
    for t, r in cases.items():
        for s in seeds_of(r["使用シード"]):
            u[s].append(t)
    return u


def consent_needed(m):
    return (re.search(r"ネット買取|適格請求発行事業者|買取申込|買取の申込", m) and "申込み" in m
            and "ネット買取規約同意" not in m)


def modal_needed(m):
    return "グッズ商品CSV" in m and m.count("「CSVファイルのアップロード」") > len(re.findall(r"確認モーダルでアップロードを確定", m))


def disc_needed(m):
    # CSV の列名「割引率(ID)」だけでは選んだことにならない（グッズ商品CSVに割引率の列は無い）
    return "商品を登録」" in m and not re.search(r"割引率(を|に|は|で|の選択|「)", m)


def approve_needed(m):
    return "在庫変更CSV登録" in m and "承認" not in m


def unlimited_needed(m):
    for sent in m.split("。"):
        if re.search(r"在庫(数)?無制限", sent) and re.search(r"規格", sent) and re.search(r"チェック|有効|入れ", sent) \
                and not re.search(r"DB|ＤＢ|在庫変更CSV登録", sent):
            return True
    return False


def fix_tasks(case_ids, cases, seeds, include_product, include_t4):
    """kept / fix2 の直しの行を機能ごとに作る"""
    u = uses({t: cases[t] for t in case_ids})
    out = collections.defaultdict(dict)   # 機能 → (種別,対象,列) → row

    def add(fid, kind, tid, col, item, text, used, hint=""):
        k = (kind, tid, col)
        if k in out[fid]:
            r = out[fid][k]
            if item not in r["項目"].split(","):
                r["項目"] += "," + item
            if hint and hint not in r["手がかり"]:
                r["手がかり"] = (r["手がかり"] + "／" + hint).strip("／")
            return
        out[fid][k] = {"項目": item, "種別": kind, "対象ID": tid, "列": col, "今の文": text,
                       "使うケース": ",".join(sorted(used)), "手がかり": hint}

    if include_product:
        for p in sorted((CG / "product_csv/out").glob("*.tsv")):
            for r in rows(p):
                if r["判定"] == "直せない" and r["シードID"] not in SKIP_SEEDS and r["シードID"] in u:
                    s = seeds[r["シードID"]]
                    add(s["_fid"], "シード", r["シードID"], "投入方法", "商品", s["投入方法"], u[r["シードID"]],
                        "product_csv で直せないとした理由: " + r["理由"])
    if include_t4:
        for t in sorted(case_ids):
            c = cases[t]
            if c["_fid"] == "F10-03" and any(F1003_ID.search(c[k]) for k in ("事前準備", "手順", "期待結果")):
                for k in ("事前準備", "手順", "期待結果"):
                    if F1003_ID.search(c[k]):
                        add("F10-03", "ケース", t, k, "控えた番号", c[k], [t], "固定の商品ID（9100…）を、CSVで登録したときに控えた商品IDの呼び名に置き換える")
                for s in seeds_of(c["使用シード"]):
                    if s in seeds and seeds[s]["_fid"] == "F10-03":
                        for k in ("状態・属性", "投入方法"):
                            add("F10-03", "シード", s, k, "控えた番号", seeds[s][k], u[s], "ケースが使う商品IDを、登録したときに控える書き方にする（呼び名の定義）")
            if c["_fid"] == "M13-02":
                for k in ("事前準備", "手順", "期待結果"):
                    if re.search(r"管理者ID ?1302", c[k]):
                        add("M13-02", "ケース", t, k, "控えた番号", c[k], [t], "管理者ID 1302 は画面登録で指定できない（E2E HANDOFF 4章の1）。登録時に控えた管理者IDの呼び名に置き換える")
        if "S-M13-02-ADM" in seeds and "S-M13-02-ADM" in u:
            s = seeds["S-M13-02-ADM"]
            for k in ("状態・属性", "投入方法"):
                add("M13-02", "シード", "S-M13-02-ADM", k, "控えた番号", s[k], u["S-M13-02-ADM"], "管理者IDは登録時に画面が振る。控えて呼び名を定義する")
    for sid in sorted(u):
        s = seeds.get(sid)
        if not s or UNS.search(s["投入方法"]):
            continue
        m = s["投入方法"]
        for item, need in (("割引率", disc_needed), ("規約同意", consent_needed), ("確認モーダル", modal_needed),
                           ("在庫の承認", approve_needed), ("在庫無制限", unlimited_needed)):
            if need(m):
                add(s["_fid"], "シード", sid, "投入方法", item, m, u[sid])
        if NEWREG.search(m):
            add(s["_fid"], "シード", sid, "投入方法", "商品", m, u[sid], "商品の新規登録の操作が残っている（刷新後は禁止。M03-02 L0075〜L0077）")
    return out


def build_kept(cases, seeds, force):
    d = R / "kept/in"
    if d.exists() and any(d.iterdir()) and not force:
        print("kept/in がある。作り直さない"); return
    out = fix_tasks(list(cases), cases, seeds, True, True)
    n = 0
    for fid, rs in sorted(out.items()):
        write(d / f"{fid}.tsv", KEPT_HDR, list(rs.values())); n += len(rs)
    cnt = collections.Counter(i for rs in out.values() for r in rs.values() for i in r["項目"].split(","))
    print(f"kept: {len(out)}機能 {n}行 {dict(cnt)}")


def build_env(cases, seeds, force):
    d = R / "env/in"
    if d.exists() and any(d.iterdir()) and not force:
        print("env/in がある。作り直さない"); return
    EX = rows(CG / "excluded_open_cases.tsv")
    OP = rows(CG / "precond/open_preconditions.tsv")
    listed = collections.defaultdict(list)
    for r in OP:
        for c in re.split(r"[,、]", r["影響ケース"]):
            c = c.strip()
            if c:
                listed[c if c.startswith("IT-") else f"IT-{r['機能']}-{c}"].append(r)
    items = collections.defaultdict(dict)    # 機能 → 対象ID → row
    ecases = collections.defaultdict(list)
    for e in EX:
        t, fid = e["テストID"], e["機能ID"]
        bl = []
        for s in seeds_of(e["元_使用シード"]):
            if s in seeds and UNS.search(seeds[s]["投入方法"]):
                sf = seeds[s]["_fid"]
                it = items[sf].setdefault(s, {"種別": "シード", "対象ID": s, "列": "投入方法", "今の文": seeds[s]["投入方法"],
                                               "状態・属性": seeds[s]["状態・属性"], "止めているケース": [], "手がかり": seeds[s]["用途"]})
                it["止めているケース"].append(t); bl.append(s)
        for r in listed.get(t, []):
            k = op_key(r)
            it = items[r["機能"]].setdefault(k, {"種別": "前提", "対象ID": k, "列": "未確定の内容", "今の文": r["未確定の内容"],
                                                "状態・属性": "", "止めているケース": [],
                                                "手がかり": f"対象: {r['対象']}／手がかり: {r['手がかり']}／状態: {r['状態']}"})
            it["止めているケース"].append(t); bl.append(k)
        ecases[fid].append({"テストID": t, "除外理由": e["除外理由"], "止めている項目": ",".join(dict.fromkeys(bl)),
                            "使用シード": e["元_使用シード"]})
    n = 0
    for fid in sorted(set(items) | set(ecases)):
        rs = list(items.get(fid, {}).values())
        for r in rs:
            r["止めているケース"] = ",".join(sorted(set(r["止めているケース"])))
        if rs:
            # 大きい機能は担当を分けられるように @1, @2 … へ分ける（同じシードと前提の行は同じ側に置く）
            parts = [rs[i:i + SPLIT] for i in range(0, len(rs), SPLIT)] if len(rs) > SPLIT * 1.3 else [rs]
            for k, part in enumerate(parts, 1):
                write(d / (f"{fid}@{k}.tsv" if len(parts) > 1 else f"{fid}.tsv"), ENV_HDR, part)
            n += len(rs)
        if ecases.get(fid):
            write(d / f"{fid}_cases.tsv", ENVC_HDR, ecases[fid])
    print(f"env: {len(items)}機能 {n}項目（外したケース {len(EX)}件）")


def overlay(cases, seeds, kinds=("kept",)):
    """env と kinds の直し（out/）を、ケースとシードに仮に重ねる（正本は書き換えない）"""
    for p in sorted((R / "env/out").glob("*.tsv")):
        src = {(r["種別"], r["対象ID"]): r for r in rows(R / f"env/in/{p.stem}.tsv")}
        for r in rows(p):
            if r["判定"] == "環境で解消" and r["種別"] == "シード" and r["対象ID"] in seeds:
                seeds[r["対象ID"]]["投入方法"] = r["新しい投入方法"]
                if r["新しい状態・属性"]:
                    seeds[r["対象ID"]]["状態・属性"] = r["新しい状態・属性"]
    for kind in kinds:
        for p in sorted((R / f"{kind}/out").glob("*.tsv")):
            for i, r in zip(rows(R / f"{kind}/in/{p.stem}.tsv"), rows(p)):
                if r["判定"] != "直す":
                    continue
                if r["種別"] == "シード" and r["対象ID"] in seeds:
                    seeds[r["対象ID"]][r["列"]] = r["新しい文"]
                elif r["種別"] == "ケース" and r["対象ID"] in cases:
                    cases[r["対象ID"]][r["列"]] = r["新しい文"]


def build_fix2(cases, seeds, force):
    """2回目の直し: 戻るケース（env/restored.tsv）と今あるケースについて、1回目の直しを重ねた文から、まだ残る抜けを拾う"""
    d = R / "fix2/in"
    if d.exists() and any(d.iterdir()) and not force:
        print("fix2/in がある。作り直さない"); return
    back = [r["テストID"] for r in rows(R / "env/restored.tsv")] if (R / "env/restored.tsv").exists() else []
    for e in rows(CG / "excluded_open_cases.tsv"):
        if e["テストID"] in back:
            r = {c[2:]: v for c, v in e.items() if c.startswith("元_")}
            r["_fid"] = e["機能ID"]
            cases[e["テストID"]] = r
    overlay(cases, seeds)
    # 1回目に「直さない」「直せない」とした行は、同じ項目では拾い直さない
    skip = {}
    for p in (R / "kept/out").glob("*.tsv"):
        for i, r in zip(rows(R / f"kept/in/{p.stem}.tsv"), rows(p)):
            if r["判定"] != "直す":
                skip[(r["種別"], r["対象ID"], r["列"])] = set(i["項目"].split(","))
    out = fix_tasks(list(cases), cases, seeds, False, False)
    # 戻るケースの控えた番号: env の直しでシードが新しく呼び名を定義したら、そのシードを使う戻るケースの固定の番号を置き換える
    newlab = {}
    for p in sorted((R / "env/out").glob("*.tsv")):
        src = {(r["種別"], r["対象ID"]): r for r in rows(R / f"env/in/{p.stem}.tsv")}
        for r in rows(p):
            if r["判定"] == "環境で解消" and r["種別"] == "シード":
                o = src[("シード", r["対象ID"])]
                lab = set(re.findall(r"〔[^〔〕]+〕", r["新しい投入方法"] + r["新しい状態・属性"])) - set(re.findall(r"〔[^〔〕]+〕", o["今の文"] + o["状態・属性"]))
                if lab:
                    newlab[r["対象ID"]] = sorted(lab)
    for t in back:
        c = cases[t]
        labs = [x for s in seeds_of(c["使用シード"]) for x in newlab.get(s, [])]
        if not labs:
            continue
        for k in ("事前準備", "手順", "期待結果"):
            key = ("ケース", t, k)
            out[c["_fid"]][key] = {"項目": "控えた番号", "種別": "ケース", "対象ID": t, "列": k, "今の文": c[k], "使うケース": t,
                                  "手がかり": "シードが登録時に控える呼び名 " + "・".join(labs) + " を新しく定義した。ケースの固定の番号を呼び名に置き換える（期待結果は番号を呼び名に置き換えるだけ）"}
    n, cnt = 0, collections.Counter()
    for fid, rs in sorted(out.items()):
        keep = []
        for k, r in rs.items():
            items = set(r["項目"].split(","))
            if k in skip and items <= skip[k]:
                continue
            keep.append(r)
            cnt.update(items)
        if keep:
            write(d / f"{fid}.tsv", KEPT_HDR, keep); n += len(keep)
    print(f"fix2: 戻るケース {len(back)}件を含めて {n}行 {dict(cnt)}")


def build_fix3(cases, seeds, force):
    """3回目の直し: 戻るケースのシードで、商品登録画面（新規）で商品を作る書き方が残っているものを拾う（1・2回目の語句に当たらなかった言い回し）"""
    d = R / "fix3/in"
    if d.exists() and any(d.iterdir()) and not force:
        print("fix3/in がある。作り直さない"); return
    back = [r["テストID"] for r in rows(R / "env/restored.tsv")]
    for e in rows(CG / "excluded_open_cases.tsv"):
        if e["テストID"] in back:
            r = {c[2:]: v for c, v in e.items() if c.startswith("元_")}
            r["_fid"] = e["機能ID"]
            cases[e["テストID"]] = r
    overlay(cases, seeds, ("kept", "fix2"))
    u = uses({t: cases[t] for t in back})
    out = collections.defaultdict(list)
    creates = re.compile(r"商品登録(編集)?画面|商品管理＞商品登録")
    for sid in sorted(u):
        s = seeds.get(sid)
        if not s:
            continue
        m = s["投入方法"]
        hit = sid == "S-F02-02-PRODUCTS-008" or any(
            creates.search(x) and re.search(r"登録ボタン|「商品を登録」|登録する", x)
            and not re.search(r"グッズ商品CSV|カード商品CSV|既存の商品|を開き|を開いて|行から", x) for x in m.split("。"))
        if hit:
            out[s["_fid"]].append({"項目": "商品", "種別": "シード", "対象ID": sid, "列": "投入方法", "今の文": m,
                                   "使うケース": ",".join(sorted(u[sid])),
                                   "手がかり": "商品登録画面（新規）で商品を作る書き方が残っている（刷新後は禁止。M03-02 L0075〜L0077）。グッズ商品CSV登録で作る"})
    n = 0
    for fid, rs in sorted(out.items()):
        write(d / f"{fid}.tsv", KEPT_HDR, rs); n += len(rs)
    print(f"fix3: {n}行 {dict((k, len(v)) for k, v in out.items())}")


def main(argv):
    force = "--force" in argv
    what = [a for a in argv if not a.startswith("--")] or ["kept", "env"]
    cases, seeds, _ = load()
    for w in what:
        {"kept": build_kept, "env": build_env, "fix2": build_fix2, "fix3": build_fix3}[w](cases, seeds, force)


if __name__ == "__main__":
    main(sys.argv[1:])
