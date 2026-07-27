# B1候補: f04-04 フロント カート — 決済〜購入完了 — 実行可能グレード候補（母集合76全量踏破）

> 2026-07-25 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> **改訂6（2026-07-26・D5確定前提化＋TBD解消）**: **D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱う**。
> よって(1) checkout系boundの隔離ハーネス留保（「未整備・現時点実走不可・@TBD(ハーネス)」）を外し、**D5で確定・配備される
> 前提で実行可能**と記述する（Mailer非送達=`null://null`／Messenger asyncを`in-memory://`へ上書き＋worker停止／UniSearch
> no-op／スマレジ・SPLINKSスタブはD5で配備される前提。**現状のee `services_e2e.yaml`/`services_test.yaml`にはUniSearch差替・
> Messenger in-memory上書きは未設定＝D5整備対象**〔grep実測0件・`messenger.yaml`の`when@test`in-memoryはコメントのみ〕。
> S0の実配線・fixture具体値もD5で確定・配備される前提）。ただし**真の外部送達の実応答（unisearch実送達等）は「要実機」のまま**
> （D5確定でも外部実連携は別）。(2) **TBD 4件（-002/-003/-069/-070）を解消**: 設計md自身が「移行先で要確認」とした呼び出し番号の
> 保持先・補助テーブルの有無/名称を、D5=移行先=ee実装確定の前提でee実テーブルにより裏取りし**bound（C-13）**へ移動。
> (a)呼び出し番号（TC注文番号）は店頭受取フローで**専用テーブル`dtb_waiting_number`**に生成・保持され表示される
> （`WaitingNumberProcessor.php:53-59`でorder_id紐付けsave・`complete()`がfindOneByで取得＝ShoppingController.php:655→complete.twig:98。
> `dtb_order.waiting_number`列もスキーマに実在するが本フローの生成/保存先は`dtb_waiting_number`＝旧「単一列」記述の自己矛盾を是正）。
> (b)補助テーブルのうち**本購入完了フローで実際に書かれる**のは売上分析タグ=`dtb_order_item_tag_sales_analysis`（checkout時INSERT＝
> OrderItemRepository.php:163-186）とSPLINKS決済記録=`plg_sln_order_payment_status`（OrderPaymentStatus.php:22）で、これらをbound根拠とする。
> **スマレジ連携テーブル`dtb_smaregi_transaction_job`は実在するがスマレジ取引webhook子ジョブ用メタで購入完了フローでは書かれない**
> （本フローのスマレジ連携=使用ポイントMessengerジョブ`SmaregiOrderUsePointMessage`の外部処理＝C-P2/要実機の外部枝）ため**本ケースのbound根拠に含めない（偽陽性除去）**。
> **母集合の期待テキストの原義は不変**（「要確認」を"D5で確定した値の検証"へ具体化しただけ）。**会計: TBD 4→0・bound読替 34→38**。
> **改訂5（2026-07-26・操作手順の方法論是正）**: 確認画面・完了画面は入力画面から遷移して初めて到達する。従来の
> 「SEED投入→GET /shopping/complete」直リクエストは**単体テスト**であり結合/e2eでない（complete()はsession受注ID:632を
> 読むため直GETはトップへ戻る）。→正常系・副作用observ・ガード系の操作手順（列7/9/11・§2/§4）を**購入フロー駆動**
> （cart:80→shopping:123→POST confirm:291,389で内部checkout=SESSION_ORDER_ID:565確立・完了へredirect:612→complete:625）へ是正。
> 直GET維持は「受注IDなし→トップ」「完了後再訪→トップ」の**直アクセス自体が試験のケース（-047(a)・-056 bound枝）のみ**。
> **期待値（列10）・オラクル・会計区分・母集合identity・65行11列は不変**（変えたのは前提/操作/実行方法の到達・操作方法だけ）。
> codexレビュー: **R1（Major6）→改訂1→R2（Major3）→改訂2→R3（Major3）→改訂3→R4（承認まであと2件・記述の詰め）→改訂4で是正**。
> R4では**Major③解消・会計76妥当・オラクル独立性維持が確定**。残2件は(R4-①)§6の`sync`遮断表記が§2と矛盾（再混入）
> →§6を§2と完全整合・「sync遮断」表記を全廃、(R4-②)S0のSPLINKS 3表DELETEを実行可能な単一形（アプリ側の存在照会→
> バインドDELETE。`DO`本文は`:oid`バインド不可のため不採用）に確定。会計・分類・他文言は不変。
> R3で**ドリフト8件の不在主張が偽陰性でない**とcodex独自検索で再確認・会計76差分0・オラクル独立性・complete()
> no-write再スコープも妥当と再確認。
> **改訂3の要点（R3 Major是正）**:
> (R3-①) **外部遮断の「実行可能」現在形断定を撤回**: ee `messenger.yaml:8`のasyncは実env DSN・`when@test`
>     in-memoryはコメントのみ、`services_e2e.yaml`/`services_test.yaml`は実在するがUniSearch差替は無い（grep0件）＝
>     隔離ハーネスの整備状況をee実測で明示（当時の観察）。**（改訂6で更新: D5確定によりハーネスは配備される前提とし、
>     「未整備・現時点実走不可・@TBD(ハーネス)」の留保表現は撤回。隔離の設計は§2に維持。真の外部実送達のみ要実機。）**
>     Mailer=`null://null`はee `mailer.yaml:2`既定で実在（起動時確認のみ）。
> (R3-②→R4-②) **S0のto_regclass散文並記を実行可能な単一形に確定**: 表不在時のパース失敗を避け、**アプリ側（db.ts）の
>     「存在照会（別クエリ）→存在時バインドDELETE（`$1`）」を唯一の実行形として確定**（`DO $$`本文は`:oid`を
>     バインドできず不採用）。表名は固定定数リストのみ＝インジェクション面なし。§2参照。
> (R3-③) **partial(C-P3/C-P4)のドリフト枝「成功観測」誤記を是正**: C-P3を3分割（メール=要実機枝／セッション初期化=
>     bound枝／購入処理エラー画面=**EEドリフト枝＝失敗期待**）、C-P4は異常/SPLINKS枝を**ドリフト枝**・受注IDなし→
>     トップ枝のみboundと明記。partialの1 test_id=1会計は不変。
> **改訂2の要点（R2 Major是正・維持）**:
> (R2-①) **checkout系boundの外部副作用遮断を具体化**: EE checkoutはcommit後にメール送信・スマレジMessenger
>     dispatch・unisearch HTTP送信を**同期**で呼ぶ。`sync`transportはハンドラ即時実行で遮断でなく、unisearch
>     「到達不能host」も安全なスタブでない。→§2に**具体的なテスト環境遮断設定**（Mailer=`null://null`固定・
>     `UniSearchService`を無効テストダブルに差替・Messenger=`in-memory://`かつworker停止・起動時外部host非到達
>     アサート）を記載。`sync`/到達不能host表記は削除。**checkout系T2機能で共有する土台**として明記。
> (R2-②) **S0復元SQLの実行可能化**: 旧`DELETE FROM plg_sln_order_payment_status/history/send …`はPostgreSQLとして
>     不正（`/history/send`はテーブル名でない）→**3テーブルを独立DELETE**（実テーブル名・`order_id`列をee実体で照合・
>     `to_regclass`存在チェック付き）に是正。
> (R2-③) **C-08/C-09/C-10の観測点是正＋EEドリフト明示**: 受注ステータス異常→購入処理エラー（`shopping_process`）・
>     SPLINKS記録なし→処理中戻し（`no_sln_payment_record`）・ロケール不一致→遷移は、**現EE（base+SlnPayment42
>     plugin）にgrep実測で該当実装が不在**（`shopping_process`/`no_sln_payment_record`/COMPLETE_INITIALIZE
>     subscriber いずれも0件。ロケールはSPLINKS 3D戻りのPaymentController.php:745-747のみ）。→これらを
>     「**設計オラクルに対するEEドリフト検出ケース（現EEでは失敗期待）**」として bound成功と会計上区別（§4.1d）。
>     否定側no-writeの-021等はcomplete()が読取専用（書込はcheckout側）という現EEで観測可能な事実へ再スコープしbound維持。
> **改訂1の要点（R1 Major是正・維持）**:
> (1) **Major①最重要=「破壊系＝要実機」の誤り是正**: 自社DBの副作用（受注作成`dtb_order`・在庫`dtb_product_class.stock`・
>     売上分析タグ`dtb_order_item_tag_sales_analysis`・受注ステータス変更・セッション）は**隔離テストDB＋seed＋S0復元＋
>     DBアサーションで観測可能＝bound**。破壊的であることは実機要件ではない。**真の要実機は外部送達/実応答のみ**
>     （unisearch外部タグ送信・外部メール実送達SMTP・スマレジ外部POS送信・SPLINKS決済代行の実応答）。R1で
>     偽陰性と指摘された受注DB/在庫DB/タグDB/SPLINKS状態/ロケール不一致を**bound/読替へ移動**し、外部送達を含む
>     複合行は**partial**へ分離した。**要実機は40→2へ大幅減**。
> (2) **Major②=bound読替の誤り是正（C-07/C-08）**: -034/-066（注文確定時のセッション保存）は「受注IDなし→トップ」
>     でなく**注文確定時のセッション保存を観測**するC-07へ、-047（異常時セッション初期化）は**異常ステータス経路**の
>     C-08へ是正。-056（失敗出力の選言）は**partial**として明示しbound会計から外した。
> (3) **Major③=T2オラクル汚染是正（C-03）**: 「店頭トップURL誘導・meta refresh」はee `complete.twig:16-18`の実装詳細で
>     設計mdに無い→期待値から除去し、設計md記載の**「店頭受取向け表示へ切替」に限定**（meta refreshは§9 BC-DRAFTへ）。
> (4) **Major④=C-EN-01のENオラクル汚染是正（T2違反）**: eeの`messages.en.yaml`値を英語**仕様**の根拠にしていた
>     誤りを是正。**設計md（オラクル）は表示メッセージを日本語のみ規定し英語表示メッセージを規定しない＝英語表示のL1オラクルは設計mdに存在しない（確定した不在＝留保でない。ee翻訳訳語は仕様根拠にできず裏取り補助に留める）**。翻訳キー実在の記録は
>     実装照合補助として残すが期待値の正としない。
> (5) **Major⑤=S0の実行可能設計具体化**: raw SQL復元の対象テーブル・FK削除/復元順序・復元SQL・外部副作用の遮断を
>     §2で特定（checkoutのカート削除/メール/タグ/スマレジMessengerジョブ/シーケンスをS0対象に含む）。
> (6) **Minor=バリデーション否定側の一貫化**: -011/-014/-015（入力フォームなしゆえバリデーション否定側も観測対象なし）を
>     **excludedへ寄せて肯定側と一貫**させた。
> **本機能のカスタマイズ区分=現行踏襲（T2＝excel-primary）**。オラクル（期待値の正）は設計書md
> `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md`＋観点表＋基本設計。**ee実ソースはL1出典にしない**
> （照合補助＝セレクタ源・踏襲確認・翻訳キー実在確認のみ）。SUT/オラクル不変・母集合期待は改変しない。
> source_class=excel-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。fixture_version は**D5確定前提**（D5でfixture具体値が確定・配備される前提の扱い＝本改訂でD5を確定前提化したことに整合。旧`@TBD-D5`残存を解消）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 出力隔離: 本md＝`_drafts/`。正式パス直下には書かない。先例=`_drafts/f06-19_front_member_mypage_credit_card_executable_draft.md`。
>
> **母集合76の会計（差分0・改訂6後）**: bound成功直接**10**＋bound成功読替**38**（§4.1・C-01/C-02/C-04〜C-08/C-11/C-12/C-13＝現EEで
> seed→観測可。改訂6でTBD 4件を裏取り解消しC-13〔D5移行先スキーマ確定〕へ+4）＋**bound(EEドリフト) 8**（§4.1d・C-08d/C-09/C-10＝設計md〔正本〕は規定するが現EEに該当実装が無く
> **現EEでは失敗期待**。R2 Major③是正）＋**partial 7**（§4.2・C-P1〜C-P4）＋**要実機 2**（§4.3・C-R1＝unisearch
> 外部タグ送信のみ）＋**TBD 0**（改訂6で解消・§4.5）＋**excluded 11**（§4.6）。**10+38+8+7+2+0+11=76・差分0**（§8で機械実証・
> python検算で重複0/欠番0/1..76全被覆）。

---

## §0 版固定・判定原則・外部依存の切り分け（改訂1で再定義）

- **設計書正本（オラクル）**: `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md`（本repo・309行。以下「md:行」）。
  md:9「カスタマイズ区分は現行踏襲とする。挙動の参照リポはpf-eccube3（現行）とし、DB関連（テーブル名・列名…）は
  ec-cube-enterprise を正とする。」→**挙動＝pf現行踏襲spec（設計md）がオラクル、DB永続化先名称のみee**。
- **観点表**: `integration_test/integration-test-viewpoints.md`。**中間成果物（活用）**:
  `integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md`（別母集合90版・シード要件・不具合候補）。
- **ee実ソース（照合補助＝L1出典にしない）**: `/home/y-saito/Developments/ec-cube-enterprise`（作業ツリー実測・
  版固定D5/D6）。セレクタ源・踏襲確認・翻訳キー実在・**DB副作用の観測対象テーブル特定**にのみ用いる。
  - Controller = `src/Eccube/Controller/Front/ShoppingController.php`
    - `checkout()`（POST `/shopping/checkout`）=**破壊系副作用の発生源**: カート削除(561-562)・受注IDセッションセット
      (565 `SESSION_ORDER_ID`)・注文メール送信(569 `mailService->sendOrderMail`)・売上分析タグ登録(570-596
      `orderItemRepository->insertTagSalesAnalyses`)・flush(598)・スマレジ使用ポイント連携(601-603
      `smaregiOrderUsePointEventService->dispatchUsePointMessage`＝Messengerジョブ)・購入完了タグログ送信(607
      `uniSearchService->sendCompleteTaglog`)・完了へredirect(611)。**受注作成・在庫更新はPurchaseFlowのcommitで確定**。
    - `complete()`（GET `/shopping/complete`）=625-700。受注ID取得(632)・無→homepage(634-638)・受注取得(640)・
      `FRONT_SHOPPING_COMPLETE_INITIALIZE`イベントdispatch(642-651・**イベント応答があれば返す**)・WaitingNumber取得
      (655)・`removeSession()`(671)・`isOtcGroup`判定(676-690)・描画。
  - Template = `Shopping/complete.twig`（見出し=66・御礼=95・注文番号=98-100・店頭受取meta refresh=16-18・
    go_to_top=132-133・client側unisearch `_sendCheckLog`=28-58）
  - 副作用テーブル（ee照合・L1出典にしない）: `dtb_order`(`Order.php`・`order_no`=464)／`dtb_order_item`／
    `dtb_order_item_tag_sales_analysis`（売上分析タグ・`OrderItemRepository.php:163-186`のINSERT先）／
    `dtb_product_class.stock`・`dtb_product_stock.stock`／`dtb_customer.point`／`dtb_waiting_number`（呼び出し番号=
    TC注文番号・`DtbWaitingNumber.php`）／SPLINKS決済記録=`plg_sln_order_payment_status`・`plg_sln_order_payment_history`・
    `plg_sln_order_payment_send`（`app/DoctrineMigrations/Version20260525000001.php:32-35`）
  - 翻訳資源 = `messages.ja.yaml`／`messages.en.yaml`（§5で実引き）
- **母集合**: `integration_test/all_it_cases.tsv` の機能名「カート — 決済〜購入完了」全**76行**（-001〜-076。awk実測=76）。
- **判定原則**: 母集合の観点ラベル・前提列・操作手順列は**生成器ノイズ**。bindは各行の**「期待結果／レスポンス」
  実テキスト**で判定し、極性も期待テキストで確認する（§8に全76行併記）。
- **外部依存の切り分け（改訂1の中核・R1 Major①是正）**:
  - **要実機＝真の外部送達/実応答のみ**: ①unisearch購入完了タグログの外部送信（`sendCompleteTaglog`／client
    `_sendCheckLog`）、②注文完了/アラートメールの外部SMTP実送達、③スマレジ外部POS送信（Messengerジョブの実処理）、
    ④SPLINKS決済代行の実応答・契約。これらは**送達/応答そのもの**が観測対象で自社側で最終値を確定できない。
  - **bound＝自社DB/セッション/画面で観測可能**: 受注作成（`dtb_order`）・在庫更新（`dtb_product_class.stock`）・
    売上分析タグ登録（`dtb_order_item_tag_sales_analysis`・**テーブル特定済み**）・受注ステータス変更（処理中戻し）・
    セッション（受注ID保存/初期化）・購入処理エラー画面/決済記録不整合エラー画面の表示・ロケール不一致遷移。
    これらは**破壊的だが**、隔離テストDB＋seed＋S0復元＋DB/UIアサーションで観測でき**要実機でない**。
    **SPLINKS「決済記録なし」等の状態はローカルseed（`plg_sln_order_payment_status`行の有無）で表現できる**
    （＝外部実応答でなくローカルDB状態）。
  - **partial＝1行の期待テキストが自社DB観測部分と外部送達部分を混在**（例: 「購入完了画面・注文完了メール送信・
    在庫更新・…」）。bound枝と要実機枝を明記し会計を分ける（§4.2）。
  - 決済手段の内部仕様・スマレジ/タグログの内部仕様・メール本文/件名（md:31-33「扱わないこと」）は**スコープ外**
    （該当母集合行=件名/本文系はexcluded）。

---

## §1 L1原子オラクル表（**出典=設計書md／観点表。ee実ソースはL1出典にしない**）

全20 claim。LS=locale_sensitive（**LS=1は4件**: L1-002/003/004/020）。「外部依存」列は**改訂1で再定義**＝当該claimの
利用者観測可能な最終値が**真の外部送達/実応答**を要するかを示す（自社DBで観測できる破壊系は「否＝隔離DBで観測可」）。

| oracle_id | 観点 | claim（現行踏襲spec＝設計mdが正） | 根拠(md:line) | 外部依存(改訂1) |
|---|---|---|---|---|
| L1-F0404-001 | route/entry | 注文確定=`POST /shopping`→受注データ作成・受注IDセッション保存・ポイント使用・購入完了へ遷移。購入完了=`GET /{_locale}/shopping/complete`（注文確定からのリダイレクトで到達）。セッションに受注IDが無い場合はトップへ戻す | md:67-70,247-248 | 否 |
| L1-F0404-002 | display_field | 購入完了画面の見出しは「ご注文完了」 | md:78,131 | LS=1／否 |
| L1-F0404-003 | display_field | 御礼メッセージは「ご注文ありがとうございました。」 | md:78,132 | LS=1／否 |
| L1-F0404-004 | display_field | 注文番号は、店頭受取（呼び出し番号あり）は**TC注文番号**、それ以外は**ご注文番号（8桁）** | md:83,133,153 | LS=1／否 |
| L1-F0404-005 | display_field | 購入完了画面に合計・送料・購入商品の情報を表示 | md:78 | 否（seed受注で観測） |
| L1-F0404-006 | display_layout | 店頭受取の場合は完了表示を店頭向けに切り替える | md:80 | 否 |
| L1-F0404-007 | tag_log | 購入完了時に購入完了タグログを外部（unisearch）へ送信する | md:79,109,184 | **要（外部送信）** |
| L1-F0404-008 | order_flow | 注文確定: 1.受注データ作成 2.受注IDセッション保存 3.ポイント使用 4.購入完了へリダイレクト | md:90-94 | 否（自社DB/セッション/redirectで観測可・破壊系はS0復元） |
| L1-F0404-009 | complete_flow | 購入完了判定順序: #1受注IDあるか(無→トップ)→#2受注ステータスが注文受領/入金待ちか→#3 SPLINKS決済で対応記録があるか→#4通過→完了処理・画面表示 | md:96-110,116-121 | 否（各分岐はローカルseedで到達可） |
| L1-F0404-010 | status_guard | #2で受注ステータスが注文受領・入金待ちのいずれでもない→アラートメール送信・セッションの受注情報初期化・購入処理エラー画面（`front.error.shopping_process`）表示 | md:99,119,139,268 | 否（画面・セッションは観測可）／**要（アラートメール外部SMTP実送達のみ）** |
| L1-F0404-011 | payment_guard | #3で SPLINKS決済だが対応する決済記録が無い→受注ステータスを処理中へ戻す・決済記録不整合エラー画面（`front.error.no_sln_payment_record`）表示・購入完了を確定しない | md:100,120,140,269 | 否（`plg_sln_order_payment_status`行の有無=ローカルseedで表現・画面/ステータスは観測可） |
| L1-F0404-012 | locale | 表示ロケール不一致→ロケールを合わせたURLへ遷移。表示ロケールは完了処理中の調整に用い処理後に除去 | md:101,165,251,297 | 否（request/session状態・遷移URLは観測可） |
| L1-F0404-013 | db_effect_stock | 購入完了時に在庫数（`dtb_product_class.stock`）を更新する | md:107,174,213 | 否（在庫差分をDBアサーションで観測・S0復元） |
| L1-F0404-014 | db_effect_tag | 受注明細ごとに商品の売上分析タグを受注明細へ登録する | md:103,154,214 | 否（`dtb_order_item_tag_sales_analysis`＝ee照合で特定済み・DBアサーションで観測） |
| L1-F0404-015 | db_effect_order | 注文確定で受注（`dtb_order`）を作成し管理画面の受注に現れる。当機能の登録・更新は persist/flush で直接保存し**不要な削除を含まない** | md:173,218,222 | 否（受注行/order_noをDBアサーションで観測・S0復元） |
| L1-F0404-016 | session | 受注IDは注文確定時にセッションへ保存し購入完了処理で参照。完了・異常時に初期化。完了画面再訪時は受注IDが無くトップへ戻る（二重通知の回避） | md:110,152,162,259,296 | 否（自社セッション） |
| L1-F0404-017 | db_column | `dtb_order.order_no`＝受注番号（注文番号）で8桁表示。呼び出し番号（TC注文番号）は店頭受取の注文に付く（移行先での保持先は要確認） | md:45-46,58-59,211-212 | 否／**移行先の保持先はD5確定＝店頭受取フローでは専用テーブル`dtb_waiting_number`に生成・保持（WaitingNumberProcessor.php:53-59・改訂7でbound化・C-13）。`dtb_order.waiting_number`列も実在するが本フローの生成/保存先は`dtb_waiting_number`** |
| L1-F0404-018 | no_input | 購入完了画面は利用者入力フォームを持たない＝バリデーション観点（必須/相関/文字列長/文字種/件名/本文）は本機能に該当しない | md:156,228 | 否 |
| L1-F0404-019 | auth | 会員・非会員いずれもセッションに保持した自分の受注についてのみ購入完了処理を行う。受注IDなしはトップへ戻す | md:234-237 | 否 |
| L1-F0404-020 | msg_error | 完了画面のエラー文言はロケールメッセージを正とする（`front.error.shopping_process`／`front.error.no_sln_payment_record`） | md:139-142,271 | 否（ja画面文言は観測可）／要確認（当該キーがee base+pluginに不在＝§5・**-EN実文言確定不能**） |

---

## §2 SEED三段参照設計・破壊系S0（改訂1で実行可能設計に具体化・R1 Major⑤是正／改訂5で操作手順を購入フロー駆動へ是正）

三段参照: **期待の正=L1オラクルID（§1・設計md） → 前提状態=SEEDセットID → 観測=実値（db.ts/画面）**。

### 操作手順の標準形（改訂5・購入フロー駆動＝結合/e2eテスト）

**是正の根本（ユーザー指摘）**: 確認画面・完了画面は**入力画面から遷移して初めて到達できる**。`complete()`は
セッションの受注ID（`OrderHelper::SESSION_ORDER_ID`）を読むため（ee照合: ShoppingController.php:632）、フローを通さず
`GET /shopping/complete`を直リクエストしても**トップへ戻される**（:634-637→homepage:637）。「SEED投入→GET /complete」
という直リクエストは**単体テスト**であって結合/e2eテストではない。したがって正常系・副作用観測系の操作手順は
**購入フロー全体の駆動**に改める。

**ee実HTTPフロー（ShoppingController.php docblock:67-93 で照合）**: EEは**確認画面を既定では表示せず**、注文手続
（`index.twig`）からの送信は`shopping_confirm`のみで検証〜確定まで進み、同一リクエスト内で`checkout()`を呼ぶ
（`POST /shopping/checkout`への再HTTPは発生しない）。`confirm.twig`の`action`は`shopping_checkout`のままなので
確認画面を表示するカスタム/テストが`POST shopping_checkout`する経路は残る。

**標準形（正常系・副作用observ）**:
`SEED（checkout直前のカート内容＋配送先/支払方法など前提状態を投入）→ GET /cart（買い物かご・CartController.php:80）→
購入手続きへ → GET /shopping（ご注文方法指定・index.twig・ShoppingController.php:123）→
POST /shopping/confirm（検証・集計・verify成功で内部的に checkout() 実行＝受注作成・受注IDセッション保存
`SESSION_ORDER_ID`:565・完了へredirect:612。ShoppingController.php:291,389）→ GET /shopping/complete（:625）に到達 →
<当該ケースの観測>をアサート → afterEach で破壊系S0復元`。

**ガード試験（受注ステータス異常/SPLINKS記録なし/ロケール不一致）**: 上記フローで`POST /shopping/confirm`により
受注確定・`SESSION_ORDER_ID`を確立し、**完了への302を追従する前に**対象条件をDB改変（受注ステータスを想定外へUPDATE／
`plg_sln_order_payment_status`対応行を削除・不作成／ロケール不一致状態を設定）→`GET /shopping/complete`でガード発火を
アサート。session確立をフローで行う点が単体との違い。

**直アクセス維持の例外（直アクセス自体が試験シナリオのケースのみ）**: 「受注IDなしで`/complete`へ直アクセス→トップへ
戻る」「完了後の再訪→トップ」は、**直アクセス（session未確立）自体がガードの試験**なので直GETを維持する（単体でなく
当該ガードのe2e試験）。該当は**-047（C-12・(a)受注IDなし直アクセス枝）**と**-056（C-P4・bound枝＝受注IDなし→トップ）**。
-047の(b)再訪枝・-056のドリフト枝は購入フロー駆動で完了到達後に観測する。

**改訂5**: SEEDは「**完成済み受注＋SESSION_ORDER_ID をseed**」でなく「**checkout直前の前提状態（カート/配送/支払）を
seedし、購入フローの駆動で受注確定・session確立まで到達させる**」に是正（前提状態を投入し、受注確定はフローが行う）。
隔離ハーネスは**D5確定＝配備される前提**（§後述）。

| SEEDセットID | 目的 | 内容（要点・改訂5＝checkout直前前提） |
|---|---|---|
| SEED-F0404-ORDER | 通常決済（非SPLINKS）でcheckout可能なカート前提 | 購入手続き可能なカート＋配送先＋支払方法（通常決済）＋会員/非会員を用意。合計・送料・購入商品を既知値にし、**購入フロー駆動（cart→shopping→confirm→内部checkout）で受注確定・`SESSION_ORDER_ID`確立**（受注は`dtb_order`〔ステータス=注文受領/入金待ち・`order_no`8桁〕＋`dtb_order_item`・`dtb_shipping`としてフローが作成） |
| SEED-F0404-TC | 店頭受取（呼び出し番号=TC注文番号）前提 | 上記＋会員が店頭受取グループ（`isOtcGroup`＝ee照合ShoppingController.php:676）。フロー駆動で確定→`dtb_waiting_number`（`waiting_number`＝TC注文番号）が付与される前提 |
| SEED-F0404-STATUS-ABNORMAL | 受注ステータスが注文受領・入金待ち以外 | checkout可能カートを**フロー駆動で受注確定・`SESSION_ORDER_ID`確立後、完了への302追従前**に`dtb_order`のステータスを想定外へUPDATE（ローカル改変） |
| SEED-F0404-SLN-NORECORD | SPLINKS支払だが対応する決済記録なし | 支払方法=SPLINKSのcheckout可能カートをフロー駆動で確定後、`plg_sln_order_payment_status`に対応行が**無い**状態（ローカルseed＝外部代行応答でなく自社DB状態） |
| SEED-F0404-LOCALE | 表示ロケール不一致状態 | checkout可能カートをフロー駆動で確定後、完了処理中の表示ロケールとURLロケールが不一致になるrequest/session状態 |
| SEED-F0404-STOCK | 既知在庫の商品を含むcheckout可能カート | `dtb_product_class.stock`／`dtb_product_stock.stock`が既知の商品をフロー駆動で購入完了し在庫減を検証可能にする |

### 破壊系S0スナップショット・復元設計（対象・順序・SQL骨子を特定）

**S0対象テーブル（操作直前にraw psql=db.tsでスナップショット）**:
| 対象 | スナップショット項目 | 復元方法 |
|---|---|---|
| `dtb_order`（＋子: `dtb_order_item`・`dtb_order_item_tag_sales_analysis`・`dtb_shipping`・`dtb_mail_history`・`dtb_waiting_number`・`plg_sln_order_payment_*`） | 作成された受注ID（S0=行なし） | **FK順序で子→親をDELETE**（実行可能SQL・R2 Major②是正）。①`DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE order_id=:oid)` ②`DELETE FROM dtb_mail_history WHERE order_id=:oid` ③`DELETE FROM dtb_waiting_number WHERE order_id=:oid` ④SPLINKS 3表を**独立の条件付きブロックでDELETE**（ee実体照合済み・いずれも`order_id`列。`plg_sln_order_payment_status`は`order_id`がPK＝`OrderPaymentStatus.php:22,26`／`plg_sln_order_payment_history.order_id`＝`OrderPaymentHistory.php:22,55`／`plg_sln_order_payment_send.order_id`＝`OrderPaymentSend.php:22,31`）。**R3 Major②→R4 Major②是正: 実行形をアプリ側（db.ts）の「存在照会→存在時バインドDELETE」に一本化して確定**（`DO $$`ブロックは本文内で`:oid`をパラメータバインドできず実行可能SQLでないため**不採用**）。実行可能パターン: `for (const t of ['plg_sln_order_payment_status','plg_sln_order_payment_history','plg_sln_order_payment_send']) { const r = await sql(\`SELECT to_regclass('public.'||$1) AS reg\`, [t]); if (r[0].reg !== null) { await sql(\`DELETE FROM \${t} WHERE order_id = $1\`, [oid]); } }`（(a)`to_regclass`照会は別クエリ、(b)存在時のみ通常のバインドDELETE〔`$1`〕を発行＝実行可能SQL、(c)表名は固定定数リストのみで動的ユーザー入力でない＝インジェクション面なし）。方式は確定・実行可能、db.ts実配線は**D5確定＝配備される前提** ⑤`DELETE FROM dtb_order_item WHERE order_id=:oid` ⑥`DELETE FROM dtb_shipping WHERE order_id=:oid` ⑦`DELETE FROM dtb_order WHERE id=:oid`。※非SPLINKS注文ではSPLINKS 3表に行が無いため④は0件DELETE（表存在チェックで表未導入でもエラーにならない） |
| `dtb_product_class` / `dtb_product_stock` | 対象product_classの`stock`（S0値） | `UPDATE dtb_product_class SET stock=:s0 WHERE id=:pcid`／`UPDATE dtb_product_stock SET stock=:s0 WHERE product_class_id=:pcid` |
| `dtb_customer` | 対象会員の`point`（S0値） | `UPDATE dtb_customer SET point=:s0 WHERE id=:cid` |
| セッション | `SESSION_ORDER_ID`等 | complete()の`removeSession()`で消えるため各ケースで再セット（べき等） |
| カート | checkout()の`cartService->clear()`でカート削除（ee:561-562） | 破壊系ケース前にカートを再seed（使い捨て） |

- **raw SQLで復元**（ORM/Doctrineを経由しない＝`SaveEventSubscriber`等のイベントを再発火させず`update_date`等を
  確実に元値へ戻す。f06-19のS0設計・m05-13の教訓を踏襲）。**db.tsの実配線もD5確定＝配備される前提**（対象・順序・SQL骨子は
  本§で特定済み）。**冪等性担保**: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用（安全境界・維持）**:
  1. `dtb_order.order_no`生成に使うシーケンス/採番カウンタは前進し**復元しない**（f06-19のmem_id前進と同型・
     受注削除後も採番値は戻らないが業務影響なし）。
  2. SPLINKS決済代行側の状態は自社DB復元では戻らない（C-R1/partialの外部枝のみ該当。ローカル`plg_sln_order_payment_*`
     のseed/削除は自社DBで完結）。

### 外部副作用の隔離ハーネス設計（D5確定＝配備される前提・checkout系T2共有の土台。改訂6で確定前提化）

**背景（ee実測）**: EE `checkout()`はcommit後に**同期**で注文メール送信(569)・スマレジMessenger dispatch(601-603)・
unisearch HTTP送信(607 `sendCompleteTaglog`→`UniSearchService.php:705 curl_exec`)を呼ぶ。素の`sync`transportは
「遮断」でなくハンドラ即時実行であり、unisearchの「到達不能host」もcurlに接続/総時間制限が明示されず安全なスタブでない。
**したがってcheckout系bound（C-04〜C-07・partialのbound枝）は、下記の共有隔離ハーネスを前提とする。D5確定（改訂6）:
このハーネスはD5で確定・配備される前提とし、外部送達を遮断した上でbound観測可能＝実行可能とする**（下記の上書きファイル・DSN・
起動時アサートはD5で整備される前提。**現状のee設定には未反映**）。設計と配備先をee実測に基づき明示する:

| 外部副作用 | 隔離設計（何を・どこに） | ee配線（実測ベース） | 整備状態（D5前提・現状） |
|---|---|---|---|
| 注文完了/アラートメール（SMTP） | `MAILER_DSN`をnull transport（`null://null`）に固定 | `mailer.yaml:2`で既定`env(MAILER_DSN): 'null://null'`＝**実在（そのままなら非送達）** | **D5で確定（既定値が既に非送達＝起動時に`MAILER_DSN`が上書きされていないことを確認）。この枠のみ現状ee既定で成立** |
| スマレジ外部POS連携（Messenger） | E2E用`services_e2e.yaml`等でasync transportを`in-memory://`へ上書き**かつ worker（`messenger:consume`）非起動**（`sync`は使わない＝sync=ハンドラ即時実行で外部送信が走る） | `messenger.yaml:8` async=`%env(MESSENGER_TRANSPORT_DSN)%`（実env DSN）。`when@test`のin-memory設定は**コメントのみ（未有効）**＝E2E用上書きは**現状未設定** | **D5で配備される前提（現状`services_e2e.yaml`/`services_test.yaml`にMessenger in-memory上書きは未設定＝grep実測0件・D5整備対象）** |
| unisearch購入完了タグログ（HTTP curl） | E2E用services上書き（`services_e2e.yaml`）で`UniSearchService`をno-op/テストダブルへ差替（サービス自体を無効化） | `UniSearchService`はDI既定`services.yaml:222`。E2E servicesでのno-op差替は**現状未設定** | **D5で配備される前提（現状`services_e2e.yaml`/`services_test.yaml`にUniSearch差替は未設定＝grep実測0件・D5整備対象）。真の外部実送達の実応答が要る場合のみ要実機（C-R1）** |
| 起動時検査 | テスト起動時に外部hostへ出ない構成（MAILER_DSN=null系・Messenger=in-memory・UniSearch=テストダブル）をアサートし、未成立なら破壊系boundを実行しない | 起動時アサートは**現状未配備** | **D5で配備される前提（D5整備対象）** |

- **この隔離ハーネスはF04-04固有でなく全checkout/外部連携T2で共有する土台**（後続の全T2が参照する共有前提）。
  隔離の**設計は上表に具体化**し、**上書きファイル（`services_e2e.yaml`のMessenger/UniSearch上書き）・DSN・
  起動時アサートはD5で整備される前提（現状ee未設定）**（共有T2前提・特定test_id非依存・§4.4インフラ表）。
- 結論の言い方（統一）: checkout系boundは**「隔離ハーネス配備される前提でbound観測可能＝実行可能」**。アサーション自体は
  自社DB/セッション/画面で完結する設計（外部送達の成否はアサーションに含めない）。**真の外部送達の実応答（unisearch実送達等）
  のみD5確定後も「要実機」**（外部実連携はD5のスキーマ/ハーネス確定とは別）。

---

## §3 画面項目マトリクス（本機能は入力フォームなし）

購入完了画面は**利用者入力フォームを持たない**（md:156,228）。三値比較（設計md／eeフォーム／eeDB）の対象となる
入力項目は**存在しない**。これが母集合のバリデーション系テンプレ（必須/相関/文字列長/件名/本文＝IT-22/IT-28由来）が
本機能に対応実挙動を持たない根本理由で、§4.6の excluded 根拠（肯定側=エラー発生／否定側=エラー非発生継続、
いずれも観測対象を持たない）として扱う。表示（読取専用）はC-01/C-02/C-03で、DB副作用はC-04〜C-09で扱う。

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。**T2ルーティング**により期待値は設計md由来。ee参照は
「（ee照合: file:line）」＝**セレクタ源/観測対象特定/踏襲確認のみ**（L1出典にしない）。各行の外部依存の具体的観測対象
（何が外部で観測不能か）を明記する。

### §4.1 母集合対応・bound成功（現EEで隔離DB＋seed＋S0復元＋DB/UIアサーションで観測可能。C-01〜C-08/C-11/C-12/C-13＝11 C-ID・48母集合行。※C-08d/C-09/C-10は現EEに実装が無くbound(EEドリフト)＝§4.1dへ分離。C-13は改訂6でTBD 4件を裏取り解消した移行先スキーマ確定bound）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象 | 対応母集合 |
|---|---|---|---|---|---|
| C-01 | 完了画面の表示要素 | **購入フロー駆動**（SEED-F0404-ORDER前提→§2標準形＝cart:80→shopping:123→confirm:291,389→complete:625到達）→表示要素をアサート | 見出し「ご注文完了」・御礼「ご注文ありがとうございました。」・注文番号・合計・送料・購入商品を表示 `[L1:F0404-002,003,004,005]`（ee照合: complete.twig:66/95/98-100） | なし（完了到達後の読取＋描画は外部通信を伴わない） | -006,-073（直接）／-005,-009,-043,-044,-072,-075,-076（読替・注1） |
| C-02 | 注文番号種別 | **購入フロー駆動**（通常決済＝SEED-F0404-ORDER／店頭受取＝SEED-F0404-TC の各前提で§2標準形で完了到達） | 店頭受取（呼び出し番号あり）は**TC注文番号**、それ以外は**ご注文番号（8桁）** `[L1:F0404-004,017]`（ee照合: complete.twig:98 waitingNumber/:99-100 Order.orderNumber・DtbWaitingNumber実体） | なし | -048（直接）／-001,-058,-059,-068（読替・注2） |
| C-03 | 店頭受取レイアウト切替 | **購入フロー駆動**（SEED-F0404-TC＝店頭受取グループ会員の前提で§2標準形で完了到達） | 完了表示が店頭受取向けに切り替わる `[L1:F0404-006]`（**設計md:80「店頭向けに切り替える」に限定**。ee `complete.twig:16-18`のmeta refresh等の実装詳細は期待値化せず§9 BC-DRAFT⑤） | なし | -008,-074（直接） |
| C-04 | 受注作成のDB登録（dtb_order） | S0取得→**購入フロー駆動**（§2標準形。confirm内部checkoutが受注作成）→`dtb_order`をDBアサーション／管理画面受注一覧→afterEach復元 | 受注（`dtb_order`行・`order_no`8桁）が作成される `[L1:F0404-015]`（ee照合: PurchaseFlow commit・Order.php:464 order_no） | なし（受注行は自社DBで観測。checkoutの付随メール/タグログ送信は§2安全境界で遮断・非アサーション） | -020,-022,-024,-025,-027,-030,-041（読替・IT-26テンプレ→具体受注登録） |
| C-05 | 在庫更新（dtb_product_class.stock） | stock S0取得→**購入フロー駆動**（SEED-F0404-STOCK前提で§2標準形で購入完了）→`stock`差分をDBアサーション→復元 | 在庫数が購入数量分減少 `[L1:F0404-013]`（ee照合: dtb_product_class.stock/dtb_product_stock.stock） | なし | -060（直接）／-032,-035,-036,-038,-040（読替） |
| C-06 | 売上分析タグ受注明細登録 | S0取得→**購入フロー駆動**（§2標準形。confirm内部checkoutでタグ登録）→タグ登録をDBアサーション→復元 | 受注明細ごとに売上分析タグを受注明細へ登録 `[L1:F0404-014]`（**ee照合で表特定済**: `dtb_order_item_tag_sales_analysis`へINSERT＝`OrderItemRepository.php:163-186`・checkout呼出=ShoppingController.php:570-596） | なし（内部DB表を特定済み＝db.tsアサーション可） | -049,-061（直接）／-029（読替） |
| C-07 | 注文確定フロー（受注作成・受注IDセッション保存・ポイント使用・完了遷移） | S0取得→**購入フロー駆動**（§2標準形。cart:80→shopping:123→POST confirm:291,389で内部checkout実行）→完了へ遷移 | 受注データを作成し受注IDをセッションへ保存しポイントを使用して購入完了へ遷移 `[L1:F0404-008,015]`（ee照合: dtb_order作成・ShoppingController.php:565 SESSION_ORDER_ID・dtb_customer.point/dtb_order.use_point・:612 redirect） | なし（受注/セッション/ポイント/redirectは自社側で観測。付随メール/タグログは§2安全境界で遮断） | -004,-071（直接）／-034,-066（読替・注文確定時のセッション保存観測・注3） |
| C-08 | complete()は完了処理側のDB書込を行わない（読取専用・R2 Major③再スコープ） | **購入フロー駆動**でconfirm:291,389により受注確定・SESSION_ORDER_ID確立→**完了への302追従前に**完了処理側テーブル（tag等）をS0取得→`GET /complete`(:625)→操作前後で差分が無いことをDBアサーション | `GET /complete`は受注取得・イベントdispatch・removeSession・描画のみで、完了処理側の登録/更新（タグ等）を行わない＝当該経路で「登録/更新内容の対象レコードが追加/変更されない」 `[L1:F0404-016]`（ee照合: complete()=ShoppingController.php:625-700にpersist/flush不出現＝現EEで観測可能。※書込はcheckout側で発生済み） | なし | -021,-026,-028,-033,-037,-039（読替・注4） |
| C-11 | 直接保存・不要削除なし（構造事実） | ソース/設計確認（非UI・フロー駆動対象外） | 当機能の登録・更新は対象テーブル（dtb_order/dtb_product_class）を persist/flush で直接保存し**不要な削除を含まない** `[L1:F0404-015]` | なし（構造事実） | -062（読替） |
| C-12 | 受注IDなし→トップ・完了後セッション初期化→再訪トップ（二重通知回避） | **(a・直アクセスガード維持)** 完了状態なし（session未確立）で`GET /complete`直接アクセス／**(b・再訪)** 購入フロー駆動で完了到達（removeSession実行）後に再度`GET /complete` | 購入完了画面を表示せずトップページへ戻る。完了処理でセッションを初期化するため再訪時も受注IDが無くトップへ戻り再通知が発生しない `[L1:F0404-001,016]`（ee照合: ShoppingController.php:634-637空→homepage/:669 removeSession） | なし | -047（読替・異常時セッション初期化＝removeSessionは全complete()で実行され観測可・注4）／partial -056のbound枝としてcross-ref |
| C-13 | 移行先スキーマ確定（D5）＝呼び出し番号の保持先・補助テーブルの有無/名称をee実スキーマで確認（改訂6でTBD解消・改訂7でスマレジ偽陽性/単一列不整合是正・注5） | **(呼び出し番号)** 店頭受取前提で**購入フロー駆動**（§2標準形で完了到達）→注文番号欄のTC注文番号表示を画面で確認＋呼び出し番号が専用テーブル`dtb_waiting_number`に保持されることをDBで確認／**(補助テーブル)** 売上分析タグ対象商品/SPLINKS支払で購入フロー駆動→本フローで書かれる補助テーブルの実在と該当レコード登録/記録をDBで確認 | 呼び出し番号（TC注文番号）は店頭受取フローで**専用テーブル`dtb_waiting_number`に生成・保持**され店頭受取の完了画面にTC注文番号として表示される。本購入完了フローで書かれる補助テーブルは移行先（ee）に**実在し名称が確定**（売上分析タグ=`dtb_order_item_tag_sales_analysis`〔checkout時INSERT〕／SPLINKS決済記録=`plg_sln_order_payment_status`）し購入完了の副作用が該当テーブルへ登録/記録される `[L1:F0404-004,014,017]`（ee照合: 呼び出し番号保持＝WaitingNumberProcessor.php:53-59〔`dtb_waiting_number`・order_id紐付けsave〕→complete()取得=ShoppingController.php:655→complete.twig:98／タグINSERT＝OrderItemRepository.php:163-186／SPLINKS＝OrderPaymentStatus.php:22）。**※スマレジ連携テーブル`dtb_smaregi_transaction_job`は実在するがスマレジ取引webhook子ジョブ用メタで購入完了フローでは書かれない（`SmaregiTransactionProcessMessageHandler`のみが書込）＝本ケースのbound根拠に含めない（偽陽性除去）** | なし（D5でスキーマ確定・自社DBで観測。本フローのスマレジ連携＝使用ポイントMessengerジョブの外部処理はC-P2/要実機で別扱い） | -002,-069（呼び出し番号の保持先=`dtb_waiting_number`）／-003,-070（補助テーブル有無・名称） |

**注1（読替・C-01）**: -006/-073は逐語一致（直接）。-005/-072「セッションの受注を確認し完了処理を行い購入完了
画面を表示」は入口挙動（md:68）→完了画面表示へ読替。-009/-043/-044/-075/-076「購入完了画面の表示時であること」は
表示時条件（md:131-133条件列）のタウトロジー的確認→C-01へ読替。
**注2（読替・C-02）**: -001/-068「注文番号として表示」・-058「受注番号（注文番号）」は注文番号表示（L1-004/017）へ、
-059「店頭受取の注文に付く」は呼び出し番号=TC注文番号の付与（L1-017）へ読替。
**注3（読替・C-07）**: -034/-066「注文確定時に保存し、購入完了処理で参照」は**注文確定時のセッション受注ID保存**
（ee:565 SESSION_ORDER_ID）を観測しC-07へ写像（R1 Major②是正＝「受注IDなし→トップ」への誤読替を訂正）。
**注4（読替・C-08／C-12・R2 Major③再スコープ）**: -021/-026/-028（登録内容…追加されない）・-033/-037/-039
（更新内容…変更されない）は、入力フォーム非存在（L1-018）ゆえ入力起因分岐は無い。**現EEでは完了側の書込は
`checkout()`で発生済みで、`GET /complete`(625-700)はpersist/flushを持たない読取専用**（ee実測）。よって「当該
GET経路で登録/更新の対象レコードが追加/変更されない」は**現EEで観測可能なbound成功**としてC-08へ再スコープ
（受注ステータス異常ゲートというオラクル意図はEEドリフト〔§4.1d〕だが、no-writeという結果自体は現EEで観測可能）。
-047「異常時はセッション初期化し再通知を避ける」は`removeSession()`(671)が全complete()で実行される事実
（再訪→トップ）として観測でき**C-12（bound成功）**へ写像。
**注5（改訂6・TBD解消＝C-13／改訂7・スマレジ偽陽性&単一列不整合の是正）**: -002/-069「単一列としての保持有無は移行先で要確認」・
-003/-070「補助テーブルの有無・名称は移行先で要確認」は、母集合の期待テキスト自体が「移行先で要確認であること」という
**移行先スキーマ確認**が原義。**D5（スキーマ/移行先確定フェーズ）を確定済みとして扱う前提**で、ee実スキーマにより裏取りして
「要確認」を"確定した値の検証"へ具体化した（原義不変）:
(a)呼び出し番号（TC注文番号）は店頭受取フローで**専用テーブル`dtb_waiting_number`に生成・保持**される
＝`WaitingNumberProcessor.php:53-59`（`new DtbWaitingNumber()->setOrderId()->setWaitingNumber()`→`save()`）でorder_id紐付けsaveし、
`complete()`が`findOneBy(['orderId'=>...])`で取得（ShoppingController.php:655）→`complete.twig:98`で表示→**bound**（保持・表示が観測可能）。
**改訂7是正**: 旧記述の「単一列＝`dtb_order.waiting_number`/`dtb_waiting_number`」は2表2列の併記で「単一列」主張と自己矛盾していた。
`dtb_order.waiting_number`列（Order.php:644）もスキーマに実在するが**本店頭受取フローの生成/保存先は`dtb_waiting_number`**（WaitingNumberProcessorはdtb_orderのwaiting_number列に書かない）ため、実保存先に忠実に是正した。
(b)本購入完了フローで**実際に書かれる**補助テーブルは移行先に**実在し名称確定**＝`dtb_order_item_tag_sales_analysis`
（checkout時INSERT＝OrderItemRepository.php:163-186）・`plg_sln_order_payment_status`（OrderPaymentStatus.php:22）→**bound**（該当テーブルへ登録/記録）。
**改訂7是正**: 旧記述はスマレジ連携=`dtb_smaregi_transaction_job`をbound根拠に含めていたが、同表は**スマレジ取引webhookの子ジョブ用メタ**で
`SmaregiTransactionProcessMessageHandler::upsertTransactionJobRecord`のみが書込＝**購入完了フローでは登録されない偽陽性**。
本購入完了フローのスマレジ連携は使用ポイントMessengerジョブ（`SmaregiOrderUsePointMessage` async・ShoppingController.php:524/602 dispatch）の
外部処理であり`dtb_smaregi_transaction_job`書込ではない→**bound根拠から除去しC-P2/要実機の外部枝へ分離**。ee実装/テーブルが不在なら
bound(EEドリフト=失敗期待)へ回す方針だったが、(a)`dtb_waiting_number`・(b)タグ/SPLINKSの各表は本フローで実在＆書かれるため
-002/-069/-003/-070は全て**bound**（会計: TBD 4→0・bound読替 +4）。スマレジ偽陽性除去でboundの根拠から外しても各test_idの区分（bound）は不変。

### §4.1d 母集合対応・bound(EEドリフト＝設計md正本だが現EEに該当実装が無く現EEでは失敗期待。R2 Major③・8母集合行)

**ee実測（grep）**: 設計md（オラクル）がcomplete()ステップで規定する①受注ステータス想定外→購入処理エラー
（`front.error.shopping_process`）、②SPLINKS決済記録なし→処理中戻し・決済記録不整合（`front.error.no_sln_payment_record`）、
③（generic）ロケール不一致→ロケール合わせURL遷移 は、**現EE（base+SlnPayment42 plugin）に該当実装が見当たらない**
（`shopping_process`／`no_sln_payment_record` の翻訳キー・文字列は**grep実測0件**、`FRONT_SHOPPING_COMPLETE_INITIALIZE`
subscriberも**0件**）。ロケールはSPLINKS 3Dセキュア戻りの`PaymentController.php:745-747`（`_locale`保持→shopping_complete
へredirect）・`Credit.php:79-87`にのみ存在し、generic完了フローの不一致補正は見当たらない。**断定は避ける**（未探索の
間接経路の可能性は排除しない）が、**現EEでは失敗期待**として bound成功と会計上区別する。テストは**設計md（正本）
どおりに書き**、現EEに対してはドリフト検出（失敗が正当）として機能する。「seed→期待画面観測可（成功）」とは誤記しない。

| C-ID | 対象観点（設計md規定） | 前提/手順（設計md準拠） | 期待結果（設計md＝正本） | 現EEでの扱い（ee実測） | 対応母集合 |
|---|---|---|---|---|---|
| C-08d | 受注ステータス異常→購入処理エラー画面・アラートメール・セッション初期化 | **購入フロー駆動**（§2標準形でconfirm:291,389により受注確定・SESSION_ORDER_ID確立）→**302追従前に**受注ステータスを注文受領/入金待ち以外へUPDATE→`GET /complete`(:625) | 購入処理エラー画面（`front.error.shopping_process`の文言）を表示 `[L1:F0404-010]` | **失敗期待**: `shopping_process`キーがee全域にgrep 0件・complete()に受注ステータス判定なし＝現EEでは正常描画され本期待は不成立（EEドリフト） | -031,-063 |
| C-09 | SPLINKS決済記録なし→処理中戻し・決済記録不整合エラー画面 | **購入フロー駆動**（SPLINKS支払で§2標準形により受注確定・SESSION_ORDER_ID確立）→**302追従前に**`plg_sln_order_payment_status`対応行を削除/不作成→`GET /complete`(:625) | SPLINKS決済の決済記録の有無を確認し、記録が無ければ受注ステータスを処理中へ戻し決済記録不整合エラー画面（`front.error.no_sln_payment_record`の文言）を表示し購入完了を確定しない `[L1:F0404-011]` | **失敗期待**: `no_sln_payment_record`キー・COMPLETE_INITIALIZE subscriberがgrep 0件＝現EEに当該ゲートが見当たらず本期待は不成立（EEドリフト）。SPLINKS記録テーブル`plg_sln_order_payment_status`は実在（ローカルseed可）だが、それを完了時に照会し処理中へ戻す実装が現EEに見当たらない | -046,-054（直接）／-013,-018（読替） |
| C-10 | （generic）ロケール不一致→ロケール合わせURL遷移・完了処理中のロケール調整 | **購入フロー駆動**（§2標準形により受注確定・SESSION_ORDER_ID確立）→**302追従前に**表示ロケール/URLロケール不一致状態を設定→`GET /{_locale}/shopping/complete`(:625) | ロケールを合わせたURLへ遷移。表示ロケールは完了処理中の調整に用い処理後に除去 `[L1:F0404-012]` | **失敗期待（generic）**: EE complete()にロケール不一致補正が見当たらない（EEドリフト）。**部分referent**: SPLINKS 3Dセキュア戻りの`PaymentController.php:745-747`・`Credit.php:79-87`は`_locale`を保持しredirectするがSPLINKS決済戻り限定でありgeneric完了フローの不一致補正ではない | -019,-067 |

### §4.2 母集合対応・partial（1 test_id内に bound枝／要実機枝／ドリフト枝 を混在。全4 C-ID・7母集合行・R3 Major③是正）

母集合の1行が**現EEで観測可能な部分（bound枝）・外部送達依存部分（要実機枝）・現EEに実装が無い部分（ドリフト枝＝
失敗期待）を混在**するもの。会計は`partial`（1 test_id=1会計・区分は不変）とし、各枝のbound/要実機/ドリフトの内訳を
正しく表記する（R3 Major③是正: ドリフト枝を「観測可（成功）」と誤記しない）。

| C-ID | 前提/手順 | bound枝（現EEで観測可・成功） | 要実機枝（外部送達・観測不能） | ドリフト枝（現EEに実装なし・失敗期待） | 対応母集合 |
|---|---|---|---|---|---|
| C-P1 | 成功時出力の確認（§2標準形で購入フロー駆動→完了到達） | 購入完了画面表示・在庫更新（dtb_product_class.stock）・ポイント使用（dtb_customer.point）はseed+S0+DBアサーションで観測可（隔離ハーネス配備される前提） `[L1:F0404-005,013]` | **注文完了メールの外部SMTP実送達・購入完了タグログの外部送信（unisearch）** `[L1:F0404-007]` | なし | -023,-055 |
| C-P2 | 副作用の確認（§2標準形で購入フロー駆動→完了到達） | 受注作成（dtb_order）・在庫更新・ポイント使用・売上分析タグ登録（dtb_order_item_tag_sales_analysis）・セッション初期化はDBアサーションで観測可（隔離ハーネス配備される前提） `[L1:F0404-008,013,014,015,016]` | **スマレジ外部POS連携の実送信（Messengerジョブの実処理）** | なし | -057 |
| C-P3 | 受注ステータス異常時の出力（§2標準形で受注確定・session確立→302追従前に受注ステータス異常UPDATE→GET /complete） | **セッション初期化のみ**（`removeSession()`は全complete()で実行＝C-12と同観測）を現EEで観測可 `[L1:F0404-016]` | **アラートメールの外部SMTP実送達** `[L1:F0404-010]` | **購入処理エラー画面（`front.error.shopping_process`）表示＝§4.1d C-08d と同じEEドリフト**（`shopping_process`不在・現EEでは失敗期待。「観測可（成功）」と書かない） | -012,-045,-065 |
| C-P4 | 失敗時出力（選言） | **受注IDなし→トップ枝のみ**現EEで観測可（**直アクセス自体が試験＝受注IDなしで`GET /complete`直GET**・C-12） | なし | **ドリフト枝は§2標準形で受注確定・session確立→302追従前に受注ステータス異常UPDATE/SPLINKS記録削除→GET /complete。受注ステータス異常のエラー画面枝（C-08d）・決済記録不整合エラー画面枝（C-09）は現EEに実装なし＝失敗期待**（EEドリフト。「自社側で観測可」と書かない）。加えて**選言のため単一ケースで全枝を担保できず**bound会計に算入しない | -056 |

### §4.3 母集合対応・要実機（真の外部送達のみ。1 C-ID・2母集合行）

| C-ID | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象（観測不能な最終値） | 対応母集合 |
|---|---|---|---|---|
| C-R1 | 購入完了時に購入完了タグログ送信を確認（§2標準形で購入フロー駆動→完了到達後に外部送信を観測） | 購入完了画面で購入完了タグログを外部（unisearch）へ送信する `[L1:F0404-007]`（ee照合: checkout `sendCompleteTaglog`=ShoppingController.php:607／complete.twig client `_sendCheckLog`=28-58） | **unisearch外部ホストへのタグログ実送達**（送信先スタブ/到達確認が無いと最終送達を自社側で観測できない） | -007,-042（「購入完了画面で購入完了タグログを送信すること」） |

### §4.4 補完（母集合会計外・翻訳キー実在の記録／英語表示のL1オラクルは設計mdに不在＝ee en.yamlは裏取り補助）

| C-ID | 対象観点 | 前提/手順 | 期待結果 | 区分 |
|---|---|---|---|---|
| C-EN-01 | 完了画面文言のen観測 | `/en/shopping/complete`で完了画面表示 | **設計md（オラクル）は表示メッセージを日本語のみ規定し英語表示メッセージを規定しない＝英語表示のL1オラクルは設計mdに存在しない（確定した不在・留保でない・R1 Major④）**。ee`messages.en.yaml`値は裏取り補助として§5に記録するのみで期待値の正としない。設計mdに英語規定が現れればその規定をオラクルにbound化する | 補完・会計外・非L1（実装照合補助） |

### §4.5 母集合対応・TBD（改訂6でD5確定前提により全件解消＝0母集合行）

**改訂6でTBD 4件（-002/-003/-069/-070）を解消**。従来は設計md:46「呼び出し番号…単一列としての保持有無は移行先で要確認」・
md:48「補助テーブルの有無・名称は移行先で要確認」を「移行先スキーマ未確定＝非アサーション」としてTBD留保していた。
**D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱う前提**で、ee実スキーマにより裏取りして解消し
**§4.1 C-13（bound）へ移動**した（会計: TBD 4→0・bound読替 34→38）。母集合の期待テキストの原義（「移行先スキーマの確認」）
は不変で、「要確認」を"D5で確定した値の検証"へ具体化しただけである。

| test_id | 旧期待テキスト要旨 | D5確定前提での裏取り（ee実スキーマ） | 解消先/区分 |
|---|---|---|---|
| -002,-069 | 単一列としての保持有無は移行先で要確認（呼び出し番号=TC注文番号） | 呼び出し番号（TC注文番号）は店頭受取フローで**専用テーブル`dtb_waiting_number`に生成・保持**＝`WaitingNumberProcessor.php:53-59`（order_id紐付けsave）→`complete()`取得（ShoppingController.php:655）→表示（complete.twig:98）。`dtb_order.waiting_number`列も実在するが本フローの保存先は`dtb_waiting_number`（旧「単一列＝2表併記」の自己矛盾を是正） | **C-13・bound**（実保存先=`dtb_waiting_number`が実在＝ドリフトでなくbound） |
| -003,-070 | 補助テーブルの有無・名称は移行先で要確認（売上分析タグ・SPLINKS決済記録・スマレジ連携） | 本購入完了フローで**書かれる**補助テーブルは移行先に**実在し名称確定**＝`dtb_order_item_tag_sales_analysis`（checkout時INSERT＝OrderItemRepository.php:163-186）・`plg_sln_order_payment_status`（OrderPaymentStatus.php:22）。**スマレジ連携`dtb_smaregi_transaction_job`は実在するがwebhook子ジョブ用メタで購入完了フローでは書かれない偽陽性＝bound根拠から除去（C-P2/要実機の外部枝へ分離）** | **C-13・bound**（本フローで書かれる2表が実在＝ドリフトでなくbound。スマレジは根拠外だが区分不変） |

### §4.6 母集合対応・excluded（11母集合行・per-ID実引き・過剰除外禁止）

| test_id | 期待テキスト要旨（前提列） | 除外理由（一次資料実引き） |
|---|---|---|
| -010 | 必須バリでエラー表示・完了しない（前提=御礼） | 購入完了画面は入力フォームを持たない（md:156,228）＝必須バリデーション自体が起こらず**肯定側実挙動が存在しない**。表示はC-01でbound |
| -011 | 必須バリでエラー表示されず継続（前提=注文番号） | **R1 Minor是正**: 入力が無い以上バリデーション否定側（エラー非発生の「継続」）も観測対象を持たない→肯定側(-010)と一貫してexcluded。注文番号表示はC-02でbound |
| -014 | 相関バリでエラー表示されず継続（前提=二重通知回避） | 同上（否定側・観測対象なし）。二重通知回避はC-12でbound |
| -015 | 相関バリでエラー表示されず継続（前提=注文番号表示） | 同上（否定側・観測対象なし）。注文番号表示はC-02でbound |
| -016 | 相関バリでエラー表示・完了しない（前提=売上分析タグ） | 売上分析タグ登録は完了を阻止するゲートでない（md:103,154は副作用であり検証でない）＝「エラー・完了しない」の完了阻止referentが無い。完了阻止の実ゲートはC-08/C-09 |
| -017 | DB相関でエラー表示されず継続（前提=受注ステータス想定外） | 前提（想定外）と期待（エラー表示されず継続）が矛盾（想定外はエラー画面＝md:99,119）。整合referentなし |
| -050 | 件名でエラー表示・完了しない（前提=受注ステータス想定外） | 「件名」＝注文完了メールの件名でメールテンプレート管理機能へ委譲（md:33）＝**別機能**。完了画面に件名入力なし |
| -051 | 件名でエラー表示されず継続（前提=SPLINKS記録なし） | 同上（件名＝別機能） |
| -052 | 本文でエラー表示・完了しない（前提=在庫） | 「本文」＝注文完了メール本文で別機能へ委譲（md:33） |
| -053 | 本文でエラー表示されず継続（前提=メール） | 同上（本文＝別機能） |
| -064 | 画面表示データでエラー表示されず継続（前提=SPLINKS記録なし） | 前提（記録なし）と期待（エラー表示されず継続）が矛盾（記録なしはエラー画面＝md:100,120）。整合referentなし |

**過剰除外でないことの傍証**: excluded 11件はいずれも(a)入力フォーム非存在でバリデーション肯定/否定側の観測対象が
無い（-010,-011,-014,-015）／(b)完了阻止ゲートでない観点で「完了しない」referentなし（-016）／(c)前提と期待が矛盾
（-017,-064）／(d)件名・本文＝別機能委譲（-050〜-053）を実引きで示す。各前提が指す実在挙動（異常ステータス・
SPLINKS記録なし・在庫・売上分析タグ・注文番号・二重通知回避）は他候補（C-01/C-02/C-05/C-06/C-08/C-09/C-12）で
bound化済み＝偽陰性なし。

---

## §5 locale対応表・翻訳キー実在確認（実装照合補助・英語仕様の正としない）

**LS=1は4件**（L1-002/003/004/020）。ee翻訳資源（**照合補助＝L1/英語仕様出典にしない**）での実在確認:

| L1 | ja翻訳キー / 実在行 | ja値（ee） | en翻訳キー / 実在行 | en値（ee） | 備考 |
|---|---|---|---|---|---|
| L1-002 見出し | `front.shopping.complete_title`／ja.yaml:1540 | 注文完了 | 同キー／en.yaml:1347 | Complete Order | **§9 BC-DRAFT③**: 設計md（オラクル）は「ご注文完了」・ee ja値は「注文完了」で差異。期待は設計md値 |
| L1-003 御礼 | `front.shopping.complete_message__title`／ja.yaml:1541 | ご注文ありがとうございました | 同キー／en.yaml:1348 | Thank you for your order! | **§9 BC-DRAFT④**: 設計md「…ました。」（句点付）・ee ja値は句点なしで差異 |
| L1-004 注文番号 | `front.shopping.order_no`／ja.yaml:1355・`…complete_message__waiting_number`／ja.yaml:1574 | ご注文番号／TC注文番号 | 同キー／en.yaml:1152・en.yaml:1304 | Order No.／TC Order Number | キー実在（ja/en）。**ただし設計mdは英語表示メッセージを規定しない＝英語表示のL1オラクルは設計mdに不在（en値は裏取り補助・C-EN-01）** |
| L1-020 エラー文言 | `front.error.shopping_process`／`front.error.no_sln_payment_record` | **ee base+pluginに不在**（grep実測ゼロ） | 同キー | **不在** | **§9 BC-DRAFT②**: pf現行（HareruyaEc）キー。ee未移行＝-EN実文言確定不能＝要確認 |

- **R1 Major④是正**: 翻訳キー実在の記録は実装照合補助として残すが、**eeの英語訳値を英語「仕様」の根拠にしない**
  （設計mdの表示メッセージは日本語のみ＝英語表示のL1オラクルは設計mdに不在・C-EN-01・会計外。設計mdに英語規定が現れればbound化する）。
- 完了画面表示文言はEC-CUBE本体キー使用でja/en資源が実在（セレクタ源として有用）。エラー文言キーはeeに不在
  （-EN確定不能・§9 BC-DRAFT②）。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page/spec: 本機能の実行可能specは**未実装・実走なし＝D6実装対象**（**D5とD6の分界: D5は環境/前提〔スキーマ・移行先・隔離ハーネス・S0接続配線・fixture具体値〕を配備される前提として確定し、D6はその上のspecコード/db.ts便宜関数の実装・実走を担う。「実走なし」はD6実装前という実装フェーズの意味でありD5配備前提〔環境/前提〕とは別軸で分離する＝実行可能性の留保でない**）。中間成果物
  `integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md`（別母集合90版）が、完了状態なし直接
  アクセス（トップ誘導）を`live`、完了画面/エラー画面を`test.fixme`（要シード）、在庫/受注作成/タグログを
  `手動/間接`として独立に切り分けており、本書の bound（seed+S0+DBアサーション）／partial／要実機分類と整合する。
- request契約: 完了画面のエンドポイントは`GET /{_locale}/shopping/complete`（入力フォームなし=L1-018）だが、
  **結合/e2eでは直GETせず購入フロー駆動で到達する（§2標準形。cart:80→shopping:123→POST confirm:291,389が内部で
  checkout実行しSESSION_ORDER_ID:565を確立・完了へredirect:612→complete:625）**。直GET維持は「受注IDなし→トップ」
  「完了後再訪→トップ」の直アクセスガード試験（-047(a)・-056 bound枝）のみ。注文確定は
  `POST /shopping/confirm`（内部checkout）または確認画面カスタム経路の`POST /shopping/checkout:411`。**破壊系boundケースの実行は、checkout()の付随外部送信（メール/タグログ/スマレジ
  Messenger）を§2の共有隔離ハーネス（Mailer=`null://null`／Messenger asyncを`in-memory://`へE2E上書き＋
  worker非起動〔`sync`は使わない＝sync=ハンドラ即時実行で外部送信が走る〕／UniSearch no-op上書き／起動時外部
  非到達アサート。**D5確定＝配備される前提**）で遮断した上で行う。**隔離ハーネス配備される前提で実行可能**（真の外部実送達
  のみ要実機）**（§2）。期待値は`o("L1-F0404-xxx")`（L1解決器）経由・リテラル直書き禁止。
- db.ts（`e2e/helpers/db.ts`）: `dtb_order`／`dtb_order_item`／`dtb_order_item_tag_sales_analysis`／
  `dtb_product_class.stock`・`dtb_product_stock.stock`／`dtb_customer.point`／`dtb_waiting_number`／
  `plg_sln_order_payment_status`のS0取得・アサーション・raw SQL復元の専用便宜関数は実装waveで追加（S0の対象・順序・
  SQL骨子は§2で特定済み・**実配線はD5確定＝配備される前提**）。
- 破壊系afterEach（C-04〜C-09・C-P1〜C-P3）: §2のS0対象・FK順序・復元SQLに従いraw SQLで復元。外部送達は
  §2安全境界で遮断（**D5確定＝配備される前提**）。
- **オラクル独立性（T2規律）**: 期待値はすべて設計md（§1 L1）由来。eeのフォーム定義・実装値・翻訳訳語・実装詳細
  （meta refresh等）はセレクタ源／観測対象特定にのみ用い、期待値の根拠にしない。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。
(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01,C-02,C-03,C-12 | Playwright（購入フロー駆動。直GETは受注IDなし/再訪の直アクセスガード枝＝C-12(a)・-056 bound枝のみ） | GUI | 表示要素・注文番号種別・店頭受取切替・トップ誘導。完了画面到達はcart→shopping→confirm→completeを駆動 |
| C-04,C-05,C-06,C-07 | Playwright/request+db.ts（破壊系・afterEach必須・外部送信は§2遮断） | GUI/HTTP+DB | 受注作成・在庫更新・タグ登録・注文確定フロー。自社DBアサーション |
| C-08 | Playwright+db.ts（complete()読取専用のno-write観測） | GUI+DB | bound成功。GET /completeが完了側書込を行わない事実 |
| C-08d,C-09,C-10 | **bound(EEドリフト)＝現EEでは失敗期待** | GUI+DB | 設計md正本でテストを書くが現EEに実装なし（§4.1d）。ドリフト検出。bound成功と別勘定 |
| C-11 | 非UI（ソース/設計確認） | 設計/コード読取 | 不要削除なしの構造事実（md:222） |
| C-13 | Playwright+db.ts（購入フロー駆動＋DBスキーマ/レコード確認） | GUI+DB | 改訂6でTBD解消・改訂7でスマレジ偽陽性/単一列不整合是正。呼び出し番号の保持先=`dtb_waiting_number`・本フローで書かれる補助テーブル（タグ/SPLINKS）有無/名称のD5確定bound（§4.1・注5） |
| C-P1,C-P2,C-P3 | bound枝=Playwright+db.ts（隔離ハーネス配備される前提）／要実機枝=外部送達確認／C-P3のドリフト枝=失敗期待 | GUI+DB+外部 | メール/タグログ/スマレジの外部送達枝は要実機。C-P3の購入処理エラー画面枝はEEドリフト（§4.1d） |
| C-P4 | Playwright（受注IDなし→トップ枝のみbound・異常/SPLINKS枝はドリフト・選言のため単一ケース非担保） | GUI | 失敗出力の選言。ドリフト枝は失敗期待 |
| C-R1 | 要実機（unisearch送信先/スタブ） | 外部HTTP | 購入完了タグログの外部送達 |
| C-EN-01 | Playwright（en画面観測・翻訳キー照合補助） | GUI | 会計外・補完（英語L1オラクルは設計mdに不在） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（76 test_id 全数会計・差分0・改訂6後）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功（直接一致）** | **10** | 期待テキストが具体挙動の逐語/明確な言い換えで、**現EEで**seed→自社DB/画面/セッション観測可能（破壊系はS0復元・外部副作用は§2遮断） |
| **bound成功（読み替え）** | **38** | グロッサリ/タウトロジー/否定側テンプレ/IT-26テンプレを具体挙動へ写像。現EEで観測可能。**改訂6でTBD 4件（-002/-003/-069/-070）を裏取り解消しC-13へ+4** |
| **bound(EEドリフト)** | **8** | 設計md（正本）が規定するが現EEに該当実装が見当たらず**現EEでは失敗期待**（C-08d/C-09/C-10・§4.1d）。テストは設計md通りに書きドリフト検出として機能。「seed→期待観測可（成功）」と誤記しない |
| **partial** | **7** | 1行の期待テキストが自社DB観測部分（bound枝）と外部送達部分（要実機枝）を混在。別勘定 |
| **要実機** | **2** | 真の外部送達（unisearch外部タグ送信）のみ。自社側で最終送達を確定できない |
| **TBD** | **0** | **改訂6で全件解消**（旧4件=-002/-003/-069/-070はD5確定前提でee実スキーマ裏取りしC-13 boundへ移動） |
| **excluded** | **11** | 入力フォーム非存在でバリデーション観測対象なし／別機能委譲／前提と期待が矛盾（per-ID実引き・§4.6） |
| 合計 | **76** | 欠落0・理由なし重複0 |

10+38+8+7+2+0+11=76（差分0）。

### 76対応表（期待テキスト→会計→候補ケース）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | 注文番号として表示すること | bound(読替) | C-02 |
| 002 | 単一列としての保持有無は移行先で要確認（→D5確定でee実スキーマ裏取り・呼び出し番号の保持先=専用テーブル`dtb_waiting_number`） | bound(読替) | C-13 |
| 003 | 補助テーブルの有無・名称は移行先で要確認（→D5確定でee実スキーマ裏取り・本フローで書かれるタグ/SPLINKS表実在。スマレジ表は本フロー非書込のため根拠外） | bound(読替) | C-13 |
| 004 | 受注作成・受注IDセッション保存・ポイント使用・購入完了へ遷移 | bound | C-07 |
| 005 | セッションの受注を確認し完了処理を行い購入完了画面表示 | bound(読替) | C-01 |
| 006 | 見出し「ご注文完了」・御礼・注文番号・合計・送料・購入商品 | bound | C-01 |
| 007 | 購入完了画面で購入完了タグログを送信 | 要実機 | C-R1 |
| 008 | 店頭受取は完了表示を店頭向けに切り替える | bound | C-03 |
| 009 | 購入完了画面の表示時であること | bound(読替) | C-01 |
| 010 | 必須バリでエラー表示・完了しない（前提=御礼） | excluded | — |
| 011 | 必須バリでエラー表示されず継続（前提=注文番号） | excluded | — |
| 012 | アラートメール送信・セッション初期化 | partial | C-P3 |
| 013 | 相関バリでエラー表示・完了しない（前提=決済記録不整合） | bound(EEドリフト) | C-09 |
| 014 | 相関バリでエラー表示されず継続（前提=二重通知回避） | excluded | — |
| 015 | 相関バリでエラー表示されず継続（前提=注文番号表示） | excluded | — |
| 016 | 相関バリでエラー表示・完了しない（前提=売上分析タグ） | excluded | — |
| 017 | DB相関でエラー表示されず継続（前提=受注ステータス想定外） | excluded | — |
| 018 | DB相関でエラー表示・完了しない（前提=SPLINKS決済記録なし） | bound(EEドリフト) | C-09 |
| 019 | ロケールを合わせたURLへ遷移 | bound(EEドリフト) | C-10 |
| 020 | 登録内容の対象レコードが追加される（前提=在庫） | bound(読替) | C-04 |
| 021 | 登録内容の対象レコードが追加されない（前提=メール） | bound(読替) | C-08 |
| 022 | 登録内容の対象レコードが追加される（前提=API） | bound(読替) | C-04 |
| 023 | 購入完了画面・注文完了メール送信・在庫更新・ポイント/タグログ連携 | partial | C-P1 |
| 024 | 登録内容の対象レコードが追加される（前提=失敗時出力） | bound(読替) | C-04 |
| 025 | 登録内容の対象レコードが追加される（前提=副作用/最大長） | bound(読替) | C-04 |
| 026 | 登録内容の対象レコードが追加されない（前提=dtb_order/最大長+1） | bound(読替) | C-08 |
| 027 | 登録内容の対象レコードが追加される（前提=dtb_order/最小長） | bound(読替) | C-04 |
| 028 | 登録内容の対象レコードが追加されない（前提=dtb_product_class/最小長-1） | bound(読替) | C-08 |
| 029 | 登録内容の対象レコードが追加される（前提=受注明細・売上分析タグ） | bound(読替) | C-06 |
| 030 | 実行結果の対象レコードが追加される（前提=登録/更新） | bound(読替) | C-04 |
| 031 | 共通エラー画面（購入処理エラー） | bound(EEドリフト) | C-08d |
| 032 | 更新内容の対象レコードの値が変更される（前提=SPLINKS決済記録なし） | bound(読替) | C-05 |
| 033 | 更新内容の対象レコードの値が変更されない（前提=受注ステータス異常） | bound(読替) | C-08 |
| 034 | 注文確定時に保存し購入完了処理で参照（受注ID） | bound(読替) | C-07 |
| 035 | 更新内容の対象レコードの値が変更される（前提=表示ロケール） | bound(読替) | C-05 |
| 036 | 更新内容の対象レコードの値が変更される（前提=受注番号/最大長） | bound(読替) | C-05 |
| 037 | 更新内容の対象レコードの値が変更されない（前提=呼び出し番号/最大長+1） | bound(読替) | C-08 |
| 038 | 更新内容の対象レコードの値が変更される（前提=最小長） | bound(読替) | C-05 |
| 039 | 更新内容の対象レコードの値が変更されない（前提=注文確定/最小長-1） | bound(読替) | C-08 |
| 040 | 更新内容の対象レコードの値が変更される（前提=購入完了画面） | bound(読替) | C-05 |
| 041 | 実行結果の対象レコードの値が変更される（前提=表示要素） | bound(読替) | C-04 |
| 042 | 購入完了画面で購入完了タグログを送信 | 要実機 | C-R1 |
| 043 | 購入完了画面の表示時であること | bound(読替) | C-01 |
| 044 | 購入完了画面の表示時であること | bound(読替) | C-01 |
| 045 | アラートメール送信・セッション初期化 | partial | C-P3 |
| 046 | 受注ステータスを処理中へ戻す | bound(EEドリフト) | C-09 |
| 047 | 異常時はセッション初期化し更新による再通知を避ける | bound(読替) | C-12 |
| 048 | 店頭受取はTC注文番号、それ以外はご注文番号（8桁） | bound | C-02 |
| 049 | 受注明細ごとに商品の売上分析タグを受注明細へ登録 | bound | C-06 |
| 050 | 件名でエラー表示・完了しない（前提=受注ステータス想定外） | excluded | — |
| 051 | 件名でエラー表示されず継続（前提=SPLINKS記録なし） | excluded | — |
| 052 | 本文でエラー表示・完了しない（前提=在庫） | excluded | — |
| 053 | 本文でエラー表示されず継続（前提=メール） | excluded | — |
| 054 | SPLINKS決済記録の有無を確認し整合しなければ完了確定しない | bound(EEドリフト) | C-09 |
| 055 | 購入完了画面・注文完了メール送信・在庫更新・ポイント/タグログ連携 | partial | C-P1 |
| 056 | 受注ステータス異常・決済記録不整合エラー画面、もしくは受注IDなしでトップへ | partial | C-P4 |
| 057 | 受注作成・在庫更新・ポイント使用・スマレジ連携・売上分析タグ登録・セッション初期化 | partial | C-P2 |
| 058 | 受注番号（注文番号）であること | bound(読替) | C-02 |
| 059 | 店頭受取の注文に付くであること（呼び出し番号） | bound(読替) | C-02 |
| 060 | 購入完了時に在庫を更新 | bound | C-05 |
| 061 | 受注明細へ売上分析タグを登録 | bound | C-06 |
| 062 | 当機能の登録・更新で対象テーブルを直接保存（不要な削除は含まない） | bound(読替) | C-11 |
| 063 | 共通エラー画面（購入処理エラー） | bound(EEドリフト) | C-08d |
| 064 | 画面表示データでエラー表示されず継続（前提=SPLINKS記録なし） | excluded | — |
| 065 | アラートメール送信・セッション初期化・購入処理エラー画面表示 | partial | C-P3 |
| 066 | 注文確定時に保存し購入完了処理で参照（受注ID） | bound(読替) | C-07 |
| 067 | 完了処理中のロケール調整に用い処理後に除去 | bound(EEドリフト) | C-10 |
| 068 | 注文番号として表示すること | bound(読替) | C-02 |
| 069 | 単一列としての保持有無は移行先で要確認（→D5確定でee実スキーマ裏取り・呼び出し番号の保持先=専用テーブル`dtb_waiting_number`） | bound(読替) | C-13 |
| 070 | 補助テーブルの有無・名称は移行先で要確認（→D5確定でee実スキーマ裏取り・本フローで書かれるタグ/SPLINKS表実在。スマレジ表は本フロー非書込のため根拠外） | bound(読替) | C-13 |
| 071 | 受注作成・受注IDセッション保存・ポイント使用・購入完了へ遷移 | bound | C-07 |
| 072 | セッションの受注を確認し完了処理を行い購入完了画面表示 | bound(読替) | C-01 |
| 073 | 見出し「ご注文完了」・御礼・注文番号・合計・送料・購入商品 | bound | C-01 |
| 074 | 店頭受取は完了表示を店頭向けに切り替える | bound | C-03 |
| 075 | 購入完了画面の表示時であること | bound(読替) | C-01 |
| 076 | 購入完了画面の表示時であること | bound(読替) | C-01 |

`func_scope_check` 判定: 親76/76会計済み・欠落0・理由なし重複0。C-EN-01（§4.4）は母集合対応先が無いため本表・
本集計に含めない（会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

### 会計内訳（機械実証・再現用）

- bound成功直接（10）: 004,006,008,048,049,060,061,071,073,074
- bound成功読替（38）: 001,002,003,005,009,020,021,022,024,025,026,027,028,029,030,032,033,034,035,036,037,038,039,040,041,043,044,047,058,059,062,066,068,069,070,072,075,076（改訂6で002,003,069,070をTBDから追加＝C-13）
- bound(EEドリフト)（8）: 013,018,019,031,046,054,063,067
- partial（7）: 012,023,045,055,056,057,065
- 要実機（2）: 007,042
- TBD（0）: 改訂6で全件解消（旧002,003,069,070はC-13 boundへ）
- excluded（11）: 010,011,014,015,016,017,050,051,052,053,064
- 10+38+8+7+2+0+11=76・差分0（001..076連番を全被覆・重複なし）

---

## §9 TBD・要実機・partial・excluded・BC-DRAFT（正直な分離・改訂1後）

### 要実機（母集合対応・2 test_id）
-007,-042（C-R1）: 購入完了タグログのunisearch外部送信（md:79,109,184。ee照合: checkout `sendCompleteTaglog`＝
ShoppingController.php:607／complete.twig client `_sendCheckLog`）。**外部ホストへの実送達が観測対象**で自社側で
最終送達を確定できない。DOM上のタグスクリプト設置は観測可能だが「送信すること」の逐語は外部送達を主張するため要実機。

### partial（母集合対応・7 test_id・§4.2）
-012/-045/-065（C-P3・アラートメール外部SMTP実送達）・-023/-055（C-P1・注文完了メール外部送達＋タグログ外部送信）・
-057（C-P2・スマレジ外部POS送信）・-056（C-P4・失敗出力の選言）。**各行はbound枝（現EEで観測可・隔離ハーネス配備される前提）／
要実機枝（外部送達）／ドリフト枝（現EEに実装なし・失敗期待）の内訳を持つ**（§4.2）。R3 Major③是正: -012/-045/-065の
「購入処理エラー画面」枝と-056の異常/SPLINKS枝は**EEドリフト（`shopping_process`/`no_sln_payment_record`不在＝§4.1d・
現EEでは失敗期待）**であり「観測可（成功）」と書かない。partial判定（1 test_id=1会計）は維持し内訳表記のみ是正した。

### bound(EEドリフト)（母集合対応・8 test_id・§4.1d・R2 Major③）
-031/-063（C-08d・購入処理エラー`shopping_process`）／-013/-018/-046/-054（C-09・SPLINKS`no_sln_payment_record`・処理中戻し）／
-019/-067（C-10・genericロケール不一致遷移）。**設計md（正本）が規定するが現EE（base+SlnPayment42 plugin）に該当実装が
grep実測で見当たらず現EEでは失敗期待**。テストは設計md通りに書き、現EEに対してはドリフト検出（失敗が正当）として機能。
「seed→期待観測可（成功）」とは誤記しない。bound成功（48件・改訂6でC-13 +4）と会計上区別（§8）。

### インフラ水準のハーネス前提（特定test_idに紐付かない・D5確定＝配備される前提。真の外部実送達のみ要実機）

| # | 事項 | 状態（D5確定前提） |
|---|---|---|
| 0 | **共有隔離ハーネス（全checkout/外部連携T2で共有）** | checkout系bound（C-04〜C-07・partialのbound枝）の実走前提。**D5で確定・配備される前提で実行可能**。設計は§2に具体化: Mailer=`null://null`（`mailer.yaml:2`既定で成立・起動時確認）／Messenger asyncを`in-memory://`へE2E上書き＋worker非起動（`messenger.yaml:8`実env DSN基にE2E上書き＝**現状未設定・D5整備対象**）／`UniSearchService`をE2E services上書きでno-op化（**現状未設定・D5整備対象**）／起動時外部host非到達アサート（**現状未配備・D5整備対象**）。**隔離ハーネスはD5で配備される前提で実行可能**（現状ee `services_e2e.yaml`/`services_test.yaml`にUniSearch差替・Messenger in-memory上書きはgrep実測0件） |
| 1 | 隔離SMTP／null transport確認 | #0の一部。Mailer null系の起動時確認（**mailer.yaml既定で成立・D5確定**） |
| 2 | unisearchタグログ送信先/スタブ | C-R1・C-P1の外部送達枠＋#0のUniSearch無効化。スタブは**D5で配備される前提（現状未設定）**。ただしC-R1の**真の外部実送達の実応答は要実機** |
| 3 | スマレジ連携先/スタブ・Messenger transport（in-memory・ワーカー非起動。`sync`は使わない） | C-P2の外部送達枠＋#0のMessenger非async化＋破壊系ジョブ遮断。スタブは**D5で配備される前提（現状未設定）**。ただしC-P2の**外部POS実送信の実応答は要実機** |
| 4 | SPLINKS決済代行サンドボックス | スタブは**D5で配備される前提**。partial外部枝で決済代行の実応答が必要な場合のみ要実機。C-09の「記録なし」はローカルseedで完結 |
| 5 | 破壊系S0のdb.ts配線 | 対象テーブル・FK削除順序・条件付きDELETE（アプリ側の存在照会→存在時バインドDELETE。`DO $$`は`:oid`バインド不可のため不採用＝§2で確定）は§2で特定済み・**実配線はD5確定＝配備される前提** |
| 6 | 確定済み受注＋セッション受注IDのシード投入手順 | C-01〜C-08の前提。通常決済で確定した受注の合成／直接投入。**fixture具体値はD5確定＝配備される前提** |

### excluded（11件・§4.6で詳述・per-ID実引き）
-010,-011,-014,-015,-016,-017,-050,-051,-052,-053,-064。理由=入力フォーム非存在でバリデーション観測対象なし
（肯定/否定側とも）／別機能委譲（件名・本文）／前提と期待の矛盾。各前提の実在挙動は他候補でbound化済み＝偽陰性なし。

### TBD（改訂6で全件解消・0件・§4.5で詳述）
-002,-069,-003,-070は**改訂6でD5確定前提により裏取り解消しC-13（bound）へ移動**（TBD 4→0）。従来は期待テキストが
「移行先で要確認であること」の非アサーションとしてTBD留保していたが、D5=移行先=ee実装確定の前提で呼び出し番号の保持先
（店頭受取フローの専用テーブル`dtb_waiting_number`＝WaitingNumberProcessor.php:53-59）・本購入完了フローで書かれる補助テーブルの
有無/名称（`dtb_order_item_tag_sales_analysis`〔checkout時INSERT〕／`plg_sln_order_payment_status`）を実スキーマで裏取りしbound化。
**改訂7是正**: (i)旧「単一列＝`dtb_order.waiting_number`/`dtb_waiting_number`」は2表併記で単一列主張と自己矛盾していたため実保存先
`dtb_waiting_number`に忠実化。(ii)スマレジ連携`dtb_smaregi_transaction_job`は実在するがwebhook子ジョブ用メタで購入完了フローでは
書かれない偽陽性のためbound根拠から除去（本フローのスマレジ連携=使用ポイントMessengerジョブの外部処理＝C-P2/要実機）。
これらは根拠の是正でありbound区分（4件とも）は不変。母集合の期待テキストの原義（移行先スキーマの確認）は不変。

### BC-DRAFT / DOC-DRAFT（設計md〔pf現行踏襲spec〕と ee実装の乖離候補・**断定回避**）

**T2規律**: オラクルは設計md。以下はeeを照合補助として観察した乖離候補で、**テストは設計mdどおりに書き**、乖離は
不具合候補として別掲する。ee側の断定は避ける。

| # | 設計md（オラクル） | ee観察（照合補助） | 乖離候補・区分 |
|---|---|---|---|
| ① | メール送信・在庫更新・タグ登録・タグログ・スマレジ連携は「購入を完了する（GET /complete）」ステップの副作用（md:106-109） | ee ではこれらは`checkout()`（POST）で実行（ShoppingController.php:565-611）。complete()はイベントdispatch＋描画＋removeSessionのみ（:640-671） | 副作用の実行位置差異の可能性（checkout vs complete）。**DB効果の観測可否には影響しない**（どちらの段でも自社DBで観測）。断定回避 |
| ② | エラー文言キー`front.error.shopping_process`／`front.error.no_sln_payment_record`（md:139-142） | ee（base+plugin＝`plugin_repos/SlnPayment42`含む）に当該キー・文字列**不在**（`grep -r "shopping_process\|no_sln_payment_record"`実測0件） | 翻訳キー未移行の可能性。**-EN実文言確定不能＝要確認**。これらの文言を表示する挙動自体が現EEに無い＝§4.1dのEEドリフト（C-08d/C-09）の一次根拠。断定回避（未探索プラグイン領域の可能性） |
| ③ | 完了見出し「ご注文完了」（md:78,131） | `front.shopping.complete_title` ja値=「注文完了」（ja.yaml:1540） | 文言差異（「ご」の有無）。期待は設計md値。要確認 |
| ④ | 御礼「ご注文ありがとうございました。」（句点付・md:78,132） | 同キー ja値=「ご注文ありがとうございました」（句点なし・ja.yaml:1541） | 句点差異。期待は設計md値。要確認 |
| ⑤ | 店頭受取は「完了表示を店頭向けに切り替える」（md:80） | ee `complete.twig:16-18`は`<meta http-equiv="Refresh">`で店頭トップURLへ自動遷移（実装詳細） | meta refreshは設計md未記載＝**期待値化しない**（R1 Major③是正）。設計mdへ明文化後にL1化を検討 |
| ⑥ | 完了ステップで受注ステータス判定(#2・注文受領/入金待ち以外→purchase-process error)・SPLINKS整合(#3・記録なし→処理中戻し)・（generic）ロケール不一致遷移を規定（md:99-101,116-121） | ee `complete()`本体(625-700)に受注ステータス判定・SPLINKS整合・genericロケール遷移が**見当たらない**（grep実測）。`FRONT_SHOPPING_COMPLETE_INITIALIZE`のsubscriberも**0件**（grep実測）。ロケールはSPLINKS 3D戻りの`PaymentController.php:745-747`・`Credit.php:79-87`にのみ存在（SPLINKS決済戻り限定） | **§4.1dのEEドリフト（C-08d/C-09/C-10）の一次根拠**。判定がcheckout側/未移行/別経路の可能性は排除しないが**断定回避**。R2 Major③是正: 当該行を「seed→観測可(bound成功)」でなく「現EEでは失敗期待(EEドリフト)」として bound成功と会計区別。現行踏襲の正本挙動はpf/実機で確認 |

候補規律: 本表は**設計md（オラクル）とee観察の乖離候補**（BC-DRAFT）で、確定はpf現行/実機による〔**D5スキーマ/ハーネス軸とは別軸**〕。O5未確定・**実装/実走はD6実装対象**（環境/前提のD5配備前提とは別軸）・O6/聖域/多軸/C6C7を主張しない（@TBD-D5のlive留保は用いない）。

---

## 付録: 作業実測（改訂6後）

- 参照物: 設計mdオラクル 1／中間成果物 1（e2e_cases 90版）／母集合 1（76行）／先例 1（f06-19）／
  ee照合補助 15（ShoppingController.php〔complete:655/checkout:524,602/confirm〕・complete.twig:98・
  WaitingNumberProcessor.php:53-59〔`dtb_waiting_number`への生成/保存＝店頭受取フローの実保存先〕・DtbWaitingNumberRepository.php:56・
  Order.php〔waiting_number列:644＝スキーマに実在も本フロー非書込〕・OrderItemRepository.php:163-186・
  SmaregiTransactionProcessMessageHandler.php〔`dtb_smaregi_transaction_job`書込＝webhook子ジョブ用・購入完了フロー非関与〕・
  messenger.yaml〔SmaregiOrderUsePointMessage:async〕・services_e2e.yaml/services_test.yaml〔UniSearch/Messenger上書き未設定を実測〕・
  SlnPayment42 OrderPaymentStatus/History/Send.php・PaymentController.php・Credit.php・mailer.yaml・UniSearchService.php・messages.ja/en.yaml）。
- L1 claim数: **20確定・TBD 0**。候補ケース**20**（bound成功11〔C-01〜C-08/C-11/C-12/C-13〕・bound(EEドリフト)3
  〔C-08d/C-09/C-10〕・partial 4〔C-P1〜C-P4〕・要実機1〔C-R1〕・補完1〔C-EN-01〕）。
  母集合対応=bound成功直接10・bound成功読替38・bound(EEドリフト)8・partial 7・要実機2・TBD 0・excluded 11（差分0）。
- **改訂6（D5確定前提化＋TBD解消）の要点**: (1)D5確定によりcheckout系boundの隔離ハーネス留保（未整備/実走不可/
  @TBD(ハーネス)）を撤回し**D5で確定・配備される前提で実行可能**へ（真の外部実送達=unisearch実送達等のみ要実機のまま）。
  現状ee `services_e2e.yaml`/`services_test.yaml`にUniSearch差替・Messenger in-memory上書きは未設定＝D5整備対象（正直表現）。S0実配線・
  fixture具体値もD5で確定・配備される前提。(2)TBD 4件（-002/-003/-069/-070）をD5=移行先=ee実装確定の前提でee実スキーマ裏取りし
  **C-13 bound**へ移動。母集合期待テキストの原義は不変。会計: TBD 4→0・bound読替 34→38。
- **改訂7（codex再確認Blocker/Major是正）の要点**: (1)**-003/-070のスマレジ偽陽性除去**: `dtb_smaregi_transaction_job`は
  スマレジ取引webhook子ジョブ用メタで`SmaregiTransactionProcessMessageHandler`のみが書込＝購入完了フローでは書かれない。
  bound根拠を本フローで実際に書かれる`dtb_order_item_tag_sales_analysis`（OrderItemRepository.php:163-186）・
  `plg_sln_order_payment_status`（OrderPaymentStatus.php:22）に限定し、スマレジはC-P2/要実機の外部枝（使用ポイントMessengerジョブ
  `SmaregiOrderUsePointMessage`）へ分離。(2)**-002/-069の保存先忠実化**: 旧「単一列＝`dtb_order.waiting_number`/`dtb_waiting_number`」
  の2表併記自己矛盾を是正。店頭受取フローの生成/保存先は専用テーブル`dtb_waiting_number`（WaitingNumberProcessor.php:53-59でorder_id紐付けsave・
  complete()がfindOneByで取得=ShoppingController.php:655→complete.twig:98）。`dtb_order.waiting_number`列も実在するが本フローの保存先ではない。
  (3)**D5前提表現の是正**: 「配備済み（現存）」を「D5で確定・配備される前提」へ統一し、services_e2e.yaml/services_test.yaml/messenger.yaml
  に当該上書きが未設定である事実（grep実測0件）と矛盾しない正直表現へ。(4)**@TBD残存解消**: fixture_versionはD5確定前提の扱いへ、
  英語仕様は**設計md（オラクル）が英語表示を規定しない＝英語L1オラクルは設計mdに不在（留保でなく確定した不在。ee en.yamlは裏取り補助）**と明示し@TBD-EN仕様のlive留保を除去。いずれも会計区分・母集合identityは不変（bound偽陽性ゼロ・C-EN-01は会計外）。
- **改訂2（R2 Major是正）の要点**: (Major①)checkout系boundの外部副作用遮断を具体化（Mailer=null://null・
  UniSearchServiceテストダブル・Messenger in-memory+worker停止・起動時外部非到達アサート。`sync`/到達不能host表記削除。
  checkout系T2共有土台として明記）。(Major②)S0のSPLINKS 3表DELETEを実行可能SQL（独立DELETE・実列order_id・
  to_regclass存在チェック）に是正。(Major③)C-08/C-09/C-10を検証——`shopping_process`/`no_sln_payment_record`/
  COMPLETE_INITIALIZE subscriberがee全域grep0件のため「現EEでは失敗期待(EEドリフト)」としてbound成功と会計区別
  （§4.1d）。否定側no-writeはcomplete()読取専用の現EE観測可能事実へ再スコープしbound成功維持。
- **改訂1（R1 Major是正・維持）**: 「破壊系＝要実機」是正で自社DB副作用をbound化（要実機40→2）・C-03のmeta refresh
  除去・C-EN-01のENオラクル汚染是正・S0具体化・-011/-014/-015のexcluded一貫化。
- **未検証事項（pf現行/実機で要確認＝設計md-vs-ee乖離候補軸のみ）**: BC-DRAFT①〜⑥（特にEEドリフト⑥の間接経路〔プラグイン/イベント差込〕有無）・②のエラー文言キー未移行。これらは設計md（オラクル）とee観察の乖離候補でありpf現行/実機で確定する（**D5スキーマ/ハーネス軸とは別軸**）。
  **呼び出し番号の移行先保持先は改訂6/7でee実スキーマにより`dtb_waiting_number`と確定＝C-13 bound（未検証事項から除外）**。**外部遮断・S0の実配線はD5確定＝配備される前提（環境/前提）、specコード/db.ts便宜関数の実装・実走はD6実装対象＝いずれも候補グレードの別軸であり未検証事項でない**（@TBD-D5のlive留保は解消）。過剰主張なし・数値は実測・grep0件は「見当たらない（断定回避）」として記載。
