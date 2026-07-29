# 候補: m03-41 カテゴリCSV登録（取込/インポート） — 実行可能グレード候補（母集合94全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**ee/pf実ソース照合版（2026-07-29）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-26/m03-27（CSV取込系）** の構造・取込検証設計を踏襲。ただし値・claim・列名・メッセージはM03-41自身の一次資料（pf実source／Excel／ee実source）から取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能はTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。B12共有は**前提・入力・期待まで同一実行**の完全重複だけ。
> **本機能は更新系（DBのカテゴリ登録/更新/削除・CSVアップロード取込）**。観測対象＝**同一URLの再描画画面（成功フラッシュ／エラー文言inline）＋取込効果（カテゴリツリー再表示で反映確認）**。
> DB直接参照（B9）は外部IFで検知不能な事実＝異常系ロールバック（何も書かれない）に限る。
> B1-B15 自己監査済み（正直分類・2026-07-29）。

## §0 版固定

- **ee実source（SUT・source_classには不使用）**: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php::csvCategory`（route `admin_product_category_csv_import`／path `/%eccube_admin_route%/product/category_csv_upload`／GET,POST・:693）・テンプレート `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig`・enロケール源 `.../Resource/locale/messages.en.yaml`。
- **pf現行実source（回帰先・source_class=pf-fallback）**: `pf-eccube3/src/Eccube/Controller/Admin/Product/CsvImportController.php::csvCategory`（:410）・`pf-eccube3/src/Eccube/Resource/template/admin/Product/csv_category.twig`。以下「pf-cat:行」「ee-cat:行」「pf-twig:行」「ee-twig:行」。
- **pf現行md（参照・注意）**: `functions/pf-eccube3/m03-41_admin_product_product_category_csv_import.md`（git hash-object `cafe9df9811a606c1b45d420b798fe78df3b88c3`）。**本pf-md本文はee挙動を記述している**ため（§247 正本記述が ee CsvImportController::csvCategory）、pf現行オラクルはpf実sourceでfile:line確認した（pf-mdを鵜呑みにしない）。
- **Excel基本設計（重大所見・下記§10-1）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` シート「カテゴリ登録CSVアップロード」（機能No=M03-41・機能名「カテゴリCSV登録」・作成者=城下・更新者=堀部・更新日2025-10-14・git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`）。**当シートは刷新後の別コントローラ CategoryCsvController（bulk・12列・取込履歴あり・route `admin_product_category_bulk_import`・`csv_category_bulk.twig`）を規定**しており、**本fid（route `admin_product_category_csv_import`／旧csvCategory／4列）の挙動をExcelは規定しない**。ゆえに旧csvCategoryのpf/ee食い違いclaimは「Excel規定なし」＝TBD。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-41-ADMIN-PRODUCT-PRODUCT-CATEGORY-CSV-IMPORT-001..094`（94件・欠番0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実source はSUTでオラクルの source_class には不使用。
- **重大な帰属方針（pf/ee食い違いの罠）**: 本機能はpf現行（EC-CUBE3 Silex csvCategory）とee（SUT csvCategory）が **成功メッセージ・カテゴリ削除フラグ処理（pf=soft del_flg／ee=hard delete）・MSG-004（更新対象不存在）の有無・画面ラベル** で食い違う。source_class=pf-fallbackは「pf実装がeeと同挙動（バイト一致または構造一致）」claimに限る。pf≠ee且つExcel規定なしはTBD。
- **en（★en-grep実施）**: ee `messages.en.yaml` を該当キーでgrep確認済み。`admin.common.csv_upload_complete`=「CSV file uploaded」(en:1684)／`admin.common.delete_error_foreign_key`=「Sorry, we are unable to delete %name%, because it has related data.」(en:1678)／`admin.common.csv_invalid_format`=「Unmatched CSV format」(en:1810)／`admin.common.csv_invalid_no_data`=「No CSV data found」(en:1811)／`admin.product.category_csv_upload`=「Category CSV」(en:1943)／`admin.common.file_select`=「Select a File」(en:1808)／`admin.common.csv_skeleton_download`=「Download a template」(en:1805)／`admin.common.required`=「Required」(en:1785)／`admin.common.bulk_registration`=「Register All」(en:1711)。**行番号付きエラー文言（MSG-003/005/007/008/009）はPHP文字列連結でロケール不在＝英訳なしLS=0**。en実在キーはいずれもpf/ee食い違いのTBD claim側（L1-008/010）に紐づき、bound claim（構造/JS/フロー）はLS=0。
- **B1事前スイープ**: 「場合がある／し得る／なり得／可能性」該当0件。-31は「要ソース確認」プレースホルダ（excluded）。

---

## §1 L1原子オラクル表

全12claim。**source_class列は pf-fallback のみ**（excelはゼロ＝§10-1のとおりExcelは本fidの旧csvCategoryを規定しないため本表にexcel源は無い）。LS=1（en実在）＝L1-008（成功文言食い違いの記録）。bound候補が検証するのはL1-001〜006・L1-010（削除FK外部結果一致・-048）・L1-012（取込途中失敗の先行行ロールバック・-076）、documentation-only=L1-007、TBD=L1-008/009/011。**R1是正**: L1-010は-048 boundへ（FK参照残の削除不成立＝pf/ee外部結果一致）／L1-011は取込開始・完了ログのみpf==ee（削除ログはee固有で除外）／L1-001の必須バッジ・L1-002のファイル名ラベルはee固有でbound主張から除外。**R2是正**: -023(前提=MSG-001 CSV形式不正)はロールバック事象でないためrollback候補にbindしない。L1-006を『失敗時（フォーマット/行エラー）も同一URL再描画・非リダイレクト・登録されない』へ（C-008←-023/-089）、ロールバック（先行行が残らない）はL1-012へ分離（C-006←-076 トランザクション期待）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0341-001 | http_entry | `GET /{admin_route}/product/category_csv_upload` を開くとカテゴリCSV登録画面が表示され、ファイル選択操作部・送信ボタン・CSVファイルフォーマットの説明表（カテゴリ名等の列見出しと説明）・雛形ダウンロードリンクが表示される。取込履歴テーブルはこの画面には無い（フォーマット表の必須表現はpf=セル内テキスト・ee=バッジで異なるためbound主張に含めない） | 「ファイル選択・…ボタン・フォーマット説明・雛形ダウンロードリンクが表示される」 | pf-twig:69,89,100,106 / ee-twig:63,105 | pf-fallback | 0 |
| L1-M0341-002 | display_field | アップロードフォーム(#upload-form)のsubmit時にjQueryで送信ボタン(#upload-button)と雛形ダウンロードボタン(#download-button)を無効化しspin.jsのスピナー(#spinner)を表示する（ファイル選択でラベルにファイル名を反映する挙動はee固有のchange handlerでpf現行に無くbound主張に含めない） | 「submit時にアップロードボタンと雛形ボタンを無効化し、spin.jsのスピナーを表示」 | pf-twig:57,58,59,60 / ee-twig:45,46,47,48 | pf-fallback | 0 |
| L1-M0341-003 | display_field | 送信前の確認ダイアログ（モーダル）は無く、送信ボタン押下でそのままPOSTされる | 「送信前の確認ダイアログは無い」 | pf-twig:57 / ee-twig:45 / pf-md:47 | pf-fallback | 0 |
| L1-M0341-004 | validation | アップロードファイルはフォーム項目キー import_file の必須(NotBlank)＋サイズ上限で検証され、ファイル未選択やサイズ超過で送信するとSymfonyのフォームフィールドエラーが入力欄直下に表示され、取込処理には進まない | 「Symfonyのフィールドエラーとして表示」 | pf-cat:418 / ee-cat:711,861 / ee-twig:81 | pf-fallback | 0 |
| L1-M0341-005 | http_flow | route admin_product_category_csv_import はGETとPOSTを同一URLで受け、取込が正常に完了したときはリダイレクトせず同一URLのカテゴリCSV登録画面を再描画し、画面上部に成功アラート（成功フラッシュ）を表示する | 「同一URLのHTML」「画面上部に成功アラート」 | pf-cat:560,564,569 / ee-cat:841,846,861 | pf-fallback | 0 |
| L1-M0341-006 | http_flow | 取込がCSVフォーマットエラー（必須ヘッダ欠落・パース不能等）や行単位エラーで失敗したときも、リダイレクトせず同一URLのカテゴリCSV登録画面を再描画してエラー文言をフォーム付近に表示する（GETとPOSTは同一URLで受け、POST後もリダイレクトしない）。対象カテゴリは登録されない（フォーマットエラーの文言はpf「CSVのフォーマットが一致しません。」句点あり／ee句点なしで食い違うため、boundは文言でなく同一URL再描画・登録されない外部挙動に限定） | 「カテゴリCSV登録画面に留まる」「同一 HTML」 | pf-cat:426,428,439,569 / ee-cat:717,719,729,731,861 | pf-fallback | 0 |
| L1-M0341-007 | message | 行単位の業務バリデーションはエラー行で取込を打ち切りロールバックする。pf現行とeeでバイト一致するエラー文言は「（行番号）行目のカテゴリIDが存在しません。」（カテゴリID非数字）・「（行番号）行目のカテゴリIDと親カテゴリIDが同じです。」・「（行番号）行目のカテゴリ名が設定されていません。」・「（行番号）行目の親カテゴリIDが存在しません。」（親ID非数字/親不存在/親未指定で階層が1以外）・「（行番号）行目のカテゴリが最大レベルを超えているため設定できません。」。母集合に各文言を固有一意に判定する具体期待の行が無く documentation-only | 「行目のカテゴリIDが存在しません。」他（pf/eeバイト一致） | pf-cat:460,471,478,488,520 / ee-cat:748,759,786,796,829 | pf-fallback | 0 |
| L1-M0341-008 | message | 取込成功時の成功フラッシュ文言はpf現行とeeで食い違う（pf: `admin.category.csv_import.save.complete`「カテゴリ登録CSVファイルをアップロードしました。」／ee(SUT): `admin.common.csv_upload_complete`「CSVファイルをアップロードしました」・en「CSV file uploaded」）。Excelシート「カテゴリ登録CSVアップロード」は刷新後bulkを規定し本旧csvCategoryの成功文言を規定しないため期待文言を確定できずTBD | 「CSVファイルをアップロードしました」／en「CSV file uploaded」／pf「カテゴリ登録CSVファイルをアップロードしました。」 | pf-cat:564 / ee-cat:843 / en:1684 | pf-fallback | 1 |
| L1-M0341-009 | validation | 母集合期待「削除フラグが1でIDが無い行は削除ブロックに入ったあとcontinueするのみで無処理行となる」はee(SUT)の挙動（削除フラグをカテゴリ名より前に評価し既存IDが無ければ削除せずcontinue）。pf現行はカテゴリ名必須チェックを先に行い削除フラグを後段switchで処理し同挙動でない。pf/ee食い違い且つExcel(bulk)にカテゴリ削除フラグ列が無くExcel規定なしのためTBD | 「削除ブロックに入ったあと continueするのみ…無処理行」 | ee-cat:765,781 / pf-cat:477,526 | pf-fallback | 0 |
| L1-M0341-010 | validation | カテゴリ削除フラグ=1で、子カテゴリまたは商品が紐づく（外部キー参照が残る）既存カテゴリを削除しようとすると、pf現行・eeとも削除は成立せず対象カテゴリは削除されずカテゴリツリーに残り（外部結果が一致）、エラーが表示され取込は打ち切られる。削除の内部方式・文言はpf/eeで異なる（pf: falseを返し「（行番号）行目のカテゴリが、子カテゴリまたは商品が紐付いているため削除できません。」／ee: FK例外を捕捉し `admin.common.delete_error_foreign_key` で打ち切り）が「削除されない」外部結果は一致するため、boundは削除されない事実に限定する | 「削除条件の対象レコードが削除状態にならない」 | pf-cat:534,544,545 / ee-cat:767,770,772,777 | pf-fallback | 0 |
| L1-M0341-011 | log | POST取込でpf現行とeeともに情報ログ「カテゴリCSV登録開始」（取込開始時）と「カテゴリCSV登録完了」（コミット後）を出力する（pf==ee）が、現行ハーネスにログ観測手段が無く画面・履歴で一意固定できないためTBD（カテゴリ削除時にカテゴリIDを添える削除ログはee固有でpf現行csvCategoryに無いため本claimに含めず§10へ記録） | 「情報ログ「カテゴリCSV登録開始」」 | pf-cat:422,562 / ee-cat:714,842 | pf-fallback | 0 |
| L1-M0341-012 | rollback | 検証を通過した複数データ行の取込途中でエラー行に達すると直ちに打ち切り、取込前に開始したDBトランザクションがロールバックされるため、同一CSVの先行行で保存された新規カテゴリも取り込まれずカテゴリツリーに残らない（各行はループ内でsaveされるが後続行のエラーで全体がロールバックされる・renderWithErrorがロールバック） | 「エラー時は renderWithErrorがロールバック」 | pf-cat:452,478,480,557,569 / ee-cat:741,786,837,838,1342,1344 | pf-fallback | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとしてUI操作でアップロードする。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通・モール管理者） | 管理者アカウント | 不要 |
| SEED-M0341-MASTERS | 取込の前提マスタ | 既存カテゴリツリー（親カテゴリ・子/商品を持つ被参照カテゴリ・葉カテゴリ）と `eccube_category_nest_level` 既定 | 不要（参照） |
| SEED-M0341-VALIDNEW | 正常取込（新規登録・成功フロー） | カテゴリ名(必須)を設定し親カテゴリIDを許容値（既存親IDまたは空）とする1データ行の正常CSV | 追加されたカテゴリ・sort_no変化を復元 |
| SEED-M0341-PICK | 送信時JS（ボタン無効化＋スピナー）検証の入力 | 任意の正常CSVファイル | 不要 |
| SEED-M0341-BADFORMAT | 取込失敗（CSV形式不正）→同一URL再描画検証 | 必須ヘッダ「カテゴリ名」を欠くCSV（またはパース不能CSV）でフォーマットエラーを誘発（トランザクション開始前に打ち切り・登録なし） | 不要（登録なし） |
| SEED-M0341-ROLLBACK | 取込途中失敗→ロールバック検証（複数行） | 2データ行CSV: 1行目=検証通過する正常な新規カテゴリ（カテゴリ名設定・親許容値）、2行目=カテゴリ名を空にしたエラー行（2行目でエラー打ち切り・全体ロールバック） | 不要（ロールバック・書込みなし） |
| SEED-M0341-FKREF | 削除フラグ削除の外部キー参照残（-048） | 子カテゴリまたは商品が紐づく既存カテゴリ1件＋そのカテゴリID・削除フラグ=1を指定した1行CSV（削除は成立せず対象カテゴリは残る） | 不要（削除不成立・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報・本fid=旧csvCategory 4列）

取込CSV列はコントローラ `getCategoryCsvHeader()` に一致（ee-cat:2112 / pf-cat:414）。個々の列値マッピングは母集合に固有要求行が無くdocumentation-only。

| 区分 | 列（内部キー） | 備考 |
|---|---|---|
| 任意/キー | カテゴリID（id・空は新規登録・指定時UPDATE） | ee-cat:2115 / pf-cat:458 |
| 必須 | カテゴリ名（category_name・唯一の必須ヘッダ） | ee-cat:2120（required=true） |
| 任意 | 親カテゴリID（parent_category_id・空は親なし） | ee-cat:2125 |
| 任意 | カテゴリ削除フラグ（category_del_flg・1で削除試行） | ee-cat:2130 |
| オプション（雛形外） | 階層（連想キー「階層」・省略時は親から自動算出） | ee-cat:812 / pf-cat:504 |

> 補足: ee getCategoryCsvHeader の必須ヘッダは category_name のみ。必須ヘッダ欠落は `admin.common.csv_invalid_format` フォーマットエラー（ee-cat:728-731）。

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 8候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0341C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラーの**同一URL再描画画面**（成功フラッシュ・inlineエラー文言）を画面で目視。(2)DB自動検証は外部IFで検知不能な否定的事実（ロールバック＝何も書かれない）に限る。
- 操作手順は純UI操作（ファイル選択→送信ボタン押下→結果画面）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-41_admin_product_product_category_csv_import	E2E-M0341C-001	IT-15	画面表示	P3	GETでカテゴリCSV登録画面が開きフォーマット表・雛形ダウンロード・送信ボタンが表示される	ログイン済(SEED-M01-ADMIN)	—	1. GET /%eccube_admin_route%/product/category_csv_upload をブックマークまたは直接URLで開く 2. ファイル選択操作部・送信ボタン・CSVファイルフォーマットの説明表・雛形ダウンロードリンクが表示されることを確認	カテゴリCSV登録画面が表示され、ファイル選択操作部・送信ボタン・CSVファイルフォーマットの説明表（カテゴリ名等の列見出しと説明）・雛形ダウンロードリンクが表示される。取込履歴テーブルはこの画面には無い [L1:L1-M0341-001; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-002	IT-20	JS挙動	P1	送信時に送信ボタンと雛形ボタンが無効化されスピナーが表示される	ログイン済／SEED-M0341-PICK	正常CSVファイルを選択	1. アップロード画面でファイルを選択し送信ボタンを押下 2. 送信ボタンと雛形ダウンロードボタンが無効化されスピナーが表示されることを確認	アップロードフォームのsubmit時に送信ボタンと雛形ダウンロードボタンが無効化され、spin.jsのスピナーが表示される [L1:L1-M0341-002; fixture:SEED-M0341-PICK@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-003	IT-20	モーダル	P1	送信前に確認ダイアログが表示されない	ログイン済／SEED-M0341-PICK	正常CSVファイル	1. ファイルを選択し送信ボタンを押下 2. 送信前に確認ダイアログ（モーダル）が表示されずそのままPOSTされることを確認	送信前の確認ダイアログ（モーダル）は表示されず、送信ボタン押下でそのままPOSTされる [L1:L1-M0341-003; fixture:SEED-M0341-PICK@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-004	IT-22	ファイル必須検証	P2	ファイル未選択で送信するとSymfonyのフィールドエラーが表示され取込に進まない	ログイン済	ファイルを選択しない	1. ファイルを選択せず送信ボタンを押下 2. import_file入力欄の直下にフィールドエラーが表示され、取込処理に進まないことを確認	アップロードファイル（フォーム項目キー import_file）は必須のため、ファイル未選択で送信するとSymfonyのフォームフィールドエラーが入力欄直下に表示され、取込処理には進まない [L1:L1-M0341-004; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-005	IT-25	取込成功（画面遷移）	P1	正常CSVの取込が成功しリダイレクトせず同一URLに成功アラートが表示される	ログイン済／SEED-M0341-MASTERS／SEED-M0341-VALIDNEW	カテゴリ名を設定した新規カテゴリ1行の正常CSVファイル	1. 正常CSVを選択し送信ボタンを押下 2. リダイレクトせず同一URLのカテゴリCSV登録画面が再描画され、画面上部に成功アラートが表示されることを確認	取込が正常に完了するとリダイレクトせず同一URL（カテゴリCSV登録画面）が再描画され、画面上部に成功アラート（成功フラッシュ）が表示される（GETとPOSTは同一URLで受ける） [L1:L1-M0341-005; fixture:SEED-M0341-VALIDNEW@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-006	IT-25	取込失敗（ロールバック）	P1	取込途中でエラーになると同一URLにエラー文言が表示され先行行のカテゴリも残らない	ログイン済／SEED-M0341-MASTERS／SEED-M0341-ROLLBACK	1行目=検証を通過する正常な新規カテゴリ、2行目=カテゴリ名を空にしたエラー行の2行CSVファイル	1. 2行CSVを選択し送信ボタンを押下 2. リダイレクトせず同一URLのカテゴリCSV登録画面が再描画されエラー文言がフォーム付近に表示されることを確認 3. カテゴリツリーに1行目の新規カテゴリも追加されていないことを確認	検証を通過した複数データ行の取込途中で2行目のエラー行に達すると直ちに打ち切り、リダイレクトせず同一URLのカテゴリCSV登録画面が再描画されエラー文言がフォーム付近に表示される。取込前に開始したトランザクションがロールバックされるため、1行目で保存された新規カテゴリも取り込まれずカテゴリツリーに残らない ／ 自動検証(内部・DB): dtb_category に当該取込による新規行が無い（1行目もロールバックで消える） [L1:L1-M0341-012; fixture:SEED-M0341-ROLLBACK@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-007	IT-25	削除条件（FK参照残）	P1	外部キー参照が残るカテゴリは削除フラグ1でも削除されずツリーに残る	ログイン済／SEED-M0341-MASTERS／SEED-M0341-FKREF	子カテゴリまたは商品が紐づく既存カテゴリのカテゴリIDと削除フラグ=1を指定した1行CSVファイル	1. 該当CSVを選択し送信ボタンを押下 2. エラー文言が表示され取込が打ち切られることを確認 3. カテゴリツリーに対象カテゴリが残っていること（削除されていないこと）を確認	子カテゴリまたは商品が紐づく（外部キー参照が残る）カテゴリを削除フラグ1で削除しようとしても削除は成立せず、対象カテゴリはカテゴリツリーに残る。エラーが表示され取込は打ち切られる（削除の内部方式・文言はpf/eeで異なるが「削除されない」外部結果は一致するため、削除されない事実のみを判定する） [L1:L1-M0341-010; fixture:SEED-M0341-FKREF@TBD-D5]				
m03-41_admin_product_product_category_csv_import	E2E-M0341C-008	IT-25	画面遷移（失敗時も同一URL）	P2	CSV形式不正の取込は同一URLにエラー文言が表示され登録されない	ログイン済／SEED-M0341-BADFORMAT	必須ヘッダ「カテゴリ名」を欠くCSV（またはパース不能CSV）ファイル	1. 形式不正のCSVを選択し送信ボタンを押下 2. リダイレクトせず同一URLのカテゴリCSV登録画面が再描画されエラー文言がフォーム付近に表示されることを確認 3. カテゴリが登録されていないことを確認	取込がCSVフォーマットエラー（必須ヘッダ欠落・パース不能等）で失敗したときも、リダイレクトせず同一URLのカテゴリCSV登録画面が再描画されエラー文言がフォーム付近に表示され、対象カテゴリは登録されない（GETとPOSTは同一URLで受けPOST後もリダイレクトしない。フォーマットエラー文言はpf/eeで句点差があるため文言でなく同一URL再描画・登録されない外部挙動を判定する） [L1:L1-M0341-006; fixture:SEED-M0341-BADFORMAT@TBD-D5]				
```

---

## §5 ja/en locale対応表（★en-grep結果・ee messages.en.yaml逐語）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。**bound claim（L1-001〜006）はJS/構造/フローで LS=0**。en実在キーはいずれもpf/ee食い違いのTBD claim側に紐づく。

| L1 | キー | ja逐語 | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| L1-008（TBD） | admin.common.csv_upload_complete | CSVファイルをアップロードしました（ee(SUT)） | CSV file uploaded | messages.en.yaml:1684 |
| L1-008（TBD・pf） | admin.category.csv_import.save.complete | カテゴリ登録CSVファイルをアップロードしました。（pf現行） | （pf側キー・ee en対象外） | — |
| L1-010（TBD） | admin.common.delete_error_foreign_key | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | messages.en.yaml:1678 |
| （参考・GET画面ラベル。ee固有・pf hardcodedで食い違い＝bound外） | admin.product.category_csv_upload | カテゴリCSV登録 | Category CSV | messages.en.yaml:1943 |
| （参考） | admin.common.file_select | ファイルを選択 | Select a File | messages.en.yaml:1808 |
| （参考） | admin.common.csv_skeleton_download | 雛形ダウンロード | Download a template | messages.en.yaml:1805 |
| （参考） | admin.common.required | 必須 | Required | messages.en.yaml:1785 |
| （参考） | admin.common.bulk_registration | 一括登録を実行 | Register All | messages.en.yaml:1711 |
| （参考・フォーマットエラー） | admin.common.csv_invalid_format | CSVのフォーマットが一致しません（ee・句点無） | Unmatched CSV format | messages.en.yaml:1810 |
| （参考・無データ） | admin.common.csv_invalid_no_data | CSVデータが存在しません（ee・句点無） | No CSV data found | messages.en.yaml:1811 |
| L1-007（LS=0） | （PHP文字列連結） | （行番号）行目のカテゴリIDが存在しません。 等 | （英訳なし＝ロケール不在） | — |

- LS=0のclaim（L1-001〜007,009,010,011）はロケール変異なしまたは英訳なし＝`-EN`行を持たない。GET画面ラベルはeeに英訳が実在するが、pf(EC-CUBE3)はtwig内ハードコードJP（例 pf-twig:89「CSVファイルのアップロード」・pf-twig:100「雛形ファイルダウンロード」）でee(SUT)とラベルが食い違うため、bound claimでは正確なラベル文言を主張せず構造（要素の存在）に限定した。L1-010（削除FK外部結果一致・bound）は削除の内部文言（pf/ee食い違い）を主張せず「削除されない」外部結果のみのためLS=0。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: カテゴリCSV登録画面（`csv_category.twig`）のセレクタと route（`GET/POST /%eccube_admin_route%/product/category_csv_upload`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。`#upload-form`/`#upload-button`/`#download-button`/`#spinner`/`#file-select`/`form_errors(import_file)`/`.text-danger`（inlineエラー）/成功フラッシュ領域。
- 取込結果の検証は同一URL再描画画面のDOM（成功フラッシュ／inlineエラー文言）を目視（B9・主）。ロールバックの否定的事実（dtb_categoryに新規行が無い）のみdb.ts自動検証（内部）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約は **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→送信ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。
2. 取込CSVは fixture（SEED-M0341-*）として用意。C-006は「1行目=検証通過の正常行／2行目=カテゴリ名空のエラー行」の2行CSVで、取込途中失敗により先行行もロールバックされる（＝1行目が残らない）ことを一意識別する（カテゴリ名空の1行だけでは検証段階で終了し保存に到達せずロールバックを検証できない）。
3. 更新系ケース（C-005/C-006/C-007）は取込でDBが変わりうるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。C-006/C-007は打ち切り・ロールバックまたは削除不成立で書込みが無いのが期待。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-002,C-003 | Playwright（GUI） | 画面（DOM） | 画面表示・JS・確認モーダル無し |
| C-004,C-005,C-008 | Playwright（GUI） | 画面（フィールドエラー／成功フラッシュ／失敗時再描画） | ファイル必須検証・取込成功（同一URL再描画）・CSV形式不正の失敗も同一URL再描画 |
| C-006,C-007 | Playwright＋DB確認 | 画面（inlineエラー）＋DB/ツリー | 取込途中失敗の先行行ロールバック（何も書かれない）・FK参照残の削除不成立（削除されない）はDB/ツリーで確認 |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: 取込途中失敗時の先行行の非書込み（C-006）。削除不成立（C-007）・CSV形式不正の非登録（C-008）はカテゴリツリー再表示でも目視可能。成功系の反映はカテゴリツリー再表示で目視可能なため画面が主。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ・矛盾・非該当観点・pf/ee食い違い（Excel規定なし）・観測不能はexcluded/TBD（Gate B15）。

### 集計（94 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **14** | 下表（8ユニーク候補ケース。B12共有〔完全重複・同一実行〕で母集合14行→tsv8行） |
| **TBD** | **6** | -6/-44/-82（削除フラグ1でID無いcontinueはee(SUT)挙動でpf現行と食い違い・Excel規定なし・L1-009）／-35/-73（取込開始/完了ログ観測未整備・pf==ee・L1-011）／-74（削除ログはee固有＋観測未整備・§10-3） |
| **excluded** | **74** | 汎用スタブ・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・共通認証・MSG前提の汎用期待・前提と期待の対応未定義/自己矛盾。§9.3 |
| 合計 | **94** | 欠番0・理由なし重複0 |

> 会計: bound 14／TBD 6／excluded 74（=94・欠番0）

- 候補ケース総数 **8**（C-001〜C-008）。bound14件を B12（完全重複・同一実行）でemitすると tsv=ユニーク8。
  - C-001←-077（GET画面表示）／C-002←-004/-080（JS submit無効化＋スピナー）／C-003←-005/-043/-081（確認モーダル無し）
  - C-004←-019（ファイル必須→Symfonyフィールドエラー）／C-005←-012/-050/-094（取込成功＝同一URL再描画＋成功アラート）
  - C-006←-076（取込途中失敗で先行行もロールバック＝トランザクション期待。R2 Major是正でrollback母集合行へbind）／C-007←-048（FK参照残のカテゴリは削除フラグ1でも削除されずツリーに残る＝pf/ee外部結果一致。R1 Major2でTBD→bound）
  - C-008←-023/-089（取込失敗〔CSV形式不正/失敗時出力〕も同一URL再描画・非リダイレクト・登録されない。R2 Major是正で-023をrollbackから分離しCSV形式不正の実挙動へ正しくbind）
- **B7非該当観点excluded**: 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ（-63〜-72）。§9.3。
- **B14共通認証**: -93（MALL_OWNER受理）はdocumentation-only excluded（共通認証・テナント403は共通認可）。
- **B8観点補正＝13件**（bound14行のうち観点ラベルが期待テキスト実内容と不一致の13行。-048は母集合ラベル「削除条件」が期待「削除状態にならない」と整合するため補正不要。§8.1）。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（13件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | JS挙動（submit無効化＋スピナー） | L1-002 |
| -005 | 出力抑止 | モーダル（確認ダイアログ無し） | L1-003 |
| -012 | 文字列長バリデーション | 画面遷移（成功時 同一URL再描画） | L1-005 |
| -019 | 部分入力 | ファイル必須検証（Symfonyフィールドエラー） | L1-004 |
| -023 | 登録内容 | 画面遷移（CSV形式不正でも同一URL再描画・登録されない） | L1-006 |
| -043 | 実行結果 | モーダル（確認ダイアログ無し） | L1-003 |
| -050 | 実行結果 | 画面遷移（成功時 同一URL再描画） | L1-005 |
| -076 | 内部情報 | ロールバック（取込途中失敗で先行行も残らない） | L1-012 |
| -077 | ロールバック | 画面表示（GET画面・フォーマット表・雛形） | L1-001 |
| -080 | 画面レイアウト | JS挙動（submit無効化＋スピナー） | L1-002 |
| -081 | 画面レイアウト | モーダル（確認ダイアログ無し） | L1-003 |
| -089 | 画面表示データ | 画面遷移（失敗時 同一HTML再描画） | L1-006 |
| -094 | 公開コンテンツ | 取込成功（成功アラート） | L1-005 |

### 94対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が一致（汎用スタブ＋非該当: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が一致（汎用CSRFスタブ・固有挙動が一次資料に定義なし） | **excluded** | — |
| 003 | csv_category.twig（観点=未認証だが期待はTwig名＝観測不能。構成要素はC-001被覆） | **excluded** | — |
| 004 | submit時に送信/雛形ボタン無効化＋spin.jsスピナー（B8: 対象データ→JS挙動） | bound | C-002 |
| 005 | 送信前の確認ダイアログは無い（B8: 出力抑止→モーダル） | bound | C-003 |
| 006 | 削除フラグ1でID無い→continue無処理行（ee(SUT)挙動・pf現行と食い違い・Excel規定なし） | **TBD** | — |
| 007 | eccube_csv_import_delimiter/enclosure（内部設定キー注記） | **excluded** | — |
| 008 | フォーム項目キー import_file（内部フォームキー名） | **excluded** | — |
| 009 | キー category_del_flg（内部キー名） | **excluded** | — |
| 010 | 必須バリデーションでエラー表示・完了しない＋前提「削除でFK残」（期待は汎用・削除FKはpf/ee食い違い） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（汎用・観測対象未定義） | **excluded** | — |
| 012 | 同一URLのHTML＋前提「成功時出力」（B8: 文字列長→画面遷移 成功時再描画） | bound | C-005 (shared) |
| 013 | 相関バリデーションでエラー表示・完了しない（汎用スタブ・前提「失敗時出力」） | **excluded** | — |
| 014 | 相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 015 | 同上（汎用スタブ・前提「登録/更新」） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示・完了しない（汎用スタブ・前提「業務ルール」） | **excluded** | — |
| 017 | DB相関でエラー表示されず継続＋前提MALL_OWNER（期待汎用・認可は共通） | **excluded** | — |
| 018 | DB相関でエラー表示・完了しない（汎用スタブ・前提「POST成功」） | **excluded** | — |
| 019 | Symfonyのフィールドエラーとして表示（B8: 部分入力→ファイル必須検証） | bound | C-004 |
| 020 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定） | **excluded** | — |
| 021 | 追加されない（汎用スタブ） | **excluded** | — |
| 022 | 追加される（汎用スタブ・前提「削除時FK」） | **excluded** | — |
| 023 | カテゴリCSV登録画面に留まる＋前提MSG-001（CSV形式不正）（B8: 登録内容→画面遷移。フォーマットエラーでも同一URL再描画・登録されない） | bound | C-008 |
| 024 | 追加される（汎用スタブ・前提MSG-002） | **excluded** | — |
| 025 | 追加される（汎用スタブ・前提MSG-003） | **excluded** | — |
| 026 | 追加されない（汎用スタブ・前提MSG-004＝ee固有・pf不在） | **excluded** | — |
| 027 | 追加される（汎用スタブ・前提MSG-005） | **excluded** | — |
| 028 | 追加されない（汎用スタブ・前提MSG-006） | **excluded** | — |
| 029 | 追加される（汎用スタブ・前提MSG-007） | **excluded** | — |
| 030 | 追加される（汎用スタブ・前提MSG-008） | **excluded** | — |
| 031 | 母集合期待がプレースホルダ（前提MSG-009・出所未確認で具体対象なし） | **excluded** | — |
| 032 | 変更される（汎用スタブ・前提MSG-010） | **excluded** | — |
| 033 | 変更されない（汎用スタブ・前提MSG-011） | **excluded** | — |
| 034 | 変更される（汎用スタブ・前提MSG-012） | **excluded** | — |
| 035 | 情報ログ「カテゴリCSV登録開始」（実在・ログ観測未整備） | **TBD** | — |
| 036 | 変更される（汎用スタブ・前提「削除開始/完了/エラー」） | **excluded** | — |
| 037 | 変更される（汎用スタブ・前提「取込完了」） | **excluded** | — |
| 038 | 変更されない（汎用スタブ・前提「トランザクション」） | **excluded** | — |
| 039 | 変更される（汎用スタブ） | **excluded** | — |
| 040 | 変更されない（汎用スタブ） | **excluded** | — |
| 041 | 変更される（汎用スタブ） | **excluded** | — |
| 042 | 変更される（汎用スタブ） | **excluded** | — |
| 043 | 送信前の確認ダイアログは無い（B8: 実行結果→モーダル） | bound | C-003 (shared) |
| 044 | 削除フラグ1でID無い→continue無処理行（ee(SUT)挙動・pf食い違い・Excel規定なし） | **TBD** | — |
| 045 | delimiter/enclosure（内部設定キー注記・-007同型） | **excluded** | — |
| 046 | import_file キー（内部キー・-008同型） | **excluded** | — |
| 047 | category_del_flg キー（内部キー・-009同型） | **excluded** | — |
| 048 | 削除で外部キー残→対象レコードが削除状態にならない（FK参照残のカテゴリは削除フラグ1でも削除されずツリーに残る＝pf/ee外部結果一致） | bound | C-007 |
| 049 | 削除状態になる＋前提「同一ファイル内の順序依存」（前提と削除期待の対応が未定義） | **excluded** | — |
| 050 | 同一URLのHTML＋前提「成功時出力」（B8: 実行結果→画面遷移 成功時再描画） | bound | C-005 (shared) |
| 051 | 削除状態になる＋前提「失敗時出力」（「失敗時出力」に「削除状態になる」は自己矛盾） | **excluded** | — |
| 052 | 副作用 dtb_category INSERT/UPDATE/DELETE・sort_no・ログ・キャッシュ・一時ファイル（内部DB/副作用注記・汎用） | **excluded** | — |
| 053 | ファイル出力内容が一致（汎用スタブ・前提「登録/更新」） | **excluded** | — |
| 054 | フォーマット定義でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 055 | フォーマット定義でエラー表示・完了しない（汎用スタブ・前提MALL_OWNER） | **excluded** | — |
| 056 | ファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 057 | 同上（汎用スタブ） | **excluded** | — |
| 058 | 出力内容が一致（汎用スタブ） | **excluded** | — |
| 059 | 同上（汎用スタブ） | **excluded** | — |
| 060 | 同上（汎用スタブ） | **excluded** | — |
| 061 | 出力内容が一致（汎用スタブ・前提MSG-001） | **excluded** | — |
| 062 | 出力内容でエラー表示されず継続（汎用スタブ・前提MSG-002） | **excluded** | — |
| 063 | 削除の該当レコードが含まれない（削除操作＝本機能に非該当・B7） | **excluded** | — |
| 064 | 移動・リネームが含まれない（非該当・B7） | **excluded** | — |
| 065 | コピーのファイル出力内容が一致（非該当・B7） | **excluded** | — |
| 066 | ファイル登録のファイル出力内容が一致（汎用ファイルスタブ） | **excluded** | — |
| 067 | ファイル出力のファイル出力内容が一致（出力は非該当・B7） | **excluded** | — |
| 068 | JSONのファイル出力内容が一致（非該当・B7） | **excluded** | — |
| 069 | 同名ファイルのファイル出力内容が一致（非該当） | **excluded** | — |
| 070 | 入力JSONの値が変更されない（JSON非該当） | **excluded** | — |
| 071 | 配置先の該当レコードが含まれる（非該当） | **excluded** | — |
| 072 | スキーマのファイル出力内容が一致（汎用ファイルスタブ） | **excluded** | — |
| 073 | 情報ログ「カテゴリCSV登録開始」（実在・ログ観測未整備・-035同型） | **TBD** | — |
| 074 | カテゴリIDを添えた情報ログ（削除ログ・観測未整備） | **TBD** | — |
| 075 | 更新抑止のファイル出力内容が一致（汎用スタブ） | **excluded** | — |
| 076 | データ行処理の直前にトランザクション開始・エラー時 renderWithErrorがロールバック（取込途中失敗で先行行も残らない＝観測可能。B8: 内部情報→ロールバック） | bound | C-006 |
| 077 | ファイル選択・送信ボタン・フォーマット説明・雛形DLリンクが表示される（B8: ロールバック→画面表示） | bound | C-001 |
| 078 | CSRFを伴うマルチパートPOST（内部・CSRFトークンはフォーム由来でC-001被覆） | **excluded** | — |
| 079 | csv_category.twig（Twig名＝観測不能・-003同型） | **excluded** | — |
| 080 | submit時に送信/雛形ボタン無効化＋spin.jsスピナー（B8: 画面レイアウト→JS挙動） | bound | C-002 (shared) |
| 081 | 送信前の確認ダイアログは無い（B8: 画面レイアウト→モーダル） | bound | C-003 (shared) |
| 082 | 削除フラグ1でID無い→continue無処理行（ee(SUT)挙動・pf食い違い・Excel規定なし） | **TBD** | — |
| 083 | delimiter/enclosure（内部設定キー・-007同型） | **excluded** | — |
| 084 | import_file キー（内部キー・-008同型） | **excluded** | — |
| 085 | category_del_flg キー（内部キー・-009同型） | **excluded** | — |
| 086 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 087 | 親カテゴリ行より後に子を書く明示保証は無い（データ整合性注記・単一観測不成立） | **excluded** | — |
| 088 | 画面表示データでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 089 | 同一HTML＋前提「失敗時出力」（B8: 画面表示データ→画面遷移 失敗時再描画） | bound | C-008 (shared) |
| 090 | 副作用 dtb_category列挙（内部DB/副作用注記・-052同型） | **excluded** | — |
| 091 | ファイル選択のファイル出力内容が一致（汎用ファイルスタブ） | **excluded** | — |
| 092 | ID/親ID整数形式・名前必須・自己親子同一禁止・階層上限・削除時FK（業務ルール列挙＝要約・個別はL1-007/009/010に分解） | **excluded** | — |
| 093 | MALL_OWNER受理される（共通認証・documentation-only・B14） | **excluded** | — |
| 094 | POST成功→画面上部に成功アラート（B8: 公開コンテンツ→取込成功） | bound | C-005 (shared) |

`func_scope_check` 判定: 親94/94会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝9件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い（ee(SUT)挙動でpf現行に無い）＋Excel規定なし | -6,-44,-82 | 3 | 母集合期待「削除フラグが1でID無い行→削除ブロックに入ったあとcontinueするのみで無処理行」はee(SUT)が削除フラグをカテゴリ名より前に評価する挙動（ee-cat:765,781）。pf現行はカテゴリ名必須を先に判定し削除フラグを後段switchで処理する（pf-cat:477,526）ため同挙動でない。Excelシートは刷新後bulk（カテゴリ削除フラグ列なし）を規定し本旧csvCategoryを規定しない＝Excel規定なし。よってeeオラクル化せずTBD（L1-009） |
| 取込開始/完了ログの観測手段未整備（pf==ee） | -35,-73 | 2 | 情報ログ「カテゴリCSV登録開始」（pf-cat:422／ee-cat:714・pf==ee）「カテゴリCSV登録完了」（pf-cat:562／ee-cat:842）は実在するがログ観測手段が現行ハーネスで未整備＝画面/履歴で検知できず一意固定不能（L1-011） |
| ee固有の削除ログ＋観測未整備 | -74 | 1 | カテゴリ削除時のカテゴリID添付情報ログはee固有（ee-cat:768）でpf現行csvCategoryには無い（R1 Major3是正: pf==ee扱いは撤回）。加えてログ観測手段未整備で一意固定不能＝TBD（pf-fallback一致にしない・§10-3） |

（合計 3+2+1 = 6）

> R1 Major2是正: 旧版は削除フラグ削除（-48/-49/-51）を一括でpf/ee食い違いTBDにしていたが、**-048はbound**（母集合期待は「FK参照が残る対象が削除状態にならない」のみで、pf〔参照ありでfalse返し削除せず〕もee〔FK例外を捕捉しrollback〕も外部結果＝削除されないで一致。soft/hardや文言差は合否に影響しない・C-007/L1-010）。**-049/-051はexcluded**（-049は前提「同一ファイル内の順序依存」と削除期待の対応が未定義／-051は前提「失敗時出力」に「削除状態になる」で自己矛盾）。→ 会計は bound13/TBD6/excluded75。

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・カテゴリ名空行・親ID・削除フラグ） | fixture manifest（D5型）未整備＝要実機（SEED-M0341-*） |
| L1-007（行単位業務バリデーション・pf/eeバイト一致メッセージ）の各文言 | pf/eeで一致するが母集合に固有一意判定行が無い＝documentation-only。将来、各文言を固有一意判定する母集合行が現れればbound可 |
| L1-008（成功文言pf/ee食い違い）・L1-009（削除フラグcontinueのee固有）の正 | Excelが本旧csvCategoryを規定しないため確定不能＝要仕様確認（旧csvCategoryを刷新後bulkへ統合する場合はfid再定義が要る） |
| L1-010（-048 bound）の削除の内部方式・文言 | 「削除されない」外部結果はbound可だが、pf=del_flg soft/ee=hard・文言差の確定は要仕様（boundは外部結果に限定済） |
| L1-解決器・取込結果アサートヘルパ・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |

### 9.3 excluded＝74件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig名/継承（観測不能・C-001被覆）** | -003,-079 | テンプレート名そのものは外部IFで判定不能。構成要素はC-001が被覆 |
| **【B15③】前提と期待の対応未定義/自己矛盾（削除・R1 Major2）** | -049,-051 | -049は前提「同一ファイル内の順序依存」と期待「削除状態になる」の対応が未定義／-051は前提「失敗時出力」に対し期待「削除状態になる」が自己矛盾。いずれも固有一意判定不成立でexcluded（FK参照残の削除不成立の観測はC-007が担う） |
| **【B15②】内部キー/設定注記スタブ** | -007,-008,-009,-045,-046,-047,-083,-084,-085 | delimiter/enclosure・import_file・category_del_flg 等のキー/設定名は内部注記で単一観測挙動でない |
| **【B15②/③】汎用相関/必須バリデーションスタブ（観測対象未定義・矛盾）** | -010,-011,-013,-014,-015,-016,-017,-018,-054,-055,-086,-088 | 「○○バリデーションでエラー表示/継続」の前提が汎用ノイズで具体対象を名指さず＝固有一意対応不成立 |
| **【B15②】汎用「登録/更新内容が追加/変更される・されない」スタブ（C-005/C-006で概念被覆）** | -020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042 | 対象レコード・具体値を母集合が指定せず内容空虚。MSG前提でも期待が汎用。取込の成功（C-005）・失敗ロールバック（C-006）で概念被覆済み |
| **【B15③】プレースホルダ** | -031 | 「要ソース確認」（前提MSG-009・出所未確認） |
| **【B15②】汎用「ファイル出力内容/取り込み結果が一致」スタブ** | -053,-056,-057,-058,-059,-060,-061,-062,-075,-091 | 一致基準（どの列がどの値か）を母集合が持たず内容空虚 |
| **【B7】ファイル/レコード操作系（非該当）** | -063,-064,-065,-066,-067,-068,-069,-070,-071,-072 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。取込機能に該当なし |
| **【B15②】内部DB/副作用注記スタブ** | -052,-078,-090 | dtb_category副作用列挙・CSRFマルチパート・副作用再列挙はDB/内部処理注記で単一観測挙動でない（-076はR2 Major是正で「取込途中失敗の先行行ロールバック」観測可能としてbound＝C-006へ移動） |
| **【B15②】データ整合性/業務ルール要約注記** | -087,-092 | 親子順序依存の明示保証無し（データ整合性注記）・業務ルール列挙（要約。個別はL1-007/009/010へ分解） |
| **【B14】共通認証（documentation-only）** | -093 | MALL_OWNER受理／テナント403は管理画面共通認可（AuthorityVoter・deny_url）で本機能固有でない |
| **【B15①/③】非該当/汎用スタブ** | -001,-002 | -001「出力失敗」（取込機能に非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし |

## §10 特記事項（片側断定せず記録）

1. **★重大所見（Excelは本fidの旧csvCategoryを規定しない）**: Excel 0204 シート「カテゴリ登録CSVアップロード」（機能No=M03-41）は、識別ID一覧（表示ランク・カテゴリ名(日)/(英)・親カテゴリID=最上位0・階層自動・対象商品数・最新セット用バナー画像パス〔識別ID10〕・カテゴリアイコン画像パス〔識別ID11〕・検索パラメータ）と取込履歴テーブル・件数プルダウン（10〜12000）を持ち、「エンタープライズ版EC-CUBEのカテゴリ登録CSV機能をベースに実装」と明記する（0204:カテゴリ登録CSVアップロード!C71,D82,F84-F89,D93,D96,AB105,AB106）。これは ee `CategoryCsvController`（route `admin_product_category_bulk_import`／`csv_category_bulk.twig`／12列／`MtbCsvImportType::CATEGORY_BULK_IMPORT_CSV_ID=16`）に対応する。**本fid `m03-41_admin_product_product_category_csv_import` が指すのは ee route `admin_product_category_csv_import`＝旧 `CsvImportController::csvCategory`（`csv_category.twig`／4列: カテゴリID/カテゴリ名/親カテゴリID/カテゴリ削除フラグ）**で、母集合・pf-mdもこの旧csvCategoryを記述する。よってExcelは本fidの旧csvCategoryの成功文言・削除フラグ挙動を規定せず、旧csvCategoryのpf/ee食い違いclaimは「Excel規定なし」＝TBDとした。刷新後の正が bulk であるなら、旧csvCategoryはsuperseded候補であり、fid再定義（bulkへ差し替え）を要仕様確認（本書は片側断定しない）。
2. **pf/ee食い違いの具体**: (a)成功メッセージ pf `admin.category.csv_import.save.complete`「カテゴリ登録CSVファイルをアップロードしました。」≠ ee `admin.common.csv_upload_complete`「CSVファイルをアップロードしました」（L1-008）。(b)カテゴリ削除フラグ pf=del_flgを立てるsoft delete（pf-cat:527）＋失敗メッセージ「子カテゴリまたは商品が紐付いているため削除できません。」≠ ee=物理削除（ee-cat:770）＋FK時 `admin.common.delete_error_foreign_key`。ただし**FK参照残の削除では両者とも「削除されない」という外部結果が一致**するため、その外部結果に限定して-048をbound化した（C-007/L1-010・R1 Major2）。(c)MSG-004「更新対象のカテゴリIDが存在しません。新規登録の場合は…空で登録」はee固有（ee-cat:754）でpf現行は同じ不存在をMSG-003文言で返す（pf-cat:466）。(d)画面ラベルはpf=twigハードコードJP（pf-twig:89「CSVファイルのアップロード」/pf-twig:100「雛形ファイルダウンロード」）≠ ee=transキー（`admin.common.bulk_registration`「一括登録を実行」等）。加えて**必須バッジ表現**（pf=セル内テキスト「必須」pf-twig:117／ee=バッジ）と**ファイル名ラベル反映**（ee固有change handler・pf現行に無い）もpf/ee食い違い（R1 Major4）。→ boundは pf/ee がバイト一致・構造一致・外部結果一致するclaim（GET画面構造〔バッジ除く〕・JS submit無効化＋spinner〔ファイル名ラベル除く〕・確認モーダル無し・ファイル必須検証・同一URL再描画フロー・FK参照残の削除不成立）に限定した。
3. **pf/eeバイト一致メッセージ（L1-007・documentation-only）**: 行単位業務バリデーション「（行番号）行目のカテゴリIDが存在しません。」「…カテゴリIDと親カテゴリIDが同じです。」「…カテゴリ名が設定されていません。」「…親カテゴリIDが存在しません。」「…カテゴリが最大レベルを超えているため設定できません。」はpf-cat（460/471/478/488/520）とee-cat（748/759/786/796/829）でバイト一致。ただし母集合の該当行（-025〜-030等）は期待が汎用（「追加される/されない」）で固有一意判定できず documentation-only。読み替えて bound しない（B15）。
3b. **削除ログはee固有（R1 Major3是正）**: カテゴリ削除時にカテゴリIDを添える情報ログ「カテゴリ削除開始/完了/エラー」はee固有（ee-cat:768,771,773）で、pf現行csvCategoryには存在しない（pf現行は取込開始 pf-cat:422／完了 pf-cat:562 のみ）。よってL1-011（pf==ee共通ログ）は取込開始・完了に限定し、削除ログを pf-fallback一致claimに混ぜない。-074（母集合「カテゴリIDを添えた情報ログ」）はee固有＋ログ観測未整備でTBD。
4. **フロー（同一URL再描画・非リダイレクト）**: 本旧csvCategoryは goods/bulk と異なりPOST後にリダイレクトせず同一URLを再描画する（pf `render`（pf-cat:569）／ee `renderWithError` 配列返却（ee-cat:861））。成功は `eccube.admin.success` フラッシュ（画面上部）、エラーは `$this->errors` を twig の `.text-danger` inline（ee-twig:84-86）＋フォームフィールドエラーで表示。これが C-005（成功）/C-006（失敗）の観測設計。
4b. **ロールバック検証の是正（R1 Major1）**: eeはカテゴリ名検証（ee-cat:785）で終了してから保存（ee-cat:837,838）へ進む段階構成のため、「カテゴリ名空の1行」は検証段階で打ち切られ保存に到達せず、ロールバック（保存分の巻き戻し）を検証できない。C-006を**2行CSV（1行目=検証通過の正常行→save済み、2行目=カテゴリ名空のエラー行）**へ変更し、2行目のエラーで全体がロールバックされ1行目の新規カテゴリも残らないことで初めてロールバックを一意判定する（各行はループ内でsave＝flushされるがコミット前でトランザクション内・後続エラーで全体rollback）。
4c. **-023の再分類（R2 Major是正）**: 母集合-023の前提は `M03-41-MSG-001`＝CSV形式不正（all_it_cases.tsv・pf-cat:426／ee-cat:717）で、これはトランザクション開始前のフォーマットエラー分岐であり「取込途中の行エラー→先行行ロールバック」とは別事象。よって-023をロールバック候補（旧C-006）から外し、CSV形式不正の実挙動＝「失敗時も同一URL再描画・非リダイレクト・登録されない」（C-008・L1-006）へbindし直した。ロールバック（先行行が残らない）は、それを実際に要求する母集合-076（トランザクション/エラー時renderWithErrorロールバック）へbind（C-006・L1-012・2行CSV検証）。
5. **正直分類の帰結**: 真のboundは14件（8候補ケース）。TBDは6（削除フラグcontinueのee固有3・取込ログ観測未整備2・削除ログee固有+観測未整備1）。excluded74。高bound数は目的でなく、pf/ee食い違い＋Excelが別機能（bulk）を規定する本機能では低bound・TBD明示が正直分類。実装/実走・承認は主張しない。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（13件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | JS挙動 | 期待「submit時に送信/雛形ボタン無効化＋spin.jsスピナー」（L1-002）。母集合ラベル「対象データ」は誤り |
| 005 | モーダル | 期待「送信前の確認ダイアログは無い」（L1-003）。母集合ラベル「出力抑止」は誤り |
| 012 | 画面遷移 | 期待「同一URLのHTML（成功時再描画）」（L1-005）。母集合ラベル「文字列長バリデーション」は誤り |
| 019 | ファイル必須検証 | 期待「Symfonyのフィールドエラーとして表示」（L1-004）。母集合ラベル「部分入力」は誤り |
| 023 | 画面遷移 | 期待「カテゴリCSV登録画面に留まる（CSV形式不正でも同一URL再描画・登録されない）」（L1-006）。母集合ラベル「登録内容」は誤り |
| 043 | モーダル | 期待「送信前の確認ダイアログは無い」（L1-003）。母集合ラベル「実行結果」は誤り |
| 050 | 画面遷移 | 期待「同一URLのHTML（成功時再描画）」（L1-005）。母集合ラベル「実行結果」は誤り |
| 076 | ロールバック | 期待「データ行処理直前にトランザクション開始・エラー時ロールバック（取込途中失敗で先行行も残らない）」（L1-012）。母集合ラベル「内部情報」は誤り |
| 077 | 画面表示 | 期待「ファイル選択・送信ボタン・フォーマット説明・雛形DLリンクが表示される」（L1-001）。母集合ラベル「ロールバック」は誤り |
| 080 | JS挙動 | 期待「submit時に送信/雛形ボタン無効化＋spin.jsスピナー」（L1-002）。母集合ラベル「画面レイアウト」は誤り |
| 081 | モーダル | 期待「送信前の確認ダイアログは無い」（L1-003）。母集合ラベル「画面レイアウト」は誤り |
| 089 | 画面遷移 | 期待「同一HTML（失敗時再描画）」（L1-006）。母集合ラベル「画面表示データ」は誤り |
| 094 | 取込成功 | 期待「画面上部に成功アラート」（L1-005）。母集合ラベル「公開コンテンツ」は誤り |
