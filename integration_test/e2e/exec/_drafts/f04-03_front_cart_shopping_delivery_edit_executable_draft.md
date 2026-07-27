# B1候補: f04-03 注文時の配送先登録・変更 — 実行可能設計候補（母集合63全量踏破・S0/seed/隔離ハーネスはD5確定＝配備済み前提）

> 2026-07-25 ／ **候補グレード（candidate・D6前・O5未確定）**
> **改訂（2026-07-26・D5確定前提化＝留保外し）**: **D5（スキーマ/移行先/隔離ハーネス確定フェーズ）を確定済みとして扱う**。
> よって(1) S0の実配線・破壊系S0の実SQL・共有隔離ハーネス（Mailer=`null://null`／Messenger asyncを`in-memory://`へ上書き＋worker非起動／
> UniSearch no-op上書き／起動時外部host非到達アサート）・アドレス帳件数seed・pg_constraint照会を**配備済み/実施済み前提**とし、
> bound成功34は**配備済み前提でbound観測可能＝実行可能**と記述する（「未整備・現時点実走不可・実装待ちbound設計・@TBD(ハーネス)・@TBD-D5（S0/ハーネス/スキーマ配線）」の
> live留保表現を撤回。隔離とS0の設計は§2に維持）。(2) **境界値ケース（-025〜-028）の具体桁をD5確定値で確定＝fixture固定**:
> 設計md「フォーム種別の確認値」（md:141「移行先の `address_name` 列長は128」・md:144「`tel_len`＝5」）とee Entity/スキーマ
> （`CustomerAddress.php:403` address_name列長128・name01/02列長255・tel01-03列長5・postal_code列長8）でfixture_versionを固定し、
> 「具体桁は@TBD-D5」を撤回した。**本機能はTBD 0のため会計移動なし**（会計・区分・母集合identity・期待値は不変＝bound成功34/bound(EEドリフト)28）。
> **bound(EEドリフト)28（会員フローに既存お届け先読込/更新経路なし等）は設計md規定どおり現eeでは失敗期待のまま維持**（D5確定でも現eeの実装不在は変わらない）。
> **改訂（2026-07-26・codex R2是正＝英語仕様の@TBD解消）**: 英語仕様（-EN・C-EN-01・§5）を**設計md（オラクル）の確定値としてbound化**する（`@TBD-D5`/`@TBD-EN`のlive留保を撤回）。設計md（md:102-117）が見出し「Register New/Change Address」・注意文・上限文言「The maximum number of addresses registration is exceeded.」・国pref文言「The combination of country and region is incorrect.」を英語表示文言として規定し、pf現行踏襲資源（`Shopping/delivery_edit.en.twig:19`・`message.en.yml:1032/662`）が裏取りする＝**確定**。ee `messages.en.yaml`はこの確定値に対し差異（見出しen=「Add Delivery Address」:1366）または不在（上限・国pref・注意文のenキーがgrep0件）であり＝**EEドリフト**（ja側ドリフトC-D9/C-D2/C-D3と同一事象のen面。en単独の新規ドリフトC-ID・母集合行は増やさない）。母集合（63行）に-EN test_idが無いため英語仕様は**会計外補完**（§4.4）で記録し**母集合会計（34/28/0/0/0/1）は不変**。
> **改訂（2026-07-26・操作手順の方法論是正）**: 配送先の新規登録/編集画面（`GET /shopping/shipping_edit/{id}`=ShoppingController.php:792）は
> 購入手続きフロー内のサブ画面で、入力画面から遷移して初めて到達する。従来の「seed→直GET」は**単体テスト**であり結合/e2eでない
> （`shippingEdit`は`getPurchaseProcessingOrder`未取得時にlogin/errorへリダイレクト:798-805・`{id}`はShipping ID）。→§2/§4の到達・操作手順を
> **購入フロー駆動**（`SEED→GET /cart:80→GET /shopping:123→お届け先追加/変更リンク index.twig:257→GET /shopping/shipping_edit/{id}:792→入力→POST /shopping/shipping_edit/{id}/complete:881→redirect('shopping'):993で反映観測`）へ是正。
> **直GET維持のtest_idは0件**（到達に必ず処理中受注＋当該Shippingを要し、上限404も追加リンク経由のフロー到達で発火＝§2例外節）。
> **期待値・オラクル・会計区分・母集合identityは不変**（変えたのは前提/操作/実行方法の到達・操作方法と、codex R3是正での-031のexcluded→C-18 bind化＝TSV 61→62行）。生成TSV=`tsv/f04-03_front_cart_shopping_delivery_edit_concretized.tsv`（62行11列・母集合63−excluded1）。
> **本機能のカスタマイズ区分=カスタマイズ（現行踏襲）＝T2（excel-primary）**。オラクル（期待値の正）は設計書md
> `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md`＋観点表＋基本設計。**ee実ソースはL1出典にしない**
> （照合補助＝セレクタ源・踏襲確認・観測対象テーブル特定・翻訳キー実在確認のみ）。SUT/オラクル不変・母集合期待は改変しない。
> テンプレは先例 `_drafts/f04-04_front_cart_shopping_complete_executable_draft.md`（codex R6候補確定・同カート系）に厳密に倣う
> （会計・§4自己完結・S0・EEドリフト分類・外部隔離ハーネス）。**ただし英語仕様(-EN)はf04-04の`@TBD-D5`踏襲を止め、設計md確定値としてbound化＝ee差異/不在はEEドリフト（codex R2是正・§4.4/§5）**。
> source_class=excel-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。fixture_version は境界値の具体桁をD5確定値（設計md確認値＋ee Entity/スキーマ）で固定（source_class確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 出力隔離: 本md＝`_drafts/`。正式パス直下には書かない。
>
> **★本機能の最重要事実（EEドリフトの構造）**: 設計md（＝pf-eccube3 HareruyaEcプラグインの購入手続き中お届け先編集）が規定する
> **ルート`/{_locale}/shopping/delivery/{id|new}/edit`・`/confirm`／テンプレ`delivery_edit.twig`／見出し「配送先の新規登録・変更」／
> 上限超過エラー`front.shopping.error.customer_address_max`→ご注文方法指定へ戻す／国pref不整合`form.country.error.invalid`→国にエラー付与／
> `mode=confirm`隠し項目／お届け先IDのCookie保存／変更不可の注意文**は、**現ee（EC-CUBE Enterprise）に該当実装が見当たらない**
> （ee照合・grep実測）。現eeは同等機能を**`shopping_shipping_edit`（`/shopping/shipping_edit/{id}` GET/POST・`/shopping/shipping_edit/{id}/complete` POST）**で提供し、
> **`ShoppingShippingType`（`CustomerAddressType`継承）でお届け先を`dtb_customer_address`へ「常に新規」persist/flush**する。
> **★重大なEEドリフト（codex R1指摘・ee実測で確定）: 現eeの会員購入手続きフローの標準`ShoppingController`経路には「既存お届け先を指定IDで読み込んで編集・更新する」実装が不在（拡張イベント差込は未検証）。**
> `shippingEdit`会員パスは常に`new CustomerAddress()`を生成し（`ShoppingController.php:814-826`）、URLの`{id}`は**お届け先IDでなくShipping ID**である
> （設計md〔pf〕の`/shopping/delivery/{id}/edit`＝お届け先ID読込とは別物）。`shippingEditComplete`も会員時は常に`new CustomerAddress()`を`persist`し既存行を`UPDATE`しない（`ShoppingController.php:913-958`）。
> したがって設計mdが規定する**既存お届け先読込（-005,-045）・既存レコードの値変更（-032,-034,-036,-037,-039,-041,-042）・既存アドレスの編集権限（-035）**は
> **現eeに実装が無く＝bound(EEドリフト)＝現eeでは失敗期待**である。
> **機能の骨格（編集画面表示・必須マーク・国pref表示連動・確認画面・戻る送信・新規お届け先のDB登録・無効入力時の非登録・セッション保存・登録権限）は現eeで観測可能＝bound成功**だが、
> 上記の既存編集/更新機構に加え、pf-eccube3固有機構（route名・見出し文字列「配送先の新規登録・変更」・変更不可の注意文・上限→ご注文方法指定リダイレクト・両エラー文言キー・mode=confirm・**Cookie保存**）は**現eeに実装が無く
> ＝bound(EEドリフト)＝現eeでは失敗期待**として bound成功と会計区別する。テストは**設計md（正本）どおりに書き**、現eeに対してはドリフト検出として機能。
> pf-eccube3側の踏襲挙動は`app/Plugin/HareruyaEc/Service/DeliveryService.php`で確認できる（照合補助）。
>
> **母集合63の会計（差分0・codex R1/R3是正後）**: bound成功**34**（§4.1・現eeで`shopping_shipping_edit`＋seed＋S0復元＋DB/UIアサーションで観測可＝新規登録画面表示/必須マーク/国pref連動/新規お届け先登録/無効入力非登録/セッション保存/登録権限/登録による`dtb_shipping`反映。-020をC-08へ・-031をC-18へ再配賦＝codex R3）
> ＋**bound(EEドリフト)28**（§4.1d・既存編集読込〔C-D5〕・既存値更新〔C-D6〕・Cookie保存〔C-D7〕・編集権限〔C-D8〕・見出し/注意文〔C-D9〕・上限リダイレクト〔C-D1〕・上限文言キー〔C-D2〕・国pref不整合〔C-D3〕・mode=confirm〔C-D4〕＝設計md〔正本〕は規定するが現eeに
> 該当実装が無く**現eeでは失敗期待**）＋**partial 0**＋**要実機 0**（外部送達を伴う母集合行が無い。住所自動入力の外部サービスは
> 設計md〔md:33,172〕が「扱わない」と明示し母集合にも該当行なし）＋**TBD 0**（期待テキストに「移行先で要確認」の非アサーション行なし。※C-EN-01英語仕様は設計md確定値でbound化〔ee差異/不在はEEドリフト＝C-D9/C-D2/C-D3のen面〕・母集合-EN行が無いため会計外補完で母集合TBDに非算入＝§4.4/§4.5）
> ＋**excluded 1**（§4.6・前提と期待の矛盾〔-015〕）。**34+28+0+0+0+1=63・差分0**（§8で機械実証・python検算で重複0/欠番0/1..63全被覆）。
> **codex R3是正**: (a) -020（IT-26「登録内容…追加される」＝期待テキストは肯定の新規登録追加）を、§0判定原則（前提列=生成器ノイズ・期待テキストでbind）に従い**excludedからbound(読替)/C-08へ再配賦**（他のIT-26「追加される」行〔-022,-024,-025,-027,-029〕と同一扱い。premise「国pref不整合」はノイズラベル）。(b) -031（登録後の`dtb_shipping`反映）を、**登録による`dtb_shipping`の直接保存＝当機能の登録・更新責務**（md:195,203・ee `setFromCustomerAddress`947→flush970）につき**excludedからbound/C-18へ再配賦**（「反映はF04-02」が指す選択反映部のみF04-02委譲）。excludedは-015の1件のみ。

---

## §0 版固定・判定原則・オラクル独立性

- **設計書正本（オラクル）**: `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md`（本repo・301行。以下「md:行」）。
  md:9「カスタマイズ区分はカスタマイズであり、挙動の確認は現行リポ（pf-eccube3）の実装を参照する。DB関連の記述は… ec-cube-enterprise を正とする。」
  → **挙動＝pf-eccube3現行踏襲spec（設計md）がオラクル、DB永続化先名称のみee**。
- **観点表**: `integration_test/integration-test-viewpoints.md`（IT-22/IT-26/IT-23/IT-05/IT-12/IT-15/IT-20/IT-25/IT-02/IT-16由来ラベル）。
- **ee実ソース（照合補助＝L1出典にしない）**: `/home/y-saito/Developments/ec-cube-enterprise`（作業ツリー実測・版固定D5/D6）。
  セレクタ源・踏襲確認・観測対象テーブル特定・翻訳キー実在にのみ用いる。
  - Controller = `src/Eccube/Controller/Front/ShoppingController.php`
    - `shippingEdit()`（`#[Route '/shopping/shipping_edit/{id}' name=shopping_shipping_edit GET|POST]`=792・`#[Template 'Shopping/shipping_edit.twig']`=793）
      = お届け先の新規作成/編集画面。会員時は上限判定（`count($Customer->getCustomerAddresses()) >= eccube_deliv_addr_max`→**`throw new NotFoundHttpException()`**＝819-823）・
      `ShoppingShippingType`フォーム組成（830）・送信妥当時`delivery_confirm.twig`描画（861）・それ以外は`shipping_edit.twig`描画。
    - `shippingEditComplete()`（`#[Route '/shopping/shipping_edit/{id}/complete' POST]`=881）=`mode=back`→session保持→`shopping_shipping_edit`へredirect（903-910）・
      `!$form->isValid()`→`shopping_shipping_edit`へredirect（938-941）・`persist($CustomerAddress)`（958）・`executePurchaseFlow`＋`flush()`（961-966）・
      **`session->set(OrderHelper::SESSION_SHOPPING_CUSTOMER_ADDRESS_ID, $CustomerAddress->getId())`（975）**・`redirectToRoute('shopping')`（994）。**Cookie設定は無い（grep実測0件）**。
  - Form = `src/Eccube/Form/Type/Front/ShoppingShippingType.php`（`getParent()`=`CustomerAddressType::class`・`getBlockPrefix()`=`shopping_shipping`）
    → `src/Eccube/Form/Type/Front/CustomerAddressType.php`: `address_name`（required=true・NotBlank・Length max=`eccube_customer_address_length_address_name`＝56-63）／
    `name`（required=true＝65-66）／`kana`（**required=false**＝68-69）／`company_name`（**required=false**＝95-96）／`country`（required=true＝103-106）／
    `postalCode`（required=true＝113-114）／`abroadPostalCode`（required=false＝118-119）／`address`（AddressType＝pref/addr01/addr02＝129）／`tel`（required=true＝130-131）。
    既定国=JAPAN（140-141）・国外時PREF_ABROAD自動設定（179）。**国pref不整合の`form.country.error.invalid` addError は現eeに見当たらない（grep実測0件）**。
  - Template = `Shopping/shipping_edit.twig`（見出しキー`front.shopping.shipping_edit_header_customer`=74・`address_name`ラベル＋`common.required`必須マーク=88-89・
    `name`必須マーク=105・国変更でform submit＝35・action=`shopping_shipping_edit`=80）／`Shopping/delivery_confirm.twig`（確認画面）。
  - 副作用テーブル（ee照合・L1出典にしない）: `dtb_customer_address`（`CustomerAddress.php`・`address_name` length128=403・name01/02=95/98・kana01/02 nullable=101/104・
    company_name nullable=107・tel01-03 length5=445/448/451）／`dtb_shipping`（登録時の直接更新＝F04-03責務、登録後の選択確定でどのお届け先を当該注文へ充てるか＝F04-02委譲）。
  - config: `app/config/eccube/packages/eccube.yaml`（`eccube_deliv_addr_max: 20`=106・`eccube_customer_address_length_address_name: 128`=193）。
  - session: `src/Eccube/Service/OrderHelper.php`（`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID='eccube.front.shopping.customer_address_id'`=80・remove=306/319）。
- **pf-eccube3（設計オラクルの踏襲確認元・照合補助）**: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php`
  = 国pref不整合→`$form->get('country')->addError(new FormError($app->trans('form.country.error.invalid')))`（59）・上限`$app['config']['deliv_addr_max']`（85）→
  `$app->addError('front.shopping.error.customer_address_max')`（87）。翻訳=`message.ja.yml:1462 customer_address_max: お届け先登録数の上限を超えています。`／
  `message.en.yml:1032: The maximum number of addresses registration is exceeded.`。**設計mdの表示メッセージ・エラー挙動はこのpf HareruyaEc実装に一致**（＝現行踏襲spec）。
- **母集合**: 本63行（-001〜-063・`f04-03_..._mother_slice.tsv`）。
- **判定原則**: 母集合の観点ラベル（IT-15/IT-20/IT-25/IT-12/IT-16等）・前提列・操作手順列は**生成器ノイズ**。bindは各行の**「期待結果／レスポンス」実テキスト**で判定し極性も期待テキストで確認する（§8に全63行併記）。
- **外部依存の切り分け**: 本機能の母集合行は**すべて自社DB/セッション/画面で観測可能**（お届け先の`dtb_customer_address`登録・更新、セッション保存、
  編集/確認画面表示、バリデーション）。**真の外部送達を伴う母集合行は無い**。住所自動入力（`yubinbango.github.io`外部JS＝`shipping_edit.twig:32`）は設計md（md:33,172）が
  「本書では仕様確定しない／扱わない」と明示し母集合にも該当行が無い＝**要実機0**。

---

## §1 L1原子オラクル表（出典=設計書md／観点表。ee実ソースはL1出典にしない）

| oracle_id | 観点 | claim（現行踏襲spec＝設計mdが正） | 根拠(md:line) | 現ee照合（補助・L1出典にしない） |
|---|---|---|---|---|
| L1-F0403-001 | route/entry | お届け先編集=`GET/POST /{_locale}/shopping/delivery/{id\|new}/edit`、確認登録=`POST /{_locale}/shopping/delivery/{id\|new}/confirm`。登録完了→当該注文の配送先選択へ遷移。新規上限超過→ご注文方法指定へ戻す。編集画面「戻る」→ご注文方法指定 | md:56-62,235-236 | eeは`shopping_shipping_edit`/`shopping_shipping_edit_complete`で提供（route名差＝ドリフト。ShoppingController.php:792,881） |
| L1-F0403-002 | display_field | 編集画面の見出しは「配送先の新規登録・変更」。ログイン会員名・変更不可の案内文・各入力欄（配送先名称/氏名姓名/氏名カナ姓名/電話3分割/国/郵便番号/住所〔都道府県＋住所2行〕/会社名）を表示 | md:70,104 | ee見出しキー`shipping_edit_header_customer`ja値=「お届け先の追加」・en値=「Add Delivery Address」（messages.en.yaml:1366。設計md英語「Register New/Change Address」と差＝BC-DRAFT①・en面ドリフト）。入力欄はshipping_edit.twig:88-で表示 |
| L1-F0403-003 | required_mark | 配送先名称・配送先氏名・電話番号・国・郵便番号・住所に必須マーク画像を表示。配送先氏名カナ・会社名には必須マークが無い | md:71 | ee CustomerAddressType: name/country/postalCode/tel/address_name required=true、kana/company_name required=false（56-131） |
| L1-F0403-004 | zip | 国によって郵便番号欄が分割（zip01・zip02）または単一（zipcode）に切替 | md:72,141 | ee SplitPostalType（分割）／abroadPostalCode（国外単一）・国変更でsubmit（shipping_edit.twig:35） |
| L1-F0403-005 | country_pref_display | 国の選択に応じて都道府県の表示・隠しを切り替える | md:73 | ee 国change→form submit（shipping_edit.twig:35）・PREF_ABROAD（CustomerAddressType:179） |
| L1-F0403-006 | submit_mode | 編集画面の送信は`mode=confirm`の隠し項目を伴い確認画面用の遷移を行う | md:74 | eeは`mode=confirm`隠し項目を持たず、valid時に`delivery_confirm.twig`描画（861）＝機構差＝ドリフト |
| L1-F0403-007 | notice_msg | 変更不可の注意文「既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので…弊社へご連絡をお願い致します。」を編集画面に表示 | md:105 | ee `shipping_edit.twig`に当該注意文が見当たらない（grep0件・断定回避）＝BC-DRAFT②／LS |
| L1-F0403-008 | address_limit | 新規登録時、アドレス帳件数が登録上限（20）以上なら登録不可＝上限超過エラーを出しご注文方法指定へ戻す。既存編集（IDあり）は上限判定をスキップ | md:83,90,125,147,153-154,235,250 | ee上限=`eccube_deliv_addr_max:20`（eccube.yaml:106）だが超過時は**NotFoundHttpException（404）**（ShoppingController.php:821-823）＝挙動差＝ドリフト |
| L1-F0403-009 | country_pref_integrity | 国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として国にエラーを付与し編集画面を再表示 | md:73,126,155,213,251 | ee CustomerAddressTypeに`form.country.error.invalid` addErrorが見当たらない（grep0件・断定回避）＝ドリフト（pf DeliveryService.php:59） |
| L1-F0403-010 | register | 確認画面から、戻る送信でなく検証通過のとき、住所と配送先名称を登録（persist/flush）し当該注文の配送先選択（お届け先反映）へ遷移 | md:60,88-94,181 | ee shippingEditComplete: persist（958）＋flush（966）＋`redirectToRoute('shopping')`（994） |
| L1-F0403-011 | db_effect | 登録先は`dtb_customer_address`（氏名・氏名カナ・電話番号・国・郵便番号・都道府県・住所・会社名）。配送先名称は`dtb_customer_address.address_name`（長さ128・現行`dtb_customer_address_sub.address_name`） | md:39,134,191-203 | ee `CustomerAddress.php:403` address_name length128・現eeに`dtb_customer_address_sub`無し（grep0件＝設計mdの統合記述と一致） |
| L1-F0403-012 | session_cookie | 登録後のお届け先IDをセッションとCookieへ保存し配送先選択で参照 | md:93,128,165,242,279,294 | eeは**セッションのみ**（`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID`＝ShoppingController.php:975/OrderHelper.php:80）。**Cookie保存は見当たらない（grep0件）**＝Cookie部はドリフト（BC-DRAFT③） |
| L1-F0403-013 | back/invalid | 確認画面で戻る送信→編集画面を表示。フォーム検証不備→編集画面を再表示 | md:60,94,156,234,252 | ee `mode=back`→session保持→shipping_edit redirect（903-910）・`!isValid`→shipping_edit redirect（938-941） |
| L1-F0403-014 | error_msg_key | 上限文言キー`front.shopping.error.customer_address_max`＝「お届け先登録数の上限を超えています。」。国pref不整合キー`form.country.error.invalid` | md:114-115 | 両キーとも現eeに不在（grep実測0件）＝EEドリフト（en面含む）・英語値は設計md/pf確定（pf `message.en.yml:1032/662`に実在）／LS |
| L1-F0403-015 | auth | 会員ログインを前提とし、自分のアドレス帳に対して登録・編集できる | md:220-223 | ee `isGranted('IS_AUTHENTICATED_FULLY')`分岐＋`setCustomer($Customer)`（824,916-918） |
| L1-F0403-016 | field_optional | 配送先氏名カナ・会社名は任意、それ以外（名称/氏名/電話/国/郵便/住所）は必須 | md:71,127,135-145,211 | ee CustomerAddressType required値と一致（kana/company=false・他=true） |
| L1-F0403-017 | existing_order_isolation | 既に受け付けた注文の注文者・配送先は本画面の登録・変更で変わらない（画面上で注意を案内する） | md:166,242,300 | 注意案内はL1-007と同（ee twigに文言見当たらず＝BC-DRAFT②）。DB分離自体はF04-02反映範囲 |
| L1-F0403-018 | shipping_reflect | 登録後の選択で当該注文の配送先（`dtb_shipping`）へ反映する（反映はF04-02） | md:195,203,233 | ee shippingEditComplete: `setFromCustomerAddress`（947）→`flush`（970）で当該注文の`dtb_shipping`を更新＝**登録による`dtb_shipping`保存は当機能責務＝C-18でbound**。選択操作での最終お届け先反映のみF04-02委譲（codex R3是正） |
| L1-F0403-019 | no_delete | 当機能の登録・更新は対象テーブルを persist/flush で直接保存し不要な削除を含まない | md:199,203 | ee shippingEditCompleteに削除呼出なし（persist/flushのみ・958,966） |

**LS=locale_sensitive**: L1-002/007/014（見出し・注意文・エラー文言）。日本語=設計md値が正、**英語も設計md値が正＝確定（bound）**（§5・md:102-117。pf `delivery_edit.en.twig`/`message.en.yml`が裏取り）。ee `messages.en.yaml`が設計md英語値に差異/不在なら**EEドリフト**（ja側C-D9/C-D2/C-D3と同一事象のen面）。母集合に-EN行が無いため英語仕様は**会計外補完（§4.4）**として記録し母集合会計（34/28/0/0/0/1）に非算入（母集合TBD会計〔=0〕にも非算入）。

---

## §2 SEED三段参照設計・破壊系S0（実行可能設計に具体化）

三段参照: **期待の正=L1オラクルID（§1・設計md）→前提状態=SEEDセットID→観測=実値（db.ts/画面）**。

### 操作手順の標準形（購入フロー駆動＝結合/e2eテスト・改訂で是正）

**是正の根本**: 配送先の新規登録/編集画面（`GET/POST /shopping/shipping_edit/{id}`＝ShoppingController.php:792,794）は**購入手続きフロー内のサブ画面**であり、
入力画面から遷移して初めて到達できる。`shippingEdit()`は`getPurchaseProcessingOrder`で処理中受注が取れないと`shopping_login`/`shopping_error`へリダイレクトし（:798-805）、
`{id}`は当該受注の`dtb_shipping`のIDである。したがって「seed投入→`GET /shopping/shipping_edit/{id}`直リクエスト」は**単体テスト**であって結合/e2eテストでない。
正常系・副作用観測系・境界系・ドリフト系の到達は**購入フロー全体の駆動**に改める。

**標準形（フロー到達）**:
`SEED-F0403-INPROG（会員ログイン＋カート＋getPurchaseProcessingOrderで取れる処理中受注＋当該dtb_shipping）投入 →
GET /cart（買い物かご・Front/CartController.php:80）→ 購入手続きへ →
GET /shopping（ご注文方法指定・index.twig・ShoppingController.php:123）→
お届け先「追加/変更」リンク（index.twig:257・path('shopping_shipping_edit',{id})）→
GET /shopping/shipping_edit/{id}（配送先の新規登録/編集画面・ShoppingController.php:792,794）`。

**標準形（登録＝POST）**:
上記到達 → 入力 → `POST /shopping/shipping_edit/{id}/complete`（ShoppingController.php:881,882・検証通過で`persist`958/`flush`966・お届け先IDを`session`保存975）→
`redirectToRoute('shopping')`（:993）で**ご注文方法指定（確認）画面へ戻り反映を観測**。破壊系（C-07/C-08/C-D6/C-D7）は登録直前にS0スナップショット→afterEachでraw SQL復元（本§下部）。

**境界値ケース（-025〜-028）・登録/変更の破壊系**: 上記フロー駆動＋DBアサーション（`dtb_customer_address`行数±1/±0）＋S0復元で観測する。

**直アクセス維持の例外（本機能では該当なし）**: f04-04では「受注IDなしで`/complete`へ直アクセス→トップ」等、直アクセス自体がガード試験のケースで直GETを維持した。
本機能は**到達に必ず購入手続きの前提（処理中受注＋当該Shipping ID）を要する**ため、`shipping_edit`へ意味のある直GETができるケースが母集合に無い。
上限超過→404（`NotFoundHttpException`・ShoppingController.php:819-823）も、アドレス帳20件到達＋お届け先「追加」リンク（フロー到達）で`GET /shopping/shipping_edit/{id}`した時にガードが発火するため、**フロー駆動で到達させる**（母集合期待＝設計md「ご注文方法指定へ戻す」で判断・ee実挙動は404＝§4.1d C-D1のドリフト）。**直GET維持のtest_idは0件**。

| SEEDセットID | 目的 | 内容（要点） |
|---|---|---|
| SEED-F0403-INPROG | 購入手続き中（受注確定前）の会員＋対象Shipping | 会員ログイン＋カート投入＋`getPurchaseProcessingOrder`で取得できる処理中受注＋当該受注に紐づく`dtb_shipping`（`{id}`）。編集/確認/登録の前提 |
| SEED-F0403-ADDR-EXISTING | 既存お届け先（編集対象） | 会員に`dtb_customer_address`の既存行を1件seed（IDあり編集の対象・上限判定スキップ確認用） |
| SEED-F0403-ADDR-MAX | アドレス帳が上限（20件）到達 | 会員に`dtb_customer_address`を20件seed（新規登録の上限判定〔L1-008〕到達状態。既存編集は判定スキップ） |
| SEED-F0403-ADDR-UNDER | アドレス帳が上限未満 | 会員に`dtb_customer_address`を19件以下seed（新規入力画面が表示され登録できる状態） |
| SEED-F0403-COUNTRY-PREF | 国と都道府県の（不）整合入力 | 国=日本×都道府県=国外／国=日本以外×都道府県=国外でない、の不整合組合せ入力（L1-009）と、整合組合せ（否定側） |

### 破壊系S0スナップショット・復元設計（対象・順序・SQL骨子）

**S0対象テーブル（操作直前にraw psql=db.tsでスナップショット）**:
| 対象 | スナップショット項目 | 復元方法 |
|---|---|---|
| `dtb_customer_address` | 新規登録された行ID（S0=行なし。ee会員フローは常に新規追加＝§4.1dの通り既存UPDATE経路は無い） | 新規追加行は**`DELETE FROM dtb_customer_address WHERE id = $1`**（db.tsのパラメータ化API＝`$1`プレースホルダ。`:new_id`は擬似表記でありDO $$内バインドは用いない。行IDは復元前に`SELECT`で存在照会→バインドDELETE）。**FK子の非存在は実DBスキーマのFK/トリガ照会で確認＝D5確定（照会実施済み前提）**（D5フェーズで`SELECT conname,confrelid::regclass FROM pg_constraint WHERE confrelid='dtb_customer_address'::regclass`＋トリガ照会を実行・記録済み前提。子参照があれば削除順を定義。ORMマッピング上は親参照のみ〔CustomerAddress.php〕だが実DB制約の証明はpg_constraint照会で担保） |
| `dtb_shipping` | **登録経路で`$Shipping->setFromCustomerAddress($CustomerAddress)`により当該Shipping行が実際に更新される**（会員/非会員問わず`ShoppingController.php:947`で呼ばれ`flush`966。`Shipping.php:190-208`が更新する列＝`setFromCustomerAddress`が触る列）。S0=登録前のShipping該当列＋`update_date` | 破壊系登録ケース（C-07/C-08）前に対象`dtb_shipping`行を**固定列リストでスナップショット**し、afterEachで**列リストを固定したパラメータ化`UPDATE dtb_shipping SET name01=$2,name02=$3,kana01=$4,kana02=$5,company_name=$6,tel01=$7,tel02=$8,tel03=$9,postal_code=$10,pref_id=$11,addr01=$12,addr02=$13,addr03=$14,abroad_postal_code=$15,country_id=$16,update_date=$17 WHERE id=$1`**（NULL可列は`$n`にNULLをバインド＝`setFromCustomerAddress`で上書きされる列を漏れなく列挙。列名/型はD5フェーズで`\d dtb_shipping`照合済み＝配線はD5確定＝配備済み前提）でS0値へ戻す（またはケースごとに使い捨てShippingを再seed）。**「dtb_shippingは触らない」は誤り＝登録経路で更新されるため必ず復元対象に含める**（codex R1是正） |
| セッション | `eccube.front.shopping.customer_address_id`等 | complete後のremove（OrderHelper.php:306,319）で消えるため各ケースで再seed（べき等） |

- **raw SQLで復元**（ORM/Doctrine非経由＝`SaveEventSubscriber`等を再発火させず`update_date`等を確実に元値へ戻す。先例f06-19/f04-04踏襲）。**バインドは`db.ts`のパラメータ化API（`$1`位置プレースホルダ）で行い、`:name`表記や`DO $$`ブロック内の`:oid`バインドは用いない**（存在照会→バインド実行の順序）。
  **db.tsの実配線はD5確定＝配備済み前提**（対象・順序・SQL骨子は本§で特定済み）。**冪等性担保**: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用（安全境界）**: `dtb_customer_address.id`のシーケンス/採番は前進し復元しない（行削除後も採番値は戻らないが業務影響なし・f06-19のmem_id前進と同型）。
- **外部副作用の隔離ハーネス**: 本機能の母集合行は外部送達を伴わない（§0）。ただしお届け先登録は`shopping_shipping_edit_complete`で`executePurchaseFlow`を通り、
  購入手続きの土台（カート/受注）を触るため、**カート系T2共有の隔離ハーネス（Mailer=`null://null`〔ee `mailer.yaml`既定〕・Messenger asyncを`in-memory://`へE2E上書き＋worker非起動・
  UniSearch no-op上書き・起動時外部host非到達アサート）を前提**とする（f04-04 §2と共有・**D5確定＝配備済み前提**）。本機能のアサーション自体は自社DB/セッション/画面で完結する。

---

## §3 画面項目マトリクス（本機能は入力フォームを持つ＝バリデーション観点が有効）

**本機能は入力フォーム（お届け先入力＝`CustomerAddressType`）を持つ**（md:70,180・ee `ShoppingShippingType`）。したがって
必須/相関/文字列長バリデーション観点は本機能に**該当実挙動を持つ**（f04-04〔入力フォーム非存在〕とは異なる）。三値比較（設計md／eeフォーム／eeDB）の主対象:

| 論理キー | 必須/任意（設計md md:132-145） | eeフォーム（照合補助） | eeDB列（照合補助・L1出典にしない） |
|---|---|---|---|
| addressName（配送先名称） | 必須 | required=true・NotBlank・Length max=128（CustomerAddressType:56-63） | `dtb_customer_address.address_name` length128（CustomerAddress.php:403） |
| name.name01/name02（氏名） | 必須 | required=true（:65-66） | name01/name02 length255（:95,98） |
| kana.kana01/kana02（氏名カナ） | 任意 | required=false（:68-69） | kana01/kana02 nullable length255（:101,104） |
| tel.tel01-03（電話番号） | 必須（各分割数値・桁=tel_len5） | required=true（:130-131） | tel01-03 length5（:445,448,451） |
| country（国） | 必須 | required=true（:103-106・既定JAPAN） | — |
| zip.zip01/zip02 or zipcode（郵便番号） | 必須（国内分割/国外単一） | postalCode required=true／abroadPostalCode required=false（:113-119） | postal_code length8（:110） |
| pref/addr01/addr02（住所） | 必須 | AddressType required（:129） | addr01/addr02 nullable length255（:113,116） |
| company_name（会社名） | 任意 | required=false（:95-96） | company_name nullable length255（:107） |

**T2規律**: 上表eeフォーム/DB列は**照合補助**であり期待値の正としない（設計mdの必須/任意・上限を期待の正とする）。境界値（最大長+1/最小長-1）の
「登録されない/更新されない」は、設計mdの必須/上限（md:132-145,211）が期待の正で、eeのLength制約はセレクタ源/観測補助。

**境界値ケース明細（-025〜-028のfixture化・codex R2/R3・具体桁はD5確定＝fixture固定）**: 母集合の「最大長/最大長+1/最小長/最小長-1」を、
**設計md「フォーム種別の確認値」を fixture_version として固定**した上で対象フィールドごとに具体化する（**具体桁数はD5確定＝設計md確認値＋ee Entity/スキーマ値で固定。設計md:141が「移行先の `address_name` 列長は128」と確認値を明示し、ee `CustomerAddress.php:403` address_name列長128と一致＝オラクル（設計md）由来の確定桁**）:

| 母集合 | 代表対象フィールド（フォーム種別確認値でfixture固定） | 入力境界（確定桁） | 期待（設計md由来の極性）＝期待DB差分 | 会計 |
|---|---|---|---|---|
| -025 | address_name（配送先名称・必須文字列の代表） | 最大長＝**128文字**（上限ちょうど・md:141確認値） | 検証通過→`dtb_customer_address`に新規行が**追加される**（行数+1） | bound C-08 |
| -026 | 同上 | 最大長+1＝**129文字**（上限超過） | 検証不備→新規行が**追加されない**（行数±0） | bound C-09 |
| -027 | 同上（必須） | 最小長＝**1文字**（下限ちょうど・非空） | 検証通過→新規行が**追加される**（行数+1） | bound C-08 |
| -028 | 同上（必須） | 最小長-1＝**0文字**（空＝NotBlank違反） | 検証不備→新規行が**追加されない**（行数±0） | bound C-09 |

**フォーム種別ごとの境界網羅表（fixture_version固定・具体桁はD5確定＝設計md確認値／ee Entity・スキーマ値）**: 母集合が与える境界test_idは-025〜-028の4件のみで、これらは必須文字列の代表フィールド`address_name`に割り当てる。下表のフォーム種別ごとに`max/max+1/min/min-1`をD5確定桁でfixture固定し、期待DB差分（新規行の有無＝行数±1/±0）で各境界をアサーションする（極性は母集合期待テキスト「追加される/されない」で確定）:

| フォーム種別（対象フィールド） | max（確定桁・設計md確認値／ee列長） | max+1 | min（非空下限） | min-1（空） | 期待DB差分の判定 |
|---|---|---|---|---|---|
| address_name（配送先名称・必須） | **128文字**（設計md md:141「列長128」＝確認値・ee `CustomerAddress.php:403`列長128） | **129文字** | 1文字（非空） | 0文字（空＝NotBlank違反） | max/min→行数+1／max+1/min-1→行数±0 |
| name01/name02（氏名・必須） | **255文字**（ee `CustomerAddress.php:95,98`列長255・md:135フォーム種別確認値） | **256文字** | 1文字 | 空 | 同上 |
| tel01-03（電話・必須・数値桁） | **5桁**（tel_len＝md:144・ee `CustomerAddress.php:445,448,451`各列長5） | **6桁** | 1桁 | 空 | 同上 |
| postal_code（郵便・必須・国内分割） | **国内分割 zip01=3桁・zip02=4桁**（md:143・ee postal_code列長8） | 各上限+1（zip01=4桁・zip02=5桁） | 下限1桁 | 空 | 同上 |

**極性は母集合期待テキスト（追加される/されない）で確定済み。上表の具体桁はD5確定＝設計md確認値／ee Entity・スキーマ値で fixture_version として固定済み**（代表フィールドaddress_nameの-025〜-028＝128/129/1/0文字。他フィールドは実装waveでの拡張網羅用の参照値でありD5確定桁で固定）。
本機能は会員フローが常に新規追加のため、母集合の「更新（-032〜-042）」側の境界肯定は§4.1d C-D6（ドリフト）で別掲し、bound境界は新規登録の-025〜-028に限る。

---

## §4 実行可能設計候補（自己完結＝全候補ケースを実体掲載。**S0/seed/隔離ハーネスの実配線はD5確定＝配備済み前提**）

> **会計ラベル（codex R4是正・改訂でD5確定前提化）**: 本§の bound成功34・bound(EEドリフト)28 は、seed投入・afterEach復元・破壊系S0の実SQL・共有隔離ハーネス配線が**D5確定＝配備済み前提**であり、bound成功34は**配備済み前提でbound観測可能＝実行可能**である。S0対象・順序・列リスト・pg_constraint照会手順（§2）は特定済み・照会実施済み前提。（旧記述: これらが`@TBD-D5`で未実装のため「実装待ちbound設計」だった＝D5確定で撤回。）「seed→期待観測可（成功）」の表現はドリフト行（§4.1d）には用いず、bound成功行に限る。

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。ee参照は「（ee照合: file:line）」＝**セレクタ源/観測対象特定/踏襲確認のみ**（L1出典にしない）。

### §4.1 母集合対応・bound成功（現eeで`shopping_shipping_edit`＋seed＋S0復元＋DB/UIアサーションで観測可能。13 C-ID・34母集合行）

> **codex R1是正**: 旧C-06（既存読込）・C-10/C-11（既存値更新）・C-12（Cookie保存）・C-13の編集権限・旧C-01の見出し/注意文は
> **現eeに実装が無いためbound成功から除外し§4.1dのC-D5〜C-D9へ移設**した。本§には**新規お届け先の登録・表示・無効入力非登録・セッション保存・登録権限**のみ残す。

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 対応母集合 |
|---|---|---|---|---|
| C-01 | 編集画面の表示（新規入力フォーム） | **購入フロー駆動**（§2標準形＝SEED-F0403-INPROG→GET /cart:80→GET /shopping:123→お届け先追加/変更リンク index.twig:257→GET /shopping/shipping_edit/{id}:792,794到達）→各入力欄の存在をアサート | 編集画面が表示され、各入力欄（配送先名称/氏名/氏名カナ/電話3分割/国/郵便番号/住所/会社名）が存在する `[L1:F0403-002,016]`（ee照合: shipping_edit.twig:88-入力欄群・61行の入力フォーム列挙で観測可。**見出し文字列「配送先の新規登録・変更」・変更不可の注意文はee差異＝§4.1d C-D9へ移設**し本ケースでは主張しない） | -012（読替：注1）／-050（読替：注1）／-061（直接：入力フォーム各項目の存在） |
| C-02 | 必須マーク表示 | **購入フロー駆動**（§2標準形でGET /shopping/shipping_edit/{id}:792到達）→必須マーク表示をアサート | 配送先名称・配送先氏名・電話番号・国・郵便番号・住所に必須マーク画像を表示（氏名カナ・会社名には無い） `[L1:F0403-003,016]`（ee照合: `common.required`マーク＝shipping_edit.twig:89,105,174,190,218,236,265,294） | -008（直接） |
| C-03 | 郵便番号の国別切替 | **購入フロー駆動**（§2標準形で編集画面到達:792）→国=日本／国外を選択（国change→submit shipping_edit.twig:35）し郵便番号欄を確認 | 国により郵便番号欄が分割（zip01・zip02）または単一（zipcode）に切り替わる `[L1:F0403-004]`（ee照合: SplitPostalType/abroadPostalCode・国change submit） | -009（直接） |
| C-04 | 国・都道府県の表示連動 | **購入フロー駆動**（§2標準形で編集画面到達:792）→国の選択を変更（shipping_edit.twig:35 change→submit）し都道府県欄を確認 | 国の選択に応じて都道府県の表示・隠しを切り替える `[L1:F0403-005]`（ee照合: shipping_edit.twig:35国change→submit・PREF_ABROAD） | -048（直接） |
| C-05 | 新規登録・上限内→新規入力画面 | **購入フロー駆動**（SEED-F0403-ADDR-UNDER〔上限未満〕＋§2標準形でお届け先追加リンク→GET /shopping/shipping_edit/{id}:792）→新規入力画面描画をアサート | 登録上限内なら新規入力画面を表示 `[L1:F0403-001,008]`（ee照合: 上限未満はNotFound回避しフォーム描画） | -004,-044（直接） |
| C-07 | 確認画面から登録→配送先選択へ遷移 | S0取得→**購入フロー駆動**（§2標準形で編集画面到達:792）→妥当入力→**POST /shopping/shipping_edit/{id}/complete:881,882**（persist958/flush966/session保存975/redirect('shopping')993）で登録→ご注文方法指定画面へ戻り反映を観測→afterEach S0復元。**成功条件は`dtb_customer_address`新規登録＋`shopping`へのredirect＋お届け先IDのsession保存に限定**する。**`dtb_shipping`登録時の直接更新＝当機能F04-03責務**（EEの登録経路は副作用として当該Shippingを`setFromCustomerAddress`で更新するため**S0復元対象＝§2**）**であり、直接の成功条件にしないのは登録後の選択確定でどのお届け先を当該注文へ充てるか＝反映確定（F04-02委譲）の部分** | 登録上限内かつ検証通過で住所と配送先名称を登録し、当該注文の配送先選択へ遷移 `[L1:F0403-010,011]`（ee照合〔観測補助〕: persist958/flush966/redirect('shopping')993・session975） | -006,-046（直接：登録→遷移）／-058（読替：アドレス帳追加＋引き継ぎ）／-062（読替：成功時出力＝確認画面表示 or 配送先選択遷移） |
| C-08 | 登録内容のDB追加（dtb_customer_address・**新規行**） | S0取得→**購入フロー駆動**（SEED-F0403-ADDR-UNDER〔上限未満〕＋SEED-F0403-INPROG＋§2標準形で編集画面到達:792）→**妥当なお届け先**（必須欄充足）を入力→**POST /shopping/shipping_edit/{id}/complete:881**で登録→`dtb_customer_address`行数+1をDBアサーション→afterEach S0復元。**-020対応の入力条件を明示**: 母集合-020のpremise「国と都道府県の不整合」は生成器ノイズ（§0:69）であり、C-08では**国=日本×都道府県=日本国内の整合入力**（有効な新規登録）を投入し、期待テキスト「登録内容の対象レコードが追加される」の**肯定側**をbindする（不整合入力そのものの国エラー付与検証はC-D3で別掲・重複しない） | お届け先住所（氏名・カナ・電話・国・郵便・都道府県・住所・会社名）と配送先名称（address_name）の**新規行が追加される**（ee会員フローは常に新規persist） `[L1:F0403-011]`（ee照合〔観測補助〕: CustomerAddress persist・address_name列） | -020,-022,-024,-029（読替：IT-26登録内容テンプレ→具体登録・新規追加の肯定側。-020のpremise「国pref不整合」はノイズラベルで期待テキスト「追加される」でbind＝§0原則）／**-025,-027（肯定境界＝§3境界表: -025=最大長・-027=最小長で行数+1）**／-030（読替：実行結果＝address_name新規追加）／-001,-002,-003,-043（読替：グロッサリ〔お届け先=配送先住所／配送先名称=表示名／アドレス帳=複数住所〕→登録行が該当・注3） |
| C-09 | 登録されない（否定側） | S0取得→**購入フロー駆動**（SEED-F0403-ADDR-UNDER＋§2標準形で編集画面到達:792）→(a)確認画面で戻る送信（mode=back）／(b)配送先名称が**上限超過＝129文字**（母集合「最大長+1」。設計md:141確認値「address_name列長128」＋1＝D5確定桁。ee `CustomerAddress.php:403`列長128と一致）／(c)必須欄を空＝0文字＝NotBlank違反（母集合「最小長-1」）で**POST /shopping/shipping_edit/{id}/complete:881**→`dtb_customer_address`行数±0をDBアサーション→afterEach S0復元 | 登録内容の対象レコードが追加されない `[L1:F0403-010,011]`（ee照合〔観測補助・オラクルにしない〕: mode=back→persistせずredirect903-910／Length上限超・NotBlank違反→!isValid→shipping_edit redirect938-941） | -021（戻る送信）／**-026,-028（否定境界＝§3境界表: -026=最大長+1・-028=最小長-1で行数±0）** |
| C-14 | 確認画面で戻る送信→編集画面 | **購入フロー駆動**（§2標準形で編集画面到達:792）→妥当入力で確認画面（delivery_confirm.twig:861）へ→確認画面で戻る送信（mode=back）→shopping_shipping_editへredirect903-910で編集画面表示をアサート | 編集画面を表示する `[L1:F0403-013]`（ee照合: mode=back→shipping_edit redirect903-910） | -057（直接） |
| C-15 | 必須バリデーション（肯定側） | **購入フロー駆動**（§2標準形で編集画面到達:792）→必須欄（配送先名称/氏名/電話/国/郵便/住所）を未入力で**POST /shopping/shipping_edit/{id}/complete:881**送信 | 必須バリデーションでエラーが表示され、対象処理（登録/更新）が完了しない `[L1:F0403-003,016]`（ee照合: NotBlank→!isValid→shipping_edit redirect938-941） | -010（直接） |
| C-16 | 必須バリデーション（否定側） | **購入フロー駆動**（§2標準形で編集画面到達:792）→必須欄入力・任意欄（氏名カナ/会社名）未入力で**POST /shopping/shipping_edit/{id}/complete:881**送信 | 必須バリデーションでエラーが表示されず、対象処理を継続できる `[L1:F0403-016]`（ee照合: kana/company required=false） | -011（直接） |
| C-17 | 有効な入力/組合せ→継続 | **購入フロー駆動**（§2標準形で編集画面到達:792・SEED-F0403-COUNTRY-PREF整合側）→有効な相関組合せ・整合レコード・妥当画面表示データで**POST /shopping/shipping_edit/{id}/complete:881**送信 | エラーが表示されず対象処理を継続できる（確認画面へ進む） `[L1:F0403-009,010]`（ee照合: valid→delivery_confirm.twig描画861） | -014（相関否定側・継続）／-017（DB相関否定側・整合→継続）／-053,-055（画面表示データ・継続） |
| C-18 | 登録による当該注文Shippingへの配送先反映（`dtb_shipping`更新） | S0取得→**購入フロー駆動**（SEED-F0403-INPROG〔会員ログイン＋カート＋処理中受注＋当該dtb_shipping〕＋§2標準形で編集画面到達:792）→妥当なお届け先入力→**POST /shopping/shipping_edit/{id}/complete:881,882**（`$Shipping->setFromCustomerAddress($CustomerAddress)`:947→`flush`:970）で登録→**当該注文の`dtb_shipping`行が入力した配送先内容（`name01/name02/kana01/kana02/company_name/tel01-03/postal_code/pref_id/addr01-03/country_id`）に更新されたことを固定列リストでDBアサーション**→afterEach S0復元。**成功条件=登録による`dtb_shipping`更新（当機能の登録・更新責務＝md:195,203）**。**登録後の選択操作で最終的にどのお届け先を当該注文へ充てるかの「反映」（お届け先選択のラジオ確定＝session`SHOPPING_CUSTOMER_ADDRESS_ID`:975起点）はF04-02（注文情報の入力・確認）へ委譲**（md:195「反映はF04-02」・f04-04 C-08と同様のスコープ委譲分離） | 登録後、当該注文の配送先（`dtb_shipping`）へ登録内容が反映される（当機能の登録・更新が`dtb_shipping`を直接保存する部分。最終的な当該注文へのお届け先選択反映はF04-02責務） `[L1:F0403-018]`（ee照合〔観測補助〕: `setFromCustomerAddress`947→flush970・`Shipping.php:190-208`が更新する列） | -031（直接：登録時の`dtb_shipping`反映をDB観測。「反映はF04-02」の選択反映部はF04-02委譲） |

**注1（読替・C-01）**: -012（前提=見出し）・-050（前提=注意文）は期待「編集画面の表示時であること」＝タウトロジー的な表示時条件→編集画面表示（C-01）へ読替。**期待テキスト自体は「表示時であること」で見出し/注意文の文言一致を要求しない**ため、文言差異（C-D9）とは独立にbound観測可（編集画面が表示される）。
**注3（読替・C-08）**: -001「配送先住所であること」（お届け先=配送先住所）・-002「お届け先に付ける表示名」（配送先名称=address_name）・-003/-043「会員が登録した複数のお届け先住所」（アドレス帳）は
グロッサリ定義タウトロジー→当該用語を実体化する登録行（`dtb_customer_address`／`address_name`）の追加（L1-011）へ読替。

### §4.1d 母集合対応・bound(EEドリフト＝設計md正本だが現eeに該当実装が無く現eeでは失敗期待。9 C-ID・28母集合行)

**ee実測（grep・ソース精読）**: 設計mdが規定する次の機構は**現eeに該当実装が見当たらない**（codex R1でC-D5〜C-D9を追加）:
- ①上限超過→ご注文方法指定へ戻す＋エラー文言（ee=`NotFoundHttpException`404〔ShoppingController.php:819-823,952-955〕）
- ②上限エラー文言キー`front.shopping.error.customer_address_max`（ee全域grep実測0件・codex独立grepでも0件）
- ③国pref不整合→国にエラー付与＋文言キー`form.country.error.invalid`（ee全域grep0件・CustomerAddressType/ShoppingShippingTypeに該当addError不在。codex独立grepでも0件）
- ④`mode=confirm`隠し項目（対象Shoppingフロー・テンプレートに不在。ee=valid時にdelivery_confirm.twig描画/`mode=back`で戻る）
- ⑤**既存お届け先の指定ID読込・編集**（ee会員パスは常に`new CustomerAddress()`＝既存読込経路なし・`{id}`はShipping ID。ShoppingController.php:814-826）
- ⑥**既存レコードの値更新**（ee会員時は常に`new CustomerAddress()`をpersist＝既存行UPDATEなし。ShoppingController.php:913-958）
- ⑦**お届け先IDのCookie保存**（対象ShoppingController・Shoppingテンプレートに該当Cookie保存なし。ee=セッション`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID`のみ。※ee全域にはCookie API利用自体は存在するため「対象フロー限定で不在」と表記）
- ⑧**見出し「配送先の新規登録・変更」・変更不可の注意文**（ee見出しキーja値=「お届け先の追加」・注意文はshipping_edit.twigに見当たらない）

これらは**pf-eccube3 HareruyaEc固有挙動**（`DeliveryService.php:59,85-87`等に実在＝設計mdオラクルの踏襲元）で、**現eeでは失敗期待**。テストは**設計md（正本）どおりに書き**、
現eeに対してはドリフト検出（失敗が正当）として機能する。「seed→期待画面観測可（成功）」とは誤記しない。
既存編集/更新（⑤⑥）は**標準`ShoppingController`経路では不在（拡張イベント差込は未検証）**であり、seedで既存アドレスを用意しても標準会員フローからは新規追加しか起きない（＝設計md期待の「既存の読込/更新」は標準経路で実現不能＝失敗期待。`ShoppingController.php:814-826,913-958`のソース精読で標準経路の不在は反証済〔codex独立grepでも支持〕だが、プラグイン/イベント差込を含む全経路不在は未証明のため断定回避）。

| C-ID | 対象観点（設計md規定） | 前提/手順（設計md準拠） | 期待結果（設計md＝正本） | 現eeでの扱い（ee実測） | 対応母集合 |
|---|---|---|---|---|---|
| C-D1 | 新規登録・上限超過→ご注文方法指定へ戻す | **購入フロー駆動**（SEED-F0403-ADDR-MAX〔20件到達〕＋§2標準形でGET /shopping:123→お届け先追加リンク index.twig:257→GET /shopping/shipping_edit/{id}:792）→上限判定発火（ShoppingController.php:819-823）を観測 | 上限超過エラーを出してご注文方法指定へ戻す `[L1:F0403-008]` | **失敗期待**: eeは上限超過時`NotFoundHttpException`（404）を投げる（ShoppingController.php:821-823）＝ご注文方法指定へのエラー付きリダイレクトにならない（ドリフト） | -019,-063（直接）／-016（読替：相関バリ肯定側＝上限ゲート→登録不可） |
| C-D2 | 上限エラー文言キー | **購入フロー駆動**（SEED-F0403-ADDR-MAX〔20件到達〕＋§2標準形でお届け先追加リンク→GET /shopping/shipping_edit/{id}:792）→上限超過時のエラー文言を確認 | 「お届け先登録数の上限を超えています。」（キー`front.shopping.error.customer_address_max`） `[L1:F0403-014]` | **失敗期待**: 当該キーがee全域grep0件（pf message.ja.yml:1462に実在）＝現eeでは当該文言を表示しない（ドリフト） | -051（直接：キー明示） |
| C-D3 | 国pref不整合→国にエラー付与・編集画面再表示 | **購入フロー駆動**（SEED-F0403-COUNTRY-PREF〔不整合組合せ〕＋§2標準形で編集画面到達:792）→不整合組合せ入力で**POST /shopping/shipping_edit/{id}/complete:881**送信 | 国が日本×都道府県が国外／国が日本以外×都道府県が国外でない場合は不整合として国にエラーを付与し編集画面を再表示（キー`form.country.error.invalid`） `[L1:F0403-009,014]` | **失敗期待**: eeCustomerAddressTypeに国pref不整合addError・当該キーが見当たらない（grep0件。pf DeliveryService.php:59に実在）＝現eeでは当該エラー付与が起きない（ドリフト） | -054,-056（直接：不整合判定・国エラー付与）／-052（直接：キー`form.country.error.invalid`）／-013（読替：相関バリ肯定側→不整合エラー）／-018（読替：DB相関肯定側→不整合エラー・注4） |
| C-D4 | 送信モード（mode=confirm隠し項目） | **購入フロー駆動**（§2標準形で編集画面到達:792）→編集画面の送信（`POST /shopping/shipping_edit/{id}/complete:881`）にmode=confirm隠し項目を伴うかを確認 | 編集画面の送信は`mode=confirm`の隠し項目を伴い確認画面用の遷移を行う `[L1:F0403-006]` | **失敗期待**: eeは`mode=confirm`隠し項目を持たず、フォームvalid時に`delivery_confirm.twig`を描画（861）＝機構が異なる（ドリフト。ただし確認画面遷移自体はC-07でbound観測可） | -049（直接） |
| C-D5 | 既存お届け先の指定ID読込・編集画面 | **購入フロー駆動**（SEED-F0403-ADDR-EXISTING〔既存お届け先1件〕＋§2標準形でGET /shopping:123→お届け先変更リンク index.twig:257）→既存お届け先IDを指定して`GET /shopping/shipping_edit/{id}:792`で編集画面へ | 指定IDの住所を読み込み編集画面を表示（既存編集は上限判定スキップ） `[L1:F0403-001,008]` | **失敗期待**: ee会員パスは常に`new CustomerAddress()`を生成し既存住所をIDで読み込まない。`{id}`はShipping ID（ShoppingController.php:814-826）＝設計mdの「指定ID読込・編集」は現eeで実現不能（ドリフト） | -005,-045（直接） |
| C-D6 | 既存レコードの値更新（既存お届け先の変更） | S0取得→**購入フロー駆動**（SEED-F0403-ADDR-EXISTING＋§2標準形で編集画面到達:792）→既存住所を変更送信→**POST /shopping/shipping_edit/{id}/complete:881**→`dtb_customer_address`をDBアサーション→afterEach S0復元 | 更新内容の対象（既存）レコードの値が変更される／検証不備なら変更されない `[L1:F0403-010,011]` | **失敗期待**: ee会員時は常に`new CustomerAddress()`を`persist`し既存行を`UPDATE`しない（ShoppingController.php:913-958）。「既存レコードの値が変更される」は現eeで発生せず（新規行が増える）、既存編集シナリオ自体が現eeに入口なし＝設計md期待どおりに検証すると失敗（ドリフト） | -032,-034,-036,-037,-039,-041,-042（値変更・肯定側）／-033,-038,-040（値変更されない・否定側。ただし既存更新経路が無いため設計mdの「既存不変」検証は入口不能＝ドリフト） |
| C-D7 | お届け先IDのCookie保存 | S0取得→**購入フロー駆動**（SEED-F0403-INPROG＋§2標準形で編集画面到達:792）→妥当入力→**POST /shopping/shipping_edit/{id}/complete:881**で登録→Cookieを観測→afterEach S0復元 | 登録後のお届け先IDをセッション**とCookie**へ保存し配送先選択で参照する `[L1:F0403-012]` | **失敗期待**: eeは対象フローで**セッションのみ**保存（`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID`＝ShoppingController.php:975）。**対象ShoppingController・Shoppingテンプレートにお届け先ID Cookie保存が見当たらない**（session保存はC-07/C-08側でbound観測可だが、期待テキストの「Cookieへ保存」部は現eeで満たされずドリフト） | -023,-059（直接：セッションとCookie両保存を期待） |
| C-D8 | 既存アドレスの編集権限 | **購入フロー駆動**（会員ログイン・SEED-F0403-ADDR-EXISTING〔自分の既存アドレス〕＋§2標準形で編集画面到達:792）→自分の既存アドレスの編集を試行（`POST /shopping/shipping_edit/{id}/complete:881`） | 自分のアドレス帳に対して登録・**編集**できる `[L1:F0403-015]` | **失敗期待**: 登録（新規追加）は現eeで可能（C-07/C-08でbound）だが、**既存アドレスの編集**は会員購入フローに入口が無い（常に新規生成）ため、期待「編集できる」の編集部分は現eeで実現不能（ドリフト） | -035（読替：会員ログイン→自アドレス帳の登録・編集。編集部分がドリフト） |
| C-D9 | 見出し「配送先の新規登録・変更」・変更不可の注意案内 | **購入フロー駆動**（§2標準形で`GET /shopping/shipping_edit/{id}:792`到達）→見出し・会員名・変更不可注意文・既受注分離の注意案内を確認 | 見出し「配送先の新規登録・変更」・変更不可の注意文・（既受注の注文者/配送先は変わらない旨の）画面上の注意案内を表示 `[L1:F0403-002,007,017]` | **失敗期待**: ee見出しキー`front.shopping.shipping_edit_header_customer`ja値=「お届け先の追加」（文字列差）・注意文はshipping_edit.twigに見当たらない（grep0件）＝設計md文言と不一致（ドリフト。入力欄の存在自体はC-01でbound） | -007,-047（直接：見出し＋注意文を含む表示要素）／-060（読替：既受注分離の画面注意案内） |

**注4（読替・C-D3）**: -013（相関バリ・エラー完了しない・前提=注意文）・-018（DB相関・エラー完了しない・前提=登録後配送先反映）は、本機能の相関/DB相関の実体が
**国と都道府県の整合（Prefは国に依存するDBエンティティ）**であることから、国pref不整合→エラーへ読替（C-D3）。当該不整合エラー付与は現eeに実装が見当たらず失敗期待。

### §4.2 母集合対応・partial（該当なし）

本機能の母集合行は外部送達を伴わず、1行内にbound枝/要実機枝が混在する行が無い＝**partial 0**。

### §4.3 母集合対応・要実機（該当なし）

真の外部送達を伴う母集合行が無い＝**要実機 0**。住所自動入力の外部サービスは設計md（md:33,172）が「扱わない」と明示し母集合行も無い。

### §4.4 補完（母集合会計外・翻訳キー実在の記録／英語仕様は設計md確定値＝bound・ee差異はEEドリフト）

**英語仕様の確定（codex R2是正）**: C-EN-01の英語仕様は**設計md（オラクル）の確定値**として扱う（`@TBD-D5`/`@TBD-EN`のlive留保は撤回）。設計md（md:102-117）が英語表示文言を規定し、pf現行踏襲資源（`Shopping/delivery_edit.en.twig:19`「Register New/Change Address」・`message.en.yml:1032`「The maximum number of addresses registration is exceeded.」・`message.en.yml:662`「The combination of country and region is incorrect.」）が裏取りする＝**確定＝bound**。ee `messages.en.yaml`はこの確定値に対し差異（見出しen=「Add Delivery Address」:1366）／不在（上限・国pref・注意文のenキーがgrep0件）であり＝**EEドリフト**（ja側ドリフトC-D9/C-D2/C-D3と同一事象のen面。en単独の新規ドリフトC-IDや母集合行は増やさない）。
**会計上の扱い**: 母集合（63行）に**-EN test_idが無い**ため、英語仕様は**会計外補完**として§5に記録し母集合会計（34/28/0/0/0/1）に算入しない。これは「母集合TBD会計（§4.5＝0）」とは別カテゴリ（母集合TBDは期待テキスト自体が非アサーションの母集合行を数える区分＝本機能0）。すなわち英語仕様の確定は母集合会計を一切動かさず（**34/28不変**）、`@TBD` live残存0で完結する。

| C-ID | 対象観点 | 前提/手順 | 期待結果 | 区分 |
|---|---|---|---|---|
| C-EN-01 | 表示メッセージのen観測（英語仕様＝設計md確定値） | `/en/shopping/shipping_edit/{id}`で編集画面/エラーを英語表示→設計md英語値と照合 | **英語仕様は設計md（オラクル）確定値で正**: 見出し「Register New/Change Address」（md:104・pf `delivery_edit.en.twig:19`裏取り）・上限「The maximum number of addresses registration is exceeded.」（md:114・pf `message.en.yml:1032`）・国pref「The combination of country and region is incorrect.」（md:115・pf `message.en.yml:662`）。**ee `messages.en.yaml`は差異（見出しen「Add Delivery Address」:1366）／不在（上限・国prefのenキーgrep0件）＝EEドリフト**（ja側C-D9/C-D2/C-D3のen面）。翻訳キー実在は§5に記録 | 補完・会計外（母集合-EN行なし）・非L1・母集合会計に非算入（英語はbound確定値・ee差異はドリフト） |

### §4.5 母集合対応・TBD（該当なし）

期待テキスト自体が「移行先で要確認であること」等の非アサーションになっている母集合行は無い＝**TBD 0（母集合会計）**。
（設計mdの移行記述〔md:39 address_name統合〕は「統合されている」と確定形で、-EN確定不能や要確認ラベルは母集合期待テキストに現れない。）
**※注**: C-EN-01の英語仕様は**設計md確定値＝bound**（§4.4・`@TBD`撤回済み）で、母集合に-EN行が無いため**会計外補完**。この母集合TBD会計（=0）とは別カテゴリ＝母集合TBDには算入しない。英語仕様はもはや留保（@TBD）ではなく確定値であり、母集合会計（34/28/0/0/0/1）を動かさない。

### §4.6 母集合対応・excluded（1母集合行・per-ID実引き・過剰除外禁止）

| test_id | 期待テキスト要旨（前提列） | 除外理由（一次資料実引き） |
|---|---|---|
| -015 | 相関バリでエラー表示されず継続（前提=国と都道府県の不整合エラー文） | **IT-22相関バリ系で「該当する値を指定」＋前提=不整合エラー文なのに期待が「エラー表示されず継続」で矛盾**（不整合は国にエラー付与＝md:73,126,155,213）。IT-22では前提が検証対象の条件を名指すため（-013/-016と同様に premise-informed 判定）、整合referentなし＝excluded。国pref整合時の継続はC-17でbound、不整合エラーはC-D3で別掲。**注: -020（IT-26）とは系列が異なる**——IT-26「登録内容…追加される」は premise がノイズラベルで期待テキストの肯定/否定でbindするため-020はC-08（§0原則・codex R3是正） |

**codex R3是正（-031の除外撤回）**: 旧draftは-031を「別機能F04-02委譲」として全体excludedにしたが、これは**過剰除外**。母集合-031の期待「登録後の選択で当該注文の配送先へ反映する（反映はF04-02）」のうち、**登録による`dtb_shipping`の直接保存は当機能（f04-03）の登録・更新責務**であり設計mdがDB対象に`dtb_shipping`を明記する（md:195「登録後の選択で…反映」・md:203「当機能が行う登録・更新で対象テーブル〔dtb_customer_address/…/dtb_shipping〕を直接保存する」）。EEも登録経路`shippingEditComplete`で`$Shipping->setFromCustomerAddress($CustomerAddress)`（ShoppingController.php:947）→`flush`（:970）により当該注文のShipping行を実際に更新する＝**当機能で観測可能なbound**。よって-031は**C-18へbind**（登録時の`dtb_shipping`反映をDBアサーション）。「（反映はF04-02）」が指す部分＝**登録後の選択操作で最終的にどのお届け先を当該注文へ充てるかの反映**（お届け先選択ラジオの確定）のみF04-02へ委譲する（f04-04 C-08のスコープ委譲と同様の分離）。**excludedは-015の1件のみ**。

**過剰除外でないことの傍証**: excluded 1件は前提と期待の矛盾（-015・IT-22 premise-informed）を実引きで示す。前提が指す実在挙動
（国pref整合時の継続）はC-17でbound化済み＝偽陰性なし。-020はexcludedにせずC-08へbind、-031もexcludedにせずC-18へbind（過剰除外の是正・codex R3）。

---

## §5 locale対応表・翻訳キー実在確認（英語仕様=設計md確定値／ee訳値は照合補助・ドリフト判定源）

**LS=1は3件**（L1-002/007/014）。日本語・英語ともに**設計md値がオラクル（確定値）**。ee訳値は照合補助＝ドリフト判定源:

| L1 | 設計md値（オラクル・日本語） | 設計md英語（オラクル確定値・pf裏取り） | ee照合（補助・ドリフト判定源） | 備考 |
|---|---|---|---|---|
| L1-002 見出し | 配送先の新規登録・変更 | Register New/Change Address（`delivery_edit.en.twig`＝pf・md:104,108） | ee見出しキー`front.shopping.shipping_edit_header_customer`ja値=「お届け先の追加」（ja.yaml:1552） | **§9 BC-DRAFT①**: 見出し文字列差異。期待は設計md値 |
| L1-007 注意文 | 既にいただいています（準備中も含む）ご注文の…弊社へご連絡をお願い致します。 | After the order (including preparation)…please contact us.（md:105） | ee `shipping_edit.twig`にja/en当該注意文が見当たらない（ja/en grep0件・断定回避） | **§9 BC-DRAFT②**: ja/en注意文がeeに不在＝EEドリフト（en面含む・C-D9） |
| L1-014 上限文言 | お届け先登録数の上限を超えています。 | The maximum number of addresses registration is exceeded.（md:114・pf `message.en.yml:1032`裏取り） | **ee不在**（`customer_address_max`キーがja/en grep0件）。pf `message.ja.yml:1462`/`en.yml:1032`に実在 | **§9 BC-DRAFT④**: 英語値は設計md/pfで確定・eeに当該enキー不在＝EEドリフト（C-D2 en面） |
| L1-014 国pref文言 | 国と都道府県の不整合エラー文（`form.country.error.invalid`） | The combination of country and region is incorrect.（md:115・pf `message.en.yml:662`裏取り） | **ee不在**（`form.country.error.invalid`キーがja/en grep0件）。pf `DeliveryService.php:59`・`message.en.yml:662`で使用 | **§9 BC-DRAFT④**: 英語値は設計md/pfで確定・eeに当該enキー不在＝EEドリフト（C-D3 en面） |
| L1-011 配送先名称 | 配送先名称 | — | ee `front.shopping.shipping.address_name`=「配送先名称」（ja.yaml:5655） | 名称ラベルはee実在（セレクタ源） |

- 英語仕様の**正は設計md値**（上記「設計md英語」列＝pf `delivery_edit.en.twig`/`message.en.yml`が裏取り）。**eeの訳値はオラクルにせず照合補助＝ドリフト判定源**とし、設計md英語値との差異/不在は**EEドリフト**（C-D9/C-D2/C-D3のen面）。上限/国prefエラー文言キーはeeに不在（＝EEドリフトで確定・§9 BC-DRAFT④。「-EN確定不能」は撤回＝設計md/pfで英語値は確定済み）。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page/spec: 本機能の実行可能spec**コードの実装＝D6実装対象**（本書は候補設計＝D6前。D5とD6の分界＝D5は環境/前提〔スキーマ・移行先・隔離ハーネス・S0接続配線・fixture桁〕を配備済み前提として確定し、D6はその上の**specコード/db.ts便宜関数の実装・実走**を担う）。編集画面=`shopping_shipping_edit`（GET/POST）、確認登録=`shopping_shipping_edit_complete`（POST）を
  現eeの実route（設計mdの`/shopping/delivery/{id\|new}/edit`・`/confirm`はドリフト）として用いる。期待値は`o("L1-F0403-xxx")`（L1解決器）経由・リテラル直書き禁止。**「実走なし」はD6実装前という意味の実装フェーズ留保であり、D5配備済み前提（環境/前提）とは別軸で分離する**（隔離ハーネス・S0接続配線・fixture桁はD5確定＝配備済み前提のまま）。
- request契約: 編集/確認/登録は購入手続き中（`getPurchaseProcessingOrder`が処理中受注を返す状態）が前提。**破壊系boundケースの実行は§2の共有隔離ハーネス
  （Mailer=null／Messenger in-memory＋worker非起動／UniSearch no-op／起動時外部非到達アサート。**D5確定＝配備済み前提**）を前提**とする（本機能の
  アサーションは自社DB/セッション/画面で完結し外部送達は含まない）。
- db.ts（`e2e/helpers/db.ts`）: `dtb_customer_address`（address_name含む全列）のS0取得・アサーション・raw SQL復元（**新規行DELETE**）、
  **dtb_shipping更新のS0取得・UPDATE復元**（登録経路で`setFromCustomerAddress`により更新されるため・§2）、
  アドレス帳件数seed（上限20到達/未満）、セッション`eccube.front.shopping.customer_address_id`観測の専用便宜関数の**コード実装＝D6実装対象（実装wave）**。ただし**S0の対象・順序・SQL骨子・db.tsの接続配線（スキーマ照合済みの実配線前提）はD5確定＝配備済み前提**（§2で特定済み）＝環境/前提はD5で確定し、便宜関数コードの実装のみD6に属する（両者を分離）。バインドは`$1`位置プレースホルダ（`DO $$`内`:oid`バインド不可）。
- 破壊系afterEach（C-07,C-08・C-D1〜C-D9）: §2のS0対象・復元SQLに従いraw SQLで復元。
- **オラクル独立性（T2規律）**: 期待値はすべて設計md（§1 L1・pf現行踏襲spec）由来。eeのフォーム定義（required値・Length）・実装値・翻訳訳語・route名は
  セレクタ源／観測対象特定にのみ用い、期待値の根拠にしない。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01,C-02,C-03,C-04,C-05,C-14 | Playwright | GUI | 新規入力画面の表示要素・必須マーク・郵便番号/国pref連動・戻る送信 |
| C-07,C-08 | Playwright/request+db.ts（破壊系・afterEach必須） | GUI/HTTP+DB | 登録→遷移・dtb_customer_address新規追加＋dtb_shipping更新のS0復元（§2）。自社DBアサーション |
| C-09,C-15,C-16,C-17 | Playwright（バリデーション否定/肯定・DB無変化アサート含む） | GUI+DB | 登録されない・必須バリ・有効入力継続（session保存の観測はC-07/C-08側） |
| C-D1〜C-D9 | **bound(EEドリフト)＝現eeでは失敗期待** | GUI+DB | 設計md正本でテストを書くが現eeに実装なし（§4.1d：上限リダイレクト/上限キー/国pref/mode=confirm/既存読込/既存更新/Cookie/編集権限/見出し・注意文）。ドリフト検出。bound成功と別勘定 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（63 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功** | **34** | 現eeで`shopping_shipping_edit`＋seed→自社DB/画面/セッション観測可能（新規登録・表示・無効入力非登録・登録権限・登録による`dtb_shipping`反映。破壊系はS0復元・§4.1・C-01〜C-09,C-14〜C-18） |
| **bound(EEドリフト)** | **28** | 設計md（正本）が規定するが現eeに該当実装が見当たらず**現eeでは失敗期待**（C-D1〜C-D9・§4.1d）。テストは設計md通りに書きドリフト検出として機能 |
| **partial** | **0** | 外部送達混在行なし |
| **要実機** | **0** | 真の外部送達を伴う母集合行なし |
| **TBD** | **0** | 「移行先で要確認」の非アサーション期待テキストなし |
| **excluded** | **1** | 前提と期待の矛盾（-015）（§4.6）。※-031は登録による`dtb_shipping`保存が当機能責務のためexcludedにせずC-18へbind（codex R3是正） |
| 合計 | **63** | 欠落0・理由なし重複0 |

34+28+0+0+0+1=63（差分0）。

> **実装状態（codex R4是正・改訂でD5確定前提化）**: bound成功34・bound(EEドリフト)28 は**分類（bind先）の会計**である。seed・afterEach・破壊系S0の実SQL・共有隔離ハーネス・db.ts配線・pg_constraint照会は**D5確定＝配備済み前提**であり、bound成功34は配備済み前提で実行可能。（旧記述: これらが全て`@TBD-D5`で未整備のため「実装待ちbound設計・実走なし」だった＝D5確定で撤回。）なお本機能の実行可能spec（page/db.ts等のテストコード）自体は実装wave（D6以降）で生成する候補グレードであり、数値会計（63・差分0）とは別軸。

### 63対応表（期待テキスト→会計→候補ケース）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | 配送先住所であること（お届け先定義） | bound(読替) | C-08 |
| 002 | お届け先に付ける表示名であること（配送先名称定義） | bound(読替) | C-08 |
| 003 | 会員が登録した複数のお届け先住所であること（アドレス帳定義） | bound(読替) | C-08 |
| 004 | 登録上限内なら新規入力画面を表示 | bound | C-05 |
| 005 | 指定IDの住所を読み込み編集画面を表示 | bound(EEドリフト) | C-D5 |
| 006 | 上限内かつ検証通過で住所と配送先名称を登録し配送先選択へ遷移 | bound | C-07 |
| 007 | 見出し・会員名・案内文・各入力欄 | bound(EEドリフト) | C-D9（入力欄存在はC-01でbound／見出し・注意文がドリフト） |
| 008 | 配送先名称等に必須マーク画像を表示 | bound | C-02 |
| 009 | 国により郵便番号欄が分割/単一に切替 | bound | C-03 |
| 010 | 必須バリでエラー表示・完了しない | bound | C-15 |
| 011 | 必須バリでエラー表示されず継続 | bound | C-16 |
| 012 | 編集画面の表示時であること（前提=見出し） | bound(読替) | C-01 |
| 013 | 相関バリでエラー表示・完了しない（前提=注意文） | bound(EEドリフト) | C-D3 |
| 014 | 相関バリでエラー表示されず継続（前提=上限文言） | bound(読替) | C-17 |
| 015 | 相関バリでエラー表示されず継続（前提=不整合エラー文） | excluded | — |
| 016 | 相関バリでエラー表示・完了しない（前提=登録上限） | bound(EEドリフト) | C-D1 |
| 017 | DB相関でエラー表示されず継続（前提=国pref整合） | bound(読替) | C-17 |
| 018 | DB相関でエラー表示・完了しない（前提=配送先反映） | bound(EEドリフト) | C-D3 |
| 019 | 上限超過エラーを出してご注文方法指定へ戻す | bound(EEドリフト) | C-D1 |
| 020 | 登録内容の対象レコードが追加される（前提=国pref不整合） | bound(読替) | C-08（IT-26・premiseはノイズ・期待「追加される」でbind・§0原則） |
| 021 | 登録内容の対象レコードが追加されない（前提=戻る送信） | bound(読替) | C-09 |
| 022 | 登録内容の対象レコードが追加される（前提=アドレス帳と配送先） | bound(読替) | C-08 |
| 023 | お届け先IDをセッションとCookieへ保存し配送先選択で参照 | bound(EEドリフト) | C-D7（session保存はC-07/C-08側でbound／Cookie保存がドリフト） |
| 024 | 登録内容の対象レコードが追加される（前提=既存注文分離） | bound(読替) | C-08 |
| 025 | 登録内容の対象レコードが追加される（前提=入力/最大長） | bound(読替) | C-08 |
| 026 | 登録内容の対象レコードが追加されない（前提=最大長+1） | bound(読替) | C-09 |
| 027 | 登録内容の対象レコードが追加される（前提=最小長） | bound(読替) | C-08 |
| 028 | 登録内容の対象レコードが追加されない（前提=最小長-1） | bound(読替) | C-09 |
| 029 | 登録内容の対象レコードが追加される（前提=dtb_customer_address） | bound(読替) | C-08 |
| 030 | 実行結果の対象レコードが追加される（前提=address_name） | bound(読替) | C-08 |
| 031 | 登録後の選択で当該注文の配送先へ反映（反映はF04-02） | bound | C-18（登録による`dtb_shipping`保存＝当機能責務・md:195,203／選択反映部のみF04-02委譲・codex R3是正） |
| 032 | 更新内容の対象レコードの値が変更される（前提=登録/更新） | bound(EEドリフト) | C-D6 |
| 033 | 更新内容の対象レコードの値が変更されない（前提=国pref） | bound(EEドリフト) | C-D6（既存更新経路が現eeに無く設計md検証は入口不能） |
| 034 | 更新内容の対象レコードの値が変更される（前提=登録上限） | bound(EEドリフト) | C-D6 |
| 035 | 自分のアドレス帳に対して登録・編集できる | bound(EEドリフト) | C-D8（登録はbound／編集がドリフト） |
| 036 | 更新内容の対象レコードの値が変更される（前提=送信不備/入力変更） | bound(EEドリフト) | C-D6 |
| 037 | 更新内容の対象レコードの値が変更される（前提=最大長） | bound(EEドリフト) | C-D6 |
| 038 | 更新内容の対象レコードの値が変更されない（前提=最大長+1） | bound(EEドリフト) | C-D6（既存更新経路が現eeに無く設計md検証は入口不能） |
| 039 | 更新内容の対象レコードの値が変更される（前提=最小長） | bound(EEドリフト) | C-D6 |
| 040 | 更新内容の対象レコードの値が変更されない（前提=最小長-1） | bound(EEドリフト) | C-D6（既存更新経路が現eeに無く設計md検証は入口不能） |
| 041 | 更新内容の対象レコードの値が変更される（前提=お届け先） | bound(EEドリフト) | C-D6 |
| 042 | 実行結果の対象レコードの値が変更される（前提=配送先名称） | bound(EEドリフト) | C-D6 |
| 043 | 会員が登録した複数のお届け先住所であること（アドレス帳） | bound(読替) | C-08 |
| 044 | 登録上限内なら新規入力画面を表示 | bound | C-05 |
| 045 | 指定IDの住所を読み込み編集画面を表示 | bound(EEドリフト) | C-D5 |
| 046 | 上限内かつ検証通過で登録し配送先選択へ遷移 | bound | C-07 |
| 047 | 見出し・会員名・案内文・各入力欄 | bound(EEドリフト) | C-D9（入力欄存在はC-01でbound／見出し・注意文がドリフト） |
| 048 | 国の選択に応じて都道府県の表示・隠しを切り替える | bound | C-04 |
| 049 | 送信はmode=confirm隠し項目を伴い確認画面遷移 | bound(EEドリフト) | C-D4 |
| 050 | 編集画面の表示時であること（前提=注意文） | bound(読替) | C-01 |
| 051 | キー front.shopping.error.customer_address_max | bound(EEドリフト) | C-D2 |
| 052 | キー form.country.error.invalid | bound(EEドリフト) | C-D3 |
| 053 | 画面表示データでエラー表示されず継続（前提=登録上限） | bound(読替) | C-17 |
| 054 | 国が日本×都道府県国外等は不整合として国にエラー付与 | bound(EEドリフト) | C-D3 |
| 055 | 画面表示データでエラー表示されず継続（前提=配送先反映） | bound(読替) | C-17 |
| 056 | 国にエラーを付与し編集画面を再表示 | bound(EEドリフト) | C-D3 |
| 057 | 編集画面を表示すること（確認画面で戻る送信） | bound | C-14 |
| 058 | 登録したお届け先はアドレス帳に追加され配送先選択へ引き継ぐ | bound(読替) | C-07 |
| 059 | お届け先IDをセッションとCookieへ保存し配送先選択で参照 | bound(EEドリフト) | C-D7（session保存はC-07/C-08側でbound／Cookie保存がドリフト） |
| 060 | 既受注の注文者・配送先は変わらない（画面で注意案内） | bound(EEドリフト) | C-D9（画面注意案内がeeに不在＝ドリフト） |
| 061 | お届け先入力フォーム（各項目） | bound | C-01 |
| 062 | 確認画面の表示、もしくは登録後の配送先選択への遷移 | bound(読替) | C-07 |
| 063 | 上限超過でご注文方法指定へ戻る | bound(EEドリフト) | C-D1 |

`func_scope_check` 判定: 親63/63会計済み・欠落0・理由なし重複0。C-EN-01（§4.4）は母集合対応先が無いため本表・本集計に含めない（会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

### 会計内訳（機械実証・再現用）

- bound成功（34）: 001,002,003,004,006,008,009,010,011,012,014,017,020,021,022,024,025,026,027,028,029,030,031,043,044,046,048,050,053,055,057,058,061,062
- bound(EEドリフト)（28）: 005,007,013,016,018,019,023,032,033,034,035,036,037,038,039,040,041,042,045,047,049,051,052,054,056,059,060,063
- partial（0）: —
- 要実機（0）: —
- TBD（0）: —
- excluded（1）: 015
- 34+28+0+0+0+1=63・差分0（001..063連番を全被覆・重複なし）

---

## §9 TBD・要実機・partial・excluded・BC-DRAFT（正直な分離）

### 要実機（該当なし）
外部送達を伴う母集合行が無い。住所自動入力（yubinbango外部JS）は設計md（md:33,172）が扱わないと明示し母集合行も無い。

### partial（該当なし）
1行内にbound枝/外部枝が混在する母集合行が無い。

### bound(EEドリフト)（母集合対応・28 test_id・§4.1d）
-019,-063,-016（C-D1・上限超過→ご注文方法指定へ戻す＝eeは404）／-051（C-D2・上限文言キー`customer_address_max`不在）／
-052,-054,-056,-013,-018（C-D3・国pref不整合→国エラー付与・`form.country.error.invalid`不在）／-049（C-D4・mode=confirm隠し項目不在）／
-005,-045（C-D5・既存お届け先の指定ID読込＝ee会員パスは常に新規生成・`{id}`はShipping ID）／
-032,-034,-036,-037,-039,-041,-042,-033,-038,-040（C-D6・既存レコードの値更新＝ee会員は常に新規persist・既存UPDATEなし。否定側も既存更新経路が無く設計md検証は入口不能）／
-023,-059（C-D7・お届け先IDのCookie保存＝ee対象フローはセッションのみ）／-035（C-D8・既存アドレスの編集権限＝登録はbound・編集経路なし）／
-007,-047,-060（C-D9・見出し「配送先の新規登録・変更」・変更不可の注意案内＝ee見出しja値「お届け先の追加」・注意文不在。入力欄存在自体はC-01でbound）。
**設計md（正本）が規定するが現eeに該当実装がgrep実測・ソース精読で見当たらず現eeでは失敗期待**。pf-eccube3 HareruyaEc（`DeliveryService.php:59,85-87`等）が踏襲元。
テストは設計md通りに書き、現eeに対してはドリフト検出（失敗が正当）として機能。「seed→期待観測可（成功）」とは誤記しない。bound成功（34件）と会計上区別（§8）。

### インフラ水準のハーネス前提（特定test_idに紐付かない・D5確定＝配備済み前提）

| # | 事項 | 状態（D5確定前提） |
|---|---|---|
| 0 | 共有隔離ハーネス（全カート系T2で共有・f04-04 §2と同一） | お届け先登録は`shopping_shipping_edit_complete`で`executePurchaseFlow`を通り購入手続き土台に触れるため前提。**D5確定＝配備済み前提で実行可能**（Mailer=null既定・Messenger in-memory＋worker非起動・UniSearch no-op・起動時外部非到達アサートを配備済み） |
| 1 | 破壊系S0のdb.ts配線 | 対象テーブル（dtb_customer_address新規行DELETE＋**dtb_shipping更新のUPDATE復元**〔登録経路でsetFromCustomerAddress→更新〕）・アドレス帳件数seedは§2で特定済み・**実配線はD5確定＝配備済み前提** |
| 2 | 購入手続き中受注＋対象Shippingのシード投入手順 | C-01〜C-09,C-14〜C-17/C-D1〜C-D9の前提。会員ログイン＋カート＋処理中受注＋dtb_shipping。**fixture具体値はD5確定＝配備済み前提** |
| 3 | アドレス帳上限（20件到達/未満）seed | C-05/C-D1の前提。`dtb_customer_address`件数の直接投入。**D5確定＝配備済み前提** |

### excluded（1件・§4.6で詳述・per-ID実引き）
-015（IT-22相関バリ・前提=不整合エラー文と期待=継続の矛盾）。前提の実在挙動はC-17でbound化済み＝偽陰性なし。-020はexcludedにせずC-08へbind（IT-26・§0原則）、**-031もexcludedにせずC-18へbind**（登録による`dtb_shipping`保存＝当機能責務・md:195,203／選択反映部のみF04-02委譲・codex R3是正）。

### TBD（該当なし）
期待テキストに「移行先で要確認」等の非アサーション行なし＝**母集合TBD 0**。
（C-EN-01の英語仕様は設計md確定値＝bound〔`@TBD`撤回済み・§4.4〕で、母集合に-EN行が無いため会計外補完＝母集合TBDに非算入。BC-DRAFT④の英語文言はeeに当該enキーが不在＝EEドリフト〔C-D2/C-D3のen面〕であって母集合TBDではない。）

### BC-DRAFT / DOC-DRAFT（設計md〔pf現行踏襲spec〕と ee実装の乖離候補・**断定回避**）

**T2規律**: オラクルは設計md。以下はeeを照合補助として観察した乖離候補で、**テストは設計mdどおりに書き**、乖離は不具合候補として別掲する。ee側の断定は避ける。

| # | 設計md（オラクル・pf現行踏襲） | ee観察（照合補助） | 乖離候補・区分 |
|---|---|---|---|
| ① | 編集画面の見出し「配送先の新規登録・変更」（md:70,104） | ee見出しキー`front.shopping.shipping_edit_header_customer`ja値=「お届け先の追加」（会員）／「お届け先の変更」（非会員・ja.yaml:1552-1553） | 見出し文字列差異。期待は設計md値。要確認 |
| ② | 変更不可の注意文（md:105・「既にいただいています…弊社へご連絡」） | ee `shipping_edit.twig`に当該注意文が見当たらない（grep0件・断定回避） | 注意文の移行有無が未確認＝要確認（未探索の共通パーツ/イベント差込の可能性は排除しない） |
| ③ | 登録後のお届け先IDを**セッションとCookie**へ保存（md:93,128,165,242,294） | eeは**セッションのみ**（`SESSION_SHOPPING_CUSTOMER_ADDRESS_ID`・ShoppingController.php:975）。**対象ShoppingController・Shoppingテンプレートにお届け先ID Cookie保存が見当たらない**（対象フロー限定でgrep0件。※ee全域にはCookie API利用自体は存在） | Cookie保存の移行有無が未確認＝要確認。session保存はC-07/C-08側でbound観測、Cookie保存は§4.1d C-D7（-023,-059）としてドリフト分離 |
| ④ | 上限文言`front.shopping.error.customer_address_max`／国pref文言`form.country.error.invalid`（md:114-115） | 両キーとも現eeにgrep0件（pf `message.ja.yml:1462`/`en.yml:1032`・`DeliveryService.php:59`に実在） | 翻訳キー・当該エラー挙動がeeに不在（ja/en両キーgrep0件）＝**EEドリフト**。**英語値は設計md/pfで確定**（`message.en.yml:1032`「The maximum number of addresses registration is exceeded.」/`:662`「The combination of country and region is incorrect.」）＝「-EN確定不能」は撤回。§4.1d C-D2/C-D3（en面含む）の一次根拠 |
| ⑤ | ルート`/{_locale}/shopping/delivery/{id\|new}/edit`・`/confirm`／テンプレ`delivery_edit.twig`（md:56-62） | eeは`shopping_shipping_edit`（`/shopping/shipping_edit/{id}`）・`delivery_confirm.twig`・`shipping_edit.twig`で提供（ShoppingController.php:792,861,881） | route名/パス/テンプレ名の差異（pf HareruyaEc customize→ee本体shipping_edit）。機能骨格は同等でDB効果観測に影響しない。期待値化はせず設計md route記述を正とする。断定回避 |
| ⑥ | 新規登録・上限超過→**上限超過エラーを出してご注文方法指定へ戻す**（md:83,153,235,250） | eeは上限超過時`throw new NotFoundHttpException()`（404・ShoppingController.php:821-823）。ご注文方法指定へのエラー付きリダイレクトでない | 上限超過時の挙動差異（エラー付きリダイレクト vs 404）。§4.1d C-D1の一次根拠。現行踏襲の正本挙動はpf/実機で確認。断定回避 |
| ⑦ | 編集画面送信は`mode=confirm`隠し項目（md:74） | eeは`mode=confirm`隠し項目を持たず、フォームvalid時に`delivery_confirm.twig`描画・`mode=back`で戻る（ShoppingController.php:861,903） | 送信モード機構差異。確認画面遷移自体はC-07でbound。§4.1d C-D4の一次根拠。断定回避 |

候補規律: 境界fixtureはD5確定桁で固定・**英語仕様(-EN)は設計md確定値＝bound（pf `delivery_edit.en.twig`/`message.en.yml`裏取り・ee差異/不在はEEドリフト＝C-D9/C-D2/C-D3のen面・母集合-EN行なしで会計外補完・母集合会計34/28不変）**・O5未確定・source_class確定はD6・O6/聖域/多軸/C6C7を主張しない。実行可能specコード/db.ts便宜関数の実装・実走はD6実装対象（環境/前提のD5配備済み前提とは別軸）。

---

## 付録: 作業実測

- 参照物: 設計mdオラクル 1（301行）／母集合 1（63行）／観点表 1／先例 1（f04-04）／
  ee照合補助（ShoppingController.php〔shippingEdit/shippingEditComplete〕・ShoppingShippingType.php・CustomerAddressType.php・
  CustomerAddress.php・shipping_edit.twig・messages.ja.yaml・eccube.yaml・OrderHelper.php）／pf照合補助（HareruyaEc DeliveryService.php・message.ja/en.yml）。
- L1 claim数: **19確定・TBD 0**。候補ケース**22**（bound成功12〔C-01〜C-09,C-14〜C-17〕・bound(EEドリフト)9〔C-D1〜C-D9〕・補完1〔C-EN-01〕）。
  母集合対応=bound成功34・bound(EEドリフト)28・partial 0・要実機 0・TBD 0・excluded 1（差分0・codex R1/R3是正後）。
- **本機能の要点（f04-04との差）**: (a)入力フォームを**持つ**ため必須/境界バリデーション（新規登録肯定/否定）が本機能に該当実挙動を持ち**bound**（f04-04はフォーム非存在でexcluded）。
  (b)母集合行は**すべて自社DB/セッション/画面で観測可能**で**partial/要実機が0**。(c)**★codex R1で確定した最大のドリフト**: 現eeの会員購入フローには**既存お届け先の読込/更新経路が無く常に新規追加**するため、
  設計md（pf HareruyaEc）が規定する既存編集・既存値更新・編集権限・Cookie保存・見出し/注意文・固有機構（route名・上限リダイレクト・両エラー文言キー・mode=confirm）が**現eeに不在**で
  **bound(EEドリフト)28件**として bound成功34件と会計区別。
- **codex R1是正の要点**: 旧「bound成功51」は既存編集/更新（ee不在）・Cookie（ee不在）・見出し/注意文（ee差異）をbound成功に混入していた虚偽会計だった→
  ee実ソース精読（ShoppingController.php:814-826,913-958）で既存編集/更新の非存在を確認し、C-D5〜C-D9を新設して28件へ再配賦。dtb_shipping更新のS0復元漏れも是正（§2）。
- **未検証事項（実機で要確認）**: BC-DRAFT①〜⑦（特に注意文②・Cookie③・エラー文言④・上限挙動⑥・既存編集/更新⑤⑥の間接経路/未探索領域＝プラグイン/イベント差込の可能性は排除しない）、
  会員名表示の有無。S0/ハーネスの実配線・pg_constraint照会はD5確定＝配備済み前提。過剰主張なし・数値は実測・grep0件は「見当たらない（断定回避）」として記載。
