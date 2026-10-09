# ケースが無かった14機能の結合テスト（2026-10-09）

被覆監査（`../coverage_audit/`）で、HTML設計書に節があるのに結合テストケースが1件も無い機能が14見つかった。
いずれも Excel基本設計が無く、現行ソースから起こした機能設計書だけで出来ている冊子（0309・0515・0417）の機能で、区分は現行踏襲。
依頼者決定（2026-10-09）: 14機能はテスト対象。ケースを作る。

| 機能ID | 機能名 | 件数 | codex指摘（1巡目／2巡目） |
| --- | --- | --- | --- |
| F09-01 | デッキ検索TOP | 81 | 11／5 |
| F09-02 | デッキ検索結果 | 57 | 9／4 |
| F09-03 | メタゲーム一覧 | 33 | 6／4 |
| F09-04 | 採用枚数ランキング | 47 | 7／3 |
| F09-05 | その他デッキ一覧 | 35 | 8／6 |
| F09-06 | デッキリスト詳細 | 59 | 4／9 |
| F09-07 | デッキリスト書き出し | 47 | 12／4 |
| F09-08 | デッキ一括購入 | 67 | 8／8 |
| A15-02 | ログアウト | 12 | 6／4 |
| A15-03 | ユーザー情報参照 | 10 | 3／3 |
| A15-04 | 他ユーザー情報参照 | 15 | 4／3 |
| A15-08 | カード検索 | 77 | 5／3 |
| A15-12 | デッキ情報参照 | 34 | 6／4 |
| B17-01 | 最新記事jsonファイル作成 | 11 | 7／5 |

計585件。著者は sonnet（1機能1本）、レビューは codex（2巡まで）。2巡目の指摘を反映した後の版は codex に掛けていない。
合流後の全体は 10,506件・365機能。`verify_nosheet.py` と `precond/gate_precond.py --all` は合格。

## 成果物

| 何 | どこ |
| --- | --- |
| ケース（正本） | `casegen/cases/<機能ID>_test_cases.tsv`・`_seed_data.tsv`。一覧 `all_test_cases.tsv` に入っている |
| 判定IDとの対応 | `nosheet/ns_map.tsv` |
| 作業ファイル | `nosheet/cases/`（12列。直すときはここを直して `merge_into_cases.py`）、`nosheet/gen_<機能ID>/report.md`（設計書の記述とケースの対応、ケースにしなかったものと理由、設計書の不備、裁定待ち、試験環境に要るもの） |
| 材料 | `nosheet/materials/<機能ID>_sheet.txt`（いまのHTMLの節）・`_requirements.tsv`（F09 は要求表が無く空） |
| 依頼文・検査 | `GEN_NOSHEET_PROMPT.md`・`mk_gen.py`、`FIX_BRIEF.md`・`mk_fix.py`、`verify_nosheet.py`、`merge_into_cases.py`、`targets.tsv` |
| レビュー | `review/<機能ID>_r1・r2_findings.md`（codex）、`_dispositions.md`（著者の処置）、`mk_review.py`・`extract.py` |

裁定は `../sheetmap/FIX_R1_BRIEF.md`（A〜L、C'）・`FIX_R2_BRIEF.md`（M〜O）をそのまま使った。判定ID IT-0332〜0347 は使わない（検査が不合格にする）。

## 直すときの手順

1. `nosheet/cases/<機能ID>_ns_test_cases.tsv`・`_ns_seed_data.tsv` を直す
2. `python3 nosheet/verify_nosheet.py`
3. `python3 nosheet/merge_into_cases.py`
4. `python3 build_all_test_cases.py` と `python3 precond/gate_precond.py --all`

## 残っていること

- 合流後の被覆監査で、この14機能に妥当な抜けが28件残った（A15-08 11件、A15-12 4件、F09-06 4件、F09-01・03 各3件ほか。`../coverage_audit/confirmed_gaps.tsv` の指摘ID H）。
- 不具合とみられる現行のふるまい（別言語のキャッシュが使われる、範囲外のページ番号、行番号のずれ など）はケースにせず、各 report.md の「裁定待ち」に挙げた。
- F09-01・F09-07 は著者が report.md を書けず、返答の本文から保存した。F09-04 の1ケースは、識別子が A05-03 と重なったため依頼元が識別子を改名した。
