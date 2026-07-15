# m06-03 — 自動再生成ケース（Phase3ジェネレータ出力・prose未整形）

正本: `function_spec_html_preview/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html`
> 本ファイルは spec_parser＋judge_viewpoints＋generate_cases が機械生成した**土台**。
> 各実施ケースの期待は判定根拠 file:line の**正本verbatim**。prose整形と SEED 具体化は後段（人手/LLM）で行う。

## §0. テスト対象外（Phase2・廃止＝正本が明示）
- [Phase2] 一部キャンセル はフェーズ2対応（ 0205 買取詳細 ） Excel原文: 一部キャンセルはPh2の要件となるためPh1では実装しない（m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:308）
- [廃止] ダブルチェック＆保存ボタン は削除（ 0205 買取詳細 識別ID:15 ） これに伴い実装不要: ダブルチェック済みステータス（STATUS_DOUBLE_C（m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:314）
- [廃止] ダブルチェック日時 は削除（ 0205 買取詳細 識別ID:9 ）（m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:314）

## §1. SEED雛形（要具体化）
- 権限・ステータス前提の分離が必要（m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:388）: 未認証 管理画面に入れない 同左 同左 同左 同左 同左 / 管理画面に入れる管理者 一覧から到達する前提。GET に編集可能店舗のチェックは無い（実装確認値）。 POST にも編集 / 店舗不一致 同上 現状チェック無し 拒否 拒否 例外 例外
- 副作用テーブル（m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:379）: dtb_otc_buy_order / dtb_otc_buy_order / dtb_otc_buy_order_stock / dtb_otc_buy_order_stock_history / dtb_otc_buy_order_indivisual_input_product

## §2. DDT データ表（入力項目×境界・要正本照合で期待確定）
| 項目 | 境界 | 入力 | 期待(要正本照合) |
|---|---|---|---|
| 増減数 | 正の値 | +n | 要正本照合（非負/下限/型） |
| 増減数 | 0 | 0 | 要正本照合（非負/下限/型） |
| 増減数 | 負の結果 | -n | 要正本照合（非負/下限/型） |
| 増減数 | 型不正 | 非数値 | 要正本照合（非負/下限/型） |

## §3. 実施ケース（期待=正本verbatim・要prose整形）
```tsv
テストID	判定コード	観点	優先度	期待(正本verbatim)	正本根拠
RG-m06-03-001	DELEG-STATIC	CSRF	P1	利用者状態 詳細表示 フリーコメント保存 在庫増減保存 個別実在庫登録 経理払出し済 入庫済み 未認証 管理画面に入れない 同左 同左 同左 同左 同左 管理画面に入れる管理者 一覧から到達する前提。GET に編集可能店舗のチェックは無い（実装確認値）。 POST にも編集可能店舗のチェックは無い（実装確認値）。 ログイン中メンバーが注文店舗を編集可能であること、かつステータスが未登録在庫ありまたは入庫待ちであること。 個別アクションと	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:387
RG-m06-03-002	EXEC-UI	未認証	P1	利用者状態 詳細表示 フリーコメント保存 在庫増減保存 個別実在庫登録 経理払出し済 入庫済み 未認証 管理画面に入れない 同左 同左 同左 同左 同左 管理画面に入れる管理者 一覧から到達する前提。GET に編集可能店舗のチェックは無い（実装確認値）。 POST にも編集可能店舗のチェックは無い（実装確認値）。 ログイン中メンバーが注文店舗を編集可能であること、かつステータスが未登録在庫ありまたは入庫待ちであること。 個別アクションと	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:387
RG-m06-03-003	EXEC	対象データ	P1	種類 内容 入力 パス otcBuyOrderId 、POST 時はフォームフィールドと stock_diff 、個別 POST 時は product_class_id と CSRF。 成功時出力 詳細ページへの 302。成功フラッシュ（保存・経理・入庫・個別登録で鍵が異なる）。 失敗時出力 詳細への 302 とエラーフラッシュ、または 404。CSRF 失敗はエラーフラッシュ。 副作用 dtb_otc_buy_order のコメント列	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:375
RG-m06-03-004	DELEG-STATIC	出力抑止	P1	本機能専用の監査ログ鍵は設けない。フレームワークや汎用ロガーの出力は別ドキュメントを正とする。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:402
RG-m06-03-005	EXEC	識別子	P1	種類 内容 入力 パス otcBuyOrderId 、POST 時はフォームフィールドと stock_diff 、個別 POST 時は product_class_id と CSRF。 成功時出力 詳細ページへの 302。成功フラッシュ（保存・経理・入庫・個別登録で鍵が異なる）。 失敗時出力 詳細への 302 とエラーフラッシュ、または 404。CSRF 失敗はエラーフラッシュ。 副作用 dtb_otc_buy_order のコメント列	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:375
RG-m06-03-006	EXEC	状態変化	P1	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-007	EXEC-UI+EXEC-MAN	UI部品	P3	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-008	EXEC-UI+EXEC-MAN	UI部品	P3	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-009	EXEC-UI	操作起点	P1	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-010	EXEC-UI	確認ダイアログ	P1	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-011	EXEC-UI	確認ダイアログ	P2	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-012	EXEC-UI	確認ダイアログ	P3	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-013	EXEC	送信可否制御	P3	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-014	EXEC-UI	外部画面	P2	観点 内容 表示要素 メニューキーは purchase_store と list 。タイトルは店頭買取管理の翻訳キー。操作履歴に査定番号、申込者氏名、会員 ID、ステータス、適格請求書関連の表示、各種日時、ダブルチェック者、端末取引 ID、棚戻し済み（ラジオ風の無効表示）。ステータス変更履歴は表形式。買取情報に査定合計金額、明細表（数量 0 の行は出さない）、個別入力表（数量 0 の行は出さない、未登録なら実在庫登録ボタン）。実在庫は表	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:340
RG-m06-03-015	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-016	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-017	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-018	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-019	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-020	EXEC-UI	画面遷移	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-021	CONTRACT	URL直接アクセス	P2	エラー内容 処理 存在しない注文 ID 404。 CSRF 無効（経理・入庫・個別登録） エラーフラッシュして詳細へ。 在庫更新・個別登録・ステータス POST の業務例外 メッセージをエラーフラッシュし詳細へ。 商品検索 Ajax 失敗 alert() で検索失敗を表示。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:396
RG-m06-03-022	CONTRACT	HTTPステータス	P2	種類 内容 入力 パス otcBuyOrderId 、POST 時はフォームフィールドと stock_diff 、個別 POST 時は product_class_id と CSRF。 成功時出力 詳細ページへの 302。成功フラッシュ（保存・経理・入庫・個別登録で鍵が異なる）。 失敗時出力 詳細への 302 とエラーフラッシュ、または 404。CSRF 失敗はエラーフラッシュ。 副作用 dtb_otc_buy_order のコメント列	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:375
RG-m06-03-023	CONTRACT	URL	P2	条件 遷移先 一覧から詳細 GET …/otcbuyorder/{id} 保存・個別登録・経理・入庫の POST 完了後 GET …/otcbuyorder/{id} フッタ「店頭買取一覧」 GET …/otcbuyorder/page/{page_no} 。 page_no はセッション eccube.admin.otcbuyorder.search.page_no が無ければ 1。 ステータス変更 GET …/otcbuyorder	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:391
RG-m06-03-024	EXEC	必須バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-025	EXEC	必須バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-026	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-027	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-028	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-029	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-030	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-031	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-032	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-033	EXEC-UI:DDT	数値バリデーション	P2	項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意 フォームに文字数上限は無い。DB は dtb_otc_buy_order.free_comment の TEXT 型依存。 当該注文の現行値 キー freeComment 。Symfony フォーム名のプレフィックスは otc_buy_order_detail （型のデフォルト）。POST update_details で handleRequest 後に flus	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:364
RG-m06-03-034	EXEC	相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-035	EXEC	相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-036	EXEC	相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-037	EXEC	相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-038	EXEC	DBとの相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-039	EXEC	DBとの相関バリデーション	P2	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-040	EXEC	必須制御	P1	項目 内容 フリーコメント 必須ではない。Symfony の TextareaType に追加制約は無い。 在庫増減 フォーム外パラメータ。整数化後 0 を捨てる。負の数量結果は例外。 個別登録 CSRF、アクション内で店舗・ステータス・二重登録。 経理・入庫ボタン 各 CSRF、店舗、現在ステータス。	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384
RG-m06-03-041	EXEC	実行結果	P2	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-042	EXEC	実行結果	P2	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-043	EXEC	実行結果	P2	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-044	EXEC	実行結果	P2	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-045	EXEC	実行結果	P2	詳細を表示する（GET admin_otcbuyorder_detail ）	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:343
RG-m06-03-046	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-047	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-048	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-049	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-050	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-051	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-052	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-053	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-054	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-055	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-056	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-057	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
RG-m06-03-058	EXEC	登録内容	P1	テーブル 列 メモ dtb_otc_buy_order free_comment 本画面の Symfony フォームが直接更新し得る。 dtb_otc_buy_order update_date 在庫更新アクション成功時に更新され得る。 dtb_otc_buy_order_stock 数量・小計・商品規格 FK 等 増減数 POST で更新または新規。 dtb_otc_buy_order_stock_history 履歴列 在庫差分があ	m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:378
```

## §4. 台帳（非実施・根拠付き）
| 観点 | 判定 | 根拠 |
|---|---|---|
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字列長バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:365（明示的否定: 入力項目 項目名 必須／任意 最大長 初期値 保存先・扱い フリーコメント 任意） |
| 文字種バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:385（明示的否定: Symfony の TextareaType に追加制約は無い。） |
| 文字種バリデーション | OUT | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:385（明示的否定: Symfony の TextareaType に追加制約は無い。） |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| その他のバリデーション | 要判定 | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:384 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |
| 検索条件 | MERGE→admin_search_product | m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html:検索は別機能へ委譲 |

## §5. サマリ  母集合=90／実施=58／EXEC:31／MERGE:16／EXEC-UI:12／OUT:8／EXEC-UI:DDT:8／要判定:8／CONTRACT:3／DELEG-STATIC:2／EXEC-UI+EXEC-MAN:2