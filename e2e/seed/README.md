# E2E シードデータ基盤（EC-CUBE Enterprise / PostgreSQL）

結合テストケース（`integration_test/e2e/*_e2e_cases.md` の付帯表3）に従って Playwright を
正常系・異常系すべて実行できるようにするための、**べき等なシードデータ**一式。

- 方式: **SQL + CSV ハイブリッド**。DB状態は SEEDセット単位の SQL（UPSERT＋シーケンス再同期）で稼働Postgresへ流し込み、
  CSV取込テストの入力CSVは `../fixtures/csv/` に別途用意する。
- 対象DB: PostgreSQL（`docker-compose.pgsql.yml`。primary はホスト `:15432`）。
- スキーマの正典: `ec-cube-enterprise/src/Eccube/Entity/**`（Doctrine属性）。本シードは稼働DBの実スキーマに合わせて作成済み。

## 構成
```
seed/
  README.md         このファイル
  id-bands.md       予約固定IDの登録簿（衝突防止）
  manifest.json     唯一の正: SEED id -> {tables, fixedIds, envVars, e2eCaseIds, dataSource, teardown}
  lib/
    _helpers.sql    seed_resync(table,col,floor)（IDENTITY採番の再同期）
    apply.sh        べき等適用（manifest順 / 指定セット）
    teardown.sh     撤去（*.down.sql を逆順）
    seed-env.sh     manifest の envVars を「export KEY=VAL」で出力
  sets/<module>/SEED-*.sql (+ .down.sql)
```

## 前提（稼働環境）
- web `http://localhost:8080`（admin=`admin`/`password`、2FA無効、`base_info_id=2` テナント）
- postgres primary `postgres://dbuser:secret@localhost:15432/eccubedb`（`dbuser` は superuser＝RLSバイパス）
- mailcatcher SMTP `:1025` / UI `:1080`（送信系の隔離先）

## 実行ワークフロー
```bash
# 0) 初回/リセット時のみ（非べき等。基盤データ）
#    docker exec ec-cube-enterprise-ec-cube-1 bin/console eccube:install
#    docker exec ec-cube-enterprise-ec-cube-1 bin/console eccube:fixtures:load

# 1) シード適用（何度でも再実行可）
e2e/seed/lib/apply.sh
# 個別: e2e/seed/lib/apply.sh SEED-M05-ORDERS

# 2) CSV取込テスト用の揮発フィクスチャ生成（oversize/PNG。gitignore）
e2e/fixtures/csv/lib/gen-volatile.sh

# 3) シード↔spec契約を環境変数へ反映
eval "$(e2e/seed/lib/seed-env.sh)"

# 4) Playwright 実行（e2e/ から）
cd e2e && E2E_BASE_URL=http://localhost:8080 ECCUBE_ADMIN_USER=admin ECCUBE_ADMIN_PASS=password \
  npx playwright test spec/admin/m05 spec/admin/m14

# 5) 撤去（任意）
e2e/seed/lib/teardown.sh
```

接続先の上書き: `SEED_DB_URL=postgres://user:pass@host:port/db e2e/seed/lib/apply.sh`

## べき等性の要点
- 固定ID＋`ON CONFLICT ... DO UPDATE`。再適用は収束（件数不変・エラー無）。
- IDENTITY列は投入後 `seed_resync(table,col,900000999)` で採番を帯上へ押し上げ、アプリ自動採番との衝突を防ぐ。
- 撤去は `.down.sql`（子→親、帯ID＋マーカー）。撤去後は `seed_resync(...,0)` で自然maxへ戻す。

## セット一覧（パイロット）
| セット | 用途 | 正常/異常 |
|---|---|---|
| SEED-M14-05-MASTER | カードCSV取込の参照マスタ保証＋テスト用カードセット | 成功系(valid/multivalue)の裏付け |
| SEED-M05-ORDERS | 受注一覧/ページング/並替/一括（40件） | 一覧データ依存ケースの解禁 |
| SEED-M05-15-ORDER | 受注メール通知の非破壊参照受注（ORDER_ID） | 表示・遷移・必須の正常/異常 |
| SEED-M05-15-TEMPLATE/-DEFAULT-TPL/-MISSING-TPL | メールテンプレ3態（正常/既定/欠落） | テンプレ選択の正常/異常 |
| SEED-F06-CUSTOMER | 会員変更用の既存会員 | 変更系（登録はユニークemail合成） |
| SEED-M05-PATTERN | 検索パターン | **deferred**（bytea採取要。spec は fixme 継続） |

異常系（送信・サイズ超過・MIME・マスタ欠落）の一部は「シードではなく入力データ側」で表現する（`../fixtures/csv/`）。
`SEED-M05-15-SENDABLE`（実送信）は mailcatcher へ送る使い捨て受注＝UI合成で扱う（spec は fixme）。

## スコープ（重要）
本ディレクトリは合意済みの **基盤＋パイロット** スコープ。規約・べき等テンプレ・適用/撤去/契約の仕組みと、
代表機能（m05-01 / m05-15 / m14-05、加えて f06・m03枠）を正常/異常フル網羅で整備した。
`integration_test/e2e/*_e2e_cases.md` の付帯表3が定義する **他モジュールの SEED（例 SEED-M05-06/14/19/20/24/26/27… 等）は本パイロットには含めない**。
それらは本規約（固定IDバンド＋UPSERT＋seed_resync＋.down＋manifest envVars＋fixtures/csv）に沿って
モジュール単位で追加拡張する（`sets/m03/README.md` が拡張手順の雛形）。

## 検証済み（稼働インスタンス）
- apply.sh 2回でべき等（帯内件数不変・エラー無）。seed_resync 後の採番は 900001000+ で衝突無し。
- m05-01 受注一覧＝41件で決定的表示（全件可視ステータス）。編集リンク遷移(070)・一括(071) 実行成功。
- 受注編集画面 `/admin/order/{ORDER_ID}/edit`＝200（明細に product/product_class 参照必須）。メール画面＝200。
- m14-05 CSV：valid/multivalue/cmc_empty=成功、header/empty/column/required/master/tsv=期待どおりエラー（実importerで確認）。
