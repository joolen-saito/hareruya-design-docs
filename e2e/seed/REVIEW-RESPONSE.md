# codex 批判的レビューへの対応記録

`codex exec --sandbox read-only`（v0.142.4）で e2e/seed・e2e/fixtures/csv を5観点レビューし、11件の指摘を受領。
各対応は下記。高/中は是正済み、スコープ由来は方針を明記。

| # | 深刻度 | 指摘 | 対応 |
|---|---|---|---|
| 1 | 高 | `SEED-M05-ORDERS.down` が `SEED-M05-15-ORDER`(301/401/501)・共有会員まで削除（セット間破壊） | **是正**: 自セット帯(311..350等)のみ削除。共有会員は「参照受注が無い時のみ」条件付き削除。稼働DBで teardown 単独→非破壊を確認 |
| 2 | 中 | `SEED-M05-15-ORDER.down` 単独で共有会員が残る | **是正**: 同様に条件付き削除。フル撤去で会員も0になることを確認 |
| 3 | 高 | `SEED-M05-PATTERN` が `\q` 即終了の未完成テンプレ | **方針明記(deferred)**: `dtb_search_pattern.pattern` が bytea(PHPシリアライズ)のため UI採取→凍結が必要。manifest.dataSource/README に deferred と明記、spec は 081/082/083 を fixme 継続。apply では無害スキップ |
| 4 | 高 | m05 付帯表3の SEED 大半が未実装（M05-06/14/19/20/24/26/27…） | **方針明記(スコープ)**: 合意済み「基盤＋パイロット」。代表機能(m05-01/15, m14-05, f06, m03枠)をフル網羅。他モジュールは本規約で拡張（README「スコープ」節・sets/m03/README が雛形） |
| 5 | 中 | status を1..10で分散＝既定検索が CANCEL/PASSED を除外し件数がずれる | **是正**: 可視ステータス{1,2,4,5,6}のみに変更。稼働DBで一覧=41件の決定的表示を確認（CANCEL=3/PASSED=14 を実装で確認） |
| 6 | 中 | `valid.tsv` を成功扱いだが実装は拡張子csv以外を拒否 | **是正**: `CardCsvController.php:96` を確認（`admin.card.csv_tsv_not_allowed`）。`tsv_rejected.tsv` に改名し異常系化。稼働DBで拒否メッセージを確認。DIVERGENCES に記録 |
| 7 | 中 | 成功系CSVの `set` 列が空でカードセット照合を検証しない | **是正**: `valid.csv` に `set=E2E Test Set`（SEED-M14-05-MASTER の mtb_cardset）を追加。稼働DBで成功を確認 |
| 8 | 中 | m14 の format/subtype/specialtype 等のマスタ未整備 | **方針明記(拡張)**: パイロットの成功CSVは必須4列＋set＋cardtype/colorで成立。追加マスタは業務ルール系ケース拡張時に同規約で追加 |
| 9 | 中 | 取込で生成され得る mtb_illustrator が cleanup 対象外 | **確認/方針**: 現フィクスチャは illustrator 空＝新規作成しないため汚染なし。illustrator値を使うケース追加時は `E2E Test` 接頭辞＋cleanup拡張 |
| 10 | 低 | README の「実測フラッシュ」固定文言がオラクル独立性と衝突 | **是正**: 「参考値。specは成功/エラー区分＋観測副作用で判定し、i18n文言の厳密一致をオラクルにしない」と明記 |
| 11 | 低 | seed.config.ts の env が少数のみ（他spec要求名を未網羅） | **方針明記(スコープ)**: パイロット対象specの契約のみ。他モジュールの env は SEED 追加時に manifest.envVars へ足し seed.config へ反映 |

## 再レビュー（focused codex 2回目）で残った指摘への対応
- **高: f06 がダミーハッシュで実ログイン不可** → **是正**: コンテナの hasher(algorithm:auto が bcrypt検証可)で平文 `password` の
  実bcryptハッシュ `$2y$10$...` を生成し `SEED-F06-CUSTOMER.sql` に設定（`password_verify`=OK を確認）。
  front ログインは `ECCUBE_FRONT_USER=e2e-f06-member@example.test` / `ECCUBE_FRONT_PASS=password`。
  注: 稼働環境の front 既定 `/mypage/login` は 404（**マルチテナント front のルーティング**でテナント2の店舗URL/base が別）。
  会員データ自体は認証可能。front 実ルートは環境の店舗URL設定に合わせて `E2E_BASE_URL`/店舗パスで解決する（シード外の環境事項）。
- **中: m05-01 検索パターン(081-083)** → deferred のまま（bytea採取要）。spec は fixme 継続。スコープ内で「保留の明示」。
- **低: manifest の teardown 説明ズレ** → **是正**: `SEED-M05-15-ORDER` の teardown 説明を「両down共通の条件付き削除」に修正。

## 追加で発見・是正（検証中に判明。codex外）
- **seed_resync の空テーブル不具合**: 撤去後の空テーブルで `setval(seq,0,true)` が範囲外エラー→teardown が中断していた。
  `newval<1` は `setval(seq,1,false)` に分岐して修正。フル撤去がクリーンに完了することを確認。
- **受注編集画面404**: `getOrderItemList` が `innerJoin(oi.Product/ProductClass)`。明細に既存 product(1)/product_class(1) を
  参照させて 200 化（DIVERGENCES に記録）。
- **受注一覧の可視化**: 検索が `innerJoin(s.Country/s.Pref)`。配送に country_id=392/pref_id=13 を付与（DIVERGENCES）。
- **アップロードtmp権限 / DBバックエンド / デバッグツールバー**: 環境前提として DIVERGENCES・README に明記。
