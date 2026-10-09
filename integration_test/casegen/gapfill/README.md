# 被覆監査で見つかった抜けを埋める結合テストケース（2026-10-09）

被覆監査（`../coverage_audit/`）で「設計書に定めがあるのに確かめるケースが無い」と確定した抜け 1,788件について、ケースを足した作業場所。
依頼者決定（2026-10-09）: 抜けもケースを作る。レビューを反映してから統合する。

## 結果

| 抜け 1,788件の扱い | 件数 |
| --- | --- |
| ケース化 | 1,641 |
| ケースにしない（期待結果が設計書から決まらない・記述どうしの食い違い・結合テストの範囲外・不具合とみられる現行のふるまい。理由つき） | 140 |
| 既存ケースで確認済み | 5 |
| 割り当て先の機能が無い（`unassigned.tsv`） | 2 |

足したケースは **1,776件・254機能**（似た抜けを1ケースにまとめたもの、1つの抜けを複数ケースに分けたものがある）。
合流後の全体は **12,282件・365機能**。`verify_gapfill.py` と `../precond/gate_precond.py --all` は合格。

- ケースにしなかった145件の一覧は `not_cased.tsv`（指摘ID・シート・行・理由）。
- 割り当て先が無い2件は「査定完了時に初回買取情報登録APIを呼んでECCUBEへ登録する」（0205 別添資料_店頭買取管理ステータス）。このAPIを持つ機能が機能一覧に無い。

## やり方

| 段 | 何をしたか | 道具 |
| --- | --- | --- |
| 割り当て | 対応機能が無い・複数あるシートの抜け220件を、ふるまいを起こす操作を持つ機能へ割り当てた（同じ冊子に無い22件は依頼元が別冊子の機能へ） | `build_assign.py`、`assign/*_out.tsv`・`overrides_out.tsv` |
| 束ねる | 抜けを機能ごとに束ね、開始番号（既存・保留除外・付け替えの番号の続き）を決める | `build_targets.py` → `targets.tsv`・`targets/<機能ID>_gaps.tsv` |
| 著者 | 1機能1本（sonnet）。抜け1件ごとに ケース化／既存ケースで確認済み／ケースにしない を決める。既存ケースは変えない | `GEN_GAPFILL_PROMPT.md`・`mk_gen.py` → `cases/<機能ID>_gf_test_cases.tsv`（13列。末尾は指摘ID）・`_gf_seed_data.tsv`（足したシードだけ）・`_gf_dispositions.tsv` |
| 検査 | 形式、続き番号、判定ID、シード、抜け全件に扱いが付いていること | `verify_gapfill.py` |
| レビュー | codex 2巡（約50件ずつの束）。1巡目 331件・169機能、2巡目 220件・107機能。著者の処置は 採用457・一部採用20・却下30 | `review/mk_review.py`・`extract.py`、`review/<機能ID>_r1・r2_findings.md`・`_dispositions.tsv`、`FIX_BRIEF.md`・`mk_fix.py` |
| 合流 | `cases/<機能ID>_test_cases.tsv`・`_seed_data.tsv` の末尾へ足す。判定IDと指摘IDは `gf_map.tsv`。足したIDは `precond/added_cases.tsv`、未確定の前提は `open_preconditions.tsv` | `merge_into_cases.py`（何度流しても同じ） |

裁定は `../sheetmap/FIX_R1_BRIEF.md`（A〜L、C'）・`FIX_R2_BRIEF.md`（M〜O）をそのまま使った。

## 直すときの手順

1. `gapfill/cases/<機能ID>_gf_*.tsv` を直す
2. `python3 gapfill/verify_gapfill.py`
3. `python3 gapfill/merge_into_cases.py`
4. `python3 build_all_test_cases.py` と `python3 precond/gate_precond.py --all`

`sheetmap/`・`nosheet/`・`ga/` の `merge_into_cases.py` は該当機能のケースファイルを作り直すので、流したら 3 を流し直す。

## 読むときの注意

- 2巡目の指摘を反映した後の版は codex に掛けていない（レビューは2巡まで）。2巡目でも220件の指摘が出ており、指摘がゼロに収束したわけではない。
- 2巡目の指摘で多かったのは「判定IDの誤り」87件と「抜けを確かめていない」57件。
- 前提条件の検査は、合流前に作業用の写しで流して不合格を著者に直させた。最後に残った3件（B16-11 の識別子2件、M05-27 の事前準備1件）は依頼元が直した。
- 実機では1件も流していない。投入方法が「未確定」のシードを使うケースがある（`../precond/open_preconditions.tsv`）。
- 合流後の被覆監査のやり直しはしていない（足したケースが抜けを実際に埋めているかは、codex レビューの観点3で見ただけ）。
