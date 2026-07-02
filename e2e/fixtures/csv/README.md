# CSV取込テスト用 入力フィクスチャ

`*_csv_import` 系機能の Playwright テストで実アップロードする入力CSV。1ファイル=判定順序の1ステップ。
DB前提（参照マスタ等）は `../../seed/`（SQLシード）側で用意する。

## 規約（横展開）
- フォルダ = `<import_slug>/`（機能ごと）。ファイル名 = シナリオ名（判定順序の各ステップに対応）。
- **正典は実装**（`ec-cube-enterprise/src/Eccube/Service/Csv/*`）。列順・必須列・除外キーは実装のstaticメソッドに一致させる。
- 成功系(valid)のマスタ参照値は、対応する `SEED-*-MASTER` シードが裏付ける。
- 揮発ファイル（サイズ超過・不正MIME）は生成物（`lib/gen-volatile.sh`）で、コミットしない（`.gitignore`）。

## 環境前提（重要）
- CSV取込は一時保存ディレクトリ `/var/ec-cube/var/tmp/upload` へ書き込む。web(www-data)が書けないと
  内容以前に「Unable to write ... upload」で失敗する。テスト環境では一度だけ:
  ```bash
  docker exec -u 0 ec-cube-enterprise-ec-cube-1 chmod -R 0777 /var/ec-cube/var/tmp
  ```

## card_csv_import（m14-05 カードCSV登録）
- 正典: `ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php`
  - 論理キー順=`getCsvHeader()`（35キー）／必須=`[name_en, rarity, layout, image_en]`／ヘッダ除外=`[card_detail_id, keyword_ability]`
  - ファイルは除外2キーを省いた **33列**（列数チェックの基準）。
- 生成: `node lib/gen-card-fixtures.mjs`（静的CSV）＋ `bash lib/gen-volatile.sh`（oversize/PNG）。
- 取込後の後始末（非べき等対策）: `psql ... -f card_csv_import/cleanup-imported.sql`（`name_en LIKE 'E2E Test Card%'` を子孫含め撤去）。

### シナリオ↔判定順序↔観測（稼働インスタンスで確認済み）
オラクル独立性: specの合否は「成功/エラーの区分＋観測可能な副作用（カード作成の有無・遷移）」で判定する。
下表の「観測フラッシュ」は実機で確認した参考値であり、i18n表示文言の厳密一致をspecのオラクルにしない。

| ファイル | 判定順序 | 区分 | 観測フラッシュ（参考） |
|---|---|---|---|
| valid.csv | #7/#8 成功 | SUCCESS＋カード作成 | 「登録が完了しました。」（`set=E2E Test Set` でカードセット照合も通過） |
| multivalue.csv | 業務ルール | SUCCESS | color/cardtype 多値/重複を許容 |
| cmc_empty.csv | #6 例外規則 | SUCCESS＋カード作成 | cmc空→0で継続。「登録が完了しました。」 |
| tsv_rejected.tsv | #1 拡張子 | DANGER | 「TSVファイルはアップロードできません。CSVファイルをアップロードしてください。」（**実装はtsv拒否**＝doc乖離） |
| header_mismatch.csv | #3 ヘッダ | DANGER | 「CSVのフォーマットが一致しません。」 |
| empty_data.csv | #4 データ0行 | DANGER | 「CSVデータが存在しません。」 |
| column_count_mismatch.csv | #5 列数 | DANGER | 「CSVのフォーマットが一致しません。 2 行目のデータを確認してください。」 |
| missing_required_name_en.csv | #6 必須空 | DANGER | 「カード名(英語) は必須項目です。 2 行目…」 |
| missing_required_rarity.csv | #6 必須空 | DANGER | 「レアリティ … は必須項目です。 2 行目…」 |
| master_not_found.csv | #7 マスタ存在 | DANGER | 「レアリティ : NoSuchRarityXYZ がマスターから取得できません。 2 行目…」 |
| oversize.csv | #1 サイズ | DANGER | 上限(5MB)超で拒否（生成物） |
| invalid_mime.png | #1 MIME | DANGER | 許可MIME外で拒否（生成物） |

> 取込は非べき等（英名キーで上書き）。成功系を流したら `psql ... -f card_csv_import/cleanup-imported.sql` で
> `name_en LIKE 'E2E Test Card%'` のカードを子孫含め撤去し、次回を決定的にする。

> 実ルート（enterprise）: アップロード画面 GET `/admin/card/csv_upload`、取込 POST `/admin/card/import`、
> フォームフィールド `admin_csv_import[import_file]`。設計docの `/card/csvimport` とは異なる（`../seed/DIVERGENCES.md`）。

## product_goods_csv_import / product_price_csv_import（m03系）
- スケルトンのみ。各フォルダの README に従い、対応する importer（`Controller/Admin/Product/Csv/*`, `Service/Csv/*`）の
  実必須列・実ヘッダで同じシナリオ名のファイルを用意する。成功系は `SEED-M03-*` の商品/価格を参照する。
