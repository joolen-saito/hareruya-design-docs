# カード管理 — フォーマット一覧

## 業務ロジック

### 一覧に出す範囲

絞り込み条件を持たず、登録されているフォーマットを全件表示する。削除済みのフォーマットは一覧に出さない。ページ送りは行わず、件数にかかわらず1画面に出す。同じ並び順のフォーマットが複数あるときは、登録が早いものを先に出す。1件も無いときも表の見出し行は表示し、データ行を出力しない。

### 一覧に出す値

フォーマット名と認定は、いずれも和名と英名を「 / 」でつないだ1つの文字列として表示する。認定が設定されていないフォーマットは、認定欄を空欄にする。フォーマット名は、そのフォーマットのフォーマット詳細画面への参照として表示する。参照先のフォーマット詳細画面には、そのフォーマットの登録内容を表示する。

### 削除できない条件

イベントが紐づく場合に加え、デッキまたはアーキタイプが紐づくフォーマットも削除できない。いずれか1つでも紐づいていれば削除を行わず、削除を要求した直前の画面へ戻す。

### 削除したときに一緒に消えるもの

削除できる状態のフォーマットを削除するとき、そのフォーマットに対して定めたカードごとの禁止・制限の指定をすべて取り除き、続いてフォーマット自体を削除済みにする。禁止・制限の指定は記録を残さない取り除き方のため、削除したあとに指定内容を取り出すことはできない。フォーマット自体は取り除かずに削除済みとして記録し、以後の通常の参照から除外する。

### 削除要求を受け付けない場合

| 要求 | 応答 |
|------|------|
| 存在しない識別子のフォーマットに対する削除要求 | 該当なし（HTTP 404）とし、削除を行わない |
| なりすまし対策トークンが一致しない削除要求 | アクセス拒否として処理を中断し、削除を行わない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 一覧の表示要求に入力項目は無い。削除要求は対象フォーマットの識別子となりすまし対策トークン |
| 成功時出力 | フォーマットの一覧表を含む管理画面。削除に成功したときは一覧画面を再表示する |
| 失敗時出力 | 削除できない条件に当たるときは直前の画面へ戻す。存在しない識別子・トークン不一致のときは要求を拒否する応答を返す |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 削除 | フォーマットの削除実行時の、当該フォーマットに紐づくカードごとの禁止・制限の指定 |
| 削除済みへの変更 | フォーマットの削除実行時の、当該フォーマット本体 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M14-09-MSG-001 | 管理画面上部 | 保存しました | 新しいフォーマットを登録して保存したとき | フォーマット編集画面に遷移する |
| M14-09-MSG-002 | 管理画面上部 | 保存しました | フォーマットの編集内容を保存したとき | フォーマット編集画面に遷移する |
| M14-09-MSG-003 | 管理画面上部 | 既にイベントが登録されているので、削除出来ません。 | イベントに登録されているフォーマットを削除しようとしたとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-004 | 管理画面上部 | 既にデッキが登録されているので、削除出来ません。 | デッキに登録されているフォーマットを削除しようとしたとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-005 | 管理画面上部 | 既にアーキタイプが登録されているので、削除出来ません。 | アーキタイプに登録されているフォーマットを削除しようとしたとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-006 | 管理画面上部 | 削除しました | 関連するイベント・デッキ・アーキタイプがないフォーマットを削除したとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-007 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | フォーマットの削除中にエラーが起きたとき | フォーマット一覧画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧に出す範囲 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:29 |
| 一覧に出す範囲 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Format/format.twig:28 |
| 一覧に出す範囲 | P3 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:387 |
| 一覧に出す値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Format/format.twig:38 |
| 一覧に出す値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Format/format.twig:45 |
| 一覧に出す値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:62 |
| 削除できない条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:161 |
| 削除したときに一緒に消えるもの | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:168 |
| 削除したときに一緒に消えるもの | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbFormat.dcm.yml:15 |
| 削除要求を受け付けない場合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:44 |
| 削除要求を受け付けない場合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:156 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:173 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbFormat.dcm.yml:167 |
