# 分析 — 入荷通知依頼CSVダウンロード

## 業務ロジック

### 出力する対象

入荷通知依頼の一覧（M12-05）で保持した検索条件を取り込み、その条件で入荷通知依頼を抽出して出力する。抽出する対象と並び順は一覧と同じとする。保持した検索条件が無いときは、条件を指定しないものとして抽出する。

抽出のときは論理削除済みの入荷通知依頼も対象に含める。

本機能は画面上の入力欄を持たない。出力する条件は保持した検索条件の値による。

### 出力する列

列は商品コード・商品名・言語・状態・販売金額・在庫数・会員名・依頼日・購入日・通知日/通知設定削除日の順とする。

### 値の取り方

抽出した依頼1件を1行として、列の順に値を出力する。依頼日は年/月/日 時:分の形式とする。通知日/通知設定削除日は通知設定を削除した日時を年/月/日 時:分の形式で出力し、削除した日時が無いときは空とする。

### 出力する件数

一覧で指定した表示件数を、出力する行数の上限としても用いる。保持した検索条件が無いときは上限を設けない。

抽出結果が0件のときも、見出し行だけのファイルを出力する。

### ファイルの体裁

ファイル名は request_report_ に出力日時（年月日時分秒）と .csv を連結したものとする。先頭に文字コード判別用のBOMを付ける。応答にはダウンロードとして扱う指定を付ける。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 一覧で保持した検索条件。無いときは条件を指定しないものとして扱う |
| 成功時出力 | 入荷通知依頼の出力ファイル。ファイル名は request_report_ に出力日時（年月日時分秒）を付けた .csv とする |
| 失敗時出力 | データ取得に失敗したときは共通の例外処理に委ねる |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M12-06-MSG-001 | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | 入荷通知依頼を検索せずにCSVをダウンロードしようとしたとき | エラーを表示し、入荷通知依頼 一覧表示画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力する対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:85-91 |
| 出力する対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:126-243 |
| 出力する列 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:15 |
| 値の取り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:99-115 |
| 出力する件数 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:241 |
| 出力する件数 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/RequestType.php:112 |
| 出力する件数 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:97 |
| ファイルの体裁 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:119-122 |
| ファイルの体裁 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:95 |
