# B0候補: m09-09 メンテナンス管理 — 実行可能グレード候補（母集合56全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正**（Blocker①=026/027/028を逆極性ケースにbind／Blocker②=EX-D 032/039の委譲先未実証／
> Major③=前面503二層の過大主張／Major④=C-001メニュー非表示の引用誤り／Major⑤=C-013「I/O失敗ならファイル状態
> 不変」の断定が捏造／Major⑥=§4行数自己矛盾）→**R1是正版（本版）**。
> R1是正: **(1) 026/027/028をboundから外しTBD（母集合矛盾・未解決）へ移動**（設計書+実装が一致して示す実際の
> 挙動と母集合の期待テキストの極性が逆であり、母集合行を改変せず「D6裁定待ち・未解決」として正直に分離。
> 029/038は前提ラベルを明示的にノイズとして無視した上でC-007/C-008へ正方向bindを維持）。
> **(2) EX-D 032/039の委譲先を実引きで再検証**（自動メンテナンス＝プラグイン管理の委譲先は設計書・test_id
> ともに**不存在**を確認＝032は「委譲先不存在・本機能では直接検証不能」の限定理由へ書き換え。権限管理の
> 委譲先は`functions/pf-eccube3/m11-03_admin_system_setting_setting_system_authority.md`＋
> `IT-M11-03-*`87行が実在するが、ec-cube-enterprise側は未文書化・87行中「コンテンツ管理配下」を具体的に
> 検証する行は確認できず＝039も「委譲先は部分的に実在するが対象範囲の直接的裏付けは不足」と限定し、
> 「偽陰性なし」と言い切らない）。
> **(3) 前面503二層の説明を限定**（「`.maintenance`存在のみで発火」→実際は存在+非admin path+Cookie不一致の
> 3条件の合致が必要、「管理画面プレフィックス配下は常時到達」→実際は「503振替の対象外」に限定＝index.php層の
> 判定を素通りするだけで、各ルート個別の認証・条件（例: `admin_content_maintenance`自体のenv gate）は独立に
> 適用される、と是正）。
> **(4) C-001のメニュー非表示根拠を差し替え**（誤引用L1-002/L1-018→正しくは`eccube_nav.yaml:196-199`の
> `condition: { eccube_param: 'eccube_allow_maintenance_mode', expect: true }`＝新設L1-M0909-024）。
> **(5) C-013の「ファイル状態不変」断定を撤回**（`SystemService::enableMaintenance`/`disableMaintenanceNow`は
> `file_put_contents`/`unlink`を例外・戻り値確認なしで呼ぶのみ=SS:148-155,168-181実引き。失敗時の実際の挙動
> はdev環境のErrorHandler有無等に依存し一次資料から断定不能＝「不変」を期待値と主張せず、C-013は要実機
> （誘発手段未確立）かつ結果polarityを断定しない開放観測へ変更。母集合035はboundから**partial**へ降格）。
> **(6) §4の行数を実体に合わせて整合**（§4.1=16行＋§4.2補完=1行＋§4.3 -EN=3行＝**全20行**。
> 「全21行」「候補ケース行総数17」等の誤記を是正）。
> **codexレビュー: R2再監査=5/6閉塞・残3点は小修正**→**R2是正版（本版）**。
> R2是正: **(1) TBD3件の内訳を分離**（026・027=**逆極性TBD**〔設計書+実装が一致して示す実際の挙動と母集合の
> 期待テキストが確認可能な形で正反対〕／028=**polarity不明TBD**〔`file_put_contents`/`unlink`が例外・戻り値
> 確認なしで呼ばれるため「変更される」を支持することも否定することも一次資料からできない未規定＝逆方向が
> 確認されたわけではない〕。§9.3・§8対応表・§10 C4いずれも028を026/027と別分類で記述するよう是正。
> TBD件数=3のまま変更なし）。**(2) Cookie名の現物不一致を是正**（C-005/C-007の手順記載`maintenanceToken`
> →実装定数`SystemService::MAINTENANCE_TOKEN_KEY`＝`maintenance_token`に統一。html/index.phpの逐語quote内
> ローカル変数`$maintenanceToken`はコード引用そのものにつき不変）。**(3) §8機械集計段落の重複記載を統合**
> （func_scope_check判定と56対応表の機械集計が同じpartial/TBD件数を二重に書いていた冗長を除去し、
> 機械集計を本文中の唯一の集計箇所とした。会計数値は不変）。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-08_admin_content_content_cache_executable_draft.md`（候補確定・env切替ゲート／
> `.maintenance`破壊系の落とし方の正典）／`m09-05_admin_content_content_css_executable_draft.md`
> （候補確定・fs.ts再利用契約§6.2＝絶対パス・docker exec・破壊系S0/afterEach・親dir権限記録復元の正典）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-09_admin_content_content_maintenance_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）には書かない**。
>
> **本機能の性質（最重要・一次資料で現物確認済み）**: `MaintenanceController::index`（GET/POST
> `/%eccube_admin_route%/content/maintenance`、ルートname `admin_content_maintenance`）には
> `condition: "service('controller_condition_service').isMaintenanceModeAllowed()"` が付く
> （MC:37）。`ControllerConditionService::isMaintenanceModeAllowed()`は
> `eccube_allow_maintenance_mode === true`を返すのみ（CCS:26-29）。**実測（2026-07-24・
> `docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODE`）
> ＝ Real "0" / Processed false**（`.env:62`が`ECCUBE_ALLOW_MAINTENANCE_MODE=0`のため既定で偽）。
> Symfonyのルーティング条件はコントローラ到達前に評価されるため、**現況（既定env）ではGET/POSTとも
> 本画面のルート自体に到達できない**（m09-08キャッシュ管理の調査結果を本機能でも独立に実測して再確認）。
> 同一条件は解除エンドポイント `admin_disable_maintenance`（MC:82）にも付く。
>
> **ただし**、公開側フロントの503振り替え（`html/index.php:74-93`、Symfony Kernel起動**前**の
> 素のPHP判定）と、応答へのCookie付与・破棄（`MaintenanceListener::onResponse`、KernelEvents::RESPONSE
> 購読）は、**いずれも`eccube_allow_maintenance_mode`を一切参照しない**（実引き=index.php:74-93と
> MaintenanceListener.php:38-56の全文にこの設定キーへの参照0件）。**ただし発火条件は`.maintenance`存在の
> みではなく、（i）ファイル存在・（ii）リクエストパスが管理画面プレフィックス配下でない・（iii）Cookie
> `maintenance_token`が目印ファイル内トークンと不一致または欠落、の3条件の合致であり（idx:76-93実引き）、
> 管理画面プレフィックス配下は`html/index.php`のこの503判定を**素通りするだけ**（「503振替の対象外」）で、
> 各ルート個別の認証・条件（例: `admin_content_maintenance`自体は既定envで`isMaintenanceModeAllowed()`
> 不成立のため到達不能のまま）は独立に適用される＝「常時到達可能」ではない**。したがって、
> `.maintenance`ファイルをfs.ts（docker exec）で直接配置・削除すれば、**env切替なしで**公開側503振り替え・
> Cookie付与破棄と、admin配下がこの503判定の対象外であることを検証できる。**本画面（管理画面のトグル
> ボタン操作そのもの）に限りenv切替=要実機**、**公開側フロントの状態反映はenv切替不要**という二層構造を
> 正直に分離する（捏造で「全部動く」にも「全部env切替待ち」にもしない。ただし対象外＝到達保証ではない
> 点を過大主張しない）。
>
> **破壊系規律**: `.maintenance`の生成・削除は破壊系。S0＝PRE状態（実測=**不存在**）をスナップショットし
> afterEachで復元（存在/不存在・内容・権限）。fs.tsの`exists`/`readFile`/`statOwnerMode`等をm09-05/m09-08の
> 契約から流用。serial必須（フロント全体をメンテ画面にする副作用があるため共有ステージング厳禁）。
> SEED値を期待の正にしない（三段参照）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md`（330行・
  最終コミット ec17cd0・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（本草案作成時点のHEADと一致・実測）／
  symfony/framework-bundle `^6.4 || ^7.0`（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁・2026-07-24）: MaintenanceController.php=`fd3a256a7970`／
  SystemService.php=`bf4959149532`／ControllerConditionService.php=`1475f76e8977`／
  MaintenanceListener.php=`ad5a8bcc4d4e`／maintenance.twig=`c66c2f40e655`／html/index.php=`3f35a18a54ac`／
  html/maintenance.php=`4ee19f8ac3c7`／messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／
  eccube.yaml=`15ea9fd66c6f`／security.yaml=`35e8ff7ec021`／.env=`82fef6e96d55`／
  AbstractController.php=`1a67393cd162`／eccube_nav.yaml=`4ed1edc7b1b4`（R1是正で追加・Major④）。
- fid_kubun.tsv（D1）: `M09-09｜標準｜standard-src+design｜区分不明=0`（fid_kubun.tsv:321実引き確認済み:
  `M09-09	m09-09_admin_content_content_maintenance	メンテナンス管理	対象	標準	…	standard-src+design	0`）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`・m09-08と同一baseline）M09-09全**56行**
  （IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-001〜056。col1完全一致grepで56行=機械確認済み）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環。多くの行で
  前提ラベルと期待テキストの対応関係が薄い・時に矛盾する＝§10 C4で個別記録）。bindは各行の
  **「期待結果」実テキスト**で判定（§8に全56行の期待要旨併記）。

パス表記: MC=`src/Eccube/Controller/Admin/Content/MaintenanceController.php`／
SS=`src/Eccube/Service/SystemService.php`／CCS=`src/Eccube/Service/ControllerConditionService.php`／
ML=`src/Eccube/EventListener/MaintenanceListener.php`／
twig=`src/Eccube/Resource/template/admin/Content/maintenance.twig`／
idx=`html/index.php`／maint=`html/maintenance.php`（静的PHP・停止画面）／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／
eyml=`app/config/eccube/packages/eccube.yaml`／sec=`app/config/eccube/packages/security.yaml`／
AC=`src/Eccube/Controller/AbstractController.php`／SU=`src/Eccube/Util/StringUtil.php`／
env=`.env`／nav=`app/config/eccube/packages/eccube_nav.yaml`／
md=`functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md`。

## §1 L1原子オラクル表（24claim・全行逐語+file:line。R1是正でL1-M0909-024を追加）

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0909-001 | auth_rule | 未認証は本画面を利用できない（現況env=falseではルート条件不成立により到達不能=事実上利用不可。env=1到達時は管理領域の認証要件によりログインへ誘導される） | 「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される。」／`security: firewalls: admin: pattern: ['^/%eccube_admin_route%/',…] login_path: admin_login` | md:257／sec:41-46（admin firewall）／L1-M0909-002（ルート条件） | 0 |
| L1-M0909-002 | condition | GET/POST同一ルート`/%eccube_admin_route%/content/maintenance`（name=admin_content_maintenance）・解除ルート`/%eccube_admin_route%/disable_maintenance/{mode}`（name=admin_disable_maintenance）ともに`condition: isMaintenanceModeAllowed()`が付く。同サービスは`eccube_allow_maintenance_mode===true`を返すのみ。**既定`ECCUBE_ALLOW_MAINTENANCE_MODE=0`＝Processed false（実測2026-07-24）＝現況は両ルートとも到達不能** | `#[Route(path: '/%eccube_admin_route%/content/maintenance', name: 'admin_content_maintenance', methods: ['GET', 'POST'], condition: "service('controller_condition_service').isMaintenanceModeAllowed()")]`／`public function isMaintenanceModeAllowed(): bool { return $this->eccubeConfig->get('eccube_allow_maintenance_mode') === true; }`／`ECCUBE_ALLOW_MAINTENANCE_MODE=0`（実測: debug:container Real"0"/Processed false） | MC:37,82／CCS:26-29／eyml:304／env:62（実測§6.2.1） | 0 |
| L1-M0909-003 | display_field | GET表示: `isMaintenanceMode()`読取→無効中はラベル「有効にする」/"To enable"（送信値on）ボタン、有効中はラベル「無効にする」/"To disable"（送信値off）ボタンを表示。カード見出し「メンテナンスモード」/"Maintenance mode"＋説明文（改行あり・nl2br） | `$isMaintenance = $this->systemService->isMaintenanceMode();`／`{% if isMaintenance %}<input type="hidden" name="maintenance" value="off"><button …>{{ 'admin.content.maintenance_switch__off'|trans }}</button>{% else %}<input type="hidden" name="maintenance" value="on"><button …>{{ 'admin.content.maintenance_switch__on'|trans }}</button>{% endif %}`／`<span class="card-title">{{ 'admin.content.maintenance__card_title'|trans }}</span>`／`<span>{{ 'admin.content.maintenance_message'|trans|nl2br }}</span>` | MC:41／twig:28,34,39-45／ja:2956-2961／en:2643-2648／md:77,89,166-169 | 1 |
| L1-M0909-004 | fs_effect/message | POST on（無効→有効）: `$isMaintenance===false && $changeTo=='on'`の分岐でのみ`enableMaintenance('', true)`を呼ぶ（強制=true固定・モード識別子=空文字）。内部は`file_put_contents($path, "{$mode}:{$token}")`（token=`StringUtil::random(32)`＝32文字ランダム文字列）。成功フラッシュ「メンテナンスモードを有効にしました。」/"Maintenance mode has been enabled."を`admin`名前空間で登録し、`admin_content_maintenance`へredirectToRoute | `if ($isMaintenance === false && $changeTo == 'on') { $this->systemService->enableMaintenance('', true); $this->addSuccess('admin.content.maintenance_switch__on_message', 'admin'); }`／`public function enableMaintenance(string $mode = self::AUTO_MAINTENANCE, bool $force = false): void { if ($force \|\| !$this->isMaintenanceMode()) { $path = …; $token = StringUtil::random(32); \file_put_contents($path, "{$mode}:{$token}"); } }`／`public static function random(int $length = 16): string`／`return $this->redirectToRoute('admin_content_maintenance');` | MC:50-54,63／SS:117-124,148-155／SU:49／ja:2962／en:2649／md:63-64,116-118 | 1 |
| L1-M0909-005 | fs_effect/message | POST off（有効→無効）: `$isMaintenance===true && $changeTo=='off'`の分岐でのみ`disableMaintenanceNow('', true)`を呼ぶ（強制=true固定）。内部はモード識別子の一致を確認せず`\unlink($path)`（`$force\|\|$currentMode===$mode`で`force=true`固定のためモード不問）。成功フラッシュ「メンテナンスモードを無効にしました。」/"Maintenance mode has been disabled."を`admin`名前空間で登録し、同ルートへredirect | `} elseif ($isMaintenance && $changeTo == 'off') { $this->systemService->disableMaintenanceNow('', true); $this->addSuccess('admin.content.maintenance_switch__off_message', 'admin'); }`／`public function disableMaintenanceNow(string $mode = self::AUTO_MAINTENANCE, bool $force = false): void { if (!$this->isMaintenanceMode()) return; …$currentMode = \explode(':', $contents)[0]; if ($force \|\| $currentMode === $mode) { \unlink($path); } }` | MC:55-63／SS:168-181／ja:2963／en:2650／md:120-124,201 | 1 |
| L1-M0909-006 | fs_effect | 上記いずれの分岐にも該当しない場合（現在有効で送信on、現在無効で送信off等）はif/elseifのみでelse節が無い＝状態変更もフラッシュ登録もされず、そのまま`admin_content_maintenance`へredirectする | `if ($isMaintenance === false && $changeTo == 'on') { … } elseif ($isMaintenance && $changeTo == 'off') { … } return $this->redirectToRoute('admin_content_maintenance');`（else節0件=実引き） | MC:50-63（全文にelse節0件）／md:145,212-213 | 0 |
| L1-M0909-007 | security_rule | CSRFトークン不正・欠落POST: `$form->isSubmitted()&&$form->isValid()`が偽となり、on/off分岐に一切入らず（ファイル操作なし・フラッシュ登録なし）フォームビューを返す（GET表示と同じ描画）。twigに`form_errors`描画は無く専用の失敗文言も設けない | `$form->handleRequest($request); if ($form->isSubmitted() && $form->isValid()) { … } return ['form' => $form->createView(), 'isMaintenance' => $isMaintenance,];`（分岐外側は常にこのreturn）／twig全文（`form_errors`呼出0件=実引き） | MC:39-69／twig:1-55（全文）／md:142,283 | 0 |
| L1-M0909-008 | display_field | 入力欄はゼロ: `createBuilder(FormType::class)->getForm()`のみで`->add()`呼出は0件。画面のフォームは`form[_token]`（hidden・FormType既定CSRF）のみ・action=同一URLへPOST。POST bodyは`form[_token]`と隠しフィールド`maintenance`（on/off）のみ | `$builder = $this->formFactory->createBuilder(FormType::class); $form = $builder->getForm();`（add呼出0件=実引き）／`<form method="post" action="{{ url('admin_content_maintenance') }}"> {{ form_widget(form._token) }}` | MC:43-44／twig:20-21／md:93,206 | 0 |
| L1-M0909-009 | display_field | 本画面はモーダル・ポップアップ・確認ダイアログを表示しない。メンテナンス切り替え専用のJavaScriptを持たず、確認ダイアログ・非同期送信・表示切替は行わない（通常のフォームPOST） | 「本画面はモーダル、ポップアップ、確認ダイアログを表示しない。」「本画面はメンテナンス切り替え専用のJavaScriptを持たない。確認ダイアログ、非同期送信、表示切替は行わない。送信は通常のフォームPOSTとする。」（twig:19-54全文にmodal/dialog/script要素0件=実引き） | md:90,92／twig:19-54（全文） | 0 |
| L1-M0909-010 | fs_effect | 手動無効化はモード識別子の一致を確認せず強制的に目印ファイルを削除する（`disableMaintenanceNow('', true)`の`force=true`固定により`$currentMode===$mode`の判定は事実上不問）。自動メンテナンス中（識別子`auto_maintenance`等）であっても本画面の操作で解除できる | `$this->systemService->disableMaintenanceNow('', true);`／`if ($force \|\| $currentMode === $mode) { \unlink($path); }`（force固定trueのためcurrentMode不問） | MC:58／SS:168-181／md:124,201,214 | 0 |
| L1-M0909-011 | fs_effect | メンテナンス状態の判定は目印ファイル`.maintenance`の存在有無のみ（データベースは参照しない）。パスは設定キー`eccube_content_maintenance_file_path`（環境変数`ECCUBE_MAINTENANCE_FILE_PATH`、既定`%kernel.project_dir%/.maintenance`）。コンテナ実測パス=`/var/ec-cube/.maintenance`（現況=**不存在**、2026-07-24実測） | `public function isMaintenanceMode(): bool { return \file_exists($this->eccubeConfig->get('eccube_content_maintenance_file_path')); }`／`env(ECCUBE_MAINTENANCE_FILE_PATH): '%kernel.project_dir%/.maintenance'`／`eccube_content_maintenance_file_path: '%env(ECCUBE_MAINTENANCE_FILE_PATH)%'` | SS:186-190／eyml:22,251／md:63,199 | 0 |
| L1-M0909-012 | fs_effect/cookie | 応答へのCookie付与・破棄（`MaintenanceListener`、`KernelEvents::RESPONSE`購読）: `isMaintenanceMode()`が偽なら`maintenance_token`Cookieを破棄。真かつ現在ユーザーが`Member`かつ管理領域（`isAdmin()`）なら、目印ファイル内のトークンをSecure属性付きCookieとして付与。**この処理は`eccube_allow_maintenance_mode`を一切参照しない**（env切替非依存・実引き=全文にこの設定キー参照0件） | `if (!$this->systemService->isMaintenanceMode()) { $response->headers->clearCookie(SystemService::MAINTENANCE_TOKEN_KEY); return; } $user = $this->requestContext->getCurrentUser(); if ($user instanceof Member && $this->requestContext->isAdmin()) { $cookie = (new Cookie(SystemService::MAINTENANCE_TOKEN_KEY, $this->systemService->getMaintenanceToken()))->withSecure(true); $response->headers->setCookie($cookie); }` | ML:38-56（全文）／md:118,126,314-321 | 0 |
| L1-M0909-013 | fs_effect/http_status | 公開側停止判定は`html/index.php`（Symfony Kernelインスタンス化**前**の素のPHP）で行う: `.maintenance`ファイル存在**かつ**リクエストパスが管理画面プレフィックス配下でない場合に限り、Cookie`maintenance_token`と目印ファイル内トークンを比較し、不一致・欠落なら`HTTP/1.1 503`ヘッダを送出し`html/maintenance.php`をrequireして終了（Symfony Kernelへは渡さない）。管理画面プレフィックス配下はこの503判定自体を**素通りする（503振替の対象外）**だけであり、**「常時到達可能」を意味しない**＝各ルート個別の認証・条件（例:`admin_content_maintenance`自体は既定envで`isMaintenanceModeAllowed()`不成立のため到達不能のまま=L1-002）は本判定と独立に適用される。**この判定も`eccube_allow_maintenance_mode`を一切参照しない**（env切替非依存・実引き=index.php全文にこの設定キー参照0件） | `$maintenanceFile = env('ECCUBE_MAINTENANCE_FILE_PATH', __DIR__.'/../.maintenance'); if (file_exists($maintenanceFile)) { $pathInfo = \rawurldecode($request->getPathInfo()); $adminPath = '/'.\trim(env('ECCUBE_ADMIN_ROUTE', 'admin'), '/').'/'; if (\strpos($pathInfo, $adminPath) !== 0) { $maintenanceContents = file_get_contents($maintenanceFile); $maintenanceToken = explode(':', $maintenanceContents)[1] ?? null; $tokenInCookie = $request->cookies->get(SystemService::MAINTENANCE_TOKEN_KEY); if ($tokenInCookie === null \|\| $tokenInCookie !== $maintenanceToken) { header('HTTP/1.1 503 Service Temporarily Unavailable'); require __DIR__.'/maintenance.php'; return; } } } $kernel = new Kernel($env, $debug);` | idx:74-96（全文）／md:130-134,151-156 | 0 |
| L1-M0909-014 | message | 停止画面（`html/maintenance.php`・静的PHP・**英語リソースを持たない**）: 見出しおよびページタイトル「ただいまメンテナンス中です。」、説明文「大変お手数ですが、しばらくしてから再度アクセスをお願いします。」 | `<title>ただいまメンテナンス中です。</title>`／`<p class="ec-404Role__title …">ただいまメンテナンス中です。</p>`／`<p class="ec-404Role__description …">大変お手数ですが、しばらくしてから再度アクセスをお願いします。</p>` | maint:16,30,31／md:182-183 | 0 |
| L1-M0909-015 | api | 本画面の切り替えは専用APIを呼び出さない（`MaintenanceController::index`全文にHTTPクライアント・外部API呼出0件=実引き）。バッチは起動しない | 「本画面の切り替えは専用APIを呼び出さない。ファイル生成・削除をサーバ側で行い、同画面へリダイレクトする。」「本画面はバッチを起動しない。」 | md:236,237／MC:39-69（全文） | 0 |
| L1-M0909-016 | fs_effect | 複数管理者が同時に切り替えた場合、最後に書き込まれた内容が残る（版管理・楽観ロックなし＝`MaintenanceController`・`SystemService`全文にロック処理0件） | 「複数の管理者が同時に切り替えた場合のファイル操作の競合はファイルシステムの挙動に委ねる。楽観ロック・悲観ロックの対象は持たない。」 | md:329／MC:1-106・SS:1-200（全文にロック処理0件） | 0 |
| L1-M0909-017 | log | ログ禁止事項: メンテナンス用トークンの原値・Cookie値・なりすまし対策トークン・セッション識別子の完全値（**設計書由来・コードで不出力を立証していない・観測未契約=実行保留**） | 「- メンテナンス用トークンの原値／- Cookie `maintenance_token`の値／- なりすまし対策トークン／- セッション識別子の完全値」 | md:297-300（設計書由来のみ） | 0 |
| L1-M0909-018 | scope | 権限管理での個別制限（管理画面の権限管理設定によるコンテンツ管理配下の表示・操作可否）は別レイヤで制御され、詳細は権限管理機能を正とする＝**本設計書の主題外**（本機能の一次資料はこの制御の実体を持たない） | 「権限管理での個別制限｜管理画面の権限管理設定により、コンテンツ管理配下の表示・操作可否は別レイヤで制御される。詳細は権限管理機能を正とする。」 | md:260 | 0 |
| L1-M0909-019 | scope | プラグインのインストール・有効・無効・削除時に自動で切り替わる自動メンテナンス（識別子`auto_maintenance`／`auto_maintenance_update`）の発火条件・内部処理、およびその有効・無効タイミングは別機能の処理に従う＝**本設計書は扱わない**（md:13,34で明示的にスコープ外宣言） | 「プラグインのインストール・有効・無効・削除時に自動で切り替わる自動メンテナンス…の発火条件と内部処理」（本書で扱わないこと）／「自動メンテナンスとの整合｜自動メンテナンスの有効・無効タイミングは別機能の処理に従う。」 | md:13,34,228 | 0 |
| L1-M0909-020 | validation_rule | フォーム項目はゼロ（`->add()`呼出0件=L1-008）＝必須バリデーションを課す対象項目がそもそも存在しない | 「本画面は利用者が値を入力するテキスト欄・ラジオ・トグルは持たない。」「本機能は入力フォームへ値を保存しないため、入力項目に紐づく5列表は持たない。」 | md:93,206／MC:43-44 | 0 |
| L1-M0909-021 | validation_rule | 入力項目ゼロ（根拠=L1-020）につき項目間の相関バリデーションは定義不能。実在する唯一のサーバ側検証はFormType既定のCSRFトークン検証（L1-007）だが、twigに`form_errors`描画が無く専用の失敗文言も持たない＝「エラーが表示され」を満たす表示層が構成不能 | 「本画面専用のフォールバック文言は設けない。」「フォーム検証に失敗し、切り替えを行わない。」（利用者向け追加文言なし＝表示層不在） | md:283／twig:1-55（form_errors 0件）／MC:39-69 | 0 |
| L1-M0909-022 | structural | データベースは参照しない（`isMaintenanceMode()`は`file_exists`のみ=L1-011。`MaintenanceController`・`SystemService`にRepository/Doctrine業務参照0件＝`SystemService`が注入する`EntityManagerInterface`は`getDbversion()`専用でメンテナンス操作には不使用） | 「メンテナンス状態はデータベースではなくファイルシステム上の目印ファイルで保持する。」「本機能に直接関係するDBカラムは無い。」 | md:9,199,225／SS:14-46（EntityManager使用箇所=getDbversionのみ）／MC:1-106（Repository参照0件） | 0 |
| L1-M0909-023 | fs_effect | 解除エンドポイント`admin_disable_maintenance`（POST・`isMaintenanceModeAllowed()`同一条件・`isTokenValid()`必須・`isXmlHttpRequest()`必須）は、mode=manualならファイル存在時unlink、mode=auto_maintenance系なら`SystemService::disableMaintenance(mode)`でTERMINATE時に条件一致した場合のみ削除。**業務手順の詳細はmd:35で本設計書のスコープ外と明示＝ルート成立条件と大枠の効果のみ参考記載し、本機能の母集合はこのエンドポイントの内部仕様を要求しない** | `#[Route(path: '/%eccube_admin_route%/disable_maintenance/{mode}', name: 'admin_disable_maintenance', …, condition: "service('controller_condition_service').isMaintenanceModeAllowed()")] public function disableMaintenance(...): JsonResponse { $this->isTokenValid(); if (!$request->isXmlHttpRequest()) { throw new BadRequestHttpException(); } … }`／「キャッシュ管理・プラグイン操作の途中でajax経由でメンテナンスを解除する経路（`admin_disable_maintenance`）の業務手順」（本書で扱わないこと） | MC:82-105／md:35 | 0 |
| L1-M0909-024 | condition | **（R1是正・Major④で新設）** コンテンツ管理メニューの「メンテナンス管理」項目自体に`condition: { eccube_param: 'eccube_allow_maintenance_mode', expect: true }`が付く。既定`eccube_allow_maintenance_mode=false`の現況では、この条件が不成立となりメニュー項目が表示されない | `maintenance: name: admin.content.maintenance_management url: admin_content_maintenance condition: { eccube_param: 'eccube_allow_maintenance_mode', expect: true }` | nav:196-199（実測） | 0 |

**既知バグ候補（BC-DRAFT）**: なし。設計書の判定順序表（md:140-149）・エッジケース表（md:210-217）・
Cookie節（md:314-323）を`MaintenanceController`（MC:39-69）・`SystemService`（SS:117-190）・
`MaintenanceListener`（ML:38-56）と全行照合したが、実装挙動と設計書記載の乖離は検出していない
（`enableMaintenance('', true)`の`force=true`は設計書自身が「強制的に有効化する」md:116と明記しており
齟齬に数えない。同様に無効化のforce=trueもmd:124,201の「強制的に」「モード識別子の一致を確認せず」と一致）。
**設計書側の齟齬（DOC-DRAFT）**: なし。メッセージID対応（md:192-193=M09-09-MSG-001/002）は
`ja:2962-2963`の実在フラッシュ文言と1対1で一致し、m09-08で検出されたようなMSG-ID不存在問題は発生していない。
**母集合行の期待テキストと一次資料の矛盾（TBD・未解決。§9.3で詳述。R2是正で026/027と028を分離）**:
母集合026・027の2行は、前提ラベルが指す具体的シナリオ（on×on非遷移／自動メンテナンス中の強制無効化）と
期待テキストの極性が、設計書(md:213,214)および実装(MC:50-63,SS:168-181)が一致して示す実際の挙動と
**確認可能な形で逆方向**である（逆極性TBD）。母集合028（書込・削除失敗）は逆方向であることが確認された
わけではなく、`file_put_contents`/`unlink`が例外・戻り値確認なしで呼ばれる（SS:148-155,168-181）ため
期待「変更される」を支持することも否定することも一次資料からできない**未規定・polarity不明**である
（polarity不明TBD）。**テストケースが正の原則**に従い、いずれも母集合行を改変せず・実装挙動を期待の正にも
せず、boundから外してTBD（D6裁定待ち・未解決）へ分離した（§9.3）。

## §2 SEED・状態設計（DB SEEDなし・使い捨て直接配置＋冪等クリーンアップ。全て`@TBD-D5`）

DB不使用（md:9,199,225／L1-022）のためDB SEEDはない。永続状態は`.maintenance`ファイル1点のみ
（実測PRE=**不存在**・§6.2.1）。期待値の正はL1オラクルID（三段参照。トークン実測値・実測パスを
期待リテラルにしない）。

| 状態 | 内容 | 用途・規律 |
|---|---|---|
| SEED-M01-ADMIN@TBD-D5（既存） | 管理者ログイン資格 | env=1到達時の全ケースのログイン前提（m01系と共通） |
| .maintenance PRE不存在 | beforeAllで`exists(MAINT_ABS)`=false を確認（実測済み=§6.2.1） | 全破壊系ケースの基準状態。afterEachで`removeMaint()`（rm -f）によりPRE不存在へ復帰 |
| MAINT-DIRECT（テスト内直接配置） | fs.tsの`writeMaint(mode, token)`で`<mode>:<token>`形式の内容を`MAINT_ABS`へ直接書込（**アプリのenableMaintenance()を経由せず、fs.tsが直接ファイルを書く**）。C-004/C-005/C-006/C-013/C-014等、env切替不要な前面側ケースの前提状態を作る | 公開側503振り替え・admin path除外・token一致継続閲覧・自動メンテナンス識別子模擬に使用。afterEachで`removeMaint()` |
| MAINT-VIA-UI（env=1到達後のみ） | 管理画面のトグルボタン操作で`.maintenance`を生成・削除（アプリの`enableMaintenance`/`disableMaintenanceNow`を経由）。C-007〜C-017が対象 | env切替が必要な要実機ケース専用。トークンは32文字ランダムのため期待リテラルにしない（長さ・文字種のみ検証） |

- 並行実行: `.maintenance`は環境単位の共有状態のため**本機能はserial必須**。他suiteとの同時実行も不可
  （フロント全体が503振り替えの対象になる副作用があるため）。suite末尾での実行を推奨。
- **env切替（`ECCUBE_ALLOW_MAINTENANCE_MODE=1`）を要する範囲では、実機（実装waveの専用環境）でのみ
  トグルし、本草案作成時点では実際に切り替えていない**（候補グレード=実装・実走なし。共有dockerコンテナの
  状態変更を避けるため）。

## §3 操作×観測マトリクス（入力項目ゼロのため項目表に代えて操作×副作用で構成）

本機能の入力項目は**ゼロ**（L1-008,020。md:206「本機能は入力フォームへ値を保存しないため、入力項目に
紐づく5列表は持たない」）。層は「画面（フラッシュ/JS/遷移）×ファイル層（fs.ts: `.maintenance`）×
前面応答層（503/Cookie）」で構成する。

| 操作 | 一次資料の確定値 | 観測手段 | env切替 | 検証ケース |
|---|---|---|---|---|
| 前面GET（.maintenance直接配置・トークン不一致） | 503+静的案内（L1-013,014） | Playwright（front）+fs.ts | 不要 | C-004 |
| 前面GET（.maintenance存在・admin path） | 503振替の対象外（L1-013。「常時到達」は主張しない） | Playwright（admin）+fs.ts | 不要 | C-005 |
| 前面GET（.maintenance存在・token一致） | 停止対象外・継続＋Cookie付与（L1-012,013） | Playwright+fs.ts | 不要 | C-005 |
| 前面GET（.maintenance不存在） | 503にならない（基準・補完） | Playwright | 不要 | C-006（補完） |
| 管理画面GET（env=0=現況） | ルート条件不成立・到達不能（L1-002） | Playwright/非UI | 不要（現況を確認） | C-001 |
| 管理画面GET（env=1） | 現在状態に応じたボタン表示（L1-003） | Playwright | 要 | C-007 |
| 管理画面POST on（env=1・無効→有効） | ファイル生成＋成功フラッシュ＋リダイレクト＋Cookie付与（L1-004,012） | Playwright+fs.ts | 要 | C-008 |
| 管理画面POST off（env=1・有効→無効） | ファイル削除＋成功フラッシュ＋リダイレクト＋Cookie破棄（L1-005,012） | Playwright+fs.ts | 要 | C-009 |
| 管理画面POST（非遷移: on×on/off×off） | 無反応（L1-006） | Playwright+fs.ts | 要 | C-010／C-011 |
| 管理画面POST（トークン不正/欠落） | 同一ビュー再描画・ファイル不変（L1-007） | 非UI+fs.ts | 要 | C-012 |
| 管理画面POST off（自動メンテナンス中） | モード不問で強制削除（L1-010） | Playwright+fs.ts | 要 | C-012 |
| 管理画面POST（書込・削除失敗誘発） | 共通例外処理委譲・**ファイル状態の変化有無は断定しない**（md:215はexception/戻り値確認なしのfile_put_contents/unlink呼出のみ=SS:148-155,168-181） | fs.ts | 要+誘発手段不明+**結果polarity断定なし(partial)** | C-013 |
| 設定キー既定値 | `eccube_allow_maintenance_mode`=false・`ECCUBE_ALLOW_MAINTENANCE_MODE`=0（L1-002） | 非UI（debug:container） | 不要 | C-002 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全20行を実体掲載**（§4.1 bound対応16＋§4.2 補完1＋
§4.3 -EN 3=20。R1是正でMajor⑥の行数自己矛盾を是正））

### §4.1 bound対応候補行（16行。§8の56対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-09_admin_content_content_maintenance	E2E-M0909M-001	IT-20	env切替ゲート	P1	現況env（既定=無効）ではメンテナンス管理画面のGET/POSTとも到達不能、かつメニュー項目も非表示	既定env（ECCUBE_ALLOW_MAINTENANCE_MODE=0=§6.2.1実測）	—	1. 管理者ログイン済セッションでGET /%eccube_admin_route%/content/maintenance 2. 応答statusを読む 3. 管理者ログイン済セッションで空bodyのPOST /%eccube_admin_route%/content/maintenance 4. 応答statusを読む 5. コンテンツ管理メニュー一覧を表示し「メンテナンス管理」項目の有無を確認	GET/POSTとも管理画面（admin_content_maintenance）へ到達できない（ルート条件不成立=404または未マッチ相当。管理者ログイン済でも到達不能）＋コンテンツ管理メニューに「メンテナンス管理」項目が表示されない（eccube_nav.yamlのcondition不成立） [L1:L1-M0909-002,L1-M0909-024／実測=env:62]				
m09-09_admin_content_content_maintenance	E2E-M0909M-002	IT-12	設定値	P1	設定キーeccube_allow_maintenance_mode・環境変数ECCUBE_ALLOW_MAINTENANCE_MODEの既定値確認	—	—	1. docker exec環境でphp bin/console debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODEを実行 2. Real/Processed値を読む	Real値"0"・Processed値false（既定は無効） [L1:L1-M0909-002]				
m09-09_admin_content_content_maintenance	E2E-M0909M-003	IT-15	未認証	P1	未認証では本画面を利用できない（現況env=falseで到達不能＝利用不可の文字通り成立） 	未ログイン（cookie無しcontext）／既定env	—	1. 未認証でGET /%eccube_admin_route%/content/maintenance 2. 応答を読む	本画面を利用できない（現況では条件不成立による到達不能。env=1到達時は管理領域の認証要件によりadmin_loginへ誘導される＝いずれの経路でも利用不可の主張は成立） [L1:L1-M0909-001,L1-M0909-002]				
m09-09_admin_content_content_maintenance	E2E-M0909M-004	IT-25	前面停止	P1	.maintenanceをfs.tsで直接配置しトークン不一致で前面GETすると503+静的案内画面（見出し・説明文）が表示され、再度同一内容が返る	既定env（env切替不要）／.maintenance PRE不存在（実測済み）	fs.ts writeMaint('', 'E2E-M0909-token-A')	1. fs.tsで.maintenance PRE不存在を確認 2. writeMaint('', 'E2E-M0909-token-A')で直接配置 3. cookie無しcontextで前面GET / 4. 応答statusと本文を読む 5. 見出し・説明文の全文一致を確認 6. 同一cookie無しcontextで再度GETし本文が前回と同一であることを確認 7. afterEach: removeMaint()	応答=HTTP503＋見出し/タイトル「ただいまメンテナンス中です。」＋説明文「大変お手数ですが、しばらくしてから再度アクセスをお願いします。」を表示＋2回目のGETも同一内容（静的ページの再現性） [L1:L1-M0909-013,L1-M0909-014; fixture:MAINT-DIRECT@TBD-D5]				
m09-09_admin_content_content_maintenance	E2E-M0909M-005	IT-25	管理画面パス除外・token一致継続	P1	.maintenance存在下でも管理画面パス配下はhtml/index.phpの503判定の対象外（＝503振替対象外。当該ルート個別の到達可否は別途その条件に従う）、かつtoken一致の認証済み管理者は前面も継続閲覧できCookieが付与される	既定env（env切替不要）／管理者ログイン済／.maintenance PRE不存在	fs.ts writeMaint('', 'E2E-M0909-token-B')	1. fs.tsでwriteMaint('', 'E2E-M0909-token-B')配置 2. 管理者ログイン済contextで、env切替を要しない既存の管理画面パス（例: admin_homepage。admin_content_maintenance自体は既定envで別途到達不能=L1-002のため対象に選ばない）へGETし、503振替を受けずアプリ本体の応答（そのルート自体の通常のstatus）が返ることを確認 3. 応答Set-Cookieに`maintenance_token`がtoken値と一致して付与されることを確認 4. 同cookieを保持したまま前面GETし503振替を受けず200で継続できることを確認 5. afterEach: removeMaint()（.maintenance削除後の応答でCookieがclearCookieされることも確認）	管理画面パス配下は.maintenance存在下でもhtml/index.phpの503判定の対象外（＝503にならない。「常時到達」は主張せず、当該ルート自体の到達可否はそのルートの認証・条件に従う）＋認証済み管理者にはSecure属性のmaintenance_token Cookieが目印ファイル内トークンと一致する値で付与＋当該Cookie保持時は前面も503振替を受けず継続閲覧＋.maintenance削除後の応答でCookieが破棄される [L1:L1-M0909-012,L1-M0909-013; fixture:MAINT-DIRECT@TBD-D5]				
m09-09_admin_content_content_maintenance	E2E-M0909M-006	IT-25	GET表示（env=1到達後）	P1	管理画面がHTTP200で表示一式（カード見出し・説明文・現在状態に応じたボタン・入力欄ゼロ）を表示しエラーなし	管理者ログイン済／env=1（要実機） 	—	（env切替後）1. .maintenance不存在状態でGET /content/maintenance 2. カード見出し・説明文全文・ボタン文言「有効にする」・隠しフィールドmaintenance=onを確認 3. fs.tsでwriteMaint配置後に再度GET 4. ボタン文言「無効にする」・隠しフィールドmaintenance=offへ切り替わることを確認 5. 可視入力要素（input:not([type=hidden])等）が0件であることを確認 6. エラー表示が無いことを確認	HTTP200＋カード見出し「メンテナンスモード」＋説明文全文一致（改行含む）＋無効中は「有効にする」(maintenance=on)・有効中は「無効にする」(maintenance=off)へボタンが切り替わる＋可視入力欄0件＋エラー表示なし [L1:L1-M0909-003,L1-M0909-008,L1-M0909-020; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-007	IT-15	有効化成功	P1	無効状態で有効化ボタン押下→ファイル生成（空文字:32文字トークン）＋成功フラッシュ＋同画面へリダイレクト＋Cookie付与＋DBは変更しない	管理者ログイン済／env=1（要実機）／.maintenance不存在	maintenance=on（表示中のボタン）	（env切替後）1. .maintenance不存在を確認 2. 「有効にする」押下 3. リダイレクト先URL=/content/maintenance・HTTP200を確認 4. フラッシュ「メンテナンスモードを有効にしました。」を読む 5. fs.tsで.maintenance内容が`^:[A-Za-z0-9]{32}$`形式（モード識別子=空文字・トークン32文字）であることを確認 6. 応答Set-Cookieに`maintenance_token`がファイル内トークンと一致して付与されることを確認 7. afterEach: removeMaint()	「メンテナンスモードを有効にしました。」＋/content/maintenanceへリダイレクト＋.maintenance生成（内容=空文字+コロン+32文字トークン）＋Cookie付与＋DB操作なし（EntityManager書込0件） [L1:L1-M0909-004,L1-M0909-012,L1-M0909-022; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-008	IT-15	無効化成功	P1	有効状態で無効化ボタン押下→ファイル削除＋成功フラッシュ＋同画面へリダイレクト＋Cookie破棄＋画面がメンテナンス管理画面へ遷移	管理者ログイン済／env=1（要実機）／.maintenance存在（fs.ts配置） 	maintenance=off（表示中のボタン）	（env切替後）1. fs.tsでwriteMaint('', token)配置 2. 「無効にする」押下 3. リダイレクト先URL=/content/maintenance・HTTP200を確認 4. フラッシュ「メンテナンスモードを無効にしました。」を読む 5. fs.tsで.maintenance不存在を確認 6. 応答でmaintenance_token Cookieが破棄（clearCookie）されることを確認 7. afterEach: removeMaint()（冪等）	「メンテナンスモードを無効にしました。」＋管理画面_コンテンツ管理_メンテナンス管理画面(/content/maintenance)へ遷移＋.maintenance削除＋Cookie破棄 [L1:L1-M0909-005,L1-M0909-012; fixture:MAINT-VIA-UI@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-009	IT-26	非遷移on×on	P1	既に有効な状態で送信値onが届いても状態変更なし・フラッシュなしでリダイレクトのみ	管理者ログイン済／env=1（要実機）／.maintenance存在	form[maintenance]=on（表示中でないボタン値を直接送信） 	（env切替後）1. fs.tsで.maintenance配置しsha1記録 2. 画面GETで正規token取得 3. maintenance=onで直POST 4. 応答=/content/maintenanceへリダイレクト・HTTP200を確認 5. フラッシュ「有効にしました」「無効にしました」がいずれも表示されないことを確認 6. fs.tsで.maintenance内容がsha1同値のまま不変であることを確認（afterEach: removeMaint）	状態変更なし（ファイル内容不変=sha1同値）＋フラッシュ非表示＋同画面へリダイレクトのみ [L1:L1-M0909-006; fixture:MAINT-VIA-UI@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-010	IT-26	非遷移off×off	P1	既に無効な状態で送信値offが届いても状態変更なし・フラッシュなしでリダイレクトのみ	管理者ログイン済／env=1（要実機）／.maintenance不存在	form[maintenance]=off（表示中でないボタン値を直接送信） 	（env切替後）1. fs.tsで.maintenance不存在を確認 2. 画面GETで正規token取得 3. maintenance=offで直POST 4. 応答=/content/maintenanceへリダイレクト・HTTP200を確認 5. フラッシュがいずれも表示されないことを確認 6. fs.tsで.maintenance不存在のままであることを確認	状態変更なし（不存在のまま）＋フラッシュ非表示＋同画面へリダイレクトのみ [L1:L1-M0909-006; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-011	IT-15	CSRF	P1	トークン不正/欠落POSTは分岐に入らずファイル操作なし・フラッシュなしで同一ビュー再描画（サーバ側が状態・切替可否を判定する証跡）	管理者ログイン済セッション（同一context）／env=1（要実機）	§6.1契約: (a)form[_token]=正規値の末尾1文字置換+maintenance=on (b)bodyなし（トークン欠落）	（env切替後）1. fs.tsで.maintenance不存在・sha1記録 2. 画面GETで正規token取得し末尾1文字置換してmaintenance=onで直POST 3. 応答=HTTP200同一ビュー再描画・フラッシュ非表示を確認 4. fs.tsで.maintenance不存在のまま（ファイル操作なし）を確認 5. 空bodyでも同様に確認	いずれもHTTP200で同一ビュー再描画・フラッシュなし＋.maintenance不変（生成されない）＝クライアントの送信値でなくサーバ側のトークン検証・現在状態判定が切替可否を決める [L1:L1-M0909-007,L1-M0909-021; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-012	IT-26	自動メンテナンス中の強制無効化	P1	モード識別子がauto_maintenanceの状態でも本画面の無効化ボタンはモード不問で強制的に目印ファイルを削除する	管理者ログイン済／env=1（要実機）／.maintenance存在（fs.tsでauto_maintenance:token形式を配置） 	maintenance=off	（env切替後）1. fs.tsでwriteMaint('auto_maintenance', token)を配置 2. 画面を開き無効化ボタン（表示はisMaintenanceMode()のみで真偽判定=表示される）を押下 3. フラッシュ「無効にしました」を確認 4. fs.tsで.maintenance不存在（モード不一致でも削除された）ことを確認	モード識別子がauto_maintenanceであっても本画面の無効化操作でファイルが強制削除され無効化が成立する [L1:L1-M0909-010; fixture:MAINT-DIRECT@TBD-D5]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-013	IT-26	書込・削除失敗（partial・結果polarityを断定しない開放観測）	P1	目印ファイルへの書き込み・削除失敗時、本画面専用のフォールバック文言は表示されないことは確認できるが、ファイル状態が実際に変更されるか否かは一次資料から断定できないため観測記録に留める（アプリの共通例外処理に委ねられる旨のみ設計書記載）	管理者ログイン済／env=1（要実機）／書込・削除失敗を誘発できる状態（**誘発手段は一次資料に規定なし=要実機。`.maintenance`のパスは`%kernel.project_dir%/.maintenance`＝APP_ROOT直下のため親ディレクトリ権限操作はアプリ全体に影響し高リスク＝実機での慎重な誘発手順確立が前提**） 	maintenance=on または off	（誘発手段・専用環境確立後）1. 誘発状態を設定（例: APP_ROOT直下の書込権限を一時的に制限する代替手段を実機で検討） 2. 有効化または無効化ボタンを押下 3. 本画面専用のエラー文言が出ないことを確認 4. fs.tsで.maintenanceの実際の状態（変化の有無・部分書込の有無を含む）を観測記録する（**「不変」を期待値として断定しない**。`enableMaintenance`/`disableMaintenanceNow`は`file_put_contents`/`unlink`を例外・戻り値確認なしで呼ぶのみ=SS:148-155,168-181実引きのため、結果はdev環境のErrorHandler有無等の実行時条件に依存し一次資料からは確定できない） 5. 誘発状態を復元	本画面専用のフォールバック文言は表示されない（bound）＋ファイル状態の変化有無は実機観測により記録し、本草案では変化の有無いずれも期待値として主張しない（partial）＋例外処理はアプリケーションの共通処理に委ねられる（md記載のみ・実挙動は未検証） [L1:L1-M0909-021（表示層の部分のみbound）／md:215（partial）]（要実機=誘発手段未確定・高リスクにつき実機で安全な誘発法を別途確立。結果polarityはpartial=断定なし）				
m09-09_admin_content_content_maintenance	E2E-M0909M-014	IT-25	モーダル・JS	P1	本画面はモーダル・ポップアップ・確認ダイアログを表示せず、切り替え専用のJavaScriptを持たない（ボタン押下で即通常POST）	管理者ログイン済／env=1（要実機）	—	（env切替後）1. 画面を開きボタン押下まで操作 2. .modal要素・page.on('dialog')イベント・トースト要素の不在を確認 3. ネットワーク記録で押下時に通常のフォームPOST（フルページ遷移）が発生しXHRでないことを確認	モーダル/ポップアップ/確認ダイアログが発生せず、押下で通常のフォームPOSTが即時発生する（専用JS・非同期送信なし） [L1:L1-M0909-009]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-015	IT-23	API呼出なし	P1	本画面の切替操作は専用APIを呼び出さない（ブラウザ発リクエストは同一アプリ内エンドポイントのみ）	管理者ログイン済／env=1（要実機）	maintenance=on	（env切替後）1. page.on(request)で記録開始 2. 有効化ボタン押下から遷移完了まで操作 3. 記録を走査	ブラウザ発リクエストはadmin_content_maintenanceへのPOSTとリダイレクトGET・静的資産のみで、業務APIやadmin_disable_maintenanceへの呼出は発生しない（サーバ内部もMC全文にHTTP клиент呼出0件） [L1:L1-M0909-015]（要実機=env切替）				
m09-09_admin_content_content_maintenance	E2E-M0909M-016	IT-02	.maintenance不存在時の無影響（補完・基準確認）	P2	.maintenance不存在時は前面GETに何の影響もなく通常応答が返る	既定env（env切替不要）／.maintenance PRE不存在	—	1. fs.tsで.maintenance不存在を確認 2. cookie無しcontextで前面GETし応答statusを読む	HTTP200（またはアプリ通常応答）＝503振り替えは発生しない（.maintenance不存在＝L1-013の分岐外） [L1:L1-M0909-013]（補完行・親test_idなし・設計書補完）				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合56行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-09_admin_content_content_maintenance	E2E-M0909M-017	IT-20	ログ	P3	トークン原値・Cookie値・セッションIDの非出力（実行保留）	管理者ログイン済／env=1（要実機）	—	（ログ観測手段確定後）1. C-007〜C-012の一連操作を実行 2. アプリケーションログ/HTTPログを走査	メンテナンス用トークンの原値・Cookie `maintenance_token`の値・なりすまし対策トークン・セッション識別子の完全値が記録されない [L1:L1-M0909-017]（補完行・親test_idなし・設計書補完・観測手段未契約=実行保留。L1-017は設計書由来でコード立証なし）				
```

### §4.3 -EN行（3行。LS=1 claimのlocale多重・対応ja行と同一親）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-09_admin_content_content_maintenance	E2E-M0909M-006-EN	IT-25	GET表示（en）	P2	表示一式（en）	管理者ログイン済／env=1／locale=en	—	同C-006	カード見出し "Maintenance mode"＋説明文 "When the maintenance mode is enabled, the shop is temporarily stopped and only the Admin Console can be accessed.\n* When installing / enabling / disabling / deleting plugin, it automatically switches to maintenance mode."＋ボタン "To enable"/"To disable" [L1:L1-M0909-003]				
m09-09_admin_content_content_maintenance	E2E-M0909M-007-EN	IT-15	有効化成功フラッシュ（en）	P2	有効化フラッシュ（en）	管理者ログイン済／env=1／locale=en	同C-007	同C-007	"Maintenance mode has been enabled." 表示＋同一画面リダイレクト [L1:L1-M0909-004]				
m09-09_admin_content_content_maintenance	E2E-M0909M-008-EN	IT-15	無効化成功フラッシュ（en）	P2	無効化フラッシュ（en）	管理者ログイン済／env=1／locale=en	同C-008	同C-008	"Maintenance mode has been disabled." 表示＋同一画面リダイレクト [L1:L1-M0909-005]				
```

## §5 locale対応表

LS=1: **3claim**（L1-003/004/005）→ **-EN 3行**（§4.3）。停止画面（L1-014・`html/maintenance.php`）は
**英語リソースを持たない**（md:182備考「静的ページのため英語リソースを持たない」・maint.php全文が日本語固定
=実引き）ため-EN行を作らない。en文言はすべてen一次資料逐語（messages.en.yaml。ja翻訳ゼロ）。
-EN実行前提はD15（M0 Go/No-Go）＋env切替（要実機）の両方。

## §6 判定手段骨子（候補=未実装）＋観測（fs.ts再利用契約）＋_drafts隔離lint証跡

### §6.1 request契約

- フォーム直POST: `POST /%eccube_admin_route%/content/maintenance`（application/x-www-form-urlencoded）。
  フィールド=`form[_token]`・`maintenance`（on/off、フォーム自体は`form`という名前空間を持つが
  `maintenance`は`$request->request->get('maintenance')`で直接読むためフォーム名前空間の外＝
  `twig:22,40,43`の`<input type="hidden" name="maintenance" value="…">`から確定・フォーム名前空間
  `form[...]`には含まれない点に注意）。正規tokenは同一contextの画面GETで`input[name="form[_token]"]`
  から取得。改変token=正規値の末尾1文字置換。欠落=空bodyのPOST。
- UI経由: `button[type=submit]`（表示中のラベルに応じて「有効にする」または「無効にする」）押下
  （確認ダイアログなし=L1-009）。
- 前面直GET: `GET /`（cookie有無・値を操作してtoken一致/不一致を作る。§6.2の`writeMaint()`で
  ファイル内トークンを既知値に固定してからCookieに同値/異値/欠落を設定する）。
- env切替が必要な範囲（C-006〜C-015）は未実装・実走なし（候補規律）。ログイン済みcontextのcookie共有で
  送信（m09-01と同方式）。

### §6.2 観測手段 — fs.ts再利用契約（m09-05 §6.2／m09-08 §6.2の共通契約を継承。機能別に変わるのは対象絶対パスと専用関数のみ）

**位置づけ**: 関数契約はm09-05 §6.2.2のfs.ts共通契約（`exists`/`readFile`/`sha1`/`statOwnerMode`・
docker exec前置・絶対パスのみ・exit>1はthrow黙殺禁止）をそのまま再利用し、`.maintenance`直接配置系の
専用関数（`writeMaint`/`removeMaint`）はm09-08 §6.2.2の`maintExists`/`readMaint`/`removeMaint`契約と
同型で追加する。実装は`e2e/helpers/fs.ts`（候補=未実装。実装は実装wave）。

**§6.2.1 接続・パス定数（コンテナ実測で確定。2026-07-24実測・本草案作成者が独立に再実測）**

| 定数 | 確定値 | 確定根拠（実測コマンド） |
|---|---|---|
| `E2E_WEB_CONTAINER` | 既定 `ec-cube-enterprise-ec-cube-1`（稼働実測済み） | `docker ps --format '{{.Names}}'` に実在 |
| `APP_ROOT` | `/var/ec-cube` | `docker exec ec-cube-enterprise-ec-cube-1 pwd`＝`/var/ec-cube` |
| `MAINT_ABS` | **`/var/ec-cube/.maintenance`** | `debug:container --env-var=ECCUBE_MAINTENANCE_FILE_PATH`＝Processed `"/var/ec-cube/.maintenance"`。**現況実測: 不存在（PRE=不存在側）**（`test -e … && echo EXISTS \|\| echo ABSENT`＝`ABSENT`） |
| `eccube_allow_maintenance_mode`現況 | **false** | `debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODE`＝Real `"0"`・Processed `false`（`.env:62`と一致。C-001の実測根拠） |
| 管理ルート | `admin` | `debug:container --env-var=ECCUBE_ADMIN_ROUTE`＝Processed `"admin"` |
| APP_ENV | `dev` | `docker exec … sh -c 'echo $APP_ENV'`＝`dev` |
| docker exec既定ユーザ | `root` | 既定は`root`。アプリ視点の権限判定が要る場合は`-u www-data`（m09-05契約を継承） |

**実測ログ逐語引用（2026-07-24・本草案作成者がホストで実行。codex環境はdocker socket権限なしのため
後日の実機照合はこのコマンド列を再実行して突合すること）**:

```
$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODE
 ----------------- -------
  Default value     "0"
  Real value        "0"
  Processed value   false
 ----------------- -------

$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_MAINTENANCE_FILE_PATH
 ----------------- -----------------------------
  Default value     "/var/ec-cube/.maintenance"
  Processed value   "/var/ec-cube/.maintenance"

$ docker exec ec-cube-enterprise-ec-cube-1 sh -c 'test -e /var/ec-cube/.maintenance && echo EXISTS || echo ABSENT'
ABSENT

$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_ADMIN_ROUTE
 ----------------- ---------
  Default value     "admin"
  Processed value   "admin"

$ docker exec ec-cube-enterprise-ec-cube-1 pwd
/var/ec-cube

$ docker exec ec-cube-enterprise-ec-cube-1 sh -c 'echo $APP_ENV'
dev
```

**§6.2.2 追加関数契約（共通契約への本機能分の追加。入出力・失敗時仕様）**

| 関数 | 実体コマンド（`docker exec $E2E_WEB_CONTAINER` 前置） | 入出力 | 失敗時仕様 |
|---|---|---|---|
| `maintExists()` | `test -e <MAINT_ABS>` | exit0→true／exit1→false | exit>1はthrow=ハーネス失敗（黙殺禁止） |
| `readMaint()` | `cat <MAINT_ABS>` | 内容（`<mode>:<token>`形式。**トークン原値はログへ出力しない**=md:299に整合し、テストコード内でも生ログ出力を避け正規表現マッチ結果のみ記録する） | 不存在→throw（existsで先に確認） |
| `writeMaint(mode, token)` | `sh -c "printf '%s:%s' '<mode>' '<token>' > <MAINT_ABS>"`→書込後`test -e <MAINT_ABS>`で確認 | 配置後の存在を機械確認して返る。C-004/C-005/C-012ではE2E固有のダミートークン（例`E2E-M0909-token-A`）を使い、実運用のランダムトークンと衝突しない値を用いる | 書込失敗・存在確認exit非0→throw |
| `removeMaint()` | `rm -f <MAINT_ABS>` | PRE不存在（実測）への復帰。冪等（不存在でも成功） | exit非0→throw=**suite abort**（メンテ残留はフロント全体に影響するため）＋手動復旧手順（rm -f）をログ出力 |
| `assertMaintFormat(mode)` | `readMaint()`結果を正規表現`^<mode>:[A-Za-z0-9]{32}$`（modeが空文字の場合は`^:[A-Za-z0-9]{32}$`）で照合 | bool（トークン値そのものはアサーション対象にせず形式のみ検証=期待の正はL1-004の「32文字ランダム」という性質であってトークン実測値ではない） | 不一致はテスト失敗として表面化（throwしない・アサーション） |
| `sha1(abs)` | `sha1sum <abs>` | 出力先頭40hex（C-009/C-010の不変性確認に使用） | exit非0→throw |

- suite構成: beforeAll=`maintExists()`=falseの確認（実測済み=§6.2.1）／各破壊系ケースafterEach=
  `removeMaint()`（冪等）。C-004〜C-005（env切替不要な前面系）はbeforeEachで`writeMaint()`により
  ケース固有トークンを配置し、afterEachで`removeMaint()`により復帰する。
- 期待値の正はL1（三段参照）。fs.ts出力はSUT実挙動側の観測値であり期待リテラルにしない。
  トークン原値はテストコード内でも生ログへ出さず、正規表現マッチ結果（bool）のみをアサーションに使う
  （L1-017・md:297-300の禁止事項をテスト実装自体にも適用）。
- **env切替（`ECCUBE_ALLOW_MAINTENANCE_MODE=1`）の手段は本草案では規定しない**（実機の専用環境で
  `.env`相当の設定変更・コンテナ再起動が必要。共有dockerコンテナの`.env`を書き換えると他機能のテストや
  実運用に影響するため、本草案作成時点では実際に切り替えていない＝候補グレードの規律に従う）。
- **C-013（書込・削除失敗誘発）の骨子**: `.maintenance`のパスは`%kernel.project_dir%/.maintenance`＝
  `APP_ROOT`直下（`/var/ec-cube/.maintenance`）であり、m09-05のC-023（親dir=`html/user_data/assets/css`）
  と異なり**親ディレクトリがアプリケーションルートそのもの**である。ここへの書込制限（chmod/chown操作）は
  アプリ全体の動作に影響し得るため、m09-05のような「記録→誘発→復元」の安全な手順化には追加の安全設計
  （例: 一時的な別マウント・bind mountでの隔離、またはコンテナ内のみで完結する特権昇格を伴わない代替手段の
  検討）が要る。本草案では誘発手段を確定せず、**要実機**として実装waveでの安全な手順確立を課題として残す
  （捏造で「動く」ことにしない）。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード
   `oracle.ts`の`_drafts`拒否throw〔m09-08/m09-05実測でoracle.ts:16-21実在確認済み・本機能でも同一ファイルの
   ガードを再利用〕を除く）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は
   `_drafts/`の2ファイル（本md＋oracle草案）のみ。
3. SUT・オラクル（設計書・母集合TSV）への変更なし（読取のみ。E2E実行の絶対規約に適合）。
4. `.env`・docker-compose・実運用コンテナの設定は**未変更**（`ECCUBE_ALLOW_MAINTENANCE_MODE`は現況値=false
   のまま。§6.2.1の実測はいずれも読取専用コマンドのみで実行し、書込系コマンドは一切実行していない）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-005・C-006・C-007・C-014・C-016。
- Playwright+FS確認（fs.ts）: C-004・C-005・C-007・C-008・C-009・C-010・C-011・C-012・C-013・C-016。
- 非UI（request契約）: C-001（GET/POSTのstatus確認）・C-002（debug:container）・C-011（token改変直POST）。
- **env切替不要（現況のまま検証可能）**: C-001・C-002・C-003（の到達不能側）・C-004・C-005・C-016（12母集合行）。
- **要実機（env切替=`ECCUBE_ALLOW_MAINTENANCE_MODE=1`）**: C-006・C-007・C-008・C-009・C-010・C-011・
  C-012・C-014・C-015（**33母集合行**＋-EN3行。R1是正で026・027をTBDへ移動したため35→33に減少）。
- **partial（要実機＋誘発手段不明＋結果polarity断定なし）**: C-013（**1母集合行=035**。`.maintenance`
  親dirがAPP_ROOT直下のため安全な誘発手順を実機で別途確立する必要があり、かつ`file_put_contents`/`unlink`が
  例外・戻り値確認なしで呼ばれる=SS:148-155,168-181実引きのため成功/失敗いずれの結果も断定しない。
  R1是正でMajor⑤に基づき「不変」の断定を撤回）。
- **TBD（母集合矛盾・未解決・D6裁定待ち）**: **3母集合行**（R1是正Blocker①・R2是正で内訳分離。§9.3参照）。
  内訳＝逆極性TBD{026,027}（設計書+実装が一致して示す実際の挙動と期待テキストが確認可能な形で逆方向）＋
  polarity不明TBD{028}（実装が例外・戻り値確認なしで呼ばれるため肯定・否定いずれの極性も一次資料から
  支持できない未規定）。
- **実行保留**: C-017（ログ観測手段未契約。補完行）。
- 並行実行: **本機能はserial必須**（`.maintenance`が環境単位の共有状態・フロント全体へ影響するため）。
  共有ステージングでは実行しない（専用環境前提）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点・前提ラベルはノイズ=前提列は設計書subject名の機械循環。
多くの行で前提ラベルと期待テキストが弱く対応するか矛盾する＝§10 C4で記録）。1候補ケース行=1 assertion
bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に
実体掲載済み＝56↔候補の期待テキスト突合が本文内で完結する**。

### 56対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 同一であること（公開側停止画面の前提でCSRF観点ラベル） | bound | C-004（前面案内画面の再現性=手順6） (shared) |
| 002 | 公開側フロントの機能を一時停止し管理画面と管理者のみ利用可能にする状態であること | bound | C-005（.maintenance存在下でも管理画面パス除外＋token一致継続閲覧＋Cookie付与=状態の定義そのものを直接配置で実証。env切替不要） |
| 003 | 設定キーeccube_allow_maintenance_mode（環境変数ECCUBE_ALLOW_MAINTENANCE_MODE、既定0）であること | bound | C-002（debug:container実測） |
| 004 | 現在のメンテナンス状態を読み取り無効中は有効化ボタン有効中は無効化ボタンを表示すること | bound(要実機) | C-006 |
| 005 | 送信値に応じてメンテナンスモードを有効化もしくは無効化し同画面へリダイレクトしてフラッシュを表示すること | bound(要実機) | C-007＋C-008 (shared) |
| 006 | ルート条件が成立せず到達できないこと（許可フラグが偽の環境） | bound | C-001（現況env=falseで機械確認済み） |
| 007 | 503応答へ振り替わりメンテナンス中の案内画面を表示すること | bound | C-004 |
| 008 | カードに見出し「メンテナンスモード」と説明文を表示すること | bound(要実機) | C-006 |
| 009 | 必須バリデーションでエラーが表示され対象処理が完了しないこと | **excluded** EX-A | —（§9.2） |
| 010 | 必須バリデーションでエラーが表示されず対象処理を継続できること | bound(要実機) | C-007（入力ゼロでエラーなく有効化が継続=任意性の実証） (shared) |
| 011 | 本画面はモーダル、ポップアップ、確認ダイアログを表示しないこと | bound(要実機) | C-014 |
| 012 | 相関バリデーションでエラーが表示され対象処理が完了しないこと | **excluded** EX-C | —（§9.2） |
| 013 | 相関バリデーションでエラーが表示されず対象処理を継続できること | bound(要実機) | C-007 (shared)。相関バリ不存在の帰結として正規押下はエラーなく継続 |
| 014 | 相関バリデーションでエラーが表示されず対象処理を継続できること | bound(要実機) | C-007 (shared)。013と同文言 |
| 015 | 相関バリデーションでエラーが表示され対象処理が完了しないこと | **excluded** EX-C | —（§9.2。012と同一根拠） |
| 016 | DBとの相関バリデーションでエラーが表示されず対象処理を継続できること | **excluded** EX-B | —（§9.2） |
| 017 | DBとの相関バリデーションでエラーが表示され対象処理が完了しないこと | **excluded** EX-B | —（§9.2） |
| 018 | 管理画面向けの成功フラッシュとして登録すること（無効にしました前提） | bound(要実機) | C-008 |
| 019 | 更新内容の対象レコードの値が変更されること（前提=ただいまメンテナンス中です・トピック不一致=noise） | bound(要実機,C4) | C-007（正規有効化操作での代表positive事例） |
| 020 | 更新内容の対象レコードの値が変更されないこと（前提=大変お手数ですが…・トピック不一致=noise） | bound(要実機,C4) | C-010（非遷移on×onの代表negative事例） |
| 021 | 更新内容の対象レコードの値が変更されること（前提=M09-09-MSG-001＝直接一致） | bound(要実機) | C-007（有効化フラッシュ登録＝MSG-001と直接対応） |
| 022 | 管理画面_コンテンツ管理_メンテナンス管理画面に遷移すること（前提=M09-09-MSG-002＝直接一致） | bound(要実機) | C-008（無効化後のリダイレクト先＝MSG-002の後続処理と直接対応） |
| 023 | 更新内容の対象レコードの値が変更されること（前提=手動無効化の強制削除＝直接一致） | bound(要実機) | C-012 |
| 024 | 更新内容の対象レコードの値が変更されること（前提=利用可否の前提・generic noise） | bound(要実機,C4) | C-007（代表positive事例） |
| 025 | 更新内容の対象レコードの値が変更されないこと（前提=無効状態で送信値offが届く＝直接一致・md:212のエッジケース） | bound(要実機) | C-010（非遷移off×off） |
| 026 | 更新内容の対象レコードの値が変更されること（前提=有効状態で送信値onが届く＝直接一致だが極性がmd:213「変更しない」・実装(MC:50-63,else節0件)と逆方向） | **TBD(逆極性)**（R1是正Blocker①・R2是正で分類明確化・§9.3） | —（bound不可。design+実装が一致して示す実際の挙動＝on×onは無反応・不変であり、母集合の期待「変更される」を満たすbound手続きを構成できない。母集合行は改変せず、逆極性の実装挙動を期待の正にもしない。D6裁定待ち） |
| 027 | 更新内容の対象レコードの値が変更されないこと（前提=自動メンテナンス中に本画面で無効化＝直接一致だが極性がmd:214「強制削除される」・実装(MC:58,SS:168-181のforce=true固定)と逆方向） | **TBD(逆極性)**（R1是正Blocker①・R2是正で分類明確化・§9.3） | —（bound不可。design+実装が一致して示す実際の挙動＝モード不問の強制削除(変更される)であり、母集合の期待「変更されない」を満たすbound手続きを構成できない。D6裁定待ち） |
| 028 | 更新内容の対象レコードの値が変更されること（前提=目印ファイルへの書込・削除が失敗） | **TBD(polarity不明)**（R2是正で026/027の逆極性とは区別・§9.3） | —（bound不可だが026/027とは性質が異なる: 「逆方向であることが確認された」のではなく、md:215は失敗時の挙動を「共通例外処理に委ねる」と述べるのみで「変更される」を裏付ける記述はなく、かつMajor⑤の通り実装(SS:148-155,168-181)も例外・戻り値確認なしのため肯定・否定いずれの極性も一次資料から支持できない＝未規定。D6裁定待ち） |
| 029 | 実行結果の対象レコードの値が変更されること（前提=メンテナンス許可フラグが偽） | bound(要実機) | C-007（**前提列を無視した**代表positive事例。前提「偽」はルート到達不能を含意し期待「変更される」と直接には整合しないが、前提ラベルは設計書subject名の機械循環＝ノイズと扱い、期待テキスト自体（generic「変更される」）はenable成功という矛盾しない別シナリオでbindする。§10で明記） |
| 030 | メンテナンス状態はデータベースではなくファイルシステム上の目印ファイルで保持すること | bound(要実機) | C-007（有効化時にファイルが生成されDBは変更されないことを併せて確認） |
| 031 | 表示するボタンは画面表示時点の目印ファイル有無に基づくであること | bound(要実機) | C-006（無効中/有効中の両状態表示） |
| 032 | 自動メンテナンスの有効・無効タイミングは別機能の処理に従うであること | **excluded** EX-D' | —（§9.2。R1是正Blocker②: 委譲先探索の結果、プラグイン管理・自動メンテナンスに関する設計書・test_idは
リポジトリ全体に不存在と確認。「別機能で確認済み」とは主張せず「本機能の一次資料は発火タイミング・内部処理の実体を持たず、md:13,34,228で本設計書自身がスコープ外と宣言している事項につき本機能では直接検証不能」の限定理由に修正。委譲先が将来整備されればそちらでbound対象となるべきものであり、現時点で「偽陰性なし」とは言い切らない） |
| 033 | 本画面の切り替えは専用APIを呼び出さないこと | bound(要実機) | C-015 |
| 034 | サーバ側で目印ファイルを生成もしくは削除しメンテナンス管理画面へリダイレクトして成功フラッシュを表示すること | bound(要実機) | C-007＋C-008 (shared) |
| 035 | 削除条件の対象レコードが削除状態にならないこと（前提=失敗時出力＝直接一致） | **partial**（R1是正Major⑤・§9.3） | C-013（誘発手段未確立に加え、実装が例外・戻り値を確認せず`file_put_contents`/`unlink`を呼ぶのみのため「削除状態にならない」を裏付ける確認可能な手続きが無い。結果を断定せず観測記録に留める） |
| 036 | 実行結果の対象レコードが削除状態になること（前提=副作用・generic） | bound(要実機) | C-008（無効化=削除の代表事例） |
| 037 | 利用不可であること（前提=未認証） | bound | C-003 |
| 038 | 実行結果の対象レコードが削除状態になること（前提=許可フラグが偽） | bound(要実機) | C-008（**前提列を無視した**代表事例。前提「偽」はルート到達不能を含意し期待「変更される」と直接には整合しないが、前提ラベルはノイズと扱い、期待テキスト自体はdisable成功という矛盾しない別シナリオでbindする。§10で明記） |
| 039 | 管理画面の権限管理設定によりコンテンツ管理配下の表示・操作可否は別レイヤで制御されるであること | **excluded** EX-D' | —（§9.2。R1是正Blocker②: 委譲先`functions/pf-eccube3/m11-03_admin_system_setting_setting_system_authority.md`＋`IT-M11-03-*`87行は実在するが、(i)ec-cube-enterprise側は未文書化、(ii)87行中「コンテンツ管理配下」を具体的対象とする行は確認できず（汎用の拒否URL前方一致機構の検証のみ）。「別機能で確認済み」とは言い切らず、md:260「詳細は権限管理機能を正とする」宣言と委譲先の部分的実在は明記しつつ、対象範囲の直接的裏付け不足を限定理由とする） |
| 040 | 同一画面にメンテナンスモードのカードを表示であること | bound(要実機) | C-006 |
| 041 | 同一であること（前提=公開側停止画面・表示順ラベル） | bound | C-004 (shared) |
| 042 | 公開側フロントの機能を一時停止し管理画面と管理者のみ利用可能にする状態であること（002と同文言） | bound | C-005 (shared) |
| 043 | 設定キーeccube_allow_maintenance_mode（既定0）であること（003と同文言） | bound | C-002 (shared) |
| 044 | 現在のメンテナンス状態を読み取り無効中/有効中でボタン切替（004と同文言） | bound(要実機) | C-006 (shared) |
| 045 | 送信値に応じて有効化・無効化しリダイレクト・フラッシュ（005と同文言） | bound(要実機) | C-007＋C-008 (shared) |
| 046 | ルート条件が成立せず到達できないこと（006と同文言） | bound | C-001 (shared) |
| 047 | メンテナンス無効中はラベル「有効にする」で送信時にmaintenance=onを送ること | bound(要実機) | C-006 |
| 048 | 本画面はメンテナンス切り替え専用のJavaScriptを持たないこと | bound(要実機) | C-014 |
| 049 | 画面表示データでエラーが表示されず対象処理を継続できること | bound(要実機) | C-006 |
| 050 | 現在のメンテナンス状態・切替可否・権限・設定ファイル更新可否はサーバ側で判定すること | bound(要実機) | C-011（CSRF拒否試験がサーバ側判定の直接証拠） |
| 051 | 画面表示データでエラーが表示されず対象処理を継続できること（049と同文言） | bound(要実機) | C-006 (shared) |
| 052 | メンテナンス管理画面の表示時であること（カード見出しの表示条件） | bound(要実機) | C-006 |
| 053 | メンテナンス管理画面の表示時であること（説明文の表示条件） | bound(要実機) | C-006 |
| 054 | 管理画面向けの成功フラッシュとして登録すること（有効にしました前提） | bound(要実機) | C-007 |
| 055 | 見出しおよびページタイトルとして表示すること（ただいまメンテナンス中です） | bound | C-004 |
| 056 | 説明文として表示すること（大変お手数ですが…） | bound | C-004 |

`func_scope_check` 判定: 親56/56会計済み・欠落0・理由なし重複0・補完1行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**（内訳は下記56対応表の機械集計を正とする。
R2是正でfunc_scope_check判定段落と機械集計段落の二重記載を統合）。O6は主張しない。

**56対応表の機械集計（R1/R2是正後・本文における会計の唯一の集計箇所）**:
bound(非env-gated)＝{001,002,003,006,007,037,041,042,043,046,055,056}＝12件。
bound(要実機・通常)＝{004,005,008,010,011,013,014,018,019,020,021,022,023,024,025,029,030,
031,033,034,036,038,040,044,045,047,048,049,050,051,052,053,054}＝**33件**（026・027を除外し35→33）。
partial＝{035}＝**1件**（R1是正Major⑤で「不変」断定を撤回・要実機かつ結果polarity断定なし）。
TBD＝{026,027,028}＝**3件**（内訳はR2是正で分離。026・027=逆極性TBD／028=polarity不明TBD。§9.3参照）。
excluded＝{009,012,015,016,017,032,039}＝7件（032・039はR1是正Blocker②で限定理由に修正・件数は変更なし）。
12+33+1+3+7=**56**＝母集合件数と一致（grep実測56行・Python機械検算済み）。

候補ケース行総数**20**（§4.1 bound対応16＋§4.2 補完1＋§4.3 -EN 3。うち§4.1の16行がC-001〜C-016に
対応し、C-017は§4.2補完で母集合会計に非算入。R1是正Major⑥で「全21行」「候補ケース行総数17」の
誤記を是正）。

## §9 TBD・要実機・excluded（正直な分離）

### §9.1 要実機・実行保留（bound内の保留マーク）

| 対象 | 理由 |
|---|---|
| 004・005・008・010・011・013・014・018〜025・029〜031・033・034・036・038・040・044・045・047〜054→C-006〜C-012,C-015 | **env切替（`ECCUBE_ALLOW_MAINTENANCE_MODE=1`）が必要**（現況実測=false・`.env:62`）。`MaintenanceController::index`・`disableMaintenance`の両ルートに`condition: isMaintenanceModeAllowed()`が付き（MC:37,82）、現況では両ルートともコントローラへ到達しない（Symfonyのルーティング条件はコントローラ実行前に評価されるため）。env切替後の実機で、非force分岐・トークン形式・Cookie発行タイミングのレースを較正する必要がある |
| 035→C-013（**partial**。R1是正Major⑤） | 目印ファイルの書込・削除失敗を誘発する手段が一次資料に規定なし（md:215は「アプリの共通例外処理に委ねる」と述べるのみで誘発条件を規定しない）。加えて`.maintenance`の親ディレクトリは`APP_ROOT`直下（`/var/ec-cube`）そのものであり、m09-05のC-023（対象が`html/user_data/assets/css`という末端dir）と異なり、権限操作がアプリ全体に波及するリスクが高い。**さらに`enableMaintenance`/`disableMaintenanceNow`は`file_put_contents`/`unlink`を例外・戻り値確認なしで呼ぶのみ（SS:148-155,168-181実引き）のため、失敗時に「変更されない」という035の期待を裏付ける一次資料上の根拠が無い**。誘発手段の確立と併せ、結果polarityも実機観測で確認する対象とし、本草案では断定しない（partial） |
| C-017（補完） | ログ観測手段未契約。L1-017は設計書由来でコード立証なし |
| fs.ts接続定数 | **実測確定済み**（§6.2.1: コンテナ稼働・`.maintenance`パス・`eccube_allow_maintenance_mode`現況=debug:container実測）。env切替不要な範囲（C-001〜C-005,C-016）はこの実測のみで候補として成立する |
| -EN 3行 | D15（管理画面en切替）待ち＋env切替（要実機）の両方が前提 |

### §9.3 TBD（母集合矛盾・未解決。R1是正Blocker①で新設・R2是正で026/027と028を分類分離）

母集合026・027・028は前提ラベルが指す具体的シナリオと期待テキストの極性を検討した結果、いずれもboundは
できないが、**性質が異なる2種類**であることが判明した（R2是正で明確化・両者を一括で「逆極性」と扱わない）。

- **逆極性TBD（026・027）**: 前提ラベルが指すシナリオについて、**設計書と実装が一致して示す実際の挙動**
  （＝この2点は互いに矛盾しないため「設計・実装矛盾」ではない）が確認でき、それが母集合の期待テキストの
  極性と**確認可能な形で正反対**である。
- **polarity不明TBD（028）**: 前提ラベルが指すシナリオ（書込・削除失敗）について、設計書(md:215)は
  「共通例外処理に委ねる」と述べるのみで結果を規定せず、実装(`enableMaintenance`/`disableMaintenanceNow`)も
  `file_put_contents`/`unlink`を例外・戻り値確認なしで呼ぶのみ（SS:148-155,168-181）のため、母集合の期待
  「変更される」を**支持する一次資料も、逆方向（変更されない）を確認できる一次資料も存在しない**＝
  「逆方向であることが判明した」わけではなく、単に**未規定**である。

いずれも「テストケースが正の原則」に従い、母集合行そのものは改変せず、また実装挙動を期待の正として
母集合を反転bindすることもしない。026/027は矛盾を解消する手続きが存在しないため、028は支持する手続きが
構成できないため、ともにboundから外しTBD（D6裁定待ち・未解決）として分離する。

| No | 前提ラベルが指すシナリオ | 母集合の期待（極性） | 設計書+実装が一致して示す実際の挙動 | 判定 |
|---|---|---|---|---|
| 026 | 有効状態で送信値onが届く（on×on非遷移） | 「変更される」（positive） | md:213「同上。状態を変更しない。」／`MaintenanceController.php:50-63`はif/elseifのみでelse節0件＝当該入力は**いずれの分岐にも該当せず無反応**（L1-006） | 逆方向＝bind不可。TBD |
| 027 | 自動メンテナンス中に本画面で無効化 | 「変更されない」（negative） | md:214「モード不問で強制削除される」／`disableMaintenanceNow('', true)`は`force=true`固定のため`currentMode===mode`を問わず**強制的にunlinkする**（L1-010） | 逆方向＝bind不可。TBD |
| 028 | 目印ファイルへの書込・削除が失敗 | 「変更される」（positive） | md:215は「アプリの共通例外処理に委ねる」と述べるのみで結果を規定せず。実装も例外・戻り値確認なしの直呼出（SS:148-155,168-181）のため「変更される」を裏付ける一次資料上の根拠が無い（Major⑤） | 支持する記述・実装挙動いずれも確認できず＝bind不可。TBD |

**偽陰性の有無**: 026・027が指す実際のシナリオ（on×on非遷移・自動メンテナンス中の強制無効化）自体は、
それぞれ母集合020（on×off系の非遷移代表・§10）およびC-012（027とは異なる母集合023経由）で別途boundされて
おり、当該シナリオの実挙動自体が母集合から一切検証されなくなるわけではない。ただし026・027**自身の
test_idとしては**boundに算入せず、期待テキストとの整合はD6裁定に委ねる。028については代替となる
「書込・削除失敗」を検証する他の母集合行は無く、C-013はpartial（035）としてのみ実機観測の対象とする。

### §9.2 §9-EX excluded per-ID表（全7件・実引き根拠。範囲一括でなく各IDを個別に正当化）

根拠の実引き:
(a) **必須バリデーション不存在**: フォームは`createBuilder(FormType::class)`の空フォームで項目add呼出0件
（MC:43-44全文実引き）。「本画面は利用者が値を入力するテキスト欄・ラジオ・トグルは持たない。」（md:93）＝
必須制約を課す対象項目が存在せず、必須エラーを表示する層（HTML5 required・サーバNotBlank）がいずれも
構成不能。
(b) **DB不使用**: 「メンテナンス状態はデータベースではなくファイルシステム上の目印ファイルで保持する。」
（md:9,199）。`isMaintenanceMode()`は`file_exists`のみ（SS:186-190）。`MaintenanceController`・
`SystemService`にRepository/Doctrine業務参照0件（`SystemService`が注入する`EntityManagerInterface`は
`getDbversion()`専用でメンテナンス操作に不使用=SS:14-79実引き）。
(c) **相関バリ不存在＋エラー表示層不存在**（m09-08 EX-Cの先例踏襲）: 入力項目ゼロ（根拠a）のため項目間の
相関バリデーションは定義不能。実在するサーバ側検証はFormType既定のCSRFトークン検証のみ（MC:39実引き）だが、
「エラーが**表示され**」の要件を満たす表示層が不存在＝本画面は専用の失敗文言を持たず（md:283「本画面専用の
フォールバック文言は設けない」）・twigに`form_errors`描画なし（twig:1-55全文実引き0件）・成否は完了
フラッシュの**有無**でしか区別しない。**本画面には専用JSも無く**（md:92）、m09-05のような読み替え先
（クライアント注釈制御等）も存在しない＝救済先なし。
(d) **本設計書スコープ外・委譲先の実在状況が異なる2件**（R1是正Blocker②で個別に再検証）:
md:13,34「プラグインのインストール・有効・無効・削除時に自動で切り替わる自動メンテナンス…の発火条件と
内部処理」は「本書で扱わないこと」に明記。md:260「詳細は権限管理機能を正とする」も同様に別レイヤへの
委譲を明示。**ただし委譲先の実在は個別に異なる**（下表032・039参照）ため、両者を一律に「EX-D=他機能で
確認済み」と扱わず、それぞれの実証状況に応じた限定理由を付す（EX-D'）。

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 009 | EX-A | 「必須バリデーションでエラーが表示され、対象処理が完了しないこと。」→必須制約の対象項目が全層に不存在（根拠a）のためエラー側は構成不能。**肯定側（010=エラーなく継続）はC-007でboundし偽陰性を防止** |
| 012 | EX-C | 「相関バリデーションでエラーが表示され、対象処理が完了しないこと。」→相関バリ不存在かつエラー表示層不存在（根拠c）で「エラーが表示され」が構成不能。**CSRF拒否（切替されない側）の実挙動は050がC-011でbound済み・肯定側（013/014=エラーなく継続）もC-007でbound済み=偽陰性なし** |
| 015 | EX-C | 012と同一根拠 |
| 016 | EX-B | 「DBとの相関バリデーションでエラーが表示されず…」→DB自体を使わない（根拠b）ため「DBとの相関」検証は構成不能 |
| 017 | EX-B | 「DBとの相関バリデーションでエラーが表示され…」→同上 |
| 032 | EX-D' | 「自動メンテナンスの有効・無効タイミングは別機能の処理に従うであること。」→**委譲先を実際に探索した結果（Explore調査実施）、`functions/ec-cube-enterprise/`配下にプラグイン管理・自動メンテナンス切替を扱う設計書は不存在、`all_it_cases.tsv`にも対応するtest_idは0件と確認済み。「委譲先で確認済み」とは主張しない。**md:13,34,228で本設計書自身がこの発火タイミング・内部処理をスコープ外と宣言しており、本機能の一次資料はその実体（発火条件のロジック）を持たないため、**本機能では直接検証不能**という限定理由に修正する（=将来委譲先の設計書が整備されればそちらでbindされるべき対象。現時点でどの母集合でもこの内容が検証されているという確証は無い） |
| 039 | EX-D' | 「管理画面の権限管理設定により、コンテンツ管理配下の表示・操作可否は別レイヤで制御されるであること。」→**委譲先を実際に探索した結果、`functions/pf-eccube3/m11-03_admin_system_setting_setting_system_authority.md`（権限管理）が実在し、`all_it_cases.tsv`にも`IT-M11-03-*`87行が実在することを確認した（Explore調査実施）。ただし(i) ec-cube-enterprise側に同名文書は無くm11-03文書自身が「ec-cube-enterprise側実装は未文書化」と明言、(ii) 87行を`grep`で照合した限り「コンテンツ管理配下」を具体的対象とする行は確認できず（汎用の拒否URL前方一致機構の検証のみ）。委譲先は部分的に実在するが、母集合039が主張する「コンテンツ管理配下」への適用という具体的内容の直接的裏付けとしては不十分**であり、「別機能で確認済み」「偽陰性なし」とは言い切らない。本機能の一次資料（`MaintenanceController`単独）はこの判定ロジックの実体を持たないため除外は維持するが、根拠は限定的なものと明記する |

**偽陰性防御の明示**: 相関バリデーション4行のうち肯定側2行（013・014）は「エラーが表示されず継続」が
正規操作で文字通り成立するため再解釈なしのbound。拒否側2行（012・015）はエラー表示要件を満たせず
excluded（EX-C）とするが、CSRF拒否の実挙動そのもの（分岐に入らず・フラッシュなし・ファイル操作なし・
同一ビュー再描画）は母集合050がC-011で完全boundしており、012/015の除外によって検証されない実挙動は
発生しない（偽陰性なし）。**EX-D'（032・039）については上記の通り委譲先の実在状況が異なり、039は委譲先が
部分的に実在するものの対象範囲の具体的裏付けは不足、032は委譲先自体が不存在であるため、いずれについても
「偽陰性なし」とは言い切らない**（R1是正Blocker②）。妥当性はD6/正式化時に再裁定する（隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 009/010（必須: 完了しない/継続） | 009=拒否側→**excluded**（必須不存在=構成不能）／010=成功側→C-007 | 拒否側を安易に「エラーが出ない」へ反転bindしない |
| 012〜017（相関/DB相関: エラー/継続） | 012,015=拒否側→**excluded EX-C**／013,014=成功側→C-007／016,017=**excluded EX-B**（DB不使用） | 拒否側を反転・読み替えbindしない。CSRF拒否の実挙動は050→C-011で完全bound済み=偽陰性なし |
| 019〜025・029〜031・036・038（更新内容/実行結果: 変更される/されない・削除状態になる/ならない） | 前提ラベルと期待テキストの対応が強い行（021=MSG-001,022=MSG-002,023=手動無効化,025=無効状態off）はその前提が指す実際のシナリオへ直接bind。**前提ラベルが期待テキストと無関係かgenericな行（019,020,024,029,038）は、前提列を明示的にノイズとして無視した上で**、代表事例（C-007=positive／C-010=negative／C-008=positive）へbindする（§10で「前提列を無視した」旨を明記） | 019・021・024・030: 前提が薄い/直接一致のいずれも期待「変更される」はC-007（enable成功）で矛盾なくbind可能。020: 前提が薄く期待「変更されない」はC-010（on×on非遷移）でbind。025: 前提「無効状態でoffが届く」（off×off非遷移）はmd:212と直接一致・C-010でbind。023: 前提「手動無効化の強制削除」はmd:201,214と直接一致・期待「変更される」もmd:214（強制削除=変更される）と整合＝矛盾なし・C-012でbind。029・038: 前提「許可フラグが偽」はルート到達不能を含意し期待「変更される」と字義上は整合しないが、**前提列はノイズとして明示的に無視**し、期待テキスト自体（generic「変更される」）はC-007/C-008の正規シナリオで矛盾なく実証する（前提の飛躍は§8本表に注記済み・偽陰性なし）。031・036: 前提「画面表示との整合」「副作用」は期待と対応し、それぞれC-006・C-008で直接bind |
| **026/027（前提の指すシナリオと期待テキストの極性が設計書+実装と確認可能な形で逆方向のため bound不可＝TBD逆極性。R1是正Blocker①・R2是正で028と分類分離）** | 前提の指すシナリオは正しく特定できる（026=on×on非遷移／027=自動メンテナンス中の無効化）が、期待テキストの極性が設計書と実装が一致して示す実際の挙動と**確認可能な形で**逆であり、bindする手続きを構成できない。**母集合行は改変せず、逆方向の実装挙動を期待の正にもしない**＝§9.3でTBD（逆極性・D6裁定待ち）として分離した | 026: 期待「変更される」はmd:213「同上=変更しない」およびMC:50-63（else節0件=無反応）と逆方向。027: 期待「変更されない」はmd:214「モード不問で強制削除される」およびSS:168-181（force=true固定）と逆方向。いずれも§8対応表・§9.3で機械的に同一の理由を記録済み |
| **028（前提の指すシナリオ=書込・削除失敗について、期待テキストの極性を支持する記述も否定する記述も一次資料に無くbind不可＝TBD polarity不明。R2是正で026/027の逆極性とは別分類）** | 026/027とは異なり「逆方向であることが確認された」のではない。md:215は結果を規定せず、実装(`enableMaintenance`/`disableMaintenanceNow`)も`file_put_contents`/`unlink`を例外・戻り値確認なしで呼ぶのみ（SS:148-155,168-181）のため、期待「変更される」を支持する一次資料も否定する一次資料も存在しない未規定状態。**母集合行は改変せず、いずれの極性も期待の正と断定しない**＝§9.3でTBD（polarity不明・D6裁定待ち）として分離した | 028: 期待「変更される」を裏付ける記述・実装挙動のいずれも一次資料に無い（Major⑤で「不変」側の断定も撤回済み）。§8対応表・§9.3で機械的に同一の理由を記録済み |
| 002/042「一時停止し…利用可能にする状態」 | 状態の定義記述 | 前提「メンテナンスモードを試験できる状態である」は循環（対象そのものを前提にする=ノイズ）。期待テキストが記述する状態自体を、.maintenance直接配置による前面503確認＋admin pathが503判定の対象外であること（＝「常時到達」ではなく「503にならない」の限定表現。R1是正Major③）＋token一致継続＋Cookie付与（C-005）で直接実証する。env切替を要する管理画面のトグル操作を経由しなくても、この状態定義はfs.ts直接配置で成立確認できる（html/index.php:74-93・MaintenanceListener.php:38-56がいずれも`eccube_allow_maintenance_mode`を参照しない=実引き） |
| 001/041「同一であること」 | 前提=公開側停止画面 | 観点ラベル（CSRF／表示順）は無関係なノイズ。期待テキスト自体が指す検証内容は「同一内容が繰り返し表示される」という静的ページの再現性チェックと解釈し、C-004の手順6（2回目GETの本文一致）で実証する |
| 011/048（モーダル/JS） | 肯定（〜を表示しない/持たない） | 双方ともmd:90,92を直接引用する素直な肯定claimであり、前提と期待の矛盾なし。C-014で一括実証 |
| 030「状態の保存先」・031「画面表示との整合」 | 定義/整合の記述 | 前提ラベルは対象文そのものの言い換え（循環）で実質的にノイズではないが、単独の観測対象としては薄いため、C-007（生成観測時にDB非変更を併記）・C-006（表示時点のファイル有無に基づくボタン切替を併記）へ統合してbindする |
| 037「利用不可であること」 | 前提=未認証 | 現況env=false下では条件不成立による到達不能（=利用不可）が既に成立しており、C-003としてenv切替なしでbind可能。env=1到達時の「admin_loginへの明示的リダイレクト」という、より詳細な観測は別途要実機（本表では過大に主張しない） |

機械検査結果（工程6自己検査・実施済み・R1/R2是正反映）: §8参照ケースIDの§4実在=全一致（C-001〜C-017・
-EN 3行）／会計は**§8の対応表を唯一の集計箇所**とし（内訳bound(非env-gated)/bound(要実機)/partial/TBD/excludedの合計=母集合56件・差分0を§8で機械実証済み）本§では数値を再掲しない
（grep実測56行・Python機械検算済み）／補完1行は親空で母集合会計外／oracle.json草案は本md§1から機械導出・
**claim数24一致**（R1是正でL1-M0909-024を追加）／L1参照の逐語quoteは一次資料file:lineと突合済み
（`docker exec`実測・`eccube_nav.yaml`実測含む）。029・038の前提・期待の飛躍は前提列をノイズとして
明示的に無視した旨を本表と§8対応表の両方に記録した。026・027は設計書+実装と**確認可能な形で逆極性**の
ためboundから外しTBD(逆極性)（§9.3）へ、028は肯定・否定いずれの極性も一次資料から支持できない
**未規定**のためTBD(polarity不明)（§9.3）へ、それぞれ別分類でTBDへ分離した（R2是正で026/027と028を
一括の「逆極性」と扱わないよう是正・要修正①）。035は結果polarity断定不能のためpartialへ降格した
（R1是正Major⑤）。032・039のEX-D'は委譲先の実在状況（032=不存在／039=部分的に実在するが対象範囲の
裏付け不足）を明記し、「別機能で確認済み」「偽陰性なし」とは言い切らない（R1是正Blocker②）。C-005/C-007の
Cookie確認手順は実装定数`SystemService::MAINTENANCE_TOKEN_KEY`＝`maintenance_token`に統一した
（R2是正・要修正②）。§8機械集計段落の重複記載は統合し会計数値は不変（R2是正・要修正③）。未検出の
極性取り違えが残る可能性は否定しない（codex敵対レビューで再検証されたい）。
