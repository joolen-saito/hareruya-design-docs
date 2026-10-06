#!/usr/bin/env python3
"""前提条件の書き直しを検査する。規約は README.md の P1〜P10、検査は G1〜G9。

  gate_precond.py A01-01 [A01-02 ...]   指定した機能だけ
  gate_precond.py --all                  cases/ の全機能

G5 の一意性は、指定した機能に限らず cases/ の全機能のケース専用シードと突き合わせる。
"""
import csv, glob, re, sys, pathlib, collections

CG = pathlib.Path(__file__).resolve().parents[1]
PC = CG / "precond"
FIXED = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "出典"]
EMPTY = {"", "—", "-"}
# 「10から8」「10のまま」。「=10のまま」「在庫10のまま」も拾う
FROM = re.compile(r"(\d+)\s*(?:個|件|円|点)?\s*(?:から\s*\d|のまま)")
# ケース専用データの識別子。英字と数字を両方含む4文字以上、またはファイル名
IDENT = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.@\-]{3,}")


def read(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def seeds_of(s):
    return [x.strip() for x in re.split(r"[,、]", s) if x.strip() not in EMPTY]


RANGE = re.compile(r"([A-Za-z0-9_.@\-]*?)(\d+)\s*〜\s*([A-Za-z0-9_.@\-]*?)(\d+)(?![0-9])")
# 事前準備が後の手順の結果を参照している（時系列のねじれ）
# 手順中で外部の値に呼び名を付ける書き方。呼び名が期待結果に出るなら意味上のオラクル変更
LABEL_CLAUSE = re.compile(r"(?:以下|本ケースでは)([^／]{0,120}?)と呼ぶ")


def labels(steps):
    out = set()
    for clause in LABEL_CLAUSE.findall(steps):
        out |= set(re.findall(r"を\s*([^\s／、。を]+?)(?=\s*(?:、|$))", clause + "、"))
    return out
KINDS = {"準備移動", "改名", "発番値控え", "データ指示", "中継置換", "非同期完了待ち"}
UNSETTLED = re.compile(r"未確定|未整備")
FUTURE = re.compile(r"手順\s*\d|返した値|返す値|発番した|発番する値")


# シードの「項目=値」「項目 値」のうち、項目名が識別子・名前を表すもの。値は改名してよい
NAMEKEY = re.compile(r"ID|名称|名$|名\(|コード|番号|メール|アドレス|ファイル|CSV|URL|ログイン|タイトル|略称|キー")


def seed_names(rows):
    """シード表の状態・属性から、識別子・名前として定義された値を集める（数量は入らない）"""
    out = set()
    for r in rows:
        for part in re.split(r"[／、,]", r.get("状態・属性", "")):
            m2 = re.match(r"\s*(\S*ID)\s+([A-Za-z0-9_.@\-]+)", part)   # 「ID 100=基本税率」「ID 20の店舗」
            if m2:
                out.add(m2.group(2))
            m = re.match(r"\s*([^=＝]{1,20}?)\s*[=＝]\s*(.+?)\s*$", part)
            if m and NAMEKEY.search(m.group(1)):
                out.add(m.group(2))
                # 「ID=142は名称…」は先頭の英数字、「ID=148101・148102・148103」は並んだ全部を値とみなす
                if "ID" in m.group(1):
                    for piece in re.split(r"[・,、]", m.group(2)):
                        h = re.match(r"\s*([A-Za-z0-9_.@\-]+)", piece)
                        if h:
                            out.add(h.group(1))
    return out


def is_ident(t):
    return t in idents(t) and IDENT.fullmatch(t) is not None


def idents(text):
    out = set()
    # 「SMA-A01-O01〜SMA-A01-O15」「K099-01〜K099-99」は途中も展開して数える
    for a, x, b, y in RANGE.findall(text):
        if re.search(r"[A-Za-z]", a) and (b in ("", a)) and len(x) == len(y) and int(x) <= int(y) and int(y) - int(x) <= 2000:
            for i in range(int(x), int(y) + 1):
                out.add(f"{a}{i:0{len(x)}d}")
    for t in IDENT.findall(text):
        t = t.rstrip(".-")
        if re.match(r"S-[A-Z]\d\d-\d\d-", t) or re.fullmatch(r"[A-Z]\d\d-\d\d", t):
            continue   # シードIDと機能IDはデータの識別子ではない
        # 列名（TEL1・FAX2）・文字コード・郵便番号の形は、共有しても状態が干渉しない値
        if re.fullmatch(r"[A-Z]{2,4}\d", t) or t.upper() in ("UTF-8", "UTF-16", "SHIFT_JIS", "EUC-JP") \
                or re.fullmatch(r"[A-Z]\d[A-Z]\d[A-Z]\d", t):
            continue
        if t.lower().endswith(".csv") or (re.search(r"[A-Za-z]", t) and re.search(r"\d", t)):
            out.add(t)
    return out


def load(fid):
    C = read(CG / f"cases/{fid}_test_cases.tsv")
    sf = CG / f"cases/{fid}_seed_data.tsv"
    S = read(sf) if sf.exists() else []
    return C, S


def renames(fid):
    p = PC / f"renames/{fid}.tsv"
    m = collections.defaultdict(list)
    if p.exists():
        for r in read(p):
            m[r["テストID"]].append((r["旧"], r["新"]))
    return m


def _prefix_ok(text, i, old):
    """old の直前 text[:i] が置換してよい境界か。英数字でない／「ID」「No」の直後／単独の大文字1字（F6102 の F）の直後"""
    if i == 0 or not re.match(r"[A-Za-z0-9]", text[i - 1]):
        return True
    if old[:1].isdigit() and not text[i - 1].isdigit():
        if text[:i].endswith(("ID", "No")):
            return True
        if text[i - 1].isupper() and (i == 1 or not re.match(r"[A-Za-z0-9]", text[i - 2])):
            return True
    return False


def apply(text, pairs):
    """改名を1回の走査で当てる。各位置では最長の旧名だけを置き換え、置き換えた結果には再び当てない（連鎖させない）"""
    olds = sorted({o for o, _ in pairs}, key=len, reverse=True)
    m = dict(pairs)
    out, i = [], 0
    while i < len(text):
        for o in olds:
            if text.startswith(o, i) and not re.match(r"[A-Za-z0-9]", text[i + len(o):i + len(o) + 1]) \
                    and _prefix_ok(text, i, o):
                out.append(m[o]); i += len(o); break
        else:
            out.append(text[i]); i += 1
    return "".join(out)


def oracle_changes(fid):
    p = PC / f"oracle_changes/{fid}.tsv"
    return {r["テストID"]: r for r in read(p)} if p.exists() else {}


def step_changes(fid):
    p = PC / f"step_changes/{fid}.tsv"
    return {r["テストID"]: r for r in read(p)} if p.exists() else {}


def dedicated_idents_all():
    """全機能のケース専用シードの識別子 → [(機能, シードID)]"""
    own = collections.defaultdict(list)
    for p in glob.glob(str(CG / "cases/*_seed_data.tsv")):
        fid = pathlib.Path(p).name.split("_")[0]
        for r in read(p):
            if r.get("共有", "").strip() == "ケース専用":
                for t in idents(r["状態・属性"]):
                    own[t].append((fid, r["シードID"]))
    return own


def check(fid, own_all):
    err = []
    C, S = load(fid)
    # 基線が無い機能は、書き直しの後で新設したもの（added_cases.tsv に全ケースが載る）
    bp = PC / f"baseline/{fid}_test_cases.tsv"
    base = {r["テストID"]: r for r in read(bp)} if bp.exists() else {}
    # 別の機能IDのファイルから付け替えたケース（moved_cases.tsv）。移す前の基線を、新しいテストIDで照合に使う
    mvp = PC / "moved_cases.tsv"
    moved = read(mvp) if mvp.exists() else []
    moved_out = {r["旧テストID"] for r in moved if r["旧テストID"].startswith(f"IT-{fid}-")}
    moved_src = set()
    for r in moved:
        if r["新テストID"].startswith(f"IT-{fid}-"):
            sfid = r["旧テストID"][3:-4]
            ob = {x["テストID"]: x for x in read(PC / f"baseline/{sfid}_test_cases.tsv")}.get(r["旧テストID"])
            if ob:
                base[r["新テストID"]] = dict(ob, テストID=r["新テストID"])
                moved_src.add(sfid)
    rn = renames(fid)
    sc_all = step_changes(fid)
    oc_all = oracle_changes(fid)
    bs = PC / f"baseline/{fid}_seed_data.tsv"
    old_names = seed_names(read(bs)) if bs.exists() else set()
    new_names = seed_names(S)
    base_seed_text = bs.read_text(encoding="utf-8") if bs.exists() else ""
    for sfid in sorted(moved_src):                  # 付け替えたケースの改名は、移す前の機能の基線シードで確かめる
        sbs = PC / f"baseline/{sfid}_seed_data.tsv"
        if sbs.exists():
            old_names |= seed_names(read(sbs))
            base_seed_text += sbs.read_text(encoding="utf-8")
    cur_seed_text = " ".join(r.get("状態・属性", "") + " " + r.get("投入方法", "") for r in S)
    cur_seed_text = " ".join(r.get("状態・属性", "") + " " + r.get("投入方法", "") for r in S)

    ap = PC / "rename_approvals.tsv"
    approved = {(r["テストID"], r["旧"], r["新"]) for r in read(ap) if r.get("確認者", "").strip()} if ap.exists() else set()

    def ok_rename(t, old, new):
        if (t, old, new) in approved:        # 機械で確認できず、人が根拠を確かめて承認した改名
            return True
        if is_ident(old) and is_ident(new):
            return True
        if old in old_names and new in new_names:          # シードで ID・名称等の値として定義したもの
            return True
        if old.startswith("S-") and new.startswith(old + "-"):   # シードIDの付け替え
            return True
        # 数値のレコードID。基線シードで直前（同じ区切り内）に「ID」があるか、直後が「=」の数字に限る
        if old.isdigit() and new.isdigit():
            for m in re.finditer(rf"(?<!\d){old}(?!\d)", base_seed_text):
                before = re.split(r"[／\t]", base_seed_text[max(0, m.start() - 60):m.start()])[-1]
                after = base_seed_text[m.end():m.end() + 1]
                if "ID" in before or after in ("=", "＝"):
                    return True
        # シードの自由文で定義したデータ名（4文字以上・数字だけでない・「旧-ケース番号」の形）
        if not (len(old) >= 4 and not old.isdigit() and old in base_seed_text):
            return False
        # 「旧名-ケース番号」の形か、ケース番号で終わり今のシードで定義された名前
        return new == f"{old}-{t[-3:]}" or (new.endswith(t[-3:]) and new in cur_seed_text)

    for t, pairs in rn.items():
        for old, new in pairs:
            if not ok_rename(t, old, new):
                err.append(("G6", t, f"改名できるのは識別子か、シードでID・名称等として定義した値だけ: {old!r}→{new!r}"))
    sid = {r["シードID"]: r for r in S}
    use = collections.defaultdict(list)
    for x in C:
        for s in seeds_of(x["使用シード"]):
            use[s].append(x["テストID"])

    # G4
    for r in S:
        k = r.get("共有", None)
        if k is None:
            err.append(("G4", r["シードID"], "共有 列が無い")); continue
        k = k.strip()
        if k not in ("共有可", "ケース専用"):
            err.append(("G4", r["シードID"], f"共有 の値が不正: {k!r}"))
        n = len(use.get(r["シードID"], []))
        if n == 0:
            err.append(("G4", r["シードID"], "どのケースも使っていない"))
        if k == "ケース専用" and n > 1:
            err.append(("G4", r["シードID"], f"ケース専用なのに {n} ケースが参照: {','.join(use[r['シードID']])}"))
        if k == "ケース専用" and n == 1 and not r["シードID"].endswith("-" + use[r["シードID"]][0][-3:]):
            err.append(("G4", r["シードID"], f"ケース専用のシードIDの末尾がケース番号でない（{use[r['シードID']][0]}）"))

    # G6 固定列・テストID集合・保留
    # 保留ケースは excluded_hold_cases.tsv へ移した（依頼者決定 2026-10-01）。基線からそれを差し引いて照合する
    exp = CG / "excluded_hold_cases.tsv"
    excluded = {r["テストID"] for r in read(exp)} if exp.exists() else set()
    # 書き直しの後で足したケース（機能間データ連携など）は added_cases.tsv に載せる。基線は書き換えない
    adp = PC / "added_cases.tsv"
    added = {r["テストID"] for r in read(adp) if r["テストID"].startswith(f"IT-{fid}-")} if adp.exists() else set()
    if (set(base) - excluded - moved_out) | added != {x["テストID"] for x in C}:
        err.append(("G6", fid, "テストIDの集合が基線（保留除外・付け替え後）＋追加分（added_cases.tsv）と違う"))
    if added & set(base):
        err.append(("G6", fid, "added_cases.tsv のテストIDが基線と重なる"))
    if any(x["実行区分"] == "保留" for x in C):
        err.append(("G6", fid, "保留ケースが残っている（excluded_hold_cases.tsv へ移す）"))
    for x in C:
        b = base.get(x["テストID"])
        if not b:
            continue
        for col in FIXED:
            if x[col] != b[col]:
                err.append(("G6", x["テストID"], f"{col} が変わった"))
        if b["実行区分"] == "保留":
            if any(x[c] != b[c] for c in b):
                err.append(("G6", x["テストID"], "保留ケースが変わった"))
            continue
        if x["期待結果"] != apply(b["期待結果"], rn.get(x["テストID"], [])):
            oc = oc_all.get(x["テストID"])
            if not oc or oc.get("新期待結果", "") != x["期待結果"]:
                err.append(("G6", x["テストID"], "期待結果が基線＋改名と一致せず、oracle_changes にも無い"))
            elif not oc.get("承認", "").strip():
                err.append(("G6", x["テストID"], "期待結果の変更が承認待ち（oracle_changes）"))
        for lab in labels(x["手順"]):
            if lab in x["期待結果"] and not (oc_all.get(x["テストID"], {}).get("承認", "").strip()):
                err.append(("G6", x["テストID"], f"手順で定義した呼び名 {lab} を期待結果が使っている（oracle_changes 要）"))
        # G7 手順は基線＋改名のまま。変えたものは step_changes に理由付きで宣言する
        if x["手順"] != apply(b["手順"], rn.get(x["テストID"], [])):
            sc = sc_all.get(x["テストID"])
            if not sc or not sc.get("理由", "").strip():
                err.append(("G7", x["テストID"], "手順が基線＋改名と違うのに step_changes に理由が無い"))
            elif sc.get("新手順", "") != x["手順"]:
                err.append(("G7", x["テストID"], "step_changes の新手順とケースの手順が違う"))
            elif not set(re.split(r"[,、]", sc.get("種別", ""))) <= KINDS or not sc.get("種別", "").strip():
                err.append(("G7", x["テストID"], f"手順変更の種別が不正: {sc.get('種別', '')!r}"))
            elif sc.get("種別", "").strip() == "改名":
                # 改名だけと言うなら、改名表を当てた結果と一致するはず（ほかの変更を紛れ込ませない）
                err.append(("G7", x["テストID"], "種別が改名だけなのに、手順が基線＋改名と一致しない"))

    # G4 保留以外の各ケースはケース専用シードを1件以上使う。読み取りだけのケースは readonly_cases に理由付きで宣言する
    ro_p = PC / f"readonly_cases/{fid}.tsv"
    ro = {r["テストID"] for r in read(ro_p) if r.get("理由", "").strip()} if ro_p.exists() else set()
    for x in C:
        if x["実行区分"] != "保留" and x["テストID"] not in ro and not any(
                sid.get(s_, {}).get("共有", "").strip() == "ケース専用" for s_ in seeds_of(x["使用シード"])):
            err.append(("G4", x["テストID"], "ケース専用シードを使っていない（読み取りだけなら readonly_cases に宣言）"))

    # G9 未確定・未整備の前提を使うケースが open_preconditions に載っているか
    opn = [r for r in read(PC / "open_preconditions.tsv") if r["機能"] == fid] \
        if (PC / "open_preconditions.tsv").exists() else []
    listed = {c.strip() if c.strip().startswith("IT-") else f"IT-{fid}-{c.strip()}"
              for r in opn for c in re.split(r"[,、]", r["影響ケース"]) if c.strip()}
    unsettled = {r["シードID"] for r in S if UNSETTLED.search(r.get("投入方法", ""))}
    for x in C:
        if x["実行区分"] == "保留":
            continue
        us = [s_ for s_ in seeds_of(x["使用シード"]) if s_ in unsettled]
        if us and x["テストID"] not in listed:
            err.append(("G9", x["テストID"], f"未確定・未整備のシード {','.join(us)} を使うのに open_preconditions に無い"))
        if us or x["テストID"] in listed:
            WARN[fid].add(x["テストID"])

    ded_ids = {}
    for r in S:
        if r.get("共有", "").strip() == "ケース専用":
            for t in idents(r["状態・属性"]):
                ded_ids.setdefault(t, r["シードID"])

    for x in C:
        if x["実行区分"] == "保留":
            continue
        t, prep = x["テストID"], x["事前準備"].strip()
        # G1
        if prep in EMPTY:
            err.append(("G1", t, "事前準備が空")); continue
        # G8
        if FUTURE.search(prep):
            err.append(("G8", t, f"事前準備が後の手順の結果を参照している: {FUTURE.search(prep).group(0)}"))
        # G2
        for s in seeds_of(x["使用シード"]):
            if s not in sid:
                err.append(("G2", t, f"未定義のシード {s}"))
            elif s not in prep:
                err.append(("G2", t, f"使用シード {s} が事前準備に無い"))
        # G3
        for a in FROM.findall(x["期待結果"]):
            if not re.search(rf"(?<!\d){a}(?!\d)", prep):
                err.append(("G3", t, f"期待結果の変化前の値 {a} が事前準備に無い"))
        # G5 他ケースのケース専用データを触っていないか
        mine = set()
        for s in seeds_of(x["使用シード"]):
            if s in sid and sid[s].get("共有", "").strip() == "ケース専用":
                mine |= idents(sid[s]["状態・属性"])
        text = " ".join([x["事前準備"], x["手順"], x["期待結果"]])
        for tok in idents(text):
            if tok in ded_ids and tok not in mine:
                err.append(("G5", t, f"他ケースの専用データ {tok}（{ded_ids[tok]}）を使っている"))

    # G5b 自分のレコードID（「ID=20」「ID 20」。店舗ID・商品ID のような参照は除く）がケース専用シードどうしで重なる
    own_ids = collections.defaultdict(set)
    for r in S:
        if r.get("共有", "").strip() != "ケース専用":
            continue
        for v in re.findall(r"(?<![A-Za-z0-9ァ-ヶー一-龥])ID\s*[=＝ ]\s*([A-Za-z0-9_\-]+)", r["状態・属性"]):
            own_ids[v].add(r["シードID"])
    for v, ss in own_ids.items():
        if len(ss) > 1:
            err.append(("G5", sorted(ss)[0], f"レコードID {v} を複数のケース専用シードが定義している: {','.join(sorted(ss)[:4])}"
                        + (f" ほか{len(ss) - 4}件" if len(ss) > 4 else "")))

    # G5 全機能での一意性
    case_of = {s_: tuple(v) for s_, v in use.items()}
    for tok, sid_ in ded_ids.items():
        if re.fullmatch(r"(?i)passw0rd.*", tok):
            continue   # パスワードの値は共有しても干渉しない
        # 同じケースが使う別の専用シードとの重なりは干渉しない
        others = [o for o in own_all.get(tok, []) if o[1] != sid_
                  and not (o[0] == fid and case_of.get(o[1]) == case_of.get(sid_))]
        if others:
            err.append(("G5", sid_, f"識別子 {tok} が他のケース専用シードと重なる: "
                        + ",".join(f"{a}:{b}" for a, b in others[:3])))
    return err


WARN = collections.defaultdict(set)


def main(argv):
    fids = sorted(pathlib.Path(p).name.split("_")[0] for p in glob.glob(str(CG / "cases/*_test_cases.tsv"))) \
        if argv == ["--all"] else argv
    own_all = dedicated_idents_all()
    tot = collections.Counter()
    for fid in fids:
        e = check(fid, own_all)
        c = collections.Counter(g for g, _, _ in e)
        tot.update(c)
        print(f"{fid:8s} " + (" ".join(f"{g}={c[g]}" for g in sorted(c)) if e else "OK"))
        if len(fids) <= 3:
            for g, t, m in e:
                print(f"   {g} {t}: {m}")
    print("合計: " + (" / ".join(f"{g}={tot[g]}" for g in sorted(tot)) if tot else "OK"))
    w = sum(len(v) for v in WARN.values())
    if w:
        print(f"参考: 未整備・未確定の前提を使うケース {w} 件（open_preconditions.tsv。実行区分は変えない）")
    return 1 if tot else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
