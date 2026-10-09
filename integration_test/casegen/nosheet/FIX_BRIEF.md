# レビュー指摘の反映（著者への依頼）: {FID} / {R}巡目

リポジトリ: `/home/y-saito/Developments/hareruya-design-docs/`。あなたは機能ID **{FID}** のケースの著者である。出力は日本語。

codex のレビュー指摘が `integration_test/casegen/nosheet/review/{FID}_r{R}_findings.md` にある（`NONE` なら指摘なし）。
1件ずつ、**指摘が引いている設計書の記述を `nosheet/materials/{FID}_sheet.txt` で自分で読み直して事実かどうか確かめてから**反映せよ。指摘をそのまま適用しない。

## 読むもの

1. `integration_test/casegen/nosheet/GEN_NOSHEET_PROMPT.md`（ケースの書式と決まり。{FID} と読み替える）
2. `integration_test/casegen/sheetmap/FIX_R1_BRIEF.md` の裁定 A〜L・C'、`FIX_R2_BRIEF.md` の決まり M〜O（指摘と食い違うときは裁定が優先。`sheetmap/` は `nosheet/` に読み替える）
3. 自分のケース `nosheet/cases/{FID}_ns_test_cases.tsv`・`{FID}_ns_seed_data.tsv`、`nosheet/gen_{FID}/report.md`
{PREV}
## 前提条件の検査の不合格（2巡目だけ）

`integration_test/casegen/nosheet/review/{FID}_gate.txt` に、前提条件の検査の不合格がある（空なら不合格なし）。決まりN（識別子の重なり）に従って直す。複数ケースが同じデータを使うなら共有シード（共有可）へ出し、ケースごとに違うデータなら識別子にケース番号を入れる。「HS256」のような方式名・規格名はケース専用シードの `状態・属性` に書かず、共有シードか事前準備の文に書く。dispositions に直し方を書く。

## この作業での決まり

- 判定ID IT-0332〜0347 は使わない（機能間データ連携・アクセス解析の専用）。使っているケースは、判定単位の文と適用条件が合う別の判定IDに付け替える。無ければ IT-0156。検査が不合格にする。
- 「取りこぼし」の指摘は、設計書の記述から期待結果が一意に決まるならケースを足す（裁定L）。決まらないなら却下し、理由を report.md に書く。
- 不具合とみられる現行のふるまいは、指摘されてもケースにしない（report.md の「裁定待ち」に残す）。
- 実装が設計書と違うことはケースを変える理由にしない。前提が実装の制約で作れないときは、ケースを残して投入方法を「未確定: <理由>」にする（裁定H）。
- 1ケース1期待結果（裁定G）。同じ判定単位の中で、同じ応答の複数の項目をまとめて確かめるのはよい。判定単位が違う確認が混じっていたら分ける。
- ケースを足したり外したりしたら、テストIDを 001 からの連番に振り直し、ケース専用シードIDの末尾とシードの識別子も合わせる。
- 指摘に無くても、同じ種類の誤りが自分の他のケースにあれば同じように直す。

## 出力

1. cases・seed・report.md を直す（report.md が1行しか無い・著者の返答の写しになっている場合は、対応表・ケースにしなかったもの・設計書の不備・試験環境に要るもの、の形に書き直す。100行以内）。
2. `integration_test/casegen/nosheet/review/{FID}_r{R}_dispositions.md` に、指摘番号ごとの「判定（採用／一部採用／却下）・確かめた設計書の記述（原文）・直した内容」を表で書く。
3. `python3 integration_test/casegen/nosheet/verify_nosheet.py {FID}` が合格するまで直す。

これら以外のファイルは変更しない。`merge_into_cases.py` は流さない。git の変更操作をしない。他機能の nosheet/ のファイルと `*_out.txt` は読まない。
Write が拒否されたら理由を読み、ファイルの中身を返答に全文貼る（別の手段で書き込まない）。一時ファイルはスクラッチパッドに、名前へ {FID} を入れて作る。

## 返答

5行以内。直した後の件数、指摘ごとの判定の内訳、足した・外したテストの数、verify の結果、保存できなかったファイル。
