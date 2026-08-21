# 商品管理 — 棚番号更新CSV登録

## 業務ロジック

### 取込履歴の一覧

一覧に出すのは棚番号更新CSVの取込履歴だけで、他のCSV取込の履歴は混ざらない。アップロード日時の新しい順に並べる。作業者は、削除済みの管理者であっても氏名を表示する。

### 雛形のダウンロード

見出し行だけを1行出力する。先頭に BOM を書き、区切り文字は設定の値（配布既定はカンマ）とする。ファイル名は product_shelf_number.csv とし、ファイルとしてダウンロードさせる。

### 取込ファイルの受け付け

取込ファイルの文字コードは自動判定し、UTF-8 でなければ UTF-8 へ変換して読む。改行コードは揃える。拡張子が tsv のときは区切り文字をタブとし、それ以外は設定の区切り文字とする。ゼロ幅スペースと BOM は読む前に取り除く。

行数の上限判定に使う行数は、引用符で囲まれた範囲を取り除いたうえでの改行の数とする。値の中に改行を含む行はこの数に加わらない。上限の判定は取込を始める前の1回だけで、取込中に行数で打ち切ることはない。

### 取込の判定順序

| 順序 | 判定 | 結果 |
| --- | --- | --- |
| 1 | なりすまし対策トークンが正しいこと | 不正なときはアクセス拒否として取込を始めない |
| 2 | ファイルが選択されていること、アップロードサイズが上限（設定のメガバイト値。配布既定は5）以内であること、CSVとして扱える種類のファイルであること | 失敗時はメッセージを表示するだけで取込を始めない |
| 3 | 行数が上限に達していないこと | 達しているときはメッセージを表示し、取込を始めない |
| 4 | 1行目が見出し行として読めること、2行目以降にデータ行があること | 見出し形式のエラー、またはデータが無いエラーとして取込を終える |
| 5 | 各データ行の列数が、この機能が定める列の数と一致すること | 一致しないときは列数のエラーとして全体を中断する |
| 6 | 各行に見出し名どおりの列が揃っていること、列ごとの必須を満たすこと | 満たさない行を見つけた時点で以降の行を処理しない |
| 7 | 商品コードに対応する商品が実在すること。削除された商品・商品規格しか無い行は、存在しない商品として扱う | 存在しないときは以降の行を処理しない |
| 8 | 棚番号の値と同じ名称の棚番号が登録済みであること | 登録が無いときは以降の行を処理しない |
| 9 | 上記を満たす行の反映 | 対象の商品規格の棚番号を置き換える |

検証エラーが1件でもあると、その時点で取込を打ち切り、それまでに反映した行を含めて変更を確定しない。全行が通ったときだけ確定する。

同じ商品コードが同一ファイル内に複数行あるときは行ごとに反映するので、最後の行の値が残る。ただし商品コードに一致する商品規格が2件以上あるときは、7の照合が実行時例外となり取込を中止し、1行も確定しない。

### 反映の範囲

更新するのは商品規格の棚番号だけで、同じ商品の他の項目は変えない。商品・商品規格の更新日時も変わらない。反映の対象は商品コードが一致する商品規格すべてで、削除済みの商品規格も含む。

### 取込結果

エラーが1件でもあるときは、各エラーをアップロード画面に並べて表示する。エラーが無いときは登録完了を表示し、取込履歴へ CSV種別・アップロードしたファイルの元の名称・取込日時・作業者を1件記録する。いずれの場合もアップロード画面へ戻る。

### エラー時の扱い

| エラー内容 | 処理 |
| --- | --- |
| なりすまし対策トークンの不正 | アクセス拒否として応答し、取込を始めない |
| ファイル未選択・サイズ超過・種類不正・行数超過 | メッセージを表示するだけで、取込は始めない |
| 見出し不備／データ行無し | 取込がエラーを返す。データは1行も更新しない |
| 行の検証エラー／商品が存在しない／棚番号が登録されていない | 取込がエラーを返し、画面にメッセージを展開する。変更は確定しない |
| 取込中の実行時例外 | 取り消しを試みたうえで例外を伝播させる。本機能では握りつぶさない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 取り込むファイル（CSVまたはTSV）、なりすまし対策トークン |
| 成功時出力 | アップロード画面へ戻し、登録完了を表示する。取込履歴を1件登録する。雛形は見出し行のみのファイル |
| 失敗時出力 | 同じ画面へ戻し、エラーの内容を表示する |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 検証を通った行ごとに、対象の商品規格の棚番号を置き換える |
| 追加 | エラーが1件も無く取込を終えたとき、取込履歴を1件登録する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-40-MSG-001 | 管理画面上部 | CSVのフォーマットが一致しません | フォームが有効であるにもかかわらず、import_file が null のとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-002 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | 上限を超える行数のCSVファイルを登録したとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-004 | 管理画面上部 | 登録が完了しました。 | CSVファイルを正常に登録したとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-003 | 管理画面上部 | CSVのフォーマットが一致しません。 ／ CSVデータが存在しません。 ／ CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 ／ %d 行目の %s ではデータを取得できません。 ／ %s は必須項目です。 %d 行目のデータを確認してください。 ／ %d 行目の %s の値が異常です。 ／ %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 ／ %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 | CSVアップロードボタンを押下し、CSVのヘッダー形式またはデータ行の列数が不正、もしくはヘッダー以外のデータ行が存在しないとき | エラーフラッシュを設定し、棚番号更新CSVアップロード画面へ遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取込履歴の一覧 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1857 |
| 取込履歴の一覧 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Block/csv_import_history.twig:23 |
| 雛形のダウンロード | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:499 |
| 取込ファイルの受け付け | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:131 |
| 取込ファイルの受け付け | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2284 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1432 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:39 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:28 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:131 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:188 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvBulkImporter.php:92 |
| 反映の範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:239 |
| 反映の範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1422 |
| 取込結果 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1456 |
| 取込結果 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbCsvImportHistoryRepository.php:25 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvBulkImporter.php:109 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:93 |
