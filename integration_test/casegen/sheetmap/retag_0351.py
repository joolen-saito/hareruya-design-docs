#!/usr/bin/env python3
"""バッチの異常終了・後片付け・出力メッセージを確かめるケースの判定IDを、IT-0156 から IT-0351〜0354 へ付け替える（2026-10-07）。

観点表に次の4行を足したので、受け皿の IT-0156（ITA-02）へ当てていたケースを移す。
  IT-0351（ITA-14）異常として定められた条件で、バッチが異常終了として終わる
  IT-0352（ITA-13）異常終了した場合、異常の後に行わないと定められた処理が行われていない
  IT-0353（ITA-13）終了後、一時的な資源が定められたとおりに削除されている・残っている
  IT-0354（ITA-21）出力メッセージが、定められた条件のときに定められた文言で出力される
対象は、期待結果がこのどれかそのものであるケースだけ。異常でない場面での「送られない」「作られない」、
出力ファイルの形式、マスクの内容などは IT-0156 のまま。ケースの中身は変えない。何度流しても同じ。
"""
import pathlib

G = pathlib.Path(__file__).resolve().parent
PLAN = {
    ("IT-0351", "ITA-14"): {"B16-06": "022 026 031 040 061", "B16-10": "013 024 035 037 074",
                            "B16-11": "031 033 042 044", "B08-07": "052 056"},
    ("IT-0352", "ITA-13"): {"B16-06": "017 023 024 028 033 060", "B16-10": "015 038 039 042 097",
                            "B16-11": "032 043 045", "B08-07": "036 049 050 051 053 054 057 058"},
    ("IT-0353", "ITA-13"): {"B16-06": "018 027 032 041 045 046 047 048", "B16-10": "014 023 043 079 088",
                            "B16-11": "047"},
    ("IT-0354", "ITA-21"): {"B16-10": "012 021 022 036 041 077 078 081 084 089", "B16-11": "025 026 030",
                            "B08-07": "035 048"},
}


def main():
    want = {}
    for (new, vid), m in PLAN.items():
        for fid, nos in m.items():
            for no in nos.split():
                t = f"IT-{fid}-{no}"; assert t not in want, t
                want[t] = (new, vid)
    n = 0; seen = set()
    for fid in sorted({t[3:-4] for t in want}):
        p = G / f"cases/{fid}_sm_test_cases.tsv"
        L = [l for l in p.read_text(encoding="utf-8").split("\n") if l]
        h = L[0].split("\t"); j, v = h.index("判定ID"), h.index("観点ID")
        for i, l in enumerate(L[1:], 1):
            f = l.split("\t")
            if f[0] in want:
                new, vid = want[f[0]]; seen.add(f[0])
                assert f[j] in ("IT-0156", new), (f[0], f[j])
                if f[j] == "IT-0156":
                    f[j], f[v] = new, vid; L[i] = "\t".join(f); n += 1
        p.write_text("\n".join(L) + "\n", encoding="utf-8")
    assert seen == set(want), sorted(set(want) - seen)
    print(f"付け替えた {n}件（対象 {len(want)}件）")


if __name__ == "__main__":
    main()
