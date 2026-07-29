# 候補: m03-31 セール用価格変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合88全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1 Major4件 是正反映版（2026-07-29・pf/ee/Excel実ソース照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（committed）の構造・取込検証設計を踏襲。ただし**値・claim・列名・メッセージ・列定義はM03-31自身の一次資料から**取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能はTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。B12の共有は**代表候補が共有行の要件を実際に被覆する完全重複のみ**。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。観測対象＝**結果画面（成功／エラーフラッシュ・取込履歴テーブル）＋取込効果（対象規格を再表示して価格反映確認）**。
> **★SUT=ee／pf/ee食い違いの明示（本機能の最重要注意）**: 本E2EのSUTは **ee（ec-cube-enterprise）** である。**UI挙動・画面ラベル・accept属性・ボタン文言・enはee(SUT)実装を正**とし、pf UI（`card-csvimport.js`のスピナー・両ボタンdisabled・accept="text/csv,text/tsv"・「CSVファイルのアップロード」文言）は**boundしない**。pf現行（render・成功キー `admin.product.csv_import.save.complete`・支店連携）はee（302リダイレクト・成功キー `admin.register.complete`・支店連携未移植・セール条件別基準価格保持実装）と食い違うため、成功フラッシュの**文言**・リダイレクト有無・支店連携はpf-fallbackで断定せず、共有挙動（成功→フラッシュ＋履歴INSERT＋画面提示、エラー→履歴増えず）のみをboundする。
> **R1 Major是正（4件）**: (M1)L1-001をExcel識別ID画面部品のexcel源へ・JS挙動（-008/-088）はpf/ee食い違い＋Excel未規定でexcludedへ・enは実キー(product_price_csv_*_title＝英訳なし)をgrep確認し是正。(M2)C-003（正常取込）のセールフラグを登録済=有効(1)×CSV=有効(1)・NM無割引規格に固定し販売価格を一意化。(M3)C-003を規格価格＋タグ全置換＋価格履歴＋成功フラッシュ＋取込履歴＋再表示の**包括取込**へ拡張し-023の要件を代表が被覆。(M4)-074（販売/買取必須）・-081（7列CSV形式）をexcel源のフォーマット表検証（C-001）へboundへ。
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet「セール用価格変更CSVアップロード」（機能No=M03-31・機能名「セール用価格変更CSV登録」・概要「セール用の価格変更をCSVにて一括で更新する」・作成者=城下・作成日2025-06-12・更新者=堀部・更新日2025-09-16）。関連=sheet「セール用価格変更CSVフォーマット」（同機能No・7列定義）。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は実Excel座標 `0204:セール用価格変更CSVアップロード!<セル>`／`0204:セール用価格変更CSVフォーマット!<セル>` で表記する。
- **pf現行md（記述の参照・source_class当否はpf実sourceで判定）**: `functions/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.md`（以下「pf-md:行」）。区分宣言「本機能のカスタマイズ区分は現行踏襲である。」（pf-md:9）。pf-mdは支店連携・render等pf現行を記述する。ee（SUT）と食い違う箇所はpf-fallback断定しない（§10）。
- **pf実source（pf現行挙動・source_class=pf-fallbackの根拠。ただしee(SUT)と一致する挙動のみ採用）**:
  `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（csvProductPriceUpload:886／CSV_IMPORT_MAX=5010:391）／`.../Service/Csv/Importer/CsvImporter.php`（validateBeforeImport:190／importRows:222／isSuccessful:272）／`.../Service/Csv/Importer/Event/ProductPriceImportHandler.php`（validateProductExists:174／high_price_code IS NULL:244／updateProductTag:286／insertPriceHistory:470）／`.../Event/BaseCsvImportHandler.php`（全不合格→breakAll:52-98）／`.../Validator/PriceConsistencyRowValidator.php:44`／`.../Importer/MessageStore.php`／`Resource/locale/message.ja.yml`（csv error:1094-1149）。
- **ee実source（SUT・source_class不使用だがUI/挙動/文言/enの正）**:
  `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php`（csv:88 render＋page_count session:93／getCsvHeader:214／getRequiredCsvHeader:232／csv_format_title=admin.product.product_price_csv_format_title:113／import:132 常にredirect／success=admin.register.complete:188／file===null=admin.common.csv_invalid_format:151／maxrows:157）／
  `.../Resource/template/admin/Product/base_csv_upload.twig`（accept ".csv, text/csv, .tsv, text/tsv":20／submit `$.changeLoading(true)` のみ・ボタンdisabledなし:29-30／upload button=admin.common.csv_upload:74／必須バッジ=admin.common.required:101／項目名=admin.common.csv_item_name:90／説明=admin.common.csv_description:91）／`csv_product_price.twig`（sub_title=admin.product.product_price_csv:5）／
  `.../Service/Csv/Importer/Event/ProductPriceImportHandler.php`（列必須 setRequired sellPrice:163/buyPrice:164／セール条件別価格:325-347／standard_price保持:332／アラート:334,341／NM販売=PriceUtil::discount:359／支店連携コメントアウト:87-95）／`.../Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php`（NMはnmPriceそのまま:55-56）／`.../Util/PriceUtil.php`（discount:38 ＝10円単位に切上げ）／`.../Controller/AbstractController.php`（ADMIN_CSV_IMPORT_MAX_ROWS=5010:364／getCsvImportMaxRowsExceededMessage:442）／`.../Form/Type/Admin/CsvImportType.php`（import_file NotBlank:53）／**enロケール源 `.../Resource/locale/messages.en.yaml`**・ja源 `messages.ja.yaml`。
- 母集合: `integration_test/all_it_cases.tsv` の `IT-M03-31-ADMIN-PRODUCT-PRODUCT-SALE-PRICE-CSV-IMPORT-001..088`（88件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実sourceは挙動照合・enロケール源に使い、オラクルの source_class には不使用。
- **en（★en-grep結果を根拠に記録）**: 取込エラーキー（`admin.csv.error.upload.maxrecord`／`.format.header`／`.data.empty`／`.product.price_valid`／`.product.not_exists`）・セール条件別アラート（`admin.product.price_csv.sell_price_not_reflected`／`.normal_product_sell_price_unchanged`）・**セール用価格変更CSV固有の画面タイトル/見出し**（`admin.product.product_price_csv_upload_title`＝「セール用価格変更CSV」／`admin.product.product_price_csv_format_title`＝「セール用価格変更CSVファイルフォーマット」／`admin.product.product_price_csv`／`admin.common.csv_item_name`＝「項目名」／`admin.common.csv_description`＝「説明」）は **ee `messages.en.yaml` に不在＝英訳なし**（grep 0件・§5）。一方 ee 共通ボタン/バッジ `admin.common.csv_upload`＝「CSVファイルをアップロード」（en「Upload a CSV file」en:1804）・`admin.common.required`＝「必須」（en「Required」en:1785）は en実在。**全L1 claimは LS=0**（display claim L1-001はExcel逐語ja＝英訳なし・ee共通ラベルenは§5に参照記録し当claimのオラクルにしない）。
- **B1事前スイープ**: 「場合がある／し得る／なり得／可能性」該当0件。-019（支店連携）はpf現行実装・ee未移植（コメントアウト）でSUT観測不能＝TBD。セール条件別基準価格保持（Excel）は母集合に固有一意判定行が無くdocumentation-only（L1-014〜017）。

---

## §1 L1原子オラクル表

全22claim。**source_class列は excel／pf-fallback のみ**（excel8＝L1-001/014/015/016/017/018/019/021・pf-fallback14）。**全claim LS=0**（取込エラー文言・アラート・画面タイトルは英訳なし／display claimはExcel逐語ja／挙動claimは非メッセージ。ee共通ラベルenは§5参照）。

**オラクル記録の被覆状況（正直分類）**: 本表22claimのうち **documentation-only は L1-014〜017（セール条件別基準価格保持＝母集合に固有一意判定行が無い・Excel刷新後カスタマイズ）・L1-019（履歴ページング＝母集合に固有行が無い）・L1-020（支店連携＝ee未移植でSUT観測不能・-019 TBD）・L1-021（スマレジ連携＝外部）・L1-022（取込ログ＝観測手段未整備）の8claim**で、残りは bound候補ケースが検証する（§8対応表参照）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0331-001 | display_field | セール用価格変更CSVアップロード画面は、Excel識別IDどおり「ファイルを選択」ボタン・「CSVファイルの(アップロード)」ボタン・「セール用価格変更CSV」フォーマットテーブル・「雛形ファイルダウンロード」ボタン・件数プルダウン（10/50/100/300/500/1000/2000/10000/12000）・CSVインポート履歴（ファイル名・アップロード日時・作業者、インポート日時降順）を常に表示する（ee(SUT)は共通テンプレートで描画し、アップロードボタン文言は「CSVファイルをアップロード」・ファイル入力 accept は「.csv, text/csv, .tsv, text/tsv」）。ページングのリンクは履歴が既定表示件数（50件）を超える場合にのみ表示される | 「1｜ファイルを選択｜ボタン」「2｜CSVファイルの｜ボタン｜CSVファイルのアップロードと入力チェックを実施。」「3｜セール用価格変更CSV｜テーブル」「4｜雛形ファイルダウンロード｜ボタン」「5｜件数｜プルダウン｜10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」「6｜該当レコード表示｜インポート履歴データを出力、インポート日時の降順」「7｜ページング｜リンク」 | 0204:セール用価格変更CSVアップロード!E124,E125,AB125,E126,E127,E128,AB128,E129,AB129,E130／ee ProductPriceCsvController.php:97／csv_import_history.twig:8,44 | excel | 0 |
| L1-M0331-002 | validation | アップロードファイルは必須（NotBlank）である。ファイル未選択で送信するとフォーム検証が不合格となりエラーが表示され、取込は行われずアップロード画面が示される | 「アップロードファイル｜必須（`NotBlank`）。」「フォーム検証（ファイル必須・サイズ上限・CSVのMIME）を行う。不合格ならエラーを設定し、同じ画面を再表示する。」 | pf-md:224,97／ee CsvImportType.php:53／pf ProductCsvController.php:897 | pf-fallback | 0 |
| L1-M0331-003 | message | アップロード内容の概算行数が上限定数（5010）以上のとき、取込を行わず「5010 行を超えるCSVファイルは登録できません。」（キー admin.csv.error.upload.maxrecord・上限値5010を埋め込む）を表示してアップロード画面が示される | 「行数が上限以上のとき。`{N}`は上限値。キー`admin.csv.error.upload.maxrecord`。」「%d 行を超えるCSVファイルは登録できません。」 | pf-md:283,138／pf ProductCsvController.php:909／message.ja.yml:1097／ee AbstractController.php:364,442 | pf-fallback | 0 |
| L1-M0331-004 | message | 取込処理はヘッダ行が無いとき「CSVのフォーマットが一致しません。」（admin.csv.error.format.header）、2行目以降にデータ行が無いとき「CSVデータが存在しません。」（admin.csv.error.data.empty）を返し、取込を中止して成功フラッシュ・履歴INSERTを行わない | 「ヘッダ行が無いとき。キー`admin.csv.error.format.header`。」「データ行が無いとき。キー`admin.csv.error.data.empty`。」 | pf-md:289,290／pf CsvImporter.php:196,206／message.ja.yml:1100,1112 | pf-fallback | 0 |
| L1-M0331-005 | validation | トランザクション開始後、データ行ごとに列数一致・各列（必須・形式）検証・行バリデータを実行する。列数不一致・列欠落・列検証不合格・行バリデータ不合格・商品ID不存在はいずれも breakAll（当該行で処理を打ち切り後続行を処理しない）となる。本ハンドラは skipRow を用いず、行エラーは全て breakAll である | 「1行ずつ次の順序で処理する。行検証（必須・形式・商品の存在・販売価格と買取価格の大小）。商品が存在しない場合などは取込全体を中止する。」 | pf-md:101,102／pf BaseCsvImportHandler.php:58,74,80,93／ProductPriceImportHandler.php:118,186 | pf-fallback | 0 |
| L1-M0331-006 | message | 行バリデータで買取価格が販売価格を上回る行は「N 行目の販売価格は買取価格より大きい価格を設定してください。」（admin.csv.error.product.price_valid・Nは行番号）でエラーとなり breakAll する | 「販売価格より買取価格が大きい行｜当該行のエラーを記録する。」「%d 行目の販売価格は買取価格より大きい価格を設定してください。」 | pf-md:268,291／pf PriceConsistencyRowValidator.php:43,44／message.ja.yml:1149 | pf-fallback | 0 |
| L1-M0331-007 | message | 商品IDで商品を検索し（del_flg=無効の商品）、行の商品IDが存在しないとき「N 行目の 商品ID ではデータを取得できません。」（admin.csv.error.product.not_exists）をエラーとして積み breakAll し取込全体を中止する | 「商品IDが存在しない行｜当該行のエラーを記録し、取込全体を中止しロールバックする。」「%d 行目の %s ではデータを取得できません。」 | pf-md:269,292／pf ProductPriceImportHandler.php:180,186／MessageStore.php:206／message.ja.yml:1144 | pf-fallback | 0 |
| L1-M0331-008 | rollback | 取込のコミット可否は isSuccessful = messageStore->count()===0 || !hasBreak（CsvImporter:272）。breakAll が発生した行がある取込はロールバックされ、対象規格・タグ・価格履歴・取込履歴のいずれにも書き込まれない | 「エラーが無ければトランザクションを確定し、エラーがあればロールバックする。」「`$isSuccessful = $messageStore->count() === 0 || !$hasBreak;`」 | pf-md:104,159／pf CsvImporter.php:272-277 | pf-fallback | 0 |
| L1-M0331-009 | message | 取込にエラーが無いとき、成功フラッシュ（成功メッセージ）が管理画面上部に表示され、取込履歴（dtb_csv_import_history 種別ID PRODUCT_PRICE）にファイル名・作業者を1件INSERTし、アップロード画面が示される（再表示される）。エラーを含む取込では成功フラッシュも履歴INSERTも行わない | 「取込成功時は成功フラッシュを設定し、取込履歴へファイル名を記録する。失敗時は履歴を記録しない。」「同一画面を再表示し、成功フラッシュと更新後の取込履歴を表示。」 | pf-md:106,250／pf ProductCsvController.php:922-926／ee ProductPriceCsvController.php:188-190 | pf-fallback | 0 |
| L1-M0331-010 | data_write | 成功取込では、対象商品ID・言語IDで抽出した規格の買取価格（buy_price・NM規格はCSVの買取価格をそのまま・SP/MP/HP等は状態別に算出）・セールフラグ（sale_flg・未指定は非セール0）・帯URL（belt_url・空はNULL）を更新する。販売価格（price02）はセールフラグ条件（L1-014〜017）に従い、NMかつ割引無し規格ではCSVの販売価格を10円単位に切り上げた値となる。反映は商品編集画面の再表示で確認できる | 「行取込（対象規格の販売価格・買取価格・セールフラグ・帯URLの更新、価格に変更があれば価格履歴の記録）。」 | pf-md:103,137／ee ProductPriceImportHandler.php:349,359,360-375／DiscountBuyPriceCalculator.php:55／PriceUtil.php:38 | pf-fallback | 0 |
| L1-M0331-011 | data_write | 行ごとに当該商品IDのタグ（dtb_product_tag）を全削除してから、CSVのタグ(ID)で登録し直す全置換である。CSVに含まれないタグは残らない | 「行ごとに当該商品のタグを全削除し、CSVのタグIDで登録し直す。」「CSVの指定が確定値になる。CSVに含まれないタグは残らない。」 | pf-md:135,160／pf ProductPriceImportHandler.php:293-294／ee ProductPriceImportHandler.php:282-296 | pf-fallback | 0 |
| L1-M0331-012 | data_write | 販売価格または買取価格が変更された規格についてのみ価格履歴（dtb_price_history）を1件記録する。変更が無い規格には記録しない | 「販売価格または買取価格が変更された規格についてのみ価格履歴を記録する。変更なしでは記録しない。」 | pf-md:136,161／pf ProductPriceImportHandler.php:476-499／ee ProductPriceImportHandler.php:388-397 | pf-fallback | 0 |
| L1-M0331-013 | data_write | 高額商品コード（high_price_code）を持つ規格は取込対象規格の抽出クエリ（high_price_code IS NULL 条件）から除外され、本CSVでは価格・セールフラグ・帯URLを更新しない | 「高額商品コードを持つ規格は本CSVの更新対象から外す。」「高額商品コードを持つ規格は本CSVで更新しない。」 | pf-md:132,162／pf ProductPriceImportHandler.php:244／ee ProductPriceImportHandler.php:214-234 | pf-fallback | 0 |
| L1-M0331-014 | data_write | 刷新後仕様（Excel最優先）では、セールフラグオフ時は基準価格を販売価格に反映し、セールフラグオン時は販売価格を変更する | 「・セールフラグオフ時｜基準価格を販売価格に反映する」「・セールフラグオン時｜販売価格を変更する」 | 0204:セール用価格変更CSVアップロード!E64,G65,E66,G67 | excel | 0 |
| L1-M0331-015 | data_write | 刷新後仕様では、登録済セールフラグが無効(0)かつCSVのセールフラグが有効(1)の規格は通常商品→セール商品への切替として処理し、セールフラグを0→1に切り替え、販売価格をCSVの販売価格に更新し、基準価格は更新せず現在登録済のままとし、買取価格をCSVの買取価格に更新する | 「通常商品 → セール商品 へ切替として処理する」「販売価格を、CSVに設定されている販売価格に更新する」「基準価格は更新しない、現在登録済の基準価格のまま」 | 0204:セール用価格変更CSVアップロード!G92,G93,G94,G95,G96 | excel | 0 |
| L1-M0331-016 | data_write | 刷新後仕様では、登録済セールフラグが有効(1)かつCSVのセールフラグが無効(0)の規格はセール商品→通常商品への切替として処理し、セールフラグを1→0に切り替え、販売価格を現在登録済の基準価格からコピーしCSVの販売価格は無視し、買取価格をCSVの買取価格に更新する。CSVに販売価格が設定されている場合はCSVの価格が反映されていない旨のアラートを画面上に表示する | 「セール商品 → 通常商品 へ切替として処理する」「販売価格を、現在登録済の基準価格からコピーする」「CSVに設定されている販売価格は無視する」「CSVに販売価格が設定されている場合は、CSVの価格は反映されていない旨(アラート)を画面上に表示する」 | 0204:セール用価格変更CSVアップロード!G106,G107,G108,G109,G111 | excel | 0 |
| L1-M0331-017 | data_write | 刷新後仕様では、登録済セールフラグが無効(0)かつCSVのセールフラグが無効(0)の規格（通常商品）は販売価格・基準価格を更新せず現在登録済のままとし、買取価格のみCSVの買取価格に更新する。通常商品の販売価格は変更できない旨のアラートを画面上に表示する | 「通常商品の販売価格、買取価格は変更できない」「販売価格は更新しない、現在登録済の販売価格のまま」「買取価格を、CSVに設定されている買取価格に更新する」「通常商品の販売価格は変更できない旨(アラート)を画面上に表示する」 | 0204:セール用価格変更CSVアップロード!G114,G116,G117,G119 | excel | 0 |
| L1-M0331-018 | display_field | セール用価格変更CSVフォーマットは 商品ID（主キー・数値整数・必須）／言語ID（主キー・数値整数・必須）／販売価格（数値整数・必須）／買取価格（数値整数・必須）／セールフラグ（数値整数・必須・最大1桁・刷新後カスタマイズで必須項目に変更）／帯URL（文字型・最大128・任意）／タグ(ID)（文字型・任意・カンマ区切りで複数指定可能）の7列で構成される。ee(SUT)のフォーマット表は必須列（商品ID・言語ID・販売価格・買取価格・セールフラグ）に必須バッジを表示する | 「商品ID｜◯｜数値(整数)｜◯」「セールフラグ｜数値(整数)｜◯｜1」「※カスタマイズ対応、必須項目に変更」「帯URL｜文字型｜128」「タグ(ID)｜文字型」 | 0204:セール用価格変更CSVフォーマット!E8,U8,E12,U12,W12,AG12,E13,W13,E14 | excel | 0 |
| L1-M0331-019 | display_field | 刷新後仕様では、取込履歴のページングは選択したページへ遷移するリンクで、履歴件数が既定表示件数（50件）を超えて2ページ以上になる場合にのみ表示される（documentation-only＝母集合に51件以上を固定してページングを一意判定する要求行が無い） | 「ページング｜リンク｜選択したページへ遷移する」 | 0204:セール用価格変更CSVアップロード!AB130／ee ProductPriceCsvController.php:97／csv_import_history.twig:44 | excel | 0 |
| L1-M0331-020 | integration | pf現行実装は取込成功時にトランザクションを確定したうえで支店システムへ取込対象の商品更新を通知する（onAfterImportでBranchUpdateService::noticeProductUpdate）。ただしee実装（SUT）では当該通知は未移植（コメントアウト）であり、SUTでは支店連携通知は発生しない（documentation-only＝pf/ee食い違いでSUT観測不能） | 「取込成功時にトランザクション確定後、支店システムへ取込対象の商品更新を通知する。」「// TODO: BranchUpdateService の移植が必要」 | pf-md:163,172／pf ProductPriceImportHandler.php:86-90／ee ProductPriceImportHandler.php:87-95 | pf-fallback | 0 |
| L1-M0331-021 | integration | 刷新後仕様では、条件を満たす規格はスマレジ連携フラグを有効とし、連携対象条件を満たす場合に限りスマレジへ商品情報を連携する（外部連携・documentation-only） | 「条件を満たす場合スマレジ連携フラグを有効とする」「連携対象の条件を満たしている場合に限り、スマレジへ商品情報を連携する」 | 0204:セール用価格変更CSVアップロード!E70,E71,D85 | excel | 0 |
| L1-M0331-022 | log | 取込開始時に情報ログ「セール用価格変更CSV登録開始」、成功時に「セール用価格変更CSV登録完了」と件数、異常終了時に「セール用価格変更CSV登録 異常終了」を出力する（documentation-only＝ログ観測手段が現行ハーネスで未整備） | 「取込開始｜「セール用価格変更CSV登録開始」。」「取込完了｜「セール用価格変更CSV登録完了」と取込件数。」「取込異常終了｜「セール用価格変更CSV登録 異常終了」。」 | pf-md:308,309,310／pf ProductCsvController.php:915,924,921 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとしてUI操作でアップロードする。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0331-MASTERS | 取込の前提マスタ | 言語(ID)・状態(NM等)・割引率・買取減額率・買取価格表マスタ一式 | 不要（参照） |
| SEED-M0331-HISTORY | 取込履歴の表示検証 | dtb_csv_import_history に種別ID PRODUCT_PRICE の履歴を数件（既定表示件数50件以下・ページング非発生） | 不要（参照） |
| SEED-M0331-VALIDUPDATE | 正常取込（包括・セール条件固定＝通常→セール切替） | 既存商品1件（NM規格1件・割引率なし〔dis.rate NULL〕・言語ID既知・**登録済セールフラグ=無効(0)**・現行 販売価格S0/買取価格B0・旧タグT0付与済）。入力CSVは 当該商品ID・言語ID・販売価格S1（10円単位・S1≠S0）・買取価格B1（B1≦S1・B1≠B0）・**セールフラグ=有効(1)**・帯URL=U1・タグ(ID)=T1（T0を含まない）の1行 | 対象規格・タグ・追加された価格履歴・取込履歴を復元 |
| SEED-M0331-MAXROW | 行数上限（5010）検証 | データ行が改行数5010以上のCSV | 不要（拒否・書込みなし） |
| SEED-M0331-BADHEADER | フォーマットエラー検証（ヘッダ行なし） | ヘッダ行が無い（空の）CSVファイル | 不要（中止・書込みなし） |
| SEED-M0331-NODATA | データなしエラー検証（データ行なし） | ヘッダ行のみでデータ行が無いCSVファイル | 不要（中止・書込みなし） |
| SEED-M0331-NOPRODUCT | 商品ID不存在（breakAll）検証 | 存在しない商品IDを指定した1行CSV（他列は妥当） | 不要（打ち切り・書込みなし） |
| SEED-M0331-PRICEINVALID | 価格整合（買取>販売）検証 | 買取価格が販売価格を上回る1行CSV（他列は妥当） | 不要（打ち切り・書込みなし） |
| SEED-M0331-HIGHPRICE | 高額商品除外検証 | 高額商品コードを持つ規格の商品ID（現行 販売価格HS0）＋当該商品IDに価格を与える1行CSV | 対象商品を復元（本来は非更新） |

---

## §3 取込CSV列マトリクス（参照情報・L1-018はexcel源）

取込CSV列は Excel「セール用価格変更CSVフォーマット」およびハンドラの列定義（getColumns）と一致。ee(SUT)は 商品ID・言語ID・販売価格・買取価格・セールフラグ を必須列（setRequired(true)／必須バッジ）として扱う。

| 区分 | 列 | 備考 |
|---|---|---|
| 必須／キー | 商品ID（主キー・数値整数）・言語ID（主キー・数値整数） | 0204:フォーマット!E8,E9・U8,U9／ee handler:161,162 |
| 必須 | 販売価格（数値整数）・買取価格（数値整数）・セールフラグ（数値整数・最大1桁・刷新後カスタマイズで必須化） | 0204:フォーマット!E10-E12,U10-U12,AG12／ee handler:163,164 |
| 任意 | 帯URL（文字型・最大128・空はNULL）・タグ(ID)（文字型・カンマ区切りで複数指定可能・全置換） | 0204:フォーマット!E13,W13,E14 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 8候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。
- テストIDは `E2E-M0331C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。C-002/C-009 は欠番（C-002=JS挙動はpf/ee食い違いでexcluded・C-009=タグ全置換は包括取込C-003へ統合）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラーの**フラッシュ**と**取込履歴テーブル**を画面で目視するのが主。(2)取込効果は**対象規格を再表示**して具体フィールド照合（無値オラクル禁止）。(3)DB自動検証は外部IFで検知不能な否定的事実（ロールバック＝何も書かれない）＋価格履歴の増分＋高額商品規格の非更新に限る。
- 操作手順は純UI操作（ファイル選択→「CSVファイルをアップロード」ボタン押下→結果画面／対象規格再表示）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-001	IT-15	画面表示	P1	アップロード画面がExcel識別IDの画面部品とフォーマット表7列を表示する	ログイン済（SEED-M01-ADMIN）／SEED-M0331-HISTORY	—	1. セール用価格変更CSVアップロード画面をメニューまたはブックマークから開く 2. 「ファイルを選択」欄・「CSVファイルをアップロード」ボタン・見出し「セール用価格変更CSV」・フォーマット表・「雛形ファイルダウンロード」ボタン・件数プルダウン・CSVインポート履歴テーブルが表示されることを確認 3. フォーマット表に7列（商品ID・言語(ID)・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)）が並び、必須列（商品ID・言語(ID)・販売価格・買取価格・セールフラグ）に必須バッジが付くことを確認 4. 件数プルダウンの選択肢が10件・50件・100件・300件・500件・1000件・2000件・10000件・12000件であることを確認	アップロード画面はExcel識別IDどおり「ファイルを選択」ボタン・「CSVファイルをアップロード」ボタン（ee共通ラベル・ファイル入力 accept=.csv, text/csv, .tsv, text/tsv）・見出し「セール用価格変更CSV」・フォーマット表・「雛形ファイルダウンロード」ボタン・件数プルダウン（選択肢 10件・50件・100件・300件・500件・1000件・2000件・10000件・12000件）・CSVインポート履歴テーブル（ファイル名・アップロード日時・作業者の列、インポート日時の降順で各履歴行を表示）を常に表示する。フォーマット表は7列（商品ID・言語(ID)・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)）で構成され、必須列（商品ID・言語(ID)・販売価格・買取価格・セールフラグ）に必須バッジが付き、任意列（帯URL・タグ(ID)）にはバッジが付かない（履歴が既定表示件数50件以下のためページングのリンクは表示されない） [L1:L1-M0331-001,L1-M0331-018; fixture:SEED-M0331-HISTORY@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-003	IT-07	取込成功（包括）	P1	正常CSVの包括取込が成功し成功フラッシュ・履歴新行・規格価格反映・セール切替・タグ全置換・価格履歴増分を確認する	ログイン済／SEED-M0331-MASTERS／SEED-M0331-VALIDUPDATE	既存商品（NM規格・割引なし・登録済セールフラグ=無効(0)・現行 販売価格S0/買取価格B0・旧タグT0）の商品ID・言語ID・販売価格S1（10円単位・≠S0）・買取価格B1（B1≦S1・≠B0）・セールフラグ=有効(1)・帯URL=U1・タグ(ID)=T1（T0を含まない）を与える1行CSVファイル	1. 上記の包括CSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面に成功フラッシュが表示されエラー表示がないことを確認 3. CSVインポート履歴テーブルに新行（ファイル名・日時・作業者）が1件増えたことを確認 4. 商品編集画面で対象NM規格を再表示し、販売価格＝S1・買取価格＝B1・セールフラグ＝有効（無効から切替）・帯URL＝U1・タグがT1のみ（旧タグT0が残っていない）となっていることを確認	登録済セールフラグ無効(0)×CSVセールフラグ有効(1)の通常商品→セール商品への切替として、対象NM規格（割引なし）のセールフラグが無効(0)→有効(1)に切り替わり、販売価格＝CSVの販売価格S1を10円単位に切り上げた値（S1が10円単位ならS1）・買取価格＝CSVの買取価格B1（NMはそのまま）・帯URL＝U1に更新され、基準価格は更新されない。タグはCSVのT1へ全置換され旧タグT0は残らない。アップロード画面に成功フラッシュが管理画面上部に表示されCSVインポート履歴テーブルに新規1行が表示される（すべて画面で照合） ／ 自動検証（内部・DB）: 販売価格・買取価格が変わったため dtb_price_history が対象規格について1件増える [L1:L1-M0331-009,L1-M0331-010,L1-M0331-011,L1-M0331-012,L1-M0331-015; fixture:SEED-M0331-VALIDUPDATE@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-004	IT-12	行数上限	P1	概算行数5010以上のCSVは上限超過エラーで取込されずアップロード画面が示される	ログイン済／SEED-M0331-MAXROW	改行数5010以上のCSVファイル	1. 5010行以上のCSVを選択し「CSVファイルをアップロード」を押下 2. 上限超過エラー表示とアップロード画面が示されることを確認	エラーメッセージ「5010 行を超えるCSVファイルは登録できません。」（キー admin.csv.error.upload.maxrecord・上限値5010・本メッセージは英訳なし＝ja固定）が管理画面上部に表示され、取込は行われずアップロード画面が示される ／ 自動検証（内部・DB）: 対象規格・価格履歴・取込履歴とも増減なし [L1:L1-M0331-003; fixture:SEED-M0331-MAXROW@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-005	IT-17	フォーマットエラー	P2	ヘッダ行なしのCSVはフォーマットエラー・データ行なしのCSVはデータなしエラーで取込中止され成功しない	ログイン済／SEED-M0331-BADHEADER／SEED-M0331-NODATA	ヘッダ行が無い（空の）CSVファイルと、ヘッダ行のみでデータ行が無いCSVファイルの2ファイル	1. ヘッダ行が無い（空の）CSVを選択し「CSVファイルをアップロード」を押下→「CSVのフォーマットが一致しません。」が表示され成功フラッシュ非表示・履歴が増えないことを確認 2. 続けてヘッダ行のみ（データ行なし）のCSVを選択し「CSVファイルをアップロード」を押下→「CSVデータが存在しません。」が表示され成功フラッシュ非表示・履歴が増えないことを確認	ヘッダ行が無いとき「CSVのフォーマットが一致しません。」（admin.csv.error.format.header）が表示され取込が中止される。ヘッダ行のみでデータ行が無いとき「CSVデータが存在しません。」（admin.csv.error.data.empty）が表示され取込が中止される。いずれの分岐でも成功フラッシュは出ずCSVインポート履歴テーブルに新行が増えない [L1:L1-M0331-004,L1-M0331-009; fixture:SEED-M0331-BADHEADER@TBD-D5,SEED-M0331-NODATA@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-006	IT-06	存在検証（breakAll・ロールバック）	P1	商品IDが存在しない行はbreakAllで打ち切られエラー表示され成功せず何も書き込まれない	ログイン済／SEED-M0331-MASTERS／SEED-M0331-NOPRODUCT	存在しない商品IDを指定した1行CSVファイル（他列は妥当）	1. 存在しない商品IDのCSVを選択し「CSVファイルをアップロード」を押下 2. 商品ID不存在エラー表示・成功フラッシュ非表示・履歴が増えないことを確認	「N 行目の 商品ID ではデータを取得できません。」（admin.csv.error.product.not_exists・Nは行番号）が表示され、当該行で breakAll し取込全体を中止する。成功フラッシュは出ずCSVインポート履歴テーブルに新行が増えない ／ 自動検証（内部・DB）: 対象規格・タグ・価格履歴・取込履歴とも書込みが無い（ロールバック） [L1:L1-M0331-007,L1-M0331-005,L1-M0331-008; fixture:SEED-M0331-NOPRODUCT@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-007	IT-22	価格整合検証（breakAll）	P2	買取価格が販売価格を上回る行はbreakAllで打ち切られエラー表示され成功しない	ログイン済／SEED-M0331-MASTERS／SEED-M0331-PRICEINVALID	買取価格が販売価格を上回る1行CSVファイル（他列は妥当）	1. 買取価格＞販売価格のCSVを選択し「CSVファイルをアップロード」を押下 2. 価格整合エラー表示・成功フラッシュ非表示・履歴が増えないことを確認	「N 行目の販売価格は買取価格より大きい価格を設定してください。」（admin.csv.error.product.price_valid・Nは行番号）が表示され、当該行で breakAll し取込を打ち切る。成功フラッシュは出ずCSVインポート履歴テーブルに新行が増えない ／ 自動検証（内部・DB）: 対象規格・価格履歴・取込履歴とも書込みが無い（ロールバック） [L1:L1-M0331-006,L1-M0331-005,L1-M0331-008; fixture:SEED-M0331-PRICEINVALID@TBD-D5]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-008	IT-23	ファイル必須検証	P2	ファイル未選択で送信するとフォーム検証エラーが表示され取込されない	ログイン済	ファイルを選択しない送信	1. ファイルを選択せず「CSVファイルをアップロード」を押下 2. フォーム検証エラー表示と取込が行われないことを確認	アップロードファイルは必須（NotBlank）のため、ファイル未選択で送信するとフォーム検証が不合格となりエラーが表示され、取込は行われずアップロード画面が示される [L1:L1-M0331-002; fixture:—]				
m03-31_admin_product_product_sale_price_csv_import	E2E-M0331C-010	IT-25	高額商品除外	P2	高額商品コードを持つ規格は本CSVでは価格更新されない	ログイン済／SEED-M0331-MASTERS／SEED-M0331-HIGHPRICE	高額商品コードを持つ規格の商品IDに価格を与える1行CSVファイル	1. 高額商品規格を対象にしたCSVを選択し「CSVファイルをアップロード」を押下 2. 取込後に対象の高額商品規格を再表示し価格が更新されていないことを確認	高額商品コード（high_price_code）を持つ規格は取込対象抽出（high_price_code IS NULL 条件）から除外され、本CSVでは価格・セールフラグ・帯URLが更新されない。商品編集画面で当該高額商品規格を再表示すると価格は取込前のままである ／ 自動検証（内部・DB）: 当該高額商品規格の price02・buy_price が取込前と不変・当該規格の価格履歴が増えない [L1:L1-M0331-013; fixture:SEED-M0331-HIGHPRICE@TBD-D5]				
```

---

## §5 ja/en locale対応表（★en-grep結果を根拠に記録・R1 Major1是正）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。**セール用価格変更CSV固有の画面タイトル/見出し・取込エラー文言・セール条件別アラートはgrep 0件＝英訳なし**。ee共通ボタン/バッジのみen実在（ただしL1-001はExcel逐語源のためオラクルにはenを付さない・LS=0）。

| L1 | キー | ja逐語（値解決後） | en（ee messages.en.yaml） | en確認（grep結果） |
|---|---|---|---|---|
| L1-001（参照・ee共通ラベル） | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804（en実在・ただしL1-001はExcel源でオラクルはja部品名） |
| L1-001/018（参照・ee共通ラベル） | admin.common.required | 必須 | Required | messages.en.yaml:1785（en実在） |
| L1-001（見出し・SUT実キー） | admin.product.product_price_csv_upload_title | セール用価格変更CSV | （英訳なし＝不在） | grep 0件（ja: messages.ja.yaml:1998） |
| L1-001（フォーマット見出し・SUT実キー） | admin.product.product_price_csv_format_title | セール用価格変更CSVファイルフォーマット | （英訳なし＝不在） | grep 0件（ja: messages.ja.yaml:1999・R1 Major1で誤claim是正） |
| L1-001（サブタイトル・SUT実キー） | admin.product.product_price_csv | セール用価格変更CSVアップロード | （英訳なし＝不在） | grep 0件（ja: messages.ja.yaml:1997） |
| L1-001/018（表見出し） | admin.common.csv_item_name / csv_description | 項目名／説明 | （英訳なし＝不在） | grep 0件（ja: messages.ja.yaml:1747,1748） |
| L1-003 | admin.csv.error.upload.maxrecord | 5010 行を超えるCSVファイルは登録できません。 | （英訳なし＝不在） | grep 0件（ja: message.ja.yml:1097／ee messages.ja.yaml:1626） |
| L1-004 | admin.csv.error.format.header | CSVのフォーマットが一致しません。 | （英訳なし＝不在） | grep 0件（ja: message.ja.yml:1100／ee messages.ja.yaml:2407） |
| L1-004 | admin.csv.error.data.empty | CSVデータが存在しません。 | （英訳なし＝不在） | grep 0件（ja: message.ja.yml:1112／ee messages.ja.yaml:2409） |
| L1-006 | admin.csv.error.product.price_valid | %d 行目の販売価格は買取価格より大きい価格を設定してください。 | （英訳なし＝不在） | grep 0件（ja: message.ja.yml:1149／ee messages.ja.yaml:2421） |
| L1-007 | admin.csv.error.product.not_exists | %d 行目の %s ではデータを取得できません。 | （英訳なし＝不在） | grep 0件（ja: message.ja.yml:1144／ee messages.ja.yaml:2416） |
| L1-002 | （ee CsvImportType の Assert\NotBlank・キーなし・messageなし） | 既定NotBlank文言（バリデータロケール） | （バリデータロケール依存） | ee CsvImportType.php:53（messageなし＝既定・pf は message.ja.yml:1094「ファイルを選択してください。」） |
| L1-016 | admin.product.price_csv.sell_price_not_reflected | %d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。 | （英訳なし＝不在） | grep 0件（ee messages.ja.yaml:2127） |
| L1-017 | admin.product.price_csv.normal_product_sell_price_unchanged | %d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。 | （英訳なし＝不在） | grep 0件（ee messages.ja.yaml:2128） |
| （参考・成功文言・pf/ee食い違い） | pf admin.product.csv_import.save.complete ／ ee admin.register.complete | 商品登録CSVファイルをアップロードしました。（pf）／登録が完了しました。（ee） | Registration completed.（ee） | ee messages.en.yaml:1676（ee側のみen実在・本書は成功文言を断定せず挙動をbound・§10） |

全L1 claim は LS=0（Excel逐語ja／取込エラー・アラート・固有見出しは英訳なし／挙動claimは非メッセージ）。ee共通ラベル（csv_upload・required）のenは実在するがExcel源claimのオラクルには付さず本表に参照記録する。

---

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（ee `csv_product_price.twig`／共通 `base_csv_upload.twig`）のセレクタと route（ee: `GET /%eccube_admin_route%/product/product_price/product_price_csv_upload`／`POST …/product_price/import`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。
- 取込結果の検証はフラッシュメッセージDOM（集合）＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象規格を商品編集で再表示して反映確認（B9）。
- db.ts自動検証（内部・DB）は: ロールバック時の非書込み（C-006/C-007）／価格履歴増分（C-003）／上限超過時の非書込み（C-004）／高額商品規格の非更新（C-010）に限る（C-003 のタグ全置換・価格反映は商品編集画面で観測可能なため画面期待でDB二重チェックしない）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・フラッシュ集合差分アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVファイルをアップロード」ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。
2. 取込CSVは fixture（SEED-M0331-*）として用意。C-006/C-007 は breakAll誘発の単一エラー行、C-005 は「ヘッダ行が無い（空の）CSV」と「ヘッダ行のみ（データ行なし）CSV」の2ファイルで format.header／data.empty の両分岐を検証する。
3. C-003 は**セールフラグを登録済=無効(0)×CSV=有効(1)（通常→セール切替・L1-015）に固定**し NM無割引規格で販売価格を一意化する（R1 Major2／R2 Major是正でL1参照と条件を三者整合）。CSVに価格・帯URL・タグを含め、規格価格反映（sale_flg 0→1・販売価格=CSV S1）・タグ全置換・価格履歴・成功フラッシュ・取込履歴を一度に検証する（R1 Major3是正で-023を代表被覆）。
4. 更新系ケース（C-003）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001 | Playwright（GUI） | 画面（DOM） | 画面部品・フォーマット表7列＋必須バッジ・件数プルダウン選択肢（ページングは>50件条件付きで判定対象外） |
| C-003,C-005,C-008 | Playwright（GUI）／C-003は＋DB確認 | 画面（フラッシュ・履歴・再表示）／C-003は価格履歴のみDB | 包括取込成功（価格反映・タグ全置換）・フォーマット/データなしエラー（C-005は2アップロードで両分岐）・ファイル必須＝画面で判定・価格履歴増分のみDB副次 |
| C-004,C-006,C-007,C-010 | Playwright＋DB確認 | 画面（エラー/フラッシュ）＋DB | 上限超過/打ち切り（breakAll）の否定的事実・高額商品非更新はDB副次 |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: ロールバックの非書込み・価格履歴増分・高額商品規格の非更新。取込履歴の増減・正常取込の反映値・タグ最終集合は画面で目視可能なため**主は画面・DB二重チェックはしない**。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ（前提が汎用ノイズの相関/DB相関/検索/ファイル操作観点行を含む）・矛盾・非該当観点・pf/ee食い違いの実装詳細はexcluded（Gate B15）。

### 集計（88 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **25** | 下表（8ユニーク候補ケース。B12共有〔代表候補が共有行の要件を被覆〕で母集合25行→tsv8行） |
| **TBD** | **1** | -019（支店連携＝pf現行実装だがee実装〔SUT〕で未移植・コメントアウトでSUT観測不能・pf/ee食い違い）。§9.1 |
| **excluded** | **62** | 汎用スタブ・矛盾・非該当観点（検索/ファイル操作/JSON/削除移動）・内部DB注記・プレースホルダ・共通認証・非UI汎用一致スタブ・pf/ee食い違いのJS実装詳細。§9.3 |
| 合計 | **88** | 欠番0・理由なし重複0 |

> 会計: bound 25／TBD 1／excluded 62（=88・欠番0）

- 候補ケース総数 **8**（C-001,C-003〜C-008,C-010。C-002〔JS挙動〕/C-009〔タグ全置換→C-003へ統合〕は欠番）。bound25件を B12（代表被覆）でemitすると tsv=ユニーク8。
  - C-001←-004/-007/-076/-084/-087（画面部品）＋-074（販売/買取必須＝フォーマット表必須バッジ）＋-081（7列CSV形式）
  - C-003←-005/-023/-034/-037/-068/-077/-085（包括取込成功＝価格反映＋タグ全置換＋価格履歴＋成功フラッシュ＋履歴＋再表示）／C-004←-072/-079（行数上限）
  - C-005←-073（フォーマット/データなしエラー＝ヘッダ行なし→format.header／データ行なし→data.empty の両分岐を1候補2アップロードで被覆・R3 Major2是正）／C-006←-069/-012/-016（商品ID存在検証 breakAll・ロールバック）
  - C-007←-013（価格整合 買取>販売 breakAll）／C-008←-031/-071（ファイル必須 NotBlank）／C-010←-003/-043（高額商品除外）
- **R1 Major是正の会計反映**: (M1)-008/-088（JS スピナー）は pf(card-csvimport.js)/ee(changeLoading)食い違い＋Excel未規定でbound不可＝excludedへ（C-002廃止）。(M4)-074/-081 は excel源のフォーマット表検証で bound（C-001）。差引 bound25 不変（-008/-088除外 −2／-074/-081追加 +2）。
- **B7非該当観点excluded**: 検索条件（-020〜-030の該当レコード系汎用）／ファイル操作系（-047〜-063の削除/移動/コピー/JSON/スキーマ等）。§9.3。
- **B14未認証委譲**: -003は期待「対象外とする規格」＝高額商品除外の実内容（機械誤ラベル）でboundへ、-035/-075「未ログイン→ログイン誘導」はexcluded。
- **B8観点補正＝25件**（bound25行すべて観点ラベルが期待テキスト実内容と不一致または要調整。§8.1）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（25件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| 003 | 未認証 | 高額商品除外 | L1-013 |
| 004 | 対象データ | 画面表示 | L1-001 |
| 005 | 出力抑止 | 取込成功（包括） | L1-009 |
| 007 | 状態変化 | 画面表示 | L1-001 |
| 012 | 文字列長バリデーション | 存在検証 | L1-007 |
| 013 | 相関バリデーション | 価格整合検証 | L1-006 |
| 016 | 相関バリデーション | ロールバック | L1-008 |
| 023 | 登録内容 | 取込成功（包括） | L1-009 |
| 031 | 実行結果 | ファイル必須検証 | L1-002 |
| 034 | 更新内容 | 取込成功（包括） | L1-010 |
| 037 | 更新内容 | 取込成功（包括） | L1-010 |
| 043 | 実行結果 | 高額商品除外 | L1-013 |
| 068 | 排他制御 | タグ全置換 | L1-011 |
| 069 | ロールバック | 存在検証 | L1-007 |
| 071 | 画面レイアウト | ファイル必須検証 | L1-002 |
| 072 | 画面レイアウト | 行数上限 | L1-003 |
| 073 | 画面レイアウト | フォーマットエラー | L1-004 |
| 074 | 画面レイアウト | フォーマット表（必須列） | L1-018 |
| 076 | 画面レイアウト | 画面表示 | L1-001 |
| 077 | 一覧 | 取込成功（包括） | L1-009 |
| 079 | 画面表示データ | 行数上限 | L1-003 |
| 081 | 画面表示データ | 画面表示（フォーマット表7列） | L1-018 |
| 084 | 非同期更新 | 画面表示 | L1-001 |
| 085 | エラー継続 | 取込成功（包括） | L1-009 |
| 087 | カート整合 | 画面表示 | L1-001 |

### 88対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当・非UI） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | 価格変更CSVの対象外とする規格（高額商品コードを持つ規格は本CSVの更新対象外＝高額商品除外。B8: 未認証→高額商品除外） | bound | C-010 (shared) |
| 004 | ファイル選択フォーム、CSVフォーマット表、雛形ダウンロードリンク、取込履歴を表示（B8: 対象データ→画面表示） | bound | C-001 |
| 005 | ファイルを検証し、合格時に1行ずつ取込して規格の価格などを更新する（B8: 出力抑止→取込成功） | bound | C-003 (shared) |
| 006 | セール用価格変更CSVを出力する（本書では正としない）（エクスポートは別機能・非UI・本機能非該当） | **excluded** | — |
| 007 | 見出し「セール用価格変更CSV」、ファイル選択欄、アップロードボタン、フォーマット表、雛形、履歴（B8: 状態変化→画面表示） | bound | C-001 (shared) |
| 008 | アップロード送信時にスピナーを表示する補助スクリプトを読み込む（JS実装がpf〔card-csvimport.js・両ボタンdisabled〕とee〔$.changeLoadingのみ〕で食い違い・Excel未規定＝bound不可・R1 Major1） | **excluded** | — |
| 009 | 横型Bootstrapフォームテーマ（レイアウトテーマの内部注記・C-001被覆・汎用） | **excluded** | — |
| 010 | 必須バリデーションでエラー表示され完了しない（前提「モーダル・ポップアップ」は本機能に無く観測対象が汎用・必須欠落→中断はC-006/C-007が代表） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（汎用「エラーなし継続」・観測対象未定義） | **excluded** | — |
| 012 | 更新対象の商品（前提「商品ID」＝商品IDで更新対象を検索・存在検証。B8: 文字列長→存在検証） | bound | C-006 (shared) |
| 013 | 相関バリデーションでエラー表示され完了しない＋前提「取込単位」（買取>販売の価格整合＝行バリデータ。B8: 相関→価格整合検証） | bound | C-007 |
| 014 | 相関バリデーションでエラー表示されず継続（前提「高額商品の除外」だが期待は汎用「エラーなし継続」・観測対象未定義＝高額除外はC-010が代表） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（前提「タグ更新」だが期待は汎用・観測対象未定義＝タグ全置換はC-003が代表） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない＋前提「トランザクション」（エラーで打ち切り＝ロールバック。B8: 相関→ロールバック） | bound | C-006 (shared) |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・前提タグの整合性） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提「高額商品との整合性」だが期待は汎用エラー＝高額除外は非エラーのスキップでC-010が代表・固有一意対応不成立） | **excluded** | — |
| 019 | 取込成功時にトランザクション確定後、支店システムへ取込対象の商品更新を通知（pf現行実装・ee〔SUT〕未移植コメントアウトで観測不能） | **TBD** | — |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定＝C-003で概念被覆） | **excluded** | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-006で概念被覆） | **excluded** | — |
| 022 | 登録内容の対象レコードが追加される（汎用スタブ・前提失敗結果） | **excluded** | — |
| 023 | 規格・付加規格・商品タグの更新、価格履歴の記録、成功フラッシュ、取込履歴への記録、結果画面の再表示（包括取込成功。B8: 登録内容→取込成功） | bound | C-003 |
| 024 | 登録内容の対象レコードが追加される（汎用スタブ・前提失敗時出力） | **excluded** | — |
| 025 | 登録内容の対象レコードが追加される（汎用スタブ・前提副作用） | **excluded** | — |
| 026 | 登録内容の対象レコードが追加されない（汎用スタブ・前提dtb_product_class） | **excluded** | — |
| 027 | 登録内容の対象レコードが追加される（汎用スタブ・前提dtb_product_sub_class） | **excluded** | — |
| 028 | 登録内容の対象レコードが追加されない（汎用スタブ・前提dtb_product_tag） | **excluded** | — |
| 029 | 登録内容の対象レコードが追加される（汎用スタブ・前提dtb_product） | **excluded** | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ・前提登録/更新） | **excluded** | — |
| 031 | 必須（NotBlank）＋前提「アップロードファイル」（ファイル必須検証。B8: 実行結果→ファイル必須検証） | bound | C-008 |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提行数） | **excluded** | — |
| 033 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提CSVヘッダ・データ） | **excluded** | — |
| 034 | 更新内容の対象レコードの値が変更される＋前提「販売価格・買取価格」（価格更新の反映。B8: 更新内容→取込成功） | bound | C-003 (shared) |
| 035 | 管理画面共通のログイン誘導に従う（前提未ログイン＝共通認証・documentation-only） | **excluded** | — |
| 036 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提アップロード画面） | **excluded** | — |
| 037 | 更新内容の対象レコードの値が変更される＋前提「取込成功」（価格更新の反映。B8: 更新内容→取込成功） | bound | C-003 (shared) |
| 038 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提フォーム検証失敗＝C-008で概念被覆） | **excluded** | — |
| 039 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提行数上限超過＝C-004で概念被覆） | **excluded** | — |
| 040 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提行検証エラー＝C-006/C-007で概念被覆） | **excluded** | — |
| 041 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提セール用価格変更CSV） | **excluded** | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提取込履歴） | **excluded** | — |
| 043 | 価格変更CSVの対象外とする規格（高額商品コードを持つ規格は更新対象外＝高額商品除外。B8: 実行結果→高額商品除外） | bound | C-010 (shared) |
| 044 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 045 | フォーマット定義でエラー表示されず継続（汎用スタブ・非UI・観測対象未定義） | **excluded** | — |
| 046 | フォーマット定義でエラー表示され完了しない（汎用スタブ・非UI・具体対象なし＝フォーマットエラーはC-005が代表） | **excluded** | — |
| 047 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 048 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 049 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 050 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 051 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 052 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 053 | 出力内容でエラー表示されず継続（汎用スタブ・手動・観測対象未定義） | **excluded** | — |
| 054 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7・非UI） | **excluded** | — |
| 055 | 移動・リネームの該当レコードが取得結果に含まれない（非該当・B7・非UI） | **excluded** | — |
| 056 | コピーのファイル出力内容が対象データと一致（非該当・B7・非UI） | **excluded** | — |
| 057 | ファイル登録のファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI・アップロード成否はC-003で被覆） | **excluded** | — |
| 058 | ファイル出力のファイル出力内容が対象データと一致（出力は本機能に非該当・B7・非UI） | **excluded** | — |
| 059 | JSONのファイル出力内容が対象データと一致（非該当・B7・非UI） | **excluded** | — |
| 060 | 同名ファイルのファイル出力内容が対象データと一致（非該当・B7・非UI） | **excluded** | — |
| 061 | 入力JSONの対象レコードの値が変更されない（JSON非該当・B7・非UI） | **excluded** | — |
| 062 | 配置先の該当レコードが取得結果に含まれる（非該当・B7・非UI） | **excluded** | — |
| 063 | スキーマのファイル出力内容が対象データと一致（汎用ファイルスタブ・非UI） | **excluded** | — |
| 064 | フォーム検証・行数上限・行検証の各エラーを画面に表示し取込を確定しない（失敗系の各エラー＝C-004/C-006/C-007/C-008で個別被覆済みの汎用まとめ・単一観測でない） | **excluded** | — |
| 065 | DB更新、価格履歴の記録、商品タグの再登録、支店システムへの更新通知、取込履歴の追加、処理ログ、一時ファイルの作成・削除（副作用の羅列＝単一観測でない・支店連携/ログは観測不能・個別はC-003被覆） | **excluded** | — |
| 066 | 更新抑止のファイル出力内容が対象データと一致（汎用スタブ・前提dtb_product_class） | **excluded** | — |
| 067 | 規格の買取価格（前提dtb_product_class・内部列注記・単一観測可能挙動でない＝価格反映はC-003被覆） | **excluded** | — |
| 068 | 行ごとに全削除・再登録（商品タグの全置換。B8: 排他制御→タグ全置換） | bound | C-003 (shared) |
| 069 | 商品の存在確認に用いる（前提dtb_product＝商品IDで存在確認しないとエラー中止＝存在検証。B8: ロールバック→存在検証） | bound | C-006 |
| 070 | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）（内部DB注記・汎用） | **excluded** | — |
| 071 | 必須（NotBlank）＋前提「アップロードファイル」（ファイル必須検証。B8: 画面レイアウト→ファイル必須検証） | bound | C-008 (shared) |
| 072 | 5010行以上は取込しない（上限超過エラー）（行数上限。B8: 画面レイアウト→行数上限） | bound | C-004 |
| 073 | ヘッダ行が無い場合はフォーマットエラー、データ行が無い場合はデータなしエラー（両分岐をC-005が1候補内の2アップロードで被覆＝ヘッダ行なし→format.header／データ行なし→data.empty。B8: 画面レイアウト→フォーマットエラー） | bound | C-005 |
| 074 | 必須＋前提「販売価格・買取価格」（ee は販売価格・買取価格を setRequired(true)・フォーマット表に必須バッジ表示。B8: 画面レイアウト→フォーマット表必須列） | bound | C-001 (shared) |
| 075 | 管理画面共通のログイン誘導に従う（前提未ログイン＝共通認証・documentation-only・B14） | **excluded** | — |
| 076 | 同一画面にフォーム・フォーマット表・取込履歴を表示（B8: 画面レイアウト→画面表示） | bound | C-001 (shared) |
| 077 | 同一画面を再表示し、成功フラッシュと更新後の取込履歴を表示（B8: 一覧→取込成功） | bound | C-003 (shared) |
| 078 | 画面表示データでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 079 | 同一画面を再表示し、上限超過エラーを表示（行数上限の再表示。B8: 画面表示データ→行数上限） | bound | C-004 (shared) |
| 080 | 画面表示データでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 081 | 商品IDと言語ごとに販売価格・買取価格・セールフラグ・帯URL・タグを指定するCSV（7列CSV形式＝Excelフォーマットに具体定義・フォーマット表7列の照合。B8: 画面表示データ→画面表示） | bound | C-001 (shared) |
| 082 | アップロードしたファイル名・日時・作業者を記録した履歴（取込履歴の記録＝成功時INSERTでC-003被覆・履歴表示はC-001被覆・documentation） | **excluded** | — |
| 083 | ファイル選択のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 084 | ファイル選択フォーム、CSVフォーマット表、雛形ダウンロードリンク、取込履歴を表示（B8: 非同期更新→画面表示） | bound | C-001 (shared) |
| 085 | ファイルを検証し、合格時に1行ずつ取込して規格の価格などを更新する（B8: エラー継続→取込成功） | bound | C-003 (shared) |
| 086 | セール用価格変更CSVを出力する（本書では正としない）（エクスポートは別機能・本機能非該当） | **excluded** | — |
| 087 | 見出し「セール用価格変更CSV」、ファイル選択欄、アップロードボタン、フォーマット表、雛形、履歴（B8: カート整合→画面表示） | bound | C-001 (shared) |
| 088 | アップロード送信時にスピナーを表示する補助スクリプトを読み込む（JS実装がpf/eeで食い違い・Excel未規定＝bound不可・R1 Major1・-008と同型） | **excluded** | — |

`func_scope_check` 判定: 親88/88会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝1件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い（pf現行実装だがee〔SUT〕未移植） | -019 | 1 | 母集合期待「取込成功時にトランザクション確定後、支店システムへ取込対象の商品更新を通知する」（pf-md:163・pf handler:88-90 BranchUpdateService::noticeProductUpdate）はpf現行実装だが、ee実装（SUT）では onAfterImport の当該通知がコメントアウト（「// TODO: BranchUpdateService の移植が必要」ee handler:87-95）＝SUTでは支店連携通知が発生せず、かつ外部連携で観測手段も未整備＝1回の実行で一意判定できず要仕様確認／実機（L1-020） |

（合計 1）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・5010境界・価格値S0/S1/B0/B1・タグT0/T1・言語ID・高額商品コード・NM無割引規格の割引率） | fixture manifest（D5型）未整備＝要実機（SEED-M0331-*） |
| L1-014〜017（セール条件別基準価格保持＝Excel刷新後カスタマイズ・ee実装）・L1-019（履歴ページング）・L1-021（スマレジ連携） | 実挙動（ee実装）だが母集合に固有一意判定行が無い（相関/更新観点行の前提は汎用ノイズ）＝documentation-only。スマレジ連携は外部連携＝要実機（0204:セール用価格変更CSVアップロード!G92-G119,AB128-AB130,E70-E71） |
| L1-022（取込開始/完了/異常終了ログ） | 実在挙動だがログ観測手段が現行ハーネスで未整備＝documentation-only |
| L1-解決器・取込結果アサートヘルパ（フラッシュ集合差分）・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |
| 成功フラッシュの実文言（pf/ee食い違い）・ファイル未選択時の実文言（ee既定NotBlank）・JS挙動（pf card-csvimport.js／ee changeLoading の食い違い） | ee実機で確定要（本書は挙動をbound・文言/JS詳細は断定しない） |

### 9.3 excluded＝62件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15③】自己矛盾/非該当/プレースホルダ（出力失敗・CSRF）** | -001,-002 | -001「出力失敗」（取込機能に非該当＋汎用・非UI）／-002 CSRF失敗の固有挙動が一次資料に定義なし |
| **【B7】エクスポート（別機能・本機能非該当）** | -006,-086 | セール用価格変更CSV出力は別機能（本書では正としない・pf-md:11,69） |
| **【B15②/R1 Major1】pf/ee食い違いのJS実装詳細** | -008,-088 | 「送信時スピナー補助スクリプト読込」はpf（card-csvimport.js・両ボタンdisabled）とee（$.changeLoading(true)のみ・ボタンdisabledなし）で実装が食い違い、Excelも規定せず＝SUT一意bound不可（pf UIをboundしない・§10） |
| **【B15②】汎用「登録内容/更新内容/実行結果が追加/変更される・されない」スタブ（C-003/C-004/C-006で被覆）** | -020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-036,-039,-040,-041,-042 | 対象レコード・具体値を母集合が指定せず内容空虚。取込成功反映（C-003）・失敗中止（C-006/C-007）・上限（C-004）で概念被覆済みの冗長スタブ |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）・必須validationの汎用前提** | -010,-011,-014,-015,-017,-078,-080 | 「エラー表示されず継続」の観測対象が無い（-014=高額除外前提だが期待は汎用・-015=タグ更新前提だが期待は汎用）。必須欠落→中断の実挙動はC-006/C-007が代表 |
| **【B15②】汎用DB相関スタブ（前提が汎用ノイズ）** | -018 | 「DBとの相関でエラー表示され完了しない」の前提「高額商品との整合性」に対し高額除外は非エラーのスキップ（C-010）で固有一意対応不成立 |
| **【B7】ファイル/レコード操作系・非UI汎用一致スタブ（非該当）** | -044,-045,-046,-047,-048,-049,-050,-051,-052,-053,-054,-055,-056,-057,-058,-059,-060,-061,-062,-063,-083 | 出力/削除/移動/コピー/ファイル登録/JSON/同名/入力JSON/配置先/スキーマ/フォーマット定義（非UI汎用一致）。取込機能に該当なし・具体対象なし（フォーマットエラーはC-005が代表） |
| **【B15②】内部DB/列注記・副作用羅列スタブ（被覆済み/単一観測でない）** | -064,-065,-066,-067,-070,-082 | 「各エラーまとめ」「副作用の羅列」「規格の買取価格」「対象テーブル直接保存」「履歴記録」等はDBカラム/内部処理/複数観点の設計注記で単一観測可能挙動でない（個別はC-003/C-004/C-006/C-007/C-008で被覆） |
| **【B14/B15②】共通認証・レイアウト注記** | -009,-035,-075 | -009 横型Bootstrapテーマ（画面骨格・C-001被覆）／-035,-075 未ログイン→ログイン誘導（共通認証・documentation-only・B14） |

## §10 特記事項（片側断定せず記録）

1. **★pf/ee食い違い（本機能の最重要・R1 Major1/2/3の根）**: 本E2EのSUTは ee。pf現行（`ProductCsvController::csvProductPriceUpload`:886）は取込後も**同一画面render**・成功キー pf `admin.product.csv_import.save.complete`・`onAfterImport`で**支店連携**・UIは `card-csvimport.js` スピナー＋両ボタンdisabled・accept="text/csv,text/tsv"・「CSVファイルのアップロード」文言。一方 ee実装（SUT／`ProductPriceCsvController::import`:132）は**常に302リダイレクト**・成功キー ee `admin.register.complete`・**支店連携未移植（コメントアウト:87-95）**・UIは `$.changeLoading(true)` のみ（ボタンdisabledなし:29-30）・accept=".csv, text/csv, .tsv, text/tsv":20・ボタン文言「CSVファイルをアップロード」（admin.common.csv_upload:74）・**セール条件別基準価格保持**（handler:325-347）・**履歴ページング**（page_count session:93）を実装。よって UI挙動・ボタン文言・accept・enは ee(SUT)実装を正とし、pf UI（-008/-088のスピナー等）はboundせずexcluded。成功フラッシュの文言・リダイレクト有無・支店連携はpf-fallbackで断定せず共有挙動のみbound（L1-009）、支店連携はTBD（-019・L1-020）。
2. **取込エラー文言・行検証の共有性**: 取込エラー（maxrecord・format.header・data.empty・price_valid・not_exists）は pf `message.ja.yml` と ee `messages.ja.yaml` で**文言が一致**（例 not_exists=「%d 行目の %s ではデータを取得できません。」pf:1144／ee:2416）し、CsvImporterの isSuccessful 判定（count===0||!hasBreak）も pf:272／ee:270 で一致するため、L1-003〜008 は pf-fallback として安全にboundできる。**本ハンドラは skipRow を用いず、列検証・行バリデータ・商品存在の全不合格が breakAll**（pf BaseCsvImportHandler:58-98／pf・ee ProductPriceImportHandler:118,186）＝行エラーは即座に全体中止・ロールバック（グッズCSVの skipRow と対比）。
3. **セール条件別価格の一意化（R1 Major2／R2 Major是正・条件とL1と期待の三者整合）**: ee は登録済セールフラグ×CSVセールフラグで販売価格を分岐する（handler:329 登録済有効×CSV無効=基準価格コピー・:337 登録済無効×CSV無効=現状維持・:344 else枝＝登録済無効×CSV有効 または 登録済有効×CSV有効=CSV販売価格反映）。C-003は**登録済=無効(0)×CSV=有効(1)（handler:344 else枝・通常→セール切替）**に固定し、これは L1-015（0204:G92-G96 通常商品→セール商品切替・sale_flg 0→1・販売価格=CSV・基準価格不変）と一致する。NM規格（DiscountBuyPriceCalculator:55 でNM買取=CSV値そのまま）・割引率なし（findProductClasses の dis.rate NULL→1）で PriceUtil::discount（10円単位切上げ・PriceUtil.php:38）が恒等となるよう販売価格S1を10円単位に固定し、セールフラグ 無効(0)→有効(1)・販売価格＝S1・買取価格＝B1を一意判定にした（R2でC-003条件を参照L1-015に合わせ三者整合）。セール条件別基準価格保持の4分岐（L1-014〜017）自体は母集合に固有一意判定行が無くdocumentation-only（正直分類・捏造回避）。セール条件別アラート（sell_price_not_reflected/normal_product_sell_price_unchanged）は ee messages.ja.yaml:2127,2128 に実在するが英訳なし（LS=0・§5）。
4. **包括取込C-003（R1 Major3是正）**: -023は規格・タグ・価格履歴・成功フラッシュ・取込履歴を同一実行で要求するため、C-003を規格価格反映＋タグ全置換（旧タグ残らない・handler:293-294）＋価格履歴増分＋成功フラッシュ＋取込履歴＋画面再表示を1回のCSVアップロードで検証する包括ケースに拡張し、-005/-034/-037/-068/-077/-085/-023 を代表被覆した（タグ検証を含むためB12代表が共有行の要件を実際に被覆）。旧版で分離していたタグ単独ケース（C-009）は本包括に統合。
5. **フォーマット表7列・必須列（R1 Major4是正）**: -081（7列CSV形式）はExcelフォーマットに具体定義があり（0204:フォーマット!E8-E14・L1-018）、-074（販売価格・買取価格必須）は ee で setRequired(true)（handler:163,164）かつフォーマット表に必須バッジ表示（getRequiredCsvHeader:232／base_csv_upload.twig:101）される具体挙動。C-001を表の存在確認だけでなく7列の列名・必須バッジ（商品ID・言語ID・販売価格・買取価格・セールフラグに必須／帯URL・タグに任意）の照合まで行うよう拡張し、-074/-081 をboundした（excluded撤回）。
6. **高額商品除外は非エラーのスキップ**: 高額商品コードを持つ規格は取込対象抽出クエリ（`psc.high_price_code IS NULL` pf handler:244／ee findProductClasses:214-234）で除外され、エラーにはならず単に非更新となる（L1-013）。母集合-018「DBとの相関でエラー表示され完了しない」は高額除外の実挙動（非エラースキップ）と食い違うためexcluded、-003/-043「対象外とする規格」（非更新の事実）を C-010 にboundした。
8. **C-001のページング一意性（R3 Major1是正）**: ee(SUT)の履歴件数プルダウン（page_count_pulldown・選択肢10〜12000件）は `pageMax` が常に渡るため**常に描画**される（csv_import_history.twig:8-14／ProductPriceCsvController:101,120）が、**ページングのリンクは `paginationData.pageCount > 1`（既定表示件数50件を超え2ページ以上）でのみ描画**される（twig:44・既定 page_count=50 ＝ controller:97）。よってC-001のSEEDは既定50件以下（ページング非発生）に固定し、C-001は**常に描画される部品（ファイル選択・アップロードボタン・見出し・フォーマット表7列＋必須バッジ・雛形DL・件数プルダウン選択肢・履歴テーブルの列と降順）を一意判定**する。ページングリンクは条件付き（>50件）でC-001の判定対象から除外し、L1-019（ページング）はdocumentation-only（母集合に51件以上固定の要求行が無い・§9.2）とした。
9. **C-005のヘッダ/データ両分岐（R3 Major2是正）**: 母集合-073は「ヘッダ行が無い場合はフォーマットエラー、データ行が無い場合はデータなしエラー」の**両分岐**を要求する。ee(SUT)の CsvImporter::validateBeforeImport は `setHeaderRowNumber(0)` が偽（ヘッダ行なし＝空ファイル）のとき `addHeaderFormatError`＝「CSVのフォーマットが一致しません。」（:196）、ヘッダ後にデータ行が無いとき `addNoDataError`＝「CSVデータが存在しません。」（:206）を返し、いずれも result にエラーが載り成功フラッシュ・履歴INSERTを行わない（両文言は pf message.ja.yml:1100,1112／ee messages.ja.yaml:2407,2409 で一致）。両分岐とも純UI（空CSV／ヘッダのみCSVのアップロード）で到達可能なため、C-005を1候補内の2アップロード（SEED-M0331-BADHEADER＝ヘッダなし・SEED-M0331-NODATA＝データなし）で両分岐を被覆した。※「ヘッダ名不一致」は format.header ではなく列欠落（addColumnNotExistsError→breakAll）経路のため-073の「ヘッダ行が無い」＝空ファイルとして扱う。
7. **B12/1実行1判定**: B12共有は代表候補が共有行の要件を被覆する場合に限定（C-001←004/076/084/007/087/074/081・C-003←005/023/034/037/068/077/085・C-004←072/079・C-006←069/012/016・C-008←031/071・C-010←003/043）。maxrecordはL1でテンプレート保持・実行期待は根拠ある置換後実値「5010 行を超えるCSVファイルは登録できません。」（上限定数5010・pf:391／ee AbstractController:364）へ解決。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（25件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 003 | 高額商品除外 | 期待「価格変更CSVの対象外とする規格」（L1-013）。母集合ラベル「未認証」は誤り |
| 004 | 画面表示 | 期待「ファイル選択フォーム・フォーマット表・雛形・取込履歴を表示」（L1-001）。母集合ラベル「対象データ」は誤り |
| 005 | 取込成功（包括） | 期待「合格時に1行ずつ取込して規格の価格を更新」（L1-009）。母集合ラベル「出力抑止」は誤り |
| 007 | 画面表示 | 期待「見出し・ファイル選択欄・アップロードボタン・フォーマット表・雛形・履歴を表示」（L1-001）。母集合ラベル「状態変化」は誤り |
| 012 | 存在検証 | 期待「更新対象の商品」＋前提「商品ID」（L1-007）。母集合ラベル「文字列長バリデーション」は誤り |
| 013 | 価格整合検証 | 期待「相関バリデーションでエラー表示され完了しない」＝買取>販売の価格整合（L1-006）。母集合ラベル「相関バリデーション」は総称で不足 |
| 016 | ロールバック | 期待「相関バリデーションでエラー表示され完了しない」＋前提「トランザクション」（L1-008）。母集合ラベル「相関バリデーション」は総称で不足 |
| 023 | 取込成功（包括） | 期待「規格・タグの更新・価格履歴・成功フラッシュ・取込履歴・結果画面再表示」（L1-009）。母集合ラベル「登録内容」は誤り |
| 031 | ファイル必須検証 | 期待「必須（NotBlank）」＋前提「アップロードファイル」（L1-002）。母集合ラベル「実行結果」は誤り |
| 034 | 取込成功（包括） | 期待「更新内容の対象レコードの値が変更される」＋前提「販売価格・買取価格」（L1-010）。母集合ラベル「更新内容」は誤り |
| 037 | 取込成功（包括） | 期待「更新内容の対象レコードの値が変更される」＋前提「取込成功」（L1-010）。母集合ラベル「更新内容」は誤り |
| 043 | 高額商品除外 | 期待「価格変更CSVの対象外とする規格」（L1-013）。母集合ラベル「実行結果」は誤り |
| 068 | タグ全置換 | 期待「行ごとに全削除・再登録」（L1-011）。母集合ラベル「排他制御」は誤り |
| 069 | 存在検証 | 期待「商品の存在確認に用いる」＋前提「dtb_product」（L1-007）。母集合ラベル「ロールバック」は誤り |
| 071 | ファイル必須検証 | 期待「必須（NotBlank）」＋前提「アップロードファイル」（L1-002）。母集合ラベル「画面レイアウト」は誤り |
| 072 | 行数上限 | 期待「5010行以上は取込しない（上限超過エラー）」（L1-003）。母集合ラベル「画面レイアウト」は誤り |
| 073 | フォーマットエラー | 期待「ヘッダ行が無い場合はフォーマットエラー、データ行が無い場合はデータなしエラー」（L1-004）。母集合ラベル「画面レイアウト」は誤り |
| 074 | フォーマット表（必須列） | 期待「必須」＋前提「販売価格・買取価格」＝フォーマット表の必須列（L1-018）。母集合ラベル「画面レイアウト」は誤り |
| 076 | 画面表示 | 期待「同一画面にフォーム・フォーマット表・取込履歴を表示」（L1-001）。母集合ラベル「画面レイアウト」は誤り |
| 077 | 取込成功（包括） | 期待「同一画面を再表示し、成功フラッシュと更新後の取込履歴を表示」（L1-009）。母集合ラベル「一覧」は誤り |
| 079 | 行数上限 | 期待「同一画面を再表示し、上限超過エラーを表示」（L1-003）。母集合ラベル「画面表示データ」は誤り |
| 081 | 画面表示（フォーマット表7列） | 期待「商品IDと言語ごとに販売価格・買取価格・セールフラグ・帯URL・タグを指定するCSV」＝7列フォーマット（L1-018）。母集合ラベル「画面表示データ」は誤り |
| 084 | 画面表示 | 期待「ファイル選択フォーム・フォーマット表・雛形・取込履歴を表示」（L1-001）。母集合ラベル「非同期更新」は誤り |
| 085 | 取込成功（包括） | 期待「合格時に1行ずつ取込して規格の価格を更新」（L1-009）。母集合ラベル「エラー継続」は誤り |
| 087 | 画面表示 | 期待「見出し・ファイル選択欄・アップロードボタン・フォーマット表・雛形・履歴を表示」（L1-001）。母集合ラベル「カート整合」は誤り |
