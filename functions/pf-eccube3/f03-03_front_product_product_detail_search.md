# F03-03（商品詳細検索）

## 業務ロジック

### 選択肢の提示

カテゴリは、フロント検索で非表示に設定された親カテゴリの直下にあるものを除いて提示する。カードタイプは、商品検索に表示する設定のものだけを提示する。フォーマットは表示順の昇順で提示する。イラストレーターとサブタイプは英語名の昇順で提示するため、日本語表示のときサブタイプは日本語名で表示され、並びが表示名の順にならない。

マナ・コストの選択肢は0から6までの各値と、7以上をまとめた1つの計8通り。言語の絞り込みは日本語・英語・それ以外の3区分から選ぶ。

### 入力欄のふるまい

商品名は255文字まで入力できる。商品名入力欄はブラウザのオートコンプリートを無効にし、未入力のときはプレースホルダを表示したうえで、入力に応じて候補一覧（ユニサジェスト）を出す。サブタイプ欄の下には、記入対象の例を示す注記を表示する。

色とカードタイプの論理演算子は、未指定のときORとして扱う。在庫は未指定のとき「すべて表示」として扱う。

### 送信

遷移元の一覧が持っていたタグとセール絞り込みは、入力欄を持たないまま検索条件として引き継いで送る。並び順・ページ番号・カードIDは引き継がず、詳細検索から検索を実行したときは送らない。未入力・未選択の条件は送らず、抽出条件にも加えない。必須入力の項目は無く、入力値の検証で送信を止めることはしない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 詳細検索フォームの各入力値、および遷移元の一覧から引き継ぐタグ・セール絞り込み |
| 成功時出力 | 入力された条件で絞り込んだ商品一覧 |
| 失敗時出力 | 本フォームは入力値の検証で送信を止めないため、フォーム単独の失敗出力を持たない |

## 表示メッセージ

本機能は利用者向けのインラインエラーメッセージを持たない。一覧側の0件・上限超過の文言はF03-01の表示メッセージを正とする。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 選択肢の提示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:45 |
| 選択肢の提示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:120 |
| 選択肢の提示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:132 |
| 選択肢の提示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:207 |
| 入力欄のふるまい | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:54 |
| 入力欄のふるまい | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/advanced_search_product.twig:165 |
| 入力欄のふるまい | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/advanced_search_product.twig:249 |
| 送信 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/advanced_search_product.twig:18 |
| 送信 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/advanced_search_product.twig:13 |
