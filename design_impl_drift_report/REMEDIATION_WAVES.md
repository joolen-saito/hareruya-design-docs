# 乖離指摘 着手のまとまり別 不具合内容

`drift_findings_list_effort.tsv` の改修対象 965件を、着手のまとまり（波）ごとに整理したもの。
工数は codex が1件ずつ見積もった実装工数（人日）。テスト・レビュー・設計書改訂・リリースは含まない（含めるなら約1.6倍）。
「要仕様確定」は設計が矛盾していて何を作るか決まらず、工数を出せない行。

## 全体

| まとまり | 内容 | 件数 | 工数(人日) | 要仕様確定 | 累計 |
|---|---|---:|---:|---:|---:|
| 第1波 | 実害high（P1）を区分を問わず全部 | 64 | 57 | 12 | 57 |
| 第2波 | 画面表示（文言・ラベル）を一括で直す | 255 | 44 | 9 | 101 |
| 第3波 | 外部インタフェース契約と入力検証 | 311 | 136 | 18 | 237 |
| 第4波 | 業務ロジック | 203 | 126 | 19 | 363 |
| 第5波 | 実行制御 | 26 | 23 | 3 | 387 |
| 第6波 | データ永続化・外部連携 | 84 | 114 | 9 | 501 |
| 第7波 | 未実装機能の新規実装 | 22 | 78 | 2 | 579 |
| | **合計** | **965** | **579** | **72** | |

---

# 第1波: 実害high（P1）を区分を問わず全部

**64件 / 57人日**（うち要仕様確定 12件は工数未算入）

画面種別: admin 28 / api 24 / batch 9 / front 3

主なドメイン: a05 12件 / m04 9件 / a06 8件 / m03 8件 / m13 4件 / b02 3件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| データが壊れる・在庫や履歴が合わなくなる | 15 | 23.2 |
| 外部連携が成立していない | 11 | 13.0 |
| 権限・アクセス制御が効いていない | 5 | 5.0 |
| 外部インタフェース契約の不一致 | 13 | 4.0 |
| 集計値が実態と違う | 5 | 3.5 |
| その他 | 6 | 3.5 |
| 入力検証の欠落 | 5 | 3.2 |
| 認証・監査ログの欠陥 | 4 | 1.8 |

### データが壊れる・在庫や履歴が合わなくなる（15件・23.2人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A01-01 | 8.00 | 設計はスマレジ→ECCUBEのWebhookだけでなく、管理画面操作によるECCUBE→スマレジ在庫反映（API個別/Patch一括）も連携方式として定義する。実装の SmaregiStockApiClient は getStockChange/listStocks/listStockChanges |
| M03-09 | 5.00 | 設計は削除可能性に応じたボタン表示、最後の1件の HTTP400、論理削除を要求している。実装は削除可能性の判定がなく、最後の1件ガードもなく、論理削除ではなく物理削除している。探索範囲: ProductClass edit.twig, ProductClassController::delete, |
| M04-21 | 4.00 | 廃棄系では設計上も後続承認処理上も申請時反映が前提だが、CSVアップロード経路では申請時の在庫減算・履歴作成が行われない。 |
| A01-02 | 1.50 | 設計は時間幅（X-Y hours、初期値相当として5時間前）を要求しているが、実装は SmaregiStockBackfillCommand の引数が target-date のみで、SmaregiStockBackfillAction は target_date/page/limit だけを li |
| A05-04 | 1.00 | 設計は取消・打消で取引IDに一致するポイント履歴を取得して削除。実装の SmaregiPointAdjustmentReverter は元履歴を削除せず監査用に残し、符号反転した逆仕訳ポイント履歴を追加登録して残高を戻す。DELETEではなく相殺INSERTで dtb_point_history の |
| M04-23 | 1.00 | 在庫不足時にエラーにせず、要求数量を現在庫へ丸めて登録が進むため、設計の在庫数チェックと異なる。source_register_quantity_over_stock/source_exceeds_stock は一覧CSV取込経路では使用されていない。 |
| B02-01 | 0.75 | 設計は対象なしなら更新しないことを要求するが、実装は対象有無を確認する前に既存集計行を削除する。getSalesForAggregate() が空でも foreach が回らないだけで、先行DELETEは実行済みになる。 |
| B02-03 | 0.50 | 設計は対象なし時に更新しないことを要求するが、実装は対象有無判定の前に集計テーブルを全削除する。 |
| … | | 他 7 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 外部連携が成立していない（11件・13.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B13-01 | 3.00 | PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LINKS取引照会API未実装」として例外を投げるため、設計上の取引照会・レスポンス判定・後続のステータス整合に到達できない。 |
| A17-03 | 2.00 | 設計は受信した処理名・パラメータをスマレジ取引APIへ中継する外部契約を要求しているが、実装は固定成功レスポンスで中継していない。探索範囲: src/Eccube, html。検索語: postRegisterTransaction, postTransactions, transactions,  |
| B08-02 | 1.50 | 設計は会員のスマレジIDと失効ポイントをポイント増減APIへ送信することを要求しているが、実装は送信先・送信ポイントを渡しておらず、サービス本体も固定成功レスポンスであるため、失効分のスマレジ差し引きと失敗時スキップの実効性がない。反証として postSmaregiPoint 呼び出し、Smareg |
| F06-02 | 1.50 | 設計の判定順序表・副作用順序・エラーケースを正として実装を精査。会員ステータス更新(283-289)がスマレジ連携(302)より前に自動コミットされ連携失敗時にロールバックが無いため、失敗後に再度URLを開いても getProvisionalCustomerBySecretKey が null→al |
| M03-02 | 1.50 | 設計の『商品編集で廃止になった場合のスマレジ削除』が、商品編集Controllerの更新確定経路に存在しない。スマレジ削除機構は別経路に存在するが、本機能から呼ばれていない。 |
| A05-01 | 1.00 | 設計は抽出条件を単一系統（店頭受取NEW＋スムーズ店頭受取条件群＋browser_print_flg、最大10件）として記述。実装(行44-48)は BaseInfo->isMainShop() で分岐し、本店は getPrintOrderListMainShop（OTC-NEW＋smoothOtc |
| A05-02 | 1.00 | 設計は単一の抽出条件(店頭受取+スムーズ店頭受取+ブラウザ印刷フラグ)を記述するが、実装は BaseInfo->isMainShop() で分岐し、本店は getPrintOrderListMainShop(スムーズ店頭受取ブランチ有)、支店は getDirectPrintOrderList を用い |
| B05-08 | 1.00 | 設計はユーザーのポイント残高を取得し絶対値で更新する要求。実装は `src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:39` の使用ポイントを、同54行で負数として送信する差分連携である。 |
| … | | 他 3 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 権限・アクセス制御が効いていない（5件・5.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-25 | 2.00 | Controller のコンストラクタには MemberRepository 等の権限判定依存がなく、index/detail/delete/registerTracking は対象 DtbStockMoveInstruction をそのまま検索・更新している。Repository の検索Query |
| M04-23 | 1.00 | 設計は店舗必須かつM11-03の編集可能店舗制御を要求するが、取込ルートはPOST値のstoreをサーバー側で必須検証せず、編集不可店舗IDも排除しない。反証検索範囲: StockSplitJoinController, StockSplitCsvUploadType, StockJoinCsvUp |
| M13-08 | 1.00 | 検索モーダル等では isEditableShop / getMemberBaseInfos による権限制御があるが、デッキ表示本体では同等の照合がない。セッションに権限外店舗が入った場合に除外する根拠が実装から確認できない。 |
| M04-23 | 0.75 | POST改ざんで編集不可店舗IDを送れる外部契約に対し、listJoinCsvImport のサーバ側で編集可能店舗処理が実行されない。 |
| M13-03 | 0.25 | 設計は「日程追加が可能」かどうかの権限制御を要求している。実装はイベント編集画面のリンク表示やボタン disabled では制御しているが、ScheduleController::create/edit の保存分岐自体は権限チェック前に実行されるため、直接POSTに対して日程追加・更新を拒否する実装 |

### 外部インタフェース契約の不一致（13件・4.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M13-12 | 0.75 | 重複検証が登録処理のサーバー側オラクルになっておらず、直接POST等では重複申込を弾けない。申込重複メッセージと新規画面リダイレクトも登録処理側にない。 |
| A06-02 | 0.50 | 設計の利用者向け契約にある URL と別名が実装されていない。反証として otcBuyOrders、api_admin_otc_buy_orders、Route 定義、設定 eccube_api_v1_route を検索したが、該当ルートは OtcBuyOrderController.php:69  |
| A06-08 | 0.50 | 設計のレスポンスフィールド名・型と実装のJSONキー/値型が一致しない。反証として BuyingCardsFormatter、GetBuyingCardsQueryResponseDto、productCode/productClassCode、stock キャストを確認したが、設計名 produc |
| A06-16 | 0.50 | 設計は /api/otcBuyOrder/{id}/doublecheck.json と member_id を要求する。実装ルートは /{api_v1_route}/admin/otcBuyOrder/{id}/doubleCheckMember.json で、さらにリクエストから double_ |
| M09-04 | 0.50 | 画面上の削除ボタンは利用者作成ページに限定されるが、DELETEルート自体は初期投入ページのファイル削除を拒否せず、設計のサーバ側初期ページ制限に反する。 |
| A06-04 | 0.25 | 設計HTMLのシート本文は /api/admin/otcBuyOrder/{id}/freeComment.json を外部契約として示しているが、実装は /api/v1/admin/otcBuyOrder/{id}/freeComment.json に版数プレフィックスを挿入する。/api/adm |
| A06-06 | 0.25 | 設計は /api/buying/{detailId}.json を外部契約として定義しているが、実装は API 版数プレフィックス /api/v1 を付けた別URLで公開している。設計HTML側に /api/v1 への読み替え指定は確認できない。 |
| A06-11 | 0.25 | 設計HTMLはレスポンスデータとして code、message、sections を定義し、処理フローでもコード・メッセージ・部門一覧をJSONで返すとしている。一方、実装の SectionController は array_map で部門要素配列のみを生成し、new JsonResponse($ |
| … | | 他 5 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 集計値が実態と違う（5件・3.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M12-01 | 1.50 | MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE と MtbOtcBuyOrderStatus::STATUS_COMPLETE、DtbOtcBuyOrder.completeDate は存在するが、同集計 SQL はそれらを参照しない。DtbDailySummaryR |
| B06-02 | 0.50 | 設計は部門未設定商品一覧を取得して通知することを要求しているが、実装の一覧取得 SQL が構文不正のため、通知判定・商品名/商品コード本文生成まで到達できない。加えて同メソッドには集計対象ステータス条件もなく、集計対象内の商品一覧という設計条件との対応が不足している。 |
| M05-26 | 0.50 | 設計は親注文の状態差し替えを「サブ側出荷実施日時の既存有無のみ」でゲートし、受注ステータス条件は課さない（設計step15も同旨）。実装はOrderCsv.php:132で `$isPreDeliv = $order->getOrderStatus()?->getId() === OrderStat |
| M12-01 | 0.50 | DtbDailySummaryRepository::aggregateOrderSummaryByBaseInfo は dtb_order の全ステータスを対象に subtotal + delivery_fee_total + charge を合算する。SummaryController、Anal |
| M12-01 | 0.50 | OrderStatus::DELIVERED / order_status_id / 出荷完了 へ翻案して再検索したが、M12-01の日次・月次集計元SQLでは出荷完了ステータスに限定する条件が見つからない。 |

### その他（6件・3.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-21 | 1.50 | 重複商品コードとロック取得失敗の設計エラー経路が実装されていない。 |
| M14-08 | 1.00 | 設計の削除可否判定、失敗キー、Referer 復帰、成功時のページ番号復帰が実装にない。さらに実装は削除不可でも試行前に画像削除を行う可能性がある。 |
| F06-18 | 0.50 | 設計の住所系変更トリガーの『住所』には addr03(dtb_customer.addr03、既定配送先へ 164 行で反映される正規の住所項目)が含まれるが、$isAddressChanged の比較に addr03 が欠落。海外住所3のみ変更時に未確認化が発火しない業務ルールの部分的不充足。 |
| M04-24 | 0.50 | 設計は『エラーがあれば登録処理を終了（全体未登録）』だが、実装は行単位スキップで成功行を確定コミットする。 |
| M03-27 | 要仕様確定 | 設計の値1/2の意味が実装では逆。反証検索として「1: 非公開」「2:公開」「商品公開ステータス」「ProductStatus」「mtb_product_status」を確認したが、グッズCSV実装側に設計どおりの 1=非公開, 2=公開 の定義は見つからなかった。 |
| M03-37 | 要仕様確定 | 設計は商品IDをキーに商品情報側の略称タグIDを更新する要求だが、実装は略称タグマスタ mtb_storage_code の名称・並び順を登録/更新している。反証検索でも admin_product_storage_code_import 経路に ProductRepository 注入、Produ |

### 入力検証の欠落（5件・3.2人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F06-16 | 1.50 | 設計は『提出時に書式エラー→編集画面へ戻し登録しない』だが、実装は書式検証なしで常に登録し確認画面へ遷移。設計文言そのままのエラー span が未使用である点も裏付け。 |
| M13-13 | 0.75 | EventBulkCsvImportHandler.php:289 付近はクレジット列の値検証のみ、同:364 付近はオンライン受付日時検証のみ、同:453 付近は Payment 紐付けのみで、設計の横断条件を判定してエラー化する処理が存在しない。 |
| M03-38 | 0.50 | 設計HTMLの sheet-20 本文では識別ID 2 の商品公開ステータスを「0: 非公開 1:公開」と定義しているが、実装は非公開を 2 として出力・受理する。反証として ProductStatus 定数、ProductStatusCsvController の getCsvHeader、Pro |
| M06-01 | 0.50 | 設計は買取成立時に端末取引ID/出金コード未入力をエラーにする要求だが、実装は値がある場合の型・数値検証だけで、買取成立ステータス時の未入力を拒否しない。 |
| M03-37 | 要仕様確定 | 設計フォーマットは商品IDと略称タグの2列必須だが、実装は略称タグマスタ登録用のID・名称・並び順フォーマットを受け付ける。商品ID/略称タグのCSVはヘッダ検証で期待ヘッダと一致せず、設計どおりに取り込めない。 |

### 認証・監査ログの欠陥（4件・1.8人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A05-02 | 1.00 | 設計はプリンタ応答内の失敗理由 code をログに追記すること、既存では印刷結果詳細を参照していない点の改善を要求している。実装コードには `PrintResponse`、`response` 属性、`success` 属性、`code` 属性、設計記載のエラーコード群を参照する処理がなく、失敗した |
| A05-01 | 0.50 | 設計は GetRequest 成功時の副作用として印刷情報XMLの print_logs へのファイル書き出しを必須挙動と規定（本書で扱うこと:223・副作用:298・ログ監査:322で明記）。実装は当該ブロックが '// TODO :後ほど対応'（行57）で丸ごとコメントアウト（行58-67）され |
| A05-04 | 0.25 | 設計は連携ヘッダとCookieの完全値をログに出さないことを要求するが、実装は受信時・認証失敗時にheadersとcontentをログ出力する。X_access_token、Cookie、秘密ヘッダが混入し得る。 |
| A06-01 | 要仕様確定 | 設計にある /api/admin/login.json、/admin/login.json、/admin/login のいずれも実装ルートとして確認できず、実装はバージョン付き /api/v1/admin/login.json だけを提供している。反証検索として api_admin_login、/a |

### 要仕様確定（12件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A05-01 | 設計はパス /order/print/direct をGET・POST両方に割り当て、GET=GetRequest・POST=SetResponse とする。実装ルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', methods |
| A05-02 | 設計はパス `/order/print/direct` を GET と POST の両方で受け付け、GetRequest は GET・SetResponse は POST とする。実装のルートは `#[Route(path: '/api/order/prints/direct/{base_info_ |
| A05-04 | 設計は言語識別子配下の固定パス `POST /{_locale}/smaregi/transaction`。実装は `#[Route('', name: 'smaregi_webhook', methods: ['POST'])]` で、routes.yaml(app/config/eccube/r |
| A05-04 | 設計の成功レスポンスは `{result:[{TransactionHead: 更新件数}]}`。実装は `{status:'ok'}`(107-109行)または重複時 `{status:'ok',message:'Event is duplicate'}`(85-88行)を返すのみで、更新件数を集 |
| A05-04 | 設計は認証方式をIP制限としているが、実装は secretHeader/secret のヘッダ認証であり、探索範囲（Controller/Smaregi、Service/Smaregi/Webhook、app/config/eccube、html）でスマレジWebhook用のIP制限実装は見当たらな |
| A06-01 | 設計にある /api/admin/login.json、/admin/login.json、/admin/login のいずれも実装ルートとして確認できず、実装はバージョン付き /api/v1/admin/login.json だけを提供している。反証検索として api_admin_login、/a |
| B02-03 | 設計は店舗に加えて在庫区分/在庫場所単位の集計・更新を要求するが、実装は商品規格ID・店舗ID単位に集約している。ProductStock には stock_location_id が存在するが、当該バッチの集計SQL・保存先には使われていない。 |
| B06-01 | 設計は店頭買取の入庫待ちをステータス12と明記しているが、実装ではステータス12は未登録在庫あり、入庫待ちは13として扱われる。反証として BatchAutoStockAction、DtbOtcBuyOrderRepository、MtbOtcBuyOrderStatus、MtbBuyOrderSt |
| M03-27 | 設計の値1/2の意味が実装では逆。反証検索として「1: 非公開」「2:公開」「商品公開ステータス」「ProductStatus」「mtb_product_status」を確認したが、グッズCSV実装側に設計どおりの 1=非公開, 2=公開 の定義は見つからなかった。 |
| M03-37 | 設計は商品IDをキーに商品情報側の略称タグIDを更新する要求だが、実装は略称タグマスタ mtb_storage_code の名称・並び順を登録/更新している。反証検索でも admin_product_storage_code_import 経路に ProductRepository 注入、Produ |
| M03-37 | 設計フォーマットは商品IDと略称タグの2列必須だが、実装は略称タグマスタ登録用のID・名称・並び順フォーマットを受け付ける。商品ID/略称タグのCSVはヘッダ検証で期待ヘッダと一致せず、設計どおりに取り込めない。 |
| M03-37 | 設計HTMLのsheet-55先頭フォーマット表は「商品ID」「略称タグ」の2列をmaterialなCSV外部契約として示すが、実装のgetCsvHeader()/StorageCodeCsvは「ID」「名称」「並び順」を期待し、StorageCodeCsv::register()でMtbStora |

---

# 第2波: 画面表示（文言・ラベル）を一括で直す

**255件 / 44人日**（うち要仕様確定 9件は工数未算入）

画面種別: admin 181 / front 73 / batch 1

主なドメイン: f06 34件 / m04 31件 / m13 24件 / m03 18件 / m10 18件 / m14 16件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| 文言・ラベルが設計と違う | 133 | 21.9 |
| ボタン活性制御・画面内挙動 | 41 | 7.0 |
| 表示対象データが違う | 15 | 3.7 |
| その他 | 24 | 3.6 |
| 表示項目の過不足 | 13 | 3.0 |
| 初期値・選択肢・表示件数 | 17 | 3.0 |
| ページング・件数表示 | 6 | 1.3 |
| 日時・通貨などの表示書式 | 5 | 0.6 |
| 並び順・ソート | 1 | 0.1 |

### 文言・ラベルが設計と違う（133件・21.9人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M10-07 | 1.00 | 設計のブロック分割、見出し順、操作文言、入力種別、日時ピッカー、モーダル不使用がテンプレート/FormType と一致しない。 |
| F06-06 | 0.50 | 設計は要素13を画像と定義し状態別画像を表示する要求だが、実装は色付きテキストラベルで描画。twig/CSS双方に img/background-image 等の画像使用が無く、画像紐付けも未実装。 |
| F07-01 | 0.50 | index.twig:33-55 のパンくずは店舗名までの静的3段(position 1-3)。hareruya-event.js に breadcrumb/__current/日別/月別 のパンくず書換トークンは0件で、日別・月別セグメントの付与・更新処理が不在。 |
| F07-03 | 0.50 | 店舗名/フォーマットのhrefに shop/format 等のクエリが無く絞り込み結果に繋がらず素の検索一覧へ遷移。開催日付クラムが未生成でイベント名に置換されている。設計項目1-1の『それぞれ押下可能』『その内容での絞り込み結果画面に遷移』を満たさない。 |
| M04-12 | 0.50 | 分割4択・結合5択のタイプ別選択肢を要求するが、実装は全ステータス常時表示かつ文言が異なる。 |
| M08-10 | 0.50 | 設計はモーダル表示時に画像を出さず文言表示する仕様だが、実装は画像タグを出した後に画像取得リクエストを拒否する方式で、利用者向け文言も欠落している。 |
| F06-14 | 0.40 | 設計は明示的に『＜最初』『最後＞』の文言リンクを求めるが、共有pager.twigは数字ページ番号＋『…』のスタイル。利用者可視の文言・見た目が設計と異なる。 |
| M16-07 | 0.40 | 設計の画面表示・操作要素と実装Twigのブロック/要素が一致しない。反証として title/sub_title、menus、back、type="button"、location.href、buy_price_list_management の別名検索を実施し、当該編集Twig上に設計通りの構成は確 |
| … | | 他 125 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### ボタン活性制御・画面内挙動（41件・7.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F01-01 | 0.50 | 設計は5-5/5-6を『リンク』と定義し押下時の商品一覧遷移を明示要求。実装は href 無しの aria-disabled 非リンクで遷移ロジックが未配線のため機能要求(5-5)(5-6)が実現されていない。 |
| M03-38 | 0.50 | 設計は識別ID2「CSVファイルのアップロード」に「押下後、確認モーダルを表示」と明記しているが、実装はフォームを直送する共通テンプレートで、確認ステップを起動するUI/JSがない。反証検索語: upload-button, upload-form, confirm, 確認, モーダル, modal |
| M08-10 | 0.50 | 設計されたサムネイル押下遷移と拡大表示モーダルが実装されていない。 |
| M15-10 | 0.50 | 共通 function.js の Ladda は存在するが、設計で指定された card-csvimport.js と #spinner によるスピナー表示は当画面実装にない。 |
| F01-02 | 0.25 | shop_recommend を無パラメータで include(PHPに shop_recommend 参照なし)、動的URL/ブロック管理データを渡していない。app/html オーバーライドも無し。設計(8-1)の『押下→設定URLへ遷移』『ブロック管理の編集可能ブロック表示』が href="# |
| M04-13 | 0.25 | twig の qty change JS と合計表示、updateDestinationQuantity 戻り値を確認。フォーカスアウト時の即時再集計がクライアント側で未実装。 |
| M04-19 | 0.25 | history.twig、admin_stock_approval_new、stock_list_index.twig、ProductStock.id で再検索した。stock_list_index.twig には admin_stock_approval_new へのリンク実装があるが、M04-1 |
| M04-25 | 0.25 | 設計は変更時のみ活性だが、実装は未変更でも押下可能。 |
| … | | 他 33 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 表示対象データが違う（15件・3.7人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-17 | 0.50 | twig内JS・assets/js を grep したが disposal_search 変更ハンドラなし。欠品検索チェックに連動したフォーム項目の自動設定・活性/非活性・クリアというクライアント側動的挙動が未実装。 |
| M09-04 | 0.50 | 設計が要求する操作メニュー形式と操作種別が実装されていない。 |
| M10-16 | 0.50 | smaregi_contract_id/SMAREGI_CONTRACT_ID/form.smaregi_contract_id と smaregi_store_id/smaregi_category_id の両方で再検索した結果、契約IDの保存先が設計の論理キーではなく削除対象の店舗IDキーへ割り |
| F03-06 | 0.30 | recently_viewed.twig の3レイアウト分岐と resolveLayout を確認。本店ECTOP(homepage=top)のみカルーセル/スライダー実装で設計の『スライダーなし』要求に不一致。 |
| M04-38 | 0.25 | 設計は在庫編集/一括編集/CSV登録の承認対象リンクで確認モーダル表示を要求しているが、実装は未承認かつ本人以外など一括操作可能な行に限定している。 |
| M04-38 | 0.25 | 設計で「それ以外の場合 '-'」とされた分割/結合に数値・区分を表示する実装になっている。 |
| M10-03 | 0.25 | 設計の移行先仕様は dtb_help.customer_agreement ではなく help_agreement 固定ページ本文の保持・編集を正としている。実装は導線と対象ページ ID は存在するが、固定ページ編集画面の本文エディタを読み取り専用にしており、利用者が本文を入力して登録する要求を満た |
| M10-08 | 0.25 | 設計では初期表示でテンプレ名称・件名も表示対象だが、実装は選択済みMailがある場合だけそれらを表示する条件になっている。 |
| … | | 他 7 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### その他（24件・3.6人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M16-04 | 0.50 | 設計は Bootstrap DateTimePicker と hareruya-masterdata.js による YYYY-MM-DD HH:mm 形式の日時入力を要求しているが、実装はブラウザネイティブ datetime-local に置換している。探索範囲: src/Eccube/Resour |
| F06-16 | 0.25 | 設計は大会名の後ろに『(フォーマット)』を併記する要求。テンプレートにフォーマット連結処理がなく、Controller も併記文字列を渡していない。 |
| M09-04 | 0.25 | 設計は通常の複数行入力欄を要求しているが、実装は専用コードエディタを前面に出している。 |
| M09-07 | 0.25 | 設計は専用リッチエディタを持たない素のtextarea行数15を明記するが、実装はACEエディタを組み込む。block_edit.twig を全読し確認。 |
| M13-01 | 0.25 | 設計HTML本文にある専用CSS指定はハーネス候補に含まれていなかった extractorMissed 要求で、実装探索でも該当CSSの読込が見つからない。 |
| M13-02 | 0.25 | EventController::create / EventType::buildForm / EventCreateAction::handle を精査した結果、新規時にクレジットカード決済を初期選択する処理が存在せず、真の新規では支払方法が全て未選択で表示される。設計の『新規時クレジットカード |
| M14-09 | 0.25 | 設計が指定する専用CSS読み込みが実装に存在しない。テンプレート、管理画面テンプレート、公開 html 配下を別キーワードで再検索しても該当読み込みは見つからなかった。 |
| M13-02 | 0.15 | grep で deckerror/entryerror は ScheduleController.php:146,152 のみに出現し locale 定義ゼロを確認。実在キー名は .not.deck_exists / .not.entry_exists で不一致。 |
| … | | 他 16 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 表示項目の過不足（13件・3.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F01-02 | 0.50 | ShopTopController は search_items 用データを渡さず(PHPに search_items 参照なし)、app/html オーバーライドも無し。設計(6-5)(6-6)の『押下→商品一覧遷移』が aria-disabled のダミータグで実装されておらず遷移機能が不在。 |
| F08-02 | 0.50 | index.twig(ja/en)・otc_buy_order_js.twig を『自動入力|zip2addr|AjaxZip3|button|検索』で確認したが、ボタン・検索リンクは不在でblur自動起動に置換され、自動入力対象も住所2(addr02)が欠落。ユーザーが目にする操作要素・挙動が設計 |
| F01-02 | 0.25 | ShopTopController→shop_top.twig:37-38→shop_best_sellers/shop_sale.twig(showFavoriteButton:false,isMainShop未指定)→_product_card.twig を追跡。add-cartボタンの表示条件 |
| F03-02 | 0.25 | 設計は『該当なし』廃止＋空フォーマット非表示を要求するが、実装は現行同様に『該当なし』を出力し空フォーマットも表示する。 |
| F06-08 | 0.25 | 設計は『入荷通知を設定している規格のみ表示』かつ『登録ボタンはロード/再読込時に出さない』旨を明記。実装は未設定規格も表示しロード時に登録ボタンを描画しており挙動が異なる。CONFIRMED。 |
| M04-01 | 0.25 | 設計はリンク押下でリンク群を表示するUIを要求しているが、実装はプルダウン選択UIであり、各フォーマットや出力項目設定がリンクとして表示されない。確認範囲: stock_list_index.twig, StockListController, DtbCsvExtensionRepository,  |
| M04-17 | 0.25 | StockHistoryType・StockHistoryController ともに getDefaultSearchBaseInfo / setData / PRE_SET_DATA を参照していない（grep で不在確認）。同一 Stock 配下の InventoryPlanControlle |
| F02-02 | 0.20 | 設計は en 時に買取・デッキ構築を非表示・選手一覧を追加すると規定するが、実装の en 用テンプレート header.en.twig にも標準 header.twig にも該当する locale 分岐が無く、両言語で同一のナビ項目を出す（pros はハンバーガー mega_menu.twig:50 |
| … | | 他 5 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 初期値・選択肢・表示件数（17件・3.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M15-01 | 0.50 | 別キーワード（archetype, formats, color, change, disabled）でも検索したが、設計の連動フィルタ実装を確認できない。 |
| M15-01 | 0.50 | 設計の連動フィルタ処理がテンプレートJS・フォーム属性・外部JSのいずれにも見つからない。 |
| M04-23 | 0.25 | 設計は選択店舗に紐づく所属を表示条件としているが、実装は初期店舗の所属に固定される経路がある。反証検索範囲: StockSplitCsvUploadType::getDepartmentChoices, stock_split_join_index.twig reloadApprovalMember |
| M04-24 | 0.25 | Controllerが参照する既定値がconfigで10。設計の初期値50と不一致。 |
| M04-38 | 0.25 | 設計は単一選択(セレクトボックス)だが、実装は複数選択(multiple=true, select2)で構築。選択方式が相違。 |
| M13-06 | 0.25 | 設計は『フォームを全て空に変更』を要求するが、実装は検索モードのラジオ選択を初期化するのみで他の全入力を空にしない。SearchEntryType にもリセット手段は無い。 |
| M13-04 | 0.15 | 設計は画面項目の初期値を明示している。実装フォームの add 定義を確認すると、該当初期値のうち 23:59 以外は data 未設定であり、Twig も form_widget をそのまま描画しているため、初期表示が設計値にならない。 |
| F02-04 | 0.10 | BaseInfo エンティティに short_name_jp／short_name_en が実在し（src/Eccube/Entity/BaseInfo.php:1058-1083）、Contact/confirm.twig:105-107,189-191 では現に shortNameJp／shor |
| … | | 他 9 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### ページング・件数表示（6件・1.3人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F06-10 | 0.25 | messages.ja.yaml:818のrange_info定義に%start%/%end%が含まれず、設計が常時表示を求める表示範囲が日本語で欠落。翻訳定義から確定（実機確認不要）。 |
| F06-10 | 0.25 | paginate呼び出し・pager.twig・knp既定値(5)・app/config未設定を確認。設計の前後4件に対し実装は前後2件で数値差。 |
| F06-14 | 0.25 | 設計は現在ページ±4（例8→4〜12の9リンク）を要求。実装はrange指定が無くKnpデフォルトの±2で描画される。page_range/pageRange設定箇所を全探索したが該当なし。 |
| M05-01 | 0.25 | search_pattern / SearchPattern / reload_all_pattern / get_count_pattern / admin_order_search_pattern / admin_order_count_pattern を再検索し、非選択パターンの実装は確認した |
| F06-06 | 0.20 | 設計は上部(2件数/3ページング/4表示件数)と下部(15件数/16ページング/17表示件数)を対で列挙するが、実装下部はページャのみ。件数・表示件数プルダウンが下部で未実装。 |
| M03-38 | 0.10 | 設計の画面構成は識別ID5としてユーザー可視の「該当件数」を置くが、対象テンプレートに総件数表示がない。反証検索語: 該当件数, 検索結果, search_result, totalItemCount, getTotalItemCount, import_histories_pagination.t |

### 日時・通貨などの表示書式（5件・0.6人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F05-01 | 0.15 | 設計の★カスタマイズ要件は当該コーナーを『強化買取』タグ商品と規定するが、実装は汎用の新着(NEW_ITEMS_ID=1)タグを表示対象にしており、コーナーは在るが表示対象タグが設計と異なる。 |
| F06-23 | 0.10 | 設計は一覧の送信日時書式を『Y年m月d日 H:i』と規定するが、実装 history.twig の isLocaleJa 分岐は 'Y/m/d H:i' を用い年月日表記になっていない。書式は history.twig のみで決定され設計と差異がある。 |
| F07-01 | 0.10 | 設計は5秒毎(5000ms)を明示するが、実装は4000ms(4秒毎)で1秒短い。grep で 5000/autoplaySpeed: 5000 は該当0件、autoplaySpeed: 4000 が2箇所。 |
| F07-03 | 0.10 | detail.twig:135 が『¥』プレフィックス固定。設計は末尾『円』を要求。桁区切り自体は number_format で満たすが通貨表記の位置/記号が設計と相違し、ja ロケールでも『円』にならない。 |
| M04-17 | 0.10 | 設計は値なし時「-」だが実装は null→¥0。加えてデータソースが履歴時点の仕入単価でなく現在の ProductClass.buy_price のため設計とデータソースも相違の可能性。 |

### 並び順・ソート（1件・0.1人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M03-21 | 0.10 | 設計は並び順列の押下で編集フォームへ反映することを要求しているが、実装では押下可能な要素が実装されていない。探索範囲: ShelfNumberController、shelf_number.twig、関連JS。 |

### 要仕様確定（9件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| F05-06 | fill.twig→Block/terms_modal.twig→net_purchase_terms_text.twig および messages.ja.yaml(front.agreement.s1〜s11/front.purchase.fill.terms_heading) を確認。共通利用規 |
| F06-23 | 設計は『戻る』を history.go(-1) によるブラウザ履歴戻り・サーバリクエストなしと明記。実装は一覧URLへの固定リンクでGETが発生し遷移機構が設計と異なる。 |
| F06-24 | 設計はクライアント側の履歴戻し（サーバリクエスト無し）を規定するが、実装は contact_history ルートへのサーバGETリンクで機構が異なる。なお同シート画面部品表No.6は『お問い合わせ履歴画面へ遷移する』とあり結果面では合致（設計内に機構の内部矛盾あり）。明示された無サーバ挙動要求に対 |
| M03-27 | 画面構成表（UI仕様=正）はアップロード押下後に確認モーダルの表示を要求するが、実装はモーダルを介さず即 submit する。設計HTML内リバース詳細節には『送信前の確認ダイアログはない』(pf-eccube3現行挙動の記述)という相反記述があり要判断だが、画面構成表の element-level |
| M08-05 | 設計のシート見出しと監査台帳上の機能名は「注文金額変更によるご返金」とする。実装は CustomerPointController が admin.customer.point_update.purchase を画面タイトル用キーとして選択し、messages.ja.yaml の値が「注文金額変更に |
| M08-05 | 設計およびフォーム選択肢は「注文金額変更によるご返金」だが、画面タイトルの翻訳だけ「ご送金」になっており利用者表示文言が異なる。反証として ご返金, ご送金, point_update.purchase, NOTE_CHOICES_REFUND を翻訳/FormType/Controller 範囲で |
| M12-09 | 設計は初期表示でセッション条件を消し、未指定フォームとCSRFトークン、CSV形式 mode を扱う要求だが、実装はセッション削除も mode もCSRFもなく、一部入力に必須・初期値を設定している。反証として UsedCardController/SearchUsedCardType/used_c |
| M13-04 | 設計は本機能固有の保存失敗キーと支払い方法未設定キーを表示契約としているが、実装は共通キー admin.common.save_error のみを例外時に使用し、支払い方法未設定キーは未定義。rg で admin.schedule.save.failed、admin.schedule.error.p |
| M13-04 | 設計は登録済みイベントに対する繰返日程追加画面で当該イベントページへのリンクを画面部品として定義している。実装は新規日程登録時の eventDetailId を null にしており、Twig の条件によりリンクを出さない。eventId からイベントページへ遷移する代替リンクも同テンプレートには存 |

---

# 第3波: 外部インタフェース契約と入力検証

**311件 / 136人日**（うち要仕様確定 18件は工数未算入）

画面種別: admin 207 / api 66 / batch 27 / front 11

主なドメイン: m04 35件 / m13 24件 / m15 24件 / a06 22件 / m08 21件 / m03 19件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| URL・ルートの不一致 | 110 | 51.5 |
| CSV列名・フォーマットの不一致 | 60 | 29.6 |
| レスポンス本文・HTTPステータスの不一致 | 58 | 18.8 |
| 必須・相関チェックの欠落 | 19 | 10.6 |
| バッチのコマンド名の不一致 | 15 | 9.0 |
| 桁・範囲・形式の検証漏れ | 18 | 6.5 |
| その他 | 19 | 5.1 |
| バッチのコンソール出力・終了仕様 | 12 | 4.7 |

### URL・ルートの不一致（110件・51.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M03-02 | 1.50 | 設計の外部入出力契約と実装のルート名・フォーム名・送信フィールド名が一致しない。edit/update ルート、m03-02_admin_product_product_edit、rank_images は実装検索で確認できない。 |
| M15-09 | 1.50 | 設計のHTML断片返却API、GETページングAPI、ID解決API、セッション維持が実装されていない。反証検索: admin_archetype_main_card_html, admin_archetype_main_card_html_page, admin_archetype_search_ |
| F06-12 | 1.25 | PurchaseHistoryController.php の全Route定義を確認したが、設計が『利用者視点の入口』『画面遷移』『処理フロー』で明記する統合詳細パス /purchase_history/detail/{id}・承諾パス /purchase_history/update/{id} は |
| M13-01 | 1.25 | 設計で外部契約として定義された URL、ルート名、フォーム名、CSRFなし条件が実装の Controller/Twig/FormType と一致しない。設計ルート名・URLは対象範囲検索で見つからない。 |
| M13-15 | 1.25 | 設計の /banner/event 系ルートと同一POST振り分けが存在しない。反証検索として banner/event、admin_banner_event、event/banner、admin_event_banner、image/upload、settings、delete/{htmlClas |
| M03-02 | 1.00 | 設計のURL、HTTP400条件、JSONファイル名一覧返却が実装と一致しない。非画像MIMEのHTTP415のみ実装確認できる。 |
| M08-12 | 1.00 | 設計の外部契約URLに対して、実装は customer/customer_group 配下かつ新規・更新を個別URLに分けない構成で、パスとPOSTエンドポイント粒度が一致しない。探索範囲: src/Eccube/Controller, src/Eccube/Resource/template/ad |
| M13-01 | 1.00 | 設計のURL・bind名・新規登録遷移先と実装のルート契約が一致しない。 |
| … | | 他 102 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### CSV列名・フォーマットの不一致（60件・29.6人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-21 | 1.50 | 設計は最終行まで検査して複数行エラーを列挙するが、サーバ実装は最初の重大エラーで中断する。 |
| M08-08 | 1.50 | 設計されたフォームキーおよび hidden header/footer の外部契約と実装のSymfonyフォーム項目が一致しない。再検索範囲: CustomerManualMailType.php、Customer/mail_manual.twig、Customer/mail_manual_conf |
| M08-08 | 1.50 | 設計のPOST契約およびヘッダ・フッタ送信項目が実装と一致しない。 |
| M14-05 | 1.50 | CardCsv.php / AbstractCsvService.php / CsvImportType.php を Length, mb_strlen, strlen, string_max_length, 数値検証で再検索したが、該当CSV列の最大長・数値制約を設計どおり検証する処理がない。 |
| M04-21 | 1.00 | 設計は負数による在庫減算を許可しているが、実装のサーバ検証は符号付き数値を受け付けない。フロントJSは負数を許可しているため、送信後にサーバで不整合になる。 |
| M04-21 | 1.00 | 設計は入庫時だけ必須、廃棄・減算時は任意かつ原価非参照だが、実装は全CSVで仕入単価を必須にしている。 |
| B02-07 | 0.75 | 設計TSV表の外部契約は項目名・列順そのものだが、実装ヘッダは設計外の category_name_en/search_word を追加し、branch_status を is_branch_published に変更している。反証検索として branch_status/is_branch_publ |
| M04-21 | 0.75 | CSV以外エラーという設計に対し、TSVを受け付ける経路があり、サーバ側のサイズ/MIME制約も未設定。 |
| … | | 他 52 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### レスポンス本文・HTTPステータスの不一致（58件・18.8人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A06-03 | 1.50 | 設計の外部契約はHTTP 400/401/404と本文形まで規定しているが、実装はDTO検証で422を返し得るうえ、401/404も本文なしではなく {code, errors} を返す。さらにステータスIDの検証条件・エラーメッセージが設計と異なる。 |
| A07-04 | 0.75 | 設計は401/404を「本文を持たない」と定義しているが、実装はisAppApi()配下でJsonResponse(['code' => $statusCode, 'errors' => $errors], $statusCode)を返すため、外部レスポンス契約が異なる。反証としてBuyOrderC |
| M15-09 | 0.75 | 削除の失敗時リダイレクト先、失敗時メッセージキー、成功時メッセージキー、成功時の検索ページ復帰、CSRF不正時のHTTPステータスが設計と異なる。 |
| A02-01 | 0.50 | 設計は数値文字列を外部JSON契約としているが、実装は整数型に変換して返す。反証として PopupResponseBuilder、ProductRepository の findPopupProductByProductId、レスポンスフィールド名、price01/price02/weeklySol |
| A02-03 | 0.50 | 設計で必須の cardId が実装レスポンスに存在しない。一方で設計詳細のA02-03成功レスポンスにない subFileName/code/conditionCode/weeklySold/productUrl/beltUrl が返る。 |
| A02-03 | 0.50 | 設計は decimal 由来の数値文字列を外部契約としているが、実装は整数型に変換して返す。 |
| A02-04 | 0.50 | 設計は数値文字列を外部契約としているが、実装は整数型で返す。反証として PopupResponseBuilder、ProductRepository の findPopupProductByOldProductId / WithoutLang、price01/price02/stock/weekly |
| A02-05 | 0.50 | 設計は日時レスポンスをISO8601と明記しているが、実装はDB値を直接文字列化するだけで、`2026-06-01T10:00:00+09:00` 形式への整形保証がない。別キーワード（ATOM/ISO8601/format('c')/to_char/productClassUpdateDate）で |
| … | | 他 50 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 必須・相関チェックの欠落（19件・10.6人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M10-01 | 2.00 | 設計では任意または条件付き必須とされる項目が実装では常時必須扱い、または画面上で必須表示になっている。さらに郵便番号・電話番号の入力形状が設計の分割入力と異なる。反証検索として ShopMasterType、shop_master.twig、PostalType、PhoneNumberType、Ad |
| M03-02 | 1.00 | 設計の必須・桁検証がSymfony FormTypeのconstraintsとして実装されていない。HTML attr の min/maxlength や empty_data=0 は設計のNotBlank/Length/max値検証を満たさない。 |
| F06-18 | 0.75 | 設計は国・都道府県の不整合を送信後検証で拒否し国欄にエラーを表示すると規定するが、実装は海外→PREF_ABROAD強制・日本→null判定のみで組み合わせ整合検証・国欄エラー付与を行わない。ChangeController・EntryType・AddressType を確認したが該当検証は不在。 |
| M04-13 | 0.75 | 設計2-11が明記する2つのバリデーション（最大値99999999・在庫数超過エラー）が実装に存在しない。Twig/Action/Controllerを直接確認し不在を確認。 |
| M04-13 | 0.75 | 設計は店舗間移動時のみ必須の条件付き必須だが、実装はメンバーを条件無視で常時必須にし、所属は一度も必須化されない。店舗間移動判定自体が存在しない。Controller/Formを直接確認。 |
| M11-02 | 0.75 | 設計はスマレジ用アカウントの全メンバー1件のみ有効という一意制約と、重複時のフラッシュ差し戻し（フラグ非反映）を業務ルール/データ整合性/画面文言として要求。Controller・Form・Create/EditAction・Entity・Migration・locale いずれにも該当の検証・エラ |
| F04-03 | 0.50 | 設計が指定する利用者向けの国・都道府県整合バリデーションエラー（国項目直下の指定文言表示）が実装に存在しない。国=日本＋都道府県=国外 の不整合入力が PrefType（フィルタ無し）で構造的に可能であり、CustomerAddressType の POST_SUBMIT や ShippingTyp |
| M04-30 | 0.50 | 設計は価格変更発生期間の選択可能範囲を最大1か月に制限する要求。実装は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:77-94 で Fr |
| … | | 他 11 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### バッチのコマンド名の不一致（15件・9.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B08-06 | 1.00 | 設計の外部契約は `smaregi:batch updatePoint <受注ID>` だが、Symfony コマンド登録名と呼び出し側が別名になっている。`smaregi:batch updatePoint` / `updatePoint` / `smaregi:batch` で src/Eccu |
| B02-05 | 0.75 | src/Eccube/Command と src/Eccube/Service/Product を product:batch / saleNotification / FavoriteSaleNotification / favorite-sale-notification で再検索したが、pro |
| B05-03 | 0.75 | 設計は利用者視点の入口として `order:batch truncateWaitingNumber` を外部契約化しているが、実装の `#[AsCommand]` 登録名は別名である。反証検索として `order:batch truncateWaitingNumber`、`truncateWaiti |
| B05-05 | 0.75 | 設計の利用者視点の入口は order:batch deleteSmaregiProduct を外部契約としているが、実装の起動名が異なるため、設計どおりのコマンド名では本バッチに到達しない。反証として order:batch / deleteSmaregiProduct / SmaregiOtcDe |
| B05-06 | 0.75 | 設計は利用者視点の入口として `order:batch checkDuplicatePoint` を指定しているが、実装入口は `#[AsCommand(name: 'eccube:check-duplicate-point')]` のため、設計通りのコマンド名では起動できない。 |
| B05-07 | 0.75 | 設計は利用者視点の入口として `order:batch checkNotReflectedPointUsage` を外部契約にしているが、実装の `AsCommand` は別名 `eccube:check-not-reflected-point-usage` で登録されているため、設計コマンド名では |
| B06-02 | 0.75 | 設計は外部契約として `otcBuyOrder:batch updateSummary [YYYY-MM-DD]` を指定しているが、実装の `#[AsCommand]` は別名で登録されており、設計コマンド名で起動できる根拠がない。探索範囲: src/Eccube, html。検索語: `otcB |
| B08-02 | 0.75 | 設計の利用者視点入口は customer:batch lostPoint だが、実装入口は eccube:customer:lost-points で外部契約が一致しない。反証として customer:batch/lostPoint/lost-point/lost-points/aliases を  |
| … | | 他 7 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 桁・範囲・形式の検証漏れ（18件・6.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M08-04 | 1.00 | 設計はSJIS換算上限を要求しているが、実装は通常の文字列長制約のみ。探索範囲: src/Eccube/Form, src/Eccube/Validator, src/Eccube/Service, src/Eccube/Controller/Admin/Customer。 |
| M10-01 | 1.00 | fax_number、FaxNumber、FAX番号、admin.common.fax_number を M10-01 の Controller/Form/Twig/locale へ反証検索したが、画面入力・検証・保存に接続する実装は確認できなかった。エンティティ列だけでは利用者が直接操作する設計要 |
| M04-09 | 0.75 | 設計は『振替点数>現在庫』で明示エラーとする要求だが、Controller/StoreAction/Form/Twig(JS) いずれにも現在庫超過を検知しユーザーへエラー表示する処理が無く、超過登録が成立し在庫がマイナスになる。書式範囲チェック(1〜1000000)とは別要求。 |
| M04-23 | 0.50 | フォーム型にはMIME制約があるが、取込POSTでフォーム検証を行っていないため設計のcsv以外エラーがサーバー側で保証されない。反証検索範囲: getMimeType/getClientOriginalExtension/mimeTypes/text/csv/tsv/upload_error_fi |
| M08-10 | 0.50 | 会員編集本体フォームの form._token は別フォームにあり、確認済変更用に動的生成されるフォームへ載らない。専用POST側にもCSRF検証が無い。 |
| M10-08 | 0.50 | 探索範囲（MallAutoMailController、AutoMailType、AutoMail detail.twig、src/Eccube全体）でFormValidHelper/refreshToken/removeTokenは0件。SymfonyフォームCSRFはあるが、設計の不正時例外化と |
| M03-13 | 0.25 | 設計は名称(英)の書式を半角としているが、実装は全角文字もフォーム検証を通過する構成。探索範囲: TagType.php, TagController.php, tag.twig, Entity/Tag.php。 |
| M04-17 | 0.25 | 設計は範囲を -99999999～99999999 と明記し負値を許容するが、実装は min=0 で下限を0に固定しており負の在庫増減数（在庫減算分）を検索できない。設計範囲と不一致。 |
| … | | 他 10 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### その他（19件・5.1人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F06-20 | 1.00 | 会員登録(EntryController)・会員情報変更(ChangeController:116-127 で FindBlacklistByCustomer 照合)にはブラックリスト判定があるが、配送先登録フロー(DeliveryController)には全く無い。app/Customize/Co |
| F07-04 | 0.75 | 設計は others 有無で主(1-1)の変更可否を切替え、未選択時は遷移不可を要求するが、実装は常に disabled 固定かつ hidden で主対象を強制送信するため常に変更不可・常に含む。切替ロジックが不在。 |
| M05-26 | 0.50 | 設計（pf-eccube3挙動）ではサイズ0判定の分岐が空で、サイズ0でも処理経路に残る。実装 getFormFile(AbstractCsvService.php:129-134)は `if ($formFile === null || $formFile->getSize() === 0) re |
| M08-08 | 0.50 | 設計はbase外テンプレートIDを404で拒否する要求だが、実装は存在するMailTemplateであれば表示処理へ進める。 |
| M04-09 | 0.25 | 設計は移動元＝移動先商品コードが同一の場合をエラーとする要求。実装では同一コードでもそのまま登録されるガードが無いため未実装。(B)振替後商品コード非存在エラーのみ StockTransferStoreAction.php:92 で実装済との対比。 |
| M08-10 | 0.25 | 設計は選手情報なしを404として扱うが、実装は会員編集画面へ戻すエラーフラッシュ扱いになっている。 |
| M10-08 | 0.25 | 設計が求めるサーバ側のエラーフラッシュ＋識別子なし表示へのリダイレクト契約が実装されていない。 |
| M13-01 | 0.25 | 設計のフォーム名とCSRFなし契約に対し、実装は別名のCSRF付きフォームになっている。 |
| … | | 他 11 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### バッチのコンソール出力・終了仕様（12件・4.7人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F06-17 | 1.50 | 設計は書式エラー時『保存せず入力保持でデッキ編集画面へ戻す』を利用者可視の中核挙動として複数の機能節（処理フロー・画面遷移・エラー処理・セッション・エッジケース）で明記するが、実装の更新確定フローには解析・エラー分岐・セッション保存・edit リダイレクトが全く無く、書式不正入力でもデッキが保存され |
| B05-06 | 0.50 | 取得エラーはコンソール出力され得る一方、送信時エラーは MailService 内でログ化されるだけで Command に伝播せず、設計が求めるコンソールへのエラーメッセージ出力にならない。 |
| B05-09 | 0.50 | 設計の外部契約はコンソールバッチの終了仕様である。実装には該当Command自体がなく、ログは子ジョブ内に閉じており、コンソール出力や戻り値1を保証する処理が確認できない。 |
| B02-03 | 0.25 | 設計は開始・完了の両方を日時付きで出力する要求だが、実装は完了文言のみ。`開始`, `日時`, `DateTime`, `now`, `success`, `writeln` で反証検索したが、B02-03 コマンドの日時付き開始・完了出力は確認できなかった。 |
| B02-05 | 0.25 | FavoriteSaleNotificationCommand と BatchFavoriteSaleNotificationAction を 開始/完了/date/new DateTime/format/datetime/日時 で確認したが、日時付きの開始・完了出力は見つからない。 |
| B02-07 | 0.25 | 設計は開始・完了の両方を日時付きでコンソール出力する要求だが、実装は完了のみで日時も含まない。反証検索では B02-07 コマンドに text/writeln/sprintf date 出力は確認できない。 |
| B05-03 | 0.25 | 設計は例外を捕捉せずコンソールへ伝播するとしているが、実装は Command 層で Throwable を捕捉して終了コードへ変換している。対象 Command/Action/Repository を `catch`、`Throwable`、`error`、`通知`、`Mailer`、`MailSe |
| B08-02 | 0.25 | 設計は開始・完了のコンソール出力に日時付きであることを要求している。LostPointsCommand 内に DateTime/format 等を使った日時出力はなく、反証検索でも当該コマンドの開始・完了メッセージに日時を付ける実装は確認できない。 |
| … | | 他 4 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 要仕様確定（18件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A05-01 | 設計は GET /order/prints/{店舗ID} と店舗ID(shop_id)パス引数、および A05-02 とのエンドポイント分離を要求するが、実装は POST /api/order/prints/direct/{base_info_id} の単一路線で、GETルートも /order/pr |
| A05-01 | 設計は応答を組み立てず本文を返さないとしているが、実装は明示的な400応答を組み立てる。ConnectionType, GetRequest, SetResponse, ResponseFile で再検索したが同ルート以外の代替実装は見つからない。 |
| A05-02 | 設計は ConnectionType がいずれにも一致しない場合『応答を組み立てず本文を返さない』とする。実装は StreamedResponse を組み立て、HTTP 400(Bad Request)・Content-Type text/plain の空応答を明示的に返す(91-96行)。応答を組 |
| A05-02 | 設計シート本体は A05-02 専用 URL `/order/prints/status/printed` とエンドポイント分離を要求しているが、実装は `/api/order/prints/direct/{base_info_id}` の単一入口で `ConnectionType` 分岐を継続して |
| A05-04 | 設計はフォーム値`params`(JSON文字列)必須＋`proc_name`・`X_contract_id`/`X_access_token`ヘッダ。実装は `smaregi-event-id`ヘッダとボディ生JSON(`$request->getContent()`)を EventService |
| A05-04 | 設計は200かつ空レスポンスを要求するが、実装は成功時もJSON本文を返し、設計にない Smaregi-Event-Id ヘッダ必須チェックにより400を返す分岐を持つ。 |
| A05-04 | 設計サンプルは with_deposit_others=all を要求するが、実装は別名の with_payments=none を送る。取引詳細取得APIクライアント内の固定クエリ、関連キーワード with_deposit_others/with_payments の再検索でも design 値を |
| A06-01 | 設計はpf-api側で必須検証しないことを明記しているが、実装は中継先へ委譲せずAPI入口で未入力を判定している。 |
| A06-01 | 設計の失敗レスポンス契約 {code,message} と、実装の {code,errors} が一致しない。さらに設計は中継先画面エラー文言をそのまま使う指定だが、実装は独自文言を生成している。 |
| A14-01 | 設計はA14-01のJSON外部契約としてネストしたカード詳細・マスタ項目を列挙しているが、近似実装は汎用Entity正規化に依存しており、公開レスポンス用DTO/配列組み立てが存在しない。反証としてEntityの各プロパティ、DeckBuilder用ルート、App/CardController、M |
| A14-02 | src/Eccube/Controller/Admin/Product/ProductController.php:1020-1034 の管理画面AJAXはカード詳細選択UI用の部分レスポンスで、設計が要求するカード詳細マスタ全体・関連オブジェクト・除外指定契約を満たさない。src/Eccube/S |
| A17-03 | シート本体のステータスコード表は必須項目欠落時404を要求しているが、実装は400を返す。なお同HTML内の埋め込み詳細設計にはHTTP 400の記載もあるため、設計内不整合はあるが、一次シート本文の404要求とは不一致。 |
| … | 他 6 件 |

---

# 第4波: 業務ロジック

**203件 / 126人日**（うち要仕様確定 19件は工数未算入）

画面種別: admin 152 / batch 18 / front 17 / api 16

主なドメイン: m04 32件 / m12 26件 / m13 19件 / m03 15件 / m14 13件 / b02 11件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| 抽出条件・検索条件が違う | 52 | 31.8 |
| ステータス遷移・分岐が違う | 33 | 19.9 |
| 集計・計算が違う | 32 | 19.5 |
| データ取得元・参照先が違う | 29 | 17.5 |
| 表示・出力要素の欠落 | 26 | 16.6 |
| セッション・状態の保持 | 11 | 8.0 |
| その他 | 10 | 5.5 |
| 権限・アクセス制御 | 6 | 5.0 |
| 必須・任意の扱いが違う | 4 | 2.5 |

### 抽出条件・検索条件が違う（52件・31.8人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M03-09 | 2.00 | 設計は商品規格の公開ステータスが公開の場合だけフロント表示、非公開・廃止は非表示とする要求。実装は checkVisibility で商品本体 Status のみを確認し、Product::getProductsByLanguage や ProductRepository/ProductClassR |
| M03-11 | 2.00 | 表示系の一部は実装済みだが、設計が求める検索対象からの除外が商品検索条件側に未反映。ProductController、SearchProductType、SearchProductBlockType、Front SearchType、ProductRepository、TopCategoryLis |
| M12-01 | 2.00 | 反証検索として delivery/shipping/店頭受取/スムーズ/OrderStatus/order_status/出荷完了/対応状況 を SummaryController・AnalysisSummaryBuilder・DtbDailySummaryRepository・DtbMonthly |
| B16-09 | 1.50 | 設計はクローラー設定として階層制限なし取得と特定URL配下の除外を要求している。実装は `sitemap_page.xml`、`sitemap_product_{page}.xml`、`sitemap_purchase_{page}.xml`、`sitemap_deck.xml`、`sitemap_ |
| A02-02 | 1.00 | 設計は foil_flg と price を外部契約のクエリ条件として定義しているが、Controllerシグネチャと呼び出しに Request/query 取得がなく、Repositoryのメソッド引数・SQLにもクエリ条件が存在しない。別キーワード（foil_flg, price, query- |
| A06-02 | 1.00 | 設計が定める「店舗紐づきなしなら無絞り込み」の分岐が実装されていない。反証として getBaseInfo、default_search_base_info_id、member_base_info、isEditableShop、shopId null/empty 分岐を検索したが、この API の一覧 |
| F07-01 | 1.00 | MtbBanner にイベントFK・開催日・公開状態カラムが存在せず、Repository/Controller にも日付/公開条件が無い。過去日・非公開イベント想定のバナーでも設定次第で常時表示され、設計の表示条件が未実装。 |
| M04-18 | 1.00 | 設計は admin.history.search を入力契約とする検索条件復元型のCSV出力だが、実装は hidden ids[] によるID指定型の出力で、CSV endpoint 内で検索条件セッションを読まず、フォーム復元も行わない。 |
| … | | 他 44 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### ステータス遷移・分岐が違う（33件・19.9人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-10 | 2.00 | 設計はステータス到達日時の出力を要求しているが、実装は未設定の stock_at フィールドを出力している。反証として moveFromApprovalAt / MoveToApprovalAt / STATUS_MOVING / STATUS_INBOUND_APPROVED / SQLカラム名ま |
| M04-23 | 2.00 | 設計はCSV登録処理内で承認申請まで行う要求だが、実装のCSV取込経路には StockJoinApplyApprovalAction 呼び出しが存在せず、承認申請は別画面の admin_stock_join_apply_approval ルートに分離されている。 |
| M04-12 | 1.50 | pager => null 固定でページ遷移リンクが機能・表示ともに不在。 |
| M09-10 | 1.50 | 設計のピックアップフラグ検索ではなく、汎用商品一覧へ遷移する。反証検索でpick_up_flgはShopTopController用の商品取得Repositoryにのみ存在した。 |
| M03-02 | 1.00 | 設計は廃止後の商品情報変更不可を求めるが、実装はUIの送信ボタン非表示に留まり、サーバ側更新禁止がない。DISPLAY_ABOLISHED の検索結果も編集POST経路ではなく一括ステータス/テンプレート表示に限られる。 |
| F02-04 | 0.75 | front テンプレートで『閲覧店舗を選択』は 0 件（admin/mall/tenant/index.twig のみ）。イベント側の店舗切替セレクト（Event/index.twig）は店舗紹介ページの店舗一覧ではなく別物。旧 shoppage 由来 UI が未移植と見られる。 |
| F06-24 | 0.75 | 設計オラクルは『明示エラーを出さず内容を表示しないだけ』を要求するが、実装は常に例外→404エラーページを明示表示する。ContactController::detail・history_detail.twig を精査し、静的な非表示フォールバックが無いことを確認。 |
| M08-04 | 0.75 | 未確認への降格処理は部分実装されているが、設計が求める身分証有効期限の同時クリアが保存経路に存在しない。setIdExpirationDate は本人確認完了専用処理側でのみ確認。 |
| … | | 他 25 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 集計・計算が違う（32件・19.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-13 | 2.00 | DtbStockSplitJoinDetail 全カラム・StockSplitApplyApprovalAction・StockSplitApprovalApproveAction を確認。設計は承認申請時に仕入総価格を計算・登録することを要求するが、計算タイミング（承認処理時）・格納先（明細に非永 |
| M04-38 | 2.00 | 設計の状態別/区分別表示制御を実装しておらず、承認済・却下・廃棄でも同一計算で値を表示する。 |
| M05-21 | 1.50 | 設計(pf-eccube3を確認値とする処理フロー)は『最小カテゴリ MIN(ct.category_id) がグッズ定数(Category::GOODS_ID)/予約グッズ定数(Category::RESERVED_GOODS_ID)に一致するか』でサプライ(goods)帯への強制を決める。実装( |
| M12-01 | 1.50 | 反証検索として DatePeriod/CarbonPeriod/補完/0で/zero/fill/missing/empty/calendar を Analysis 配下と DtbDailySummaryRepository/DtbMonthlySummaryRepository で確認したが、期間内 |
| M12-01 | 1.50 | SummaryController、Analysis配下Service、DtbDailySummaryRepository、DtbMonthlySummaryRepository、summary.twig を 補完/DatePeriod/DateInterval/P1D/P1M/zero/0で で反 |
| M03-30 | 1.00 | 設計はCSV価格登録/更新時に条件判定でスマレジ連携フラグを有効化する要求だが、実装は既にONの規格だけを連携候補にする。基準価格・状態などの条件で smaregi_alignment_flg をOFFからONへ更新する処理がない。 |
| M04-09 | 1.00 | 設計は『商品コードを直接入力しフォーカスアウトした際』に振替先情報を表示する挙動を要求。blur 契機の情報表示処理が存在しないため未実装（モーダル選択契機の表示は実装済で別要求）。 |
| M12-01 | 1.00 | MtbBuyOrderStatus / MtbOtcBuyOrderStatus / STATUS_COMPLETE / 買取成立 / buy_order_status_id / otc_buy_order_status_id へ翻案して再検索したが、M12-01集計SQLでは買取成立ステータス限定 |
| … | | 他 24 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### データ取得元・参照先が違う（29件・17.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M03-45 | 3.00 | 設計はフロント非表示・親非表示・支店非表示を全般的な表示制御として要求するが、実装は一部導線だけのフィルタに留まる。反証検索範囲: CategoryController.php, category.twig, CategoryType.php, CategoryRepository.php, Top |
| B02-05 | 2.00 | DtbFavoriteProductRepository と DtbFavoriteProduct エンティティは存在するが、BatchFavoriteSaleNotificationAction の依存先は CustomerFavoriteProductRepository で、findSaleF |
| M04-21 | 1.50 | 設計が求める規格在庫・規格本体の同期更新が実装経路上で満たされない。 |
| M04-12 | 1.00 | 行をチェック→各種出力ボタン活性化 の選択駆動UIが未実装。 |
| M04-33 | 1.00 | 設計は「商品名から取り出した色とレアリティ」を出力源としているが、実装はカード色マスタとレアリティマスタを出力源にしている。反証として colorAndRarity、colorName、rarityCode、商品名から取り出した色、stripProductNameComponents、dtb_car |
| M05-01 | 1.00 | 引き渡し前/後、next_order_id、nextOrder、order_number、previous/original order を OrderRepository、SearchOrderType、OrderController、Smaregi handler、Order entity へ翻 |
| A05-02 | 0.75 | 設計は印刷情報の『店頭注文番号欄』に dtb_order_number.value(待ち番号)を受注IDで引いて印字するとする。実装は抽出クエリで dtb_order_number を一切参照せず、店頭注文番号ラベル直後の欄(94-97行)に o.order_number(注文番号)を出力している。 |
| B05-08 | 0.75 | `src/Eccube/Repository/OrderRepository.php:877` に抽出メソッドはあるが、`rg getSmaregiErrorOrder\(` で利用箇所は定義のみ。`src/Eccube/Service/Smaregi/SmaregiUpdatePointActio |
| … | | 他 21 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 表示・出力要素の欠落（26件・16.6人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-12 | 2.00 | 表示件数の単一選択(初期10件・標準マスタの選択肢)が実装に存在しない。件数制御自体が成立していない。 |
| M13-08 | 2.00 | 設計はメインとサイド双方のカード一覧・枚数見出しを要求しているが、実装の表示モデルとTwigはメインボード専用である。 |
| M13-08 | 1.50 | array_chunk/40/page split/BOARD_ID_SIDE/textSide/sideboard/サイドボード等へ翻案して再検索したが、デッキリスト表示経路ではメインカードの40枚分割とサイドボードページ制御が存在しない。 |
| M13-01 | 1.00 | 設計の sort/order パラメータ、ASC/DESC値、エラー処理が実装されていない。 |
| M13-01 | 1.00 | 設計のリクエストパラメータ名・値体系・不正値処理と実装が異なる。不正 order をエラーにせず DESC として処理する。 |
| M14-10 | 1.00 | 保存した is_shown_in_event をフロントイベント一覧、検索可能候補、検索結果条件に利用していない。 |
| B13-01 | 0.75 | 設計は失敗時出力として取引不在・未完了等のメッセージ収集を要求しているが、実装にはメッセージ配列や個別理由の蓄積がなく、削除件数だけを返す。 |
| M09-10 | 0.75 | 設計が要求するフロント側の未設定タイル補完処理が実装範囲に存在しない。 |
| … | | 他 18 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### セッション・状態の保持（11件・8.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-09 | 1.50 | 設計はCSV登録エラー後も検索項目と一覧選択状態を維持する要求だが、実装はエラー時リダイレクトに選択IDや resume=1 を渡さず、通常GETで検索セッションを初期化するため保持されない。materialGapRows にはこの個別要求が無く extractorMissed として補足した。 |
| M14-06 | 1.00 | 設計のクエリ名・値ドメイン（sortSelect の4文言完全一致）と実装のクエリ名・検証単位（sort_key/sort_order）が異なる。pageCount も設計名ではなく page_count で実装されている。 |
| M14-07 | 1.00 | 設計は状況別のフラッシュキーとセッションページ復帰を要求しているが、実装は汎用エラーキー1つへ集約し、リダイレクト先も admin_cardset_list 固定で eccube.admin.cardset.page_no を使わない。反証検索として設計キー3種、not_found、image_no |
| F06-05 | 0.75 | 同コントローラ・Front配下・EventListener配下を previousUrl/戻り先/search_return/product_list_url 等で grep しても戻り先の保存・消費処理は不在。設計が現行踏襲として要求するリダイレクト挙動が未実装。 |
| M14-06 | 0.75 | 設計が要求する resume によるセッション3キーのクリアと、pageCount/sortSelect キー保存が実装されていない。反証検索でも CardsetController、Cardset Twig、html 配下に resume / eccube.admin.cardset.pageCo |
| M15-08 | 0.75 | admin.deck.search と eccube.admin.deck.search の両方、DeckController と SearchControllerTrait を再確認した結果、設計値 admin.deck.* そのものの保存処理は確認できない。 |
| M03-06 | 0.50 | findBy(['id' => $csvIds]) に orderBy がなく、POST配列順を保持する保証がない。画面で並べ替えた順序ではなくDB取得順で rank が保存され得る。 |
| M04-03 | 0.50 | 設計は商品未選択時に一覧へリダイレクトし「商品が選択されていません。」を表示すると規定。実装の new()/store() は一覧でなく自ルートへ戻し、表示文言も『指定された在庫が見つかりませんでした。』で不一致。自ルートへのID無しリダイレクトはループの懸念もある。 |
| … | | 他 3 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### その他（10件・5.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M05-26 | 0.75 | 設計は桁埋め済み注文番号でサブ注文情報を検索するが、実装はCSV値をそのままorder_numberにfindOneByしており、桁埋めもサブ注文検索も行わない。 |
| M10-07 | 0.75 | ルートのエンティティ解決で対象が見つからないケースをコントローラ内で扱っておらず、設計された警告付き一覧リダイレクトにならない。 |
| B13-01 | 0.50 | 実装には orderBy('ee.paymentNo') はあるが、同一決済番号の検出、前回照会結果のキャッシュ、前回結果に基づく更新・削除・保留処理の流用が存在しない。 |
| F06-22 | 0.50 | 設計は4-5を『全店舗名』と4-2から意図的に書き分けているが、実装は eventShop にも公開かつ営業中フィルタを適用し閉店/非公開店舗が選択肢から欠落する。 |
| M03-01 | 0.50 | 設計は商品名(日/英)の両方を検索対象にしているが、実装の visible な商品名検索は日本語名 p.name のみに一致する。英語商品名 p.name_en での検索要求が満たされない。 |
| M03-01 | 0.50 | 設計はカード名(日/英)を検索対象にする要求だが、実装は日本語カード名 name_jp のみを検索している。 |
| M03-13 | 0.50 | getTitleJp/getTitleEn/title_jp/title_en を Controller/Resource/template/Service/Util/html で再検索しても、商品検索ページのタイトルへ反映する実装がない。 |
| M03-13 | 0.50 | getDescriptionJp/getDescriptionEn/description_jp/description_en を Controller/Resource/template/Service/Util/html で再検索しても、商品検索ページの meta description へ反映 |
| … | | 他 2 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 権限・アクセス制御（6件・5.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F02-04 | 1.50 | php 全体で ShopPageElement 参照は Entity/Repository 定義以外 0 件。セクション名（初心者講習会・取り扱い商品・スタッフ 等）や末尾用クラス付与ロジックもテンプレートに不在。旧 shoppage 由来要素がリニューアルの ShopTop 再編時に未移植と見られ |
| M13-11 | 1.00 | EntryRegistrationController は getDefaultSearchBaseInfo() を初期値に渡すだけで、検索対象をメンバーが権限保持する店舗集合へ常時制限していない。EntryRegisterSearchType の query_builder は BaseInfo  |
| M13-12 | 1.00 | 登録処理の防御はあるが、設計が求める「権限を保持している店舗のイベントの申込のみ表示」が一覧・ボタン表示で満たされていない。 |
| F06-26 | 0.75 | 設計は支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記。実装は 1～22 の遮断を getShopFrontFlg()（本店店内 id=3 のみ true）でゲートしており、支店は branch_shop_front_flg 経由の本店注文遮断しか持たないため、支店ア |
| M13-05 | 0.50 | 非編集権限店舗の選択エラーは存在するが、設計が求める「編集権限のある店舗のみ表示」が未達。EventType/Controller/Twig/MemberBaseInfos 周辺を再検索したが、イベント登録フォームの店舗選択肢を権限店舗に絞る query_builder は見つからない。 |
| M06-04 | 0.25 | 設計は買取管理を使えるユーザに更新を限定する要求だが、実装は編集可能店舗の確認のみで、買取管理機能の利用権限または該当ルートのアクセス権限を確認していない。 |

### 必須・任意の扱いが違う（4件・2.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A06-03 | 1.00 | 設計は任意項目かつnullサンプルを示しているが、実装は商品規格IDが空の個別入力商品を含む全明細で quantity/price null を拒否し、削除・登録処理へ進まない。 |
| A06-03 | 0.50 | false を指定して未確認へ戻す更新が無視される。また、true の場合は受注側の適格請求書発行事業者フラグ確認なしに保存されるため、設計の『該当する場合のみ』『指定値で更新』と一致しない。 |
| M08-05 | 0.50 | 会員なしはParamConverter相当で404になり得るが、選手情報なしの場合の明示的な404処理が実装されていない。反証として getPlayer、Player === null、createNotFoundException、NotFoundHttpException、point_updat |
| M08-05 | 0.50 | 設計は会員または選手情報が無い場合の 404 を要求しているが、実装は Player null を 404 に変換せずメソッド呼び出しへ進む。反証として getPlayer, Player, notFound, createNotFoundException, 404 を CustomerPoint |

### 要仕様確定（19件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A05-01 | 設計は印刷情報の「店頭注文番号欄」を dtb_order_number.value（待ち番号/waiting_number）から取得すると規定。実装は dtb_order_number も waiting_number も参照せず（両リポジトリのSELECTに該当列なし）、店頭注文番号欄(行94ラベ |
| A05-01 | 設計は SetResponse でブラウザ印刷フラグが立たない場合『ステータスをピック中へ更新し確定日時(confirm_date)に現在時刻を設定』と規定。実装(行91-97)は BaseInfo->isMainShop() で分岐し、本店は setConfirmDate、支店は setPicki |
| B02-03 | 設計のスター付きカスタマイズ要求は親区分「入庫」「買取」のみだが、実装は「入庫」「棚卸/在庫調整」相当を対象にしており、買取対象が確認できない。 |
| B02-03 | 設計の対象区分は「入庫・マスタ更新」だが、実装は「入庫・棚卸」を条件にしている。`マスタ更新` へ翻案した検索でも B02-03 集計条件としての実装は確認できなかった。 |
| B02-07 | 設計は ECCUBE とスマレジ在庫の合算登録を要求しているが、実装は対象外としており未実装。反証検索では ProductStock に stock_location_id とスマレジ区分定数はあるが、B02-07 の集計処理内で stock_location_id=1/2 を合算する SQL/分岐 |
| B02-07 | 設計は商品在庫に存在する全商品規格IDを対象にし、履歴欠損週を0にする要求だが、実装は在庫履歴が存在する product_stock_id のみを集計対象にする。ProductStock 起点の LEFT JOIN などの反証実装は対象リポジトリ内に確認できない。 |
| B02-07 | 設計は商品在庫に存在する全商品規格IDを対象にし、履歴なしは0とする要求だが、実装はdtb_product_stockを起点にLEFT JOINしていないため、履歴が全く無い商品在庫を0行として出力・登録できない。product_stock / dtb_stock_history / getLast |
| F03-02 | ロケール・IDを含むフルURLを共有し、短縮URL化が未対応。 |
| M03-01 | 設計で要求される棚番号昇順、および詳細仕様の p.update_date DESC 既定順が実装の orderBy に存在しない。 |
| M03-01 | 設計の棚番号昇順が一覧クエリのORDER BYに存在しない。別キーワード（ShelfNumber/shelf_number/sortNo）で確認しても、商品一覧の並び順として使われる実装根拠は見つからない。 |
| M03-27 | 設計は必須の数値項目として新規追加しているが、実装は任意表示かつ取り込み時に保存しない互換用列として扱う。反証検索として「原価単価」「costUnitPrice」「cost_unit_price」「wholesalePrice」「wholesale_price」を確認したが、グッズ商品CSV取込で原 |
| M04-01 | 設計の画面表示要件は、初期表示時にメンバー管理のデフォルト検索表示店舗で絞り込んだ在庫一覧を表示するとする。実装は GET 初回（page_no/resume/検索クエリなし）で検索セッションを破棄し、pagination=[] の空一覧を返す。初期表示でデフォルト店舗絞り込み検索は実行されない。た |
| … | 他 7 件 |

---

# 第5波: 実行制御

**26件 / 23人日**（うち要仕様確定 3件は工数未算入）

画面種別: batch 14 / admin 10 / api 2

主なドメイン: b02 7件 / b05 3件 / m13 3件 / a05 2件 / m05 2件 / m07 2件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| トランザクション境界・ロールバック範囲 | 9 | 13.5 |
| その他 | 7 | 5.2 |
| 実行環境設定（時間・メモリ・SQLロガー） | 6 | 3.5 |
| 同期／非同期・再実行性 | 3 | 0.8 |
| 排他制御・ロック | 1 | 0.5 |

### トランザクション境界・ロールバック範囲（9件・13.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M05-11 | 5.00 | 設計はpf-eccube3挙動として『PurchaseFlowのprepare/commitは無い』(html:244)『validateもcalculate()＋$form->isValid()のみでEC-CUBE4系PurchaseFlowを用いない』(html:242)としているが、enter |
| B02-01 | 2.00 | 設計は途中まで反映された行が残る部分反映モデルだが、実装は単一トランザクションで例外時に全体ロールバックする。`flush`、`clear`、`100`、`setSQLLogger`、`beginTransaction` を反証検索し、100件ごとの反映は別メソッド updateRecommend  |
| B02-03 | 1.50 | 設計の部分反映・再実行回収モデルと、実装の全体トランザクション/全体ロールバックが一致しない。 |
| B13-01 | 1.50 | 設計はバッチ全体で照会・更新を積み最後に確定することを要求しているが、実装は対象申込みごとにDB確定するため、途中エラー時に既処理分が確定済みになる。 |
| M05-26 | 1.50 | 設計は成功後処理（ポイント付与・出荷完了メール・別系ポイント）を try の外側で独立実行する。実装はポイント付与(pointService->gainPoints)とスマレジ発生ポイント連携ジョブ登録を try 内かつ beginTransaction/commit の内側（315-320行付近、 |
| A05-04 | 0.75 | 設計は明示ロックなしとするが、実装は会員ポイント更新でトランザクションとPESSIMISTIC_WRITEを使う。 |
| B02-03 | 0.50 | 設計は途中まで反映された行が残る部分反映モデルだが、実装は例外時に全体ロールバックするため反映済み行は残らない。`途中失敗`, `反映済み`, `rollBack`, `commit` で反証検索し、別経路での部分コミット実装は確認できなかった。 |
| B05-03 | 0.50 | 設計は削除とカウンタ初期化を1トランザクションにまとめないことを明記しているが、実装は `beginTransaction()` から `commit()` までの1トランザクション内で両テーブル操作と再登録をまとめている。 |
| … | | 他 1 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### その他（7件・5.2人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B16-09 | 2.00 | `src/Eccube/Command` 配下のコマンド一覧にサイトマップ生成コマンドはなく、スケジュール検索で見つかるのはDependabot/Vaddy等のGitHub workflowと `eccube_sitemap_products_per_page` 設定のみ。B16-09を起動するEv |
| M14-07 | 1.50 | 設計の終了後イベントによる download 配下掃除が実装されていない。 |
| B02-03 | 1.00 | 設計された100件単位の反映境界とキャッシュクリア処理が実装されていない。周辺の Command/Service/Repository で別名検索しても該当処理は確認できなかった。 |
| M10-08 | 0.50 | 設計が副作用として明記するTwigローダ追加ディレクトリ登録が実装されていない。 |
| M07-04 | 0.25 | 設計は送信成功でメール履歴行がDBに増えることを求めるが、実装はUnitOfWorkへpersistするだけでSQL INSERTを発行する flush の証跡がない。送信元未設定・送信例外時に履歴を増やさない分岐は実装済みだが、成功時履歴INSERTが未達。 |
| B05-08 | 要仕様確定 | B05-08のバッチ本体が存在せず、抽出受注をループして `sleep`/`usleep` 等で待機する実装もない。`src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:90-94` の共通RateLimiterは見つかったが、 |
| B08-02 | 要仕様確定 | 設計はスマレジ連携の流量制御として会員ごとの短いインターバルを要求しているが、対象バッチ実装内に待機処理が存在しない。反証として英日キーワードと sleep/usleep を検索したが、ポイント失効バッチ内のインターバル実装は確認できない。 |

### 実行環境設定（時間・メモリ・SQLロガー）（6件・3.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B02-05 | 1.50 | BatchFavoriteSaleNotificationAction と関連 Repository を clear, detach, batch, limit, offset, chunk, memory, 一定件数 で確認したが、本処理に一定件数ごとのメモリ解放は見つからない。 |
| B02-01 | 0.75 | 設計の処理フロー1番目の要求が B02-01 の実行経路に存在しない。別キーワード `set_time_limit`、`memory_limit`、`setSQLLogger`、`SQLLogger` で再検索したが、該当は updateRecommend のみ。 |
| B02-07 | 0.50 | 長時間バッチ向けの実行環境設定が設計にあるが、対象実装範囲で該当API呼び出しが確認できない。 |
| M14-05 | 0.50 | 取込経路を setSQLLogger(null), SQLLogger, clearCache, entityManager->clear, rowIndex % 100 で再検索したが、カードCSV取込でのSQLロガー無効化・定期キャッシュ解放は確認できない。 |
| M13-13 | 0.10 | 設計のPOST前提処理が本機能の Controller/Service に実装されていない。 |
| M13-13 | 0.10 | 同リポジトリの他CSV/集計系コントローラにはset_time_limit(0)があるが、本機能のCSV取込入口には存在しない。 |

### 同期／非同期・再実行性（3件・0.8人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M13-07 | 0.50 | 設計は非XHRを失敗JSONにする要求だが、実装は非XHRを拒否せず、フォーム検証・ID取得・更新へ進む。反証検索でも Admin/Event/EntryController の一括更新周辺に isXmlHttpRequest / X-Requested-With 判定は存在しない。 |
| M07-04 | 0.25 | 設計は履歴INSERTの確定と送信成功時の履歴行増加を要求しているが、買取手動メール送信経路では `persist` 後に `flush()` へ到達する実装証跡がない。反証検索では Controller/Admin/Purchase/MailController.php、Service/MailS |
| A05-04 | 要仕様確定 | 設計は同期実行し結果件数を応答。実装は SmaregiWebhookEvent を永続化し MessageBus へ SmaregiWebhookEventMessage を dispatch して即時200を返すのみで、取引取得・ポイント/受注反映は非同期ハンドラで後続実行。再実行性は smare |

### 排他制御・ロック（1件・0.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B05-05 | 0.50 | 設計は本バッチが楽観ロック・悲観ロックの対象を持たないと明記しているが、実装は MessengerJob に対して処理ロックを使用する。反証として B05-05 の Command/Dispatcher/MessageHandler/Service を確認し、該当ロックは削除メッセージ処理の本線に存 |

### 要仕様確定（3件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A05-04 | 設計は同期実行し結果件数を応答。実装は SmaregiWebhookEvent を永続化し MessageBus へ SmaregiWebhookEventMessage を dispatch して即時200を返すのみで、取引取得・ポイント/受注反映は非同期ハンドラで後続実行。再実行性は smare |
| B05-08 | B05-08のバッチ本体が存在せず、抽出受注をループして `sleep`/`usleep` 等で待機する実装もない。`src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:90-94` の共通RateLimiterは見つかったが、 |
| B08-02 | 設計はスマレジ連携の流量制御として会員ごとの短いインターバルを要求しているが、対象バッチ実装内に待機処理が存在しない。反証として英日キーワードと sleep/usleep を検索したが、ポイント失効バッチ内のインターバル実装は確認できない。 |

---

# 第6波: データ永続化・外部連携

**84件 / 114人日**（うち要仕様確定 9件は工数未算入）

画面種別: admin 51 / batch 19 / api 10 / front 4

主なドメイン: b02 9件 / m03 9件 / m08 8件 / m14 7件 / b05 5件 / m04 5件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| スマレジ連携 | 16 | 36.5 |
| メール送信・通知 | 17 | 19.0 |
| その他 | 11 | 17.5 |
| 保存先テーブル・カラムが違う | 13 | 16.8 |
| S3・ファイル出力・支店連携 | 16 | 16.2 |
| 削除方式（論理／物理）が違う | 2 | 4.0 |
| 監査ログ | 9 | 3.9 |

### スマレジ連携（16件・36.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A01-01 | 5.00 | StockChangeCsvImportHandler は CSV行ごとに DtbStockEditApprovalDetail を作成し、onAfterImport で DtbStockApprovalList を作成する（/home/y-saito/Developments/ec-cube-en |
| A01-01 | 5.00 | WebhookController は単一の smaregi_webhook ルートで受信し EventService に保存後、SmaregiWebhookEventMessage をdispatchする（/home/y-saito/Developments/ec-cube-enterprise/ |
| M04-38 | 4.00 | 設計上のスマレジ連携中/スマレジ連携失敗ステータスが実装ステータス体系・検索条件・操作条件に存在しない。 |
| M12-01 | 4.00 | DtbDailySummaryRepository.php / BatchAggregateDailySummaryAction.php / BatchAggregateMonthlySummaryAction.php / AnalysisSummaryBuilder.php を ProductSt |
| M14-04 | 4.00 | 設計が外部契約として要求する登録/更新/削除後のHTTP通知副作用が確認できない。別キーワードで Smaregi/branch/notify 系も再検索したがカード処理に紐づく実装は見つからなかった。 |
| A01-01 | 3.00 | StockApprovalStoreAction は ProductStock 更新と StockHistory/ApprovalList 登録のみ（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stoc |
| M03-31 | 3.00 | 設計は取込成功時の支店システム通知を副作用として要求。実装は連携ブロックがコメントアウト＋TODO移植待ちで、BranchUpdateService 自体が enterprise 側に未移植のため通知が発生しない。スマレジ連携は別系統で本要求を満たさない。ProductPriceCsvControl |
| B05-09 | 2.00 | 設計は時間窓検索をバッチの入力データ検索条件として定義しているが、実装には期間パラメータの組み立て、手動期間指定の受け口、一覧取得結果の処理ループがない。単一transactionHeadIdを取得する `getTransaction()` は `SmaregiTransactionProcessM |
| … | | 他 8 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### メール送信・通知（17件・19.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M03-02 | 5.00 | 設計の副作用/APIとして明記された支店システム更新通知が更新経路に存在しない。UniSearch関連は手動/バッチのフィード生成や一覧検索であり、ProductControllerの更新確定後通知を代替していない。 |
| M04-21 | 4.00 | 設計で取込処理内の副作用とされる入荷通知・支店在庫通知が実装されていない。 |
| M08-07 | 2.00 | 設計は dtb_user_mail_history を一覧表示・絞り込みの対象テーブルとしているが、実装は dtb_mail_history の MailHistory エンティティを使用する。反証として DtbUserMailHistory、MailHistory、MailHistoryRepos |
| M08-08 | 2.00 | 設計の永続化先テーブル・列名と実装の保存先が異なる。再検索範囲: MailHistoryEntityManager.php、MailHistory.php、DtbUserMailHistory.php、CustomerMailController.php、`dtb_user_mail_history |
| B13-01 | 1.50 | 設計は想定外エラーを重複排除して1つにまとめ管理者へ通知することを要求しているが、実装は申込み単位の例外ごとに通知メールを送信するため、同一エラーが複数回通知され得る。 |
| M14-05 | 1.00 | 反証検索では DtbBranchUpdateError エンティティ/Repository は存在するが、カードCSV取込経路からの呼び出しはない。BranchUpdateService は移植TODOコメントのみで、カードCSV成功後の通知実装が不在。 |
| M08-08 | 0.50 | 設計はフォーム送信内容の件名を送信メールの件名として扱うが、実装は送信時に件名を書き換える。履歴も Message の件名を保存するため、記録件名にもプレフィックスが入る。 |
| M08-08 | 0.50 | 設計はフォーム上の件名を送信メール件名として扱うが、実装は店舗名プレフィックスを強制付与するため、確認画面の件名と送信・履歴の件名が一致しない。 |
| … | | 他 9 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### その他（11件・17.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M04-13 | 4.00 | 設計の7区分と実装マスタ6区分が一致せず、『結合計画承認済み』『結合完了承認待ち』『入庫完了』が存在しない。二段階承認が単一承認→入庫済みに集約。migration/Entityを直接確認。 |
| M10-01 | 3.00 | latitude、longitude、緯度、経度、google_map_url を Form/Twig/Entity/locale へ反証検索した結果、M10-01実装は緯度経度ではなく Google Map 埋め込みURLを扱っている。設計要求の項目名・入力数・検証契約が異なる。 |
| M12-01 | 3.00 | 廃棄コスト / shortage / waste / total_cost / stockChangeQuantity / DtbStockHistory を再検索したが、M12-01集計で廃棄・欠品のコスト金額を合算する実装は見つからない。 |
| M12-02 | 2.00 | 設計は廃棄コスト合計の出力を要求しているが、実装は在庫変動数量の合計を waste_count/discard_count として出力する。total_cost_price_before/after や原価合計を用いた廃棄コスト算出は確認できない。 |
| M12-02 | 2.00 | 設計は欠品コスト合計の出力を要求しているが、実装は欠品数量の合計を shortage_count/out_of_stock_count として出力する。原価・コスト金額を用いた欠品コスト算出は確認できない。 |
| F06-01 | 1.00 | 設計は deck_user_id を『一意』と要求するが、実装は一意性をアプリ側ベストエフォート照合のみで担保し、DB制約もトランザクション直列化も無く重複可能性を実装自身が認めている。 |
| F06-13 | 1.00 | 確認中・オンライン確認済み・簡易書留確認済みの3ステータスで設計文言と表記が相違(「現在、確認中です」「オンラインで本人確認済み」「簡易書留で本人確認済み」)。 |
| M09-04 | 1.00 | 設計は lltext_len=99999 をフォーム上限にする要求だが、実装は ltext_len=3000 を使っており、設計上限より短く拒否する。 |
| … | | 他 3 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 保存先テーブル・カラムが違う（13件・16.8人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| A06-16 | 4.00 | 設計は店頭買取受注側の新規カラムにダブルチェック者を保存する前提だが、実装は承認者テーブルへ role=double_check として登録する方式で、保存先とデータ構造が異なる。 |
| M06-01 | 4.00 | 設計はステータス更新前の印刷済みチェックを必須条件としているが、実装は印刷済み状態を永続化・入力・検証する証跡がなく、ステータス更新の可否判定に使えない。 |
| M08-08 | 2.00 | 設計の永続化先 dtb_user_mail_history ではなく dtb_mail_history に保存しており、件名列も subject ではなく mail_subject になる。 |
| M03-28 | 1.50 | 設計は dtb_product_tag に base_info_id 列が無いこと、および書換対象列から base_info_id を除外することを明記しているが、実装は SQL と Entity の両方で base_info_id を扱っている。 |
| M03-28 | 1.50 | 設計は本機能で扱う dtb_product_tag の ec-cube-enterprise 列から base_info_id を除外しているが、実装は ProductRepository.php:1813 と 1835 で base_info_id を明示的に INSERT している。反証検索とし |
| M10-01 | 1.50 | 設計は lltext_len=99999 を指定しているのに、実装は ltext_len=3000 を使っている。FormType、設定、Entity を反証確認しても当該2項目で lltext_len を使う実装はなかった。 |
| A07-05 | 1.00 | API入力仕様は最大65535を許容するが、個別入力商品として永続化する実装カラムは255文字上限のため、256〜65535文字の name を設計どおり保存できない。 |
| M14-09 | 0.50 | 設計が要求する dtb_card_format の事前削除処理が実装にない。FormatBoards には cascade remove があるが、CardFormats には cascade remove がないため、設計どおりの関連カードフォーマット行削除を確認できない。 |
| … | | 他 5 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### S3・ファイル出力・支店連携（16件・16.2人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M12-01 | 4.00 | その他 / store_name / base_info_id IS NULL / root_base_info / short_name_jp / shop_name で再検索したが、M12-01集計に通販・店舗外売上を「その他」として集計・表示する処理が見つからない。 |
| B02-09 | 2.00 | 設計はSCPでTSVファイルとdoneファイルを送信する外部契約だが、実装はSFTPライブラリで .tsv.gz とdoneファイルを送信している。反証検索として SCP/scp/feed_upload/SFTP/sftp/ssh_key/tsv.gz/gzipPath/upload を src/E |
| B16-09 | 2.00 | 確認できたサイトマップ実装は `SitemapController` のGETルートとXML Twigのみで、前回ファイルの取得・比較・条件付きアップロードの状態管理がない。S3の `putObject` は汎用アップロードサービスとデモコマンドに限られ、サイトマップ差分判定から呼ばれていない。 |
| A06-01 | 1.50 | 設計は既存管理ログインAPIへの中継とCookieファイル管理を必須フローにしているが、実装はEC-CUBE内部のビュー/パスワードハッシュ検証による直接認証に置き換わっている。 |
| M09-04 | 1.50 | 設計は日本語も .ja.twig を外部契約として示すが、実装コメントと分岐が「日本語は.jaなし」を明示しており、表示と保存ファイル名も不整合になっている。 |
| M13-15 | 1.50 | 設計は banner/ または banner/{html_class}/ を外部的な画像ストレージパスとして定義しているが、実装は banner/event/ を固定プレフィックスとして追加している。反証検索で S3_BANNER_PREFIX、banner/event、banner/{html_c |
| M09-07 | 1.00 | BlockController.php を精読。新規時のみ他ロケールファイルを生成する分岐(197-204)が previousFileName===null に限定され、更新時の filename 変更処理(207-218)は選択ロケールの旧ファイル削除・新ファイル作成しか行わない。設計は「ファイ |
| M14-07 | 1.00 | 設計はセット別ルート完了後の finish イベント掃除を要求しているが、実装は Symfony レスポンスの ZIP削除と次回開始時掃除に置き換わっている。反証検索として eccube.event.controller.admin_cardset_download.finish、admin_car |
| … | | 他 8 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 削除方式（論理／物理）が違う（2件・4.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| F06-21 | 3.00 | 退会確定の副作用として要求される dtb_player 該当行の削除／論理削除が実装のどこにも存在しない（Controller の complete 分岐・イベントリスナ・スマレジサービス・Entity cascade のいずれも該当なし）。よって選手情報の削除は未実装。 |
| M15-09 | 1.00 | 設計は deleted_at 更新による論理削除を要求しているが、実装証跡は remove による物理削除経路を示している。反証検索: DtbArchetype, SoftDeleteable, SoftDeleteableEntity, deletedAt を src/Eccube/Entity/ |

### 監査ログ（9件・3.9人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M10-01 | 2.00 | 設計は明示的に単一選択(ラジオボタン)/展開ラジオ、無効0/有効1を要求しているが、実装はチェックボックス系トグルに置換されている。別キーワード（radio、ChoiceType、expanded、ToggleSwitchType、option_remember_me）で反証検索しても、M10-01 |
| B02-02 | 0.25 | 設計は開始と完了の両方を日時付きでコンソール出力する要求。実装の execute() は try 直後に action を実行し、開始ログなし。成功メッセージにも日時が含まれない。反証検索で `開始`、`完了`、`DateTime`、`SymfonyStyle`、`cancel-product-re |
| M03-45 | 0.25 | 設計は保存開始および完了の両方でカテゴリ id を配列入り記録する要求だが、開始ログだけ id が欠落している。反証検索範囲: CategoryController.php の completeCategorySave/log_info、関連する保存処理。 |
| M04-21 | 0.25 | 開始ログ以外の監査ログ要求が実装されていない。 |
| M13-13 | 0.25 | EventEntryBulkCsvController と関連 importer で「イベント一括登録 異常終了」および結果件数を含む完了ログが見つからない。 |
| M13-13 | 0.25 | catch時やresult->hasError()時にerrorsへ追加/表示するだけで、設計指定の情報ログを記録していない。 |
| M15-06 | 0.25 | 設計の成功メッセージキーおよびログ短文と実装が一致しない。admin.register.complete/デッキCSV登録開始/デッキCSV登録完了 を DeckCsvController・messages.*.yaml で再検索したが、Deck CSV 経路では確認できなかった。 |
| M15-10 | 0.25 | 設計の監査ログ文言と成功フラッシュキーが実装値と一致しない。 |
| … | | 他 1 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### 要仕様確定（9件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A05-04 | 設計は認証トークン不要／匿名許可／400・401は発生しない。実装は AuthenticationService->verify() 失敗時に HTTP 401(`{status:error,message:Authentication failed}`)を返し、`smaregi-event-id` |
| A05-04 | 設計は自店舗以外の明細を X_contract_id/X_access_token を引き継いで支店システムのスマレジ受信APIへ転送し件数合算/エラーログ記録。実装の取引Webhook処理経路(src/Eccube/Service/Smaregi/Webhook/Transaction 配下)に支 |
| A05-04 | 設計は通常取引で自店舗明細に対し注文サブ(dtb_order_sub)を特定し出荷完了反映。実装に dtb_order_sub 相当エンティティは存在せず(grep一致は 'OrderSubmit' の誤検出のみ)、created処理は PurchasePatternResolver で判定し既存受 |
| B02-01 | 設計の移行先DB関連記述は ec-cube-enterprise を正とし、反映先を dtb_product_class の order_quantity_01〜08 としているが、実装は別補助表 dtb_sales_quantity を更新している。反証検索で ProductClassReposi |
| B02-03 | 「集計できなかった旨をメールで送信する」実装が当該コマンド・サービス・リポジトリ・MailService に存在しない。別キーワード（集計できなかった、期間別入庫、stock up、AggregateStockUp、MailService、send）でも反証できなかった。 |
| B02-07 | 設計のCSV外部契約に対して、実装はDB洗い替え方式になっている。反証検索（weekly_stock_history.csv, csv_path, HareruyaEc.const.weekly_stock_history, fopen, fputcsv, SplFileObject）でも B02- |
| B02-07 | 設計はCSV生成・上書きかつDB非更新を要求するが、実装はDBテーブル更新方式でCSVを生成しない。weekly_stock_history.csv / HareruyaEc.const.weekly_stock_history / fputcsv / SplFileObject / dtb_wee |
| M14-07 | 設計の副作用である dead_link_flg 更新がダウンロード系実装に存在しない。 |
| M14-07 | 設計要求は取得成否に応じた dead_link_flg 更新を明示しているが、実装のダウンロード処理は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Cardset/CardsetDownloadActi |

---

# 第7波: 未実装機能の新規実装

**22件 / 78人日**（うち要仕様確定 2件は工数未算入）

画面種別: batch 8 / admin 7 / front 5 / api 2

主なドメイン: b05 3件 / b16 3件 / f06 3件 / a14 2件 / b02 1件 / b08 1件

## 含まれる不具合の型

| 型 | 件数 | 工数(人日) |
|---|---:|---:|
| 画面・ルートが無い | 12 | 33.5 |
| バッチが丸ごと無い | 7 | 33.0 |
| 画面内の機能が空（器だけある） | 3 | 12.0 |

### 画面・ルートが無い（12件・33.5人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B16-09 | 7.00 | `SitemapController` は `#[Route(path: '/sitemap.xml')]` でXMLをHTTP出力し、`pageRepository`/`productRepository`/`categoryRepository`等からデータ取得して `sitemap_index |
| M04-39 | 6.00 | 設計は在庫移動指示リスト詳細画面を入口にするが、実装の stock_move_instruction_detail.twig:82-89 には登録・削除ボタンのみで「ピッキングリスト作成」相当のボタンがない。StockMoveInstructionController:161-222 の詳細アクショ |
| M03-30 | 3.00 | ProductStandardPriceCsvController は基準価格CSV用の form_action_route/template_download_route/history_page_route だけを渡しており、csv_product_standard_price.twig は b |
| M06-01 | 3.00 | 実装済みの店頭買取API入口は OtcBuyOrderController.php:129,156,190,231,273 に限定され、店頭買取情報一部キャンセル情報連携に相当する route/action/service が見つからない。既存の UpdateOtcBuyOrderAction は明 |
| M08-09 | 3.00 | 設計が外部契約として示すURL・ルート名に対し、実装のRoute属性とTwigリンクは別パス・別ルート名であり、設計上の一覧入口 m08-09_admin_customer_customer_delivery も見つからない。 |
| M13-11 | 2.50 | 設計は Entry/search_event.twig 由来の非同期モーダル検索を正としているが、EntryRegistrationController には /entry/search/event/html 系ルートも isXmlHttpRequest() によるイベント検索分岐もない。反証検索で |
| A14-02 | 2.00 | 設計はクライアント向けJSON API GET /cardDetails/{id} を要求しているが、src/Eccube/Controller配下のルート一覧に /cardDetails/{id} がない。管理画面AJAXは src/Eccube/Controller/Admin/Product/ |
| F06-16 | 2.00 | 設計はページング(最大20件/動的切替)・総数・表示件数の表示を明示。テンプレート/Controller に該当UI・データが無い。フォーマット絞り込み(select_format)のみ実装済み。 |
| … | | 他 4 件（`drift_findings_list_effort.tsv` を`確定改修区分`と`優先度`で絞り込む） |

### バッチが丸ごと無い（7件・33.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| B16-06 | 7.00 | 設計は月次商品情報スナップショット専用の外部契約（Step Functions月次起動、DB抽出、ZIP生成、stock_YYYYMMDD.txt.zip、s3://inventorycheck/アップロード）を要求しているが、実装範囲にはその入口・ファイル名生成・ZIP生成・S3アップロード呼び出 |
| B16-11 | 7.00 | 設計はバッチ外部契約として「スケジュール起動(Step Functions) 15分毎」「入力S3、出力メール」「指定S3パス5種」「種別別しきい値」「指定From/To/CC/BCC/件名/本文」を要求しているが、src/Eccube/Command の AsCommand 一覧に画像サイズチェッ |
| B02-06 | 6.00 | 反証検索として product:batch insertStockHistory, insertStockHistory, 受注日より前, 最新在庫履歴, 受注後在庫, 注文番号と価格, 登録済み, stock_change_reason LIKE, order_date StockHistory  |
| B05-09 | 5.00 | 設計の再連携バッチはWebhook失敗時の救済処理であり、Webhookが届いていない/失敗した取引をAPI一覧から発見して処理する必要がある。実装はWebhookイベントまたは既存メッセージを前提にした処理で、失敗Webhookを発見する入口・条件判定が欠落している。 |
| B05-08 | 3.00 | `src/Eccube/Command/SmaregiUpdatePointCommand.php:26` は `#[AsCommand(name: 'eccube:smaregi:update-point')]` で、`src/Eccube/Command` 配下に `smaregi:batch  |
| B05-09 | 3.00 | 設計は利用者視点の入口として特定コマンド名を外部契約化している。実装側には当該コマンド名・別名・取引再連携を示すCommandクラスがなく、Webhook由来の子ジョブ処理だけではバッチ入口要求を満たさない。 |
| B08-06 | 2.00 | 設計は失敗記録だけでなく後続のスマレジEC受注連携エラー再連携バッチによる再試行可能性まで要求している。実装はエラー受注抽出メソッド止まりで、使用ポイント連携を再試行するバッチ入口・Action・呼び出しが不在。なお `SmaregiStockBackfillCommand` は在庫変動Webhoo |

### 画面内の機能が空（器だけある）（3件・12.0人日）

| 機能No | 工数 | 内容 |
|---|---:|---|
| M05-11 | 8.00 | 履歴表示用に同テンプレートを読み取り専用化する分岐や disabled 制御がない。OrderType でも全体 disabled は設定されず、確認できた disabled は pointErrorMessage など一部に限られるため、設計の編集不可/非活性条件と異なる。 |
| F06-16 | 4.00 | 部分一致サジェストの中核要求に対し候補データ供給源が実装に存在しない。UIの器だけあり機能が空。hareruya-event.js の grep でも deckentry-card-suggest セレクタのみで fetch/api 呼び出しなし。 |
| A14-02 | 要仕様確定 | src/Eccube/Entity/Master/MtbCardDetail.php:278-319 でDB項目は保持しているが、設計はAPIレスポンス変換を要求している。src/Eccube/Service/App/Article/ArticleResponseBuilder.php:270-28 |

### 要仕様確定（2件・工数未算入）

設計と実装のどちらが正かを決めないと着手できない。

| 機能No | 内容 |
|---|---|
| A14-02 | src/Eccube/Entity/Master/MtbCardDetail.php:278-319 でDB項目は保持しているが、設計はAPIレスポンス変換を要求している。src/Eccube/Service/App/Article/ArticleResponseBuilder.php:270-28 |
| F02-02 | footer_sitemap.twig の他の全リンクは url() で遷移先実装済みだが、FAQ だけがプレースホルダ("#")。FAQ画面ルート(user_data/hareruya_faq 想定)も未実装のためTODOコメントが残り、設計が求める FAQ画面への遷移が未実装。 |

---

## この整理の前提

- 波の割り当ては上から順に排他。第1波(P1)に入った行は以降の波に重複して出てこない。
- 「不具合の型」は差分内容の語による機械分類で、境界の行は複数の型に当てはまり得る（先に一致した型に入る）。件数の目安として読むこと。
- 改修区分そのものは codex のレビュー済み（965件中353件を訂正）。工数も codex が1件ずつ見積もった値。
- 同一機能の複数指摘をまとめて直す効果は織り込んでいないため、実際は下振れの余地がある。
