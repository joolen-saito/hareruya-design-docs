# 敵対レビュー: 機能間データ連携の結合テストケース（パイロット4機能・R2）

これは成果物のレビューである。著者（別のAI）を信用せず、事実は自分で設計書を読んで確認せよ。
褒める必要はない。ファイルは変更するな（読み取りのみ）。

パスはすべて `/home/y-saito/Developments/hareruya-design-docs/` からの相対である。

## 成果物（`integration_test/casegen/link/` 配下）

| 上流機能 | 方向 | ケース | シード | 著者の報告 |
| --- | --- | --- | --- | --- |
| F06-01 仮会員登録 | 公開側→管理画面 | `cases/F06-01_link_test_cases.tsv` | `cases/F06-01_link_seed_data.tsv` | `gen_F06-01/report.md` |
| M14-10 フォーマット登録 | マスタ・設定→利用側 | `cases/M14-10_link_test_cases.tsv` | `cases/M14-10_link_seed_data.tsv` | `gen_M14-10/report.md` |
| B05-01 注文番号登録バッチ | バッチ→画面 | `cases/B05-01_link_test_cases.tsv` | — | `gen_B05-01/report.md` |
| F02-01 本店PC版グローバルナビ | 画面遷移の引継ぎ | `cases/F02-01_link_test_cases.tsv` | — | `gen_F02-01/report.md` |

著者への依頼文は `gen_<機能ID>/prompt.md`（型は `GEN_LINK_PROMPT_TEMPLATE.md`）。ケースにしてよい条件と縛りはそこにある。
当てる判定単位は `integration_test/viewpoint_canonical/viewpoints_canonical.tsv` の IT-0332〜IT-0339。

## 正本

- 機能設計書: `functions/*/<機能IDの小文字>_*.md`（`_archive` は読まない）
- HTML設計書: `excel_to_html/output/<ブック>_*.html`。機能とシートの対応は `functions/function-sheet-map.tsv`
- 判定基準: `integration_test/SCOPE.md`（現行仕様と刷新の指示が食い違うときは刷新を採る）
- 前提条件の規約: `integration_test/casegen/precond/README.md` の P1〜P13
- 既存ケース: `integration_test/casegen/cases/<機能ID>_test_cases.tsv`

実装コード（`/home/y-saito/Developments/ec-cube-enterprise` ほか）は読んでよいが、期待結果の正否は設計書で判定せよ。

## 前巡の指摘と対応

前巡の指摘は `review/codex_pilot_r1_findings.md`、裁定は `review/pilot_r1_dispositions.md`。
採用した指摘を反映してケースを書き直した。現在の件数は F06-01=4件、M14-10=4件、F02-01=1件、B05-01=0件。
依頼文の型 `GEN_LINK_PROMPT_TEMPLATE.md` も指摘12に沿って直した。
指摘11（会員CSV出力）は却下した。IT-0333 は管理画面の一覧と詳細に限り、CSVの値一致は既存の IT-0071・IT-0083 が担う。

## 検証してほしいこと

同じ指摘の再提示はするな。次だけを見よ。

1. 採用した指摘が正しく反映されているか。反映で新たな誤りが入っていないか。
2. 現在の9件それぞれの期待結果が、上流と下流の設計書の記述から出るか（`gen_<機能ID>/report.md` の対応表の行番号を実際に開いて確かめよ）。
   特に追加された IT-F02-01-L001、IT-M14-10-L003・L004 を重点的に見よ。
3. 9件それぞれが、上流の操作を手順どおり行って下流の確認まで到達できるか（入力値の検証、前提データの過不足）。
4. 9件に、既存ケース（`integration_test/casegen/all_test_cases.tsv`）と同じ「上流操作→下流確認」の判定が残っていないか。
5. 直した依頼文の型に、残り116機能へ広げる前に直すべき欠陥が残っていないか。

## 指摘対象外

- この4方向の判定を結合テストに足すこと自体の是非。
- 実機で未実行であること。
- `functions/dead-spec-register.tsv` に登録済みの不機能仕様、`functions/phase2_candidates.tsv` のフェーズ2見送り。

## 出力形式

指摘が無ければ `NONE` の1語だけを出力せよ。指摘は1件ごとに次の形で書け。結論を先に置け。

```
### 指摘N（重大度: Major / Minor）対象: <テストID または 機能ID または 依頼文>
主張: （著者の記述）
実際: （確認した事実。file:line を付ける）
判定: 期待結果の捏造 / 推測による接続 / 重複 / 取りこぼし / 0件の誤り / 前提不成立 / 手順不備 / 型の欠陥
修正案: （書き直した文、削除、追加すべきケースの骨子）
```
