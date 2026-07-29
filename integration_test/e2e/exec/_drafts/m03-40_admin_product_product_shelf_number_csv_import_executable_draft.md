# 候補: m03-40 棚番号更新CSV登録（取込/インポート） — 実行可能グレード候補（母集合105全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1 Major5件 是正反映版（2026-07-29・ee/pf/Excel実source照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（codex複数パス確定）の構造・取込検証設計を踏襲。ただし**値・claim・列名・メッセージ・MSG番号はM03-40自身の一次資料（Excel sheet-56/57／pf md／pf実source／ee実source）から**取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能はTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。B12の共有は**前提・入力・期待まで同一実行**の完全重複だけ。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。観測対象＝**アップロード結果画面（成功／エラーフラッシュ・取込履歴テーブル）＋取込効果（`dtb_product_class.shelf_number_id` の反映・DB内部）**。
> DB直接参照（B9）は外部IFで検知不能な事実＝異常系ロールバック（何も書かれない）・棚番号ID反映・履歴の非増加に限る。
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29 R1是正）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  - sheet-56「棚番号更新CSV登録」（機能No=M03-40・機能名「棚番号更新CSV登録」・概要「商品の棚番号更新をCSVで行える」・作成者=大澤・作成日2025-08-05・更新者=堀部・更新日2025-09-16）。画面部品（識別ID1-9）・機能仕様処理概要「レコード数上限チェックを実施。110000件以上はエラーとする」「商品IDで商品情報の棚番号を更新する」。根拠は実Excel座標 `0204:棚番号更新CSV登録!<セル>`（pin台帳: 識別ID1-9=B43-B51。件数選択肢=B47・フォーマット表=B45・雛形DL=B46・履歴ファイル名/日時/作業者=B48/B49/B50・ページング=B51）。
  - sheet-57「棚番号更新CSVフォーマット」（機能No=M03-40・作成者=大澤・作成日2025-08-08）。CSVデータ列定義: 識別ID1=商品コード（主キー◯／文字型／必須◯／例 EOE00001JPNM）・識別ID2=**棚番号名称**（主キー◯／文字型／必須◯／例 S-002）。`0204:棚番号更新CSVフォーマット!識別ID1,識別ID2`。
- **pf現行md（回帰先digest・source_class=pf-fallback）**: `functions/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.md`（以下「pf-md:行」）。区分宣言「本機能のカスタマイズ区分は現行踏襲である。挙動の参照リポは現行の pf-eccube3 とし、DB関連…は ec-cube-enterprise を正とする。」（pf-md:9）。
  - **重要（pf-md陳腐化）**: pf-md本文は棚番号列を「棚番号マスタの主キーID／正の整数ID」と記すが、**pf実source・ee実sourceともに棚番号列を名称(name)で照合**し、Excelフォーマットも「棚番号名称」＝pf-mdのID記述は誤り。pf-mdを鵜呑みにせず実sourceを正とした。
- **pf実source（pf現行挙動の確認・source_class=pf-fallbackの根拠）**: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/`
  - `Controller/Admin/Product/ProductCsvController.php` `csvShelfNumber`(:1402)／`csvShelfNumberUpload`(:1419・**同一twigをrender・PRGでない**)／`getShelfNumberCsvHeader`(:2202 ＝**商品コード・棚番号の2列**)。フォーム不正時は `$form->getErrors(true)`（deep）でフラッシュ。
  - `Service/Csv/Importer/Event/ShelfNumberImportHandler.php`（以下「pf-handler:行」）: `validateProductExists`(:135 存在チェックのみ・**2件以上の重複分岐なし**)／`isProductExists`(:155 `getOneOrNullResult`:177)／`validateShelfNumberExists`(:188 非空かつマスタ不存在→breakAll)／`getShelfNumberId`(:212 `SELECT id FROM dtb_shelf_number WHERE name=:shelfNumber`＝**名称照合**)／`persistShelfNumber`(:239 空なら null で `replaceShelfNumber`)。
- **ee実source（system-under-test・挙動確認・source_classには不使用）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`
  - `Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php`（以下「ee-controller:行」）: `csv`(:84 GET画面)／`import`(:127 POST・**PRGで常に `redirectToRoute('admin_product_shelf_number_csv_import')`**:140/148/154/196)／フォーム不正時 **`$form->getErrors()`（非deep）**(:136 ＝子フィールド import_file の NotBlank/File 誤りは収集されずフラッシュされない・Goods/Card は `getErrors(true)` deep と対照)／`getCsvHeader`(:204 ＝商品コード・棚番号名称)／MtbCsvImportType::PRODUCT_SHELF_NUMBER_IMPORT_CSV_ID=15(:181)／セッションキー(:91,92)／log(:157,173,179)。
  - `Service/Csv/Importer/Event/ProductShelfNumberUpdateImportHandler.php`（以下「ee-handler:行」）: `initializeColumnDefinitions`(:112 商品コード必須+棚番号名称`setRequired(true)`:115)／`validateProductCodeSingle`(:128 `countByProductCode`:132・0件→不存在:134・**2件以上→重複:145 `addProductCodeDuplicatedError`:147**)／`validateShelfNumberExists`(:159 `findOneByName`・null→マスタ不存在 breakAll)／`persistShelfNumber`(:194 `replaceShelfNumber`)。
  - `Form/Type/Admin/CsvImportType.php`: import_file `required=>true`(:51)＋`NotBlank`(:53)＋`File(maxSize=eccube_csv_size.'M'=5M)`(:54,36)。
  - `Service/Csv/Importer/Model/ColumnDefinitions.php`: `shelfNumberId`(:478 列名「棚番号名称」＋**`RegexValidator('/^[A-Z][-][0-9]{3}$/')`**:479)＝棚番号名称は形式検証を先に通過してからマスタ照合。
  - twig `Resource/template/admin/Product/base_csv_upload.twig`: `<form ... method="post" ...>`(:53 **`novalidate`なし**)／`csv_import_history.twig`(:24-26 履歴列は**ファイル名・アップロード日時・作業者のみ**・種別IDは非表示)。enロケール源 `Resource/locale/messages.en.yaml`。
- 母集合: `integration_test/all_it_cases.tsv` の `IT-M03-40-ADMIN-PRODUCT-PRODUCT-SHELF-NUMBER-CSV-IMPORT-001..105`（105件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実source（SUT）は挙動照合とenロケール源に使い、オラクルの source_class には不使用。
- **★pf/ee食い違い（R1 Major#2是正・帰属判定）**:
  - (a) pf現行がeeと同挙動→**pf-fallback**（列数2検証・商品コード0件不存在・棚番号**名称**マスタ照合・履歴INSERT・行数上限110000・ログ文言・画面構成・ページングセッション。pf/eeとも同一挙動をpf実source/ee実sourceで確認）。
  - (b) pfに無くEEのみ＆Excel規定→**excel**（CSVデータ列定義＝商品コード・棚番号名称の両必須。Excelフォーマット「必須◯」逐語。ee実装事実は混ぜず注記に分離＝1claim1source）。
  - (c) pf現行がeeと食い違い＆eeオラクル化不可→**TBD**（商品コード2件以上→重複エラーはee-only／棚番号列を空/0以下で未設定NULLクリアはpf現行のみ／MSG-001純UI到達不能／NotBlank・File子エラーの非deepフラッシュ挙動／ログ観測未整備）。
- **列名の帰属**: pf実装の列見出しは「棚番号」（pf-controller:2202）・ee(SUT)は「棚番号名称」（ee-controller:204）でExcelフォーマットも「棚番号名称」。よってL1-002（pf-fallback）はtwig構成のみ主張し列名「棚番号名称」はL1-013（excel）へ分離（source_class純度）。
- **en（★ee-grep実施）**: ee `messages.en.yaml` に対し該当キーをgrep確認。ヒット＝LS=1、0件確認のみLS=0。
  - LS=1: `admin.register.complete`=「Registration completed.」(en:1676)／`admin.common.csv_invalid_format`=「Unmatched CSV format」(en:1810)／`admin.common.csv_upload`=「Upload a CSV file」(en:1804)／`admin.common.csv_format`=「CSV file format」(en:1806)／`admin.common.csv_skeleton_download`=「Download a template」(en:1805)／`admin.common.required`=「Required」(en:1785)／`admin.product.product_management`=「Products」(en:1930)。
  - LS=0（英訳なし＝grepヒット0）: `admin.csv.error.upload.maxrecord`（MSG-002・ja:1626のみ）／`admin.product.product_shelf_number_csv`（画面sub_title・ja:2032のみ）／`admin.product.product_shelf_number_csv_upload_title`（ja:2033・「棚番号登録CSV」）／`admin.product.product_shelf_number_csv_format_title`（ja:2034のみ）。
- **画面タイトルの実挙動（SUT）**: eeメッセージ値は「棚番号**登録**CSV」系（`product_shelf_number_csv_upload_title`=「棚番号登録CSV」ja:2033）。機能名/母集合の「棚番号**更新**CSV登録」とはメッセージ値の表記が異なる（画面カード見出しは「棚番号登録CSV」と表示）。捏造せず実値を記載。
- **B1事前スイープ**: 「場合がある／し得る／なり得／可能性」該当0件。-061/-095（要ソース確認プレースホルダ）はexcluded、-011/-012/-049/-082/-083/-089/-092/-097/-099/-100はTBD（§9.1）。

---

## §1 L1原子オラクル表

全19claim。**source_class列は excel／pf-fallback のみ**（excel2=L1-001・L1-013／pf-fallback17）。LS=1（enロケール変異あり・ee messages.en.yaml逐語）＝L1-001/002/017。他はLS=0（L1-007はR4でpf現行文言「商品登録CSVファイルをアップロードしました。」に純化・pf coreにen資源不在＝LS=0。SUT(ee)成功文言のenは§4 C-011のSUT観測値として記述）。

**オラクル記録の被覆状況（正直分類・R1是正後）**: 本表19claimのうち **documentation-only/TBD経由は L1-007のログ部分（-082 TBD）・L1-011（商品コード重複はee-only＝-012 TBD）・L1-015（NotBlank純UI到達不能・File子エラー非deepフラッシュ＝-089/-097 TBD）・L1-017（MSG-001純UI到達不能＝-092 TBD）・L1-018（棚番号未設定NULLクリアはpf現行のみ＝-011 TBD）・L1-019（開始/完了/異常終了ログは観測手段未整備＝-049/-082/-083/-099/-100 TBD）**。残りは bound候補ケースが検証する（§8参照）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0340-001 | http_entry | ナビ「商品管理」→「商品CSV管理」→「棚番号更新CSV登録」から `GET /{admin_route}/product/product_shelf_number_csv_import` を開くと、アップロード画面（ファイル選択・アップロードボタン）・フォーマット表・雛形ダウンロードボタン・件数選択（10,50,100,300,500,1000,2000,10000,12000件）・取込履歴（ファイル名・アップロード日時・作業者）とページングが表示される | 「1 ファイルを選択…2 CSVファイルのアップロード…3 棚番号更新CSVファイルフォーマット…4 雛形ファイルダウンロード…5 件数 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件…6 ファイル名…7 アップロード日時…8 作業者…9 ページングリンク」 | 0204:棚番号更新CSV登録!B43,B45,B46,B47,B48,B49,B50,B51 | excel | 1 |
| L1-M0340-002 | display_field | `csv_product_shelf_number_update.twig` は共通テンプレート `base_csv_upload.twig` を継承し、カード内にファイル入力と「CSVアップロード」ボタン・フォーマット表（列見出しはコントローラ `getCsvHeader()` のキー／`getRequiredCsvHeader()` のキー列に必須バッジ）・雛形ダウンロードボタン・下部に取込履歴（ファイル名・アップロード日時・作業者）とページングを表示する。ファイル入力の accept は `.csv, text/csv, .tsv, text/tsv`（必須バッジが付く列はee(SUT)は商品コード・棚番号名称の両列＝L1-013／pf現行は商品コード列のみ・列名の逐語はL1-013で規定＝1claim1source） | 「`@admin/Product/csv_product_shelf_number_update.twig` は `@admin/Product/base_csv_upload.twig` を継承する。…フォーマット表はコントローラの `getCsvHeader()` のキー・値…必須バッジ…続けて共通 `csv_import_history.twig`。ファイル入力の `accept` は `.csv`・`text/csv`・`.tsv`・`text/tsv`。」 | pf-md:44 | pf-fallback | 1 |
| L1-M0340-003 | display_field | ファイル選択でカスタムラベルへ選択ファイル名を表示する。フォーム submit 時に `$.changeLoading(true)` を呼ぶ。履歴の件数プルダウンは変更で選択 URL へ即時遷移する | 「ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。履歴の件数プルダウン変更で選択 URL へ即時遷移。」 | pf-md:45 | pf-fallback | 0 |
| L1-M0340-004 | display_field | アップロード画面には送信前確認ダイアログ（確認モーダル）はない。ファイル選択後に「CSVアップロード」ボタン押下で確認を挟まず送信する | 「モーダル・ポップアップ 送信前確認ダイアログはない。」 | pf-md:47 | pf-fallback | 0 |
| L1-M0340-005 | session | 履歴の件数はクエリ `page_count` が許容値（10,50,100,300,500,1000,2000,10000,12000）のときだけセッションキー `admin.product.shelf_number_csv.page_count` に保存されその値で表示される。不正値のときはそのリクエストは既定10に落ち、既存セッション保存値は上書きされない。`page_no` はクエリまたはセッションキー `admin.product.shelf_number_csv.page_no` で決めその都度セッションへ書き戻す | 「`page_count` が抽象コントローラの許容リスト（10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 の確認値）に含まれる場合のみセッションキー文字列 `admin.product.shelf_number_csv.page_count` を更新する。`page_no` はクエリまたはセッションキー文字列 `admin.product.shelf_number_csv.page_no` で決め、セッションへ書き戻す。」 | pf-md:57,58,269 | pf-fallback | 0 |
| L1-M0340-006 | http_flow | POST 取込送信後、成功／失敗のどちらでもアップロード画面（棚番号更新CSV登録画面）が同一Twigの render で再表示されフラッシュで結果が示される（pf現行 csvShelfNumberUpload は取込後に同一Twigを render する） | 「検証・取込後、…アップロード画面…へ戻り、フラッシュで結果が示される。」 | pf-md:77 | pf-fallback | 0 |
| L1-M0340-007 | message | 取込結果にエラーが無いとき、成功フラッシュ（pf現行文言「商品登録CSVファイルをアップロードしました。」・キー `admin.product.csv_import.save.complete`）を表示し取込履歴 INSERT（種別ID 15・クライアント側ファイル名・作業者ID）を行う（成功時のみ）。併せて情報ログ「棚番号更新CSV登録完了」count を出すがログは観測手段未整備＝観測は成功フラッシュと履歴増分に限る | 「エラーが無い場合、成功フラッシュを積む。…取込履歴リポジトリへ種別 ID 15・クライアントオリジナルファイル名・利用者 ID を渡して INSERT する。」／pf「商品登録CSVファイルをアップロードしました。」 | pf-md:76 | pf-fallback | 0 |
| L1-M0340-008 | data_write | 取込成功で `replaceShelfNumber(商品コード, 棚番号名称に対応するマスタID)` により `UPDATE dtb_product_class SET shelf_number_id = ? WHERE product_code = ?` が実行され、対象規格の `shelf_number_id` がCSVの棚番号名称に対応するIDへ更新される（棚番号列は画面に表示列が無く反映確認はDB内部） | 「`onReadRow` で `replaceShelfNumber(商品コード, 棚番号 ID または null)` を呼ぶ。更新は `UPDATE dtb_product_class SET shelf_number_id = ? WHERE product_code = ?` のパラメータバインディングによる native 実行である。」 | pf-md:84 | pf-fallback | 0 |
| L1-M0340-009 | history | 取込履歴（`dtb_csv_import_history`）はコントローラが成功（結果にエラーが無い）と判断したときだけ INSERT される（種別ID 15）。エラーを含む取込では履歴は増えない。履歴画面に表示されるのはファイル名・アップロード日時・作業者で、種別IDは画面に表示されない（内部フィルタ列） | 「成功時のみ INSERT。種別は確認値 15。」「履歴列見出しは csv_import_history_filename／_upload_date／_operator」 | pf-md:76,170 | pf-fallback | 0 |
| L1-M0340-010 | validation | 商品コードに一致する規格が `dtb_product_class` に0件のとき、商品不存在エラーを積み `breakAll`（当該行で全体中断・ロールバック方向）とする（pf・eeとも存在チェックで0件をエラー化＝pf-handler:135/ee-handler:134） | 「(a) 商品コードに一致する規格件数が 0 なら商品不存在エラーを積み `breakAll`。」 | pf-md:83,103 | pf-fallback | 0 |
| L1-M0340-011 | validation | 商品コードに一致する規格が2件以上あるときの「商品コード重複エラー→breakAll」は ee(SUT)のみの分岐（ee-handler:145 `countByProductCode`>=2）であり、pf現行は存在チェックのみ（pf-handler:155 `getOneOrNullResult`）で2件以上を専用重複エラーにしない＝pf/ee食い違いでeeオラクル化しない（-012 TBD） | 「(b) 2 件以上なら商品コード重複エラーを積み `breakAll`。」 | pf-md:83,134 | pf-fallback | 0 |
| L1-M0340-012 | validation | 棚番号名称が空でなく、かつ形式 `^[A-Z]-[0-9]{3}$`（ee ColumnDefinitions:479 の RegexValidator）を満たす値で棚番号マスタ（`dtb_shelf_number.name`）に一致する行が存在しないとき、マスタ不存在エラーを積み `breakAll` する（pf・eeとも名称照合＝pf-handler:212 `WHERE name`／ee-handler:164 `findOneByName`）。形式不適合値は別の列検証エラーとなりこの分岐へ到達しない | 「棚番号セルが…棚番号マスタ行が存在するか検証し、存在しなければマスタ不存在エラーを積み `breakAll`。」 | pf-md:104 | pf-fallback | 0 |
| L1-M0340-013 | validation | CSVデータ行は「商品コード」「棚番号名称」の2列で、いずれも必須である | 「識別ID1 商品コード 主キー◯ 文字型 必須◯ 例 EOE00001JPNM／識別ID2 棚番号名称 主キー◯ 文字型 必須◯ 例 S-002」 | 0204:棚番号更新CSVフォーマット!識別ID1,識別ID2 | excel | 0 |
| L1-M0340-014 | validation | データ行の列数が2でない場合はエラーとなり `breakAll` で全体中断する（列数不一致の単一経路・C-012の対象）。※ヘッダ名と列定義名の対応が取れない場合も別経路で breakAll となるが、これは列数不一致とは別トリガであり本claimの対象は列数不一致に固定する（ヘッダ名対応不可は母集合に固有行が無く別途要検証） | 「共通実装により、データ行の列数が 2 でない場合…はエラーとなり `breakAll` で中断する。」 | pf-md:82,101 | pf-fallback | 0 |
| L1-M0340-015 | validation | アップロードファイルは `CsvImportType` の `NotBlank` と `File`（最大サイズ eccube_csv_size=5M）で検証される。ただし import_file は required＋novalidate無し（base_csv_upload:53）でファイル未選択送信はブラウザHTML5検証で送信ブロック＝純UI到達不能。かつフォーム不正時のフラッシュは `$form->getErrors()`（非deep・ee-controller:136）で収集され子フィールド import_file の NotBlank/File 誤りは積まれない＝子エラーのフラッシュ有無は要実機（-089/-097 TBD） | 「アップロードファイル `CsvImportType` の `NotBlank` と `File`（最大サイズ）。」「妥当でない場合は各フォームエラーを管理者向けフラッシュに積み、…リダイレクトする。」 | pf-md:70,186 | pf-fallback | 0 |
| L1-M0340-016 | message | アップロード内容の改行ベース概算行数が上限 `ADMIN_CSV_IMPORT_MAX_ROWS`（110000）以上なら M03-40-MSG-002「%maxRecord% 行を超えるCSVファイルは登録できません。」（%maxRecord%=110000）をフラッシュしアップロード画面へ戻る。キー `admin.csv.error.upload.maxrecord` は messages.en.yaml に不在＝英訳なし | 「その値が…上限（実装確認値 110000）以上なら、`admin.csv.error.upload.maxrecord`（パラメータに当該上限）をフラッシュしリダイレクトする。」／MSG-002「%maxRecord% 行を超えるCSVファイルは登録できません。」 | pf-md:72,221 | pf-fallback | 0 |
| L1-M0340-017 | message | 共通キー `admin.common.csv_invalid_format`＝M03-40-MSG-001「CSVのフォーマットが一致しません」／en「Unmatched CSV format」は import_file が null のときフラッシュされる設計だが、import_file は required＋NotBlank のためファイル未選択送信は先行するフォーム不正分岐（ee-controller:135）で終了し当分岐（:146）へ到達しない＝純UIでのMSG-001到達経路はee実装と食い違う（documentation-only／-092 TBD） | 「`import_file` が null の場合、キー `admin.common.csv_invalid_format` をフラッシュし、同様にリダイレクトする。」／MSG-001「CSVのフォーマットが一致しません」 | pf-md:71,220 | pf-fallback | 1 |
| L1-M0340-018 | validation | pf現行は棚番号列が空または0以下として解釈される値のときマスタ照合を経ず `shelf_number_id` を未設定(NULL)に更新する（pf-handler:194 空許容・:242 null）。一方 ee(SUT)は棚番号名称を必須（ee-handler:115 `setRequired(true)`）としマスタ照合するため空はエラー＝pf/ee食い違いでeeオラクル化しない（-011 TBD） | 「棚番号を未設定に戻したい 棚番号列を空にするか、0 または解釈上 0 以下の値にし、マスタ存在チェックを経ずに `shelf_number_id` を未設定に更新できる。」 | pf-md:132 | pf-fallback | 0 |
| L1-M0340-019 | log | POST 取込で情報ログ「棚番号更新CSV登録開始」（取込直前）・「棚番号更新CSV登録完了」件数付き（正常終了）・「棚番号更新CSV登録 異常終了」（エラー結果）を出す（documentation-only＝ログ観測手段未整備・-049/-082/-083/-099/-100 TBD） | 「取込開始直前 情報ログ「棚番号更新CSV登録開始」／取込正常終了 情報ログ「棚番号更新CSV登録完了」と件数パラメータ `count`／取込がエラー結果 情報ログ「棚番号更新CSV登録 異常終了」」 | pf-md:249,250,251 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとして用意しUI操作でアップロードする。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0340-MASTERS | 取込の前提マスタ | 棚番号マスタ `dtb_shelf_number` に名称「S-002」（形式 `^[A-Z]-[0-9]{3}$` 適合）の行が存在。既存商品規格（商品コード＝規格ちょうど1件）一式 | 不要（参照） |
| SEED-M0340-VALIDUPDATE | 正常取込（棚番号更新） | 商品コードC1の規格がちょうど1件・現行 shelf_number_id=既知値H0＋棚番号名称「S-002」(ID=Hs)がマスタに存在。1データ行CSV（商品コードC1／棚番号名称 S-002） | 対象規格の shelf_number_id をH0へ復元・追加履歴を復元 |
| SEED-M0340-HISTORY | 取込履歴のページング検証 | `dtb_csv_import_history` に種別ID15の履歴を複数件（ページング境界跨ぎ） | 不要（参照） |
| SEED-M0340-NOPRODUCT | 商品コード不存在（0件） | `dtb_product_class` に一致規格が0件の商品コードを持つ1行CSV（棚番号名称はS-002等マスタ実在の妥当値） | 不要（打ち切り・書込みなし） |
| SEED-M0340-NOSHELF | 棚番号名称マスタ不存在（形式適合・DB不在） | 形式 `^[A-Z]-[0-9]{3}$` に**適合するがマスタに存在しない**棚番号名称「Z-999」を持つ1行CSV（商品コードは規格ちょうど1件で妥当）。※形式適合により列検証を通過し、findOneByName で不在となりマスタ不存在breakAllへ到達させる | 不要（打ち切り・書込みなし） |
| SEED-M0340-EMPTYSHELF | 棚番号名称 空（必須違反） | 商品コードは妥当・棚番号名称セルが空の1行CSV | 不要（列検証エラー・書込みなし） |
| SEED-M0340-BADCOLUMNS | 列数不一致（単一経路） | ヘッダー行は正しく（商品コード・棚番号名称）、データ行の列数だけが2でないCSV（例: データ行が1列または3列）。ヘッダ名対応不可は誘発しない | 不要（全体中断・書込みなし） |
| SEED-M0340-MAXROW | 行数上限（MSG-002）検証 | データ行が概算110000行以上のCSV | 不要（拒否・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報・Excelフォーマット源）

取込CSV列はコントローラ `getCsvHeader()`（雛形 `product_shelf_number_template.csv` 1行目＝商品コード・棚番号名称）と一致。Excelフォーマット sheet-57 と同一。

| 識別ID | 列名 | 必須/任意 | 型 | 例 | 備考 |
|---|---|---|---|---|---|
| 1 | 商品コード | 必須 | 文字型 | EOE00001JPNM | 規格の `dtb_product_class.product_code` に一致・ちょうど1件が前提（0204:棚番号更新CSVフォーマット!識別ID1） |
| 2 | 棚番号名称 | 必須 | 文字型 | S-002 | ee(SUT)は必須・形式 `^[A-Z]-[0-9]{3}$` 検証後に `dtb_shelf_number.name` 照合（0204:棚番号更新CSVフォーマット!識別ID2）。pf現行は空許容(未設定NULL・食い違い＝L1-018) |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 11候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0340C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。C-006/C-008/C-013は欠番（C-006=取込成功はログ必須の-082がTBDのためC-011の成功送信で被覆・C-008=商品コード重複はee-only TBD・C-013=NotBlank/File純UI到達不能/子エラー非deep TBD）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラーの**フラッシュ**と**取込履歴テーブル**を画面で目視するのが主。(2)取込効果（`shelf_number_id` の反映）と否定的事実（ロールバックで何も書かれない・履歴が増えない）は外部IFで検知不能なため**自動検証(内部・DB)**。
- 操作手順は純UI操作（ファイル選択→「CSVアップロード」ボタン押下→結果画面）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-001	IT-02	画面表示	P1	ナビからGETでアップロード画面が開きフォーマット表・雛形ダウンロード・件数選択・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0340-HISTORY	—	1. ナビ「商品管理」→「商品CSV管理」→「棚番号更新CSV登録」またはブックマークから GET でアクセスする 2. アップロード画面が開き、ファイル入力・「CSVアップロード」ボタン・フォーマット説明表（商品コード・棚番号名称の両項目、商品コード列と棚番号名称列の両方に必須バッジ）・雛形ダウンロードボタン・件数選択・下部の取込履歴テーブル（ファイル名・アップロード日時・作業者）とページングが表示されることを確認	ナビまたはブックマークから GET /%eccube_admin_route%/product/product_shelf_number_csv_import を開くとアップロード画面が開き、ファイル入力と「CSVアップロード」ボタン・フォーマット表（商品コード・棚番号名称の項目で、商品コード列と棚番号名称列の両方に必須バッジ）・雛形ダウンロードボタン・件数選択（10,50,100,300,500,1000,2000,10000,12000件）・取込履歴テーブル（ファイル名・アップロード日時・作業者）とページングが表示される（enロケールでは画面上部のProducts等が英語表示） [L1:L1-M0340-001,L1-M0340-002,L1-M0340-013; fixture:SEED-M0340-HISTORY@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-002	IT-20	JS挙動	P1	ファイル選択でカスタムラベルにファイル名が表示される	ログイン済／SEED-M0340-VALIDUPDATE	正常取込CSVファイルを選択（送信はしない）	1. アップロード画面でファイル入力に正常CSVファイルを選択 2. カスタムラベルに選択ファイル名が表示されることを確認	ファイル選択でカスタムラベルに選択したCSVファイル名が表示される [L1:L1-M0340-003; fixture:SEED-M0340-VALIDUPDATE@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-003	IT-15	モーダル	P1	送信前確認ダイアログがなくファイル選択後すぐ送信できる	ログイン済／SEED-M0340-VALIDUPDATE	正常取込CSVファイル	1. ファイルを選択し「CSVアップロード」ボタンを押下 2. 送信前に確認モーダル・ダイアログが表示されず送信されることを確認	「CSVアップロード」ボタン押下時に送信前確認ダイアログ（確認モーダル）は表示されず、確認を挟まずに送信される [L1:L1-M0340-004; fixture:SEED-M0340-VALIDUPDATE@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-004	IT-15	ページネーション	P1	page_countは許容値のとき表示件数が変わり不正値のときは既定10で表示され次回無指定で前回値が復元される	ログイン済／SEED-M0340-HISTORY	クエリ page_count（許容値=50／不正値=7／無指定）	1. 新規セッションでアップロード画面を page_count=50 で開き履歴の表示件数が50になることを確認 2. 続けて同一セッションで page_count=7（不正値）で開き履歴の表示件数が10になることを確認 3. さらに page_count 無指定で開き履歴の表示件数が50に戻ることを確認	page_countが許容値(10,50,100,300,500,1000,2000,10000,12000)のとき履歴の表示件数がその値になる。不正値7のときは既定10で表示される。その後 page_count 無指定で開くと前回の有効値50で表示される（表示件数は履歴テーブルの表示行数・件数プルダウンの選択値で画面確認） ／ 自動検証(内部): セッションキー admin.product.shelf_number_csv.page_count は有効値50送信時に50を保存・不正値7送信時は上書きされず50のまま・page_no は admin.product.shelf_number_csv.page_no へその都度保存 [L1:L1-M0340-005; fixture:SEED-M0340-HISTORY@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-005	IT-15	画面遷移	P1	成功・失敗のどちらの取込でもアップロード画面へ戻りフラッシュで結果が示される	ログイン済／SEED-M0340-MASTERS／SEED-M0340-VALIDUPDATE／SEED-M0340-NOSHELF	正常CSV（成功）と棚番号名称マスタ不存在CSV（失敗）の2ファイル	1. 正常CSVを選択し「CSVアップロード」を押下→アップロード画面が再表示され成功フラッシュが表示されることを確認 2. 続けて失敗CSVを選択し「CSVアップロード」を押下→同じくアップロード画面が再表示されエラーフラッシュ（インポータ結果のメッセージ）が表示されることを確認	POST取込は行検証を通る取込（成功・行検証エラー）のどちらでもアップロード画面（棚番号更新CSV登録画面）が再表示され、成功時は成功フラッシュ・行検証エラー時はインポータ結果のエラーフラッシュが管理画面上部に表示される。いずれの結末でも同じアップロード画面へ戻りフラッシュで結果が分かる ／ 自動検証(内部): 両送信ともHTTP302リダイレクトの遷移先が GET /%eccube_admin_route%/product/product_shelf_number_csv_import である [L1:L1-M0340-006; fixture:SEED-M0340-VALIDUPDATE@TBD-D5,SEED-M0340-NOSHELF@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-007	IT-25	存在検証（商品不存在）	P2	商品コードに一致する規格が0件の行は商品不存在エラーで全体中断される	ログイン済／SEED-M0340-MASTERS／SEED-M0340-NOPRODUCT	商品コードが dtb_product_class に一致0件の1データ行CSVファイル（棚番号名称はマスタ実在の妥当値）	1. 商品不存在CSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示・成功メッセージ非表示・履歴が増えないことを確認	商品コードに一致する規格が0件のとき商品不存在エラー（インポータ結果のメッセージ）が管理画面上部に表示され（breakAllで全体中断）、成功メッセージは出ず取込履歴テーブルに新行が増えない ／ 自動検証(内部・DB): dtb_product_class・dtb_csv_import_history とも書込みが無い（ロールバック方向） [L1:L1-M0340-010,L1-M0340-006,L1-M0340-009; fixture:SEED-M0340-NOPRODUCT@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-009	IT-22	マスタ実在検証	P2	形式適合だがマスタに無い棚番号名称の行はマスタ不存在エラーで全体中断される	ログイン済／SEED-M0340-MASTERS／SEED-M0340-NOSHELF	形式 A-999 型に適合するがマスタ dtb_shelf_number に存在しない棚番号名称「Z-999」を持つ1データ行CSVファイル（商品コードは規格ちょうど1件）	1. 棚番号名称マスタ不存在CSV（Z-999）を選択し「CSVアップロード」を押下 2. エラーフラッシュ表示・成功メッセージ非表示・履歴が増えないことを確認	棚番号名称が形式（英大文字1・ハイフン・数字3桁）に適合するため列形式検証を通過し、dtb_shelf_number.name に一致しないためマスタ不存在エラー（インポータ結果のメッセージ）が管理画面上部に表示され（breakAllで全体中断）、成功メッセージは出ず取込履歴テーブルに新行が増えない ／ 自動検証(内部・DB): dtb_product_class・dtb_csv_import_history とも書込みが無い（ロールバック方向） [L1:L1-M0340-012,L1-M0340-009; fixture:SEED-M0340-NOSHELF@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-010	IT-22	必須バリデーション	P2	棚番号名称が空の行は必須の列検証エラーで取込が完了しない	ログイン済／SEED-M0340-MASTERS／SEED-M0340-EMPTYSHELF	商品コードは妥当・棚番号名称セルが空の1データ行CSVファイル	1. 棚番号名称が空のCSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示・成功メッセージ非表示・履歴が増えないことを確認	棚番号名称は必須（Excelフォーマット必須◯・ee setRequired）のため空の行は列検証エラーとなり管理画面上部にエラーフラッシュ（インポータ結果のメッセージ）が表示され、成功メッセージは出ず取込履歴テーブルに新行が増えない（対象処理は完了しない） ／ 自動検証(内部・DB): dtb_product_class・dtb_csv_import_history とも書込みが無い [L1:L1-M0340-013,L1-M0340-009; fixture:SEED-M0340-EMPTYSHELF@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-011	IT-22	履歴INSERT・取込成功	P2	取込成功時のみ成功フラッシュと履歴1件が増え棚番号が反映されエラー取込では増えない	ログイン済／SEED-M0340-MASTERS／SEED-M0340-VALIDUPDATE／SEED-M0340-NOSHELF	正常CSV（商品コードC1・棚番号名称S-002／成功）と棚番号名称マスタ不存在CSV（Z-999／失敗）の2ファイル	1. 正常CSVを選択し「CSVアップロード」を押下→成功フラッシュ「登録が完了しました。」表示・取込履歴テーブルに新行（ファイル名・アップロード日時・作業者）が1件増えることを確認 2. 続けて失敗CSVを選択し「CSVアップロード」を押下→エラーフラッシュ表示・取込履歴テーブルに新行が増えないことを確認	取込成功時はアップロード画面が再表示され成功フラッシュがSUT(ee)実表示「登録が完了しました。」（en:Registration completed.）で表示され取込履歴テーブルにファイル名・アップロード日時・作業者の新規1行が表示される（種別IDは画面に表示されない内部フィルタ列）。エラーを含む取込では成功メッセージは出ず取込履歴テーブルに新行が増えない ／ 自動検証(内部・DB): 成功送信で dtb_csv_import_history が種別ID15で1件増え、商品コードC1の規格の dtb_product_class.shelf_number_id が棚番号名称S-002に対応するマスタIDへ更新される。失敗送信では履歴も shelf_number_id も変化しない [L1:L1-M0340-009,L1-M0340-007,L1-M0340-008; fixture:SEED-M0340-VALIDUPDATE@TBD-D5,SEED-M0340-NOSHELF@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-012	IT-12	列数検証	P2	データ行の列数が2でないCSVは列数不一致エラーで全体中断される	ログイン済／SEED-M0340-MASTERS／SEED-M0340-BADCOLUMNS	正しいヘッダー行に対しデータ行の列数だけが2でないCSVファイル（例: データ行が1列または3列・ヘッダー名は正）	1. 列数不一致CSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示・成功メッセージ非表示・履歴が増えないことを確認	ヘッダー名は正しくデータ行の列数だけが2でないとき、列数不一致エラーとなり全体中断（breakAll）され、管理画面上部にエラーフラッシュ（インポータ結果のメッセージ）が表示され成功メッセージは出ず取込履歴テーブルに新行が増えない（ヘッダ名対応不可は別経路のため本ケースでは誘発しない） ／ 自動検証(内部・DB): dtb_product_class・dtb_csv_import_history とも書込みが無い [L1:L1-M0340-014,L1-M0340-009; fixture:SEED-M0340-BADCOLUMNS@TBD-D5]				
m03-40_admin_product_product_shelf_number_csv_import	E2E-M0340C-014	IT-12	行数上限	P2	概算行数110000以上のCSVはMSG-002で拒否され棚番号更新CSV登録画面へ戻る	ログイン済／SEED-M0340-MAXROW	概算110000行以上のCSVファイル	1. 110000行以上のCSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示と遷移を確認	エラーメッセージ「110000 行を超えるCSVファイルは登録できません。」（テンプレートは %maxRecord% 行…で %maxRecord% は上限定数ADMIN_CSV_IMPORT_MAX_ROWS＝110000に解決。本メッセージは英訳なし＝ja固定）が管理画面上部に表示され棚番号更新CSV登録画面へ戻り、取込は行われない ／ 自動検証(内部・DB): dtb_product_class・dtb_csv_import_history とも増減なし [L1:L1-M0340-016; fixture:SEED-M0340-MAXROW@TBD-D5]				
```

---

## §5 ja/en locale対応表（ee-grep実施・ee messages.en.yaml逐語）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。LS=1のclaimのみen行を持つ。

| L1 | キー | ja逐語 | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| C-011 SUT観測（成功文言・pf-fallback L1ではない） | admin.register.complete（SUT(ee)の成功フラッシュキー・pf現行はキー admin.product.csv_import.save.complete＝文言「商品登録CSVファイルをアップロードしました。」で食い違い） | 登録が完了しました。 | Registration completed. | messages.en.yaml:1676 |
| L1-017（MSG-001） | admin.common.csv_invalid_format | CSVのフォーマットが一致しません | Unmatched CSV format | messages.en.yaml:1810 |
| L1-002 | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804（base_csv_upload.twig:74 でtrans描画） |
| L1-002 | admin.common.required | 必須 | Required | messages.en.yaml:1785（base_csv_upload.twig:101 必須バッジでtrans描画） |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | messages.en.yaml:1806 |
| L1-002 | admin.common.csv_skeleton_download | 雛形ダウンロード | Download a template | messages.en.yaml:1805 |
| L1-001 | admin.product.product_management | 商品管理 | Products | messages.en.yaml:1930 |
| L1-001（LS=0部分） | admin.product.product_shelf_number_csv | 棚番号登録CSVアップロード | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2032・twig sub_title） |
| L1-002（LS=0部分） | admin.product.product_shelf_number_csv_upload_title | 棚番号登録CSV | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2033・csv_box_title） |
| L1-002（LS=0部分） | admin.product.product_shelf_number_csv_format_title | 棚番号登録CSVファイルフォーマット | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2034・csv_format_title） |
| L1-016（MSG-002・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし＝messages.en.yamlに不在） | — (ja: messages.ja.yaml:1626) |

- LS=0のclaim（L1-003,004,005,006,007,008,009,010,011,012,013,014,015,016,018,019）はロケール変異なしまたは英訳なし＝`-EN`行を持たない（L1-007はR4でpf現行文言に純化・pf coreにen資源不在＝LS=0。ee(SUT)成功文言のenは上表 C-011 SUT観測行に記載）。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（`csv_product_shelf_number_update.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET /%eccube_admin_route%/product/product_shelf_number_csv_import`・`POST …/product_shelf_number_csv_upload`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。
- 取込結果の検証はフラッシュメッセージDOM＋取込履歴テーブルDOMを目視（B9・主）。取込効果（`shelf_number_id` 反映）・否定的事実（ロールバック非書込み・履歴非増加）はdb.ts自動検証（内部・DB）に限る（C-007/C-009/C-010/C-011/C-012）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・フラッシュ集合差分アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVアップロード」ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。※ファイル未選択送信は import_file が required（novalidate無し base_csv_upload:53）でブラウザHTML5検証にブロックされPOSTに至らず、MSG-001/NotBlankの純UI到達は不能＝候補化しない（-089/-092/-097 TBD・§9.1）。
2. 取込CSVは fixture（SEED-M0340-*）として用意。棚番号名称は形式 `^[A-Z]-[0-9]{3}$` を満たす「S-002」（マスタ実在）／「Z-999」（形式適合・マスタ不在）／空を使い分ける。
3. 更新系ケース（C-011 成功送信）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003,C-004 | Playwright（GUI） | 画面（DOM）＋セッション | 画面表示・JS・確認モーダル不在・ページネーション |
| C-005,C-011 | Playwright＋DB確認 | 画面（フラッシュ・履歴）＋DB | 常にリダイレクト・取込成功（棚番号反映・履歴増分はDB副次） |
| C-007,C-009,C-010,C-012 | Playwright＋DB確認 | 画面（エラーフラッシュ）＋DB | 打ち切りの否定的事実（何も書かれない・履歴非増加）はDB副次 |
| C-014 | Playwright＋DB確認 | 画面（エラーフラッシュ）＋DB | 行数上限拒否・書込みなし |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: ロールバックの非書込み・棚番号ID反映・履歴の増減。取込履歴の表示・フラッシュは画面で目視可能なため主は画面。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点はexcluded（Gate B15）。

### 集計（105 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **13** | 下表（11ユニーク候補ケース。B12共有〔完全重複・同一実行〕で母集合13行→tsv11行） |
| **TBD** | **10** | -011（棚番号未設定NULLクリアはpf現行のみ）／-012（商品コード2件以上→重複エラーはee-only）／-049,-083（異常終了ログ含む・観測未整備）／-082（成功ログ必須・観測未整備）／-089,-097（NotBlank純UI到達不能・File子エラー非deepフラッシュ）／-092（MSG-001到達経路食い違い）／-099,-100（開始/完了ログ観測未整備）。§9.1 |
| **excluded** | **82** | 汎用スタブ・矛盾・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・共通認証（未認証-003含む・B14）・phantom MSG。§9.3 |
| 合計 | **105** | 欠番0・理由なし重複0 |

> 会計: bound 13／TBD 10／excluded 82（=105・欠番0）

- 候補ケース総数 **11**（C-001〜C-005,C-007,C-009〜C-012,C-014。C-006/C-008/C-013は欠番）。bound13件を B12（完全重複・同一実行）でemitすると tsv=ユニーク11。
  - C-001←-104（画面表示）＋-091（GET画面表示・共有）／C-002←-006（ファイル名ラベル）／C-003←-007（確認モーダル不在）／C-004←-004（page_count許容値）＋-102（session保存キー・共有）
  - C-005←-105（POST後常にアップロード画面再表示+フラッシュ）／※-003は観点=未認証で共通認証へ委譲＝excluded（B14・R2 Major#2）
  - C-007←-009（商品コード規格ちょうど1件の判定のうち0件側＝商品不存在。2件以上側は対象システム固有分岐で-012 TBD＝分割）／C-009←-018（棚番号名称マスタ不存在・形式適合Z-999）／C-010←-010（棚番号名称必須・空エラー）
  - C-011←-019（履歴成功時のみINSERT＝成功送信で成功フラッシュ+履歴+棚番号反映・失敗送信で非増加）／C-012←-090（列数2不一致を代表bound・複合期待の他分岐〔商品コード必須・規格ちょうど1・棚番号名称マスタ実在〕はC-007/C-009/C-010で個別被覆・規格2件以上は-012 TBD）／C-014←-093（MSG-002 行数上限）
- **R1 Major#1（ログ観測不能）**: -082（成功フラッシュ+**ログ**+履歴を必須期待）はログが観測手段未整備＝TBD。-049/-083（エラーフラッシュ+異常終了**ログ**）も具体的実在挙動だが観測未整備＝excludedでなくTBD。
- **R1 Major#2（source純度）**: -012（2件以上→重複）はee-only（pf-handler:155 getOneOrNullResult）でpf/ee食い違い＝TBD。列名「棚番号名称」はexcel（L1-013）へ、twig構成はpf-fallback（L1-002）へ分離。
- **R1 Major#3（NotBlank/File純UI到達不能・子エラー非deep）**: -089/-097はNotBlank未選択がブラウザrequiredでブロック＝純UI到達不能、かつフォーム不正時 `getErrors()` 非deep（ee-controller:136）で子フィールド誤りが積まれず＝子エラーのフラッシュ有無が要実機＝TBD。
- **R1 Major#4（棚番号マスタ不存在の到達条件）**: C-009/SEED-M0340-NOSHELFは形式 `^[A-Z]-[0-9]{3}$` 適合かつマスタ不在の「Z-999」に固定しマスタ不存在breakAllへ到達させる。
- **R1 Major#5（派生TSV契約）**: 履歴の画面表示はファイル名・日時・作業者のみ（種別IDは内部・C-011是正）。-092のTBD理由（MSG-001/NotBlank競合）を派生TSVに保持（§8対応表要旨を非status語始まりに是正）。
- **R2 Major#1（source純度）**: POST後の遷移機構（pf render／ee 302 PRG）と成功キー（pf `admin.product.csv_import.save.complete`／ee `admin.register.complete`）はee(SUT)固有。L1-006/007のpf-fallback claimは「アップロード画面再表示+フラッシュ」「成功フラッシュ+履歴INSERT」の共通観測に限定し、302 PRG・成功キーはSUT事実として分離（1claim1source）。
- **R2 Major#2（bound充足）**: -003は未認証観点＝共通認証へ委譲exclude（B14）でC-005から除外。-009は「規格ちょうど1件」を0件側(商品不存在)に分割bound・2件以上側は-012 TBD。-090は複合期待のうち列数2不一致を代表boundし他分岐はC-007/C-009/C-010で個別被覆・規格2件以上は-012 TBD（各分岐被覆）。
- **R2 Major#3（両列必須表示）**: C-001は商品コード列・棚番号名称列の**両方**に必須バッジがある表示を確認（ee getRequiredCsvHeader は両列・Excelフォーマットも両列必須◯）。
- **R3 Major#1（source純度完遂）**: L1-006/007（pf-fallback）を**pf挙動のみ**（render・成功キー `admin.product.csv_import.save.complete`）に純化。ee(SUT)固有の302 PRG遷移機構は自動検証(内部)、成功文言（SUT実表示「登録が完了しました。」）は画面期待でSUT値を観測しclaim本文には混ぜない（1claim1source。L1-006/007本文に「302」「register.complete」を残さない）。
- **R3 Major#2（C-012単一経路）**: C-012を**列数不一致の単一経路**に固定（ヘッダー名は正・データ行の列数のみ2でない）。ヘッダ名対応不可は別経路として分離（母集合固有行なし・L1-014に記載）。-090複合期待の各分岐は単一判定の個別boundで被覆（列数=C-012・商品コード不存在=C-007・棚番号名称マスタ=C-009・棚番号名称必須=C-010・規格2件以上=-012 TBD）。
- **R4 Major#1（source純度・意味的完遂）**: L1-006/007のpf-fallback claim本文から**意味的ee事実を除去**。L1-006はSUT観測note（「SUT側で観測する（自動検証・内部）」）を削除しpf render＋画面再表示のみ。L1-007はee文言「登録が完了しました。」を削除し**pf現行文言「商品登録CSVファイルをアップロードしました。」**（pf core message.ja.yml:133・キー `admin.product.csv_import.save.complete`）に純化＝pf coreにen資源不在でL1-007 LS=1→0。ee(SUT)成功文言「登録が完了しました。」/en Registration completed.は**§4 C-011のSUT観測値**として記述（pf-fallback L1本文に混ぜない・1claim1source）。会計不変。
- **B7非該当観点excluded**: 検索条件14（-020〜-033）／ファイル操作系（-072〜-081）。§9.3。
- **B8観点補正＝12件**（bound13行のうち-010を除く12行が観点ラベルと期待テキスト実内容が不一致。§8.1）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（12件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | ページネーション（page_count許容値のみセッション保存） | L1-005 |
| -006 | 識別子 | JS挙動（ファイル選択ラベルにファイル名表示） | L1-003 |
| -007 | 状態変化 | モーダル（送信前確認ダイアログ不在） | L1-004 |
| -009 | HTTPステータス | 存在検証（商品コード0件→商品不存在breakAll） | L1-010 |
| -018 | DBとの相関バリデーション | マスタ実在検証（棚番号名称マスタ不存在→breakAll） | L1-012 |
| -019 | 部分入力 | 履歴INSERT・取込成功（成功時のみ・棚番号反映） | L1-009 |
| -090 | 画面レイアウト | 列数検証（列数2不一致→中断） | L1-014 |
| -091 | 画面レイアウト | 画面表示（GETアップロード画面・フォーマット表・履歴） | L1-001 |
| -093 | 画面レイアウト | メッセージ/画面遷移（MSG-002 行数上限→画面へ戻る） | L1-016 |
| -102 | 非同期更新 | ページネーション（session保存キー） | L1-005 |
| -104 | 公開コンテンツ | 画面表示（アップロード画面・フォーマット表・履歴） | L1-001 |
| -105 | データ正当性 | 画面遷移（POST後 常にリダイレクト+フラッシュ） | L1-006 |

### 105対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | 検証・取込後アップロード画面へ戻りフラッシュで結果（観点=未認証・前提もアップロード送信の汎用＝未認証は共通認証へ委譲＝B14 excluded・R2 Major#2） | **excluded** | — |
| 004 | クエリの件数が許容リストに含まれるときだけセッションに保存（B8: 対象データ→ページネーション） | bound | C-004 |
| 005 | csv_product_shelf_number_update.twig は base_csv_upload.twig を継承すること（Twig継承は観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 006 | ファイル選択でカスタムラベルへファイル名表示（B8: 識別子→JS挙動） | bound | C-002 |
| 007 | 送信前確認ダイアログはない（B8: 状態変化→モーダル） | bound | C-003 |
| 008 | 一時ディレクトリ eccube_csv_temp_realdir へ退避後にインポータが読込み終了時に削除試行（内部ファイル処理・純UI観測手段なし・documentation-only） | **excluded** | — |
| 009 | 同一コードの規格がちょうど1件であることが検証される（0件側＝商品不存在を分割bound・2件以上側は対象システム固有分岐で-012 TBD＝分割。B8: HTTPステータス→存在検証） | bound | C-007 |
| 010 | 必須バリデーションでエラー表示され完了しない＋前提 棚番号（棚番号名称必須・空エラー） | bound | C-010 |
| 011 | 棚番号名称を空にして棚番号を未設定に戻す操作は、現行システムでは継続扱いだが対象システムでは棚番号名称が必須のため挙動が食い違い、期待値を一意に固定できない | **TBD** | — |
| 012 | 商品コードに一致する規格が2件以上あるときの重複エラーは対象システム固有の分岐で、現行システムは存在確認のみのため挙動が食い違い、期待値を一意に固定できない | **TBD** | — |
| 013 | 相関バリデーションでエラー表示され完了しない（前提「一覧と反映内容」は汎用ノイズ・固有対象なし） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提「副作用」は汎用ノイズ） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・前提 dtb_product_class） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない＋前提 dtb_shelf_number（棚番号名称マスタ不存在→breakAll。B8: DB相関→マスタ実在検証） | bound | C-009 |
| 019 | 成功時のみ INSERT＋前提 dtb_csv_import_history（B8: 部分入力→履歴INSERT・取込成功） | bound | C-011 |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索非該当・汎用スタブ・B7/B15） | **excluded** | — |
| 021 | 含まれない（検索非該当・汎用スタブ） | **excluded** | — |
| 022 | 含まれる（汎用スタブ） | **excluded** | — |
| 023 | 含まれない（汎用スタブ・前提ナビから開く） | **excluded** | — |
| 024 | 含まれる（汎用スタブ・前提MSG-001） | **excluded** | — |
| 025 | 含まれない（汎用スタブ・前提MSG-002） | **excluded** | — |
| 026 | 含まれる（汎用スタブ・前提MSG-003） | **excluded** | — |
| 027 | 含まれない（汎用スタブ・前提MSG-004） | **excluded** | — |
| 028 | 含まれる（汎用スタブ・前提MSG-005＝phantom） | **excluded** | — |
| 029 | 含まれない（汎用スタブ・前提フォーム不正） | **excluded** | — |
| 030 | 含まれる（汎用スタブ・前提インポータ検証エラー） | **excluded** | — |
| 031 | 含まれない（汎用スタブ・前提取込開始直前） | **excluded** | — |
| 032 | 含まれる（汎用スタブ・前提取込正常終了） | **excluded** | — |
| 033 | 含まれない（汎用スタブ・前提取込エラー結果） | **excluded** | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | **excluded** | — |
| 035 | 同上（汎用スタブ・Playwright+手動確認） | **excluded** | — |
| 036 | 同上（汎用スタブ） | **excluded** | — |
| 037 | 同上（汎用スタブ） | **excluded** | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定＝取込反映はC-011で概念被覆） | **excluded** | — |
| 039 | 登録内容の対象レコードが追加されない（汎用スタブ） | **excluded** | — |
| 040 | 追加される（汎用スタブ） | **excluded** | — |
| 041 | 送信前確認ダイアログはない（前提「モーダル・ポップアップ」だが登録内容観点の汎用重複＝確認モーダル不在はC-003被覆） | **excluded** | — |
| 042 | 追加される（汎用スタブ） | **excluded** | — |
| 043 | 追加される（汎用スタブ・最大長 商品コード） | **excluded** | — |
| 044 | 追加されない（汎用スタブ・最大長+1 棚番号） | **excluded** | — |
| 045 | 追加される（汎用スタブ・最小長・前提 棚番号未設定に戻したい） | **excluded** | — |
| 046 | 追加されない（汎用スタブ・最小長-1・前提 同一product_code複数） | **excluded** | — |
| 047 | 追加される（汎用スタブ・前提 一覧と反映内容） | **excluded** | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ・前提 成功時出力＝取込成功はC-011で概念被覆） | **excluded** | — |
| 049 | 取込失敗時にエラーフラッシュを表示し異常終了の情報ログを出す挙動だが、ログの観測手段が未整備で期待値を一意に固定できない（要実機） | **TBD** | — |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝取込反映はC-011で概念被覆） | **excluded** | — |
| 051 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | **excluded** | — |
| 052 | 変更される（汎用スタブ） | **excluded** | — |
| 053 | 成功時のみ INSERT（前提 dtb_csv_import_history・更新内容観点の汎用重複＝履歴はC-011被覆） | **excluded** | — |
| 054 | 変更される（汎用スタブ・前提 登録/更新） | **excluded** | — |
| 055 | 変更される（汎用スタブ・最大長） | **excluded** | — |
| 056 | 変更されない（汎用スタブ・最大長+1） | **excluded** | — |
| 057 | 変更される（汎用スタブ・最小長・前提 ナビから開く） | **excluded** | — |
| 058 | 変更されない（汎用スタブ・最小長-1・前提MSG-001） | **excluded** | — |
| 059 | 変更される（汎用スタブ・前提MSG-002） | **excluded** | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提MSG-003） | **excluded** | — |
| 061 | プレースホルダ「要ソース確認」（前提MSG-004・出所未確認） | **excluded** | — |
| 062 | 実行結果のファイル出力内容が対象データと一致（汎用スタブ・前提MSG-005＝phantom） | **excluded** | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・前提フォーム不正・観測対象未定義） | **excluded** | — |
| 064 | フォーマット定義でエラー表示され完了しない（汎用スタブ・前提インポータ検証エラー） | **excluded** | — |
| 065 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・前提取込開始直前） | **excluded** | — |
| 066 | 同上（汎用ファイルスタブ・前提取込正常終了） | **excluded** | — |
| 067 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 068 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 069 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 070 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ・手動） | **excluded** | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 073 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | **excluded** | — |
| 074 | コピーのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 075 | ファイル登録のファイル出力内容が対象データと一致（汎用ファイルスタブ・アップロード成否はC-011で被覆） | **excluded** | — |
| 076 | ファイル出力のファイル出力内容が対象データと一致（出力は本機能に非該当） | **excluded** | — |
| 077 | JSONのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 078 | 同名ファイルのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当・前提 棚番号未設定に戻したい） | **excluded** | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当） | **excluded** | — |
| 081 | スキーマのファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 082 | 取込成功時にアップロード画面へ戻り成功フラッシュ・情報ログ・履歴1件登録を行う挙動だが、期待に含まれる情報ログの観測手段が未整備で期待値を一意に固定できない（要実機） | **TBD** | — |
| 083 | 取込失敗時にエラーフラッシュを表示し異常終了の情報ログを出す挙動だが、ログの観測手段が未整備で期待値を一意に固定できない（要実機） | **TBD** | — |
| 084 | 更新抑止のファイル出力内容が対象データと一致（汎用スタブ） | **excluded** | — |
| 085 | 更新対象（前提 dtb_product_class・内部情報の汎用注記） | **excluded** | — |
| 086 | 参照のみ（棚番号名称の実在確認）（前提 dtb_shelf_number・マスタ参照はC-009で被覆） | **excluded** | — |
| 087 | 成功時のみ INSERT（前提 dtb_csv_import_history・ロールバック観点の汎用重複＝履歴はC-011被覆） | **excluded** | — |
| 088 | 当機能が行う登録・更新で対象テーブルを直接保存（内部DB注記・汎用） | **excluded** | — |
| 089 | アップロードファイルの必須・最大サイズ検証だが、ファイル未選択はブラウザ側の必須チェックで送信がブロックされ、サイズ超過など子項目の検証エラーが画面に表示されるかは実機確認を要し、期待値を一意に固定できない | **TBD** | — |
| 090 | 列数2、商品コード必須、規格件数ちょうど1、棚番号名称マスタ実在（複合期待の各分岐を単一判定の個別候補で被覆＝列数不一致の単一経路を代表bound・商品コード必須/不存在と棚番号名称マスタ実在と棚番号名称必須は各バリデーションの個別boundで被覆・規格2件以上は別行TBD。B8: 画面レイアウト→列数検証。※母集合の「正の整数ID」はpf-md陳腐化・実挙動は名称照合） | bound | C-012 |
| 091 | GET …/product/product_shelf_number_csv_import（B8: 画面レイアウト→画面表示） | bound | C-001 (shared) |
| 092 | フォーマット不一致メッセージ（CSVのフォーマットが一致しません）はファイル未選択時の分岐だが、ファイル項目が必須のため通常操作では到達せず、実際に表示されるメッセージは実機確認を要し期待値を一意に固定できない | **TBD** | — |
| 093 | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する＋前提MSG-002（B8: 画面レイアウト→メッセージ/画面遷移 行数上限） | bound | C-014 |
| 094 | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する＋前提MSG-003（MSG-003は複数エラーの束・遷移自体はC-005/各エラー系で被覆・具体トリガ列挙は汎用遷移） | **excluded** | — |
| 095 | プレースホルダ「要ソース確認」＋前提MSG-004（出所未確認） | **excluded** | — |
| 096 | 画面表示データでエラー表示されず継続（汎用スタブ・前提MSG-005＝phantom） | **excluded** | — |
| 097 | フォーム不正時に管理者向けエラーフラッシュを表示しリダイレクトする挙動だが、ファイル項目など子項目の検証エラーが画面に積まれるかは実機確認を要し、期待値を一意に固定できない | **TBD** | — |
| 098 | 画面表示データでエラー表示されず継続（前提インポータ検証エラーだが期待は「継続」＝自己矛盾・汎用） | **excluded** | — |
| 099 | 情報ログ「棚番号更新CSV登録開始」＋前提 取込開始直前（実在挙動だがログ観測手段未整備で一意固定不能・要実機） | **TBD** | — |
| 100 | 情報ログ「棚番号更新CSV登録完了」と件数パラメータ count＋前提 取込正常終了（実在挙動だがログ観測手段未整備・要実機） | **TBD** | — |
| 101 | ファイル選択のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 102 | キー admin.product.shelf_number_csv.page_count と ...page_no に保存する（B8: 非同期更新→ページネーション） | bound | C-004 (shared) |
| 103 | 同一スキーマ（前提 更新対象列・移行時の汎用注記） | **excluded** | — |
| 104 | アップロード画面が開き、フォーマット表と履歴が表示される（B8: 公開コンテンツ→画面表示） | bound | C-001 |
| 105 | 検証・取込後アップロード画面へ戻りフラッシュで結果（B8: データ正当性→画面遷移） | bound | C-005 |

`func_scope_check` 判定: 親105/105会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝10件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い（ee-only分岐） | -012 | 1 | 母集合期待「商品コードが2件以上→重複エラーで全体中断」は ee(SUT)のみの分岐（ee-handler:145 countByProductCode>=2→addProductCodeDuplicatedError）。pf現行は存在チェックのみ（pf-handler:155 getOneOrNullResult）で2件以上を専用重複エラーにしない＝pf/ee食い違いでeeオラクル化しない（R1 Major#2） |
| pf/ee食い違い（pf現行のみeeに無い） | -011 | 1 | 母集合期待「棚番号を未設定に戻したい＝棚番号列空でエラーなし継続（NULLクリア）」（pf-handler:194 空許容・:242 null）はee(SUT)に存在しない。ee-handler:115 は棚番号名称を setRequired(true) としExcelフォーマットも「必須◯」＝空はエラー。実挙動が食い違うためeeオラクル化しない＝要仕様確認 |
| NotBlank純UI到達不能・File子エラー非deep（B1/B3・R1 Major#3） | -089,-097 | 2 | import_file は required（base_csv_upload:53 novalidate無し）でファイル未選択送信はブラウザHTML5検証にブロックされ純UI到達不能。かつフォーム不正時のフラッシュは $form->getErrors()（非deep・ee-controller:136）で子フィールド import_file の NotBlank/File 誤りが積まれない＝子フィールドエラーのフラッシュ有無は要実機。maxSize超過は別候補として要実機で実表示挙動を確定 |
| MSG-001到達経路がee実装と食い違い純UI到達不能（B1/B3） | -092 | 1 | 母集合前提MSG-001「CSVのフォーマットが一致しません」（admin.common.csv_invalid_format）は import_file が null の分岐だが、import_file は required＋NotBlank のためファイル未選択送信は先行するフォーム不正分岐（ee-controller:135）で終了し当分岐（:146）へ到達しない＝純UIでMSG-001到達不能。実際に出る検証メッセージの確定は要実機 |
| 実在挙動だがログ観測手段未整備（B15③・R1 Major#1） | -049,-082,-083,-099,-100 | 5 | 情報ログ「棚番号更新CSV登録開始/完了/異常終了」（pf-md:249,250,251・L1-019）は実在するがログ観測手段が現行ハーネスで未整備。-082は成功期待に「ログ」を必須で含み、-049/-083は「異常終了ログ」を含むため画面/履歴だけでは一意固定不能＝要実機／ログ観測整備 |

（合計 1+1+2+1+5 = 10）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・110000境界・棚番号名称マスタ実在値S-002/形式適合不在値Z-999/空・列数不一致・商品コード0件） | fixture manifest（D5型）未整備＝要実機（SEED-M0340-*） |
| -089/-097 File(maxSize)超過・NotBlank子エラーの実フラッシュ挙動（非deep getErrors）／-092 ファイル未選択時の実表示メッセージ／-011 空棚番号名称のee実挙動／-012 商品コード重複のee実メッセージ | ee実機で確定要（TBD） |
| L1-解決器・取込結果アサートヘルパ（フラッシュ集合差分）・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |
| L1-018/019（棚番号未設定NULLクリア・開始/完了/異常終了ログ）の実機検証手段 | pf/ee食い違い／ログ観測手段未整備＝documentation-only |

### 9.3 excluded＝82件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B14】未認証＝共通認証へ委譲（R2 Major#2）** | -003 | 観点=未認証だが前提もアップロード送信の汎用で、未認証時の挙動は管理画面ファイアウォールの共通認証へ委譲＝当機能固有の試験対象でない（B14）。POST後のアップロード画面再表示+フラッシュ自体はC-005で被覆 |
| **【B15②/④】Twig継承・内部ファイル処理（観測不能・C-001被覆）** | -005,-008 | -005=テンプレート継承そのものは外部IFで判定不能（構成要素はC-001被覆）／-008=一時ディレクトリ退避・削除は内部ファイル処理で純UI観測手段なし |
| **【B7/B15】汎用検索スタブ（非該当観点）** | -020〜-033 | 本機能は検索を行わず選択CSVをアップロード取込（観点テンプレ機械生成） |
| **【B15②】汎用「実行結果/出力内容が含まれる/一致」スタブ** | -034,-035,-036,-037,-048,-060,-062,-065,-066,-067,-068,-069,-070,-084,-101 | 一致基準（どの列がどの値か）を母集合行が持たず内容空虚 |
| **【B15②/④】汎用「登録内容/更新内容が追加/変更される・されない」スタブ（C-011で被覆）** | -038,-039,-040,-042,-043,-044,-045,-046,-047,-050,-051,-052,-054,-055,-056,-057,-058,-059 | 対象レコード・具体値を母集合が指定せず内容空虚。取込の成功反映（C-011）で概念被覆済みの冗長スタブ |
| **【B15②/③】確認モーダル・履歴・参照の汎用重複（被覆済み）** | -041,-053,-086,-087 | -041=確認モーダル不在（C-003被覆）／-053,-087=成功時のみINSERT（C-011被覆）／-086=棚番号名称マスタ参照（C-009被覆） |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）・汎用相関スタブ** | -013,-014,-015,-016,-017,-063,-064,-071,-096,-098 | 「継続」の観測対象が無い（-098=前提インポータ検証エラーと期待「継続」が自己矛盾）。汎用相関/DB相関の前提が汎用ノイズで具体対象を名指さず固有一意対応不成立 |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。取込機能に該当なし |
| **【B15②】内部DB注記・移行注記・MSG-003束（被覆済み）** | -085,-088,-094,-103 | -085=更新対象（内部注記）／-088=対象テーブル直接保存（内部注記）／-094=MSG-003束の汎用遷移（C-005・各エラー系で被覆）／-103=同一スキーマ（移行注記） |
| **【B15③】自己矛盾/プレースホルダ/矛盾スタブ** | -001,-002,-061,-095 | -001「出力失敗」（取込機能に非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし／-061,-095「要ソース確認」（前提MSG-004＝プレースホルダ・出所未確認） |

## §10 特記事項（片側断定せず記録）

1. **取込パターンの検証設計**: 取込結果はフラッシュ＋取込履歴テーブルを画面で目視するのが主。取込値のDB反映（`shelf_number_id`）・否定的事実（ロールバック非書込み・履歴非増加）は外部IFで検知不能なため自動検証(内部・DB)に限定（B9）。取込履歴の表示（ファイル名・日時・作業者）・フラッシュは画面で目視可能なため主は画面（トートロジー禁止）。種別ID15は画面非表示の内部フィルタ列でありDB検証に限定（R1 Major#5）。
2. **正直分類の帰結**: 真のboundは13件（11候補ケース）。TBDは実在するが観測/固定不能な10件（-011 未設定NULLクリアpf/ee食い違い・-012 重複分岐ee-only・-049/-082/-083/-099/-100 ログ観測未整備・-089/-097 NotBlank純UI到達不能/File子エラー非deep・-092 MSG-001到達経路食い違い）。excluded82（未認証-003=B14共通認証委譲含む）。会計＝bound13／TBD10／excluded82。
3. **★pf-md陳腐化の是正**: pf-md本文は棚番号列を「棚番号マスタの主キーID／正の整数IDと解釈される」と記述するが、**pf実source（ShelfNumberImportHandler:212 `WHERE name=:shelfNumber`）・ee実source（ProductShelfNumberUpdateImportHandler:164 `findOneByName`）ともに棚番号列を名称(name)で照合**し、Excelフォーマット sheet-57 も列名「棚番号名称」（例 S-002）と規定。よって母集合-090の「棚番号が正の整数IDと解釈される」はpf-md陳腐化＝実挙動は名称照合とし、C-012は列数2検証を代表bound、名称マスタ照合はC-009でboundした。
4. **★R1 Major#4 棚番号マスタ不存在の到達条件**: ee は `findOneByName` の前に `ColumnDefinitions::shelfNumberId`(:479) の `RegexValidator('/^[A-Z][-][0-9]{3}$/')` で形式検証する。形式不正値（例 999・abc）は列形式検証エラーとなりマスタ不存在分岐へ到達しない。よってC-009/SEED-M0340-NOSHELFは**形式適合かつマスタ不在**の「Z-999」に固定してマスタ不存在breakAllへ到達させる。
5. **★R1 Major#2 source_class純度**: 列名「棚番号名称」はee(SUT)/Excelフォーマット由来でpf現行は「棚番号」＝pf-fallbackのL1-002からは列名逐語を除きtwig構成のみとし、列名はexcelのL1-013へ分離（1claim1source）。商品コード2件以上→重複エラーもee-only（pf-handler:155 getOneOrNullResult）でL1-011は「eeオラクル化しない」claimとし-012をTBD化。
6. **★R1 Major#3 NotBlank/File純UI到達・非deep getErrors**: import_file は required＋novalidate無し（base_csv_upload:53）でファイル未選択はブラウザ検証にブロックされ純UI到達不能。フォーム不正時のフラッシュは `$form->getErrors()`（非deep・ee-controller:136）で子フィールド誤りを収集しない（Goods/Card は `getErrors(true)` deep と対照）。よってNotBlank/Fileの子フィールドエラーが実際にフラッシュされるかは要実機＝-089/-097 TBD。
7. **★R1 Major#1 ログ会計**: -082は成功期待に「ログ」を必須で含み、-049/-083は「異常終了ログ」を含む。ログは観測手段未整備＝画面/履歴だけでは一意固定できないためTBD。観測可能な成功フラッシュ+履歴増分+棚番号反映はC-011で被覆。
8. **成功/失敗表示の実装確認**: ee(SUT)はPOST取込を常に302 PRGリダイレクト（ee-controller:140/148/154/196）で GET画面へ戻す。行検証エラー（インポータ結果のメッセージ）は `$result->getErrors()`（ee-controller:174）で各メッセージをフラッシュ＝到達可（C-005/C-007/C-009/C-010/C-012）。成功フラッシュ=admin.register.complete「登録が完了しました。」（en:Registration completed.）。フォーム不正の子フィールドエラーは前記の通り非deepで積まれない点と区別する。
9. **B12/1実行1判定**: B12共有は完全重複・同一実行（C-001←104/091・C-004←004/102）に限定。C-005は-105単独（-003は未認証委譲excludeでC-005から除外・R2 Major#2）。MSG-002はL1でテンプレート保持・実行期待は根拠ある置換後実値「110000 行を超えるCSVファイルは登録できません。」（%maxRecord%＝定数110000・pf-md:72）へ解決。
10. **R2是正（source純度・bound充足・両列必須）**: (1)POST後遷移機構（pf render／ee 302 PRG）と成功キー（pf `admin.product.csv_import.save.complete`／ee `admin.register.complete`）はee(SUT)固有＝L1-006/007のpf-fallback claimは共通観測（画面再表示+フラッシュ／成功フラッシュ+履歴INSERT）に限定し302 PRG・成功キーはSUT事実へ分離。(2)-003は未認証＝B14 excluded・-009は0件側分割bound（2件以上-012 TBD）・-090は列数2代表bound（他分岐C-007/C-009/C-010被覆・規格2件以上-012 TBD）。(3)C-001は商品コード・棚番号名称の両列に必須バッジ表示を確認（ee getRequiredCsvHeader両列・Excelフォーマット両列必須◯）。
11. **R3是正（source純度完遂・単一経路）**: L1-006/007のpf-fallback claim本文を**pf挙動のみ**（render・成功キー `admin.product.csv_import.save.complete`）に純化し「302」「register.complete」を除去。ee(SUT)の302 PRG遷移機構は自動検証(内部)、成功文言「登録が完了しました。」は画面期待でSUT値を観測（1claim1source）。C-012は**列数不一致の単一経路**に固定（ヘッダー名正・データ行の列数のみ2でない）しヘッダ名対応不可を別経路分離。会計不変（bound13／TBD10／excluded82）。
12. **R4是正（source純度・意味的完遂）**: L1-006/007のpf-fallback claim本文から**意味的ee事実**を除去。L1-006からSUT観測note削除（pf renderのみ）。L1-007はee文言「登録が完了しました。」を削除し**pf現行文言「商品登録CSVファイルをアップロードしました。」**（`admin.product.csv_import.save.complete`・pf core message.ja.yml:133）に純化＝pf coreにen不在でLS=1→0。ee(SUT)成功文言は§4 C-011のSUT観測値として記述。grep: L1-006/007本文に「登録が完了しました」「SUT側で観測」「302」「register.complete」残存0。会計不変。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（12件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | ページネーション | 期待「件数が許容リストに含まれるときだけセッションに保存」（L1-005）。母集合ラベル「対象データ」は誤り |
| 006 | JS挙動 | 期待「ファイル選択でカスタムラベルへファイル名表示」（L1-003）。母集合ラベル「識別子」は誤り |
| 007 | モーダル | 期待「送信前確認ダイアログはない」（L1-004）。母集合ラベル「状態変化」は誤り |
| 009 | 存在検証 | 期待「同一コードの規格がちょうど1件であることが検証される（0件→商品不存在）」（L1-010）。母集合ラベル「HTTPステータス」は誤り |
| 018 | マスタ実在検証 | 期待「DB相関エラー＋前提 dtb_shelf_number」＝棚番号名称マスタ不存在（L1-012）。母集合ラベル「DBとの相関バリデーション」は具体化 |
| 019 | 履歴INSERT | 期待「成功時のみ INSERT」（L1-009）。母集合ラベル「部分入力」は誤り |
| 090 | 列数検証 | 期待「列数2…」（L1-014）。母集合ラベル「画面レイアウト」は誤り |
| 091 | 画面表示 | 期待「GET …/product/product_shelf_number_csv_import」（L1-001）。母集合ラベル「画面レイアウト」は誤り |
| 093 | メッセージ/画面遷移 | 期待「棚番号更新CSV登録画面に遷移」＋前提MSG-002 行数上限（L1-016）。母集合ラベル「画面レイアウト」は誤り |
| 102 | ページネーション | 期待「キー admin.product.shelf_number_csv.page_count と ...page_no に保存する」（L1-005）。母集合ラベル「非同期更新」は誤り |
| 104 | 画面表示 | 期待「アップロード画面が開き、フォーマット表と履歴が表示される」（L1-001）。母集合ラベル「公開コンテンツ」は誤り |
| 105 | 画面遷移 | 期待「検証・取込後、常にGET…へリダイレクトされフラッシュで結果」（L1-006）。母集合ラベル「データ正当性」は誤り |
