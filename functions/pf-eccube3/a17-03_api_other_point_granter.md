# API その他 — PointGranterAPI連携

## 業務ロジック

### ポイント付与の対象行

連携内容に複数の行が含まれるときも、**先頭要素の先頭行1件だけ**をポイント付与とポイント履歴登録の対象とする。2行目以降・2要素目以降が入っている場合、それらはスマレジへ中継されるが、本システムのポイント加算・履歴登録の対象にはならない。

### ポイント加算と履歴の内容

付与ポイントは、上限・符号のいずれも検査しない。付与ポイントが負値のときは、プレイヤーの保有ポイントの減算になる。

ポイント履歴に記録する値は次のとおり。

| 記録項目 | 値 |
| --- | --- |
| 会員 | 特定したプレイヤーに紐づく会員 |
| 増減ポイント | 連携内容の付与ポイント（`newPoint`） |
| メモ | 連携内容のメモ（`memo`） |
| 発生日時・登録日時 | いずれも連携内容の端末取引日時（`terminalTranDateTime`）を用いる。本システムの処理時刻は用いない |
| ポイント種別 | 連携内容のポイント属性（`pointAttr`）に対応するポイント種別 |

### 中継に使う接続情報と応答値の扱い

中継先は、本システムのシステム設定に登録したスマレジ連携先URLとする。処理名と連携内容は受け取ったまま送る。契約IDとアクセストークンは**呼び出し元から受け取ったヘッダの値をそのまま**中継先へ渡し、本システムが保持するスマレジ契約ID・アクセストークンは用いない。呼び出し元が渡した接続情報が無効なときは中継が失敗するため、本システム側の設定を直しても中継は通らない。

中継結果に対しては、金額・税・ポイント・在庫数量の再計算や丸め、本API独自の集計を行わない。

### POST以外のメソッドで要求したとき

POST以外のメソッド（GET・PUT・DELETEなど）で要求したときも受け付けるが、必須項目が欠けているときと同じく処理を打ち切り、本文に空の配列（`[]`）だけを返す。処理名と連携内容はPOSTデータからだけ読み取る。このときはスマレジへの中継、保有ポイントの更新、ポイント履歴の追加をいずれも行わない。

## 入出力

### 入出力: 永続化

| 操作 | 契機 | 対象 |
| --- | --- | --- |
| 更新 | ポイント付与の対象行からプレイヤーを特定できたとき | プレイヤーの保有ポイント |
| 追加 | ポイント付与の対象行からプレイヤーを特定できたとき | ポイント履歴1件 |

保有ポイントの更新とポイント履歴の追加は同一の登録処理でまとめて確定する。プレイヤーを特定できないときは、いずれも行わない。

保有ポイントの更新とポイント履歴の追加のどちらか片方の書き込みが失敗したときは、両方とも確定しない。

### 失敗時の応答本文

必須項目が欠けていて処理を打ち切るときは、本文に空の配列（`[]`）だけを返す。スマレジへの連携結果に結果（`result`）が含まれず処理を打ち切るときは、連携結果をそのまま本文に載せて返す。

### 応答に付けるヘッダ

成功・失敗のいずれの応答にも、次のヘッダを付ける。

| ヘッダ | 値 |
| --- | --- |
| 内容種別 | application/json |
| 呼び出し元オリジンの許可 | すべてのオリジンを許可する（`*`） |
| 許可するリクエストヘッダ | x-requested-with |

## 表示メッセージ

この機能は、いずれの場合もメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| ポイント付与の対象行 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:44-46 |
| ポイント加算と履歴の内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:50-61 |
| 中継に使う接続情報と応答値の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CustomerService.php:283-295 |
| 中継に使う接続情報と応答値の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:30-36 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:47-61 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:59-61 |
| POST以外のメソッドで要求したとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/AdminApiControllerProvider.php:18 |
| POST以外のメソッドで要求したとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:24-28 |
| 失敗時の応答本文 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:26-28 |
| 失敗時の応答本文 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:38-40 |
| 応答に付けるヘッダ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:75-86 |
