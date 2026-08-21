# 商品管理 — カテゴリ一覧

## 業務ロジック

### 一覧の構成

画面は指定した親カテゴリの直下にあるカテゴリの一覧と、ルートから5階層までのカテゴリツリーを表示する。親を指定しない場合はルート直下を一覧に表示する。

一覧の各行はカテゴリ名に英語名称を並べて表示し、選ぶとそのカテゴリの直下を表示した一覧へ移る。該当するカテゴリが1件も無いときは、データが無い旨だけを表示する。

カテゴリツリーは各カテゴリ名の後ろに直下の子カテゴリ件数を添える。ツリーは初期状態では閉じており、表示中のカテゴリまでの経路だけを開く。

編集を開いた場合は、対象カテゴリの兄弟カテゴリを一覧に表示し、祖先をたどったパンくずを表示する。

指定した親カテゴリ、または編集対象のカテゴリが存在しない場合はページが見つからない扱いとする。

### 登録と更新

カテゴリは親カテゴリの配下にのみ新規登録できる。ルート直下への新規登録は画面から行わない。

階層の深さは5階層までとする。5階層を超える登録・更新はできない。

### 表示順

新規登録したカテゴリには、親カテゴリと同じ表示順の値を割り当てる。割り当てに先立って、その値以上の表示順を持つ既存カテゴリ（親カテゴリを含む）の表示順の値を1つずつ増やす。この結果、新規カテゴリは同じ親を持つ既存カテゴリより手前に並ぶ。

一覧で並べ替えを確定すると、画面の並びどおりに表示順を割り当て直す。

### 削除

削除は対象カテゴリを削除し、削除したカテゴリより表示順の値が大きいカテゴリの表示順の値を1つ減らす。対象は親が同じかどうかを問わない。

子カテゴリを持つカテゴリ、および商品が紐づいているカテゴリは削除できない。一覧では削除の入口を選べない状態にし、子カテゴリが存在するため削除できない旨を補足として示す。すでに削除済みのカテゴリを削除しようとした場合は、その旨を表示して一覧へ戻る。

削除後は、対象がルート直下なら一覧へ、それ以外なら親カテゴリの一覧へ遷移する。

### CSV出力

一覧で表示している親カテゴリや階層に関わらず、全カテゴリを出力する。

### エラー時の扱い

| エラー内容 | 扱い |
|------------|------|
| 入力に不備がある | 同一画面にエラーを表示する。登録・更新はしない。 |
| 階層の深さが5階層を超える | 登録・更新しない。 |
| 削除対象が関連データから参照されている | 削除せず、その旨を表示する。 |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 親カテゴリの指定、カテゴリ名などの入力項目、並べ替えの結果 |
| 成功時出力 | カテゴリの一覧とツリー、登録・更新・削除の完了メッセージ、CSVファイル |
| 失敗時出力 | 入力の不備によるエラー、削除できない場合のエラー |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | カテゴリの新規登録 |
| 更新 | カテゴリの編集、並べ替え、新規登録・削除に伴う他カテゴリの表示順の付け替え |
| 削除 | カテゴリの削除 |

### 出力: CSVファイル

ヘッダ行を先頭に出力し、続けてカテゴリを1件1行で出力する。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-45-MSG-001 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 子カテゴリや商品が登録されていないカテゴリの削除を選んだとき | 削除でモーダルを閉じてカテゴリ一覧画面に遷移、キャンセルでモーダルを閉じる |
| M03-45-MSG-002 | 削除確認モーダル内 | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | カテゴリの削除を選んだとき | 削除でモーダルを閉じてカテゴリ一覧画面に遷移、キャンセルでモーダルを閉じる |
| M03-45-MSG-003 | ブラウザ確認ダイアログ | 本当に並べ替えを実行してよろしいですか? | カテゴリの表示順を変更するとき | 並べ替えを実行し、管理画面_商品管理_カテゴリ一覧画面に留まる。キャンセル時は変更せず同画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧の構成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/CategoryController.php:20-33 |
| 一覧の構成 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/CategoryController.php:156-168 |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:204 |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:243-256 |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:81-85 |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:127-135 |
| 一覧の構成 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:234-236 |
| 登録と更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/CategoryController.php:70-75 |
| 登録と更新 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:142 |
| 登録と更新 | P2 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:98 |
| 表示順 | P3 | pf-eccube3:src/Eccube/Repository/CategoryRepository.php:228-250 |
| 表示順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:57-77 |
| 削除 | P1 | pf-eccube3:src/Eccube/Repository/CategoryRepository.php:272-299 |
| 削除 | P1 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:133-171 |
| 削除 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:216-224 |
| CSV出力 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:216-221 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/CategoryController.php:70-75 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/CategoryController.php:77-84 |
| 出力: CSVファイル | P3 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:213-221 |
