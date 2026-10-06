#!/usr/bin/env python3
"""別の機能IDのファイルに入っていたケースを、正しい機能IDのファイルへ付け替える（2026-10-06）。

対応表の取り違え（Excelのシートの機能No欄の誤記）で、別機能のシートを材料にして作られたケースが対象。
ケースの中身（事前準備・手順・期待結果・出典）は変えない。変えるのはテストIDとシードIDの機能IDの部分だけ。
前提条件の付帯表（renames・step_changes・oracle_changes・readonly_cases・sequential_only・open_preconditions）も一緒に移し、
旧テストIDとの対応を precond/moved_cases.tsv に残す。ゲート G6 はこの表を見て、移した先のケースを移す前の基線と照合する。
行は文字列のまま移す（読み書きで引用符が変わらないようにするため）。何度流しても同じ。
"""
import pathlib, re

CG = pathlib.Path(__file__).resolve().parents[1]
PC = CG / "precond"
DAY = "2026-10-06"
# (元の機能, 先の機能, 移すケース番号, 理由)
MOVES = [
    ("M04-09", "M04-08", [f"{i:03d}" for i in range(1, 15)],
     "出典が 0202 在庫移動・振替検索一覧(検索・結果) だけのケース。このシートは目次で M04-08（シートの機能No欄が M04-09 と誤記）"),
    ("M03-44", "M03-43", [f"{i:03d}" for i in range(1, 6)],
     "低価格帯カード価格変更CSVの出力を確かめるケース。機能一覧で出力は M03-43、M03-44 は登録（シートの機能No欄が M03-44 と誤記）"),
]


def lines(p):
    return p.read_text(encoding="utf-8").split("\n") if p.exists() else []


def put(p, ls):
    ls = [l for l in ls if l != ""]
    p.write_text("\n".join(ls) + "\n", encoding="utf-8")


def seeds_of(ls):
    return {s.strip() for l in ls for s in re.split(r"[,、]", l.split("\t")[6]) if s.strip()}


def main():
    moved_tbl = [l for l in lines(PC / "moved_cases.tsv") if l] or ["旧テストID\t新テストID\t移動日\t理由"]
    have = {l.split("\t")[0] for l in moved_tbl[1:]}
    for src, dst, nums, why in MOVES:
        old = [f"IT-{src}-{n}" for n in nums]
        cp, sp = CG / f"cases/{src}_test_cases.tsv", CG / f"cases/{src}_seed_data.tsv"
        C, S = [l for l in lines(cp) if l], [l for l in lines(sp) if l]
        mv = [l for l in C[1:] if l.split("\t")[0] in old]
        if not mv:
            print(f"{src}→{dst}: 移すケースが元のファイルに無い（付け替え済み）"); continue
        assert len(mv) == len(old), (src, len(mv))
        rest = [l for l in C[1:] if l.split("\t")[0] not in old]
        s_mv, s_rest = seeds_of(mv), seeds_of(rest)
        ren = sorted(s_mv, key=len, reverse=True)          # 移す側が使うシードは、先の機能のIDにする

        def conv(l):
            """移すケースのテストIDと、移す側が使うシードIDの、機能IDの部分だけを書き換える"""
            for s in ren:
                l = re.sub(re.escape(s) + r"(?![A-Za-z0-9-])", s.replace(f"S-{src}-", f"S-{dst}-", 1), l)
            for n in nums:
                l = l.replace(f"IT-{src}-{n}", f"IT-{dst}-{n}")
            return l

        def conv_seed(l):
            """シードの行。用途欄の「IT-<元>-001〜005」のような範囲の書き方も先の機能IDにする"""
            return re.sub(rf"IT-{src}-(?=\d{{3}})", f"IT-{dst}-", conv(l))
        # ケース
        put(CG / f"cases/{dst}_test_cases.tsv", [C[0]] + [conv(l) for l in mv])
        put(cp, [C[0]] + rest)
        # シード: 移す側だけが使うものは移す。残る側も使う共有シードは写す
        put(CG / f"cases/{dst}_seed_data.tsv", [S[0]] + [conv_seed(l) for l in S[1:] if l.split("\t")[0] in s_mv])
        put(sp, [S[0]] + [l for l in S[1:] if l.split("\t")[0] not in (s_mv - s_rest)])
        # 付帯表（機能ごとのファイル）
        for d in ("renames", "step_changes", "oracle_changes", "readonly_cases"):
            p = PC / f"{d}/{src}.tsv"
            L = [l for l in lines(p) if l]
            hit = [l for l in L[1:] if l.split("\t")[0] in old]
            if hit:
                put(PC / f"{d}/{dst}.tsv", [L[0]] + [conv(l) for l in hit])
                put(p, [L[0]] + [l for l in L[1:] if l.split("\t")[0] not in old])
        # 順に実行するケースの表
        p = PC / "sequential_only.tsv"
        L = [l for l in lines(p) if l]
        put(p, [L[0]] + [(dst + conv(l)[len(src):]) if (l.startswith(src + "\t") and l.split("\t")[1] in old) else l
                         for l in L[1:]])
        # 未確定の前提: 影響ケースを元の機能と先の機能に分ける
        p = PC / "open_preconditions.tsv"
        L = [l for l in lines(p) if l]
        out = [L[0]]
        for l in L[1:]:
            f = l.split("\t")
            ids = f[3].split(",")
            if f[0] == src and any(o in ids for o in old):
                keep, go = [i for i in ids if i not in old], [i for i in ids if i in old]
                if keep:
                    out.append("\t".join(f[:3] + [",".join(keep)] + f[4:]))
                g = [conv(x) for x in f]
                g[0] = dst; g[1] = g[1].replace(src, dst); g[3] = ",".join(conv(i) for i in go)
                out.append("\t".join(g))
            else:
                out.append(l)
        put(p, out)
        moved_tbl += [f"{o}\t{conv(o)}\t{DAY}\t{why}" for o in old if o not in have]
        print(f"{src}→{dst}: {len(mv)}件を付け替えた（シード 移す{len(s_mv - s_rest)}・写す{len(s_mv & s_rest)}）")
    put(PC / "moved_cases.tsv", moved_tbl)


if __name__ == "__main__":
    main()
