# 在庫管理 — 在庫情報カスタムCSV出力

## 業務ロジック

### 出力する列が決まらないとき

指定したカスタムCSV定義に出力する列が1件も登録されていないときと、指定した定義そのものが見つからないときは、出力を中止せず、あらかじめ定めた既定の列でCSVを出力する。定義に含まれる指定のうち、出力できる列として用意されていないものは読み飛ばす。

### 出力する行の単位

1行は在庫の1明細（商品規格）に対応する。1明細が複数持ちうる値（商品画像・規格画像・商品タグ・商品カテゴリ・売上分析タグ・カード色）は、行を分けずに1つの列へまとめて出力する。

### 出力する範囲と並び

在庫一覧の表示件数や表示中のページに関わらず、条件に一致するものを全件出力する。

出力順は、カード商品を先に置き、以降は棚番号・言語・カード状態・Foil有無・保管場所・レアリティ・色順・カード番号の順で並べる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 在庫一覧で選んだカスタムCSV定義 |
| 成功時出力 | 在庫情報のCSVファイル（ダウンロード） |
| 失敗時出力 | 定義が見つからないときも中止せず、既定の列で出力する |

### 入力: カスタムCSV定義の選択

在庫一覧の検索結果の上部から、登録済みのカスタムCSV定義を名称で選んで実行する。本機能自体は入力欄を持たない。

### 出力: CSVファイル

見出し行を先頭に1行出力し、続けて対象データを1件1行で出力する。

ファイルは画面表示ではなくダウンロードとして返す。ファイル名は `product_` に出力日時（年月日時分秒）を続け、拡張子を `.csv` とする。

文字コードはUTF-8とし、表計算ソフトで文字化けしないよう先頭にBOMを付ける。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力する列が決まらないとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductAllCsv.php:1087 |
| 出力する行の単位 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductAllCsv.php:893 |
| 出力する範囲と並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/SortProductTrait.php:56 |
| 入力: カスタムCSV定義の選択 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/index.twig:274 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductAllCsv.php:750 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/SimpleCsvExportService.php:162 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/SimpleCsvExportService.php:213 |
