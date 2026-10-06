# 敵対レビュー: 機能間データ連携の結合テストケース（展開1バッチ目・10機能）

これは成果物のレビューである。著者（別のAI）を信用せず、事実は自分で設計書を読んで確認せよ。
褒める必要はない。ファイルは変更するな（読み取りのみ）。

パスはすべて `/home/y-saito/Developments/hareruya-design-docs/` からの相対である。

## 成果物（`integration_test/casegen/link/` 配下）

| 上流機能 | ケース | シード | 著者の報告 |
| --- | --- | --- | --- |
| F04-02 | `cases/F04-02_link_test_cases.tsv`（2件） | `cases/F04-02_link_seed_data.tsv` | `gen_F04-02/report.md` |
| F04-04 | `cases/F04-04_link_test_cases.tsv`（2件） | `cases/F04-04_link_seed_data.tsv` | `gen_F04-04/report.md` |
| F06-02 | `cases/F06-02_link_test_cases.tsv`（1件） | `cases/F06-02_link_seed_data.tsv` | `gen_F06-02/report.md` |
| F05-06 | `cases/F05-06_link_test_cases.tsv`（7件） | `cases/F05-06_link_seed_data.tsv` | `gen_F05-06/report.md` |
| F08-03 | `cases/F08-03_link_test_cases.tsv`（3件） | `cases/F08-03_link_seed_data.tsv` | `gen_F08-03/report.md` |
| B02-02 | `cases/B02-02_link_test_cases.tsv`（1件） | `cases/B02-02_link_seed_data.tsv` | `gen_B02-02/report.md` |
| B02-03 | `cases/B02-03_link_test_cases.tsv`（0件） | `cases/B02-03_link_seed_data.tsv` | `gen_B02-03/report.md` |
| B02-06 | `cases/B02-06_link_test_cases.tsv`（1件） | `cases/B02-06_link_seed_data.tsv` | `gen_B02-06/report.md` |
| B02-07 | `cases/B02-07_link_test_cases.tsv`（0件） | `cases/B02-07_link_seed_data.tsv` | `gen_B02-07/report.md` |
| B05-02 | `cases/B05-02_link_test_cases.tsv`（2件） | `cases/B05-02_link_seed_data.tsv` | `gen_B05-02/report.md` |

方向は F で始まる5機能が「公開側→管理画面」、B で始まる5機能が「バッチ→画面」。
著者への依頼文は `gen_<機能ID>/prompt.md`（型は `GEN_LINK_PROMPT_TEMPLATE.md`）。ケースにしてよい条件と縛りはそこにある。
当てる判定単位は `integration_test/viewpoint_canonical/viewpoints_canonical.tsv` の IT-0332〜IT-0339。
パイロット4機能（F06-01・M14-10・F02-01・B05-01）は別途レビュー済みで、指摘と裁定は `review/pilot_r1_dispositions.md` にある。
同じ種類の誤りが今回の10機能に出ていないかを見よ。

## 正本

- 機能設計書: `functions/*/<機能IDの小文字>_*.md`（`_archive` は読まない）
- HTML設計書: `excel_to_html/output/<ブック>_*.html`。機能とシートの対応は `functions/function-sheet-map.tsv`
- 判定基準: `integration_test/SCOPE.md`（現行仕様と刷新の指示が食い違うときは刷新を採る）
- 前提条件の規約: `integration_test/casegen/precond/README.md` の P1〜P13
- 既存ケース: `integration_test/casegen/cases/<機能ID>_test_cases.tsv`

実装コード（`/home/y-saito/Developments/ec-cube-enterprise` ほか）は読んでよいが、期待結果の正否は設計書で判定せよ。

## 検証してほしいこと

### 1. 取りこぼし（最重点）

依頼者が最も重視するのは「公開側の注文・会員登録・買取申込が、管理画面の一覧・詳細に同値で出ること」である。
著者は次を不採用にした。設計書の両側を読み、本当に書けないのかを判定せよ。

- F04-02・F04-04（注文）→ M05-11 受注情報編集（詳細）: 著者は「項目対応の記述が無い」として0件。
  F04-04 は M05-01 受注一覧も不採用にし、M12-07 フォーマット売上分析だけを採用した。
- F06-02（アクティベート）→ M08-04 の会員ステータスが本会員になること: 著者は 0306 の「リニューアルによりこの処理は不要」という注記を理由に作っていない。この注記がどの処理を指すかを設計書で確認せよ。
- F05-06・F08-03（買取申込）で不採用にした下流候補。
- B02-03・B02-07 の0件、ほかのバッチで不採用にした下流候補。

書けるものは、上流と下流の file:line と、ケースの骨子（手順と期待結果）を示せ。件数を増やすための指摘はするな。

### 2. 期待結果の捏造・推測による接続

19件それぞれについて、期待結果の値・項目・挙動が上流と下流の設計書の記述から出るかを確認せよ。
`gen_<機能ID>/report.md` の対応表の行番号を実際に開いて確かめよ。
上流と下流で項目の形や名称が違うのに対応規則なしでつないでいるもの、件数や並びを足しているものを挙げよ。
F04-04 の2件は IT-0332・IT-0333（管理画面の一覧および詳細）を当てているが、下流は集計画面である。判定単位に合うかを判定せよ。

### 3. 手順が最後まで通るか

上流の操作から下流の確認まで、入力値の検証・業務上の拒否条件・必須項目・関連データ・非同期の完了待ちに不足が無いか。
事前準備に無い状態を手順や期待結果が前提にしていないか。手順の表現が設計書どおりか（実装由来の部品名・ボタン名になっていないか）。

### 4. 重複

19件に、`integration_test/casegen/all_test_cases.tsv` の既存ケースと同じ「上流操作→下流確認」の判定が無いか。

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
