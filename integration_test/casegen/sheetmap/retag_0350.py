#!/usr/bin/env python3
"""通知メールの内容を確かめるケースの判定IDを、IT-0156 から IT-0350 へ付け替える（2026-10-06）。

観点表に「送信されたメールの件名、送信元、本文の構成が、定められたとおりであること」（IT-0350・ITA-05）を足したので、
受け皿の IT-0156（ITA-02）へ当てていたケースを移す。対象は、メールの件名・送信元・本文の構成を期待結果にしているケースだけ。
どのデータを通知に載せるか（対象の抽出）、通知しない条件、起動時刻は IT-0156 のまま。ケースの中身は変えない。何度流しても同じ。
"""
import pathlib

G = pathlib.Path(__file__).resolve().parent
TARGETS = """IT-B08-04-008 IT-B08-04-010 IT-B08-07-010 IT-B08-07-011 IT-B08-07-012 IT-B08-07-013 IT-B08-07-019
IT-B16-11-009 IT-B16-11-010 IT-B16-11-015""".split()
NEW, VID = "IT-0350", "ITA-05"


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
