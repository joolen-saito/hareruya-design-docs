# シード予約IDバンド登録簿

E2Eシードは各テーブルで **固定ID帯 `900000000〜900000999`** を予約して使う。
固定IDにより spec が探索なしで参照でき、`seed_resync()` で投入後にシーケンスを `900000999` の直後
（=次の自動採番 `900001000` 以降）へ押し上げるため、アプリの自動採番が予約IDを再利用して衝突しない。

> 注: 対象は E2E 用テストDB（PostgreSQL）。自動採番が `900001000` 以降になるのは許容する。

| テーブル | 予約ID | セット |
|---|---|---|
| dtb_customer | 900000101 | SEED-F06-CUSTOMER |
| dtb_customer | 900000201 | SEED-M05-ORDERS / SEED-M05-15-ORDER（共有会員） |
| dtb_order | 900000301 | SEED-M05-15-ORDER（ORDER_ID） |
| dtb_order | 900000311〜900000350 | SEED-M05-ORDERS（40件） |
| dtb_order_item | 900000401 | SEED-M05-15-ORDER |
| dtb_order_item | 900000411〜900000450 | SEED-M05-ORDERS |
| dtb_shipping | 900000501 | SEED-M05-15-ORDER |
| dtb_shipping | 900000511〜900000550 | SEED-M05-ORDERS |
| dtb_mail_template | 900000601 / 602 / 603 | TEMPLATE / DEFAULT-TPL / MISSING-TPL |
| mtb_cardset | 900000701 | SEED-M14-05-MASTER |
| dtb_search_pattern | 900000801 | SEED-M05-PATTERN（deferred） |

## 帯を増やすとき
- 新モジュールは未使用の連番ブロック（例 900000901〜）を上表に追記してから使う。
- 帯上限（900000999）に達したら `idBandTop`（manifest.json）と `_helpers.sql` の floor 呼び出しを引き上げる。
- マーカー列があるテーブル（例 dtb_order.order_no `E2E-SEED-%`）は帯IDに加えてマーカーでも撤去できるようにする。
