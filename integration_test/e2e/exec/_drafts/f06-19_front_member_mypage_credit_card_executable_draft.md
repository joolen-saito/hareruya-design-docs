# B0候補: f06-19 フロント会員マイページ クレジットカード情報登録・変更 — 実行可能グレード候補（母集合76全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Blocker①〜③・Major④〜⑥）→改訂1で是正→R2=Blocker①③・Major④⑤⑥は閉塞・
> Blocker②未閉→改訂2で是正・R3再確認待ち**。
> トークン非保持・認証redirect・config無効404・Token=='del'優先・$isError中立記録・`_drafts`隔離はR1/R2でも
> 妥当承認済み（維持）。
> **改訂1（codex R1是正）**:
> (1) **Blocker①②=核心の実装事実の見落とし是正**: `Util::changeMemCard`のKaiinStatus 2/3分岐は、
>     `MemChg`失敗時に救済`MemInval`を呼び（Util.php:224-232）、この救済が**成功**すると
>     `plg_sln_mem_card_history`が書込まれる（L1-F0619-024と同一機構）ことを見落としていた。
>     「登録・変更はDB書込ゼロ」（旧L1-025・旧C-018）は**新規会員/KaiinStatus 4のMemAdd経路、および
>     KaiinStatus 0/1のMemChg単体成功時に限った条件付き事実**へ訂正し、新設**L1-F0619-041**
>     （救済経路の書込。`external_dependency:true`）で例外を明記。これに伴い**excludedとしていた
>     13 test_id（-020,-022,-024,-025,-027,-029,-030,-034,-036,-037,-039,-041,-042）を要実機へ再分類**
>     （新設**C-029**）。除外根拠が「登録・変更に書込ゼロで実挙動が存在しない」だった13件は、
>     救済経路という**実在する（が決済代行の既存会員枠状態に依存し単独では再現不能な）**referentを持つため、
>     excludedは不適切で要実機が正しい。
> (2) **Blocker③=破壊系S0復元の不備是正**: C-020（削除成功時のDB効果）のafterEachが`mem_id`のみ復元し
>     `update_date`を含めていなかった。§2/§6を訂正しS0に`update_date`を含め、復元は**直接SQL**
>     （Doctrine ORMを経由しないためpreUpdateの`SaveEventSubscriber`が再発火せず`update_date`を確実に
>     元値へ戻せる＝db.tsのraw psql実行方式と整合）で行う設計へ変更。加えて**実決済代行側の会員枠無効化は
>     自社DB復元では戻らない**ため、専用の使い捨て会員枠または代行側復旧手順を用意しない限りC-020を
>     実行しない旨の安全境界を明記。
> (3) **Major④=外部依存の会計不整合是正**: §8の76行対応表で、実際には決済代行の実応答が無いと観測できない
>     行（マスク表示=-006/-046/-058〔3〕、登録差替の実成立=-008〔1〕、削除の実成立=-009〔1〕、
>     業務エラーflash=-031/-070〔2〕、削除成功DB効果=-035/-049/-074〔3〕、成功flash=-067〔1〕＝計11行
>     ＋(1)の救済経路13行＝**計24行**）を誤って「bound」または「excluded」表記していた。全て「要実機」へ
>     訂正し、oracle jsonの`external_dependency`を実態に一致させた（当初5件→**10件**:
>     L1-005,006,016,023,024,028,031,037,038,041）。
> (4) **Major⑤=EN資源の実在を訂正**: 「本プラグインに英語ロケール資源なし＝全claim ja固定・-EN行なし」は
>     誤り。見出しの`front.mypage.title`はEC-CUBE**本体**の翻訳キーであり`messages.en.yaml:509`に
>     `My Account`が実在し、`app_locales=ja|en`（services.yaml:14）。**L1-F0619-004をLS=1へ訂正**し、
>     en localeでは「My Account/登録済クレジットカード」という日英混在の見出しになることを明記。
>     §4.2に補完**C-030（-EN）**を追加。プラグイン固有の文言（validation messages・flash等）にEN資源が
>     無いこと自体は維持（当該資源の`find`実測は変更なし）。
> (5) **Blocker⑥（旧-049の会計）**: 読み替えbound(C-020)としていた-049は、mem_id前進が決済代行の実OK応答
>     依存のため要実機へ移動（Major④の一部として統合処理）。
> **改訂2（codex R2是正）**:
> (6) **Blocker②未閉=C-018の否定側boundが外部状態依存**: L1-F0619-025の条件化自体（MemAdd・KaiinStatus0/1の
>     MemChg単体成功にはnextMemId呼出なし）は妥当だったが、C-018は「SEED-F06-CUSTOMERに決済代行側の
>     既存会員枠なし」という、ローカルSQL/SEEDでは作成・検証できない決済代行側の状態を前提にbound算入
>     していた。`dtb_customer`行の作成のみでは決済代行側の会員枠状態を保証できない（§6も決済代行
>     サンドボックスの接続情報・会員枠状態が確認できないと自認済み）。**C-018を§4.2（要実機）へ移動**
>     （母集合対応-021,-026,-028,-038,-040の5行が該当）。
> 母集合76の会計は35+22+19（差分0）→28+18+24+6（改訂1）→**28+13+29+6（差分0・改訂2で最終）へ組み直し**
> （§8参照。C-ID単位では§4.1=21件・§4.2〔要実機〕=8件〔C-006/008/009/016/018/020/028/029〕・
> §4.3補完=C-030の1件＝計30件）。
> source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `_drafts/m05-15_admin_order_order_mail_executable_draft.md`（外部連携・成分分離・破壊系afterEach）＋
> `_drafts/m05-13_admin_order_order_tracking_number_executable_draft.md`（破壊系S0・db.ts三段参照）＋
> `_drafts/m02-05_admin_home_home_ec_cube_news_executable_draft.md`・`m02-06_admin_home_home_recommend_plugins_executable_draft.md`
> （外部連携の成分分離bind＝アプリ成分と外部成分の切り分け）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/f06-19_front_member_mypage_credit_card_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下・`integration_test/e2e/exec/`直下には書かない。
> **本機能の要点（決済プラグイン＋外部決済代行依存）**: 決済プラグイン**SlnPayment42**（ソニーペイメント相当の
> 外部決済代行）が提供。カスタマイズ区分=**標準**（design md:15,48「挙動・DB関連ともec-cube-enterpriseの
> 決済プラグインSlnPayment42の実装を正とする」）。自社DB(`plg_sln_mem_card_history`)はカード原番号・トークン・
> 有効期限・名義を一切保持しない（会員と決済代行会員枠の対応識別子のみ）。**訂正（改訂1・Major⑤）**:
> プラグイン固有の文言（validation messages・flash・JS alert等）にEN資源が無いのは事実（`find`実測=不存在）だが、
> 画面見出しが使うEC-CUBE本体の翻訳キー`front.mypage.title`は`messages.en.yaml:509`に`My Account`が実在し
> `app_locales=ja|en`（services.yaml:14）＝「全claim ja固定・-EN行なし」は誤りで訂正済み（§5）。
> **行数集計（改訂2・最終）**: 候補ケース総数**30**（C-001〜C-028に加え新設C-029〔登録変更の救済経路DB書込・
> 要実機〕・C-030〔見出しEN観測・補完〕。bound対応・自己完結・全て§4に実体掲載）。
> 母集合76=bound直接一致**28**＋bound読み替え**13**（§4.1・21 C-ID）＋**要実機29**（§4.2・8 C-ID。
> C-006/C-008/C-009/C-016/C-020/C-028は当初bound算入していたがcodex R1 Major④是正で移動・C-018は
> codex R2 Blocker②是正で移動・C-029新設分13行を含む）＋**excluded6**（§4.1注・§9）。
> **28+13+29+6=76・差分0**（§8で機械実証・python集計で再現可能）。

---

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/f06-19_front_member_mypage_credit_card.md`（本repo・396行。
  以下「f06-19md:行」）。md:15,48「本機能のカスタマイズ区分は標準である。…挙動・DB関連とも
  ec-cube-enterpriseの決済プラグインSlnPayment42の実装を正とする。」
- ee/プラグイン実ソース: `/home/y-saito/Developments/ec-cube-enterprise/app/Plugin/SlnPayment42/`（作業ツリー
  実測。個別コミット固定は未実施＝D5/D6で版固定する）。
  - Controller = `Controller/MypageController.php`（editCard・threeCard）
  - Entity = `Entity/MemCardId.php`（`plg_sln_mem_card_history`）
  - Repository = `Repository/MemCardIdRepository.php`・`Repository/PluginConfigRepository.php`
  - Form = `Form/Type/CardType.php`
  - Route = `Resource/config/routes.yaml`（`sln_edit_card`）
  - DI/parameters = `Resource/config/services.yaml`（arrMemberRegist・arrAssistance・arrSecurityCode・
    arrCreditConnectionDestination等）
  - Template = `Resource/template/sln_edit_card.twig`
  - Service = `Service/Util.php`（changeMemCard・delMemCard・delKaiin・getNewKaiin・logDataReset）・
    `Service/SlnAction/Mem.php`（MemAdd/MemChg/MemInval/MemRef/MemRefM/MemUnInval/MemDel）・
    `Service/SlnAction/HttpSend.php`（決済代行への実HTTP送受信）・
    `Service/SlnContent/Credit/Member.php`（getCardNo()マスク実装）
  - errors.yml = 決済代行応答コード→業務エラー3要素文言の対応表
  - EC-CUBE共通: `src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php`（update_date自動設定の根拠）
- 母集合: `integration_test/all_it_cases.tsv` の機能名
  `f06-19_front_member_mypage_credit_card（フロント_会員_クレジットカード情報登録・変更）` 全**76行**
  （IT-F06-19-FRONT-MEMBER-MYPAGE-CREDIT-CARD-001〜076。以下「-nnn」。col1完全一致でgrep・awk実測=76件）。
- 既存実装（再利用・本候補の前提確認に使用）: `e2e/pages/front/f06/f06_19_front_member_mypage_credit_card.page.ts`・
  `e2e/spec/front/f06/f06_19_front_member_mypage_credit_card.spec.ts`（既に5件がfixme=「要: 決済代行会員枠シード」
  「要: 決済代行スタブ/隔離環境」「要: 店舗設定シード」「要: 外部スクリプト失敗注入」と明記済み。本書の
  外部依存/要実機切り分けと独立に到達した既存の判断であり、本書の切り分けと整合する）・
  `e2e/seed/sets/f06/SEED-F06-CUSTOMER.sql`（customer_id=900000101・ログイン可能な有効会員1件。ログインは
  `ECCUBE_FRONT_USER`/`ECCUBE_FRONT_PASS` 環境変数=`e2e/config/default.config.ts:10-13`）。
- **判定原則（W0-B0教訓の踏襲）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは
  各行の**「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全76行の期待要旨・
  会計・対応候補ケースを併記）。本機能はグロッサリ由来の定義文がそのまま期待列に落ちている行が多く
  （例: -002「外部の決済サービスであること。」＝用語集「決済代行」の定義。f06-19md:57）、これらは画面上の
  文言ではないため**読み替えbind**（観測可能な裏付け事実へ対応づけ）として per-ID で明示する（§4.1・§10）。
- **外部依存の切り分け（本機能最大の論点）**: 決済代行（SlnPayment42経由のソニーペイメント相当）への実通信
  結果——①会員照会で得る登録済みカードの有無・マスク番号・有効期限の**実表示**、②トークンによる実登録・
  差し替え・削除の**決済代行側の成否**、③トークン生成JS（`SpsvApi.spsvCreateToken`。提供元仕様=f06-19md:38
  「扱わないこと」）——④**登録・変更処理のうち、決済代行に既存会員枠（KaiinStatus 2/3）を持つ顧客が
  カード変更に失敗し、内部の救済無効化処理が成功する経路でのDB書込**（L1-F0619-041。§1改訂1で追加）は、
  決済代行のサンドボックスに実接続しないと確定できない。これらは**要実機**として§9で独立集計し、
  boundと偽らない。一方、認証ガード・ルーティング・画面フォーム構造/項目/バリデーション・
  登録/削除のトークン欄分岐（分岐が起きるという構造事実）・カード原番号/トークンを自社DBに保持しないことの
  スキーマ実引き・**新規会員（決済代行に既存会員枠を持たない顧客）のDB無効果**（L1-F0619-025の限定条件下）
  は、決済代行への実通信なしに**bound**できる。決済代行の接続情報・電文仕様・暗号鍵・3Dセキュア・
  購入時決済（f06-19md:35-38「扱わないこと」）は**スコープ外**とし、boundにも要実機にも含めない。

---

## §1 L1原子オラクル表

全41 claim（改訂1でL1-041追加）。LS=locale_sensitive（**LS=1は1件（L1-004）**。訂正: 当初「本プラグインに
英語ロケール資源が存在しないため全claim LS=0」としたが誤り。L1-004（画面見出し）はEC-CUBE本体の
翻訳キー`front.mypage.title`を使うためEN観測が可能＝LS=1。それ以外の40 claim（プラグイン固有の文言・
挙動）はLS=0のまま=D0固有事実）。
**期待値の正は本表のオラクルID**（決済代行の実応答は入力再現/観測手段であり期待値の正にしない）。
`external_dependency: true`（oracle json実測10件: L1-005,006,016,023,024,028,031,037,038,041）の claim は
決済代行の実応答が無いと最終値を確定できない（§9で要実機として独立集計）。表中「外部依存」列の「要」は
oracle jsonのフラグと、観測対象が構造/終端いずれかを問わず**利用者から観測可能な最終値**の確定可否を示す
（構造事実のみで完結するclaimは列内で「否（構造）」等と注記し区別）。

| oracle_id | 観点 | claim | 根拠(file:line) | 外部依存 |
|---|---|---|---|---|
| L1-F0619-001 | auth_rule | 完全認証(`IS_AUTHENTICATED_FULLY`)でない場合、GET/POST共にカード編集画面を描画せず`redirectToRoute('mypage')` | MypageController.php:47-49 | 否 |
| L1-F0619-002 | config_guard | `PluginConfig.getMemberRegist()`==`arrMemberRegist['無し']`(=2)のとき`NotFoundHttpException`（404） | MypageController.php:54-57／services.yaml:121-124 | 否 |
| L1-F0619-003 | http_status | route `sln_edit_card`=`GET/POST /{_locale}{_shop}/mypage/sln_edit_card`。登録/削除は同一URL POSTでトークン欄値により分岐 | routes.yaml:23-31 | 否 |
| L1-F0619-004 | display_field | 画面見出し=`front.mypage.title`（EC-CUBE**本体**の翻訳キー。ja「マイページ」/en「My Account」）+twigにハードコードされた固定文字列「/登録済クレジットカード」（このサフィックス自体にtransキー・EN資源は無い）。`app_locales=ja|en`のためen localeでは「My Account/登録済クレジットカード」という**日英混在**の見出しになる（改訂1で訂正。§5参照） | sln_edit_card.twig:434／messages.ja.yaml:629／messages.en.yaml:509／services.yaml:14 | LS=1（**否**＝gateway不要） |
| L1-F0619-005 | display_field | GET表示時、MemRef応答`KaiinStatus==0`のときのみ`$OldCard`セット→「カード番号:」+マスク番号+「有効期限:◯◯年 ◯◯月」+削除ボタン表示。それ以外はブロック非表示 | MypageController.php:117-141／twig:466-487 | **要**（KaiinStatus実値） |
| L1-F0619-006 | masking_algo | `Member::getCardNo()`=`CardNo ? '**********'.substr(CardNo,-4) : CardNo`（原番号長に関わらずアスタリスク10文字固定） | SlnContent/Credit/Member.php:199-202 | 否（算式自体）／**要**（実マスク文字列の画面観測） |
| L1-F0619-007 | display_field | editCard用CardTypeは`AddMem`/`PayType`/`BillingFirstName`/`BillingLastName`/`BillingEmail`をremove済み。残る項目はCardNo/CardExpMonth/CardExpYear/KanaSei/KanaMei(条件)/SecCd(条件)/BirthDay(条件)/TelNo(条件)/Token(hidden) | MypageController.php:59-64／CardType.php:243-271 | 否 |
| L1-F0619-008 | display_cond | KanaSei/KanaMei欄=`'KanaSei' in config.AttestationAssistance`／SecCd欄=`config.SecCd==1`／BirthDay欄=`'BirthDay' in AttestationAssistance`／TelNo欄=`'TelNo' in AttestationAssistance` | twig:513,532,551,567／services.yaml:110-119 | 否 |
| L1-F0619-009 | message | checkCardNo: 未入力「カード番号を入力してください」／非数字「ハイフンは間に入れず、番号のみを入力してください」／14桁未満or16桁超「正しいカードを入力してください」 | twig:225-250 | 否 |
| L1-F0619-010 | message | checkCardExp: 月未選択「カード有効期限/月を入力してください」／年未選択「カード有効期限/年を入力してください」 | twig:252-281 | 否 |
| L1-F0619-011 | message | checkKana: 姓/名未入力「カード名義/姓(名)を入力してください」／非カタカナ「カード名義/姓(名)をカタカナを入力してください」 | twig:283-324 | 否 |
| L1-F0619-012 | message | checkSecCd: 未入力「セキュリティコードを入力してください」／非数字「セキュリティコードは数字のみを入力してください」／3桁未満「セキュリティコードは3文字以上数字を入力してください」 | twig:326-349 | 否 |
| L1-F0619-013 | message | checkBirthDay: 未入力「生月日を入力してください」／非数字「生月日は数字のみを入力してください」／4桁でない「生月日は4文字を入力してください」 | twig:351-374 | 否 |
| L1-F0619-014 | message | checkTelNo: 未入力「電話番号を入力してください」／非数字「電話番号は数字のみを入力してください」／4桁でない「電話番号は下4桁をご記入下さい」 | twig:376-399 | 否 |
| L1-F0619-015 | status_transition | getToken(): 6チェックを順次実行、いずれか失敗でalert「入力項目を再度ご確認ください」＋return false（送信・外部通信なし）。全通過で入力欄クリア＋表示切替＋`SpsvApi.spsvCreateToken`呼出 | twig:138-223 | 否（呼出の有無まで）／**要**（トークン生成自体はJS提供元仕様=md:38スコープ外） |
| L1-F0619-016 | message | `spsvCreateToken`呼出しの例外捕捉時、alert「現在決済通信障害が発生しております。後ほどお試しください。」+err→`url('mypage')`へ遷移 | twig:215-221 | 否（分岐構造）／**要**（例外の実誘発） |
| L1-F0619-017 | status_transition | cardDelete(): Token隠し欄に`'del'`をセットしフォーム送信。`isDelSend`により二重押下時alert「カード情報削除処理中ため少々お待ちください。」＋return false | twig:409-422 | 否 |
| L1-F0619-018 | status_transition | POST受信順序: Token=='del'→フォーム検証を経ずMemInval実行→成功時flash+redirect。del以外はisSubmitted&&isValidのときのみToken有れば`changeMemCard`実行→同flash+redirect。invalidならflash「入力項目をご確認ください。」（redirectなし） | MypageController.php:66-92 | 否（分岐構造）／**要**（決済代行側の最終成否） |
| L1-F0619-019 | validation_rule | editCard使用フィールドは全てrequired=>false。CardNo:Length(max16)+Regex数字／CardExpYear:Regex数字+Length(max4)／CardExpMonth:Regex数字+Length(max2)／KanaSei・KanaMei:Length(max10)+Regexカタカナ／SecCd:Length(max4)+Regex数字／BirthDay:Length(min4,max4)+Regex数字／TelNo:Length(min4,max4)+Regex数字／Token:NotBlankだがrequired=>false | CardType.php:59-224 | 否 |
| L1-F0619-020 | message | サーバRegex違反共通文言「半角数字で入力してください。」（CardNo/CardExpYear/CardExpMonth/SecCd/BirthDay/TelNo） | CardType.php:68,83,101,180,196,212 | 否 |
| L1-F0619-021 | validation_rule | POST_SUBMITリスナ: BirthDayのMM<=12かつDD<=31でなければBirthDay欄に「生月日を正しく入力ください。」。CardExpYear<現在年→CardExpYear欄、==現在年かつCardExpMonth<現在月→CardExpMonth欄に「正しく入力ください。」 | CardType.php:272-292 | 否 |
| L1-F0619-022 | status_transition | `Util::changeMemCard`: MemRef取得失敗/会員未存在→MemAdd。KaiinStatus 0/1→MemChg。2/3→MemUnInval+sleep(5)+MemChg（失敗時MemInval実行後に例外再送出）。4→MemAdd | Util.php:205-245 | 否（分岐構造）／**要**（KaiinStatus実値・成否） |
| L1-F0619-023 | error_handling | SlnShoppingException捕捉時flash=`$e->getMessage()`（ns=sln_mypage_card）+log_error+addCardNotice。checkSystemError()ならaddErrorLog+管理者宛sendErrorMail。文言接頭辞: MemAdd失敗='クレジットカードの登録に失敗しました:'／MemChg失敗='会員の更新に失敗しました:'／MemInval失敗='会員情報の削除が失敗しました:'／MemRef系失敗='会員情報の参照が失敗しました:' | MypageController.php:93-106／Mem.php:111-115,173-177,236-240,296-299,358-361 | **要**（応答コード依存） |
| L1-F0619-024 | db_effect | `plg_sln_mem_card_history`書込は`MemCardIdRepository::nextMemId()`のpersist+flushのみが発生源（customer_id既存→mem_id+1、なければcustomer_id/mem_id=1で新規作成）。呼出はMem::MemInval内でHTTP応答truthy かつ ResponseCd=='OK' の場合のみ（Util::delKaiin経由） | Mem.php:208-211／Util.php:181-184／MemCardIdRepository.php:54-69 | **要**（成功応答が必要） |
| L1-F0619-025 | db_noeffect | **【改訂1・条件化＝R1 Blocker②是正】** 訂正前は「登録・変更は全分岐でDB書込ゼロ」としたが誤り。正しくは(a)新規会員/KaiinStatus 4のMemAdd呼出し単体、(b)KaiinStatus 0/1のMemChg単体成功時、はいずれも`plg_sln_mem_card_history`へpersist/flushを呼ばない（getMemId()読取のみ）。(c)【例外】KaiinStatus 2/3分岐でMemChgが失敗すると救済MemInvalが呼ばれ、これが成功すると書込が発生する（→L1-F0619-041）。「DB書込ゼロ」は(a)(b)の条件下に限る | Mem.php:69-154,255-339,379-401／Util.php:176-194,214-234(0/1/4分岐にpersist/flush不出現=grep実測) | 否（(a)(b)の範囲）／**要**（(c)の到達要否はKaiinStatus実値依存＝L1-041） |
| L1-F0619-026 | db_effect | `MemCardId.update_date`はEC-CUBE共通`SaveEventSubscriber`（prePersist/preUpdateで`method_exists($entity,'setUpdateDate')`ダックタイピング）が自動設定。`nextMemId()`自体は`setUpdateDate()`を呼ばない | src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:26-27,37-57,62-76／app/config/eccube/services.yaml:42,214-217 | 否 |
| L1-F0619-027 | derived_value | `KaiinId=sprintf('%03d',500+mem_id).sprintf('%010d',customer_id)`／`KaiinPass=substr(preg_replace('/[^0-9a-zA-Z]/','',md5(customer_id.eccube_auth_magic)),0,12)`。原値は画面・ログ・設計書に出さない | Util.php:186-194 | 否 |
| L1-F0619-028 | message | 「カード情報を更新しました」（ns=eccube.sln_mypage_card.warning）は登録・差し替え成功時と削除成功時の両方でflash | MypageController.php:75,77,87,89／twig:441-447 | **要**（成功=決済代行の実応答依存） |
| L1-F0619-029 | message | 「入力項目をご確認ください。」はサーバ側フォーム`isValid()==false`のときflash | MypageController.php:91 | 否 |
| L1-F0619-030 | message | 「通信エラーが発生しました、後ほどお試しください。」はSlnShoppingException以外の`\Exception`捕捉時（通信失敗・HTTP200以外・空応答等）にflash | MypageController.php:107-112／HttpSend.php:104-156 | 否（分岐構造。到達には通信断が必要=環境依存） |
| L1-F0619-031 | display_cond | GET表示のMemRef呼出しはtry/catchで囲まれ、例外時はlog_errorのみでOldCardはnullのまま（登録済みカードブロック非表示・フォームは通常描画） | MypageController.php:119-130 | **要**（例外の実誘発） |
| L1-F0619-032 | display_dead | サーバ変数`$isError`は常にfalse初期化・以降このファイル内で再代入なし（単一ローカル変数のため他ファイルからの上書き不可）。twigの`{% if isError %}`分岐（サーバレンダーの通信障害文言）はサーバ側から到達不能 | MypageController.php:45,138／twig:449-452 | 否 |
| L1-F0619-033 | form_scope | editCard用CardTypeから`AddMem`/`PayType`/`BillingFirstName`/`BillingLastName`/`BillingEmail`をremove() | MypageController.php:59-64 | 否 |
| L1-F0619-034 | log_masking | `HttpSend::sendData()`送信ログはKaiinPass/MerchantPass/CardNo/CardExp/SecCd/KanaSei/KanaMei/BirthDay/TelNoを`'****'`へ置換。応答ログはCardExp数字を`CardExp=****`へ正規表現置換 | HttpSend.php:52-98,158 | 否 |
| L1-F0619-035 | schema | `plg_sln_mem_card_history`列=customer_id(PK,int,not null)／mem_id(int,not null)／update_date(datetime,not null)のみ。カード原番号・有効期限・名義・トークン・セキュリティコード列は不存在 | MemCardId.php:22-34 | 否 |
| L1-F0619-036 | db_noeffect | `plg_sln_mem_card_history`へのDELETE経路は不存在（Repositoryにdeleteメソッド自体が無い）。カード「削除」は決済代行側会員枠無効化＋自社mem_id前進で表現され、自社DB行の物理削除ではない | MemCardIdRepository.php（全文） | 否 |
| L1-F0619-037 | external_dependency | Mem各メソッドはいずれも`config.getCreditConnectionPlace2()`（外部ホスト。destination=1既定=`https://www.test.e-scott.jp/online/crp/OCRP005.do`）へGuzzleでPOST | HttpSend.php:43-121／services.yaml:199-207 | **要**（接続そのもの） |
| L1-F0619-038 | external_dependency | 業務エラー文言は決済代行応答コード(ResponseCd)を`errors.yml`(arrErrors)で解決した3要素（内部詳細\|利用者向け\|管理者向け）から組立。例K40-K44の利用者向け=「こちらのカードはご利用できません。入力内容に誤りがなければ、お問合せください。」 | errors.yml:1-40／Util.php:109-144 | **要**（実応答コード） |
| L1-F0619-039 | db_noeffect | GET表示のMemRef呼出し(L1-F0619-005/031)は読取(getMemId経由)のみでnextMemIdを呼ばない。画面表示だけでは自社DB無更新 | MypageController.php:119-130／Mem.php:255-277 | 否 |
| L1-F0619-040 | display_field | `sln_edit_card.twig`全文に`class="modal"`相当・`data-bs-toggle="modal"`は0件出現（本画面固有モーダル不存在） | sln_edit_card.twig（全文grep実測） | 否 |
| L1-F0619-041 | db_effect | **【新設・R1 Blocker①②是正】** `Util::changeMemCard`のKaiinStatus 2/3分岐（220-221行目）: MemUnInval実行(222)→sleep(5)(223)→内側try(224)でMemChg試行(225)。MemChgがSlnShoppingExceptionまたは任意の`\Exception`を投げると、catch節(226,229)内で救済`$mem->MemInval(...)`を呼ぶ(227,230)。この救済MemInvalはL1-F0619-024と同一機構（HTTP応答truthyかつResponseCd=='OK'ならUtil::delKaiin→nextMemIdでDB書込）を持つ。救済が成功すると、その後`throw new SlnShoppingException($e->getMessage())`(228)または`throw new \Exception($e->getMessage())`(231)で元のMemChg失敗メッセージが再送出され、利用者には業務エラー(L1-023)または通信エラー(L1-030)のflashが表示される＝**利用者からは失敗に見えるがDB書込が発生している場合がある**。救済MemInval自体が失敗した場合はその新しい例外が伝播しDB書込は発生しない。この経路はKaiinStatus 2または3の既存決済代行会員枠を対象顧客が持つ場合にのみ到達し、新規会員（MemAdd経路）には無い | Util.php:214-234／Mem.php:192-217(MemInval本体・208-211でHTTP応答truthy時のみdelKaiin) | **要**（KaiinStatus 2/3の既存会員枠＋MemChg失敗＋救済成功、という複合状態が必要） |

---

## §2 SEED三段参照設計

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID → 観測=実値（db.ts）**。
決済代行の実応答は**入力の再現手段でも期待値の正でもない**（本機能では決済代行を代替できるサーバ側スタブが
存在せず、m02-06/m05-15のような自作スタブAPIも作れない外部SaaS＝サンドボックス実接続が唯一の再現経路）。

| SEEDセットID | 目的 | 内容 | 後始末 |
|---|---|---|---|
| SEED-F06-CUSTOMER | ログイン会員（既存・再利用） | `dtb_customer` id=**900000101**。`ECCUBE_FRONT_USER`/`ECCUBE_FRONT_PASS`でフロントログイン可能（e2e/seed/sets/f06/SEED-F06-CUSTOMER.sql実在）。**【改訂2・R2 Blocker②是正】** 当初「決済代行側に既存会員枠を持たないことを前提にMemAdd経路へ確実に入る」としていたが、`dtb_customer`行の作成のみでは決済代行側の会員枠状態を検証・保証できない（このSEEDは自社DB側の会員行を作るだけで、決済代行側の状態には関与しない）。MemAdd経路に入るかKaiinStatus 2/3の救済経路（L1-F0619-041）に入るかは決済代行への実MemRef応答でしか確定できないため、これに依存するC-018は§4.2（要実機）で扱う | 不変（UPSERTべき等） |
| SEED-F0619-NOCARD | `plg_sln_mem_card_history`に行が無い状態のS0基準（900000101が対象。初期状態は行なしを既定とする） | 行なし＝S0（`SELECT * FROM plg_sln_mem_card_history WHERE customer_id=900000101`が0行であることを各ケース開始前に確認 or 明示的にDELETEしてS0を作る） | 操作前後でS0との差分のみ許容 |
| SEED-F0619-CONFIG-DISABLED | `PluginConfig`の`memberRegist`を「無し」(2)にした店舗設定（404観測用。**SQLは未整備**＝PluginConfigはJSON列(subData)にConfigSubDataをシリアライズする方式=`PluginConfigRepository.php:149-160`のため、直接INSERTでなくConfigSubData::ToSaveData()相当のJSON生成が必要） | `plg_sln_payment42_config`（テーブル名は要実装確認）へ最新行としてmemberRegist=2を含むJSONを投入 | UPSERT。既定(有り=1)へ復元 |
| （非対象・スコープ外） | 決済代行サンドボックスの会員枠状態（登録済みカード有無・KaiinStatus 0/1/2/3） | 本機能のE2Eでは用意不能（外部SaaS。§9要実機） | — |

- **破壊系は`plg_sln_mem_card_history`の1系統のみ**。書込源は**2経路**: ①削除成功（`ResponseCd=='OK'`を
  伴う`Mem::MemInval`。L1-F0619-024）と、②登録・変更でKaiinStatus 2/3の既存会員枠を持つ顧客がMemChgに
  失敗し内部の救済MemInvalが成功する経路（L1-F0619-041。**改訂1で追加**）。SEED-F06-CUSTOMERは決済代行に
  既存会員枠を持たない想定のため②へは到達せず、**①のみが本SEEDの範囲でDB状態を変える**（②は要実機・
  §9で別集計）。
- **S0スナップショットは`customer_id`の行の**有無・mem_id値・**update_date値**（改訂1・R1 Blocker③是正=
  当初mem_idのみとしていたのを訂正）を操作直前に取得する。取得は`db.ts`のraw psql（`queryRows`等）で行い
  ORM/Doctrineを経由しない（=`SaveEventSubscriber`のprePersist/preUpdateを発火させない）。
- **復元も直接SQL（raw psql）で行う**: 既存行なら`UPDATE plg_sln_mem_card_history SET mem_id=<S0.mem_id>,
  update_date=<S0.update_date> WHERE customer_id=...`、新規作成された行なら`DELETE FROM
  plg_sln_mem_card_history WHERE customer_id=...`。raw SQLはDoctrineのイベントリスナを経由しないため
  `update_date`が復元操作自体によって「今」に上書きされ直すことはない（アプリ層のpersist/flushで復元すると
  `SaveEventSubscriber`のpreUpdateが再発火し`update_date`が復元できないため、raw SQL必須）。
- **安全境界（改訂1・R1 Blocker③是正）**: **実決済代行側の会員枠無効化（KaiinStatusの変化）は自社DB復元では
  戻らない**。C-020（削除成功のDB効果）を実行すると、対象顧客の決済代行側会員枠は実際に無効化され、
  自社DB行を元通りに復元しても決済代行側の状態は元に戻らない。したがって**C-020は専用の使い捨て会員枠
  （テスト専用に登録・破棄してよいカード情報を持つ会員枠）または決済代行側の復旧手順が用意されない限り、
  共有・実データの会員枠に対して実行してはならない**。本SEED設計では使い捨て会員枠の具体的な用意方法は
  **未確定（`@TBD-D5`）**とし、確定するまでC-020は実行保留とする。
- 決済代行が実接続できない環境では、削除POSTを送っても`HttpSend::sendData()`が例外/非200/空応答のいずれかで
  falseを返し、`Mem::MemInval`が`\Exception`を投げるため、`nextMemId()`は呼ばれない＝**DB不変**が観測される。
  これは「削除成功時のみ書込が起きる」という否定側（L1-F0619-024の否定条件）を、決済代行に接続できなくても
  検証できることを意味する（C-022のロバスト性の根拠）。**【改訂2・R2 Blocker②是正】** C-018
  （登録・変更でSEED-F06-CUSTOMERを用いたDB無効果）は、この「決済代行に接続できなくてもDB不変」という
  ロバスト性自体は成立するものの、その前提（当該customer_idが決済代行に既存会員枠を持たない、という
  決済代行側の状態）を`dtb_customer`行の作成だけでは検証・保証できないため、§4.2（要実機）へ分類する
  （C-022のような「応答の成否を問わない」ロバスト性とは異なり、C-018は「対象customer_idの決済代行側の
  識別結果」という制御不能な前提に依存する）。
- config guard（404）は`PluginConfig`の最新行（`findOneBy([], ['id'=>'DESC'])`）に依存するため、テスト対象環境の
  `plg_sln_payment42_config`の現況（通常は`memberRegist=1`＝有効）を前提にする。SEED-F0619-CONFIG-DISABLEDの
  投入・復元手順の確定はD5（`@TBD-D5`）。

---

## §3 画面項目マトリクス

三値比較: 設計書md（入力項目表:200-214）／ee Form（CardType.php）／ee DB（`plg_sln_mem_card_history`にこれらの
列は存在しない＝**全項目が自社保存なし**の一枚岩マトリクス）。

| 項目 | Form必須/任意 | サーバ制約 | クライアント側チェック | 表示条件 | DB保存 |
|---|---|---|---|---|---|
| カード番号(CardNo) | 任意(required=>false) | Length(max16)+Regex(半角数字)="半角数字で入力してください。" | 未入力/非数字/14桁未満or16桁超 | 常時表示 | **なし**（L1-F0619-025・L1-F0619-035） |
| カード有効期限(月) | 任意 | Regex(半角数字)+Length(max2) | 未選択 | 常時表示 | なし |
| カード有効期限(年) | 任意 | Regex(半角数字)+Length(max4) | 未選択 | 常時表示 | なし。CardExpYear<現在年 or (==現在年 and CardExpMonth<現在月)は送信後チェックで弾く(L1-F0619-021) |
| カード名義(姓/名) | 任意 | Length(max10)+Regex(カタカナ) | 未入力/非カタカナ | `'KanaSei' in config.AttestationAssistance` のときのみ | なし |
| セキュリティコード | 任意 | Length(max4)+Regex(半角数字) | 未入力/非数字/3桁未満 | `config.SecCd==1` のときのみ | なし |
| 生月日 | 任意 | Length(min4,max4)+Regex(半角数字) | 未入力/非数字/4桁でない | `'BirthDay' in config.AttestationAssistance` のときのみ | なし。POST_SUBMITでMM<=12&&DD<=31を検査(L1-F0619-021) |
| 電話番号下4桁 | 任意 | Length(min4,max4)+Regex(半角数字) | 未入力/非数字/4桁でない | `'TelNo' in config.AttestationAssistance` のときのみ | なし |
| トークン(Token) | NotBlank制約はあるがrequired=>false | — | クライアントJSが`getToken()`成功時にセット。削除時は`'del'`固定 | hidden常時 | なし。値の有無/`'del'`一致がサーバ分岐条件（L1-F0619-018） |

サーバ側はいずれの項目もNotBlankを持たず、桁・形式のみを検証する（f06-19md:214,291と一致）。
登録時の実質必須はクライアント側チェックで担保する。全項目が「自社保存なし」である点は、本機能が
「登録内容/更新内容の対象レコードが追加・変更される」という汎用IT-26テンプレを字義通り満たさない
根本理由であり、§8/§9で詳細に扱う。

---

## §4 実行可能グレードTSV（候補・**自己完結＝全30候補ケースを実体掲載**）

記法: `%eccube_admin_route%`等の環境値は該当なし（フロント機能）。`{_locale}{_shop}` は環境値。
期待結果セルは `…実値… [L1:<oracle_id>]` の三段参照記法。**【改訂1・R1 Major④是正／改訂2・R2 Blocker②是正】**
母集合の期待テキストが決済代行の実応答（表示値・成否）を主張している場合、またはその主張の成立が決済代行
**側の状態**（我々がローカルSQL/SEEDで検証・固定できない状態）に依存する場合、その候補ケースは§4.1
（bound）ではなく**§4.2（要実機）へ分離**する。判定基準: 当該ケースの成立が**ローカルで検証・固定できる
前提だけで完結するか**——config設定値・フォーム入力値・認証状態・「決済代行への通信そのものが到達不能」
という環境操作（C-026のように我々が能動的に作れる状態）など**自社側で確定できる前提のみ**を§4.1（bound）
とし、登録済みカードの存在・決済代行の応答成否（成功/業務エラー）・KaiinStatusの実値・**特定の顧客が決済代行に
既存会員枠を持たない、という決済代行側の状態**（`dtb_customer`行の作成だけでは検証も保証もできない）を
要する場合は§4.2（要実機）とする。当初はこの基準がケースごとに不徹底で、C-006/C-008/C-009/C-016/C-020/
旧C-028の6件が誤って§4.1〔bound〕に算入されていた（R1 Major④指摘・改訂1で是正）。**改訂2（R2 Blocker②
是正）**: さらにC-018も同種の誤りだったと判明した——「SEED-F06-CUSTOMERは決済代行に既存会員枠を
持たない」という前提は、`dtb_customer`のみを作成するローカルSEEDでは検証も保証もできない決済代行側の
状態であり（§6でも決済代行サンドボックスの接続情報・会員枠状態が本リポジトリのseed/READMEから確認
できないと自認している）、C-026（能動的に通信不能状態を作れる）とは性質が異なる。C-018を§4.2へ移動する。

### §4.1 母集合対応・bound（決済代行への実接続なしで完結。全21 C-ID・41母集合行を実体掲載）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 外部依存 | 対応母集合 |
|---|---|---|---|---|---|
| C-001 | 画面見出し | GET `/{_locale}{_shop}/mypage/sln_edit_card`（完全認証済み・config有効） | 画面見出しは「マイページ/登録済クレジットカード」 `[L1:F0619-004]` | 否 | -001,-012,-052,-057（読み替え・§4.1注1） |
| C-002 | 外部依存の構造事実 | ソース確認（実行不要・非UI） | 決済代行への送信先URLは外部ホスト（test/prod いずれも e-scott.jp配下）であり自社ドメインでない `[L1:F0619-037]` | 否（事実の確認自体） | -002（読み替え・§4.1注2） |
| C-003 | 会員枠識別子の組立 | ソース確認（非UI） | KaiinId/KaiinPassは会員IDと枝番/アプリ固有値から導出され、原値は画面・ログ・設計書に出さない `[L1:F0619-027]` | 否 | -003,-043（読み替え） |
| C-004 | トークンの非保持 | ソース確認＋GET画面のhidden要素確認 | トークンはhidden欄`data-key='card_token'`にのみ存在し自社DBのいかなる列にも対応しない `[L1:F0619-007,L1:F0619-035]` | 否 | -004,-044（読み替え） |
| C-005 | 登録状況の参照構造（非UI・狭義） | ソース確認のみ（実行不要） | GET時にMemRefを呼びKaiinStatusで登録済みカードの有無を判定するという**コード構造**が存在する（L1-F0619-031で例外時OldCard=nullも含め確認済み）。**実際にどの値が返るか・画面に何が出るかはC-006の対象**（本ケースには含めない） | 否（コード構造の確認のみ。L1-F0619-005自体はdisplay込みでexternal_dependency:trueだが、本ケースはそのうち非UI部分に限定してbind） | -005,-045（読み替え） |
| C-007 | GET画面表示フロー（フォーム描画の保証） | 完全認証済み・config有効でGET | MemRef呼出しの成否に関わらず（例外時もL1-F0619-031によりcatchされ処理続行）、フォーム（C-004項目群）が必ず描画される。登録済みカードの追加表示（C-006相当）は本ケースの主張に含めない | 否（フォーム描画自体はMemRefの成否に依存しない） | -007,-047 |
| C-010 | 未認証ガード | 未ログイン（またはCookie削除後）でGET | カード編集画面を表示せず、`/{_locale}{_shop}/mypage`（マイページ入口）へredirect。専用メッセージなし `[L1:F0619-001]` | 否 | -010,-050,-071 |
| C-011 | クライアント側送信前チェック | GET画面→全項目未入力のままカード情報登録リンク押下 | 6チェックを順次実行し失敗のためalert「入力項目を再度ご確認ください」を出し送信しない（決済代行への通信は発生しない） `[L1:F0619-009〜015]` | 否 | -013(読替),-053,-064 |
| C-012 | 削除フロー（検証バイパス＋二重送信防止・クライアント/サーバ分岐構造） | GET画面→カード情報削除ボタン押下（連続2回） | 1回目はフォーム検証を経ずToken='del'で送信される（＝サーバはisValid()を評価せずMemInvalへ進む、という分岐の到達）。2回目（送信完了前）はalert「カード情報削除処理中ため少々お待ちください。」で送信しない。**MemInvalの決済代行側の成否そのものは主張しない**（C-029/C-020の対象） `[L1:F0619-017,L1:F0619-018]` | 否（分岐到達はToken='del'かどうかのみで決まり決済代行の応答を問わない） | -014(読替),-054,-066 |
| C-013 | サーバ相関(BirthDay/CardExp)検証 失敗 | POST（request契約）でBirthDay=不正MM/DDまたはCardExpYear/Month=過去日を含める | 該当欄に「生月日を正しく入力ください。」または「正しく入力ください。」が付き、フォームはinvalid（この検証はフォーム層で完結し決済代行への通信前に確定する） `[L1:F0619-021]` | 否 | -013,-016,-063 |
| C-014 | サーバ相関(CardExp)検証 通過 | POST（request契約）でCardExpYear/Month=当年当月以降（有効な値） | 相関エラーは付かない（フォームのこの検証はpass。この後決済代行への通信が試みられるかはC-008/C-029の対象で本ケースは検証層のみ主張） `[L1:F0619-021]` | 否 | -015 |
| C-015 | フィールド表示条件 | config.AttestationAssistance/SecCdの各設定値を変えてGET | KanaSei/KanaMei・SecCd・BirthDay・TelNoの各欄は、対応する設定値を含む/満たす場合のみ表示される `[L1:F0619-008]` | 否 | -019,-023,-059,-060,-061,-062 |
| C-017 | config無効(404)・DB無効果 | `PluginConfig.memberRegist`=無し(2)でGET/POST | HTTP404（NotFoundHttpException）。専用メッセージなし。`plg_sln_mem_card_history`は不変 `[L1:F0619-002]` | 否 | -033,-072 |
| C-019 | 登録・差し替えの分岐規則 | ソース確認（非UI） | 決済代行への会員照会で得た登録状況(KaiinStatus)により、会員枠のカード変更(0/1)・無効解除後の変更(2/3)・会員枠の新規作成(4/未存在)を選ぶという**分岐規則そのもの**（実際にどの分岐を通るかはKaiinStatus実値次第でC-006/C-029等の対象） `[L1:F0619-022]` | 否（分岐規則自体） | -073 |
| C-021 | カード情報の非保持（総括） | ソース確認＋スキーマ確認 | カード原番号・有効期限・セキュリティコード・トークンは画面入力/決済代行送信のためだけに一時的に扱われ、自社DBに保持しない `[L1:F0619-035]` | 否 | -075 |
| C-022 | 行の物理削除ゼロ（普遍事実） | S0取得→任意の登録/削除POST（決済代行応答問わず） | `plg_sln_mem_card_history`に対しDELETE文が発行されることはない（行数は減少しない。増加または不変のみ。決済代行が成功/失敗いずれの応答でもDELETE文自体が実装に存在しないため成立） `[L1:F0619-036]` | 否 | -048 |
| C-023 | レイアウト・入力補助文 | GET画面表示（各条件欄が有効な設定） | マイページ共通レイアウトを使い、有効な各欄に対応する入力補助文（本人名義/署名欄位置/生月日/電話番号の説明）を添える `[L1:F0619-008]` | 否（表示条件は否／視覚整合は手動確認併用） | -055 |
| C-024 | 専用モーダル不存在 | GET画面表示・DOM確認 | 専用モーダルを持たない（`.modal`/`data-bs-toggle="modal"`が0件） `[L1:F0619-040]` | 否 | -056 |
| C-025 | サーバ検証失敗flash | POST（request契約）でCardNo/SecCd等がRegex/Length違反となる値を送信 | フォーム全体invalid→flash「入力項目をご確認ください。」（redirectなし・同POSTレスポンスで編集画面再描画。**isValid()==falseの場合changeMemCardは呼ばれず決済代行への通信は発生しない**=L1-F0619-018） `[L1:F0619-029]` | 否 | -068 |
| C-026 | 通信エラーflash（環境操作） | 決済代行への通信そのものが到達不能な状態（未接続host・タイムアウト等の環境操作）でPOST登録 | `\Exception`捕捉によりflash「通信エラーが発生しました、後ほどお試しください。」。**決済代行が応答すること自体は不要**（到達不能であれば成立する分岐のため） `[L1:F0619-030]` | 否（決済代行の協力は不要。到達不能な状態を作る環境操作のみで足りる）／環境操作はPlaywright+手動確認区分 | -069 |
| C-027 | カード番号の非保存（入力表個票） | ソース確認＋スキーマ確認 | カード番号は自社保存なし。画面でトークン生成に使い送信値は破棄する `[L1:F0619-035]` | 否 | -076 |

**§4.1注1（読み替え・C-001）**: -001/-012/-052は前提列ラベルが「CSRF」「表示要素」等でも期待テキストは
「マイページ配下の『登録済クレジットカード』画面であること。」で完全一致し画面識別の主張。-057は前提「見出し」・
期待「画面表示時であること。」（f06-19md:148表の「条件」列の抜粋）で、見出し表示条件のタウトロジー的確認として
同じくC-001へ読み替えbindする。
**§4.1注2（読み替え・C-002）**: -002の期待「カード情報を預かり、与信・会員枠管理を行う外部の決済サービスで
あること。」は用語集（f06-19md:57）の定義文そのままであり画面上の文言ではない。観測可能な裏付けとして、
決済代行への送信先URLが自社ドメイン外（e-scott.jp配下の外部ホスト）であるという構造事実へ読み替える。
-003/-043（「会員枠」定義）はKaiinId組立の裏付け、-004/-044（「トークン」定義）はhiddenトークンの非保持の
裏付け、-005/-045（「登録状況」定義）はMemRef/KaiinStatus参照**構造**（非UI）の裏付けへ、それぞれ同型で
読み替える。**訂正（改訂1）**: -006/-046（「マスク表示」定義）は当初この並びでC-006（bound）へ読み替えて
いたが、C-006は実マスク文字列の画面観測を要するため§4.2（要実機）へ移動済み——マスクアルゴリズム自体
（getCardNo()の算式）はL1-F0619-006として非UI・source確認でbound可能だが、-006/-046自体の母集合対応は
実表示観測を伴う母集合行（-058と同型）としてC-006（要実機）へ対応づける（§4.2参照）。-014（前提「削除挙動」・
期待「相関バリデーションでエラーが表示されず、対象処理を継続できること。」）は削除がフォーム検証を経ないため
C-012へ、それぞれbindする。

### §4.2 母集合対応・要実機（決済代行サンドボックス実接続が前提。全8 C-ID・29母集合行を実体掲載。
**改訂1で新設・移動、改訂2でC-018を追加**）

**codex R1 Major④是正／R2 Blocker②是正**: 以下8候補ケースは、母集合の期待テキストが決済代行側の
**実応答内容・実成否**を主張するもの、または前提となる決済代行側の状態（登録済みカードの存在・
KaiinStatus 2/3の既存会員枠・**対象顧客が決済代行に既存会員枠を持たないこと**）を自社側で用意・検証
できないものである。C-006/C-008/C-009/C-016/C-020/C-028は当初§4.1（bound）に算入していたが、
「終端結果は決済代行応答依存」という記載自体が示すとおり全体としては要実機であり、boundと呼ぶのは
不適切だったため本節へ移動した（C-028は当初「bound(読替)」としていた。R1改訂1）。**C-018は改訂2で追加**:
「SEED-F06-CUSTOMERは決済代行に既存会員枠を持たない」という前提は`dtb_customer`行の作成だけでは
検証・保証できない決済代行側の状態であり、C-026（能動的に通信不能状態を作れる＝真に自社側で制御可能）
とは性質が異なるため、§4.1から§4.2へ移動する（R2 Blocker②是正）。C-029は救済経路
（L1-F0619-041）の新設に伴う新規ケース。

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 前提として必要な決済代行側の状態 | 対応母集合 |
|---|---|---|---|---|---|
| C-006 | マスク表示（実観測） | 決済代行に登録済みカードがある会員でGET画面表示 | 「カード番号:」+アスタリスク10桁+末尾4桁、「有効期限:◯◯年 ◯◯月」を表示 `[L1:F0619-005,L1:F0619-006]`。マスクアルゴリズム自体（`'**********'.substr(CardNo,-4)`）はL1-F0619-006としてsource確認済みだが、実際に画面へ出る文字列（どの末尾4桁になるか）は決済代行の実応答依存 | 対象customer_idに決済代行側で登録済み（KaiinStatus==0）のカードが存在すること | -006,-046,-058 |
| C-008 | POST登録・差し替えの実結果 | GET画面→トークン欄に有効な値を設定して`add_card_form`をPOST | 画面で生成したトークンを送信し、**決済代行の会員枠へカードが実際に登録もしくは差し替えられる**こと（母集合-008の逐語。単に`changeMemCard`が呼ばれるという分岐到達だけでなく、決済代行側で登録処理が成立することまでを主張） `[L1:F0619-018,L1:F0619-022]` | 決済代行が当該トークンによる登録・変更要求に成功応答（ResponseCd=='OK'）を返すこと | -008 |
| C-009 | POST削除の実結果 | GET画面→カード情報削除ボタン押下（`add_card_form`をToken='del'でPOST） | 削除指示として送信し、**決済代行の会員枠を実際に無効化する**こと（母集合-009の逐語。単にMemInvalが呼ばれるという分岐到達だけでなく、決済代行側で無効化が成立することまでを主張） `[L1:F0619-018]` | 決済代行が当該無効化要求に成功応答（ResponseCd=='OK'）を返すこと | -009 |
| C-016 | 業務エラーflashの実表示 | POSTで決済代行が業務エラー応答（非OK）を返すケース | flashに`$e->getMessage()`（テンプレ接頭辞+errors.yml復号文言）が積まれ、決済通知ログ・エラーログへ記録、システムエラー区分なら管理者宛メール `[L1:F0619-023,L1:F0619-038]` | 決済代行が当該要求に対し非OKの業務エラー応答コードを返すこと | -031,-070 |
| C-018 | 登録・変更のDB無効果（**改訂2・要実機へ移動**） | SEED-F06-CUSTOMERでGET→有効なトークンでPOST登録 | 対象customer_idが決済代行に既存会員枠（KaiinStatus 2/3）を持たない場合、`plg_sln_mem_card_history`の当該行は操作前後で不変（MemAdd経路はpersist/flushを一切呼ばない＝L1-F0619-025(a)。この不変性自体は決済代行がMemAdd自体に成功したか失敗したかを問わず成立する） `[L1:F0619-025]`。**ただし「対象customer_idが決済代行にKaiinStatus 2/3の既存会員枠を持たない」という前提自体は、`dtb_customer`行の作成のみでは検証も保証もできない決済代行側の状態**であり、実際にどちらの状態にあるかは決済代行への実MemRef応答でしか確定できない | 対象customer_idが決済代行にKaiinStatus 2/3の既存会員枠を持たないこと（または全く未登録であること）を、決済代行への照会で確認できること | -021,-026,-028,-038,-040 |
| C-020 | 削除成功時のDB効果（実観測・破壊系） | S0取得（customer_id行の有無・mem_id・**update_date**）→GET→カード情報削除ボタン押下→決済代行がOK応答を返すケース→afterEachでraw SQLによりS0へ復元 | `plg_sln_mem_card_history`の当該customer_id行がS0からmem_id+1（不存在なら新規1行・mem_id=1）へ変化し、`update_date`がEC-CUBE共通`SaveEventSubscriber`により更新される `[L1:F0619-024,L1:F0619-026]`。**§2の安全境界注記のとおり、専用の使い捨て会員枠または決済代行側の復旧手順が用意されない限り実行しない** | 決済代行が当該無効化要求に成功応答（ResponseCd=='OK'）を返すこと | -035,-049(読替),-074 |
| C-028 | 成功flashの実表示 | 決済代行が成功応答を返すケース（登録/削除いずれか）でPOST | flash「カード情報を更新しました」が編集画面上部に1度表示される `[L1:F0619-028]` | 決済代行が当該登録・変更または削除要求に成功応答（ResponseCd=='OK'）を返すこと | -067(読替) |
| C-029 | 登録・変更の救済経路によるDB書込（**新設**） | 対象customer_idが決済代行にKaiinStatus 2または3の既存会員枠を持つ状態で、GET→有効なトークンでPOST登録し、MemChgが失敗し、内部の救済MemInvalが成功するケース | `Util::changeMemCard`のKaiinStatus 2/3分岐でMemChgが失敗すると救済`MemInval`が呼ばれ（Util.php:224-232）、これが成功すると`plg_sln_mem_card_history`が書込まれる（L1-F0619-024と同一機構）。利用者に見えるflashは元のMemChg失敗の文言（業務エラーまたは通信エラー）で、成功flash「カード情報を更新しました」ではない `[L1:F0619-041]`。**改訂1でexcludedから移動**: 母集合の「登録内容/更新内容の対象レコードが追加・変更される」（IT-26型テンプレの正極性）は、この救済経路という実在するreferentを持つため、当初「登録・変更はDB書込ゼロ」を根拠にexcludedとしたのは誤りだった（§8/§9で詳述） | 対象customer_idが決済代行にKaiinStatus 2/3の既存会員枠を持ち、かつMemChgが失敗し、かつ救済MemInvalが成功すること（複合状態） | -020,-022,-024,-025,-027,-029,-030,-034,-036,-037,-039,-041,-042（13行） |

### §4.3 補完（母集合会計外・改訂1で新設）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 外部依存 | 対応 |
|---|---|---|---|---|---|
| C-030 | 見出しの日英混在観測（**新設・codex R1 Major⑤是正**） | `/en{_shop}/mypage/sln_edit_card`へGET（完全認証済み・config有効。app_locales=ja|en） | 画面見出しは「My Account/登録済クレジットカード」という**日英混在**の文字列になる（`front.mypage.title`のみ翻訳され、twigにハードコードされた「/登録済クレジットカード」は翻訳されないため） `[L1:F0619-004]` | 否（決済代行と無関係。EC-CUBE本体のlocale切替のみ） | 母集合行に対応なし（親空・設計書自体には明記が無いが実装から確定できる補完事実。母集合76の会計には含めない） |

candidate行の親空理由: 母集合76行中に「見出しの英語表示」を主張する行は存在しない（-EN suffixを持つtest_idが
本機能の母集合に無いため）。C-030は`app_locales=ja|en`という実装事実から導出した補完であり、L1-F0619-004の
LS=1化（改訂1）に伴い自己完結性のため掲載する。

---

## §5 locale対応表

**【改訂1・codex R1 Major⑤是正】** 当初「本機能は英語ロケール資源を持たない・全claim ja固定・-EN行なし」
としたのは誤り。訂正内容:
- プラグイン**固有**の文言（JS/twigにハードコードされた検証メッセージ・flash・入力補助文など）にEN資源が
  無いのは事実のまま（`app/Plugin/SlnPayment42/`配下にen locale yamlが存在しない＝`find`実測）。
  設計書md:48「英語ロケール資源は本プラグインに無く」もこの範囲では正しい。
- しかし画面見出しが使う`front.mypage.title`は**EC-CUBE本体**（`src/Eccube/Resource/locale/messages.en.yaml`）
  の翻訳キーであり`509`行目に`My Account`が実在する。`app_locales=ja|en`（`app/config/eccube/services.yaml:14`）
  のためフロントは`/en/`配下でアクセス可能で、その場合の見出しは「My Account/登録済クレジットカード」という
  **日英混在**の文字列になる（`front.mypage.title`のみ翻訳され、twigにハードコードされた「/登録済クレジット
  カード」というサフィックスは翻訳キーではないため翻訳されない）。
- **LS=1のclaimは1件**（L1-F0619-004。§1改訂1で訂正）。-EN行は母集合には対応しない**補完C-030**として
  §4.3に1行掲載（母集合にこの観点のtest_idが無いため）。
- 設計書自体（f06-19md:48）は「表示メッセージは日本語のみとする」と述べているが、これは**プラグイン固有の
  業務文言**についての記述であり、見出しに流用されているEC-CUBE本体キーの挙動までは統制していない
  （設計書とeeの間に矛盾は無い＝DOC-DRAFTではない。設計書の記述範囲を当方が誤って拡大解釈していた）。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page: 既存`e2e/pages/front/f06/f06_19_front_member_mypage_credit_card.page.ts`を再利用可能（heading・
  cardNumberInput・expMonthInput・expYearInput・tokenInput・registerButton・deleteButtonの各Locator実装済み。
  ただしセレクタは意味論寄せの緩い正規表現であり、フォーム項目名(`sln_card_CardNo`等)との厳密対応は
  実行時に要確認）。
- spec: 既存`e2e/spec/front/f06/f06_19_front_member_mypage_credit_card.spec.ts`は5件がfixme
  （E2E-F06-19-018マスク表示・008登録送信・009削除送信・011config無効404・030トークン生成通信障害）で、
  いずれも「要: 決済代行会員枠シード/決済代行スタブ/隔離環境/外部スクリプト失敗注入」と明記済み。この既存の
  切り分けは本書が独立に導出した外部依存分類（§0外部依存の切り分け・§9）と一致する。候補の追加ケースspecは
  **未実装・実走なし**。期待値は`o("L1-F0619-xxx")`（L1解決器）経由・リテラル直書き禁止。
- **request契約（本機能で使用）**: `add_card_form`は`method="post" action="?"`（自URPOST）で`_token`
  （CSRF）＋C-004項目群のみ。GET画面→hidden `_token`取得→同一contextで`POST /{_locale}{_shop}/mypage/sln_edit_card`
  （urlencoded・`sln_card[CardNo]`等のフォームキー。block prefix=`CardType::getName()`='sln_card'）を主経路とし、
  aceエディタ等の複雑なJS DOM操作は不要（m05-15/m09-01先例と同型のrequest契約簡略化が可能）。
  C-013/C-014/C-025はこの経路で実行できる（クライアント側JSを経由しないためL1-F0619-009〜015のクライアント
  チェックはバイパスされ、サーバ側検証のみを直接刺せる）。C-018（要実機・§4.2）もrequest契約自体は同経路で
  送信できるが、DB無効果の判定が対象customer_idの決済代行側の状態に依存するため単独では確定的な結果を
  保証できない。
- db.ts（`e2e/helpers/db.ts`）でDB層照会。汎用の`queryScalar`/`queryNumber`/`queryRows`を用い、
  `plg_sln_mem_card_history`専用の便宜関数（`memCardHistoryExists(customerId)`・
  `memCardHistoryMemId(customerId)`・`memCardHistoryUpdateDate(customerId)`）は**未実装**（実装waveで
  dtb_news専用関数と同型の追加が必要）。
- **破壊系afterEach（C-020・C-029が該当。改訂1・R1 Blocker③是正）**: 操作直前にS0（対象customer_idの
  行の有無・mem_id値・**update_date値**）をraw psql（db.ts）で取得し、ケース終了後にS0へ**raw SQLで**
  復元する（既存行なら`UPDATE plg_sln_mem_card_history SET mem_id=<S0.mem_id>, update_date=<S0.update_date>
  WHERE customer_id=...`、新規作成された行なら`DELETE FROM plg_sln_mem_card_history WHERE customer_id=...`）。
  raw SQLはDoctrineのイベントを経由しないため`SaveEventSubscriber`のpreUpdateが再発火せず`update_date`を
  確実に元値へ戻せる（アプリ層のpersist/flushで復元すると再度「今」に上書きされ完全復元にならない）。
  m05-13の教訓（SEED値を期待の正にせずS0同値比較を用いる）を踏襲。**安全境界**: 実決済代行側の会員枠
  無効化は自社DB復元では戻らないため、専用の使い捨て会員枠または決済代行側の復旧手順が用意されるまで
  C-020・C-029は実行保留とする（§2参照）。
- **決済代行サンドボックスの前提（要実機ケース共通＝C-006/C-008/C-009/C-016/C-020/C-029）**: `PluginConfig`の
  接続先設定（`creditConnectionDestination`）がテスト実行環境で1（test: `https://www.test.e-scott.jp/...`）を
  指し、かつ有効なMerchantId/MerchantPass/TenantIdが設定されていること、さらに実際にカードトークンを生成できる
  決済代行側テスト用カード番号を用意できることが前提。C-029は追加で**対象customer_idが決済代行側で
  KaiinStatus 2または3の既存会員枠を持つ状態**を用意する必要があり、これは通常のテストSEEDでは作れない
  （事前に決済代行との実取引を経てその状態に至る必要がある）。**いずれも本リポジトリのseed/READMEに記載が
  なく未確認**（実装wave着手前にsandbox提供元へ確認が必要）。

**_drafts/隔離lintの実施証跡**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・既存spec・pages）に本書の`_drafts`参照は
   **0件**（grep実測。既存のf06_19 page/specは本書と無関係に先行実装されたもので、本書の`_drafts`ファイルへの
   参照を持たない）。
2. 正式パス`e2e/fixtures/oracle/`直下に本機能のjsonは**作成していない**（`ls`実測：直下にf06-19関連ファイル
   なし。草案は`_drafts/`のみ）。
3. 本md・oracle草案jsonの出力先はともに`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,004,007,010,015,023,024 | Playwright | GUI | 認証リダイレクト・表示・DOM構造・条件表示。C-007はMemRefの成否を問わずフォーム描画が保証される事実に限定 |
| C-002,003,005,019,021,027 | 非UI（ソース確認） | コード読取 | グロッサリ由来の読み替えbind、またはコード構造の確認。実行対象コードではなくfile:line根拠の確認。C-005はKaiinStatus判定の**構造**確認のみ（実表示はC-006） |
| C-011,012 | Playwright | GUI/JS | クライアント側チェック・alert検証（`page.on('dialog')`）。C-012はToken='del'分岐の到達確認まで（決済代行の成否は問わない） |
| C-013,014,022,025 | 非UI（request契約）+Playwright／db.ts | HTTP/GUI(+DB) | サーバ側検証をrequest契約で直接刺す（aceのような複雑UI操作なし）。C-022は行数不変（DELETE文0件）をdb.tsで確認 |
| C-017 | Playwright+db.ts | GUI+DB | config無効(404)時のDB無効果 |
| C-026 | Playwright+手動確認（通信遮断の環境操作） | GUI+HTTP | 決済代行への到達不能な状態を作る環境操作のみで足りる（決済代行の協力不要） |
| **C-006,008,009,016,018,020,028,029** | Playwright+db.ts→**要実機（決済代行サンドボックス接続必須）** | GUI+DB+外部HTTP | **改訂1・改訂2でbound側から移動**。会員照会/登録/削除の実結果、または対象customer_idの決済代行側の状態に依存。C-018はSEED-F06-CUSTOMERが決済代行に既存会員枠を持たないことの検証・保証ができないため要実機（改訂2・R2 Blocker②是正）。C-020・C-029は破壊系・afterEach必須（S0にupdate_date含む・raw SQL復元・§2安全境界に従い専用会員枠が無い限り実行しない）。C-029は加えてKaiinStatus 2/3の既存会員枠という通常SEEDでは作れない前提状態が必要 |
| C-030 | Playwright | GUI | 見出しの日英混在観測（enロケール切替のみ・決済代行と無関係） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。1候補ケース=1 assertion bundle・多対一は
`shared`・読み替えは「読替」と明記。**参照先の全候補行は§4に実体掲載済み＝76↔候補の期待テキスト突合が
本文内で完結する**。

### 集計（76 test_id 全数会計・差分0。**改訂1・codex R1 Blocker①②③Major④是正／改訂2・R2 Blocker②是正後**）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound（直接一致）** | **28** | 期待テキストが画面文言・分岐規則の逐語または明確な言い換えで、読み替えを要さず、かつ決済代行への実接続なしで完結するもの |
| **bound（読み替え）** | **13** | グロッサリ定義文の裏付け事実（非UI構造）への写像、または「削除状態になる」等の生成器慣用句を本機能の実DB効果へ再解釈したもの。決済代行への実接続なしで完結する（全件§4.1注記・下表「bound(読替)」表記で明示）。**改訂2でC-018対応の5行（-021,-026,-028,-038,-040）が要実機へ移動し18→13** |
| **要実機** | **29** | 決済代行の実応答（実表示・実登録・実削除・実業務エラー・救済経路の実書込）、または我々がローカルSEEDで検証・保証できない決済代行側の状態（対象顧客の既存会員枠有無）が無いと最終値を確定できないもの。**うち13行は改訂1でexcludedから移動**（C-029新設）・**うち11行は改訂1でbound側から移動**（C-006×3・C-008×1・C-009×1・C-016×2・C-020×3・C-028×1）・**うち5行は改訂2でbound(読替)側から移動**（C-018対応。R2 Blocker②是正） |
| **excluded** | **6** | 下記個別理由（過剰除外なし・per-ID実引き。改訂1で13行を要実機へ再分類した残り） |
| 合計 | **76** | 欠落0・理由なし重複0 |

28+13+29+6=76（差分0。下表の76行を機械集計して再現可能。python集計スクリプトの出力と一致）。

### 76対応表（期待テキスト→会計→候補ケース）

| No | 前提列(参考・ノイズ含む) | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|---|
| 001 | カード編集画面 | マイページ配下の「登録済クレジットカード」画面であること | bound(読替) | C-001 |
| 002 | 決済代行 | 外部の決済サービスであること（用語定義） | bound(読替) | C-002 |
| 003 | 会員枠 | 決済代行側で会員ごとに作られるカード保管枠であること（用語定義） | bound(読替) | C-003 |
| 004 | トークン | 画面でカード情報から生成される一時的な値であること（用語定義） | bound(読替) | C-004 |
| 005 | 登録状況 | 決済代行への会員照会で得られる会員枠が有効かの状態であること（用語定義） | bound(読替) | C-005 |
| 006 | マスク表示 | 先頭伏字・末尾4桁だけ見せる表示であること（用語定義） | **要実機** | C-006 |
| 007 | カード編集画面を開く | 会員ログイン済みなら会員照会し登録済みカードがあればマスク表示・フォーム表示 | bound | C-007 |
| 008 | カード登録・差し替えを送信 | トークンを送信し会員枠へカードを登録もしくは差し替える | **要実機** | C-008 |
| 009 | カード削除を送信 | 削除指示として送信し会員枠を無効化する | **要実機** | C-009 |
| 010 | 未ログイン・簡易認証のみ | 必須バリデーションでエラーが表示され対象処理が完了しないこと | bound(読替) | C-010 |
| 011 | 会員登録機能が無効な店舗 | 必須バリデーションでエラーが表示されず処理を継続できること | **excluded** | — |
| 012 | 表示要素 | 画面見出しは「マイページ/登録済クレジットカード」であること | bound | C-001 |
| 013 | JS挙動 | 相関バリデーションでエラーが表示され対象処理が完了しないこと | bound | C-013 |
| 014 | 削除挙動 | 相関バリデーションでエラーが表示されず対象処理を継続できること | bound(読替) | C-012 |
| 015 | CSS・レイアウト | 相関バリデーションでエラーが表示されず対象処理を継続できること | bound(読替) | C-014 |
| 016 | モーダル・ポップアップ | 相関バリデーションでエラーが表示され対象処理が完了しないこと | bound | C-013 |
| 017 | 見出し | DBとの相関バリデーションでエラーが表示されず処理を継続できること | **excluded** | — |
| 018 | 登録済みカード | DBとの相関バリデーションでエラーが表示され処理が完了しないこと | **excluded** | — |
| 019 | 入力補助 | 各欄が設定により表示されているときであること | bound | C-015 |
| 020 | カード名義/姓を入力してください…案内 | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 021 | セキュリティコードを入力してください…案内 | 登録内容の対象レコードが追加されないこと | **要実機**（改訂2・元bound読替） | C-018 |
| 022 | 生月日を入力してください…案内 | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 023 | 電話番号を入力してください…案内 | 電話番号欄を表示する設定のときであること | bound | C-015 |
| 024 | 生月日を正しく入力ください | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 025 | 入力項目を再度ご確認ください | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 026 | システムと通信中のため少々お待ちください | 登録内容の対象レコードが追加されないこと | **要実機**（改訂2・元bound読替） | C-018 |
| 027 | カード情報削除処理中ため少々お待ちください | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 028 | カード情報を更新しました | 登録内容の対象レコードが追加されないこと | **要実機**（改訂2・元bound読替） | C-018 |
| 029 | 入力項目をご確認ください | 登録内容の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 030 | 通信エラーが発生しました、後ほどお試しください | 実行結果の対象レコードが追加されること | **要実機**（改訂1・元excluded） | C-029 |
| 031 | 決済処理上のエラー内容（例:カード登録失敗の理由） | 決済代行とのやり取りで業務エラーが出たときであること | **要実機**（改訂1・元bound） | C-016 |
| 032 | 未ログイン・簡易認証のみ | 更新内容の対象レコードの値が変更されること | **excluded** | — |
| 033 | カード会員登録を使わない設定 | 更新内容の対象レコードの値が変更されないこと | bound | C-017 |
| 034 | 登録・差し替えの分岐 | 更新内容の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 035 | 削除の扱い | 決済代行の会員枠を無効化し成功時に枝番を進める | **要実機**（改訂1・元bound） | C-020 |
| 036 | カード情報の非保持 | 更新内容の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 037 | カード番号 | 更新内容の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 038 | カード有効期限（月） | 更新内容の対象レコードの値が変更されないこと | **要実機**（改訂2・元bound読替） | C-018 |
| 039 | カード有効期限（年） | 更新内容の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 040 | カード名義（姓） | 更新内容の対象レコードの値が変更されないこと | **要実機**（改訂2・元bound読替） | C-018 |
| 041 | カード編集画面 | 更新内容の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 042 | 決済代行 | 実行結果の対象レコードの値が変更されること | **要実機**（改訂1・元excluded） | C-029 |
| 043 | 会員枠 | 決済代行側で会員ごとに作られるカード保管枠であること（用語定義） | bound(読替) | C-003 |
| 044 | トークン | 画面でカード情報から生成される一時的な値であること（用語定義） | bound(読替) | C-004 |
| 045 | 登録状況 | 決済代行への会員照会で得られる会員枠が有効かの状態であること（用語定義） | bound(読替) | C-005 |
| 046 | マスク表示 | 先頭伏字・末尾4桁だけ見せる表示であること（用語定義） | **要実機** | C-006 |
| 047 | カード編集画面を開く | 会員ログイン済みなら会員照会し登録済みカードがあればマスク表示・フォーム表示 | bound | C-007 |
| 048 | カード登録・差し替えを送信 | 削除条件の対象レコードが削除状態にならないこと | bound(読替=物理削除ゼロの普遍事実) | C-022 |
| 049 | カード削除を送信 | 実行結果の対象レコードが削除状態になること | **要実機**（改訂1・元bound読替） | C-020 |
| 050 | 未ログイン・簡易認証のみ | カード編集画面を表示せずマイページ入口へ誘導すること | bound | C-010 |
| 051 | 会員登録機能が無効な店舗 | 実行結果の対象レコードが削除状態になること | **excluded** | — |
| 052 | 表示要素 | 画面見出しは「マイページ/登録済クレジットカード」であること | bound | C-001 |
| 053 | JS挙動 | カード情報登録ボタン押下時に入力欄ごとのクライアント側チェックを順に実行 | bound | C-011 |
| 054 | 削除挙動 | カード情報削除ボタン押下時にトークン隠し欄へ削除指示を入れて送信 | bound | C-012 |
| 055 | CSS・レイアウト | マイページ共通の枠とフォームレイアウトを使い入力補助文を添える | bound | C-023 |
| 056 | モーダル・ポップアップ | 専用モーダルは持たないこと | bound | C-024 |
| 057 | 見出し | 画面表示時であること | bound(読替) | C-001 |
| 058 | 登録済みカード | 決済代行の会員枠が有効で登録済みカードがあるときであること | **要実機**（改訂1・元bound） | C-006 |
| 059 | カード名義/姓を入力してください…案内 | カード名義欄を表示する設定のときであること | bound | C-015 |
| 060 | セキュリティコードを入力してください…案内 | セキュリティコード欄を表示する設定のときであること | bound | C-015 |
| 061 | 生月日を入力してください…案内 | 生月日欄を表示する設定のときであること | bound | C-015 |
| 062 | 電話番号を入力してください…案内 | 電話番号欄を表示する設定のときであること | bound | C-015 |
| 063 | 生月日を正しく入力ください | サーバ側の送信後チェックであること | bound | C-013 |
| 064 | 入力項目を再度ご確認ください | 送信前に止めるであること | bound | C-011 |
| 065 | システムと通信中のため少々お待ちください | 画面表示データでエラーが表示されず処理を継続できること | **excluded** | — |
| 066 | カード情報削除処理中ため少々お待ちください | 二重送信防止であること | bound | C-012 |
| 067 | カード情報を更新しました | 画面表示データでエラーが表示されず処理を継続できること | **要実機**（改訂1・元bound読替） | C-028 |
| 068 | 入力項目をご確認ください | サーバ側のフォーム検証に失敗したときであること | bound | C-025 |
| 069 | 通信エラーが発生しました、後ほどお試しください | 想定外の通信などの例外が出たときであること | bound | C-026 |
| 070 | 決済処理上のエラー内容（例:カード登録失敗の理由） | 決済代行とのやり取りで業務エラーが出たときであること | **要実機**（改訂1・元bound） | C-016 |
| 071 | 未ログイン・簡易認証のみ | 専用メッセージなしであること | bound | C-010 |
| 072 | カード会員登録を使わない設定 | 専用メッセージなしであること | bound | C-017 |
| 073 | 登録・差し替えの分岐 | 登録状況により会員枠のカード変更・無効解除後の変更・新規作成を選ぶ | bound | C-019 |
| 074 | 削除の扱い | 決済代行の会員枠を無効化し成功時に枝番を進める | **要実機**（改訂1・元bound） | C-020 |
| 075 | カード情報の非保持 | カード原番号等は画面入力・送信のためだけに一時的に扱う | bound | C-021 |
| 076 | カード番号 | 自社保存なしであること | bound | C-027 |

`func_scope_check` 判定: 親76/76会計済み・欠落0・理由なし重複0。§4.3の補完C-030（見出しEN観測）は
母集合対応先が無いため本表・本集計には含めない（親空・設計書自体からの導出補完・母集合会計外）→
**差分0を本文内で実証可能**。O6は主張しない。

---

## §9 TBD・要実機・excluded・DOC/BC-DRAFT（正直な分離。**改訂1・codex R1是正後**）

### 要実機（母集合対応・29 test_id。決済代行サンドボックス実接続が必要、または決済代行側の状態が
ローカルSEEDでは検証・保証できない。boundと偽らない）

**改訂1の要点**: 当初この母集合対応のうち**13件**（登録・変更でDB書込を主張する正極性のIT-26型テンプレ行=
-020,-022,-024,-025,-027,-029,-030,-034,-036,-037,-039,-041,-042）は「登録・変更はDB書込ゼロ」という
誤った前提でexcludedとしていたが、`Util::changeMemCard`のKaiinStatus 2/3分岐に救済MemInval機構
（L1-F0619-041）が存在し、これが成功すると実際にDB書込が起きることが判明したため**要実機へ再分類**した
（C-029新設）。**11件**（-006,-046,-058,-008,-009,-031,-070,-035,-049,-074,-067）は、その母集合の
期待テキストが決済代行の**実応答内容・実成否**を主張しているにもかかわらず当初boundまたはbound(読替)に
算入していた誤りを是正したもの（マスク表示=3・登録実成立=1・削除実成立=1・業務エラー実表示=2・
削除成功DB効果=3・成功flash実表示=1）。**改訂2の要点（R2 Blocker②是正）**: 残る**5件**
（-021,-026,-028,-038,-040）は「SEED-F06-CUSTOMERが決済代行に既存会員枠を持たない」という前提で
bound(読替)としていたが、この前提自体（対象customer_idの決済代行側の状態）は`dtb_customer`行の作成
だけでは検証も保証もできず、決済代行への実MemRef応答でしか確定できないため要実機（C-018）へ移動した。
13+11+5=29（集計は§8の76対応表を正とする）。

| test_id | 期待テキスト要旨 | 対応候補ケース | 要実機の理由（実引き） |
|---|---|---|---|
| -006,-046,-058 | マスク表示（用語定義／登録済みカード条件） | C-006 | `OldCard`はMemRef応答のKaiinStatus==0のときのみ非null（MypageController.php:117-127）。マスクアルゴリズム自体（L1-F0619-006）はbound可能だが、実際に画面へ出る文字列（末尾4桁の値含む）は決済代行に登録済みカードを持つ実会員枠が無いと観測できない |
| -008 | トークンを送信し会員枠へカードを登録もしくは差し替える | C-008 | 母集合の逐語は「決済代行の会員枠へカードを登録もしくは差し替える」という**決済代行側の成立**を主張する。`changeMemCard`が呼ばれる分岐到達自体はL1-F0619-018/022でソース確認済みだが、登録が実際に成立するかは決済代行の応答（ResponseCd=='OK'）依存 |
| -009 | 削除指示として送信し会員枠を無効化する | C-009 | 同様に「会員枠を無効化する」という決済代行側の成立を主張。MemInvalが呼ばれる分岐到達はL1-F0619-018で確認済みだが、無効化が成立するかは応答依存 |
| -021,-026,-028,-038,-040 | 登録内容/更新内容の対象レコードが追加・変更**されない**こと（IT-26型テンプレ負極性・5行） | C-018 | **改訂2でbound(読替)から移動**。MemAdd経路自体はDB書込を一切呼ばない（L1-F0619-025(a)）が、対象customer_idがMemAdd経路（＝決済代行に既存会員枠を持たない）に該当するかどうかは決済代行への実MemRef応答でしか確定できず、`dtb_customer`行の作成のみを行うSEED-F06-CUSTOMERではこの前提を検証・保証できない | 
| -031,-070 | 決済代行とのやり取りで業務エラーが出たときであること | C-016 | 前提（業務エラー応答）自体が我々の制御下にない（決済代行が非OKコードを返す必要がある）。flashの接頭辞テンプレ・ログ記録の分岐構造はL1-F0619-023でソース確認済みだが、実際に業務エラーが出る状態は要実機 |
| -035,-049,-074 | 削除は会員枠の無効化として行い成功時に枝番を進める／削除状態になる | C-020 | 「枝番を進める」「削除状態になる（実際はmem_id前進の読み替え）」はL1-F0619-024の書込機構がソース確認済みだが、書込が**実際に発生する**のは決済代行がOK応答を返した場合のみ。前提を我々は制御できない |
| -067 | カード情報を更新しました（成功flash） | C-028 | 前提（決済代行が成功応答を返すこと）自体が我々の制御下にない。flashを積む分岐構造自体はL1-F0619-028でソース確認済みだが、実際にこのflashが表示されるかは決済代行の応答依存 |
| -020,-022,-024,-025,-027,-029,-030,-034,-036,-037,-039,-041,-042 | 登録内容/更新内容/実行結果の対象レコードが追加・変更される（IT-26型テンプレ正極性・計13行） | C-029 | **改訂1で新設**。`Util::changeMemCard`のKaiinStatus 2/3分岐でMemChgが失敗すると救済MemInvalが呼ばれ（Util.php:224-232）、これが成功すると`plg_sln_mem_card_history`が書込まれる（L1-F0619-041）。この経路は対象customer_idが決済代行にKaiinStatus 2/3の既存会員枠を持つ場合にのみ到達し、通常のテストSEED（既存会員枠なし）では誘発できない複合状態が前提となる |

### インフラ水準の要実機（特定test_idに紐付かない・実装waveの前提事項）

| # | 事項 | 状態 |
|---|---|---|
| 1 | L1-F0619-015/016: トークン生成JS（`SpsvApi.spsvCreateToken`） | 提供元仕様は設計書自身が「扱わない」と明記（f06-19md:38）。呼出しの有無・try/catch構造はbound、実際のトークン取得・生成失敗の誘発は要実機（提供元スクリプトの実体が必要） |
| 2 | L1-F0619-038: 業務エラー文言の実際のコード | errors.ymlの静的対応表はbound、実際にどのコードが返るかは決済代行の応答に依存 |
| 3 | GET初期表示時のMemRef例外誘発（L1-F0619-031） | 決済代行への接続自体を制御できないと「例外時はOldCard=nullのまま」を意図的に再現できない（接続断の環境操作＋db.ts不要のPlaywright+手動確認で部分再現は可能） |
| 4 | §2 SEED-F0619-CONFIG-DISABLEDの投入手順 | `PluginConfig`はJSON列(subData)へConfigSubDataをシリアライズする方式のため、直接SQLでなくアプリ層のシリアライズ形式に合わせたJSON生成が必要。D5で確定（`@TBD-D5`） |
| 5 | §6 決済代行サンドボックスの認証情報・接続先設定 | MerchantId/MerchantPass/TenantId等の具体的な設定値がテスト実行環境に存在するかは本リポジトリのseed/READMEから確認できず未確認 |
| 6 | **【改訂1・R1 Blocker③是正】** C-020/C-029のS0復元と安全境界 | S0は`update_date`を含め直接SQL（raw psql）で復元する（§2/§6）。**実決済代行側の会員枠無効化は自社DB復元では戻らないため、専用の使い捨て会員枠または決済代行側の復旧手順が用意されない限りC-020・C-029を共有・実データの会員枠に対して実行しない** |
| 7 | C-029のKaiinStatus 2/3状態の用意方法 | 通常のテストSEEDでは決済代行に既存会員枠を持たせられないため、事前に決済代行との実取引（例: 一度登録した会員枠を意図的にログイン回数上限や会員無効の状態へ遷移させる）を経る必要がある。具体的な用意手順は`@TBD-D5`で未確定 |
| 8 | **【改訂2・R2 Blocker②是正】** C-018の前提（対象customer_idが決済代行に既存会員枠を持たない）の検証手段 | `dtb_customer`行の作成だけでは決済代行側の状態を保証できない。実行前に決済代行へMemRef相当の照会を行い「既存会員枠なし（またはKaiinStatus4）」であることを確認するか、テスト専用に決済代行側でも未使用と分かっている顧客識別子を用意する必要がある。具体的な確認・用意手順は`@TBD-D5`で未確定 |

### excluded（6件・per-ID実引き。過剰除外禁止=各理由に一次資料の実引きを伴う。**改訂1でexcludedから13件が要実機へ移動した残り**）

| test_id | 期待テキスト要旨 | 除外理由（実引き） |
|---|---|---|
| -011 | 会員登録機能が無効な店舗｜必須バリでエラー表示されず処理を継続できる | 実装は`memberRegist==2`のとき無条件で`NotFoundHttpException`（MypageController.php:54-57）を投げ、以降の画面表示・処理へ「継続」する分岐は存在しない（design md:76,101,132,302,335も一貫して404を明記）。汎用IT-22テンプレの「継続できる」肯定側に対応する実挙動が本機能に存在しない |
| -017 | 見出し｜DB相関バリでエラー表示されず継続できる | `CardType`のサーバ側制約はLength/Regex/POST_SUBMIT日付整合のみ（CardType.php:59-292）で、DB参照を伴う相関constraintは実装に存在しない |
| -018 | 登録済みカード｜DB相関バリでエラー表示され完了しない | 同上（DB相関検証自体が不存在。`plg_sln_mem_card_history`はフォーム項目値の妥当性検証に使われず、削除成功後の枝番更新にのみ使う=Util.php:205-267） |
| -032 | 未ログイン・簡易認証のみ｜更新内容の対象レコードの値が変更される | 未認証は`redirectToRoute('mypage')`で処理自体が実行されない（L1-F0619-001）。「値が変更される」に対応する実行経路が存在しない。実際の認証ガードは-010/C-010で別途bound済み |
| -051 | 会員登録機能が無効な店舗｜実行結果の対象レコードが削除状態になる | 実装は`memberRegist==2`で無条件404（-011と同一根拠）。以降の削除処理へ到達する経路が存在しない。否定側の実挙動は-033/C-017で別途bound済み |
| -065 | システムと通信中のため少々お待ちください｜画面表示データでエラー表示されず継続できる | 前提が指す分岐（`getToken()`内`isAddCard`が偽のときの`alert`＋`return false`=twig:140-143）はそれ自体が送信を**中止**させるものであり、期待テキスト「エラー表示されず継続できる」と整合しない（isAddCardは`$(function(){...})`のdocument-ready内で直ちに真になるため通常操作では到達しない防御的分岐でもある） |

**過剰除外でないことの傍証**: 上記excluded 6件が指し示す実在仕様（未認証ガード・404ガード）は、いずれも
他のtest_idまたは候補ケースで別途bound済みである（-032→-010/C-010、-051→-033/C-017。§8対応表に相互参照を
記載）。偽陰性（実在仕様が候補群から漏れる）は生じていない。**-011/-017/-018/-065は対応する肯定側実挙動が
実装に存在しない**ことをそれぞれ実引きで示している（母集合の生成器テンプレが本機能に無い検証/継続分岐を
前提にしたノイズ）。

### DOC-DRAFT・BC-DRAFT

該当なし（0件）。参考観察としてL1-F0619-032（サーバ変数`$isError`が常にfalseで、twigのサーバレンダー分岐
「現在決済通信障害が発生しております。後ほどお試しください。」が到達不能）を記録したが、設計書はこの文言を
**クライアント側ダイアログ**（L1-F0619-016・getToken()のtry/catch）としてのみ要求しており、サーバレンダー側の
到達可能性については設計書自身が言及していないため、設計と実装の間に矛盾があるとは判定していない
（断定回避。実装の余剰コードという中立的な観察に留める）。

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

---

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は「登録内容/更新内容の対象レコードが追加・変更される」というIT-26型
汎用テンプレの扱いが最大の焦点。**改訂1でこの領域の判定を全面的に見直した**——当初は「登録・変更処理は
自社DBへ一切書き込まない」という誤った前提で正極性行を機械的にexcludedしていたが、KaiinStatus 2/3の
救済経路（L1-F0619-041）という実在するreferentが判明したため、正極性行も**要実機**として拾い直した）:

| 対象 | 極性判定（改訂1） | 判定根拠（一次資料） |
|---|---|---|
| **-020/-022/-024/-025/-027/-029/-030/-034/-036/-037/-039/-041/-042（正極性13行・R1 Blocker①是正）** | **訂正**: 当初「登録処理の書込ゼロ」という無条件の前提を根拠にexcludedしたが誤り。正しくは登録・変更はMemAdd経路（新規会員/KaiinStatus4）またはMemChg単体成功時（KaiinStatus0/1）に限り書込ゼロであり、KaiinStatus2/3でMemChgが失敗し救済MemInvalが成功する経路（L1-F0619-041）ではDB書込が起こり得る。この経路は実在するが対象customer_idの決済代行側状態（KaiinStatus2/3）に依存し単独では再現できない複合前提のため、excludedではなく**要実機（C-029・新設）**が正しい分類 | Util.php:220-234（救済MemInval・改訂1で実測発見） |
| -021（カード名義案内、負） | 「追加されない」（負極性）はMemAdd経路（対象customer_idが決済代行に既存会員枠を持たない場合）に限れば真。**改訂2で再訂正**: 当初この限定条件下でbound(C-018)としたが、「決済代行に既存会員枠を持たない」という前提自体が`dtb_customer`行の作成のみでは検証・保証できない決済代行側の状態のため、要実機(C-018・§4.2)へ移動（R2 Blocker②是正） | Util.php:214-219,235-244（persist/flush不出現） |
| -026/-028（通信中/更新しました、負） | 同上の理由で要実機(C-018) | 同上 |
| -038/-040（カード有効期限/カード名義、負） | 同上の理由で要実機(C-018) | 同上 |
| -033/-051（会員登録機能無効、負/正） | config無効時は無条件404で以降の処理に到達しない。負極性(-033「変更されない」)は404による処理未到達と整合するためbound(C-017)。正極性(-051「削除状態になる」)は404で削除処理自体に到達しないため矛盾→excluded（これは救済経路と無関係な独立した矛盾のため改訂1でも据え置き） | MypageController.php:54-57 |
| -048/-049（登録差替送信/削除送信、両方とも「削除状態」文言） | 本機能に行の物理削除経路は存在しない（L1-F0619-036）。-048「削除状態にならない」は普遍的に真（登録POSTに限らずどんな操作でも行は物理削除されない。決済代行の成否を問わず成立）としてC-022（普遍事実・bound）へbind。-049「削除状態になる」は文言上の「削除」を物理行削除でなくmem_id前進（唯一の削除起因DB効果）と読み替えるが、**この前進は決済代行のOK応答が無いと発生しない**ため**要実機（C-020）に訂正**（改訂1・R1 Blocker⑥是正。当初bound(読替)としていたのは誤り） | MemCardIdRepository.php（全文・deleteメソッド不出現）／f06-19md:121,196 |
| -013/-016 vs -014/-015（相関バリデーション、正/負2対） | 「相関バリデーション」という語は本機能では厳密にはPOST_SUBMITリスナ（CardExpYear/Month vs 現在日付・真の相関）を指すと解釈。-013/-016（正極性=エラーあり）はBirthDay/CardExp不正値でbind(C-013)。-014（負極性、前提=削除挙動）は削除がフォーム検証自体をバイパスするため「相関エラーなしで継続」が成立しC-012（削除フロー）へ読み替えbind。-015（負極性、前提=CSS・レイアウト）はCardExp有効値での相関チェック通過としてC-014（新設・pass側）へbind。いずれも決済代行への通信前に完結する検証層のためboundのまま変更なし | CardType.php:272-292 |
| -002〜-005,-043〜-045（用語集定義文の期待列・非UI側） | 画面表示文言ではなくf06-19md:54-62用語集の逐語再掲。機械的には画面上で検証不能なため、各用語が指す**非UI構造事実**（外部ホストURL・KaiinId組立・トークンのhidden非保持・MemRef参照構造）へ読み替えbind。裏付け先はいずれも§1のL1オラクルで実引き済み | f06-19md:52-62（用語表） |
| -006/-046（マスク表示の用語集定義） | 上記と同型の用語集再掲だが、裏付け先（実マスク文字列の画面観測）が決済代行の実応答を要するため、**改訂1で読み替え先をC-006（要実機）へ訂正**（当初bound算入は誤り。マスクアルゴリズム自体=L1-F0619-006はbound可能だが、-006/-046自体は-058と同型の実表示観測を求める母集合行のため要実機側に置く） | SlnContent/Credit/Member.php:199-202 |
| -042（決済代行、正極性=DB値変更） | 用語集文脈の前提列に反し期待列がDB変更の肯定主張。**改訂1で救済経路（L1-F0619-041）という実在するreferentが判明**したため、当初「登録・変更の書込ゼロと矛盾するのでexcluded」としたのは誤り。要実機（C-029）へ訂正 | Util.php:220-234 |
| -057（見出し、期待「画面表示時であること」） | タウトロジー的（「画面表示時」条件そのものの再掲）。他に対応する検証対象がないためC-001（見出し表示）の付随条件としてbind。変更なし | f06-19md:148（表の条件列） |
| -065（システム通信中、負極性=継続できる） | 前提が指すJS分岐(`isAddCard`偽)は送信を停止させるものであり負極性の「継続できる」と直接矛盾。対応する肯定側の分岐（送信停止）は他のいかなる母集合行にも現れないため、無理に読み替えず素直にexcluded（実在するが極性が逆で対応する母集合行がない事実は、偽陰性ではなく設計書側にもこの分岐固有のテストケースが存在しないことの反映=f06-19md:166表に条件のみ記載され専用のtest対象化はされていない）。変更なし | sln_edit_card.twig:138-143 |
| -067（カード情報を更新しました、負極性=継続できる） | 成功flash表示時にエラーが出ないという事実として当初C-028（bound）へ読み替えたが、**成功flashの表示自体が決済代行の実成功応答に依存する**ため要実機（C-028）へ訂正（改訂1・R1 Major④是正） | MypageController.php:75,77,87,89 |
| -031/-070（決済処理上のエラー内容、条件文） | 「決済代行とのやり取りで業務エラーが出たとき」という前提（業務エラー応答）自体が我々の制御下になく、C-016（要実機）へ訂正（改訂1・当初boundは誤り） | MypageController.php:93-106 |

**捏造まとめ（自己点検）**: R1で指摘された捏造/誤りは2種——(a) 実装事実の見落とし（救済MemInvalの書込機構。
Util.php:220-234という既に読んでいたファイルの範囲内にありながら、changeMemCardの制御フローを最後まで
追わずMemAdd/MemChg呼出しの有無だけで判断した調査不足）、(b) EN資源の非実在という未検証の断定
（`app/Plugin/SlnPayment42/`配下の`find`結果だけを根拠に「本プラグイン」と「EC-CUBE本体」の翻訳資源を
混同し、見出しが本体キーを流用している事実を確認しないまま「全claim ja固定」と一般化した）。いずれも
本改訂で現物ソース（`nl -ba`・`grep`・`sed`）による再検証を行い、file:line根拠を伴う形で訂正した。

**codex敵対レビュー: R1=要修正（Blocker①②③・Major④⑤⑥）→改訂1で是正→R2=Blocker①③・Major④⑤⑥は閉塞・
Blocker②未閉（C-018の否定側boundが対象customer_idの決済代行側状態という検証不能な前提に依存）→改訂2で
C-018を§4.2要実機へ移動し是正・R3再確認待ち**。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（396行）／eeプラグイン実ソース 15
  （MypageController・MemCardId・MemCardIdRepository・CardType・ConfigSubData・PluginConfigRepository・
  Util・Mem・HttpSend・SlnContent/Credit/Member・SlnAction/Content/Basic・sln_edit_card.twig・
  routes.yaml・services.yaml・errors.yml）＋EC-CUBE共通1（SaveEventSubscriber.php・専用subagent調査で確認）／
  母集合・台帳 2（all_it_cases・REVIEW_LEDGER）／統治・見本 4（m05-15草案・m05-13草案・m02-06草案・
  REVIEW_LEDGER品質規律）／既存実装 3（f06_19 page.ts・spec.ts・SEED-F06-CUSTOMER.sql）／
  helper 1（db.ts）＝**計27ファイル/資料**。
- L1 claim数: **41確定・TBD 0**（改訂1でL1-041追加。うち`external_dependency:true`=10）。候補ケース**30**
  （C-001〜028のうち§4.1〔bound〕21件・§4.2〔要実機〕8件〔C-006/008/009/016/018/020/028/029、うちC-018は
  改訂2でR2 Blocker②是正により移動・C-029新設〕・§4.3補完1件〔C-030新設〕）。母集合対応=bound直接28行・
  bound読替13行・要実機29行・excluded6行（差分0）。func_scope_check差分0（§8）。
- 難所（係数悪化要因）:
  (1) **母集合の大半が用語集定義文の再掲**（-002〜-005・-043〜-045の6行＋実表示側の-006/-046の2行）で、
      画面上検証不能な期待テキストを裏付け事実へ読み替える設計判断が必要だった。
  (2) **IT-26型「登録内容の対象レコードが追加される」テンプレの扱い**。W0初稿では「登録・変更は自社DB
      書込ゼロ」という条件を欠いた前提で正極性行をexcludedしたが、**codex R1敵対レビューでUtil.php:220-234
      の救済MemInval機構という実装事実の見落としを指摘され**、正極性13行を要実機（C-029新設）へ
      再分類する改訂1を実施した。この見落としが本書最大の是正点。
  (3) **「削除」の実装セマンティクスが物理行削除でなく会員枠無効化+枝番前進**であることの発見（-048/-049の
      文言「削除状態になる/ならない」の読み替え根拠。ただし-049の実観測は決済代行のOK応答依存のため
      改訂1で要実機へ再訂正）。
  (4) **決済代行という外部SaaSにはm02-06/m05-15のような自作サーバ側スタブが作れない**（相手はソニー
      ペイメント相当の実在の決済代行であり、m02-06のPluginApiServiceのような自社コントロール下のAPIでは
      ない）ため、外部依存の要実機範囲が「サンドボックス実接続必須」という強い制約になった。
  (5) `update_date`列がリポジトリ層で明示的にセットされない（`nextMemId()`に`setUpdateDate()`呼出なし）
      ことを発見し、NOT NULL制約違反の懸念を専用subagentで調査した結果、EC-CUBE共通の
      `SaveEventSubscriber`（ダックタイピングによるprePersist/preUpdate自動設定）が発見的にこれを担保する
      ことを確認（L1-F0619-026）。ただし**codex R1でS0復元がupdate_dateを含んでおらず不完全と指摘**され、
      raw SQL復元＋実会員枠無効化の安全境界を改訂1で追加した（§2/§6）。
  (6) **「bound」の判定基準の曖昧さ**（改訂1・Major④）。分岐到達という構造事実がbound可能であることと、
      母集合の期待テキストが主張する終端結果（決済代行の実成否）がbound可能であることを当初混同していた。
      改訂1で「前提条件を自社側で制御できるか」という一貫した基準へ揃え、C-006/008/009/016/020を
      §4.1から§4.2へ移動した。
  (7) **EN資源の存在確認が不十分**（改訂1・Major⑤）。プラグイン配下の`find`結果のみで「本プラグインに
      EN資源なし」を「全claim ja固定」へ一般化し、見出しがEC-CUBE本体の翻訳キーを流用している事実
      （`messages.en.yaml:509`・`app_locales=ja|en`）を見落とした。
  (8) **「bound」の判定基準が改訂1でも1件だけ不徹底だった**（改訂2・R2 Blocker②）。C-018（登録・変更の
      DB無効果）はMemAdd経路自体の構造（書込ゼロ）は正しく条件化したが、「対象customer_idがMemAdd経路に
      該当する（＝決済代行に既存会員枠を持たない）」という前提が`dtb_customer`行の作成のみでは検証・
      保証できない決済代行側の状態であることを見落とし、bound(読替)のまま残してしまった。C-026
      （通信不能状態を能動的に作れる）との違い——「自社側で能動的に作れる環境操作」と「決済代行側の
      識別結果という受動的にしか分からない状態」の区別——を最初は徹底できていなかった。
- 楽だった点（再利用効果）: 既存page.ts/spec.tsが本書と独立に到達した外部依存の切り分け（5件fixme）が
  本書の分類と一致しており、判断の相互検証になった。SEED-F06-CUSTOMER・db.tsの型はW0-B0既存資産を流用。
- **codex敵対レビューの効果**: 自己検査（R0）では発見できなかった実装事実誤認・不整合（R1: 救済経路の
  書込・S0復元の不完全性・EN資源の誤判定／R2: 「bound」判定基準の最後の1件の取りこぼし）を段階的に検出し
  是正に至った。品質関門として機能した（REVIEW_LEDGER.mdの他機能と同様のパターン）。
