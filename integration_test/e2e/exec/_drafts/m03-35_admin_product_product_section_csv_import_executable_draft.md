# 候補: m03-35 部門更新CSV登録（ee ProductSectionCsvController・dtb_product_class.section_id一括更新CSV） — 実行可能グレード候補（母集合105全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R5 Major1件是正版（2026-07-29・R1-R4是正済）**。
> **R5 Major1是正サマリ**: (M1)C-005/-083のfalse-greenを是正＝母集合-083「各行でUPDATEが走る」を一意判定できるよう fixture を**別商品2データ行**（1行目=商品A×部門B・2行目=商品C×部門D）に変更し、**各商品の section_id が各々更新されること**をDB内部検証する（従来は同一商品後勝ちで最終section_id=Cのみ検証＝1行目を処理せず2行目だけ更新しても緑になる欠陥）。CsvImporter:233-252 のループが各データ行で onReadRow→replaceSection を呼ぶことを確認し、L1-005を各行独立処理の記述へ是正。いずれか1行でも未処理なら該当商品が取込前値のままとなり不合格＝各行UPDATE実行を一意判定。会計は不変（bound19/TBD11/excluded75）。
> **R4 Major3是正サマリ**: (M1)C-004操作手順に残っていた「302リダイレクトを確認」を除去し純UI操作のみに（302は自動検証（内部）列だけに置く）。(M2)母集合-018を C-007（商品不存在）から外し**excluded**へ＝-018前提「同一 product_code を持つ規格が複数行」は replaceSection の UPDATE WHERE product_code=? で全規格行が同じ値に更新されエラーにならない（pf:145 / ProductClassRepository.php:2170・取込機能に非該当）。C-007は-095のみで維持。(M3)母集合-016も**TBD**へ＝L1-006の pf/ee乖離を隠さない。pf現行（pf-eccube3）は部門コード任意で空→section_id NULL更新（pf handler:45,194）だが ee は sectionCode()->setRequired(true) で空→require breakAll（ee handler:117）＝pf/ee食い違い。会計 bound21/TBD10/excluded74 → **bound19/TBD11/excluded75**。
> **R3 Major4是正サマリ**: (M1)section_id更新値/rollback後値・正確な302/URLを全て自動検証（内部）列へ移し、画面期待は目視可能なフラッシュ/PRG後画面のみに限定（C-004/C-005/C-006/C-007/C-008/C-009/C-010/C-011）。(M2)C-012の非許容 page_count=7 期待を実装どおりに是正＝当該リクエストの表示件数は既定値10へ置換され、セッション保存値50は維持（AbstractController:403-407）。L1-014へ既定10置換を追記。(M3)C-012の種別ID11絞り込みがfalse-greenだったのを是正＝SEED-HISTORYに別種別IDの履歴を混在させ、ID11のみ表示される絞り込みを一意判定（ProductSectionCsvController:96）。(M4)成功取込の履歴INSERT後始末漏れを是正＝成功系（C-002/C-004/C-005/C-010）のSEED後始末に「追加された取込履歴（dtb_csv_import_history 種別ID11）の削除」を追加し、§6.1にC-002を明記。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。期待値の正はL1オラクルID（三段参照）。fixture_versionは全て `@TBD-D5`。
> **本機能＝ee `ProductSectionCsvController`（`/{admin_route}/product/section/…`）。アップロードCSVの商品コードで `dtb_product_class.section_id` を一括更新する刷新後（移行先）実装。POST後はPRGで常に302リダイレクト。取込（CsvImporter）が返した検証エラーと行数上限は addError で管理者向けフラッシュするが、フォーム不正（子フィールド import_file の NotBlank/File）は `$form->getErrors()`（deep=false）で取得されずフラッシュされない。成功フラッシュは `admin.register.complete`。取込履歴（種別ID11）はセッション件数（`admin.product.section_csv.page_count`/`page_no`）でページングする。**
>
> **R2 Major7是正サマリ（会計の意味整合）**: (M1)フォーム不正を商品不存在C-008へ共有していたのを解消＝母集合-061/-094（前提「フォーム不正」）は子フォーム制約が非フラッシュ・root(CSRF)成分のみで一意判定不能のため**TBD**、-009（前提 MSG-002＝import_file null）は NotBlank と競合し到達困難で**TBD**、真の取込CsvImporterエラー行（-095「インポータが返した検証エラー」）だけを中断C-007へ。(M2)成功入力で失敗分岐bound解消＝C-010は成功PRG（-102）のみ、失敗-088は分離。ログ必須成分を含む-087/-088/-089は観測未整備で**TBD**（-097に限定しない）。(M3)母集合前提の置換を撤回し実前提へ忠実化＝-010は前提 MSG-003（5010件上限）→行数上限C-011、-016は前提「部門を未設定に戻したい」＝部門コード空→require breakAll（C-006）、-083は前提「同一商品コードを複数データ行」＝複数CSV行後勝ち（C-005）、-018は入力「該当しない値」＝商品不存在（C-007）。(M4)section_id観測分離＝C-004/C-005の画面期待は成功フラッシュに限定し、section_id反映は自動検証（内部・DB）に一元化（重複記載を解消）。(M5)ロールバック実証fixtureへ是正＝C-008は「1行目正常（section_id更新をステージ）／2行目異常（breakAll）」で先行更新のロールバックを実証（CsvImporter:222 beginTransaction・274 rollback）。(M6)CSRF false negative是正＝-002を「具体挙動なし」から**DELEG（管理画面共通CSRF検証）**へ（pf-md MSG-001文言と実resource「Invalid CSRF token.」→ja「ログインできませんでした…」が食い違い）。(M7)履歴INSERT前提シード補強＝SEEDに mtb_csv_import_type.id=11 の存在を明記（Repository:45-47 で種別行が無ければ無操作）。
>
> **R1既是正の維持**: M03-35=ee正準（SUT唯一入口 `/product/section/…`）・M03-20 flow(1)は過剰スコープでコーディネータ管掌（§10-1）／部門コード空→NULL更新はee非該当（setRequired(true)・§10-4）／フォーム不正非フラッシュ（getErrors deep=false・§10-3）／L1-010 Excel逐語・L1-011 pf-fallbackへ分割／L1-017 NotBlank英語「No value found.」実在でLS=1。
>
> **方針（正直分類）**: 母集合105は機械過剰生成。固有挙動が一次資料にfile:lineで実在し**母集合の実前提に忠実に**1回で一意判定できる行のみをbound。前提の別事実への置換は禁止。観測不能な必須成分（ログ等）や実装と矛盾する期待はTBD。高bound数は目指さない。B1-B15自己監査済み（正直分類・R2是正・2026-07-29）。

## §0 版固定

- **pf現行md（回帰先ラベル・source_class=pf-fallback）**: `functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md`（git hash-object `25ba6b8f78b57313f344e75085fdec795b5ad436`。以下「pf-md:行」）。**確認値はee `src/Eccube` 配下だが、部門コード必須性（pf-md:84「空も許容」は誤り）・MSG-001 CSRF文言（実resourceと食い違い）は実eeで是正**。
- **Excel基本設計（source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`（git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`）。sheet-52「部門更新CSV登録」（機能No=M03-35・概要「商品の部門更新をCSVで行える」）＝「レコード数上限チェックを実施。5010件以上はエラーとする。」「商品コードで商品規格の部門IDを更新する。」を規定。以下「0204:部門更新CSV登録!<セル>」。M03-20が用いた sheet-34「部門登録CSVアップロード」（＝部門マスタ登録・mtb_section）とは別シート。
- **実装ソース（挙動正・クロス検証・standard-src付与ゼロ・ee HEAD `da9c2ba276`）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`。
  - `Controller/Admin/Product/Csv/ProductSectionCsvController.php`（GET csv 82-115／POST import 124-195〔form不正 133-139・null file 143-147・maxrecord 149-153・log 155・importer 161-168・hasError→addError 170-174・成功addSuccess admin.register.complete 176・history INSERT 178-182・redirect 194〕／template csvTemplate 54-72・product_section_update.csv 60／getCsvHeader 202-208〔商品コード・部門コード〕／getRequiredCsvHeader 215-221〔両列〕）。
  - `Service/Csv/Importer/CsvImporter.php`（importRows 218-289〔beginTransaction 222・onValidateRow 240・breakAll break・onReadRow 251・flush 254,267・commit 272／rollback 274,289〕）。
  - `Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php`（initializeColumnDefinitions 115-119〔productCode/sectionCode いずれも setRequired(true)〕／validateProductExists 130-149／validateSectionExists 152-171／onReadRow・persistSection 83-196）／`Repository/ProductClassRepository.php:2170`（replaceSection＝同一コネクションの native UPDATE＝トランザクション内）。
  - `Service/Csv/Importer/Event/BaseCsvImportHandler.php`（onValidateRow 65-113〔列数不一致 72-77・列validate 92-95・breakAll〕）／`Model/BaseCsvColumn.php:145-152`（required時 RequiredValidator）／`Validator/RequiredValidator.php:34-41`（空値→addRequireError＋false）。
  - `Controller/AbstractController.php`（ADMIN_CSV_IMPORT_HISTORY_PAGE_COUNT_OPTIONS 361／ADMIN_CSV_IMPORT_MAX_ROWS=5010 364／countCsvRows 369／getCsvImportHistoryPaginationParams 392-417／getCsvImportMaxRowsExceededMessage 442-447）。
  - `Form/Type/Admin/CsvImportType.php`（import_file NotBlank 53・File maxSize=eccube_csv_size 54-55・CSRFトークンは _token）。`/home/y-saito/Developments/ec-cube-enterprise/vendor/symfony/form/Form.php:669`（getErrors deep=false 既定＝子フィールドエラー非取得）。
  - `Service/Csv/Importer/MessageStore.php`（addRequireError=admin.csv.error.data.require 178-184／addInvalidColumnCountError=admin.csv.error.format.body 134-138／addMasterNotExistsError=admin.csv.error.data.not_registered 268-273／addProductNotExistsError=admin.csv.error.product.not_exists 283-288）。
  - `Repository/DtbCsvImportHistoryRepository.php:42-47`（insertCsvImportHistory＝mtb_csv_import_type.id が無ければ return で無操作）。`Entity/Master/MtbCsvImportType.php:38`（PRODUCT_SECTION_IMPORT_CSV_ID=11）。
  - twig: `Resource/template/admin/Product/csv_product_section.twig:1,5`・`base_csv_upload.twig:3,20,34,54,91-96`（title=admin.product.product_management・accept・_token・csv_upload button・required badge）。`Product/index.twig`（商品一覧に部門は検索条件のみで結果表に部門列なし＝§10-6）。
  - locale: `Resource/locale/messages.ja.yaml` / `messages.en.yaml` / `validators.ja.yaml` / `validators.en.yaml`（§5）。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-35-…-001..105`（105件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation 付与ゼロ＝Gate G2）。実装ソースはクロス検証・逐語根拠にのみ用いsource_classへ計上しない。
- **B14/共通委譲（M03-35はモジュール最小IDでない）**: 観点「未認証」の-003は共通認証（M01-01代表）へDELEG、観点「CSRF」の-002は管理画面共通CSRF検証へDELEG＝いずれもexcluded（§8.3）。
- **B1事前スイープ**: 真のTBDは10件（§8.2）＝-009/-049/-061/-082/-087/-088/-089/-092/-094/-097。

---

## §1 L1原子オラクル表

全17claim。**source_class列は excel／pf-fallback のみ**。**LS列は英語資源の実在で判定**（Gate B4）: 翻訳キー描画のメッセージ/ラベルは ee `messages.en.yaml`／`validators.en.yaml` でgrep確認し英訳があれば **LS=1**（en逐語は§5）。ハードコード日本語・固定ファイル名・英訳無しキー・Excel逐語は LS=0。**LS=1は4件**（L1-001/004/009/017）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0335-001 | http_entry | 部門更新CSV登録画面 GET /product/section/csv_upload を開くと、twig `csv_product_section.twig`（`base_csv_upload.twig` 継承）で、共通フレームのタイトルは admin.product.product_management、サブタイトルは admin.product.product_section_csv、CSVアップロードカード見出しは admin.product.product_section_csv_upload_title、フォーマットカード見出しは admin.product.product_section_csv_format_title、アップロードボタンは admin.common.csv_upload、フォーマット表は商品コード・部門コードの2列で両列に必須バッジ admin.common.required、雛形リンクは admin.common.csv_skeleton_download、下部に取込履歴テーブルが描画される。ファイル入力の accept は .csv,text/csv,.tsv,text/tsv | 「`@admin/Product/csv_product_section.twig` は `@admin/Product/base_csv_upload.twig` を継承する。…カード見出しは `admin.product.product_section_csv_upload_title` と `admin.product.product_section_csv_format_title`。」 | pf-md:33,44 / ProductSectionCsvController.php:101-113,202-221 / csv_product_section.twig:1,5 / base_csv_upload.twig:3,20,34,91-96 / messages.en.yaml:1804,1785,1805,1930 | pf-fallback | 1 |
| L1-M0335-002 | display_field | 部門更新CSV登録画面はファイル選択でカスタムラベルへファイル名を表示し、フォーム送信時に `$.changeLoading(true)` を呼ぶ。送信前確認ダイアログは無い。取込実行後もアップロード画面が自動でCSVを再読込することは無い（規格の部門は別画面で確認する） | 「ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。」「送信前確認ダイアログはない。」「アップロード画面は実行後も自動で CSV を再読込しない。」 | pf-md:45,47,154 / base_csv_upload.twig:29-32 | pf-fallback | 0 |
| L1-M0335-003 | file_handling | 部門更新CSVの雛形ダウンロード GET /product/section/csv_template を実行すると、ヘッダ行のみの product_section_update.csv が application/octet-stream で得られる | 「`product_section_update.csv`（ヘッダのみ）が得られる。」 | pf-md:34,65 / ProductSectionCsvController.php:54-72 | pf-fallback | 0 |
| L1-M0335-004 | http_flow | 部門更新CSVの正常POST /product/section/import は、全データ行がエラー無しで完了したときコミットし、成功フラッシュ admin.register.complete を addSuccess したうえで、PRGで302リダイレクトして GET /product/section/csv_upload を表示する（同一URLをrenderしない）。取込直後はリダイレクト先で成功フラッシュが1回表示される | 「`admin.register.complete` を成功フラッシュに積む。」「検証・取込後、常に `GET …/section/csv_upload` へリダイレクトされ、フラッシュで結果が示される。」 | pf-md:35,76 / ProductSectionCsvController.php:176,194 / messages.en.yaml:1676 | pf-fallback | 1 |
| L1-M0335-005 | data_integrity | CSVの各データ行は CsvImporter のループで1行ずつ onReadRow が呼ばれ、persistSection→replaceSection(商品コード, 部門ID) を実行する（各データ行が独立に処理される・処理をスキップされる行は無い）。replaceSection は UPDATE dtb_product_class SET section_id = ? WHERE product_code = ? のネイティブ実行で当該行の product_code 一致の全規格行を更新する。よって複数データ行があれば各行でそれぞれ UPDATE が走り、別商品なら各商品の section_id が各々更新され、同一商品コードなら後勝ちで最終行の部門IDが残る | 「各行で UPDATE が走る。…同一コードに対しては後勝ち」「`product_code` が一致するすべての規格行が対象となる。」 | pf-md:85,106,144,145 / CsvImporter.php:233-252 / ProductSectionUpdateImportHandler.php:83-87,191-196 / ProductClassRepository.php:2170 | pf-fallback | 0 |
| L1-M0335-006 | validation | 商品コード列は pf/ee とも必須。**部門コード列は pf現行（pf-eccube3）では任意で、空なら section_id を NULL に更新する（pf handler:45 は setRequired を付けず、handler:194 で empty→未設定に分岐）が、ee（移行先）では sectionCode()->setRequired(true) のため空値は BaseCsvColumn::validate→RequiredValidator で必須項目エラー admin.csv.error.data.require を積み breakAll となり NULL 更新経路が存在しない**。部門コード空の扱いは pf/ee で食い違うため、本乖離を隠さず、母集合-016（部門を未設定に戻す＝部門コード空）・-049/-082（空→NULL更新）はいずれも pf/ee食い違いで一意確定不能としTBDに置く | 「1 列目は商品コード列（必須）、2 列目は部門コード列」「各行のヘッダ名対応と列検証…失敗ごとに `breakAll`」 | pf(HareruyaEc)/ProductSectionUpdateImportHandler.php:45,194 / ee/ProductSectionUpdateImportHandler.php:117 / BaseCsvColumn.php:145-152 / RequiredValidator.php:34-41 / MessageStore.php:178-184 | pf-fallback | 0 |
| L1-M0335-007 | validation | 各データ行で商品コードに一致する規格が existsByProductCode で見つからないとき、商品不存在エラー admin.csv.error.product.not_exists（「◯ 行目の ◯ ではデータを取得できません。」）を積み breakAll で全体中断する（DB相関で該当しない商品コードは取込を完了させない） | 「商品コードに一致する規格が存在しない場合は商品不存在エラーを積み `breakAll`。」 | pf-md:84,104 / ProductSectionUpdateImportHandler.php:130-149 / MessageStore.php:283-288 | pf-fallback | 0 |
| L1-M0335-008 | validation | 部門コードが必須検証を通過した（非空の）行で mtb_section.code に一致する部門が無いとき、マスタ不存在エラー admin.csv.error.data.not_registered（「◯ : ◯ がマスターから取得できません。 ◯ 行目のデータを確認してください。」）を積み breakAll で全体中断する | 「部門コードが空でないときに `mtb_section.code` が一致する行が無い場合はマスタ不存在エラーを積み `breakAll`。」 | pf-md:84,105 / ProductSectionUpdateImportHandler.php:152-171 / MessageStore.php:268-273 | pf-fallback | 0 |
| L1-M0335-009 | http_flow | 部門更新CSVのPOSTは、取込（CsvImporter）が返した検証エラー各件（列数不一致・商品不存在・部門不存在等）および行数上限超過を addError で管理者向けフラッシュに積み、いずれの場合も常に GET /product/section/csv_upload へ302リダイレクトする（同一URLをrenderせずPRG）。ただしフォーム不正（子フィールド import_file の NotBlank/File 制約）は $form->getErrors()（deep=false）で取得されずフラッシュされない（無言でリダイレクト）。import_file が null かつフォームが有効という限定条件でのみ admin.common.csv_invalid_format をフラッシュする | 「各メッセージをフラッシュに積みリダイレクト。DB はロールバック」「検証・取込後、常に GET …/section/csv_upload へリダイレクトされ、フラッシュで結果が示される。」 | pf-md:35,70,235 / ProductSectionCsvController.php:133-147,170-174,194 / Form.php:669 / messages.en.yaml:1810 | pf-fallback | 1 |
| L1-M0335-010 | validation | 部門更新CSV登録はレコード数上限チェックを行い、5010件以上はエラーとする | 「レコード数上限チェックを実施。5010件以上はエラーとする。」 | 0204:部門更新CSV登録!処理概要 | excel | 0 |
| L1-M0335-011 | validation | ee実装は送信CSVの行数を countCsvRows で数え、ADMIN_CSV_IMPORT_MAX_ROWS=5010 以上のとき getCsvImportMaxRowsExceededMessage（admin.csv.error.upload.maxrecord「◯ 行を超えるCSVファイルは登録できません。」）を addError でフラッシュし、取込を行わず GET /product/section/csv_upload へリダイレクトする | 「その値が抽象コントローラ定数 `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`…をフラッシュしリダイレクトする。」 | pf-md:72,234 / ProductSectionCsvController.php:149-153 / AbstractController.php:364,442-447 | pf-fallback | 0 |
| L1-M0335-012 | validation | CSV各データ行の列数が2でないとき、共通ハンドラが列数不正エラー admin.csv.error.format.body（「CSVのフォーマットが一致しません。 ◯ 行目のデータを確認してください。」）を積み breakAll で全体中断し、取込は行われずPRGでリダイレクトする | 「各データ行の列数が 2 と一致すること…不一致なら共通メッセージストア経路で全体中断へ」 | pf-md:102,117 / BaseCsvImportHandler.php:72-77 / MessageStore.php:134-138 | pf-fallback | 0 |
| L1-M0335-013 | history | 部門更新CSVは取込がエラー無しで完了したときのみ dtb_csv_import_history に1件INSERTする（種別ID＝PRODUCT_SECTION_IMPORT_CSV_ID=11・ファイル名＝クライアントオリジナル名・作業者＝ログイン利用者ID）。取込がエラーを返しロールバックされたときは履歴INSERTを行わない。なお insertCsvImportHistory は mtb_csv_import_type.id=11 が存在しなければ無操作で返るため、履歴INSERTの前提として種別行11の存在が要る | 「成功時のみ INSERT。種別は ID 11。」「トランザクションがロールバックされた取込…履歴 INSERT は実行されず、フラッシュにエラーのみ。」 | pf-md:76,146,182 / ProductSectionCsvController.php:170-182 / DtbCsvImportHistoryRepository.php:42-47 / MtbCsvImportType.php:38 | pf-fallback | 0 |
| L1-M0335-014 | display_field | 部門更新CSV画面の取込履歴は種別ID11のみを（getQueryBuilderByCsvImportType で絞り込み）create_date 降順でページングし、他種別IDの履歴は含めない。クエリ page_count が許容リスト（10,50,100,300,500,1000,2000,10000,12000）に含まれるときだけセッションキー admin.product.section_csv.page_count に保存する。許容リスト外のときは当該リクエストの表示件数を既定値10に置換し、セッション保存値は更新しない（既存値を維持）。page_no はその都度セッションキー admin.product.section_csv.page_no へ書き戻す | 「クエリの件数が許容リストに含まれるときだけセッションに保存される。ページ番号はその都度セッションへ書き戻される。」「キー文字列 `admin.product.section_csv.page_count` と `…page_no` に保存する。」 | pf-md:36,57,58,270 / ProductSectionCsvController.php:87-97,96 / AbstractController.php:361,395,403-411 | pf-fallback | 0 |
| L1-M0335-015 | rollback | 部門更新CSVの取込は CsvImporter が単一トランザクション（beginTransaction）内で行い、各正常行の replaceSection ネイティブUPDATEを実行・flushしていく。後続行で breakAll したときトランザクション全体を rollback するため、先行して更新した行の section_id も取込前値へ戻る（部分書込みは残らない・履歴も増えない） | 「検証エラーで `breakAll` した場合はロールバックする。成功時のみコミットする。」「途中で `breakAll` した場合はトランザクションがロールバックされ一行も確定しない。」 | pf-md:144,286 / CsvImporter.php:222,251,254,261,274,289 / ProductClassRepository.php:2170 | pf-fallback | 0 |
| L1-M0335-016 | log | 部門更新CSVのPOSTは取込開始直前に情報ログ「部門更新CSV登録開始」・正常終了時「部門更新CSV登録完了」（件数count）・エラー結果時「部門更新CSV登録 異常終了」を出す（documentation-only＝アプリログの観測手段が未整備で画面/DBでは一意固定できずTBD） | 「情報ログ「部門更新CSV登録開始」」「情報ログ「部門更新CSV登録完了」と件数パラメータ `count`」「情報ログ「部門更新CSV登録 異常終了」」 | pf-md:73,75,76 / ProductSectionCsvController.php:155,171,177 | pf-fallback | 0 |
| L1-M0335-017 | validation | 部門更新CSVのフォーム（ee `CsvImportType`）の import_file は required で NotBlank（メッセージ指定なし＝Symfony既定「This value should not be blank.」＝英語「No value found.」）と File（maxSize=設定 eccube_csv_size メガバイト・既定5M）の制約を持つ。ただし当該NotBlank/Fileエラーはコントローラの $form->getErrors()（deep=false）で子フォーム制約が取得されず画面へフラッシュされない（表示挙動はL1-009）。母集合-092はNotBlankとFile maxSizeの両成分を要求するがmaxSize超過は大容量ファイルを要し純UIで一意判定困難のためTBD | 「`CsvImportType` の `NotBlank` と `File`（最大サイズ）。」「Symfony `File` のサイズ上限（`eccube_csv_size` をメガバイト単位に付与した値。配布既定は 5M）」 | pf-md:99,198 / CsvImportType.php:48-56 / validators.en.yaml:17 | pf-fallback | 1 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

下表の固定値は入力の再現手段であり期待値の正にしない。更新CSVを流すケースは後始末（.down.sql）でSEED状態へ復元（`@TBD-D5`）。**各異常系SEEDは単一の異常のみを持ち、ケースの入力を一意にする（B1）**。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提 | 管理者アカウント | 不要 |
| SEED-M0335-MASTERS | 取込の前提マスタ | 既存 mtb_section 数件（部門ID・部門コード既知値）・既存商品 dtb_product_class（product_code・現 section_id 既知値）・**mtb_csv_import_type に id=11（PRODUCT_SECTION_IMPORT_CSV_ID）の種別行が存在**（履歴INSERTの前提・M7） | 不要（参照） |
| SEED-M0335-SECT-VALIDCODE | 部門コード非空の正常取込 | 既存商品コード×既存部門コードの1行の正常CSV。対象商品の現 section_id 既知値 | 変更 section_id を復元＋成功時に追加された取込履歴（dtb_csv_import_history 種別ID11）を削除 |
| SEED-M0335-SECT-MULTIROWCSV | 複数データ行が各々UPDATEされる（各行処理）検証 | 別商品2データ行の正常CSV＝1行目=商品A×部門コードB・2行目=商品C×部門コードD。商品A/Cの現 section_id 既知値（いずれも部門B/Dとは異なる）・部門B/Dの部門ID既知値 | 変更 section_id（商品A・商品C）を復元＋成功時に追加された取込履歴（dtb_csv_import_history 種別ID11）を削除 |
| SEED-M0335-SECT-BREAKPROD | 商品不存在breakAll（先頭行で全体中断）検証 | 1データ行＝存在しない商品コード×妥当な部門コードのCSV | 不要（breakAll・ロールバック） |
| SEED-M0335-SECT-ROLLBACK | ロールバック実証（先行更新の巻き戻し）検証 | 1行目=既存商品コードA×既存部門コードB（section_idをA_orig→Bに変えようとする正常行）、2行目=存在しない商品コード（breakAll誘発）のCSV。商品Aの現 section_id=A_orig 既知値 | 不要（rollbackで復元） |
| SEED-M0335-SECT-BADCOLCOUNT | 列数不一致（フォーマット不正）検証 | データ行の列数が2でない（例3列）1データ行CSV | 不要（拒否） |
| SEED-M0335-SECT-MAXROW | 行数上限（5010件超）検証 | データ行が5010件以上（例5011行）の全行妥当なCSV | 不要（拒否） |
| SEED-M0335-SECT-HISTORY | 取込履歴の種別ID11絞り込み・ページング表示検証 | dtb_csv_import_history に部門更新CSV種別（種別ID11）の履歴を複数件（許容件数境界の確認用に十分な件数・例55件）＋**別種別ID（例＝他CSV種別）の履歴も混在**させ絞り込みを一意判定可能にする・mtb_csv_import_type id=11 | 不要（参照） |

---

## §3 取込CSV列マトリクス（参照情報）

| 列 | 必須/任意 | 検証・反映 | 根拠 |
|---|---|---|---|
| 商品コード | 必須（setRequired(true)・空→require error・breakAll） | 一致する規格 product_code 行すべての section_id を更新対象にする（不存在→商品不存在breakAll） | ProductSectionUpdateImportHandler.php:116,130-149 |
| 部門コード | pf現行=任意（空→NULL更新）／ee=必須 setRequired(true)（空→require error・breakAll。空→NULL更新はee非該当）＝pf/ee食い違い | 非空で mtb_section.code に実在すれば部門IDをセット（不存在→master不存在breakAll） | pf handler:45,194 / ee handler:117,152-171,191-196 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 12候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0335C-NNN[±英字]`（末尾＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **各ケースは単一入力・単一判定（B1）／母集合の実前提に忠実（別事実への置換禁止）**。
- **検証設計（Gate B9）**: 結果は成功フラッシュ（addSuccess）・取込検証エラー/行数上限のフラッシュ（addError）・取込履歴テーブルを画面で目視するのが主。**section_id は商品規格一覧/詳細に部門列が無く画面目視できないため（§10-6）、section_id反映・ロールバックは自動検証（内部・DB）に一元化**（画面期待欄には重複記載しない）。否定的事実・履歴の種別ID/件数・セッション内部値も『自動検証（内部）』へ。
- 操作手順は純UI操作。db.ts/afterEachは書かない（Gate B10）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-35_admin_product_product_section_csv_import	E2E-M0335C-001	IT-25	画面表示	P1	部門更新CSV登録画面がGETで開きファイル入力・アップロードボタン・フォーマット表・雛形リンク・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0335-SECT-HISTORY	—	1. 部門更新CSV登録画面 /%eccube_admin_route%/product/section/csv_upload を開く 2. ファイル入力・アップロードボタン・フォーマット表(商品コード・部門コードの両列に必須バッジ)・雛形リンク・下部の取込履歴テーブルが表示されることを確認	部門更新CSV登録画面が csv_product_section.twig(base_csv_upload継承)で開き、共通フレームのタイトル「商品管理」/「Products」、CSVアップロードカードにファイル入力とアップロードボタン「CSVファイルをアップロード」/「Upload a CSV file」、フォーマット表(商品コード・部門コードの両列に必須バッジ「必須」/「Required」)、雛形リンク「雛形ファイルダウンロード」/「Download a template」、下部に取込履歴テーブルが表示される [L1:L1-M0335-001; fixture:SEED-M0335-SECT-HISTORY@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-002	IT-20	JS挙動	P2	部門更新CSV登録はファイル選択でファイル名表示し送信時にローディングを出し確認ダイアログを出さない	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-VALIDCODE	正常な部門更新CSVファイル	1. 部門更新CSV登録画面でファイルを選択しラベルにファイル名が表示されることを確認 2. アップロードボタンを押下し送信前確認ダイアログが出ないこと・送信時にローディング表示が出ることを確認	ファイル選択でカスタムラベルにファイル名が表示され、フォーム送信時に $.changeLoading(true) のローディングが表示される。送信前確認ダイアログは表示されず、取込実行後もアップロード画面が自動でCSVを再読込しない [L1:L1-M0335-002; fixture:SEED-M0335-SECT-VALIDCODE@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-003	IT-25	雛形ダウンロード	P2	部門更新CSVの雛形ダウンロードでproduct_section_update.csvが得られる	ログイン済(SEED-M01-ADMIN)	—	1. 部門更新CSV登録画面で雛形リンク /%eccube_admin_route%/product/section/csv_template を実行 2. ダウンロードファイル名を確認	部門更新CSVの雛形ダウンロードを実行すると、ヘッダ行のみの product_section_update.csv が得られる [L1:L1-M0335-003; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-004	IT-07	取込成功	P1	正常な部門更新CSVが成功し成功フラッシュを表示しPRGで部門更新CSVアップロード画面に戻る	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-VALIDCODE	既存商品コード×既存部門コード(非空)の1行の正常CSVファイル	1. ファイルを選択しアップロードボタンを押下 2. 成功フラッシュが表示され部門更新CSVアップロード画面に戻ることを確認	部門更新CSVの正常POSTは全行成功でコミットし、成功フラッシュ「登録が完了しました。」/「Registration completed.」が管理画面上部に表示され、PRG後は部門更新CSVアップロード画面が表示される ／ 自動検証（内部）: POSTのHTTPレスポンスが302で Location が GET /%eccube_admin_route%/product/section/csv_upload（同一URLを直接renderしない） [L1:L1-M0335-004; fixture:SEED-M0335-SECT-VALIDCODE@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-005	IT-07	取込反映	P1	複数データ行のCSVは各行が処理され各商品のsection_idが各々更新される	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-MULTIROWCSV	別商品2データ行の正常CSVファイル(1行目=商品A×部門コードB、2行目=商品C×部門コードD)	1. 別商品2データ行のCSVを送信し成功フラッシュを確認	複数データ行のCSVは各行が1行ずつ onReadRow で処理され、成功フラッシュ「登録が完了しました。」が管理画面上部に表示される ／ 自動検証（内部・DB）: 各データ行で UPDATE dtb_product_class SET section_id が走り、商品A の section_id が部門コードBの部門IDに、商品C の section_id が部門コードDの部門IDに、それぞれ更新されている（いずれか一方でも取込前値のままなら各行UPDATE不成立＝不合格。商品規格画面に部門列が無いためDBで照合） [L1:L1-M0335-005; fixture:SEED-M0335-SECT-MULTIROWCSV@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-007	IT-22	中断	P1	存在しない商品コードの行はインポータ検証エラーで打ち切られフラッシュされて完了しない	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-BREAKPROD	存在しない商品コード×妥当な部門コードの1データ行CSVファイル	1. 存在しない商品コードのCSVを選択し送信 2. エラーフラッシュが表示されGET /product/section/csv_upload へ戻り成功フラッシュが出ないことを確認	商品コードが existsByProductCode で見つからず商品不存在エラー「◯ 行目の ◯ ではデータを取得できません。」が addError で管理画面上部にフラッシュされ、breakAllで取込は完了せず部門更新CSVアップロード画面に戻る ／ 自動検証（内部・DB）: POSTは302で GET /%eccube_admin_route%/product/section/csv_upload へリダイレクトし、dtb_product_class の section_id が変わらない [L1:L1-M0335-007,L1-M0335-009; fixture:SEED-M0335-SECT-BREAKPROD@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-008	IT-22	ロールバック	P1	先行正常行の更新は後続異常行のbreakAllでロールバックされ履歴も残らない	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-ROLLBACK	1行目=既存商品コードA×部門コードB(section_idをA_orig→Bに変えようとする正常行)、2行目=存在しない商品コード(breakAll誘発)のCSVファイル	1. 当該CSVを送信 2. エラーフラッシュが表示されGET /product/section/csv_upload へ戻り成功フラッシュが出ないことを確認 3. 取込履歴テーブルに新行が増えないことを確認	取込エラー（商品不存在）が管理画面上部にフラッシュされ、取込は完了せず部門更新CSVアップロード画面に戻り、取込履歴テーブルに新行が増えない ／ 自動検証（内部・DB）: 1行目の正常行で section_id を A_orig→B に更新（ステージ）した後、2行目の存在しない商品コードで breakAll しトランザクション全体が rollback されるため、商品A の dtb_product_class.section_id は取込前値 A_orig のまま（Bへ変わらない）で、dtb_csv_import_history が増えない。POSTは302で GET /%eccube_admin_route%/product/section/csv_upload へリダイレクト [L1:L1-M0335-015,L1-M0335-013; fixture:SEED-M0335-SECT-ROLLBACK@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-009	IT-17	フォーマット不一致	P1	データ行の列数が2でないCSVは列数不正エラーで取込されず同画面へ戻る	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-BADCOLCOUNT	データ行の列数が2でない(例3列)1データ行のCSVファイル	1. 列数不一致のCSVを選択し送信 2. エラーメッセージがフラッシュされGET /product/section/csv_upload へ戻り取込が行われないことを確認	データ行の列数が2でないとき列数不正エラー「CSVのフォーマットが一致しません。 ◯ 行目のデータを確認してください。」が管理画面上部にフラッシュされ、breakAllで取込は行われず部門更新CSVアップロード画面に戻る ／ 自動検証（内部・DB）: POSTは302で GET /%eccube_admin_route%/product/section/csv_upload へリダイレクトし、dtb_product_class の section_id が変わらない [L1:L1-M0335-012; fixture:SEED-M0335-SECT-BADCOLCOUNT@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-010	IT-20	画面遷移	P1	部門更新CSVのPOSTは同一URLをrenderせず常にPRGで302リダイレクトする	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-VALIDCODE	正常な部門更新CSVファイル	1. 正常な部門更新CSVを送信 2. 送信後に部門更新CSVアップロード画面が表示され成功フラッシュが出ることを確認	部門更新CSVの正常POSTの後は部門更新CSVアップロード画面が表示され、成功フラッシュがリダイレクト先で示される（同一URLの直接renderではなくPRG） ／ 自動検証（内部）: POSTのHTTPレスポンスが302で Location が GET /%eccube_admin_route%/product/section/csv_upload（同一URLを直接renderしない） [L1:L1-M0335-004; fixture:SEED-M0335-SECT-VALIDCODE@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-011	IT-12	行数上限	P1	データ行が5010件以上のCSVは行数上限エラーで取込されず同画面へ戻る	ログイン済／SEED-M0335-MASTERS／SEED-M0335-SECT-MAXROW	データ行が5010件以上(例5011行)の全行妥当なCSVファイル	1. 5010件以上のCSVを選択し送信 2. 行数上限エラーがフラッシュされGET /product/section/csv_upload へ戻り取込が行われないことを確認	送信CSVの行数が ADMIN_CSV_IMPORT_MAX_ROWS=5010 以上のとき「5010 行を超えるCSVファイルは登録できません。」(admin.csv.error.upload.maxrecord)が管理画面上部にフラッシュされ、取込は行われず部門更新CSVアップロード画面に戻る ／ 自動検証（内部・DB）: POSTは302で GET /%eccube_admin_route%/product/section/csv_upload へリダイレクトし、dtb_product_class の section_id が変わらない [L1:L1-M0335-011; fixture:SEED-M0335-SECT-MAXROW@TBD-D5]				
m03-35_admin_product_product_section_csv_import	E2E-M0335C-012	IT-15	セッション	P2	取込履歴の表示件数はクエリが許容リストに含まれるときだけセッションに保存されページ番号は書き戻される	ログイン済(SEED-M01-ADMIN)／SEED-M0335-SECT-HISTORY	—	1. 部門更新CSV登録画面をpage_count=50(許容値)で開き、種別ID11の履歴だけが50件単位で表示され混在させた別種別IDの履歴が一覧に現れないことを確認 2. 続けてpage_count=7(非許容値)で開くと当該リクエストの表示件数が既定値10に置換されることを確認 3. page_no=2を指定して開き2ページ目の履歴が表示されることを確認	取込履歴は種別ID11のみをcreate_date降順で表示し、SEEDに混在させた別種別IDの履歴は一覧に現れない。page_count=50(許容値)では50件単位で表示され、直後のpage_count=7(非許容値)では当該リクエストの表示件数が既定値10に置換される(10件単位表示)。page_no=2で2ページ目が表示される ／ 自動検証（内部）: 許容値50はセッションキー admin.product.section_csv.page_count に保存され、非許容値7ではセッション保存値は50のまま維持される(当該リクエストの表示件数のみ既定10に置換される)。page_no はセッションキー admin.product.section_csv.page_no へ書き戻される [L1:L1-M0335-014; fixture:SEED-M0335-SECT-HISTORY@TBD-D5]				
```

---

## §5 ja/en locale対応表（Gate B4・ee源）

翻訳キー描画のメッセージ/ラベルを ee `messages.en.yaml`／`validators.en.yaml` でgrep確認した結果、**LS=1（英訳あり）は4件**（L1-001/004/009/017）。en逐語はee英語資源の逐語のみ。

| oracle_id | 対象キー | ja逐語 | en逐語 | en源(file:line) |
|---|---|---|---|---|
| L1-M0335-001 | admin.product.product_management（フレームタイトル） | 商品管理 | Products | messages.en.yaml:1930 |
| L1-M0335-001 | admin.common.csv_upload（アップロードボタン） | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804 |
| L1-M0335-001 | admin.common.required（必須バッジ） | 必須 | Required | messages.en.yaml:1785 |
| L1-M0335-001 | admin.common.csv_skeleton_download（雛形リンク） | 雛形ファイルダウンロード | Download a template | messages.en.yaml:1805 |
| L1-M0335-004 | admin.register.complete（成功フラッシュ） | 登録が完了しました。 | Registration completed. | messages.en.yaml:1676 |
| L1-M0335-009 | admin.common.csv_invalid_format（import_file null時のみ） | CSVのフォーマットが一致しません | Unmatched CSV format | messages.en.yaml:1810 |
| L1-M0335-017 | CsvImportType NotBlank（Symfony既定メッセージ） | この値は空にしないでください。 | No value found. | validators.en.yaml:17 |

- **LS=0（英訳資源が無い／固定値／Excel逐語）**: サブタイトル admin.product.product_section_csv（ja「部門登録CSVアップロード」・en不在＝messages.ja.yaml:2017）／カード見出し admin.product.product_section_csv_upload_title（ja「部門登録CSV」・en不在＝ja.yaml:2018）／admin.product.product_section_csv_format_title（ja「部門登録CSVファイルフォーマット」・en不在＝ja.yaml:2019）はいずれも英訳資源が無くLS=0。L1-006の admin.csv.error.data.require（ja.yaml:2411）・L1-007の admin.csv.error.product.not_exists（ja.yaml:2416）・L1-008の admin.csv.error.data.not_registered（ja.yaml:2412）・L1-011の admin.csv.error.upload.maxrecord（ja.yaml:1626）・L1-012の admin.csv.error.format.body（ja.yaml:2408）は messages.en.yaml に不在＝英訳なしLS=0（en grep 0件確認済）。L1-003 雛形ファイル名・L1-010 の上限値はExcel逐語/固定値でLS=0。他の挙動claimはメッセージを持たずLS=0。
- **pf-md表示食い違い（記録）**: pf-md:44 は sub_title を「画面では『部門更新CSV登録』」と括弧書きするが、実 twig `csv_product_section.twig:5` の描画キー admin.product.product_section_csv の ja値は「部門登録CSVアップロード」（messages.ja.yaml:2017）である。UI=ee正としてサブタイトルは ee ja値を記録（§10-2）。
- **CSRFメッセージ食い違い（記録・DELEG根拠）**: pf-md MSG-001「CSRFトークンが無効です、再送信してください。」だが、実 CSRF 検証は Symfony 既定メッセージ「Invalid CSRF token.」を validators.ja.yaml:22 が「ログインできませんでした。入力内容に誤りがないかご確認ください。」・validators.en.yaml:22 が「Failed to sign in. Please make sure if the credentials are correct.」へ翻訳する（CSV機能に対し意味的に不整合な共通CSRFメッセージ）。文言が一次資料と実装で食い違い、CSRFは管理画面共通検証のため-002はDELEG（§8.3）。
- **NotBlank/File非表示（記録）**: L1-017のNotBlank英語「No value found.」は資源として実在（LS=1）だが、コントローラは `getErrors()`（deep=false・Form.php:669）で子フォーム制約を取得しないため本機能の画面には表示されない（表示挙動＝L1-009）。LSは資源実在で判定するためLS=1、表示不能は§10-3で明記。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: 部門更新CSV登録画面（ee `csv_product_section.twig`／`base_csv_upload.twig`）のセレクタと route（`GET /%eccube_admin_route%/product/section/csv_upload`・`POST /%eccube_admin_route%/product/section/import`・`GET /%eccube_admin_route%/product/section/csv_template`）を再利用。セレクタ・route確認のみに使い、期待値はL1解決器経由（en逐語は§5のee源）。
- 取込結果はフラッシュメッセージDOM（成功=addSuccess／取込検証エラー・行数上限=addError）＋取込履歴テーブルDOMを目視（B9・主）。PRGのため取込直後は302で GET /product/section/csv_upload に戻りフラッシュが1回表示される。
- **section_id の反映・ロールバックは商品規格一覧/詳細に部門（section）列が無く画面目視できないため（§10-6）、db.ts（dtb_product_class.section_id・dtb_csv_import_history）で自動検証（内部・DB）に一元化する**（画面期待欄には重複記載しない）。セッションキー（admin.product.section_csv.page_count/page_no）値もセッション内部で自動検証（内部）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は M0成果物（D8/D9/D5型）として未実装。

### 6.1 取込CSVファイルの入力契約

1. CSVはUI操作でアップロードする（ファイル選択→送信ボタン）。直接POSTは用いない（CSRFはフォーム由来）。
2. 取込CSVは fixture（SEED-M0335-*）として用意し、**単一異常で作り分ける（B1一意性）**。ロールバック実証（C-008）は「1行目正常／2行目異常」の順序を固定する。
3. 成功取込ケース（**C-002/C-004/C-005/C-010**・いずれも正常CSVを成功POSTするため毎回 dtb_csv_import_history に種別ID11の履歴を1件追加する）は取込後 .down.sql で section_id をSEED状態へ復元し、**成功時に追加された取込履歴（dtb_csv_import_history 種別ID11）も削除**して冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001/C-002/C-003/C-012 | Playwright | 画面DOM/セッション内部 | 画面表示・JS・雛形・履歴セッション |
| C-004/C-010 | Playwright（+内部で302確認） | フラッシュ/PRG後画面 | 成功フラッシュ・PRG |
| C-005/C-007/C-008/C-009/C-011 | Playwright + DB | フラッシュ/DB | section_id反映・breakAll・ロールバック・列数不一致・行数上限 |

---

## §8 母集合会計（105全量・欠番0・重複0）

**会計サマリ: bound 19／TBD 11／excluded 75（うちDELEG 2件=-002/-003を含む）＝母集合105（欠番0・重複0）。** bound19母集合行→11候補ケース（C-001〜C-012のうちC-006欠番・§4）。真のTBDは11件（§8.2）。

### 8.1 候補ケース（C-ref）→L1-ref対応

| C-ref | 観点 | L1-ref | 被覆母集合 |
|---|---|---|---|
| C-001 | 画面表示 | L1-001 | 005,093,104 |
| C-002 | JS挙動 | L1-002 | 006,007,053,086,105 |
| C-003 | 雛形ダウンロード | L1-003 | （母集合固有一意行なし＝documentation） |
| C-004 | 取込成功 | L1-004 | 012 |
| C-005 | 取込反映 | L1-005 | 083 |
| C-006 | （欠番） | — | （-016は部門コード空のpf/ee食い違いでTBDへ移動） |
| C-007 | 中断 | L1-007,L1-009 | 095 |
| C-008 | ロールバック | L1-015,L1-013 | 019,085 |
| C-009 | フォーマット不一致 | L1-012 | 064 |
| C-010 | 画面遷移 | L1-004 | 102 |
| C-011 | 行数上限 | L1-011 | 010 |
| C-012 | セッション | L1-014 | 004,099,103 |

- bound母集合行（19件・重複0）: 004,005,006,007,010,012,019,053,064,083,085,086,093,095,099,102,103,104,105。
- ※C-007（中断）は -095（インポータが返した検証エラー）のみ。SEED-BREAKPROD（存在しない商品コード）で「取込CsvImporterが返した検証エラーを addError でフラッシュしPRG・取込未完了」（商品不存在＝L1-007）を一意判定する。**R4是正: -018（前提「同一 product_code を持つ規格が複数行」）は replaceSection の UPDATE WHERE product_code=? で全規格行が同じ値に更新されエラーにならない（pf:145 / ProductClassRepository.php:2170）ため取込機能に非該当＝excluded**。C-008（ロールバック）の -019/-085 は「トランザクションがロールバックされた取込＝履歴INSERTなし・フラッシュにエラーのみ」の同一観測。C-003（雛形DL）は実eeに実在するが母集合に固有一意行が無く documentation。

### 8.2 母集合105行 対応表（No→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力/取込結果一致（取込機能に非該当・汎用スタブ） | **excluded** | — |
| 002 | CSRF→管理画面共通のトークン検証へDELEG。フォームは _token を送信し(twig:54)CSRF失敗時はroot formエラーがフラッシュされるが、pf-md MSG-001「CSRFトークンが無効です…」と実resource validators「Invalid CSRF token.」→ja「ログインできませんでした…」が食い違い、CSRFは管理画面共通検証のため固有boundにしない | **DELEG** | — |
| 003 | 未認証操作＝共通認証（M01-01代表）へDELEG。期待テキストのPRGリダイレクトはC-010の-102が被覆 | **DELEG** | — |
| 004 | 件数が許容リストに含まれるときだけセッション保存（セッション） | bound | C-012 |
| 005 | 部門更新CSV登録画面が開く（画面表示） | bound | C-001 |
| 006 | ファイル選択でカスタムラベルへファイル名表示（JS挙動） | bound | C-002 |
| 007 | 送信前確認ダイアログはない（JS挙動） | bound | C-002 |
| 008 | 母集合の期待が内容不定で具体挙動を持たない（送信前ダイアログ無しはC-002の-007が被覆） | **excluded** | — |
| 009 | M03-35-MSG-002（import_file null→csv_invalid_format）の到達条件がNotBlankと競合し純UIで一意再現困難（フォーム有効かつファイルnullは通常到達不能） | **TBD** | — |
| 010 | M03-35-MSG-003＝レコード数上限5010件超でエラー表示し完了しない（行数上限） | bound | C-011 |
| 011 | 必須バリデーションでエラー表示されず継続（対象フィールドなし・正常行継続はC-004/C-005に内包の汎用スタブ） | **excluded** | — |
| 012 | 登録完了を表示しPRGで画面へ戻る＝成功フラッシュ（取込成功） | bound | C-004 |
| 013 | 相関バリデーションでエラー表示され完了しない（具体相関検証なし・汎用スタブ／実在挙動は-016/-018でbound） | **excluded** | — |
| 014 | 相関でエラー表示されず継続（汎用スタブ・成功パスC-005に内包） | **excluded** | — |
| 015 | 相関でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 016 | 部門を未設定に戻したい＝部門コード空。pf現行は任意で空→NULL更新だがeeは setRequired(true) で空→require breakAll。pf/ee食い違いで期待を一意確定不能 | **TBD** | — |
| 017 | DB相関でエラー表示されず継続（汎用スタブ・成功パスC-005に内包） | **excluded** | — |
| 018 | 前提「同一 product_code を持つ規格が複数行」＝replaceSection の UPDATE WHERE product_code で全規格行が同じ値に更新されエラーにならない（取込機能に非該当・複数規格の更新はC-005で被覆） | **excluded** | — |
| 019 | トランザクションがロールバックされた取込は履歴INSERTされずフラッシュにエラーのみ（ロールバック） | bound | C-008 |
| 020 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 021 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 022 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 023 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 024 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 025 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 026 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 027 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 028 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 029 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 030 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 031 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 032 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 033 | 検索条件が取得結果に含まれる/含まれない（履歴種別ID11絞り込みの一般記述・対象レコード具体値未指定の汎用スタブ） | **excluded** | — |
| 034 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 035 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 036 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 037 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 038 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 039 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 040 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 041 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 042 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 043 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 044 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 045 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 046 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 047 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 048 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 049 | 母集合期待「部門コード空→検証スキップしsection_id NULL更新」が実ee（部門コードは setRequired(true)＝空→require breakAll）と矛盾し一意確定不能 | **TBD** | — |
| 050 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 051 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 052 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 053 | アップロード画面は実行後も自動でCSVを再読込しない（JS挙動） | bound | C-002 |
| 054 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 055 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 056 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 057 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 058 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 059 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 060 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 061 | 前提フォーム不正だが子フォーム import_file の NotBlank/File は getErrors(deep=false) で非フラッシュ・root(CSRF)成分のみフラッシュで期待「エラーフラッシュ」を一意判定不能 | **TBD** | — |
| 062 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 063 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 064 | フォーマット定義でエラー表示され完了しない＝列数不一致（フォーマット不一致） | bound | C-009 |
| 065 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 066 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 067 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 068 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 069 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 070 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 071 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 072 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 073 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 074 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 075 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 076 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 077 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 078 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 079 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 080 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 081 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 082 | 母集合期待「部門コード空→検証スキップしsection_id NULL更新」が実ee（部門コードは setRequired(true)＝空→require breakAll）と矛盾し一意確定不能 | **TBD** | — |
| 083 | 各行でUPDATEが走る＝複数データ行が各々 onReadRow で処理され各商品のsection_idが各々更新される（別商品2行fixtureで各行UPDATEを一意判定・取込反映） | bound | C-005 |
| 084 | 実行結果/登録内容/更新内容が追加/変更される・されない（対象レコード具体値未指定の汎用スタブ・section_id反映はC-005、breakAll否定的事実はC-006/C-007/C-008で被覆） | **excluded** | — |
| 085 | トランザクションがロールバックされた取込は履歴INSERTされずフラッシュにエラーのみ（ロールバック） | bound | C-008 |
| 086 | アップロード画面は実行後も自動でCSVを再読込しない（JS挙動） | bound | C-002 |
| 087 | 成功時出力に「ログ」必須成分（情報ログ）を含みアプリログ観測手段が未整備で一意固定不能 | **TBD** | — |
| 088 | 失敗時出力に「ログ文言『異常終了』」必須成分を含みアプリログ観測手段が未整備で一意固定不能 | **TBD** | — |
| 089 | 副作用に「情報ログ」必須成分（section_id更新＋履歴＋情報ログ）を含みアプリログ観測手段が未整備で一意固定不能 | **TBD** | — |
| 090 | 更新対象/対象テーブル直接保存（不要削除含まない）（内部DB設計注記・単一観測挙動でない汎用スタブ） | **excluded** | — |
| 091 | 更新対象/対象テーブル直接保存（不要削除含まない）（内部DB設計注記・単一観測挙動でない汎用スタブ） | **excluded** | — |
| 092 | CsvImportTypeのNotBlankとFile最大サイズ両成分。フォーム不正はgetErrors(deep=false)で非フラッシュ、File maxSize超過は大容量ファイル要で純UI一意判定困難 | **TBD** | — |
| 093 | GET /product/section/csv_upload で画面が開く（画面表示） | bound | C-001 |
| 094 | 前提フォーム不正だが子フォーム制約は非フラッシュ・root(CSRF)成分のみで期待「エラーフラッシュ」を一意判定不能（-061と同） | **TBD** | — |
| 095 | インポータが返した検証エラーを各メッセージでフラッシュしリダイレクト（中断） | bound | C-007 |
| 096 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 097 | 情報ログ「部門更新CSV登録完了」件数count＝アプリログ観測手段未整備で一意固定不能 | **TBD** | — |
| 098 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 099 | admin.product.section_csv.page_count/page_no に保存（セッション） | bound | C-012 |
| 100 | 出力内容/実行結果が一致/継続（一致基準・観測対象未指定の汎用スタブ・フォーマット不一致実在挙動はC-009で被覆） | **excluded** | — |
| 101 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/ファイル選択（取込機能に非該当・ファイル名表示実在挙動はC-002で被覆） | **excluded** | — |
| 102 | 検証・取込後は常にGET…/section/csv_uploadへリダイレクト（画面遷移・成功時PRG） | bound | C-010 |
| 103 | 件数が許容リストに含まれるときだけセッション保存（セッション） | bound | C-012 |
| 104 | csv_product_section.twig は base_csv_upload.twig を継承（画面表示） | bound | C-001 |
| 105 | ファイル選択でカスタムラベルへファイル名表示（JS挙動） | bound | C-002 |

`func_scope_check` 判定: 親105/105会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 保留・DELEG

### 9.1 TBD（真の保留・11件・§8.2）

| 母集合末尾 | 観点 | 理由 |
|---|---|---|
| 009 | HTTPステータス | M03-35-MSG-002（import_file null→csv_invalid_format）の到達条件がNotBlankと競合し純UIで一意再現困難（フォーム有効かつファイルnullは通常到達不能） |
| 016 | 相関バリデーション | 部門を未設定に戻す＝部門コード空。pf現行は任意で空→section_id NULL更新だがeeは sectionCode()->setRequired(true) で空→require breakAll。pf/ee食い違いで期待を一意確定不能（L1-006の乖離） |
| 049 | 実行結果 | 母集合期待「部門コード空→section_id NULL更新」がee実装（部門コード setRequired(true)＝空→require breakAll）と矛盾し一意確定不能（L1-006と食い違い） |
| 061 | 実行結果 | 前提フォーム不正だが子フォーム制約は getErrors(deep=false) で非フラッシュ・root(CSRF)成分のみで期待「エラーフラッシュ」を一意判定不能 |
| 082 | 初期行数 | 母集合期待「部門コード空→section_id NULL更新」がee実装と矛盾し一意確定不能 |
| 087 | ロールバック | 成功時出力にログ必須成分（情報ログ）を含みアプリログ観測手段が未整備で一意固定不能 |
| 088 | 画面レイアウト | 失敗時出力にログ文言「異常終了」必須成分を含み観測手段未整備 |
| 089 | 画面レイアウト | 副作用にsection_id更新＋履歴＋情報ログを含み、情報ログ成分の観測手段未整備で一意固定不能 |
| 092 | 画面レイアウト | NotBlank+File maxSize両成分。フォーム不正はgetErrors(deep=false)で非フラッシュ、File maxSize超過は大容量ファイル要で純UI一意判定困難 |
| 094 | 画面レイアウト | 前提フォーム不正だが子フォーム制約は非フラッシュ・root(CSRF)成分のみで期待「エラーフラッシュ」を一意判定不能（-061と同） |
| 097 | 画面表示データ | 情報ログ「部門更新CSV登録完了」件数count＝アプリログ観測手段未整備で一意固定不能 |

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureファイルの実バイト内容（文字コード・改行・列順・列数不一致・5011行境界・ロールバック用2行順序） | fixture manifest（D5型）未整備＝要実機 |
| -092/L1-017 の File maxSize 超過（eccube_csv_size メガバイト） | 大容量ファイル（既定5M超）アップロードを要し純UIで一意判定困難＝要実機 |
| -087/-088/-089/-097/L1-016（情報ログ完了/開始/異常終了） | アプリログ観測手段未整備＝documentation-only |

### 9.3 excluded＝75件（DELEG2含む・すべてtsv非出力・§8.2）

DELEG: -002（CSRF→管理画面共通CSRF検証）・-003（未認証→共通認証M01-01）。excluded: 汎用/非該当スタブ（-001/-008/-011/-013/-014/-015/-017）・**-018（同一product_code複数規格はUPDATE全行更新でエラーにならず取込機能に非該当・R4是正）**・検索条件スタブ（-020〜-033）・実行結果/登録内容スタブ（-034〜-048,-050〜-052,-054〜-060,-084）・出力内容スタブ（-062/-063/-065〜-071/-096/-098/-100）・ファイル操作非該当（-072〜-081,-101）・内部DB注記（-090/-091）。

## §10 特記事項（片側断定せず記録）

1. **M03-20との機能境界（R1確定・維持）**: M03-35はee正準（SUT唯一入口 `/product/section/csv_upload`・`/import`・`/csv_template`・controller:54,81,124）。commit済 M03-20 flow(1)（pf旧route `/product/product_section_update_csv_upload`・render 200）は本機能領分の過剰スコープであり、是正（flow(1)をM03-35へDELEG・M03-20はsheet-34部門マスタ登録に限定）はコーディネータ管掌で別途扱う。
2. **pf-md表示食い違い（sub_title）**: pf-md:44 の括弧書き「部門更新CSV登録」に対し実 twig の描画キー admin.product.product_section_csv の ja値は「部門登録CSVアップロード」。UI=ee正で ee ja値を記録。
3. **R1-M3 フォーム不正はフラッシュされない（R2で会計反映）**: `getErrors()` は既定 deep=false（Form.php:669）で子フィールド import_file の NotBlank/File 制約を含まない。よってファイル未選択（NotBlank）・サイズ超過（File）は画面にフラッシュされず無言リダイレクト。確実にフラッシュされるのは取込CsvImporterが返した検証エラー（controller:170-174）と行数上限（149-153）。R2で母集合-061/-094（前提フォーム不正）・-009（前提MSG-002）を C-007（importer error）から外し**TBD**へ是正（会計整合）。
4. **R4-M3 部門コード空はpf/ee食い違い（TBD）**: pf現行（pf-eccube3）は sectionCode に setRequired を付けず（pf handler:45）空なら section_id を NULL 更新する（pf handler:194 empty分岐）が、ee は sectionCode()->setRequired(true)（ee handler:117）で空→RequiredValidator（BaseCsvColumn:145-152 / RequiredValidator:34-41）→addRequireError＋breakAll。**pf/ee乖離を隠さず、-016（部門を未設定に戻したい＝部門コード空）・-049/-082（空→NULL主張）はいずれもpf/ee食い違いで一意確定不能としTBD**（R3以前の-016→C-006 boundを撤回）。
5. **R4-M2/R2 前提忠実化**: 母集合の実前提へ忠実化＝-010（前提MSG-003=5010上限）→行数上限C-011、-083（同一商品コード複数データ行）→複数CSV行後勝ちC-005。**R4是正: -018（前提「同一 product_code を持つ規格が複数行」）は replaceSection の UPDATE WHERE product_code=? で全規格行が同じ値に更新されエラーにならないため取込機能に非該当＝excluded**（R3以前の-018→C-007 boundを撤回・C-007は-095のみ）。C-010（画面遷移）は成功CSVでPRGのみを判定し失敗分岐を断定しない。ログ必須成分の-087/-088/-089は観測未整備でTBD（-097に限定しない）。
6. **R1-M6/R2-M4/R4-M1 section_id・302は画面目視不能で内部検証一元化**: ee 商品一覧/規格に部門（section）列表示が無いため、section_id反映・ロールバックは db.ts（dtb_product_class.section_id）の自動検証（内部・DB）へ一元化し、画面期待欄・操作手順（純UI）には重複記載しない（C-004/C-005/C-007/C-008/C-009/C-011）。正確な302/URLも自動検証（内部）列のみに置き、操作手順から除去した（C-004）。画面期待は成功/エラーフラッシュ・PRG後画面に限定。
7. **R2-M5 ロールバック実証fixture**: CsvImporter は単一トランザクション（beginTransaction 222）で各正常行の replaceSection ネイティブUPDATEを flush（254,267）していき、後続 breakAll で全体 rollback（274,289）する。C-008 は「1行目正常（section_idをステージ更新）／2行目異常（breakAll）」で商品Aの section_id が取込前値へ戻ることを DB検証し、先行更新のロールバック（L1-015）と履歴非INSERT（L1-013）を実証する（1行目異常型では「後続未処理」しか示せないため是正）。
8. **R2-M6 CSRFはDELEG**: 実画面はフォームに _token を送信（twig:54）し、CSRF失敗時は root form エラーが getErrors(deep=false) で取得されフラッシュされ得るが、pf-md MSG-001「CSRFトークンが無効です…」と実resource validators「Invalid CSRF token.」→ja「ログインできませんでした…」が食い違い、かつCSRFは管理画面共通のトークン検証である。よって-002は「具体挙動なし」ではなく**管理画面共通CSRF検証へDELEG**（excluded）とした。
9. **R2-M7 履歴INSERT前提シード**: `insertCsvImportHistory` は mtb_csv_import_type.id が無ければ無操作で返る（Repository:45-47）。C-004/C-008 等で履歴の増減を判定するため、SEED-M0335-MASTERS/SEED-M0335-SECT-HISTORY に mtb_csv_import_type id=11 の存在を明記した（環境依存正例の解消）。
10. **R1-M8 L1-010/L1-011分割・L1-017 LS（維持）**: L1-010 は Excel逐語のみ（excel源・LS=0）、ee const/maxrecordフラッシュ/redirect は L1-011（pf-fallback）。L1-017 は NotBlank英語「No value found.」（validators.en.yaml:17）実在で LS=1（ただし getErrors(deep=false) で画面非表示）。
11. **確認モーダルの極性**: Excel sheet-52・pf-md:47・ee twig いずれも送信前確認ダイアログ無し。確認モーダル無しで確定（C-002）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない。emit_concretized_tsv.py が本表を読み適用。**本正準表のNNN集合は§8.2 bound行と一致する（19件）。** excluded/TBD行は観点補正に含めない。

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | セッション | 期待「許容リスト件数のみセッション保存」(L1-014)。ラベル「対象データ」は誤り |
| 005 | 画面表示 | 期待「部門更新CSV登録画面が開く」(L1-001)。ラベル「出力抑止」は誤り |
| 006 | JS挙動 | 期待「ファイル名表示」(L1-002)。ラベル「識別子」は誤り |
| 007 | JS挙動 | 期待「確認ダイアログなし」(L1-002)。ラベル「状態変化」は誤り |
| 010 | 行数上限 | 期待「レコード数上限5010件超でエラー完了しない」(L1-011)。前提M03-35-MSG-003に従いラベル「必須バリデーション」を行数上限へ補正 |
| 012 | 取込成功 | 期待「登録完了表示＋画面遷移」(L1-004)。ラベル「文字列長バリデーション」は誤り |
| 019 | ロールバック | 期待「ロールバック取込は履歴INSERTなし・フラッシュにエラーのみ」(L1-015/L1-013)。ラベル「部分入力」をロールバックへ補正 |
| 053 | JS挙動 | 期待「自動再読込しない」(L1-002)。ラベル「更新内容」は誤り |
| 064 | フォーマット不一致 | 期待「列数不一致エラーで完了しない」(L1-012)。ラベル「フォーマット定義」を不一致へ補正 |
| 083 | 取込反映 | 期待「各行でUPDATEが走る＝section_id更新」(L1-005)。ラベル「表示順」は誤り |
| 085 | ロールバック | 期待「ロールバック取込は履歴INSERTなし・フラッシュにエラーのみ」(L1-015/L1-013)。ラベル「内部情報」をロールバックへ補正 |
| 086 | JS挙動 | 期待「自動再読込しない」(L1-002)。ラベル「排他制御」は誤り |
| 093 | 画面表示 | 期待「GET /product/section/csv_upload で開く」(L1-001)。ラベル「画面レイアウト」は誤り |
| 095 | 中断 | 期待「インポータ検証エラーをフラッシュしリダイレクト」(L1-009)。ラベル「一覧」を中断へ補正 |
| 099 | セッション | 期待「page_count/page_noセッション保存」(L1-014)。ラベル「画面表示データ」は誤り |
| 102 | 画面遷移 | 期待「常にGET…/section/csv_uploadへリダイレクト」(L1-004 PRG)。ラベル「非同期更新」は誤り |
| 103 | セッション | 期待「許容リスト件数のみセッション保存」(L1-014)。ラベル「エラー継続」は誤り |
| 104 | 画面表示 | 期待「twig継承」(L1-001)。ラベル「公開コンテンツ」は誤り |
| 105 | JS挙動 | 期待「ファイル名表示」(L1-002)。ラベル「データ正当性」は誤り |
