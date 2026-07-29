# 候補: m03-29 売上分析タグ更新CSV登録（取込/インポート） — 実行可能グレード候補（母集合96全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。superseded=yes だが **Ph2=no** のため Phase1実行ケースを持つ通常対象（POC `integration_test/_poc2_m03-29.md` の DELETE後INSERT置換=P1 等）。
> **実ソース基準**: pf現行＝`/home/y-saito/Developments/pf-eccube3/`（＋pf core `.../pf-eccube3/src/Eccube/`）、ee＝`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`（cross検証・DB正）。
> **姉妹 M03-28（商品タグ更新CSV登録・committed）と同型**。実走SUT/ee正の置換テーブル `dtb_product_tag_sales_analysis`／ハンドラ `ProductTagSalesAnalysisUpdateImportHandler`／ルート `product_tag_sales_analysis_update_csv_upload`。M03-28の型（タグ全置換・breakAll 2行センチネル・スナップショット比較）を流用。
> **M03-28との差2点**: (a) タグ列マスタ検証は `TagSalesAnalysisIdValidator`（`mtb_tag_sales_analysis` 実在→`addMasterNotExistsError`=`admin.csv.error.data.not_registered`）で、母集合082「マスタ不存在→全体ロールバック」が固有アンカーとして存在し **bound可能**（M03-28ではdoc-only）＝C-004。(b) 置換ロジック `replaceTagSalesAnalyses` は `array_unique($tagIds)` で重複タグを除去してから置換するため **重複タグIDは残らない**（M03-28が foreach で重複挿入し得るのと逆＝L1-019）。
> **本機能は更新系（売上分析タグ全置換）**。1データ行ごとに既存タグを DELETE で全削除→CSV列挙タグを INSERT（差分でなく全置換・タグ列空なら全削除のみ）。各列検証失敗も商品ID不存在もマスタ不存在も breakAll（skipRow経路なし）。DB検証は総件数でなくスナップショット比較（B9）。
> **LS=0（全件）を機械確認**: pf plugin `app/Plugin/HareruyaEc/Resource/locale/message.en.yml`（1159行）に CSV取込エラーキー（maxrecord/format.header/format.body/data.require/data.not_registered/product.not_exists/product.over_zero）と `admin.product.csv_import.save.complete` が **存在しない**ことをgrep実確認（en側に `admin.csv.error` ブロック無し）。pf core `src/Eccube/Resource/locale/` は message.ja.yml のみで en 不在。よって pf現行メッセージは全て ja 固定＝LS=0。
> B1-B15 自己監査済み（実ソース再確認・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **pf現行実装（回帰先・source_class=pf-fallback／主一次資料＝実ソース）**:
  - ルート: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:112-116`（GET `admin_product_tag_sales_analysis_update_csv_import`／POST `admin_product_tag_sales_analysis_update_csv_upload`・ともに `/{admin_route}/product/product_tag_sales_analysis_update_csv_upload`）
  - コントローラ: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（GET `csvProductTagSalesAnalysisUpdate:727-733`→render／POST `csvProductTagSalesAnalysisUpdateUpload:744-787`→render〔redirectなし〕／`set_time_limit(0):747`／maxrow `:767-771`／開始log `:773`／成功 `addSuccess('admin.product.csv_import.save.complete'):781`＋完了log `:782`＋履歴INSERT `:783-784`／異常終了log `:778-779`／`render:1857-1867`〔履歴 createDate 降順 最新100件・ページネーションなし〕／`CSV_IMPORT_MAX=5010:391`／`CSV_IMPORT_HISTORY_LIMIT=100:392`／雛形 `csvTemplate:436-521`〔type=analysis→`product_tag_sales_analysis_update.csv:455-458`・Content-Type `application/octet-stream:517-518`〕／ヘッダ定義 `getProductTagSalesAnalysisUpdateCsvHeader:2057-2063`）
  - インポータ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php`（import＋一時ファイル `:76-95`／deleteTempFile `:114-122`／createCsvImportService file->move `:131-164`／validateBeforeImport `:190-213`〔ヘッダ行読めない→addHeaderFormatError `:195-196`／データ空→addNoDataError `:205-206`〕）
  - 共通ハンドラ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52-84`（列数不一致→addInvalidColumnCountError `:57-64`／各列 validate `:79`）
  - 手継: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php`（商品ID `setRequired(true):48`・タグ任意 `:49`・onValidateRow `:74-88`・validateProductExists `:136-154`／isProductExists del_flg `:160-181`→`breakAll`・onReadRow persist `:96-105`／persistTagSalesAnalysis `:189-199`・成功時支店連携 `:53-67`）
  - 置換SQL: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php`（replaceTagSalesAnalyses array_unique `:287-292`／deleteAllTagSalesAnalyses `:299-316`／insertTagSalesAnalyses〔空は早期return〕`:324-349`）
  - 列定義: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:61-63`(productId・createUnsignedNumericColumn:837-847)・`:432-435`(tagSalesAnalysisList＝setRequiredなし・TagSalesAnalysisIdValidator・createMultipleUnsignedNumericColumn:879-892)
  - タグマスタ検証: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/Repository/TagSalesAnalysisIdValidator.php`（`mtb_tag_sales_analysis` 実在ID照合→addMasterNotExistsError）
  - メッセージストア: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php`（header:75-78／invalidColumnCount:87-90／require:124-127／masterNotExists:191-193／productNotExists:204-207／numeric over_zero:177-179）
  - テンプレート: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_tag_sales_analysis_update.twig:1`（`Product/base_csv_upload.twig` 継承）
  - メッセージ本文: pf plugin `.../HareruyaEc/Resource/locale/message.ja.yml`（maxrecord:1097／format.header:1100／format.body:1101／data.empty:1112／data.require:1113／data.not_registered:1115／product.not_exists:1144／product.over_zero:1146）／**pf core** `pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133`（成功「商品登録CSVファイルをアップロードしました。」）
- **ee現行実装（DB関連はee正・cross検証／source_classにしない）**: `ec-cube-enterprise/src/Eccube/` — `Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php`（POST後302 redirect＋addErrorフラッシュ・履歴ページング・雛形名 `product_tag_sales_analysis_template.csv`・成功キー `admin.register.complete`）。これらは pf現行と食い違い＝L1-013/015/016 は TBD。
- **Excel基本設計**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` sheet-17/18。**識別ID1 商品ID〔必須※・数値(整数)〕／識別ID2 売上分析タグ(ID)〔必須欄空＝任意・カンマ区切りで複数指定可能〕**・レコード数上限5010。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-29-…-001..096`（96件・欠番0・重複0）。
- **source_class は pf-fallback のみ**（Gate G2充足。ee実ソースはcross検証・DB検証実装詳細のみ）。

---

## §1 L1原子オラクル表

全23claim（経路別・原子化）。**source_class列は pf-fallback のみ**。**LS=0（全件）**: pf plugin message.en.yml にCSV取込キー不在・pf core に en 資源不在をキー別に実確認（§5）。

**被覆状況（正直分類）**: bound候補が検証するのは **L1-003,004,008,009,010,011,014,022**（8claim。L1-004はC-007で改行数上限以上→取込前エラー・DB不変の粗い挙動をbound）。**L1-004の表示文言部分（-084）・L1-013（redirect/エラー提示）・L1-015（pagination/session）・L1-016（fileラベルJS）・L1-023（並行変化）はTBD**、**L1-001（画面表示）・L1-002（テンプレ構成）・L1-005（ヘッダformat）・L1-006（列数）・L1-007（商品ID必須）・L1-012（静的表）・L1-017（一時ファイル）・L1-018（ログ）・L1-019（重複タグ）・L1-020（タグ任意）・L1-021（商品ID数値形式）は documentation-only**（母集合に一意判定できる固有要求行が無い）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0329-001 | http_entry | GET /{admin_route}/product/product_tag_sales_analysis_update_csv_upload（bind admin_product_tag_sales_analysis_update_csv_import）を開くとアップロード画面が render され、CSVファイル選択・「CSVファイルのアップロード」ボタン・フォーマット説明表（商品ID〔必須〕・売上分析タグ(ID)〔カンマ区切りで複数指定可能〕）・雛形ダウンロードリンク・取込履歴テーブルを表示する。履歴は種別ID=4 を createDate 降順の最新 CSV_IMPORT_HISTORY_LIMIT=100件のみ表示（documentation-only＝画面表示を一意判定する固有母集合行が無い） | $app->get('…/product/product_tag_sales_analysis_update_csv_upload',…)->bind('admin_product_tag_sales_analysis_update_csv_import') / findBy([…],['createDate'=>'DESC'],CSV_IMPORT_HISTORY_LIMIT) | pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:112-116 / pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:727-733,1857-1867,392 | pf-fallback | 0 |
| L1-M0329-002 | display_field | csv_product_tag_sales_analysis_update.twig は共通テンプレート Product/base_csv_upload.twig を継承し、CSVファイル選択（file入力 accept text/csv,text/tsv）・「CSVファイルのアップロード」submitボタン・_token（CSRF）・フォーマット説明表（商品IDは必須表記・売上分析タグ(ID)はカンマ区切りで複数指定可能）・雛形ダウンロード（type=analysis）・下部に取込履歴（ファイル名・日時・作業者）を表示する（documentation-only＝母集合004はEEテンプレ名 csv_tag_sales_analysis.twig で観測不能かつpf現行テンプレ名と不一致） | extends 'Product/base_csv_upload.twig' / set type='analysis' | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_tag_sales_analysis_update.twig:1 / pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:16-75 | pf-fallback | 0 |
| L1-M0329-003 | display_field | アップロードボタン押下でそのまま POST 送信し、送信前の確認ダイアログ（モーダル）を表示しない（twigにconfirm記述なし・JSはspinnerのみ） | （base_csv_upload.twig・JSに confirm ダイアログ記述なし） | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:8-11 | pf-fallback | 0 |
| L1-M0329-004 | message | 改行数（countCsvRows）が定数 CSV_IMPORT_MAX（5010）以上のとき翻訳キー admin.csv.error.upload.maxrecord を sprintf(…,5010) してエラー表示し取込を中止する（DB書込みなし・render再描画）。ただし当該キーの解決文言は pf plugin locale が %d 表記（%d 行を超えるCSVファイルは登録できません。）であり、画面表示の実文言は実機確認まで確定不能（TBD） | if(countCsvRows(file)>=CSV_IMPORT_MAX) addError(sprintf(trans('admin.csv.error.upload.maxrecord'),CSV_IMPORT_MAX)) / maxrecord: %d 行を超えるCSVファイルは登録できません。 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:767-771,391 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1097 | pf-fallback | 0 |
| L1-M0329-005 | message | CsvImporter.validateBeforeImport で1行目のヘッダ行が読み取れない（setHeaderRowNumber(0) が false）とき addHeaderFormatError で admin.csv.error.format.header＝「CSVのフォーマットが一致しません。」をエラー配列で返し取込を中止する（DB書込みなし・render再描画）（documentation-only＝母集合031はエラー提示形式が『フラッシュしリダイレクト』でpf現行のrender再描画と食い違いTBD） | if(!importService->setHeaderRowNumber(0)) messageStore->addHeaderFormatError() / header: CSVのフォーマットが一致しません。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190-199 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:75-78 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1100 | pf-fallback | 0 |
| L1-M0329-006 | message | BaseCsvImportHandler.onValidateRow でデータ行の列数が列定義数（2）と一致しないとき addInvalidColumnCountError で admin.csv.error.format.body＝「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（%d＝該当行番号）を積み breakAll で取込を中止する（DB書込みなし）（documentation-only＝列数不一致を一意判定する固有母集合行が無い） | if(count(row)!==count(columns)) addInvalidColumnCountError(row->getRowNumber()); breakAll() / body: CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:57-64 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:87-90 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1101 | pf-fallback | 0 |
| L1-M0329-007 | validation | onBeforeImport で商品ID列を setRequired(true) で生成する。列検証で商品IDが未入力（空）の行は addRequireError で admin.csv.error.data.require＝「商品ID は必須項目です。 %d 行目のデータを確認してください。」を積み breakAll（全体中断）しコミットされない（documentation-only＝母集合の必須系010/011は前提が幻ラベル M03-29-MSG-004/005 で対象不定） | productIdColumn=ColumnDefinitions::productId()->setRequired(true) / addRequireError / require: %s は必須項目です。 %d 行目のデータを確認してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:48 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:79 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:124-127 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1113 | pf-fallback | 0 |
| L1-M0329-008 | validation | onValidateRow の追加処理 validateProductExists がネイティブSQL（SELECT p.product_id FROM dtb_product p WHERE p.product_id=:productId AND p.del_flg=:delFlg〔DISABLED〕）で商品の実在を確認し、存在しない（del_flg論理削除済み含む）とき addProductNotExistsError で admin.csv.error.product.not_exists＝「%d 行目の 商品ID ではデータを取得できません。」を積み breakAll で以降行を処理しない（全体ロールバック） | if(!isProductExists(productId)) addProductNotExistsError(…); breakAll() / WHERE p.product_id=:productId AND p.del_flg=:delFlg / not_exists: %d 行目の %s ではデータを取得できません。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:74-88,136-181 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:204-207 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1144 | pf-fallback | 0 |
| L1-M0329-009 | data_behavior | 取込後、当該商品の売上分析タグ紐付けがCSV指定のタグID集合と一致する（対象商品の商品編集画面で観測できる）。タグ列が空のときは当該商品の紐付けが0件になる。更新の内部手順は観測できないため主張せず、最終的な紐付け集合が画面で一致することのみを判定する | 取込後: 対象商品のタグ紐付け＝CSV指定タグID集合（タグ列空なら0件） | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:96-105,189-199 / pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php:287-349 | pf-fallback | 0 |
| L1-M0329-010 | history | 取込結果にエラーが無いとき（else経路）だけ insertCsvImportHistory で dtb_csv_import_history へ種別（PRODUCT_TAG_SALES_ANALYSIS_IMPORT_CSV_ID=4）・クライアント側オリジナルファイル名・利用者IDを INSERT する。エラーがあれば（hasError）履歴INSERTせず異常終了ログのみで履歴行は増えない | if(result->hasError()) log_info('売上分析タグ更新 異常終了'); else addSuccess(…); csv_import_history->insertCsvImportHistory(app,csvImportType,file->getClientOriginalName()) | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:778-785 | pf-fallback | 0 |
| L1-M0329-011 | rollback | フォーム不正・ファイル未選択（null）・行数超過はインポータ実行前に画面へエラー表示のみでDBを変更しない。CsvImporter は beginTransaction でトランザクションを開始し、全行処理後 isSuccessful=（messageStore->count()===0 || !hasBreak）が真のときのみ commit、偽のとき rollback する。行検証エラーや商品/タグ不存在で breakAll が立つとロールバックされタグ置換はコミットされない。対象商品の売上分析タグ集合は不変・更新対象外商品も不変・履歴行数不変となる | beginTransaction() / isSuccessful=(messageStore->count()===0 || !hasBreak); if(isSuccessful) commit(); else rollback(); / catch(...) rollback() | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:225,272-276,291 / pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:755-771,778-787 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:74-88 | pf-fallback | 0 |
| L1-M0329-012 | data_integrity | フォーマット説明表は render 時に渡す静的 headers 配列であり取込実行後に自動再読込せず CSV のプレビューも保持しない。取込結果の反映確認は別画面（商品編集）へ委ねる（documentation-only） | for key,value in headers …value|nl2br（静的headers）/ render(twig,['headers'=>headers,'importHistories'=>…,'errors'=>errors]) | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:44-72 | pf-fallback | 0 |
| L1-M0329-013 | http_flow | PF現行は POST（アップロード送信）後、成功・失敗いずれも render(...) で HTTP200 の同一アップロード画面を再描画しエラー配列をテンプレートへ渡して画面内に列挙する（redirectしない・フラッシュに積まない）。母集合が期待する『常に GET …/csv_upload へ HTTP302 リダイレクト／エラー配列をフラッシュしリダイレクト』はPF現行と一致せず刷新後の遷移方式・エラー提示形式は確定していない（TBD） | return this->render(app,form,headers,productTagSalesAnalysisUpdateTwig,result->getErrors(),…)（pf・redirectなし） | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:744-787 | pf-fallback | 0 |
| L1-M0329-014 | message | 取込結果にエラーが無いとき addSuccess('admin.product.csv_import.save.complete') で成功フラッシュを表示する。当該キーは pf core message.ja.yml:133 で「商品登録CSVファイルをアップロードしました。」に解決される（PF現行の確定文言・ja固定でLS=0）。あわせて件数付きの完了ログ（売上分析タグ更新 正常終了）を出力し取込履歴を INSERT する | app->addSuccess('admin.product.csv_import.save.complete','admin') / admin.product.csv_import.save.complete: 商品登録CSVファイルをアップロードしました。 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:781-784 / pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133 | pf-fallback | 0 |
| L1-M0329-015 | session | PF現行の取込履歴は render 内で createDate 降順の最新100件を findBy するのみで、表示件数（page_count）やページ番号（page_no）をセッションへ保存する仕組みを持たない。母集合が期待する『件数を許容リストのときだけセッション保存・ページ番号もセッション保存・保存済みページ状態で表示』はPF現行に存在せず刷新後の件数切替UIは確定していない（TBD） | findBy([…],['createDate'=>'DESC'],self::CSV_IMPORT_HISTORY_LIMIT)（page_count/page_no無し） | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1857-1867,392 | pf-fallback | 0 |
| L1-M0329-016 | display_field | PF現行の base_csv_upload.twig はファイル入力を素の form_widget（accept 指定のみ）＋spinner で表示し、選択ファイル名をカスタムラベルへ表示する装飾やロード表示切替を持たない。母集合が期待する『ファイル選択でラベルにファイル名を表示』はPF現行に存在せず刷新後のファイル選択UIは確定していない（TBD） | form_widget(form.import_file,{'attr':{'accept':'text/csv,text/tsv'}})（plain入力） | pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:16-30 | pf-fallback | 0 |
| L1-M0329-017 | file_handling | CsvImporter.import はアップロードファイルを createTempFileName で命名し createCsvImportService 内で csv_temp_realdir へ move（退避）して読み込み、finally の deleteTempFile で一時ファイルを削除試行する。ファイル保存先・削除タイミングを直接観測する手段が未整備で外部インターフェース（画面/履歴）では検知できず一意判定不能（documentation-only・要実機） | import(file){tempFileName=createTempFileName(file);try{createCsvImportService(file,tempFileName)…}finally{deleteTempFile(tempFileName)}} / file->move(csv_temp_realdir,tempFileName) | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:76-95,114-122,131-164 | pf-fallback | 0 |
| L1-M0329-018 | log | 取込直後に「売上分析タグ更新CSV登録開始」、成功時に件数付き「売上分析タグ更新 正常終了」、結果にエラーが残ったとき「売上分析タグ更新 異常終了」を情報ログに出力する。ログを直接観測する手段が未整備で外部インターフェースでは一意固定できない（documentation-only・要実機） | log_info('売上分析タグ更新CSV登録開始') / log_info('売上分析タグ更新 正常終了',['count'=>…]) / log_info('売上分析タグ更新 異常終了') | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:773,779,782 | pf-fallback | 0 |
| L1-M0329-019 | edge | 同一行で同一タグIDを重複記載した場合、replaceTagSalesAnalyses が冒頭で array_unique(tagIds) によりID配列を一意化してから置換するため、取込後のタグ紐付け（実走SUT ee dtb_product_tag_sales_analysis）に重複行は残らない（M03-28が foreach で重複挿入し得るのと逆）。母集合に一意判定できる固有要求行が無い（documentation-only） | tagIds=array_unique(tagIds); replaceTagSalesAnalyses(productId, tagIds)（一意化して置換） | pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php:287-292,324-349 | pf-fallback | 0 |
| L1-M0329-020 | validation | 売上分析タグ(ID)列は onBeforeImport で setRequired されず任意である。createMultipleUnsignedNumericColumn により NumericValidator（各カンマ区切りトークンが0以上整数）と TagSalesAnalysisIdValidator（mtb_tag_sales_analysis 実在）を持つ。タグ列が空でも必須違反にならず取込が成立する（documentation-only＝母集合090『任意であること』は性質記述でC-005が実挙動を被覆） | tagSalesAnalysisIdListColumn=ColumnDefinitions::tagSalesAnalysisList(em)（setRequiredなし）/ createMultipleUnsignedNumericColumn(…)->addValidator(new TagSalesAnalysisIdValidator(em)) | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:49 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:432-435,879-892 | pf-fallback | 0 |
| L1-M0329-021 | validation | 商品ID列は createUnsignedNumericColumn により NumericValidator を持ち、符号なし整数以外（非数値・負値）の行は addNumericError（admin.csv.error.product.over_zero＝「%d 行目の 商品ID は0以上の数値を設定してください。」）で breakAll する（documentation-only＝数値形式違反を一意判定する固有母集合行が無い） | createUnsignedNumericColumn(name,label)->addValidator(new NumericValidator()) / over_zero: %d 行目の %s は0以上の数値を設定してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:61-63,837-847 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:177-179 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1146 | pf-fallback | 0 |
| L1-M0329-022 | validation | 売上分析タグ(ID)列の各カンマ区切りトークンは TagSalesAnalysisIdValidator で mtb_tag_sales_analysis の実在ID一覧と照合され、マスタに存在しないIDが1つでもあれば addMasterNotExistsError で admin.csv.error.data.not_registered＝「売上分析タグ(ID) : %s がマスターから取得できません。 %d 行目のデータを確認してください。」を積み検証失敗＝全体中断（breakAll）で全体ロールバックする（未入力トークンは検証しない） | if(!value->validate(fn)) addMasterNotExistsError(rowNumber,label,originalValue) / not_registered: %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/Repository/TagSalesAnalysisIdValidator.php:38-90 / pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:191-193 / pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1115 | pf-fallback | 0 |
| L1-M0329-023 | concurrency | TagSalesAnalysisIdValidator は検証開始時点で mtb_tag_sales_analysis の実在ID一覧を一括ロードして照合するため、取込検証中にマスタが並行して変化した場合の整合は確定しない。母集合が『並行して起きた場合の整合は本書では確定しない』とする経路で固定オラクルを与えられない（TBD・要実機） | tagSalesAnalyses=loadTagSalesAnalyses(em)（検証開始時に一括ロード） | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/Repository/TagSalesAnalysisIdValidator.php:63-90 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

固定値は入力の再現手段で期待値の正にしない。**後始末**: 正常置換CSV・タグ空CSVを実送信しDBを変更するケース（C-001・C-002・C-005・C-006）は .down.sql で対象商品の ee `dtb_product_tag_sales_analysis` 紐付けと `dtb_csv_import_history` をSEED状態へ復元（冪等性）。中断/早期リジェクト系（C-003・C-004）はDB不変で復元不要。DB検証・SEED・down.sql の売上分析タグ置換テーブルは実走SUTの ee `dtb_product_tag_sales_analysis`（product_id, tag_sales_analysis_id）を用いる。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提 | 管理者アカウント（既存の管理画面ログインSEED） | 不要 |
| SEED-M0329-TARGETS | 取込の前提（対象商品・タグマスタ・更新対象外商品・センチネル商品） | 既存商品（del_flg未削除・事前に別の売上分析タグ集合が紐付く対象商品）＋mtb_tag_sales_analysis 実在ID＋取込対象に含めない別商品（更新対象外の不変確認用）＋センチネル商品（正常な実在商品IDで事前に既知タグ集合が紐付く。中断系CSVの2行目の正常行として使い、breakAllなら未処理でタグ不変・skipRowなら処理されタグ更新される差を判定する） | 参照（対象商品はC-002/005/006で変更・下記で復元） |
| SEED-M0329-HISTORY101 | 取込履歴「最新100件・降順」検証 | `dtb_csv_import_history` に売上分析タグ更新CSV種別（種別ID=4）の履歴を101件以上、各行の取込日時を識別可能に相違させて投入 | 不要（参照） |
| SEED-M0329-VALIDREPLACE | 正常置換（タグ全置換）の主SEED | 既存商品ID＋実在タグID複数（カンマ区切り）の1データ行の正常CSVファイル | 置換タグ集合・履歴を復元 |
| SEED-M0329-EMPTYTAG | タグ列空→全削除の検証 | 事前にタグ集合が紐付く既存商品IDのみ・タグ列は空の1データ行CSVファイル | 対象商品のタグ集合を復元 |
| SEED-M0329-BADPRODUCT | 商品存在検証（商品ID不存在/削除済→breakAll）一意判定 | 2データ行CSVファイル。1行目＝存在しない（またはdel_flg論理削除済みの）商品ID＋実在タグ、2行目＝正常センチネル行（実在センチネル商品ID＋実在タグ） | 不要（中断・書込みなし） |
| SEED-M0329-BADTAG | タグマスタ存在検証（タグ不存在→breakAll）一意判定 | 2データ行CSVファイル。1行目＝実在商品ID＋mtb_tag_sales_analysis に存在しないタグID、2行目＝正常センチネル行（実在センチネル商品ID＋実在タグ） | 不要（中断・書込みなし） |
| SEED-M0329-MAXROWS | レコード数上限（改行数5010以上→取込前エラー）検証 | 改行数が CSV_IMPORT_MAX（5010）以上のCSVファイル（各行は実在商品ID＋実在タグでも上限で弾かれる） | 不要（取込前終了・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報・pf現行＋Excel sheet-17/18）

取込CSVは**2列のみ**で売上分析タグの紐付けを全置換する。

| 識別ID | 列（Excel / pf ColumnDefinitions） | 必須 | 内容・扱い |
|---|---|---|---|
| 1 | 商品ID（数値・整数） | **必須**（handler `setRequired(true)`） | `dtb_product`（del_flg未削除）を検索キーに実在チェック。不存在なら breakAll。数値以外は breakAll（L1-021）。`ColumnDefinitions.php:61-63` |
| 2 | 売上分析タグ(ID)（文字型） | **任意**（Excel必須欄空・setRequiredなし） | カンマ区切りで複数指定可。各トークンは0以上整数かつ mtb_tag_sales_analysis 実在（TagSalesAnalysisIdValidator）。実在集合で当該商品のタグ紐付け（実走SUT ee `dtb_product_tag_sales_analysis`）をCSV指定集合へ置換（array_uniqueで重複除去）。空でも必須違反にならず紐付け0件になる（L1-009,020）。`ColumnDefinitions.php:432-435` |

**DBスキーマ差・DB検証テーブル（ee正＝実走SUT）**: 永続化の正は ec-cube-enterprise（Excel 0204 マスターデータ方針）。**実走SUT/DB正の置換テーブルは ee `dtb_product_tag_sales_analysis`（product_id, tag_sales_analysis_id・ee ProductRepository::deleteAllTagSalesAnalyses:1402-1410／insertTagSalesAnalyses:1415-1437／replaceTagSalesAnalyses:1445-1450）**。よって §4 の自動検証(内部・DB)・§2 SEED・§6 down.sql は **ee側テーブル `dtb_product_tag_sales_analysis`** を参照する（期待値はpf-oracleでもDB検証は実走ee側を見る）。ee テーブルには行の識別列（id・作成順）が無いため取込前後の更新順序は観測できず、差分更新と置換を最終集合だけでは区別できないため bound期待は最終集合一致に限定する。

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 6候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。テストIDは `E2E-M0329C-NNN`。
- **拒否経路は各単一入力・単一判定**: 商品ID不存在(C-003→product.not_exists)・タグマスタ不存在(C-004→data.not_registered)を別ケースに分離。ヘッダ/列数/maxrow/redirect提示は母集合アンカーがpf現行と食い違うためTBDまたはdocumentation-only（§9）。
- **DB検証（B9・スナップショット比較）**: 実走SUTの ee `dtb_product_tag_sales_analysis` について、成功系は更新対象外商品の不変のみ、異常系は対象・センチネル・更新対象外の不変を比較する（対象商品の最終集合一致・成功メッセージ・履歴増分など画面で観測できる値はDBで再検証しない）。
- **breakAll/skipRow一意化**: 中断系（C-003 商品不存在／C-004 タグマスタ不存在）は後続に正常センチネル行を加えた2行CSVで、2行目が処理されない（センチネルのタグ不変）ことをDBで確認しbreakAllをskipRowと一意判定する。
- 操作手順は純UI操作。内部判定は手順に書かず期待の「自動検証(内部・DB)」へ。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-001	IT-20	モーダル	P2	「CSVファイルのアップロード」押下時に送信前確認ダイアログは表示されない	ログイン済(SEED-M01-ADMIN)／SEED-M0329-TARGETS／SEED-M0329-VALIDREPLACE	正常置換CSVファイル	1. ファイルを選択し「CSVファイルのアップロード」ボタンを押下する 2. 押下時に送信前の確認ダイアログ（モーダル）が表示されずそのまま送信されることを確認	「CSVファイルのアップロード」ボタン押下時に送信前の確認ダイアログ（モーダル）は表示されずそのまま送信される [L1:L1-M0329-003; fixture:SEED-M0329-VALIDREPLACE@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-002	IT-26	取込成功	P1	正常CSVで対象商品の売上分析タグが全置換され成功メッセージ・履歴新行・タグ集合反映を確認する	ログイン済／SEED-M0329-TARGETS／SEED-M0329-VALIDREPLACE	既存商品ID＋実在タグID複数（カンマ区切り）の1データ行CSV（対象商品は事前に別タグ集合が紐付いている）	1. ファイルを選択し「CSVファイルのアップロード」を押下する 2. 画面に成功メッセージ「商品登録CSVファイルをアップロードしました。」が表示されエラー表示が無いことを確認 3. アップロード画面下部の取込履歴テーブルに新しい行(ファイル名・日時・作業者)が1件増えたことを確認 4. 対象商品の商品編集画面を再表示し、事前に紐付いていた売上分析タグが無くなりCSVに列挙したタグID集合が紐付いていること(集合一致)を確認	正常取込時は当該商品の売上分析タグの最終的な紐付けがCSV列挙タグID集合と一致し、成功メッセージ「商品登録CSVファイルをアップロードしました。」が管理画面上部に表示されエラーは出ない。取込履歴テーブルに新規1行が増え、対象商品を商品編集画面で再表示すると売上分析タグ集合がCSV列挙タグID集合と一致する ／ 自動検証(内部・DB): db.ts で更新対象外の別商品の dtb_product_tag_sales_analysis のタグ集合が取込前後で不変であることのみ確認する（対象商品の最終集合一致と取込履歴の増分は画面で確認済みのためDBで再検証しない） [L1:L1-M0329-009,L1-M0329-010,L1-M0329-014; fixture:SEED-M0329-VALIDREPLACE@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-003	IT-22	存在検証	P1	商品ID不存在の行で全体中断し後続の正常行も処理されない（breakAll）	ログイン済／SEED-M0329-TARGETS／SEED-M0329-BADPRODUCT	2データ行CSV。1行目＝存在しない（またはdel_flgで論理削除済みの）商品ID＋実在タグ、2行目＝正常センチネル行（実在するセンチネル商品ID＋実在タグ・センチネル商品は事前に別タグ集合が紐付く）	1. 2行CSVを選択し「CSVファイルのアップロード」を押下する 2. 画面に商品不存在エラーが表示され成功メッセージが出ず履歴が増えないことを確認 3. 2行目のセンチネル商品を商品編集画面で再表示しタグ集合が変更されていないことを確認	1行目の商品実在チェック（dtb_product を del_flg 未削除で照会）で見つからず「該当行の 商品ID ではデータを取得できません。」を表示し全体中断（breakAll）する。実装はbreakAllのため後続の2行目（正常センチネル行）は処理されずセンチネル商品のタグは変更されない（もし行スキップ〔skipRow〕なら中断フラグが立たず取込が成功扱いとなり2行目のタグ更新がコミットされてセンチネル商品のタグが変わるが、breakAllは以降行を打ち切りロールバックするため変わらない＝この差でbreakAllとskipRowを一意判定）。成功メッセージは出ず取込履歴に新行が増えずタグ置換もされない ／ 自動検証(内部・DB): db.ts で2行目センチネル商品の dtb_product_tag_sales_analysis タグ集合が事前と不変であること（breakAllで未処理＝skipRowなら更新されるはずの差）、1行目対象商品と更新対象外商品のタグも不変、dtb_csv_import_history が不変であることを確認 [L1:L1-M0329-008,L1-M0329-011; fixture:SEED-M0329-BADPRODUCT@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-004	IT-22	マスタ存在検証	P1	売上分析タグがマスタに存在しない行で全体中断し後続の正常行も処理されない（breakAll）	ログイン済／SEED-M0329-TARGETS／SEED-M0329-BADTAG	2データ行CSV。1行目＝実在商品ID＋mtb_tag_sales_analysis に存在しないタグID、2行目＝正常センチネル行（実在するセンチネル商品ID＋実在タグ・センチネル商品は事前に別タグ集合が紐付く）	1. 2行CSVを選択し「CSVファイルのアップロード」を押下する 2. 画面にマスタ不存在エラーが表示され成功メッセージが出ず履歴が増えないことを確認 3. 2行目のセンチネル商品を商品編集画面で再表示しタグ集合が変更されていないことを確認	1行目の売上分析タグ(ID)がマスタ照合で見つからず「売上分析タグ(ID) : 該当値 がマスターから取得できません。」を表示し全体中断（breakAll）する。実装はbreakAllのため後続の2行目（正常センチネル行）は処理されずセンチネル商品のタグは変更されない（もし行スキップ〔skipRow〕なら中断フラグが立たず取込が成功扱いとなり2行目のタグ更新がコミットされてセンチネル商品のタグが変わるが、breakAllは以降行を打ち切りロールバックするため変わらない＝この差でbreakAllとskipRowを一意判定）。成功メッセージは出ず取込履歴に新行が増えずタグ置換もされない ／ 自動検証(内部・DB): db.ts で2行目センチネル商品の dtb_product_tag_sales_analysis タグ集合が事前と不変であること（breakAllで未処理＝skipRowなら更新されるはずの差）、1行目商品と更新対象外商品のタグも不変、dtb_csv_import_history が不変であることを確認 [L1:L1-M0329-022,L1-M0329-011; fixture:SEED-M0329-BADTAG@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-005	IT-26	取込成功	P1	タグ列が空のCSVで対象商品の売上分析タグ紐付けがすべて削除される	ログイン済／SEED-M0329-TARGETS／SEED-M0329-EMPTYTAG	事前にタグ集合が紐付く既存商品IDのみ・タグ列が空の1データ行CSV	1. タグ列が空のCSVを選択し「CSVファイルのアップロード」を押下する 2. 画面に成功メッセージが表示されエラーが無いことを確認 3. 対象商品の商品編集画面を再表示し売上分析タグ紐付けが0件（すべて削除）になっていることを確認	タグ列が空（未入力）でも列検証は通り取込が成立し、当該商品の売上分析タグ紐付けはすべて削除され0件になる。成功メッセージが表示され取込履歴が1件増える ／ 自動検証(内部・DB): db.ts で更新対象外商品の dtb_product_tag_sales_analysis のタグ集合が取込前後で不変であることのみ確認する（対象商品0件と取込履歴の増分は画面で確認済みのためDBで再検証しない） [L1:L1-M0329-009,L1-M0329-020; fixture:SEED-M0329-EMPTYTAG@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-006	IT-12	履歴条件	P1	取込履歴はエラーなく完了した成功時のみ1件増える	ログイン済／SEED-M0329-TARGETS／SEED-M0329-VALIDREPLACE／SEED-M0329-BADPRODUCT	正常CSV（正常置換）とエラーCSV（商品ID不存在）の2ファイル	1. 正常CSVを取込みアップロード画面下部の取込履歴テーブルに新行が1件増えることを確認 2. エラーCSVを取込み取込履歴テーブルに新行が増えないことを確認	取込がエラーなく完了したときだけ画面下部の取込履歴テーブルに新行が1件増え、エラーを含む取込では取込履歴テーブルに新行が増えない（いずれもアップロード画面下部の取込履歴テーブルで確認・履歴増分は画面で観測できるためDBでは再検証しない） [L1:L1-M0329-010; fixture:SEED-M0329-VALIDREPLACE@TBD-D5,SEED-M0329-BADPRODUCT@TBD-D5]				
m03-29_admin_product_product_tag_sales_analysis_csv_import	E2E-M0329C-007	IT-22	レコード数上限	P1	改行数が上限以上のCSVは取込処理に入らずエラーになりDBは変わらない	ログイン済／SEED-M0329-TARGETS／SEED-M0329-MAXROWS	改行数が上限(5010)以上のCSVファイル	1. 改行数が上限以上のCSVを選択し「CSVファイルのアップロード」を押下する 2. 画面に取込を受け付けないエラーが表示されることを確認 3. 取込が行われずタグ紐付けも取込履歴も変わらないことを確認	改行数が上限(5010)以上のCSVはレコード数上限チェックで弾かれ、取込処理に入らずエラーが表示され取込は行われない（表示される具体的な文言・送信後の遷移方式は本ケースの対象外＝別途確認）。対象商品・更新対象外商品の売上分析タグ紐付けおよび取込履歴は変わらない ／ 自動検証(内部・DB): db.ts で対象商品・更新対象外商品の dtb_product_tag_sales_analysis と dtb_csv_import_history が取込前後で不変であることを確認 [L1:L1-M0329-004,L1-M0329-011; fixture:SEED-M0329-MAXROWS@TBD-D5]				
```

---

## §5 ja/en locale対応表（LS=0の実確認）

- **現行踏襲の正はpf現行**。pf現行メッセージのLSはキー別に実確認した（全てen資源なし＝LS=0）。**pf plugin には message.en.yml が存在する**（`app/Plugin/HareruyaEc/Resource/locale/message.en.yml`・1159行）が、CSV取込エラーキー（下記）と成功キーは en 側に定義が無い（en に `admin.csv.error` ブロック無し・grep 0件）。pf core `src/Eccube/Resource/locale/` は message.ja.yml のみで en 不在。
- 成功 `admin.product.csv_import.save.complete`（L1-014）: ja「商品登録CSVファイルをアップロードしました。」（pf core message.ja.yml:133）／en無し＝LS=0。
- ヘッダ行 `format.header`（L1-005）: ja「CSVのフォーマットが一致しません。」（pf plugin message.ja.yml:1100）／en無し＝LS=0。
- 列数 `format.body`（L1-006）: ja「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」（:1101）／en無し＝LS=0。
- 必須 `data.require`（L1-007）: ja「%s は必須項目です。 %d 行目のデータを確認してください。」（:1113）／en無し＝LS=0。
- タグマスタ不存在 `data.not_registered`（L1-022）: ja「%s : %s がマスターから取得できません。 %d 行目のデータを確認してください。」（:1115）／en無し＝LS=0。
- 商品不存在 `product.not_exists`（L1-008）: ja「%d 行目の %s ではデータを取得できません。」（:1144）／en無し＝LS=0。
- 数値形式 `product.over_zero`（L1-021）: ja「%d 行目の %s は0以上の数値を設定してください。」（:1146）／en無し＝LS=0。
- maxrow `maxrecord`（L1-004）: ja「%d 行を超えるCSVファイルは登録できません。」（:1097）／en無し＝LS=0（かつ文言解決不確定でL1-004はTBD）。
- **参考（EE側・別キーでpf現行と非一致）**: ee は成功キー `admin.register.complete` 等でpf現行と異なる。刷新後にどのキー体系を採るか（enが付くか）はD6決裁事項でありpf現行bound claimのLSには反映しない。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: pf現行アップロード画面（`csv_product_tag_sales_analysis_update.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET/POST /%eccube_admin_route%/product/product_tag_sales_analysis_update_csv_upload`）を再利用。期待値はL1解決器経由。
- 取込結果は成功メッセージ/errors DOM＋取込履歴テーブルDOMを目視（主）。取込効果は対象商品を商品編集画面で再表示しタグ集合を確認。
- DB検証（B9・スナップショット）: db.ts で実走SUTの ee `dtb_product_tag_sales_analysis`（更新対象外商品ID・異常系では対象/センチネル/更新対象外）と `dtb_csv_import_history` を比較（総件数比較のみに依存せず・画面確認済みの値はDB再検証しない）。
- **後始末**: 正常/タグ空CSVを実送信しDBを変更するC-001/C-002/C-005/C-006は .down.sql で ee `dtb_product_tag_sales_analysis` と `dtb_csv_import_history` をSEED状態へ復元。C-003/C-004/C-007はDB不変で復元不要。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は M0成果物として未実装。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001 | Playwright（GUI） | 画面（DOM） | 送信前確認ダイアログなし。正常CSV送信のため後始末で復元 |
| C-002,C-005 | Playwright＋DB確認 | 画面＋DB（更新対象外のみ） | 正常取込＝タグ最終集合一致／タグ空→全削除・成功メッセージ・履歴+1は画面確認。DBは更新対象外不変のみ（画面確認済みはDB再検証しない）。後始末で復元 |
| C-003,C-004,C-007 | Playwright＋DB確認 | 画面（エラー）＋DB（不変） | 商品不存在/タグマスタ不存在/レコード数上限の否定的事実（対象・対象外・センチネルとも不変）を ee dtb_product_tag_sales_analysis スナップショットで確認 |
| C-006 | Playwright（GUI） | 画面（履歴+1/不変） | 履歴は成功時のみ+1・エラー時不変を取込履歴テーブルで確認（画面観測可能でDB再検証しない） |

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて期待テキスト実内容＋前提条件による。汎用スタブはexcluded（Gate B15）。母集合の要求挙動がEE固有でpf現行と食い違う行はTBD（redirect/pagination/fileラベルJS/maxrow文言/並行変化）。

### 集計（96 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **10** | 下表（7ユニーク候補ケース。B12共有〔完全重複・同一実行〕で母集合10行→tsv7行） |
| **TBD** | **16** | pf/ee食い違い〔redirect/エラー提示: -019,-031,-035,-052,-085,-086,-093,-095,-096／pagination: -003,-094／fileラベルJS: -005／maxrow文言: -084〕＋並行変化〔-013,-046,-079〕。§9.1 |
| **excluded** | **70** | 汎用スタブ・非該当観点・内部注記・プレースホルダ・幻ラベルMSG・Twig継承(観測不能)。§9.3 |
| 合計 | **96** | 欠番0・理由なし重複0 |

> 会計: bound 10／TBD 16／excluded 70（=96・欠番0）

- 候補ケース総数 **7**（C-001〜C-007）。
  - C-001←-006（送信前確認ダイアログなし）
  - C-002←-012/-045/-078（正常取込＝タグ全置換＋履歴INSERT＋成功メッセージ「商品登録CSVファイルをアップロードしました。」）
  - C-003←-050/-083（商品ID不存在→product.not_exists breakAll・全体ロールバック）
  - C-004←-082（売上分析タグ マスタ不存在→data.not_registered breakAll・全体ロールバック）
  - C-005←-081（タグ列空→当該商品の紐付け全削除）
  - C-006←-088（履歴はエラーなく完了時のみ+1）
  - C-007←-018（改行数が上限5010以上→取込処理に入らずエラー・DB不変。粗い「エラー・未完了」のみbound。文言/遷移方式は-084でTBDに分離）
- **breakAll/skipRow一意化**: 本機能は各列検証失敗・商品ID不存在・タグマスタ不存在ともbreakAll（skipRow経路は一次資料に無い）。中断系候補（C-003 商品不存在／C-004 タグマスタ不存在）は後続に正常センチネル行を加えた2行CSVで、2行目が処理されない（センチネルのタグ不変）ことをDBで確認しbreakAllをskipRowと一意判定する。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（26件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -003 | 未認証 | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -005 | 出力抑止 | JS挙動（ファイル選択表示＝食い違いTBD） | L1-016 |
| -006 | 識別子 | モーダル（送信前確認ダイアログなし） | L1-003 |
| -012 | 文字列長バリデーション | 実行結果（DB副作用: タグ置換） | L1-009 |
| -013 | 相関バリデーション | データ整合性（並行変化は確定しない＝TBD） | L1-023 |
| -018 | DBとの相関バリデーション | レコード数上限（改行数上限以上→取込前エラー） | L1-004 |
| -019 | 部分入力 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -031 | 実行結果 | 画面遷移（エラー提示方式＝食い違いTBD） | L1-013 |
| -035 | 更新内容 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -045 | 削除条件 | 実行結果（DB副作用: タグ置換） | L1-009 |
| -046 | 削除条件 | データ整合性（並行変化は確定しない＝TBD） | L1-023 |
| -050 | 実行結果 | バリデーション（商品存在→ロールバック） | L1-008 |
| -052 | 実行結果 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -078 | ロールバック | 実行結果（DB副作用: タグ置換） | L1-009 |
| -079 | 画面レイアウト | データ整合性（並行変化は確定しない＝TBD） | L1-023 |
| -081 | 画面レイアウト | 実行結果（タグ空→全削除） | L1-009 |
| -082 | 画面レイアウト | バリデーション（タグマスタ存在→ロールバック） | L1-022 |
| -083 | 画面レイアウト | バリデーション（商品存在→ロールバック） | L1-008 |
| -084 | 画面レイアウト | メッセージ／画面遷移（行数上限・文言はTBD） | L1-004 |
| -085 | 画面レイアウト | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -086 | 一覧 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -088 | 画面表示データ | 履歴（エラーなく完了時のみ+1） | L1-010 |
| -093 | 非同期更新 | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -094 | エラー継続 | ページネーション（履歴の件数切替＝食い違いTBD） | L1-015 |
| -095 | 公開コンテンツ | 画面遷移（送信後の再表示方式＝食い違いTBD） | L1-013 |
| -096 | データ正当性 | 画面遷移（エラー提示方式＝食い違いTBD） | L1-013 |

### 96対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が一致（汎用スタブ＋非該当: 取込機能に出力失敗なし） | excluded | — |
| 002 | CSRFのファイル出力内容が一致（汎用スタブ・CSRFは一次資料に固有規定なし） | excluded | — |
| 003 | 取込履歴一覧の表示件数の切り替えとページ保持の方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 004 | csv_tag_sales_analysis.twig が base_csv_upload.twig を継承（Twig継承は観測不能・EEテンプレート名でPF現行と不一致・構成要素はドキュメントのみ） | excluded | — |
| 005 | ファイルを選んだときの画面上のファイル名表示の仕方が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 006 | 送信前の確認ダイアログを表示せずそのまま送信する | bound | C-001 |
| 007 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提 幻ラベル M03-29-MSG-001） | excluded | — |
| 008 | エラーを表示し画面に遷移（前提 幻ラベル M03-29-MSG-002・汎用画面遷移） | excluded | — |
| 009 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提 幻ラベル M03-29-MSG-003） | excluded | — |
| 010 | 必須バリデーションでエラー表示され完了しない（前提 幻ラベル M03-29-MSG-004・対象項目不定） | excluded | — |
| 011 | 必須バリデーションでエラー表示されず継続（前提 幻ラベル M03-29-MSG-005・自己矛盾） | excluded | — |
| 012 | CSVで指定された売上分析タグID集合がその商品の最終的な紐付けになる（タグ全置換） | bound | C-002 |
| 013 | 前提「マスタ側の削除との競合」＝取込検証中にマスタが並行変化した場合の整合は本書では確定せず実機で確認する必要がある | TBD | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ・タグ列空はC-005で被覆） | excluded | — |
| 016 | 相関バリデーションでエラー表示され完了しない（汎用スタブ・タグ不存在はC-004で被覆） | excluded | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・商品不存在は継続でなくエラー＝自己矛盾） | excluded | — |
| 018 | 改行数が上限(5010)以上のCSVは取込処理に入らずエラーになり取込が完了しない（粗い挙動をbound・表示文言/遷移は-084でTBD） | bound | C-007 |
| 019 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ・具体値未指定＝C-002で被覆） | excluded | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-003の中断で被覆） | excluded | — |
| 022 | 登録内容の対象レコードが追加される（汎用スタブ・履歴はC-006で被覆） | excluded | — |
| 023 | 当機能の登録・更新で対象テーブルを直接保存する（内部処理注記・単一観測挙動でない） | excluded | — |
| 024 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 025 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 026 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 027 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 028 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 029 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ） | excluded | — |
| 031 | アップロード送信でのエラー内容をどう見せるか（画面内一覧かフラッシュか・遷移方式）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-002で被覆） | excluded | — |
| 033 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 034 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 035 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 036 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 037 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 038 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 039 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 040 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提 幻ラベルMSG-001） | excluded | — |
| 041 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提 幻ラベルMSG-002） | excluded | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提 幻ラベルMSG-003） | excluded | — |
| 043 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提 幻ラベル M03-29-MSG-004） | excluded | — |
| 044 | 完了メッセージを表示し画面に遷移（前提 幻ラベル M03-29-MSG-005・汎用画面遷移） | excluded | — |
| 045 | CSVで指定された売上分析タグID集合がその商品の最終的な紐付けになる（タグ全置換） | bound | C-002 (shared) |
| 046 | 取込検証中にマスタが並行して変化した場合の整合は本書では確定しないため実機で確認する必要がある | TBD | — |
| 047 | フォームキー admin_csv_import[import_file] の内部注記（単一観測挙動でない） | excluded | — |
| 048 | 削除条件の対象レコードが削除状態にならない（汎用スタブ・タグ空→全削除とは逆＝自己矛盾） | excluded | — |
| 049 | 実行結果の対象レコードが削除状態になる（汎用スタブ＝タグ削除はC-005で被覆） | excluded | — |
| 050 | 存在しない商品IDの行は全体中断しエラーになる（全体ロールバック） | bound | C-003 |
| 051 | 実行結果の対象レコードが削除状態になる（汎用スタブ） | excluded | — |
| 052 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 053 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 054 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | excluded | — |
| 055 | フォーマット定義でエラー表示され完了しない（汎用スタブ・観測対象未定義） | excluded | — |
| 056 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 057 | 実行結果のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 058 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 059 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 060 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 061 | 出力内容のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 062 | 出力内容でエラー表示されず継続（汎用スタブ） | excluded | — |
| 063 | 削除の該当レコードが含まれない（削除は本機能に非該当） | excluded | — |
| 064 | 移動・リネームの該当レコードが含まれない（非該当） | excluded | — |
| 065 | コピーのファイル出力内容が一致（非該当） | excluded | — |
| 066 | ファイル登録のファイル出力内容が一致（汎用ファイルスタブ・成否はC-002/C-003/C-004で被覆） | excluded | — |
| 067 | ファイル出力のファイル出力内容が一致（出力は本機能に非該当） | excluded | — |
| 068 | JSONのファイル出力内容が一致（非該当） | excluded | — |
| 069 | 同名ファイルのファイル出力内容が一致（非該当） | excluded | — |
| 070 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | excluded | — |
| 071 | 配置先の該当レコードが含まれる（非該当） | excluded | — |
| 072 | スキーマのファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 073 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提 幻ラベル M03-29-MSG-001） | excluded | — |
| 074 | エラーを表示し画面に遷移（前提 幻ラベル M03-29-MSG-002・汎用画面遷移） | excluded | — |
| 075 | 更新抑止のファイル出力内容が一致（汎用ファイルスタブ・前提 幻ラベルMSG-003） | excluded | — |
| 076 | 母集合期待が『要ソース確認』の出所未確認プレースホルダ（前提 幻ラベル M03-29-MSG-004） | excluded | — |
| 077 | 完了メッセージを表示し画面に遷移（前提 幻ラベル M03-29-MSG-005・汎用画面遷移） | excluded | — |
| 078 | CSVで指定された売上分析タグID集合がその商品の最終的な紐付けになる（タグ全置換） | bound | C-002 (shared) |
| 079 | 取込検証中にマスタが並行して変化した場合の整合は本書では確定しないため実機で確認する必要がある | TBD | — |
| 080 | フォームキー admin_csv_import[import_file] の内部注記（単一観測挙動でない） | excluded | — |
| 081 | タグ列が空のとき検証は通りその商品の売上分析タグ紐付けはすべて削除される | bound | C-005 |
| 082 | 存在しない売上分析タグIDでマスタ不存在エラーとなり全体ロールバックする | bound | C-004 |
| 083 | 存在しない商品IDで商品不存在エラーとなり全体ロールバックする | bound | C-003 (shared) |
| 084 | 上限行数を超えるCSVを弾く際に画面へ表示される文言は、実機で解決される実際のメッセージを確認するまで確定できない | TBD | — |
| 085 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 086 | アップロード送信でエラーをどう見せるか（画面内一覧かフラッシュか・遷移方式）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 087 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 088 | 取込がエラーなく完了したときだけ取込履歴が1件増える | bound | C-006 |
| 089 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 090 | 売上分析タグ(ID)列は任意（性質記述・観測可能な結果でなくC-005が実挙動を被覆） | excluded | — |
| 091 | 到達できる管理者は実装処理を実行できる（汎用・具体観測対象なしvague） | excluded | — |
| 092 | ファイル選択のファイル出力内容が一致（汎用ファイルスタブ） | excluded | — |
| 093 | アップロード送信後の遷移先（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 094 | 取込履歴一覧の表示件数の切り替えとページ保持の方法が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 095 | アップロード送信後に結果画面をどう再表示するか（同じ画面を出し直すか改めて開き直すか）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |
| 096 | アップロード送信でエラーをどう見せるか（画面内一覧かフラッシュか・遷移方式）が現行仕様と刷新仕様で異なり、確定した挙動を実機で確認する必要がある | TBD | — |

`func_scope_check` 判定: 親96/96会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝16件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い: 送信後の画面再表示・エラー提示 | -019,-031,-035,-052,-085,-086,-093,-095,-096 | 9 | pf現行は render(HTTP200・同一画面再描画・エラーは画面内列挙)、EEは302 redirect＋addErrorフラッシュ。母集合期待「常にリダイレクト／フラッシュしリダイレクト」はPF現行と一致せずD6確定待ち（L1-013） |
| pf/ee食い違い: 履歴の件数切替・ページ保持 | -003,-094 | 2 | pf現行はセッションによる件数切替を持たず最新100件表示、EEは件数/ページ番号をセッション保存。母集合期待はPF現行に存在せずD6確定待ち（L1-015） |
| pf/ee食い違い: ファイル選択の画面表示 | -005 | 1 | pf現行は素のファイル入力+spinner、EEは選択ファイル名のカスタム表示。母集合期待はPF現行に存在せずD6確定待ち（L1-016） |
| 文言不確定: 行数上限メッセージ | -084 | 1 | 行数上限を弾く際の表示文言は pf plugin locale が %d 表記で画面表示の実文言を実機確認まで確定不能（L1-004。上限で弾く挙動自体は実在） |
| 並行変化: マスタ並行削除時の整合 | -013,-046,-079 | 3 | タグマスタを検証開始時に一括ロードするため、取込検証中の並行変化（前提「マスタ側の削除との競合」）時の整合は一次資料が『確定しない』とし固定オラクルを与えられず要実機（L1-023） |

（合計 9+2+1+1+3 = 16）

### 9.2 要実機・documentation-only

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureファイルの実バイト内容（2列・ヘッダ行なし・列数不一致・カンマ区切りタグ） | fixture manifest（D5型）未整備＝要実機 |
| L1-001/002（画面表示・テンプレ構成）・L1-005（ヘッダformat）・L1-006（列数）・L1-007（商品ID必須）・L1-012（静的表）・L1-021（商品ID数値形式） | 母集合に一意判定できる固有要求行が無い＝documentation-only（必須系010/011は幻ラベルMSG前提で対象不定・redirect提示食い違い行はTBD） |
| 支店連携（BranchUpdateService->noticeProductUpdate）・L1-019（重複タグID→array_unique一意化）・L1-020（タグ任意）・L1-017（一時ファイル）・L1-018（ログ） | pf現行の取込成功時副作用/内部処理で外部観測手段未契約＝documentation-only（handler:53-67・repository:287-292・CsvImporter:76-95・controller:773-782） |
| pf/ee食い違い（redirect/pagination/fileラベルJS/maxrow文言/並行変化）のD6決裁 | 現行踏襲でpf現行を正とするか刷新でee挙動を正とするかは発注者判断＝TBD |

### 9.3 excluded＝70件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能・EEテンプレ名不一致）** | -004 | 継承そのものは判定不能＋EEテンプレート名でpf現行は csv_product_tag_sales_analysis_update.twig |
| **【B15③】幻ラベルMSG前提のプレースホルダ/汎用遷移** | -007,-008,-009,-010,-011,-040,-041,-042,-043,-044,-073,-074,-075,-076,-077 | 前提が実在しない M03-29-MSG-001〜005。期待は要ソース確認/汎用エラー遷移/汎用DB操作で固有挙動なし |
| **【B15②/④】汎用「登録/更新内容が追加/変更される・されない」スタブ（C-002/C-003で被覆）** | -020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-051 | 対象レコード・具体値未指定 |
| **【B15②】「エラー表示されず継続」/汎用「実行結果一致」（観測対象未定義）** | -014,-015,-016,-017,-054,-055,-062,-087,-089 | 具体的観測対象を母集合が指定せず内容空虚。-017/-048は自己矛盾（-013はTBD・-018はC-007へbound是正済） |
| **【B15②】汎用ファイル出力スタブ** | -001,-002,-053,-056,-057,-058,-059,-060,-061,-066,-092 | 一致基準を母集合が持たず内容空虚。取込機能に出力失敗/CSRF固有規定なし |
| **【B7】ファイル/レコード操作系（非該当）** | -063,-064,-065,-067,-068,-069,-070,-071,-072 | 削除/移動/コピー/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ＝取込機能に該当なし |
| **【B15②】内部処理注記/性質記述/vague** | -023,-047,-048,-049,-080,-090,-091 | 直接保存注記・フォームキー注記・タグ空逆記述(自己矛盾)・削除状態記述(C-005被覆)・タグ任意の性質記述・到達管理者vague＝当機能の観測可能な単一挙動でない |

## §10 特記事項

1. **Ph2=no の通常対象**: superseded=yes（M03-28へ統合方向）だが Ph2=no のため Phase1実行ケースを持つ。POC `_poc2_m03-29.md` RG-M03-29-033 P1「DELETE後INSERTで置換」等を C-002/C-005 で具体化。
2. **母集合はEE志向・オラクルはpf現行**: 母集合の期待テキストはee詳細設計由来（route `product/tag_sales_analysis/csv_upload`・HTTP302 redirect・ADMIN_CSV_IMPORT_MAX_ROWS・EEテンプレ名）で記述されているが、機能区分=現行踏襲のため **オラクルはpf現行実装**（route `product_tag_sales_analysis_update_csv_upload`・POST後render200・CSV_IMPORT_MAX=5010）。redirect/pagination/fileラベル/maxrow文言はpf/ee食い違いでTBD（L1-013/015/016/004）。
3. **M03-28との差2点（実ソース照合）**: (a) タグ列マスタ検証が `TagSalesAnalysisIdValidator`（mtb_tag_sales_analysis）で母集合082が固有アンカー＝C-004でbound（M03-28ではtag検証doc-only）。(b) `replaceTagSalesAnalyses` が array_unique で重複タグ除去（L1-019）。M03-28の`dtb_product_tag` foreach重複挿入とは逆。
4. **成功メッセージは実PF値**: `admin.product.csv_import.save.complete`＝pf core message.ja.yml:133＝「商品登録CSVファイルをアップロードしました。」で確定（L1-014・C-002でbound）。ログ文言は「売上分析タグ更新CSV登録開始」「売上分析タグ更新 正常終了」「売上分析タグ更新 異常終了」（controller:773,782,779）だが外部観測不能でdoc-only（L1-018）。
5. **breakAll/skipRow一意化**: 中断系候補（C-003 商品不存在／C-004 タグマスタ不存在）は1データ行では breakAll と skipRow を観測上区別できないため、後続に正常センチネル行を加えた2行CSVにした。実装は onValidateRow の失敗で breakAll（BaseCsvImportHandler:57-64,79／Handler:74-88,136-181,22行のタグ検証）＝以降行を打ち切るため、2行目センチネル商品のタグが更新されない（breakAllで未処理・ロールバック）／更新される（skipRowで処理・コミット）の差でbreakAllとskipRowを一意判定する（本実装はbreakAll）。
6. **タグ空→全削除**: C-005 は insertTagSalesAnalyses が empty(tagIds) で早期returnする（DtbProductSubRepository:324-329）ため、タグ列空は DELETEのみ実行され当該商品の紐付けが0件になる pf現行挙動をbound（L1-009,020）。
7. **DB検証（B9スナップショット）**: C-002/C-005 は実走SUT ee `dtb_product_tag_sales_analysis` で更新対象外商品の不変のみをDB確認し、対象商品の最終集合一致・成功メッセージ・履歴増分は画面で確認する（画面で確認済みの値はDBで再確認しない）。商品編集画面のタグ表示順は観測できないため集合一致で判定。
8. **確認モーダル極性**: pf現行 base_csv_upload.twig に confirm 記述なし＝送信前確認ダイアログなし。L1-003 bound（C-001）。Excel sheet-17（0204:L4458）もモーダルを規定しない。
9. **codex Gate C R1 Major5件是正（2026-07-29）**: (1)[B9] DB検証・SEED・down.sql は実走SUTの ee `dtb_product_tag_sales_analysis`（product_id, tag_sales_analysis_id・ee ProductRepository:1402-1450）を参照へ是正（期待値はpf-oracleのまま）。(2)[B9] 画面確認済み値のDB再検証を排除＝C-002/C-005のDB検証は更新対象外不変のみ・C-006は画面のみ（履歴増分は画面観測可能）。置換はee側に行の識別列が無く最終集合だけでは差分更新と区別できないため bound期待を最終集合一致に限定。異常系（C-003/C-004/C-007）のDB不変確認は維持。(3)[B15] -013（前提「マスタ側の削除との競合」＝並行変化）を excluded→**TBD**、-018（改行数上限以上→取込前エラー・粗い挙動）を excluded→**bound C-007**（文言/遷移は-084でTBD分離）。会計 bound9→10・TBD15→16・excluded72→70。(4)[後始末] 正常CSVを実送信しDBを変える C-001 を復元対象に追加（C-001/002/005/006 復元・C-003/004/007 不変）。(5)[ロールバックL1] L1-011 の核心（トランザクション境界）を CsvImporter.php:225(beginTransaction)・272-276(isSuccessful→commit/rollback)・291(例外時rollback) の file:line で md/oracle 双方に追加。
10. **codex Gate C R2 Major1件是正（B9伝播漏れ・2026-07-29）**: R1のB9是正が§4/§10/§1/§3/§6/oracleへ完全伝播しておらず旧テーブル名・置換の具体化記述・画面確認済み値のDB再検証記述が残存していたため、全セクション＋oracle.jsonで (a) 売上分析タグ置換テーブルの記載を実走SUT/ee正 `dtb_product_tag_sales_analysis` へ統一（pf側の置換ロジックは source 欄の file:line 引用のみで表現）、(b) 画面で観測できる値（対象商品の最終集合・成功メッセージ・履歴増分）のDB再検証記述を除去しDB確認を更新対象外不変・異常系ロールバックに限定、(c) 置換の具体化記述を「最終集合一致」へ統一（ee側に行の識別列が無く差分更新と区別不可）に一括是正した。旧テーブル名・置換手順の逐次記述・DB再検証重複の残存0をgrepで確認。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound/TBD行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（26件）。** 汎用スタブは別要件へ置換しないため観点補正に含めない（該当行はexcluded）。

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 003 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 005 | JS挙動 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 006 | モーダル | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 012 | 実行結果 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 013 | データ整合性 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 018 | レコード数上限 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 019 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 031 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 035 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 045 | 実行結果 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 046 | データ整合性 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 050 | バリデーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 052 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 078 | 実行結果 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 079 | データ整合性 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 081 | 実行結果 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 082 | バリデーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 083 | バリデーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 084 | メッセージ／画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 085 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 086 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 088 | 履歴 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 093 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 094 | ページネーション | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 095 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
| 096 | 画面遷移 | 期待テキスト実内容が観点と不一致（詳細は§8.1） |
