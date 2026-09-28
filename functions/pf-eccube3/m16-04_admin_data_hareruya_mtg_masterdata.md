# データ管理 — MTGマスターデータ編集

## 業務ロジック

### 種別の確定

編集できるマスタ種別は、カードタイプ、サブタイプ、特殊タイプ、カラー、レアリティ、カードレイアウト、プロモーション、イラストレーター、リーガリティ、ボード、カードセットブロック、認定、言語、マナシンボル、ルール適用度、店舗、場所、お問い合わせ件名、デッキタグ、キャンペーンタグ、状態、色順、特殊サジェスト、特殊制限の24種別である。種別選択の送信内容が妥当なときにその種別を確定する。種別が未確定のときは一覧を組み立てない。一覧と登録ボタンの領域は、一覧が組み上がったときだけ画面に出す。

### 一覧の作り方

対象種別のデータを全件取得して一覧に写す。一覧に列として並べるのは先頭項目を除く2列目以降で、最大10列までとする。先頭項目は列として表示せず、行を識別するキーとして保持し、保存時にそのまま送り返す。日時型の項目のうち表示用の見出しが表示開始日時・表示終了日時にあたる列は `Y-m-d H:i:s` 形式の文字列にする。真偽値が偽のセルは画面上は数値の 0 とする。一覧の末尾には空行を 1 行追加する。

### 一覧上部の案内

一覧の上部に、行の値をすべて消すとその値が削除されること、設定値によってはサイトが機能しなくなる場合があることを案内する。あわせて「特殊サジェスト」を設定したときは、設定後に「カード一覧の「カード名リスト作成」」を実行するよう案内する。

### 編集ロック

種別ごとに編集ロックの境界値を持つ。行を識別するキーの値が境界値以下の行では、並び順の列以外を読み取り専用にする。ロック行では表示開始日時・表示終了日時も日時ピッカーを使わず読み取り専用のままとする。

表示開始日時・表示終了日時を持つ種別はキャンペーンタグだけである。キャンペーンタグは編集ロックなしのため、ロック行に表示開始日時・表示終了日時が現れることはない。

| 画面ラベル | 編集ロックの境界値 |
|------------|--------------------|
| カードレイアウト | 5 |
| カードタイプ | 14 |
| カードセットブロック | 27 |
| ボード | 3 |
| 認定 | 3 |
| 言語 | 2 |
| プロモーション | 32 |
| レアリティ | 7 |
| リーガリティ | 3 |
| ルール適用度 | 5 |
| 特殊タイプ | 7 |
| サブタイプ | 378 |

カラー、イラストレーター、マナシンボル、店舗、場所、お問い合わせ件名、デッキタグ、キャンペーンタグ、状態、色順、特殊サジェスト、特殊制限は境界値を持たず、編集ロックなしとなる。

### 保存の判定順序

一覧の行ごとに次の順で判定する。

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 主キーの値があり、主キー以外の入力がすべて未設定 | 当該行を削除する |
| 2 | 主キーの値があり、主キー以外に入力がある | 既存データを読み、主キー以外の項目を入力値で上書きする |
| 3 | 主キーの値が空で、いずれかの項目に入力がある | 新規に作成する |

削除は、主キー以外の項目に未設定でない値がひとつも無いときだけ成立する。

日時列は空でないことを確認する。不合格のときはエラーメッセージを表示し、直前の画面へ戻す。保存が完了したときは成功メッセージを表示し、送信した種別の一覧画面へ戻る。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 編集フォームの検証失敗（なりすまし対策トークンを含む） | HTTP 404 とする。共通の成功・失敗メッセージは表示しない |
| 日時必須違反 | エラーメッセージを表示し、直前の画面へ戻す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 対象マスタ種別の指定、一覧各行の入力値、なりすまし対策トークン |
| 成功時出力 | 対象種別の一覧画面。保存後は同じ種別の一覧画面へ戻り、成功メッセージを表示する |
| 失敗時出力 | 編集フォームの検証失敗は HTTP 404。日時必須違反は直前の画面へ戻し、エラーメッセージを表示する |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | 主キーが空で、いずれかの項目に入力がある行の保存 |
| 更新 | 主キーがあり、主キー以外に入力がある行の保存 |
| 削除 | 主キーがあり、主キー以外の入力がすべて未設定の行の保存 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M16-04-MSG-001 | 管理画面上部 | 保存しました | MTGマスターデータの編集内容を保存したとき | 保存後、MTGマスターデータ編集画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:110-168 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:112-164 |
| 編集ロック | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/HareruyaMasterdata/index.twig:70-76 |
| 編集ロック | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbSubtype.php:11 |
| 編集ロック | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbCampaignTag.php:32 |
| 編集ロック | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:57 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:97-99 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:124-128 |
| 種別の確定 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/HareruyaMasterdata/HareruyaMasterdataType.php:23-48 |
| 種別の確定 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:23 |
| 種別の確定 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/HareruyaMasterdata/index.twig:38 |
| 一覧の作り方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/HareruyaMasterdataController.php:51-71 |
| 一覧の作り方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/HareruyaMasterdata/index.twig:61 |
| 一覧の作り方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:194 |
| 一覧上部の案内 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/HareruyaMasterdata/index.twig:46-51 |
