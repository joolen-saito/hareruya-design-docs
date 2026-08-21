# 受注管理 — 店頭注文番号札管理

## 業務ロジック

### 一覧の並びと件数

一覧はページ送りをしない。件数が増えても画面は分割されず、対象の店頭注文番号札が1画面に並ぶ。並び順を選ぶ項目も無い。

### 同じ値の重複登録

すでに同じ値の店頭注文番号札が登録されていても、重ねて登録できる。登録時に既存の値との重複は確かめない。

### 登録できなかったときの入力値

登録できなかったときも、入力した値は入力欄に残る。入力欄は空に戻らない。

### 見つからない店頭注文番号札の削除

削除の対象として指定した店頭注文番号札が見つからないときは、削除を行わず、対象が見つからない旨のエラー画面を表示する。

## 入出力

### 入出力: 永続化

店頭注文番号札は受注のデータと結び付いていない。

| 操作 | 更新するもの | 更新しないもの |
| --- | --- | --- |
| 登録 | 店頭注文番号札の一覧 | 受注をはじめ他のデータ |
| 削除 | 店頭注文番号札の一覧 | 受注をはじめ他のデータ |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M05-27-MSG-001 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 自店の注文番号札の削除を選び、確認画面を開いたとき | 削除でモーダルを閉じて店頭注文番号札管理画面に遷移、キャンセルでモーダルを閉じる |
| M05-27-MSG-002 | 管理画面上部 | 登録できませんでした。 | 注文番号札を登録しようとして、入力内容に不備があるとき | 店頭注文番号札管理画面に留まる |
| M05-27-MSG-003 | 管理画面上部 | 登録が完了しました。 | 注文番号札を登録したとき | 店頭注文番号札管理画面に遷移する |
| M05-27-MSG-004 | 管理画面上部 | 削除に失敗しました | 注文番号札を削除しようとして、処理でエラーが起きたとき | 店頭注文番号札管理画面に遷移する |
| M05-27-MSG-005 | 入力項目直下 | 半角英字のみで入力してください | 注文番号札に半角英字以外を入力して登録したとき | 登録せず店頭注文番号札管理画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧の並びと件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/WaitingTagController.php:15-24 |
| 一覧の並びと件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Waiting/index.twig:51-80 |
| 同じ値の重複登録 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Order/WaitingTagType.php:26-39 |
| 同じ値の重複登録 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbWaitingTag.dcm.yml |
| 登録できなかったときの入力値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/WaitingTagController.php:31-38 |
| 見つからない店頭注文番号札の削除 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/WaitingTagController.php:51-53 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/WaitingTagController.php:40-59 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbWaitingTag.dcm.yml |
