# B1候補: f04-01 フロント カート — 買い物かご — 実行可能グレード候補（母集合75全量踏破）

> 2026-07-25 ／ **候補グレード（candidate・D6前・O5未確定。D5＝環境/前提〔スキーマ/移行先/隔離ハーネス/S0接続配線/fixture桁〕は配備される前提として確定・その上のspec/helperコードの実装＝D6実装対象＝両者を別軸に分離）**
> **改訂9（2026-07-26・codex R3 Major＋ユーザー裁定Option Aの最終是正）**: codex R3が改訂8の「旧TBD20件をEEドリフト化」を
> **根拠不足**（md:40のみ根拠・設計内矛盾未解決／-038 boundが安全に確定できない）と指摘。**ユーザー裁定＝Option A**＝
> 「ee実書込（`dtb_cart`等）にbind＝bound」＝**D5=ee確定を書込先の正**とし、eeが実際に書くテーブルのDBアサーションでbindする
> （オラクル独立性よりD5=ee確定を優先）。本改訂はこれを適用し、改訂8がEEドリフトにしたIT-26テンプレ**カート操作文脈18行**を、
> eeが実際に書く`dtb_cart`/`dtb_cart_item`（`CartService::save()`のpersist/flush・CartController.php:399-419／GET /cartの`index()`も
> 非空カート時:96-98で`save()`）へ**極性一致でbind＝bound（読替）**へ是正する。**肯定「追加/変更される」はee実書込のDBアサーション、
> 否定「されない」はee非書込/参照のDBアサーション**でbind（DBアサーション対象テーブルはee実挙動に一致＝ユーザー裁定=ee確定が正）。
> ただし**eeの実挙動が母集合の期待極性と矛盾する2行はEEドリフト維持**: **-029**（前提=入荷通知**既登録**なのにee`pushReceive`は既登録に
> **取消**〔`remove`:469-471〕でinsertせず＝期待「追加」と矛盾）／**-049**（前提=`add_show`が現eeにルート不在・grep0＋追加操作に対し
> 「削除状態になる」は極性矛盾）。**-038は参照テーブル`dtb_product_class`にeeが書かない事実で「不変」を確定＝bound**
> （codex「安全に確定できない」懸念に対し、eeが当該テーブルに書かない事実で確定）／**-039**は`dtb_product_request`更新でbound。
> 設計md（セッション保持）とee（`dtb_cart`永続）の差異は**BC-DRAFT⑫に明記**（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補）。
> **会計: bound読替 24→42（+18）・bound(EEドリフト) 30→12（-18）＝11/24/30/2/0/0/8 → 11/42/12/2/0/0/8**。
> 母集合identity・期待テキスト原義・極性は不変。操作は画面観測可能・内部メソッド禁止・D5/D6軸分離維持。著者=opus／**この後codexが独立敵対レビュー**。
> **改訂8（2026-07-26・codex再確認〔不妥当〕を受けたTBD解消の是正・改訂9で上書き）**: 改訂7はTBD22件を一律bound化したが、
> **codex独立敵対レビューが「不妥当（候補確定不可）」と判定**（母集合の操作・期待原義を実質改変・偽陽性）。本改訂は
> **オラクル（設計md）一次根拠で22件を1件ずつ再判定**し、boundは**eeが実際に書込/実装するもの（偽陽性ゼロ）**のみに限定、
> それ以外は**EEドリフト（現eeでは失敗/乖離期待）**へ確定する（TBDは0のまま・force-boundしない）。
> **決定的一次根拠＝設計md:40**「買い物かごは**セッションに保持**し、永続化に関わるテーブルとしては商品規格`dtb_product_class`・
> 基本情報`dtb_base_info`（送料無料）・入荷通知依頼`dtb_product_request`を**参照**する。…入荷通知依頼XHRの登録・取消は
> `dtb_product_request`を**更新**する」。すなわち**オラクルが規定する本機能の唯一の書込（更新）先＝`dtb_product_request`のみ**、
> `dtb_product_class`/`dtb_base_info`は**参照のみ**、カート実体は**セッション保持**（eeの`dtb_cart`/`dtb_cart_item`永続はオラクル
> 非規定のee固有挙動＝BC-DRAFT⑫）。この一次根拠で22件を再判定:
> - **bound維持/是正（2件・オラクル＋ee一致）**: **-039**（前提=`dtb_product_request`／期待=値変更＝入荷通知依頼の更新。オラクルmd:40が
>   `dtb_product_request`更新を規定・ee`pushReceive`が書込＝C-07）／**-038**（前提=`dtb_product_class`／期待=値変更されない。オラクルmd:40が
>   `dtb_product_class`を**参照テーブル**と規定・eeは`find`参照のみで書込まず＝当該レコード不変が真＝bound〔参照不変・§4.1b〕。**改訂7が対象を
>   `dtb_cart_item`へ誤って読替えたのを是正**しdtb_product_classへ忠実化）。
> - **EEドリフトへ是正（20件）**: **-029**（前提=入荷通知**既登録**なのに期待=追加。オラクルmd:40＋ee`pushReceive`は既登録に対し**取消（論理削除）**で
>   追加insertしない＝矛盾）／**-049**（前提=`add_show`〔md:69・カート追加〕は現eeにルート不在〔grep0件・C-D2〕かつ追加操作に対し期待「削除状態になる」は
>   極性矛盾）／**他18行**（-020,-021,-022,-024,-025,-026,-027,-028,-030,-032,-033,-034,-036,-037,-040,-041,-042,-048＝カート操作文脈のIT-26汎用DB副作用
>   テンプレ。オラクルmd:40はカートを**セッション保持**と規定しカートのDB副作用〔レコード追加/変更/削除〕を機能要件として**定義しない**＝オラクル準拠の
>   DB副作用検証対象が存在せず、ee実装のカートDB永続はオラクル乖離のBC-DRAFT⑫＝設計mdどおりのDB副作用検証は現eeに対し成立しない失敗/乖離期待）。
> **母集合の操作・期待テキストの原義（追加/変更される・されない・削除状態になる/ならない）は不変**（極性も母集合のまま）。**任意のテーブル
> 強制割当（改訂7が`dtb_cart`へ一律割当したもの）を全撤回**。**会計: bound読替 44→24（-20）・bound(EEドリフト) 10→30（+20）・TBD 0のまま**（§8）。
> 著者=sonnet(opus)／**この後codexが独立敵対レビュー**（著者≠レビュアー）。
> **本機能のカスタマイズ区分=カスタマイズ（現行踏襲）（T2＝excel-primary）**。オラクル（期待値の正）は設計書md
> `functions/pf-eccube3/f04-01_front_cart_cart_index.md`＋観点表＋基本設計。**ee実ソースはL1出典にしない**
> （照合補助＝セレクタ源・踏襲確認・翻訳キー実在確認のみ）。SUT/オラクル不変・母集合期待は改変しない。
> source_class=excel-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。fixture_version・スキーマ/移行先/隔離ハーネス/S0接続配線は**D5で確定・配備される前提（環境/前提を配備される前提として確定）**とし、その上の**specコード/db.ts便宜関数/pageの実装・実走はD6実装対象**として別軸に分離する（f04-03先例に倣う・live留保表現は用いない）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 出力隔離: 本md＝`_drafts/`。正式パス直下には書かない。先例=`_drafts/f04-04_front_cart_shopping_complete_executable_draft.md`。
>
> **本機能の特徴（f04-04との差）**: 買い物かごは**受注・決済・在庫更新・外部送達を行わない**（md:5,32）。**設計mdオラクルはカートを
> セッション保持と規定**（md:40,240）だが、**⚠codex R3実測: ee実装はカートを`dtb_cart`/`dtb_cart_item`にDB永続**（CartService::save→persist/flush・
> GET /cartのindex():98でも非空カート時に保存＝:96で`$Cart!==null`ガード。空カートは非永続）＝オラクルとの乖離（BC-DRAFT⑫）。入荷通知依頼は`dtb_product_request`（登録=insert/取消=論理削除）。したがって
> **真の外部送達は無く要実機=0**、破壊系S0の対象は`dtb_product_request`＋`dtb_cart`/`dtb_cart_item`＋一時変更する`dtb_base_info`送料無料値。
> **checkout系のような外部隔離ハーネス（Mailer/Messenger/UniSearch）は本機能では不要**（該当呼出が
> CartController.phpに見当たらない＝grep実測）。
>
> **母集合75の会計（差分0・codex最終是正後）**: bound成功直接**11**＋bound成功読替**40**（§4.1・現EEでseed→自社DB/セッション/画面観測可。**旧24＋IT-26テンプレ18行をee実書込dtb_cart/dtb_cart_itemへbind＝旧42、codex最終是正で-055/-060をドリフトへ移送＝40**）
> ＋**bound(EEドリフト) 14**（§4.1d・設計md〔正本〕が規定するルート/機構/応答/文言がeeに無い10行〔C-D1〜C-D8〕＋**eeの実挙動/機構が母集合期待と相違する4行**〔-029〔既登録=取消でありinsertせず〕・-049〔add_show不在＋極性矛盾〕・**-055〔母集合=一括削除リンク遷移／ee=button+確認ダイアログのフォーム送信〕・-060〔母集合キー`cart.different_sell_groups`／ee=`front.cart.different_sell_groups`〕**。現eeでは失敗/乖離期待〕）
> ＋**partial 2**（§4.1e・-006/-046＝購入手続き。遷移原子はbound観測可だが「カートロック」原子はee`Cart::setLock`が`@deprecated`未使用で不成立＝F04-02スコープ）
> ＋**要実機 0**（外部送達なし）＋**TBD 0**（**改訂9はユーザー裁定Option A＝ee実書込を書込先の正**とし、旧TBD22件をper-IDでeeの実挙動に照合してbound20〔カート操作文脈18＋-038/-039〕/EEドリフト2〔-029/-049〕へ確定＝TBD0。DBアサーション対象テーブルはee実挙動に一致）
> ＋**excluded 8**（§4.6・入力フォーム相当のバリデーション観測対象が本機能に無いテンプレ行）。
> **11+40+14+2+0+0+8=75・差分0**（直接11+読替40+ドリフト14+partial2+要実機0+TBD0+excluded8。§8・内訳・付録と同順。機械実証・python検算で重複0/欠番0/1..75全被覆）。**codex最終是正（2026-07-26・母集合忠実性3行）**: -054/-055/-060の期待結果を母集合原義へ逐語復元し、eeと照合して極性確定＝-054はbound維持（ee twig:257がdata-method="put"で母集合期待と一致・DOM属性アサート）、-055/-060はEEドリフト化（-055=母集合「リンク遷移」がeeでは<button>+確認ダイアログのフォーム送信・-060=母集合キー`cart.different_sell_groups`がeeでは`front.cart.different_sell_groups`）＝読替42→40・ドリフト12→14。
> **codex R1是正（2026-07-25）**: (a)-008/-071/-072をEEドリフトへ（ee`add_bulk`は`{success:true}`のみ返却しカート内容JSONを返さず・単品`add`/取得`get`ルート不在＝設計md「カート内容をJSONで返す」応答機構がee不在）／(b)-057をEEドリフトへ（空カート常時表示文言md:150「現在、買い物かごには…」はeeで不成立＝ee値はMSG-003側。設計md内不整合）／(c)-073のC-01二重計上を解消（C-14のみ）。会計12+49+6→11+46+10。
> **codex R2是正/反証（2026-07-25）**: (d)bound C-01/C-02/C-06のL1参照を**原子化**＝ee満足の原子のみをbound主張に残し、ドリフト原子（L1-003再計算ボタン→C-D4／L1-026「最大3桁」→C-D4／L1-011数量更新・カートロック→BC-DRAFT④・F04-02スコープ）を明示分離。見出しリテラルL1-002はbound主張から除外（母集合に見出し文字列要求行なし＝別会計行を立てない）。(e)`DtbProductRequest`行番号を是正（`deleted_at`:45・`SoftDeleteable`:26）し**論理削除で確定**。**反証**: codex R2「-019を見出しドリフトへ」は誤指摘＝-019/-059の期待テキストは「買い物かご画面の表示時であること」（TSV実測）＝タウトロジー前提でありページ描画で観測可能・見出し文字列アサートではない→bound維持（会計不変）。
> **codex R3是正（2026-07-25・重大）**: ee一次実測で**カートはセッション専有でなくDB永続**と判明＝`CartService::save()`が`persist(Cart)`/`persist(CartItem)`/`flush()`（CartService.php:410-414）で`dtb_cart`/`dtb_cart_item`（Cart.php:32・CartItem.php:29）へ書込み、**GET /cartの`index()`自身が:97で`save()`を呼ぶ**。旧稿の「カートはセッションでDB行を持たない・唯一のDB書込は`dtb_product_request`」は**ee事実として誤り**（設計mdオラクルは『セッション保持』md:40,240＝オラクルとee実装の乖離＝新規BC-DRAFT⑫）。是正: (f)L1-024/§0/§2/§9の当該記述を訂正しS0対象に`dtb_cart`/`dtb_cart_item`/session`cart_keys`を追加。(g)C-NW/C-DBWの無書込/書込assertionは**オラクル準拠で`dtb_product_request`にスコープ**（cart表永続はオラクル非規定のee挙動＝BC-DRAFT⑫別掲）。(h)-006/-046を読替→**partial**（ロック原子=ee`Cart::setLock`が`@deprecated`未使用で不成立）。**残issue（needs_more）**: C-DBW/C-NW(18)のDB副作用分類とS0完全性の最終確定は、cart表永続を織り込んだ独立再レビュー（次巡codex）を要する。
> **codex R4是正（2026-07-26・重大）**: R3の「C-NW/C-DBWを`dtb_product_request`にスコープし無書込/書込をassert」は**依然として偽陽性**（codex Blocker/Major）。理由: (i)IT-26汎用テンプレ行（-020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042,-048）の期待テキストは「対象レコードが追加/変更される・されない」で**write targetのテーブルを一切特定しない**（前提列は生成器ノイズ＝§0判定原則）。本機能はeeで少なくとも3系統の書込先（`dtb_cart`/`dtb_cart_item`＝カート実体永続、`dtb_product_request`＝入荷通知、session `cart_keys`/`cart_key_prefix`）を持ち、**旧稿が全肯定側を`dtb_product_request`登録・全否定側を同表無差分へ固定したのは任意の1表への強制割当（codex指摘）**。特に否定側「追加/変更されない」は、GET /cartの`index()`が非空カートで`save()`（CartController.php:96-98）しカートを永続化するため「無書込」は`dtb_cart`/`dtb_cart_item`に対し**偽**。(ii)よって当該21行は**write target決定不能＝TBD**へ是正（`dtb_product_request`への任意割当を撤回）。(iii)ただし期待テキストが機構特定的な行は例外的にbound維持: 「削除状態になる／取消（削除）」(-049,-051,-068)は**論理削除機構がeeで`dtb_product_request`のSoftDeleteable(DtbProductRequest.php:26)のみ**＝対象決定可→C-07(cancel)。(iv)旧C-DBW/C-NW候補ケースは廃し§4.1bをTBD台帳へ再構成。(v)-035は期待テキスト実測=「買い物かご画面の再表示、もしくはカート内容のJSON」(母集合実測)で**「値が変更される」ではなく成功時出力行**＝旧稿の§8での-035→C-DBW記載は誤りでC-08へ是正。会計 11/44/10/2/0/0/8 → 11/23/10/2/21/0/8。
> **codex R5是正（2026-07-26・精密整合）**: 独立codex確定パスがcart永続S0/TBD21/-035/要実機0/会計75差分0を妥当と確認（TBD移送は偽陰性でないと明言）。残3点を是正: (1)**-049をC-07(cancel)から外しTBDへ**＝-049の操作文脈はadd_show（カート追加・md:69）なのに期待は汎用「削除状態になる」で操作と期待が矛盾し、`SoftDeleteable`は削除対象を決める語でなくee他所にも付与先があり得るため`dtb_product_request`論理削除へ読替える根拠がない（対象特定不能）。-051（前提=入荷通知XHR＝pushReceive remove一致）/-068（取消逐語）はC-07維持。(2)旧C-DBW/C-NW写像の残滓（注4の-029/-039/-049→dtb_product_request写像）を削除しTBD台帳と完全整合。(3)§0判定原則の「partial=0」誤記を「partial=2」へ訂正（-006/-046分解自体は妥当・維持）。会計 11/23/10/2/21/0/8 → **11/22/10/2/22/0/8**（bound読替-1/TBD+1）。

---

## §0 版固定・判定原則・ドリフト切り分け

- **設計書正本（オラクル）**: `functions/pf-eccube3/f04-01_front_cart_cart_index.md`（本repo・342行。以下「md:行」）。
  md:7,9「確認値はpf-eccube3（現行）のHareruyaEcプラグイン…を正とする。DB関連の記述は移行先 ec-cube-enterprise を正とする。」
  →**挙動＝pf現行踏襲spec（設計md）がオラクル、DB永続化先名称のみee**。
- **観点表**: `integration_test/integration-test-viewpoints.md`。
- **母集合**: 本スライス75行（-001〜-075。TSV実測=75行）。
- **ee実ソース（照合補助＝L1出典にしない）**: `/home/y-saito/Developments/ec-cube-enterprise`（作業ツリー実測・版固定D5/D6）。
  セレクタ源・踏襲確認・翻訳キー実在・DB書込対象テーブル特定にのみ用いる。
  - Controller = `src/Eccube/Controller/Front/CartController.php`
    - `index()` GET `/cart`（:80-107）: 全カート取得(:87)・購入フローvalidate(:100 `execPurchaseFlow`)・サマリー構築
      (:101 `buildCartSummary`)・描画。**受注/在庫/外部送達なし**。
    - `buildCartSummary()`（:129-176）: 購入グループ>1で`front.cart.different_sell_groups`をaddRequestError(:144)・
      送料無料判定（数量:148-153／金額:156-162）・totalPrice/totalQuantity。
    - `clear()` **POST** `/cart/clear`（:114-121）: `cartService->clear()`→cartへredirect。
    - `handleCartItem()` **PUT|POST** `/cart/{operation}/{productClassId}`（op=`up|down|remove|set`・:284-376）:
      up=+1(:305)／down=-1(:308)／remove(:311)／set=数量設定(:326)。XHRはJSON(:368)・非XHRはcartへredirect(:375)。
    - `addBulk()` **POST** `/cart/add_bulk`（:227-266）: 配列を順次addProduct・`{success:bool}`のJSONを返す。
    - `buystep()` **GET** `/cart/buystep/{cart_key}`（:383-418）: setPrimary(:397)・resetShoppingState(:401)・save(:404)・
      shoppingへredirect(:417)。**数量更新・明示的ロック処理は本メソッドに見当たらない**。
    - `pushReceive()` **POST** `/cart/push_receive`（:420-502）: 入荷通知依頼の登録/取消。既存あり→`entityManager->remove`(:470)・
      無し→`NotifylistProductAction->handle`→`entityManager->flush`（NotifylistProductAction.php:44）。JSONで結果。
  - Template = `Cart/index.twig`（見出し`front.cart.page_title`:156・削除アンカー`data-method="put"`:257・数量input:265・
    合計`front.cart.total_label`:290・購入手続きリンク`cart_buystep`:295・一括削除ボタン`#cart-clear-btn`:302・
    空カート`front.cart.no_items`:326・送料無料:283/285）。**`Cart/index.en.twig`は実在せず**（find実測0件）＝英語は
    ロケールキー`|trans`経由（設計md:152「英語は`Cart/index.en.twig`を正とする」はpf前提でありee構造と相違＝§9 BC-DRAFT）。
  - 書込テーブル（ee照合・L1出典にしない）: `dtb_product_request`（`DtbProductRequest.php:23` `#[ORM\Table(name:'dtb_product_request')]`・
    `#[Gedmo\SoftDeleteable(fieldName:'deletedAt')]`:26・`deleted_at`列:45）。**SoftDeleteable付与により`remove()`は論理削除（`deleted_at`セット）**。
    参照のみ: `dtb_base_info`（送料無料金額/個数）・`dtb_product_class`（商品規格・在庫）。
  - 翻訳資源 = `messages.ja.yaml`／`messages.en.yaml`（§5で実引き）。
- **判定原則**: 母集合の観点ラベル・前提列・操作手順列は**生成器ノイズ**。bindは各行の**「期待結果／レスポンス」実テキスト**で
  判定し、極性も期待テキストで確認する（§8に全75行併記）。**前提列と観点ラベル（CSRF/未認証/文字列長バリ等）が
  期待テキストと無関係な行が多い**（例: -001は観点=CSRFだが期待=表示）→期待テキスト優先。
- **ドリフト切り分け（本機能の中核・設計md〔pf/HareruyaEc〕とee実装のルート差）**:
  - **bound**: 設計mdの利用者観測可能な挙動が現eeに存在（**ルート名/HTTPメソッドがee側で異なっても、利用者観測可能な
    結果〔カート更新・画面表示・遷移・JSON・DB書込〕が観測できる**）。差分はBC-DRAFTに別掲。
  - **bound(EEドリフト)**: 設計mdが規定する**ルート/機構そのものが現eeに見当たらない**（`POST /cart/add`単品追加・
    `POST /cart/add_show`・`GET /cart/get`＋CORS・`name="qty[商品規格ID]"`の再計算フォーム・購入手続きボタンの
    `formaction`切替）。テストは設計md通りに書き、現eeに対しては**失敗期待（ドリフト検出）**。「seed→観測可（成功）」と誤記しない。
  - **要実機=0**: 本機能は外部送達を持たない（CartController.phpにメール/Messenger/unisearch呼出なし＝grep実測）。**partial=2**（-006/-046＝購入手続きの「カートロック」原子がee`Cart::setLock`(@deprecated未使用)で不成立＝§4.1e）。

---

## §1 L1原子オラクル表（**出典=設計書md／観点表。ee実ソースはL1出典にしない**）

「外部依存」列は当該claimの最終値が真の外部送達を要するか＝**全て否**（本機能は外部送達なし）。「ee該当」列は現eeに
利用者観測可能な該当挙動があるか（bound）／ルート・機構が見当たらないか（EEドリフト）を照合補助として付す。

| oracle_id | 観点 | claim（現行踏襲spec＝設計mdが正） | 根拠(md:line) | ee該当（照合補助） |
|---|---|---|---|---|
| L1-F0401-001 | route/entry | 買い物かごは`GET /{_locale}/cart`で開き、カート内商品一覧・数量・金額・送料無料案内を表示。数量更新・削除・増減・一括削除後はいずれも買い物かご画面へ戻る | md:58-74 | bound（`index()` :80／各操作後cartへredirect） |
| L1-F0401-002 | display_field | 見出しは「買い物かご」 | md:146 | bound（`front.cart.page_title`但しee値=「カート」＝§9 BC-DRAFT③） |
| L1-F0401-003 | display_field | 商品ごとにサムネイル画像（未登録はノーイメージ）・商品名リンク・単価・数量入力欄・商品ごとの金額・削除ボタンを表示。下部に送料無料案内・合計（税込）・再計算ボタン | md:82,156 | bound（index.twig:243-274。**再計算ボタンはeeに無く数量AJAX＝§9 BC-DRAFT⑥**） |
| L1-F0401-004 | calc/display | 合計（税込）はカートの合計金額を表示。行の金額は単価×数量 | md:149,180-181 | bound（index.twig:290-291/254,272） |
| L1-F0401-005 | display_field | 送料無料案内: 金額/個数設定があり到達で「現在送料無料です。」、未到達で不足額/個数を案内 | md:147-148,182-183 | bound（buildCartSummary:148-162／twig:283-285） |
| L1-F0401-006 | display_layout | カートアイテム0件のとき空カート案内を表示し、購入手続きボタンを出さない | md:150,194 | bound（twig:189条件分岐／空側:325-327） |
| L1-F0401-007 | update | 数量更新（再計算）は入力数量でカートを更新し買い物かご画面へ戻る。数量1未満は当該商品を削除 | md:61,101-106,184 | bound（`handleCartItem` set:326・下限削除は数量制御。**pf `POST /cart/update`一括再計算ルートはeeに無く単品setのAJAX＝§9 BC-DRAFT①**） |
| L1-F0401-008 | remove | 商品削除は当該商品をカートから取り除き買い物かご画面へ戻る | md:62,115-119 | bound（`handleCartItem` remove:311） |
| L1-F0401-009 | inc_dec | 数量+1（up）／-1（down）。減算で0未満は削除。買い物かご画面へ戻る | md:63-64,108-113 | bound（up:305／down:308） |
| L1-F0401-010 | clear | カート一括削除はカートを空にし買い物かご画面へ戻る | md:65,121-124 | bound（`clear()`。**pf `GET /cart/clear`に対しeeは`POST`＋確認ダイアログ＝§9 BC-DRAFT②**） |
| L1-F0401-011 | buystep | 購入手続きへ進む: 数量を更新し、追加メッセージが無ければカートをロックして注文情報入力（ご注文方法指定）へ遷移。メッセージがあれば買い物かごへ戻る | md:66,126-130,281-282 | bound（`buystep()`→shopping redirect:417。**数量更新・明示的ロックはee buystepに見当たらず＝§9 BC-DRAFT④。pf `POST`に対しeeは`GET/{cart_key}`**） |
| L1-F0401-012 | xhr_add | カートに商品を追加（XHR）は1商品を追加しカート内容をJSONで返す（`POST /cart/add`） | md:67,132-136 | **EEドリフト**（`/cart/add`単品ルートがeeに見当たらない＝grep0件） |
| L1-F0401-013 | xhr_add_bulk | カートに商品を一括追加（XHR）は商品配列を追加しカート内容をJSONで返す（`POST /cart/add_bulk`） | md:68 | bound（`addBulk()`存在。**返却は`{success:bool}`でカート内容でない＝§9 BC-DRAFT⑦**） |
| L1-F0401-014 | xhr_add_show | カートに追加して表示は1商品を追加し買い物かご画面へリダイレクト（`POST /cart/add_show`） | md:69 | **EEドリフト**（`/cart/add_show`がeeに見当たらない＝grep0件） |
| L1-F0401-015 | xhr_get | カート内容取得（XHR）はカート内容をJSONで返しCORS用ヘッダを付与（`GET /cart/get`＋OPTIONS） | md:70,72,216 | **EEドリフト**（`/cart/get`・CORS・OPTIONSがeeに見当たらない＝grep0件） |
| L1-F0401-016 | notify_request | 入荷通知依頼（XHR）は対象商品の依頼を登録または取消し結果をJSONで返す。既登録は取消（削除）として扱う | md:71,161,197,219 | bound（`pushReceive()` remove:470／登録flush・`dtb_product_request`書込） |
| L1-F0401-017 | sell_group | 購入グループが2つ以上になると同時注文できず、買い物かご画面上部にエラーを表示 | md:60,158,185,196 | bound（buildCartSummary:142-146・`front.cart.different_sell_groups`） |
| L1-F0401-018 | qty_input | 数量はテキスト入力欄（`name="qty[商品規格ID]"`、最大3桁）。プラス・マイナスのスピンで増減、再計算ボタン（`name="update"`）で送信 | md:83,259 | **EEドリフト**（`name="qty[..]"`/再計算ボタン`name="update"`がeeに無い。ee数量inputは`type=text`だがname無し・上限は在庫依存＝index.twig:265） |
| L1-F0401-019 | delete_anchor | 各行の削除ボタンはアンカーに`data-method="put"`を付けたカート削除エンドポイントへの送信。なりすまし対策トークンをアンカーに付与 | md:84 | bound（index.twig:257 `data-method="put"`＋`csrf_token_for_anchor()`） |
| L1-F0401-020 | clear_link | 「カート一括削除」リンクからカート全消去エンドポイントへ遷移 | md:85 | bound（twig:302。**eeはリンクでなくボタン`#cart-clear-btn`＋確認＝§9 BC-DRAFT②**） |
| L1-F0401-021 | buystep_btn | 「購入手続きへ」ボタンは数量更新フォームの`formaction`を購入手続きエンドポイントに切り替えて送信。SP用/PC用で2か所配置 | md:86 | **EEドリフト**（`formaction`切替機構がeeに無い。ee購入手続きは`<a href=cart_buystep>`リンク＝twig:295） |
| L1-F0401-022 | js_include | 数量スピン、カート用JS、リターゲティング・おすすめ表示用JSをインクルード | md:88 | bound（twig:149 hareruya-checkout.js／:150 `_top_page_scripts.twig`／:348 block_product_recommend render） |
| L1-F0401-023 | session | カートはセッションに保持し追加・更新・削除のたびに保存。数量更新・増減・削除の結果は保存後の再表示で一致 | md:205-206,329 | bound（cartService->save・GET /cartで再表示） |
| L1-F0401-024 | db_effect | **ユーザー裁定Option A＝D5=ee確定を書込先の正とする**: eeが実際に書くテーブルへ極性一致でbind。**カート追加/数量更新/削除＝`dtb_cart`/`dtb_cart_item`**（`CartService::save()`のpersist/flush・GET /cartの`index()`非空カート時save）、**入荷通知登録/取消＝`dtb_product_request`**（pushReceive）、参照テーブル`dtb_product_class`はeeが書かない＝不変。IT-26汎用テンプレ行「対象レコード追加/変更される・されない」は、**肯定はee実書込のDBアサーション・否定はee非書込/参照のDBアサーションでbound**（カート操作文脈18行＝C-15／-039＝`dtb_product_request`更新C-07／-038＝`dtb_product_class`参照不変C-16）。ただし**ee実挙動が期待極性と矛盾する-029〔既登録=ee取消でinsertせず〕・-049〔add_show不在〕はEEドリフト維持**（§4.1d） | md:40,230,240,243,251 | bound（`dtb_cart`/`dtb_cart_item`書込＝C-15・`dtb_product_request`書込＝C-07・`dtb_product_class`参照不変＝C-16）／**⚠設計md乖離＝§9 BC-DRAFT⑫: 設計md:40はカートを`セッション保持`と規定するがeeは`CartService::save()`(CartService.php:399-419)で`dtb_cart`(Cart.php:32)/`dtb_cart_item`(CartItem.php:29)を永続化。改訂9はユーザー裁定Option Aに従いee実書込を書込先の正としてbindし、設計との差異をBC-DRAFT⑫に明記（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補）** |
| L1-F0401-025 | auth | 非ログインでもカート表示・数量更新・削除・一括削除・購入手続き導線を利用可。入荷通知依頼は未ログイン時ログインを促し参照元URLをセッション保存 | md:269-270,302,331 | bound（pushReceive未ログイン:447-453・`PRODUCT_SEARCH_REFERER`保存:448） |
| L1-F0401-026 | validation | 数量入力は最大3桁の数値・1未満は削除。増減/削除はなりすまし対策トークン検証。パスパラメータは数字のみ | md:259-261 | bound（isTokenValid:289／`productClassId'=>'\\d+'`:284。3桁上限はee未実装＝§9 BC-DRAFT⑥） |

**LS（locale_sensitive）**: 見出し・合計・空カート・送料無料・同時注文エラー・入荷通知系はja/en対訳あり（§5）。**英語仕様の正は
設計md（表示メッセージ節・md:144-163）**。ee翻訳値は照合補助（英語仕様の正としない）。

---

## §2 SEED三段参照設計・破壊系S0（実行可能設計に具体化）

三段参照: **期待の正=L1オラクルID（§1・設計md） → 前提状態=SEEDセットID → 観測=実値（session/画面/db.ts）**。
**⚠codex R3是正**: 設計mdオラクルは『カート=セッション保持』（md:40,240）だが、**ee実装は`CartService::save()`で`dtb_cart`/`dtb_cart_item`を
`persist`/`flush`し（CartService.php:410-414）、GET /cartの`index()`も:98で`save()`を呼ぶ（:96で`$Cart!==null`ガード＝**空カートは非永続**）＝カートはeeでDB永続**（BC-DRAFT⑫）。
したがってDB永続の破壊系は(a)`dtb_product_request`（入荷通知・論理削除）、(b)`dtb_cart`/`dtb_cart_item`（カート実体・`clear()`でremove）、
(c)送料無料判定用に一時変更する`dtb_base_info`。**checkout系の外部隔離ハーネス（Mailer/Messenger/UniSearch）は本機能では不要**（該当呼出なし＝grep実測）。

### 操作手順の標準形（フロー駆動＝結合/e2e。買い物かご画面を正しい入口とする）

**是正の根本**: 買い物かご画面（`GET /{_locale}/cart`＝CartController.php:80）は**F04-01自身の入口**。カート操作（数量更新/削除/増減/一括削除/入荷通知XHR/購入手続きへ遷移）は**seed投入＋内部直接呼び出しではなく、実ブラウザ操作/XHRで駆動**する。すなわち「**商品をカートへ投入 → `GET /cart`で買い物かご画面を実表示 → 当該操作を実ブラウザ/XHRで発火 → `GET /cart`再表示（またはXHR応答）で観測**」を標準形とする。

**標準形（カート操作系・C-01〜C-05/C-08〜C-14）**:
`SEED-CART-ITEMS等の商品をカートへ投入（POST /cart/add_bulk・CartController.php:227で規格ID配列を投入）→ GET /{_locale}/cart（買い物かご・CartController.php:80）を実ブラウザで表示 → <当該操作を実ブラウザ/XHRで発火> → GET /cart再表示（またはXHR JSON応答）で<観測> → afterEach で破壊系S0復元`。
- **数量更新（再計算/set）**: 数量入力欄を操作し `PUT|POST /cart/set/{productClassId}`（CartController.php:284,326）
- **削除**: 削除アンカー（`data-method="put"`・index.twig:257）押下で `PUT|POST /cart/remove/{productClassId}`（:311）
- **増減**: +/-スピン操作で `PUT|POST /cart/up|down/{productClassId}`（:305/:308）
- **一括削除**: 一括削除ボタン（`#cart-clear-btn`＋確認・twig:302）で `POST /cart/clear`（:114-121）
- **入荷通知XHR**: `POST /cart/push_receive`（:420-502）をPlaywright request/画面操作で実際に叩く（登録=insert/flush・NotifylistProductAction.php:44／取消=remove:470=論理削除）

**購入手続きへ遷移（C-06・partial）**: `GET /cart`→購入手続き導線（`<a href=cart_buystep>`・index.twig:295）を実ブラウザで押下→`GET /cart/buystep/{cart_key}`（:383-418）→`/shopping`（ご注文方法指定）到達を観測（**遷移原子**）。「カートロック」原子（設計md:66）はee`Cart::setLock`（@deprecated未使用）で不成立でありF04-02（注文情報入力側がロック済みカートを参照）スコープとして分離（§4.1e）。

**XHR系（add_bulk/set/remove/up/down/push_receive）**: いずれもPlaywrightのrequest（またはページDOM操作）で**実際にeeエンドポイントを叩く**形にする（ee CartController.php照合済み）。設計md（pf）の`/cart/update`一括再計算・`/cart/add`単品・`/cart/add_show`・`/cart/get`はee不在＝§4.1dのEEドリフト（設計md通りに書き失敗期待）。

**実行方法列（列11）**: bound系＝`Playwright(カート操作駆動)`（数量更新/削除/増減/一括削除/セッション一致等でXHRを叩く行は`Playwright/request(カート操作駆動)`・C-07はDBアサーション付きで`Playwright/request+db.ts(カート操作駆動)`）／partial＝`Playwright（partial）`／EEドリフト＝`Playwright（現EEでは失敗期待）`／DBアサーション行（C-07=`dtb_product_request`・-039/-051/-068／**C-15=`dtb_cart`/`dtb_cart_item`のカートDB副作用・-020他18行〔改訂9ユーザー裁定Option A〕**／C-16=`dtb_product_class`参照不変・-038）＝`Playwright+DB確認`（eeが実際に書く/参照するテーブルに一致）。

| SEEDセットID | 目的 | 内容（要点） |
|---|---|---|
| SEED-CART-ITEMS | 表示/計算/更新/削除/増減の基準カート | セッションカートに既知の`dtb_product_class`（単価・在庫既知）をN明細投入。totalPrice/行金額を既知値にする |
| SEED-CART-MULTIGROUP | 購入グループ複数（同時注文不可） | 購入グループの異なる2商品をカート投入し`getSellGroups`が2件になる状態（ee照合: CartController.php:140-146） |
| SEED-CART-EMPTY | 空カート | セッションカートを0明細（または未生成）にする |
| SEED-DELIVERYFREE | 送料無料判定 | `dtb_base_info.delivery_free_amount`/`delivery_free_quantity`を既知値に**一時変更**し、カート合計を到達/未到達に振り分け（S0で原値復元） |
| SEED-NOTIFY-LOGIN | 入荷通知依頼（登録） | ログイン会員＋`dtb_player`＋在庫切れ`dtb_product_class`を用意し`push_receive`で新規登録できる状態 |
| SEED-NOTIFY-EXISTING | 入荷通知依頼（既登録→取消） | 上記に加え対象の`dtb_product_request`行が既に存在（`push_receive`で取消＝削除経路に入る） |
| SEED-NOTIFY-GUEST | 入荷通知依頼（未ログイン） | 非ログイン状態で`push_receive`を叩き`nologin`応答＋参照元URLセッション保存を観測 |

### 破壊系S0スナップショット・復元設計

**S0対象（操作直前にraw psql=db.tsでスナップショット）**:
| 対象 | スナップショット項目 | 復元方法 |
|---|---|---|
| `dtb_product_request` | 対象(`player_id`,`product_class_id`)の行の有無/`deleted_at` | 登録テストで挿入した行を`DELETE FROM dtb_product_request WHERE player_id=$1 AND product_class_id=$2`。取消テストで消えた/`deleted_at`が入った行はS0値で復元（`deleted_at`をNULLへUPDATE、または行を再INSERT）。**削除方式=論理削除で確定＝`#[Gedmo\SoftDeleteable(fieldName:'deletedAt')]`（DtbProductRequest.php:26）＋`deleted_at`列（:45）により`entityManager->remove`(:470)は`deleted_at`セット（物理DELETEでない）。S0復元は`deleted_at`をNULLへUPDATEを主経路とする（db.tsで実測確認）** |
| `dtb_base_info` | `delivery_free_amount`/`delivery_free_quantity`（S0値） | `UPDATE dtb_base_info SET delivery_free_amount=$1, delivery_free_quantity=$2 WHERE id=$3`（原値へ復元） |
| `dtb_cart`/`dtb_cart_item`（**codex R3追加**） | 対象`cart_key`のCart行・CartItem明細（product_class_id・quantity）の有無/値 | ee`CartService::save()`が永続化（CartService.php:410-414）・`clear()`がremove（:444）。テスト前後で対象cart_keyのCart/CartItem行をスナップショット→`DELETE FROM dtb_cart_item WHERE cart_id IN(…)`／`DELETE FROM dtb_cart WHERE cart_key=$1`で使い捨て隔離。テスト専用cart_key接頭辞（`cart_key_prefix`・CartService.php:525-535）で他テナントと隔離 |
| セッション（カート参照キー） | `cart_keys`・`cart_key`・`cart_key_prefix` | ee実装ではセッションはカート実体でなく参照キーのみ保持（CartService.php:88,418,457,525）。テスト毎にセッション破棄（べき等） |
| セッション（`PRODUCT_SEARCH_REFERER`） | 未ログイン入荷通知で保存される値 | テスト毎にセッション破棄（べき等） |

- **raw SQLで復元**（ORM/Doctrineを経由せず`update_date`等を確実に元値へ戻す。f04-04/f06-19のS0設計を踏襲）。
  **db.tsの接続配線・S0対象・SQL骨子はD5で確定・配備される前提（環境/前提を配備される前提として確定）**とし（本§で特定済み）、その上の**db.ts便宜関数のコード実装・実走はD6実装対象**として別軸に分離する。**冪等性担保**: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用**: 本機能は受注採番・在庫更新・外部送達を持たない。ただし**codex R3是正**: `dtb_product_request.id`に加え
  `dtb_cart.id`/`dtb_cart_item.id`のシーケンスもテスト実行で前進する（カート永続のため）。これらは復元しないが**業務影響なし**
  （受注番号のような業務採番でなく、行は上記S0でDELETE隔離）。旧稿の「非可逆採番前進は`dtb_product_request.id`のみ」は
  cart表永続の見落としで誤りだったため是正。

---

## §3 画面項目マトリクス（本機能は新規保存フォームを持たない）

md:188「本機能は新規保存・更新のフォームを持たないため、保存対象の入力項目表は持たない。数量入力欄は更新・増減・削除の
操作対象であり、新規データの登録項目ではない。」→**三値比較（設計md／eeフォーム／eeDB）の対象となる新規登録入力項目は
存在しない**。これが母集合のバリデーション系テンプレ（必須/相関/文字列長/DB相関＝IT-22由来）が本機能に対応実挙動を持たない
根本理由で、§4.6 excludedの根拠（肯定側=エラー発生／否定側=エラー非発生継続、いずれも新規登録フォームの観測対象を持たない）
として扱う。数量入力の制約（3桁・1未満削除・パス数字のみ）はL1-018/026として別途扱う（§4.1）。

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。**T2ルーティング**により期待値は設計md由来。ee参照は
「（ee照合: file:line）」＝**セレクタ源/観測対象特定/踏襲確認のみ**（L1出典にしない）。

### §4.1 母集合対応・bound成功（現EEでseed→自社DB/セッション/画面/DOM観測可能。11直接＋40読替＝51行。**改訂9（ユーザー裁定Option A適用）: 改訂8がEEドリフトにしたIT-26テンプレ カート操作文脈18行を、eeが実際に書く`dtb_cart`/`dtb_cart_item`へ極性一致でbind＝bound（読替・C-15を再確立）。-039=`dtb_product_request`更新・C-07／-038=`dtb_product_class`参照不変・C-16は維持。ee実挙動と極性矛盾する-029/-049のみEEドリフト維持〔§4.1d〕**）

**（会計の正典は§8のper-ID台帳。§4各行の「対応母集合」内の（直接）/（読替）注記は§8と一致させる。相違があれば§8を正とする。）**

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 対応母集合 |
|---|---|---|---|---|
| C-01 | カート画面の表示（ee満足の原子のみ） | SEED-CART-ITEMSで`GET /{_locale}/cart` | 買い物かご画面が表示され、商品一覧・数量・金額・送料無料案内・合計、および表示要素（サムネイル〔未登録はノーイメージ〕・商品名リンク・単価・数量入力欄・商品ごとの金額・削除ボタン）を表示 `[L1:F0401-001, F0401-003（**再計算ボタン原子を除く**＝§4.1d C-D4のドリフト）]`（ee照合: index.twig:243-274/290）。**見出し文字列原子（L1-002「買い物かご」）はbound主張に含めない**（ee値「カート」＝§9 BC-DRAFT③。設計md値を字義でアサートすれば失敗＝ドリフトだが、母集合に見出しリテラルを要求する行は無く別勘定の会計行を立てない） | -001（直接・注1）／-012,-019,-052,-059（読替・注1・**-019/-059は「買い物かご画面の表示時であること」というタウトロジー前提であり見出し文字列アサートではない**＝ページ描画で観測可）／-058(JS)は別C（C-12）。※-073はC-14のみ（旧稿の二重計上を是正） |
| C-02 | 数量更新（再計算/set）と下限削除（ee満足の原子のみ） | SEED-CART-ITEMSで数量を変更→カート再表示 | 入力した数量でカートを更新し買い物かご画面へ戻る。数量1未満は当該商品を削除 `[L1:F0401-007, F0401-026（**「最大3桁」入力属性原子とパス数字/トークン検証のうち、bound主張はトークン検証`isTokenValid`:289とパス制約`\d+`:284に限定。「最大3桁」UI属性原子はeeが在庫依存`max`で相違＝§4.1d C-D4のドリフトに分離**）]`（ee照合: handleCartItem set:326／下限は数量制御。§9 BC-DRAFT①⑥） | -002（読替・注2・数量更新の観測）／-063,-066（読替・下限削除等。※-053の「最大3桁」はC-D4。**-042「実行結果の対象レコードの値が変更される（前提=再計算）」は改訂9でC-15（ee実書込`dtb_cart_item`のDB副作用）へbind**＝画面観測可能な数量更新はC-02でbound観測、DB副作用は数量更新でdtb_cart_item値が変更されることをC-15でDBアサーション） |
| C-03 | 商品削除（remove） | SEED-CART-ITEMSで削除操作→カート再表示 | 当該商品をカートから取り除き買い物かご画面へ戻る `[L1:F0401-008]`（ee照合: remove:311） | -003,-043（直接）／-054（**母集合原義「削除ボタンはアンカーにdata-method="put"を付けたカート削除エンドポイントへの送信」を逐語復元・直接**。ee twig:257が`<a data-method="put" href=cart_handle_item(remove)>`で母集合期待と一致＝DOM属性data-method=putをアサート・注3） |
| C-04 | 数量増減（up/down） | SEED-CART-ITEMSで+1/-1操作 | 当該商品の数量を1増/1減する。減算で0未満は削除 `[L1:F0401-009]`（ee照合: up:305/down:308） | -004,-044（直接） |
| C-05 | カート一括削除（clear） | SEED-CART-ITEMSで一括削除→カート再表示 | カートの内容を全て空にし買い物かご画面へ戻る `[L1:F0401-010,020]`（ee照合: clear:114-121。§9 BC-DRAFT②: eeはPOST＋確認ダイアログ） | -005,-045（直接）／**-055はEEドリフトへ移送**（母集合原義「「カート一括削除」リンクからカート全消去エンドポイントへ遷移」を逐語保持。ee一括削除はリンク（アンカー）でなく`<button id=cart-clear-btn>`＋confirm確認ダイアログでform_cartをPOST送信＝機構相違・C-D9/§4.1d/BC-DRAFT②。全消去挙動自体は-005/-045でbound） |
| C-06 | 購入手続きへ進む（buystep遷移・**遷移原子のみbound**） | SEED-CART-ITEMS（追加メッセージなし）で購入手続き操作 | **bound主張は遷移原子に限定**: 追加メッセージが無ければ注文情報入力（ご注文方法指定）へ遷移する `[L1:F0401-011（遷移原子）]`（ee照合: buystep→shopping redirect:417）。**「数量更新」「カートロック」原子はbound主張から除外**＝ee buystepに観測可能な数量更新/明示ロック処理が見当たらず（§9 BC-DRAFT④）、かつカートロックは設計md:341で「注文処理中のカート確定を表す内部状態（DBロックではない）」と定義され、その効果検証は**F04-02（注文情報入力側がロック済みカートを参照）スコープ**（md:31,208,290）＝本機能ではF04-02スコープ/BC-DRAFT④として分離（メソッド/パラメータもpf〔POST〕とee〔GET/{cart_key}〕で相違） | -006,-046（**partial・§4.1e**。遷移原子=bound観測可／「ロックして」原子=ee`Cart::setLock`@deprecated未使用で不成立=drift。母集合期待テキスト全体は充足しないためpartial会計） |
| C-07 | 入荷通知依頼XHR 取消（論理削除・`dtb_product_request`）＋登録（SEED経路） | SEED-NOTIFY-EXISTING（既登録→取消）で`push_receive`。登録路はSEED-NOTIFY-LOGIN | 既登録の入荷通知依頼を取消（論理削除）として扱う。`dtb_product_request`の`deleted_at`セットをDBアサーション `[L1:F0401-016,024]`（ee照合: pushReceive remove:470／登録flush・NotifylistProductAction.php:44）。**codex R5: C-07 boundの根拠は、-051/-068の操作文脈（入荷通知XHR／取消逐語）がee `pushReceive`の`dtb_product_request` remove（CartController.php:464-476）と一致し副作用対象が一意に決まること。機構一意（SoftDeleteableのみ）を根拠にしない** | -051（読替・前提=入荷通知XHR＝ee`pushReceive`のdtb_product_request removeと操作一致・CartController.php:464-476）／-068（直接・取消逐語・ee remove:470）／**-039（読替・前提=`dtb_product_request`＝入荷通知依頼の状態〔`deleted_at`〕変更＝オラクルmd:40が`dtb_product_request`更新を規定・ee`pushReceive`書込でbound・§4.1b）**。**-029はC-07から除外しEEドリフト**（前提=**既登録**なのに期待=追加。ee`pushReceive`は既登録に対し取消〔論理削除・remove:469-471〕で追加insertしない＝ee実挙動と矛盾・§4.1d）。**-049もEEドリフト**（add_showルート不在＋極性矛盾＝ee実挙動と矛盾しユーザー裁定Option Aでもbind不可・§4.1d）。カート操作文脈のカートDB副作用は-020他18行としてC-15でboundへ別掲 |
| C-08 | XHR成功時出力（買い物かご再表示 or JSON） | SEED-CART-ITEMSで各操作の成功時出力を観測 | 成功時出力は買い物かご画面の再表示、または（XHR時）JSON `[L1:F0401-013]`。**-035/-074は「買い物かご再表示 もしくは カート内容JSON」のOR**であり、**再表示の枝は現eeで観測可（remove/clear/updateは`GET /cart`へredirect）**＝boundとして成立。※カート内容JSONの枝（add_bulkが`{success:bool}`のみ・単品add/getが不在）は§4.1d C-D6/C-D7のドリフトとして別掲（ee照合: addBulk:227-266） | -035,-074（読替・成功時出力=再表示枝で観測。**codex R4: -035の母集合期待テキスト実測=「買い物かご画面の再表示、もしくはカート内容のJSON」＝-074と同一で「値が変更される」ではない＝旧稿の-035→C-DBW記載は誤り**。注5） |
| C-09 | 空カート表示・購入ボタン非表示 | SEED-CART-EMPTYで`GET /cart` | 空カートの案内を表示し、購入手続きボタンを出さない `[L1:F0401-006]`（ee照合: twig:189/325-327） | -065（直接・空カート挙動＝案内表示＋購入ボタン非表示は現eeで観測可）／※-057（空カート常時表示文言md:150リテラル）は§4.1d C-D8のドリフト（ee値=MSG-003側「現在カート内に商品はございません。」で不成立・設計md内不整合BC-DRAFT⑤） |
| C-10 | 購入グループ複数→同時注文不可エラー | SEED-CART-MULTIGROUPで`GET /cart` | 同時注文不可のエラー（`front.cart.different_sell_groups`）を画面上部に表示。単一グループ時はエラーなしで継続 `[L1:F0401-017]`（ee照合: buildCartSummary:142-146。設計mdキー`cart.different_sell_groups`＝ee`front.cart.different_sell_groups`でプレフィクス相違・§5） | -067（直接・同時注文不可エラー表示）／-064（読替・単一グループ→エラーなし negative）／**-060はEEドリフトへ移送**（母集合原義「調査補助のキー cart.different_sell_groups」を逐語保持。ee実キーは`front.cart.different_sell_groups`＝`front.`プレフィクス相違・キー原義不一致・C-D10/§4.1d） |
| C-11 | 行金額・合計の計算表示 | SEED-CART-ITEMS（既知単価/数量）で`GET /cart` | 行の金額は単価×数量、合計（税込）はカート合計金額を表示 `[L1:F0401-004]`（ee照合: twig:254/272/291） | -023,-061,-062（読替） |
| C-12 | JS/おすすめ/リターゲJSインクルード | `GET /cart`のDOM確認 | 数量スピン・カート用JS・リターゲティング・おすすめ表示用JSをインクルード `[L1:F0401-022]`（ee照合: twig:149/150/348） | -058（読替） |
| C-13 | カートのセッション保持・保存後一致 | SEED-CART-ITEMSで更新→再表示 | カートはセッションに保持し追加・更新・削除のたびに保存。数量更新・増減・削除の結果は保存後の再表示で一致 `[L1:F0401-023]`（ee照合: cartService->save／GET /cart再描画） | -031,-069,-070（読替・具体的な保存後再表示一致claim）。**-030「実行結果の対象レコードが追加される（前提=カートとセッション）」は改訂9でC-15（ee実書込`dtb_cart`/`dtb_cart_item`のDB副作用）へbind**＝カートのセッション保持・再表示一致はC-13で観測、DB副作用はカート永続でdtb_cart_item行が追加されることをC-15でDBアサーション（ee実書込＝ユーザー裁定Option A・BC-DRAFT⑫） |
| C-14 | 入力/失敗時出力の観測 | 各操作の入力・失敗時出力 | 入力＝数量配列（再計算）・商品規格ID（削除/増減）・追加用の商品規格IDと数量（XHR）。失敗時出力＝追加/更新のリクエストエラー・入荷通知依頼XHRのエラーメッセージ `[L1:F0401-001,016]`（ee照合: addRequestError／pushReceive fail応答） | -073（読替・入力列挙）／-075（読替・失敗時出力）→注6 |
| C-15 | **カート実体`dtb_cart`/`dtb_cart_item`のDB副作用DB確認**（改訂9で再確立・**ユーザー裁定Option A＝D5=ee確定を書込先の正とする**。eeが実際に書く`dtb_cart`/`dtb_cart_item`＝`CartService::save()`のpersist/flush・GET /cartの`index()`非空カート時save） | SEED-CART-ITEMS等でカート操作（追加/数量更新）または表示を駆動→`dtb_cart`/`dtb_cart_item`をDB確認→afterEach S0（使い捨てcart_key隔離） | IT-26汎用DB副作用テンプレの各文脈で、eeが実際に書く`dtb_cart`/`dtb_cart_item`の当該カート明細レコードを**極性一致でDBアサーション**: 肯定「追加/変更される」はee実書込（persist/flush・数量変更）を確認、否定「されない」はee非書込/参照（空カート非永続・表示は新規明細を作らない・一括追加は削除しない）を確認。**母集合の期待テキスト原義・極性は不変** `[L1:F0401-024]`。設計md:40のセッション保持規定とeeのDB永続の差異はBC-DRAFT⑫に明記（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補） | **18行**（肯定12: -020,-022,-024,-025,-027,-030,-032,-034,-036,-037,-041,-042／否定6: -021,-026,-028,-033,-040,-048。§4.1b台帳） |
| C-16 | **参照テーブル`dtb_product_class`の値不変DB確認**（ユーザー裁定Option A＝eeが`dtb_product_class`に書かない事実で「不変」を確定） | SEED-CART-ITEMSでカート操作（表示/数量更新/削除等）→`dtb_product_class`をDB確認 | 本機能のカート操作は`dtb_product_class`（商品規格）を**参照のみ**で書込まないため当該商品規格レコードの値が**変更されない**ことをDBアサーション。ee裏取り: `productClassRepository->find`（CartController.php:292,437）＝参照のみ・`persist/flush`なし（**codex「安全に確定できない」懸念に対しeeが当該テーブルに書かない事実で不変を確定**）。**母集合の期待テキスト原義（値が変更されない）・対象（前提列=`dtb_product_class`）ともに不変** `[L1:F0401-024]` | -038（読替・§4.1b台帳・1行） |
| C-AUTH | 権限・未ログイン入荷通知 | SEED-NOTIFY-GUEST（未ログイン）で`push_receive` | 非ログインでもカート表示/更新/削除/購入手続き導線は利用可。入荷通知依頼は未ログイン時ログインを促し参照元URLをセッション保存 `[L1:F0401-025]`（ee照合: pushReceive:447-453・PRODUCT_SEARCH_REFERER:448） | （L1-025は母集合直行なし＝補完的にC-07/C-10等の前提として反映。母集合行の会計はC-07やC-01等側で計上） |

**注1（C-01）**: -001は観点=CSRFだが期待テキスト=「カート内商品一覧・数量・金額・送料無料案内を表示」＝表示（期待テキスト
優先）。-012（観点=文字列長バリだが期待=表示要素列挙）・-052（観点=実行結果だが期待=表示要素列挙）も同様に表示へ写像。
**注2（C-02）**: -002は観点=未認証だが期待=「入力した数量でカートを更新し買い物かご画面へ戻る」＝更新。-063「数量1未満は
削除」・-066「0以下→エラーなし継続」を数量更新の観測へ写像（**-042は改訂9でC-15へbound**＝ユーザー裁定Option Aで数量更新後の`dtb_cart_item`値変更をee実書込としてDBアサーション。数量更新の画面観測はC-02）。
**注3（C-03）**: -054「削除ボタンはアンカーに`data-method=put`」はee twig:257の実測一致（表示/機構）→C-03の表示面。
**注4（C-07・改訂8是正）**: C-07にboundとして残すのは**操作文脈がee`pushReceive`（`dtb_product_request`書込）と一致し、オラクルmd:40が`dtb_product_request`更新を規定する行のみ**＝-051（前提=入荷通知XHR）・-068（同一依頼が存在する場合は取消＝逐語・ee remove:470）・**-039（前提=`dtb_product_request`／期待=値変更＝入荷通知依頼の状態更新）**。**-029はEEドリフトへ是正**（前提=**既登録**なのに期待=追加＝オラクルmd:40＋ee`pushReceive`が既登録に対し取消〔論理削除〕で追加insertしない矛盾・§4.1d）。**-049もEEドリフトへ**（add_showルート不在＋極性矛盾・§4.1d）。
**注5（C-08・codex R1是正）**: -074「成功時出力=買い物かご再表示 もしくは カート内容JSON」は**OR**であり、**再表示の枝**
（remove/clear/update後の`GET /cart`へのredirect）が現eeで観測可のためboundとして成立させる。**-071「追加・取得は同一
セッション参照」・-072「取得・追加・一括追加のJSON入口網」は取得`get`/単品`add`のXHR入口がee不在（grep0件）で設計md記載の
入口網が成立しないため、旧稿のboundを撤回しEEドリフト（C-D7）へ移送**。同様に**-008「カート内容をJSONで返す」もee`add_bulk`が
`{success:true}`のみでカート内容を返さずEEドリフト（C-D6）**。核observable（XHRが同一セッションカートを参照しJSON返却）を
add_bulk単体へ緩めてboundとするのは応答/入口の相違を曖昧化するため採らない（オラクル忠実性優先）。
**注6（C-14）**: -073は入力の列挙（数量配列/商品規格ID/追加用ID＝各操作の入力パラメータ）→操作入口の存在で観測。-075は失敗時
出力（リクエストエラー/入荷通知XHRエラー）→addRequestError・pushReceive fail応答で観測。
**注7（IT-26テンプレ・改訂9＝ユーザー裁定Option A適用）**: -020〜-042/-048/-049のIT-26系（登録内容/更新内容/実行結果/削除条件の「追加/変更される・されない」）について、
**ユーザー裁定Option A＝「ee実書込（`dtb_cart`等）にbind＝bound」＝D5=ee確定を書込先の正とする**（オラクル独立性よりD5=ee確定を優先）。
改訂8はこれをオラクルmd:40のセッション保持規定を根拠にEEドリフト化したが、codex R3が根拠不足（md:40のみ・設計内矛盾未解決／-038確定不能）と指摘し、ユーザーがOption Aを裁定した。
**per-IDでeeの実挙動に照合して再判定**する。eeが実際に書くテーブルは(a)**カート追加/数量更新/削除＝`dtb_cart`/`dtb_cart_item`**（`CartService::save()`のpersist/flush・CartController.php:399-419／GET /cartの`index()`も非空カート時:96-98でsave）、
(b)**入荷通知登録/取消＝`dtb_product_request`**（pushReceive:464-476）。**決定則**:
(1)前提が`dtb_product_request`を指し期待がその更新である**-039は`dtb_product_request`更新でbound（C-07）**、(2)前提が参照テーブル`dtb_product_class`で期待が「変更されない」である**-038はeeが当該テーブルに書かない事実で不変を確定＝bound（C-16）**、
(3)残り**カート操作文脈18行**（合計・行金額・数量更新の下限・購入グループ・カート空・再計算・カートとセッション・XHRとセッション・API・入力・失敗時出力・副作用・登録/更新・買い物かごを開く・再計算・一括追加XHR等）は、
eeが実際に書く`dtb_cart`/`dtb_cart_item`へ**極性一致でbind＝bound（C-15）**＝肯定「追加/変更される」はee実書込のDBアサーション、否定「されない」はee非書込/参照のDBアサーション、
(4)**eeの実挙動が母集合の期待極性と矛盾する2行のみEEドリフト維持**＝前提が**既登録の入荷通知**なのに期待が「追加」でee取消（remove:469-471・insertせず）と矛盾する**-029**、前提が`add_show`（ルート不在・grep0）で期待が極性矛盾の**-049**（§4.1d）。
**DBアサーション対象テーブルはee実挙動に一致させる（ユーザー裁定=ee確定が正）**。**母集合の期待テキスト原義（追加/変更される・されない・削除状態になる/ならない）・極性はいずれも不変**。設計md:40のセッション保持とeeのDB永続の差異はBC-DRAFT⑫に明記（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補）。

#### §4.1b IT-26テンプレ per-ID台帳（改訂9・ユーザー裁定Option A＝ee実書込にbind＝bound20件〔C-15×18＋C-07×1＋C-16×1〕／EEドリフト2件〔-029/-049〕）

**方針（ユーザー裁定Option A）**: IT-26テンプレ行の期待テキスト「登録/更新/実行結果/削除条件の**対象レコード**が追加/変更される・されない」は書込先テーブルを字面で特定しない。**ユーザー裁定＝D5=ee確定を書込先の正とし、eeが実際に書くテーブルのDBアサーションでbind＝bound**（オラクル独立性よりD5=ee確定を優先）。eeが実際に書くのは**カート操作＝`dtb_cart`/`dtb_cart_item`**（`CartService::save()`persist/flush・GET /cartの`index()`非空カート時save）・**入荷通知＝`dtb_product_request`**（pushReceive）。**肯定「追加/変更される」はee実書込のDBアサーション・否定「されない」はee非書込/参照のDBアサーション**でbind（DBアサーション対象テーブルはee実挙動に一致＝ユーザー裁定=ee確定が正）。**eeの実挙動が母集合の期待極性と矛盾する行のみEEドリフト**（-029/-049）。

**bound（20件・per-IDでeeの実挙動に照合）**:

| test_id | 期待テキスト（極性・原義不変） | 判定 | ee実挙動→bind先（ee file:line） |
|---|---|---|---|
| -039 | 更新内容の対象レコードの値が変更される(+) | **bound(C-07)** | 前提=`dtb_product_request`。ee`pushReceive`が入荷通知依頼を書込（insert/`deleted_at`論理削除・CartController.php:464-476）＝値変更が観測可。ee実書込テーブルと極性一致 |
| -038 | 更新内容の対象レコードの値が変更されない(-) | **bound(C-16→`dtb_product_class`)** | 前提=`dtb_product_class`。ee`productClassRepository->find`（CartController.php:292,437）で参照のみ・`persist/flush`なし＝**eeが当該テーブルに書かない事実で「不変」を確定**（codex「安全に確定できない」懸念に対しee非書込で確定）。否定極性・原義不変 |
| -020,-022,-024,-025,-027,-030（肯定・登録/実行結果=追加される） | 対象レコードが追加される(+) | **bound(C-15→`dtb_cart`/`dtb_cart_item`)** | 前提=合計/行の金額/数量更新の下限/購入グループ単一性/0以下再計算/カートとセッション＝カート操作文脈。eeはカートを追加/永続時`CartService::save()`のpersist/flush（CartService.php:399-419）で`dtb_cart_item`へ書込＝当該明細レコードが**追加される**をDBアサーション（ee実書込・極性一致） |
| -032,-034,-036,-037,-041,-042（肯定・更新/実行結果=変更される） | 対象レコードの値が変更される(+) | **bound(C-15→`dtb_cart_item`)** | 前提=XHRとセッション/入力/失敗時出力/副作用/買い物かごを開く/再計算＝カート操作文脈。ee数量更新（handleCartItem set/up/down・CartController.php:284-376）→GET /cart再表示のindex()がsave()で永続（:96-98）＝`dtb_cart_item`の値（数量）が**変更される**をDBアサーション（ee実書込・極性一致） |
| -021,-028（否定・追加されない/表示） | 対象レコードが追加されない(-) | **bound(C-15→`dtb_cart_item`非書込)** | 前提=購入グループ複数の表示。eeはbuildCartSummaryでエラー表示のみ・**新規カート明細を作らない**（CartController.php:129-176）＝当該明細が**追加されない**をDBアサーション（ee非書込・極性一致） |
| -026（否定・空カート） | 対象レコードが追加されない(-) | **bound(C-15→`dtb_cart_item`非書込)** | 前提=カート空。空カートは`index()`:96の`$Cart!==null`ガードでsave()を呼ばず**永続しない**＝当該明細が**追加されない**をDBアサーション（ee非書込・極性一致） |
| -033,-040（否定・変更されない/参照） | 対象レコードの値が変更されない(-) | **bound(C-15→`dtb_cart_item`非書込)** | 前提=API/登録・更新＝表示/参照文脈。eeはindex()でresetShoppingState/既存カート再永続のみで**明細値を書き換えない**＝当該明細の値が**変更されない**をDBアサーション（ee非書込・極性一致） |
| -048（否定・削除状態にならない） | 対象レコードが削除状態にならない(-) | **bound(C-15→`dtb_cart_item`非削除)** | 前提=一括追加XHR。ee`add_bulk`（CartController.php:227-266）はカート明細を**追加するのみで論理削除/除去しない**＝当該明細が**削除状態にならない**をDBアサーション（ee非削除・極性一致） |

**EEドリフト維持（2件・ee実挙動が母集合の期待極性と矛盾）**:

| test_id | 期待テキスト（極性・原義不変） | 判定 | 根拠（ee実挙動と矛盾＝bind不可） |
|---|---|---|---|
| -029 | 登録内容の対象レコードが追加される(+) | **EEドリフト** | 前提=入荷通知依頼が**既登録**。ee`pushReceive`は既登録に対し**取消（remove:469-471・`deleted_at`論理削除）**でありinsertしない＝期待「追加」と真に矛盾（bind不可）。既登録の取消は-051/-068でbound |
| -049 | 実行結果の対象レコードが削除状態になる(+) | **EEドリフト** | 前提=`add_show`（カート追加・md:69）は現eeにルート不在（grep0件・§4.1d C-D2）、かつ追加操作に対し期待「削除状態になる」は極性矛盾＝対象・挙動ともにee実挙動と矛盾（bind不可） |

**入荷通知文脈でboundを維持する行（改訂9で変更なし）**: -051（前提=入荷通知XHR＝ee`pushReceive` remove一致）／-068（取消逐語・ee remove:470）はC-07で維持（ee`dtb_product_request`書込）。

**改訂9の要点（codex R3 Major＋ユーザー裁定Option Aへの応答）**: (a)**ee実書込にbind＝bound**＝カート操作文脈18行をeeが実際に書く`dtb_cart`/`dtb_cart_item`へ極性一致でDBアサーション（C-15）。DBアサーション対象テーブルはee実挙動に一致（ユーザー裁定=ee確定が正）。(b)**-038はeeがdtb_product_classに書かない事実で「不変」を確定＝bound**（codex懸念に応答）。(c)**-029/-049はee実挙動と真に矛盾するためEEドリフト維持**（既登録=ee取消／add_show=ルート不在・追加≠削除）。(d)設計md:40のセッション保持とeeのDB永続の差異はBC-DRAFT⑫に明記（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補）。(e)**母集合の操作・期待原義・極性は不変**。

### §4.1e 母集合対応・partial（一部原子がbound観測可・一部原子がeeで不成立。2母集合行）

**codex R2/R3指摘対応**: -006/-046の母集合期待テキストは「数量を更新し、追加メッセージが無ければ**カートをロックして**注文情報入力へ遷移すること。」＝**複数原子**（数量更新・カートロック・遷移）。ee実測での各原子の充足状況:

| test_id | 原子 | ee充足 | 根拠 | 分類 |
|---|---|---|---|---|
| -006/-046 | 追加メッセージ無し時の**注文情報入力への遷移** | ○bound観測可 | `buystep()`→shopping redirect（CartController.php:417） | bound原子 |
| -006/-046 | **カートロック** | ✗不成立 | ee`Cart::lock`/`setLock()`は`@deprecated 使用しないので削除予定`（Cart.php:114-126）で呼出箇所なし。設計md:341はロック=「注文処理中のカート確定を表す内部状態（DBロックでない）」でその効果検証はF04-02スコープ（md:31,208,290） | drift原子 |
| -006/-046 | buystep時の**数量更新** | △不明瞭 | ee`buystep()`に明示的数量更新が見当たらず（§9 BC-DRAFT④） | drift/TBD原子 |

→ **遷移原子はbound・ロック原子はee不成立**の混在ゆえ**partial**（母集合期待テキスト全体を成功boundにはできない＝codex R2/R3指摘を受け読替→partialへ是正）。テストは設計md通り（遷移＋ロック）に書き、遷移はpass期待・ロック検証はF04-02スコープとして分離。

### §4.1d 母集合対応・bound(EEドリフト＝現eeでは失敗/乖離期待。14母集合行＝ルート/機構/応答/文言不在の10行〔C-D1〜C-D8〕＋ee実挙動/機構が母集合期待と相違する4行〔-029/-049〔極性〕・-055〔一括削除リンク→ee button+確認ダイアログ・C-D9〕・-060〔メッセージキー`front.`プレフィクス相違・C-D10〕〕。**改訂9: IT-26テンプレ カート操作文脈18行はユーザー裁定Option Aでee実書込`dtb_cart`/`dtb_cart_item`へbind＝§4.1 C-15へ移送しドリフトから除外**。**codex最終是正: -055/-060は母集合原義を逐語復元のうえ、母集合が要求する機構（リンク遷移／キー字面）がeeと相違するためドリフトへ**)

**ee実測（grep）**: 設計md（オラクル・pf/HareruyaEc）が規定する①単品追加XHR`POST /cart/add`、②追加して表示`POST /cart/add_show`、
③カート内容取得XHR`GET /cart/get`＋CORS＋OPTIONS、④数量再計算フォーム（`name="qty[商品規格ID]"`・再計算ボタン`name="update"`）、
⑤購入手続きボタンの`formaction`切替、は**現eeに該当ルート/機構が見当たらない**（`/cart/(add|get|add_show|update)`ルートは
grep実測0件・CartController.phpにCORS/OPTIONS/formaction機構なし）。**断定は避ける**（未探索の間接経路の可能性は排除しない）が、
**現eeでは失敗期待**として bound成功と会計上区別する。テストは**設計md（正本）どおりに書き**、現eeに対してはドリフト検出
（失敗が正当）として機能。「seed→期待観測可（成功）」とは誤記しない。

| C-ID | 対象観点（設計md規定） | 期待結果（設計md＝正本） | 現eeでの扱い（ee実測） | 対応母集合 |
|---|---|---|---|---|
| C-D1 | 単品追加XHR（`POST /cart/add`） | 1商品をカートへ追加しカート内容をJSONで返す `[L1:F0401-012]` | **失敗期待**: `/cart/add`単品ルートがgrep0件（ee一括はadd_bulkのみ）＝現eeでは当該入口が無く不成立（EEドリフト） | -007,-047 |
| C-D2 | 追加して表示（`POST /cart/add_show`） | 1商品を追加し買い物かご画面へリダイレクト `[L1:F0401-014]` | **失敗期待**: `/cart/add_show`がgrep0件＝EEドリフト | -009 |
| C-D3 | カート内容取得XHR（`GET /cart/get`） | カート内容をJSONで返す（CORSヘッダ付与） `[L1:F0401-015]` | **失敗期待**: `/cart/get`・CORS・OPTIONSがgrep0件＝EEドリフト | -050 |
| C-D4 | 数量入力欄（`name="qty[商品規格ID]"`・最大3桁・再計算ボタン`name="update"`） | 数量はテキスト入力欄（`name="qty[商品規格ID]"`、最大3桁）で再計算ボタンにより送信 `[L1:F0401-018]` | **失敗期待（機構）**: eeの数量inputは`type=text`だが`name="qty[..]"`無し・上限は在庫依存・再計算ボタン`name=update`無し（AJAX単品set）＝設計md機構は不成立（EEドリフト）。※テキスト入力欄自体は存在 | -053 |
| C-D5 | 購入手続きボタンの`formaction`切替 | 購入手続きボタンは数量更新フォームの`formaction`を切り替えて送信 `[L1:F0401-021]` | **失敗期待（機構）**: ee購入手続きは`<a href=cart_buystep>`リンク（twig:295）で`formaction`切替フォーム機構なし＝EEドリフト。※購入手続き導線自体は存在 | -056 |
| C-D6 | 一括/単品追加XHRの**カート内容JSON応答**（`add_bulk`/`add`） | 商品を追加し**カート内容をJSONで返す** `[L1:F0401-013]` | **失敗期待（応答ペイロード機構）**: ee`addBulk()`は`{success:true}`（失敗時`{success:false,errors:[…]}`）のみ返却し**カート内容を含まない**（CartController.php:227-266実測）。単品`/cart/add`ルートはgrep0件。設計md「カート内容をJSONで返す」応答機構がee不在＝EEドリフト。※商品追加という副作用自体はadd_bulkで発火 | -008 |
| C-D7 | XHRのカート**取得(`get`)/単品追加(`add`)入口**＋同一セッション参照 | カート内容取得・追加・一括追加はJSONを返すXHR入口を持ち同一セッションのカートを参照 `[L1:F0401-013,023]` | **失敗期待（入口不在）**: 取得`GET /cart/get`・単品`POST /cart/add`がgrep0件（eeは`add_bulk`のみ）。-071（追加・取得の同一セッション参照）/-072（取得・追加・一括追加のJSON入口網）は**取得/単品追加の入口がee不在**で設計md記載の入口網が成立せず＝EEドリフト。※一括追加(add_bulk)単体は存在 | -071,-072 |
| C-D8 | 空カート**常時表示文言**（md:150リテラル） | カート0件のとき「現在、買い物かごには商品が入っておりません。」を表示 `[L1:F0401-006]` | **失敗期待（文言）**: ee`front.cart.no_items`=「現在カート内に商品はございません。」（ja:1312＝MSG-003/md:173側）で**md:150リテラルは不成立**。設計md内でmd:150（常時表示表）とmd:173（MSG-003）が不整合（BC-DRAFT⑤/DOC-DRAFT）。設計md:150をオラクルにする限り現eeでは失敗期待＝EEドリフト。※空カート挙動（案内表示＋購入ボタン非表示）自体は-065でbound | -057 |
| **C-DT(-029)** | 入荷通知**既登録**時の「対象レコードが追加される」 | 対象レコードが追加される `[L1:F0401-016,024]` | **失敗期待（ee実挙動と矛盾＝bind不可）**: 前提=既登録。ee`pushReceive`は既登録に対し**取消（`dtb_product_request`論理削除・remove:469-471）**でありinsertしない＝期待「追加」と真に矛盾（ユーザー裁定Option Aでもee実書込と極性が一致せずbind不可）。既登録の取消は-051/-068でbound | -029 |
| **C-DT(-049)** | `add_show`（カート追加・md:69）時の「対象レコードが削除状態になる」 | 対象レコードが削除状態になる `[L1:F0401-024]` | **失敗期待（ルート不在＋極性矛盾＝bind不可）**: 前提=`add_show`は現eeにルート不在（grep0件・C-D2）、かつ追加操作に対し「削除状態になる」は極性矛盾＝対象・挙動ともにee実挙動と矛盾（bind不可） | -049 |
| **C-D9** | 一括削除の**リンク遷移**機構 | 「カート一括削除」**リンク**からカート全消去エンドポイントへ遷移する `[L1:F0401-010,020]` | **失敗期待（機構相違）**: ee一括削除はリンク（アンカー）でなく`<button type="button" id="cart-clear-btn" data-href=cart_clear>`（Cart/index.twig:302）で、押下時に`confirm`確認ダイアログ後に`form_cart`をPOST送信（Cart/index.twig:141-145／cart_clear POST=Front/CartController.php:114-115）。母集合原義「リンク遷移」を逐語保持しつつ、eeはボタン＋確認ダイアログのフォーム送信で機構相違＝EEドリフト（BC-DRAFT②）。※全消去挙動自体は-005/-045でbound | -055 |
| **C-D10** | 同時注文不可メッセージの**調査補助キー字面** | 調査補助のキー `cart.different_sell_groups` であること `[L1:F0401-017]` | **失敗期待（キー字面相違）**: eeの同時注文不可メッセージキーは`front.cart.different_sell_groups`（Front/CartController.php:144・messages.ja.yaml:1317）で`front.`プレフィクス付き。母集合原義キー`cart.different_sell_groups`を逐語保持しつつ、ee実キーとはプレフィクスが相違＝キー原義不一致のEEドリフト（§5/BC-DRAFT）。※同時注文不可エラーの画面表示自体は-067でbound | -060 |

**（改訂9で移送）** IT-26テンプレ カート操作文脈18行（-020,-021,-022,-024,-025,-026,-027,-028,-030,-032,-033,-034,-036,-037,-040,-041,-042,-048）は、**ユーザー裁定Option A＝ee実書込`dtb_cart`/`dtb_cart_item`へ極性一致でbind**（§4.1 C-15・§4.1b台帳）へ移送し、本ドリフト表から除外した。

### §4.6 母集合対応・excluded（8母集合行・per-ID実引き・過剰除外禁止）

| test_id | 期待テキスト要旨（観点/前提） | 除外理由（一次資料実引き） |
|---|---|---|
| -010 | 必須バリでエラー表示・処理完了しない（観点=必須バリ・前提=カート内容取得XHR） | 本機能は新規保存/更新フォームを持たない（md:188）＝必須バリデーション自体が起こらず**肯定側実挙動が存在しない**。カート内容取得XHR自体もeeに無い（§4.1d C-D3で別掲） |
| -011 | 必須バリでエラー表示されず継続（観点=必須バリ・前提=入荷通知XHR） | 入力フォームが無い以上バリデーション否定側（エラー非発生の「継続」）も新規登録の観測対象を持たない→肯定側(-010)と一貫してexcluded。入荷通知依頼の登録/取消はC-07でbound |
| -013 | 相関バリでエラー表示・完了しない（観点=相関バリ・前提=数量入力） | 新規登録フォーム非存在（md:188）。数量入力の制約（3桁/1未満削除）はL1-018/026として別扱い（§4.1 C-02/§4.1d C-D4） |
| -014 | 相関バリでエラー表示されず継続（前提=削除） | 同上（否定側・新規登録の観測対象なし）。削除はC-03でbound |
| -015 | 相関バリでエラー表示されず継続（前提=一括削除） | 同上。一括削除はC-05でbound |
| -016 | 相関バリでエラー表示・完了しない（前提=購入手続きボタン） | 同上（完了阻止の新規登録バリデーションが無い）。購入手続きボタンの機構はC-D5、遷移はC-06 |
| -017 | DB相関バリでエラー表示されず継続（前提=空カート表示） | 同上（DB相関の新規登録バリデーションが無い）。空カート表示はC-09でbound |
| -018 | DB相関バリでエラー表示・完了しない（前提=JS挙動） | 同上。JS挙動のインクルードはC-12でbound |

**過剰除外でないことの傍証**: excluded 8件はいずれも(a)新規保存/更新フォーム非存在（md:188）でバリデーション肯定/否定側の
観測対象が無い（-010,-011,-013,-014,-015,-016,-017,-018）。各前提が指す実在挙動（カート内容取得・入荷通知・数量入力・削除・
一括削除・購入手続きボタン・空カート表示・JS挙動）は他候補（C-D3/C-07/C-02/C-03/C-05/C-D5/C-06/C-09/C-12）でbound化または
ドリフト計上済み＝**偽陰性なし**。

---

## §5 locale対応表・翻訳キー実在確認（実装照合補助・英語仕様の正としない）

ee翻訳資源（**照合補助＝L1/英語仕様出典にしない**）での実在確認（`messages.ja.yaml`／`messages.en.yaml`）:

**列の意味**: 「ja値（ee）」「en値/実在行」は**ee照合値（実装照合補助）**であり英語/日本語仕様の正ではない。仕様の正（オラクル）は
設計md表示メッセージ節（見出し ja「買い物かご」／en「Shopping Cart」＝md:146、合計 ja「合計(税込)」／en「Subtotal(tax incl.)」＝md:149、
空カート ja「現在、買い物かごには商品が入っておりません。」／en「There are currently no items in your shopping cart.」＝md:150）。

| L1/表示 | ja翻訳キー / 実在行 | ja値（ee照合値） | en値（ee照合値） / 実在行 | 設計md（オラクル）値・備考 |
|---|---|---|---|---|
| 見出し(L1-002) | `front.cart.page_title`／ja:1323 | カート | Cart／en:1120 | **設計md=ja「買い物かご」/en「Shopping Cart」（md:146）**。ee=カート/Cartで差異＝§9 BC-DRAFT③。期待は設計md値 |
| 合計(L1-004) | `front.cart.total_label`／ja:1331 | 合計(税込) | Total (tax incl.)／en:1128 | ja一致。**enは設計md「Subtotal(tax incl.)」（md:149）とee「Total (tax incl.)」で差異＝§9 BC-DRAFT⑨** |
| 送料無料到達(L1-005) | `front.cart.delivery_fee_free__now`／ja:1313 | 現在送料無料です。 | Shipping charge is waived.／en:1114 | 設計md常時表示表はja「現在送料無料です。」・enは「-」（md:152）＝eeにはen値あり。MSG-002は「Shipping charge is waived.」と一致 |
| 送料無料未到達(L1-005) | `front.cart.delivery_fee_free__price`／ja:1315 | あと「%price%」で送料無料 | （en:1116 Free shipping…） | 設計mdは未到達enを「-」（md:152）。eeにはen値あり（照合補助） |
| 空カート(L1-006) | `front.cart.no_items`／ja:1312 | 現在カート内に商品はございません。 | Your cart is empty.／en:1113 | **§9 BC-DRAFT⑤**: 設計md常時表示表は「現在、買い物かごには商品が入っておりません。」（md:150）・MSG-003は「現在カート内に商品はございません。」（md:173）で**設計md内不整合**。ee値はMSG-003側と一致 |
| 一括削除確認(MSG-001) | `front.cart.delete_all_item_confirm`／ja:1322 | カート内の商品がすべて削除されます。本当に実行してよろしいですか？ | All items in your cart will be removed. Are you sure?／en:1119 | 設計md MSG-001（md:171）とee値がja/en共に一致 |
| 同時注文(L1-017) | `front.cart.different_sell_groups`／ja:1317 | 「%sellGroup1%」と「%sellGroup2%」の商品は同時に注文することが出来ません。…（3行） | **en見当たらない**（grep実測0件） | 設計mdキー`cart.different_sell_groups`／ee`front.cart.different_sell_groups`でプレフィクス相違（§9 BC-DRAFT⑩）。en文言はeeに不在＝**設計md提供のen値を仕様として確定**（英語仕様は設計mdオラクル一次で確定・ee翻訳〔messages.en.yaml〕は裏取り補助。差異/不在はEEドリフト） |
| 入荷通知未ログイン | `front.cart.product.request_notlogin.message`／ja:1343 | 入荷通知を依頼する場合ログインしてください | To register Item Waiting for Arrival, please log in.／en:1140 | 設計mdキー`error_messages.product.request_notlogin.message`／ee`front.cart.product.request_notlogin.message`でプレフィクス相違（§9 BC-DRAFT⑩） |
| 入荷通知上限 | `front.cart.product.over_request_count.message`／ja:1344 | 入荷通知依頼は%s件までです。 | Up to %s items are able to register…／en:1141 | 設計mdキー`error_messages.product.over_request_count.message`／eeプレフィクス相違 |
| 入荷通知成功/取消 | `front.cart.product_request.success`／ja:1339・`.cancel`／ja:1340 | 入荷通知依頼しました。／入荷通知依頼をキャンセルしました。 | You have registered…／Your registered…canceled.／en:1136,1137 | 設計mdキー`front.product_request.success`/`cancel`（別プレフィクス。ee`front.product_request.success`=「入荷通知を設定しました」ja:957は別値）＝**キー空間の相違に注意**（§9 BC-DRAFT⑩） |

- **T2規律**: 翻訳キー実在の記録は実装照合補助として残すが、**eeの訳値を英語/日本語「仕様」の正の根拠にしない**（オラクルは
  設計mdの表示メッセージ節）。設計md提供のen値があるものはそれを仕様とし、eeに不在の対訳（同時注文en）も**設計md提供en値を仕様として確定**（英語仕様は設計mdオラクル一次で確定・ee翻訳は裏取り補助）。

---

## §6 判定手段骨子（候補グレード＝spec/page/db.ts便宜関数コードはD6実装対象・環境/前提〔スキーマ/S0接続配線/fixture/隔離ハーネス〕はD5配備前提）＋ _drafts隔離lint証跡

- page/spec: 本機能の実行可能spec/pageの**コード実装＝D6実装対象**（本書は候補設計＝D6前）。**D5とD6の分界＝D5は環境/前提〔移行先スキーマ・隔離ハーネス・S0接続配線・fixture桁〕を配備される前提として確定**（S0対象・SQL骨子は§2で特定済み）**し、D6はその上のspecコード/pageの実装・実走を担う**（両者を別軸に分離。「実走なし」はD6実装前の実装フェーズ留保でありD5配備前提とは別軸）。
- request契約: 表示=`GET /{_locale}/cart`。操作=`POST /cart/clear`（ee）／`PUT|POST /cart/{up|down|remove|set}/{productClassId}`／
  `POST /cart/add_bulk`／`GET /cart/buystep/{cart_key}`／`POST /cart/push_receive`。**設計md（pf）の`/cart/update`・`/cart/add`・
  `/cart/add_show`・`/cart/get`・OPTIONSは現eeに無く§4.1dのEEドリフト**。期待値は`o("L1-F0401-xxx")`（L1解決器）経由・
  リテラル直書き禁止。
- db.ts（`e2e/helpers/db.ts`）: **DBアサーション対象＝ユーザー裁定Option Aでeeが実際に書く/参照するテーブル**＝`dtb_product_request`（挿入/`deleted_at`論理削除＝C-07・-039/-051/-068）・`dtb_cart`/`dtb_cart_item`（**カート実体のDB副作用DB確認＝C-15**・-020他18行。`CartService::save()`persist/flush・GET /cartのindex()非空カート時save）・`dtb_product_class`（**参照テーブルの値不変確認**＝-038。eeが書かない事実で不変を確定）・`dtb_base_info`（送料無料値・SEED-DELIVERYFREE）。これらのS0取得・アサーション・raw SQL復元の**専用便宜関数のコード実装＝D6実装対象**（S0対象・SQL骨子は§2で特定済み＝**D5で確定・配備される前提〔環境/前提を配備される前提として確定〕**。便宜関数コードの実装のみD6に属する＝両者を別軸に分離）。**改訂9（ユーザー裁定Option A）: `dtb_cart`/`dtb_cart_item`はS0後始末対象であると同時にC-15のDBアサーション対象**＝肯定行はee実書込（persist/flush・数量変更）を確認、否定行はee非書込/参照（空カート非永続・表示は新規明細を作らない・一括追加は削除しない）を確認。DBアサーション対象テーブルはee実挙動に一致（ユーザー裁定=ee確定が正）。設計md:40のセッション保持規定との差異はBC-DRAFT⑫に明記。
- セッション観測: カート内容・`PRODUCT_SEARCH_REFERER`はセッション経由（Playwright storageState/HTTPクッキー）で観測。
- 破壊系afterEach（C-07・cart操作系〔C-02〜C-05,C-13〕・-038〔dtb_product_class値不変確認〕・SEED-DELIVERYFREE使用時）: §2のS0対象（`dtb_product_request`・`dtb_cart`/`dtb_cart_item`〔後始末〕・`dtb_base_info`）・復元SQLに従いraw SQLで復元。**外部隔離ハーネスは
  本機能では不要**（外部送達呼出なし＝CartController.php grep実測）。
- **オラクル独立性（T2規律）**: 期待値はすべて設計md（§1 L1）由来。eeのフォーム定義・実装値・翻訳訳語・実装詳細（AJAX機構・
  ルート名/メソッド）はセレクタ源／観測対象特定にのみ用い、期待値の根拠にしない。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。
(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01,C-09,C-10,C-11,C-12 | Playwright | GUI/DOM | 表示要素・空カート・同時注文エラー・計算表示・JSインクルード |
| C-02,C-03,C-04,C-05,C-13,C-14 | Playwright/request | GUI/HTTP | 数量更新/削除/増減/一括削除/セッション一致/入出力。**⚠BC-DRAFT⑫: カートはeeで`dtb_cart`/`dtb_cart_item`にDB永続（破壊系S0対象・§2）** |
| C-06（-006/-046） | **partial**（§4.1e） | GUI/HTTP | 購入手続き: 遷移原子=bound観測可／カートロック原子=ee不成立（`Cart::setLock`@deprecated）。ロック効果検証はF04-02スコープ |
| C-07（-039/-051/-068） | request+db.ts（`dtb_product_request`アサーション・afterEach S0） | HTTP+DB | 入荷通知依頼の登録/取消（論理削除）＝オラクルmd:40が規定する唯一の書込先。⚠カート実体の`dtb_cart`/`dtb_cart_item`永続はBC-DRAFT⑫・S0後始末対象 |
| C-16（-038） | **Playwright+DB確認** | HTTP+DB | **参照テーブル`dtb_product_class`の値不変確認**（eeが当該テーブルに書かない事実で不変を確定・ee`find`参照のみ）。afterEach S0 |
| **C-15（-020,-021,-022,-024,-025,-026,-027,-028,-030,-032,-033,-034,-036,-037,-040,-041,-042,-048＝18行）** | **Playwright+DB確認** | HTTP+DB | **カート実体`dtb_cart`/`dtb_cart_item`のDB副作用DB確認（ユーザー裁定Option A＝ee実書込を書込先の正）**。肯定12行=ee実書込（persist/flush・数量変更）のDBアサーション／否定6行=ee非書込/参照（空カート非永続・表示は新規明細を作らない・一括追加は削除しない）のDBアサーション。極性一致。afterEach S0（使い捨てcart_key隔離）。設計md乖離はBC-DRAFT⑫ |
| C-AUTH | Playwright（未ログイン/ログイン） | GUI/セッション | 権限・未ログイン入荷通知の参照元URL保存 |
| C-D1,C-D2,C-D3,C-D4,C-D5,C-D6,C-D7,C-D8＋C-DT(-029)/C-DT(-049) | **bound(EEドリフト)＝現eeでは失敗期待** | HTTP/DOM | 設計md正本でテストを書くが現eeにルート/機構/応答ペイロード/文言なし（C-D1〜C-D8・10行）＋ee実挙動が母集合の期待極性と矛盾（-029既登録=取消・-049 add_show不在）。ドリフト検出。bound成功と別勘定（§4.1d） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（75 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功（直接一致）** | **11** | 期待テキストが具体挙動の逐語/明確な言い換えで現eeでseed→自社DB/セッション/画面/DOM観測可能 |
| **bound成功（読み替え）** | **40** | グロッサリ/タウトロジー/否定側テンプレ/操作文脈がpushReceiveと一致する取消行＋-038/-039（旧24）＋**ユーザー裁定Option Aによりee実書込`dtb_cart`/`dtb_cart_item`へbindしたIT-26テンプレ カート操作文脈18行（C-15）**を具体挙動へ写像。現eeで観測可能（DBアサーション）。**codex最終是正で-055/-060をEEドリフトへ移送（旧42→40）** |
| **bound(EEドリフト)** | **14** | 設計md（正本）が規定するルート/機構/応答/文言がeeに無い10行（C-D1〜C-D8）＋**ee実挙動/機構が母集合期待と相違する4行**（-029〔既登録=ee取消でinsertせず〕・-049〔add_show不在＋極性矛盾〕・**-055〔母集合=一括削除リンク遷移／ee=button+確認ダイアログのフォーム送信・C-D9〕・-060〔母集合キー`cart.different_sell_groups`／ee=`front.cart.different_sell_groups`・C-D10〕**）。現eeでは失敗/乖離期待（§4.1d） |
| **partial** | **2** | -006/-046（購入手続き）＝遷移原子はbound観測可だが「カートロック」原子がee`Cart::setLock`(@deprecated未使用)で不成立（§4.1e） |
| **要実機** | **0** | 真の外部送達（メール/Messenger/unisearch/決済代行）がCartControllerに無い（grep実測） |
| **TBD** | **0** | **改訂9でユーザー裁定Option A適用**: D5=ee確定を書込先の正とし、旧TBD22件をper-IDでeeの実挙動に照合してbound20〔カート操作文脈18=C-15／-038=C-16／-039=C-07〕/EEドリフト2〔-029/-049〕へ確定＝TBD0。DBアサーション対象テーブルはee実挙動に一致。母集合の期待テキスト原義・極性は不変 |
| **excluded** | **8** | 新規保存/更新フォーム非存在でバリデーション観測対象なし（per-ID実引き・§4.6） |
| 合計 | **75** | 欠落0・理由なし重複0 |

11+40+14+2(partial)+0+0(TBD)+8=75（差分0）。

### 75対応表（期待テキスト要旨→会計→候補ケース）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | カート内商品一覧・数量・金額・送料無料案内を表示 | bound(直接) | C-01 |
| 002 | 入力した数量でカートを更新し買い物かご画面へ戻る | bound(読替) | C-02 |
| 003 | 当該商品をカートから取り除き買い物かご画面へ戻る | bound(直接) | C-03 |
| 004 | 当該商品の数量を1減らす | bound(直接) | C-04 |
| 005 | カートの内容を全て空にし買い物かご画面へ戻る | bound(直接) | C-05 |
| 006 | 数量を更新し追加メッセージが無ければロックして注文情報入力へ遷移 | partial（遷移=bound／ロック原子=drift） | C-06/§4.1e |
| 007 | 1商品をカートへ追加しカート内容をJSONで返す（単品add） | bound(EEドリフト) | C-D1 |
| 008 | 商品の配列をカートへ追加し**カート内容をJSONで返す**（add_bulk） | bound(EEドリフト) | C-D6 |
| 009 | 1商品を追加し買い物かご画面へリダイレクト（add_show） | bound(EEドリフト) | C-D2 |
| 010 | 必須バリでエラー表示・完了しない（前提=get XHR） | excluded | — |
| 011 | 必須バリでエラー表示されず継続（前提=入荷通知XHR） | excluded | — |
| 012 | サムネイル・商品名・単価・数量欄・金額・削除ボタンを表示 | bound(読替) | C-01 |
| 013 | 相関バリでエラー表示・完了しない（前提=数量入力） | excluded | — |
| 014 | 相関バリでエラー表示されず継続（前提=削除） | excluded | — |
| 015 | 相関バリでエラー表示されず継続（前提=一括削除） | excluded | — |
| 016 | 相関バリでエラー表示・完了しない（前提=購入手続きボタン） | excluded | — |
| 017 | DB相関でエラー表示されず継続（前提=空カート表示） | excluded | — |
| 018 | DB相関でエラー表示・完了しない（前提=JS挙動） | excluded | — |
| 019 | 買い物かご画面の表示時であること（見出し） | bound(読替) | C-01 |
| 020 | 登録内容の対象レコードが追加される（前提=合計＝表示/計算） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 021 | 登録内容の対象レコードが追加されない（前提=購入グループ複数） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 022 | 登録内容の対象レコードが追加される（前提=行の金額＝表示/計算） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 023 | 合計（税込）はカートの合計金額を表示 | bound(読替) | C-11 |
| 024 | 登録内容の対象レコードが追加される（前提=数量更新の下限） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 025 | 登録内容の対象レコードが追加される（前提=購入グループ単一性/最大長） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 026 | 登録内容の対象レコードが追加されない（前提=カート空/最大長+1） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 027 | 登録内容の対象レコードが追加される（前提=0以下再計算/最小長） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 028 | 登録内容の対象レコードが追加されない（前提=購入グループ複数/最小長-1） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 029 | 登録内容の対象レコードが追加される（前提=入荷通知既登録＝ee取消と矛盾） | bound(EEドリフト) | C-DT(-029)(§4.1d) |
| 030 | 実行結果の対象レコードが追加される（前提=カートとセッション） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 031 | 数量更新・増減・削除の結果は保存後の再表示で一致 | bound(読替) | C-13 |
| 032 | 更新内容の対象レコードの値が変更される（前提=XHRとセッション） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 033 | 更新内容の対象レコードの値が変更されない（前提=API） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 034 | 更新内容の対象レコードの値が変更される（前提=入力） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 035 | 買い物かご画面の再表示、もしくはカート内容のJSON（母集合実測・**codex R4是正**: 旧稿は「値が変更される→C-DBW」と誤記） | bound(読替) | C-08 |
| 036 | 更新内容の対象レコードの値が変更される（前提=失敗時出力） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 037 | 更新内容の対象レコードの値が変更される（前提=副作用/最大長） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 038 | 更新内容の対象レコードの値が変更されない（前提=dtb_product_class＝参照テーブル/最大長+1） | bound(読替) | C-16(§4.1b・dtb_product_class参照不変) |
| 039 | 更新内容の対象レコードの値が変更される（前提=dtb_product_request/最小長） | bound(読替) | C-07(§4.1b・dtb_product_request更新) |
| 040 | 更新内容の対象レコードの値が変更されない（前提=登録/更新/最小長-1） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 041 | 更新内容の対象レコードの値が変更される（前提=買い物かごを開く） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 042 | 実行結果の対象レコードの値が変更される（前提=再計算） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 043 | 当該商品をカートから取り除き買い物かご画面へ戻る | bound(直接) | C-03 |
| 044 | 当該商品の数量を1減らす | bound(直接) | C-04 |
| 045 | カートの内容を全て空にし買い物かご画面へ戻る | bound(直接) | C-05 |
| 046 | 数量を更新し追加メッセージが無ければ注文情報入力へ遷移 | partial（遷移=bound／ロック原子=drift） | C-06/§4.1e |
| 047 | 1商品をカートへ追加しカート内容をJSONで返す（単品add） | bound(EEドリフト) | C-D1 |
| 048 | 削除条件の対象レコードが削除状態にならない（前提=一括追加XHR） | bound(読替) | C-15(§4.1・ee実書込dtb_cart/dtb_cart_item・Option A) |
| 049 | 実行結果の対象レコードが削除状態になる（前提=add_show＝ルート不在＋極性矛盾） | bound(EEドリフト) | C-DT(-049)(§4.1d) |
| 050 | カート内容をJSONで返す（get XHR） | bound(EEドリフト) | C-D3 |
| 051 | 実行結果の対象レコードが削除状態になる（前提=入荷通知XHR） | bound(読替) | C-07 |
| 052 | サムネイル・商品名・単価・数量欄・金額・削除ボタンを表示 | bound(読替) | C-01 |
| 053 | 数量はテキスト入力欄（name="qty[..]"、最大3桁） | bound(EEドリフト) | C-D4 |
| 054 | 削除ボタンはアンカーにdata-method="put"を付けた削除エンドポイント送信（母集合原義・ee twig:257一致でDOM属性アサート） | bound(直接) | C-03 |
| 055 | 「カート一括削除」リンクからカート全消去エンドポイントへ遷移（母集合原義・ee=button+確認ダイアログのフォーム送信で機構相違） | bound(EEドリフト) | C-D9(§4.1d) |
| 056 | 購入手続きボタンは数量更新フォームのformactionを切り替えて送信 | bound(EEドリフト) | C-D5 |
| 057 | カート0件のとき「現在、買い物かごには商品が入っておりません」（md:150リテラル・eeで不成立） | bound(EEドリフト) | C-D8 |
| 058 | 数量スピン・カート用JS・リターゲ・おすすめJSをインクルード | bound(読替) | C-12 |
| 059 | 買い物かご画面の表示時であること（合計） | bound(読替) | C-01 |
| 060 | 調査補助のキー cart.different_sell_groups（母集合原義・ee実キーは front.cart.different_sell_groups でプレフィクス相違） | bound(EEドリフト) | C-D10(§4.1d) |
| 061 | 商品ごとの金額は単価×数量、カートアイテムの金額を表示 | bound(読替) | C-11 |
| 062 | 合計（税込）はカートの合計金額を表示 | bound(読替) | C-11 |
| 063 | 更新時に数量が1未満の商品はカートから削除 | bound(読替) | C-02 |
| 064 | 画面表示データでエラー表示されず継続（前提=購入グループ単一性） | bound(読替) | C-10 |
| 065 | 空カートの案内を表示し購入手続きボタンを出さない | bound(直接) | C-09 |
| 066 | 画面表示データでエラー表示されず継続（前提=0以下再計算） | bound(読替) | C-02 |
| 067 | 同時注文不可のエラーを表示 | bound(直接) | C-10 |
| 068 | 同一依頼が存在する場合は取消（削除）として扱う | bound(直接) | C-07 |
| 069 | カートはセッションに保持し追加・更新・削除のたびに保存 | bound(読替) | C-13 |
| 070 | 数量更新・増減・削除の結果は保存後の再表示で一致 | bound(読替) | C-13 |
| 071 | XHRのカート追加・**取得**は同一セッションのカートを参照（取得getがee不在） | bound(EEドリフト) | C-D7 |
| 072 | カート**内容取得・追加**・一括追加はJSONを返すXHR入口を持つ（get/add不在） | bound(EEドリフト) | C-D7 |
| 073 | 入力=数量配列/商品規格ID/追加用ID | bound(読替) | C-14 |
| 074 | 成功時出力=買い物かご再表示またはカート内容のJSON | bound(読替) | C-08 |
| 075 | 失敗時出力=リクエストエラー/入荷通知XHRエラーメッセージ | bound(読替) | C-14 |

`func_scope_check` 判定: 親75/75会計済み・欠落0・理由なし重複0。C-AUTH（L1-025）は母集合直行行が無く会計外
（C-07/C-10等の前提として反映）＝**差分0を本文内で実証可能**。O6は主張しない。

### 会計内訳（機械実証・再現用）

- bound成功直接（11）: 001,003,004,005,043,044,045,054,065,067,068
- bound成功読替（40）: 002,012,019,023,031,035,051,052,058,059,061,062,063,064,066,069,070,073,074,075＋038,039（旧24から-055/-060をドリフトへ移送：C-07=039／C-16=038）＋**ユーザー裁定Option AによりIT-26テンプレ カート操作文脈18行をee実書込dtb_cart/dtb_cart_itemへbind（C-15）: 020,021,022,024,025,026,027,028,030,032,033,034,036,037,040,041,042,048**（肯定12=020,022,024,025,027,030,032,034,036,037,041,042／否定6=021,026,028,033,040,048）
- bound(EEドリフト)（14）: 007,008,009,047,050,053,056,057,071,072（10・C-D1〜C-D8）＋**ee実挙動/機構が母集合期待と相違する4行: 029**（既登録=ee取消でinsertせず・C-DT(-029)）／**049**（add_show不在＋極性矛盾・C-DT(-049)）／**055**（母集合=一括削除リンク遷移／ee=button+確認ダイアログのフォーム送信・C-D9）／**060**（母集合キーcart.different_sell_groups／ee=front.cart.different_sell_groups・C-D10）
- partial（2）: 006,046
- 要実機（0）: —
- TBD（0）: —（改訂9でユーザー裁定Option A＝ee実書込を書込先の正とし、旧TBD22件をbound20〔C-15×18＋038/039〕/EEドリフト2〔029/049〕へ確定）
- excluded（8）: 010,011,013,014,015,016,017,018
- 11+40+14+2+0+0+8=75・差分0（001..075連番を全被覆・重複なし）

---

## §9 TBD・要実機・partial・EEドリフト・excluded・BC-DRAFT（正直な分離）

### 要実機（0件）／partial（2件）／TBD（0件・改訂9で確定）
本機能は受注・決済・在庫更新・外部送達を持たず（md:5,32）、CartController.phpにメール/Messenger/unisearch/決済代行の
呼出が**見当たらない**（grep実測）。よって真の外部送達に依存する行が無く**要実機=0**。**partial=2**（-006/-046＝購入手続き。
遷移原子はbound観測可だが「カートロック」原子がee`Cart::setLock`@deprecated未使用で不成立＝§4.1e。**codex R2/R3で読替→partialへ是正**）。

**TBD=0（改訂9で確定・ユーザー裁定Option A）**: 旧稿（codex R4/R5）は-020,-021,-022,-024,-025,-026,-027,-028,-029,-030,-032,-033,-034,-036,-037,-038,-039,-040,-041,-042,-048（IT-26汎用テンプレ21）＋-049の計22件を、期待テキストが**write target（副作用対象テーブル）を字面で特定しない**ためTBD（対象決定不能）としていた。改訂8はオラクルmd:40のセッション保持規定を根拠に20件をEEドリフト化したが、**codex R3が根拠不足（md:40のみ・設計内矛盾未解決／-038確定不能）と指摘し、ユーザーがOption Aを裁定**（「ee実書込（`dtb_cart`等）にbind＝bound」＝D5=ee確定を書込先の正とする・オラクル独立性よりD5=ee確定を優先）。**改訂9はper-IDでeeの実挙動に照合して22件を再判定**（eeの実書込＝カート操作は`dtb_cart`/`dtb_cart_item`〔CartService::save persist/flush〕・入荷通知は`dtb_product_request`〔pushReceive〕）:
- **bound（20件・ee実書込へ極性一致でbind）**: カート操作文脈18行（合計・行金額・数量更新・購入グループ・カート空・再計算・買い物かご表示・一括追加・入力・API・XHR・副作用・登録更新等）を、eeが実際に書く`dtb_cart`/`dtb_cart_item`へbind＝**肯定「追加/変更される」はee実書込のDBアサーション・否定「されない」はee非書込/参照のDBアサーション**（C-15）／-039（`dtb_product_request`更新・C-07）／-038（`dtb_product_class`にeeが書かない事実で「不変」を確定・C-16）。DBアサーション対象テーブルはee実挙動に一致（ユーザー裁定=ee確定が正）。
- **EEドリフト維持（2件・ee実挙動と真に矛盾）**: -029（既登録=ee取消〔remove:469-471〕でありinsertしない＝期待「追加」と矛盾・bind不可）／-049（add_showルート不在＋追加操作に対し「削除状態になる」の極性矛盾・bind不可）。
**母集合の期待テキスト原義（追加/変更される・されない・削除状態になる/ならない）・極性はいずれも不変**。設計md:40のセッション保持とeeのDB永続の差異はBC-DRAFT⑫に明記（オラクル汚染でなくD5=ee確定裁定＋設計乖離候補）。既存の入荷通知取消bound（-051=入荷通知XHR・-068=取消逐語）はC-07に維持。

### bound(EEドリフト)（母集合対応・14 test_id・§4.1d）
**ルート/機構/応答/文言不在の10行（C-D1〜C-D8）**: -007/-047（C-D1・単品`/cart/add`）／-009（C-D2・`/cart/add_show`）／-050（C-D3・`/cart/get`＋CORS）／-053（C-D4・
`name="qty[..]"`/再計算ボタン機構）／-056（C-D5・購入手続きボタン`formaction`切替）／**-008（C-D6・add_bulkの
カート内容JSON応答機構＝ee`{success:true}`のみ）／-071・-072（C-D7・取得`get`/単品`add`のXHR入口網）／-057（C-D8・
空カート常時表示文言md:150リテラル＝ee値はMSG-003側）**。**ee実挙動/機構が母集合期待と相違する4行**: -029（既登録=ee取消でありinsertせず＝期待「追加」と矛盾）／-049（add_show不在＋極性矛盾）／**-055（C-D9・母集合「一括削除リンクからエンドポイントへ遷移」を逐語保持／eeはリンクでなく`<button id=cart-clear-btn>`＋confirm確認ダイアログでform_cartをPOST送信＝機構相違・Cart/index.twig:302,141-145）／-060（C-D10・母集合キー`cart.different_sell_groups`を逐語保持／ee実キーは`front.cart.different_sell_groups`＝`front.`プレフィクス相違・Front/CartController.php:144・messages.ja.yaml:1317）**。いずれもee実挙動/機構と相違しbind不可＝失敗/乖離期待。**改訂9: IT-26テンプレ カート操作文脈18行はee実書込`dtb_cart`/`dtb_cart_item`へbind（C-15・§4.1）へ移送しドリフトから除外**。
いずれも**設計md（正本）どおりにテストを書き、現eeに対してはドリフト検出（失敗が正当）**として機能。「seed→期待観測可（成功）」とは誤記しない。bound成功（51件）と会計上区別（§8）。

**codex R1是正の要旨（bound偽陽性の除去）**: 旧稿は-008/-071/-072をbound成功、-057をbound(読替)としていたが、
(i)-008「カート内容をJSONで返す」はee`addBulk()`が`{success:true}`のみで**カート内容を返さない**（CartController.php:227-266実測）、
(ii)-071/-072が要求する取得`get`・単品`add`のXHR入口はee不在（grep0件）、(iii)-057の空カート文言md:150リテラルはee値
（MSG-003側）と相違、のいずれも**設計md（オラクル）どおりに書けば現eeで失敗**する＝EEドリフトが正しい分類。文言/応答を
曖昧化してbound成功に留めない（オラクル忠実性を優先）。

### excluded（8件・§4.6で詳述・per-ID実引き）
-010,-011,-013,-014,-015,-016,-017,-018。理由=新規保存/更新フォーム非存在（md:188）でバリデーション肯定/否定側の観測対象が
無い。各前提の実在挙動は他候補でbound化またはドリフト計上済み＝偽陰性なし。

### インフラ水準の前提事項（特定test_idに紐付かない・実装waveの前提）

| # | 事項 | 状態 |
|---|---|---|
| 1 | `dtb_product_request`/`dtb_base_info`/`dtb_cart`/`dtb_cart_item`のS0 db.ts配線（対象・SQL骨子は§2で特定済み） | **D5で確定・配備される前提（環境/前提を配備される前提として確定）**。便宜関数のコード実装はD6実装対象（別軸） |
| 2 | セッションカートの合成/直接投入手順（SEED-CART-*） | **D5で確定・配備される前提**（Playwright storageState/HTTP経由の投入方式）。投入helperのコード実装はD6実装対象（別軸） |
| 3 | `dtb_product_request`削除の物理/論理（`deleted_at`）実効 | ee実測でS0方式確定（SoftDeleteフィルタ有無を実測・断定回避） |
| 4 | 外部隔離ハーネス | **本機能では不要**（外部送達呼出なし＝CartController grep実測） |

### BC-DRAFT / DOC-DRAFT（設計md〔pf現行踏襲spec〕と ee実装の乖離候補・**断定回避**）

**T2規律**: オラクルは設計md。以下はeeを照合補助として観察した乖離候補で、**テストは設計mdどおりに書き**、乖離は
不具合候補として別掲する。ee側の断定は避ける。

| # | 設計md（オラクル） | ee観察（照合補助） | 乖離候補・区分 |
|---|---|---|---|
| ① | 再計算は`POST /{_locale}/cart/update`で数量配列(`qty[]`)を一括更新し買い物かご画面へリダイレクト（md:61,101-106） | `/cart/update`ルートがgrep0件。ee数量更新は`handleCartItem`set(:326)の**単品AJAX**でJSON応答（一括再計算フォーム/リダイレクトなし） | ルート/機構の相違（一括更新→単品AJAX）。§4.1d C-D4/C-02関連。断定回避 |
| ② | カート一括削除は`GET /{_locale}/cart/clear`（リンク遷移・md:65,85） | ee`clear()`は**POST** `/cart/clear`(:114)＋確認ダイアログ（`front.cart.delete_all_item_confirm`確認後submit・twig:141-146,302） | メソッド/UIの相違（GETリンク→POSTボタン+確認）。観測結果（全消去→cart画面）は一致 |
| ③ | 見出しは「買い物かご」（md:146） | `front.cart.page_title` ja値=「カート」（ja:1323） | 文言差異。期待は設計md値。要確認 |
| ④ | 購入手続きは`POST /cart/buystep`で数量更新→カートロック→注文情報入力へ（md:66,126-130,186） | ee`buystep()`は**GET** `/cart/buystep/{cart_key}`(:383)でsetPrimary/resetShoppingState/save→shopping redirect。**数量更新・明示的「ロック」処理は本メソッドに見当たらない** | メソッド/機構の相違（数量更新・ロックの所在）。遷移（注文情報入力へ）は一致。断定回避（ロック相当の内部状態がCartService/別経路の可能性） |
| ⑤ | 空カート文言（常時表示表）「現在、買い物かごには商品が入っておりません。」（md:150）／MSG-003「現在カート内に商品はございません。」（md:173） | ee`front.cart.no_items`=「現在カート内に商品はございません。」（ja:1312）＝MSG-003側と一致 | **設計md内で空カート文言が不整合**（常時表示表 vs MSG-003）。ee値はMSG-003側。設計md整合の要確認（DOC-DRAFT） |
| ⑥ | 数量入力欄は`name="qty[商品規格ID]"`・最大3桁、再計算ボタン`name="update"`の画像（md:83,259） | ee数量inputは`type="text"`・`data-quantity-input`（name無し）・`max`は在庫依存(:265)、再計算ボタン無し（AJAX単品） | 機構/属性の相違。§4.1d C-D4。テキスト入力欄自体は存在 |
| ⑦ | `POST /cart/add_bulk`はカート内容をJSONで返す（md:68,136） | ee`addBulk()`は`{success:bool}`のJSONを返す（カート内容を含まない・:265） | 応答ペイロードの相違（成功フラグ vs カート内容）。追加自体は観測可 |
| ⑧ | 単品追加`POST /cart/add`・追加して表示`POST /cart/add_show`・取得`GET /cart/get`（+CORS/OPTIONS）（md:67,69,70,72） | これらのルート・CORS・OPTIONSがgrep0件（eeは`add_bulk`のみ） | §4.1d C-D1/C-D2/C-D3のEEドリフト一次根拠。断定回避 |
| ⑨ | 合計en「Subtotal(tax incl.)」（md:149） | ee`front.cart.total_label` en=「Total (tax incl.)」（en:1128） | en文言差異。期待は設計md値。要確認 |
| ⑩ | 翻訳キー: `cart.different_sell_groups`／`error_messages.product.request_notlogin.message`／`front.product_request.success`等（md:158-161） | eeキーは`front.cart.different_sell_groups`／`front.cart.product.request_notlogin.message`／`front.cart.product_request.success`（プレフィクス相違。同名`front.product_request.success`=別値ja:957が併存） | 翻訳キー空間の相違。文言（ja）は概ね一致だがキーが異なる。en同時注文文言はeeに不在＝**設計md提供のen値を仕様として確定**（英語仕様は設計mdオラクル一次・ee翻訳は裏取り補助） |
| ⑪ | 英語は`Cart/index.en.twig`の表示文言を正とする（md:152,163） | eeに`Cart/index.en.twig`は実在せず（find0件）。英語はロケールキー`|trans`で解決 | テンプレ構造の相違（pf別テンプレ→eeロケールキー）。英語仕様の正は設計md表示メッセージ節＋観点で**確定**（設計mdオラクル一次・ee翻訳は裏取り補助・不在/差異はEEドリフト） |
| ⑫ **（codex R3・重大／ユーザー裁定Option A）** | カートはセッションに保持し、永続化テーブルとして`dtb_product_class`/`dtb_base_info`/`dtb_product_request`を参照（md:40,240）＝**カート実体はDB行を持たない前提** | eeは`CartService::save()`で`Cart`(`dtb_cart`:Cart.php:32)/`CartItem`(`dtb_cart_item`:CartItem.php:29)を`persist`/`flush`（CartService.php:399-419）。**GET /cartの`index()`も:98で`save()`**（:96で`$Cart!==null`ガード＝空カートは非永続）。`clear()`はCartを`remove`。カートは**eeでDB永続**（セッションは`cart_keys`等の参照キーのみ） | **設計md（セッション保持）とee実装（DB永続）の重大な乖離**。**改訂9: ユーザー裁定Option A＝D5=ee確定を書込先の正とし、eeが実際に書く`dtb_cart`/`dtb_cart_item`へIT-26テンプレ カート操作文脈18行を極性一致でbind（C-15・肯定=ee実書込/否定=ee非書込のDBアサーション）**。オラクル汚染でなくD5=ee確定裁定に基づく（オラクル独立性よりD5=ee確定を優先）。設計との差異は本BC-DRAFT⑫に**設計乖離候補**として明記（不具合候補として要確認）。ee実挙動と極性が矛盾する-029/-049のみEEドリフト。**要実機ではない**（自社DB） |

候補規律: 環境/前提〔スキーマ/S0接続配線/fixture/隔離ハーネス〕は**D5で確定・配備される前提**、spec/db.ts便宜関数/pageのコード実装・実走は**D6実装対象**（両者を別軸に分離）・O5未確定・O6/聖域/多軸/C6C7を主張しない。

---

## 付録: 作業実測

- 参照物: 設計mdオラクル 1（342行）／母集合 1（75行）／観点表 1／先例 1（f04-04）／ee照合補助（CartController.php・
  Cart/index.twig・DtbProductRequest.php・NotifylistProductAction.php・messages.ja/en.yaml）。
- L1 claim数: **26確定・TBD 0**。候補ケース（bound成功 C-01〜C-15＋C-16/C-07/C-AUTH・bound(EEドリフト) C-D1〜C-D10/C-DT(-029)/C-DT(-049)）。
  母集合対応=bound成功直接11・bound成功読替**40**・bound(EEドリフト)**14**・partial 2・要実機0・**TBD 0**・excluded 8（差分0）。
  ※**codex最終是正**: -054/-055/-060の期待結果を母集合原義へ逐語復元し、eeと照合＝-054はbound維持（ee twig:257がdata-method="put"で一致・DOM属性アサート）、-055（C-D9・母集合リンク遷移／ee button+確認ダイアログ）・-060（C-D10・母集合キーcart.different_sell_groups／ee front.cart.different_sell_groups）はEEドリフト化＝読替42→40・ドリフト12→14。
  ※codex R1: -008/-071/-072/-057をbound→EEドリフトへ移送（応答ペイロード/入口/文言のオラクル忠実性）・-073のC-01二重計上を解消。
  ※codex R2: bound C-01/C-02/C-06のL1参照を原子化。※codex R3: **カートがeeでDB永続（`dtb_cart`/`dtb_cart_item`）と判明**し
  「セッション専有・唯一のDB書込」の誤りを是正（BC-DRAFT⑫・S0拡張）。※codex R4/R5: IT-26汎用テンプレ22件をwrite target決定不能でTBDへ整理。
  -035は母集合実測「再表示 or カート内容JSON」で成功時出力行→C-08へ是正（旧C-DBW記載は誤り）。
  ※**改訂8（オラクルmd:40一次根拠のEEドリフト化）に対しcodex R3 Majorが根拠不足（md:40のみ・設計内矛盾未解決／-038確定不能）と指摘**。
  ※**改訂9（本改訂・codex R3 Major＋ユーザー裁定Option Aの最終是正）**: **ユーザー裁定＝「ee実書込（`dtb_cart`等）にbind＝bound」＝D5=ee確定を書込先の正**（オラクル独立性よりD5=ee確定を優先）。
  旧TBD22件をper-IDでeeの実挙動に照合＝**カート操作文脈18行をee実書込`dtb_cart`/`dtb_cart_item`へ極性一致でbind（C-15・肯定12=ee実書込アサーション/否定6=ee非書込アサーション）**、-039（`dtb_product_request`更新・C-07）/-038（eeが`dtb_product_class`に書かない事実で不変確定・C-16）はbound、
  ee実挙動と極性矛盾する-029（既登録=ee取消）/-049（add_show不在）のみEEドリフト維持。会計 11/24/30/2/0/0/8 → **11/42/12/2/0/0/8**。DBアサーション対象テーブルはee実挙動に一致（ユーザー裁定=ee確定が正）。母集合期待テキスト原義・極性は不変。
  ※**codex最終是正（母集合忠実性3行）**: -054/-055/-060の期待結果を母集合原義へ逐語復元。-054はee twig:257一致でbound維持、-055/-060は母集合が要求する機構（一括削除リンク遷移／キー字面`cart.different_sell_groups`）がeeと相違（button+確認ダイアログ／`front.`プレフィクス）のためEEドリフト化。会計 11/42/12/2/0/0/8 → **11/40/14/2/0/0/8**（読替-2/ドリフト+2）。母集合期待テキスト原義・極性は不変。
- **要点**: (1)本機能は外部送達なし＝要実機0・隔離ハーネス不要。partial 2（-006/-046ロック原子）。(2)**ユーザー裁定Option A＝ee実書込を書込先の正**: eeが実際に書く`dtb_cart`/`dtb_cart_item`（カート操作・C-15）・`dtb_product_request`（入荷通知・C-07）へbind、参照テーブル`dtb_product_class`はeeが書かない事実で不変確定（C-16）。設計md:40のセッション保持規定との差異はBC-DRAFT⑫に設計乖離候補として明記。(3)**設計md（pf/HareruyaEc）とee実装のルート/機構差が顕著**（`/cart/update`・`/cart/add`・
  `/cart/add_show`・`/cart/get`・formaction・qty[]・clear method・buystep method）＝EEドリフトで正直に分離。(4)**改訂9（ユーザー裁定Option A）: 旧TBD22件を、per-IDでeeの実挙動に照合してbound20〔C-15×18＋-038/-039〕/EEドリフト2〔-029/-049〕へ確定**＝TBD 0。ee実書込を書込先の正とし、DBアサーション対象テーブルはee実挙動に一致。母集合期待テキスト原義・極性は不変。
- **未検証事項（codexレビュー/実機で要確認）**: BC-DRAFT①〜⑪（特に④buystepのロック相当内部状態の有無、③⑤⑨⑩の文言/キー、
  ⑧のドリフトに未探索間接経路が無いか）、`dtb_product_request`削除の物理/論理実効、`dtb_product_class`参照不変の実DB確認（-038）、S0/セッション投入の実配線（環境/前提はD5配備前提・便宜関数コードの実装はD6実装対象）。
  過剰主張なし・数値は実測・grep0件は「見当たらない（断定回避）」として記載。
