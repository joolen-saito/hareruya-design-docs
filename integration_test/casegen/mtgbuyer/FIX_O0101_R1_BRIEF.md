# O01-01 ケースの修正依頼（レビュー1巡目の反映）

リポジトリ: `/home/y-saito/Developments/hareruya-design-docs/`。あなたは機能ID **O01-01** のケースを直す著者である。
規約は `integration_test/casegen/mtgbuyer/GEN_O0101_PROMPT.md` のまま。まずそれを読み、次に下を読め。

- 指摘の全文: `integration_test/casegen/mtgbuyer/review/cases_o0101_r1_findings.md`
- 裁定（どう直すか）: `integration_test/casegen/mtgbuyer/review/cases_o0101_r1_dispositions.md`
- 機能設計書 `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md` はレビューを受けて直してある（身分証明書種別の初期値、登録番号の確認の送り方）。必ず読み直せ。

## やること

裁定をすべて反映する。対象は `mtgbuyer/cases/O01-01_mb_test_cases.tsv`・`_mb_seed_data.tsv`・`mtgbuyer/gen_O01-01/report.md` の3つだけ。

- ケースを分ける・足すときは末尾に足す（既存のテストIDは変えない）。分けた元のケースは期待結果を片方に絞る。
- 判定IDを付け替えるときは、観点IDも観点表のその行のものに直す。
- `jwt-token` の照合は、期待結果の1文の中に含める（ケースは分けない）。
- 指摘に挙がっていないケースでも同じ誤りがあれば同じように直す（種別を選ばずに「査定開始」を実行している、受注シードに職業・国が無い、登録番号の確認の値がシードに無い、日時の書式を固定している、1ケースにアプリ側とECCUBE側の期待が混ざっている）。
- 共通の名称・パスワードはケース専用シードに書かず共有シードに置く。ケース専用シードの識別子は、英数字とハイフンの連なり1つ1つに機能とケース番号を入れる。
- report.md の対応表と「書かなかったもの」を直す。report.md を保存できなかったら、回避せずに本文を返答へ載せよ。

最後に `python3 integration_test/casegen/mtgbuyer/verify_mtgbuyer.py O01-01` を合格させよ。

## 返答

3行以内。修正後の件数、足した件数、verify の結果。
