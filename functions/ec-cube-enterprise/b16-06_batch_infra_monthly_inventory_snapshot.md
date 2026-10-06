# バッチ インフラ — 月次商品情報スナップショット

## 業務ロジック

### 実行前の設定確認

次の値は設定で与える。省略時の値は持たず、誤って実行しないようにしている。

- 本番データベースのクラスタ
- 復元先のサブネットグループ、セキュリティグループ、クラスタのパラメータグループ
- データベースの種類とインスタンスの規格
- 抽出に使うデータベースのユーザーとデータベース名

どれか1つでも未設定のときは、AWSにもデータベースにも触れずに異常終了する。この終了では後片付けを行わない。後片付けを行うのは、この設定確認を通過した後の終了のときだけである。

データベースのエンジンのバージョンは任意で、設定したときだけ復元に指定する。データベースの接続ポートも設定で与える。セキュリティグループは空白区切りで複数を指定できる。

### スナップショットの選択

設定された本番クラスタのスナップショットのうち、状態が利用可能のものだけを候補にする。

候補が1件も無いときは、「ERROR: <本番クラスタ> のスナップショットが見つかりません」を出力して異常終了する。このときは一時クラスタをまだ作っていないため、後片付けで削除するものは無い。

### 一時クラスタと一時インスタンスの作成

選んだスナップショットから復元した一時クラスタは、外部公開しない。復元を受け付けた後で、その一時クラスタの中に一時インスタンスを作る。一時インスタンスも外部公開しない。

一時インスタンスが利用可能な状態になるまで待つ。待っても利用可能にならなかったときは、「ERROR: インスタンスが利用可能になりません (status=<そのときの状態>)」を出力して異常終了する。待っている間に状態を取得できなかったときは、作成中として扱って待ちを続ける。

利用可能になったら、一時クラスタの接続先を取得する。取得の処理そのものが失敗したときは、その処理のエラーのまま異常終了する。取得はできたが結果が空、または該当なしを示す値だったときは、「ERROR: <一時クラスタ名> のエンドポイントが取得できません」を出力して異常終了する。

### 抽出する在庫の範囲

在庫に紐づく店舗が存在しない在庫は、対象にならない。

### 出力内容と並び順

出力は、タブ区切り・UTF-8の文字コードで、先頭に見出し行を付ける。

在庫区分が定めた2種類のどちらでもないときは、在庫区分名を空文字とする。

同じ店舗・同じ在庫区分の行どうしの並び順は定めていない。

抽出でエラーが起きたときは、その時点で異常終了する。

### ファイルの作成とアップロード

抽出結果は、実行した日の日付（年4桁・月2桁・日2桁）を使った「stock_YYYYMMDD.txt」というファイルに書き出す。

このファイルを、ディレクトリを含めずに1ファイルだけ入れたZIPにする。

ZIPのアップロードに失敗したときは異常終了する。

アップロードが済んだら、作業した場所に残る抽出結果のファイルとZIPを削除する。アップロードまでに異常終了したときは、この2つの削除は行わない。

### 後片付けと終了

処理が終わったとき、および設定確認を通過した後に途中で異常終了したときの、いずれの場合も、この実行で作成した一時インスタンスと一時クラスタだけを削除する。作成に至らなかったものは削除しない。

削除は次の順に行う。

1. 一時インスタンスを、最終スナップショットを取らずに削除し、削除が完了するまで待つ
2. 一時クラスタを、最終スナップショットを取らずに削除する。クラスタの削除は、完了までは待たない

削除での失敗は無視して続け、後片付けの失敗では終了の状態を変えない。削除に失敗しても、それまでの処理が成功していれば正常終了する。

終了の状態は、処理のどこかで異常が起きたときは異常終了、それ以外は正常終了とする。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 設定で与える値（本番クラスタ、サブネットグループ、セキュリティグループ、クラスタのパラメータグループ、データベースの種類、インスタンスの規格、データベースのユーザーとデータベース名、データベースの接続ポート。データベースのエンジンのバージョンは任意）。本番クラスタのスナップショット。引数は取らない |
| 成功時出力 | 標準出力へ、バッチ独自のログとして各行の先頭に年-月-日 時:分:秒を付けて、開始（「script start」）、使用したスナップショットの名前、一時クラスタの復元開始、一時インスタンスの作成開始、接続先、抽出した行数（見出し行を含む）、アップロード先、終了（「script finish」）を、この順に出力する。終了の次に、後片付けの開始を同じ形式で出力する。アップロードの処理自身の出力には日時を付けない。ZIPが1つ、アップロード先に登録される |
| 失敗時出力 | 設定が足りないときは、足りない設定の名前を示すエラーを出力して異常終了し、後片付けは行わない。スナップショットが無い・インスタンスが利用可能にならない・接続先が空のときは、先頭に年-月-日 時:分:秒を付けて、業務ロジックに記載した「ERROR:」で始まる文言を出力して異常終了し、後片付けを行う。いずれの場合もアップロードは行わない |

本バッチは、画面やAPIを持たない。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 登録 | 抽出結果のZIPをアップロードしたとき |
| 登録 | スナップショットから一時クラスタと一時インスタンスを作ったとき（後片付けで削除する） |
| 削除 | 後片付けで、この実行が作った一時インスタンスと一時クラスタを削除したとき |
| 削除 | アップロードが済んだ後に、作業した場所の抽出結果とZIPを削除したとき |

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 実行前の設定確認 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:17 |
| 実行前の設定確認 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:28 |
| 実行前の設定確認 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:49 |
| 実行前の設定確認 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:69 |
| 実行前の設定確認 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/config.sh:23 |
| スナップショットの選択 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:54 |
| スナップショットの選択 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:58 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:12 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:65 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:78 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:88 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:101 |
| 一時クラスタと一時インスタンスの作成 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:103 |
| 抽出する在庫の範囲 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/query.sql:14 |
| 出力内容と並び順 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/query.sql:10 |
| 出力内容と並び順 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/query.sql:17 |
| 出力内容と並び順 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/query.sql:18 |
| 出力内容と並び順 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:112 |
| ファイルの作成とアップロード | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:111 |
| ファイルの作成とアップロード | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:117 |
| ファイルの作成とアップロード | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:120 |
| ファイルの作成とアップロード | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:124 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:12 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:39 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:42 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:43 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:46 |
| 後片付けと終了 | P1 | ec-cube-enterprise:script/ops/monthly-inventory-snapshot/inventory.sh:49 |
