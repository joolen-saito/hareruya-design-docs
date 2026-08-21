# 会員管理 — ポイント付与・ポイント履歴

## 業務ロジック

### ポイント履歴の表示

指定された会員IDの会員が存在しないときは、ページが見つからない扱い（404）とする。ポイント履歴の一覧はポイント種別で絞り込まず、その会員のポイント履歴をすべて表示する（キャンペーン・特別対応の画面と返金の画面で同じ内容になる）。各履歴の有効期限は、そのポイント発行日から183日後として表示する。

### ポイントの付与

会員または選手情報が存在しないときは、ページが見つからない扱い（404）とする。入力チェックに失敗したときはポイント履歴を追加せず、ポイント履歴画面を再表示する。

### 付与できない条件

注文番号を入力したのに、その番号に一致する受注が見つからないときは付与しない。付与後のポイント残高が0未満になるときも付与しない。スマレジへのポイント連携に失敗したときは、ポイント履歴の追加もポイント残高の更新も行わずに、ポイント履歴画面へ戻る。

### ポイント残高の更新

ポイント付与が成立したとき、その会員の選手情報が持つポイント残高を「更新前の残高＋入力したポイント増減量」に更新する。増減量が負のときは残高が減る。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 会員・選手情報が存在しない | ページが見つからない扱い（404）とする |
| 付与の入力検証に失敗 | 付与せず、ポイント履歴画面を再表示する |
| 要求が正当でない | 付与を行わない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 失敗時出力 | 会員・選手情報が無いときは404。検証に失敗したときはポイント履歴画面の再表示 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | ポイント付与が成立したとき、その会員の選手情報が持つポイント残高を入力したポイント増減量の分だけ増減する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M08-05-MSG-001 | 管理画面上部 | システムエラーが発生しました | ポイント付与を登録した際に、選択した種別のポイント設定を取得できないとき | エラーを表示し、ポイント履歴画面に遷移する |
| M08-05-MSG-002 | 管理画面上部 | 保存しました | ポイント付与を保存したとき | 保存し、ポイント履歴画面に遷移する |
| M08-05-MSG-003 | 入力項目直下/フォーム上部 | この会員は該当のオーダーIDを持っていません。 | ポイント付与で入力した注文番号が、その会員の注文番号ではないとき | エラーを表示し、ポイント履歴画面に留まる |
| M08-05-MSG-004 | 入力項目直下/フォーム上部 | ポイント残高を0未満にすることはできません。 | ポイント付与で、付与後のポイント残高が0未満になるとき | エラーを表示し、ポイント履歴画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| ポイント履歴の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:296 |
| ポイント履歴の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/point_history.twig:110 |
| ポイント履歴の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:323 |
| ポイントの付与 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:337 |
| 付与できない条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:379-389 |
| 付与できない条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:393-401 |
| 付与できない条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:416-424 |
| ポイント残高の更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:393-404 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:339 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:403-404 |
