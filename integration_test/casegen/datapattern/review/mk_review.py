#!/usr/bin/env python3
"""codex へのレビュー依頼文を束で作る。 mk_review.py <巡>  → review/R<巡>_<nn>_prompt.md、review/R<巡>_bundles.tsv

../../gapfill/review/mk_review.py と同じ作り。1束は、追加ケースと「ケースにしない」「既存ケースで確認済み」の合計がおよそ50件（機能を割らない）。
2巡目は、1巡目で指摘が出た機能と、前提条件の検査で不合格が出た機能だけを対象にする。
mk_review.py <巡> <機能IDのカンマ区切り> <開始の束番号>  は、挙げた機能だけで束を足す（束の一覧には追記）。
"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parents[1]
rnd = sys.argv[1]
ONLY = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
START = int(sys.argv[3]) if len(sys.argv) > 3 else 1
T = list(csv.DictReader(open(G / "targets.tsv", encoding="utf-8"), delimiter="\t"))
def n(p):
    return max(0, sum(1 for _ in open(p, encoding="utf-8")) - 1) if p.exists() else 0
items = []
for r in T:
    f = r["機能ID"]
    if ONLY is not None and f not in ONLY:
        continue
    if rnd != "1" and not ((G / f"review/{f}_r1_findings.md").exists() or (G / f"review/{f}_r1_gate.txt").exists()):
        continue
    c = n(G / f"cases/{f}_dp_test_cases.tsv")
    d = sum(1 for l in open(G / f"cases/{f}_dp_dispositions.tsv", encoding="utf-8") if "\tケースにしない\t" in l or "\t既存ケースで確認済み\t" in l)
    if c + d:
        items.append((f, r["機能名"], c + d))
bundles, cur, s = [], [], 0
for it in items:
    if cur and s + it[2] > 50:
        bundles.append(cur); cur, s = [], 0
    cur.append(it); s += it[2]
if cur:
    bundles.append(cur)
prev = "" if rnd == "1" else """
## 前の巡

1巡目の指摘が `datapattern/review/<機能ID>_r1_findings.md`、著者の処置が `<機能ID>_r1_dispositions.tsv` にある。却下の理由が設計書の原文に照らして妥当なら、同じ指摘を繰り返さない。採用したはずの指摘が実際に直っているか、直した結果に新しい誤りが入っていないかを見て、新しい事実の指摘だけを挙げる。
"""
rows = []
for i, b in enumerate(bundles, START):
    tbl = "\n".join(f"| {f} | {nm} |" for f, nm, _ in b)
    (G / f"review/R{rnd}_{i:02d}_prompt.md").write_text(f"""# 敵対レビュー依頼：データパターンの結合テストケース（{rnd}巡目・束{i:02d}・{len(b)}機能）

あなたはレビュアーである。著者とは別人として、下の追加ケースを根拠と突き合わせ、誤りを指摘せよ。ファイルは変更しない。スクリプトやコマンドは読むだけで実行しない（grep・cat 等の閲覧は可。rg は使わない）。出力は日本語。
レビューは事実確認に限る。設計書に無い仕様を足す提案はしない。

## 背景（依頼者決定 2026-10-15）

ケースは設計書の定め1件ごとに作られ、同じ定めをデータを変えて通す確認（数量1と複数、組合せ、有無、混在、状態・区分ごと、端数、ちょうどの値、同じデータの重ね）が無かった。
機能ごとの監査で「設計書がそのデータの違いで結果が変わると定めているのに、そのデータで確かめるケースが無い」抜けを挙げ、codex の反証で残った抜けについて、著者が既存ケースの続き番号で追加ケースを書いた。
抜け1件ごとの扱い（ケース化／既存ケースで確認済み／ケースにしない）は dispositions に書いてある。

## 対象（/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/ 配下）

| 機能ID | 機能名 |
| --- | --- |
{tbl}

機能ごとに次を読む。
- 追加ケース `datapattern/cases/<機能ID>_dp_test_cases.tsv`（13列。末尾は埋めた抜けの項目ID）、追加シード `<機能ID>_dp_seed_data.tsv`、仕分け `<機能ID>_dp_dispositions.tsv`
- 抜けの一覧 `datapattern/targets/<機能ID>_gaps.tsv`（パターン／定め／根拠の行／試すデータ／設計書から決まる結果／確かめる所）
- 設計書 `datapattern/units/<機能ID>/design.txt`（行頭 L0001 が行番号。`#####` の行はシートの境目。根拠が `_common/…` のものは `datapattern/units/_common/`）
- 既存のケースとシード `cases/<機能ID>_test_cases.tsv`・`<機能ID>_seed_data.tsv`（追加ケースが使う共有シードはここにある）

規約は `datapattern/GEN_PROMPT.md`、裁定は `sheetmap/FIX_R1_BRIEF.md`（A〜L、C'）・`FIX_R2_BRIEF.md`（M〜O）、範囲は `integration_test/SCOPE.md`、前提条件は `precond/README.md`、判定単位は `integration_test/viewpoint_canonical/viewpoints_canonical.tsv` の IT-0356〜0363。
期待結果の根拠は設計書に限る。実装（`/home/y-saito/Developments/ec-cube-enterprise`）は、事前準備と手順の実行可能性を確かめるためにだけ読む。実装と設計書が違うことは指摘しない。
`datapattern/review/` の `*_out.txt`・`datapattern/verify/`・`datapattern/audit/` と、上の表に無い機能の datapattern/cases のファイルは読まない。
{prev}
## 意図的であり指摘対象外のもの

- 連鎖IDが空欄、要求IDが空欄であること。保留のケースが無いこと。既存ケースを変えていないこと。
- 判定IDがパターンで決まっていること（数量・件数 IT-0356／組合せ 0357／有無 0358／混在 0359／状態・区分ごと 0360／端数 0361／ちょうどの値 0362／同じデータの重ね 0363）。
- 単体テスト・e2e へ送られるもの（画面上だけの入力制限、表示文言の逐語照合、見た目、計算式そのもの）のケースが無いこと。
- シードの投入方法が「未確定: …」と書かれていること。
- 抜けの一覧に無い定めのケースが無いこと（今回の範囲は抜けの一覧だけ）。

## 重点観点

1. **データの違いがケースにあるか**: 事前準備に、抜けの「試すデータ」（数量、明細の数、有無、組合せの値、状態・区分、端数の出る単価、ちょうどの値、1回目の操作の結果）が値で書かれ、手順がそのデータで操作しているか。既存ケースと同じデータで同じことを確かめているだけになっていないか。
2. 期待結果が、設計書の記述と事前準備の値だけから一意に出るか。設計書に無い値・ふるまいを期待していないか。数量・金額・件数の計算が合っているか。現行仕様と刷新の指示が食い違うとき、刷新を採っているか。
3. 事前準備の状態から手順を実行して期待結果に到達できるか。単独で成立するか。「このN件だけ」を期待するのに、同じ条件に当たる他のデータを除く記述があるか。
4. 1ケースに複数の期待結果（判定単位の違う確認、データの違う2つの抜け）が混じっていないか。既存ケースとの重複、物理名の混入。
5. 「ケースにしない」とした抜けのうち、設計書の記述から期待結果が一意に決まるもの。「既存ケースで確認済み」としたもののうち、挙げたケースが実際にはそのデータで確かめていないもの。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で、機能IDの順に書く。1機能あたり最大8件。確信の持てないものは挙げない。見出しの括弧の先頭は必ず機能ID。

```
### 指摘（<機能ID> / <テストID または 項目ID>）
- 主張: ケースまたは仕分けの記述（要点の引用）
- 実際: 設計書の事実（design.txt の行番号。原文を引く）
- 判定: データの違いが無い／期待結果の誤り／設計書に無い期待／成立しない前提・手順／抜けを確かめていない／複数の期待結果／重複／ケースにできる／確認済みでない
- 修正案: 結論を先に置いた1〜2文
```
""", encoding="utf-8")
    rows += [[f"R{rnd}_{i:02d}", f] for f, *_ in b]
with open(G / f"review/R{rnd}_bundles.tsv", "a" if ONLY else "w", encoding="utf-8") as f:
    f.write(("" if ONLY else "束\t機能ID\n") + "".join(f"{a}\t{b}\n" for a, b in rows))
print(len(bundles), "束", len(items), "機能", sum(x[2] for x in items), "件")
