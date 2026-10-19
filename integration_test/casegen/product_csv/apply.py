#!/usr/bin/env python3
"""商品登録画面で商品を作るシードの書き直し（out/<機能ID>.tsv）を、ケースの正本（../cases/ のシード表）へ当てる。 apply.py

依頼者決定（2026-10-19「商品登録画面で商品を作るシードも直して」）。gate.py に合格した機能だけを当てる。

- 判定が「直す」の行: シード表の投入方法を新しい投入方法に置き換える（新しい状態・属性があればそれも）。
  今の値が targets.tsv の元の値と同じなら置き換え、既に新しい値なら済みとみなす。前にこれが当てた値
  （work/applied.tsv に文のハッシュを控える。out/ を直したあと、seed_screen/apply.py が戻さないシードに残る）も置き換える。
  どれでもなければ誤り（上流の作業がシードの文を変えたので、書き直しをやり直す）として止める。
- 何度流しても同じ。
- 流す順: merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py → これ → exclude_open.py → exclude_scope.py。
  apply_rulings.py が最後にこれを呼ぶので、ふつうは apply_rulings.py を流せばよい。
"""
import hashlib, importlib.util, pathlib, sys

P = pathlib.Path(__file__).resolve().parent
CG = P.parent


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def digest(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def load_applied():
    ap = P / "work/applied.tsv"
    if not ap.exists():
        return {}
    return {(r[0], r[1]): r[2] for r in rows(ap)[1]}


def save_applied(applied):
    lines = [["シードID", "列", "当てた文のSHA1"]] + [[k[0], k[1], v] for k, v in sorted(applied.items())]
    (P / "work/applied.tsv").write_text("".join("\t".join(r) + "\n" for r in lines), encoding="utf-8")


def write(p, h, rs):
    p.write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def main():
    spec = importlib.util.spec_from_file_location("product_csv_gate", P / "gate.py")
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    th, T = rows(P / "targets.tsv")
    orig = {(r[0], r[1]): dict(zip(th, r)) for r in T}
    done = {"置き換えた": 0, "済み": 0, "当てない機能（gate 不合格）": 0}
    err = []
    applied = load_applied()
    lp = CG / "runnable/work/applied.tsv"   # 後段の直しが当てた文のハッシュ（流し直しで、その文を済みとみなす）
    later = {(r[0], r[1], r[2]): r[3] for r in rows(lp)[1]} if lp.exists() else {}
    for op in sorted((P / "out").glob("*.tsv")):
        fid = op.stem
        e, _ = gate.check(fid)
        if e:
            done["当てない機能（gate 不合格）"] += 1
            print(f"  {fid}: gate 不合格のため当てない")
            continue
        oh, O = rows(op)
        fix = [dict(zip(oh, r)) for r in O if r[1] == "直す"]
        if not fix:
            continue
        sp = CG / f"cases/{fid}_seed_data.tsv"
        sh, S = rows(sp)
        mi, ai = sh.index("投入方法"), sh.index("状態・属性")
        idx = {s[0]: s for s in S}
        for f in fix:
            sid = f["シードID"]
            o = orig.get((fid, sid))
            s = idx.get(sid)
            if o is None or s is None:
                err.append(f"{fid} {sid}: targets.tsv か cases/ に無い")
                continue
            pairs = [(mi, "投入方法", o["元の投入方法"], f["新しい投入方法"])]
            if f["新しい状態・属性"]:
                pairs.append((ai, "状態・属性", o["元の状態・属性"], f["新しい状態・属性"]))
            for i, col, _, new in pairs:
                if s[i] == new:
                    applied[(sid, col)] = digest(new)
            if all(s[i] == new for i, _, _, new in pairs):
                done["済み"] += 1
                continue
            if all(s[i] == new or later.get(("シード", sid, col)) == digest(s[i]) for i, col, _, new in pairs):
                done["済み"] += 1   # 後段の直し（../runnable/apply.py）がこの書き直しの上に重ねた文
                continue
            if any(s[i] not in (old, new) and digest(s[i]) != applied.get((sid, col)) for i, col, old, new in pairs):
                err.append(f"{fid} {sid}: シードの文が書き直しの元と違う（上流で変わった）")
                continue
            for i, col, _, new in pairs:
                s[i] = new
                applied[(sid, col)] = digest(new)
            done["置き換えた"] += 1
        write(sp, sh, S)
    save_applied(applied)
    print("商品のシードの書き直し:", " / ".join(f"{k} {v}件" for k, v in done.items()))
    for e in err:
        print("  誤り:", e)
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main())
