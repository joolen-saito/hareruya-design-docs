"""因子・水準表と禁則表から、組み合わせテストマトリクスを作る。

IPA「高信頼化ソフトウェアのための開発手法ガイドブック」(2010) 6.2節の表6-9〜6-11（FL表→禁則表→直交表による組み合わせテストマトリクス）に沿う。
直交表の代わりに、2因子間の組み合わせを全部含むように行を足す方法で割り付ける。
- 割り付けは2因子間の組み合わせ（禁則を除く）をすべて1回以上含むまで行を足す（貪欲法）。
- 乱数は固定の種で回すため、同じ入力からは同じ表ができる。
- 網羅率は2因子間と3因子間を数える。禁則を含む組み合わせは分母から除く。

使い方: python build_matrix.py <マトリクスのフォルダ> [--with-pending]
  フォルダには fl_table.tsv・prohibitions.tsv・exceptions.tsv・README.md を置く。表の見出しは README.md の1行目を使う。
  既定では「判断待ち」の禁則も禁則として扱う。--with-pending を付けると判断待ちの禁則を外して作る。
"""
import csv
import itertools
import random
import sys
from pathlib import Path

HERE = Path(next(a for a in sys.argv[1:] if not a.startswith("--"))).resolve()
SEED = 20261102
CANDIDATES = 300


def read_tsv(name):
    with open(HERE / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def load():
    factors = {}  # 因子ID -> (因子名, [水準ID...])
    level_name = {}
    for r in read_tsv("fl_table.tsv"):
        fid = r["因子ID"]
        factors.setdefault(fid, (r["因子"], []))[1].append(r["水準ID"])
        level_name[r["水準ID"]] = r["水準"]
    return factors, level_name


def load_prohibitions(drop_pending):
    bans = set()
    for r in read_tsv("prohibitions.tsv"):
        if drop_pending and r["扱い"] == "判断待ち":
            continue
        bans.add(frozenset((r["水準1"], r["水準2"])))
    return bans


def allowed(levels, bans):
    return all(frozenset(p) not in bans for p in itertools.combinations(levels, 2))


_FEASIBLE = {}


def feasible(levels, factors, bans):
    """levels を含み、どの禁則も破らない行が1つでも作れるか。

    禁則どうしが重なると、2水準どうしは禁則でなくても行として成り立たない組ができる
    （例: 2つの禁則で、ある組を含む行の残りの因子に選べる水準が無くなる場合）。
    そうした組は割り付けの対象からも網羅率の分母からも外す。
    """
    key = frozenset(levels)
    if key in _FEASIBLE:
        return _FEASIBLE[key]
    if not allowed(list(levels), bans):
        _FEASIBLE[key] = False
        return False
    fixed = {v[0] for v in levels}
    rest = [f for f in factors if f not in fixed]

    def dfs(i, chosen):
        if i == len(rest):
            return True
        for c in factors[rest[i]][1]:
            if all(frozenset((c, v)) not in bans for v in chosen):
                if dfs(i + 1, chosen + [c]):
                    return True
        return False

    ok = dfs(0, list(levels))
    _FEASIBLE[key] = ok
    return ok


def build(factors, bans):
    fids = list(factors)
    lv = {f: factors[f][1] for f in fids}
    targets = set()
    for fa, fb in itertools.combinations(fids, 2):
        for a in lv[fa]:
            for b in lv[fb]:
                if feasible((a, b), factors, bans):
                    targets.add((a, b))
    rng = random.Random(SEED)
    rows = []
    while targets:
        best, best_gain = None, -1
        first = sorted(targets)[0]
        for _ in range(CANDIDATES):
            row = {}
            # 未カバーの組を1つ必ず含める
            for x in first:
                row[x[0]] = x
            order = [f for f in fids if f not in row]
            rng.shuffle(order)
            ok = True
            for f in order:
                choices = lv[f][:]
                rng.shuffle(choices)
                scored = []
                for c in choices:
                    trial = list(row.values()) + [c]
                    if not feasible(trial, factors, bans):
                        continue
                    gain = sum(1 for v in row.values()
                               if (v, c) in targets or (c, v) in targets)
                    scored.append((gain, c))
                if not scored:
                    ok = False
                    break
                scored.sort(key=lambda t: -t[0])
                row[f] = scored[0][1]
            if not ok:
                continue
            vals = [row[f] for f in fids]
            gain = sum(1 for p in itertools.combinations(vals, 2) if p in targets)
            if gain > best_gain:
                best, best_gain = vals, gain
        if best is None:
            sys.exit("割り付けできない組み合わせが残った: %s" % (first,))
        rows.append(best)
        for p in itertools.combinations(best, 2):
            targets.discard(p)
    return rows


def complete_row(need, factors, bans):
    """need の水準を含み、禁則を破らない行を1つ作る（足りない因子は水準の並び順で最初に成り立つものを選ぶ）。"""
    fids = list(factors)
    fixed = {v[0]: v for v in need}
    rest = [f for f in fids if f not in fixed]

    def dfs(i, chosen):
        if i == len(rest):
            return chosen
        for c in factors[rest[i]][1]:
            if feasible(list(chosen.values()) + [c], factors, bans):
                got = dfs(i + 1, {**chosen, rest[i]: c})
                if got:
                    return got
        return None

    got = dfs(0, dict(fixed))
    return [got[f] for f in fids] if got else None


def add_exception_rows(rows, factors, bans):
    """例外の差し込み条件に合う行が割り付けに無いとき、その条件を含む行を1行足す。足した行の番号を返す。"""
    added = []
    for e in read_tsv("exceptions.tsv"):
        need = e["差し込む元の条件"].split()
        if any(set(need) <= set(row) for row in rows):
            continue
        row = complete_row(need, factors, bans) if feasible(need, factors, bans) else None
        if row is None:
            sys.exit(f"{e['例外ID']} の差し込む元の条件 {need} は禁則に当たり、行を作れない")
        rows.append(row)
        added.append(len(rows))
    return added


def coverage(factors, bans, rows, k):
    fids = list(factors)
    total = covered = 0
    seen = set()
    for row in rows:
        for combo in itertools.combinations(row, k):
            seen.add(combo)
    for fs in itertools.combinations(fids, k):
        for combo in itertools.product(*[factors[f][1] for f in fs]):
            if not feasible(combo, factors, bans):
                continue
            total += 1
            covered += combo in seen
    return covered, total


def main():
    drop_pending = "--with-pending" in sys.argv
    factors, level_name = load()
    bans = load_prohibitions(drop_pending)
    rows = build(factors, bans)
    added = add_exception_rows(rows, factors, bans)
    for row in rows:
        assert allowed(row, bans)
    c2 = coverage(factors, bans, rows, 2)
    c3 = coverage(factors, bans, rows, 3)
    suffix = "_判断待ち禁則なし" if drop_pending else ""
    fids = list(factors)
    head = ["No."] + [factors[f][0] for f in fids]
    with open(HERE / f"matrix{suffix}.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(head + ["水準ID"])
        for i, row in enumerate(rows, 1):
            w.writerow([f"T{i:02d}"] + [level_name[v] for v in row] + [" ".join(row)])
    pct2 = 100 * c2[0] / c2[1]
    pct3 = 100 * c3[0] / c3[1]
    with open(HERE / f"matrix{suffix}.md", "w", encoding="utf-8") as f:
        title = (HERE / "README.md").read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        f.write(f"# {title}：組み合わせテストマトリクス\n\n")
        f.write("因子・水準は `fl_table.tsv`、禁則は `prohibitions.tsv`。"
                "このファイルは `build_matrix.py` が作る（手で直さない）。\n\n")
        f.write(f"- テスト数: {len(rows)}\n")
        f.write(f"- 2因子間網羅率: {pct2:.2f}%（{c2[0]:,}/{c2[1]:,}）\n")
        f.write(f"- 3因子間網羅率: {pct3:.2f}%（{c3[0]:,}/{c3[1]:,}）\n")
        pending = [r["禁則ID"] for r in read_tsv("prohibitions.tsv") if r["扱い"] == "判断待ち"]
        if pending:
            f.write("- 判断待ちの禁則: " + "・".join(pending) + "（" + ("外して作った" if drop_pending else "禁則として扱った") + "）\n")
        f.write("- 禁則: `prohibitions.tsv` の" + str(len(read_tsv("prohibitions.tsv"))) + "件。設計書に無く現行ソース（pf-eccube3）で決めたものは扱い欄に書いた\n")
        f.write("- 禁則どうしが重なって行として成り立たない組は、網羅率の分母から外した\n")
        if added:
            f.write("- 例外の差し込み条件に合う行が割り付けに無かったので、例外用の行を足した: "
                    + "・".join(f"T{i:02d}" for i in added) + "（テスト数に含む）\n")
        f.write("\n")
        f.write("| " + " | ".join(head) + " |\n")
        f.write("|" + "---|" * len(head) + "\n")
        for i, row in enumerate(rows, 1):
            f.write("| " + " | ".join([f"T{i:02d}"] + [level_name[v] for v in row]) + " |\n")
        # 例外（★）は条件に合う行へ1つずつ差し込む。同じ行に重ならないよう、まだ使っていない行を先に選ぶ
        f.write("\n## 例外の差し込み（`exceptions.tsv`）\n\n")
        f.write("| 例外ID | 差し込む元のテスト | 差し込む手順 | 例外（★） | 期待値 |\n|---|---|---|---|---|\n")
        used = set()
        for e in read_tsv("exceptions.tsv"):
            need = set(e["差し込む元の条件"].split())
            hits = [i for i, row in enumerate(rows, 1) if need <= set(row)]
            pick = next((i for i in hits if i not in used), hits[0])
            used.add(pick)
            f.write(f"| {e['例外ID']} | T{pick:02d} | {e['差し込む手順']} | {e['例外（★）']} | {e['期待値']} |\n")
    if added:
        print("例外用に足した行: " + " ".join(f"T{i:02d}" for i in added))
    print(f"rows={len(rows)} pair={pct2:.2f}% ({c2[0]}/{c2[1]}) triple={pct3:.2f}% ({c3[0]}/{c3[1]})")


if __name__ == "__main__":
    main()
