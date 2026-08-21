# イベント管理 — イベント申込詳細・編集

## 業務ロジック

### Excel基本設計により廃止された仕様（刷新後は実装不要）

- Excel基本設計 0214 識別ID:4-1 により廃止。刷新後は実装しない。現行実装のふるまいは本書に残すが、刷新後の実装・テストの対象外とする
- Excel基本設計 0214 識別ID:4-2 により廃止。刷新後は実装しない。現行実装のふるまいは本書に残すが、刷新後の実装・テストの対象外とする
- Excel基本設計 0214 識別ID:4-3 により廃止。刷新後は実装しない。現行実装のふるまいは本書に残すが、刷新後の実装・テストの対象外とする

### 申込詳細の初期表示

削除済みの会員も、削除済みのプレイヤーも表示の対象から外さない。指定された申込が存在しないときは404とする。参加プレイヤーの行は、チーム人数と既存の参加者数の大きい方の行数で用意する。

### 更新の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 指定された申込が存在するか | 存在しなければ404とする |
| 2 | 更新の送信であるか | 送信によらない到達は更新失敗を表示し、編集画面へ戻す |
| 3 | 参加者が実在し、同じ日程の他の申込に登録されていないか | 実在しないか重複するときは申込重複のメッセージを表示し、編集画面を再描画する |
| 4 | その他の入力内容が妥当か | 妥当でなければ更新失敗を表示し、編集画面を再描画する |
| 5 | 上記を通過 | 申込を更新し、成功を表示して同じ申込の編集画面へ戻る |

### 参加者の反映

参加者情報リストから外れた参加者は削除し、追加された参加者は新規に登録する。更新が成功するたびに申込履歴を1件記録する。

### プレイヤー検索の絞り込みと選択可否

検索語は空白・カンマで区切り、区切ったすべての語に一致するものだけを表示する。語ごとの一致対象には会員の姓カナ・名カナも含む。

表示中の申込と同じ日程に、別の申込で既に登録されているプレイヤーは「登録済」と表示し、決定できない。編集中の申込ですでに選んだプレイヤーは「選択済」と表示し、決定できない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 申込が存在しない | 404とする。画面のメッセージは表示しない |
| 更新の送信でない | 更新失敗を表示し編集画面へ戻す |
| 参加者が実在しない・参加者重複 | 申込重複のメッセージを表示し編集画面を再描画する |
| その他の検証不備 | 更新失敗を表示し編集画面を再描画する |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | パスの申込ID、なりすまし対策トークン、参加者情報リスト |
| 成功時出力 | 申込の更新と成功表示、編集画面への遷移 |
| 失敗時出力 | 更新の送信でないとき・検証不備はエラー表示のうえ編集画面の再描画または遷移。申込不在は404 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | 更新成功時の申込履歴、参加者情報リストに追加された参加者 |
| 更新 | 更新成功時の申込 |
| 削除 | 参加者情報リストから外れた参加者 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M13-10-MSG-001 | 管理画面上部 | 保存しました | イベント申込内容を編集して保存したとき | イベント申込詳細・編集画面に遷移する |
| M13-10-MSG-002 | 管理画面上部 | プレイヤーID %player_id% が見つかりません。 ／ admin.event.entry.paying_member_customer_not_registered | イベント申込の編集で、存在しないプレイヤーIDを指定して更新したとき | 編集画面に留まる |
| M13-10-MSG-003 | 管理画面上部 | 保存に失敗しました | イベント申込内容の保存中にエラーが起きたとき | イベント申込詳細・編集画面に留まる |
| — | 画面上部 | 登録が完了しました。 | 申込の更新が成功したとき | 編集画面へ戻る |
| — | 画面上部 | 登録できませんでした。 | 更新の送信でないとき、またはその他の検証失敗で更新できなかったとき | 編集画面に留まる |
| — | 画面上部 | 半角数字で金額を入力してください。 | 支払金額が不正なとき | 編集画面に留まる |

「登録が完了しました。」は登録・更新で共通の成功メッセージである。参加者重複時は申込重複用の文言を表示する。申込が存在しないときはメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| Excel基本設計により廃止された仕様（刷新後は実装不要） | P3 | 0214:sheet-15 |
| 申込詳細の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:332-336 |
| 申込詳細の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:338-342 |
| 申込詳細の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:355-375 |
| 更新の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:498-514 |
| 更新の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryDuplicateValidator.php:30-44 |
| 更新の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:577-583 |
| 参加者の反映 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:547-575 |
| 参加者の反映 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:539 |
| プレイヤー検索の絞り込みと選択可否 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPlayerRepository.php:38-51 |
| プレイヤー検索の絞り込みと選択可否 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98-116 |
| プレイヤー検索の絞り込みと選択可否 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:139-153 |
| プレイヤー検索の絞り込みと選択可否 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Entry/search_player.twig:29-50 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:498-514 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:539 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:547-577 |
