# 候補: m03-32 高額商品価格変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合97全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**pf/ee実ソース照合版＋codex Gate C R1 Major5件・R2 Major2件是正反映（2026-07-29）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（codex Gate C確定）の構造・取込検証設計を踏襲。値・claim・列名・メッセージ・MSG番号はM03-32自身の一次資料（Excel sheet「高額商品価格変更CSVアップロード」／pf実ソース／ee実ソース照合）から取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能・pf/ee食い違いでeeオラクル化できないものはTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。観測対象＝**アップロード結果画面（成功／エラー／警告フラッシュ・取込履歴テーブル）＋取込効果（対象商品規格を再表示して価格反映確認）**。
> **★pf/ee食い違いが本機能の核心**: pf現行（HareruyaEcプラグイン）とee（システムオブテスト）で取込ハンドラ・画面遷移・UI（accept/ボタン文言/JS）が食い違う。判定原則を§0-Aに明示。**UI表示はSUT=ee実装を正**（button文言・accept・JSはee `base_csv_upload.twig`）。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet「高額商品価格変更CSVアップロード」（機能No=M03-32・機能名「高額商品価格変更CSVアップロード」・概要「高額商品用に価格変更をCSVにて一括で更新する」・作成者=城下・作成日2025-06-16・更新者=堀部・更新日2025-09-16）。関連=sheet「高額商品価格変更CSVフォーマット」。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は実Excel座標 `0204:高額商品価格変更CSVアップロード!<セル>` で表記する（HTML行番号は実座標でない＝T2前処理の実座標方針）。
- **pf現行md（参照だが鵜呑み禁止・EE挙動記述あり）**: `functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md`（git hash-object `716b747f3f4500c1cbfc106b82fda9b9fca2c1ba`）。**本pf-mdはEE挙動を記述している**（`existsProductClassByProductCodeAndSaleFlg`・`standard_price`列・登録完了`admin.register.complete`・accept4値等はee実装の名称）。pf現行オラクルは下記pf実ソースでfile:line確認する。
- **pf実ソース（pf現行回帰の実体・source_class=pf-fallbackの根拠）**: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvSimpleHighPriceUpload`:1118／`CSV_IMPORT_MAX=5010`:391）／`.../Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php`（pf現行ハンドラ4列・存在チェックbreakAll）／`.../Resource/template/admin/Product/base_csv_upload.twig`（pf現行UI: accept=`text/csv,text/tsv`:26／ボタン「CSVファイルのアップロード」:36／custom-file JS・page_count無し）。
- **ee実ソース（システムオブテスト＝SUT・UI/挙動照合の正・source_classには不使用＝EE-source 0）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php`／`.../Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php`／`.../Service/Csv/Importer/MessageStore.php`（CSVエラーメッセージキー）／`.../Form/Type/Admin/CsvImportType.php`（import_file: NotBlank＋File(maxSize)）／`.../Resource/template/admin/Product/base_csv_upload.twig`（SUT UI: accept=`.csv, text/csv, .tsv, text/tsv`:20／ボタン `admin.common.csv_upload`=「CSVファイルをアップロード」:74／custom-file変更→ファイル名表示:25-27／submit→`$.changeLoading(true)`:30）／`.../Entity/Master/MtbCsvImportType.php`（`SIMPLE_HIGH_PRICE_IMPORT_CSV_ID=7`:34）／**enロケール源 `.../Resource/locale/messages.en.yaml`・jaロケール `.../Resource/locale/messages.ja.yaml`**。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`・repo HEAD `fe910a31ed3a336e04cb7d288692ad9411eaf620`）の `IT-M03-32-ADMIN-PRODUCT-PRODUCT-SIMPLE-HIGH-PRICE-CSV-IMPORT-001..097`（97件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実ソースはUI/挙動照合とenロケール源に使い、オラクルの source_class には不使用（EE-source 0）。

### §0-A ★pf/ee食い違いの判定原則（本機能の核心・1claim1source・R1 Major反映）

pf実ソースとee実ソースは、本機能で**取込ハンドラの列定義・更新セマンティクス・画面遷移・UI**が食い違う。**UI表示・accept・ボタン文言・JSはSUT=ee実装を正**とし、pf-fallback claimはpf現行が実際に行う挙動のみに限定する（1claim1source）。

| 観点 | pf現行（実ソース） | ee＝SUT（実ソース） | Excel設計（正本） |
|---|---|---|---|
| CSV列 | 商品コード・販売価格・買取価格・下代（4列） | 商品コード・基準価格（2列） | 識別ID:3「販売価格」を「基準価格」に変更（ee側と整合） |
| 更新セマンティクス | セールフラグ分岐なし。price02・buy_price・下代を更新＋価格履歴 | セールフラグ分岐あり。真→standard_priceのみ／偽→standard_price＋price02 | セールフラグ0→基準価格・販売価格の双方更新／セールフラグ1→基準価格のみ・販売価格変更なし・アラート表示 |
| 同一商品コードに複数規格が並存 | 明示的重複チェックなし | 価格更新前に `isProductCodeUnique` で `breakAll`（重複エラー）＝並存時は優先処理へ到達しない | 並存時の優先順位は**規定なし** |
| 対象コードが高額規格を持たない（コード自体が存在せず） | 存在チェックで breakAll | `existsByProductCode` false → breakAll | 「商品データが見つからない場合はエラーを返す（現行踏襲）」 |
| コードは存在するが高額条件（公開0＋高額コード）未充足 | breakAll（打ち切り） | no_matching エラーを積むが breakAll せず継続 | 規定なし |
| POST後の応答 | 同一リクエストで twig を直接 render（**リダイレクトしない**） | 常に GET アップロード画面へ **リダイレクト** | 規定なし |
| UI: accept | `text/csv,text/tsv` | `.csv, text/csv, .tsv, text/tsv` | 規定なし（識別ID:1 ファイル選択・ID:2 CSVアップロード） |
| UI: ボタン文言 | 「CSVファイルのアップロード」（固定文字列） | 「CSVファイルをアップロード」（`admin.common.csv_upload` 描画） | 識別ID:2「CSVファイルのアップロード」 |
| UI: JS（ファイル名表示・loading・件数遷移） | 該当JSなし（page_count無し・固定件数 findBy） | custom-file変更→ファイル名表示・submit→changeLoading | 規定なし |
| 履歴表示件数 | 固定件数 `findBy`（page_count セッションなし） | `getCsvImportHistoryPaginationParams`（page_count セッション・既定50） | 識別ID:5 件数セレクタ（10〜12000） |

**判定原則**:
- (a) **Excelがセールフラグ挙動・画面構成を規定** → 当該価格更新セマンティクス（L1-006）と画面構成・フォーマット列（L1-001〜004）は **excel源**でbound。**画面のボタン文言・accept・JSの具体値はSUT=eeの実描画を観測値とする**（Excelは画面部品の存在を規定し、逐語文言はee描画で確定）。
- (b) **pf実ソースとeeで共通の共通インフラ**（行数上限5010＝pf `CSV_IMPORT_MAX`／ee `ADMIN_CSV_IMPORT_MAX_ROWS`・同一キー `admin.csv.error.upload.maxrecord`／必須列・列バリデーション違反→breakAll＝両Baseハンドラ／商品コード不存在→breakAll＝両ハンドラの存在チェック／ヘッダ不正・データ無し→メッセージのみ返却）→ **pf-fallback源**でbound。ただし**pf inline render と ee redirect の食い違い**があるため、期待値は「アップロード画面にフラッシュが表示される」観測レベルに留め、HTTP302/renderの別は**主張しない**。
- (c) **eeのみでExcel/pf規定なし**（商品コード重複→breakAll／同コード並存→重複breakAll／no_matching→継続／page_countセッション）→ **TBD**（pf/ee食い違いでeeをオラクル化しない）。
- **R1 Major1是正**: 母集合-046/-082「両セット並存時はセール側優先→基準のみ更新」は、eeが並存（同コード複数規格）を `isProductCodeUnique` で `breakAll` するため優先処理へ到達せず、Excelも並存時優先を規定しない＝到達不能でオラクル化不可＝**TBD**。L1-006からは「並存時セール側優先」を除去した（Excel-source純度）。Excel規定のセール無効時「基準価格・販売価格の双方を更新」は**C-004でbound**（母集合-036=正常取込成功時に値が変更される、をアンカー）。
- **R1 Major5是正**: eeのサイズ制約は子フィールド `import_file` の `File(maxSize)` に付き、コントローラは `$form->getErrors()`（再帰なし＝Symfony既定 deep=false・ee-ctrl:134）でルートエラーのみをフラッシュへ積む。よってサイズ超過（子フィールドエラー）はフラッシュされず、「サイズ超過→エラーフラッシュ表示」は一意成立せず**bound不成立**（-093はTBD）。
- 成功時フラッシュ**文言**はpf現行（`admin.product.csv_import.save.complete`＝「商品登録CSVファイルをアップロードしました。」pf core message.ja.yml:133）とee（`admin.register.complete`＝「登録が完了しました。」）で食い違うため、成功系の期待は「成功フラッシュ表示＋取込履歴1件増」の観測レベルに留め逐語文言はオラクルに固定しない（documentation-only）。

---

## §1 L1原子オラクル表

全16claim。**source_class列は excel／pf-fallback のみ**（excel5＝L1-001/002/003/004/006・pf-fallback11）。EE-source 0。LS=1（enロケール変異あり・ee messages.en.yaml逐語）＝L1-001（ナビlabel Products/Product CSV Management）・L1-002（csv_upload=Upload a CSV file・required=Required・csv_skeleton_download=Download a template・csv_format=CSV file format）・L1-012（MSG-002 csv_invalid_no_data=No CSV data found）。他はLS=0。

**オラクル記録の被覆状況（正直分類）**: 本表16claimのうち **documentation-only/TBD経由は L1-009（フォーム不正フラッシュはルートエラー限定で純UI一意到達不能）・L1-011（成功フラッシュ文言pf/ee食い違い）・L1-012（MSG-002 純UI到達不能）・L1-013（page_countセッションはee-only）・L1-014（no_matching継続はee-only）・L1-015（商品コード重複/並存breakAllはee-only）・L1-016（ログ観測未整備）の7claim**で、残り9claimは bound候補ケース（C-001〜C-007）が検証する（§8参照）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0332-001 | http_entry | ナビ「商品管理」→「商品CSV管理」→「高額商品価格変更CSVアップロード」からアップロード画面（GET）を開くと、アップロード画面・フォーマット表・取込履歴・雛形リンクが表示される（SUT=eeのルートは `GET /{admin_route}/product/simple_high_price/csv_upload`） | 「M03-32 高額商品価格変更CSVアップロード」「高額商品用に価格変更をCSVにて一括で更新する」 | 0204:目次!C52／0204:高額商品価格変更CSVアップロード!（概要） | excel | 1 |
| L1-M0332-002 | display_field | アップロード画面は共通テンプレート `base_csv_upload.twig` を継承し、識別ID:1「ファイルを選択」ボタン（ファイル入力）・識別ID:2「CSVファイルのアップロード」（＝取込実行）ボタン・識別ID:3 フォーマット説明テーブル・識別ID:4「雛形ファイルダウンロード」ボタン・識別ID:5 件数セレクタ（10/50/100/300/500/1000/2000/10000/12000）・取込履歴テーブル（ファイル名・アップロード日時・作業者）を表示する。SUT=eeでは取込実行ボタンは `admin.common.csv_upload`＝「CSVファイルをアップロード」、ファイル入力の accept は `.csv, text/csv, .tsv, text/tsv`、必須列に「必須」バッジを表示する | 「1 ファイルを選択 ボタン｜2 CSVファイルのアップロード ボタン｜CSVファイルのアップロードと入力チェックを実施｜3 高額商品価格変更CSVファイルフォーマット テーブル｜4 雛形ファイルダウンロード ボタン｜5 件数 単一選択 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」 | 0204:高額商品価格変更CSVアップロード!（識別ID台帳1-5）／ee base_csv_upload.twig:20,74,101 | excel | 1 |
| L1-M0332-003 | display_field | フォーマット表の項目は「商品コード」「基準価格」の2列で、いずれも必須列である（Excel識別ID:3で現行の「販売価格」を「基準価格」へ変更した高額商品価格変更CSVフォーマット。SUT=ee getCsvHeader/getRequiredCsvHeader も 商品コード・基準価格 の2必須列で整合） | 「★識別ID:3 「高額商品価格変更CSVファイルフォーマット」・項目「販売価格」を「基準価格」に変更」 | 0204:高額商品価格変更CSVアップロード!（識別ID:3・カスタマイズ説明） | excel | 0 |
| L1-M0332-004 | display_field | 識別ID:1のファイル選択で、選択したファイル名がファイル入力のラベルに表示される（SUT=eeは custom-file-input 変更時にラベルへファイル名を表示する。pf現行UIには当該JSが無く＝pf/ee食い違いのため観測値はSUT=eeを正） | 「1 ファイルを選択 ボタン｜ボタン押下で、OS標準のファイル選択ウィンドウを表示」 | 0204:高額商品価格変更CSVアップロード!（識別ID:1）／ee base_csv_upload.twig:25-27 | excel | 0 |
| L1-M0332-005 | display_field | 「CSVファイルをアップロード」ボタン押下時に送信前の確認モーダルは表示されない（pf現行・ee=SUTともに base_csv_upload に確認モーダル要素/JSが無く共通） | 「送信前の確認モーダルはない。」 | pf-md:43／pf・ee base_csv_upload.twig（確認モーダル要素なし） | pf-fallback | 0 |
| L1-M0332-006 | data_write | CSVの商品コードから当該商品規格を検索し、登録済みのセールフラグを参照して処理を切り替える。セールフラグが無効(0)のときは基準価格・販売価格の両方をCSVの基準価格に更新する。セールフラグが有効(1)のときは基準価格のみをCSVの基準価格に更新し販売価格は変更せず、セール中商品の販売価格は変更できない旨のアラート（警告フラッシュ）を画面上に表示する | 「対象の商品コードから当該の商品データを検索。現在登録済の商品に設定されている「セールフラグ」を参照して処理を切り替える・セールフラグが「無効(0)」の場合…基準価格を、CSVに設定されている基準価格に更新する・販売価格を、CSVに設定されている基準価格に更新する・セールフラグが「有効(1)」の場合…基準価格を…更新する・販売価格は変更しない、現在登録済の販売価格のまま・セール中商品の販売価格は変更できない旨(アラート)を画面上に表示する」 | 0204:高額商品価格変更CSVアップロード!（機能仕様処理概要・カスタマイズ説明） | excel | 0 |
| L1-M0332-007 | rollback | データ行の列数一致・各列（型・必須）バリデーションに違反したとき（例: 必須列「基準価格」が空）、または商品コードに該当する（高額）商品規格が存在しないとき、当該行で `breakAll` となりトランザクション全体がロールバックされ、DBへは何も書き込まれずエラーフラッシュが表示される。成功フラッシュと取込履歴INSERTは行われない | 「Base ハンドラは列スキーマと物理列の一致および各列のバリデータ必須列を評価して、失敗したらその場で `breakAll` する。…拒否すると当該行でトランザクション全体が中止され、既に読み済みでも反映されずロールバック対象となる。」「基準価格列が論理的には空であっても通過しない｜Symfony 側必須と列バリデータの Required で止まり `breakAll`」／pf「if (!\$this->isProductExists(\$productCode)) { …\$event->breakAll(); }」 | pf-md:85,131／pf-handler:96-100,155-160 | pf-fallback | 0 |
| L1-M0332-008 | message | アップロードCSVの改行ベース概算行数（二重引用符に囲まれた改行を除く）が定数（pf `CSV_IMPORT_MAX`＝5010／ee `ADMIN_CSV_IMPORT_MAX_ROWS`＝5010）以上のとき、キー `admin.csv.error.upload.maxrecord`「%maxRecord% 行を超えるCSVファイルは登録できません。」（%maxRecord%=5010）をエラーフラッシュに載せ、取込を実行せずアップロード画面を再表示する。本キーは messages.en.yaml に不在＝英訳なし | 「戻りが `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら、翻訳キー `admin.csv.error.upload.maxrecord` でエラーを出してリダイレクトのみ行いインポータは起動しない。」／pf「if (\$this->countCsvRows(\$file) >= self::CSV_IMPORT_MAX) { \$app->addError(sprintf(\$app->trans('admin.csv.error.upload.maxrecord'), self::CSV_IMPORT_MAX), 'admin'); }」 | pf-md:67／pf-ctrl:1141,391 | pf-fallback | 0 |
| L1-M0332-009 | http_flow | フォーム送信がSymfonyフォーム検証で妥当でないとき、コントローラは `$form->getErrors()`（再帰なし＝deep=false）でルートレベルのフォームエラー（CSRFトークン不正等）のみを admin エラーフラッシュに積み、取込は実行せずアップロード画面を再表示する。子フィールド `import_file` の制約（NotBlank・File maxSize）エラーはルート反復に含まれずフラッシュされない＝純UIでの一意到達（サイズ超過→エラーフラッシュ）は成立しない（documentation-only） | 「Symfony フォーム検証エラーがある場合、`admin` のエラーフラッシュにそれぞれ積んでリダイレクトだけ行い取込はしない。」／ee「foreach (\$form->getErrors() as \$error) { \$this->addError(\$error->getMessage(), 'admin'); }」 | pf-md:65／ee-ctrl:133-135 | pf-fallback | 0 |
| L1-M0332-010 | message | 正しいヘッダ行のみでヘッダ直後にデータ行が1行も存在しないCSVのとき、インポータは行処理を開始せずメッセージストアにキー `admin.csv.error.data.empty`「CSVデータが存在しません」（英訳なし）だけを積んで返し、それがエラーフラッシュとして表示され取込は行われない。R2 Major2是正: ヘッダ名不一致は前段の format.header ではなく行処理中の列不存在 `admin.csv.error.product.not_exists`＋breakAll（読み取り可能な先頭行はヘッダとして受理される＝データ行を伴う別経路・L1-007側）で、本claim（データ行なし）とは実メッセージが異なるためC-007はデータ行なし単一経路に固定 | 「ヘッダの直後にデータ行が存在しないときはインポータは処理を開始せず、メッセージストアだけ返す。」／ee MessageStore「addDataEmptyError→'admin.csv.error.data.empty'」／ee「読み取り可能な先頭行はヘッダとして受理／列不存在→addColumnNotExistsError='admin.csv.error.product.not_exists'＋breakAll」 | pf-md:77／ee MessageStore.php:148／ee BaseCsvImportHandler.php:86 | pf-fallback | 0 |
| L1-M0332-011 | message | 取込結果にエラーが無いとき、成功フラッシュと取込履歴INSERT（種別ID `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID`＝7・クライアント側ファイル名・作業者ID）と完了ログを行う。成功フラッシュの文言はpf現行（`admin.product.csv_import.save.complete`＝「商品登録CSVファイルをアップロードしました。」）とee（`admin.register.complete`＝「登録が完了しました。」）で食い違うため逐語文言はオラクルに固定しない（documentation-only・観測は「成功フラッシュ表示＋履歴1件増」） | 「エラーが空のときだけ、`admin.register.complete` を成功フラッシュに積む。成功時はさらに…`dtb_csv_import_history` に 1 行追加する処理を呼ぶ。種別 ID は `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID`。」／pf「\$app->addSuccess('admin.product.csv_import.save.complete', 'admin'); …insertCsvImportHistory(...)」 | pf-md:71／pf-ctrl:1155-1160 | pf-fallback | 0 |
| L1-M0332-012 | message | フォームが妥当でも `import_file` が null のとき、キー `admin.common.csv_invalid_no_data`「CSVデータが存在しません」／en「No CSV data found」をエラーフラッシュに載せ取込せず終える設計だが、`import_file` は NotBlank＋サイズ制約のためファイル未選択送信は先行するフォーム不正分岐で終了し当分岐へ到達しない＝純UIでの到達経路は実装のフォーム検証と食い違う（documentation-only） | 「`import_file` が null であれば `admin.common.csv_invalid_no_data` を `admin` エラーフラッシュに載せてリダイレクトして終える。」／en「admin.common.csv_invalid_no_data: No CSV data found」 | pf-md:66／ee messages.en.yaml:1811 | pf-fallback | 1 |
| L1-M0332-013 | session | eeは履歴の表示件数をクエリ `page_count` またはセッションキー `admin.product.simple_high_price_csv.page_count` から解決し既定50で表示するが、pf現行は本画面の履歴を固定件数 `findBy` で描画し page_count セッションを持たない＝page_countセッション保存挙動はee-onlyでpf/ee食い違い（TBD） | 「セッションキーは `admin.product.simple_high_price_csv.page_count` と `…page_no`。」／pf「\$importHistories = \$app[...]->findBy(['csvImportTypeId'=>...], ['createDate'=>'DESC'], self::CSV_IMPORT_HISTORY_LIMIT);」 | pf-md:54／pf-ctrl:1161 | pf-fallback | 0 |
| L1-M0332-014 | skip | CSVの商品コードにマッチはあるが対象の高額条件（商品公開ステータス0かつ高額商品コード設定の規格）を満たさないとき、eeは `no_matching_product_class` エラーを積むが `breakAll` せず後続行の処理を継続する。pf現行は当該行を存在チェックで `breakAll`（打ち切り）する＝継続挙動はee-onlyでpf/ee食い違い（TBD） | 「メッセージストアへのエラー行だけで先へ進む。」（pf-md記述はee挙動）／pf「isProductExists=false → breakAll」（継続しない） | pf-md:98,129／pf-handler:96-100 | pf-fallback | 0 |
| L1-M0332-015 | validation | eeは同一商品コードに該当する商品規格が複数あるとき（＝セール有効/無効が同コードで並存する場合を含む）`isProductCodeUnique` で `breakAll`（重複エラー）する。pf現行ハンドラには明示的な商品コード重複チェックが無い＝重複/並存breakAllはee-onlyでpf/ee食い違い（TBD。母集合-046/-082「並存時セール側優先」はこのbreakAllで到達不能） | 「同一規格コード列で 2 件以上」を拒否して `breakAll` する。」（pf-md記述はee挙動）／ee「if (!\$this->productClassRepository->isProductCodeUnique(\$productCode)) { …addProductCodeDuplicatedError…; \$event->breakAll(); }」 | pf-md:86／ee-handler:163-177 | pf-fallback | 0 |
| L1-M0332-016 | log | POST取込で情報ログ「高額商品価格変更CSV登録開始」を出し、結果がエラーのとき「高額商品価格変更CSV登録 異常終了」、成功のとき「高額商品価格変更CSV登録完了」と件数を出す（documentation-only＝ログ観測手段が現行ハーネスで未整備・TBD） | 「アプリログの info に「高額商品価格変更CSV登録開始」を書く。」「結果にエラー配列がある場合、アプリログ info に「高額商品価格変更CSV登録 異常終了」を書く。」 | pf-md:68,72／pf-ctrl:1146,1152,1156 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとして用意しUI操作でアップロードする（db.ts直接投入と別）。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0332-MASTERS | 取込の前提マスタ | 高額商品コード（high_price_code）を持つ商品規格・セールフラグ・商品公開ステータス 一式 | 不要（参照） |
| SEED-M0332-SALEOFF | セールフラグ無効の高額規格（双方更新検証） | 既存高額商品1件（規格1件・セールフラグ無効(0)・現行 基準価格=P0/販売価格=S0 が既知・商品コード=CC・当該コードに規格は1件のみ） | 対象規格を更新前の値へ復元 |
| SEED-M0332-HISTORY | 取込履歴の表示検証 | dtb_csv_import_history に種別ID 7 の履歴を複数件 | 不要（参照） |
| SEED-M0332-MAXROW | 行数上限（MSG-003）検証 | データ行が改行数5010以上のCSV | 不要（拒否・書込みなし） |
| SEED-M0332-EMPTYDATA | データ行なし検証（正しいヘッダのみ） | 正しいヘッダ行のみでデータ行が1行も無いCSV | 不要（拒否・書込みなし） |
| SEED-M0332-MISSINGREQ | 必須違反ロールバック検証の入力 | 必須列「基準価格」が空の1データ行CSV（商品コードは既存の高額規格に一致・当該コードに規格は1件のみ） | 不要（打ち切り・書込みなし） |

### 取込CSV列（Excel識別ID:3・ee getRequiredCsvHeader）

| 列 | 必須/任意 | 検証 | 備考 |
|---|---|---|---|
| 商品コード | 必須 | 空でないチェック | 規格の product_code に対応（識別ID:3・ee getRequiredCsvHeader） |
| 基準価格 | 必須 | 符号なし数値・整数桁（最大9桁相当） | セールフラグに応じて基準価格（および販売価格）へ反映 |

---

## §3 会計サマリ（母集合97全量・欠番0・重複0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **11** | 7ユニーク候補ケース。B12共有〔完全重複・同一実行のみ〕で母集合11行→tsv7行 |
| **TBD** | **12** | pf/ee食い違い（ee-only挙動＝並存/重複breakAll・no_matching継続・page_countセッション・フォーム不正フラッシュ到達不能）＋ログ観測未整備。§9.1 |
| **excluded** | **74** | 汎用スタブ・矛盾・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)。§9.3 |
| 合計 | **97** | 欠番0・理由なし重複0 |

> 会計: bound 11／TBD 12／excluded 74（=97・欠番0）

- 候補ケース総数 **7**（C-001〜C-007）。bound11件を B12（完全重複・同一実行）でemitすると tsv=ユニーク7。
  - C-001←-073（画面表示）／C-002←-004/-076（ファイル選択ラベル）／C-003←-005/-077（確認モーダルなし）
  - C-004←-036（セール無効時の双方更新＝正常取込成功で値が変更される）／C-005←-023/-095（必須違反→breakAllロールバック）
  - C-006←-019/-091（行数上限MSG-003）／C-007←-094（正しいヘッダのみ・データ行なし→data.empty エラーフラッシュ）

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全候補ケース行を実体掲載・bound 7候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0332C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラー/警告の**フラッシュ**と**取込履歴テーブル**を画面で目視するのが主。(2)取込効果は**対象商品規格を再表示**して価格フィールド照合（無値オラクル禁止）。
  (3)**pf/ee食い違いの回避**: POST後の応答（pf inline render／ee redirect）は食い違うため期待に「アップロード画面にフラッシュが表示される」観測レベルで書きHTTP302/renderの別は主張しない。UI（accept/ボタン文言/JS）はSUT=eeの実描画を観測値とする。(4)DB自動検証は外部IFで検知不能な否定的事実（ロールバック=何も書かれない・C-005/C-006/C-007）に限る。C-004のセール無効双方更新（基準価格・販売価格）はいずれも規格編集画面に表示されるため画面照合のみとしDB確認はしない（B9トートロジー禁止）。
- 操作手順は純UI操作（ファイル選択→「CSVファイルをアップロード」ボタン押下→結果画面／対象商品再表示）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-001	IT-25	画面表示	P1	メニューからGETでアップロード画面が開きフォーマット表・雛形・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0332-HISTORY	—	1. ナビ「商品管理」→「商品CSV管理」→「高額商品価格変更CSVアップロード」から GET でアクセスする 2. アップロード画面が開き、ファイル入力・「CSVファイルをアップロード」ボタン・フォーマット説明表（商品コード・基準価格の2列）・雛形ダウンロードボタン・件数セレクタ・下部の取込履歴テーブルが表示されることを確認	アップロード画面が開き、ファイル入力（accept は .csv, text/csv, .tsv, text/tsv）・取込実行ボタン「CSVファイルをアップロード」・フォーマット説明表（項目「商品コード」「基準価格」の2列でいずれも必須バッジ付き）・「雛形ファイルダウンロード」ボタン・件数セレクタ（10〜12000）・取込履歴テーブル（ファイル名・アップロード日時・作業者）が表示される（enロケールではナビlabel Products/Product CSV Management・ボタンUpload a CSV file・必須Required 等が英語表示） [L1:L1-M0332-001,L1-M0332-002,L1-M0332-003; fixture:SEED-M0332-HISTORY@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-002	IT-20	JS挙動	P2	ファイル選択でラベルにファイル名が表示される	ログイン済／SEED-M0332-SALEOFF	高額商品価格変更CSVファイルを選択（送信はしない）	1. アップロード画面でファイル入力にCSVファイルを選択 2. ラベルに選択ファイル名が表示されることを確認	識別ID:1のファイル選択で、選択したCSVファイル名が custom-file-input のラベルに表示される（SUT=eeの実描画。pf現行UIには当該JSが無いためee挙動を正とする） [L1:L1-M0332-004; fixture:SEED-M0332-SALEOFF@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-003	IT-20	モーダル	P3	「CSVファイルをアップロード」押下時に確認モーダルが表示されない	ログイン済／SEED-M0332-SALEOFF	高額商品価格変更CSVファイル	1. ファイルを選択し「CSVファイルをアップロード」ボタンを押下 2. 送信前に確認モーダルが表示されず送信されることを確認	「CSVファイルをアップロード」ボタン押下時に送信前の確認モーダルは表示されず、そのまま送信される [L1:L1-M0332-005; fixture:SEED-M0332-SALEOFF@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-004	IT-07	セール無効価格更新	P1	セール無効の高額規格は基準価格・販売価格の双方がCSVの基準価格に更新され成功フラッシュと履歴が表示される	ログイン済／SEED-M0332-MASTERS／SEED-M0332-SALEOFF	セールフラグ無効の高額商品（商品コードCC・当該コードに規格1件・現行 基準価格P0/販売価格S0）を対象に基準価格=P1(≠P0)を与える1行CSV	1. セール無効商品の価格変更CSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面に成功フラッシュが表示され取込履歴テーブルに新行が1件増えることを確認 3. 商品編集画面で対象規格を再表示し、基準価格＝P1・販売価格＝P1（いずれもCSVの基準価格）であることを確認	セールフラグ無効(0)の高額規格に対する取込は成功し、成功フラッシュが管理画面上部に表示され取込履歴テーブルに新規1行が増える。商品編集画面で対象規格を再表示すると基準価格（standard_price）＝P1・販売価格（price02）＝P1（いずれもCSVの基準価格に更新・Excel識別ID:3セールフラグ無効の双方更新）となる（基準価格・販売価格はともに規格編集画面に表示されるため画面で照合＝DB二重チェックはしない） [L1:L1-M0332-006,L1-M0332-011; fixture:SEED-M0332-SALEOFF@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-005	IT-25	取込失敗ロールバック	P1	必須列が空の行はbreakAllで打ち切られ何も書き込まれずエラーフラッシュが表示される	ログイン済／SEED-M0332-MASTERS／SEED-M0332-MISSINGREQ	必須列「基準価格」が空の1データ行CSV（商品コードは既存の高額規格に一致・当該コードに規格1件）	1. 基準価格が空のCSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面にエラーフラッシュが表示され成功フラッシュが出ないことを確認 3. 取込履歴テーブルに新行が増えないことを確認	必須列（基準価格）が空の行は列バリデーション違反により breakAll となりトランザクション全体がロールバックされ、アップロード画面にエラーフラッシュが表示され成功フラッシュは出ず、取込履歴テーブルに新行が増えない（DBへは何も書き込まれない） ／ 自動検証(内部・DB): 対象商品規格の価格に変更が無く dtb_csv_import_history が増えない [L1:L1-M0332-007; fixture:SEED-M0332-MISSINGREQ@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-006	IT-12	行数上限	P1	概算行数5010以上のCSVはMSG-003で拒否され取込されない	ログイン済／SEED-M0332-MAXROW	改行数5010以上のCSVファイル	1. 5010行以上のCSVを選択し「CSVファイルをアップロード」を押下 2. エラーフラッシュ表示と取込が行われないことを確認	アップロード画面に「5010 行を超えるCSVファイルは登録できません。」（テンプレートは %maxRecord% 行…で %maxRecord% は上限定数5010に解決・本メッセージは英訳なし＝ja固定）がエラーフラッシュとして表示され、取込は行われない ／ 自動検証(内部・DB): 商品規格の価格・取込履歴とも増減なし [L1:L1-M0332-008; fixture:SEED-M0332-MAXROW@TBD-D5]				
m03-32_admin_product_product_simple_high_price_csv_import	E2E-M0332C-007	IT-22	データ行なし	P2	正しいヘッダのみでデータ行が無いCSVはインポータ前段で拒否されエラーフラッシュが表示される	ログイン済／SEED-M0332-EMPTYDATA	正しいヘッダ行のみでデータ行が1行も無いCSVファイル	1. 正しいヘッダのみでデータ行の無いCSVを選択し「CSVファイルをアップロード」を押下 2. エラーフラッシュ表示と取込が行われないことを確認	正しいヘッダ行のみでヘッダ直後にデータ行が1行も存在しないCSVはインポータが行処理を開始せず、メッセージストアのエラーメッセージ「CSVデータが存在しません」（admin.csv.error.data.empty・英訳なし）がエラーフラッシュとして管理画面上部に表示され取込は行われない ／ 自動検証(内部・DB): 商品規格の価格・取込履歴とも増減なし [L1:L1-M0332-010; fixture:SEED-M0332-EMPTYDATA@TBD-D5]				
```

---

## §5 ja/en locale対応表（ee messages.en.yaml / messages.ja.yaml 逐語・en全キーgrep根拠・R1 Major4是正）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。LS=1のclaimのみen行を持つ。en全キーgrep（テンプレート・履歴・実インポータMessageStoreが使用する全キーを網羅）でヒット/不在を確認済み。

| L1 | キー | ja逐語 | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| L1-001 | admin.product.product_management | 商品管理 | Products | messages.en.yaml:1930 |
| L1-001 | admin.product.product_csv_management | 商品CSV管理 | Product CSV Management | messages.en.yaml:1938 |
| L1-002 | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804（base_csv_upload.twig:74 取込実行ボタン） |
| L1-002 | admin.common.required | 必須 | Required | messages.en.yaml:1785（base_csv_upload.twig:101 必須バッジ） |
| L1-002 | admin.common.csv_skeleton_download | 雛形ファイルダウンロード | Download a template | messages.en.yaml:1805 |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | messages.en.yaml:1806 |
| L1-002 | admin.common.csv_item_name | 項目名（フォーマット表見出し） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:90） |
| L1-002 | admin.common.csv_description | 説明（フォーマット表見出し） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:91） |
| L1-012（MSG-002） | admin.common.csv_invalid_no_data | CSVデータが存在しません | No CSV data found | messages.en.yaml:1811 |
| L1-011（成功・ee側文言・pf食い違い） | admin.register.complete | 登録が完了しました。 | Registration completed. | messages.en.yaml:1676（pfは別キー csv_import.save.complete=「商品登録CSVファイルをアップロードしました。」でen紐付け対象外） |
| L1-002（サブタイトル） | admin.product.simple_high_price_csv | 高額商品価格変更CSVアップロード | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2002） |
| L1-008（MSG-003・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:1626） |
| L1-010 | admin.csv.error.data.empty | CSVデータが存在しません（正しいヘッダのみでデータ行なし） | （英訳なし＝messages.en.yamlに不在） | — （ee MessageStore.php:148） |
| L1-007（参考・ヘッダ名不一致は別経路） | admin.csv.error.product.not_exists | %d 行目の %s ではデータを取得できません（列不存在） | （英訳なし＝messages.en.yamlに不在） | — （ee MessageStore.php:161・BaseCsvImportHandler.php:86 列不存在→breakAll＝L1-007側） |
| L1-007 | admin.csv.error.data.require | %s は必須項目です（必須列違反） | （英訳なし＝messages.en.yamlに不在） | — （ee MessageStore.php:178） |
| L1-006（MSG-004警告） | admin.product.simple_high_price_csv.sell_price_not_updated | %d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません） | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2006） |
| L1-014（MSG-007） | admin.product.simple_high_price_csv.no_matching_product_class | %d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です） | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2007） |

- LS=0のclaim（L1-003〜011,013〜016）はロケール変異なしまたは英訳なし＝`-EN`行を持たない。en全キーgrep結果: `admin.common.csv_upload`・`required`・`csv_skeleton_download`・`csv_format` はen実在（LS=1・L1-002へ復旧）。一方 `admin.product.simple_high_price_csv*`・`admin.csv.error.upload.maxrecord`・`admin.csv.error.data.empty`・`admin.csv.error.product.not_exists`・`*.sell_price_not_updated`・`*.no_matching_product_class` はいずれも messages.en.yaml に**不在**（ヒット0件）＝英訳なしを確認。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（ee `csv_product_simple_high_price.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET /%eccube_admin_route%/product/simple_high_price/csv_upload`・`POST …/product/simple_high_price/import`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。UI（accept/ボタン文言/JS）はSUT=eeの実描画を観測。
- 取込結果の検証はフラッシュメッセージDOM（成功/エラー/警告の集合）＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象商品規格を商品編集で再表示して価格反映確認（B9）。
- db.ts自動検証（内部・DB）は: ロールバック・拒否時の非書込み（C-005/C-006/C-007）に限る。**C-004のセール無効双方更新（基準価格=standard_price／販売価格=price02）はいずれも規格編集画面に表示されるため画面照合のみとしDB二重検証はしない**（R2 Major1・B9トートロジー禁止）。
- **pf/ee食い違いの回避**: POST後応答はpf inline render／ee redirectで食い違うため、期待は「アップロード画面にフラッシュが表示される」観測レベルに留めHTTP302/renderの別をオラクルにしない（§0-A）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・フラッシュ集合差分アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVファイルをアップロード」ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。
2. 取込CSVは fixture（SEED-M0332-*）として用意。C-004はセールフラグ無効のSEED（当該コードに規格1件＝並存でない）で基準価格・販売価格の双方更新を検証。
3. 更新系ケース（C-004）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。C-005〜C-007は拒否/ロールバックで書込みが無いため後始末不要（参照のみ）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003 | Playwright（GUI） | 画面（DOM） | 画面表示・JS・確認モーダル非表示（UIはSUT=ee実描画） |
| C-004 | Playwright（GUI） | 画面（成功フラッシュ・履歴・価格反映） | セール無効の双方更新（基準価格=standard_price／販売価格=price02）はいずれも規格編集画面に表示され画面照合で足りる（R2 Major1でDB二重検証を除去） |
| C-005,C-006,C-007 | Playwright＋DB確認 | 画面（エラーフラッシュ）＋DB | 打ち切り/拒否の否定的事実（何も書かれない）はDB副次 |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: ロールバック/拒否時の非書込み（C-005/C-006/C-007）。取込履歴の増減・C-004のセール無効双方更新（基準価格・販売価格ともに規格編集画面に表示）は画面で目視可能なため主は画面・DB二重チェックはしない（B9トートロジー禁止）。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点はexcluded（Gate B15）。pf/ee食い違いのee-only挙動・純UI到達不能はTBD。

### 観点補正（B8。母集合は不変・1:1・11件＝bound全行）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（11件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | JS挙動（ファイル選択ラベル） | L1-004 |
| -005 | 出力抑止 | モーダル（確認モーダルなし） | L1-005 |
| -019 | 部分入力 | メッセージ/画面遷移（行数上限MSG-003） | L1-008 |
| -023 | 登録内容 | 取込失敗ロールバック（必須違反→breakAll） | L1-007 |
| -036 | 更新内容 | セール無効価格更新（成功時に基準・販売の双方更新） | L1-006 |
| -073 | 初期行数 | 画面表示（GETアップロード画面・フォーマット表・雛形・履歴） | L1-001 |
| -076 | 内部情報 | JS挙動（ファイル選択ラベル） | L1-004 |
| -077 | 排他制御 | モーダル（確認モーダルなし） | L1-005 |
| -091 | フォーム送信 | メッセージ/画面遷移（行数上限MSG-003） | L1-008 |
| -094 | データ行なし | データ行なし（正しいヘッダのみ→data.empty・取込せず） | L1-010 |
| -095 | 公開コンテンツ | 取込失敗ロールバック（必須違反→breakAll） | L1-007 |

### 97対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | csv_product_simple_high_price.twig が base_csv_upload.twig を継承（観点=未認証だが期待はTwig継承＝観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 004 | custom-file-input 変更時にラベルへファイル名を表示（B8: 対象データ→JS挙動） | bound | C-002 |
| 005 | 送信前の確認モーダルはない（B8: 出力抑止→モーダル） | bound | C-003 |
| 006 | show_sale_alert=true を渡すがTwigで参照なく画面説明に効かない（dead変数の内部実装注記・単一の観測可能挙動でない・B15②） | **excluded** | — |
| 007 | 取込パイプラインへ送られ処理後削除される（一時ファイル処理・外部IFで観測不能・B15②） | **excluded** | — |
| 008 | 複数規格コード行が競合→breakAll全中止（商品コード重複breakAllはee-onlyでpf現行ハンドラに無い＝pf/ee食い違い） | **TBD** | — |
| 009 | メッセージストアへのエラー行だけで先へ進む＋前提「コードマッチあるが高額条件満たさない」（no_matching継続はee-onlyでpf現行はbreakAll＝pf/ee食い違い） | **TBD** | — |
| 010 | 必須バリデーションでエラー表示され完了しない（前提「セールフラグ両セット並存」が期待と無関係の汎用ノイズ・B15③） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（観測対象未定義の汎用スタブ） | **excluded** | — |
| 012 | CSVひとつの取込はひとつのトランザクション（トランザクション境界の内部注記・観測可能な単一挙動でない・B15②） | **excluded** | — |
| 013 | 相関バリデーションでエラー表示され完了しない（前提=Doctrine cacheの汎用ノイズ・B15②） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提=失敗時フラッシュの汎用ノイズ） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（汎用スタブ） | **excluded** | — |
| 019 | ADMIN_CSV_IMPORT_MAX_ROWS未満に制限される推定改行カウント＋前提「行数キャップ」（B8: 部分入力→行数上限） | bound | C-006 |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定） | **excluded** | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ） | **excluded** | — |
| 022 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 023 | breakAll になりロールバック＋前提「ヘッダ名・桁・必須違反、商品コード重複、論理削除に近い打ち切り」の必須違反経路（B8: 登録内容→取込失敗ロールバック） | bound | C-005 |
| 024 | 登録内容の対象レコードが追加される（汎用スタブ・前提「高額条件を欠くがコードあった」だが期待汎用） | **excluded** | — |
| 025 | 追加される（汎用スタブ・前提MSG-001） | **excluded** | — |
| 026 | 追加されない（汎用スタブ・前提MSG-002） | **excluded** | — |
| 027 | 追加される（汎用スタブ・前提MSG-003） | **excluded** | — |
| 028 | 追加されない（汎用スタブ・前提MSG-004） | **excluded** | — |
| 029 | 追加される（汎用スタブ・前提MSG-005） | **excluded** | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ・前提MSG-006・本機能は更新であり「追加」と矛盾） | **excluded** | — |
| 031 | エラーを表示し画面遷移＋前提MSG-007（MSG-007=no_matchingはee-only挙動・期待も汎用遷移でC-005/C-007の概念被覆） | **excluded** | — |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提MSG-008） | **excluded** | — |
| 033 | 変更されない（汎用スタブ・前提MSG-009） | **excluded** | — |
| 034 | 変更される（汎用スタブ・前提「取込処理開始直後」） | **excluded** | — |
| 035 | 「高額商品価格変更CSV登録 異常終了」info メッセージ＋前提「CsvImporterエラー状態」（ログ観測手段が未整備で一意固定不能） | **TBD** | — |
| 036 | 更新内容の対象レコードの値が変更される＋前提「hasError偽であった」（＝エラーなく取込成功時に対象規格の価格が変更される。セール無効の双方更新の正常系。B8: 更新内容→セール無効価格更新） | bound | C-004 |
| 037 | 変更される（汎用スタブ・前提「ナビ」） | **excluded** | — |
| 038 | 変更されない（汎用スタブ・前提「履歴プルダウン」） | **excluded** | — |
| 039 | 変更される（汎用スタブ・前提「表示要素」） | **excluded** | — |
| 040 | 変更されない（汎用スタブ・前提「JS挙動」） | **excluded** | — |
| 041 | 変更される（汎用スタブ・前提「モーダル」） | **excluded** | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提「備考」） | **excluded** | — |
| 043 | 取込パイプラインへ送られ処理後削除される（一時ファイル・観測不能・-007と同型） | **excluded** | — |
| 044 | 複数規格コード行が競合→breakAll全中止（-008と同型・重複breakAllはee-only） | **TBD** | — |
| 045 | メッセージストアへのエラー行だけで先へ進む（-009と同型・no_matching継続はee-only） | **TBD** | — |
| 046 | 実装順「セール側を優先」でそのコードは基準のみ更新＋前提「セールフラグ両セット並存」（並存はeeがisProductCodeUniqueでbreakAllし優先処理へ到達せず・Excel未規定＝pf/ee食い違いで到達不能） | **TBD** | — |
| 047 | UIフラッシュにおいて両方載りうる（info/error両立の汎用挙動・具体対象なし・B15②） | **excluded** | — |
| 048 | 削除条件の対象レコードが削除状態にならない（削除は本機能に非該当・B7） | **excluded** | — |
| 049 | 実行結果の対象レコードが削除状態になる（削除は本機能に非該当・B7） | **excluded** | — |
| 050 | hasError偽じゃないとき画面上「登録完了」系文言を出力しない（成功抑止の内部注記・C-005で概念被覆・B15②） | **excluded** | — |
| 051 | 削除状態になる（削除は非該当・B7） | **excluded** | — |
| 052 | フォーム違反・ファイル欠損・行数過多等のエラー列挙（前提=失敗時フラッシュの汎用列挙・具体単一挙動でない） | **excluded** | — |
| 053 | 実行結果のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 054 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 055 | フォーマット定義でエラー表示され完了しない（前提=行数キャップだが期待は汎用「エラー表示完了しない」＝行数上限の具体はC-006が担う） | **excluded** | — |
| 056 | 実行結果のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 057 | 実行結果のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 058 | 出力内容のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 059 | 出力内容のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 060 | 出力内容のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 061 | 出力内容のファイル出力内容が一致（汎用スタブ・前提MSG-001） | **excluded** | — |
| 062 | 出力内容でエラー表示されず継続（汎用スタブ・前提MSG-002） | **excluded** | — |
| 063 | 削除の該当レコードが含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 064 | 移動・リネームの該当レコードが含まれない（非該当・B7） | **excluded** | — |
| 065 | コピーのファイル出力内容が一致（非該当・B7） | **excluded** | — |
| 066 | ファイル登録のファイル出力内容が一致（汎用ファイルスタブ・アップロード成否はC-004/C-005で概念被覆） | **excluded** | — |
| 067 | ファイル出力のファイル出力内容が一致（出力は本機能に非該当・B7） | **excluded** | — |
| 068 | JSONのファイル出力内容が一致（非該当・B7） | **excluded** | — |
| 069 | 同名ファイルのファイル出力内容が一致（非該当・B7） | **excluded** | — |
| 070 | 入力JSONの対象レコードの値が変更されない（JSON非該当・B7） | **excluded** | — |
| 071 | 配置先の該当レコードが含まれる（非該当・B7） | **excluded** | — |
| 072 | スキーマのファイル出力内容が一致（汎用ファイルスタブ・列未指定） | **excluded** | — |
| 073 | アップロード画面・フォーマット表・履歴・雛形リンクが開く（B8: 初期行数→画面表示） | bound | C-001 |
| 074 | 許容リストに含まれれば対応セッションに保存される（page_countセッションはee-onlyでpf現行は固定件数findByでセッション無し＝pf/ee食い違い） | **TBD** | — |
| 075 | 更新抑止のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 076 | custom-file-input 変更時にラベルへファイル名を表示（B8: 内部情報→JS挙動） | bound | C-002 (shared) |
| 077 | 送信前の確認モーダルはない（B8: 排他制御→モーダル） | bound | C-003 (shared) |
| 078 | show_sale_alert=true だが画面説明に効かない（dead変数の内部注記・-006と同型） | **excluded** | — |
| 079 | 取込パイプラインへ送られ処理後削除される（一時ファイル・-007と同型） | **excluded** | — |
| 080 | 複数規格コード行が競合→breakAll全中止（-008と同型・重複breakAllはee-only） | **TBD** | — |
| 081 | メッセージストアへのエラー行だけで先へ進む（-009と同型・no_matching継続はee-only） | **TBD** | — |
| 082 | 実装順「セール側を優先」でそのコードは基準のみ更新（並存はeeがbreakAllし到達せず・-046と同型のpf/ee食い違い） | **TBD** | — |
| 083 | UIフラッシュにおいて両方載りうる（-047と同型の汎用） | **excluded** | — |
| 084 | CSVひとつの取込はひとつのトランザクション（-012と同型の内部注記） | **excluded** | — |
| 085 | Doctrine cache clear() による乖離はクエリログ/再読込に委ねる（実装内部注記・観測手段委譲・B15②） | **excluded** | — |
| 086 | hasError偽じゃないとき「登録完了」系文言を出力しない（-050と同型の内部注記・C-005被覆） | **excluded** | — |
| 087 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 088 | フォーム違反・ファイル欠損・行数過多等のエラー列挙（-052と同型の汎用列挙） | **excluded** | — |
| 089 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 090 | 当機能が行う登録・更新で対象テーブルを直接保存（内部DB注記・汎用・B15②） | **excluded** | — |
| 091 | ADMIN_CSV_IMPORT_MAX_ROWS未満に制限される推定改行カウント＋前提「行数キャップ」（B8: フォーム送信→行数上限） | bound | C-006 (shared) |
| 092 | ファイル選択のファイル出力内容が一致（汎用ファイルスタブ） | **excluded** | — |
| 093 | admin フラッシュを積んだうえアップロード画面へ戻りインポータは開始しない＋前提「フォーム送信がSymfony側で妥当で無い」（フォーム不正フラッシュはルートエラー限定〔deep=false〕でサイズ超過等の子フィールドエラーはフラッシュされず純UI一意到達不能＝R1 Major5） | **TBD** | — |
| 094 | メッセージのみ返る状態でフラッシュ側はエラー扱い＋前提「CSVヘッダ行・データ無しなどインポータ前段」（インポータ前段のデータ行なし＝data.empty単一経路。R2 Major2でヘッダ名不一致〔product.not_exists+breakAll・別経路〕を除き固定。B8: エラー継続→データ行なし） | bound | C-007 |
| 095 | breakAll になりロールバック＋前提「ヘッダ名・桁・必須違反、商品コード重複、論理削除に近い打ち切り」の必須違反経路（B8: 公開コンテンツ→取込失敗ロールバック） | bound | C-005 (shared) |
| 096 | 行エラーだけを積みつつ処理継続＋前提「高額条件を欠くがコードはあった」（no_matching継続はee-only・-009と同型） | **TBD** | — |
| 097 | 母集合期待が「要ソース確認」プレースホルダ（前提MSG-001・出所未確認） | **excluded** | — |

`func_scope_check` 判定: 親97/97会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝12件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い（重複/並存breakAllはee-only） | -008,-044,-046,-080,-082 | 5 | 母集合期待「複数規格コード競合→breakAll全中止」「並存時セール側優先→基準のみ更新」（pf-md:86はee `isProductCodeUnique` breakAllを記述）はpf現行ハンドラに明示的な商品コード重複チェックが無くee刷新で追加された挙動。**-046/-082の「並存時セール側優先」はeeが並存を重複breakAllするため到達不能・Excelも並存時優先を規定せず**（R1 Major1）＝eeオラクル化しない・要仕様確認 |
| pf/ee食い違い（no_matching継続はee-only） | -009,-045,-081,-096 | 4 | 母集合期待「コードマッチあるが高額条件満たさない→エラー行だけで先へ進む/処理継続」（pf-md:98,129はee no_matching継続を記述）はee-only。pf現行は当該行を存在チェックで `breakAll`（打ち切り）しExcelも「見つからない場合はエラーを返す（現行踏襲）」＝pf/ee食い違いでeeオラクル化しない・要仕様確認 |
| pf/ee食い違い（page_countセッションはee-only） | -074 | 1 | 母集合期待「許容リストに含まれれば対応セッションに保存される」（pf-md:54はee `getCsvImportHistoryPaginationParams` を記述）はee-only。pf現行は本画面の履歴を固定件数 `findBy`（pf-ctrl:1161）で描画しpage_countセッションを持たない＝pf/ee食い違い・要仕様確認 |
| 純UI一意到達不能（deep=false子フィールドエラー非フラッシュ・R1 Major5） | -093 | 1 | 母集合期待「フォーム不正→adminフラッシュ積みアップロード画面へ戻りインポータ開始しない」は、eeのサイズ制約が子フィールド `import_file` に付き、コントローラは `$form->getErrors()`（deep=false・ee-ctrl:134）でルートエラーのみをフラッシュするため、サイズ超過等の子フィールドエラーはフラッシュされず「フォーム不正→エラーフラッシュ表示」が純UIで一意成立しない＝要実機（実際にフラッシュされるルートエラー〔CSRF不正等〕の確定要） |
| 実在挙動だがログ観測手段未整備（B15③） | -035 | 1 | 情報ログ「高額商品価格変更CSV登録 異常終了/開始/完了」（pf-md:68,72・pf-ctrl:1146,1152,1156・L1-016）は実在するがログ観測手段が現行ハーネスで未整備＝画面/履歴で検知できず一意固定不能・要実機／ログ観測整備 |

（合計 5+4+1+1+1 = 12）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・5010境界・セール無効SEEDの価格値P0/P1/S0・必須欠落・正しいヘッダのみでデータ行なし） | fixture manifest（D5型）未整備＝要実機（SEED-M0332-*） |
| ヘッダ名不一致の実挙動（読み取り可能な先頭行はヘッダ受理→行処理中の列不存在 `admin.csv.error.product.not_exists`＋breakAll＝L1-007ロールバック側） | ee BaseCsvImportHandler.php:86 で確認済み。母集合に固有一意判定行が無くdocumentation-only（データ行なしのdata.emptyはC-007でbound・別経路） |
| L1-006 セール有効時「基準価格のみ更新＋アラート」（MSG-004） | Excel規定・実挙動だが母集合に非並存のセール有効固有行が無く（-046/-082は並存前提でTBD）documentation-only。セール有効1規格を用いた検証は将来bound可（要SEED・要仕様確認） |
| L1-011 成功フラッシュ文言のpf/ee食い違い（pf「商品登録CSVファイルをアップロードしました。」／ee「登録が完了しました。」） | 期待は観測レベル（成功フラッシュ＋履歴1件増）に留めた。逐語確定は要仕様確認 |
| L1-009/L1-012 フォーム不正・import_file null の純UI到達可否 | ファイル未選択/サイズ超過はNotBlank・子フィールドFile制約で、deep=falseにより一意フラッシュせず＝純UI到達不能・documentation-only |
| L1-解決器・取込結果アサートヘルパ（フラッシュ集合差分）・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |

### 9.3 excluded＝74件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能・C-001被覆）** | -003 | テンプレート継承そのものは外部IFで判定不能。構成要素はC-001が同一操作で被覆 |
| **【B15②】内部実装注記（dead変数・一時ファイル・トランザクション境界・cache・成功抑止・DB直接保存）** | -006,-007,-012,-043,-047,-050,-078,-079,-083,-084,-085,-086,-090 | show_sale_alert未使用・一時ファイル削除・トランザクション境界・Doctrine cache・「登録完了」抑止・対象テーブル直接保存等は外部IFで観測不能な内部処理注記で単一の観測可能挙動でない |
| **【B15②】汎用「登録内容/実行結果/更新内容/出力内容が追加/変更/一致・されない」スタブ** | -001,-002,-011,-013,-014,-015,-016,-017,-018,-020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-037,-038,-039,-040,-041,-042,-053,-054,-055,-056,-057,-058,-059,-060,-061,-062,-072,-075,-087,-089,-092 | 対象レコード・具体列/値を母集合が指定せず内容空虚。取込の成功反映（C-004）・失敗（C-005〜C-007）で概念被覆済みの冗長スタブ。前提MSGは機械割当で期待と無関係 |
| **【B7】ファイル/レコード操作系・削除系（非該当）** | -048,-049,-051,-063,-064,-065,-066,-067,-068,-069,-070,-071 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先。本機能は価格更新取込であり削除・出力・ファイル操作は該当なし |
| **【B15②】info/error両立・失敗フラッシュ列挙・no_matching汎用遷移（被覆済み/汎用）** | -031,-052,-088 | -031=MSG-007(no_matching・ee-only)前提だが期待は汎用遷移でC-005/C-007被覆／-052/-088=失敗時フラッシュの汎用列挙で具体単一挙動でない |
| **【B15③】プレースホルダ** | -097 | 「要ソース確認」（前提MSG-001・出所未確認のプレースホルダ） |

## §10 特記事項（片側断定せず記録・codex Gate C R1 Major5件・R2 Major2件是正反映）

1. **pf/ee食い違いが本機能の核心**: pf現行（HareruyaEc `SimpleHighPriceImportHandler`）は4列（商品コード・販売価格・買取価格・下代）で price02・buy_price・下代を更新しセールフラグ分岐が無い。ee（SUT）は2列（商品コード・基準価格）でセールフラグ分岐を行う。Excel設計はセールフラグ分岐（基準価格中心）を規定しeeが整合。よってセールフラグ価格挙動・画面構成・フォーマット列は**excel源**（L1-001〜004,006）、共通インフラ（行数上限・必須違反breakAll・存在チェックbreakAll・ヘッダ不正）は**pf-fallback源**、ee-only挙動（重複/並存breakAll・no_matching継続・page_countセッション・フォーム不正フラッシュ）は**TBD**とした。
2. **R1 Major1（C-004母集合前提未満足・L1-006過剰主張の是正）**: 母集合-046/-082は「セール有効・無効が同コードで並存」前提だが、eeは並存（同コード複数規格）を `isProductCodeUnique` で breakAll するため「セール側優先→基準のみ更新」へ到達しない。Excelも並存時の優先順位を規定しない。→ L1-006から「並存時はセール側優先」を除去（Excel-source純度）。-046/-082は**TBD**（到達不能）。Excel規定のセール無効時「基準価格・販売価格の双方を更新」を**C-004でbound**（母集合-036＝hasError偽の成功時に対象規格の値が変更される、をアンカー・source=excel L1-006）。セール有効時「基準のみ＋アラート」は非並存のセール有効固有行が母集合に無くdocumentation-only（§9.2）。
3. **R1 Major2（C-005のB12共有条件是正）**: 母集合-023/-095の前提は「ヘッダ名・桁・必須違反、商品コード重複等」。旧草案は入力を「存在しない商品コード」に差し替えていたが、同じ breakAll 結果でも前提・入力が異なればB12共有不可。→ C-005の入力を実前提どおり**必須列（基準価格）が空**（列バリデーション違反→breakAll）に是正（L1-007）。存在しない商品コードは別挙動でありC-005から分離（母集合固有行なくdocumentation-only）。
4. **R1 Major3（UI source_class/ee UI是正）**: 旧草案のボタン文言「CSVファイルのアップロード」はpf現行UIの値で誤り。SUT=eeのボタンは `admin.common.csv_upload`＝「CSVファイルをアップロード」（ee base_csv_upload.twig:74・ja:1744）、accept は `.csv, text/csv, .tsv, text/tsv`（:20）、ファイル名表示・changeLoading JS（:25-30）。→ UI表示・accept・ボタン文言・JSはSUT=ee実装を正とし、accept/ボタンはC-001、ファイル名表示JSはC-002で検証。画面構成（識別ID:1-5）はExcel源（L1-002・1claim1source）。
5. **R1 Major4（en全キーgrep未完了の是正）**: 旧草案はL1-002をLS=0としたが、当claimが使う `admin.common.csv_upload`＝Upload a CSV file(1804)・`required`＝Required(1785)・`csv_skeleton_download`＝Download a template(1805)・`csv_format`＝CSV file format(1806) はen実在＝**LS=1**へ復旧。L1-010も実際のMessageStoreキー `admin.csv.error.format.header`(122)／`admin.csv.error.data.empty`(148)（いずれもen不在＝英訳なし）へ是正。en全キーgrepでヒット/不在を§5に記録。
6. **R1 Major5（C-007サイズ超過フォーム不正の是正）**: eeのサイズ制約は子フィールド `import_file` の `File(maxSize)` に付き、コントローラは `$form->getErrors()`（deep=false・ee-ctrl:134）でルートエラーのみフラッシュする。サイズ超過（子フィールドエラー）はフラッシュされず「サイズ超過→エラーフラッシュ」は一意成立せず**bound不成立**。→ 旧C-007（フォーム不正）を撤回し-093を**TBD**（実際にフラッシュされるルートエラー確定は要実機）。ヘッダ不正（-094）は別のインポータ前段エラー（L1-010）で**bound維持**（新C-007）。
7. **画面遷移・成功文言のpf/ee食い違い**: pf現行POSTは同一リクエストで render（リダイレクトしない・pf-ctrl:1164）、eeは常に redirect（ee-ctrl:197）。成功文言はpf `csv_import.save.complete`（商品登録CSVファイルをアップロードしました。）／ee `register.complete`（登録が完了しました。）。よって期待は観測レベル（アップロード画面にフラッシュ表示・成功時は履歴1件増）に留めHTTP302/render・逐語文言をオラクル化しない。
8. **B12/1実行1判定**: B12共有は完全重複・同一実行（C-002←004/076・C-003←005/077・C-005←023/095・C-006←019/091）に限定。異挙動（データ行なしC-007・行数上限C-006）は別要件のため強制共有しない。
9. **R2 Major1（C-004のB9 DB二重検証除去）**: セール無効の双方更新で確認する基準価格（standard_price）・販売価格（price02）はいずれも**規格編集画面に表示される**ため（ee twig price02/standard_price）、画面照合で十分でありDBの再検証はB9トートロジー禁止に反する。→ C-004のDB内部検証を除去し画面照合のみとした（実行区分もPlaywright＋DB→Playwrightへ）。
10. **R2 Major2（C-007の1実行1判定・ヘッダ名不一致分岐是正）**: 旧C-007は入力・期待が「ヘッダ名不一致またはデータ行なし」の選択式で1実行1判定でなかった。ee実装では読み取り可能な任意の先頭行はヘッダとして受理され（CsvImportService）、**ヘッダ名不一致は前段の format.header ではなく行処理中の列不存在 `admin.csv.error.product.not_exists`＋breakAll**（BaseCsvImportHandler.php:86・MessageStore.php:161）＝L1-007ロールバック側の別経路である。→ C-007を**「正しいヘッダのみ・データ行なし」単一経路**に固定し期待値を `admin.csv.error.data.empty`「CSVデータが存在しません」だけに是正（L1-010）。ヘッダ名不一致（product.not_exists）は母集合に固有一意判定行が無くdocumentation-only（§9.2）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8。
**本正準表のNNN集合は§8観点補正表と完全一致する（11件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | JS挙動 | 期待「custom-file-input変更でラベルにファイル名表示」（L1-004）。母集合ラベル「対象データ」は誤り |
| 005 | モーダル | 期待「送信前の確認モーダルはない」（L1-005）。母集合ラベル「出力抑止」は誤り |
| 019 | メッセージ/画面遷移 | 期待「ADMIN_CSV_IMPORT_MAX_ROWS未満に制限（行数上限）」（L1-008）。母集合ラベル「部分入力」は誤り |
| 023 | 取込失敗ロールバック | 期待「breakAllになりロールバック」（L1-007）。母集合ラベル「登録内容」は誤り |
| 036 | セール無効価格更新 | 期待「hasError偽の成功時に対象規格の値が変更される（基準・販売の双方更新）」（L1-006）。母集合ラベル「更新内容」は誤り |
| 073 | 画面表示 | 期待「アップロード画面・フォーマット表・履歴・雛形リンクが開く」（L1-001）。母集合ラベル「初期行数」は誤り |
| 076 | JS挙動 | 期待「custom-file-input変更でラベルにファイル名表示」（L1-004）。母集合ラベル「内部情報」は誤り |
| 077 | モーダル | 期待「送信前の確認モーダルはない」（L1-005）。母集合ラベル「排他制御」は誤り |
| 091 | メッセージ/画面遷移 | 期待「ADMIN_CSV_IMPORT_MAX_ROWS未満に制限（行数上限）」（L1-008）。母集合ラベル「フォーム送信」は誤り |
| 094 | データ行なし | 期待「メッセージのみ返る状態でフラッシュ側はエラー扱い（正しいヘッダのみ→data.empty）」（L1-010）。母集合ラベル「エラー継続」は誤り |
| 095 | 取込失敗ロールバック | 期待「breakAllになりロールバック」（L1-007）。母集合ラベル「公開コンテンツ」は誤り |
