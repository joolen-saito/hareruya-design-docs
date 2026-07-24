# B0候補: m05-15 受注詳細メール通知 — 実行可能グレード候補（母集合71全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Blocker1＋Major5）→改訂1で是正済み・R2再確認待ち**（`REVIEW_LEDGER.md`と同期させること）
> **改訂1（codex R1是正）**:
> (1)【Blocker】封筒C-026のBCC/Return-Path退避矛盾を**観測範囲の限定で解消**: L1-M0515-015を
>     「ヘッダで観測可能な From/To/Reply-To/subject/text本文」の主張に限定し、**BCC=email01・Return-Path=email04は
>     組立仕様の逐語事実としてのみ保持・mailcatcher上の観測手段未確定=観測ケースの主張から除外・昇格対象外（要確認）**
>     と明示（完全封筒主張を撤回・C-026の項目名と主判定を一致）。母集合030/067の期待テキストは「差出人=送信元
>     アドレスとショップ名」のみでありbindは不変。
> (2)【捏造・出典誤り】L1-M0515-015の出典 `MailService.php:597-604,100` の「100」を**除去**（100行はBaseInfo初期化で
>     封筒組立行でない）→ `:597-604` に訂正・BaseInfo初期化の参照は `:82-101` を別記。
> (3)【Major1】実送信系（C-025〜C-031・C-033・C-036）の対象受注を**SEED-M05-15-SENDABLE（使い捨て受注）へ切替**
>     （seed README:83の定義に整合。非破壊参照SEED-M05-15-ORDERの送信対象利用=900000301全件使用を撤回。
>     ORDERは表示・遷移・検証・無送信否定観測に限定）。
> (4)【Major2】afterEach cleanupを**実行前ID集合との差分（当該runの新規作成行）に限定**（`DELETE … WHERE order_id=…`
>     の全削除は既存履歴も消しS0非同値=撤回）。
> (5)【Major3】C-030の主判定に**mailcatcher着信（送信成功の肯定観測）を昇格**（「履歴なし」がSMTP失敗でも通る
>     偽陽性経路を閉塞。送信→persist順序=MailController.php:148→161-162に基づく主アサーション化）。
> (6)【Major4】C-025/C-028/C-030の履歴突合を「最新行」読取から**実行前後ID差分＋組立後件名一致のrun一意突合**へ是正。
> (7)【Major5】C-014の本文アサーションに**body値・エラー領域有無・kernel.debug／strict_variables状態の同時記録**を
>     義務付け「本文内容の正否は未判定」と明示（件名恒等＋本文欄セット＋同一画面の主判定は維持）。
> excluded=5（EX-B/EX-D）・DB相関016/017 bound・件名255境界・BC-DRAFT-1/-2・DOC-DRAFT-1はcodex妥当確認済み=維持。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:259）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `_drafts/m05-16_admin_order_order_shop_memo_executable_draft.md`（受注編集系・W1 codex承認済み）＋
> `_drafts/m09-01_admin_content_content_news_executable_draft.md`（フォーム/メッセージ・request契約の先例）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-15_admin_order_order_mail_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **本機能の特記（不確定・乖離候補の分離）**:
> (1) **BC-DRAFT-m05-15-1（既定テンプレ未配置候補）**: file_name空テンプレの既定フォールバック
>     `Mail/order.twig`（MailController.php:104・md:208）は**リポジトリ実測で未配置**（find実測: 実在は
>     `Mail/Mall/order.twig`・`Mail/Tenant/{1,2,3}/order.twig` のみ。`app/template/default/Mail/` ディレクトリ自体が不存在）。
>     既定描画はLoaderError→M05-15-MSG-004＋本文空になる可能性＝設計書md:208との乖離候補（→§9）。
> (2) **BC-DRAFT-m05-15-2（描画context乖離候補）**: `createBody` はテンプレへ **`Order` のみ**を渡す
>     （MailController.php:196-198）が、同梱テンプレ（例 `Mail/order_cvs.twig`）は `data`/`header`/`footer` を参照
>     （order_cvs.twig冒頭 `{{ data.name01 }} {{ data.name02 }} 様`…）。`strict_variables: '%kernel.debug%'`
>     （twig.yaml:16）により、描画結果が「差込全空」か「例外→本文空（catch \Exception・画面エラーなし
>     =MailController.php:202-204）」かは環境依存＝テンプレ選択時の本文初期値の**実値は要実機**（→§9）。
> (3) **DOC-DRAFT-m05-15-1（設計自己矛盾候補）**: 設計書の「メッセージID対応（自動棚卸）」第2表の
>     M05-15-MSG-001「保存しました」（テンプレ保存時）・MSG-002「削除しました」（テンプレ削除時）
>     （md:176-177）は、md:37「メールテンプレートマスタ自体の登録・編集・削除（本機能では既存テンプレートを
>     選択するのみ）」のスコープ外宣言と自己矛盾（棚卸のスコープ外メッセージ混入）。母集合064の期待
>     「要ソース確認であること。」はこの混入に由来＝EX-D根拠（→§8/§9）。
> (4) **メール送信系の観測**: 送信隔離先=mailcatcher（SMTP :1025／UI :1080。`e2e/seed/README.md:26-28`）。
>     宛先/件名/本文差込は**mailcatcher API＋送信履歴（dtb_mail_history）**で観測し、期待は
>     **テンプレ定義＋受注データ＋店舗基本情報のL1式**から確定（実応答依存・SEED値直参照にしない）。
>     送信はdtb_mail_history INSERT等の副産物を伴う**破壊系**＝**使い捨て受注SEED-M05-15-SENDABLE**
>     （seed README:83。SQLはD5で整備=@TBD-D5）に限定し、afterEachで**実行前ID差分の新規履歴行のみ削除**＋
>     mailcatcherクリア＋S0スナップショット同値検査（m05-13教訓）。BCC/Return-Pathの観測手段は未確定=
>     昇格対象外（改訂1(1)）。
> **行数集計**: 候補ケース行総数**30**＝bound対応27（ja22＋-EN5）＋補完3。母集合71=bound66＋TBD0＋excluded5。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md`（本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0/W1と同一）。
- vendor翻訳: symfony/validator **v7.4.3**（composer.lock実測・W0と同一版）。本機能の検証文言はEC-CUBE側
  `validators.{ja,en}.yaml` 上書きで確定（NotBlank・TwigLint）。vendor form catalog（choice不正）は要実機（§9）。
- fid_kubun.tsv（D1）: `M05-15｜m05-15_admin_order_order_mail｜各種メール送信｜対象｜標準｜standard-src+design`
  （fid_kubun.tsv:259。target_sha256=4a255392…・todo_sha256=5452cf67…＝ファイル冒頭ヘッダ実測。
  fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M05-15全**71行**
  （IT-M05-15-ADMIN-ORDER-ORDER-MAIL-001〜071）。
- **判定原則（W0/W1教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性（肯定/否定）も期待テキストで確認する（§8に全71行の期待要旨併記）。
  本機能の母集合は前提列にメッセージID・エッジケース名が漂着し期待列と大きくずれる（例: 037「不正Twig」前提に
  「最大長+1」入力と「変更されない」期待）。§10のC4-manualで極性裁定を全件記録。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須（ee=PostgreSQL/文字長意味論）。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M0515-001 | auth_rule | 未ログインで `GET /%eccube_admin_route%/order/{id}/mail` へアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginにより**ログイン画面（route `admin_login`）へリダイレクト**されメール通知画面へ到達しない | 設計書md＋standard-src | 「未ログインまたは権限・IP制限で拒否される利用者｜上記パス（到達前）｜管理画面の共通ルールに従いアクセスできない」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m05-15md:74,286／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M0515-002 | http_status | 入口URLは `GET/POST /%eccube_admin_route%/order/{id}/mail`（route `admin_order_mail`・id=数値）。受注はURLパスの識別子で必須解決され、**解決できない場合はアクセスできない**（専用の利用者向け文言なし。HTTP404という具体観測形態は一次資料に逐語なし=要実機副観測） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/order/{id}/mail', name: 'admin_order_mail', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]`／「URLの受注識別子で受注1件を取得する。取得できない場合はアクセスできない（受注は必須パラメータとして解決される）」／「受注識別子が存在しない｜受注が解決できずアクセスできない。専用の利用者向け文言は本機能では持たない。」 | MailController.php:68／m05-15md:98,322 | — | 0 `non-ui-observable` |
| L1-M0515-003 | display_field | 編集画面は2カード構成。①「メール送信先」カード（見出し=`admin.order.mail_destination_info` ja「メール送信先」/en "Send to"＋説明アイコン・本体`#mailTo` collapse show）に注文番号（Order.id）・購入金額・注文者（氏名/カナ/〒/住所）・購入商品（先頭商品名＋2点超で`admin.order.mail_purchase_product_count`「他%count%点」）・対応状況バッジを**編集不可の参照表示**。②「メール内容」カード（見出し=`admin.order.mail_mail_info` ja「メール内容」/en "Email Contents"・本体`#mailCreate`）にテンプレート選択（`#template-change`）・件名テキスト入力（`#admin_order_mail_mail_subject`・必須バッジ`admin.common.required` ja「必須」/en "Required"）・本文エディタ領域（`#editor`）。ページtitle=`admin.order.mail` ja「メール通知」/en "Email Notifications" | 設計書md＋standard-src | 「カード『メール送信先』に、注文番号、購入金額、注文者氏名・カナ・郵便番号・住所、購入商品（先頭商品名と『他N点』表記）、対応状況のバッジを表示する。…編集不可の参照表示」／「カード『メール内容』に、テンプレート選択ドロップダウン、件名のテキスト入力（必須バッジ付き）、本文のエディタ領域を表示する。」／`{{ 'admin.order.mail_destination_info'\|trans }}`…`<div class="collapse show ec-cardCollapse" id="mailTo">`／`{{ 'admin.order.mail_mail_info'\|trans }}`…`id="mailCreate"`／`admin.order.mail_destination_info: メール送信先`／`admin.order.mail_mail_info: メール内容`／en `Send to`・`Email Contents` | m05-15md:82-83／mail.twig:52-88（見出し56・#mailTo 61・注文番号64-65・購入金額66-67・注文者70-71・購入商品72-80・対応状況83-84）・94-134（見出し97・#mailCreate 101・template 110・badge 119・subject 122・editor 131）／messages.ja.yaml:2540,2541,2533,1721,2459・messages.en.yaml:2377,2378,1749,2306 | — | 1 |
| L1-M0515-004 | display_field(文言) | ツールチップ（`div[data-bs-toggle="tooltip"]` title属性）3種＝送信先:`tooltip.order.mail_destination_info` ja「注文者にメールが送信できます。」/en "You can send emails to shoppers."・テンプレート:`tooltip.order.mail_template` ja「メールのテンプレートを選択します。」/en "You can select an email template."・件名:`tooltip.order.mail_subject` ja「メールの件名を修正できます。」/en "You can change the email title." | 設計書md＋standard-src | 「送信先・テンプレート・件名の各ラベルにツールチップ（吹き出し説明）を表示する。」／`title="{{ 'tooltip.order.mail_destination_info'\|trans }}"`ほか | m05-15md:89／mail.twig:56,105,116／messages.ja.yaml:3622-3624・messages.en.yaml:3236-3238 | — | 1 |
| L1-M0515-005 | display_field | GET初期表示はテンプレート未選択（プレースホルダ=`common.select` ja「選択してください」/en "Please select"）・件名空・本文空 | 設計書md＋standard-src | 「テンプレート未選択・件名空・本文空の編集画面を描画する。」／「未選択（プレースホルダ『選択してください』）」／`'placeholder' => 'common.select',`／`common.select: 選択してください`／en `Please select` | m05-15md:101,197／MailTemplateType.php:35／messages.ja.yaml:8・messages.en.yaml:8 | — | 1 |
| L1-M0515-006 | display_field(契約) | 同一URL POSTを分岐させる隠しモード=`<input id="mode" type="hidden" name="mode">`（change/confirm/complete/back。backは明示分岐なし）。フォームキーはblock prefix `admin_order_mail` 配下の `template`（select）・`mail_subject`（text）・`tpl_data`（textarea=複数行入力・画面上は非表示でaceが被さる）＝name属性 `admin_order_mail[template]`/`admin_order_mail[mail_subject]`/`admin_order_mail[tpl_data]` | standard-src＋設計書md | `<input id="mode" type="hidden" name="mode">`／`$mode = $request->get('mode');` `switch ($mode) { case 'change': … case 'confirm': … case 'complete': … default: }`／「モード｜同一URLへのPOSTで処理を分岐させる隠しパラメータ。テンプレート変更（`change`）・確認（`confirm`）・送信（`complete`）・戻る（`back`、明示処理なし）」／`->add('template', MailTemplateType::class,…)->add('mail_subject', TextType::class,…)->add('tpl_data', TextareaType::class,…)`／`return 'admin_order_mail';` | mail.twig:92・mail_confirm.twig:83／MailController.php:91-95,180-181／m05-15md:60,197-199／OrderMailType.php:44,50,56,73 | — | 0 `non-translated` |
| L1-M0515-007 | validation_rule | 件名（mail_subject）は**必須**（`required => true`＋`Assert\NotBlank()`。Length制約なし=フォーム上限なし）。空で confirm/complete するとエラー ja「入力されていません。」/en "No value found." が**件名欄直下**（`form_errors(form.mail_subject)`）に表示され、確認・送信へ進まない | standard-src＋設計書md | `->add('mail_subject', TextType::class, [ 'required' => true, 'constraints' => [ new Assert\NotBlank(), ], ])`／「件名｜必須｜フォーム上限なし（DBは255文字…）」「件名が空｜必須検証でエラーとなり、確認・送信に進めない。」／`This value should not be blank.: 入力されていません。`／en `No value found.`／`{{ form_errors(form.mail_subject) }}` | OrderMailType.php:50-55／m05-15md:198,211,145,168／validators.ja.yaml:17・validators.en.yaml:17／mail.twig:123 | — | 1 |
| L1-M0515-008 | validation_rule | 本文（tpl_data）は**任意**（`required => false`・`mapped => false`）で制約は`TwigLint`のみ（長さ上限なし）。不正Twig構文で confirm/complete するとエラー ja「Twigのフォーマットが正しくありません。{{ error }}」/en "Invalid Twig format. {{ error }}" が**本文欄直下**（`form_errors(form.tpl_data)`・`#editor`に`is-invalid`付与）に表示され進まない。`{{ error }}`=Twig例外メッセージ（環境値→**前方一致で観測**）。**空本文はエラーにならない**（TwigLintValidatorはnull→''とし空文字は妥当なTwig） | standard-src＋設計書md | `->add('tpl_data', TextareaType::class, [ 'label' => false, 'mapped' => false, 'required' => false, 'constraints' => [ new TwigLint(), ], ])`／`public string $message = 'Invalid twig format. {{ error }}';`／`Invalid twig format. {{ error }}: Twigのフォーマットが正しくありません。{{ error }}`／en `Invalid Twig format. {{ error }}`／`->setParameter('{{ error }}', $e->getMessage())`／`// valueがnullの場合は…空文字でチェックする.`／「本文｜任意（構文検証あり）｜フォーム上限なし」「本文に不正な Twig 構文｜構文検証でエラーとなり、確認・送信に進めない。」 | OrderMailType.php:56-63／TwigLint.php:21／validators.ja.yaml:36・validators.en.yaml:31／TwigLintValidator.php:38-53／m05-15md:199,210,144,169／mail.twig:131-133 | — | 1 |
| L1-M0515-009 | validation_rule | テンプレートは**任意**（`required => false`・`mapped => false`・エンティティに非マップ）。未選択のまま件名入力・本文直接入力で確認・送信できる | standard-src＋設計書md | `->add('template', MailTemplateType::class, [ 'required' => false, 'mapped' => false,…])`／「テンプレート未選択のまま件名・本文を直接入力して確認・送信｜テンプレートは任意のため、件名が入力済みで本文の構文が妥当なら確認・送信できる。」 | OrderMailType.php:44-49／m05-15md:197,207,276 | — | 0 `non-translated` |
| L1-M0515-010 | status_transition | mode=`change`（テンプレ選択のchangeイベントでJSが`#mode`に`change`をセットし自動送信=mail.twig:23-27）でtemplateフィールドが妥当な場合のみ、選択テンプレの`mail_subject`を件名欄へ・`file_name`のTwigを**当該受注で描画した文字列**（`createBody($Order,$twig)`・contextは`Order`のみ）を本文欄へセットし**同一編集画面を再表示**する（描画時のLoaderError以外の例外は画面に出さず警告ログのみ・本文空=L1-012/BC-DRAFT-2） | standard-src＋設計書md | `case 'change': if ($form->get('template')->isValid()) {`…`$twig = $MailTemplate->getFileName();`…`$body = $this->createBody($Order, $twig);`…`$form->get('mail_subject')->setData($MailTemplate->getMailSubject()); } $form->get('tpl_data')->setData($body);`／`$body = $this->renderView($twig, [ 'Order' => $Order, ]);`…`} catch (\Exception $e) { log_warning($e->getMessage()); }`／「選択テンプレートの件名と、当該受注で描画した本文を入力欄へ読み込み直し、同一画面を再表示する。」／「本文（テンプレート本文）｜テンプレートの Twig ファイルを当該受注で描画した文字列。」／`$('#template-change').on('change', function() { $('#mode').val('change'); $('#order-mail-form').submit();` | MailController.php:96-127,192-207（renderView 196-198・catch 202-204）／m05-15md:69,103-110,57,85／mail.twig:23-27 | — | 0 `data-passthrough`（件名・本文とも読込値の恒等セット。本文実値は要実機=§9） |
| L1-M0515-011 | validation_rule(既定テンプレ) | 選択テンプレの`file_name`が空のときは既定の受注メールテンプレート `Mail/order.twig` で本文を描画する（**BC-DRAFT-m05-15-1**: repo実測で `Mail/order.twig` は未配置=実在は `Mail/Mall/order.twig`・`Mail/Tenant/{1,2,3}/order.twig` のみ〔find実測〕・`app/template/default/Mail/`不存在→LoaderError=M05-15-MSG-004＋本文空となる可能性。実解決は要実機） | standard-src＋設計書md | `$twig = $MailTemplate->getFileName(); if (!$twig) { $twig = 'Mail/order.twig'; }`／「テンプレートのファイル名が空｜既定の受注メールテンプレートで本文を描画する。」 | MailController.php:102-105／m05-15md:208,185／（未配置の実測: find＝Mail直下にorder.twigなし・twig.yaml:5-8のpaths） | — | 0 `non-translated` |
| L1-M0515-012 | message | 本文テンプレートの読み込み失敗（LoaderError）時のみ、エラー ja「選択されたテンプレートの本文が見つかりませんでした。同期が完了していない可能性があります。大変お手数ですが、1分ほど待ってから再度アクセスしてください。」/en "The body of the selected template could not be found. File synchronization may not be complete. We apologize for the inconvenience, but please wait for approximately a minute and try accessing it again."（キー`admin.order.mail_template_not_found_error`・M05-15-MSG-004）を**画面上部のエラー表示領域**に積み、本文は空のまま編集画面を再描画する（警告ログも記録） | standard-src＋設計書md | `} catch (LoaderError $e) { $this->addError('admin.order.mail_template_not_found_error', 'admin'); log_warning($e->getMessage()); }`／`admin.order.mail_template_not_found_error: 選択されたテンプレートの本文が見つかりませんでした。…`／en同キー／「テンプレート選択時（モード `change`）に本文テンプレートの読み込みに失敗した場合｜画面上部のエラー表示領域」「エラーメッセージを表示し、本文は空のまま編集画面を再描画する。」 | MailController.php:199-201／messages.ja.yaml:2538・messages.en.yaml:2375／m05-15md:143,209,167,319 | — | 1 |
| L1-M0515-013 | status_transition | mode=`confirm`・検証成功時はフォームをfreeze（`freeze`属性）して**確認画面**（mail_confirm.twig）を描画: 件名・本文は**編集不可の再表示**（値のテキスト表示＋hidden widget。編集用`#editor`は確認画面に不存在）・本文は改行を反映（`nl2br`）・「送信」ボタン（`button[name=mode][value=complete]`・`admin.order.mail_send` ja「送信」）・戻るリンク`#back`（`admin.order.mail` ja「メール通知」）。検証失敗時は確認画面へ進まず編集画面に留まり項目エラーを表示 | standard-src＋設計書md | `case 'confirm': if ($form->isSubmitted() && $form->isValid()) { $builder->setAttribute('freeze', true);`…`return $this->render('@admin/Order/mail_confirm.twig',…)`／`{{ form.mail_subject.vars.data }} {{ form_widget(form.mail_subject, { type : 'hidden' }) }}`／`{{ form.tpl_data.vars.data\|trans\|nl2br }}`／「件名・本文を編集不可で再表示し、送信前に内容を確認させる画面」「検証失敗時は確認画面へ進まず、編集画面に留まり項目エラーを表示する。」 | MailController.php:128-140／mail_confirm.twig:99-115（subject 106-107・body 114）,125,130／m05-15md:59,70,112-117,301／messages.ja.yaml:2545,2459 | — | 0 `non-translated`（ボタン文言はL1-003系locale・確認画面-EN行は§5保留参照） |
| L1-M0515-014 | db_effect＋message | mode=`complete`・検証成功時: ①`sendAdminOrderMail`で注文者宛にメール送信 ②送信履歴 `dtb_mail_history` へ**1行INSERT**（mail_subject=**送信メッセージの件名（組立後）**・mail_body=**送信テキスト本文**・send_date=送信処理時点・Order=当該受注・Customer=当該受注の会員〔ゲスト等はNULL可〕・BaseInfo=**ログイン中管理者のBaseInfo**〔NOT NULL〕。Creator/MailTemplate/mail_html_bodyはセットしない） ③成功フラッシュ `admin.order.mail_send_complete` ja「メールを送信しました。」/en "Email has been sent." ④受注編集画面（`admin_order_edit`）へリダイレクト | standard-src＋設計書md | `$message = $this->mailService->sendAdminOrderMail($Order, $data);`…`$MailHistory->setMailSubject($message->getSubject())->setBaseInfo($this->getMember()->getBaseInfo())->setMailBody($message->getTextBody())->setCustomer($Order->getCustomer())->setSendDate(new \DateTime())->setOrder($Order); $this->entityManager->persist($MailHistory); $this->entityManager->flush();`…`$this->addSuccess('admin.order.mail_send_complete', 'admin'); return $this->redirectToRoute('admin_order_edit', ['id' => $Order->getId()]);`／`admin.order.mail_send_complete: メールを送信しました。`／en `Email has been sent.`／「注文者へメールを送信し、送信内容を送信履歴に記録し、成功メッセージを積んで受注編集画面へ遷移する。」「送信履歴には当該受注の会員を関連付ける。会員に紐づかない受注（ゲスト購入等）では会員参照が空となり得る。」 | MailController.php:142-178（send 148・履歴152-162・flash 175・redirect 177）／messages.ja.yaml:2546・messages.en.yaml:2383／MailHistory.php:32-33,50-57,62-63,70-71／m05-15md:71,119-126,213,290,340 | — | 1 |
| L1-M0515-015 | mail_envelope | **観測主張の範囲（メッセージヘッダ/本文でmailcatcher観測可能な項目に限定）**: subject=`'[' + BaseInfo.shop_name + '] ' + 入力件名`・From=Address(`BaseInfo.email01`, `BaseInfo.shop_name`)・To=**当該受注の`dtb_order.email`**・Reply-To=`BaseInfo.email03`・本文=入力`tpl_data`の**プレーンテキスト**（HTML本文なし）。BaseInfoは現テナントの`dtb_base_info`行（実行時にdb.tsで読取=期待の正はDB現行値でありSEED値でない）。**組立仕様の逐語事実として bcc=`BaseInfo.email01`・returnPath=`BaseInfo.email04` も実装に存在する**が、mailcatcher上の観測手段（envelope表現形）が未確定のため**観測ケースの主張から除外・昇格対象外（要確認=§9-6。完全封筒の観測主張はしない）** | standard-src＋設計書md | `->subject('['.$this->BaseInfo->getShopName().'] '.$formData['mail_subject'])->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))->to($this->convertRFCViolatingEmail($Order->getEmail()))->bcc($this->BaseInfo->getEmail01())->replyTo($this->BaseInfo->getEmail03())->returnPath($this->BaseInfo->getEmail04())->text($formData['tpl_data']);`／「送信時の実際の件名は『[ショップ名] 入力件名』の形に組み立てる。」「送信先（宛先）｜当該受注のメールアドレス宛に送る。」「差出人は店舗基本情報の送信元アドレスとショップ名。BCC は店舗基本情報の送信元アドレス。返信先・Return-Path は店舗基本情報の該当アドレス。」「編集後の本文をプレーンテキスト本文として送る。本機能はHTML本文を組み立てない。」 | MailService.php:597-604（BaseInfo初期化は:82-101）／m05-15md:187-190／Order.php:485／BaseInfo.php:75-88 | — | 0 `non-translated` |
| L1-M0515-016 | db_effect | 送信履歴に記録する件名・本文は**画面入力そのままではなく送信メッセージの値**（件名=ショップ名前置を含む組立後・本文=送信テキスト） | 設計書md＋standard-src | 「送信履歴には、実際に送信したメールの件名（ショップ名前置を含む組み立て後）と本文を記録する。画面入力そのままではなく送信メッセージの値を保存する。」／`->setMailSubject($message->getSubject())`…`->setMailBody($message->getTextBody())` | m05-15md:221／MailController.php:154,156 | — | 0 `non-ui-observable` |
| L1-M0515-017 | db_effect | 本機能は受注ステータス・在庫・金額など**受注台帳を更新しない**（`dtb_order`当該行は送信前後でS0スナップショット同値）。副作用は送信履歴の追加のみ | 設計書md | 「本機能は受注ステータス・在庫・金額などを更新しない。送信履歴の追加のみを副作用とする。」 | m05-15md:191,27 | — | 0 `non-ui-observable` |
| L1-M0515-018 | error_handling | メーラーの送達失敗（トランスポート例外）時: 送信処理内でcatchし**致命ログのみ記録**・画面には専用メッセージを出さず**成功扱い**（成功フラッシュ＋受注編集画面へ遷移。履歴INSERTも送信呼出し後に実行されるため**記録される**） | standard-src＋設計書md | `try { $this->mailer->send($message); log_info('受注管理通知メール送信完了'); } catch (TransportExceptionInterface $e) { log_critical($e->getMessage()); } return $message;`／「メーラーの送達失敗（トランスポート例外）｜画面には専用メッセージを出さない。送信処理は致命ログを記録し、画面上は成功扱いで受注編集画面へ遷移する。」 | MailService.php:616-624／MailController.php:148-177（send→persist→flash→redirectの順）／m05-15md:157,321,338 | — | 0 `non-translated` |
| L1-M0515-019 | db_effect(段差) | 件名のForm/DB段差: Form層に長さ制約なし（L1-007）・保存先 `dtb_mail_history.mail_subject`=STRING **255文字**・NULL許容。組立後件名（=`char_length(shop_name)+3+char_length(入力件名)`）が**255以内なら履歴行が追加**され、**256以上ならDB層（PostgreSQL varchar(255)）で挿入不能となり履歴行は追加されない**（暗黙切詰めなし。送信→persistの順序のためメール自体は送信済み・画面応答の形態=要実機）。mail_body=TEXT（長さ上限なし） | standard-src＋設計書md | `#[ORM\Column(name: 'mail_subject', type: Types::STRING, length: 255, nullable: true)]`／`#[ORM\Column(name: 'mail_body', type: Types::TEXT, nullable: true)]`／「件名の255文字はメール送信履歴・テンプレートの該当列のスキーマ長を確認値とする。フォーム側に明示的な最大長制約は持たない。」／組立式=MailService.php:598逐語（L1-015） | MailHistory.php:53-57／m05-15md:198,201／MailService.php:598／MailController.php:148,161-162 | **文字** | 0 `non-ui-observable` |
| L1-M0515-020 | status_transition | mode=`back`（およびchange/confirm/complete以外）は**分岐処理なし**＝現在のフォーム状態で編集画面を再描画（md:72の利用者視点では「編集画面の初期描画に戻る」）。確認画面の`#back`リンク押下でJSが`#mode`に`back`をセットしフォーム送信する | standard-src＋設計書md | `default: break;`…`return [ 'form' => $form->createView(),…]`／「確認画面で『メール通知』リンク（戻る）を押す｜…明示的な分岐処理は無く、編集画面の初期描画に戻る。」「テンプレート変更・確認・送信のいずれにも該当しないモードでは、分岐処理を行わない。現在のフォーム状態で編集画面を再描画する。」／`$('#back').on('click', function(e) { e.preventDefault(); $('#mode').val('back'); $('#order-mail-form').submit();` | MailController.php:180-189／m05-15md:72,128-131,86／mail_confirm.twig:29-34,125 | — | 0 `non-translated` |
| L1-M0515-021 | status_transition | 編集画面の「受注登録」リンク（`admin.order.order_registration` ja「受注登録」/en "Add New Order"・`a[href→admin_order_edit]`）で**メールを送信せず**受注編集画面へ戻る（mailcatcher無着信・履歴追加なし） | standard-src＋設計書md | `<a class="c-baseLink" href="{{ url('admin_order_edit', { id: Order.id }) }}">…{{ 'admin.order.order_registration'\|trans }}`／「編集画面で『受注登録』リンクを押す｜GET …/order/{id}/edit｜メールを送信せず受注編集画面へ戻る。」 | mail.twig:145／m05-15md:73,304／messages.ja.yaml:2456・messages.en.yaml:2303 | — | 0 `non-translated` |
| L1-M0515-022 | status_transition | 入口=受注編集画面のメール送信履歴ブロックの「メールを作成」リンク（`admin.order.mail_create` ja「メールを作成」・`href=admin_order_mail`）→当該受注1件分のメール通知画面が開く | standard-src＋設計書md | `href="{{ path('admin_order_mail', { id : Order.id }) }}">{{ 'admin.order.mail_create'\|trans }}</a>`／「受注編集画面のメール送信履歴ブロックで『メールを作成』を押す｜GET …/order/{id}/mail｜当該受注1件分のメール通知画面が開く。」 | edit.twig:1883／m05-15md:68,11／messages.ja.yaml:2539 | — | 0 `non-translated` |
| L1-M0515-023 | display_field | テンプレート選択肢は `dtb_mail_template` から**識別子（id）昇順**で構成（`orderBy('mt.id','ASC')`。OrderMailTypeのquery_builderに**テナント/自動送信の絞り込み条件は明示されていない**＝実際に表示される選択肢集合のテナント絞込は要実機・SEEDは`base_info_id=2`で用意） | standard-src＋設計書md | `'query_builder' => fn (EntityRepository $er) => $er->createQueryBuilder('mt')->orderBy('mt.id', 'ASC'),`／「フォームキー `template`。`dtb_mail_template` から識別子昇順で選択肢を構成。」 | OrderMailType.php:47-48／m05-15md:197,251 | — | 0 `non-translated` |
| L1-M0515-024 | db_effect | テンプレート選択（change）は件名・本文の初期化のみで**永続化を伴わない**（`dtb_mail_template`・`dtb_mail_history`ともS0スナップショット同値。changeブランチにpersist/flushなし） | 設計書md＋standard-src | 「選択時に件名・本文の初期値を読み込み直す。選択は本文・件名の永続化を伴わず、入力欄への反映のみ。」「テンプレート選択は件名・本文の初期化に使うだけで、テンプレートマスタやその選択状態を更新しない。」／changeブランチ（MailController.php:96-127）にpersist/flush不存在（実読） | m05-15md:184,223／MailController.php:96-127 | — | 0 `non-ui-observable` |
| L1-M0515-025 | validation_rule(DB相関) | テンプレートに**DBに存在しないid**を指定（直接POST）した場合: EntityType解決失敗でtemplateフィールドが妥当でなくなり、mode=changeの読込処理へ**進まない**（件名・本文は読み込まれない）・confirm/completeもform全体無効で進まない・編集画面を再表示。エラー描画位置=`form_errors(form.template)`。文言はvendor form catalog「選択した値は無効です。」/"The selected choice is invalid." が既定だが**invalid_message解決の実測は要実機副観測** | standard-src＋設計書md | `if ($form->get('template')->isValid())`（妥当時のみ読込）／「テンプレート選択フィールドが妥当な場合のみ進む。」／`{{ form_errors(form.template) }}`／vendor form validators.ja.xlf:26-27 `選択した値は無効です。` | MailController.php:97,129,143／m05-15md:106／mail.twig:111 | — | 0 `non-ui-observable`（文言=要実機のためLS表対象外） |
| L1-M0515-026 | display_field | 本機能の編集・確認画面はモーダル・ポップアップ・トースト・確認ダイアログを表示しない（過去メール閲覧モーダルは受注編集画面側の要素=本機能対象外。観測範囲=編集・確認画面内の要素と各ボタン押下時の挙動に限定） | 設計書md | 「本機能の編集・確認画面はモーダル・トースト・確認ダイアログを表示しない。過去メールの閲覧モーダルは受注編集画面側の送信履歴ブロックの要素であり本機能では扱わない。」 | m05-15md:88,41 | — | 0 `non-translated` |
| L1-M0515-027 | display_field | 本文は複数行入力（textarea `#admin_order_mail_tpl_data`）を実体に持ち画面上は非表示。aceエディタ（`#editor`・twigモード・自動補完・不可視文字表示）が表示され、フォーム送信直前にエディタ内容を隠しtextareaへ書き戻す（`$('#order-mail-form').on('submit',…)`） | standard-src＋設計書md | 「本文は複数行入力（textarea）を実体に持つが、画面上はコードエディタ（ace）で Twig モード…を有効化して表示する。textarea自体は非表示にし、フォーム送信直前にエディタの内容を隠しtextareaへ書き戻す。」／`editor.session.setMode('ace/mode/twig');`…`$('#order-mail-form').on('submit', function() { $('#admin_order_mail_tpl_data').val(editor.getValue()); });`／`<div style="display: none">{{ form_widget(form.tpl_data) }}</div>` | m05-15md:84／mail.twig:29-43,131-133 | — | 0 `non-translated` |

## §2 SEED三段参照設計

三段参照: `L1式（テンプレ定義＋受注データ＋店舗基本情報からの導出） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。
固定値は**入力の再現手段**であり期待値の正にしない（宛先=実行時に`SELECT email FROM dtb_order WHERE id=…`、
封筒=実行時に`dtb_base_info`現行値、テンプレ件名=実行時に`dtb_mail_template.mail_subject`を読む）。全て `@TBD-D5`。

| SEEDセットID | 目的 | 固定値（設計。SQL実在=`e2e/seed/sets/m05/`） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（admin/base_info_id=2テナント。README:26） | W0/W1と共通 | 不変 |
| SEED-M05-15-ORDER | 参照受注（**非破壊参照・送信対象にしない=改訂1(3)**。表示・遷移・検証失敗系・無送信否定観測の対象） | `dtb_order` id=**900000301**（order_status=4・email有・会員900000201紐付き・明細900000401・出荷900000501。SQL実在: SEED-M05-15-ORDER.sql） | 不変（利用ケースは履歴INSERTを発生させない。読み取り照会のみ） |
| SEED-M05-15-SENDABLE | **実送信の使い捨て受注**（送信系C-025〜031・033・036の対象。seed README:83「mailcatcherへ送る使い捨て受注」） | SENDABLE=**900000311（帯@TBD-D5）**: SEED-M05-15-ORDERと同型の完全受注1件（email有・会員紐付き・明細・出荷）。**SQLは現状未整備**（README:83はUI合成扱い・coverage tsvもmissing_seed_refs記載=実測）→本書は同規約（固定IDバンド+UPSERT+.down）でのSQLセット化を設計し**行セットの完全定義はD5 manifest契約で確定**（捏造しない） | 使い捨て。**afterEach: 実行前に取得した dtb_mail_history ID集合との差分（当該runの新規行）のみDELETE**（全削除しない=改訂1(4)）＋mailcatcherクリア（`DELETE /messages`）＋dtb_order当該行のS0同値検査 |
| SEED-M05-15-TEMPLATE | 正常テンプレ（change読込・選択肢） | `dtb_mail_template` id=**900000601**・base_info_id=2・mail_subject=`【E2E】ご注文ありがとうございます`・file_name=`Mail/order_cvs.twig`（実在ファイル） | UPSERTべき等・不変（changeは非永続=L1-024） |
| SEED-M05-15-DEFAULT-TPL | file_name空（既定テンプレ経路=L1-011/BC-DRAFT-1） | id=**900000602**・file_name=`''` | 同上 |
| SEED-M05-15-MISSING-TPL | file_name欠落（読込失敗=L1-012） | id=**900000603**・file_name=`Mail/__e2e_missing__.twig`（不存在） | 同上 |

- 送信系（C-025〜C-031・C-033・C-036）は履歴INSERT＝破壊系。対象受注は**SEED-M05-15-SENDABLE**のみに限定
  （改訂1(3)）。**履歴行の一意突合は「実行前ID集合との差分」を主とし、組立後件名（`E2E-<runid>-`prefixを含む）
  の一致を併用**（「最新行」読取は並行/残骸で他run行を拾うため禁止=改訂1(6)。C-029の1字件名はID差分のみで特定）。
  afterEachは上表のとおり（ID差分限定削除）。
- 破壊系の不変検査はSEED値でなく**操作前スナップショットS0との同値**（m05-13教訓）: C-031/C-032は
  操作直前に対象行をSELECTしS0を確定→操作後に同値比較。
- mailcatcher前提（SMTP :1025/UI :1080=README:28）が満たされない環境では送信系は実行不能（前提未成立skip）。

## §3 画面項目マトリクス（テンプレ選択/差込/プレビュー/送信）

三値比較: 設計書md（入力項目表:195-199）／ee Form（OrderMailType.php）／ee DB（MailHistory.php・MailTemplate.php・Order.php）。

| 項目 | 任意/必須 | Form層制約／DB層（unit=文字） | 境界・状態3態 | メッセージ（ja/en・L1参照） |
|---|---|---|---|---|
| テンプレート（template） | **任意**（md:197「任意」=OrderMailType.php:45 `required=>false`・mapped=false） | Form=EntityType（DB `dtb_mail_template` id昇順=L1-023。不正idは解決不能=L1-025）／DB: file_name STRING255・mail_subject STRING255（MailTemplate.php:129,132） | **テンプレ3態**（SEED-M05-15-*で解禁）: ①正常（file_name実在→件名+描画本文読込=C-014） ②既定（file_name空→`Mail/order.twig`フォールバック=C-091・BC-DRAFT-1） ③欠落（file_name不存在→MSG-004+本文空=C-092）。＋不正id（直接POST→読込不成立=C-034）・未選択（プレースホルダ=C-010・未選択送信=C-027） | 欠落: L1-012（MSG-004）／不正id: L1-025（文言要実機） |
| 件名（mail_subject） | **必須**（NotBlank=L1-007。必須バッジ=mail.twig:119） | **Form長さ制約なし**（OrderMailType.php:50-55にLength不存在=md:198「フォーム上限なし」）**／DB（履歴）255**（MailHistory.php:53）→**段差**: 実効上限は組立後件名（`len(shop_name)+3+len(入力)`）がDB層255に収まるかで決まる=L1-019 | 空（NotBlank拒否=C-023）／組立後**255**（受理・char_length=255=C-028）／組立後**256**（DB層で履歴挿入不能=C-030。主判定=mailcatcher着信＋履歴ID差分0の複合・応答形態のみ要実機）／1字（最小系=C-029） | 空: L1-007「入力されていません。」/"No value found."（件名欄直下=mail.twig:123）／256: 画面文言の一次資料規定なし（DB層事象=L1-019） |
| 本文（tpl_data） | **任意**（required=false=L1-008。構文検証TwigLintのみ） | Form=TwigLint（長さ制約なし=md:199）／DB（履歴）mail_body=TEXT上限なし（MailHistory.php:56） | 空（エラーなし=C-020）／妥当Twig（送信可=C-025）／**不正Twig**（構文エラー=C-024。ace回避の直接POSTで注入） | 不正: L1-008「Twigのフォーマットが正しくありません。{{ error }}」/"Invalid Twig format. {{ error }}"（本文欄直下・{{ error }}は前方一致） |
| （参照表示）送信先情報 | 編集不可参照（md:82） | 表示元=当該受注の現行値（表示・送信の各時点で読取=md:224） | — | — |

送信マトリクス（complete時の書込/封筒。全てL1式）: 履歴subject=組立後・body=送信テキスト・send_date・
order_id=**当該送信対象受注（送信系はSENDABLE=900000311・改訂1(3)。非破壊参照ORDER=900000301は送信対象外）**・customer_id=受注の会員・base_info_id=ログイン管理者側（L1-014/016）／封筒
To=受注email・From=email01＋shop_name・Reply-To=email03・subject=`[shop_name] 入力件名`（観測確定項目=L1-015主張範囲）。
bcc=email01・returnPath=email04 は組立仕様として実在（MailService.php:601,603）だが**観測手段未確定=昇格対象外**（改訂1(1)・§9-6）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全30行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。ORDER=900000301（非破壊参照・送信対象外）・
**SENDABLE=900000311（使い捨て送信対象・帯@TBD-D5）**・TPL=900000601・DEFTPL=900000602・
MISSTPL=900000603。SUBJ_MAX=`255-(char_length(shop_name)+3)`（実行時にdb.tsで導出）。
送信系の履歴突合・削除は**実行前ID集合との差分（当該run新規行）限定**（§2）。
確認操作=「`button[name="mode"][value="confirm"]`（mail.twig:151）押下」・送信操作=「`button[name="mode"][value="complete"]`（mail_confirm.twig:130）押下」。
本文入力はaceエディタ実DOM操作の可否が要実機のため、検証系は**request契約（CSRFトークン取得→urlencoded POST・
`admin_order_mail[tpl_data]`直接指定）**を主経路とする（§6）。en行はD15前提。

### §4.1 bound対応候補行（27行=ja22＋-EN5。§8の71対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-15_admin_order_order_mail	E2E-M0515C-001	IT-15	権限	P1	未ログインでメール通知URL直接アクセス→ログイン画面へリダイレクト	未ログイン／SEED-M05-15-ORDER	—	1. GET /%eccube_admin_route%/order/900000301/mail	admin_login のログイン画面へリダイレクトされメール通知画面へ到達しない [L1:L1-M0515-001,L1-M0515-002; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-010	IT-25	表示	P1	編集画面の2カード構成・部品・初期状態（ja）	ログイン済(SEED-M01-ADMIN)／SEED-M05-15-ORDER／SEED-M05-15-TEMPLATE	—	1. GET /order/900000301/mail 2. 「メール送信先」カード（#mailTo）内の注文番号・購入金額・注文者・購入商品・対応状況の参照値を読む 3. 「メール内容」カード（#mailCreate）内の #template-change・#admin_order_mail_mail_subject・#editor・必須バッジを読む 4. テンプレ選択の選択状態・件名/本文の値を読む	見出し「メール送信先」「メール内容」・送信先カードに当該受注（id=900000301）の現行値（注文番号=Order.id・購入金額・注文者氏名/カナ/〒/住所・先頭商品名・対応状況バッジ）が参照表示・メール内容カードにテンプレ選択（プレースホルダ「選択してください」で未選択）＋件名（空・「必須」バッジ付き）＋本文エディタ#editor（空）＋「送信内容を確認」ボタンが表示される [L1:L1-M0515-003,L1-M0515-005,L1-M0515-009,L1-M0515-007; fixture:SEED-M05-15-ORDER@TBD-D5,SEED-M05-15-TEMPLATE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-010-EN	IT-25	表示	P2	カード見出し・プレースホルダ・必須バッジ（en）	ログイン済／SEED-M05-15-ORDER／locale=en	—	1. en UIで編集画面を開く 2. 見出し・プレースホルダ・バッジを読む	"Send to"・"Email Contents"・"Please select"・"Required" が表示される [L1:L1-M0515-003,L1-M0515-005]				
m05-15_admin_order_order_mail	E2E-M0515C-011	IT-12	ツールチップ	P2	送信先・テンプレート・件名の3ラベルにツールチップ（ja）	ログイン済／SEED-M05-15-ORDER	—	1. 編集画面で div[data-bs-toggle="tooltip"]（mail.twig:56,105,116）の title属性3個を読む	title属性=「注文者にメールが送信できます。」「メールのテンプレートを選択します。」「メールの件名を修正できます。」（各完全一致） [L1:L1-M0515-004]				
m05-15_admin_order_order_mail	E2E-M0515C-011-EN	IT-12	ツールチップ	P3	ツールチップ文言（en）	ログイン済／SEED-M05-15-ORDER／locale=en	—	同上	title属性="You can send emails to shoppers." "You can select an email template." "You can change the email title."（各完全一致） [L1:L1-M0515-004]				
m05-15_admin_order_order_mail	E2E-M0515C-012	IT-20	遷移	P1	受注編集画面「メールを作成」→当該受注のメール通知画面が開く	ログイン済／SEED-M05-15-ORDER	—	1. GET /order/900000301/edit 2. メール送信履歴ブロックの「メールを作成」リンク（edit.twig:1883）をクリック 3. URLと画面を読む	/%eccube_admin_route%/order/900000301/mail へ遷移し当該受注1件分のメール通知画面（2カード構成）が開く [L1:L1-M0515-022,L1-M0515-002,L1-M0515-003; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-013	IT-20	契約	P1	隠しmodeパラメータとフォームキー3種（非UI・DOM/request契約）	ログイン済／SEED-M05-15-ORDER	—	1. 編集画面のDOMで input#mode[type=hidden][name=mode]（mail.twig:92）を読む 2. select/input/textareaのname属性を読む 3. 確認画面でも #mode（mail_confirm.twig:83）を読む	#mode（hidden・name=mode）が編集・確認両画面に存在し、フォームキーが admin_order_mail[template]（select）・admin_order_mail[mail_subject]（text）・admin_order_mail[tpl_data]（textarea=複数行入力・非表示でaceが被さる）である [L1:L1-M0515-006,L1-M0515-027]				
m05-15_admin_order_order_mail	E2E-M0515C-014	IT-15	状態変化	P1	テンプレ選択(change)で件名読込・本文セット・同一画面再表示	ログイン済／SEED-M05-15-ORDER／SEED-M05-15-TEMPLATE	#template-change で id=900000601 を選択（JSが#mode=changeで自動送信=mail.twig:23-27）	1. 編集画面でテンプレを選択 2. POST応答後のURL・件名欄・本文欄（#admin_order_mail_tpl_data）を読む 3. db.tsで当該テンプレの mail_subject を読み比較	【主判定】同一編集画面（/order/900000301/mail）を再表示し件名欄=当該テンプレ行の mail_subject（DB現行値との恒等・エラー表示なし）・本文欄へ createBody結果がセットされる（テンプレ妥当=読込処理が実行される） [L1:L1-M0515-010,L1-M0515-023,L1-M0515-025; fixture:SEED-M05-15-TEMPLATE@TBD-D5,SEED-M05-15-ORDER@TBD-D5]。【要実機副観測・本文内容の正否は未判定と明示（改訂1(7)）】本文欄のbody値・画面上部エラー領域の有無・kernel.debug／strict_variables状態を**同時記録**する（createBodyのcontextはOrderのみでテンプレはdata/header/footer参照=BC-DRAFT-m05-15-2。差込全空か本文空かは環境依存のため本文空でも「正」と判定しない=記録のみ・§9-3）				
m05-15_admin_order_order_mail	E2E-M0515C-020	IT-25	確認遷移	P1	件名入力・本文空・テンプレ未選択で「送信内容を確認」→確認画面（編集不可）	ログイン済／SEED-M05-15-ORDER	件名=`E2E-<runid>-確認`・本文=空・テンプレ未選択	1. 編集画面で件名のみ入力し確認操作 2. 確認画面の件名・本文表示と入力可否を読む 3. 「送信」ボタン・#backリンクの存在を読む	確認画面へ進み、件名=入力値がテキスト再表示（hidden widget・編集用#editorは不存在=編集不可）・必須/本文/相関いずれのエラーも表示されない（件名入力済み＋本文空は妥当＋テンプレ任意）・「送信」（mode=complete）と「メール通知」戻るリンク#backが表示される [L1:L1-M0515-013,L1-M0515-007,L1-M0515-008,L1-M0515-009; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-021	IT-28	戻る	P2	確認画面の「メール通知」リンク（戻る）→編集画面再描画（JS mode=back）	ログイン済／SEED-M05-15-ORDER	件名=`E2E-<runid>-戻る`	1. C-020手順で確認画面へ 2. #back クリック直前に #mode 値の変化を観測（mail_confirm.twig:29-34） 3. 応答画面を読む	#backクリックで#modeに`back`がセットされフォーム送信され、編集画面（「送信内容を確認」ボタンのある画面）を再描画する（分岐処理なし・メール送信なし=mailcatcher無着信・履歴無し） [L1:L1-M0515-020; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-022	IT-28	離脱	P2	編集画面「受注登録」リンク→メール送信せず受注編集画面へ	ログイン済／SEED-M05-15-ORDER	—	1. 編集画面で「受注登録」リンク（mail.twig:145）をクリック 2. URLを読む 3. db.tsで dtb_mail_history（order_id=900000301）件数・mailcatcher着信を確認	/order/900000301/edit へ遷移し、メールは送信されない（mailcatcher無着信・履歴行増加なし） [L1:L1-M0515-021; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-023	IT-22	必須	P1	件名空で確認→必須エラー・確認へ進まない・履歴不変（ja）	ログイン済／SEED-M05-15-ORDER	件名=空・本文=空	1. 編集画面で件名空のまま確認操作（またはrequest契約でmode=confirm POST） 2. 応答画面と form_errors(form.mail_subject)（mail.twig:123）を読む 3. db.tsで履歴件数照会	確認画面へ進まず編集画面に留まり、件名欄直下に「入力されていません。」・送信されず dtb_mail_history に行が追加されない [L1:L1-M0515-007; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-023-EN	IT-22	必須	P2	件名必須エラー文言（en）	ログイン済／SEED-M05-15-ORDER／locale=en	同上	同上	"No value found."（件名欄直下） [L1:L1-M0515-007]				
m05-15_admin_order_order_mail	E2E-M0515C-024	IT-22	構文検証	P1	本文に不正Twigで確認→構文エラー・進まない（ja・request契約でace回避）	ログイン済／SEED-M05-15-ORDER	件名=`E2E-<runid>-twig`・admin_order_mail[tpl_data]=`{{ invalid`（request契約で直接注入）	1. 編集画面GETでCSRFトークン取得 2. mode=confirm で urlencoded POST（§6 request契約） 3. 応答HTMLの form_errors(form.tpl_data)（mail.twig:133）と#editorのis-invalidを読む 4. db.tsで履歴件数照会	確認画面へ進まず編集画面再表示・本文欄直下に「Twigのフォーマットが正しくありません。」で始まるエラー（{{ error }}部=Twig例外メッセージ・前方一致）・履歴行追加なし [L1:L1-M0515-008; fixture:SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-024-EN	IT-22	構文検証	P2	Twig構文エラー文言（en）	ログイン済／SEED-M05-15-ORDER／locale=en	同上	同上	"Invalid Twig format. " で始まるエラー（前方一致） [L1:L1-M0515-008]				
m05-15_admin_order_order_mail	E2E-M0515C-025	IT-26	送信	P1	確認→送信成功: フラッシュ・受注編集画面遷移・送信履歴INSERT内容（ja）	ログイン済／SEED-M05-15-SENDABLE	件名=`E2E-<runid>-送信`・本文=`E2E-<runid>-本文1行目\n2行目`（妥当Twig）	1. db.tsで実行前の dtb_mail_history（order_id=SENDABLE）ID集合S0idsを取得 2. C-020手順で確認画面へ（本文はrequest契約またはace書き戻しで注入） 3. 送信操作 4. 遷移先URLとフラッシュを読む 5. db.tsで**実行前後ID差分で特定した新規行**（差分=1行かつ mail_subject=組立後期待値と完全一致=run一意突合・改訂1(6)）の mail_subject/mail_body/send_date/customer_id/base_info_id を照会（afterEach: ID差分行のみ削除+mailcatcherクリア）	「メールを送信しました。」表示＋/order/900000311/edit へリダイレクト＋**ID差分=1行**の新規履歴: mail_subject=`[`+shop_name(DB現行値)+`] `+入力件名（組立後=送信メッセージ値）・mail_body=入力本文と完全一致（改行含む）・send_date=送信時点（ブラケット法T1≦send_date≦T2）・customer_id=当該受注の会員id・base_info_id=ログイン管理者のBaseInfo [L1:L1-M0515-014,L1-M0515-016; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-025-EN	IT-26	送信	P2	送信成功フラッシュ（en）	ログイン済／SEED-M05-15-SENDABLE／locale=en	同上	同上	"Email has been sent." 表示 [L1:L1-M0515-014]				
m05-15_admin_order_order_mail	E2E-M0515C-026	IT-23	封筒	P1	mailcatcherで宛先・差出人・返信先・件名組立・text本文を観測（BCC/Return-Pathは観測手段未確定=昇格対象外）	ログイン済／SEED-M05-15-SENDABLE	件名=`E2E-<runid>-封筒`・本文=`E2E-<runid>-envelope`	1. C-025同様に送信（ID差分突合） 2. mailcatcher API（UI :1080）で当該run件名のメッセージを一意取得 3. db.tsで dtb_order.email（id=SENDABLE）と dtb_base_info（現テナント行）の shop_name/email01/email03 を読む（afterEach同上）	【主判定＝観測確定項目のみ（改訂1(1)。項目名と一致）】To=当該受注のdtb_order.email（DB現行値との恒等）・From=email01＋表示名shop_name・Reply-To=email03・subject=`[`+shop_name+`] `+入力件名・本文=入力値のプレーンテキスト（HTMLパートなし）＝いずれもメッセージヘッダ/本文で観測 [L1:L1-M0515-015; fixture:SEED-M05-15-SENDABLE@TBD-D5]。【昇格対象外（主張しない・要確認=§9-6）】BCC（email01）・Return-Path（email04）は組立仕様として実装に存在（MailService.php:601,603逐語）するがmailcatcher上の観測手段（envelope表現形）が未確定のため本ケースの検証対象に含めない				
m05-15_admin_order_order_mail	E2E-M0515C-027	IT-26	送信	P1	テンプレ未選択のまま件名・本文直接入力で送信できる	ログイン済／SEED-M05-15-SENDABLE	テンプレ=未選択・件名=`E2E-<runid>-直接`・本文=`E2E-<runid>-direct`	1. テンプレを選択せず件名・本文を入力し確認→送信 2. フラッシュ・遷移・履歴（ID差分突合）を確認（afterEach同上）	テンプレ任意のため送信が成功し（「メールを送信しました。」＋受注編集画面へ）ID差分=1行の履歴が追加される [L1:L1-M0515-009,L1-M0515-014; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-028	IT-26	境界	P1	組立後件名255字（=DB上限ちょうど）で送信→履歴追加・文字長255	ログイン済／SEED-M05-15-SENDABLE	件名=runFill(SUBJ_MAX,mixed,"E2E-<runid>-")（SUBJ_MAX=255-(char_length(shop_name)+3)を実行時導出）・本文=`E2E-<runid>-max`	1. db.tsで shop_name を読みSUBJ_MAXを導出・実行前履歴ID集合を取得 2. 件名SUBJ_MAX字で確認→送信 3. db.tsで**ID差分で特定した新規行**（組立後件名一致で二重確認）の char_length(mail_subject) を照会（afterEach同上）	送信成功＋ID差分=1行の履歴追加＋char_length(mail_subject)=255（組立後がDB層255に収まる=バイト長でなく文字長で判定） [L1:L1-M0515-019,L1-M0515-016,L1-M0515-014; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-029	IT-26	境界	P2	件名1字（最小系・最小長制約なし）で送信成功	ログイン済／SEED-M05-15-SENDABLE	件名=`あ`（1字）・本文=空	1. 実行前履歴ID集合を取得 2. 件名1字で確認→送信 3. フラッシュ・履歴（**ID差分のみで特定**=1字件名はrunid prefixを持たないため）を確認（afterEach同上）	送信成功＋ID差分=1行の履歴追加: mail_subject=`[`+shop_name+`] あ`（最小長制約は存在しない=NotBlankのみ） [L1:L1-M0515-007,L1-M0515-019,L1-M0515-014; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-030	IT-26	境界	P1	組立後件名256字: メールは送信されるが履歴行はDB層挿入不能で追加されない	ログイン済／SEED-M05-15-SENDABLE	件名=runFill(SUBJ_MAX+1,ascii,"E2E-<runid>-")・本文=`E2E-<runid>-over`	1. 実行前履歴ID集合を取得・mailcatcherクリア 2. 件名SUBJ_MAX+1字で確認→送信操作 3. mailcatcher APIで当該run件名の着信を確認 4. db.tsで dtb_mail_history（order_id=SENDABLE）のID差分=0を照会（afterEach同上）	【主判定・一次資料確定（改訂1(5)）】**mailcatcherに当該runのメールが着信し（送信成功の肯定観測=送信→persist順序 MailController.php:148→161-162）、かつ dtb_mail_history のID差分=0（行が追加されない。Form層に長さ制約なし→組立後256字はDB層varchar(255)で挿入不能・暗黙切詰めなし）**＝「履歴なし」単独でSMTP失敗と区別不能になる偽陽性経路を閉塞 [L1:L1-M0515-019,L1-M0515-015; fixture:SEED-M05-15-SENDABLE@TBD-D5]。【要実機副観測】画面応答の形態（サーバエラー等・一次資料に画面文言の規定なし）				
m05-15_admin_order_order_mail	E2E-M0515C-031	IT-05	不変	P1	送信は受注台帳を更新しない（dtb_order S0同値・副作用は履歴追加のみ）	ログイン済／SEED-M05-15-SENDABLE	件名=`E2E-<runid>-台帳`・本文=`E2E-<runid>-ledger`	1. db.tsで dtb_order（id=SENDABLE）全列スナップショットS0と実行前履歴ID集合を取得 2. 確認→送信 3. db.tsで同行を再取得しS0と比較・履歴のID差分を確認（afterEach同上）	dtb_order 当該行がS0と完全同値（order_status_id・金額系・update_date含め不変）＋増分は dtb_mail_history のID差分=1行のみ [L1:L1-M0515-017,L1-M0515-014; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-032	IT-05	非永続	P2	テンプレ選択(change)は何も永続化しない（S0同値）	ログイン済／SEED-M05-15-ORDER／SEED-M05-15-TEMPLATE	#template-change で id=900000601 を選択	1. db.tsで dtb_mail_template（id=900000601）行と dtb_mail_history 件数のS0取得 2. change実行（C-014手順） 3. 再取得しS0比較	dtb_mail_template 行S0同値・dtb_mail_history 件数不変・mailcatcher無着信（選択は入力欄への反映のみ） [L1:L1-M0515-024; fixture:SEED-M05-15-TEMPLATE@TBD-D5,SEED-M05-15-ORDER@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-033	IT-26	送達失敗	P1	SMTP遮断中の送信→専用メッセージなし・成功扱い遷移・履歴は記録	ログイン済／SEED-M05-15-SENDABLE／mailcatcher SMTP停止（環境操作=要実機手段）	件名=`E2E-<runid>-遮断`・本文=`E2E-<runid>-transport`	1. 実行前履歴ID集合を取得 2. mailcatcher（:1025）を停止 3. 確認→送信 4. 応答画面のフラッシュ・遷移先を読む 5. db.tsで履歴（ID差分突合）照会 6. mailcatcher再開（afterEach同上）	画面に送達失敗の専用メッセージは出ず、成功フラッシュ「メールを送信しました。」＋受注編集画面へ遷移し、ID差分=1行の履歴も記録される（致命ログの観測=要実機副観測） [L1:L1-M0515-018,L1-M0515-014; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
m05-15_admin_order_order_mail	E2E-M0515C-034	IT-22	DB相関	P2	不存在テンプレidの直接POST(mode=change)→読込不成立・編集画面再表示	ログイン済／SEED-M05-15-ORDER	request契約: admin_order_mail[template]=900099999（dtb_mail_template不存在id）・mode=change	1. 編集画面GETでCSRFトークン取得 2. mode=change で urlencoded POST 3. 応答HTMLの件名欄・本文欄の値と form_errors(form.template)（mail.twig:111）領域を読む 4. db.tsで不存在を事前確認	【主判定】テンプレ読込処理へ進まず（件名・本文欄に読込値がセットされない）編集画面を再表示する [L1:L1-M0515-025; fixture:SEED-M05-15-ORDER@TBD-D5]。【要実機副観測】テンプレ欄のエラー文言（vendor既定「選択した値は無効です。」の解決=§9-5）				
m05-15_admin_order_order_mail	E2E-M0515C-036	IT-28	モーダル	P3	編集・確認画面はモーダル・トースト・確認ダイアログを表示しない	ログイン済／SEED-M05-15-SENDABLE（送信操作を含むため使い捨て受注）	件名=`E2E-<runid>-nodialog`	1. 編集画面のDOMでmodal/dialog/トースト要素の有無を確認 2. 確認操作・送信操作時にダイアログ介在なく送信されることを確認（履歴はID差分でafterEach削除）	編集・確認画面内にmodal/dialog/トースト要素が存在せず、確認・送信は確認ダイアログなしで実行される（過去メール閲覧モーダルは受注編集画面側=観測対象外） [L1:L1-M0515-026; fixture:SEED-M05-15-SENDABLE@TBD-D5]				
```

### §4.2 補完行（3行。**親test_idなし・母集合会計に算入しない**。理由=設計書に実在する仕様だが母集合71行の期待テキストに対応が存在しない〔不存在ID=md:322・既定テンプレ=md:208・読込失敗表示=md:143,209〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-15_admin_order_order_mail	E2E-M0515C-090	IT-13	不存在ID	P2	存在しない受注IDのメール通知はアクセス不可	ログイン済	id=999999999（dtb_order不存在をdb.tsで事前確認）	1. GET /order/999999999/mail 2. 応答を読む	受注が解決できずメール通知画面へアクセスできない（専用の利用者向け文言なし。HTTP404という観測形態は要実機副観測=§9-2） [L1:L1-M0515-002]（補完行・親test_idなし・設計書補完md:322）				
m05-15_admin_order_order_mail	E2E-M0515C-091	IT-15	既定テンプレ	P2	file_name空テンプレの選択→既定の受注メールテンプレで本文描画（BC-DRAFT-1）	ログイン済／SEED-M05-15-ORDER／SEED-M05-15-DEFAULT-TPL	#template-change で id=900000602（file_name=''）を選択	1. change実行 2. 本文欄と画面上部エラー領域を読む	【仕様どおりの期待（md:208）】既定の受注メールテンプレート（Mail/order.twig）で描画した本文が本文欄へセットされる [L1:L1-M0515-011; fixture:SEED-M05-15-DEFAULT-TPL@TBD-D5]。【BC-DRAFT-m05-15-1】repo実測でMail/order.twig未配置=LoaderError→MSG-004＋本文空となる可能性が高い。実行結果が仕様と乖離した場合は不具合候補として正式採番（補完行・親test_idなし）				
m05-15_admin_order_order_mail	E2E-M0515C-092	IT-15	読込失敗	P2	file_name欠落テンプレの選択→MSG-004表示・本文空のまま再描画	ログイン済／SEED-M05-15-ORDER／SEED-M05-15-MISSING-TPL	#template-change で id=900000603（file_name=Mail/__e2e_missing__.twig 不存在）を選択	1. change実行 2. 画面上部エラー領域と本文欄・件名欄を読む	画面上部のエラー表示領域に「選択されたテンプレートの本文が見つかりませんでした。同期が完了していない可能性があります。大変お手数ですが、1分ほど待ってから再度アクセスしてください。」（完全一致）・本文は空のまま同一編集画面を再描画（件名は選択テンプレのmail_subjectがセットされる=L1-010の読込は実行される） [L1:L1-M0515-012,L1-M0515-010; fixture:SEED-M05-15-MISSING-TPL@TBD-D5]（補完行・親test_idなし・設計書補完md:143,209）				
```

## §5 locale対応表

LS=1 claim: **L1-003・L1-004・L1-005・L1-007・L1-008・L1-012・L1-014 の7claim**。en文言は全てen一次資料逐語で
**確定済み（7/7=100%・ja翻訳ゼロ）**。-EN行は5行（C-010-EN=003+005／C-011-EN=004／C-023-EN=007／
C-024-EN=008／C-025-EN=014。全行§4.1に実体掲載）。
- messages.en.yaml:2377 `Send to`・2378 `Email Contents`・2306 `Email Notifications`・1749 `Required`・
  8 `Please select`・2375（MSG-004 en）・2383 `Email has been sent.`／tooltips en:3236-3238／
  validators.en.yaml:17 `No value found.`・31 `Invalid Twig format. {{ error }}`。
- **保留（claim単位・理由明記）**: L1-M0515-012（MSG-004）はen文言確定済みだが、観測ケースが**補完行C-092
  （親test_idなし）のみ**のため-EN観測行は作らない（補完行にlocale多重を作らず会計を単純に保つ。
  D15解決後・正式化時に-EN追加を判断）。L1-M0515-025のテンプレ不正値文言は**要実機**（vendor form catalog
  の解決未立証）のためLS表対象外（§9-5）。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page: 既存 `e2e/pages/admin/m05/m05_15_admin_order_order_mail.page.ts` を再利用可能（#order-mail-form・
  #mode・#template-change・#admin_order_mail_mail_subject・#editor・#admin_order_mail_tpl_data・確認/送信
  ボタン・#back等実装済み。同ファイルのtwig行番号注記は本書§1実測と一致確認済み。エラー描画セレクタ
  〔.invalid-feedback/.text-danger〕はpage自身が「要実機確認」と注記=§9-7）。
- spec: 候補の追加ケースspecは**未実装・実走なし**。期待値は `o("L1-M0515-xxx")`（L1解決器）経由・リテラル
  直書き禁止。db.ts（`e2e/helpers/db.ts`）でDB層照会（履歴・S0スナップショット・shop_name/SUBJ_MAX導出・
  受注email読取）。境界値は `runFill(n, repertoire, prefix)`。
- **request契約（本機能で使用）**: 受注編集（m05-16）と異なり本フォームは3フィールド＋`_token`のみで
  再現コストが低く、**aceエディタ実DOM入力の不確実性を回避**できるため、本文注入系（C-024・C-025の本文・
  C-034）は「編集画面GET→`input[name="admin_order_mail[_token]"]`取得→同一contextで
  `POST /order/{id}/mail`（urlencoded・`mode`＋`admin_order_mail[template]/[mail_subject]/[tpl_data]`）」を
  主経路とする（m09-01先例と同型）。UI経路（ace書き戻し=mail.twig:41-43）は要実機副観測。
- **mailcatcher観測**: helper未実装（`e2e/helpers/`にはdb/oracle/totpのみ=実測）。実装waveで
  `GET http://localhost:1080/messages`・`GET /messages/{id}.json`・`DELETE /messages` の薄いhelperを追加する。
  **観測を確定した項目=メッセージヘッダ/本文（From/To/Reply-To/Subject/text）のみ**。BCC・Return-Pathの
  観測（envelope表現形）は**helper未実装かつ手段未確定=昇格対象外・要確認**（改訂1(1)。§9-6）。
  送信隔離前提はseed README:26-28。
- 送信系afterEach（改訂1(4)）: **実行前に取得した dtb_mail_history（order_id=SENDABLE）ID集合との差分
  （当該runの新規作成行）のみDELETE**（order_id全削除は既存履歴も消しS0非同値のため禁止）＋mailcatcherクリア＋
  dtb_order当該行S0同値検査。履歴のrun一意突合も同じID差分を主とし組立後件名一致を併用（「最新行」読取禁止=
  改訂1(6)）。件名`E2E-<runid>-`prefixは残骸検出の副手段。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（grep実測。隔離ガード自体のリテラル〔oracle.ts:17,19〕を除く。ガードは `_drafts`・パス区切り・`..` を
   含むfileKeyの解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（ls実測: 直下は`m09_01_oracle.json`
   のみ・草案は `_drafts/` のみ。git statusで正式物の未変更を確認）。
3. 本md・oracle草案jsonの出力先はともに `_drafts/` 配下のみ（§7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,010,011,012,020（＋EN） | Playwright | GUI/HTTP | 認証リダイレクト・表示・遷移・属性読取 |
| C-013 | 非UI（DOM読取＋request契約） | GUI(DOM)/HTTP | 隠しmode・フォームキー |
| C-014,032,091,092 | Playwright＋db.ts | GUI+DB | change系（非破壊=永続化なし）。本文実値は要実機副観測 |
| C-021,022 | Playwright＋db.ts＋mailcatcher | GUI+DB+SMTP | 無送信の否定観測（着信0・履歴0） |
| C-023,024,034（＋EN） | 非UI（request契約）＋Playwright | HTTP+GUI+DB | 検証失敗系。aceはrequest契約で回避 |
| C-025,026,027,028,029,030,031,033,036（＋EN） | Playwright＋db.ts＋mailcatcher→**破壊系（履歴INSERT）・afterEach必須（ID差分限定削除）** | GUI+DB+SMTP | 送信系=**SEED-M05-15-SENDABLE（使い捨て）**・履歴突合はID差分。C-030は応答形態のみ要実機（着信+ID差分0が主判定）・C-033はSMTP停止の環境操作=Playwright+手動確認 |
| C-090 | Playwright | HTTP | 404観測形態は要実機副観測 |
| -EN 5行 | 実行保留（D15） | GUI | 文言確定100%・実行のみ保留 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝71↔候補の期待テキスト突合が本文内で完結する**。

### 集計（71 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **66** | 下表 |
| **TBD** | **0** | — |
| **excluded** | **5** | EX-B 相関バリ4（012〜015。OrderMailType.php:44-64実測=constraintはNotBlank/TwigLintの単項目のみ・相関constraint不存在・md本文に相関規定なし）／EX-D 1（064。期待テキスト自体が「要ソース確認であること。」=検証不能プレースホルダ＋出所のM05-15-MSG-002「削除しました」はテンプレマスタ削除=md:37スコープ外の棚卸混入=DOC-DRAFT-m05-15-1） |
| 合計 | **71** | 欠落0・理由なし重複0 |

- 候補ケース行総数**30**（§4.1 bound対応27＝ja22＋-EN5／§4.2 補完3）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）: DB相関（016/017）は**excludedにしない**——テンプレ選択は
  EntityTypeでDB（dtb_mail_template）に対して解決される実在のDB相関検証（MailController.php:97・md:106）の
  ため、017（エラーあり）=C-034・016（エラーなし継続）=C-014へbind（m05-16のEX-Cと結論が異なるのは
  検証の実在性が異なるため=偽陰性回避）。最大長/最小長系（024〜027・036〜039）は件名にForm長さ制約が
  不存在（L1-007）のため、**組立後件名のDB層255境界**（L1-019）を「最大長」の実在検証として採用
  （255=C-028・256=C-030・1字=C-029・0字（空）=NotBlank=C-023）。

### 71対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | テンプレートのTwigファイルを当該受注で描画した文字列であること | bound | C-014 |
| 002 | 送信履歴=件名・本文・送信日時・宛先会員・受注を記録した行であること | bound | C-025 |
| 003 | 件名・本文を編集不可で再表示し送信前に確認させる画面であること | bound | C-020 |
| 004 | 同一URLへのPOSTで処理を分岐させる隠しパラメータであること | bound | C-013 |
| 005 | 当該受注1件分のメール通知画面が開くこと | bound | C-012 |
| 006 | 選択テンプレの件名と描画本文を読み込み直し同一画面を再表示すること | bound | C-014 (shared) |
| 007 | 検証成功なら確認画面へ進むこと | bound | C-020 (shared) |
| 008 | 送信・履歴記録・成功メッセージ・受注編集画面遷移 | bound | C-025 (shared) |
| 009 | 必須バリでエラー表示・完了しない | bound | C-023 |
| 010 | 必須バリでエラー表示されず継続できる | bound | C-020 (shared・件名入力済み) |
| 011 | 管理画面の共通ルールでアクセスできない | bound | C-001 |
| 012〜015 | 相関バリでエラーあり/なし（両極） | **excluded** EX-B | — |
| 016 | DB相関バリでエラーなし継続 | bound | C-014 (shared・実在テンプレ=妥当値) |
| 017 | DB相関バリでエラーあり完了しない | bound | C-034 |
| 018 | 送信先・テンプレ・件名ラベルにツールチップ表示 | bound | C-011(+EN) |
| 019 | 対象レコードが追加されること（前提「Twig不正」はノイズ=§10） | bound | C-025 (shared) |
| 020 | 追加され**ない**こと（件名必須エラー） | bound | C-023 (shared・履歴0) |
| 021 | 追加されること（メールを送信しました） | bound | C-025 (shared) |
| 022 | 画面には専用メッセージを出さないこと（送達失敗） | bound | C-033 |
| 023 | 追加されること（MSG-003） | bound | C-025 (shared) |
| 024 | 追加されること（最大長） | bound | C-028 |
| 025 | 追加され**ない**こと（最大長+1） | bound | C-030 |
| 026 | 追加されること（最小長） | bound | C-029 |
| 027 | 追加され**ない**こと（最小長-1=空→必須） | bound | C-023 (shared・§10) |
| 028 | 追加されること（送信件名の組み立て） | bound | C-025,C-026 (shared) |
| 029 | 実行結果の対象レコードが追加されること（送信先） | bound | C-025,C-026 (shared) |
| 030 | 差出人=店舗基本情報の送信元アドレスとショップ名であること | bound | C-026 |
| 031 | 更新内容の値が変更されること（前提「受注台帳」はノイズ=§10。書込の実在=履歴追加） | bound | C-025 (shared) |
| 032 | 変更され**ない**こと（テンプレート=選択の非永続） | bound | C-032 |
| 033 | 変更されること（件名） | bound | C-025 (shared・mail_subject記録) |
| 034 | フォームキー tpl_data（複数行入力であること | bound | C-013 (shared) |
| 035 | 変更されること（テンプレ未選択で直接入力し確認・送信） | bound | C-027 |
| 036 | 変更されること（最大長） | bound | C-028 (shared) |
| 037 | 変更され**ない**こと（最大長+1） | bound | C-030 (shared) |
| 038 | 変更されること（最小長） | bound | C-029 (shared) |
| 039 | 変更され**ない**こと（最小長-1=空→必須） | bound | C-023 (shared・§10) |
| 040 | 変更されること（送信履歴の宛先会員=customer_id記録） | bound | C-025 (shared) |
| 041 | 実行結果の値が変更されること（本文=mail_body記録） | bound | C-025 (shared) |
| 042 | 送信履歴=記録した行であること | bound | C-025 (shared) |
| 043 | 確認画面であること | bound | C-020 (shared) |
| 044 | モード=隠しパラメータであること | bound | C-013 (shared) |
| 045 | メール通知画面が開くこと | bound | C-012 (shared) |
| 046 | 読み込み直し同一画面再表示 | bound | C-014 (shared) |
| 047 | 明示的な分岐処理は無く編集画面の初期描画に戻ること | bound | C-021 |
| 048 | メールを送信せず受注編集画面へ戻ること | bound | C-022 |
| 049 | 件名でエラーが表示され完了しないこと | bound | C-023 (shared) |
| 050 | 件名でエラーが表示されず継続できること（入力列「未入力」はノイズ=§10） | bound | C-020 (shared・件名入力済み) |
| 051 | カード「メール内容」にテンプレ選択・件名(必須バッジ)・本文エディタ表示 | bound | C-010 |
| 052 | 本文でエラーが表示され完了しないこと（空はエラーでない→不正Twigが実在の肯定側=§10） | bound | C-024 |
| 053 | 本文でエラーが表示されず継続できること（本文空でも継続=任意） | bound | C-020 (shared) |
| 054 | #back押下で隠しモードをbackにセットしフォーム送信すること | bound | C-021 (shared) |
| 055 | モーダル・トースト・確認ダイアログを表示しないこと | bound | C-036 |
| 056 | 本文欄の構文検証によるものであること | bound | C-024 (shared) |
| 057 | 件名は必須であること | bound | C-010,C-023 (shared) |
| 058 | 遷移先の受注編集画面の成功フラッシュ領域であること | bound | C-025 (shared) |
| 059 | 画面には専用メッセージを出さないこと | bound | C-033 (shared) |
| 060 | 受注情報編集画面に遷移すること（MSG-003） | bound | C-025 (shared) |
| 061 | 送信せずメール通知画面に留まる（MSG-005=件名必須） | bound | C-023 (shared) |
| 062 | 送信せずメール通知画面に留まる（MSG-006=Twig構文） | bound | C-024 (shared) |
| 063 | エラーが表示されず継続できること（前提MSG-001はスコープ外混入ノイズ=§10） | bound | C-020 (shared) |
| 064 | 「要ソース確認であること。」（MSG-002=テンプレ削除・スコープ外） | **excluded** EX-D | —（DOC-DRAFT-m05-15-1） |
| 065 | エラーが表示されず継続できること（送信件名の組み立て） | bound | C-025,C-026 (shared) |
| 066 | 当該受注のメールアドレス宛に送るであること | bound | C-026 |
| 067 | 差出人=店舗基本情報の送信元アドレスとショップ名であること | bound | C-026 (shared) |
| 068 | 受注ステータス・在庫・金額などを更新しないこと | bound | C-031 |
| 069 | フォームキー templateであること | bound | C-013 (shared) |
| 070 | フォームキー mail_subjectであること | bound | C-013 (shared) |
| 071 | フォームキー tpl_data（複数行入力であること | bound | C-013 (shared) |

`func_scope_check` 判定: 親71/71会計済み・欠落0・理由なし重複0・補完3行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded・BC/DOC-DRAFT（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **BC-DRAFT-m05-15-1**: 既定テンプレ `Mail/order.twig` 未配置候補 | controller逐語（MailController.php:104）＋md:208は既定描画を規定。repo実測（find）では `Mail/order.twig` は不存在（`Mail/Mall/order.twig`・`Mail/Tenant/{1,2,3}/order.twig` のみ・`app/template/default/Mail/` 不存在・twig.yaml:5-8のpaths確認）→ file_name空はLoaderError=MSG-004＋本文空になる見込み。C-091は仕様どおりの期待を掲載し実行時乖離で確認判定（正式採番は候補確定時=ROLLOUT §7フロー） |
| 2 | 不存在受注IDの観測形態 | md:322は「アクセスできない・専用文言なし」まで。HTTP404という具体形は一次資料に逐語なし（既存spec E2E-M05-15-061は404を主張するが**実装からの写し**の可能性があり期待の正にしない）→C-090の主判定=アクセス不可・404=要実機副観測 |
| 3 | **BC-DRAFT-m05-15-2**: change時の本文描画結果の実値 | createBodyのcontextは`Order`のみ（MailController.php:196-198）・order_cvs.twig等は`data`/`header`/`footer`を参照（order_cvs.twig冒頭逐語）・`strict_variables: '%kernel.debug%'`（twig.yaml:16）→ 差込全空描画か例外→本文空（catch \Exception・画面エラーなし=MailController.php:202-204）かは環境依存。C-014主判定は「件名恒等＋本文欄セット＋同一画面」で自立・本文実値は要実機 |
| 4 | テンプレ選択肢のテナント絞込 | OrderMailType.php:47-48のquery_builderは`orderBy(mt.id)`のみ（baseInfo/isAutoSend条件なし。設定画面用MailType.php:52-56とは異なる）。実環境（base_info_id=2テナント）で他テナント行が選択肢に出るか=**要実機**（SEEDはbase_info_id=2で用意済み。絞込が無い場合はテナント越境の観点=別途起票判断） |
| 5 | テンプレ不正値のエラー文言 | vendor form catalog既定「選択した値は無効です。」（vendor/symfony/form validators.ja.xlf:26-27）だがinvalid_messageの解決経路未立証=要実機副観測（C-034主判定は読込不成立で自立） |
| 6 | BCC・Return-Pathの観測（改訂1(1)） | 組立仕様としての実在は逐語確定（MailService.php:601,603）。ただしmailcatcher上の観測手段（BCCはヘッダに現れずenvelope受信者側・Return-Pathはenvelope sender側の表現形）が**未確定＝観測は未実装・要確認として昇格対象外**（C-026の主判定・項目名からも除外済み。L1-015は観測可能範囲に限定）。手段確定後に観測ケースへ昇格を判断 |
| 7 | エラー描画セレクタ（.invalid-feedback等）・フラッシュセレクタ（.alert-success/.alert-danger） | form theme（bootstrap_4_horizontal_layout=mail.twig:18）依存。page objectも「要実機確認」注記済み。文言オラクルは確定・セレクタのみ要実機 |
| 8 | C-030の画面応答形態 | 組立後256字はDB層で履歴挿入不能（挿入されないこと自体は列定義から確定=L1-019）。**mailcatcher着信（送信成功の肯定観測）は改訂1(5)で主判定へ昇格済み**（送信→persist順序=MailController.php:148→161-162）＝要実機に残るのはflush例外時の画面応答形態（500等・一次資料に規定なし）のみ |
| 9 | C-033のSMTP遮断手段・致命ログ観測 | mailcatcher停止の環境操作がrunnerから可能か＋log_critical（MailService.php:620）の観測手段=要実機（Playwright+手動確認区分） |
| 10 | ace実DOM入力 | 本文注入はrequest契約で回避（§6）。UI経路（editor.setValue→書き戻し=mail.twig:41-43）は要実機 |
| 11 | 管理画面のenロケール切替口 | 要D15（-EN 5行の実行前提。W0実測を継承） |
| 12 | manifest_sha1（fixture_version確定）＋**SEED-M05-15-SENDABLEのSQL未整備** | D5後（現状 `@TBD-D5`）。ORDER/TEMPLATE/DEFAULT-TPL/MISSING-TPLのSQLは`e2e/seed/sets/m05/`に実在。**SENDABLEはseed README:83の定義（使い捨て受注・UI合成扱い）のみでSQL未整備**（coverage tsvのmissing_seed_refsにも記載=実測）→同規約の固定IDバンド（900000311帯）でのSQLセット化と行セット完全定義をD5 manifest契約で確定（本書はセット設計のみ・捏造しない） |
| **DOC-DRAFT-m05-15-1** | 設計書の自動棚卸第2表（M05-15-MSG-001「保存しました」/MSG-002「削除しました」=テンプレマスタ保存・削除時の文言。md:176-177） | md:37「メールテンプレートマスタ自体の登録・編集・削除…は本書では扱わない」と**自己矛盾**（スコープ外機能のメッセージ混入）。064のEX-D根拠。設計書側の訂正候補として起票対象 |
| excluded | 012〜015（相関バリ4） | OrderMailType.php:44-64逐語=constraintは template(なし)・mail_subject(NotBlank)・tpl_data(TwigLint) の**単項目のみ**・相関/Callback constraint不存在＋md本文（バリデーション表:274-278）に相関規定なし → 対応する検証が実在せず過剰生成（m09-01/m05-16 EX-Bの先例と同型）。偽陰性でないことの傍証: 単項目検証の両極は009/010/049〜053でbound済み・DB相関（016/017）は実在検証としてboundへ |
| excluded | 064（EX-D） | 期待テキスト「要ソース確認であること。」=生成器が期待を確定できなかったプレースホルダ（検証可能な期待が存在しない）＋出所メッセージMSG-002はスコープ外（上記DOC-DRAFT）。**実在仕様の除外ではない**（削除操作は本機能に不存在=MailController.php:70-190にdelete分岐なし・md:37） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提/入力列にメッセージID・エッジケース名が漂着し期待列と大きくずれる）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009/049（件名エラーあり）vs 010/050（件名エラーなし） | 肯定側=NotBlank実在（C-023）／否定側=件名**入力済み**の正常継続（C-020）。050の入力列「未入力にする」は期待極性（エラーなし継続）と矛盾するため**シナリオ語を棄却**（未入力でエラーなしはOrderMailType.php:50-55と矛盾する期待の捏造になる） | OrderMailType.php:50-55・md:198,211 |
| 052（本文エラーあり）vs 053（本文エラーなし） | 本文**空はエラーにならない**（TwigLintValidator.php:38-41・required:false）ため、052の「未入力にする」を棄却し実在の肯定側=**不正Twig構文**（C-024）へbind。053=本文空でも継続（C-020） | OrderMailType.php:56-63・TwigLintValidator.php:38-53・md:199,210 |
| 019〜029・031〜041の「追加/変更される・されない」 | 期待テキスト極性を正としてbind。肯定→C-025/026/027/028/029、否定→C-023/030/032。前提列のラベル（019「Twig不正」・021「メールを送信しました」・036「ファイルが見つからない」・037「不正Twig」・038「件名が空」・039「メールアドレスが無い」等）は入力列（最大長/最小長±1）とも期待列とも整合しないため**全て棄却の記録**を残す | md:187-191,198-213 |
| 024/025/036/037（最大長±1）・026/027/038/039（最小長±1） | 件名にForm長さ制約が**不存在**（L1-007）のため「最大長」を**組立後件名のDB層255境界**（L1-019・MailHistory.php:53）へ写像（255=C-028・256=C-030）。「最小長」=1字（C-029）・「最小長-1」=0字=空→必須検証（C-023）へ写像（空で「追加されない」は必須検証経由でのみ一次資料と整合） | MailHistory.php:53-57・OrderMailType.php:50-55・md:198,201 |
| 012〜015（相関の両極） | 両極とも対応constraint不存在→excluded（極性以前に検証自体が不存在） | OrderMailType.php:44-64・md:274-278 |
| 016/017（DB相関の両極） | **実在**（EntityTypeのDB解決＋`$form->get('template')->isValid()`ゲート=md:106）→boundへ（017=不正id C-034／016=妥当値 C-014）。m05-16のEX-C（不存在→excluded）と結論が異なる理由=検証の実在性が異なる | MailController.php:97・md:106 |
| 031/068（受注台帳の両極） | 068=「更新しない」が本機能の実仕様（md:191・C-031のS0同値）。031の期待「変更されること」は**書込の実在**（履歴追加=本機能唯一の書込）へbind（shared C-025）。受注行が変更される期待を捏造しない | md:191,27 |
| 022/059（「専用メッセージを出さない」=否定期待） | 否定は実在仕様（md:157,321）で観測契約可能（成功フラッシュ＋遷移＋履歴という**肯定観測との対**で判定）→bound C-033（TBDにしない） | MailService.php:616-624・md:157 |
| 055（モーダル等なし=universal negative） | 観測範囲を「編集・確認画面内＋確認/送信操作時」に**限定**して観測契約化（md:88が対象画面を明示規定）→bound C-036 | md:88,41 |
| 063/064（MSG-001/002=スコープ外混入） | 063は期待テキストが汎用（エラーなし継続）で正常系に成立→bound C-020。064は期待自体が「要ソース確認」=検証不能→EX-D（DOC-DRAFT-m05-15-1） | md:37,176-177 |

**codex敵対レビュー: 未実施（R0）**。本表はレビュー前の自己検査記録であり、実効性はcodexレビューで検証される。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース 13（MailController・OrderMailType・MailTemplateType・
  MasterType・MailType〔対比〕・TwigLint・TwigLintValidator・MailService・MailHistory・MailTemplate・Order・
  BaseInfo・mail.twig/mail_confirm.twig/edit.twig）／locale 4（messages ja/en・validators ja/en）＋vendor form
  xlf 1／config 3（security.yaml・twig.yaml・eccube.yaml）／母集合・台帳 2（all_it_cases・fid_kubun）／
  統治・見本 3（ROLLOUT・m05-16草案・m09-01草案§6）／既存実装・SEED 8（spec・page・e2e_cases.md・
  seed README・seed.config・SEED-M05-15-{ORDER,TEMPLATE,DEFAULT-TPL,MISSING-TPL}.sql）＝**計35ファイル**。
- L1 claim数: **27確定・TBD 0**。候補ケース行30（ja22・EN5・補完3）。file:line claim引用 約80箇所。
- 難所（係数悪化要因）: (1) メール封筒の観測がGUI外（mailcatcher）＝helper新設前提と表現形の要実機切り分け
  (2) 既定テンプレ未配置・描画context乖離の2つのBC-DRAFT発見（find/grepでの不在証明）
  (3) 件名の「最大長」が**Form層に存在しない**→組立後DB255境界への写像判断（shop_name長の実行時導出）
  (4) 母集合の前提列汚染が過去最大級（メッセージID・エッジケース名の漂着）＝極性裁定10系統
  (5) 送信系の破壊性（履歴INSERT）とafterEach設計・送信→persist順序の把握。
- 楽だった点（再利用効果): SEED 5セットとpage objectが既に実在し行番号照合のみで再利用可・
  request契約/runFill/S0スナップショット/隔離lintはW0/W1/B0既存の型を流用。
