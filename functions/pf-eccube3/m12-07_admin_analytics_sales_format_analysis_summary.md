# M12-07（フォーマット売上分析 集計一覧表示）

## 業務ロジック

### 初期表示

初期表示では集計結果を表示しない。集計月を選んだ時点で、検索ボタンを押さなくても集計を実行する。

### 集計の対象

集計月をもとに、売上分析タグごと、および売上分析タグに紐づかない区分ごとの日別売上を集計する。集計するのは受注日が集計月に属する受注で、キャンセルの受注は集計しない。各日の売上は、その日に受注した明細の単価と数量を掛けた金額の合計とする。売上分析タグが紐づかない売上は、カード商品によるものを「その他(カード)」、それ以外を「その他」として2区分に分けて集計する。売上の無い日は 0 で補完する。日別の売上表・日別合計・フォーマットごとの合計と平均を算出し、グラフと表を同一画面に表示する。

### フォーマットの並び

売上分析タグを表示順の昇順で並べ、その後に「その他(カード)」「その他」を加える。

### 集計値の算出

| 値 | 算出方法 |
| --- | --- |
| フォーマットごとの平均 | 月内売上合計を当月日数で割り、小数点以下を切り捨てる |
| 合計 | 各フォーマットの合計を合算した値、および各フォーマットの平均を合算した値 |
| 当月日数 | 集計月の末日の日付 |

表・グラフの金額には金額表示の整形を適用する。

### 表とグラフの見出し

日別の売上表は、先頭に「日」、続いて各フォーマットの名称、末尾に「合計」の列を置く。合計表は各フォーマットの名称に「合計」を付けた列と「今月合計」の列を、平均表は各フォーマットの名称に「平均」を付けた列と「今月平均」の列を置く。グラフは日を横軸、フォーマットごとの日別売上を系列とする折れ線で、表題は「<年>年<月>月 日別売上」とし、縦軸の目盛は円を付けた金額で表示する。

## 入出力

| 種類 | 内容 |
|------|------|
| 成功時出力 | 折れ線グラフ、日別の売上表、フォーマットごとの合計表・平均表を含む画面 |
| 失敗時出力 | データ取得失敗時はアプリケーションの共通例外処理に委ねる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/FormatSalesController.php:20 |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/format-sales.js:9 |
| 集計の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/FormatSalesController.php:61 |
| 集計の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1643 |
| 集計の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1649 |
| 集計の対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1708 |
| フォーマットの並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/FormatSalesController.php:72 |
| 集計値の算出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/FormatSalesController.php:125 |
| 表とグラフの見出し | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/format_sales.twig:70 |
| 表とグラフの見出し | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/format-sales.js:57 |
