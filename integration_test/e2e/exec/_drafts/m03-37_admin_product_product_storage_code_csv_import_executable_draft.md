# 候補: m03-37 略称タグ更新CSV登録（商品略称タグ更新・取込/インポート） — 実行可能グレード候補（母集合103全量会計・重大所見=SUT未実装）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1+R2+R3 是正反映版（2026-07-29・ee/pf/Excel実ソース照合）**。機能同定（商品略称タグ更新CSV）・ee未実装はR1で承認、R2 Major5件・R3 Major2件を是正。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
>
> ## ★機能同定（R1承認）: M03-37=商品への略称タグ(storageCode)更新CSV
>
> - **M03-37（実体）**: 商品IDと略称タグ（名称）の**2列CSV**で、**商品側の略称タグID（`dtb_product_sub.storageCodeId`）を更新**する。pf `ProductCsvController::csvStorageCode`（GET画面:1331）／`csvStorageCodeUpload`（POST:1348）・GET route `admin_product_storage_code_csv_import`（`ProductServiceProvider:178`・**商品CSV管理サイドバー** `SidebarProvider:172`）／POST route `admin_product_storage_code_csv_upload`（`:181`）・`StorageCodeImportHandler`（`onValidateRow` でDB検証:87→商品存在:137→`addProductNotExistsError`+breakAll・略称タグ名を`mtb_storage_code.name`照合:157,200→`addStorageCodeNotExistsError`+breakAll・`updateProductSub`で`storageCodeId`更新:237・成功時支店連携:65）。商品ID列は`IntConverter`で整数変換（`ColumnDefinitions:61,837`／`IntConverter:16`）。5010行上限・成功キー`admin.product.csv_import.save.complete`・取込履歴type=12・`render`（PRGでない）。
> - **M03-16（別機能）**: `StorageCodeController::import`（:305）で `mtb_storage_code` マスタ自体の名称・並び順を登録する別経路。導線も別（マスタ画面 `storage_code.twig:13`→`admin_product_storage_code_csv`→`StorageCodeController`）。**M03-37の導線（商品CSV管理サイドバー→`admin_product_storage_code_csv_import`）とは別**。
> - **母集合汚染**: `all_it_cases.tsv` の M03-37母集合は、M03-16挙動を混入させた**誤ったpf-md**から機械生成されており、一部期待テキスト（`mtb_storage_code` INSERT/UPDATE・`admin.register.complete`・「略称タグCSV登録開始」・「略称タグ登録/編集画面ヘッダのCSV取込」「一覧へ戻る」導線等）はM03-16挙動を指す。本書は各行のテーマを正しいM03-37へ再解釈し、M03-16固有の導線・挙動を指す行（-093/-094 等）は§9.3でexcludedとする。汚染pf-mdはオラクル源に不使用。
>
> ## ★重大所見（本機能はSUT=ec-cube-enterpriseに未実装＝whole-feature移行ギャップ・R1承認）
>
> - **専用機能は pf(HareruyaEcプラグイン)にのみ実在**（上記file:line）。
> - **ee(SUT)には専用エントリポイントが無い**（実ソースで決定的に確認）: (a)ee route `admin_product_storage_code_csv_upload`/`_csv_import` は ee `src` に**0件**、(b)ee `csvStorageCode`/`csvStorageCodeUpload` メソッド**不在**、(c)ee専用handler（`ProductStorageCodeUpdateImportHandler`/`StorageCodeImportHandler`）**不在**（ee `Service/Csv/Importer/Event/` に ShelfNumber/Section/Status/Tag/Card 等はあるが**商品略称タグ更新handler無し**）、(d)`const PRODUCT_STORAGE_CODE_CSV_ID=12`（`ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:39`）は ee php で**使用0件**、(e)ee `ColumnDefinitions::storageCodeId`（`.../Model/ColumnDefinitions.php:312`・`略称タグ(ID)`）は `ProductCardImportHandler:371`／`ProductGoodsImportHandler:367`（**多列カード/グッズCSV**）からのみ呼ばれ専用route無し・かつ**ee側はID列**でpf M03-37は**名称列**＝形式も異なる、(f)汎用雛形 `csvTemplate`（`.../Csv/CsvImportController.php:1296-1315`）は `type∈{product,category,class_name,class_category,stock_change,department}` のみ受理し else `NotFoundHttpException`＝**type=storage_code は404**。
> - **Excel設計自身が未移植を明記**: `0204` M03-37シートの図形注釈 C7 **「この機能を使用していないためリニューアルに移行しない」**。
> - **対照（M03-40=棚番号更新はee実装済でbound）**: 兄弟の M03-40 は ee `ProductShelfNumberUpdateImportHandler`＋`PRODUCT_SHELF_NUMBER_IMPORT_CSV_ID=15`（使用あり）が実在しbound。M03-37はこれらが無く**ee未実装**＝会計が異なる。
> - **帰結**: ブラウザ経由でSUT(ee)に本ルートを発行しても404であり、母集合の各固有挙動をSUTで1回の実行でpass/fail一意判定できない（＝**bound不能**）。**pf実装挙動を期待オラクル(pf-fallback)・Excel設計を(excel)として§1に維持**するが、**本機能固有の挙動を記述する母集合行はすべてTBD**（**ee移行方針決定／ee実装後に§1のL1を根拠に再具体化**）。汎用スタブ・非該当・M03-16汚染はexcluded。**boundは0**。M03-34/M03-36/M03-44と**同カテゴリ**。
>
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  - シート「略称タグ更新CSV登録」（機能No=M03-37・機能名「略称タグ更新CSV登録」・概要「商品の略称タグ更新をCSVで行える」・作成者=大澤・作成日2025-08-03・更新者=堀部・更新日2025-09-16）。処理概要「レコード数上限チェックを実施。5010件以上はエラーとする。」「商品IDで商品情報の略称タグIDを更新する。」「インポート成功した商品IDを記し重複を避ける」。画面部品（識別ID1 ファイルを選択・2 CSVファイルのアップロード・3 略称タグ更新CSVファイルフォーマット・4 雛形ファイルダウンロード・5 件数〔10,50,100,300,500,1000,2000,10000,12000件〕・履歴ファイル名/アップロード日時/作業者・9 ページング）。図形注釈 C7「この機能を使用していないためリニューアルに移行しない」。根拠は実Excel座標 `0204:略称タグ更新CSV登録!<識別ID>` で表記。
  - シート「略称タグ更新CSVフォーマット」（機能No=M03-37）。CSVデータ列定義: 識別ID1=商品ID（主キー◯／数値(整数)／必須◯／入力例1）・識別ID2=略称タグ（文字型／必須◯／入力例POR）。`0204:略称タグ更新CSVフォーマット!識別ID1,識別ID2`。
- **期待オラクル源（pf現行挙動・source_class=pf-fallback）**: `pf-eccube3` の HareruyaEcプラグイン（現行踏襲・pf repo HEAD `4bc76955971df324965d623a4e042094e53cb285`）。
  - Controller: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvStorageCode:1331`〔GET画面〕・`csvStorageCodeUpload:1348`〔POST〕・`countCsvRows>=CSV_IMPORT_MAX:1370`・`log 開始:1377`／`異常終了:1383`／`完了:1386`・`addSuccess admin.product.csv_import.save.complete:1385`・`insertCsvImportHistory:1388`・`const CSV_IMPORT_MAX:391=5010`・`storageCodeTwig:406`・`getStorageCodeCsvHeader:2185`）。**例外専用のlog_info経路は無し**（例外は `CsvImporter:289` で再throw）。route: `ProductServiceProvider.php:178`〔GET `admin_product_storage_code_csv_import`〕／`:181`〔POST `admin_product_storage_code_csv_upload`〕。ナビ: `SidebarProvider.php:172`〔商品CSV管理サイドバー〕。
  - 取込ハンドラ: `.../Service/Csv/Importer/Event/StorageCodeImportHandler.php`（`onAfterImport支店連携:57,65`・`onValidateRow〔DB検証実施〕:79,87`・`getRowValidators空:126`・`validateProductExists:137`・`addProductNotExistsError:146`・`addStorageCodeNotExistsError:157`・`setStorageCodeId〔mtb_storage_code.name照合〕:200`・`updateProductSub〔dtb_product_sub.storageCodeId更新〕:237`）。商品ID列 IntConverter: `.../Model/ColumnDefinitions.php:61,837`／`.../Converter/IntConverter.php:16`。
  - twig: `.../Resource/template/admin/Product/csv_storage_code.twig`（共通 `base_csv_upload.twig` 継承・ボタン文言ハードコード日本語:36,47）
  - メッセージ逐語源: 成功キー `admin.product.csv_import.save.complete`=「商品登録CSVファイルをアップロードしました。」（pf core `src/Eccube/Resource/locale/message.ja.yml:133`）／`admin.csv.error.upload.maxrecord`〔`%d`→5010〕・`admin.csv.error.product.not_exists`・`admin.csv.error.storage_code.not_exists`（pf plugin MessageStore.php:204,359）
- **pf-md（汚染・不使用）**: `functions/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.md`（git hash-object `834b941ad48f90fd2f073b4565e6e9ae3c7eefef`）は本文がM03-16（`mtb_storage_code`マスタ登録）挙動を混入させた**汚染ドキュメント**でオラクル源に**不使用**。オラクルは**pf実source＋Excel設計**を正とする。
- **source_class純度（R2是正）**: 全14 L1 claim=**excel**（3=L1-001/003/004＝画面部品・CSVフォーマット・処理概要の**Excel逐語のみ**）または**pf-fallback**（11＝route/ナビ/変換/検証/書込等のpf実装事実）。**route・ナビ・IntConverter変換はexcel claimから除去しpf-fallback claimへ分離**（1claim1source）。EE-source 0。
- **en（★機械検証済み・全message claim LS=0）**: 成功キー `admin.product.csv_import.save.complete`・取込系エラーキー（`product.not_exists`/`storage_code.not_exists`/`upload.maxrecord`）は pf en・ee en いずれも0件（grep）。画面文言は pf plugin `base_csv_upload.twig` にハードコード日本語（trans未使用:36,47）。→ **全L1 claim LS=0**。§5にgrep根拠。
- **判定原則**: 母集合の観点/前提ラベルはノイズ（機械生成・汚染pf-md由来）。分類は各行の「期待結果」実テキストのテーマを**正しいM03-37**へ再解釈して判定する。**本機能はSUT未実装のため固有挙動行はbindできずTBD**。

---

## §1 L1原子オラクル表（期待オラクル＝pf現行踏襲＋Excel設計。SUT未実装のため実行はTBD）

全14claim。**source_class列は excel／pf-fallback のみ**（excel3＝Excel逐語のみ・pf-fallback11・EE-source 0・各claimは1source）。**全claim LS=0**。**全claimがdocumentation/TBD根拠**（bound候補が無く、記述は現行踏襲の期待挙動をpf実source・Excel設計基準で記録。SUT未実装のため実行検証は保留＝§9.1のTBD理由に紐付く）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0337-001 | display_field | 略称タグ更新CSV登録のアップロード画面には、識別ID1 ファイルを選択ボタン・識別ID2 CSVファイルのアップロードボタン・識別ID3 略称タグ更新CSVファイルフォーマット表・識別ID4 雛形ファイルダウンロードボタン・識別ID5 件数選択（10,50,100,300,500,1000,2000,10000,12000件）・CSVインポート履歴（ファイル名・アップロード日時・作業者）・ページングリンクの画面部品が配置される | 「1 ファイルを選択…2 CSVファイルのアップロード…3 略称タグ更新CSVファイルフォーマット…4 雛形ファイルダウンロード…5 件数 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件…ファイル名…アップロード日時…作業者…9 ページング」 | 0204:略称タグ更新CSV登録!識別ID1,識別ID2,識別ID3,識別ID4,識別ID5,識別ID9 | excel | 0 |
| L1-M0337-002 | http_entry | 本機能の導線は管理画面「商品CSV管理」サイドバー項目 product_storage_code_csv_import から GET /{admin_route}/product/product_storage_code_csv_import（route admin_product_storage_code_csv_import → csvStorageCode）で入り、アップロード画面テンプレート csv_storage_code.twig（共通 base_csv_upload.twig 継承）を表示する。ファイル選択欄は通常の form_widget(form.import_file)（accept=text/csv,text/tsv）で、ファイル名カスタムラベル表示のJSは無い（読み込むJSは spin.min.js とスピナー用 card-csvimport.js のみ）。送信前確認ダイアログはない。ボタン文言は共通テンプレートにハードコードされた日本語である | 「'url' => 'admin_product_storage_code_csv_import'」「{{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv'}}) }}」「CSVファイルのアップロード」 | pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/SidebarProvider.php:172;pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:178;pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:406,1331;pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/base_csv_upload.twig:9,18,36 | pf-fallback | 0 |
| L1-M0337-003 | input | 取込CSVデータ行は2列で、商品ID（主キー・数値(整数)・必須・入力例1）と略称タグ（文字型・必須・入力例POR）で構成される。両列とも必須である | 「識別ID1 商品ID 主キー◯ 数値(整数) 必須◯ 例1／識別ID2 略称タグ 文字型 必須◯ 例POR」 | 0204:略称タグ更新CSVフォーマット!識別ID1,識別ID2 | excel | 0 |
| L1-M0337-004 | process_overview | 本機能はレコード数上限チェックを実施し5010件以上はエラーとする。商品IDで商品情報の略称タグIDを更新し、インポート成功した商品IDを記録して重複を避ける | 「レコード数上限チェックを実施。5010件以上はエラーとする。」「商品IDで商品情報の略称タグIDを更新する。」「インポート成功した商品IDを記し重複を避ける」 | 0204:略称タグ更新CSV登録!処理概要 | excel | 0 |
| L1-M0337-005 | http_flow | POSTアップロード送信（route admin_product_storage_code_csv_upload → csvStorageCodeUpload）は、フォーム妥当性・行数上限・取込後に成功／失敗のどちらでも同一アップロード画面テンプレートを render で再描画する（別URLへの302リダイレクト＝PRGパターンではない）。成功時は成功フラッシュ、フォーム不正・行数超過時はエラーフラッシュ、取込行エラー時は errors 配列を画面内に表示する | 「return $this->render($app, $form, $headers, $this->storageCodeTwig, $result->getErrors(), MtbCsvImportType::PRODUCT_STORAGE_CODE_CSV_ID);」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1348,1356,1390;pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:181 | pf-fallback | 0 |
| L1-M0337-006 | message | 取込結果にエラーが無いとき、成功フラッシュ（キー admin.product.csv_import.save.complete「商品登録CSVファイルをアップロードしました。」）を積み、アップロード画面を再描画する | 「$app->addSuccess('admin.product.csv_import.save.complete', 'admin');」「商品登録CSVファイルをアップロードしました。」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1385;pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133 | pf-fallback | 0 |
| L1-M0337-007 | message | アップロード内容の概算行数が定数 CSV_IMPORT_MAX（5010）以上のとき、sprintf(trans('admin.csv.error.upload.maxrecord'),5010) によりエラーフラッシュ「5010 行を超えるCSVファイルは登録できません。」を積み、取込を実行せずアップロード画面を再描画する | 「if ($this->countCsvRows($file) >= self::CSV_IMPORT_MAX) { $app->addError(sprintf($app->trans('admin.csv.error.upload.maxrecord'), self::CSV_IMPORT_MAX), 'admin');」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:391,1370 | pf-fallback | 0 |
| L1-M0337-008 | validation | 商品ID列は IntConverter で文字列を読み取り整数へ変換（空はnull）して評価される。StorageCodeImportHandler は onValidateRow の中でDBアクセスを伴うチェックを行い、商品IDが dtb_product に未削除で存在しないとき addProductNotExistsError（admin.csv.error.product.not_exists「%d 行目の %s ではデータを取得できません。」）を積み breakAll で全行処理を打ち切る | 「public function convert(string $value) { if (Str::isBlank($value)) { return null; } return intval($value); }」「// DBへのアクセスを伴うチェックを実施する if (!$this->validateProductExists($event)) { $event->breakAll();」 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:61,837;pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Converter/IntConverter.php:16;pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:79,87,137,146 | pf-fallback | 0 |
| L1-M0337-009 | validation | StorageCodeImportHandler は onValidateRow の中で、データ行の略称タグ（文字列）を mtb_storage_code.name とDB照合し、一致する行が存在しないとき addStorageCodeNotExistsError（admin.csv.error.storage_code.not_exists）を積み breakAll で全行処理を打ち切る。略称タグは名称（name）で照合しIDでは照合しない | 「if (!$this->setStorageCodeId($storageCode)) { …->addStorageCodeNotExistsError(…); $event->breakAll();」「WHERE sc.name = :storageCode」 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:87,157,200;pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/MessageStore.php:359 | pf-fallback | 0 |
| L1-M0337-010 | data_write | onReadRow は当該商品IDの既存 dtb_product_sub 行を取得し、storageCodeId だけをCSVの略称タグ名に対応する mtb_storage_code.id へ差し替え、cardDetailId・nameEn・sellGroupId・size・weight・discountId・regionRestrictionId 等の他列は既存値のまま updateProductSub で書き戻す。CSVの略称タグが既存と異なる正常取込では対象商品の storageCodeId が新値へ更新され他サブ列は不変となる | 「'storageCodeId' => $this->storageCodeIds[$this->storageCodeColumn->getValue($row)],」「$repository->updateProductSub($productSub);」 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:237 | pf-fallback | 0 |
| L1-M0337-011 | history | 取込履歴（dtb_csv_import_history）は取込結果にエラーが無いと判断したときだけ種別ID 12（PRODUCT_STORAGE_CODE_CSV_ID）・クライアント側ファイル名・ログイン管理者で1件INSERTされる。エラーを含む取込では増えない | 「$app['hareruya_ec.repository.csv_import_history']->insertCsvImportHistory($app, $csvImportType, $file->getClientOriginalName());」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1388 | pf-fallback | 0 |
| L1-M0337-012 | data_integrity | 取込が成功した場合のみ onAfterImport で em.commit 後に支店システムへ商品更新通知（BranchUpdateService::noticeProductUpdate・インポート成功した商品IDを重複除去して渡す）を送る。失敗しロールバックされた場合この通知は走らない | 「if ($event->isSuccessful()) { $this->em->commit(); …->noticeProductUpdate(array_unique($this->importedIds));」 | pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:57,65 | pf-fallback | 0 |
| L1-M0337-013 | log | POST取込では情報ログ「略称タグ更新CSV登録開始」を出し、取込結果にエラーがあれば「略称タグ更新CSV登録 異常終了」、無ければ「略称タグ更新CSV登録完了」と件数（count）を出す。この3つ以外の情報ログ（例外メッセージのログ等）は本経路には無い | 「log_info('略称タグ更新CSV登録開始');」「log_info('略称タグ更新CSV登録 異常終了');」「log_info('略称タグ更新CSV登録完了', ['count' => $result->getCount()]);」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1377,1383,1386 | pf-fallback | 0 |
| L1-M0337-014 | rollback | アップロードファイルは CsvImportType の NotBlank と File（最大サイズ）で検証され、未選択・不正時はフォーム不正となり各フォームエラーを管理者向けフラッシュに積みアップロード画面を再描画する。StorageCodeImportHandler は行バリデータ（getRowValidators）を持たず、行の検証は onValidateRow のDB検証（商品存在・略称タグ存在）で行い、失敗は全て breakAll（skipRow経路なし）で、エラーが1件でもあれば取込は成功と判断されず履歴INSERT・支店通知・完了ログは行わない | 「if (!$this->isFormValid($app, $form)) { foreach ($form->getErrors(true) as $error) { $app->addError(…);」「protected function getRowValidators() { return []; }」 | pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1356;pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:79,126 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`・**本機能はSUT未実装のため実行不能＝設計参考**）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。**本機能はSUT(ee)に実装が無いため、下記SEED/CSVはeeへの本機能移行実装後に初めて実行可能となる設計参考**（現状は全母集合行がTBD/excludedでbound候補が無く、SEEDを消費する実行ケースは存在しない）。取込CSVはfixtureファイルとしてUI操作でアップロードする想定。

| SEEDセットID | 目的 | 固定値（概略） |
|---|---|---|
| SEED-M0337-MASTERS | 取込の前提マスタ | 既存商品1件（商品ID既知・`dtb_product_sub` 行あり・現行 storageCodeId=既知）＋`mtb_storage_code` に略称タグ名（有効・別値）を用意 |
| SEED-M0337-HISTORY | 取込履歴の表示検証 | `dtb_csv_import_history` に種別ID 12 の履歴を複数件 |
| SEED-M0337-VALIDUPDATE | 正常取込（成功フラッシュ・履歴追記・storageCodeId更新） | 既存商品の商品IDと有効な略称タグ名（現行と異なる値）を持つ1データ行CSV |
| SEED-M0337-NOPRODUCT | 商品不存在エラー（breakAll） | 存在しない商品IDを指定した1データ行CSV（略称タグは有効） |
| SEED-M0337-NOSTORAGECODE | 略称タグ不存在エラー（breakAll） | 商品ID有効・`mtb_storage_code` に無い略称タグ名の1データ行CSV |
| SEED-M0337-MAXROW | 行数上限（5010）検証 | データ行が概算5010行以上のCSV |

---

## §3 取込CSV列マトリクス（参照情報）

| 識別ID | 列 | 検証 | 対応DBカラム | 根拠 |
|---|---|---|---|---|
| 1 | 商品ID | 必須・IntConverterで整数変換・`dtb_product` に未削除で存在（onValidateRowのDB検証・不在でbreakAll） | `dtb_product.product_id`（照合キー） | 0204:略称タグ更新CSVフォーマット!識別ID1／ColumnDefinitions:61,837／handler:87,137 |
| 2 | 略称タグ | 必須・`mtb_storage_code.name` に存在（onValidateRowのDB検証・不在でbreakAll） | `dtb_product_sub.storage_code_id`（更新先。CSVの略称タグ名→mtb_storage_code.id へ解決） | 0204:略称タグ更新CSVフォーマット!識別ID2／handler:87,200,237 |

- 更新は当該商品IDの `dtb_product_sub` の `storageCodeId` のみ上書き。他列は既存値を維持（handler:237）。マスタ `mtb_storage_code` 自体は書き換えない（M03-16と異なる）。

---

## §4 実行可能グレード14列TSV（候補・**bound 0件＝データ行なし**）

- **本機能はSUT(ec-cube-enterprise)に専用ルート/実装が存在しないため、1回の実行でpass/fail一意判定できるbound候補は0件**（正直分類・bound強行はしない）。母集合103行はすべてTBD（27件・固有挙動だがSUT未実装で実行保留）またはexcluded（76件・汎用スタブ/非該当/M03-16汚染/実在挙動なし）。§8/§9参照。
- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。ee側に本機能が移行実装された時点で、§1のL1（現行踏襲＋Excel設計の期待挙動）を根拠にbound候補を起こせる。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
```

---

## §5 ja/en locale対応表（全message claim LS=0＝英訳なし）

**本機能のメッセージ・画面文言はいずれもenロケール変異が無く、全L1 claimがLS=0**のため `-EN` 行を持たない。以下は「英訳なし」の**grep根拠**（レビュー用に記録）。

| キー | ja逐語 | ja出典 | en確認結果 |
|---|---|---|---|
| admin.product.csv_import.save.complete | 商品登録CSVファイルをアップロードしました。 | pf core `message.ja.yml:133` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.upload.maxrecord | %d 行を超えるCSVファイルは登録できません。（sprintfで%d→5010） | pf plugin MessageStore経路 | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.product.not_exists | %d 行目の %s ではデータを取得できません。 | pf plugin `MessageStore.php:204` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.storage_code.not_exists | （略称タグ不存在・行番号/ラベル埋め込み） | pf plugin `MessageStore.php:359` | pf en・ee en いずれも**不在**＝英訳なし |
| 画面文言（CSVファイルのアップロード・雛形ファイルダウンロード等） | 同左（ハードコード） | `base_csv_upload.twig:36,47` | pf plugin twig に**ハードコード日本語（trans未使用）**＝ロケール変異なし |

- 検証コマンド: `grep -rncE 'csv_import.save.complete|admin\.csv\.error\.(product|storage_code)\.not_exists|csv\.error\.upload\.maxrecord' <pf/ee>/…/message*.{yml,yaml}` → いずれも **0**。

---

## §6 判定手段骨子（候補＝未実装／SUT本機能未実装）＋ _drafts隔離

- **前提**: SUT(ec-cube-enterprise)に本機能の専用ルート/コントローラ/ハンドラ/テンプレートが無い（§0・重大所見）。よってPlaywrightでの画面到達・取込結果検証は**ee側の本機能移行実装が前提**であり、現状は判定手段を確定できない（全行TBD/excluded）。
- ee移行実装後の判定設計（参考）: 成功＝成功フラッシュDOM＋CSVインポート履歴テーブルDOM／失敗＝`.text-danger` エラーメッセージDOM＋成功フラッシュ非表示／更新反映・ロールバックは `dtb_product_sub.storage_code_id`（pf-oracle。ee移行では保存先列が要確認）。商品存在/略称タグ存在のbreakAllは「1行失敗で全体中断・何も書かれない」をDB確認。
- L1解決器・取込CSV fixture・SEED manifest契約・アサートヘルパは M0成果物（D5/D8/D9型）として未実装。本骨子は「ee移行実装＋ハーネス完成後にこう書く」契約。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

**bound候補が0件のため、Playwright/非UI/db.ts の実行対象列挙は無い**（全母集合行はTBDまたはexcludedでtsv非出力）。ee側に本機能が移行実装され、かつM0ハーネスが整備された時点で、§1のL1を根拠に実行区分を定義する。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容のテーマを正しいM03-37（商品略称タグ更新）へ再解釈**して行う。本機能固有の挙動を記述する行は**SUT未実装のためTBD**、汎用スタブ・非該当観点・M03-16汚染導線・実在しない挙動はexcluded（Gate B15/B7）。

### 集計（103 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **0** | SUT(ee)に本機能の専用ルート/コントローラ/ハンドラ/テンプレートが無く（type=storage_code も404・Excel注釈C7も未移植明記）、1回の実行でpass/fail一意判定できる固有挙動候補を起こせない（whole-feature pf/ee食い違い） |
| **TBD** | **27** | -003,-005,-006,-008,-009,-010,-012,-017,-018,-019,-041,-049,-061,-064,-082,-083,-085,-086,-087,-088,-089,-090,-092,-098,-101,-102,-103（本機能固有の挙動をpf実source/Excel設計〔§1のL1〕で記述できるが、SUT未実装で実行不能＝ee移行方針決定／ee実装後に再具体化。母集合汚染行はテーマを正しいM03-37へ再解釈）。§9.1 |
| **excluded** | **76** | -001,-002,-004,-007,-011,-013〜-016,-020〜-040,-042〜-048,-050〜-060,-053,-062,-063,-065〜-081,-084,-091,-093,-094,-095,-096,-097,-099,-100（汎用スタブ・非該当観点〔検索/ファイル操作/JSON/削除移動〕・別機能〔既存データCSV出力〕・M03-16汚染〔-093/-094 導線／-007/-053/-099 ファイル名ラベルはpf twigに根拠なし〕・実在しない挙動〔-091 例外ログ経路なし〕）。§9.3 |
| 合計 | **103** | 欠番0・理由なし重複0 |

> 会計: bound 0／TBD 27／excluded 76（=103・欠番0）

- **B7非該当観点excluded**: 検索(-020〜-033)／削除(-072)／移動・リネーム(-073)／コピー(-074)／ファイル登録(-075)／ファイル出力(-076)／JSON(-077)／同名(-078)／入力JSON(-079)／配置先(-080)／スキーマ(-081)／既存データCSV出力=別機能(-004,-096)。取込機能に該当なし。§9.3。
- **B8観点補正＝0件**（bound候補が0のため観点補正の対象行なし。TBD/excluded行は母集合ラベルを保持）。

### 103対応表（期待テキスト要旨〔テーマ再解釈〕→会計→L1）

| No | 期待テキスト要旨 | 会計 | L1 |
|---|---|---|---|
| 001 | 出力失敗のファイル出力一致（取込機能に「出力失敗」非該当＋汎用） | excluded | — |
| 002 | CSRFのファイル出力一致（CSRF失敗の固有挙動が一次資料に定義なし・汎用） | excluded | — |
| 003 | 雛形（ヘッダのみのCSV）がダウンロードされる（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 004 | 現行略称タグのCSVダウンロード（既存データCSV出力＝別機能・B7） | excluded | — |
| 005 | CSVを検証・取込後、成否メッセージ付きでアップロード画面へ戻る（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-005 |
| 006 | アップロード画面のブロックタイトルが商品管理と表示される（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 007 | ファイル選択でラベルにファイル名を表示（M03-37のpf twigは通常のform_widgetのみでファイル名ラベルの根拠なし＝M03-16汚染） | excluded | — |
| 008 | 取込前の確認ダイアログは表示されない（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-002 |
| 009 | 商品IDと略称タグの取込で対象商品の略称タグIDが更新される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 010 | 商品ID・略称タグが未入力の行はエラーが表示され取込が完了しない（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-003 |
| 011 | 必須バリデーションでエラー表示されず継続（前提=検証エラーと期待=継続が両立しない自己矛盾／汎用） | excluded | — |
| 012 | 実装を確認値として、商品略称タグ更新の書込が所定どおり行われる（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 013 | 相関バリデーションでエラー表示・完了しない（前提が汎用ノイズ・具体対象を名指さず・汎用） | excluded | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | excluded | — |
| 016 | 相関バリデーションでエラー表示・完了しない（汎用スタブ） | excluded | — |
| 017 | 商品ID・略称タグがDBに存在する行はエラーなく取込処理が継続される（存在検証がtrueでonReadRow更新へ進む・正例）（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-008 |
| 018 | 商品ID・略称タグがDBに存在しない行はエラーが表示され取込が中断される（存在検証失敗でbreakAll・負例）（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-009 |
| 019 | 取込エラー時に蓄積メッセージをフラッシュ表示しアップロード画面へ戻る（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-005 |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索は取込に非該当・B7） | excluded | — |
| 021 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 022 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 023 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 024 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 025 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 026 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 027 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 028 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 029 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 030 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 031 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 032 | 検索条件の該当レコードが取得結果に含まれる（検索・非該当） | excluded | — |
| 033 | 検索条件の該当レコードが取得結果に含まれない（検索・非該当） | excluded | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | excluded | — |
| 035 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | excluded | — |
| 036 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | excluded | — |
| 037 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | excluded | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値を名指さず） | excluded | — |
| 039 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 040 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 041 | GETでほぼ空のアップロードフォームが表示される（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 042 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 043 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 044 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 045 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 046 | 登録内容の対象レコードが追加されない（汎用スタブ） | excluded | — |
| 047 | 登録内容の対象レコードが追加される（汎用スタブ） | excluded | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ） | excluded | — |
| 049 | 雛形（ヘッダのみのCSV）がダウンロードされる（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 051 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 052 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 053 | ファイル選択でラベルにファイル名を表示（M03-37のpf twigは通常のform_widgetのみでファイル名ラベルの根拠なし＝M03-16汚染） | excluded | — |
| 054 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 055 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 056 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 057 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 058 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | excluded | — |
| 059 | 更新内容の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ） | excluded | — |
| 061 | 取込失敗時にエラー文言がフラッシュ表示される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-005 |
| 062 | 実行結果のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | excluded | — |
| 064 | フォーマット/列の妥当性に反する取込はエラーが表示され完了しない（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-014 |
| 065 | 実行結果のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 066 | 実行結果のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 067 | 出力内容のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 068 | 出力内容のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 069 | 出力内容のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 070 | 出力内容のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ） | excluded | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は取込に非該当・B7） | excluded | — |
| 073 | 移動・リネームの該当レコードが取得結果に含まれない（非該当・B7） | excluded | — |
| 074 | コピーのファイル出力一致（非該当・B7） | excluded | — |
| 075 | ファイル登録のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 076 | ファイル出力のファイル出力一致（出力は取込に非該当・B7） | excluded | — |
| 077 | JSONのファイル出力一致（非該当・B7） | excluded | — |
| 078 | 同名ファイルのファイル出力一致（非該当・B7） | excluded | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当・B7） | excluded | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当・B7） | excluded | — |
| 081 | スキーマのファイル出力一致（汎用ファイルスタブ・列未指定） | excluded | — |
| 082 | 取込成功後に対象商品を再表示すると略称タグの反映が確認できる（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 083 | 取込成功時に成功メッセージが表示される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-006 |
| 084 | 更新抑止のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 085 | 取込で対象商品の略称タグIDが更新される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 086 | 取込による更新で対象テーブルを直接保存する（不要な削除は含まない）（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 087 | GETでほぼ空のアップロードフォームが表示される（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 088 | 取込エラー時に蓄積メッセージをフラッシュ表示しアップロード画面へ戻る（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-005 |
| 089 | 取込開始時に情報ログが記録される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-013 |
| 090 | 取込エラー時に異常終了の情報ログが記録される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-013 |
| 091 | 例外メッセージの情報ログ記録（本経路に例外ログの実装が無く実在挙動なし・M03-16汚染） | excluded | — |
| 092 | 取込完了時に完了と件数の情報ログが記録される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-013 |
| 093 | 略称タグ登録/編集画面から取込画面を開く（M03-16マスタCSV導線＝別機能・汚染） | excluded | — |
| 094 | 取込画面から略称タグ一覧・フォーム画面へ戻る（M03-16マスタCSV導線＝別機能・汚染） | excluded | — |
| 095 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 096 | 現行略称タグのCSVダウンロード（既存データCSV出力＝別機能・B7） | excluded | — |
| 097 | 画面表示データでエラー表示されず継続（汎用スタブ） | excluded | — |
| 098 | アップロード画面のブロックタイトルが商品管理と表示される（ee〔SUT〕未実装・未移植で404） | TBD | L1-001 |
| 099 | ファイル選択でラベルにファイル名を表示（M03-37のpf twigは通常のform_widgetのみでファイル名ラベルの根拠なし＝M03-16汚染） | excluded | — |
| 100 | ファイル選択のファイル出力一致（汎用ファイルスタブ） | excluded | — |
| 101 | 取込で対象商品の略称タグIDが更新される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |
| 102 | 商品ID列は文字列として読み取ったのち整数へ変換して評価される（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-008 |
| 103 | CSVに含まれない商品サブ項目は取込で変更されない（ee〔SUT〕未実装・未移植で実行不能） | TBD | L1-010 |

`func_scope_check` 判定: 親103/103会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝27件・Gate B15適用後）

すべて**本機能固有の挙動をpf実source／Excel設計（§1のL1）で記述できるがSUT(ee)未実装で実行不能**＝**ee移行方針決定／ee実装後に§1のL1を根拠に再具体化**する。母集合汚染行はテーマを正しいM03-37へ再解釈。

| グループ | 母集合 | 件数 | 期待挙動（§1 L1） |
|---|---|---:|---|
| 画面表示・GET・雛形 | -003,-006,-041,-049,-087,-098 | 6 | 画面部品/GET表示/雛形DL（L1-001） |
| 導線・取込フロー・モーダル | -005,-008,-019,-061,-088 | 5 | POST取込フロー・成否フラッシュ・確認モーダル無し（L1-002/005） |
| DB相関検証（商品存在・略称タグ存在） | -017,-018 | 2 | -017=存在→エラーなし継続（onReadRow更新へ・L1-008）／-018=不存在→breakAll中断（L1-009） |
| 取込書込・反映・必須/フォーマット検証・整数変換 | -009,-010,-012,-064,-082,-085,-086,-101,-102,-103 | 10 | 商品storageCodeId更新（L1-010）・必須（L1-003）・列/フォーマット検証（L1-014）・商品ID整数変換（L1-008） |
| 成功メッセージ・情報ログ | -083,-089,-090,-092 | 4 | save.complete（L1-006）・開始/異常終了/完了ログ（L1-013） |

（合計 6+5+2+10+4 = 27）

### 9.2 要実機・SUT方針（実行面の保留）

| 事項 | 状態 |
|---|---|
| **SUT方針（最重要）** | **本機能は ee未実装の移行ギャップ機能（pf専用・ee専用エントリポイント無し）**。専用route `admin_product_storage_code_csv_upload`/`_csv_import`・メソッド `csvStorageCode(Upload)`・ハンドラ `StorageCodeImportHandler`・type=storage_code は ee に不在（§0・重大所見のfile:line）。Excel注釈C7「この機能を使用していないためリニューアルに移行しない」も未移植を裏付ける。**全固有挙動（TBD 27件）は ee移行方針決定／ee実装後に §1のL1 を根拠に再具体化**する。**オーナーのSUT方針確定待ち**（M03-34・M03-36〔ee未実装〕・M03-44〔Phase2〕と同カテゴリ。M03-40〔棚番号更新〕はee実装済でboundの別扱い） |
| **母集合汚染** | `all_it_cases.tsv` の M03-37母集合は誤ったpf-md（M03-16挙動混入）から機械生成されており、一部期待テキストがM03-16挙動を指す。ee実装後の再具体化では正しいM03-37（`ProductCsvController`/`StorageCodeImportHandler`/Excel）を基に母集合再生成が望ましい（本書はテーマ再解釈で会計） |
| 取込CSV fixtureの実バイト内容（正常更新・商品不存在・略称タグ不存在・5010境界） | ee移行実装後に整備＝要実機（SEED-M0337-*） |
| L1解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D5/D8/D9型）として未実装 |

### 9.3 excluded＝76件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B7】検索系（取込に非該当）** | -020〜-033 | 検索観点は取込機能に該当なし（14件） |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-076,-077,-078,-079,-080 | 削除/移動・リネーム/コピー/ファイル出力/JSON/同名/入力JSON/配置先（取込に該当なし） |
| **【B7】別機能（既存データのCSV出力）** | -004,-096 | 「現行略称タグがCSVでダウンロードされる」＝既存データのCSV出力（本機能=取込ではない） |
| **【B15②/④】汎用「登録内容/更新内容/実行結果が追加/変更される・されない」スタブ** | -034,-035,-036,-037,-038,-039,-040,-042,-043,-044,-045,-046,-047,-048,-050,-051,-052,-054,-055,-056,-057,-058,-059,-060 | 対象レコード・具体列/値を母集合が指定せず内容空虚（24件） |
| **【B15②】汎用ファイル出力一致スタブ** | -062,-065,-066,-067,-068,-069,-070,-075,-081,-084,-100 | 「ファイル出力/取り込み結果が対象データと一致」の具体対象を名指さない汎用スタブ（11件） |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）** | -011,-063,-071,-095,-097 | 前提=検証エラーと期待=継続が両立しない自己矛盾／観測対象が無い汎用継続スタブ |
| **【B15②】汎用相関スタブ（前提が汎用ノイズ・具体対象を名指さず）** | -013,-014,-015,-016 | 期待は前提が汎用ノイズで具体対象を名指さず＝固有一意対応不成立（DB相関の実在挙動は -017/-018 でTBD） |
| **【M03-16汚染】別機能の導線** | -093,-094 | 母集合「略称タグ登録/編集画面ヘッダのCSV取込」「一覧へ戻る」はM03-16マスタCSV導線（`admin_product_storage_code_csv`→`StorageCodeController`）で、M03-37の導線（商品CSV管理サイドバー→`admin_product_storage_code_csv_import`）と別。本機能の挙動でない |
| **【M03-16汚染】ファイル名カスタムラベル表示** | -007,-053,-099 | 「ファイル選択でラベルにファイル名を表示」はM03-37のpf twig（`base_csv_upload.twig`）に根拠なし（ファイル入力は通常の `form_widget(form.import_file)` のみ・読み込むJS `card-csvimport.js` は29行のスピナーのみでファイル名ラベル描画なし）。M03-16のee master twig（bootstrap custom-file）挙動を汚染pf-mdが混入したもの＝実在挙動なし |
| **【実在挙動なし】例外ログ** | -091 | 「例外メッセージの情報ログ記録」は本経路に実装が無い（ログは開始/異常終了/完了の3つのみ・例外は `CsvImporter:289` で再throw・log_info経路なし）＝M03-16汚染or実在挙動なし |
| **【B15③】自己矛盾/汎用スタブ** | -001,-002 | -001「出力失敗」（非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし |

（合計 14+8+2+24+11+5+4+2+3+1+2 = 76）

## §10 特記事項（片側断定せず記録）

1. **【機能同定＝商品略称タグ更新CSV・R1承認】**: M03-37=**商品への略称タグ(storageCode)更新CSV**（2列 商品ID・略称タグ／pf `ProductCsvController::csvStorageCode(Upload)`／`StorageCodeImportHandler`が商品存在・略称タグ名照合を検証し `dtb_product_sub.storageCodeId` を更新）。M03-16（`StorageCodeController::import`・`mtb_storage_code`マスタ登録）とは別機能・別route・別handler・別導線。
2. **【SUT確定＝whole-feature ee未実装・R1承認／会計 bound0・TBD27・excluded76】**: 商品略称タグ更新CSVの取込画面・POSTルート `admin_product_storage_code_csv_upload`・ハンドラ `StorageCodeImportHandler`・type=storage_code は **ee に存在せず**（§0/重大所見のfile:line）。Excel注釈C7も未移植を裏付ける。→ **pf実装挙動を期待オラクル(pf-fallback)・Excel設計を(excel)として§1に維持しつつ、boundできる根拠が無いため27件を全てTBD**（ee移行方針決定／ee実装後に再具体化）。M03-34/M03-36/M03-44と同カテゴリ。
3. **【R2 Major是正5件】**: (1)**-017/-018 excluded→TBD**: `getRowValidators()` が空でも `onValidateRow`（handler:87）から商品存在・略称タグ存在を**DB検証**する実在挙動（母集合「DBとの相関バリデーション」に対応）＝L1-008/L1-009でTBD。(2)**-091 TBD→excluded**: 「例外メッセージの情報ログ」は実装に無い（ログは開始/異常終了/完了の3つのみ・例外は `CsvImporter:289` で再throw）＝実在挙動なしでexcluded。(3)**-093/-094 TBD→excluded**: 母集合の「略称タグ登録/編集画面ヘッダのCSV取込」「一覧へ戻る」はM03-16マスタCSV導線（`admin_product_storage_code_csv`→`StorageCodeController`）で、M03-37の導線（商品CSV管理サイドバー→`admin_product_storage_code_csv_import`・`SidebarProvider:172`）と別＝M03-16汚染でexcluded。(4)**source_class純度**: L1-001をExcel画面部品のみに限定しroute/ナビをpf-fallback L1-002へ分離、L1-003をExcelフォーマット逐語のみに（pf混在除去）、-102「文字列読取後整数変換」はExcelでなくpf `IntConverter`（`ColumnDefinitions:837`/`IntConverter:16`）＝pf-fallback L1-008へ帰属。(5)**TSV TBD理由**: 各TBD行の期待要旨に「ee〔SUT〕未実装・未移植で404／実行不能」を埋め込みee未実装を反映（committed M03-34踏襲）。
4. **【R3 Major是正2件】**: (1)**-017の極性是正（負例→正例）**: 母集合 -017 は「DB条件に該当する値を指定しエラーなく処理継続」＝**正例**（-018 が負例）。R2で誤って -017 を負例（不在→中断）に反転していた。実装上、商品・略称タグが**存在すれば `onValidateRow` の検証は true で終了し `onReadRow`（更新）へ進む**（`StorageCodeImportHandler.php`）ため、**-017=「存在→エラーなし・処理継続」（正例・L1-008）**／**-018=「不存在→breakAll中断」（負例・L1-009）**に是正（いずれもTBD）。(2)**-007/-053/-099 TBD→excluded（M03-16汚染）**: 「ファイル選択でラベルにファイル名を表示」はM03-37のpf twig（`base_csv_upload.twig`）に**根拠なし**（ファイル入力は通常の `form_widget(form.import_file)` のみ・読み込むJS `card-csvimport.js` は29行のスピナーのみでファイル名ラベル描画なし）。M03-16のee master twig（bootstrap custom-file）挙動を汚染pf-mdが混入したもの＝L1-002から当該挙動を削除し excluded。**会計 R2 bound0/TBD30/excluded73 → R3 bound0/TBD27/excluded76**。
5. **【母集合汚染／テーマ再解釈】**: `all_it_cases.tsv` の M03-37母集合は誤ったpf-md（M03-16挙動混入）から機械生成されており、-009/-012/-085/-101/-082/-083/-089/-092/-102/-103・-093/-094 等はM03-16挙動を指す。本書は各行のテーマを正しいM03-37（商品storageCodeId更新・商品編集画面反映・save.complete・略称タグ更新CSV…ログ・商品ID整数変換・略称タグID以外の商品サブ列非更新）へ再解釈しTBD/excludedを判定した。ee実装後の再具体化では母集合の再生成が望ましい。
6. **【source_class純度＝1claim1source】**: 全14 claimを excel（3＝画面部品/フォーマット/処理概要のExcel逐語）または pf-fallback（11＝route/ナビ/変換/検証/書込/履歴/連携/ログ）とし、ee比較（route不在・404・const未使用・カード/グッズCSV経由）の観察は§0/§10メタ・§9.2のSUT方針に隔離（EE-source 0）。エラー逐語は pf plugin 自身の `MessageStore`／成功は pf core `message.ja.yml:133`。
7. **成功/失敗の表示（ee移行実装後の参考）**: 成功＝`addSuccess`フラッシュ（`admin.product.csv_import.save.complete`「商品登録CSVファイルをアップロードしました。」）＋取込履歴INSERT（type12）。取込行エラー＝`errors` を `base_csv_upload.twig` の `.text-danger` で画面内表示。フォーム不正・行数超過＝`addError`フラッシュ。**リダイレクトしない**（同URL `render` 再描画＝PRGでない）。商品存在/略称タグ存在の検証失敗は `onValidateRow` の `breakAll` で全体中断・1件でも rollback され履歴・支店通知・完了ログは行わない（`getRowValidators` 空・skipRowなし）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

**本機能はbound候補が0件（SUT未実装で全固有挙動行がTBD）のため、観点補正の対象行は無い（0件）。** TBD/excluded行は母集合の観点ラベルをそのまま保持する（emit_concretized_tsv.py が適用する補正なし）。
