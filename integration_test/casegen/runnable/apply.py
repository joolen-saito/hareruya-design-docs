#!/usr/bin/env python3
"""書かれたとおりに実行できるようにする直し（env・kept・fix2 の out/）を、ケースの正本へ当てる。 apply.py

gate.py に合格したファイルだけを当てる。何度流しても同じ。
- 当てる先: ../cases/ のシード表・ケース表と、作り方が未確定で外した表（../excluded_open_seeds.tsv、
  ../excluded_open_cases.tsv の「元_」列）。外した表を直しておくと、exclude_open.py が戻すときに直った文で戻る。
  同じシードが複数の機能のシード表にあるときは全部を直す。
- 今の文が in/ の「今の文」（直しを書いたときの文）なら置き換える。既に新しい文なら済み。前にこれが当てた文
  （work/applied.tsv に文のハッシュを控える）も置き換える。どれでもなければ誤り（上流で文が変わったので書き直す）。
- env の「環境で解消」の前提の行は、../precond/open_preconditions.tsv から外し、
  ../precond/resolved_preconditions.tsv へ解消の書き方つきで移す。
- 基線（../precond/baseline/）にあるケースの手順・期待結果を変えたら宣言を書く。項目「控えた番号」は
  類型T4（oracle_changes の承認「類型承認T4」、step_changes の種別「発番値控え」）。ほかの手順の変更は種別「裁定訂正」。
  控えた番号へ置き換えたケースは ../precond/screen_noted_cases.tsv に足す。
- 照合は ../dummy_url/urlmap.N（実在しない試験用URLの置き換え。2026-10-21）を当てた文どうしで行う。置き換えはこの後に
  dummy_url/apply.py が当てるので、流し直しでは cases/ の文が置き換え後になっている。
- 流す順: merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py（最後に product_csv/apply.py と
  これと dummy_url/apply.py を呼ぶ）→ exclude_open.py → exclude_scope.py → build_all_test_cases.py → precond/gate_precond.py --all。
"""
import hashlib, importlib.util, os, pathlib, re, sys, collections

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
PC = CG / "precond"
sys.path.insert(0, str(CG / "dummy_url"))
from urlmap import N  # noqa: E402
DAY = "2026-10-19"
T4 = "類型承認T4（画面が自動で振る番号は、画面で登録したときに控えた値を使う。2026-10-09 依頼者）"
WHY_T4 = "画面が自動で振る番号を固定値で書いていた。登録時に控えた番号を使う（runnable/）"
WHY_FIX = "書かれたとおりに実行できるよう、人が補う操作を書き足した（runnable/）"
APPROVAL = f"{DAY} 依頼者決定（「おすすめで進めて」。書かれたとおりに実行できるようにする直し。runnable/）"
OP_HDR = ["機能", "対象", "未確定の内容", "影響ケース", "手がかり", "状態"]
RES_HDR = OP_HDR + ["解消の書き方", "区分", "根拠", "決定"]
DECISION = f"{DAY} 依頼者決定「バッチの実行、スマレジなど外部の試験環境、メールの受け取りは環境準備できる」"


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def dicts(p):
    h, rs = rows(p)
    return [dict(zip(h, r)) for r in rs]


def write(p, h, rs):
    p.write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def digest(t):
    return hashlib.sha1(t.encode("utf-8")).hexdigest()


def op_key(r):
    return "前提-" + hashlib.sha1("\t".join([r["機能"], r["対象"], r["未確定の内容"]]).encode("utf-8")).hexdigest()[:10]


def append_once(s, add):
    return s if add in s else (s + "／" + add if s.strip() else add)


class Tables:
    """当てる先の表を読み、最後にまとめて書く"""

    def __init__(self):
        self.files = {}
        self.dirty = set()
        self.seed_loc = collections.defaultdict(list)   # シードID → [(path, row)]
        self.case_loc = {}                               # テストID → (path, row, prefix)
        for p in sorted((CG / "cases").glob("*_seed_data.tsv")):
            h, rs = self.load(p)
            for r in rs:
                self.seed_loc[r[0]].append((p, r))
        for p in sorted((CG / "cases").glob("*_test_cases.tsv")):
            h, rs = self.load(p)
            for r in rs:
                self.case_loc[r[0]] = (p, r, "")
        p = CG / "excluded_open_seeds.tsv"
        h, rs = self.load(p)
        for r in rs:
            self.seed_loc[r[h.index("シードID")]].append((p, r))
        p = CG / "excluded_open_cases.tsv"
        h, rs = self.load(p)
        for r in rs:
            self.case_loc.setdefault(r[0], (p, r, "元_"))

    def load(self, p):
        if p not in self.files:
            self.files[p] = rows(p)
        return self.files[p]

    def col(self, p, name):
        return self.files[p][0].index(name)

    def save(self):
        for p in sorted(self.dirty):
            write(p, *self.files[p])


FINAL = {}   # (種別, 対象ID, 列) → 当てる順で最後の直しの文。今の文がこれなら、途中の直しは済みとみなす


def set_text(tb, applied, kind, tid, col, snap, new, err):
    """シード・ケースの1列を置き換える。戻り値: 置き換えた／済み／None（誤り）"""
    if kind == "シード":
        locs = [(p, r, col) for p, r in tb.seed_loc.get(tid, [])]
    else:
        loc = tb.case_loc.get(tid)
        locs = [(loc[0], loc[1], loc[2] + col)] if loc else []
    if not locs:
        err.append(f"{kind} {tid}: 当てる先が無い"); return None
    key = (kind, tid, col)
    res = "済み"
    snap, new = N(snap), N(new)
    final = N(FINAL[key]) if key in FINAL else None
    for p, r, c in locs:
        i = tb.col(p, c)
        cur = N(r[i])
        if cur == new or cur == final:
            continue
        if cur == snap or applied.get(key) in (digest(r[i]), digest(cur)):
            r[i] = new
            tb.dirty.add(p)
            res = "置き換えた"
            if os.environ.get("RUNNABLE_VERBOSE"):
                print(f"  置き換え: {kind} {tid} {col}（{p.name}）")
        else:
            err.append(f"{kind} {tid} {col}: 今の文が直しを書いたときの文と違う（{p.name}。上流で変わったので書き直す）")
            return None
    applied[key] = digest(final) if res == "済み" and final else digest(new)
    return res


def upsert(path, hdr, tid, fill):
    h, rs = rows(path) if path.exists() else (hdr, [])
    assert h == hdr, (path, h)
    hit = [r for r in rs if r[0] == tid]
    for r in hit:
        r[:] = fill(dict(zip(h, r)))
    if not hit:
        rs.append(fill(None))
    write(path, h, rs)


def declare(fid, tid, col, new, t4, cnt):
    bp = PC / f"baseline/{fid}_test_cases.tsv"
    if not bp.exists() or not any(r[0] == tid for r in rows(bp)[1]):
        return
    why = WHY_T4 if t4 else WHY_FIX
    if col == "期待結果":
        upsert(PC / f"oracle_changes/{fid}.tsv", ["テストID", "新期待結果", "理由", "承認"], tid, lambda o: [
            tid, new, append_once(o["理由"] if o else "", why),
            append_once(o["承認"] if o else "", T4 if t4 else APPROVAL)])
        cnt["期待結果の宣言"] += 1
    elif col == "手順":
        kind = "発番値控え" if t4 else "裁定訂正"
        upsert(PC / f"step_changes/{fid}.tsv", ["テストID", "種別", "新手順", "理由"], tid, lambda o: [
            tid, ",".join(dict.fromkeys([x for x in (o["種別"].split(",") if o else []) if x] + [kind])), new,
            append_once(o["理由"] if o else "", why)])
        cnt["手順の宣言"] += 1


def main():
    spec = importlib.util.spec_from_file_location("runnable_gate", R / "gate.py")
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    ap = R / "work/applied.tsv"
    applied = {(r[0], r[1], r[2]): r[3] for r in rows(ap)[1]} if ap.exists() else {}
    tb = Tables()
    err, cnt, skipped = [], collections.Counter(), []
    for op in sorted((R / "env/out").glob("*.tsv")):
        for r in dicts(op):
            if r["判定"] == "環境で解消" and r["種別"] == "シード":
                FINAL[("シード", r["対象ID"], "投入方法")] = r["新しい投入方法"]
                if r["新しい状態・属性"]:
                    FINAL[("シード", r["対象ID"], "状態・属性")] = r["新しい状態・属性"]
    for kind in ("kept", "fix2", "fix3"):
        for op in sorted((R / f"{kind}/out").glob("*.tsv")):
            for s_, r in zip(dicts(R / f"{kind}/in/{op.stem}.tsv"), dicts(op)):
                if r["判定"] == "直す":
                    FINAL[(s_["種別"], s_["対象ID"], s_["列"])] = r["新しい文"]
    resolved = {}                                    # 前提のキー → (解消の書き方, 区分, 根拠)
    # 1. env: 外したケースを止めている項目のうち、環境で解消するもの
    for op in sorted((R / "env/out").glob("*.tsv")):
        e, _ = gate.check_env(op.stem)
        if e:
            skipped.append(f"env/{op.stem}"); continue
        src = {(r["種別"], r["対象ID"]): r for r in dicts(R / f"env/in/{op.stem}.tsv")}
        for r in dicts(op):
            if r["判定"] != "環境で解消":
                continue
            s = src[(r["種別"], r["対象ID"])]
            if r["種別"] == "前提":
                resolved[r["対象ID"]] = (r["新しい投入方法"], r["区分"], r["根拠"])
                continue
            res = set_text(tb, applied, "シード", r["対象ID"], "投入方法", s["今の文"], r["新しい投入方法"], err)
            if r["新しい状態・属性"]:
                set_text(tb, applied, "シード", r["対象ID"], "状態・属性", s["状態・属性"], r["新しい状態・属性"], err)
            cnt[f"env シード {res}"] += 1
    # 2. kept → fix2: ケース一覧にある・戻るケースの直し（fix2 は kept・env を重ねた文に対する2回目なので後に当てる）
    noted, decls = set(), []
    for kind in ("kept", "fix2", "fix3"):
        for op in sorted((R / f"{kind}/out").glob("*.tsv")):
            e, _ = gate.check_fix(kind, op.stem)
            if e:
                skipped.append(f"{kind}/{op.stem}"); continue
            fid = op.stem.split("@")[0]
            src = dicts(R / f"{kind}/in/{op.stem}.tsv")
            for s, r in zip(src, dicts(op)):
                if r["判定"] != "直す":
                    continue
                res = set_text(tb, applied, s["種別"], s["対象ID"], s["列"], s["今の文"], r["新しい文"], err)
                cnt[f"{kind} {s['種別']} {res}"] += 1
                if s["種別"] == "ケース" and res is not None:
                    t4 = "控えた番号" in s["項目"].split(",")
                    decls.append((fid, s["対象ID"], s["列"], r["新しい文"], t4))
                    if t4:
                        noted.add(s["対象ID"])
    if err:
        print("runnable: 誤りがあるので何も書き換えていない")
        for e in err:
            print("  誤り:", e)
        return 1
    tb.save()
    for d in decls:
        declare(*d, cnt)
    # 3. 解消した前提の行を open_preconditions から resolved_preconditions へ移す
    oh, O = rows(PC / "open_preconditions.tsv")
    assert oh == OP_HDR, oh
    rp = PC / "resolved_preconditions.tsv"
    rh, RS = rows(rp) if rp.exists() else (RES_HDR, [])
    keep = []
    for r in O:
        d = dict(zip(oh, r))
        k = op_key(d)
        if k in resolved:
            how, cat, basis = resolved[k]
            RS.append(r + [how, cat, basis, DECISION])
            cnt["前提の行を解消へ移した"] += 1
        else:
            keep.append(r)
    if len(keep) != len(O):
        write(PC / "open_preconditions.tsv", oh, keep)
        write(rp, rh, RS)
    # 4. 控えた番号へ置き換えたケースの一覧に足す
    sp = PC / "screen_noted_cases.tsv"
    sh, S = rows(sp)
    have = {r[0] for r in S}
    add = sorted(noted - have)
    if add:
        write(sp, sh, S + [[t] for t in add])
        cnt["screen_noted_cases に足した"] += len(add)
    (R / "work").mkdir(exist_ok=True)
    write(ap, ["種別", "対象ID", "列", "当てた文のSHA1"], [[*k, v] for k, v in sorted(applied.items())])
    print("runnable:", " / ".join(f"{k} {v}件" for k, v in sorted(cnt.items())) or "当てるもの無し")
    if skipped:
        print("  gate 不合格のため当てない:", ", ".join(skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
