# 店頭買取管理 — 買取商品履歴（検索/一覧）

## 業務ロジック

### 初期表示

検索画面を開いたときは、保持していた検索条件・ページ番号・表示件数を破棄し、一覧を表示しない。表示件数は既定値に戻る。

### 検索条件の扱い

| 条件 | 扱い |
|------|------|
| 商品コード | 入力した値と完全に一致するものだけを対象とする |
| 商品名 | 部分一致の検索語に含まれる `%` `_` は特殊文字として扱わず、そのままの文字として一致させる |
| 言語 | 「その他言語」を選んだときは、日本語・英語以外のすべての言語を対象とする。他の言語と併せて選んだときは、いずれかに該当すればよい |

### 削除済みデータの扱い

削除済みの商品・規格・作業者に紐づく履歴も、検索結果とCSVに表示・出力する。

### 表示件数とページ切替

| 場面 | 扱い |
|------|------|
| 表示件数の指定 | 選択肢にある値のときだけ採用し、以後の検索・ページ送りへ引き継ぐ。選択肢にない値が指定されたときは直前の値のままとする |
| ページ切替 | 指定されたページ番号で、保持した検索条件を復元して同じ条件で再検索する |
| 保持した検索条件が無いとき | 初期表示と同じ画面を返す |
| 該当件数が前のページまでの表示合計と等しくなり、そのページに表示するデータが無くなったとき | 1ページ戻して表示する |

### 並び順の指定

昇順・降順のいずれでもない並び順が指定されたときは、ソートエラーを表示して初期表示と同じ画面へ戻す。

### CSV出力

| 出力種別 | 扱い |
|------|------|
| 選択した商品履歴取得 | 履歴を1件も選択していないときはエラーを表示し、直前のページへ戻る。選択があれば、保持した検索条件に加えて選択した履歴だけに絞って出力する |
| 検索結果全件取得 | 保持した検索条件に一致する履歴を、表示中のページによらず全件出力する |

ファイル名は `otc_buy_order_detail_history_` に出力時刻（年月日時分秒）を付けたCSVとする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索フォームの各項目、ページ番号、表示件数、CSVの出力種別と選択した履歴の識別子 |
| 成功時出力 | 一覧画面、またはCSVファイル |
| 失敗時出力 | 並び順が不正なときはエラー表示と初期表示相当の画面。CSVで履歴を1件も選択していないときはエラー表示と直前のページ |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M06-05-MSG-001 | 管理画面上部 | 1つ以上の商品を選択してください | 選択せずに、選択した商品のCSVを出力したとき | エラーを表示し、買取商品履歴（検索／一覧）画面に遷移する |
| M06-05-MSG-002 | 管理画面上部 | 条件に一致する商品がありません | 検索を実行せずに、すべての商品のCSVを出力したとき | エラーを表示し、買取商品履歴（検索／一覧）画面に遷移する |
| M06-05-MSG-003 | 買取商品履歴の検索結果ボックス見出し | 検索条件に該当するデータがありませんでした。 | 履歴検索、または検索条件を復元したページ表示で、該当件数が0件のとき | 履歴一覧・ページ送りを表示せず、同じ検索画面に空結果メッセージを表示する。 |
| M06-05-MSG-004 | 本文テキスト | 検索条件に該当するデータがありませんでした。 | 買取商品履歴の検索後、該当件数が0件のとき | 同一の検索結果画面に0件通知を表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:56 |
| 検索条件の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderStockHistoryRepository.php:58 |
| 検索条件の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderStockHistoryRepository.php:63 |
| 検索条件の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderStockHistoryRepository.php:94 |
| 削除済みデータの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php:60 |
| 削除済みデータの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php:127 |
| 表示件数とページ切替 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:153 |
| 並び順の指定 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140 |
| CSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php:88 |
| CSV出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/OtcBuyOrderHistoryCsv.php:37 |
