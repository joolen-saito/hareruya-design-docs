# カード管理 — フォーマット新規登録・編集・削除

## 業務ロジック

### 編集画面の初期表示

指定した識別子のフォーマットが無いときは 404 とする。

統率のボードを持つフォーマットでは、統率上限枚数と統率下限枚数に、そのフォーマットに保存済みの統率の上限・下限を初期表示する。統率のボードを持たないとき（新規登録を含む）は、統率のカードをメインボード枚数に含むを未選択の状態で表示する。

新規登録では削除の操作を出さない。削除の操作は、既に登録済みのフォーマットを開いたときだけ表示する。

### 保存の判定順序

| 順序 | 判定 | 結果 |
| --- | --- | --- |
| 1 | 更新のとき、指定した識別子のフォーマットがあるか | 無いときは 404 とし、保存しない |
| 2 | なりすまし対策トークンが有効か | 無効のときはアクセス拒否（HTTP 403）とし、保存しない |

登録と更新のいずれも、保存した後は当該フォーマットの編集画面を表示する。

### 禁止カード・制限カードの初期表示と保存

編集画面では、当該フォーマットに対して定めたカードごとの指定のうち、禁止のものを禁止カードに、制限のものを制限カードに初期表示する。どちらにも当たらない指定（リーガル）はいずれの欄にも表示しない。新規登録ではいずれの欄も空とする。

保存すると、当該フォーマットの禁止・制限の指定は入力した内容へ置き換わる。ただし、入力に含まれないカードのリーガルの指定は残る。

### 統率の上限・下限の保存

統率でカードを使用する（統率者や策略等）を選ばずに保存すると、それまで保存されていた統率の上限・下限は破棄され、次に編集画面を開いたときは初期表示に戻る。

### 削除の判定順序

| 順序 | 判定 | 結果 |
| --- | --- | --- |
| 1 | なりすまし対策トークンが有効か | 無効のときはアクセス拒否（HTTP 403）とする |
| 2 | 指定した識別子のフォーマットがあるか | 無いときは 404 とする |
| 3 | 大会・デッキ・アーキタイプのいずれかが当該フォーマットに紐づくか | 1 件でも紐づくときは削除せず、削除を要求した直前の画面へ戻す |
| 4 | いずれも紐づかないとき | 当該フォーマットに対して定めたカードごとの禁止・制限の指定をすべて取り除いたうえで、フォーマットを削除する |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 編集は対象フォーマットの識別子。保存は入力欄一式となりすまし対策トークン。削除は対象フォーマットの識別子となりすまし対策トークン |
| 成功時出力 | 保存した後は当該フォーマットの編集画面 |
| 失敗時出力 | 入力の検証を満たさないときは、入力した値を保持したまま編集画面を再表示する。削除できないときは直前の画面へ戻す |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 削除・追加 | 保存のたびに、当該フォーマットの禁止・制限の指定を入力した内容へ置き換えるとき |
| 削除 | 統率でカードを使用しない設定にして保存し、統率の上限・下限が既にあるとき |
| 削除 | フォーマットと、それに紐づくカードごとの禁止・制限の指定を、削除できる条件を満たしたとき |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M14-10-MSG-001 | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | フォーマット名（英字）に使用できない文字を入力して保存したとき | フォーマット新規登録・編集画面に留まる |
| M14-10-MSG-002 | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | フォーマットコードに使用できない文字を入力して保存したとき | フォーマット新規登録・編集画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集画面の初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:45 |
| 編集画面の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:69 |
| 編集画面の初期表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Format/formatedit.twig:138 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:89 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:44 |
| 保存の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:142 |
| 禁止カード・制限カードの初期表示と保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:59 |
| 禁止カード・制限カードの初期表示と保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:64 |
| 禁止カード・制限カードの初期表示と保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:123 |
| 禁止カード・制限カードの初期表示と保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:131 |
| 統率の上限・下限の保存 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:281 |
| 削除の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:154 |
| 削除の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:158 |
| 削除の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:161 |
| 削除の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:168 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:126 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:173 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:282 |
