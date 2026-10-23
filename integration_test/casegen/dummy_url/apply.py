#!/usr/bin/env python3
"""実在しない試験用のURL（example.test）を、カード画像は設計書の記入例の相対パスへ、それ以外は検証用ドメインへ置き換える。 apply.py

規則は urlmap.py（依頼者決定 2026-10-21）。何度流しても同じ。
- 当てる先: ../cases/ のケース表（事前準備・手順・期待結果）とシード表（論理名・状態・属性・用途・投入方法）、
  外したケースの表（excluded_open・hold・scope の「元_事前準備」「元_手順」「元_期待結果」とシードの表）、
  前提条件の検査の宣言（precond/oracle_changes の新期待結果、precond/step_changes の新手順）。
  外したケースの表も直しておくと、exclude_open.py などが戻すときに置き換えた文で戻る。
- 基線（precond/baseline/）は書き換えない。precond/gate_precond.py は、用語の置き換え（terms.py）と同じく、
  基線にこの置き換えを当ててから照合する（URLの置き換えだけでは oracle_changes・step_changes の宣言は要らない）。
- 前段（seed_screen/apply.py・裁定・product_csv/apply.py・runnable/apply.py）の書き直しは置き換え前の文で書かれているので、
  それらを当てた後の最後にこれを当てる。前段の照合は urlmap.N を両側に当ててから比べる（流し直しで止まらない）。
- 流す順: merge → seed_screen/apply.py → datapattern/conflicts/apply_rulings.py（最後に product_csv/apply.py・runnable/apply.py・
  これを呼ぶ）→ exclude_open.py → exclude_scope.py → build_all_test_cases.py → precond/gate_precond.py --all。
"""
import collections, glob, pathlib, sys

D = pathlib.Path(__file__).resolve().parent
CG = D.parent
sys.path.insert(0, str(D))
from urlmap import N, left  # noqa: E402

CASE_COLS = {"事前準備", "手順", "期待結果", "元_事前準備", "元_手順", "元_期待結果"}
SEED_COLS = {"論理名", "状態・属性", "用途", "投入方法"}
TARGETS = [
    ("cases/*_test_cases.tsv", CASE_COLS),
    ("cases/*_seed_data.tsv", SEED_COLS),
    ("excluded_open_cases.tsv", CASE_COLS),
    ("excluded_open_seeds.tsv", SEED_COLS),
    ("excluded_hold_cases.tsv", CASE_COLS),
    ("excluded_hold_seeds.tsv", SEED_COLS),
    ("excluded_scope_cases.tsv", CASE_COLS),
    ("excluded_scope_seeds.tsv", SEED_COLS),
    ("precond/oracle_changes/*.tsv", {"新期待結果"}),
    ("precond/step_changes/*.tsv", {"新手順"}),
]


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write(p, h, rs):
    p.write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def main():
    cnt, err = collections.Counter(), []
    for pat, cols in TARGETS:
        for p in sorted(CG.glob(pat)):
            h, rs = rows(p)
            idx = [i for i, c in enumerate(h) if c in cols]
            n = 0
            for r in rs:
                for i in idx:
                    if i < len(r):
                        new = N(r[i])
                        if new != r[i]:
                            r[i] = new
                            n += 1
            if n:
                write(p, h, rs)
                cnt[pat] += n
            # 置き換え漏れ（当てた列に、スマレジの接続先以外の example.test のURLが残っていない）。
            # 除外理由・未確定の内容は precond/open_preconditions.tsv の写しなので当てない（runnable の前提のキーが文から作られるため）
            for r in rs:
                for i in idx:
                    for u in left(r[i] if i < len(r) else ""):
                        err.append(f"{p.relative_to(CG)} {r[0]} {h[i]}: {u}")
    print("試験用URLの置き換え:", " / ".join(f"{k} {v}セル" for k, v in cnt.items()) or "置き換えるもの無し")
    for e in err[:20]:
        print("  誤り（置き換え漏れ）:", e)
    if len(err) > 20:
        print(f"  ほか {len(err) - 20} 件")
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main())
