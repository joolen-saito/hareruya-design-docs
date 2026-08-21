# 商品管理 — 略称タグCSV入力

## 業務ロジック

### 取込ファイルの読み方

1行目を見出し行として扱う。文字コードがUTF-8以外のファイル、改行の種類が異なるファイル、バイト順序記号やゼロ幅の空白文字を含むファイルも取り込める。それらの文字は取り込んだ値には残らない。拡張子が tsv のファイルはタブ区切りとして読み、それ以外は設定した区切り文字（既定はカンマ）と囲み文字で読む。

1行目を見出し行として読み取れないときは、何も取り込まず取込画面へ戻す。

末尾の項目の値が空の行は、その項目を列数に数えない。このため行末に区切り文字が付いたファイルも取り込めるが、末尾の項目を空にした行は、必須項目が空ではなく列数の不一致として扱う。

エラーに付く行番号は、見出し行を1行目として数えたファイル上の行番号とする。最初のデータ行は2行目になる。

### 見出し行の照合

見出し行は、ID の項目を除いた残りが、フォーマットに定めた項目名と順序・内容とも完全に一致しなければならない。一致しないときは1行も取り込まない。ID の項目は、無くても、他の位置にあっても差し支えない。

### 取り込みを止める条件

次のいずれかに当たったとき、その時点で取り込みを止める。

| 条件 | 判定の単位 |
|------|------------|
| データ行が1行も無い | ファイル全体 |
| 行の列数が見出し行の列数と一致しない | 行ごと |
| 必須の項目が空 | 行ごと |
| 同一ファイル内で並び順が重複する | 行ごと |
| 名称が、ID の異なる既存の略称タグに既に使われている | 行ごと |

### 新規と更新の判定

ID の値で既に登録された略称タグを引き当てられるときは、その略称タグの名称と並び順を上書きする。引き当てられないときは新規に登録する。ID の項目が無いとき、空のとき、0 のとき、登録されていない値のときは、いずれも引き当てられないものとして新規に登録する。

取り込みで変わるのは名称と並び順だけとする。既存の略称タグのアルファベット順ソートフラグは取り込みで変わらない。新規に登録した略称タグのアルファベット順ソートフラグは、オフの状態になる。

### 取り込みの確定

取り込みは全行をひとまとまりとして確定する。途中の行で取り込みを止めたときは、それより前の行の登録・更新も残らない。部分的に取り込まれた状態にはならない。

### 取込後の画面

取り込みが完了したときも、取り込みを止めたときも、CSVアップロード画面へ戻る。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | CSVファイル（見出し行と1行以上のデータ行）、なりすまし対策トークン |
| 成功時出力 | 略称タグの登録・更新、登録完了のメッセージ、CSVアップロード画面への戻り |
| 失敗時出力 | エラーメッセージ（行ごとに止めたときは行番号を含む）、CSVアップロード画面への戻り。行の取り込みを始めた後で止めたときは、それまでの登録・更新を取り消す |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | ID で既存の略称タグを引き当てられない行の取り込み |
| 更新 | ID で既存の略称タグを引き当てられた行の取り込み（名称・並び順） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-16-MSG-001 | 管理画面上部 | 登録が完了しました。 | 全行の取り込みが終わったとき | CSVアップロード画面へ戻る |
| M03-16-MSG-002 | 管理画面上部 | CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 | 行の列数が見出し行の列数と一致しないとき | 取り込みを取り消してCSVアップロード画面へ戻る |
| M03-16-MSG-003 | 管理画面上部 | %s は必須項目です。 %d 行目のデータを確認してください。 | 必須の項目が空のとき | 取り込みを取り消してCSVアップロード画面へ戻る |
| M03-16-MSG-004 | 管理画面上部 | CSV内で並び順が重複しています。 %d 行目のデータを確認してください。 | 同一ファイル内で並び順が重複するとき | 取り込みを取り消してCSVアップロード画面へ戻る |
| M03-16-MSG-005 | 管理画面上部 | 名称がすでに登録されています。 %d 行目のデータを確認してください。 | 名称が、ID の異なる既存の略称タグに既に使われているとき | 取り込みを取り消してCSVアップロード画面へ戻る |
| M03-16-MSG-006 | 管理画面上部 | CSVのフォーマットが一致しません。 | 見出し行がフォーマットに定めた項目名と一致しないとき | 1行も取り込まずCSVアップロード画面へ戻る |
| M03-16-MSG-007 | 管理画面上部 | CSVデータが存在しません。 | データ行が1行も無いとき | 取り込まずCSVアップロード画面へ戻る |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取込ファイルの読み方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:138 |
| 取込ファイルの読み方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:156 |
| 取込ファイルの読み方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:361 |
| 取込ファイルの読み方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:23 |
| 取込ファイルの読み方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:25 |
| 見出し行の照合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:208 |
| 見出し行の照合 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:236 |
| 取り込みを止める条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:220 |
| 取り込みを止める条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:29 |
| 取り込みを止める条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:248 |
| 新規と更新の判定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:36 |
| 新規と更新の判定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbStorageCode.dcm.yml:38 |
| 新規と更新の判定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbStorageCode.php:31 |
| 取り込みの確定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:190 |
| 取り込みの確定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:194 |
| 取り込みの確定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:64 |
| 取込後の画面 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:83 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:49 |
