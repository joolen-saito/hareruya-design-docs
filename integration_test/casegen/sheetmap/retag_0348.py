#!/usr/bin/env python3
"""出力項目の構成と並びを確かめるケースの判定IDを、IT-0156 から IT-0348 へ付け替える（2026-10-06）。

観点表に「出力したファイルの各レコードが、定められた出力項目だけで構成され、定められた順に並ぶこと」（IT-0348・ITA-05）を
足したので、受け皿の IT-0156（ITA-02）へ当てていたケースを移す。対象は、項目の構成・位置を期待結果にしているケースだけ。
行（レコード）の並び順、初期値、未選択時の扱いなどは IT-0156 のまま。ケースの中身は変えない。何度流しても同じ。
"""
import pathlib

G = pathlib.Path(__file__).resolve().parent
TARGETS = """IT-M04-31-054 IT-M04-32-077 IT-M04-32-082 IT-M05-07-001 IT-M06-06-001 IT-M06-07-001 IT-M07-06-001
IT-M07-07-001 IT-M07-09-037 IT-M08-03-001 IT-M08-03-003 IT-M13-09-002 IT-M13-09-003 IT-M14-02-001""".split()


def main():
    n = 0
    for fid in sorted({t[3:-4] for t in TARGETS}):
        p = G / f"cases/{fid}_sm_test_cases.tsv"
        L = [l for l in p.read_text(encoding="utf-8").split("\n") if l]
        h = L[0].split("\t"); j, v = h.index("判定ID"), h.index("観点ID")
        for i, l in enumerate(L[1:], 1):
            f = l.split("\t")
            if f[0] in TARGETS:
                assert f[j] in ("IT-0156", "IT-0348"), (f[0], f[j])
                if f[j] == "IT-0156":
                    f[j], f[v] = "IT-0348", "ITA-05"; L[i] = "\t".join(f); n += 1
        p.write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"付け替えた {n}件（対象 {len(TARGETS)}件）")


if __name__ == "__main__":
    main()
