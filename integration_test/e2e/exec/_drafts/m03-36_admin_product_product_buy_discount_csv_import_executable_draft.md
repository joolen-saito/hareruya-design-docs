# 候補: m03-36 買取減額率変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合95全量会計・専用画面未実装/能力はM03-26統合）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1 Major3件 是正反映版（2026-07-29・ee/pf実ソース照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（codex Gate C R1-R4確定）の構造・取込検証設計を踏襲。値・claim・列名・メッセージはM03-36自身の一次資料（pf md／pf実source／ee実source）から取得。
>
> ## ★所見（専用M03-36画面はee未実装だが、買取減額率更新能力はカード商品CSV(M03-26)に統合実装済）
> **買取減額率変更CSV登録（m03-36）は現行pf（HareruyaEc）に専用実装があるが、SUT=ec-cube-enterprise には本機能の「専用」HTTPルート・専用Controller・専用取込ハンドラ・専用テンプレート・専用navが無い。** ただし**買取減額率(ID)をCSVで更新する能力そのものは、eeではカード商品CSV登録(M03-26)に統合実装されている**（R1 Major1是正）:
> - カードCSV取込ルート: `admin_product_card_csv_import`（GET・`CardCsvController.php:95`）／`admin_product_card_csv_upload`（POST・`CardCsvController.php:149`）／nav入口 `eccube_nav.yaml:43`。
> - 取込列「買取減額率(ID)」→ `buy_discount_id`: `CardCsvController.php:344`／列validator組込 `ProductCardImportHandler.php:370`（`BuyDiscountIdValidator`）。
> - CSV値を `buyDiscountId` へ渡し `dtb_product.buy_discount_id` を UPDATE: `ProductCardImportHandler.php:581`／`ProductRepository::updateProduct`（NOTE「pf-eccube3の DtbProductSubRepository::updateProductSub の機能を統合」・`ProductRepository.php:1543,1566`）。
> - eeマスタ/スキーマ: `MtbCsvImportType::PRODUCT_BUY_DISCOUNT_IMPORT_CSV_ID=13` 定数（`MtbCsvImportType.php:40`）＋マイグレーション登録名「買取減額率変更登録」（`Version20251125141348.php:112-114`）／`dtb_product.buy_discount_id`（`mtb_buy_discount` 外部参照列・`Product.php:1216-1218`）／`dtb_product.product_status_id`（`Product.php:577-579`・`del_flg` 列なし）。
> - Excel基本設計: `0204_基本設計仕様書(商品管理).html`（66シート）に本機能の専用設計シートは無く、唯一の言及は `別添資料__スマレジ連携機能一覧!C40` の機能名参照のみ（設計仕様でない）。
>
> **帰結（行単位再判定・R1 Major1/2是正）**: (a)**DB/スキーマ/マスタが一意にDB確認できる行**＝id=13名称・buy_discount_id統合・product_status_id/del_flg無し → **bound**（B8観点補正＋Playwright(商品編集/CSV管理)＋DB確認）。(b)**買取減額率のCSV更新挙動**（列更新・商品/買取減額率ID検証・重複ID・商品存在breakAll・render・ログ・他列引き継ぎ・専用画面表示/JS/確認ダイアログ）＝eeでは能力がカード商品CSV(M03-26)に統合され、M03-36専用フロー（2列CSV・専用URL・専用画面）はee未実装 → **TBD（要仕様確認: M03-36を専用機能としてee移行するか、M03-26統合を維持し当母集合をM03-26へ集約するか）**。(c)**pf固有でeeに構造上存在しない挙動**（補助表 dtb_product_sub 不在の実行時例外）＝**excluded（B15非該当）**。汎用スタブ・非該当・共通認証はexcluded。
> **会計: bound3／TBD31／excluded61**（R1前の bound0/TBD32/excluded63 は是正）。
>
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（source_class=excel）**: 本機能に**専用設計シートは存在しない**（0204商品管理・66シート。唯一の言及=`別添資料__スマレジ連携機能一覧!C40` の機能名参照のみ）。よって**source_class=excelのclaimは無い**。
- **pf現行md（回帰先・source_class=pf-fallback）**: `functions/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.md`
  （git hash-object `164ae026e6b9a4ed836283564fa96609cbbaaf17`／repo HEAD `dbf8cc3cf2f1d1f70ba4fe854c1a877762b708e4`・branch feat/front-e2e-coverage・2026-07-29観測。以下「pf-md:行」）。
  区分宣言「本機能のカスタマイズ区分は現行踏襲である。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。」（pf-md:11）＝DB/スキーマ/マスタ claim は**移行先ee=正**（pf-mdがその値を記述・source_class=pf-fallback）。
- **pf実source（pf-fallbackの根拠実装）**: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvProductBuyDiscount`:1476／`csvProductBuyDiscountUpload`:1492・成功キー `admin.product.csv_import.save.complete`:1526・行数上限 `CSV_IMPORT_MAX=5010`:391,1516・**render（リダイレクトでなく）**:1482,1509,1519,1537）／`Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php`（商品存在breakAll:126-171・列更新 onReadRow:90,178-205・重複記録:204）／テンプレート `Resource/template/admin/Product/csv_product_buy_discount.twig`。
- **ee実source（SUT・DB/スキーマ claim検証根拠＋照合）**: 買取減額率更新の**統合実装先**＝カード商品CSV（`ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:95,149,344`／`Service/Csv/Importer/Event/ProductCardImportHandler.php:370,581`／`Repository/ProductRepository.php:1543,1566`／nav `app/config/eccube/packages/eccube_nav.yaml:43`）。マスタ/スキーマ＝`Entity/Master/MtbCsvImportType.php:40`・`app/DoctrineMigrations/Version20251125141348.php:112-114`・`Entity/Product.php:1216-1218,577-579`。**専用M03-36ルート/Controller/取込ハンドラ/テンプレートはeeに無い**（`src`＋`app/Customize` 全grepで `product_buy_discount_csv_upload` ルート・`ProductBuyDiscountImportHandler`・専用nav 0件）。enロケール源 `src/Eccube/Resource/locale/messages.en.yaml`（source_classに不使用）。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-36-ADMIN-PRODUCT-PRODUCT-BUY-DISCOUNT-CSV-IMPORT-001..095`（95件・欠番0・重複0）。
- **source_class は pf-fallback のみ**（excel設計シート不在／standard-src/design/implementation 付与ゼロ＝Gate G2。ee実sourceはDB/スキーマ claim の検証根拠・照合に用いオラクルの source_class には不使用）。
- **en（en-grep実施）**: ee `messages.en.yaml` 実在。共通アップロード画面ラベルは英訳あり（`admin.product.product_management`=「Products」／`admin.common.csv_upload`=「Upload a CSV file」:1804／`admin.common.required`=「Required」:1785／`admin.common.csv_format`=「CSV file format」:1806／`admin.common.csv_skeleton_download`=「Download a template」:1805／`admin.common.count`=「%count% items」:1792）＝L1-001/002はLS=1。pf成功キー `admin.product.csv_import.save.complete`（pf現行「商品登録CSVファイルをアップロードしました。」`pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133`）は**ee messages.en.yaml/ja.yaml いずれにも不在**＝英訳なしLS=0（grep 0件）。行数上限キー `admin.csv.error.upload.maxrecord` は en.yaml 不在（ja.yaml:1626のみ）＝英訳なしLS=0。

---

## §1 L1原子オラクル表

全18claim。**source_class列は pf-fallback のみ**（excel設計シート不在＝excel源0）。bound候補（3件）が検証するのは L1-016/017/018（DB/スキーマ/マスタ・pf-mdの「移行先ee=正」記述をeeで確認）。L1-001〜015はdocumentation-only（M03-36専用フローがee未実装＝§9.1のTBD理由に紐付く。買取減額率更新能力はM03-26統合で実在）。LS=1（ee messages.en.yaml逐語）＝L1-001/002。他はLS=0。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0336-001 | http_entry | ナビ「商品管理」→「CSV管理」内「買取減額率変更CSV登録」から `GET /{admin_route}/product/product_buy_discount_csv_upload` を開くと、アップロードフォーム・フォーマット説明表・直近のインポート履歴が表示される（現行踏襲。SUT=eeには本専用ルートが無く404＝実行はTBD） | 「管理画面メニュー「商品管理」→「CSV管理」内「買取減額率変更CSV登録」｜`GET /{admin_route}/product/product_buy_discount_csv_upload`｜アップロードフォーム、フォーマット説明表、直近のインポート履歴が表示される。」 | pf-md:36,55 | pf-fallback | 1 |
| L1-M0336-002 | display_field | 画面はページタイトルブロック「商品管理」・サブタイトル「買取減額率変更CSVアップロード」・「CSVファイル選択」ラベル・`import_file` の file 入力（`accept` に `text/csv,text/tsv`）・「CSVファイルのアップロード」ボタン・フォーマット表（列「商品ID」「買取減額率(ID)」）・下部に「CSVインポート履歴」を表示する。サブタイトル/boxTitleはtwigハードコード日本語、共通枠ラベルは共通キー | 「ページタイトルブロックは「商品管理」。サブタイトルは Twig で「買取減額率変更CSVアップロード」。`CSVファイル選択` ラベル、`import_file` の file 入力（`accept` に `text/csv,text/tsv`）、`CSVファイルのアップロード` ボタン、フォーマット表…下部に「CSVインポート履歴」…。」 | pf-md:46／pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_buy_discount.twig | pf-fallback | 1 |
| L1-M0336-003 | display_field | 画面は `card-csvimport.js` とスピナー用 `spin.min.js` を読み込み、送信時の利用者側CSV内容検証は行わず、取込前の確認ダイアログは無い | 「`card-csvimport.js` とスピナー用 `spin.min.js` を読み込む。送信時の利用者側の CSV 内容検証は行わない。」「取込前の確認ダイアログは無い。」 | pf-md:47,49 | pf-fallback | 0 |
| L1-M0336-004 | http_flow | POST取込は、フォーム不正・行数上限・検証・取込のいずれの結末でも**リダイレクトせず同一テンプレートで render** し、フォームを再表示する（成功・失敗どちらも同一URLのHTML）。※pf現行挙動。ee側はカード商品CSV取込が redirect（`CardCsvController.php:149` RedirectResponse）であり、M03-36専用フローはee未実装＝挙動未確定 | 「成功・失敗どちらでも同一テンプレートでレスポンスする（リダイレクトではなく render）。」「POST 成功｜同一 URL を再描画（リダイレクトなし）」「POST 失敗｜同一 URL を再描画」 | pf-md:77,219,220／pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1509,1519,1537 | pf-fallback | 0 |
| L1-M0336-005 | message | 取込結果にエラーが無いとき、成功フラッシュ（キー `admin.product.csv_import.save.complete`／pf現行文言「商品登録CSVファイルをアップロードしました。」）を積み、完了ログ＋count を出し、`csv_import_type` id 13 として `dtb_csv_import_history` に元ファイル名と操作者を挿入する（成功時のみ）。当キーはee messages.en.yaml/ja.yamlに不在＝英訳なし | 「成功時は成功フラッシュ（`admin.product.csv_import.save.complete`）、完了ログと処理件数、かつ `csv_import_type` id 13 としてインポート履歴に元ファイル名と操作者を挿入する。」「インポート履歴｜成功時のみ…記録する。失敗時は追記されない。」 | pf-md:76,153／pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1526,1529,1531 | pf-fallback | 0 |
| L1-M0336-006 | data_write | 各行の `onReadRow` で買取減額率列（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub.buy_discount_id`）を UPDATE する。買取減額率(ID)列が空のとき変換結果は `null` で `buy_discount_id` に null をセットする。副作用は当列の更新・トランザクションログ・情報ログ・成功時のみCSV履歴 | 「買取減額率列（移行先 `dtb_product.buy_discount_id`…）を更新する。」「買取減額率列が空のとき、変換結果は `null` であり、`UPDATE` の `buy_discount_id` に null がセットされる実装である。」「副作用｜買取減額率列…の更新、トランザクションログ、情報ログ、成功時のみ CSV 履歴。」 | pf-md:108,117,171／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:90,196 | pf-fallback | 0 |
| L1-M0336-007 | validation | 更新単位は1 CSV行につき1商品IDであり、規格（`dtb_product_class`）ごとの更新は行わない | 「更新単位｜1 CSV 行につき 1 商品 ID。規格…ごとの更新は行わない。」 | pf-md:116 | pf-fallback | 0 |
| L1-M0336-008 | data_write | 同一ファイル内に同一商品IDが複数行あるとき、後から処理された行が最終的な値を残す（エラーにはしない） | 「同一ファイル内に同一商品 ID が複数行あれば、後から処理された行が最終的な値を残す（エラーにはしない）。」 | pf-md:118／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:178,204 | pf-fallback | 0 |
| L1-M0336-009 | validation | 商品ID列は必須で、空でなく符号なし整数形式であること。更新対象は `dtb_product.product_id` である | 「商品 ID｜必須｜…更新対象の `dtb_product.product_id`。」「商品 ID｜空でなく、符号なし整数形式。」 | pf-md:135,201／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:48,131 | pf-fallback | 0 |
| L1-M0336-010 | validation | 商品存在チェックは `dtb_product` のみを参照し、`product_id` が存在し無効化されていない（現行は `del_flg=0`）ことを原生SQLで確認する。存在しない場合は商品不存在エラーを積み `breakAll`（以降の行は処理されずロールバック方向） | 「検証は `dtb_product` のみを参照する。」「商品がなければエラー…`breakAll`。」「無い場合は商品不存在エラーで全体打ち切り。」 | pf-md:107,152,181／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:126,138,159 | pf-fallback | 0 |
| L1-M0336-011 | validation | 買取減額率(ID)列は空欄可。値ありのときは符号なし整数形式かつ `mtb_buy_discount.id` に存在すること（存在しなければエラー） | 「買取減額率 ID｜空ならスキップ。値ありなら符号なし整数形式かつ `mtb_buy_discount` に存在。」「`mtb_buy_discount`｜`id`｜CSV 値の参照整合性チェックに使用（存在しなければエラー）。」 | pf-md:106,136,180,202／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:49 | pf-fallback | 0 |
| L1-M0336-012 | validation | （現行pf固有・ee非該当）商品は存在するが補助表 `dtb_product_sub` に行が無いとき、`getProductSubByProductId` が null を返し取得結果へのメソッド呼び出しで実行時例外となりうる（ロールバック方向）。移行先eeは `dtb_product_sub` が無く `dtb_product` へ統合されるため当ケースは起きない | 「商品は存在するが補助表 `dtb_product_sub` に行が無い（現行）｜現行で `getProductSubByProductId` が null を返すと…実行時例外となりうる。…移行先 ec-cube-enterprise では買取減額率が `dtb_product` に統合されるため補助表の不在は起きない。」 | pf-md:142／pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductBuyDiscountImportHandler.php:184 | pf-fallback | 0 |
| L1-M0336-013 | log | 情報ログを、取込開始時「買取減額率変更CSV登録開始」・正常完了時「買取減額率変更CSV登録完了」＋count・検証失敗で打ち切り時「買取減額率変更CSV登録 異常終了」に出す | 「取込開始｜情報ログ「買取減額率変更CSV登録開始」」「正常完了｜情報ログ「買取減額率変更CSV登録完了」と `count`」「検証失敗で打ち切り｜情報ログ「買取減額率変更CSV登録 異常終了」」 | pf-md:74,251,252,253／pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1522,1529,1535 | pf-fallback | 0 |
| L1-M0336-014 | data_write | （現行pf）他列の扱いは、既存の補助表 `dtb_product_sub` を取得し、説明・サイズ・割引率などCSV以外の現行値のまま `UPDATE` 文に載せる。移行先eeでは買取減額率が `dtb_product.buy_discount_id` へ統合され、同等の引き継ぎは `ProductRepository::updateProduct`（pfのupdateProductSub統合）で行われる | 「現行は既存の補助表 `dtb_product_sub` を取得し、説明・サイズ・割引率などは CSV 以外の現行値のまま `UPDATE` 文に載せる。移行先 ec-cube-enterprise では買取減額率は `dtb_product.buy_discount_id` へ統合される。」 | pf-md:119／ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1543 | pf-fallback | 0 |
| L1-M0336-015 | file_handling | アップロードファイルは一時領域へ保存後、取込パイプライン（`CsvImporter`）が読み取る。文字コード変換・改行正規化・BOM/ゼロ幅除去、tsvはタブ区切り、先頭行ヘッダ・データ行0でエラー、単一トランザクションで処理し取込後に一時ファイルを削除する | 「アップロード一時領域へ保存後、取込パイプラインが読み取る。」「先頭行をヘッダとみなし、2 行目以降に 1 件もデータが無ければ事前エラーとする。」「取込全体は単一トランザクションに載る。」 | pf-md:129,81,84,85,88 | pf-fallback | 0 |
| L1-M0336-016 | db_schema | 取込種別マスタ `mtb_csv_import_type` に id=13・名称「買取減額率変更登録」が登録されている（移行先ee=正）。SUT(ee)のマイグレーション定義で確認できる | 「`mtb_csv_import_type`｜`id = 13`｜名称「買取減額率変更登録」（マイグレーション定義の確認値）。移行先にも存在。」 | pf-md:182／ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:40／ec-cube-enterprise/app/DoctrineMigrations/Version20251125141348.php:112-114 | pf-fallback | 0 |
| L1-M0336-017 | db_schema | 買取減額率は補助表 `dtb_product_sub` でなく `dtb_product.buy_discount_id`（`mtb_buy_discount` への外部参照列）に統合されている（移行先ee=正・`dtb_product_sub` 不在）。SUT(ee)の商品編集画面で買取減額率を設定・再表示すると `dtb_product.buy_discount_id` に反映される | 「補助表 `dtb_product_sub` は無く、`dtb_product.buy_discount_id`（`mtb_buy_discount` への外部参照列）に統合されている」「移行先では商品本体 `dtb_product` の列…」 | pf-md:23,179／ec-cube-enterprise/src/Eccube/Entity/Product.php:1216-1218 | pf-fallback | 0 |
| L1-M0336-018 | db_schema | `dtb_product` に `del_flg` 列が無く、公開状態は `product_status_id`（`mtb_product_status`）で表す（移行先ee=正）。SUT(ee)の商品編集画面で公開ステータスを設定すると `dtb_product.product_status_id` に反映される | 「`dtb_product` に `del_flg` 列が無く、公開状態は `product_status_id`（`mtb_product_status`）で表す」 | pf-md:24,181／ec-cube-enterprise/src/Eccube/Entity/Product.php:577-579 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。bound（C-001〜003）はSUTのマスタ/スキーマ確認と商品編集画面での反映確認に用いる。TBDのM03-36専用取込CSV/SEEDはee専用フロー移行実装後に実行可能となる設計参考。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0336-MASTERS | 前提マスタ | 買取減額率マスタ `mtb_buy_discount`（既知ID集合）・取込種別 id13・商品公開ステータス `mtb_product_status` | 不要（参照） |
| SEED-M0336-TARGET | bound用 更新対象商品 | 既存商品1件（`dtb_product.product_id` 既知・現行 buy_discount_id=B0・公開ステータス既知） | 対象商品を更新前へ復元 |
| SEED-M0336-VALID | （専用フロー参考）正常取込 | 商品ID=対象・買取減額率(ID)=B1（≠B0・`mtb_buy_discount` に存在）の1行CSV | 対象商品を復元 |
| SEED-M0336-NULLDISCOUNT | （参考）空欄=NULL反映 | 商品ID=対象・買取減額率(ID)=空の1行CSV | 対象商品を復元 |
| SEED-M0336-DUPID | （参考）重複商品ID | 同一商品IDを2行（買取減額率=B1／B2）持つCSV | 対象商品を復元 |
| SEED-M0336-BADPRODUCTID | （参考）商品不存在breakAll | 存在しない商品IDの1行CSV | 不要（打ち切り） |
| SEED-M0336-BADDISCOUNT | （参考）買取減額率ID不存在 | `mtb_buy_discount` に無い買取減額率IDの1行CSV | 不要（エラー） |

---

## §3 取込CSV列マトリクス（参照情報・pf現行）

pf専用取込CSVは**2列のみ**（雛形 `product_buy_discount.csv`・UTF-8 BOM付き）。ee統合先（カード商品CSV M03-26）は多列で、うち「買取減額率(ID)」列が `buy_discount_id` を更新する（`CardCsvController.php:344`）。

| 区分 | 列 | 保存先・扱い | 根拠 |
|---|---|---|---|
| 必須/キー | 商品ID | 更新対象 `dtb_product.product_id`（存在・非削除確認） | pf-md:135,66 |
| 任意 | 買取減額率(ID) | `dtb_product.buy_discount_id`（現行 `dtb_product_sub.buy_discount_id`）。空欄=NULL。値ありは `mtb_buy_discount.id` に存在 | pf-md:136,66／ee CardCsvController.php:344 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝bound 3候補を実体掲載）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0336C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **bound 3候補**は、専用M03-36画面が無いeeでも一意にDB確認できるスキーマ/マスタ事実（B8観点補正＋商品編集/CSV管理画面の実UI＋DB確認）。買取減額率のCSV更新挙動そのものはカード商品CSV(M03-26)統合のため、M03-36の専用フロー挙動はboundにしない（§9.1 TBD）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-36_admin_product_product_buy_discount_csv_import	E2E-M0336C-001	IT-27	マスタ定義	P1	取込種別マスタに買取減額率変更登録(id13)が登録されている	ログイン済(SEED-M01-ADMIN)／SEED-M0336-MASTERS	—	1. 商品管理→CSV管理メニューを開きCSV登録系の導線が表示されることを確認 2. db.tsで mtb_csv_import_type の id=13 の名称を確認	SUTの取込種別マスタ mtb_csv_import_type に id=13・名称「買取減額率変更登録」が登録されている ／ 自動検証(内部・DB): db.tsで mtb_csv_import_type.id=13 の name が「買取減額率変更登録」であることを確認（マイグレーション定義どおり） [L1:L1-M0336-016; fixture:SEED-M0336-MASTERS@TBD-D5]				
m03-36_admin_product_product_buy_discount_csv_import	E2E-M0336C-002	IT-27	DBスキーマ	P1	買取減額率は補助表でなくdtb_product.buy_discount_idに統合され商品編集で反映される	ログイン済／SEED-M0336-MASTERS／SEED-M0336-TARGET	対象商品の商品編集画面で買取減額率にB1(mtb_buy_discountに存在)を選択	1. 対象商品の商品編集画面を開き買取減額率選択欄にB1を選択して保存 2. 保存後に同画面を再表示し買取減額率がB1であることを確認 3. db.tsで dtb_product.buy_discount_id と dtb_product_sub の有無を確認	商品編集画面で選択した買取減額率B1が保存・再表示に反映される。買取減額率は補助表 dtb_product_sub ではなく dtb_product.buy_discount_id(mtb_buy_discountへの外部参照列)に統合されている ／ 自動検証(内部・DB): db.tsで 対象 dtb_product.buy_discount_id がB1に更新され、dtb_product_sub テーブルが存在しないことを確認 [L1:L1-M0336-017; fixture:SEED-M0336-TARGET@TBD-D5]				
m03-36_admin_product_product_buy_discount_csv_import	E2E-M0336C-003	IT-27	DBスキーマ	P2	公開状態はproduct_status_idで表されdel_flg列は無い	ログイン済／SEED-M0336-MASTERS／SEED-M0336-TARGET	対象商品の商品編集画面で公開ステータスを変更	1. 対象商品の商品編集画面を開き公開ステータスを別の値へ変更して保存 2. 保存後に再表示し公開ステータスが変更後の値であることを確認 3. db.tsで dtb_product.product_status_id と del_flg列の有無を確認	商品編集画面で変更した公開ステータスが保存・再表示に反映される。公開状態は dtb_product.product_status_id(mtb_product_status)で表され、dtb_product に del_flg 列は無い ／ 自動検証(内部・DB): db.tsで 対象 dtb_product.product_status_id が変更後の値に更新され、dtb_product に del_flg 列が存在しないことを確認 [L1:L1-M0336-018; fixture:SEED-M0336-TARGET@TBD-D5]				
```

---

## §5 ja/en locale対応表（en-grep実施・ee messages.en.yaml逐語）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用）。LS=1のclaim（L1-001/002）のみen行を持つ。

| L1 | キー | ja逐語 | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| L1-001 | admin.product.product_management | 商品管理 | Products | messages.en.yaml（`admin.product.product_management`） |
| L1-002 | admin.common.csv_upload | CSVファイルのアップロード | Upload a CSV file | messages.en.yaml:1804 |
| L1-002 | admin.common.required | 必須 | Required | messages.en.yaml:1785 |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | messages.en.yaml:1806 |
| L1-002 | admin.common.csv_skeleton_download | 雛形ダウンロード | Download a template | messages.en.yaml:1805 |
| L1-002 | admin.common.count | %count% 件 | %count% items | messages.en.yaml:1792 |
| L1-002（サブタイトル・LS=0） | （twigハードコード） | 買取減額率変更CSVアップロード | （翻訳キーでなくtwig直書き＝英訳なし） | — （csv_product_buy_discount.twig `{% block sub_title %}`） |
| L1-005（成功フラッシュ・LS=0） | admin.product.csv_import.save.complete | 商品登録CSVファイルをアップロードしました。 | （ee messages.en.yaml/ja.yamlに**不在**＝英訳なし。pf現行 `pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133`） | — |
| （行数上限・母集合行なし・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （en.yaml不在＝英訳なし・ja: messages.ja.yaml:1626） | — |

- LS=0のclaim（L1-003〜018）はロケール変異なしまたは英訳なし＝`-EN`行を持たない。
- **en-grep根拠（レビュー用）**: `admin.common.csv_upload`/`admin.common.csv_upload_complete`/`admin.common.required`/`admin.common.csv_format`/`admin.common.csv_skeleton_download`/`admin.common.count` は messages.en.yaml にヒット（LS=1）。`admin.product.csv_import.save.complete` は ee en/ja とも0件（LS=0）。`admin.csv.error.upload.maxrecord` は en.yaml 0件・ja.yaml:1626のみ（LS=0）。

---

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- **bound（C-001〜003）**: SUTに実在するマスタ/スキーマ/画面で判定する。C-001=商品CSV管理nav（`eccube_nav.yaml:43`・カード商品CSV等の導線）＋db.tsで `mtb_csv_import_type` id13名称。C-002/003=商品編集画面（買取減額率選択欄＝`dtb_product.buy_discount_id`／公開ステータス＝`product_status_id`）で設定・再表示し、db.tsでDB列を確認（`dtb_product_sub` 不在・`del_flg` 列不在の否定的事実はB9のDB直接参照）。
- **TBD（M03-36専用フロー）**: 買取減額率更新能力はeeでカード商品CSV(M03-26)に統合実装されるが、M03-36の専用2列CSV・専用URL・専用画面はee未実装。専用画面固有挙動（GET表示/JS/確認ダイアログ/render/専用ログ）・専用フローの入力契約はSUTで実行できない＝要仕様確認（§9.1）。
- L1解決器・取込CSV fixture・SEED manifest契約・アサートヘルパは M0成果物（D5/D8/D9型）として未実装。本骨子は「ハーネス完成後にこう書く」契約。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001 | Playwright＋DB確認 | 画面（CSV管理nav）＋DB（マスタ） | 取込種別 id13 名称はマスタ確認＋navの実在確認 |
| C-002,C-003 | Playwright＋DB確認 | 画面（商品編集の反映）＋DB（列・否定的事実） | buy_discount_id統合／product_status_id・del_flg無し。画面反映＝主、`dtb_product_sub`不在・`del_flg`列不在はDB副次（B9） |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: `dtb_product_sub` テーブル不在・`del_flg` 列不在の否定的事実、取込種別マスタ登録値。買取減額率/公開ステータスの反映値は商品編集画面で目視するのが主。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。DB/スキーマ/マスタが一意にDB確認できる行はbound、M03-36専用フロー固有挙動（能力はM03-26統合）はTBD、pf固有でeeに構造上存在しない挙動・汎用スタブ・非該当・共通認証はexcluded。

### 集計（95 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **3** | -077（取込種別id13名称）／-085（buy_discount_id統合）／-086（product_status_id・del_flg無し）。SUTで一意にDB/スキーマ確認できる（B8観点補正＋商品編集/CSV管理画面＋DB確認） |
| **TBD** | **31** | 買取減額率更新能力はeeでカード商品CSV(M03-26)に統合実装済だが、M03-36の専用2列CSV・専用URL・専用画面はee未実装＝要仕様確認（専用機能としてee移行 or M03-26統合維持で当母集合をM03-26へ集約）。§9.1 |
| **excluded** | **61** | 汎用スタブ・非該当観点（ファイル/レコード操作）・共通認証・pf固有でeeに構造上存在しない挙動・内部注記。§9.3 |
| 合計 | **95** | 欠番0・理由なし重複0 |

> 会計: bound 3／TBD 31／excluded 61（=95・欠番0）

- **B7非該当観点excluded**: 削除/移動・リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ（-048,-049,-051,-063〜-072）。
- **B14共通認証excluded**: -052,-080。
- **B8観点補正＝5件**（bound3行の母集合ラベル誤り＋TBD -044/-045 の同一ラベル差別化。§8.1）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（5件）。**

| 母集合 | 母集合観点ラベル | 正しい観点 | 根拠 |
|---|---|---|---|
| -044 | 削除条件 | 画面遷移（POST後 成功系の同一URL再描画） | L1-004（-045と別要件＝成功系。母集合ラベル「削除条件」は誤り） |
| -045 | 削除条件 | 画面遷移（POST後 失敗系の同一URL再描画） | L1-004（-044と別要件＝失敗系。母集合ラベル「削除条件」は誤り） |
| -077 | 排他制御 | マスタ定義（取込種別 mtb_csv_import_type id13） | L1-016。母集合ラベル「排他制御」は誤り |
| -085 | 画面レイアウト | DBスキーマ（買取減額率の保存先 dtb_product.buy_discount_id 統合） | L1-017。母集合ラベル「画面レイアウト」は誤り |
| -086 | 一覧 | DBスキーマ（公開状態列 product_status_id・del_flg無し） | L1-018。母集合ラベル「一覧」は誤り |

### 95対応表（期待テキスト要旨／前提の要点→会計→対応）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応 |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容/取込結果が一致（取込機能に「出力失敗」非該当＋汎用スタブ） | **excluded** | — |
| 002 | CSRFのファイル出力内容/取込結果が一致（CSRF失敗の固有挙動が一次資料に定義なし・汎用） | **excluded** | — |
| 003 | アップロードフォーム、フォーマット説明表、直近のインポート履歴が表示される（M03-36専用画面のGET表示・専用フローee未実装） | **TBD** | L1-001 |
| 004 | 検証・更新が走る（M03-36専用フローのPOST取込起動・専用endpointee未実装） | **TBD** | L1-004 |
| 005 | ページタイトルブロックは「商品管理」（M03-36専用画面の表示要素） | **TBD** | L1-002 |
| 006 | card-csvimport.js とスピナー用 spin.min.js を読み込む（M03-36専用画面のJS） | **TBD** | L1-003 |
| 007 | 取込前の確認ダイアログは無い（M03-36専用画面のモーダル） | **TBD** | L1-003 |
| 008 | 1 CSV 行につき 1 商品 ID（更新単位・M03-36専用フロー） | **TBD** | L1-007 |
| 009 | 同一ファイル内に同一商品IDが複数行あれば後の行が最終値（重複ID・M03-36専用フロー） | **TBD** | L1-008 |
| 010 | 必須バリデーションでエラー表示され完了しない（前提「他列の扱い」＝汎用ノイズ・観測対象未特定） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（汎用「エラーなし継続」・観測対象未定義） | **excluded** | — |
| 012 | 更新対象の dtb_product.product_id（商品ID列の更新対象キー・M03-36専用フロー検証） | **TBD** | L1-009 |
| 013 | 相関バリデーションでエラー表示され完了しない＋前提「補助表 dtb_product_sub に行が無い（現行）」（pf固有の実行時例外。eeは dtb_product_sub 不在で当ケースが構造上起きない＝B15非該当） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続＋前提「途中行で検証エラー（breakAll）」（前提と期待が矛盾・汎用） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提「成功時出力」＝汎用ノイズ・具体対象なし） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・前提「失敗時出力」） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提「副作用」＝汎用ノイズ・具体対象なし） | **excluded** | — |
| 019 | mtb_buy_discount CSV値の参照整合性チェックに使用（買取減額率ID存在検証・M03-36専用フロー） | **TBD** | L1-011 |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値なし） | **excluded** | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ・前提 mtb_csv_import_type） | **excluded** | — |
| 022 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 023 | 空でなく、符号なし整数形式である（商品ID列バリデーション・M03-36専用フロー） | **TBD** | L1-009 |
| 024 | 登録内容の対象レコードが追加される（汎用スタブ・前提 管理者ログイン） | **excluded** | — |
| 025 | 登録内容の対象レコードが追加される（汎用スタブ・前提 POST後） | **excluded** | — |
| 026 | 登録内容の対象レコードが追加されない（汎用スタブ・前提 取込開始） | **excluded** | — |
| 027 | 登録内容の対象レコードが追加される（汎用スタブ・前提 正常完了） | **excluded** | — |
| 028 | 登録内容の対象レコードが追加されない（汎用スタブ・前提 検証失敗打ち切り） | **excluded** | — |
| 029 | 登録内容の対象レコードが追加される（汎用スタブ・前提 買取減額率の保存先） | **excluded** | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 031 | アップロードフォーム、フォーマット説明表、直近のインポート履歴が表示される（M03-36専用画面のGET表示・003と同義） | **TBD** | L1-001 |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 033 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | **excluded** | — |
| 034 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 035 | 取込前の確認ダイアログは無い（M03-36専用画面のモーダル・007と同義） | **TBD** | L1-003 |
| 036 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 037 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提 重複商品ID） | **excluded** | — |
| 038 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提 他列の扱い） | **excluded** | — |
| 039 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 040 | 更新内容の対象レコードの値が変更されない（汎用スタブ・前提 商品ID） | **excluded** | — |
| 041 | 更新内容の対象レコードの値が変更される（汎用スタブ・前提 dtb_product_sub 行無し） | **excluded** | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提 途中行検証エラー） | **excluded** | — |
| 043 | 検証は dtb_product のみを参照する（データ整合性・M03-36専用フロー） | **TBD** | L1-010 |
| 044 | 同一 URL の HTML（前提 成功時出力＝render同一URL・成功系。B8: 削除条件→画面遷移） | **TBD** | L1-004 |
| 045 | 同一 URL の HTML（前提 失敗時出力＝render同一URL・失敗系。B8: 削除条件→画面遷移） | **TBD** | L1-004 |
| 046 | 買取減額率列の更新、トランザクションログ、情報ログ、成功時のみCSV履歴（副作用・M03-36専用フロー） | **TBD** | L1-006 |
| 047 | mtb_buy_discount CSV値の参照整合性チェックに使用（買取減額率ID存在検証・019と同義） | **TBD** | L1-011 |
| 048 | 削除条件の対象レコードが削除状態にならない（削除は本機能に非該当・B7） | **excluded** | — |
| 049 | 実行結果の対象レコードが削除状態になる（削除は本機能に非該当・B7） | **excluded** | — |
| 050 | 当機能が行う登録・更新で対象テーブルを直接保存（不要な削除は含まない）（内部DB注記・汎用） | **excluded** | — |
| 051 | 実行結果の対象レコードが削除状態になる（削除は本機能に非該当・B7） | **excluded** | — |
| 052 | 表示・取込とも許可される実装である（共通認証・documentation-only・B14） | **excluded** | — |
| 053 | 実行結果のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 054 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 055 | フォーマット定義でエラー表示され完了しない（汎用スタブ・具体対象なし） | **excluded** | — |
| 056 | 実行結果のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 057 | 実行結果のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 058 | 出力内容のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 059 | 出力内容のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 060 | 出力内容のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 061 | 出力内容のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 062 | 出力内容でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 063 | 削除の該当レコードが取得結果に含まれない（削除非該当・B7） | **excluded** | — |
| 064 | 移動・リネームの該当レコードが取得結果に含まれない（非該当・B7） | **excluded** | — |
| 065 | コピーのファイル出力内容/取込結果が一致（非該当・B7） | **excluded** | — |
| 066 | ファイル登録のファイル出力内容/取込結果が一致（非該当・B7） | **excluded** | — |
| 067 | ファイル出力のファイル出力内容/取込結果が一致（出力非該当・B7） | **excluded** | — |
| 068 | JSONのファイル出力内容/取込結果が一致（非該当・B7） | **excluded** | — |
| 069 | 同名ファイルのファイル出力内容/取込結果が一致（非該当・B7） | **excluded** | — |
| 070 | 入力JSONの対象レコードの値が変更されない（JSON非該当・B7） | **excluded** | — |
| 071 | 配置先の該当レコードが取得結果に含まれる（非該当・B7） | **excluded** | — |
| 072 | スキーマのファイル出力内容/取込結果が一致（汎用ファイルスタブ・非該当・B7） | **excluded** | — |
| 073 | 同一 URL の HTML（前提 失敗時出力＝render同一URL・観点初期行数。M03-36専用フローのrender） | **TBD** | L1-004 |
| 074 | 買取減額率列の更新、トランザクションログ、情報ログ、成功時のみCSV履歴（副作用・046と同義） | **TBD** | L1-006 |
| 075 | 更新抑止のファイル出力内容/取込結果が一致（汎用スタブ） | **excluded** | — |
| 076 | 商品の存在チェックに使用（dtb_product＝商品存在検証・M03-36専用フロー） | **TBD** | L1-010 |
| 077 | 名称「買取減額率変更登録」（mtb_csv_import_type id13マスタ名・SUTでDB確認可。B8: 排他制御→マスタ定義） | **bound** | C-001 |
| 078 | 当機能が行う登録・更新で対象テーブルを直接保存（不要な削除は含まない）（内部DB注記・050と同義） | **excluded** | — |
| 079 | 空でなく、符号なし整数形式である（商品ID列バリデーション・023と同義） | **TBD** | L1-009 |
| 080 | 表示・取込とも許可される実装である（共通認証・documentation-only・B14・052と同義） | **excluded** | — |
| 081 | フォームは再表示（M03-36専用画面のPOST後 render 再描画） | **TBD** | L1-004 |
| 082 | 情報ログ「買取減額率変更CSV登録開始」（取込開始ログ・M03-36専用フロー） | **TBD** | L1-013 |
| 083 | 情報ログ「買取減額率変更CSV登録完了」と count（正常完了ログ） | **TBD** | L1-013 |
| 084 | 情報ログ「買取減額率変更CSV登録 異常終了」（打ち切りログ） | **TBD** | L1-013 |
| 085 | 補助表 dtb_product_sub は無く dtb_product.buy_discount_id に統合されている（SUTでスキーマ/画面確認可。B8: 画面レイアウト→DBスキーマ） | **bound** | C-002 |
| 086 | dtb_product に del_flg 列が無く公開状態は product_status_id で表す（SUTでスキーマ/画面確認可。B8: 一覧→DBスキーマ） | **bound** | C-003 |
| 087 | 画面表示データでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 088 | 検証・更新が走る（M03-36専用フローのPOST取込起動・004と同義） | **TBD** | L1-004 |
| 089 | 画面表示データでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 090 | card-csvimport.js とスピナー用 spin.min.js を読み込む（M03-36専用画面のJS・006と同義） | **TBD** | L1-003 |
| 091 | 取込前の確認ダイアログは無い（M03-36専用画面のモーダル・007と同義） | **TBD** | L1-003 |
| 092 | ファイル選択のファイル出力内容/取込結果が一致（汎用ファイルスタブ） | **excluded** | — |
| 093 | 同一ファイル内に同一商品IDが複数行あれば後の行が最終値（重複ID・009と同義） | **TBD** | L1-008 |
| 094 | 現行は既存の補助表 dtb_product_sub を取得し説明・サイズ・割引率などCSV以外の現行値のままUPDATE文に載せる（他列引き継ぎ・pf現行踏襲。ee統合先は ProductRepository::updateProduct・M03-36専用フロー未実装） | **TBD** | L1-014 |
| 095 | アップロード一時領域へ保存後、取込パイプラインが読み取る（ファイルハンドリング・M03-36専用フロー） | **TBD** | L1-015 |

`func_scope_check` 判定: 親95/95会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝31件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| M03-36専用フローがee未実装（買取減額率更新能力はM03-26統合） | -003,-004,-005,-006,-007,-008,-009,-012,-019,-023,-031,-035,-043,-044,-045,-046,-047,-073,-074,-076,-079,-081,-082,-083,-084,-088,-090,-091,-093,-094,-095 | 31 | 各期待は本機能固有の挙動（専用画面のGET表示/JS/確認ダイアログ・render(同一URL)・更新単位・重複ID最終値・商品ID/買取減額率ID検証・商品存在breakAll・副作用/専用ログ・他列引き継ぎ・一時領域保存）をpf現行md＋pf実sourceで記述できる。**買取減額率をCSVで更新する能力そのものはeeでカード商品CSV登録(M03-26)に統合実装済**（CardCsvController.php:344／ProductCardImportHandler.php:370,581／ProductRepository.php:1566）だが、**M03-36の専用2列CSV・専用URL(`product_buy_discount_csv_upload`)・専用画面・専用ログはee未実装**。M03-36の入力契約(2列CSV→専用URL)ではSUTで1回の実行でpass/fail一意判定できず、当該取込挙動はM03-26側で検証される＝**要仕様確認**（M03-36を専用機能としてee移行するか、M03-26統合を維持し当母集合をM03-26へ集約=DELEGするか）。専用フローがee実装された時点で§1のL1を根拠にboundへ再評価可。 |

（合計 31）

### 9.2 要実機／要仕様確認（実行面の保留）

| 事項 | 状態 |
|---|---|
| **M03-36を専用機能としてee移行するか／M03-26統合維持で当母集合をM03-26へ集約(DELEG)するか** | 最重要の要仕様確認。買取減額率更新能力はeeでカード商品CSV(M03-26)に統合実装済だが、専用ルート/画面(`product_buy_discount_csv_upload`)はee未実装。方針確定後にTBD31を bound（専用移行時）または DELEG-excluded（統合維持でM03-26集約時）へ再評価 |
| bound C-001〜003 の実行 | SUTのマスタ(mtb_csv_import_type id13)・スキーマ(dtb_product.buy_discount_id／product_status_id・del_flg無し・dtb_product_sub不在)・商品編集画面の反映。db.ts/画面ヘルパ・SEED manifest（D5型）未整備＝要実機 |
| render vs redirect のee最終挙動 | pf現行はrender（同一URL・リダイレクトなし）。ee統合先カード商品CSVはredirect（CardCsvController.php:149）。M03-36専用フロー移行時の挙動は実装依存＝ee実装後に確定 |
| L1解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D5/D8/D9型）として未実装 |

### 9.3 excluded＝61件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②】汎用「登録/更新/実行結果/出力内容が追加/変更/一致される・されない・継続」スタブ** | -001,-010,-011,-014,-015,-016,-017,-018,-020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042,-053,-054,-055,-056,-057,-058,-059,-060,-061,-062,-075,-087,-089,-092 | 対象レコード・具体列/値・観測対象を母集合行が指定せず内容空虚（-014は前提breakAllと期待「継続」が自己矛盾） |
| **【B7】ファイル/レコード操作系（非該当）** | -048,-049,-051,-063,-064,-065,-066,-067,-068,-069,-070,-071,-072 | 削除/移動・リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。買取減額率変更取込機能に該当なし |
| **【B15③】CSRF未定義スタブ** | -002 | CSRF失敗時の固有挙動が一次資料に定義なし（汎用「一致」スタブ） |
| **【B14】共通認証（documentation-only）** | -052,-080 | 「表示・取込とも許可される実装」＝管理画面ファイアウォール共通（pf-md:210）。単一の観測可能挙動でない |
| **【B15②】内部DB注記スタブ** | -050,-078 | 「対象テーブルを直接保存（不要な削除なし）」はDB内部処理の設計注記で単一の観測可能UI挙動でない |
| **【B15非該当】pf固有でeeに構造上存在しない挙動（R1 Major2是正）** | -013 | 前提「補助表 dtb_product_sub に行が無い（現行）」で実行時例外＝pf固有。eeは dtb_product_sub を持たず買取減額率が dtb_product へ統合されるため当ケースが構造上起きない＝ee非該当（TBDでなくexcluded・B15） |

## §10 特記事項（片側断定せず記録）

1. **★codex Gate C R1 是正（Major3件を全反映・2026-07-29・ee実ソース照合）**:
   - **Major1（統合実装の見落とし＝事実誤認是正）**: 旧版は「eeは Validator のみ／買取減額率CSV変更能力もwhole-feature未実装／bound0」と断定したが**誤り**。専用M03-36ルート/Controller/nav が無いのは事実だが、**買取減額率(ID)のCSV更新は ee のカード商品CSV登録(M03-26)に統合実装済**（GET/POSTルート CardCsvController.php:95,149／nav eccube_nav.yaml:43／取込列 CardCsvController.php:344／validator ProductCardImportHandler.php:370／CSV値→buy_discount_id更新 ProductCardImportHandler.php:581・ProductRepository.php:1543,1566）。よって行単位で再判定し、(a)DB/スキーマ/マスタ一意確認可＝bound・(b)M03-36専用フロー固有挙動（能力はM03-26統合）＝TBD（要仕様確認: 専用ee移行 or M03-26集約DELEG）・(c)pf固有ee非該当＝excluded、へ是正。
   - **Major2（TBD/excluded境界誤り・bound0不成立）**: -013（前提 dtb_product_sub 行無しの実行時例外）はpf固有でeeに dtb_product_sub が無く構造上起きない＝TBDでなく**excluded**（B15非該当）へ。-077/-085/-086 は「UI挙動でない」を理由にexcludedしていたが、SUTで一意にDB/スキーマ確認可能（id=13名称 Version20251125141348.php:112-114／buy_discount_id統合 Product.php:1216-1218／product_status_id・del_flg無し Product.php:577-579）＝**bound**（B8観点補正＋商品編集/CSV管理画面＋DB確認）。会計 bound0/TBD32/excluded63 → **bound3/TBD31/excluded61** へ是正。
   - **Major3（派生TSVがTBDを1件欠落）**: -044/-045 は母集合観点「削除条件」・項目・期待「同一 URL の HTML」が同一のため emit が完全重複として -045 を非出力にしていた（Gate D「TBD全行出力」違反）。**両者は成功系/失敗系の別要件**（前提=成功時出力/失敗時出力）のため、§8.1観点補正で -044=「画面遷移（成功系の同一URL再描画）」・-045=「画面遷移（失敗系の同一URL再描画）」へ差別化し、両行が派生TSVに出力されるよう是正。
2. **Excel設計源が無い**: 0204商品管理（66シート）に本機能の専用設計シートは無く、唯一の言及は `別添資料__スマレジ連携機能一覧!C40` の機能名参照のみ。したがって**source_class=excelのclaimは作らない**（pf-fallback一元）。DB/スキーマ/マスタ claim（L1-016/017/018）は pf-md の「移行先ee=正」記述（pf-md:11,23,24,179,181,182）を source_class=pf-fallback とし、SUT(ee)のマイグレーション/Entityで検証根拠を示す。
3. **pf/ee実装差の実source照合結果**（step2）:
   - **専用機能の有無**: pf=専用ルート/Controller/Handler/twig 実在。ee=専用は無く、買取減額率更新は**カード商品CSV(M03-26)へ統合**。
   - **render vs redirect**: pf現行は成功・失敗とも render（同一URL・`ProductCsvController.php:1537`）。ee統合先カード商品CSVは redirect（`CardCsvController.php:149` RedirectResponse）。M03-36専用フローのee挙動は未確定（TBD）。
   - **成功文言**: pfキー `admin.product.csv_import.save.complete`＝「商品登録CSVファイルをアップロードしました。」（`pf-eccube3/src/Eccube/Resource/locale/message.ja.yml:133`）。**ee messages.en.yaml/ja.yaml に不在**＝英訳なしLS=0（en-grep 0件）。
   - **列数**: pf専用=2列（商品ID・買取減額率(ID)）。ee統合先=カード商品CSVの多列のうち買取減額率(ID)列。
   - **保存先**: 現行=補助表 `dtb_product_sub.buy_discount_id`／ee=`dtb_product.buy_discount_id`（統合・Product.php:1216-1218）。公開状態=ee は `product_status_id`（`del_flg` 列なし・Product.php:577-579）。
4. **UI挙動はee(SUT)を正の規約適用**: bound C-002/003 のUI挙動（買取減額率選択欄・公開ステータス）はee商品編集画面（実在）を正とし、DB副次で列を確認。M03-36専用画面はeeに無いためその固有UI（accept属性/専用サブタイトル/専用JS）はbindせずTBD（L1にpf現行踏襲値を記録）。en（LS）は共通枠キーがee messages.en.yamlに実在するためL1-001/002をLS=1で記録。
5. **CSV取込Major教訓の反映**: B12完全重複（同一実行）以外の異挙動束ね無し（-044/-045は別要件のため観点補正で差別化・共有しない）／breakAllは商品不存在（`ProductBuyDiscountImportHandler.php:126-171`・ロールバック方向）＝TBD（専用フロー未実装）／B9スナップショットは bound の `dtb_product_sub` 不在・`del_flg` 列不在の否定的事実に限定／成功/失敗表示はpf実source（render・成功フラッシュ・履歴INSERT成功時のみ）で確認済だがSUT検証はTBD／1候補1検証事実の原子化はL1で担保。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（5件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 044 | 画面遷移（成功系の同一URL再描画） | 期待「同一 URL の HTML」＋前提「成功時出力」（L1-004・成功系）。母集合ラベル「削除条件」は誤り。-045(失敗系)と別要件 |
| 045 | 画面遷移（失敗系の同一URL再描画） | 期待「同一 URL の HTML」＋前提「失敗時出力」（L1-004・失敗系）。母集合ラベル「削除条件」は誤り。-044(成功系)と別要件 |
| 077 | マスタ定義（取込種別 mtb_csv_import_type id13） | 期待「名称『買取減額率変更登録』（マイグレーション定義の確認値）」（L1-016）。母集合ラベル「排他制御」は誤り |
| 085 | DBスキーマ（買取減額率の保存先 dtb_product.buy_discount_id 統合） | 期待「補助表 dtb_product_sub は無く dtb_product.buy_discount_id に統合されている」（L1-017）。母集合ラベル「画面レイアウト」は誤り |
| 086 | DBスキーマ（公開状態列 product_status_id・del_flg無し） | 期待「dtb_product に del_flg 列が無く公開状態は product_status_id で表す」（L1-018）。母集合ラベル「一覧」は誤り |
