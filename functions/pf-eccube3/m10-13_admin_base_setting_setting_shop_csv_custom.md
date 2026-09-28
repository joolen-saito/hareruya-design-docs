# 店舗設定 — カスタムCSV出力項目設定（店舗設定/システム設定）

## 業務ロジック

### 画面の対象

指定されたCSV種別がCSV種別マスタに無いときは該当のHTTPエラーとする。カスタム定義の指定があり、かつ該当するカスタム定義が無いときも該当のHTTPエラーとする。カスタム定義の指定が無いときは新規として扱う。

CSV種別またはカスタム定義を選び直したときは、その時点で画面を読み込み直す。読み込み直しでは入力中の内容を送らないため、名称と左右のリストの編集は引き継がない。

### 左右のリスト

右のリストは、当該カスタム定義に既に紐づく出力項目とする。左のリストは、同じCSV種別の出力項目のうち右に出ているものを除いた集合とし、並び順と識別子の順に並べる。出力項目が有効か無効かで左右を分けることはしない。

### 保存

保存は入力の検証を経ず、送信内容をそのまま受け取る。

保存では、更新者としてログイン中の管理者を記録する。

出力項目の並びは、右のリストの上から下への順をそのまま出力の順序として保存する。1 回の保存で、当該カスタム定義の出力項目はそのとき送信された内容にすべて置き換わる。この機能の保存で変わるのは当該カスタム定義とその出力項目の並びだけで、出力項目そのものの有効・無効や並び順は変えない。

保存の後は同じ画面へ戻す。

### 削除

| 順序 | 判定 | 結果 |
| --- | --- | --- |
| 1 | なりすまし対策トークンが有効か | 無効のときはアクセス拒否とする |
| 2 | カスタム定義の指定があり、該当する定義があるか | 指定が欠けるとき、または該当が無いときは該当のHTTPエラーとする |
| 3 | 上記を満たしたとき | 削除を実行し、この機能の先頭へ戻す |

### 出力の並び

カスタムCSVを出力するときは、カスタム定義に紐づく出力項目を保存した並び順で取り出す。指定されたカスタム定義が無いときは該当のHTTPエラーとする。

ヘッダ行には選ばれた各出力項目の表示名だけを並べ、データ行はCSV種別ごとの出力で埋める。文字コードと区切り文字はアプリケーションの設定に従う。

一覧の対象は、CSV種別が商品のときは商品検索の保持条件から、受注と配送のときは受注検索の保持条件から検索条件を復元して決める。集計と金額計算はこの機能では行わない。

出力ファイルの名前は、CSV種別ごとの接頭辞に出力時刻（年月日時分秒）を続けたものとする。

| CSV種別 | 接頭辞 |
| --- | --- |
| 商品 | `product_` |
| 受注 | `order_` |
| 配送 | `shipping_` |

ファイル名は、接頭辞・出力時刻（`YmdHis`）・`.csv` を区切り記号を挟まずにつないだものである（例: `product_20260928153000.csv`）。

### エラー時の扱い

| エラー内容 | 処理 |
| --- | --- |
| CSV種別がマスタに無い | 該当のHTTPエラーとする |
| カスタム定義の指定が該当しない | 該当のHTTPエラーとする |
| 削除で対象が無い | 該当のHTTPエラーとする |
| 削除でなりすまし対策トークンが無効 | アクセス拒否とする |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 画面の表示はCSV種別と、任意でカスタム定義。保存は名称と出力項目の識別子の並び。削除はカスタム定義となりすまし対策トークン |
| 成功時出力 | 設定画面、または保存後の同じ画面。出力は別画面のCSVストリーム |
| 失敗時出力 | 共通のエラーページまたは該当のHTTPステータス |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加・更新 | カスタム出力定義を、名称・種別・更新者とともに保存したとき |
| 削除・追加 | カスタム出力定義と出力項目の関連を、保存のたびにすべて置き換えたとき |
| 削除 | カスタム出力定義を、紐づく出力項目の関連ごと削除したとき |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M10-13-MSG-001 | 管理画面上部 | CSV出力項目を保存しました。 | CSV出力項目の設定を保存したとき | カスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-002 | 管理画面上部 | 削除しました | CSV出力設定を削除したとき | カスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-003 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | CSV出力設定を削除しようとしたが、関連するデータがあるとき | エラーを表示してカスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-004 | 削除確認モーダル内 | このCSV出力設定を削除してもよろしいでしょうか？ | CSV出力設定の削除ボタンを押したとき（削除前の確認） | 削除でモーダルを閉じてカスタムCSV出力項目設定画面に遷移、キャンセルでモーダルを閉じる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:128-138 |
| 画面の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/custom_csv.twig:47-61 |
| 左右のリスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Setting/Shop/CustomCsvType.php:29-41 |
| 保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:52-94 |
| 削除 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:103-118 |
| 出力の並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomExportCsvController.php:25-87 |
| 出力の並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:34-114 |
| 出力の並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomExportCsvController.php:77-78 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:105-109 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:130-138 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:57-90 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/CsvController.php:111-115 |
