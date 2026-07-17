# 新規バグ候補レジスタ（既知の確定課題と突合し未知のみ抽出）

> 生成: 2026-07-17 ／ 突合先: `ec-cube-enterprise/.cursor/docs/impl_check/verified`（確定課題500件・Claude+codex二重検証済み）

**目的**: オラクル独立の結合テスト再生成（340機能）で検出した設計vs実装の乖離のうち、**既存の実装チェックでは挙がっていない新規のもの**を裁定に回す。

## サマリ

| | 件数 |
|---|---:|
| 付帯表4 バグ候補（一致(非バグ)241を除く） | 1,969 |
| **既知の確定課題と一致 → 除外** | **298** |
| **新規検出（本レジスタの対象）** | **1,671** |
| うち **P1**（移行退行・未実装・設計誤り・バグ候補） | **494** |

### 新規検出の分類

| 分類 | 優先 | 件数 |
|---|---|---:|
| 移行退行疑い | P1 | 244 |
| 未実装疑い | P1 | 175 |
| 設計誤り疑い | P1 | 38 |
| バグ候補 | P1 | 37 |
| 乖離 | P2 | 935 |
| その他 | P2 | 169 |
| 要実機確認 | P3 | 73 |

## 突合方法（保守的＝誤除外を避ける）

既知課題(500件)は `ALL_issues.tsv`＋`*_verification_matrix.md`（機能ID紐付け481件）。以下のいずれかで「既知」と判定し除外:
- **A**: 機能ID一致 かつ **同一ファイルの行番号が±25行以内** かつ 内容類似≥0.05（high）
- **B**: 機能ID一致 かつ 内容類似≥0.22（high）
- **C**: 機能ID一致 かつ 同一ファイル かつ 内容類似≥0.12（mid）

※「同一ファイルのみ・内容類似なし」は**一致にしない**（同一機能の別課題を誤除外しないため）。ツール: `integration_test/tools/crosscheck_verified.py`

**裁定欄の記入例**: `実バグ→実装修正` / `設計修正(Excel誤り)` / `詳細設計修正` / `仕様どおり→対応不要` / `既知の重複` / `保留`

## §1. 新規P1（移行退行・未実装・設計誤り・バグ候補）（494件）

| 機能 | 区分 | 分類 | 設計（あるべき） | 判定（実装との食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 未実装疑い | 取得対象は「取引更新時間が バッチ駆動時間X 〜 X-Y hours(初期5h) の間」の時間窓（0501:L1498,L1517）。取得期間Yは可変（0501:L1503） | 乖離（取得期間の粒度違い・時間窓未実装） | `SmaregiStockBackfillCommand.php:44, SmaregiStockBackfillAction.php:67` | RG-002 |  |
| a02-01 | 現行踏襲 | 未実装疑い | レスポンスに `productUrl` 文字型=商品詳細URL を含む（Excel `:1030`）。「商品ページURLを含む商品情報をJSON出力する」（Excel `:980`）、サンプル `"p | 乖離（Excel設計が規定する応答項目が実装・詳細設計の双方に存在しない＝未実装の疑い）／要実機確認 | `DtbProductSubClassRepository.php:52, ProductController.php:61` | RG-004 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 機能名↔エンドポイントの対応: Excel A02-03「ポップアップ用商品情報取得（旧商品ID）」＝`/popup/old/{言語コード}/{旧商品ID}`（0502:L1369,L1370）・Ex | 乖離（設計間の交差・要実機確認）: Excel＋移行先実装は「商品＝言語付き／カード＝言語なし」、詳細設計は「商品＝言語なし」。A02-03 がどちらのURLを指すかが未確定。本書は正本(詳細)の明示的限定に従い言語なしURLを対象としたが | `routes.yaml:97, ProductController.php:317` | RG-001,004,005,015／§5 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 言語なし `GET /popup/old/{oldProductId}` の成功応答＝9項目（productId・name・productClassId・price01・price02・stock・n | 退行（現行踏襲違反・要実機確認）: 同一URLで現行の `cardId` が移行先で消失し、応答が14項目のカード応答へ変質。現行の消費側（記事ポップアップ）が cardId を参照していると移行後に取得不可。なお移行先の応答項目は Exc | `DtbProductRepository.php:101, ProductController.php:113, ProductController.php:334` | RG-004,010 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | price01・price02・stock の型：オラクル内で不確定。詳細 L326 は string（Doctrineのdecimal値のため数値文字列で返す）、Excel 型表 0502:L141 | 乖離／要実機確認（Excel型表 integer vs Excelサンプル string vs 詳細 string の三者矛盾でオラクル一意化不可。加えて移行先が stock のみ int 化＝現行(string)との型差＝現行踏襲差。実装 | `DtbProductRepository.php:104, PopupResponseBuilder.php:36` | RG-014,004 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 「条件に合致する商品を一件返す」（詳細 L325）。複数の商品規格・商品画像が該当する場合にどれを返すかは Excel・詳細設計とも規定なし | 乖離（現行の非決定性・要実機確認）: 現行は並び順未指定のため複数規格/画像時にどの1件が返るかDB依存で非決定。移行先は優先順を定義しており、同一データでも返る規格/画像が現行と変わりうる＝現行踏襲差。設計(L325)は選択規則を規定して | `DtbProductRepository.php:114, ProductRepository.php:2491` | RG-001,004／§5（要判定） |  |
| a02-04 | 現行踏襲 | バグ候補 | 応答フィールドは14項目: `productId`・`name`・`productClassId`・`price01`・`price02`・`stock`・`nameEn`・`subFileName` | 乖離（Excel規定の応答フィールド欠落。特に `productUrl` は 0502:L1564 が本機能の主目的「商品ページURLを含む商品情報」として規定するもので、未返却ならポップアップから商品ページへ遷移できない＝バグ候補。詳細設 | `DtbProductSubClassRepository.php:194` | RG-006,007 |  |
| a02-05 | 現行踏襲 | 設計誤り疑い | 参照系につき副作用なし・DB更新なし（詳細 L366「無し（参照のみ）」・L388「本APIは参照のみ」・L372「本APIはデータを更新しない」） | 乖離（詳細設計の DB操作節 L378-379「登録/更新・persist/flush で直接確定」・業務ルール節 L370「保存する」は参照系APIに機械適用された総称テンプレ＝ハルシネーション。副作用L366/排他L388と自己矛盾。実 | `ProductController.php:232, ProductRepository.php:2194` | RG-013,016,017 |  |
| a05-01 | カスタマイズ | 未実装疑い | 印刷情報送信の入口を `GET /order/prints/{店舗ID}` へ変更しステータス更新API(A05-02)とエンドポイントを分離。ConnectionType分岐を廃止（Excel 05 | 乖離（カスタマイズ未実装） | `routes.yaml:73, OrderController.php:33` | RG-001,012,023 |  |
| a05-01 | カスタマイズ | 未実装疑い | URL引数の店舗ID(shop_id)で当該店舗の未印刷注文のみ抽出（Excel 0505:L992,L995） | 乖離（カスタマイズ未実装） | `DtbOrderRepository.php:21` | RG-002 |  |
| a05-01 | カスタマイズ | 未実装疑い | バーコード未印刷不具合防止のためXML化前にスマレジ商品コード存在チェックし、無い場合は何もしない（Excel 0505:L993,L994） | 乖離（カスタマイズ未実装・既知不具合残存） | `OrderController.php:73, OrderController.php:203` | RG-004 |  |
| a05-01 | カスタマイズ | 未実装疑い | 店舗IDが無い/整数以外の型/存在しない店舗IDは404（支店処理踏襲）（Excel 0505:L1017） | 乖離（カスタマイズ未実装） | `OrderController.php:31` | RG-012 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 詳細設計 DB操作節（正本 L396）は「本機能は参照系でDBへの登録・更新・削除は行わない」と記す | 乖離（詳細設計ハルシネーション・要是正） | `OrderController.php:120` | RG-015,021 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 詳細設計 業務ルール節（正本 L336）は「応答値…保存結果または取得結果をJSON応答へ整形する」と記す | 乖離（詳細設計ハルシネーション・要是正） | `OrderController.php:54` | RG-013 |  |
| a05-01 | カスタマイズ | バグ候補 | 印刷対象抽出条件は「店頭受取かつ注文受領」または「スムーズ店頭受取かつ所定条件」または「ブラウザ印刷フラグ立ち」で、注文番号ありを必須とする（正本 L331,L394） | 乖離（実装バグ候補・条件貫通）／要実機確認 | `DtbOrderRepository.php:21` | RG-001,004,011 |  |
| a05-02 | カスタマイズ | 未実装疑い | A05-02はPOST `/order/prints/status/printed` でA05-01とエンドポイントを分ける（本店/支店プリンタのURL設定変更が必要。一次根拠=エンドポイントURL値 | 乖離（エンドポイント分離 未実装） | `routes.yaml:73, OrderController.php:33` | RG-012 |  |
| a05-02 | カスタマイズ | 未実装疑い | 認証方式は IP制限（認証有。Excel 0505:L1267） | 乖離（IP制限 アプリ側未実装・実機確認要） | `OrderController.php:31` | RG-011 |  |
| a05-02 | カスタマイズ | 未実装疑い | ★プリンタ側でエラーがあった場合、印刷結果XMLに返るエラーコードをログに追記する（Excel 0505:L1273,L1278。現行は印刷結果の詳細を参照してエラーの有無を確認していない＝Excel | 乖離（★エラーコード検査・ログ追記 未実装） | `OrderController.php:91` | RG-004 |  |
| a05-03 | カスタマイズ | 移行退行疑い | エンドポイントに店舗IDを渡し、店舗IDに紐づく受注データのみを対象とする（Excel `0505:L1500,L1503,L1507,L1518`。本店・支店統合で本店の店舗IDを渡すカスタマイズ） | 乖離（現行未実装・移行先で実装。パス形も相違） | `FrontControllerProvider.php:284, DtbWaitingNumberRepository.php:23, WaitingNumberController.php:56` | RG-003,014 |  |
| a05-03 | カスタマイズ | 移行退行疑い | 認証あり・認証方式はIP制限（Excel `0505:L1501`） | 乖離（IP制限認証 未実装・現行/移行先とも匿名） | `WaitingNumberController.php:22, FrontControllerProvider.php:284, WaitingNumberController.php:56` | RG-010 |  |
| a05-03 | カスタマイズ | 移行退行疑い | 出荷完了補完で「ピック番号の間の連番がすべて出荷完了なら補完」。数字はinteger要素として扱う（正本 L327,L337） | 乖離（要素型の不定・要実機確認。移行先は(int)是正済み） | `WaitingNumberController.php:45, DtbWaitingNumber.php:11, WaitingNumberController.php:83` | RG-008 |  |
| a05-04 | カスタマイズ | 未実装疑い | Webhookの仕様を廃止予定のスマレジAPIからプラットフォームAPIへ変更し、Webhook返値が取引IDのみになるので別途APIを叩いて取引詳細を取得する（Excel 0505:L1660,L1 | 乖離（プラットフォームAPI化 未実装） | `SmaregiController.php:28` | RG-011 |  |
| a05-04 | カスタマイズ | 未実装疑い | 本店側でwebhookを受けて支店へAPIで送っている処理を廃止し、webhook受信のみで本支店データ連携を実行する（本支店統合。Excel 0505:L1662,L1663） | 乖離（本支店統合 未実装・支店転送継続） | `SmaregiController.php:66` | RG-010,012 |  |
| a05-04 | カスタマイズ | 未実装疑い | ★3 スマレジ取引詳細をECCUBEに登録＝スムーズ店頭受取以外は新規受注を出荷完了で作成、既存受注は受取方法により出荷完了/引き渡し済みに分岐、ついで買いは受注を新規作成し既存へ移行先受注IDを登録 | 乖離（受注登録★3・購入パターン分岐 未実装） | `SmaregiController.php:66` | RG-004,006,007,008,009 |  |
| a05-04 | カスタマイズ | 未実装疑い | 認証方式は IP制限（Excel 0505:L1658） | 乖離（IP制限 アプリ側未実装・実機確認要） | `SmaregiController.php:26` | RG-016 |  |
| a06-01 | 現行踏襲 | 移行退行疑い | 現行踏襲。応答JSON構築（memberName等）と店舗紐付けは中継先が担い、移行先はDBを ec-cube-enterprise・会員サブ dtb_member_sub 廃止で base_info | 乖離（移行先の中継先未実装・現行の会員サブ依存が移行先仕様と不整合） | `AdminLoginController.php:12` | RG-002 |  |
| a06-02 | カスタマイズ | 設計誤り疑い | 詳細設計 L389,L390「DB操作 … 検索 dtb_member / dtb_member_sub」＝検索対象テーブルを dtb_member / dtb_member_sub と記載 | 乖離（詳細設計の記述漏れ・ハルシネーション是正） | `DtbOtcBuyOrderRepository.php:56, OtcBuyOrderController.php:35` | RG-020 |  |
| a06-03 | カスタマイズ | 未実装疑い | 経理払い出し待ち(7)ステータスにした際、経理チームのメールアドレスへ件名「店頭買取振込依頼 【査定ID: XXXXX】」の振込依頼メールを送信する（Excel 0506:L1485,L1512-15 | 乖離（未実装・カスタマイズ未達） | `OtcBuyOrderController.php:58` | RG-021,022 |  |
| a06-03 | カスタマイズ | 未実装疑い | 買取成立(1)に変更された場合、個別入力商品ありなら受注ステータスを「未登録在庫あり」、なしなら「入庫待ち」に変更する（Excel 0506:L1486,L1487,L1518-1520） | 乖離（未実装・カスタマイズ未達） | `OtcBuyOrderController.php:199` | RG-023,024 |  |
| a06-03 | カスタマイズ | 未実装疑い | 端末取引ID(smaregi_transaction_id)をECCUBEに連携する（Excel 0506:L1488,L1521,L1534） | 乖離（未実装・入力項目/連携欠落） | `OtcBuyOrderEdit.php:11, OtcBuyOrderController.php:116` | RG-025 |  |
| a06-03 | カスタマイズ | 未実装疑い | 店頭買取実在庫登録時、買取価格と買取小計（買取価格×買取個数）を新たに登録する（Excel 0506:L1489,L1522-1523） | 乖離（未実装・エンティティ列欠落） | `OtcBuyOrderController.php:181, DtbOtcBuyOrderStock.php:17` | RG-011,026 |  |
| a06-03 | カスタマイズ | 未実装疑い | 登録情報に⑤-8出金コードを含む（Excel 0506:L1510） | 乖離（未実装・要実機確認） | `OtcBuyOrderController.php:199` | RG-033 |  |
| a06-04 | 現行踏襲 | 未実装疑い | 認証方式は「jwt-token ヘッダのJWT検証（HS256）」（正本 L322）。Excel は認証方式に「IP制限 トークン」を併記（Excel 0506:L1701） | 乖離（Excel記載のIP制限がアプリ未実装・要実機確認） | `OtcBuyOrderFreeCommentController.php:21, BaseController.php:24` | RG-008〜010 |  |
| a06-04 | 現行踏襲 | バグ候補 | 認証失敗（ヘッダ欠落・署名不正・会員なし）は一律 HTTP401（正本 L322,L339,L363） | 乖離（実装バグ候補・非署名系JWT例外で500／要実機確認） | `BaseController.php:31` | RG-009・§5「期限切れ/不正形式トークン」 |  |
| a06-05 | カスタマイズ | 未実装疑い | 現在ステータスが {5:査定前,6:査定中,8:査定中断,9:査定再開} のときのみ更新可能（Excel 0506:L1863） | 乖離（現在ステータス制限がpf-api未実装） | `OtcBuyOrderStatusController.php:33, UpdateStatusAction.php:88` | RG-024,TR-14 |  |
| a06-05 | カスタマイズ | 移行退行疑い | 他担当者査定中の受注への査定開始は HTTP400「この受注は「（査定担当者名）」が査定中です。」（詳細設計 L327,L340,L368） | 乖離（enterprise移行でメッセージ書式が退行・要実機確認で確定） | `OtcBuyOrderStatusController.php:68, UpdateStatusAction.php:101` | RG-006 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | ★カスタマイズ: 販売価格を取得していたところを基準価格を取得する（Excel 0506:L2276,L2285） | 乖離（現行pf-apiは基準価格カスタマイズ未実装／詳細設計HTMLも取りこぼし。移行先で是正済み） | `DtbProductRepository.php:218, MtbCardRepository.php:195` | RG-002,012 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | ★カスタマイズ: 在庫を明示的に本店ECの在庫／追加開発でログイン者の所属店舗のEC在庫を取得する（Excel 0506:L2277,L2278,L2286,L2287） | 乖離（現行pf-apiは本店/所属店舗EC在庫カスタマイズ未実装／詳細設計HTMLも取りこぼし。移行先で是正済み） | `DtbProductRepository.php:221, BuyingController.php:125, MtbCardRepository.php:170` | RG-003,012 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 0件時は空配列 `[]` を返す（詳細設計 L324,L327） | 乖離（移行先の0件レスポンス形状が設計/現行の`[]`と不一致・`{"cards":[]}`） | `HierarchicalDataTrait.php:19, BuyingController.php:82` | RG-004,005,013 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 認証の有無=有（Excel 0506:L2274）。認可方式はpf-apiの方針に従う（詳細設計 L384） | 乖離懸念（現行postに認証チェック不在／移行先は認証あり） | `ProductController.php:181, BuyingController.php:83` | RG-015 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | リクエスト書式＝クエリ（Excel 0506:L2274）。ids の位置は Excel＝クエリ（契約オラクル・Excel優先）／詳細設計 L320＝ボディ | 乖離（リクエスト書式＝ids位置のExcel=クエリ／詳細設計=ボディの競合。実装は現行がクエリ・ボディ両取り、移行先はボディ限定。契約オラクルはExcel優先で＝クエリを正とし、ボディ実挙動は補完・要実機確認に縮退） | `ProductController.php:183, BuyingController.php:70` | RG-011 |  |
| a06-08 | 現行踏襲 | 未実装疑い | name はリクエスト必須項目（Excel 0506:L2717 必須〇） | 乖離（必須制約未実装）／要実機確認 | `ProductController.php:197, DtbProductRepository.php:246` | RG-010 |  |
| a06-11 | 現行踏襲 | 移行退行疑い | 成功応答は `{ "code":200, "message":"get sections success", "sections":[ {section_id,name,code}... ] }`（E | 乖離（移行退行・API契約破壊） | `ProductController.php:486, SectionController.php:40` | RG-001,004,006,007,008 |  |
| a06-11 | 現行踏襲 | 移行退行疑い | 認証あり＝認証方式は「IP制限・トークン」（Excel 0506:L3111）。認証を通過したMTGバイヤーのみ取得可（詳細設計 L357） | 乖離（現行アプリ層で認証未強制・インフラ依存／移行で強制層が変化）／要実機確認 | `routes.yaml:239, security.yaml:10, SectionController.php:25` | RG-010 |  |
| a06-12 | 現行踏襲 | 移行退行疑い | 応答は `{ "code":200, "section_id":<部門ID> }` の2フィールドを持つ（Excel 0506:L3299,L3300／詳細設計 L326／Excelサンプル 0506 | 乖離（移行先の契約破壊・退行） | `OptionController.php:60, ProductController.php:502` | RG-001,002,004 |  |
| a06-16 | 新規実装 | 設計誤り疑い | リクエスト項目名: Excel `member_id`（0506:L3842,L3869）。詳細設計HTMLは移行先ボディを `doubleCheckMemberId` と記載（正本 L314） | 乖離（3者不一致・詳細設計ハルシネーション是正） | `OtcBuyOrderController.php:239` | RG-004,005 |  |
| a07-01 | 現行踏襲 | 設計誤り疑い | 副作用：本APIは参照のみ・データを更新しない・ロック対象を持たない（詳細設計 L344,L351,L371／Excel はレスポンスのみ記載で更新記述なし） | 乖離（詳細設計ハルシネーション・実装は参照のみ） | `OptionController.php:20, OptionController.php:36` | RG-007 |  |
| a07-01 | 現行踏襲 | 移行退行疑い | エンドポイント：Excel 0507:L948 は `/api/admin/optionBulkPurchaseId.json` | 乖離（Excelパスと現行pf-api入口の差・移行先とは一致） | `routes.yaml:10, OptionController.php:35` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 応答フィールド型：Excel 0507:L1145 netBuyOrderId／0507:L1149 netOrderStatusId は 文字列。詳細設計 L339 は integer と記す（オラ | 詳細設計のハルシネーション（Excel＝実装＝文字列。競合ルールでExcel採用） | `BuyOrderController.php:72` | RG-010,023 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | applyDate 形式：Excelサンプル 0507:L1171 は「2024/03/06 17:21:23」＝`Y/m/d H:i:s`。詳細設計 L339/L362 は ISO8601 と記す（ | 詳細設計のハルシネーション/乖離（Excel採用） | `BuyOrderController.php:73` | RG-023 |  |
| a07-02 | 現行踏襲 | 移行退行疑い | 住所連結：詳細設計 L331／現行 pf-api は「都道府県名・住所1・住所2 を半角空白連結」。現行 `pf-api:src/Repository/DtbBuyOrderRepository.ph | 乖離（移行での連結挙動差）／要実機確認 | `BuyOrderController.php:65` | RG-004 |  |
| a07-03 | 現行踏襲 | バグ候補 | 認証失敗（ヘッダ欠落・署名不正・該当する管理者会員なし）はいずれも認証拒否（HTTP 401）（詳細設計 L322,L367） | 乖離（改ざん/期限切れ/形式不正トークンが401にならないバグ候補）／要実機確認 | `BaseController.php:30` | RG-007（DA-02） |  |
| a07-04 | 現行踏襲 | 移行退行疑い | 同上（移行先での更新可否限定・新規ステータス14/15/16へは更新不可、Excel 0507:L1477,L1478） | 乖離（現行↔移行先の挙動差・要仕様確定） | `UpdateStatusAction.php:28` | RG-012,DT-10 |  |
| a07-04 | 現行踏襲 | 移行退行疑い | 保存処理中の例外は HTTP500・errors＝例外メッセージを返しロールバック（詳細設計 L340,L368） | 乖離（設計と実装の差・移行先） | `UpdateStatusAction.php:110, BuyOrderController.php:159, BuyOrderStatusController.php:96` | RG-010,RG-009 |  |
| a07-05 | 現行踏襲 | 未実装疑い | foil_flg はリクエスト値を利用せず、API内部処理で product_class_id から foil を特定する（特殊Foilは通常Foil扱い）。★カスタマイズ（Excel `0507:L | 乖離（★カスタマイズ未実装・リクエスト値直使用／厳密比較の型不一致） | `BuyOrderController.php:186` | RG-015 |  |
| a14-01 | 現行踏襲 | 未実装疑い | カード情報「固有色」が追加されるため、レスポンスデータ内に `color_identities`（`.id`／`.name_jp`／`.name_en`）を追加する（0514:L974,L981-L9 | 未実装（カスタマイズ要件未反映）／要実機確認 | `MtbCard.php:333` | RG-011 |  |
| a14-01 | 現行踏襲 | 未実装疑い | MTGマスターデータの「rank」列は「sort_no」に変更されるため、`color_sequence.rank` は `color_sequence.sort_no` に変更する（0514:L97 | 未実装（カスタマイズ要件未反映・API/DB間の列名不整合）／要実機確認 | `MtbColorSequence.php:23, MtbColorSequence.orm.yml:22, MtbColorSequence.php:52` | RG-016 |  |
| a14-01 | 現行踏襲 | 未実装疑い | カード詳細情報「Foil」の設定値が増えるため `card_details.foil_flg` を `card_details.foil` へ変更し、設定値に 2（特殊）を追加する（0514:L975 | 未実装（カスタマイズ要件未反映・値2を表現不可）／要実機確認 | `MtbCardDetail.php:94, MtbCardDetail.orm.yml:96, MtbCardDetail.php:278` | RG-012,013 |  |
| a14-01 | 現行踏襲 | 未実装疑い | カード詳細情報「プロモフラグ」は「プロモ種別」に包含されるため、レスポンスデータの `promotion_flg` を除去する（0514:L977,L992-L994,L1078） | 未実装（カスタマイズ要件未反映・除去漏れ）／要実機確認 | `MtbCardDetail.php:99, MtbCardDetail.orm.yml:103, MtbCardDetail.php:293` | RG-015 |  |
| a14-01 | 現行踏襲 | 未実装疑い | カード詳細情報「フレーム」が追加されるため `card_details.frame`（文字型）を追加する（0514:L976,L991,L1077・サンプル0514:L1206 `"frame":"U | 未実装＋乖離（カスタマイズ要件未反映・名称/型不一致）／要実機確認 | `MtbCardDetail.php:308` | RG-014 |  |
| a14-02 | 現行踏襲 | 未実装疑い | レスポンスデータ内の「foil_flg」を「foil」に変更し、設定値は 0:なし／1:あり／2:特殊 の数値(整数)とする（Excel `excel_to_html/output/0514_基本設計 | 乖離（カスタマイズ未実装・項目名/値域）／要実機確認 | `MtbCardDetail.php:94, bundles.php:15, MtbCardDetail.php:278` | RG-008,009(DV-04〜06) |  |
| a14-02 | 現行踏襲 | 未実装疑い | レスポンスデータ内に「frame」（文字型・フレーム）を追加する（Excel `:1404,1460`・サンプル `"frame":"Usually"` `:1521`） | 乖離（カスタマイズ未実装＋DB列名/型とExcel応答型の不一致・変換規則未定義）／要実機確認 | `MtbCardDetail.php:308` | RG-010 |  |
| a14-02 | 現行踏襲 | 未実装疑い | 「プロモフラグ」は「プロモ種別」に包含されるため、レスポンスデータ内の「promotion_flg」を除去する（Excel `:1405,1461`・別紙0208「カード詳細（登録・編集・削除）」の設 | 乖離（カスタマイズ未実装・除去対象項目が応答に残存）／要実機確認 | `MtbCardDetail.php:99, MtbCardDetail.php:293` | RG-011 |  |
| a15-01 | 現行踏襲 | 移行退行疑い | 「会員照合の挙動…は現行と移行先で同じだが、会員ステータスは現行が status 列、移行先が customer_status_id 列である点が異なる」（同:229-231）。移行後も本会員かつ未削 | 乖離（移行非対応・移行先DBでは現行の検索条件が成立しない）／要実機確認 | `LoginController.php:43, DtbCustomer.php:173, Customer.php:187` | RG-026,RG-009,RG-010 |  |
| a15-02 | 現行踏襲 | 移行退行疑い | `aud` は「会員ID」であり、プレイヤーの会員ID列 `customer_id` と照合する。現行は `dtb_customer.customer_id` を、移行先は `dtb_customer | 乖離（移行時のトークン互換が未確定・設計が明示的に先送り）／要実機確認 | `LoginController.php:60, AuthService.php:21, DtbPlayer.php:87` | RG-011,020 |  |
| a15-03 | 現行踏襲 | 移行退行疑い | `aud` に該当するプレイヤーなしは認証拒否（HTTP 401）（同HTML`:239`「該当するプレイヤーなしのいずれも認証拒否（HTTP 401）」／`:256` 401条件に「aud に該当す | 乖離（現行踏襲違反・認証拒否ステータスの退行）／要実機確認 | `GetUserAction.php:43, UserController.php:63, BaseController.php:76` | RG-006(DV-03),RG-010,RG-011,RG |  |
| a15-04 | 現行踏襲 | 移行退行疑い | 「デッキユーザーIDに一致するプレイヤーを1件取得する」（同HTML:244）／「検索 dtb_player 検索条件に合致するレコードを抽出する」（同:282）。論理削除済プレイヤーを取得対象に含め | 乖離（設計の確定漏れ・論理削除の扱いが未記述＝移行時に挙動が変わりうる）／要実機確認 | `doctrine.yaml:41, DtbPlayer.php:14, CustomerController.php:51` | DV-06 |  |
| a15-04 | 現行踏襲 | バグ候補 | 「現行と移行先でプレイヤーテーブルの主キー列名が異なる（現行 `player_id`・移行先 `id`）。検索キー・応答3項目の取得元列は同一」（同HTML:228,229）／「`serialize_ | 一致（バグ候補ではない・裏取りのみ） | `DtbPlayer.orm.yml:22, DtbPlayer.php:43, orm.yml:161` | RG-010,022 |  |
| a15-05 | 現行踏襲 | 移行退行疑い | `aud` に該当するプレイヤーなしは認証拒否（HTTP 401）とし `{code, message}` を返す（L237,L254）。現行も同様（`deck-api/src/Controller/ | 乖離（現行踏襲違反・認証失敗ステータスの退行）／要実機確認 | `UserController.php:122, UpdateUserAction.php:47` | RG-009,012,020（DV-11） |  |
| a15-07 | 現行踏襲 | 移行退行疑い | フォーマット不存在時の本文は コード404・メッセージ 「The format does not exist」（正本 `...a15-07_...html:257`「`{code: 404, mess | 乖離（現行踏襲違反・404メッセージ契約の退行）／要実機確認 | `ArchetypeController.php:47, messages.ja.yaml:6309` | RG-004,010 |  |
| a15-09 | 現行踏襲 | 移行退行疑い | 公開範囲はデッキリスト非公開フラグ（`private_flg`）と限定公開トークン（`display_token`）で表現する。`scope_id` 列の有無は ec-cube-enterprise  | 乖離（公開範囲のDB表現の記述不整合・移行先 NOT NULL 制約）／要実機確認 | `DtbDeck.php:129, DeckService.php:195` | RG-038, RG-003（DV-01〜03） |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 占有率の分母は「フォーマット内の全アーキタイプの件数合計」（同HTML:245）。一方 処理フローは「上位count件に絞る」→「全アーキタイプの件数合計を求め…割って算出」の順で記す（同HTML:2 | 乖離（現行踏襲違反・占有率の分母退行）＋正本の記述不整合／要実機確認・仕様確定要 | `DtbDeckRepository.php:746, MetagameController.php:49, DeckController.php:592` | RG-016 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 利用者視点の入口は `GET /metagame`（同HTML:233） | 乖離（移行先でエンドポイントパス変更・現行踏襲差）／要実機確認 | `routes.yaml:49, DeckController.php:556` | RG-001,026 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 400の本文 message は「invalid request parameter」、404の本文 message は「format not found」（同HTML:255,292,310） | 乖離（移行先でエラーメッセージ文言変更・現行踏襲違反）／要実機確認 | `MetagameController.php:29, DeckController.php:571, messages.ja.yaml:6323` | RG-017,018 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 「集計結果はフォーマットと件数上限ごとにキャッシュキーを分けて結果キャッシュする」（同HTML:245） | 乖離（移行先で結果キャッシュ消失・現行踏襲違反）／要実機確認 | `DtbDeckRepository.php:750, DtbDeckRepository.php:526` | RG-024,025 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 入力不正（400）となるのは「`format_id`が未指定（null）」の場合に限り、一致するフォーマットが無い場合は404（同HTML:249,255,292） | 乖離（400/404の分岐境界が移行先で変化・現行踏襲差）／要実機確認 | `MetagameController.php:25, DeckController.php:563, DtbDeckRepository.php:746` | RG-017,018,030 |  |
| a15-15 | 現行踏襲 | 移行退行疑い | 「デッキビルダー関連テーブルは、現行（deck-api）と移行先（ec-cube-enterprise）で同一スキーマであり、テーブル名も一致する」（`a15-15_api_deck_builder_ | 乖離（移行先に当該エンドポイント未実装・件数上限/絞り込み/論理削除条件の差）／要実機確認 | `routes.yaml:53, DtbDeckRepository.php:1062, DtbDeckRepository.php:174` | RG-001,008,009,016 |  |
| a15-16 | 現行踏襲 | 移行退行疑い | `events[].event_date` は「大会日。日時文字列（ISO8601形式）」（`function_spec_html_preview/pf-api/a15-16_api_deck_bui | 乖離（現行踏襲違反・応答日時形式の退行）／要実機確認 | `DeckController.php:653` | RG-011,012 |  |
| a15-17 | 現行踏襲 | 移行退行疑い | 解読できない行があるときはコードを206に切り替え、行番号を `errors` として返す（`function_spec_html_preview/pf-api/a15-17_api_deck_bui | 乖離（現行踏襲違反・部分成功コードの退行）／要実機確認 | `DeckController.php:727` | RG-011（DV-05） |  |
| a15-17 | 現行踏襲 | 移行退行疑い | 保存後に当該デッキのRedis上の下書きを削除し、保存済みデータと下書きの不整合を解消する（`...register.html:243,273,280`）。現行は `$this->deckServic | 乖離（現行踏襲違反・下書き整合の退行）／要実機確認 | `ImportDeckAction.php:100, DeckService.php:287` | RG-020 |  |
| a15-17 | 現行踏襲 | 移行退行疑い | `format_id`・`card_list` 等は「ボディ（フォーム値）」で受け取る（`...register.html:250`）。現行は `$request->request->all()`（` | 乖離（リクエスト本文形式の退行）／要実機確認 | `DeckController.php:688` | RG-026,027・§1 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 更新時は既存デッキ配下の旧カード（デッキカード・メイビー・アトラクション・ステッカー）を初期化したうえで作り直す（詳細設計 L244⑤・L278・L285・L290／`0515:L1960,L1994 | 乖離（重大・移行先の実装漏れ／更新のたびに明細が重複蓄積）／要実機確認 | `ImportDeckAction.php:100, DeckService.php:86, DtbDeckRepository.php:770` | RG-020,021,029 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 解読できない行があるときはコードを206に切り替え、HTTPも206とする（詳細設計 L244⑦・L258・L259／`0515:L1960,L1974,L1975`） | 乖離（重大・移行先の実装漏れ／部分成功が常に200＝呼び出し元が解読失敗を検知できない）／要実機確認 | `DeckController.php:729, DeckController.php:423` | RG-011 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 保存後に当該デッキのRedis上の下書きを削除し、保存済みデータと下書きの不整合を解消する（詳細設計 L244⑤・L278・L285／`0515:L1960,L1994,L2001`） | 乖離（重大・移行先の実装漏れ／更新後も旧下書きが残り不整合）／要実機確認 | `DeckService.php:287, DeckController.php:400` | RG-022 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | `format_id` は必須（詳細設計 L255／`0515:L1971`）。検証失敗（必須項目不足・不正値）は入力不正（HTTP 400）とし `{code, message}` を返す（L261 | 乖離（現行の実装不備・移行先で是正／設計の400が現行で満たされない）／要実機確認 | `DeckController.php:396, ImportDeckAction.php:82` | RG-017,DV-06 |  |
| a16-02 | 現行踏襲 | 移行退行疑い | 404の本文は `{code, message}` で message は "Language code is not found"（詳細設計 `:327`。Excel `:1129` はコード404 | 乖離（現行踏襲違反・404本文のキーと文言の退行）／要実機確認 | `BannerController.php:53, ContentController.php:114` | RG-009,010 |  |
| a17-03 | 現行踏襲 | バグ候補 | Excel 0517:L1817「下記の項目がなければエラー404を返す」／L1854「404 必須項目にデータがない場合」＝404 | バグ候補（要確定）: Excel基本設計は404を要求するが実装は両系とも400。実バグ（実装が仕様違反）か、Excelの誤り（実運用は400が正）かは連携元(PointGranter)期待値で要確定。詳細設計HTMLはExcelに合わせ4 | `PointGranterController.php:27, PointGranterController.php:59` |  |  |
| a17-03 | 現行踏襲 | 設計誤り疑い | 詳細設計 L312/L359「会員ポイント残高 = dtb_customer.point」 | 設計書乖離: 実際に加算されるのはプレイヤー(`dtb_player.point`)。詳細設計DBカラム表の `dtb_customer.point` は不正確。履歴の customer_id は `$Player->getCustomer | `PointGranterController.php:50, PointGranterAction.php:66, DtbPlayer.php:89` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | Excel/詳細設計は `X_contract_id`／`X_access_token`（アンダースコア表記・0517:L1818/L1819・正本 L335） | バグ候補（要検証）: 連携元(PointGranter)が送るヘッダ名と移行先の受信キーが不一致だと、必須ヘッダ欠落と誤判定し全リクエストが400/404に落ちうる。移行時の受信キー整合を要確認 | `PointGranterController.php:26, PointGranterController.php:47` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | 詳細設計 L351「値そのものの形式検証はスマレジ取引APIの判定に委ねる」（本APIは構造検証を規定せず） | バグ候補（現行）: 現行は堅牢性欠如（構造不正で異常終了しうる）。移行先は是正済み。オラクル沈黙部のため期待は要実機確認（§3 DP-05） | `PointGranterController.php:45, PointGranterController.php:82` |  |  |
| a17-03 | 現行踏襲 | 移行退行疑い | 正本 L361「承認ワークフローを介さず persist/flush で直接確定」／L375「楽観・悲観ロックは持たない」 | 参考（乖離軽微）: 移行先は加算＋履歴をトランザクションで原子化し片側更新を防止（RG-015連携整合の実装が堅牢化）。現行はflush一括で概ね同等。裏取り記録 | `PointGranterController.php:59, PointGranterAction.php:57` |  |  |
| a17-04 | 現行踏襲 | 移行退行疑い | 404 の本文の形は `{code, message}`（"Not Found"）（Excel `:2175`／詳細設計 `a17-04_api_other_product_detail.html:3 | 乖離（現行踏襲違反・404応答本文の退行）／要実機確認 | `ProductController.php:60, ExceptionListener.php:69, NotFoundException.php:21` | RG-005 |  |
| a17-04 | 現行踏襲 | 未実装疑い | 商品規格画像は `dtb_product_class_image`（`product_image_id`・並び順 rank）に対応し、画像はファイル名からURLへ変換して並べる（Excel `:214 | 乖離（設計規定の並び順rank未実装・順序不定）／要実機確認 | `DtbProductRepository.php:313, ProductRepository.php:270` | RG-017 |  |
| a17-04 | 現行踏襲 | 移行退行疑い | 在庫 `stock` は `dtb_product_class.stock`（Excel `:2148,:2230`＝移行先の列としてDBカラム節が明示） | 乖離（設計のDBカラム記述と移行先実装の不一致・拠点/ロケーション条件が設計に無い）／要実機確認 | `ProductRepository.php:278, DtbProductRepository.php:321` | RG-018 |  |
| b02-01 | カスタマイズ | 未実装疑い | スマレジの取引データも集計対象とし、店舗ごとにECCUBEとスマレジで分けて販売数を集計する（Excel★ 0404:L960／集計についてスマレジ注文データも集計対象 0404:L964） | 乖離（★カスタマイズ未実装）／要実機確認 | `AggregateSalesCommand.php:29, BatchAggregateSalesAction.php:32, DtbSalesQuantityRepository.php:446` | RG-013 |  |
| b02-02 | カスタマイズ | 未実装疑い | ★入荷通知リクエストデータに「商品ID」を追加する（Excel `0404_基本設計仕様書(バッチ_商品管理).html:1080`）。商品単位の入荷通知キャンセル判定に用いる（同:1076,1081 | 乖離（★カスタマイズ未実装・データ設計）／要実機確認 | `DtbProductRequest.php:34, DtbProductRequestRepository.php:256` | RG-008 |  |
| b02-02 | カスタマイズ | 未実装疑い | ★商品規格単位および商品単位の入荷通知キャンセル処理が行えるようにする（Excel `0404_基本設計仕様書(バッチ_商品管理).html:1076`）。商品データの商品公開ステータスが非公開・廃止 | 乖離（★カスタマイズ未実装・対象取りこぼし）／要実機確認 | `DtbProductRequestRepository.php:475` | RG-007 |  |
| b02-03 | カスタマイズ | 未実装疑い | 期間ごとに「当日・前日・3日間・1週間・1ヶ月間・90日間・180日間・365日間」を集計（Excel 0402:L1254 は当日も集計対象） | 乖離（当日集計未実装） | `DtbStockUpQuantityRepository.php:230` | RG-006,DDT DB-04 |  |
| b02-03 | カスタマイズ | 未実装疑い | エラー発生時は集計できなかった旨をメールで送信する（Excel 0402:L1270） | 乖離（メール通知未実装） | `AggregateStockUpCommand.php:49` | RG-014 |  |
| b02-03 | カスタマイズ | 移行退行疑い | 実行はコンソールのバッチコマンドで行う（詳細設計 L313 は `product:batch updateProductSummaryForStockUp` と記述） | 乖離（詳細設計の記述が移行先と不一致） | `AggregateStockUpCommand.php:34, ProductBatch.php:20` | RG-001,015 |  |
| b02-04 | 現行踏襲 | 未実装疑い | 本機能は独立したバッチとして存続し、公開かつ部門未設定の商品を確認して管理者へ通知する（Excel 0404:L1316「現行システムから変更なし(現行踏襲)」・L1318-L1322）。現行はコンソ | 乖離（単独バッチ未実装／設計内矛盾＝本機能の要否が未確定）／要実機確認 | `ProductClassRepository.php:2335, BatchAggregateSummaryAction.php:50, OtcBuyOrderAggregateSummaryCommand.php:41` | 全RG（特に RG-001,015） |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 抽出対象は「商品の公開ステータスが公開であり部門が未設定の商品データ」全件（Excel 0404:L1318・詳細設計 L321「公開中であって部門が未設定の商品規格」） | 乖離（抽出条件の退行・公開判定欠落）／要実機確認 | `DtbOtcBuyOrderRepository.php:935` | RG-002,008,016 |  |
| b02-04 | 現行踏襲 | バグ候補 | 抽出クエリは実行可能であること（Excel 0404:L1318 の有無確認が前提） | バグ候補（構文エラーで通知経路が動作しない疑い）／要実機確認 | `DtbOtcBuyOrderRepository.php:956` | RG-002,007 |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 部門の参照先は商品(規格)の部門紐付けで、移行先では `dtb_product_class.section_id`（部門マスタ `mtb_section` 参照）とする（詳細設計 L306,L337） | 乖離（部門保持先の記述差・移行時の読み替え未反映）／要実機確認 | `DtbProductSubClassRepository.php:1501, ProductClassRepository.php:2353, ProductClassRepository.php:2170` | RG-003,016 |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 通知メールの件名は「部門未設定商品通知メール」（Excel 0404:L1319） | 乖離（移行先で件名がExcelと不一致）／要実機確認 | `MailService.php:1190, MailService.php:1212, eccube.yaml:231` | RG-004 |  |
| b02-04 | 現行踏襲 | 未実装疑い | 抽出・送信時のエラーはエラーメッセージをコンソールに出力する（詳細設計 L333,L343。Excel 0404:L1327 エラーハンドリング欄は空＝沈黙） | 乖離（エラーハンドリング未実装）／要実機確認 | `CheckNoSectionProduct.php:28, ProductBatch.php:39, ProductBatchService.php:9` | RG-013 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | ★仮会員と退会済み会員は対象外（`excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1446`）。入力データは「会員情報.会員ステータス 仮会員ではない | 乖離（★カスタマイズ要件が現行に未実装／移行先はREGULAR限定で範囲差）／要実機確認 | `DtbFavoriteProductRepository.php:24, CustomerFavoriteProductRepository.php:249` | RG-005,006,007（DV-04〜06,DV-10） |  |
| b02-05 | 現行踏襲 | 移行退行疑い | お気に入りは `dtb_favorite_product`（`product_id`・`language_id`・`player_id`）、会員（選手情報）は `dtb_player`（`first_ | 乖離（詳細設計のDBカラム/集約単位記述と移行先実装の不一致）／要実機確認 | `CustomerFavoriteProductRepository.php:230, BatchFavoriteSaleNotificationAction.php:75, DtbFavoriteProductRepository.php:39` | RG-008,012,013 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 一定件数ごとに処理メモリを解放しながら集約する（詳細設計 L324,L351） | 乖離（大量件数対応の退行）／要実機確認 | `SaleNotificationService.php:54, CustomerFavoriteProductRepository.php:253, BatchFavoriteSaleNotificationAction.php:38` | RG-019 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 抽出・送信時のエラーはエラーメッセージをコンソールに出力する（詳細設計 L343,L333。`0404:1462` エラーハンドリング欄は記載なし＝Excel沈黙） | 乖離（現行のエラー出力欠落／移行先は個別失敗をログのみで継続＝失敗の可視性差）／要実機確認 | `SaleNotificationService.php:27, ProductBatchService.php:9, ProductBatch.php:56` | RG-023,024 |  |
| b02-06 | カスタマイズ | 未実装疑い | 【最重要】 Excel基本設計 B02-06 は「店舗登録時、初期在庫データ作成を行う」（`excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1553, | 乖離（Excel基本設計とその詳細設計/実装が別処理を指す・Excel記述機能の未実装疑い）／要実機確認（どちらが真のB02-06かの確定が必要） | `ProductBatch.php:12, InsertStockHistory.php:32` | RG-031〜037 |  |
| b02-06 | カスタマイズ | 移行退行疑い | 詳細設計は移行先スキーマ（`dtb_order_item`／`product_stock_id` 経由／`stock_change_type_detail_id`＋`history_source_ty | 乖離（移行先バッチ未実装・移行漏れ疑い）／要実機確認 | `InventoryReflectionCommand.php:29, DtbStockHistory.php:56` | RG-027,028,029 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 起動コマンドは `product:batch exportWeeklyStockHistoryCsv`（詳細設計 入口 L312,処理フロー L316） | 乖離（詳細設計のコマンド名が移行先実装と不一致） | `ProductBatch.php:17, UpdateWeeklyStockHistoryCommand.php:35` | RG-001,012 |  |
| b02-07 | カスタマイズ | 未実装疑い | ECCUBEとスマレジの在庫を合算して週間在庫履歴テーブルに登録する（Excel 0402:L1394,L1395） | 乖離（カスタマイズ未達・スマレジ合算未実装）／要実機確認 | `BatchUpdateWeeklyStockHistoryAction.php:41, DtbWeeklyStockHistoryTempRepository.php:69` | RG-003,018 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 各週は「当日−i週 以前で作成日が最も新しい在庫変動履歴」の在庫を採る（詳細設計 集計条件 L323／Excel 0402:L1379） | 乖離（移行先の「最新」がidベースで作成日順と乖離しうる）／要実機確認 | `DtbStockHistoryRepository.php:227, DtbWeeklyStockHistoryTempRepository.php:55` | RG-002(DW-01,02) |  |
| b05-01 | 現行踏襲 | 移行退行疑い | 詳細設計は入口コマンド `order:batch copyOrderNumber`（正本 L311,L312）。Excel はバッチ名称を「店頭受取注文商品スマレジ連携バッチ」に変更（0405:L10 | 乖離（詳細設計の入口記述が移行先実装と不一致） | `OtcOrderSmaregiPostCommand.php:25, OrderBatch.php:13` | RG-001,009 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 注文の更新時にエラーが発生した場合はロールバックを行い、当該受注のトランザクションを巻き戻す（Excel 0405:L1257／詳細設計L318,L341） | 乖離（現行バグ・移行先で是正） | `ResendMail.php:50, ResendMailAction.php:88` | RG-017,022 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 注文日時が「バッチ起動時間の5分前から1分前まで」（Excel 0405:L1223,L1246）＝起動時刻と同じ時間軸で判定 | 乖離疑義（TZ不一致・移行退行）／要実機確認 | `OrderRepository.php:1445, OrderRepository.php:1963` | RG-004(DV-07〜09) |  |
| b05-03 | カスタマイズ | バグ候補 | エラーが発生した場合、メールで管理者に通知する（Excel 0405:L1382・★カスタマイズのエラーハンドリング要件） | 乖離（バグ候補・要修正確認） | `TruncateWaitingNumber.php:29, OrderBatch.php:37, TruncateWaitingNumberCommand.php:40` | RG-009 |  |
| b05-03 | カスタマイズ | 移行退行疑い | 削除と採番カウンタ初期化を順に実行し、途中失敗しても再実行で空テーブル・カウンタ1へ収束する（詳細設計L330,L341） | 乖離（現行の過渡的不整合・移行先で是正／PG前提要確認） | `DtbWaitingNumberRepository.php:15, TruncateWaitingNumberAction.php:36` | RG-010 |  |
| b05-03 | カスタマイズ | 移行退行疑い | 実行方法は `order:batch truncateWaitingNumber`（詳細設計L311・Excel L1414） | 乖離（コマンド名・移行実装値・要実機確認） | `TruncateWaitingNumberCommand.php:25` | RG-001,007 |  |
| b05-04 | 現行踏襲 | 移行退行疑い | スマレジ連携APIはプラットフォームAPIに変更する（呼び出しを廃止予定のスマレジAPIからプラットフォームAPIへ）（Excel カスタマイズ 0405:L1481,L1508,L1511） | 乖離（Excelカスタマイズ未実装／プラットフォームAPI移行未完） | `SmaregiService.php:63` | RG-001,002,011 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 起動コマンドは `order:batch deleteSmaregiProduct`（詳細設計 L311,L315／現行踏襲） | 乖離（移行でコマンド体系変更・詳細設計コマンド名は移行先に不在） | `OrderBatch.php:17, SmaregiOtcDeleteCommand.php:39` | RG-012,013 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 抽出する注文ステータスは「キャンセル」もしくは「引き渡し済み」（0405:L1629,L1639）。※検索条件表 0405:L1644 は「出荷完了」と表記が割れる（Excel 内不整合） | 乖離（Excel内不整合＋現行/移行先で抽出ステータス集合が相違） | `DtbOrderSubRepository.php:170, OrderStatus.php:12, OrderRepository.php:966` | RG-004,005,006 / DP-03 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 連携に失敗した場合はスマレジ通信エラーメールを管理者に送信（0405:L1632,L1649） | 乖離（Excel要求のエラーメール通知が移行先で未実装） | `SmaregiService.php:53, SmaregiOtcDeleteService.php:70, SmaregiOtcDeleteMessageHandler.php:102` | RG-015,016 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | 起動コマンドは `order:batch checkDuplicatePoint`（詳細設計 入口 L314,処理フロー L318） | 乖離（詳細設計のコマンド名が移行先実装と不一致） | `OrderBatch.php:28, CheckDuplicatePointCommand.php:34` | RG-009,011 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | エラーハンドリングは特になし（外部連携も外部引数受領も無いため）（Excel 0405:L1763） | 乖離（Excel「特になし」に対し移行先はエラーハンドリング追加・現行踏襲でない） | `CheckDuplicatePoint.php:30, CheckDuplicatePointCommand.php:48` | RG-008 |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 入口コマンドは `order:batch checkNotReflectedPointUsage`／コマンド名が一致しない場合は処理を行わずに終了する（正本 L314,L315） | 乖離（コマンド名相違・移行で入口変更） | `OrderBatch.php:19, CheckNotReflectedPointUsageCommand.php:34` |  |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 抽出した注文IDをリストにして管理者へ送信（Excel 0405:L1890「注文IDのリストにして」） | 乖離（現行 pf-eccube3 の実装バグ・移行で是正） | `MailService.php:1531, MailService.php:2291` |  |  |
| b05-07 | 現行踏襲 | 設計誤り疑い | 詳細設計 L307：移行先 enterprise の抽出は `dtb_order` の `payment_id`・`payment_method`・`order_date`・`spended_poin | 乖離（詳細設計のハルシネーション・実装と不一致） | `OrderRepository.php:1934` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 開始・完了のコンソール出力（日時付き）（正本 L346） | 乖離（現行 pf-eccube3 正常系のコンソール出力未実装） | `OrderBatch.php:44, MailService.php:1525, CheckNotReflectedPointUsageCommand.php:52` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 取得・送信時のエラーはエラーメッセージをコンソールに出力する（正本 L343） | 乖離（現行 pf-eccube3 のエラーハンドリング未実装） | `CheckNotReflectedPointUsage.php:24, OrderBatch.php:51, CheckNotReflectedPointUsageCommand.php:54` |  |  |
| b05-08 | 現行踏襲 | 移行退行疑い | スマレジ連携APIについて、呼び出しを廃止予定のスマレジAPIからプラットフォームAPIに変更（Excel 0405:L1990 カスタマイズ★） | 乖離（移行時カスタマイズ要件・現行未実装） | `—` | RG-007,008 |  |
| b05-09 | 現行踏襲 | 未実装疑い | キャンセルの場合は対象の受注データをキャンセルにする（Excel 0405:L2122・L2121） | 乖離（未実装・受注キャンセル欠落） | `CheckSmaregiTransaction.php:166` | RG-010 |  |
| b05-09 | 現行踏襲 | 未実装疑い | 手動でのバッチ実行時に期間指定があればその期間内の取引データを取得する（Excel 0405:L2109,L2115） | 乖離（未実装・手動期間指定不可） | `CheckSmaregiTransaction.php:136, config.yml:283` | RG-004 |  |
| b06-02 | カスタマイズ | 移行退行疑い | 集計対象ステータス＝「買取成立」「入庫済み」「未登録在庫あり」「入庫待ち」（Excel 0406:L1110 ★カスタマイズ／L1106「新しく追加された買取ステータスを買取集計対象にする」） | 乖離（pf-eccube3 現行はカスタマイズ未達／移行先 enterprise で是正済み・詳細設計HTMLの記述も旧ステータスで陳腐化） | `DtbOtcBuyOrderRepository.php:338, MtbOtcBuyOrderStatus.php:66, DtbOtcBuyOrderRepository.php:830` | RG-014, DS-01〜06 |  |
| b06-02 | カスタマイズ | 移行退行疑い | 部門未設定商品の通知は「集計対象（＝対象ステータス限定）の店頭買取の中の部門未設定商品」を対象とする（詳細設計 L319 step6,L326 ステータス条件,L355 送信条件「集計対象に部門未設定 | 乖離（実装バグ・通知対象がステータス無条件で集計対象と不整合・移行先も未修正）／要実機確認 | `DtbOtcBuyOrderRepository.php:370, DtbOtcBuyOrderRepository.php:957` | RG-009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 失効履歴の「有効期限＝本日+183日」（Excel L1225）。本コードベースの有効期限は issue_date + customer_point_expire(183)日で派生（`pf-eccub | 乖離（enterpriseで退行・要実機確認） | `LostPoints.php:56, LostPointsAction.php:78` | RG-007 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | スマレジ連携が成功した会員のみ保有ポイントを更新する（連携成功を更新の前提とする＝Excel L1219→L1220 の順序／詳細設計L336） | 乖離（enterpriseで外部連携整合退行・要実機確認） | `LostPoints.php:45, LostPointsAction.php:68` | RG-006,009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 起動コマンドは `customer:batch lostPoint`（詳細設計L312） | 乖離（コマンド名の移行差異・要実機確認） | `CustomerBatch.php:14, LostPointsCommand.php:25` | RG-011,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 実行コマンドは `customer:batch pointExpireNotification`（詳細設計 L313,L317。挙動参照=現行 L305） | 乖離（移行でコマンド名改称・設計/現行と不一致）／要実機確認 | `CustomerBatch.php:16, PointExpireNotificationCommand.php:25` | RG-001,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 開始・完了はコンソールに日時付きで出力（詳細設計 L347） | 乖離（移行先の開始/完了ログに日時なし） | `...CustomerBatch.php:50, ...PointExpireNotificationCommand.php:38` | RG-013 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 実行コマンドは `customer:batch checkBlankRequiredItemCustomer`（詳細設計 L313,L317。挙動参照=現行 L293） | 乖離（移行でコマンド名改称・設計/現行と不一致）／要実機確認 | `CustomerBatch.php:17, CheckBlankRequiredItemCustomerCommand.php:25` | RG-001,007 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 空文字・NULL・未設定値を不備候補として扱う（詳細設計 L324） | 乖離（現行pfが空文字未検出・移行先は検出） | `CustomerRepository.php:143, CustomerRepository.php:658` | RG-003(DB-02) |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 会員テーブルは現行・移行先とも `dtb_customer` で同一スキーマ、空欄判定対象の各列の名称差は確認されない（詳細設計 L306,L307） | 乖離（必須列集合/郵便番号判定が現行と移行先で不一致・現行はzip部分空欄を見逃す） | `...CustomerRepository.php:155, ...CustomerRepository.php:678` | RG-003,006,015 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 取得・送信時のエラーは「エラーメッセージをコンソールに出力する」（詳細設計 L332,L342） | 乖離（移行先の送信エラーがコンソール非出力・握り潰し） | `MailService.php:1305, CheckBlankRequiredItemCustomerCommand.php:40, ...MailService.php:1474` | RG-008 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 開始・完了はコンソールに日時付きで出力（詳細設計 L345） | 乖離（移行先の開始/完了ログに日時なし） | `...CustomerBatch.php:50, ...CheckBlankRequiredItemCustomerCommand.php:38` | RG-009 |  |
| b08-05 | 現行踏襲 | 設計誤り疑い | 補正は保有ポイント（`dtb_player.point`）を履歴合計へ上書き（Excel 0408:L1586,L1607） | 乖離（詳細設計HTMLのハルシネーション：dtb_point_history更新なし） | `AdjustPointVariance.php:35, AdjustPointVarianceAction.php:54, AdjustPointVariance.php:14` | RG-016 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 起動コマンドは現行踏襲＝`customer:batch adjustPointVariance`（詳細設計 L313） | 乖離（移行での起動コマンド不一致） | `CustomerBatch.php:26, AdjustPointVarianceCommand.php:25` | RG-012,013 |  |
| b08-05 | 現行踏襲 | 未実装疑い | 取得・送信時のエラーはエラーメッセージをコンソールに出力（詳細設計 L343）。Excel 0408:L1621-1622 は「エラーハンドリング 該当処理なし」 | 乖離（現行pfはエラーハンドリング未実装／設計三者で不一致） | `AdjustPointVarianceAction.php:67, AdjustPointVarianceCommand.php:42, AdjustPointVariance.php:30` | RG-014 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 通知メール宛先は mtb_option の設定値（Excel 0408:L1615,L1616・カンマ区切りで複数指定しうる） | 乖離（複数宛先の分割挙動が移行で退行）／要実機確認 | `MailService.php:1594, MailService.php:1355` | RG-005 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 実行コマンドは `smaregi:batch updatePoint <受注ID>`（正本 L312,L316／現行踏襲） | 乖離（移行先のコマンド名が設計と不一致） | `SmaregiUpdatePointCommand.php:26, SmaregiBatch.php:15` | RG-013,RG-014 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 連携量＝受注の消費ポイントを負の値で送信（Excel `0408:L1732`／正本 L320）。消費ポイント0のスキップは未規定 | 乖離（現行↔移行先の挙動差・要仕様確定） | `SmaregiUpdatePointAction.php:39, UpdatePoint.php:40` | RG-002,DV-04 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 受注IDが未指定または数値でない場合は「処理を終了する」（同列扱い・正常系の終了）（正本 L313,L317／Excel `0408:L1755`,`0408:L1756`） | 乖離（非数値時の終了ステータスが現行↔移行先で相違・軽微） | `UpdatePoint.php:32, SmaregiBatch.php:52, SmaregiUpdatePointCommand.php:53` | RG-006 |  |
| b17-01 | 現行踏襲 | バグ候補 | 取得失敗時はエラー内容をコンソールに出力する（L251）。データ整合性上、jsonファイルは実行時点の最新20件で上書きされフロント表示が参照する（L248）＝有効な記事内容を保つべき。取得失敗後の書 | 乖離（実装バグ候補・失敗時の破壊的上書き）／要実機確認 | `CreateLatestArticleList.php:36, AbstractListText.php:30` | RG-007 |  |
| b17-01 | 現行踏襲 | 移行退行疑い | 同上（取得失敗時の扱い・L251/L248） | 乖離（移行での挙動変更・現行踏襲からの差） | `CreateLatestArticleListAction.php:38, CreateLatestArticleListCommand.php:48` | RG-007,011 |  |
| b17-01 | 現行踏襲 | バグ候補 | 取得失敗（記事が取得できない状態）はエラーとして扱われるべき（L251）。HTTP異常応答も「取得失敗」に含みうる | 乖離（実装バグ候補・HTTP異常未検知）／要実機確認 | `CreateLatestArticleList.php:36` | RG-007 |  |
| f02-02 | カスタマイズ | 未実装疑い | Excel カスタマイズ要件4件を SPナビに備える: (11)カードセット選択メニュー（商品検索テキストボックスの左・単一選択・選択肢=カードセット管理登録分／`0302:L1830,L1831,L | 未実装（Excelカスタマイズ要件の実装差分）／新規実装が必要 | `base_sp_navigator.twig:5, base_sp_navigator_unisuggest.twig:5, ec_sp_navigator.twig:1` | RG-005,007〜014,018〜033 |  |
| f02-03 | カスタマイズ | 未実装疑い | (10-3)フォーマットは以下1〜6をメニュー表示する: 1 スタンダード／2 パイオニア／3 モダン／4 レガシー／5 統率者／6 その他（Excel 0302:L2658,L2674・カスタマイズ | 乖離（(10-3)フォーマットメニューの6番目「その他」が未実装）／要実機確認 | `CategoryListBlockPayloadBuilder.php:81, category_nav_pc.twig:85, category_nav_pc.twig:105` | RG-036 |  |
| f03-01 | カスタマイズ | 移行退行疑い | 抽出件数が0件の場合は、本文を組み立てたうえで応答ステータスを404として返す（詳細設計 `:339`／`:352`／`:380`。Excelは0件時の画面表示のみ規定＝`0303:L1356-135 | 乖離（0件時応答ステータスの退行・経路差）／要実機確認 | `ProductController.php:140, ProductController.php:112` | RG-008,010 |  |
| f03-02 | カスタマイズ | 移行退行疑い | 閲覧履歴Cookieの上限は先頭から最大18件に切り詰める（詳細設計 `function_spec_html_preview/pf-eccube3/f03-02_front_product_produ | 乖離（履歴上限の退行 18→15・未使用定数との二重管理）／要実機確認 | `product_detail_js.twig:419, ProductController.php:91` | RG-075(DV-13),RG-074 |  |
| f03-02 | カスタマイズ | 未実装疑い | 旧商品コードから商品詳細へ転送する入口 `GET /{_locale}/forward/{oldCode}` を持ち、対応がなければトップへ転送する（詳細設計 `:321`「旧商品コードから開く GE | 乖離（旧コード転送の未実装・入口欠落）／要実機確認 | `MtbProductCodeMapping.php:23, MtbProductCodeMappingRepository.php:25` | RG-003,004,005 |  |
| f03-03 | カスタマイズ | 移行退行疑い | カードセットは新しいカテゴリ構造と重複するため削除とする（Excel 0303:L2365・入力項目一覧の識別ID3も「新しいカテゴリと重複するため削除とする」0303:L2375）。刷新後の検索条件 | 乖離（Excel廃止要件の未反映・刷新後に実装不要な項目が移行先に存在）／要実機確認 | `SearchType.php:116, SearchType.php:72` | §0（廃止・生成せず） |  |
| f03-03 | カスタマイズ | 未実装疑い | 検索条件にFoil「通常」「Foil」「特殊」を追加する（Excel 0303:L2338・識別ID15「※カスタマイズ対応、検索条件にFoil『特殊』を追加する」0303:L2387）＝3択 | 現行のみ未実装（カスタマイズ新規＝想定内）／移行先はExcel充足。要実機確認は「特殊」の絞り込み結果 | `SearchType.php:171, config.yml:72, SearchType.php:220` | RG-016・DV-14 |  |
| f03-03 | カスタマイズ | 未実装疑い | 検索条件にフレームの「通常」「特殊」を追加する（Excel 0303:L2339・識別ID16「※カスタマイズ対応、項目を新規追加 ・選択肢: 通常 特殊」0303:L2388） | 現行のみ未実装（カスタマイズ新規＝想定内）／移行先はExcel充足。クエリ名 `frameFlg` は設計書に記載が無く要実機確認 | `SearchType.php:231` | RG-017・DV-15 |  |
| f03-03 | カスタマイズ | 移行退行疑い | SEO対策として、タグやカテゴリの検索条件は「/tag/category」のようにURLのパスに含め、それ以外は「?key=value」のGETパラメータとして扱う（Excel 0303:L2341- | 乖離（現行未実装＝想定内／移行先はパス順・書式がExcel例示と不一致）／要実機確認 | `FrontControllerProvider.php:48, ProductController.php:126, ProductController.php:141` | RG-009,010 |  |
| f03-05 | 現行踏襲 | 移行退行疑い | マイページにおすすめ商品を表示する（Excel 0303:L2818,L2819「下記の機能で表示する 1 マイページ」／詳細設計 L322「マイページ表示時のおすすめブロック…会員の最新注文商品を基 | 乖離（Excel明示の表示ページ欠落・退行）／要実機確認 | `index.twig:21, MypageController.php:126, index.twig:15` | RG-001,RG-002 |  |
| f03-05 | 現行踏襲 | 移行退行疑い | 表示件数は10件とする（Excel 0303:L2838）。抽出条件（公開・言語・在庫・同一カード等）を満たす商品が10件以上あれば10件表示される | 乖離（表示件数の目減り・退行）／要実機確認 | `OrderItemRepository.php:119, RecommendService.php:52, ProductRepository.php:697` | RG-016 |  |
| f03-06 | カスタマイズ | 未実装疑い | 最大15件をスライダーなしで表示する（表示順は最近見た順＝新しい順）（Excel `0303:L3015`） | 乖離（Excelカスタマイズ要件の表示上限15件が未実装・16〜18件目が表示されうる）／要実機確認 | `HistoryController.php:16, ProductController.php:27, HistoryController.php:22` | RG-003(DV-05,06),RG-004 |  |
| f03-06 | カスタマイズ | 未実装疑い | 「M03-02商品登録/編集」機能の商品公開ステータスに応じて、商品を表示、または非表示にする（支店商品の公開と非公開の制御）（Excel `0303:L3005-L3006`） | 乖離（Excelカスタマイズ要件の公開/非公開制御が未実装・非公開商品の露出）／要実機確認 | `ProductRepository.php:500` | RG-005 |  |
| f03-06 | カスタマイズ | 未実装疑い | 本店、各支店でチェックした商品を1つのCookieで管理し、支店側で表示した場合は支店表示フラグが立っているもののみ表示する（Excel `0303:L3013`・★カスタマイズ項目） | 乖離（Excelカスタマイズ要件★の支店表示フラグ制御が未実装）／要実機確認 | `ProductRepository.php:520, HistoryController.php:12, ProductController.php:453` | RG-006,RG-007 |  |
| f03-06 | カスタマイズ | 未実装疑い | 画面項目はセールアイコン（セールフラグが立っている商品に表示）・商品画像拡大（SP版のみ）・カード言語（カード商品のみ言語コード表示）・商品名（リンク・押下で商品詳細へ遷移／範囲外は…）を持ち、本店フ | 乖離（Excel画面項目4件が未実装・商品一覧と同じ体裁になっていない）／要実機確認 | `history.twig:1, ProductRepository.php:502, history.twig:8` | RG-009,RG-012,RG-013,RG-014,RG |  |
| f03-06 | カスタマイズ | 移行退行疑い | 見出しの表示文言（日本語）は「最近見た商品」（詳細設計 `function_spec_html_preview/pf-eccube3/f03-06_front_product_product_rece | 乖離（詳細設計の日本語見出し文言と実装の差・移行時の文言確定要）／要実機確認 | `message.ja.yml:328, message.en.yml:312` | RG-020 |  |
| f03-08 | 現行踏襲 | 移行退行疑い | 未ログイン（選手情報が無い）状態での解除は不正要求（HTTP400）とし、画面文言は返さない（詳細設計 `function_spec_html_preview/pf-eccube3/f03-08_fr | 乖離（現行踏襲違反・解除の未ログイン扱いの退行）／要実機確認 | `ProductController.php:861` | RG-010,014 |  |
| f04-01 | カスタマイズ | 未実装疑い | カート内の商品数を変更する際、画面を再読み込みせずにカート内商品の合計金額を自動で再計算する（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1011 | 乖離（★カスタマイズ未実装・画面再読み込みが残存）／要実機確認 | `index.twig:17, CartController.php:115` | RG-014,015 |  |
| f04-01 | カスタマイズ | 未実装疑い | 在庫数を超える商品数を入力できないようにする。カートに遷移した時点での在庫数で+ボタン・数量入力を制御する（`0304:1013,1091,1092`） | 乖離（★カスタマイズ未実装・入力制御なし／送信後クランプ）／要実機確認 | `index.twig:41, CartService.php:656` | RG-016,017,022(DV-02,03) |  |
| f04-01 | カスタマイズ | 未実装疑い | 購入上限数を超える商品数を入力できないようにする。カートに遷移した時点での購入上限数で+ボタン・数量入力を制御する（`0304:1014,1094,1095`） | 乖離（★カスタマイズ未実装・入力制御なし／送信後クランプ）／要実機確認 | `index.twig:41, CartService.php:679` | RG-018,019,022(DV-04,05) |  |
| f04-01 | カスタマイズ | 未実装疑い | 商品点数は0以下を入力できないようにする（`0304:1015,1097`）＝0以下はそもそも入力・送信させない | 乖離（★カスタマイズ未実装・0以下入力で削除が発生）／要実機確認 | `CartController.php:268` | RG-020,022(DV-06,07) |  |
| f04-01 | カスタマイズ | 未実装疑い | ユーザの閲覧店舗に応じて店舗別に異なるカート情報が表示される。店舗ごとに商品を保持するため、URLを変更してもカートの中身は引き継がない。削除・一括削除の対象は閲覧店舗に紐づいている商品のみ（`030 | 乖離（★カスタマイズ未実装・店舗別カート機構なし）／要実機確認 | `—` | RG-002,003,024,028 |  |
| f04-01 | カスタマイズ | 未実装疑い | カート一括削除で削除する商品は閲覧店舗に紐づいている商品のみとする（`0304:1113`）／削除ボタンも同様（`0304:1105`） | 乖離（★カスタマイズ未実装・削除範囲が閲覧店舗に限定されない）／要実機確認 | `CartController.php:202, CartService.php:156` | RG-024,028 |  |
| f04-02 | カスタマイズ | 未実装疑い | HTMLフリーエリアを追加し、管理画面>コンテンツ管理>ブロック管理から文章の設定ができるようにする（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html: | 乖離（★カスタマイズ要件の未実装疑い）／要実機確認（レイアウト管理側でブロック配置される可能性を実機で確認する） | `ColumnDefinitions.php:422` | RG-060 |  |
| f04-03 | カスタマイズ | 移行退行疑い | 海外住所3カラム目（住所3）を、国が日本以外のとき編集画面・確認画面に表示し（0304:L2057,L2063,L2108,L2310,L2327）、注文登録時に配送先情報として登録する（0304:L | 乖離（詳細設計HTMLの記述漏れ＝Excelカスタマイズ要件の未反映。実装は移行先で充足・現行は未対応で想定内）／要実機確認（enterprise 確認画面の addr03 表示が `if addr03` のデータ有無条件であり、Excel | `AddressType.php:48, shipping_edit.twig:280, delivery_confirm.twig:114` | RG-006,029,036 |  |
| f04-04 | 現行踏襲 | 未実装疑い | ★店内アカウントの場合、画面表示から1分後に注文した店舗のTOP画面へ自動遷移（Excel 0304:L2566） | 乖離（pf未実装・遅延秒 要実機確認・詳細設計記述漏れ） | `complete.twig:1, complete.twig:16, ShoppingController.php:680` | RG-026 |  |
| f04-04 | 現行踏襲 | 未実装疑い | ★フリースペースを追加し、ブロック管理から文章設定できるようにする（Excel 0304:L2564,L2565,L2577） | 乖離（pf未実装・enterpriseで充足・詳細設計記述漏れ） | `complete.twig:18, complete.twig:130` | RG-027 |  |
| f05-01 | カスタマイズ | 未実装疑い | 強化買取商品コーナー＝「強化買取」タグ商品をカテゴリごと・公開/NM/1円以上/優先順/最大60件で表示（Excel 0305:L1020,L1096-1105） | 乖離（強化買取コーナー 未実装懸念・要実機確認） | `PurchaseController.php:58, PurchaseController.php:368` | RG-010 |  |
| f05-01 | カスタマイズ | 設計誤り疑い | 詳細設計HTML「DB操作」節（正本 L357-358）＝『登録/更新 dtb_card_cardtag/dtb_cardtag/dtb_product_class/dtb_product_sub_c | 乖離（詳細設計ハルシネーション・是正済） | `PurchaseController.php:58, PurchaseController.php:368` | RG-022,024 |  |
| f05-01 | カスタマイズ | 設計誤り疑い | 目玉買取商品の抽出キーは「目玉買取商品(ID:5)」タグ（Excel 0305:L1301） | 乖離（詳細設計 用語ハルシネーション・機能差なし） | `Tag.php:14, Tag.php:59` | RG-001 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 固有色・フレームでの検索を追加する（フレームは新規項目・通常/特殊）（Excel 0305:L1564,L1590） | 乖離（現行カスタマイズ未達・移行先で対応） | `ProductSearchTrait.php:96, FrontProductSearchRequestQueryNormalizer.php:51` | RG-027 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 検索フォームはモーダル表示、モーダル外押下で閉じる（Excel 0305:L1556,L1557） | 乖離（現行カスタマイズ未達・移行先で対応） | `PurchaseController.php:489, PurchaseController.php:425` | RG-001,002,003 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 検索はユニサーチで行う（Excel 0305:L1552,L1566） | 乖離（現行カスタマイズ未達・移行先で対応） | `ProductSearchTrait.php:36, PurchaseController.php:523, PurchaseController.php:48` | RG-007 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 全件検索相当は空の結果として扱う／0件時の文言はF05-03を正とする（詳細設計 L384,L343） | 乖離（現行の0件404・移行先で解消）／要実機確認 | `PurchaseController.php:542, PurchaseController.php:404` | RG-029,030 |  |
| f05-04 | カスタマイズ | 未実装疑い | SNSシェアボタン(X/LINE)（Excel 0305:L2308,L2318-2320）・査定例モーダル（L2340）・週間販売数（L2333）・パンくずリストSP限定（L2244）・カテゴリ一覧 | 乖離(詳細設計stale＋pf-eccube3現行未実装・enterprise実装済) | `PurchaseController.php:985` | RG-025,026,027,028,029,030 |  |
| f05-05 | カスタマイズ | 未実装疑い | 数量変更（数量入力・＋ボタン・−ボタン・削除）を操作した場合、画面を再読み込みせずに商品ごとの合計金額・小計を動的に再計算する。再計算ボタンは不要なので削除する（Excel 0305:L2657-26 | 乖離（カスタマイズ未実装） | `cart.twig:82, PurchaseController.php:619, cart.twig:57` | RG-006,020,024 |  |
| f05-05 | カスタマイズ | 未実装疑い | 同一商品の数量上限は20点（詳細設計は20点と明記するが、移行先 enterprise の設定値は要確認・L325） | 要確認（移行先未実装） | `ProductClass.php:12` | RG-010,019 |  |
| f05-06 | カスタマイズ | 未実装疑い | ★ ご注文主-住所に住所３（addr03）を追加表示する（Excel 0305:L2930,L2976） | 乖離（カスタマイズ未実装） | `confirm.twig:81, Customer.php:1029` | RG-034 |  |
| f05-06 | カスタマイズ | 未実装疑い | ★ 完了画面の識別子名称を「オーダーID」から「買取番号」へ変更する（Excel 0305:L3208,L3221） | 乖離（カスタマイズ未実装） | `complete.twig:42, complete.twig:43` | RG-024,026 |  |
| f05-06 | カスタマイズ | 未実装疑い | ★ サイト全体で共通の利用規約にまとめ、買取に該当する箇所を表示する（Excel 0305:L2925,L2926,L2995） | 乖離（カスタマイズ未実装） | `confirm.twig:259` | RG-033 |  |
| f06-01 | カスタマイズ | 移行退行疑い | 海外住所表示時に海外住所用3カラム目（住所3）を表示し会員情報に登録する（Excel カスタマイズ要件 0306:L1103,L1104,L1171） | 乖離（カスタマイズ未達・移行時対応要）／要実機確認 | `EntryController.php:117` | RG-026 |  |
| f06-02 | 現行踏襲 | 未実装疑い | 本会員化成功かつ商品検索の戻り先ありは、セッションの戻り先URLを取得・消去し直前の商品検索画面へリダイレクトする（詳細設計 L378,L380,L392「商品検索の戻り先があれば取得・消去しそこへリ | 乖離（戻り先遷移 未実装）／要実機確認 | `EntryController.php:234, EntryController.php:264` | RG-015 |  |
| f06-03 | カスタマイズ | 未実装疑い | ECCUBE4系ポリシー（半角英数記号12〜50文字・ID同一不可）に合わないパスワードでログイン成功時、セッションに非準拠フラグを立て専用パスワード設定画面へ強制遷移、変更でフラグを下す（Excel | 乖離（Excel★カスタマイズ未実装）／要実機確認（enterprise側での実装有無） | `FrontLoginSuccessHandler.php:21` | RG-018 |  |
| f06-03 | カスタマイズ | 未実装疑い | パンくずリスト（※カスタマイズ対応・新規追加）＝現在表示中ページは押下不可・ホームアイコン押下で本店ECTOP画面へ遷移（Excel 0306:L2081 が正・★カスタマイズ） | 乖離（新規追加カスタマイズ未実装）／要実機確認 | `—` | RG-019 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 再購入は `POST /{_locale}/mypage/shopping_history/repurchase`、注文ID(`id`)を受け取り、無ければ404・他会員注文で404、明細の商品/数量 | 乖離（移行で再購入APIが退行・非JSON化） | `ShoppingController.php:124, FrontControllerProvider.php:249, MypageController.php:196` | RG-028,029,030 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 注文番号リンク→購入履歴詳細は `GET /{_locale}/mypage/shopping_history/detail/{id}`（正本 L321,L366／pf-eccube3現行 `Fron | 乖離（詳細遷移ルート形の移行差）／要実機確認 | `MypageController.php:482` | RG-020,031 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 領収書発行は `GET /{_locale}/mypage/shopping_history/printOrderReceipt/{id}`（正本 L321,L366／pf-eccube3現行 `Fr | 乖離（領収書ルート形の移行差）／要実機確認 | `MypageController.php:523` | RG-032 |  |
| f06-06 | カスタマイズ | 移行退行疑い | ページ送りは `?page={n}`（正本 L321,L366） | 乖離（ページングクエリ名の移行差）／要実機確認 | `ShoppingHistoryType.php:57, MypageController.php:454` | RG-003,025 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 獲得ポイントに「※獲得ポイントは商品出荷時に有効になります。」の注記を表示（詳細設計 L329・現行踏襲） | 乖離（注記の退行・未表示） | `messages.ja.yaml:1436` | RG-025 |  |
| f06-07 | カスタマイズ | 未実装疑い | 商品金額合計はEC/店頭受取→スマレジ/スマレジで表示、店頭受取(②)では非表示（Excel 0304:L3162＝DD-11 の ◯×◯◯） | 乖離（店頭受取の非表示未実装）／要実機確認 | `shopping_history_detail.twig:176` | RG-017 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 入口URLは `GET /{_locale}/mypage/shopping_history/detail/{id}`・領収書は `/{_locale}/mypage/shopping_history | 乖離（ルートパス命名変更・移行仕様の要確認） | `MypageController.php:482` | RG-003,013,029,030 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 再購入導線は `POST /{_locale}/mypage/shopping_history/repurchase`（詳細設計 L334／pf現行 `pf-eccube3:...FrontContr | 乖離（詳細設計記載ルートの移行先非存在／ボタン削除自体はExcel整合） | `...MypageController.php:195` | RG-014 |  |
| f06-08 | カスタマイズ | 設計誤り疑い | 入荷待ち商品一覧の画面上に (10)入荷通知/解除・(11)まとめて入荷通知の登録/解除操作を持つ（Excel 0306:L3059,L3060,L3078,L3079／カスタマイズ要件 L3049  | 乖離（詳細設計のハルシネーション。Excelと実装が一致・詳細設計が過小記述） | `NotifylistController.php:105, notifylist.twig:88` | RG-012〜015 |  |
| f06-08 | カスタマイズ | 設計誤り疑い | 入荷通知の設定/解除時に確認ポップアップを表示する（Excel 0306:L3078） | 乖離（詳細設計のハルシネーション） | `notifylist.twig:16, NotifylistController.php:106` | RG-018 |  |
| f06-09 | カスタマイズ | 設計誤り疑い | 表示順の先頭選択肢＝色順（Excel 0306:L3336「色順 価格(高い順) 価格(低い順)」・既定） | 乖離（詳細設計ハルシネーション是正・Excelと実装が一致） | `DtbProductSubClassRepository.php:1633, DtbFavoriteProductRepository.php:131` | RG-007,024（DQ-sortColor/sortX） |  |
| f06-10 | カスタマイズ | 未実装疑い | 件数表示は「（開始）~（終了）件 ／ （総件数）件あります」（Excel `0306:L3590,L3591` 識別ID7表示範囲/ID8件数／正本 L348） | 乖離（表示範囲 未実装） | `point_history.twig:62, messages.ja.yaml:826` | RG-014 |  |
| f06-11 | カスタマイズ | 移行退行疑い | 表示件数プルダウンの選択肢は10/50/100/300/500/1000/2000/10000/12000件・初期10件（Excel 0305:L3473） | 現行は乖離（選択肢不一致）／移行先はseed依存で要確認 | `purchase_history.twig:30, PurchaseHistoryController.php:75` | RG-022,029(DP-04) |  |
| f06-12 | カスタマイズ | 未実装疑い | 削除済み商品・規格も表示するため、詳細表示の間だけ商品・商品規格の論理削除フィルタを外す（詳細設計 L332,L347,L350。現行 pf は `setExcludes(['Eccube\\Enti | 乖離（未実装懸念・要実機確認） | `PurchaseController.php:69` | RG-024 |  |
| f06-13 | 現行踏襲 | 移行退行疑い | マイナンバーカード(id=8)は他種別と撮影画像の構成が異なり計3部（ウラ不要）（詳細設計 L352／Excel 6種にマイナンバー含む） | 乖離（実装バグ・型不一致・移行退行） | `IdentificationController.php:109, IdentificationImageType.php:62, IdentificationController.php:147` | RG-022 |  |
| f06-14 | カスタマイズ | 設計誤り疑い | 一覧の入口URLは `GET /{_locale}/mypage/events`（詳細設計 L322,L330） | 乖離（詳細設計ハルシネーション・要実機確認） | `EventHistoryController.php:44` | RG-005,017 |  |
| f06-16 | カスタマイズ | 未実装疑い | 大会名はフォーマット併記で表示する（大会名()内にフォーマットを表示）（Excel 0306:L4457／詳細設計 L332「イベント名（フォーマット併記）」） | 乖離（フォーマット併記未実装）／要実機確認 | `deck_entry_edit.twig:165` | RG-001 |  |
| f06-17 | カスタマイズ | 未実装疑い | 更新時にカードリスト解析でエラーコードが返る場合、デッキは保存せず入力をセッションに保持してデッキ編集画面へリダイレクトする（L335,L350,L382,L391／Excel 0306:L4889） | 乖離（書式エラー→編集画面復帰が未実装／要実機確認） | `DeckEntryController.php:137, DeckEntryAction.php:37, DeckentryController.php:177` | RG-007,019 |  |
| f06-18 | カスタマイズ | 移行退行疑い | スマレジ連携失敗時は更新を確定せずエラーを表示して再描画する＝失敗が更新確定の妨げになる（詳細設計L357「失敗時はDBを変更しない」・L360「成功時のみ更新を確定」・L383。移行節は「現行挙動を | 乖離（enterprise退行・現行オラクルとの挙動差） | `ChangeController.php:161, ChangeController.php:168` | RG-017 |  |
| f06-19 | 標準 | バグ候補 | 判定順序 row5「フォーム検証が成功し、トークンが空→カード登録を行わずカード編集画面へ戻る」（L347／L367）。成功フラッシュ「カード情報を更新しました」は登録・差し替え・削除が成功したときの | 乖離（バグ候補） | `CardType.php:219, MypageController.php:90, MypageController.php:80` | RG-016 |  |
| f06-19 | 標準 | バグ候補 | 生月日は「送信後チェックで月日の妥当性を確認する」「不正なら『生月日を正しく入力ください。』」（L385／L354） | 乖離（バグ候補）／要実機確認 | `CardType.php:275` | RG-016(DV-07) |  |
| f06-19 | 標準 | バグ候補 | 登録済みカードは「末尾4桁以外を伏字にしたマスク表示のみを出す。原番号は画面に出さない」（L336／L352／L367） | 乖離（バグ候補）／要実機確認（応答仕様） | `sln_edit_card.twig:473, Util.php:327, MypageController.php:122` | RG-006 |  |
| f06-20 | カスタマイズ | 移行退行疑い | 新規登録で配送先数が上限(deliv_addr_max=20)以上のとき、「お届け先登録数の上限を超えています。」を一覧画面上部のエラー枠に積んで配送先一覧へリダイレクトする（詳細設計 L341,L3 | 乖離（メッセージ非表示／enterpriseは404退行） | `DeliveryController.php:46, DeliveryController.php:86` | RG-006 |  |
| f06-20 | カスタマイズ | 未実装疑い | 確認画面で登録を押下時、ブラックリストに配送先氏名・住所・電話番号のいずれかが登録されていれば会員情報登録エラー画面へ遷移する（Excel 0306:L5767-5771・別紙0207会員管理機能） | 乖離（カスタマイズ未実装）／要実機確認 | `DeliveryController.php:77, DeliveryController.php:171` | RG-023 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 退会成立時に選手情報（dtb_player）を削除し、会員論理削除と同一トランザクションで確定する（詳細設計L342,L364,L375。移行後の削除方式は要確認と明記） | 乖離（移行先で選手情報削除が欠落・退行） | `WithdrawController.php:88, WithdrawController.php:90` | RG-006,027 |  |
| f06-22 | カスタマイズ | 移行退行疑い | メール送信と保存は独立で「送信の成否は画面表示に反映しない」、送信・保存後は完了画面へリダイレクトする（詳細設計 L361,L365,L353,L340・データ整合性 L360） | 乖離（実装挙動・退行/設計不一致）／要実機確認 | `ContactCreateAction.php:39, ContactController.php:167, ContactController.php:87` | RG-018,013 |  |
| f06-22 | カスタマイズ | 移行退行疑い | お問い合わせ詳細(sub_subject_id)は任意で、店舗・イベント関連の件名でのみ選択する（未選択がありうる）（詳細設計 L355・Excel 0306:L6469） | 乖離（実装挙動・移行退行）／要実機確認 | `ContactCreateAction.php:59, ...ContactController.php:93` | RG-017 |  |
| f06-23 | 現行踏襲 | 移行退行疑い | 一覧にパンくずリストを新規追加し、現在表示中のページは押下不可・ホームアイコンで本店ECTOPへ遷移する（Excel `0306:L6810`「★パンくずの表示を追加する」／`0306:L6819`／ | 乖離（現行がExcel★カスタマイズ未実装。移行先で充足済＝現行のみ不足）／要実機確認 | `history.twig:1, history.twig:7` | RG-009,015 |  |
| f06-23 | 現行踏襲 | 移行退行疑い | 未ログインで一覧URLへアクセスした場合はアクセス不可とし、会員ログインへ誘導する（詳細設計 `f06-23_front_contact_history.html:323,367,373`＝Excel | 乖離（現行＝設計の未ログイン誘導が成立しない疑い・未認証アクセス時の実応答は要実機確認。移行先で充足）／要実機確認 | `Application.php:596, ContactController.php:136, LoginUtil.php:22` | RG-017 |  |
| f06-24 | 現行踏襲 | 未実装疑い | パンくずの表示を追加する（★カスタマイズ・Excel `0306:L6990,L6994`）。パンくずリストはリンクで新規追加し、「⌂ > マイページ ＞お問い合わせ履歴一覧＞お問い合わせ番号:482 | 乖離（★カスタマイズ未実装）／要実機確認 | `history_detail.twig:8, history_detail.en.twig:8` | RG-002,003,004 |  |
| f06-24 | 現行踏襲 | 未実装疑い | 画面上部のユーザ名表示を削除する（★カスタマイズ・Excel `0306:L6991,L6995`）。画面項目「名前」（ラベル）は※カスタマイズ対応で項目を除去（`0306:L7004`） | 乖離（★カスタマイズ未実装・Excel/詳細設計の競合）／要実機確認 | `history_detail.twig:12, history_detail.en.twig:12, ContactController.php:158` | RG-005 |  |
| f06-26 | カスタマイズ | 移行退行疑い | IPによる即時ログアウトは「応答生成後の共通後処理で全フロントに作用する」＝毎リクエスト判定（詳細設計 L325 補足・処理フロー L334「任意のフロントアクセス」／現行 pf-eccube3 は  | 乖離（毎リクエスト→ログイン時のみへ退行）／要実機確認 | `IpCheckSubscriber.php:35` | RG-002,003,005 |  |
| f07-02 | カスタマイズ | 移行退行疑い | 件数0件のときの応答は ページが見つからない（HTTP404）として一覧本文を返す（Excel沈黙部を詳細設計が補完＝`f07-02_front_event_event_search.html:326 | 乖離（現行踏襲されていない・0件時HTTPステータスの退行。Excelが沈黙のため設計上の是非は要判断）／要実機確認 | `EventController.php:714, EventSearchController.php:50` | RG-030 |  |
| f07-04 | カスタマイズ | 未実装疑い | イベント追加と支払選択を一つの画面に統合する（Excel 0307:L2646）。1.イベント申込確認画面（URL `/ja/events/{イベント詳細ID}/entry`・0307:L2689）に | 乖離（Excelカスタマイズ未反映・画面統合が未実装）／要実機確認 | `—` | RG-001,003,004,021 |  |
| f07-04 | カスタマイズ | 未実装疑い | お支払いについて(1-7)リンク押下で支払いについてのモーダルウィンドウを表示し（Excel 0307:L2711,L2650）、クレジットカード決済のみ・利用可能ブランド・明細表示名「晴れる屋」・分 | 乖離（Excel規定のモーダルが未実装）／要実機確認 | `—` | RG-009,010,011 |  |
| f07-04 | カスタマイズ | 未実装疑い | 申込同意(1-10)未チェックで「支払いへ進む」(1-11)を押した場合、次の画面には遷移させずエラーを動的に表示する（Excel 0307:L2697） | 乖離（動的エラー表示の未実装/文言未定義）／要実機確認 | `—` | RG-007（DV-02） |  |
| f08-01 | 現行踏襲 | 設計誤り疑い | 本画面表示の副作用は「既ログイン時のログアウト・申込開始フラグ/空申込データのセッション設定」のみで、DB登録・更新は行わない（詳細設計 L363 入出力／L396「保存しない」／Excel は本画面 | 乖離（詳細設計 DB操作節の誤記＝ハルシネーション。実装は正しくDB更新しない） | `OtcBuyController.php:42` | RG-003,011（期待はL363副作用を採用しL371を |  |
| f08-02 | カスタマイズ | 設計誤り疑い | 本機能（入力段階）の副作用は「エントリーフラグ・入力データのセッション保存」のみで、査定申込みのDB登録・査定番号付与はF08-03（詳細設計 L364 入出力／L350／L396／Excは本画面のD | 乖離（詳細設計 DB操作節の誤記＝ハルシネーション。実装は正しく本画面でDB確定しない） | `OtcBuyController.php:72` | RG-014,015（期待はL364副作用を採用しL371を |  |
| f08-02 | カスタマイズ | 移行退行疑い | 海外住所対応のカスタマイズとして住所3を追加する（任意・全角半角・最大128文字／Excel 0308:L1190,L1245「※カスタマイズ対応、項目を追加する」「2026/5/15…必須から任意に | 乖離（Excelカスタマイズ「住所3追加」が現行pf-eccube3・詳細設計とも未反映。移行実装時に要反映＝要実機確認） | `—` | RG-001,018（期待はExcel入力項目表に住所3を含 |  |
| f08-03 | カスタマイズ | 移行退行疑い | 査定番号の採番時に申込テーブルをロックし、採番後に解除して連番の整合（一意性）を取る（L359,L404） | 乖離（移行での排他方式変更・一意性担保が弱まる懸念）／要実機確認 | `OtcBuyController.php:286, OtcBuyController.php:417` | RG-015,RG-016 |  |
| m02-01 | 標準 | バグ候補 | ステータス行押下では「受注一覧へ遷移し、そのステータスの識別子がクエリとして付与される。受注一覧の初回表示ロードでは、クエリにステータス識別子がある場合、検索条件のステータスにその識別子が含まれる形で | 乖離（設計が規定する導線の主目的が不成立・バグ候補）／要実機確認 | `index.twig:130, OrderController.php:141, SearchOrderType.php:141` | RG-015,RG-016 |  |
| m03-06 | カスタマイズ | 移行退行疑い | CSV データ行の並び順は「納品書印刷（日本語）シートと同様」＝カードが先／棚番昇順／言語／状態／Foil／略称タグ／レアリティ／色順／コレクター番号または英語カード名（Excel `excel_to | 乖離（Excel規定違反・並び順の退行）／要実機確認 | `ProductAllCsv.php:1160, ProductAllCsv.php:904, ProductCsvController.php:237` | RG-008 |  |
| m03-06 | カスタマイズ | 移行退行疑い | 成功時のファイル名は `product_custom{YmdHis}.csv`（詳細設計 `function_spec_html_preview/pf-eccube3/m03-06_admin_pro | 乖離（現行との差・設計は移行先準拠）／要実機確認 | `ProductAllCsv.php:736, ProductAllCsv.php:712` | RG-022 |  |
| m03-06 | カスタマイズ | 移行退行疑い | 不正・削除済み拡張、または有効な列名が皆無のときは HTTP 404（詳細設計 `…m03-06_admin_product_product_custom_csv_export.html:327,34 | 乖離（現行との差・設計＝移行先準拠の強化。現行側の欠陥）／要実機確認 | `ProductCsvController.php:214, ProductCsvController.php:1818` | RG-011,012 |  |
| m03-08 | カスタマイズ | 設計誤り疑い | 在庫数は本店のECCUBE在庫＋スマレジ在庫を表示する（Excel 0204:L5194）。※詳細設計 正本 L320 は「stock_unlimited が真なら無制限、偽なら（規格自身の）在庫数を | 乖離（詳細設計ハルシネーション・実装はExcel準拠で是正済） | `ProductClassController.php:88, ProductStockRepository.php:561, index.twig:89` | RG-006,011(DD-02) |  |
| m03-10 | カスタマイズ | 設計誤り疑い | 詳細設計HTMLは「入力 standard_price_nm を同一商品・同一言語・通常規格すべての行の standard_price に同じ値で書き込む・状態別に基準価格を分けた更新にはならない」（ | 乖離（詳細設計ハルシネーション・実装/Excelは条件別計算値） | `ProductClassRepository.php:1936, BulkUpdateProductPriceDetailType.php:48` | RG-013,015 |  |
| m03-11 | カスタマイズ | 未実装疑い | 識別ID:16「検索パラメータ」の書式は半角英数記号（Excel 0204:L6315・カスタマイズで新規設置 0204:L6289）。半角英数記号以外の入力は書式外として扱われるべき | 乖離（Excel書式制限の未実装）／要実機確認 | `CategoryType.php:151` | RG-016,029（DV-12） |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 名称の一意性は現行踏襲＝重複登録できない（Excelは沈黙。現行 `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.Hareruya | 乖離（現行踏襲違反・一意制約の喪失＝データ品質退行）／要実機確認 | `MtbStorageCode.php:40, StorageCodeType.php:36, StorageCodeController.php:115` | §5 相関バリデーション（要判定） |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 並び順は 0〜32767 の値域（Excel `…0204_基本設計仕様書(商品管理).html:6976`「4 並び順 - ◯ 0〜32767 - -」） | 乖離（現行実装のExcel未充足・移行先で是正）／要実機確認（現行側の負値送信時挙動） | `StorageCodeType.php:30, StorageCodeType.php:43` | RG-010（DV-06〜09） |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 一覧は 件数選択＋ページング を持つ（Excel `…0204_基本設計仕様書(商品管理).html:6979` 件数／`:6986`「14 ページング リンク … 選択したページへ遷移する」） | 乖離（現行実装のExcel未充足・移行先で実装）／要実機確認 | `StorageCodeController.php:36, StorageCodeController.php:89` | RG-018,RG-019 |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 保存成功直後は現行踏襲＝編集状態が維持され保存済み行が上部フォームに残る（Excelは沈黙。現行 `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/ | 乖離（現行踏襲違反・保存後の編集状態の退行／余剰クエリ）／要実機確認 | `StorageCodeController.php:69` | RG-024 |  |
| m03-15 | 現行踏襲 | 移行退行疑い | 文字コード・BOMは「既存CSV仕様を正とし」（`function_spec_html_preview/pf-eccube3/m03-15_admin_product_product_storage_ | 乖離（現行踏襲違反・BOM出力条件の退行）／要実機確認 | `StorageCodeController.php:169, CsvExportService.php:267` | RG-011（§5 文字コード・BOM＝要判定） |  |
| m03-16 | 現行踏襲 | バグ候補 | フォーム検証（CSVファイル必須・なりすまし対策トークン）に失敗した場合は取込せず取込画面を再表示する（詳細設計 `...m03-16_admin_product_product_storage_co | 乖離（設計のエラー処理に反する現行バグ候補・移行先で解消）／要実機確認 | `StorageCodeController.php:174, AbstractCsvService.php:105, StorageCodeController.php:260` | RG-012,013 |  |
| m03-17 | 現行踏襲 | 移行退行疑い | 検証失敗・一意制約違反時は「セッションにあったページ番号と件数で一覧を組みなおして同テンプレートで返す（無効フォームは通常HTTP 422）／フォーム状態は送信反映」（詳細設計 `…m03-17_…h | 乖離（現行踏襲差・失敗時応答とHTTPステータスが変化。Excelは沈黙のため詳細設計＝移行先を期待に採用）／要実機確認 | `TagSalesAnalysisController.php:54, TagSalesAnalysisController.php:108` | RG-016,RG-017 |  |
| m03-17 | 現行踏襲 | 移行退行疑い | 一覧にページング（`0204:L4250`）と表示件数の単一選択 10/50/100/300/500/1000/2000/10000/12000（`0204:L4246`）を持つ | 乖離（現行はExcel未充足・移行先で解消済み＝リグレッションではない。現行比較テスト時に差分が出る点に注意） | `TagSalesAnalysisController.php:32, tag_sales_analysis.twig:59, TagSalesAnalysisController.php:66` | RG-004〜011 |  |
| m03-18 | カスタマイズ | 設計誤り疑い | CSRF不正時は HTTP403（詳細設計 L376「CSRF 不正 HTTP 403」・L354「CSRF 失敗は 403」） | 乖離（詳細設計ハルシネーション・登録フォームの403は不正確） | `SectionController.php:100, SectionController.php:137, AbstractController.php:252` | RG-025 |  |
| m03-20 | カスタマイズ | バグ候補 | 免税区分は 0対象外・1一般品・2消耗品のみ登録可能とする（Excel 0204:L7970） | 乖離（Excel 0/1/2制約が m03-20 で未検証・バグ候補）／要実機確認 | `CsvImportController.php:1167, SectionMasterImportHandler.php:57` | RG-010,027(DV-06) |  |
| m03-20 | カスタマイズ | バグ候補 | 部門CSV登録でデータ行が 0 なら形式エラー `admin.common.csv_invalid_format` を積む（正本 L340④「失敗時は csv_invalid_format。…データ行 | 乖離（データ0行のエラーキー不一致・バグ候補）／要実機確認 | `CsvImportController.php:1126` | RG-017 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 重複判定の母集団は `product_code IS NOT NULL` かつ空文字列でない行に限る（詳細設計 L328・L331 順序1/2。Excelは母集団条件に沈黙＝詳細設計が補完） | 乖離（現行の欠陥／移行先で是正済み・要実機確認） | `ProductClassRepository.php:301, ProductClassRepository.php:2913` | RG-005（DV-04,05）, RG-013 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 並びは `product_code` 昇順、その後 `dtb_product.id` 昇順、その後規格 ID 昇順（詳細設計 L328。Excelは並び順に沈黙＝詳細設計が補完） | 乖離（現行の順序無保証／移行先で明示・要実機確認） | `ProductClassRepository.php:301, ProductClassRepository.php:2921` | RG-010 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 一覧に載せる行は重複コードに該当する全規格行を `dtb_product` と内部結合したもの（孤立行のみ除外）。結合先は `dtb_product.id` と `dtb_product_class. | 乖離（現行の未記載結合・誤重複判定の恐れ／移行先で除去・要実機確認） | `ProductClassRepository.php:308, ProductClassRepository.php:2909` | RG-004, RG-008（DV-08） |  |
| m03-26 | カスタマイズ | 未実装疑い | CSVアップロードボタン押下後に確認モーダルを表示する（Excel 0204:L2539） | 乖離（カスタマイズ未達・未実装） | `base_csv_upload.twig:30` | RG-004 |  |
| m03-26 | カスタマイズ | 未実装疑い | 商品公開ステータスを「廃止」に変更する場合、EC-CUBE・スマレジどちらの在庫も確認し1件以上でエラー（Excel 0204:L2480） | 乖離（スマレジ在庫チェック未実装）／要実機確認 | `AbolishedStatusStockValidator.php:75` | RG-014 |  |
| m03-27 | カスタマイズ | 未実装疑い | スマレジ連携フラグを手動で立てた規格のみ連携し、無効→有効変更時は連携キューを作成（Excel 0204:L3199,L3201） | 乖離（無効→有効の連携キュー作成が未実装）／要実機確認 | `ProductGoodsImportHandler.php:616` | RG-015 |  |
| m03-27 | カスタマイズ | 未実装疑い | 商品公開ステータスを「廃止」とする場合、EC-CUBE・スマレジ「どちらの在庫も」確認し1件以上ならエラー（Excel 0204:L3185） | 乖離（Excel要件のスマレジ在庫確認が未実装）／要実機確認 | `AbolishedStatusStockValidator.php:75` | RG-005 |  |
| m03-27 | カスタマイズ | 未実装疑い | 基準価格の誤入力チェック: 原価(単価)の想定外の金額を登録しようとした場合エラー扱い（Excel 0204:L3189,L3190） | 乖離疑義（原価想定外金額チェックが未実装の疑い）／要実機確認 | `ProductGoodsImportHandler.php:114` | RG-035（§5 数値バリデーション） |  |
| m03-27 | カスタマイズ | 未実装疑い | CSVアップロードボタン押下後に確認モーダルを表示する（Excel 0204:L3242 画面構成 識別ID2） | 乖離（Excel要件の確認モーダルが未実装の疑い・詳細設計もExcelと矛盾）／要実機確認 | `base_csv_upload.twig:29, base_csv_upload.twig:36` | RG-033（§5 画面遷移） |  |
| m03-29 | 現行踏襲 | 移行退行疑い | 成功件数は「インポート成功した商品IDの重複を避ける」（Excel 0204:L4449）＝ユニークな商品ID数（詳細設計 L333「処理成功件数としてカウントされるのは『その CSV で初めて処理し | 乖離（現行実装 vs Excel 0204:L4449／移行先はExcel準拠。件数表示の非互換）／要実機確認 | `ProductTagSalesAnalysisUpdateImportHandler.php:96, ProductTagSalesAnalysisUpdateImportHandler.php:82` | RG-037 |  |
| m03-30 | カスタマイズ | 未実装疑い | カスタマイズにより「価格変更」に「基準」を追加し「基準価格変更」へ改名、CSV列3「販売価格」を「基準価格」へ改名（Excel `0204:L9585,L10011`） | 乖離（カスタマイズ未達・改名未実装） | `ProductPriceCsvController.php:100, ProductPriceCsvController.php:198, ProductPriceCsvController.php:151` | RG-014,015 |  |
| m03-30 | カスタマイズ | 未実装疑い | セール区分いずれでも基準価格を CSV 基準価格へ更新する（Excel `0204:L10046,L10051`）。備考「基準価格から販売価格を上書き」（`0204:L10035`） | 乖離（基準価格 更新未実装） | `ProductPriceImportHandler.php:372` | RG-001,002,006 |  |
| m03-31 | 現行踏襲 | 移行退行疑い | 取込成功時のフラッシュ文言は「商品登録CSVファイルをアップロードしました。」（キー `admin.product.csv_import.save.complete`）（詳細設計 `…m03-31_a | 乖離（表示メッセージの退行）／要実機確認 | `ProductPriceCsvController.php:176, messages.ja.yaml:1966` | RG-038 |  |
| m03-32 | カスタマイズ | 未実装疑い | Excel カスタマイズ説明 備考「買取・販売価格履歴について ・買取・販売価格履歴を登録する際には、基準価格も登録する」（`excel_to_html/output/0204_基本設計仕様書(商品管 | 乖離（Excelカスタマイズ要求の未実装・監査証跡欠落）／要実機確認 | `SimpleHighPriceImportHandler.php:29, DtbPriceHistoryRepository.php:160, SaleHighPriceImportHandler.php:43` | RG-015 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 「本機能のカスタマイズ区分は現行踏襲である」（同 `:313`）＝移行先にも同等の取込経路が要る。設計自身も「移行後の取込経路は ec-cube-enterprise 実装で要確認とする」と自認（同  | 乖離（移行先での機能欠落候補・現行踏襲未達）／要実機確認（別経路での代替提供有無） | `MtbCsvImportType.php:37` | RG-060,018 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 商品存在検証は「`dtb_product` を参照し、`product_id` が一致し `del_flg` が無効（削除されていない）行が存在するか判定する」（同 `:341`）。設計は「移行先 ` | 乖離（存在判定の意味変質・移行時の判定境界差）／要実機確認（移行先での代替判定列の確定） | `ProductDiscountImportHandler.php:158` | RG-030,018 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 更新は「ネイティブ SQL の `UPDATE dtb_product_sub` で行を更新する」（同 `:343`）。DBの正は移行先で、保存先は `dtb_product.discount_id` | 乖離（更新経路の再設計要・移行先の対応列未確定）／要実機確認 | `ProductPriceImportHandler.php:210, Product.php:1168` | RG-017,018,044 |  |
| m03-36 | 現行踏襲 | 移行退行疑い | 取込時の実在・非削除判定は現行 del_flg で行う（L315,L337順序6,L346,L360）。移行先 ec-cube-enterprise には del_flg 列が無く判定列の置換は要確認 | 乖離（移行未対応・要実機確認） | `—` | RG-013 |  |
| m03-37 | 現行踏襲 | 未実装疑い | CSVインポート履歴に ファイル名（0204:L12483）・アップロード日時（0204:L12484）・作業者（0204:L12485）を表示し、件数の単一選択（10/50/100/300/500/ | 乖離（Excel設計の画面項目が未実装／設計にも未記載）／要実機確認 | `ProductCsvController.php:1860` | RG-011〜015 |  |
| m03-37 | 現行踏襲 | 移行退行疑い | 機能区分は現行踏襲であり移行先でも本機能が成立する（正本 L309） | 乖離（機能区分と移行スコープの矛盾）／上位決裁事項・要判定 | `StorageCodeController.php:224` | RG-033,034 |  |
| m03-38 | カスタマイズ | 未実装疑い | 画面構成 識別ID2「CSVファイルのアップロード」ボタンは押下後、確認モーダルを表示する（Excel `excel_to_html/output/0204_基本設計仕様書(商品管理).html:48 | 乖離（Excel画面構成の未実装・誤操作で全商品の公開状態を一括変更しうる保護の欠落）／要実機確認 | `base_csv_upload.twig:53` | RG-003 |  |
| m03-38 | カスタマイズ | 未実装疑い | 画面構成 識別ID5「該当件数」を表示する（Excel `…0204_基本設計仕様書(商品管理).html:4822`。ページング化の文脈＝`:4803-4806`） | 乖離（Excel画面構成の未実装）／要実機確認 | `csv_import_history.twig:2` | RG-007 |  |
| m03-40 | 現行踏襲 | 移行退行疑い | 更新対象列は現行・移行先とも `dtb_product_class.shelf_number_id` を product_code 一致で更新し「同一スキーマ。差分は確認できない」（Excel `ex | 乖離（設計書の現行記述誤り・移行時のデータ移送要確認）／要実機確認 | `DtbProductSubClassRepository.php:1422, ProductClassRepository.php:2324` | RG-019,040 |  |
| m03-40 | 現行踏襲 | 移行退行疑い | 履歴一覧は件数の単一選択（10/50/100/300/500/1000/2000/10000/12000）とページングリンクを備える（Excel `excel_to_html/output/0204_ | 乖離（現行がExcel設計未充足・移行先で充足）／要実機確認 | `ProductCsvController.php:392, AbstractController.php:361` | RG-027,028,029 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 挙動・登録処理の正はカスタマイズ後（承認ワークフロー）。詳細設計 DB操作節も承認型（正本 L361-364） | 乖離（詳細設計現行記述と移行先実装差・Excel承認は実装で充足） | `StockBulkApprovalStoreAction.php:46, StockBulkApprovalController.php:164` | RG-003,004,019 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 在庫変動区分 1-1 は区分マスタの単一選択（Excel 0202:L2925・「在庫編集」シート3-1参照） | 乖離（詳細設計の区分名と移行先実装差／Excel未列挙） | `StockBulkApprovalType.php:71` | RG-008 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 増減数0の行は更新しない（更新対象から除外）（正本 L343「0の行は更新しない」） | 乖離（除外 vs 拒否・現行と移行先差） | `StockBulkApprovalItemType.php:60, StockBulkApprovalType.php:145` | RG-012 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 登録成功・未選択・戻りは商品検索一覧（保持ページ）へ（正本 L374,L376） | 乖離（現行 pf-eccube3 の戻り先記述と移行先実装差） | `StockBulkApprovalController.php:63` | RG-011,020 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 表示メッセージは pf-eccube3 文言（「商品が選択されていません。」「登録が完了しました。」等・正本 L383,L385） | 乖離（現行文言記述と移行先実装キー差） | `StockBulkApprovalController.php:61` | RG-011,020 |  |
| m04-09 | 新規実装 | 未実装疑い | 振替点数が現在の最新の在庫よりも多い場合はエラー（Excel 0202:L6381） | 乖離（在庫超過バリデーション未実装・在庫が負値化しうる） | `StockTransferStoreAction.php:82, StockTransferNewDetailType.php:41, StockMoveQuantityType.php:60` | RG-026 |  |
| m04-09 | 新規実装 | 未実装疑い | 振替対象の商品と振替後商品コードが同一の場合はエラー（Excel 0202:L6383） | 乖離（同一コード検証未実装） | `StockTransferStoreAction.php:78` | RG-027 |  |
| m04-10 | 新規実装 | 未実装疑い | 出庫日＝移動は「移動中」/振替は「出庫承認済み」になった日時、入庫日＝「入庫完了」になった日時を出力（0202:L7066,L7067）。CSVは `getMoveFromStockAt()`／`ge | 乖離（未実装・カラム未充填）／要実機確認 | `StockMoveTransferListCsvExportService.php:171, DtbStockMoveTransfer.php:236, StockMoveTransferListCsvExportServiceTest.php:228` | RG-020,021 |  |
| m04-11 | 現行踏襲 | 未実装疑い | 出力項目はカスタムCSVの設定で変更した出力項目で出力する（正本 L326,L329「カスタムCSV機能で変更した出力項目で出力する」） | 乖離（カスタムCSV出力項目変更 未実装・上位で削除記録）／要実機確認 | `HistoryCsv.php:23` | RG-004 |  |
| m04-12 | 新規実装 | 未実装疑い | 表示件数(4-4・初期値10件・EC-CUBE標準の表示件数選択肢)とページング(5-13・選択ページへ遷移)を持つ（Excel 0202:L7463, L7477） | 乖離（表示件数・ページング未実装） | `StockSplitJoinController.php:131, DtbStockSplitJoinRepository.php:124` | RG-015,016 |  |
| m04-14 | 新規実装 | バグ候補 | 列7「分割元・結合先商品の基準価格の合計」と列9「分割先・結合元商品の基準価格の合計」はいずれも "基準価格の合計"（Excel 0202:L9671,L9673）＝同種の集計で丸め方針は一貫すべき | 乖離（丸め非対称・実装バグ候補）／要実機確認 | `StockSplitJoinCsvExportService.php:120` | RG-008,010,026 |  |
| m04-14 | 新規実装 | バグ候補 | 「検索結果のデータを取得しCSV出力する」＝一覧の検索結果と出力内容が一致すべき（Excel 0202:L9684） | 乖離（正規化不一致・実装バグ候補）／要実機確認 | `StockSplitJoinIndexAction.php:44, StockSplitJoinController.php:213` | RG-015,022 |  |
| m04-16 | 現行踏襲 | 未実装疑い | 現行システムの在庫レコメンド画面で在庫レコメンドにチェックがついている場合の内容を出力（Excel 0202:L9836） | 乖離疑義（在庫レコメンドチェック絞り込み未実装・文言両義・要実機確認） | `StockRecommendCsvExportService.php:201` | RG-014 |  |
| m04-17 | カスタマイズ | 未実装疑い | 変更後原価単価(2-21・Excel 0202:L10089)・原価率(2-23・Excel 0202:L10091)・承認日(2-31・Excel 0202:L10099) は各レンジで在庫変動履歴 | 乖離（変更後原価単価・原価率・承認日の絞り込み未実装） | `StockHistoryType.php:256, DtbStockHistoryRepository.php:96` | RG-012,013,018 |  |
| m04-17 | カスタマイズ | 未実装疑い | 登録者(所属選択2-27・Excel 0202:L10095)・承認者(所属2-29/メンバー2-30・Excel 0202:L10097,L10098)・最終更新者(所属2-33) で絞り込む | 乖離（所属選択・承認者の絞り込み未実装） | `DtbStockHistoryRepository.php:304, StockHistoryType.php:375` | RG-016,017 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 保持中の在庫履歴検索条件で在庫変動履歴を全件CSV出力（Excel 0202:L10684「検索条件でデータを取得しCSV出力」・詳細設計 L329,L351：セッション `admin.history | 乖離（出力対象＝選択行のみ・検索条件全件出力が未達／移行での仕様変更） | `StockHistoryController.php:285, StockHistoryCsv.php:53` | RG-001,004 |  |
| m04-18 | カスタマイズ | 未実装疑い | 識別ID5 Foil を追加（★カスタマイズ・Excel 0202:L10688） | 乖離（Foil列 未実装・空固定） | `StockHistoryCsv.php:104` | RG-005 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 登録日は `dtb_stock_history.create_date` を `Y/m/d H:i` 書式で出力（詳細設計 L340） | 乖離（日付区切り書式差・移行での退行懸念）／要実機確認 | `StockHistoryCsv.php:121, HistoryCsv.php:112` | RG-005 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 入口ルートは `GET /%eccube_admin_route%/product/history/stock/export`（詳細設計 L321）・ファイル名接頭辞 `product_stock_h | 乖離（ルート/メソッド/ファイル名接頭辞の差・移行での経路変更） | `StockHistoryController.php:284, StockHistoryCsv.php:75, HistoryCsv.php:68` | RG-009,017 |  |
| m04-19 | カスタマイズ | 移行退行疑い | 一覧は第一=商品コード降順・第二=店舗ID降順・第三=登録日時降順（Excel 0202:L10874-10876） | 乖離（3段ソート未実装・退行） | `DtbStockoutHistoryRepository.php:40, SearchControllerTrait.php:374` | RG-008 |  |
| m04-19 | カスタマイズ | 未実装疑い | 追加表示列: 店舗(2-6)・在庫区分(2-7)・登録元(2-8)・登録元ID(2-9)・欠品時販売価格(2-11)・欠品理由(2-12)・最終更新日(2-15)・最終更新者(2-16)＋Foil(2 | 乖離（追加表示列 未実装・カスタマイズ未達） | `stockout_historylist.twig:88, DtbStockoutHistoryRepository.php:41, DtbStockoutHistory.php:76` | RG-011,RG-012 |  |
| m04-19 | カスタマイズ | 未実装疑い | 欠品理由をペンアイコンから編集・登録し、更新日と更新者（ログインメンバー）を更新（Excel 0202:L10911） | 乖離（編集機能 未実装・カスタマイズ未達） | `stockout_historylist.twig:100` | RG-013,RG-026 |  |
| m04-19 | カスタマイズ | 未実装疑い | CSVダウンロードボタン（1-2）で在庫変動履歴CSVを出力（Excel 0202:L10898） | 乖離（CSV出力 未実装・カスタマイズ未達） | `ProductServiceProvider.php:236` | RG-017 |  |
| m04-19 | カスタマイズ | 未実装疑い | 本店在庫・支店在庫・スマレジ（実店頭）の在庫情報を横断的に検索可能とする（Excel 0202:L10861 カスタマイズ要件） | 乖離（横断検索 未実装・カスタマイズ未達） | `StockoutHistoryType.php:33` | RG-005,RG-011 |  |
| m04-20 | 新規実装 | 未実装疑い | CSV列5＝「Foil」を出力（Excel 0202:L11100） | 乖離（値未実装・TODO） | `StockHistoryDisposalCsv.php:104` | RG-001,007 |  |
| m04-21 | カスタマイズ | 未実装疑い | 登録は承認ワークフロー: 入力チェック後に在庫編集承認情報(承認状態=未承認/承認者=承認待ち)と在庫変更履歴を登録し、承認一覧での承認行為を経る（Excel 0202:L11471-L11488） | 乖離（承認ワークフロー未実装・即時更新） | `ProductStockImportHandler.php:195, ProductCsvController.php:1237` | RG-028,029,031,032 |  |
| m04-21 | カスタマイズ | 未実装疑い | CSVは 商品コード・在庫増減数・仕入単価 の3列で、仕入単価(原価)は入庫時必須・0〜999999999（Excel 0202:L11435,L11436,L11543,L11574。雛形も4列 L | 乖離（仕入単価/原価列 未実装） | `ProductCsvController.php:2163, ProductStockImportHandler.php:71, StockCsvImportType.php:15` | RG-013,016,035,038 |  |
| m04-21 | カスタマイズ | 未実装疑い | 1商品規格で100件以上/-100件以上の増減時に確認モーダルを表示し、OK/キャンセルで更新可否を分岐（Excel 0202:L11438,L11449-L11451,L11609） | 乖離（確認モーダル 未実装） | `ProductStockImportHandler.php:134` | RG-026,027 |  |
| m04-21 | カスタマイズ | 未実装疑い | 画面上部フォームに 店舗・在庫区分・在庫変動区分・在庫変動理由・承認通知先(所属選択・メンバー選択) を必須入力として持つ（Excel 0202:L11536-L11541） | 乖離（表ヘッダー部フォーム部品 未実装） | `StockCsvImportType.php:15, ProductStockImportHandler.php:204` | RG-005〜010 |  |
| m04-21 | カスタマイズ | 未実装疑い | 承認通知先メンバーに通知送付用メールテンプレートで通知メールを送付（Excel 0202:L11526,L11527） | 乖離（承認通知メール 未実装） | `ProductStockImportHandler.php:109` | RG-033 |  |
| m04-21 | カスタマイズ | 未実装疑い | 移行先 ec-cube-enterprise で在庫変更CSV登録（承認ワークフロー・原価列付き）を提供する（Excel 0202:M04-21 全体・詳細設計 L320「DB関連は ec-cube- | ProductStockImportHandler' ../ec-cube-enterprise/app` はマスタ登録マイグレーション `app/DoctrineMigrations/Version20260106155157.php:7 | `—` | **乖離（移行先 取込処理未移植）／要実機確認** |  |
| m04-22 | 新規実装 | 未実装疑い | 振替元商品と振替先商品がまったく同一の行が複数あった場合はエラー（Excel `0202:L12129`） | 乖離（未実装） | `StockTransferCsvImportHandler.php:153` | RG-025 |  |
| m04-23 | 新規実装 | バグ候補 | 分割CSVの 分割数 は値域 0~999999999（下限0）、分割在庫数は値域 0~999999999（下限0）＝下限0はオラクル(Excel)上の有効境界（Excel 0202:L12502,02 | 乖離（Excel値域下限0=有効 vs 実装>0で弾く＝バグ候補） | `StockSplitListCsvImportHandler.php:149` | RG-022B(DV-08,09),037B |  |
| m04-24 | 新規実装 | 未実装疑い | 入力チェックはエラーが20件に到達するまでチェックを行う（Excel 0202:L13362＝エラー累計が20件に到達した時点で以降の入力チェックを打ち切る。行番号ではなくエラー件数の閾値） | 乖離（チェック打ち切り未実装・表示のみ制限） | `StockMoveInstructionCsvImportHandler.php:73, StockMoveInstructionController.php:383` | RG-028 |  |
| m04-24 | 新規実装 | 未実装疑い | 一覧にページネーションを表示（Excel 0202:L13432「3-16 ページネーション」・表示件数初期値50 0202:L13420） | 乖離（ページング未実装・表示件数無効の疑い） | `—` | RG-015,RG-011 |  |
| m04-25 | 新規実装 | バグ候補 | Excel 0202:L13929「発送済みでないかつ送り状No.が登録されていない在庫移動指示のみ削除可能」＝削除ガードは2条件（発送済みでない AND 送状No未登録） | 乖離（削除条件の一部未実装・コードバグ候補） | `StockMoveInstructionController.php:290` | RG-014 |  |
| m04-31 | カスタマイズ | 設計誤り疑い | 登録時に dtb_inventory_plan_detail を「計画対象の規格在庫ごとに棚卸明細を作成する」（L365） | 乖離（詳細設計DB操作表のハルシネーション） | `InventoryPlanController.php:181, InventoryPlanController.php:286` | RG-004（明細非生成） |  |
| m04-31 | カスタマイズ | 移行退行疑い | 本機能は店舗スコープ制約を規定しない（詳細設計は pf 現行挙動基準・L308） | 乖離（移行先が設計非記載の店舗スコープ制約を追加）／要実機確認 | `InventoryPlanController.php:298, InventoryPlanType.php:80, InventoryPlanType.php:22` | RG-006,007,009 |  |
| m04-33 | 新規実装 | 設計誤り疑い | 詳細設計 L309「`DtbStockMoveTransferRepository::getReturnListExportRows($ids)` が生SQLで取得」・L326「getReturnLi | 乖離（詳細設計ハルシネーション・メソッド名相違） | `StockMoveTransferReturnListCsvExportService.php:76, DtbStockMoveTransferRepository.php:36` |  |  |
| m04-34 | 新規実装 | 設計誤り疑い | 詳細設計HTMLは戻しリストPDFフォーマッタを `StockMoveTransferReturnListPdfFormatter` と繰り返し記す（正本 L287「実装確認」欄・L303・L497相 | 詳細設計ハルシネーション（クラス名不一致） | `StockMoveTransferListPdfFormatter.php:53, StockMoveTransferController.php:497` | 全般（正本ナビの信頼性） |  |
| m05-02 | カスタマイズ | 移行退行疑い | UTF-8のときCSVの先頭にBOMを書く（詳細設計 L395「先頭にBOMを書く」＝1回） | 乖離（二重BOM・退行／要実機確認：出力バイト確認） | `CsvExportService.php:162, CsvExportService.php:267` | RG-006 |  |
| m05-04 | カスタマイズ | 未実装疑い | 非会員である場合、お名前(姓)に「非会員」と表現する（Excel 0203:L2681,L2777,L2781） | 乖離（カスタマイズ未実装疑い）／要実機確認（dtb_csv 特殊定義や未検出リスナで担保される余地を実機確認） | `OrderController.php:441, CsvExportService.php:215, OrderController.php:462` | RG-004 |  |
| m05-06 | カスタマイズ | 移行退行疑い | 欠落配送IDのエラーは「欠けた配送IDごと」に積む。翻訳キー admin.order.mail_all.error.missing に埋め込むのは欠落した配送ID（詳細設計 L317 が「メッセージ文 | 乖離（メッセージのラベル/値不一致・退行） | `messages.ja.yaml:2719, MailController.php:316, MailController.php:283` | RG-011 |  |
| m05-08 | 現行踏襲 | 設計誤り疑い | 本機能は更新系で `browser_print_flg`／条件付き `order_status_id`・`confirm_date`・`member_id` を UPDATE する（Excel 020 | 乖離（詳細設計ハルシネーション・要是正） | `UpdateStackListAction.php:48` | §1,§5,RG-004,005 |  |
| m05-10 | カスタマイズ | 未実装疑い | 棚番は昇順、ただし支店の場合は棚番のソートを行わない（Excel 0203:L4339） | 乖離（カスタマイズ未達・支店例外未実装） | `SortProductTrait.php:72, DtbShippingStandbyRepository.php:311` | RG-004 |  |
| m05-10 | カスタマイズ | 未実装疑い | POSTのCSRF検証異常はSymfony既定（詳細設計 L345,L367。ヘッダにCSRFフィールドは付く） | 乖離（CSRF検証未実装）／要実機確認 | `OrderController.php:742` | RG-023 |  |
| m05-11 | カスタマイズ | 未実装疑い | ログインメンバーの編集可能店舗に紐づく受注のみ編集可、権限外ユーザが登録押下でエラー（Excel 0203:L4661,L4678） | 乖離（編集権限制御 未実装） | `—` | RG-004,008 |  |
| m05-11 | カスタマイズ | 未実装疑い | スマレジ取引の場合は編集不可（編集が必要ならスマレジ側で編集）（Excel 0203:L4662,L4638） | 乖離（スマレジ取引編集不可 未実装） | `—` | RG-005 |  |
| m05-11 | カスタマイズ | 未実装疑い | 受注データに対する変更が発生した場合に履歴として保持し、受注情報編集画面で手動変更された場合のみ登録する（Excel 0203:L4640,L5257） | 乖離（受注更新履歴 未実装疑い）／要実機確認 | `—` | RG-032,033 |  |
| m05-12 | 標準 | 設計誤り疑い | 状態遷移ルール上、配送完了へは新規受付・入金済み・対応中から遷移でき、それ以外の対応状況からは遷移できない（L345） | 乖離（設計ハルシネーション・限定過小）／要実機確認 | `OrderStateMachine.php:73, order_state_machine.php:66` | DV-02,RG-010,012,037 |  |
| m05-14 | 標準 | 設計誤り疑い | 対応状況プルダウンの選択肢から現在のステータス自身を除外する（「現在のステータス自身は遷移定義に含まれないため選択肢に出さない。OrderType が同一ステータスを除外する」HTML:322,330 | 乖離（詳細設計ハルシネーション・現在ステータスがプルダウンに残る）／要実機確認 | `OrderType.php:417` | RG-021,RG-022 |  |
| m05-15 | 標準 | 設計誤り疑い | DB操作節（正本 L380）の操作テーブルは「登録/更新: dtb_mail_history / dtb_mail_template / dtb_order …当機能が行う登録・更新で対象テーブルを直 | 詳細設計ハルシネーション（要是正） | `MailController.php:161` | RG-017 |  |
| m05-19 | 現行踏襲 | 移行退行疑い | 「注文番号」ラベルの入力は注文番号（文字列）で受注を特定して紐付く出荷指示を絞る（現行踏襲）。現行実装は `DtbOrderSub.orderNumber` に一致させて受注→出荷指示を辿る（`pf- | 乖離（現行踏襲違反・注文番号検索の意味退行）／要実機確認 | `DtbShippingStandbyRepository.php:85` | RG-002 |  |
| m05-19 | 現行踏襲 | 移行退行疑い | 既定並び順は現行踏襲＝`ss.createDate DESC` かつ次点 `ss.standbyId DESC`（現行はソートパラメータを無視し常にこの固定順） | 乖離（現行踏襲違反・既定並び順の退行）／要実機確認 | `DtbShippingStandbyRepository.php:38` | RG-011 |  |
| m05-21 | 現行踏襲 | 設計誤り疑い | 閾値行欠落時も安全に既定値（0）等へフォールバックする（詳細設計 L361「両経路とも欠落時0をTwigへ渡せるとは限らない」） | 乖離（pf現行バグ・null fatal／詳細設計ハルシネーション是正／enterpriseで是正）／要実機確認 | `...ShippingStandbyController.php:210` | RG-037 |  |
| m05-21 | 現行踏襲 | 移行退行疑い | サプライ品判定は「最小カテゴリがグッズ定数・予約グッズ定数か」で行う（詳細設計 L330 ステップ3・Excel 0203:L7085,L7089） | 乖離（移行での判定ロジック変更・オラクル不一致）／要実機確認 | `...ShippingStandbyController.php:250, ...ShippingStandbyController.php:343` | RG-004 |  |
| m05-22 | 現行踏襲 | 未実装疑い | 並び順の棚番は昇順、ただし支店の場合は棚番のソートを行わない（Excel 0203:L4052） | 乖離（支店棚番非ソート未実装）／要実機確認（支店品目のShelfNumber有無に依存） | `SortProductTrait.php:72` | RG-006 |  |
| m05-24 | 現行踏襲 | 移行退行疑い | 空/不正 order_ids 時のエラーフラッシュ。詳細設計 L358 は enterprise の `admin.common.select` を記すが「標準文言はキー転用となる（実装修正の論点にな | 乖離（現行踏襲違反・文言退行）／要実機確認 | `...OrderCsvController.php:174, ...OrderCsvController.php:204` | RG-007,008 |  |
| m06-05 | カスタマイズ | 未実装疑い | 買取店舗の初期選択は、デフォルト検索表示店舗が「全店」の場合は未選択状態とする（Excel 0205:L3543） | 乖離疑義（全店未選択 未実装の可能性・要実機確認） | `OtcBuyOrderHistoryType.php:130, BaseInfo.php:47` | RG-007 |  |
| m06-05 | カスタマイズ | 未実装疑い | 査定ID・会員IDは「半角数字(整数)」書式（Excel 0205:L3551,L3552） | 乖離（Excel書式規定 未実装・要実機確認） | `OtcBuyOrderHistoryType.php:81, HistorySearchDataDto.php:24` | RG-003,DV-04 |  |
| m06-06 | カスタマイズ | バグ候補 | 買取価格CSV列は「小計ではなく単価」（0205:L3982／詳細設計 L339「小計÷数量」） | 要実ソース確認（計算バグ候補） | `—` | RG-012 |  |
| m06-06 | カスタマイズ | バグ候補 | 増減数CSV列は「変更後在庫−変更前在庫」（0205:L3986／詳細設計 L339） | 要実ソース確認（符号バグ候補） | `—` | RG-013 |  |
| m06-06 | カスタマイズ | バグ候補 | 買取日時範囲フィルタはキャンセル時 cancelDate・非キャンセル時 completeDate を参照（詳細設計 L332） | 要実ソース確認（フィルタ列切替バグ候補） | `—` | RG-027 |  |
| m07-03 | カスタマイズ | バグ候補 | 電話番号は Excel 0206:L2936「最大11」・詳細設計 L331も電話番号を扱う（現行踏襲） | 乖離（Excel明示の最大長未強制・バグ候補） | `PurchaseDetailType.php:139` | RG-028(DV-06) |  |
| m07-03 | カスタマイズ | バグ候補 | 一括売却登録のCSRF検証有無は Excel・詳細設計とも沈黙（詳細設計 L332は「メイン・実在庫・口座・適格請求書にトークンフィールド」と列挙するが一括売却別ルートは未言及） | 乖離（状態変更POSTのCSRF保護欠落・セキュリティ・バグ候補） | `PurchaseController.php:519` | RG-033 |  |
| m07-03 | カスタマイズ | 設計誤り疑い | 実在庫編集可の7ステータス（Excel 0206:L2781／詳細設計 L329） | 設計どおり✓（詳細設計ハルシネーションなし） | `MtbBuyOrderStatus.php:92, PurchaseDetailType.php:334` | RG-014,015 |  |
| m07-04 | カスタマイズ | バグ候補 | 送信成功時にメール履歴を確定保存する（Excel沈黙／詳細設計 L336 順序4「メール履歴エンティティを永続化対象に追加…HTTP 経由ではリクエスト終了までに flush される前提」・L352  | 乖離（実装バグ候補・履歴未保存）／要実機確認 | `MailService.php:1589, MailController.php:87, TransactionListener.php:69` | RG-008,009 |  |
| m07-05 | 現行踏襲 | 移行退行疑い | 1買取注文=1行の入金CSVを出力（Excel 0206 は買取注文単位の項目表・詳細設計 L308「行の並びは買取注文IDの昇順」で1件1行前提） | 乖離（GROUP BY欠落・重複行/非決定的選択・現行からの退行） | `DtbBuyOrderRepository.php:459, BuyOrderDepositCsvExportService.php:66, DtbBuyOrderRepository.php:353` | RG-006,RG-007 |  |
| m07-06 | 現行踏襲 | 移行退行疑い | 詳細設計は type=sale/notSale 分岐・キャンセルCSV(非売却側)・session page_no ベースの一覧リダイレクトを記述（L311,L319,L367）＝enterprise | 乖離（現行未実装機能を設計が記述・移行先で新規追加） | `PurchaseController.php:558` | RG-002,RG-004,RG-013,RG-028,RG |  |
| m07-06 | 現行踏襲 | 移行退行疑い | エラー時は `admin.purchase.online.csv_export.no_selection` を積み `admin_purchase_page`（session page_no）へリダイ | 乖離（現行と移行先でメッセージキー/リダイレクト先が相違） | `PurchaseController.php:563, PurchaseController.php:605` | RG-024,RG-036,RG-039(DV-05) |  |
| m07-08 | 新規実装 | バグ候補 | CSV出力の副作用（状態更新）は Excel M07-08 に記載なし（沈黙） | 乖離（設計未記載の状態更新副作用・バグ候補） | `BuyOrderRestockListCsvExportService.php:78, BuyOrderRestockListService.php:68` | RG-016 |  |
| m07-08 | 新規実装 | バグ候補 | 出力と状態更新の原子性は Excel M07-08 に記載なし（沈黙） | 乖離（原子性未保証・バグ候補）／要実機確認 | `BuyOrderRestockListCsvExportService.php:60, BuyOrderRestockListService.php:70` | RG-016 |  |
| m08-01 | カスタマイズ | 設計誤り疑い | DCIナンバーを画面から除去する（Excel 0207:L1090）。※詳細設計HTML `...m08-01...html:370,393` はDCIナンバー（フォームキー dciNo・数字のみ・最 | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI項目残置） | `CustomerSearchTypeExtension.php:49` | RG-022,DV-15 |  |
| m08-01 | カスタマイズ | 設計誤り疑い | DCI確認フラグを画面から除去する（Excel 0207:L1091）。※詳細設計HTML `...m08-01...html:345,370` はDCI確認フラグ（フォームキー dciConfirm | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI確認フラグ残置） | `...CustomerSearchTypeExtension.php:61` | RG-022 |  |
| m08-01 | カスタマイズ | 移行退行疑い | MTG Companion登録本名は半角英字と半角空白のみ・最大64（詳細設計 `...m08-01...html:393`・Excel 0207:L1093 は最大64のみ規定＝文字種は詳細設計補完 | 乖離（文字種検証 未移植・カスタマイズ退行）／要実機確認 | `...SearchCustomerType.php:497, eccube.yaml:177, ...CustomerSearchTypeExtension.php:37` | RG-037(DV-07) |  |
| m08-01 | カスタマイズ | 設計誤り疑い | 誕生月（識別ID:8）を除去する（Excel 0207:L1026,L1065）。※詳細設計HTML `...m08-01...html:345,370` は誕生月（フォームキー birth_mont | 設計どおり✓（Excel）／詳細設計ハルシネーション（誕生月残置） | `—` | RG-020 |  |
| m08-01 | カスタマイズ | バグ候補 | 登録日・更新日・最終購入日は各From/Toの2入力で1条件（詳細設計 `...m08-01...html:346,370`） | 乖離（重複/孤児フィールド定義・保守性バグ候補）／要実機確認 | `—` | RG-025,RG-002 |  |
| m08-02 | 現行踏襲 | 移行退行疑い | 画面遷移は入力→確認→送信→完了の多段構成で、確認・完了を独立ルートとして持つかは要確認（正本 L313「多段フローの仕様は現行を正とする」） | 乖離（移行での構造差・要移行確認） | `CustomerMailController.php:49, CustomerServiceProvider.php:33` | RG-002,003,004,017 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 識別ID:31「DCIナンバー」・識別ID:35「DCI確認フラグ」を除去する（Excel 0207:L2436,L2437） | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI項目残置） | `PlayerType.php:41` | RG-016 |  |
| m08-12 | 現行踏襲 | 移行退行疑い | 入口は `GET /{admin_route}/customer_group/{id}`／`POST /{admin_route}/customer_group/new`／`POST /{admin_ | 乖離（現行踏襲差・URL構成／詳細設計L319の入口表が移行先と不一致）／要実機確認 | `CustomerGroupController.php:39` | RG-001, RG-005, RG-006, RG-014 |  |
| m08-14 | 現行踏襲 | 移行退行疑い | 成功時は再送完了メッセージ（ロケールキー `admin.customer.resend.complete`）を表示する（0207:L5134／詳細設計 L337）。現行は同キーで「仮会員登録メールを送 | 乖離（現行踏襲違反・成功メッセージキー/文言の退行）／要実機確認 | `CustomerController.php:219, messages.ja.yaml:1604` | RG-008 |  |
| m08-14 | 現行踏襲 | 移行退行疑い | 入口は PUT `/{admin_route}/customer/{id}/resend`（0207:L5123／詳細設計 L326）。現行はPUTで一致（`pf-eccube3/app/Plugin | 乖離（現行踏襲違反・HTTPメソッドPUT→GETの退行／安全でないメソッド設計）／要実機確認 | `CustomerController.php:185, index.twig:504` | RG-006,RG-007 |  |
| m09-04 | カスタマイズ | 移行退行疑い | ページを新規登録する場合、日英2種類のファイルを作成する（Excel 0210:L2080,L2081。拡張子は日本語 .ja.twig／英語 .en.twig＝0210:L2078,L2079） | 乖離（Excel未充足・日英2ファイル未作成／移行先の日本語拡張子差）／要実機確認 | `ContentController.php:255, PageController.php:225, PageController.php:99` | RG-035,038 |  |
| m09-04 | カスタマイズ | 未実装疑い | 編集できないページの場合、(1-9)コードはreadonlyにして入力不可とし（Excel 0210:L2110）、(5)登録を押下した後、編集できない旨のエラーを表示する（Excel 0210:L2 | 乖離（Excelカスタマイズ要件の未実装・編集不可ページのコード保護なし）／要実機確認 | `PageController.php:180, page_edit.twig:85, PageController.php:236` | RG-043,044 |  |
| m09-04 | カスタマイズ | バグ候補 | 編集時、初期投入データ（開発者が追加したページ）は URL とファイル名を更新前の値で保持し、利用者作成ページは更新を許す（Excel 0210:L1005,L1008／詳細設計 L348,L361, | 乖離（現行実装の論理反転＝バグ候補・優先度高）／要実機確認 | `PageController.php:166, PageLayout.php:26, PageController.php:90` | RG-042,045,046,047 |  |
| m09-07 | カスタマイズ | 未実装疑い | 一覧の(2)検索ボックスに入力すると、ブロックを(3)ブロック名と(4)ファイル名で部分一致検索し、対象ブロックのみを画面に表示する（Excel 0210:L2355・画面項目 0210:L2379） | 乖離（Excel記載の検索ボックス未実装）／要実機確認 | `BlockController.php:40, BlockRepository.php:106, block.twig:9` | RG-004,005,006,007 |  |
| m09-07 | カスタマイズ | 未実装疑い | 一覧に(4)ファイル名（ラベル）列を表示する（Excel 0210:L2381・画面項目表）。詳細設計HTMLも「一覧は検索ボックスと、ブロック名・ファイル名の2列、操作ドロップダウンを並べる」（同H | 乖離（Excel記載のファイル名列未実装）／要実機確認 | `block.twig:24, block.twig:62` | RG-002 |  |
| m09-07 | カスタマイズ | 未実装疑い | (6)ファイル名は2つの正規表現でチェックし、マッチしない場合は「値が有効でない」とエラーメッセージを表示する: `/^[0-9a-zA-Z\/_]+$/` と `/^(?!.\/\/).+$/`（E | 乖離（Excel記載の連続スラッシュ禁止が現行に未実装）／要実機確認 | `BlockType.php:61, BlockType.php:71` | RG-039（§3 DV-10） |  |
| m09-07 | カスタマイズ | 未実装疑い | (8)コードは必須（Excel 0210:L2610 の必須欄=〇）であり、(10)登録を押下するとtwig構文のエラーチェックを行う（Excel 0210:L2610） | 乖離（Excel記載のコード必須・twig構文チェックが現行に未実装／詳細設計HTMLがExcelと相反）／要実機確認 | `BlockType.php:74, BlockType.php:76` | RG-039（§3 DV-13,14,15）, RG-060 |  |
| m09-07 | カスタマイズ | 未実装疑い | ブロックを新規登録する場合、日英2種類のファイルを作成する（Excel 0210:L2590,L2591）。(6)ファイル名を変更して更新する場合も日英2種類のtwigファイルを作成する（Excel  | 乖離（Excel記載の日英2ファイル作成が現行に未実装）／要実機確認 | `ContentController.php:244, BlockController.php:136` | RG-036,038 |  |
| m09-09 | 標準 | 移行退行疑い | リニューアル移行時の扱いとして、現行（pf-eccube3）にも本機能が存在する前提で対照表を掲げる — 「メンテナンス状態の保持／現行: ファイルシステム上の目印ファイル（DBではない）」「公開側停 | 乖離（移行対照表の現行列が現行リポで裏取れない＝実質「現行に該当機能なし・移行先で新規」の可能性）／要実機確認（現行の別環境・別ブランチにのみ存在する可能性を排除できないため断定しない） | `—` | RG-019（停止画面）・§1 状態の持ち方 |  |
| m09-10 | カスタマイズ | 移行退行疑い | 表示メッセージは「バナー画像の登録に失敗しました。」（S3保存結果が空のとき）と「バナーイメージファイルを指定してください。」（支店共通設定が無効で既存画像も新規画像もない状態で保存したとき）を別条件 | 乖離（メッセージ条件対応の退行・未選択時の固有文言が消失）／要実機確認 | `messages.ja.yaml:202, TopPageController.php:138, BranchTopPageController.php:236` | RG-015,016 |  |
| m09-10 | カスタマイズ | バグ候補 | 入力にCSRFトークンを含む（詳細設計 L360） | 乖離（現行のCSRF未検証＝セキュリティ上のバグ候補／移行先で是正）／要実機確認 | `TopPageController.php:67, BranchTopPageController.php:86` | RG-013,046 |  |
| m09-10 | カスタマイズ | 移行退行疑い | 「(1)支店で『支店共通』を選択されている場合、(2)支店共通設定を適用は選択できない」（0210:L2842） | 乖離（現行=0210:L2842のサーバ側担保なし／移行先で是正）／要実機確認 | `TopPageController.php:67, BranchTopPageController.php:81` | RG-012 |  |
| m09-10 | カスタマイズ | バグ候補 | (1)支店の初期値は「支店共通」（0210:L2909）。詳細設計は「id 省略時は0として扱う」（L325）「支店IDが0なら未選択」（L349）「支店IDが0 → チェックボックスdisabled | 乖離（支店共通識別子の 0→1 変更／ラベルと判定の参照元不一致＝バグ候補）／要実機確認（デプロイ時の `BASE_INFO_ID` 値） | `BaseInfoTrait.php:13, BaseInfo.php:45, BranchTopPageController.php:157` | RG-001,009,012 |  |
| m09-10 | カスタマイズ | バグ候補 | 「ファイル選択時は5MBまで、許可拡張子のみ」（詳細設計 L349,L370） | 乖離（現行の拡張子制約が意図どおり機能しない疑い＝バグ候補／移行先で是正・許可される集合も変化）／要実機確認 | `TopPageManagementType.php:69, BranchTopPageManagementType.php:74` | RG-030（DV-03,04,16） |  |
| m09-10 | カスタマイズ | 移行退行疑い | 「フォーム制約違反 フォームエラーとして扱う。コントローラの個別保存分岐では明示的な全体エラー集約を行わない」（詳細設計 L379）。現行は `handleRequest` 後に `isValid() | 乖離（詳細設計 L379「集約を行わない」との差・移行先で集約を追加）／要実機確認 | `BranchTopPageController.php:106` | RG-047 |  |
| m10-03 | 現行踏襲 | 移行退行疑い | 詳細設計 L322,L324,L367 は「移行先ではご利用規約はページ管理上の固定ページ（`dtb_page` の `help_agreement` ／テンプレート `Help/agreement` | 乖離（詳細設計の移行先記述が実装と一致しない／保持形態の変質）／要実機確認 | `HelpController.php:63, agreement.twig:20, messages.en.yaml:409` | RG-001,023 |  |
| m10-04 | 現行踏襲 | 移行退行疑い | 登録成功時は支払方法一覧（GET）へ戻る（詳細設計 L392,L344／現行pf plugin も一覧へ redirect） | 乖離（遷移先退行） | `PaymentController.php:173` | RG-010 |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 支払方法（method）はSymfony Length制約が無い（詳細設計 L365「Symfony Length制約は無し（DBはtext）」） | 乖離（詳細設計ハルシネーション・実装は上限あり） | `PaymentRegisterType.php:58, eccube.yaml:137` | RG-027(DV-15) |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | ロゴ非同期アップロードのルートは `POST /{admin_route}/setting/shop/payment/image/add`（詳細設計 L333,L348） | 乖離（詳細設計ハルシネーション・ルート名/実装方式相違） | `PaymentController.php:191` | RG-013,015,016 |  |
| m10-07 | 現行踏襲 | 移行退行疑い | （参考・バグではない既知差）削除方式は現行踏襲＝`del_flg` による論理削除（詳細設計 L325・現行 `pf-eccube3/src/Eccube/Repository/TaxRuleRepo | 既知差（設計に明記・退行ではない） | `—` | RG-012,024 |  |
| m10-08 | 現行踏襲 | 移行退行疑い | 現在行がnullのままPOSTされた場合はエラーメッセージを積み識別子なしの表示へリダイレクト（詳細設計 `…html:343`。Excelは未選択POSTに沈黙） | 乖離（移行先の退行・null参照でサーバエラーとなる疑い）／要実機確認 | `MallAutoMailController.php:91, MailController.php:159` | RG-018 |  |
| m10-09 | 現行踏襲 | 移行退行疑い | 店舗基本情報の取得クエリは Doctrine結果キャッシュを使用する（保持期間＝`doctrine_cache.result_cache.lifetime`）。現行踏襲（詳細設計 `m10-09_.. | 乖離（現行踏襲違反・結果キャッシュ退行）／要実機確認 | `BaseInfoRepository.php:165, ShopController.php:49, BaseInfoRepository.php:65` | RG-008,038 |  |
| m10-10 | 現行踏襲 | 移行退行疑い | 保存成功時の成功メッセージ文言は「CSV出力を設定しました。」（詳細設計 L360「日本語メッセージはロケール定義の確認値として『CSV出力を設定しました。』」＝現行踏襲・0209:L3222）。現行 | 乖離（現行踏襲違反・成功メッセージ文言の退行）／要実機確認 | `CsvController.php:160, messages.ja.yaml:1591` | RG-012 |  |
| m10-13 | カスタマイズ | 移行退行疑い | 出力列の順序は右リスト上の上から下への順を0起算の `rank` として保存する（詳細設計 `function_spec_html_preview/pf-eccube3/m10-13_admin_ba | 退行（バグ・機能の中核が無効化）: 利用者が「項目順序」で並べ替えても、保存される rank は dtb_csv 主キー昇順相当になり指定順が失われる。再現: 右リストを csv_id=7002→7001 の順で保存 → 期待 rank(7 | `CustomerCsvUpdateAction.php:77, CsvCsvExtensionEntityManager.php:38, CsvController.php:74` | RG-020, RG-041 |  |
| m10-13 | カスタマイズ | 移行退行疑い | 削除はCSRFトークンをフォーム名無しの既定トークン名で検証し、無効ならアクセス拒否例外となる（詳細設計 `…m10-13_…html:337`）。エラー処理表も「CSRF不一致（削除） アクセス拒否 | 退行（バグ・セキュリティ／CSRF保護の欠落）: 認証済み管理者に細工ページを踏ませると任意のカスタム定義を削除できる。トークン送出だけ残り検証が抜けた片側実装 | `CustomerCsvController.php:90, custom_csv.twig:254, CalendarController.php:135` | RG-029 |  |
| m10-15 | カスタマイズ | 未実装疑い | 識別ID:1-6「支店URL」を追加し、半角英数・スペース／必須○／最大値255文字の入力項目として登録できる（0209:L3685,L3729） | 乖離（カスタマイズ未実装・画面項目欠落／列長不足） | `BaseInfo.php:1088, ShopMasterType.php:56` | RG-008, §3-A DV-1-6-* |  |
| m10-15 | カスタマイズ | 移行退行疑い | Excel 画面項目（0209:L3720-3775）は緯度・経度を列挙していない | 乖離（現行項目の移行時廃止・移行設計で確定要）／要実機確認 | `ShopMasterType.php:247` | §3-C DX-02 |  |
| m10-15 | カスタマイズ | 未実装疑い | 権限について：編集権限を保持しているメンバーのみ登録・編集が可能／編集権限を保持していないメンバーは登録ボタンを押すことが不可能（0209:L3692,L3693） | 乖離（カスタマイズ未実装・認可欠落／縦深防御の穴） | `ShopController.php:45` | RG-005,006 |  |
| m10-15 | カスタマイズ | 未実装疑い | 登録時の処理について：登録完了時、初期在庫を作成する（0209:L3698） | 乖離（カスタマイズ未実装・在庫＝高リスク） | `ShopController.php:68` | RG-028, §3-C DX-07 |  |
| m10-15 | カスタマイズ | 未実装疑い | 管理者情報 3-1〜3-5（ログインID／パスワード／パスワード（確認）／所属／メールアドレス）を当画面で入力し、存在するメンバーの情報でシステム管理者を設定する（0209:L3764-3768） | 乖離（カスタマイズ未実装・画面項目欠落） | `ShopMasterType.php:56` | RG-024 |  |
| m10-15 | カスタマイズ | 未実装疑い | 識別ID:1-20「ショップアイコン」（0209:L3686,L3743）・1-21「ご当地晴れる屋くん」（0209:L3744）をボタンで画像選択して登録できる | 乖離（カスタマイズ未実装・画面項目欠落） | `BaseInfo.php:1193, ShopMasterType.php:56` | RG-014,015 |  |
| m11-03 | カスタマイズ | 未実装疑い | Excel: アクセス権限の管理をマトリックスで行い、セル内チェックボックスで権限を登録・解除する。権限のURLは該当セルのマスターデータから取得する（`0201:L1823,L1826-1827,L | リニューアル差（現行未実装・移行先実装済）／正本L327と整合 | `AuthorityController.php:40, AuthorityController.php:66` | §0 |  |
| m11-03 | カスタマイズ | 未実装疑い | 正本 L327 は「権限の複製」をリニューアル後（ec-cube-enterprise系）で追加される項目として列挙し、「pf-eccube3 には未実装」と断定する（L324,L327） | 乖離（正本の未実装断定が誤り＝設計記述誤り）／要実機確認 | `SettingServiceProvider.php:81, AuthorityController.php:115, AuthorityCopyType.php:28` | §0・§5 |  |
| m11-03 | カスタマイズ | 未実装疑い | Excel: 権限レベルはアクセス可／アクセス不可の2段階（`0201:L1830`）・閲覧列の追加（`0201:L1831`）・上位権限がアクセス可なら下位権限もアクセス可で編集不可（`0201:L | リニューアル差（現行未実装・既定可否が逆）／正本L327と整合 | `AuthorityVoter.php:66` | §0 |  |
| m11-03 | カスタマイズ | 移行退行疑い | 正本 L340「権限ロールを権限ID昇順、拒否URL昇順で一覧取得する」＝取得条件に絞り込みの記述なし／正本 L376 は `is_modifiable`（編集可否フラグ・既定 true）を移行先のみ | 乖離（移行時の一覧差・不可視ルール）／要実機確認 | `AuthorityRoleRepository.php:52, AuthorityRoleRepository.php:43` | RG-001,RG-039 |  |
| m12-01 | カスタマイズ | 未実装疑い | 売上集計用に検索項目に出力するフラグを店舗管理に持たせる（追加）（Excel `0211:L1052`・月別シートにも同旨 `0211:L1263`）。集計対象の店舗は店舗登録画面の公開状態が公開であ | 乖離（カスタマイズ要件の未実装・公開状態で代替）／要実機確認 | `BaseInfoRepository.php:203, BaseInfo.php:1548, SummaryType.php:109` | RG-011 |  |
| m12-03 | カスタマイズ | 未実装疑い | 集計対象(各店舗) チェックボックス（店舗毎）を追加し、店舗一覧から売上集計したい店舗にチェックを入れる。初期設定としてログインしたユーザーが所属している店舗にチェックが入った状態で表示される（Exc | 乖離（カスタマイズ要件の未実装）／要実機確認 | `SalesType.php:71, OrderDetailRepository.php:72, SalesController.php:30` | RG-005,006 |  |
| m12-03 | カスタマイズ | 未実装疑い | 店舗全選択/全解除 チェックボックスを追加し、集計対象(各店舗)の全チェックボックスと連動する（チェックONで全店舗ON・OFFで全店舗OFF）（Excel 0211:L2130・0211:L2131 | 乖離（カスタマイズ要件の未実装）／要実機確認 | `sales.twig:164` | RG-007 |  |
| m12-03 | カスタマイズ | 未実装疑い | 本店のほか、支店やスマレジの取引情報も集計対象として取り扱う（Excel 0211:L2138。前提: スマレジの取引データは基本的にリアルタイムに送信される 0211:L2137） | 乖離（カスタマイズ要件の未実装または前提未記載）／要実機確認 | `OrderDetailRepository.php:76` | RG-050 |  |
| m12-05 | カスタマイズ | 未実装疑い | 「検索条件をクリア」は識別ID 1〜12(2を除く)の入力内容をすべて初期値に戻す（Excel 0211:L3086）。初期値は依頼日From=当月1日（0211:L3077）・依頼日To=当月末日（ | 乖離（Excel要件違反・「初期値に戻す」未実装） | `function.js:187, product_request.twig:15` | RG-020 |  |
| m12-07 | カスタマイズ | 未実装疑い | 集計対象(通販)／集計対象(店舗) のチェックボックスを追加し、初期値はいずれもチェックON、必ず1つ以上チェック必須、両方チェックで「通販」「全店舗」両方を集計対象、どちらも未チェックなら集計を行わ | 乖離（カスタマイズ要件①未実装）／要実機確認 | `FormatSalesType.php:19, FormatSalesController.php:40, OrderRepository.php:1634` | RG-004〜007・DDT-TARGET |  |
| m12-07 | カスタマイズ | 未実装疑い | 本店のほか、支店やスマレジの取引情報も集計対象として取り扱う（Excel `0211:L3609`）。スマレジの取引データは基本的にリアルタイムに送信される（`0211:L3608`） | 乖離（カスタマイズ要件②未実装・集計対象の欠落）／要実機確認（支店・スマレジ売上の格納先） | `OrderRepository.php:1640, CheckSmaregiTransaction.php:31` | RG-008 |  |
| m12-08 | カスタマイズ | 移行退行疑い | 集計月はCSVダウンロードの送信値とし、検索条件セッションは参照しない（詳細設計 `function_spec_html_preview/pf-eccube3/m12-08_admin_analyti | 乖離（設計違反・条件の取得元の退行）／要実機確認 | `FormatSalesController.php:101, FormatSalesController.php:157` | RG-002 |  |
| m12-08 | カスタマイズ | 移行退行疑い | 成功時出力のファイル名は `format_sales_report_` に出力日時（`YmdHis`）を付けた `.csv`（詳細設計 `...csv_export.html:341`／Excel 0 | 乖離（現行踏襲違反・ファイル名の退行）／要実機確認 | `FormatSalesController.php:139, FormatSalesController.php:185` | RG-016,034 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 出力条件をセッションへ保持し、CSV出力で同条件を用いる（詳細設計 L321,L331,L334,L337,L342,L348,L363）。L315「出力条件のセッション保持・形式別CSV出力の挙動は | 乖離（現行踏襲違反・セッション保持/引き継ぎの消失＝設計の中核仕様が移行先に無い）／要実機確認 | `UsedCardController.php:14, UsedCardController.php:41` | RG-011,013,017,023 |  |
| m12-10 | 現行踏襲 | 移行退行疑い | 入力項目「出力条件（集計範囲の指定）」は 必須／任意＝任意、初期値＝未指定（詳細設計 L339） | 乖離（設計と実装の不一致・必須/初期値／移行先は現行より厳格化）／要実機確認 | `UsedCardType.php:33, SearchUsedCardType.php:43` | RG-020（§3 DV-05,DV-06） |  |
| m13-01 | カスタマイズ | 移行退行疑い | 開催日(From)>開催日(To)の場合はエラーとすること（Excel `0214:L1055`「3 開催日(From) 日付 - - 3か月前 開催日(From)>開催日(To)の場合エラー」） | 乖離（現行=Excel明示のエラー要件が未実装／移行先で対応済）／要実機確認 | `EventListType.php:30, SearchEventType.php:118` | RG-007・§3 DV-09 |  |
| m13-01 | カスタマイズ | 移行退行疑い | ★権限を保持している店舗のイベントのみ表示を可能とすること（Excel `0214:L1033`／`0214:L1041`「★ 権限による制御」） | 乖離（現行・移行先とも★表示制御が未実装＝Excel 0214:L1033 未達）／要実機確認 | `DtbEventRepository.php:39, DtbEventRepository.php:122, EventController.php:70` | RG-014 |  |
| m13-02 | カスタマイズ | 移行退行疑い | メンバーが編集権限を保持する店舗のイベントのみ登録・編集・削除可能、編集権限のない店舗選択はエラー、各操作ボタンは編集権限店舗のみ表示（Excel 0214:L1592,L1608,L1610,L16 | 乖離（現行未実装／移行先の更新は表示のみ強制）／要実機確認 | `EventController.php:57, EventController.php:306` | RG-021,022 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 削除対象が存在しないイベントは403、日程残のイベント削除は直前画面（referer）へ戻す（詳細設計 L363,L416＝現行踏襲。Excelは沈黙） | 乖離（移行先でHTTP/遷移先が現行と相違） | `EventController.php:162, EventController.php:304` | RG-011,012 |  |
| m13-02 | カスタマイズ | 移行退行疑い | イベント規模（event_scale_id）・フリー入力エリア（free_text_area1〜3）・定員接尾辞 人/組・チーム戦フラグ（is_team_battle）等のカスタマイズ追加項目（Exc | 乖離（現行未実装・移行先は一部実装）／要実機確認 | `EventEditAction.php:61, EventDetailType.php:147` | RG-031,033,034 |  |
| m13-03 | 現行踏襲 | 未実装疑い | ★権限による制御: メンバーが権限を保持している店舗のイベントのみ日程追加が可能にする（Excel 0214:L2185,L2186／カスタマイズ要件 0214:L2182「編集権限を保持している店舗 | 乖離（★カスタマイズ要件 未実装・認可欠落）／要実機確認 | `ScheduleController.php:26` | RG-012,013 |  |
| m13-03 | 現行踏襲 | 未実装疑い | ★定員の接尾辞: 識別ID:15「定員」の接尾辞は、親イベントの「チーム戦」設定がオフの時は「人」、オンの時は「組」に切り替える（Excel 0214:L2192,L2214） | 乖離（★カスタマイズ要件 未実装）／要実機確認 | `schedule.twig:175` | RG-008,009 |  |
| m13-04 | 現行踏襲 | 未実装疑い | ★メンバーが権限を保持している店舗のイベントのみ日程追加が可能（Excel 0214:L2456・カスタマイズ要件 0214:L2452） | 乖離（★カスタマイズ pf未実装／enterprise実装済み） | `RepeatScheduleController.php:29, RepeatScheduleController.php:48` | RG-004 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | ★カスタマイズ要件: 権限を保持している店舗のイベントのみ編集を可能とする（`excel_to_html/output/0214_基本設計仕様書(イベント管理).html:3675`）＝編集権限のある | 乖離（詳細設計の★要件記載漏れ／現行はカスタマイズ未適用・移行先のみ充足）／要実機確認（混在選択時に全体拒否か権限内のみ更新かはExcelが未規定） | `EntryController.php:607, EntryStatusBulkUpdateAction.php:47, Member.php:78` | RG-001,002,003 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | 入口のURLエンドポイントは `POST /{admin_route}/entry/bulkupdate`（非同期）（`m13-07_admin_event_event_entry_bulk_upda | 乖離（詳細設計 L318 と L325 の内部不整合／移行先のパス変更・現行踏襲差）／要実機確認 | `EntryServiceProvider.php:75, EntryController.php:310` | RG-033 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | 非同期リクエストでない場合は失敗メッセージのJSONを返す（`m13-07_admin_event_event_entry_bulk_update.html:319`・`:326` 第2段・`:359 | 乖離（現行踏襲違反・移行先で非同期ガードが消失／設計 L319,L326,L359 の第2段が移行先で未充足）／要実機確認 | `EntryController.php:595, EntryController.php:310` | RG-006,013 |  |
| m13-08 | カスタマイズ | 未実装疑い | 権限を保持している店舗のイベントのデッキのみ表示を可能とする（Excel カスタマイズ要件 `0214:L3842`） | 未実装（カスタマイズ要件未達・権限外店舗のデッキが閲覧可能＝認可の穴）／要実機確認 | `DtbDeckRepository.php:682, EntryListType.php:146, EntryController.php:754` | RG-004 |  |
| m13-08 | カスタマイズ | 移行退行疑い | デッキリストをタイプ別にソートして表示する（Excel カスタマイズ要件 `0214:L3843`・`0214:L3849`・画面項目 `0214:L3869`） | 乖離（現行=カスタマイズ要件未達／移行先=充足）／要実機確認 | `CardUtil.php:34, decklist.twig:32, EntryDeckListDisplayBuilder.php:186` | RG-011 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 識別ID:5 の項目を削除する（Excel カスタマイズ要件 `0214:L3845`・`0214:L3852`／正本 superseded L303,L330） | 乖離（現行=削除要件未達／移行先=充足だが未使用データ残置）／要実機確認 | `EntryController.php:794, decklist.twig:24, EntryDeckListDisplayBuilder.php:143` | §0・RG-005 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 識別ID:9-11 の記入欄を削除する（Excel カスタマイズ要件 `0214:L3853`／正本 superseded L303,L329） | 乖離（現行=削除要件未達／移行先=充足）／要実機確認 | `decklist.twig:49` | §0・RG-005 |  |
| m13-08 | カスタマイズ | 移行退行疑い | サイドボードを先頭ページに載せ、サイド枚数を見出しに表示する（現行踏襲＝`0214:L3846`／詳細設計 L346,L349,L352「サイドボードは先頭ページにのみ表示」・L332「現行・移行先で | 乖離（移行先=現行踏襲違反・サイドボード欠落）／要実機確認 | `EntryController.php:777, decklist.twig:39, EntryDeckListDisplayBuilder.php:137` | RG-017,RG-018 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 識別ID:2「Name」はプレイヤー名を表示。デッキのプレイヤー名を前後空白除去して用い、空のときのみ会員のカナ姓・カナ名で代替（Excel `0214:L3863`／現行踏襲＝`0214:L3846 | 乖離（移行先=現行踏襲違反・プレイヤー名の決定順逆転）／要実機確認 | `EntryController.php:793, EntryDeckListDisplayBuilder.php:338` | RG-006,RG-007 |  |
| m13-09 | カスタマイズ | 未実装疑い | Excelカスタマイズ要件「権限を保持している店舗のイベントのみ表示を可能とする」（0214:L4102・★カスタマイズ項目） | 乖離（カスタマイズ要件の未実装/未反映の疑い・権限外店舗のデータ露出リスク）／要実機確認 | `DtbEntryPlayerRepository.php:148, EntryController.php:356` | RG-004 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 出力時は「ソートを default・並び順を ASC に固定する」（詳細設計 L325）／「出力時はソート default・昇順に固定する」（L330） | 乖離（移行先の並び順固定の退行）／要実機確認 | `EntryController.php:848, EntryController.php:368` | RG-005 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 「会員は論理削除済みでも対象に含め、プレイヤーはソフトデリート無効化で対象に含める」（詳細設計 L325）／「会員・プレイヤーはソフトデリート無効化により論理削除済みでも出力対象に含める」（L337） | 乖離（移行先の出力対象欠落の疑い・現行踏襲違反）／要実機確認 | `EntryController.php:816, EntryController.php:351, EventEntryCsvExportService.php:42` | RG-020,021 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 入口は `GET /{admin_route}/entry/export`・`GET /{admin_route}/entry/{eventDetailId}/export`・`GET /{admin | 乖離（移行先の入口URL差・詳細指定エクスポートの導線欠落の疑い）／要実機確認 | `EntryServiceProvider.php:44, EntryController.php:350, EventEntryBulkCsvController.php:156` | RG-002,014,016,017 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 更新時、支払会員は更新対象から除外する（詳細設計 `function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit. | 乖離（移行先で支払会員が更新される＝更新対象外の退行）／要実機確認 | `EntryUpdateAction.php:54, EntryController.php:526` | RG-016 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 申込は複数参加者（チーム戦）を持ち、参加者の登録・削除ができる（Excel `:4312`「イベント申込情報の詳細表示と、申込状況の変更、プレイヤーの登録・削除ができる。」／`:4313-:4314` | 乖離（移行先でチーム複数参加者の編集が不可＝機能退行）／要実機確認 | `EntryController.php:296, EventEntryDetailType.php:60, EntryUpdateAction.php:45` | RG-008,025,026,027 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 更新成功時のフラッシュ文言は「登録が完了しました。」（詳細設計 `:375`。Excelは文言を規定せず沈黙＝現行踏襲 `:4298`） | 乖離（現行踏襲の成功文言が移行先で変化）／要実機確認 | `EntryController.php:286, messages.ja.yaml:1591, EntryController.php:579` | RG-018 |  |
| m13-11 | 現行踏襲 | 移行退行疑い | 開催日(From)の初期値は当日（Excel 0214:L4576「★ 開催日(From)に当日の日付を初期表示する」・0214:L4590 初期値列=当日・0214:L4570「期間絞り込みに初期情 | 乖離（現行=カスタマイズ未反映／移行先モーダル版=Excel初期値と不一致）／要実機確認 | `EventListType.php:51, config.yml:376, EntryRegisterSearchType.php:58` | RG-009 |  |
| m13-11 | 現行踏襲 | 未実装疑い | 開催日(From)>開催日(To)の場合はエラー（Excel 0214:L4590） | 乖離（現行=エラー未実装・From>To でエラーにならず0件になりうる）／要実機確認 | `EntryController.php:194, EventListType.php:45, EntryRegisterSearchType.php:87` | RG-004・DV-11 |  |
| m13-11 | 現行踏襲 | 移行退行疑い | 直接検索はイベントIDで1件を取得する（詳細設計 L331,L337／Excel 0214:L4657,L4663）。検索フォームのCSRFは正本に規定なし | 乖離（直接検索の「ID」の意味が現行=日程ID／設計・移行先=イベントIDで不一致・CSRF有無も差）／要実機確認 | `EntryController.php:281, EventListType.php:23, EntryController.php:467` | RG-024 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 支払金額は参照のみ（Excel 0214:L4969「支払金額の項目は参照のみとする」／0214:L5001 数値(整数)）。画面から編集させず、イベントの参加費を登録する | 乖離（現行=カスタマイズ未反映／詳細設計=記述が刷新要件を反映せず。移行先は要件充足）／要実機確認 | `EntryDetailType.php:57, EventEntryDetailType.php:109` | RG-005,023,028・DV-06 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 登録成功後の遷移先。Excel 画面遷移一覧は「登録」→「イベント申込登録」（0214:L4957。イベント申込登録＝M13-11 イベント申込登録一覧・0214:L4620,0214:L5009） | 乖離（Excel／詳細設計／移行先の三者不一致・遷移先未確定）／要実機確認 | `EntryController.php:480, EntryRegistrationController.php:176` | RG-033 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 参加プレイヤー情報は必須（詳細設計 `m13-12_admin_event_event_entry_register.html:351`「参加プレイヤー情報 必須」／`:370`「参加プレイヤー情報  | 乖離（現行=設計の「必須」がサーバ側未強制。直POSTで致命エラーに到達しうる／移行先は是正済み）／要実機確認 | `EntryDetailType.php:74, EntryDuplicateValidator.php:31, EntryController.php:456` | RG-029・DV-02,DV-08 |  |
| m13-12 | カスタマイズ | 設計誤り疑い | 申込状況の初期値は「申込済み」・支払方法の初期値は「管理者追加」（Excel 0214:L4999,0214:L5000） | 乖離（詳細設計のラベル表記が不正確。Excel＝「申込済み」「管理者追加」が正・値の固定登録自体は現行/移行先とも整合）／軽微 | `MtbEntryStatus.php:14, Version20180323142300.php:43, Payment.php:23` | RG-003,004,021,022 |  |
| m13-13 | カスタマイズ | 未実装疑い | 親イベント情報に支払方法（クレジットカード決済）の設定がないのに日程情報のオンライン受付が「あり」かつ参加費が有料とされている場合はエラーとする（Excel `excel_to_html/output | 乖離（Excel固有業務ルールの未実装＝カスタマイズ仕様欠落）／要実機確認 | `BulkEntryImportHandler.php:226, RequireWhenYesValidator.php:57, BulkEntryImportHandler.php:349` | RG-026 |  |
| m13-14 | 現行踏襲 | 移行退行疑い | 表示店舗（識別ID:6）は★カスタマイズとして 店舗複数選択のセレクトボックス（Excel `excel_to_html/output/0214_基本設計仕様書(イベント管理).html:5599,5 | 乖離（現行=Excel★カスタマイズ未適合／移行先=適合・差分は設計どおり） | `BannerType.php:104, EventBannerSettingType.php:138, banner.twig:69` | RG-009 |  |
| m13-14 | 現行踏襲 | 移行退行疑い | 画像URL（識別ID:4）の書式・制限は 半角、最大値255文字、「admin.hareruyamtg.com」を含む文字列は使用不可（Excel `:5617`） | 乖離（現行=Excel「半角」未適合／移行先=設計外の追加制約）／要実機確認 | `EventBannerSettingType.php:95, BannerType.php:57, eccube.yaml:137` | RG-005(DV-05) |  |
| m13-14 | 現行踏襲 | 移行退行疑い | エンドポイントは GET/POST `/{admin_route}/banner/event`(`/{html_class}`)・DELETE `/{admin_route}/banner/event | 乖離（設計URLと移行先実装の不一致）／要実機確認 | `BannerServiceProvider.php:19, BannerController.php:57` | RG-017,018,020,022,035 |  |
| m13-15 | カスタマイズ | 未実装疑い | 画像設定メニュー自体を、イベント管理のメニュー下に移動する（Excel 0214:L5783 カスタマイズ要件） | 未実装（カスタマイズ要件未反映・メニュー配置）／要実機確認 | `SidebarProvider.php:436` | RG-039 |  |
| m13-15 | カスタマイズ | 未実装疑い | S3のイベントバナー画像参照先・アップロード先をイベントバナー用フォルダに変更する（TOPバナー用フォルダとは別）（Excel 0214:L5782,0214:L5791） | 未実装（カスタマイズ要件未反映・フォルダ分離）／要実機確認 | `BannerController.php:20, S3AccessService.php:104` | RG-002,036,037 |  |
| m13-15 | カスタマイズ | 未実装疑い | 店舗（識別ID:1）はメンバーが権限を保持している店舗のみ表示する（Excel 0214:L5788,0214:L5803「編集権限のある店舗のみ表示」） | 未実装（カスタマイズ要件未反映・権限による表示絞り込み）／要実機確認 | `BannerController.php:51, banner.twig:174` | RG-025,027 |  |
| m13-15 | カスタマイズ | 未実装疑い | 編集権限のない店舗が選択された場合エラーとする（Excel 0214:L5803）／権限を保持している店舗のみ登録が可能とする（0214:L5781,0214:L5786） | 未実装（カスタマイズ要件未反映・登録権限の欠落＝縦深防御の穴）／要実機確認 | `BannerController.php:168` | RG-023,024 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★固有色で検索を可能とする。固有色は複数選択（白/青/黒/赤/緑/無色）で、選択していない色を除外条件(NOT検索)として絞り込む（Excel 0208:L1028,L1058,L1084） | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `SearchCardType.php:38, MtbCardRepository.php:52, SearchCardType.php:61` | RG-006,007 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★Foilの種別で検索を可能とする。Foilは複数選択（なし/通常/特殊）で、選択したものをOR条件で絞り込む（Excel 0208:L1025,L1066,L1068,L1096） | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `SearchCardType.php:38, SearchCardType.php:174, MtbCardRepository.php:296` | RG-022 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★フレームの種類で検索を可能とする。フレームは複数選択（通常/特殊）で、選択したものをOR条件で絞り込む（Excel 0208:L1026,L1066,L1069,L1097） | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `SearchCardType.php:38, SearchCardType.php:186, MtbCardRepository.php:300` | RG-023 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★リーガリティ（使用可/制限/禁止の複数選択）を新規追加し、使用可能フォーマット選択時のみ選択可、選択すると「使用可」が選択状態になり、カードに登録された使用可能フォーマットのリーガリティで絞り込む（ | 乖離（現行未実装／移行先で条件式は充足するが活性制御・初期選択が未確認）／要実機確認 | `SearchCardType.php:151, MtbCardRepository.php:145, SearchCardType.php:161` | RG-018,019,020,021 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★マナ・コストは「数値範囲入力」から「テキストボックス」の検索に変更する（Excel 0208:L1029,L1049,L1083） | 乖離（現行未実装／移行先の照合方式が仕様未定義）／要仕様確認・要実機確認 | `SearchCardType.php:77, MtbCardRepository.php:130, SearchCardType.php:70` | RG-008・§3 DV-08 |  |
| m14-01 | カスタマイズ | 移行退行疑い | ★カラーを選択して検索する場合、選択したものをOR条件で絞り込む（Excel 0208:L1066,L1067） | 乖離（詳細設計HTMLがExcelと矛盾・現行はExcel要件違反／移行先で充足）／要実機確認 | `MtbCardRepository.php:116, MtbCardRepository.php:232` | RG-004 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 複合キーワードは半角・全角スペースおよびカンマで分割した各トークンを、カード名(日/英)・ルールテキスト(日/英)へ部分一致させ、トークン間は AND（Excel 0208:L1044-L1048 が | 乖離（現行踏襲違反・移行先の退行）／要実機確認 | `MtbCardRepository.php:225, MtbCardRepository.php:66` | RG-001,002・§3 DV-05 |  |
| m14-02 | カスタマイズ | 移行退行疑い | 出力列は識別ID 1〜37 のうち 29「Foilフラグ」・32「プロモフラグ」を除去した 35列。14「固有色」・19「使用制限フォーマット」・20「使用禁止フォーマット」・30「Foil(0/1/ | 乖離（現行=カスタマイズ未適用／移行先=Excel適合）。詳細設計HTML L340・L342 の列一覧が Excel カスタマイズに追随しておらず、正本として使うと設計違反の期待を生む | `CardCsvController.php:136, CardCsv.php:273, CardCsv.php:65` | RG-009,010,018／DDT-A |  |
| m14-02 | カスタマイズ | 移行退行疑い | 18「使用可能フォーマット」はリーガリティに「使用可」で登録されたものだけを `,` 区切り出力し、「制限」は19、「禁止」は20へ振り分ける（`0208:L1744-1746`） | 乖離（現行=リーガリティ絞り込み未実装／移行先=Excel適合） | `CardCsv.php:240, CardCsv.php:337, MtbRestriction.php:31` | RG-015／DDT-C |  |
| m14-02 | カスタマイズ | 移行退行疑い | 入口は POST `/{admin_route}/card/csvexport`（詳細設計 L319,L402）・CSRF トークンフィールドは付かない（L324） | 乖離（移行先・入口パス/ルート名/CSRF の変更）。Excel は入口パスとCSRFに沈黙／要実機確認 | `CardCsvController.php:143, card.twig:175` | RG-004,008 |  |
| m14-02 | カスタマイズ | 移行退行疑い | 未選択時メッセージキー（詳細設計 L328,L365,L376＝`admin.csv.error.export.card`） | 乖離（移行先・メッセージキー差＋クライアント側ガード追加）。表示文言はExcel適合／要実機確認 | `CardCsvController.php:150, messages.ja.yaml:2445, index.twig:57` | RG-030 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 入口は `POST /{admin_route}/card/delete`（L317,L397）。同一検索フォームの「一括削除」ボタンが `formaction` で当ルートへ差し替えて送信する（L3 | 乖離（現行踏襲違反・入口のHTTPメソッド/パス退行）／要実機確認 | `CardController.php:308, CardServiceProvider.php:34, index.twig:357` | RG-001,042 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | チェック未選択（`cardIds` 未送信）はフラッシュを付けず一覧へリダイレクトする（L317「フラッシュ無しで一覧へリダイレクトする」・L326 手順4・L334 順序2「無ければリダイレクトのみ | 乖離（現行踏襲違反・未選択時のフラッシュ有無退行）／要実機確認 | `CardController.php:318, CardController.php:172, index.twig:57` | RG-005,006 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 削除ブロック（デッキ採用または論理未削除商品あり）は、エラーフラッシュを積み、その時点で打ち切って 部分削除分を支店通知し `Referer` へリダイレクトする。フラッシュは 1 件分のエラーのみ（ | 乖離（現行踏襲違反・ブロック時の打ち切り→継続への退行）／要実機確認 | `CardController.php:330, CardController.php:184` | RG-008,009,012,013,020 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 削除前にネイティブ更新で、当該カードのカード詳細に結び付いていた商品規格の `card_detail_id` を NULL に切り離す（販売商品の親子構造は維持し印刷版参照だけ外す）。移行先では `d | 乖離（設計記述と移行先実装の不一致・NULL切り離しの欠落）／要実機確認 | `CardController.php:336, MtbCardRepository.php:400, CardController.php:191` | RG-015,016,049 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 削除ブロック時の遷移先は `Referer` ヘッダの URL（L366・L326 手順6・L371） | 乖離（現行踏襲違反・ブロック時Referer遷移と空page_no分岐の退行）／要実機確認 | `CardController.php:316, CardController.php:166, CardController.php:189` | RG-013,014,006 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 削除可否判定は「デッキ採用件数」と「論理未削除の商品がカード詳細経由で存在するか」の 2 点。買取系テーブルはこの問い合わせに含まれない（L328・L326 手順6・L334 順序4,5） | 乖離（意図と実装の不一致・買取紐付けカードの誤削除リスク／現行・移行先の双方に残存）／要実機確認 | `MtbCardRepository.php:301, CardController.php:235, MtbCardRepository.php:390` | RG-011 |  |
| m14-04 | カスタマイズ | 未実装疑い | 保存成功時・削除成功時は対象カード ID の配列で支店連携の更新通知を呼び、成否をログと支店更新エラー永続化に記録する（詳細設計 `m14-04_...html:329`（手順11）・`:331`・` | 乖離（現行踏襲違反・支店連携の欠落＝連携未実装）／要実機確認 | `CardController.php:14` | RG-043,044,045,046 |  |
| m14-05 | カスタマイズ | 移行退行疑い | 支店更新通知は現行踏襲で維持。Excelカスタマイズ要件に支店通知の廃止は無く「カスタマイズ要件に記載の内容以外は現行踏襲とする」（`excel_to_html/output/0208_基本設計仕様書 | 乖離（現行踏襲違反・支店連携の退行）／要実機確認（M14-05の取込で支店へ通知されず支店側カードが更新されない疑い。意図的な移設なら設計への明記が必要） | `CardCsvController.php:87, CardCsvController.php:74` | RG-031,032 |  |
| m14-05 | カスタマイズ | 未実装疑い | TSVアップロードを廃止し、TSVファイルがアップロードされた場合はエラーとする処理を追加する（`0208:2269`／`0208:2280`／`0208:2281`／`0208:2296`／`020 | カスタマイズ未実装（現行・想定内）／移行先は適合。ただし移行先も `ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:189` に `tsv` → タブ区切りの | `CardCsvController.php:96, csv_card.twig:5, base_csv_upload.twig:20` | RG-002,003,005,038 |  |
| m14-06 | 現行踏襲 | 移行退行疑い | 画像ダウンロード(セット別)/(言語別)は押下するとダウンロード処理を実施する（Excel `:2610`・`:2611`）。詳細設計は未選択時に確認を出し「肯定時に tre を返す記述がある（識別子 | 乖離（現行実装のタイプミス由来バグ・移行先で解消）／要実機確認 | `card_set.twig:26, index.twig:40` | RG-034 |  |
| m14-07 | 現行踏襲 | 未実装疑い | セット別で複数言語がある場合、英語を優先的に選択する（実装コメントが宣言する意図。Excelはセット別の言語選択に沈黙） | 乖離（宣言意図と実装の不一致・英語優先が未実装）／要実機確認 | `MtbCardImageRepository.php:184, MtbLanguage.php:16, CardSetController.php:356` | RG-010, RG-008 |  |
| m14-08 | カスタマイズ | 移行退行疑い | 削除は事前に「紐づくカード詳細が1件でもあれば削除しない」と判定し、該当時はエラーを積んで Referer へ戻す（詳細設計 L320「mtb_card_detail が当該 cardset_id で | 乖離（現行踏襲違反・データ損失を伴う退行）／要実機確認 | `CardsetController.php:198` | RG-030,031 |  |
| m14-10 | カスタマイズ | 未実装疑い | フォーマット名(日)は最大文字数 1~64（Excel 0208:L3878／詳細設計 L342「64 文字」／現行踏襲原則 0208:L3806） | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `FormatType.php:58, FormatType.php:32` | RG-045(DV-03,04) |  |
| m14-10 | カスタマイズ | 未実装疑い | フォーマット名(英)は最大文字数 1~64（Excel 0208:L3879／詳細設計 L342） | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `FormatType.php:68, FormatType.php:47` | RG-045(DV-07,08) |  |
| m14-10 | カスタマイズ | 未実装疑い | フォーマットコードは最大文字数 1~10（Excel 0208:L3880／詳細設計 L342「10 文字」） | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `FormatType.php:82, FormatType.php:61` | RG-045(DV-10,11)・RG-048(DV-40) |  |
| m14-10 | カスタマイズ | 未実装疑い | 並び順は必須かつ整数レンジ 1~10000（Excel 0208:L3881／詳細設計 L342「整数レンジ 1～10000」） | 乖離（現行踏襲違反・レンジ検証の未実装）／要実機確認 | `FormatType.php:96, FormatType.php:70, config.yml:238` | RG-046(DV-16,17) |  |
| m14-10 | カスタマイズ | 未実装疑い | メタゲーム分析日数は必須（Excel 0208:L3896 必須〇／詳細設計 L342「NotBlank、Range」） | 乖離（現行踏襲違反・必須検証の未実装）／要実機確認 | `FormatType.php:272, FormatType.php:218` | RG-044(DV-27) |  |
| m14-10 | カスタマイズ | 未実装疑い | ルール説明(日)/(英)は最大文字数 65535（Excel 0208:L3897,L3898／詳細設計 L342「65535 文字」） | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `FormatType.php:289, FormatType.php:236, config.yml:229` | RG-045(DV-32〜35) |  |
| m14-10 | カスタマイズ | 未実装疑い | メタゲーム分析日数の初期値は 14（Excel 0208:L3896 初期値列／詳細設計 L342「新規エンティティは定数上 14 日が既定」） | 乖離（初期値14の未実装）／要実機確認 | `MtbFormat.php:312` | RG-005 |  |
| m14-10 | カスタマイズ | 移行退行疑い | 一覧は並び順昇順、次に ID 昇順で全件取得する（詳細設計 L316,L323） | 乖離（既定並び順の退行・同順時の順序不定）／要実機確認 | `FormatController.php:45` | RG-001 |  |
| m15-01 | カスタマイズ | 移行退行疑い | 初期表示（GET 一覧）では検索条件・ページ関連セッションを削除し、`page_count` は設定 default_page_count（詳細設計 L322,L389／Excel は表示件数に沈黙の | 乖離（既定表示件数の退行・セッションキー接頭辞の不整合）／要実機確認 | `DeckController.php:114, SearchControllerTrait.php:108` | RG-032,035,036,048 |  |
| m15-02 | 現行踏襲 | 移行退行疑い | 未選択でサーバ到達時は現行踏襲＝`admin.csv.error.export.require` をフラッシュし Referer へリダイレクト（詳細設計 `:322`,`:367`／現行 `pf-e | 乖離（現行踏襲違反・メッセージキーと戻り先の退行）／要実機確認 | `messages.ja.yaml:4373, DeckController.php:687` | RG-009, DV-01 |  |
| m15-02 | 現行踏襲 | 移行退行疑い | DB未ヒット時は現行踏襲＝`RuntimeException` で `admin.csv.error.export.not_registered` を送出し catch→フラッシュ→Referer（詳 | 乖離（現行踏襲違反・エラー識別性の退行）／要実機確認 | `DeckController.php:699` | RG-010, DV-04 |  |
| m15-03 | 現行踏襲 | 移行退行疑い | CSRF無効はアクセス拒否（HTTP 403）となる例外を投げる（L324 手順2・L332 順序1・L349「CSRF 失敗は HTTP 403」・L359・L370）。現行は一致（`pf-eccu | 乖離（現行踏襲違反・CSRF失敗時ステータス退行）／要実機確認 | `DeckController.php:143` | RG-010,029・DV-08 |  |
| m15-06 | カスタマイズ | 未実装疑い | TSVアップロードを廃止し（0212:L2491）、「ファイル拡張子「TSV」をエラー扱いにする処理を追加」する（0212:L2513）。画面表記からも「TSV」文言を除去（0212:L2509,02 | カスタマイズ未反映（TSV廃止・拡張子エラー化が未実装）／要実機確認 | `AbstractCsvService.php:156, CsvImporter.php:162, DeckCsvController.php:12` | RG-002,031 |  |
| m15-06 | カスタマイズ | 未実装疑い | 「厳密にチェックする」チェックボックスを削除し（0212:L2492,0212:L2510,0212:L2526）、「「厳密にチェックする」が有効な場合に実行されている処理を除去する」（0212:L2 | カスタマイズ未反映（項目削除・厳密処理除去が未実装）。かつ 0212:L2504 の枚数チェックが現行では厳密時のみ有効＝§6の要仕様確認と直結／要実機確認 | `DeckCsvController.php:27, DeckCsv.php:89, DeckCsv.php:21` | RG-003,026 |  |
| m15-06 | カスタマイズ | 未実装疑い | CSV項目の除去と追加: 「win_count（勝利数）」「loss_count（敗北数）」「draw_count（引分数）」をファイルフォーマットから除去（0212:L2511,0212:L2690 | カスタマイズ未反映（項目除去5件・追加1件が未実装）／要実機確認 | `DeckCsvController.php:184, DeckCsv.php:122, DeckCsv.php:566` | RG-004,016,033 |  |
| m15-07 | 現行踏襲 | 移行退行疑い | 表示順の有効範囲は 1〜999999（詳細設計 `function_spec_html_preview/pf-eccube3/m15-07_admin_deck_deck_tag_list.html: | 乖離（現行実装の欠陥・設計が有効とする値が保存不能／移行先は解消）／要実機確認 | `Plugin.HareruyaEc.Entity.MtbDeckTag.dcm.yml:40, config.yml:100, DeckTagType.php:58` | RG-029(DV-10) |  |
| m15-08 | カスタマイズ | 移行退行疑い | アーキタイプ選択肢のラベルは「日本語名とフォーマット日本語名を組み合わせた文字列」（詳細設計 `…m15-08_admin_deck_deck_archetype_search.html:333`＝現 | 乖離（現行踏襲違反・選択肢ラベルの退行）／要実機確認 | `SearchDeckType.php:66, SearchDeckType.php:86` | RG-008 |  |
| m15-08 | カスタマイズ | 移行退行疑い | フォーマット・色の変更に応じてアーキタイプ選択肢を絞る連動フィルタ（8手順）が動作する（詳細設計 `…m15-08_admin_deck_deck_archetype_search.html:318` | 乖離（現行踏襲違反・フロント連動の未移行。本機能の中心的挙動が欠落）／要実機確認 | `SearchDeckType.php:69, deck-search.js:50, SearchDeckType.php:84` | RG-011〜014, RG-016 |  |
| m15-09 | カスタマイズ | 移行退行疑い | 削除失敗（関連デッキあり）はエラーフラッシュ `admin.archetype.delete.failed` を積み `admin_archetype_search` のページ番号1へ（詳細設計 `: | 乖離（現行踏襲違反・削除失敗時の遷移先退行）／要実機確認 | `ArchetypeController.php:191` | RG-027 |  |
| m15-09 | カスタマイズ | 未実装疑い | 代表カード検索は、完全一致検索が未選択なら半角スペース・全角スペース・カンマで分割した単語で AND LIKE 検索（カード名 `0212:L2073`／テキスト `0212:L2074`。現行実装  | 乖離（Excel記載の分割AND LIKE未実装・検索結果が変わる）／要実機確認 | `ArchetypeController.php:277` | RG-033, RG-034 |  |
| o01-01 | カスタマイズ | バグ候補 | 詳細更新はステータス・買取合計・査定担当者・更新日時と「成立日時またはキャンセル日時」を保存（L335 step8） | 乖離（実装バグ候補・非成立=一律キャンセル日時）／要実機確認 | `OtcBuyOrderController.php:208` | RG-011,013 |  |

## §2. 新規P2（一般乖離）（1,104件）

| 機能 | 区分 | 分類 | 設計（あるべき） | 判定（実装との食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 乖離 | 抽出時に「在庫変動区分が02:取引/12:返品」でかつ未保存のIDを抽出する（0501:L1499,L1513）＝抽出段でも区分を絞る | 乖離（抽出条件の実装位置差・非対象区分の反復enqueue） | `SmaregiStockBackfillAction.php:228, SmaregiStockChangeApplier.php:44` | RG-004,014 |  |
| a01-02 | 新規実装 | 乖離 | 抽出時に「店頭受取のデータではない」もののみ抽出する（0501:L1514） | 乖離（抽出条件の実装位置差・OTCの反復enqueue） | `SmaregiStockBackfillAction.php:228, SmaregiStockChangeApplier.php:108` | RG-005 |  |
| a02-01 | 現行踏襲 | 乖離 | エンドポイントURLは `/api/popup/product/{言語コード}/{商品ID}`（Excel `excel_to_html/output/0502_基本設計仕様書(API_商品管理).h | 乖離（エンドポイント表記差・`/api` 接頭辞の付与主体が不明）／要実機確認 | `routes.yaml:85` | RG-001,016 |  |
| a02-01 | 現行踏襲 | 乖離 | APIサーバが受ける言語コードは `ja` もしくは `en`（Excel `:997` 「言語コード stg 〇 2 ja jaもしくはenのいずれか」）。EC-CUBEサーバURLでは `jp`  | 乖離（Excel設計の `ja` と実装/詳細設計の `jp` が不一致・差し替え仕様の実在も未確認）／要実機確認 | `DtbProductSubClassRepository.php:17` | RG-011,020／DV-01,02,03 |  |
| a02-01 | 現行踏襲 | 乖離 | `price01` は数値(整数)かつ (未使用)（Excel `:1020`）。レスポンスサンプルでも `"price01": null`（Excel `:1040`） | 乖離（Excel=未使用/null に対し実装は商品規格の値を返す）／要実機確認 | `DtbProductSubClassRepository.php:56, ProductController.php:61` | RG-005 |  |
| a02-01 | 現行踏襲 | 乖離 | 抽出条件は「言語・商品IDを元に」（Excel `:980`）＋「シングルカードのみ・グッズ・サプライは出力できない」（Excel `:987-988`）。詳細設計も「当該商品ID・言語のポップアップ | 乖離（オラクル未規定の抽出条件・選択優先順位が実装に存在＝設計未記載／シングルカード限定の実現方式も未記載）／要実機確認 | `DtbProductSubClassRepository.php:35` | RG-010,012 |  |
| a02-01 | 現行踏襲 | 乖離 | `foilFlg` は 文字型・Foilフラグ（Excel `:1028`） | 乖離（Excelの型定義「文字型」とExcel自身のサンプル/詳細設計の boolean が不一致＝Excel型定義の誤記疑い）／要実機確認 | `DtbProductSubClassRepository.php:65` | RG-003 |  |
| a02-02 | 現行踏襲 | 乖離 | レスポンスデータは `foilFlg`（文字型・Foilフラグ・`0502:L1224`）と `productUrl`（文字型・商品詳細URL・`0502:L1226`）を含む。概要も「言語・カードI | 乖離（Excel規定フィールドの欠落／Excel内部矛盾）／要実機確認 | `DtbProductSubClassRepository.php:129` | RG-009 |  |
| a02-02 | 現行踏襲 | 乖離 | `price01` は数値(整数)で (未使用)（`0502:L1216`）。Excelサンプルも `"price01": null`（`0502:L1236`） | 乖離（未使用項目の実値返却・型差）／要実機確認 | `DtbProductSubClassRepository.php:133` | RG-008,RG-007 |  |
| a02-02 | 現行踏襲 | 乖離 | エンドポイントURLは `/api/popup/card/{言語コード}/{カードID}`（`0502:L1173`・サンプル `/api/popup/card/ja/22`＝`0502:L1200` | 乖離（記載URLの層が不明確・接頭辞差）／要実機確認 | `routes.yaml:89` | RG-001,§1 |  |
| a02-02 | 現行踏襲 | 乖離 | `lang`（言語コード）は文字型・必須・最大文字数2で `'ja'`もしくは`'en'`、省略時: `'en'`（`0502:L1193`）。EC-CUBEサーバURLでは `jp` 表記で、EC- | 乖離（既定値・値域検証の不在／DQL文字列連結）／要実機確認 | `routes.yaml:90, ProductController.php:87, DtbProductSubClassRepository.php:144` | RG-003,DV-09,DV-10,DV-12 |  |
| a02-02 | 現行踏襲 | 乖離 | 抽出条件は「リクエストで指定されたID・条件に一致するデータを取得対象とする」（詳細設計 `function_spec_html_preview/pf-api/a02-02_api_product_p | 乖離（設計の記述不足＝抽出条件・並び順の一部が設計に存在しない）／要実機確認 | `DtbProductSubClassRepository.php:107` | RG-002,RG-014,RG-015,DV-04 |  |
| a02-03 | 現行踏襲 | 乖離 | `oldProductId` の型：詳細 L323「パス／integer／必須」 vs Excel 0502:L1393「旧商品ID 文字型 〇 AER000022JN」 | 乖離（詳細設計の型誤記／要実機確認）: 詳細 L323 の integer は実データ（`AER000022JN`）と整合せず、Excel の「文字型」が実態に合致。詳細設計の型記述が誤りである可能性が高い（現行PHPDocの誤記を転記した | `DtbProductRepository.php:97, routes.yaml:97, ProductController.php:110` | RG-002／§3・§5 |  |
| a02-03 | 現行踏襲 | 乖離 | エンドポイントの `.json` 拡張子付き変種：Excel 0502:L1369（`…/{旧商品ID}.json`）・サンプル 0502:L1401（`/api/popup/old/ja/AER00 | 乖離（詳細設計の記載漏れ）: 実在する `.json` ルートが詳細設計の入口表（L311）に無い。Excel は記載しており Excel が正。テスト面として `.json` 変種の同一応答確認が必要＝要実機確認 | `routes.yaml:93, ProductController.php:318` | §5（要判定） |  |
| a02-03 | 現行踏襲 | 乖離 | 削除済み（論理削除）商品・規格の除外：Excel・詳細設計とも規定なし（詳細 L316,L323 は旧商品ID一致のみを抽出条件として記述） | 乖離（設計の記載漏れ）: 論理削除された商品/規格の旧商品IDを指定した場合、実装は該当なし＝404 となるが設計は沈黙。抽出条件の限定が設計に落ちていない＝要実機確認 | `DtbProductRepository.php:98` | RG-003／§5（要判定） |  |
| a02-04 | 現行踏襲 | 乖離 | エンドポイント: Excel A02-04（機能名「ポップアップ用カード情報取得（旧商品ID）」0502:L1549）の URL 欄は `/popup/old/{旧商品ID}.json`／`/popu | 乖離（Excel基本設計のA02-03/A02-04間で機能とエンドポイントの割当が入替＝機能同定に影響）／要仕様確認 | `routes.yaml:97, routes.yaml:105, ProductController.php:137` | RG-016・§5(要判定) |  |
| a02-04 | 現行踏襲 | 乖離 | 旧商品IDは文字型（Excel 0502:L1579・入力例 `AER000022JN`・リクエストサンプル 0502:L1585,L1587） | 乖離（詳細設計の型記載 integer が誤り。Excel「文字型」が実データ型と整合＝Excel優先で正）／要実機確認 | `MtbCard.php:88, DtbProductSubClassRepository.php:183, routes.yaml:105` | RG-002・DDT |  |
| a02-04 | 現行踏襲 | 乖離 | `price01` は「(未使用)」（Excel 0502:L1603）で応答サンプルも `null`（Excel 0502:L1623） | 乖離（Excelは未使用/null・詳細設計と実装は実値返却。price01 を業務値として消費する契約かが不明確）／要実機確認 | `DtbProductSubClassRepository.php:198` | RG-010 |  |
| a02-04 | 現行踏襲 | 乖離 | 応答 `price02`・`stock`・`weeklySold` の型：オラクル内で不確定。Excel 型表 0502:L1604,L1605,L1612 は「数値(整数)」だが、Excel 自身の | 乖離／要実機確認（Excel 型表 integer vs Excel サンプル string の自己矛盾＋詳細 string。オラクルで型を一意化できず。実装値は本ポインタに留め期待へ持ち込まない） | `DtbProductSubClassRepository.php:198` | RG-011,017 |  |
| a02-04 | 現行踏襲 | 乖離 | `lang` の値: 詳細 L324「jp または en を想定する」。一方 Excel 0502:L1570「※ langはEC-CUBEサーバURLではjpで表記する(EC-CUBEサーバ→API | 乖離（Excel注記の `ja` と詳細設計・実装の `jp` が不一致。想定外 lang 受領時の挙動が設計に未規定）／要実機確認 | `DtbProductSubClassRepository.php:17, DtbProductSubClassRepository.php:232` | RG-004・DV-04 |  |
| a02-04 | 現行踏襲 | 乖離 | 「条件に合致する商品規格を一件返す」（詳細 L326）。複数該当時にどの規格を選ぶかの優先順位は Excel・詳細とも規定なし | 乖離（複数該当時の選択優先順位・削除フラグ/公開ステータスの絞り込みが設計に未規定＝設計の記述不足。どの1件が返るか設計から予測できない）／要実機確認 | `DtbProductSubClassRepository.php:171` | RG-008・§5(要判定) |  |
| a02-05 | 現行踏襲 | 乖離 | 応答 stock・price02 の型：オラクル内で不確定。Excel は型表 L1794/L1795「数値(整数)」と応答サンプル L1823『"stock":"1"』／L1824『"price02 | 乖離／要実機確認（Excel 型表 integer vs Excel サンプル string の自己矛盾＋詳細 string。オラクルで型を一意化できず。実装 integer は本ポインタに留め期待へ持ち込まない＝#5 最大文字数8 と同じ | `ProductRepository.php:2252` | RG-006 |  |
| a02-05 | 現行踏襲 | 乖離 | ステータス：Excel 0502:L1774-1776「200/404/500」。不正パス値は解釈不能で異常（詳細 L329「日時として解釈できる文字列を渡す」）。該当なしは200空（詳細 L335） | 乖離（詳細 L335「専用の失敗ステータスは返さない」は該当なし=200空に限った記述で、不正日付=404・内部エラー=500は返す。また詳細 L329「日時として解釈できる文字列」は緩いパースを示唆するが実装は厳密Y-m-dで `2026 | `ProductController.php:208` | RG-004,010,011 |  |
| a02-05 | 現行踏襲 | 乖離 | 取得開始日/終了日の最大文字数8（Excel 0502:L1762,L1763） | 乖離（Excel仕様自己矛盾・最大8文字は入力例と不整合）／要実機確認 | `ProductController.php:208` | §5 台帳(要判定) |  |
| a02-05 | 現行踏襲 | 乖離 | 応答フィールド名 `strageCodeId`（Excel 0502:L1799・詳細 L333 とも "strage" 綴り＝保管コードID） | 乖離（応答フィールド名の綴り不一致・API契約差） | `ProductRepository.php:2218` | RG-006 |  |
| a05-01 | カスタマイズ | 乖離 | 印刷情報XMLのログ保存先は `var/log/print_logs/` 配下（正本 L382・アプリ相対の想定） | 乖離（実装リスク・環境依存/権限過大） | `OrderController.php:41` | RG-005 |  |
| a05-02 | カスタマイズ | その他 | 直接印刷結果が偽の場合は更新を行わず記録して戻る（詳細設計 L333／Excel 0505:L1296 成功(true)/失敗(false)） |  | `OrderController.php:101` | ...)` は SimpleXMLElement オブジェク |  |
| a05-02 | カスタマイズ | 乖離 | ResponseFileの解析に失敗した場合は内容とエラーを記録して更新を行わずに戻る（詳細設計 L333） | 乖離（解析失敗のcatch/記録が機能しない・バグ） | `OrderController.php:94` | RG-003 |  |
| a05-04 | カスタマイズ | 乖離 | レスポンス書式は「なし（ステータスコードのみ）」（Excel 0505:L1656,L1658） | 乖離（レスポンス書式差・要仕様確認） | `SmaregiController.php:103` | RG-014 |  |
| a05-04 | カスタマイズ | 乖離 | 高リスク（外部連携）＝同一取引の重複受信で二重加算を起こさない冪等が望ましい。正本は取消・打消のみ取引ID基準巻き戻しを保証（詳細設計 L382） | 乖離（通常取引の重複受信で冪等性欠如）／要実機確認 | `SmaregiController.php:127` | RG-018 |  |
| a05-04 | カスタマイズ | その他 | 通常取引は付与・利用それぞれのポイント履歴を登録する（詳細設計 L329）。零ポイント（付与0 または 利用0）時に該当履歴行を生成するかはL329が零条件を規定せず・Excel 0505:L1717 | オラクル沈黙（実装観測・期待に不採用） | `SmaregiController.php:141` | RG-001(DP-T02,T03) |  |
| a06-01 | 現行踏襲 | 乖離 | エンドポイントURL。Excel 0506:L972 は `/api/admin/login.json`／詳細設計 L319 は `POST /admin/login.json`（`/api` なし） | 乖離（Excel記載の`/api/`プレフィクスが実装/詳細設計と不一致・要確認） | `routes.yaml:2` | RG-001,012,017 |  |
| a06-01 | 現行踏襲 | 乖離 | 中継先への到達不可・処理中の例外はHTTP500（詳細設計 L340,L371） | 乖離（実装バグ・到達不可が401化／500未達） | `LoginController.php:54` | RG-010 |  |
| a06-01 | 現行踏襲 | 乖離 | 認証失敗時、応答からエラー文言を抽出しmessageに用いる（画面文言から改行除去）（詳細設計 L340,L371） | 乖離（実装バグ懸念・正規表現の過剰取得） | `LoginController.php:60` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 認証失敗応答は `{code, message}` を返す（詳細設計 L340） | 乖離（実装バグ懸念・未定義添字でmessage欠落） | `LoginController.php:61` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 一時Cookieファイルは処理後に削除する（詳細設計 L328・成功経路前提） | 乖離（軽微・例外経路の堅牢性） | `LoginController.php:56` | RG-009 |  |
| a06-02 | カスタマイズ | 乖離 | エンドポイントURLは `/api/admin/otcBuyOrders.json`（Excel 0506:L1162） | 乖離疑義（Excel URLと実ルート定義の差・要実機確認） | `routes.yaml:30` | RG-022 |  |
| a06-02 | カスタマイズ | 乖離 | 認証方式は「IP制限 トークン」（Excel 0506:L1163） | 乖離（Excel記載のIP制限が実装/詳細設計に無い）／要実機確認（インフラ層IP制限の有無） | `BaseController.php:23` | RG-016,017,018 |  |
| a06-02 | カスタマイズ | 乖離 | 取得対象ステータスは「査定前/査定中/査定中断/査定再開」の4種（Excel 0506:L1169,L1185） | 乖離（Excel設計が対象ステータスを1種欠落・名称不一致） | `DtbOtcBuyOrderRepository.php:48, MtbOtcBuyOrderStatus.php:14` | RG-003 |  |
| a06-02 | カスタマイズ | 乖離 | レスポンス各フィールドの型は全て「文字列」（Excel 0506:L1186-1200） | 乖離（Excel型表記が実返却型と不一致） | `DtbOtcBuyOrderRepository.php:20` | RG-006,007,010 |  |
| a06-03 | カスタマイズ | 乖離 | 成立日時／キャンセル日時は買取成立→成立日、買取キャンセル→キャンセル日に限り記録（Excel 0506:L1507,L1508） | 乖離（実装バグ・要実機確認） | `OtcBuyOrderController.php:208` | RG-015,021 |  |
| a06-04 | 現行踏襲 | 乖離 | Excel エンドポイントは `/api/admin/otcBuyOrder/{id}/freeComment.json`（Excel 0506:L1700・接頭辞 `/api` あり）。詳細設計は  | 乖離（Excel文書のパス表記差・要実機確認） | `routes.yaml:42` | RG-016,017 |  |
| a06-04 | 現行踏襲 | 乖離 | フリーコメントと更新担当者を保存する（正本 L327 step4,L346） | 乖離（実装の順序誤り・現状は無害だが要是正） | `OtcBuyOrderFreeCommentController.php:44` | RG-001,003 |  |
| a06-05 | カスタマイズ | 乖離 | 更新可能な宛先ステータスは 6/8/9 のみ。1,2,5,10(経理払い出し待ち),11(入庫済み),12,13,14 へは更新不可（新設ステータスへは更新できないよう制御を入れる）（Excel 05 | 乖離（カスタマイズ未達＝現行pf-apiで新設ステータスへ更新可能。enterpriseでは実装） | `OtcBuyOrderStatusController.php:74, UpdateStatusAction.php:35` | RG-023,024,TR-10〜14 |  |
| a06-05 | カスタマイズ | 乖離 | ステータスマスタ定義（カスタマイズ後）: 5=査定前,8=査定中断,10=経理払い出し待ち,11=入庫済み,12=未登録在庫あり,13=入庫待ち,14=管理者取消（Excel 0506:L1864-1 | 乖離（ステータスマスタ/査定終了集合の定義不一致・Excel優先で上書き） | `MtbOtcBuyOrderStatus.php:10, MtbOtcBuyOrderStatus.php:45` | RG-004,005,009,023,TR-* |  |
| a06-05 | カスタマイズ | 乖離 | 本APIは楽観/悲観ロックを持たず persist/flush で直接確定（詳細設計 L361,L376） | 乖離（enterpriseで明示トランザクション・例外整形を追加・軽微／要実機確認） | `OtcBuyOrderStatusController.php:74, UpdateStatusAction.php:106` | RG-022 |  |
| a06-06 | 現行踏襲 | 乖離 | `price` は基準価格を返す（Excel 0506:L2056,L2111 のカスタマイズ「販売価格を取得していたところを基準価格を取得するようにする」） | 乖離（カスタマイズ未達） | `DtbProductRepository.php:157` | RG-005 |  |
| a06-06 | 現行踏襲 | 乖離 | `stock` はログイン者の所属店舗のEC在庫を返す（Excel 0506:L2057,L2058,L2112 のカスタマイズ「明示的に本店ECの在庫→追加開発でログイン者の所属店舗のEC在庫を取得 | 乖離（カスタマイズ未達・店舗スコープ無） | `DtbProductRepository.php:159, ProductController.php:161` | RG-006 |  |
| a06-06 | 現行踏襲 | 乖離 | 取得結果が空のときだけ404、取得できた買取用商品は返す（正本 L313／Excel 0506:L2077,L2078） | 乖離疑義（内部結合で偽404／実機再現で確定） | `DtbProductRepository.php:131` | RG-001,012 |  |
| a06-06 | 現行踏襲 | 乖離 | `detailId` の型（Excel 0506:L2067＝文字列／詳細設計 L320＝integer） | 乖離（設計間の記述不一致・軽微／要実機確認） | `ProductController.php:161, DtbProductRepository.php:145` | RG-015 |  |
| a06-07 | 現行踏襲 | 乖離 | エンドポイントURL。Excel 0506:L2273 は `/api/buying/products` | 乖離（Excel記載の`/api/`プレフィクスが現行実装/詳細設計と不一致・要確認） | `routes.yaml:113, BuyingController.php:67` | RG-001,014,015 |  |
| a06-07 | 現行踏襲 | 乖離 | ids 必須〇（Excel 0506:L2296）／詳細設計 L320 は「任意」／L321 空・未指定は0件 | 乖離（ids必須性のExcel/詳細設計/実装三者不整合・現行はnull時に非推奨警告） | `ProductController.php:183, BuyingController.php:70` | RG-005,011 |  |
| a06-08 | 現行踏襲 | 乖離 | エンドポイントは POST `/api/search.json`（Excel 0506:L2694,L2695） | 乖離（メソッド/パス相違）／要実機確認 | `routes.yaml:134` | 共通前提（全RG） |  |
| a06-08 | 現行踏襲 | 乖離 | price は販売価格でなく基準価格を取得して返す（Excel ★カスタマイズ 0506:L2697,L2706） | 乖離（★カスタマイズ未達・販売価格のまま） | `DtbProductRepository.php:276` | RG-006 |  |
| a06-08 | 現行踏襲 | 乖離 | stock は追加開発でログイン者の所属店舗のEC在庫を取得して返す（Excel ★カスタマイズ 0506:L2708,L2699／L2698,L2707『明示的に本店ECの在庫』は取り消し線＝撤回の | 乖離（★カスタマイズ未達・汎用在庫のまま） | `DtbProductRepository.php:279` | RG-007 |  |
| a06-11 | 現行踏襲 | 乖離 | 応答フィールド `section_id`・`name`・`code` の型はExcel項目表で「文字列」（0506:L3136-L3138） | 乖離（設計内部不一致・型齟齬）／要実機確認 | `MtbSectionRepository.php:21, SectionController.php:42` | RG-008 |  |
| a06-11 | 現行踏襲 | 乖離 | エンドポイントは Excel が `/api/section.json`（0506:L3110） | 乖離（エンドポイント文字列差・要実機確認） | `routes.yaml:240, SectionController.php:35` | RG-011 |  |
| a06-12 | 現行踏襲 | 乖離 | 設定が無い場合の扱い（詳細設計 L307：現行=null参照でHTTP500／移行先=要確認） | 乖離（現行踏襲の逸脱・設定なし時の契約差） | `OptionController.php:57, ProductController.php:497` | RG-007,008 |  |
| a06-12 | 現行踏襲 | 乖離 | エンドポイントは `/api/fixedPriceSection.json`（Excel 0506:L3277） | 乖離（Excelエンドポイント記載と実装パス不一致）／要実機確認 | `routes.yaml:244, OptionController.php:50` | RG-013 |  |
| a06-12 | 現行踏襲 | 乖離 | 認証の有無=有・認証方式=IP制限/トークン（Excel 0506:L3278） | 乖離疑義（認可は適用されるが Excel の IP制限/トークン方式との一致がコード上未確認）／要実機確認 | `OptionController.php:25` | RG-014 |  |
| a06-12 | 現行踏襲 | 乖離 | 固定価格部門を示す `option_key` の具体値（詳細設計 L308＝要確認） | 実装確認（要確認の解消・乖離なし） | `MtbOption.php:31, MtbOption.php:31` | RG-008,012 |  |
| a06-13 | 現行踏襲 | その他 | 証明書IDがマスタに存在しない場合は入力不正 HTTP 400（Excel 0506:L3458「400 証明書IDがマスタに登録されていないものだった場合」／詳細L340,L351,L367「入力不 |  | `OtcBuyOrderController.php:288, NotFoundException.php:31` |  |  |
| a06-13 | 現行踏襲 | その他 | 処理フローは(1)トークン検証→401を最初、(2)受注取得→404、(3)証明書→400 の順（詳細L328）。認証拒否が404/400に優先する |  | `OtcBuyOrderController.php:293, security.yaml:32` |  |  |
| a06-13 | 現行踏襲 | その他 | 詳細L340は 401=認証拒否（本文を持たない）・404=該当なし（本文を持たない）・400のみ `{code,errors}` |  | `—` |  |  |
| a06-16 | 新規実装 | 乖離 | エンドポイント: Excel `PUT /api/otcBuyOrder/{id}/doublecheck.json`（0506:L3819,L3820）。詳細設計HTMLは移行先を `PUT /{a | 乖離（Excel設計 vs 実装パス相違） | `OtcBuyOrderController.php:231` | RG-004 |  |
| a06-16 | 新規実装 | 乖離 | ダブルチェック者の保存: Excel「ダブルチェック者は新規のカラムに追加する」（0506:L3833）。詳細設計HTMLは承認テーブルと記載（正本 L314,L315） | 乖離（Excel「新規カラム」 vs 実装 別テーブルUPSERT） | `OtcBuyOrderApproverEntityManager.php:33, UpdateDoubleCheckMemberAction.php:47` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 更新担当者・更新日時: Excel A06-16 に記載なし（副作用は「新規カラム追加」のみ 0506:L3833） | 乖離（Excel沈黙・実装が追加更新／要実機確認） | `UpdateDoubleCheckMemberAction.php:42` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 同一メンバー禁止: Excel A06-16 に記載なし。詳細設計HTMLは「更新者とダブルチェック者が同一の場合はエラー」と記載（正本 L305,L314） | 乖離（Excel沈黙・実装が追加検証／要実機確認） | `UpdateDoubleCheckMemberAction.php:36` | 台帳(要判定) |  |
| a06-16 | 新規実装 | 乖離 | 成功レスポンス: Excel「ステータスコード 200／レスポンスデータなし」（0506:L3848,L3851） | 乖離（Excel「なし」 vs 実装 codeボディ返却） | `OtcBuyOrderController.php:267` | RG-003 |  |
| a06-16 | 新規実装 | 乖離 | 認証方式: Excel「認証の有無=有／認証方式=IP制限／トークン」（0506:L3820） | 乖離疑義（Excel「IP制限」 vs 実装 セッション認証／要実機確認） | `OtcBuyOrderController.php:244` | RG-006 |  |
| a07-01 | 現行踏襲 | 乖離 | 応答本体の型：Excel 0507:L980 は「数値（整数）」／詳細設計 L337 は「文字列」 | 乖離（Excel型記述と実装/詳細設計の不一致） | `MtbOption.php:46, OptionController.php:26, MtbOption.php:154` | RG-001,006 |  |
| a07-01 | 現行踏襲 | 乖離 | 認証失敗：ヘッダ欠落・署名不正・該当管理者会員なしを認証拒否（HTTP 401）とする（詳細設計 L322,L335,L339,L364。期限切れ等は沈黙） | 乖離（認証失敗ハンドリングの網羅漏れ）／要実機確認 | `BaseController.php:30` | RG-003 |  |
| a07-01 | 現行踏襲 | その他 | 設定なし時：現行=例外(HTTP500相当)／移行後=空文字列(HTTP200)、認証方式：現行=jwt-tokenヘッダ(HS256)／移行後は別方式（詳細設計 L312 に記載済） | 移行差異（L312記載済・バグではない）／挙動オラクルは現行を採用 | `OptionController.php:26, BaseController.php:23, OptionController.php:42` | RG-005 |  |
| a07-02 | 現行踏襲 | 乖離 | null 保持：詳細設計 L339「freeComment 未設定時 null」「memberName 紐づく会員なし時 null」・L362「serialize_null 有効」（Excel は n | 乖離（実装が null→空文字置換）／要実機確認 | `BuyOrderController.php:74` | RG-005,006 |  |
| a07-02 | 現行踏襲 | 乖離 | 401 応答本体：詳細設計 L341「認証拒否（本文を持たない）」 | 乖離（401に本文あり） | `ExceptionListener.php:77` | RG-014 |  |
| a07-03 | 現行踏襲 | 乖離 | エンドポイントは `/api/admin/buyOrder/{id}/freeComment.json`（Excel 0507:L1307）。詳細設計 L318/L326 は現行 pf-api を ` | 乖離（Excelパスprefixが現行実装と不一致）／要実機確認 | `routes.yaml:17` | RG-019・§1 |  |
| a07-03 | 現行踏襲 | 乖離 | 401（トークン欠落・署名不正・該当会員なし）と404（受注IDに該当なし）は「本文を持たない」（詳細設計 L339） | 乖離疑義（401/404が本文を持つ可能性）／実機再現で確定 | `BaseController.php:27, BuyOrderFreeCommentController.php:28` | RG-017 |  |
| a07-03 | 現行踏襲 | 乖離 | リクエスト書式：Excel 0507:L1308 は「クエリ」、詳細設計 L334 は「ボディ（フォーム値）」 | 軽微乖離（オラクル間の書式記述差・実装は両対応） | `BuyOrderFreeCommentController.php:31` | RG-018 |  |
| a07-03 | 現行踏襲 | その他 | 認証方式はJWTペイロードの「利用者ID」から管理者会員を引く（詳細設計 L322）。どのJWTクレームで利用者IDを解決するかは L322 が沈黙（＝オラクル非記載） | 実装詳細（クレーム名はオラクル非記載・実装で `aud` 解決）／オラクル化しない | `BaseController.php:38` | RG-006・§1・§2 |  |
| a07-04 | 現行踏襲 | 乖離 | Excelカスタマイズ：更新可能な現在ステータスは{商品到着・査定中・査定中断・査定再開}のみ、更新先は{査定中・査定中断・査定再開}のみに限定（Excel 0507:L1481,L1478,L149 | 乖離（Excelカスタマイズ未達・現行） | `BuyOrderStatusController.php:49` | RG-013,DT-11 |  |
| a07-04 | 現行踏襲 | 乖離 | statusマスタ非存在時のメッセージは「正しい店頭買取ステータスIDを入力してください」（詳細設計 L335,L368・Excel経由） | 乖離疑義（文言・設計も踏襲のため要判断） | `BuyOrderStatusController.php:42, BuyOrderController.php:137` | RG-004,DT-09 |  |
| a07-04 | 現行踏襲 | 乖離 | `status` は integer 必須（詳細設計 L334）。非整数/空の扱いは設計沈黙 | 乖離（型チェック有無・設計沈黙）／要実機確認 | `BuyOrderController.php:134, BuyOrderStatusController.php:35` | RG-004 |  |
| a07-05 | 現行踏襲 | 乖離 | Excel本文 `0507:L1662`「査定完了時、実在庫情報を登録する」・`0507:L1682`「★④ネット買取実在庫…登録する」・`0507:L1685`「★⑤ネット買取実在庫履歴」に実在庫登 | 乖離解消済み（743で廃止・仕様書鮮度） | `BuyOrderController.php:57` | §0 OUT |  |
| a07-05 | 現行踏襲 | 乖離 | 一次オラクルExcel `0507:L1692`「まとめて買取の商品ID（固定の商品ID、固定の金額）の明細を削除する」＝まとめ買取の明細（買取代表カード本体）ごと削除（＋一般規則で紐づく申込時買取価 | 乖離（詳細設計L355の狭小化＝仕様書側の記述誤り／実装・ExcelはL1692側で一致） | `BuyOrderController.php:242` | RG-004・§1副作用 |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2064` `/api/admin/buyOrderIndivisualInputProduct.json` |  | `routes.yaml:70` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2087` `ids` 必須〇 |  | `BuyOrderIndivisualInputProductController.php:23` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2110` saleFlg 型＝文字列（true,false） |  | `DtbBuyOrderIndivisualInputProduct.php:150` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2065` 認証方式＝IP制限／トークン |  | `BaseController.php:23` |  |  |
| a07-06 | 現行踏襲 | その他 | 詳細設計 `:328`（業務ルール・計算）「金額・税・ポイント・在庫数量の再計算は行わない／表示用の丸め・税計算・ポイント計算は本APIでは行わない」＝買取代表カード(buyMainCard)固有記述 |  | `—` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel A07-06＝個別入力商品一覧（`buyOrderIndivisualInputProduct.json`／項目 buyOrderIndivisualInputProductId,name |  | `routes.yaml:66` |  |  |
| a07-07 | 現行踏襲 | 乖離 | 認証失敗（ヘッダ欠落・署名不正・該当管理者会員なし）はいずれもHTTP401とする（詳細設計 L320,L338,L370） | 乖離（認証例外の網羅不足・期限切れ/不正形式が401でなく500）／要実機確認 | `BaseController.php:30` | RG-006,007,008 |  |
| a07-07 | 現行踏襲 | 乖離 | `ids` はボディのstringパラメータ。カンマ区切りを分解して検索する（詳細設計 L332・「位置=ボディ」） | 乖離疑義（content-type依存で常時0件になりうる・実機再現で確定）／要実機確認 | `BuyOrderIndivisualInputProductController.php:23` | RG-004(DP-04),RG-010 |  |
| a14-01 | 現行踏襲 | 乖離 | レスポンスのプロパティ名は Excel レスポンスデータ表の表記＝snake_case（`name_jp`・`arena_format_name_jp`・`old_product_id`・`card_ | 乖離（設計間・命名規則）／要実機確認（実応答キーの実測が必要） | `MtbCard.php:6` | RG-009 |  |
| a14-02 | 現行踏襲 | 乖離 | 応答項目名は Excel のレスポンスデータ一覧（`:1445-1500`）＝snake_case（`card_id`・`back_card_detail_id`・`card_layout` 等）で、 | 乖離（設計文書間の不整合・詳細設計の更新漏れ）／要実機確認 | `—` | RG-007,019,030 |  |
| a14-02 | 現行踏襲 | 乖離 | 同一Excel内で応答仕様の表記が一貫していること | 乖離（Excel内部の型/名称/書式の表記ゆれ）／要実機確認 | `—` | RG-008,009,019 |  |
| a14-03 | 現行踏襲 | 乖離 | name は「日本語、英語のカード名を『 / 』で区切り入力できる。半角英数の場合は英語、それ以外を日本語のカード名とする」（`excel_to_html/output/0514_基本設計仕様書(AP | 乖離（条件生成の不具合・`empty()` 判定であるべき箇所が `is_null()`）／要実機確認（空 name_jp/name_en 行の実在有無で顕在化） | `MtbCardRepository.php:29` | RG-001,004（DV-01,DV-02） |  |
| a14-03 | 現行踏襲 | 乖離 | 分割カードは `+` で繋ぐ入力を想定し、内部で `/` に置換する（`function_spec_html_preview/pf-api/a14-03_api_card_card_search_si | 乖離（入力デコードの二重適用・分割カード入力形の不成立）／要実機確認 | `MtbCardRepository.php:28` | RG-002（DV-05） |  |
| a14-03 | 現行踏襲 | 乖離 | レスポンスデータの項目名は `id`／`name_jp`／`name_en`／`image_url`（0514:L1738-1741）。ただし同一Excelのレスポンスサンプルは `"nameJp"` | 乖離（レスポンス項目名の表記不整合・Excel項目名表 vs サンプル vs camelCase規約の三者不一致）／要実機確認（どの表記が正かをExcel改訂で確定する必要） | `MtbCardRepository.php:99` | RG-008 |  |
| a14-03 | 現行踏襲 | 乖離 | 操作種別=検索・対象テーブルはカードマスタ（`mtb_card`）で「検索条件に合致するレコードを抽出する」（a14-03…html:352／同:349）。Excelも「データベースから検索したカード | 乖離（検索対象の内部結合により画像/カードセット未整備カードが404になる）／要実機確認 | `MtbCardRepository.php:60` | RG-005,015 |  |
| a15-01 | 現行踏襲 | 乖離 | 本APIは参照のみで「会員・プレイヤー等の業務データは更新しない」（`function_spec_html_preview/pf-api/a15-01_api_deck_builder_deck_lo | 乖離（設計内部矛盾・DB操作表の雛形誤適用）／要実機確認（設計修正候補） | `LoginController.php:42` | RG-021 |  |
| a15-01 | 現行踏襲 | 乖離 | 「応答はJSON応答整形を経て返す。プロパティはcamelCase」（同:270）。一方、同一正本のレスポンス定義とサンプルは `access_token`・`session_id`＝スネークケース（ | 乖離（設計内部矛盾・camelCase規約と応答実体の不一致）／要実機確認 | `LoginController.php:68, fos_rest.yaml:16` | RG-019 |  |
| a15-01 | 現行踏襲 | 乖離 | 「入力パスワードを会員のソルトでハッシュ化した値と保存値を突合する」（同:241）。ハッシュ方式・ソルトの詳細仕様は「会員認証の共通仕様を正とする」（同:226）＝共通仕様に追随することが要求 | 乖離（共通仕様との不整合・アルゴリズム固定/ソルト空フォールバック欠落）／要実機確認 | `LoginController.php:52, PasswordHasher.php:26` | RG-001,RG-012 |  |
| a15-01 | 現行踏襲 | 乖離 | 「Cookie名は設定キー cookie_name と token_name を結合した名称とし、有効期限は設定キー jwt_expire_days の日数に基づく」（同:269）＝結合規則・属性は正 | 乖離（設計未確定・Cookie結合規則/属性の記述欠落。トークンCookieに HttpOnly/Secure 指定が無い点はセキュリティ観点で要確認）／要実機確認 | `LoginController.php:96, AuthService.php:10, LoginController.php:63` | RG-003 |  |
| a15-02 | 現行踏襲 | 乖離 | 発行済みトークンは有効期限まで署名上有効であり、有効期限の到来をもって失効する（`function_spec_html_preview/pf-api/a15-02_api_deck_builder_d | 乖離（設計前提の欠落・トークン無期限＝セキュリティ影響）／要実機確認 | `AuthService.php:23, LoginController.php:60, BaseController.php:69` | RG-016,015 |  |
| a15-02 | 現行踏襲 | 乖離 | 「トークン不正」は認証拒否（HTTP 401）・メッセージ `Access Token is incorrect` を返す（`...a15-02_api_deck_builder_deck_logou | 乖離候補（401/500の切り分けが設計で未確定）／要実機確認 | `BaseController.php:68` | RG-006,013,014・DV-06 |  |
| a15-02 | 現行踏襲 | 乖離 | 応答のプロパティは camelCase とする（`...a15-02_api_deck_builder_deck_logout.html:268`「プロパティはcamelCase、日時はISO8601 | 乖離候補（設定の裏付け不在・本APIでは観測不能）／要実機確認 | `fos_rest.yaml:16, doctrine.yaml:31, LoginController.php:90` | RG-018 |  |
| a15-03 | 現行踏襲 | 乖離 | JWTペイロードの `aud` の顧客IDからプレイヤーを引く（`function_spec_html_preview/pf-api/a15-03_api_deck_builder_deck_user | 乖離（現行踏襲違反・認証クレーム名の変更 aud→sub）／要実機確認 | `GetUserAction.php:71, JwtPlayerAuthenticator.php:45, BaseController.php:79` | RG-007,RG-013 |  |
| a15-03 | 現行踏襲 | 乖離 | 失敗時 `message` は「Access Token is incorrect」または「Authentication failed」／400 は「Invalid request parameter | 乖離（現行踏襲差・失敗メッセージ文言のロケール依存化／文言消滅）／要実機確認 | `UserController.php:59, messages.ja.yaml:6305, messages.en.yaml:3865` | RG-006,RG-012 |  |
| a15-03 | 現行踏襲 | 乖離 | 利用者視点の入口は `GET /user`（同HTML`:235`）。応答形式はJSON・呼び出し元はデッキビルダーアプリ（同`:236`）。OPTIONS/CORS の記述は正本に無い | 乖離（現行踏襲差・エンドポイントパス変更＋設計外のOPTIONS/CORS追加）／要実機確認 | `UserController.php:43, routes.yaml:9` | RG-001,RG-013,RG-022 |  |
| a15-03 | 現行踏襲 | 乖離 | 「特定したプレイヤーが取得できない場合は入力不正（HTTP 400）とし、{code, message}（メッセージは「Invalid request parameters」）を返す」（同HTML`: | 乖離（設計の400経路が現行の自分参照で到達不能＝設計過剰記述 or 実装欠落）／要実機確認 | `CustomerController.php:45, BaseController.php:76, CustomerController.php:57` | RG-011 |  |
| a15-03 | 現行踏襲 | その他 | 「トークンを検証し…検証できない、または該当するプレイヤーがない場合は認証拒否（HTTP 401）」（同HTML`:244`） | \RuntimeException)`）と捕捉範囲が異なる。正本 L239/L256 の明示列挙は3種のみで期限切れ等を規定しない | `BaseController.php:68, GetUserAction.php:66` | **乖離（設計「検証できない=401」に対する現行の例外捕捉 |  |
| a15-03 | 現行踏襲 | 乖離 | 正本は論理削除済みプレイヤーの扱いを規定しない（応答は L253-254、認証拒否条件は L239/L256 の3種のみ） | 乖離（現行踏襲差・論理削除プレイヤーの参照可否／設計は沈黙＝要仕様確定）／要実機確認 | `DtbPlayer.orm.yml:210, doctrine.yaml:42, BaseController.php:79` | RG-006(DV-03),RG-007 |  |
| a15-03 | 現行踏襲 | 乖離 | 「顧客ID（`customer_id`）… `aud` の顧客IDでプレイヤーを特定する」（同HTML`:278`）／応答に用いる列は現行・移行先で同一（同`:228`） | 乖離（内部差・customer_id のマッピング変更／設計L228「差分なし」は列名のみを指す）／要実機確認 | `DtbPlayer.orm.yml:95, DtbPlayer.php:66, DtbPlayerRepository.php:36` | RG-007,RG-017,RG-026 |  |
| a15-04 | 現行踏襲 | 乖離 | 「クエリの `deck_user_id` を確認する。指定されている場合は本分岐に進む」（`function_spec_html_preview/pf-api/a15-04_api_deck_buil | 乖離（設計の確定漏れ・空文字の分岐仕様が未記述）／要実機確認（期待は断定しない） | `CustomerController.php:43` | DV-04 |  |
| a15-04 | 現行踏襲 | 乖離 | 「一致するプレイヤーを1件取得する」（同HTML:244）。同一デッキユーザーIDが複数存在する場合の選択規則は未記述 | 乖離（設計の確定漏れ・重複時の選択規則が未記述）／要実機確認 | `DtbPlayer.orm.yml:11, DtbPlayer.php:114, CustomerController.php:51` | DV-05 |  |
| a15-04 | 現行踏襲 | 乖離 | 「`deck_user_id` クエリ string 必須（本分岐）」（同HTML:251）＝取得元はクエリ文字列 | 乖離（設計記述と実装の入力源の差・内部差）／要実機確認 | `CustomerController.php:43, routes.yaml:9` | RG-007 |  |
| a15-05 | 現行踏襲 | その他 | `user_name` の空文字や最大長（255桁）の上限はコントローラでは判定せず、DB保存時の制約に委ねる（L266）＝空文字で入力不正(400)にしない。現行も null 判定のみ（`deck- |  | `UserController.php:97` | $nicknameRaw === '')` → HTTP 4 |  |
| a15-05 | 現行踏襲 | 乖離 | 対象特定キーは `aud` の顧客IDで、顧客IDに対応するプレイヤーを引く（L227,L237,L274）。現行も `aud` 使用（`deck-api/src/Controller/BaseCon | 乖離（現行踏襲違反・対象特定キーの変更）／要実機確認 | `UpdateUserAction.php:95` | RG-009,010（DV-11） |  |
| a15-05 | 現行踏襲 | 乖離 | 成功時メッセージは 「Update user information」（L233,L252,L259・サンプル応答も同値）。現行一致（`deck-api/src/Controller/Customer | 乖離（現行踏襲違反・成功メッセージの変更）／要実機確認 | `UserController.php:134, messages.ja.yaml:6308` | RG-001,002 |  |
| a15-05 | 現行踏襲 | 乖離 | 401 の `message` は 「Access Token is incorrect」または「Authentication failed」、400 の `message` は 「Invalid r | 乖離（現行踏襲違反・失敗メッセージの変更）／要実機確認 | `UserController.php:86, messages.ja.yaml:6305` | RG-007,008,020（DV-02,09,10） |  |
| a15-05 | 現行踏襲 | 乖離 | HTTP 500 は 「更新中に例外が発生（保存失敗）」を契機とし、`message` は例外メッセージ（L241,L254）。現行一致（`deck-api/src/Controller/Custom | 乖離（現行踏襲違反・500の契機とメッセージの変更／保存失敗の未捕捉）／要実機確認 | `UpdateUserAction.php:51, UserController.php:127, messages.ja.yaml:6310` | RG-013,020 |  |
| a15-05 | 現行踏襲 | 乖離 | 更新は1つのトランザクション内で行い、例外時はロールバックする（L262,L290）。現行一致（`deck-api/src/Controller/CustomerController.php:94-1 | 乖離（現行踏襲違反・トランザクション制御の欠落）／要実機確認 | `UpdateUserAction.php:44` | RG-013,014 |  |
| a15-05 | 現行踏襲 | 乖離 | `profile` は任意で、未指定の場合はnullとして保存し、最大長の上限もコントローラでは判定しない（L249,L266）。現行一致（`deck-api/src/Controller/Custo | 乖離（現行踏襲差・追加バリデーション／更新範囲の限定と実装の粒度差）／要実機確認 | `UserController.php:104, UpdateUserAction.php:56, PlayerEntityManager.php:60` | RG-006,015（DV-08） |  |
| a15-05 | 現行踏襲 | 乖離 | 入口は `PUT /user`（L233）。現行一致（`deck-api/config/routes.yaml:13-16`＝`put_user: path: /user / controller:  | 乖離（パス変更／認証失敗網羅性の差）／要実機確認 | `UserController.php:78, BaseController.php:69` | RG-007,008,024 |  |
| a15-06 | 現行踏襲 | 乖離 | サブテーブルを持つマスタ（カテゴリ・タグ）はサブテーブルを含めて取得し、要素内に子要素の配列を含む（L243「サブテーブルを含めて取得する」／L247／L255） | 乖離（現行踏襲違反・サブテーブル取得の欠落）／要実機確認 | `MasterController.php:100, DtbCategoryRepository.php:18, MtbTagRepository.php:18` | RG-004・DV-03,DV-04 |  |
| a15-06 | 現行踏襲 | 乖離 | カテゴリは追加公開対象のDtb系、タグはサブテーブルを持つMtb系として取得できる（L231・L243・L247・L251・L255） | 乖離（現行踏襲違反・公開対象マスタの404化）／要実機確認 | `MasterController.php:85, Category.php:16, Tag.php:14` | RG-004,RG-005・DV-03,DV-04 |  |
| a15-06 | 現行踏襲 | 乖離 | 利用者視点の入口は `GET /master/{name}`（L234・L242）。現行も同一（`deck-api/config/routes.yaml:18` `path: /master/{nam | 乖離（入口パス差＋設計未記載のOPTIONS/CORS）／要実機確認 | `MasterController.php:77` | RG-001,RG-014・§1入口 |  |
| a15-06 | 現行踏襲 | 乖離 | 該当なしの本文は `{code: 404, message: "Not Found"}`（L257）・「コード404・メッセージ「Not Found」のJSONを返す」（L301） | 乖離（現行踏襲違反・404メッセージのロケール依存化）／要実機確認 | `MasterController.php:92, messages.ja.yaml:6309, messages.en.yaml:3869` | RG-010,RG-011・DV-07〜10 |  |
| a15-06 | 現行踏襲 | 乖離 | 応答整形はプロパティ camelCase・日時 ISO8601・`serialize_null` 有効（L279）。サンプルも `nameJp`/`deckbuilderFlg`（L265-267） | 乖離（応答キー形式・日時形式・サンプルの公開項目誤り）／要実機確認 | `MasterController.php:151, fos_rest.yaml:17, MtbFormat.php:24` | RG-007,RG-008 |  |
| a15-06 | 現行踏襲 | 乖離 | 「取得クエリには結果キャッシュ（既定の保持時間つき）を用いる」「結果キャッシュの保持時間内は同一内容を返すことがある」（L278・L287） | 乖離（現行踏襲違反・結果キャッシュの欠落）／要実機確認 | `MasterController.php:99, MtbFormatRepository.php:24, MasterController.php:44` | RG-019,RG-029 |  |
| a15-06 | 現行踏襲 | 乖離 | 正本はマスタごとの応答構成を「対象マスタのエンティティで公開設定されたプロパティ」とのみ規定し（L254）、派生値の付与を記載しない | 乖離（設計書の記載漏れ・現行にはある派生値）／要実機確認 | `MasterController.php:109, MtbCampaignTag.php:167` | RG-007 |  |
| a15-07 | 現行踏襲 | 乖離 | 入口は `GET /archetypes/{formatId}`（`function_spec_html_preview/pf-api/a15-07_api_deck_builder_deck_arc | 乖離（正本記述と実装の入口URL不一致／現行踏襲差）／要実機確認 | `ArchetypeController.php:38` | RG-001,014,028 |  |
| a15-07 | 現行踏襲 | 乖離 | 正本は入口を `GET /archetypes/{formatId}` のみ規定し（`...a15-07_...html:234`）、認証は行わず `jwt-token` を参照しない（`:238`） | 乖離（設計未記載の入口/応答ヘッダ追加）／要実機確認 | `ArchetypeController.php:41, AbstractDeckBuilderController.php:59` | RG-014,015,028 |  |
| a15-07 | 現行踏襲 | 乖離 | 正本は取得対象を「パスのフォーマットに紐づくアーキタイプの全件」とし（`...a15-07_...html:247`）、論理削除行の扱いを明示しない（沈黙）。現行は論理削除行が自動除外される — `d | 乖離（現行踏襲違反・論理削除行の除外欠落の疑い）／要実機確認（SEED-ARC-DEL で確認） | `DtbArchetype.php:87, DtbArchetypeRepository.php:136` | RG-002,013 |  |
| a15-08 | 現行踏襲 | 乖離 | 検索クエリの結果キャッシュは「検索条件に応じたキー」で持ち（`function_spec_html_preview/pf-api/a15-08_api_deck_builder_deck_card_s | 乖離（キャッシュキー不足によるページ／並び順の誤返却）／要実機確認 | `MtbCardRepository.php:84` | RG-022,025,026,040 |  |
| a15-08 | 現行踏襲 | 乖離 | 配列を取る条件（`rarity`・`mana_value`・`exclude_mana_value`・`power`・`exclude_power`・`toughness`・`exclude_toug | 乖離（キャッシュキーの値潰れによる別条件の結果返却）／要実機確認 | `MtbCardRepository.php:149` | RG-012,015,016,017,018,040 |  |
| a15-08 | 現行踏襲 | 乖離 | `name_condition`・`cardtype_condition`・`subtype_condition`・`color_condition`・`text_condition`・`rarity | 乖離（キャッシュキー不足による結合論理違いの誤返却）／要実機確認 | `MtbCardRepository.php:97` | RG-005,006,007,008,013,040 |  |
| a15-08 | 現行踏襲 | 乖離 | `cards[].cardtypes` は「カード種別の識別子の数値配列」、`cards[].colors` は「色の識別子の数値配列」（同 `:255`）であり、種別・色は集約値を数値配列へ展開する | 乖離（識別子を持たないカードで実在しない値0を返す）／要実機確認（設計側の非該当時表現の明記も必要） | `MtbCardRepository.php:87` | RG-029 |  |
| a15-09 | 現行踏襲 | 乖離 | `format_id`（フォーマットの識別子）は 任意。「空でない場合にフォーマットを解決する」（`function_spec_html_preview/pf-api/a15-09_api_deck_ | 乖離（必須/任意の記述不整合）／要実機確認 | `DtbDeck.php:218, DeckService.php:212` | RG-033（DV-15）, RG-026 |  |
| a15-09 | 現行踏襲 | 乖離 | `scope_id`（公開範囲）は 任意。公開（1）・非公開（2）・限定公開（3）（`a15-09_...html:250`） | 乖離（必須/任意の記述不整合・区分値の未規定）／要実機確認 | `DtbDeck.php:236, DeckService.php:212` | RG-033（DV-18）, RG-026 |  |
| a15-09 | 現行踏襲 | 乖離 | `cards[].card_id` は 任意（`a15-09_...html:250`。必須は `cards[].board_id`・`cards[].count` のみ） | 乖離（必須/任意の記述不整合＋400/500の分岐差）／要実機確認 | `DtbDeckCard.php:51, DeckService.php:140` | RG-025, RG-033（DV-19） |  |
| a15-09 | 現行踏襲 | その他 | 採用カードを受け取り、ボード区分ごとに採用カード・メイビー・アトラクション・ステッカーとして組み立てる（`a15-09_...html:242`）。ボードはメイン(1)・サイド(2)・統率領域(3)・ |  | `DeckService.php:100` | ... === MtbBoard::ATTRACTION_B |  |
| a15-09 | 現行踏襲 | 乖離 | デッキ本体（`dtb_deck`）の識別子列は デッキID（`deck_id`）（`a15-09_...html:226`,`:277`）。テーブル名・列名は ec-cube-enterprise の | 乖離（列名の記述不整合・軽微だがDB検証手順に影響）／要実機確認 | `DtbDeck.php:40` | RG-007, RG-038 |  |
| a15-09 | 現行踏襲 | 乖離 | 処理フローはキャンペーンタグを解決しデッキ本体に設定する（`a15-09_...html:242`）が、DB操作の対象テーブルは `dtb_attraction_card / dtb_deck / d | 乖離（設計の副作用テーブル記載もれ）／要実機確認 | `DtbDeck.php:194, DeckService.php:173` | RG-013, RG-019, RG-020 |  |
| a15-10 | 現行踏襲 | 乖離 | 成功応答の `display_token` は「公開範囲が限定公開（3）のときのみ含める」（`function_spec_html_preview/pf-api/a15-10_api_deck_bui | 乖離（限定公開時に display_token が返らない疑い・更新APIのみキャスト欠落＝実装漏れ）／要実機確認 | `DeckController.php:314, MtbDisp.php:12, DeckController.php:251` | RG-004,035（§3 DV-03） |  |
| a15-10 | 現行踏襲 | 乖離 | `scope_id` は「ボディ・integer・必須・公開範囲。公開（1）・非公開（2）・限定公開（3）」（同:250）。整合性検証の未充足は入力不正（HTTP 400）とし、エラーメッセージを返す | 乖離（必須項目の検証欠落・400であるべき入力不正が500になる疑い）／要実機確認 | `DeckController.php:314, DeckService.php:161, DtbDeck.php:129` | RG-014,036（§3 DV-08） |  |
| a15-10 | 現行踏襲 | 乖離 | 公開範囲は「非公開フラグ（`private_flg`）と限定公開トークン（`display_token`）で表現する」（同:276）／移行先はリクエスト `scope_id`（公開1・非公開2・限定公 | 乖離（非公開(2)が private_flg に反映されない疑い＝公開範囲の表現が設計どおりでない）／要実機確認 | `DeckService.php:198, DtbDeck.php:87` | RG-027 |  |
| a15-10 | 現行踏襲 | その他 | 採用カードは「ボード区分ごとに採用カード・メイビー・アトラクション・ステッカーとして組み立て」る（同:268）／メイビーカード（`dtb_maybe_card`）・アトラクションカード（`dtb_at |  | `DeckService.php:100` | ... === MtbBoard::ATTRACTION_B |  |
| a15-10 | 現行踏襲 | 乖離 | 「リクエストボディはフォーム送信形式で受け取り、全キーをそのまま参照する」（同:249）。呼び出し元はデッキビルダーアプリ（同:234） | 乖離（設計の受領形式（フォーム）と呼び出し元の送信形式（JSON）が不一致の疑い＝ボディが空で受領される可能性）／要実機確認 | `DeckController.php:287` | RG-033 |  |
| a15-10 | 現行踏襲 | 乖離 | 下書き保存は「更新内容をRedisにJSON形式で一時保存する（有効期間あり。既定1800秒）」（同:264） | 乖離（既定値の所在が設計と実装で不一致・環境依存）／要実機確認 | `DeckService.php:256, services.yaml:14` | RG-021 |  |
| a15-11 | 現行踏襲 | 乖離 | 成功時のメッセージは固定文字列「Deck delete success」（`function_spec_html_preview/pf-api/a15-11_api_deck_builder_deck | 乖離（現行踏襲違反・成功メッセージ literal の変更／ロケール依存化）／要実機確認 | `DeckController.php:158, DeckController.php:210, messages.en.yaml:3874` | RG-002,003 |  |
| a15-11 | 現行踏襲 | 乖離 | 404 のメッセージは固定文字列「The deck does not exist」（`...a15-11...html:241,254,282`） | 乖離（現行踏襲違反・404メッセージ literal の変更）／要実機確認 | `DeckController.php:135, DeckController.php:204, messages.en.yaml:3875` | RG-007,008 |  |
| a15-11 | 現行踏襲 | 乖離 | 認証は「ペイロード `aud` の顧客IDからプレイヤーを引く」（`...a15-11...html:236`） | 乖離（現行踏襲違反・JWTクレームが aud→sub へ変質。現行発行トークンでの認証互換が切れる可能性）／要実機確認 | `BaseController.php:69, JwtPlayerAuthenticator.php:47` | RG-011 |  |
| a15-11 | 現行踏襲 | その他 | 削除処理中の例外は「処理失敗（HTTP 500）とし、`{code, message}`（messageは例外メッセージ）を返す」（`...a15-11...html:241,254,282`） | PlayerNotFoundException`・`DeckAccessDeniedException`・`DeckNotFoundException` のみ捕捉し、`DeckService::deleteDeck` が再送出する例外（`e | `DeckController.php:149, BaseController.php:97` | **乖離（現行踏襲違反・500応答本文の形が非保証）／要実機 |  |
| a15-11 | 現行踏襲 | 乖離 | 入口は「`DELETE /deck/{id}`」（`...a15-11...html:232,240`） | 乖離（入口パスの差／設計に無い OPTIONS 応答の追加）／要実機確認 | `routes.yaml:37, DeckController.php:177` | RG-028 |  |
| a15-11 | 現行踏襲 | 乖離 | 論理削除は「デッキ本体に削除日時を設定し、検索・参照の対象から外すこと」（`...a15-11...html:229`）、対象は「削除時点で存在し、認証プレイヤーが所有するデッキ」（`:269`）、該 | 乖離（削除済みデッキが「検索・参照の対象から外れる」規定と不整合・再削除で deleted_at 上書き）／要実機確認 | `DeckController.php:134, DeleteDeckAction.php:48, DeckController.php:225` | RG-020／DV-08 |  |
| a15-11 | 現行踏襲 | 乖離 | 「論理削除とRedis一時保存の削除を1件のトランザクションで行い、例外時はロールバックする」（`...a15-11...html:241,289`） | 乖離（トランザクション規定と実態の不一致・失敗時の下書き喪失）／要実機確認 | `DeckService.php:277, DeckService.php:281` | RG-017 |  |
| a15-11 | 現行踏襲 | その他 | 「ヘッダ欠落・署名不正・該当するプレイヤーなしのいずれも認証拒否（HTTP 401）とし、`{code, message}` を返す」（`...a15-11...html:236`） | \RuntimeException` を捕捉して 401 化（`ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/JwtPlayerAuthenticator.php:42-49`） | `BaseController.php:68, DeckController.php:149` | **乖離（現行のトークン不正形式時の応答が401にならない可 |  |
| a15-11 | 現行踏襲 | 乖離 | 「該当するプレイヤーなし」も認証拒否（HTTP 401）。失敗表の 401 メッセージは「Access Token is incorrect」「Authentication failed」（`...a | 乖離（現行踏襲差・401メッセージの割当変更）／要実機確認 | `BaseController.php:81, DeckController.php:191, messages.en.yaml:3865` | RG-011 |  |
| a15-12 | 現行踏襲 | 乖離 | 応答の `scope_id` は公開区分・非公開フラグ・閲覧用トークンから組み立てる（`function_spec_html_preview/pf-api/a15-12_api_deck_builde | 乖離（scope_id組み立ての欠落・公開範囲判定の齟齬）／要実機確認 | `—` | RG-028, RG-002(DS) |  |
| a15-12 | 現行踏襲 | 乖離 | `cards`（採用カードの配列）は成功応答のフィールドとして規定され（同HTML:252）、公開範囲の条件は付されていない。非公開デッキも所有者本人は参照できる（同HTML:305）＝所有者にはデッ | 乖離（非公開フラグ時の cards 欠落・応答契約違反）／要実機確認 | `—` | RG-018, RG-019 |  |
| a15-12 | 現行踏襲 | 乖離 | 論理削除は削除日時（`deleted_at`）で表し、物理削除は行わない（同HTML:228）＝論理削除済みデッキは参照対象から除かれる想定 | 乖離（論理削除デッキの除外なし・検索系との不整合／設計の記述欠落）／要実機確認 | `—` | RG-029 |  |
| a15-12 | 現行踏襲 | 乖離 | `player_name` は「プレイヤー名（大会デッキの場合）」、`nickname` は「所有プレイヤーのニックネーム（ユーザーデッキの場合）」（同HTML:252）＝該当種別以外では値を持たない | 乖離（応答フィールドのELSE値が削除日時・型/意味の逸脱）／要実機確認 | `—` | RG-014, RG-015 |  |
| a15-12 | 現行踏襲 | 乖離 | 下書きがある場合は公開範囲を判定して返す（同HTML:242）。下書きから返す場合はフォーマット名・アーキタイプ名・代表カード画像をマスタから補完して返す（同HTML:253）＝下書き応答はDB確定内 | 乖離（下書きあり×DB該当なし時の未定義動作／設計の記述欠落）／要実機確認 | `—` | RG-003(DS-13〜17), RG-020 |  |
| a15-13 | 現行踏襲 | 乖離 | キャンペーンタグの `is_during` は「開催前0・開催中1・開催後2」の状態を返す（正本 L256『campaign_tags array キャンペーンタグの配列。各要素は id・name_j | 乖離（開催中/開催前の判定誤り・is_during が設計の3状態を正しく表さない）／要実機確認 | `DtbDeckRepository.php:670, MtbCampaignTag.php:14` | RG-043 |  |
| a15-13 | 現行踏襲 | 乖離 | 自分のデッキ検索（private）の応答に限定公開トークン `display_token` を含める（正本 L256『display_token string 限定公開トークン。自分のデッキ検索（pr | 乖離（DQL連結不備・private検索の成否に影響しうる）／要実機確認 | `DtbDeckRepository.php:509, MtbDisp.php:12` | RG-002,041 |  |
| a15-13 | 現行踏襲 | その他 | キャンペーンタグの並びは `mtb_campaign_tag.sort_no` を用いる（正本 L229） | sortNo" deck-api/src` は別リポジトリの tag/category のみ該当）、`sort_no` 列は移行先 `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCampai | `DtbDeckRepository.php:469` | **乖離（キャンペーンタグ並び順が設計記述どおりに担保されな |  |
| a15-13 | 現行踏襲 | 乖離 | 自分のデッキ検索は認証必須で、失敗時は認証拒否（HTTP 401）とする（正本 L238）。失敗条件は「トークン欠落・署名不正・該当プレイヤーなし」（正本 L258） | 乖離（認証失敗の一部が設計の401にならない可能性）／要実機確認 | `BaseController.php:68` | RG-003,004,005,044 |  |
| a15-13 | 現行踏襲 | 乖離 | `deck_tags`／`campaign_tags` の各要素は id・name_jp・name_en（campaign は加えて is_during）を持つ（正本 L256） | 乖離（タグ配列の id と名称の対応が崩れうる）／要実機確認 | `DtbDeckRepository.php:466, MtbCampaignTag.php:36` | RG-042,043 |  |
| a15-14 | 現行踏襲 | 乖離 | 集計範囲は「イベント日が、現在からフォーマットのメタ範囲日数前の0時0分から本日23時59分59秒までの範囲」（`function_spec_html_preview/pf-api/a15-14_ap | 乖離（現行の型不整合・下限境界が設計どおり効かない可能性）／要実機確認 | `DtbDeckRepository.php:760, DtbDeckRepository.php:528` | RG-008(DV-01,DV-02) |  |
| a15-15 | 現行踏襲 | 乖離 | 土地限定かつ基本土地を含めない設定のときの基本土地特殊タイプ除外と、`archetype_id`・`board_id` の絞り込みは、それぞれ独立した集計条件として適用される（`function_sp | 乖離（絞り込み条件の迂回＝集計結果の誤り）／要実機確認 | `DtbDeckRepository.php:124, DtbDeckRepository.php:1084` | RG-012（DV-05併用） |  |
| a15-15 | 現行踏襲 | 乖離 | 「呼び出し時点の集計範囲・デッキ状況に基づく集計結果を返す」（`a15-15_api_deck_builder_deck_usage_card.html:289`） | 乖離（参照時点の規定と結果キャッシュの不整合・設計未記載）／要実機確認 | `DtbDeckRepository.php:196` | RG-036 |  |
| a15-15 | 現行踏襲 | 乖離 | `cards[].image_jp` は「カードの日本語版画像のURL。該当が無いときはnull」、`cards[].image_en` は「カードの英語版画像のURL。該当が無いときはnull」（` | 乖離（該当なし時のnull規定違反・別言語URLの混入）／要実機確認 | `DtbDeckRepository.php:148` | RG-023 |  |
| a15-15 | 現行踏襲 | 乖離 | DBカラムに記載する参照テーブルは `mtb_format`・`dtb_deck`・`dtb_deck_card`・`mtb_card`・`mtb_card_image` の5つ（`a15-15_ap | 乖離（設計のDBカラム表に参照テーブルの欠落・テスト前提データの取りこぼし要因）／要実機確認 | `DtbDeckRepository.php:172` | RG-013,014,023,031 |  |
| a15-16 | 現行踏襲 | 乖離 | 抽出の対象データは「大会日が設定済みで、大会名（日本語・英語）がいずれも空でない行に限る」（同:228,245）とのみ規定され、フォーマットの有無は抽出条件に挙げられていない。結合は「フォーマットマス | 乖離（設計の抽出条件に無い暗黙除外＝設計記述漏れ疑い）／要実機確認 | `MtbLatestEventDeckRepository.php:29, MtbLatestEventDeckRepository.php:65, MtbLatestEventDeck.orm.yml:50` | RG-004・§3 DV-07 |  |
| a15-16 | 現行踏襲 | 乖離 | 利用者視点の入口は「直近大会情報取得 GET `/recent_event`」（同:233）のみで、OPTIONSメソッド・CORS応答は本書に記載がない。現行(deck-api)のルートも GET  | 乖離（現行踏襲差・設計未記載のOPTIONS/CORS）／要実機確認 | `DeckController.php:643` | RG-001,007 |  |
| a15-16 | 現行踏襲 | 乖離 | エンドポイントは `/recent_event`（同:233）。現行(deck-api)も同一パス（`deck-api/config/routes.yaml:58`・`path: /recent_ev | 乖離（内部差・エンドポイントパス）／要実機確認 | `DeckController.php:643` | RG-001 |  |
| a15-16 | 現行踏襲 | 乖離 | `events[].participants` は「型 integer／参加者数」（同:252）と規定。`serialize_null` は有効（同:274） | 乖離（設計の型規定と実データの整合・null返却の可能性）／要実機確認 | `MtbLatestEventDeck.orm.yml:43` | RG-010 |  |
| a15-16 | 現行踏襲 | 乖離 | 「キャッシュ: 一覧は結果キャッシュする」（同:245,273）／「結果キャッシュの有効期間内は同一結果を返す場合がある」（同:282）と規定するのみで、有効期間（TTL）・キャッシュキーは本書に明示 | 乖離ではない（設計沈黙・現行踏襲は保たれる）／TTLは要実機確認 | `MtbLatestEventDeckRepository.php:15, MtbLatestEventDeckRepository.php:48` | RG-015 |  |
| a15-17 | 現行踏襲 | 乖離 | `format_id` の不備は検証エラー＝入力不正（HTTP 400）とし、その他の例外は処理失敗（HTTP 500）とする（`...register.html:243,256,277,294`）。 | 乖離（設計に無い404・現行踏襲差）／要実機確認 | `ImportDeckAction.php:87, DeckController.php:711, DeckController.php:396` | RG-015・DV-06 |  |
| a15-17 | 現行踏襲 | 乖離 | 入口は `POST /deck/import`（`...register.html:234`）。現行のルートも `path: /deck/import`（`deck-api/config/routes | 乖離（入口パス・許容メソッドの差）／要実機確認 | `DeckController.php:667` | §1（入口） |  |
| a15-17 | 現行踏襲 | 乖離 | 移行先は公開区分3値を非公開フラグ `private_flg` と閲覧用トークン `display_token` に分けて保持する（3値の移行可否は要確認）（`...register.html:228 | 乖離（設計記述と実データモデルの不一致・公開区分の保持先）／要実機確認 | `DtbDeck.php:87, DeckService.php:187` | RG-034 |  |
| a15-17 | 現行踏襲 | 乖離 | `scope_id` は任意（未指定可）で、限定公開のときのみ `display_token` を返す（`...register.html:250,254`） | 乖離（任意項目の未指定時挙動が設計と不整合）／要実機確認 | `DeckController.php:419, DeckController.php:735` | RG-013,026 |  |
| a15-17 | 現行踏襲 | 乖離 | DB操作の登録/更新対象テーブルに `mtb_format` を列挙（`...register.html:288`）。一方DBカラム節は `mtb_format` を「カードリスト解読の挙動判定に用い | 乖離（設計の過大記載・マスタ更新の事実なし）／要実機確認 | `DeckController.php:396, ImportDeckAction.php:87` | RG-028 |  |
| a15-17 | 現行踏襲 | 乖離 | 保存処理中のその他の例外は処理失敗（HTTP 500）とし、本文 `{code, message}` の `message` に例外メッセージを返す（`...register.html:256,294 | 乖離（500応答本文の形・例外メッセージ欠落）／要実機確認 | `ImportDeckAction.php:149, DeckController.php:696` | RG-016,022 |  |
| a15-18 | 現行踏襲 | 乖離 | `errors` は解読できない該当行の行番号＝0始まりのインデックスの配列（詳細設計 L259／`0515:L1975`。サンプル L275 `"errors": [3, 7]`） | 乖離（設計=0始まり vs 実装=1始まり／呼び出し元のエラー行ハイライトが1行ずれる）／要実機確認 | `CardUtil.php:64, CardUtil.php:133, CardUtil.php:79` | RG-011（期待はオラクル=0始まり） |  |
| a15-18 | 現行踏襲 | その他 | 失敗はいずれも `{code, message}` の本文で返す。保存処理中のその他の例外は処理失敗（HTTP 500）とし `{code, message}` を返す（詳細設計 L261・L299／ | PlayerNotFoundException`(:698)・`DeckAccessDeniedException`(:703)・`DeckNotFoundException`(:708)・`FormatNotFoundException` | `ImportDeckAction.php:149, DeckController.php:687` | **乖離（移行先の実装漏れ／500時の本文形が設計と不一致） |  |
| a15-18 | 現行踏襲 | 乖離 | 404（該当なし）は「パスの id に一致するデッキが無い」場合の応答であり、`format_id` の不正値は検証失敗＝入力不正（HTTP 400）（詳細設計 L261／`0515:L1977`） | 乖離（設計の失敗表に無い404／要実機確認） | `DeckController.php:713` | RG-005,DV-06 |  |
| a15-18 | 現行踏襲 | 乖離 | 処理結果メッセージは更新時「Deck update success by import」（詳細設計 L248・L259／`0515:L1964,L1975`） | 乖離（文言がロケール依存・設計は固定文言を規定）／要実機確認 | `DeckController.php:684, messages.en.yaml:3881, messages.ja.yaml:6321` | RG-009,010 |  |
| a15-18 | 現行踏襲 | 乖離 | 認証失敗は「ヘッダ欠落・署名不正・該当するプレイヤーなし」のいずれも認証拒否（HTTP 401）（詳細設計 L239・L261／`0515:L1955,L1977`） | 乖離（トークン不正の一部が401にならない／設計は「署名不正」以外の不正形式に沈黙＝要実機確認） | `BaseController.php:68` | RG-002,003 |  |
| a15-18 | 現行踏襲 | その他 | 箇所 | 影響 | `—` |  |  |
| a16-01 | 現行踏襲 | 乖離 | 応答プロパティ名は snake_case（Excel 0516:L972-979 の名前定義・サンプル 0516:L986-995 の `"image_url"`,`"disp_type"`,`"na | 乖離（詳細設計の記述誤り・Excel+実装がsnake_case）／要実機確認 | `MtbTopBanner.php:6, MtbLanguage.php:6, fos_rest.yaml:16` | RG-002 |  |
| a16-01 | 現行踏襲 | 乖離 | 応答の関連言語サンプル（Excel 0516:L992-995）＝`"id": 1, "name_jp": "日本語", "name_en": "Japanease", "code": "JP"` | 乖離（詳細設計サンプルの記述誤り・Excel+実マスタが正） | `Version20251125143744.php:63, MtbLanguage.orm.yml:31` | RG-002,003 |  |
| a16-01 | 現行踏襲 | 乖離 | バナーIDは 数字(整数)・必須（Excel 0516:L953／詳細設計L321「id パス integer 必須」） | 乖離（必須・型の入力検証なし）／要実機確認 | `routes.yaml:156, BannerController.php:20` | RG-008（DP-04,05） |  |
| a16-01 | 現行踏襲 | 乖離 | languages は関連する言語の配列（Excel 0516:L976-979／詳細設計L324,L347）。並び順は Excel・詳細設計とも規定なし | 乖離（並び順が設計・実装とも未定義）／要実機確認 | `MtbTopBanner.orm.yml:38, MtbLanguage.php:212` | RG-003 |  |
| a16-01 | 現行踏襲 | 乖離 | リクエスト書式（Excel 0516:L939「リクエスト書式 クエリ」） | 乖離（Excel記述の誤り・軽微） | `routes.yaml:157` | RG-006,008 |  |
| a16-02 | 現行踏襲 | 乖離 | 応答プロパティ名は スネークケース＝`id`／`image_url`／`link`／`disp_type`／`languages.id`／`languages.name_jp`／`languages. | 乖離（詳細設計の記述誤り・Excel優先で不採用）／詳細設計HTMLの是正が必要 | `MtbTopBanner.php:24, TopBannerResponseBuilder.php:43` | RG-002,003,004 |  |
| a16-02 | 現行踏襲 | 乖離 | 404は該当データがない場合＝「言語コード未設定」または「言語コードに紐づいたトップバナーIDがない場合」のいずれか（Excel `:1129`） | 乖離（現行実装がExcel 404条件と不一致・詳細設計も自己矛盾）／要実機確認 | `BannerController.php:50, ContentController.php:95` | RG-010（DV-03） |  |
| a16-02 | 現行踏襲 | 乖離 | 取得対象は「指定言語の設定済みトップバナー」（Excel `:1107`・`:1110`／詳細設計 `:318`）。※「設定済み」の判定条件そのものはExcel・詳細設計とも未定義（RG-021 要実 | 乖離（現行踏襲違反・「設定済み」絞り込みの消失＝非表示バナー露出）／要実機確認 | `MtbTopBannerRepository.php:20, ContentController.php:102, MtbLanguage.php:193` | RG-021（SEED-TB-HIDDEN/SEED-TB- |  |
| a16-02 | 現行踏襲 | 乖離 | メソッドは GET（Excel `:1102` HTTPメソッド一覧で GET に〇／`:1105`「メソッド GET」）。エンドポイントは `/topBanners/{言語コード}.json`（Ex | 乖離（Excel メソッド規定違反・.jsonルートのGET非限定）／要実機確認 | `routes.yaml:160, ContentController.php:86` | RG-013 |  |
| a16-02 | 現行踏襲 | 乖離 | 一覧の並び順（Excel・詳細設計とも規定なし＝仕様欠落・RG-020 要実機確認） | 乖離（仕様欠落＋現行踏襲違反・並び順の非決定化）／要実機確認・設計への並び順追記が必要 | `MtbTopBannerRepository.php:28, ContentController.php:102, MtbLanguage.php:193` | RG-020 |  |
| a17-01 | 現行踏襲 | 乖離 | 応答プロパティ名（詳細設計L347は「camelCase」と記述） | 乖離（詳細設計の記述誤り・Excel+実装がsnake_case） | `DtbArticle.php:8` | RG-002 |  |
| a17-01 | 現行踏襲 | 乖離 | Excel項目表 `0517:L1011` が deleted_at を応答フィールドに列挙 | 乖離（Excel項目表の誤り・実装は非公開） | `DtbArticle.php:42` | RG-003 |  |
| a17-01 | 現行踏襲 | 乖離 | 「記事情報1件」を取得（Excel 0517:L979） | 乖離（一意性未担保・重複時500懸念）／要実機確認 | `DtbArticleRepository.php:21, DtbArticle.orm.yml:17` | RG-001,014 |  |
| a17-01 | 現行踏襲 | 乖離 | メソッド=GET（Excel 0517:L975）／詳細設計 `GET /article`（L311,L315） | 乖離（/article.json が非GETも受理）／軽微 | `routes.yaml:145, routes.yaml:148` | RG-009 |  |
| a17-01 | 現行踏襲 | 乖離 | wpPostId は必須・integer（Excel 0517:L988／詳細設計L323） | 乖離（必須・型の入力検証なし）／要実機確認 | `ArticleController.php:88` | RG-008（DP-04,05） |  |
| a17-01 | 現行踏襲 | 乖離 | Excel `0517:L988` wpPostId(数値/整数)の備考が「jaもしくはenのいずれか」 | 乖離（Excel備考の誤転記）／要確認 | `DtbArticleRepository.php:23` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | `limit` 未指定時の取得件数は既定20件（Excel 0517:L1643「設定しない場合は取得件数20件とする」／詳細設計 L322「未指定時は20件」） | 乖離（実装バグ・null上書きでデフォルト20が不発）／要実機確認 | `ArticleController.php:119, DtbArticleRepository.php:37` | RG-005,017(DV-03) |  |
| a17-02 | 現行踏襲 | 乖離 | 共有フラグ `hasSameDeck` 等の型（Excel 0517:L1663-1666「文字型」／応答例 0517:L1675-1678 は `"0"` の文字列。詳細設計 L326 は「inte | 乖離（詳細設計の型記述誤り・Excel/実装は文字列） | `DtbArticleRepository.php:51` | RG-007 |  |
| a17-02 | 現行踏襲 | 乖離 | 関連記事なし時は HTTP404（Excel 0517:L1653／詳細設計 レスポンス失敗表 L328「404 {code,message}"Not Found"」） | 乖離（詳細設計 エラー処理表の記述矛盾・正はL328/Excel/実装の404） | `ArticleController.php:120` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | 関連判定は「同一デッキ・アーキタイプ・カード・イベント詳細のいずれかを共有」（詳細設計 L325）。関連判定の内部詳細は「実装を確認値とする」（詳細設計 L304・仕様確定せず） | 乖離（spec沈黙の実装条件・要仕様反映確認） | `DtbArticleRepository.php:60` | RG-002,012 |  |
| a17-04 | 現行踏襲 | 乖離 | エンドポイントは `/api/product/detail/{productId}.json`（Excel `excel_to_html/output/0517_基本設計仕様書(API_その他).ht | 乖離（詳細設計の記述欠落・入口パスの二重定義）／要実機確認（現行の`/api`付与箇所） | `routes.yaml:231, ProductController.php:50` | RG-002,023 |  |
| a17-04 | 現行踏襲 | 乖離 | `card_detail.formats` はリーガリティを表す文字列（Excel `:2039` 型=文字列／Excelサンプル `:2120` `"formats": "Commander,Leg | 乖離（詳細設計の型記述誤り。期待はExcel＝文字列を採用）／要実機確認 | `DtbProductRepository.php:335, ProductController.php:448, ProductRepository.php:292` | RG-014 |  |
| a17-04 | 現行踏襲 | 乖離 | `lang`（言語）は必須（Excel `:1988` 必須欄=〇・入力例 JP） | 乖離（Excel必須規定と実装・詳細設計の不一致。未指定時の応答は断定せず要実機確認） | `ProductController.php:400, ProductController.php:54` | RG-021, DV-06 |  |
| a17-04 | 現行踏襲 | 乖離 | `region_restriction` は地域制限の名称（文字列）（Excelサンプル `:2056` `"region_restriction": "制限なし"`／詳細設計 `:337`・移行先列 | 乖離（Excel項目表の型・説明誤り。期待はExcelサンプル＝名称文字列を採用）／要実機確認 | `ProductController.php:430, ProductDetailResponseBuilder.php:57` | RG-016 |  |
| a17-04 | 現行踏襲 | 乖離 | 「商品IDと言語で商品詳細を取得する」「指定言語に対応する商品詳細を返す」（Excel `:2163,:2225`）＝言語での絞り込みが必須。現行は言語コードを WHERE 条件に持つ（`pf-api | 乖離（現行踏襲違反・言語絞り込みの欠落＝誤データ応答）／要実機確認 | `ProductRepository.php:301, ProductDetailResponseBuilder.php:54` | RG-020, RG-001 |  |
| a17-04 | 現行踏襲 | 乖離 | 取得対象データは「リクエストで指定されたID・条件に一致するデータ」（Excel `:2166`）。現行は公開・未削除・価格>0 の商品規格のみを対象とする（`pf-api/src/Repositor | 乖離（現行踏襲違反・非公開/削除商品の露出／設計の抽出条件記述欠落）／要実機確認 | `ProductRepository.php:297` | RG-001,004,034 |  |
| a17-04 | 現行踏襲 | 乖離 | 表示条件の良品判定は「良品（NM）」（Excel `:2163`）。現行はコンディションIDで NM を判定する（`pf-api/src/Controller/ProductController.ph | 乖離（現行踏襲違反・NM判定基準の変質＝表示規格の増減）／要実機確認 | `ProductRepository.php:275, ProductDetailResponseBuilder.php:181` | RG-007, DV-01〜04 |  |
| a17-05 | 現行踏襲 | 乖離 | Excel 0517:L2280「該当した商品全てを出力する」＝件数上限なし | 乖離（Excel全件 vs 実装100/410件上限）／要実機確認 | `ProductController.php:373, DtbProductSubClassRepository.php:391` | RG-006 |  |
| a17-05 | 現行踏襲 | 乖離 | 商品を単位に100件で打ち切る（詳細設計 L325,L328） | 乖離（実装バグ・100番目商品の規格欠落）／要実機確認 | `ProductController.php:373` | RG-006 |  |
| a17-05 | 現行踏襲 | その他 | その他コンディション表示不可時は「良品(NM)の規格のみに絞る」（詳細設計 L325,L328） |  | `ProductController.php:590` | !is_null($product['high_price_ |  |
| a17-05 | 現行踏襲 | 乖離 | 商品ごとにその他コンディションの表示可否を判定する（詳細設計 L325,L328。判定式はオラクル未規定＝要実機確認） | 乖離（実装バグ・死コード/意図不整合）／要実機確認 | `ProductController.php:558` | RG-005 |  |
| a17-05 | 現行踏襲 | 乖離 | Excel 0517:L2301「404 or 500 異常」＝異常時は404または500 | 乖離（異常系500の明示規定なし・Excelと詳細設計/実装で異常コードの網羅が不一致）／要実機確認 | `ProductController.php:310` | RG-010,013 |  |
| a17-05 | 現行踏襲 | 乖離 | Excel 0517:L2314 は `products.language_code` の説明を「商品コード」と記載 | 乖離（Excel応答説明の誤記・実装は正） | `ProductController.php:349` | RG-008 |  |
| a17-05 | 現行踏襲 | 乖離 | Excelサンプル応答 0517:L2331 は最上位に `code`(=200) を返し、詳細設計 L335 も最上位を `code integer 処理結果コード（成功時200）` と定義＝最上位 | 乖離（Excelスキーマ表 count vs サンプル/詳細設計 code の内部矛盾・count フィールド有無=要実機確認） | `—` | RG-008 |  |
| b02-01 | カスタマイズ | 乖離 | 受注ステータスがキャンセル・処理中の受注は各期間の合計から除外する（詳細設計 L320・Excel沈黙部の補完／Excelはキャンセル除外を規定 0404:L969） | 乖離（現行挙動との差・除外条件の欠落）／要実機確認 | `DtbSalesQuantityRepository.php:429, OrderDetailRepository.php:316` | RG-015 |  |
| b02-01 | カスタマイズ | 乖離 | 反映先は商品規格ID・支店ID＋7期間の販売数集計データ（Excel 0404:L972,L973）。詳細設計は「移行先は補助表を設けず商品規格 `dtb_product_class` の `orde | 乖離（詳細設計の記述誤り＝設計書側の要修正）／要実機確認 | `DtbSalesQuantityRepository.php:106` | RG-016 |  |
| b02-01 | カスタマイズ | 乖離 | 起動はコンソールのバッチコマンド `product:batch updateProductSummary`（詳細設計 L312,L316・Excel沈黙部の補完） | 乖離（コマンド名変更・設計書/ジョブ設定との不整合）／要実機確認 | `AggregateSalesCommand.php:33, ProductBatch.php:14` | RG-001,RG-002 |  |
| b02-01 | カスタマイズ | 乖離 | 途中失敗時は反映済みの行のみ更新が残る／部分反映は次回実行で回収される（詳細設計 L326,L329,L332） | 乖離（失敗時の反映粒度の差）／要実機確認 | `BatchAggregateSalesAction.php:42, UpdateProductSummary.php:35` | RG-020,RG-021 |  |
| b02-01 | カスタマイズ | 乖離 | 100件ごとに変更を反映しキャッシュをクリアしながら処理する（長時間処理・メモリ管理のため。詳細設計 L317,L350） | 乖離（処理方式の差・長時間/大量件数時のメモリ挙動が未担保）／要実機確認 | `BatchAggregateSalesAction.php:37, UpdateProductSummary.php:32` | RG-023,RG-024 |  |
| b02-01 | カスタマイズ | 乖離 | 集計結果の行ごとに販売数列を更新する（上書き更新）。対象が無い場合は更新を行わずに終了する（詳細設計 L317／Excel 0404:L973 は「更新を行う」） | 乖離（設計に無い一括削除・非更新前提との不整合）／要実機確認 | `DtbSalesQuantityRepository.php:93, BatchAggregateSalesAction.php:46` | RG-018 |  |
| b02-01 | カスタマイズ | 乖離 | 本店の支店IDは0として処理する（Excel★ 0404:L959） | 乖離（本店の支店ID表現の差・ID0の用途競合）／要実機確認 | `DtbSalesQuantityRepository.php:39, BaseInfo.php:1533` | RG-011 |  |
| b02-01 | カスタマイズ | 乖離 | 集計期間は当日基準の各区間（Excel 0404:L957／詳細設計 L323）。現行は受注日を日単位（`date_format`）で比較する | 乖離（期間境界の粒度差・現行挙動との差）／要実機確認 | `DtbSalesQuantityRepository.php:440, OrderDetailRepository.php:334` | RG-007(DP-09) |  |
| b02-01 | カスタマイズ | 乖離 | 受注詳細と受注を受注IDで結合し、商品規格IDでグループ化する（詳細設計 L323）。集計単位は商品規格ID・支店ID（Excel 0404:L972） | 乖離（設計に無い集計キー・明細限定）／要実機確認 | `DtbSalesQuantityRepository.php:446` | RG-010,RG-012 |  |
| b02-02 | カスタマイズ | 乖離 | 未削除の入荷通知リクエストのうち、対応する商品が存在しないものも対象に削除日時を一括設定する（詳細設計 `function_spec_html_preview/pf-eccube3/b02-02_ba | 乖離（現行踏襲違反・条件の脱落）／要実機確認 | `DtbProductRequestRepository.php:481` | RG-006, RG-004(DV-07) |  |
| b02-02 | カスタマイズ | 乖離 | 入口はコンソールのバッチコマンド `product:batch deleteProductRequest`（詳細設計 `function_spec_html_preview/pf-eccube3/b0 | 乖離（起動I/Fの変更・運用影響）／要実機確認 | `CancelProductRequestCommand.php:32` | RG-016, RG-018, RG-021 |  |
| b02-02 | カスタマイズ | 乖離 | 開始・完了のコンソール出力（日時付き）を記録する（詳細設計 `function_spec_html_preview/pf-eccube3/b02-02_batch_product_product_ar | 乖離（現行踏襲差・ログ欠落）／要実機確認 | `CancelProductRequestCommand.php:55` | RG-022 |  |
| b02-03 | カスタマイズ | 乖離 | 集計対象の在庫変動区分は親区分が「入庫」「買取」のみ（Excel 0402:L1252）。移動・分割は含まない（L1253） | 乖離（カスタマイズ未達・買取欠落） | `DtbStockUpQuantityRepository.php:150, MtbStockChangeType.php:27, DtbStockHistoryRepository.php:294` | RG-003,016 |  |
| b02-03 | カスタマイズ | 乖離 | 集計単位は商品コード・店舗・在庫区分（在庫場所）ごと（Excel 0402:L1246,L1250,L1256「在庫場所が一致」） | 乖離（在庫区分次元欠落・閉店除外は仕様外） | `DtbStockUpQuantityRepository.php:159` | RG-005,009 |  |
| b02-03 | カスタマイズ | 乖離 | 集計期間は Excel 0402:L1254 の8区分（当日・前日・3日間・1週間・1ヶ月間・90日間・180日間・365日間） | 乖離（期間区分の構成差）／要実機確認 | `DtbStockUpQuantityRepository.php:148` | RG-006,007,008 |  |
| b02-03 | カスタマイズ | 乖離 | 商品コード・店舗・在庫場所が一致する集計データがあれば更新、無ければ新規登録＝UPSERT（既存行は保持）（Excel 0402:L1256,L1257） | 乖離（全件DELETEでのデータ消失懸念）／要実機確認 | `BatchAggregateStockUpAction.php:38, DtbStockUpQuantityRepository.php:97` | RG-010,011,012 |  |
| b02-03 | カスタマイズ | 乖離 | 排他制御・トランザクションを持たない（詳細設計 L351「ロックファイル・楽観/悲観ロックの対象を持たない」・参照系） | 乖離（詳細設計の記述と実装差） | `BatchAggregateStockUpAction.php:35` | §5 排他制御 要判定 |  |
| b02-03 | カスタマイズ | 乖離 | 本機能は集計テーブルを更新または新規登録する（Excel 0402:L1268・詳細設計 L318,L327,L330 も更新を記述） | 乖離（詳細設計の誤記・オラクルはExcel「更新/新規登録」） | `DtbStockUpQuantityRepository.php:97, UpdateProductSummaryForStockUp.php:33` | RG-015 |  |
| b02-03 | カスタマイズ | その他 | 補足: `enterprise:DtbStockUpQuantityRepository.php:43-92` `updateStockUpQuantityNative` は本バッチから呼ばれない未使 | — | `—` | — |  |
| b02-04 | 現行踏襲 | 乖離 | 通知メール本文の一覧は最大10,000件まで取得し、それ以降は省略する（Excel 0404:L1320）＝該当が何件でも通知は一覧1件分に収まる | 乖離（10,000件上限の解釈差・分割送信）／要実機確認 | `CheckNoSectionProduct.php:9` | RG-009(DB-04),010 |  |
| b02-05 | 現行踏襲 | 乖離 | 会員ごとに送り先・セール商品をまとめる（`0404:1447`／詳細設計 L318「会員（選手情報）ごとに、宛先（氏名・メール・都道府県）と対象商品の一覧をまとめる」） | 乖離（現行の集約が2件目以降で成立しない恐れ）／要実機確認 | `SaleNotificationService.php:34, DtbFavoriteProductRepository.php:53, BatchFavoriteSaleNotificationAction.php:74` | RG-008,009,019 |  |
| b02-05 | 現行踏襲 | 乖離 | 本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない（詳細設計 L339）。副作用はセール通知メール送信のみ（L333／`0404:1451` 出力先=メール） | 乖離（設計の副作用/DB操作記述と実装の不一致）／要実機確認 | `MailService.php:1275, MailService.php:1826` | RG-016,017 |  |
| b02-05 | 現行踏襲 | 乖離 | 起動は `product:batch saleNotification`（詳細設計 L313・現行 `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductB | 乖離（現行踏襲差・起動コマンド名／不正コマンド時出力）／要実機確認 | `FavoriteSaleNotificationCommand.php:34` | RG-001,002,003 |  |
| b02-05 | 現行踏襲 | 乖離 | 実行トリガー＝スケジュール起動(Step Functions)・実行タイミング＝毎週水曜17:30（`0404:1450`）。一方 処理概要は「セール開始日に送信ではなく、セール商品がある場合は毎日送 | 乖離（Excel内部不整合・起動頻度未確定）／要実機確認 | `ProductBatch.php:28, FavoriteSaleNotificationCommand.php:34` | RG-031 |  |
| b02-05 | 現行踏襲 | 乖離 | 会員住所が日本の会員には【お気に入り/日】、国外の会員には【お気に入り/英】を送る（`0404:1448-1449`／`0404:1460` 会員の住所が日本か海外かを見て送信する言語を選択）。詳細設 | 乖離（住所ではなく都道府県=海外での判定・未設定時の既定挙動が設計に無い）／要実機確認 | `MailService.php:1253, MailTemplate.php:53, MailService.php:1797` | RG-010,011,012 |  |
| b02-06 | カスタマイズ | 乖離 | 機能区分の記述: Excel は「現行システムから変更なし(現行踏襲)」（`0404_基本設計仕様書(バッチ_商品管理).html:1563`） | 乖離（設計間の機能区分記述の不一致・オラクル選択には影響なし）／要実機確認 | `—` | 全般（§ヘッダ） |  |
| b02-06 | カスタマイズ | 乖離 | 引数不足時は「開始日と終了日の指定を促すメッセージを出力して終了する」（`:317`）／「引数不足時はメッセージを出力して何もしない」（`:323`） | 乖離（引数不足が成功扱い・運用検知不能）／要実機確認 | `InsertStockHistory.php:34, ProductBatch.php:56` | RG-002,003,020 |  |
| b02-06 | カスタマイズ | 乖離 | 「当ドメインは承認ワークフローを介さず persist/flush で直接確定する」「確定は persist/flush による即時反映」（`:335,:336`） | 乖離（確定手段がネイティブINSERT・設計はpersist/flushと記述）／要実機確認 | `DtbStockHistoryRepository.php:63, InsertStockHistory.php:71` | RG-026,022 |  |
| b02-07 | カスタマイズ | その他 | 本テーブルの洗い替え（全削除→登録）（Excel 0402:L1404） | 注記（移行先はtxラップ・現行はtxなし・正本に固定オラクルなし） | `DtbWeeklyStockHistoryRepository.php:67` | RG-013 |  |
| b02-07 | カスタマイズ | 乖離 | 各週末時点の在庫数を取得し登録する（Excel 0402:L1379,L1388） | 乖離（実装バグ懸念・在庫10000以上で桁あふれ）／要実機確認 | `DtbWeeklyStockHistoryTempRepository.php:30` | RG-002,004 |  |
| b05-01 | 現行踏襲 | 乖離 | 連携対象は注文日時が窓[T-30分, T]内の注文（Excel 0405:L1029＋入力データ検索条件 0405:L1075「注文データ.注文日時＝バッチ駆動時間からバッチ駆動時間より30分前」＝窓 | 乖離（実装の比較方向がExcel窓[T-30分,T]と逆・要実機確認は等号のみ） | `OrderRepository.php:1909, OtcOrderSmaregiPostCommand.php:48` | RG-002, DT-08 |  |
| b05-02 | 現行踏襲 | 乖離 | 注文番号は現行8桁、移行先 dtb_order.order_number は文字列・桁11で桁・型が現行と異なる（要確認）（詳細設計L305） | 乖離疑義（型キャスト・要実機確認） | `ResendMailAction.php:82` | RG-011 |  |
| b05-02 | 現行踏襲 | 乖離 | 「同名バッチが実行中（未完了の旨を出力して終了）」と「ロック取得失敗（異常として終了）」を区別（詳細設計L316,L341） | 乖離（詳細設計の2状態を折り畳み・Excel準拠では軽微） | `ResendMailAction.php:50, ResendMailCommand.php:59` | RG-018,019 |  |
| b05-04 | 現行踏襲 | その他 | 連携失敗時は発生したスマレジ連携ごとに管理者へエラーメールを送信する（Excel 0405:L1514,L1515） | \ | `SmaregiService.php:64` | !array_key_exists('result',$re |  |
| b05-04 | 現行踏襲 | 乖離 | 連携失敗時は管理者へエラーメールを送信する（副作用保証）（Excel 0405:L1515） | 乖離（通知先未設定時にエラーメール副作用が欠落・サイレント）／要実機確認 | `MailService.php:1381` | RG-007 |  |
| b05-04 | 現行踏襲 | 乖離 | 未連携区分（商品・在庫）それぞれについて再連携する。一注文で両方未連携の状態も想定される（Excel 0405:L1513／詳細設計 L316,L319） | 乖離（部分失敗時に後続区分を当該実行でスキップ・設計未記載）／要実機確認 | `SmaregiService.php:67` | RG-008 |  |
| b05-04 | 現行踏襲 | その他 | 連携時のエラーは管理者へメールで通知する（Excel 0405:L1514,L1515） | 詳細設計の記述誤り（Excel・実装ともメール通知／L339は不採用） | `SmaregiService.php:53` | RG-007 |  |
| b05-04 | 現行踏襲 | その他 | （移行時の扱い）Excel 図形注記「注文番号登録バッチの仕様変更により、こちらのバッチは不要となる」（Excel 0405:L1526） | 注記（移行先では不要・現行のみ有効）／§0で明示 | `OrderBatch.php:16` | §0 |  |
| b05-05 | 現行踏襲 | 乖離 | 受注ごとにスマレジへ商品削除の連携を行う（同期処理・詳細設計 L316） | 乖離（アーキ変更・バッチ副作用が削除実行→enqueueに変化） | `DeleteSmaregiProduct.php:34, SmaregiOtcDeleteCommand.php:88` | RG-007,019 |  |
| b05-05 | 現行踏襲 | 乖離 | スマレジ登録が成功したら当該注文の削除フラグを立てる（0405:L1647＝成功時のみ） | 乖離（フラグ設定契機の拡張・要確認） | `SmaregiService.php:57, SmaregiOtcDeleteService.php:79` | RG-009 |  |
| b05-06 | 現行踏襲 | その他 | 該当時は「管理者」へ通知メールを送信（Excel 0405:L1747／詳細設計 L319,L330） | 注記（宛先設定は L303 で対象外・スマレジエラー宛先を流用） | `MailService.php:1448, MailService.php:2239` | RG-015 |  |
| b05-06 | 現行踏襲 | 乖離 | 成功時は二重登録があれば管理者へ通知メールを送信する（詳細設計 API/バッチ結果 L330） | 乖離（宛先未設定時に通知副作用が欠落・成功終了）／要実機確認 | `...MailService.php:1450, ...MailService.php:2243, CheckDuplicatePointAction.php:48` | RG-001,003,015 |  |
| b05-07 | 現行踏襲 | 乖離 | 決済会社出力情報の中に、購入金額合計もしくは支払合計のテキストが含まれている（Excel 0405:L1877,L1888） | 乖離（照合方式の設計文言と実装の意味相違）／要実機確認 | `OrderRepository.php:1920, OrderRepository.php:1944` |  |  |
| b05-08 | 現行踏襲 | その他 | 成否で受注サブの `smaregi_error_flg` を更新し、失敗時は `point_error_message` を記録する（Excel 0405:L2005,L2007・詳細設計 処理フロー | 詳細設計の誤り（Excel優先で是正・期待には不採用） | `CheckSmaregiErrorOrder.php:38` | RG-004,005,011,015 |  |
| b05-08 | 現行踏襲 | 乖離 | エラー受注に紐づくユーザー情報（会員・選手情報）を取得してリトライする（Excel 0405:L1992,L2002） | 乖離疑義（要実機確認・対象漏れ） | `DtbOrderSubRepository.php:184` | RG-002,012 |  |
| b05-08 | 現行踏襲 | 乖離 | すべての更新を確定する（詳細設計 L317 最終ステップ・成否を受注ごとに反映） | 乖離疑義（要実機確認・部分反映不可） | `CheckSmaregiErrorOrder.php:33` | RG-010,011 |  |
| b05-08 | 現行踏襲 | 乖離 | （成否の反映のみ規定。成功時のメッセージ消去は設計沈黙） | 乖離疑義（設計沈黙・要実機確認/要仕様確認） | `CheckSmaregiErrorOrder.php:37` | RG-003(STALE),004 |  |
| b05-08 | 現行踏襲 | 乖離 | 連携の成否で処理を分岐する（Excel 0405:L2005,L2007・詳細設計 L339） | 乖離疑義（要実機確認・エラー分類/終了コード） | `CheckSmaregiErrorOrder.php:37, SmaregiBatch.php:50` | RG-006,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 本バッチは取得取引でポイント履歴を登録・取消し会員ポイントを更新する＝DBへ書き込む（Excel 0405:L2110,L2122,L2127・詳細設計 移行節 L306・DBカラム L330） | 乖離（詳細設計の内部矛盾・誤記／Excel優先で書き込みあり） | `CheckSmaregiTransaction.php:210` | RG-010,012,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 取引情報取得失敗時は失敗内容をログ出力し異常終了（戻り値1）（詳細設計 API/バッチ結果 L323・エラー処理 L339／Excel 0405:L2129） | 乖離（実装バグ・異常終了コードが伝播しない） | `CheckSmaregiTransaction.php:50, SmaregiBatch.php:49` | RG-006 |  |
| b05-09 | 現行踏襲 | その他 | 移行先（ec-cube-enterprise）でも取引取得・更新の挙動を踏襲し永続化する（詳細設計 L306,L332「テーブル名は ec-cube-enterprise を正典」／Excel 040 | smaregi:batch\ | `—` | SmaregiBatch"` 該当なし）。enterpris |  |
| b06-01 | 新規実装 | 乖離 | 入力データ検索条件「店頭買取情報.ステータス 12: 入庫待ち」（0406:L967／詳細設計 L372も12） | 乖離（設計採番12 vs 実装13・要是正） | `MtbOtcBuyOrderStatus.php:60, BatchAutoStockAction.php:45` | RG-001,012 |  |
| b06-01 | 新規実装 | 乖離 | ネット買取の在庫履歴は「仕入単価＝買取単価で登録」（0406:L954） | 乖離（丸め差・方式不統一）／要実機確認 | `BuyOrderStockInbound.php:93, OtcBuyOrderStockInbound.php:93` | RG-008 |  |
| b06-01 | 新規実装 | 乖離 | ネット買取は「本店のECCUBE在庫に登録」（0406:L936,L951） | 乖離疑義（本店 vs モールルートの同一性）／要実機確認 | `BatchAutoStockAction.php:48, BaseInfoRepository.php:165, BaseInfo.php:1533` | RG-007 |  |
| b06-01 | 新規実装 | その他 | エラーハンドリング欄は空欄＝多重起動/途中失敗時の仕様を明示せず（0406:L974） | 設計沈黙 vs 実装挙動（要仕様確定） | `BatchAutoStockAction.php:54, BatchAutoStockAction.php:58, BatchAutoStockAction.php:68` | RG-018,019 |  |
| b06-02 | カスタマイズ | 乖離 | 集計日引数（YYYY-MM-DD）を指定した場合はその日付を集計対象日として集計する（Excel 0406:L1109／詳細設計 L315,L319） | 乖離（pf-eccube3 実装バグ・引数指定時に集計日決定が破綻／enterprise で是正）／要実機確認 | `SummaryService.php:41, DtbOtcBuyOrderRepository.php:827` | RG-001 |  |
| b06-02 | カスタマイズ | 乖離 | 集計・登録途中の例外時は登録をロールバックし、成功時のみコミットする（詳細設計 L319 step8,L320,L358） | 乖離（pf-eccube3 実装バグ・例外後の無条件commit／enterprise で是正）／要実機確認 | `SummaryService.php:32, BatchAggregateSummaryAction.php:54` | RG-010 |  |
| b06-02 | カスタマイズ | 乖離 | 本機能は集計データを削除・登録する（DB書込あり）。副作用＝当日分レコードの入れ替え（Excel 0406:L1112,L1113,L1122,L1123／詳細設計 L319,L333） | 乖離（詳細設計HTMLの記述誤り・DB操作を検索のみと誤記／実装はDML実行・Excelと矛盾） | `SummaryService.php:49, DtbOtcBuyOrderSummaryRepository.php:92` | RG-017 |  |
| b08-01 | 現行踏襲 | 乖離 | 抽出された会員全員に、会員1人につき1通の移行通知メールを送信する（Excel 0408:L962「該当者に対して」・L989「1通ごと」／詳細設計HTML L317,L320） | 乖離（実装バグ・重大／全員送信未達） | `SendAccountMigration.php:44` | RG-001,011,004 |  |
| b08-01 | 現行踏襲 | 乖離 | 送信履歴 dtb_user_mail_history.mail_body に「送信したメール本文の全文」を保存（Excel 0408:L993） | 乖離（実装バグ懸念・本文全文と不一致）／要実機確認 | `MailService.php:929` | RG-015 |  |
| b08-01 | 現行踏襲 | 乖離 | 送信履歴に「使用したテンプレートのファイル名（Mail/customer_migration.twig 等）」を保存（Excel 0408:L994） | 乖離（設計記述と実装の粒度差）／要実機確認 | `MailService.php:930` | RG-016 |  |
| b08-01 | 現行踏襲 | 乖離 | メール送信後、送信履歴 dtb_user_mail_history にDB書込みを行う（Excel 0408:L964,L990） | 乖離（詳細設計HTMLの記述誤り・Excelと実装が一致） | `MailService.php:923` | RG-012 |  |
| b08-01 | 現行踏襲 | 乖離 | （設計上の記述なし・コード品質） | 乖離（未使用コード残存・実害小） | `SendAccountMigration.php:10` | — |  |
| b08-01 | 現行踏襲 | 乖離 | 移行通知メールの送信元（From）は固定値 info@hareruyamtg.com（Excel 0408:L980） | 乖離（設定値依存・L980の固定値規定と実装取得元が不一致になり得る）／要実機確認 | `MailService.php:912` | RG-007 |  |
| b08-02 | 現行踏襲 | その他 | スマレジ連携失敗＝タイムアウト または レスポンスステータスが失敗扱い（Excel L1230） |  | `LostPoints.php:46` | !array_key_exists('result', $r |  |
| b08-02 | 現行踏襲 | 乖離 | リクエスト上限に配慮し会員ごとに短いインターバルを挟む（詳細設計L320,L347） | 乖離（enterpriseで流量制御欠落・要実機確認） | `LostPoints.php:41, LostPointsAction.php:52` | RG-014 |  |
| b08-02 | 現行踏襲 | 乖離 | 有効期限が切れたポイントを失効処理する（Excel L1184。会員を smaregi_id 有無で限定する旨の明示なし） | 乖離疑義（限定条件・要実機確認） | `DtbPointHistoryRepository.php:38, DtbPointHistoryRepository.php:297` | RG-002／§5 要判定 |  |
| b08-03 | 現行踏襲 | 乖離 | 送信時のエラーは「エラーメッセージをコンソールに出力する」（Excel 0408:L1344／詳細設計 L344） | 乖離（送信エラーのコンソール非出力・握り潰し） | `MailService.php:1121, PointExpireNotificationCommand.php:42` | RG-014 |  |
| b08-03 | 現行踏襲 | 乖離 | 抽出条件は「①指定日獲得ポイント ②残ポイント ③会員ステータス（仮/退会でない）」の3条件のみ（Excel 0408:L1345-1352,L1361,L1362） | 乖離（設計未記載のsmaregi_id必須抽出・通知漏れ）／要実機確認 | `DtbPointHistoryRepository.php:328` | RG-003〜006 |  |
| b08-03 | 現行踏襲 | 乖離 | メール送信元は `info@hareruyamtg.com` に設定（Excel 0408:L1376） | 乖離疑義（送信元がテンプレ非依存の運用設定値）／要実機確認 | `MailService.php:1144, MailService.php:1113` | RG-009 |  |
| b08-04 | 現行踏襲 | 乖離 | 該当する会員がある場合は管理者へアラートメールを送信する（詳細設計 L318,L329） | 乖離疑義（宛先未設定時の無言非送信・宛先設定は別範囲）／要実機確認 | `...MailService.php:1490, ...MailService.php:1275` | RG-001 |  |
| b08-05 | 現行踏襲 | 乖離 | 会員毎に全期間ポイント合計（履歴合計値）と保有ポイントを照合し差異のある会員を抽出（Excel 0408:L1585,L1591）＝全会員を含意 | 乖離（履歴0件会員が未検出）／要実機確認 | `DtbPointHistoryRepository.php:199, DtbPointHistoryRepository.php:256` | RG-018(DV-04) |  |
| b08-05 | 現行踏襲 | 乖離 | 通知メールの送信元(From)は info@hareruyamtg.com（Excel 0408:L1617） | 乖離（送信元がBaseInfo設定値・Excel固定値と不一致の可能性）／要実機確認 | `MailService.php:1596, MailService.php:1352` | RG-007 |  |
| b08-05 | 現行踏襲 | 乖離 | 通知メール本文の差分行は「会員ID,履歴合計値,現在のポイント,差分」（Excel例 0408:L1620 は `11111,5340,5310,-30` 空白なし） | 乖離（本文数値区切りの書式差・軽微） | `MailService.php:1583, MailService.php:1338` | RG-008 |  |
| b08-06 | 現行踏襲 | 乖離 | 注文IDが「該当データなし」の場合は処理を終了する（正常終了扱い[return終了]）（Excel `0408:L1755`,`0408:L1756`） | 乖離（現行バグ・Excel未達） | `UpdatePoint.php:37, SmaregiUpdatePointAction.php:34` | RG-007 |  |
| b08-06 | 現行踏襲 | 乖離 | 注文サブのユーザーIDから選手データを抽出しスマレジ用ユーザーIDを取得する（＝会員・選手情報の存在前提）（Excel `0408:L1737`／正本 L330） | 乖離（現行の異常系未ガード） | `UpdatePoint.php:38, SmaregiUpdatePointAction.php:44` | RG-003,RG-014 |  |
| b08-06 | 現行踏襲 | 乖離 | スマレジ連携API通信失敗時は point_error_message にエラー詳細JSONを記録する（Excel `0408:L1758`） | 乖離（現行バグ疑い・要実機確認） | `CustomerService.php:379, UpdatePoint.php:41` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 抽出条件の日時は「イベント申込.作成日時（申込日時）がバッチ起動時間の30分以上前」（Excel 0413:L955,L960） | 乖離（抽出基準の列違い・作成日時→更新日時）／要実機確認 | `DtbEventEntryRepository.php:70, config.yml:185` | RG-003,016 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引照会の処理自体でエラー発生時は、想定外エラーとして集約し管理者へ通知メール（Excel 0413:L979-981／正本 L344-345） | 乖離（実装バグ・想定外エラーの取りこぼし） | `SlnSearchHelper.php:83` | RG-009,010 |  |
| b13-01 | 現行踏襲 | 乖離 | 本バッチは照会結果に応じて申込ステータス更新・論理削除・申込履歴追加を行う（更新系）（Excel 0413:L964-978／処理フロー 正本 L319） | 乖離（詳細設計 L338 の記述が Excel・実装と矛盾） | `AbstractCheckPaymentEntry.php:59, AbstractPaymentService.php:43` | RG-012 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引不在・失敗の申込は「削除（論理削除）」する（Excel 0413:L978／移行節 正本 L307「論理削除 deleted_at」） | 乖離（論理削除仕様に反する物理削除）／enterprise要確認 | `AbstractPaymentService.php:43` | RG-007 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引不在・失敗の申込は（重複決済番号を含め）論理削除、成功は更新（Excel 0413:L977-978／正本 L319） | 乖離（重複決済番号の失敗申込が削除されない）／要実機確認 | `AbstractCheckPaymentEntry.php:29, SlnSearchHelper.php:16` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 本バッチ（決済処理中チェック）はリンク型決済（クレジット）の未完了申込を対象とする（Excel 0413:L937-938。コンビニ決済は別バッチ B13-02） | 乖離疑義（CVS抽出とクレジット限定照会の不整合）／要実機確認 | `CheckProcessingPaymentEntry.php:12, SlnSearchHelper.php:52, AbstractCheckPaymentEntry.php:53` | RG-009,010 |  |
| b13-02 | 現行踏襲 | その他 | 本バッチは廃止する（Excel基本設計 B13-02・0413:L1078-1079）＝刷新後 ec-cube-enterprise に実装しない | CheckCvsPayment' ec-cube-enterprise/src ec-cube-enterprise/app` が0件）。※詳細設計HTML L294 の区分「現行踏襲」および superseded-notice 非設置（H | `CheckCvsPaymentEntry.php:16, EventEntryBatch.php:13` |  |  |
| b13-02 | 現行踏襲 | 乖離 | （現行挙動として）照会結果に応じ申込ステータス更新・記録除去・申込履歴追加を行う＝更新系（正本 処理フロー L319・副作用 L331） | 乖離（詳細設計 L338 の記述が処理フロー・実装と矛盾） | `AbstractCheckPaymentEntry.php:95, CheckCvsPaymentEntry.php:37` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 取引が存在しない場合は当該申込みの記録を取り除く／記録除去（正本 処理フロー L319・業務ルール L325・副作用 L331） | 乖離（「記録除去」表現と実装のステータス変更の不一致）／要実機確認 | `CheckCvsPaymentEntry.php:34, MtbEntryStatus.php:21` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 取引照会の処理自体でエラー発生時は想定外エラーとして集約し管理者へ通知メール（正本 L319,L345） | 乖離（実装バグ・想定外エラーの取りこぼし） | `SlnSearchHelper.php:83` |  |  |
| b13-02 | 現行踏襲 | 乖離 | （現行）コンビニ入金確認の完了はコンビニ決済に対応するメールで通知されるべき | 乖離疑義（CVS入金完了にクレカ完了メールを送信）／要実機確認 | `Payment.php:79, AbstractCheckPaymentEntry.php:98` |  |  |
| b17-01 | 現行踏襲 | 乖離 | 詳細設計のエラー処理は「取得失敗→エラー出力」のみ（L251）。HTTPステータス・空レスポンス・JSON妥当性の検証は詳細設計に記述なし | 乖離（実装が設計外の検証を保持・設計記述不足） | `CreateLatestArticleListAction.php:66` | RG-007 |  |
| b17-01 | 現行踏襲 | その他 | 起動コマンドは現行 `list:batch createLatestArticleList`、移行先 `eccube:create:latest-article-list`（L221 が明示） | 設計どおり✓（バグでない） | `ListTextBatch.php:23, CreateLatestArticleListCommand.php:34` | RG-001,013 |  |
| f01-01 | カスタマイズ | 乖離 | (9)補充しました！ の掲載商品は「補充しました」タグの商品を対象とする（Excel 0301:L1702「1 「補充しました」タグの商品」・もっと見るも「補充しました」タグ絞込一覧 0301:L17 | 乖離（対象タグの取り違え疑い）／要実機確認（mtb/dtb タグマスタの id=2 の名称を確認） | `RestockedBlockPayloadBuilder.php:50, Tag.php:55, EcTopProductController.php:30` | RG-040, RG-016(DV-05) |  |
| f01-01 | カスタマイズ | 乖離 | (2)最新入荷アイテム の英語版サイトは「Trending Now」タグの商品を対象とし、(2-17)(2-18)more も「Trending Now」タグ絞込一覧へ遷移する（Excel 0301: | 乖離（タグ指定方式の差・設定値依存）／要実機確認（MtbOption SLIDER_EN_ONLY_TAG_ID の設定値が「Trending Now」タグIDか） | `NewItemsBlockPayloadBuilder.php:59, EcTopProductController.php:22` | RG-020, RG-016(DV-02) |  |
| f01-01 | カスタマイズ | 乖離 | 商品ブロックの対象が0件のとき「1件もなければ表示しない」＝当該ブロックごと非表示（Excel 0301:L1247,L1259,L1363,L1441,L1638,L1708,L1787,L1859 | 乖離（Excel=非表示 vs 詳細設計=0件描画の競合・Excel優先で解決済み）／要実機確認（0件時に見出し枠が残るか） | `—` | RG-018 |  |
| f02-01 | カスタマイズ | 乖離 | (19)カテゴリは(1)〜(19)の画面上部固定エリアの一部であり、「(1)~(19)の画面上部固定エリアは、画面全体でスクロールしても常に上部に固定して表示する」（0302:L1040）＋「カテゴリ | 乖離（カスタマイズ要件の適用範囲不足）／要実機確認 | `header.twig:164, header.en.twig:137` | RG-054 |  |
| f02-01 | カスタマイズ | 乖離 | カート展開時は「カートに商品を追加した日時の昇順でカート内商品を一覧表示する」（0302:L1226） | 乖離（並び順の保証欠落）／要実機確認 | `cart.twig:38` | RG-042 |  |
| f02-01 | カスタマイズ | 乖離 | (14)詳細検索は「詳細検索モーダルに入力された検索条件の数を表示する」（0302:L1113・処理概要 0302:L1050） | 乖離（条件数表示の実装確証なし）／要実機確認 | `header.twig:145, ec_header_unisuggest.twig:26` | RG-026 |  |
| f02-01 | カスタマイズ | その他 | Excel のカスタマイズ要件（(11)カードセット選択メニュー 0302:L1008／(17)お気に入りアイコン 0302:L1011／(18)カートアイコン内の商品表示 0302:L1015／(1 | 確認事項（カスタマイズ要件の実装先は移行先側／現行踏襲ではない） | `ec_header_unisuggest.twig:9, base_header.twig:51, search_product.twig:91` | RG-021,036,041,054 |  |
| f02-01 | カスタマイズ | 乖離 | 画面上部のナビ項目は Excel 画面項目表を正とし (2)HARERUYA・(3)ショップ・(4)買取・(5)記事・(6)デッキ検索・(7)デッキ構築・(8)イベント・(9)店舗一覧（0302:L1 | 乖離（詳細設計HTMLのナビ項目一覧がExcelと不一致・Excel優先で解決）／設計書是正が必要 | `ec_navigator.twig:4, header.twig:57` | RG-014,RG-015 |  |
| f02-02 | カスタマイズ | 乖離 | (16)詳細検索・(15)お気に入り未ログイン・(17)カテゴリはいずれもモーダルを表示する（`0302:L1835,L1874,L1887,L2074,L2078`） | 乖離（詳細設計の記述がExcelカスタマイズ要件と競合・Excelが正）／詳細設計HTMLの更新要 | `base_sp_navigator.twig:5` | RG-020,022〜024 |  |
| f02-02 | カスタマイズ | 乖離 | Excel は SPナビが業務データを参照することを規定: (11)カードセットの選択肢=カードセット管理登録分（`0302:L1935`）／(2)会員の保有ポイント（`0302:L1865`）／(1 | 乖離（DBカラム節がExcel参照要件を落としている・Excelが正）／参照先テーブル・列の設計追記要（DBの正はenterprise） | `base_sp_navigator.twig:27` | RG-007,013,018,021 |  |
| f02-02 | カスタマイズ | 乖離 | Excel のメニュー(4-2)〜(4-11)は買取・デッキ構築・選手一覧をいずれも含み、言語別の出し分けを規定しない（`0302:L1996,L1997,L2000,L2001`） | 乖離（en版の項目構成をExcelが規定せず＝要判定）／要実機確認・Excel追記要 | `base_sp_navigator.en.twig:8, base_sp_navigator.twig:8` | RG-038 |  |
| f02-02 | カスタマイズ | その他 | 移行先（DB正＝`ec-cube-enterprise`）でも Excel F02-02 のSPナビを描画する（詳細設計 L317「移行先: 標準のテンプレート構成で描画。挙動はpf-eccube3を | sp_navigator\ | `—` | cardNameBoxSp" --include=*.twi |  |
| f02-03 | カスタマイズ | 乖離 | (1)HARERUYA・(11)HARERUYA を押下すると支店ECTOP画面へ遷移する（Excel 0302:L2578,L2588）。各支店サイトごとに応じた支店名を表示する | 乖離の疑い（遷移先が支店ECTOPである保証がテンプレートに無い）／要実機確認 | `branch_header.twig:16, branch_footer.twig:63` | RG-004,005 |  |
| f02-03 | カスタマイズ | 乖離 | カートに商品を追加した日時の昇順でカート内商品を一覧表示する（Excel 0302:L2605・カスタマイズ） | 乖離（並び順キーが追加日時でない）／要実機確認 | `CartHeaderViewService.php:41` | RG-020 |  |
| f02-03 | カスタマイズ | 乖離 | (9-3)送料無料までの金額は「店舗の『送料無料条件(金額)』までの残り金額」を表示し、カート内の合計金額が店舗の条件以上なら非表示（Excel 0302:L2630。条件は支店ごとに店舗登録で設定＝ | 乖離（支店別の送料無料条件が反映されない）／要実機確認 | `CartHeaderViewService.php:57` | RG-022（DV-06〜08,DV-10） |  |
| f02-03 | カスタマイズ | 乖離 | (13-2)プライバシーポリシーを押下すると「会員規約画面」へ遷移する（Excel 0302:L2768） | 乖離（Excel記述と実装の遷移先不一致・Excel側の記述誤りの可能性含む）／設計要確認・要実機確認 | `branch_footer.twig:29` | RG-046 |  |
| f02-04 | カスタマイズ | その他 | Excel F02-04 は支店スマホ版ナビを画面部品(1)〜(15)を持つグローバルナビとして規定する。(2)ご当地晴れる屋くん・(4)カードセット単一選択・(5)商品検索テキストボックス（半角・全 | カードセット\ | `base_sp_navigator.twig:25` | 通販サイト" pf-eccube3/app/Plugin/H |  |
| f02-04 | カスタマイズ | 乖離 | Excel F02-04 の概要は当該機能（支店スマホ版ナビゲーション）を説明すべき（機能名 `0302:L2996`「支店スマホ版ナビゲーション」） | 乖離（Excel設計書の記載誤り・機能取り違え）／要文書修正 | `—` | 全般（§1） |  |
| f02-04 | カスタマイズ | 乖離 | Excel (13-1)お得な情報開閉の開閉対象と、画面項目表の定義範囲は一致すべき | 乖離（Excel設計書の記載誤り・範囲表記(13-4)が過剰）／要文書修正 | `branch_footer.twig:51` | RG-025 |  |
| f02-04 | カスタマイズ | 乖離 | Excel (12-3)プライバシーポリシーは押下すると会員規約画面へ遷移する（`excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3268`） | 乖離（遷移先の不一致・Excel記載誤りの疑い）／要実機確認 | `branch_footer.twig:29, messages.ja.yaml:6433, branch_footer.twig:26` | RG-022 |  |
| f02-04 | カスタマイズ | その他 | Excel (15-3)GOOGLE MAPは押下すると、ブラウザの新しいタブで、店舗ごとに設定されているGOOGLE MAPのURLを開く（`excel_to_html/output/0302_基本 | url_encode : '' %}`）・`:80`（未設定なら fallback を採用）・`:81-82`（http(s) 以外は fallback へ差し戻し）。またDB列コメントは「Google map埋め込みURL」（`ec-cu | `branch_footer.twig:79` | **乖離（Excelに無い実装挙動＝仕様追加／埋め込みURL |  |
| f02-04 | カスタマイズ | 乖離 | Excel は (2)ご当地晴れる屋くん・(15-1)〜(15-5)店舗情報を「店舗登録より登録されている値を表示する」と規定するのみで、未登録時の扱いを規定しない（`excel_to_html/ou | 乖離（設計の沈黙・実装先行）／要仕様確定＋要実機確認 | `branch_header.twig:30, branch_footer.twig:86` | RG-003, RG-035 |  |
| f03-01 | カスタマイズ | 乖離 | SEO対策として、タグやカテゴリの検索条件はURLパスに含め、表記は `/tags/1/cate/2`（タグが先・複数タグは `tags/1-2-3`）とする（Excel `excel_to_html | 乖離（Excel記載のURL表記差・SEO正準URLに影響）／要実機確認 | `ProductController.php:141, FrontControllerProvider.php:48` | RG-018 |  |
| f03-01 | カスタマイズ | 乖離 | 件数が上限を超える場合は、結果内容を取得せず件数のみを設定し、検索負荷の通知用エンドポイントへ件数とURLを送信する（詳細設計 `function_spec_html_preview/pf-eccub | 乖離（副作用の欠落・検索負荷の検知が失われる）／要実機確認 | `ProductSearchTrait.php:59, ProductSearchTrait.php:55` | RG-049 |  |
| f03-01 | カスタマイズ | 乖離 | 検索件数上限は `mtb_option` の `option_key = product_search_limit` として保持する（確認値 9999）（詳細設計 `:365`／`:343`。Exce | 乖離（上限の保持先差・既定フォールバック値の不一致）／要実機確認 | `eccube.yaml:396, ProductSearchTrait.php:59, ProductSearchTrait.php:55` | RG-005,007,049 |  |
| f03-02 | カスタマイズ | 乖離 | カード商品の場合の状態別の表のソート順は価格降順で表示する（Excel `excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1814`「★カード商品の場合 | 乖離（★カスタマイズ「価格降順」未反映）／要実機確認 | `detail.twig:263` | RG-013 |  |
| f03-02 | カスタマイズ | 乖離 | フォーマットに紐付くデッキは PC版4件・SP版3件表示し、それ以上ある場合はもっと見るリンクを表示する。PC版SP版に関わらず4件取得し、SP版の場合は取得した中で一番登録の古いものを非表示とする（ | 乖離（デッキ取得件数 4→3・Excel未反映）／要実機確認 | `ProductController.php:87, ProductController.php:22` | RG-046 |  |
| f03-02 | カスタマイズ | 乖離 | 本機能は閲覧と履歴Cookie記録が主で商品テーブルを更新しない（詳細設計 `:314`）。登録・更新は閲覧履歴Cookieを除き各導線先の機能に委ねる（`:339`）。副作用は閲覧履歴Cookieへ | 乖離（正本の設計内矛盾・DB操作節が汎用テンプレ）／設計書修正要 | `ProductController.php:495` | RG-082（§5で`要判定`） |  |
| f03-03 | カスタマイズ | 乖離 | 支店では支店で表示している商品のみを検索対象に含める（Excel 0303:L2344）。本店/支店サイト上でドメイン及びコンテキストルートを維持し、遷移元の店舗商品が検索対象となる（Excel 03 | 乖離（Excelカスタマイズ要件が現行実装・詳細設計いずれにも未反映）／要実機確認 | `—` | RG-011,012 |  |
| f03-03 | カスタマイズ | 乖離 | 現行の独立した詳細検索画面は削除し、モーダルへ再編する。モーダル外の押下またはフッターの詳細検索ボタン押下でモーダルを閉じる（Excel 0303:L2351-2352） | 乖離（詳細設計HTMLがExcelのモーダル化要件を未反映＝設計書間の矛盾。期待にはExcelを採用）／要実機確認 | `list.twig:546` | RG-002,003,004 |  |
| f03-04 | カスタマイズ | 乖離 | カテゴリのフロント非表示フラグを参照し、表示/非表示を制御する（Excel 0303:L2645）。詳細設計は表示対象カテゴリの取得に `dtb_category` の `display_flg`（一 | 乖離（参照列の不一致・設計書の列名が実装と別／`display_flg` と `front_search_hide_flg` の二重管理リスク）／要実機確認 | `TopCategoryListBuilder.php:96, Category.php:456` | RG-008（DV-14,15） |  |
| f03-04 | カスタマイズ | 乖離 | 支店サイトでは、カテゴリの支店表示フラグを参照し、表示/非表示を制御する（Excel 0303:L2646）＝Excelの語は「表示フラグ」 | 乖離（フラグ極性・命名の反転／設定値の解釈誤りリスク）／要実機確認 | `Category.php:459, TopCategoryListBuilder.php:99` | RG-009（DV-16,17） |  |
| f03-04 | カスタマイズ | 乖離 | (2)フォーマット別カテゴリで表示するフォーマットは「スタンダード」「パイオニア」「モダン」「レガシー」「統率者」を固定で表示する（Excel 0303:L2648） | 乖離（「固定表示」がマスタ名称一致に依存し、名称変更・非表示・欠落で無言で消える）／要実機確認 | `TopCategoryListBuilder.php:39` | RG-004（DV-09〜13） |  |
| f03-04 | カスタマイズ | 乖離 | (1)最新セットカテゴリでは、カテゴリの第一階層が「最新セット」の子カテゴリをツリー表示する（Excel 0303:L2647,L2623）。加えて現行のカードとカテゴリを組み合わせて事前生成していた | 乖離（最新セット判定の名称一致依存／カードセット合成子要素とL2644削除要件の整合が設計上未定義）／要実機確認 | `TopCategoryListBuilder.php:36` | RG-003,RG-017 |  |
| f03-04 | カスタマイズ | 乖離 | 現行のカテゴリ一覧画面をモーダル表示に変更する（Excel 0303:L2621）／現行の事前生成カテゴリ一覧は削除する（Excel 0303:L2644） | 乖離（詳細設計書がExcelカスタマイズ未反映＝設計書間の不整合／旧URLの存続と挙動変更がどの設計にも明示なし）／要実機確認 | `TopCategoryListBuilder.php:75, ProductController.php:1658, ProductController.php:40` | RG-001,RG-017,RG-033 |  |
| f03-04 | カスタマイズ | 乖離 | レアリティ押下の対象は「(1)最新セットカテゴリと(4)フォーマット別カテゴリ」（Excel 0303:L2650）。しかし同じExcelの処理概要では「(2)フォーマット別カテゴリ」（0303:L2 | 乖離（Excel内部の付番不整合により対象範囲が確定できない・設計不整合）／要実機確認 | `TopCategoryListBuilder.php:145` | RG-015（§5要判定） |  |
| f03-05 | 現行踏襲 | 乖離 | 公開中（支店であれば支店公開フラグを参照する）／在庫あり（支店であれば支店の在庫を参照する）（Excel 0303:L2834,L2836） | 乖離（現行実装がExcel設計の支店条件を満たさない）／要実機確認 | `OrderDetailRepository.php:426, ProductRepository.php:705, ProductRecommendController.php:67` | RG-026 |  |
| f03-05 | 現行踏襲 | 乖離 | 商品IDで指定された商品と同一商品、同一カードではない（Excel 0303:L2833）。基準商品がカードを持たない場合の扱いはExcel・詳細設計とも沈黙 | 乖離（現行踏襲差・同一カード除外のNULL挙動）／要実機確認 | `OrderDetailRepository.php:443, OrderItemRepository.php:101` | RG-010（DV-08） |  |
| f03-05 | 現行踏襲 | 乖離 | 過去N日間（追加システム設定のレコメンドの検索期間（日数））の注文を対象とする（Excel 0303:L2832） | 乖離（現行踏襲差・期間起点）／要実機確認 | `OrderDetailRepository.php:401, OrderItemRepository.php:106` | RG-009,RG-027（DV-11） |  |
| f03-05 | 現行踏襲 | 乖離 | 抽出対象期間は追加システム設定の値を参照する（Excel 0303:L2832／詳細設計 L341「オプションマスタの日数」）。設定が未登録の場合の扱いはExcel・詳細設計とも沈黙 | 乖離（未登録時の耐性差・現行はエラー化の可能性）／要実機確認 | `OrderDetailRepository.php:386, RecommendService.php:45, MtbOption.php:55` | RG-027 |  |
| f03-05 | 現行踏襲 | 乖離 | 公開中・在庫ありの商品のみ表示する（Excel 0303:L2834,L2836）。詳細設計 L350「表示時点で在庫があり公開中の商品のみを対象とする」 | 乖離（「表示時点で在庫があり公開中」との差・鮮度）／要実機確認 | `OrderDetailRepository.php:24, OrderItemRepository.php:124` | RG-013,RG-029 |  |
| f03-05 | 現行踏襲 | 乖離 | 0件時の表示文言は日本語「表示するおすすめ商品はまだありません。」（Excel 0303:L2841）、英語「No recommended items to display yet.」（詳細設計 L3 | 乖離（英語文言の現行踏襲差）／要実機確認 | `messages.en.yaml:1003, message.en.yml:310, messages.ja.yaml:1189` | RG-018,RG-019 |  |
| f03-05 | 現行踏襲 | 乖離 | ブロックはページ表示後に非同期でおすすめ内容を取得して描画する（詳細設計 L322,L323。Excelは取得方式に沈黙） | 乖離（取得方式の現行踏襲差＋カート空時の表示差）／要実機確認 | `ProductRecommendController.php:42, detail.twig:555, index.twig:348` | RG-007,RG-022 |  |
| f03-06 | カスタマイズ | 乖離 | 商品画像（画像）を押下すると拡大画像を表示する（Excel `0303:L3023`）。商品詳細への遷移は商品名リンクが担う（Excel `0303:L3027`） | 乖離（Excelと実装/詳細設計の競合・画像押下の期待挙動が拡大表示か詳細遷移か）／要実機確認 | `history.twig:6` | RG-010,RG-011,RG-015 |  |
| f03-07 | カスタマイズ | 乖離 | 上限件数は「まとめて入荷通知」で登録している場合でも1件、商品規格単位でも1件としてカウントする（Excel `excel_to_html/output/0303_基本設計仕様書(フロント_商品).h | 乖離（カスタマイズ要件違反・上限カウント単位）／要実機確認 | `product_js.twig:328, CartController.php:487` | RG-009,010 |  |
| f03-07 | カスタマイズ | 乖離 | 登録上限数以上の登録をしようとした場合にエラーを表示する＝上限20件目までは登録できる（Excel `:3289`,`:3291`） | 乖離（上限境界の不整合・まとめて経路で1件少なく制限）／要実機確認 | `NotifylistController.php:235, CartController.php:479` | RG-009・§3 DV-06,DV-07 |  |
| f03-07 | カスタマイズ | 乖離 | 上限超過の文言は上限件数を埋め込む「入荷通知依頼は（上限件数）件までです。」、成功は「入荷通知依頼しました。」、取消は「入荷通知依頼をキャンセルしました。」（詳細設計 `function_spec_h | 乖離（文言差・上限件数の非埋め込み）／要実機確認 | `messages.ja.yaml:1339, NotifylistController.php:157` | RG-004,036・§3 DV-07 |  |
| f03-07 | カスタマイズ | 乖離 | 商品一覧画面でSOLDOUTとなっている商品に入荷通知を登録する場合、商品単位の入荷通知とする（Excel `:3294`,`:3276`,`:3390`） | 乖離（カスタマイズ要件違反・一覧の通知単位）／要実機確認 | `list.twig:108, product_js.twig:70` | RG-012 |  |
| f03-07 | カスタマイズ | 乖離 | ログイン押下後にログインが失敗すると、「ログインできませんでした。入力内容に誤りがないかご確認ください。」を表示したログイン画面に遷移する（Excel `:3296`,`:3297`,`:3312`） | 乖離（画面遷移仕様との差・Excel未記載の試行回数超過表示）／要実機確認 | `messages.ja.yaml:1247, product_js.twig:350, messages.ja.yaml:1248` | RG-022・§5「試行制限=要判定」 |  |
| f03-07 | カスタマイズ | 乖離 | 入口は POST `/{_locale}/cart/pushReceive`（詳細設計 `function_spec_html_preview/pf-eccube3/f03-07_front_prod | 乖離（ルートパス差）／設計沈黙の追加挙動（CSRF・支店404）／要実機確認 | `CartController.php:420, routes.yaml:20, CartController.php:428` | RG-001,015・§5「CSRF=要判定」「HTTPステ |  |
| f03-08 | 現行踏襲 | 乖離 | 登録・解除の入口は `POST /products/favorite/add` ／ `DELETE /products/favorite/remove` で、対象はフォームキー `product_id | 乖離（入口URL・パラメータ契約差）／要実機確認 | `ProductController.php:779` | RG-001〜015 |  |
| f03-08 | 現行踏襲 | 乖離 | 一覧の入口は `GET /mypage/favorite/list`、セール絞り込みはクエリ `sale=1`（解除は `sale=0`）（詳細設計 `:323,336,348,379`／現行 `pf | 乖離（一覧URL・絞り込みパラメータ契約差）／要実機確認 | `MypageController.php:291, DtbFavoriteProductRepository.php:109` | RG-016〜019,022,035,036 |  |
| f03-08 | 現行踏襲 | 乖離 | 登録の応答は、成功時のみ状態 `success`（文言「お気に入りに追加しました。」）とし、失敗（未ログイン=nologin／上限超過=fail）と区別する（詳細設計 `:339,343,362`） | 乖離（状態値の誤り＝失敗を成功として返す）／要実機確認 | `ProductController.php:828` | RG-005,013 |  |
| f03-08 | 現行踏襲 | 乖離 | お気に入りは商品ごと・言語ごとに保持し（Excel `excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:3648`『お気に入りは商品ごと、言語ごとに登録可 | 乖離（Excel★言語別登録の反映漏れ・画面間不整合）／要実機確認 | `ProductController.php:391` | RG-024,025,026 |  |
| f03-08 | 現行踏襲 | 乖離 | 登録・解除のCSRFトークン検証は現行踏襲＝無し（現行 `pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:366-3 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `ProductController.php:786` | §5『要判定』（CSRF） |  |
| f03-08 | 現行踏襲 | 乖離 | Excel★カスタマイズ「本店のみ表示し、支店で表示しない」（Excel `excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:3643,3704`） | 適合（乖離なし・参考記録） | `ProductController.php:366, ProductController.php:794` | RG-023 |  |
| f04-01 | カスタマイズ | その他 | 支店は商品の配送方法が店舗受取のみで送料が存在しないため、支店では送料は表示しない（`0304:1021,1087`） | price }}で送料無料になります。`）。いずれも店舗種別による分岐を持たない（#5 のとおり店舗概念自体が無い） | `index.twig:61` | **乖離（★カスタマイズ未実装・支店でも送料案内を表示）／要 |  |
| f04-01 | カスタマイズ | その他 | Excel（優先） | 本書の扱い | `—` |  |  |
| f04-01 | カスタマイズ | その他 | 数量変更は画面再読み込みせず自動再計算（`0304:1011,1089`） | Excel優先＝RG-014,015 の期待は再読み込みなし。詳細設計の記述はカスタマイズ前の姿として付帯表4#1 に整理 | `—` |  |  |
| f04-01 | カスタマイズ | その他 | 商品点数は0以下を入力できないようにする（`0304:1015,1097`） | Excel優先＝RG-020・DV-06,07 の期待は入力不可。詳細設計の削除挙動は付帯表4#4 に整理 | `—` |  |  |
| f04-01 | カスタマイズ | その他 | 他の商品を見る＝遷移するTOP画面は閲覧店舗とする（`0304:1108`） | Excel優先＝RG-032 の期待は閲覧店舗のTOP。付帯表4#8 に整理 | `—` |  |  |
| f04-02 | カスタマイズ | 乖離 | 使用ポイント（6-6）の初期値は会員の保有ポイント（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1716`「使用ポイント 数値（整数） △ - 会 | 乖離（初期値の算出規則がExcel記載と不一致・再表示時に顕在化）／要実機確認 | `ShoppingTypeExtension.php:41` | RG-055（DV-02） |  |
| f04-02 | カスタマイズ | 乖離 | 使用ポイントの下限制約は Excel・詳細設計とも規定しない（Excel 0304:L1716 の書式は「数値（整数）」のみ／詳細設計 `function_spec_html_preview/pf-e | 乖離（設計に無い下限制約・設定値の取り違え疑い）／要実機確認 | `ShoppingTypeExtension.php:61, config.yml:316` | RG-055（DV-05,DV-12） |  |
| f04-02 | カスタマイズ | 乖離 | 注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移する（`excel_to_html/output/0304_基本設計仕様書(フロント_ | 乖離（Excel が限定しない対象を会員のみへ限定＝非会員で30分超過が素通り）／要実機確認 | `ShoppingEvent.php:59, ShoppingService.php:1057, config.yml:317` | RG-070,RG-071 |  |
| f04-02 | カスタマイズ | その他 | 商品取り置き期間は、購入日を起算日として動的に7日後の日付を表示させる（`excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1845`・HARESEKA- | date_modify("+6 days") | `index.twig:182` | date("n月j日") }}` を「・「商品取り置き期間」 |  |
| f04-03 | カスタマイズ | 乖離 | 郵便番号は ECCUBE4標準機能により入力値から都道府県・住所1を自動補完し（0304:L2068,L2069）、現行に表示していた「郵便番号から自動入力」ボタンを除去する（0304:L2071） | 乖離（詳細設計HTMLがカスタマイズ前挙動を記述＋Excel内で処理概要と画面項目表が不整合）／要実機確認（画面項目表の残置が意図的か否かの設計確認が必要） | `shipping_edit.twig:32, AddressType.php:107, delivery_edit.twig:122` | RG-010,011 |  |
| f04-03 | カスタマイズ | 乖離 | 確認画面の「登録する」押下で配送先登録をし、ご注文方法指定画面へ遷移する（0304:L2311,L2312,L2313・0304:L2329「配送先の情報を登録しご注文方法指定へ遷移する」・変更画面の | 乖離（Excelの遷移先とオラクル差。配送先選択が中間画面としてご注文方法指定へ戻る導線であればExcel記述と実質整合しうるが、画面遷移の粒度が一致しない）／要実機確認 | `ShoppingController.php:1011` | RG-030,040 |  |
| f04-03 | カスタマイズ | 乖離 | 確認画面では「登録するボタンを押下」してはじめて「配送先登録をする」（0304:L2311,L2312）。戻る送信・検証不備のときは登録せず編集画面を表示する（詳細設計 :337,:352,:378） | 乖離（登録タイミングの設計違反＝戻る/検証不備でも住所が永続化される副作用。Excel L2311-2312 の「登録するボタン押下→配送先登録」に反する）／要実機確認（新規時に空行が挿入されるか、NOT NULL制約で失敗するかは実機確認 | `ShoppingController.php:987, DeliveryService.php:144` | RG-031,032,034 |  |
| f04-03 | カスタマイズ | 乖離 | 郵便番号2は任意（0304:L2103 の必須欄が「-」。郵便番号1のみ必須◯＝0304:L2102） | 乖離（Excel画面項目表 vs 詳細設計/実装の必須差。郵便番号2が任意なら「169-」のみでの登録が通ることになり、Excelの記載漏れの可能性が高い）／要実機確認 | `delivery_edit.twig:111` | RG-020(DV-14) |  |
| f04-04 | 現行踏襲 | 乖離 | TOPページへ戻るボタンは注文した店舗のTOP画面へ遷移（Excel 0304:L2578） | 乖離（pf店舗別TOP未達・ラベル差） | `complete.twig:63, complete.twig:132` | RG-028 |  |
| f04-04 | 現行踏襲 | 乖離 | ★原価情報で総原価・総在庫を増減し、在庫履歴に商品情報（総在庫・総原価）と受注情報（注文数・総原価）を登録（Excel 0304:L2523,L2537-L2545） | 乖離疑義（総原価反映箇所 要実機確認） | `ShoppingService.php:827` | RG-008,009 |  |
| f05-02 | カスタマイズ | 乖離 | Foilの検索に「特殊」を追加する（Excel 0305:L1565,L1589） | 乖離（現行カスタマイズ未達） | `SearchType.php:171, FrontProductSearchRequestQueryNormalizer.php:50` | RG-026 |  |
| f05-03 | カスタマイズ | 乖離 | 一覧で実体を取得する件数の上限は 9999（`product_search_limit`。詳細設計 L319,L322,L337＝現行値・移行先はenterprise要確認と明記） | 乖離（上限値 9999 vs ユニサーチ 4000）／要実機確認 | `eccube.yaml:394, ProductSearchTrait.php:59, UniSearchService.php:60` | RG-008,009 |  |
| f05-03 | カスタマイズ | 乖離 | 検索結果件数が上限（9999）超過時、検索エラー通知用エンドポイントへ件数とURLをPOST送信、失敗時も一覧継続（詳細設計 L359＝現行踏襲） | 乖離（上限超過の外部件数通知が現行→ユニサーチで消失）／要実機確認 | `ProductSearchTrait.php:55, PurchaseController.php:404` | RG-035 |  |
| f05-04 | カスタマイズ | 乖離 | 基本土地の場合は同名カードの買取価格一覧を取得しない＝空とする（Excel 0305:L2561／詳細設計 L347） | 乖離(pf-eccube3実装バグ・型不整合)／要実機確認 | `PurchaseController.php:597, detail.twig:299, PurchaseController.php:996` | RG-004 |  |
| f05-04 | カスタマイズ | 乖離 | 同名カード検索クエリのカードIDを正しく設定する（Excel 0305:L2551） | 乖離(pf-eccube3実装不備・未初期化参照)／軽微 | `PurchaseController.php:577` | RG-003 |  |
| f05-04 | カスタマイズ | 乖離 | 他のバージョンも見るは1ページあたり8件表示する（Excel 0305:L2431） | 乖離(pf-eccube3現行 6≠仕様8・enterprise是正済)／要実機確認 | `PurchaseController.php:41, detail.twig:442, PurchaseController.php:85` | RG-024,033 |  |
| f05-05 | カスタマイズ | その他 | 商品数量が0の状態で「買取手続きへ」を押下するとカート画面へ遷移する（Excel 0305:L2703） | length > 0 %}` のときのみ表示＝数量0（カート空）ではボタン自体が非表示。空カートで手続きへ進んだ場合は `PurchaseController::login`（`pf-eccube3:app/Plugin/HareruyaE | `cart.twig:97` | **乖離（経路差・要実機確認）** |  |
| f05-05 | カスタマイズ | その他 | 削除はなりすまし対策トークンを検証し、対象が無ければ変更せずカート表示へ戻す（詳細設計 L344,L365,L384） |  | `PurchaseController.php:466` | !array_key_exists($id,$orders) |  |
| f05-05 | カスタマイズ | その他 | 更新時、数字でない・1未満はカートから外し、20点超過は更新中断（詳細設計 L346,L360,L384） |  | `PurchaseController.php:664` | $quantity < 1` → `unset`）・`:66 |  |
| f05-05 | カスタマイズ | その他 | まとめて買取がカートに無く商品が1件以上ある場合のみ案内（モーダル）を出す（Excel 0305:L2672／詳細設計 L335,L360） | length > 0 %}` でカート用JS読込）・`app/Plugin/HareruyaEc/Resource/template/default/Block/js/purchase_cart_js.twig:7`（load時 `dial | `cart.twig:11` | **設計どおり✓** |  |
| f05-06 | カスタマイズ | その他 | 詳細設計 L347/L366 は「オーダーID＝PU+年月日6桁+受注ID10桁ゼロ詰め」と区切り無しで描写 | 詳細設計の描写要是正（実装にハイフンあり） | `PurchaseController.php:373` | RG-024 |  |
| f06-01 | カスタマイズ | 乖離 | 会員登録完了時、支店への会員データ連携は不要となる（Excel カスタマイズ要件 0306:L1328,L1334） | 乖離（カスタマイズ未達） | `EntryController.php:152` | RG-031 |  |
| f06-01 | カスタマイズ | その他 | 詳細設計 L323「郵便番号 … 移行先 単一列 postal_code（桁数8）／列の統合」（Excel 0306:L1167 は郵便番号 最大10文字） | 詳細設計の記述誤り（実ソースで是正・Excelは整合） | `Customer.php:74` | RG-014,024 |  |
| f06-02 | 現行踏襲 | 乖離 | スマレジID既保有チェックは判定順序3として本会員化ステータス変更の前に行い、保有時は E-2「完了済みです。」を表示して処理中止（詳細設計 L338,L348／Excel 0306:L1760,L1 | 乖離（判定順序の位置ずれ）／要実機確認 | `EntryController.php:349, EntryController.php:228` | RG-005 |  |
| f06-02 | 現行踏襲 | その他 | 本機能では楽観ロック・悲観ロックの対象は持たない（詳細設計 L397・現行踏襲） | 差異（記述と実装差・安全側） | `EntryController.php:354` | RG-010 |  |
| f06-03 | カスタマイズ | 乖離 | 会員ログイン試行回数制限＝5回連続失敗でメールアドレス+IPアドレスの組み合わせを30分間制限し、「ログイン試行回数が多すぎます。{残り時間}分後に再度お試しください。」を表示（Excel 0306: | 乖離（Excel★カスタマイズ未達・回数/時間/キー/文言すべて相違） | `config.yml:337, FrontLoginFailureHandler.php:27, login.twig:22` | RG-007,008 |  |
| f06-03 | カスタマイズ | 乖離 | 本店で発行した共有トークンをCookieに設定し、支店側が同じCookieを読み取り検証して自動ログインする（詳細設計 L433,L351／Excel 0306:L2015 概要） | 乖離（実装バグ・支店自動ログイン到達不可の疑い）／要実機確認 | `SecurityEventListener.php:39, AutoLoginEvent.php:29` | RG-012 |  |
| f06-03 | カスタマイズ | その他 | 会員ログインの副作用はログイン失敗回数・制限日時のセッション更新と共有トークン用Cookieの設定のみで、dtb_customer は照合のため参照のみ（失敗回数・制限日時はDBに保存しない）（詳細設 | 詳細設計の記述誤り（登録/更新は当機能に不該当）＋Excel L2084 登録/更新は定型ゆえ不該当 | `SecurityEventListener.php:35` | RG-024 |  |
| f06-03 | カスタマイズ | その他 | ログイン成立時に会員識別子入り共有トークンを発行しCookie設定・有効30日（詳細設計 L433,L350） | 設計どおり✓（#4の読取名不一致を除く） | `SecurityEventListener.php:35, config.yml:327` | RG-011 |  |
| f06-04 | 現行踏襲 | 乖離 | 再設定画面の入力メールは形式検証のみ・会員メールとの一致照合は行わない（会員特定はリセットキーで実施。詳細設計 L353,L354） | 乖離（設計は非照合・enterpriseは照合必須） | `ForgotController.php:127, ForgotController.php:206, RegisterCustomerViewRepository.php:151` | RG-016 |  |
| f06-04 | 現行踏襲 | 乖離 | 再設定画面で会員の保存パスワードがログインIDと同一のとき注意を表示する（詳細設計 L332,L349・表示のみ） | 乖離（注意表示 vs バリデーションエラーの機構差） | `PasswordResetType.php:54, ForgotController.php:97` | RG-010,014 |  |
| f06-05 | カスタマイズ | 乖離 | ヘッダー用保有ポイントを別エンドポイント（GET /{_locale}/mypage/point_in_header）で返す（詳細 処理フロー L340-341＝現行踏襲オラクル） | 乖離（エンドポイント未提供・要実機確認） | `FrontControllerProvider.php:129, MypageController.php:181` | RG-031 |  |
| f06-06 | カスタマイズ | 乖離 | 表示件数の選択肢は 10/50/100/300/500/1000/2000/10000/12000 件・初期値10件（Excel 0304:L2811,L2824） | 乖離疑義（マスタ実データで確定） | `ShoppingHistoryType.php:49, MypageController.php:454` | RG-004 |  |
| f06-08 | カスタマイズ | 乖離 | 登録上限のカウントは「まとめて入荷通知」で登録している場合でも1件、商品規格単位でも1件（Excel 0306:L3055） | 乖離（上限カウント単位が仕様と不一致）／要実機確認 | `NotifylistController.php:235` | RG-016(DV-03) |  |
| f06-08 | カスタマイズ | その他 | (3)商品件数は入荷通知に登録されている商品件数（Excel 0306:L3071） | length`（`NotifylistController.php:66` の `$key=Product.id-languageId` 単位グループ数）を件数表示。一方で登録上限判定は個々の依頼数（`:156` `count(...get | `notifylist.twig:41` | **乖離疑義（件数の定義曖昧・カウント基準二重化）／要実機確 |  |
| f06-08 | カスタマイズ | 乖離 | (4)商品画像を押下すると商品詳細画面へ遷移する（Excel 0306:L3072） | 乖離（画像の押下挙動が仕様と異なる）／要実機確認 | `notifylist.twig:51` | RG-004 |  |
| f06-08 | カスタマイズ | 乖離 | 商品詳細リンクは言語・規格を指定して遷移する（正本 画面遷移 L373「/{_locale}/products/detail/{id}、言語・規格を指定」） | 乖離（詳細リンクの言語/規格パラメータ欠落）／要実機確認 | `notifylist.twig:59` | RG-004,006 |  |
| f06-08 | カスタマイズ | 乖離 | 本機能の入口・権限は「会員ログインを要する」まで（Excel/正本 L370・L307。店舗（本店）限定の明示なし） | 乖離（未文書化の店舗限定挙動）／要実機確認 | `NotifylistController.php:52` | §5 HTTPステータス行 |  |
| f06-09 | カスタマイズ | 乖離 | 一覧の入口ルートは `GET /{_locale}/mypage/favorite/list`（詳細設計 L309,L331・現行 pf-eccube3 基準） | 乖離（route変更・実ソースを正・機能影響なし） | `FrontControllerProvider.php:155, MypageController.php:291` | RG-001,027,028 |  |
| f06-09 | カスタマイズ | 乖離 | セール通知案内文は「お気に入り登録した商品がセール対象になった際、…お知らせをお送りいたします」（詳細設計 L348・現行 pf-eccube3 template・英語「when your bookm | 乖離（実装バグ懸念・案内文言が通知内容と不一致）／要実機確認 | `messages.ja.yaml:700, messages.en.yaml:623, BatchFavoriteSaleNotificationAction.php:32` | RG-005 |  |
| f06-10 | カスタマイズ | 乖離 | ポイント履歴のExcel基本設計は `0306 sheet-10 F06-10 ポイント履歴`（`0306:L968,L3500台の概要`）。詳細設計も廃止根拠に「0306 ポイント履歴 識別ID:2 | 乖離（オラクル取り違え・ID衝突／要台帳修正） | `—` | 全体（Excel源） |  |
| f06-10 | カスタマイズ | 乖離 | 会員氏名＋「様」表示は廃止（刷新後は実装不要）（正本 L300-303,L323／Excel `0306:L3585` 識別ID2「項目を除去」） | 乖離（詳細設計内の記述矛盾・実装は廃止準拠） | `—` | §0廃止 |  |
| f06-11 | カスタマイズ | 乖離 | 買取金額合計はネット=査定承諾金額合計・店頭=査定金額合計を表示（Excel 0305:L3478） | 乖離疑義（net金額の内容・実機/査定承諾値で確定）／要実機確認 | `PurchaseHistoryRowBuilder.php:95` | RG-013 |  |
| f06-12 | カスタマイズ | 乖離 | 詳細の入口URLは単一の `GET /{_locale}/mypage/purchase_history/detail/{id}`（詳細設計 L304,L322-323,L331。`{id}`＝買取注 | 乖離（URL/ルート体系差・要実機確認） | `PurchaseHistoryController.php:99, PurchaseController.php:63` | RG-004,RG-015,RG-020 |  |
| f06-12 | カスタマイズ | 乖離 | 未ログインアクセスは会員ログインへ誘導する（詳細設計 L369,L375。「誘導」＝ログイン画面へ） | 乖離疑義（ファイアウォール依存・要実機確認） | `PurchaseHistoryController.php:217` | RG-023 |  |
| f06-12 | カスタマイズ | 乖離 | 本人の注文のみ取得。他人・存在しない注文は404（詳細設計 L344,L347）。取得対象の買取注文は会員に紐づく | 乖離（実装バグ懸念・堅牢性欠如）／要実機確認 | `PurchaseHistoryController.php:110` | RG-019 |  |
| f06-12 | カスタマイズ | 乖離 | 商品状態表示は PLD表記を廃止し SP・MP をそれぞれ状態表示する（Excel 0305:L3788,L3794,L3802,L3803） | 乖離疑義（マスタ依存の可能性・要実機確認） | `PurchaseHistoryNetDetailAction.php:161` | RG-006,DV-S3 |  |
| f06-13 | 現行踏襲 | 乖離 | なりすまし対策トークンは各POSTで検証する（詳細設計 L373）／申請完了メールは申請成立（副作用確定）に伴い送信（L339 手順8＝画像保存・ステータス更新の後） | 乖離（メール送信順の不整合懸念／現行トークン未検証）／要実機確認 | `IdentificationUpdateAction.php:82, ...IdentificationController.php:54` | RG-012,023 |  |
| f06-13 | 現行踏襲 | 乖離 | PC版はオンライン本人確認ページURLで生成されたQRコードを表示（Excel 0306:L3792「URLで生成されたQRコード」） | 乖離疑義（静的QR・要実機確認） | `online_identification.twig:40, ...online_identification_start.twig:82` | RG-002 |  |
| f06-14 | カスタマイズ | 乖離 | ページネーションと表示件数プルダウンを表示する（Excel 0306:L4167,L4184,L4185） | 乖離（詳細設計陳腐化・Excel=実装で満たされる） | `EventHistoryController.php:55, event_history.twig:58` | RG-015,016 |  |
| f06-14 | カスタマイズ | 乖離 | 予約済み申込に加えデッキ登録済みの大会も表示し、このページからデッキ編集可能（Excel 0306:L4152,L4155-4158,L4181,L4182） | 乖離（詳細設計欠落・Excel=実装で満たされる） | `EventHistoryController.php:76, event_history.twig:142, DtbDeckRepository.php:146` | RG-001,010,011 |  |
| f06-14 | カスタマイズ | 乖離 | (7)デッキ登録状況は「デッキ登録済み」/「デッキ未登録」と表示（Excel 0306:L4181） | 乖離（軽微な文言差・要実機確認） | `messages.ja.yaml:664` | RG-010 |  |
| f06-14 | カスタマイズ | 乖離 | 決済中ヘルプのツールチップ文言（Excel 0306:L4180「決済が中断されましたお手数ですが、約30分後に…」／詳細 L338「決済が中断されました。お手数ですが、約30分後に…」） | 乖離（軽微な文言差・要実機確認） | `messages.ja.yaml:663` | RG-006・DDT-A DA-01 |  |
| f06-16 | カスタマイズ | 乖離 | 提出時の判定順序は 3=選択フォーマット確定 → 4=イベント登録可否 の順（詳細設計 L342） | 乖離（順序差・結果影響小／要実機確認） | `DeckEntryController.php:110` | RG-030 |  |
| f06-16 | カスタマイズ | その他 | 選択可能フォーマットのフィルタは rankingFlg または otherMetaFlg がオン（Excel 0306:L4424） |  | `DeckEntryController.php:118` | $f->isOtherMetaFlg()`）・twig `d |  |
| f06-17 | カスタマイズ | 乖離 | 完了画面の4枚制限超過メッセージは「%d行目の%sが5枚以上登録されています」（詳細設計L343／Excel 0306:L4897「4枚制限の投入枚数制限を超えている場合」） | 乖離（4枚制限メッセージ文言差・軽微）／要実機確認 | `DeckValidationService.php:254, messages.ja.yaml:4398` | RG-016(DD-09) |  |
| f06-17 | カスタマイズ | その他 | フォーマット指定は「当該イベントのフォーマットに一致すること」を要し、一致しなければ404（L371／getSelectedFormat は全フォーマットから一致を探す：`pf-eccube3:Dec |  | `DeckEntryController.php:118` | isOtherMetaFlg())` で選択可能フォーマット |  |
| f06-17 | カスタマイズ | その他 | 更新時にイベント詳細が無い場合はHTTP404とする（L335 step4,L350,L382） | 現行pfバグ（移行先enterpriseで是正済み・回帰確認要） | `DeckentryController.php:158, DeckEntryController.php:110` | RG-015 相当（update側） |  |
| f06-17 | カスタマイズ | その他 | 完了画面 所有者確認（デッキの選手とログイン会員選手が不一致なら404）・デッキ/イベント詳細取得不可なら404（L337,L348,L382） |  | `DeckEntryController.php:170` | $Deck->getPlayer()?->getId() ! |  |
| f06-18 | カスタマイズ | その他 | 更新時にスマレジへ会員情報更新を連携する（詳細設計L360＝連携は更新の一部・条件記載なし＝常時） |  | `ChangeController.php:161, ChangeController.php:174` | $isTelChanged) ? registerUpdat |  |
| f06-18 | カスタマイズ | 乖離 | 氏名/住所/電話がブラックリストに該当する値に変更して「変更する」押下時、会員情報更新エラー画面に遷移する（Excel 0306:L5219 ★カスタマイズ要件） | 乖離（pf-eccube3 カスタマイズ未達） | `EntryController.php:104` | RG-019 |  |
| f06-19 | 標準 | 乖離 | 削除は「トークン欄が削除指示であることを判定し会員枠を無効化」「フォーム検証を待たずに会員枠の無効化を実行する」（L347順序3／L367） | 乖離（セキュリティ・設計沈黙）／要実機確認（脅威評価） | `MypageController.php:66` | RG-018 |  |
| f06-19 | 標準 | 乖離 | 会員照会の登録状況で会員枠変更/無効解除後変更/新規作成を分岐（L348）。設計は待機処理に言及なし | 乖離（設計未記載・性能懸念） | `Util.php:220` | RG-012 |  |
| f06-20 | カスタマイズ | 乖離 | 削除対象がログイン会員に紐づかない・IDが無い場合はHTTP404とする（詳細設計 L345,L358,L388） | 乖離（enterprise 400・仕様は404） | `DeliveryController.php:142, DeliveryController.php:219` | RG-002,013 |  |
| f06-20 | カスタマイズ | 乖離 | 配送先の削除は削除フラグを立てる論理削除とする（詳細設計 L345・移行時も現行の論理削除挙動を正 L319） | 乖離（enterprise 物理削除・現行論理から変更） | `DeliveryController.php:151, CustomerAddressRepository.php:43` | RG-014 |  |
| f06-20 | カスタマイズ | 乖離 | 本機能ではAPI呼び出し・メール送信を主処理として扱わない（詳細設計 L364・入出力 L367 にメール送信の記載なし） | 軽微乖離（未使用注入・意図不明確）／要実機確認 | `DeliveryController.php:26` | RG-030 |  |
| f06-21 | 現行踏襲 | 乖離 | スマレジ連携は「スマレジ側の会員データを削除する」（Excel 0306:L6160）。詳細設計L367は「会員の利用停止を連携」と表現 | 乖離（用語/対象の不一致・要実機確認） | `WithdrawController.php:75, WithdrawController.php:111, SmaregiCustomerService.php:499` | RG-007 |  |
| f06-21 | 現行踏襲 | その他 | パンくずリスト新規追加・現在ページ押下不可・ホームアイコンで本店ECTOP（Excel 0306:L6081,L6129）／画面上部ユーザ名表示の削除（Excel 名前ラベル「項目を除去」） | 未確認（オラクル規定あり・実装到達未検証） | `—` | RG-021,022 |  |
| f06-22 | カスタマイズ | 乖離 | イベントキャンセル時、イベント名・実施店舗・開催日・開始時間・キャンセル理由・その他理由・アンケートを内容欄(body)へまとめて転記する。これらは独立列を持たず body へ保存（詳細設計 L331 | 乖離（設計意図に対しサーバ無担保）／要実機確認 | `ContactCreateAction.php:61, ContactController.php:101` | RG-006,025,017 |  |
| f06-22 | カスタマイズ | 乖離 | メールアドレスは必須・メール厳格形式（RFC準拠チェック）（詳細設計 L378・Excel 0306:L6460「RFC準拠のメールアドレス形式チェック」） | 乖離（実装挙動・条件付き）／要実機確認 | `ContactType.php:76, ContactType.php:65` | DV-06 |  |
| f06-22 | カスタマイズ | その他 | 参考: 設計どおり確認 = ①氏名は必須・最大16(name_len)（`pf-eccube3:...Form/Type/Front/ContactType.php:46` name型／`ec-cub | RG-002,019,020,022,024 | `—` |  |  |
| f06-23 | 現行踏襲 | 乖離 | 画面上部のユーザ名表示を削除する＝一覧に会員氏名（名前ラベル）を表示しない（Excel `0306:L6811`／`0306:L6820`「名前 ラベル ※カスタマイズ対応、項目を除去」＝Excel優 | 乖離（現行＝Excel★カスタマイズ未適用／詳細設計HTMLの記述もExcelと競合＝Excelが正）／要実機確認 | `history.twig:7, history.twig:5` | RG-010 |  |
| f06-23 | 現行踏襲 | 乖離 | 「お問い合わせ種別」だけでなく「お問い合わせ番号」をクリックまたはタッチしても詳細ページへ遷移する（Excel `0306:L6822`） | 乖離（現行がExcel画面項目を未充足）／要実機確認 | `history.twig:19, history.twig:30` | RG-013 |  |
| f06-23 | 現行踏襲 | その他 | 一覧の送信日時書式は `Y年m月d日 H:i`（現行踏襲・Excel `0306:L6822` は表示項目のみ規定し書式に沈黙＝詳細設計 `f06-23_front_contact_history.h | date('Y年m月d日 H:i') }}`）。移行先は `Y/m/d H:i`（ja）／`m/d/Y H:i`（en）（`ec-cube-enterprise/.../Contact/history.twig:33,35`）＝一覧の日時書 | `history.twig:17` | **乖離（移行先の現行踏襲違反・日時書式の退行）／要実機確認 |  |
| f06-23 | 現行踏襲 | その他 | 総件数は0件のときも「0件」を表示する（詳細設計 `f06-23_front_contact_history.html:327,342`＝Excel `0306:L6821` 問い合わせ件数の沈黙部を | length }}` ＋「件」を無条件出力）。移行先は0件時に件数ブロックを描画せず空メッセージのみ表示（`ec-cube-enterprise/.../Contact/history.twig:11-15`＝`{% if contactH | `history.twig:10` | **乖離（移行先の現行踏襲違反・0件時「0件」非表示／番号文 |  |
| f06-24 | 現行踏襲 | 乖離 | 「戻る」（ボタン）は押下すると、お問い合わせ履歴画面へ遷移する（Excel `0306:L7008`） | 乖離（遷移先の不一致・直リンク流入時に顕在化）／要実機確認 | `history_detail.twig:35, history_detail.en.twig:35` | RG-015 |  |
| f06-24 | 現行踏襲 | 乖離 | 未ログインはアクセス不可とし、会員ログインへ誘導する（詳細設計 `f06-24_front_contact_history.html:367,373`。`/contact/history` 配下は会員 | 乖離（未ログイン時のログイン誘導が設計どおり成立しない疑い・ルート未保護）／要実機確認 | `ContactController.php:155, LoginUtil.php:20, FrontControllerProvider.php:111` | RG-020 |  |
| f06-24 | 現行踏襲 | その他 | 対象お問い合わせが存在しない／他会員のIDのとき、当該内容を表示しない。閲覧専用のため画面上の明示エラーは出さない（詳細設計 `f06-24_front_contact_history.html:34 | date('Y/m/d H:i') }}`』・`:19`『`contact.subject.subject`』・`:20`『`contact.id`』・`:25,26,29`）ため、「明示エラーを出さずに内容だけを出さない」ではなく画面エラ | `ContactController.php:156, history_detail.twig:18` | **乖離（不在/他会員ID時の応答が設計と異なる疑い）／要実 |  |
| f06-24 | 現行踏襲 | その他 | 詳細は `Y/m/d H:i` で送信日時を表示する（詳細設計 `f06-24_front_contact_history.html:342,326`。Excel `0306:L7005` は「お問い | date('m/d/Y H:i') }}`）。日本語版は `Y/m/d H:i`（`Contact/history_detail.twig:18,26`）。詳細設計はロケール別の書式差を規定していない（`:342` は単一書式のみ記述） | `history_detail.en.twig:18` | **乖離（設計未記述のロケール別書式差・軽微）／要実機確認* |  |
| f06-25 | カスタマイズ | その他 | DB操作＝登録/更新 dtb_order/dtb_waiting_number/dtb_waiting_tag を persist/flush で直接確定（詳細 L358,L359）※誤記 |  | `WaitingNumberController.php:44` |  |  |
| f06-26 | カスタマイズ | 乖離 | 端末IPは「転送元ヘッダがあればその先頭、無ければ接続元」（業務ルール L347）／現行 pf-eccube3 は `HTTP_X_FORWARDED_FOR` の先頭を無条件採用（`pf-eccub | 乖離（IP取得方式差・信頼プロキシ設定依存）／要実機確認 | `IpCheckSubscriber.php:54` | RG-004 |  |
| f06-26 | カスタマイズ | 乖離 | 遮断時は「共通エラー画面を返す」（画面遷移 L377・エラー処理 L380・表示メッセージ L343）。HTTPステータスは詳細設計・Excelとも明示せず／現行 pf-eccube3 は `$thi | 乖離（HTTPステータス 200→403 の変更）／要実機確認 | `CustomerGroupAccessListener.php:120` | RG-009,025 |  |
| f06-26 | カスタマイズ | 乖離 | 本店店内アカウントは本店注文＝可（相違点 Excel 0306:L7491／「店内アカウント」制限画面は1〜22でネット買取・マイページ系＝Excel 0306:L7448-L7470。購入手続き s | 乖離疑義（本店注文導線の過剰遮断・実機で注文完遂可否を要確認） | `CustomerGroupAccessRouteRegistry.php:83` | RG-013,014 |  |
| f07-01 | カスタマイズ | 乖離 | クッキー `shop` は「クエリで店舗が指定され、現在のクッキー値と異なる場合に更新する。クエリ指定が無いときは更新しない」（詳細設計 L397・Excel 0307:L1061「Cookie等を加 | 乖離（現行踏襲差・クッキー更新契機の拡大）／要実機確認 | `EventTopController.php:76, CookieUtil.php:16` | RG-002,RG-004 |  |
| f07-01 | カスタマイズ | 乖離 | クエリ・クッキーとも無ければ既定店舗（ID＝1）を表示する（詳細設計 L335,L344,L397・Excel沈黙部） | 乖離（既定店舗の決定方法の相違）／要実機確認（設定値の実値） | `EventTopController.php:100, EventScheduleController.php:126, EventController.php:34` | RG-001 |  |
| f07-02 | カスタマイズ | その他 | 1ページあたりのイベント表示件数は 100件（`excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1895`「1ページあたりのイベント表示件数は100 | カスタマイズ差分（設計どおり・移行先で実装済）／詳細設計HTMLの記述が Excel と矛盾＝詳細設計の更新漏れ | `EventController.php:36, EventSearchInput.php:24` | RG-026,029,035,063 |  |
| f07-02 | カスタマイズ | その他 | 過去表示のクエリ名は `allowPast`（`0307:L1881`「allowPast 過去」） |  | `DtbEventDetailRepository.php:341` | !$params['isPast'])`）／`app/Plu |  |
| f07-02 | カスタマイズ | その他 | キーワードは スペースがあった場合はスペースで分割し、分割したキーワードでAnd検索（`0307:L1892`） | カスタマイズ差分（設計どおり・移行先で実装済）／詳細設計HTMLの「部分一致」記述（L344）は Excel L1892 と矛盾＝詳細設計の更新漏れ | `DtbEventDetailRepository.php:306, EventSearchInput.php:152, DtbEventDetailRepository.php:499` | RG-001,003 |  |
| f07-02 | カスタマイズ | 乖離 | カテゴリ(1-4)の「事前予約」は イベント設定の「オンライン受付あり」を検索対象とする（`0307:L1916`）。詳細(1-7)の「大型のイベントを表示する」は イベント規模に大型イベントが設定さ | 乖離（Excel条件の解釈が実装で確定できない／マジックナンバー依存）／要実機確認（「オンライン受付あり」に対応する項目の同定、イベント規模ID=4 が「大型イベント」であることの確認） | `DtbEventDetailRepository.php:560, DtbEventDetail.php:90, DtbEventDetailRepository.php:564` | RG-011,012,017 |  |
| f07-02 | カスタマイズ | 乖離 | カテゴリ(1-4)の「初心者歓迎」「カジュアル対戦」「競技」は イベント設定の「ルール適用度」を検索対象とし、選択肢はOR検索（`0307:L1916`） | 乖離（マジックナンバー依存・マスタ非追随）／要実機確認（ルール適用度ID 6/7/2 が「初心者歓迎」「カジュアル対戦」「競技」であることの確認） | `DtbEventDetailRepository.php:585, MtbRel.php:31, DtbEvent.php:43` | RG-010,012 |  |
| f07-03 | カスタマイズ | その他 | 参加費は0円のとき「無料」、それ以外は金額を桁区切りで「（金額）円」と表示する（詳細設計 L329・Excel 0307:L2208 は「イベント参加費」を規定） | number_format }}` と表示（`ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:132-136`）。「（金額）円」書式でない。 | `—` | number_format() }}円`（`pf-eccub |  |
| f07-03 | カスタマイズ | 乖離 | 受付項目のラベルは Excel の「受付期間」（0307:L2205「イベントの申込受付期間」） | 乖離（Excel仕様違反・ラベル文言）／要実機確認 | `messages.ja.yaml:6593, detail.twig:107` | RG-009 |  |
| f07-03 | カスタマイズ | 乖離 | 管理画面の「アコーディオンをデフォルト閉じる」がONの場合、デフォルトでアコーディオンを閉じた状態とする（0307:L2283-L2284） | 乖離（設定名と挙動の不一致・Excelの設定名と不一致）／要実機確認 | `DtbEvent.php:96, messages.ja.yaml:6001, detail.twig:150` | RG-017,018 |  |
| f07-03 | カスタマイズ | 乖離 | 備考（現行 `dtb_event.detail_jp`）を表示要素に含む（詳細設計 L328,L343,L383）。Excel画面項目には備考が無くフリーエリア1-3が追加されている（0307:L21 | 乖離（備考のフリーエリアへの置換がオラクルに明示されず）／要実機確認 | `detail.twig:140, show.twig:80` | §5「備考」要判定 |  |
| f07-04 | カスタマイズ | 乖離 | 外部決済（3.決済入力・確認画面）はソニーペイメントのリンクタイプ決済画面を利用する（Excel 0307:L2804）。外部システムのため内部詳細は省略（0307:L2805） | 乖離（決済事業者/プラグインの対応が未明示）／要実機確認 | `—` | RG-022,023,025,026,048〜050 |  |
| f08-02 | カスタマイズ | 乖離 | 申込時間10分以内に申し込まない場合、店頭買取査定申込前ログイン画面へ遷移する（Excel 0308:L1193,L1194） | 乖離（10分制限がクライアント側のみで強制・サーバ非強制。直リクエストで超過受理の可能性＝要実機確認・セキュリティ観点） | `otc_buy_order_js.twig:145` | RG-009,015（期待は設計どおり10分でエントリー戻し |  |
| f08-03 | カスタマイズ | 乖離 | 完了画面は画面表示後15秒経過で店頭買取査定申込前ログイン画面（＝エントリー）へ自動遷移する（Excel基本設計 0308:L1479） | 乖離（設計は固定15秒・実装は可変オプション）／要実機確認（オプション実値） | `OtcBuyController.php:327, OtcBuyController.php:485` | RG-025 |  |
| f08-03 | カスタマイズ | 乖離 | 完了は「セッションの査定IDから申込みを取得し完了画面を表示。査定IDが無ければエントリーへ戻す」（L328,L337,L356）。店舗特定は確認・完了いずれもパスの店舗識別名で行う（L329,L33 | 乖離（リポ間 挙動非一貫・設計は完了時店舗404を未規定） | `OtcBuyController.php:315, OtcBuyController.php:456` | RG-024 |  |
| m01-01 | 標準 | 乖離 | 認証成功時に成功区分（status_id=1）で履歴を1件登録し、`dtb_member.login_date` を更新する（`function_spec_html_preview/ec-cube-e | 乖離（成功履歴の多重登録・最終ログイン日時の毎リクエスト更新＝設計「1件登録」に反する）／要実機確認 | `SecurityListener.php:47, Constant.php:47, SecurityListener.php:47` | RG-020,022,044 |  |
| m01-01 | 標準 | 乖離 | `dtb_member.is_auto_logout` は「自動ログアウト制御に使われるフラグ。true の場合、自動ログアウト判定をスキップする」（正本 `:302`） | 乖離（設計記述と実装のフラグ意味が反転）／要実機確認 | `AdminAutoLogoutListener.php:81, Member.php:121` | RG-040 |  |
| m01-01 | 標準 | 乖離 | 試行制限は「固定窓方式で 5 回 / 30 分の上限を持ち、Redis の rate limiter cache に状態を保存する」（正本 `:325`） | 乖離（本番環境で設計の 5 回上限が成立しない・E2E用オーバーライドの残存＝セキュリティ影響）／要実機確認 | `eccube.yaml:284, framework.yaml:75, eccube_e2e_login_throttling.yaml:5` | RG-034,036 |  |
| m01-01 | 標準 | 乖離 | 入力項目のログインID・パスワードは「最大長 実装確認値 50 文字（LoginType の eccube_id_max_len / eccube_password_max_len）」（正本 `:28 | 乖離（最大長のサーバ側非強制＝クライアント側 maxlength のみ）／DV-05,06 の実機挙動確認で確定 | `LoginType.php:39, security.yaml:43, MemberProvider.php:74` | RG-004(DV-04,05,06),RG-056 |  |
| m01-02 | 標準 | 乖離 | デバイストークンは「必須、6 桁固定長。数字以外や桁数不一致はフォームエラーとなり、画面では 6 桁で入力するよう促すメッセージを表示する」（`function_spec_html_preview/e | 乖離（バリデーション欠落・文言分岐が設計どおりに出ない）／要実機確認 | `TwoFactorAuthType.php:37, TwoFactorAuthController.php:141` | RG-047／§3 DV-04,DV-09,DV-12 |  |
| m01-02 | 標準 | 乖離 | 追加認証について「システム 2FA が無効、または認証済み Cookie が既に有効なら、ホーム画面相当へ送る。秘密鍵が未設定なら、初回設定画面へ誘導する。POST で 6 桁トークンを受け取り…」（ | 乖離（誘導漏れ・秘密鍵未設定者に無意味な入力画面）／要実機確認 | `TwoFactorAuthController.php:46, TwoFactorAuthListener.php:31` | RG-010 |  |
| m01-02 | 標準 | 乖離 | 本人の再設定画面のエラー文言は「トークン入力欄近傍（赤文字・再入力／形式不正）」に表示し、画面上部アラートに出すのは「既に2段階認証の設定が行われています。…」の警告のみ（同:282） | 乖離（表示位置・二重表示）／要実機確認 | `TwoFactorAuthController.php:109, two_factor_auth_edit.twig:89, two_factor_auth.twig:27` | RG-028 |  |
| m01-02 | 標準 | 乖離 | 「GET 時に既に秘密鍵が DB 上ある場合は警告を出し、再設定に相当することを伝える」を初回設定の処理フローとして記述（同:263）。一方で表示メッセージ表は当警告を「本人の再設定画面のみ」と限定（ | 乖離（正本内不整合・設計記述の死文）／要実機確認・設計要修正 | `TwoFactorAuthController.php:93` | RG-026 |  |
| m02-01 | 標準 | 乖離 | 「別の拡張フックが、ホームに渡す最終的なコンテキスト（件数マップ、表示用ステータス一覧、ほかダッシュボード他ブロック用の値）をイベント引数として公開する。拡張処理が受注状況に関わる配列を上書きした場合 | 乖離（設計が規定する拡張点が実装で機能しない）／要実機確認 | `AdminController.php:171` | RG-024 |  |
| m02-01 | 標準 | 乖離 | 本ブロックは参照のみ: 「本ブロックは参照のみであり、受注やステータスマスタを更新しない」（`…m02-01_admin_home_home_order_status.html:275`）／「副作用  | 乖離（設計書内部矛盾・DB操作節の記述誤り）／要実機確認 | `AdminController.php:104` | RG-019・§5「登録内容／更新内容／削除」= 要判定 |  |
| m02-02 | 標準 | 乖離 | グラフ用 Ajax が CSRF 検証を満たさない場合も「グラフデータは取得できず JSON エラー相当の本文が返る」（`function_spec_html_preview/ec-cube-ente | 乖離（CSRF不成立時の応答形式が設計の「JSONエラー相当の本文」と異なる／設計・実装いずれの誤りかは要判断）／要実機確認 | `AdminController.php:213, AbstractController.php:252` | RG-030（RG-029・RG-031と対比） |  |
| m02-02 | 標準 | その他 | 本機能は参照系であり「本ブロックは参照のみであり、受注台帳やマスタを更新しない」（同 :282）、「副作用 本ブロックの処理だけを見ると、受注台帳やマスタを更新しない。グラフ取得でもセッションを本ブロ | flush" src/Eccube/Controller/Admin/AdminController.php` → 0件）。dtb_order への登録・更新は行われない | `AdminController.php:369` | **乖離（設計書DB操作節の誤記＝参照系の記述と矛盾。実装は |  |
| m02-03 | 標準 | 乖離 | 正本内部の矛盾: 本機能は参照のみ ——「本グラフの処理だけを見ると、受注台帳やマスタを更新しない」（`function_spec_html_preview/ec-cube-enterprise/m0 | 乖離（正本の記述誤り・参照系に登録/更新の副作用を規定）／設計書側の是正が必要／要実機確認 | `—` | RG-038（§1・§5にも注記） |  |
| m02-03 | 標準 | 乖離 | 正本内部の矛盾: 週間区間の開始境界 —— 処理フローは「週間相当。当日0時から現在時刻までの区間。開始は当日から過去へ約一週間さかのぼった日とし、バケットキーは日単位（`Y/m/d`）である」（同  | 乖離（正本の記述矛盾・週間区間の開始境界）／設計書側の是正が必要／要実機確認 | `—` | RG-008・§3 DV-01,DV-02,DV-08 |  |
| m02-03 | 標準 | 乖離 | 縦軸目盛りは「整数値のときのみ通貨記号と桁区切りを付して表示し、整数でない目盛り値はラベルを表示しない」（同 :244,:261）。エッジケースでは「該当受注が0件…棒の高さは0になる」（同 :264 | 乖離候補（縦軸0基点指定のキー名不一致）／要実機確認（Chart.jsのバージョン固有の表示仕様の細部は正本 :231 で対象外のため、実機で目盛り基点を確認） | `—` | RG-022・RG-012 |  |
| m02-03 | 標準 | 乖離 | ツールチップの値は「通貨記号を前置し、3桁区切りのカンマを付して整形する」（同 :244,:261）＝桁区切りは1回だけ適用される | 乖離候補（ツールチップの桁区切り二重適用）／要実機確認（Chart.jsの`formattedValue`の実際の返却値に依存。正本 :231 によりChart.jsのバージョン固有仕様は本書対象外のため実機で表示を確認） | `—` | RG-021 |  |
| m02-04 | 標準 | 乖離 | 在庫切れ判定の在庫数量は商品規格の列である。正本は「規格について stock_unlimited が偽、かつ stock が 0、かつ visible が真である行が存在する商品」（L259）と記し、 | 乖離（正本のDBカラム表・集計条件の誤記／在庫数量の所在テーブル相違）／要実機確認 | `—` | RG-003（DV-01〜09）,DV-15 |  |
| m02-04 | 標準 | 乖離 | 在庫切れ商品数の限定条件は3条件のみ。「規格について stock_unlimited が偽、かつ stock が 0、かつ visible が真である行が存在する商品について、商品 ID を一意に数え | 乖離（正本の集計条件が限定を落としている＝記載漏れ）／要実機確認 | `—` | RG-001,RG-003,DV-15 |  |
| m02-04 | 標準 | 乖離 | DB操作節（L280-281）が「永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず pers | 乖離（正本 DB操作節の定型注入誤記＝本機能に不適合。参照系との自己矛盾）／要実機確認 | `—` | RG-021,RG-031 |  |
| m02-05 | 標準 | その他 | `eccube_info_url` は「パッケージ同梱の `eccube.yaml` において既定が宣言され、環境別設定でこの宣言は置き換えられる」（`function_spec_html_previ | info_url" ec-cube-enterprise/.env ec-cube-enterprise/app/config/eccube/packages/.yaml` → 当該行のみ）、上書きには設定ファイル自体の編集または追加のパラ | `eccube.yaml:165` | **乖離（設計が述べる「環境別設定での置き換え」の具体経路が |  |
| m02-05 | 標準 | 乖離 | 情報iframe の `src` には「設定から読み取ったその文字列を…`src` 属性値として出力する」（同 `:247`）／「設定された文字列をそのまま `src` に使う」（同 `:257`）／ | 乖離（「そのまま出力」の記述精度不足・HTMLソース等値照合時に不一致となりうる）／要実機確認（`&` 等を含む設定値での HTML ソースおよび実リクエストURLの確認が必要） | `index.twig:311` | RG-003（DS-02,DS-04）,RG-007 |  |
| m02-05 | 標準 | その他 | カード構成: 「本体は余白なし（`p-0`）で情報iframe を敷き詰める」「フッタは固定高さの空領域」「情報iframe は横幅いっぱい、枠線なし、最小高さがピクセル指定」（同 `:226`,`: | trans }}`（訳語は `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1891` `admin.home.news_title: お知らせ`）、`:310 | `index.twig:304` | link_list_wrap" index.twig` はカ |  |
| m02-05 | 標準 | 乖離 | 入口は `GET /%eccube_admin_route%/`（同 `:240`）／サーバ側処理は本カード専用のDB読み取り・API呼び出し・テンプレート変数の追加を行わない（同 `:226`,`: | 乖離なし | `AdminController.php:102` | RG-001,002,026,034,035 |  |
| m02-06 | 標準 | 乖離 | 外部APIのレスポンス処理で例外が発生した場合も、例外はホーム表示処理内で握りつぶし、テンプレートへ空配列を渡す（`function_spec_html_preview/ec-cube-enterpr | 乖離（レスポンス処理例外でホーム画面全体が落ちる）／要実機確認 | `AdminController.php:189, PluginApiService.php:127` | RG-007,011 |  |
| m02-06 | 標準 | 乖離 | 外部API上で未購入、かつ購入が必要である場合に「未購入の有料プラグイン」にする（`…m02-06_…html:251`,`:262` 手順4）。レスポンス項目欠落時のフォールバックは本カード側に定義 | 乖離（欠落時の判定が未定義・購入導線へ倒れる恐れ）／要実機確認 | `PluginApiService.php:155` | RG-041, DV-09 |  |
| m02-06 | 標準 | 乖離 | 現在のEC-CUBEバージョンが対象プラグインの対応バージョン一覧に含まれるかを判定し、詳細モーダルの警告表示に使う（`…m02-06_…html:251`,`:262` 手順5-6） | 乖離（対応バージョン項目欠落でホーム画面全体が落ちる）／要実機確認 | `PluginApiService.php:309` | RG-019, DV-08,DV-09 |  |
| m02-06 | 標準 | その他 | 問い合わせURLがある場合、モーダル内に外部リンクを表示する。URLが無い項目のボタンは表示しない（`…m02-06_…html:242`,`:255`,`:268`）。モーダル内容として定義された項 | trans }}</a>{ }}`）。問い合わせURLがあるプラグインのモーダルで、ボタン直後に文字列 `{ }}` がそのまま描画される。設計のモーダル内容に存在しない表示物 | `plugin_detail_modal.twig:26` | **乖離（テンプレート残骸の意図しない描画）／要実機確認** |  |
| m02-06 | 標準 | 乖離 | 外部APIへはプラグイン認証キー、現在のサイトURL、EC-CUBEバージョンをヘッダとして送信する。認証キーの原値は表示・記録しない（`…m02-06_…html:249`,`:266`）。ログに出 | 乖離（認証キー送信路のピア検証無効＝秘密値の保護不足）／要実機確認 | `PluginApiService.php:257` | RG-002,037 |  |
| m03-06 | カスタマイズ | 乖離 | Excel は並び順の参照先を「0202_基本設計仕様書(在庫管理機能).xlsx の納品書印刷（日本語）シート」と記す（`excel_to_html/output/0204_基本設計仕様書(商品管理 | 乖離（オラクル内部の参照先誤り）／要仕様確認 | `—` | RG-008 |  |
| m03-06 | カスタマイズ | 乖離 | 参照するセッションキーは `eccube.admin.product.search`（詳細設計 `…m03-06_admin_product_product_custom_csv_export.htm | 乖離（内部差・セッション互換）／要実機確認 | `ProductCsvController.php:256, ProductCsvController.php:1836` | RG-027 |  |
| m03-06 | カスタマイズ | 乖離 | 原価単価（★カスタマイズ追加項目・Excel `excel_to_html/output/0204_基本設計仕様書(商品管理).html:2223,2310`）は、複数値になり得る列としてバッチ内の別 | 乖離候補（カスタマイズ項目の値汚染リスク）／要実機確認 | `ProductAllCsv.php:336` | RG-016,017 |  |
| m03-08 | カスタマイズ | 乖離 | 「その他」の状態のソート順は通常規格の後で、さらに価格ソートで高額順に表示する（Excel 0204:L5193） | 乖離疑義（要実機確認・card_conditionマスタ順序に依存） | `ProductClassRepository.php:100` | RG-008 |  |
| m03-08 | カスタマイズ | その他 | 基準価格を一覧に追加（Excel 0204:L5185） | number_format`）・ヘッダ `:8`（`admin.product.standard_price`） | `index.twig:96` | **設計どおり✓** |  |
| m03-08 | カスタマイズ | 乖離 | 廃止規格一覧は公開ステータス廃止の規格を出力する（Excel 0204:L5190・NULL言語/カード状態への言及なし） | 乖離疑義（要実機確認・NULL属性の廃止規格が不可視） | `ProductClassRepository.php:312` | RG-002,010 |  |
| m03-09 | カスタマイズ | 乖離 | 更新成功時は同じ規格の編集画面へ302リダイレクトする（詳細設計 `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product | 乖離（遷移先の差）／要実機確認 | `ProductClassController.php:263` | RG-044 |  |
| m03-09 | カスタマイズ | 乖離 | 成功フラッシュは「登録が完了しました。」（キー `admin.register.complete`）、検証失敗は「登録できませんでした。」（キー `admin.register.failed`）（詳細 | 乖離（メッセージキー/文言の差）／要実機確認 | `ProductClassController.php:262` | RG-043,044 |  |
| m03-09 | カスタマイズ | 乖離 | 規格が最後の1件のときは削除しない＝削除可能でない場合は不正要求（HTTP400）（詳細設計 `...m03-09_admin_product_product_class_edit.html:340, | 乖離（保護欠落・データ破壊リスク）／要実機確認 | `ProductClassController.php:265, ProductClassDeleteAction.php:63` | RG-047 |  |
| m03-09 | カスタマイズ | 乖離 | 削除・廃止は論理削除（Excel `0204:L5443`「廃止は論理削除とし、廃止した商品規格は復活できない」／詳細設計 `...:340`「規格を論理削除し、永続化を確定する」） | 乖離（削除方式・復元不能）／要実機確認 | `ProductClassDeleteAction.php:63, ProductClass.php:950` | RG-048 |  |
| m03-09 | カスタマイズ | 乖離 | 300円閾値ポップアップの契機は販売価格が閾値を跨ぐ変更（Excel `0204:L5480,L5481,L5482,L5483`） | 乖離（設計未記載の追加契機）／要実機確認・設計側の追記要否を確認 | `edit.twig:190` | RG-029,030 |  |
| m03-09 | カスタマイズ | 乖離 | 入口URLは `GET/POST /{admin_route}/product/product/{id}/class/new`・`.../class/{classId}/edit`・`.../clas | 乖離（URL体系の差・内部差）／要実機確認 | `ProductClassController.php:72` | RG-001〜004,043,044,047,048 |  |
| m03-09 | カスタマイズ | 乖離 | 棚番号は必須選択（詳細設計 `...m03-09_admin_product_product_class_edit.html:348,371`。Excelは棚番号のカスタマイズを規定せず必須列も空＝` | 乖離（必須の差）／要実機確認・Excel必須列との整合を設計側で確認 | `ProductClassType.php:277` | RG-037 |  |
| m03-11 | カスタマイズ | 乖離 | 永続化に失敗し例外が上がった場合、先に移動済みの画像パスだけを削除してから例外を再送出する（詳細設計 `…m03-11….html:337` 手順5・`:354` エッジケース表。Excel は沈黙） | 乖離（設計どおりの後始末が無く孤児ファイルが残留）／要実機確認 | `CategoryController.php:190` | RG-036 |  |
| m03-12 | カスタマイズ | 乖離 | Excel は「CSV出力項目を設定しているテーブル にレコードを追加」し「レコードの詳細(項目名とフィールド名の紐づけ)は、詳細設計にて定義する」と明記する（`excel_to_html/outpu | 乖離（Excelが委譲した定義が詳細設計に不在＝設計書間の欠落。実装は存在するがオラクル化できない）／要実機確認 | `Version20260401120000.php:42` | RG-002,003（列⇔フィールド対応の裏取り） |  |
| m03-12 | カスタマイズ | 乖離 | Excel の出力項目名は識別ID:10「最新セット用バナー 画像パス」・識別ID:11「カテゴリアイコン 画像パス」（`excel_to_html/output/0204_基本設計仕様書(商品管理) | 乖離（ヘッダ文言の表記未確定・Excel内でも表記揺れ）／要実機確認 | `Version20260401120000.php:46` | RG-001,002,011 |  |
| m03-13 | 現行踏襲 | 乖離 | 件数は単一選択で選択肢は 10/50/100/300/500/1000/2000/10000/12000 のみ（Excel 0204:L6746） | 乖離（Excel明示の選択肢限定が未強制・URL直指定で回避可能）／要実機確認 | `TagController.php:80, tag.twig:150, TagController.php:32` | RG-006 |  |
| m03-13 | 現行踏襲 | 乖離 | 優先表示商品は商品コードを改行区切りで入力する（Excel 0204:L6741「9 優先表示商品 … 商品コード(product_code)を改行区切りで入力」） | 乖離（改行種別の限定＝現行踏襲だがExcel指示より狭い・コード呼称の不一致）／要実機確認 | `TagStoreAction.php:52, TagController.php:71, ProductClassRepository.php:1434` | RG-016,RG-022 |  |
| m03-13 | 現行踏襲 | その他 | タグ削除は現行踏襲＝固定タグ（`tag_id` が `Tag::FIXED_FORM_NUM`=7 以下）は削除不可（現行 `pf-eccube3/app/Plugin/HareruyaEc/Cont | $id <= Tag::FIXED_FORM_NUM | `—` |  |  |
| m03-13 | 現行踏襲 | 乖離 | 優先表示の rank は「行数 `n`・0始まりインデックス `i` として `n − i`」＝先頭のコードが最大 rank（詳細設計 `function_spec_html_preview/pf-e | 乖離（設計記述と実挙動の差・rank飛び番/0値の可能性）／要実機確認 | `TagStoreAction.php:53, TagController.php:72` | RG-017,RG-018 |  |
| m03-14 | 現行踏襲 | 乖離 | 件数プルダウンの選択肢は 9種＝10件/50件/100件/300件/500件/1000件/2000件/10000件/12000件（Excel `excel_to_html/output/0204_基本 | 乖離（Excel基本設計 未充足）／要実機確認 | `storage_code.twig:114` | RG-018 |  |
| m03-14 | 現行踏襲 | 乖離 | 削除拒否は現行踏襲＝紐づく商品の有無で判定しエラー文言を出す（Excel `…0204_基本設計仕様書(商品管理).html:6965`「・該当の略称タグに紐づく商品がある場合は削除できずにエラーとな | 乖離（現行踏襲差・削除判定対象とメッセージ鍵の変更）／要実機確認 | `StorageCodeController.php:143, MtbStorageCode.php:88, messages.ja.yaml:1975` | RG-013,RG-014 |  |
| m03-15 | 現行踏襲 | 乖離 | 処理フローは「略称タグを並び順の昇順で取得する」→「ヘッダを出力し、各略称タグの行を…ストリーミング出力する」の順（`function_spec_html_preview/pf-eccube3/m03 | 乖離（内部差・異常時の部分出力リスク）／要実機確認 | `StorageCodeController.php:172` | RG-009,RG-019 |  |
| m03-15 | 現行踏襲 | 乖離 | 出力はストリーミングで行う（`function_spec_html_preview/pf-eccube3/m03-15_admin_product_product_storage_code_expor | 乖離（内部差・レスポンス送出方式）／要実機確認 | `StorageCodeController.php:192` | RG-009 |  |
| m03-16 | 現行踏襲 | 乖離 | 取込時の判定は「取込ヘッダと必須項目の妥当性を確認する」（詳細設計 `...:326,329`）＋「CSVに入力された情報で略称タグを登録する」（Excel 0204:L7286）。CSV行間の重複判 | 乖離（設計に無い検証の存在＝設計追記または仕様確認が必要）／要実機確認 | `StorageCodeCsv.php:32, StorageCodeCsv.php:88` | §5「相関バリデーション＝要判定」 |  |
| m03-16 | 現行踏襲 | 乖離 | CSVのIDは主キーで必須△・「新規登録時は不要」（Excel 0204:L7431）＝ID空の行は新規登録になる | 乖離（現行踏襲差・ID空/0の判定経路）／要実機確認 | `StorageCodeCsv.php:41, StorageCodeCsv.php:98` | RG-006（DV-01） |  |
| m03-17 | 現行踏襲 | 乖離 | 並び順の許容範囲は 0〜32767（Excel M03-17 画面項目(2)並び順「最大値」列＝`excel_to_html/output/0204_基本設計仕様書(商品管理).html:4241`） | 乖離（Excel設計違反・入力範囲の両端不一致）／要実機確認 | `TagSalesAnalysisType.php:52, TagSalesAnalysisType.php:35, MtbTagSalesAnalysis.php:56` | RG-015・§3 DV-07,DV-08,DV-09,DV |  |
| m03-17 | 現行踏襲 | 乖離 | 名称の重複は一意制約違反として検知し `admin.error.non_unique` と再描画（詳細設計 `function_spec_html_preview/pf-eccube3/m03-17_ | 乖離（現行踏襲違反・一意制約の消失／設計記載の分岐が到達不能の疑い）／要実機確認 | `MtbTagSalesAnalysis.php:27, Plugin.HareruyaEc.Entity.MtbTagSalesAnalysis.dcm.yml:5, TagSalesAnalysisController.php:125` | RG-017・§3 DV-05 |  |
| m03-17 | 現行踏襲 | 乖離 | 削除完了時のフラッシュは `admin.common.delete_complete`（詳細設計 `…m03-17_…html:327`） | 乖離（現行踏襲差・メッセージキー）／要実機確認 | `TagSalesAnalysisController.php:104, TagSalesAnalysisController.php:176` | RG-019 |  |
| m03-17 | 現行踏襲 | 乖離 | Excel M03-17 の概要は「売上分析タグ更新をCSVにて登録ができる」（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:4186`）だが、同ページの | 乖離（Excel概要の記載不整合＝機能範囲の誤記の疑い）／要実機確認・設計側の確認要 | `TagSalesAnalysisController.php:51` | §0（CSVは別範囲） |  |
| m03-17 | 現行踏襲 | 乖離 | 詳細設計「リニューアル移行時の扱い」は現行の商品紐付け補助表を `dtb_product_tag_sales_analysis`、注文明細側を `dtb_order_item_tag_sales_an | 乖離（詳細設計の現行側テーブル名誤記・「同一」判定の誤り）／要実機確認 | `Plugin.HareruyaEc.Entity.MtbTagSalesAnalysis.dcm.yml:37, MtbTagSalesAnalysis.php:74` | RG-020,RG-021（SEED定義の紐付け表） |  |
| m03-18 | カスタマイズ | 乖離 | 部門削除のエラー条件は3種＝商品規格／店頭買取の買取商品／店頭買取の個別入力商品（Excel 0204:L7596,L7597,L7598） | 乖離（仕様外の追加削除ガード）／要仕様確認 | `SectionController.php:147, MtbSection.php:251` | RG-006〜009 |  |
| m03-18 | カスタマイズ | 乖離 | スマレジ連携は「部門登録および部門更新実行時」に部門情報を連携（Excel 0204:L7585,L7586）。削除時のスマレジ連携はExcel／詳細設計とも沈黙 | 乖離（設計沈黙・削除連携が実装先行）／要仕様確認 | `SectionController.php:184, SmaregiSectionEventService.php:85` | RG-006 |  |
| m03-18 | カスタマイズ | 乖離 | 免税区分の初期値は「-」（Excel 0204:L7611 初期値欄空欄）。詳細設計 L343 は新規=先頭選択肢(0) | 乖離（Excel初期値「-」と実装の既定0の差）／低優先・要実機確認 | `ProductDepartmentType.php:64, MtbSection.php:55` | RG-002 |  |
| m03-19 | 現行踏襲 | その他 | 出力5列＝ID/部門名/部門コード/免税区分/MTGBuyer表示フラグ（0204:L7794/L7795/L7796/L7797/L7798） |  | `SectionController.php:19` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計は現行・移行先とも「部門コード昇順」と記述（L319「部門コード昇順かつ条件無しで全件取得」、L300「並び順…両者で同じ」） |  | `SectionController.php:154, SectionController.php:218` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L315 はCSV出力ボタンの遷移先を `path('m03-18_admin_product_product_section_export')` と記述 |  | `section.twig:44, SectionController.php:215` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L329「MTGBuyer表示フラグは真偽を1／0の整数で出力」 |  | `SectionController.php:166, SectionController.php:225` |  |  |
| m03-20 | カスタマイズ | 乖離 | 免税区分の追加（登録可能とし、0:対象外/1:一般品/2:消耗品）（Excel 0204:L7968-7970） | 設計どおり✓（列追加）／値検証は#2で乖離 | `CsvImportController.php:2158, messages.ja.yaml:2397` | RG-008,009 |  |
| m03-21 | 現行踏襲 | その他 | 実装の実態（repo:file:line） |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 未実装（両リポ共通）: 画面フォームは NotBlank のみで Range/PositiveOrZero 検証が無い — 現行 `pf-eccube3/app/Plugin/HareruyaEc/F |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 記述と矛盾（両リポとも検証あり）: 移行先 `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ShelfNumberMasterImp |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 現行に未実装: 現行は一覧を全件描画し件数セレクト・ページャを持たない — `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/She |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 未強制: 移行先はクエリ `page_count` を整数化してそのままセッションへ格納し許容一覧との照合が無い — `ec-cube-enterprise/src/Eccube/Controller |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は `admin.common.delete_complete` — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Sh |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は商品規格 `ProductClasses` の有無で判定 — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Shelf |  | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は BOM を付与しない — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ShelfNumberController. |  | `—` |  |  |
| m03-23 | 現行踏襲 | 乖離 | Excel カスタマイズ: 「基準価格の検索項目と検索結果一覧に変更前基準価格・変更後基準価格の項目を追加」（Excel 0204:L8951） | 乖離疑義（Excelの「検索項目追加」は変更後レンジのみで変更前レンジ検索は未提供・要実機/仕様確認） | `BuySalePriceHistoryController.php:45, DtbPriceHistoryRepository.php:427` | RG-014,026／§5 変更前レンジ要判定 |  |
| m03-23 | 現行踏襲 | 乖離 | フォーム choice の 公開状態 既定は「公開」（Excel 0204:L8968 初期値=公開） | 乖離（詳細設計 L346 の記述誇張・実装/ Excel は公開のみ） | `SearchProductType.php:110` | RG-007 |  |
| m03-23 | 現行踏襲 | その他 | 他画面遷移で URL クエリをセッション検索文脈へマージ。詳細設計 L328/L347 は「product_id または code」をマージと記述 | 'code' | `BuySalePriceHistoryController.php:135` | 'card_condition')`のみ分岐、`code`→ |  |
| m03-23 | 現行踏襲 | 乖離 | 価格レンジ項目の桁上限。Excel 0204:L8975-L8980（1-13〜1-18）の「最大文字数 または最大値」欄は `-999999999` 表記／詳細設計 L346 は `eccube_p | 乖離（Excel の最大値欄表記が曖昧・実装は Length 8 桁）／要実機確認 | `SearchProductType.php:225, eccube.yaml:126` | RG-030,DA-06,DA-07 |  |
| m03-24 | 現行踏襲 | 乖離 | 商品名＝商品の名称（詳細設計 L336・Excel 0204:L9197）。言語・登録者・カード状態は null ガードあり | 乖離（null安全性の非対称・要実機確認） | `BuySalePriceHistoryController.php:281` | RG-004 |  |
| m03-24 | 現行踏襲 | 乖離 | CSV フィールドは fputcsv の規則でダブルクォート囲み・エスケープはバックスラッシュ（詳細設計 L341） | 乖離疑義（仕様追認済み・相互運用は要実機確認） | `CsvExportService.php:290` | RG-010 |  |
| m03-25 | 現行踏襲 | 乖離 | 結果ページのリンクは規格編集ルート `admin_product_product_class_edit` に `id`（商品ID）・`productClassId`（規格ID）を与えて生成する（詳細設 | 乖離（ルート名・パラメータ名の変更／要実機確認） | `ProductClassRepository.php:319, ProductController.php:1285` | RG-016 |  |
| m03-25 | 現行踏襲 | 乖離 | 重複の閾値は Excel 0204:L9382「同一商品コードの件数をカウントし複数件存在しないかチェック」＝2件以上（詳細設計 L304「2 件以上存在する規格」・L331「同一値が 2 行以上」も | 乖離（詳細設計の記述誤り・実装は正・要設計書修正） | `ProductClassRepository.php:311, ProductClassRepository.php:2915` | RG-004 |  |
| m03-26 | カスタマイズ | 乖離 | スマレジ連携対象カードの部門は NMは「PCシングル」それ以外「ショーケース品」（Excel 0204:L2505） | 乖離（オラクル内部矛盾・NM部門は到達不能） | `—` | RG-033 |  |
| m03-26 | カスタマイズ | 乖離 | CSVフォーマット列は詳細設計 L357／Excel 0204 の見出し集合（発送日目安はダミー列） | 乖離（設計書未記載の実装列）／軽微 | `CardCsvController.php:348` | RG-018,043 |  |
| m03-27 | カスタマイズ | 乖離 | 登録・更新時にスマレジサーバに通信しスマレジ商品コードの登録状況を確認、登録時重複エラー・更新時情報なしエラー（Excel 0204:L3210,L3211,L3212） | 乖離疑義（サーバ通信による事前確認の実装到達が不明）／要実機確認 | `ProductGoodsImportHandler.php:604` | RG-013,RG-014 |  |
| m03-27 | カスタマイズ | 乖離 | 発送日目安(ID) は列定義・検証を持つ現行踏襲列 | 乖離（現行踏襲列がサイレントに欠落・詳細設計も追認）／要実機確認 | `ProductGoodsImportHandler.php:112` | RG-029 |  |
| m03-28 | 現行踏襲 | 乖離 | 商品実在チェックは現行踏襲＝削除済み商品を対象外にする（現行 `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductT | 乖離（現行踏襲差・設計了解済みだが対象商品範囲が拡大／Excelは沈黙）／要実機確認 | `ProductRepository.php:1459` | RG-025,020 |  |
| m03-28 | 現行踏襲 | 乖離 | 取込後の応答は現行踏襲＝同一画面の再描画（PRGなし。現行 `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvC | 乖離（現行踏襲差・エラー表示位置と再送信挙動およびログ/フラッシュ文言が変化）／要実機確認 | `ProductTagCsvController.php:124` | RG-015,030,045,046 |  |
| m03-28 | 現行踏襲 | 乖離 | 大量行取込のタイムアウト回避は現行踏襲＝`set_time_limit(0)`（現行 `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Produc | 乖離（現行踏襲違反・上限直下の大量取込がタイムアウトし得る）／要実機確認 | `ProductTagCsvController.php:111` | RG-018,023 |  |
| m03-29 | 現行踏襲 | 乖離 | 支店システムへの商品更新通知は現行踏襲＝取込成功時に実施する。現行は取込成功時に `$this->em->commit()` のうえ `BranchUpdateService::noticeProdu | 乖離（現行踏襲違反・支店連携の欠落＝CSV経由のタグ更新が支店側へ伝播しない）／要実機確認 | `ProductTagSalesAnalysisUpdateImportHandler.php:49` | RG-067 |  |
| m03-29 | 現行踏襲 | 乖離 | 商品存在チェックは現行踏襲＝削除済み商品を対象外とする。現行は `dtb_product p WHERE p.product_id = :productId AND p.del_flg = :delF | 乖離（現行踏襲差・スキーマ由来の意図的変更だがExcel/詳細設計に削除済み商品の扱いの記述なし）／要実機確認 | `ProductRepository.php:1459` | RG-032 |  |
| m03-29 | 現行踏襲 | 乖離 | 雛形ファイル名は現行踏襲。現行は `product_tag_sales_analysis_update.csv` を返す（`pf-eccube3/app/Plugin/HareruyaEc/Contr | 乖離（現行踏襲差・雛形ファイル名変更）／要実機確認 | `TagSalesAnalysisCsvController.php:50` | RG-018 |  |
| m03-29 | 現行踏襲 | 乖離 | 成功フラッシュ・ログ文言は現行踏襲。現行の成功メッセージキーは `admin.product.csv_import.save.complete`、ログは「売上分析タグ更新 正常終了」「売上分析タグ更新 | 乖離（現行踏襲差・メッセージキー/ログ文言変更）／要実機確認 | `TagSalesAnalysisCsvController.php:141` | RG-038,RG-041,RG-042 |  |
| m03-29 | 現行踏襲 | 乖離 | 取込POST後の応答とエラー提示は現行踏襲。現行はリダイレクトせず同一アクションでアップロード画面テンプレートを再描画し（HTTP 200）、インポータのエラー配列を `$result->getErr | 乖離（現行踏襲差・PRG化とエラー提示形式の変更）／要実機確認 | `TagSalesAnalysisCsvController.php:124` | RG-041,RG-051 |  |
| m03-29 | 現行踏襲 | 乖離 | 実行時間制限は現行踏襲＝取込前にタイムアウトを無効化する。現行は `csvProductTagSalesAnalysisUpdateUpload` の冒頭でコメント「// タイムアウトを無効にする」と | 乖離（現行踏襲違反・大量CSVでのタイムアウトリスク）／要実機確認 | `TagSalesAnalysisCsvController.php:111` | RG-050 |  |
| m03-30 | カスタマイズ | 乖離 | セールフラグ無効(通常)時は販売価格を CSV 基準価格へ更新（Excel `0204:L10047`）／有効時は販売価格を保持（Excel `0204:L10052`）。分岐は「現在登録済セールフラ | 乖離（セール区分の販売価格ロジック差・カスタマイズ未達） | `ProductPriceImportHandler.php:327` | RG-001,002 |  |
| m03-30 | カスタマイズ | 乖離 | CSVアップロード実行による価格登録/更新のタイミングでスマレジAPIを呼び出し価格情報を連携（Excel `0204:L10038`）、条件を満たす場合のみ連携（`0204:L10031,L1003 | 乖離疑義（同期呼び出し vs 遅延連携・実機再現で確定） | `ProductPriceImportHandler.php:399` | RG-008 |  |
| m03-31 | 現行踏襲 | 乖離 | 取込が成功した場合、トランザクションを確定したうえで支店システムへ取込対象の商品更新を通知する（詳細設計 `function_spec_html_preview/pf-eccube3/m03-31_a | 乖離（機能欠落・移植漏れ）／要実機確認 | `ProductPriceImportHandler.php:87` | RG-042 |  |
| m03-31 | 現行踏襲 | 乖離 | アップロード画面と取込は同一パス `{admin_route}/product/product_price_csv_upload` の GET/POST で、結果は同一画面を再表示する（詳細設計 `… | 乖離（入口URL・レスポンス方式・エラー表示形態の差）／要実機確認 | `ProductPriceCsvController.php:75` | RG-001,013,014,019,020,038 |  |
| m03-31 | 現行踏襲 | 乖離 | セールフラグは任意列（未指定は0として扱う）（詳細設計 `…m03-31_admin_product_product_sale_price_csv_import.html:339,342`／Excel | 乖離（必須/任意の差）／要実機確認 | `ProductPriceCsvController.php:213` | RG-002,021（DV-06） |  |
| m03-31 | 現行踏襲 | 乖離 | Excel は「販売価格を、CSVに設定されている販売価格に更新する」（0204:L10240,L10247）とし、割引率適用は詳細設計 L342 が「基準販売価格に規格の割引率を適用して規格ごとの販 | 設計未確定＋乖離候補／要実機確認 | `ProductPriceImportHandler.php:359` | RG-022,023,024,030 |  |
| m03-31 | 現行踏襲 | 乖離 | 帯URLは規格の帯URLとして反映し空はNULL（詳細設計 `…m03-31_admin_product_product_sale_price_csv_import.html:339,342`）。現行 | 乖離候補（現行踏襲の入力チェック消失）／要実機確認 | `ColumnDefinitions.php:401` | DV-12（要判定） |  |
| m03-32 | カスタマイズ | 乖離 | Excel CSVフォーマット 識別ID2「基準価格」の「最大文字数 または最大値」＝11（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:11482`・書 | 乖離（Excel規定値と実装上限の不一致・Excel記載自体も桁/値が曖昧）／要実機確認・Excel記載の確認要 | `ColumnDefinitions.php:434` | RG-022（§3 DV-03,DV-04） |  |
| m03-32 | カスタマイズ | 乖離 | Excel CSVフォーマット 識別ID1「商品コード」の「最大文字数」＝11（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:11481`・書式=文字型・ | 乖離（Excel規定の最大文字数が未強制）／要実機確認 | `ColumnDefinitions.php:58, ProductClass.php:184` | RG-023（§3 DV-11） |  |
| m03-32 | カスタマイズ | 乖離 | Excel「セール中商品の販売価格は変更できない旨(アラート)を画面上に表示する」（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:11302`・`:115 | 乖離（Excel要求の表示手段が確定できず・未参照フラグの残置）／要実機確認 | `ProductSimpleHighPriceCsvController.php:101, SimpleHighPriceImportHandler.php:85, ProductSimpleHighPriceCsvController.php:155` | RG-010 |  |
| m03-32 | カスタマイズ | 乖離 | Excel は更新対象を「高額商品」の規格と規定する（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:11247`・`:11278`「高額商品用に価格変更を | 乖離（詳細設計・文言が謳う公開状態の絞り込みが実装に不在）／要実機確認 | `ProductClassRepository.php:2208, messages.ja.yaml:2002` | RG-038 |  |
| m03-34 | 現行踏襲 | 乖離 | 行の更新は「既存行の全カラム相当値を配列に複写し、`discount_id` だけを CSV の値に差し替える。`buy_discount_id` や名称系など他列は既存値のままとする」（`funct | 乖離（他列不変の原則違反・意図しない販売制限緩和）／要実機確認（既存NULL行の実在有無と業務影響） | `DtbProductSubRepository.php:208, ProductDiscountImportHandler.php:204, MtbRegionRestriction.php:12` | RG-017,019 |  |
| m03-35 | カスタマイズ | 乖離 | 取込結果の画面挙動は Excel が明示せず、詳細設計が補完＝成功・失敗いずれも `GET …/product/section/csv_upload` へリダイレクト（PRG）しフラッシュで結果表示（ | 乖離（現行差・PRG化。機能区分カスタマイズのため意図的変更の可能性あり）／要実機確認 | `ProductCsvController.php:826, ProductSectionCsvController.php:126` | RG-031 |  |
| m03-35 | カスタマイズ | 乖離 | 「レコード数上限チェックを実施。5010件以上はエラーとする」（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:12125`）＝レコード数での判定 | 乖離（上限判定の語義差・境界±1／現行の外部コマンド実行は要セキュリティ確認）／要実機確認 | `AbstractController.php:364, ProductCsvController.php:391, ProductCsvController.php:838` | RG-010（DV-02,DV-03,DV-13） |  |
| m03-36 | 現行踏襲 | その他 | 買取減額率変更CSV取込は移行先 ec-cube-enterprise でも利用できる想定で DBは enterprise を正とする（L306,L309,L360「移行先にも存在」）。CSV取込のP | ProductBuyDiscountImport | `ProductCsvController.php:1486, ProductBuyDiscountImportHandler.php:1` | product_buy_discount_csv_uploa |  |
| m03-36 | 現行踏襲 | 乖離 | 商品は存在するが補助表 dtb_product_sub に行が無い場合、getProductSubByProductId が null を返すと取得結果へのメソッド呼び出しで実行時例外となりうる。トラ | 乖離（現行実装バグ・設計が明記） | `DtbProductSubRepository.php:69, ProductBuyDiscountImportHandler.php:176` | RG-018 |  |
| m03-37 | 現行踏襲 | 乖離 | 正本詳細設計は M03-37「略称タグ更新CSV登録」を記述すべき。Excel M03-37 は 商品の略称タグ更新をCSVで行う機能（0204:L12433）で、CSV列は 商品ID／略称タグ（02 | 乖離（設計書の主題取り違え・M03-37の正本欠落）／最優先で設計是正が必要 | `ProductServiceProvider.php:178, ProductCsvController.php:1331` | RG-001,002,010,011〜015,020,024 |  |
| m03-37 | 現行踏襲 | 乖離 | レコード数上限チェックを実施し、5010件以上はエラーとする（0204:L12468） | 乖離（詳細設計の記述欠落＋境界定義の曖昧）／要実機確認 | `ProductCsvController.php:391` | RG-003, DV-01〜03,07 |  |
| m03-37 | 現行踏襲 | 乖離 | インポート成功した商品IDを記し重複を避ける（0204:L12470） | 乖離（設計文言の曖昧・重複抑止対象が不明確）／要実機確認 | `StorageCodeImportHandler.php:262` | RG-004 |  |
| m03-37 | 現行踏襲 | 乖離 | 副作用・外部連携はExcel処理概要（0204:L12468-12470）および正本の入出力・API/バッチ節（L350,L353）が正 | 乖離（副作用・外部連携の設計欠落／正本の否定文と実装が不整合）／要実機確認 | `StorageCodeImportHandler.php:60` | RG-029,020 |  |
| m03-37 | 現行踏襲 | 乖離 | 商品ID不存在・略称タグ未登録時の扱いは設計（Excel／正本）が規定すべき | 乖離（エラー処理の設計欠落・全体中断が未記載）／要実機確認 | `StorageCodeImportHandler.php:144` | DV-08,09 |  |
| m03-38 | カスタマイズ | その他 | 「レコード数上限チェックを実施。5010件以上はエラーとする」（Excel `…0204_基本設計仕様書(商品管理).html:4808`） | \n | `AbstractController.php:369` | \r\n |  |
| m03-40 | 現行踏襲 | 乖離 | CSV 2列目は棚番号名称（文字型・入力例 `S-002`／Excel `excel_to_html/output/0204_基本設計仕様書(商品管理).html:12996`）。現行も名称一致で解決 | 乖離（詳細設計の記述誤り＝設計書バグ）／要実機確認 | `—` | RG-019,021,DV-07 |  |
| m03-40 | 現行踏襲 | 乖離 | 商品コードの存在判定条件は Excel が「商品IDで商品情報の棚番号を更新する」（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:12818`）としか規定 | 乖離（現行踏襲差・抽出条件の緩和）／要実機確認 | `ProductClassRepository.php:2153` | RG-017,018 |  |
| m03-40 | 現行踏襲 | 乖離 | 取込完了（成功・失敗いずれも）は `GET …/product/product_shelf_number_csv_import` へリダイレクト＝PRG（詳細設計 `function_spec_htm | 乖離（現行踏襲差・PRG化）／要実機確認 | `ProductCsvController.php:1435, ProductShelfNumberCsvController.php:128` | RG-025,RG-013,RG-020 |  |
| m03-40 | 現行踏襲 | 乖離 | 成功時のフラッシュキーは `admin.register.complete`（詳細設計 `function_spec_html_preview/pf-eccube3/m03-40_admin_prod | 乖離（現行踏襲差・メッセージキー変更）／要実機確認 | `ProductCsvController.php:1459, ProductShelfNumberCsvController.php:166` | RG-006 |  |
| m03-40 | 現行踏襲 | 乖離 | 雛形ファイル名は `product_shelf_number_template.csv`（詳細設計 `function_spec_html_preview/pf-eccube3/m03-40_admi | 乖離（現行踏襲差・雛形名/見出しの変更）／要実機確認 | `ProductCsvController.php:499, ProductShelfNumberCsvController.php:57` | RG-005,RG-002 |  |
| m03-41 | カスタマイズ | 乖離 | M03-41「カテゴリ登録CSVアップロード」画面は 12列フォーマット（`0204:L13361-13375`）と、件数の単一選択（10/50/100/300/500/1000/2000/10000 | 乖離（設計書の機能帰属誤り／M03-41の実体URL不定）／要実機確認 | `CsvImportController.php:673, CategoryCsvController.php:72` | RG-004,005,006,003 |  |
| m03-41 | カスタマイズ | 乖離 | 雛形ファイルダウンロードで「登録CSVの雛形」がダウンロードされる（`0204:L13188`）。雛形の列は M03-41 のフォーマット＝12列（`0204:L13361`） | 乖離（雛形の列構成・ファイル名差）／要実機確認 | `CsvImportController.php:1212, CategoryCsvController.php:62` | RG-007 |  |
| m03-41 | カスタマイズ | 乖離 | Excel フォーマット表の CSV列は識別ID 1〜12 であり、「削除フラグ」列は存在しない（`0204:L13361-13375`）＝CSVによるカテゴリ削除は Excel の規定範囲外 | 乖離（削除フラグ列の有無差・機能範囲不定）／要実機確認 | `CsvImportController.php:736, CategoryCsvController.php:188` | RG-038 |  |
| m03-41 | カスタマイズ | 乖離 | カテゴリ名(日)・カテゴリ名(英) の最大文字数は 128（`0204:L13366,L13367`） | 乖離（最大長の未検証・Excel規定との矛盾）／要実機確認 | `CategoryCsvImportHandler.php:37` | RG-018(DV-08,09,11,12),DV-33 |  |
| m03-41 | カスタマイズ | 乖離 | 「階層」列は登録処理ではCSVの値を使用しない。新規・更新とも親カテゴリIDから算出（親0→1、親1以上→親の階層+1）する（`0204:L13369,L13167,L13170,L13394,L13 | 乖離（階層のCSV値採用＝Excelカスタマイズ規定違反）／要実機確認 | `CsvImportController.php:799, CategoryCsvImportHandler.php:47` | RG-015,018(DV-31) |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` はDB関連を「実装確認値」として `dtb_product_class.standard_price / price02`・`dtb_csv_import_his |  | `MtbCsvImportType.php:28` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:308`/`:315` はプロセスフロー・例外処理を現行挙動として記述（アップロード→検証→登録→履歴） |  | `ProductSimpleHighPriceCsvController.php:50` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` は基準価格＝`standard_price`／販売価格＝`price02`／履歴＝`dtb_csv_import_history`（member_id記録）と断定 |  | `—` |  |  |
| m03-45 | カスタマイズ | 乖離 | 本機能はカテゴリの登録・更新・削除・並べ替えを行う（Excel 0204:L6005「★ 表示順入替ボタン(上下),編集ボタン、削除ボタンの追加」／詳細設計 `function_spec_html_p | 乖離（詳細設計の内部矛盾・偽OUT誘発）／設計書修正要 | `CategoryController.php:258` | RG-017,022,024,026,036〜038 |  |
| m03-45 | カスタマイズ | 乖離 | ルート直下一覧では「すべてのルートおよび深さ 5 段まで関連を結合順序付けで取得した TopCategories」を Twig へ渡す（詳細設計 `…m03-45_admin_product_prod | 乖離（詳細設計が旧実装を記述・DB負荷/件数依存の説明が誤り）／要実機確認 | `CategoryRepository.php:133, CategoryController.php:562` | RG-001,009 |  |
| m03-45 | カスタマイズ | 乖離 | 削除成功時は「sibling の `sort_no` を削除対象より大きいものから 1 減ずる更新を先にクエリ実行し、その後論理削除に相当する `remove`」（詳細設計 `…m03-45_admi | 乖離（設計記述の誤り・他階層の表示ランクが動く副作用が未記述）／要実機確認 | `CategoryRepository.php:396` | RG-036 |  |
| m03-45 | カスタマイズ | 乖離 | 画像は「検証済み作成フローのみ、アップロード可能ファイルをディスクへ移し、MIME が image で始まること、許可拡張子のみ、異常時はフォームエラーおよび移動済みファイルを取り除き再表示する」（詳 | 乖離（詳細設計が実装と別方式・未記載ルートあり）／要実機確認 | `CategoryController.php:294` | RG-032,055,DV-10〜12,14,15 |  |
| m03-45 | カスタマイズ | 乖離 | CSV は「`dtb_csv.field_name` が定数値 `target_product_count` のとき列を数値へ差し替え、それ以外は汎用のセル読取で埋める」（詳細設計 `…m03-45_ | 乖離（設計の記述漏れ・CSV取込との往復整合に影響）／要実機確認 | `CategoryController.php:784` | RG-041 |  |
| m03-45 | カスタマイズ | 乖離 | 並べ替えAjaxは「送信キー一覧がカテゴリ id と整合する整数か」を判定し、「異常入力の防御はリポジトリの find が null のとき未定義セットに落ちない前提を置く運用にある」（詳細設計 `… | 乖離（未検証の異常系・500の可能性）／要実機確認 | `CategoryController.php:726` | RG-017,019 |  |
| m03-45 | カスタマイズ | 乖離 | 並べ替えは「三点リーダー(ID:4)をドラッグ&ドロップで入れ替える」（Excel 0204:L6012＝ドラッグの起点を三点リーダー部品に限定）／画面部品は「三点リーダー(タテ)」（Excel 02 | 乖離（Excel指定のUI部品/操作起点の不履行・軽微）／要実機確認 | `category.twig:69, category.twig:426` | RG-011,007 |  |
| m03-45 | カスタマイズ | 乖離 | 上下の表示順入替ボタンは「表示順入替ボタン(上移動)(ID:6),表示順入替ボタン(上移動)(ID:7)で上下のカテゴリを入替える」（Excel 0204:L6014） | 乖離（Excel誤記・実装は妥当）／設計書修正要 | `category.twig:93` | RG-014,015 |  |
| m04-01 | 新規実装 | その他 | Excel 0202:L1315-1318 は入力上限（255文字）を規定するが超過時挙動の明示的否定文が正本に無い＝OUTにしない（ゲート規則2） |  | `—` | `要判定` |  |
| m04-01 | 新規実装 | その他 | M04-01 Excel に明示的否定文なし。検索条件は必須なし（Excel 0202:L1315-1343 の必須列=「-」）＝境界挙動は要実機確認 |  | `—` | `要判定` |  |
| m04-01 | 新規実装 | その他 | 本機能に該当I/Fなし（参照系管理画面。Excel M04-01 に該当記述なし） |  | `—` | `OUT` |  |
| m04-01 | 新規実装 | その他 | M04-01 Excel は入口のみ規定＝別範囲（対応機能/共通設計を正） |  | `—` | `OUT`（§0） |  |
| m04-01 | 新規実装 | その他 | 実装の実態（repo:file:line） |  | `—` | 設計（あるべき・オラクル＝M04-01 Excel） |  |
| m04-01 | 新規実装 | その他 | 未達: パラメータ無しの初回GETは検索を実行せず空一覧を返す。`ec-cube-enterprise:src/Eccube/Controller/Admin/Stock/StockListContr |  | `—` | 初期表示（デフォルト表示）は「メンバー管理で設定されているデ |  |
| m04-01 | 新規実装 | その他 | 乖離（店舗条件が保存に混入）: `ec-cube-enterprise:StockListController.php:338-340` は `$dataToStore = $viewData; un |  | `—` | 検索パターン保存時、**店舗は検索条件の保存に含めない**（ |  |
| m04-01 | 新規実装 | その他 | 軽微な乖離（docblock不一致・ソートキー要確認）: `ec-cube-enterprise:src/Eccube/Repository/ProductStockRepository.php:31 |  | `—` | 一覧の表示順はID降順（Excel 0202:L1709） |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2526 は「合計総原価増減数を総原価増減数で登録」、L2533 は「変更前総原価は計算表示のためここでは登録しない」。詳細設計L312 は承認一覧に「変更前総原価」と記載 |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2503,L2597「廃棄区分は入力不可・値が入っていた場合は値を削除する」。詳細設計L310は「JS/Twig制御。サーバは廃棄時の仕入単価を計算に使用しない」 |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2497「入庫承認待ち在庫情報は承認状態が『却下』以外の情報を表示する」。詳細設計L304は「未承認の入庫」 |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | 詳細設計L317「その他例外は HTTP 500」「成功は success=true と表示用整形理由をJSONで返す」 |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2595「65535byte」。詳細設計L307「Length(max=eccube_product_stock_change_reason_max_len)」 |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2481,L2597「在庫追加(入庫)時は原価を必須入力」。詳細設計L307は「仕入単価 任意」・相関一覧L309にbe_stocked_required記載なし |  | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excelは後追い理由編集(0202:L2606)のみ規定しXHR/HTTPステータス/対象IDパラメータ名には沈黙。詳細設計L315,L316,L317が実装を正と明示 |  | `—` |  |  |
| m04-03 | カスタマイズ | 乖離 | 在庫増減数 2-12 は範囲 -99999999〜99999999（両符号可・Excel 0202:L2941） | 乖離（Excel未規定の追加制約・要実機確認） | `StockBulkApprovalType.php:149` | RG-013 |  |
| m04-05 | 現行踏襲 | 乖離 | エンドポイントは現行踏襲＝`GET/POST /{admin_route}/custom_csv/export/{csvExtensionId}`（Excel 0202:L3417／HTML L316 | 乖離（現行踏襲違反・エンドポイント路線変更/POST廃止/書式制約追加）／要実機確認 | `StockListController.php:275` | RG-017,025,DV-04 |  |
| m04-05 | 現行踏襲 | 乖離 | 「在庫情報カスタムCSV出力(現行踏襲)」（HTML L296「確認値はpf-eccube3 HareruyaEcプラグインの管理画面カスタムCSV出力処理を正とする」） | 乖離（現行踏襲の前提破綻・現行に在庫CSV種別/分岐が存在しない）／要実機確認 | `CustomExportCsvController.php:24, CsvType.php:15, CsvType.php:77` | RG-001,003,006 |  |
| m04-05 | 現行踏襲 | 乖離 | エラー処理は現行踏襲＝「カスタムCSVが存在しない場合404」のみ（Excel 0202:L3457／HTML L324,L356）。現行 `CustomExportCsvController::in | 乖離（設計沈黙部の実装追加条件）／要実機確認 | `StockListController.php:287` | RG-024,DV-03 |  |
| m04-05 | 現行踏襲 | 乖離 | 「在庫一覧の検索条件を適用した結果をCSVとして出力する」（Excel 0202:L3379／HTML L347）。事前検索が無い場合の分岐は設計沈黙 | 乖離（設計沈黙部の実装追加前提・要事前検索リダイレクト）／要実機確認 | `StockListController.php:278` | RG-027 |  |
| m04-05 | 現行踏襲 | 乖離 | ダウンロードファイル名・Content-Type は設計沈黙（HTML L320「CSVファイルのダウンロード」のみ）。現行 pf-eccube3 は種別別 prefix（`product_`/`or | 乖離（設計未規定・実装依存のファイル名/形式差）／要実機確認・参考 | `StockCustomCsvExportService.php:59` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | メモ（在庫移動・振替メモ）は「全角・半角 最大65535byte」（Excel 0202:L5037,L6465） | 乖離（上限未強制）／要実機確認 | `StockMoveNewType.php:75, StockTransferNewType.php:45` | RG-019,030（§5 文字列長=要判定） |  |
| m04-09 | 新規実装 | 乖離 | 移動点数・振替点数の最大値は1000000（Excel 0202:L5031,L6462） | 乖離疑義（上限値の一致 要実機確認） | `StockMoveQuantityType.php:40, StockTransferNewDetailType.php:41` | RG-004,024（DV-04＝件数外） |  |
| m04-09 | 新規実装 | 乖離 | 振替後商品コードが存在しない商品の場合はエラー（Excel 0202:L6382）＝画面上に該当エラーを案内 | 乖離（項目別エラーの汎用化）／要実機確認 | `StockTransferStoreAction.php:91` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | 在庫振替ステータス一覧の数値IDは 振替承認待ち=7／入庫完了=8／却下=9（Excel 0202:L6635-6637。L6636/L6637は「在庫移動と共通ステータス」と明記） | 乖離（ステータス数値IDがExcel L6635-6637 vs 実装 L327 で不一致）／要実機確認 | `MtbStockMoveTransferStatus.php:29` | RG-014,021（SEED §2 ステータスマスタ） |  |
| m04-10 | 新規実装 | 乖離 | 出庫日は移動タイプ（移動/振替）で起点ステータスが異なる（移動＝移動中／振替＝出庫承認済み）（0202:L7066） | 乖離（移動/振替の起点分岐が実装に存在しない）／要実機確認 | `StockMoveTransferListCsvExportService.php:171` | RG-020 |  |
| m04-11 | 現行踏襲 | 乖離 | 出力対象は検索条件に合致する在庫変更履歴（移動・振替）（正本 L326） | 乖離疑義（移動・振替限定 未強制）／要実機確認 | `HistoryController.php:107, DtbStockHistoryRepository.php:175` | RG-002,003 |  |
| m04-12 | 新規実装 | 乖離 | 検索条件クリア(3-7)は「押下すると3-1〜3-4の内容を空にする」＝詳細検索の一部項目のみクリア（Excel 0202:L7458） | 乖離（クリア範囲の差）／要実機確認 | `StockSplitJoinController.php:96` | RG-014 |  |
| m04-12 | 新規実装 | 乖離 | 商品名(2-2)の検索（Excel 0202:L7445）。※Excel部品表は2-2の書式を「数値」と記載（L7445） | 乖離（Excel書式記載の矛盾・要Excel修正／実装は文字列一致） | `DtbStockSplitJoinRepository.php:257` | RG-004 |  |
| m04-13 | 新規実装 | その他 | 欠品点数は1～1,000,000（最小1・固定上限100万）（Excel 0202:L9052 の7-18） |  | `—` |  |  |
| m04-13 | 新規実装 | その他 | 分割数は数値1～99999999（Excel 0202:L7897 の2-10） |  | `StockSplitRegisterAction.php:81` |  |  |
| m04-13 | 新規実装 | その他 | Excelは「検品CSV出力/登録」（Excel 0202:L8985,L9009系） |  | `—` |  |  |
| m04-16 | 現行踏襲 | 乖離 | 現行と異なり専用画面/コンソールではなく在庫一覧の「在庫リコメンドCSV出力」ボタンから出力する（Excel★ 0202:L9845,L9846）。詳細設計HTML L296/L315/L345 は「 | 乖離（詳細設計HTMLの起動形態記述が陳腐化・実装はExcel★どおり✓） | `StockListController.php:248, stock_list_index.twig:441` | RG-013,018 |  |
| m04-16 | 現行踏襲 | 乖離 | 一週前在庫～月間入庫数は店舗ごとにECCUBE・スマレジを合算（Excel 0202:L9842,L9852） | 乖離疑義（販売/入庫の合算方式・要実機確認） | `StockRecommendCsvExportService.php:140` | RG-009,005 |  |
| m04-16 | 現行踏襲 | 乖離 | （Excel/HTML沈黙）検索条件セッションが空の場合の期待は不明 | 乖離疑義（オラクル未規定・要実機確認） | `StockListController.php:252` | §5 要判定 |  |
| m04-16 | 現行踏襲 | 乖離 | （Excel沈黙）出力ファイルの上書き挙動。HTML L326（旧コンソール）は「既存があれば上書きする」 | 乖離（起動形態差に伴う上書き非該当・要実機確認） | `StockRecommendCsvExportService.php:63` | §5 要判定 |  |
| m04-16 | 現行踏襲 | 乖離 | UI起点化に伴い管理画面の共通認証下で実行（Excel★ 0202:L9845）。HTML L345（旧コンソール）は「ブラウザ経由の権限制御を持たない」 | 乖離（詳細設計HTMLの権限節が陳腐化・実装は管理画面認証下✓） | `StockListController.php:248` | RG-018 |  |
| m04-17 | カスタマイズ | 乖離 | Excel M04-17 は在庫履歴のみを対象とする新カスタマイズ画面（多数の検索項目・在庫履歴専用ルート・Excel 0202:L10015,L10016） | 乖離（詳細設計HTMLが旧画面・Excelが新画面）／本書はExcelを正 | `HistoryController.php:45, StockHistoryController.php:64` | 全般(§1前提) |  |
| m04-17 | カスタマイズ | 乖離 | Foil(2-11)は検索条件として在庫変動履歴の商品規格カード情報より参照し絞り込む（Excel 0202:L10079,L10080） | 乖離（Foil絞り込み未適用） | `StockHistoryType.php:175, DtbStockHistoryRepository.php:96` | RG-007 |  |
| m04-17 | カスタマイズ | 乖離 | from>to相関エラーは 登録日/在庫数/在庫増減数/変更時販売価格/仕入単価/変更後原価単価/原価率/承認日/最終更新日 の9対で発生しエラーとし検索を行わない（Excel 0202:L10069 | 乖離（相関from>toチェック4項目欠落） | `StockHistoryType.php:486` | RG-030(DV-05,07,08,09) |  |
| m04-18 | カスタマイズ | 乖離 | 該当0件はヘッダ行のみのCSVを正常出力（詳細設計 L342,L370「該当0件→ヘッダ行のみのCSVを正常に出力する」） | 乖離（0件時にエラーで、ヘッダ行のみ正常出力が未達） | `StockHistoryCsv.php:55, StockHistoryController.php:315` | RG-010 |  |
| m04-18 | カスタマイズ | 乖離 | 識別ID7 在庫区分 を追加（★カスタマイズ・Excel 0202:L10690） | 乖離（列名/意味相違・要設計確認） | `StockHistoryController.php:389, StockHistoryCsv.php:106` | RG-005 |  |
| m04-18 | カスタマイズ | 乖離 | 本機能は照会・出力のみで業務監査ログを追加しない（詳細設計 L373） | 乖離（設計は監査ログ追加なしだが実装はlog_info出力）／軽微 | `StockHistoryCsv.php:78` | RG-019 |  |
| m04-19 | カスタマイズ | 乖離 | 検索対象は在庫変動履歴のうち理由区分「廃棄」（親）・「欠品減算（受注）」・「欠品減算（移動）」（子）を横断抽出（Excel 0202:L10871） | 乖離（カスタマイズ未達・対象範囲差） | `DtbStockoutHistoryRepository.php:40` | RG-005 |  |
| m04-19 | カスタマイズ | 乖離 | 入庫承認待ち在庫情報は一覧に表示しない（Excel 0202:L10872） | 乖離疑義（要実機確認） | `DtbStockoutHistoryRepository.php:64` | RG-006 |  |
| m04-19 | カスタマイズ | 乖離 | 在庫変動履歴の検索で「欠品履歴一覧を表示」を選択した場合に表示（Excel 0202:L10878） | 乖離（入口/導線差） | `ProductServiceProvider.php:236` | RG-007 |  |
| m04-19 | カスタマイズ | 乖離 | 表示件数の初期値は50件（Excel 0202:L10897・EC-CUBE標準の最大ページ表示の選択肢） | 乖離疑義（既定値・要実機確認） | `SearchControllerTrait.php:70` | RG-016 |  |
| m04-19 | カスタマイズ | その他 | 欠品登録時に総在庫を減らす処理（※総原価は変えない）（Excel 0202:L10866,L10867 カスタマイズ要件） | 所在記録（本機能対象外・要別機能検証） | `EditController.php:468` | （§0 対象外） |  |
| m04-20 | 新規実装 | 乖離 | CSV列7＝「在庫区分」（EC-CUBE在庫／スマレジ在庫の区分）（Excel 0202:L11102,L11127） | 乖離（列名/粒度違い） | `StockHistoryController.php:447, StockHistoryDisposalCsv.php:106` | RG-001,003 |  |
| m04-20 | 新規実装 | 乖離 | CSV列9＝「登録元ID」を出力（Excel 0202:L11104,L11129） | 乖離（出力列欠落・射影で脱落） | `StockHistoryController.php:440, StockHistoryDisposalCsv.php:108, StockHistoryDisposalCsv.php:65` | RG-001,006 |  |
| m04-20 | 新規実装 | 乖離 | 出力対象は「在庫履歴検索一覧(検索入力)の検索条件でデータを取得」（Excel 0202:L11122） | 乖離（取得方式・要実機確認） | `StockHistoryController.php:337, DtbStockHistoryRepository.php:404` | RG-004 |  |
| m04-20 | 新規実装 | 乖離 | CSV行順は「一覧表示されている順番と同じ順」（Excel 0202:L11123）。具体ソートキーは Excel M04-20 非記載（別シート参照 0202:L11124） | 要実機確認（乖離ではない） | `DtbStockHistoryRepository.php:411` | RG-005 |  |
| m04-21 | カスタマイズ | 乖離 | 件数上限は10000件、それ以上でエラー（Excel 0202:L11468） | 乖離（上限値5010≠10000） | `ProductCsvController.php:391` | RG-018 |  |
| m04-22 | 新規実装 | 乖離 | 1ファイル登録上限は移動10,000件・振替2,000件（Excel `0202:L11781`,`0202:L12122`） | 乖離（上限値不一致・両方向にズレ） | `AbstractController.php:364, StockMoveTransferController.php:252` | RG-009,023 |  |
| m04-22 | 新規実装 | 乖離 | 1-4 承認通知先（メンバー選択）は必須（○）（Excel `0202:L12140`） | 乖離（必須が任意になっている） | `StockTransferCsvImportType.php:88` | RG-019 |  |
| m04-22 | 新規実装 | 乖離 | アップロードされたファイルがcsv以外の場合はエラー（Excel `0202:L11777`,`0202:L12119`） | 乖離疑義（拡張子検証なし・間接排除）／要実機確認 | `StockMoveCsvImportType.php:115, StockTransferCsvImportType.php:105` | RG-007,021 |  |
| m04-24 | 新規実装 | 乖離 | エラーがある場合、登録処理を終了する（Excel 0202:L13363＝全件不成立） | 乖離（原子性未達・部分コミット） | `StockMoveInstructionCsvImportHandler.php:83, StockMoveInstructionController.php:392` | RG-030 |  |
| m04-24 | 新規実装 | その他 | CSRFトークン検証機構は Excel M04-24 沈黙＝共通機構（期待は要実機確認・RG-034） | 実装確認（オラクル外） | `—` | RG-034 |  |
| m04-24 | 新規実装 | 乖離 | 送状No.変更時の未入力（空白のみ）での更新は許可しない（Excel 在庫移動指示詳細シート／M04-24 関連） | 乖離（詳細画面側・参考） | `StockMoveInstructionDetailType.php:34` | 対象外(詳細=M04-25) |  |
| m04-25 | 新規実装 | その他 | Excel M04-25 は 2026/1/27 に「在庫移動指示リストエクスポート」→「在庫移動指示詳細」へ改名（索引 0202:L1021）、シート内容は在庫移動指示詳細画面（送状No./備考/登 | 機能スコープ整理（送り状CSV=M04-28／雛形=M04-27 廃止）＝M04-25 の設計未記載ではない。本書 §0 対象外 | `StockMoveInstructionController.php:317` | §0（旧 RG-023〜033） |  |
| m04-25 | 新規実装 | 乖離 | 詳細設計HTML L293/L310 は雛形CSVの取込先を「M04-24 のCSV登録（`StockMoveInstructionCsvImportHandler`）」と記述。L318 は詳細画面を | 乖離（詳細設計HTMLの機能ID誤記） | `StockMoveInstructionController.php:367` | RG-005（雛形取込先は §0 対象外） |  |
| m04-25 | 新規実装 | 乖離 | Excel 内で削除可能条件が矛盾: 機能仕様 0202:L13929「発送済みでないかつ送状No未登録」 vs 識別ID1-16 0202:L13955「出庫待ち状態の場合のみ削除可能」 | オラクル内矛盾＋実装乖離（要実機確認） | `—` | RG-015 |  |
| m04-25 | 新規実装 | 乖離 | Excel 0202:L13906「在庫移動指示検索画面で送状No.を登録」・L13907「送状No.の変更はこの画面（詳細）からのみ可能」＝登録は検索画面／変更は詳細画面 | 乖離疑義（設計 vs 実装の画面帰属差・要実機確認） | `StockMoveInstructionController.php:228` | RG-005 |  |
| m04-25 | 新規実装 | 乖離 | 実績入力用CSV雛形DL（M04-27 在庫移動実績入力用CSV出力）は Excel 索引 0202:L1023 で 2026/1/29『廃止と打ち合わせで決まった』＝廃止設計（DLさせるほどの項目数 | 乖離（廃止設計 vs 実装存置）。期待には使わない（廃止=§0 対象外） | `StockMoveInstructionController.php:334` | §0（旧 RG-031〜033） |  |
| m04-28 | 新規実装 | 乖離 | 識別ID1 の項目名は「オーダーID」（0202:L14475）。識別ID2〜23 の項目名（注文金額合計／注文者氏名…／発送方法）は実装ヘッダーと一致 | 乖離（第1列ヘッダー文言差・受注送り状に寄せた意図的変更の可能性）。ゆうプリR取込時に列名解決へ影響しないか要実機確認 | `StockMoveInstructionLabelCsvExporterService.php:33` | RG-001 |  |
| m04-28 | 新規実装 | 乖離 | 「ゆうプリRが取り込めるフォーマットで出力」（0202:L14505）。文字コード・区切り・囲みの具体はExcel未規定 | 乖離疑義（ゆうプリR互換要件がExcel/実装いずれにも定量記載なく、取込互換は要実機確認） | `—` | RG-006,013 |  |
| m04-31 | カスタマイズ | 乖離 | 棚卸名の重複は「同じ棚卸名の別計画が既に存在するとき」登録・更新を不可とする（L344・自己の計画は重複にならない前提） | 乖離（現行バグ・enterpriseで是正）／要実機確認 | `InventoryPlanType.php:31, InventoryPlanType.php:144` | RG-012,007 |  |
| m04-31 | カスタマイズ | 乖離 | 棚卸名は必須（L346「必須」） | 乖離（必須のサーバ検証欠落・設計内部齟齬）／要実機確認 | `InventoryPlanType.php:26, InventoryPlanType.php:59` | RG-015,DV-05 |  |
| m04-31 | カスタマイズ | 乖離 | 備考は移行先で桁数制限が緩和される（L321「memo はテキスト型・固定上限なし」） | 乖離（設計記述の誤解誘発・実効上限は不変） | `InventoryPlanType.php:44` | RG-014,DV-04 |  |
| m04-34 | 新規実装 | 乖離 | Excelは閾値内並び順を論理順で明示: 言語(日→英→他言語)(0202:L16855)・状態(NM→HP)(0202:L16856)・レアリティ(M→C)(0202:L16859) | 乖離疑義（マスタ整備依存・要実機確認） | `DtbStockMoveTransferRepository.php:244` | RG-008,009,012 |  |
| m04-34 | 新規実装 | 乖離 | Excelは棚番号を「本店のみ」表示・棚番昇順（支店はソートしない）と規定（0202:L16875,L16854）。備考は本店を3F/2F/B2Fの複数フロアとして記す（0202:L16831,L16 | 乖離疑義（本店複数フロアモデルとの不整合・要実機確認） | `RestockListCsvRowFormatter.php:78, DtbStockMoveTransferRepository.php:242` | RG-007,023 |  |
| m04-34 | 新規実装 | その他 | 在庫移動戻しリスト機能のExcel ★取得行 L16849 は主語を「一覧画面で選択された買取情報に紐づく実在庫情報を…取得」と記す。しかし本機能L16830は「選択された在庫移動データを元に…」と規 | オラクル内部矛盾（Excel誤記・逐語引用+L16830で裏取り） | `—` | RG-001 |  |
| m05-02 | カスタマイズ | 乖離 | 受注CSVダウンロードは `GET /{admin_route}/order/export/order`（ルート名 `admin_order_export_order`）で受注検索セッション条件のCS | 乖離（ルート衝突・要実機確認：解決順） | `OrderController.php:385, OrderCsvController.php:193, index.twig:1089` | RG-001,013,018,019 |  |
| m05-03 | カスタマイズ | 乖離 | 非会員である場合、お名前(姓)に「非会員」と表現する（Excel 0203:L2450,L2524 ★カスタマイズ項目・出力表示ルール） | 乖離（カスタマイズ未達・出力側で非会員置換なし）／要実機確認 | `CsvExportService.php:410, SmaregiOrderFactory.php:49` | RG-006 |  |
| m05-03 | カスタマイズ | 乖離 | 拡張に列が1件も紐付いていないとき、ヘッダ出力でロジック例外を送出しストリームは正常終了しない（詳細設計L326,L374）。失敗時はフレームワークのエラーハンドリングに委ねる（詳細設計L353） | 乖離（エラー処理の実挙動が設計の含意と不一致・破損DL）／要実機確認 | `CustomExportCsvController.php:87, CsvExportService.php:162` | RG-014, DDT DE-03 |  |
| m05-03 | カスタマイズ | 乖離 | 受注に配送が1件も無いとき、配送列は値が空になるかPHPの通知・例外が起きうる（詳細設計L396） | 乖離（配送0件で致命例外・防御なし）／要実機確認 | `CsvExportService.php:413` | RG-024 |  |
| m05-04 | カスタマイズ | その他 | 出力列セットはExcel 90項目（0203:L2676-2765）。文字コード・BOM・区切り・MIME・ファイル名は所定フォーマット（詳細設計 L321,L328,L340） | 要データ確認（コードバグではない・seedと設定に依存） | `CsvExportService.php:121, OrderController.php:474` | RG-001,005,012 |  |
| m05-04 | カスタマイズ | 乖離 | 配送CSV出力は配送用の出力処理（詳細設計 L387）。プラグイン介入点は配送CSV固有であることが自然 | 乖離（拡張ポイント不整合・詳細設計 L385 も「未使用であることをコードで確認した」と明記＝設計は既知） | `OrderController.php:462, EccubeEvents.php:175` | RG-002,014 |  |
| m05-04 | カスタマイズ | その他 | カスタマイズ説明の追加列は識別ID:3=お名前(姓)/14=住所3/83=店舗ID/84=取引ID/85=小計値引き割引区分/86=クーポン値引き/87=メモ/88=免税額（Excel 0203:L2 | Excel文書内不整合（実装バグでない・テスト時は項目表 0203:L2676-2765 の項目名を採用）／要業務確認 | `—` | RG-005 |  |
| m05-05 | カスタマイズ | 乖離 | エンコーディングが UTF-8 のとき先頭にBOMを付与する（＝単一BOM）（L404） | 乖離（実装バグ・二重BOM） | `CsvExportService.php:162, CsvExportService.php:184` | RG-012 |  |
| m05-05 | カスタマイズ | 乖離 | 非会員である場合、お名前(姓)に「非会員」と表現する（一般則。Excel 0203:L2925,L3021,L3025） | 乖離（一律非会員表示 未達） | `CsvExportService.php:215, SmaregiOrderFactory.php:49` | RG-016 |  |
| m05-06 | カスタマイズ | 乖離 | 件名（Excel 0203:L3215 の入力項目）。詳細設計 L331「フォームに Length 制約は無い」「マスタ側 mail_subject 列は255だが入力値の検証はこのフォームでは255 | 乖離疑義（フォーム未検証×DB上限・要実機確認） | `OrderManualMailAllType.php:56, MailHistory.php:53` | RG-016,028 |  |
| m05-07 | 現行踏襲 | 乖離 | 商品総重量＝各受注明細の「商品重量×数量」を積み上げ、同一受注IDでグループ化した合計（絞り込みは出荷IDのみ）。同一受注に複数出荷選択時はデータ行1行に畳込む（L331,L334,L347） | 乖離（実装バグ・ファンアウト二重計上）／要実機確認 | `—` | RG-005,006 |  |
| m05-07 | 現行踏襲 | 乖離 | ストリーム応答の組み立て完了時に情報ログ「送り状CSV出力完了」＋ファイル名（L326 step11,L383） | 乖離（完了ログがデータ出力前に発火・誤解を招く） | `—` | RG-032 |  |
| m05-07 | 現行踏襲 | 乖離 | フォームに CSRF トークンが載るのは画面描画時の仕組みどおり（L388）。当エンドポイントは GET,POST 両許可（L403） | 乖離疑義（CSRFサーバ検証なし・GET実行可）／要実機確認 | `—` | RG-026／§5 CSRF |  |
| m05-07 | 現行踏襲 | その他 | ids が配列でない/空 → HTTP404（L347,L377） |  | `—` | $ids === []) throw new NotFoun |  |
| m05-08 | 現行踏襲 | 乖離 | スタック用紙の「高額印字区分」は閾値（`stack_paper_threshold_price`）以上/未満で印字を分岐する意図（Excel 0203:L3848「★はカスタマイズ項目」・詳細設計 L | 乖離（既知バグ・高額印字が非機能） | `OrderRepository.php:1418, OrderRepository.php:1780` | RG-004,008 |  |
| m05-08 | 現行踏襲 | 乖離 | 更新処理の例外は原則HTTP400 JSON へ写し替える分岐が存在（詳細設計 L323 step9／L364「更新処理の例外（HTTP400へ写し替えられない種類）…サーバは伝播させうる」） | 乖離（実装バグ疑い・例外写し替え不発）／要実機確認 | `OrderController.php:919, UpdateStackListAction.php:60` | RG-014,021 |  |
| m05-08 | 現行踏襲 | その他 | 印刷予約AJAX（`admin_order_print_stack`）は `_token` を検証、子ウィンドウ表示ルート（`admin_order_print_stack_window`）はページ描 | json_encode | `OrderController.php:864, print_stack_window.twig:28` | raw`＝JSONエスケープ）で描画し実害は限定的だが、wi |  |
| m05-09 | カスタマイズ | 乖離 | コレクター番号でのソート時は「コレクター番号（昇順）」（Excel 0203:L4059。番号としての昇順を期待） | 乖離（コレクター番号の数値昇順未達懸念・DB方言差）／要実機確認 | `SortProductTrait.php:65` | RG-009 |  |
| m05-10 | カスタマイズ | 乖離 | 同一注文の複数配送IDを別々にオンしても各配送の版面が出るべき（詳細設計 L336 がリスクを明記） | 乖離（実装バグ・キー上書き）／要実機確認 | `DtbShippingStandbyRepository.php:250` | RG-009 |  |
| m05-10 | カスタマイズ | 乖離 | 本店のほかに支店もスマレジも出力対象（Excel 0203:L4336・カスタマイズ★） | 乖離疑義（内部結合による脱落・実機再現で確定） | `DtbShippingStandbyRepository.php:303` | RG-002 |  |
| m05-10 | カスタマイズ | 乖離 | 金額欄の税まわりを版面に反映（Excel 0203:L4381近傍「請求金額」・詳細設計 L325「税計算試行結果を読みつつ summary へマージ」） | 乖離（実装バグ・算出値の破棄） | `DtbShippingStandbyRepository.php:341` | RG-007 |  |
| m05-12 | 標準 | 乖離 | ログ・監査: 完了ログは「遷移を含む1出荷の処理完了」時に対応状況一括変更処理完了と受注IDを記録（L395） | 乖離（ログ発火条件・軽微） | `OrderController.php:562` | RG-030 |  |
| m05-12 | 標準 | 乖離 | 一括の対応状況変更ではメールを送らず mail_send_date を更新しない（L341,L369,L373） | 乖離疑義（サーバ側未ガード・要実機/セキュリティ確認） | `OrderController.php:485` | RG-018,034 |  |
| m05-12 | 標準 | 乖離 | 変更先が対応中またはキャンセルのとき商品規格・在庫情報を更新する（L340順7） | 乖離（実装上の潜在NPE・エッジ・要実機確認） | `OrderController.php:530` | RG-016,023 |  |
| m05-13 | 標準 | 乖離 | 受注一覧の出荷行ごとに問い合わせ番号の入力欄（id=`tracking_number_<出荷id>`・`data-shipping_id`・`data-url`）と更新ボタン（`data-target | 乖離（UI未配置・機能未到達） | `index.twig:178, OrderController.php:576` | RG-016,017,018 |  |
| m05-13 | 標準 | その他 | 非同期保存で空文字は文字種検証に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない（L348） |  | `OrderController.php:583, RegexValidator.php:33` | ''===$value) return;`）、Lengthも |  |
| m05-13 | 標準 | 乖離 | 非同期保存の失敗時は messages 配列を改行連結してアラート表示（L326）。XHR/トークン不正・保存例外は「表示文言を設けない」NGをHTTP400/500（L336,L377） | 乖離（実装バグ・未定義参照）／要実機確認 | `index.twig:193, OrderController.php:580` | RG-018,005,006 |  |
| m05-14 | 標準 | 乖離 | 許可されない遷移を強制送信したとき、受注ステータス項目にステータス変更不可のエラー「%from% から %to% にはステータス変更できません」を対応状況プルダウン直下に表示し、受注編集(詳細)画面を | 乖離（強制送信インラインエラーが status_change 経路で未表示・リダイレクトで消失）／要実機確認 | `EditController.php:769, OrderType.php:524, EditController.php:578` | RG-014,RG-022 |  |
| m05-14 | 標準 | 乖離 | 購入処理上の例外時はエラーメッセージを表示し、受注編集(詳細)画面を再表示する（HTML:365,389） | 乖離（status_change 経路の購入処理例外が未捕捉・graceful 再表示にならず 500）／要実機確認 | `EditController.php:760, OrderStateMachine.php:45, OrderStateMachine.php:123` | RG-033 |  |
| m05-14 | 標準 | その他 | 変更前後同一・変更前/後ステータス取得不可時は変更せずリダイレクト（HTML:336,351,359） |  | `EditController.php:765` | $newStatusId === null |  |
| m05-15 | 標準 | 乖離 | 入力項目・バリデーション節（正本 L361,L362,L383）は件名を「フォーム上限なし（DBは255文字。送信時に「[ショップ名] 」が前置される）」「フォーム側に明示的な最大長制約は持たない」と | 乖離（フォーム/DB長不整合・設計自認リスク）／要実機確認 | `OrderMailType.php:50, MailHistory.php:53, MailService.php:598` | RG-010,018 (要判定=件名長) |  |
| m05-15 | 標準 | 乖離 | エラー処理節（正本 L356,L395）は「メーラーの送達失敗…画面上は成功扱いで受注編集画面へ遷移する」、データ整合性 L367 は送信履歴に「実際に送信したメールの…値を記録する」 | 乖離（データ整合性の解釈差・低確度）／要実機確認 | `MailService.php:616, MailController.php:148` | RG-014,018 |  |
| m05-15 | 標準 | 乖離 | ログ・監査節（正本 L401）は「送信履歴に件名・本文・送信日時・宛先会員・受注・店舗基本情報を記録する」。店舗基本情報(base_info)を必須の記録項目とする | 乖離（境界・低確度）／要実機確認 | `MailController.php:154, MailHistory.php:33` | RG-010,017 |  |
| m05-16 | 標準 | 乖離 | ショップ用メモ欄カードの本文（#freeArea）は初期状態が展開（表示）である（正本 L329「初期状態は展開（表示）である」）。開閉トグルは Bootstrap collapse のアクセシビリテ | 乖離（実装バグ・a11y／軽微） | `edit.twig:1803` | RG-015 |  |
| m05-17 | 標準 | 乖離 | 受注編集画面（出荷1件）は出荷情報ブロックに出荷用メモ欄を表示し、先頭出荷のメモを編集・保存できる（詳細設計 L325,L333,L342） | 乖離（受注編集画面での表示・編集未達） | `OrderType.php:446, ShippingType.php:207, shipping.twig:686` | RG-001,002 |  |
| m05-17 | 標準 | 乖離 | 受注編集画面（出荷1件）で入力した出荷用メモが受注保存に同梱され dtb_shipping.note に保存される（詳細設計 L335,L342） | 乖離疑義（実機再現で確定・要実機確認） | `EditController.php:657, ShippingController.php:177` | RG-003,015 |  |
| m05-18 | 現行踏襲 | 乖離 | 予約区分は「受注商品名に『予約』を含む場合」（Excel 0203:L6343）。受注の商品名に予約が含まれれば予約区分 | 乖離（Excelは受注商品名／実装は先頭明細のみ・両リポ同一） | `OrderRepository.php:1290, OrderRepository.php:147` | RG-005,008 |  |
| m05-18 | 現行踏襲 | 乖離 | 大量区分は「購入種類数が閾値150以上」（Excel 0203:L6344）＝商品種類数 | 乖離（Excel=購入種類数／実装=明細総件数・両リポ同一） | `OrderRepository.php:1297, Order.php:2311, MtbOrderType.php:38` | RG-006 |  |
| m05-18 | 現行踏襲 | 乖離 | 受注明細0件の受注は「区分判定で先頭明細参照があり実装上エラーになりうる」（詳細設計 L338＝可能性） | 乖離疑義（明細0件でエラー・実機再現で確定） | `OrderRepository.php:1290, OrderRepository.php:147` | RG-026 |  |
| m05-18 | 現行踏襲 | 乖離 | 注文番号(from/to)は「数値（整数）」（Excel 0203:L6356,L6357・IntegerType L356） | 乖離疑義（文字列列への数値比較・要実機確認・両リポ同一） | `OrderRepository.php:1264, OrderRepository.php:121` | RG-014(DV-02),001 |  |
| m05-18 | 現行踏襲 | 乖離 | 配送に結合する複数行で「同一受注が複数回含まれると永続化処理へ重複が渡りうる」（詳細設計 L338＝可能性） | 乖離疑義（受注重複登録・実機再現で確定・両リポ同一） | `OrderRepository.php:1258` | RG-027 |  |
| m05-18 | 現行踏襲 | 乖離 | dtb_shipping_standby の create_date・update_date は「作成処理の当該アクションではエンティティ上セットしない（NULLのままとなりうる）」（詳細設計 L35 | 乖離（作成日時 未設定・詳細設計が既知として明記） | `GenerateShippingStandbyListAction.php:47, DtbShippingStandby.php:26` | RG-023 |  |
| m05-19 | 現行踏襲 | 乖離 | 登録日/最終更新日レンジは現行踏襲＝from を 00:00:00、to を 23:59:59 に丸め、日単位境界で比較（現行 `pf-eccube3/.../DtbShippingStandbyRe | 乖離（現行踏襲違反・日時境界の時刻丸め差）／要実機確認 | `DtbShippingStandbyRepository.php:92` | RG-003,004,027(DV) |  |
| m05-19 | 現行踏襲 | 乖離 | 検索フォームのCSRFは現行踏襲＝無効（現行 `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Order/ShippingStandbyType.p | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `—` | RG-028 |  |
| m05-19 | 現行踏襲 | 乖離 | セッションキー接頭辞は現行踏襲＝`admin.shipping_standby.`（現行 `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Orde | 乖離（内部差・セッション互換）／要実機確認 | `SearchControllerTrait.php:110` | RG-031 |  |
| m05-20 | 現行踏襲 | 乖離 | 削除成功後、検索セッションにページ番号があれば検索結果ページへ復帰、無ければ一覧トップ `admin_shipping_standby` へ（L329,L339,L363） | 乖離（実装バグ・未定義ルート参照／現行踏襲の持込） | `ShippingStandbyController.php:261, ShippingStandbyController.php:188` | RG-018 |  |
| m05-20 | 現行踏襲 | 乖離 | 削除処理が読むページ番号セッションキーと、一覧（検索trait）が書くキーが一致し、削除後に検索ページへ復帰できる（L329,L339,L380） | 乖離（実装バグ・セッションキー不一致で機能死／現行踏襲） | `ShippingStandbyController.php:259, SearchControllerTrait.php:112, ...ShippingStandbyController.php:186` | RG-018 |  |
| m05-20 | 現行踏襲 | 乖離 | 備考保存アクションは comment 列と最終更新者 member_id 列だけを上書きし、update_date を明示的に進める処理はアクション内に無い（L335,L351） | 整合（乖離なし・設計正確）／更新日時の結果反映は要実機確認 | `UpdateCommentAction.php:33, DtbShippingStandby.php:26` | RG-010 |  |
| m05-21 | 現行踏襲 | 乖離 | 価格帯の閾値1/閾値2は `order_list_threshold_price_1`/`_2` から正しく `:price1`/`:price2` に対応づく（Excel 0203:L7086-70 | 乖離（pf現行バグ・位置依存／enterpriseで是正）／要実機確認 | `DtbShippingStandbyRepository.php:149, DtbShippingStandbyRepository.php:143` | RG-037 |  |
| m05-21 | 現行踏襲 | 乖離 | 帯判定に使う閾値と画面見出し数値（thresholdPrice1/2）は同一値（詳細設計 L324,L331 が「取り合わせが食い違う可能性」を指摘） | 乖離（pf現行バグ・二経路不整合／enterpriseで是正） | `...ShippingStandbyController.php:210` | RG-037 |  |
| m05-21 | 現行踏襲 | 乖離 | 価格帯マップは全組合せを定義するか、未定義組合せを安全に処理する（詳細設計 L330,L361 が [1][0] 未定義を指摘） | 乖離（両系現存バグ・未定義インデックス）／要実機確認 | `...ShippingStandbyController.php:236, ...ShippingStandbyController.php:325` | RG-038 |  |
| m05-21 | 現行踏襲 | 乖離 | order_ids が空（全チェック解除）でも安全に空結果を返す（詳細設計 L315「例外や空結果になりうる」） | 乖離（両系現存・空IN未ガード）／要実機確認 | `—` | RG-025 |  |
| m05-21 | 現行踏襲 | 乖離 | 印刷実行（副作用の有無に関わらず）は管理画面共通のCSRF/認可で保護される想定（詳細設計 L350,L353） | 乖離（設計想定と実装・CSRF非強制／低リスク）／要実機確認 | `—` | RG-036 |  |
| m05-22 | 現行踏襲 | 乖離 | 請求金額は税込金額（内税）で表示（Excel 0203:L4099）。内税/請求金額はデータ構築で組み立てる想定 | 乖離（未使用デッドコード・意図不明）／要実機確認 | `DtbShippingStandbyRepository.php:341, OrderRepository.php:2087, delivery_slips.ja.twig:130` | RG-010 |  |
| m05-22 | 現行踏襲 | 乖離 | 送り主-会員番号はゲスト（非会員）の場合「非会員」と表示（Excel 0203:L4085）。ゲスト受注も納品書に出力対象（国内配送なら） | 乖離（ゲスト受注欠落リスク・Excel非会員表示に未到達）／要実機確認 | `DtbShippingStandbyRepository.php:303, delivery_slips.ja.twig:86` | RG-009,021 |  |
| m05-22 | 現行踏襲 | 乖離 | 同一注文に複数配送/複数明細がある場合も各行を保持して出力（配送単位展開・明細1ページ30行） | 乖離（複数配送/明細のキー衝突・設計が既知リスクとして明記）／要実機確認 | `DtbShippingStandbyRepository.php:250` | RG-005,022 |  |
| m05-22 | 現行踏襲 | その他 | GET/POST両許容・{lang}=ja/en・{id}は数値（HTML:303,314） | en'], methods:['GET','POST'])]` | `ShippingStandbyController.php:400` | **設計どおり✓** |  |
| m05-23 | 現行踏襲 | 乖離 | 出力は「UTF-8想定HTML、英語納品書テンプレート、ステータスコード200。ファイルダウンロードではなく画面表示である」（詳細設計 L349・概要 L304）。しかし同一設計の DB操作節 L35 | 乖離（詳細設計DB操作節の記述誤り／実装＝画面表示が正） | `ShippingStandbyController.php:438` | RG-001,019 |  |
| m05-23 | 現行踏襲 | その他 | 「本機能のカスタマイズ区分は現行踏襲であり、画面挙動と処理フローは現行リポ pf-eccube3 の実装を確認値とする」（詳細設計 L307） | generateDeliverySlips\ | `—` | delivery_slips.en.twig" pf-ecc |  |
| m05-24 | 現行踏襲 | 乖離 | CSV出力列は 64項目（Excel M05-24 0203:L7544-7607。配送先は「配送先_住所1(52)・住所2(53)」の次が「配送先_TEL1(54)」で 配送先_住所3 は無い。02 | 乖離（Excel/現行から+1列・現行踏襲違反） | `OrderCsvController.php:97, OrderRepository.php:1525` | RG-002 |  |
| m05-24 | 現行踏襲 | 乖離 | 詳細設計 L342/L343・Excel 0203:L7663 は「配送系（dtb_shipping 相当）は INNER JOIN となるため配送が無い注文は出力から落ちうる」と明記 | 乖離（記述と実装表現の差・実効挙動は設計どおり）／低 | `OrderRepository.php:1548` | RG-010 |  |
| m05-24 | 現行踏襲 | その他 | 詳細設計 L358・Excel 0203:L7678「Referer があればそこへ、無ければ admin_order へリダイレクト」（null 安全なフォールバック） | 現行の潜在バグ・移行先で是正／低 | `...OrderCsvController.php:206, ...OrderCsvController.php:176` | RG-007,018 |  |
| m05-26 | 現行踏襲 | 乖離 | フォーム妥当性チェックに失敗したら送信を拒否しレスポンスを打ち切る（詳細設計 L320「送信拒否レスポンスを返すべきときも後続に進む可能性がある」＝あるべきは打ち切り）。アップロードファイルはフォーム | 乖離（実装バグ・確定） | `OrderCsvController.php:223, AbstractCsvService.php:188` | RG-019 |  |
| m05-26 | 現行踏襲 | 乖離 | アップロードファイルが空（サイズ0）なら処理終了する（`getFormFile` のコメント「ファイルがない場合処理終了」＝あるべきは終了。詳細設計 L320「サイズ判定の分岐は空であり、サイズが0で | 乖離（実装バグ・確定） | `AbstractCsvService.php:109` | RG-019 |  |
| m05-26 | 現行踏襲 | 乖離 | 名前付き接続ロックで同種CSV処理の並行を回避し、処理後はロックを解放する（詳細設計 L331「MySQL関数ベースロックを明示解放していない」・L370「ロック解放タイミングは環境側コネクション寿命 | 乖離（実装の資源解放漏れ・確定） | `OrderCsvController.php:236` | RG-020 |  |
| m05-26 | 現行踏襲 | 乖離 | 「対応状況が出荷指示かつ出荷日が入力されている受注情報を更新」（メソッド自身のdocコメント `OrderCsv.php:53`＝あるべきは対応状況=出荷指示のゲート。詳細設計 L334「親注文状態は | 乖離（doc前提と実装差・確定）／要実機確認 | `OrderCsv.php:92` | RG-001,RG-002,RG-008 |  |
| m05-26 | 現行踏襲 | 乖離 | 配送情報の出荷日登録は「更新された受注」に対する処理の一部（Excel L7752 は更新一式の中に配送出荷日登録を含む） | 乖離（部分更新の非対称・確定）／要実機確認 | `OrderCsv.php:103` | RG-004,RG-008 |  |
| m06-02 | カスタマイズ | 乖離 | 職業列を出力（Excel M06-02 項番10 = 0205:L1530「職業 申込時の職業名」）。ヘッダ順は査定ID…電話番号→職業→事業者であるか→事業者番号 | 乖離（詳細設計HTMLの記述漏れ・Excel/実装は職業列あり） | `OtcBuyOrderCsvExportService.php:45, DtbOtcBuyOrderRepository.php:31` | RG-002,015 |  |
| m06-04 | カスタマイズ | 乖離 | 経理払出し済は「経理チームのみが更新可能」（Excel 0205:L3274,L2417「更新のURLを分け、経理チームのみが更新可能とする」・経理以外は権限エラー Excel 0205:L2417） | 乖離（カスタマイズ未達・役割分離が汎用ルート権限任せ）／要実機確認（ルート権限運用で代替可否） | `OtcBuyOrderController.php:387` | RG-014 |  |
| m06-04 | カスタマイズ | 乖離 | 入庫のステータス変更は「買取管理を使えるユーザが更新可能」＝権限を分ける（Excel 0205:L3275-3276） | 乖離（権限ゲート非対称・入庫側未分離） | `OtcBuyOrderController.php:411, OtcBuyOrderController.php:448` | RG-014 |  |
| m06-04 | カスタマイズ | 乖離 | 詳細設計HTML 権限・認可表は、ログイン＋編集可能店舗で「通過（現行はロール追加制約なし）」とし、ロール制約を「未実装のTODO」と記す（L371-372） | 乖離（詳細設計の過小記述・実装は汎用ルート権限あり） | `OtcBuyOrderController.php:302` | RG-013,014 |  |
| m06-05 | カスタマイズ | 乖離 | 一覧結果テーブルは検索結果のページ内履歴行を1回ずつ描画する（Excel 0205:L3789-3806 の一覧・正本 L322 が「1ページ N 件のとき同じ N 行の表が最大 N 回繰り返し描画さ | 乖離（実装バグ・表示重複／重複id） | `history.twig:196` | RG-026 |  |
| m06-05 | カスタマイズ | 乖離 | 検索結果・CSVは「買取日時の降順、査定申込日時の降順」に並ぶ（Excel 0205:L3780,L3781 が一次オラクル） | 乖離（並び第2キー相違・要実機確認） | `DtbOtcBuyOrderStockHistoryRepository.php:283` | RG-018 |  |
| m06-05 | カスタマイズ | 乖離 | （エッジ）会員ID・査定IDに空文字を入力しても業務上は無条件扱いが自然（Excel は完全一致検索を規定 0205:L3522,L3523,L3551） | 乖離（空文字→意図せず0件の可能性・要実機確認） | `DtbOtcBuyOrderStockHistoryRepository.php:98` | RG-001,003,DV-05 |  |
| m06-05 | カスタマイズ | 乖離 | 買取価格は実在庫の単価（getUnitCost）を表示・出力し、検索の買取価格帯は明細の単価で評価（Excel 0205:L3538,L3539,L3798・正本 L344） | 乖離疑義（表示単価と検索基準の非等価・要実機確認） | `history.twig:234, DtbOtcBuyOrderStockHistoryRepository.php:368` | RG-013,RG-026 |  |
| m06-05 | カスタマイズ | 乖離 | 参照系機能につきDB登録/更新/削除は行わない（正本 L345,L399・API/バッチ L355） | 乖離（詳細設計の記述矛盾・オラクルは参照系） | `—` | RG-037 |  |
| m06-06 | カスタマイズ | その他 | 買取日時CSV列は completeDate のみを参照（詳細設計 L339,L347）。一覧はキャンセル時 cancelDate を代用 | 設計上の差異（実装確認で確定） | `—` | RG-014,036 |  |
| m06-06 | カスタマイズ | 乖離 | 申込者CSV列：Excelは「姓 + 半角空白 + 名」（0205:L3978）。詳細設計は「会員オブジェクトを文字列化した表示」で「画面上の姓名連結とは別経路になりうる」（L339） | 乖離候補（Excel規定 vs 会員文字列化・要実ソース確認） | `—` | RG-015 |  |
| m06-06 | カスタマイズ | その他 | エクスポートPOSTのフォーム型はCSRFを無効化（詳細設計 L341,L368） | 設計自認（CSRF無効・実装確認） | `—` | RG-037 |  |
| m06-06 | カスタマイズ | その他 | 棚戻し列 restocked_flg・restocked_date は移行先で追加されるが本CSVの固定ヘッダ列には含まれない（詳細設計 L314） | 要実ソース確認（列混入なし） | `—` | RG-011 |  |
| m06-07 | カスタマイズ | 乖離 | 商品名列は「商品の名称」（出力列表 L333）。言語コード等の接頭辞付与は正本に規定なし | 乖離（設計未記載の値変換）／要実機確認 | `DtbOtcBuyOrderStockHistoryRepository.php:366` | RG-002 |  |
| m06-07 | カスタマイズ | 乖離 | 選択した履歴IDの行がCSVに並ぶ（0件・存在しないIDのみのときだけヘッダのみ・L336,L344）。規格に言語が無くても行は出力されるべき（正本は言語有無で行を落とす記述なし） | 乖離（実装バグ・選択IDの黙示欠落／防御分岐の矛盾） | `DtbOtcBuyOrderStockHistoryRepository.php:341, ProductClass.php:266` | RG-001,007 |  |
| m06-07 | カスタマイズ | 乖離 | 作業者は「履歴に記録された管理者の表示名」（出力列 L333）。作業者不明で行を落とす記述は正本になし | 乖離疑義（要実機確認） | `DtbOtcBuyOrderStockHistoryRepository.php:337` | RG-001 |  |
| m06-08 | 現行踏襲 | 乖離 | ログインメンバーのデフォルト検索表示店舗が「全店」の場合は、買取店舗を未選択状態とする（Excel 0205:L4153・カスタマイズ要件） | 乖離（カスタマイズ未達懸念）／要実機確認 | `OtcBuyOrderSummaryType.php:96, BaseInfo.php:47` | RG-011 |  |
| m06-09 | 現行踏襲 | 乖離 | ログ・監査: 情報ログに「買取集計CSV出力完了」とファイル名（詳細設計 L382「CSVストリーム応答オブジェクト生成時」） | 乖離疑義（ログ文言と実タイミング・低）／要実機確認 | `OtcBuyOrderSummaryCsvExportService.php:111` | RG-023 |  |
| m06-09 | 現行踏襲 | 乖離 | 集計日=「日別」でグループ化（Excel 0205:L4532／詳細設計 L330「日別×部門」・L332「グループ化した summary_date」） | 乖離疑義（datetime粒度グループ化・実機/バッチ確認要） | `DtbOtcBuyOrderSummaryRepository.php:50` | RG-002,007 |  |
| m06-10 | 新規実装 | 乖離 | 色/R は「商品名から取り出した色とレアリティを出力（例: 金R）」（Excel 0205:L1941） | 乖離（導出源相違）／影響は要実機確認 | `DtbOtcBuyOrderRepository.php:589, RestockListCsvRowFormatter.php:84` | RG-008 |  |
| m06-10 | 新規実装 | その他 | 商品名は「略称・言語・状態・色・レアリティを取り除く」（Excel 0205:L1943） | 白 | `RestockListCsvRowFormatter.php:174` | 青 |  |
| m06-10 | 新規実装 | 乖離 | 言語/状態は「言語/状態の形式で出力する（例: FoilJP/NM）」（Excel 0205:L1939） | 乖離（端ケースの書式）／低・要実機確認 | `RestockListCsvRowFormatter.php:147` | RG-005 |  |
| m06-11 | 新規実装 | 乖離 | 「印刷する」ボタン押下→PC端末の印刷ダイアログ表示→印刷（0205:L2096・item1 0205:L2122）。機能名は「戻しリストPDF出力」（0205:L2038） | 乖離（応答実体がPDFでなくHTML+JSON）／要実機確認 | `OtcBuyOrderController.php:632` |  |  |
| m06-11 | 新規実装 | 乖離 | 対象ステータスの絞り込みをExcel未記載 | 乖離（オラクル未記載のステータス制限）／要実機確認 | `OtcBuyOrderRestockListService.php:119` |  |  |
| m06-11 | 新規実装 | 乖離 | 「対象店舗ごとに指定された閾値情報で分けて取得」（0205:L2098）＝店舗ごとの帯分割は規定するが、単一店舗のみ許可の制約は未記載 | 乖離（オラクル未記載の複数店舗制限）／要実機確認 | `OtcBuyOrderRestockListService.php:131` |  |  |
| m06-12 | 新規実装 | 乖離 | 基準価格：状態がない場合は何も出力しない（Excel `0205:L1753`） | 乖離（状態なし通常品で空欄化されない） | `DtbOtcBuyOrderRepository.php:507` | RG-002／DP-04 |  |
| m06-12 | 新規実装 | 乖離 | 言語ID：個別入力商品または状態がない場合は[1:日本語]固定（Excel `0205:L1755`） | 乖離（状態なし通常品で1固定にならない） | `DtbOtcBuyOrderRepository.php:509` | RG-002,005／DP-06 |  |
| m06-12 | 新規実装 | 乖離 | 略称タグ：状態がない場合は何も出力しない（Excel `0205:L1756`） | 乖離（状態なし通常品で空欄化されない） | `DtbOtcBuyOrderRepository.php:510` | RG-002／DP-07 |  |
| m06-12 | 新規実装 | 乖離 | レアリティ：状態がない場合は何も出力しない（Excel `0205:L1757`） | 乖離（状態なし通常品で空欄化されない） | `DtbOtcBuyOrderRepository.php:511` | RG-002／DP-08 |  |
| m07-01 | カスタマイズ | 乖離 | 買取番号の最大文字数は 50（Excel 0206:L1073＝「2 買取番号 半角・全角 最大文字数50」） | 乖離（Excel最大値 未強制） | `PurchaseListType.php:125, DtbBuyOrderRepository.php:127` | DV-05,RG-002 |  |
| m07-01 | カスタマイズ | 乖離 | 該当件数（Excel 0206:L1410）は検索条件に合致する買取の件数 | 乖離（件数二重計上リスク）／要実機確認 | `DtbBuyOrderRepository.php:82` | RG-035,005,006,009 |  |
| m07-01 | カスタマイズ | 乖離 | 商品名 AND/OR 検索は AND=全フィールドを満たす／OR=いずれかのフィールドを満たす（Excel 0206:L1080） | 乖離（詳細設計の記述誤り疑い・要実機確認） | `DtbBuyOrderRepository.php:161` | RG-005,006 |  |
| m07-02 | カスタマイズ | 乖離 | 利用回数は会員のネット買取件数をステータス無関係（キャンセル含む）で数える（Excel 0206:L1626） | 乖離（プレイヤー未登録会員で過少カウント）／要実機確認 | `DtbBuyOrderRepository.php:344` | RG-016,018 |  |
| m07-03 | カスタマイズ | 乖離 | 生年月日は Excel 0206:L2939「選択肢 1905から今年」 | 乖離（選択肢下限の1年ズレ・軽微・要実機確認） | `PurchaseDetailType.php:204` | RG-028(DV-08) |  |
| m07-04 | カスタマイズ | 乖離 | フォームブロック接頭辞は `m07-04_admin_online_purchase_purchase_manual_mail`（詳細設計 L341 入力項目節） | 乖離（詳細設計記述誤り・実装が正） | `PurchaseManualMailType.php:93` | RG-001,017 |  |
| m07-04 | カスタマイズ | その他 | 送信元未設定／送信例外でもコントローラは成功扱いでリダイレクトする（詳細設計 L328,L342,L373,L374 が実装挙動として明記） | 設計どおり（懸念注記・新規バグではない） | `MailController.php:99, MailService.php:1559` | RG-010,011 |  |
| m07-05 | 現行踏襲 | 乖離 | CSV列名は 銀行名／支店名／口座種別（Excel 0206:L1743,L1744,L1745）。列名から素直には銀行名・支店名・口座種別の可読値が期待される | 乖離（列名と出力値の意味不一致・要実機確認：意図的仕様か要確認） | `BuyOrderDepositCsvExportService.php:34, DtbBuyOrderRepository.php:466` | RG-005 |  |
| m07-05 | 現行踏襲 | 乖離 | 銀行口座がある買取注文は銀行列(銀行名/支店名/口座種別/口座番号/名義)が出力される（Excel 0206:L1740-1748）。本人確認区分は別列（L1749） | 乖離（INNER結合による銀行情報の巻き添え欠落・要実機確認） | `DtbBuyOrderRepository.php:459, BuyOrderDepositCsvExportService.php:120` | RG-007 |  |
| m07-06 | 現行踏襲 | 乖離 | 不正 type 時のフラッシュ文言は固定文字列「不正なCSV種別です。」（末尾句点あり・L311,L370） | 乖離（文言不一致・句点欠落） | `PurchaseController.php:620` | RG-025,RG-039(DV-03,04) |  |
| m07-06 | 現行踏襲 | 乖離 | 正本はCSRFトークン検証の有無を明記しない（沈黙）が、同一コントローラの兄弟エクスポートはトークン検証する | 乖離（CSRF保護の非一貫・要実機確認） | `PurchaseController.php:595` | RG-037,RG-038（CSRF=§5要判定） |  |
| m07-08 | 新規実装 | その他 | 出力対象のキャンセル除外は Excel M07-08 に記載なし（沈黙） | 設計沈黙・実装のみ／二重フィルタの冗長性疑義 | `DtbBuyOrderRepository.php:848` | RG-015 |  |
| m08-01 | カスタマイズ | 乖離 | 買取総額・買取件数の各範囲は整数・数字のみ・最小1（詳細設計 `...m08-01...html:393`） | 乖離（最小1 サーバ側未強制）／要実機確認 | `...SearchCustomerType.php:392, ...CustomerSearchTypeExtension.php:86` | RG-037(DV-11,13) |  |
| m08-01 | カスタマイズ | 乖離 | 購入商品名・コードは最大50（Excel 0207:L1075） | 乖離（最大長 値相違・Excel50 vs 実装255） | `...SearchCustomerType.php:134` | RG-036(DV-03,04) |  |
| m08-01 | カスタマイズ | 乖離 | 移行インポートボタン（識別ID:42/37）を除去する（Excel 0207:L1099,L1030）。※詳細設計HTML `...m08-01...html:400` は移行インポート（admin_ | 乖離（ボタン除去 未達の疑い）／要実機確認 | `—` | RG-026 |  |
| m08-01 | カスタマイズ | その他 | 退会区分（識別ID:38）を追加・最大255・部分一致（Excel 0207:L1095,L1048-L1050） | 設計どおり✓（Excel）／詳細設計の記載漏れ | `...SearchCustomerType.php:508` | RG-023,DV-08,09 |  |
| m08-01 | カスタマイズ | その他 | スマレジ購入金額・スマレジ購入回数（識別ID:27-30）を追加（Excel 0207:L1084-L1087） | 設計どおり✓（Excel）／詳細設計の記載漏れ | `...SearchCustomerType.php:440` | RG-024 |  |
| m08-02 | 現行踏襲 | その他 | Excel M08-02 は当機能（メール一括送信）を述べるべき（概要 0203:L6500 は正しく一括送信を述べる） | Excel設計書の記載不整合（行混線）／オラクルは概要L6500＋詳細設計に限定 | `—` | 全RG（採用範囲の限定） |  |
| m08-02 | 現行踏襲 | 乖離 | 選択会員ごとに送信（正本 L336）／宛先は dtb_customer から特定（L352） | 乖離（現行の実装バグ懸念・null→TypeError）／要実機確認 | `CustomerController.php:172, MailService.php:614` | RG-021（§5「存在しないID」要判定） |  |
| m08-03 | 現行踏襲 | 乖離 | 出力対象は「直前の会員検索条件に合致する会員」（正本 L317,L328）で、拡張項目は「会員IDをキーに各行へ付与」（正本 L331）＝拡張項目は付加であって出力対象の絞り込み条件ではない | 乖離（player無し会員の欠落）／要実機確認 | `CustomerRepository.php:81` | RG-016,001 |  |
| m08-03 | 現行踏襲 | 乖離 | 出力対象は「直前の検索条件」に従う（正本 L317,L328）。検索条件が未設定の場合の挙動は正本に明示なし | 乖離（堅牢性・未設定時の未定義キー参照）／要実機確認 | `CustomerController.php:642, CustomerRepository.php:84` | RG-015 |  |
| m08-03 | 現行踏襲 | 乖離 | DBカラム表（正本 L342）は拡張項目の源として `dtb_player` の `point`／`identity_confirm_status_id`／`smaregi_id` のみを列挙。処理フ | 乖離（設計のDBカラム記載不足）／要仕様追記 | `CustomerController.php:651, CustomerRepository.php:82` | RG-004,005 |  |
| m08-08 | カスタマイズ | 乖離 | メール本文のサーバ側必須チェック: メール本文は必須（Excel `0207:L3687`）。確認ボタン押下時、フォーム内容の入力チェックをサーバ側で行う（`0207:L3676`） | 乖離（本文のサーバ側必須検証欠落＝Excel L3676/L3687 違反・クライアント側のみで迂回可能）／要実機確認 | `manual_mail.twig:51, MailType.php:39, CustomerController.php:243` | RG-015,018(DV-03) |  |
| m08-09 | 現行踏襲 | 乖離 | 編集・削除の入口は `GET/POST /{admin_route}/customer/delivery/{id}/update`・`DELETE /{admin_route}/customer/de | 乖離（URL体系変更・独立した配送先一覧画面の消失）／要実機確認 | `CustomerServiceProvider.php:102, CustomerDeliveryEditController.php:45` | RG-001,003,028 |  |
| m08-09 | 現行踏襲 | 乖離 | 保存完了時の表示文言はロケールキー `admin.customer.save.complete`（詳細設計 `…m08-09_admin_customer_customer_delivery.html | 乖離（現行踏襲違反・成功メッセージのロケールキー変更）／要実機確認 | `CustomerController.php:490, CustomerDeliveryEditController.php:107` | RG-011 |  |
| m08-09 | 現行踏襲 | 乖離 | 会員編集画面に戻るボタンで会員編集画面へ遷移し、配送先一覧に戻るリンクはECCUBE4系踏襲のため削除（Excel 0207:L4033,L4060,L4061） | 乖離（詳細設計HTMLがExcelと矛盾・現行はExcel未追従）／要実機確認 | `CustomerController.php:609, CustomerDeliveryEditController.php:167` | RG-027,031 |  |
| m08-10 | カスタマイズ | 乖離 | 確認済への変更POSTでなりすまし対策トークンを検証する（詳細設計 L338 手順1・L366）。モーダルのJSは身分証有効期限の入力値となりすまし対策トークンを隠しフォームに載せてPOST送信する（ | 乖離（現行踏襲違反・CSRF保護の欠落＝本人確認ステータスを外部サイトから改変され得る）／要実機確認 | `edit.twig:82, CustomerEditController.php:231, framework.yaml:7` | RG-026,RG-013 |  |
| m08-10 | カスタマイズ | 乖離 | 本人確認の閲覧権限が無い管理者には身分証画像を表示せず、各画像枠に「閲覧不可」の文言を表示する（詳細設計 L332,L336,L341,L369,L376,L380）。Excelは閲覧制御を規定せず＝ | 乖離（現行踏襲違反・閲覧不可文言の不表示）／要実機確認 | `CustomerEditController.php:306, eccube.yaml:381` | RG-007 |  |
| m08-10 | カスタマイズ | 乖離 | 会員IDから選手情報を取得し、存在しない場合はページが見つからない扱い（404）とする（詳細設計 L328,L338 手順3,L347,L356,L376）。Excelは規定せず＝現行踏襲（0207: | 乖離（現行踏襲違反・選手情報なし時の応答が404→リダイレクト）／要実機確認 | `CustomerEditController.php:264` | RG-025 |  |
| m08-10 | カスタマイズ | 乖離 | 確認済への変更が成功したとき、フラッシュに「会員情報を保存しました。」を表示する（詳細設計 L384）。Excelは成功文言を規定せず＝現行踏襲（0207:L4223）＝現行 `pf-eccube3/ | 乖離（現行踏襲差・成功文言の変更）／要実機確認 | `CustomerEditController.php:299, messages.ja.yaml:1591, messages.ja.yaml:2815` | RG-021 |  |
| m08-10 | カスタマイズ | 乖離 | Excel M08-10 のカスタマイズ要件の記述が自己矛盾する。カスタマイズ説明「・ 識別ID:7に「海外住所用3」を追加する」（`excel_to_html/output/0207_基本設計仕様書 | 乖離（Excel設計書内の記述不整合・オラクル自体の欠陥）／要設計確認＋要実機確認 | `edit.twig:559` | RG-003 |  |
| m08-12 | 現行踏襲 | その他 | 削除確認ダイアログの表示メッセージは「[顧客グループ名称]を削除してもよろしいですか？」（Excel 0207:L4681）。現行はこれを満たす — `pf-eccube3/app/Plugin/Ha | 差異: 移行先はBootstrapモーダルで別文言を表示 — `ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:110`（`{{  | `message.ja.yml:1036` | trans({'%name%': CustomerGroup |  |
| m08-12 | 現行踏襲 | 乖離 | 削除は「『OK』押下時に該当の顧客グループを削除する」（Excel 0207:L4682）・「当該グループを削除し、一覧へ戻る」（詳細設計 L330）。所属会員がある場合の削除制約はExcel・詳細設 | 乖離（設計書の記載漏れ疑い＋現行のルート名誤記）／要実機確認 | `CustomerGroupController.php:83, CustomerGroupController.php:79` | RG-037 |  |
| m08-12 | 現行踏襲 | 乖離 | 削除ボタン押下時、確認ダイアログを動的に表示する（Excel 0207:L4680）。機能区分=現行踏襲・カスタマイズ要件なし（0207:L4667-4669）のためExcelが正 | 乖離（詳細設計HTMLの記述誤り＝設計書内不整合・Excel優先で解決）／設計書要修正 | `index.twig:90, index.twig:98` | RG-012, RG-034 |  |
| m08-13 | 現行踏襲 | 乖離 | 詳細設計 L337 は現行挙動を「前後の空白を取り除いてから扱う」と記述 | 乖離（詳細設計の記述が現行挙動を過小記述）／要実機確認 | `StringUtil.php:76` | RG-014 |  |
| m08-13 | 現行踏襲 | 乖離 | キーワードの最大文字数は255（新規 0207:L4901／更新 0207:L4903）。入力チェックはサーバ側で行う（0207:L4875,L4881） | 乖離（Excel明示の最大文字数がサーバ側で未強制・DB設定依存）／要実機確認 | `BlacklistType.php:33, BlacklistType.php:37, Plugin.HareruyaEc.Entity.DtbBlacklist.dcm.yml:23` | RG-013,022（DV-03,05,07） |  |
| m08-13 | 現行踏襲 | 乖離 | 登録・編集・削除の完了時は登録完了メッセージ（ロケールキー `admin.register.complete`）（詳細設計 L333＝現行踏襲補完） | 乖離（現行踏襲差・メッセージキー変更）／要実機確認 | `BlacklistController.php:108, BlacklistController.php:107` | RG-026 |  |
| m08-13 | 現行踏襲 | その他 | 観点 | 扱い | `—` |  |  |
| m08-14 | 現行踏襲 | 乖離 | 本機能は会員を更新せず、`secret_key` と `email` を読み取ってメールを再送するのみ（0207:L5117／詳細設計 L320）。本登録用URLは「当該会員の秘密キー」から生成する（ | 乖離（現行踏襲違反・仕様外のDB更新／旧URL無効化の副作用）＋正本内矛盾／要実機確認 | `CustomerController.php:196` | RG-012,RG-026,RG-027 |  |
| m08-14 | 現行踏襲 | 乖離 | リンク押下時に確認ダイアログを表示し、表示メッセージは「仮登録メールを再送してもよろしいですか？」（0207:L5053-L5054）。現行は共通の確認機構で同文言を表示し設計と逐語一致（`pf-ec | 乖離（現行踏襲差・確認ダイアログの実現方式変更／設計外文言の追加。文言自体は一致）／要実機確認 | `index.twig:485, messages.ja.yaml:2759` | RG-003,RG-004,RG-005 |  |
| m08-14 | 現行踏襲 | 乖離 | 再送リンクは仮会員のみサブメニューに表示する（0207:L5052,L5063）。対象は仮登録ステータスの会員（0207:L5033）。現行・移行先とも実装は当該限定を満たす（`pf-eccube3/ | 乖離（詳細設計HTMLの限定欠落・Excel規定との矛盾＝文書不備。実装は設計(Excel)に適合）／設計書修正要 | `—` | RG-001,RG-002,RG-003,RG-019 |  |
| m08-14 | 現行踏襲 | 乖離 | 本登録用URLは本会員登録（アクティベート）画面へのURL（0207:L5120）＝会員が開くフロント側のURL。現行は管理ドメインで生成されたURLをフロントドメインへ変換して送る（`pf-eccu | 乖離（現行踏襲違反の疑い・ドメイン変換の欠落）／要実機確認（SEED-DOMAIN 環境で確認） | `CustomerController.php:201` | RG-010,RG-022 |  |
| m09-01 | 標準 | 乖離 | 一覧のフッタに「新規作成」ボタンを置く（`function_spec_html_preview/ec-cube-enterprise/m09-01_admin_content_content_news | 乖離（設計記述と表示位置の不一致）／要実機確認 | `news.twig:31` | RG-006 |  |
| m09-01 | 標準 | 乖離 | 削除実行の判定順序は 1. なりすまし対策トークンを検証（失敗＝アクセス拒否） → 2. 識別子で対象を取得（取得できなければHTTP404）（`...m09-01_admin_content_con | 乖離（判定順序の逆転・設計と実装の不一致）／要実機確認 | `NewsController.php:142, EntityValueResolver.php:85, doctrine.yaml:54` | RG-022,023 |  |
| m09-01 | 標準 | 乖離 | DB操作節は当機能の `dtb_news` への操作を登録/更新のみ列挙し「不要な削除は含まない」と記す（`...m09-01_admin_content_content_news.html:381` | 乖離（設計内部不整合・DB操作節の削除欠落）／設計側の修正要 | `NewsController.php:149, NewsRepository.php:67` | RG-020 |  |
| m09-01 | 標準 | 乖離 | 新規登録画面の公開状態の初期選択は「公開」であり、その根拠をDB既定が真であることに置く（`...m09-01_admin_content_content_news.html:360` 「公開状態 … | 乖離（初期選択の成立根拠が設計記述と不一致・表示は要実機確認）／要実機確認 | `News.php:71, NewsController.php:90` | RG-007 |  |
| m09-01 | 標準 | 乖離 | ページング単位は 1ページ10件（`...m09-01_admin_content_content_news.html:360` 「ページング単位 1ページ10件（既定ページ件数の確認値）」／同:33 | 乖離ではない（設定依存・低）／設定値変更時は要実機確認 | `NewsController.php:61, eccube.yaml:142` | RG-004 |  |
| m09-02 | 標準 | 乖離 | アップロード制限が有効なとき、入口節に挙げた各URL（file_manager／file_view／file_download／file_delete）へ到達してもアクセス拒否（HTTP403）として | 乖離（設計の403範囲と実装の制限対象が不一致・機能無効化が不完全＝セキュリティ影響）／要実機確認 | `eccube.yaml:260, RestrictFileUploadListener.php:38, FileController.php:135` | RG-050 |  |
| m09-02 | 標準 | 乖離 | 削除では「対象の存在、ディレクトリ空判定、削除権限、トークンはサーバ側で再判定する」（同:340）。空でないフォルダの削除は画面上で削除ボタンを無効化する（同:338・同:374） | 乖離（サーバ側の空判定欠落・設計が明記する再判定が存在しない＝データ消失リスク）／要実機確認 | `FileController.php:218, file.twig:229` | RG-056,RG-032 |  |
| m09-02 | 標準 | その他 | アップロード先が領域外のときは「アップロード先不正のエラーを表示」する（同:374・同:348）。エラー文言は表示メッセージ節を正とする（同:401） | trans }}` でも解決できずキー文字列がそのまま画面に出る。設計の表示メッセージ節（同:362）にも当該文言の列挙が無い | `FileController.php:315, file.twig:158` | **乖離（文言未定義・設計の表示メッセージ節に該当行なし＝利 |  |
| m09-02 | 標準 | 乖離 | 削除時は「ストレージアダプタからの削除とファイルシステムからの削除を行う」（同:352）。アダプタ側に対象が存在しない削除では、その旨をログに残しファイルシステムの削除は続行する（同:377・同:38 | 乖離（アダプタキー組み立ての不整合・設計が規定するアダプタ削除が期待どおり働かない可能性）／要実機確認 | `FileController.php:234` | RG-038,RG-033 |  |
| m09-02 | 標準 | 乖離 | ファイル表示・ダウンロードで領域外・フォルダを指定したときは、専用文言は出さず見つからない（HTTP404）として扱う（同:366）。表示は「対象ファイルがuser_data配下であればファイル内容を | 乖離（表示のフォルダ指定が設計の404規定と不一致・表示/DLで判定が非対称）／要実機確認 | `FileController.php:136` | RG-041 |  |
| m09-02 | 標準 | 乖離 | ダウンロードは「添付ファイルとしてダウンロードさせる」（同:356・同:334）。成功時出力はダウンロード＝添付ファイルのレスポンス（同:383）。※応答のContent-Type自体は正本に明示がな | 乖離候補（正本はContent-Typeを規定せずMIME誤綴の影響は要確認）／要実機確認 | `FileController.php:277` | RG-043 |  |
| m09-03 | 標準 | 乖離 | 画面プレビューは「プレビューモードで保存処理と同じ流れを実行し、レイアウトとブロック配置を更新する」（`function_spec_html_preview/ec-cube-enterprise/m0 | 乖離（正本が沈黙する更新対象の相違・id0への予期しない副作用）／要実機確認 | `LayoutController.php:111` | RG-031 |  |
| m09-03 | 標準 | 乖離 | 保存時のサーバ側再検証として「ブロック存在、レイアウト存在、配置先妥当性、重複はサーバ側で保存時に判定する」／「保存時にサーバ側で配置先と対象ブロックを検証する」（同:338） | 乖離（設計が規定するサーバ側再検証の不在）／要実機確認 | `BlockPositionRepository.php:64` | RG-018,RG-045,RG-047 |  |
| m09-03 | 標準 | 乖離 | 「サーバ側はブロックIDが取れない行と未使用配置の行を除外して保存する」（同:387）／「配置先が未使用（target_id0）の行とブロックIDが取れない行は除外し、残りをブロック配置として作成する | 乖離（除外条件の実装差・堅牢性）／要実機確認 | `BlockPositionRepository.php:64` | RG-018 |  |
| m09-03 | 標準 | 乖離 | 「送信されたブロックごとの隠しフィールド（ブロックID・配置先・行番号）を順に読み、配置先が未使用（target_id0）の行とブロックIDが取れない行は除外し、残りをブロック配置として作成する」（同 | 乖離（送信行の読み取り上限＝設計の「順に読み」と不一致）／要実機確認 | `BlockPositionRepository.php:61, LayoutController.php:118` | RG-018,RG-020 |  |
| m09-04 | カスタマイズ | 乖離 | (2)検索ボックスに入力すると、ページを(3)ページ名・(4)ルーティング名・(5)URL・(6)ファイル名の4項目で部分一致検索し、対象ページのみを画面に表示する（Excel 0210:L1012, | 乖離（Excel未充足・検索対象項目の過剰／現行は機能欠落）／要実機確認 | `page.twig:21, PageController.php:65, PageController.php:45` | RG-005,006,007 |  |
| m09-04 | カスタマイズ | 乖離 | (1-4)URL・(1-7)twigファイルは最後のパスセグメントが/user_dataではない場合、テキストボックスを非表示にし、編集できない（Excel 0210:L2105,L2108） | 乖離（Excelと判定基準が不一致）／要実機確認（Excelの「最後のパスセグメント」の判定対象が一意に読めず、Excel側の記述精度も要確認） | `page_edit.twig:62, PageController.php:180` | RG-045,046 |  |
| m09-05 | 標準 | 乖離 | 成功メッセージ「保存しました」の表示条件は「「登録」で保存に成功し、同一画面へリダイレクトしたとき」（`function_spec_html_preview/ec-cube-enterprise/m0 | 乖離（成功メッセージの表示条件違反・アップロード失敗が成功と誤認されうる）／要実機確認 | `CssController.php:62, S3FileAdapter.php:78` | RG-M09-05-012,020,027 |  |
| m09-05 | 標準 | 乖離 | ファイルアップロード制限が有効な状態では「利用者の権限に関わらず、当URLは到達前にアクセス拒否（HTTP403）となる」（同HTML:374）。入口表でも未ログイン利用者は「上記パス（到達前）」で拒 | 乖離（制限403と共通認証の優先順・未ログイン時の応答差）／要実機確認 | `RestrictFileUploadListener.php:40` | RG-M09-05-021,023,024 |  |
| m09-05 | 標準 | 乖離 | 「ファイルストレージへのアップロード失敗」は「当画面では個別に捕捉せず、フレームワークの例外処理に委ねる」（同HTML:363・382）。当画面のエラーメッセージ「保存に失敗しました」は「ファイル書き | 乖離（例外捕捉範囲が正本の切り分けと不一致）／要実機確認 | `CssController.php:60` | RG-M09-05-017,020 |  |
| m09-05 | 標準 | 乖離 | 保存後は「既定のファイルストレージアダプタを取得し、書き込んだローカルファイルを配信用パス /html/user_data/assets/css/ に customize.css としてアップロードす | 乖離（アダプタ構成依存でアップロードが成立しない・構成前提が正本に未記載）／要実機確認 | `eccube.yaml:289, LocalSystemFileAdapter.php:49` | RG-M09-05-012,016,020 |  |
| m09-06 | 標準 | 乖離 | 保存後、既定のファイルアダプタでフロントのテーマ公開ディレクトリ `eccube_theme_front_dir` 配下 `/html/user_data/assets/js/customize.js | 乖離（既定構成での配置先がオラクル記述と異なる）／要実機確認 | `eccube.yaml:289, FileManager.php:49, JsController.php:65` | RG-014,035,036 |  |
| m09-06 | 標準 | 乖離 | ファイルアダプタは保存済みファイルを公開先へ配置する出力部品であり、編集対象ファイルは配置後も更新済みで残る（`m09-06_admin_content_content_js.html:323,359 | 乖離（ローカルアダプタ選択時に配置が成立しない／編集対象ファイル消失リスク）／要実機確認 | `LocalSystemFileAdapter.php:49, JsController.php:53` | RG-014,035,036 |  |
| m09-06 | 標準 | 乖離 | 書き込み・配置で入出力例外が発生した場合は保存失敗メッセージを表示し同一画面を再描画する（`m09-06_admin_content_content_js.html:339,382`）。配置段階の例外 | 乖離（配置失敗時の画面挙動がオラクル記述と異なる）／要実機確認 | `JsController.php:75, LocalSystemFileAdapter.php:38, S3FileAdapter.php:82` | RG-018,036 |  |
| m09-06 | 標準 | 乖離 | 保存完了メッセージは編集対象ファイルへの書き込みに成功したときに積み、書き込み失敗時は積まない（`m09-06_admin_content_content_js.html:337,339,347`） | 乖離（配置失敗時に保存完了メッセージが残る・正本に規定なし）／要実機確認 | `JsController.php:62` | RG-016,036 |  |
| m09-06 | 標準 | 乖離 | フロント共通テンプレートはフロント公開先のJavaScriptアセットを読み込み、配置済みの customize.js がフロント全ページで読み込まれる（`m09-06_admin_content_c | 乖離（フロントの読み込み元が設計の「フロント公開先」と一致しない）／要実機確認 | `default_frame.twig:303, framework.yaml:42, eccube.yaml:95` | RG-035 |  |
| m09-07 | カスタマイズ | 乖離 | 編集・削除ができないブロックは、1: (3)ブロック名の書式をリンクからラベルに変更し押下しても編集へ遷移しない、2: (5)編集を非表示、3: (6)削除を非表示にする（Excel 0210:L23 | 乖離（Excelの表示3条件未達＝ブロック名リンク化・編集/削除の非表示）／要実機確認 | `block.twig:24, block.twig:71` | RG-002,008,010 |  |
| m09-07 | カスタマイズ | 乖離 | (6)ファイル名の最後のパスセグメントが `/user_data` ではない場合、テキストボックスを非表示にし、編集できない（Excel 0210:L2608） | 乖離（Excel記載のuser_data条件が現行に無く、Excel文言も解釈不定）／要実機確認 | `block_edit.twig:65, BlockController.php:147` | §3 DV-16（件数外・要判定） |  |
| m09-07 | カスタマイズ | 乖離 | 削除可能ブロックの削除では、ファイルとレコードを削除する（Excel 0210:L2369「「削除」を押下すると、ブロックを削除する」／詳細設計HTML:331,375 の副作用＝ブロックファイルの削 | 乖離（保存側と削除側でファイル名規則が不一致＝孤立twigファイルの残存）／要実機確認 | `BlockController.php:174, ContentController.php:244` | RG-015,018 |  |
| m09-07 | カスタマイズ | 乖離 | 詳細設計HTMLは(1)言語の単一選択・`.ja.twig`/`.en.twig` 識別子・日英2ファイル作成（Excel 0210:L2581,L2584-L2594,L2603,L2608）に沈黙 | 乖離（詳細設計HTMLのカスタマイズ要件記述漏れ＝文書不備。期待はExcelを正とする） | `block_edit.twig:24, ContentController.php:170` | RG-026,027,037 |  |
| m09-08 | 標準 | 乖離 | 調査補助は「本文の照合に用いる実装上の識別子を以下に記す」とし、表示画面のルートname＝`m09-08_admin_content_content_cache` と規定（`function_spec | 乖離（正本の識別子記述誤り・照合不能）／要実機確認 | `—` | RG-048 |  |
| m09-08 | 標準 | 乖離 | 「本機能はキャッシュ管理のために新たなCookieを設定しない。ブラウザのセッションCookieはフレームワークおよび管理画面全体の認証に用いられる」（`…m09-08_admin_content_c | 乖離（正本の否定文が過大・限定漏れ。OUT根拠の偽陰性リスク）／要実機確認 | `—` | RG-044 |  |
| m09-08 | 標準 | その他 | 「メンテナンスモード許可設定が有効な場合、自動メンテナンスモードへ切り替える。無効な場合は切り替えない」（`…m09-08_admin_content_content_cache.html:338`） |  | `—` | !$this->isMaintenanceMode())`  |  |
| m09-08 | 標準 | 乖離 | 権限・認可は「未認証＝利用不可、管理者として認証済み＝キャッシュ管理画面を閲覧しキャッシュ削除ボタンを操作できる」の2状態のみを規定し、「本画面固有の追加権限は設けない」と明言（`…m09-08_ad | 乖離（正本の権限記述が過大・拒否経路の欠落）／要実機確認 | `—` | RG-036,037 |  |
| m09-08 | 標準 | その他 | メンテナンス解除は「削除完了画面の表示後にブラウザから自動送信され、自動メンテナンスモードを解除する」POSTエンドポイント（`…m09-08_admin_content_content_cache. | auto_maintenance | `—` | auto_maintenance_update`、(c) ` |  |
| m09-09 | 標準 | 乖離 | 公開側停止判定の順序2は「リクエストパスが管理画面プレフィックス配下の場合は、メンテナンス有効中でも停止せず、アプリ本体の処理へ進む」（`...m09-09_admin_content_content | 乖離候補（設計沈黙の境界・末尾スラッシュ有無で停止可否が変わる）／要実機確認 | `—` | RG-020・DDT DP-09 |  |
| m09-09 | 標準 | 乖離 | メンテナンス用Cookieは「Secure属性を付ける」（`...m09-09_admin_content_content_maintenance.html:397` 付与条件）／「メンテナンスが無効 | 乖離候補（設計沈黙・秘密トークンCookieの属性が設計で確定していない／付与と破棄で属性が非対称）／要実機確認 | `—` | RG-027,028 |  |
| m09-09 | 標準 | 乖離 | 判定順序2は「現在が無効、かつ送信値が on の場合、メンテナンスモードを強制的に有効化する」（`...m09-09_admin_content_content_maintenance.html:34 | 乖離候補（設計沈黙・競合時のトークン失効という利用者影響が設計に現れていない）／要実機確認 | `—` | RG-010・DDT DP-01 |  |
| m09-10 | カスタマイズ | 乖離 | 成功時・失敗時とも「同じ支店のトップページ管理画面への302リダイレクト」（詳細設計 L360,L376）。現行も `redirectToRoute` ＝302（`ec-cube/app/Custom | 乖離（現行踏襲違反・302→200／二重登録リスク）／要実機確認 | `BranchTopPageController.php:89` | RG-029,015,016,017,018 |  |
| m09-10 | カスタマイズ | 乖離 | 「バナー画像hidden値 URL長上限のLength制約を持つ」（詳細設計 L370） | 乖離（現行踏襲差・Length上限の基準変更）／要実機確認（両設定値） | `TopPageManagementType.php:59, BranchTopPageManagementType.php:66` | RG-031（DV-05,06,17） |  |
| m09-10 | カスタマイズ | 乖離 | 「新規画像がある場合は既存画像をS3から削除し、新規画像を…アップロードして保存後パスを取得する」（詳細設計 L338）。「既存画像削除後のS3保存が失敗 → DB保存せずエラーで戻る。S3上の既存画 | 乖離（現行踏襲差・S3操作順序の反転／堅牢性は向上）／要実機確認 | `BranchTopPageController.php:318` | RG-023,025,043 |  |
| m09-10 | カスタマイズ | 乖離 | 固定文言「タイルタグを設定してください。(※タイル属性がピックアップ商品の場合を除く)」＝半角括弧（詳細設計 L343）。現行も半角（`ec-cube/app/Customize/Resource/l | 乖離（文言差・等値照合するテストが失敗しうる）／要実機確認 | `messages.ja.yaml:4168` | RG-018（DV-11） |  |
| m09-10 | カスタマイズ | 乖離 | 詳細設計はタイルの削除を規定しない（DB操作 L367 は登録/更新のみで「不要な削除は含まない」）。現行はタイル削除を許容しない（`ec-cube/app/Customize/Form/Type/A | 乖離（設計沈黙部への実装追加）／要実機確認 | `BranchTopPageManagementType.php:91` | RG-037（§5「タイルの削除」＝要判定） |  |
| m10-01 | 現行踏襲 | その他 | 緯度（5-2）・経度（5-1）が地図設定として編集できる — Excel 画面項目表が「5-1 経度」（`0209_基本設計仕様書(基本情報設定).html:1073`）・「5-2 緯度」（`:107 | [0-9]?)[0-9]\.?[0-9]{0,6}\ | `—` | 180\.?0{0,6})$/`） |  |
| m10-01 | 現行踏襲 | 乖離 | 保存成功時の成功メッセージ／結果キャッシュ — 詳細設計は「管理画面向け成功メッセージを積む」（`m10-01_admin_shop_setting_setting_shop.html:336`）・「 | 乖離（成功メッセージ文言差・キャッシュ機構と発火条件の差）／要実機確認 | `ShopController.php:71, ShopController.php:87, BaseInfoRepository.php:55` | RG-013,015,016 |  |
| m10-02 | 現行踏襲 | 乖離 | 保存成功時は「管理画面向け成功メッセージキー（登録完了メッセージ）を積む」（詳細設計 L328） | 乖離（現行踏襲差・成功メッセージ文言の変化）／要実機確認 | `TradelawController.php:77, message.ja.yml:83, TradeLawController.php:77` | RG-007 |  |
| m10-02 | 現行踏襲 | 乖離 | 副作用として「update_date の更新（共通 Doctrine 購読処理）」が発生し、保存前更新イベントで現在日時に更新される（詳細設計 L328,L354,L358） | 乖離（現行踏襲違反・更新日時の副作用喪失＝更新履歴の追跡不能）／要実機確認 | `Help.php:176, TradeLaw.php:33` | RG-010 |  |
| m10-03 | 現行踏襲 | 乖離 | 管理画面から利用規約本文を登録できる画面が存在する。Excel 0209:L2081「・カスタマイズ要件に記載の内容以外は現行踏襲とする」（0209:L2079-2080 カスタマイズ要件＝なし）＋0 | 乖離（現行踏襲違反・機能および保存先の欠落／最重要）／要実機確認 | `CustomerAgreementSettingPage.php:29, OrderPdfService.php:281` | RG-001,011,012 |  |
| m10-03 | 現行踏襲 | 乖離 | 送信ボタンのラベルは「設定」（Excel画面項目ID2＝0209:L2092「2 設定 ボタン - - - 入力されたフォームの値で登録」）。同一仕様はExcelが正 | 乖離（Excel画面項目とのラベル不一致・未使用フィールドの残存）／要実機確認 | `customer_agreement.twig:67, CustomerAgreementType.php:52` | RG-004 |  |
| m10-03 | 現行踏襲 | その他 | Excel画面項目ID1（0209:L2091「1 利用規約 全角・半角 - - - -」）の必須列は `-`。本書は初期値列の `-` が実挙動（DB現行値を初期表示）と整合しないことから `-`  | 設計側の記載欠落（Excel画面項目の必須列を補正要）／要設計確認 | `CustomerAgreementType.php:46` | RG-018(DV-01),019 |  |
| m10-03 | 現行踏襲 | その他 | Excel はテキストの登録のみを規定（0209:L2083「・利用規約を登録する」／0209:L2091 書式・制限「全角・半角」）。管理者入力をフロントでHTMLとして解釈する旨の規定は無い | raw | `agreement.twig:34` | nl2br }}`）が `raw` によりマークアップエスケ |  |
| m10-04 | 現行踏襲 | 乖離 | 手数料は必須の数値（整数）（Excel 2-3 必須〇 0209:L2306／詳細設計 L365「手数料設定可のとき必須」） | 乖離（必須未強制） | `PaymentRegisterType.php:124` | RG-012,027(DV-03) |  |
| m10-04 | 現行踏襲 | 乖離 | 利用条件の下限・上限はそれぞれ非負整数文字列（数字パターン）と桁上限を満たす（詳細設計 L365,L386／Excel 2-6 数値整数 0209:L2309） | 乖離（片側バリデーション欠落） | `PaymentRegisterType.php:98` | RG-027(DV-13) |  |
| m10-04 | 現行踏襲 | 乖離 | 表示順は「上へ」「下へ」で隣接行とランクを入替（詳細設計 L351-354・L336「一覧のドラッグ並べ替え…は扱わない」／Excel 操作リンク 0209:L2294） | 乖離（操作方式の相違） | `PaymentController.php:378` | RG-020,021,022 |  |
| m10-04 | 現行踏襲 | 乖離 | 手数料設定可否が不可のとき保存直前に手数料0へ置換（詳細設計 L344,L360,L365／現行pf plugin 実装 chargeFlg==2→setCharge(0)） | 乖離（現行踏襲未達） | `—` | RG-012 |  |
| m10-04 | 現行踏襲 | 乖離 | 削除は論理削除（del_flg→非表示）で物理削除は行わない（詳細設計 L330「物理削除は当機能では行わない」,L350） | 乖離（削除方式の変化・要実機確認） | `PaymentController.php:337, AbstractRepository.php:48, PaymentController.php:177` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 削除後は論理削除されていない全行を昇順で取り直し「削除行を除いて」1から再採番（詳細設計 L350） | 乖離（採番方式差） | `PaymentController.php:324` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 利用条件は両方入力かつ上限が下限未満ならエラー（詳細設計 L360 判定順序2,L386） | 乖離（境界値バグ・要実機確認） | `PaymentRegisterType.php:131` | RG-027(DV-11) |  |
| m10-05 | 現行踏襲 | 乖離 | 金額の検証は現行踏襲＝`Length`（最大 `price_len`＝コア確認値8）＋非空入力時 `Regex /^\d+$/u`（詳細設計 `function_spec_html_preview/p | 乖離（現行踏襲違反・金額の最大長/文字種検証の消失）／要実機確認 | `ShopMasterType.php:246, PriceType.php:45, eccube.yaml:185` | RG-011（DV-03,DV-04,DV-06,DV-07 |  |
| m10-05 | 現行踏襲 | その他 | 無料化判定の閾値有無は現行踏襲＝NULL判定（`delivery_free_amount`／`_quantity` が `null` でない場合に限り適用。0でも非NULLなら判定に使う＝詳細設計 ` | \ | `DeliveryFeeFreePreprocessor.php:42, DeliveryFeeFreeByShippingPreprocessor.php:43` | $this->BaseInfo->getDeliveryFr |  |
| m10-05 | 現行踏襲 | 乖離 | 金額側の比較対象は現行踏襲＝`Order->getSubTotal()`（受注明細ごとの税込単価×数量の合計＝小計）、数量側は `order_service->getTotalQuantity(Ord | 乖離（現行踏襲違反・比較対象が小計→合計へ変質）／要実機確認 | `DeliveryFeeFreePreprocessor.php:43` | RG-016,RG-017,RG-021,RG-022 |  |
| m10-05 | 現行踏襲 | 乖離 | 無料化の適用は現行踏襲＝受注の配送料合計を0にし、全お届け先の実行時配送料フィールドも0にする（受注全体で一括判定。詳細設計 `...m10-05_...html:353`）。現行実装は `pf-ec | 乖離（現行踏襲違反・適用手段と判定粒度の変更）／要実機確認 | `DeliveryFeeFreePreprocessor.php:57, DeliveryFeeFreeByShippingPreprocessor.php:47` | RG-016,RG-019,RG-021 |  |
| m10-05 | 現行踏襲 | 乖離 | カート案内は現行踏襲＝金額・数量の両閾値がtruthyなら「あと〇円またはあと△個」を併記、片方のみなら単独メッセージ（詳細設計 `...m10-05_...html:356`）。現行実装は `pf- | 乖離（現行踏襲違反・カート案内の数量分岐/併記の消失）／要実機確認 | `index.twig:280` | RG-027,RG-028 |  |
| m10-05 | 現行踏襲 | その他 | フロントの文言ブロックは現行踏襲＝金額閾値が truthy のときのみ「〇〇円以上の購入で配送料無料」、そうでなければ「0円以上の購入で配送料無料」固定文（詳細設計 `...m10-05_...htm | 差異: 移行先の既定テンプレートに当該ブロックが見当たらない — `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/` に `free.twig` 相当が無く、`d | `—` | **乖離（現行踏襲差・フロント文言ブロックの消失）／要実機確 |  |
| m10-06 | 現行踏襲 | 乖離 | 登録（編集）成功時は「成功フラッシュを積んで配送方法一覧へリダイレクトする」（正本 L348 手順10／画面遷移表 L392「編集で登録に成功→配送方法一覧」） | 乖離（設計 vs 稼働プラグイン実装・遷移先）／要実機確認 | `DeliveryController.php:159, DeliveryController.php:189` | RG-011,025 |  |
| m10-06 | 現行踏襲 | 乖離 | 追加のフォーム項目は「追加フォーム枠にループ表示される条件がある」と総称的に触れるのみ（正本 L336）。基本情報項目は配送業者名/名称/伝票No.URL/商品種別のみ列挙（L364,L386） | 乖離（現行踏襲対象の実項目が仕様書外）／要実機確認 | `DeliveryController.php:84, Delivery.php:424` | RG-028 |  |
| m10-06 | 現行踏襲 | 乖離 | 配送業者名・名称は「Symfony Length制約は無し（DBはtext型）」＝文字数上限なし（正本 L364）。DBカラム節でも name/service_name に長さ記載なし（L380） | 乖離（設計の型/長さ記述が DB正典と不一致）／要実機確認 | `Delivery.php:65` | RG-033 |  |
| m10-06 | 現行踏襲 | 乖離 | 編集画面組立時に「全ての都道府県について配送料を検索または作成し、金額が空の行のみ関連付け、都道府県ID昇順で並べ替える」（正本 L344 手順3-4・L346 手順2） | 乖離（設計はコア挙動・稼働はプラグイン別実装）／保存経路は要実機確認 | `DeliveryController.php:163, DeliveryController.php:76` | RG-008,009 |  |
| m10-07 | 現行踏襲 | 乖離 | 削除対象が存在しない（論理削除済み含む）場合は、フラッシュをクリアし警告メッセージだけ残して一覧へリダイレクトする（詳細設計 L328,L343,L356,L385）。現行実装も一致（`pf-eccu | 乖離（現行踏襲違反・削除対象不存在時の応答差）／要実機確認 | `TaxRuleController.php:147` | RG-026 |  |
| m10-07 | 現行踏襲 | 乖離 | 新規の共通税率エンティティは課税規則にマスタID1を既定割り当て、税端数調整0、論理削除フラグ0で組み立てる（詳細設計 L313,L335,L354「新規ならマスタID1」）。現行実装も一致（`pf- | 乖離（現行踏襲違反・新規既定値の変質）／要実機確認 | `RoundingType.php:34, TaxRuleRepository.php:77` | RG-003 |  |
| m10-07 | 現行踏襲 | 乖離 | 同一適用日時の重複チェックは「同一適用日時の別行が存在しないこと」の確認（詳細設計 L339,L356）。現行実装は適用日時のみで突き合わせ、商品・規格に紐付く行も件数に数える（`pf-eccube3 | 乖離（現行踏襲違反・重複判定範囲と文言）／要実機確認 | `TaxRuleType.php:73, TaxRuleController.php:235, TaxRuleType.php:92` | RG-016 |  |
| m10-07 | 現行踏襲 | 乖離 | 保存成功・削除成功では「管理画面向け成功メッセージ」を積む（詳細設計 L339,L343,L365「多言語キーは税率保存完了・削除完了の管理画面用メッセージ」）。現行実装は税率専用キー（`pf-ecc | 乖離（軽微・成功メッセージキーの汎用化）／要実機確認 | `TaxRuleController.php:89` | RG-013,024 |  |
| m10-08 | 現行踏襲 | その他 | テンプレ選択（1-3）を選択すると最終更新日（1-2）が表示される（Excel `0209:L2844`。年の下限条件は無い） | date('Y') > 2018 ? '最終更新日: '~ mail.updateDate | `auto_mail.twig:42` | date('Y-m-d H:i:s') : '' }}`）。 |  |
| m10-09 | 現行踏襲 | 乖離 | 更新後の結果キャッシュ全削除は DoctrineのpostUpdate により、設定で全削除が有効なときのみ走り、無効なら削除しない（詳細設計 `m10-09_...html:332`,`:375`／ | 乖離（現行踏襲違反・キャッシュ削除の契機と条件が変質）／要実機確認 | `ShopController.php:86` | RG-016,017 |  |
| m10-09 | 現行踏襲 | 乖離 | 既定ID行のみを読み書きし、複数ショップ行を切り替えるUIはこのコア画面にはない（単票編集）（詳細設計 `m10-09_...html:347`／現行 `pf-eccube3/src/Eccube/R | 乖離（現行踏襲違反・単一行編集前提の崩れ／対象行がセッション依存）／要実機確認 | `BaseInfoRepository.php:65` | RG-035,008 |  |
| m10-09 | 現行踏襲 | 乖離 | メール4項目は NotBlank および厳密メール検証（strict 有効） を常に行う。「フォーム上は…必須と厳密メール検証のみを行う挙動を現行の確認値とする」（詳細設計 `m10-09_...ht | 乖離（現行踏襲違反・検証強度が設定依存へ弱化）／要実機確認 | `ShopMasterType.php:129` | RG-012,022(DV-05〜08) |  |
| m10-09 | 現行踏襲 | 乖離 | Excel M10-01 のメール4項目は 識別ID順＝1-10 送信元／1-11 返信先／1-12 送信エラー通知／1-13 問い合わせ専用、書式は「全角・半角」（0209:L1054-1057・E | 乖離（Excel設計と実装の並び順・ラベル差／識別ID↔列対応の規定欠落）／要実機確認 | `shop_master.twig:110, ShopMasterType.php:100` | RG-001,002,022(DV-10) |  |
| m10-09 | 現行踏襲 | 乖離 | Excel M10-01 の保存ボタンは 識別ID 6-1「設定」（0209:L1076「6-1 設定 ボタン - - - 入力されたフォームの値で登録」・Excel優先） | 乖離（Excel設計とUIラベル差・軽微）／要実機確認 | `shop_master.twig:186` | RG-011 |  |
| m10-10 | 現行踏襲 | その他 | 2-1 のボタンラベルは「設定」（Excel 0209:L3239「2-1 設定 ボタン - - - 入力されたフォームの値で編集」）。現行もラベルは「設定」 — `pf-eccube3/src/Ec | trans }}`）＋ `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1629`（`admin.common.registration: 登録`）。Excel | `csv.twig:200` | **乖離（Excel画面項目2-1違反・現行踏襲違反）／要実 |  |
| m10-10 | 現行踏襲 | 乖離 | 保存時のCSRFトークン検証はフレームワーク全体の扱いを正とし詳細設計では確定しない（L317,L369）＝現行踏襲（0209:L3222）。現行はトークン検証を行わずに保存する — `pf-eccu | 乖離（現行踏襲差・CSRF有効化＋トークン不正時が無言no-op）／要実機確認 | `CsvController.php:123` | RG-027 |  |
| m10-11 | 標準 | 乖離 | `CustomerOrderStatus` は `OrderStatus` と同一整数主キーで揃っていることを前提とし、欠損は「運用上は両テーブルを OrderStatus と同じ主キーで揃える」べき | 乖離（既定データで受注対応状況設定が保存不能・設計が例外扱いする状態が常態）／要実機確認 | `Version20251125150428.php:59, Version20260220000001.php:64, Version20251125144605.php:59` | RG-007,016,020,021,023 |  |
| m10-11 | 標準 | 乖離 | `mtb_order_status_color` の `id` は「`OrderStatus` と同値が前提」（`m10-11_admin_base_setting_setting_shop_orde | 乖離（マスタデータの整合性・設計前提違反／画面影響なし）／要実機確認 | `—` | RG-001,026 |  |
| m10-11 | 標準 | 乖離 | 色は「HTMLのカラー型ウィジェット」で入力し（`:326,332`）、「カラー型はブラウザが返す文字列形式に従う」（`:359`）。バリデーションは `NotBlank` と `Length` 最大 | 乖離（色の形式検証がサーバ側で成立せず・正本に規定なし）／要実機確認 | `OrderStatusSettingType.php:58, ColorType.php:64, OrderStatusControllerTest.php:57` | RG-004,015,020(DV-12) |  |
| m10-11 | 標準 | 乖離 | 店舗側権種の拒否は「初期データでは `dtb_authority_role` に、管理パス先頭 `/setting/shop` と前方一致する `deny_url` が紐付く。評価は共通の権限コンポー | 乖離（設計が記述しない防御層の存在・deny_url除去時の挙動が設計から追跡不能）／要実機確認 | `Version20240930235959_03.php:37` | RG-038,039,040,041 |  |
| m10-12 | 標準 | 乖離 | 保存処理における検証順序3「同一 `holiday` 値および同一店舗条件でほかに行が残るか数える。一致するほか行があれば『同日の定休日が既に存在しているため、設定できません。』文言を日付入力に載せて | 乖離（更新時の同日重複チェック不発の疑い＝一意性ルールの穴）／要実機確認 | `—` | RG-029,028,016（DV-07） |  |
| m10-12 | 標準 | 乖離 | 入力項目「タイトル」は「フォーム定義では必須」「未入力および空白のみはフレームワークの必須検証により無効」（`…m10-12_admin_base_setting_setting_shop_calen | 乖離（タイトル必須のサーバ側検証欠落の疑い＝NULL許容列への空タイトル混入）／要実機確認 | `—` | RG-013（DV-03,DV-04） |  |
| m10-12 | 標準 | 乖離 | 「失敗時出力 同一画面でのフォーム無効状態と入力欄近傍エラー文言」（`…m10-12_admin_base_setting_setting_shop_calendar.html:370`）／「タイトル | 乖離（インライン編集行でタイトルのエラー文言が入力欄近傍に出ない）／要実機確認 | `—` | RG-027,018,013（DV-03） |  |
| m10-12 | 標準 | 乖離 | DB操作表は対象テーブル `dtb_calendar` の操作種別を「登録/更新」のみ掲げ「（不要な削除は含まない）」とする（`…m10-12_admin_base_setting_setting_s | 乖離（設計DB操作表の記述漏れ＝削除行の欠落・正本内不整合）／要実機確認 | `—` | RG-039,031 |  |
| m10-13 | カスタマイズ | 乖離 | エラー処理は「不正なCSV種別ID／不正なカスタム定義ID（GET）／削除時に対象なし＝該当HTTPエラー」「CSRF不一致（削除）＝アクセス拒否例外」の4件（詳細設計 `…m10-13_…html: | 乖離（エラー処理表に無い未捕捉例外＝500の可能性）／要実機確認: 正本のエラー表に該当がなく、想定外の応答になりうる | `CustomerCsvUpdateAction.php:56, CustomerCsvController.php:80, CsvExtensionEntityManager.php:32` | RG-028 |  |
| m10-14 | 標準 | 乖離 | 正本内矛盾。L382「本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。」＋L383 の操作種別表が `検索` 1行のみ。一方 L320「単一店舗の論理削除API…を扱う」／L327「 | 乖離（正本の記述矛盾・DB操作節が論理削除を落としている／偽OUTを誘発する記述）／要実機確認 | `TenantController.php:397` | RG-033,034（§5 `要判定`） |  |
| m10-14 | 標準 | 乖離 | L374「CSRF送信に関わるクライアント属性テンプレートは各行チェックボックスに十分でない状態がソース上見えるが、自動テストはトークンレスのDELETEでも成功確認している。実環境側のSymfony | 乖離（CSRF未送信かつ未検証・状態変更APIの保護欠如）／要実機確認 | `index.twig:43, TenantController.php:396` | RG-040 |  |
| m10-14 | 標準 | 乖離 | L313/L330/L350/L357 は一覧を「モールルート以外のテナント店舗」に限定し、L320 は本APIを「単一店舗の論理削除API（選択行からのAjax DELETE）」と規定する。モールル | 乖離（モールルートの論理削除ガード欠如・一覧の限定が削除側に伝播していない）／要実機確認 | `TenantController.php:396, BaseInfoRepository.php:176` | RG-033,034 |  |
| m10-14 | 標準 | 乖離 | L357「テーブルの行集合 モールルートを除いた `dtb_base_info` 行であり、クエリ側は初期時点ですべて読み込んですべて表示する。」＋L350/L368「入力が桁パターンに合う空文字列の | 乖離（空検索で shop_name NULL 行が欠落・全件表示の不成立）／要実機確認 | `BaseInfoRepository.php:234, BaseInfo.php:87` | RG-006（DV-04・SEED-T4） |  |
| m10-14 | 標準 | その他 | L320「`resume` 付きGETにおける検索条件セッションとページ番号の更新・復元」を扱う／L333「`resume` フラグまたはパスパラメタに応じてセッション上の検索条件を復元して再クエリす |  | `TenantController.php:141` | $request->get('resume') !== nu |  |
| m10-14 | 標準 | 乖離 | L364「並び順 アルファベット名や店舗名でのソート機能は一覧テンプレートに存在しない。デフォルトの生成順およびQueryCustomization側の並びのみ。」／L352「KNPページネータに…ペ | 乖離候補（ページング安定性が保証されない・設計沈黙部）／要実機確認 | `BaseInfoRepository.php:176` | RG-011,027 |  |
| m10-14 | 標準 | 乖離 | L386「投稿が無効扱いになったときは一覧を返さずエラー状態を明示する構成に分岐する」／L397「検索フォーム無効判定 HTMLで検索のみ再構成し `has_errors` 相当の経路。一覧は空コンテ | 乖離（無効時のエラー状態明示が成立せず0件表示と区別できない・返却キーの不整合）／要実機確認 | `TenantController.php:131` | RG-018 |  |
| m10-14 | 標準 | 乖離 | L360 判定順序2「`id` 入力文字列が10桁までの数字のみであるか 真なら数値へ解釈を試み、DBMSが32bit整数の範囲外なら検索でのIDパラメタは使わずnull扱いに寄せる。」／L350「整 | 乖離（32bit範囲外IDの無効化がPostgreSQL限定・DBMS依存の分岐が正本に無い）／要実機確認 | `BaseInfoRepository.php:230, AbstractRepository.php:109` | RG-005（DV-07） |  |
| m10-15 | カスタマイズ | 乖離 | 検証成功時の成功フラッシュのメッセージキーは `admin.shop.save.complete`、文言は「基本情報を保存しました。」（0209:L3878＝詳細設計＝現行 pf-eccube3 の確 | 乖離（フラッシュキーの変更）／要実機確認 | `ShopController.php:87` | RG-031 |  |
| m10-15 | カスタマイズ | 乖離 | 結果キャッシュ全削除は設定 `doctrine_cache.result_cache.clear_cache` が真のときのみ `postPersist`／`postUpdate`／`postRemo | 乖離（キャッシュクリア契機の変更）／要実機確認 | `ShopController.php:85` | RG-034,046 |  |
| m10-16 | カスタマイズ | 乖離 | スマレジ契約ID・アクセストークンは「半角英数、スペース」（Excel 0209:L4044,L4045） | 乖離（許可文字集合の相違） | `AdditionalSystemFormType.php:83, ConfigType.php:91` | RG-014,015 |  |
| m10-16 | カスタマイズ | 乖離 | 英語サイト専用タグID・固定価格商品部門IDは「必須」（Excel 0209:L4060,L4050） | 乖離（現行の必須未達・enterprise で Excel 一致に是正） | `ConfigType.php:305, AdditionalSystemFormType.php:210` | RG-020,024 |  |
| m10-16 | カスタマイズ | 乖離 | （詳細設計ハルシネーション是正）成功フラッシュ翻訳キーは詳細設計 L355=`admin.register.complete` | 乖離（成功メッセージ翻訳キーの相違）／要実機確認 | `AdditionalSystemController.php:103, ConfigController.php:64` | RG-002 |  |
| m10-16 | カスタマイズ | 乖離 | Excel 入力項目表（0209:L4040–4062）が当画面の項目集合の正 | 乖離（Excel列挙とのフィールド差・要確認） | `AdditionalSystemFormType.php:76` | §5 台帳 |  |
| m11-03 | カスタマイズ | 乖離 | 正本 L336 のフロント挙動は、当画面の表示要素を「見出し・説明文・表（権限/拒否URL/削除ボタン）・登録button・extra-form」と規定する | 乖離（正本の画面記述漏れ）／要実機確認 | `AuthorityController.php:99, authority.twig:134` | §0・RG-003 |  |
| m11-03 | カスタマイズ | 乖離 | Excel: 複製は「権限名を入力し画面下部の登録ボタンを押して登録する」「権限名は必須かつ重複は不可とする」「権限を新規作成し登録する」（`0201:L1863-1865`）／画面項目 1-11 権 | 乖離（Excel仕様未充足）／要実機確認 | `AuthorityCopyType.php:29` | §0 |  |
| m11-03 | カスタマイズ | 乖離 | Excel: 「複製を選択した行と同権限の行を作成する」（`0201:L1862`）＝作成のみを規定し、複製先の既存行削除には言及しない | 乖離（Excel未記載の破壊的上書き）／要実機確認 | `AuthorityController.php:132, authority.twig:139` | §0 |  |
| m11-03 | カスタマイズ | 乖離 | 正本 L363「マッピングでは作成者・作成日時・更新日時は非NULL。標準コントローラは保存時にこれらを直接セットしない」 | 乖離（正本の記述不足・現行の非NULL制約リスク）／要実機確認 | `SaveEventSubscriber.php:55, Eccube.Entity.AuthorityRole.dcm.yml:31, AuthorityRole.php:55` | RG-040 |  |
| m11-03 | カスタマイズ | 乖離 | 正本 L346「『/ ＋ 管理ルート ＋ 登録拒否URL』をエスケープして得たパターンの先頭一致になるかを正規表現で試す」＝大文字小文字の扱いに言及なし | 乖離（正本の記述漏れ・拒否範囲が設計より広い）／要実機確認 | `AuthorityVoter.php:74, AuthorityVoter.php:60` | RG-025,026 |  |
| m11-04 | 標準 | 乖離 | 本機能は参照系。「副作用 検索条件・ページ番号・表示件数のセッション保存のみ。台帳・履歴の更新はしない」（`m11-04_..._login_history.html:369`）／「本機能は参照のみで | 乖離（設計書の記述誤り＝汎用テンプレ混入の疑い・DB操作節が本文3箇所と矛盾）／要実機確認 | `LoginHistoryController.php:105, LoginHistoryRepository.php:45` | RG-039,RG-055 |  |
| m11-04 | 標準 | その他 | 一覧を開く（素のGET）は「セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時の新しい順で1ページ目に表示する」（`m11-04_..._login_history.html:3 |  | `LoginHistoryController.php:89` | $request->get('resume'))` の el |  |
| m11-04 | 標準 | 乖離 | 検証失敗・0件時の日本語文言は「検索条件が無効です。」「検索条件を変えてお試しください。」「検索結果がありませんでした。」（`m11-04_..._login_history.html:350` エラ | 乖離（設計の日本語文言が実装と不一致・英語は一致）／要実機確認 | `messages.ja.yaml:1734, messages.en.yaml:1763, login_history.twig:190` | RG-020,RG-032 |  |
| m11-04 | 標準 | 乖離 | 0件時の表示は「検索結果がありませんでした。」＋「検索条件を変えてお試しください。」の2件（`m11-04_..._login_history.html:350` の表に3件目の記載なし） | 乖離（設計の表示メッセージ表に未記載の文言を表示）／要実機確認 | `login_history.twig:194, messages.ja.yaml:1737, messages.en.yaml:1766` | RG-032 |  |
| m11-04 | 標準 | 乖離 | フロント挙動の表示要素として「…検索結果件数、表示件数プルダウン、履歴の一覧表、ページャを表示する」と無条件に列挙（`m11-04_..._login_history.html:332`） | 乖離（設計に無い表示条件＝限定の記載欠落）／要実機確認 | `login_history.twig:125` | RG-032,RG-034 |  |
| m11-04 | 標準 | 乖離 | ページ送りの入口は `GET /%eccube_admin_route%/setting/system/login_history/{page_no}` のみ（`m11-04_..._login_hi | 乖離（入口表に無いHTTPメソッドを受理）／要実機確認 | `LoginHistoryController.php:48` | RG-017,RG-018 |  |
| m11-04 | 標準 | 乖離 | 期間の検索キーは `create_datetime_start` / `create_datetime_end` の2つのみ（`m11-04_..._login_history.html:357` 入 | 乖離（設計に無い検索キー・終了境界の意味が日単位で異なる）／要実機確認 | `LoginHistoryRepository.php:86, SearchLoginHistoryType.php:41` | RG-006,RG-007,RG-008 |  |
| m11-04 | 標準 | その他 | キーワード検索は「入力中の半角・全角スペースを除去してから部分一致条件を組み立てる」（`m11-04_..._login_history.html:343,355,360`） | [　]+/u', '', ...)` で、半角スペースに加えタブ・改行・復帰等の空白文字全般も除去する。設計の「半角・全角スペース」より広い入力が正規化される | `LoginHistoryRepository.php:52` | **乖離（除去対象が設計の記述より広い）／要実機確認** |  |
| m11-04 | 標準 | 乖離 | CSRF・なりすまし対策トークンについて正本は沈黙（バリデーション表 `m11-04_..._login_history.html:379`・エラー処理表 `:393`・表示メッセージ `:350`  | 乖離（設計の記載欠落＝沈黙）／要実機確認 | `login_history.twig:36, SearchLoginHistoryType.php:24` | §5 `要判定`（CSRF） |  |
| m11-05 | 標準 | 乖離 | 削除行の条件＝「行の ID と名称が両方 null」。正本 L342（業務ルール・削除行）「行の ID と名称が両方 null で、かつその行キーが『送信中の非空 ID 一覧』に含まれない場合、行キー | 乖離（正本内の不整合＋L342 vs 実装／意図せぬ行削除の可能性）／要実機確認 | `MasterdataController.php:151, MasterdataDataType.php:64` | RG-014 |  |
| m11-05 | 標準 | 乖離 | 「送信中の非空 ID 一覧」に `0` は含まれる（`0` は非空の ID）。正本 L342「その行キーが『送信中の非空 ID 一覧』に含まれない場合」＝含まれるなら削除しない、という保護。正本 L3 | 乖離（`0` の扱いが正本の「非空」定義と不一致・境界欠落）／要実機確認 | `MasterdataController.php:143, MasterdataControllerTest.php:370` | RG-026,RG-025(DV-02) |  |
| m11-05 | 標準 | 乖離 | 行 ID の最大長＝`eccube_int_len`（確認値 9）・十進の非負整数。正本 L344（入力項目）「行 ID／任意／`eccube_int_len`（確認値 9）、正規表現は非負整数の十進 | 乖離（設計の値域記述欠落／フォーム制約とDB列値域の不整合）／要実機確認 | `MasterdataDataType.php:49, eccube.yaml:111, AbstractMasterEntity.php:32` | RG-021(DV-03) |  |
| m11-05 | 標準 | 乖離 | `AbstractMasterEntity` 系では `GeneratedValue` は無い。正本 L359（DBカラム・メモ）「主キー。`AbstractMasterEntity` 系では `Ge | 乖離（軽微・記述の正確性／挙動影響なし） | `AbstractMasterEntity.php:34` | RG-012 |  |
| m11-05 | 標準 | 乖離 | 保存の送信先が二者択一で未確定。正本 L325（利用者視点の入口）「編集テーブルで『登録』（保存）を送信／`POST /%eccube_admin_route%/setting/system/mast | 乖離（正本の未確定記述＋誤導／保存導線は単一）／要実機確認 | `masterdata.twig:46, MasterdataController.php:36` | RG-017,RG-024 |  |
| m11-06 | 標準 | 乖離 | PHP情報の出力可否は設定パラメータで決まる — 「PHP情報カードの表示可否は設定パラメータ `eccube_phpinfo_enabled`（環境変数 `ECCUBE_PHPINFO_ENABLE | 乖離（フラグ無効時もphpinfo到達可・情報漏えい面）／要実機確認 | `system.twig:61, SystemController.php:56, eccube.yaml:13` | RG-016,017,020,021 |  |
| m11-06 | 標準 | 乖離 | 拒否URLパターンの保存値が正規表現として解釈できない場合は「例外を捕まえ、文字列の完全一致エスケープによる先頭一致検査にフォールバックする実装がある」（同:365） | 乖離（フォールバック不達・拒否失効の恐れ）／要実機確認 | `AuthorityVoter.php:57, IsAccessibleRouteExtension.php:70` | RG-031 |  |
| m11-06 | 標準 | 乖離 | DBサーバー行は「接続先プラットフォーム別の接頭辞」（同:311）で分岐する — SQLite／MySQL／それ以外のプラットフォーム名で接頭辞を切り替える（同:341）。判定手段そのものは設計が規定 | 乖離候補（将来互換・現時点の挙動差なし）／要実機確認 | `SystemService.php:56, AbstractPlatform.php:400` | RG-004(DV-01〜03) |  |
| m12-01 | カスタマイズ | 乖離 | 集計対象(各店舗)は初期設定としてログインしたユーザーが所属している店舗にチェックが入った状態で表示される（Excel `0211:L1062`・`0211:L1080`「ログインユーザーの所属店舗に | 乖離（初期チェックの要件差・TC東京所属時）／要実機確認 | `SummaryController.php:321` | RG-007 |  |
| m12-01 | カスタマイズ | 乖離 | 集計日(From)・集計日(To) の書式は 日付(yyyy/mm/dd)（Excel `0211:L1077`,`0211:L1078`）。月別の集計月は年月(yyyy-mm)（`0211:L128 | 乖離（日次の入力書式差・表示規約か受理書式かが不明確）／要実機確認 | `SummaryType.php:46` | RG-049・DV-10 |  |
| m12-02 | カスタマイズ | 乖離 | 識別ID2の項目名は「店舗名」（0211:L1921） | 乖離（Excel内部の記述不整合・列見出し未確定）／要実機確認 | `SummaryCsvExporterService.php:28` | DV-07 |  |
| m12-02 | カスタマイズ | 乖離 | 識別ID3「総売上」は通販・店舗毎の売上総件数を出力（0211:L1948）。一方 粗利益高=総売上 - 原価（0211:L1951） | 乖離（Excel内部の定義不整合・総売上の単位未確定）／要実機確認 | `SummaryCsvExporterService.php:29` | RG-008 |  |
| m12-03 | カスタマイズ | 乖離 | 集計単位に選べる軸は商品・カテゴリの2つ。支払方法・購入グループ・都道府県・性別・利用端末・年代(会員)は削除する（Excel 0211:L2135・0211:L2154「既存の下記選択肢は削除」）。 | 乖離（Excel廃止宣言の未反映）／要実機確認 | `SalesType.php:21, OrderDetailRepository.php:25` | §0・RG-011,020 |  |
| m12-03 | カスタマイズ | 乖離 | 検索項目から 生年月日・性別・都道府県・利用端末 を削除する（Excel 0211:L2122「下記の項目を削除」＋0211:L2123・性別・0211:L2125・0211:L2126） | 乖離（Excel廃止宣言の未反映）／要実機確認 | `SalesType.php:116, SalesType.php:101, SalesType.php:73` | §0 |  |
| m12-03 | カスタマイズ | その他 | 集計対象(通販) チェックボックスを追加し、チェック時は通販の売上集計を行う（Excel 0211:L2127・0211:L2148） | store | `SalesType.php:71` | smaregi |  |
| m12-03 | カスタマイズ | 乖離 | 集計日(To) の既定値は当月末日（Excel 0211:L2133「デフォルトの値を当月末日に設定」・書式 日時 yyyy/mm/dd hh:mm:ss は 0211:L2152、例 `2025-7 | 乖離（既定値の不一致・集計範囲に影響）／要実機確認 | `SalesController.php:31, SalesType.php:68, OrderDetailRepository.php:144` | RG-002 |  |
| m12-03 | カスタマイズ | 乖離 | 出力結果項目から 数量割合・合計割合・件数割合 を削除する（Excel 集計単位=商品: 0211:L2362「下記の項目を削除」＋0211:L2363・L2364・L2365／集計単位=カテゴリ:  | 乖離（Excel廃止宣言の未反映）／要実機確認 | `sales.twig:211, OrderDetailRepository.php:297` | §0・RG-030,031 |  |
| m12-03 | カスタマイズ | 乖離 | 表示件数(件数)の選択肢は 10,50,100,300,500,1000,2000,10000,12000,15000,20000（Excel 0211:L2157「1ページに表示する件数 選択肢(赤 | 乖離（選択肢の出所と値域の不一致）／要実機確認 | `SalesType.php:61` | RG-029 |  |
| m12-03 | カスタマイズ | 乖離 | キーワード検索の検索対象は 商品名(日/英)・カード名・商品コード・備考（Excel 0211:L2146）。詳細設計の集計条件も汎用ワードに備考を含める（`m12-03_admin_analytic | 乖離（検索対象の欠落・正本内不整合）／要実機確認 | `OrderDetailRepository.php:126` | RG-009 |  |
| m12-04 | カスタマイズ | 乖離 | CSV出力では表示件数の上限を適用せず、集計結果の全件を出力する（詳細設計 L301「CSV出力時に表示件数の上限を適用しないこと」／L327「件数上限」／L295「表示件数の上限を適用しない点を除き | 乖離（本機能の中核要件違反・CSVが全件にならない）／要実機確認 | `SalesAnalysisController.php:117, SalesAnalysisCsvExporterService.php:38, OrderItemRepository.php:310` | RG-006 |  |
| m12-04 | カスタマイズ | 乖離 | 文字コード判別用のBOMを付与する（詳細設計 L341）。処理順序でも「CSV出力サービスを開き、BOMを出力する」→「ヘッダ行を出力する」（L324 順序6-7）。現行は無条件にBOMを書く（`pf | 乖離（BOM欠落・文字化け）／要実機確認（当該環境の encoding 設定値） | `SalesAnalysisCsvExporterService.php:41, CsvExportService.php:267` | RG-009 |  |
| m12-04 | カスタマイズ | 乖離 | 検索条件セッションが空のときは、空の検索条件で集計し、出力する（詳細設計 L357 エラー処理）。処理順序も「保存が無い場合は空とする」（L324 順序2） | 乖離（設計のエラー処理と逆・出力されない）／要実機確認 | `SalesAnalysisController.php:100, SalesController.php:90` | RG-018 |  |
| m12-04 | カスタマイズ | 乖離 | 集計単位が商品かどうかを判定する（詳細設計 L324 順序4）。ヘッダ/データ行は「集計単位が商品なら先頭に商品コード・商品名、それ以外は集計単位の見出し1列」（L331）。現行の判定は商品との等値（ | 乖離（集計単位判定の反転・ヘッダ列数が仕様と不一致）／要実機確認 | `SalesAnalysisCsvExporterService.php:37, OrderItemRepository.php:198` | RG-011,012,018 |  |
| m12-04 | カスタマイズ | 乖離 | カスタマイズ要件に記載の内容以外は現行踏襲とする（Excel 0211:L2767）。カスタマイズ要件は出力結果項目の削除（0211:L2773-2777）とスマレジ（0211:L2778-2780） | 乖離（現行踏襲違反・集計単位6軸の消失）／要実機確認 | `SalesType.php:51, OrderItemRepository.php:198` | RG-012,007 |  |
| m12-04 | カスタマイズ | 乖離 | 出力結果項目の先頭は「商品コード」（Excel 識別ID1・0211:L2753／6項目＝0211:L2750-2758）。Excel優先ルールでは項目名がExcel正 | 乖離（Excel項目名 vs 詳細設計・現行のヘッダ文言／要実機確認・要仕様確定） | `SalesController.php:106, SalesAnalysisCsvExporterService.php:71, messages.ja.yaml:6227` | RG-011 |  |
| m12-04 | カスタマイズ | 乖離 | 本店のほか、支店やスマレジの取引情報も集計対象として取り扱う（Excel 0211:L2780）。現行は店舗による集計対象の絞り込みを持たない（`pf-eccube3/app/Plugin/Harer | 乖離（集計対象の絞り込みが設計に無い／0行化の危険）／要実機確認 | `SalesAnalysisController.php:112, OrderItemRepository.php:226` | RG-016,025 |  |
| m12-04 | カスタマイズ | 乖離 | 入口は `GET /{admin_route}/analysis/sales/export`（詳細設計 L316） | 乖離（現行のみ・メソッド無制限）／要実機確認 | `AnalysisServiceProvider.php:43, SalesAnalysisController.php:97` | RG-001 |  |
| m12-04 | カスタマイズ | 乖離 | 本機能は画面上の入力フォームを持たない。出力する検索条件は検索条件セッションの値による（詳細設計 L332）＝送信トークンの検証対象を持たない | 乖離（デッドコード相当・CSRF指定の無効化／設計はフォームを持たないと規定）／要実機確認 | `SalesController.php:91, SalesType.php:48, FormUtil.php:65` | §5 CSRF(要判定) |  |
| m12-04 | カスタマイズ | 乖離 | データ取得失敗時はアプリケーションの共通例外処理に委ねる（詳細設計 L341,L357）。CSV出力はストリーミングで行う（L338） | 乖離（現行のみ・失敗時に共通例外処理へ委ねられない）／要実機確認 | `SalesController.php:133, SalesAnalysisCsvExporterService.php:41` | RG-019 |  |
| m12-05 | カスタマイズ | 乖離 | 検索画面初期表示では検索条件セッションを破棄する（詳細設計 `function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_ar | 乖離（現行踏襲違反・セッション残存によるCSV誤抽出）／要実機確認 | `ProductRequestController.php:48` | RG-002,004 |  |
| m12-05 | カスタマイズ | 乖離 | 販売金額Toの境界は現行踏襲＝未満（`<`）（現行 `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.p | 乖離（現行踏襲違反・境界の含み方が変化）／要実機確認 | `DtbProductRequestRepository.php:361` | RG-012（DV-10） |  |
| m12-05 | カスタマイズ | 乖離 | 検索時に論理削除フィルタを無効化する（詳細設計 L331,L334,L343）。副作用は検索条件セッションへの保存と論理削除フィルタの無効化（L352）。現行は `pf-eccube3/app/Plu | 乖離（副作用の非発生・現行踏襲差）／要実機確認 | `ProductRequestController.php:64, DtbProductRequestRepository.php:319` | RG-005 |  |
| m12-05 | カスタマイズ | その他 | 検索実行時に検索条件を検索条件セッションへ保存する（詳細設計 L331 の処理フローは送信値取り込み→セッション保存→フィルタ無効化→検索の順で、保存を検索成否と独立に置く。現行 `pf-eccube | \ | `ProductRequestController.php:69` | !$searchForm->isValid()) { ret |  |
| m12-06 | カスタマイズ | 乖離 | 検索条件セッションが空のときは空の検索条件で抽出し、出力する（Excel `0211:L3544`／処理フロー `0211:L3511`「保存が無い場合は空とする」／詳細設計HTML L324,L35 | 乖離（設計違反・エラー処理の分岐差）／要実機確認 | `ProductRequestController.php:96` | RG-021 |  |
| m12-06 | カスタマイズ | 乖離 | CSV出力項目は識別ID表の 商品ID・言語ID・商品名・通知待ち・通知済み/削除（Excel `0211:L3438`〜`0211:L3445`）。カスタマイズ要件に記載の内容以外は現行踏襲（`02 | 乖離（現行=カスタマイズ未反映／詳細設計HTMLがカスタマイズ要件と競合）／要実機確認 | `RequestController.php:15, DtbProductRequestRepository.php:132, ProductRequestCsvExportService.php:24` | RG-001〜006,013 |  |
| m12-06 | カスタマイズ | 乖離 | 入口は GET `/{admin_route}/analysis/request/export`（Excel `0211:L3503`／詳細設計HTML L316） | 乖離（入口パス差・設計の記載と不一致）／要実機確認 | `ProductRequestController.php:92, AnalysisServiceProvider.php:53` | RG-027 |  |
| m12-06 | カスタマイズ | 乖離 | 大量件数の出力は抽出結果を1件ずつ反復しながら出力する（Excel `0211:L3518`）＝件数による打ち切りの規定なし。CSV出力はストリーミング（`0211:L3525`） | 乖離（CSVが表示件数で打ち切られる懸念・全件化の意図が不達）／要実機確認 | `DtbProductRequestRepository.php:241, RequestController.php:91, DtbProductRequestRepository.php:126` | RG-015 |  |
| m12-07 | カスタマイズ | 乖離 | フォーマット（売上分析タグ）は `rank` の昇順で並べ、その後に「その他(カード)」「その他」を加える（詳細設計 `:317`,`:337`＝Excel沈黙部の現行踏襲補完） | 乖離（フォーマット列順が rank 昇順にならない）／要実機確認（vendor未取得のため実行確認が必要） | `FormatSalesController.php:72, MtbTagSalesAnalysisRepository.php:13, TagSalesAnalysisController.php:32` | RG-022 |  |
| m12-07 | カスタマイズ | 乖離 | 集計月は必須（Excel 画面項目 必須〇 `0211:L3617`）。「未入力では送信できない」（詳細設計 `:361`）・「本フォームの集計月は未入力不可とする」（`:340`） | 乖離（必須検証がサーバ側で効かない）／要実機確認 | `FormatSalesType.php:20, FormatSalesController.php:39, FormatSalesType.php:26` | RG-009・DM-03 |  |
| m12-07 | カスタマイズ | 乖離 | 売上分析タグが紐づかない売上は「その他(カード)」「その他」の2区分に集計する（詳細設計 `:317`,`:333`,`:342`） | 乖離（タグ無し売上の欠落可能性）／要実機確認（全商品に dtb_product_sub 行が存在するか） | `OrderRepository.php:1697, DtbProductSub.php:85` | RG-015,016,017 |  |
| m12-07 | カスタマイズ | 乖離 | 正本（Excel M12-07・詳細設計HTML）は CSRF トークンの有無・検証を規定しない（設計沈黙＝§5で `要判定`） | 設計沈黙・実装はCSRF未描画/未検証／要仕様確認・要実機確認（乖離判定にはCSRF方針の確定が必要） | `format_sales.twig:23, FormatSalesController.php:39` | §1・§5（CSRF=要判定） |  |
| m12-08 | カスタマイズ | 乖離 | 入口は `POST /{admin_route}/analysis/format_sales/export`（詳細設計 `...csv_export.html:316`／Excel 0211:L403 | 乖離（設計違反・入口メソッド/パスの差）／要実機確認 | `FormatSalesController.php:98, AnalysisServiceProvider.php:63, format_sales.twig:23` | RG-001,034 |  |
| m12-08 | カスタマイズ | 乖離 | 「CSVダウンロード」押下時は画面遷移せずCSVを出力する（詳細設計 `...csv_export.html:320,354`／Excel 0211:L4034,L4068）。エラー処理は集計月未入力 | 乖離（設計違反・画面遷移/エラー種別の追加）／要実機確認 | `FormatSalesController.php:103` | RG-019,026,027 |  |
| m12-08 | カスタマイズ | 乖離 | 本機能は集計月のみを入力とし、その他の入力項目に紐づく表を持たない（詳細設計 `...csv_export.html:332`／Excel 0211:L4046）。入力は送信された集計月（`...cs | 乖離（設計と実装の不一致・M12-08への集計対象指定の波及がオラクル未確定）／要実機確認・人手判断 | `FormatSalesType.php:48, FormatSalesController.php:112, OrderRepository.php:1880` | RG-040, DV-07 |  |
| m12-08 | カスタマイズ | 乖離 | 集計月は必須のため、未入力では送信できない（詳細設計 `...csv_export.html:357`／Excel 0211:L4071。M12-07 も「未入力では送信できない」0211:L3715 | 乖離（設計違反・必須検証の欠落／未入力時の挙動が共通例外処理か否か不明）／要実機確認 | `FormatSalesController.php:157, FormatSalesController.php:109` | RG-023, DV-05 |  |
| m12-09 | 現行踏襲 | 乖離 | ナビの入口は「デッキ採用枚数集計」（詳細設計 L321,L361） | 乖離（ナビ名称が詳細設計と不一致・Excel機能名とは一致＝設計間の不整合）／要実機確認・仕様確認 | `SidebarProvider.php:336, eccube_nav.yaml:297, messages.ja.yaml:6243` | RG-001 |  |
| m12-09 | 現行踏襲 | その他 | `{mode}`は出力形式を表す（詳細設計 L322）。想定外値の扱いは Excel・詳細設計とも規定なし | simple$'` でアンカーが片側のみ（`^product` または `simple$`＝"simpl"+"e"の0回以上）＝想定外値を通し得る — `pf-eccube3/.../ServiceProvider/Admin/Analys | `—` | **乖離候補（不正mode時の挙動が未定義・オラクルも不在） |  |
| m12-10 | 現行踏襲 | 乖離 | 出力条件をセッションに保持し、CSV出力に引き継ぐ。副作用＝「出力条件のセッション保持」（詳細設計 L334,L337,L342,L348,L363／Excelは沈黙のため現行踏襲 0211:L430 | 乖離（現行踏襲違反・セッション保持と引き継ぎの喪失／設計の副作用・遷移前後の状態が成立しない）／要実機確認 | `UsedCardController.php:14, UsedCardController.php:41` | RG-002,004,005,014 |  |
| m12-10 | 現行踏襲 | その他 | CSVダウンロードは形式指定（`GET /{admin_route}/analysis/used_card/export/{mode}`・`{mode}` は出力形式）で、形式ごとに集計方法・ヘッダ・ | simple$')`）／`UsedCardController.php:16-69`（`EXPORT_DATA` に `product`＝Excel同一の17列ヘッダ `:19-37` と `simple`＝「カード名・採用枚数」の2列 ` | `AnalysisServiceProvider.php:71` | **乖離（現行踏襲違反・形式別出力/略式CSVの喪失）／要実 |  |
| m12-10 | 現行踏襲 | 乖離 | 「検索」は集計結果画面（`admin_used_card_result`）へ遷移して集計結果を表示し、条件をセッションに保持する。CSVダウンロードは画面遷移せずCSVを出力する（`admin_use | 乖離（現行踏襲違反・集計結果画面の喪失／画面遷移表と不一致）／要実機確認 | `AnalysisServiceProvider.php:67, UsedCardController.php:96, UsedCardController.php:52` | RG-003,023 |  |
| m12-10 | 現行踏襲 | 乖離 | 入口URLは `/{admin_route}/analysis/used_card`（アンダースコア）、ルート名は `admin_used_card`／`admin_used_card_result` | 乖離（現行踏襲差・URL/ルート名の変更）／要実機確認 | `AnalysisServiceProvider.php:67, UsedCardController.php:39` | RG-001,003,005,023 |  |
| m12-10 | 現行踏襲 | 乖離 | 入力に「なりすまし対策トークン」を含む（詳細設計 L348） | 乖離（設計と実装の不一致・CSRFトークン不在／現行内部でも検索とCSV出力でフォーム定義が不整合）／要実機確認 | `UsedCardType.php:19, UsedCardController.php:124, SearchUsedCardType.php:34` | RG-018,024 |  |
| m13-01 | カスタマイズ | 乖離 | イベント名検索は「分割した各語について4列への部分一致をORで結び、語ごとの条件をANDで結ぶ」（詳細設計 L350＝Excel沈黙部の現行踏襲補完・Excel `0214:L1054` は「部分一致 | 乖離（詳細設計の記述と実装の不一致＝詳細設計側の誤り疑い）／要実機確認 | `DtbEventRepository.php:55, DtbEventRepository.php:83` | RG-003・§3 DV-11 |  |
| m13-02 | カスタマイズ | 乖離 | クレジットカード決済をオフで更新時、紐づく日程に参加費が有料かつオンライン受付ありの日程が存在すればエラー（Excel 0214:L1607） | 乖離（カスタマイズ未達・新規要件） | `EventController.php:115` | RG-007 |  |
| m13-03 | 現行踏襲 | 乖離 | 戻る/イベント編集ボタン: 識別ID:23 は「イベント編集」でイベント編集画面へ遷移する（Excel 0214:L2222）。ボタンの位置を画面下部に移動し、「戻る」は前の画面名を表示する（0214 | 乖離（カスタマイズ注記のボタン表示名 未反映・軽微）／要実機確認 | `schedule.twig:242` | RG-011 |  |
| m13-04 | 現行踏襲 | 乖離 | 受付ありの場合、受付終了時間（entryEndDate）は受付終了時刻から生成して保存すべき（Excel 0214:L2477・正本 L346 entry_flg/日程作成） | 乖離（実装バグ・pf／enterpriseで修正済み） | `RepeatScheduleController.php:104, RepeatScheduleStoreAction.php:70` | RG-007 |  |
| m13-04 | 現行踏襲 | 乖離 | デッキ登録締切開始日前日数・オンライン受付各開始日前日数は数値（整数）（Excel 0214:L2479,L2482,L2484） | 乖離（実装バグ・制約型の誤用）／要実機確認 | `RepeatScheduleType.php:112` | DV-07,DV-08 |  |
| m13-04 | 現行踏襲 | 乖離 | 受付終了時間 <= 開始時間であること（Excel 0214:L2477・等号を含む） | 乖離疑義（境界差・過剰実装）／要実機確認 | `RepeatScheduleType.php:68` | RG-008,DV-05 |  |
| m13-04 | 現行踏襲 | その他 | 設計（オラクル） |  | `—` |  |  |
| m13-04 | 現行踏襲 | その他 | 定員・参加費・公開状態・商品(日英)は親イベントのものをセット（Excel 0214:L2459） |  | `DtbEventDetail.php:166` |  |  |
| m13-04 | 現行踏襲 | その他 | 期間内の選択曜日に該当する日に日程作成（Excel 0214:L2457,L2458） |  | `RepeatScheduleController.php:90` |  |  |
| m13-04 | 現行踏襲 | その他 | 存在しないイベントIDは404（正本 L325,L358） |  | `RepeatScheduleController.php:54` |  |  |
| m13-04 | 現行踏襲 | その他 | 申込受付有効で支払い方法未設定なら申込受付不可（正本 L328,L358） |  | `RepeatScheduleController.php:73` |  |  |
| m13-05 | カスタマイズ | 乖離 | 識別ID:1-11「定員」の最大値は8字（Excel `0214:L2782`。参加費も8字＝`0214:L2785`） | 乖離（最大桁数の相違）／要実機確認 | `EventType.php:149, eccube.yaml:111, eccube.yaml:126` | RG-041(DV-M21) |  |
| m13-05 | カスタマイズ | 乖離 | 複製新規の入口は GET `/%admin_route%/event/{duplicateId}/duplicate`（ルート名 `admin_event_duplicate`）で、duplicate | 乖離（入口URL・ルート名・ID制約の相違）／要実機確認（id=0・007 の応答） | `EventController.php:245` | RG-001,039 |  |
| m13-05 | カスタマイズ | 乖離 | 識別ID:2-3「備考(日)」・2-4「備考(英)」は全角・半角の任意項目で最大4096字（Excel `0214:L2789`,`0214:L2790`）。詳細設計 `m13-05_...html: | 乖離（Excel規定項目の欠落／対応関係が要設計確認）／要実機確認 | `EventType.php:76` | RG-003(DV-C17,C18),041(DV-M13, |  |
| m13-06 | カスタマイズ | その他 | 検索の並び順が ASC／DESC 以外なら並び順エラー（ロケールキー `admin.error.sort`）を表示し初期表示へ戻す（詳細設計 L367,L397,L401＝Excel沈黙部＝現行踏襲・ | DESC | `SearchControllerTrait.php:140` | asc |  |
| m13-06 | カスタマイズ | 乖離 | デッキ登録を検索時に操作不可とするのは 申込状況（0214:L3045）・支払方法（0214:L3046）・支払番号（0214:L3047）の3項目。デッキ登録有無（0214:L3051）には操作不可 | 乖離（Excel指定外の項目まで操作不可＝デッキ登録有無で絞り込めない）／要実機確認 | `entrylist.js:104, EntryListType.php:48` | RG-047,010 |  |
| m13-07 | 現行踏襲 | 乖離 | 履歴記録の単位は Excel優先＝変更された申込の申込履歴を追加する（`0214_基本設計仕様書(イベント管理).html:3681`） | 乖離（詳細設計 L347 の記述誤り・L326/L332 と競合／Excel L3681 の限定「変更された申込」が詳細設計に反映されていない）／要実機確認（「変更された」の判定基準がExcel未規定） | `DtbEntryHistoryRepository.php:31, DtbEntryHistoryRepository.php:42` | RG-016,017,021 |  |
| m13-07 | 現行踏襲 | 乖離 | 対象申込は必須で一括対象の申込ID群である（`m13-07_admin_event_event_entry_bulk_update.html:334`）。一括変更の対象は一覧検索結果でチェックされた申 | 乖離（設計の必須（L334）に対し現行はサーバ側検証を持たず、対象0件でも完了応答＝設計と不一致）／要実機確認 | `BulkUpdateType.php:20, EntryController.php:607, EntryController.php:326` | RG-010 |  |
| m13-07 | 現行踏襲 | 乖離 | 指定された申込IDの申込を取得する（`m13-07_admin_event_event_entry_bulk_update.html:326` 第4段）。存在しないIDが混入した場合の扱いはExcel | 乖離（現行踏襲差・部分成功 vs 全体拒否／設計が沈黙のため意図オラクル未確定）／要実機確認 | `EntryController.php:607, EntryStatusBulkUpdateAction.php:37, EntryController.php:323` | RG-018 |  |
| m13-09 | カスタマイズ | 乖離 | イベント詳細指定 `GET /{admin_route}/entry/{eventDetailId}/export` は「指定したイベント詳細を対象に申込情報をCSVとしてダウンロードする」（詳細設計 | 乖離（設計どおり絞られない疑い）／要実機確認 | `EntryServiceProvider.php:47, EntryController.php:814, DtbEntryPlayerRepository.php:82` | RG-002 |  |
| m13-09 | カスタマイズ | 乖離 | Excelカスタマイズ要件「席順の項目を削除する」「DCIナンバーの項目を削除する」「DCI確認フラグの項目を削除する」（0214:L4103-4105）＝識別ID:10/24/32 を「CSV出力項 | 乖離（データ設定依存・未設定なら要件違反で3項目が出力される）／要実機確認（本番 dtb_csv.enable_flg の実値確認が必須） | `Version20180514185400.php:66` | RG-009（§3 DI-10,24,32） |  |
| m13-10 | カスタマイズ | その他 | 権限を保持している店舗のイベントの申込のみ編集可（Excel `:4293,:4301`）。かつ 削除(2-3)・検索(2-4)・登録(3-1)・同日程の新規申込へ(3-2) は権限を保持している店舗 | Store\ | `EntryController.php:330` | shop"` の該当は一覧検索の絞り込み `:201,:24 |  |
| m13-10 | カスタマイズ | 乖離 | プレイヤー検索は会員の姓・名、プレイヤーの姓・名いずれかに部分一致したら表示する（Excel `:4361-:4362`）。DCIナンバーは廃止（Excel `:4296,:4310,:4356,:4 | 乖離（一致対象がExcel規定より広い／廃止項目が検索に残存）／要実機確認 | `DtbPlayerRepository.php:63` | RG-033・DV-07〜11 |  |
| m13-10 | カスタマイズ | 乖離 | 入口は 詳細表示 `GET /%eccube_admin_route%/entry/{eventEntryId}/edit`／更新送信 `GET/POST /%eccube_admin_route%/ | 乖離（URL構成・HTTPメソッドが現行踏襲から変化）／要実機確認 | `EntryController.php:259, EntryRegistrationController.php:203` | RG-001,017,038 |  |
| m13-11 | 現行踏襲 | 乖離 | 店舗は複数選択（Excel 0214:L4571,L4578,L4589「複数選択」「選択肢:全店舗」） | 乖離（モーダル版が本機能の画面に該当する場合は複数選択要件に不一致）／要実機確認 | `EventListType.php:62, EntryRegisterSearchType.php:45, SearchEntryEventModalType.php:45` | RG-002,010・DV-05 |  |
| m13-11 | 現行踏襲 | 乖離 | イベント名は部分一致検索とする（Excel 0214:L4580,L4588） | 乖離（現行踏襲違反・部分一致の検索対象列の縮小）／要実機確認 | `DtbEventDetailRepository.php:246, DtbEventRepository.php:162` | RG-001・DV-01 |  |
| m13-11 | 現行踏襲 | 乖離 | オンライン受付ありの日程のみ検索対象とする（Excel 0214:L4748） | 乖離（現行=検索対象の限定がパラメータ依存＝限定が外れうる）／要実機確認 | `EntryController.php:205, DtbEventDetailRepository.php:260, entryselect.js:31` | RG-005 |  |
| m13-11 | 現行踏襲 | 乖離 | 非同期リクエストでない場合は空の検索結果でモーダル枠のみ表示する（詳細設計 L320,L364／Excel 0214:L4646,L4690） | 乖離（実装不備・非同期でない要求で未定義変数参照が発生）／要実機確認 | `EntryController.php:182` | RG-026 |  |
| m13-11 | 現行踏襲 | 乖離 | 入口は `POST /{admin_route}/entry/search/event/html`・`GET /{admin_route}/entry/search/event/html/{page_ | 乖離（入口URL・HTTPメソッド・非同期方式の変更＝詳細設計の記述と不一致）／要実機確認 | `EntryServiceProvider.php:35, EntryController.php:389, EntryRegistrationController.php:64` | RG-022,023,024,030 |  |
| m13-12 | カスタマイズ | 乖離 | 支払金額の初期値はイベントの参加費（詳細設計 `m13-12_admin_event_event_entry_register.html:349`「支払金額 初期値はイベントの参加費」／`:351`。 | 乖離（初期値の取得元が イベント→イベント詳細 へ変化・日程個別参加費の反映有無が変わる）／要実機確認 | `EntryController.php:447, EventEntryDetailType.php:143, DtbEventDetail.php:260` | RG-005,023 |  |
| m13-13 | カスタマイズ | 乖離 | 日程情報のオンライン受付は「あり」で有効とする（詳細設計 `function_spec_html_preview/pf-eccube3/m13-13_admin_event_event_entry_c | 乖離（オンライン受付の有効化が反映されない）／要実機確認 | `BulkEntryImportHandler.php:373, DtbEventDetail.php:51, DtbEventDetail.php:840` | RG-027,024／DV-05 |  |
| m13-13 | カスタマイズ | 乖離 | ヘッダ行は雛形の見出し名と一致する必要があり、不一致はフォーマットエラーとして前提検証で「CSVのフォーマットが一致しません。」を表示する（詳細設計 `m13-13_admin_event_event | 乖離（前提検証の検出条件・メッセージ・検出段階が設計と不一致）／要実機確認 | `CsvImporter.php:190, MessageStore.php:75, CsvImportService.php:203` | RG-011,010 |  |
| m13-13 | カスタマイズ | その他 | エラーが無く中断もなければコミットし、そうでなければロールバックする（詳細設計 `:335`）。エラーまたは中断があれば全件ロールバック・部分コミットはしない（`:351,389`） | \ | `CsvImporter.php:272` | !$hasBreak;` は「エラーなし **または** 中 |  |
| m13-13 | カスタマイズ | 乖離 | 行・列に応じた取込エラーは行番号・列名を含むメッセージを行ごとに列挙する（詳細設計 `:374`） | 乖離（エラーメッセージの内容不整合）／要実機確認 | `RequireWhenYesValidator.php:63` | RG-033／DV-04,05 |  |
| m13-13 | カスタマイズ | 乖離 | 行数上限の判定条件は「行数が上限（確認値5000行）以上」（詳細設計 `:333,338`）。一方、表示文言は「（上限）行を超えるCSVファイルは登録できません。」（`:374`）で境界の含み方が逆＝ | 乖離（境界の文言と条件の不一致・行数の数え方が改行依存／環境依存）／要実機確認 | `EntryController.php:670, CsvImporter.php:138` | RG-009／DV-11,12,13 |  |
| m13-14 | 現行踏襲 | 乖離 | 店舗指定時は当該店舗に絞り込んだバナーを表示する（詳細設計 `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner | 乖離（設計記述と実装の不一致・絞り込み機能の不成立）／要実機確認 | `BannerController.php:103, BannerController.php:176` | RG-019,036 |  |
| m13-14 | 現行踏襲 | 乖離 | バナーの「削除」は DELETE /{admin_route}/banner/event/delete で指定したバナーを削除する（詳細設計 `:318`,`:330`。副作用も「バナーの作成・更新・ | 乖離（設計記述の誤り・削除対象の取り違え／設計書内不整合）／要実機確認 | `BannerController.php:132, banner.twig:211, BannerController.php:121` | RG-021,022,016 |  |
| m13-14 | 現行踏襲 | その他 | 並び順（識別ID:10）の制限は 数値(整数)・必須〇 のみ。Excel `:5623` の最大値列は空欄で、範囲（1〜15）の規定は無い |  | `EventBannerSettingType.php:204` | $sortNo > $slotCount)` で `admi |  |
| m13-14 | 現行踏襲 | 乖離 | 並び順の空欄・重複は バナー設定ボタン押下時にアラートを表示し、保存させない（Excel `:5605`,`:5606`） | 乖離（現行踏襲差・エラー提示経路の追加）／要実機確認 | `banner.twig:31, banner.twig:84, EventBannerSettingType.php:191` | RG-008(DV-10,DV-11) |  |
| m13-14 | 現行踏襲 | 乖離 | 画像URL（識別ID:4）を空欄にしたバナーは フロントでは表示されない（Excel `:5602`）。保存値（表示タイプ 識別ID:8）の書き換えは規定していない（Excel `:5621` は選択 | 乖離（現行踏襲違反・管理者の選択値が書き換わる）／要実機確認 | `EventBannerStoreAction.php:62, BannerController.php:313` | RG-033,011 |  |
| m13-14 | 現行踏襲 | 乖離 | リンク先URL（識別ID:5）の書式・制限は 半角、最大値255文字（Excel `:5618`） | 乖離（現行=Excel「半角」未適合・検査の実質不成立）／要実機確認 | `BannerType.php:74, EventBannerSettingType.php:107` | RG-006 |  |
| m13-14 | 現行踏襲 | 乖離 | 権限は 未ログイン=アクセス不可／ログイン済み管理者=設定・更新・削除が可能（詳細設計 `:354`）。店舗単位の可否は規定していない | 乖離（設計に無い店舗別認可の追加・現行踏襲差）／要実機確認 | `BannerController.php:134, BannerController.php:132` | RG-029,028 |  |
| m13-14 | 現行踏襲 | 乖離 | 並び順（識別ID:10）は 必須の入力項目（Excel `:5623`）だが、詳細設計 `:348` のDBカラム（image_url・link・disp_type・image_alt・店舗／言語の関 | 乖離（設計の沈黙・並び順の保存有無と再表示値が正本から追跡不能）／要実機確認 | `BannerController.php:291, EventBannerStoreAction.php:49, banner.twig:114` | RG-008,RG-038 |  |
| m13-15 | カスタマイズ | 乖離 | 画像一覧は更新日付の降順で表示する（詳細設計 L331,L338,L347＝Excel沈黙部の補完・0214:L5784により現行踏襲） | 乖離の疑い（一覧整列キー）／要実機確認（実データでの並びを実測して確定） | `BannerController.php:77` | RG-004 |  |
| m13-15 | カスタマイズ | 乖離 | アップロード失敗時も、店舗絞り込みは当該店舗フォルダ配下のみ参照し（詳細設計 L347）、一覧は更新日付降順・上限2000件で表示する（L331,L338,L347） | 乖離（失敗再描画時の一覧が設計と不一致）／要実機確認 | `BannerController.php:267` | RG-035,005,002 |  |
| m14-01 | カスタマイズ | 乖離 | ★(17)「禁止カードも表示する」を除去する（(16)リーガリティで同機能を実装するため）（Excel 0208:L1032,L1033,L1034,L1093） | 乖離（現行で未除去・詳細設計HTMLがExcelの除去要件と矛盾）／要実機確認 | `SearchCardType.php:151, MtbCardRepository.php:151` | RG-024 |  |
| m14-01 | カスタマイズ | 乖離 | 検索フォームは CSRF 保護を明示的に無効にした型定義（Excel沈黙のため 0208:L1030 の現行踏襲により詳細設計 `…m14-01_admin_card_card_search.html | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `SearchCardType.php:20, SearchCardType.php:208` | RG-054 |  |
| m14-01 | カスタマイズ | その他 | ソート順が ASC/DESC のいずれでもないとき、フラッシュに `admin.error.sort` を積み、セッション初期化と同一の一覧表示へ戻す（Excel は昇順/降順の組み合わせのみ規定＝0 | DESC | `SearchControllerTrait.php:140` | asc |  |
| m14-02 | カスタマイズ | 乖離 | 28「プロモ種別」（`0208:L1754`） | 乖離（現行・項目名不一致／論理キーはオラクル未規定）／要実機確認 | `CardCsvController.php:161, CardCsv.php:94` | RG-010／DDT-A #28 |  |
| m14-03 | 現行踏襲 | その他 | `cardIds` の各要素が空文字相当、またはカードマスタが取得できないとき HTTP 404 で打ち切る（L326 手順5・L334 順序3・L360・L371「対象カード不在 HTTP 404」 |  | `CardController.php:327, CardController.php:179` | !$mtbCard = $app['hareruya_ec. |  |
| m14-03 | 現行踏襲 | 乖離 | 削除完了後（およびブロック時は部分削除分）に支店連携サービスへ更新通知を送り、成功は情報ログ、失敗は支店連携エラーテーブルへ追記して `flush` する（L326 手順11・L341・L344・L3 | 乖離（現行踏襲違反・外部連携の欠落＝支店側にカード削除が伝播しない）／要実機確認 | `CardController.php:309, InventoryReflectService.php:111, ProductPriceImportHandler.php:88` | RG-023,024,025,026,027 |  |
| m14-04 | カスタマイズ | 乖離 | 更新 POST でパス ID のカードが無い場合は HTTP 403、編集 GET で対象が無い場合は HTTP 404 と、両者を区別する（詳細設計 `m14-04_...html:329`（手順3 | 乖離（現行踏襲違反・エラーステータスの区別喪失）／要実機確認 | `CardController.php:192` | RG-027,003 |  |
| m14-04 | カスタマイズ | 乖離 | セッションキーは `admin.card.search.page_no` を読み、戻る・削除後のリダイレクト先ページ番号に使う（詳細設計 `m14-04_...html:333`・`:389`。Exc | 乖離（内部差・セッション互換）／要実機確認 | `CardController.php:53` | RG-021,049 |  |
| m14-05 | カスタマイズ | 乖離 | 取込の判定順序は 1 CSRF・フォーム・ファイル必須・サイズ・MIME → 2 一時保存とCsvImportService構築 → 3 ヘッダ完全一致 → 4 データ1行以上 → 5 列数一致 →  | 乖離（設計未記載の上限・5010行以上のカードCSVが取込不可）／要実機確認（設計に上限が無い以上、業務上の想定行数と 5010 の妥当性は要確認。設計書への追記が必要） | `CardCsvController.php:102, AbstractController.php:364, ProductShelfNumberCsvController.php:38` | RG-011,013,014 |  |
| m14-05 | カスタマイズ | 乖離 | Excel は CSV 各列に最大文字数または最大値を規定（`0208:2457` name_jp=255／`0208:2461` text_jp=1024／`0208:2463` mana_cost | 乖離（Excelの最大文字数が取込で検証されない・超過時はDB側エラーか切り詰めに委ねられる）／要実機確認 | `—` | RG-010（§3-5 DL-06） |  |
| m14-06 | 現行踏襲 | 乖離 | page_no がURLに無いルートへGETで入り、かつ `resume` が整数1でないとき、セッション `eccube.admin.cardset.page_no`／`.pageCount`／`. | 乖離（現行踏襲違反・セッション初期化機構の欠落）／要実機確認 | `CardsetController.php:52` | RG-001,007（DV-13〜15） |  |
| m14-06 | 現行踏襲 | 乖離 | 並び順は定義済み4文言（リリース日(降順)/リリース日(昇順)/セット英名(降順)/セット英名(昇順)）と完全一致する場合のみ採用し、4文言以外は無視する（Excel `:2613`・詳細設計 `m1 | 乖離（現行踏襲違反・不正値の非無視／未検証値のセッション保存）／要実機確認 | `CardsetController.php:55, MtbCardsetRepository.php:172` | RG-006,032（DV-07〜12） |  |
| m14-06 | 現行踏襲 | 乖離 | 表示件数クエリは `pageCount` で受け、mtb_page_max.name と文字列一致する場合のみ採用しセッション `eccube.admin.cardset.pageCount` へ保存 | 乖離（現行踏襲差・パラメータ名/セッションキー/URL互換）／要実機確認 | `CardsetController.php:81, Version20260527100000.php:34, eccube.yaml:142` | RG-005,027,028（DV-01〜06） |  |
| m14-07 | 現行踏襲 | 乖離 | 確認ダイアログで 8.「実行」を選択（Excel 0208:L2893／言語別 0208:L3143）したとき 9.カードセットを登録されていないカード画像をzipファイルでダウンロードする（0208 | 乖離（実装誤記・未選択DL経路が偶然動作に依存）／要実機確認 | `card_set.twig:26` | RG-034 |  |
| m14-07 | 現行踏襲 | 乖離 | ZIP を「zipファイルでダウンロードする」（Excel 0208:L2844,L2846）＝ダウンロード応答として正しいMIMEを返す | 乖離（実装誤記・不正MIME）／要実機確認 | `CardSetController.php:377` | RG-021 |  |
| m14-07 | 現行踏襲 | 乖離 | ホイル画像は ZIP に 含める（Excelのフォルダ構成例が `F177252.jpg`／`F177253.jpg` を ZIP 内に示す＝0208:L2850,L2851,L3100。`F` はホ | 乖離（コメント陳腐化・実装はExcel適合＝仕様変更時の誤読リスク）／要実機確認 | `CardSetController.php:280, S3AccessService.php:187` | RG-004 |  |
| m14-07 | 現行踏襲 | 乖離 | 実在しないカードセットIDは「ダミーのプロモーション集合として扱い、プロモーション名（英字）ごとに `download/{その英字}` を作成する」（詳細設計 `...:330`）。Excelは未選択 | 乖離（未初期化変数・前ループ残値のディレクトリへ混入し得る）／要実機確認 | `CardSetController.php:311, MtbCardDetailRepository.php:355` | RG-025（DV-08） |  |
| m14-07 | 現行踏襲 | 乖離 | 作業ディレクトリ `download` の後片付けは両ルートで対称であるべき（Excelは沈黙。詳細設計 `...:336` が非対称を明記） | 乖離（非対称・作業ファイル残置）／要実機確認 | `event.yml:23, CardSetEvent.php:21, CardSetController.php:411` | RG-019 |  |
| m14-07 | 現行踏襲 | 乖離 | 本機能の副作用として `mtb_card_image.dead_link_flg` を更新する（詳細設計 `...:330`「デッドリンクフラグが偽なら真へ更新して即時永続化する」／`...:356` | 乖離（設計書内矛盾・L361が誤り）／設計書修正要 | `CardSetController.php:344` | RG-016, RG-017 |  |
| m14-07 | 現行踏襲 | 乖離 | `admin.download.card.not_found` には当該カード詳細のIDを埋め込む（詳細設計 `...:330`「カード詳細 ID を埋め込む」） | 乖離（実装の脆弱性・スコープ漏れ依存）／要実機確認 | `CardSetController.php:360` | RG-013 |  |
| m14-08 | カスタマイズ | 乖離 | 略称が正規表現 `/^[\x01-\x7E]+$/` にマッチしない場合「半角文字のみ使用可能です。」と表示（Excel 0208:L3360・現行 `pf-eccube3/app/Plugin/Ha | 乖離（Excel明示文言との差・どのドメインが表示されるかも要確認）／要実機確認 | `CardsetType.php:91, validators.ja.yaml:140, messages.ja.yaml:4506` | RG-012(DV-10) |  |
| m14-08 | カスタマイズ | 乖離 | 略称はフォーム上 50 文字（Excel 0208:L3360）。詳細設計 L326 は現行の DB 列長 10 との不一致を既知エッジケースとして指摘（現行 `pf-eccube3/app/Plug | 乖離（設計指摘の解消＝改善方向。ただしDV-16の固定オラクルは無い）／要実機確認 | `MtbCardset.php:109, CardsetType.php:87, CardSetType.php:69` | RG-012(DV-08,DV-16) |  |
| m14-09 | 現行踏襲 | 乖離 | 並び順は第一 rank 昇順・第二 id 昇順（0208:L3594「『並び順』の昇順」＋詳細設計 `m14-09_admin_card_format_list.html:318,327,308`「第 | 乖離（現行踏襲違反・並び順の非決定化）／要実機確認 | `FormatController.php:45` | RG-002, DV-02 |  |
| m14-09 | 現行踏襲 | 乖離 | 削除が関連データにより拒否されたときの遷移先は Referer（多くは一覧または編集の URL）（詳細設計 `m14-09_admin_card_format_list.html:320,354,35 | 乖離（現行踏襲違反・拒否時の戻り先変化）／要実機確認 | `FormatController.php:142` | RG-021, RG-019 |  |
| m14-10 | カスタマイズ | 乖離 | フォーマット名(英)・コードの正規表現違反時の文言は「有効な値ではありません。」（Excel 0208:L3879,L3880） | 乖離（文言差）／要実機確認 | `FormatType.php:76, messages.ja.yaml:4319` | RG-047(DV-09,12) |  |
| m14-10 | カスタマイズ | 乖離 | 削除のパスは `/{admin_route}/format/{formatId}/delete`（詳細設計 L400・利用者視点の入口 L316） | 乖離（経路の不整合）／要実機確認 | `FormatController.php:130` | RG-022,029,030 |  |
| m14-10 | カスタマイズ | 乖離 | 登録・更新の成功フラッシュは `admin.register.complete`（詳細設計 L332 手順14・L354） | 乖離（キー/文言差）／要実機確認 | `FormatController.php:72, messages.ja.yaml:1591` | RG-009,010 |  |
| m14-10 | カスタマイズ | 乖離 | 検証失敗時は `admin.register.failed` を積みフォームを再表示する（詳細設計 L329 手順5・L354・L375／Excel 0208:L3908「エラーが発生した場合はエラー | 乖離（失敗フラッシュの欠落）／要実機確認 | `FormatController.php:77` | RG-011 |  |
| m15-01 | カスタマイズ | 乖離 | ページ番号 `page_no` は 1以上の整数（正規表現 `^[1-9][0-9]$`）に限る（詳細設計 L402／Excel沈黙部の補完） | 乖離（page_no=0 到達可・編集URL形の不一致）／要実機確認 | `DeckController.php:75` | RG-034,046 |  |
| m15-02 | 現行踏襲 | その他 | 「CSV出力(旧サイト仕様)」はカスタマイズにより除去する（Excel `excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1633,1635,1655`）。 | 設計書不整合（詳細設計がExcelのカスタマイズ除去を未反映）／実装はExcel準拠。詳細設計HTMLの旧サイト節に除去注記が必要 | `DeckCsvController.php:150, DeckServiceProvider.php:61, deck.twig:173` | §0（旧サイト全系統） |  |
| m15-02 | 現行踏襲 | 乖離 | 標準CSV出力ルートは現行踏襲＝`POST /{admin_route}/deck/csvexport`（詳細設計 `:313`,`:389`／現行 `pf-eccube3/app/Plugin/Ha | 乖離（URLパス差・外部ブックマーク/直リンク非互換）／要実機確認 | `DeckController.php:677` | RG-006 |  |
| m15-02 | 現行踏襲 | 乖離 | CSRFは現行踏襲＝一括編集フォーム種別の既定トークンが同送される（詳細設計 `:318`・保護の有無自体は「確認値」と留保） | 乖離（現行踏襲差・CSRFトークン粒度と失敗時遷移先）／要実機確認 | `DeckController.php:680, index.twig:205` | RG-026 |  |
| m15-02 | 現行踏襲 | 乖離 | 応答の Content-Type は現行踏襲＝設定 `csv_export_encoding` に基づく `text/csv;charset=…`（SJIS-win系は Charset のみ `win | 乖離（現行踏襲差・Content-Type/charset表明の欠落）／要実機確認 | `DeckCsvExporterService.php:86` | RG-020, RG-021 |  |
| m15-02 | 現行踏襲 | 乖離 | `deckId` は現行踏襲＝`Request::request->get('deckId')` の生値をそのまま `IN` に用いる（詳細設計 `:322`／現行 `pf-eccube3/app/P | 乖離（現行踏襲差・入力正規化の追加。品質向上だが挙動差）／要実機確認 | `DeckController.php:690` | DV-06 |  |
| m15-02 | 現行踏襲 | 乖離 | 未選択時はクライアント側で中断する現行踏襲＝`#csvexport, #csvexport_old` クリック時にチェック0件なら `alert("CSV出力するデッキをひとつ以上選択してください。" | 乖離（現行踏襲違反・クライアント未選択ガードの欠落）／要実機確認 | `—` | RG-003, DV-01 |  |
| m15-03 | 現行踏襲 | 乖離 | 一括削除の入口は `POST /{admin_route}/deck/delete`（L315「<code>POST /{admin_route}/deck/delete</code>」・L396 同 | 乖離（現行踏襲違反・入口URL変更）／要実機確認 | `DeckController.php:139` | RG-008,029 |  |
| m15-03 | 現行踏襲 | 乖離 | CSRFは「ボディ直下の `_token` をコアの既定キーと一致するIDとしてトークンプロバイダで検証」し、「成功後、プロバイダでトークンを更新する」（L324 手順2・L338「検証後にプロバイダ | 乖離（現行踏襲違反・トークンID/リフレッシュ差）／要実機確認 | `DeckController.php:143` | RG-009,011 |  |
| m15-03 | 現行踏襲 | 乖離 | `deckId` が `null` のとき、`admin.deck.search.page_no` が空でないときは検索ルートの当該page_noへ、空のときはデッキ一覧ルート（`admin_deck | 乖離（現行踏襲違反・遷移分岐の消失）／要実機確認 | `DeckController.php:149` | RG-012,013・DV-01 |  |
| m15-03 | 現行踏襲 | 乖離 | `deckId` が空配列として送られた場合は「ループが 0 回となり、その後でも成功フラッシュに至り得る」（L340）。現行は一致（`pf-eccube3/.../Admin/DeckControl | 乖離（現行踏襲違反・空配列時の成功フラッシュ喪失）／要実機確認 | `DeckController.php:154` | RG-020・DV-04 |  |
| m15-03 | 現行踏襲 | 乖離 | 記事参照中のブロックはフラッシュとして翻訳キー `admin.deck.is_used.article` を積む（L324 手順6・L359「詳細文言はメッセージファイルの <code>admin.d | 乖離（現行踏襲違反・エラーメッセージキー変更）／要実機確認 | `DeckBulkDeleteAction.php:56, DeckController.php:166` | RG-015・DV-05 |  |
| m15-03 | 現行踏襲 | 乖離 | 記事参照中のブロック時は `Referer` ヘッダのURLへリダイレクトして終了する（L324 手順6・L365「記事参照によりブロック → <code>Referer</code>」・L370）。 | 乖離（現行踏襲違反・ブロック時遷移先変更）／要実機確認 | `DeckController.php:169` | RG-015,021,022,025・DV-05 |  |
| m15-03 | 現行踏襲 | 乖離 | 複数IDの途中で「記事中」に当たった場合「それまで削除済みの分は確定済み」（L340・L343「一部削除のみ完了している状態があり得る」）。当メソッド内に明示排他は無く「配列順に順次 `flush`  | 乖離（現行踏襲違反・部分確定→全件ロールバック）／要実機確認 | `DeckBulkDeleteAction.php:41` | RG-016,021,026,034 |  |
| m15-03 | 現行踏襲 | 乖離 | 全件成功時の成功フラッシュは翻訳キー `admin.delete.complete`（L324 手順10・L349「成功フラッシュ <code>admin.delete.complete</code> | 乖離（現行踏襲違反・成功キー変更／設計沈黙部への独自規則追加）／要実機確認 | `DeckController.php:177, DeckBulkDeleteAction.php:43` | RG-017,029・DV-02,DV-07 |  |
| m15-03 | 現行踏襲 | その他 | 正本はルートbind名を `m15-03_admin_deck_deck_bulk_delete`（L323,L396）、遷移先を `m15-01_admin_deck_deck_search`（L3 | m15-01_admin_deck_deck_search' pf-eccube3/app/` → 0件）。実際のbind名は `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ | `—` | **乖離（設計文書の記述不整合・調査導線が無効）／要実機確認 |  |
| m15-06 | カスタマイズ | 乖離 | 「デッキリスト公開の場合はデッキリストをDtbDeckCardに登録する」（0212:L2507）＝限定付き。詳細設計も非公開時は「リスト検証経路にも入らないため本文・明細チェックおよび dtb_de | 乖離（限定条件の逸脱・非公開デッキのリスト情報が明細として残る）／要実機確認 | `DeckCsv.php:160` | RG-012,024 |  |
| m15-06 | カスタマイズ | 乖離 | 「デッキIDが一致するデッキがあれば更新」（0212:L2497）し、「デッキリスト公開の場合はデッキリストを DtbDeckCard に登録する」（0212:L2507）。※再取込時の既存明細削除の | 乖離（更新セマンティクスと明細の不整合＝明細増殖）／設計の穴（削除要否が未規定）／要実機確認・仕様確認 | `CardUtil.php:103, DeckCsv.php:156` | RG-042 |  |
| m15-06 | カスタマイズ | 乖離 | 表示フラグは CSV 側二値「0(非表示) または 1(表示)」（0212:L2702）であり、EC-CUBEマスタ側の表示ID へは写像で変換する（詳細設計 L327「Disp::CSV_TO_DI | 乖離（型/定数の取り違え・現状は値の偶然一致で顕在化せず＝潜在バグ）／要実機確認 | `DeckCsv.php:61, DtbDeck.php:16, Disp.php:34` | RG-011,012 |  |
| m15-07 | 現行踏襲 | 乖離 | 並び替えの論理キーは不変で、変わるのはDB列のみ ── 「リクエスト引数 sortKey の値（ default ・ nameJp ・ nameEn ・ rank ）自体は画面上の論理キーであり、移行 | 乖離（現行踏襲違反・論理sortKey改名で並び順が不定化）／要実機確認 | `MtbDeckTagRepository.php:23, MtbDeckTagRepository.php:38` | RG-009,RG-010,RG-048 |  |
| m15-07 | 現行踏襲 | その他 | ページネーションは「一覧件数が 1 より大きいときフッターに」表示（詳細設計 `:320`／0212:L2866） | length > 0 %}`＝0より大きいとき表示。→ 件数1件でもページネーション（番号リンク1個）が出る。設計文（>1）と実装（>0）で1件時の表示有無が食い違う | `deckTag.twig:89` | **乖離（表示条件の境界差 >1 vs >0）／要実機確認* |  |
| m15-07 | 現行踏襲 | 乖離 | 側メニュー「デッキタグ一覧」は MTGマスターデータ管理画面へ「デッキタグ」が選択された状態で遷移する（Excel 0212:L2837「概要 MTGマスターデータ管理へのリンク」／0212:L284 | 乖離（メニュー導線と本書主題画面の不一致・POST専用bindのURL生成に依存する脆い構成／ルート登録順が変われば405となりうる）／要実機確認 | `SidebarProvider.php:416, HareruyaMasterdataServiceProvider.php:27, DeckServiceProvider.php:65` | RG-001,RG-036 |  |
| m15-07 | 現行踏襲 | 乖離 | 表示順の重複は「自分以外で同一順位があるとカスタム制約によりエラー」（詳細設計 `:341`,`:363`／0212:L2887,L2909） | 乖離（表示順重複チェックが実行時エラーとなる疑い・要PHPバージョンと実機での確認）／要実機確認 | `MtbDeckTagRepository.php:53, RankDuplicateValidator.php:21, DeckTagController.php:48` | RG-027,RG-029(DV-12) |  |
| m15-08 | カスタマイズ | 乖離 | アーキタイプ検索条件の選択肢は `DtbArchetype` から選択（Excel M15-01 識別ID:7・`excel_to_html/output/0212_基本設計仕様書(デッキ管理).ht | 乖離（Excel「DtbArchetypeから選択」に対する現行の暗黙の絞り込み。色未設定アーキタイプで検索不能）／要実機確認 | `SearchDeckType.php:82, SearchDeckType.php:84` | RG-009, DA-01 |  |
| m15-08 | カスタマイズ | 乖離 | 検索フォーム型の CSRF は無効（詳細設計 `…m15-08_admin_deck_deck_archetype_search.html:322`「CSRF はこのフォーム型では無効である」＝現行踏 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `SearchDeckType.php:25, SearchDeckType.php:209` | RG-031 |  |
| m15-08 | カスタマイズ | 乖離 | 「大会開始時刻前のデッキは検索結果に表示しない」（Excel M15-01 `excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1050`）／「大会開始日時が | 乖離（境界条件の取り違え・大会開始ちょうどのデッキが欠落）／要実機確認 | `DtbDeckRepository.php:127, DtbDeckRepository.php:182` | RG-004, DA-01 |  |
| m15-08 | カスタマイズ | 乖離 | 色複数選択時は「デッキのアーキタイプが持つ色コレクションの ID が、そのいずれかに一致するよう結合する（論理和）」（詳細設計 `…m15-08_admin_deck_deck_archetype_s | 要実機確認（設計が沈黙のため乖離とは断定しない。重複が出る場合は該当件数と一覧の不整合＝L341 のデータ整合性に反する） | `DtbDeckRepository.php:169, DtbDeckRepository.php:215` | DA-08 |  |
| m15-09 | カスタマイズ | 乖離 | 公開状態は必須指定なし（Excel 画面項目表 `0212:L3429` の必須列＝「-」。同表は名称・フォーマットに「〇」を置き（`0212:L3423,L3424,L3431`）、任意項目に「-」 | 乖離（Excel画面項目表と実装/詳細設計の必須・任意不一致）／仕様確認要・要実機確認 | `ArchetypeType.php:80, ArchetypeType.php:83, Plugin.HareruyaEc.Entity.DtbArchetype.dcm.yml:43` | DV-12, RG-042 |  |
| m15-09 | カスタマイズ | 乖離 | アーキタイプ名(日/英)の最大値は 255文字（`0212:L3423,L3424`）＝255文字まで登録・更新できる | 乖離（Excel上限255が実現不能・フォーム/スキーマ二重定義）／要実機確認 | `ArchetypeType.php:44, DtbArchetype.php:39, config.yml:197` | DV-02, DV-16 |  |
| m15-09 | カスタマイズ | 乖離 | 削除成功後の戻り先はセッション `admin.archetype.search.page_no` があれば `admin_archetype_search` の当該ページ、無ければ `admin_ar | 乖離（現行踏襲違反・削除後のページ復帰欠落）／要実機確認 | `ArchetypeController.php:203` | RG-025, RG-026 |  |
| m15-09 | カスタマイズ | 乖離 | 入口は DELETE `/{admin_route}/archetype/{id}`（削除）／GET・POST `/{admin_route}/archetype/{id}`（編集・更新）／POST  | 乖離（入口URL・HTTPメソッド構成の差）／要実機確認 | `ArchetypeController.php:179` | RG-008, RG-010, RG-023, RG-030 |  |
| m15-09 | カスタマイズ | 乖離 | CSRF不正（フォーム送信／アンカー削除）はアクセス拒否（HTTP 403）に相当する例外（詳細設計 `:347,376`＝`0212:L3402` 現行踏襲で補完） | 乖離（CSRF不正時の応答が403→フラッシュ+リダイレクトへ変化）／要実機確認 | `ArchetypeController.php:182` | RG-045 |  |
| m15-09 | カスタマイズ | 乖離 | フラッシュキーは 登録`admin.register.complete`（詳細設計 `:324`）／削除成功`admin.delete.complete`・削除不可`admin.archetype.d | 乖離（内部差・フラッシュ/メッセージキーの変更）／要実機確認 | `ArchetypeController.php:232, ArchetypeDeleteAction.php:45` | RG-007, RG-024, RG-027 |  |
| m15-09 | カスタマイズ | 乖離 | 代表カード検索の入口は POST `.../archetype/search/main_card/html`（HTML断片）／GET `.../archetype/search/main_card/h | 乖離（XHR入口構成・セッション保持の差）／要実機確認 | `ArchetypeController.php:253` | RG-032〜041 |  |
| m15-09 | カスタマイズ | その他 | カスタマイズ要件により旧アーキタイプIDを画面と登録/更新ロジックから除去（`0212:L3400,L3410,L3412,L3413,L3415,L3433`）、公開状態の選択肢から限定公開を除去し | 設計書間不整合（詳細設計HTMLがExcelカスタマイズ未反映・Excelが正／詳細設計の更新要） | `DtbArchetype.php:106, ArchetypeType.php:127, Version20220104163301.php:20` | RG-018〜021 |  |
| o01-01 | カスタマイズ | 乖離 | 受注IDが存在すれば詳細更新・ステータス更新を受け付ける。査定終了後の変更不可という制約は本書に記載なし（L344,L366＝本書沈黙・A06-05を正） | 乖離（本書沈黙の遷移ガード・振込前の区分不整合）／A06-05設計を正・要実機確認 | `OtcBuyOrderStatusController.php:48, MtbOtcBuyOrderStatus.php:24, DtbOtcBuyOrderRepository.php:51` | RG-006,016 |  |
| o01-01 | カスタマイズ | 乖離 | 同時更新は専用ロックを持たず後勝ち（L344「専用の楽観ロック・悲観ロックは持たない。後から確定した更新が残る」／L389） | 乖離（設計「ロックなし後勝ち」と実装占有ガードの不一致・経路間非対称）／要実機確認 | `OtcBuyOrderStatusController.php:61` | RG-021 |  |
| o01-01 | カスタマイズ | 乖離 | 数量・単価などの形式検証は「店頭買取受注詳細更新APIの検証に従う」＝本書は具体を規定せず（L342,L363） | 乖離疑義（空数量許容で合計0・実機再現で確定）／要実機確認 | `OtcBuyOrderDetail.php:30, OtcBuyOrderController.php:128` | RG-010(DT-N1) |  |
| o01-01 | カスタマイズ | 乖離 | フリーコメント更新はフリーコメントを保存（L323,L340） | 乖離（低severity・コードスメル・機能影響なし） | `OtcBuyOrderFreeCommentController.php:44` | RG-019 |  |

## §3. 新規P3（要実機確認・軽微）（73件）

| 機能 | 区分 | 分類 | 設計（あるべき） | 判定（実装との食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 要実機確認 | 在庫変動区分の表記：A01-02本文は「02:取引」(0501:L1513)、A01-01 1-2/区分定義は「02:売上」(0501:L1091,L1092) | Excel内部不整合（実装は02:売上で整合）／要実機確認 | `SmaregiStockChangeApplier.php:45` | RG-004 |  |
| a01-02 | 新規実装 | 要実機確認 | 実行タイミングは「毎時16分」(0501:L1506) だが「バッチ処理は閉店後1回のみ」(0501:L1504) とも規定＝Excel内で競合 | Excel内部不整合／運用確定は要実機確認 | `SmaregiStockBackfillCommand.php:30` | RG-015 |  |
| a06-02 | カスタマイズ | 要実機確認 | 所属店舗の絞り込みは会員サブ（dtb_member_sub）のshop_id、移行先 enterprise では会員（dtb_member）の base_info_id / member_base_i | 移行差（現行実装確認済／移行先未確認・要実機確認） | `OtcBuyOrderController.php:35, DtbOtcBuyOrderRepository.php:50` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 要実機確認 | memberName 意味：Excel 0507:L1148 は「memberName ＝ 査定担当者」、詳細設計 L339 は「申込者を登録した会員名」（オラクル間で意味が異なる） | オラクル間競合／要実機確認（返却値は dtb_member.name・意味づけ要確認） | `DtbBuyOrderRepository.php:53` | RG-005,010 |  |
| a07-02 | 現行踏襲 | 要実機確認 | 抽出対象ステータス：Excel 0507:L1128（概要）は 4種（商品到着・査定中・査定中断・査定再開）。応答配列説明 Excel 0507:L1144 は 5種（「商品到着・査定前・査定中・査定 | Excel記述揺れ（L1144の"査定前"）／要実機確認（抽出は4種で確定） | `DtbBuyOrderRepository.php:35` | RG-002 |  |
| a15-02 | 現行踏襲 | 要実機確認 | `aud` に対応する会員IDでプレイヤーを引き、プレイヤーが取得できた場合に認証成功とする（`...a15-02_api_deck_builder_deck_logout.html:241`）。DB | 要実機確認（設計の沈黙・現行/移行先で削除条件の扱いが非対称） | `BaseController.php:77, DtbPlayer.php:145, DtbPlayerRepository.php:56` | RG-011・DV-05 |  |
| a15-02 | 現行踏襲 | 要実機確認 | トークンCookieを空値に設定し、クライアント側のトークン保持を解除する（`...a15-02_api_deck_builder_deck_logout.html:267`） | 要実機確認（設計文言の解釈差・Cookie削除ではなく空値上書き） | `LoginController.php:88, LoginController.php:62` | RG-002 |  |
| a15-06 | 現行踏襲 | 要実機確認 | 正本 L227「挙動の参照元であるデッキビルダーAPI（deck-api）は提供リポジトリに含まれないため…確認できない差異はec-cube-enterprise実装で要確認とする」 | 正本の前提誤り（設計書の要修正）／要実機確認 | `MasterController.php:61, routes.yaml:17` | RG-030・DV-13 |  |
| a15-18 | 現行踏襲 | 要実機確認 | 詳細設計 L293 の「DB操作」表（`0515:L2009`）は操作種別を「登録/更新」のみとし「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）」と記す | 「削除は含まない」を根拠に初期化を省略実装する誤読を招きうる（付帯表4#1 の移行先実装漏れと整合する疑い）。設計側の要確認 | `—` |  |  |
| a17-03 | 現行踏襲 | 要実機確認 | Excel 0517:L1843 は pointAttr を連携内容の1項目として例示（必須/任意の明示なし）／詳細設計 L359 は point_type_id を履歴列に記載 | 要確認: pointAttr欠落時の履歴ポイント種別の扱いが現行/移行先で異なる。オラクルに必須/デフォルトの明示なし＝要実機確認 | `PointGranterController.php:58, PointGranterAction.php:50` |  |  |
| b02-04 | 現行踏襲 | 要実機確認 | 抽出条件は「公開ステータスが公開」かつ「部門が未設定」の2条件（Excel 0404:L1318・詳細設計 L321）。削除済みデータの扱いは規定なし | 仕様沈黙（設計に無い抽出条件）／要実機確認 | `DtbProductSubClassRepository.php:1498` | DDT DA-05 |  |
| b02-04 | 現行踏襲 | 要実機確認 | 出力先はメール(管理者宛)（Excel 0404:L1322）。宛先アドレスの設定は別範囲（詳細設計 L302） | 仕様沈黙（宛先マスタ流用・未設定時の無送信）／要実機確認 | `MailService.php:1179, MailService.php:1196` | RG-006 |  |
| b02-06 | カスタマイズ | 要実機確認 | 「引数の開始日・終了日を日時として解釈し、その範囲の受注を受注日の昇順で取得する」（`:317`）＝範囲境界の開閉は設計が沈黙 | 設計沈黙（境界の開閉が未規定）／要実機確認（実装の境界を期待に採らない・§3 DP-04） | `OrderRepository.php:1562, OrderRepository.php:1822` | RG-005／DP-04 |  |
| b02-06 | カスタマイズ | 要実機確認 | 「コマンド名が一致しない場合は処理を行わずに終了する」（`:313,:339`）＝出力・終了コードは設計が沈黙 | 設計沈黙（出力・終了コード未規定）／要実機確認 | `ProductBatch.php:47` | RG-004 |  |
| b02-06 | カスタマイズ | 要実機確認 | DBカラム表は `dtb_stock_history` の `stock`・`old_stock`・`sell_price` を「作成する在庫履歴の各値」として挙げるが、`price` の用途は「対象 | 設計沈黙（sell_price/member_id の値の出所が未規定）／要実機確認（実装値を期待に採らない） | `InsertStockHistory.php:67, DtbStockHistoryRepository.php:63, InsertStockHistory.php:62` | RG-009,010／§5 |  |
| b05-01 | 現行踏襲 | 要実機確認 | 一次オラクル（Excel優先）: 連携（商品/在庫）失敗時はエラーメールを送信、送信先＝追加設定のスマレジ通信エラー送信メールアドレス（Excel 0405:L1056-1057,L1062-1063 | 一次=エラーメール送信（Excel記載あり）／エラー後の継続・終了ステータスは要実機確認 | `SmaregiOtcOrderPostAction.php:70, OtcOrderSmaregiPostCommand.php:52` | RG-011,023 |  |
| b13-02 | 現行踏襲 | 要実機確認 | 抽出対象はコンビニ決済で入金待ちのイベント申込（正本 集計条件 L319,L325）。時間窓は詳細設計では非明示 | 差異（抽出の時間閾値0・更新日時基準が設計で沈黙）／要実機確認 | `CheckCvsPaymentEntry.php:18, DtbEventEntryRepository.php:64` |  |  |
| b17-01 | 現行踏襲 | 要実機確認 | 出力ファイルは latestArticleList.json（現行/移行先で同一・L221）。保存先の格納機構は詳細設計が規定せず | 実装差（設計沈黙・要実機確認・バグでない） | `AbstractListText.php:23, CreateLatestArticleListAction.php:87` | RG-004 |  |
| f03-01 | カスタマイズ | 要実機確認 | 検索結果が多すぎる場合も結果件数は出力し、ページングを4000件までにする（Excel `0303:L1505`）／件数が上限を超える場合は上限値に + を付けて表示する（詳細設計 `:331`） | 要実機確認（Excel記載のページング範囲・+表記の実装有無が未確定） | `ProductController.php:25` | RG-006,007 |  |
| f04-01 | カスタマイズ | 要実機確認 | 数量の最大文字数/最大値は `-`（未指定・`0304:1129`） | Excelが沈黙（`-`）のため詳細設計で補完（`0304:1022`「カスタマイズ要件に記載の内容以外は現行踏襲とする」）＝§3 DV-09 は要実機確認 | `—` |  |  |
| f04-04 | 現行踏襲 | 要実機確認 | 店内アカウント=TC注文番号を表示（Excel 0304:L2562） | format(waitingNumber % 10000) }}</td>{% elseif orderNumber %}<th>ご注文番号</th>...`）＝呼び出し番号ありでTC注文番号、なしでご注文番号。ただし `waitingNu | `complete.twig:34` | **設計どおり✓（下4桁表示は要実機確認）** |  |
| f05-01 | カスタマイズ | 要実機確認 | 選べる2つの買取スタイル＝ネット買取リンク `user_data/purchase_net`・店頭買取リンク `user_data/purchase_store`（Excel 0305:L1043,L | 要実機確認（リンクURLの所在未確定） | `index.twig:27` | RG-013 |  |
| f05-03 | カスタマイズ | 要実機確認 | 買取価格が買取最低価格（500円）以上のとき数量入力とカート追加ボタンを表示、500円未満は非表示（Excel 0305:L1931,L1955／詳細設計 L330） | default(500)` で 500円ゲートを適用。ただしユニサーチ一覧カード `purchase_product_list_unisearch.twig:34` は買取価格を `card.buyPrice > 0` で表示分岐しており、 | `PurchaseController.php:80, _purchase_product_card.twig:27` | **設計どおり✓／一覧カードのゲート適用は要実機確認** |  |
| f05-03 | カスタマイズ | 要実機確認 | 商品画像（画面部品表#4）を押下すると拡大画像を表示する（Excel 0305:L1948）。詳細設計 L329 は表示要素と画像の遅延読み込み（lazyload）に触れるのみで拡大表示の機構（ポップ | オラクル未規定（表示機構は要実機確認・断定せず縮退） | `—` | RG-039 |  |
| f06-09 | カスタマイズ | 要実機確認 | ページング（`page`クエリ・入出力 L364） | 要実機確認（ページング仕様が正本沈黙） | `DtbProductSubClassRepository.php:1635, MypageController.php:293` | §5台帳(ページング) |  |
| f06-21 | 現行踏襲 | 要実機確認 | 退会確定時に会員ステータスを退会状態で管理するか（詳細設計L322「customer_status_id・close_reason で併せて管理するかは要確認」） | 設計の要確認に対する実態＝enterpriseはstatus実装/close_reason未設定 | `WithdrawController.php:126, WithdrawController.php:94` | RG-004 |  |
| m03-30 | カスタマイズ | 要実機確認 | セール中(有効)時の買取価格の扱い（Excel 内部矛盾：見出し `0204:L10050`「セール中商品の販売価格、買取価格は変更できない、参照販売価格、参照買取価格は変更できる。」＝実販売/実買取 | オラクル矛盾（要実機確認・実装バグとは断定しない） | `ProductPriceImportHandler.php:349` | RG-002 |  |
| m03-31 | 現行踏襲 | 要実機確認 | 現在登録済セールフラグ=無効(0)かつCSV=無効(0)の場合、Excelは見出しで「通常商品の販売価格、買取価格は変更できない」（0204:L10260）と記す一方、明細では「買取価格を、CSVに設 | 設計側の不整合（要仕様確認）／要実機確認 | `ProductPriceImportHandler.php:337` | RG-026 |  |
| m03-41 | カスタマイズ | 要実機確認 | 子検索条件指定のカスタマイズ列は、シート「カテゴリ登録CSVアップロード」では「CSV項目『検索パラメータ』を追加する」＝1列（`0204:L13176`）、フォーマット表も識別ID:9「検索パラメー | Excel内不整合（列数の記述矛盾）／要実機確認 | `CategoryCsvImportHandler.php:224` | RG-013,018(DV-24〜26) |  |
| m04-09 | 新規実装 | 要実機確認 | 移動点数が現在の在庫より多い場合はエラー（Excel 0202:L4965＝汎用記述） | 実装固有値（メッセージキー・期待に断定しない）／要実機確認 | `—` | DV-03（RG-005） |  |
| m04-09 | 新規実装 | 要実機確認 | 在庫承認一覧（DtbStockApprovalList/dtb_stock_approval_list）への登録・確定、および「単一トランザクションで確定／失敗時に一切確定しない」というTX境界の断定 | 実装/ナラティブ由来（Excel業務仕様に非在）／要実機確認 | `StockTransferStoreAction.php:163, StockMoveOutboundApprovalRequestUpdateAction.php:169` | RG-021,014,015・§1副作用 |  |
| m04-10 | 新規実装 | 要実機確認 | Excel基本設計（0202 M04-10 L7040-7084）はログ出力を規定しない（CSV出力項目14列＋カスタマイズ要件のみ）＝ログはExcel沈黙部の補完対象外の実装由来副作用 | 実装由来副作用（Excel規定外）／要実機確認 | `StockMoveTransferListCsvExportService.php:112` | RG-010 |  |
| m04-14 | 新規実装 | 要実機確認 | 列8「分割先在庫数（分割）／結合元点数（結合）」（Excel 0202:L9672） | 要実機確認（オラクル化しない） | `StockSplitJoinCsvExportService.php:122` | RG-009,026 |  |
| m04-20 | 新規実装 | 要実機確認 | 出力対象は「欠品のみ」（Excel 0202:L11082） | 要実機確認（区分定義） | `DtbStockHistoryRepository.php:143` | RG-002 |  |
| m04-23 | 新規実装 | 要実機確認 | CSRF保護の有無・方式は Excel M04-23 に記載なし（オラクル沈黙） | 設計書の記載欠落（実装は保護あり）／要実機確認 | `StockSplitJoinController.php:228` | RG-039 |  |
| m04-23 | 新規実装 | 要実機確認 | エラー時は「元画面でエラーを扱う・モーダル選択内容リセット」まで（Excel 0202:L12473,0202:L12474）。トランザクション原子性は非記載 | 設計書の記載欠落（実装は全件ロールバック）／要実機確認 | `—` | RG-011 |  |
| m04-23 | 新規実装 | 要実機確認 | 承認通知先メンバー選択フォームの選択肢供給元はExcel非記載（0202:L12487は用途のみ） | 実装事実（期待に使わない）／要実機確認 | `StockSplitJoinController.php:427` | RG-041 |  |
| m04-23 | 新規実装 | 要実機確認 | 取込履歴の記録有無はExcel非記載 | 実装事実（期待に使わない）／要実機確認 | `—` | §5台帳(取込履歴) |  |
| m04-25 | 新規実装 | 要実機確認 | Excel 内で備考編集可条件が矛盾: 機能仕様 0202:L13913「出庫承認済みまたは移動中の時のみ」 vs 識別ID1-14 0202:L13953「メモの入力は入庫完了以外で入力可能」。※両 | オラクル内矛盾（否定境界のみ要実機確認）。陽性側は RG-009 で EXEC 化 | `—` | RG-011（RG-009は陽性側のみ固定） |  |
| m04-28 | 新規実装 | 要実機確認 | 指定IDに該当なしの出力内容をExcelは規定しない | 実装事実の記録（Excel沈黙・要実機確認） | `...StockMoveInstructionLabelCsvExporterService.php:74, DtbStockMoveInstructionRepository.php:221` | RG-012 |  |
| m04-30 | 新規実装 | 要実機確認 | 対象0件時の挙動はExcel未規定（0202:L14649「商品コードリストを出力」のみ）＝要実機確認 | Excel沈黙・実装既定（要実機確認） | `BarcodeReplacementListCsvExportService.php:73` | RG-023 |  |
| m04-33 | 新規実装 | 要実機確認 | Excel 0202:L16608「言語/状態の形式で出力（例: FoilJP/NM）」 | Excel沈黙域の実装補完（要実機確認） | `RestockListCsvRowFormatter.php:146` |  |  |
| m05-02 | カスタマイズ | 要実機確認 | ★カスタマイズ: 非会員はお名前(姓)に「非会員」と表示（0203:L2222,L2292,L2296）／店舗ID・店舗名・住所3・スマレジ取引ID・小計値引き/割引区分・クーポン値引き・メモ・免税額 | 要確認（カスタマイズ達成の付与経路が dtb_csv シード/イベント/エンティティアクセサのいずれかに依存・実機/DBフィクスチャで確定） | `OrderController.php:430, OrderController.php:453` | RG-002,010,011 |  |
| m05-05 | カスタマイズ | 要実機確認 | カスタマイズ追加列（店舗ID/取引ID/小計値引き割引区分/クーポン値引き/メモ/免税額/住所3）を出力（Excel 0203:L2922,L2936,L2989-2993,L3027-3032） | 設定依存/要実機確認 | `CsvExportService.php:494` | RG-017 |  |
| m05-06 | カスタマイズ | 要実機確認 | 本店のほか支店・スマレジの受注情報/取引データをメール対象（Excel 0203:L3199,L3204＝★カスタマイズ） | 要実機確認（設計沈黙・送信元運用の妥当性） | `MailController.php:308` | RG-017,021 |  |
| m06-02 | カスタマイズ | 要実機確認 | 住所連結の区切り（最終セグメント直前の空白）: Excel 0205:L1527 は日本「県名 + 半角空白 + 住所1 + 半角空白 + 住所2 + 住所3」／海外「国名 + 半角空白 + 住所3  | 差異（記述差・Excel優先ルール下の未表明の一次/二次オラクル競合）／最終セグメント直前の空白有無は要実機確認 | `DtbOtcBuyOrderRepository.php:340` | RG-010,011 |  |
| m06-09 | 現行踏襲 | 要実機確認 | 販売金額＝「買取当時の基準価格または個別入力商品はMTGBuyerで登録した販売価格を集計したもの」（Excel 0205:L4536） | 注記（データ系譜・本機能は合算のみ）／要実機確認 | `DtbOtcBuyOrderSummaryRepository.php:43` | RG-006 |  |
| m06-11 | 新規実装 | 要実機確認 | 権限（買取店舗の編集権限）をExcel未記載。正本 L302 は共通設計/実装に委譲 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderRestockListService.php:101` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 空選択・対象なし時の挙動をExcel未記載 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:642, OtcBuyOrderRestockListService.php:96` |  |  |
| m06-11 | 新規実装 | 要実機確認 | CSRF・HTTPメソッド・routeをExcel未記載（実装を正とTODO・正本 L291,L312） | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:627` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 基準価格nullの区分をExcel未記載（閾値区分は 0205:L2123 の3帯+サプライのみ） | 実装事実（要実機確認の裏取り） | `RestockListPdfSectionBuilder.php:31` |  |  |
| m07-02 | カスタマイズ | 要実機確認 | 金額列は「買取合計金額」（Excel 0206:L1622） | 要実機確認（フィールド対応の妥当性） | `BuyOrderCsvExportService.php:150` | RG-014 |  |
| m07-03 | カスタマイズ | 要実機確認 | ステータスID付番は詳細設計HTMLに明示なし（SEEDは名称で固定） | 実装事実の記録（要実機確認の付番） | `MtbBuyOrderStatus.php:29` | 全状態遷移RG |  |
| m07-08 | 新規実装 | 要実機確認 | 出力対象のステータス条件は Excel M07-08 に記載なし（沈黙） | 設計沈黙・実装のみ判定条件（要実機確認で妥当性検証） | `BuyOrderRestockListService.php:30` | RG-015 |  |
| m07-08 | 新規実装 | 要実機確認 | サプライ品の商品名出力は Excel 0206:L2104 が非サプライのみ規定しサプライ品時を明示しない（沈黙） | 設計沈黙・実装のみ（原文表示の妥当性は要実機確認） | `RestockListCsvRowFormatter.php:84` | RG-014 |  |
| m07-08 | 新規実装 | 要実機確認 | ルート/メソッド/レスポンス形式/ファイル名/ヘッダ行は Excel M07-08 に記載なし（沈黙） | 設計沈黙・実装事実の記録（要実機確認） | `PurchaseController.php:637, BuyOrderRestockListCsvExportService.php:79, PurchaseController.php:640` | RG-017,018 |  |
| m07-08 | 新規実装 | 要実機確認 | 出力CSVの並び順は Excel M07-08 に記載なし（沈黙） | 設計沈黙・実装事実の記録（要実機確認） | `DtbBuyOrderRepository.php:844` | RG-019 |  |
| m08-08 | カスタマイズ | 要実機確認 | テンプレ未選択時は件名・メール本文の初期値を空欄にする（Excel `0207:L3686`,`L3687`）＝欄は存在し値が空 | 設計間不整合（詳細設計L342の件名欄非表示がExcel L3686・実装と矛盾／本文欄の表示有無はExcelが沈黙で詳細設計補完＝テンプレ選択時のみ表示）／要実機確認 | `manual_mail.twig:46` | RG-002,011 |  |
| m09-10 | カスタマイズ | 要実機確認 | Excel 0210:L2843,L2844,L2857,L2858,L2859 は「(2)支店共通設定を適用を選択して登録すると、以下1~3のフローでエラーチェックを行う」と読める。一方 0210: | オラクル内競合（Excel 0210:L2843 vs 詳細設計 L336）／期待は断定せず要実機確認（設計側の確認要） | `TopPageController.php:70, BranchTopPageController.php:85` | RG-013 |  |
| m09-10 | カスタマイズ | 要実機確認 | バナー画像表示部品の採番。Excel 本文 0210:L2861 は「(14)バナー画像を表示する」、画面項目表 0210:L2920 は同部品を「(12)バナー画像」とする（項目表の最大識別IDは1 | オラクル内競合（採番不整合）／要実機確認（設計側の確認要） | `—` | RG-027 |  |
| m10-03 | 現行踏襲 | 要実機確認 | プラグイン追加欄（extra-form）のループ対象条件が設計に規定されている | 仕様欠落（設計が条件式をオラクル化せず期待を断定できない）／要実機確認 | `customer_agreement.twig:49` | RG-010 |  |
| m10-03 | 現行踏襲 | 要実機確認 | Excel は書式・制限を「全角・半角」と規定（0209:L2091） | 差異（Excel書式・制限に対応する検証が無く、範囲外文字の可否が未規定）／要判定・要実機確認 | `CustomerAgreementType.php:45` | RG-018(DV-02,DV-03) |  |
| m11-06 | 標準 | 要実機確認 | 本機能は参照専用で永続化を行わない — 「フォームによる保存やマスタ更新は行わない」（`function_spec_html_preview/ec-cube-enterprise/m11-06_adm | 設計書の誤り（定型ブロック混入・参照専用と矛盾）／要設計修正・要実機確認 | `SystemController.php:36, AuthorityIndexAction.php:125` | RG-042 |  |
| m12-01 | カスタマイズ | 要実機確認 | 本機能はカスタマイズであり、検索項目は識別ID1〜6に固定（`0211:L1048`）・利用端末/表示項目は削除（`0211:L1053`〜`L1056`）・結果出力項目は識別ID1〜14に固定（`0 | 想定内（リニューアル前の現行状態）／移行先で要検証。詳細設計HTMLが現行を記述している根拠でもあり、詳細設計の当該記述を期待に採らない判断の裏付け | `SummaryType.php:57, SummaryController.php:20, SummaryController.php:40` | §5 旧指標の非生成 |  |
| m12-05 | カスタマイズ | 要実機確認 | 表示件数の選択肢は Excel 列挙「10,50,100,300,500,100,200,10000,12000」（0211:L3085） | 仕様確認要（Excel列挙とマスタ由来の衝突・Excel記述の内部不整合）／要実機確認 | `SearchProductRequestType.php:103` | RG-019（DV-13） |  |
| m12-08 | カスタマイズ | 要実機確認 | フロント挙動は「CSVダウンロードのボタンは集計フォームの送信ボタンとして配置される」（詳細設計 `...csv_export.html:320`／Excel 0211:L4034）とのみ規定し、ボタ | 要実機確認（設計沈黙・出現条件の明文化が必要） | `format_sales.twig:47` | RG-020 |  |
| m13-08 | カスタマイズ | 要実機確認 | メインカード一覧を1ページ40枚で分割し、デッキごとにページ番号と総ページ数を持つ（現行踏襲＝`0214:L3846`／詳細設計 L332,L346,L349,L352,L355） | length }}`）。移行先は40枚分割を行わず1デッキ=1ページとし、`pageNo`/`totalPages` をデッキ通番/総デッキ数へ意味変更している（`ec-cube-enterprise/.../EntryDeckListDi | `EntryController.php:784, decklist.twig:19` | **乖離（移行先=現行踏襲違反・40枚分割の欠落とページ番号 |  |
| m13-11 | 現行踏襲 | 要実機確認 | 本機能は参照のみ・業務データを更新しない（詳細設計 L313,L342,L348,L371／Excel 0214:L4668,L4674,L4697） | 設計内矛盾（汎用テンプレ節の混入・設計是正が必要）／要実機確認 | `EntryController.php:176, EntryRegistrationController.php:64` | RG-033 |  |
| m14-02 | カスタマイズ | 要実機確認 | 詳細0件カードの扱い。Excel は沈黙、詳細設計 L344 は「代入先変数名などに不整合があり、実行経路によっては未定義変数参照や列数不足が起きうる」と明記 | バグ（現行・列数不足＋未定義変数参照）／要実機確認 | `CardCsv.php:292, CardCsvController.php:136, CardCsv.php:346` | RG-012 |  |
| m14-02 | カスタマイズ | 要実機確認 | 未選択で CSV 出力を押下したら「1つ以上のカードを選択してください。」を表示（`0208:L1522,L1523,L1543`） | バグ（現行・empty()判定順序による未選択ガードの無効化）。Excel自身が L1522 で即時エラー表示を規定しつつ L1524 で当挙動の踏襲を記す＝設計が両義的／要実機確認 | `CardCsv.php:176, CardCsvController.php:110, CardCsv.php:137` | RG-030,031,036 |  |
| m14-02 | カスタマイズ | 要実機確認 | cardIds 空時のメッセージ（`0208:L1523`＝カード向け文言） | バグ（現行・誤文言＋到達不能分岐）／要実機確認 | `CardCsvController.php:112, message.ja.yml:1134` | RG-035,036 |  |
| m14-06 | 現行踏襲 | 要実機確認 | ★カスタマイズにより一覧から「(14)サイドメニュー表示」「(15)支店表示フラグ」の画面部品を除去する（Excel `excel_to_html/output/0208_基本設計仕様書(カード管理) | 文書不整合（詳細設計HTMLがExcel★カスタマイズ未反映）／実装は移行先で適合済み・要実機確認 | `card_set.twig:93, index.twig:132` | RG-012 |  |
| m15-07 | 現行踏襲 | 要実機確認 | 表示順の下限。詳細設計 `:341` は「下限 1 より大きい（Symfony GreaterThan と HTML min）の両方により 1〜999999」と述べ、下限句（>1）と範囲結論（1を含む | 正本内不整合（下限句 vs 範囲結論）＋設計文と実装の不一致／要実機確認・設計文の是正が必要 | `DeckTagType.php:63` | RG-029(DV-13) |  |

## 参考: 既知と一致し除外した 298件

| 機能 | 私の判定 | 既知課題（impl_check/verified） | 根拠 |
|---|---|---|---|
| f01-01 | 乖離（Excelに無い限定の追加）／要実機確認 | 【実装乖離】フロントトップ_ECTOP（本店トップ）_本店トップ「あなたのお気に入り」が、設計に無い在庫1以上の条件で商品を絞り込んでいる | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| f01-01 | 乖離（参照先未確定・実装側TODOで404を自認）／要実機確認 | 【実装乖離】フロントトップ_ECTOP（本店トップ）_本店ECTOP＞最新記事ブロック(13-2〜13-5)にて、設計で指定された「最新記事jsonファイル作成 | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| f01-02 | 乖離（文言不一致）／要実機確認 | 【実装乖離】フロントトップ_支店ECTOP_支店ECTOPの(1)注文方法ラベルにて、非会員・支店店内アカウント以外向けの文言が「承っています。」となっており、 | 機能ID+同一ファイル行近接(±25)+類似0.17 |
| f01-02 | 乖離（PC版限定の未反映）／要実機確認 | 【一部実装】フロントトップ_支店ECTOP_支店ECTOPのQRコード＆採用情報にて、採用情報バナー(9-2)がPC版のみ表示となっておらず、スマートフォン表示 | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| f01-02 | 乖離（遷移先URL未設定）／要実機確認 | 【一部実装】フロントトップ_支店ECTOP_支店ECTOPの(8)おすすめ特集が、ブロック管理に登録されていない固定テンプレートで、全バナーのリンク先が hre | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| f01-02 | 乖離（判定経路差・Player未設定時の取りこぼし）／要実機確認 | 【実装乖離】フロントトップ_支店ECTOP_支店ECTOPの(1)注文方法ラベルにて、非会員・支店店内アカウント以外向けの文言が「承っています。」となっており、 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f01-02 | 乖離（支店別公開ステータスの粒度差）／要実機確認 | 【一部実装】フロントトップ_支店ECTOP_支店ECTOPの(2)SALE中の商品にて、支店の商品公開ステータス（is_branch_published）による | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f01-02 | 乖離（設計書の対象画面不一致・入口URL差）／要実機確認（詳細設計HTMLの是正要否を含む） | 【一部実装】フロントトップ_支店ECTOP_支店ECTOPにて、支店の公開ステータスが非公開でも支店トップ以外の支店サイト配下ページ（商品一覧・商品詳細・カート | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f02-01 | trans : 'front.nav.lang.en' | 【未実装】フロントグローバルナビ_PC版ナビゲーション_PC版ナビゲーションのメニュー内「デッキ構築」リンクが href="#" のままで、デッキTOP画面へ遷 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f02-01 | 乖離（買取画面での言語切替欠落）／要実機確認 | 【未実装】フロントグローバルナビ_PC版ナビゲーション_PC版ナビゲーションのメニュー内「デッキ構築」リンクが href="#" のままで、デッキTOP画面へ遷 | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f03-07 | 乖離（表示要件のみでサーバ側の防御が仕様化されていない・仕様の穴）／要実機確認 | 【一部実装】フロント商品_商品詳細・入荷時通知_商品詳細の英語版にて、高額商品コードを登録している商品でも入荷通知ボタンが表示される | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f04-01 | 乖離（★カスタマイズ未実装・閲覧店舗別TOPへ遷移しない）／要実機確認 | 【未実装】フロント注文_買い物かご_買い物かご画面の画面部品「送料無料までの価格」（識別ID 12）に、支店では非表示とする条件が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f04-02 | 乖離（★カスタマイズ要件の未実装・文言分岐なし）／要実機確認 | 【一部実装】フロント注文_ご注文方法指定_ご注文方法指定画面にて、支店の場合に「注文する」ボタンの文言が「購入する」に変更されない | 機能ID+同一ファイル+類似0.13 |
| f05-01 | 乖離（現行pf未実装・移行先要実機確認） | 【実装乖離】フロントネット買取_ネット買取トップページ_ネット買取トップページにて、強化買取タグの商品をカテゴリごとに表示する「強化買取商品コーナー」が実装され | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f05-02 | 乖離（現行カスタマイズ未達・移行先で対応） | 【一部実装】フロントネット買取_ネット買取商品検索_ネット買取商品検索のSEO対応URLにて、買取TOPのタグ「もっと見る」導線と詳細検索モーダルの検索実行では | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f05-03 | 乖離（0件HTTPステータスが現行404→ユニサーチ200へ変化・Excel未規定）／要実機確認 | 【実装乖離】フロントネット買取_ネット買取商品一覧_ネット買取商品一覧にて、商品数が1のときにマイナスボタンを押下しても20に折り返さず1のまま止まる | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f05-04 | 乖離(詳細設計stale＋pf-eccube3現行未達・enterprise是正済) | 【一部実装】フロント商品_商品詳細_商品詳細の英語版にて、「他のバージョンも見る」の並び替えが動作しない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-02 | 乖離（重大・確定失敗の未ロールバック） | 【未実装】フロント会員_本会員登録_本会員登録にて、仮会員が既にスマレジIDを保有している場合の「登録済みエラー」判定が実装されておらず、エラーにならずに本会員 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-04 | 乖離（移行退行）／L321が移行上書きを免責するが Excel 24h と不一致 | 【実装乖離】フロント会員_パスワード再発行_パスワード再発行にて、リセットキーの有効期限が設計の24時間ではなく10分になっており、メール文面には「10時間」と | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| f06-04 | 乖離（移行退行）／L321免責あるが Excel/詳細と不一致 | 【実装乖離】フロント会員_パスワード再発行_パスワード再発行（パスワード再設定）画面の新しいパスワードの文字数制限が、設計書の画面項目表（最大32文字・8文字以 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| f06-04 | 乖離（エラー画面の差別化欠落・移行退行） | 【未実装】フロント会員_パスワード再発行_パスワード再発行にて、E-1. リセットキー書式エラー画面と E-2. ユーザー存在チェックエラー画面が実装されておら | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f06-04 | 乖離（ルート構造差） | 【未実装】フロント会員_パスワード再発行_パスワード再発行にて、E-1. リセットキー書式エラー画面と E-2. ユーザー存在チェックエラー画面が実装されておら | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f06-05 | 乖離（未移行・退行） | 【一部実装】フロント会員_マイページ_マイページの「あなたへのおすすめアイテム」が常に空表示になり、リコメンド商品が一件も表示されない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f06-05 | 乖離（未実装・空リンク） | 【未実装】フロント会員_マイページ_マイページの「マイデッキ」メニューのリンク先が未設定(href が空)で、押下してもマイデッキ画面へ遷移しない | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| f06-05 | 設計注記（GMO→SP.LINKSで解消・乖離ではない） | 【未実装】フロント会員_マイページ_マイページの「マイデッキ」メニューのリンク先が未設定(href が空)で、押下してもマイデッキ画面へ遷移しない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f06-07 | 乖離（未実装・プレースホルダ露出） | 【一部実装】フロント注文_注文購入履歴詳細_注文購入履歴詳細にて、スマレジ取引のクーポン名・クーポン値引き・免税の値が「TODO: スマレジ連携後」という固定文 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| f06-07 | 乖離疑義（画像マッピング粒度・要実機確認） | 【未実装】フロント注文_注文購入履歴詳細_購入履歴のステータス表示にて、別添資料のBOステータス×注文種別による表示画像切替が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-10 | 乖離（詳細設計テンプレ由来の誤記・実装は参照のみ） | 【実装乖離】フロント会員_ポイント履歴_ポイント履歴の並び順が、設計のポイント履歴ID降順ではなく発行日降順(第2キーがID降順)になっている | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-10 | 乖離（選択肢のサーバ側検証なし）／要実機確認 | 【実装乖離】フロント会員_ポイント履歴_ポイント履歴の並び順が、設計のポイント履歴ID降順ではなく発行日降順(第2キーがID降順)になっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f06-10 | 乖離（Excel簡略記述と実装の並びキー差）／要実機確認 | 【実装乖離】フロント会員_ポイント履歴_ポイント履歴の並び順が、設計のポイント履歴ID降順ではなく発行日降順(第2キーがID降順)になっている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| f06-10 | 乖離（設計/実装のパラメータ名差）／要実機確認 | 【実装乖離】フロント会員_ポイント履歴_ポイント履歴の並び順が、設計のポイント履歴ID降順ではなく発行日降順(第2キーがID降順)になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| f06-11 | 現行は乖離（カスタマイズ未達）／移行先で是正 | 【実装乖離】フロントネット買取_買取履歴一覧_買取履歴一覧にて、同一買取ステータス内の並び順が買取番号の数値降順にならない（文字列比較のため） | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f06-11 | 現行は乖離（カスタマイズ未達）／移行先で是正 | 【実装乖離】フロントネット買取_買取履歴一覧_買取履歴一覧にて、同一買取ステータス内の並び順が買取番号の数値降順にならない（文字列比較のため） | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| f06-11 | 現行は乖離（条件未達）／移行先で是正 | 【実装乖離】フロントネット買取_買取履歴一覧_買取履歴一覧にて、ネット買取の買取金額合計が査定承諾金額合計ではなく申込時買取金額合計になっている | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| f06-11 | 現行は乖離（文言未変更）／移行先で是正 | 【実装乖離】フロントネット買取_買取履歴一覧_買取履歴一覧にて、同一買取ステータス内の並び順が買取番号の数値降順にならない（文字列比較のため） | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-13 | 乖離（カスタマイズ未達＋移行退行） | 【実装乖離】フロント会員_オンライン本人確認_オンライン本人確認の「撮影する身分証明書の種類」に、設計で除外された「住民基本台帳カード」「健康保険被保険者証」が | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| f06-14 | 乖離（バグ候補・(6)非表示未実装） | 【一部実装】フロント会員_マイイベント・デッキ登録_マイイベント・デッキ登録にて、デッキ登録状況ラベルが非表示条件に該当しても常に表示される | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| f06-14 | 乖離（バグ候補・終了境界の定義差） | 【実装乖離】フロント会員_マイイベント・デッキ登録_マイイベント・デッキ登録にて、開催日当日でも開始時刻を過ぎると処理状態が「イベント終了」になる | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| f06-14 | 乖離（文言差・要実機確認） | 【一部実装】フロント会員_マイイベント・デッキ登録_マイイベント・デッキ登録にて、デッキ登録状況ラベルが非表示条件に該当しても常に表示される | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-16 | 乖離（未実装・カスタマイズ/現行踏襲未達） | 【未実装】フロント会員_大会デッキ登録編集_大会デッキ登録編集のデッキ登録処理で、デッキを構築するカード情報（デッキカード）が保存されない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f06-16 | 乖離（未実装） | 【未実装】フロント会員_大会デッキ登録編集_大会デッキ登録編集のデッキ登録処理で、デッキを構築するカード情報（デッキカード）が保存されない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f06-16 | 乖離（サーバ側未実装・クライアント依存） | 【一部実装】フロント会員_大会デッキ登録編集_大会デッキ登録編集にて、カード名入力時のサジェスト候補が取得・表示されない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-16 | 乖離（カスタマイズ未達） | 【未実装】フロント会員_大会デッキ登録編集_大会デッキ登録編集にて、開催店舗が表示されていない | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| f06-17 | 乖離（カスタマイズ未達・開催店舗未表示） | 【未実装】フロント会員_大会デッキ登録確認～完了_大会デッキ登録確認～完了にて、開催店舗が表示されていない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| f06-18 | 乖離（enterprise 遷移先が専用エラー画面でなくフォーム再描画・要実機確認） | 【実装乖離】フロント会員_会員情報変更_会員情報変更にて、ブラックリスト該当時に会員情報更新エラー画面へ遷移しない | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| f06-21 | 乖離（詳細設計の記述誤り＋現行未達・移行先で是正） | 【実装乖離】フロント会員_退会_退会手続き画面のパスワード入力欄の最大文字数が、設計の32文字ではなく50文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f06-21 | 乖離（移行先の表示位置/形式が設計と相違）／要実機確認 | 【実装乖離】フロント会員_退会_退会手続き画面のパスワード入力欄の最大文字数が、設計の32文字ではなく50文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f06-21 | 乖離（オラクル間矛盾・書式サーバ強制は未実装）／要実機確認 | 【実装乖離】フロント会員_退会_退会手続き画面のパスワード入力欄の最大文字数が、設計の32文字ではなく50文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| f06-22 | 乖離（実装が設計より制約強）／要実機確認 | 【実装乖離】フロント会員_お問い合わせ_お問い合わせ画面の件名の選択肢マスタに「協賛関連」が投入されておらず、設計の8件に対して7件しか存在しない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f06-25 |  | 【未実装】フロント会員_店頭注文呼び出し番号表示_店頭注文呼び出し番号表示画面のWiFiパスワードが、本店・支店の判定なく常に表示される | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| f06-25 |  | 【未実装】フロント会員_店頭注文呼び出し番号表示_店頭注文呼び出し番号表示画面のWiFiパスワードが、本店・支店の判定なく常に表示される | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| f06-25 |  | 【実装乖離】フロント会員_店頭注文呼び出し番号表示_店頭注文呼び出し番号表示の本店URLが、設計の /ja/waiting_number_1 ではなく /ja/ | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| f06-25 |  | 【実装乖離】フロント会員_店頭注文呼び出し番号表示_店頭注文呼び出し番号表示の本店URLが、設計の /ja/waiting_number_1 ではなく /ja/ | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f07-01 | 乖離（Excel設計の抽出条件が未実装）／要実機確認 | 【一部実装】フロントイベント_イベント大会TOP_イベント大会TOPのバナースライダー(1-2)にて、開催日当日または開催前かつ公開状態のイベントに登録されたバ | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| f07-01 | 乖離（Excel設計のクエリ引継ぎが未実装）／要実機確認 | 【未実装】フロントイベント_イベント大会TOP_イベント大会TOPの店舗選択(2-1)にて、遷移先URLに現在のページの mode（タブ・表示期間などの状態）が | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| f07-01 | 乖離（固定文言の相違）／要実機確認 | 【実装乖離】フロントイベント_イベント大会TOP_イベント大会TOPのバナースライダー(1-2)にて、自動スクロールの間隔が設計の5秒ではなく4秒になっている | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f07-01 | 乖離（第2ソートキー欠落の疑い）／要実機確認 | 【一部実装】フロントイベント_イベント大会TOP_イベント大会TOPのイベント一覧にて、開催日時昇順の並び替えのみが実装されており、第2ソートキーであるフォーマ | 機能ID+同一ファイル行近接(±25)+類似0.21 |
| f07-03 | 乖離（Excel仕様違反・パンくず構成と絞り込み遷移）／要実機確認 | 【実装乖離】フロントイベント_大会詳細_大会詳細のパンくずリストにて、末尾がイベント開催日付でなくイベント名になっており、店舗名・フォーマットのリンクも絞り込み | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| f07-03 | 乖離（Excel仕様違反・戻り先の退行）／要実機確認 | 【実装乖離】フロントイベント_大会詳細_大会詳細の戻るボタンにて、遷移前のページではなく常にイベント大会TOPへ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| f07-03 | 乖離（人数換算欠落・定員判定の退行）／要実機確認 | 【要確認】フロントイベント_大会詳細_大会詳細の受付期間(1-7)に店頭受付時間を表示し、申込可否はオンライン受付期間で判定している点は、設計上の乖離ではない( | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f07-03 | 乖離（機能欠落・残り予約数と事前予約情報の非表示）／要実機確認 | 【実装乖離】フロントイベント_大会詳細_大会詳細のパンくずリストにて、末尾がイベント開催日付でなくイベント名になっており、店舗名・フォーマットのリンクも絞り込み | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| f07-03 | 乖離（Excel仕様との挙動差・コピー以外の分岐）／要実機確認 | 【実装乖離】フロントイベント_大会詳細_大会詳細の戻るボタンにて、遷移前のページではなく常にイベント大会TOPへ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| f08-01 | 乖離（実装バグ・クライアント入力チェックが no-op）／サーバ側 NotBlank は機能するため実害はUXのみ | 【実装乖離】フロント店頭買取_店頭買取査定申込前ログイン_店頭買取査定申込前ログインにて、メールアドレス入力欄の最大文字数が設計値320文字ではなく255文字に | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| f08-01 | 乖離（Excel最大320のサーバ非強制）／要実機確認（実害はログイン検証・DB列長依存） | 【実装乖離】フロント店頭買取_店頭買取査定申込前ログイン_店頭買取査定申込前ログインにて、メールアドレス入力欄の最大文字数が設計値320文字ではなく255文字に | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| f08-02 | 乖離（Excelカスタマイズ「個人情報取り扱い削除・共通利用規約のみ」が現行pf-eccube3・詳細設計とも未反映＝要 | 【実装乖離】フロント店頭買取_店頭買取査定申込情報入力_店頭買取査定申込情報入力にて、住所3が必須項目になっておらず未入力のまま申込できてしまう | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| f08-03 | 乖離（pf-eccube3 実装バグ・enterprise で是正） | 【未実装】フロント店頭買取_店頭買取査定申込登録確認〜完了_店頭買取査定申込完了画面にて、未成年の申込ユーザーに保護者同意書が表示されない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-09 |  | 【未実装】商品管理_商品規格登録編集_商品規格登録編集にて、スマレジ商品コードの読み取り専用制御・連携ON時の未入力エラー・自動採番がいずれも実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m03-09 | 乖離（適用範囲の差）／要実機確認 | 【未実装】商品管理_商品規格登録編集_商品規格登録編集にて、スマレジ商品コードの読み取り専用制御・連携ON時の未入力エラー・自動採番がいずれも実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-10 | 乖離（詳細設計ハルシネーション・実装/Excelは買取vs基準のみ） | 【一部実装】商品管理_買取・基準価格一括編集_買取・基準価格一括編集にて、買取価格(NM)・基準価格(NM)の最大値9999999999がHTMLのmax属性で | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-10 | 乖離（Excel/詳細設計の上限が未実装）／要実機確認 | 【一部実装】商品管理_買取・基準価格一括編集_買取・基準価格一括編集にて、買取価格(NM)・基準価格(NM)の最大値9999999999がHTMLのmax属性で | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m03-10 | 乖離（Excel必須 vs 実装/詳細設計 任意）／要実機確認 | 【一部実装】商品管理_買取・基準価格一括編集_買取・基準価格一括編集にて、買取価格(NM)・基準価格(NM)の最大値9999999999がHTMLのmax属性で | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-10 | 乖離（全体原子性の欠如・部分コミット）／要実機確認 | 【一部実装】商品管理_買取・基準価格一括編集_買取・基準価格一括編集にて、買取価格(NM)・基準価格(NM)の最大値9999999999がHTMLのmax属性で | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-11 | 乖離（詳細設計の画像処理記述が実装と別物・保存パス形式も相違）／要実機確認 | 【実装乖離】商品管理_カテゴリ登録_カテゴリ登録画面にて、設計で禁止されている最新セット用バナー画像のアップロードが実装されている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-11 | 乖離（詳細設計の記述がExcel・実装の双方と矛盾＝文書側の退行。実装はExcel準拠）／要実機確認 | 【実装乖離】商品管理_カテゴリ登録_カテゴリ登録画面にて、設計で禁止されている最新セット用バナー画像のアップロードが実装されている | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-11 | 乖離（設計に無い入口ルート群・`load` 系の認可が設計未定義）／要実機確認 | 【実装乖離】商品管理_カテゴリ登録_カテゴリ登録画面にて、設計で禁止されている最新セット用バナー画像のアップロードが実装されている | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-12 | 乖離（詳細設計の記述欠落／出力値が空セル・0 のいずれかで未確定）／要実機確認 | 【実装乖離】商品管理_カテゴリCSV出力_カテゴリCSV出力の並び順が表示ランクの降順になっており、設計の昇順と逆になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-12 | 乖離（内部差・拡張点の消失。設計書が沈黙）／要実機確認 | 【実装乖離】商品管理_カテゴリCSV出力_カテゴリCSV出力の並び順が表示ランクの降順になっており、設計の昇順と逆になっている | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-13 | 乖離（カスタマイズ指示の未反映・既存値の意図せぬ上書きリスク）／要実機確認 | 【一部実装】商品管理_タグ登録_タグ登録の並び順に、0〜32767の範囲チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-13 | 乖離（Excel明示の制限が未実装）／要実機確認 | 【一部実装】商品管理_タグ登録_タグ登録の並び順に、0〜32767の範囲チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m03-13 | 乖離（Excel明示の書式制限が未実装）／要実機確認 | 【一部実装】商品管理_タグ登録_タグ登録の並び順に、0〜32767の範囲チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-16 | 乖離（Excel設計の画面部品が現行に欠落・移行先で解消）／要実機確認 | 【未実装】商品管理_略称タグCSVアップロード/フォーマット_略称タグCSVアップロード画面に、CSVインポート履歴の一覧・件数選択・ページングが実装されていな | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-16 | 乖離（設計/現行踏襲違反・入口URL変更）／要実機確認 | 【未実装】商品管理_略称タグCSVアップロード/フォーマット_略称タグCSVアップロード画面に、CSVインポート履歴の一覧・件数選択・ページングが実装されていな | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m03-18 | 乖離（Excel「数字」に対し文字種検証欠落） | 【一部実装】商品管理_部門登録_部門登録の部門コードに、設計の書式「数字」のバリデーションが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m03-18 | 乖離（翻訳キー体系の二重化・表示不整合リスク）／低優先 | 【一部実装】商品管理_部門登録_部門登録の部門コードに、設計の書式「数字」のバリデーションが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-20 | 乖離（Excelカスタマイズが m03-20 ルートで未実装）／要実機確認 | 【一部実装】商品管理_部門登録_部門登録の部門コードに、設計の書式「数字」のバリデーションが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-20 | 乖離（ルート同定の不整合・機能実体の二重化）／要実機確認 | 【一部実装】商品管理_部門登録CSVアップロード/フォーマット_部門登録CSVアップロードにて、部門名・部門コードの最大文字数（128文字）の入力チェックが行わ | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-22 | 乖離（実装がExcel上限1024を超過許容）／要実機確認 | 【実装乖離】商品管理_購入グループ管理_購入グループ管理のメモの最大文字数が設計の1024文字ではなく4000文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.17 |
| m03-22 | 乖離疑義（フロント連動の実装到達は本機能外・実機再現で確定）／要実機確認 | 【実装乖離】商品管理_購入グループ管理_購入グループ管理のメモの最大文字数が設計の1024文字ではなく4000文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-26 | 乖離（仕様未確定TODO）／要実機確認 | 【未実装】商品管理_カード商品CSV登録/フォーマット_カード商品CSV登録にて、設計に定義されている「商品削除フラグ」の列が存在しない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-27 | 乖離（Excel L3195のセール外反映が新規で欠落）／要実機確認 | 【実装乖離】商品管理_グッズ商品CSV登録/フォーマット_グッズ商品CSV登録にて、セール中(セールフラグ有効)の商品の販売価格がCSVの販売価格で上書きされて | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-28 | 乖離（Excel記載と実装が不一致・かつ現行→移行先で見出し名変更＝既存CSV資産が取込不能になる退行）／要実機確認 | 【実装乖離】商品管理_商品タグ更新CSV登録/フォーマット_商品タグ更新CSVのフォーマットにて、列名が設計の「商品タグ(ID)」ではなく「タグID」になってい | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m03-28 | 乖離（Excel明記の処理概要が移行先で未実装＝タグ更新が支店側へ伝播しない退行）／要実機確認 | 【未実装】商品管理_商品タグ更新CSV登録/フォーマット_商品タグ更新CSV登録にて、インポート成功件数の商品ID重複排除が行われていない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-28 | 乖離（現行の運用「CSVでタグ全解除」が移行先で不可能になる退行／Excel必須欄は沈黙のため確定にはユーザー判断が必要 | 【実装乖離】商品管理_商品タグ更新CSV登録/フォーマット_商品タグ更新CSVのフォーマットにて、列名が設計の「商品タグ(ID)」ではなく「タグID」になってい | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m03-33 | 乖離（カスタマイズ未実装・買取価格更新が無い） | 【未実装】商品管理_セール用高額商品価格変更CSV登録/フォーマット_セール用高額商品価格変更CSV登録（M03-33）のCSVに必須項目「買取価格」列が無く、 | 機能ID+同一ファイル行近接(±25)+類似0.21 |
| m03-33 | 乖離（★カスタマイズ未実装・スマレジ連携フラグ処理が無い） | 【未実装】商品管理_セール用高額商品価格変更CSV登録/フォーマット_セール用高額商品価格変更CSV登録（M03-33）のCSVに「スマレジ連携フラグ」列が追加 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-33 | 乖離（フォーマット列数 設計7 vs 実装5） | 【未実装】商品管理_セール用高額商品価格変更CSV登録/フォーマット_セール用高額商品価格変更CSV登録（M03-33）のCSVに必須項目「買取価格」列が無く、 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m03-35 | 乖離（Excel明示要件の未実装・スマレジ連携欠落／結果表示・非同期ステータスも無し）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m03-35 | 乖離（必須チェック欠落。設計上は入力不可のはずの空値が意図せぬNULLクリアを起こしうる）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.19 |
| m03-35 | 乖離（入力値の意味がID→コードへ変質・書式検証欠落）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m03-35 | 乖離（項目名不一致・ヘッダ対応に影響）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m03-35 | 乖離（現行差・メッセージキー変更）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m03-35 | 乖離（現行差・ログ文言変更）／要実機確認 | 【実装乖離】商品管理_部門更新CSV登録/フォーマット_部門更新CSV登録にて、設計で必須の部門コードが任意項目になっている（空欄で部門解除が可能） | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-38 | 乖離（オラクル間不一致・Excel内部矛盾。運用者がExcel記載どおり0で「非公開」を投入すると全行エラー／2で誤って | 【実装乖離】商品管理_商品公開CSV登録/フォーマット_商品公開CSV登録にて、商品公開ステータスのコード値が設計（0:非公開 / 1:公開）と異なり 2:非公 | 機能ID+同一ファイル行近接(±25)+類似0.19 |
| m03-38 | 乖離（Excelの区分ID表記の誤り疑い・#3と同根）／要実機確認・設計側の確定が必要 | 【実装乖離】商品管理_商品公開CSV登録/フォーマット_商品公開CSV登録にて、商品公開ステータスのコード値が設計（0:非公開 / 1:公開）と異なり 2:非公 | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m03-38 | 乖離（現行踏襲差・遷移方式と完了文言の変更。エラー一覧の見え方が変わる）／要実機確認 | 【実装乖離】商品管理_商品公開CSV登録/フォーマット_商品公開CSV登録にて、商品公開ステータスのコード値が設計（0:非公開 / 1:公開）と異なり 2:非公 | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m03-38 | 乖離（Excel未規定・無言スキップの通知欠落）／要実機確認・設計側の確定が必要 | 【実装乖離】商品管理_商品公開CSV登録/フォーマット_商品公開CSV登録にて、商品公開ステータスのコード値が設計（0:非公開 / 1:公開）と異なり 2:非公 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m03-40 | 乖離（Excel必須◯ vs 実装は任意・空欄でNULL更新）／要実機確認 | 【実装乖離】商品管理_棚番号更新CSV登録/フォーマット_棚番号更新CSVにて、設計で必須の棚番号名称が任意項目になっている（空欄で棚番号が解除される） | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m03-40 | 乖離（現行踏襲差・書式検証の追加）／要実機確認 | 【実装乖離】商品管理_棚番号更新CSV登録/フォーマット_棚番号更新CSVにて、設計で必須の棚番号名称が任意項目になっている（空欄で棚番号が解除される） | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m03-40 | 乖離（現行の異常系欠落／移行先で是正）／要実機確認 | 【実装乖離】商品管理_棚番号更新CSV登録/フォーマット_棚番号更新CSVにて、設計で必須の棚番号名称が任意項目になっている（空欄で棚番号が解除される） | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-03 | 乖離（実装バグ疑い・必須未達） | 【実装乖離】在庫管理_在庫一括編集_在庫一括編集にて、必須項目である承認通知先（所属選択）が任意入力になっている | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m04-03 | 乖離（詳細設計条件付き記述 vs Excel/実装の無条件必須） | 【実装乖離】在庫管理_在庫一括編集_在庫一括編集にて、必須項目である承認通知先（所属選択）が任意入力になっている | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m04-04 | 要業務確認（確定乖離ではない）: Excel識別ID順(b)＝主たる候補読解では実装＝Excelで整合し、詳細設計L29 | 【実装乖離】在庫管理_在庫情報CSV出力_在庫情報CSV出力（M04-04）の列順が設計と異なり、在庫が原価単価・総原価より前に出力される | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m04-12 | 乖離（ステータス表記差）／要実機確認 | 【要確認】在庫管理_在庫分割結合一覧_在庫分割結合一覧の検索条件「ステータス」について、分割／結合のタイプ別に選択肢を出し分ける要件は設計書に存在せず、全6ステ | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-13 |  | 【一部実装】在庫管理_在庫結合 登録編集_在庫結合 登録編集にて、結合元商品CSVの10,000件上限と結合元商品一覧の20件ページングが未実装で、結合元在庫数 | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m04-13 |  | 【一部実装】在庫管理_在庫結合 登録編集_在庫結合 登録編集にて、結合数の最大値（99999999）・在庫数超過のエラーチェックが無く、ステータスも設計の7段階 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-13 |  | 【実装乖離】在庫管理_在庫結合 登録編集_在庫結合の承認処理にて、承認後のステータスが「結合計画承認済み」ではなく「入庫済み」になり、却下時の在庫戻し原価が「移 | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m04-13 |  | 【一部実装】在庫管理_在庫結合 登録編集_在庫結合 登録編集にて、結合数の最大値（99999999）・在庫数超過のエラーチェックが無く、ステータスも設計の7段階 | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m04-24 | 乖離（未実装） | 【実装乖離】在庫管理_在庫移動指示検索_在庫移動実績CSV登録にて、設計の2列（移動指示ID・送り状No.）ではなく4列（店舗名2列を含む）のCSVを要求してい | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-24 | 乖離（未実装） | 【未実装】在庫管理_在庫移動指示検索_在庫移動実績CSV登録にて、2,000件の登録上限チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m04-24 | 乖離疑義（文言/位置・移動指示ID併記） | 【未実装】在庫管理_在庫移動指示検索_在庫移動実績CSV登録にて、2,000件の登録上限チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-24 | 乖離（必須ヘッダ列数の相違） | 【実装乖離】在庫管理_在庫移動指示検索_在庫移動実績CSV登録にて、設計の2列（移動指示ID・送り状No.）ではなく4列（店舗名2列を含む）のCSVを要求してい | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-28 | 実装事実の記録（Excel沈黙・要実機確認）。期待には使わない | 【実装乖離】在庫管理_在庫移動指示検索_在庫移動指示検索にて、在庫移動実績入力用CSVダウンロードが選択行を出力せず、常時活性のヘッダーのみのテンプレート出力に | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m04-30 | 乖離（未実装・仕様未達） | 【未実装】在庫管理_バーコード貼替リストCSV出力_バーコード貼替リストCSV出力にて、価格変更発生期間の「最大1か月」の上限チェックが行われていない | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m04-30 | Excel沈黙・実装既定（要実機確認） | 【未実装】在庫管理_バーコード貼替リストCSV出力_バーコード貼替リストCSV出力にて、価格変更発生期間の「最大1か月」の上限チェックが行われていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m04-33 | 乖離（詳細設計⇔実装・ステータス集合不一致）／要実機確認 | 【未実装】在庫管理_在庫移動戻しリストCSV出力_在庫移動・振替一覧の戻しリストCSV出力にて、対象が「在庫移動」であることのチェックが行われていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m05-06 | 乖離（宛先未検証×無トランザクションで部分送信）／要実機確認 | 【一部実装】受注管理_メール一括送信 / 【新規】手動メール通知(確認画面)_手動メール通知(確認画面)のメール一括送信にて、送信失敗時のメッセージ表示が実装さ | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m05-09 | 乖離（支店の棚番ソート抑止 未実装）／要実機確認（支店データで shelfNumberSortNo が null 揃いな | 【実装乖離】受注管理_納品書印刷(日本語)_納品書印刷(日本語)の商品並び順で、支店の場合に棚番のソートを行わないという分岐が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m05-09 | 乖離（ゲスト注文の非会員表示未達・INNER JOIN で欠落）／要実機確認 | 【一部実装】受注管理_納品書印刷(日本語)_納品書印刷(日本語)のデータ取得クエリが会員(Customer/Player)を内部結合しているため、ゲスト(非会員 | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m05-09 | 乖離（複数配送の注文キー上書き）／要実機確認 | 【一部実装】受注管理_納品書印刷(日本語)_納品書印刷(日本語)のデータ取得クエリが会員(Customer/Player)を内部結合しているため、ゲスト(非会員 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m05-11 | 乖離（廃止未達・カスタマイズ未実装） | 【未実装】受注管理_受注情報編集 / 受注情報履歴_受注の新規登録機能が廃止されておらず、admin_order_new ルートから受注を新規登録できる | 機能ID+同一ファイル行近接(±25)+類似0.18 |
| m05-11 | 乖離（バリデーション最大長 設計≠実装） | 【実装乖離】受注管理_受注情報編集 / 受注情報履歴_受注情報編集にて、お名前（姓・名）の最大文字数が16文字、住所1〜3の最大文字数が200文字となっており、 | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m05-27 | 乖離（初期店舗の参照先違い・全店フォールバック未実装） | 【実装乖離】受注管理_店頭注文番号札管理_店頭注文番号札管理の検索店舗セレクトの初期値が、メンバーのデフォルト検索表示店舗ではなく所属店舗になっている | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m05-27 | 乖離（コメント/実装不一致・過剰制限の疑い）／要実機確認 | 【一部実装】受注管理_店頭注文番号札管理_店頭注文番号札管理にて、登録・削除処理にサーバ側の編集権限チェックが無く、画面表示制御だけで権限を担保している | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m05-27 | 乖離（権限判定ロジック違い・編集権限未反映） | 【一部実装】受注管理_店頭注文番号札管理_店頭注文番号札管理にて、登録・削除処理にサーバ側の編集権限チェックが無く、画面表示制御だけで権限を担保している | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m05-27 | 乖離（認可の縦深防御欠如）／要実機確認 | 【一部実装】受注管理_店頭注文番号札管理_店頭注文番号札管理にて、登録・削除処理にサーバ側の編集権限チェックが無く、画面表示制御だけで権限を担保している | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m05-27 | 乖離（コメント/実装不一致・店舗横断確認）／要実機確認 | 【一部実装】受注管理_店頭注文番号札管理_店頭注文番号札管理にて、登録・削除処理にサーバ側の編集権限チェックが無く、画面表示制御だけで権限を担保している | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m05-27 | 乖離（仮実装・店舗CD未使用）／要実機確認 | 【実装乖離】受注管理_店頭注文番号札管理_店頭注文番号札管理の「確認」ボタンのリンク先URLが存在しないパスになっており、選択店舗のフロント注文番号札一覧を表示 | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m06-08 | 乖離（Excel基本設計 単一選択 vs 現行/移行実装 複数選択） | 【実装乖離】店頭買取管理_買取集計データ(検索入力/検索結果)_店頭買取管理＞買取集計データ(検索入力)の部門が単一選択のセレクトボックスではなく複数選択になっ | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m06-11 | 乖離（オラクル未記載の状態更新・要件追認/バグ判断要） | 【未実装】店頭買取管理_戻しリストPDF出力_店頭買取管理＞戻しリストPDF出力にて、作成日時（PDF出力ボタンを押した日時）が表示されない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m07-02 | 乖離（実装バグ・Excel仕様未達） | 【実装乖離】ネット買取管理_古物台帳入力用CSV出力_ネット買取管理＞古物台帳入力用CSVの氏名が、姓と名の間に全角空白なしで連結出力されている | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m08-01 | 乖離（最大長 値相違・Excel100 vs 実装255） | 【実装乖離】会員管理_会員検索一覧(検索入力/検索結果)_会員検索一覧(検索入力)にて、会員ID・メールアドレス・お名前の統合検索欄の最大文字数が設計値100文 | 機能ID+同一ファイル行近接(±25)+類似0.22 |
| m08-02 | 乖離（現行の実装バグ・CSRF/必須未検証）／要実機確認 | 【実装乖離】会員管理_メール一括送信/確認/完了_メール一括送信確認画面にて、配信対象者が会員IDの昇順で表示されることが保証されていない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-04 | 乖離（未実装・カスタマイズ未達） | 【未実装】会員管理_会員登録編集_会員登録編集の保存時に、本人確認ステータスを未確認へ戻した際の身分証有効期限クリア処理が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.25 |
| m08-04 | 乖離（最大長 値相違・詳細設計ハルシネーション併発） | 【実装乖離】会員管理_会員登録編集_会員登録編集にて、海外用郵便番号の最大文字数が設計値100文字ではなく10文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.22 |
| m08-04 | 乖離（必須解除 未達）／要実機確認 | 【実装乖離】会員管理_会員登録編集_会員登録編集にて、メールアドレスの最大文字数が設計値85文字ではなく254文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m08-04 | 乖離（廃止 未達）／要実機確認（導線制御の有無） | 【実装乖離】会員管理_会員登録編集_会員登録編集にて、廃止対象である会員の新規登録ルート(admin_customer_new)が残存している | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m08-04 | 設計どおり✓（Excel）／詳細設計の記載漏れ | 【実装乖離】会員管理_会員登録編集_会員登録編集にて、退会区分の最大文字数が設計値256文字ではなく255文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.23 |
| m08-04 | 設計どおり✓（Excel）／詳細設計ハルシネーション（必須→任意の誤り） | 【実装乖離】会員管理_会員登録編集_会員登録編集にて、メールアドレスの最大文字数が設計値85文字ではなく254文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m08-07 | 乖離（並び順の実装バグ候補）／要実機確認 | 【実装乖離】会員管理_メール配信履歴_メール配信履歴にて、並び順が処理日(送信日)降順ではなくID降順になっている | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m08-07 | 乖離（詳細設計の誤記述・オラクルはExcelを採用） | 【実装乖離】会員管理_メール配信履歴_メール配信履歴にて、並び順が処理日(送信日)降順ではなくID降順になっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-07 | 乖離（移行でのルート再構成・低影響）／要実機確認 | 【実装乖離】会員管理_メール配信履歴_メール配信履歴にて、並び順が処理日(送信日)降順ではなくID降順になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m08-07 | trans | 【実装乖離】会員管理_メール配信履歴_メール配信履歴にて、並び順が処理日(送信日)降順ではなくID降順になっている | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m08-08 | 乖離（カスタマイズ要件が現行に未実装・移行先で実装済／詳細設計がExcelカスタマイズ要件を反映していない）／要実機確認 | 【実装乖離】会員管理_手動メール通知(入力/確認)_手動メール通知(確認画面)にて、戻るリンクが会員編集画面ではなく入力画面へ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m08-08 | 乖離（検証エラーのサイレント破棄・入力チェック結果が提示されない）／要実機確認 | 【実装乖離】会員管理_手動メール通知(入力/確認)_手動メール通知(確認画面)にて、戻るリンクが会員編集画面ではなく入力画面へ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-08 | 乖離（現行踏襲差・送信後の遷移先が作成画面→会員編集画面へ変更）／要実機確認 | 【実装乖離】会員管理_手動メール通知(入力/確認)_手動メール通知(確認画面)にて、戻るリンクが会員編集画面ではなく入力画面へ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m08-08 | 乖離（現行踏襲差・入口URL形状の変更／観測結果の404自体は同じ）／要実機確認 | 【実装乖離】会員管理_手動メール通知(入力/確認)_手動メール通知(入力画面)にて、必須項目であるテンプレ選択が必須になっていない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-08 | 要実機確認（詳細設計が自ら要確認とする箇所・移行先で作成者が記録される可能性） | 【実装乖離】会員管理_手動メール通知(入力/確認)_手動メール通知(確認画面)にて、戻るリンクが会員編集画面ではなく入力画面へ遷移する | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-09 | 乖離（Excel必須 vs 現行任意・詳細設計HTMLがExcelと矛盾）／要実機確認 | 【実装乖離】会員管理_配送先編集_配送先編集にて、配送先海外用郵便番号の最大文字数が設計値100文字ではなく10文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m08-09 | 乖離（最大文字数の設計不一致・現行はサーバ側長さ検証なし）／要実機確認 | 【実装乖離】会員管理_配送先編集_配送先編集にて、配送先会社名の最大文字数が設計値100文字ではなく255文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.24 |
| m08-09 | 乖離（最大文字数100が未実装・整数書式の検証なし）／要実機確認 | 【実装乖離】会員管理_配送先編集_配送先編集にて、配送先海外用郵便番号の最大文字数が設計値100文字ではなく10文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m08-09 | 乖離（現行踏襲差・郵便番号エラー文言の変更）／要実機確認 | 【実装乖離】会員管理_配送先編集_配送先編集にて、配送先海外用郵便番号の最大文字数が設計値100文字ではなく10文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m08-09 | 乖離（現行は会員スコープ検証欠落・移行先で強化）／要実機確認 | 【実装乖離】会員管理_配送先編集_配送先編集にて、配送先海外用郵便番号の最大文字数が設計値100文字ではなく10文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-12 | 乖離（現行踏襲違反・必須/最大長サーバ検証の欠落）／要実機確認 | 【実装乖離】会員管理_顧客グループ管理_顧客グループ管理にて、ポイント還元率が0以上の制限を満たさず、最大値も設計値4294967295に対しSMALLINT( | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m08-12 | 0)$/'])`。先頭の `[-]?` により `-1` がフォーム検証を通過する）。一方で列は `unsigned`  | 【実装乖離】会員管理_顧客グループ管理_顧客グループ管理にて、ポイント還元率が0以上の制限を満たさず、最大値も設計値4294967295に対しSMALLINT( | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m08-12 | 乖離（現行踏襲違反・桁縮小／詳細設計の「同一スキーマ」記述の誤り）／要実機確認 | 【実装乖離】会員管理_顧客グループ管理_顧客グループ管理にて、ポイント還元率が0以上の制限を満たさず、最大値も設計値4294967295に対しSMALLINT( | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m08-12 | 乖離（Excel「すべて表示」との差／現行・移行先間でも除外集合が相違）／要実機確認 | 【実装乖離】会員管理_顧客グループ管理_顧客グループ管理にて、支払方法のチェックボックスに支払方法設定の全支払方法が表示されていない | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m08-13 | 乖離（Excel明示仕様の欠落・現行踏襲違反／P1）／要実機確認 | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.18 |
| m08-13 | 乖離（現行踏襲違反・空白整形の欠落）／要実機確認 | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m08-13 | 乖離（現行がExcel必須○に違反・サイレント削除／P1・現行踏襲すると不具合を継承）／要人手判断 | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m08-13 | 乖離（現行がExcel「サーバ側で行う」L4875・必須○ L4900 に違反）／要実機確認 | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m08-13 | 要実機確認（正本沈黙のため断定しない） | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m08-13 | 要実機確認（RG-034・正本が両立しないため断定しない） | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m08-13 | 要実機確認（正本沈黙・RG-001） | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m08-13 | 要実機確認（RG-023,024・Excelの字義解釈が要確定） | 【一部実装】会員管理_ブラックリスト管理_ブラックリスト管理にて、電話番号キーワードのハイフン除去処理が実装されておらずハイフン入力がエラーになる | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-01 | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、設計で任意項目とされている「会社名」が必須入力になっている | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m10-01 | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、設計で任意項目とされている「店名(英語表記)」が必須入力になってい | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m10-01 | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、設計で任意項目とされている「住所」（郵便番号・都道府県・住所1・住 | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m10-01 | 乖離（現行踏襲違反・既定値の反転／設計書内の記述不整合）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、「仮会員を有効にする」の初期値が設計の「無効」ではなく「有効」にな | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m10-01 | 乖離（Excel設計 vs 現行・移行先の双方／Excel初期値の意図が新規行既定か画面初期選択か要確定）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、「仮会員を有効にする」の初期値が設計の「無効」ではなく「有効」にな | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m10-01 | 乖離（現行踏襲差・画面部品種別の変更）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)の「商品ごとの送料設定を有効にする」が、設計・現行のラジオボタン(無効／ | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m10-01 | 乖離（設計の対象外宣言と移行先実装の不一致・税ルールが意図せず変更されうる）／要実機確認 | 【実装乖離】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)の「複数配送を有効にする」が、設計・現行のラジオボタン(無効／有効)では | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-01 | trans }}`）。詳細設計も「登録ボタン」と記述（`m10-01_admin_shop_setting_settin | 【要確認】基本情報設定_特定商取引に関する法律_特定商取引に関する法律（M10-02）の識別ID 1-13「問い合わせ専用メールアドレス」は、設計書が基本設定（ | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m10-01 | 乖離（Excel規定の名称変更が未反映）／要実機確認 | 【未実装】基本情報設定_基本設定(旧ショップマスター)_基本設定(旧ショップマスター)にて、「FAX番号」の入力欄が画面・フォームともに存在せず設定できない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-01 | 乖離（設計未記載項目の追加・設計書の網羅性不足）／要実機確認 | 【要確認】基本情報設定_特定商取引に関する法律_特定商取引に関する法律（M10-02）の識別ID 1-12「送信エラー通知メールアドレス」は、設計書が基本設定（ | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m10-02 | 乖離（現行踏襲違反・画面項目構造の退行。Excel/詳細設計が規定する固定21項目が移行先に存在しない）／要実機確認 | 【実装乖離】基本情報設定_特定商取引に関する法律_特定商取引に関する法律の2行目の項目名が、設計・現行の「運営責任者」ではなく EC-CUBE標準の「代表責任者 | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m10-02 | 乖離（現行踏襲違反・必須検証の喪失＝データ欠落を許す退行）／要実機確認 | 【一部実装】基本情報設定_特定商取引に関する法律_特定商取引に関する法律に、設計・現行が定める「FAX」の項目が初期投入データに存在せず、初期表示されない | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-02 | 乖離（現行踏襲違反・プラグイン拡張点の喪失）／要実機確認 | 【実装乖離】基本情報設定_特定商取引に関する法律_特定商取引に関する法律の2行目の項目名が、設計・現行の「運営責任者」ではなく EC-CUBE標準の「代表責任者 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-02 | trans }}`。Excel「設定」／詳細設計・現行「登録」／移行先「保存」の三者三様 | 【一部実装】基本情報設定_特定商取引に関する法律_特定商取引に関する法律に、設計・現行が定める「FAX」の項目が初期投入データに存在せず、初期表示されない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m10-02 | 乖離（Excel設計 vs 実装・M10-01 からの写し込み疑い＝Excel側の是正候補）／要実機確認 | 【要確認】基本情報設定_特定商取引に関する法律_特定商取引に関する法律（M10-02）の識別ID 1-10「送信元メールアドレス」は、設計書が基本設定（M10- | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-02 | 乖離（現行踏襲違反・住所補完機能の喪失。#1 の構造差に随伴）／要実機確認 | 【実装乖離】基本情報設定_特定商取引に関する法律_特定商取引に関する法律の2行目の項目名が、設計・現行の「運営責任者」ではなく EC-CUBE標準の「代表責任者 | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-02 | 乖離（設計の処理順序と不一致・二重バインドの副作用は未確認）／要実機確認 | 【要確認】基本情報設定_特定商取引に関する法律_特定商取引に関する法律（M10-02）の識別ID 1-13「問い合わせ専用メールアドレス」は、設計書が基本設定（ | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m10-07 | 乖離（現行踏襲違反・Excel画面項目1-1/1-2の欠落＝最重要）／要実機確認 | 【未実装】基本情報設定_税率設定_税率設定にて、個別税率設定（商品別税率機能）を登録するボタンが存在しない | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m10-07 | 乖離（現行踏襲違反・上限検証の欠落）／要実機確認 | 【未実装】基本情報設定_税率設定_税率設定にて、個別税率設定（商品別税率機能）を登録するボタンが存在しない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-07 | 乖離（現行踏襲違反・編集導線の変更）／要実機確認 | 【未実装】基本情報設定_税率設定_税率設定にて、個別税率設定（商品別税率機能）を登録するボタンが存在しない | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-08 | 乖離（Excel「全種」≠実装の自動送信限定）／要実機確認（Excel記載が literal な「全種」か、自動送信メー | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「テンプレ選択」の選択肢が自動送信フラグの立ったテンプレートのみに絞り込まれており、登録済みメール | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-08 | 乖離（現行の上限50 ≠ Excel 255・現行踏襲すると仕様未達）／要実機確認 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「本文上部」の最大文字数（32768文字）が検証されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-08 | 乖離（現行は上限未強制・256文字以上が保存され得る）／要実機確認 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「本文上部」の最大文字数（32768文字）が検証されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-08 | 乖離（両系で上限32768が未強制・32769文字以上が保存され得る）／要実機確認 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「本文下部」の最大文字数（32768文字）が検証されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-08 | 乖離候補（現行=任意／移行先=必須。Excel `-` の解釈が未確定のため断定せず）／要実機確認 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「本文上部」の最大文字数（32768文字）が検証されていない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m10-08 | 乖離（現行踏襲違反・候補の並び順が名称昇順→ID昇順へ変化）／要実機確認 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、「テンプレ選択」の選択肢が自動送信フラグの立ったテンプレートのみに絞り込まれており、登録済みメール | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m10-08 | 乖離候補（「最終更新者」を作成者列に保存する設計＝作成者の追跡不能。Excelは保存先列に沈黙のため断定せず）／要実機確 | 【実装乖離】基本情報設定_自動送信メール_自動送信メールにて、初期表示で表示されるべき「テンプレ名称」「件名」がテンプレート未選択時に非表示になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m10-09 | 乖離（設計書の機能ID/範囲の割当欠落＝M10-09の詳細設計が不在・Excel規定の最大長が実装に無い・本文欄構成差） | 【一部実装】基本情報設定_メール設定_メール設定(M10-09)にて、本文の最大文字数65536文字のバリデーションが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-10 | 乖離（Excel「登録されているCSV全種」違反・現行踏襲違反）／要実機確認 | 【実装乖離】基本情報設定_CSV出力項目設定_CSV出力項目設定(M10-10)にて、CSV種別セレクトの選択肢が登録済みCSV全種になっておらず、3種類が除外 | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m10-13 | 乖離（オラクル外の選択肢混入）／要実機確認: Excel・詳細設計の双方が出さないとする会員CSVが選択可能。意図的な仕 | 【実装乖離】基本情報設定_カスタムCSV出力設定_カスタムCSV出力設定(M10-13)にて、CSV選択の選択肢に設計にない会員CSVが含まれており、設計の6種 | 機能ID+同一ファイル行近接(±25)+類似0.19 |
| m10-13 | 設計文書の陳腐化（詳細設計 vs Excel）: 詳細設計 `…m10-13_…html:345` の「商品・受注・配送 | 【実装乖離】基本情報設定_カスタムCSV出力設定_カスタムCSV出力設定(M10-13)にて、CSV選択の選択肢に設計にない会員CSVが含まれており、設計の6種 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-13 | 乖離（同一 sort_no 時の並びが不定）／要実機確認: `sort_no` 重複時に左リストの表示順がDB依存で揺れ | 【実装乖離】基本情報設定_カスタムCSV出力設定_カスタムCSV出力設定(M10-13)のCSV選択セレクトにて、選択肢が設計の6種ではなく会員CSVを含む7種 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m10-13 | 乖離（軽微・表示文言差） | 【実装乖離】基本情報設定_カスタムCSV出力設定_カスタムCSV出力設定(M10-13)のCSV選択セレクトにて、選択肢が設計の6種ではなく会員CSVを含む7種 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m10-13 | 乖離（宣言済み必須制約が実効しない）／要実機確認: 宣言と実効の不一致。現行踏襲ではあるが、Excel/詳細設計の必須要 | 【実装乖離】基本情報設定_カスタムCSV出力設定_カスタムCSV出力設定(M10-13)にて、CSV選択の選択肢に設計にない会員CSVが含まれており、設計の6種 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-15 | 乖離（カスタマイズ未実装・画面項目欠落） | 【実装乖離】基本情報設定_店舗登録_店舗登録(M10-15)にて、店舗種別ラジオの選択肢の並び順が設計（支店→本店）と逆になっている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-15 | 乖離（Excel画面項目の記載漏れ疑い）／要実機確認 | 【実装乖離】基本情報設定_店舗登録_店舗登録(M10-15)にて、住所の最大文字数が設計の32文字ではなく90文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m10-15 | 乖離（最大値の不一致・4項目群） | 【実装乖離】基本情報設定_店舗登録_店舗登録(M10-15)にて、住所の最大文字数が設計の32文字ではなく90文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.18 |
| m10-15 | 乖離（必須制約の欠落・表示順は画面項目欠落） | 【一部実装】基本情報設定_店舗登録_店舗登録(M10-15)にて、店名(カナ)が必須項目になっておらず、未入力のまま登録できる | 機能ID+同一ファイル+類似0.12 |
| m10-15 | 乖離（最大値未実装） | 【一部実装】基本情報設定_店舗登録_店舗登録(M10-15)にて、各メールアドレス項目に最大92文字の文字数制限が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.16 |
| m10-15 | 乖離（内部差・列の残置）／要実機確認 | 【実装乖離】基本情報設定_店舗登録_店舗登録(M10-15)にて、店舗種別ラジオの選択肢の並び順が設計（支店→本店）と逆になっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m10-16 | 乖離（0以上バリデーション未実装） | 【一部実装】基本情報設定_追加システム設定_追加システム設定(M10-16)にて、買取査定申込み完了画面の自動遷移秒数に「0以上」のバリデーションが実装されてい | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m10-16 | 乖離（Excel任意と実装required=trueの矛盾／NotBlank欠落） | 【一部実装】基本情報設定_追加システム設定_追加システム設定(M10-16)にて、管理画面自動ログアウト時間（分）の最大値255のバリデーションが実装されていな | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m10-16 | 乖離（Excel記載と実装仕様の不整合・要仕様確定） | 【実装乖離】基本情報設定_追加システム設定_追加システム設定画面にて、「入荷通知メールの許可」が設計書の自由入力（全角・半角）・任意ではなく、必須の2択セレクト | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m10-16 | 乖離（永続化キーの転用・移行データ整合リスク） | 【実装乖離】基本情報設定_追加システム設定_追加システム設定(M10-16)にて、スマレジ契約IDの入力チェックが「半角英数、スペース」になっておらず、記号を許 | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m10-16 | 詳細設計ハルシネーション（DB正=enterprise では update_date 更新される） | 【一部実装】基本情報設定_追加システム設定_追加システム設定(M10-16)にて、イベント決済確認エラー通知メールアドレスの入力欄が画面に存在せず、設定・保存が | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m10-16 | 乖離（Excel削除指示 vs 実装のキー転用） | 【実装乖離】基本情報設定_追加システム設定_追加システム設定(M10-16)にて、スマレジ契約IDの入力チェックが「半角英数、スペース」になっておらず、記号を許 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m12-01 | 乖離（丸め方式の不一致・金額系）／要実機確認 | 【一部実装】分析・集計管理_日別・月別集計 集計一覧（検索項目/検索結果）_日別・月別集計の検索結果にて、店舗名の「その他」区分が集計・出力されない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m12-02 | 乖離（現行=カスタマイズ未実装／詳細設計とExcelの競合）／移行先で充足・要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-02 | 乖離（Excelカスタマイズ要件の未実装・CSV最終行の総合計欠落）／要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m12-02 | 乖離（現行踏襲違反・BOM欠落）／要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-02 | 乖離（現行踏襲違反・ファイル名差）／要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-02 | 乖離（設計違反・セッション空時に出力しない／設計外のエラー分岐追加）／要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m12-02 | 乖離（詳細設計とExcelの競合・Excel優先で解決／旧列の扱いはExcel沈黙）／要実機確認 | 【実装乖離】分析・集計管理_日別・月別集計 CSV出力_日別・月別集計CSV出力にて、注文ステータス「出荷完了」のみを計上する集計方式が反映されていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-05 | 乖離（Excel要件違反・会員名検索の欠落／現行踏襲違反・分割検索の欠落） | 【一部実装】分析・集計管理_入荷通知依頼 一覧表示（検索項目/検索結果）_入荷通知依頼一覧のキーワード検索が商品名(日/英)のみで、会員名で検索できない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m12-05 | 乖離（現行踏襲差・会員名並べ替えの欠落）／要実機確認（RG-015,027と連動） | 【一部実装】分析・集計管理_入荷通知依頼 一覧表示（検索項目/検索結果）_入荷通知依頼一覧のキーワード検索が商品名(日/英)のみで、会員名で検索できない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m12-05 | 仕様未確定（設計側で確定させるべき論点・実装解釈を期待に採用しない）／要仕様確定＋要実機確認 | 【実装乖離】分析・集計管理_入荷通知依頼 一覧表示（検索項目/検索結果）_入荷通知依頼一覧の「削除」件数が、商品ID単位ではなく商品ID×言語単位で全規格削除を | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m12-06 | 乖離（設計違反・BOM欠落の退行）／要実機確認 | 【一部実装】分析・集計管理_入荷通知依頼 CSV出力_入荷通知依頼CSV出力にて、項目「通知済み/削除」が「削除」件数のみとなっている | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m12-06 | 乖離（項目名不一致）／要実機確認 | 【一部実装】分析・集計管理_入荷通知依頼 CSV出力_入荷通知依頼CSV出力にて、項目「通知済み/削除」が「削除」件数のみとなっている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m12-06 | 乖離（計上式の解釈差・併存時に取りこぼし）／要実機確認 | 【一部実装】分析・集計管理_入荷通知依頼 CSV出力_入荷通知依頼CSV出力にて、項目「通知済み/削除」が「削除」件数のみとなっている | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m12-06 | 乖離（行の分割単位・重複排除キーが設計に明示なし）／要実機確認 | 【一部実装】分析・集計管理_入荷通知依頼 CSV出力_入荷通知依頼CSV出力にて、項目「通知済み/削除」が「削除」件数のみとなっている | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m12-09 | date("Y-m-d") }}`）。移行先も同じく2週間前 — `ec-cube-enterprise/src/Ecc | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.22 |
| m12-09 | 乖離（表示・入力書式の区切りがExcel規定と不一致）／要実機確認 | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m12-09 | 乖離（画面項目ラベルの不一致）／要実機確認 | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m12-09 | 乖離（現行はサーバ側の必須検証が無くExcelの必須〇を満たさない／移行先は適合）／要実機確認 | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m12-09 | 乖離（設計はトークンありだが現行・移行先ともCSRF無効。現行はexport側のみ有効で内部不整合）／要実機確認 | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-09 | 乖離（入口URL・HTTPメソッド・{mode}指定の消失／ルート名変更）／要実機確認 | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m12-09 | 乖離（設計の「集計結果の表示」が現行・移行先とも存在しない＝設計過剰記述か実装欠落／要実機確認・仕様確認） | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m12-09 | 適合（カスタマイズ＝略式廃止が移行先で適用済み・乖離なし） | 【実装乖離】分析・集計管理_特集タグ編集CSVダウンロード（検索項目）_特集タグ編集CSVダウンロードにて、集計日(From)の初期値が当月1日ではなく2週間前 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m13-01 | 乖離（現行=★カスタマイズ未達／移行先で対応済）／要実機確認 | 【要確認】イベント管理_イベント一覧(検索入力/検索結果)_イベント一覧の★権限による表示制御は、改訂後の設計要件（権限保持店舗のイベントのみ編集可能／削除は権 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m13-01 | 乖離（現行=★カスタマイズ未達／移行先で対応済）／要実機確認 | 【要確認】イベント管理_イベント一覧(検索入力/検索結果)_イベント一覧の★権限による表示制御は、改訂後の設計要件（権限保持店舗のイベントのみ編集可能／削除は権 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-01 | 乖離（移行先=Excel明示の略称検索が欠落・退行）／要実機確認 | 【未実装】イベント管理_イベント一覧(検索入力/検索結果)_イベント一覧（検索入力）の検索キーワード「イベント名、略称」に、設計書で定められた最大50文字の入力 | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-02 | 乖離（移行先で退行・未実装）／要実機確認 | 【実装乖離】イベント管理_イベント編集 / イベント削除_イベント編集の「イベント名(日)」はフォーム上255文字まで入力できるが、DB列が155文字のため15 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m13-03 | 乖離（★カスタマイズ要件の判定条件差・過検知/検知漏れの双方）／要実機確認 | 【実装乖離】イベント管理_日程登録_日程登録の「参加費」の最大桁数が設計書の50文字に対して8桁であり、初期値も設計書の0ではなく親イベントの参加費が設定される | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-03 | 乖離（条件付き必須がサーバ側で成立せずJS迂回で欠落登録が通りうる）／要実機確認 | 【一部実装】イベント管理_日程登録_日程登録の「受付終了時間」に、サーバ側の条件必須チェックと初期値00:00が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-03 | 乖離（数値下限がサーバ側で成立せず定員0の登録が通りうる）／要実機確認 | 【一部実装】イベント管理_日程登録_日程登録の「受付終了時間」に、サーバ側の条件必須チェックと初期値00:00が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-03 | 乖離（Excel未規定の相関制約＝設計に無いエラーが発生しうる）／要実機確認 | 【一部実装】イベント管理_日程登録_日程登録の「受付終了時間」に、サーバ側の条件必須チェックと初期値00:00が実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-03 | 乖離（定員/参加費/公開状態の初期値がExcel定数と一致しない可能性）／要実機確認 | 【実装乖離】イベント管理_日程登録_日程登録の「公開状態」の初期値が、設計書の「公開」ではなく親イベントの公開状態になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-04 | 乖離（必須バリデーション未達）／要実機確認 | 【一部実装】イベント管理_繰返日程追加_繰返日程追加の「受付開始時間」「受付終了時間」に、初期値00:00と受付ありの場合の必須チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-04 | 乖離（相関バリデーション未達） | 【一部実装】イベント管理_繰返日程追加_繰返日程追加の「受付開始時間」「受付終了時間」に、初期値00:00と受付ありの場合の必須チェックが実装されていない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-05 | 乖離（Excel必須項目の欠落＝未実装／現行踏襲差）／要実機確認 | 【一部実装】イベント管理_複製新規_イベント複製新規・新規登録画面にて、「店舗」の選択肢が編集権限のある店舗に絞り込まれず全店舗が表示される | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m13-05 | 乖離（必須/任意の相違）／要実機確認 | 【一部実装】イベント管理_複製新規_イベント複製新規・新規登録画面にて、「店舗」の選択肢が編集権限のある店舗に絞り込まれず全店舗が表示される | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-05 | 乖離（プルダウン絞り込みの欠落・縦深防御の片肺）／要実機確認 | 【一部実装】イベント管理_複製新規_イベント複製新規・新規登録画面にて、「店舗」の選択肢が編集権限のある店舗に絞り込まれず全店舗が表示される | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m13-05 | 乖離（設計未確定＋現行踏襲差・要設計判断）／要実機確認 | 【一部実装】イベント管理_複製新規_イベント複製新規・新規登録画面にて、「店舗」の選択肢が編集権限のある店舗に絞り込まれず全店舗が表示される | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m13-06 | 乖離（現行未実装・詳細設計の記述漏れ／移行先で充足）／要実機確認 | 【未実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件に「チームメンバー確認状況」が存在しない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m13-06 | 乖離（Excelカスタマイズ要件の未実装・権限による情報露出の可能性）／要実機確認 | 【未実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件「プレイヤー名」に、設計書で定められた最大255字の入力制限が実装され | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-06 | 乖離（現行に廃止対象が残存＝移行先で解消済。刷新後の実装対象ではない） | 【未実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件に「チームメンバー確認状況」が存在しない | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-06 | 乖離（正本 `superseded-notice` が Excel 削除項目3-3 を取りこぼし＝詳細設計の記述漏れ）／ | 【未実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件に「チームメンバー確認状況」が存在しない | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m13-06 | 乖離（現行未実装・詳細設計の記述漏れ／移行先で充足。エラー文言はExcelに明示なし）／要実機確認 | 【一部実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件「支払番号」に、設計書で定められた最大64字の入力制限が実装されてい | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m13-06 | 乖離（入力長制限の消失／L331「移行で変わらない」に反するキー改名・既定ソートキーの退行）／要実機確認 | 【未実装】イベント管理_イベント申込一覧(検索入力/検索結果)_イベント申込一覧の検索条件「プレイヤー名」に、設計書で定められた最大255字の入力制限が実装され | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m13-08 | 乖離（現行=カスタマイズ要件未達／移行先=充足）／要実機確認 | 【実装乖離】イベント管理_デッキ表示_デッキ表示画面の「Event」欄に、設計書のイベント名（英）ではなくイベント名（日）が表示されている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m13-08 | 乖離（移行先=Excel画面項目違反・Event欄の日英退行）／要実機確認 | 【実装乖離】イベント管理_デッキ表示_デッキ表示画面の「Event」欄に、設計書のイベント名（英）ではなくイベント名（日）が表示されている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-10 | 乖離（カスタマイズ要件が現行未反映／詳細設計HTMLがExcelと矛盾）／要実機確認 | 【実装乖離】イベント管理_イベント申込詳細・編集(＋プレイヤー検索)_イベント申込詳細・編集(M13-10)の「支払金額」が、設計指定の「ラベル(参照表示)」で | 機能ID+同一ファイル行近接(±25)+類似0.12 |
| m13-10 | 乖離（既定が仕様と逆・オプション依存で要件が失われうる）／要実機確認 | 【実装乖離】イベント管理_イベント申込詳細・編集(＋プレイヤー検索)_イベント申込詳細・編集(M13-10)の「支払金額」が、設計指定の「ラベル(参照表示)」で | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m13-11 | 乖離（★カスタマイズ未実装・移行先の申込登録検索で権限外店舗のイベントが見える）／要実機確認 | 【一部実装】イベント管理_イベント申込登録(検索入力/検索結果)_イベント申込登録（検索結果）の「新規登録」ボタンが、編集権限のない店舗のイベントに対しても表示 | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m13-11 | 乖離（★カスタマイズ未実装・権限外店舗のイベントで登録導線が露出）／要実機確認 | 【一部実装】イベント管理_イベント申込登録(検索入力/検索結果)_イベント申込登録（検索結果）の「新規登録」ボタンが、編集権限のない店舗のイベントに対しても表示 | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m13-12 |  | 【未実装】イベント管理_イベント新規申込登録(＋プレイヤー検索)_イベント新規申込登録画面に、設計書で表示項目とされている「会場」が表示されていない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m13-15 | 未実装（カスタマイズ要件未反映・削除権限の欠落＝縦深防御の穴・URL直接アクセス）／要実機確認 | 【実装乖離】イベント管理_画像設定_画像設定の削除リンクの確認メッセージが、設計書で指定された文言と異なる | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m13-15 | 乖離（Excel必須 vs 実装任意・表示/処理の不整合）／要実機確認 | 【一部実装】イベント管理_画像設定_画像設定のアップロード先「店舗」の初期値に、メンバーのデフォルト表示の店舗が設定されない | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m14-04 | Excel記載の疑義（画面項目表の誤記の可能性）／要実機確認・要設計確認 | 【実装乖離】カード管理_カード詳細(登録・編集・削除)_カード詳細(登録・編集・削除)にて、カラーが設計の単一選択ではなく複数選択のチェックボックスになっている | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m14-04 | 乖離（Excel指定文言の不一致）／要実機確認 | 【実装乖離】カード管理_カード一覧(検索結果)_カード一覧(M14-01)の単体削除は機能・遷移・紐付きエラーとも設計どおりだが、削除確認ポップアップの文言のみ | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m14-04 | 乖離（Excel指定文言の不一致）／要実機確認 | 【実装乖離】カード管理_カード詳細(登録・編集・削除)_カード詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードを削除してもよろ | 機能ID+同一ファイル行近接(±25)+類似0.15 |
| m14-04 | 乖離（詳細設計のメッセージキー名のみ・利用者非観測）／要実機確認 | 【実装乖離】カード管理_カード詳細(登録・編集・削除)_カード詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードを削除してもよろ | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m14-04 | 乖離（ルート・パス体系差＝詳細設計の記述が現行3系のまま）／要実機確認 | 【一部実装】カード管理_カード詳細(登録・編集・削除)_カード詳細(編集・削除)にて、詳細情報が商品と紐づく場合でも「詳細情報を追加」ボタンが非表示にならない | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m14-05 | 設計書間の乖離（詳細設計HTMLがカスタマイズ前の現行を記述・Excel優先で無効）／設計書更新が必要（実装＝enter | 【実装乖離】カード管理_カード登録CSV（取込項目）_カード登録CSV取込にて、イラストレーターが必須になっておらず、マスタ未登録名でもエラーにせず新規マスタを | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m14-05 | 設計書間の乖離（詳細設計HTMLがカスタマイズ前の現行を記述・Excel優先で無効）／除外列一覧は実装と設計の双方で要更 | 【未実装】カード管理_カード登録CSV（取込項目）_カード登録CSVにて、キーワード能力の取込・出力が未実装のまま放置されている | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m14-06 | trans({ "%name%" : Cardset.nameJp }) }}"`、実文言は `ec-cube-ente | 【実装乖離】カード管理_カードセット一覧_カードセット一覧にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセットを削除してもよろしいですか？」に | 機能ID+同一ファイル行近接(±25)+類似0.18 |
| m14-08 | 乖離（Excelカスタマイズ要件違反・確認文言差）／要実機確認 | 【実装乖離】カード管理_カードセット詳細(登録・編集・削除)_カードセット詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセッ | 機能ID+同一ファイル行近接(±25)+類似0.14 |
| m14-08 | 乖離（Excelカスタマイズ要件違反・完了文言差）／要実機確認 | 【実装乖離】カード管理_カードセット詳細(登録・編集・削除)_カードセット詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセッ | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m14-08 | 乖離（現行踏襲差・ルート体系の不整合）／要実機確認 | 【実装乖離】カード管理_カードセット詳細(登録・編集・削除)_カードセット詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセッ | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m14-08 | 乖離（現行踏襲違反・戻り先の退行）／要実機確認 | 【実装乖離】カード管理_カードセット詳細(登録・編集・削除)_カードセット詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセッ | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m14-08 | 乖離（現行踏襲差・送信ルート構造と完了文言）／要実機確認 | 【実装乖離】カード管理_カードセット詳細(登録・編集・削除)_カードセット詳細(編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「このカードセッ | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m14-09 | バグ候補（誤誘導メッセージ・未使用メッセージ定義の放置）／要実機確認 | 【実装乖離】カード管理_フォーマット一覧_フォーマット一覧にて、削除ボタン押下時の確認ポップアップが設計に記載された専用文言ではなく共通の汎用文言になっている | 機能ID+同一ファイル行近接(±25)+類似0.10 |
| m14-09 | 乖離（設計記載URLとの不一致・削除のみパス体系不統一）／要実機確認 | 【実装乖離】カード管理_フォーマット一覧_フォーマット一覧にて、削除ボタン押下時の確認ポップアップが設計に記載された専用文言ではなく共通の汎用文言になっている | 機能ID+同一ファイル行近接(±25)+類似0.07 |
| m14-09 | 乖離（現行踏襲違反・削除成功パスの喪失／連鎖削除欠落）／要実機確認 | 【実装乖離】カード管理_フォーマット一覧_フォーマット一覧にて、削除ボタン押下時の確認ポップアップが設計に記載された専用文言ではなく共通の汎用文言になっている | 機能ID+同一ファイル行近接(±25)+類似0.08 |
| m14-10 | 乖離（文言差）／要実機確認 | 【実装乖離】カード管理_フォーマット詳細(登録・編集・削除)_フォーマット詳細(登録・編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「{フォー | 機能ID+同一ファイル行近接(±25)+類似0.13 |
| m14-10 | 乖離（文言/キー差）／要実機確認 | 【実装乖離】カード管理_フォーマット詳細(登録・編集・削除)_フォーマット詳細(登録・編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「{フォー | 機能ID+同一ファイル行近接(±25)+類似0.11 |
| m14-10 | 乖離（遷移先の差・リファラ復帰なし）／要実機確認 | 【実装乖離】カード管理_フォーマット詳細(登録・編集・削除)_フォーマット詳細(登録・編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「{フォー | 機能ID+同一ファイル行近接(±25)+類似0.05 |
| m14-10 | 乖離（キー/文言の内部差・利用者可観測）／要実機確認 | 【実装乖離】カード管理_フォーマット詳細(登録・編集・削除)_フォーマット詳細(登録・編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「{フォー | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m14-10 | 乖離（削除前処理の欠落・削除不能化のおそれ）／要実機確認 | 【実装乖離】カード管理_フォーマット詳細(登録・編集・削除)_フォーマット詳細(登録・編集・削除)にて、削除ボタン押下時の確認ポップアップ文言が設計の「{フォー | 機能ID+同一ファイル行近接(±25)+類似0.09 |
| m15-01 | 乖離（入力最大長の上限超過・Excel設計値と実設定値の不一致）／要実機確認 | 【実装乖離】デッキ管理_デッキ一覧(検索入力/検索結果)_デッキ一覧の検索条件にて、デッキID・デッキ名・イベント名・成績・プレイヤー名の最大文字数が設計の50 | 機能ID+同一ファイル行近接(±25)+類似0.25 |
| m15-01 | 乖離（入力最大長の上限超過）／要実機確認 | 【実装乖離】デッキ管理_デッキ一覧(検索入力/検索結果)_デッキ一覧の検索条件にて、カード名の最大文字数が設計の100文字ではなく200文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.25 |
| m15-01 | 乖離（Excel指定マスタ MtbShop の不在・選択肢母集合の変質）／要実機確認 | 【実装乖離】デッキ管理_デッキ一覧(検索入力/検索結果)_デッキ一覧の検索条件にて、カード名の最大文字数が設計の100文字ではなく200文字になっている | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m15-01 | 乖離（1以上がサーバ側で強制されない・0が黙って無視）／要実機確認 | 【実装乖離】デッキ管理_デッキ一覧(検索入力/検索結果)_デッキ一覧の検索条件にて、デッキID・デッキ名・イベント名・成績・プレイヤー名の最大文字数が設計の50 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
| m15-01 | 乖離（入力書式の表記差・Excel設計値と実装の不一致）／要実機確認 | 【実装乖離】デッキ管理_デッキ一覧(検索入力/検索結果)_デッキ一覧の検索条件にて、デッキID・デッキ名・イベント名・成績・プレイヤー名の最大文字数が設計の50 | 機能ID+同一ファイル行近接(±25)+類似0.06 |
