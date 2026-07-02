# 設計ドキュメント↔実装 の乖離メモ（シード/CSV作成中に発見）

シード・CSVは**実装（＝稼働スキーマ/実importer）を正**として作成した。以下は設計doc（付帯表3や pf-eccube3 由来記述）との相違。
本来は各 `_e2e_cases.md` の付帯表4（不具合候補・要確認）へ反映すべき項目。テストの期待値は設計由来のままにし、
シードは実スキーマに合わせる（オラクル独立性）。

## m14-05 カードCSV
- **必須列**: doc=`name_en,cmc,rarity,layout,promotion_flg,image_en`（6列）／実装=`name_en,rarity,layout,image_en`（4列）。
  `cmc`/`promotion_flg` は任意（`CardCsv::getRequiredCsvHeaderKeys()`）。
- **ヘッダ除外キー**: 実装=`card_detail_id, keyword_ability`（`getNotRequiredCsvHeaderKeys()`）。
- **論理キー**: 実装は `promotion_type / foil / frame / restriction_format / ban_format / color_identity / arena_format_name_*` を持つ。
  doc の `promotion / foil_flg / promotion_flg` 等とキー名が異なる（`getCsvHeader()` を正とする）。
- **参照マスタ表**: レイアウトは `mtb_card_layout`（付帯表3の `mtb_layout` は誤り）。
- **TSV拒否**: 実装 `CardCsvController.php:96` は拡張子が `csv` 以外を `admin.card.csv_tsv_not_allowed`（「TSVファイルはアップロードできません…」）で拒否する。
  設計doc（m14-05）の「拡張子tsvならタブ区切りで取込」とは相違。→ tsv は成功系ではなく**異常系**として扱う（`fixtures/csv/card_csv_import/tsv_rejected.tsv`）。
- **ルート**: 実装=GET `/admin/card/csv_upload` ＋ POST `/admin/card/import`（doc の `/{admin_route}/card/csvimport` と相違）。
  取込本体は `Controller/Admin/Card/CardCsvController.php`、フォーム `Form/Type/Admin/CsvImportType.php`（block prefix `admin_csv_import`）。

## m05 受注一覧（可視化に必須のシード条件）
- admin受注検索クエリ（`OrderRepository::getQueryBuilderBySearchDataForAdmin`）は
  `innerJoin('s.Country')` / `innerJoin('s.Pref')` / `innerJoin('o.Customer')` を持つ。
  → シード受注は **配送(dtb_shipping)に country_id/pref_id、受注に customer_id が必須**（NULLだと一覧に一切出ない）。
- 既定検索は CANCEL/PASSED ステータスを除外（`notIn(o.OrderStatus, [CANCEL, PASSED])`）。
- `multi` 自由検索は company_name/message/note/product_code を対象（order_no ではない）。

## 環境
- コンテナ実行時 `DATABASE_URL=postgres://dbuser:secret@postgres_primary/eccubedb`（compose環境が .env の sqlite を上書き）。
  → アプリの実DBは PostgreSQL。`.env` の `sqlite:///var/eccube.db` は未使用（空ファイル）。
- CSV取込の一時ディレクトリ `/var/ec-cube/var/tmp/upload` は www-data 書込可にする必要がある（既定は ubuntu:ubuntu 755）。
- `dbuser` は superuser のため RLS はバイパスされる。RLS(tenant)ポリシーは base_info_id=current_setting で絞るが、
  シードは base_info_id=2（admin=login_id 'admin' のテナント）で作成しているため一致する。
- **Symfony Web Debug Toolbar**: dev モードではツールバー(`#sfToolbar...`)がクリックを intercept し、
  リンク/ボタン押下系のE2Eが timeout する。**シード起因ではない**。→ E2E は **APP_ENV=prod** で実行してツールバーを消す。

## E2E をこの環境で実行するための前提（prod で確定）
1. **APP_ENV=prod / APP_DEBUG=0** で ec-cube を起動（ツールバー除去）。compose の env を上書きして ec-cube のみ再作成:
   `APP_ENV=prod` + override(APP_DEBUG:0) で `docker compose ... up -d --no-deps ec-cube`。再作成後は `var` を書込可に
   （`chmod -R 0777 /var/ec-cube/var`。prodキャッシュ `var/cache/prod` と 一時 `var/tmp/upload` の作成に必要）。
2. **HTTPS で実行**: prod はセッション cookie が `cookie_samesite: none` + `cookie_secure: auto`。**HTTP ではブラウザが
   cookie を保存できずログインが継続しない**。TLS 終端の caddy 経由 **`E2E_BASE_URL=https://localhost:4431`** を使う
   （playwright.config は `ignoreHTTPSErrors: true`）。HTTP:8080 直では admin ログインが `/admin/login` に戻る。
3. **ログイン試行制限**: prod は `eccube_login_throttling_max_attempts: 5`（成功/失敗問わず全試行をカウント・interval 30分）。
   spec は per-test でログインするため 25テスト×ログインで即ロックする（dev は 30 に緩和済み）。
   → E2E 用に `app/config/eccube/packages/prod/eccube_e2e_login_throttling.yaml` で 1000 に緩和（dev と同方針・可逆）。
   ロックされたら `docker exec redis redis-cli FLUSHALL` でリセット（セッションも消える）。
4. **セッション/レートリミッタは Redis**（コンテナ名 `redis`）。**CSV取込一時dir** `/var/ec-cube/var/tmp/upload` を www-data 書込可に。

## spec のセレクタ/待ちの実装整合（実装=正で修正済み）
- m05-01 Page Object: `#search_clear` は詳細検索枠 `#searchDetail`(collapse) 内 → `clearSearch()`/test004 は開いてから操作。
  `submitSearch()`/`sortByKey()` は JS の form submit 完了を `waitForLoadState('networkidle')` で待つ。表示件数変更は
  `page.waitForURL()` で遷移完了を待つ（`admin_order_page` は page_no のみのルートで page_count はクエリ）。
- m14-05 spec: `CANONICAL_HEADER` を実装 `CardCsv::getCsvHeader()`（除外2キーを外した33キー）に一致させ、
  必須キー確認を実装 `getRequiredCsvHeaderKeys()`=`name_en,rarity,layout,image_en` に整合。ファイル未選択は
  `import_file` の HTML5 `required` によりクライアント側でPOST抑止＝サーバflash無し（`valueMissing` と同画面滞留で観測）。
