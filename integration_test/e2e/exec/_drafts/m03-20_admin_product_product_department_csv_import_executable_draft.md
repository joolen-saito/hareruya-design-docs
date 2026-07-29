# 候補: m03-20 部門CSV取込（部門更新CSV／部門CSV登録） — 実行可能グレード候補（母集合86全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R3 Major5件是正版（2026-07-29・R2 M1-M5是正確認済）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。期待値の正はL1オラクルID（三段参照）。fixture_versionは全て `@TBD-D5`。
> **本機能は部門まわりのCSV投入2系統を1機能として扱う（挙動正＝実装ソース）**。
> (1)**部門更新CSV**＝pf現行 HareruyaEc `ProductCsvController::csvProductSectionUpdate`。URL `GET/POST /{admin_route}/product/product_section_update_csv_upload`。POST後は302リダイレクトせず同一アップロード画面を再描画（render・200）。成功フラッシュ `admin.product.csv_import.save.complete`。行数上限 `CSV_IMPORT_MAX=5010`。取込履歴は種別ID11で作成日時降順に最大 `CSV_IMPORT_HISTORY_LIMIT=100` 件を**単純取得**（page_count/page_no・表示件数プルダウン・セッション保持は無い）。
> (2)**部門CSV登録**＝ee `CsvImportController::importDepartment`。URL `GET/POST /{admin_route}/product/department_csv_upload`。`mtb_section` を部門IDの有無で新規INSERT/既存UPDATE。POST後200で同一URL再描画。成功フラッシュ `admin.common.csv_upload_complete`。行数上限なし・履歴なし。
> **R3是正サマリ**: (M1)L1-019/C-017を是正＝pfは履歴を最大100件で単純取得するだけでpage_count/page_no・プルダウン・session処理が無く、-073のセッション引継ぎ期待はee側（別URL）固有＝**TBD**。(M2)-069のFile maxSize超過を会計内に戻し**-069全体をTBD**（NotBlankとmaxSizeの両成分を要求し、maxSizeは大容量ファイル要で純UI一意判定困難）、NotBlank逐語を実pf「ファイルを選択してください。」（admin.csv.error.upload.require）に是正。(M3)B12過共有を解消＝異なる期待を別候補へ分離（-072→C-022〔200同URL〕・-009→C-023〔タイトル〕・-071→C-024〔route〕・-081→C-025〔種別ID11〕・-023→C-026〔成功フラッシュ〕）。(M4)-075の**部門コード不存在**breakAll分岐をC-027で被覆（C-014は商品コード不存在分岐）。(M5)-003（明示的な未認証操作）をC-010から外し**B14で共通認証へDELEG（excluded）**。
> **方針（正直分類）**: B12共有は前提・入力・期待まで**逐語的に同一**の完全重複だけ。異なる期待は別候補。汎用スタブ・非該当観点・矛盾はexcluded。高bound数は目指さない。
> B1-B15 自己監査済み（正直分類・R3是正・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet-34「部門登録CSVアップロード」（機能No=M03-20・概要「商品情報に紐づく部門のマスター情報をCSVで一括登録することができる」）。刷新後カスタマイズ（★免税区分0/1/2登録・★MTGBuyer表示フラグ・★スマレジ部門連携）を規定。git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。
- **pf現行md（回帰先ラベル・source_class=pf-fallback）**: `functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md`（git hash-object `9850117a73381b33a69bf8c7f02687981ab1d97a`。以下「pf-md:行」）。**pf-mdの入口記述は一部ee経路（/section/csv_upload・302・履歴ページング）を確認値としているが、挙動正は実pf HareruyaEc＝R2/R3でURL/リダイレクト/成功キー/履歴取得を実pf値に是正**。
- **実装ソース（挙動正・クロス検証・standard-src付与ゼロ）**:
  - pf（部門更新CSVの挙動正）: `/home/y-saito/Developments/pf-eccube3/`。`app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php`（csvProductSectionUpdate 798-810・Upload 815-858・CSV_IMPORT_MAX=5010 391・CSV_IMPORT_HISTORY_LIMIT=100 392・render/履歴取得 1857-1860）・`ServiceProvider/Admin/ProductServiceProvider.php:116-121`（route product_section_update_csv_upload）・`Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php`（商品検証131・部門検証188・breakAll）・`app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:28-40`（NotBlank=admin.csv.error.upload.require・File maxSize）・`src/Eccube/Resource/locale/message.ja.yml:133`（csv_import.save.complete）・`Resource/template/admin/Product/base_csv_upload.twig`（旧twig＝「商品管理」ハードコード・履歴ページング無し）。
  - ee（部門CSV登録＝importDepartment・DB正典・刷新後twig・共通認証）: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`。`Controller/Admin/Product/Csv/CsvImportController.php:1160-1300`・`Entity/Master/MtbSection.php:55-56,140`（tax_free_division int）・`Entity/Master/MtbCsvImportType.php:38`（PRODUCT_SECTION_IMPORT_CSV_ID=11）・`Resource/locale/messages.en.yaml`・`Resource/template/admin/Product/csv_department.twig:5-6`・`base_csv_upload.twig:3`。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-20-…-001..086`（86件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation 付与ゼロ＝Gate G2）。実装ソースはクロス検証・逐語根拠にのみ用いsource_classへ計上しない。
- **B14未認証委譲（M03-20はモジュール最小IDでない）**: 観点「未認証」の-003は共通認証（M01-01代表）へDELEG＝excluded（§9.3）。
- **B1事前スイープ**: 真のTBDは-018（免税区分の期待が実装と不一致）・-069（NotBlank+File maxSize両成分・maxSize要実機）・-073（履歴セッションはpf現行に無くee固有）・-078（情報ログ観測手段未整備）の4件。

---

## §1 L1原子オラクル表

全22claim。**source_class列は excel／pf-fallback のみ**。**LS列は英語資源の実在で判定**（Gate B4）: 翻訳キー描画のメッセージ/ラベルは ee `messages.en.yaml` でgrep確認し英訳があれば **LS=1**（en逐語は§5）。ハードコード日本語・固定ファイル名・pf独自キーで英訳無し・Excel逐語は LS=0。**LS=1は4件**（L1-001/004/008/012）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0320-001 | http_entry | 部門CSV登録画面 GET /product/department_csv_upload を開くと隠しファイル入力とファイル名表示・一括登録の送信ボタン（admin.common.bulk_registration）・フォーマット表（必須列に必須バッジ admin.common.required）・雛形リンク（admin.common.csv_skeleton_download）が表示され、サブタイトルは admin.product.product_management である | 「ファイル選択・一括登録ボタン、フォーマット表、雛形リンクが表示される。」「送信ボタンは admin.common.bulk_registration。」 | pf-md:44,65,342 / csv_department.twig:5-6 / messages.en.yaml:1711,1785,1805,1930 | pf-fallback | 1 |
| L1-M0320-002 | display_field | 部門CSV登録画面はフォーム送信時にアップロードボタンと雛形ボタンを無効化しスピナー（spin.js）を表示する | 「送信時にアップロード・雛形ボタンを無効化し、スピナーを表示（spin.js）。」 | pf-md:66 / csv_department.twig:10-11 | pf-fallback | 0 |
| L1-M0320-003 | file_handling | 部門CSV登録の雛形ダウンロード GET /product/csv_template/department を実行すると department.csv が得られる | 「雛形ダウンロード（部門マスタCSV登録）｜department.csv が得られる。」 | pf-md:46,343 | pf-fallback | 0 |
| L1-M0320-004 | message | 部門CSV登録の全データ行成功でコミットし成功フラッシュ admin.common.csv_upload_complete・情報ログ「部門CSV登録完了」・Doctrineキャッシュクリアを行い200で同一URLの部門CSV登録画面を再表示する。mtb_sectionは新規INSERTまたは既存UPDATEで確定する | 「全行成功後にコミット、成功フラッシュ admin.common.csv_upload_complete。」「部門CSV登録は 200 で同一画面に成功フラッシュ。」 | pf-md:115,209,256 / messages.en.yaml:1684 | pf-fallback | 1 |
| L1-M0320-005 | data_integrity | 部門CSV登録は部門ID列が空なら新規MtbSectionをINSERTし、非空で該当IDの既存mtb_sectionが取れればその行をUPDATEする（部門IDの有無で新規/更新分岐） | 「空なら新規 MtbSection。」「部門ID列が空なら新規行。非空で既存 ID が取れればその行を更新。」 | pf-md:110,156,220 | pf-fallback | 0 |
| L1-M0320-006 | validation | 部門CSV登録で部門名が空なら「◯行目部門名が設定されていません。」、部門コードが空なら「◯行目部門コードが設定されていません。」、免税区分が空なら「◯行目免税区分が設定されていません。」の行番号付きエラー（ハードコード日本語）で打ち切りロールバックして完了しない | 「部門名・部門コードが空なら行番号付きエラーで打ち切り。」「免税区分が空ならエラーで打ち切り。」 | pf-md:111,112,116,145 | pf-fallback | 0 |
| L1-M0320-007 | validation | 部門CSV登録の部門ID列が非空で数字でないときは「◯行目の部門IDが存在しません。」、数字でも該当IDのmtb_sectionが無ければ別分岐で「◯行目の更新対象の部門IDが存在しません。新規登録の場合は、部門IDの値を空で登録してください。」で打ち切る（いずれもハードコード日本語・別メッセージ） | 「数字のみでなければ「◯行目の部門IDが存在しません。」で打ち切り。」「無ければ「更新対象の部門IDが存在しません。…空で登録」で打ち切り。」 | pf-md:110,144 | pf-fallback | 0 |
| L1-M0320-008 | message | 部門CSV登録でファイル未選択のときおよびデータ行が0のときは admin.common.csv_invalid_no_data を積んで同画面に留まる。CSV読込失敗または必須ヘッダ欠如のときは admin.common.csv_invalid_format を積んで同画面に留まる | 「ファイル未選択時は admin.common.csv_invalid_no_data。」「失敗時は admin.common.csv_invalid_format。データ行が 0 なら csv_invalid_no_data。」 | pf-md:106,108 / messages.en.yaml:1810,1811 | pf-fallback | 1 |
| L1-M0320-009 | validation | 刷新後カスタマイズ（Excel最優先）として免税区分を登録可能とし、スマレジの登録に合わせて0対象外・1一般品・2消耗品を登録できる | 「免税区分は…0:対象外、1:一般品、2:消耗品を登録可能とする」 | 0204:部門登録CSVアップロード!D55 | excel | 0 |
| L1-M0320-010 | validation | 部門CSV登録の免税区分は空チェック後 MtbSection::setTaxFreeDivision(int) へ渡される。数値文字列は整数化されて通過し0/1/2以外の値範囲検証は無い。非数値文字列はint型引数のためTypeError（型例外）となる。保存先は移行先の mtb_section.tax_free_division である | 「空でなければ通過し得る（数値以外の厳密拒否は実装されていない）。」「免税区分は移行先の mtb_section.tax_free_division を正とする。」 | pf-md:29,157,183 / CsvImportController.php:1247,1252 / MtbSection.php:55-56,140 | pf-fallback | 0 |
| L1-M0320-011 | rollback | 部門CSV登録はエラー時に renderWithError がロールバックしテンプレートへエラー一覧（画面内errorsリスト）を渡す。行途中失敗ではトランザクションがロールバックされ当該リクエストの更新はコミットされない | 「エラー時は renderWithError がロールバックし、テンプレートへエラー一覧を渡す。」 | pf-md:116,194,210 | pf-fallback | 0 |
| L1-M0320-012 | http_entry | 部門更新CSV画面 GET /product/product_section_update_csv_upload を開くと画面が開き下部に取込履歴テーブル（ファイル名・アップロード日時・作業者）が付く。刷新後twig（base_csv_upload）の画面タイトルは翻訳キー admin.product.product_management で描画される（pf現行HareruyaEc旧twigは同位置を商品管理でハードコード＝表示のpf/ee食い違い） | 「部門更新CSVの画面が開く。取込履歴テーブルが下に付く。」「ブロックタイトルは「商品管理」。」 | pf-md:41,56 / ProductServiceProvider.php:116-118 / base_csv_upload.twig:3 / messages.en.yaml:1930 | pf-fallback | 1 |
| L1-M0320-013 | file_handling | 部門更新CSVの雛形ダウンロードを実行すると product_section_update.csv が得られる | 「雛形ダウンロード（部門更新）｜product_section_update.csv が得られる。」 | pf-md:42 / ProductCsvController.php:461 | pf-fallback | 0 |
| L1-M0320-014 | http_flow | 部門更新CSVの正常POST /product/product_section_update_csv_upload は、検証・取込がエラー無しで完了したとき302リダイレクトせず同一の部門更新CSVアップロード画面を再描画（render・200）し、成功フラッシュ admin.product.csv_import.save.complete を addSuccess する（本claimは成功フローのみ・失敗フローはL1-022） | 「addSuccess('admin.product.csv_import.save.complete')。」「return render(productSectionUpdateTwig)。」 | pf-md:43 / ProductCsvController.php:852,858,1857-1866 / message.ja.yml:133 | pf-fallback | 0 |
| L1-M0320-022 | http_flow | 部門更新CSVの取込（CsvImporter）がエラーを持って終了したとき、pf現行は addSuccess も addError も呼ばず（フォーム妥当性・行数上限とは別経路）、result のエラー配列を render の errors へ渡し302リダイレクトせず同一画面を再描画（200）し、テンプレートが画面内の .text-danger にエラーメッセージを表示する（フラッシュではない・成功フラッシュは出ない・本claimは取込失敗フローのみ・成功はL1-014） | 「return render(…, result->getErrors())。」「div class=text-danger error.message。」 | pf-md:43 / ProductCsvController.php:846,858,1857-1866 / base_csv_upload.twig:29-30 | pf-fallback | 0 |
| L1-M0320-015 | message | 部門更新CSVのPOSTでCSV行数（wc -l／countCsvRows）が定数CSV_IMPORT_MAX=5010以上のとき admin.csv.error.upload.maxrecord（%maxRecord% 行を超えるCSVファイルは登録できません。）を積んで同一アップロード画面を再描画し取込は行われない。この行数上限は部門更新CSV系のPOSTで使用され、部門CSV登録（ee importDepartment）には行数上限チェックが無い | 「(int)exec('wc -l …') >= self::CSV_IMPORT_MAX。」「ADMIN_CSV_IMPORT_MAX_ROWS は部門更新CSVの POST のみで使用。」 | pf-md:184 / ProductCsvController.php:391,838-841 / CsvImportController.php:1160-1210 | pf-fallback | 0 |
| L1-M0320-016 | validation | 部門更新CSVは各行で商品コードを existsByProductCode で検証し（見つからなければbreakAll）、次に部門コードが非空なら mtb_section.code で部門存在を検証する（見つからなければ別分岐でbreakAll）。先頭データ行が不正なら breakAll により後続行は処理されずトランザクションはロールバックされる（取込エラーの画面表示方法は L1-022） | 「商品コードが…無ければ、その行で全処理中断（breakAll）。」「部門コードが空でなければ mtb_section.code で部門が見つかることを検証。見つからなければマスタ不存在エラーで breakAll。」 | pf-md:91,92,181 / ProductSectionUpdateImportHandler.php:131,188-208 / ProductCsvController.php:850-858 | pf-fallback | 0 |
| L1-M0320-017 | data_integrity | 部門更新CSVで検証を通過した行はdtb_product_classのproduct_code一致全行のsection_idを、部門コードが非空なら該当部門ID・空ならnullにネイティブUPDATEで更新し継続する。取込成功後は商品規格を再表示するとsection_id変更が見える | 「product_code が一致する全行の section_id を、部門コードが空なら null、非空なら該当部門の ID に更新する。」 | pf-md:93,155,192,219 / ProductSectionUpdateImportHandler.php:191-197 | pf-fallback | 0 |
| L1-M0320-018 | history | 部門更新CSVは成功時（エラー無し）のみdtb_csv_import_historyに取込履歴を1件INSERTする（種別ID＝PRODUCT_SECTION_IMPORT_CSV_ID=11・ファイル名＝クライアントオリジナル名）。部門CSV登録は履歴テーブルへ書かない | 「成功時のみ取込履歴 INSERT。」「部門更新CSV成功時のみ追加（種別 ID 11）。」「部門CSV登録は履歴テーブルへ書かない。」 | pf-md:95,193,221 / ProductCsvController.php:852-857 / MtbCsvImportType.php:38 | pf-fallback | 0 |
| L1-M0320-019 | display_field | 部門更新CSV画面（pf HareruyaEc render）は取込履歴を種別ID11で作成日時降順に最大 CSV_IMPORT_HISTORY_LIMIT=100 件だけ単純取得して表示する。page_count/page_no・表示件数プルダウン・セッション保持は pf現行HareruyaEc には無く、ee側（別URL importDepartment系）にのみ存在する（pf/ee食い違い＝母集合-073のセッション引継ぎ期待はpfに無いためTBD） | 「findBy(['csvImportTypeId'=>…],['createDate'=>'DESC'], self::CSV_IMPORT_HISTORY_LIMIT)。」「const CSV_IMPORT_HISTORY_LIMIT = 100。」 | pf-md:56 / ProductCsvController.php:392,1857-1860 | pf-fallback | 0 |
| L1-M0320-020 | validation | 部門更新CSVのフォーム（pf HareruyaEc admin_csv_import）の import_file は required で NotBlank（message=admin.csv.error.upload.require=「ファイルを選択してください。」）と File（maxSize=設定csv_sizeメガバイト・maxSizeMessage=admin.csv.error.upload.maxsize）の制約を持つ。ファイル未選択のときNotBlankエラー、サイズ超過のときFile maxSizeエラーになり、失敗時は各エラーをフラッシュして同一画面を再描画する。母集合-069はNotBlankとFile maxSizeの両成分を要求するがmaxSize超過は大容量ファイルを要し純UIで一意判定困難のためTBD | 「NotBlank(['message' => trans('admin.csv.error.upload.require')])。」「File(['maxSize' => csv_size.'M', …])。」 | pf-md:237 / HareruyaEc/CsvImportType.php:28-40 / messages.ja.yaml:1624 | pf-fallback | 0 |
| L1-M0320-021 | log | 部門更新CSVのPOST開始時に情報ログ「部門更新CSV登録開始」・成功時「部門更新 正常終了」と件数・失敗時「部門更新 異常終了」を出す（documentation-only＝アプリログの観測手段が未整備で画面/DBでは一意固定できずTBD） | 「log_info('部門更新CSV登録開始')。」「log_info('部門更新 正常終了', …)。」 | pf-md:89 / ProductCsvController.php:846,851,855 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

下表の固定値は入力の再現手段であり期待値の正にしない。更新CSVを流すケースは後始末（.down.sql）でSEED状態へ復元（`@TBD-D5`）。**各異常系SEEDは1データ行・単一の異常のみを持ち、ケースの入力を一意にする（B1）**。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提 | 管理者アカウント | 不要 |
| SEED-M0320-MASTERS | 取込の前提マスタ | 既存 mtb_section 数件（部門ID・名・コード・免税区分・表示フラグ）・既存商品 dtb_product_class（product_code・現 section_id 既知値） | 不要（参照） |
| SEED-M0320-DEPT-VALIDNEW | 部門CSV登録・新規登録 | 部門ID空・部門名/コード/免税区分が妥当な1行の正常CSV | 追加 mtb_section 行を復元 |
| SEED-M0320-DEPT-VALIDUPD | 部門CSV登録・既存更新（ID付きUPDATE経路） | 既存部門IDを指定し名称・コード・免税区分を変更する1行CSV | 対象 mtb_section 行をSEED値へ復元 |
| SEED-M0320-DEPT-MISSINGNAME | 必須非空検証（部門名空・打ち切り） | 部門名のみを空にし他は妥当な1行CSV | 不要（ロールバック） |
| SEED-M0320-DEPT-BADIDNUM | 部門ID数字形式検証（非数字→打ち切り） | 部門ID列に数字でない値（例 "A1"）を持つ1行CSV。他は妥当 | 不要（打ち切り） |
| SEED-M0320-DEPT-BADIDMISS | 部門ID既存実在検証（数字だが不存在→打ち切り） | 部門ID列に数字だが mtb_section に存在しないIDを持つ1行CSV。他は妥当 | 不要（打ち切り） |
| SEED-M0320-DEPT-BADHEADER | 必須ヘッダ欠如検証（フォーマット不一致） | 必須ヘッダ（部門名/コード/免税区分のいずれか）が欠けたヘッダ行CSV | 不要（拒否） |
| SEED-M0320-DEPT-TAX | 免税区分（0/1/2数値文字列）登録検証 | 免税区分に0・1・2（数値文字列）を持つ妥当な部門CSV登録ファイル | 追加 mtb_section 行を復元 |
| SEED-M0320-DEPT-BIGROWS | 部門CSV登録に行数上限が無いことの検証 | 5010行以上の全行妥当な部門CSV登録ファイル | 追加 mtb_section 行を復元 |
| SEED-M0320-SECT-HISTORY | 部門更新CSV取込履歴の表示検証（最大100件単純取得） | dtb_csv_import_history に部門更新CSV種別（種別ID11）の履歴を複数件 | 不要（参照） |
| SEED-M0320-SECT-VALIDCODE | 部門更新CSV・部門コード非空の正常取込 | 既存商品コード×既存部門コードの1行の正常CSV。対象商品の現 section_id 既知値 | 変更 section_id を復元 |
| SEED-M0320-SECT-NULLCODE | 部門更新CSV・部門コード空の正常取込（section_id null化） | 既存商品コードを持ち部門コードを空にした1行CSV。対象商品の現 section_id 既知値（非null） | 変更 section_id を復元 |
| SEED-M0320-SECT-ERROR | 部門更新CSV・失敗（存在しない商品コード）取込 | 存在しない商品コードを持つ1行CSV（breakAll誘発・画面内エラー表示用） | 不要（ロールバック） |
| SEED-M0320-SECT-MAXROW | 行数上限（maxrecord）検証 | データ行が5010行以上の部門更新CSV | 不要（拒否） |
| SEED-M0320-SECT-BREAKPROD | breakAll（先頭行の商品コード不存在→後続未処理）検証 | 1行目=存在しない商品コード、2行目=既存商品コード×部門コードBでsection_idをA→Bに変えようとする正常行。対象商品の現 section_id=A 既知値 | 不要（breakAll・ロールバック） |
| SEED-M0320-SECT-BREAKSECT | breakAll（先頭行の部門コード不存在→後続未処理）検証 | 1行目=既存商品コード×存在しない部門コード（部門検証breakAll誘発）、2行目=既存商品コード×部門コードBでsection_idをA→Bに変えようとする正常行。対象商品の現 section_id=A 既知値 | 不要（breakAll・ロールバック） |

---

## §3 取込CSV列マトリクス（参照情報）

| 系統 | 主な列 | 必須/任意 | 根拠 |
|---|---|---|---|
| 部門更新CSV | 商品コード | 必須 | pf-md:91 |
| 部門更新CSV | 部門コード（空なら section_id を null 化・継続） | 任意 | pf-md:91,155 |
| 部門CSV登録 | 部門名・部門コード・免税区分 | 必須 | pf-md:108,145 |
| 部門CSV登録 | 部門ID（空は新規INSERT・非空はUPDATE） | 任意 | pf-md:110,156 |
| 部門CSV登録（★カスタマイズ） | 免税区分（0対象外/1一般品/2消耗品・数値文字列） | 必須 | 0204:部門登録CSVアップロード!D55 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 26候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0320C-NNN[±英字]`（末尾＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **各ケースは単一入力・単一判定（B1）／B12共有は逐語同一の完全重複のみ（M3）**。
- **検証設計（Gate B9）**: 結果は成功フラッシュ（addSuccess）・フォーム妥当性/行数上限のエラーフラッシュ（addError）・取込（CsvImporter）エラーの画面内errorsリスト（.text-danger）・取込履歴テーブルを画面で目視するのが主。取込効果は対象を再表示（部門CSV登録＝部門一覧/部門編集で mtb_section、部門更新CSV＝商品規格一覧/詳細で section_id）して具体値を照合。異常系ロールバック/breakAllの否定的事実（何も書かれない・件数不変・値不変）と履歴の種別ID・件数のみ『自動検証（内部・DB）』へ。
- 操作手順は純UI操作。db.ts/afterEachは書かない（Gate B10）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-20_admin_product_product_department_csv_import	E2E-M0320C-001	IT-25	画面表示	P1	部門CSV登録画面がGETで開きファイル入力・一括登録ボタン・フォーマット表・雛形リンクが表示される	ログイン済(SEED-M01-ADMIN)	—	1. 部門CSV登録画面 /%eccube_admin_route%/product/department_csv_upload を開く 2. ファイル入力・一括登録の送信ボタン・フォーマット表(必須列に必須バッジ)・雛形リンク・サブタイトルが表示されることを確認	部門CSV登録画面が開き、隠しファイル入力とファイル名表示・一括登録の送信ボタン(日本語「一括登録を実行」/英語「Register All」)・フォーマット表(必須列に必須バッジ「必須」/「Required」)・雛形リンク「雛形ファイルダウンロード」/「Download a template」が表示され、サブタイトルは「商品管理」/「Products」である [L1:L1-M0320-001; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-002	IT-20	JS挙動	P2	部門CSV登録の送信時にボタンが無効化されスピナーが表示される	ログイン済／SEED-M0320-DEPT-VALIDNEW	新規登録の正常CSVファイル	1. 部門CSV登録画面でファイルを選択し一括登録ボタンを押下 2. 送信中にアップロードボタンと雛形ボタンが無効化されスピナーが表示されることを確認	フォーム送信時にアップロードボタンと雛形ボタンが無効化され、スピナー(spin.js)が表示される [L1:L1-M0320-002; fixture:SEED-M0320-DEPT-VALIDNEW@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-003	IT-25	雛形ダウンロード	P2	部門CSV登録の雛形ダウンロードでdepartment.csvが得られる	ログイン済	—	1. 部門CSV登録画面で雛形リンク /%eccube_admin_route%/product/csv_template/department を実行 2. ダウンロードファイル名を確認	部門CSV登録の雛形ダウンロードを実行すると department.csv が得られる [L1:L1-M0320-003; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-004	IT-07	取込成功	P1	正常な部門CSV登録が成功し成功フラッシュと部門マスタ反映を画面で確認する	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-VALIDNEW	部門ID空・部門名/コード/免税区分が妥当な新規1行CSVファイル	1. ファイルを選択し一括登録ボタンを押下 2. 成功フラッシュが表示されエラー表示が出ないことを確認 3. 部門一覧/部門編集を再表示しCSVの部門名・部門コード・免税区分を持つ部門行が追加されていることを確認	部門CSV登録は全データ行成功でコミットし、成功フラッシュ「CSVファイルをアップロードしました」/「CSV file uploaded」が管理画面上部に表示され、部門一覧/部門編集を再表示するとCSVの部門名・部門コード・免税区分を持つ新規部門行が mtb_section に登録されている [L1:L1-M0320-004,L1-M0320-005; fixture:SEED-M0320-DEPT-VALIDNEW@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-022	IT-20	画面遷移	P2	部門CSV登録のPOSTは302でなく200で同一URLをHTML再描画する	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-VALIDNEW	新規登録の正常CSVファイル	1. ファイルを選択し一括登録ボタンを押下 2. 302リダイレクトが発生せず同一URL /product/department_csv_upload の200 HTML応答で再描画されることを確認	部門CSV登録のPOSTは302リダイレクトせず、同一URL /%eccube_admin_route%/product/department_csv_upload の200 HTML応答として同一画面を再描画する [L1:L1-M0320-004; fixture:SEED-M0320-DEPT-VALIDNEW@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-005	IT-07	更新登録	P1	既存部門IDを指定した部門CSV登録が既存行を更新する	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-VALIDUPD	既存部門IDを指定し名称・コード・免税区分を変更する1行CSVファイル	1. 既存部門IDを持つCSVを選択し一括登録ボタンを押下 2. 成功フラッシュが表示されることを確認 3. 部門編集で当該部門IDを再表示し名称・コード・免税区分がCSVの値へ更新されていることを確認	部門ID列が非空で該当IDの既存mtb_sectionが取れるとき新規登録ではなくその行がUPDATEされる。部門編集で当該部門IDを再表示すると名称・部門コード・免税区分がCSVの値へ更新されている [L1:L1-M0320-005,L1-M0320-004; fixture:SEED-M0320-DEPT-VALIDUPD@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-006	IT-22	必須バリデーション	P1	部門名が空の行は打ち切りロールバックされ完了しない	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-MISSINGNAME	部門名のみが空で他は妥当な1行CSVファイル	1. 部門名が空のCSVを選択し一括登録ボタンを押下 2. 画面内errorsリストにエラーが表示され成功フラッシュが出ないことを確認 3. 部門一覧を再表示し対象部門が登録されていないことを確認	部門名が空のとき「◯行目部門名が設定されていません。」が画面内errorsリストに表示され、成功フラッシュは出ずrenderWithErrorがロールバックして取込は完了せず対象部門は登録されない ／ 自動検証（内部・DB）: mtb_section に当該行の書込みが無い [L1:L1-M0320-006,L1-M0320-011; fixture:SEED-M0320-DEPT-MISSINGNAME@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-007	IT-22	入力値検証	P1	部門IDが数字でない行は打ち切られ完了しない	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-BADIDNUM	部門ID列に数字でない値を持つ1行CSVファイル	1. 部門IDが数字でないCSVを選択し一括登録ボタンを押下 2. 画面内errorsリストにエラーが表示され成功フラッシュが出ないことを確認 3. 部門一覧を再表示し変更が無いことを確認	部門ID列が非空で数字のみでないとき「◯行目の部門IDが存在しません。」が画面内errorsリストに表示され、成功フラッシュは出ず取込は完了しない（打ち切り・ロールバック） ／ 自動検証（内部・DB）: mtb_section に当該行の登録も更新も無い [L1:L1-M0320-007,L1-M0320-011; fixture:SEED-M0320-DEPT-BADIDNUM@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-018	IT-22	存在検証	P1	数字だが存在しない部門IDの行は別メッセージで打ち切られ完了しない	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-BADIDMISS	部門ID列に数字だが存在しないIDを持つ1行CSVファイル	1. 数字だが存在しない部門IDのCSVを選択し一括登録ボタンを押下 2. 画面内errorsリストにエラーが表示され成功フラッシュが出ないことを確認 3. 部門一覧を再表示し変更が無いことを確認	部門ID列が数字でも該当IDのmtb_sectionが無いとき「◯行目の更新対象の部門IDが存在しません。新規登録の場合は、部門IDの値を空で登録してください。」が画面内errorsリストに表示され、成功フラッシュは出ず取込は完了しない（打ち切り・ロールバック） ／ 自動検証（内部・DB）: mtb_section に当該行の登録も更新も無い [L1:L1-M0320-007,L1-M0320-011; fixture:SEED-M0320-DEPT-BADIDMISS@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-008	IT-17	フォーマット不一致	P1	必須ヘッダが欠けたCSVはフォーマット不一致エラーで同画面に留まる	ログイン済／SEED-M0320-DEPT-BADHEADER	必須ヘッダ(部門名/コード/免税区分のいずれか)が欠けたヘッダ行のCSVファイル	1. 必須ヘッダ欠如のCSVを選択し一括登録ボタンを押下 2. エラーメッセージが管理画面上部に表示され同画面に留まることを確認	必須ヘッダが欠けるとき「CSVのフォーマットが一致しません」/「Unmatched CSV format」(admin.common.csv_invalid_format)が管理画面上部に表示され部門CSV登録画面に留まり取込は行われない ／ 自動検証（内部・DB）: mtb_section に書込みが無い [L1:L1-M0320-008,L1-M0320-011; fixture:SEED-M0320-DEPT-BADHEADER@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-009	IT-22	入力値検証	P2	免税区分0/1/2の数値文字列を持つ部門CSV登録が受け付けられ免税区分が反映される	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-TAX	免税区分に0・1・2(数値文字列)を持つ妥当な部門CSV登録ファイル	1. 免税区分0/1/2を持つCSVを選択し一括登録ボタンを押下 2. 成功フラッシュを確認 3. 部門一覧/部門編集で各部門の免税区分(0対象外・1一般品・2消耗品)が反映されていることを確認	刷新後カスタマイズとして免税区分0対象外・1一般品・2消耗品が登録可能で、数値文字列は整数化されて通過するため0/1/2を持つ正常CSVは受け付けられ、部門一覧/部門編集を再表示すると各部門の免税区分がCSVの値で表示される [L1:L1-M0320-009,L1-M0320-010; fixture:SEED-M0320-DEPT-TAX@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-021	IT-12	行数上限	P2	部門CSV登録は5010行以上でも行数上限では拒否されず各行が処理される	ログイン済／SEED-M0320-MASTERS／SEED-M0320-DEPT-BIGROWS	5010行以上の全行妥当な部門CSV登録ファイル	1. 5010行以上の妥当な部門CSV登録ファイルを選択し一括登録ボタンを押下 2. 行数上限エラー(maxrecord)が表示されず取込が進み成功フラッシュが出ることを確認	部門CSV登録には行数上限チェックが無いため5010行以上でもmaxrecordエラーは出ず、各行が処理され成功フラッシュが表示される（行数上限は部門更新CSV系のPOSTのみで使用） [L1:L1-M0320-015; fixture:SEED-M0320-DEPT-BIGROWS@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-010	IT-25	画面表示	P1	部門更新CSV画面がGETで開き取込履歴テーブルが表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0320-SECT-HISTORY	—	1. 部門更新CSV画面 /%eccube_admin_route%/product/product_section_update_csv_upload を開く 2. 画面が開き下部に取込履歴テーブル(ファイル名・アップロード日時・作業者)が表示されることを確認	部門更新CSVの画面が開き、下部に取込履歴テーブル(ファイル名・アップロード日時・作業者)が付き、履歴は種別ID11で作成日時降順に最大100件が単純取得されて表示される [L1:L1-M0320-012,L1-M0320-019; fixture:SEED-M0320-SECT-HISTORY@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-023	IT-25	画面表示	P2	部門更新CSV画面のタイトルは翻訳キーで商品管理と描画される	ログイン済(SEED-M01-ADMIN)	—	1. 部門更新CSV画面を開く 2. 刷新後twigの画面タイトルが翻訳キー描画で「商品管理」/「Products」であることを確認	部門更新CSV画面（刷新後twig base_csv_upload）の画面タイトルは翻訳キー admin.product.product_management で「商品管理」/「Products」と描画される [L1:L1-M0320-012; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-024	IT-25	画面表示	P2	部門更新CSV画面はGET専用ルートで開く	ログイン済(SEED-M01-ADMIN)	—	1. GET /%eccube_admin_route%/product/product_section_update_csv_upload へアクセス 2. 部門更新CSVアップロード画面が返ることを確認	部門更新CSV画面は GET /%eccube_admin_route%/product/product_section_update_csv_upload のルートで開き、部門更新CSVアップロード画面が返る [L1:L1-M0320-012; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-011	IT-25	雛形ダウンロード	P2	部門更新CSVの雛形ダウンロードでproduct_section_update.csvが得られる	ログイン済	—	1. 部門更新CSV画面で雛形ダウンロードを実行 2. ダウンロードファイル名を確認	部門更新CSVの雛形ダウンロードを実行すると product_section_update.csv が得られる [L1:L1-M0320-013; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-012A	IT-20	画面遷移	P1	部門更新CSVの正常POSTは302でなく同一アップロード画面を再描画し成功フラッシュを表示する	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-VALIDCODE	正常な部門更新CSVファイル(既存商品コード×既存部門コード)	1. 正常な部門更新CSVを選択し送信 2. 302リダイレクトせず同一の部門更新CSVアップロード画面が再描画され成功フラッシュが表示されることを確認	部門更新CSVの正常POSTは検証・取込後に302リダイレクトせず同一の部門更新CSVアップロード画面を再描画(200)し、成功フラッシュ「商品登録CSVファイルをアップロードしました。」が管理画面上部に表示される（取込失敗時の画面内エラー表示はC-012Bが担う） [L1:L1-M0320-014; fixture:SEED-M0320-SECT-VALIDCODE@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-026	IT-20	メッセージ	P1	部門更新CSVの成功取込で成功フラッシュが表示される	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-VALIDCODE	正常な部門更新CSVファイル	1. 正常な部門更新CSVを送信 2. 成功フラッシュ「商品登録CSVファイルをアップロードしました。」が表示されることを確認	部門更新CSVの成功取込時は成功フラッシュ「商品登録CSVファイルをアップロードしました。」(admin.product.csv_import.save.complete)が管理画面上部に表示される [L1:L1-M0320-014; fixture:SEED-M0320-SECT-VALIDCODE@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-012B	IT-20	画面遷移	P1	部門更新CSVの取込失敗POSTは302でなく同一画面を再描画し画面内エラー表示(.text-danger)を出す	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-ERROR	存在しない商品コードを持つ部門更新CSVファイル	1. 存在しない商品コードの部門更新CSVを選択し送信 2. 302リダイレクトせず同一の部門更新CSVアップロード画面が再描画され、画面内のエラー表示(.text-danger)に取込エラーが出て成功フラッシュが出ないことを確認	部門更新CSVの取込失敗POSTは302リダイレクトせず同一の部門更新CSVアップロード画面を再描画(200)し、CsvImporterのエラーはフラッシュではなく画面内のエラー表示(text-dangerのdiv)にメッセージが表示され、成功フラッシュは出ない [L1:L1-M0320-022,L1-M0320-016; fixture:SEED-M0320-SECT-ERROR@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-013	IT-12	行数上限	P1	部門更新CSVで5010行以上はmaxrecordで拒否される	ログイン済／SEED-M0320-SECT-MAXROW	5010行以上の部門更新CSVファイル	1. 5010行以上の部門更新CSVを選択し送信 2. maxrecordエラーフラッシュ表示と同一画面再描画を確認	部門更新CSVでCSV行数がCSV_IMPORT_MAX=5010以上のとき「5010 行を超えるCSVファイルは登録できません。」(admin.csv.error.upload.maxrecord)が表示され同一アップロード画面が再描画され取込は行われない ／ 自動検証（内部・DB）: dtb_product_class の section_id と dtb_csv_import_history に変化が無い [L1:L1-M0320-015; fixture:SEED-M0320-SECT-MAXROW@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-014	IT-22	中断	P1	部門更新CSVで先頭行の商品コードが存在しないとbreakAllし後続正常行を処理せずロールバックする	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-BREAKPROD	1行目=存在しない商品コード、2行目=既存商品コード×部門コードBでsection_idをA→Bに変えようとする正常行のCSVファイル	1. breakAll誘発CSVを選択し送信 2. 画面内のエラー表示(.text-danger)にエラーが出て成功フラッシュが出ないことを確認 3. 2行目対象商品の商品規格を再表示しsection_idがAのままであることを確認	部門更新CSVで1行目の商品コードがexistsByProductCodeで見つからずbreakAllし、以降の2行目は処理されずロールバックされる。取込エラーはフラッシュではなく画面内のエラー表示(text-dangerのdiv)にメッセージが表示され成功フラッシュは出ない。2行目対象商品のsection_idはA(取込前値)のままでBへ変わらない ／ 自動検証（内部・DB）: dtb_product_class の当該2行目の section_id が A のまま変わらず dtb_csv_import_history も増えない [L1:L1-M0320-016,L1-M0320-022; fixture:SEED-M0320-SECT-BREAKPROD@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-027	IT-22	中断	P1	部門更新CSVで先頭行の部門コードが存在しないとbreakAllし後続正常行を処理せずロールバックする	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-BREAKSECT	1行目=既存商品コード×存在しない部門コード、2行目=既存商品コード×部門コードBでsection_idをA→Bに変えようとする正常行のCSVファイル	1. 部門コード不存在のbreakAll誘発CSVを選択し送信 2. 画面内のエラー表示(.text-danger)にエラーが出て成功フラッシュが出ないことを確認 3. 2行目対象商品の商品規格を再表示しsection_idがAのままであることを確認	部門更新CSVで1行目の部門コードがmtb_section.codeに見つからずマスタ不存在エラーでbreakAllし、以降の2行目は処理されずロールバックされる。取込エラーはフラッシュではなく画面内のエラー表示(text-dangerのdiv)にメッセージが表示され成功フラッシュは出ない。2行目対象商品のsection_idはA(取込前値)のままでBへ変わらない ／ 自動検証（内部・DB）: dtb_product_class の当該2行目の section_id が A のまま変わらず dtb_csv_import_history も増えない [L1:L1-M0320-016,L1-M0320-022; fixture:SEED-M0320-SECT-BREAKSECT@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-015A	IT-07	取込反映	P1	部門更新CSVの部門コード非空行でproduct_code一致商品のsection_idが該当部門IDに更新される	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-VALIDCODE	既存商品コード×既存部門コード(非空)の1行の正常部門更新CSVファイル	1. 正常な部門更新CSVを送信し成功フラッシュを確認 2. 商品規格一覧/詳細を再表示し当該商品のsection_idが該当部門IDに更新されていることを確認	部門更新CSVの部門コード非空行は、dtb_product_classのproduct_code一致全行のsection_idを該当部門のIDにネイティブUPDATEし継続する。商品規格一覧/詳細を再表示するとsection_idが該当部門IDへ更新されている [L1:L1-M0320-017; fixture:SEED-M0320-SECT-VALIDCODE@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-015B	IT-07	取込反映	P1	部門更新CSVの部門コード空行でproduct_code一致商品のsection_idがnull化される	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-NULLCODE	既存商品コードを持ち部門コードを空にした1行の正常部門更新CSVファイル(対象商品の現section_idは非null)	1. 部門コード空の部門更新CSVを送信し成功フラッシュを確認 2. 商品規格一覧/詳細を再表示し当該商品のsection_idがnull(未設定)になっていることを確認	部門更新CSVの部門コード空行は、dtb_product_classのproduct_code一致全行のsection_idをnullにネイティブUPDATEし継続する(エラーにならず継続)。商品規格一覧/詳細を再表示するとsection_idが未設定(null)になっている [L1:L1-M0320-017; fixture:SEED-M0320-SECT-NULLCODE@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-016	IT-12	履歴条件	P2	部門更新CSVの成功取込で取込履歴テーブルに1行増える	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-VALIDCODE	正常な部門更新CSVファイル	1. 部門更新CSV画面の取込履歴テーブルの件数を確認 2. 正常な部門更新CSVを取込む 3. 同画面の取込履歴テーブルに新行が1件増えることを確認	部門更新CSVの成功取込(エラー無し)時のみ画面下部の取込履歴テーブルに新行が1件増える ／ 自動検証（内部・DB）: dtb_csv_import_history が1件増える [L1:L1-M0320-018; fixture:SEED-M0320-SECT-VALIDCODE@TBD-D5]				
m03-20_admin_product_product_department_csv_import	E2E-M0320C-025	IT-12	履歴条件	P2	部門更新CSVの取込履歴の種別IDは11である	ログイン済／SEED-M0320-MASTERS／SEED-M0320-SECT-VALIDCODE	正常な部門更新CSVファイル	1. 正常な部門更新CSVを取込む 2. 取込履歴テーブルの新行が部門更新CSV種別であることを確認	部門更新CSVの取込履歴は種別ID＝PRODUCT_SECTION_IMPORT_CSV_ID=11で記録される ／ 自動検証（内部・DB）: dtb_csv_import_history の新行の種別IDが11である [L1:L1-M0320-018; fixture:SEED-M0320-SECT-VALIDCODE@TBD-D5]				
```

---

## §5 ja/en locale対応表（Gate B4・ee源）

翻訳キー描画のメッセージ/ラベルを ee `messages.en.yaml` でgrep確認した結果、**LS=1（英訳あり）は4件**。en逐語はee英語資源の逐語のみ。

| oracle_id | 対象キー | ja逐語 | en逐語 | en源(file:line) |
|---|---|---|---|---|
| L1-M0320-001 | admin.common.bulk_registration | 一括登録を実行 | Register All | messages.en.yaml:1711 |
| L1-M0320-001 | admin.common.required | 必須 | Required | messages.en.yaml:1785 |
| L1-M0320-001 | admin.common.csv_skeleton_download | 雛形ファイルダウンロード | Download a template | messages.en.yaml:1805 |
| L1-M0320-001 | admin.product.product_management（サブタイトル） | 商品管理 | Products | messages.en.yaml:1930 |
| L1-M0320-004 | admin.common.csv_upload_complete | CSVファイルをアップロードしました | CSV file uploaded | messages.en.yaml:1684 |
| L1-M0320-008 | admin.common.csv_invalid_no_data | CSVデータが存在しません | No CSV data found | messages.en.yaml:1811 |
| L1-M0320-008 | admin.common.csv_invalid_format | CSVのフォーマットが一致しません | Unmatched CSV format | messages.en.yaml:1810 |
| L1-M0320-012 | admin.product.product_management（タイトル） | 商品管理 | Products | messages.en.yaml:1930 |

- **LS=0（英訳資源が無い／固定値／pf独自キー）**: L1-006/007の行番号エラー（ハードコード日本語）＝en無し。L1-014の部門更新CSV成功フラッシュ admin.product.csv_import.save.complete は pf独自キー「商品登録CSVファイルをアップロードしました。」で英訳資源が無い＝LS=0（message.ja.yml:133）。L1-020のNotBlank admin.csv.error.upload.require「ファイルを選択してください。」は ja固定＝LS=0（messages.ja.yaml:1624）。L1-015 maxrecord・L1-003/013の雛形ファイル名は固定値。L1-009はExcel逐語。他の挙動claimはメッセージを持たずLS=0。
- **pf/ee表示食い違い（L1-012）**: 刷新後twig（ee base_csv_upload.twig:3）はタイトルを翻訳キー admin.product.product_management（商品管理/Products）で描画するが、pf現行HareruyaEc旧twigは同位置を「商品管理」でハードコードする。刷新後の表示はeeへ移行するためタイトルは翻訳キー描画（LS=1・Products）として記録し食い違いを明示（§10-1）。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: 部門CSV登録画面（ee `csv_department.twig`）・部門更新CSV画面（pf `base_csv_upload.twig`）のセレクタと route（`GET/POST /%eccube_admin_route%/product/department_csv_upload`・`GET/POST /%eccube_admin_route%/product/product_section_update_csv_upload`・各雛形GET）を再利用。セレクタ・route確認のみに使い、期待値はL1解決器経由（en逐語は§5のee源）。
- 取込結果はフラッシュメッセージDOM／画面内errorsリスト＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象を部門一覧/部門編集（mtb_section）・商品規格一覧/詳細（section_id）で再表示して反映確認（B9）。
- 否定的事実（ロールバックで何も書かれない・breakAllで部分書込みが無い）と履歴INSERTの種別ID・件数は db.ts（mtb_section・dtb_product_class.section_id・dtb_csv_import_history）で自動検証（内部・DB）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は M0成果物（D8/D9/D5型）として未実装。

### 6.1 取込CSVファイルの入力契約

1. CSVはUI操作でアップロードする（ファイル選択→送信ボタン）。直接POSTは用いない（CSRFはフォーム由来）。
2. 取込CSVは fixture（SEED-M0320-*）として用意し、**単一異常で作り分ける（B1一意性）**。
3. 更新系ケース（C-004/C-005/C-009/C-021/C-022/C-012A/C-026/C-015A/C-015B/C-016/C-025）は取込後 .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003,C-010,C-011,C-023,C-024 | Playwright（GUI） | 画面（DOM） | 画面表示・JS・雛形DL・タイトル/route |
| C-004,C-005,C-009,C-021,C-022,C-012A,C-026,C-015A,C-015B | Playwright（GUI） | 画面（フラッシュ・対象再表示） | 正常取込＝フラッシュ＋再表示の各フィールド照合を画面のみで判定 |
| C-006,C-007,C-008,C-018,C-013,C-014,C-027,C-012B,C-016,C-025 | Playwright＋DB確認 | 画面（取込エラーは.text-danger・フォーム/行数上限はフラッシュ・errors）＋DB | 打ち切り/中断/失敗/履歴の否定的事実・件数・種別IDはDB副次 |

DB直接参照は異常系ロールバック・否定的事実（新規非作成/件数不変/値不変）＋履歴の種別ID・件数に限る（B9）。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて期待テキスト実内容＋前提条件による。汎用スタブは具体挙動がfile:lineで実在せず1回で一意判定できないため excluded（Gate B15）。

### 集計（86 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **31** | 下表（26ユニーク候補ケース。B12共有〔逐語同一の完全重複のみ〕で母集合31行→tsv26行） |
| **TBD** | **4** | -018（免税区分の期待が実装と不一致）／-069（NotBlank+File maxSizeの両成分・maxSizeは大容量ファイル要で純UI一意判定困難）／-073（履歴のセッション保持はpf現行に無くee側固有）／-078（情報ログ観測手段未整備）。§9.1 |
| **excluded** | **51** | 汎用スタブ・非該当観点・内部DB注記・矛盾＋-003（未認証→B14で共通認証へDELEG）。§9.3 |
| 合計 | **86** | 欠番0・理由なし重複0 |

> 会計: bound 31／TBD 4／excluded 51（=86・欠番0）

- 候補ケース総数 **26**。bound31件を B12（前提・入力・期待まで逐語同一の完全重複）でemitすると tsv=ユニーク26。B12共有は逐語同一の5組のみ: C-001←-006/-085・C-004←-007/-086・C-011←-004/-083・C-012A←-005/-084・C-013←-035/-074。他の21候補は各1行（異なる期待を混ぜない・M3是正）。
  - C-001←-006/-085（部門CSV登録画面の要素表示・逐語同一）／ C-002←-012 ／ C-003←-008 ／ C-004←-007/-086（部門マスタ更新＋成功メッセージ・逐語同一） ／ C-022←-072（部門CSV登録POSTは200同一URL再描画・M3分離） ／ C-005←-066 ／ C-006←-010 ／ C-007←-031（部門ID数字形式） ／ C-018←-070（既存ID実在） ／ C-008←-046 ／ C-009←-080 ／ C-021←-019（部門登録に行数上限なし）
  - C-010←-043（部門更新CSV画面が開く＋履歴表示） ／ C-023←-009（画面タイトル・M3分離） ／ C-024←-071（GET route・M3分離） ／ C-011←-004/-083（雛形・逐語同一） ／ C-012A←-005/-084（正常POST→302でなく同一画面再描画＋成功フラッシュ・逐語同一） ／ C-026←-023（成功フラッシュ・M3分離） ／ C-012B←-063（取込失敗の画面内エラー表示.text-danger） ／ C-013←-035/-074（maxrecord・逐語同一） ／ C-014←-016（商品コード不存在breakAll） ／ C-027←-075（部門コード不存在breakAll・M4被覆） ／ C-015A←-064（部門コード非空→section_id更新） ／ C-015B←-014（部門コード空→null） ／ C-016←-067（成功時のみ履歴+1） ／ C-025←-081（履歴の種別ID11・M3分離）
- **B7非該当観点exclude**: 検索/削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名ファイル/配置先/スキーマ等。§9.3。
- **B14未認証DELEG**: -003（明示的な未認証操作）はM03-20がモジュール最小IDでないため共通認証（M01-01代表）へDELEG＝excluded（M5是正）。
- **B8観点補正＝31件**（bound31行のうち観点ラベルが期待実内容と不一致の31行。§8.1。ラベルが一致するのは-010/-046だが両者はbound…ただし-046は「フォーマット定義」で実内容一致・-010は「必須バリデーション」で一致＝補正対象外。他の31 bound行が補正対象）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（31件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | 雛形ダウンロード（部門更新） | L1-013 |
| -005 | 出力抑止 | 画面遷移（正常POST→同一画面再描画＋成功フラッシュ） | L1-014 |
| -006 | 識別子 | 画面表示（部門CSV登録画面） | L1-001 |
| -007 | 状態変化 | 取込成功（部門マスタ更新＋成功メッセージ） | L1-004 |
| -008 | 確認ダイアログ | 雛形ダウンロード（部門CSV登録） | L1-003 |
| -009 | HTTPステータス | 画面表示（部門更新CSVタイトル） | L1-012 |
| -012 | 文字列長バリデーション | JS挙動（送信時ボタン無効化＋スピナー） | L1-002 |
| -014 | 相関バリデーション | データ整合性（部門コード空→section_id null継続） | L1-017 |
| -016 | 相関バリデーション | 中断（商品コード不存在→breakAll） | L1-016 |
| -019 | 部分入力 | 行数上限（部門CSV登録には上限なし） | L1-015 |
| -023 | 登録内容 | メッセージ（成功フラッシュ） | L1-014 |
| -031 | 実行結果 | 入力値検証（部門IDの数字形式） | L1-007 |
| -035 | 更新内容 | メッセージ/画面遷移（maxrecord） | L1-015 |
| -043 | 実行結果 | 画面表示（部門更新CSV画面） | L1-012 |
| -063 | 初期行数 | 画面遷移（取込失敗時は画面内エラー表示.text-danger・同一画面再描画） | L1-022 |
| -064 | 表示順 | データ整合性（部門コード非空→section_id更新） | L1-017 |
| -066 | 内部情報 | 登録・更新（部門IDの有無で新規/更新分岐） | L1-005 |
| -067 | 排他制御 | 履歴（成功時のみ+1） | L1-018 |
| -070 | 画面レイアウト | 存在検証（既存IDの実在） | L1-007 |
| -071 | 画面レイアウト | 画面表示（部門更新CSV画面route） | L1-012 |
| -072 | 画面レイアウト | 画面遷移（200同一URL再描画） | L1-004 |
| -074 | 画面レイアウト | メッセージ/画面遷移（maxrecord） | L1-015 |
| -075 | 画面レイアウト | 中断（部門コード不存在→breakAll） | L1-016 |
| -080 | 画面表示データ | 入力値検証（免税区分0/1/2） | L1-009 |
| -081 | フォーム送信 | 履歴（種別ID11で移行先確定） | L1-018 |
| -083 | 非同期更新 | 雛形ダウンロード（部門更新） | L1-013 |
| -084 | エラー継続 | 画面遷移（正常POST→同一画面再描画＋成功フラッシュ） | L1-014 |
| -085 | 公開コンテンツ | 画面表示（部門CSV登録画面） | L1-001 |
| -086 | データ正当性 | 取込成功（部門マスタ更新＋成功メッセージ） | L1-004 |
| -073 | 画面レイアウト | セッション→pf現行に無くTBD（ee固有） | L1-019 |
| -069 | 画面レイアウト | 必須バリデーション→NotBlank+maxSizeでTBD | L1-020 |

### 86対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF固有挙動なし） | **excluded** | — |
| 003 | 部門更新CSVの画面が開く＋前提が明示的な未認証操作（B14: モジュール最小IDでなく共通認証へ委譲） | **DELEG** | — |
| 004 | product_section_update.csv が得られる（B8: 対象データ→雛形DL） | bound | C-011 (shared) |
| 005 | 部門更新CSVの正常POST後に302でなく同一アップロード画面へ戻り成功フラッシュが表示される（B8: 出力抑止→画面遷移） | bound | C-012A (shared) |
| 006 | ファイル選択・一括登録ボタン・フォーマット表・雛形リンク表示（B8: 識別子→画面表示） | bound | C-001 |
| 007 | 検証成功時は部門マスタ更新＋成功メッセージ付き同系画面（B8: 状態変化→取込成功） | bound | C-004 |
| 008 | department.csv が得られる（B8: 確認ダイアログ→雛形DL） | bound | C-003 |
| 009 | 部門更新CSVのタイトルは商品管理（B8: HTTPステータス→画面表示） | bound | C-023 |
| 010 | 必須バリデーションでエラー表示され完了しない（部門名空→打ち切り） | bound | C-006 |
| 011 | 必須バリデーションでエラー表示されず継続（前提「全体中断」と両立しない自己矛盾） | **excluded** | — |
| 012 | 送信時にアップロード・雛形ボタン無効化＋スピナー表示spin.js（B8: 文字列長→JS挙動） | bound | C-002 |
| 013 | 相関バリデーションでエラー表示され完了しない（本機能に具体相関検証なし・汎用スタブ） | **excluded** | — |
| 014 | 相関でエラー表示されず継続＋前提「部門コード空」（B8: 相関→データ整合性・section_id null継続） | bound | C-015B |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 016 | 相関でエラー表示され完了しない＋前提「先頭データ行が不正」（B8: 相関→中断・商品コード不存在breakAll） | bound | C-014 |
| 017 | DBとの相関でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 018 | 免税区分に任意の文字列を与えるケースだが、実装は免税区分をint型項目へ渡すため非数値文字列は型例外・数値文字列は無検証で通過となり、想定した「相関エラーで完了しない」という挙動が再現せず期待値を一意に確定できない | **TBD** | — |
| 019 | ADMIN_CSV_IMPORT_MAX_ROWS は部門更新CSVのPOSTのみで使用＝部門CSV登録に上限なし（B8: 部分入力→行数上限） | bound | C-021 |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ＝C-004で被覆） | **excluded** | — |
| 021 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-006/C-008で被覆） | **excluded** | — |
| 022 | 追加される（汎用スタブ） | **excluded** | — |
| 023 | 部門更新CSV成功時に同一アップロード画面へ戻り成功フラッシュ（B8: 登録内容→メッセージ） | bound | C-026 |
| 024 | 追加される（汎用スタブ） | **excluded** | — |
| 025 | 追加される（汎用スタブ） | **excluded** | — |
| 026 | 追加されない（汎用スタブ） | **excluded** | — |
| 027 | 追加される（汎用スタブ） | **excluded** | — |
| 028 | 追加されない（汎用スタブ） | **excluded** | — |
| 029 | 追加される（汎用スタブ） | **excluded** | — |
| 030 | 実行結果の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 031 | 必須ヘッダ包含・部門IDの数字形式・既存IDの実在・非空（B8: 実行結果→入力値検証。「部門IDの数字形式」を担当） | bound | C-007 |
| 032 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-005で被覆） | **excluded** | — |
| 033 | 更新内容の対象レコードの値が変更されない（汎用スタブ＝C-006/C-007で被覆） | **excluded** | — |
| 034 | 変更される（汎用スタブ） | **excluded** | — |
| 035 | admin.csv.error.upload.maxrecord をフラッシュして同一画面へ（B8: 更新内容→maxrecord） | bound | C-013 (shared) |
| 036 | 変更される（汎用スタブ） | **excluded** | — |
| 037 | 変更される（汎用スタブ） | **excluded** | — |
| 038 | 変更されない（汎用スタブ） | **excluded** | — |
| 039 | 変更される（汎用スタブ） | **excluded** | — |
| 040 | 変更されない（汎用スタブ） | **excluded** | — |
| 041 | 変更される（汎用スタブ） | **excluded** | — |
| 042 | 実行結果の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 043 | 部門更新CSVの画面が開く（B8: 実行結果→画面表示） | bound | C-010 |
| 044 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 045 | フォーマット定義でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 046 | フォーマット定義でエラー表示され完了しない（必須ヘッダ欠如→csv_invalid_format） | bound | C-008 |
| 047 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 048 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 049 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ・出力は非該当） | **excluded** | — |
| 050 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 051 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 052 | 出力内容でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 053 | 削除の該当レコードが取得結果に含まれない（削除は非該当 pf-md:229・B7） | **excluded** | — |
| 054 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | **excluded** | — |
| 055 | コピーのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 056 | ファイル登録のファイル出力内容が対象データと一致（汎用ファイルスタブ・成否はC-004/C-008で被覆） | **excluded** | — |
| 057 | ファイル出力のファイル出力内容が対象データと一致（出力は非該当） | **excluded** | — |
| 058 | JSONのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 059 | 同名ファイルのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 060 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | **excluded** | — |
| 061 | 配置先の該当レコードが取得結果に含まれる（非該当） | **excluded** | — |
| 062 | スキーマのファイル出力内容が対象データと一致（汎用ファイルスタブ・列未指定） | **excluded** | — |
| 063 | 部門更新CSVは取込失敗時に画面内エラー表示(.text-danger)で同一画面再描画（フラッシュではない・B8: 初期行数→画面遷移） | bound | C-012B |
| 064 | dtb_product_class.section_id の UPDATE＝部門コード非空→section_id更新（B8: 表示順→データ整合性） | bound | C-015A |
| 065 | 更新抑止のファイル出力内容が対象データと一致（汎用スタブ） | **excluded** | — |
| 066 | 部門CSV登録の新規・更新対象（B8: 内部情報→登録/更新分岐） | bound | C-005 |
| 067 | 部門更新CSV成功時のみ追加（B8: 排他制御→履歴） | bound | C-016 |
| 068 | 当機能が行う登録・更新で対象テーブルを直接保存（不要削除含まない）（内部DB注記・汎用） | **excluded** | — |
| 069 | フォーム NotBlank/File 最大サイズ（NotBlankとFile maxSizeの両成分要求・maxSizeは大容量ファイル要で純UI一意判定困難） | **TBD** | — |
| 070 | 必須ヘッダ包含・部門IDの数字形式・既存IDの実在・非空（B8: 画面レイアウト→存在検証。「既存IDの実在」を担当） | bound | C-018 |
| 071 | 部門更新CSV画面のGET route（B8: 画面レイアウト→画面表示） | bound | C-024 |
| 072 | 同一URLのHTML応答（部門CSV登録POSTは200で同一URL再描画・B8: 画面レイアウト→画面遷移） | bound | C-022 |
| 073 | リダイレクト先GETではセッション値が引き続き使われる（pf現行HareruyaEcは履歴を最大100件単純取得のみでセッション保持なし＝ee固有のためTBD） | **TBD** | — |
| 074 | admin.csv.error.upload.maxrecord をフラッシュして同一画面へ（B8: 画面レイアウト→maxrecord） | bound | C-013 (shared) |
| 075 | CsvImporter のエラーを画面内エラー表示(.text-danger)で同一画面へ＋前提「商品未存在・部門未存在」（B8: 画面レイアウト→中断・部門コード不存在breakAll） | bound | C-027 |
| 076 | 画面内エラーもしくは翻訳メッセージ（部門CSV登録エラー表示の一般記述・C-006/C-007/C-008/C-018に内包＝汎用） | **excluded** | — |
| 077 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 078 | 情報ログ「部門更新CSV登録開始」（アプリログ・観測手段未整備で一意固定不能・TBD） | **TBD** | — |
| 079 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 080 | 本書の部門CSV登録が扱う免税区分は移行先の mtb_section.tax_free_division を正（B8: 画面表示データ→入力値検証・免税区分0/1/2） | bound | C-009 |
| 081 | 種別IDは移行先の mtb_csv_import_type（=11で確定・MtbCsvImportType:38）（B8: フォーム送信→履歴） | bound | C-025 |
| 082 | ファイル選択のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 083 | product_section_update.csv が得られる（B8: 非同期更新→雛形DL） | bound | C-011 (shared) |
| 084 | 部門更新CSV POST後に同一アップロード画面へ戻る（B8: エラー継続→画面遷移） | bound | C-012A (shared) |
| 085 | ファイル選択・一括登録ボタン・フォーマット表・雛形リンク表示（B8: 公開コンテンツ→画面表示） | bound | C-001 (shared) |
| 086 | 検証成功時は部門マスタ更新＋成功メッセージ付き同系画面（B8: データ正当性→取込成功） | bound | C-004 (shared) |

`func_scope_check` 判定: 親86/86会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝4件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| 期待が実装と不一致（B15④） | -018 | 1 | 前提「免税区分に任意文字列」＋期待「相関でエラー完了しない」。実装は免税区分を空チェック後 setTaxFreeDivision(int) へ渡し、非数値文字列は型例外・数値文字列は0/1/2以外でも無検証で通過するため、母集合の相関バリデーションエラー期待と一致せず一意固定できない（採用する正の確定待ち。免税区分空→エラーは-010系で担保） |
| 必須成分の一部が純UI一意判定困難（B15③） | -069 | 1 | 母集合-069はフォーム NotBlank と File maxSize の両成分を要求する。NotBlank（ファイル未選択→「ファイルを選択してください。」）は検証可能だが、File maxSize超過は設定 csv_size（配布5MB）超の大容量ファイルアップロードを要し純UIで一意判定困難。B1上、必須成分を単一実行で自動判定できないためTBD（maxSizeの実機検証手段が整うまで保留） |
| pf現行に存在しない（pf/ee食い違い・B15①） | -073 | 1 | 母集合-073「リダイレクト先GETではセッション値が引き続き使われる」は履歴ページングのセッション保持を要求するが、pf現行HareruyaEcの部門更新CSV画面は履歴を種別ID11で作成日時降順に最大100件単純取得するのみで page_count/page_no・プルダウン・セッション処理が無い（ProductCsvController.php:1857-1860）。当該セッション実装は ee 側（別URL）固有であり、pf/ee食い違いのため一意固定できずTBD |
| 実在挙動だが観測手段未整備（B15③） | -078 | 1 | 部門更新CSV POST開始時の情報ログはProductCsvController.php:846で実在するが、アプリログの観測手段が未整備で画面/DBでは一意固定できず要実機（L1-021 documentation-only） |

（合計 1+1+1+1 = 4）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureファイルの実バイト内容（文字コード・改行・列順・5010境界） | fixture manifest（D5型）未整備＝要実機 |
| -069/L1-020 の File maxSize 超過（csv_size メガバイト） | 大容量ファイル（配布5MB超）アップロードを要し純UIで一意判定困難＝要実機。会計上は-069をTBDへ（§9.1・M6是正） |
| L1-009 免税区分のスマレジ部門連携 | 外部連携API送信の実観測＝要実機 |
| L1-019/-073 のee側セッション履歴ページング | 別URL（ee importDepartment系）の実挙動確認＝要実機（pf現行には無い） |
| L1-021（情報ログ）の実機検証手段 | アプリログ観測手段未整備＝documentation-only |
| -018（免税区分の採用する正） | 発注者/設計判断で免税区分の値検証仕様を確定 |

### 9.3 excluded＝51件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B14】未認証→共通認証へDELEG** | -003 | 母集合-003は明示的な未認証操作（前提=ナビ到達の認証前提・観点=未認証）。M03-20はモジュール最小IDでないため、認証・Cookie・セッション・試行制限の検証は共通認証（M01-01代表）へ委譲＝excluded（DELEG。M5是正） |
| **【B15③】非該当/自己矛盾スタブ** | -001,-002,-011 | -001「出力失敗」（取込機能に非該当）／-002 CSRF固有挙動が期待に無い／-011 前提「全体中断」と期待「エラー表示されず継続」が両立しない自己矛盾 |
| **【B15②】汎用「相関バリデーション」スタブ** | -013,-015,-017 | 具体的な相関検証が一次資料に無い（実在挙動の-014/-016はboundへ復活済み）。残りは一致基準が無く内容空虚 |
| **【B15②/④】汎用「登録/更新内容が追加/変更される・されない」スタブ（C-004/C-005/C-006で被覆）** | -020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042 | 対象レコード・具体値を母集合が指定せず内容空虚 |
| **【B15②】汎用「実行結果/出力内容が一致/継続」スタブ** | -044,-045,-047,-048,-049,-050,-051,-052,-065,-077,-079 | 一致基準・観測対象を母集合行が持たず内容空虚 |
| **【B7】ファイル/レコード操作系（非該当）** | -053,-054,-055,-056,-057,-058,-059,-060,-061,-062,-082 | 削除/移動リネーム/コピー/ファイル登録/ファイル出力/JSON/同名ファイル/入力JSON/配置先/スキーマ/ファイル選択。取込機能に該当する操作は無い |
| **【B15②】内部DB注記スタブ** | -068 | 「対象テーブルを直接保存（不要削除含まない）」は内部DB設計注記で単一観測挙動でない |
| **【B15②】薄い一般記述（具体挙動が別候補に内包）** | -076 | 「画面内エラーもしくは翻訳メッセージ」は部門CSV登録エラー表示の一般記述でC-006/C-007/C-008/C-018に内包 |

## §10 特記事項（片側断定せず記録）

1. **R3-M1（履歴ページングはpf現行に無い）**: pf現行HareruyaEcの部門更新CSV画面は取込履歴を種別ID11で作成日時降順に最大 CSV_IMPORT_HISTORY_LIMIT=100 件単純取得して表示するだけで（ProductCsvController.php:392,1857-1860）、page_count/page_no・表示件数プルダウン・セッション保持が無い。母集合-073のセッション引継ぎ期待はee側（別URL importDepartment系）固有であり pf/ee食い違いのためTBD。L1-019 を実pf挙動（最大100件単純取得）に是正し、C-017（セッション）を撤回した。
2. **R3-M2（-069 maxSize会計化＋NotBlank文言）**: 母集合-069はフォーム NotBlank と File maxSize の両成分を要求する。B1上、必須成分を単一実行で自動判定できないため-069全体をTBDとし（maxSize超過は大容量ファイル要で純UI一意判定困難）、会計内（TBD）に戻した（§9.1）。NotBlank逐語を実pf「ファイルを選択してください。」（admin.csv.error.upload.require・pf HareruyaEc CsvImportType:33）に是正（R2の「入力されていません。/No value found.」はee標準validator値のため撤回）。L1-020 は documentation-only。
3. **R3-M3（B12過共有の解消）**: 異なる期待を同一C-refにまとめていたのを分離した。-072（部門CSV登録POSTは200同一URL再描画）→C-022、-009（画面タイトル）→C-023、-071（GET route）→C-024、-081（履歴の種別ID11）→C-025、-023（成功フラッシュ）→C-026。B12共有は逐語同一の完全重複5組（C-001/C-004/C-011/C-012A/C-013）のみに限定した。
4. **R3-M4（部門コード不存在breakAll被覆）**: 母集合-075は商品未存在・部門未存在の両分岐を要求する。実pfでも商品検証（ProductSectionUpdateImportHandler.php:131）と部門検証（同:188）は別分岐。C-014は先頭行の商品コード不存在breakAll、C-027は先頭行の部門コード不存在breakAllとして両分岐を被覆した。
5. **R3-M5（-003未認証をDELEG）**: 母集合-003は明示的な未認証操作（前提=ナビ到達の認証前提・観点=未認証）。M03-20はモジュール最小IDでないため、B14に従い認証検証は共通認証（M01-01代表）へDELEG＝excludedとした（C-010へのbindを撤回）。会計は bound31/TBD4/excluded51 に更新。
6. **R2既是正の維持**: (a)部門更新CSVのURL `/product/product_section_update_csv_upload`・POST後200同一画面render・成功キー `admin.product.csv_import.save.complete`（実pf値）。(b)L1-012/L1-001のタイトル/サブタイトルは翻訳キー admin.product.product_management（Products）でLS=1・pf旧twigの「商品管理」ハードコードとの食い違いを§5明記。(c)免税区分は setTaxFreeDivision(int)＝数値文字列通過・非数値TypeError（L1-010）。(d)-018は免税区分の期待が実装と不一致でTBD。
7. **R4（breakAll失敗の表示方法は画面内エラー表示・フラッシュではない）**: 部門更新CSVの取込（CsvImporter）失敗は、pf現行が `addError`／フラッシュを呼ばず `$result->getErrors()` を `render($twig, [..., 'errors' => $errors])` へ渡し（ProductCsvController.php:858,1857-1866）、テンプレートが `{% for error in errors %}<div class="text-danger">{{ error.message }}</div>{% endfor %}`（base_csv_upload.twig:29-30）として**画面内の .text-danger にエラーメッセージを表示**する。よってbreakAll系（C-012B取込失敗・C-014商品コード不存在・C-027部門コード不存在）の期待を「エラーフラッシュ」から「画面内エラー表示(.text-danger)・同一画面render」に是正した。なお**フォーム妥当性エラー（NotBlank）と行数上限（maxrecord）は `addError`＝フラッシュ**（ProductCsvController.php:828-833,838-841）であり、取込エラー（text-danger）と表示経路が異なる（C-013 maxrecordはフラッシュのまま）。
8. **R8（L1-014の原子化＝成功と失敗を別claimへ分割）**: 旧L1-014は「成功でも失敗でも…」と成功フロー（addSuccess）と取込失敗フロー（.text-danger）を1claimに一括定義しており1claim1検証事実の原子化に反していた。これを分割した＝**L1-014（成功フロー単独）**: 正常POST→302でなく同一画面render(200)＋成功フラッシュ admin.product.csv_import.save.complete（**C-012A/C-026が参照**）／**L1-022（取込失敗フロー単独・新設）**: 取込CsvImporterエラー→addSuccess/addErrorせず result のエラーを render の errors へ渡し画面内 .text-danger 表示・同一画面render(200)（**C-012B/C-014/C-027が参照**）。あわせて L1-016 は breakAll 判定ロジックのみに限定し表示方法の記述を L1-022 へ委譲した。フォーム妥当性NotBlank（L1-020）・行数上限maxrecord（L1-015）の addError フラッシュは各々の該当claimが保持。L1数は 21→22。
9. **確認モーダルの極性**: Excel sheet-34の画面部品ID2「CSVファイルのアップロード」ボタンは入力チェック実施のみで確認モーダルの記載が無く、pf現行md:68も部門CSV登録は「モーダル・ポップアップ：なし」。本機能は確認モーダル無しで確定。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound/TBD行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（31件）。** excluded行（-003含む）は観点補正に含めない。

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | 雛形ダウンロード | 期待「product_section_update.csv が得られる」（L1-013）。ラベル「対象データ」は誤り |
| 005 | 画面遷移 | 期待「正常POST後に302でなく同一アップロード画面へ戻り成功フラッシュ」（L1-014）。ラベル「出力抑止」は誤り |
| 006 | 画面表示 | 期待「ファイル選択・一括登録ボタン・フォーマット表・雛形リンク表示」（L1-001）。ラベル「識別子」は誤り |
| 007 | 取込成功 | 期待「部門マスタ更新＋成功メッセージ付き同系画面」（L1-004）。ラベル「状態変化」は誤り |
| 008 | 雛形ダウンロード | 期待「department.csv が得られる」（L1-003）。ラベル「確認ダイアログ」は誤り |
| 009 | 画面表示 | 期待「部門更新CSVのタイトルは商品管理」（L1-012）。ラベル「HTTPステータス」は誤り |
| 012 | JS挙動 | 期待「送信時にアップロード・雛形ボタン無効化＋スピナー表示」（L1-002）。ラベル「文字列長バリデーション」は誤り |
| 014 | データ整合性 | 期待「部門コード空→section_id null継続」（L1-017）。ラベル「相関バリデーション」は誤り |
| 016 | 中断 | 期待「商品コード不存在→breakAll」（L1-016）。ラベル「相関バリデーション」は誤り |
| 019 | 行数上限 | 期待「行数上限は部門更新CSVのPOSTのみ＝部門CSV登録に上限なし」（L1-015）。ラベル「部分入力」は誤り |
| 023 | メッセージ | 期待「部門更新CSV成功時に同一画面へ戻り成功フラッシュ」（L1-014）。ラベル「登録内容」は誤り |
| 031 | 入力値検証 | 期待「部門IDの数字形式」（L1-007）。ラベル「実行結果」は誤り |
| 035 | メッセージ/画面遷移 | 期待「admin.csv.error.upload.maxrecord をフラッシュして同一画面へ」（L1-015）。ラベル「更新内容」は誤り |
| 043 | 画面表示 | 期待「部門更新CSVの画面が開く」（L1-012）。ラベル「実行結果」は誤り |
| 063 | 画面遷移 | 期待「部門更新CSVは取込失敗時に画面内エラー表示.text-dangerで同一画面再描画」（L1-022）。ラベル「初期行数」は誤り |
| 064 | データ整合性 | 期待「部門コード非空→section_id更新」（L1-017）。ラベル「表示順」は誤り |
| 066 | 登録・更新 | 期待「部門CSV登録の新規・更新対象（部門IDの有無で分岐）」（L1-005）。ラベル「内部情報」は誤り |
| 067 | 履歴 | 期待「部門更新CSV成功時のみ追加」（L1-018）。ラベル「排他制御」は誤り |
| 070 | 存在検証 | 期待「既存IDの実在」（L1-007）。ラベル「画面レイアウト」は誤り |
| 071 | 画面表示 | 期待「部門更新CSV画面のGET route」（L1-012）。ラベル「画面レイアウト」は誤り |
| 072 | 画面遷移 | 期待「部門CSV登録POSTは200で同一URL再描画」（L1-004）。ラベル「画面レイアウト」は誤り |
| 073 | セッション | 期待「セッション値が引き続き使われる」（L1-019・pf現行に無くTBD）。ラベル「画面レイアウト」は誤り |
| 074 | メッセージ/画面遷移 | 期待「admin.csv.error.upload.maxrecord をフラッシュして同一画面へ」（L1-015）。ラベル「画面レイアウト」は誤り |
| 075 | 中断 | 期待「部門コード不存在→breakAll」（L1-016）。ラベル「画面レイアウト」は誤り |
| 069 | 必須バリデーション | 期待「フォーム NotBlank／File maxSize」（L1-020・maxSizeでTBD）。ラベル「画面レイアウト」は誤り |
| 080 | 入力値検証 | 期待「免税区分は移行先 mtb_section.tax_free_division を正（0/1/2登録）」（L1-009）。ラベル「画面表示データ」は誤り |
| 081 | 履歴 | 期待「種別IDは移行先 mtb_csv_import_type=11で確定」（L1-018）。ラベル「フォーム送信」は誤り |
| 083 | 雛形ダウンロード | 期待「product_section_update.csv が得られる」（L1-013）。ラベル「非同期更新」は誤り |
| 084 | 画面遷移 | 期待「部門更新CSV POST後に同一アップロード画面へ戻る」（L1-014）。ラベル「エラー継続」は誤り |
| 085 | 画面表示 | 期待「ファイル選択・一括登録ボタン・フォーマット表・雛形リンク表示」（L1-001）。ラベル「公開コンテンツ」は誤り |
| 086 | 取込成功 | 期待「部門マスタ更新＋成功メッセージ付き同系画面」（L1-004）。ラベル「データ正当性」は誤り |
