# DB操作 深掛け確認バックログ — 解消済み

全書込系機能の `### DB操作` を ec-cube-enterprise 正典で確定済み（要確認フラグ 0 件）。

## 確定の根拠（永続化モデル）
- **承認ワークフロー型は在庫(stock)機能に固有**。Approval系Entity/Service（DtbStockEditApproval / DtbStockApprovalList / StockBulkApprovalStoreAction 等）は全て `Admin/Stock` 配下にのみ存在。
- 在庫(M04)書込機能は承認ワークフロー型として深掛け確定（M04-03/21/31 等）。
- 在庫以外の全ドメイン（商品・受注・会員・設定・イベント・カード・デッキ・コンテンツ・API・バッチ等）の書込は persist/flush による**直接更新**。代表確認: ProductController、Order/EditController、Customer/CustomerEditController いずれも Approval 参照 0。
- 参照系（検索/一覧/履歴閲覧/チェック/出力）は DB操作=検索（書込なし）。

## 残課題（任意の精緻化）
- 各機能の DB操作の対象テーブル・契機は、各doc の DBカラム由来。さらに列・条件レベルまで精緻化する場合は機能別に追って深掛けする（網羅性チェックリスト B/E）。
