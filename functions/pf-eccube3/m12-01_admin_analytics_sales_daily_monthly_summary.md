# M12-01（日別/月別集計 集計一覧表示）

## 業務ロジック

### 初期表示

検索画面を開いたときは、保持していた検索条件を破棄し、集計結果を表示しない。

### 検索条件の保持

検索を実行したときは、指定された検索条件を保持する。保持した条件は、次に検索画面を開くまで残る。

### 集計の対象期間

集計する期間は受注日で判定する。集計日(To) に指定した日は、その日の終わりまでを集計に含める。

### 一覧の並び

一覧は集計日（月別のときは集計月）の昇順に並べる。

## 入出力

### 集計結果の一覧

| 種類 | 内容 |
| --- | --- |
| 集計結果が無い期間 | 集計対象期間に含まれる日付（月別のときは月）のうち、該当する集計結果が無いものも、各列を 0 とした行として一覧に補う |

### 更新するデータ

この機能ではデータを更新しない。

## 表示メッセージ

この機能はエラーメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:39-63 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:71-79 |
| 検索条件の保持 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:41 |
| 集計の対象期間 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:634-641 |
| 集計の対象期間 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:736-737 |
| 一覧の並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:799 |
| 一覧の並び | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:865 |
| 集計結果の一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:844-857 |
| 更新するデータ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:71-96 |
