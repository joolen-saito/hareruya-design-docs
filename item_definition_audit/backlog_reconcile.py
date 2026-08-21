#!/usr/bin/env python3
"""FINDINGS_DETAIL.tsv から Backlog 起票済みの所見を除外する。

突合対象は Backlog プロジェクト ECCUBE_HARERUYA のカテゴリ「不具合（バグ）」(id=511360)。
突合は「設計書番号 / シート(画面) / 識別ID / 項目 / 設計値 / 実装値」がチケット本文と
一致することを人手で確認した結果を MATCH に固定してある（機械の類似度判定ではない）。

  python3 backlog_reconcile.py          # 差分表示のみ
  python3 backlog_reconcile.py --apply  # TSV を書き換え、除外分を別ファイルへ退避
"""
import csv, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TSV = HERE / "FINDINGS_DETAIL.tsv"
OUT_MATCHED = HERE / "FINDINGS_DETAIL_backlog_matched.tsv"

# TSV の行番号(ヘッダ=1) -> 起票済み Backlog 課題キー
MATCH = {
    # 1-1 D_HTML孤立
    2: "ECCUBE_HARERUYA-2192", 3: "ECCUBE_HARERUYA-2193", 4: "ECCUBE_HARERUYA-2194",
    5: "ECCUBE_HARERUYA-2064", 6: "ECCUBE_HARERUYA-2064", 7: "ECCUBE_HARERUYA-2064",
    9: "ECCUBE_HARERUYA-2064", 10: "ECCUBE_HARERUYA-2064", 11: "ECCUBE_HARERUYA-2064",
    12: "ECCUBE_HARERUYA-2064", 13: "ECCUBE_HARERUYA-2064", 14: "ECCUBE_HARERUYA-2064",
    15: "ECCUBE_HARERUYA-2064", 16: "ECCUBE_HARERUYA-2064", 17: "ECCUBE_HARERUYA-2064",
    18: "ECCUBE_HARERUYA-2104", 19: "ECCUBE_HARERUYA-2113", 20: "ECCUBE_HARERUYA-2166",
    21: "ECCUBE_HARERUYA-2167", 22: "ECCUBE_HARERUYA-2158", 23: "ECCUBE_HARERUYA-2259",
    # 1-2 D2_HTML≠ee
    25: "ECCUBE_HARERUYA-2352", 26: "ECCUBE_HARERUYA-2352", 27: "ECCUBE_HARERUYA-2352",
    28: "ECCUBE_HARERUYA-2062", 29: "ECCUBE_HARERUYA-2063", 30: "ECCUBE_HARERUYA-2124",
    31: "ECCUBE_HARERUYA-2115", 32: "ECCUBE_HARERUYA-2163", 33: "ECCUBE_HARERUYA-2164",
    34: "ECCUBE_HARERUYA-2159", 35: "ECCUBE_HARERUYA-1890", 36: "ECCUBE_HARERUYA-1890",
    37: "ECCUBE_HARERUYA-1893", 38: "ECCUBE_HARERUYA-1863", 39: "ECCUBE_HARERUYA-1863",
    # 1-3 C_HTML=pf≠ee
    40: "ECCUBE_HARERUYA-2352", 42: "ECCUBE_HARERUYA-2065", 43: "ECCUBE_HARERUYA-2065",
    44: "ECCUBE_HARERUYA-1977", 46: "ECCUBE_HARERUYA-2105", 47: "ECCUBE_HARERUYA-2111",
    48: "ECCUBE_HARERUYA-2111", 50: "ECCUBE_HARERUYA-2258", 51: "ECCUBE_HARERUYA-2258",
    52: "ECCUBE_HARERUYA-2258", 53: "ECCUBE_HARERUYA-2258", 54: "ECCUBE_HARERUYA-2260",
    55: "ECCUBE_HARERUYA-2258", 56: "ECCUBE_HARERUYA-2217", 57: "ECCUBE_HARERUYA-2218",
    58: "ECCUBE_HARERUYA-1891", 59: "ECCUBE_HARERUYA-1891", 60: "ECCUBE_HARERUYA-1902",
    61: "ECCUBE_HARERUYA-1902", 62: "ECCUBE_HARERUYA-1905", 63: "ECCUBE_HARERUYA-1905",
    # 2-1 ND1
    64: "ECCUBE_HARERUYA-2352", 65: "ECCUBE_HARERUYA-2352", 66: "ECCUBE_HARERUYA-2352",
    67: "ECCUBE_HARERUYA-2352", 68: "ECCUBE_HARERUYA-2352", 69: "ECCUBE_HARERUYA-2352",
    70: "ECCUBE_HARERUYA-2352", 71: "ECCUBE_HARERUYA-2352",
    # 2-2 ND2
    73: "ECCUBE_HARERUYA-1943", 74: "ECCUBE_HARERUYA-1943", 81: "ECCUBE_HARERUYA-2213",
    # 3-1 必須◯だが NotBlank 無し
    85: "ECCUBE_HARERUYA-2353", 86: "ECCUBE_HARERUYA-2353", 87: "ECCUBE_HARERUYA-2353",
    88: "ECCUBE_HARERUYA-2353", 98: "ECCUBE_HARERUYA-2157", 112: "ECCUBE_HARERUYA-2211",
    124: "ECCUBE_HARERUYA-1854",
    # 3-2 任意だが NotBlank あり
    164: "ECCUBE_HARERUYA-2112",
    # 4-1 Form が DB列長を超える
    174: "ECCUBE_HARERUYA-2208", 175: "ECCUBE_HARERUYA-2209",
    # 4-2 Assert\Length 欠落
    180: "ECCUBE_HARERUYA-2165", 181: "ECCUBE_HARERUYA-2165",
    182: "ECCUBE_HARERUYA-2165", 183: "ECCUBE_HARERUYA-2165",
}


def main():
    apply = "--apply" in sys.argv
    with TSV.open(encoding="utf-8") as f:
        header = f.readline().rstrip("\n")
        lines = [l.rstrip("\n") for l in f]

    keep, dropped = [], []
    for i, line in enumerate(lines, start=2):
        (dropped if i in MATCH else keep).append((i, line))

    unknown = sorted(set(MATCH) - {i for i, _ in dropped})
    if unknown:
        sys.exit(f"MATCH に存在しない行番号: {unknown}")

    print(f"全 {len(lines)} 件 / 起票済みとして除外 {len(dropped)} 件 / 残 {len(keep)} 件")
    for i, line in dropped:
        c = line.split("\t")
        print(f"  L{i:3d} {MATCH[i]:22s} {c[0]} {c[2]}/{c[3]} #{c[4]} {c[5]}")

    if not apply:
        print("\n（--apply を付けると書き換えます）")
        return

    shutil.copy2(TSV, TSV.with_suffix(".tsv.bak"))
    with OUT_MATCHED.open("w", encoding="utf-8", newline="") as f:
        f.write("Backlog課題キー\t元行番号\t" + header + "\n")
        for i, line in dropped:
            f.write(f"{MATCH[i]}\t{i}\t{line}\n")
    with TSV.open("w", encoding="utf-8", newline="") as f:
        f.write(header + "\n")
        for _, line in keep:
            f.write(line + "\n")
    print(f"\n書き換え完了。除外分 -> {OUT_MATCHED.name} / 元ファイル -> {TSV.name}.bak")


if __name__ == "__main__":
    main()
