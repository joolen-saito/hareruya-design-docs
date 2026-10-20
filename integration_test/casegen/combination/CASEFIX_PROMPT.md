# 依頼: {FID} の {PART} のケースを、レビューの指摘で直す（{ROUND}巡目）

あなたは {FID} の {PART}（組 {RANGE}）のケースを書いた著者である（前の会話が無い場合も、同じ決まりで直す）。リポジトリは `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。git の変更操作をしない。

## 読むもの

- 作り方の決まり: `integration_test/casegen/combination/GEN_PROMPT.md`（ケースの書き方・前提条件の決まりは前と同じ）
- 指摘: `integration_test/casegen/combination/review/R{ROUND}_{BUNDLE}_findings.md` のうち、見出しが **{IDS}** のもの（ほかの指摘は別の著者の受け持ち）
- 依頼元の追記: {NOTES}
- あなたのファイル: `integration_test/casegen/combination/cases/{FID}_cb_test_cases.{PART}.tsv`・`_cb_seed_data.{PART}.tsv`・`_cb_dispositions.{PART}.tsv`

## やること

1. 指摘を1件ずつ、**設計書と既存ケースを自分で読んで確かめる**。指摘をそのまま反映しない（レビュアーも誤る）。修正案の語もそのまま採らず、設計書の表記を使う。
2. 正しい指摘だけ直す。直し方は次のどれか。
   - 期待結果に、欠けていた要因の結果を足す（確かめる所が同じものだけ。違う所の結果は足さない）
   - 事前準備・手順を、組の値で処理が動く形に直す
   - 組が作れない・結果が決まらないと分かったら「ケースにしない」へ変える（ケースとそのケース専用シードを消し、dispositions の理由に設計書の原文を引く。テストIDは欠番のままでよい。番号を詰めない）
   - 「既存ケースで確認済み」が当たらないときは、ケースを書く（テストIDは受け持ちの範囲で、いま使っている最大の番号の次）か、「ケースにしない」にする
3. 誤り・範囲外・決まりに反する指摘は却下し、理由を書く。
4. `python3 integration_test/casegen/combination/verify_cb.py {FID}:{PART}` が合格するまで直す。
5. 処置を `integration_test/casegen/combination/review/{FID}_R{ROUND}_dispositions.{PART}.tsv` に書く（タブ区切り・4列: `指摘	処置	理由	直した所`。指摘は見出しのテストIDか組ID。処置は `採用`／`一部採用`／`却下`）。

書いてよいのは上の3つのケースのファイルと dispositions だけ。

## 返答

3行以内: 採用・一部採用・却下の件数、verify の結果、迷った点（あれば1つ）。
