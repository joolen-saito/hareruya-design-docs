# MTGバイヤー（店頭買取・ネット買取・入庫モード）と A07-07 の結合テスト

依頼者決定（2026-10-06）: 現行踏襲の O01-02（ネット買取）・O01-03（入庫モード）は、Excel基本設計にシートが無くケースが0件だった。
現行アプリのソース（`front-application/MTGBuyer`）を解析して機能設計書を起こし、結合テスト観点に照らしてケースを作る。
A06-15（同一所属店舗メンバー取得）は設計書の目次で欠番（不要）とされているので、ケースを作らない。

同日の追加決定: O01-01（店頭買取）と A07-07（複数ネット買取IDから個別入力商品の一覧を取得）は、HTML設計書にシートがあるのに、シートの機能No欄の誤記（0601 シート3が M06-01、0507 シート9が A07-06）で対応表が取り違えられ、ケースが0件だった。対応表 `functions/function-sheet-map.tsv` を直し、ケースを作る。既存の A07-05・A07-06・M06-01 のケースは要求IDが固定なので変えていない。

## 成果物

| 何 | どこ |
| --- | --- |
| 機能設計書（現行アプリのソースから起こした） | `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md`、`o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md`、`o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md`。A07-07 は既存の `functions/pf-api/a07-07_*.md` をそのまま使う |
| Excel由来の要求行（O01-01・A07-07） | `mtgbuyer/materials/<機能ID>_requirements.tsv`（`requirements_all.tsv` からの抜き出し。ケースの要求ID列に使う） |
| ケース（正本） | `casegen/cases/` の `O01-01`（117件）・`O01-02`（81件）・`O01-03`（32件）・`A07-07`（12件）の `_test_cases.tsv` と `_seed_data.tsv`。計242件。一覧 `all_test_cases.tsv` に入っている |
| 判定IDとの対応 | `mtgbuyer/mb_map.tsv`（一覧の11列に判定ID列は無い） |
| 作業ファイル | `mtgbuyer/cases/`（12列・判定ID列あり。直すときはここを直して `merge_into_cases.py` を流す）、`mtgbuyer/gen_<機能ID>/report.md`（設計書の行とケースの対応、書かなかったものと理由、試験環境に要るもの） |
| 依頼文・検査 | `GEN_MTGBUYER_PROMPT.md`（O01-02・03）、`GEN_O0101_PROMPT.md`、`GEN_A0707_PROMPT.md`、`FIX_*_BRIEF.md`、`verify_mtgbuyer.py`、`merge_into_cases.py` |
| レビュー | O01-02・03: `review/spec_r1・r2_dispositions.md`（設計書。codex 2巡・13件）、`review/cases_r1〜r3_dispositions.md`（ケース。3巡・33件）／O01-01: `review/spec_o0101_r1_dispositions.md`（設計書。1巡・7件）、`review/cases_o0101_r1・r2_dispositions.md`（ケース。2巡・23件）／A07-07: `review/cases_a0707_r1_dispositions.md`（ケース。1巡・8件）。codex の生の出力（`*_out.txt`）はコミットしていない |

## 範囲

- 見るのは、現行のままのアプリと刷新後のECCUBEの間の受け渡し（送る内容、取り込む内容、状態の更新、失敗時の扱い）と、アプリが出力するファイル（査定途中のデータ、入庫モードのCSV）。
- ECCUBE側のAPI単体は A06・A07 のケースが持つ。アプリの中だけで完結する確認は書いていない。
- 判定単位は観点表の既存の行だけを使う（IT-0317〜0320、0212・0213、0216・0217、0219、0322、0069〜0072、0074、0080。A07-07 は加えて IT-0010・0011・0215・0224）。足していない。

## 残っていること

- HTML設計書の誤りは直していない。0601 シート3の機能No欄（M06-01）と埋め込み（M06-01 の機能設計書）、0507 シート8・9の機能No欄（A07-05・A07-06）と埋め込み（シート8に A07-07、シート9に A07-06）。O01-01〜03 の機能設計書も 0601 へ埋め込んでいない。ケースの出典は機能設計書の小見出しと、シートのExcel由来の部分を指している。直すと要求IDが振り直され、既存ケースの要求IDと合わなくなるので、進め方の決定が要る。
- 各機能とも、最後のレビュー巡の指摘を反映した後は codex に掛けていない。
- O01-01 の R001・R005〜R007（削除した行をキャンセル商品としてECCUBEへ連携する）はケースを作っていない。呼び出し先の A06-14 がフェーズ2送りで、現行アプリにも実装が無く、シートの「PH2で対応」の注記がどの項目を指すかが未確定。
- A07-07 の `saleFlg` の型（HTML設計書は文字列、現行ソースは真偽値）と、`ids` 欠落時のふるまい（設計書に無い）は設計の確認事項。ケースは値だけを照合している。
- 入庫モードが出力したCSVの取込先は、アプリで定められていない。取り込むケースは作っていない。
- 試験基盤（アプリを置く試験端末、通信の中継、試験用のファイル保管先、端末内の一時データの置き場所）は未整備。`precond/open_preconditions.tsv` に載せた（MTGバイヤーの230件すべてが該当）。
- アプリが呼ぶパスは `api/v1/...` で、API設計書（0506・0507）のパスは `/api/...` である。刷新後のECCUBEが現行アプリの要求をそのまま受けられるかは、この試験の前に確かめる必要がある。

## 直すときの手順

1. `mtgbuyer/cases/<機能ID>_mb_test_cases.tsv`・`_mb_seed_data.tsv` を直す
2. `python3 mtgbuyer/verify_mtgbuyer.py`
3. `python3 mtgbuyer/merge_into_cases.py`
4. `python3 build_all_test_cases.py` と `python3 precond/gate_precond.py --all`
