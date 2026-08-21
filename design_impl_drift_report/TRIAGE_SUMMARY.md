# 乖離指摘 再事実確認・トリアージ結果

対象: `drift_findings_list_final.tsv` 1034件

出力: `drift_findings_list_triaged.tsv`


## トリアージ区分

| 区分 | 件数 | 意味 |
|---|---:|---|
| 要修正-移植漏れ(設計書追記も要) | 473 | 正本に記述は無いが旧実装に根拠。移植漏れ＋設計書の記述漏れ |
| 要修正-設計準拠 | 432 | Excel正本に裏付けがあり、実装が満たしていない。設計どおりに直す |
| 一部解消-残差あり | 35 | 一部は実装済み。残差だけを起票し直す |
| 要再起票(記述が事実と相違) | 25 | 乖離は残るが、指摘の実装実態の記述が現物と食い違う。書き直しが要る |
| 要設計判断(正本内で記述が矛盾) | 23 | Excel正本の項目表とレイアウト画像などが食い違い、どちらが仕様か決まらない。設計側の裁定が要る |
| 要再調査 | 19 | 判断材料不足・確信度低。追加調査が要る |
| 解消済-クローズ | 14 | 再検証時点で実装が設計を満たしている |
| 誤検出-クローズ | 13 | 設計にも旧実装にも根拠が無い／既に充足。指摘自体が誤り |

## 優先度

| 優先度 | 件数 | 基準 |
|---|---:|---|
| P1 | 64 | 実害 high（業務停止・データ不整合・外部連携断） |
| P2 | 314 | 実害 med かつ設計書に裏付けあり |
| P3 | 318 | 実害 med かつ旧実装由来（移植漏れ） |
| P4 | 269 | 実害 low（文言・軽微） |
| D | 23 | 設計側の裁定が要る（正本内で記述が矛盾） |
| R | 19 | 要再調査 |
| - | 27 | クローズ（対応不要） |

## 再検証の判定内訳

### 分類(根拠区分)の妥当性
| 判定 | 件数 |
|---|---:|
| UPHELD | 720 |
| (第1次:UPHELD) | 237 |
| REFUTED | 70 |
| (第1次:REFUTED) | 5 |
| UNSURE | 2 |

### 現HEADでの再現性
| 判定 | 件数 |
|---|---:|
| REPRODUCED | 671 |
| 未測定(参照ファイル無変更) | 242 |
| UNSURE | 35 |
| PARTIAL | 35 |
| MISDESCRIBED | 29 |
| RESOLVED | 22 |

### 分類の訂正
| 訂正前 | 訂正後 | 件数 |
|---|---|---:|
| LEGACY_BACKED | SPEC_BACKED | 34 |
| UNCERTAIN | SPEC_BACKED | 18 |
| SPEC_BACKED | ALREADY_MET | 5 |
| LEGACY_BACKED | UNSUPPORTED | 5 |
| UNCERTAIN | LEGACY_BACKED | 3 |
| SPEC_BACKED | LEGACY_BACKED | 2 |
| LEGACY_BACKED | ALREADY_MET | 2 |
| UNCERTAIN | ALREADY_MET | 1 |

## 機械検証

| 検査 | 結果 |
|---|---|
| 正本根拠の引用の所在 | EXCEL=640 / NO_QUOTE=135 / EMBED_ONLY=122 / NOT_FOUND=99 / TOO_SHORT=38 |
| 実装参照ファイル/行の実在 | OK=1018 / LINE_OUT=9 / FILE_MISSING=6 / NO_REF=1 |
| 検証時HEAD以降の実装変更 | UNCHANGED=700 / CHANGED=334 |

## ドメイン別 要修正件数（P1-P3）

| ドメイン | P1 | P2 | P3 | P4 | 設計判断 | 要再調査 | クローズ |
|---|---:|---:|---:|---:|---:|---:|---:|
| m04 | 9 | 75 | 10 | 19 | 6 | 1 | 9 |
| a05 | 12 | 8 | 7 | 6 | 0 | 1 | 0 |
| m03 | 8 | 24 | 15 | 23 | 7 | 2 | 1 |
| a06 | 8 | 13 | 14 | 4 | 0 | 2 | 1 |
| f06 | 3 | 26 | 10 | 20 | 2 | 0 | 0 |
| m13 | 4 | 10 | 38 | 27 | 0 | 2 | 0 |
| b02 | 3 | 12 | 20 | 7 | 1 | 4 | 2 |
| m12 | 3 | 10 | 18 | 19 | 0 | 0 | 0 |
| b06 | 3 | 0 | 2 | 1 | 0 | 0 | 1 |
| a01 | 2 | 3 | 0 | 0 | 0 | 0 | 0 |
| m06 | 1 | 11 | 1 | 1 | 1 | 2 | 0 |
| b05 | 1 | 10 | 10 | 2 | 0 | 0 | 1 |
| m05 | 1 | 10 | 4 | 13 | 0 | 0 | 2 |
| m10 | 0 | 17 | 12 | 18 | 1 | 0 | 1 |
| m14 | 1 | 4 | 29 | 24 | 0 | 0 | 0 |
| m09 | 1 | 4 | 9 | 7 | 0 | 0 | 0 |
| a07 | 1 | 3 | 9 | 1 | 1 | 1 | 0 |
| m07 | 0 | 13 | 2 | 5 | 0 | 0 | 0 |
| a17 | 1 | 2 | 4 | 0 | 0 | 0 | 0 |
| b08 | 1 | 1 | 8 | 3 | 0 | 0 | 0 |
| m08 | 0 | 9 | 28 | 17 | 1 | 3 | 2 |
| b13 | 1 | 0 | 4 | 0 | 0 | 0 | 0 |
| a02 | 0 | 7 | 7 | 0 | 1 | 0 | 0 |
| m15 | 0 | 4 | 27 | 18 | 0 | 1 | 4 |
| f07 | 0 | 6 | 1 | 2 | 0 | 0 | 1 |
| b16 | 0 | 6 | 0 | 1 | 0 | 0 | 0 |
| f01 | 0 | 6 | 0 | 0 | 1 | 0 | 0 |
| f03 | 0 | 4 | 4 | 7 | 0 | 0 | 0 |
| f02 | 0 | 4 | 3 | 1 | 1 | 0 | 0 |
| a14 | 0 | 4 | 1 | 0 | 0 | 0 | 0 |
| f05 | 0 | 3 | 2 | 1 | 0 | 0 | 1 |
| f08 | 0 | 3 | 0 | 0 | 0 | 0 | 0 |
| m16 | 0 | 1 | 12 | 16 | 0 | 0 | 1 |
| f04 | 0 | 1 | 2 | 4 | 0 | 0 | 0 |
| a16 | 0 | 0 | 3 | 0 | 0 | 0 | 0 |
| m11 | 0 | 0 | 2 | 2 | 0 | 0 | 0 |

## P1（実害 high）一覧

| 機能No | 指摘区分 | 確定根拠 | 再現 | 差分の要旨 |
|---|---|---|---|---|
| A01-01 | 実装違い | SPEC_BACKED | MISDESCRIBED | 設計はスマレジ→ECCUBEのWebhookだけでなく、管理画面操作によるECCUBE→スマレジ在庫反映（API個別/Patch一括）も連携方式として定義する。実装の Smareg |
| A01-02 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は時間幅（X-Y hours、初期値相当として5時間前）を要求しているが、実装は SmaregiStockBackfillCommand の引数が target-date のみ |
| A05-01 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計はパス /order/print/direct をGET・POST両方に割り当て、GET=GetRequest・POST=SetResponse とする。実装ルートは #[Ro |
| A05-01 | 未実装 | SPEC_BACKED | 未測定(参照ファイル無変更) | 設計は GetRequest 成功時の副作用として印刷情報XMLの print_logs へのファイル書き出しを必須挙動と規定（本書で扱うこと:223・副作用:298・ログ監査:3 |
| A05-01 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は抽出条件を単一系統（店頭受取NEW＋スムーズ店頭受取条件群＋browser_print_flg、最大10件）として記述。実装(行44-48)は BaseInfo->isMai |
| A05-01 | 実装違い | SPEC_BACKED | REPRODUCED | 実装は一部の分岐では o.smaregi_code IS NOT NULL を条件にしているが、全印刷対象に対してXML生成前のスマレジコード存在確認を保証していない。OrderD |
| A05-02 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計はパス `/order/print/direct` を GET と POST の両方で受け付け、GetRequest は GET・SetResponse は POST とする。 |
| A05-02 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は単一の抽出条件(店頭受取+スムーズ店頭受取+ブラウザ印刷フラグ)を記述するが、実装は BaseInfo->isMainShop() で分岐し、本店は getPrintOrde |
| A05-02 | 実装違い | SPEC_BACKED | REPRODUCED | 設計はプリンタ応答内の失敗理由 code をログに追記すること、既存では印刷結果詳細を参照していない点の改善を要求している。実装コードには `PrintResponse`、`res |
| A05-04 | 未実装 | SPEC_BACKED | REPRODUCED | 設計は言語識別子配下の固定パス `POST /{_locale}/smaregi/transaction`。実装は `#[Route('', name: 'smaregi_webh |
| A05-04 | 未実装 | LEGACY_BACKED | 未測定(参照ファイル無変更) | 設計の成功レスポンスは `{result:[{TransactionHead: 更新件数}]}`。実装は `{status:'ok'}`(107-109行)または重複時 `{sta |
| A05-04 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は取消・打消で取引IDに一致するポイント履歴を取得して削除。実装の SmaregiPointAdjustmentReverter は元履歴を削除せず監査用に残し、符号反転した逆 |
| A05-04 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は連携ヘッダとCookieの完全値をログに出さないことを要求するが、実装は受信時・認証失敗時にheadersとcontentをログ出力する。X_access_token、Coo |
| A05-04 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は認証方式をIP制限としているが、実装は secretHeader/secret のヘッダ認証であり、探索範囲（Controller/Smaregi、Service/Smare |
| A06-01 | 実装違い | SPEC_BACKED | REPRODUCED | 設計にある /api/admin/login.json、/admin/login.json、/admin/login のいずれも実装ルートとして確認できず、実装はバージョン付き / |
| A06-02 | 実装違い | SPEC_BACKED | REPRODUCED | 設計の利用者向け契約にある URL と別名が実装されていない。反証として otcBuyOrders、api_admin_otc_buy_orders、Route 定義、設定 ecc |
| A06-04 | 実装違い | SPEC_BACKED | REPRODUCED | 設計HTMLのシート本文は /api/admin/otcBuyOrder/{id}/freeComment.json を外部契約として示しているが、実装は /api/v1/admi |
| A06-06 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は /api/buying/{detailId}.json を外部契約として定義しているが、実装は API 版数プレフィックス /api/v1 を付けた別URLで公開している。 |
| A06-08 | 実装違い | SPEC_BACKED | REPRODUCED | 設計のレスポンスフィールド名・型と実装のJSONキー/値型が一致しない。反証として BuyingCardsFormatter、GetBuyingCardsQueryResponse |
| A06-11 | 実装違い | SPEC_BACKED | REPRODUCED | 設計HTMLはレスポンスデータとして code、message、sections を定義し、処理フローでもコード・メッセージ・部門一覧をJSONで返すとしている。一方、実装の Se |
| A06-12 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は {"code":200,"section_id":"1"} 形式の外部契約を要求している。一方、実装は code フィールドも section_id フィールドも作らず、固 |
| A06-16 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は /api/otcBuyOrder/{id}/doublecheck.json と member_id を要求する。実装ルートは /{api_v1_route}/admin/ |
| A07-06 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は /api/admin/... を指定しているが、実装は api/v1 プレフィックス付きの /api/v1/admin/... で公開している。app/config/ecc |
| A17-03 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は受信した処理名・パラメータをスマレジ取引APIへ中継する外部契約を要求しているが、実装は固定成功レスポンスで中継していない。探索範囲: src/Eccube, html。検索 |
| B02-01 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は対象なしなら更新しないことを要求するが、実装は対象有無を確認する前に既存集計行を削除する。getSalesForAggregate() が空でも foreach が回らないだ |
| B02-03 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は店舗に加えて在庫区分/在庫場所単位の集計・更新を要求するが、実装は商品規格ID・店舗ID単位に集約している。ProductStock には stock_location_id |
| B02-03 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は対象なし時に更新しないことを要求するが、実装は対象有無判定の前に集計テーブルを全削除する。 |
| B05-08 | 実装違い | SPEC_BACKED | REPRODUCED | 設計はユーザーのポイント残高を取得し絶対値で更新する要求。実装は `src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php: |
| B06-01 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は店頭買取の入庫待ちをステータス12と明記しているが、実装ではステータス12は未登録在庫あり、入庫待ちは13として扱われる。反証として BatchAutoStockAction |
| B06-01 | 実装違い | SPEC_BACKED | REPRODUCED | 設計はECCUBE在庫への登録を要求しているが、実装は stock_location_id = STOCK_LOCATION_ECCUBE で既存在庫を絞り込まず、同一店舗のスマレ |
| B06-02 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は部門未設定商品一覧を取得して通知することを要求しているが、実装の一覧取得 SQL が構文不正のため、通知判定・商品名/商品コード本文生成まで到達できない。加えて同メソッドには |
| B08-02 | 実装違い | SPEC_BACKED | PARTIAL | 設計は会員のスマレジIDと失効ポイントをポイント増減APIへ送信することを要求しているが、実装は送信先・送信ポイントを渡しておらず、サービス本体も固定成功レスポンスであるため、失効 |
| B13-01 | 未実装 | SPEC_BACKED | REPRODUCED | PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LIN |
| F06-02 | 実装違い | SPEC_BACKED | REPRODUCED | 設計の判定順序表・副作用順序・エラーケースを正として実装を精査。会員ステータス更新(283-289)がスマレジ連携(302)より前に自動コミットされ連携失敗時にロールバックが無いた |
| F06-16 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は『提出時に書式エラー→編集画面へ戻し登録しない』だが、実装は書式検証なしで常に登録し確認画面へ遷移。設計文言そのままのエラー span が未使用である点も裏付け。 |
| F06-18 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計の住所系変更トリガーの『住所』には addr03(dtb_customer.addr03、既定配送先へ 164 行で反映される正規の住所項目)が含まれるが、$isAddress |
| M03-02 | 未実装 | SPEC_BACKED | REPRODUCED | 設計の『商品編集で廃止になった場合のスマレジ削除』が、商品編集Controllerの更新確定経路に存在しない。スマレジ削除機構は別経路に存在するが、本機能から呼ばれていない。 |
| M03-09 | 実装違い | LEGACY_BACKED | REPRODUCED | 設計は削除可能性に応じたボタン表示、最後の1件の HTTP400、論理削除を要求している。実装は削除可能性の判定がなく、最後の1件ガードもなく、論理削除ではなく物理削除している。探 |
| M03-26 | 実装違い | SPEC_BACKED | REPRODUCED | 新規登録は insert 分岐に入るが、insert 分岐には新規=セールフラグ無効扱いの price02←基準価格 反映処理が無く、販売価格を『販売価格』列(割引後)から取る。基 |
| M03-27 | 実装違い | SPEC_BACKED | REPRODUCED | 設計の値1/2の意味が実装では逆。反証検索として「1: 非公開」「2:公開」「商品公開ステータス」「ProductStatus」「mtb_product_status」を確認したが |
| M03-37 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は商品IDをキーに商品情報側の略称タグIDを更新する要求だが、実装は略称タグマスタ mtb_storage_code の名称・並び順を登録/更新している。反証検索でも admi |
| M03-37 | 実装違い | SPEC_BACKED | REPRODUCED | 設計フォーマットは商品IDと略称タグの2列必須だが、実装は略称タグマスタ登録用のID・名称・並び順フォーマットを受け付ける。商品ID/略称タグのCSVはヘッダ検証で期待ヘッダと一致 |
| M03-37 | 実装違い | SPEC_BACKED | REPRODUCED | 設計HTMLのsheet-55先頭フォーマット表は「商品ID」「略称タグ」の2列をmaterialなCSV外部契約として示すが、実装のgetCsvHeader()/StorageC |
| M03-38 | 実装違い | SPEC_BACKED | REPRODUCED | 設計HTMLの sheet-20 本文では識別ID 2 の商品公開ステータスを「0: 非公開 1:公開」と定義しているが、実装は非公開を 2 として出力・受理する。反証として Pr |
| M04-01 | 実装違い | SPEC_BACKED | REPRODUCED | 反証検索で stock_list_index.twig、StockListController、StockMoveController、StockTransferControlle |
| M04-21 | 実装違い | LEGACY_BACKED | REPRODUCED | 重複商品コードとロック取得失敗の設計エラー経路が実装されていない。 |
| M04-21 | 実装違い | SPEC_BACKED | REPRODUCED | 廃棄系では設計上も後続承認処理上も申請時反映が前提だが、CSVアップロード経路では申請時の在庫減算・履歴作成が行われない。 |
| M04-21 | 実装違い | SPEC_BACKED | REPRODUCED | 複数選択の承認通知先配列を登録者IDとして保存するため、在庫編集承認ID配下の登録者が操作者と一致しない。 |
| M04-23 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は店舗必須かつM11-03の編集可能店舗制御を要求するが、取込ルートはPOST値のstoreをサーバー側で必須検証せず、編集不可店舗IDも排除しない。反証検索範囲: Stock |
| M04-23 | 実装違い | SPEC_BACKED | REPRODUCED | 在庫不足時にエラーにせず、要求数量を現在庫へ丸めて登録が進むため、設計の在庫数チェックと異なる。source_register_quantity_over_stock/source |
| M04-23 | 実装違い | SPEC_BACKED | REPRODUCED | POST改ざんで編集不可店舗IDを送れる外部契約に対し、listJoinCsvImport のサーバ側で編集可能店舗処理が実行されない。 |
| M04-24 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は『エラーがあれば登録処理を終了（全体未登録）』だが、実装は行単位スキップで成功行を確定コミットする。 |
| M04-25 | 未実装 | SPEC_BACKED | REPRODUCED | Controller のコンストラクタには MemberRepository 等の権限判定依存がなく、index/detail/delete/registerTracking は対 |
| M05-26 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は親注文の状態差し替えを「サブ側出荷実施日時の既存有無のみ」でゲートし、受注ステータス条件は課さない（設計step15も同旨）。実装はOrderCsv.php:132で `$i |
| M06-01 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は買取成立時に端末取引ID/出金コード未入力をエラーにする要求だが、実装は値がある場合の型・数値検証だけで、買取成立ステータス時の未入力を拒否しない。 |
| M09-04 | 実装違い | SPEC_BACKED | REPRODUCED | 画面上の削除ボタンは利用者作成ページに限定されるが、DELETEルート自体は初期投入ページのファイル削除を拒否せず、設計のサーバ側初期ページ制限に反する。 |
| M12-01 | 実装違い | SPEC_BACKED | REPRODUCED | DtbDailySummaryRepository::aggregateOrderSummaryByBaseInfo は dtb_order の全ステータスを対象に subtota |
| M12-01 | 実装違い | SPEC_BACKED | REPRODUCED | MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE と MtbOtcBuyOrderStatus::STATUS_COMPLETE、DtbOtcBuyO |
| M12-01 | 実装違い | SPEC_BACKED | REPRODUCED | OrderStatus::DELIVERED / order_status_id / 出荷完了 へ翻案して再検索したが、M12-01の日次・月次集計元SQLでは出荷完了ステータスに |
| M13-03 | 実装違い | SPEC_BACKED | REPRODUCED | 設計は「日程追加が可能」かどうかの権限制御を要求している。実装はイベント編集画面のリンク表示やボタン disabled では制御しているが、ScheduleController:: |
| M13-08 | 実装違い | SPEC_BACKED | REPRODUCED | 検索モーダル等では isEditableShop / getMemberBaseInfos による権限制御があるが、デッキ表示本体では同等の照合がない。セッションに権限外店舗が入っ |
| M13-12 | 実装違い | LEGACY_BACKED | REPRODUCED | 重複検証が登録処理のサーバー側オラクルになっておらず、直接POST等では重複申込を弾けない。申込重複メッセージと新規画面リダイレクトも登録処理側にない。 |
| M13-13 | 未実装 | SPEC_BACKED | REPRODUCED | EventBulkCsvImportHandler.php:289 付近はクレジット列の値検証のみ、同:364 付近はオンライン受付日時検証のみ、同:453 付近は Payment |
| M14-08 | 未実装 | SPEC_BACKED | REPRODUCED | 設計の削除可否判定、失敗キー、Referer 復帰、成功時のページ番号復帰が実装にない。さらに実装は削除不可でも試行前に画像削除を行う可能性がある。 |

## 手法と限界

### やったこと
1. **機械検証**（`citation_audit/mech_check.py`）: 全1034件について、正本根拠の引用文字列が参照先HTMLの **Excel正本領域**（`function-design-embed` の外側）に実在するか、設計書参照のシート行範囲が整合するか、実装参照の `path:line` が現HEADに実在するか、検証時HEAD以降にその実装ファイルが変更されたかを判定した。
2. **codexによる批判的レビュー**（`citation_audit/RECHECK_TASK.md`）: 前回のレビュー対象外だった695件（実装違い676＋根拠区分UNCERTAIN 19）を58パケットに分割し、「分類は正しいか」と「現HEADでも再現するか」の2軸で反証を試みさせた。さらに、レビュー済みだが検証後に実装ファイルが変更された97件を第2ラウンドで再確認した。
3. **トリアージ**（`citation_audit/apply_triage.py`）: 上記2つの結果から区分と優先度を決定的な規則で導いた。人手の裁量は入れていない。

### 限界（結果を読むときの注意）
- 機械検証の引用照合は**テキストのみ**を見る。Excel正本の文言は base64 埋め込み画像に入っていることが多く、`NOT_FOUND` / `EMBED_ONLY` は「不在」を意味しない。実際、機械フラグと codex の判定は相関が弱かった（`EXCEL` でも 43件が REFUTED）。
- `設計書参照` 列の行番号は、監査後にHTMLを再生成したため **723/1034 がシート範囲外**で、そのままでは追跡できない。追跡には `正本根拠` 列の引用文字列を使うこと。
- `実装参照` 列（旧監査由来）には行番号のずれが9件ある（例: `OrderController.php:91` だがファイルは86行）。一方 `対応の根拠(現develop)` 列の精度は高い（2100参照中 不良1件）。実装位置を追うときは後者を使うこと。
- 「未測定(参照ファイル無変更)」339件は、分類のレビューは済んでいるが再現性は**検証時HEADの記録に依拠**している。参照先ファイルが変わっていないことは機械確認済み。
- 「要設計判断」の切り出しは、レビュー記述に矛盾を示す語が含まれるかで機械判定している。境界例は「要再調査」に混ざり得る。
- 実害（severityOpinion）はレビュアーの見立てであり、業務側の合意ではない。

## 誤検出としてクローズ（13件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| A06-16 | 実装違い | ALREADY_MET | 正本の実在引用は「新規のカラム」までで、dtb_otc_buy_order直下の専用列を要求していない。現実装は src/Eccube/Entity/DtbOtcBuyOrderApprover.php のテーブル dtb_otc_buy_order_approver に、新設された approver_id 列でダブル |
| B02-05 | 実装違い | ALREADY_MET | 先行判定は `log_error` をファイル等へのログだけとみなし「コンソールには出ない」としたが誤り。log_error() はLoggerへERRORを送信し、prod/dev双方のMonolog設定にConsoleHandlerがある。Symfony ConsoleHandlerは通常verbosityでWAR |
| B05-03 | 実装違い | UNSUPPORTED | 「完了ログを出さない」は旧実装と一致する一方、「正常起動時に日時付き出力を行う」は正本にも旧実装にも根拠がない。複合期待値全体を LEGACY_BACKED とする分類は誤りで、主張どおりの要求としては UNSUPPORTED。現行実装が日時なし開始ログと完了ログを出す事実自体は変わらず、記載された差は再現するが、根拠 |
| B06-01 | 未実装 | ALREADY_MET | 正本が要求するのは総在庫・総原価・原価単価と在庫履歴の更新であり、現行モデルに存在しない `dtb_product_class.stock` の二重更新ではない。物理カラム指定はリバース詳細設計だけにあり、しかも対象B06-01は新規機能で対応旧バッチがないため、当該物理要件を旧実装でも裏付けられない。現行はProdu |
| M03-26 | 実装違い | ALREADY_MET | 元指摘は「CSVの基準価格がSP/MP/HPでも無加工のまま販売価格になる」と解釈しているが、関連するExcel正本はCSV入力相当のNM基準価格を割引率の算定基準とし、SP/MP/HP基準価格を割引率で計算すると明記している。StandardPriceCalculatorによる状態別基準価格をセールOFF時の販売価格 |
| M08-08 | 実装違い | UNSUPPORTED | 先行判定は旧MailServiceの既定nullだけを見ており、flush時の旧SaveEventSubscriberを見落としている。旧実装でも管理者操作ならcreatorが設定されるため、「旧仕様は作成者を持たない」は旧実装にもExcel正本にも根拠がなくUNSUPPORTED。現実装でもcreator設定は再現す |
| M08-17 | 実装違い | ALREADY_MET | 先行指摘は参照先シートの設計メタデータ8列を、そのまま画面に8列表示する要求だと誤読している。正本はCSVの項目を参照先から取り、画面ではテーブル表現する要求であり、レイアウト画像が具体的な2列構成を示す。現実装はこの表示を満たすためALREADY_METへ訂正する。 |
| M10-13 | 未実装 | ALREADY_MET | M10-13正本が要求する3つの設定選択肢は現行 CustomCsvType に存在し、既に満たされている。一方、指摘が欠落とした在庫移動・振替／在庫分割結合のカスタムCSV実出力は、関連する在庫管理正本で2026-01-26に明示的に不要・削除となっている。したがって missing custom export を  |
| M15-01 | 実装違い | ALREADY_MET | 先行判定は古い一覧項目表だけを採用し、より具体的なアップロード正本のカスタマイズ要件を見落としている。正本の最終要求はTSV廃止・CSV限定で、現行実装はその要求を満たすため、CSV/TSV両対応の乖離指摘は誤りで ALREADY_MET。 |
| M15-08 | 実装違い | UNSUPPORTED | findingはM15-08「アーキタイプ管理(検索結果)」を対象にしながら、別機能のデッキ一覧検索フォームを根拠にしている。対象機能のExcel正本にも旧実装にもこの複合選択肢はなく、M15-08の指摘としては UNSUPPORTED。現実装説明も別画面を指すため MISDESCRIBED。 |
| M15-08 | 実装違い | UNSUPPORTED | M15-08の正本画像・旧Archetype検索経路のいずれにも対象のアーキタイプ選択肢がない。別画面のDeck検索JSを誤ってM15-08へ割り当てた指摘なので UNSUPPORTED。現実装のDeck側に移植差があることは、M15-08のdriftを証明しない。 |
| M15-08 | 実装違い | UNSUPPORTED | M15-08検索入力には選択肢そのものがなく、別のデッキ一覧フォームのラベル規則を誤って移した指摘である。対象機能の正本・旧実装に根拠がないため UNSUPPORTED、現実装参照も別画面なので MISDESCRIBED。 |
| M16-01 | 実装違い | ALREADY_MET | finding は旧実装の `banner/` を設計期待値にしているが、関連するExcel正本M16-02が移行後のトップバナー用フォルダを明示的に `banner/top/{各支店の省略名}` と規定している。現実装の `banner/top` は正本に一致するため、旧挙動との差を乖離として扱うのは誤りである。 |

## 再検証で解消済みと確認（14件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| B02-01 | 未実装 | RESOLVED | ECCUBE販売とスマレジ販売を店舗別・販売元別に集計する期待値はExcel正本にあり、SPEC_BACKEDは妥当。現在の集計SQLはsmaregi_transaction_idを用いて販売元を分離しており、元findingの未実装状態は解消している。 |
| F05-06 | 未実装 | RESOLVED | 画像形式と別ウィンドウ遷移が function-design-embed 外のExcel正本に明記されているため SPEC_BACKED は正しい。現在のPC表示経路にはQR画像と target="_blank" が追加され、元の「テキストリンクのみ・同一ウィンドウ」という乖離は解消している。 |
| F07-03 | 実装違い | RESOLVED | 旧実装は DtbEventDetail::getCapacity()/getEntryFee() と申込可否では詳細優先を実装する一方、主表示 show.twig は event.getCapacity()/getEntryFee() を直接参照しており、複合期待値を一つの区分に確定できないという先行 UNCERTAI |
| M04-01 | 実装違い | RESOLVED | 店舗を保存対象外とする要求は Excel 正本に明記され、SPEC_BACKED は妥当。先行メモ以降に現実装が修正され、現在は base_info を明示的に除外しているため乖離は解消した。 |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しい。一方、現実装では先行記載の「query_builder が無い」は解消済み。/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php の buildForm() は  |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しいが、現在は初期 disabled と入力連動JSの両方が追加されているため乖離は解消している。 |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しいが、savePattern() は現在 base_info を明示的に保存対象から外している。 |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しい。現在の主ソートは先行記載の pc.id から p.id に変更され、表示値と同じ商品IDになっている。 |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しい。重複finding 435と同様、現在はサーバ拒否だけでなく画面側の活性制御が実装済み。 |
| M04-01 | 実装違い | RESOLVED | 根拠区分は正しい。重複finding 436と同様、現在は base_info が保存対象から除外されている。 |
| M04-17 | 実装違い | RESOLVED | SPEC_BACKED は妥当。ただし先行確認後に実装が変更され、一覧クエリの第三ソートは createDate 直接指定から COALESCE による基準日時へ修正済み。設計が要求する承認日時優先・未設定時登録日時の降順を現在は満たすため RESOLVED。 |
| M04-38 | 実装違い | RESOLVED | 引用された100件はExcel正本の項目表に実在するためSPEC_BACKED分類は妥当。現行コードは監査時点の共通既定値10参照から、承認一覧専用の既定値100参照へ変更されており、指摘が対象とした「初期値100件」に関する乖離は解消している。正本レイアウト画像の10件との矛盾は別途残る。 |
| M05-06 | 未実装 | RESOLVED | Excel正本に送信成否メッセージが明記されているため SPEC_BACKED は妥当。現行実装は一括送信の成功・失敗を判定して対応するメッセージを表示し、TransportExceptionもfalseとして呼出元へ返すため、この乖離は解消済み。 |
| M05-26 | 未実装 | RESOLVED | Excel正本に出荷完了メール送信が明記されているため SPEC_BACKED は妥当。現行の出荷実績取込はコミット後に更新対象受注へ出荷完了メールを送信し、送信日時も保存するため、この乖離は解消済み。 |

## 記述が事実と相違（要再起票）（25件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| A01-01 | 実装違い | MISDESCRIBED | 根拠区分は正しい。ただし先行の実装実態「SmaregiStockApiClient は参照系のみ」は現状と一致しない。同クライアントには add() がある。一方、add() は正数加算専用で、管理在庫操作への接続、減算、相対値更新、Patch一括は確認できず、設計との実質的な乖離は残るため MISDESCRIBED  |
| A02-01 | 実装違い | MISDESCRIBED | 外部EC-CUBE URLで jp を使う期待自体はExcel正本にあるので SPEC_BACKED は正しい。しかし先行指摘は外部URLと内部APIを混同し、内部 `/api/popup/product/jp/...` まで有効とした点が誤り。正本は内部APIを ja/en と明記する。現行では外部 `goods_a |
| B02-07 | 実装違い | MISDESCRIBED | 列名差は正本項目表に直接裏付けられるため SPEC_BACKED は正しい。ただし先行の実装実態「39項目」は現在の getHeader() と一致しない。現状は正本38行に対して category_name_en と search_word を加えた40列で、branch_status は is_branch_pub |
| F05-06 | 実装違い | MISDESCRIBED | カスタマイズ要件は明確なsrc-cell/data-excel-refを持ち、SPEC_BACKEDは正しい。画像は旧画面を示すが、正本文の「リニューアル後」要件が更新後の期待値を明示している。 |
| F06-04 | 実装違い | MISDESCRIBED | E-1/E-2を判定別に表示する正本根拠は明確で、分類は正しい。乖離の核である一律404は残るが、元の実装実態にある標準404文言「お探しのページが見つかりません。」は現行の実物と違うため MISDESCRIBED とした。現行共通404は「ページがみつかりません。／URLに間違いがないかご確認ください。」である。 |
| F07-03 | 実装違い | MISDESCRIBED | 末尾「円」の期待値は旧実装・リバース詳細設計由来であり LEGACY_BACKED は正しい。旧 show.twig は0円なら「無料」、非0円なら `number_format() }}円`。現在も通貨表記差は残るが、先行記載の `Event.entryFee` 参照は現HEADでは `Detail.entryFee |
| M03-02 | 実装違い | MISDESCRIBED | 旧実装 /home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductController.php の addImage() は非XHRと空配列を BadRequest、非画像を Unsupport |
| M03-30 | 未実装 | MISDESCRIBED | 要求そのものはExcel正本にあるため、SPEC_BACKED は妥当。しかし低価格帯CSVの出力・フォーマットという当該サブ機能全体が専用正本シートで Ph2 対応に明示されている。現コードに導線・表・ルートがないという実装観察は正しいが、Ph1の現行実装に対する未実装乖離として扱った元指摘はフェーズ条件を落としてお |
| M03-32 | 実装違い | MISDESCRIBED | 具体条件の根拠は旧実装だけなので LEGACY_BACKED は妥当。pf-eccube3 の SimpleHighPriceImportHandler::isProductExists() は `pc.del_flg = :delFlg`、`p.del_flg = :delFlg`、`psc.high_price_c |
| M03-35 | 実装違い | MISDESCRIBED | 「部門更新」という利用者向け名称は Excel 正本テキストと画像の双方にあるため SPEC_BACKED は妥当で、現行の「部門登録」表示との差も残る。ただし元指摘が設計上の sub_title を「部門更新CSV登録」と断定した点は画像と不一致で、正本画像の実表示は「部門更新CSV」、パンくずは「部門更新CSVアッ |
| M04-03 | 実装違い | MISDESCRIBED | LEGACY_BACKED は妥当。ただし先行記述の「商品未選択で押下→遷移先 new()→自己リダイレクトループ」は経路として誤り。現在の StockListController::bulkEditDispatch() は空IDを検出するとその場で admin_stock_list へ返すため、当該操作では Stoc |
| M04-38 | 未実装 | MISDESCRIBED | Excel正本に5状態と「スマレジ連携失敗」時の再操作条件があるため SPEC_BACKED は妥当。現行実装が3状態しか持たず失敗状態の再承認に未対応という乖離は残る。ただし元指摘の実装説明にある「スマレジ連携失敗はTODOコメントだけがある」というTODOは現在の対象コードおよび対象ソース検索で確認できず、その説明 |
| M05-26 | 実装違い | MISDESCRIBED | 正本根拠と、現行の固定ヘッダ一覧に住所3が1列多い差は残る。一方、指摘にある「64列CSVでは列ズレ・取込失敗となり得る」という実装説明は不正確。AbstractCsvService::checkHeaderValues() は NOT_REQUIRED_CSV_HEADER の全64項目を両側から除外し、実質的に必須 |
| M08-02 | 実装違い | MISDESCRIBED | 保存先がdtb_user_mail_historyからdtb_mail_historyへ変わった点は再現する。ただしfindingが追加差分とするcreator未設定は旧実装でも一括送信呼出しが「saveUserMailHistory($message, null, $customer)」でcreatorを渡さず、sa |
| M09-10 | 実装違い | SPEC_BACKED | 0210正本が明示的に参照させる0301正本のレイアウト画像が、各タイル3商品という期待を具体化している。旧実装 ec-cube/app/Customize/Controller/TopController.php の `DISPLAY_NUM = 3` も同じ数を裏付けるが、旧実装だけが根拠ではないためSPEC_BA |
| M11-03 | 実装違い | MISDESCRIBED | 具体的な Twig global 名・配列形式・初期化ガードは旧実装由来なので LEGACY_BACKED は妥当。ただし先行の実装実態は「二重初期化回避フラグもない」としており、これは現行コードと矛盾する。AuthorityRolesグローバルの不在は残るが、一般の初期化ガードは既に実装されているため、乖離の説明は部 |
| M13-01 | 実装違い | MISDESCRIBED | 具体セッションキーと保存方式は旧実装由来なので分類は妥当。ただし現実装の説明「sort/order を保存しない」は不正確。SearchEventType の hidden `sortkey`/`sorttype` は検索フォームの一部で、EventController::index() が `FormUtil::ge |
| M13-01 | 実装違い | MISDESCRIBED | 具体パラメータ契約と不正値エラーは旧実装だけのため LEGACY_BACKED は正しい。ただし「admin.error.sort は develop の Controller に存在しない」は誤りで、現ツリーの src/Eccube/Controller/Admin/SearchControllerTrait.php |
| M13-10 | 実装違い | MISDESCRIBED | 具体的な成功・失敗文言は旧実装由来なので LEGACY_BACKED は妥当。乖離自体は残るが、先行の「失敗時にaddError('admin.common.save_error')」という説明は検証失敗全般には当てはまらない。現行はフォーム未送信・フォーム不正時にはフラッシュを積まず再描画し、InvalidArgum |
| M14-06 | 実装違い | MISDESCRIBED | SPEC_BACKED自体は、正本AG70が確認文言と確定操作「実行」を明記するため妥当。ただしfindingは正本文言を旧固定文言へ誤記し、「確認文言も不一致」と過大に述べる。現実装の確認文言は正本と一致し、残る乖離は確定ボタン「実行」対「削除」だけなのでMISDESCRIBED。 |
| M15-01 | 実装違い | MISDESCRIBED | POST `/deck/search/{page_no}` と `^[1-9][0-9]*$` は旧実装 DeckServiceProvider.php、page_no=1 の送信は旧 deck.twig に実在するため、主要部分の LEGACY_BACKED 分類は妥当。ただし finding が設計ルート名を `m |
| M15-08 | 実装違い | MISDESCRIBED | 正の整数制約と検索ルート分離は旧M15-08にも存在するため根拠種別は LEGACY_BACKED でよい。ただしfindingはM15-08なのにデッキ用パスと機能IDを記載しており、該当箇所の説明が誤っている。現M15-08にも `\d+` 差は残るため MISDESCRIBED。 |
| M15-08 | 実装違い | MISDESCRIBED | page_no=1固定送信と正整数制約は旧M15-08にもあるため分類は LEGACY_BACKED のままでよい。ただしルート名・URLをDeck経路としている記述は対象違い。現M15-08でも一覧URLへのPOSTと `\d+` 制約の差は残るので MISDESCRIBED。 |
| M15-08 | 実装違い | MISDESCRIBED | CSRF無効という具体設定は旧M15-08にも存在し、Excel正本にはないので LEGACY_BACKED は妥当。ただしフォーム名と参照クラスをDeck用とした説明は誤り。正しいArchetypeフォームでも現在はtrueなので差自体は残り、MISDESCRIBED。 |
| M15-08 | 実装違い | MISDESCRIBED | 具体セッションキーは旧実装由来なので LEGACY_BACKED は妥当。ただしM15-08のキーをdeckとした値は誤り。現在のArchetype経路にも `eccube.` 接頭辞差は残るため、対象と具体値を訂正した MISDESCRIBED とする。 |

## 一部解消・残差あり（35件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| A05-04 | 未実装 | SPEC_BACKED | 注文サブデータと連携エラー項目は関連するExcel正本に明記されているため、旧実装だけを根拠としたLEGACY_BACKED判定は誤りで、SPEC_BACKEDへ訂正する。現行では一部の項目とポイント反映がOrder上に実装済みだが、注文サブデータ構造および既存スムーズ店頭受取注文に対する全項目更新は未達なのでPART |
| A07-02 | 実装違い | PARTIAL | 401空本文の具体契約はExcel正本になく旧認証経路由来なのでLEGACY_BACKEDは妥当。ただし先行記述の「401は共通ExceptionListenerで必ずJSON」は過大。現行では不正トークンとトークンが指す会員不在はAccessTokenAuthenticatorの認証失敗レスポンスが空本文401を直接 |
| A07-04 | 実装違い | PARTIAL | 401/404空本文はExcel正本になく旧経路由来なのでLEGACY_BACKEDは妥当。ただし現行が全条件で必ずJSONという説明は誤り。不正トークン・会員不在はAccessTokenAuthenticatorが空本文401を直接返すため解消済み。トークン欠落はIsGranted拒否からJSON 401となり、受注 |
| B02-07 | 未実装 | PARTIAL | 要求の直接根拠はExcel正本ではなくリバース詳細設計と旧実装なので、LEGACY_BACKEDは妥当。現実装ではコンソール入口の実行時間制限解除だけが共通適用され、残るメモリ制限解除とSQLロガー無効化はB02-07経路にないため、一部解消と判定する。 |
| B05-02 | 未実装 | PARTIAL | 3条件はExcel正本が直接支持する。現実装ではステータスとメール履歴なしは実装済みだが、時刻下限をnow-1分からさらに5分戻しており、実際は6分前〜1分前になる。旧来の「抽出実装がない」という説明は現在には当てはまらないが、複合要件の一部だけ未達なのでPARTIALとする。 |
| B08-02 | 実装違い | PARTIAL | API送信と失敗時持ち越しの両方がExcel正本に明記されるため SPEC_BACKED は正しい。先行記載の「引数なし」「固定成功レスポンス」は現在解消され、失効ポイントは実APIへ渡る。一方、EC側のポイント・履歴を先にcommitしてから非同期APIを呼ぶため、API失敗時に当該会員のEC側失効を行わず翌日へ持ち |
| B16-06 | 未実装 | SPEC_BACKED | 期待値全体がExcel正本に直接記載されているためUNCERTAINではなくSPEC_BACKED。先行の「専用Command/Serviceが不在」は探索範囲漏れで、現行には専用シェル処理がある。処理本体は解消済みだが、現在の作業ツリー内には月次1時のStep Functions/EventBridge起動定義が無く |
| B16-11 | 未実装 | SPEC_BACKED | 要求はExcel正本に直接かつ具体値付きで存在するためUNCERTAINではなくSPEC_BACKED。先行のConsole/Service探索だけでは不十分で、現行シェルが本体を実装済み。ただし作業ツリーにStep Functionsの15分起動定義がなく、さらにBCC既定値が正本と異なるため、乖離は一部だけ残るPA |
| F01-02 | 未実装 | PARTIAL | 文言と配置はExcel正本が直接支持する。現実装の6リンクはhref="#"から実URLへ変更され、各画像のHTML内設定URLへ遷移する部分は解消した。一方、画像・リンク・ラベルはTwig固定で、ブロック管理由来の編集可能データ表示は未実装のままである。 |
| F02-02 | 実装違い | PARTIAL | Excel正本は各項目の存在を示すが、英語ロケール固有の3点セットは支持しないためLEGACY_BACKED分類を維持する。現在は英語ヘッダから買取とデッキ構築が削除されて2点は解消したが、同じ英語上部ナビに選手一覧がないため一部だけ残る。 |
| F03-05 | 実装違い | PARTIAL | 英語の完全一致要求はExcel正本ではなく旧実装由来なのでLEGACY_BACKED分類を維持する。元指摘の主要部分だった「共通ブロックが0件時に何も表示しない」は解消し、日本語正本文言も満たした。一方、英語値だけは旧実装の `No recommended items to display yet.` ではなく別表現の |
| F04-02 | 未実装 | PARTIAL | 条件と3種類の文言が function-design-embed 外の src-cell に直接存在するため SPEC_BACKED は正しい。現在はコンビニ・クレジットカードの2分岐だけ実装され、支店分岐が残っているため部分解消である。 |
| F04-03 | 未実装 | SPEC_BACKED | 日本語見出しがExcel正本のレイアウト画像に直接存在するため、「見出し要求は旧実装だけ」という分類は反証される。英語の厳密な旧文言は旧実装 pf-eccube3/.../Shopping/delivery_edit.en.twig の block main 19行にのみ確認でき、期待値には正本由来部分と旧実装由来部分 |
| F04-04 | 実装違い | PARTIAL | 期待文言とヘルプページ誘導はいずれもfunction-design-embed開始前のExcel正本図形・画像にあり、SPEC_BACKEDは正しい。 |
| M04-12 | 実装違い | PARTIAL | 引用は function-design-embed 外の src-cell なので SPEC_BACKED は妥当。ただし「タイプ別に出し分けるべき」という先行指摘は、正本レイアウト画像が実装同様の6件フラット配置を描くため断定できない。一方、項目表と検索条件画像はいずれも表示文言を「入庫完了」とし、現実装のマスタ値「 |
| M04-12 | 実装違い | PARTIAL | SPEC_BACKED は妥当。現実装が検索セッション全体を削除するため、正本が限定した3-1〜3-4より広い項目を消す挙動差は再現する。一方、先行指摘の「リンクでありボタンではない」という部品種別差は、項目表の「ボタン」と正本画像のリンク風表示が矛盾しており、乖離として確定できない。よってクリア範囲のみ残る PART |
| M04-17 | 未実装 | PARTIAL | 動的挙動はExcel正本が直接定義するため SPEC_BACKED は妥当。元指摘後の変更により、history.twig には disposal_search の change 監視、2-3を欠品2区分へ固定・非活性化、複数の非対象項目をクリア・非活性化する実装が追加されているため、元の「JS監視が存在しない」は現状 |
| M04-19 | 実装違い | PARTIAL | SPEC_BACKED は正しい。現実装は監査時点から変更され、欠品減算（受注）・欠品減算（移動）の2子区分は取得するようになった。一方、正本が併記する「廃棄」（親区分）配下は現在の固定ID配列に含まれないため、要求全体としては一部だけ解消している。 |
| M04-19 | 実装違い | PARTIAL | SPEC_BACKED は正しい。第三ソートは監査時点の sh.createDate 固定から変更されたが、現在は登録日時固定ではなく approvalAt、registeredAt、createDate の優先順によるCOALESCEである。registeredAt がある未承認等の行では要求に近づいた一方、appr |
| M04-21 | 実装違い | PARTIAL | 分類は正しい。現在は基準日時ソートが実装され、元指摘のソート部分は解消した。一方、Twigの承認日は Y/m/d のままで時分が欠けるため、表示書式の乖離だけ残る。 |
| M05-11 | 実装違い | PARTIAL | 先行記載の「読み取り専用分岐がない」は現状では解消済みだが、設計が明示的に例外とした欠品登録まで現行は disabled にしているため全解消ではない。 |
| M05-26 | 未実装 | PARTIAL | 3つの副作用の存在はExcel正本にあるが、指摘の核心であるコミット後・try外という境界は旧実装由来なので LEGACY_BACKED は妥当。現行では出荷完了メールがコミット後に追加され、この部分は解消した。一方、PointService::gainPoints() とスマレジの registerGainPoint |
| M05-26 | 実装違い | PARTIAL | 内部検索手順は旧実装だけのため LEGACY_BACKED は妥当。ただし先行メモの「桁埋めも行わない」は現行ツリーでは解消済み。残る差は、桁埋め後も旧実装の DtbOrderSub 相当ではなく親 Order.order_number を直接検索する点である。 |
| M09-04 | 実装違い | PARTIAL | 日本語・英語の拡張子と新規時の日英2ファイル作成はいずれも正本にある。現実装は2ファイル作成は満たすが、日本語ファイル名だけ正本と不一致なので複合要求の一部が残る。 |
| M10-07 | 実装違い | PARTIAL | Excel正本に重複条件・文言はなく、文言差は旧実装由来なのでLEGACY_BACKEDは維持する。ただし先行指摘の条件部分は誤りがある。旧実装 /home/y-saito/Developments/pf-eccube3/src/Eccube/Controller/Admin/Setting/Shop/TaxRuleC |
| M12-03 | 実装違い | PARTIAL | 残存する比較演算子 `<` の期待値は、旧実装 /home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php の getQueryBuilderBySearchData() 145-149 |
| M12-07 | 実装違い | PARTIAL | セッション非保存と送信フォームのmonthで再集計する具体挙動は、旧 FormatSalesController::search()/export()（/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysi |
| M13-04 | 実装違い | PARTIAL | 初期値一式は Excel正本の表と画像の双方にあるため SPEC_BACKED は妥当。ただし先行 finding の「日前日数にも data 初期値がない」は現状では古い。日前日数3項目と締切時刻は実装済みで、受付開始/終了とオンライン開始/終了の4時刻の 00:00 だけが未解消なので PARTIAL。 |
| M14-04 | 実装違い | PARTIAL | 確認モーダルと「実行」ラベルの要求は正本にあるため SPEC_BACKED は妥当。ただし元 finding の設計期待値「このカードを削除してもよろしいですか？」は誤引用である。現実装の確認本文は正本と一致しており、この部分は乖離しない。残る差は確定ボタンが正本の「実行」ではなく「削除」である点だけなので PARTI |
| M14-05 | 実装違い | PARTIAL | URL・route名の根拠は旧実装なので LEGACY_BACKED は妥当。pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/CardServiceProvider.php は GET `/card/csvimport`=`admin_card_csv`、P |
| M14-08 | 実装違い | PARTIAL | 正本が要求する機能結果（表示件数・並び順保持）は現実装も満たす。期待値中の具体URLとresume規則は、実際に開いた旧実装 card_set_detail.twig 108-110行およびCardSetController::index() 46-50行だけにあるためLEGACY_BACKEDは妥当。現状は保持機能が |
| M15-06 | 実装違い | SPEC_BACKED | 先行分類は画像を考慮していない。見出しの配置順は Excel 正本レイアウト画像が具体的に支持するため、その部分は SPEC_BACKED と確定できる。一方、finding が期待する TSV 付き文言は正本の取消指定と反対で、nl2br は旧 Twig だけの根拠である。したがって指摘は混在しており、正本で成立する |
| M15-06 | 実装違い | PARTIAL | 旧 pf-eccube3 の DeckServiceProvider.php:53-57 は GET `/deck/csvimport`=`admin_deck_csv`、POST 同パス=`admin_deck_csv_import` であり、URLとGET route名の根拠は旧実装にあるため LEGACY_BAC |
| M15-06 | 実装違い | PARTIAL | 具体契約は pf-eccube3 の DeckCsvController::import() と DeckCsv::render() に由来するので LEGACY_BACKED は正しい。現行は失敗時リダイレクトとフラッシュ鍵を踏襲していないが、CsvImporter::import() の finally で成功・失 |
| M15-06 | 実装違い | PARTIAL | 旧 pf-eccube3 の実物では GET `/deck/csvimport` は `admin_deck_csv`、POST 同パスは `admin_deck_csv_import`。旧URLとGET名は LEGACY_BACKED だが、finding の POST 名 `m15-06_admin_deck_de |

## 要設計判断（Excel正本内でテキストと画像等が矛盾）（23件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| A02-05 | 実装違い | SPEC_BACKED | 「string は旧実装だけが根拠」という分類は誤りで、Excel正本のJSONサンプルが直接stringを示すためSPEC_BACKED。ただし同じExcel正本の型表は整数を要求しており正本内で矛盾する。現実装の整数は型表には合致しサンプルには不一致なので、どちらを優先するか決められず乖離自体はUNSUREとした。 |
| A07-05 | 実装違い | SPEC_BACKED | 「boolean期待は旧実装だけ」という分類は、Excel正本のレスポンスサンプルが boolean を直接示すため成立しない。ただし同じ正本のカスタマイズ説明・処理概要・型表は3値IDへの変更を明記しており、正本内で矛盾する。旧 pf-api の DtbBuyMainCard.orm.yml は `foilFlg:  |
| B02-07 | 実装違い | UNSURE | Excel正本には数量連携を望む記述と、数量不要の可能性を残す記述が併存し、stock値の確定形式を一意に決められない。よって根拠区分の UNCERTAIN は妥当。現実装の店舗ID集合が「在庫有無のみ」という未確定案を満たす可能性があり、確定的な乖離判定もできない。 |
| F01-02 | 実装違い | UNSURE | SPEC_BACKED分類自体は、期待文言がExcel正本セルに実在するため維持する。しかし同じExcel正本のレイアウト画像が別文言を示しており、正本内部で「承っております」と「承っています」が矛盾する。どちらを優先すべきか本資料だけでは決められないため、現在の実装との差を再現済みとは断定しない。 |
| F02-01 | 実装違い | UNSURE | 期待値はExcel正本セルに明記されているのでSPEC_BACKED分類は維持する。ただしPC・スマホ双方の正本レイアウト画像は切替先言語を示す現実装と一致し、正本内部が矛盾している。セルと画像のどちらが正しいか判断できないため driftVerdict はUNSUREとする。 |
| F06-11 | 実装違い | UNSURE | 長いラベルはsrc-cellを持つ正本項目表に実在するため SPEC_BACKED という分類自体は維持する。しかし同じExcel正本のレイアウト画像は短いラベルを明示し、現行実装はこちらと一致する。正本内で期待値が衝突し優先順位を確定できないため、乖離の現存判定は UNSURE とした。 |
| F06-14 | 実装違い | UNSURE | 項目表には指摘どおりの文言が実在するので SPEC_BACKED という根拠区分自体は正しい。しかし同じExcel正本のレイアウト画像は現実装と同じ「登録済み／未登録」を示し、正本内で矛盾する。どちらを優先すべきか確定できないため、現在の乖離は UNSURE とする。 |
| M03-01 | 実装違い | UNSURE | 「同一言語内で合算」という正本根拠自体は実在するため SPEC_BACKED 分類は維持する。しかし同じ正本の「状態毎に出力」とレイアウト画像の規格別行がその読みと衝突する。どの記述を優先するか正本だけでは決められず、先行指摘の「通常規格値を合算」が唯一の設計期待値とは断定できない。 |
| M03-33 | 実装違い | SPEC_BACKED | 根拠の所在という分類軸では、7列・必須指定はいずれも data-excel-ref を持つ Excel 正本なので UNCERTAIN ではなく SPEC_BACKED。ただし同じ正本に買取価格・スマレジ連携フラグを不要とする後日注記があり、現時点で有効な外部CSV契約を正本だけから一意に決められないため driftV |
| M03-33 | 実装違い | SPEC_BACKED | 全セール分岐の買取価格更新要求は Excel 正本にあるため、根拠区分は SPEC_BACKED。ただし後日注記は入力列自体を不要としており、処理分岐の記述と両立しない。どちらが最終承認仕様か確認できないので現行の非更新を drift と断定できず UNSURE。 |
| M03-33 | 未実装 | SPEC_BACKED | スマレジ項目追加・連携追加という機能要求は Excel 正本にあるため、出典分類は SPEC_BACKED。もっとも正本は特定の Coordinator API や引数までは規定せず、さらに後日不要注記と衝突する。最終仕様を確定できないため現行で未接続な事実は確認しても drift は UNSURE。 |
| M03-33 | 未実装 | SPEC_BACKED | 買取価格の必須入力・全分岐更新は Excel 正本に書かれているので出典は SPEC_BACKED。ただし同じ正本の後日注記が入力列不要とするため、有効仕様を一意に決められず、現行の非更新が乖離かは UNSURE。 |
| M03-33 | 未実装 | SPEC_BACKED | 項目追加・自動判定・連携追加は Excel 正本にあるため根拠区分は SPEC_BACKED。ただし後日不要注記との矛盾が解けず、正本は具体的な Coordinator API も規定していない。実装に列・更新・連携予約がない事実は確認したが、最終仕様に対する乖離かは UNSURE。 |
| M03-41 | 未実装 | UNSURE | Excel 正本内で2列要求と1列要求が矛盾しているため、元の UNCERTAIN 分類を維持するのが妥当。現実装は1列側の正本記述には合致し、2列側には合致しないので、設計解釈が確定しない限り現在の乖離も断定できない。 |
| M04-04 | 実装違い | UNSURE | SPEC_BACKED という分類は正しいが、乖離の確定はできない。先行指摘はExcelの物理行順をCSV列順とみなす一方、実装は識別IDの昇順と一致する。正本は「識別ID」と物理行順のどちらが出力順を支配するかを明記せず、両者が矛盾するため、現在実装が設計違反か判断不能。 |
| M04-12 | 実装違い | UNSURE | SPEC_BACKED の分類自体は正しいが、正本内部で処理概要と画面レイアウト・項目表が矛盾する。テキスト要求に従えば実装は乖離する一方、実装の「選択IDなし・検索条件全件出力」はレイアウト画像と整合するため、どちらが正本の最終意図か判断できず drift は UNSURE。 |
| M04-16 | 未実装 | UNSURE | Excel正本内で、販売価格を含まない本体の明示列挙と、販売価格を含む参照先別添が矛盾しているため、元の UNCERTAIN 分類を維持するのが妥当。現実装は本体14列側には合うが別添15列側には合わず、どちらが最終仕様か確定できないので drift も UNSURE。 |
| M04-24 | 実装違い | UNSURE | 項目表に直接記載があるためSPEC_BACKED分類自体は妥当。ただし同じ正本のレイアウト画像は現行実装と同じチェックボックス2個を示し、正本内部で部品種別が矛盾する。どちらを優先すべきか確定できないため、現在の乖離再現判定はUNSUREとする。 |
| M04-35 | 未実装 | UNSURE | Excel正本のitem tableに明示的な「初期100」があるため、指摘の根拠区分自体は SPEC_BACKED として維持する。ただし同じ正本のレイアウト画像は現行実装と同じ「10件」であり、設計正本内で期待値が矛盾する。どちらを優先すべきか本資料だけでは確定できないため、乖離の存否は UNSURE とした。 |
| M04-38 | 実装違い | UNSURE | 項目表に時刻付き条件が直接存在するためSPEC_BACKED分類は妥当。ただし同じ正本のレイアウト画像は日付のみで現行実装と一致し、正本内部で入力粒度が矛盾する。採用すべき仕様を断定できないためdriftVerdictはUNSUREとする。 |
| M06-08 | 実装違い | UNSURE | SPEC_BACKED であること自体は項目表の src-cell で確認できる。しかし同じExcel正本のレイアウト画像が実装と同じハイフン区切りを示しており、正本内で期待書式が一意に定まらない。したがって現実装の YYYY-MM-DD を設計乖離と断定できない。 |
| M08-13 | 実装違い | UNSURE | 本文src-cellは先行期待値を直接支持するのでSPEC_BACKED分類自体は維持する。しかしExcel正本内で、項目表の「チェックボックス・住所→電話番号→氏名」とレイアウト画像の「セレクト・氏名→電話番号→住所」が衝突する。現実装は後者に一致するため、どちらを正とするか決めずUNSUREとする。 |
| M10-10 | 実装違い | UNSURE | 項目表に期待文言「設定」が直接あるため、根拠区分SPEC_BACKED自体は正しい。しかし同じExcel正本のレイアウト画像は「登録」で項目表と矛盾し、現実装も「登録」である。どちらを採用仕様とするか判断できないため、乖離再現はUNSUREとする。 |

## 要再調査（19件）

| 機能No | 指摘区分 | 判定 | 理由 |
|---|---|---|---|
| A05-01 | 未実装 | REPRODUCED | 一つのfindingにExcel正本で裏付けられる表示契約と、旧実装だけに根拠がある詳細抽出契約が混在している。単一のSPEC_BACKEDまたはLEGACY_BACKEDへ安全に確定できないためUNSUREとする。ただし記載された現行差分自体は実装上再現する。 |
| A06-02 | 実装違い | REPRODUCED | Excel正本に401空本文契約はない。旧 pf-api/src/Controller/BaseController.php の authAdminToken() は認証失敗時に `throw new UnauthorizedHttpException('')` とするが、config/packages/fos_res |
| A06-05 | 実装違い | REPRODUCED | Excel正本に401/404空本文契約はない。旧 pf-api の BaseController::authAdminToken() は UnauthorizedHttpException('')、OtcBuyOrderStatusController::putAction() は NotFoundHttpExcep |
| A07-06 | 未実装 | SPEC_BACKED | 設計根拠は明確なので UNCERTAIN ではなく SPEC_BACKED。ただし先行の「IP制限実装不在」は事実と異なり、汎用 IpAddrListener がApp APIにも適用され得る。チェックイン既定値はallow/denyとも空で、実配備環境の環境変数や外部WAF設定は作業ツリーから確認できないため、当該A |
| B02-05 | 未実装 | SPEC_BACKED | 引用は曖昧ではなくExcel正本に明記されるため、根拠区分 UNCERTAIN は誤りで SPEC_BACKED。ただしStep Functionsのスケジュールはリポジトリ外のAWS/IaC設定で管理され得る。現在のアプリ作業ツリーに設定がないことだけでは、実環境にも未設定と断定できない。 |
| B02-06 | 実装違い | UNSURE | SPEC_BACKED は妥当。ただし実装が選ぶ数値IDは BaseInfo::TC_TOKYO_ID = 1 で、設計指定の支店ID 1とは一致する。コード上の名称はTC東京だが、実際の dtb_base_info のID 1がどの店舗データかは現在の作業ツリーだけでは確定できない。定数名の差だけでTC大阪以外を複製 |
| B02-06 | 実装違い | SPEC_BACKED | 要求は明確にExcel正本にあるため根拠区分 UNCERTAIN は誤りで SPEC_BACKED。実装SQLは複製元から product_class_id と stock_location_id の2列だけを引き継ぎ、残りを0/false/現在時刻等で初期化しており、構造は正本要求と一致する。しかし正本用語「拡張タイ |
| B02-09 | 未実装 | SPEC_BACKED | 実行トリガーと間隔の設計根拠は曖昧ではなくExcel正本に明記されるので、根拠区分UNCERTAINは誤りでSPEC_BACKED。ただしStep Functions/EventBridgeの実環境設定はアプリリポジトリ外に存在し得て、提示範囲だけでは現在の運用スケジュール欠落を確定できないため driftVerdic |
| M03-30 | 未実装 | UNSURE | Excel正本内に追加指示と非対応指示が同時に存在し、どちらが最終仕様かをこの正本だけでは確定できない。したがって SPEC_BACKED を無条件に追認も否定もできず、classVerdict は UNSURE。現実装に原価単価列がないこと自体は確認できるが、それが未実装乖離か正本どおりの非対応か決められないため d |
| M03-33 | 未実装 | SPEC_BACKED | 7列・必須列の根拠自体は明確な Excel 正本なので、根拠区分 UNCERTAIN は SPEC_BACKED に訂正する。ただし同じ正本内の後日注記が2列を不要とするため、最終契約が7列か5列かは判定不能で driftVerdict は UNSURE。 |
| M04-02 | 未実装 | SPEC_BACKED | 根拠区分は SPEC_BACKED と確定できるため originalClass=UNCERTAIN は不適切。ただし設計文言は「一日単位」が日次スナップショットを必須とするのか、日時付き変動履歴を日単位で検索できれば足りるのかを定義していない。現実装には後者があるため、乖離の有無は断定できない。 |
| M06-04 | 未実装 | SPEC_BACKED | 設計根拠は正本に明記されているため、根拠区分 UNCERTAIN は誤りで SPEC_BACKED が妥当。一方、現実装は status()/statusUpdate() でルート別の isAccessibleRoute() を実行し、AuthorityRole の deny_url により権限ごとに拒否できる。テスト |
| M06-04 | 未実装 | SPEC_BACKED | 設計根拠は正本セルとレイアウト画像に明確に存在するため、根拠区分 UNCERTAIN は誤りで SPEC_BACKED が妥当。現実装はボタンとPOST処理を持ち、ルート別 deny_url による拒否も実装・テストされている。経理以外への deny_url の実割当はDB設定依存で、作業ツリーには経理専用の固定判定も |
| M08-04 | 未実装 | REPRODUCED | 旧実装は必須ラジオのUIを支持する一方、期待値に含まれるidentification_flgへの保存を支持しない。Excel正本にも本人確認フラグ要件はないため、複合した期待値全体をSPEC_BACKEDまたはLEGACY_BACKEDに断定できず、元のUNCERTAINが妥当。現実装でUI項目がないという事実自体は現 |
| M08-08 | 未実装 | REPRODUCED | 「件名も本文も非表示」という一体の期待値はExcel正本にも旧実装にも裏付けられないが、本文textareaのテンプレート選択時のみ表示は旧実装が裏付ける。単一findingのままではSPEC_BACKED/LEGACY_BACKED/UNSUPPORTEDのいずれにも確定できず、元のUNCERTAINは妥当。現在も入 |
| M08-08 | 実装違い | MISDESCRIBED | findingは確認画面を対象にしながら、実装実態には入力画面mail_manual.twigのtextarea描画を混在させている。旧実装に新規確認画面はなく、件名非表示も裏付けないためUNCERTAINは妥当。現確認画面は入力欄を常時表示するのではなく、値をテキスト表示しフォーム要素をhidden化しており、記載さ |
| M13-05 | 未実装 | UNSURE | 複製新規シートには期待値を直接支持する src-cell と画像があるため SPEC_BACKED 分類は維持する。ただし同じExcel正本のイベント編集シートには会場削除の後日注記があり、画像と表も更新が同期していない。どちらが現行の複製新規仕様を優先するか正本内だけでは確定できないため、実装に会場がない事実は確認で |
| M13-05 | 未実装 | UNSURE | 複製新規シートの src-cell とレイアウト画像は期待値を直接支持するので SPEC_BACKED は妥当。ただし関連シートの項目表は備考(日/英)を削除対象としており、レイアウト画像は削除前のままで正本内部が不整合である。複製新規シートの残存記述と編集シートの削除指定の優先関係を確定できないため drift は  |
| M15-01 | 実装違い | REPRODUCED | 不正orderの扱いは旧実装で裏付くが、不正sortKeyでも `admin.error.sort` とする期待は正本にも旧実装にもなく、複合期待値を単一のSPEC_BACKED/LEGACY_BACKEDへ確定できないため元のUNCERTAINが妥当。現行コードの記載事実と、少なくとも不正order時に旧index初 |
