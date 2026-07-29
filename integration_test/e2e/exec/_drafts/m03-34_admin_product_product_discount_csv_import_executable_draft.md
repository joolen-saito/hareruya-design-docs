# 候補: m03-34 割引率変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合86全量会計・重大所見=SUT未実装）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1+R2 是正反映版（2026-07-29・ee/pf実ソース照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
>
> ## ★重大所見（本機能はSUT=ec-cube-enterpriseに未実装＝whole-feature移行ギャップ）
>
> - **専用機能は pf(HareruyaEcプラグイン)にのみ実在**: `GET/POST /{admin_route}/product/product_discount_csv_upload`（`pf ProductServiceProvider`）と2列専用ハンドラ `ProductDiscountImportHandler`。
> - **ee(SUT)には専用エントリポイントが無い**（実ソースで確認）: (a)専用ルート `product_discount_csv_upload` は ee `src`/`app` に**0件**、(b)twig `csv_product_discount` **不在**、(c)`ProductDiscountImportHandler` **不在**、(d)`const PRODUCT_DISCOUNT_IMPORT_CSV_ID=10`（`ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:37`）は ee php で**使用0件**、(e)`ColumnDefinitions::discountId`（`.../Model/ColumnDefinitions.php:531`）は `ProductCardImportHandler.php:369`（**カード多列CSV**の1列）からのみ呼ばれ専用ハンドラ無し、(f)汎用雛形 `csvTemplate`（`.../Csv/CsvImportController.php:1293-1316`）は `type∈{product,category,class_name,class_category,stock_change,department}` のみ受理し else `NotFoundHttpException`＝**type=discount は404**。
> - **M03-26（カード商品CSV登録）への統合／DELEGとも断定不可**（一次資料不足）: `割引率(ID)`列は ee/pf 双方のカードCSV（`ee CardCsvController.php:339`／`ee ProductCardImportHandler.php:369`／`pf ProductCardImportHandler.php:359`）に存在する一方、pfには M03-34専用ルート（`pf ProductServiceProvider.php:159`）も**併存**する。ExcelもM03-26とM03-34を別機能として列挙し M03-34を「現行踏襲」とする（`0204 HTML:14935,14943`）。よって「M03-34の挙動がM03-26カードCSVで代替される」とは紐付けられない。
> - **帰結**: ブラウザ経由でSUT(ee)に本ルートを発行しても404であり、母集合の各固有挙動をSUTで1回の実行でpass/fail一意判定できない（＝**bound不能**）。区分「現行踏襲」（pf-md:9）が示す設計意図はeeがpf挙動を踏襲することだが、その移行がSUTで未実装＝**whole-feature pf/ee食い違い**。**pf実装挙動は期待オラクル(pf-fallback)として§1に維持**するが、**本機能固有の挙動を記述する母集合行はすべてTBD**（要仕様確認＝ee移行有無／ee実装後に§1のpf-fallback L1を根拠に再具体化）。汎用スタブ・非該当・内部注記はexcluded。**boundは0**（正直分類・bound強行はしない）。M03-44(Phase2)・M03-36(ee未実装)と**同カテゴリ**。
>
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **期待オラクル源（source_class=pf-fallback）**: `pf-eccube3` の HareruyaEcプラグイン（現行踏襲・pf-md:9・pf repo HEAD `4bc76955971df324965d623a4e042094e53cb285`）。母集合の各期待テキストはpf-md（pf現行のリバース詳細設計）由来でpf実装と一致する。**SUT=eeには本機能が未実装のため、L1は「ee移行実装後に検証すべき期待挙動」であり現状は実行保留（TBD）**。
  - Controller: `app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（`csvProductDiscountUpload:1277-1321`・`render:1857-1868`・`getProductDiscountCsvHeader:2215-2221`・`const CSV_IMPORT_MAX:391=5010`・`const CSV_IMPORT_HISTORY_LIMIT:392=100`）
  - 取込ハンドラ: `.../Service/Csv/Importer/Event/ProductDiscountImportHandler.php`（2列定義:48-49,108-114・商品存在検証breakAll:132-150・`onReadRow` updateProductSub:96-101,184-211・onAfterImport支店通知:53-67）
  - 共通取込: `.../Service/Csv/Importer/CsvImporter.php`（`importRows`: 各行 `onValidateRow`→breakAllなら onReadRow前に break:243-247／`onReadRow`更新:253-256／`$isSuccessful = messageStore->count()===0 || !$hasBreak`:272・commit/rollback:273-277）／`.../Event/BaseCsvImportHandler.php`（列**数**検査→列**名**存在検査→列バリデータの順で失敗時 breakAll:57,70,80,93）
  - Validator/列定義: `.../Validator/Repository/DiscountIdValidator.php`／`.../Model/ColumnDefinitions.php`（productId:61・discountId:297）／`.../MessageStore.php`（各エラーメッセージキー）
  - twig: `.../Resource/template/admin/Product/csv_product_discount.twig`（base_csv_upload.twig継承:1-8）・`.../base_csv_upload.twig`（JS:8-11・accept=text/csv,text/tsv:26・errors `.text-danger`:29-31・アップロードボタン:36・雛形link:47）
  - メッセージ逐語源: 成功キー `admin.product.csv_import.save.complete`=「商品登録CSVファイルをアップロードしました。」（pf core `src/Eccube/Resource/locale/message.ja.yml:133`）／取込系エラー（pf plugin `app/Plugin/HareruyaEc/Resource/locale/message.ja.yml`: `upload.maxrecord:1097`〔`%d`→5010〕・`format.body:1101`・`data.require:1113`・`data.not_registered:1115`・`product.not_exists:1144`・`product.over_zero:1146`・`data.empty:1112`）
- **pf現行md（回帰先）**: `functions/pf-eccube3/m03-34_admin_product_product_discount_csv_import.md`（git hash-object `06db86c616163ae8455504631a12fdfad656ea84`／docs repo HEAD `27ce6d0676e86679af74c1716cfd60d3fc927445`。以下「pf-md:行」）。
- **ee(SUT)不在の根拠（file:line・§重大所見に既述）**: 専用ルート/twig/ハンドラ0件・type-ID使用0件・discountId列はカードCSV経由のみ・type=discount 404。
- **Excel基本設計（該当なし）**: `0204_基本設計仕様書(商品管理).html` に割引率変更CSV登録の基本設計シートは存在しない（`14935,14943` はM03-26/M03-34を別機能として列挙する目次で、M03-34専用の列定義・確認モーダル等の設計シートは無い）。**excel源のclaimは0**。
- **source_class純度**: 全20 L1 claim=**pf-fallback**（各claimはpf現行の挙動のみ・pf plugin file:lineで確定。excel源0・EE-source 0）。ee比較・Excel不在の観察は§0/§10メタに隔離し個別claim内に混ぜない（1claim1source）。
- **en（★機械検証済み・全message claim LS=0）**: 成功キー `admin.product.csv_import.save.complete`・取込系エラーキー `admin.csv.error.*` は pf en(`message.en.yml`)・ee en(`messages.en.yaml`)いずれも0件（grep）。画面文言は pf plugin twig にハードコード日本語（trans未使用）。→ 全L1 claim **LS=0**。§5にgrep根拠。
- **判定原則**: 母集合の観点/前提ラベルはノイズ（機械生成・前提列は pf-md 見出しの流用）。分類は各行の「期待結果」実テキストで判定する。**本機能はSUT未実装のため、固有挙動行はbindできずTBD**。

---

## §1 L1原子オラクル表（期待オラクル＝pf現行踏襲。SUT未実装のため実行はTBD）

全20claim。**source_class列は pf-fallback のみ**（excel0・EE-source 0・各claimはpf現行挙動のみ＝1claim1source）。**全claim LS=0**。**全claimがdocumentation/TBD根拠**（bound候補が無く、記述は現行踏襲の期待挙動をpf実source基準で記録するもの。SUT未実装のため実行検証は保留＝§9.1のTBD理由に紐付く）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0334-001 | http_entry | 「割引率変更CSV登録」から `GET /{admin_route}/product/product_discount_csv_upload` を開くと、同一リソースのGET応答(HTML)としてアップロードフォーム・雛形ダウンロードリンク・列説明フォーマット表・当該CSV種別(ID 10)のインポート履歴が表示される | 「アップロードフォーム、雛形リンク、列説明、当該種別のインポート履歴が表示される。」 | pf-md:30,241;render:1857-1867 | pf-fallback | 0 |
| L1-M0334-002 | display_field | `csv_product_discount.twig` は `base_csv_upload.twig` を継承し、サブタイトル「割引率変更CSVアップロード」・ボックス見出し「割引率変更CSV」・ラベル「CSVファイル選択」のファイル入力(accept=text/csv,text/tsv)・「CSVファイルのアップロード」ボタン・フォーマット表(列見出し「商品ID」「割引率(ID)」各セルに改行区切りで「必須」)・「雛形ファイルダウンロード」リンク・下部にインポート履歴を表示する | 「ベーステンプレートは `Product/base_csv_upload.twig` 相当。サブタイトルは「割引率変更CSVアップロード」。ボックス見出しは「割引率変更CSV」。」 | csv_product_discount.twig:1-8;base_csv_upload.twig:16-75;getProductDiscountCsvHeader:2215-2221 | pf-fallback | 0 |
| L1-M0334-003 | display_field | アップロード画面は `spin.min.js` と `admin/assets/js/card-csvimport.js` を読み込む。割引率専用の入力検証は画面側では行わない | 「`admin/assets/js/card-csvimport.js` と `spin.min.js` を読み込む。…割引率専用の入力検証は画面側では行わない。」 | base_csv_upload.twig:8-11;pf-md:42 | pf-fallback | 0 |
| L1-M0334-004 | display_field | 取込前の確認ダイアログ(確認モーダル)はない。twigに送信前確認モーダルの部品が無く、ファイル選択後「CSVファイルのアップロード」押下で確認を挟まず送信する | 「取込前の確認ダイアログはない。」 | pf-md:44;base_csv_upload.twig(確認モーダル部品なし) | pf-fallback | 0 |
| L1-M0334-005 | http_flow | POSTアップロード送信は成功・失敗のどちらでも同一URL のPOST応答としてHTMLを再描画する(リダイレクトしない＝PRGパターンではない)。成功時は成功フラッシュ、フォーム不正/行数超過時はエラーフラッシュ、取込エラー時は `errors` 配列を画面内に表示する | 「URL は変わらず POST 応答で HTML を再描画（PRG パターンではない）。」 | pf-md:69,242;controller:1288-1320 | pf-fallback | 0 |
| L1-M0334-006 | message | 取込結果にエラーが無いとき、成功フラッシュ(キー `admin.product.csv_import.save.complete`=「商品登録CSVファイルをアップロードしました。」)を積み、インポート履歴へ種別ID 10・ファイル名・ログイン管理者を追記し、情報ログ「割引率変更CSV登録完了」と件数を出す | 「フラッシュ成功（翻訳キー `admin.product.csv_import.save.complete`）…履歴テーブルへファイル名と種別とログイン管理者を記録する。」 | controller:1311-1318;pf core message.ja.yml:133;pf-md:68 | pf-fallback | 0 |
| L1-M0334-007 | message | 概算行数(引用符内を除いた改行カウント・ヘッダ行含む)が定数 `CSV_IMPORT_MAX`(=5010)以上のとき、`sprintf(trans('admin.csv.error.upload.maxrecord'),5010)` によりエラーフラッシュ「5010 行を超えるCSVファイルは登録できません。」を積み取込を実行せず同画面を再描画する | 「行数が定数 5010 以上なら件数超過メッセージをフラッシュに積み、再描画で終了する」 | controller:1299-1304;const:391;pf plugin message.ja.yml:1097 | pf-fallback | 0 |
| L1-M0334-008 | validation | データ行の商品IDが `dtb_product` に存在しない(del_flg無効の行が無い)とき `addProductNotExistsError`=`admin.csv.error.product.not_exists`「%d 行目の %s ではデータを取得できません。」(例「2 行目の 商品ID ではデータを取得できません。」)を `errors` へ積み `breakAll` で全行処理を打ち切る | 「存在しないときは商品不存在エラーを登録し、全行処理を打ち切る。」 | pf-md:104;handler:132-150;MessageStore:204-208;pf plugin message.ja.yml:1144 | pf-fallback | 0 |
| L1-M0334-009 | validation | データ行の割引率(ID)が `mtb_discount` に存在しないIDのとき `addMasterNotExistsError`=`admin.csv.error.data.not_registered`「%s : %s がマスターから取得できません。 %d 行目のデータを確認してください。」(例「割引率(ID) : 999 がマスターから取得できません。 2 行目のデータを確認してください。」)を `errors` へ積み `breakAll` で打ち切る | 「`mtb_discount` に存在する ID であること（…キー存在で判定）。」 | pf-md:99;DiscountIdValidator:37-63;MessageStore:191-195;pf plugin message.ja.yml:1115 | pf-fallback | 0 |
| L1-M0334-010 | validation | 商品ID・割引率(ID)はいずれも必須かつ符号なし数値。必須列が空のとき `addRequireError`=`admin.csv.error.data.require`「%s は必須項目です。 %d 行目のデータを確認してください。」(例「割引率(ID) は必須項目です。 2 行目のデータを確認してください。」)、符号なし数値でないとき `addNumericError`=`admin.csv.error.product.over_zero`「%d 行目の %s は0以上の数値を設定してください。」を `errors` へ積み `breakAll` で打ち切る | 「「商品ID」… 必須。符号なし整数。」「「割引率(ID)」… 必須。符号なし整数。」 | pf-md:98,99;handler:48-49;MessageStore:124-126,177-179;pf plugin message.ja.yml:1113,1146 | pf-fallback | 0 |
| L1-M0334-011 | validation | `importService`/ハンドラは各データ行につき **(1)列数一致検査→(2)ヘッダ名の列存在検査→(3)列バリデータ** の順で評価する。列数が2でない行は先に `addInvalidColumnCountError`=`admin.csv.error.format.body`「CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。」。列数が2で必須列名「商品ID」「割引率(ID)」が欠ける行は `addColumnNotExistsError`=`admin.csv.error.product.not_exists`「%d 行目の %s ではデータを取得できません。」。先頭行をヘッダとみなせないとき `format.header`、データ行が無いとき `data.empty`=「CSVデータが存在しません。」。いずれも `errors` へ積み打ち切る | 「必須列名「商品ID」「割引率(ID)」が欠けると列存在エラーとなる。」「各行で列数が 2 かつヘッダ名の列が存在するか」 | pf-md:132,160;BaseCsvImportHandler:57,70;MessageStore:87-89,111-113,75-77,98-100;pf plugin message.ja.yml:1101,1112,1144 | pf-fallback | 0 |
| L1-M0334-012 | rollback | コミット可否は `$isSuccessful = messageStore->count()===0 || !$hasBreak`。検証失敗は全て `breakAll`(skipRow経路なし・行バリデータ空)。`importRows` は各行 `onValidateRow`→breakAllなら `onReadRow`前に break、正常なら `onReadRow`で更新を適用する。先頭データ行が不正なCSVは onReadRow到達前に breakAll するため更新は一切適用されない(ロールバック対象なし)。正常行の後に不正行が続くCSVでは正常行の更新が適用された後に不正行で breakAll→rollback され正常行の更新(discount_id)も取り消される。いずれのエラーでも成功用フラッシュを積まず `errors` を `.text-danger` div で画面内表示し、履歴INSERT・支店通知・完了ログは行わない | 「取込エラー時は成功用フラッシュを積まず、`errors` で画面表示する。」「途中で検証失敗した場合はロールバックし DB は変わらない。」 | CsvImporter importRows:236-277;BaseCsvImportHandler:52-93;handler:58;base_csv_upload.twig:29-31;pf-md:162,170 | pf-fallback | 0 |
| L1-M0334-013 | data_write | `onReadRow` は当該 product_id の既存 `dtb_product_sub` 行を取得し、全カラム値を複写して `discount_id` だけをCSVの割引率(ID)値へ差し替え、`buy_discount_id`・名称系・sellGroupId・size・weight・storageCodeId・regionRestrictionId など他列は既存値のままネイティブUPDATEで書き戻す。CSVの割引率(ID)が既存 `discount_id` と異なる正常取込では対象商品の `discount_id` が新値へ更新され他サブ列は不変となる | 「`discount_id` だけを CSV の値に差し替える。`buy_discount_id` や名称系など他列は既存値のままとする。」 | handler updateProductSub:184-211;pf-md:107-110,144 | pf-fallback | 0 |
| L1-M0334-014 | data_write | 更新単位はCSVの1データ行が1商品IDに対応。同一ファイル内で同じ商品IDが複数回出た場合はトランザクション内で順に上書きされ最終行の値が残る。支店通知のID一覧は重複除去される。本ハンドラは価格列を更新しない | 「CSV の 1 データ行が 1 商品 ID に対応。…最終行の値が残る。」「本ハンドラは価格列を更新しない。」 | pf-md:143,145,146;handler:210,61 | pf-fallback | 0 |
| L1-M0334-015 | history | インポート履歴(`dtb_csv_import_history`)は取込成功と判断したときだけ種別ID 10(PRODUCT_DISCOUNT_IMPORT_CSV_ID)・ファイル名・ログイン管理者で1件INSERTされる。エラーを含む取込では増えない。画面は当該種別IDの履歴を作成日時降順で最大100件読み直す | 「成功時のみ `dtb_csv_import_history` に追記。失敗時は追記しない。」 | controller:1316-1317;render:1859-1860;pf-md:171;MtbCsvImportType:21;const:392 | pf-fallback | 0 |
| L1-M0334-016 | file_download | `GET /{admin_route}/product/product_csv_template/discount`(type=discount)は、割引率変更用ヘッダーのキー名のみ(「商品ID」「割引率(ID)」)を1行として出力し先頭にUTF-8のBOMを書いたCSVを、`Content-Type: application/octet-stream`・`Content-Disposition: product_discount.csv` 添付指定のダウンロード応答として返す(画面遷移はしない) | 「列名のみを 1 行として…出力する。先頭に UTF-8 の BOM…`Content-Disposition` は `product_discount.csv` を添付指定する。」 | pf-md:32,71-75;getProductDiscountCsvHeader:2215-2221 | pf-fallback | 0 |
| L1-M0334-017 | exclusion | 商品IDは存在するが対応する `dtb_product_sub` 行が無い場合、`updateProductSub` が既存サブ行に依存するため実行時例外になりうる | 「更新処理が既存サブ行に依存するため、実行時例外になりうる。」 | pf-md:161;handler:190-193 | pf-fallback | 0 |
| L1-M0334-018 | log | POST取込で情報ログ「割引率変更CSV登録開始」を出し、エラーがあれば「…異常終了」、無ければ「割引率変更CSV登録完了」と件数を出す | 「情報ログ「割引率変更CSV登録開始」。…「割引率変更CSV登録完了」と件数。」 | pf-md:65,67,274-276;controller:1306,1312,1315 | pf-fallback | 0 |
| L1-M0334-019 | data_integrity | 取込が成功した場合のみ `onAfterImport` で `em.commit()` 後に支店システムへ商品更新通知を送る。失敗しロールバックされた場合この通知は走らない | 「取込全体が成功した場合、`onAfterImport` 内で…支店向け商品更新通知を送る。」 | pf-md:114-115,172;handler:53-67 | pf-fallback | 0 |
| L1-M0334-020 | file_handling | アップロードファイルはサーバ一時ディレクトリへ保存したうえで読み捨て解析され、永続パスは画面へ返さない。CSV内容や大きな配列はセッションへ格納しない | 「サーバ一時ディレクトリに保存したうえで読み捨て解析。永続パスは画面に返さない。」 | pf-md:154,290-294,81 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`・**本機能はSUT未実装のため実行不能＝設計参考**）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。**本機能はSUT(ee)に実装が無いため、下記SEED/CSVはeeへの本機能移行実装後に初めて実行可能となる設計参考**（現状は全母集合行がTBD/excludedでbound候補が無く、SEEDを消費する実行ケースは存在しない）。取込CSVはfixtureファイルとしてUI操作でアップロードする想定。

| SEEDセットID | 目的 | 固定値（概略） |
|---|---|---|
| SEED-M0334-MASTERS | 取込の前提マスタ | `mtb_discount` に有効な割引率ID(Dvalid・別値D0)＋既存商品1件(商品ID既知・`dtb_product_sub`行あり・現行 discount_id=D0既知) |
| SEED-M0334-HISTORY | インポート履歴の表示検証 | `dtb_csv_import_history` に種別ID 10 の履歴を複数件 |
| SEED-M0334-VALIDUPDATE | 正常取込（成功フラッシュ・履歴追記・discount_id更新） | 既存商品の商品IDと有効な割引率ID(Dvalid≠D0)を持つ1データ行CSV |
| SEED-M0334-ROLLBACK-2ROW | ロールバック検証 | 2データ行CSV: row1=商品ID有効・割引率Dvalid(正常)、row2=商品ID有効・割引率Dng(mtb_discount不在) |
| SEED-M0334-MISSINGREQ | 必須未入力エラー | 商品ID有効・割引率(ID)空の1データ行CSV |
| SEED-M0334-BADHEADER-2COL | 列名逐語エラー | 2列維持で第2ヘッダのみ誤名（例「割引ID」）＋データ行も2セル（列数検査を通し列名存在エラーを誘発） |

---

## §3 取込CSV列マトリクス（参照情報・全pf現行）

| 区分 | 列 | 検証 | 備考 |
|---|---|---|---|
| 必須/キー | 商品ID | 必須・符号なし整数・`dtb_product` に未削除で存在 | handler:48,132-150 / pf-md:98,103 |
| 必須 | 割引率(ID) | 必須・符号なし整数・`mtb_discount` に存在 | handler:49 / DiscountIdValidator / pf-md:99 |

- 更新は当該商品IDの `dtb_product_sub` の `discount_id` のみ上書き。他列は既存値を維持（pf-md:109,144）。価格列は更新しない（pf-md:146）。

---

## §4 実行可能グレード14列TSV（候補・**bound 0件＝データ行なし**）

- **本機能はSUT(ec-cube-enterprise)に専用ルート/実装が存在しないため、1回の実行でpass/fail一意判定できるbound候補は0件**（正直分類・bound強行はしない）。母集合86行はすべてTBD（23件・固有挙動だがSUT未実装で実行保留）またはexcluded（63件・汎用スタブ/非該当/内部注記）。§8/§9参照。
- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。ee側に本機能が移行実装された時点で、§1のL1（現行踏襲の期待挙動）を根拠にbound候補を起こせる。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
```

---

## §5 ja/en locale対応表（全message claim LS=0＝英訳なし）

**本機能のメッセージ・画面文言はいずれもenロケール変異が無く、全L1 claimがLS=0**のため `-EN` 行を持たない。以下は「英訳なし」の**grep根拠**（レビュー用に記録）。

| キー | ja逐語 | ja出典(pf) | en確認結果 |
|---|---|---|---|
| admin.product.csv_import.save.complete | 商品登録CSVファイルをアップロードしました。 | pf core `message.ja.yml:133` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.upload.maxrecord | %d 行を超えるCSVファイルは登録できません。（sprintfで%d→5010） | pf plugin `message.ja.yml:1097` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.format.body | CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 | pf plugin `message.ja.yml:1101` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.product.not_exists | %d 行目の %s ではデータを取得できません。 | pf plugin `message.ja.yml:1144` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.data.not_registered | %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 | pf plugin `message.ja.yml:1115` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.data.require | %s は必須項目です。 %d 行目のデータを確認してください。 | pf plugin `message.ja.yml:1113` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.product.over_zero | %d 行目の %s は0以上の数値を設定してください。 | pf plugin `message.ja.yml:1146` | pf en・ee en いずれも**不在**＝英訳なし |
| admin.csv.error.data.empty | CSVデータが存在しません。 | pf plugin `message.ja.yml:1112` | pf en・ee en いずれも**不在**＝英訳なし |
| 画面文言（商品管理・CSVファイル選択・CSVファイルのアップロード・雛形ファイルダウンロード・割引率変更CSVアップロード・割引率変更CSV） | 同左（ハードコード） | `base_csv_upload.twig`・`csv_product_discount.twig` | pf plugin twig に**ハードコード日本語（trans未使用）**＝ロケール変異なし |

- 検証コマンド: `grep -rncE 'admin\.csv\.error\.|csv_import\.save\.complete' <pf/ee>/…/message*.en.yml` → いずれも **0**。

---

## §6 判定手段骨子（候補＝未実装／SUT本機能未実装）＋ _drafts隔離

- **前提**: SUT(ec-cube-enterprise)に本機能の専用ルート/コントローラ/ハンドラ/テンプレートが無い（§0・重大所見）。よってPlaywrightでの画面到達・取込結果検証は**ee側の本機能移行実装が前提**であり、現状は判定手段を確定できない（全行TBD/excluded）。
- ee移行実装後の判定設計（参考）: 成功＝成功フラッシュDOM＋インポート履歴テーブルDOM／失敗＝`.text-danger`（id=`upload_file_box__upload_error--N`）エラーメッセージDOM＋成功フラッシュ非表示／更新反映・ロールバックは `dtb_product_sub.discount_id`（pf-oracle。ee移行では保存先列 `dtb_product.discount_id` が要確認）。
- L1解決器・取込CSV fixture・SEED manifest契約・アサートヘルパは M0成果物（D5/D8/D9型）として未実装。本骨子は「ee移行実装＋ハーネス完成後にこう書く」契約。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

**bound候補が0件のため、Playwright/非UI/db.ts の実行対象列挙は無い**（全母集合行はTBDまたはexcludedでtsv非出力）。ee側に本機能が移行実装され、かつM0ハーネスが整備された時点で、§1のL1を根拠に実行区分を定義する。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容**による。本機能固有の挙動を記述する行は**SUT未実装のためTBD**、汎用スタブ（前提が汎用ノイズの相関/DB相関/登録/更新/出力スタブ）・非該当観点（削除/移動/コピー/JSON/スキーマ等）・内部DB/ファイル処理注記はexcluded（Gate B15/B7）。

### 集計（86 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **0** | SUT(ee)に本機能の専用ルート/コントローラ/ハンドラ/テンプレートが無く（type=discountも404）、1回の実行でpass/fail一意判定できる固有挙動候補を起こせない（whole-feature pf/ee食い違い） |
| **TBD** | **31** | -003,-004,-006,-007,-008,-009,-010,-011,-012,-019,-023,-031,-035,-043,-064,-065,-068,-069,-070,-071,-072,-073,-074,-075,-076,-077,-079,-081,-084,-085,-086（本機能固有の挙動をpf実sourceで記述できるが、SUT未実装で実行不能＝要仕様確認〔ee移行有無／ee実装後に§1のpf-fallback L1を根拠に再具体化〕）。§9.1 |
| **excluded** | **55** | -001,-002,-005,-013,-014,-015,-016,-017,-018,-020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042,-044,-045,-046,-047,-048,-049,-050,-051,-052,-053,-054,-055,-056,-057,-058,-059,-060,-061,-062,-063,-066,-067,-078,-080,-082,-083（汎用スタブ・非該当観点(ファイル/レコード操作)・汎用「追加/変更される・されない」スタブ・「エラー表示されず継続」観測対象未定義・Twig継承(観測不能)・CSRF/出力失敗の未定義）。§9.3 |
| 合計 | **86** | 欠番0・理由なし重複0 |

> 会計: bound 0／TBD 31／excluded 55（=86・欠番0）。R1後(bound18/TBD5/excluded63)→R2後(bound0/TBD23/excluded63)→**R3後(bound0/TBD31/excluded55)**（R3是正＝pf一次資料に具体挙動がある-008/-009/-011/-070/-071/-072/-077/-079の8件をexcluded→TBDへ移送）。

- **B7非該当観点excluded**: 削除/移動・リネーム/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ（-044,-046〜-063の該当行）。取込機能に該当なし。§9.3。
- **B8観点補正＝0件**（bound候補が0のため観点補正の対象行なし。TBD/excluded行は母集合ラベルを保持）。

### 86対応表（期待テキスト要旨→会計→L1）

| No | 期待テキスト要旨 | 会計 | L1 |
|---|---|---|---|
| 001 | 出力失敗のファイル出力が対象データと一致（取込機能に「出力失敗」非該当＋汎用） | **excluded** | — |
| 002 | CSRFのファイル出力が対象データと一致（CSRF失敗の固有挙動が一次資料に定義なし・汎用） | **excluded** | — |
| 003 | 列名のみのCSV(BOM付きUTF-8)が保存ダイアログで受け取れる（雛形ダウンロード。SUT未実装で404） | **TBD** | L1-016 |
| 004 | type=discount の雛形CSVをダウンロード応答として返す（雛形ダウンロード。SUT未実装で404） | **TBD** | L1-016 |
| 005 | ベーステンプレートは base_csv_upload.twig 相当（Twig継承＝観測不能） | **excluded** | — |
| 006 | card-csvimport.js と spin.min.js を読み込む（JS挙動） | **TBD** | L1-003 |
| 007 | 取込前の確認ダイアログはない（モーダル） | **TBD** | L1-004 |
| 008 | CSVの1データ行が1商品IDに対応（更新単位＝pf設計:143に具体挙動。SUT未実装で実行保留） | **TBD** | L1-014 |
| 009 | 本ハンドラは価格列を更新しない（価格列非更新＝pf設計:146に具体挙動。SUT未実装で実行保留） | **TBD** | L1-014 |
| 010 | 必須バリデーションでエラー表示され完了しない（必須列は商品ID/割引率(ID)。SUT未実装で実行保留） | **TBD** | L1-010 |
| 011 | 必須バリデーションでエラー表示されず継続（前提=ヘッダ順序違い＝列順不同許容 pf設計:160に具体挙動。SUT未実装で実行保留） | **TBD** | L1-011 |
| 012 | 更新処理が既存サブ行に依存するため実行時例外に**なりうる**（B1推量＋観測未整備＋SUT未実装） | **TBD** | L1-017 |
| 013 | 相関バリデーションでエラー表示され完了しない（当機能に行バリデータ無し・汎用） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続（当機能に相関検証無し・汎用） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（当機能に相関検証無し・汎用） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提=副作用の汎用ノイズ・具体対象を名指さず） | **excluded** | — |
| 019 | 現行UPDATEでは既存サブ行から読んだ値をそのまま書き戻す（discount_idのみ差替・他列保持。SUT未実装で実行保留） | **TBD** | L1-013 |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ） | **excluded** | — |
| 022 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 023 | URLは変わらずPOST応答でHTML再描画(PRGでない)（画面遷移。SUT未実装で実行保留） | **TBD** | L1-005 |
| 024 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 025 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 026 | 登録内容の対象レコードが追加されない（汎用スタブ） | **excluded** | — |
| 027 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 028 | 登録内容の対象レコードが追加されない（汎用スタブ） | **excluded** | — |
| 029 | 登録内容の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 031 | 情報ログ「割引率変更CSV登録完了」と件数（ログ観測手段未整備＋SUT未実装） | **TBD** | L1-018 |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 033 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | **excluded** | — |
| 034 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 035 | type=discount の雛形CSVをダウンロード応答として返す（雛形ダウンロード。SUT未実装で404） | **TBD** | L1-016 |
| 036 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 037 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 038 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | **excluded** | — |
| 039 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 040 | 更新内容の対象レコードの値が変更されない（汎用スタブ） | **excluded** | — |
| 041 | 更新内容の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 043 | 更新処理が既存サブ行に依存するため実行時例外に**なりうる**（B1推量＋観測未整備＋SUT未実装） | **TBD** | L1-017 |
| 044 | 実行結果のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 045 | フォーマット定義でエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 046 | フォーマット定義でエラー表示され完了しない（汎用・具体列を名指さず） | **excluded** | — |
| 047 | 実行結果のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 048 | 実行結果のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 049 | 出力内容のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 050 | 出力内容のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 051 | 出力内容のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 052 | 出力内容のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 053 | 出力内容でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 054 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 055 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | **excluded** | — |
| 056 | コピーのファイル出力が対象データと一致（非該当） | **excluded** | — |
| 057 | ファイル登録のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 058 | ファイル出力のファイル出力が対象データと一致（出力は本機能に非該当） | **excluded** | — |
| 059 | JSONのファイル出力が対象データと一致（非該当） | **excluded** | — |
| 060 | 同名ファイルのファイル出力が対象データと一致（非該当） | **excluded** | — |
| 061 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | **excluded** | — |
| 062 | 配置先の該当レコードが取得結果に含まれる（非該当） | **excluded** | — |
| 063 | スキーマのファイル出力が対象データと一致（汎用ファイルスタブ・列未指定） | **excluded** | — |
| 064 | 成功時は成功フラッシュと履歴追記、失敗時はエラー内容がフォーム付近に表示される（取込成功/失敗。SUT未実装で実行保留） | **TBD** | L1-006 |
| 065 | 列名のみのCSV(BOM付きUTF-8)が保存ダイアログで受け取れる（雛形ダウンロード。SUT未実装で404） | **TBD** | L1-016 |
| 066 | 更新抑止のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 067 | ベーステンプレートは base_csv_upload.twig 相当（Twig継承＝観測不能） | **excluded** | — |
| 068 | card-csvimport.js と spin.min.js を読み込む（JS挙動） | **TBD** | L1-003 |
| 069 | 取込前の確認ダイアログはない（モーダル） | **TBD** | L1-004 |
| 070 | CSVの1データ行が1商品IDに対応（更新単位＝pf設計:143に具体挙動。SUT未実装で実行保留） | **TBD** | L1-014 |
| 071 | 本ハンドラは価格列を更新しない（価格列非更新＝pf設計:146に具体挙動。SUT未実装で実行保留） | **TBD** | L1-014 |
| 072 | サーバ一時ディレクトリに保存したうえで読み捨て解析（一時ファイル保存＝pf設計:154,81に具体挙動。SUT未実装で実行保留） | **TBD** | L1-020 |
| 073 | 必須列名「商品ID」「割引率(ID)」が欠けると列存在エラー（フォーマット定義。SUT未実装で実行保留） | **TBD** | L1-011 |
| 074 | 更新処理が既存サブ行に依存するため実行時例外に**なりうる**（B1推量＋観測未整備＋SUT未実装） | **TBD** | L1-017 |
| 075 | 取込エラー時は成功用フラッシュを積まず errors で画面表示（取込エラー表示・ロールバック。SUT未実装で実行保留） | **TBD** | L1-012 |
| 076 | 成功時に商品ID集合で通知（支店通知＝外部連携＋SUT未実装） | **TBD** | L1-019 |
| 077 | POST後同じURLで履歴を読み直すため成功直後の一覧は最新の履歴を含みうる（履歴の再読み込み＝pf設計:173,188に具体挙動。SUT未実装で実行保留） | **TBD** | L1-015 |
| 078 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 079 | HTML（同一画面）（POST応答の同一画面再描画＝pf設計:241,242に具体挙動。SUT未実装で実行保留） | **TBD** | L1-005 |
| 080 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 081 | 現行UPDATEでは既存サブ行から読んだ値をそのまま書き戻す（discount_idのみ差替・他列保持。SUT未実装で実行保留） | **TBD** | L1-013 |
| 082 | 当機能が行う登録・更新で対象テーブルを直接保存する（内部DB注記・汎用） | **excluded** | — |
| 083 | ファイル選択のファイル出力が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 084 | 同一リソースのGET応答（HTML）（画面表示。SUT未実装で404） | **TBD** | L1-001 |
| 085 | URLは変わらずPOST応答でHTML再描画(PRGでない)（画面遷移。SUT未実装で実行保留） | **TBD** | L1-005 |
| 086 | ファイルダウンロード応答（雛形ダウンロード。SUT未実装で404） | **TBD** | L1-016 |

`func_scope_check` 判定: 親86/86会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝31件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| SUT未実装で実行不能（whole-feature ee未実装） | -003,-004,-006,-007,-010,-019,-023,-035,-064,-065,-068,-069,-073,-075,-081,-084,-085,-086 | 18 | 本機能固有の挙動をpf実source（§1のL1）で記述できるが、SUT(ee)に専用ルート/画面/ハンドラ/雛形type=discountが無く404＝ブラウザ経由で1回の実行でpass/fail一意判定できない。**pf-fallback L1を期待オラクルとして維持**するがbound根拠にできない。要SUT方針確定／ee実装後に§1のpf-fallback L1を根拠に再具体化（R2 Major1裁定） |
| pf一次資料に具体挙動あり＋SUT未実装（R3是正でexcluded→TBD） | -008,-009,-011,-070,-071,-072,-077,-079 | 8 | pf設計に具体挙動が実在: 1データ行=1商品ID（-008/-070・L1-014・pf設計:143）／価格列非更新（-009/-071・L1-014・pf設計:146）／列順不同許容〔ヘッダ名で解決〕（-011・L1-011・pf設計:160）／一時ディレクトリ保存・読み捨て（-072・L1-020・pf設計:154,81）／POST後の履歴再読み込み（-077・L1-015・pf設計:173,188）／POST応答の同一画面再描画（-079・L1-005・pf設計:241,242）。汎用スタブ・内部注記でなくB15上のTBD（記述可・SUT未実装で実行保留）。要SUT方針確定／ee実装後に再具体化（R3 Major1是正） |
| 推量表現＋冪等再現/観測未整備（B1/B15③）＋SUT未実装 | -012,-043,-074 | 3 | 「実行時例外に**なりうる**」（pf-md:161・L1-017）。サブ行欠落状態の冪等再現SEEDと例外の一意観測手段が未整備。加えてSUT未実装で実行不能 |
| ログ観測未整備（B15③）＋SUT未実装 | -031 | 1 | 情報ログ「割引率変更CSV登録完了」と件数（L1-018）はログ観測手段が未整備。加えてSUT未実装 |
| 外部連携で観測手段なし（B15③）＋SUT未実装 | -076 | 1 | 成功時の支店向け商品更新通知（L1-019・BranchUpdateService）は外部システムへの内部呼び出しで観測手段が無い。加えてSUT未実装 |

（合計 18+8+3+1+1 = 31）

### 9.2 要実機・SUT方針（実行面の保留）

| 事項 | 状態 |
|---|---|
| **SUT方針（最重要・R2裁定）** | **本機能は ee未実装の移行ギャップ機能（pf専用・ee専用エントリポイント無し）**。専用ルート `product_discount_csv_upload`・twig `csv_product_discount`・ハンドラ `ProductDiscountImportHandler`・雛形type=discount は ee に不在（§0・重大所見のfile:line）。**全固有挙動（TBD 23件）は ee実装後に §1のpf-fallback L1 を根拠に再具体化**する。**オーナーのSUT方針確定待ち**（M03-44〔Phase2〕・M03-36〔ee未実装〕と同カテゴリ）。M03-26カード商品CSVへの統合/DELEGは一次資料不足で断定不可 |
| 取込CSV fixtureの実バイト内容（BOM・列順・有効/無効割引率ID・空必須・第2ヘッダ誤名2列・2行rollback） | ee移行実装後に整備＝要実機（SEED-M0334-*） |
| L1解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D5/D8/D9型）として未実装 |

### 9.3 excluded＝55件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能）** | -005,-067 | ベーステンプレート継承そのものは外部IF（画面/DOM）で判定不能 |
| **【B15②】内部注記スタブ（対象テーブル直接保存）** | -082 | 「対象テーブルを直接保存する（不要な削除は含まない）」は内部DB処理の設計注記で単一の観測可能挙動でない |
| **【B15②】汎用相関/DB相関スタブ（当機能に相関検証なし・前提が汎用ノイズ）** | -013,-014,-015,-016,-017,-018 | 割引率変更ハンドラは `getRowValidators()` 空で相関/行バリデータを持たない。期待は前提が汎用ノイズで具体対象を名指さず＝固有一意対応不成立 |
| **【B15②/④】汎用「登録内容/更新内容/実行結果が追加/変更される・されない」スタブ** | -020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042 | 対象レコード・具体列/値を母集合が指定せず内容空虚 |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）** | -045,-047,-048,-053,-062,-078,-080 | 「エラー表示されず継続」の観測対象が無い汎用継続スタブ |
| **【B7】ファイル/レコード操作系（非該当）** | -044,-046,-049,-050,-051,-052,-054,-055,-056,-057,-058,-059,-060,-061,-063,-066 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ/フォーマット定義エラー(汎用)/出力内容一致(汎用) |
| **【B15③】自己矛盾/汎用スタブ** | -001,-002 | -001「出力失敗」（非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし |

## §10 特記事項（片側断定せず記録）

1. **【R2 Major1裁定／SUT確定＝whole-feature ee未実装】**: 割引率変更CSV（2列専用）の取込画面・POSTルート `product_discount_csv_upload`・ハンドラ `ProductDiscountImportHandler`・雛形type=discount は **ee に存在せず**（§0/重大所見のfile:line。type=discountは `CsvImportController.php:1315` で404）。ee の `PRODUCT_DISCOUNT_IMPORT_CSV_ID=10`（使用0件）と `ColumnDefinitions::discountId`（カードCSV `ProductCardImportHandler:369` 経由のみ）は専用機能でない。M03-26カードCSVへの統合/DELEGも、pfに M03-34専用ルートが併存し Excel も別機能列挙のため断定不可（一次資料不足）。→ **M03-36と同じ whole-feature ee未実装判定に統一**し、**pf実装挙動を期待オラクル(pf-fallback)として§1に維持しつつ、boundできる根拠が無いため18件（-019/-081含む）を全てTBD**へ移送。**M03-44(Phase2)・M03-36(ee未実装)と同カテゴリ＝ee未実装の移行ギャップ機能。全固有挙動はee実装後に§1のpf-fallback L1を根拠に再具体化・オーナーのSUT方針確定待ち**（§9.2）。会計はR3是正後 **bound 0 / TBD 31 / excluded 55**（次項）。
2. **【R3 Major1是正／TBD-excluded境界】pf一次資料に具体挙動がある8件をexcluded→TBDへ**: -008/-070（1データ行=1商品ID・pf設計:143・L1-014）／-009/-071（価格列非更新・pf設計:146・L1-014）／-011（列順不同許容〔ヘッダ名で解決〕・pf設計:160・L1-011）／-072（一時ディレクトリ保存・読み捨て・pf設計:154,81・L1-020）／-077（POST後の履歴再読み込み・pf設計:173,188・L1-015）／-079（POST応答の同一画面再描画・pf設計:241,242・L1-005）は、汎用スタブ・内部注記でなくpf一次資料に具体挙動が実在するためB15上のTBD（記述可・SUT未実装で実行保留）。excludedは実装乖離でなく非該当・汎用スタブのみに限定。**会計 bound0/TBD23/excluded63 → bound0/TBD31/excluded55**。
3. **【R3 Major2是正／source_class純度】L1 claimからee事実を除去**: L1-001・L1-016 の claim本文にあった「SUT=eeで404」「type=discount が404」等のee比較事実を削除し、**pf-fallback claimはpf期待挙動だけ**に戻した。ee未実装（404）の観察は§0/§10メタ・§9.2のSUT方針に隔離（1claim1source）。
4. **【R2 Major2是正／記述精度】列数検査は列名検査に先行**: pf `BaseCsvImportHandler` は各データ行で **(1)列数一致(:57 addInvalidColumnCountError)→(2)ヘッダ名列存在(:70)→(3)列バリデータ** の順で検査する。旧C-011 fixture（「商品ID」1列ヘッダ・1列データ）は**列数検査で先に落ち** `format.body`「CSVのフォーマットが一致しません。 2 行目のデータを確認してください。」（pf plugin `message.ja.yml:1101`）になり、期待した列名逐語エラー「2 行目の 割引率(ID) ではデータを取得できません。」にはならない。列名逐語エラーを出すには**2列を維持し第2ヘッダのみ誤名＋データ行も2セル**が必要（SEED-M0334-BADHEADER-2COL・§2）。本件はL1-011の逐語（列数→列名の順）に反映し、ee実装後の再具体化で正しいfixtureを用いる。
3. **【R1 Major2の扱い】-019/-081**: R1では「discount_idのみ差替書戻」がpf実装で一意確定するためboundとしたが、R2裁定でSUT未実装のためboundできず**TBD**へ移送（期待オラクルL1-013は維持）。
4. **【source_class純度＝1claim1source】**: 全20 claimを pf-fallback とし、各L1 claimは pf現行の挙動のみを記述。Excel不在・ee比較（未実装・保存先列統合・type-ID流用）の観察は§0/§10メタへ隔離。エラー逐語は pf plugin 自身の `message.ja.yml`（maxrecordは pf の `%d`→5010）。
5. **成功/失敗の表示（ee移行実装後の参考）**: 成功＝`addSuccess`フラッシュ（`admin.product.csv_import.save.complete`）。取込行エラー＝`errors` を `base_csv_upload.twig:29-31` の `.text-danger` div で画面内表示（フラッシュではない）。フォーム不正・行数超過＝`addError`フラッシュ。**リダイレクトしない**（同URL再描画＝PRGでない）。グッズ商品CSV(M03-27・成功/失敗ともリダイレクト)と異なる。
6. **breakAll一意性（skipRowなし）**: 割引率変更ハンドラは `getRowValidators()` 空・skipRow 経路が無く検証失敗は全て `breakAll`。エラーが1件でも rollback され履歴・支店通知・完了ログは行わない。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

**本機能はbound候補が0件（SUT未実装で全固有挙動行がTBD）のため、観点補正の対象行は無い（0件）。** TBD/excluded行は母集合の観点ラベルをそのまま保持する（emit_concretized_tsv.py が適用する補正なし）。
