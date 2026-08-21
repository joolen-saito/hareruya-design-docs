# 会員管理 — ポイント履歴

## 業務ロジック

### 会員が存在しないとき

指定された会員が存在しないときは、画面を表示せずページが見つからない扱い（404）とする。

### 一覧に出す履歴の範囲

該当会員のポイント履歴を、ポイント種別による絞り込みをせずすべて表示する。絞り込み条件・並び替えの指定欄・ページ送りは持たない。

### 表示する値

ポイント残高は、会員に紐づく選手情報が保持する残高を表示する。履歴の増減量の合計ではない。

発行日と設定日は別の値である。発行日は履歴が保持するポイント発行日を表示し、設定日はその履歴が作られた日時を表示する。

有効期限は履歴が保持する値ではなく、その履歴の発行日に183日を加えた日付を表示する。

注文番号は、その履歴に紐づく受注の注文番号を表示し、該当受注の受注編集画面へのリンクとする。紐づく受注が無い履歴と、注文番号を特定できない履歴は空欄にする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 会員ID |
| 出力 | 該当会員のポイント残高と、ポイント履歴の一覧 |
| 失敗時出力 | 会員が存在しないときは404 |

## 表示メッセージ

本機能に固有の表示メッセージは、正本に記載が無い。

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 会員が存在しないとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:298-300 |
| 一覧に出す履歴の範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:308 |
| 一覧に出す履歴の範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/point_history.twig:101-113 |
| 表示する値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/point_history.twig:82 |
| 表示する値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/point_history.twig:105-110 |
| 表示する値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:323 |
