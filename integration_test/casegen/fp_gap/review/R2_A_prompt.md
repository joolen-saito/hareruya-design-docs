# 敵対レビュー依頼：FPから見て足した結合テストケース（2巡目・A）

あなたはレビュアーである。著者とは別人として、下の追加ケースを根拠と突き合わせ、誤りを指摘せよ。ファイルは変更しない。スクリプトやコマンドは読むだけで実行しない（grep・cat 等の閲覧は可。rg は使わない）。出力は日本語。
レビューは事実確認に限る。設計書に無い仕様を足す提案はしない。

## 背景（依頼者 2026-10-23）

ec-cube-enterprise の機能量をファンクションポイントで機能ごとに測り、IPA の密度から結合テストのケース数の目安を出した。
依頼者は「目安より少ない機能はケースを適切な観点で増やす。ケースが0件の機能も適切な観点でケースを作る」と決めた。
著者は、設計書の定めのうちまだどのケースも確かめていないものを観点の項目（items）に挙げ、項目ごとに ケース化／既存ケースで確認済み／ケースにしない を決めた（dispositions）。
**目安は件数のノルマではない**（件数を合わせるためにケースを作らない）。

## 対象（/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/ 配下）

| 機能ID | 種類 | 追加ケース・シード・項目・仕分け |
| --- | --- | --- |
| M04-13 | 少ない | `fp_gap/cases/M04-13_fg_test_cases.tsv`・`M04-13_fg_seed_data.tsv`・`M04-13_fg_items.tsv`・`M04-13_fg_dispositions.tsv` |
| M04-29 | 少ない | `fp_gap/cases/M04-29_fg_test_cases.tsv`・`M04-29_fg_seed_data.tsv`・`M04-29_fg_items.tsv`・`M04-29_fg_dispositions.tsv` |
| M06-07 | ケース0件 | `fp_gap/cases/M06-07_fg_test_cases.tsv`・`M06-07_fg_seed_data.tsv`・`M06-07_fg_items.tsv`・`M06-07_fg_dispositions.tsv` |
| M07-12 | ケース0件 | `fp_gap/cases/M07-12_fg_test_cases.tsv`・`M07-12_fg_seed_data.tsv`・`M07-12_fg_items.tsv`・`M07-12_fg_dispositions.tsv` |
| M10-06 | 少ない | `fp_gap/cases/M10-06_fg_test_cases.tsv`・`M10-06_fg_seed_data.tsv`・`M10-06_fg_items.tsv`・`M10-06_fg_dispositions.tsv` |
| M13-09 | 少ない | `fp_gap/cases/M13-09_fg_test_cases.tsv`・`M13-09_fg_seed_data.tsv`・`M13-09_fg_items.tsv`・`M13-09_fg_dispositions.tsv` |
| M14-02 | ケース0件 | `fp_gap/cases/M14-02_fg_test_cases.tsv`・`M14-02_fg_seed_data.tsv`・`M14-02_fg_items.tsv`・`M14-02_fg_dispositions.tsv` |
| M14-03 | ケース0件 | `fp_gap/cases/M14-03_fg_test_cases.tsv`・`M14-03_fg_seed_data.tsv`・`M14-03_fg_items.tsv`・`M14-03_fg_dispositions.tsv` |
| M15-11 | 少ない | `fp_gap/cases/M15-11_fg_test_cases.tsv`・`M15-11_fg_seed_data.tsv`・`M15-11_fg_items.tsv`・`M15-11_fg_dispositions.tsv` |

機能ごとに次を読む。
- 追加ケース（13列。末尾の項目IDは観点の項目）、追加シード、項目（項目ID・判定ID・根拠の行・確かめること）、仕分け（上の表のファイル）
- 設計書 `fp_gap/units/<機能ID>/design.txt`（行頭 L0001 が行番号。`#####` の行はシートの境目）。項目の根拠が他の機能のときは `fp_gap/units/<その機能ID>/design.txt` か `combination/units/<その機能ID>/design.txt`
- 外したケース `fp_gap/units/<機能ID>/excluded.tsv`（保留・未確定・範囲外・重複・単体テストレベル）
- ee の処理単位 `fp_gap/units/<機能ID>/processes.tsv`
- 既存のケースとシード `cases/<機能ID>_test_cases.tsv`・`<機能ID>_seed_data.tsv`（無い機能もある）、関わる機能のケース `cases/<機能ID>_test_cases.tsv`

規約は `fp_gap/GEN_PROMPT.md`（「作らないもの」の表を必ず読む）、裁定は `sheetmap/FIX_R1_BRIEF.md`（A〜L、C'）・`FIX_R2_BRIEF.md`（M〜O）、範囲は `integration_test/SCOPE.md`、前提条件は `precond/README.md`、判定単位は `integration_test/viewpoint_canonical/viewpoints_canonical.tsv`。
設計書の中の食い違いは、Excel 由来の本文 ＞ 埋め込みの「表示メッセージ」節 ＞ 埋め込みの「現行仕様」節の順に採り、改訂後を優先する。
期待結果の根拠は設計書に限る。実装（`/home/y-saito/Developments/ec-cube-enterprise`）は、事前準備と手順の実行可能性を確かめるためにだけ読む。実装と設計書が違うことは指摘しない。
`fp_gap/review/` の `*_out.txt`・`fp_gap/prompts/` と、上の表に無い機能の fp_gap/cases のファイルは読まない。

## 前の巡

1巡目の指摘が `fp_gap/review/R1_*_findings.md`、著者の処置が `fp_gap/review/<機能ID>_R1_dispositions.tsv` にある。却下の理由が設計書の原文に照らして妥当なら、同じ指摘を繰り返さない。採用したはずの指摘が実際に直っているか、直した結果に新しい誤りが入っていないかを見て、新しい事実の指摘だけを挙げる。

## 意図的であり指摘対象外のもの

- 連鎖IDが空欄、要求IDが空欄であること。既存ケースを変えていないこと。
- ケースの件数が目安に届かないこと（目安はノルマではない）。
- 「作らないもの」の表に当たるケースが無いこと（単体テストレベル、同じ扱いの値、外したケースと同じ確かめ、用意しない前提が要るもの、結果が決まらないもの、範囲外）。
- シードの投入方法が「未確定: …」と書かれていること。
- 商品がグッズ商品CSV登録で作られ、在庫が在庫変更CSV登録と承認で入ること（2026-10-19 の決まり）。URL が `https://replace-dev.hareruyamtg.com:8443`・`img/goods/…` であること。

## 重点観点

1. **期待結果の誤り・設計書に無い期待**: 期待結果が設計書の記述（項目の根拠の行とその節）と事前準備の値だけから一意に出るか。設計書に無い値・ふるまいを期待していないか。
2. **項目の根拠**: 根拠の行が、項目の「確かめること」を本当に定めているか。判定IDの観点表の判定単位・適用条件がその定めに当たるか。
3. **作らないものに当たるのに作ったケース**: 単体テストレベル（1項目・相関の入力チェック、1つの値の書式・変換、計算式、検索の一致のしかた・並び順、サニタイズ）、既存ケース・関わる機能のケースと同じ確かめ（同じ扱いの値を含む）、外したケースと同じ確かめ、用意しない前提（中継・模擬応答・時刻固定・障害・他のケースの隔離）を使うもの。
4. **成立しない前提・手順**: 事前準備の状態から手順を実行して期待結果に到達できるか。単独で成立するか。「このN件だけ」を期待するのに、同じ条件に当たる他のデータを除く記述があるか。
5. **仕分けの誤り**: 「既存ケースで確認済み」としたもののうち、挙げたケースが実際にはその定めを確かめていないもの。「ケースにしない」としたもののうち、設計書から期待結果が一意に決まり、作らないものにも当たらないもの。
6. 1ケースに確かめる所の違う期待結果が混じっていないか。物理名の混入。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で、テストIDの順に書く。確信の持てないものは挙げない。見出しの括弧の先頭は必ず機能ID。

```
### 指摘（<機能ID> / <テストID または 項目ID>）
- 主張: ケースまたは仕分けの記述（要点の引用）
- 実際: 設計書の事実（design.txt の行番号。原文を引く）
- 判定: 期待結果の誤り／設計書に無い期待／根拠の誤り／作らないものに当たる／成立しない前提・手順／確認済みでない／ケースにできる／複数の期待結果／重複
- 修正案: 結論を先に置いた1〜2文
```
