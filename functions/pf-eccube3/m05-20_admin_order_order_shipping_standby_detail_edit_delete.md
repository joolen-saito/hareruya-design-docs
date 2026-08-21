# 受注管理 — 出荷指示リスト詳細編集/削除

## 業務ロジック

### 詳細の表示

出荷指示リストIDは数字だけを受け付ける。指定した出荷指示リストが見つからないときは、見つからない旨の応答を返して画面を出さない。

最終更新者は、削除済みの担当者であっても名前を表示できるように、削除済みを除外する絞り込みを外して読み出す。担当者が見つからないときは名前欄を空にする。

含まれる受注の注文番号は、受注IDからまとめて引き直して表示する。注文番号を持たない受注が含まれるときは、その行の注文番号だけが空になる。

登録日と更新日は `年/月/日 時:分:秒` で表示し、値が無いときは空にする。

### 更新

出荷指示リストIDは数字だけを受け付ける。更新できたときは、同じ出荷指示リストの詳細画面へ戻る。指定した出荷指示リストが見つからないときは、見つからない旨の応答を返して更新しない。

含まれる受注の構成は更新で変わらない。

### 削除

削除は削除専用の要求方法だけで受け付け、出荷指示リストIDは数字だけを受け付ける。なりすまし対策トークンを検証し、トークンが不正なときは権限が無い旨の応答を返して削除しない。IDが指定されていないか、指定した出荷指示リストが見つからないときは、見つからない旨の応答を返して削除しない。

対応状況は元に戻さないため、削除した出荷指示リストに紐づいていた受注は、対応状況が出荷指示のまま出荷指示日だけが空になる。

削除後の戻り先は、検索時のページ番号を保持しているかどうかで決まる。

| 検索時のページ番号 | 戻り先 |
| --- | --- |
| 保持している | そのページ番号の出荷指示リスト検索結果 |
| 保持していない | 出荷指示リスト検索の初期表示 |

## 入出力

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 受注の出荷指示日の消去 | 削除。出荷指示リストを消す前に、含まれる受注すべてを対象に行う |
| 出荷指示リストの削除 | 削除。含まれる受注の出荷指示日を消した後に行う |

受注そのものは削除しない。受注明細と対応状況は、更新でも削除でも書き換えない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M05-20-MSG-001 | 管理画面上部 | 保存に失敗しました | 備考を保存するとき、入力内容に不備があるとき | 出荷指示リスト詳細画面に遷移する |
| M05-20-MSG-002 | 管理画面上部 | 保存しました | 備考を保存したとき | 出荷指示リスト詳細画面に遷移する |
| M05-20-MSG-003 | 管理画面上部 | 削除しました | 出荷指示リストを削除したとき | 出荷指示リスト検索画面に遷移する |
| M05-20-MSG-004 | ブラウザ確認ダイアログ（window.confirm） | 削除してもよろしいですか? | 出荷指示リストの削除を実行しようとしたとき（削除前確認） | 確認後に削除処理へ進み、キャンセル時は出荷指示リスト詳細画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 詳細の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:108 |
| 詳細の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/ShippingStandby/edit.twig:22 |
| 詳細の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/OrderServiceProvider.php:91 |
| 更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:145 |
| 更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/OrderServiceProvider.php:94 |
| 削除 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:169 |
| 削除 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/OrderServiceProvider.php:97 |
| 削除 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:39 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:198 |
