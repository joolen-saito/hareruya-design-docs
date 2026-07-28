# 現行リポジトリ・リバース設計整合性監査（一次監査）

- 監査日: 2026-07-28
- 対象設計:
  - `functions/pf-eccube3/*.md`
  - `functions/pf-api/*.md`
- 対象実装:
  - `pf-eccube3` (`4bc7695597`)
  - `pf-api` (`90719e19`)
  - `deck-api` (`a146a162`)
- 判定基準:
  - source → design（実装に存在する入口・分岐・設定が設計に落ちているか）
  - design → source（設計に書かれた入口・処理が実装に存在するか）
  - 現行挙動は現行リポジトリ、移行先DB・更新後仕様は `ec-cube-enterprise` と出典を分離する

## 結論

**「抜け漏れ・捏造なし」とは判定できない。現行実装との不一致および出典混同を確認した。**

> 是正状況（2026-07-28）: H-01〜H-03の誤帰属は是正済み。対象13設計に、
> 「利用者視点の入口を含む本文は移行先 `ec-cube-enterprise` のリバース結果」
> 「現行 `pf-eccube3` は移植元・比較対象」と明記した。URL・処理内容などの仕様本文は
> 変更していない。M-01以降の抜け漏れ候補は未変更である。

特に `functions/pf-eccube3` の店頭買取・ネット買取設計では、現行
`pf-eccube3` の挙動ではなく `ec-cube-enterprise` の更新後挙動を本文の確認値にしており、
現行リポジトリのリバース設計として読むと誤りになる。代表例の手動メール通知では、
更新後実装の単一URL・`mode` 分岐が現行設計として記載されている一方、現行実装は
確認・完了を別URLで処理している。

今回の識別子照合では、記載されたファイル名・クラス名・メソッド名がどのリポジトリにも
存在しないという意味での明白な「架空ソース」は確定しなかった。ただし、正しい実装由来で
あることを行番号付きで追跡できない設計が大半であり、**意味上の捏造がないことまでは証明
できない**。

## 集計

| 観点 | 結果 | 判定 |
|---|---:|---|
| 設計Markdown | 332件（`pf-eccube3`: 268、`pf-api`: 64） | 母集団 |
| `functions/todo-list.md` から参照される正規設計 | 318件 | 監査の主対象 |
| todo-listから参照されない設計 | 14件 | 要整理 |
| `file:line` 形式の実装根拠を1件以上持つ正規設計 | 13 / 318件 | 不十分 |
| 行単位根拠を持たない正規設計 | 305 / 318件 | 合否判定不能 |
| `要確認` を含む正規設計 | 118 / 318件 | 未完了 |
| `pf-api` の実装ルート | 63件 | 全件機械照合 |
| `deck-api` の実装ルート | 17件 | 全件機械照合 |

## 確認済みの不一致

### H-01: 現行挙動と移行先挙動の出典が混同されている（是正済み）

重要度: High

次の13件は `functions/pf-eccube3` 配下にあるが、挙動の確認値を
`ec-cube-enterprise` としている。

- `batch_s3_file_sync.md`
- `m06-01_admin_store_purchase_purchase_store_search_list.md`
- `m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.md`
- `m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md`
- `m06-04_admin_store_purchase_purchase_store_status_change.md`
- `m06-05_admin_store_purchase_purchase_store_history.md`
- `m06-06_admin_store_purchase_purchase_store_history_csv_export_all.md`
- `m07-01_admin_online_purchase_purchase_online_search_list.md`
- `m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.md`
- `m07-03_admin_online_purchase_purchase_online_buy_order_edit.md`
- `m07-04_admin_online_purchase_purchase_manual_mail.md`
- `m07-05_admin_online_purchase_purchase_csv_export_deposit.md`
- `m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md`

例:

- `functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md:7-9`
  は `ec-cube-enterprise` を挙動の確認値とする。
- 同ファイル `:23` は「現行実装からのリバース」と記載しており、同一文書内でも
  出典方針が矛盾する。
- `functions/pf-eccube3/batch_s3_file_sync.md:7,16-17` は、現行踏襲としながら
  挙動・DBの双方を `ec-cube-enterprise` のみで確定している。

したがって、これらは「移行先の詳細設計」としては利用できても、
「現行 `pf-eccube3` のリバース設計」としては利用できない。

### H-02: 手動メール通知に更新後のルーティングを記載している（誤帰属是正済み）

重要度: High

設計:

- `functions/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.md:23-26`
  は change / confirm / complete / back をすべて
  `POST /purchase/{id}/mail` の `mode` 分岐としている。

現行 `pf-eccube3`:

- `app/Plugin/HareruyaEc/ServiceProvider/Admin/PurchaseServiceProvider.php:52-56`
  - テンプレート変更: `POST /purchase/{id}/mail`
  - 確認: `POST /purchase/{id}/mail/confirm`
  - 完了: `GET, POST /purchase/{id}/mail/complete`
- `app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:54-88,98-128,139-172`
  でも各処理は別メソッドである。

移行先 `ec-cube-enterprise`:

- `src/Eccube/Controller/Admin/Purchase/MailController.php:50-149`
  が、設計どおり単一ルート内の `mode` switch になっている。

よって、架空仕様ではないが、**移行先仕様を現行リポジトリ由来として扱った誤帰属**である。

### H-03: 店頭・ネット買取のURLが現行ルートと一致しない（誤帰属是正済み）

重要度: High

| 設計 | 設計記載 | 現行 `pf-eccube3` |
|---|---|---|
| m06-01 `:40` | `POST /otcbuyorder` | `/otcbuyorder/search` (`OtcBuyOrderServiceProvider.php:18-23`) |
| m06-03 `:45-47` | `register-individual-stock`, `account_team_paid`, `restocked` | 該当ルートなし。現行更新は `/{id}/update` (`:27-34`) |
| m06-04 `:37-38` | `account_team_paid`, `restocked` | 該当ルートなし |
| m06-05 `:33` | `POST /otcbuyorder/history` | `/otcbuyorder/history/search` (`:38-44`) |
| m06-06 `:32` | `POST /otcbuyorder/history` | `/otcbuyorder/history/search` (`:38-44`) |
| m07-01 `:20,24` | `/purchase/search` | `/purchase/search/{page_no}` (`PurchaseServiceProvider.php:19-23`) |
| m07-02 `:21,23` | `/purchase/csv_export` | `/purchase/csvexport` (`:37`) |
| m07-03 `:31-33` | `csv_export`, `csv_export_product_list`, `register-individual-stock` | `csvexport`, `csvexport/product_list`; 個別登録ルートなし (`:37-49`) |
| m07-05 `:21` | `/purchase/csv_export_deposit` | `/purchase/csvexport/deposit` (`:39`) |
| m07-06 `:21-25` | `/purchase/csv_export_product_list` | `/purchase/csvexport/product_list` (`:41`) |

これらの多くは `ec-cube-enterprise` では実在するため、H-02と同様に
「存在しない仕様の創作」よりも「対象リポジトリの取り違え」に分類する。

## 抜け漏れ候補

### M-01: `pf-api` の現行ルートが設計入口に存在しない

重要度: Medium（プロジェクト対象外なら対象外理由の明記で解消可能）

`pf-api/config/routes.yaml` の63ルートと、各設計の「利用者視点の入口」に記載された
HTTPメソッド・パスを照合した。次の13ルートは同一controllerの別名ルートも含めて
設計入口が見つからず、機能単位で未収載である。

- `GET /products/{id}` (`routes.yaml:81-84`)
- `GET /productRanking` (`:117-120`)
- `GET /productRanking.json` (`:121-124`)
- `POST /articles.json` (`:141-144`)
- `GET /customers/{id}` (`:183-186`)
- `GET /deck/usage_analysis/{formatId}` (`:187-190`)
- `GET /eventDetails/{id}` (`:191-194`)
- `GET /max_id/{tableName}.json` (`:203-206`)
- `GET /max_id/{tableName}` (`:207-210`)
- `GET /recentCardsetProductRanking` (`:211-214`)
- `GET /recentCardsetProductRanking.json` (`:215-218`)
- `GET /recentCardsetProductRareRanking.json` (`:219-222`)
- `POST /product/search_error` (`:247-250`)

さらに次の8件は、同じcontroller処理の別URLだけが設計から落ちている。

- `/popup/old/{oldProductId}.json`
- `/popup/old/{lang}/{oldProductId}.json`
- `/updateProducts/{strFromDate}/{strToDate}.json`
- `/search.json`
- `/article.json`
- `/topBanners/{languageCode}.json`
- `/card.json`
- `/master/{name}.json`

対象外APIである可能性はあるが、現状は対象外一覧・除外理由が無いため、
source → design の網羅性を証明できない。

### M-02: `deck-api` が存在するのに「提供されていない」と記載

重要度: Medium

次の6件は `deck-api` が提供リポジトリに含まれないとして、確認可能な現行仕様を
`要確認` のまま残している。

- `a15-05_api_deck_builder_deck_user_update.md:33`
- `a15-06_api_deck_builder_deck_master.md:33`
- `a15-07_api_deck_builder_deck_archetype_search.md:33`
- `a15-08_api_deck_builder_deck_card_search.md:33`
- `a15-09_api_deck_builder_deck_register.md:35`
- `a15-10_api_deck_builder_deck_update.md:36`

例として `a15-05:37-39` の nickname / profile は「deck-api実装で要確認」だが、
`deck-api/src/Resources/config/doctrine/DtbPlayer.orm.yml:169-184` に
`string`, `nullable: true`, `length: 255` と明記されている。

### M-03: `deck-api` のキャッシュ保持時間が設計から落ちている

重要度: Medium

設計は「一定時間」「既定の保持時間」とだけ書いているが、実装値は確定している。

| 処理 | 現行値 | 実装根拠 |
|---|---:|---|
| 汎用マスタ全件 | 86400秒 | `QueryCacheFindAllTrait.php:12` |
| アーキタイプ | 86400秒 | `DtbArchetypeRepository.php:13` |
| カード検索 | 600秒 | `MtbCardRepository.php:23` |
| デッキ系通常集計 | 600秒 | `DtbDeckRepository.php:33` |
| メタゲーム・デッキ検索系 | 1800秒 | `DtbDeckRepository.php:34` |
| 直近大会 | 1800秒 | `MtbLatestEventDeckRepository.php:15` |

少なくとも `a15-06`, `a15-07`, `a15-08`, `a15-13`, `a15-14`, `a15-15`,
`a15-16` は、この設定値を設計へ反映する必要がある。

## 管理対象外になっている設計

次の14件は `functions/todo-list.md` から参照されていない。

`pf-api`:

- `api_buying_products_by_detail.md`
- `api_buying_products_by_ids.md`
- `api_order_print_direct.md`
- `api_product_search_by_name.md`
- `api_top_banner_get.md`
- `api_top_banner_list.md`

`pf-eccube3`:

- `admin_analysis_used_card.md`
- `admin_customer_point.md`
- `admin_order_shipping_standby_search.md`
- `admin_otc_buy_order_list_csv_export.md`
- `admin_product_sale_high_price_csv_export.md`
- `admin_setting_system_member.md`
- `front_contact_history.md`
- `smaregi_api_and_functions_extract.md`

旧集約版・重複版に見えるものが含まれ、正規設計と別々に更新されることで内容が
分岐する危険がある。削除・統合・参考資料への移動のいずれかを決める必要がある。

## 今回確認できた範囲と限界

- `deck-api` の17ルートは、設計入口とすべて対応した。代表的なcontrollerも追跡し、
  ログイン、ユーザー取得・更新、マスタ、アーキタイプ、カード検索、デッキ操作の
  主要なステータス・分岐は概ね一致した。
- 設計中のバッククォート付きソース識別子を機械抽出し、ファイル・クラス・メソッドの
  実在を照合した。Twig名前空間、glob、リポジトリ接頭辞による誤検出を除外した結果、
  明白な架空識別子は確定しなかった。
- ただし、305件の正規設計に行単位の実装根拠がなく、118件には `要確認` が残る。
  この状態では、全分岐・全入力項目・全副作用について「捏造なし」を再現可能な形で
  証明できない。
- 今回はルート、出典、設定値、参照識別子を優先した一次監査である。318件すべての
  controller / service / form / repository / template / JavaScript / batchを意味単位で
  完全照合した最終監査ではない。

## 推奨対応順

1. H-01〜H-03を修正し、「現行挙動」と「移行先仕様」を明確に分離する。
2. `pf-api` の21ルートを、設計追加または対象外台帳への登録で解消する。
3. `deck-api` の6件の古い前提とキャッシュ保持時間を現行実装で更新する。
4. todo-list非参照の14件を統合・整理する。
5. 各正規設計へ `file:line` 根拠を付与し、source → design / design → source の
   双方向チェックを機能単位で完了させる。
