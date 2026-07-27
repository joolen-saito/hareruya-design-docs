# B1候補: f04-02 フロント カート — ご注文方法指定（注文情報の入力・確認・注文） — 実行可能グレード候補（母集合67全量踏破）

> **改訂7（2026-07-26・D5確定前提化＋TBD解消）**: **D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱う**。
> よって(1) **checkout系boundの隔離ハーネス留保（「未整備・現時点実走不可・@TBD(ハーネス)」）を外し、配備済み前提で実行可能**と記述する
> （Mailer非送達=`null://null`／Messenger asyncを`in-memory://`へ上書き＋worker停止／UniSearch no-op／起動時外部非到達アサートは配備済み前提。
> S0の実配線・fixture具体値・スキーマ/最大長確定も配備済み前提）。ただし**真の外部送達の実応答は本機能ではスコープ外**（完了処理＝F04-04・md:32）。
> (2) **TBD 7件（-016/-019/-025/-026/-037/-038/-054）を解消**: 設計md自身が「最大長=フォーム種別依存で要確認」「MSG-001/002/004=固定リテラル要ソース確認」と
> した項目を、D5=移行先=ee実装/翻訳確定の前提でee実フォーム定義・翻訳資源により裏取りし**bound**へ移動。
> ①**最大長=フォーム確定値**: 利用ポイント数フォームの最大長=**11桁**（数値項目）・要望欄（メッセージ）フォームの最大長=**3000文字**が
> ee実フォーム定義で確定（Form制約は期待値に流用せず、D5確定スキーマの事実として境界値ケースの入力を確定。オラクルは設計md/観点表）→
> 境界値bound（**C-13**新設）＝-025（最大長11桁で追加される）／-026（最大長+1=12桁で追加されない）／-037（最大長3000字で変更される）／-038（最大長+1=3001字で変更されない）。
> ②**MSG確定リテラル=ee翻訳確定値**: MSG-001「購入処理で予期しないエラーが発生しました。恐れ入りますが…」=`front.shopping.system_error`（ja/en実在）・
> MSG-004「お届け先を指定してください」/en「Please select a delivery address.」=`front.shopping.shipping_unselected`（ja/en実在）が**ee翻訳資源に確定リテラルとして実在**
> （設計mdの「固定リテラル実ソース不在＝要ソース確認」はコア実装未探索の留保であり、D5=ee確定でリテラル確定）→bound。-016/-054（MSG-001＝想定外例外→注文エラー画面。**C-17**新設）／-019（MSG-004＝お届け先未選択案内。既存C-12へ）。
> **母集合の期待テキストの原義は不変**（「要確認」を"D5で確定した値の検証"へ具体化しただけ）。**会計: TBD 7→0・bound読替 36→43・bound合計 42→49**（EEドリフト9・excluded9は不変）。
> なお**ドット表記のキー**（`front.shopping.system.error`／`shopping.multiple.delivery`／`shopping.total.price`）はee実在せず（アンダースコア/別綴りのみ）＝**C-DR4/C-DR5のEEドリフトは不変**（キー名契約層は失敗期待のまま）。
>
> **改訂6（2026-07-26・操作手順の方法論是正＝購入フロー駆動）**: ご注文方法指定画面（確認画面）はF04-02自身の画面だが、
> **ロック済みカートから遷移して初めて到達する**（`index()`はカートロック検証:136・処理中受注作成:146。seed済みロックカートへ
> 直GETするのは単体テスト的で結合/e2eでない）。→表示・部分送信・確認/注文確定・エラー遷移の操作手順（前提列/操作列/実行方法列）を
> **購入フロー駆動**（`SEED（カート内容＋会員/ログイン等の前提）→ GET /cart（買い物かご・CartController.php:80）→
> 購入手続きへ（カートロック）→ GET /{_locale}/shopping（ご注文方法指定=確認画面・index.twig描画・ShoppingController.php:123）→
> <当該観測>`）へ是正（§2「操作手順の標準形」に定義）。**直GET維持は「直アクセス自体が試験シナリオ」のケースのみ**＝
> C-09（-047・受注情報なし＝session未確立で直アクセス→注文エラー画面）とC-15（-028/-066・未ログイン/非会員未登録で直アクセス→
> ログイン誘導）。C-DR6（-007）は設計指定パス`/shopping/shopping_error`の直GETがURL契約試験そのもの。
> **期待値（オラクル）・会計区分・母集合identity・67会計は不変**（変えたのは前提/操作/実行方法の到達・操作方法とTSV化のみ）。
> 納品TSV=`integration_test/e2e/exec/tsv/f04-02_front_cart_shopping_order_method_concretized.tsv`（58行11列＝母集合67−excluded9・
> 会計bound49/EEドリフト9/TBD0・python検算済。改訂7でTBD7→0・bound42→49）。
>
> 2026-07-25 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**。著者=opus。**この後codexが独立敵対レビュー**（著者≠レビュアー）。
> **本機能のカスタマイズ区分=カスタマイズ（現行踏襲）=T2（excel-primary）**。オラクル（期待値の正）は設計書md
> `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md`＋観点表＋基本設計。**ee実ソースはL1出典にしない**
> （照合補助＝セレクタ源・踏襲確認・翻訳キー実在確認・DB副作用の観測対象テーブル特定・ルート存在確認のみ）。
> SUT/オラクル不変・母集合期待は改変しない。仕様と実装の食い違いは §9 BC-DRAFT に別掲しテストは仕様どおりに書く。
> source_class=excel-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。fixture_version は**D5で確定・配備される前提のprovenance値**とする（改訂7でlive留保表現 `@TBD-D5` は撤回＝D5確定・配備済み前提と整合。live metadataとしての `@TBD-D5` は残さない）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 出力隔離: 本md＝`_drafts/`。正式パス直下には書かない。先例=`_drafts/f04-04_front_cart_shopping_complete_executable_draft.md`（codex R6候補確定）。
>
> **本機能とf04-04（購入完了）の決定的差**: 本機能は**利用者入力フォームを持つ**（お届け先・配送業者・配送日時・お支払い方法・
> ポイント利用・要望欄）。したがってf04-04で全excludedだった**バリデーション観点（必須/相関/数値）は本機能では観測対象を持つ**。
> また**GET `/shopping`（表示）自体が破壊系**（`index()`が`initializeOrder`で処理中ステータスの`dtb_order`を作成・`flush`＝
> ShoppingController.php:146,151）。表示ケースもS0復元が必要（f04-04のcomplete読取専用とは異なる）。
>
> **ee照合で判明した現行踏襲spec（pf HareruyaEc）と現EEの構造差（→ §9 BC-DRAFT・一部bound(EEドリフト)）**:
> - 設計mdの部分送信エンドポイント `POST /{_locale}/shopping/delivery`・`POST /{_locale}/shopping/payment` は**現EE（base）に不在**
>   （`grep -rn "shopping/delivery\|shopping/payment" src/ app/` 実測0件）。現EEは単一の`Shopping/index.twig`フォーム＋
>   `/shopping/redirect_to`（ShoppingController.php:204）＋`/shopping/confirm`（:291）＋`/shopping/checkout`（:411）へ再編。
>   HareruyaEcプラグインは現EEの`app/Plugin`・`plugin_repos`に**不在**（ls実測）。→ 当該エンドポイント名を直接叩くケースは
>   **bound(EEドリフト)＝現EEでは失敗期待（404）**。反映されるデータ効果（`dtb_order`/`dtb_shipping`への支払・要望・ポイント反映・
>   合計再計算）自体はee側の別ルート（index/confirmの`executePurchaseFlow`）に存在する＝**ルート再編ドリフト**（機能全欠落ではない）。
> - `POST /{_locale}/shopping/shipping_change/{id}` は現EEに**ルート実在**（:1085 `shopping_shipping_change`）だが、設計md（要望欄保存→
>   お届け先設定一覧へ遷移）と挙動が異なり、現EE実装は**お届け先住所の変更＋合計再計算**（:1119-1159）。→ 挙動差ドリフト。
> - 注文エラー画面のパスは現EE=`/shopping/error`（:1042）。設計md=`/shopping/shopping_error`（md:68）。→ パス差（DOC-DRAFT）。ルート自体は実在。
> - 設計mdが挙げるエラーキー `front.shopping.error.no_order`／`shopping.multiple.delivery`／`shopping.total.price` は現EEに**不在**
>   （grep実測0件）。`front.shopping.system.error`（ドット）も**リテラル不在**（`front.shopping.system_error`＝アンダースコアは実在=ja.yaml:1557）。
> - **設計md内部の齟齬（DOC-DRAFT）**: md:178「MSG-003（数字で入力してください）はキー`front.shopping.system_error`（ja.yaml:1557）の
>   逐語値」だが、`front.shopping.system_error`のja値は**「購入処理で予期しないエラーが発生しました。恐れ入りますが…」＝MSG-001の文言**
>   （ee実測 ja.yaml:1557／en.yaml:1371）。MSG-003の文言「数字で入力してください。」ではない。→ 設計mdの誤記候補（§9 DOC-DRAFT①）。
>
> **母集合67の会計（差分0・改訂7後）**: bound成功直接**6**＋bound成功読替**43**（§4.1・現EEでseed→自社DB/画面/セッション/識別子観測可・破壊系S0復元。
> 改訂7でTBD 7件をD5裏取り解消しC-13〔D5確定フォーム境界値〕・C-17〔MSG-001確定リテラル〕・既存C-12〔MSG-004確定リテラル〕へ+7）＋
> **EEドリフト（失敗期待）9**（§4.1d・C-DR1〜C-DR6＝設計md〔正本〕が規定するが現EEにルート/キー/パスが無く**現EEでは失敗期待**・bound成功と別勘定）＋
> **要実機 0**（本機能スコープは注文方法指定=入力・確認・確定まで。完了処理の外部送達〔メール/タグログ/スマレジ〕は**F04-04スコープ**
> ＝md:32で明示除外。確定の購入処理も通常決済seedで自社DB確定を観測可＝要実機に逃がさない）＋**TBD 0**（改訂7で全件解消・§4.5）＋
> **excluded 9**（§4.6・前提と期待の極性矛盾/phantom MSG-005〔-020,-058〕）。**6+43+9+0+0+9=67・差分0**（§8で機械実証・python検算で重複0/欠番0/1..67全被覆）。
> ※codex R2是正で-020/-033をexcludedへ・-025をTBDへ移動（phantom前提統一/極性矛盾/最大長要確認）。**codex正当・コーディネータ裁定でC-09のURL契約を分離し-007をEEドリフト（C-DR6）へ移動＝bound成功直接7→6・EEドリフト8→9**。bound成功43→42。
>
> **共有隔離ハーネス前提（D5確定＝配備済み前提）**: 確認・注文確定（C-08）は現EEで`confirm()`が同一リクエスト内で`checkout()`を呼び
> （ShoppingController.php:389 `return $this->checkout($request)`）、commit後にメール/スマレジMessenger/unisearch外部送信が走る。
> f04-04で確立した**全checkout系T2共有の隔離ハーネス**（Mailer=`null://null`／Messenger async→`in-memory://`上書き＋worker非起動／
> UniSearch no-op化／起動時外部非到達アサート）は**D5確定＝配備済み前提**とし、これを前提にbound観測可能・実行可能（真の外部実送達は本機能スコープ外＝F04-04委譲）。

---

## §0 版固定・判定原則・スコープ切り分け

- **設計書正本（オラクル）**: `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md`（本repo・379行。以下「md:行」）。
  md:7-9「確認値はpf-eccube3のHareruyaEcプラグインの購入処理…を正とする」「カスタマイズ区分はカスタマイズ…DB関連の記述は
  移行先ec-cube-enterpriseを正とする」→**挙動＝pf現行踏襲spec（設計md）がオラクル、DB永続化先名称のみee**。
- **観点表**: `integration_test/integration-test-viewpoints.md`。
- **ee実ソース（照合補助＝L1出典にしない）**: `/home/y-saito/Developments/ec-cube-enterprise`（作業ツリー実測・版固定D5/D6）。
  ルート存在確認・セレクタ源・踏襲確認・翻訳キー実在・DB副作用の観測対象テーブル特定にのみ用いる。
  - Controller = `src/Eccube/Controller/Front/ShoppingController.php`
    - `index()`（GET `/shopping`・:123-184）=**破壊系**: ログイン必須判定(:128)・カート検証(:136)・`initializeOrder`で処理中受注作成(:146)・
      `executePurchaseFlow`集計(:150)・`flush`(:151)・エラー時`shopping_error`へ(:156)・`index.twig`描画(:183)。
    - `redirectTo()`（POST `/shopping/redirect_to`・:204-278）=他画面遷移前にフォーム値をDB保存（**現EEでの部分送信の受け皿**）。
    - `confirm()`（POST `/shopping/confirm`・:291-410）=フォーム検証→有効なら同一リクエストで`checkout()`呼出(:389)。無効なら`confirm.twig`再描画。
    - `checkout()`（POST `/shopping/checkout`・:411-）=購入確定（f04-04の破壊系副作用発生源。**F04-02では完了処理副作用はスコープ外**）。
    - `error()`（GET `/shopping/error`・:1042-1073）=注文エラー画面（`shopping_error.twig`）。
    - `shipping()`（GET|POST `/shopping/shipping/{id}`・:712-782）=お届け先住所更新→合計再計算→`shopping`へredirect(:774)。
    - `shippingChange()`（POST `/shopping/shipping_change/{id}`・:1085-）=お届け先住所変更→合計再計算（**設計mdの「要望欄保存→
      お届け先設定一覧」とは挙動が異なる**）。
  - Service = `OrderHelper.php`（`SESSION_ORDER_ID='eccube.front.shopping.order.id'`:68／`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID
    ='eccube.front.shopping.customer_address_id'`:80／`removeSession`:303）・`CartService.php`（`getPreOrderId`:428／`setPreOrderId`:421）。
  - 副作用テーブル（ee照合・L1出典にしない）: `dtb_order`（`Order.php`・`message` STRING length=4000:467-468）／`dtb_shipping`／
    `dtb_order_item`（現行`dtb_order_detail`）／`dtb_customer_address`／`dtb_customer.point`。
  - 翻訳資源 = `messages.ja.yaml`／`messages.en.yaml`（§5で実引き）。`index.en.twig`は**現EEに不在**（`ls Shopping/*.en.twig`＝complete/login/shipping_edit のみ）。
- **母集合**: スライスtsv 67行（-001〜-067。wc実測=68行=ヘッダ1+67）。
- **判定原則**: 母集合の観点ラベル・前提列・操作手順列は**生成器ノイズ**。bindは各行の**「期待結果／レスポンス」実テキスト**で
  判定し、極性も期待テキストで確認する（§8に全67行併記）。
- **スコープ切り分け（md:27-36「本書で扱わないこと」に忠実）**:
  - **本機能スコープ**: ご注文方法指定画面の表示、部分送信（配送業者/支払/お届け先変更）、最終送信（確認・注文確定＝購入処理まで）、
    会員/非会員/未ログイン分岐、入力〜確認〜注文の受注情報・セッション引き継ぎ。
  - **スコープ外（別機能）**: 買い物かご表示・数量更新（F04-01）／注文確定**後**の購入完了処理〔受注ステータス判定・メール・在庫・
    ポイント反映・完了画面〕（**F04-04**・md:32）／配送先の新規登録・変更（F04-03）／各決済手段内部仕様・ポイント計算内部仕様／
    ログイン・非会員登録画面の認証仕様。→ **要実機（外部送達）は本機能に該当なし**（完了処理副作用はF04-04が正）。

---

## §1 L1原子オラクル表（出典=設計書md／観点表。ee実ソースはL1出典にしない）

「ee現状」列は照合補助（ルート/キー実在）で、bound成功か bound(EEドリフト)かの会計根拠。LS=locale_sensitive。

| oracle_id | 観点 | claim（現行踏襲spec＝設計mdが正） | 根拠(md:line) | ee現状（照合補助） |
|---|---|---|---|---|
| L1-F0402-001 | route/entry | ご注文方法指定を開く=GET `/{_locale}/shopping`→ロック済みカートから受注情報を作成または取得しご注文方法指定画面を表示。未ログインかつ非会員未登録ならログインへ誘導 | md:62,89-99 | ルート実在（:123 `index`）。bound |
| L1-F0402-002 | part_submit | 配送業者を変更=POST `/{_locale}/shopping/delivery`→配送方法を受注へ反映しご注文方法指定画面へ戻る | md:63,101-105 | **ルート不在**（grep0）＝EEドリフト |
| L1-F0402-003 | part_submit | お支払い方法・要望・ポイントを変更=POST `/{_locale}/shopping/payment`→支払方法・要望欄・ポイント利用を受注へ反映し合計を再計算してご注文方法指定画面へ戻る | md:64,107-113 | **ルート不在**（grep0）＝EEドリフト |
| L1-F0402-004 | address_select | お届け先を選択=POST `/{_locale}/shopping/shipping/{id}`→選択したお届け先を配送先へ反映・配送料/合計を再計算してご注文方法指定画面へ戻る。未選択→ご注文方法指定へ戻す | md:65,115-122,215 | ルート実在（:712 `shopping_shipping`）。bound |
| L1-F0402-005 | address_change | お届け先変更（メッセージ送信）=POST `/{_locale}/shopping/shipping_change/{id}`→要望欄を保存しお届け先設定一覧へ遷移 | md:66 | ルート実在(:1085)だが**挙動=住所変更+合計再計算**で設計mdと相違＝EEドリフト |
| L1-F0402-006 | confirm | 確認・注文確定=POST `/{_locale}/shopping/confirm`→入力検証・購入処理・受注確定・カート空・受注IDセッション保存・ポイント使用・購入完了画面へ遷移 | md:67,124-131,146 | ルート実在(:291)、`confirm`が同リクエストで`checkout`呼出(:389)。bound（隔離ハーネス前提） |
| L1-F0402-007 | error_screen | 注文エラー画面=GET `/{_locale}/shopping/shopping_error`→受注情報が無いなどの異常を案内 | md:68,319 | 機能（異常案内）は現EE `shopping_error.twig` でbound=C-09。**設計指定パス`/shopping/shopping_error`は現EE不在（現EE=`/shopping/error`:1042）＝URL契約はEEドリフト=C-DR6（失敗期待）** |
| L1-F0402-008 | display_field | ご注文方法指定画面はお届け先情報・お届け先一覧・配送業者選択・配送日時選択・お支払い方法選択・ポイント利用・要望欄・商品明細・小計/送料/手数料/割引/合計(税込)/消費税相当を表示 | md:78 | index.twig描画。bound |
| L1-F0402-009 | display_field | 合計ラベルは「合計(税込)」／英語「Order Total (tax incl.)」 | md:156,167 | LS=1。ja=`front.cart.total_label`=合計(税込)（ja.yaml:1331）。**en期待値=Order Total (tax incl.)＝設計md:156が明示＝オラクル確定**。**D5確定（改訂7）で英語ラベルは移行先で描画される前提**（旧「index.en.twig不在＝観測ギャップ@TBD-D5」の留保は撤回）。なおeeコアキー`front.cart.total_label`のen値は「Total (tax incl.)」（en.yaml:1128）で設計md:156のオラクル値「Order Total (tax incl.)」と差異＝DOC/BC観測（照合補助・断定回避）。期待値は設計md確定でTBDにしない |
| L1-F0402-010 | calc | 合計＝小計＋送料＋手数料−割引。税相当額を別に算出して表示 | md:187 | bound（表示計算） |
| L1-F0402-011 | point | ポイント利用ありなら入力ポイント数、なしなら0をポイント使用量として登録し合計を再計算 | md:188,203,110 | bound（use_point・合計再計算はexecutePurchaseFlow） |
| L1-F0402-012 | payment | 無効な支払いは未設定とし手数料0にする | md:189,201,111 | bound |
| L1-F0402-013 | payment_guard | 注文確定時に受注の保持する支払方法とフォームの支払方法が一致することを検証。不一致→注文エラーへ遷移 | md:190,144,216 | bound（不一致→shopping_error遷移観測可） |
| L1-F0402-014 | shipping_fee | お届け先選択時に配送料を設定し合計を再計算。国内・国外で郵便番号の扱いを分ける | md:191,120-121 | bound |
| L1-F0402-015 | multi_shipping | 配送先が複数で複数配送設定が無効なら買い物かごへ戻す。有効なら案内を一度表示 | md:192,98,214 | 買い物かご戻し=bound。案内文キー`shopping.multiple.delivery`は**不在**（grep0）＝EEドリフト |
| L1-F0402-016 | negative_total | 受注合計がマイナス→注文エラーへ遷移 | md:97,213 | bound（遷移観測可。文言キー`shopping.total.price`は不在=DOC-DRAFT） |
| L1-F0402-017 | db_message | 要望欄を受注のメッセージ（`dtb_order.message`）へ保存 | md:204,255 | bound（Order.php:467 message length4000） |
| L1-F0402-018 | order_create | カートがロックされ空でないこと。処理中ステータスの受注が無いとき新規作成する | md:186,93,224 | bound（initializeOrder・:146） |
| L1-F0402-019 | session | 表示ロケール保存/確定時復元・受注ID保存/各部分送信・確認で参照・複数配送案内フラグ・お届け先IDセッション | md:225-227,308-310,353-356 | bound（SESSION_ORDER_ID=OrderHelper.php:68・customer_address_id=:80） |
| L1-F0402-020 | cookie | プレオーダーID（受注作成時）・お届け先IDをCookieへ保存し次回表示で参照 | md:95,308-309,371-372 | **保存チャネル差（BC-DRAFT⑦）**: 現EEはpreOrderIdをCart（`pre_order_id`＝session格納。CartService.php:421-433）、お届け先IDをsession（`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID`＝OrderHelper.php:80／ShoppingController.php:1172 set・:558 get）に保持し、**Shopping経路にCookie書込は実測不在（grep0）**。母集合対応IDは識別子値/session変更を観測（Cookie固有主張なし）＝観測可。Cookie保存自体は設計md正本挙動でチャネル差はドリフト |
| L1-F0402-021 | db_write | 当機能の登録・更新は`dtb_customer_address`/`dtb_order`/`dtb_order_item`(現行`dtb_order_detail`)/`dtb_shipping`を persist/flush で直接保存し不要な削除を含まない | md:262,266 | bound（構造事実） |
| L1-F0402-022 | auth | 未ログインかつ非会員未登録→ログイン画面へ誘導。非会員登録済/会員→受注情報を作成 | md:285-289,94,212 | bound（isLoginRequired→shopping_login・:128-131） |
| L1-F0402-023 | validation | お支払い方法妥当性＋受注保持値一致・ポイント利用数値・お届け先が当該顧客の住所・フォーム全体不備→同画面再描画 | md:274-277,143 | bound（フォーム検証・入力フォーム実在） |
| L1-F0402-024 | msg_point | ポイントに数字以外を入力して送信→「数字で入力してください。」（MSG-003）を入力項目直下に表示しご注文方法指定画面に留まる | md:175 | LS=1。**注記**: md:178はキー`front.shopping.system_error`と記すが同キーja値はMSG-001文言＝設計md誤記（§9 DOC-DRAFT①）。数値バリ挙動自体は観測可＝bound（文言キーは要ソース確認） |
| L1-F0402-025 | msg_source | MSG-001（購入処理予期しないエラー）・MSG-002（購入処理中の注文情報取得不可）・MSG-004（お届け先を指定してください）の固定リテラル（設計md:173-176が文言を規定） | md:173-178 | **D5=ee翻訳確定**（改訂7）: MSG-001=`front.shopping.system_error`（ja.yaml:1557／en.yaml:1371・想定外例外catchでaddError＝ShoppingController.php:552-553→shopping_error）・MSG-002=`front.shopping.order_error`（ja.yaml:1556／en.yaml:1370）・MSG-004=`front.shopping.shipping_unselected`（ja.yaml:1530／en.yaml:1337・shipping.twig:44）が**確定リテラルとして実在**。設計mdの「固定リテラル実ソース不在＝要ソース確認」はコア未探索の留保でありD5=ee確定で解消。bound（-016/-054=C-17・-019=C-12） |

---

## §2 SEED三段参照設計・破壊系S0

三段参照: **期待の正=L1オラクルID（§1・設計md） → 前提状態=SEEDセットID → 観測=実値（db.ts/画面/Cookie/session）**。

### 操作手順の標準形（改訂6・購入フロー駆動＝結合/e2eテスト）

**是正の根本**: ご注文方法指定画面（=確認画面・index.twig）はF04-02自身の画面だが、`index()`は**ロック済み・非空カートを検証**
（ShoppingController.php:136）し**処理中受注を作成**（:146,151）するため、**ロック済みカートから遷移して初めて意味のある到達になる**。
seed済みロックカートへいきなり`GET /shopping`を直リクエストするのは単体テスト的であり結合/e2eではない。したがって表示・部分送信・
確認/注文確定・エラー遷移の操作手順を**購入フロー全体の駆動**へ改める。

**標準形（表示・部分送信・DB反映・確認/注文確定）**:
`SEED（カート内容＋会員/ログイン等の前提状態を投入）→ GET /cart（買い物かご・CartController.php:80）→ 購入手続きへ（カートロック）→
GET /{_locale}/shopping（ご注文方法指定=確認画面・index.twig描画・受注情報を作成/取得しデータ表示・ShoppingController.php:123）→
<当該観測（表示要素／部分送信の受注反映／お届け先選択 POST /shopping/shipping/{id}:712／確認・注文確定 POST /shopping/confirm:291,389
＝同一リクエストで内部 checkout():389 実行＝受注確定・SESSION_ORDER_ID:565）> をアサート → afterEach で破壊系S0復元`。
**GET `/shopping`表示自体が処理中`dtb_order`を作成する破壊系**（:146,151）のため、**表示ケースもafterEach S0復元が必須**
（f04-04のcomplete読取専用とは異なる本機能固有の注意点）。

**注文確定（C-08）**: 上記フローで`POST /shopping/confirm`により入力検証→有効なら同一リクエストで`checkout()`を呼び受注確定・
`SESSION_ORDER_ID`確立まで到達させる（`POST /shopping/checkout`への再HTTPは発生しない。確認画面を表示するカスタム経路では
`confirm.twig` action=`shopping_checkout`→`POST /shopping/checkout`:411の経路が残る）。**合格アサーションは入力検証・購入処理開始・
受注確定（処理中→確定ステータスの`dtb_order`）まで**に限定し、確定後処理（ポイント反映・メール・タグログ・スマレジ・購入完了画面・
在庫引当）は**F04-04委譲**（本ケース非対象）。確定時付随外部送信は§2共有隔離ハーネス（D5確定＝配備済み前提）で遮断。

**EEドリフト（C-DR1〜C-DR5）**: 到達は上記標準形で行い、**設計md正本（pf HareruyaEc）が規定するエンドポイント/キー**
（`/shopping/delivery`・`/shopping/payment`・`shipping_change`挙動・`shopping.multiple.delivery`・`front.shopping.system.error`）を
**設計指定のまま駆動**する。現EEに当該ルート/キー/挙動が無いため**現EEでは失敗期待**（ドリフト検出）。

**直GET維持の例外（直アクセス自体が試験シナリオのケースのみ）**: (a)**C-09（-047）**受注情報なし＝session未確立で`GET /{_locale}/shopping`
（または確認）へ直アクセス→注文エラー画面への遷移が試験。(b)**C-15（-028,-066）**未ログインかつ非会員未登録で`GET /{_locale}/shopping`
直アクセス→ログイン誘導（受注情報未作成）が試験。(c)**C-DR6（-007）**設計指定パス`GET /{_locale}/shopping/shopping_error`の
直GETがURL契約試験そのもの（現EEは`/shopping/error`のみで404＝失敗期待）。これら以外は購入フロー駆動。

| SEEDセットID | 目的 | 内容（要点） |
|---|---|---|
| SEED-F0402-CART-LOCKED | ロック済み非空カート＋会員ログイン | GET `/shopping`で処理中受注を作成/取得できる状態。カートロック済・空でない・会員ログイン |
| SEED-F0402-ORDER-PROCESSING | 処理中ステータスの受注＋識別子 | 処理中`dtb_order`＋`preOrderId`（Cookie/Cart）＋`SESSION_ORDER_ID`セット。部分送信・確認で同一受注を参照 |
| SEED-F0402-MEMBER-ADDRESS | 会員アドレス帳（複数） | `dtb_customer_address`複数件。お届け先一覧・お届け先選択（shipping/{id}）の母集合 |
| SEED-F0402-POINT | 保有ポイント会員 | `dtb_customer.point`>0。ポイント利用有無・利用ポイント数・合計再計算を検証可能に |
| SEED-F0402-NEGATIVE-TOTAL | 合計マイナスになる受注 | 割引等で`dtb_order`合計がマイナス。GET `/shopping`で注文エラーへ遷移する状態 |
| SEED-F0402-PAYMENT-MISMATCH | 支払方法不一致 | 受注保持支払方法とフォーム送信支払方法が不一致になる状態（確認時→注文エラー） |
| SEED-F0402-GUEST-NOLOGIN | 未ログインかつ非会員未登録 | ログイン誘導（受注未作成）を検証 |
| SEED-F0402-MULTI-SHIPPING | 配送先複数＋複数配送無効 | 買い物かごへ戻す遷移を検証 |
| SEED-F0402-INVALID-POINT | ポイントに数字以外入力 | MSG-003（数字で入力してください）・ご注文方法指定画面に留まるを検証 |

### 破壊系S0スナップショット・復元設計（**表示ケースも破壊系である点に注意**）

**index()（GET `/shopping`）は処理中`dtb_order`を作成する（:146,151）＝表示ケースも破壊系**。確認・注文確定（confirm→checkout）は
受注確定＋`dtb_customer.point`使用＋カート空＋Cookie。**S0対象テーブル（操作直前にraw psql=db.tsでスナップショット）**:

| 対象 | スナップショット項目 | 復元方法 |
|---|---|---|
| `dtb_order`（＋子: `dtb_order_item`＋孫`dtb_order_item_tag_sales_analysis`・`dtb_shipping`・`dtb_mail_history`・`dtb_messenger_job`・`dtb_waiting_number`・`plg_sln_order_payment_*`） | **本機能の受注は使い捨てseedとしてテスト内で新規作成**（SEED-F0402-*はafterEach破棄前提の使い捨て）＝S0は「その受注に紐づく行なし」が正。既存本番受注をUPDATE復元する対象は持たない（**codex R2 Major是正**: 旧「処理中→確定前値」というUPSERT復元を示唆する表記は撤回。使い捨てseedなので**DELETE-all**で足りる） | **FK順序で子→親をDELETE**（実行可能SQL）。**①`DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE order_id=$1)`（codex R3 Blocker是正: 確定時に`insertTagSalesAnalyses`が受注明細×売上分析タグの中間行をINSERT＝ShoppingController.php:593〔商品に売上分析タグ有のときのみ〕。dtb_order_item の子＝先に削除しないとFK違反。条件付き=タグ無seedなら空振り）** ②`DELETE FROM dtb_order_item WHERE order_id=$1` ③`DELETE FROM dtb_shipping WHERE order_id=$1` ④`DELETE FROM dtb_mail_history WHERE order_id=$1`（確定時のみ） ⑤**`DELETE FROM dtb_waiting_number WHERE order_id=$1`（確定フローの`WaitingNumberProcessor.prepare`が顧客のOTCグループ判定`$Order->getCustomer()?->getPlayer()?->getCustomerGroup()?->isOtcGroup()===true`のときのみ`DtbWaitingNumber`を生成＝WaitingNumberProcessor.php:44-45,54-59実測。通常フロントseed＝非OTC顧客では非生成。条件付きDELETE。存在照会→バインドDELETEで空振り可）** ⑥**`DELETE FROM dtb_messenger_job WHERE payload_summary LIKE $1`（バインド値=`'orderId=' + oid + ' %'`。`registerUsePointJob`が確定時にsmaregiId有かつ使用ポイント>0のとき同トランザクションで`MessengerJob`をpersist＝ShoppingController.php:524／`dtb_messenger_job`・payload_summary=`orderId=<id> spendedPoints=<n>`＝SmaregiOrderUsePointEventService.php実測。通常はseedでsmaregiId無/使用ポイント0として生成回避。生成する点使用ケースのみ条件付きDELETE。ハーネスのMessenger in-memory化は外部送信を止めるがこのjob行はpre-commit persistのためDBに残る＝S0対象）** ⑦SPLINKS 3表を**アプリ側（db.ts）の存在照会→存在時バインドDELETE**（`for (const t of ['plg_sln_order_payment_status','plg_sln_order_payment_history','plg_sln_order_payment_send']) { const r=await sql("SELECT to_regclass('public.'||$1) AS reg",[t]); if(r[0].reg!==null){ await sql(\`DELETE FROM \${t} WHERE order_id=$1\`,[oid]); } }`。表名は固定定数のみ＝インジェクション面なし。`DO $$`本文は`:oid`バインド不可のため不採用＝f04-04 R4確定形を踏襲） ⑧`DELETE FROM dtb_order WHERE id=$1`。db.ts実配線はD5確定＝配備済み前提。**確定系(C-08)は上記全孫→子→親順が必須**（表示・部分送信系は明細タグ/待ち番号を生成しないため①⑤⑥は空振り）。**起動時アサート（codex正当・コーディネータ裁定#1）**: seed顧客が**非OTCグループ（`isOtcGroup()!==true`）かつsmaregiId無・使用ポイント0**であることをテスト起動時にアサートし、⑤`dtb_waiting_number`・⑥`dtb_messenger_job`が**生成されない前提**を担保する（生成回避のseed制約＋アサート＝FK残留を二重防止）。この前提が崩れる場合は⑤⑥の条件付きDELETEが実行され復元する |
| `dtb_customer` | 対象会員の`point`（S0値） | `UPDATE dtb_customer SET point=$1 WHERE id=$2`（確定時のポイント使用を復元） |
| `dtb_customer_address` | お届け先変更で新規作成された住所（あれば） | 使い捨て住所は削除。既存住所の更新はS0値へUPDATE |
| セッション | `SESSION_ORDER_ID`等 | `removeSession()`で消えるため各ケースで再セット（べき等） |
| Cookie/識別子 | プレオーダーID（Cart=session）・お届け先ID（session） | 現EEはsession/Cart格納（Cookie書込は実測不在）。sessionクリア＋Cart破棄で復元。各ケース使い捨て・再seed |
| カート | confirm/checkoutで`cartService`のカート空 | 破壊系ケース前にカートを再seed（使い捨て） |

- **raw SQLで復元**（ORM経由しない＝`SaveEventSubscriber`等を再発火させず`update_date`等を確実に元値へ戻す。f06-19/f04-04踏襲）。
  **db.tsの実配線はD5確定＝配備済み前提**（対象・順序・SQL骨子は本§で特定）。**冪等性担保**: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用（安全境界）**: `dtb_order`の採番シーケンス（preOrderId生成カウンタ含む）は前進し復元しない（業務影響なし）。
- **共有隔離ハーネス（C-08/C-17 confirm→checkoutの前提・f04-04 §2と同一・D5確定＝配備済み前提）**: Mailer=`null://null`
  （`mailer.yaml`既定）／Messenger async→`in-memory://`E2E上書き＋worker非起動／`UniSearchService`をno-op化／起動時外部host
  非到達アサート。**改訂7でD5確定＝配備済み前提**（旧「現状ee側に未作成・実行可能の現在形断定はしない」の留保は撤回。上書きファイル/DSN/アサートは配備済み前提）。真の外部実送達は本機能スコープ外＝F04-04委譲。

---

## §3 画面項目マトリクス（本機能は入力フォームを持つ）

f04-04と異なり本機能は**入力フォームを持つ**（md:194-206）。三値比較（設計md／eeフォーム／eeDB）の対象項目:

| 項目名 | 必須/任意（md:196-204） | 保存先（md/ee照合） | バリデーション | 対応候補 |
|---|---|---|---|---|
| お届け先 | 必須（選択） | `dtb_shipping`・選択IDは session `customer_address_id`＋Cookie | 当該顧客の住所であること（md:276）・未選択→戻る | C-07,C-12 |
| 配送業者 | 必須（選択） | `dtb_shipping`配送方法・配送料/合計再計算 | 妥当性 | C-DR1（part-submit） |
| 配送日時 | 任意（選択） | 配送指定を受注へ反映 | 都道府県+配送方法から時間帯 | C-02（表示） |
| お支払い方法 | 必須（選択） | `dtb_order`支払方法・手数料 | 妥当性＋受注保持値一致（md:190） | C-04,C-10,C-DR2 |
| ポイント利用有無 | 任意（チェック `pointpay`） | ポイント使用量登録 | — | C-05 |
| 利用ポイント数 | 任意（数値 `pointpay_num`） | 使用量として登録・合計再計算 | 数値（MSG-003・md:175）＋**最大長=11桁（D5確定フォーム・数値項目）** | C-05,C-14,**C-13**（境界値） |
| 要望欄 | 任意（メッセージ `message`） | `dtb_order.message`（ee length=4000） | **最大長=3000文字（D5確定フォーム・TextareaType）**。旧「フォーム種別依存＝要確認（md:204,206）」はD5=ee確定で解消 | C-04,**C-13**（境界値） |

- **最大長の具体値はD5=ee確定フォーム定義で確定（改訂7）**: 利用ポイント数=**11桁**（IntegerType＋数値制約＋Length）・要望欄（メッセージ）=**3000文字**
  （TextareaType＋Length min0/max3000）。設計md:206「フォーム種別と`constant.yml.dist`等の確認値を正とする」の要確認留保はD5=ee確定で解消。
  **境界値（最大長/最大長+1）で「追加/変更される・されない」を主張する母集合ケース（-025/-026/-037/-038）はC-13でbound化**（§4.1・§4.5）。
  **T2規律**: D5確定フォーム桁数/文字数は**境界値ケースの入力の構成にのみ用い、期待値（オラクル＝設計md/観点表の「追加/変更される・されない」）に流用しない**。
  `dtb_order.message`のDBカラム長=4000も期待値に流用しない（境界はフォーム層の3000で確定）。

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。**T2ルーティング**により期待値は設計md由来。ee参照は「（ee照合: file:line）」
＝**セレクタ源/観測対象特定/ルート存在確認のみ**（L1出典にしない）。

### §4.1 母集合対応・bound成功（**分類＝隔離条件下で外部実応答なしに観測可能／実装・実走は全ケース未了＝候補グレード**。17 C-ID・49母集合行。改訂7でC-13〔D5確定フォーム境界値〕・C-17〔MSG-001確定リテラル〕を新設しTBD 7件を解消）

> **「bound成功」の意味**: 本ラベルは**分類**であり「今すぐ走る」の意ではない。本md全体が実装/実走なし（候補グレード・§0）。
> bound成功＝**外部決済代行の実応答を要さず、隔離DB＋seed＋S0復元と（C-08のみ追加で共有隔離ハーネス）の下で自社DB/画面/session/Cookieに観測可能**という分類。
> 全boundケースは共通インフラ（db.ts配線・seed投入・§2ハーネス）に依存し、それらは**D5確定＝配備済み前提**（改訂7で「未整備/実走不可/@TBD(ハーネス)」の留保は撤回）。
> C-08は**要実機ではない**（外部送達は§2ハーネスでstubし合格アサーションは自社DBの受注確定で完結＝カート空/ポイント反映/完了画面遷移はF04-04委譲で本ケース非対象）。
> 共有ハーネス依存を持つ点は各所（§2/§4.1 C-08/§7/§9#0）で明示する（別バケットは作らない＝db.ts配線等と同クラスの共有インフラ依存のため）。

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 対応母集合 |
|---|---|---|---|---|
| C-01 | ご注文方法指定表示・受注情報作成/取得 | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123到達。表示も破壊系＝S0復元） | ロック済みカートから受注情報を作成または取得しご注文方法指定画面を表示。処理中`dtb_order`が作成/取得される `[L1:001,018]`（ee照合: initializeOrder ShoppingController.php:146・flush:151） | -003,-043（直接）／-029（読替・注1） |
| C-02 | 表示要素（入力フォーム含む） | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123到達。表示も破壊系＝S0復元） | お届け先情報・お届け先一覧・配送業者・配送日時・お支払い方法・ポイント利用・要望欄・商品明細・小計/送料/手数料/割引/合計(税込)/消費税相当を表示 `[L1:008]`（ee照合: index.twig） | -008（直接）／-035,-048（読替・注2） |
| C-03 | 合計ラベル・合計構成 | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123到達・ja／enロケール両方。表示も破壊系＝S0復元） | 合計(税込)を表示。**英語ロケールでは「Order Total (tax incl.)」（設計md:156＝オラクル確定）**。合計＝小計＋送料＋手数料−割引、税相当額を別算出して表示 `[L1:009,010]`（ee照合: ja `front.cart.total_label` ja.yaml:1331・paymentTotal index.twig:506。en観測はindex.en.twig不在で現EE未描画の可能性＝観測ギャップだが期待値は設計md確定） | -059（直接）／-051（読替） |
| C-04 | 受注/配送/要望欄のDB反映（データ意味論＝業務ルール/入力項目・エンドポイント非依存） | **購入フロー駆動**（§2標準形＝SEED-F0402-ORDER-PROCESSING投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291,389）で支払/要望欄/お届け先を反映しDBアサーション。破壊系S0復元（**駆動＝EE実フロー〔index/redirect_to/confirmのexecutePurchaseFlow〕を照合補助として利用。期待値は業務ルール/入力項目〔md:189,201,204,255〕由来でエンドポイント表記非依存**） | 支払方法・手数料は`dtb_order`、要望欄は`dtb_order.message`、お届け先は`dtb_shipping`へ反映。無効支払は未設定・手数料0 `[L1:012,017,021]`（ee照合: Order.php:467 message・dtb_shipping） | -012,-062,-065（読替・要望欄/お届け先反映）／-027,-036,-039,-040（読替・注3 IT-26テンプレ→具体反映） |
| C-05 | ポイント使用量登録・合計再計算（データ意味論＝業務ルール/入力項目・エンドポイント非依存） | **購入フロー駆動**（§2標準形＝SEED-F0402-POINT投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291,389）でポイント利用指定を送信しDBアサーション。破壊系S0復元（**駆動＝EE実フローを照合補助として利用。期待値は業務ルール〔md:188,203〕/入力項目〔md:110〕由来でエンドポイント表記非依存**） | ポイント利用ありなら入力数、なしなら0を使用量として登録し合計を再計算 `[L1:011]`（ee照合: use_point・executePurchaseFlow合計再計算） | -060（直接）／-001,-022,-034,-041,-063,-064（読替・注4） |
| C-06 | セッション/識別子（受注ID・プレオーダーID・お届け先ID）の保存/参照 | **購入フロー駆動**（§2標準形＝SEED-F0402-ORDER-PROCESSING投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291,389）でセッション/識別子アサーション。破壊系S0復元（**対応母集合IDの期待テキストは識別子値/session変更＝Cookie固有を主張しない**） | 受注IDをセッションへ保存し各部分送信・確認で参照。プレオーダーID（Cart=session格納）・お届け先ID（session）を保持し次回参照 `[L1:019,020]`（ee照合: SESSION_ORDER_ID OrderHelper.php:68・getPreOrderId CartService.php:428・customer_address_id session OrderHelper.php:80／ShoppingController.php:1172。**設計mdの「Cookie保存」チャネルは現EEでsession/Cart＝BC-DRAFT⑦のドリフト。本ケースはsession/Cart観測でboundとしCookie固有は主張しない**） | -002,-032,-042（読替・注5） |
| C-07 | お届け先選択（POST /shopping/shipping/{id}） | **購入フロー駆動**（§2標準形＝SEED-F0402-MEMBER-ADDRESS投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/shipping/{id}:712でお届け先を選択送信）。破壊系S0復元 | 選択したお届け先を配送先（`dtb_shipping`）へ反映し配送料/合計を再計算してご注文方法指定画面へ戻る `[L1:004,014]`（ee照合: shipping ShoppingController.php:748 setFromCustomerAddress・:751再計算・:774 redirect shopping） | -049（直接）／-024（読替・お届け先反映） |
| C-08 | 確認・注文確定（POST /shopping/confirm→purchase） | **購入フロー駆動**（§2標準形＝SEED-F0402-ORDER-PROCESSING〔通常決済〕投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291,389＝同一リクエストで内部checkout():389で受注確定・SESSION_ORDER_ID:565）。破壊系S0復元。**共有隔離ハーネス前提（D5確定＝配備済み前提）** | 入力を検証し購入処理を開始して受注を確定する `[L1:006]`（母集合-006/-046の期待テキストのうちF04-02スコープ＝設計md:67 confirm入口・処理フローの入力検証〜受注確定部分）（ee照合: confirm→checkout ShoppingController.php:389）。**スコープ境界（codex正当・コーディネータ裁定でR3是正）**: 本ケースのアサーションは**入力検証（フォーム妥当性・支払方法一致）・購入処理開始・受注確定（処理中→確定ステータスの`dtb_order`）まで**に限定する。**確定後処理〔ポイント反映（`dtb_customer.point`残高/使用量の最終反映）・メール実送達・タグログ（`dtb_order_item_tag_sales_analysis`）/スマレジ外部送信・購入完了画面（内容・遷移）・在庫引当〕の期待はF04-04正本へ委譲〔md:27-36で本書対象外と明示〕**し、本ケースの合格条件に含めない（§2ハーネスで確定時付随外部送信を遮断・タグログ等はS0復元対象）。母集合-006/-046期待テキストの「ポイントを使用して購入完了画面へ遷移」部分はF04-04スコープであり本ケースでは検証しない | -006,-046（直接寄り）／-011,-050（読替・注6） |
| C-09 | 注文エラー画面（機能的挙動＝異常契機からの案内。**URL契約は含まない**） | **直GET維持（直アクセス自体が試験）**: 受注情報なし＝session未確立で`GET /{_locale}/shopping`（または確認）へ直アクセスし注文エラー画面への遷移をたどる（機能的挙動のみ検証）。破壊系S0復元 | 受注情報が無いなどの異常を案内する注文エラー画面を表示 `[L1:007]`（**機能的挙動のみ**＝異常時にエラー画面へ遷移し異常を案内する挙動＝設計md:68,319。ee照合: 遷移先ルート`shopping_error`＝ShoppingController.php:156,1042 shopping_error.twig＝照合補助の駆動路。**設計指定パス`/shopping/shopping_error`のURL契約検証はC-DR6（EEドリフト・失敗期待）へ分離。本ケースはEEルート`/shopping/error`を駆動に用いるが設計指定パスの代替にはしない**〔codex正当・コーディネータ裁定〕） | -047（読替） |
| C-10 | エラー遷移（合計マイナス・支払不一致） | **購入フロー駆動**（§2標準形＝SEED-F0402-NEGATIVE-TOTAL／SEED-F0402-PAYMENT-MISMATCH投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→〔支払不一致は〕POST /shopping/confirm:291で該当操作）。破壊系S0復元 | 受注合計マイナス→注文エラーへ遷移。注文確定で支払方法が受注保持値と不一致→注文エラーへ遷移 `[L1:013,016]`（ee照合: 遷移先shopping_error） | -031（直接寄り・不一致）／-013,-067（読替・注7） |
| C-11 | 複数配送無効→買い物かごへ戻す | **購入フロー駆動**（§2標準形＝SEED-F0402-MULTI-SHIPPING投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123到達）。破壊系S0復元 | 配送先が複数で複数配送設定が無効なら買い物かごへ戻す `[L1:015]`（ee照合: ShippingMultipleController→cart戻し） | -023,-061（読替・注8） |
| C-12 | お届け先必須バリデーション（MSG-004確定リテラル含む） | **購入フロー駆動**（§2標準形＝SEED-F0402-MEMBER-ADDRESS投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→お届け先未選択のまま送信・ja/enロケール）。破壊系S0復元 | 必須（お届け先未選択）で対象処理が完了せず、お届け先が変更されず同画面/ご注文方法指定へ戻る。**MSG-004「お届け先を指定してください」/en「Please select a delivery address.」を表示（D5=ee翻訳確定・`front.shopping.shipping_unselected` ja.yaml:1530/en.yaml:1337・shipping.twig:44）** `[L1:004,023,025]`（改訂7でMSG-004リテラルを要ソース確認→D5確定へ解消） | -010（読替）／**-019（読替・MSG-004確定リテラル・改訂7でTBDから移動）** |
| C-14 | ポイント数値バリデーション | **購入フロー駆動**（§2標準形＝SEED-F0402-INVALID-POINT投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→ポイントに数字以外を入力し送信）。破壊系S0復元 | 使用ポイントに数字以外→対象処理が完了せず「数字で入力してください。」（MSG-003）を入力項目直下に表示しご注文方法指定画面に留まる `[L1:024]`（ee照合: 数値バリ。**キー帰属は§9 DOC-DRAFT①**） | -018（読替） |
| C-15 | 未ログイン/非会員未登録→ログイン誘導 | **直GET維持（直アクセス自体が試験）**: SEED-F0402-GUEST-NOLOGINで`GET /{_locale}/shopping`直アクセス（受注情報未作成＝破壊系なし） | 未ログインかつ非会員未登録→ログイン画面へ誘導する（受注情報は作成されない） `[L1:022]`（ee照合: isLoginRequired→shopping_login ShoppingController.php:128-131） | -028,-066（読替・注9） |
| C-16 | 表示で対象外レコード無変更（no-write） | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123到達）で表示前後の対象外テーブル差分をDBアサーション。破壊系S0復元 | 合計構成は表示計算でありレコード追加を伴わない（表示時に受注明細行を追加しない） `[L1:010,021]`（ee照合: 表示計算はflush対象の受注明細追加を伴わない） | -021（読替・注10） |
| **C-13**（改訂7新設・D5確定フォーム境界値） | フォーム最大長境界での登録/更新の有無（D5=ee確定フォーム桁数/文字数） | **購入フロー駆動**（§2標準形＝ポイント境界はSEED-F0402-POINT／要望欄境界はSEED-F0402-ORDER-PROCESSING投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→当該項目に境界値入力→POST /shopping/confirm:291,389）。破壊系S0復元 | **利用ポイント数**: 最大長（11桁）内の有効値→使用量として登録され合計再計算（追加される）／最大長+1（12桁）→登録なし（追加されない）。**要望欄（メッセージ）**: 最大長（3000文字）→受注メッセージ（`dtb_order.message`）へ保存され値が変更される／最大長+1（3001文字）→変更なし（変更されない） `[L1:011,017,021,023]`（**T2規律**: 期待値=設計md観点「追加/変更される・されない」。境界桁数/文字数はD5=ee確定フォーム定義の事実＝入力構成にのみ用い期待値に流用しない（**フォーム桁数/文字数制約という拒否メカニズムを期待結果に流用しない＝オラクル独立性**）。ee照合: 利用ポイント数Length max=11／メッセージLength min0 max3000＝Shopping/OrderType.php） | -025（読替・最大長・追加される）／-026（読替・最大長+1・追加されない）／-037（読替・最大長・変更される）／-038（読替・最大長+1・変更されない） |
| **C-17**（改訂7新設・MSG-001確定リテラル） | システムエラー案内（想定外例外→注文エラー画面・MSG-001確定リテラル） | **購入フロー駆動**（§2標準形＝SEED-F0402-ORDER-PROCESSING〔購入処理で想定外の例外を発生させる契機〕投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291,389で想定外例外・ja/enロケール）。破壊系S0復元。共有隔離ハーネス前提（D5確定＝配備済み前提） | 想定外例外→注文エラー画面へ遷移しシステムエラー案内文（MSG-001＝「購入処理で予期しないエラーが発生しました。恐れ入りますがお問い合わせページよりご連絡ください。」／en「Sorry, we have faced an unexpected error during the checkout process. Please contact us from the inquiry form. We are sorry for the inconvenience.」）を表示し対象処理が完了しない `[L1:025]`（D5=ee翻訳確定・`front.shopping.system_error` ja.yaml:1557/en.yaml:1371＝想定外例外catchでaddError＝ShoppingController.php:552-553→shopping_error。**キー名`front.shopping.system.error`〔ドット〕はEEドリフト=C-DR5で別扱い。本ケースはMSG-001フラッシュ文言リテラルの表示・挙動をbound**） | -016（読替・相関バリでエラー表示・完了しない）／-054（読替・MSG-001確定リテラル） |

**注0（エンドポイント要件とデータ意味論要件の分離＝会計の一次原則。codex R1 Blocker①への一次根拠反証）**:
設計md自身が**2層に分けて**規定する。①**エンドポイント層**（md:63-64,101-113「入口」表・処理フロー）＝部分送信を`/shopping/delivery`・`/shopping/payment`
へ送信し「結果を反映した同一画面へ**戻す**」ラウンドトリップ。②**データ意味論層**（md:186-206「業務ルール・計算」表＋「入力項目」表）＝
「ポイント利用ありなら入力数…登録し合計再計算」「無効な支払いは未設定・手数料0」「要望欄は受注のメッセージ（dtb_order）へ保存」等を、
**特定エンドポイントに紐付けず業務ルール/入力項目挙動として**規定。**母集合の期待テキスト（列10・§0判定原則で正）で極性判定**すると、
-001/-012/-022/-025/-027/-034/-036/-039/-040/-041/-060/-062/-063/-064/-065 の期待テキストは**いずれもデータ意味論**（「登録される/変更される/メッセージへ保存/使用量として登録」）
であり、**エンドポイントのラウンドトリップ（「〜して同画面へ戻る」）を含まない**。ラウンドトリップ文言（「反映し…**ご注文方法指定画面へ戻る**」）を
持つのは -004/-009/-044 のみで、これらは**エンドポイント層要件＝C-DR1/C-DR2で失敗期待（EEドリフト）**として別勘定済み。
よってC-04/C-05のデータ意味論IDは、**期待値＝設計md業務ルール/入力項目（md:186-206・エンドポイント非依存）**を正とし、
**観測駆動のみEE実フロー（index/redirect_to/confirmのexecutePurchaseFlow）を照合補助として利用**する（駆動機構はeeの許容照合補助＝セレクタ/操作源、
期待値は設計md）。これはオラクル汚染ではない（期待値は設計md、機構がee）。**逆にこれらを失敗期待（EEドリフト）へ移すと、EE実装で現に観測可能な
データ効果を「失敗する」と偽って主張する偽陰性**になる（本タスクが最重要警告する偽陰性の一種）。したがってR1 Blocker①は
**エンドポイント要件とデータ意味論要件の混同による誤指摘**と判断し、この論点ではデータ意味論IDのbound分類を維持する（R2の別是正で会計はbound成功43・EEドリフト8）。

**注1（読替・C-01）**: -029（前提=受注合計マイナス・exp「追加される」）は、合計マイナスでも入口で処理中受注は作成されてから注文エラーへ遷移する（md:93→97）ため受注情報作成の追加を観測。
（**codex R2 Blocker①是正**: 旧稿は-020〔前提=phantom F04-02-MSG-005〕もC-01へ読替えたが、同じphantom前提の-058をexcludedとする扱いと不整合。phantom前提の会計を統一するため**-020はexcludedへ移動**〔§4.6〕。）
**注2（読替・C-02）**: -035（前提=入力・exp「お届け先・配送業者・配送日時・お支払い方法・ポイント利用・要望欄のフォームであること」）は入力フォーム項目の表示（md:242）へ、-048（IT-06ロールバック・前提=表示要素・手動）は表示要素の表示（md:78）へ読替。
**注3（読替・C-04）**: -027（要望欄・最小長・追加される）＝メッセージ保存、-036（成功時出力・変更される）＝部分送信の受注更新、-039（登録/更新・最小長・変更される）＝受注更新、-040（お支払い方法・最小長-1・変更されない）＝無効支払→未設定（md:189,201）。IT-26テンプレの区分（追加/変更）を具体反映へ写像。
**（最小長側の境界確定可能性・codex R2 Major明確化）**: -027/-039は**最小長**（＝短い有効メッセージ・空/1文字で確定可）で、最大長要確認（md:206）は不適用＝TBDに落とさない。-040は支払方法が**選択**（数値長ではない）で「最小長-1」は無効選択に相当し、挙動「無効支払→未設定」は境界値に依存せず観測可能。-027の「追加」はIT-26の登録区分ラベルで、`dtb_order.message`は受注列の更新（新規行INSERTではない）＝「受注に要望欄値が保存される」の具体反映へ写像（区分ラベルの字義でなく反映有無で判定）。**EEの`message`カラム長やuse_point上限は期待値に採用しない（T2規律）**。
**注4（読替・C-05）**: -001（ポイント利用グロッサリ「保有ポイントを注文金額に充当する指定」）・-022（ポイント利用・追加される）・-034（合計再計算・変更される）・-041（ポイント利用・変更される）・-063（ポイント利用有無・使用量登録）・-064（利用ポイント数・使用量登録）はいずれもポイント使用量登録＋合計再計算（L1-011）へ写像。
（**codex R2 Major是正**: 旧稿は-025〔前提=ポイント利用有無・**最大長**〕もC-05へ読替えたが、最大長の具体値は設計md:206が要確認とし境界値を確定できない〔-026/-037/-038をTBDとする根拠と同一〕。整合のため**-025はTBDへ移動**〔§4.5〕。なお-027〔要望欄・**最小長**〕・-028〔**最小長-1**〕・-040〔**最小長-1**〕は最小長側＝空/無効で確定可〔最大長要確認は不適用〕かつ境界が観測挙動に非影響のためbound継続〔注3/注9/後述〕。）
**注5（読替・C-06）**: -002（プレオーダーIDグロッサリ「処理中の受注を識別する値」）＝preOrderID値（Cart=session格納）の観測、-032（受注とセッション・変更される）＝SESSION_ORDER_ID（session）、-042（プレオーダーID・変更される）＝preOrderID値。**3件とも期待テキストは識別子値/session変更でCookie固有を主張しない**ため、現EEのsession/Cart観測でbound（Cookie保存チャネル差＝BC-DRAFT⑦はドリフトとして別掲・本ケースの観測はsession/Cart）。
**注6（読替・C-08）**: -011（確認画面・必須バリ・エラー表示されず継続=負側）＝必須項目充足時に確認・注文へ継続、-050（確認画面・exp「最終送信はmode=confirm相当で到達し入力済みご注文方法指定画面が確認・注文の役割を兼ねる」）＝confirmの役割（md:81,124）。
**注7（読替・C-10）**: -013（合計・相関バリ・エラー表示され完了しない）＝合計マイナス→注文エラー（md:213）、-067（残高整合・受注合計マイナス・注文エラーへ遷移）＝同。
**注8（読替・C-11）**: -023（複数配送・exp「配送先が複数で複数配送設定が無効なら買い物かごへ戻す」）・-061（複数配送・同）＝複数配送無効→カート戻し（md:98,214）。
**注9（読替・C-15）**: -028（未ログインかつ非会員未登録・最小長-1・追加されない）＝ログイン誘導で受注未作成、-066（未ログインかつ非会員未登録・exp「ログイン画面へ誘導」）＝同（md:212,285）。
**注10（読替・C-16）**: -021（合計の構成・exp「登録内容の対象レコードが追加されない」）＝合計は表示計算で新規レコード追加なし（no-write観測）。
（**codex R2 Blocker②是正**: 旧稿は-033〔前提=お届け先選択・exp「更新内容の対象レコードの値が変更されない」〕もC-16のno-writeへ読替えたが、お届け先選択は`dtb_shipping`を更新し配送料・合計を再計算する〔md:65,120-122〕＝**対象レコードは現に変更される**ため、期待「変更されない」と極性が矛盾する。対象を「対象外レコード」へすり替える根拠がないため**-033はexcludedへ移動**〔§4.6・-030と同型の極性矛盾〕。C-16は-021の表示no-writeのみ残す。）

### §4.1d 母集合対応・bound(EEドリフト＝設計md正本だが現EEにルート/キーが無く現EEでは失敗期待。6 C-ID・9母集合行）

**ee実測**: 設計md（オラクル・pf HareruyaEc）が規定する①部分送信エンドポイント`/shopping/delivery`・`/shopping/payment`、
②`shipping_change`の「要望欄保存→お届け先設定一覧」挙動、③複数配送案内文キー`shopping.multiple.delivery`、
④システムエラー案内キー`front.shopping.system.error`（ドット）、⑤注文エラー画面の設計指定パス`/shopping/shopping_error`（現EEは`/shopping/error`のみ）は、**現EEにルート/キー/パスが見当たらない**（grep実測0件）。
反映データ効果（支払・要望・ポイントの受注反映・合計再計算）自体はee別ルート（index/confirm）に存在するため**ルート再編/挙動差ドリフト**
（f04-04の機能全欠落型ドリフトより軽度）。**断定は避ける**（未探索の間接経路の可能性は排除しない）が、**当該エンドポイント名/キーを
直接検証するテストは現EEで失敗期待**として bound成功と会計区別。テストは**設計md（正本）どおりに書き**ドリフト検出として機能。

| C-ID | 対象観点（設計md規定） | 前提/手順（設計md準拠） | 期待結果（設計md＝正本） | 現EEでの扱い（ee実測） | 対応母集合 |
|---|---|---|---|---|---|
| C-DR1 | 部分送信パターン（各エンドポイントへ送信し同画面へ戻す） | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123）で配送業者/支払/お届け先を各設計指定エンドポイントへ部分送信 | 配送業者・お支払い方法・お届け先の変更は同一画面のフォームを各エンドポイントへ送信し結果を反映した同画面へ戻す `[L1:002,003]` | **失敗期待**: `/shopping/delivery`・`/shopping/payment`がgrep0件。現EEは単一index.twigフォーム＋`/shopping/redirect_to`(:204)へ再編（ルート再編ドリフト）。お届け先のみ`/shopping/shipping/{id}`(:712)実在 | -009 |
| C-DR2 | お支払い方法・要望・ポイント変更（POST /shopping/payment） | **購入フロー駆動**（§2標準形＝SEED-F0402-CART-LOCKED投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123）で`POST /{_locale}/shopping/payment`（設計md正本）を送信 | 支払方法・要望欄・ポイント利用を受注へ反映し合計を再計算してご注文方法指定画面へ戻る `[L1:003]` | **失敗期待**: `/shopping/payment`ルート不在（404）。反映効果はindex/confirmのexecutePurchaseFlowに存在 | -004,-044 |
| C-DR3 | お届け先変更メッセージ送信（POST /shopping/shipping_change/{id}） | **購入フロー駆動**（§2標準形＝SEED-F0402-MEMBER-ADDRESS投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123）で`POST /{_locale}/shopping/shipping_change/{id}`（設計md正本）を送信 | 要望欄を保存しお届け先設定一覧へ遷移 `[L1:005]` | **失敗期待**: ルートは実在(:1085)だが現EE挙動=お届け先住所変更+合計再計算(:1119-1159)で「要望欄保存→お届け先設定一覧遷移」ではない（挙動差ドリフト） | -005,-045 |
| C-DR4 | 複数配送案内文（キー） | **購入フロー駆動**（§2標準形＝SEED-F0402-MULTI-SHIPPING〔複数配送有効〕投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123）で配送先複数・複数配送有効時の案内表示 | 複数配送の案内文（キー`shopping.multiple.delivery`）を画面上部に一度だけ表示 `[L1:015]` | **失敗期待**: キー`shopping.multiple.delivery`がgrep0件。案内文言を現EEで観測不能（買い物かご戻し自体はC-11でbound） | -014,-052 |
| C-DR5 | システムエラー案内文（キー） | **購入フロー駆動**（§2標準形＝SEED-F0402-ORDER-PROCESSING投入→GET /cart:80→購入手続きへ→GET /{_locale}/shopping:123→POST /shopping/confirm:291で購入処理・想定外例外を発生）→注文エラー画面に案内 | システムエラーの案内文（キー`front.shopping.system.error`）を注文エラー画面に表示 `[L1:025]` | **失敗期待**: ドットキー`front.shopping.system.error`がリテラル不在。現EEは`front.shopping.system_error`（アンダースコア=ja.yaml:1557）で案内＝キー名相違（§9 DOC-DRAFT①も参照） | -053 |
| C-DR6 | 注文エラー画面のURL契約（設計指定パス） | **直GET維持（URL契約試験そのもの）**: 設計md指定 `GET /{_locale}/shopping/shopping_error` を**設計指定パスのまま**駆動 | 設計指定パス`/shopping/shopping_error`で注文エラー画面（受注情報が無いなどの異常を案内）を表示 `[L1:007]`（URL契約層。C-09の機能的挙動とは別ケース） | **失敗期待**: 設計指定パス`/shopping/shopping_error`が現EEに不在（現EEは`/shopping/error`=name`shopping_error`・ShoppingController.php:1042のみ・全内部redirectも`redirectToRoute('shopping_error')`=`/shopping/error`）。設計パスGETは404＝現EEでは失敗期待（URL契約ドリフト＝§9 DOC-DRAFT②の検証ケース。**codex正当・コーディネータ裁定で分離**）。テストは設計md（正本）通りに設計指定パスで書きドリフト検出として機能 | -007 |

### §4.2 母集合対応・partial

該当なし（本機能は完了処理の外部送達をスコープ外〔md:32〕とするため、1行内に自社DB観測部分と外部送達部分を混在する母集合行が無い）。

### §4.3 母集合対応・要実機

**該当なし（0件）**。本機能スコープは注文方法指定（入力・確認・確定=**入力検証・購入処理開始・受注確定**まで）。真の外部送達（注文完了/アラートメール・
購入完了タグログ・スマレジ外部POS）に加え**ポイント反映・購入完了画面（内容・遷移）・在庫引当**は**注文確定後の購入完了処理＝F04-04スコープ**（md:27-36,32で明示除外）。確定（C-08）の購入処理も
通常決済（非SPLINKS）seedで**自社DBの受注確定（処理中→確定ステータスの`dtb_order`）**を観測でき、**破壊的という理由だけで
要実機に逃がさない**（隔離ハーネスで確定時の付随外部送信を遮断し、C-08の合格アサーションは受注確定＝自社DBで完結）。**カート空・ポイント使用・完了画面遷移はC-08の観測/合格対象ではなくF04-04委譲**（うちカート空/ポイント使用等の確定副作用はS0復元対象＝§2）。SPLINKS決済代行の
実応答が必要な end-to-end は§9インフラ表#4（partial外部枝が無いため本機能では非必須）。

### §4.5 母集合対応・TBD（改訂7でD5確定前提により全件解消＝0母集合行）

**改訂7でTBD 7件（-016/-019/-025/-026/-037/-038/-054）を解消**。従来は設計md:206「最大長の具体値はフォーム種別/`constant.yml.dist`等の
確認値を正とする」＝要確認、および設計md:178「MSG-001/002/004は決済モジュール/例外が返す文字列で固定リテラルが実ソースに存在せず`要ソース確認`」を
「上限/リテラル未確定＝非アサーション」としてTBD留保していた。**D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱う前提**で、
ee実フォーム定義・翻訳資源により裏取りして解消し**§4.1（C-13/C-17/C-12）のboundへ移動**した（会計: TBD 7→0・bound読替 36→43）。
**母集合の期待テキストの原義は不変**（「要確認」を"D5で確定した値の検証"へ具体化しただけ）。

| test_id | 旧期待テキスト要旨 | D5確定前提での裏取り（ee実フォーム/翻訳） | 解消先/区分 |
|---|---|---|---|
| -025 | 登録内容の対象レコードが追加される（前提=ポイント利用有無・**最大長**） | 利用ポイント数フォーム最大長=**11桁**（IntegerType＋数値制約＋Length max=11＝Shopping/OrderType.php）。最大長内の有効値→使用量として登録（追加される）。桁数は入力構成にのみ用い期待値に流用しない（T2規律） | **C-13・bound**（境界値・追加される） |
| -026 | 登録内容の対象レコードが追加されない（前提=利用ポイント数・最大長+1） | 同上。最大長+1（12桁）→登録なし（追加されない）＝母集合原義。桁数はD5確定フォームの事実で境界値入力の構成にのみ用い、拒否メカニズム（桁数制約）は期待結果に流用しない（T2規律・オラクル独立性） | **C-13・bound**（境界値・追加されない） |
| -037 | 更新内容の対象レコードの値が変更される（前提=失敗時出力・最大長） | 要望欄（メッセージ）フォーム最大長=**3000文字**（TextareaType＋Length min0/max3000）。最大長→受注メッセージ（`dtb_order.message`）へ保存され変更される。DBカラム長4000は期待値に流用しない（T2規律） | **C-13・bound**（境界値・変更される） |
| -038 | 更新内容の対象レコードの値が変更されない（前提=副作用・最大長+1） | 同上。最大長+1（3001文字）→変更なし（変更されない）＝母集合原義。文字数はD5確定フォームの事実で境界値入力の構成にのみ用い、拒否メカニズム（文字数制約）は期待結果に流用しない（T2規律・オラクル独立性） | **C-13・bound**（境界値・変更されない） |
| -019 | F04-02-MSG-004＝要ソース確認であること | MSG-004=「お届け先を指定してください」/en「Please select a delivery address.」=`front.shopping.shipping_unselected`（ja.yaml:1530/en.yaml:1337・shipping.twig:44）が**確定リテラルとして実在**。お届け先未選択案内はC-12の観測対象 | **C-12・bound**（MSG-004確定リテラル） |
| -016 | 相関バリでエラー表示・完了しない（前提=F04-02-MSG-001） | MSG-001=「購入処理で予期しないエラー…」=`front.shopping.system_error`（ja.yaml:1557/en.yaml:1371）が確定リテラルとして実在。想定外例外catchでaddError→shopping_error（ShoppingController.php:552-553）＝発生契機・遷移・完了阻止が観測可 | **C-17・bound**（想定外例外→注文エラー・完了しない） |
| -054 | F04-02-MSG-001＝要ソース確認であること | 同上（MSG-001確定リテラル＝`front.shopping.system_error` ja.yaml:1557/en.yaml:1371） | **C-17・bound**（MSG-001確定リテラル） |

**過剰解消でないことの担保**: 4件（-025/-026/-037/-038）はD5=ee確定フォームの**桁数/文字数の事実**を境界値入力の構成にのみ用い、**期待値（オラクル）は設計md/観点表の「追加/変更される・されない」を維持**（Form制約を期待値に流用しない＝T2規律）。3件（-016/-019/-054）は設計md:173-176が既に文言を規定しており、D5=ee翻訳でその**確定リテラルの実在**（ja/en）を裏取りしたもので、設計md（オラクル）値と逐語一致。**ドット表記キー`front.shopping.system.error`はee不在＝C-DR5のEEドリフト（キー名契約層・失敗期待）として別に維持**し、本解消は「フラッシュ文言リテラル/挙動」層に限定（層の峻別）。

### §4.6 母集合対応・excluded（9母集合行・per-ID実引き・過剰除外禁止）

| test_id | 期待テキスト要旨（前提列） | 除外理由（一次資料実引き） |
|---|---|---|
| -020 | 登録内容の対象レコードが追加される（前提=**phantom F04-02-MSG-005**） | **F04-02-MSG-005は設計md未定義（phantom・定義はMSG-001〜004のみ・md:171-176）**。前提が実在しない。**codex R2 Blocker①是正**: 同じphantom前提の-058をexcludedとする扱いと統一し、phantom前提IDは期待テキストの写像可否に依らず一律excludedへ（会計の一貫性）。受注情報作成挙動自体はC-01（-003,-043,-029）でbound済＝偽陰性なし |
| -033 | 更新内容の対象レコードの値が変更されない（前提=お届け先選択） | お届け先選択は`dtb_shipping`を更新し配送料・合計を再計算する（md:65,120-122）＝**対象レコードは現に変更される**ため期待「変更されない」と極性が矛盾（-030と同型）。**codex R2 Blocker②是正**でC-16 no-write読替から移動。お届け先選択の更新挙動はC-07でbound済＝偽陰性なし |
| -015 | 相関バリでエラー表示されず継続（前提=システムエラーの案内文） | システムエラー案内文＝購入処理の想定外例外path（md:165,322）。「エラー表示されず継続」（負側）は、エラー専用要素を前提にしながら継続を主張し**整合referentなし**。想定外例外→注文エラー遷移はC-DR5/C-10で扱う |
| -017 | DB相関でエラー表示されず継続（前提=F04-02-MSG-002） | MSG-002＝購入処理中の注文情報を取得できないとき→購入エラー画面（md:174）。前提（取得不可＝エラー発生条件）と期待（エラー表示されず継続）が**矛盾**。取得不可→エラー遷移はee `getPurchaseProcessingOrder` null→shopping_error(:313-316)で観測可だが本行の極性は継続で不整合 |
| -030 | 実行結果の対象レコードが追加される（前提=お届け先未選択でお届け先選択を送信） | 設計md:118,215「お届け先未選択→ご注文方法指定へ戻す」＝反映せず。前提（未選択送信）と期待（追加される）が**矛盾**。未選択→戻る挙動はC-12でbound |
| -055 | 画面表示データでエラー表示されず継続（前提=F04-02-MSG-002） | -017同様。MSG-002エラー条件前提＋継続主張で矛盾 |
| -056 | 購入エラー画面に遷移すること（前提=F04-02-MSG-003） | 設計md:175「MSG-003（数字で入力してください）の後続処理＝**ご注文方法指定画面に留まる**」。前提=MSG-003なのに期待=購入エラー画面遷移で**矛盾**。MSG-003挙動はC-14でbound |
| -057 | 画面表示データでエラー表示されず継続（前提=F04-02-MSG-004） | MSG-004＝お届け先を指定してください（お届け先未選択エラー）。エラー要素前提＋「エラー表示されず継続」で整合referentなし。お届け先必須挙動はC-12でbound |
| -058 | 購入エラー画面に遷移すること（前提=F04-02-MSG-005） | **F04-02-MSG-005は設計mdに存在しない（phantom。定義はMSG-001〜004のみ・md:171-176）**。前提が実在せず期待の設計md referentなし。generic遷移テンプレで具体挙動に結びつかない |

**過剰除外でないことの傍証**: excluded 9件はいずれも(a)前提と期待の極性矛盾（-015,-017,-030,-033,-055,-056,-057）／(b)phantom MSG-005（-020,-058）。
各前提が指す実在挙動（システムエラー/受注情報取得不可/お届け先未選択・お届け先選択更新/ポイント数値/合計/受注情報作成）は他候補
（C-DR5/C-10/C-12/C-07/C-14/C-01）でbound化済み＝**偽陰性なし**（excludedは「観測対象なし/極性矛盾」であって、実在挙動を捨てていない）。
**phantom MSG-005前提（-020,-058）は期待テキストの写像可否に依らず一律excludedへ統一**（codex R2 Blocker①是正。旧稿の-020=bound／-058=excludedの分割は前提不在の扱いが不整合だったため撤回）。

---

## §5 locale対応表・翻訳キー実在確認（実装照合補助・英語仕様の正としない）

**LS=1は C-03（合計ラベル）・C-14（MSG-003）・C-12（MSG-004・改訂7）・C-17（MSG-001・改訂7）**。ee翻訳資源（照合補助＝L1/英語仕様出典にしない）での実在確認:

| 対象 | ja翻訳キー / 実在行 | ja値（ee） | en / 実在行 | en値（ee） | 備考 |
|---|---|---|---|---|---|
| 合計ラベル | `front.cart.total_label`／ja.yaml:1331 | 合計(税込) | `front.cart.total_label`／en.yaml:1128（コア値） | Total (tax incl.) | **en期待値=Order Total (tax incl.)（設計md:156＝オラクル確定）**。**D5確定（改訂7）で英語ラベルは移行先で描画される前提**（旧「index.en.twig不在＝観測ギャップ@TBD-D5」の留保は撤回）。eeコアキーのen値「Total (tax incl.)」はオラクル値と差異＝DOC/BC観測（照合補助・断定回避）。期待値は設計md確定 |
| MSG-001（改訂7・確定リテラル） | `front.shopping.system_error`／ja.yaml:1557 | 購入処理で予期しないエラーが発生しました。恐れ入りますがお問い合わせページよりご連絡ください。 | `front.shopping.system_error`／en.yaml:1371 | Sorry, we have faced an unexpected error during the checkout process. Please contact us from the inquiry form. We are sorry for the inconvenience. | **D5=ee確定**: MSG-001（md:173）の確定リテラルがja/enで実在（想定外例外catch→addError＝ShoppingController.php:552-553→shopping_error）。C-17でbound。設計md（オラクル）値と逐語一致 |
| MSG-004（改訂7・確定リテラル） | `front.shopping.shipping_unselected`／ja.yaml:1530 | お届け先を指定してください | `front.shopping.shipping_unselected`／en.yaml:1337 | Please select a delivery address. | **D5=ee確定**: MSG-004（md:176）の確定リテラルがja/enで実在（shipping.twig:44）。C-12でbound。設計md（オラクル）値と逐語一致 |
| MSG-002（参考・改訂7） | `front.shopping.order_error`／ja.yaml:1556 | 購入処理でエラーが発生しました。 | `front.shopping.order_error`／en.yaml:1370 | An error occurred during the checkout process. | **D5=ee確定**: MSG-002（md:174）の確定リテラルも実在（対応母集合-017/-055は極性矛盾でexcluded＝会計変化なし。参考記録） |
| MSG-003 | 設計md:178は`front.shopping.system_error`と記す | （同キーja値=「購入処理で予期しないエラー…」＝**MSG-001文言**） | `front.shopping.system_error`／en.yaml:1371 | Sorry, we have faced an unexpected error… | **§9 DOC-DRAFT①**: 設計mdのキー帰属が誤り。MSG-003文言「数字で入力してください。」は当該キー値でない（C-14はMSG-003挙動をbound。数値制約メッセージは`form_error.numeric_only`＝Shopping/OrderType.php） |
| エラーキー群（ドット表記・EEドリフト維持） | `front.shopping.error.no_order`／`shopping.multiple.delivery`／`shopping.total.price`／`front.shopping.system.error`（ドット） | **いずれも不在**（grep実測0件） | 同 | **不在** | **§9 DOC-DRAFT②/③**: pf現行（HareruyaEc/コア日本語のみ）キー。ee未移行＝当該**キー名**は現EEで観測不能（C-DR4/C-DR5のEEドリフト一次根拠）。**改訂7のMSG確定はアンダースコア/別綴りの実在キーの文言リテラル層で、ドット表記キー名契約層のドリフトとは別（層の峻別）** |

- **T2規律**: 翻訳キー実在の記録は実装照合補助として残すが、**eeの訳値を英語「仕様」の根拠にしない**。合計ラベルの英語は設計md:156が明示＝オラクル確定（Order Total (tax incl.)）。MSG-001/004の確定リテラルは設計md:173-176（オラクル）が既に規定しており、D5=ee翻訳でその実在（逐語一致）を裏取りしただけ＝オラクル汚染ではない。**改訂7で英語ラベル/MSG確定リテラルの`@TBD-D5`留保はD5確定＝配備済み前提で解消**。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- request契約: 表示=GET `/{_locale}/shopping`（**破壊系＝処理中受注作成**）。部分送信=設計md `/shopping/delivery`・`/shopping/payment`
  （現EE不在＝C-DR1/C-DR2）／`/shopping/shipping/{id}`（実在＝C-07）／`/shopping/shipping_change/{id}`（実在・挙動差＝C-DR3）。
  確認=`POST /shopping/confirm`→`checkout()`。エラー画面=**異常契機（受注情報なし/合計マイナス/支払不一致）を成立させ遷移をたどって到達**（設計mdパス`/shopping/shopping_error`／EEルート`shopping_error`=`/shopping/error`。パス綴り差はDOC-DRAFT②・直接GETせず遷移で観測しオラクル汚染回避）。
  **確認・注文確定（C-08/C-17）は§2の共有隔離ハーネス（Mailer null／Messenger in-memory+worker非起動／UniSearch no-op／起動時外部非到達
  アサート）で確定時の付随外部送信を遮断した上で行う。当該ハーネスはD5確定＝配備済み前提（改訂7で「未整備/実走不可」の留保は撤回）**。
  期待値は`o("L1-F0402-xxx")`（L1解決器）経由・リテラル直書き禁止。
- db.ts（`e2e/helpers/db.ts`）: `dtb_order`（message含む）／`dtb_shipping`／`dtb_order_item`／`dtb_customer_address`／`dtb_customer.point`／
  `plg_sln_order_payment_*`のS0取得・アサーション・raw SQL復元の専用便宜関数は、**S0の対象・順序・SQL骨子を§2で特定済み＝実配線もD5確定＝配備済み前提**。
- 破壊系afterEach（表示ケース含む全bound）: §2のS0対象・FK順序・復元SQLに従いraw SQLで復元。**GET `/shopping`も処理中受注を作成する
  ため表示ケースもafterEach復元が必須**（f04-04のcomplete読取専用とは異なる本機能固有の注意点）。
- **オラクル独立性（T2規律）**: 期待値はすべて設計md（§1 L1）由来。eeのフォーム定義・実装値（`dtb_order.message`長4000等）・翻訳訳語・
  実装詳細（ルート再編）はセレクタ源／観測対象特定／ルート存在確認にのみ用い、期待値の根拠にしない。フォーム最大長を期待値へ流用しない。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01,C-02,C-03,C-15,C-16 | Playwright/request+db.ts（表示も破壊系・afterEach必須） | GUI/HTTP+DB | 表示要素・合計・受注情報作成・ログイン誘導・no-write |
| C-04,C-05,C-06,C-07 | request/Playwright+db.ts（破壊系・afterEach必須） | HTTP+DB+session/Cookie | 受注/配送/要望欄反映・ポイント・セッション/Cookie・お届け先選択 |
| C-08 | Playwright/request+db.ts（確認→確定・**共有隔離ハーネス前提**） | GUI/HTTP+DB | **合格アサーション＝入力検証・購入処理開始・受注確定（処理中→確定ステータスの`dtb_order`）まで**（C-08セル:197と整合）。**カート空・ポイント反映・購入完了画面遷移はF04-04委譲＝本ケースの観測/合格対象にしない**（うちカート空/ポイント使用/タグログ等の確定副作用はS0復元対象＝§2）。外部送信は§2遮断 |
| C-09,C-10,C-12,C-14 | Playwright | GUI | 注文エラー画面・エラー遷移・お届け先必須（MSG-004確定リテラル含む）・ポイント数値バリ |
| C-11 | Playwright | GUI | 複数配送無効→カート戻し |
| **C-13**（改訂7新設） | Playwright+db.ts（境界値入力＋DB確認・破壊系afterEach必須） | GUI+DB | D5確定フォーム桁数/文字数の境界値bound（-025/-026=利用ポイント数11桁／-037/-038=要望欄3000文字）。期待値=設計md観点、桁数/文字数はD5確定事実で入力構成のみ |
| **C-17**（改訂7新設） | Playwright+db.ts（想定外例外→注文エラー・**共有隔離ハーネス前提〔D5確定〕**） | GUI+DB | MSG-001確定リテラル（想定外例外→注文エラー画面・完了しない・-016/-054）。確定時付随外部送信は§2遮断 |
| C-DR1〜C-DR6 | **bound(EEドリフト)＝現EEでは失敗期待** | GUI/HTTP+DB | 設計md正本でテストを書くが現EEにルート/キー/パスなし/挙動差（§4.1d）。ドリフト検出。bound成功と別勘定 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（67 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功（直接一致）** | **6** | 期待テキストが具体挙動の逐語/明確な言い換えで、現EEでseed→自社DB/画面/session/Cookie観測可能（破壊系はS0復元・確定の外部送信は§2遮断） |
| **bound成功（読み替え）** | **43** | グロッサリ/タウトロジー/否定側テンプレ/IT-26テンプレを具体挙動へ写像。現EEで観測可能。**改訂7でTBD 7件（-016/-019/-025/-026/-037/-038/-054）をD5裏取り解消しC-13/C-17/C-12へ+7** |
| **EEドリフト（失敗期待・成功boundと別勘定）** | **9** | 設計md（正本）が規定するが現EEにルート/キー/パス/挙動が見当たらず**現EEでは失敗期待**（C-DR1〜C-DR6・§4.1d）。テストは設計md通りに書きドリフト検出として機能。**「bound成功」の49件には合算しない**（成功観測可のboundと会計上・見出し上で峻別） |
| **partial** | **0** | 完了処理の外部送達をスコープ外（md:32）とするため混在行なし |
| **要実機** | **0** | 真の外部送達は購入完了処理＝F04-04スコープ。確定の購入処理は通常決済seedで自社DB観測可＝要実機に逃がさない |
| **TBD** | **0** | **改訂7で全件解消**（旧7件=-016/-019/-025/-026/-037/-038/-054はD5確定前提でee実フォーム/翻訳裏取りしC-13/C-17/C-12 boundへ移動・§4.5） |
| **excluded** | **9** | 前提と期待の極性矛盾／phantom MSG-005（-020/-058）（per-ID実引き・§4.6） |
| 合計 | **67** | 欠落0・理由なし重複0 |

6+43+9+0+0+9=67（差分0）。

### 会計内訳（機械実証・再現用）

- bound成功直接（6）: 003,006,008,049,059,060
- bound成功読替（43）: 001,002,010,011,012,013,016,018,019,021,022,023,024,025,026,027,028,029,031,032,034,035,036,037,038,039,040,041,042,043,046,047,048,050,051,054,061,062,063,064,065,066,067
- bound(EEドリフト)（9）: 004,005,007,009,014,044,045,052,053
- TBD（0）: なし（改訂7で全件解消）
- excluded（9）: 015,017,020,030,033,055,056,057,058
- 6+43+9+0+0+9=67・差分0（001..067連番を全被覆・重複なし）

### 67対応表（No→会計→候補）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | 保有ポイントを注文金額に充当する指定（ポイント利用グロッサリ） | bound(読替) | C-05 |
| 002 | 処理中の受注を識別する値（プレオーダーIDグロッサリ） | bound(読替) | C-06 |
| 003 | ロック済みカートから受注情報作成/取得しご注文方法指定画面表示 | bound(直接) | C-01 |
| 004 | 支払方法・要望欄・ポイントを受注へ反映し合計再計算して同画面へ戻る（/shopping/payment） | bound(EEドリフト) | C-DR2 |
| 005 | 要望欄を保存しお届け先設定一覧へ遷移（/shopping/shipping_change） | bound(EEドリフト) | C-DR3 |
| 006 | 入力検証・購入処理・受注確定・購入完了画面へ遷移 | bound(直接) | C-08 |
| 007 | 受注情報が無いなどの異常を案内（注文エラー画面・設計指定パス`/shopping/shopping_error`のURL契約層） | bound(EEドリフト) | C-DR6 |
| 008 | 表示要素一式を表示 | bound(直接) | C-02 |
| 009 | 各エンドポイントへ部分送信し結果反映した同画面へ戻す | bound(EEドリフト) | C-DR1 |
| 010 | 必須バリでエラー表示され完了しない（前提=お届け先選択） | bound(読替) | C-12 |
| 011 | 必須バリでエラー表示されず継続（前提=確認画面） | bound(読替) | C-08 |
| 012 | 要望欄はメッセージ欄として受注へ保存 | bound(読替) | C-04 |
| 013 | 相関バリでエラー表示され完了しない（前提=合計＝合計マイナス） | bound(読替) | C-10 |
| 014 | 相関バリでエラー表示されず継続（前提=複数配送の案内文） | bound(EEドリフト) | C-DR4 |
| 015 | 相関バリでエラー表示されず継続（前提=システムエラーの案内文） | excluded | — |
| 016 | 相関バリでエラー表示・完了しない（前提=MSG-001） | bound(読替) | C-17 |
| 017 | DB相関でエラー表示されず継続（前提=MSG-002） | excluded | — |
| 018 | DB相関でエラー表示・完了しない（前提=MSG-003＝数字で入力） | bound(読替) | C-14 |
| 019 | F04-02-MSG-004＝要ソース確認（D5=ee翻訳確定＝お届け先を指定してください） | bound(読替) | C-12 |
| 020 | 登録内容の対象レコードが追加される（前提=phantom MSG-005） | excluded | — |
| 021 | 登録内容の対象レコードが追加されない（前提=合計の構成） | bound(読替) | C-16 |
| 022 | 登録内容の対象レコードが追加される（前提=ポイント利用） | bound(読替) | C-05 |
| 023 | 配送先複数で複数配送無効なら買い物かごへ戻す（前提=複数配送） | bound(読替) | C-11 |
| 024 | 登録内容の対象レコードが追加される（前提=お届け先） | bound(読替) | C-07 |
| 025 | 登録内容の対象レコードが追加される（前提=ポイント利用有無・最大長＝D5確定11桁） | bound(読替) | C-13 |
| 026 | 登録内容の対象レコードが追加されない（前提=利用ポイント数・最大長+1＝D5確定12桁超過） | bound(読替) | C-13 |
| 027 | 登録内容の対象レコードが追加される（前提=要望欄・最小長） | bound(読替) | C-04 |
| 028 | 登録内容の対象レコードが追加されない（前提=未ログイン非会員・最小長-1） | bound(読替) | C-15 |
| 029 | 登録内容の対象レコードが追加される（前提=受注合計マイナス） | bound(読替) | C-01 |
| 030 | 実行結果の対象レコードが追加される（前提=お届け先未選択送信） | excluded | — |
| 031 | 注文エラーへ遷移（前提=支払方法が受注と不一致） | bound(読替) | C-10 |
| 032 | 更新内容の対象レコードの値が変更される（前提=受注とセッション） | bound(読替) | C-06 |
| 033 | 更新内容の対象レコードの値が変更されない（前提=お届け先選択） | excluded | — |
| 034 | 更新内容の対象レコードの値が変更される（前提=合計再計算） | bound(読替) | C-05 |
| 035 | お届け先・配送業者・配送日時・支払・ポイント・要望欄のフォーム（前提=入力） | bound(読替) | C-02 |
| 036 | 更新内容の対象レコードの値が変更される（前提=成功時出力） | bound(読替) | C-04 |
| 037 | 更新内容の対象レコードの値が変更される（前提=失敗時出力・最大長＝D5確定3000文字） | bound(読替) | C-13 |
| 038 | 更新内容の対象レコードの値が変更されない（前提=副作用・最大長+1＝D5確定3001文字超過） | bound(読替) | C-13 |
| 039 | 更新内容の対象レコードの値が変更される（前提=登録/更新・最小長） | bound(読替) | C-04 |
| 040 | 更新内容の対象レコードの値が変更されない（前提=お支払い方法・最小長-1） | bound(読替) | C-04 |
| 041 | 更新内容の対象レコードの値が変更される（前提=ポイント利用） | bound(読替) | C-05 |
| 042 | 実行結果の対象レコードの値が変更される（前提=プレオーダーID） | bound(読替) | C-06 |
| 043 | ロック済みカートから受注情報作成/取得しご注文方法指定画面表示 | bound(読替) | C-01 |
| 044 | 支払方法・要望欄・ポイントを受注へ反映し合計再計算して同画面へ戻る | bound(EEドリフト) | C-DR2 |
| 045 | 要望欄を保存しお届け先設定一覧へ遷移 | bound(EEドリフト) | C-DR3 |
| 046 | 入力検証・購入処理・受注確定・購入完了画面へ遷移 | bound(読替) | C-08 |
| 047 | 受注情報が無いなどの異常を案内（機能的挙動＝異常契機からの案内。URL契約は含まない） | bound(読替) | C-09 |
| 048 | 表示要素一式を表示（前提=表示要素・ロールバック観点） | bound(読替) | C-02 |
| 049 | お届け先一覧から選択して送信するとその住所を配送先へ反映 | bound(直接) | C-07 |
| 050 | 最終送信はmode=confirm相当で到達し確認・注文の役割を兼ねる | bound(読替) | C-08 |
| 051 | ご注文方法指定画面の表示時であること（前提=合計） | bound(読替) | C-03 |
| 052 | キー shopping.multiple.delivery であること | bound(EEドリフト) | C-DR4 |
| 053 | キー front.shopping.system.error であること | bound(EEドリフト) | C-DR5 |
| 054 | F04-02-MSG-001＝要ソース確認（D5=ee翻訳確定＝購入処理で予期しないエラー…） | bound(読替) | C-17 |
| 055 | 画面表示データでエラー表示されず継続（前提=MSG-002） | excluded | — |
| 056 | 購入エラー画面に遷移（前提=MSG-003） | excluded | — |
| 057 | 画面表示データでエラー表示されず継続（前提=MSG-004） | excluded | — |
| 058 | 購入エラー画面に遷移（前提=phantom MSG-005） | excluded | — |
| 059 | 小計＋送料＋手数料−割引を合計とし税相当を別算出して表示 | bound(直接) | C-03 |
| 060 | ポイント利用ありなら入力数なしなら0を使用量登録し合計再計算 | bound(直接) | C-05 |
| 061 | 配送先複数で複数配送無効なら買い物かごへ戻す | bound(読替) | C-11 |
| 062 | 配送先（dtb_shipping）へ反映（前提=お届け先） | bound(読替) | C-04 |
| 063 | ポイント使用量の登録に用いる（前提=ポイント利用有無） | bound(読替) | C-05 |
| 064 | ポイント利用ありのとき使用量として登録（前提=利用ポイント数） | bound(読替) | C-05 |
| 065 | 受注のメッセージへ保存（dtb_order）（前提=要望欄） | bound(読替) | C-04 |
| 066 | ログイン画面へ誘導（前提=未ログインかつ非会員未登録） | bound(読替) | C-15 |
| 067 | 注文エラーへ遷移（前提=受注合計マイナス・残高整合） | bound(読替) | C-10 |

`func_scope_check` 判定: 親67/67会計済み・欠落0・理由なし重複0 → **差分0を本文内で実証可能**。O6は主張しない。

---

## §9 TBD・要実機・EEドリフト・excluded・BC-DRAFT / DOC-DRAFT（正直な分離）

### bound(EEドリフト)（母集合対応・9 test_id・§4.1d）
-009（C-DR1・部分送信パターン）／-004,-044（C-DR2・/shopping/payment）／-005,-045（C-DR3・shipping_change挙動差）／
-014,-052（C-DR4・shopping.multiple.deliveryキー）／-053（C-DR5・front.shopping.system.errorキー）／
-007（C-DR6・注文エラー画面の設計指定パス`/shopping/shopping_error`のURL契約＝現EEは`/shopping/error`のみ・404失敗期待。**codex正当・コーディネータ裁定で分離**）。**設計md（正本・pf HareruyaEc）が
規定するが現EE（base・HareruyaEc未導入）にルート/キー/パス/挙動が見当たらず現EEでは失敗期待**。テストは設計md通りに書きドリフト検出として機能。
「seed→期待観測可（成功）」とは誤記しない。bound成功（49件）と会計上区別（§8）。**断定回避**（未探索の間接経路・移行途上の可能性は排除しない）。
**改訂7でもEEドリフト9件は不変**（ドット表記キー名`front.shopping.system.error`/`shopping.multiple.delivery`等の**キー名契約層**は現EE不在＝失敗期待のまま。改訂7のMSG確定はアンダースコア/別綴りの実在キーの**文言リテラル層**でありドリフト層とは別＝層の峻別）。

### TBD（0件・改訂7でD5確定前提により全件解消・§4.5で詳述）
**改訂7でTBD 7件（-016/-019/-054＝MSG-001/004確定リテラル・-025/-026/-037/-038＝フォーム最大長）を解消**。D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を
確定済みとして扱う前提で、ee実フォーム定義（利用ポイント数=11桁／要望欄=3000文字）・翻訳資源（`front.shopping.system_error` ja.yaml:1557/en.yaml:1371・
`front.shopping.shipping_unselected` ja.yaml:1530/en.yaml:1337）により裏取りし**§4.1のbound（C-13/C-17/C-12）へ移動**（会計: TBD 7→0・bound読替 36→43）。
**母集合の期待テキストの原義は不変**（「要確認」を"D5で確定した値の検証"へ具体化）。Form制約は期待値に流用せず境界値入力の構成にのみ用いる（T2規律・オラクル＝設計md/観点表）。

### excluded（9件・§4.6で詳述・per-ID実引き）
-015,-017,-030,-033,-055,-056,-057（前提と期待の極性矛盾。-033はお届け先選択で対象レコードが現に変更されるのに「変更されない」＝矛盾・codex R2）／
-020,-058（phantom F04-02-MSG-005・設計md未定義＝一律excluded・codex R2）。各前提の実在挙動は他候補（C-01/C-07/C-10/C-12/C-14/C-DR5）で
bound化済み＝偽陰性なし。

### インフラ水準の要実機・ハーネス前提（特定test_idに紐付かない・実装waveの前提事項）

| # | 事項 | 状態 |
|---|---|---|
| 0 | **共有隔離ハーネス（全checkout系T2で共有・f04-04 §2と同一）** | 確認・注文確定（C-08/C-17）はconfirm→checkout(:389)で確定後に外部送信が走る。設計は§2に具体化（Mailer=null://null／Messenger in-memory+worker非起動／UniSearch no-op／起動時外部非到達アサート）。**改訂7でD5確定＝配備済み前提**（旧「未整備/実走不可/@TBD(ハーネス)」の留保は撤回）。真の外部実送達は本機能スコープ外＝F04-04委譲 |
| 1 | 破壊系S0のdb.ts配線 | 対象テーブル・FK削除順序・条件付きDELETE（存在照会→バインドDELETE）は§2で特定済み＝**実配線もD5確定＝配備済み前提**（改訂7）。**表示ケース（GET /shopping）も処理中受注作成＝S0対象** |
| 2 | ロック済み非空カート＋処理中受注＋preOrderId＋SESSION_ORDER_IDのシード投入手順 | C-01〜C-17の前提。**D5確定＝配備済み前提** |
| 3 | 会員アドレス帳（複数）・保有ポイント・合計マイナス受注・支払方法不一致・複数配送無効設定・想定外例外契機・境界値入力のシード | C-05/C-07/C-10/C-11/C-12/C-13/C-17の前提。**D5確定＝配備済み前提** |
| 4 | SPLINKS決済代行サンドボックス | 本機能はpartial外部枝が無いため**非必須**（通常決済seedで確定を自社DB観測。SPLINKS実応答end-to-endを行う場合のみ） |

### BC-DRAFT / DOC-DRAFT（設計md〔pf現行踏襲spec〕と ee実装/設計md内部の乖離候補・**断定回避**）

**T2規律**: オラクルは設計md。以下はeeを照合補助として観察した乖離候補で、**テストは設計mdどおりに書き**、乖離は不具合/文書候補として別掲する。

| # | 設計md（オラクル） | ee観察 / md内部（照合補助） | 乖離候補・区分 |
|---|---|---|---|
| DOC-DRAFT① | md:178「MSG-003（数字で入力してください。）はキー`front.shopping.system_error`（ja.yaml:1557）の逐語値」 | ee `front.shopping.system_error` ja値=「購入処理で予期しないエラーが発生しました。恐れ入りますが…」＝**MSG-001の文言**（ja.yaml:1557／en.yaml:1371実測） | **設計md内部の誤記候補**: MSG-003のキー帰属が誤り（当該キー値はMSG-003文言でない）。C-14はMSG-003の数値バリ挙動をboundとし文言キーは要ソース確認扱い。断定回避 |
| DOC-DRAFT② | 注文エラー画面=GET `/{_locale}/shopping/shopping_error`（md:68） | ee ルートパス=`/shopping/error`（ShoppingController.php:1042 name=shopping_error） | パス表記差。ルート自体は実在（C-09はbound）。移行/表記のいずれかで要確認。断定回避 |
| DOC-DRAFT③ | エラーキー`front.shopping.error.no_order`／`shopping.multiple.delivery`／`shopping.total.price`／`front.shopping.system.error`（md:162-165） | ee にいずれも**リテラル不在**（grep実測0件）。近縁の`front.shopping.system_error`（アンダースコア）は実在 | pf現行/コア日本語のみキーの未移行またはキー名相違。C-DR4/C-DR5のEEドリフト一次根拠。断定回避（未探索プラグイン領域の可能性） |
| BC-DRAFT④ | 部分送信は`/shopping/delivery`・`/shopping/payment`の**専用エンドポイント**（md:63-64,101-113） | ee は単一`Shopping/index.twig`フォーム＋`/shopping/redirect_to`(:204)＋`/shopping/confirm`(:291)へ再編。専用エンドポイント不在（grep0）。HareruyaEcプラグイン不在（ls） | **ルート再編ドリフト**。反映データ効果はee別ルートに存在＝機能全欠落ではない。C-DR1/C-DR2の根拠。現行踏襲の正本挙動はpf/実機で確認。断定回避 |
| BC-DRAFT⑤ | `/shopping/shipping_change/{id}`＝要望欄を保存しお届け先設定一覧へ遷移（md:66） | ee `shippingChange`(:1085-1159)＝お届け先住所変更＋合計再計算。要望欄保存/お届け先設定一覧遷移ではない | **挙動差ドリフト**。C-DR3の根拠。ルート名は一致するが処理内容が相違。断定回避 |
| BC-DRAFT⑥ | セッションのお届け先ID論理キー=`hareruya_ec.shopping.customer_address_id`（md:198） | ee `SESSION_SHOPPING_CUSTOMER_ADDRESS_ID='eccube.front.shopping.customer_address_id'`（OrderHelper.php:80） | セッションキー名の相違（pf HareruyaEc名前空間 vs ee eccube名前空間）。C-06は保存/参照挙動をboundとしキー名は照合補助。断定回避 |
| BC-DRAFT⑦ | プレオーダーID・お届け先IDを**Cookie**へ保存（md:95,308-310,369-372） | ee はpreOrderIdをCart（`pre_order_id`＝session格納・CartService.php:421-433）、お届け先IDをsession（OrderHelper.php:80／ShoppingController.php:1172）に保持。**Shopping経路にCookie書込は実測不在（grep0）** | **保存チャネル差ドリフト**（Cookie vs session/Cart）。C-06対応母集合（-002/-032/-042）の期待テキストは識別子値/session変更でCookie固有を主張しないためsession/Cart観測でbound。Cookie保存自体は設計md正本挙動。断定回避 |

### codex R3指摘への一次根拠ディスポジション（是正/反証の記録）

- **S0のFK不足（R3 Blocker・是正済・ee再確認）**: 確定時`insertTagSalesAnalyses($orderItemId, $tagIds)`が`dtb_order_item_tag_sales_analysis`（受注明細`dtb_order_item.id`を`order_item_id`で参照する子表）へINSERT＝ShoppingController.php:593を実測再確認（表名=MtbTagSalesAnalysis.php:83 JoinTable・列=OrderItemRepository.php:279 `oita.order_item_id`）。§2 S0に**孫→子順（①`dtb_order_item_tag_sales_analysis`→②`dtb_order_item`）**を明記済（正しく反映）。`dtb_waiting_number`は`WaitingNumberProcessor.prepare`が顧客のOTCグループ判定`isOtcGroup()===true`のときのみ生成（:44-45実測）＝通常フロントseed（非OTC）では非生成のため条件付きDELETE＋seed制約（非OTC・smaregiId無）で空振り＝S0に反映済。`dtb_messenger_job`は`registerUsePointJob`（:524）がsmaregiId有かつ使用ポイント>0時のみpersist＝seed制約で回避＋条件付きDELETE。**起動時アサート（seed顧客が非OTC・smaregiId無であること）を§2に付記**して空振り前提を担保。
- **会計「基準7+39+8+0+6+7」不一致（R3 Blocker・著者寄り維持・コーディネータ裁定）**: 当該基準は**レビュー前の候補自己申告値**であり不変条件ではない。**会計の不変条件は合計=67・欠番0・重複0・1..67全被覆のみ**で固定バケット数一致ではない。R1/R2/本R3の各move（-020/-033→excluded・-025→TBD・-007→EEドリフト）はいずれも**per-ID根拠（母集合期待テキスト実引き）で正当化**して動かした（§4.1注/§4.6/§4.1d C-DR6）＝誤分類是正はレビューループの目的そのもの。**基準バケット値の強制には従わない**（従えばR1/R2/R3の是正と矛盾する）。
- **C-09のURL契約（R3 Blocker・codex正当・コーディネータ裁定で是正済）**: **codexの指摘を受容**。設計md L1-007（md:68）は注文エラー画面を設計指定パス`GET /{_locale}/shopping/shopping_error`で規定するが現EEは`/shopping/error`（:1042）のみ＝設計パスは404。C-09を「異常契機→到達」でbound化すると当該URL契約ドリフトを検出できない。→**URL契約層を独立ケースC-DR6（EEドリフト・失敗期待）として分離**し-007を移動（bound直接7→6・EEドリフト8→9）。C-09は機能的挙動（異常契機からの案内・-047）のみを別ケースとして残し、EEルート`/shopping/error`を駆動に用いるが**設計指定パスの代替にはしない**。テストは設計md通りに設計指定パスで書きドリフト検出として機能。
- **C-08スコープ（R3 Major・codex正当・コーディネータ裁定で是正済）**: C-08のアサーションを**入力検証・購入処理開始・受注確定（処理中→確定ステータスの`dtb_order`）まで**に限定。**確定後処理〔ポイント反映・メール実送達・タグログ（`dtb_order_item_tag_sales_analysis`）/スマレジ外部送信・購入完了画面（内容・遷移）・在庫引当〕はF04-04正本へ委譲〔md:27-36〕**しC-08合格条件から除外する旨をC-08セルに明記（母集合-006/-046の「ポイント使用→完了画面遷移」部分はF04-04スコープ）。
- **C-04/C-05のエンドポイント非依存読替（R3 Major・著者寄り維持・コーディネータ裁定）**: §4.1注0の通り、設計mdは①エンドポイント層（md:63-64）と②データ意味論層（md:186-206業務ルール/入力項目）を**別個に規定**。対応母集合IDの期待テキストは②（エンドポイントのラウンドトリップ文言を含まない）。①のラウンドトリップ要件は-004/-009/-044＝C-DR1/C-DR2で失敗期待として別勘定。**期待値（データ意味論＝設計md②由来）と駆動に使うeeルート（index/redirect_to/confirmのexecutePurchaseFlow＝照合補助）は明確に分離**し、期待値はeeに一切依存しない＝オラクル汚染ではない（セレクタ/ルート存在/観測表特定はT2許容）。C-DR2へ統合すると観測可能なデータ効果を失敗期待化する偽陰性になる。**この一点は著者寄り維持**（会計はbound成功49・EEドリフト9で整合）。

### 改訂7ディスポジション（D5確定前提化＋TBD解消の一次根拠）

- **D5確定前提化（留保外し）**: D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱い、共有隔離ハーネス（Mailer=null://null／Messenger in-memory+worker非起動／UniSearch no-op／起動時外部非到達アサート）・S0実配線・fixture具体値・スキーマ/最大長確定を**配備済み前提**とする。「未整備/実走不可/@TBD(ハーネス)/@TBD-D5」等のlive留保を除去（歴史引用は可）。真の外部実送達は本機能スコープ外（完了処理＝F04-04・md:32）。
- **最大長TBD 4件（-025/-026/-037/-038）→C-13 bound**: ee実フォーム定義で確定＝利用ポイント数`use_point` IntegerType Length max=**11桁**／要望欄`message` TextareaType Length min0 max=**3000文字**（Shopping/OrderType.php実測）。**Form制約は期待値に流用せず、D5確定スキーマの事実としてboundの境界値ケースの入力を確定**。オラクル（期待値=追加/変更される・されない）は設計md:186-206/観点表を維持（T2規律）。DBカラム長4000は境界にも期待値にも用いない（フォーム層3000が境界）。
- **MSG TBD 3件（-016/-054＝MSG-001／-019＝MSG-004）→C-17/C-12 bound**: 設計md:173-176が既に文言を規定し、D5=ee翻訳で確定リテラルの実在を裏取り＝MSG-001「購入処理で予期しないエラー…」／en「Sorry, we have faced an unexpected error…」=`front.shopping.system_error`（ja.yaml:1557/en.yaml:1371・想定外例外catch→shopping_error＝ShoppingController.php:552-553）、MSG-004「お届け先を指定してください」/en「Please select a delivery address.」=`front.shopping.shipping_unselected`（ja.yaml:1530/en.yaml:1337・shipping.twig:44）。設計md（オラクル）値と逐語一致でオラクル汚染なし。設計md:178「固定リテラル実ソース不在」はコア未探索の留保でありD5=ee確定で解消。
- **EEドリフト（キー名契約層）は不変**: ドット表記キー`front.shopping.system.error`／`shopping.multiple.delivery`／`shopping.total.price`は現EE不在（アンダースコア/別綴りのみ）＝**C-DR4/C-DR5の失敗期待は維持**。改訂7のMSG確定は実在キーの文言リテラル層で、ドット表記キー名契約層のドリフトとは別（層の峻別）。「eeに該当が無い設計md規定→bound(EEドリフト=失敗期待)」の原則に忠実。
- **期待値原義不変**: 母集合の期待テキスト原義（追加/変更される・されない／MSG確定リテラル／エラー表示・完了しない）は改変せず、「要確認」を"D5で確定した値の検証"へ具体化しただけ。identity（機能名+テストID・58行）不変。**会計: TBD 7→0・bound読替 36→43・bound合計 42→49**（EEドリフト9・excluded9・partial0・要実機0は不変。6+43+9+0+0+9=67・差分0）。

候補規律: D5確定＝配備済み前提・O5未確定・実装/実走の完了は主張しない・O6/聖域/多軸/C6C7を主張しない。

---

## 付録: 作業実測

- 参照物: 設計mdオラクル 1（379行）／母集合 1（67行）／観点表 1／先例 1（f04-04 R6候補確定draft）／
  ee照合補助（ShoppingController.php〔index/redirectTo/confirm/checkout/shipping/shippingChange/error〕・OrderHelper.php・
  CartService.php・Order.php・messages.ja/en.yaml・index.twig・app/Plugin・plugin_repos ls）。
- L1 claim数: **25**（bound根拠20＋EEドリフト根拠5。C-DR6は既存L1-007のURL契約層＝新規claim無し。改訂7のC-13/C-17/C-12はL1-011/017/021/023/025/004を再利用＝新規claim無し）。候補ケース**23**（bound成功17〔C-01〜C-17・うちC-13/C-17は改訂7新設〕・
  EEドリフト6〔C-DR1〜C-DR6〕。partial/要実機0）。
- 母集合対応=bound成功直接6・bound成功読替43・EEドリフト（失敗期待）9・partial 0・要実機0・TBD 0・excluded 9（合計67・差分0）。**改訂7でTBD 7→0・bound読替 36→43**。
- **本機能固有の要点**: (a)入力フォームを持つ→バリデーション観点が観測対象（f04-04は全excluded）。(b)GET `/shopping`表示も
  処理中受注作成＝破壊系（S0必須）。(c)pf HareruyaEcの部分送信専用エンドポイント（delivery/payment）が現EEに不在＝ルート再編ドリフト。
  (d)完了処理外部送達はF04-04スコープ＝本機能要実機0（偽陽性の要実機逃がしを回避）。(e)設計md内部のMSG-003キー帰属誤記を検出（DOC-DRAFT①）。
  (f)**改訂7でD5確定前提化＋TBD 7件解消**: フォーム最大長（利用ポイント数11桁/要望欄3000文字）とMSG-001/004確定リテラル（ee翻訳実在）を裏取りしbound化。ドット表記キー名のドリフトは層を峻別して不変。
- **未検証事項（codexレビュー/実機で要確認）**: BC-DRAFT④〜⑦（HareruyaEc未導入によるルート/挙動差の間接経路有無・Cookie保存チャネル差）、
  英語ラベルのeeコアキー値差（Order Total vs Total・DOC/BC観測・期待値は設計md:156確定）。過剰主張なし・数値は実測・grep0件は「見当たらない（断定回避）」として記載。**D5確定前提の項目（ハーネス/S0実配線/fixture/最大長）は配備済み前提とし、真の外部実送達のみ本機能スコープ外＝F04-04委譲**。
