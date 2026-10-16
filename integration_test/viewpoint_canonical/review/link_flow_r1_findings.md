### 指摘1（重大度: Major）対象: IT-0364
主張: APIの更新先を「責務の異なる画面」が参照する場合に判定する。
実際: 店頭買取受注詳細更新APIは受注と実在庫を更新し、管理画面の買取詳細は同じ店頭買取注文を表示する（`functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md:7,13`、`functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md:1,16-20`）。この組を「責務が異なる」と扱う基準は IT-0364 にない（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:365`）。そのため、依頼者が求めた API→画面の組を除外しうる。除外されるかどうかは運用者の解釈による推測。
判定: 判定不能な文
修正案: 「外部の仕組みから呼び出されるAPIが登録または更新したデータについて、API設計書の更新対象と画面設計書の取得元が対応する管理画面または公開側の画面ごとに、表示対象項目がAPI呼出し後に設計どおり表示されること。API応答および呼出元の仕組みの画面は除く。」

### 指摘2（重大度: Minor）対象: IT-0364
主張: 登録・更新・削除をまとめ、「項目が受け渡されること」で判定する。
実際: デッキ削除APIは対象を論理削除し、削除済みデッキを取得対象として扱わない（`functions/pf-api/a15-11_api_deck_builder_deck_delete.md:12-15`）。削除後に判定すべき表示・非表示は、登録・更新後の項目の受け渡しと同じ合否条件ではない。既存表もマスタ削除時の除外を登録・更新と分けている（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:336-337`）。
判定: 判定不能な文
修正案: IT-0364 は登録・更新に限定する。削除は別行に分け、「APIによる削除後、参照画面での対象の表示または非表示が、画面設計書の削除済みデータの取扱いどおりとなること」とする。
