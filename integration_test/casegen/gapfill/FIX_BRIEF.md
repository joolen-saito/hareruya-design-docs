# レビュー指摘の反映（著者への依頼）: {FID} / {R}巡目

リポジトリ: `/home/y-saito/Developments/hareruya-design-docs/`。あなたは機能ID **{FID}** の追加ケース（被覆監査の抜けを埋めるケース）の著者である。出力は日本語。

反映するもの:
1. codex のレビュー指摘 `integration_test/casegen/gapfill/review/{FID}_r{R}_findings.md`（無ければ指摘なし）
2. 前提条件の検査の不合格 `integration_test/casegen/gapfill/review/{FID}_gate.txt`（無い・空なら不合格なし）

指摘は1件ずつ、**引かれている設計書の記述を `coverage_audit/units/<単位>/sheet.txt` で自分で読み直して事実かどうか確かめてから**反映する。そのまま適用しない。

## 読むもの

1. `integration_test/casegen/gapfill/GEN_GAPFILL_PROMPT.md`（書式と決まり。`python3 integration_test/casegen/gapfill/mk_gen.py {FID}` で {FID} 用に展開したものが読める）
2. `integration_test/casegen/sheetmap/FIX_R1_BRIEF.md` の裁定 A〜L・C'、`FIX_R2_BRIEF.md` の決まり M〜O（指摘と食い違うときは裁定が優先）
3. 自分の成果物 `gapfill/cases/{FID}_gf_test_cases.tsv`・`{FID}_gf_seed_data.tsv`・`{FID}_gf_dispositions.tsv`、抜けの一覧 `gapfill/targets/{FID}_gaps.tsv`
{PREV}
## 決まり

- **既存のケース（`cases/{FID}_test_cases.tsv` のうち今回足していないもの）と既存のシードは変えない。** 直すのは gapfill/cases の3ファイルだけ。
- 「ケースにできる」の指摘は、設計書の記述から期待結果が一意に決まるならケースを足し、dispositions を「ケース化」に直す。決まらないなら却下し、dispositions の理由に設計書の原文を足す。
- 「確認済みでない」の指摘が事実なら、ケースを足すか「ケースにしない」（理由つき）に直す。
- 不具合とみられる現行のふるまいは、指摘されてもケースにしない。実装が設計書と違うことはケースを変える理由にしない。前提が実装の制約で作れないときは、ケースを残して投入方法を「未確定: <理由>」にする（裁定H）。
- 1ケース1期待結果（裁定G）。判定単位が違う確認が混じっていたら分ける。
- ケースを足したり外したりしたら、テストIDを開始番号からの連番に振り直し、ケース専用シードIDの末尾・シードの識別子・dispositions のテストIDも合わせる。
- 前提条件の検査の不合格（識別子の重なり・決まりN）: 複数ケースが同じデータを使うなら共有シード（共有可）へ出し、ケースごとに違うデータなら識別子に機能とケース番号を入れる。方式名・規格名・共通のパスワードはケース専用シードの `状態・属性` に書かない。既存ケース・他機能のシードと重なったら、今回足した側の識別子を変える。
- 指摘に無くても、同じ種類の誤りが自分の他の追加ケースにあれば同じように直す。

## 出力

1. gapfill/cases の3ファイルを直す。
2. `integration_test/casegen/gapfill/review/{FID}_r{R}_dispositions.tsv` に、タブ区切り4列 `指摘	判定	確かめた設計書の記述	直した内容` で、指摘ごと（見出しの括弧の中をそのまま「指摘」列に）と、検査の不合格ごとに1行書く。判定は 採用／一部採用／却下。
3. `python3 integration_test/casegen/gapfill/verify_gapfill.py {FID}` が合格するまで直す。

これら以外のファイルは変更しない。`merge_into_cases.py` は流さない。git の変更操作をしない。他機能の gapfill/ のファイルと `*_out.txt` は読まない。一時ファイルはスクラッチパッドに、名前へ {FID} を入れて作る。

## 返答

3行以内。直した後の件数、指摘ごとの判定の内訳、verify の結果。
