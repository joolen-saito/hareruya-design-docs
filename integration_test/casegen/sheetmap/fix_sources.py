#!/usr/bin/env python3
"""HTML設計書の埋め込み先を直したのに合わせて、ケースの出典のシート名を直す（2026-10-06）。

機能設計書（現行仕様）が別機能のシートに埋め込まれていた機能は、ケースの出典がその誤ったシートを指していた。
埋め込み先を正しいシートへ直したので、出典のシート名だけを書き換える。事前準備・手順・期待結果は変えない。
出典はゲート G6 が基線と照合する列なので、変えたケースを precond/source_changes/<機能ID>.tsv に宣言する。何度流しても同じ。
"""
import pathlib

CG = pathlib.Path(__file__).resolve().parents[1]
PC = CG / "precond"
# 機能ID: (旧, 新, 理由)
FIX = {
    "M15-02": ("0212 デッキ編集 / 現行仕様 M15-02", "0212 デッキ一覧(検索結果) / 現行仕様 M15-02",
               "M15-02 の機能設計書の埋め込み先を、デッキ編集（M15-05 のシート）からデッキ一覧(検索結果)へ直した"),
    "A07-06": ("0507 複数ネット買取IDから個別入力商品の一覧を取得 / 現行仕様 A07-06",
               "0507 複数ネット買取IDからネット買取受注の商品一覧を取得 / 現行仕様 A07-06",
               "A07-06 の機能設計書の埋め込み先を、A07-07 のシートから A07-06 のシートへ直した"),
}


def main():
    (PC / "source_changes").mkdir(exist_ok=True)
    for fid, (old, new, why) in FIX.items():
        p = CG / f"cases/{fid}_test_cases.tsv"
        L = [l for l in p.read_text(encoding="utf-8").split("\n") if l]
        sp = PC / f"source_changes/{fid}.tsv"
        decl = {l.split("\t")[0]: l for l in sp.read_text(encoding="utf-8").split("\n")[1:] if l} if sp.exists() else {}
        n = 0
        for i, l in enumerate(L[1:], 1):
            f = l.split("\t")
            if old in f[10]:
                f[10] = f[10].replace(old, new)
                L[i] = "\t".join(f); n += 1
                decl[f[0]] = f"{f[0]}\t{f[10]}\t{why}"
        p.write_text("\n".join(L) + "\n", encoding="utf-8")
        sp.write_text("\n".join(["テストID\t新出典\t理由"] + [decl[k] for k in sorted(decl)]) + "\n", encoding="utf-8")
        print(f"{fid}: 出典を直した {n}件（宣言 {len(decl)}件）")


if __name__ == "__main__":
    main()
