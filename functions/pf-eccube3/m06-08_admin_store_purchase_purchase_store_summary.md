# 店頭買取管理 — 買取集計データ（検索・一覧表示）

## 業務ロジック

### 初期表示

初期表示では検索欄だけを表示し、集計結果の表は表示しない。

### 検索条件の絞り込み

集計日(From)は指定された日付の0時0分0秒以降を対象とする。部門・買取店舗は選択が無いときは絞り込み条件に加えず、全部門・全店舗が対象になる。

### 検証に失敗したとき

送信内容が検証に通らないときは、集計結果を表示せず、各入力欄の直下に項目ごとのエラーを表示する。

### 該当データが無いとき

期間全体の集計と日別の集計は、それぞれ別に該当有無を判定する。結果が空になった側だけ、表に代えて空結果のメッセージを表示する。片方に結果があるときは、その側の表は表示する。日別の集計結果が空のときは、CSVダウンロードのボタンも表示しない。

### 検索条件の保持とCSV出力

検索を実行したときの送信内容は、検証に失敗したときも含めて保持する。CSV出力は保持した条件を読み戻して同じ条件で集計する。買取集計データ画面を開き直すと、保持していた検索条件は失われる。

### 集計値の扱い

検索によって集計データを書き換えることはなく、画面からの再集計や按分も行わない。金額は通貨表示に整形する。部門が設定されていない集計行は、部門名を「未設定」と表示する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 検証失敗 | 一覧は非表示のまま、項目ごとのエラーを表示する |

## 入出力

| 種類 | 内容 |
|------|------|
| 失敗時出力 | 同一画面上の検証エラー |

本機能は集計データを更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M06-08-MSG-001 | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | 検索を実行せずにCSV出力したとき | 買取集計データ画面に遷移する |
| M06-08-MSG-002 | 期間全体集計の結果ボックス見出し | 検索条件に該当する期間全体の集計データがありませんでした。 | 検索の検証成功後、期間全体・部門別の集計結果が空の場合。 | 期間全体集計表を表示せず、同じ検索画面に空結果メッセージを表示する。 |
| M06-08-MSG-003 | 日別集計の結果ボックス見出し | 検索条件に該当する日別の集計データがありませんでした。 | 検索の検証成功後、日別の集計結果が空の場合。 | 日別集計表を表示せず、同じ検索画面に空結果メッセージを表示する。 |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:29-42 |
| 検索条件の絞り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderSummaryRepository.php:20-38 |
| 検証に失敗したとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:62-70 |
| 該当データが無いとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/summary.twig:71-114 |
| 該当データが無いとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/summary.twig:118-165 |
| 検索条件の保持とCSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:57-70 |
| 検索条件の保持とCSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:100-106 |
| 検索条件の保持とCSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:31 |
| 集計値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/summary.twig:96-102 |
| 集計値の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbSection.php:12 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:51-70 |
