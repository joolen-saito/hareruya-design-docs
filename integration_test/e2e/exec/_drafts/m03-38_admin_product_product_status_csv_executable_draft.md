# 候補: m03-38 商品公開CSV登録（取込/インポート） — 実行可能グレード候補（母集合105全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R2（Major7件）是正反映版（2026-07-29・ee/pf実ソース＋Excel照合・MSG割当をControllerでfile:line確定）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（committed）の構造・取込検証設計を踏襲。値・claim・列名・source_classはM03-38自身の一次資料（Excel 0204 商品公開CSV登録/フォーマット・pf実source・ee実source）から取得。
> **ee実装有無＝実装済**: ee(SUT)に専用Controller `ProductStatusCsvController.php`・専用handler `ProductStatusUpdateImportHandler.php`・専用twig `csv_product_status.twig`・定数 `MtbCsvImportType::PRODUCT_STATUS_IMPORT_CSV_ID=14` が実在（M03-34/36のようなee未実装ではない）。
> **MSG割当（R2 M1・Controllerでfile:line確定）**: MSG-001=フォーム不正（`!isValid`:134）／MSG-002=ファイルnull（`csv_invalid_format`:144）／MSG-003=行数上限（`maxrecord`:150）／MSG-004=取込エラー（`result->hasError`:168）／MSG-005=成功（`admin.register.complete`:174）。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能・設計と実装が乖離・pf/ee食い違いはTBD。boundは固有挙動が一次資料にfile:lineで実在し1実行でpass/fail一意判定でき前提・入力・期待が母集合行と一致する場合のみ。ee固有UI/内部（accept値・ファイル名ラベルJS・session保存条件）がpf/excel正本を持たないものはboundにしない。
> B1-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  シート「商品公開CSV登録」（機能No=M03-38・概要「商品の公開ステータスをCSVで一括更新できる」・確認モーダル「押下後、確認モーダルを表示」）＋シート「商品公開CSVフォーマット」（3列定義）。根拠は実Excel座標 `0204:商品公開CSV登録!<セル>` / `0204:商品公開CSVフォーマット!<セル>` で表記する。
- **pf現行実source（回帰先・source_class=pf-fallback）**: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvProductStatus:1547`・`csvProductStatusUpload:1564`・`render:1857`＝2列 商品ID/公開ステータス(ID)・`const CSV_IMPORT_MAX=5010`・`const CSV_IMPORT_HISTORY_LIMIT=100`＝**履歴は固定100件・ページングなし**）／`.../Service/Csv/Importer/Event/ProductStatusImportHandler.php`（商品不存在breakAll:61-80・updateProductStatus生SQL:142-164＝**廃止でもdel_flg=0ならUPDATE実行・廃止スキップ無し**）／`base_csv_upload.twig`（accept=`text/csv,text/tsv`:26・行エラーは`.text-danger`:29-31・確認モーダル部品なし・ファイル名ラベルJSなし）／`ColumnDefinitions.php:150`（statusId＝choice[DISPLAY_SHOW=1,DISPLAY_HIDE=2]）。
  **pf-md（`functions/pf-eccube3/m03-38_admin_product_product_status_csv.md`・git hash-object `625a2f7ff654af2cf470936b735482ee22055392`）本文はEE挙動記述を含む**ため、pf現行回帰オラクルはpf実sourceでfile:line確認した。
- **ee実source（SUT・挙動照合・source_classには不使用）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php`（MSG分岐:134/144/150/168/174・GET upload:82／POST import:126・`$form->getErrors()` deep=false:135）／`.../Service/Csv/Importer/Event/ProductStatusUpdateImportHandler.php`（廃止スキップ〔false・エラー積まず〕:83-85・商品不存在breakAll:137-153・支店choice検証:125-127）／`.../Service/Csv/Importer/CsvImporter.php`（validateBeforeImport:185-208・isSuccessful:270-275）／`.../Form/Type/Admin/CsvImportType.php`（import_file 子フィールド required+NotBlank:48-56）／`.../Controller/AbstractController.php`（getCsvImportHistoryPaginationParams:392＝**page_countは許容値のときだけsession保存・page_no毎回保存**）／`.../Resource/template/admin/Product/csv_product_status.twig`＋`base_csv_upload.twig`＋`csv_import_history.twig`＋`pager.twig`／enロケール `.../Resource/locale/messages.en.yaml`。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-001..105`（105件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実sourceは挙動照合とenロケール源に使い、オラクルの source_class には不使用。
- **pf/ee食い違いの帰属（R2 M1/M3/M4）**: (a)列数/列名/支店列追加＝Excel識別ID2/3規定＝**excel**（L1-003/013）。(b)**確認モーダル**＝Excel規定だがpf・ee両実装未実装＝設計実装乖離→L1-005（excel設計規定）・母集合-006/-105は**TBD**。(c)**廃止行の実挙動**＝ee `onReadRow` で false返却・更新せず（handler:83）／pf は del_flg=0の生SQLでUPDATE実行（handler:142-164）＝**pf/ee正反対の食い違い**でExcel逐語は「変更不可」まで→L1-009はExcel逐語のみ・母集合-009は**TBD**（実挙動が単一正本で確定できない）。(d)**session保存条件**（page_countは許容値のときだけ保存・page_no毎回保存）＝ee固有実装（AbstractController:392）でExcel/pf正本なし→母集合-003/-102/-099は**TBD**。ページング自体はExcel設計追加（D60,D78-81）でL1-006は件数プルダウン表示とページ遷移の画面挙動のみを規定。(e)**ee固有UI**（accept値・ファイル名ラベル更新JS）はpf現行と異なりexcel/pf正本なし→母集合-005/-104は**excluded**。(f)結果表示機構＝pf `render()`／ee `redirect()`（PRG）はExcel非規定＝boundは「POST後アップロード画面へ戻りメッセージで成否」のアウトカムに限定（L1-015）。(g)成功文言＝pf「商品登録CSVファイルをアップロードしました。」／ee「登録が完了しました。」相違＝L1-017は存在のみ主張し文言はpinしない。
- **en（★全描画キーgrep＝R2 M2でページャ・成功キー／R3 M1でMSG-001/002エラーキー追加）**: 英語あり: `product_management`=Products／`product_csv_management`=Product CSV Management／`csv_upload`=Upload a CSV file／`csv_format`=CSV file format／`csv_skeleton_download`=Download a template／`required`=Required／`count`=%count% items／`search_no_result`=Sorry, no data matches your search condition(s)／**ページャ `first`=Go to First・`prev`=Previous・`next`=Next・`last`=Go to Last(pager.twig)**／**成功 `admin.register.complete`=Registration completed.(1676)**／**MSG-002 `admin.common.csv_invalid_format`=Unmatched CSV format(1810)**／**MSG-001 フォームエラー NotBlank＝pf指定キー admin.csv.error.upload.require『ファイルを選択してください。』(pf plugin CsvImportType:33／message.ja.yml:1094)・ee英語実訳『No value found.』(validators.en.yaml:17 がSymfony既定『This value should not be blank.』をee override)・File maxSize『The file is too large...』(symfony validators.en.xlf)**＝L1-001/002/016 LS=1。英訳なし（grep0件）: `browse`・`csv_import_error`・`csv_item_name`・`csv_description`・`csv_import_history_title`/`_filename`/`_upload_date`/`_operator`・機能固有 `product_status_csv`/`..._upload_title`/`..._format_title`。
- **B1事前スイープ**: 「場合がある／し得る／なり得／可能性」該当0件。-061/-091/-094は出所未確認プレースホルダ（excluded）。

---

## §1 L1原子オラクル表

全20claim（L1-004はee固有ファイル名ラベルのため撤去・欠番）。**source_class列は excel／pf-fallback のみ**（excel8=L1-003/005/006/007/009/010/012/013／pf-fallback12）。LS=1（enロケール変異あり）＝L1-001/002/016。他はLS=0。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0338-001 | http_entry | ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」から商品公開CSV登録画面（アップロードフォーム・フォーマット説明表・雛形ダウンロード・下部の取込履歴）が開く。上位ナビは Products / Product CSV Management で表示される | 「商品管理」→「商品CSV管理」→「商品公開CSV登録」 | pf csvProductStatus:1547;ee ProductStatusCsvController.php:82 | pf-fallback | 1 |
| L1-M0338-002 | display_field | 商品公開CSV登録画面は共通のCSVアップロードテンプレートを継承し、ファイル入力と「CSVファイルのアップロード」ボタン・フォーマット説明表（必須列に必須表示）・雛形ダウンロード・下部に取込履歴（ファイル名・アップロード日時・作業者）を表示する | 「admin.common.csv_upload / required / csv_skeleton_download」 | ee base_csv_upload.twig:53-113;pf base_csv_upload.twig:13-76 | pf-fallback | 1 |
| L1-M0338-003 | display_field | 商品公開CSVフォーマットは3列（識別ID1「商品ID」＝主キー・数値(整数)・必須／識別ID2「商品公開ステータス」＝数値(整数)・必須・選択項目「非公開」「公開」の2種類・公開ステータス(ID)からの名称変更／識別ID3「支店の商品公開ステータス」＝数値(整数)・必須・選択項目「公開」「非公開」・新規追加項目）である | 「識別ID 2:「公開ステータス(ID)」から「商品公開ステータス」へ名称変更、選択項目は「非公開」「公開」の2種類」「識別ID 3:「支店の商品公開ステータス」を追加。選択項目は「公開」「非公開」の2種類」 | 0204:商品公開CSVフォーマット!E8,E9,E10,U8;0204:商品公開CSV登録!D73,D75 | excel | 0 |
| L1-M0338-005 | display_field | Excel設計では「CSVファイルのアップロード」ボタンは押下後に確認モーダルを表示する（設計正本の画面部品として規定）。※pf・ee両実装ともに確認モーダル部品を持たず設計と実装が乖離する | 「押下後、確認モーダルを表示」 | 0204:商品公開CSV登録!AG92 | excel | 0 |
| L1-M0338-006 | display_field | 取込履歴はページング化され（設計で追加したページ表示高速化のためのカスタマイズ）、件数プルダウンの選択肢は 10/50/100/300/500/1000/2000/10000/12000件で、選択後は指定レコード数へ自動切替、ページ遷移リンクで他ページへ移動できる。※どのpage_count値をsession保存するか等の内部session挙動はee固有でExcel/pf正本が無く本claimは画面挙動のみ規定 | 「選択肢: 10件 50件 …12000件」「選択後、指定レコード数へ自動的に切り替え」「ページ遷移リンクにより他ページに移動可能」 | 0204:商品公開CSV登録!AG96,AG98,D78,D80,D81 | excel | 0 |
| L1-M0338-007 | validation | 識別ID1「商品ID」は必須項目であり、商品IDが空のデータ行はバリデーションエラーとなり取込が中断され、公開ステータスは更新されない | 「商品ID｜主キー〇｜数値(整数)｜必須〇」 | 0204:商品公開CSVフォーマット!U8 | excel | 0 |
| L1-M0338-008 | validation | データ行の商品IDが商品として存在しない（`isProductExists` が偽）とき、商品不存在エラーを積み `breakAll` で取込を中断する（documentation-only＝母集合-090はヘッダ不備/データ無し/行検証/商品不存在の4分岐一体要求で1実行一意判定できずTBD） | 「更新対象の商品がないのでエラー。`$event->breakAll();`」 | pf ProductStatusImportHandler.php:61-80;ee ProductStatusUpdateImportHandler.php:137-153 | pf-fallback | 0 |
| L1-M0338-009 | validation | 当機能は「2-廃止」の変更はできない（設計規定）。※廃止行の実挙動はpf/eeで食い違い（ee=onReadRowでfalseを返し更新せず／pf=del_flg=0の生SQLでUPDATE実行）ため単一正本で確定できずTBD扱い（本claimはExcel逐語の変更不可規定のみ・documentation-only） | 「当機能は「商品公開ステータス」区分の一つである「2 - 廃止」の変更はできません。」 | 0204:商品公開CSV登録!E74 | excel | 0 |
| L1-M0338-010 | validation | アップロードCSVの概算レコード数が上限（5010件）以上のとき、取込を実行せずエラーメッセージを表示し商品公開CSV登録画面へ戻る（MSG-003） | 「レコード数上限チェックを実施。5010件以上はエラーとする。」 | 0204:商品公開CSV登録!D84;ee ProductStatusCsvController.php:150 | excel | 0 |
| L1-M0338-011 | validation | 取込前の基本検査として、ヘッダ行はあるがデータ行が無いCSVはデータ無しエラーとなり、取込を実行せずエラーメッセージを表示する | 「2行目にデータが存在しない場合はエラー」 | ee CsvImporter.php:196-204 | pf-fallback | 0 |
| L1-M0338-012 | data_write | 商品IDで商品情報の商品公開ステータスを更新する。当機能は既存商品の更新のみで新規登録時の処理はしない。正常取込では対象商品の商品公開ステータスがCSV指定値へ更新され、商品編集画面の再表示で反映を確認できる | 「商品IDで商品情報の商品公開ステータスIDを更新する。」「新規登録時の処理はしない」 | 0204:商品公開CSV登録!D85,D57 | excel | 0 |
| L1-M0338-013 | data_write | 識別ID3「支店の商品公開ステータス」（新規追加列・数値(整数)・必須・選択項目「公開」「非公開」＝0:非公開 1:公開）を商品情報の支店向け公開フラグへ反映する。値0で非公開・値1で公開として更新され、選択項目外の値（例:2）を持つ行は選択検証エラーで取込が中断される。正常取込は商品編集画面の再表示で反映を確認できる | 「識別ID 3:「支店の商品公開ステータス」を追加。」「0: 非公開 1:公開　新規項目追加」 | 0204:商品公開CSV登録!D75;0204:商品公開CSVフォーマット!E10,AG10,U10 | excel | 0 |
| L1-M0338-014 | history | 取込結果にエラーが無い（成功）と判断したときだけ、取込履歴（`dtb_csv_import_history`）へ種別ID14・クライアント側ファイル名・作業者で1件INSERTする。エラー（breakAll）を含む取込では履歴は増えない。取込履歴一覧は作成日時降順で取得されるため、正常取込では当該ファイル名が先頭行に現れエラー取込では現れない | 「取込エラーなく完了したときだけ INSERT」「`orderBy('cih.createDate', 'DESC')`」 | pf ProductCsvController.php:1598-1605;ee ProductStatusCsvController.php:168-180;ee DtbCsvImportHistoryRepository.php:71 | pf-fallback | 0 |
| L1-M0338-015 | http_flow | POSTアップロード送信は、フォーム不正・ファイルnull・上限超過・取込成功・取込エラーのいずれの結末でも同じアップロード画面（商品公開CSV登録画面）へ戻り、メッセージで成否が示される | 「常に商品公開CSV登録画面へ戻りメッセージで成否が分かる」 | ee ProductStatusCsvController.php:126-192 | pf-fallback | 0 |
| L1-M0338-016 | validation | pf現行では import_file は必須（NotBlank・HareruyaEcプラグインの admin_csv_import フォームでメッセージキー admin.csv.error.upload.require＝「ファイルを選択してください。」を指定）で、フォーム不正時に `getErrors(true)`（deep=true）で子フィールドのエラーまで取得し管理画面上部にフラッシュ表示する。※SUT=ee は `getErrors()`（deep=false・:135）で子フィールドエラーを取得せずフラッシュに載らない＝pf/ee食い違い（-019/-085 TBD・§9.1）。NotBlankキーのee英語実訳は「No value found.」（validators.en.yaml:17がee override） | 「フォーム NotBlank」「pf メッセージ『ファイルを選択してください。』／pf `getErrors(true)` vs ee `getErrors()`」 | pf app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:33;pf message.ja.yml:1094;ee validators.en.yaml:17 | pf-fallback | 1 |
| L1-M0338-017 | message | 取込結果にエラーが無いとき、成功を示すメッセージが管理画面上部に表示される（成功メッセージが1件表示される）。成功文言はpf/ee相違のため存在のみを主張し文言はpinしない | 「成功時出力｜成功メッセージ」 | pf ProductCsvController.php:1601;ee ProductStatusCsvController.php:174 | pf-fallback | 0 |
| L1-M0338-018 | rollback | 取込のコミット可否は `isSuccessful = messageStore->count()===0 || !hasBreak` で判定し、`breakAll` が発生した取込はロールバックされ何も書き込まれない。`breakAll` が発生しなければコミットされる | 「`$isSuccessful = $messageStore->count() === 0 || !$hasBreak;`」 | ee CsvImporter.php:270-275 | pf-fallback | 0 |
| L1-M0338-019 | log | POST取込で情報ログ「商品公開CSV登録開始」を出し、取込結果にエラーがあれば「商品公開CSV登録 異常終了」、無ければ「商品公開CSV登録完了」と件数を出す（documentation-only＝ログ観測手段未整備・要実機） | 「商品公開CSV登録完了」と件数引数の連想情報 | ee ProductStatusCsvController.php:156,169,175 | pf-fallback | 0 |
| L1-M0338-020 | file_handling | アップロードされたCSVはサーバの一時ディレクトリ（設定 `eccube_csv_temp_realdir`）へ退避されてからインポータが読み込み、処理終了時に一時ファイルの削除を試行する（documentation-only＝固有一意判定行が無く観測手段も未整備） | 「一時ディレクトリ eccube_csv_temp_realdir へ退避後にインポータが読込み、終了時に一時ファイルを削除試行」 | ee CsvImporter.php:136-154,164-176 | pf-fallback | 0 |
| L1-M0338-021 | validation | 商品公開ステータス列は選択肢（公開/非公開の2種類）に限定された選択検証を持ち、許容集合外の値を持つ行はエラーとなる（documentation-only＝母集合に選択検証を固有一意判定する要求行が無い） | 「選択項目は「非公開」「公開」の2種類」 | pf ColumnDefinitions.php:150-158;ee ProductStatusUpdateImportHandler.php:122-124 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとして用意しUI操作でアップロードする。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0338-MASTERS | 取込の前提マスタ | 商品公開ステータス（公開/非公開/廃止）・支店公開フラグの選択マスタ一式 | 不要（参照） |
| SEED-M0338-VALIDUPDATE | 正常取込（既存商品更新） | 既存商品1件（商品公開ステータス=非公開が既知）＋商品IDを指定し 商品公開ステータス=公開 に変更する1データ行CSV | 対象商品を更新前の値へ復元・追加された取込履歴を削除 |
| SEED-M0338-BRANCH | 支店の商品公開ステータス更新・選択検証 | 既存商品1件（支店の商品公開ステータス=非公開が既知）＋支店=1(公開)／支店=0(非公開)／支店=2(許容外)の3種の1データ行CSV | 対象商品を復元・追加された取込履歴を削除 |
| SEED-M0338-HISTORY | 取込履歴のページング検証 | dtb_csv_import_history に種別ID14の履歴を複数件（ページング境界跨ぎ） | 不要（参照） |
| SEED-M0338-BADPRODUCTID | 商品不存在breakAll（エラーCSV） | 存在しない商品IDを指定した1データ行CSV（他列は妥当） | 不要（打ち切り・書込みなし） |
| SEED-M0338-EMPTYREQ | 必須列（商品ID）空の検証 | 商品ID列が空の1データ行CSV（他列は妥当） | 不要（中断・書込みなし） |
| SEED-M0338-NODATA | データ無し検証 | ヘッダ行のみでデータ行が無いCSV | 不要（拒否・書込みなし） |
| SEED-M0338-MAXROW | 行数上限（5010）検証 | データ行が5010件以上のCSV | 不要（拒否・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報）

取込CSV列はコントローラの列定義順（雛形 `product_status_template.csv` 1行目）と一致。

| 識別ID | 列名 | 書式・制限 | 必須 | 備考 |
|---|---|---|---|---|
| 1 | 商品ID（主キー） | 数値(整数) | 〇 | 更新対象の商品を特定（入力例176808） |
| 2 | 商品公開ステータス | 数値(整数)・選択肢「非公開」「公開」の2種類 | 〇 | 公開ステータス(ID)からの名称変更・廃止は変更不可（L1-009） |
| 3 | 支店の商品公開ステータス | 数値(整数)・選択肢「公開」「非公開」（0:非公開 1:公開） | 〇 | 新規追加列・選択外はエラー（L1-013） |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 8候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0338C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。C-002/C-003/C-006/C-007/C-008/C-014は欠番（C-002=ファイル名ラベルee固有UI→excluded・C-003=確認モーダルee未実装→TBD・C-006=選択検証documentation-only・C-007=商品不存在は-090の4分岐一体要求でTBD・C-008=廃止はpf/ee食い違いでTBD・C-014=ファイル未選択画面エラーがee子フィールドで不成立→TBD）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラーの**メッセージ**と**取込履歴の先頭行（作成日時降順）のファイル名**を画面で目視するのが主。(2)取込効果は**対象商品を再表示**して公開ステータス照合。(3)DB自動検証は外部IFで検知不能な否定的事実（ロールバック=何も書かれない）と、**ページング表示で画面から安定に数えられない取込履歴件数の増減（C-011）**に限る（画面で目視できる反映値はDB二重チェックしない）。
- 操作手順は純UI操作。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-38_admin_product_product_status_csv	E2E-M0338C-001	IT-25	画面表示	P1	メニュー/ブックマークからアップロード画面が開きフォーマット表・雛形ダウンロード・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0338-HISTORY	—	1. ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」またはブックマークからアクセスする 2. アップロード画面が開き、ファイル入力・「CSVファイルのアップロード」ボタン・フォーマット説明表・雛形ダウンロードボタン・下部の取込履歴テーブルが表示されることを確認する	ナビまたはブックマークから商品公開CSV登録画面が開き、ファイル入力と「CSVファイルのアップロード」ボタン・CSVファイルフォーマット（商品ID・商品公開ステータス・支店の商品公開ステータスの項目名と説明・必須列に必須表示）・雛形ダウンロードボタン・取込履歴テーブル（ファイル名・アップロード日時・作業者）が表示される（enロケールでは上位ナビProducts/Product CSV Managementや共通ラベルUpload a CSV file等が英語表示） [L1:L1-M0338-001,L1-M0338-002,L1-M0338-003; fixture:SEED-M0338-HISTORY@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-004	IT-15	ページネーション	P2	取込履歴の件数プルダウンで表示件数が変わりページ遷移リンクで他ページへ移動できる	ログイン済／SEED-M0338-HISTORY	件数プルダウン（選択肢 10/50/100/300/500/1000/2000/10000/12000）で表示件数を変更	1. アップロード画面下部の取込履歴の件数プルダウンで表示件数（例:50件）を選択する 2. 履歴一覧が指定レコード数へ切り替わることを確認する 3. ページ遷移リンク（Go to First/Previous/Next/Go to Last）で他ページへ移動できることを確認する	取込履歴の件数プルダウンで選択肢（10/50/100/300/500/1000/2000/10000/12000件）を選ぶと履歴一覧が指定レコード数へ切り替わり、ページ遷移リンクで他ページへ移動できる（設計で追加したページング化・enではGo to First/Previous/Next/Go to Last） [L1:L1-M0338-006; fixture:SEED-M0338-HISTORY@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-005	IT-22	必須バリデーション	P2	商品ID列が空のデータ行は必須バリデーションエラーで取込が中断される	ログイン済／SEED-M0338-MASTERS／SEED-M0338-EMPTYREQ	商品ID列が空の1データ行CSVファイル（他列は妥当）	1. 商品ID空のCSVを選択し「CSVファイルのアップロード」を押下する 2. エラーメッセージが表示され成功メッセージが出ないことを確認する 3. 取込履歴テーブルに新行が増えないことを確認する	商品ID（必須項目）が空のデータ行は必須バリデーションエラーとなり取込が中断され、取込エラーメッセージが管理画面上部に表示され成功メッセージは出ず取込履歴テーブルに新行が増えない [L1:L1-M0338-007,L1-M0338-018; fixture:SEED-M0338-EMPTYREQ@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-009	IT-12	行数上限	P1	概算レコード数5010件以上のCSVは上限エラーで拒否され商品公開CSV登録画面へ戻る	ログイン済／SEED-M0338-MAXROW	データ行が5010件以上のCSVファイル	1. 5010件以上のCSVを選択し「CSVファイルのアップロード」を押下する 2. エラーメッセージ表示とアップロード画面への遷移を確認する	概算レコード数が上限（5010件）以上のCSVは取込を実行せずエラーメッセージが管理画面上部に表示され、商品公開CSV登録画面へ戻る ／ 自動検証(内部・DB): 商品の公開ステータス列・取込履歴とも増減・変化なし [L1:L1-M0338-010,L1-M0338-015; fixture:SEED-M0338-MAXROW@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-010	IT-17	フォーマット定義	P2	ヘッダ行はあるがデータ行が無いCSVはデータ無しエラーで拒否される	ログイン済／SEED-M0338-NODATA	ヘッダ行のみでデータ行が無いCSVファイル	1. データ行が無いCSVを選択し「CSVファイルのアップロード」を押下する 2. データ無しエラーメッセージが表示され取込が実行されないことを確認する	ヘッダ行はあるがデータ行が無いCSVはデータ無しエラーとなり、取込を実行せずエラーメッセージが管理画面上部に表示される（取込履歴は増えない） [L1:L1-M0338-011; fixture:SEED-M0338-NODATA@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-011	IT-26	取込履歴の登録条件	P1	正常な更新CSVは成功して履歴の先頭に取込ファイルが載り公開ステータスが反映されるが、エラーCSVでは履歴が登録されない（成功時のみINSERTの排他条件）	ログイン済／SEED-M0338-MASTERS／SEED-M0338-VALIDUPDATE／SEED-M0338-BADPRODUCTID	正常な更新CSV（商品公開ステータス=公開・一意な取込ファイル名）とエラーCSV（存在しない商品ID・別の一意な取込ファイル名）の2ファイル	1. 正常な更新CSVを選択し「CSVファイルのアップロード」を押下し、成功メッセージ表示と取込履歴一覧（作成日時降順）の先頭行に当該取込ファイル名が表示されることを確認する 2. 商品編集画面で対象商品を再表示し商品公開ステータスが公開になっていることを確認する 3. 続けてエラーCSV（存在しない商品ID）を選択しアップロードし、エラーメッセージが表示され取込履歴一覧の先頭行に当該エラーCSVのファイル名が現れないことを確認する	取込エラーなく完了した正常な更新CSVでは対象商品の商品公開ステータスがCSV指定値へ更新され、成功メッセージが管理画面上部に表示され取込履歴一覧（作成日時降順）の先頭行に当該取込ファイル名が表示される。対象商品を再表示すると商品公開ステータス＝公開が表示される。一方、エラーを含む取込（存在しない商品ID）ではエラーメッセージが表示され、履歴一覧の先頭行に当該エラーCSVのファイル名は現れない（取込履歴は取込エラーなく完了したときだけ登録される排他条件） ／ 自動検証(内部・DB): db.tsで種別ID14の取込履歴(dtb_csv_import_history)件数を照合し、正常取込で1件増加・エラー取込で変化しないことを確認する（画面の履歴はページング表示で行数比較が不安定なため件数の増減はDBで判定） [L1:L1-M0338-012,L1-M0338-014,L1-M0338-017; fixture:SEED-M0338-VALIDUPDATE@TBD-D5,SEED-M0338-BADPRODUCTID@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-012	IT-26	支店公開ステータス更新	P2	支店の商品公開ステータス列は値1で公開・0で非公開に反映され選択項目外の値は拒否される	ログイン済／SEED-M0338-MASTERS／SEED-M0338-BRANCH	既存商品の商品IDを指定し支店の商品公開ステータス=1(公開)／=0(非公開)／=2(許容外)の3種CSV	1. 支店=1のCSVをアップロードし商品編集画面で対象商品の支店の商品公開ステータスが公開になることを確認する 2. 支店=0のCSVをアップロードし非公開になることを確認する 3. 支店=2(許容外)のCSVをアップロードし選択検証エラーで取込が中断され更新されないことを確認する	識別ID3「支店の商品公開ステータス」は値1を指定すると公開・値0を指定すると非公開として対象商品へ反映され、商品編集画面の再表示で確認できる。選択項目外の値（2）を持つ行は選択検証エラーとなり取込が中断され対象商品は更新されない [L1:L1-M0338-013; fixture:SEED-M0338-BRANCH@TBD-D5]				
m03-38_admin_product_product_status_csv	E2E-M0338C-013	IT-25	画面遷移	P1	成功・失敗のどちらの取込でもアップロード画面へ戻りメッセージで成否が示される	ログイン済／SEED-M0338-MASTERS／SEED-M0338-VALIDUPDATE／SEED-M0338-BADPRODUCTID	正常CSV（取込成功）とエラーCSV（商品不存在エラー）の2ファイル	1. 正常CSVを選択し「CSVファイルのアップロード」を押下→アップロード画面が再表示され成功メッセージが表示されることを確認する 2. 続けてエラーCSVを選択し「CSVファイルのアップロード」を押下→同じくアップロード画面が再表示されエラーメッセージが表示されることを確認する	POST取込は取込成功・取込エラーのどちらの結末でも同じアップロード画面（商品公開CSV登録画面）へ戻り、成功時は成功メッセージ・失敗時はエラーメッセージが管理画面上部に表示される [L1:L1-M0338-015,L1-M0338-017; fixture:SEED-M0338-VALIDUPDATE@TBD-D5,SEED-M0338-BADPRODUCTID@TBD-D5]				
```

---

## §5 ja/en locale対応表（ee messages.en.yaml逐語・全描画キーgrep実施＝R2 M2でページャ・成功キー追加）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。共通テンプレ＋ページャ＋成功キーの全描画キーをgrepし英語有無を全確定した。

| L1 | キー | ja | en（ee messages.en.yaml） | en有無 |
|---|---|---|---|---|
| L1-001 | admin.product.product_management | 商品管理 | Products | 有(1930) |
| L1-001 | admin.product.product_csv_management | 商品CSV管理 | Product CSV Management | 有(1938) |
| L1-002 | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | 有(1804) |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | 有(1806) |
| L1-002 | admin.common.csv_skeleton_download | 雛形ダウンロード | Download a template | 有(1805) |
| L1-002 | admin.common.required | 必須 | Required | 有(1785) |
| L1-002 | admin.common.count | %count% 件 | %count% items | 有(1792) |
| L1-002 | admin.common.search_no_result | 検索結果がありません | Sorry, no data matches your search condition(s) | 有(1800) |
| L1-006 | admin.common.first | 最初 | Go to First | 有 |
| L1-006 | admin.common.prev | 前へ | Previous | 有 |
| L1-006 | admin.common.next | 次へ | Next | 有 |
| L1-006 | admin.common.last | 最後 | Go to Last | 有 |
| L1-017 | admin.register.complete | 登録が完了しました。 | Registration completed. | 有(1676) |
| L1-016（MSG-001 NotBlank） | validator NotBlank | pf指定キー admin.csv.error.upload.require＝「ファイルを選択してください。」(pf plugin CsvImportType:33／message.ja.yml:1094)／eeキー This value should not be blank. | No value found.（validators.en.yaml:17 がSymfony既定を ee override） | 有(validators.en.yaml:17) |
| L1-016（MSG-001 File） | validator File maxSize | ファイルが大きすぎます。 | The file is too large. Allowed maximum size is {{ limit }} {{ suffix }}. | 有(symfony validators.en.xlf) |
| （MSG-002 ファイルnull） | admin.common.csv_invalid_format | CSVのフォーマットが一致しません | Unmatched CSV format | 有(1810) |
| L1-002 | admin.common.browse | 参照 | — | 英訳なし |
| L1-002 | admin.common.csv_import_error | CSV取込エラー | — | 英訳なし |
| L1-002 | admin.common.csv_item_name | 項目名 | — | 英訳なし |
| L1-002 | admin.common.csv_description | 説明 | — | 英訳なし |
| L1-002 | admin.product.csv_import_history_title | 取込履歴 | — | 英訳なし |
| L1-002 | admin.product.csv_import_history_filename | ファイル名 | — | 英訳なし |
| L1-002 | admin.product.csv_import_history_upload_date | アップロード日時 | — | 英訳なし |
| L1-002 | admin.product.csv_import_history_operator | 作業者 | — | 英訳なし |
| （機能固有・英訳なし） | admin.product.product_status_csv | 商品公開CSV登録 | — | 英訳なし(ja:2020) |
| （機能固有・英訳なし） | admin.product.product_status_csv_upload_title | 商品公開CSV | — | 英訳なし(ja:2021) |
| （機能固有・英訳なし） | admin.product.product_status_csv_format_title | 商品公開CSVファイルフォーマット | — | 英訳なし(ja:2022) |

※成功文言 `admin.register.complete`=Registration completed.(1676)は実在するがee(SUT)固有語であり、L1-017（pf-fallback・pf/ee文言相違のため文言をpinしない）の期待値本文には混ぜない（純度）。en有無の記録としてのみ本表に掲載する。

---

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（`csv_product_status.twig`／共通 `base_csv_upload.twig`）のセレクタと SUT route（ee GET `/%eccube_admin_route%/product/status/csv_upload`・POST `…/product/status/import`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。
- 取込結果の検証はメッセージDOM＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象商品を商品編集で再表示して公開ステータス反映確認（B9）。
- db.ts自動検証（内部・DB）は: ロールバック時の非書込み（C-005/C-012許容外）／上限拒否時の非書込み（C-009）／**取込履歴の件数増減（C-011・成功で+1・エラーで不変）**に限る。取込履歴は作成日時降順のページング表示でDOMに現在ページ分しか出ず件数比較が不安定なため、増減はDBで判定する（先頭行のファイル名有無は画面で観測）。C-012の支店反映・C-011の公開ステータス反映は画面で確認しDB二重チェックしない（B9トートロジー回避）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・メッセージ集合アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVファイルのアップロード」ボタン）。直接POSTは用いない。
2. 取込CSVは fixture（SEED-M0338-*）として用意。C-012は支店=1/0/2の3ファイルで反映と選択検証を一意判定する。
3. 更新系ケース（C-011/C-012）は取込でDB（商品・取込履歴）が変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-004 | Playwright（GUI） | 画面（DOM） | 画面表示・ページネーション表示 |
| C-012,C-013 | Playwright（GUI） | 画面（メッセージ・履歴先頭行・再表示） | 支店反映・常に画面へ戻る＝画面で判定 |
| C-005,C-009,C-010,C-011,C-012(許容外) | Playwright＋DB確認 | 画面（メッセージ・履歴先頭行・再表示）＋DB | 中断・上限拒否・許容外拒否の非書込みはDB副次／C-011は成功時の反映値・履歴先頭行を画面で確認しつつ取込履歴件数の増減（成功+1/エラー不変）をDBで判定 |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: ロールバックの非書込み・上限拒否時の非書込み・**取込履歴件数の増減（C-011・成功で+1／エラーで不変）**。取込履歴は作成日時降順（`DtbCsvImportHistoryRepository:71`）のページング表示でDOMに現在ページ分しか出ず件数比較が不安定なため、件数の増減はDB内部検証（`dtb_csv_import_history` 種別ID14）で確認する（先頭行のファイル名有無は画面で観測）。正常取込の反映値（公開/支店ステータス）は画面で目視可能なため画面で確認しDB二重チェックはしない。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点はexcluded（Gate B15）。

### 集計（105 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **12** | 8ユニーク候補ケース。B12共有〔完全重複・同一実行のみ〕で母集合12行→tsv8行 |
| **TBD** | **14** | 確認モーダル乖離(-006/-105)／ファイル未選択NotBlank(-019/-085)／公開列更新+履歴+ログ一体(-049/-082)／取込完了ログ(-097)／session保存条件(-003/-102/-099)／HTTPフラッシュ複数分岐(-089)／エラー4分岐一体(-090)／MSG-002ファイルnull純UI到達不能(-092)／廃止のpf/ee食い違い(-009) |
| **excluded** | **79** | 汎用スタブ・矛盾・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・phantom MSG・ee固有UI(ファイル名ラベル)・documentation-only内部 |
| 合計 | **105** | 欠番0・理由なし重複0 |

> 会計: bound 12／TBD 14／excluded 79（=105・欠番0）

- 候補ケース総数 **8**（C-001,C-004,C-005,C-009,C-010,C-011,C-012,C-013）。bound12母集合行を B12（完全重複・同一実行）でemitすると tsv=ユニーク8。
  - C-001←-053/-086/-100（画面表示・GET route）／C-004←-088（ページネーション表示）／C-005←-010（必須バリデーション 商品ID空）
  - C-009←-093（MSG-003=行数上限→画面遷移）／C-010←-064（データ無しエラー）／C-011←-083（取込成功・公開列更新＋履歴INSERT）
  - C-012←-008/-041（支店の商品公開ステータス 0/1反映＋許容外拒否）／C-013←-087/-095（POST後アップロード画面へ戻る・成功MSG-005/エラーMSG-004）
- **R2是正の会計移動**: MSG再割当により-092(MSG-002ファイルnull→TBD)・-093(MSG-003行数上限→C-009)・-094(MSG-004→excluded placeholder)・-095(MSG-005成功→C-013)。session必須の-003/-102/-099をTBD、C-004は表示のみの-088へ。-089(複数分岐フラッシュ)をC-013から分離しTBD。-090(4分岐)をTBD・C-007撤回。-009(廃止pf/ee食い違い)をTBD・C-008撤回。C-012を0/1反映＋許容外拒否へ拡張。
- **B7非該当観点excluded**: 検索条件14（-020〜-033）／ファイル操作系（-072〜-081）。§9.3。
- **B8観点補正＝22件**（bound/TBD代表行と共有twinの観点ラベルが期待テキスト実内容と不一致。§8.1）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（22件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -003 | 未認証 | ページネーション（session保存条件・ee固有） | L1-006 |
| -006 | 識別子 | 確認モーダル（Excel規定・ee未実装乖離） | L1-005 |
| -008 | 確認ダイアログ | 支店公開ステータス（0/1反映・許容外拒否） | L1-013 |
| -009 | HTTPステータス | 廃止商品スキップ（pf/ee食い違い） | L1-009 |
| -019 | 部分入力 | ファイル必須（NotBlank・画面表示はeeで不成立） | L1-016 |
| -041 | 登録内容 | 支店公開ステータス（0/1反映・許容外拒否） | L1-013 |
| -049 | 実行結果 | 取込成功（公開列更新＋履歴＋ログ一体・ログ要実機） | L1-012 |
| -053 | 更新内容 | 画面表示（アップロード画面） | L1-001 |
| -082 | 初期行数 | 取込成功（公開列更新＋履歴＋ログ一体・ログ要実機） | L1-012 |
| -083 | 表示順 | 取込履歴の登録条件（成功時のみINSERT・エラー時は増えない排他） | L1-014 |
| -085 | 内部情報 | ファイル必須（NotBlank・画面表示はeeで不成立） | L1-016 |
| -087 | ロールバック | 画面遷移（POST後アップロード画面へ戻る） | L1-015 |
| -088 | 画面レイアウト | ページネーション（表示件数プルダウン） | L1-006 |
| -089 | 画面レイアウト | メッセージ表示（複数エラー分岐フラッシュ） | L1-015 |
| -090 | 画面レイアウト | 取込エラー表示（4分岐一体） | L1-008 |
| -092 | 画面レイアウト | メッセージ/画面遷移（MSG-002ファイルnull・到達不能） | L1-015 |
| -093 | 画面レイアウト | メッセージ/画面遷移（MSG-003行数上限→画面遷移） | L1-010 |
| -095 | 一覧 | 画面遷移（MSG-005成功→画面遷移） | L1-015 |
| -097 | 画面表示データ | ログ出力（取込完了ログ・要実機） | L1-019 |
| -099 | 画面表示データ | ページネーション（page_no/page_count更新・ee固有） | L1-006 |
| -102 | 非同期更新 | ページネーション（session保存条件・ee固有） | L1-006 |
| -105 | データ正当性 | 確認モーダル（Excel規定・ee未実装乖離） | L1-005 |

### 105対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | excluded | — |
| 002 | CSRFのファイル出力内容が一致（汎用スタブ・固有挙動定義なし） | excluded | — |
| 003 | クエリ件数が許容リストのときだけセッション保存（session保存条件はee固有実装でExcel/pf正本なし・要仕様確定） | TBD | — |
| 004 | csv_product_status.twig が base_csv_upload.twig を継承（Twig継承は観測不能・C-001被覆） | excluded | — |
| 005 | ファイル選択でカスタムラベルへファイル名表示（ee固有UI＝pf現行はラベル更新JSなし・Excel/pf正本なし） | excluded | — |
| 006 | 送信前の確認ダイアログの有無。Excel設計は確認モーダル表示を規定するが実装は未実装で設計と実装が食い違い要仕様確定 | TBD | — |
| 007 | 一時ディレクトリ退避後読込み・終了時削除試行（内部ファイル処理・観測手段未整備・documentation-only L1-020） | excluded | — |
| 008 | dtb_product.is_branch_published に保存（支店列0/1反映・許容外拒否＝C-012で観測可能に検証） | bound | C-012 |
| 009 | 廃止行の実挙動。ee=onReadRowで何も更新せずfalse／pf=del_flg=0でUPDATE実行のpf/ee食い違いで単一正本が確定できず要仕様確定 | TBD | — |
| 010 | 必須バリデーションでエラー表示され完了しない（商品ID必須） | bound | C-005 |
| 011 | 必須バリデーションでエラー表示されず継続（前提ロールバック・汎用「エラーなし継続」） | excluded | — |
| 012 | 説明テーブルは静的配列・実行後の自動再読込しない（画面静的注記・C-001被覆） | excluded | — |
| 013 | 相関バリデーションでエラー表示され完了しない（本機能に行バリデータ無し・相関検証なし・汎用スタブ） | excluded | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ・相関検証なし） | excluded | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ・相関検証なし） | excluded | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提副作用・汎用スタブ・相関検証なし） | excluded | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提登録/更新は汎用ノイズ・商品不存在は-090側） | excluded | — |
| 019 | ファイルを選択せず送信したときの必須（NotBlank）エラー表示。専用画面では子フィールドのエラーが管理画面上部に出ないため実表示文言は実機確認が必要 | TBD | — |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索非該当・汎用スタブ・B7） | excluded | — |
| 021 | 含まれない（検索非該当・汎用スタブ） | excluded | — |
| 022 | 含まれる（汎用スタブ） | excluded | — |
| 023 | 含まれない（汎用スタブ・前提ファイルnull/行数超過） | excluded | — |
| 024 | 含まれる（汎用スタブ・前提商品不存在等） | excluded | — |
| 025 | 含まれない（汎用スタブ・前提MSG-001フォーム不正） | excluded | — |
| 026 | 含まれる（汎用スタブ・前提MSG-002ファイルnull） | excluded | — |
| 027 | 含まれない（汎用スタブ・前提MSG-003行数上限） | excluded | — |
| 028 | 含まれる（汎用スタブ・前提MSG-004取込エラー） | excluded | — |
| 029 | 含まれない（汎用スタブ・前提MSG-005成功） | excluded | — |
| 030 | 含まれる（汎用スタブ・前提取込直後） | excluded | — |
| 031 | 含まれない（汎用スタブ・前提正常完了後） | excluded | — |
| 032 | 含まれる（汎用スタブ・前提エラー残存時） | excluded | — |
| 033 | 含まれない（汎用スタブ・前提ページング閲覧） | excluded | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | excluded | — |
| 035 | 同上（汎用スタブ） | excluded | — |
| 036 | 同上（汎用スタブ） | excluded | — |
| 037 | 同上（汎用スタブ） | excluded | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・当機能は新規登録しない） | excluded | — |
| 039 | 追加されない（汎用スタブ） | excluded | — |
| 040 | 追加される（汎用スタブ） | excluded | — |
| 041 | dtb_product.is_branch_published に保存（支店列0/1反映・許容外拒否＝C-012で観測可能に検証） | bound | C-012 (shared) |
| 042 | 追加される（汎用スタブ・前提廃止行） | excluded | — |
| 043 | 追加される（汎用スタブ） | excluded | — |
| 044 | 追加されない（汎用スタブ・前提ロールバック） | excluded | — |
| 045 | 追加される（汎用スタブ） | excluded | — |
| 046 | 追加されない（汎用スタブ・前提履歴一覧） | excluded | — |
| 047 | 追加される（汎用スタブ・前提成功時出力） | excluded | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ） | excluded | — |
| 049 | 取込成功時の商品公開列の更新・取込履歴の追加・情報ログ出力の一体確認。情報ログは観測手段が未整備のため一体では確認できず要実機 | TBD | — |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-011で概念被覆） | excluded | — |
| 051 | 変更されない（汎用スタブ＝C-005/C-012で概念被覆） | excluded | — |
| 052 | 変更される（汎用スタブ） | excluded | — |
| 053 | GET …/product/status/csv_upload（画面表示・GET route） | bound | C-001 (shared) |
| 054 | 変更される（汎用スタブ） | excluded | — |
| 055 | 変更される（汎用スタブ） | excluded | — |
| 056 | 変更されない（汎用スタブ・前提ファイルnull/行数超過） | excluded | — |
| 057 | 変更される（汎用スタブ・前提商品不存在等） | excluded | — |
| 058 | 変更されない（汎用スタブ・前提MSG-001フォーム不正） | excluded | — |
| 059 | 変更される（汎用スタブ・前提MSG-002ファイルnull） | excluded | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提MSG-003行数上限） | excluded | — |
| 061 | 母集合期待が出所未確認のプレースホルダ（前提MSG-004取込エラー） | excluded | — |
| 062 | 実行結果のファイル出力内容が一致（汎用スタブ・前提MSG-005成功） | excluded | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | excluded | — |
| 064 | フォーマット定義でエラー表示され完了しない（データ無しエラー） | bound | C-010 |
| 065 | 実行結果のファイル出力内容が一致（汎用スタブ・前提エラー残存時） | excluded | — |
| 066 | 同上（汎用スタブ・前提ページング閲覧） | excluded | — |
| 067 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 068 | 同上（汎用ファイルスタブ） | excluded | — |
| 069 | 同上（汎用ファイルスタブ） | excluded | — |
| 070 | 同上（汎用ファイルスタブ） | excluded | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ） | excluded | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | excluded | — |
| 073 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | excluded | — |
| 074 | コピーのファイル出力内容が一致（非該当） | excluded | — |
| 075 | ファイル登録のファイル出力内容が一致（アップロード成否はC-011で被覆・汎用ファイルスタブ） | excluded | — |
| 076 | ファイル出力のファイル出力内容が一致（出力は本機能に非該当） | excluded | — |
| 077 | JSONのファイル出力内容が一致（非該当） | excluded | — |
| 078 | 同名ファイルのファイル出力内容が一致（非該当） | excluded | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | excluded | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当） | excluded | — |
| 081 | スキーマのファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 082 | 取込成功時の商品公開列の更新・取込履歴の追加・情報ログ出力の一体確認。情報ログは観測手段が未整備のため一体では確認できず要実機 | TBD | — |
| 083 | 取込エラーなく完了したときだけ INSERT（取込履歴条件・成功時のみ） | bound | C-011 |
| 084 | 更新抑止のファイル出力内容が一致（汎用スタブ） | excluded | — |
| 085 | ファイルを選択せず送信したときの必須（NotBlank）エラー表示。専用画面では子フィールドのエラーが管理画面上部に出ないため実表示文言は実機確認が必要 | TBD | — |
| 086 | GET …/product/status/csv_upload（画面表示・GET route） | bound | C-001 (shared) |
| 087 | POST後アップロード画面へ戻りメッセージで成否（画面遷移） | bound | C-013 |
| 088 | GET結果の履歴リストが選択したページサイズになる（ページネーション表示） | bound | C-004 |
| 089 | フォーム検証エラー・ファイルnull・行数超過の複数エラー分岐でメッセージ（フラッシュのみ）表示。ファイルnull分岐は純UI到達不能を含み一体では一意判定できず要実機 | TBD | — |
| 090 | ヘッダ不備・データ無し・行検証・商品不存在の4エラー分岐でインポータのエラー結果をメッセージ展開。4分岐一体要求で1実行一意判定できず要実機 | TBD | — |
| 091 | 母集合期待が出所未確認のプレースホルダ（前提MSG-001フォーム不正） | excluded | — |
| 092 | ファイルnull時に商品公開CSV登録画面へ遷移。ファイルnull分岐はNotBlank先行で純UI到達不能なため要実機 | TBD | — |
| 093 | 行数上限で商品公開CSV登録画面に遷移（前提MSG-003行数上限） | bound | C-009 |
| 094 | 母集合期待が出所未確認のプレースホルダ（前提MSG-004取込エラー） | excluded | — |
| 095 | 成功後に商品公開CSV登録画面に遷移（前提MSG-005成功） | bound | C-013 (shared) |
| 096 | 画面表示データでエラー表示されず継続（汎用スタブ・前提取込直後） | excluded | — |
| 097 | 取込完了ログ「商品公開CSV登録完了」と件数の出力。ログ観測手段が未整備で一意に確認できず要実機 | TBD | — |
| 098 | 画面表示データでエラー表示されず継続（汎用スタブ・前提エラー残存時） | excluded | — |
| 099 | GETクエリ許容値に基づき page_no と条件付き page_count を更新（session保存条件はee固有実装でExcel/pf正本なし・要仕様確定） | TBD | — |
| 100 | アップロード画面が開きフォーマット表と履歴が表示される（画面表示） | bound | C-001 (shared) |
| 101 | ファイル選択のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 102 | クエリ件数が許容リストのときだけセッション保存（session保存条件はee固有実装でExcel/pf正本なし・要仕様確定） | TBD | — |
| 103 | csv_product_status.twig は base_csv_upload.twig を継承する（Twig継承は観測不能・C-001被覆） | excluded | — |
| 104 | ファイル選択でカスタムラベルへファイル名表示（ee固有UI＝pf現行にラベル更新JSなし・Excel/pf正本なし） | excluded | — |
| 105 | 送信前の確認ダイアログの有無。Excel設計は確認モーダル表示を規定するが実装は未実装で設計と実装が食い違い要仕様確定 | TBD | — |

`func_scope_check` 判定: 親105/105会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝14件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| Excel設計と実装の乖離（設計は確認モーダル・実装は未実装） | -006,-105 | 2 | Excel『押下後、確認モーダルを表示』（AG92・L1-005）を規定するが、pf・ee両実装に確認モーダル部品が無い。母集合期待「送信前確認ダイアログはない」は実装値。設計・実装のどちらにも合わせられず要仕様確定（R1 M1） |
| ファイル未選択の画面エラー表示がpf/eeで食い違い | -019,-085 | 2 | 母集合はファイル未選択のNotBlankエラー表示を要求。pf現行は `getErrors(true)`（deep=true・pf:1576）で子フィールドのNotBlankを取得しフラッシュ表示する（L1-016）が、SUT=ee は `getErrors()`（deep=false・:135）で子フィールドエラーを取得せずフラッシュに載らない＝pf/ee食い違い。SUT=eeでの実表示はee実機で確定を要する（R1 M2／R3 M2） |
| 公開列更新・履歴INSERT・情報ログの一体要求（ログ観測未整備） | -049,-082 | 2 | 母集合期待は3成分（公開列更新・履歴INSERT・情報ログ）の一体要求（L1-012/014/019）。情報ログは観測手段未整備のため一体では一意判定できない。観測可能な更新・履歴は-083アンカーのC-011が担い、本2行はログ成分ゆえTBD（R1 M3） |
| session保存条件（ee固有実装・Excel/pf正本なし） | -003,-102,-099 | 3 | -003/-102「page_countは許容値のときだけsession保存」・-099「page_no/page_count更新」は ee `getCsvImportHistoryPaginationParams`（AbstractController:392・`in_array` gate）のee固有内部挙動。Excelはページング存在（D60等）は規定するがsession保存条件は規定せず、pfは固定100件でsession無し＝excel/pf正本が無く要仕様確定（R2 M3） |
| 複数エラー分岐のフラッシュ機構（一部純UI到達不能） | -089 | 1 | -089「フォーム検証エラー・ファイルnull・行数超過でHTTPフラッシュのみ」はファイルnull分岐がNotBlank先行で純UI到達不能を含み、3分岐一体では一意判定できず要実機（R2 M5） |
| エラー4分岐の一体要求 | -090 | 1 | -090「ヘッダ不備／データ無し／行検証／商品不存在でインポータのエラー結果をメッセージ展開」は4分岐一体要求で、C-005（必須）・C-010（データ無し）が個別に機構を示すが1行を4分岐で一意判定できず要実機（R2 M7） |
| MSG-002ファイルnull経路が純UI到達不能 | -092 | 1 | MSG-002（ファイルnull・`csv_invalid_format`:144）はimport_file required+NotBlankのためファイル未選択送信はフォーム不正分岐で終了し、file===null分岐へ到達しない＝純UIで到達不能。実際に出る挙動は要実機（R2 M1） |
| 廃止行のpf/ee食い違い | -009 | 1 | -009「onReadRowで何も更新せずfalse」はee実装のみ。pfはdel_flg=0の生SQLでUPDATEを実行し正反対＝pf/ee食い違いで単一正本が確定できず要仕様確定。Excel逐語は「変更不可」まで（L1-009）（R2 M4） |

（合計 2+2+2+3+1+1+1+1 = 14）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・5010境界・存在しない/空商品ID・支店0/1/2・データ無し） | fixture manifest（D5型）未整備＝要実機（SEED-M0338-*） |
| -006/-105 確認モーダル最終仕様・-019/-085 ファイル未選択実表示文言・-009 廃止行の採用挙動・-003/-102/-099 session保存条件・-089/-090 複数分岐・-092 ファイルnull実挙動・-097 取込完了ログ | ee実機／仕様確定要（TBD） |
| L1-008（商品不存在）・L1-020（一時ファイル）・L1-021（選択検証）・L1-019（ログ） | 実挙動だが母集合に固有一意判定行が無い／観測未整備＝documentation-only |
| L1-解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |

### 9.3 excluded＝79件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承・画面静的注記（観測不能・C-001被覆）** | -004,-012,-103 | テンプレート継承・説明テーブルの静的性そのものは外部IFで判定不能。構成要素はC-001が同一操作で被覆済み |
| **【B15②/M4】ee固有UI（ファイル名ラベル＝excel/pf正本なし）** | -005,-104 | ファイル選択でカスタムラベルへファイル名表示はee base_csv_upload.twig固有のJSで、pf現行はラベル更新JSを持たずExcelも規定しない＝pf-fallback/excelどちらのオラクルにもできず試験不要 |
| **【B15②】内部ファイル処理注記（documentation-only）** | -007 | 一時ディレクトリ退避・削除試行（L1-020）は内部処理で単一の観測可能挙動でなく観測手段未整備 |
| **【B7/B15】汎用検索スタブ（非該当観点）** | -020〜-033 | 本機能は検索を行わず選択CSVをアップロード取込（観点テンプレ機械生成） |
| **【B15②】汎用「実行結果/出力内容が含まれる/一致」スタブ** | -034,-035,-036,-037,-048,-060,-062,-065,-066,-067,-068,-069,-070,-084,-101 | 一致基準（どの列がどの値か）を母集合行が持たず内容空虚 |
| **【B15②/④】汎用「登録内容/更新内容が追加/変更される・されない」スタブ（C-011/C-005/C-012で被覆・当機能は新規登録しない）** | -038,-039,-040,-042,-043,-044,-045,-046,-047,-050,-051,-052,-054,-055,-056,-057,-058,-059 | 対象レコード・具体値を母集合が指定せず内容空虚。取込成功の反映（C-011）・必須中断（C-005）・支店（C-012）で概念被覆済みの冗長スタブ |
| **【B15②/③】相関/DB相関スタブ（本機能に行バリデータ無し・相関検証が存在しない）** | -013,-014,-015,-016,-017,-018 | getRowValidators は空配列で相関検証が無く「相関バリデーションでエラー」の前提が汎用ノイズ |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）** | -011,-063,-071,-096,-098 | 「エラー表示されず継続」の観測対象が無い汎用スタブ |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。取込機能に該当なし |
| **【B15③】プレースホルダ/矛盾スタブ** | -001,-002,-061,-091,-094 | -001「出力失敗」（非該当）／-002 CSRF失敗の固有挙動が定義なし／-061/-091/-094 出所未確認プレースホルダ（前提MSG-004取込エラー・MSG-001フォーム不正等） |

## §10 特記事項（片側断定せず記録）

1. **ee実装済・SUT=ee**: 本機能はee(SUT)に専用Controller/handler/twig/定数が実在＝M03-34/36のようなee未実装ではない。ee=SUTの実挙動を試験し、オラクル帰属はexcel/pf-fallbackのみ（source_class純度・EE-source 0）。
2. **MSG割当（R2 M1・Controllerでfile:line確定）**: MSG-001=フォーム不正（:134）／MSG-002=ファイルnull（`csv_invalid_format`:144）／MSG-003=行数上限（`maxrecord`:150）／MSG-004=取込エラー（:168）／MSG-005=成功（`admin.register.complete`:174）。R1の誤割当（MSG-002=行数上限/003=成功/004・005=phantom）を全訂正。-093（MSG-003=行数上限）をC-009へ・-095（MSG-005=成功）をC-013へ・-092（MSG-002=ファイルnull・純UI到達不能）をTBD・-094（MSG-004・要ソース確認placeholder）をexcludedへ再分類。
3. **列数・列名・支店列はExcel規定＝excel源**: pf2列/ee3列（支店の商品公開ステータス追加＝Excel識別ID3・D75→L1-013）・列名（Excel識別ID2・D73→L1-003）。
4. **廃止行のpf/ee食い違い（R2 M4）**: Excel逐語は「2-廃止の変更はできません」（変更不可）まで（L1-009 excel）。実挙動は ee=`onReadRow`でfalse返却・更新せず成功扱い（handler:83）／pf=del_flg=0の生SQLでUPDATE実行（handler:142-164）で正反対＝単一正本で確定できず-009はTBD。L1-014から廃止mixinを除去。
5. **session保存条件はee固有（R2 M3）**: `getCsvImportHistoryPaginationParams`（AbstractController:392）はpage_countが許容値のときだけsession保存・page_no毎回保存。Excelはページング存在は規定するがsession保存条件を規定せず、pfは固定100件でsession無し＝excel/pf正本なしで-003/-102/-099はTBD。C-004は表示件数プルダウン表示とページ遷移（L1-006）の画面挙動のみをboundし内部sessionはboundしない。
6. **結果表示機構・成功文言のpf/ee相違**: pf `render()`（行エラーは`.text-danger`）／ee `redirect()`（PRG・フラッシュ）。成功文言pf「商品登録CSVファイルをアップロードしました。」／ee「登録が完了しました。」。L1-015/017は「画面へ戻りメッセージで成否」「成功メッセージの存在」のみを主張し機構/文言はpinしない。en記録は§5に分離。
7. **確認モーダルのExcel規定＝ee/pf未実装乖離（R1 M1）**: Excel「押下後、確認モーダルを表示」（AG92）を設計正本が規定するが、ee/pf両base_csv_upload.twigに確認モーダル部品が無い。設計側は落ち・実装側は設計に反するため-006/-105はTBD。L1-005はExcel設計規定を記録。
8. **ファイル未選択の画面エラーはpf/ee食い違い（R1 M2／R3 M2）**: pf現行は `getErrors(true)`（deep=true・pf:1576）で子フィールドNotBlankを取得しフラッシュ表示する（L1-016 pf-fallback・NotBlank en『This value should not be blank.』/ee override『No value found.』）が、SUT=ee は `getErrors()`（deep=false・:135）で子フィールドエラーを取得せずフラッシュに載らない。この deep=false は ee固有でありpfと正反対＝pf/ee食い違いのため、SUT=eeでのファイル未選択画面エラーは-019/-085 TBD（実表示は要実機）。
9. **-090/-089の複数分岐は一体boundしない（R2 M5/M7）**: -090（4分岐）・-089（3分岐・一部純UI到達不能）は1母集合行を複数エラー分岐で一意判定できずTBD。個別分岐（必須=C-005・データ無し=C-010・行数上限=C-009）は各候補で被覆。
10. **-008/-041は支店0/1反映＋許容外拒否を被覆（R2 M6）**: C-012は支店=1(公開)・0(非公開)反映と支店=2(許容外)の選択検証エラー拒否を3ファイルで検証し、母集合の真偽キャスト（0/1のみ受付）と許容外拒否の要求を満たす。
11. **B12/1実行1判定**: B12共有は完全重複・同一実行に限定（C-001←053/086/100・C-012←008/041・C-013←087/095）。異なる母集合要件の強制共有はしない（-089はC-013から分離）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound/TBD行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（22件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 003 | ページネーション | 期待「件数が許容リストのときだけセッション保存」（L1-006・session条件ee固有）。母集合ラベル「未認証」は誤り |
| 006 | 確認モーダル | 期待の観測対象は確認モーダル（Excel規定・ee未実装乖離・L1-005）。母集合ラベル「識別子」は誤り |
| 008 | 支店公開ステータス | 期待「支店の商品公開ステータス（0/1反映・許容外拒否）」（L1-013）。母集合ラベル「確認ダイアログ」は誤り |
| 009 | 廃止商品スキップ | 期待「onReadRowで何も更新せずfalse」（L1-009・pf/ee食い違い）。母集合ラベル「HTTPステータス」は誤り |
| 019 | ファイル必須 | 期待「フォーム NotBlank」（L1-016・画面表示はeeで不成立）。母集合ラベル「部分入力」は誤り |
| 041 | 支店公開ステータス | 期待「支店の商品公開ステータス（0/1反映・許容外拒否）」（L1-013）。母集合ラベル「登録内容」は誤り |
| 049 | 取込成功 | 期待「公開列更新・履歴INSERT・情報ログ」（L1-012・ログ一体でTBD）。母集合ラベル「実行結果」は誤り |
| 053 | 画面表示 | 期待「GET …/product/status/csv_upload」（L1-001）。母集合ラベル「更新内容」は誤り |
| 082 | 取込成功 | 期待「公開列更新・履歴INSERT・情報ログ」（L1-012・ログ一体でTBD）。母集合ラベル「初期行数」は誤り |
| 083 | 取込履歴の登録条件 | 期待「取込エラーなく完了したときだけ INSERT」（L1-014・成功時のみ登録の排他条件）。母集合ラベル「表示順」は誤り |
| 085 | ファイル必須 | 期待「フォーム NotBlank」（L1-016・画面表示はeeで不成立）。母集合ラベル「内部情報」は誤り |
| 087 | 画面遷移 | 期待「POST後アップロード画面へ戻る」（L1-015）。母集合ラベル「ロールバック」は誤り |
| 088 | ページネーション | 期待「履歴リストが選択したページサイズになる」（L1-006）。母集合ラベル「画面レイアウト」は誤り |
| 089 | メッセージ表示 | 期待「複数エラー分岐でフラッシュのみ」（L1-015・一部到達不能でTBD）。母集合ラベル「画面レイアウト」は誤り |
| 090 | 取込エラー表示 | 期待「4分岐でエラー結果をメッセージ展開」（L1-008・4分岐一体でTBD）。母集合ラベル「画面レイアウト」は誤り |
| 092 | メッセージ/画面遷移 | 期待「ファイルnull時に画面へ遷移」（MSG-002・純UI到達不能でTBD）。母集合ラベル「画面レイアウト」は誤り |
| 093 | メッセージ/画面遷移 | 期待「商品公開CSV登録画面に遷移」＋前提MSG-003行数上限（L1-010）。母集合ラベル「画面レイアウト」は誤り |
| 095 | 画面遷移 | 期待「商品公開CSV登録画面に遷移」＋前提MSG-005成功（L1-015）。母集合ラベル「一覧」は誤り |
| 097 | ログ出力 | 期待「取込完了ログと件数」（L1-019・要実機）。母集合ラベル「画面表示データ」は誤り |
| 099 | ページネーション | 期待「page_no/page_count更新」（L1-006・session条件ee固有）。母集合ラベル「画面表示データ」は誤り |
| 102 | ページネーション | 期待「件数が許容リストのときだけセッション保存」（L1-006・session条件ee固有）。母集合ラベル「非同期更新」は誤り |
| 105 | 確認モーダル | 期待の観測対象は確認モーダル（Excel規定・ee未実装乖離・L1-005）。母集合ラベル「データ正当性」は誤り |
