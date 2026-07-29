# 候補: m03-33 セール用高額商品価格変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合106全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**pf/ee実ソース照合版（2026-07-29）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-32 高額商品価格変更CSV登録**（pf/ee食い違い先行機能）の構造・取込検証設計を踏襲。値・claim・列名・メッセージ・MSG番号はM03-33自身の一次資料（Excel sheet「セール用高額商品価格変更CSVアップロード」／pf-md／pf実ソース／ee実ソース照合）から取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能はTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。観測対象＝**アップロード結果画面（成功／エラー／警告フラッシュ・取込履歴テーブル）＋取込効果（対象商品規格を再表示して販売価格・セールフラグ反映確認）**。
> **★pf/ee食い違いが本機能の核心（M03-32より深い）**: pf現行（HareruyaEcプラグイン `HighPriceImportHandler`）はセールフラグ分岐を持たず販売価格をCSV販売価格で直接上書きし、ee（システムオブテスト `SaleHighPriceImportHandler`）はセールフラグ4分岐を持つ。Excel設計がセールフラグ4分岐を規定しeeが整合する。判定原則を§0-Aに明示。**UI挙動・ボタン文言・成功文言はee(SUT)実装を正とし、pf UIをbindしない**。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet「セール用高額商品価格変更CSVアップロード」（機能No=M03-33・機能名「セール用高額商品価格変更CSV登録」・概要「高額商品のセール用の価格変更をCSVにて一括で更新する」・作成者=城下・作成日2025-06-16・更新者=堀部・更新日2025-09-16）。関連=sheet「セール用高額商品価格変更CSVフォーマット」。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は実Excel座標 `0204:セール用高額商品価格変更CSVアップロード!<セル>` で表記する（HTML行番号は実座標でない＝T2前処理の実座標方針）。
- **pf現行md（source_class=pf-fallbackの参照だが鵜呑み禁止・EE挙動記述あり）**: `functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md`（git hash-object `95507c780621ef949cfdc3e678ebce77c6913a6b`）。**本pf-mdは冒頭で「確認値は EC-CUBE Enterprise を正」と宣言しEE挙動を記述している**（`findHighPriceProductClassForSaleCsv`・`isProductCodeUnique`・`updateProductClassForHighPriceSaleCsv`・4分岐セールフラグ表・常にリダイレクト・種別ID 8・成功キー `admin.register.complete` はいずれもee実装の名称）。pf現行オラクルは下記pf実ソースでfile:line確認する。
- **pf実ソース（pf現行回帰の実体・source_class=pf-fallbackの根拠）**: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvHighPrice`:1025／`csvHighPriceUpload`:1041／`CSV_IMPORT_MAX`=5010:391／`CSV_IMPORT_HISTORY_LIMIT`=100:392／`getHighPriceCsvHeader`:2131）／`.../Service/Csv/Importer/Event/HighPriceImportHandler.php`（pf現行ハンドラ・セールフラグ分岐なし）／`.../Resource/template/admin/Product/csv_high_price.twig`。以下「pf-ctrl:行」「pf-handler:行」。
- **ee実ソース（システムオブテスト・照合とUI/成功文言の正・source_classには不使用）**: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php`（`csv`:78／`import`:117／`getCsvHeader`:199／`getRequiredCsvHeader`:213）／`.../Service/Csv/Importer/Event/SaleHighPriceImportHandler.php`（ee現行ハンドラ・4分岐）／`.../Entity/Master/MtbCsvImportType.php`（`HIGH_PRICE_IMPORT_CSV_ID`=8:35）／`.../Resource/template/admin/Product/csv_product_sale_high_price.twig`／共通 `base_csv_upload.twig`／**enロケール源 `.../Resource/locale/messages.en.yaml`・jaロケール `.../Resource/locale/messages.ja.yaml`**。以下「ee-ctrl:行」「ee-handler:行」。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`・docs repo HEAD `918739abb9f38aeaa15889a05b1090c844deaa72`・branch feat/front-e2e-coverage・2026-07-29観測）の `IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-001..106`（106件・欠番0・重複0）。
- fid_kubun.tsv: `M03-33｜m03-33_admin_product_product_sale_high_price_csv_import｜セール用高額商品価格変更CSV登録｜対象｜カスタマイズ｜pf-eccube3/…｜excel-primary+pf-fallback｜0` → excel優先・不足subjectのみpf回帰・standard-src禁止（暫定付与・確定はD6）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実ソースは挙動照合・UI/ボタン文言/成功文言のSUT正・enロケール源に使い、オラクルの source_class には不使用（EE-source 0）。

### §0-A ★pf/ee食い違いの判定原則（本機能の核心・1claim1source）

pf実ソースとee実ソースは、本機能で**取込ハンドラの列定義・セールフラグ更新セマンティクス・画面遷移・成功文言**が食い違う。

| 観点 | pf現行（実ソース） | ee（システムオブテスト） | Excel設計（正本） |
|---|---|---|---|
| CSV列 | 商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)（6列・買取価格必須・pf-ctrl:2133） | 商品コード・販売価格・セールフラグ・帯URL・タグ(ID)（5列・買取価格列なし・ee-ctrl:199） | 識別ID:3でフォーマット規定（スマレジ連携フラグ追加規定・別シート参照） |
| セールフラグ挙動 | 分岐なし。price02=CSV販売価格で直接上書き（pf-handler:367,382） | 4分岐（現OFF/CSV ON・現ON/CSV ON・現ON/CSV OFF・現OFF/CSV OFF）で新販売価格とセールフラグを決定（ee-handler:122-138） | セールフラグ4分岐を明記（現行機能ベースのカスタマイズ・E85-G114） |
| 買取価格 | CSV買取価格を dtb_product_sub_class.buy_price へ更新（pf-handler:414-443） | 買取価格列を持たず更新しない（ee-handler:140 updateは price02・belt_url・sale_flg のみ） | 各ケースで買取価格をCSV値へ更新すると規定（G91,G97,G104,G112） |
| 商品コード重複 | 明示的重複チェックなし（存在チェックのみ・pf-handler:108） | isProductCodeUnique で breakAll（ee-handler:190） | 規定なし |
| POST後の応答 | 同一リクエストで twig を直接 render（**リダイレクトしない**・pf-ctrl:1087） | 常に GET アップロード画面へ **リダイレクト**（ee-ctrl:193） | 常にリダイレクト（pf-md:70記述はee挙動） |
| 成功文言 | `admin.product.csv_import.save.complete`「商品登録CSVファイルをアップロードしました。」（pf-ctrl:1078） | `admin.register.complete`「登録が完了しました。」（ee-ctrl:175） | 規定なし |
| 履歴表示件数 | 固定件数 `findBy`（`CSV_IMPORT_HISTORY_LIMIT`=100・page_count セッションなし・pf-ctrl:1085） | `getCsvImportHistoryPaginationParams`（page_count セッション・ee-ctrl:83） | 識別ID:5 件数セレクタ（10〜12000） |

**判定原則**:
- (a) **Excelがセールフラグ4分岐を規定**（機能仕様処理概要・E85-G114）→ 当該販売価格/セールフラグ更新セマンティクスは **excel源**でbound（期待値はExcel逐語。ee実装がこれに整合するがオラクルはExcel）。観測はSUT(ee)で真な事実に限る（販売価格 price02・セールフラグ sale_flg の反映・警告フラッシュ）。
- (b) **pf実ソースとeeで共通の共通インフラ**（行数上限5010＝pf `CSV_IMPORT_MAX`／ee `ADMIN_CSV_IMPORT_MAX_ROWS`・同一キー `admin.csv.error.upload.maxrecord`／フォーム不正のルートエラー→エラーフラッシュ・取込せず／高額規格（`high_price_code`設定・非空）の存在チェックbreakAll＝両ハンドラの存在検証／成功時の取込履歴INSERT機構）→ **pf-fallback源**でbound。ただし**pf inline render と ee redirect の食い違い**があるため、期待値は「アップロード画面にフラッシュが表示される」観測レベルに留め、HTTP302/renderの別は**主張しない**（食い違うため一意でない）。
- (b') **フォーム不正のフラッシュ可否は「ルートエラーのみ」（SUT=ee基準）**（R1 Major1・R2 Major1是正）: eeコントローラは `$form->getErrors()` を再帰なし（deep=false 既定）で取得しadminフラッシュに積む（ee-ctrl:126）。CSRFトークン不正はルートフォームのエラーでフラッシュされ**bound可**。一方アップロードサイズ上限は子フィールド `import_file` の `Assert\File(maxSize)` 制約（CsvImportType.php:54）で、ee の `getErrors(deep=false)` はこの子エラーを含まずフラッシュへ積まれない＝サイズ超過はフラッシュ必発でなく**bound不成立→TBD**（実際に出る文言確定は要実機）。**pf現行は `getErrors(true)`＝deep=true（pf-ctrl:1053）で子エラーも積む食い違い**があるが、SUTはeeのため観測はee基準（サイズ超過非フラッシュ）とする。よってL1-011の共通claim（pf-fallback）はルートエラー（CSRF等）のフラッシュに限り、サイズ超過はオラクル化しない。
- (c) **UI挙動・ボタン文言・成功文言はee(SUT)の観測値を正**とする（ボタン文言「CSVファイルをアップロード」＝`admin.common.csv_upload`・成功フラッシュ「登録が完了しました。」＝`admin.register.complete`）。pf現行のinline render・pf成功文言はSUTでないためbindしない。source_classは共通機構をpf-fallbackとし、SUT観測の逐語文言は§5に紐付ける。
- (d) **Excel規定だがSUT(ee)に無い挙動**（買取価格をCSV値で更新・スマレジ連携フラグ列）→ pf現行は買取価格を更新するがee(SUT)は買取価格列を持たず更新しない＝Excel/pf vs ee食い違い＝**documentation-only**（母集合に固有一意判定行が無く、SUTで真でない挙動はboundにしない）。
- (e) **eeのみでExcel/pf規定なし**（商品コード重複→breakAll／page_countセッション）→ **TBD**（pf/ee食い違いでeeをオラクル化しない）。

---

## §1 L1原子オラクル表

全20claim。**source_class列は excel／pf-fallback のみ**（excel5＝L1-006/007/008/013/020・pf-fallback15）。EE-source 0。LS=1（enロケール変異あり・ee messages.en.yaml逐語）＝L1-001（ナビlabel Products/Product CSV Management）・L1-002（アップロード/雛形/フォーマット/必須のボタン系ラベル）・L1-012（成功文言 register.complete=Registration completed.）・L1-018（MSG-002 csv_invalid_format=Unmatched CSV format）の4claim。他はLS=0（高額固有キー・maxrecord・アラート・page_countセッション・挙動claimは英訳なしまたは非メッセージ）。

**オラクル記録の被覆状況（正直分類）**: 本表20claimのうち **documentation-only/TBD経由は L1-003（CSV列pf6/ee5食い違い）・L1-009（存在breakAll＝唯一の母集合行-010が公開規格前提でbound不能・R1 Major2）・L1-013（買取価格更新のExcel/pf vs ee食い違い）・L1-014（帯URL/タグ更新）・L1-015（価格履歴条件）・L1-016（商品コード重複breakAllはee-only）・L1-017（page_countセッションはee-only）・L1-018（MSG-002純UI到達不能）・L1-019（取込開始/異常終了/完了ログ観測未整備）・L1-020（スマレジ連携フラグ列はExcel規定だが両実装に無い）の10claim**で、残り10claim（L1-001/002/004/005/006/007/008/010/011/012）は bound候補ケースが検証する（§8参照）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0333-001 | http_entry | ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロード」から `GET /{admin_route}/product/sale_high_price/csv_upload` を開くと、アップロード画面・フォーマット表・取込履歴・雛形リンクが表示される | 「ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロード」｜`GET /{admin_route}/product/sale_high_price/csv_upload`｜アップロード画面が開き、フォーマット表・履歴・雛形リンクが表示される。」 | pf-md:30 | pf-fallback | 1 |
| L1-M0333-002 | display_field | `csv_product_sale_high_price.twig` は共通テンプレート `base_csv_upload.twig` を継承し、サブタイトル「セール用高額商品価格変更CSVアップロード」・カード内にファイル入力とアップロードボタン（SUT(ee)のボタン文言は `admin.common.csv_upload`＝「CSVファイルをアップロード」）・フォーマット説明表（必須列にバッジ `admin.common.required`）・雛形ダウンロードボタン（`admin.common.csv_skeleton_download`）・下部に取込履歴テーブル（ファイル名・アップロード日時・作業者）を表示する。ファイル入力の accept は `.csv, text/csv, .tsv, text/tsv` | 「`@admin/Product/csv_product_sale_high_price.twig` は `@admin/Product/base_csv_upload.twig` を継承する。…ファイル入力は `accept=".csv, text/csv, .tsv, text/tsv"`。…下部に取込履歴（ファイル名・アップロード日時・作業者）。」／ee twig「`{{ 'admin.common.csv_upload'|trans }}`」 | pf-md:43／ee-ctrl:97 | pf-fallback | 1 |
| L1-M0333-003 | display_field | 取込CSVの列定義は pf現行が6列（商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)）、ee(SUT)が5列（商品コード・販売価格・セールフラグ・帯URL・タグ(ID)）で、買取価格列は pf現行のみ存在しee(SUT)は持たない＝pf/ee食い違い（documentation-only）。ee(SUT)の必須列は商品コード・販売価格・セールフラグの3列 | 「'商品コード'=>...'販売価格'=>...'買取価格'=>...'セールフラグ'=>...'帯URL'=>...'タグ(ID)'=>...（pf 6列）」／「'商品コード'・'販売価格'・'セールフラグ'・'帯URL'・'タグ(ID)'（ee 5列）」 | pf-ctrl:2133／ee-ctrl:199,213 | pf-fallback | 0 |
| L1-M0333-004 | display_field | ファイル選択で `custom-file-input` 変更時にラベルにファイル名を表示する。フォーム送信で `$.changeLoading(true)` を呼ぶ。履歴件数プルダウン変更で `window.location.href` を差し替える | 「ファイル選択でラベルへファイル名を表示する。フォーム送信時に `$.changeLoading(true)` を呼ぶ。履歴件数プルダウン変更で `window.location.href` を差し替える。」 | pf-md:44 | pf-fallback | 0 |
| L1-M0333-005 | display_field | 「CSVファイルをアップロード」ボタン押下時に送信前の確認ダイアログ/モーダルは表示されない | 「送信前の確認ダイアログはない。」 | pf-md:46 | pf-fallback | 0 |
| L1-M0333-006 | data_write | CSVの商品コードから当該（高額＝`high_price_code`設定・非空）商品規格を検索し、現在登録済のセールフラグとCSVのセールフラグを突き合わせて処理を切り替える。これは相異なる2分岐で、(case1)現在セールフラグが無効(0)でCSVが有効(1)のとき（通常→セール切替）と、(case2)現在セールフラグが有効(1)でCSVが有効(1)のとき（セール中のまま更新）は、いずれも販売価格をCSVに設定された販売価格に更新しセールフラグを有効(1)にする。基準価格は更新しない（ee-handler:122がcase1・:125がcase2の別分岐） | 「現在登録済のセールフラグが「無効(0)」・CSVが「有効(1)」の場合、通常商品→セール商品へ切替、セールフラグを「無効(0)」→「有効(1)」、販売価格を、CSVに設定されている販売価格に更新する、基準価格は更新しない」「現在登録済が「有効(1)」・CSVが「有効(1)」の場合、販売価格を、CSVに設定されている販売価格に更新する、セールフラグは「有効(1)」のまま」 | 0204:セール用高額商品価格変更CSVアップロード!G87,G89,G96,G98 | excel | 0 |
| L1-M0333-007 | data_write | 現在登録済のセールフラグが有効(1)でCSVが無効(0)のとき（セール→通常切替）、セールフラグを無効(0)に切り替え、販売価格を現在登録済の基準価格からコピーし、CSVに設定された販売価格は無視する。CSVに販売価格・買取価格が設定されている場合はCSVの価格は反映されていない旨のアラート（警告フラッシュ）を画面上に表示する | 「現在登録済が「有効(1)」・CSVが「無効(0)」の場合、セール商品→通常商品へ切替、セールフラグを「有効(1)」→「無効(0)」、販売価格を、現在登録済の基準価格からコピーする、CSVに設定されている販売価格は無視する、CSVに販売価格、買取価格が設定されている場合は、CSVの価格は反映されていない旨(アラート)を画面上に表示する」 | 0204:セール用高額商品価格変更CSVアップロード!G101,G102,G103,G105,G106 | excel | 0 |
| L1-M0333-008 | data_write | 現在登録済のセールフラグが無効(0)でCSVが無効(0)のとき（通常商品のまま）、販売価格は更新せず現在登録済の販売価格のままとし、セールフラグは無効(0)のまま、基準価格も更新しない。通常商品の販売価格は変更できない旨のアラート（警告フラッシュ）を画面上に表示する | 「現在登録済が「無効(0)」・CSVが「無効(0)」の場合、販売価格は更新しない、現在登録済の販売価格のまま、セールフラグは「無効(0)」のまま、基準価格は更新しない、通常商品の販売価格、買取価格は変更できない旨(アラート)を画面上に表示する」 | 0204:セール用高額商品価格変更CSVアップロード!G110,G111,G113,G114 | excel | 0 |
| L1-M0333-009 | rollback | CSVの商品コードに該当する高額規格（商品コード一致かつ `high_price_code` が非NULL の規格）が存在しないとき、当該行で `breakAll` となりトランザクション全体がロールバックされ、DBへは何も書き込まれずエラーフラッシュが表示される。成功フラッシュと取込履歴INSERTは行われない。「商品コード一致かつ `high_price_code` 非NULL の規格が不存在→breakAll」が pf・ee 共通の条件である。R1/R2 Major是正: pf・eeとも**公開状態を検査しない**ため対象条件に「非公開」を含めない。枝は完全同一ではなく、ee は加えて `high_price_code <> ''`（空文字も不存在扱い）を課し ProductClass 起点（v4統合）で検索、pf は空文字を検査せず商品・規格の `del_flg` を条件に含み dtb_product_sub_class 起点（v3）で検索する（共通条件を超える部分はオラクル化しない）。母集合-010は前提「規格が公開のまま→不存在扱い」がpf・ee実装と食い違い一意判定できず＝documentation-only（-010 TBD） | ee検索「->where('pc.code = :productCode')->andWhere('pc.high_price_code IS NOT NULL')->andWhere('pc.high_price_code <> :emptyHighPriceCode')」／pf検索「pc.product_code = :productCode AND pc.del_flg = :delFlg AND p.del_flg = :delFlg AND psc.high_price_code IS NOT NULL」 | ee-repo:2233／pf-handler:190 | pf-fallback | 0 |
| L1-M0333-010 | message | アップロードCSVの改行ベース概算行数（二重引用符に囲まれた改行を除く）が定数（pf `CSV_IMPORT_MAX`＝5010／ee `ADMIN_CSV_IMPORT_MAX_ROWS`＝5010）以上のとき、キー `admin.csv.error.upload.maxrecord`「%maxRecord% 行を超えるCSVファイルは登録できません。」（%maxRecord%=5010）をエラーフラッシュに載せ、取込を実行せずアップロード画面を再表示する。本キーは messages.en.yaml に不在＝英訳なし | 「その件数が抽象コントローラ定数 `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`（パラメータに当該上限）を `admin` フラッシュに積み、リダイレクトする。取込本体は開始しない。」／pf「if (\$this->countCsvRows(\$file) >= self::CSV_IMPORT_MAX) { \$app->addError(sprintf(\$app->trans('admin.csv.error.upload.maxrecord'), self::CSV_IMPORT_MAX), 'admin'); }」 | pf-md:65／pf-ctrl:1064,391／ee-ctrl:141 | pf-fallback | 0 |
| L1-M0333-011 | http_flow | フォーム送信がSymfonyフォーム検証で妥当でないとき、コントローラはルートフォームのエラー（CSRFトークン不正等）を admin エラーフラッシュに積み、取込は実行せずアップロード画面が再表示される。ee(SUT)は `getErrors()` を再帰なし（deep=false 既定・ee-ctrl:126）で取得するためフラッシュされるのはルートフォームのエラーに限られる。pf現行は同一リクエストで render・eeは redirect と食い違うため観測は「アップロード画面にルートフォームのエラーフラッシュが表示される」レベルに留めHTTP302/renderの別は主張しない（子フィールド制約エラーの扱いは§0-A(b')・§9.2） | ee「if (!\$form->isValid()) { foreach (\$form->getErrors() as \$error) { \$this->addError(\$error->getMessage(), 'admin'); } return redirect; }」 | pf-ctrl:1052／ee-ctrl:125,126 | pf-fallback | 0 |
| L1-M0333-012 | message | 取込結果にエラーが無いとき、成功フラッシュを表示し取込履歴（`dtb_csv_import_history`）へ1行INSERT（種別ID `HIGH_PRICE_IMPORT_CSV_ID`＝8・クライアント側ファイル名・作業者ID）と完了ログを行う。成功フラッシュの表示文言はSUT(ee)実装を正とし `admin.register.complete`「登録が完了しました。」／en「Registration completed.」を観測する（pf現行は `admin.product.csv_import.save.complete`「商品登録CSVファイルをアップロードしました。」で文言食い違い＝pf成功文言はbindしない） | 「成功時はキー `admin.register.complete` を `admin` 成功フラッシュに積み、…`dtb_csv_import_history` へ 1 行 INSERT する（種別 ID は `HIGH_PRICE_IMPORT_CSV_ID`）。」／ee「\$this->addSuccess('admin.register.complete', 'admin'); …insertCsvImportHistory(MtbCsvImportType::HIGH_PRICE_IMPORT_CSV_ID, …)」／en「admin.register.complete: Registration completed.」 | pf-md:69／pf-ctrl:1078／ee-ctrl:175,178 | pf-fallback | 1 |
| L1-M0333-013 | data_write | 買取価格は、Excel設計では全ケースでCSVに設定された買取価格に更新すると規定され、pf現行は `dtb_product_sub_class.buy_price` を更新するが、ee(SUT)は買取価格列を取込CSVに持たず買取価格を更新しない＝Excel/pf vs ee食い違い（documentation-only・母集合に買取価格を固有一意判定する要求行が無い） | 「買取価格を、CSVに設定されている買取価格に更新する」／ee updateは price02・belt_url・sale_flg のみ（買取価格を引数に取らない） | 0204:セール用高額商品価格変更CSVアップロード!G91,G97,G104,G112 | excel | 0 |
| L1-M0333-014 | data_write | 取込では規格の帯URL（空のときnull）を更新し、商品に紐付くタグ(ID)をCSVの「タグ(ID)」で置換する（pf・eeとも共通挙動・documentation-only＝母集合に帯URL/タグを固有一意判定する要求行が無い） | 「規格 ID 単位で SQL の UPDATE を発行し、`price02`・`belt_url`・`sale_flg`…を上書きする。」「商品に紐付くタグ ID リストを CSV の「タグ(ID)」から解釈し、`dtb_product` 単位でタグを置換する」 | pf-md:92,94／pf-handler:263／ee-handler:101,116 | pf-fallback | 0 |
| L1-M0333-015 | data_write | 変更前後で販売価格（および買取価格）に変化があるときだけ価格履歴（`dtb_price_history`）を1行追加する。本取込は基準価格を更新しないため履歴に渡す新基準は常に変更前基準と同値である（pf・eeとも変化時のみ追加・documentation-only＝母集合に価格履歴増分を固有一意判定する要求行が無い） | 「変更前後で販売・買取・基準のいずれも変化がなければ履歴行は増えない。本取込は基準価格を更新しないため、履歴に渡す「新基準」は常に変更前基準と同値」 | pf-md:152／pf-handler:453／ee-handler:148 | pf-fallback | 0 |
| L1-M0333-016 | validation | ee(SUT)は同一商品コードに該当する商品規格が複数（2件以上）あるとき `isProductCodeUnique` で `breakAll`（重複エラー）する。pf現行ハンドラには明示的な商品コード重複チェックが無い＝重複breakAllはee-onlyでpf/ee食い違い（TBD） | 「商品コードが `dtb_product_class` 上で 2 件以上に重複している場合はエラーを積み `breakAll` する（1 件以下のみ通過）。」／ee「if (!\$this->productClassRepository->isProductCodeUnique(\$productCode)) { …addProductCodeDuplicatedError…; return false; }」／pf-handler は存在チェックのみで重複チェックなし | pf-md:85／ee-handler:190 | pf-fallback | 0 |
| L1-M0333-017 | session | ee(SUT)は履歴の表示件数をクエリ `page_count` またはセッションキー `admin.product.sale_high_price_csv.page_count` から解決するが、pf現行は本画面の履歴を固定件数 `findBy`（`CSV_IMPORT_HISTORY_LIMIT`＝100）で描画し page_count セッションを持たない＝page_countセッション保存挙動はee-onlyでpf/ee食い違い（TBD） | 「クエリ `page_count` が許容リストに含まれる場合のみセッションキー `admin.product.sale_high_price_csv.page_count` に保存する。」／pf「\$importHistories = \$app[...]->findBy(['csvImportTypeId'=>...], ['createDate'=>'DESC'], self::CSV_IMPORT_HISTORY_LIMIT);」 | pf-md:56／pf-ctrl:1085／ee-ctrl:83 | pf-fallback | 0 |
| L1-M0333-018 | message | フォームが妥当でも `import_file` が null のとき、キー `admin.common.csv_invalid_format`「CSVのフォーマットが一致しません」／en「Unmatched CSV format」をエラーフラッシュに載せ取込せず終える設計だが、`import_file` は NotBlank＋サイズ制約のためファイル未選択送信は先行するフォーム不正分岐で終了し当分岐へ到達しない＝純UIでの到達経路は実装のフォーム検証と食い違う（documentation-only／MSG-002） | 「`import_file` が null ならキー `admin.common.csv_invalid_format` を `admin` フラッシュに積み、同じくリダイレクトする。」／en「admin.common.csv_invalid_format: Unmatched CSV format」 | pf-md:64／ee-ctrl:135 | pf-fallback | 1 |
| L1-M0333-019 | log | POST取込で情報ログ「セール用高額商品価格変更CSV登録開始」を出し、結果がエラーのとき「セール用高額商品価格変更CSV登録 異常終了」、成功のとき「セール用高額商品価格変更CSV登録完了」と件数を出す（documentation-only＝ログ観測手段が現行ハーネスで未整備・TBD） | 「情報ログに「セール用高額商品価格変更CSV登録開始」を書く。」「戻り値にエラーがあれば情報ログに「セール用高額商品価格変更CSV登録 異常終了」を書き…」 | pf-md:66,68／pf-ctrl:1070,1076,1079／ee-ctrl:147,170,176 | pf-fallback | 0 |
| L1-M0333-020 | data_write | スマレジ連携フラグ列は Excel識別ID:3 で追加を規定するが、pf現行ハンドラ（6列）にもee(SUT)ハンドラ（5列）にもスマレジ連携フラグの取込列は存在せず、取込では反映されない＝設計と実装の食い違い（documentation-only） | 「★識別ID:3 「高額商品価格変更CSVファイルフォーマット」・項目「スマレジ連携フラグ」を追加」 | 0204:セール用高額商品価格変更CSVアップロード!E79 | excel | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとして用意しUI操作でアップロードする（db.ts直接投入と別）。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0333-MASTERS | 取込の前提マスタ | 高額商品コード（`high_price_code` 設定・非空）を持つ商品規格・セールフラグ・基準価格 一式（公開状態は検索条件に無いため不問） | 不要（参照） |
| SEED-M0333-SALEOFF-CSVON | 現OFF→CSV ON（case1）検証 | 既存高額規格1件（セールフラグ無効(0)・現行 基準価格=P0/販売価格=S0 が既知・商品コード=CC1）＋CSV: 販売価格=X1・セールフラグ=1 | 対象規格を更新前の値へ復元 |
| SEED-M0333-SALEON-CSVON | 現ON→CSV ON（case2）検証 | 既存高額規格1件（セールフラグ有効(1)・現行 基準価格=P0/販売価格=S0 が既知・商品コード=CC2）＋CSV: 販売価格=X2(≠S0)・セールフラグ=1 | 対象規格を更新前の値へ復元 |
| SEED-M0333-SALEON-CSVOFF | 現ON→CSV OFF（case3）検証 | 既存高額規格1件（セールフラグ有効(1)・現行 基準価格=P0/販売価格=S0 が既知・商品コード=CC3）＋CSV: 販売価格=X3(非0)・セールフラグ=0 | 対象規格を更新前の値へ復元 |
| SEED-M0333-SALEOFF-CSVOFF | 現OFF→CSV OFF（case4）検証 | 既存高額規格1件（セールフラグ無効(0)・現行 販売価格(price02)=S0 が既知・商品コード=CC4）＋CSV: 販売価格=X4(≠S0)・セールフラグ=0 | 対象規格を更新前の値へ復元 |
| SEED-M0333-MAXROW | 行数上限（MSG-003）検証 | データ行が改行数5010以上のCSV | 不要（拒否・書込みなし） |
| SEED-M0333-BADCSRF | フォーム不正（CSRFトークン不正＝ルートエラー）検証 | CSRFトークンが不正な送信（サイズ超過は子フィールドエラーでフラッシュされずbound不成立＝§9.1 TBD・本SEEDには含めない） | 不要（拒否・書込みなし） |
| SEED-M0333-HISTORY | 取込履歴の表示検証 | dtb_csv_import_history に種別ID 8 の履歴を複数件 | 不要（参照） |

### 取込CSV列（SUT(ee)・5列）

| 列 | 必須/任意 | 検証 | 備考 |
|---|---|---|---|
| 商品コード | 必須 | 空でないチェック | 高額規格（`high_price_code`設定・非空）を一意に特定するキー（公開状態は非検査・2件以上一致で重複breakAll＝ee-only・§9.1） |
| 販売価格 | 必須 | 符号なし数値・整数桁（最大9桁相当） | セールフラグ分岐に応じて price02 の新値決定 |
| セールフラグ | 必須 | 0 か 1 のみ | 現在登録済セールフラグと突き合わせて分岐 |
| 帯URL | 任意 | 文字列（空でnull） | dtb_product_class.belt_url |
| タグ(ID) | 任意 | カンマ区切り非負整数・マスタ存在 | 商品タグ置換 |

（pf現行は上記に加え「買取価格」必須列を持つ6列＝L1-003・§9.1。買取価格の反映はee(SUT)に無いためboundしない。）

---

## §3 会計サマリ（母集合106全量・欠番0・重複0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **15** | 9ユニーク候補ケース。B12共有〔完全重複・同一実行のみ〕で母集合15行→tsv9行 |
| **TBD** | **8** | pf/ee食い違い（ee-only挙動＝重複breakAll・page_countセッション）＋存在breakAllの公開規格前提食い違い＋MSG-002純UI到達不能＋ログ観測未整備。§9.1 |
| **excluded** | **83** | 汎用スタブ・矛盾・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・共通認証。§9.3 |
| 合計 | **106** | 欠番0・理由なし重複0 |

> 会計: bound 15／TBD 8／excluded 83（=106・欠番0）

- 候補ケース総数 **9**（C-001〜C-006・C-008〜C-010。C-007は R1 Major2でTBD化した-010の唯一の母集合行を失い廃止＝欠番）。bound15件を B12（完全重複・同一実行）でemitすると tsv=ユニーク9。
  - C-001←-103（画面表示）／C-002←-004/-106（ファイル選択ラベル）／C-003←-005（確認モーダルなし）
  - C-004←-009（セール価格更新case1・case2＝現OFF/CSV ONと現ON/CSV ONの両分岐を1候補内2アップロードで各々販売価格CSV値・セールフラグONを判定・R1 Major3是正）／C-005←-096（セール価格更新case3＝販売価格基準価格・警告アラート）／C-006←-012（セール価格更新case4＝販売価格維持・警告アラート）
  - C-008←-061/-095（行数上限MSG-003）／C-009←-090/-007/-041（フォーム不正＝CSRFトークン不正のルートエラー→エラーフラッシュ・R1 Major1でサイズ超過除外）／C-010←-049/-083/-089（取込成功→成功フラッシュ＋取込履歴1件増）

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全候補ケース行を実体掲載・bound 10候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0333C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラー/警告の**フラッシュ**と**取込履歴テーブル**を画面で目視するのが主。(2)取込効果は**対象商品規格を再表示**して販売価格・セールフラグの反映照合（無値オラクル禁止）。
  (3)**pf/ee食い違いの回避**: POST後の応答（pf inline render／ee redirect）は食い違うため期待に「アップロード画面にフラッシュが表示される」観測レベルで書きHTTP302/renderの別は主張しない。(4)DB自動検証は外部IFで検知不能な否定的事実（ロールバック=何も書かれない・販売価格非更新）に限る。
- 操作手順は純UI操作（ファイル選択→「CSVファイルをアップロード」ボタン押下→結果画面／対象商品規格再表示）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-001	IT-25	画面表示	P1	メニューからGETでアップロード画面が開きフォーマット表・雛形・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0333-HISTORY	—	1. ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロード」から GET でアクセスする 2. アップロード画面が開き、ファイル入力・「CSVファイルをアップロード」ボタン・フォーマット説明表・雛形ダウンロードボタン・下部の取込履歴テーブルが表示されることを確認	GET /%eccube_admin_route%/product/sale_high_price/csv_upload を開くとアップロード画面が開き、サブタイトル「セール用高額商品価格変更CSVアップロード」・ファイル入力と「CSVファイルをアップロード」ボタン・フォーマット説明表（必須列にバッジ）・雛形ダウンロードボタン・取込履歴テーブル（ファイル名・アップロード日時・作業者）が表示される（enロケールではナビlabel Products/Product CSV Management・ボタン Upload a CSV file が英語表示） [L1:L1-M0333-001,L1-M0333-002; fixture:SEED-M0333-HISTORY@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-002	IT-20	JS挙動	P2	ファイル選択でラベルにファイル名が表示される	ログイン済／SEED-M0333-SALEOFF-CSVON	高額商品価格変更CSVファイルを選択（送信はしない）	1. アップロード画面でファイル入力にCSVファイルを選択 2. ラベルに選択ファイル名が表示されることを確認	ファイル選択で custom-file-input のラベルに選択したCSVファイル名が表示される [L1:L1-M0333-004; fixture:SEED-M0333-SALEOFF-CSVON@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-003	IT-20	モーダル	P3	「CSVファイルをアップロード」押下時に確認モーダルが表示されない	ログイン済／SEED-M0333-SALEOFF-CSVON	高額商品価格変更CSVファイル	1. ファイルを選択し「CSVファイルをアップロード」ボタンを押下 2. 送信前に確認モーダルが表示されず送信されることを確認	「CSVファイルをアップロード」ボタン押下時に送信前の確認ダイアログ/モーダルは表示されず、そのまま送信される [L1:L1-M0333-005; fixture:SEED-M0333-SALEOFF-CSVON@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-004	IT-06	セール価格更新	P1	CSVセールフラグONの取込で現OFF規格・現ON規格の双方が販売価格CSV値・セールフラグONに更新される	ログイン済／SEED-M0333-MASTERS／SEED-M0333-SALEOFF-CSVON／SEED-M0333-SALEON-CSVON	(A)現在セールフラグ無効(0)の高額規格（商品コードCC1・現行 販売価格S0）に 販売価格=X1・セールフラグ=1 を与える1行CSV、(B)現在セールフラグ有効(1)の高額規格（商品コードCC2・現行 販売価格S0）に 販売価格=X2・セールフラグ=1 を与える1行CSV	1. (A)現OFF規格のCSVを選択し「CSVファイルをアップロード」を押下→成功フラッシュを確認し商品編集画面で対象規格を再表示し販売価格＝X1・セールフラグ＝有効(ON)を確認 2. (B)現ON規格のCSVを選択し「CSVファイルをアップロード」を押下→成功フラッシュを確認し商品編集画面で対象規格を再表示し販売価格＝X2・セールフラグ＝有効(ON)を確認	(A)現在セールフラグ無効(0)の高額規格にCSVセールフラグ有効(1)を取込むと（通常→セール切替）販売価格がCSVの販売価格X1に更新されセールフラグが有効(ON)になり、(B)現在セールフラグ有効(1)の高額規格にCSVセールフラグ有効(1)を取込むと（セール中のまま更新）販売価格がCSVの販売価格X2に更新されセールフラグが有効(ON)のまま維持される。いずれも基準価格は更新されない。商品編集画面で再表示すると(A)販売価格＝X1・(B)販売価格＝X2でともにセールフラグ＝ONとなる（Excelセールフラグ分岐の現OFF/CSV ON・現ON/CSV ONの両分岐） [L1:L1-M0333-006; fixture:SEED-M0333-SALEOFF-CSVON@TBD-D5,SEED-M0333-SALEON-CSVON@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-005	IT-06	セール価格更新	P2	セールON→OFFの取込で販売価格が基準価格になりセールフラグOFF・警告アラートが表示される	ログイン済／SEED-M0333-MASTERS／SEED-M0333-SALEON-CSVOFF	現在セールフラグ有効(1)の高額規格（商品コードCC3・現行 基準価格P0/販売価格S0）を対象に 販売価格=X3(非0)・セールフラグ=0 を与える1行CSV	1. セールOFFへ切替の価格変更CSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面に警告フラッシュ「%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。」が表示されエラーではなく処理が継続することを確認 3. 商品編集画面で対象規格を再表示し、販売価格＝基準価格P0・セールフラグ＝無効(OFF)になっていることを確認	現在セールフラグ有効(1)の高額規格にCSVセールフラグ無効(0)の取込を行うと（セール→通常切替）、販売価格が現在登録済の基準価格P0からコピーされセールフラグが無効(OFF)になりCSVの販売価格X3は無視される。CSVに販売価格が設定されているため警告フラッシュ「セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。」が管理画面上部に表示される（エラーではなく警告で処理は継続）。商品編集画面で対象規格を再表示すると販売価格＝P0・セールフラグ＝OFFとなる [L1:L1-M0333-007; fixture:SEED-M0333-SALEON-CSVOFF@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-006	IT-06	セール価格更新	P2	セールOFFのまま取込では販売価格が変更されず既存価格が維持され警告アラートが表示される	ログイン済／SEED-M0333-MASTERS／SEED-M0333-SALEOFF-CSVOFF	現在セールフラグ無効(0)の高額規格（商品コードCC4・現行 販売価格price02=S0）を対象に 販売価格=X4(≠S0)・セールフラグ=0 を与える1行CSV	1. セールOFFのままの価格変更CSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面に警告フラッシュ「%d行目: 通常商品のため、買取価格はCSVの値で更新しました。」が表示されエラーではなく処理が継続することを確認 3. 商品編集画面で対象規格を再表示し、販売価格が既存のS0のまま（CSVのX4に更新されていない）であることを確認	現在セールフラグ無効(0)の高額規格にCSVセールフラグ無効(0)の取込を行うと（通常商品のまま）、販売価格は更新されず既存のprice02（S0）が維持されセールフラグは無効(OFF)のままとなる。CSVの販売価格X4は反映されない。通常商品の販売価格は変更できない旨の警告フラッシュ「通常商品のため、買取価格はCSVの値で更新しました。」が管理画面上部に表示される（エラーではなく警告で処理は継続）。商品編集画面で対象規格を再表示すると販売価格＝S0（≠X4）となる ／ 自動検証(内部・DB): 対象規格の price02 がS0のまま変更されていない [L1:L1-M0333-008; fixture:SEED-M0333-SALEOFF-CSVOFF@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-008	IT-12	行数上限	P1	概算行数5010以上のCSVはMSG-003で拒否され取込されない	ログイン済／SEED-M0333-MAXROW	改行数5010以上のCSVファイル	1. 5010行以上のCSVを選択し「CSVファイルをアップロード」を押下 2. エラーフラッシュ表示と取込が行われないことを確認	アップロード画面に「5010 行を超えるCSVファイルは登録できません。」（テンプレートは %maxRecord% 行…で %maxRecord% は上限定数5010に解決・本メッセージは英訳なし＝ja固定）がエラーフラッシュとして表示され、取込は行われずセール用高額商品価格変更CSV登録画面が再表示される ／ 自動検証(内部・DB): 商品規格の価格・取込履歴とも増減なし [L1:L1-M0333-010; fixture:SEED-M0333-MAXROW@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-009	IT-15	フォーム不正	P2	CSRFトークン不正のルートエラー送信はエラーフラッシュを表示し取込されずアップロード画面へ戻る	ログイン済／SEED-M0333-BADCSRF	CSRFトークンが不正な送信（ルートフォームエラー）	1. CSRFトークンが不正な状態で「CSVファイルをアップロード」を送信 2. エラーフラッシュ表示と取込が行われないことを確認	フォーム送信のCSRFトークンが不正（ルートフォームエラー）のとき、フォームエラーが管理画面上部にエラーフラッシュとして表示され、取込は実行されずアップロード画面が再表示される（本ケースはCSRFトークン不正のみを対象とする。ファイルサイズ上限超過は子フィールドの制約エラーで管理画面には表示されないため本ケースの対象外） ／ 自動検証(内部・DB): 商品規格の価格・取込履歴とも増減なし [L1:L1-M0333-011; fixture:SEED-M0333-BADCSRF@TBD-D5]				
m03-33_admin_product_product_sale_high_price_csv_import	E2E-M0333C-010	IT-07	取込成功	P1	正常CSVの取込が成功し成功フラッシュが表示され取込履歴が1件増える	ログイン済／SEED-M0333-MASTERS／SEED-M0333-SALEOFF-CSVON	正常1行の価格変更CSVファイル（現在セールフラグ無効(0)の高額規格・販売価格X1・セールフラグ1）	1. 正常CSVを選択し「CSVファイルをアップロード」を押下 2. アップロード画面が再表示され成功フラッシュ「登録が完了しました。」が表示されエラーフラッシュが無いことを確認 3. 取込履歴テーブルに新規1行が表示され、その行にアップロードしたファイル名・アップロード日時・作業者が表示されることを確認	取込結果にエラーが無いとき、アップロード画面に成功フラッシュ「登録が完了しました。」（SUT(ee)実装の文言・en:Registration completed.）が管理画面上部に表示され、取込履歴テーブルに新規1行が増えその行にファイル名（アップロードしたファイル名）・アップロード日時・作業者が表示される（履歴画面が表示するのはファイル名・日時・作業者で取込種別IDは非表示）。フラッシュ表示後はセール用高額商品価格変更CSV登録画面が再表示される ／ 自動検証(内部・DB): dtb_csv_import_history に csv_import_type_id=8（HIGH_PRICE_IMPORT_CSV_ID）・ファイル名・作業者IDの行が1件INSERTされる [L1:L1-M0333-012; fixture:SEED-M0333-SALEOFF-CSVON@TBD-D5]				
```

---

## §5 ja/en locale対応表（ee messages.en.yaml / messages.ja.yaml 逐語・en-grep根拠）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。LS=1のclaimのみen行を持つ。en-grep（`grep -inE "sale_high_price_csv|maxrecord|csv_invalid_format|register\.complete|alert_off_sale|alert_end_sale|csv_upload|product_management|product_csv_management" messages.en.yaml messages.ja.yaml`）でヒット/不在を確認済み。

| L1 | キー | ja逐語 | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| L1-001 | admin.product.product_management | 商品管理 | Products | messages.en.yaml:1930 |
| L1-001 | admin.product.product_csv_management | 商品CSV管理 | Product CSV Management | messages.en.yaml:1938 |
| L1-002 | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804（base_csv_upload.twig:74 アップロードボタンでtrans描画） |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | messages.en.yaml:1806 |
| L1-002 | admin.common.csv_skeleton_download | 雛形ファイルダウンロード | Download a template | messages.en.yaml:1805 |
| L1-002 | admin.common.required | 必須 | Required | messages.en.yaml:1785（必須バッジでtrans描画） |
| L1-002 | admin.product.sale_high_price_csv | セール用高額商品価格変更CSVアップロード | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2010） |
| L1-002 | admin.product.sale_high_price_csv_upload_title | セール用高額商品価格変更CSV | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2011） |
| L1-012（MSG-006・成功） | admin.register.complete | 登録が完了しました。 | Registration completed. | messages.en.yaml:1676（ja: messages.ja.yaml:1970） |
| L1-018（MSG-002） | admin.common.csv_invalid_format | CSVのフォーマットが一致しません | Unmatched CSV format | messages.en.yaml:1810（ja: messages.ja.yaml:1758） |
| L1-010（MSG-003・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:1626） |
| L1-007（MSG-004 case3警告） | admin.product.sale_high_price_csv.alert_off_sale_buy_only | %d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。 | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2013） |
| L1-008（MSG-004 case4警告） | admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard | %d行目: 通常商品のため、買取価格はCSVの値で更新しました。 | （英訳なし＝messages.en.yamlに不在） | — （ja: messages.ja.yaml:2014） |

- LS=0のclaim（L1-003〜011,013〜017,019〜020）はロケール変異なしまたは英訳なし＝`-EN`行を持たない。en-grep結果: `admin.product.sale_high_price_csv*`・`admin.csv.error.upload.maxrecord`・`*.alert_off_sale_buy_only`・`*.alert_end_sale_sell_from_standard` はいずれも messages.en.yaml に**不在**（ヒット0件）＝英訳なしを確認。`admin.register.complete`（en:1676）・`admin.common.csv_invalid_format`（en:1810）・`admin.common.csv_upload`（en:1804）・ナビlabel（en:1930/1938）は**実在**しLS=1。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（ee `csv_product_sale_high_price.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET /%eccube_admin_route%/product/sale_high_price/csv_upload`・`POST …/product/sale_high_price/import`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。
- 取込結果の検証はフラッシュメッセージDOM（成功/エラー/警告の集合）＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象商品規格を商品編集で再表示して販売価格・セールフラグ反映確認（B9）。
- db.ts自動検証（内部・DB）は: 行数上限・フォーム不正時の非書込み（C-008/C-009）／case4の販売価格非更新（C-006・price02がS0のまま＝意図しない更新の否定的事実）／取込成功時の取込履歴INSERT値 csv_import_type_id=8（C-010・履歴画面に種別IDが非表示のため内部検証・R1 Major4）に限る。C-004/C-005の価格反映は商品編集画面で目視。
- **pf/ee食い違いの回避**: POST後応答はpf inline render／ee redirectで食い違うため、期待は「アップロード画面にフラッシュが表示される」観測レベルに留めHTTP302/renderの別をオラクルにしない（§0-A）。UI挙動・ボタン文言・成功文言はee(SUT)を正とする。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・フラッシュ集合差分アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVファイルをアップロード」ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。
2. 取込CSVは fixture（SEED-M0333-*）として用意。セール分岐の各ケースは現在登録済セールフラグ（SEED）とCSVセールフラグの組で一意識別する（C-004=現OFF/CSV ONと現ON/CSV ONの両分岐を2アップロードで判定・C-005=現ON/CSV OFF・C-006=現OFF/CSV OFF）。
3. 更新系ケース（C-004/C-005/C-006/C-010）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。C-008/C-009は拒否で書込みが無いため後始末不要（参照のみ）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003 | Playwright（GUI） | 画面（DOM） | 画面表示・JS・確認モーダル非表示 |
| C-004,C-005 | Playwright＋DB確認 | 画面（成功/警告フラッシュ・価格反映） | セール価格更新（case1/2・case3）。価格反映は商品編集画面で目視 |
| C-006 | Playwright＋DB確認 | 画面（警告フラッシュ・価格非更新）＋DB | case4販売価格非更新の否定的事実はDB副次・警告フラッシュは画面 |
| C-008,C-009 | Playwright＋DB確認 | 画面（エラーフラッシュ）＋DB | 拒否の否定的事実（何も書かれない）はDB副次 |
| C-010 | Playwright＋DB確認 | 画面（成功フラッシュ・取込履歴の可視項目）＋DB | 取込成功・成功フラッシュ＋取込履歴1行の可視項目（ファイル名/日時/作業者）は画面で目視・種別ID8は履歴画面非表示のため内部DB検証（R1 Major4） |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: 拒否時の非書込み・case4の販売価格非更新・取込履歴の種別ID8（画面非表示）。取込履歴の行増減・成功系の価格反映は画面で目視可能なため主は画面。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点はexcluded（Gate B15）。pf/ee食い違いのee-only挙動はTBD。

### 観点補正（B8。母集合は不変・1:1・15件＝bound全行）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（15件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | JS挙動（ファイル選択ラベル） | L1-004 |
| -005 | 出力抑止 | モーダル（確認モーダルなし） | L1-005 |
| -007 | 状態変化 | フォーム不正（欠落・不一致→フォーム妥当性エラーでリダイレクト） | L1-011 |
| -009 | HTTPステータス | セール価格更新（セールON取込で販売価格CSV値・セールフラグON） | L1-006 |
| -012 | 文字列長バリデーション | セール価格更新（セールOFFのまま→販売価格維持・警告） | L1-008 |
| -041 | 登録内容 | フォーム不正（欠落・不一致→フォーム妥当性エラーでリダイレクト） | L1-011 |
| -049 | 実行結果 | 取込成功（取込履歴はコミット完了実行だけ1件増） | L1-012 |
| -061 | 実行結果 | メッセージ/画面遷移（行数上限MSG-003→CSV登録画面遷移） | L1-010 |
| -083 | 表示順 | 取込成功（取込履歴はコミット完了実行だけ1件増） | L1-012 |
| -089 | 画面レイアウト | 画面遷移（POST後アップロード画面にフラッシュ表示・履歴更新後） | L1-012 |
| -090 | 画面レイアウト | フォーム不正（エラーフラッシュ・アップロード画面へ戻る） | L1-011 |
| -095 | 一覧 | メッセージ/画面遷移（行数上限MSG-003→CSV登録画面遷移） | L1-010 |
| -096 | 画面表示データ | セール価格更新（セールON→OFF→警告・処理継続） | L1-007 |
| -103 | エラー継続 | 画面表示（アップロード画面・フォーマット表・履歴・雛形リンク） | L1-001 |
| -106 | データ正当性 | JS挙動（ファイル選択ラベル） | L1-004 |

### 106対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容または取込結果が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容または取込結果が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | csv_product_sale_high_price.twig が base_csv_upload.twig を継承（観点=未認証だが期待はTwig継承＝観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 004 | ファイル選択でラベルへファイル名を表示（B8: 対象データ→JS挙動） | bound | C-002 |
| 005 | 送信前の確認ダイアログはない（B8: 出力抑止→モーダル） | bound | C-003 |
| 006 | 一時ディレクトリへ移動後に汎用インポータが読み捨て終了時に削除（一時ファイル処理・外部IFで観測不能・B15②） | **excluded** | — |
| 007 | 欠落・不一致時はフォーム妥当性エラーでリダイレクト（CSRFトークン欠落→form不正・B8: 状態変化→フォーム不正） | bound | C-009 (shared) |
| 008 | 高額・非公開の規格を一意に特定するキー（商品コードのフィールド説明・単一の観測可能挙動でない・B15②） | **excluded** | — |
| 009 | セールONへ遷移するときおよびセール中のまま更新するときの新しい販売価格の元（B8: HTTPステータス→セール価格更新 case1/2） | bound | C-004 |
| 010 | 必須バリデーションでエラー表示され完了しない＋前提「高額コードが空/NULL規格 or 規格公開のまま」（前提のうち「規格が公開のまま→不存在扱い」は実装の規格検索が公開状態を検査しないため実装と食い違い、一意判定できない） | **TBD** | — |
| 011 | 必須バリデーションでエラー表示されず継続＋前提「同一商品コードの規格が2件以上」（ee重複breakAllはee-onlyでpf現行に無い＝pf/ee食い違い・期待も継続で不一致） | **TBD** | — |
| 012 | 販売価格はCSVではなく既存price02を維持し情報メッセージを積む＋前提「セール外かつCSVもセールOFF」（B8: 文字列長→セール価格更新 case4） | bound | C-006 |
| 013 | 相関バリデーションでエラー表示され完了しない＋前提「価格履歴」（前提が汎用ノイズ・B15②） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続＋前提「一覧との一致」（汎用スタブ） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続＋前提「履歴」（汎用スタブ） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない＋前提「成功時出力」（汎用スタブ） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続＋前提「失敗時出力」（汎用スタブ） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない＋前提「副作用」（汎用スタブ） | **excluded** | — |
| 019 | 当機能が行う登録・更新で対象テーブルを直接保存（内部DB注記・汎用・B15②） | **excluded** | — |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索非該当・汎用スタブ・B7/B15） | **excluded** | — |
| 021 | 含まれない（検索非該当・汎用スタブ） | **excluded** | — |
| 022 | 含まれる（汎用スタブ） | **excluded** | — |
| 023 | 含まれない（汎用スタブ） | **excluded** | — |
| 024 | 含まれる（汎用スタブ） | **excluded** | — |
| 025 | 含まれない（汎用スタブ・前提MSG-001） | **excluded** | — |
| 026 | 含まれる（汎用スタブ・前提MSG-002） | **excluded** | — |
| 027 | 含まれない（汎用スタブ・前提MSG-003） | **excluded** | — |
| 028 | 含まれる（汎用スタブ・前提MSG-004） | **excluded** | — |
| 029 | 含まれない（汎用スタブ・前提MSG-005） | **excluded** | — |
| 030 | 含まれる（汎用スタブ・前提MSG-006） | **excluded** | — |
| 031 | 含まれない（汎用スタブ・前提取込開始直前） | **excluded** | — |
| 032 | 含まれる（汎用スタブ・前提エラー配列） | **excluded** | — |
| 033 | 含まれない（汎用スタブ・前提エラーなく完了） | **excluded** | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ・履歴ページング前提） | **excluded** | — |
| 035 | 同上（汎用スタブ・ナビ前提） | **excluded** | — |
| 036 | 同上（汎用スタブ・履歴件数プルダウン前提） | **excluded** | — |
| 037 | 同上（汎用スタブ・表示要素前提） | **excluded** | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・本機能は更新のみで「追加」非該当） | **excluded** | — |
| 039 | 追加されない（汎用スタブ） | **excluded** | — |
| 040 | 追加される（汎用スタブ） | **excluded** | — |
| 041 | 欠落・不一致時はフォーム妥当性エラーでリダイレクト（CSRFトークン・-007と同型のform不正・B8: 登録内容→フォーム不正） | bound | C-009 (shared) |
| 042 | 追加される（汎用スタブ） | **excluded** | — |
| 043 | 追加される（汎用スタブ・最大長） | **excluded** | — |
| 044 | 追加されない（汎用スタブ・最大長+1・前提規格不存在は概念上L1-009 documentation-onlyに対応するが期待は汎用） | **excluded** | — |
| 045 | 追加される（汎用スタブ・最小長・前提規格2件以上は重複breakAll＝ee-only） | **excluded** | — |
| 046 | 追加されない（汎用スタブ・最小長-1・前提セールOFF/OFFはcase4 C-006被覆） | **excluded** | — |
| 047 | 追加される（汎用スタブ・前提価格履歴） | **excluded** | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ・一覧との一致前提） | **excluded** | — |
| 049 | 取込履歴はエラーなくコミット完了した実行だけが1件増える（具体・検証可能・B8: 実行結果→取込成功） | bound | C-010 |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-004/005で概念被覆） | **excluded** | — |
| 051 | 変更されない（汎用スタブ＝失敗系C-008/C-009で概念被覆） | **excluded** | — |
| 052 | 変更される（汎用スタブ） | **excluded** | — |
| 053 | 対象テーブルを直接保存（内部DB注記・汎用） | **excluded** | — |
| 054 | 変更される（汎用スタブ） | **excluded** | — |
| 055 | 変更される（汎用スタブ・最大長） | **excluded** | — |
| 056 | 変更されない（汎用スタブ・最大長+1・CSRF不備前提） | **excluded** | — |
| 057 | 変更される（汎用スタブ・最小長） | **excluded** | — |
| 058 | 変更されない（汎用スタブ・最小長-1） | **excluded** | — |
| 059 | 変更される（汎用スタブ・前提MSG-001） | **excluded** | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提MSG-002） | **excluded** | — |
| 061 | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する＋前提MSG-003（B8: 実行結果→メッセージ/画面遷移 行数上限） | bound | C-008 (shared) |
| 062 | 実行結果のファイル出力内容または取込結果が対象データと一致＋前提MSG-004（汎用スタブ・MSG-004アラートはC-005/C-006被覆） | **excluded** | — |
| 063 | フォーマット定義でエラー表示されず継続＋前提MSG-005（汎用スタブ・観測対象未定義） | **excluded** | — |
| 064 | フォーマット定義でエラー表示され完了しない＋前提MSG-006（MSG-006=成功と矛盾・汎用） | **excluded** | — |
| 065 | 実行結果のファイル出力内容または取込結果が一致（汎用スタブ・取込開始直前前提） | **excluded** | — |
| 066 | 同上（汎用スタブ・エラー配列前提） | **excluded** | — |
| 067 | 出力内容のファイル出力内容または取込結果が一致（汎用スタブ・エラーなく完了前提） | **excluded** | — |
| 068 | 同上（汎用スタブ・履歴ページング前提） | **excluded** | — |
| 069 | 同上（汎用スタブ・ナビ前提） | **excluded** | — |
| 070 | 同上（汎用スタブ・履歴件数前提） | **excluded** | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ・表示要素前提） | **excluded** | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 073 | 移動・リネームの該当レコードが含まれない（非該当・B7） | **excluded** | — |
| 074 | コピーのファイル出力内容または取込結果が一致（非該当・B7） | **excluded** | — |
| 075 | ファイル登録のファイル出力内容または取込結果が一致（汎用ファイルスタブ・アップロード成否はC-010/C-008/C-009で概念被覆） | **excluded** | — |
| 076 | ファイル出力のファイル出力内容または取込結果が一致（出力は本機能に非該当・B7） | **excluded** | — |
| 077 | JSONのファイル出力内容または取込結果が一致（非該当・B7） | **excluded** | — |
| 078 | 同名ファイルのファイル出力内容または取込結果が一致（非該当・B7） | **excluded** | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当・B7・前提規格2件以上は重複breakAll ee-only） | **excluded** | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当・B7・前提セールOFF/OFF） | **excluded** | — |
| 081 | スキーマのファイル出力内容または取込結果が一致（汎用ファイルスタブ・列未指定・前提価格履歴） | **excluded** | — |
| 082 | 取込直後、同一トランザクションがコミットされていれば商品規格の参照クエリは更新後値を返す（トランザクション整合の内部注記・C-004/005/006再表示で被覆・B15②） | **excluded** | — |
| 083 | 取込履歴はエラーなくコミット完了した実行だけが1件増える（-049と同一・B8: 表示順→取込成功） | bound | C-010 (shared) |
| 084 | 更新抑止のファイル出力内容または取込結果が一致（汎用スタブ） | **excluded** | — |
| 085 | admin エラーフラッシュに汎用CSVエラーメッセージもしくはフォームエラー（失敗時の汎用エラーフラッシュ列挙・C-008/C-009で概念被覆・B15②） | **excluded** | — |
| 086 | 規格の価格・セール・帯・スマレジフラグ更新、商品タグ置換、条件付き価格履歴・取込履歴INSERT、情報ログ、スマレジ連携の予約（副作用の汎用列挙・単一挙動でない・スマレジ連携予約はpf-only・B15②） | **excluded** | — |
| 087 | 当機能が行う登録・更新で対象テーブルを直接保存（ロールバック観点だが期待は内部DB注記・汎用） | **excluded** | — |
| 088 | 保存済みページサイズ・ページ番号で履歴を再取得（page_countセッションはee-onlyでpf現行は固定件数findByで page_count セッションなし＝pf/ee食い違い） | **TBD** | — |
| 089 | リダイレクト後のGETでフラッシュ表示、履歴は更新後データ（POST後アップロード画面にフラッシュ表示＋履歴更新後＝観測レベル・B8: 画面レイアウト→画面遷移） | bound | C-010 (shared) |
| 090 | エラーフラッシュし、アップロード画面へリダイレクト＋前提「フォーム・CSRF不備」（B8: 画面レイアウト→フォーム不正） | bound | C-009 |
| 091 | 汎用インポータがエラー配列を返しトランザクションロールバック＋前提「CSV形式・列・ターゲット不備」（汎用「任意のCSVエラー→ロールバック」で具体単一挙動でない・存在breakAllは L1-009 documentation-only・B15②） | **excluded** | — |
| 092 | インポータはロールバック試行後、捕捉した例外をそのまま再送出（Symfonyエラーハンドリング委譲・観測手段なし・B15②） | **excluded** | — |
| 093 | 母集合期待が「要ソース確認」プレースホルダ（前提MSG-001・出所未確認） | **excluded** | — |
| 094 | 管理画面_..._CSV登録画面に遷移する＋前提MSG-002（import_file null→csv_invalid_format だが NotBlank先行でファイル未選択送信は当分岐へ到達せず純UI到達不能） | **TBD** | — |
| 095 | 管理画面_..._CSV登録画面に遷移する＋前提MSG-003（B8: 一覧→メッセージ/画面遷移 行数上限・-061と同一） | bound | C-008 (shared) |
| 096 | 画面表示データでエラー表示されず継続＋前提MSG-004（セール中→セール外の警告アラートで処理継続＝case3・B8: 画面表示データ→セール価格更新） | bound | C-005 |
| 097 | 母集合期待が「要ソース確認」プレースホルダ（前提MSG-005・出所未確認） | **excluded** | — |
| 098 | 画面表示データでエラー表示されず継続＋前提MSG-006（MSG-006=成功と「継続」の汎用・矛盾） | **excluded** | — |
| 099 | 情報ログ「セール用高額商品価格変更CSV登録開始」（実在挙動だがログ観測手段未整備で一意固定不能・要実機・B15③） | **TBD** | — |
| 100 | 情報ログ「セール用高額商品価格変更CSV登録 異常終了」（実在挙動だがログ観測手段未整備・B15③） | **TBD** | — |
| 101 | ファイル選択のファイル出力内容または取込結果が一致（汎用ファイルスタブ） | **excluded** | — |
| 102 | キー admin.product.sale_high_price_csv.page_count および ...page_no に保存する（page_countセッションはee-onlyでpf現行は固定件数findBy＝pf/ee食い違い） | **TBD** | — |
| 103 | アップロード画面が開き、フォーマット表・履歴・雛形リンクが表示される（B8: エラー継続→画面表示） | bound | C-001 |
| 104 | 許容リストに含まれる件数だけセッションに保存され、履歴のページサイズが変わる（page_countセッションはee-only＝pf/ee食い違い） | **TBD** | — |
| 105 | csv_product_sale_high_price.twig は base_csv_upload.twig を継承する（Twig継承は観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 106 | ファイル選択でラベルへファイル名を表示（B8: データ正当性→JS挙動・-004と同一） | bound | C-002 (shared) |

`func_scope_check` 判定: 親106/106会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝8件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| 存在検証の公開規格前提がee/pf実装と食い違い（R1 Major2） | -010 | 1 | 母集合前提「高額コードが空／NULL の規格、または規格が公開のまま→不存在扱いで全体中断」のうち「規格が公開のまま→不存在扱い」はee/pf検索条件（商品コードと `high_price_code` のみ・公開状態を検査しない・ee-repo:2233／pf-handler:190）と食い違う。high_price_code空/NULL枝は実在するが、公開枝を含む母集合前提を純UIで一意判定できず bound不能＝要仕様確認（存在breakAll自体はL1-009 documentation-only） |
| pf/ee食い違い（重複breakAllはee-only） | -011 | 1 | 母集合前提「同一商品コードの規格が2件以上」に対しeeは `isProductCodeUnique` で breakAll（ee-handler:190）するが、pf現行ハンドラ（`HighPriceImportHandler`）に明示的な商品コード重複チェックが無く存在チェックのみ（pf-handler:108）＝ee刷新で追加された挙動。区分宣言は現行挙動=pfのためeeオラクル化しない＝要仕様確認。加えて母集合期待「エラー表示されず継続」も重複breakAll（中止）と不一致 |
| pf/ee食い違い（page_countセッションはee-only） | -088,-102,-104 | 3 | 母集合期待「page_count/page_no セッション保存・保存済みページサイズで再取得・許容件数だけ保存しページサイズが変わる」（pf-md:56はee `getCsvImportHistoryPaginationParams` を記述）はee-only。pf現行は本画面の履歴を固定件数 `findBy`（`CSV_IMPORT_HISTORY_LIMIT`=100・pf-ctrl:1085）で描画し page_count セッションを持たない＝pf/ee食い違いでeeオラクル化しない＝要仕様確認 |
| pf/design がee実装と食い違い純UI到達不能 | -094 | 1 | 母集合前提MSG-002「CSVのフォーマットが一致しません」（admin.common.csv_invalid_format）は import_file が null のとき（ee-ctrl:135）フラッシュされる設計だが、import_file は NotBlank＋サイズ制約のためファイル未選択送信は先行するフォーム不正分岐で終了し当分岐へ到達しない＝純UIでMSG-002到達不能。実際に出る検証メッセージの確定は要実機 |
| 実在挙動だがログ観測手段未整備（B15③） | -099,-100 | 2 | 情報ログ「セール用高額商品価格変更CSV登録開始/異常終了/完了」（pf-md:66,68・pf-ctrl:1070,1076,1079・L1-019）は実在するがログ観測手段が現行ハーネスで未整備＝画面/履歴で検知できず一意固定不能・要実機／ログ観測整備 |

（合計 1+1+3+1+2 = 8）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・5010境界・各セールケースの価格値P0/S0/X1/X3/X4・不存在商品コード・CSRF不正/サイズ超過） | fixture manifest（D5型）未整備＝要実機（SEED-M0333-*） |
| L1-013 買取価格更新のExcel/pf vs ee食い違い | Excelは全ケースで買取価格をCSV値へ更新と規定しpf現行は dtb_product_sub_class.buy_price を更新するが、ee(SUT)は買取価格列を持たず更新しない。母集合に買取価格を固有一意判定する要求行が無く、SUTで真でない挙動はboundにしない＝documentation-only（0204:G91,G97,G104,G112・pf-handler:414・ee-handler:140） |
| L1-020 スマレジ連携フラグ列 | Excel識別ID:3はスマレジ連携フラグ列の追加を規定するが、pf現行ハンドラ（6列）にもee(SUT)ハンドラ（5列）にも取込列が無く反映されない＝設計と実装の食い違い・documentation-only |
| L1-014/015 帯URL・タグ置換・価格履歴増分 | 両実装共通挙動だが母集合に固有一意判定行が無い＝documentation-only。将来固定条件を定義できればbound可 |
| アップロードサイズ上限超過のフラッシュ可否（R1 Major1） | サイズ制約は子フィールド `import_file` の `Assert\File(maxSize)`（CsvImportType.php:54）で、コントローラの `getErrors()` は再帰なし（deep=false 既定・ee-ctrl:126）のため子エラーはフラッシュへ積まれない＝サイズ超過はエラーフラッシュ必発でなくbound不成立。実際にどの画面挙動になるか（例外/黙殺）の確定は要実機。C-009はCSRFトークン不正（ルートエラー）に限定してbound |
| L1-011 成功文言の pf/ee 食い違い | pf「商品登録CSVファイルをアップロードしました。」／ee「登録が完了しました。」。SUT(ee)実装を正としee文言をbind（C-010・§0-A(c)） |
| L1-009 存在breakAll（high_price_code不存在→打ち切り） | 実在挙動だが唯一の母集合行-010が公開規格前提でbound不能（§9.1）＝documentation-only。high_price_code空/NULL規格を固定できれば将来bound可（要実機） |
| L1-解決器・取込結果アサートヘルパ（フラッシュ集合差分）・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |

### 9.3 excluded＝83件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能・C-001被覆）** | -003,-105 | テンプレート継承そのものは外部IFで判定不能。構成要素はC-001が同一操作で被覆 |
| **【B15②】内部実装注記（一時ファイル・商品コードfield説明・トランザクション整合・例外再送出・成功抑止・DB直接保存・副作用列挙・スマレジ予約）** | -006,-008,-019,-053,-082,-086,-087,-092 | 一時ファイル削除・商品コードキー説明・トランザクション境界・例外再送出・対象テーブル直接保存・副作用の汎用列挙は外部IFで観測不能な内部処理注記で単一の観測可能挙動でない |
| **【B15②】汎用「登録内容/更新内容/実行結果/出力内容が追加/変更/一致・されない」スタブ** | -001,-002,-013,-014,-015,-016,-017,-018,-034,-035,-036,-037,-038,-039,-040,-042,-043,-044,-045,-046,-047,-048,-050,-051,-052,-054,-055,-056,-057,-058,-059,-060,-062,-065,-066,-067,-068,-069,-070,-071,-084,-101 | 対象レコード・具体列/値を母集合が指定せず内容空虚。取込の成功反映（C-004/005/010）・失敗（C-007〜C-009）で概念被覆済みの冗長スタブ。前提MSGは機械割当で期待と無関係 |
| **【B7】検索/ファイル/レコード操作系・削除系（非該当）** | -020,-021,-022,-023,-024,-025,-026,-027,-028,-029,-030,-031,-032,-033,-072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 検索/削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。本機能は価格更新取込であり検索・削除・出力・ファイル操作は該当なし |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）・成功と矛盾・汎用エラーフラッシュ列挙** | -063,-064,-085,-091,-098 | -063/-064=フォーマット定義の汎用継続（MSG-005/006前提だが観測対象未定義・-064はMSG-006成功と矛盾）／-085=失敗時の汎用エラーフラッシュ列挙（C-007/C-009被覆）／-091=「任意CSVエラー→ロールバック」の汎用で具体単一挙動でない（存在breakAll C-007が代表）／-098=MSG-006成功と「継続」の矛盾 |
| **【B15③】プレースホルダ** | -093,-097 | 「要ソース確認」（前提MSG-001/MSG-005・出所未確認のプレースホルダ） |

## §10 特記事項（片側断定せず記録）

1. **pf/ee食い違いが本機能の核心（M03-32より深い）**: pf現行（HareruyaEcプラグイン `HighPriceImportHandler`）は6列（商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ）で price02 をCSV販売価格で直接上書きしセールフラグ分岐が無く（pf-handler:382）、買取価格を dtb_product_sub_class へ更新し（pf-handler:414）、取込成功時に支店連携（BranchUpdateService・pf-handler:79-83）を行う。ee（システムオブテスト `SaleHighPriceImportHandler`）は5列（買取価格列なし）でセールフラグ4分岐（ee-handler:122-138）を行い price02・belt_url・sale_flg のみ更新する。Excel設計はセールフラグ4分岐を規定しeeがこれに整合。よってセールフラグ販売価格挙動は**excel源**（L1-006/007/008）、共通インフラ（行数上限・フォーム不正・存在チェックbreakAll・成功時履歴INSERT機構）は**pf-fallback源**、ee-only挙動（重複breakAll・page_countセッション）は**TBD**、Excel規定だがSUTに無い挙動（買取価格更新・スマレジ連携フラグ列）は**documentation-only**とした（§0-A）。
2. **UI挙動・ボタン文言・成功文言はee(SUT)を正（§0-A(c)）**: ボタン文言は base_csv_upload.twig の `admin.common.csv_upload`＝「CSVファイルをアップロード」（ee-ctrl:97継承・pf-md利用者視点の「CSVアップロード」はbindしない）。成功文言はee `admin.register.complete`＝「登録が完了しました。」（en Registration completed.・ee-ctrl:175）をbindしpf `admin.product.csv_import.save.complete`「商品登録CSVファイルをアップロードしました。」はbindしない。source_classは共通機構をpf-fallback（成功フラッシュ＋履歴INSERT）とし、SUT観測の逐語文言は§5に紐付ける（1claim1source維持）。
3. **画面遷移のpf/ee食い違い（HTTP302 vs render）**: pf現行のPOSTは同一リクエストで twig を直接 render（`return $app->render(...)`・pf-ctrl:1087）しリダイレクトしない。eeは常に GET アップロード画面へ redirect（ee-ctrl:193）する。よって期待は「アップロード画面にフラッシュが表示される」観測レベルに留めHTTP302/renderの別をオラクルにしない（両者で食い違い一意でないため）。
4. **行数上限は5010で一致・キー同一**: pf `CSV_IMPORT_MAX`=5010（pf-ctrl:391）とee `ADMIN_CSV_IMPORT_MAX_ROWS`=5010は同値・同一キー `admin.csv.error.upload.maxrecord`。本メッセージは messages.en.yaml に不在＝英訳なし（LS=0・en-grep確認）。
5. **en一次資料の事実認定（en-grep）**: pf-md表示メッセージ表は全MSGを「（英訳なし）」とするが誤り。ee messages.en.yaml をgrep確認し MSG-006相当（register.complete=Registration completed.:1676）・MSG-002（csv_invalid_format=Unmatched CSV format:1810）・ボタン/ナビ（csv_upload=Upload a CSV file:1804／product_management=Products:1930／product_csv_management=Product CSV Management:1938）に英訳が実在（LS=1）。一方 sale_high_price_csv系キー・maxrecord・alert_off_sale_buy_only・alert_end_sale_sell_from_standard は en.yaml に不在＝英訳なし（LS=0）をヒット0件で確認。
6. **セールフラグ4分岐のExcel逐語とee整合（1claim1source）**: L1-006（case1現OFF/CSV ON・case2現ON/CSV ON→販売価格=CSV値・セールフラグON）・L1-007（case3現ON/CSV OFF→販売価格=基準価格・CSV販売無視・警告）・L1-008（case4現OFF/CSV OFF→販売価格維持・警告）はいずれもExcel処理概要（0204:G87-G114）逐語を源とし、ee実装（ee-handler:122-138 の4分岐・addInfo alert_off_sale_buy_only/alert_end_sale_sell_from_standard）が整合することを照合した（オラクルはExcel・observableはSUTで真な price02/sale_flg 反映と警告フラッシュに限定）。case3/case4の警告文言（MSG-004）はee ja逐語（alert_off_sale_buy_only:2013／alert_end_sale_sell_from_standard:2014）がExcel MSG-004と一致する。
7. **B12/1実行1判定**: B12共有は完全重複・同一実行（C-002←004/106・C-008←061/095・C-009←090/007/041〔いずれもCSRF/フォーム不正のルートエラー→エラーフラッシュ→アップロード画面〕・C-010←049/083/089〔いずれも取込成功→成功フラッシュ＋取込履歴1件増〕）に限定。異挙動（セール各ケースC-004/C-005/C-006・行数上限C-008）は別要件のため強制共有しない。MSG-003はL1でテンプレート保持・実行期待は根拠ある置換後実値「5010 行を超えるCSVファイルは登録できません。」（%maxRecord%＝定数5010）へ解決。
8. **codex Gate C R1 是正（Major4件を全反映・2026-07-29・ee/pf実ソース照合）**（会計変化: bound16→15・TBD7→8・excluded83不変・候補10→9〔C-007廃止〕・L1数20不変）:
   - **Major1（B1/B3 フォーム不正のサイズ超過誤bound）**: サイズ制約は子フィールド `import_file` の `Assert\File(maxSize)`（CsvImportType.php:54）でありコントローラの `getErrors()` は再帰なし（deep=false 既定・ee-ctrl:126）＝子エラーは非フラッシュ。サイズ超過はエラーフラッシュ必発でなくbound不成立→TBD（§9.1/§9.2）。C-009はCSRFトークン不正（ルートエラー）に限定してbound。SEED-M0333-BADFORM→SEED-M0333-BADCSRFへ是正。
   - **Major2（source_class純度/B1 「非公開規格」捏造）**: ee/pf検索条件（`findHighPriceProductClassForSaleCsv`・ee-repo:2233／pf-handler:190）は商品コードと `high_price_code`（非NULL・非空）のみで**公開状態を検査しない**。L1-006/L1-009/取込CSV列/SEEDから「非公開」を除去。母集合-010は「規格が公開のまま→不存在扱い」が実装と食い違いbound不能→TBD、C-007廃止・L1-009はdocumentation-only。
   - **Major3（B1 セールフラグ「現ON/CSV ON」未実行）**: eeはcase1（現OFF/CSV ON・ee-handler:122）とcase2（現ON/CSV ON・ee-handler:125）を別分岐で規定（Excel G87-G98）。C-004を2アップロード（A=現OFF/CSV ON→販売価格X1・セールフラグON／B=現ON/CSV ON→販売価格X2・セールフラグON維持）で両分岐を各々一意判定するよう是正。SEED-M0333-SALEON-CSVON追加。
   - **Major4（B6/B9 取込種別ID8のUI観測不能）**: 取込履歴画面が表示するのはファイル名・アップロード日時・作業者のみ（csv_import_history.twig:32-34）で csv_import_type_id は非表示。C-010の画面期待を可視項目（新規1行のファイル名/日時/作業者）に是正し、種別ID8＝HIGH_PRICE_IMPORT_CSV_ID の検証は自動検証（内部・DB）列へ分離（ee-ctrl:177）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8。
**本正準表のNNN集合は§8観点補正表と完全一致する（15件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | JS挙動 | 期待「ファイル選択でラベルへファイル名を表示」（L1-004）。母集合ラベル「対象データ」は誤り |
| 005 | モーダル | 期待「送信前の確認ダイアログはない」（L1-005）。母集合ラベル「出力抑止」は誤り |
| 007 | フォーム不正 | 期待「欠落・不一致時はフォーム妥当性エラーでリダイレクト」（L1-011）。母集合ラベル「状態変化」は誤り |
| 009 | セール価格更新 | 期待「セールONへ遷移・セール中のまま更新の新しい販売価格の元」（L1-006）。母集合ラベル「HTTPステータス」は誤り |
| 012 | セール価格更新 | 期待「セール外かつCSV OFF→販売価格は既存price02維持・情報メッセージ」（L1-008）。母集合ラベル「文字列長バリデーション」は誤り |
| 041 | フォーム不正 | 期待「欠落・不一致時はフォーム妥当性エラーでリダイレクト」（L1-011）。母集合ラベル「登録内容」は誤り |
| 049 | 取込成功 | 期待「取込履歴はエラーなくコミット完了した実行だけ1件増える」（L1-012）。母集合ラベル「実行結果」は誤り |
| 061 | メッセージ/画面遷移 | 期待「CSV登録画面に遷移」＋前提MSG-003 行数上限（L1-010）。母集合ラベル「実行結果」は誤り |
| 083 | 取込成功 | 期待「取込履歴はエラーなくコミット完了した実行だけ1件増える」（L1-012）。母集合ラベル「表示順」は誤り |
| 089 | 画面遷移 | 期待「リダイレクト後のGETでフラッシュ表示・履歴は更新後データ」（L1-012）。母集合ラベル「画面レイアウト」は誤り |
| 090 | フォーム不正 | 期待「エラーフラッシュし、アップロード画面へリダイレクト」（L1-011）。母集合ラベル「画面レイアウト」は誤り |
| 095 | メッセージ/画面遷移 | 期待「CSV登録画面に遷移」＋前提MSG-003 行数上限（L1-010）。母集合ラベル「一覧」は誤り |
| 096 | セール価格更新 | 期待「セール中→セール外の警告アラートで処理継続」（L1-007）。母集合ラベル「画面表示データ」は誤り |
| 103 | 画面表示 | 期待「アップロード画面・フォーマット表・履歴・雛形リンクが表示される」（L1-001）。母集合ラベル「エラー継続」は誤り |
| 106 | JS挙動 | 期待「ファイル選択でラベルへファイル名を表示」（L1-004）。母集合ラベル「データ正当性」は誤り |
