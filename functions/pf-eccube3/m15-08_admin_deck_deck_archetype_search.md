# pf-eccube3 — デッキ管理 — アーキタイプ検索

## 業務ロジック

### 初期表示

初期表示では、保持していた検索条件・ページ番号・表示件数を破棄し、条件が空で一覧を持たない状態から始める。ソートキーと並び順の保持値は破棄しない。

### 条件どうしの組み合わせ

| 条件 | 絞り込み |
|------|----------|
| アーキタイプ名 | 半角空白・全角空白・カンマで語に分割し、語ごとに日本語名または英語名へ部分一致。語どうしは AND、日本語名と英語名は OR。部分一致の記号（％・アンダースコア）は文字として扱う |
| フォーマット | 選択したいずれかに一致（OR） |
| カラー | 選択した色をすべて持つアーキタイプに限る（AND） |
| デッキタグ | 選択したタグをすべて持つアーキタイプに限る（AND） |

条件をまたぐときは AND で重ねる。未指定の条件では絞り込まない。フォーマットの選択肢はフォーマットの表示順で並べ、同順のときはフォーマットの登録順とする。

### 検索条件の保持と復元

検索条件を受け取れないときは、保持している検索条件で検索する。保持している検索条件も無いときは初期表示へ戻す。検索後は検索条件・ページ番号・ソートキー・並び順・表示件数を保持する。アーキタイプ名以外の条件に値があるときは、詳細条件の入力欄を開いた状態で画面を表示する。

### 表示件数と並び順

表示件数は、保持していた値があるときはそれを使い、無いときは 10 件とする。要求で指定された表示件数は、選択肢として定義された値と一致するときだけ採用して保持する。

並び順は要求の指定、無いときは保持していた値、それも無いときはアーキタイプIDの降順とする。昇順・降順のいずれでもない指定のときは検索を行わず、初期表示と同じ状態へ戻す。

検索の実行・表示件数の変更・並べ替えの変更は、いずれも 1 ページ目から表示する。最終ページで該当件数とページ番号の関係がずれるときは、ページ番号を 1 減らして表示する。

### 一覧に出す内容

1 件につき、代表カード画像・アーキタイプID・日本語名と英語名・カラー・フォーマット名・登録デッキ数・アーキタイプ説明を出す。代表カード画像が未設定のときは画像を出さない。カラーは色の登録順に重複なく並べ、区切りに「/」を用いる。登録デッキ数は、そのアーキタイプに紐づくデッキのうちイベント種別のものだけを重複なく数える。

該当が 0 件のときは、一覧とページ送りを出さず、該当が無い旨だけを出す。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 並び順が昇順・降順のいずれでもない | 並び順のエラーを表示し、アーキタイプ一覧の初期表示へ進む |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索条件、ソートキー、並び順、ページ番号、表示件数。検索条件を受け取れないときは保持している検索条件から復元する |
| 成功時出力 | 検索条件の入力欄と、該当があるときは一覧・該当件数・ページ送りを含む画面 |
| 失敗時出力 | 並び順が不正なときはエラーを表示し、初期表示と同じ状態へ戻す |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M15-08-MSG-001 | 検索フォーム下部 | が該当しました | アーキタイプ一覧で有効な検索条件を指定して検索結果を表示したとき | アーキタイプ一覧の検索結果画面に留まる |
| — | 画面上部 | 並び順エラー（文言は共通実装を正とする） | 並び順が昇順・降順のいずれでもないとき | アーキタイプ一覧の初期表示へ進む |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:56 |
| 条件どうしの組み合わせ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbArchetypeRepository.php:72 |
| 条件どうしの組み合わせ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98 |
| 条件どうしの組み合わせ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbArchetypeRepository.php:90 |
| 条件どうしの組み合わせ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbArchetypeRepository.php:116 |
| 条件どうしの組み合わせ | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Archetype/SearchArchetypeType.php:60 |
| 検索条件の保持と復元 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:161 |
| 検索条件の保持と復元 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/archetype-search.js:2 |
| 表示件数と並び順 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:119 |
| 表示件数と並び順 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:152 |
| 表示件数と並び順 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:186 |
| 表示件数と並び順 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbArchetypeRepository.php:25 |
| 表示件数と並び順 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:32 |
| 表示件数と並び順 | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:242 |
| 表示件数と並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Archetype/archetype.twig:93 |
| 一覧に出す内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbArchetypeRepository.php:57 |
| 一覧に出す内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Archetype/archetype.twig:126 |
| 一覧に出す内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Archetype/archetype.twig:177 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140 |
