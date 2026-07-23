# W2候補: m03-11 カテゴリ登録・編集 — 実行可能グレード候補（母集合78全量踏破・excel-primary係数実測）

> 2026-07-23 ／ **候補グレード（candidate・D6前）・excel-primary（区分=カスタマイズ）**／
> W2バッチ1号（excel-primary 366機能側の係数実測用）。
> **改訂1: codexレビューR1是正（Blocker2＋Major2）＋ユーザー方針裁定（Interpretation A・規約リテラル）**＝
> (1) **画像仕様をExcel確定へ是正**: 0204:6285,6287の取り消し線は `<span class="cell-strike">` として
> **HTML内に残存**（初回の「書式喪失で矛盾」は本候補の抽出ミス＝タグ剥がしでclass情報を落とした誤読。
> 撤回・訂正）。取り消されているのは「※この画面からの画像アップロードは実施しない。」で、
> **有効な活字要求＝「※この画面からの画像アップロード、削除、変更を実施可能とする」**。
> L1-042をHUMAN_DECISIONからExcel確定claimへ変更し、pf由来の「新規のみ・編集差し替え不可」
> （L1-005/006/023・C-008・C-086）をExcel優先で再具体化（pf側記述はsuperseded退避）。
> (2) **ee出典の付け替え**: L1-009/011/027のsource欄からee `eccube.yaml` 参照を除去しpf md確認値
> （md:120,128,105＋確認値規定md:130）のみへ（値255/3000/5は維持＝ユーザー方針）。
> **ユーザー方針（Interpretation A）**: カスタマイズ機能でExcelが制約値を空欄「-」にしている項目は
> pf現行回帰＝pf mdの値を踏襲値としてboundしてよい（TBDにしない）。pf mdが「eeで実在確認」と
> 述べる記載（md:19-33,195-199等）も**規約リテラルにpf md出典のpf現行回帰として許容**（ee実ソース
> 自体はL1のsource/quoteに一切使わない＝照合補助のみ）。
> **★指示前提の訂正（実測・捏造ゼロ）**: 指示は「Excel設計書は `excel_to_html/output` に無く未整備」
> としていたが、**実測では存在する**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` の
> sheet-25「カテゴリ登録」（**行6182〜6480・機能No=M03-11 明記〔0204:6195〕・更新日2025-09-15〔0204:6194〕**）が
> M03-11のExcel基本設計そのもの（カスタマイズ説明・処理概要★・画面項目一覧 識別ID1〜22を含む）。
> よって本書は規約①どおり **Excelを最優先の一次資料に使い（source_class=excel）**、
> Excelが沈黙する箇所（必須・最大長・初期値は画面項目一覧で全て「-」＝0204:6297-6321）のみ
> **pf現行md回帰（source_class=pf-fallback）** とした。画像アップロード可否（0204:6285,6287）は
> **取り消し線が `<span class="cell-strike">` としてHTML内に残存しており有効要求が一意に確定**
> （改訂1で初回の「書式喪失・矛盾」の誤読を撤回。TBD:要Excel設計書=0件・§9）。
> **ee実ソース（CategoryController.php等）はオラクル基盤に使用していない**（standard-src付与ゼロ。
> ee由来はfid_kubun規約上の共有インフラ＝locale yaml/vendor xlf の逐語引用のみ。
> ee `eccube.yaml` 参照は改訂1でL1のsource欄から除去＝値の正はpf md確認値。§0に列挙）。
> O5未確定・source_class=excel/pf-fallback は fid_kubun.tsv（D1）区分「カスタマイズ・
> excel-primary+pf-fallback」による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`＋codex承認済み候補
> `m09-01_…_executable_draft.md`／`m05-16_…`／`m10-11_…`（同型）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m03-11_admin_product_product_category_register_edit_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **行数集計**: 候補ケース行総数**48**＝bound対応35＋補完10＋-EN 3（bound親従属3）。
> 母集合78全数会計＝bound 59／TBD 1／excluded 18（§8）。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**:
  `excel_to_html/output/0204_基本設計仕様書(商品管理).html`（最終コミット **0e65e6a**）
  sheet-25「カテゴリ登録」＝**行6182〜6480**。機能No=M03-11（0204:6195）・機能名カテゴリ登録（0204:6196）・
  作成2025-06-03/更新2025-09-15（0204:6192,6194）。以下「0204:行」。
  同sheet後半（0204:6364-6476）は pf現行mdの埋込複製（`Source: functions/pf-eccube3/…` と自己申告
  =0204:6364）のため、**当該範囲は引用元をpf mdの行で表記**し二重ソース化しない。
- **pf現行md（回帰先・source_class=pf-fallback）**:
  `functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md`
  （最終コミット **8e4e5de**＝リポジトリHEAD観測値 8e4e5de／branch feat/front-e2e-coverage・2026-07-23観測。
  以下「md:行」）。区分宣言「本機能のカスタマイズ区分はカスタマイズである」（md:9）。
- fid_kubun.tsv（D1・SHA先頭 **44fbf02f1e4c**）行178:
  `M03-11｜カテゴリ登録/編集｜対象｜カスタマイズ｜pf-eccube3/m03-11_…md｜excel-primary+pf-fallback｜区分不明=0`
  → **excel優先・不足subjectのみpf回帰。standard-src禁止**（暫定付与・確定はD6）。
- 共有インフラ（メッセージ実文言の逐語引用のみ許可＝W2指示の明文）:
  ee `/home/y-saito/Developments/ec-cube-enterprise` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51` の
  `src/Eccube/Resource/locale/messages.{ja,en}.yaml`・`validators.{ja,en}.yaml`・
  `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`。
  **キー同定はpf md記載のキー名（`admin.common.save_complete`＝md:82）と ja文言の完全一致検索のみで行い、
  ee実装コード（Controller/Form/twig）を鍵特定にも期待値にも使っていない**。
- **方針注記（ユーザー裁定・Interpretation A＝規約リテラル）**: カスタマイズ機能でExcelが制約値を
  空欄「-」にしている項目（必須・最大長・初期値等）は、**pf現行回帰＝pf md（`functions/pf-eccube3/`）
  の値を踏襲値としてboundしてよい**（TBDにしない）。値255/3000/nest5/HTTP400等はpf md確認値を採用。
  **ee実ソース（CategoryController/CategoryType/Category.php・ee設定ファイル）はL1のsource_file/quoteに
  一切使わない**（照合補助のみ。位置情報が必要な場合もnotesに「ee照合補助」と書くに留める）。
  pf md自身が「移行先eeで実在確認」と述べる記載（md:19-33,195-199等）も、規約リテラルに
  **pf md出典のpf現行回帰として許容**する（codex R1のee-laundering指摘に対するユーザー裁定）。
- 照合補助（参考のみ・**L1根拠に不使用**）: ee `app/config/eccube/packages/eccube.yaml` の値一致を
  参考確認したが、改訂1でL1のsource欄から全て除去した。値の正はpf mdの確認値
  （「最大長の数値は `app/config/eccube/packages/eccube.yaml` の確認値を記載する」＝md:130の規定に
  基づくmd:105,120,128の確認値255/3000/5）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA先頭 **7911f190d273**）M03-11全**78行**
  （IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-001〜078。以下「-nnn」）。
  実行方法内訳: Playwright 47／Playwright+手動確認 28／手動 1（-065）／非UI 2（-004,-005）。
- **判定原則（W0教訓1）**: 観点ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全78行の期待要旨を併記し極性も期待テキストで確認）。
- スコープ宣言（pf md）: 本機能=フォーム送信の新規作成・更新とGETフォーム表示に限定。
  「一覧のドラッグ並べ替え、削除、カテゴリ CSV のストリーム出力、CSV 取込・一括アップロード画面の
  導線の業務定義の全部は本書では正としない」（md:11）／一覧・並べ替え・削除・CSVは
  `m03-45_admin_product_product_category_list.md` が正（md:13）。Excel sheet-25の並べ替えアラート
  （0204:6267-6268）・削除ポップアップ（0204:6319）は**m03-45スコープ＝本候補では claim しない**。

## §1 L1原子オラクル表

全43claim。**source_class列は excel／pf-fallback のみ（standard-src該当なし・design該当なし。
改訂1: L1-023はsuperseded_by excel=期待値根拠に使用しない現行記録・ee `eccube.yaml` 参照は
source欄から全除去）**。
unitは文字＝コードポイント前提（境界値runFillの生成単位。DB段差検証はC-042系のchar_length照会）。
en文言はen一次資料（en yaml／en xlf）逐語のみ。ja翻訳による生成ゼロ。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0311-001 | nav | 親を選んだ子一覧 `GET /{admin_route}/product/category/{parent_id}` で上部に新規用フォーム（子カテゴリ作成）。送信先はPOST同パス | 「親を選んだ子一覧 \| `GET /{admin_route}/product/category/{parent_id}` \| 上部に新規用フォーム（子カテゴリ作成）。送信先は `POST` の同パス。」／Excel識別ID22「子カテゴリ作成 \| ボタン \| …フォームの各入力、選択内容を保存する」 | md:41,298／0204:6321 | pf-fallback（ボタン実在はexcel併記） | 0 |
| L1-M0311-002 | nav | 編集 `GET /{admin_route}/product/category/{id}/edit` で上部に編集用フォーム。送信先はPOST同パス | 「行の編集アイコン \| `GET /{admin_route}/product/category/{id}/edit` \| 上部に編集用フォーム。送信先は `POST` の同パス。」 | md:42,299 | pf-fallback | 0 |
| L1-M0311-003 | nav | 新規保存成功→HTTP302で `GET …/category/{parent_id}` へリダイレクト | 「検証と画像処理のあと保存し、成功なら `GET …/category/{parent_id}` へリダイレクトする。」「HTTP 302 で `GET …/category/{parent_id}` へ遷移する。」 | md:43,83,227 | pf-fallback | 0 |
| L1-M0311-004 | nav | 更新保存成功→親ありは `GET …/category/{parent_id}`・親null（ルート）は `GET …/product/category` へリダイレクト | 「検証後保存し、成功なら親がいれば `GET …/category/{parent_id}`、ルートカテゴリなら `GET …/product/category` へリダイレクトする。」 | md:44,90,228-229 | pf-fallback | 0 |
| L1-M0311-005 | display_field | 親がいる一覧または編集モードでカード内にフォーム: 日本語名・英語名・フロント非表/支店非表示の2チェック・埋め込みHTML日英（textarea行数6）・検索パラメータ一行テキスト・バナー/アイコン画像2種の操作領域（**新規・編集とも＝Excel確定のL1-042が適用範囲を規定。現行pfの「新規のみ」はsuperseded**。新規側のUI部品=隠しfile＋ドロップゾーン＋プレビューは現行踏襲・編集側の部品具体はExcel未規定=要実機）。変換ボタンja「子カテゴリ作成」/「カテゴリ更新」（**en文言はTBD＝§9**） | 「親がいる一覧または編集モードのとき、カード内にフォーム。日本語名・英語名、フロント非表・支店非表示の 2 チェック、埋め込み HTML（日・英）の複数行テキスト（行数 6）、検索パラメーターの一行テキスト。新規のみバナー・アイコンの隠し file とドロップゾーン・プレビュー。…変換ボタンは「子カテゴリ作成」または「カテゴリ更新」のいずれか。」（画像適用範囲はL1-042のExcel逐語が上書き） | md:52／0204:6304-6316（項目実在）／0204:6285,6287（適用範囲） | pf-fallback（画像適用範囲のみexcel） | 1(en=TBD) |
| L1-M0311-006 | behavior | 画像アップロードUIの挙動（現行踏襲・新規フォームで確認済みの部品）: バナー・アイコン各々で file change・ドロップゾーンdragover/drop・クリックで隠しfileを開く・プレビューimg。クライアント側MIME `image/`＋拡張子gif/jpg/jpeg/pngのみ通す。**「新規時のみ」の限定はExcel確定のL1-042（新規・編集とも可）がsuperseded＝適用範囲の期待値根拠に使わない**（編集側UI部品の具体はExcel未規定=要実機） | 「新規時のみ、バナー・アイコンそれぞれで file の change、ドロップゾーンの dragover／drop、クリックで隠し file を開く、プレビュー img。クライアント側で MIME が `image/` かつ拡張子が gif／jpg／jpeg／png のみ通す。」（適用範囲はL1-042が上書き） | md:53／0204:6285,6287（適用範囲） | pf-fallback（適用範囲のみexcel） | 0 |
| L1-M0311-007 | display_field | 登録・編集フォーム自体はモーダルにしない | 「モーダル・ポップアップ \| 登録・編集フォーム自体はモーダルにしない。」 | md:55 | pf-fallback | 0 |
| L1-M0311-008 | display_field | ルート直下一覧のみ（親null＝`GET …/product/category`）では登録フォームカードは出ない | 「ルート直下一覧のみ（親 null） \| 登録フォームカードは出ない。新規 POST は `admin_product_category` にはマップされない。」 | md:136 | pf-fallback | 0 |
| L1-M0311-009 | validation | カテゴリ名（日）必須: `NotBlank`＋`Length`（`eccube_stext_len` 確認値255）。保存先 `dtb_category.category_name`・キー `name` | 「カテゴリ名（日） \| 必須 \| `eccube_stext_len`（確認値 255、`NotBlank` と `Length`） \| 新規は空、編集は DB の `category_name` \| `dtb_category.category_name`。キー `name`。」 | md:120,207,130 | pf-fallback（Excelは必須・最大値とも「-」=0204:6304。踏襲値bound=ユーザー方針Interpretation A） | 0 |
| L1-M0311-010 | validation | カテゴリ名（英）任意: `Length`のみ（255・未入力可）。保存先 `dtb_category.category_name_en` | 「カテゴリ名（英） \| 任意 \| `eccube_stext_len`（確認値 255、`Length` のみ） \| …」「カテゴリ名（英） \| `Length` のみ（未入力可）。」 | md:121,208（0204:6305は「-」） | pf-fallback | 0 |
| L1-M0311-011 | validation | 検索パラメーター任意: `Length`（`eccube_ltext_len` 確認値3000）。保存先 `dtb_category.search_parameters` | 「検索パラメーター \| 任意 \| `eccube_ltext_len`（確認値 3000、`Length`） \| …」「検索パラメーター \| `Length`（`eccube_ltext_len`）。」 | md:128,209,130 | pf-fallback（Excel 0204:6315は書式「半角英数記号」のみ・長さ「-」。踏襲値bound=ユーザー方針Interpretation A） | 0 |
| L1-M0311-012 | validation | フロント非表フラグ・支店非表示フラグは任意のチェック（論理値）・初期値DB現在値。保存先 `front_search_hide_flg`／`branch_hide_flg` | 「フロント非表フラグ \| 任意 \| チェック（論理値） \| DB 現在値 \| `dtb_category.front_search_hide_flg`…」「支店非表示フラグ \| 任意 \| チェック（論理値） \| DB 現在値 \| `dtb_category.branch_hide_flg`…」 | md:122-123／0204:6307-6308（数値(0,1)） | pf-fallback | 0 |
| L1-M0311-013 | validation | 埋め込みHTML（日・英）はFormに `Length` なし・DBはTEXT。保存先 `html_ja`／`html_en`・textarea行数6 | 「埋め込みHTML（日） \| 任意 \| フォームに Symfony `Length` なし。DB は TEXT \| … \| `dtb_category.html_ja`。textarea 行数 6。」（英同上=md:127） | md:126-127 | pf-fallback | 0 |
| L1-M0311-014 | validation | バナー・アイコン画像の検証規則（踏襲値）: Symfony `Image` 最大10M・MIME jpeg/png/gif＋サーバ側で `image/` 接頭MIMEと拡張子gif/jpg/jpeg/png・移動/ディレクトリ作成成否を検証（**適用範囲=新規・編集ともL1-042準拠**。pf md記載の「新規のみ」限定はsuperseded） | 「画像ファイル。Symfony `Image` で最大サイズ 10M、MIME jpeg／png／gif。サーバ側で `image/` 接頭 MIME と拡張子 gif／jpg／jpeg／png」「バナー・アイコン（新規） \| Symfony `Image` に加え、サーバで MIME 接頭と拡張子、移動・ディレクトリ作成の成否。」 | md:124,210 | pf-fallback | 0 |
| L1-M0311-015 | message | 保存成功フラッシュ ja「保存しました」／en "Saved"（キー `admin.common.save_complete`＝pf md明記。**pf md表示メッセージ表のen列「保存しました」はen yamlと不一致＝齟齬記録・§10**） | `成功フラッシュ admin.common.save_complete`／`admin.common.save_complete: 保存しました`／`admin.common.save_complete: Saved` | md:82,169／messages.ja.yaml:1591／messages.en.yaml:1636 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0311-016 | message | 必須未入力（MSG-010）ja「入力されていません。」／en "No value found."（**pf md en列 "This value should not be blank." はen yamlと不一致＝齟齬記録・§10**）。表示位置=入力項目直下・当画面に留まる | 「M03-11-MSG-010 \| 入力項目直下 \| 入力されていません。…必須項目が未入力のまま送信したとき \| …登録・編集画面に留まる」／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | md:176／validators.ja.yaml:17／validators.en.yaml:17 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0311-017 | message | 最大長超過（MSG-011）ja「長すぎます。この値は{{ limit }}文字以下で入力してください。」（limit=255/3000解決）／en "This value is too long. It should have {{ limit }} characters or less."（limit>1でcharacters側。ee validators.yamlにLength上書きなし=grep実測0件） | `<target>長すぎます。この値は{{ limit }}文字以下で入力してください。</target>`／`<target>This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.</target>` | md:177／xlf ja:77-79／xlf en:78-79 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0311-018 | message | 画像MIME不一致（MSG-007）ja「JPEG / PNG / GIF の画像ファイルのみアップロードできます。」（共有インフラのキー `form_error.category_image_invalid_mime` にja逐語実在）。**表示条件はpf mdが「要ソース確認」＝TBD（ee実装照合は規約で禁止）。en yamlにキー不存在（grep実測0件）＝en文言確定不能・§9** | 「M03-11-MSG-007 \| 入力項目直下 \| JPEG / PNG / GIF の画像ファイルのみアップロードできます。 \| …要ソース確認」／`form_error.category_image_invalid_mime: JPEG / PNG / GIF の画像ファイルのみアップロードできます。` | md:173／validators.ja.yaml:113 | pf-fallback＋共有インフラ逐語 | 1(en=TBD) |
| L1-M0311-019 | message | 画像サイズ超過（MSG-008）ja「画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。」（キー `form_error.category_image_too_large`）。表示条件=pf md「要ソース確認」＝TBD・en不存在＝TBD | 「M03-11-MSG-008 \| 入力項目直下 \| 画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。 \| …要ソース確認」／`form_error.category_image_too_large: 画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。` | md:174／validators.ja.yaml:114 | pf-fallback＋共有インフラ逐語 | 1(en=TBD) |
| L1-M0311-020 | message | 画像破損（MSG-009）ja「画像として読み取れない、または破損したファイルです。」（キー `form_error.category_image_corrupted`）。表示条件=pf md「要ソース確認」＝TBD・en不存在＝TBD | 「M03-11-MSG-009 \| 入力項目直下 \| 画像として読み取れない、または破損したファイルです。 \| …要ソース確認」／`form_error.category_image_corrupted: 画像として読み取れない、または破損したファイルです。` | md:175／validators.ja.yaml:115 | pf-fallback＋共有インフラ逐語 | 1(en=TBD) |
| L1-M0311-021 | db_effect | 新規保存時、親の `sort_no` に応じて新規行の `sort_no` を決め、より大きい `sort_no` の行を一括繰り上げ更新してからINSERT（移行先キーは `dtb_category.sort_no`。現行 `rank` と取り違えない） | 「新規保存時、リポジトリは親の `sort_no` に応じて新規行の `sort_no` を決め、それより大きい `sort_no` を持つ行を一括で繰り上げる更新を先行させてから INSERT する。」「`dtb_category.sort_no` を採番・繰り上げ（実在確認済み）」 | md:112,30 | pf-fallback | 0 |
| L1-M0311-022 | db_schema | 拡張列は移行先で `dtb_category` に統合: `category_name_en`・`front_search_hide_flg`・`branch_hide_flg`・`banner_image`・`icon_image`・`html_ja`・`html_en`・`search_parameters` の8列実在 | 「`dtb_category` に統合（`category_name_en`・`front_search_hide_flg`・`branch_hide_flg`・`banner_image`・`icon_image`・`html_ja`・`html_en`・`search_parameters` を実在確認）」 | md:29,19 | pf-fallback | 0 |
| L1-M0311-023 | superseded | **【superseded・期待値根拠に使用しない】** pf現行の「更新POSTでは画像処理なし・差し替え不可・編集にfile入力なし」は、Excelの有効要求（L1-042「この画面からの画像アップロード、削除、変更を実施可能とする」）が同一subjectを規定するため**刷新先仕様として撤回**。現行挙動の記録としてのみ保持（superseded_by=L1-042・改訂1） | 「新規と異なり、`processCategoryImageUploads` は呼ばれない。画像パスは既存値のまま維持される（本画面からの差し替えは行わない）。」「編集で画像を差し替えたい \| 本画面の実装では不可。」（＝現行pfの記述。刷新先はL1-042） | md:88,137,124（現行記録）／0204:6285,6287（上書き） | pf-fallback→superseded_by excel(L1-042) | 0 |
| L1-M0311-024 | behavior | 未送信または検証NGのPOSTは同一URLのフォーム表示相当Twigを**HTTP200**で再描画（新規=GET show同構成／更新=編集画面同構成。リダイレクトなし） | 「未送信または検証 NG のとき、`GET show` と同様の構成で Twig を 200 で返す。」「検証失敗・画像失敗 \| 同一 URL のフォーム表示に相当する Twig を 200 で再描画」 | md:78,87,230 | pf-fallback | 0 |
| L1-M0311-025 | behavior | Symfonyフォーム検証失敗は同一Twig200＋**フィールドエラー表示**（入力項目直下） | 「Symfony フォーム検証 \| 同一 Twig 200、フィールドエラー表示。」（MSG-010/011の表示位置=入力項目直下=md:176-177） | md:238,176-177 | pf-fallback | 0 |
| L1-M0311-026 | behavior | 画像アップロード/ディレクトリ作成失敗は共通アップロードエラー文言を該当フィールドまたはフォームに付与し、移動済みファイルは `save_image` 配下に限りunlinkして再表示（**どの文言かの条件確定はTBD＝L1-018〜020**） | 「画像アップロードまたはディレクトリ作成失敗 \| 共通アップロードエラー文言を該当フィールドまたはフォームに付与。移動済みファイルは削除。」「失敗時は該当フィールドにアップロードエラー、既に移動したファイルは `save_image` 配下に限り unlink してから再表示する。」 | md:239,80 | pf-fallback | 0 |
| L1-M0311-027 | behavior | 階層が `eccube_category_nest_level`（確認値5）超過（`eccube_category_nest_level < hierarchy`）は**HTTP 400**（フィールドエラーでなくエラー応答） | 「2 \| `hierarchy` が `eccube_category_nest_level`（確認値 5）以下か（実装は `eccube_category_nest_level < hierarchy` を異常とする） \| 異常なら HTTP 400。」「階層上限超過 \| HTTP 400。」 | md:105,240,79 | pf-fallback（踏襲値bound=ユーザー方針Interpretation A） | 0 |
| L1-M0311-028 | log | 保存開始・完了で日本語短文とカテゴリid（完了時）をログ記録（観測手段未契約=§9実行保留） | 「保存開始・完了 \| 日本語短文とカテゴリ id（完了時）。」 | md:254 | pf-fallback | 0 |
| L1-M0311-029 | side_effect | 副作用=DB更新・ファイル作成（新規かつ画像選択時）・失敗時の限定unlink・処理ログ・イベント通知・Doctrineキャッシュ破棄 | 「副作用 \| DB 更新、ファイル作成（新規かつ画像選択時）、失敗時の限定 unlink、処理ログ、イベント通知、Doctrine キャッシュ破棄。」 | md:161 | pf-fallback | 0 |
| L1-M0311-030 | auth_rule | 未ログインは管理画面共通のログイン誘導に従う（本画面GET/POSTに到達しない） | 「未ログイン \| 管理画面共通のログイン誘導に従う。」 | md:218 | pf-fallback | 0 |
| L1-M0311-031 | csrf | POSTはフォーム名 `admin_category`＋CSRF必須・新規時はmultipartと画像バイナリ（token改変時の応答形態は未規定=claimは「保存が発生しない」に限定） | 「入力 \| GET は親 id または編集 id。POST はフォーム名 `admin_category`、CSRF、新規時は `multipart` と画像バイナリ。」 | md:158 | pf-fallback | 0 |
| L1-M0311-032 | nav | `parent_id` が実在しない行のGET showは404 | 「パスの `parent_id` が存在しない行に対応するとき 404 とする。」「親が存在しない id なら 404。」 | md:63,298 | pf-fallback | 0 |
| L1-M0311-033 | integration | 保存成功後はリダイレクト先GETでリポジトリ経由の最新行が読まれる（保存した行が子一覧の取得結果に含まれる）。Doctrineキャッシュは `CacheUtil::clearDoctrineCache` で破棄 | 「保存成功後はリダイレクト先の GET でリポジトリ経由の最新行が読まれる。一覧のクエリキャッシュは `CacheUtil::clearDoctrineCache` で破棄する…」 | md:144,82 | pf-fallback | 0 |
| L1-M0311-034 | db_effect | DB操作は `dtb_category` への登録/更新のみ（不要な削除は含まない）。persist/flushで即時確定・承認ワークフローを介さない | 「登録/更新 \| dtb_category \| 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。」「商品系は承認ワークフローを介さず persist/flush で直接確定する」 | md:199,195 | pf-fallback | 0 |
| L1-M0311-035 | excel_delta | 商品コード（識別ID:12）はカスタマイズで削除（ラベル・テキストエリアを除去。刷新後実装しない） | 「ユニサーチ側の仕様で実現するため、識別ID:12 「商品コード」を削除」／「12 \| 商品コード \| …※カスタマイズ対応、ラベル、テキストエリアを除去する」／pf md「商品コード（優先表示商品）（※Excel基本設計 0204 識別ID:12 により廃止。刷新後は実装しない）。削除。」 | 0204:6273,6311／md:25 | excel | 0 |
| L1-M0311-036 | excel_delta | サイドメニュー表示フラグ（識別ID:7）・サイドメニュー表示用子カテゴリ（識別ID:13）はカスタマイズで除去 | 「★ \| 識別ID:7「サイドメニュー表示フラグ」を除去」「★ \| 識別ID:13「サイドメニュー表示用子カテゴリ」を除去」／「7 \| サイドメニュー表示フラグ \| …ラジオボタンを除去する」「13 \| サイドメニュー \| 表示用子カテゴリ \| …セレクトボックスを除去する」 | 0204:6270-6271,6306,6312 | excel | 0 |
| L1-M0311-037 | excel_delta | サイドメニューjson出力ボタン（識別ID:2）はカスタマイズで除去（登録済みカテゴリ構成を出力するため廃止） | 「★ \| 識別ID:2「サイドメニューjson出力」を除去」「2 \| サイドメニューjson出力 \| ボタン \| …ボタンを除去する」「リニューアル後では登録済みのカテゴリ構成を出力するため廃止とする」 | 0204:6292,6301,6264 | excel | 0 |
| L1-M0311-038 | excel_delta | 支店非表示フラグ（識別ID:9）追加: フラグが立っている場合、支店側のカテゴリ表示に表示させず検索対象からも除外（フロント側観測はcross-feature＝実行保留・§9） | 「★ \| 識別ID:9 支店非表示フラグを追加する」「支店非表示フラグが立っている場合、支店側のカテゴリ表示に表示させず、検索対象からも除外する」「9 \| 支店非表示フラグ \| 数値(0, 1) \| …チェックありの場合、支店側には当該カテゴリを表示しない」 | 0204:6278-6279,6308 | excel | 0 |
| L1-M0311-039 | excel_delta | フロント非表示フラグ（識別ID:8）挙動: 立っていると支店ページも含めて全て非表示（検索・フロントTOPのカテゴリ表示で非表示。cross-feature＝実行保留） | 「フロント非表示フラグが立っていると、支店ページも含めて全て非表示」「フロント非表示フラグが立っている場合、支店側も含めて検索やフロントTOPのカテゴリ表示で非表示にする」 | 0204:6280-6282,6307 | excel | 0 |
| L1-M0311-040 | excel_delta | 埋め込みHTML（日）（識別ID:14）・（英）（識別ID:15）を追加。設定されたHTMLをフロント側の当該カテゴリページに出力（フロント出力はcross-feature＝実行保留） | 「★ \| 識別ID:14「埋め込みHTML（日）」、識別ID:15「埋め込みHTML（英）」の入力項目を追加する」「ここで設定されたHTMLをフロント側の当該カテゴリページに出力する」 | 0204:6275-6276,6313-6314 | excel | 0 |
| L1-M0311-041 | excel_delta | 検索パラメータ（識別ID:16）を新規設置（書式=半角英数記号。レアリティ等を可変登録する運用。入力値とフロント表示は要件定義書別添参照＝本機能スコープ外） | 「★ \| 識別ID:16「検索パラメータ」を新規設置。」「16 \| 検索パラメータ \| 半角英数記号 \| …※カスタマイズ対応、新規設置。」 | 0204:6289-6290,6315 | excel | 0 |
| L1-M0311-042 | excel_delta | **【Excel確定・改訂1】** 最新セット用バナー画像（識別ID:10）・カテゴリアイコン画像（識別ID:11）を設置し、登録済みの場合は画像を表示する。**この画面からの画像アップロード・削除・変更を実施可能とする**（旧要求「※この画面からの画像アップロードは実施しない。」は原本で**取り消し線＝HTML上も `<span class="cell-strike">` として残存確認**・有効要求は後段の活字）。Excelは新規/編集の別を限定していない＝**両モードで可**。UI部品・削除操作の具体はExcel未規定＝要実機（TBDではない=仕様は確定） | 「★ \| 識別ID:10「最新セット用バナー画像」を設置、すでに画像登録済の場合は、画像を表示する」／`<span class="cell-strike">※この画面からの画像アップロードは実施しない。</span>　※この画面からの画像アップロード、削除、変更を実施可能とする`（識別ID:11も同型=6286-6287） | 0204:6284-6287,6309-6310 | excel | 0 |
| L1-M0311-043 | excel_meta | Excel画面項目一覧（識別ID1〜22）は必須・最大値・初期値が**全項目「-」**＝Excelは制約値に沈黙→制約値はpf現行md回帰で確定する（本候補のpf-fallback許可根拠） | 「識別ID \| ラベル \| 書式・制限 \| 必須 \| 最大値 \| 初期値 \| 画面部品の説明」（6300-6321の必須/最大値/初期値列が全行「-」） | 0204:6297-6321 | excel | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`）

期待値の正は**L1オラクルID**（SEED値を期待値の正にしない三段参照: 期待=L1→前提状態=SEED→実測=観測値）。
`dtb_category.id` の帯は **990001〜**（自動採番との衝突・シーケンス整合は`@TBD-D5`。PG運用の
シーケンス補正分岐がmd:278に明記されるため、帯INSERT後のsetval等の契約はD5で確定）。

| SEED | 内容 | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（パイロット共通） | 全ケースの認証 |
| SEED-M0311-TREE | 親P(id=990001, parent=null, hierarchy=1, sort_no=99900, category_name=`E2E親990001`)＋子C1(id=990002, parent=990001, hierarchy=2, sort_no=99901, `E2E子990002`)＋子C2(id=990003, parent=990001, hierarchy=2, sort_no=99902, `E2E子990003`) | 新規フォーム表示（C-003）・新規保存（C-005/037系）・sort_no繰り上げ観測（C-002: C1とC2の間に挿入）・編集（C-004/049系）・ルート編集リダイレクト（C-006B=990001を編集） |
| SEED-M0311-DEEP | 深さ5の鎖 id=990011(h=1)→990012(h=2)→990013(h=3)→990014(h=4)→990015(h=5)（各parent=直上・sort_no=99911〜99915・`E2E深990011`〜） | 階層上限: 990014配下の新規=h5（上限内・C-016）／990015配下の新規=h6（超過400・C-017） |
| SEED-M0311-IMG | 1x1px有効PNG/GIF/JPEG・非画像ファイル（拡張子偽装txt）・10M超画像のフィクスチャファイル群 | 画像正常系（C-037の画像あり分岐・H-066）・画像エラー系（C-063） |

- 破壊的ケースは**帯（990001〜）配下のみ**へ書き込み、afterEachで帯サブツリーDELETE→再INSERT。
  実カテゴリ行には書き込まない。新規作成されるカテゴリはid採番されるため、afterEachは
  「帯親配下のparent_category_id連鎖DELETE」で回収する。
- **注意（隔離）**: 帯カテゴリはフロントのカテゴリ表示・検索へ露出し得る（L1-038/039/040の出口）。
  共有環境では実行しない（フレッシュDB/serial前提。`e2e-standard-run-requirements` 準拠）。

## §3 画面項目マトリクス

Excel識別ID（0204:6300-6321）×pf md入力項目表（md:118-128）の突合。**制約値はすべてpf回帰**
（Excelは必須/最大値/初期値「-」＝L1-043）。

| 項目（Formキー） | Excel識別ID | 必須 | Form最大長 | 初期値 | 保存先 | 境界値(受理/拒否) | 根拠 |
|---|---|---|---|---|---|---|---|
| カテゴリ名(日) `name` | 5 | 必須(NotBlank) | 255(eccube_stext_len) | 新規=空/編集=DBの`category_name` | dtb_category.category_name | 255受理/256拒否/1受理/0(空)拒否 | L1-009／md:120／0204:6304 |
| カテゴリ名(英) `category_name_en` | 6 | 任意 | 255(Lengthのみ) | 新規=空/編集=DBの`category_name_en` | dtb_category.category_name_en | 空受理/255受理/256拒否 | L1-010／md:121／0204:6305 |
| フロント非表フラグ `front_search_hide_flg` | 8 | 任意(チェック) | —(論理値) | DB現在値 | dtb_category.front_search_hide_flg | — | L1-012／md:122／0204:6307 |
| 支店非表示フラグ `branch_hide_flg` | 9（★追加） | 任意(チェック) | —(論理値) | DB現在値 | dtb_category.branch_hide_flg | — | L1-012,038／md:123／0204:6308 |
| 最新セット用バナー画像 `banner_image_file`(mapped偽) | 10（★設置） | 任意（**新規・編集ともアップロード/削除/変更可＝Excel確定L1-042**。編集側UI部品は要実機） | Image最大10M・MIME jpeg/png/gif＋拡張子gif/jpg/jpeg/png（踏襲値） | 未選択 | dtb_category.banner_image（相対パス`category/{ファイル名}`） | 有効画像受理/非画像拒否 | L1-014,042／md:124／0204:6285,6309 |
| カテゴリアイコン画像 `icon_image_file`(mapped偽) | 11（★設置） | 任意（同上=L1-042） | 同上 | 未選択 | dtb_category.icon_image | 同上 | L1-014,042／md:125／0204:6287,6310 |
| 埋め込みHTML(日) `html_ja` | 14（★追加） | 任意 | Formに長さ制約なし(DB TEXT) | 編集=DBの`html_ja` | dtb_category.html_ja（textarea行6） | —(長大値の受理上限はDB型のみ=境界claimなし) | L1-013,040／md:126／0204:6313 |
| 埋め込みHTML(英) `html_en` | 15（★追加） | 任意 | 同上 | 同上 | dtb_category.html_en | — | L1-013,040／md:127／0204:6314 |
| 検索パラメーター `search_parameters` | 16（★設置） | 任意 | 3000(eccube_ltext_len) | 編集=DBの`search_parameters` | dtb_category.search_parameters | 3000受理/3001拒否 | L1-011,041／md:128／0204:6315 |
| （削除済）商品コード | 12（★除去） | — | — | — | —（画面に存在しないこと） | — | L1-035／0204:6273,6311 |
| （削除済）サイドメニュー表示フラグ/表示用子カテゴリ/json出力 | 7/13/2（★除去） | — | — | — | —（画面に存在しないこと） | — | L1-036,037 |

一覧/追加/削除の別: 本機能スコープは**新規作成（子）＋更新のみ**。削除・並べ替え・CSVはm03-45
（md:11,13）。更新経路に行INSERTなし・削除は本機能に含まない（L1-034）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全48行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値。
- request契約（§6.1）: POSTフォーム名 **`admin_category`**（md:158）→ ボディ `admin_category[name]`・
  `admin_category[category_name_en]`・`admin_category[front_search_hide_flg]`・`admin_category[branch_hide_flg]`・
  `admin_category[html_ja]`・`admin_category[html_en]`・`admin_category[search_parameters]`＋
  新規はmultipartで `banner_image_file`/`icon_image_file`（キー名md:124-125。CSRFフィールドの実name・
  ネスト位置は**要実機**＝ee twig照合を規約で行わないため）。
- セレクタ具体値は**全て要実機**（実DOM検証未実施＝§9。カスタマイズ画面のtwig照合を規約で行わないため、
  標準機能と異なりセレクタの事前確定はできない）。

### §4.1 bound対応候補行（掲載38行＝bound対応35＋bound親従属-EN 3。§8の78対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-11_admin_product_product_category_register_edit	E2E-M0311C-001	IT-15	DB統合	P1	拡張8列がdtb_categoryに実在し登録フォーム保存で各列へ書き込まれる（非UI/DB照会併用）	ログイン済(SEED-M01-ADMIN)／SEED-M0311-TREE	親990001配下で name=`E2E-<runid>-統合`・category_name_en=`E2E-EN`・両フラグON・html_ja=`<p>ja</p>`・html_en=`<p>en</p>`・search_parameters=`rarity=R`	1. db.tsで information_schema.columns から dtb_category の category_name_en/front_search_hide_flg/branch_hide_flg/banner_image/icon_image/html_ja/html_en/search_parameters の8列実在を照会 2. 新規フォームに左記を入力し「子カテゴリ作成」 3. db.tsで新規行の各列値を照会（afterEach: 帯再適用）	8列すべて実在＋保存行の category_name_en/フラグ2種/html_ja/html_en/search_parameters が入力値と一致 [L1:L1-M0311-022,L1-M0311-034; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-002	IT-23	並び順	P1	新規保存でsort_no採番・後続行の一括繰り上げが先行する	ログイン済／SEED-M0311-TREE（C1=99901,C2=99902）	親990001配下で name=`E2E-<runid>-並び順`	1. db.tsで親990001配下のid,sort_noを記録 2. 新規保存 3. db.tsで再照会し新規行sort_noと既存C1/C2のsort_no変化を確認（afterEach: 帯再適用）	新規行のsort_noが親のsort_noに応じて決まり、それより大きいsort_noを持っていた行が繰り上げ更新されている（現行rankでなくsort_noが変化） [L1:L1-M0311-021; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-003	IT-25	画面表示	P1	親を選んだ子一覧GETで上部に新規用フォーム（子カテゴリ作成）が出る	ログイン済／SEED-M0311-TREE	—	1. GET /%eccube_admin_route%/product/category/990001 を開く 2. 上部カード内のフォームとja「子カテゴリ作成」ボタンの存在を確認	上部に新規用フォームが表示され送信ボタンja「子カテゴリ作成」（送信先=POST同パス） [L1:L1-M0311-001,L1-M0311-005; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-004	IT-20	画面表示	P1	編集GETで上部に編集用フォームが出る（ボタンja「カテゴリ更新」）	ログイン済／SEED-M0311-TREE	—	1. GET /%eccube_admin_route%/product/category/990002/edit を開く 2. 上部カードのフォームとボタン文言を確認	上部に編集用フォーム・変換ボタンja「カテゴリ更新」 [L1:L1-M0311-002,L1-M0311-005; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-005	IT-20	遷移	P1	新規保存成功→302で GET …/category/{parent_id} へリダイレクト	ログイン済／SEED-M0311-TREE	親990001配下 name=`E2E-<runid>-遷移`	1. 新規フォームで有効値を入れ「子カテゴリ作成」 2. 応答の遷移先URLを読む（afterEach: 帯再適用）	/%eccube_admin_route%/product/category/990001 へリダイレクト（302→GET） [L1:L1-M0311-003; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-006A	IT-15	遷移	P1	更新保存成功（親あり）→ GET …/category/{parent_id} へリダイレクト	ログイン済／SEED-M0311-TREE	990002編集 name=`E2E-<runid>-更新遷移`	1. 990002の編集フォームでnameを変更し「カテゴリ更新」 2. 遷移先URLを読む（afterEach: 帯再適用）	/%eccube_admin_route%/product/category/990001 へリダイレクト [L1:L1-M0311-004; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-006B	IT-05	遷移	P1	更新保存成功（親なし=ルート）→ GET /{admin_route}/product/category へリダイレクト	ログイン済／SEED-M0311-TREE	990001（parent=null）編集 name=`E2E-<runid>-ルート更新`	1. GET /%eccube_admin_route%/product/category/990001/edit で編集 2. 保存し遷移先URLを読む（afterEach: 帯再適用）	/%eccube_admin_route%/product/category へリダイレクト [L1:L1-M0311-004; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-007	IT-25	画面表示	P2	カード内フォームの項目構成（名2種・チェック2種・HTML日英textarea行6・検索パラメータ・画像2種操作領域〔新規・編集とも=Excel確定〕）	ログイン済／SEED-M0311-TREE	—	1. GET …/category/990001 を開く 2. カード内の入力要素構成を読む 3. GET …/990002/edit でも構成を読む	日本語名・英語名・フロント非表/支店非表示チェック・埋め込みHTML日英（textarea rows=6）・検索パラメータ一行テキストが両モードに存在。バナー/アイコン画像2種の操作領域が**新規・編集とも**提供される（新規側=隠しfile＋ドロップゾーン＋プレビュー〔踏襲UI〕・編集側の部品具体は要実機） [L1:L1-M0311-005,L1-M0311-006,L1-M0311-042; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-008	IT-25	JS挙動	P2	画像2種のアップロードUI（file change/dragover/drop/クリックで隠しfile/プレビューimg・クライアント側MIME image/＋拡張子gif,jpg,jpeg,png検査）が機能し、新規・編集の両モードで画像のアップロード/削除/変更操作が提供される	ログイン済／SEED-M0311-TREE＋SEED-M0311-IMG	有効PNGと拡張子偽装txt	1. 新規フォームでバナーに有効PNGをdrop→プレビューimg表示を確認 2. 非画像(txt)をdrop→通過しないことを確認 3. アイコン側も同様 4. 編集フォーム（…/990002/edit）でも画像のアップロード/削除/変更操作が提供されることを確認（編集側UI部品のセレクタは要実機）	新規側=踏襲UI（change/dragover/drop/クリック/プレビュー・image/かつgif,jpg,jpeg,pngのみ通過）が機能。**編集側でも画像のアップロード・削除・変更が可能（Excel確定）** [L1:L1-M0311-006,L1-M0311-042,L1-M0311-014; fixture:SEED-M0311-IMG@TBD-D5]（編集側UI部品の具体はExcel未規定=要実機・§9）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-009	IT-22	必須	P1	カテゴリ名(日)空で送信→「入力されていません。」表示・保存されない・200滞留（ja）	ログイン済／SEED-M0311-TREE	新規: name=空・他未入力	1. 新規フォームでnameを空のまま「子カテゴリ作成」 2. エラー文言・URL・statusを読む 3. db.tsで行数不変を照会	保存されず入力項目直下に「入力されていません。」・同一URLでHTTP200・dtb_category行数不変 [L1:L1-M0311-009,L1-M0311-016,L1-M0311-024,L1-M0311-025; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-009-EN	IT-22	必須	P2	必須エラーメッセージ（en）	ログイン済／locale=en	同上	同上	"No value found." が表示される [L1:L1-M0311-016]（pf md en列との齟齬はL1-016に記録済み・en yaml正）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-010	IT-22	任意	P1	任意項目（英語名・フラグ2種・HTML日英・検索パラメータ）を全て未入力でも必須エラーにならず保存成功	ログイン済／SEED-M0311-TREE	新規: name=`E2E-<runid>-任意空` のみ入力	1. name以外を未入力のまま「子カテゴリ作成」 2. フラッシュと遷移を確認（afterEach: 帯再適用）	必須エラーなし・「保存しました」＋リダイレクト（任意項目はLength等のみで未入力可） [L1:L1-M0311-010,L1-M0311-011,L1-M0311-012,L1-M0311-013,L1-M0311-015; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-011	IT-22	画面表示	P2	ルート直下一覧（親null）では登録フォームカードが出ない	ログイン済	—	1. GET /%eccube_admin_route%/product/category を開く 2. 登録フォームカードの不存在を確認	登録フォームカードは表示されない [L1:L1-M0311-008]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-016	IT-22	階層上限	P1	階層上限内（hierarchy=5）の新規保存はエラーなく成功する	ログイン済／SEED-M0311-DEEP	990014（h=4）配下 name=`E2E-<runid>-h5`	1. GET …/category/990014 の新規フォームで保存 2. フラッシュと遷移・db.tsで新規行hierarchy=5を照会（afterEach: 帯再適用）	エラーが表示されず保存成功（hierarchy=5≦eccube_category_nest_level確認値5） [L1:L1-M0311-027,L1-M0311-015; fixture:SEED-M0311-DEEP@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-017	IT-22	階層上限	P1	階層上限超過（hierarchy=6）の新規保存POSTはHTTP 400	ログイン済セッション／SEED-M0311-DEEP	§6.1契約: 990015（h=5）配下へ name=`E2E-h6` をPOST	1. GET …/category/990015 で新規フォーム表示（表示可否も記録） 2. 保存送信 3. 応答statusとdb.tsで行数不変を照会	HTTP 400（フィールドエラーでなくエラー応答＝「エラーが表示され」の形態は400応答である旨を注記）・行追加なし [L1:L1-M0311-027; fixture:SEED-M0311-DEEP@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-018	IT-22	保存成功	P1	保存成功→「保存しました」フラッシュ＋カテゴリ一覧画面（…/category/{parent_id}）へ遷移（ja）	ログイン済／SEED-M0311-TREE	親990001配下 name=`E2E-<runid>-完了`	1. 新規保存 2. フラッシュ文言と遷移先を読む（afterEach: 帯再適用）	「保存しました」が管理画面上部に表示され、管理画面_商品管理_カテゴリ一覧画面（=リダイレクト先 …/category/990001）に遷移 [L1:L1-M0311-015,L1-M0311-003; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-018-EN	IT-22	保存成功	P2	保存成功フラッシュ（en）	ログイン済／locale=en／SEED-M0311-TREE	同上	同上	"Saved" 表示＋同遷移 [L1:L1-M0311-015]（pf md en列「保存しました」との齟齬はL1-015に記録済み・en yaml正）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-033	IT-23	一覧反映	P2	保存した行がリダイレクト先の子一覧の取得結果に含まれる（DB最新行の読み直し）	ログイン済／SEED-M0311-TREE	親990001配下 name=`E2E-<runid>-反映`	1. 新規保存 2. リダイレクト後の子一覧に新規行が表示されることを読む 3. db.tsで同名行の存在を照会（afterEach: 帯再適用）	リダイレクト先GETの子一覧に保存した行が含まれる（リポジトリ経由の最新行・キャッシュ破棄済み） [L1:L1-M0311-033; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-037	IT-26	登録内容	P1	新規保存でdtb_categoryに行が追加され入力値どおり保存される（画像選択時はファイルも作成）	ログイン済／SEED-M0311-TREE＋SEED-M0311-IMG	親990001配下 name=`E2E-<runid>-追加`・バナーに有効PNG	1. db.tsでCOUNT(*)記録 2. 新規保存（画像あり） 3. db.tsでCOUNT+1・name一致・banner_imageに相対パス`category/…`を照会 4. save_image/category配下のファイル生成を確認（afterEach: 帯再適用＋生成ファイル削除）	COUNT+1・category_name=入力値・banner_image=相対パス`category/{ファイル名}`・ファイル実体が作成される [L1:L1-M0311-034,L1-M0311-014,L1-M0311-029; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-038	IT-26	登録内容	P1	更新送信ではdtb_categoryに行が追加されない（既存行の更新のみ・COUNT不変）	ログイン済／SEED-M0311-TREE	990002編集 name=`E2E-<runid>-無追加`	1. db.tsでCOUNT(*)記録 2. 990002を更新保存 3. db.tsで再照会（afterEach: 帯再適用）	COUNT不変（更新経路にINSERTなし・削除も発生しない） [L1:L1-M0311-034,L1-M0311-004; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-042	IT-26	最大長	P1	カテゴリ名(日)255字（最大長）の新規が受理され行追加される	ログイン済／SEED-M0311-TREE	name=runFill(255,ascii,"E2E-<runid>-")	1. 255字で新規保存 2. フラッシュ確認 3. db.tsで char_length(category_name)=255 を照会（afterEach: 帯再適用）	保存成功・行追加・DB文字長=255 [L1:L1-M0311-009,L1-M0311-034,L1-M0311-015; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-043	IT-26	最大長	P1	カテゴリ名(日)256字（最大長+1）→「長すぎます。この値は255文字以下で入力してください。」・行追加されない（ja）	ログイン済／SEED-M0311-TREE	name=runFill(256,ascii,"E2E-<runid>-")	1. 256字で新規保存 2. エラー文言を読む 3. db.tsで行数不変を照会	保存されず「長すぎます。この値は255文字以下で入力してください。」（limit=255解決）・COUNT不変・200滞留 [L1:L1-M0311-009,L1-M0311-017,L1-M0311-024,L1-M0311-025; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-043-EN	IT-26	最大長	P2	最大長超過メッセージ（en）	ログイン済／locale=en	同上	同上	"This value is too long. It should have 255 characters or less."（limit=255>1でcharacters側） [L1:L1-M0311-017]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-044	IT-26	境界	P2	カテゴリ名(日)1字（最小長）の新規が受理される	ログイン済／SEED-M0311-TREE	name=`あ`	1. 1字で新規保存 2. フラッシュ確認 3. db.tsでcategory_name=`あ`を照会（afterEach: 帯再適用）	保存成功・行追加（min制約なし=NotBlankのみ） [L1:L1-M0311-009,L1-M0311-034; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-045	IT-26	境界	P1	カテゴリ名(日)空（最小長-1=0字）の新規→NotBlankエラー・行追加されない	ログイン済／SEED-M0311-TREE	name=``	1. db.tsでCOUNT記録 2. 空で新規保存 3. エラーとCOUNT不変を確認	「入力されていません。」・COUNT不変 [L1:L1-M0311-009,L1-M0311-016,L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-049	IT-26	更新内容	P1	更新保存で対象行のcategory_name等の値が変更される	ログイン済／SEED-M0311-TREE	990002編集 name=`E2E-<runid>-変更`・category_name_en=`E2E-EN2`・search_parameters=`rarity=SR`	1. 990002の編集フォームで左記へ変更し保存 2. db.tsで id=990002 の category_name/category_name_en/search_parameters を照会（afterEach: 帯再適用）	3列とも入力値へ変更されている [L1:L1-M0311-004,L1-M0311-034,L1-M0311-022; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-050	IT-26	更新抑止	P1	更新の検証失敗では対象行の値が変更されない（DB不変・200再描画）	ログイン済／SEED-M0311-TREE	990002編集 name=``	1. db.tsで990002の現在値記録 2. 空で更新送信 3. エラー確認 4. db.tsで再照会	「入力されていません。」・id=990002の全列が更新前と同値・同一URL200 [L1:L1-M0311-009,L1-M0311-016,L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-054	IT-26	最大長	P1	更新でカテゴリ名(日)255字が受理され値が変更される	ログイン済／SEED-M0311-TREE	990002編集 name=runFill(255,ascii,"E2E-<runid>-")	1. 255字で更新保存 2. db.tsで char_length=255 を照会（afterEach: 帯再適用）	保存成功・category_nameが255字の入力値へ変更 [L1:L1-M0311-009,L1-M0311-004; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-055	IT-26	最大長	P1	更新でカテゴリ名(日)256字→Lengthエラー・値が変更されない	ログイン済／SEED-M0311-TREE	990002編集 name=runFill(256,ascii,"E2E-<runid>-")	1. db.tsで現在値記録 2. 256字で更新送信 3. エラーと値不変を確認	「長すぎます。この値は255文字以下で入力してください。」・category_name不変 [L1:L1-M0311-009,L1-M0311-017,L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-056	IT-26	境界	P2	更新でカテゴリ名(日)1字が受理され値が変更される	ログイン済／SEED-M0311-TREE	990002編集 name=`A`	1. 1字で更新保存 2. db.tsでcategory_name=`A`照会（afterEach: 帯再適用）	保存成功・値=`A` [L1:L1-M0311-009,L1-M0311-004; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-057	IT-26	境界	P1	更新でカテゴリ名(日)空→NotBlankエラー・値が変更されない	ログイン済／SEED-M0311-TREE	990002編集 name=``	（C-050と同一手順・独立実行）	「入力されていません。」・値不変 [L1:L1-M0311-009,L1-M0311-016,L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-061	IT-02	エラー再描画	P2	検証失敗・画像失敗は同一URLのフォーム表示相当Twigを200で再描画（リダイレクトなし）	ログイン済／SEED-M0311-TREE	新規: name=空	1. 空で新規送信 2. 応答status・URL・フォーム再描画（入力済み値の保持を含む画面構成）を読む	HTTP200・同一URL・GET showと同構成のフォーム再描画（302されない） [L1:L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-062	IT-02	エラー表示	P2	Symfonyフォーム検証失敗は同一Twig200＋フィールドエラーが入力項目直下に表示	ログイン済／SEED-M0311-TREE	新規: name=空＋category_name_en=256字	1. 左記で新規送信 2. name直下とcategory_name_en直下のエラー文言・表示位置を読む	同一Twig200・name直下に「入力されていません。」・category_name_en直下に「長すぎます。…255文字以下…」（フィールド単位表示） [L1:L1-M0311-025,L1-M0311-016,L1-M0311-017,L1-M0311-010; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-063	IT-25	画像エラー	P1	非画像ファイルのアップロード失敗で共通アップロードエラー文言が該当フィールド（入力項目直下）に付与され200再描画・行追加なし	ログイン済／SEED-M0311-TREE＋SEED-M0311-IMG	新規: name=`E2E-<runid>-画像NG`・バナー=拡張子偽装txt（§6.1のmultipart直POSTでクライアントJS検査を回避）	1. db.tsでCOUNT記録 2. 非画像を添付して新規送信 3. バナー項目直下のエラー付与と200再描画を確認 4. COUNT不変を照会	該当フィールドにアップロードエラー文言が付与（**候補文言はMSG-007/009のja逐語=L1-018/020。どの条件でどれが出るかは表示条件TBDのため文言完全一致は主張せず「いずれかのエラー文言の付与」を検証**）・200・行追加なし [L1:L1-M0311-026,L1-M0311-014,L1-M0311-018,L1-M0311-020,L1-M0311-024; fixture:SEED-M0311-IMG@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-064	IT-12	ログ	P2	保存開始・完了で日本語短文とカテゴリid（完了時）がログに記録される	ログイン済／SEED-M0311-TREE／アプリログ観測可能な環境	親990001配下 name=`E2E-<runid>-ログ`	1. ログ観測を開始 2. 新規保存 3. 保存開始・完了の日本語短文と完了時のカテゴリidを確認（afterEach: 帯再適用）	保存開始・完了の日本語短文＋完了時にカテゴリid [L1:L1-M0311-028; fixture:SEED-M0311-TREE@TBD-D5]（実行保留=ログ観測手段未契約・§9）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-071	IT-25	画面表示	P3	登録・編集フォーム自体はモーダルにしない	ログイン済／SEED-M0311-TREE	—	1. GET …/category/990001 と …/990002/edit を開く 2. フォームがモーダル内でなくページ内カードにあることを確認	登録・編集フォームはモーダル表示ではない [L1:L1-M0311-007; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-072	IT-12	初期表示	P2	編集初期表示は各項目がDB現在値で表示されエラーは出ない（恒等写像）	ログイン済／SEED-M0311-TREE（990002に既知値を帯投入: フラグON/OFF既知・search_parameters既知）	—	1. GET …/990002/edit を開く 2. name/英語名/フラグ2種/html日英/検索パラメータの初期値を読む 3. db.tsの現在値と突合	全項目=DB現在値（新規は空・編集はDB値の初期値規則）・エラー表示なしで編集継続可能 [L1:L1-M0311-009,L1-M0311-010,L1-M0311-012,L1-M0311-013; fixture:SEED-M0311-TREE@TBD-D5]				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-075	IT-25	副作用	P1	保存の副作用一式（DB更新・新規かつ画像選択時のファイル作成は観測。処理ログ・イベント通知・キャッシュ破棄は観測手段未契約=保留）	ログイン済／SEED-M0311-TREE＋SEED-M0311-IMG	親990001配下 name=`E2E-<runid>-副作用`・バナー有効PNG	1. 新規保存（画像あり） 2. db.tsでDB更新を照会 3. save_image/category配下のファイル作成を確認 4. 処理ログ/イベント/キャッシュ破棄は観測対象外と記録（afterEach: 帯再適用＋ファイル削除）	DB更新＋ファイル作成を観測（残る3副作用=処理ログ・イベント通知・Doctrineキャッシュ破棄はclaimとして保持し観測は保留） [L1:L1-M0311-029,L1-M0311-034; fixture:SEED-M0311-IMG@TBD-D5]				
```

### §4.2 補完行（10行。**親test_idなし・母集合会計に算入しない**。理由=一次資料（Excel/pf md）に規定があるが母集合78行の期待テキストに対応する親が存在しない）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-11_admin_product_product_category_register_edit	E2E-M0311C-080	IT-15	認証	P1	未認証で当画面URLへ直接アクセス→管理画面共通のログイン誘導	未ログイン	—	1. GET /%eccube_admin_route%/product/category/990001 2. 応答の遷移先を読む	本画面は表示されず管理画面共通のログイン誘導に従う [L1:L1-M0311-030]（補完行・親test_idなし・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-081	IT-03	CSRF	P1	CSRFトークン改変のPOSTでは保存が発生しない（非UI）	ログイン済セッション／SEED-M0311-TREE	§6.1契約: 正規トークンの末尾1文字を置換してPOST（name=`E2E-CSRF改変`）	1. GETで正規トークン取得（フィールド実nameは要実機） 2. 改変トークンでPOST 3. db.tsで行数・値の不変を照会	dtb_categoryに行追加・値変更が発生しない（**応答形態〔status/文言〕は一次資料未規定のためclaimしない**） [L1:L1-M0311-031,L1-M0311-034; fixture:SEED-M0311-TREE@TBD-D5]（補完行・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-082	IT-25	404	P2	実在しないparent_idのGET showは404	ログイン済	—	1. GET /%eccube_admin_route%/product/category/89999999（帯外の不存在id） 2. statusを読む	HTTP 404 [L1:L1-M0311-032]（補完行・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-083	IT-22	最大長	P2	検索パラメータ3000字（最大長）が受理される	ログイン済／SEED-M0311-TREE	新規: name=`E2E-<runid>-LT`・search_parameters=runFill(3000,ascii,"E2E-")	1. 3000字で新規保存 2. db.tsで char_length(search_parameters)=3000 を照会（afterEach: 帯再適用）	保存成功・DB文字長=3000（eccube_ltext_len確認値） [L1:L1-M0311-011; fixture:SEED-M0311-TREE@TBD-D5]（補完行・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-084	IT-22	最大長	P2	検索パラメータ3001字→「長すぎます。この値は3000文字以下で入力してください。」・保存されない	ログイン済／SEED-M0311-TREE	新規: name有効・search_parameters=runFill(3001,ascii,"E2E-")	1. 3001字で新規送信 2. エラー文言（limit=3000解決）と行数不変を確認	保存されず「長すぎます。この値は3000文字以下で入力してください。」 [L1:L1-M0311-011,L1-M0311-017,L1-M0311-024; fixture:SEED-M0311-TREE@TBD-D5]（補完行・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-085	IT-22	最大長	P2	カテゴリ名(英)256字→Lengthエラー（任意項目でも最大長は拘束）	ログイン済／SEED-M0311-TREE	新規: name有効・category_name_en=runFill(256,ascii,"E2E-")	1. 256字で新規送信 2. category_name_en直下のエラーと行数不変を確認	保存されず「長すぎます。この値は255文字以下で入力してください。」 [L1:L1-M0311-010,L1-M0311-017; fixture:SEED-M0311-TREE@TBD-D5]（補完行・pf md補完）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-086	IT-25	画面表示	P2	編集画面でも登録済み画像が表示され、画像のアップロード・削除・変更の操作が提供される（Excel確定・改訂1で再具体化）	ログイン済／SEED-M0311-TREE（990002=banner_image登録済み・990003=未登録を帯投入）	—	1. GET …/990002/edit で登録済み画像の表示と画像アップロード/削除/変更操作の提供を確認 2. GET …/990003/edit（未登録）で画像表示なし・アップロード操作の提供を確認（操作系のUI部品セレクタは要実機）	登録済みは画像を表示（識別ID:10/11「すでに画像登録済の場合は、画像を表示する」）＋**編集画面からも画像のアップロード・削除・変更が可能** [L1:L1-M0311-042,L1-M0311-005; fixture:SEED-M0311-TREE@TBD-D5]（補完行・**excel補完＝刷新delta検証**。改訂1: 旧「編集はfile入力なし・読み取り専用」claimをExcel優先で撤回=L1-023 superseded）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-087	IT-25	Excel削除項目	P1	カスタマイズで削除された項目（商品コード・サイドメニュー表示フラグ・サイドメニュー表示用子カテゴリ・サイドメニューjson出力ボタン）が画面に存在しない	ログイン済／SEED-M0311-TREE	—	1. GET …/category/990001 と …/990002/edit を開く 2. 「商品コード」「サイドメニュー」を含むラベル・入力・ボタンが存在しないことを確認	商品コード欄（識別ID:12）・サイドメニュー表示フラグ（ID:7）・サイドメニュー表示用子カテゴリ（ID:13）・サイドメニューjson出力ボタン（ID:2）がいずれも存在しない [L1:L1-M0311-035,L1-M0311-036,L1-M0311-037; fixture:SEED-M0311-TREE@TBD-D5]（補完行・**excel補完＝刷新delta検証**）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-088	IT-24	外部出口	P3	支店非表示フラグONのカテゴリは支店側のカテゴリ表示に出ず検索対象からも除外される（cross-feature・実行保留）	ログイン済／SEED-M0311-TREE	990002のbranch_hide_flg=ONで保存	1. フラグONで保存 2. 支店側フロントのカテゴリ表示・検索で当該カテゴリの不存在を確認（観測面が別機能＝セレクタ・URL未契約）	支店側表示に出ない＋検索対象から除外 [L1:L1-M0311-038,L1-M0311-012; fixture:SEED-M0311-TREE@TBD-D5]（補完行・excel補完・実行保留=フロント観測未契約）				
m03-11_admin_product_product_category_register_edit	E2E-M0311C-089	IT-24	外部出口	P3	フロント非表示フラグONのカテゴリは支店ページ含め全て非表示・埋め込みHTMLはフロント当該カテゴリページに出力される（cross-feature・実行保留）	ログイン済／SEED-M0311-TREE	990002のfront_search_hide_flg=ON／990003のhtml_ja=`<p>E2E-HTML</p>`	1. 各値で保存 2. フロント側で990002の全面非表示・990003ページでのHTML出力を確認（観測面が別機能＝未契約）	ONは支店含め検索・フロントTOPカテゴリ表示で非表示／html_jaが当該カテゴリページに出力 [L1:L1-M0311-039,L1-M0311-040; fixture:SEED-M0311-TREE@TBD-D5]（補完行・excel補完・実行保留）				
```

## §5 locale対応表

- LS=1 claim（7件）: L1-005（変換ボタン文言）・L1-015（保存フラッシュ）・L1-016（NotBlank）・
  L1-017（Length）・L1-018/019/020（画像エラー3種）。
- **-EN行は3行のみ**（C-009-EN／C-018-EN／C-043-EN）＝en文言がen一次資料に逐語実在するもの:
  - L1-015 en "Saved"（messages.en.yaml:1636）
  - L1-016 en "No value found."（validators.en.yaml:17）
  - L1-017 en "This value is too long. It should have 255 characters or less."（xlf en:78-79・limit=255>1でcharacters側）
- **en文言確定不能=4claim（-EN行を作らない・§9）**:
  - L1-018/019/020: `form_error.category_image_*` キーは validators.en.yaml に**不存在**（grep実測0件）。
    fallback挙動の確定にはee実装/設定の照合が必要＝規約（ee非依拠）により確定しない。
  - L1-005: 「子カテゴリ作成」「カテゴリ更新」のtransキーはpf md・Excelに未記載。ja文言の
    en yaml完全一致検索でも同定不能（カスタマイズ文言）。ee twigでの鍵特定は規約で不可＝TBD。
- **pf md表示メッセージ表en列との齟齬2件（記録・en一次資料を正とする）**:
  - MSG-001: pf md en列「保存しました」（md:169）↔ messages.en.yaml:1636 `Saved`。
  - MSG-010: pf md en列 "This value should not be blank."（md:176）↔ validators.en.yaml:17 `No value found.`。
  いずれもpf md側はja文言/Symfony既定の転記とみられる（確定はしない）。**期待値はen yaml逐語を採用**し
  pf md en列は根拠に使わない。
- -EN実行前提はD15（M0 Go/No-Go。文言確定は本書で完了＝実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約

- 新規POST: `POST /%eccube_admin_route%/product/category/{parent_id}`／
  更新POST: `POST /%eccube_admin_route%/product/category/{id}/edit`（md:300-301,43-44）。
- ボディ: フォーム名 **`admin_category`**（md:158）→ `admin_category[name]`・
  `admin_category[category_name_en]`・`admin_category[front_search_hide_flg]`・
  `admin_category[branch_hide_flg]`・`admin_category[html_ja]`・`admin_category[html_en]`・
  `admin_category[search_parameters]`（各キー名はmd:120-128の「キー」列逐語）。
  新規は `multipart/form-data`＋`banner_image_file`／`icon_image_file`（md:124-125・mapped偽）。
  **CSRFトークンのフィールド実name・画像fileキーのネスト位置（`admin_category[...]`配下か否か）は
  一次資料に未記載＝要実機**（ee twig/Form照合は規約で行わない。標準機能との差＝§係数実測）。
- DB照会: `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ）。オラクル解決:
  `e2e/helpers/oracle.ts` の `o(id, "m03_11_oracle")` 方式（**正式fixtureは未作成**。候補段階では消費なし）。
  境界値生成: `runFill(255|256|3000|3001, ascii, "E2E-<runid>-")`（oracle.ts:110-116）。

### §6.2 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m03-11_admin_product_product_category_register_edit_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**（git statusで確認可能）。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）により
   正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/` 配下の spec・page への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright(GUI): C-003/004/005/006A/006B/007/008/009/010/011/016/018/033/042〜045/049/050/054〜057/
  061/062/071/072/080/082/085/086/087・-EN 3行。
- Playwright+DB照会(db.ts): C-001/002/009/016/017/037/038/042〜045/049/050/054〜057/063/075/081/083/084。
- 非UI(request契約): C-017（400観測）・C-063（multipart直POSTでクライアントJS回避）・C-081（CSRF）。
  母集合の実行方法（-004/-005=非UI・-065=手動）は系譜として§8で保持・本候補の区分はあくまで候補。
- 破壊的（帯990001〜のみ書込・afterEach帯再適用・フレッシュDB/serial前提）: C-001/002/005/006A/006B/
  008/010/016/018/033/037/038/042/044/049/054/056/063/075/083/086/087/088/089。
- 実行保留: C-064（アプリログ観測手段未契約）・C-075の3副作用（イベント通知・キャッシュ破棄・処理ログ）・
  C-088/089（cross-featureフロント観測未契約）・-EN 3行（D15待ち）。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報であり正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル・前提条件ラベルは不使用＝ノイズ。本機能の母集合は
前提条件列に「M03-11-MSG-001を試験できる状態」等のラベルが大量転写されているが、bindは期待列のみで実施）。
1候補ケース行=1 assertion bundle・多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝78↔候補の期待テキスト突合が本文内で完結する**。

### 集計（78 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **59** | 下表 |
| **TBD** | **1** | -052（期待テキスト自体が「要ソース確認であること。」＝プレースホルダ。§9） |
| **excluded** | **18** | EX-A 検索条件14（-019〜-032）／EX-B 相関バリデーション4（-012〜-015） |
| 合計 | **78** | 欠落0・理由なし重複0 |

- 候補ケース行総数**48**（§4.1 bound対応35＋§4.2 補完10＋-EN 3）。
- excluded根拠（**全カテゴリ実test_idを引いて期待テキストで確認済み**）:
  - **EX-A（-019〜-032・14件）**: 期待は全行「検索条件の該当レコードが取得結果に含まれる（含まれない）こと」。
    本機能に**検索機能そのものが存在しない**: フォーム項目構成に検索入力なし（md:52）・
    「検索条件のように一覧状態をセッションに載せない」（md:266）・本機能スコープはフォーム送信と
    GET表示に限定（md:5）・Excel画面項目一覧（識別ID1〜22・0204:6300-6321）にも検索条件入力は存在しない
    （識別ID:16「検索パラメータ」は**フロント検索条件の設定データ項目**であり管理画面の検索機能ではない
    =0204:6289-6290）。検索という操作自体がないため過剰生成。**「取得結果に一覧反映」の意味成分は
    -033〜-036（C-033）と-018系がboundで被覆＝偽陰性なし**。
  - **EX-B（-012〜-015・4件）**: 期待「相関バリデーションでエラーが表示され（ず）…」。pf mdの
    バリデーション表は**全4行**で、逐語=「カテゴリ名（日） \| `NotBlank`、`Length`（`eccube_stext_len`）。」
    「カテゴリ名（英） \| `Length` のみ（未入力可）。」「検索パラメーター \| `Length`（`eccube_ltext_len`）。」
    「バナー・アイコン（新規） \| Symfony `Image` に加え、サーバで MIME 接頭と拡張子、移動・
    ディレクトリ作成の成否。」（md:207-210）＝**項目単独制約のみで項目間相関の行が存在しない**
    （pf現行回帰の逐語裏付け・改訂1でee依存なしを明確化）。
    Excelにも相関規定なし（0204:6297-6321・必須/最大値/初期値すべて「-」＝L1-043）。
    **DB状態との相関検証（階層上限）は存在する**が、それは-016/-017（DBとの相関バリデーション行）へ
    boundしており（C-016/C-017）、フォーム項目間の相関バリは不存在＝両極性とも除外
    （片極性のみ除外する誤りなし・§10）。
- **-016/-017のbind注記（正直な限定）**: 階層上限（L1-027）は「DBとの相関」検証の実体として唯一存在する。
  超過時の観測は**HTTP 400のエラー応答**であり入力項目直下のフィールドエラー表示ではない。
  「エラーが表示され」の充足形態を400応答とみなすbindである旨をC-017に明記した（乖離すれば再分類）。

### 78対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | dtb_categoryに統合（category_name_en・front_search_hide_flg・branch_hide_flg・banner_image・icon_image・html_ja…）であること | bound | C-001 |
| 002 | dtb_category.sort_no を採番・繰り上げ（実在確認済み）であること | bound | C-002 |
| 003 | 上部に新規用フォーム（子カテゴリ作成）であること | bound | C-003 |
| 004 | 上部に編集用フォームであること | bound | C-004 |
| 005 | 検証と画像処理のあと保存し、成功なら GET …/category/{parent_id} へリダイレクト | bound | C-005 |
| 006 | 検証後保存し、成功なら親あり…/category/{parent_id}・ルートなら…/product/category | bound | C-006A,C-006B |
| 007 | 親がいる一覧もしくは編集モードのとき、カード内にフォーム | bound | C-007 |
| 008 | 新規時のみ、バナー・アイコンそれぞれでfileのchange、dragover/drop、クリックで隠しfile、プレビューimg | bound | C-008（母集合期待の「新規時のみ」限定はExcel確定L1-042がsupersede＝候補は両モード可で検証。母集合は不変のまま系譜保持） |
| 009 | 必須バリデーションでエラーが表示され、対象処理が完了しない | bound | C-009(+EN) |
| 010 | 必須バリデーションでエラーが表示されず、対象処理を継続できる | bound | C-010（任意項目群=唯一の必須はname） |
| 011 | 登録フォームカードは出ないこと | bound | C-011 |
| 012〜015 | 相関バリデーションでエラーが表示され（ず）…（両極性） | **excluded** EX-B | — |
| 016 | DBとの相関バリデーションでエラーが表示されず、継続できる | bound | C-016（階層上限内） |
| 017 | DBとの相関バリデーションでエラーが表示され、完了しない | bound | C-017（階層超過400・形態注記あり） |
| 018 | 管理画面_商品管理_カテゴリ一覧画面に遷移すること | bound | C-018(+EN) |
| 019〜032 | 検索条件の該当レコードが取得結果に含まれる（含まれない）こと | **excluded** EX-A | — |
| 033 | 実行結果の該当レコードが取得結果に含まれること | bound | C-033 |
| 034 | 同上 | bound | C-033 (shared) |
| 035 | 同上 | bound | C-033 (shared) |
| 036 | 同上 | bound | C-033 (shared) |
| 037 | 登録内容の対象レコードが追加されること | bound | C-037 |
| 038 | 登録内容の対象レコードが追加されないこと | bound | C-038（更新はINSERTなし）＋C-045（検証NG） |
| 039 | 追加されること | bound | C-037 (shared) |
| 040 | 新規時のみ…file change、dragover/drop、クリックで隠しfile、プレビューimgであること | bound | C-008 (shared)（同上=「新規時のみ」はL1-042がsupersede） |
| 041 | 追加されること | bound | C-037 (shared) |
| 042 | （最大長指定）追加されること | bound | C-042 |
| 043 | （最大長+1指定）追加されないこと | bound | C-043(+EN) |
| 044 | （最小長指定）追加されること | bound | C-044 |
| 045 | （最小長-1指定）追加されないこと | bound | C-045 |
| 046 | （副作用）追加されること | bound | C-037,C-075 (shared) |
| 047 | 実行結果の対象レコードが追加されること | bound | C-037 (shared) |
| 048 | 管理画面_商品管理_カテゴリ一覧画面に遷移すること | bound | C-018 (shared) |
| 049 | 更新内容の対象レコードの値が変更されること | bound | C-049 |
| 050 | 値が変更されないこと | bound | C-050 |
| 051 | 値が変更されること | bound | C-049 (shared) |
| 052 | **「要ソース確認であること。」**（期待自体がプレースホルダ） | **TBD** | —（§9 TBD-1） |
| 053 | 値が変更されること | bound | C-049 (shared) |
| 054 | （最大長指定）値が変更されること | bound | C-054 |
| 055 | （最大長+1指定）値が変更されないこと | bound | C-055 |
| 056 | （最小長指定）値が変更されること | bound | C-056 |
| 057 | （最小長-1指定）値が変更されないこと | bound | C-057 |
| 058 | 値が変更されること | bound | C-049 (shared) |
| 059 | 実行結果の対象レコードの値が変更されること | bound | C-049 (shared) |
| 060 | GET /{admin_route}/product/categoryであること | bound | C-006B |
| 061 | 同一URLのフォーム表示に相当するTwigを200で再描画であること | bound | C-061 |
| 062 | 同一Twig 200、フィールドエラー表示であること | bound | C-062 |
| 063 | 共通アップロードエラー文言を該当フィールドもしくはフォームに付与であること | bound | C-063 |
| 064 | 日本語短文とカテゴリid（完了時）であること | bound | C-064（実行保留=ログ観測） |
| 065 | dtb_categoryに統合（…）であること（手動） | bound | C-001 (shared) |
| 066 | dtb_category.sort_no を採番・繰り上げであること | bound | C-002 (shared) |
| 067 | 上部に新規用フォーム（子カテゴリ作成）であること | bound | C-003 (shared) |
| 068 | 上部に編集用フォームであること | bound | C-004 (shared) |
| 069 | 検証と画像処理のあと保存し…リダイレクトすること | bound | C-005 (shared) |
| 070 | 検証後保存し…親あり/ルート分岐リダイレクトすること | bound | C-006A,C-006B (shared) |
| 071 | 登録・編集フォーム自体はモーダルにしないこと | bound | C-071 |
| 072 | 画面表示データでエラーが表示されず、対象処理を継続できること | bound | C-072 |
| 073 | 同上 | bound | C-072 (shared) |
| 074 | 検証失敗や画像失敗は200で同一Twigであること | bound | C-061,C-063 (shared) |
| 075 | DB更新、ファイル作成（新規かつ画像選択時）、失敗時の限定unlink、処理ログ、イベント通知、Doctrineキャッシュ破棄であること | bound | C-075（unlink成分はC-063の200再描画系譜・観測保留分は§9） |
| 076 | 管理画面_商品管理_カテゴリ一覧画面に遷移すること | bound | C-018 (shared) |
| 077 | 同上 | bound | C-018 (shared) |
| 078 | 同上 | bound | C-018 (shared) |

`func_scope_check` 判定: 親78/78会計済み・欠落0・理由なし重複0・補完10行は§4.2に実体掲載
（親空・excel補完4/pf md補完6〔改訂1: C-086をexcel補完へ再分類〕・母集合会計外）→
**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離。**要Excel設計書は独立集計**）

### 9.1 TBD（母集合会計のTBD=1件＋claim側TBD）

| 区分 | 件数 | 内容 |
|---|---:|---|
| **TBD-EX:要Excel設計書** | **0件（改訂1で解消）** | 初版はL1-042を「HTML変換で取り消し線喪失→矛盾→HUMAN_DECISION」としていたが、**codex R1が実物HTMLに `<span class="cell-strike">` の残存を確認**（0204:6285,6287。取り消し=「実施しない」・有効要求=「アップロード、削除、変更を実施可能とする」）。初版記載は本候補の抽出ミス（タグ剥がしでclass喪失）による**誤読であり訂正・撤回**。L1-042はExcel確定claimへ変更済み（画像は新規・編集ともアップロード/削除/変更可） |
| TBD:要ソース確認（pf md明示・ee照合は規約で禁止） | 母集合1件（-052）＋claim 3件の表示条件（L1-018/019/020） | -052は期待テキスト自体が「要ソース確認であること。」（MSG-008系のプレースホルダ）。MSG-007/008/009のja文言は共有インフラ逐語で確定済みだが**表示条件**（どの失敗でどれが出るか）はpf mdが「要ソース確認」（md:173-175）のまま。ee実装での補完は区分カスタマイズのため禁止＝pf現行mdの改訂（pf実ソース再調査）またはExcel追記を待つ |
| TBD:en文言確定不能 | claim 4件（L1-018/019/020のen＋L1-005ボタンen） | §5のとおり（en一次資料に不存在・鍵同定にee実装が必要なため規約上確定しない） |

**「要Excel設計書」TBDの最終実測値=0件**。当初前提（Excel未整備）と異なりExcel設計書は実在し（§0）、
唯一のTBD-EX候補（画像可否）も取り消し線の残存確認でExcel確定に至った。母集合会計のTBDは
-052の1件のみ（性質は「要ソース確認」型でありExcel起因ではない）。

### 9.2 要実機（実行面の保留＝オラクル化不能ではない）

1. **セレクタ全数未確定**: カスタマイズ画面のtwig/Form照合を規約で行わないため、DOM id・CSRFフィールド
   実name・画像fileキーのネスト位置・「登録フォームカード」の実セレクタは**全て要実機**
   （CFP§5の読取専用実DOM検証で前倒し可）。標準機能（twig引用でセレクタ根拠を先付けできた）との
   決定的な差＝係数悪化要因。
2. **編集モードの画像操作系（C-008/C-086）**: Excelは可否（アップロード/削除/変更可）のみ規定し
   UI部品・削除操作・確認フローを未規定。操作系のセレクタ・手順の具体は**要実機/実装確認**
   （仕様自体は確定＝TBDではない）。
3. **C-064**: アプリログ観測手段未契約（m09-01から未解消の既知事項）。
4. **C-075**: イベント通知・Doctrineキャッシュ破棄・処理ログの3副作用は観測手段未契約。
5. **C-088/C-089**: 支店/フロント側observation（cross-feature・セレクタ/URL未契約）。
6. **-EN 3行**: D15（M0 Go/No-Go）待ち。文言確定は§5で完了。
7. **SEED帯のid/シーケンス契約**: PGシーケンス補正分岐（md:278）があるため帯INSERTの
   シーケンス整合は`@TBD-D5`。

### 9.3 excluded=18件

§8集計表・根拠のとおり（EX-A 14／EX-B 4）。全行の期待テキストを実際に引いて確認済み・偽陰性なし
（一覧反映成分はC-033系がbound被覆・DB相関成分は-016/-017がbound）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず** | -009,-017（され）vs -010,-016,-072,-073（されず） | -009→C-009（NotBlank拒否側）・-017→C-017（400拒否側）／-010→C-010（任意項目=許可側・L1-010〜013）・-016→C-016（上限内許可側）・-072/-073→C-072（初期表示正常系）。取り違えなし |
| 追加され**る**/され**ない** | -037,-039,-041,-042,-044,-046,-047（肯定）vs -038,-043,-045（否定） | 肯定→C-037/C-042/C-044（新規INSERT成功系。**本機能は新規経路が実在するため肯定側もbound**=m10-11のEX-Dとは前提が異なる）／否定→C-038（更新は非INSERT）・C-043/C-045（検証NG）。整合 |
| 変更され**る**/され**ない** | -049,-051,-053,-054,-056,-058,-059（肯定）vs -050,-055,-057（否定） | 肯定→C-049/C-054/C-056（更新成功系）／否定→C-050/C-055/C-057（検証NG・DB不変系）。整合 |
| 含まれる/含まれない（検索条件） | -019〜-032 | 両極性ともEX-A（検索機能不存在）＝極性によらず除外。**「実行結果…含まれる」（-033〜-036）は主語が検索条件でないためboundへ**（C-033）＝除外しすぎの誤りなし |
| 出る/出ない（フォームカード） | -003,-004,-007（出る）vs -011（出ない） | -003/-004/-007→C-003/C-004/C-007（親あり・編集モード）／-011→C-011（親null）。条件分岐（親の有無）と極性の対応一致 |
| 完了する/しない（リダイレクト有無） | -005,-006,-018,-048,-060,-076〜-078（成功遷移）vs -061,-062,-074（200滞留） | 成功系→C-005/C-006A/B/C-018／失敗系→C-061/C-062/C-063（200・リダイレクトなし=L1-024）。302と200の取り違えなし |
- -052は期待自体がプレースホルダのためどの極性にもbindせずTBD（無理な救済bindをしない）。
- **excel-primary固有のC4項目（改訂1で訂正）**: 画像可否（L1-042）は取り消し線 `cell-strike` の
  残存確認により**有効/無効の極性が原資料内で確定**（取り消し=「実施しない」・有効=「実施可能とする」）。
  初版が「両文併記=極性未確定」としたのは抽出ミスによる誤読で、codex R1指摘により是正した
  （**捏造ゼロ規律違反となり得た誤記の訂正記録**）。
- pf md en列の齟齬2件（MSG-001/010）は「en一次資料逐語のみ」ルールで機械的に裁定（§5に記録）。
- **codex敵対レビューR1（2026-07-23・要修正判定→改訂1で是正済み）**: 検出=
  ①**Blocker1**: 画像仕様の誤読・虚偽のTBD化（cell-strike残存の見落とし）→L1-042をExcel確定へ・
  L1-005/006/014/023・C-007/C-008/C-086を「新規・編集とも可」へ再具体化・L1-023はsuperseded退避。
  ②**Blocker2**: ee出典の実質オラクル利用（L1-009/011/027のsource欄のee eccube.yaml参照・
  pf md自身のee確認値記載）→ユーザー方針（Interpretation A・規約リテラル=§0）で裁定: 値はpf md
  踏襲値としてbound維持・ee参照はsource欄から除去（3claim付け替え）。
  ③Major: 255/3000/400等の踏襲値の扱い→同方針で解決。④EX-A 14件はcodex妥当確認・EX-B 4件は
  条件付き妥当（pf md逐語裏付けを§8に追記）。ja/en確定3件は現物一致の確認済み。
  C4対象の極性取り違えは①以外に検出されず（未検出の可能性は残る）。この改訂1はcodex再確認待ち。

---

## 作業時間・工数係数の実測記録（W2目的＝excel-primary係数）

- **読了した一次資料**:
  - Excel設計書HTML 1本（0204 sheet-25=行6182-6480を精読＋全体構造・目次・sheet境界の確認。
    **10.4MB/14,228行のHTMLから対象sheetを特定・抽出する前処理が必要**だった=標準機能に無い工数）
  - pf現行md 1本（305行・全文精読）
  - 共有インフラ5（messages.ja/en.yaml・validators.ja/en.yaml・vendor xlf ja/en=grep+該当行精読）
  - 照合補助1（eccube.yaml確認値3件の一致を参考照合。**改訂1でL1根拠から除去=参考のみ**）
  - 台帳・統治・見本6（all_it_cases.tsv抽出78行・fid_kubun.tsv・CFP・m10-11草案・oracle.ts・出力先確認）
  - **計約14ファイル（うち期待値根拠に使ったのは8: Excel1＋pf md1＋locale/xlf6）**。
    m10-11（標準・約37ファイル/うちeeソース13）と比べ**読了ファイル数は少ないが、1ファイルあたりの
    調査コストが高い**（巨大HTMLのsheet特定・タグ剥がし・行番号付け）。
- **L1 claim数**: **43**（改訂1: excel 9＋pf-fallback 33＋superseded 1〔L1-023〕。うち共有インフラ逐語併用6）。
- **母集合78行の期待テキスト読解・分類**: bound59/TBD1/excluded18。
- **excel-primary固有の難所（実測）**:
  1. **指示前提の誤り検出**: 「Excel未整備」が事実でなく、0204 sheet-25にM03-11のExcel設計が実在
     （捏造ゼロ規律により前提を訂正して採用。見落とすとpf回帰のみで書き全deltaがTBD化していた）。
  2. **ee実ソース逐語が使えないことの影響**: (a)セレクタ・DOM id・CSRFフィールド名・request契約の
     詳細が**全数「要実機」化**（標準機能はtwig/Form引用で先付けできた）。(b)PHPUnitによる挙動裏取り
     （m10-11のL1-002/021/032相当）が一切使えず、pf mdの記述精度に全面依存。(c)en文言の鍵同定が
     できず**en確定率が低下**（LS=1のうちen確定3/7claim。m10-11は9/9確定）。
  3. **Excel HTMLの読取には書式クラスの検査が必須（改訂1の教訓）**: 初版はタグ剥がし抽出で
     `<span class="cell-strike">`（取り消し線）を落とし、有効要求と破棄済み要求の併記を「矛盾」と
     誤読した（L1-042・codex R1のBlocker検出→是正）。**取り消し線はHTMLに保存されており原資料内で
     一意に確定可能だった**。excel-primary量産では抽出パイプラインに書式クラス
     （cell-strike等）の保全を組み込むこと（係数上の再発防止項目）。
     Excel画面項目一覧は必須/最大値/初期値が全行「-」＝**制約値はExcelだけでは1件も確定できない**
     （pf回帰が必須。ユーザー方針Interpretation Aで踏襲値boundを許可）。
  4. pf md内の英語列の齟齬2件（保存/NotBlankのen）を共有インフラで裁定する追加検証。
  5. **codexレビューR1の是正工数（改訂1）**: 画像仕様の再具体化（L1 5件・ケース3行・§3/§9/§10）＋
     ee出典の付け替え3claim ≈0.75h相当。
- **pf mdだけで確定できた割合（改訂1再計算）**: L1 43claimのうちpf-fallback主体=33（77%。
  うちL1-005/006/014の3件は画像適用範囲のみexcelが上書き・L1-023はsuperseded退避）、
  excel主体=9（21%）、superseded=1（L1-023）。**bound 59行の候補35ケースのうち31ケースはpf md
  根拠のみで成立**（excel根拠を要したのはC-007/C-008/C-086/C-087/C-088/C-089）。
- **推定実働**: 一次資料調査・抽出 ≈2.5h相当（うちExcel HTML前処理・sheet特定 ≈1h）／
  L1表・TSV・78対応表の起草 ≈2.5h相当（型再利用で文書設計コストほぼゼロ）。
  **標準機能（m10-11）比の係数所感: 総工数はほぼ同等だが内訳が逆転**（標準=ソース読解が重い／
  excel-primary=資料特定・矛盾裁定・「確定できないことの確定」が重い）。要実機残（セレクタ全数）が
  実装waveへ後送りされるため、**機能単位の総コストは標準より増える**見込み。
