# 候補: m03-27 グッズ商品CSV登録（取込/インポート） — 実行可能グレード候補（母集合106全量会計・更新系CSV取込）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**codex Gate C R1+R2+R3+R4 是正反映版（2026-07-29・ee/pf実ソース照合）**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。
> 期待値の正はL1オラクルID（三段参照・SEED値を期待値の正にしない）。fixture_versionは全て `@TBD-D5`。
> **確定見本＝m03-26 カード商品CSV登録**（codex2パス確定）の構造・取込検証設計を踏襲。ただし**値・claim・列名・メッセージ・MSG番号はM03-27自身の一次資料（pf md／Excel sheet-11／ee実ソース）から**取得。
> **方針（正直分類）**: 汎用スタブ・矛盾・誤ラベルはexcluded、実在するが観測/固定不能はTBD。boundは「その行固有の具体挙動が一次資料にfile:lineで実在し、
> 1回の実行でpass/fail一意判定でき、候補ケースの前提・入力・期待が母集合行と一致する」場合のみ。B12の共有は**前提・入力・期待まで同一実行**の完全重複だけ（別要件の強制共有禁止）。
> **本機能は更新系（DB更新あり・CSVアップロード取込）**。観測対象＝**アップロード結果画面（成功／エラーフラッシュ・取込履歴テーブル）＋取込効果（対象商品を再表示して反映確認）**。
> DB直接参照（B9）は外部IFで検知不能な事実＝異常系ロールバック（何も書かれない）・カテゴリ全置換（DELETE→INSERT）・価格履歴の増分・規格言語列・発送目安の非更新に限る。
> B1-B5・B7-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet-11「グッズ商品CSV登録」（機能No=M03-27・機能名「グッズ商品CSV登録」・概要「パック・ボックス・サプライなどの商品情報をCSVにて一括で更新する」・
  作成者=高久・作成日2025-06-04・更新者=堀部・更新日2025-09-16）。関連=sheet-13「グッズ商品CSVフォーマット」。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は実Excel座標 `0204:グッズ商品CSV登録!<セル>` で表記する（HTML行番号は実座標でない＝T2前処理の実座標方針）。
- **pf現行md（回帰先・source_class=pf-fallback）**: `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md`
  （git hash-object `9cc695ee75b6cab400674062d33e84fb56a8e6c2`／repo HEAD `dbf8cc3cf2f1d1f70ba4fe854c1a877762b708e4`・branch feat/front-e2e-coverage・2026-07-29観測。以下「pf-md:行」）。
  区分宣言「本機能のカスタマイズ区分はカスタマイズである。現行挙動は pf-eccube3（HareruyaEc プラグイン）を参照し、永続化に関わるテーブル名・列名などのDB関連は ec-cube-enterprise を正とする。」（pf-md:9）。
- **ee実ソース（挙動確認・source_classには不使用・R2で照合）**: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php`／`.../Service/Csv/Importer/Event/ProductGoodsImportHandler.php`／`.../Repository/ProductRepository.php`／`.../Form/Type/Admin/CsvImportType.php`／**enロケール源 `.../Resource/locale/messages.en.yaml`**。
- fid_kubun.tsv 相当 `M03-27｜m03-27_admin_product_product_goods_csv_import｜グッズ商品CSV登録｜対象｜カスタマイズ｜pf-eccube3/…｜excel-primary+pf-fallback｜0` → excel優先・不足subjectのみpf回帰・standard-src禁止（暫定付与・確定はD6）。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-27-ADMIN-PRODUCT-PRODUCT-GOODS-CSV-IMPORT-001..106`（106件・欠番0・重複0）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。ee実ソースは挙動照合とenロケール源に使い、オラクルの source_class には不使用。
- **en（R2 Major6是正）**: 旧版の「ee messages.*.yaml不在・全claim LS=0」は**誤り**（docs repo内のみ検索した誤認）。**ee `src/Eccube/Resource/locale/messages.en.yaml` は実在**し、MSG-001・MSG-003・画面タイトル・フォーマット/雛形ラベルのen逐語がある。
  grep確認済み: `admin.common.csv_upload_complete`=「CSV file uploaded」(en:1684)／`admin.common.csv_invalid_format`=「Unmatched CSV format」(en:1810)／`admin.common.csv_format`=「CSV file format」(en:1806)／`admin.common.csv_skeleton_download`=「Download a template」(en:1805)／`admin.product.product_management`=「Products」(en:1930)／`admin.product.product_goods_csv_upload`=「Goods Product CSV」(en:1940)。
  一方 `admin.csv.error.upload.maxrecord`（MSG-002）は**messages.en.yamlに不在**（ja:1626のみ）＝英訳なしLS=0。→ L1-001/002/007/009 は LS=1・en を§5に記録、L1-008(MSG-002) は LS=0。
- **判定原則**: 母集合の観点/前提ラベルはノイズ（機械生成）。bindは各行の「期待結果」実テキスト＋前提の実内容で判定。前提が汎用ノイズで期待も汎用な行を特定バリデーションへ読み替えてboundにしない。
- **B1事前スイープ**: 「場合がある／し得る／なり得／可能性」該当0件。-099は「要ソース確認」プレースホルダ（excluded）。-049/-083は一覧整合が検索条件/キャッシュ依存で固定不能（TBD）、-064はMSG-001到達経路がee実装と食い違い（TBD）、-100はログ観測未整備（TBD）。

---

## §1 L1原子オラクル表

全27claim。**source_class列は excel／pf-fallback のみ**（excel5=L1-004/012/023/025/027・pf-fallback22）。LS=1（enロケール変異あり・ee messages.en.yaml逐語）＝L1-001/002/007/009。他はLS=0（MSG-002・item_name等は英訳なし・挙動claimは非メッセージ）。R3/R4 Major是正: L1-022分割・L1-023/L1-025/L1-027はExcel源（1claim1source）・L1-015はpf skipRow(商品コード重複)へ・L1-016はロールバック=breakAll時のみへ是正。

**オラクル記録の被覆状況（正直分類）**: 本表27claimのうち **documentation-only/TBD経由は L1-009（MSG-001到達経路食い違い）・L1-011（価格整合）・L1-012（廃止在庫）・L1-015（規格≠1 skipRowはee追加pf不在＝-013 TBD／商品コード重複は母集合行無し）・L1-018（一覧整合固定不能）・L1-019〜021（一時ファイル/排他/ログ）の8claim**で、残りは bound候補ケースが検証する（§9.1参照）。
なお L1-008（MSG-002 行数上限）はC-008で・L1-010（各列/行バリデータ）はC-006/C-013で検証される。§9.1にTBD/documentation-onlyの内訳を示す。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0327-001 | http_entry | ナビ「商品管理」→「商品CSV管理」→「グッズ商品CSV登録」から `GET /{admin_route}/product/product_goods_csv_upload` を開くと、アップロード画面・フォーマット表・雛形ダウンロード・取込履歴が表示される | 「ナビ「商品管理」→「商品CSV管理」→「グッズ商品CSV登録」｜`GET /{admin_route}/product/product_goods_csv_upload`｜アップロード画面、フォーマット表、雛形ダウンロード、取込履歴が表示される。」 | pf-md:36,56 | pf-fallback | 1 |
| L1-M0327-002 | display_field | `csv_product_goods.twig` は共通テンプレート `base_csv_upload.twig` を継承し、カード「CSVアップロード」内にファイル入力と「CSVアップロード」ボタン・「CSVファイルフォーマット」カードに項目名・説明の表（必須列にバッジ）・雛形ボタン・下部に取込履歴（ファイル名・アップロード日時・作業者）とページネーションを表示する。ファイル入力の accept は `.csv, text/csv, .tsv, text/tsv` | 「`csv_product_goods.twig` は `base_csv_upload.twig` を継承する。…カード「CSVアップロード」内にファイル入力と「CSVアップロード」ボタン。続けて「CSVファイルフォーマット」…カードに項目名・説明の表、必須列にバッジ。雛形ボタンは `admin.common.csv_skeleton_download`。下部に取込履歴（ファイル名・アップロード日時・作業者）とページネーション。ファイル入力の `accept` は `.csv, text/csv, .tsv, text/tsv`。」 | pf-md:46 | pf-fallback | 1 |
| L1-M0327-003 | display_field | ファイル選択でラベルにファイル名を表示する。フォーム submit 時に `$.changeLoading(true)` を呼ぶ。履歴の表示件数プルダウンは変更で `page_no` と `page_count` を載せた URL へ遷移する | 「ファイル選択でラベルにファイル名を表示。フォーム submit 時に `$.changeLoading(true)`。履歴の表示件数プルダウンは変更で `page_no` と `page_count` を載せた URL へ遷移する。」 | pf-md:47 | pf-fallback | 0 |
| L1-M0327-004 | display_field | 刷新後仕様（Excel最優先）では「CSVファイルのアップロード」ボタン押下後に確認モーダルを表示する。pf現行md:49「送信前の確認ダイアログはない」はExcel基本設計が上書き＝陳腐化（Excel識別ID2の画面部品説明が正）。母集合-005の期待「送信前の確認ダイアログはない」は陳腐化したpf現行値であり観測対象（確認モーダルの有無）は不変 | 「押下後、確認モーダルを表示」 | 0204:グッズ商品CSV登録!AG147 | excel | 0 |
| L1-M0327-005 | session | 履歴の表示件数はクエリ `page_count` が指定可能値（10,50,100,300,500,1000,2000,10000,12000）のときだけセッションキー `admin.product.product_goods_csv.page_count` に保存され表示される。不正値のときはそのリクエストの表示件数は既定10に落ち、既存のセッション保存値は上書きされない（無効値は保存しない）。次回 `page_count` 無しではセッション保存値が採用される。`page_no` はその都度セッションへ保存する | 「クエリ `page_count` またはセッションキー `admin.product.product_goods_csv.page_count` から表示件数を解決する。既定 10。指定可能値はコントローラ定数どおり 10, 50, 100, 300, 500, 1000, 2000, 10000, 12000。不正値は 10 に落とす。クエリで有効値が来たときだけセッションへ保存する。」「クエリ `page_no` …からページ番号を解決し、セッションへ保存する。」 | pf-md:60,61,307 | pf-fallback | 0 |
| L1-M0327-006 | http_flow | POST アップロード送信は、フォーム不正・検証・取込後に成功／失敗のどちらでも常に `GET …/product_goods_csv_upload` へリダイレクトされフラッシュで成否が示される | 「検証・取込後、常に `GET …/product_goods_csv_upload` へリダイレクトされ、フラッシュで成否が分かる。」「いずれにせよ `m03-27_admin_product_product_goods_csv_import` へリダイレクトする。」 | pf-md:38,85 | pf-fallback | 0 |
| L1-M0327-007 | message | 取込結果にエラーが無いとき、成功フラッシュ（キー `admin.common.csv_upload_complete`＝M03-27-MSG-003「CSVファイルをアップロードしました」／en「CSV file uploaded」）を表示し、取込履歴 INSERT（種別ID 2・クライアント側ファイル名・作業者ID）と情報ログ（件数）を行い、グッズ商品CSV登録画面へリダイレクトする | 「無ければ成功フラッシュ `admin.common.csv_upload_complete`、取込履歴 INSERT（種別 ID 2、クライアント側ファイル名、作業者 ID）、情報ログに件数を出す。」「CSVファイルをアップロードしました｜管理画面上部｜…」／en「admin.common.csv_upload_complete: CSV file uploaded」 | pf-md:84,273 | pf-fallback | 1 |
| L1-M0327-008 | message | アップロード内容の概算行数が定数 `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら M03-27-MSG-002「%maxRecord% 行を超えるCSVファイルは登録できません。」をフラッシュしリダイレクトする（%maxRecord%=5010）。キー `admin.csv.error.upload.maxrecord` は messages.en.yaml に不在＝英訳なし | 「アップロード内容の改行ベース概算行数が `5010` 以上なら（定数 `ADMIN_CSV_IMPORT_MAX_ROWS`）、`admin.csv.error.upload.maxrecord` をフラッシュし、同上へリダイレクトする。」「%maxRecord% 行を超えるCSVファイルは登録できません。」 | pf-md:77,272 | pf-fallback | 0 |
| L1-M0327-009 | message | 共通キー `admin.common.csv_invalid_format`＝M03-27-MSG-001「CSVのフォーマットが一致しません」／en「Unmatched CSV format」は import_file が null のとき（GoodsCsvController の file===null 分岐）フラッシュされる設計だが、import_file は required＋NotBlank のためファイル未選択送信は先行するフォーム不正分岐で NotBlank 検証メッセージを出して終了し file===null 分岐へ到達しない＝純UIでのMSG-001到達経路はee実装と食い違う（documentation-only／-064 TBD） | 「`import_file` が無ければキー `admin.common.csv_invalid_format` をフラッシュし、同上へリダイレクトする。」「CSVのフォーマットが一致しません｜…」／en「admin.common.csv_invalid_format: Unmatched CSV format」／ee「'required'=>true, new Assert\\NotBlank()」「if (!\$form->isValid()) { … return redirect; } … if (\$file === null) { addError('admin.common.csv_invalid_format'); }」 | pf-md:76,80,271,226 | pf-fallback | 1 |
| L1-M0327-010 | validation | 事前検証通過後にDBトランザクションを開始し、データ行ごとに列数一致・各列（型・必須）バリデーション・行バリデータを実行する。`breakAll` のとき処理を打ち切りロールバック方向、`skipRow` のとき当該行のみスキップし後続行の処理を続行する | 「データ行ごとに列数一致・各列バリデーション・行バリデータ…を実行する。`breakAll` のとき処理を打ち切り、`skipRow` のとき当該行のみスキップする。」「行ごとの存在チェック…｜不整合は `skipRow` とメッセージが多い。」 | pf-md:81,225,102 | pf-fallback | 0 |
| L1-M0327-011 | validation | 行バリデータで規格の販売価格と買取価格の整合を検証し、整合しない行はエラーとなる（documentation-only＝母集合に価格整合違反を固有一意判定する要求行が無い） | 「基準価格／販売価格／買取価格｜必須｜規格の価格。行バリデータで販売と買取の整合を検証。」 | pf-md:152,225 | pf-fallback | 0 |
| L1-M0327-012 | validation | 更新モードで「商品公開ステータス」を「廃止」に変更する場合、EC-CUBE・スマレジどちらの在庫も確認し在庫が1件以上残っているとエラーとなる（documentation-only＝母集合に廃止時在庫残を固有一意判定する要求行が無い） | 「CSVフォーマット識別ID 2:「商品公開ステータス」を「廃止」とする場合は、EC-CUBE・スマレジどちらの在庫も確認し1件以上の場合はエラーとする」 | 0204:グッズ商品CSV登録!D87 | excel | 0 |
| L1-M0327-013 | validation | 商品カテゴリ(ID)はマップ上サプライ・グッズ・予約グッズ・情報商材系のカテゴリ ID（2・4・5 系の区分）に制限する選択検証を付ける。許容集合外のカテゴリIDを指定した行はエラーとなり処理を打ち切る。対象ID集合が空のときは必須化・選択検証を付けない分岐がある | 「マップ上、サプライ・グッズ・予約グッズ・情報商材系のカテゴリ ID に制限する選択検証を付ける。対象 ID 集合が空のときは必須化・選択検証を付けない分岐がある。」「商品カテゴリ(ID)｜必須…｜2・4・5 系の区分 ID。複数はカンマ。」 | pf-md:112,144 | pf-fallback | 0 |
| L1-M0327-014 | validation | 商品IDで商品を検索し、更新対象の商品IDが指定されているのに存在しない場合はエラーメッセージを積み `breakAll`（当該行で処理を打ち切り後続行を処理しない・ロールバック方向）とする | 「値があるとき既存商品 UPDATE。空なら新規商品 INSERT。存在しない ID はエラーで全体中断。」「更新対象の商品 ID が存在しない｜エラーメッセージを積み `breakAll`。トランザクションはロールバック方向。」 | pf-md:134,161 | pf-fallback | 0 |
| L1-M0327-015 | skip | pf現行のskipRowは新規登録で商品コードが既存規格コードと重複する行（pf handler:187・当該行のみスキップし後続行は続行）である。R4 Major1是正: 「更新対象規格がちょうど1件でない→skipRow」はpf現行に存在せずee刷新で追加された挙動（ee handler:222）＝pf/ee食い違いでeeオラクル化しない（-013 TBD）。商品コード重複skipRowは母集合に固有一意判定行が無くdocumentation-only | 「コードが重複するためエラー｜`$event->skipRow();`」 | pf-handler:187 | pf-fallback | 0 |
| L1-M0327-016 | rollback | 取込のコミット可否は `$isSuccessful = messageStore->count()===0 || !$hasBreak`（pf CsvImporter:272）。エラー（メッセージ）があっても `breakAll` が発生していなければコミットされ、ロールバックは `breakAll` が発生した行があるときに限る（`skipRow` で積まれたエラーは `breakAll` を立てないためコミットされ得る）。R4 Major1是正: 「エラー配列があればロールバック」は過剰主張。エラー配列があれば異常終了ログと各メッセージをフラッシュに積み、成功フラッシュと取込履歴 INSERT は `hasError()` が真のとき行わない | 「`$isSuccessful = $messageStore->count() === 0 || !$hasBreak;` `if ($isSuccessful) { …->commit(); } else { …->rollback(); }`」「コントローラは結果の `hasError()` で成功フラッシュ・履歴挿入の可否を決める。」 | pf-handler:272,pf-md:83,84,104 | pf-fallback | 0 |
| L1-M0327-017 | history | 取込履歴（`dtb_csv_import_history`）はコントローラが成功（結果にエラーが無い）と判断したときだけ INSERT される。エラーを含む取込では履歴は増えない | 「コントローラが成功（結果にエラーが無い）と判断したときだけ INSERT される。」「取込履歴｜…｜成功時のみ INSERT。」「失敗時出力｜…取込履歴は増えない。」 | pf-md:174,208,84 | pf-fallback | 0 |
| L1-M0327-018 | data_integrity | 取込直後の一覧表示は別画面の検索条件・キャッシュに依存し、本画面は CSV 取込後の即時一覧整合を保証しない（documentation-only＝固定した検索条件・キャッシュ状態を定義できず一意判定不可＝-049/-083 TBD）。アップロード CSV の本文全文や取込結果の行ごとの内部状態はセッションへ保存しない | 「取込直後の一覧表示は別画面の検索条件・キャッシュに依存する。本画面は CSV 取込後の即時一覧整合を保証しない。」 | pf-md:173,311 | pf-fallback | 0 |
| L1-M0327-019 | file_handling | アップロードファイルは一時ディレクトリ（設定 `eccube_csv_temp_realdir`）へ移動され `CsvImporter` へ渡る（documentation-only＝固有要求行が無く観測手段も未整備） | 「ファイルは一時ディレクトリ（`eccube_csv_temp_realdir`）へ移動され…」 | pf-md:79 | pf-fallback | 0 |
| L1-M0327-020 | exclusion | 取込は `CsvImporter` が1トランザクション内で全データ行を処理し例外時はロールバックを試行する。行ロックタイムアウトはハンドラが 1〜30 秒で返す前提（既定5秒）（documentation-only＝固有要求行が無い） | 「取込は `CsvImporter` が 1 トランザクション内で全データ行を処理する（例外時はロールバックを試行）。」「行ロックタイムアウトはハンドラが 1〜30 秒の範囲で返す前提（既定 5 秒）。」 | pf-md:324,326 | pf-fallback | 0 |
| L1-M0327-021 | log | POST 取込で情報ログ「グッズ・サプライ・情報商材CSV登録開始」を出す。異常終了時は「…異常終了」、成功時は件数付きログを出す（documentation-only＝ログ観測手段未整備・TBD=-100） | 「情報ログ「グッズ・サプライ・情報商材CSV登録開始」を出す。」 | pf-md:78,287 | pf-fallback | 0 |
| L1-M0327-022 | data_write | 商品IDに値があるとき既存商品規格を UPDATE（price02・買取価格・delFlg・saleLimit 等）、空のとき新規商品規格を INSERT し新規規格では商品在庫を0在庫で初期化する。更新は商品編集画面の再表示で反映を確認できる（R3 Major1是正: 販売価格=基準価格の上書きはpf現行挙動でなくExcel刷新後カスタマイズ＝L1-027へ分離） | 「値があるとき既存商品 UPDATE。空なら新規商品 INSERT。」「商品規格が未登録。 insert する」「ProductStock も忘れずに登録する」 | pf-md:134,82 | pf-fallback | 0 |
| L1-M0327-023 | data_write | 刷新後仕様では、既存規格の更新は販売価格・買取価格・基準価格のいずれかが変更された場合のみ価格履歴（`dtb_price_history`）を1件登録し、商品規格の新規登録時は常に価格履歴を1件登録する（R3 Major1是正: 基準価格の変更を条件に含めるのはExcel刷新後カスタマイズ・pf現行挙動は販売/買取のみ handler:552） | 「更新時は販売／買取価格/基準価格が変更された場合のみ価格履歴を登録する」「商品規格登録時は商品在庫も登録し、常に価格履歴を登録する」 | 0204:グッズ商品CSV登録!D137,D138 | excel | 0 |
| L1-M0327-024 | data_write | 商品カテゴリの更新は当該商品IDの `dtb_product_category` を全削除してから、CSV指定カテゴリ（親カテゴリを含む）を INSERT する全置換である。更新前に付いていたカテゴリでCSVに含まれないものは残らない | 「`dtb_product_category` 等｜カテゴリ紐付け｜全削除差し替えに近い更新。」「商品カテゴリを（親のカテゴリも含めて）更新する」 | pf-md:204,134 | pf-fallback | 0 |
| L1-M0327-025 | data_write | グッズ商品は商品規格／商品規格サブを一律NM規格・日本語固定で登録・更新する（言語はJP_ID日本語固定）。CSVの言語(ID)列は必須だが規格の言語には反映されず常に日本語となる（規格の言語は商品規格一覧・編集画面に表示される＝画面で観測可能）。R4 Major1是正: Excel D136が「日本語固定で登録・更新」と明記＝excel源が正（pf handler:509のJP_ID固定はこれに整合） | 「商品規格／商品規格サブを一律NM規格、日本語固定で登録・更新する」 | 0204:グッズ商品CSV登録!D136 | excel | 0 |
| L1-M0327-026 | data_write | 更新取込では、グッズ商品CSVに列として反映されない既存商品の付帯情報は既存の値を引き継ぎCSVから変更しない。特に発送日目安(ID)は列定義・検証はあるが規格INSERT/UPDATE引数に載らず `dtb_product_class` の発送目安へは反映されない（更新時に既存値のまま）。発送目安は商品規格一覧・編集画面に表示列が無く画面では観測できない構造的事実である | 「更新時は既存の値を引き継ぎ、CSV からは変更しない」「発送日目安(ID)｜任意｜列定義・検証はあるが、当ハンドラの規格 INSERT/UPDATE 引数には載らず、`dtb_product_class` の発送目安へは反映されない（実装確認値）。」 | pf-md:149,165 | pf-fallback | 0 |
| L1-M0327-027 | data_write | セールフラグが無効な規格の更新および新規登録では、CSVの基準価格の値を商品データの「販売価格」「基準価格」に反映する（販売価格(price02)はCSVの販売価格ではなく基準価格で上書きされる）。R3 Major1是正でL1-022から分離したExcel刷新後カスタマイズ | 「CSVフォーマット識別ID 25:「基準価格」の値を、商品データ「販売価格」「基準価格」に反映させる」「セールフラグが無効(セール外)」 | 0204:グッズ商品CSV登録!E99,E100 | excel | 0 |

---

## §2 SEEDセット設計（三段参照。全て `@TBD-D5`）

三段参照: `L1恒等写像claim → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は入力の再現手段であり期待値の正にしない。更新系ケースは冪等性担保のため後始末（.down.sql）でSEED状態へ復元する。取込CSVはfixtureファイルとして用意しUI操作でアップロードする（db.ts直接投入と別）。**C-013(breakAll)は「エラー行＋後続の別種エラー行（センチネル）」を持つ複数行CSVで、breakAll時に後続行が評価されないことを一意判定する**。

| SEEDセットID | 目的 | 固定値（概略） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | ログイン前提（管理画面共通） | 管理者アカウント | 不要 |
| SEED-M0327-MASTERS | 取込の前提マスタ | 言語(ID)・商品公開ステータス・支店公開・購入グループ名称・許容カテゴリ（サプライ・グッズ・予約グッズ・情報商材の2・4・5系区分subtree）・店舗マスタ（公開中）×在庫場所 一式 | 不要（参照） |
| SEED-M0327-VALIDNEW | 正常取込（新規登録） | 全必須列妥当・商品ID空・スマレジ連携OFF・カテゴリは許容集合内＝1データ行の正常CSV | 追加された商品・規格・カテゴリ・タグ・在庫・価格履歴・取込履歴を復元 |
| SEED-M0327-UPDATE | 正常取込（既存商品更新） | 既存グッズ商品1件（商品名(日)・商品公開ステータス=公開等が既知）＋商品IDを指定し商品名(日)・商品公開ステータスを変更する1行CSV | 対象商品を更新前の値へ復元 |
| SEED-M0327-PRICEUPDATE | 価格履歴登録条件＋セールOFF販売価格上書き | 既存グッズ商品1件（規格1件・セールフラグOFF・現行 基準価格=P0/販売価格=S0 が既知）＋商品IDを指定し 基準価格=P1(≠P0)・販売価格=S1(≠P1かつ≠S0) を与える1行CSV | 対象商品・追加された価格履歴行を復元 |
| SEED-M0327-BADPRODUCTID | ロールバック(breakAll)検証の入力 | 更新対象として存在しない商品IDを指定した1行CSV（他列は妥当・pf handler:174で breakAll 誘発） | 不要（打ち切り・書込みなし） |
| SEED-M0327-LANG | 言語日本語固定の検証 | 既存グッズ商品更新（または新規）＋言語(ID)=日本語以外の値Lを与える1行CSV（pfはJP_ID固定でLを無視） | 対象商品を復元（新規なら追加分削除） |
| SEED-M0327-PRESERVE | 付帯情報引き継ぎ（発送目安 非更新） | 既存グッズ商品1件（発送目安=既知値D0）＋商品IDを指定し発送日目安(ID)=D1(≠D0)を与える1行CSV（他列は妥当） | 対象商品を復元 |
| SEED-M0327-HISTORY | 取込履歴のページング検証 | dtb_csv_import_history に種別ID 2 の履歴を複数件（ページング境界跨ぎ） | 不要（参照） |
| SEED-M0327-MAXROW | 行数上限（MSG-002）検証 | データ行が改行数5010以上のCSV | 不要（拒否・書込みなし） |
| SEED-M0327-MISSINGREQ | ロールバック検証のエラー入力 | 必須列（例:商品コード）が空の1行CSV。他は妥当 | 不要（ロールバック・書込みなし） |
| SEED-M0327-BADCATEGORY | カテゴリ制限選択検証 | 許容集合外のカテゴリIDを持つ1行CSV。他は妥当。許容集合は非空 | 不要（打ち切り・書込みなし） |
| SEED-M0327-BREAKALL-SENTINEL | 存在検証breakAllの一意識別 | 2行CSV。row1=存在しない商品IDの更新（breakAll誘発）、row2=許容外カテゴリID（評価されればカテゴリエラーを出すセンチネル） | 不要（打ち切り・書込みなし） |

---

## §3 取込CSV列マトリクス（参照情報・L1-012/L1-022はexcel関連・他はpf現行）

取込CSV列はコントローラ `getCsvHeader()` の行列順（雛形 `product_goods.csv` 1行目）と一致。個々の列値マッピングは母集合に固有要求行が無くdocumentation-only（列値の反映検証はC-007/C-018/C-021で代表）。

| 区分 | 主な列（pf-md:134-155） | 備考 |
|---|---|---|
| 任意/キー | 商品ID（空は新規登録・指定時UPDATE） | pf-md:134 |
| 必須 | 商品コード・言語(ID)・商品公開ステータス・支店の商品公開ステータス・商品名(日/英)・サイズ・重量・商品カテゴリ(ID)・購入グループ名称・基準価格・販売価格・買取価格 | pf-md:135-152 |
| 任意 | 商品説明(日/英)・買取商品説明(日/英)・検索ワード・規格画像・略称タグ(ID)・売上分析タグ(ID)・タグ(ID)・カードセット(ID)・販売制限数・地域別販売制限・フリーエリア | pf-md:141-155 |
| 条件付き必須 | スマレジ連携フラグ／スマレジ商品コード／部門ID（連携ON時は商品コード・部門が必須） | pf-md:154 |
| ダミー | 発送日目安(ID)（列定義・検証はあるが規格へ反映されない＝更新時は既存値のまま・L1-026） | pf-md:149 |
| 刷新後カスタマイズ（★） | 商品公開ステータス変更（廃止時在庫確認・L1-012）・基準価格新規追加・基準価格の誤入力チェック・セールOFF時 基準価格を販売価格へ反映（L1-022）・スマレジ連携 | 0204:グッズ商品CSV登録!D86,D87,D91,D94,E100,D105 |

---

## §4 実行可能グレード14列TSV（候補・自己完結＝全ケース行を実体掲載・bound 14候補）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（既定 `admin`）。
- テストIDは `E2E-M0327C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。C-002/C-009〜C-012/C-014/C-016/C-017/C-023は欠番（C-014=規格≠1 skipRow→R4 TBD・C-023=カテゴリ物理全置換→R4 TBD）。
- **取込パターンの検証設計（Gate B9）**: (1)結果は成功/エラーの**フラッシュ**と**取込履歴テーブル**を画面で目視するのが主。(2)取込効果は**対象商品を再表示**して具体フィールド照合（無値オラクル禁止）。
  (3)**breakAll一意識別**: C-013は後続センチネル行の別種エラーが出ない（breakAllで後続未評価）ことでbreakAllを一意判定。(4)DB自動検証は外部IFで検知不能な否定的事実（ロールバック=何も書かれない）＋価格履歴増分＋発送目安非更新に限る（成功系の反映値・履歴増減・言語日本語表示・カテゴリ最終集合は画面で目視しDB二重チェックしない）。
- 操作手順は純UI操作（ファイル選択→「CSVアップロード」ボタン押下→結果画面／対象商品再表示）。db.ts/afterEachは書かない（Gate B10）。取込CSVはfixtureファイル（SEED）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-001	IT-25	画面表示	P1	メニュー/ブックマークからGETでアップロード画面が開きフォーマット表・雛形ダウンロード・取込履歴が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0327-HISTORY	—	1. ナビ「商品管理」→「商品CSV管理」→「グッズ商品CSV登録」またはブックマークから GET でアクセスする 2. アップロード画面が開き、ファイル入力・「CSVアップロード」ボタン・フォーマット説明表・雛形ダウンロードボタン・下部の取込履歴テーブルが表示されることを確認	メニューまたはブックマークから GET /{admin_route}/product/product_goods_csv_upload を開くとアップロード画面が開き、ファイル入力と「CSVアップロード」ボタン・「CSVファイルフォーマット」の項目名・説明表（必須列にバッジ）・雛形ダウンロードボタン・取込履歴テーブル（ファイル名・アップロード日時・作業者）とページネーションが表示される（enロケールでは画面タイトルProducts/Goods Product CSV等が英語表示） [L1:L1-M0327-001,L1-M0327-002; fixture:SEED-M0327-HISTORY@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-003	IT-20	JS挙動	P2	ファイル選択でラベルにファイル名が表示される	ログイン済／SEED-M0327-VALIDNEW	正常取込CSVファイルを選択（送信はしない）	1. アップロード画面でファイル入力に正常CSVファイルを選択 2. ラベルに選択ファイル名が表示されることを確認	ファイル選択でラベルに選択したCSVファイル名が表示される [L1:L1-M0327-003; fixture:SEED-M0327-VALIDNEW@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-004	IT-20	モーダル	P2	「CSVアップロード」押下後に確認モーダルが表示される	ログイン済／SEED-M0327-VALIDNEW	正常取込CSVファイル	1. ファイルを選択し「CSVアップロード」ボタンを押下 2. 送信前に確認モーダルが表示されることを確認	刷新後仕様（Excel最優先）どおり「CSVアップロード」ボタン押下後に確認モーダルが表示される（pf現行の「送信前の確認ダイアログはない」＝母集合-005の期待はExcelが上書き＝陳腐化） [L1:L1-M0327-004; fixture:SEED-M0327-VALIDNEW@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-005	IT-15	ページネーション	P2	page_countは指定可能値のとき表示件数が変わり不正値のときは既定10で表示され次回無指定で前回値が復元される	ログイン済／SEED-M0327-HISTORY	クエリ page_count（指定可能値=50／不正値=7／無指定）	1. 新規セッションでアップロード画面を page_count=50 で開き履歴の表示件数が50になることを確認 2. 続けて同一セッションで page_count=7（不正値）で開き履歴の表示件数が10になることを確認 3. さらに page_count 無指定で開き履歴の表示件数が50に戻ることを確認	page_countが指定可能値(10,50,100,300,500,1000,2000,10000,12000)のとき履歴の表示件数がその値になる。不正値7のときは既定10で表示される。その後 page_count 無指定で開くと前回の有効値50で表示される（表示件数は履歴テーブルの表示行数・プルダウンの選択値で画面確認） ／ 自動検証(内部): セッションキー admin.product.product_goods_csv.page_count は有効値50送信時に50を保存・不正値7送信時は上書きされず50のまま・page_no はその都度セッションへ保存 [L1:L1-M0327-005; fixture:SEED-M0327-HISTORY@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-006	IT-22	カテゴリ選択検証	P2	許容集合外のカテゴリIDを持つ行は選択検証エラーで打ち切られる	ログイン済／SEED-M0327-MASTERS／SEED-M0327-BADCATEGORY	許容集合（サプライ・グッズ・予約グッズ・情報商材系）外のカテゴリIDを持つ1データ行CSVファイル	1. 許容外カテゴリのCSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示・成功メッセージ非表示・履歴が増えないことを確認 3. 対象商品が登録されていないことを確認	商品カテゴリ(ID)の選択検証エラー（サプライ・グッズ・予約グッズ・情報商材系の許容集合外）が管理画面上部に表示され成功メッセージは出ず取込履歴テーブルに新行が増えず、対象商品は登録されない（打ち切り・ロールバック方向） ／ 自動検証(内部・DB): 商品・規格・履歴とも書込みが無い [L1:L1-M0327-013,L1-M0327-010,L1-M0327-016; fixture:SEED-M0327-BADCATEGORY@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-007	IT-07	取込成功（新規）	P1	正常CSVの新規取込が成功し成功フラッシュ・履歴新行・対象商品の各値反映を画面で確認する	ログイン済／SEED-M0327-MASTERS／SEED-M0327-VALIDNEW	新規商品1行の正常CSVファイル（商品ID空・スマレジ連携OFF・商品名(日)・商品公開ステータス=公開・基準価格・商品カテゴリの各値を固定）	1. ファイルを選択し「CSVアップロード」を押下 2. アップロード画面が再表示され成功フラッシュ「CSVファイルをアップロードしました」表示・エラーフラッシュなしを確認 3. 取込履歴テーブルに新行(ファイル名・日時・作業者)が1件増えたことを確認 4. 商品編集画面で取込商品を再表示し、商品名(日)・商品公開ステータス・基準価格・商品カテゴリ（親カテゴリを含む）がCSVの各値と一致することを確認	取込成功時はアップロード画面が再表示され、成功フラッシュ「CSVファイルをアップロードしました」（en:CSV file uploaded）が管理画面上部に表示されエラーフラッシュは付かない。取込履歴テーブルに新規1行が表示され、対象商品を再表示すると商品名(日)＝CSVの商品名(日)・商品公開ステータス＝公開・基準価格＝CSVの基準価格・商品カテゴリ＝CSVで指定したカテゴリ（親カテゴリを含む）が表示される（すべて画面で照合＝DB二重チェックはしない） ／ 自動検証(内部): HTTP302リダイレクトの遷移先が GET /%eccube_admin_route%/product/product_goods_csv_upload である [L1:L1-M0327-007,L1-M0327-006,L1-M0327-017,L1-M0327-022; fixture:SEED-M0327-VALIDNEW@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-008	IT-12	行数上限	P1	概算行数5010以上のCSVはMSG-002で拒否されグッズ商品CSV登録画面へ遷移する	ログイン済／SEED-M0327-MAXROW	改行数5010以上のCSVファイル	1. 5010行以上のCSVを選択し「CSVアップロード」を押下 2. エラーフラッシュ表示と遷移を確認	エラーメッセージ「5010 行を超えるCSVファイルは登録できません。」（テンプレートは %maxRecord% 行…で %maxRecord% は上限定数ADMIN_CSV_IMPORT_MAX_ROWS＝5010に解決。本メッセージは英訳なし＝ja固定）が管理画面上部に表示されグッズ商品CSV登録画面へリダイレクトされ、取込は行われない ／ 自動検証(内部・DB): 商品・規格・履歴とも増減なし [L1:L1-M0327-008; fixture:SEED-M0327-MAXROW@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-013	IT-22	存在検証（breakAll）	P2	存在しない商品IDの行でbreakAllし後続センチネル行が評価されない	ログイン済／SEED-M0327-MASTERS／SEED-M0327-BREAKALL-SENTINEL	2行CSV: row1=存在しない商品IDの更新（breakAll誘発）・row2=許容外カテゴリの新規行（評価されればカテゴリエラーを出すセンチネル）	1. 2行CSVを選択し「CSVアップロード」を押下 2. フラッシュにrow1の商品ID不存在エラーが表示され、row2のカテゴリエラーは表示されないことを確認 3. 成功メッセージ非表示・履歴が増えないことを確認	row1の更新対象商品ID不存在エラー（breakAll）が表示され、breakAllにより後続row2は評価されずrow2のカテゴリ選択検証エラーは表示されない。成功メッセージは出ず取込履歴テーブルに新行が増えない（打ち切り・ロールバック方向） ／ 自動検証(内部・DB): 商品・規格・履歴とも書込みが無い [L1:L1-M0327-014,L1-M0327-010,L1-M0327-016; fixture:SEED-M0327-BREAKALL-SENTINEL@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-015	IT-25	ロールバック（breakAll）	P1	breakAllが発生する取込ではアップロード画面にエラーフラッシュのみが表示され成功メッセージと履歴INSERTが行われずロールバックされる	ログイン済／SEED-M0327-MASTERS／SEED-M0327-BADPRODUCTID	breakAllを誘発するCSVファイル（更新対象の商品IDが存在しない1行）	1. breakAllを誘発するCSVを選択し「CSVアップロード」を押下 2. アップロード画面にエラーフラッシュ（複数可・1件以上）が表示され成功メッセージ（MSG-003）が出ないことを確認 3. 取込履歴テーブルに新行が増えないことを確認	breakAllが発生する取込ではアップロード画面が再表示されエラーフラッシュ（複数可）が1件以上付き成功メッセージ（MSG-003）は付かず、取込履歴テーブルに新行が増えない（pf CsvImporter:272の判定 count===0||!breakAll が偽＝ロールバック。skipRowのみのエラーは breakAll を立てずコミットされ得る点と対比） ／ 自動検証(内部・DB): HTTP302で GET …/product_goods_csv_upload へ遷移・dtb_csv_import_history が増えず取込対象の商品・規格にも書込みが無い（ロールバック） [L1:L1-M0327-016,L1-M0327-006; fixture:SEED-M0327-BADPRODUCTID@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-018	IT-07	取込成功（更新）	P1	既存商品IDを指定した更新CSVで既存商品がUPDATEされ変更値が再表示される	ログイン済／SEED-M0327-MASTERS／SEED-M0327-UPDATE	既存商品の商品IDを指定し商品名(日)・商品公開ステータスを変更する1データ行CSVファイル	1. 更新CSVを選択し「CSVアップロード」を押下 2. アップロード画面が再表示され成功フラッシュ「CSVファイルをアップロードしました」表示と履歴新行を確認 3. 商品編集画面で対象商品を再表示し、商品名(日)・商品公開ステータスがCSVの変更後の値になっていることを確認	商品IDに値がある更新CSVで既存商品がUPDATEされ、アップロード画面が再表示され成功フラッシュ「CSVファイルをアップロードしました」と取込履歴新行が表示される。商品編集画面で対象商品を再表示すると商品名(日)＝CSVの変更後の商品名(日)・商品公開ステータス＝CSVの変更後のステータスが表示される（画面で照合） ／ 自動検証(内部): HTTP302リダイレクトの遷移先が GET /%eccube_admin_route%/product/product_goods_csv_upload である [L1:L1-M0327-022,L1-M0327-007,L1-M0327-017; fixture:SEED-M0327-UPDATE@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-019	IT-06	価格履歴・セールOFF販売価格	P2	既存規格の価格変更更新で価格履歴が1件増え、セールOFFのため販売価格はCSVの基準価格で上書きされる	ログイン済／SEED-M0327-MASTERS／SEED-M0327-PRICEUPDATE	既存商品（規格1件・セールフラグOFF・現行 基準価格P0/販売価格S0）の商品IDを指定し 基準価格=P1(≠P0)・販売価格=S1(≠P1かつ≠S0) を与える1行CSV	1. 価格変更の更新CSVを選択し「CSVアップロード」を押下 2. アップロード画面に成功フラッシュが表示されることを確認 3. 商品編集画面で対象商品を再表示し、基準価格＝P1・販売価格＝P1（CSVの基準価格で上書き、CSVの販売価格S1ではない）になっていることを確認	更新取込は成功し成功フラッシュが表示される。セールフラグOFFの規格の更新では販売価格(price02)にはCSVの販売価格S1ではなくCSVの基準価格P1が反映される（Excel識別ID25・刷新後カスタマイズ）ため、商品編集画面の再表示で基準価格＝P1・販売価格＝P1（≠S1）となる（画面で照合） ／ 自動検証(内部・DB): 基準価格が変更されたため dtb_price_history が対象規格について1件増える（価格履歴は商品編集画面に再表示されない構造的増分のためDBで確認・刷新後は基準価格変更も価格履歴条件） [L1:L1-M0327-027,L1-M0327-023,L1-M0327-022; fixture:SEED-M0327-PRICEUPDATE@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-020	IT-25	画面遷移（常にリダイレクト）	P1	成功・失敗のどちらの取込でもアップロード画面へ戻りフラッシュで成否が示される	ログイン済／SEED-M0327-MASTERS／SEED-M0327-VALIDNEW／SEED-M0327-MISSINGREQ	正常CSV（成功）とエラーCSV（必須列欠落・失敗）の2ファイル	1. 正常CSVを選択し「CSVアップロード」を押下→アップロード画面が再表示され成功フラッシュが表示されることを確認 2. 続けてエラーCSVを選択し「CSVアップロード」を押下→同じくアップロード画面が再表示されエラーフラッシュが表示されることを確認	POST取込は成功・失敗のどちらでもアップロード画面（グッズ商品CSV登録画面）が再表示され、成功時は成功フラッシュ「CSVファイルをアップロードしました」・失敗時はエラーフラッシュが管理画面上部に表示される。フォーム不正・行検証エラー・取込成功のいずれの結末でも同じアップロード画面へ戻りフラッシュで成否が分かる ／ 自動検証(内部): 両送信ともHTTP302リダイレクトの遷移先が GET /%eccube_admin_route%/product/product_goods_csv_upload である [L1:L1-M0327-006,L1-M0327-007,L1-M0327-016; fixture:SEED-M0327-VALIDNEW@TBD-D5,SEED-M0327-MISSINGREQ@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-021	IT-25	言語（日本語固定）	P2	グッズ取込では規格の言語がCSVの言語(ID)に関わらず一律日本語で保存され画面に日本語と表示される	ログイン済／SEED-M0327-MASTERS／SEED-M0327-LANG	言語(ID)=日本語以外の値Lを指定した取込CSVファイル（グッズ商品）	1. 言語(ID)=L（日本語以外）を持つグッズCSVを選択し「CSVアップロード」を押下 2. 成功フラッシュ表示を確認 3. 商品編集画面（または商品規格一覧）で対象規格を再表示し規格の言語が「日本語」と表示されることを確認	グッズ商品は規格の言語を一律 JP_ID（日本語）固定で保存するため、CSVの言語(ID)にLを指定しても規格の言語は日本語となる。商品規格一覧・編集画面で対象規格の言語が「日本語」と表示される（規格言語は画面に表示される＝画面で照合） [L1:L1-M0327-025; fixture:SEED-M0327-LANG@TBD-D5]				
m03-27_admin_product_product_goods_csv_import	E2E-M0327C-022	IT-25	付帯情報引き継ぎ	P3	更新取込でCSVに反映されない発送日目安は既存値のまま変更されない	ログイン済／SEED-M0327-MASTERS／SEED-M0327-PRESERVE	既存商品（発送目安=D0）の商品IDを指定し発送日目安(ID)=D1(≠D0)を与える更新CSVファイル	1. 発送日目安(ID)=D1を持つ更新CSVを選択し「CSVアップロード」を押下 2. アップロード画面に成功フラッシュ「CSVファイルをアップロードしました」が表示されることを確認	更新取込は成功しアップロード画面に成功フラッシュ「CSVファイルをアップロードしました」が表示される（発送日目安は規格一覧・編集画面に表示列が無く画面では観測できない構造的事実のため画面期待はフラッシュのみ） ／ 自動検証(内部・DB): 対象規格の発送目安列がD0のまま（CSVのD1に更新されていない＝発送日目安はハンドラの規格INSERT/UPDATE引数に載らずCSVから変更されない・B9意図しない更新の検出） [L1:L1-M0327-026,L1-M0327-007; fixture:SEED-M0327-PRESERVE@TBD-D5]				
```

---

## §5 ja/en locale対応表（R2 Major6是正・ee messages.en.yaml逐語）

**en源=ee `src/Eccube/Resource/locale/messages.en.yaml`**（source_classには不使用・enロケール紐付けのみ）。LS=1のclaimのみen行を持つ。

| L1 | キー | ja逐語（pf md表示メッセージ表/画面ラベル） | en逐語（ee messages.en.yaml） | en file:line |
|---|---|---|---|---|
| L1-007（MSG-003） | admin.common.csv_upload_complete | CSVファイルをアップロードしました | CSV file uploaded | messages.en.yaml:1684 |
| L1-009（MSG-001） | admin.common.csv_invalid_format | CSVのフォーマットが一致しません | Unmatched CSV format | messages.en.yaml:1810 |
| L1-002 | admin.common.csv_upload | CSVファイルをアップロード | Upload a CSV file | messages.en.yaml:1804（base_csv_upload.twig:74 でtrans描画） |
| L1-002 | admin.common.required | 必須 | Required | messages.en.yaml:1785（base_csv_upload.twig:101 必須バッジでtrans描画） |
| L1-002 | admin.common.csv_format | CSVファイルフォーマット | CSV file format | messages.en.yaml:1806 |
| L1-002 | admin.common.csv_skeleton_download | 雛形ダウンロード | Download a template | messages.en.yaml:1805 |
| L1-001 | admin.product.product_management | 商品管理 | Products | messages.en.yaml:1930 |
| L1-001 | admin.product.product_goods_csv_upload | グッズ商品CSV登録 | Goods Product CSV | messages.en.yaml:1940 |
| L1-002 | admin.common.count | %count% 件（履歴件数プルダウン） | %count% items | messages.en.yaml:1792（csv_import_history.twig:12 でtrans描画） |
| L1-002 | admin.common.csv_item_name | 項目名（フォーマット表見出し） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:90・ja: messages.ja.yaml csv_item_name） |
| L1-002 | admin.common.csv_description | 説明（フォーマット表見出し） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:91） |
| L1-002 | admin.common.browse | 参照（ファイル選択ラベル content） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:11） |
| L1-002 | admin.common.csv_import_error | CSV取込エラー（アラート見出し） | （英訳なし＝messages.en.yamlに不在） | — （base_csv_upload.twig:43） |
| L1-002 | admin.common.search_no_result | 検索結果がありません系 | Sorry, no data matches your search condition(s) | messages.en.yaml（csv_import_history.twig:38 履歴0件時） |
| L1-002 | admin.product.csv_import_history_title | 取込履歴（見出し） | （英訳なし＝messages.en.yamlに不在） | — （csv_import_history.twig:6） |
| L1-002 | admin.product.csv_import_history_filename | ファイル名（履歴列見出し） | （英訳なし＝messages.en.yamlに不在） | — （csv_import_history.twig:24） |
| L1-002 | admin.product.csv_import_history_upload_date | アップロード日時（履歴列見出し） | （英訳なし＝messages.en.yamlに不在） | — （csv_import_history.twig:25） |
| L1-002 | admin.product.csv_import_history_operator | 作業者（履歴列見出し） | （英訳なし＝messages.en.yamlに不在） | — （csv_import_history.twig:26） |
| L1-008（MSG-002・LS=0） | admin.csv.error.upload.maxrecord | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし＝messages.en.yamlに不在） | — (ja: messages.ja.yaml:1626) |

- LS=0のclaim（L1-003,005,006,008,010〜026）はロケール変異なしまたは英訳なし＝`-EN`行を持たない。

## §6 判定手段骨子（候補＝未実装）＋ _drafts隔離

- page: アップロード画面（`csv_product_goods.twig`／共通 `base_csv_upload.twig`）のセレクタと route（`GET/POST /%eccube_admin_route%/product/product_goods_csv_upload`）を再利用。セレクタ・route確認のみに使い期待値はL1解決器経由。
- 取込結果の検証はフラッシュメッセージDOM（複数メッセージの集合）＋取込履歴テーブルDOMを目視（B9・主）。取込効果は対象商品を商品編集で再表示して反映確認（B9）。
- db.ts自動検証（内部・DB）は: ロールバック時の非書込み（C-006/C-013/C-015）／価格履歴増分（C-019）／発送目安の非更新（C-022）に限る（C-021 言語=日本語は規格画面に表示されるため画面期待でDB検証を付さない・R3/R4 Major2/3）。
- L1解決器・取込CSV fixtureファイル・SEED manifest契約・フラッシュ集合差分アサートヘルパは **M0成果物（D8/D9/D5型）として未実装**。本骨子は「完成後にこう書く」契約。

### 6.1 取込CSVファイルの入力契約

1. **CSVはUI操作でアップロード**する（ファイル選択→「CSVアップロード」ボタン）。直接POSTは用いない（CSRFトークンはフォーム由来）。※ファイル未選択送信のMSG-001経路は純UIで到達不能（NotBlankフォームエラーで終了）＝候補化しない（-064 TBD・§9.1）。
2. 取込CSVは fixture（SEED-M0327-*）として用意。C-013は「エラー行＋後続の別種エラー行（センチネル）」を持つ複数行CSVでbreakAll時の後続非評価を一意識別。
3. C-019はセールフラグOFFのSEEDで販売価格が基準価格に上書きされる刷新後仕様を検証（CSV販売価格S1≠CSV基準価格P1）。
4. 更新系ケース（C-007/C-018/C-019/C-021/C-022/C-023）は取込でDBが変わるため、テスト後に .down.sql でSEED状態へ復元し冪等性を担保する（`@TBD-D5`）。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

| 候補ケース | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| C-001,C-003,C-004,C-005 | Playwright（GUI） | 画面（DOM）＋セッション | 画面表示・JS・確認モーダル・ページネーション |
| C-007,C-018,C-020,C-021 | Playwright（GUI） | 画面（フラッシュ・履歴・再表示） | 正常取込（新規/更新）・常にリダイレクト・言語日本語表示＝画面のみで判定（規格言語は商品規格一覧・編集画面に表示＝R3 Major2でDB主から画面期待へ是正） |
| C-006,C-013,C-015 | Playwright＋DB確認 | 画面（エラーフラッシュ）＋DB | 打ち切り(breakAll)の否定的事実（何も書かれない）はDB副次 |
| C-019,C-022 | Playwright＋DB確認 | 画面（反映値/フラッシュ）＋DB（構造的事実） | 価格履歴増分・発送目安非更新（画面表示列なし）は画面非表示の構造的事実でDB副次。C-019の価格反映は画面でも確認 |

DB直接参照は**外部IFで検知不能な事実に限る**（B9）: ロールバックの非書込み・価格履歴増分・規格言語列・発送目安非更新・カテゴリ全置換（DELETE→INSERT）。取込履歴の増減・正常取込の反映値（商品名/ステータス/基準価格/カテゴリ）は画面で目視可能なため**主は画面・DB二重チェックはしない**（C-007/C-018は成功時DB検証を除去済み）。

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて**期待テキスト実内容＋前提条件**による。汎用スタブ（前提が汎用ノイズの相関/DB相関観点行を含む）・矛盾・非該当観点はexcluded（Gate B15）。

### 集計（106 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **16** | 下表（14ユニーク候補ケース。B12共有〔完全重複・同一実行のみ〕で母集合16行→tsv14行） |
| **TBD** | **6** | -013（更新規格≠1 skipRowはee刷新追加でpf現行に無い＝pf/ee食い違い・R4 Major1）／-049,-083（取込直後の一覧整合は検索条件・キャッシュ依存で固定した状態を定義できず一意判定不可・B1）／-064（MSG-001到達経路がee実装〔import_file required+NotBlank〕と食い違い純UI到達不能・B1/B3）／-089（カテゴリ物理全置換は dtb_product_category に行idが無く〔PK=product_id/category_id/base_info_id〕差分更新と区別する安定識別手段が無い・R4 Major2）／-100（取込開始ログ観測未整備・B15③）。§9.1 |
| **excluded** | **84** | 汎用スタブ・矛盾・非該当観点・内部注記・プレースホルダ・Twig継承(観測不能)・共通認証・phantom MSG。§9.3 |
| 合計 | **106** | 欠番0・理由なし重複0 |

> 会計: bound 16／TBD 6／excluded 84（=106・欠番0）

- 候補ケース総数 **14**（C-001,C-003〜C-008,C-013,C-015,C-018〜C-022。C-002/C-009〜C-012/C-014/C-016/C-017/C-023は欠番）。bound16件を B12（完全重複・同一実行）でemitすると tsv=ユニーク14。
  - C-001←-103（画面表示）／C-003←-004/-106（ファイル選択ラベル）／C-004←-005（確認モーダル・Excel最優先）／C-005←-102（page_count/page_noセッション）
  - C-006←-006（カテゴリ制限選択検証）／C-007←-085（正常取込〔新規〕＝302＋MSG-003＋履歴新行＋各値反映）／C-008←-061/-095（MSG-002 行数上限→遷移）
  - C-013←-012（存在検証breakAll・センチネルで後続非評価を確認）／C-015←-086（ロールバック＝breakAll時のみ・エラーフラッシュのみ・R4 Major1でrollback条件是正）
  - C-018←-008（既存商品UPDATE取込＝R1追加・R2維持）／C-019←-090（価格履歴＋セールOFF販売価格上書き＝R2 Major5是正）／C-020←-104（成功・失敗双方で常にリダイレクト＝R2 Major2で-085から分離）
  - C-021←-009（言語は一律JP_ID日本語固定・規格画面表示で確認＝R2追加/R3 Major2画面期待/R4 Major1でExcel D136源へ）／C-022←-082（発送目安はCSV非反映で既存値のまま・画面表示列なしDB検証＝R2追加/R3 Major2/R4 Major3で画面期待はフラッシュのみ）
  - **-013（規格≠1 skipRow）はR4 Major1でTBD**（ee刷新追加でpf現行に無い・pf/ee食い違い）・**-089（カテゴリ物理全置換）はR4 Major2でTBD**（dtb_product_categoryに行id無く安定識別不能）＝C-014/C-023廃止
- **B7非該当観点excluded**: 検索条件14（-020〜-033）／ファイル操作系（-072〜-081）。§9.3。
- **B14未認証委譲**: 母集合の観点「未認証」は-003の1行のみだが期待はTwig継承（機械生成誤ラベル）＝Twig継承観測不能でexcluded。共通認証-092もdocumentation-only excluded。
- **B8観点補正＝16件**（bound16行すべて観点ラベルが期待テキスト実内容と不一致。§8.1）。-013/-089はTBD化により観点補正から除外。

### 8.1 観点補正（B8。母集合は不変・1:1）

**本表のNNN集合は文末「## 観点補正」正準表と完全一致する（16件）。**

| 母集合 | 母集合観点ラベル | 正しい観点（期待テキスト実内容） | 根拠 |
|---|---|---|---|
| -004 | 対象データ | JS挙動（ファイル選択ラベル） | L1-003 |
| -005 | 出力抑止 | モーダル（確認モーダル表示・Excel最優先） | L1-004 |
| -006 | 識別子 | カテゴリ選択検証（サプライ・グッズ・予約グッズ・情報商材系のカテゴリID制限） | L1-013 |
| -008 | 確認ダイアログ | 取込成功（更新）（商品ID有→既存商品UPDATE） | L1-022 |
| -009 | HTTPステータス | 言語（日本語固定）（グッズは規格の言語を一律JP_ID固定で保存） | L1-025 |
| -012 | 文字列長バリデーション | 存在検証（更新対象の商品ID不存在→breakAll） | L1-014 |
| -061 | 実行結果 | メッセージ/画面遷移（MSG-002 行数上限→グッズ商品CSV登録画面へ遷移） | L1-008 |
| -082 | 初期行数 | 付帯情報引き継ぎ（更新時CSV非反映の発送目安等は既存値のまま） | L1-026 |
| -085 | 内部情報 | 取込成功（リダイレクト先で成功フラッシュ） | L1-007 |
| -086 | 排他制御 | 取込失敗ロールバック（リダイレクト先でエラーフラッシュ複数可） | L1-016 |
| -090 | 画面レイアウト | 価格履歴（新規規格は常に・更新は価格変更時のみ dtb_price_history追加） | L1-023 |
| -095 | 一覧 | メッセージ/画面遷移（MSG-002 行数上限→グッズ商品CSV登録画面へ遷移） | L1-008 |
| -102 | 非同期更新 | ページネーション（page_count/page_noセッション保存） | L1-005 |
| -103 | エラー継続 | 画面表示（GETアップロード画面・フォーマット表・雛形・履歴） | L1-001 |
| -104 | 公開コンテンツ | 画面遷移（POST後 成功・失敗双方で常にリダイレクト＋フラッシュ） | L1-006 |
| -106 | データ正当性 | JS挙動（ファイル選択ラベル） | L1-003 |

### 106対応表（期待テキスト要旨／前提の要点→会計→候補ケース）

| No | 期待テキスト要旨／前提の要点 | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗のファイル出力内容が対象データと一致（汎用スタブ＋矛盾: 取込機能に「出力失敗」非該当） | **excluded** | — |
| 002 | CSRFのファイル出力内容が対象データと一致（汎用スタブ・CSRF失敗の固有挙動は一次資料に定義なし） | **excluded** | — |
| 003 | csv_product_goods.twig が base_csv_upload.twig を継承（観点=未認証だが期待はTwig継承＝観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 004 | ファイル選択でラベルにファイル名を表示（B8: 対象データ→JS挙動） | bound | C-003 |
| 005 | 送信前の確認ダイアログはない（陳腐化pf現行値。Excel最優先で「押下後確認モーダル表示」が正＝観測対象=モーダル有無は不変。B8: 出力抑止→モーダル） | bound | C-004 |
| 006 | マップ上サプライ・グッズ・予約グッズ・情報商材系のカテゴリID制限選択検証（B8: 識別子→カテゴリ選択検証） | bound | C-006 |
| 007 | フォーム項目キー import_file（内部フォームキー名の設計注記・ファイル入力はC-001被覆） | **excluded** | — |
| 008 | 値があるとき既存商品UPDATE（更新取込＝新規登録の取込では被覆しない具体挙動・B8: 確認ダイアログ→取込成功(更新)） | bound | C-018 |
| 009 | 規格の言語に保存（グッズは一律JP_ID日本語固定で保存・CSV言語IDは反映されず・規格画面に日本語表示。R3 Major1でpf JP_ID固定へ是正・B8: HTTPステータス→言語日本語固定） | bound | C-021 |
| 010 | 必須バリデーションでエラー表示され完了しない（前提「規格画像」は任意列で必須validationエラーを一意に起こせず自己矛盾・B15③。必須欠落→中断はロールバックC-015が代表） | **excluded** | — |
| 011 | 必須バリデーションでエラー表示されず継続（発送日目安=任意かつ規格へ未反映・観測対象なしの汎用「エラーなし継続」） | **excluded** | — |
| 012 | エラーメッセージを積み breakAll＋前提「更新対象の商品IDが存在しない」（B8: 文字列長→存在検証） | bound | C-013 |
| 013 | 相関バリデーションでエラー表示され完了しない＋前提「規格がちょうど1件でない」（実挙動skipRowだが「更新規格≠1→skipRow」はee刷新追加でpf現行に無い＝pf/ee食い違いでeeオラクル化しない） | **TBD** | — |
| 014 | 相関バリデーションでエラー表示されず継続（付帯情報引き継ぎ前提だが期待は汎用「エラーなし継続」・観測対象未定義） | **excluded** | — |
| 015 | 相関バリデーションでエラー表示されず継続（汎用スタブ・観測対象未定義） | **excluded** | — |
| 016 | 相関バリデーションでエラー表示され完了しない（前提「取込履歴」は汎用ノイズで価格整合等の具体対象を名指さず・固有一意対応不成立） | **excluded** | — |
| 017 | DBとの相関バリデーションでエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 018 | DBとの相関バリデーションでエラー表示され完了しない（前提「失敗時出力」は汎用ノイズで廃止時在庫等の具体対象を名指さず・固有一意対応不成立） | **excluded** | — |
| 019 | 新規・更新の両方（dtb_product・内部DB注記・汎用） | **excluded** | — |
| 020 | 検索条件の該当レコードが取得結果に含まれる（検索非該当・汎用スタブ・B7/B15） | **excluded** | — |
| 021 | 含まれない（検索非該当・汎用スタブ） | **excluded** | — |
| 022 | 含まれる（汎用スタブ） | **excluded** | — |
| 023 | 含まれない（汎用スタブ） | **excluded** | — |
| 024 | 含まれる（汎用スタブ） | **excluded** | — |
| 025 | 含まれない（汎用スタブ） | **excluded** | — |
| 026 | 含まれる（汎用スタブ） | **excluded** | — |
| 027 | 含まれない（汎用スタブ・前提MSG-002） | **excluded** | — |
| 028 | 含まれる（汎用スタブ・前提MSG-003） | **excluded** | — |
| 029 | 含まれない（汎用スタブ・前提MSG-005＝phantom） | **excluded** | — |
| 030 | 含まれる（汎用スタブ・前提MSG-001） | **excluded** | — |
| 031 | 含まれない（汎用スタブ・前提MSG-004＝phantom） | **excluded** | — |
| 032 | 含まれる（汎用スタブ） | **excluded** | — |
| 033 | 含まれない（汎用スタブ） | **excluded** | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる（汎用スタブ） | **excluded** | — |
| 035 | 同上（汎用スタブ） | **excluded** | — |
| 036 | 同上（汎用スタブ） | **excluded** | — |
| 037 | 同上（汎用スタブ） | **excluded** | — |
| 038 | 登録内容の対象レコードが追加される（汎用スタブ・具体列/値未指定＝C-007で概念被覆） | **excluded** | — |
| 039 | 登録内容の対象レコードが追加されない（汎用スタブ＝C-015で概念被覆） | **excluded** | — |
| 040 | 追加される（汎用スタブ） | **excluded** | — |
| 041 | フォーム項目キー import_file（内部フォームキー名・-007と同型） | **excluded** | — |
| 042 | 追加される（汎用スタブ） | **excluded** | — |
| 043 | 追加される（汎用スタブ・最大長） | **excluded** | — |
| 044 | 追加されない（汎用スタブ・最大長+1） | **excluded** | — |
| 045 | 追加される（汎用スタブ・最小長） | **excluded** | — |
| 046 | 追加されない（汎用スタブ・最小長-1・前提商品ID不存在＝存在検証はC-013被覆） | **excluded** | — |
| 047 | 追加される（汎用スタブ・前提規格件数＝スキップはC-014被覆） | **excluded** | — |
| 048 | 実行結果の対象レコードが追加される（汎用スタブ） | **excluded** | — |
| 049 | 取込直後の一覧表示は別画面の検索条件・キャッシュに依存する（条件依存で固定した検索・キャッシュ状態を定義できず一意判定不可） | **TBD** | — |
| 050 | 更新内容の対象レコードの値が変更される（汎用スタブ＝C-018で概念被覆） | **excluded** | — |
| 051 | 更新内容の対象レコードの値が変更されない（汎用スタブ＝C-015で概念被覆） | **excluded** | — |
| 052 | 変更される（汎用スタブ） | **excluded** | — |
| 053 | 新規・更新の両方（dtb_product・内部注記・汎用） | **excluded** | — |
| 054 | 変更される（汎用スタブ） | **excluded** | — |
| 055 | 変更される（汎用スタブ・最大長） | **excluded** | — |
| 056 | 変更されない（汎用スタブ・最大長+1） | **excluded** | — |
| 057 | 変更される（汎用スタブ・最小長） | **excluded** | — |
| 058 | 変更されない（汎用スタブ・最小長-1） | **excluded** | — |
| 059 | 変更される（汎用スタブ） | **excluded** | — |
| 060 | 実行結果の対象レコードの値が変更される（汎用スタブ） | **excluded** | — |
| 061 | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する＋前提MSG-002（B8: 実行結果→メッセージ/画面遷移 行数上限） | bound | C-008 (shared) |
| 062 | 実行結果のファイル出力内容または取り込み結果が対象データと一致（汎用スタブ・前提MSG-003） | **excluded** | — |
| 063 | フォーマット定義でエラー表示されず継続（汎用スタブ・前提MSG-005＝phantom・観測対象未定義） | **excluded** | — |
| 064 | フォーマット定義でエラー表示され完了しない＋前提MSG-001（MSG-001到達経路がee実装のimport_file required+NotBlankと食い違い純UIで到達不能） | **TBD** | — |
| 065 | 実行結果のファイル出力内容が対象データと一致（汎用ファイルスタブ・前提MSG-004＝phantom） | **excluded** | — |
| 066 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 067 | 出力内容のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 068 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 069 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 070 | 同上（汎用ファイルスタブ） | **excluded** | — |
| 071 | 出力内容でエラー表示されず継続（汎用スタブ） | **excluded** | — |
| 072 | 削除の該当レコードが取得結果に含まれない（削除は本機能に非該当・B7） | **excluded** | — |
| 073 | 移動・リネームの該当レコードが取得結果に含まれない（非該当） | **excluded** | — |
| 074 | コピーのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 075 | ファイル登録のファイル出力内容が対象データと一致（汎用ファイルスタブ・アップロード成否はC-007で被覆） | **excluded** | — |
| 076 | ファイル出力のファイル出力内容が対象データと一致（出力は本機能に非該当） | **excluded** | — |
| 077 | JSONのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 078 | 同名ファイルのファイル出力内容が対象データと一致（非該当） | **excluded** | — |
| 079 | 入力JSONの対象レコードの値が変更されない（JSON非該当） | **excluded** | — |
| 080 | 配置先の該当レコードが取得結果に含まれる（非該当） | **excluded** | — |
| 081 | スキーマのファイル出力内容が対象データと一致（汎用ファイルスタブ・列未指定） | **excluded** | — |
| 082 | 更新時は既存の値を引き継ぎ、CSVからは変更しない（付帯情報引き継ぎ＝発送目安等CSV非反映列は既存値のまま・R2 Major1是正・B8: 初期行数→付帯情報引き継ぎ） | bound | C-022 |
| 083 | 取込直後の一覧表示は別画面の検索条件・キャッシュに依存する（条件依存で固定状態を定義できず一意判定不可） | **TBD** | — |
| 084 | 更新抑止のファイル出力内容が対象データと一致（汎用スタブ） | **excluded** | — |
| 085 | リダイレクト先で成功フラッシュ＋前提成功時出力（B8: 内部情報→取込成功） | bound | C-007 (shared) |
| 086 | リダイレクト先でエラーフラッシュ（複数可）＋前提失敗時出力（観点=排他制御だが期待はエラーフラッシュ。B8: 排他制御→取込失敗ロールバック） | bound | C-015 (shared) |
| 087 | 新規・更新の両方（ロールバック観点だが期待は内部DB注記・汎用） | **excluded** | — |
| 088 | 新規 INSERT もしくは UPDATE（dtb_product_class・内部DB注記・汎用。商品ID分岐の具体検証はC-018が担う） | **excluded** | — |
| 089 | 全削除差し替えに近い更新（物理全置換DELETE→INSERTは実装確認できるが dtb_product_category に行idが無く〔PK=product_id/category_id/base_info_id〕差分更新と区別する安定識別手段が無く一意判定不可） | **TBD** | — |
| 090 | 新規規格は常に、更新は価格変更時のみ（dtb_price_history登録条件＝具体的・検証可能。B8: 画面レイアウト→価格履歴） | bound | C-019 |
| 091 | 当機能が行う登録・更新で対象テーブルを直接保存（不要な削除は含まない）（内部DB注記・汎用） | **excluded** | — |
| 092 | 管理画面ファイアウォール内のルールに従い利用可能とみなす（管理者ログイン済み＝共通認証・documentation-only・B14） | **excluded** | — |
| 093 | リダイレクト先でトースト／アラート相当として表示される（フラッシュ表示機構・C-007/C-015/C-020のフラッシュ観測で概念被覆・汎用） | **excluded** | — |
| 094 | メッセージをフラッシュ（行単位のエラー・汎用エラーフラッシュ＝C-015で概念被覆） | **excluded** | — |
| 095 | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する＋前提MSG-002（B8: 一覧→メッセージ/画面遷移 行数上限） | bound | C-008 (shared) |
| 096 | 画面表示データでエラー表示されず継続（汎用スタブ・前提MSG-003） | **excluded** | — |
| 097 | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する（前提MSG-005＝phantom・有効MSG無しの汎用遷移＝C-020で概念被覆） | **excluded** | — |
| 098 | 画面表示データでエラー表示されず継続（前提MSG-001はエラーだが期待は「エラーなし継続」＝自己矛盾・汎用） | **excluded** | — |
| 099 | 母集合期待が「要ソース確認」プレースホルダ（前提MSG-004＝phantom・出所未確認・表示順の具体対象なし） | **excluded** | — |
| 100 | 情報ログ「グッズ・サプライ・情報商材CSV登録開始」（実在挙動だがログ観測手段未整備で一意固定不能・要実機・B15③） | **TBD** | — |
| 101 | ファイル選択のファイル出力内容が対象データと一致（汎用ファイルスタブ） | **excluded** | — |
| 102 | キー admin.product.product_goods_csv.page_count と ...page_no に保存する（B8: 非同期更新→ページネーション） | bound | C-005 |
| 103 | アップロード画面、フォーマット表、雛形ダウンロード、取込履歴が表示される（B8: エラー継続→画面表示） | bound | C-001 |
| 104 | 検証・取込後、常に GET …/product_goods_csv_upload へリダイレクトされフラッシュで成否が分かる（成功・失敗双方＝R2 Major2で-085から分離独立・B8: 公開コンテンツ→画面遷移） | bound | C-020 |
| 105 | csv_product_goods.twig は base_csv_upload.twig を継承する（Twig継承は観測不能。構成要素はC-001被覆・B15②/④） | **excluded** | — |
| 106 | ファイル選択でラベルにファイル名を表示（B8: データ正当性→JS挙動） | bound | C-003 (shared) |

`func_scope_check` 判定: 親106/106会計済み・欠落0・理由なし重複0。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD＝6件・Gate B15適用後）

| グループ | 母集合 | 件数 | 理由 |
|---|---|---:|---|
| pf/ee食い違い（ee刷新追加でpf現行に無い） | -013 | 1 | 母集合期待「更新対象商品の規格がちょうど1件でない→skipRow」（ee handler:222 product_class_count_invalid_for_update）はpf現行（pf handler onReadRow）に存在しない＝ee刷新で追加された挙動。区分宣言は現行挙動=pfのためeeオラクル化しない＝要仕様確認（pf現行のskipRowは新規商品コード重複 pf handler:187）（R4 Major1） |
| 条件依存で固定状態を定義できず一意判定不可（B1） | -049,-083 | 2 | 母集合期待「取込直後の一覧表示は別画面の検索条件・キャッシュに依存する」（pf-md:173）は条件依存であり固定した検索条件・キャッシュ状態が無い。1回の実行でpass/failを一意判定できず要仕様確認（固定条件を定義できれば将来bound可）（R2 Major3） |
| pf/design がee実装と食い違い純UI到達不能（B1/B3） | -064 | 1 | 母集合前提MSG-001「CSVのフォーマットが一致しません」（admin.common.csv_invalid_format）はGoodsCsvController の file===null 分岐だが、import_file は required＋NotBlank のためファイル未選択送信は先行するフォーム不正分岐でNotBlank検証メッセージを出して終了し当分岐へ到達しない＝純UIでMSG-001到達不能。実際に出る検証メッセージの確定は要実機（R2 Major4） |
| 物理全置換の安定識別手段が無い（B9） | -089 | 1 | カテゴリ更新はDELETE→INSERTの物理全置換（ProductRepository:1754,1797）だが、dtb_product_categoryに行idが無く（PK=product_id/category_id/base_info_id・Entity ProductCategory）差分更新と外部観測で区別する安定識別手段が無い＝物理全置換の主張を一意判定できず要実機/仕様確認（最終集合一致のみに限定するなら別要件・R4 Major2） |
| 実在挙動だがログ観測手段未整備（B15③） | -100 | 1 | 情報ログ「グッズ・サプライ・情報商材CSV登録開始」（pf-md:78,287・L1-021）は実在するがログ観測手段が現行ハーネスで未整備＝画面/履歴で検知できず一意固定不能・要実機／ログ観測整備 |

（合計 1+2+1+1+1 = 6）

### 9.2 要実機（実行面の保留）

| 事項 | 状態 |
|---|---|
| 取込CSV fixtureの実バイト内容（文字コード・改行・列順・5010境界・カテゴリ許容集合・センチネル行・価格値P0/P1/S0/S1・言語L・発送目安D0/D1） | fixture manifest（D5型）未整備＝要実機（SEED-M0327-*） |
| L1-011（価格整合）・L1-012（廃止時在庫）・スマレジ連携 | 実挙動だが母集合に固有一意判定行が無い（相関/DB相関観点行の前提は汎用ノイズ）＝documentation-only。廃止時在庫のEC-CUBE在庫は在庫SEEDで再現可だがスマレジ在庫照会・スマレジ連携の実観測は外部連携＝要実機（0204:グッズ商品CSV登録!D87,D105-D119・pf-md:152,164） |
| -064 ファイル未選択時の実表示メッセージ（NotBlank検証文言）・-049/-083 固定可能な検索条件/キャッシュ状態 | ee実機で確定要（TBD） |
| L1-解決器・取込結果アサートヘルパ（フラッシュ集合差分）・SEED manifest契約 | M0成果物（D8/D9/D5型）として未実装 |
| L1-019/020/021（一時ファイル・排他制御・取込開始ログ）の実機検証手段 | 母集合に固有要求行が無い／ログ観測手段未整備＝documentation-only |

### 9.3 excluded＝84件（すべてtsv非出力）

| カテゴリ | 母集合 | 根拠 |
|---|---|---|
| **【B15②/④】Twig継承（観測不能・C-001被覆）** | -003,-105 | テンプレート継承そのものは外部IF（画面/DOM/APIレスポンス）で判定不能。継承が生む画面構成要素は既にC-001が同一操作で被覆済み |
| **【B7/B15】汎用検索スタブ（非該当観点）** | -020〜-033 | 本機能は検索を行わず選択CSVをアップロード取込（集計条件pf-md:91・観点テンプレ機械生成） |
| **【B15②】汎用「実行結果/出力内容が含まれる/一致」スタブ** | -034,-035,-036,-037,-048,-060,-062,-065,-066,-067,-068,-069,-070,-084,-101 | 一致基準（どの列がどの値か）を母集合行が持たず内容空虚 |
| **【B15②/④】汎用「登録内容/更新内容が追加/変更される・されない」スタブ（C-007/C-015/C-018で被覆）** | -038,-039,-040,-042,-043,-044,-045,-046,-047,-050,-051,-052,-054,-055,-056,-057,-058,-059 | 対象レコード・具体値を母集合が指定せず内容空虚。取込の成功反映（新規C-007・更新C-018）・失敗ロールバック（C-015）で概念被覆済みの冗長スタブ |
| **【B15②/③】「エラー表示されず継続」（観測対象未定義）・必須validationの自己矛盾** | -010,-011,-014,-015,-017,-063,-071,-096,-098 | 「エラー表示されず継続」の観測対象が無い（-011=発送日目安任意/未反映・-014=付帯情報前提だが期待は汎用・-098=前提MSG-001と期待「継続」が自己矛盾）。**-010は必須バリデーションを任意列「規格画像」で要求する自己矛盾**（必須欠落→中断の実挙動はC-015が代表） |
| **【B15②】汎用相関/DB相関スタブ（前提が汎用ノイズ・特定バリデーションへ読み替え禁止）** | -016,-018 | 「○○バリデーションでエラー表示され完了しない」の前提が汎用ノイズ（-016=取込履歴・-018=失敗時出力）で価格整合/廃止時在庫等の具体対象を名指さず＝固有一意対応不成立。価格整合(L1-011)・廃止時在庫(L1-012)はdocumentation-only（§9.2） |
| **【B7】ファイル/レコード操作系（非該当）** | -072,-073,-074,-075,-076,-077,-078,-079,-080,-081 | 削除/移動/コピー/ファイル登録/ファイル出力/JSON/同名/入力JSON/配置先/スキーマ。取込機能に該当なし |
| **【B15②】内部DB/フォームキー注記スタブ** | -007,-019,-041,-053,-087,-088,-091 | 「import_fileフォームキー」「新規/更新の両方」「INSERT/UPDATE分岐」「全削除差し替え(汎用)」「対象テーブルを直接保存」等はDBカラム/内部処理/フォーム内部の設計注記で単一の観測可能挙動でない（INSERT/UPDATE分岐の具体検証はC-018が担う。全削除差し替えの物理全置換は行id不在で識別不能＝-089 TBD） |
| **【B15②】フラッシュ表示機構/共通認証（被覆済み/共通）** | -092,-093,-094,-097 | -092=共通認証（documentation-only・B14）／-093=フラッシュのトースト表示機構（C-007/C-015/C-020で概念被覆）／-094=行単位エラーのフラッシュ（C-015で概念被覆）／-097=前提MSG-005（phantom）の汎用遷移（C-020で概念被覆） |
| **【B15③】自己矛盾/プレースホルダ/矛盾スタブ** | -001,-002,-099 | -001「出力失敗」（取込機能に非該当＋汎用）／-002 CSRF失敗の固有挙動が一次資料に定義なし／-099「要ソース確認」（前提MSG-004＝phantom・出所未確認のプレースホルダ） |

## §10 特記事項（片側断定せず記録）

1. **取込パターンの検証設計**: 取込結果はフラッシュ＋取込履歴テーブルを画面で目視するのが主。取込値のDB反映は対象商品を再表示して確認（B9）。DB直接参照は外部IFで検知不能な事実（ロールバック非書込み・カテゴリ全置換DELETE→INSERT・価格履歴増分・規格言語列・発送目安非更新）に限定し、成功系の反映値・履歴増減は画面のみで判定（トートロジー禁止）。
2. **正直分類の帰結**: 真のboundは18件（16候補ケース）。TBDは実在するが観測/固定不能な4件（-049/-083 一覧整合固定不能・-064 MSG-001到達経路食い違い・-100 ログ観測未整備）。excluded84。会計＝bound18／TBD4／excluded84。
3. **codex Gate C R2 是正（Major6件を全反映・2026-07-29・ee実ソース照合）**:
   - **Major1（更新系3件の過剰exclude）**: -009 言語ID保存（C-021・L1-025・pf-md:136／handler:605）・-082 付帯情報引き継ぎ（C-022・L1-026・発送目安非更新 pf-md:149／handler未マップ）・-089 カテゴリ全置換（C-023・L1-024・pf-md:204／ProductRepository::replaceProductCategories=deleteAllProductCategories→insertProductCategories）をboundへ。-089はB9のDB直接参照（全DELETE→INSERT）。
   - **Major2（B12異期待の強制共有）**: -085「成功フラッシュ」（C-007）と-104「成功・失敗双方で常にリダイレクト」（GoodsCsvController の form不正分岐・file===null分岐・maxrows分岐・成功/異常分岐が全て同一redirectへ収束）は別要件。-104を独立候補C-020（成功CSVと失敗CSVの2送信で双方302リダイレクトを検証＝失敗経路も実行）へ分離。
   - **Major3（C-017のB1一意判定不可）**: -049/-083「一覧整合は検索条件・キャッシュ依存」（pf-md:173）は固定状態が無く一意判定不可→TBD。C-017廃止（L1-018はdocumentation-only）。
   - **Major4（C-009 MSG-001純UI到達不能）**: import_file は required＋NotBlank（CsvImportType.php）。ファイル未選択送信は `if(!$form->isValid())` のフォーム不正分岐（GoodsCsvController.php:141）でNotBlank検証メッセージを出して終了し、後段の `file===null`→admin.common.csv_invalid_format 分岐（:149）へ到達しない。よってMSG-001は純UIで到達不能→-064 TBD。C-009廃止。
   - **Major5（C-019 販売価格の逆転）**: セールフラグOFFの規格更新および新規登録では販売価格(price02)にCSVの販売価格でなくCSVの**基準価格**が反映される（Excel識別ID25「基準価格の値を『販売価格』『基準価格』に反映」0204:E100／handler `if($saleFlg===0){$sellPrice=$standardPrice;}`）。C-019をCSV販売価格S1≠CSV基準価格P1として販売価格＝P1（基準価格）反映を検証するよう是正。L1-022に明記。
   - **Major6（en一次資料の事実認定誤り）**: 旧版「ee messages.*.yaml不在・全LS=0」は誤り（docs repo内のみ検索した誤認）。ee `messages.en.yaml` 実在をgrep確認しMSG-001/MSG-003・画面タイトル・フォーマット/雛形ラベルのen逐語を§5に復旧・当該L1(001/002/007/009)をLS=1へ。MSG-002(maxrecord)はen.yaml不在＝英訳なしLS=0を確認。
   - 会計変化: bound18（不変・+3〔009/082/089〕−2〔049/083→TBD〕−1〔064→TBD〕・-104はC-007共有から独立へ）／TBD1→4／excluded87→84／候補16。
4a. **codex Gate C R3 是正（Major5件を全反映・2026-07-29・ee/pf実ソース照合）**（会計は不変 bound18/TBD4/excluded84・候補16。L1 26→27・source_class excel2→excel4）:
   - **Major1（source_class純度・1claim1source）**: L1-022が pf INSERT/UPDATE と Excel「販売価格=基準価格」を混在させていた→**分割**。L1-022=pf INSERT/UPDATE分岐（pf-fallback・pf-md:134,82）／**L1-027新設**=セールOFF販売価格=基準価格（excel・0204:E100逐語）。L1-023=価格履歴条件を **excel**（0204:D137,D138逐語「販売／買取価格/基準価格が変更された場合のみ／新規は常に」）へ再出典（pf現行 handler:552は販売/買取のみ＝刷新後は基準価格追加のExcelカスタマイズ）。**L1-025**=pf-md:136「CSV言語IDを保存」は現行挙動と不一致→pf handler:509「$languageId = MtbLanguage::JP_ID //グッズ一律日本語」に基づき**言語一律JP_ID固定**へ是正（pf-fallback・source=pf-handler:509）。excel=L1-004/012/023/027の4件。
   - **Major2（C-021/C-022の層分離逆転）**: 規格の言語は商品規格一覧Twig:54,74・規格編集Twig:297で**画面表示される**→C-021を**画面期待**（規格再表示で言語=日本語）へ是正しDB主検証を除去。逆に発送目安は規格一覧・編集Twigに表示列が無く**画面観測不能**→C-022は画面期待=成功フラッシュのみとし発送目安非更新は**DB内部検証**（B9意図しない更新の検出）に限定。
   - **Major3（C-023物理全置換の証明）**: 最終集合一致だけでは差分更新と区別できず物理全置換を検知できない→SEEDに**旧A/共通Kが新Cの祖先でない**ことを固定し、**共通Kのdtb_product_category行idが取込前後で変化**（DELETE→再INSERT・ProductRepository:1754,1797）を内部検証に追加して物理全置換を一意識別。最終集合（新C・共通K・旧A外れ）は画面でも確認。
   - **Major4（C-020のHTTP混入）**: -104独立化は妥当だが主期待に正確なHTTP302/GET先を残し内部列と重複していた→**主期待は遷移後画面（アップロード画面再表示）とフラッシュ**、**HTTP302と正確URLは自動検証(内部)列のみ**へ分離（B6）。
   - **Major5（L1-002 en復旧未完）**: §5に `admin.common.csv_upload`=「Upload a CSV file」（en:1804・base_csv_upload.twig:74）と `admin.common.required`=「Required」（en:1785・同:101 必須バッジ）を追加（両キーともTwig trans描画・en実行オラクル復旧）。
4b. **codex Gate C R4 是正（Major4件を全反映・2026-07-29・ee/pf実ソース照合）**（会計変化: bound18→16・TBD4→6・excluded84不変・候補16→14・L1 27不変・source_class excel4→5）:
   - **Major1（source_class純度/帰属・3点）**: (a)**L1-025を excel へ**＝Excel D136「商品規格／商品規格サブを一律NM規格、日本語固定で登録・更新する」が最優先明記（pf handler:509 JP_ID固定はこれに整合）。(b)**L1-015是正＋-013 TBD**＝「更新対象規格≠1→skipRow」はpf現行（pf handler onReadRow）に存在せずee刷新追加（ee handler:222）＝pf/ee食い違いでeeオラクル化しない→C-014廃止・L1-015はpf実在のskipRow（新規商品コード重複 pf handler:187）へ是正（母集合固有行無くdocumentation-only）。(c)**L1-016是正**＝pf CsvImporter:272 `$isSuccessful = messageStore->count()===0 || !$hasBreak` によりエラーがあっても breakAll未発生ならコミット→「エラー配列があればロールバック」の過剰主張を撤回しロールバック=breakAll発生時のみへ是正。C-015の入力を breakAll誘発（商品ID不存在 SEED-M0327-BADPRODUCTID）へ変更。excel源=L1-004/012/023/025/027の5件。
   - **Major2（C-023全置換識別子が捏造→-089 TBD）**: dtb_product_category は行idが無く主キー=product_id/category_id/base_info_id（Entity ProductCategory・ProductRepository:1797）。「共通K行id変化」は実行不能で物理全置換を識別できない＝安定識別手段が無いため**-089 TBD**（物理全置換の主張を撤回）。C-023廃止。
   - **Major3（B6/B10 画面/内部分離）**: DB副作用・session・HTTPステータス・履歴増分を全て自動検証(内部)列へ、画面期待は遷移後の画面/フラッシュに限定・操作手順は純UIへ是正。C-005（session→内部・画面は履歴表示件数）／C-007/C-015/C-018（HTTP302→内部・画面は再表示＋フラッシュ）／C-019（価格履歴増分→内部・画面は価格反映）／C-022（発送目安D0不変→内部・画面はフラッシュのみ）／§6のC-021 DB検証削除（言語は画面表示）。
   - **Major4（en復旧未完）**: L1-002描画キーをbase_csv_upload.twig/csv_import_history.twig全grepし§5へ追加＝`admin.common.count`「%count% items」(en:1792)・`admin.common.search_no_result`（en実在）に加え、`csv_item_name`/`csv_description`/`browse`/`csv_import_error`/`csv_import_history_title`/`_filename`/`_upload_date`/`_operator` は**messages.en.yamlに不在＝英訳なし**をgrep結果として明記（en-grep結果と「英訳なし」の記録）。
4. **確認モーダルのExcel逆転**: 母集合-005「送信前の確認ダイアログはない」（pf現行md:49）はExcel識別ID2「押下後、確認モーダルを表示」（0204:AG147）が刷新後の正で上書き＝陳腐化。観測対象（確認モーダルの有無）は不変（B8: 出力抑止→モーダル）。codex R1/R2ともMajorなし（維持）。
5. **カテゴリ物理全置換はTBD（R4 Major2）**: -089の実装はreplaceProductCategories＝deleteAllProductCategories→insertProductCategories（ProductRepository:1754,1797）で物理全置換だが、dtb_product_categoryに行idが無く（PK=product_id/category_id/base_info_id）差分更新と外部観測で区別する安定識別手段が無いため物理全置換を一意判定できず-089 TBD（C-023撤回）。最終カテゴリ集合の反映自体は商品編集画面で観測できるが、それだけでは-089の「全削除差し替え」を証明できない。
6. **B12/1実行1判定**: B12共有は完全重複・同一実行（C-003←004/106・C-008←061/095）に限定。-104は-085と別要件のため共有せず独立（C-020）。MSG-002はL1でテンプレート保持・実行期待は根拠ある置換後実値「5010 行を超えるCSVファイルは登録できません。」（%maxRecord%＝定数5010・pf-md:77）へ解決。

## 観点補正（母集合ラベル誤りの是正・concretized派生ビューのみ／母集合all_it_casesは不変）

母集合の観点ラベルが期待テキスト実内容と不一致の bound行を、派生ビュー(concretized.tsv)で正しい観点へ是正する。母集合(all_it_cases.tsv)自体は変更しない（テストID・行は1:1維持）。emit_concretized_tsv.py が本表を読み適用。詳細根拠は§8.1。
**本正準表のNNN集合は§8.1と完全一致する（16件）。**

| 母集合末尾 | 正しい観点 | 根拠（母集合の期待テキストが観点と不一致） |
|---|---|---|
| 004 | JS挙動 | 期待「ファイル選択でラベルにファイル名を表示」（L1-003）。母集合ラベル「対象データ」は誤り |
| 005 | モーダル | 期待「アップロードボタン押下後に確認モーダルを表示」（L1-004・Excel最優先。母集合期待「ダイアログなし」は陳腐化pf現行値）。母集合ラベル「出力抑止」は誤り |
| 006 | カテゴリ選択検証 | 期待「サプライ・グッズ・予約グッズ・情報商材系のカテゴリID制限選択検証」（L1-013）。母集合ラベル「識別子」は誤り |
| 008 | 取込成功（更新） | 期待「値があるとき既存商品UPDATE」（L1-022）。母集合ラベル「確認ダイアログ」は誤り |
| 009 | 言語（日本語固定） | 期待「規格の言語に保存」（実挙動は一律JP_ID固定・L1-025）。母集合ラベル「HTTPステータス」は誤り |
| 012 | 存在検証 | 期待「エラーメッセージを積み breakAll」＋前提「更新対象の商品IDが存在しない」（L1-014）。母集合ラベル「文字列長バリデーション」は誤り |
| 061 | メッセージ/画面遷移 | 期待「グッズ商品CSV登録画面に遷移」＋前提MSG-002 行数上限（L1-008）。母集合ラベル「実行結果」は誤り |
| 082 | 付帯情報引き継ぎ | 期待「更新時は既存の値を引き継ぎ、CSVからは変更しない」（L1-026）。母集合ラベル「初期行数」は誤り |
| 085 | 取込成功 | 期待「リダイレクト先で成功フラッシュ」（L1-007）。母集合ラベル「内部情報」は誤り |
| 086 | 取込失敗ロールバック | 期待「リダイレクト先でエラーフラッシュ（複数可）」（L1-016）。母集合ラベル「排他制御」は誤り |
| 090 | 価格履歴 | 期待「新規規格は常に、更新は価格変更時のみ」（L1-023）。母集合ラベル「画面レイアウト」は誤り |
| 095 | メッセージ/画面遷移 | 期待「グッズ商品CSV登録画面に遷移」＋前提MSG-002 行数上限（L1-008）。母集合ラベル「一覧」は誤り |
| 102 | ページネーション | 期待「キー admin.product.product_goods_csv.page_count と ...page_no に保存する」（L1-005）。母集合ラベル「非同期更新」は誤り |
| 103 | 画面表示 | 期待「アップロード画面、フォーマット表、雛形ダウンロード、取込履歴が表示される」（L1-001）。母集合ラベル「エラー継続」は誤り |
| 104 | 画面遷移 | 期待「検証・取込後、常にGET…へリダイレクトされフラッシュで成否が分かる（成功・失敗双方）」（L1-006）。母集合ラベル「公開コンテンツ」は誤り |
| 106 | JS挙動 | 期待「ファイル選択でラベルにファイル名を表示」（L1-003）。母集合ラベル「データ正当性」は誤り |
