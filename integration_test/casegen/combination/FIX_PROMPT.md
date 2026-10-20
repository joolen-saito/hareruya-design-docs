# 依頼: 機能 {FID} の要因表を、反証の指摘で直す

あなたは {FID} の要因表を作った担当である（前の会話が無い場合も、同じ決まりで直す）。リポジトリは `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。git の変更操作をしない。

## 読むもの

- 作り方の決まり: `integration_test/casegen/combination/FACTOR_PROMPT.md`（前と同じ。最初に読み直す）
- 要因表: `integration_test/casegen/combination/factors/{FID}_*.tsv`
- codex の指摘: `integration_test/casegen/combination/review/{REVIEW}_out.txt` の末尾（最後の `codex` の行より後ろ。途中に出てくる文は codex の作業の記録で、指摘ではない）
- 依頼元の追記: {NOTES}

## やること

1. 指摘を1件ずつ、**設計書とケースを自分で読んで確かめる**。指摘をそのまま反映しない（レビュアーも誤る）。修正案の語もそのまま採らず、設計書の表記を使う。
2. 正しい指摘だけ要因表を直す。誤り・範囲外・決まりに反する指摘は却下し、理由を書く。
3. `python3 integration_test/casegen/combination/gate_factors.py {FID}` が合格するまで直す。
4. 処置を `integration_test/casegen/combination/review/{FID}_{REVIEW}_dispositions.tsv` に書く（タブ区切り・4列: `番号	処置	理由	直した所`。処置は `採用`／`一部採用`／`却下`。依頼元の追記への処置も `追記1` などの番号で同じ表に書く）。

書いてよいのは `factors/{FID}_*.tsv` と上の dispositions だけ。`combos/` は gate が作り直す。

## 返答

3行以内: 採用・一部採用・却下の件数、gate の結果と行の数（前→後）、迷った点（あれば1つ）。
