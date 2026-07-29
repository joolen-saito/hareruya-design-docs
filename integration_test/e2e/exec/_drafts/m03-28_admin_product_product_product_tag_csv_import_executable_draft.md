# 候補: m03-28 商品タグ更新CSV登録（取込/インポート） — 実行可能グレード候補（母集合105全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R6 Major1件是正版（2026-07-29）**（R3経路別・R4/R5原子化・R6 relabel是正の累積反映）。Major1（TBD母集合ID脱落）はemitter側修正済（TBD重複排除キーに母集合の元期待列を追加）。
> **R6 Major（母集合-010のrelabel是正）**: 母集合-010（all_it_cases.tsv:6898・観点=必須バリデーション）は前提「タグ IDを試験できる状態である」・操作「タグ IDを確認する」ともに**タグ ID未入力**を対象とするが、Excel（`0204:商品タグ更新CSVフォーマット` 識別ID2・HTML:4344）とpf実装（`ColumnDefinitions.php:122` setRequiredなし）で**商品タグ(ID)は任意**＝タグ未入力では必須エラーにならない。よって-010の期待「必須エラー表示」は実装と矛盾＝自己矛盾/非該当で**excluded**。商品ID必須検証を対象とする母集合行は存在しないため（-010を商品IDへ読み替えるのはrelabel違反）、初版のC-006（商品ID必須→breakAll）を廃し商品ID必須（L1-007）は documentation-only とした。会計 bound 13→12・excluded 79→80・候補 10→9。
> **実ソース基準**: pf現行＝`/home/y-saito/Developments/pf-eccube3/`（＋pf core `.../pf-eccube3/src/Eccube/`）、ee＝`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`（cross検証・DB正）。
> **R3 Major2（拒否経路の実メッセージを実装一致に是正）**: ヘッダ行が読み取れない場合のみ `format.header`「CSVのフォーマットが一致しません。」（CsvImporter:195-196）、列数不一致は `format.body`「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（BaseCsvImportHandler:58-60→addInvalidColumnCountError）。ヘッダ名が定義列に無い場合は `product.not_exists`（addColumnNotExistsError:72-73）。C-004を「ヘッダ行読めない→format.header」・C-005を「列数不一致→format.body」へ是正（初版の「ヘッダ名不一致→format.header」は誤り）。
> **R3 Major3（L1原子被覆／G7）**: 旧L1-006（商品ID必須＋数値形式＋タグ任意を1claim）を **商品ID必須（L1-007）へ原子化**し、数値形式（L1-021）・タグ任意（L1-020）を別 documentation-only claim へ分離。format系も L1-005（ヘッダ行）／L1-006（列数）へ経路別に原子化。一時ファイルの根拠を `CsvImporter.php:76-95,114-122,131-164` へ訂正。全 source をフルパス:line 表記にし Gate A G7 WARN を解消。（※R3では商品ID必須を候補C-006にbindしたが、R6で母集合アンカー不在と判明しC-006廃止・L1-007はdocumentation-onlyへ）
> **1 claim 1 source（R2 Major1継続）**: 各L1のsourceをPF現行の単一ソースへ限定。EEのDBスキーマ差（tag_id列・base_info_id）はオラクルclaimに混ぜず§3/§9.2 documentation-only。成功メッセージは実PF値「商品登録CSVファイルをアップロードしました。」（pf core message.ja.yml:133）でbound。maxrow文言は不確定でTBD。
> **本機能は更新系（商品タグ全置換）**。1データ行ごとに既存タグを DELETE で全削除→CSV列挙タグを foreach INSERT（差分でなく全置換）。各列検証失敗も商品ID不存在も breakAll（skipRow経路なし）。DB検証は総件数でなくスナップショット比較（B9）。
> B1-B15 自己監査済み（実ソース再確認・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **pf現行実装（回帰先・source_class=pf-fallback／主一次資料＝実ソース）**:
  - ルート: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:97-101`（GET/POST とも `/{admin_route}/product/product_tag_update_csv_upload`）
  - コントローラ: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（GET `:585-591`→render／POST `:602-646`→render〔redirectなし〕／`render:1857-1866`〔履歴 createDate 降順 最新100件・ページネーションなし〕／maxrow `:625-628`／成功 `addSuccess('admin.product.csv_import.save.complete'):639`／履歴INSERT `:642`／`CSV_IMPORT_MAX`=5010:391）
  - インポータ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php`（import＋一時ファイル `:76-95`／deleteTempFile `:114-122`／createCsvImportService file->move `:131-164`／validateBeforeImport `:190-213`〔ヘッダ行読めない→addHeaderFormatError `:195-196`／データ空→addNoDataError `:205-206`〕）
  - 共通ハンドラ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52-84`（列数不一致→addInvalidColumnCountError `:58-60`／列名不在→addColumnNotExistsError `:72-73`／各列 validate `:79`）
  - 手継: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php`（商品ID `setRequired(true):49`・タグ任意 `:50`・onValidateRow `:75-89`・validateProductExists `:133-151,157-178`→`breakAll`・全削除+再挿入 `:185-263`・成功時支店連携 `:54-68`）
  - 列定義: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:61-63`(productId・createUnsignedNumericColumn:837-841)・`:122-126`(productTagList＝setRequiredなし・TagIdValidator)
  - メッセージストア: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php`（header:75/invalidColumnCount:87/columnNotExists:111/require:124/productNotExists:204）
  - テンプレート: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_tag_update.twig:1`（`Product/base_csv_upload.twig` 継承）
  - メッセージ本文: pf plugin `.../HareruyaEc/Resource/locale/message.ja.yml`（maxrecord:1097／format.header:1100／format.body:1101／data.empty:1112／data.require:1113／product.not_exists:1144）／**pf core** `pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133`（成功「商品登録CSVファイルをアップロードしました。」）
- **ee現行実装（DB関連はee正・cross検証／source_classにしない）**: `ec-cube-enterprise/src/Eccube/` — `Repository/ProductRepository.php:1833-1912`(replaceProductTags 列 tag_id・**base_info_id=1**)・`Entity/ProductTag.php:30`(TenantTrait)・`Entity/Product.php:945-960`(getTags Tag.sort_no昇順)。
- **Excel基本設計**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` sheet-15。**識別ID2 商品タグ(ID)〔必須欄空＝任意・カンマ区切りで複数指定可能〕**。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-28-…-001..105`（105件・欠番0・重複0）。
- **source_class は pf-fallback のみ**（Gate G2充足。ee実ソースはcross検証・DB検証実装詳細のみ）。

---

## §1 L1原子オラクル表

全21claim（R3で経路別・原子化）。**source_class列は pf-fallback のみ**。**LS=0（全件）**: pf core に en 資源が存在せず（`pf-eccube3/src/Eccube/Resource/locale/` は message.ja.yml のみ）、pf plugin の CSVメッセージも ja 固定＝pf現行メッセージは全てja固定でLS=0（キー別に実確認・§5）。

**被覆状況（正直分類）**: bound候補が検証するのは **L1-001〜003,005,006,008〜012,014**（12claim）。**L1-004（maxrow文言）・L1-013（redirect）・L1-015（pagination）・L1-016（fileラベルJS）・L1-017（一時ファイル）・L1-018（ログ）はTBD**、**L1-007（商品ID必須）・L1-019（重複タグ）・L1-020（タグ任意）・L1-021（商品ID数値形式）は documentation-only**（母集合に一意判定できる固有要求行が無い。L1-007は母集合-010がタグID対象で実装のタグ任意と矛盾のためexcluded・商品IDへのrelabel禁止＝R6 Major是正）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0328-001 | http_entry | GET /{admin_route}/product/product_tag_update_csv_upload（bind admin_product_tag_update_csv_import）を開くとアップロード画面が render され、CSVファイル選択・「CSVファイルのアップロード」ボタン・フォーマット説明表（商品ID〔必須〕・タグ(ID)〔カンマ区切りで複数指定可能〕）・雛形ダウンロードリンク・取込履歴テーブルを表示する。取込履歴は createDate 降順の最新 CSV_IMPORT_HISTORY_LIMIT=100件のみで101件目以降は表示されない | $app->get('…/product/product_tag_update_csv_upload',…csvProductTagUpdate)->bind('admin_product_tag_update_csv_import') / findBy([…],['createDate'=>'DESC'],CSV_IMPORT_HISTORY_LIMIT) | pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:97 / pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:585-591,1857-1866 | pf-fallback | 0 |
| L1-M0328-002 | display_field | csv_product_tag_update.twig は共通テンプレート Product/base_csv_upload.twig を継承し、CSVファイル選択（file入力 accept text/csv,text/tsv）・「CSVファイルのアップロード」submitボタン・_token（CSRF）・フォーマット説明表（項目名/説明・商品IDは必須表記）・雛形ダウンロード・下部に取込履歴（ファイル名・日時 Y-m-d H:i・作業者）を表示する | extends 'Product/base_csv_upload.twig' / button upload-button type=submit CSVファイルのアップロード / include 'Block/csv_import_history.twig' | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_tag_update.twig:1 / pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:16-75 | pf-fallback | 0 |
| L1-M0328-003 | display_field | アップロードボタン押下でそのまま POST 送信し、送信前の確認ダイアログ（モーダル）を表示しない（twigにconfirm記述なし・JSはspinnerのみ） | （base_csv_upload.twig・card-csvimport.js に confirm ダイアログ記述なし） | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:8-11 | pf-fallback | 0 |
| L1-M0328-004 | message | 改行数（countCsvRows）が定数 CSV_IMPORT_MAX（5010）以上のとき翻訳キー admin.csv.error.upload.maxrecord を sprintf(…,5010) してエラー表示し取込を中止する（DB書込みなし・render再描画）。ただし当該キーの解決文言は pf plugin locale が %d 表記（%d 行を超えるCSVファイルは登録できません。）であり、画面表示の実文言は実機確認まで確定不能（TBD） | if(countCsvRows(file)>=CSV_IMPORT_MAX) addError(sprintf(trans('admin.csv.error.upload.maxrecord'),CSV_IMPORT_MAX)) / maxrecord: %d 行を超えるCSVファイルは登録できません。 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:625-628 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1097 | pf-fallback | 0 |
| L1-M0328-005 | message | CsvImporter.validateBeforeImport で1行目のヘッダ行が読み取れない（setHeaderRowNumber(0) が false）とき addHeaderFormatError で admin.csv.error.format.header＝「CSVのフォーマットが一致しません。」をエラー配列で返し取込を中止する（DB書込みなし・render再描画） | if(!importService->setHeaderRowNumber(0)) messageStore->addHeaderFormatError() / header: CSVのフォーマットが一致しません。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190-199 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:75-78 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1100 | pf-fallback | 0 |
| L1-M0328-006 | message | BaseCsvImportHandler.onValidateRow でデータ行の列数が列定義数（2）と一致しないとき addInvalidColumnCountError で admin.csv.error.format.body＝「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（%d＝該当行番号）を積み breakAll で取込を中止する（DB書込みなし） | if(count(row)!==count(columns)) addInvalidColumnCountError(row->getRowNumber()); breakAll() / body: CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:57-64 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:87-90 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1101 | pf-fallback | 0 |
| L1-M0328-007 | validation | onBeforeImport で商品ID列を setRequired(true) で生成する。列検証で商品IDが未入力（空）の行は addRequireError で admin.csv.error.data.require＝「商品ID は必須項目です。 %d 行目のデータを確認してください。」を積み breakAll（全体中断）しコミットされない | productIdColumn=ColumnDefinitions::productId()->setRequired(true) / addRequireError / require: %s は必須項目です。 %d 行目のデータを確認してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:49 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:79 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:124-127 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1113 | pf-fallback | 0 |
| L1-M0328-008 | validation | onValidateRow の追加処理 validateProductExists がネイティブSQL（SELECT p.product_id FROM dtb_product p WHERE p.product_id=:productId AND p.del_flg=:delFlg〔DISABLED〕）で商品の実在を確認し、存在しない（del_flg論理削除済み含む）とき addProductNotExistsError で admin.csv.error.product.not_exists＝「%d 行目の 商品ID ではデータを取得できません。」を積み breakAll で以降行を処理しない | if(!isProductExists(productId)) addProductNotExistsError(…); breakAll() / WHERE p.product_id=:productId AND p.del_flg=:delFlg / not_exists: %d 行目の %s ではデータを取得できません。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:75-89,133-151,157-178 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:204-207 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1144 | pf-fallback | 0 |
| L1-M0328-009 | data_behavior | onReadRow が updateProductTag を呼び、deleteAllProductTags（DELETE FROM dtb_product_tag WHERE product_id=?）で当該商品の既存タグを全削除後、insertProductTags が CSV列挙タグIDを foreach で1件ずつ INSERT（列 product_id, tag, creator_id, create_date）する。差分でなく全削除後の再挿入で当該商品のタグを CSV 内容へ置換する | deleteAllProductTags(productId); insertProductTags(…) / DELETE FROM dtb_product_tag WHERE product_id=? / INSERT INTO dtb_product_tag(product_id,tag,creator_id,create_date) foreach(tagIds as tagId) | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:97-100,185-197,204-220,229-263 | pf-fallback | 0 |
| L1-M0328-010 | history | 取込結果にエラーが無いとき（else経路）だけ insertCsvImportHistory で dtb_csv_import_history へ種別（PRODUCT_TAG_IMPORT_CSV_ID）・クライアント側オリジナルファイル名・利用者IDを INSERT する。エラーがあれば（hasError）履歴INSERTせず異常終了ログのみで履歴行は増えない | if(result->hasError()) log_info('商品タグ更新 異常終了'); else addSuccess(…); csv_import_history->insertCsvImportHistory(app,csvImportType,file->getClientOriginalName()) | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:636-642 | pf-fallback | 0 |
| L1-M0328-011 | rollback | フォーム不正・ファイル未選択（null）・行数超過はインポータ実行前に画面へエラー表示のみでDBを変更しない。インポータ内で結果にエラーがあれば成功フラッシュ・履歴INSERTを行わずタグ置換もコミットされない。対象商品のタグ集合は不変・更新対象外商品も不変・履歴行数不変となる | if(!isFormValid(app,form)) … return render(…,[]) / if(result->hasError()) log_info('…異常終了')（成功フラッシュ・履歴INSERTしない） | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:613-618,625-628,636-645 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:75-89 | pf-fallback | 0 |
| L1-M0328-012 | data_integrity | フォーマット説明表は render 時に渡す静的 headers 配列であり取込実行後に自動再読込せず CSV のプレビューも保持しない。取込結果の反映確認は別画面（商品編集）へ委ねる | for key,value in headers …value|nl2br（静的headers）/ render(twig,['headers'=>headers,'importHistories'=>…,'errors'=>errors]) | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:44-72 | pf-fallback | 0 |
| L1-M0328-013 | http_flow | PF現行は POST（アップロード送信）後、成功・失敗いずれも render(...) で HTTP200 の同一アップロード画面を再描画する（redirectしない）。母集合が期待する『常にGET…へリダイレクト』はPF現行と一致せず、刷新後にどちらの遷移方式を採るかは確定していない（TBD） | return this->render(app,form,headers,productTagUpdateTwig,result->getErrors(),…)（pf・redirectなし） | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:602-646 | pf-fallback | 0 |
| L1-M0328-014 | message | 取込結果にエラーが無いとき addSuccess('admin.product.csv_import.save.complete') で成功フラッシュを表示する。当該キーは pf core message.ja.yml:133 で「商品登録CSVファイルをアップロードしました。」に解決される（PF現行の確定文言・ja固定でLS=0）。あわせて件数付きの完了ログを出力し取込履歴を INSERT する | app->addSuccess('admin.product.csv_import.save.complete','admin') / admin.product.csv_import.save.complete: 商品登録CSVファイルをアップロードしました。 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:639-642 / pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133 | pf-fallback | 0 |
| L1-M0328-015 | session | PF現行の取込履歴は render 内で createDate 降順の最新100件を findBy するのみで、表示件数（page_count）やページ番号（page_no）をセッションへ保存する仕組みを持たない。母集合が期待する『件数を許容リストのときだけセッション保存・ページ番号もセッション保存』はPF現行に存在せず刷新後の件数切替UIは確定していない（TBD） | findBy([…],['createDate'=>'DESC'],self::CSV_IMPORT_HISTORY_LIMIT)（page_count/page_no無し） | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1857-1866,392 | pf-fallback | 0 |
| L1-M0328-016 | display_field | PF現行の base_csv_upload.twig はファイル入力を素の form_widget（accept 指定のみ）＋spinner で表示し、選択ファイル名をカスタムラベルへ表示する装飾やロード表示切替を持たない。母集合が期待する『ファイル選択でカスタムラベルへファイル名表示』はPF現行に存在せず刷新後のファイル選択UIは確定していない（TBD） | form_widget(form.import_file,{'attr':{'accept':'text/csv,text/tsv'}})（plain入力） | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:16-30 | pf-fallback | 0 |
| L1-M0328-017 | file_handling | CsvImporter.import はアップロードファイルを createTempFileName で命名し createCsvImportService 内で csv_temp_realdir へ move（退避）して読み込み、finally の deleteTempFile で一時ファイルを削除試行する。ファイル保存先・削除タイミングを直接観測する手段が未整備で外部インターフェース（画面/履歴）では検知できず一意判定不能（TBD・要実機） | import(file){tempFileName=createTempFileName(file);try{createCsvImportService(file,tempFileName)…}finally{deleteTempFile(tempFileName)}} / file->move(csv_temp_realdir,tempFileName) | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:76-95,114-122,131-164 | pf-fallback | 0 |
| L1-M0328-018 | log | 取込直後に「商品タグ更新CSV登録開始」、成功時に件数付き「商品タグ更新」、結果にエラーが残ったとき「商品タグ更新 異常終了」を情報ログに出力する。ログを直接観測する手段が未整備で外部インターフェースでは一意固定できない（TBD・要実機） | log_info('商品タグ更新CSV登録開始') / log_info('商品タグ更新',['count'=>…]) / log_info('商品タグ更新 異常終了') | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:631,637,640 | pf-fallback | 0 |
| L1-M0328-019 | edge | 同一行で同一タグIDを重複記載した場合、foreach で1件ずつ INSERT するため dtb_product_tag に複数行が並び得る（アプリ側で重複除去しない）。母集合に一意判定できる固有要求行が無い（documentation-only） | foreach(tagIds as tagId) executeUpdate(sql,[productId,tagId,…])（重複除去なし） | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:251-262 | pf-fallback | 0 |
| L1-M0328-020 | validation | タグ(ID)列は onBeforeImport で setRequired されず任意である。createMultipleUnsignedNumericColumn により NumericValidator（各カンマ区切りトークンが0以上整数）と TagIdValidator（dtb_tag 実在）を持つ。タグ列が空でも必須違反にならず取込が成立する（documentation-only＝タグ空の任意性を一意判定する固有母集合行が無い） | productTagListColumn=ColumnDefinitions::productTagList(em)（setRequiredなし）/ createMultipleUnsignedNumericColumn(…)->addValidator(new TagIdValidator(em)) | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:50 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:122-126,879-884 | pf-fallback | 0 |
| L1-M0328-021 | validation | 商品ID列は createUnsignedNumericColumn により NumericValidator を持ち、符号なし整数以外（非数値・負値）の行は addNumericError（admin.csv.error.product.over_zero＝「%d 行目の 商品ID は0以上の数値を設定してください。」）等で breakAll する（documentation-only＝数値形式違反を一意判定する固有母集合行が無い） | createUnsignedNumericColumn(name,label)->addValidator(new NumericValidator()) / over_zero: %d 行目の %s は0以上の数値を設定してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:61-63,837-841 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:177-179 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1146 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

固定値は入力の再現手段で期待値の正にしない。**後始末（R1 Major10）**: 正常置換CSVを実送信しDBを変更するケース（C-002・C-003・C-008・C-009）は .down.sql で対象商品のタグ集合と `dtb_csv_import_history` をSEED状態へ復元（冪等性）。中断/早期リジェクト系はDB不変で復元不要。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提 | 管理者アカウント（既存の管理画面ログインSEED） | 不要 |
| SEED-M0328-TARGETS | 取込の前提（対象商品・タグマスタ・更新対象外商品・センチネル商品） | 既存商品（del_flg未削除・事前に別タグ集合が紐付く対象商品）＋タグマスタ実在ID＋取込対象に含めない別商品（更新対象外の不変確認用）＋**センチネル商品**（正常な実在商品IDで事前に既知タグ集合が紐付く。中断系CSVの2行目の正常行として使い、breakAllなら未処理でタグ不変・skipRowなら処理されタグ更新される差を判定する） | 参照（対象商品はC-002/003/008/009で変更・下記で復元） |
| SEED-M0328-HISTORY101 | 取込履歴「最新100件・降順」検証 | `dtb_csv_import_history` に商品タグ更新CSV種別の履歴を**101件以上**、各行の取込日時を識別可能に相違させて投入 | 不要（参照） |
| SEED-M0328-VALIDREPLACE | 正常置換（タグ全置換）の主SEED | 既存商品ID＋実在タグID複数（カンマ区切り）の1データ行の正常CSVファイル | 置換タグ集合・履歴を復元 |
| SEED-M0328-NOHEADER | ヘッダ行読めない（format.header）検証 | 1行目のヘッダ行が読み取れない（ヘッダ行が無い/空の）CSVファイル | 不要（拒否・書込みなし） |
| SEED-M0328-BADCOLUMN | 列数不一致→breakAll一意判定（format.body） | 2データ行CSVファイル。1行目＝列数が2でない（列過不足）行、2行目＝正常センチネル行（実在センチネル商品ID＋実在タグ） | 不要（中断・書込みなし） |
| SEED-M0328-BADPRODUCT | 存在検証（商品ID不存在/削除済→breakAll）一意判定 | 2データ行CSVファイル。1行目＝存在しない（またはdel_flg論理削除済みの）商品ID＋実在タグ、2行目＝正常センチネル行（実在センチネル商品ID＋実在タグ） | 不要（中断・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報・pf現行＋Excel sheet-15）

取込CSVは**2列のみ**で商品タグの紐付けを全置換する。

| 識別ID | 列（Excel sheet-15 / pf ColumnDefinitions） | 必須 | 内容・扱い |
|---|---|---|---|
| 1 | 商品ID（数値・整数） | **必須**（handler `setRequired(true)`） | `dtb_product.id`（del_flg未削除）を検索キーに実在チェック。不存在なら breakAll。数値以外は breakAll（L1-021）。`ColumnDefinitions.php:61-63` |
| 2 | 商品タグ(ID)（文字型・最大8） | **任意**（Excel必須欄空・setRequiredなし） | カンマ区切りで複数指定可。各トークンは0以上整数（TagIdValidator）。実在集合で `dtb_product_tag` を全削除後に再挿入。空でも必須違反にならない（L1-020）。`ColumnDefinitions.php:122-126` |

**DBスキーマ差（documentation-only・ee正）**: pf現行のネイティブ INSERT は列 `tag`。EE（DB正）は列 `tag_id`・`base_info_id`（not-null FK・replaceProductTags は固定値1）を持つ（ee ProductRepository.php:1897-1905・TenantTrait.php:25）。母集合-100「base_info_id 列は存在しない」はee現行実装と逆＝誤り。base_info_id=1 は成功系C-003のDB検証で確認（オラクルclaimには混ぜない）。

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 10候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。テストIDは `E2E-M0328C-NNN`。
- **拒否経路は各単一入力・単一判定（R2 Major4／R3 Major2実装一致）**: ヘッダ行読めない(C-004→format.header)・列数不一致(C-005→format.body)・商品ID不存在(C-007→product.not_exists)・フォーム不正/null(C-010)を別ケースに分離。maxrowは表示文言不確定でTBD。商品ID必須(data.require)は母集合アンカー不在でdocumentation-only（§10-9）。
- **DB検証（B9・スナップショット比較）**: 総件数でなく対象商品ID・更新対象外商品IDで `dtb_product_tag` を比較し、対象＝置換後集合一致（ee: base_info_id=1・creator_id）、対象外＝不変、`dtb_csv_import_history`＝成功時のみ+1。
- 操作手順は純UI操作。内部判定は手順に書かず列12へ。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-001	IT-25	画面表示	P1	GETでアップロード画面が表示され取込履歴が最新100件・降順で表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0328-HISTORY101	—	1. ナビ「商品管理」→「商品CSV管理」→「商品タグ更新CSVアップロード」またはブックマークから GET /%eccube_admin_route%/product/product_tag_update_csv_upload を開く 2. CSVファイル選択・「CSVファイルのアップロード」ボタン・フォーマット説明表・雛形ダウンロード・取込履歴テーブルが表示されることを確認 3. 取込履歴が取込日時の新しい順（降順）に100件だけ表示され101件目（最も古い履歴）が表示されないことを確認	アップロード画面が表示され、CSVファイル選択・「CSVファイルのアップロード」ボタン・フォーマット説明表（項目名: 商品ID〔必須〕・タグ(ID)〔カンマ区切りで複数指定可能〕）・雛形ダウンロードリンク・取込履歴テーブル（ファイル名・日時・作業者）が表示される。取込履歴は取込日時の新しい順（降順）に最新100件だけ表示され、101件目以降の古い履歴は表示されない [L1:L1-M0328-001,L1-M0328-002; fixture:SEED-M0328-HISTORY101@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-002	IT-20	モーダル	P2	「CSVファイルのアップロード」押下時に送信前確認ダイアログは表示されない	ログイン済／SEED-M0328-TARGETS／SEED-M0328-VALIDREPLACE	正常置換CSVファイル	1. ファイルを選択し「CSVファイルのアップロード」ボタンを押下する 2. 押下時に送信前の確認ダイアログ（モーダル）が表示されずそのまま送信されることを確認	「CSVファイルのアップロード」ボタン押下時に送信前の確認ダイアログ（モーダル）は表示されずそのまま送信される [L1:L1-M0328-003; fixture:SEED-M0328-VALIDREPLACE@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-003	IT-26	取込成功	P1	正常CSVで対象商品のタグが全置換され成功メッセージ・履歴新行・タグ集合反映を確認する	ログイン済／SEED-M0328-TARGETS／SEED-M0328-VALIDREPLACE	既存商品ID＋実在タグID複数（カンマ区切り）の1データ行CSV（対象商品は事前に別タグ集合が紐付いている）	1. ファイルを選択し「CSVファイルのアップロード」を押下する 2. 画面に成功メッセージ「商品登録CSVファイルをアップロードしました。」が表示されエラー表示が無いことを確認 3. アップロード画面下部の取込履歴テーブルに新しい行(ファイル名・日時・作業者)が1件増えたことを確認 4. 対象商品の商品編集画面を再表示し、事前に紐付いていたタグが無くなりCSVに列挙したタグID集合が紐付いていること（集合一致）を確認	正常取込時は当該商品の既存タグが全削除されCSV列挙タグID集合で置換され、成功メッセージ「商品登録CSVファイルをアップロードしました。」が管理画面上部に表示されエラーは出ない。取込履歴テーブルに新規1行が増え、対象商品を商品編集画面で再表示するとタグ集合がCSV列挙タグID集合と一致する ／ 自動検証(内部・DB): db.ts で取込前後の dtb_product_tag を対象商品IDで比較し事前タグ行が消えCSV列挙タグIDの行のみが存在（各行 creator_id=実行者・base_info_id=1〔ee正のテナント列〕）すること、更新対象外の別商品のタグ集合が不変であること、dtb_csv_import_history が該当種別で1行増え file_name がアップロード名と一致することを確認 [L1:L1-M0328-009,L1-M0328-010,L1-M0328-014; fixture:SEED-M0328-VALIDREPLACE@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-004	IT-17	フォーマット不一致	P1	ヘッダ行が読み取れないCSVはフォーマット不一致で取込中止・DB不変	ログイン済／SEED-M0328-TARGETS／SEED-M0328-NOHEADER	1行目のヘッダ行が読み取れない（ヘッダ行が無い/空の）CSVファイル	1. ヘッダ行が読み取れないCSVを選択し「CSVファイルのアップロード」を押下する 2. 画面にフォーマット不一致のエラーが表示されることを確認	1行目のヘッダ行が読み取れないCSVはインポータのヘッダ検証で弾かれ「CSVのフォーマットが一致しません。」が画面にエラー表示され取込は行われずアップロード画面に留まる ／ 自動検証(内部・DB): db.ts で dtb_product_tag（対象・対象外の各商品）と dtb_csv_import_history が取込前後で行数・内容とも不変であることを確認 [L1:L1-M0328-005,L1-M0328-011; fixture:SEED-M0328-NOHEADER@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-005	IT-22	列数バリデーション	P1	列数不一致の行で全体中断し後続の正常行も処理されない（breakAll）	ログイン済／SEED-M0328-TARGETS／SEED-M0328-BADCOLUMN	2データ行CSV。1行目＝列数が2でない（列過不足）行、2行目＝正常センチネル行（実在するセンチネル商品ID＋実在タグ・センチネル商品は事前に別タグ集合が紐付く）	1. 2行CSVを選択し「CSVファイルのアップロード」を押下する 2. 画面にフォーマット不一致のエラーが表示されることを確認 3. 2行目のセンチネル商品を商品編集画面で再表示しタグ集合が変更されていないことを確認	1行目の列数が列定義数（2）と一致しないため行検証で「CSVのフォーマットが一致しません。 該当行のデータを確認してください。」を表示し全体中断（breakAll）する。実装はbreakAllのため後続の2行目（正常センチネル行）は処理されずセンチネル商品のタグは変更されない（もし行スキップ〔skipRow〕なら中断フラグが立たず取込が成功扱いとなり2行目のタグ更新がコミットされてセンチネル商品のタグが変わるが、breakAllは以降行を打ち切りロールバックするため変わらない＝この差でbreakAllとskipRowを一意判定）。取込は行われずアップロード画面に留まる ／ 自動検証(内部・DB): db.ts で2行目センチネル商品のタグ集合が事前と不変であること（breakAllで未処理＝skipRowなら更新されるはずの差）、1行目対象商品と更新対象外商品のタグも不変、dtb_csv_import_history が不変であることを確認 [L1:L1-M0328-006,L1-M0328-011; fixture:SEED-M0328-BADCOLUMN@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-007	IT-22	存在検証	P1	商品ID不存在の行で全体中断し後続の正常行も処理されない（breakAll）	ログイン済／SEED-M0328-TARGETS／SEED-M0328-BADPRODUCT	2データ行CSV。1行目＝存在しない（またはdel_flgで論理削除済みの）商品ID＋実在タグ、2行目＝正常センチネル行（実在するセンチネル商品ID＋実在タグ・センチネル商品は事前に別タグ集合が紐付く）	1. 2行CSVを選択し「CSVファイルのアップロード」を押下する 2. 画面に商品不存在エラーが表示され成功メッセージが出ず履歴が増えないことを確認 3. 2行目のセンチネル商品を商品編集画面で再表示しタグ集合が変更されていないことを確認	1行目の商品実在チェック（dtb_product を del_flg 未削除で照会）で見つからず「該当行の 商品ID ではデータを取得できません。」を表示し全体中断（breakAll）する。実装はbreakAllのため後続の2行目（正常センチネル行）は処理されずセンチネル商品のタグは変更されない（もし行スキップ〔skipRow〕なら中断フラグが立たず取込が成功扱いとなり2行目のタグ更新がコミットされてセンチネル商品のタグが変わるが、breakAllは以降行を打ち切りロールバックするため変わらない＝この差でbreakAllとskipRowを一意判定）。成功メッセージは出ず取込履歴に新行が増えずタグ置換もされない ／ 自動検証(内部・DB): db.ts で2行目センチネル商品のタグ集合が事前と不変であること（breakAllで未処理＝skipRowなら更新されるはずの差）、1行目対象商品と更新対象外商品のタグも不変、dtb_csv_import_history が不変であることを確認 [L1:L1-M0328-008,L1-M0328-011; fixture:SEED-M0328-BADPRODUCT@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-008	IT-12	データ整合性	P1	フォーマット説明表は静的でプレビューを保持せず反映は別画面で確認する	ログイン済／SEED-M0328-TARGETS／SEED-M0328-VALIDREPLACE	正常置換CSVファイル	1. 正常CSVを取込む 2. アップロード画面のフォーマット説明表が取込後に自動再読込されずCSV内容のプレビューも表示されないことを確認 3. 取込内容の反映は別画面（対象商品の商品編集画面）を再表示して確認できることを確認	フォーマット説明表は静的でありCSVのプレビューを保持せず取込実行後に自動再読込されない。取込結果の反映は別画面（商品編集画面）を再表示して確認する [L1:L1-M0328-012; fixture:SEED-M0328-VALIDREPLACE@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-009	IT-12	履歴条件	P1	取込履歴はエラーなく完了した成功時のみ1件増える	ログイン済／SEED-M0328-TARGETS／SEED-M0328-VALIDREPLACE／SEED-M0328-BADPRODUCT	正常CSV（正常置換）とエラーCSV（商品ID不存在）の2ファイル	1. 正常CSVを取込みアップロード画面下部の取込履歴テーブルに新行が1件増えることを確認 2. エラーCSVを取込み取込履歴テーブルに新行が増えないことを確認	取込がエラーなく完了したときだけ画面下部の取込履歴テーブルに新行が1件増え、エラーを含む取込では取込履歴テーブルに新行が増えない [L1:L1-M0328-010; fixture:SEED-M0328-VALIDREPLACE@TBD-D5,SEED-M0328-BADPRODUCT@TBD-D5]				
m03-28_admin_product_product_product_tag_csv_import	E2E-M0328C-010	IT-25	ロールバック	P1	ファイル未選択（フォーム不正）の送信は取込前に弾かれDBは不変	ログイン済／SEED-M0328-TARGETS	ファイルを選択せずに送信（フォーム不正・null）	1. ファイルを選択せずに「CSVファイルのアップロード」を押下する 2. 画面にファイル未選択のエラーが表示されることを確認	ファイルを選択せずに送信するとフォーム検証で弾かれ画面にエラーが表示され取込に入らず、対象商品・更新対象外商品のタグ紐付けおよび取込履歴は変更されない ／ 自動検証(内部・DB): db.ts で dtb_product_tag（対象・対象外の各商品）と dtb_csv_import_history が取込前後で不変であることを確認 [L1:L1-M0328-011,L1-M0328-005; fixture:SEED-M0328-TARGETS@TBD-D5]				
```

---

## §5 ja/en locale対応表（LS=0の実確認）

- **初版の『ee messages.*.yaml不在→全LS=0』は事実誤認**（是正済）。ただし**現行踏襲の正はpf現行**であり、pf現行メッセージのLSは以下のとおりキー別に実確認した（全てen資源なし＝LS=0）。
- 成功 `admin.product.csv_import.save.complete`（L1-014）: ja「商品登録CSVファイルをアップロードしました。」（pf core message.ja.yml:133）。**pf core に message.en.yml が存在しない**＝en無し＝LS=0。
- ヘッダ行 `format.header`（L1-005）: ja「CSVのフォーマットが一致しません。」（pf plugin message.ja.yml:1100）／en無し＝LS=0。
- 列数 `format.body`（L1-006）: ja「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（:1101）／en無し＝LS=0。
- 必須 `data.require`（L1-007）: ja「%s は必須項目です。 %d 行目のデータを確認してください。」（:1113）／en無し＝LS=0。
- 商品不存在 `product.not_exists`（L1-008）: ja「%d 行目の %s ではデータを取得できません。」（:1144）／en無し＝LS=0。
- maxrow `maxrecord`（L1-004）: ja「%d 行を超えるCSVファイルは登録できません。」（:1097）／en無し＝LS=0（かつ文言解決不確定で-092はTBD）。
- **参考（EE側・en有り・別キーでpf現行と非一致）**: ee `admin.register.complete`=en「Registration completed.」・`admin.common.csv_invalid_format`=en「Unmatched CSV format」（ee messages.en.yaml:1676,1810）。EEは成功キー/フォーマットキーがpf現行と異なるため、刷新後にどのキー体系を採るか（enが付くか）はD6決裁事項でありpf現行bound claimのLSには反映しない。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: pf現行アップロード画面（`csv_product_tag_update.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET/POST /%eccube_admin_route%/product/product_tag_update_csv_upload`）を再利用。期待値はL1解決器経由。
- 取込結果は成功メッセージ/errors DOM＋取込履歴テーブルDOMを目視（主）。取込効果は対象商品を商品編集画面で再表示しタグ集合を確認。
- DB検証（B9・スナップショット）: db.ts で取込前後の `dtb_product_tag`（対象商品ID・更新対象外商品ID）と `dtb_csv_import_history` を比較（総件数比較のみに依存しない）。
- **後始末**: 正常CSVを送信するC-002/C-003/C-008/C-009は .down.sql で復元。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は M0成果物として未実装。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-008,C-009 | Playwright（GUI） | 画面（DOM・履歴テーブル・商品編集再表示） | 画面表示（最新100件降順含む）・確認ダイアログなし・静的テーブル・履歴条件。C-002/C-008/C-009は正常CSV送信のため後始末で復元 |
| C-003 | Playwright＋DB確認 | 画面＋DB（スナップショット比較） | 正常取込＝タグ集合置換（画面は集合・base_info_id/更新対象外はDB）・成功メッセージ・履歴+1。後始末で復元 |
| C-004,C-005,C-007,C-010 | Playwright＋DB確認 | 画面（エラー）＋DB（不変） | ヘッダ行読めない/列数不一致/商品不存在/フォーム不正の否定的事実（対象・対象外・センチネルとも不変）をDBスナップショットで確認 |

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて期待テキスト実内容＋前提条件による。汎用スタブはexcluded（Gate B15）。母集合の要求挙動がEE固有でpf現行と食い違う行はTBD（redirect/pagination/fileラベルJS/maxrow文言）。

### 集計（105 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **12** | 下表（9ユニーク候補ケース。B12共有〔完全重複・同一実行〕で母集合12行→tsv9行） |
| **TBD** | **13** | pf/ee食い違い〔redirect: -003,-088,-102／pagination: -004,-089,-099,-103／fileラベルJS: -006,-105／maxrow文言: -092〕＋観測未整備〔一時ファイル: -008,-041／完了ログ: -097〕。§9.1 |
| **excluded** | **80** | 汎用スタブ・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・base_info_id列注記（誤り訂正済）・タグ必須の自己矛盾(-010)。§9.3 |
| 合計 | **105** | 欠番0・理由なし重複0 |

> 会計: bound 12／TBD 13／excluded 80（=105・欠番0）

- 候補ケース総数 **9**（C-001〜C-005・C-007〜C-010。C-006は母集合アンカー不在で欠番＝下記）。
  - C-001←-053/-086（GETアップロード画面到達＋取込履歴最新100件・降順）
  - C-002←-007（送信前確認ダイアログなし）
  - C-003←-049/-082/-095（正常取込＝タグ全置換＋履歴INSERT＋成功メッセージ「商品登録CSVファイルをアップロードしました。」）
  - C-004←-091（ヘッダ行読めない→format.header「CSVのフォーマットが一致しません。」）
  - C-005←-064（列数不一致→format.body「…%d 行目のデータを確認してください。」）
  - **C-006欠番（R6 Major是正）**: 母集合の必須系-010は前提/操作ともタグID未入力を対象とするが、Excel:4344・pf ColumnDefinitions.php:122でタグ(ID)は任意＝必須エラーにならず期待「必須エラー表示」と矛盾するため**-010をexcluded**とした。商品ID必須検証を対象とする母集合行は存在しない（-010を商品IDへ読み替えるのはrelabel違反）ため候補C-006は作らず、商品ID必須（L1-007）はdocumentation-onlyとする。
  - C-007←-018（商品ID不存在/削除済→product.not_exists breakAll）
  - C-008←-012（静的テーブル・データ整合性）
  - C-009←-083（履歴はエラーなく完了時のみ+1）
  - C-010←-090（ファイル未選択などフォーム不正→取込前に弾かれDB不変）
- **B7 excluded 非該当観点**: 検索条件14（-020〜-033）／削除・移動・コピー・JSON・同名ファイル・配置先・スキーマ・ファイル出力等（-072〜-081）。§9.3。
- **breakAll/skipRow一意化**: 本機能は各列検証失敗・商品ID不存在ともbreakAll（skipRow経路は一次資料に無い）。中断系候補（C-005 列数不一致／C-007 商品ID不存在）は後続に正常センチネル行を加えた2行CSVで、2行目が処理されない（センチネルのタグ不変）ことをDBで確認しbreakAllをskipRowと一意判定する（§10-10）。
- **B8観点補正＝20件**（bound/TBD行のうち観点ラベルが期待テキスト実内容と不一致の20行。§8.1）。ラベルが実内容と一致するbound2行（-018 存在検証／-064 列数）は補正対象外。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（20件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -003 | 未認証 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -004 | 対象データ | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -006 | 識別子 | JS挙動（ファイル選択表示＝食い違いTBD） | L1-016 |
| -007 | 状態変化 | モーダル（送信前確認ダイアログなし） | L1-003 |
| -012 | 文字列長バリデーション | データ整合性（説明表静的・自動再読込しない） | L1-012 |
| -049 | 実行結果 | 実行結果（DB副作用: タグ置換+履歴INSERT） | L1-009,L1-010 |
| -053 | 更新内容 | 画面表示（アップロード画面表示） | L1-001 |
| -082 | 初期行数 | 実行結果（DB副作用: タグ置換+履歴INSERT） | L1-009,L1-010 |
| -083 | 表示順 | 履歴（エラーなく完了時のみ+1） | L1-010 |
| -086 | 排他制御 | 画面表示（アップロード画面表示） | L1-001 |
| -088 | 画面レイアウト | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -089 | 画面レイアウト | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -090 | 画面レイアウト | ロールバック（フォーム不正→DB不変） | L1-011 |
| -091 | 画面レイアウト | メッセージ／画面遷移（ヘッダ行読めない→format.header） | L1-005 |
| -092 | 画面レイアウト | メッセージ／画面遷移（行数上限・文言はTBD） | L1-004 |
| -095 | 一覧 | 取込成功（成功メッセージ表示） | L1-014 |
| -099 | 画面表示データ | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -102 | 非同期更新 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -103 | エラー継続 | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -105 | データ正当性 | JS挙動（ファイル選択表示＝食い違いTBD） | L1-016 |

### 105対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が一致（汎用スタブ＋非該当: 取込機能に出力失敗なし） | excluded | — |
| 002 | CSRFのファイル出力内容が一致（汎用スタブ・CSRFは一次資料に固有規定なし） | excluded | — |
| 003 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 004 | 取込履歴一覧の表示件数の切り替えとページ移動の保持方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 005 | csv_product_tag.twig が base_csv_upload.twig を継承（Twig継承は観測不能・EEテンプレート名でPF現行と不一致・構成要素はC-001被覆） | excluded | — |
| 006 | ファイルを選んだときの画面上のファイル名表示の仕方が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 007 | 送信前の確認ダイアログを表示せずそのまま送信する | bound | C-002 |
| 008 | アップロードしたファイルを一時領域へ退避し処理後に削除する動作は、保存先を直接見る手段が無いため実機で確認する必要がある | TBD | — |
| 009 | dtb_product.id を検索キーとして利用（内部DBカラム注記・単一観測挙動でない） | excluded | — |
| 010 | タグID未入力に必須エラーを期待するが、タグ(ID)は任意で必須エラーにならない（前提/操作ともタグID対象・実装と矛盾＝非該当） | excluded | — |
| 011 | 必須バリデーションでエラー表示されず継続＋前提ロールバック（前提と期待が両立しない自己矛盾） | excluded | — |
| 012 | 説明表は静的でCSVプレビューを保持せず取込後に自動再読込しない | bound | C-008 |
| 013 | 相関バリデーションでエラー表示され完了しない（汎用スタブ・本機能に相関検証なし） | excluded | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 016 | 相関バリデーションでエラー表示され完了しない（汎用スタブ・相関検証なし） | excluded | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・観測対象未定義） | excluded | — |
| 018 | 存在しない（削除済み含む）商品IDの行は全体中断しエラーになる | bound | C-007 |
| 019 | フォーム NotBlank（ファイル必須の制約注記・vague） | excluded | — |
| 020 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 021 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 022 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 023 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 024 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 025 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 026 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 027 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 028 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 029 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 030 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 031 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 032 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 033 | 検索条件の該当レコードが取得結果に含まれる/含まれない（検索非該当・汎用スタブ） | excluded | — |
| 034 | 実行結果の該当レコードが含まれる（汎用スタブ） | excluded | — |
| 035 | 実行結果の該当レコードが含まれる（汎用スタブ） | excluded | — |
| 036 | 実行結果の該当レコードが含まれる（汎用スタブ） | excluded | — |
| 037 | 実行結果の該当レコードが含まれる（汎用スタブ） | excluded | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・具体値未指定＝C-003で被覆） | excluded | — |
| 039 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-007の中断で被覆） | excluded | — |
| 040 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 041 | アップロードしたファイルを一時領域へ退避し処理後に削除する動作は、保存先を直接見る手段が無いため実機で確認する必要がある | TBD | — |
| 042 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 043 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 044 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 045 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 046 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 047 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ） | excluded | — |
| 049 | 対象商品のタグを全削除してCSVのタグへ置換し成功時のみ履歴を1件追加する | bound | C-003 |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-003で被覆） | excluded | — |
| 051 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 052 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 053 | アップロード画面を表示しフォーマット説明表と取込履歴（最新100件・降順）を表示する | bound | C-001 |
| 054 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 055 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 056 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 057 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 058 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提MSG-002） | excluded | — |
| 059 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提MSG-003） | excluded | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提MSG-005＝実在しない幻ラベル） | excluded | — |
| 061 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提MSG-001） | excluded | — |
| 062 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ・前提MSG-004） | excluded | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | excluded | — |
| 064 | データ行の列数が2でないCSVは行検証で取込を中止し画面にフォーマット不一致のエラーを表示する | bound | C-005 |
| 065 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 066 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 067 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 068 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 069 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 070 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ） | excluded | — |
| 072 | 削除の該当レコードが含まれない（削除は本機能に非該当） | excluded | — |
| 073 | 移動・リネームの該当レコードが含まれない（非該当） | excluded | — |
| 074 | コピーのファイル出力内容が一致（非該当） | excluded | — |
| 075 | ファイル登録のファイル出力内容が一致（汎用ファイルスタブ・成否はC-003/C-004/C-005で被覆） | excluded | — |
| 076 | ファイル出力のファイル出力内容が一致（出力は本機能に非該当） | excluded | — |
| 077 | JSONのファイル出力内容が一致（非該当） | excluded | — |
| 078 | 同名ファイルのファイル出力内容が一致（非該当） | excluded | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | excluded | — |
| 080 | 配置先の該当レコードが含まれる（非該当） | excluded | — |
| 081 | スキーマのファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 082 | 対象商品のタグを全削除してCSVのタグへ置換し成功時のみ履歴を1件追加する | bound | C-003 (shared) |
| 083 | 取込がエラーなく完了したときだけ取込履歴が1件増える | bound | C-009 |
| 084 | 更新抑止のファイル出力内容が一致（汎用スタブ） | excluded | — |
| 085 | フォーム NotBlank（ファイル必須の制約注記・vague＝-019と同型） | excluded | — |
| 086 | アップロード画面を表示しフォーマット説明表と取込履歴（最新100件・降順）を表示する | bound | C-001 (shared) |
| 087 | （テンプレートは GET（画面遷移表の断片・破損テキストのプレースホルダ） | excluded | — |
| 088 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 089 | 取込履歴一覧の表示件数の切り替えとページ移動の保持方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 090 | ファイル未選択などフォーム不正の送信は取込前に弾かれ画面にエラーを表示しDBは変わらない | bound | C-010 |
| 091 | 1行目のヘッダ行が読み取れないCSVは取込を中止し画面にフォーマット不一致のエラーを表示する | bound | C-004 |
| 092 | 上限行数を超えるCSVを弾く際に画面へ表示される文言は、実機で解決される実際のメッセージを確認するまで確定できない | TBD | — |
| 093 | 商品タグ更新CSV登録画面に遷移（前提MSG-005＝実在しない幻ラベル・汎用画面遷移） | excluded | — |
| 094 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提MSG-001） | excluded | — |
| 095 | 取込成功時に成功メッセージ「商品登録CSVファイルをアップロードしました。」を表示する | bound | C-003 (shared) |
| 096 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 097 | 取込完了時に出力される件数付きの動作ログは、ログを直接見る手段が無いため実機で確認する必要がある | TBD | — |
| 098 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 099 | 取込履歴一覧の表示件数の切り替えとページ移動の保持方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 100 | base_info_id列は存在しない（ee現行実装と逆＝母集合の誤り・§3/§9.2で存在を訂正・当機能の観測可能挙動でない） | excluded | — |
| 101 | ファイル選択のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 102 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 103 | 取込履歴一覧の表示件数の切り替えとページ移動の保持方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 104 | csv_product_tag.twig が base_csv_upload.twig を継承（Twig継承は観測不能・EEテンプレート名でPF現行と不一致・構成要素はC-001被覆） | excluded | — |
| 105 | ファイルを選んだときの画面上のファイル名表示の仕方が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |

`func_scope_check` 判定: 親105/105会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝13件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い: 送信後の画面再表示方式 | -003,-088,-102 | 3 | pf現行は render(HTTP200・同一画面再描画)、EEは302 redirect。母集合期待「常にリダイレクト」はPF現行と一致せずD6確定待ち（L1-013） |
| pf/ee食い違い: 履歴の件数切替・ページ移動 | -004,-089,-099,-103 | 4 | pf現行はセッションによる件数切替を持たず最新100件表示、EEは件数/ページ番号をセッション保存。母集合期待はPF現行に存在せずD6確定待ち（L1-015） |
| pf/ee食い違い: ファイル選択の画面表示 | -006,-105 | 2 | pf現行は素のファイル入力+spinner、EEは選択ファイル名のカスタム表示。母集合期待はPF現行に存在せずD6確定待ち（L1-016） |
| 文言不確定: 行数上限メッセージ | -092 | 1 | 行数上限を弾く際の表示文言は pf plugin locale が %d 表記で画面表示の実文言を実機確認まで確定不能（L1-004。上限で弾く挙動自体は実在） |
| 観測手段未整備: 一時ファイル | -008,-041 | 2 | 一時領域への退避/削除は保存先を直接見る手段が未整備で画面/履歴では検知できず一意判定不能＝要実機（L1-017） |
| 観測手段未整備: 完了ログ | -097 | 1 | 完了時の件数付き動作ログはログを直接見る手段が未整備で一意固定できず要実機（L1-018） |

（合計 3+4+2+1+2+1 = 13）

### 9.2 要実機・documentation-only

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureファイルの実バイト内容（2列・ヘッダ行なし・列数不一致・カンマ区切りタグ） | fixture manifest（D5型）未整備＝要実機 |
| L1-007（商品ID必須→data.require breakAll）・L1-020（タグ任意・タグ空でも取込成立）・L1-021（商品ID数値形式違反→breakAll） | 母集合に一意判定できる固有要求行が無い＝documentation-only（母集合の必須系-010はタグID未入力対象＝実装のタグ任意と矛盾でexcluded・商品IDへのrelabel禁止。L1-020/021も固有行なし） |
| 支店連携（BranchUpdateService->noticeProductUpdate）・L1-019（重複タグID→複数行） | pf現行の取込成功時副作用/DB一意制約依存で外部観測手段未契約＝documentation-only（handler:54-68,251-262） |
| base_info_id（ee正・TenantTrait・replaceで=1） | ee静的スキーマで母集合に固有要求行なし＝documentation-only（base_info_id=1はC-003 DB検証で確認・§3） |
| pf/ee食い違い（redirect/pagination/fileラベルJS/maxrow文言）のD6決裁 | 現行踏襲でpf現行を正とするか刷新でee挙動を正とするかは発注者判断＝TBD |

### 9.3 excluded＝80件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能・EEテンプレ名不一致・C-001被覆）** | -005,-104 | 継承そのものは判定不能＋EEテンプレート名でpf現行は `csv_product_tag_update.twig`。構成要素はC-001被覆 |
| **【B7/B15】汎用検索スタブ（非該当観点）** | -020〜-033 | 本機能は検索せず選択CSVをアップロード取込。非該当観点かつ具体対象なし |
| **【B15②】汎用「実行結果/出力内容が含まれる/一致」スタブ** | -034,-035,-036,-037,-048,-062,-065,-066,-067,-068,-069,-070,-084,-101 | 一致基準を母集合が持たず内容空虚 |
| **【B15②/④】汎用「登録/更新内容が追加/変更される・されない」スタブ（C-003/C-007で被覆）** | -038,-039,-040,-042,-043,-044,-045,-046,-047,-050,-051,-052,-054,-055,-056,-057,-058,-059,-060 | 対象レコード・具体値未指定。-060の前提MSG-005は実在しない幻ラベル |
| **【B15②】「エラー表示されず継続」（観測対象未定義）** | -014,-015,-017,-063,-071,-096,-098 | 具体的観測対象を母集合が指定せず内容空虚 |
| **【B15②/読み替え禁止】汎用相関スタブ（本機能に相関検証なし）** | -013,-016 | 本機能に相関検証なし。DB照合実在チェックの具体インスタンスは-018のみ→C-007 |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 取込機能に該当なし |
| **【B15②/R1 Major8是正】内部DB注記スタブ** | -009,-100 | -009 dtb_product.id利用・**-100 base_info_id不在（ee現行と逆＝誤り・§3/§9.2で存在を訂正）**は当機能の観測可能挙動でない |
| **【B15③】自己矛盾/プレースホルダ/幻ラベル/非該当** | -001,-002,-010,-011,-019,-061,-085,-087,-093,-094 | -001出力失敗／-002 CSRF固有規定なし／**-010 タグID未入力に必須エラーを期待するがタグ(ID)は任意〔Excel:4344・ColumnDefinitions.php:122〕で必須エラーにならない自己矛盾・非該当。商品IDへの読み替え（relabel）は禁止のためexcluded（R6 Major是正）**／-011自己矛盾／-019・-085 vague／-061・-094 プレースホルダ／-087破損断片／-093幻ラベル。**-095は前提MSG-004の成功メッセージ挙動が実在するためexcluded不可→C-003へbound（R2 Major2）** |

## §10 特記事項（R3 Major是正の記録）

1. **拒否経路の実メッセージを実装一致に是正（R3 Major2）**: MessageStore/BaseCsvImportHandler/CsvImporter を実照合した結果、`format.header`「CSVのフォーマットが一致しません。」は**ヘッダ行が読み取れない場合のみ**（CsvImporter:195-196 setHeaderRowNumber(0) が false）で、**ヘッダ名が定義列に無い場合は addColumnNotExistsError→product.not_exists**、**列数不一致は addInvalidColumnCountError→format.body**「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（BaseCsvImportHandler:58-60）。C-004を「ヘッダ行読めない→format.header」、C-005を「列数不一致→format.body」へ是正（初版の「ヘッダ名不一致→format.header」の逐語期待は不成立だったため訂正）。
2. **L1原子被覆／G7（R3 Major3）**: 旧L1-006が商品ID必須＋数値形式＋タグ任意を1claimに含んでいたため、**商品ID必須（L1-007）へ原子化**し、数値形式（L1-021）・タグ任意（L1-020）を別 documentation-only claim へ分離（各々を一意判定する固有母集合行が無い。L1-007もR6で母集合アンカー不在と判明しdocumentation-only＝項目9）。一時ファイルの根拠を Controller:634 のみ→`CsvImporter.php:76-95,114-122,131-164`（createTempFileName/file->move/finally deleteTempFile）へ訂正。全 source をフルパス:line 表記にし Gate A G7 WARN を解消。
3. **1 claim 1 source（R2 Major1継続）**: 各L1のsourceをPF現行の単一ソースへ限定。EEのDBスキーマ差（tag_id列・base_info_id）はオラクルclaimから外し§3/§9.2 documentation-only＋C-003のDB検証実装詳細としてのみ参照。
4. **成功メッセージは実PF値（R2 Major2）**: `admin.product.csv_import.save.complete`＝pf core message.ja.yml:133＝「商品登録CSVファイルをアップロードしました。」で確定（L1-014・bound。母集合-095をC-003へbound）。maxrow は %d 表記でキー解決不確定のため-092をTBD。
5. **拒否経路分離（R2 Major4）**: ヘッダ行(C-004)／列数(C-005)／商品ID不存在(C-007)／フォーム不正・null(C-010)を各**単一入力・単一判定**へ分離（商品ID必須はR6で母集合アンカー不在によりdoc-only＝項目9）。C-010から行数超過を外し（→TBD -092）重複を解消。C-001は SEED-M0328-HISTORY101（101件超・識別可能日時）＋件数/順序確認手順で「最新100件・降順」を検証。
6. **B12会計/B13可読性（R2 Major5・emitter修正）**: TBD重複排除キーに母集合の元期待列が加わり、異なる要件のTBDは各母集合IDが派生TSVへ出力される（同一要件のみ代表集約）。TBD期待列は内部略号（pf/ee・D6・page_count等）を排し平易な日本語で記述。
7. **商品タグ全置換の核・DB検証**: 1データ行ごとに DELETE で全削除→CSV列挙タグを foreach INSERT（pf列 `tag`／ee列 `tag_id`+`base_info_id=1`）。商品編集画面のタグ表示は Tag.sort_no 昇順でCSV挿入順は観測不能のため、C-003は集合一致（順序は非期待）で判定しDBスナップショット（対象集合・更新対象外不変・履歴+1）で補完（総件数比較に依存しない）。
8. **確認モーダル極性**: pf現行 base_csv_upload.twig に confirm 記述なし＝送信前確認ダイアログなし（Excel sheet-14 とも一致）。L1-003 bound。
9. **母集合-010の実対象に忠実な分類（R6 Major・relabel禁止）**: 母集合-010は観点=必須バリデーションだが、前提「タグ IDを試験できる状態である」・操作「タグ IDを確認する」ともに**タグ ID未入力**を対象とする（all_it_cases.tsv:6898）。Excel基本設計（`0204:商品タグ更新CSVフォーマット` 識別ID2・HTML:4344）およびpf実装（`ColumnDefinitions.php:122` setRequiredなし）で**商品タグ(ID)は任意**であり、タグ未入力では必須エラーにならない。よって-010の期待「必須エラー表示・処理未完了」は実装と矛盾＝自己矛盾/非該当で**excluded**とした。**商品ID必須検証を対象とする母集合行は存在しない**ため（-010を商品IDへ読み替えるのはB3 relabel違反）、初版のC-006（商品ID必須→breakAll）を廃し、商品ID必須（L1-007）は documentation-only とした。初版C-006の入力で「タグID実在としつつ商品ID空を単一判定」していた設計上の狙い（商品ID必須の一意判定）は、そもそも一次資料に固有母集合行が無いため成立しない。
10. **breakAll/skipRow一意化（R5 Major）**: 行検証で中断する候補（C-005 列数不一致／C-007 商品ID不存在）は1データ行では breakAll（全体中断）と skipRow（当該行スキップ）を観測上区別できないため、**後続に正常センチネル行を加えた2行CSV**にした。実装は onValidateRow の失敗で `event->breakAll()`（`BaseCsvImportHandler.php:58-61,79-82`）→ importRows で `if(event->isBreakAll()) break`（`CsvImporter.php:244-246`）＝以降行を打ち切る一方、`isSkipRow()` なら `continue`（`:248-249`）で後続行を処理し、`isSuccessful = messageStore->count()===0 || !hasBreak`（`:272`）により skipRow は中断フラグが立たず成功扱いでコミットされ得る。よって**2行目の正常センチネル商品のタグが更新されない（＝breakAllで未処理・ロールバック）／更新される（＝skipRowで処理・コミット）**の差でbreakAllとskipRowを一意判定する（本実装は breakAll のためセンチネルは不変）。センチネル商品は SEED-M0328-TARGETS が供給し中断系SEED（BADCOLUMN/BADPRODUCT）は2データ行にした。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound/TBD行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（20件）。** 汎用スタブは別要件へ置換しないため観点補正に含めない（該当行はexcluded）。

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 003 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 004 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 006 | JS挙動 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 007 | モーダル | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 012 | データ整合性 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 049 | 実行結果（DB副作用） | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 053 | 画面表示 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 082 | 実行結果（DB副作用） | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 083 | 履歴 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 086 | 画面表示 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 088 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 089 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 090 | ロールバック | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 091 | メッセージ／画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 092 | メッセージ／画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 095 | 取込成功（メッセージ） | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 099 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 102 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 103 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 105 | JS挙動 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
