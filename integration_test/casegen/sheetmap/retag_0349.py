#!/usr/bin/env python3
"""レコード（行）の並び順を確かめるケースの判定IDを、IT-0156 から IT-0349 へ付け替える（2026-10-06）。

観点表に「出力したファイルのレコードが、定められた並び順で出力されること」（IT-0349・ITA-05）を足したので、
受け皿の IT-0156（ITA-02）へ当てていたケースを移す。対象は、出力したCSV・帳票の行の並び順を期待結果にしているケースだけ。
ケースの中身は変えない。何度流しても同じ。
"""
import pathlib

G = pathlib.Path(__file__).resolve().parent
TARGETS = ("IT-M04-31-057 IT-M04-32-079 IT-M06-06-010 IT-M06-07-010 IT-M07-06-010 "
           + " ".join(f"IT-M07-09-{i:03d}" for i in range(16, 35))).split()
NEW, VID = "IT-0349", "ITA-05"


def main():
    n = 0
    for fid in sorted({t[3:-4] for t in TARGETS}):
        p = G / f"cases/{fid}_sm_test_cases.tsv"
        L = [l for l in p.read_text(encoding="utf-8").split("\n") if l]
        h = L[0].split("\t"); j, v = h.index("判定ID"), h.index("観点ID")
        for i, l in enumerate(L[1:], 1):
            f = l.split("\t")
            if f[0] in TARGETS:
                assert f[j] in ("IT-0156", NEW), (f[0], f[j])
                if f[j] == "IT-0156":
                    f[j], f[v] = NEW, VID; L[i] = "\t".join(f); n += 1
        p.write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"付け替えた {n}件（対象 {len(TARGETS)}件）")


if __name__ == "__main__":
    main()
