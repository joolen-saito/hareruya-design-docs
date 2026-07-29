# 候補: m03-30 セール用価格変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合106全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1 Major6件 是正反映版（2026-07-29・ee/pf実ソースfile:line照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-27 グッズ商品CSV登録**（委員会承認テンプレ）の構造を踏襲。値・claim・列名・メッセージはM03-30自身の一次資料（Excel実セル `0204:セール用価格変更CSVアップロード!<cell>`／pf実source／ee実source）から取得。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。system-under-test=ee。source_classは excel／pf-fallback のみ。
> **R1 Major1（source_class純度）是正の原則**: UI挙動・URL・render/redirect・画面構成・成功文言など**pf現行とeeで実装が食い違う点は、pf現行が実際にやる挙動のみ pf-fallback**とし、**Excel実設計が規定するならexcel源、Excel規定なくpf/ee食い違いならTBD**。1claim1source徹底。
>   - pf実URL=`/product/product_price_csv_upload`（GET/POST同一・ProductServiceProvider.php:124,127）／ee=`/product/product_price/product_price_csv_upload`＋`/product/product_price/import`（別URL）→URLはee環境詳細でオラクルにしない。
>   - pfは成功・フォーム不正・行数超過とも `render`（ProductCsvController.php:897,912,932）／eeは302リダイレクト→render/redirect機構は食い違いでオラクルにしない（共通の観測＝アップロード画面に成否表示のみ）。
>   - pf履歴は固定100件（CSV_IMPORT_HISTORY_LIMIT=100・ProductCsvController.php:392,932）でpage_count/page_noページングなし／件数プルダウン・ページングはExcel識別ID5/ID7が規定→excel源。
>   - pf画面はファイル名ラベル・必須バッジなし（base_csv_upload.twig:24静的ラベル「CSVファイル選択」）／eeはファイル名ラベルあり→ファイル名ラベルはpf/ee食い違いExcel規定なし＝TBD。
>   - pf価格履歴判定は販売・買取価格のみ（ProductPriceImportHandler.php:476）でL1-015はpf現行に合わせ基準価格比較を含めない。
> DB直接参照（B9）は外部IFで検知不能な否定的事実（breakAllロールバック＝何も書かれない）に限る。画面で見える反映値（販売価格・セールフラグ・フラッシュ・履歴テーブル）は画面で目視しDB二重検証しない。
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29 R1是正後）。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  シート「セール用価格変更CSVアップロード」（機能名「セール用価格変更CSV登録」・概要「セール用の価格変更をCSVにて一括で更新する」・更新日2025-09-16）。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は実Excel座標 `0204:セール用価格変更CSVアップロード!<セル>` で表記する。
  当該シートは (a)処理概要のカスタマイズ規定（D88-G120＝セール状態突合の販売価格決定＋アラート表示 逐語）と (b)画面部品（識別ID1-7）の実セルを持つ。HTML上の処理フロー全文ブロックはpf-md再描画でありExcel実セルでないためオラクルにしない。
- **pf実source（pf現行挙動の正・source_class=pf-fallbackの根拠実装）**: `pf-eccube3/app/Plugin/HareruyaEc/`。以下「pf-ctrl:行」=`Controller/Admin/Product/ProductCsvController.php`（csvProductPriceUpload:886-940・render返却）、「pf-handler:行」=`Service/Csv/Importer/Event/ProductPriceImportHandler.php`（updateProductClassAndSub:368-388・注意メッセージ分岐なし）、URLは `ServiceProvider/Admin/ProductServiceProvider.php:124,127`、画面は `Resource/template/admin/Product/base_csv_upload.twig`、pf成功文言 `src/Eccube/Resource/locale/message.ja.yml:133`。
- **pf現行md（参照のみ・鵜呑みにしない）**: `functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md`（git hash-object `1d318f03c355fc95a53834d31203c4423c494c61`／repo HEAD `cc0096784bdcbd28931a72be0a9e2ce5b19671bd`）。**pf-mdはEE挙動を記述する箇所があるため、pf現行オラクルは上記pf実sourceでfile:line確認した**。以下pf-md参照は「pf-md:行」。
- **ee実source（system-under-test・オラクルには不使用・照合とenロケール源）**: `ec-cube-enterprise/src/Eccube/`。「ee-ctrl:行」=`Controller/Admin/Product/Csv/ProductPriceCsvController.php`、「ee-handler:行」=`Service/Csv/Importer/Event/ProductPriceImportHandler.php`、`Service/Csv/Importer/CsvImporter.php`（commit条件:270）、`Service/Csv/Importer/MessageStore.php`、twig `Resource/template/admin/Product/base_csv_upload.twig`・`csv_import_history.twig`、enロケール源 `Resource/locale/messages.en.yaml`・ja源 `messages.ja.yaml`。
- fid_kubun.tsv 相当 `M03-30｜m03-30_admin_product_product_product_price_csv_import｜セール用価格変更CSV登録｜対象｜カスタマイズ｜excel-primary+pf-fallback｜0`（暫定・確定はD6）。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-30-ADMIN-PRODUCT-PRODUCT-PRODUCT-PRICE-CSV-IMPORT-001..106`（106件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation/ee は付与ゼロ＝Gate G2）。ee実sourceは挙動照合とenロケール源に使い、オラクルの source_class には不使用。
- **en（要grep済・R1 Major5是正）**: ee画面が実際に描画するキーで英訳ありは `admin.product.product_management`=「Products」(en:1930)／`admin.common.csv_upload`=「Upload a CSV file」(en:1804)／`admin.common.csv_skeleton_download`=「Download a template」(en:1805)／`admin.common.required`=「Required」(en:1785)／`admin.common.count`=「%count% items」(en:1792)／`admin.common.search_no_result`(en有)。**英訳なし（en.yaml不在をgrep確認）**: 画面タイトル系 `admin.product.product_price_csv`／`_upload_title`／`_format_title`（ja:1997-1999）・`admin.common.browse`・`admin.common.csv_import_error`・`admin.common.csv_item_name`・`admin.common.csv_description`・履歴見出し `admin.product.csv_import_history_*`・`admin.csv.error.upload.maxrecord`(ja:1626)・注意メッセージ2種(ja:2127,2128)・`admin.csv.error.product.not_exists`(ja:2416)。**旧版が引用した `admin.common.csv_format` は当画面が描画せず（画面は `csv_format_title` 変数＝`admin.product.product_price_csv_format_title` を描画・base_csv_upload.twig:82）＝誤引用を撤回**。

---

## §1 L1原子オラクル表

全16claim。**source_class列は excel／pf-fallback のみ**（excel5=L1-001/002/003/011/012・pf-fallback11）。LS=1（enロケール変異あり）＝L1-002のみ（アップロードボタン/雛形ボタン/必須バッジのenあり）。他はLS=0（画面タイトル・注意メッセージ・maxrecord・挙動claim等は英訳なしまたは非メッセージ）。
本機能の署名（セール状態突合による販売価格決定L1-011＋セールOFF注意メッセージ表示L1-012）はExcel実セルD88-G119が規定しeeが実装、**pf現行handler（pf-handler:368-388）は当該分岐を持たず常にCSV販売価格を反映＝pf/ee食い違い・pf現行陳腐化**のため source_class=excel。件数プルダウン/ページング（L1-003）もpf現行は固定100件でページングなし＝Excel識別ID5/ID7が規定するexcel源。

**オラクル記録の被覆状況（正直分類）**: 本表16claimのうち documentation-only は L1-013（買取換算・マスタfixture必須で一意固定不能・-006/-105 TBD）・L1-014（タグ全置換・母集合固有行なし）・L1-015（価格履歴増分・母集合固有一意行なし）・L1-016（情報ログ・観測手段未整備・-097/-099 TBD）。残りは bound候補ケースが検証する（§8参照）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0330-001 | http_entry | ナビ「商品管理」→「CSV管理」→「セール用価格変更CSVアップロード」から当該アップロード画面（機能名「セール用価格変更CSV登録」・概要「セール用の価格変更をCSVにて一括で更新する」）へ到達し、画面タイトル/カード見出し「セール用価格変更CSVアップロード」「セール用価格変更CSV」が表示される | 「機能名｜セール用価格変更CSV登録」「概要｜セール用の価格変更をCSVにて一括で更新する」／画面部品ID1「ファイルを選択」 | 0204:セール用価格変更CSVアップロード!N4,AG4,B6,E124 | excel | 0 |
| L1-M0330-002 | display_field | 画面はアップロードフォーム（ファイル選択ボタン・「CSVファイルのアップロード」ボタン）・フォーマット説明表（列名/説明）・雛形ファイルダウンロードボタン・取込履歴一覧（該当レコード＝インポート日時降順）で構成される | 画面部品ID1「ファイルを選択｜ボタン｜ボタン押下で、OS標準のファイル選択ウィンドウを表示」ID2「CSVファイルのアップロードと入力チェックを実施。」ID3「テーブル」ID4「雛形ファイルダウンロード｜ボタン押下で、登録CSVの雛形がダウンロードされる」ID6「該当レコード表示｜インポート履歴データを出力、インポート日時の降順」 | 0204:セール用価格変更CSVアップロード!E124,AB124,AB125,M126,E127,AB127,E129,AB129 | excel | 1 |
| L1-M0330-003 | display_field | 取込履歴の件数プルダウン（選択肢 10,50,100,300,500,1000,2000,10000,12000）とページングリンクで、指定件数・指定ページの取込履歴（日付降順）を同じ画面に表示する | 画面部品ID5「件数｜プルダウン｜選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」ID7「ページング｜リンク｜選択したページへ遷移する」 | 0204:セール用価格変更CSVアップロード!E128,AB128,E130,AB130 | excel | 0 |
| L1-M0330-004 | display_field | 取込前の確認ダイアログ（確認モーダル）はない。「CSVファイルのアップロード」ボタン押下でフォームがそのまま送信される | 「取込前の確認ダイアログはない。」／pf現行は base_csv_upload.twig のフォーム submit ボタンで直接送信（確認モーダルの介在なし） | pf-md:43; pf base_csv_upload.twig:16,36 | pf-fallback | 0 |
| L1-M0330-005 | http_flow | フォームが不正な送信（ファイル未選択＝import_file必須エラーを含む）は各フォームエラーがadminのエラーとして表示され、取込は行われずアップロード画面が（再）表示される | 「フォームをバインドする。不正なら各エラーを admin フラッシュに積み、アップロード画面へ（戻す）。」／pf「if(!isFormValid){ addError(...); return render(...); }」 | pf-md:67; pf-ctrl:896-902; ee-ctrl:140-146 | pf-fallback | 0 |
| L1-M0330-006 | message | 取込結果にエラーが無いとき、admin成功フラッシュが1件表示される。成功文言はpf現行（admin.product.csv_import.save.complete＝「商品登録CSVファイルをアップロードしました。」）とee SUT（admin.register.complete＝「登録が完了しました。」）で食い違うため文言は固定しない（存在のみ判定） | pf「$app->addSuccess('admin.product.csv_import.save.complete', 'admin');」／ee「$this->addSuccess('admin.register.complete', 'admin');」 | pf-ctrl:923; ee-ctrl:188 | pf-fallback | 0 |
| L1-M0330-007 | history | 取込履歴（種別ID 6 PRODUCT_PRICE_IMPORT_CSV_ID・ファイル名・操作者）は取込成功かつ結果にエラーが無いときだけ INSERT され、エラーを含む取込では取込履歴は増えない | pf「else { addSuccess(...); insertCsvImportHistory(...); }」（成功分岐でのみ挿入）／ee「else { ...; insertCsvImportHistory(...); }」 | pf-ctrl:920-926; ee-ctrl:187-194 | pf-fallback | 0 |
| L1-M0330-008 | message | アップロード内容の改行概算行数が定数（pf CSV_IMPORT_MAX＝5010／ee ADMIN_CSV_IMPORT_MAX_ROWS＝5010）以上なら、キー admin.csv.error.upload.maxrecord「%maxRecord% 行を超えるCSVファイルは登録できません。」（%maxRecord%=5010）がadminのエラーとして表示され、取込は行われない。当キーは英訳なし | 「if(countCsvRows(file) >= CSV_IMPORT_MAX){ addError(sprintf(trans('admin.csv.error.upload.maxrecord'), CSV_IMPORT_MAX), 'admin'); return; }」／「%maxRecord% 行を超えるCSVファイルは登録できません。」 | pf-ctrl:391,555,556; ee-ctrl:157（文言は§5・ja:1626） | pf-fallback | 0 |
| L1-M0330-009 | breakAll | 商品IDが商品マスタに存在しない行は「（行番号）行目の 商品ID ではデータを取得できません。」（admin.csv.error.product.not_exists）を積み breakAll（当該行で全打ち切り・後続データ行は評価されない）とする。CsvImporter のコミット可否は count===0 || !hasBreak で、breakAll 発生時は偽＝ロールバックし何も書かれない。当キーは英訳なし | 「商品 ID が商品マスタに存在しない場合はエラーとし、全件打ち切りになる。」「addProductNotExistsError(rowNumber, label); breakAll();」／「%d 行目の %s ではデータを取得できません。」 | pf-handler:186; ee-handler:189-197; ee CsvImporter:270（文言は§5・ja:2416） | pf-fallback | 0 |
| L1-M0330-010 | validation | 各データ行で列数7一致（不一致→フォーマットエラーで打ち切り）・必須列（商品ID/言語(ID)/販売価格/買取価格）・言語IDマスタ存在・数値/桁・セールフラグ0または1・タグID存在・「販売価格≥買取価格」（PriceConsistencyRowValidator・CSV両列を比較）を検証する | 「必須列の検証、言語 ID のマスタ存在、数値・桁数、セールフラグの 0 または 1、タグ ID の存在などを列バリデータが順に検証する。」「new PriceConsistencyRowValidator(sellPriceColumn, buyPriceColumn)」 | pf-handler getColumns/getRowValidators; ee-handler:154,161-167 | pf-fallback | 0 |
| L1-M0330-011 | validation | 検証通過行では、対象商品ID・言語IDから対象規格（high_price_code NULL）を検索し、CSVのセールフラグとDB上のセール状態の組合せで販売価格を決定する: (a)DB無効+CSV有効→通常商品をセール商品へ切替・セールフラグ0→1・販売価格をCSV販売価格に更新。(b)DB有効+CSV有効→販売価格をCSV販売価格に更新・セールフラグは有効のまま。(c)DB有効+CSV無効→セール商品を通常商品へ切替・セールフラグ1→0・販売価格は現在登録済の基準価格からコピーしCSV販売価格は無視。(d)DB無効+CSV無効→通常商品の販売価格は変更しない（既存の販売価格のまま）。全ケース買取価格はCSV買取価格で更新し、基準価格は更新しない | 「販売価格を、CSVに設定されている販売価格に更新する」「販売価格を、現在登録済の基準価格からコピーする」「CSVに設定されている販売価格は無視する」「販売価格は更新しない、現在登録済の販売価格のまま」「買取価格を、CSVに設定されている買取価格に更新する」「基準価格は更新しない」 | 0204:セール用価格変更CSVアップロード!D88,G94,G101,G108,G109,G116,G117 | excel | 0 |
| L1-M0330-012 | message | セールフラグ無効経路では注意メッセージ（アラート）を画面上に表示する: (c)DB有効+CSV無効でCSVに販売価格が設定されている場合「CSVの価格は反映されていない旨(アラート)を画面上に表示」（実装文言 admin.product.price_csv.sell_price_not_reflected「%d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。」）／(d)DB無効+CSV無効「通常商品の販売価格は変更できない旨(アラート)を画面上に表示」（実装文言 admin.product.price_csv.normal_product_sell_price_unchanged「%d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。」）。各データ行につき最大1回。当キーは英訳なし。（本claimはExcelが規定する「アラート表示」まで。取込のコミット可否・成功フラッシュ有無・取込履歴INSERT有無はee実装由来でありExcel規定でないため本claimに混在させない＝-012 TBD） | 「CSVに販売価格が設定されている場合は、CSVの価格は反映されていない旨(アラート)を画面上に表示する」「通常商品の販売価格は変更できない旨(アラート)を画面上に表示する」 | 0204:セール用価格変更CSVアップロード!G111,G119（文言は§5・ja:2127,2128） | excel | 0 |
| L1-M0330-013 | data_write | 買取価格は、CSVの買取価格を床関数で整数化した値をベースに、規格のカード状態ID・買取割引率から換算して規格の買取価格へ更新する。販売価格は決定後に規格の割引率を適用する（documentation-only＝カード状態/買取割引マスタfixtureが必須で母集合行から一意固定不能・-006/-105 TBD） | 「CSV の買取価格を床関数で整数化した値をベースに、規格のカード状態 ID・特価区分・買取割引率からリポジトリの計算式で取得。」 | pf-handler:381,510; ee-handler:352,359 | pf-fallback | 0 |
| L1-M0330-014 | data_write | 検証通過行では、CSVタグ(ID)一覧で当該商品のタグ紐付けを商品ID単位で全置換する（空のときは無タグ相当）（documentation-only＝母集合に固有一意判定行が無い） | 「商品タグを指定 ID 一覧で全置換し」「タグ(ID)｜...｜商品 ID 単位でタグ付けを全置換。」 | pf-handler:286,302,327; ee-handler:288 | pf-fallback | 0 |
| L1-M0330-015 | data_write | 販売価格または買取価格が変化した規格について価格履歴（dtb_price_history）を1件 INSERT する。本取込は基準価格を変更しない（documentation-only＝母集合に固有一意判定行が無い。pf現行判定は販売・買取価格のみ比較） | 「if(oldSellPrice===newSellPrice && oldBuyPrice===newBuyPrice){ return; } ... addHistoryNative(history);」 | pf-handler:476-499; ee-handler:388 | pf-fallback | 0 |
| L1-M0330-016 | log | 取込開始で情報ログ「セール用価格変更CSV登録開始」、結果にエラーがあるとき「セール用価格変更CSV登録 異常終了」、成功時「セール用価格変更CSV登録完了」と件数を記録する（documentation-only＝ログ観測手段が現行ハーネスで未整備・-097/-099 TBD） | 「log_info('セール用価格変更CSV登録開始');」「log_info('セール用価格変更CSV登録 異常終了');」「log_info('セール用価格変更CSV登録完了', ['count'=>...]);」 | pf-ctrl:915,921,924; ee-ctrl:163,183,189 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとしてUI操作でアップロードする。取込CSVは7列（商品ID・言語(ID)・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)）の雛形レイアウトに一致させる。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0330-MASTERS | 取込の前提マスタ | 言語(ID)マスタ・カード状態(NM等)・買取割引/割引カード条件マスタ・取込種別ID6 一式 | 不要（参照） |
| SEED-M0330-NORMAL-TO-SALE | 経路(a) DB無効+CSV有効（通常→セール切替・注意メッセージなし） | 既存商品1件（NM規格・DBセールフラグ無効・現行 販売価格=S0/買取価格=B0 が既知）＋商品IDを指定し 販売価格=S1(≠S0)・買取価格=B1(≤S1)・セールフラグ=1 を与える1行CSV | 対象商品・追加された取込履歴・価格履歴を復元 |
| SEED-M0330-SALE-TO-SALE | 経路(b) DB有効+CSV有効（セール中変更・注意メッセージなし・セールフラグ有効維持） | 既存商品1件（NM規格・DBセールフラグ有効・現行 販売価格=Ssale が既知）＋商品IDを指定し 販売価格=Sb(≠Ssale)・買取価格=Bb(≤Sb)・セールフラグ=1 を与える1行CSV | 対象商品を更新前へ復元 |
| SEED-M0330-SALE-OFF-ALERT | 経路(c) DB有効+CSV無効（セール→通常切替・sell_price_not_reflectedアラート） | 既存商品1件（NM規格・DBセールフラグ有効・現行 基準価格=P0 が既知）＋商品IDを指定し セールフラグ=0・販売価格=S2(≠P0)・買取価格=B2(≤S2) を与える1行CSV（CSV販売価格ありでアラート誘発） | 対象商品を更新前へ復元 |
| SEED-M0330-NORMAL-STAY | 経路(d) DB無効+CSV無効（通常商品・販売価格不変・normal_productアラート） | 既存商品1件（NM規格・DBセールフラグ無効・現行 販売価格=Sn/買取価格=Bn0 が既知）＋商品IDを指定し セールフラグ=0・販売価格=Sd(≠Sn)・買取価格=Bd(≤Sd) を与える1行CSV | 対象商品を更新前へ復元 |
| SEED-M0330-BADPRODUCTID-SENTINEL | breakAll（後続打ち切り）検証の入力 | 2行CSV。row1=商品マスタに存在しない商品ID（breakAll誘発）、row2=別種エラーを誘発するセンチネル行（評価されればrow2エラーを出す）。他列は妥当 | 不要（打ち切り・書込みなし） |
| SEED-M0330-NOFILE | フォーム不正（ファイル未選択）検証 | ファイルを選択せず送信（import_file必須エラーを誘発）。DB書込みは発生しない | 不要（書込みなし） |
| SEED-M0330-MAXROW | 行数上限（5010）検証 | データ行が改行数5010以上のCSV | 不要（拒否・書込みなし） |
| SEED-M0330-HISTORY | 取込履歴のページング検証 | dtb_csv_import_history に種別ID 6 の履歴を複数件（ページング境界跨ぎ・件数プルダウン検証用） | 不要（参照） |

---

## §3 取込CSV列マトリクス（参照情報・雛形7列＝ee-ctrl getCsvHeader / pf getProductPriceCsvHeader）

取込CSV列は雛形 `product_price_template.csv` 1行目と一致し**7列ちょうど**（余分な列＝列数エラー）。個々の列値マッピングは母集合に固有要求行が無くdocumentation-only。

| 列見出し（画面表記） | 必須／任意 | 形式 | 保存先・扱い | 根拠 |
|---|---|---|---|---|
| 商品ID | 必須 | 符号なし整数 | `dtb_product` の存在検証（不存在→全打ち切り） | pf-handler; ee-handler:161 |
| 言語(ID) | 必須 | 言語マスタに存在するID | 規格抽出の `language_id` 条件 | pf-handler; ee-handler:162 |
| 販売価格 | 必須 | 9桁までの非負整数 | セール状態突合で反映可否が決まる（L1-011） | pf-handler; ee-handler:163 |
| 買取価格 | 必須 | 9桁までの非負整数（CSV販売価格を超えない） | 規格単位に換算して買取価格へ更新 | pf-handler; ee-handler:164 |
| セールフラグ | ee=必須ヘッダ／pf-md=任意（空は無効） | 0 または 1 | セール区分更新（DB上セール状態との突合に使用） | ee-ctrl:239; pf-md:135 |
| 帯URL | 任意 | 文字列（空はNULL） | 帯URL列 | pf-handler; ee-handler:166 |
| タグ(ID) | 任意 | カンマ区切りの非負整数（マスタ存在） | 商品ID単位でタグ紐付けを全置換 | pf-handler; ee-handler:167 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 12候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0330C-NNN`。**R2 Major2是正**: L1-011（セール状態×CSVフラグ4分岐）とL1-012（注意メッセージ2種）を各々一意判定する候補で被覆＝C-005(a)DB無効+CSV有効／C-006(b)DB有効+CSV有効／C-008(c)DB有効+CSV無効=sell_price_not_reflected／C-009(d)DB無効+CSV無効=normal_product。ee handler分岐はfile:lineで確認（ee-handler:329-347・saleFlg永続化:366）。
- **検証設計（Gate B6/B9・R3是正）**: 画面期待は**フラッシュ文言（成功/エラー/注意メッセージ）・取込履歴テーブル・再表示の販売価格/セールフラグ**を画面で判定。**HTTP302リダイレクト（ee=SUTの遷移機構・成功も失敗も302／pfのrenderと食い違うがee=SUTなので302が正）は自動検証(内部)列で遷移先(Location)を確認**し200/renderと区別（C-005/C-006/C-012・母集合-049/-082/-083/-090の「HTTP302＋フラッシュ」必須要件を被覆）。DB直接参照は外部IFで検知不能な否定的事実（breakAllロールバック＝何も書かれない）に限る。hasError・count===0||!breakAll 等の実装内部語は用いない。
- 操作手順は純UI操作（ファイル選択→「CSVファイルのアップロード」ボタン押下→結果画面／対象商品再表示）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-001	IT-25	画面表示	P1	アップロード画面の画面タイトルがセール用価格変更CSVアップロードである	ログイン済(SEED-M01-ADMIN)	—	1. ナビ「商品管理」→「CSV管理」→「セール用価格変更CSVアップロード」からアクセスする 2. 画面タイトル/カード見出しを確認	ナビ「商品管理」→「CSV管理」→「セール用価格変更CSVアップロード」から到達した画面のタイトル/カード見出しが「セール用価格変更CSVアップロード」「セール用価格変更CSV」であり、セール用の価格変更をCSVで一括更新する画面である（enロケールではページ見出しがProducts、画面タイトルはja固定） [L1:L1-M0330-001; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-002	IT-25	画面表示	P1	アップロードフォーム・フォーマット説明表・雛形ダウンロード・取込履歴が表示される	ログイン済／SEED-M0330-HISTORY	—	1. アップロード画面を開く 2. ファイル選択ボタン・「CSVファイルのアップロード」ボタン・フォーマット説明表・雛形ファイルダウンロードボタン・取込履歴テーブルが表示されることを確認	アップロード画面にファイル選択ボタン・「CSVファイルのアップロード」ボタン・フォーマット説明表（列名/説明）・雛形ファイルダウンロードボタン・取込履歴テーブル（インポート日時降順）が表示される（enロケールではアップロードボタンUpload a CSV file・雛形ボタンDownload a template・必須バッジRequiredが英語表示） [L1:L1-M0330-002; fixture:SEED-M0330-HISTORY@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-003	IT-25	ページネーション	P2	件数プルダウンとページングで指定件数・指定ページの取込履歴が表示される	ログイン済／SEED-M0330-HISTORY	件数プルダウン（例:50）・ページングリンク	1. 取込履歴の件数プルダウンを50に変更し表示件数が50になることを確認 2. ページングリンクで次ページへ移動し同じ画面で指定ページの履歴が表示されることを確認	取込履歴の件数プルダウン（選択肢 10,50,100,300,500,1000,2000,10000,12000）で選んだ件数で履歴が表示され、ページングリンクで同じアップロード画面に指定ページの取込履歴（インポート日時降順）が表示される [L1:L1-M0330-003; fixture:SEED-M0330-HISTORY@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-004	IT-20	モーダル	P2	「CSVファイルのアップロード」押下時に確認モーダルが表示されずそのまま送信される	ログイン済／SEED-M0330-NOFILE	ファイル未選択（送信して確認ダイアログ有無を観測・DB書込みは発生しない）	1. ファイルを選択せず「CSVファイルのアップロード」ボタンを押下 2. 送信前に確認モーダル・確認ダイアログが表示されないことを確認	「CSVファイルのアップロード」ボタン押下後に確認モーダル・確認ダイアログは表示されず、フォームがそのまま送信される（取込前の確認ダイアログはない） [L1:L1-M0330-004; fixture:SEED-M0330-NOFILE@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-005	IT-26	取込成功（通常→セール切替）	P1	DBセール無効の規格にセールフラグ有効のCSVを取込むと成功し販売価格がCSV値・セールフラグが有効になる	ログイン済／SEED-M0330-MASTERS／SEED-M0330-NORMAL-TO-SALE	既存商品(NM規格・DBセールフラグ無効)の商品IDを指定し 販売価格=S1・買取価格=B1(≤S1)・セールフラグ=1 を与える1行の正常CSVファイル	1. ファイルを選択し「CSVファイルのアップロード」を押下 2. アップロード画面に成功フラッシュが1件表示されエラー・注意メッセージが無いことを確認 3. 商品編集画面で対象商品を再表示し、対象規格の販売価格=S1・セールフラグが有効(セール)になっていることを確認	経路(a)DB無効+CSV有効: 通常→セール切替の取込は成功しアップロード画面に成功フラッシュが1件表示されエラー・注意メッセージは無い。商品編集画面で対象商品を再表示すると対象規格の販売価格＝CSVの販売価格S1・セールフラグ＝有効(セール)が表示される（画面で照合・成功文言はpf/ee食い違いのため存在のみ判定） ／ 自動検証(内部): ee(SUT)は取込成功時もHTTP302リダイレクトで、遷移先(Location)が GET /%eccube_admin_route%/product/product_price/product_price_csv_upload である（200/同一画面renderでなく302リダイレクト・ee ProductPriceCsvController:206） [L1:L1-M0330-006,L1-M0330-011; fixture:SEED-M0330-NORMAL-TO-SALE@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-006	IT-26	取込成功（セール中変更）	P1	DBセール有効の規格にセールフラグ有効のCSVを取込むと成功し販売価格がCSV値・セールフラグが有効のまま維持される	ログイン済／SEED-M0330-MASTERS／SEED-M0330-SALE-TO-SALE	既存商品(NM規格・DBセールフラグ有効)の商品IDを指定し 販売価格=Sb・買取価格=Bb(≤Sb)・セールフラグ=1 を与える1行の正常CSVファイル	1. ファイルを選択し「CSVファイルのアップロード」を押下 2. アップロード画面に成功フラッシュが1件表示されエラー・注意メッセージが無いことを確認 3. 商品編集画面で対象商品を再表示し、対象規格の販売価格=Sb・セールフラグが有効(セール)のままであることを確認	経路(b)DB有効+CSV有効: セール中商品の価格変更取込は成功しアップロード画面に成功フラッシュが1件表示されエラー・注意メッセージは無い。商品編集画面で対象商品を再表示すると対象規格の販売価格＝CSVの販売価格Sb・セールフラグ＝有効(セール)のまま維持されて表示される（画面で照合） ／ 自動検証(内部): ee(SUT)は取込成功時もHTTP302リダイレクトで、遷移先(Location)が GET /%eccube_admin_route%/product/product_price/product_price_csv_upload である（200/同一画面renderでなく302リダイレクト・ee ProductPriceCsvController:206） [L1:L1-M0330-006,L1-M0330-011; fixture:SEED-M0330-SALE-TO-SALE@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-007	IT-26	取込履歴INSERT条件	P1	成功かつ結果にエラーが無いときだけ取込履歴に新行が増える	ログイン済／SEED-M0330-MASTERS／SEED-M0330-NORMAL-TO-SALE／SEED-M0330-BADPRODUCTID-SENTINEL	正常CSV（成功）とエラーCSV（商品ID不存在）の2ファイル	1. 正常CSVをアップロードし取込履歴テーブルに新行が1件増えることを確認 2. 続けてエラーCSVをアップロードし取込履歴テーブルに新行が増えないことを確認	取込履歴は取込成功かつ結果にエラーが無いときだけ新行が増える。正常CSVの取込後は取込履歴テーブルに新行が1件（ファイル名・日時・操作者）増え、エラーを含む取込の後は取込履歴テーブルに新行が増えない [L1:L1-M0330-007; fixture:SEED-M0330-NORMAL-TO-SALE@TBD-D5,SEED-M0330-BADPRODUCTID-SENTINEL@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-008	IT-12	注意メッセージ（セール→通常）	P1	DBセール有効の規格にセールフラグ無効のCSVを取込むとsell_price_not_reflected注意メッセージが表示され販売価格が基準価格からコピーされる	ログイン済／SEED-M0330-MASTERS／SEED-M0330-SALE-OFF-ALERT	既存商品(NM規格・DBセールフラグ有効・基準価格P0)の商品IDを指定し セールフラグ=0・販売価格=S2(≠P0)・買取価格=B2(≤S2) を与える1行CSV	1. セールOFFの更新CSVを選択し「CSVファイルのアップロード」を押下 2. 注意メッセージ（セールフラグを無効にしたため…反映されていません）が画面に表示されることを確認 3. 商品編集画面で対象商品を再表示し、対象規格の販売価格が現在登録済の基準価格P0と一致・セールフラグが無効(通常)であることを確認	経路(c)DB有効+CSV無効: セール→通常切替でCSVに販売価格が設定されているため、対象データ行に注意メッセージ「（行番号）行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。」（admin.product.price_csv.sell_price_not_reflected・英訳なし）が画面に表示される。商品編集画面で対象商品を再表示すると対象規格の販売価格＝現在登録済の基準価格P0（CSVの販売価格S2は反映されない）・セールフラグ＝無効(通常)が表示される（画面で照合） [L1:L1-M0330-011,L1-M0330-012; fixture:SEED-M0330-SALE-OFF-ALERT@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-009	IT-12	注意メッセージ（通常商品）	P1	DBセール無効の規格にセールフラグ無効のCSVを取込むとnormal_product注意メッセージが表示され販売価格が変更されない	ログイン済／SEED-M0330-MASTERS／SEED-M0330-NORMAL-STAY	既存商品(NM規格・DBセールフラグ無効・現行 販売価格Sn)の商品IDを指定し セールフラグ=0・販売価格=Sd(≠Sn)・買取価格=Bd(≤Sd) を与える1行CSV	1. 通常商品のCSVを選択し「CSVファイルのアップロード」を押下 2. 注意メッセージ（通常商品のため、販売価格は変更されませんでした）が画面に表示されることを確認 3. 商品編集画面で対象商品を再表示し、対象規格の販売価格が現在登録済のSnのまま・セールフラグが無効(通常)であることを確認	経路(d)DB無効+CSV無効: 通常商品のため、対象データ行に注意メッセージ「（行番号）行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。」（admin.product.price_csv.normal_product_sell_price_unchanged・英訳なし）が画面に表示される。商品編集画面で対象商品を再表示すると対象規格の販売価格＝現在登録済のSn（CSVの販売価格Sdは反映されない）・セールフラグ＝無効(通常)のままで、買取価格のみ更新されて表示される（画面で照合） [L1:L1-M0330-011,L1-M0330-012; fixture:SEED-M0330-NORMAL-STAY@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-010	IT-12	行数上限	P1	概算行数5010以上のCSVは行数上限エラーが表示され取込されない	ログイン済／SEED-M0330-MAXROW	改行数5010以上のCSVファイル	1. 5010行以上のCSVを選択し「CSVファイルのアップロード」を押下 2. 行数上限エラーの表示と取込が行われないことを確認	エラーメッセージ「5010 行を超えるCSVファイルは登録できません。」（%maxRecord% は上限定数5010に解決・英訳なし＝ja固定）がadminのエラーとして表示され、取込は行われずアップロード画面が表示される（対象規格・取込履歴とも増減なし） [L1:L1-M0330-008; fixture:SEED-M0330-MAXROW@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-011	IT-12	商品ID不存在（breakAll）	P1	存在しない商品IDの行で全打ち切りとなり後続センチネル行が評価されず何も書かれない	ログイン済／SEED-M0330-MASTERS／SEED-M0330-BADPRODUCTID-SENTINEL	2行CSV: row1=存在しない商品ID（breakAll誘発）・row2=別種エラーを誘発するセンチネル行	1. 2行CSVを選択し「CSVファイルのアップロード」を押下 2. row1の商品ID不存在エラーが表示されrow2のエラーが表示されないことを確認 3. 取込履歴テーブルに新行が増えないことを確認	商品IDが商品マスタに存在しないrow1について「（該当行）行目の 商品ID ではデータを取得できません。」（admin.csv.error.product.not_exists・英訳なし）が表示され、全打ち切り（breakAll）により後続row2は評価されずrow2のエラーは表示されない。取込履歴テーブルに新行が増えない ／ 自動検証(内部・DB): breakAllにより対象規格・取込履歴とも書込みが無い（何も書かれない） [L1:L1-M0330-009,L1-M0330-010; fixture:SEED-M0330-BADPRODUCTID-SENTINEL@TBD-D5]				
m03-30_admin_product_product_product_price_csv_import	E2E-M0330C-012	IT-12	フォーム不正	P2	ファイル未選択で送信するとファイル必須のフォームエラーが表示され取込されない	ログイン済／SEED-M0330-NOFILE	ファイルを選択せず送信	1. ファイルを選択せず「CSVファイルのアップロード」を押下 2. ファイル必須のフォームエラーが表示され取込が行われないことを確認	ファイルを選択せず送信するとファイル必須のフォームエラーがadminのエラーとして表示され、取込は行われずアップロード画面が（再）表示される（取込履歴・対象規格とも増減なし） ／ 自動検証(内部): ee(SUT)はフォーム不正時もHTTP302リダイレクトで、遷移先(Location)が GET /%eccube_admin_route%/product/product_price/product_price_csv_upload である（200/同一画面renderでなく302リダイレクト・ee ProductPriceCsvController:145） [L1:L1-M0330-005; fixture:SEED-M0330-NOFILE@TBD-D5]				
```

---

## §5 ja/en locale対応表（ee twig描画キーで照合・要grep済・R1 Major5是正）

**en源=ee `Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。**当画面が実際に描画するキー**（base_csv_upload.twig／csv_import_history.twig の trans）で照合し、「英訳なし」は当該キーが messages.en.yaml に不在であることをgrep確認済み。旧版の `admin.common.csv_format` 引用は当画面が描画しないため撤回。

| L1 | キー（画面描画箇所） | ja逐語 | en逐語 | file:line |
|---|---|---|---|---|
| L1-001 | admin.product.product_management（ページ見出し block title） | 商品管理 | Products | en:1930 |
| L1-001 | admin.product.product_price_csv（ナビ/画面タイトル） | セール用価格変更CSVアップロード | （英訳なし＝en.yamlに不在） | ja:1997 |
| L1-002 | admin.product.product_price_csv_upload_title（カード見出し csv_box_title） | セール用価格変更CSV | （英訳なし＝en.yamlに不在） | ja:1998 |
| L1-002 | admin.product.product_price_csv_format_title（フォーマットカード見出し csv_format_title・base_csv_upload.twig:82） | セール用価格変更CSVファイルフォーマット | （英訳なし＝en.yamlに不在） | ja:1999 |
| L1-002 | admin.common.csv_upload（アップロードボタン・base_csv_upload.twig:74） | CSVファイルをアップロード | Upload a CSV file | en:1804 |
| L1-002 | admin.common.csv_skeleton_download（雛形ボタン・base_csv_upload.twig:83） | 雛形ダウンロード | Download a template | en:1805 |
| L1-002 | admin.common.required（必須バッジ・base_csv_upload.twig:101） | 必須 | Required | en:1785 |
| L1-002 | admin.common.browse（ファイル選択ラベル content・base_csv_upload.twig:11） | 参照 | （英訳なし＝en.yamlに不在） | — |
| L1-002 | admin.common.csv_item_name（フォーマット表見出し・base_csv_upload.twig:90） | 項目名 | （英訳なし＝en.yamlに不在） | — |
| L1-002 | admin.common.csv_description（フォーマット表見出し・base_csv_upload.twig:91） | 説明 | （英訳なし＝en.yamlに不在） | — |
| L1-003 | admin.common.count（履歴件数プルダウン・csv_import_history.twig:12） | %count% 件 | %count% items | en:1792 |
| L1-003 | admin.common.search_no_result（履歴0件時・csv_import_history.twig:38） | 検索結果がありません系 | Sorry, no data matches your search condition(s) | en有 |
| L1-003 | admin.product.csv_import_history_title/_filename/_upload_date/_operator（履歴見出し・csv_import_history.twig:6,24,25,26） | 取込履歴/ファイル名/アップロード日時/操作者 | （英訳なし＝en.yamlに不在） | — |
| L1-006（成功文言・食い違い） | ee: admin.register.complete／pf: admin.product.csv_import.save.complete | ee「登録が完了しました。」／pf「商品登録CSVファイルをアップロードしました。」 | ee「Registration completed.」／pf（英訳なし） | ee ja:1970/en:1676; pf message.ja.yml:133 |
| L1-008（行数上限・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし＝en.yamlに不在） | ja:1626 |
| L1-009（商品ID不存在・LS=0） | admin.csv.error.product.not_exists | %d 行目の %s ではデータを取得できません。 | （英訳なし＝en.yamlに不在） | ja:2416 |
| L1-012（注意メッセージ・LS=0） | admin.product.price_csv.sell_price_not_reflected | %d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。 | （英訳なし＝en.yamlに不在） | ja:2127 |
| L1-012（注意メッセージ・LS=0） | admin.product.price_csv.normal_product_sell_price_unchanged | %d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。 | （英訳なし＝en.yamlに不在） | ja:2128 |

- LS=1のclaimは L1-002 のみ（アップロードボタン Upload a CSV file・雛形ボタン Download a template・必須バッジ Required の en 変異あり）。L1-001の画面タイトル「セール用価格変更CSVアップロード」は product_price_csv で英訳なし＝LS=0（ページ見出し product_management=Products は en あるが画面タイトルそのものは ja 固定）。他のLS=0のclaimはロケール変異なしまたは英訳なし。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（ee twig `csv_product_price.twig`／共通 `base_csv_upload.twig`）のセレクタを再利用（route/URLはee環境詳細・オラクルにしない）。期待値はL1解決器経由。
- 取込結果の検証はフラッシュ／注意メッセージDOM＋取込履歴テーブルDOMを画面で目視（B9・主）。取込効果は対象商品を商品編集で再表示して販売価格・セールフラグの反映確認（B9）。
- 自動検証（内部）は2種: (1)**HTTP302リダイレクトの遷移先(Location)確認**（C-005/C-006/C-012・ee=SUTは成功も失敗も302／200・render・pf挙動と区別＝母集合の「HTTP302＋フラッシュ」必須要件・ee ProductPriceCsvController:145,206）、(2)DB非書込み＝breakAllロールバック時の否定的事実（C-011・外部IFで検知不能）。成功系の反映値・取込履歴の増減は画面で目視しDB二重検証しない（R1 Major6）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVファイルのアップロード」ボタン）。直接POSTは用いない。
2. C-007（セールOFF注意メッセージ）はDBセール有効の規格＋CSVセールフラグ無効＋CSV販売価格ありで経路(c)を誘発する。C-005（クリーン成功）はDBセール無効の規格＋CSVセールフラグ有効で注意メッセージが出ない経路(a)を用いる。
3. C-009はrow1=商品ID不存在（breakAll）＋row2=別種エラーのセンチネルで、後続row2が評価されないこと（breakAll全打ち切り）を一意識別する。
4. 更新系ケース（C-005/C-006/C-007）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。C-004/C-010はファイル未選択＝DB非書込みのため後始末不要。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003,C-004 | Playwright（GUI） | 画面（DOM） | 画面タイトル・構成・件数プルダウン/ページング・確認ダイアログ無し |
| C-005,C-006 | Playwright（GUI＋302内部確認） | 画面（フラッシュ・再表示反映）＋内部（302 Location） | 経路(a)/(b)の取込成功・販売価格=CSV値・セールフラグ有効を画面で判定・HTTP302遷移先を内部確認 |
| C-007 | Playwright（GUI） | 画面（フラッシュ・履歴テーブル） | 取込履歴INSERT条件（成功時+1／エラー時不変）を画面で判定 |
| C-008,C-009 | Playwright（GUI） | 画面（注意メッセージ・再表示反映） | 経路(c)sell_price_not_reflected/(d)normal_productの注意メッセージ＋販売価格決定を画面で判定 |
| C-010 | Playwright（GUI） | 画面（エラー表示） | 行数上限のエラー表示（DB非書込みは自明のため画面のみ） |
| C-012 | Playwright（GUI＋302内部確認） | 画面（エラー表示）＋内部（302 Location） | フォーム不正のエラー表示・HTTP302遷移先を内部確認 |
| C-011 | Playwright＋DB確認 | 画面（エラー表示・履歴不変）＋DB（非書込み） | breakAll全打ち切りの否定的事実（何も書かれない）のみDB副次 |

DB直接参照は**外部IFで検知不能な否定的事実に限る**（B9・C-011のbreakAllロールバック）。取込成功の反映値（販売価格・セールフラグ・取込履歴の増減）は画面で目視可能なため**主は画面・DB二重チェックはしない**（R1 Major6）。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点・内部注記はexcluded（Gate B15）。UI挙動がee固有でpf現行と食い違いExcel規定もない行はTBD（R1 Major1）。

### 集計（106 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **16** | 下表（12ユニーク候補ケース。B12共有〔完全重複・同一実行のみ〕で母集合16行→tsv12行） |
| **TBD** | **8** | -004,-103（ファイル名ラベルはee固有UI・pf現行は静的ラベルでExcel規定なし＝pf/ee食い違い）／-006,-105（買取価格換算はマスタfixture必須で母集合行から一意固定不能）／-012（コミット/hasError/履歴INSERT無しはee実装由来でExcel規定なく純粋観測でTBD）／-093（MSG-002 csv_invalid_format はimport_file NotBlankのため純UI到達不能）／-097,-099（情報ログ観測手段未整備）。§9.1 |
| **excluded** | **82** | 汎用スタブ・矛盾・非該当観点・内部DB/フォーム注記・プレースホルダ・phantom遷移・共通認証委譲（-003）。§9.3 |
| 合計 | **106** | 欠番0・理由なし重複0 |

> 会計: bound 16／TBD 8／excluded 82（=106・欠番0）

- 候補ケース総数 **12**（C-001〜C-012）。bound16件を B12（完全重複・同一実行）でemitすると tsv=ユニーク12。
  - C-001←-102（画面タイトル）／C-002←-100（フォーム・説明・履歴表示）／C-003←-088（件数プルダウン/ページング）／C-004←-005/-104（確認ダイアログなし）
  - C-005←-049（経路(a)DB無効+CSV有効 成功・販売価格=CSV値・セールフラグ有効）／C-006←-082（経路(b)DB有効+CSV有効 成功・販売価格=CSV値・セールフラグ有効維持）／C-007←-053/-086（取込履歴INSERT成功時のみ）
  - C-008←-007（経路(c)DB有効+CSV無効 注意メッセージsell_price_not_reflected＋販売価格=基準価格）／C-009←-106（経路(d)DB無効+CSV無効 注意メッセージnormal_product＋販売価格不変）
  - C-010←-061/-094（行数上限→エラー表示）／C-011←-091（商品ID不存在→breakAll全打ち切り）／C-012←-083/-090（フォーム不正→エラー表示）
- **R2 Major1是正（B14 共通認証委譲）**: -003は観点「未認証」だが当コントローラ（ProductPriceCsvController）は機能固有認可なし・共通管理画面認証のみで、同一画面タイトルは-102で既に被覆済み。B14「他行に被覆が無い場合のみB8補正」により-003は共通認証へ委譲しexcludedとし、-102をboundとした（bound17→16・excluded81→82）。
- **R2 Major2是正（B1 4分岐/2注意メッセージの被覆）**: L1-011（セール状態×CSVフラグ4分岐）とL1-012（注意メッセージ2種）を各分岐一意判定の候補で被覆。C-005(a)DB無効+CSV有効／C-006(b)DB有効+CSV有効／C-008(c)DB有効+CSV無効=sell_price_not_reflected／C-009(d)DB無効+CSV無効=normal_product。各分岐の販売価格決定はee-handler:329-347・saleFlg永続化:366でfile:line確認。母集合-049/-082（成功）を(a)/(b)、-007/-106（注意メッセージ）を(c)/(d)へ1:1割当（各母集合テストIDの独立判定を保持）。
- **R1継承（source_class純度）**: ee固有でpf現行と食い違う UI挙動（ファイル名ラベル-004/-103）・内部挙動（-012のコミット/hasError）でExcel規定なきものはTBD。件数プルダウン/ページング（C-003）はExcel識別ID5/ID7規定＝excel源。販売価格決定/注意メッセージ表示（C-005/006/008/009）はExcel D88-G119/G111/G119規定＝excel源。
- **B7非該当観点excluded**: 検索条件14（-020〜-033）／ファイル操作系（-072〜-081）。§9.3。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（16件）。**（-003は共通認証委譲でexcluded＝観点補正対象外）

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -005 | 出力抑止 | モーダル（確認ダイアログなし） | L1-004 |
| -007 | 状態変化 | 注意メッセージ（セール→通常・sell_price_not_reflected） | L1-012 |
| -049 | 実行結果 | 取込成功（経路(a)通常→セール切替） | L1-006 |
| -053 | 更新内容 | 取込履歴INSERT条件（成功かつエラー無し時のみ） | L1-007 |
| -061 | 実行結果 | メッセージ/画面表示（行数上限→エラー表示） | L1-008 |
| -082 | 初期行数 | 取込成功（経路(b)セール中変更） | L1-006 |
| -083 | 表示順 | 画面表示（フォーム不正→エラー表示） | L1-005 |
| -086 | 排他制御 | 取込履歴INSERT条件（成功かつエラー無し時のみ） | L1-007 |
| -088 | 画面レイアウト | ページネーション（件数プルダウン/指定ページ表示） | L1-003 |
| -090 | 画面レイアウト | 画面表示（フォーム不正→エラー表示） | L1-005 |
| -091 | 画面レイアウト | 取込エラー（商品ID不存在→breakAll） | L1-009 |
| -094 | 画面レイアウト | メッセージ/画面表示（行数上限→エラー表示） | L1-008 |
| -100 | フォーム送信 | 画面表示（フォーム・説明・履歴） | L1-002 |
| -102 | 非同期更新 | 画面表示（画面タイトル） | L1-001 |
| -104 | 公開コンテンツ | モーダル（確認ダイアログなし） | L1-004 |
| -106 | データ正当性 | 注意メッセージ（通常商品・normal_product） | L1-012 |

### 106対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | 画面タイトルは「セール用価格変更CSVアップロード」＋観点「未認証」（当コントローラは機能固有認可なし・共通管理画面認証のみ＝共通認証へ委譲。同一画面タイトルは-102で被覆済み＝B14でB8補正しない） | **excluded** | — |
| 004 | ファイル選択でラベルにファイル名を表示（ee固有UI＝pf現行は静的ラベル「CSVファイル選択」でファイル名非表示・Excel規定なし＝pf/ee食い違い） | **TBD** | — |
| 005 | 取込前の確認ダイアログはない（B8: 出力抑止→モーダル） | bound | C-004 |
| 006 | CSV買取価格を床関数で整数化した値ベースに、カード状態ID・特価区分・買取割引率でリポジトリ計算式取得（実在挙動だがマスタfixture必須で母集合行から一意固定不能） | **TBD** | — |
| 007 | 手順1と2の場合、翻訳キー sell_price_not_reflected もしくは normal_product…（B8: 状態変化→注意メッセージ。経路(c)DB有効+CSV無効=sell_price_not_reflectedへ割当） | bound | C-008 |
| 008 | POST マルチパートの import_file（内部フォームキー名の設計注記・ファイル入力はC-002被覆） | **excluded** | — |
| 009 | dtb_product_class のセール区分更新に使う（内部DBカラム注記・単一観測挙動でない） | **excluded** | — |
| 010 | 必須バリデーションでエラー表示され完了しない（前提「出力CSV」だが期待は汎用・列数不一致は具体対象を名指さず自己矛盾） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（前提「対象規格0件」だが期待は汎用「エラーなし継続」＝観測対象未定義・0件成功はL1挙動範囲外documentation） | **excluded** | — |
| 012 | トランザクションはコミットされうるがhasErrorが真・フラッシュはエラー中心・取込履歴INSERT行われない（このコミット/hasError/履歴無しはee実装由来でExcel規定なく、注意メッセージ表示C-007と別要件＝純粋観測でTBD） | **TBD** | — |
| 013 | 相関バリデーションでエラー表示され完了しない（前提「ファイル行数」だが期待は汎用・行数上限はC-010被覆） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続（前提「一覧エクスポート一致」だが期待は汎用「エラーなし継続」・観測対象未定義） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（前提「高額商品コード付き規格」だが期待は汎用・高額規格は対象外documentation） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提「成功時出力」は汎用ノイズで具体対象を名指さず） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ・前提「失敗時出力」） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提「副作用」は汎用ノイズ） | **excluded** | — |
| 019 | 一括更新用メソッドの引数どおり（前提 dtb_product_class・内部DB注記・汎用） | **excluded** | — |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索非該当・汎用スタブ・B7/B15） | **excluded** | — |
| 021 | 含まれない（検索非該当・汎用スタブ） | **excluded** | — |
| 022 | 含まれる（汎用スタブ・前提 履歴ページャー） | **excluded** | — |
| 023 | 含まれない（汎用スタブ・前提 取込POST） | **excluded** | — |
| 024 | 含まれる（汎用スタブ・前提 フォーム不正） | **excluded** | — |
| 025 | 含まれない（汎用スタブ・前提 CSV形式・列・値・商品不存在） | **excluded** | — |
| 026 | 含まれる（汎用スタブ・前提MSG-001） | **excluded** | — |
| 027 | 含まれない（汎用スタブ・前提MSG-002） | **excluded** | — |
| 028 | 含まれる（汎用スタブ・前提MSG-003） | **excluded** | — |
| 029 | 含まれない（汎用スタブ・前提MSG-004） | **excluded** | — |
| 030 | 含まれる（汎用スタブ・前提MSG-005） | **excluded** | — |
| 031 | 含まれない（汎用スタブ・前提 取込開始） | **excluded** | — |
| 032 | 含まれる（汎用スタブ・前提 取込異常終了） | **excluded** | — |
| 033 | 含まれない（汎用スタブ・前提 取込成功） | **excluded** | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | **excluded** | — |
| 035 | 同上（汎用スタブ） | **excluded** | — |
| 036 | 同上（汎用スタブ） | **excluded** | — |
| 037 | 同上（汎用スタブ） | **excluded** | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定＝C-005で概念被覆） | **excluded** | — |
| 039 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-011で概念被覆） | **excluded** | — |
| 040 | 追加される（汎用スタブ） | **excluded** | — |
| 041 | POST マルチパートの import_file（内部フォームキー名・-008と同型） | **excluded** | — |
| 042 | 追加される（汎用スタブ） | **excluded** | — |
| 043 | 追加される（汎用スタブ・最大長） | **excluded** | — |
| 044 | 追加されない（汎用スタブ・最大長+1） | **excluded** | — |
| 045 | 追加される（汎用スタブ・最小長・前提「注意メッセージのみ・打ち切りなし」＝C-008/C-009で概念被覆） | **excluded** | — |
| 046 | 追加されない（汎用スタブ・最小長-1・前提「ファイル行数」＝C-010被覆） | **excluded** | — |
| 047 | 追加される（汎用スタブ・前提「一覧エクスポート一致」） | **excluded** | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ・前提「高額商品コード付き規格」） | **excluded** | — |
| 049 | HTTP 302 と admin 成功フラッシュ（取込成功・B8: 実行結果→取込成功。経路(a)DB無効+CSV有効へ割当。成功フラッシュ存在＋価格反映を画面判定・HTTP302遷移先は自動検証(内部)で確認） | bound | C-005 |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-005で概念被覆） | **excluded** | — |
| 051 | 更新内容の対象レコードの値が変更されない（汎用スタブ＝C-011で概念被覆） | **excluded** | — |
| 052 | 変更される（汎用スタブ・前提 dtb_product_class） | **excluded** | — |
| 053 | 成功かつ結果オブジェクトにエラーが無いときだけ INSERT（取込履歴条件・B8: 更新内容→取込履歴INSERT条件） | bound | C-007 |
| 054 | 変更される（汎用スタブ・前提 登録/更新） | **excluded** | — |
| 055 | 変更される（汎用スタブ・最大長） | **excluded** | — |
| 056 | 変更されない（汎用スタブ・最大長+1・前提 取込POST） | **excluded** | — |
| 057 | 変更される（汎用スタブ・最小長・前提 フォーム不正） | **excluded** | — |
| 058 | 変更されない（汎用スタブ・最小長-1・前提 CSV形式・列・値・商品不存在） | **excluded** | — |
| 059 | 変更される（汎用スタブ・前提MSG-001） | **excluded** | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ・前提MSG-002） | **excluded** | — |
| 061 | セール用価格変更CSVアップロード画面に遷移する＋前提MSG-003（行数上限・B8: 実行結果→メッセージ/画面表示） | bound | C-010 |
| 062 | 実行結果のファイル出力内容が対象データと一致（汎用スタブ・前提MSG-004） | **excluded** | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・前提MSG-005・観測対象未定義） | **excluded** | — |
| 064 | フォーマット定義でエラー表示され完了しない（汎用スタブ・前提 取込開始・観測対象未定義） | **excluded** | — |
| 065 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・前提 取込異常終了） | **excluded** | — |
| 066 | 同上（汎用ファイルスタブ・前提 取込成功） | **excluded** | — |
| 067 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 068 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 069 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 070 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 073 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | **excluded** | — |
| 074 | コピーのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 075 | ファイル登録のファイル出力内容が対象データと一致（汎用ファイルスタブ・アップロード成否はC-005で被覆） | **excluded** | — |
| 076 | ファイル出力のファイル出力内容が対象データと一致（出力は本機能に非該当） | **excluded** | — |
| 077 | JSONのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 078 | 同名ファイルのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | **excluded** | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当） | **excluded** | — |
| 081 | スキーマのファイル出力内容が対象データと一致（汎用ファイルスタブ・列未指定） | **excluded** | — |
| 082 | HTTP 302 と admin 成功フラッシュ（取込成功・B8: 初期行数→取込成功。経路(b)DB有効+CSV有効へ割当。成功フラッシュ存在＋価格反映を画面判定・HTTP302遷移先は自動検証(内部)で確認） | bound | C-006 |
| 083 | HTTP 302 と admin エラーフラッシュ（フォーム不正・B8: 表示順→画面表示。エラー表示を画面判定・HTTP302遷移先は自動検証(内部)で確認） | bound | C-012 |
| 084 | 更新抑止のファイル出力内容が対象データと一致（汎用スタブ） | **excluded** | — |
| 085 | 一括更新用メソッドの引数どおり（前提 dtb_product_class・内部DB注記・汎用） | **excluded** | — |
| 086 | 成功かつ結果オブジェクトにエラーが無いときだけ INSERT（取込履歴条件・B8: 排他制御→取込履歴INSERT条件） | bound | C-007 (shared) |
| 087 | 当機能が行う登録・更新で対象テーブルを直接保存（不要な削除は含まない）（内部DB注記・汎用） | **excluded** | — |
| 088 | 同じ画面で指定ページの履歴が表示される（ページネーション・B8: 画面レイアウト→ページネーション） | bound | C-003 |
| 089 | 新しいリクエストでフラッシュが一度表示される（フラッシュ表示機構・C-005/C-012で概念被覆・汎用） | **excluded** | — |
| 090 | admin エラーフラッシュ、リダイレクト（フォーム不正・B8: 画面レイアウト→画面表示。HTTP302遷移先は自動検証(内部)で確認） | bound | C-012 (shared) |
| 091 | インポート結果のメッセージを admin エラーフラッシュに積む＋前提「CSV形式・列・値・商品不存在」（B8: 画面レイアウト→取込エラー） | bound | C-011 |
| 092 | 母集合期待が「要ソース確認」のプレースホルダで、具体的な試験対象を持たない（前提MSG-001・B15② excluded） | **excluded** | — |
| 093 | セール用価格変更CSVアップロード画面に遷移する＋前提MSG-002（csv_invalid_format はimport_file NotBlankのため純UI到達不能） | **TBD** | — |
| 094 | セール用価格変更CSVアップロード画面に遷移する＋前提MSG-003（行数上限・B8: 画面レイアウト→メッセージ/画面表示） | bound | C-010 (shared) |
| 095 | 母集合期待が「要ソース確認」のプレースホルダで、具体的な試験対象を持たない（前提MSG-004・B15② excluded） | **excluded** | — |
| 096 | 画面表示データでエラー表示されず継続（汎用スタブ・前提MSG-005） | **excluded** | — |
| 097 | 情報ログに「セール用価格変更CSV登録開始」（実在挙動だがログ観測手段未整備で一意固定不能・要実機） | **TBD** | — |
| 098 | 画面表示データでエラー表示されず継続（汎用スタブ・前提 取込異常終了） | **excluded** | — |
| 099 | 情報ログに「セール用価格変更CSV登録完了」と件数（実在挙動だがログ観測手段未整備・要実機） | **TBD** | — |
| 100 | アップロードフォーム、フォーマット説明、取込履歴が表示される（B8: フォーム送信→画面表示） | bound | C-002 |
| 101 | ファイル選択のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 102 | 画面タイトルは「セール用価格変更CSVアップロード」（B8: 非同期更新→画面表示。-003の同一タイトルを代表被覆） | bound | C-001 |
| 103 | ファイル選択でラベルにファイル名を表示（ee固有UI＝pf現行は静的ラベルでファイル名非表示・Excel規定なし＝pf/ee食い違い） | **TBD** | — |
| 104 | 取込前の確認ダイアログはない（B8: 公開コンテンツ→モーダル） | bound | C-004 (shared) |
| 105 | CSV買取価格を床関数で整数化した値ベースに…リポジトリ計算式取得（-006と同型・マスタfixture必須で一意固定不能） | **TBD** | — |
| 106 | 手順1と2の場合、翻訳キー sell_price_not_reflected もしくは normal_product…（B8: データ正当性→注意メッセージ。経路(d)DB無効+CSV無効=normal_productへ割当） | bound | C-009 |

`func_scope_check` 判定: 親106/106会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝8件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| ee固有UIでpf現行と食い違いExcel規定なし（R1 Major1） | -004,-103 | 2 | 母集合期待「ファイル選択でラベルにファイル名を表示」はee twig（admin.common.browse＋custom-file JS）の挙動。pf現行 base_csv_upload.twig:24 は静的ラベル「CSVファイル選択」でファイル名を表示しない。Excel識別IDにも規定が無く、pf/ee食い違いのため要仕様確認（TBD） |
| マスタfixture必須で一意固定不能（要実機） | -006,-105 | 2 | 母集合期待「CSV買取価格を床関数で整数化した値ベースに…リポジトリの計算式で取得」（L1-013）は実在するが、換算結果を一意判定するにはカード状態/買取割引マスタの完全なfixtureと期待値が必要で、母集合行だけからは pass/fail を一意固定できない |
| ee実装由来の内部挙動でExcel規定なし（R1 Major1・純粋観測不能） | -012 | 1 | 母集合期待「コミットされうるがhasError真・フラッシュはエラー中心・取込履歴INSERT行われない」の内部条件（hasError/コミット/履歴無し）はee実装由来でExcelが規定するのは「アラート表示」まで（L1-012）。pf現行は当該注意メッセージ分岐自体を持たず（pf-handler:368-388）この内部条件を再現しない＝pf/ee食い違い・Excel規定外でTBD。注意メッセージの画面表示そのものはC-007でbound |
| pf/design がee実装と食い違い純UI到達不能（B1/B3） | -093 | 1 | 母集合前提MSG-002「CSVのフォーマットが一致しません」（admin.common.csv_invalid_format）は `formFile===null` 分岐だが、`import_file` は NotBlank のためファイル未選択送信は先行するフォーム不正分岐（ee-ctrl:140）でNotBlank検証メッセージを出して終了し当分岐（ee-ctrl:151）へ到達しない＝純UIでMSG-002到達不能（ファイル未選択の実挙動はC-012が担う） |
| 実在挙動だがログ観測手段未整備（B15③） | -097,-099 | 2 | 情報ログ「セール用価格変更CSV登録開始」「セール用価格変更CSV登録完了」+件数（L1-016）は実在するがログ観測手段が現行ハーネスで未整備＝画面/履歴で検知できず一意固定不能・要実機／ログ観測整備 |

（合計 2+2+1+1+2 = 8）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・7列境界・5010境界・価格値S0/S1/B1/P0/S2/B2・セールフラグ0/1・DB上セール状態・センチネル行） | fixture manifest（D5型）未整備＝要実機（SEED-M0330-*） |
| 買取価格換算（L1-013）・タグ全置換（L1-014）・価格履歴増分（L1-015）・対象0件成功 | 実挙動だが母集合に固有一意判定行が無い＝documentation-only。買取換算の実観測はマスタfixture必須（-006/-105 TBD） |
| -004/-103 ファイル名ラベルのee/pf仕様統一・-012 の内部条件の観測可否 | ee/pf仕様確認要（TBD） |
| 成功フラッシュ文言のpf/ee食い違い（pf: 商品登録CSVファイルをアップロードしました。／ee: 登録が完了しました。） | どちらを回帰オラクルとするかはD6/仕様確認事項＝C-005はフラッシュ存在・価格反映で判定し文言は固定しない |
| L1解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |

### 9.3 excluded＝82件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B14】共通認証委譲（機能固有認可なし・他行で被覆済み）** | -003 | 観点「未認証」だが当コントローラ（ProductPriceCsvController）は機能固有認可を持たず共通管理画面認証（ファイアウォール）のみ。同一画面タイトルは-102で被覆済み＝B14「他行に被覆が無い場合のみB8補正」により共通認証へ委譲（R2 Major1） |
| **【B15③】自己矛盾/プレースホルダ/矛盾スタブ** | -001,-002,-092,-095 | -001「出力失敗」（取込機能に非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし／-092・-095 母集合期待が「要ソース確認」＝プレースホルダで具体的試験対象を持たない（B15②） |
| **【B7/B15】汎用検索スタブ（非該当観点）** | -020〜-033 | 本機能は検索を行わず選択CSVをアップロード取込（観点テンプレ機械生成） |
| **【B15②】汎用「実行結果/出力内容が含まれる/一致」スタブ** | -034,-035,-036,-037,-048,-060,-062,-065,-066,-067,-068,-069,-070,-084,-101 | 一致基準（どの列がどの値か）を母集合行が持たず内容空虚 |
| **【B15②/④】汎用「登録内容/更新内容が追加/変更される・されない」スタブ（C-005/C-006/C-009で被覆）** | -038,-039,-040,-042,-043,-044,-045,-046,-047,-050,-051,-052,-054,-055,-056,-057,-058,-059 | 対象レコード・具体値を母集合が指定せず内容空虚。取込の成功反映（C-005）・履歴条件（C-006）・失敗（C-009）で概念被覆済みの冗長スタブ |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）・validationの自己矛盾** | -010,-011,-014,-015,-016,-017,-018,-063,-064,-071,-096,-098 | 「エラー表示されず継続」の観測対象が無い。-010は出力CSV（列数不一致）を必須validationと誤ラベルする自己矛盾 |
| **【B15②】内部DB/フォームキー注記スタブ** | -008,-009,-019,-041,-085,-087 | 「import_fileフォームキー」「セール区分更新」「一括更新メソッド引数」「対象テーブル直接保存」等はDBカラム/内部処理/フォーム内部の設計注記で単一の観測可能挙動でない |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。取込機能に該当なし |
| **【B15②】フラッシュ表示機構（被覆済み）** | -089 | フラッシュの表示機構（C-005/C-012で概念被覆・汎用） |

（excluded件数の実数は82件＝106対応表の**excluded**行と一致。-003は共通認証委譲でB14 excluded／-092/-095は「要ソース確認」プレースホルダで具体的試験対象を持たずB15② excluded）

## §10 特記事項（片側断定せず記録）

1. **R1 Major1（source_class純度）是正の帰結**: pf現行とeeは URL・render/redirect・画面構成・成功文言・注意メッセージ分岐で実装が食い違う。pf-fallback claimは pf現行が実際にやる観測（フォーム不正→エラー表示・成功→成功フラッシュ・履歴は成功時のみINSERT・maxrecord=5010・breakAll・列バリデーション）に限定し、HTTP302/render機構・URLはオラクルから外した。件数プルダウン/ページング（L1-003）と販売価格決定（L1-011）・注意メッセージ表示（L1-012）はExcel実セルが規定するためexcel源とした。
2. **署名挙動はExcel源・pf現行陳腐化**: セール状態突合の販売価格決定（Excel D88-G119）と注意メッセージ表示（G111/G119）はeeが実装し、pf現行handler（pf-handler:368-388）は当該分岐を持たず常にCSV販売価格を反映＝pf/ee食い違い・pf現行陳腐化。source_class=excel（L1-011/L1-012）。
3. **R1 Major2（B12過共有）是正**: 画面タイトル(C-001)とフォーム/説明/履歴表示(C-002)、成功フラッシュ(C-005)と取込履歴INSERT条件(C-006)、注意メッセージ表示(C-007)と内部条件(-012)は期待が異なるため別候補/別会計に分離し、母集合の独立判定とテストIDを保持した。
4. **R1 Major3（B15）是正**: -092/-095 は母集合期待が「要ソース確認」プレースホルダで具体的試験対象を持たないためexcluded（TBDでなく）。会計は bound17/TBD8/excluded81 でJSONメタ・本文とも一致。
5. **R1 Major4（B1）是正**: C-007は買取価格の固定値主張（L1-013 TBD）を外し、注意メッセージ表示＋販売価格=基準価格（決定的）で判定。C-009は2行CSV（row1不存在＋row2センチネル）でbreakAll全打ち切りを観測し、行番号・列名を展開。C-010はファイル未選択（一意・純UI・DB非書込み）に確定。C-004もファイル未選択でDB非書込みとし後始末不要とした。
6. **R1 Major5（en全キー）是正**: 当画面が実際に描画するキーで照合し直し、旧版の `admin.common.csv_format`（当画面不使用）引用を撤回。画面は `admin.product.product_price_csv_format_title`（en不在）を描画。en有は product_management/csv_upload/csv_skeleton_download/required/count/search_no_result、en不在は画面タイトル系・browse/csv_item_name/csv_description・履歴見出し4キー・maxrecord・注意メッセージ2種・product.not_exists。§5に全キー照合を記録。
7. **R1 Major6（B6/B9分離）是正**: 画面で見えるもの（フラッシュ・注意メッセージ・履歴テーブル・再表示の販売価格/セールフラグ）は画面で判定し、DB直接参照はbreakAllロールバックの否定的事実（C-011）に限定。派生TSV/期待から hasError・count===0||!breakAll・HTTP302・%d/%s 等の内部語を排し人間可読化した。
8. **R2 Major1（B14 共通認証委譲）是正**: -003は観点「未認証」だが当コントローラ（ProductPriceCsvController）は機能固有認可を持たず共通管理画面認証のみで、同一画面タイトルは-102で被覆済み。B14「他行に被覆が無い場合のみB8補正」により-003を共通認証へ委譲しexcludedとし、-102をboundとした。
9. **R2 Major2（B1 4分岐/2注意メッセージ被覆）是正**: L1-011のセール状態×CSVフラグ4分岐とL1-012の注意メッセージ2種を各分岐一意判定の候補で被覆。ee handlerの分岐をfile:lineで確認: (c)DB有効+CSV無効→販売価格=床(standardPrice)・sell_price_not_reflected（ee-handler:329-336）、(d)DB無効+CSV無効→販売価格=現行維持・normal_product（ee-handler:337-343）、(a)/(b)CSV有効→販売価格=CSV値（ee-handler:344-347）、saleFlgはCSV値を永続化（ee-handler:366）。母集合-049/-082（成功）を(a)/(b)、-007/-106（注意メッセージ）を(c)/(d)へ1:1割当。C-005(a)/C-006(b)/C-008(c)/C-009(d)。
10. **R3 Major1（B1 HTTP302判定）是正**: 母集合-049/-082（HTTP302＋成功フラッシュ）・-083/-090（HTTP302＋エラーフラッシュ）の必須要件を被覆。ee(SUT)は成功・失敗とも302リダイレクト（pfのrenderと食い違うがee=SUTなので302が正）を ee ProductPriceCsvController:145（フォーム不正）・:206（成功/エラー）でfile:line確認。画面期待はフラッシュ文言、**HTTP302リダイレクトの遷移先(Location)＝GET /%eccube_admin_route%/product/product_price/product_price_csv_upload を C-005/C-006/C-012の自動検証(内部)列で確認**し200/renderと一意区別。R1で「302はオラクル外」としたのをee=SUT前提で内部SUT確認へ是正（L1オラクルはフラッシュ・16claim不変／302はSUT遷移機構の内部検証）。
11. **正直分類の帰結**: bound16（12候補ケース C-001〜C-012）。TBD8（-004/-103 ee固有UI・-006/-105 マスタfixture必須・-012 ee内部条件・-093 MSG-002到達不能・-097/-099 ログ観測未整備）。excluded82（-003 共通認証委譲を含む）。会計＝bound16／TBD8／excluded82（=106）。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（16件）。**（-003は共通認証委譲でexcluded＝観点補正対象外）

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 005 | モーダル | 期待「取込前の確認ダイアログはない」（L1-004）。母集合ラベル「出力抑止」は誤り |
| 007 | 注意メッセージ | 期待「翻訳キー sell_price_not_reflected もしくは normal_product…」（L1-012）。母集合ラベル「状態変化」は誤り |
| 049 | 取込成功 | 期待「HTTP 302 と admin 成功フラッシュ」（L1-006）。母集合ラベル「実行結果」は誤り |
| 053 | 取込履歴INSERT条件 | 期待「成功かつ結果オブジェクトにエラーが無いときだけ INSERT」（L1-007）。母集合ラベル「更新内容」は誤り |
| 061 | メッセージ/画面表示 | 期待「セール用価格変更CSVアップロード画面に遷移」＋前提MSG-003（L1-008）。母集合ラベル「実行結果」は誤り |
| 082 | 取込成功 | 期待「HTTP 302 と admin 成功フラッシュ」（L1-006）。母集合ラベル「初期行数」は誤り |
| 083 | 画面表示 | 期待「HTTP 302 と admin エラーフラッシュ」（L1-005）。母集合ラベル「表示順」は誤り |
| 086 | 取込履歴INSERT条件 | 期待「成功かつ結果オブジェクトにエラーが無いときだけ INSERT」（L1-007）。母集合ラベル「排他制御」は誤り |
| 088 | ページネーション | 期待「同じ画面で指定ページの履歴が表示される」（L1-003）。母集合ラベル「画面レイアウト」は誤り |
| 090 | 画面表示 | 期待「admin エラーフラッシュ、リダイレクト」（L1-005）。母集合ラベル「画面レイアウト」は誤り |
| 091 | 取込エラー | 期待「インポート結果のメッセージを admin エラーフラッシュに積む」（L1-009）。母集合ラベル「画面レイアウト」は誤り |
| 094 | メッセージ/画面表示 | 期待「セール用価格変更CSVアップロード画面に遷移」＋前提MSG-003（L1-008）。母集合ラベル「画面レイアウト」は誤り |
| 100 | 画面表示 | 期待「アップロードフォーム、フォーマット説明、取込履歴が表示される」（L1-002）。母集合ラベル「フォーム送信」は誤り |
| 102 | 画面表示 | 期待「画面タイトルは「セール用価格変更CSVアップロード」」（L1-001）。母集合ラベル「非同期更新」は誤り |
| 104 | モーダル | 期待「取込前の確認ダイアログはない」（L1-004）。母集合ラベル「公開コンテンツ」は誤り |
| 106 | 注意メッセージ | 期待「翻訳キー sell_price_not_reflected もしくは normal_product…」（L1-012）。母集合ラベル「データ正当性」は誤り |
