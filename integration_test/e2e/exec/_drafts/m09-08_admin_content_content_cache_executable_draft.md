# B0候補: m09-08 キャッシュ管理 — 実行可能グレード候補（母集合56全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正（Blocker1=012/015のCSRF読み替え過剰／Major2=C-005 fresh分岐回避が非決定的・
> DOC-DRAFT-1片側断定）→R1是正版（本版）**（009/016/017 excluded・052 TBD・DOC-DRAFT-2/3・opcache実行保留・
> sha1/行番号照合はR1で妥当承認。捏造なし）
> R1是正: **(1) 012/015を読み替えboundからexcluded（EX-C）へ移動**（相関バリ不存在かつ「エラーが表示され」の
> 表示層が実装上構成不能・m09-05と異なり読み替え先のクライアント検証も無い=救済先なし。§9.2 per-ID実引き。
> 会計=bound完全50＋読替0＋TBD1＋excluded5=56へ再計算・機械実証）
> **(2) C-005の事前条件を決定化**（ウォームアップGETでは同一秒でfresh分岐が残る=vccc:124は秒精度比較。
> `ensureStale()`＝コンテナファイルmtime実測→現在epoch秒がmtimeより**厳密に大きい**ことを確認・同一秒なら
> 待機再実測、を契約化。「全消去がスキップ」表現を「旧dir退避（rename）→削除が行われない場合がある
> （分岐前のcacheClearer->clear=vccc:107自体は実行される）」へ正確化）
> **(3) DOC-DRAFT-1を「設計書側の誤記と推定」から未解決の設計・実装矛盾へ是正**（どちらが正かはD6裁定・
> 実装を期待の正にしない）。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-05_admin_content_content_css_executable_draft.md`（候補確定・fs.ts再利用契約の正典）／
> `m09-01_admin_content_content_news_executable_draft.md`（候補確定）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-08_admin_content_content_cache_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）には書かない**。
> **本機能の特性**: ボタン操作でアプリケーションキャッシュを一括削除する**破壊系だが対象は環境キャッシュ**
> （業務データ不変=md:163・DBスキーマなし=md:9,192）。削除は**予約→レスポンス送出後のTERMINATEで
> `cache:clear --no-warmup`実行**（CU:47-50,61-81,209-213）。入力フォーム項目ゼロ（トークンのみ=md:85,144）。
> 観測は（i）画面（フラッシュ・同一画面再描画・解除JS有無）（ii）fs.ts（kernel.cache_dir内マーカー消滅・
> `.maintenance`ファイル生成/消滅）に限定。**opcache等のプロセス内キャッシュ・削除コマンド失敗系・
> メンテ有効フロー（env切替）は観測手段/誘発手段が未確定のため要実機/実行保留で正直に分離**（捏造ゼロ）。
> キャッシュは再生成可能な派生物のため**S0スナップショット同値の復元は課さない**（原状回復対象外と明示。
> 代わりにマーカー使い捨て＋afterEach冪等クリーンアップ＋`.maintenance`のPRE不存在復帰=§2）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md`（291行・最終コミット ec17cd0・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`／symfony/framework-bundle v7.4.3（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁）: CacheController.php=`ea27a168d5b5`／CacheUtil.php=`b75aa6660577`／
  cache.twig=`0f093c1fe62c`／MaintenanceController.php=`fd3a256a7970`／SystemService.php=`bf4959149532`／
  ControllerConditionService.php=`1475f76e8977`／messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／
  eccube.yaml=`15ea9fd66c6f`／default_frame.twig(admin)=`d4cc70df1a48`／AbstractController.php=`1a67393cd162`／
  security.yaml=`35e8ff7ec021`／vendor CacheClearCommand.php=`6a918ce65418`。
- fid_kubun.tsv（D1）: `M09-08｜標準｜standard-src+design｜区分不明=0`（fid_kubun.tsv:320実引き確認済み）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`）M09-08全**56行**
  （IT-M09-08-ADMIN-CONTENT-CONTENT-CACHE-001〜056。col1完全一致grepで56行=機械確認済み）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環）。bindは各行の
  **「期待結果」実テキスト**で判定（§8に全56行の期待要旨併記。前提と期待の矛盾はC4=§10で記録）。

パス表記: CC=`src/Eccube/Controller/Admin/Content/CacheController.php`／CU=`src/Eccube/Util/CacheUtil.php`／
twig=`src/Eccube/Resource/template/admin/Content/cache.twig`／MC=`src/Eccube/Controller/Admin/Content/MaintenanceController.php`／
SS=`src/Eccube/Service/SystemService.php`／CCS=`src/Eccube/Service/ControllerConditionService.php`／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／
eyml=`app/config/eccube/packages/eccube.yaml`／sec=`app/config/eccube/packages/security.yaml`／
AC=`src/Eccube/Controller/AbstractController.php`／dft=`src/Eccube/Resource/template/admin/default_frame.twig`／
vccc=`vendor/symfony/framework-bundle/Command/CacheClearCommand.php`（v7.4.3）／
md=`functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md`。

## §1 L1原子オラクル表（22claim・全行逐語+file:line）

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0908-001 | auth_rule | 未認証は管理ログインへ誘導され本画面へ到達しない（GET/POSTとも） | 「未認証｜利用不可。管理領域の認証要件に従いログインへ誘導される。」／`pattern: ['^/%eccube_admin_route%/',…] … login_path: admin_login` | md:73,209-212／sec:41-46 | 0 |
| L1-M0908-002 | http_status | キャッシュ管理はGET/POST同一ルート `/%eccube_admin_route%/content/cache`（name=admin_content_cache）。GET=HTTP200で画面表示・**この時点ではキャッシュ削除を行わない** | `#[Route(path: '/%eccube_admin_route%/content/cache', name: 'admin_content_cache', methods: ['GET', 'POST'])]`／「3. この時点ではキャッシュ削除を行わない。」（clearCache呼出はisSubmitted&&isValid分岐内のみ=CC:37-49実引き） | CC:29-31,37-49／md:70,101-103 | 0 |
| L1-M0908-003 | display_field | ページタイトル「キャッシュ管理」/"Caches"・サブタイトル「コンテンツ管理」/"Contents"・カード見出し「キャッシュ管理」/"Caches" | `{% block title %}{{ 'admin.content.cache_management'\|trans }}{% endblock %}`／`{% block sub_title %}{{ 'admin.content.contents_management'\|trans }}{% endblock %}`／`<span class="card-title">{{ 'admin.content.cache__card_title'\|trans }}</span>` | twig:15-16,40／ja:2855,2847,2944／en:2542,2534,2631／md:81 | 1 |
| L1-M0908-004 | message | 説明文「本番環境にFTPなどでTwigファイルをアップロードして入れ替えた場合、画面を反映させるにはTwigキャッシュを削除する必要があります。」/"If you replaced the Twig file on the production server with FTP etc, the UI will not be updated unless you delete the Twig cache." | `<span>{{ 'admin.content.cache_message'\|trans }}</span>` | twig:46／ja:2945／en:2632／md:81 | 1 |
| L1-M0908-005 | display_field | 「キャッシュ削除」/"Delete Cache"ボタン（type=submit・`btn btn-ec-conversion`）。管理画面共通のカード装飾（`card rounded border-0`）内に配置 | `<button type="submit" class="btn btn-ec-conversion">{{ 'admin.content.cache_delete'\|trans }}</button>`／`<div class="card rounded border-0 mb-4">` | twig:37,51／ja:2946／en:2633／md:81,83 | 1 |
| L1-M0908-006 | display_field | 入力欄なし: フォームは空のFormType（項目0）でトークンのみ。画面のフォームは`form[_token]`（hidden）1つ・action=同一URLへPOST。POST bodyは`form[_token]`のみ | `$builder = $this->formFactory->createBuilder(FormType::class); $form = $builder->getForm();`（項目add呼出0件=CC:33-34実引き）／`<form method="post" action="{{ url('admin_content_cache') }}"> {{ form_widget(form._token) }}`／「本画面は利用者が値を入力するフォーム項目を持たない。」「POST要求（なりすまし対策トークンのみを伴う）」 | CC:33-34／twig:32-33／md:85,144,183,200 | 0 |
| L1-M0908-007 | message | 削除受付の成功フラッシュ「削除しました」/"Deleted"（admin.common.delete_complete・成功種別=eccube.admin.success・管理画面上部） | `$this->addSuccess('admin.common.delete_complete', 'admin');`／`$this->addFlash('eccube.'.$namespace.'.success', $message);` | CC:48／AC:107-110／ja:1593／en:1638／md:124 | 1 |
| L1-M0908-008 | http_status | POST成功時は**リダイレクトせず**同一画面（同一URL）をHTTP200で再描画し、フラッシュを同一応答内に表示。別画面へ遷移しない | `return ['form' => $form->createView(),];`（redirectToRoute呼出0件=CC:31-54実引き・`#[Template(template: '@admin/Content/cache.twig')]`）／「同一のキャッシュ管理画面を再表示し…別画面へは遷移しない。」 | CC:30,51-54／md:112,221,224 | 0 |
| L1-M0908-009 | fs_effect | ボタン押下時は**削除の予約のみ**（clearCache=フラグ設定・コマンド未実行）。実削除はレスポンス送出後のKernelEvents::TERMINATE（forceClearCache）で`cache:clear --no-warmup --no-ansi`を内部実行 | `public function clearCache(?string $env = null): void { $this->clearCacheAfterResponse = $env; }`／`$command = ['command' => 'cache:clear', '--no-warmup' => true, '--no-ansi' => true,];`／`return [KernelEvents::TERMINATE => 'forceClearCache'];` | CU:47-50,61-81,209-213／CC:42／md:110,140 | 0 |
| L1-M0908-010 | fs_effect | 削除対象=アプリケーションキャッシュ全体（kernel.cache_dir。コンテナ実測 `/var/ec-cube/var/cache/dev`・build_dir同値）。cache:clearは非fresh経路で実キャッシュdirを退避リネーム→新dirへ差し替え→旧dirを削除するため、**cache_dir直下に置いた任意ファイル（マーカー）は消える**。※「Cache is fresh」分岐（vccc:124=`REQUEST_TIME <= filemtime(containerFile)`の**秒精度**比較）が成立すると**旧dir退避（rename）→削除が行われない場合がある**（分岐前の`cacheClearer->clear($realCacheDir)`=vccc:107自体は実行されるが、これはカスタムclearer群の実行でありcache_dir全体の削除ではない）=観測成立条件は**コンテナファイルmtime＜POSTのREQUEST_TIMEの厳密大小**（`ensureStale()`=§6.2.2で決定化・§9.1） | `$realCacheDir = $kernel->getContainer()->getParameter('kernel.cache_dir');`／`$this->cacheClearer->clear($realCacheDir);`／`if ($_SERVER['REQUEST_TIME'] <= filemtime($containerFile) && filemtime($containerFile) <= time()) { … 'Cache is fresh.' … } else { … $fs->rename($realBuildDir, $oldBuildDir); … $fs->rename($warmupDir, $realBuildDir); … $fs->remove($oldCacheDir);`／「Symfonyのキャッシュ削除コマンドにより、アプリケーションキャッシュ全体を削除する。」 | vccc:75-80,107,124-133,161-190／CU:64-68／md:138／kernel.cache_dir=debug:container実測(§6.2.1) | 0 |
| L1-M0908-011 | fs_effect | コマンド実行に続けて opcache_reset・apc_clear_cache('user')/apc_clear_cache()・wincache_ucache_clear を**それぞれfunction_existsが真の環境でのみ**実行（**プロセス内キャッシュの観測手段未契約=実行保留**） | `if (function_exists('opcache_reset')) { opcache_reset(); } if (function_exists('apc_clear_cache')) { apc_clear_cache('user'); apc_clear_cache(); } if (function_exists('wincache_ucache_clear')) { wincache_ucache_clear(); }` | CU:83-94／md:139,152 | 0 |
| L1-M0908-012 | fs_effect | `eccube_allow_maintenance_mode === true` のときのみ削除予約前に自動メンテナンスモードへ切替=`.maintenance`ファイル生成（内容`auto_maintenance:ランダム32文字トークン`。**既にメンテ中なら生成しない**=SS:150の非force分岐）。無効時はメンテ操作なし。パス=`eccube_content_maintenance_file_path`（env既定`%kernel.project_dir%/.maintenance`=コンテナ実測`/var/ec-cube/.maintenance`）。**設定既定は無効**（.env:62=`0`・コンテナ実測Processed=false） | `if ($this->eccubeConfig->get('eccube_allow_maintenance_mode') === true) { $systemService->switchMaintenance(true); }`／`if ($force \|\| !$this->isMaintenanceMode()) { … $token = StringUtil::random(32); \file_put_contents($path, "{$mode}:{$token}"); }`／`env(ECCUBE_MAINTENANCE_FILE_PATH): '%kernel.project_dir%/.maintenance'` | CC:38-40／SS:117-124,148-155／eyml:22,251,304／.env:62／md:60,109,141,151 | 0 |
| L1-M0908-013 | message | 設定有効時のみフラッシュ種別`eccube.admin.disable_maintenance`を**空文字**で登録（画面に文言を表示しない内部フラグ。解除用JSの発火条件） | `if ($this->eccubeConfig->get('eccube_allow_maintenance_mode') === true) { $this->addFlash('eccube.admin.disable_maintenance', ''); }`／「メンテナンス解除フラグのフラッシュは画面に文言を表示しない。空文字で登録し…内部フラグとして用いる。」 | CC:44-46／md:111,125,128 | 0 |
| L1-M0908-014 | fs_effect | 解除JS: 当該フラグのフラッシュが存在**かつ**設定有効のときに限り、応答ページのscriptブロックがページ読込時に`admin_disable_maintenance`（mode=auto_maintenance）へ非同期POSTを**1回**送る。それ以外ではscriptブロック自体を出力しない（本画面専用JSなし） | `{% if app.flashes('eccube.admin.disable_maintenance') and eccube_config.eccube_allow_maintenance_mode == true %} <script nonce="{{ csp_nonce }}"> $(function() { $.post("{{ url('admin_disable_maintenance', { 'mode': 'auto_maintenance' }) }}"); }) </script> {% endif %}` | twig:18-27／md:82,91 | 0 |
| L1-M0908-015 | fs_effect | 解除エンドポイント効果: `POST /%eccube_admin_route%/disable_maintenance/{mode}`（mode=manual\|auto_maintenance\|auto_maintenance_update）。**ルート条件=`eccube_allow_maintenance_mode===true`のときのみ成立**（CCS:26-29）。auto_maintenanceは応答後TERMINATEで`.maintenance`をモード一致時にunlink（=自動メンテ解除）・応答は`{"success":true}`。XHRのCSRFトークンは管理共通ajaxSetupのECCUBE-CSRF-TOKENヘッダ（**エンドポイント内部仕様の詳細はmd:34で対象外=解除効果とルート成立条件のみ主張**） | `#[Route(path: '/%eccube_admin_route%/disable_maintenance/{mode}', … condition: "service('controller_condition_service').isMaintenanceModeAllowed()")]`／`return $this->eccubeConfig->get('eccube_allow_maintenance_mode') === true;`／`if ($force \|\| $currentMode === $mode) { \unlink($path); }`／`$.ajaxSetup({ 'headers': { 'ECCUBE-CSRF-TOKEN': …` | MC:82-105／CCS:26-29／SS:141-146,162-181／dft:16,83-87／md:62,72,114 | 0 |
| L1-M0908-016 | security_rule | CSRF: トークン不正/欠落POSTはisValid不成立→**削除を予約せず・メンテナンスモードも操作せず・完了フラッシュも登録せず**、同一画面をHTTP200で再描画。成否は完了フラッシュの有無で区別（本画面専用の失敗文言なし。twigにform_errors描画なし=エラー文言は画面に出ない） | `if ($form->isSubmitted() && $form->isValid()) {`（全副作用が当分岐内=CC:37-49実引き）／「なりすまし対策トークンが不正・欠落｜キャッシュ削除を予約せず、メンテナンスモードも操作しない。削除完了のフラッシュも登録せず画面を再表示する。」「削除完了のフラッシュを表示しないことで成否を区別する。」 | CC:37-49／twig:31-60（form_errors 0件）／md:108,150,185,232 | 0 |
| L1-M0908-017 | display_field | モーダル・確認ダイアログ・トーストを持たない。削除前の確認ダイアログなし=ボタン押下で即送信 | 「本画面はモーダル、確認ダイアログ、トーストを表示しない。削除前の確認ダイアログは持たず、ボタン押下で即送信する。」（twig:31-60全文にmodal/dialog/toast要素0件・submitボタン直結=実引き） | md:84／twig:31-60 | 0 |
| L1-M0908-018 | api | 外部API呼出なし（解除POSTは同一アプリ内管理エンドポイント）・業務データ（商品・会員・受注）不変・業務テーブルへ保存しない | 「本機能は外部APIを呼び出さない。」「業務データは変更しない。」「業務テーブルへ保存しないため、DBスキーマを持たない。」（CC:31-54にEntityManager書込・Repository呼出0件=実引き） | md:9,163,171,192／CC:24-54 | 0 |
| L1-M0908-019 | log | 削除コマンドの実行出力はBufferedOutputへ収集し**画面へ返さない**（応答に反映しない）。追加の業務監査ログなし（**サーバログ側の観測手段未契約=画面否定観測のみbound・残余は実行保留**） | `$output = new BufferedOutput(…); $console->run($input, $output); … return $output->fetch();`／「削除コマンドの出力は画面へ返さない。」「業務監査ログとして追加で記録する処理は持たない。」 | CU:76-81,96／md:173,242 | 0 |
| L1-M0908-020 | fs_effect | 連続押下は押下のたびに削除を予約し、各レスポンス送出後に削除コマンドを実行（抑止・多重防止なし）。再押下=再予約・再実行 | 「連続してボタンを押下｜押下のたびに削除を予約し、各レスポンス送出後に削除コマンドを実行する。」「再度ボタンを押下すれば再びキャッシュ削除を予約し…実行する。」（clearCacheは単純フラグ代入=CU:47-50で抑止なし） | md:153,175／CU:47-50 | 0 |
| L1-M0908-021 | message | 削除コマンド失敗時: 応答済みのため完了フラッシュは既表示・本画面は成否を判定して通知しない・例外処理は共通処理へ委譲（**誘発手段が一次資料に規定なし=要実機**） | 「削除コマンドが失敗しても利用者画面には削除完了のフラッシュが既に表示された状態となる。…失敗時の例外処理はアプリケーションの共通処理に委ねる。」 | md:174,233 | 0 |
| L1-M0908-022 | log | ログ禁止事項: なりすまし対策トークンの原値・セッション識別子の完全値・Cookie値・メンテナンスファイルのトークン原値（**設計書由来・コードで不出力を立証していない・観測未契約=実行保留**） | 「- なりすまし対策トークンの原値 ／ - セッション識別子の完全値 ／ - Cookie値 ／ - メンテナンスファイルのトークン原値」 | md:246-249（設計書由来のみ） | 0 |

**既知バグ候補（BC-DRAFT）**: なし（設計書記載挙動と実装の乖離は検出していない。POST成功時にPRGリダイレクトを
行わない点は設計書自身が「同一画面を再表示」=md:112,221と記載しており齟齬に数えない）。
**設計書側の齟齬（DOC-DRAFT・未解決・実装挙動を期待の正にしない）**:
- **DOC-DRAFT-1**: 調査補助の「表示画面のルートname `m09-08_admin_content_content_cache`」（md:286）は実装のルートname
  `admin_content_cache`（CC:29）と不一致。**未解決の設計・実装矛盾（設計書瑕疵の可能性を含む）として記録し、
  どちらが正かは断定しない（D6裁定・実装を期待の正にしない）**。URLパス自体は両者一致のためE2E手順には影響しない。
- **DOC-DRAFT-2**: 母集合行015/052が参照する`M09-08-MSG-005`は設計書メッセージ表（md:122-126=MSG-003/004/006のみ）に
  **不存在**。行052の期待テキストは「要ソース確認であること。」というプレースホルダのまま母集合に混入している（§8-052=TBD）。
  実ソース確認の結果: 解除フラグのフラッシュは空文字登録で表示文言を持たない（CC:45・md:128）＝MSG-004の「要ソース確認」は
  「文言なし（内部フラグ）」で確定可能と**推定**（設計書の確定は設計書側の改訂事項・未解決）。
- **DOC-DRAFT-3（軽微）**: MSG-003とMSG-006が同一文言・同一表示条件で重複掲載（md:124,126。MSG-006はロケールキー記載なし）。
  実装の成功フラッシュは1回のaddSuccess（CC:48）のみ=重複は設計書表記上のもの。

## §2 SEED・状態設計（DB SEEDなし・使い捨てマーカー＋冪等クリーンアップ。全て`@TBD-D5`）

DB不使用（md:9,192）のためDB SEEDはない。永続状態は（i）kernel.cache_dir配下（再生成可能な派生物）
（ii）`.maintenance`ファイル（実測PRE=**不存在**・§6.2.1）のみ。期待値の正はL1オラクルID（三段参照。
マーカー文字列・実測パスを期待リテラルにしない）。

| 状態 | 内容 | 用途・規律 |
|---|---|---|
| SEED-M01-ADMIN@TBD-D5（既存） | 管理者ログイン資格 | 全ケースのログイン前提（m01系と共通） |
| MARKER（テスト内使い捨て） | fs.ts `placeMarker()`で `MARKER_ABS=/var/ec-cube/var/cache/dev/e2e-m0908-marker-<runid>.txt` に固定文字列を配置 | C-005/C-006/C-007/C-013の削除有無観測。**afterEachで`cleanupMarker()`（rm -f=冪等）**。キャッシュ削除で消えるのが期待動作のため復元はしない |
| .maintenance PRE不存在 | beforeAllで`exists(MAINT_ABS)`=false を確認（実測済み=§6.2.1）。要実機C-010実行時のみafterEachで`removeMaint()`（rm -f）によりPRE不存在へ復帰 | メンテ状態の原状回復。**PREが存在する環境では手動メンテ中=C-010系を実行しない**（SS:150の非force分岐で自動切替が抑止されるため前提不成立） |
| キャッシュ本体 | **S0スナップショット同値の復元は課さない**: cache:clear自体がSUTの正常機能であり、キャッシュは次回リクエストで再生成される派生物（原状回復対象外と明示）。ただし削除直後の後続リクエストは再構築で遅延するため、破壊系ケース末尾に**ウォームアップGET1回**を置き環境を安定化 | 冪等性担保。**専用環境必須・共有ステージング実行禁止**（全リクエスト性能に影響） |

- 並行実行: キャッシュ・`.maintenance`は環境単位の共有状態のため**本機能はserial必須**。他suiteとの同時実行も不可
  （cache:clearが全画面の応答に影響）。suite末尾での実行を推奨。

## §3 操作×観測マトリクス（入力項目ゼロのため項目表に代えて操作×副作用で構成）

本機能の入力項目は**ゼロ**（L1-006。md:144「入力項目の表は扱わない」）。層は「画面（フラッシュ/JS/遷移）×
ファイル層（fs.ts: マーカー・.maintenance）」で構成する。

| 操作 | 一次資料の確定値 | 観測手段 | 検証ケース |
|---|---|---|---|
| GET表示 | 削除しない（md:103・CC:37-49分岐外） | 画面＋マーカー不変 | C-002（表示）／C-013（無副作用=補完） |
| POST（正規トークン・設定無効=既定） | 予約→フラッシュ「削除しました」→同一画面200再描画→TERMINATEでcache:clear（L1-007/008/009/010）。メンテ操作なし（L1-012無効側） | フラッシュ・URL/status・POST body・マーカー消滅・.maintenance不存在維持・解除JS不出力 | C-004／C-005／C-008 |
| POST（トークン不正/欠落） | 予約なし・メンテ操作なし・フラッシュなし・200再描画（L1-016） | フラッシュ不在・マーカー不変・.maintenance不存在 | C-006 |
| POST（設定有効=env切替） | 削除前.maintenance生成→フラグflash→応答ページ解除JS→XHR POST→TERMINATEで.maintenance削除（L1-012/013/014/015） | fs.ts＋page.route＋応答走査 | C-010（**要実機=env切替**） |
| opcache等リセット | function_exists環境でのみ（L1-011） | **未契約** | C-011（実行保留） |
| コマンド失敗 | 共通処理委譲・画面非通知（L1-021） | **誘発手段なし** | C-012（要実機） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全16行を実体掲載**）

### §4.1 bound対応候補行（12行。§8の56対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-08_admin_content_content_cache	E2E-M0908C-001	IT-15	未認証	P1	未ログインでキャッシュ管理URLへアクセス→管理ログインへ誘導・削除効果なし	未ログイン（cookie無しcontext）	—	1. GET /%eccube_admin_route%/content/cache 2. 遷移先URLを読む 3. 未認証のままPOST（空body）し遷移先を読む 4. fs.tsで事前配置マーカーの不変を確認	GET/POSTともadmin_loginのログイン画面へ誘導され本画面は表示されない＋キャッシュ削除の効果なし（マーカー不変） [L1:L1-M0908-001]				
m09-08_admin_content_content_cache	E2E-M0908C-002	IT-12	画面レイアウト	P2	キャッシュ管理画面がHTTP200で表示一式（タイトル・カード見出し・説明文全文・削除ボタン・共通装飾）を表示しエラーなし	ログイン済(SEED-M01-ADMIN)	—	1. GET /content/cache 2. ページタイトル・サブタイトル・span.card-title文言を読む 3. 説明文の全文一致を確認 4. button[type=submit]の文言「キャッシュ削除」とclass btn-ec-conversion・card装飾を確認 5. エラー表示が無いことを確認	HTTP200＋タイトル/カード見出し「キャッシュ管理」＋サブタイトル「コンテンツ管理」＋説明文「本番環境にFTPなどでTwigファイルをアップロードして入れ替えた場合、画面を反映させるにはTwigキャッシュを削除する必要があります。」全文一致＋「キャッシュ削除」ボタン（btn-ec-conversion・card内）＋エラー表示なし [L1:L1-M0908-002,L1-M0908-003,L1-M0908-004,L1-M0908-005]				
m09-08_admin_content_content_cache	E2E-M0908C-003	IT-12	フォーム項目	P2	フォームは入力欄ゼロ・hidden form[_token]のみ・同一URLへPOST	ログイン済	—	1. 画面を開く 2. form要素のaction=/content/cache・method=postを読む 3. form配下の可視入力要素（input:not([type=hidden])・textarea・select）が0件を確認 4. input[type=hidden][name="form[_token]"]が1件のみ存在を確認	入力欄0件＋hidden form[_token]のみ＋action=admin_content_cacheへのPOST [L1:L1-M0908-006]				
m09-08_admin_content_content_cache	E2E-M0908C-004	IT-15	削除操作成功	P1	キャッシュ削除ボタン押下→「削除しました」・リダイレクトなし同一画面200・確認ダイアログなし・POST bodyはトークンのみ・コマンド出力は画面に出ない	ログイン済／既定env（eccube_allow_maintenance_mode=false=§6.2.1実測）	—	1. page.on(request)・page.on('dialog')で記録開始 2. 「キャッシュ削除」押下 3. ナビゲーション応答のstatus=200・URL同一・リダイレクト応答(3xx)が無いことを確認 4. フラッシュ「削除しました」を読む 5. dialogイベント0件を確認 6. POST bodyがform[_token]のみであることを確認 7. 応答HTMLにcache:clearコマンド出力（"Clearing the cache"等のコンソール文字列）が含まれないことを確認 8. リクエスト記録に業務API・外部呼出が無いことを確認	「削除しました」＋HTTP200で同一画面再描画（リダイレクトなし・別画面へ遷移しない）＋確認ダイアログなし即送信＋送信値はトークンのみ＋コマンド出力は画面へ返らない＋外部API呼出なし [L1:L1-M0908-007,L1-M0908-008,L1-M0908-006,L1-M0908-017,L1-M0908-019,L1-M0908-018; fixture:SEED-M01-ADMIN@TBD-D5]				
m09-08_admin_content_content_cache	E2E-M0908C-005	IT-05	削除実行	P1	削除がレスポンス送出後に実行されキャッシュディレクトリが一括クリアされる（マーカー消滅）	ログイン済／既定env／serial・専用環境	—	1. fs.ts ensureStale()（§6.2.2）: CONTAINER_FILE_ABSのmtime（epoch秒）を実測し、現在epoch秒がmtimeより**厳密に大きい**ことを確認。同一秒以下なら1.1秒待機して再実測（fresh分岐=vccc:124は秒精度比較のため厳密大小を機械確認してからPOSTする） 2. fs.ts placeMarker()でkernel.cache_dir直下にマーカー配置・存在確認 3. 「キャッシュ削除」押下し応答200とフラッシュを確認 4. fs.ts waitGone(MARKER_ABS, 90s)でマーカー消滅をポーリング確認 5. afterEach: cleanupMarker()＋ウォームアップGET（§2の環境安定化。fresh回避の決定性はensureStaleが担う）	応答自体は削除完了を待たず返り、応答後にマーカーが消滅（=cache_dir一括クリアの実行） [L1:L1-M0908-009,L1-M0908-010; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=「応答が先」の時系列直接観測はレースで非決定・POSTリクエスト中のコンテナ再コンパイル時の残余較正=§9.1）				
m09-08_admin_content_content_cache	E2E-M0908C-006	IT-15	CSRF	P1	トークン不正/欠落POSTは削除を予約せずメンテも操作せず完了フラッシュなしで200再表示	ログイン済セッション（同一context）／既定env	§6.1契約: (a)form[_token]=正規値の末尾1文字置換 (b)bodyなし（トークン欠落）	1. fs.ts placeMarker() 2. 画面GETで正規tokenを取得し末尾1文字置換して直POST 3. 応答=HTTP200再描画・「削除しました」不表示を確認 4. 空bodyで直POSTし同様に確認 5. fs.tsでマーカー存在維持・.maintenance不存在を確認（afterEach: cleanupMarker）	いずれもHTTP200で画面再表示・完了フラッシュなし＋マーカー不変（削除予約なし）＋.maintenance不生成（メンテ不操作）。専用の失敗文言は表示されない [L1:L1-M0908-016; fixture:SEED-M01-ADMIN@TBD-D5]				
m09-08_admin_content_content_cache	E2E-M0908C-007	IT-26	連続実行	P1	連続してボタン押下→各回とも受付成功（押下ごとに予約・再実行可）	ログイン済／既定env／serial	—	1. 「キャッシュ削除」押下→「削除しました」確認 2. 再描画された画面で再度押下→「削除しました」確認・エラーなし 3. （2回目押下前にfs.tsでマーカー再配置し）waitGoneで2回目も消滅を確認	2回連続で各回「削除しました」・エラーなし＋各回の予約が実行される [L1:L1-M0908-020,L1-M0908-007; fixture:SEED-M01-ADMIN@TBD-D5]				
m09-08_admin_content_content_cache	E2E-M0908C-008	IT-25	メンテ連動無効	P1	既定（許可設定無効）では.maintenanceを生成せず解除JSも出力・送信されない	ログイン済／既定env（false=§6.2.1実測）	—	1. page.on(request)で記録開始 2. 「キャッシュ削除」押下 3. fs.tsで.maintenance不存在のままを確認 4. 応答HTMLにadmin_disable_maintenanceへの$.postを含むscriptブロックが無いことを確認 5. リクエスト記録にdisable_maintenanceへのPOSTが0件を確認	.maintenance不生成（メンテ切替なし）＋解除JSブロック不出力＋disable_maintenanceへの要求0件（キャッシュ削除のみ予約） [L1:L1-M0908-012,L1-M0908-013,L1-M0908-014; fixture:SEED-M01-ADMIN@TBD-D5]				
m09-08_admin_content_content_cache	E2E-M0908C-009	IT-25	モーダル	P2	モーダル・確認ダイアログ・トーストを持たない（押下で即送信）	ログイン済	—	1. 画面を開き削除押下まで操作 2. .modal要素・dialogイベント（page.on('dialog')）・トースト要素の不在を確認 3. 押下と同時にPOSTが発生する（確認ステップなし）ことを確認	モーダル/確認ダイアログ/トーストが発生せずボタン押下で即送信 [L1:L1-M0908-017]				
m09-08_admin_content_content_cache	E2E-M0908C-010	IT-25	メンテ連動有効	P1	許可設定有効時: 削除前に.maintenance生成→応答ページに解除JS→非同期POST1回→応答後に.maintenance削除	管理者ログイン済／ECCUBE_ALLOW_MAINTENANCE_MODE=1（**env切替が必要=要実機**）／.maintenance PRE不存在（実測済）	—	（env切替後）1. fs.tsで.maintenance不存在を確認 2. page.route()でadmin_disable_maintenanceへのPOSTを一時block 3. 「キャッシュ削除」押下 4. 応答ページにadmin_disable_maintenance(auto_maintenance)へ$.postするscriptブロックが存在することを確認 5. block中にfs.tsで.maintenance存在＋内容が`auto_maintenance:`+32文字トークン形式であることを確認 6. blockを解除しXHR POST発火（1回・ECCUBE-CSRF-TOKENヘッダ）と{"success":true}応答を確認 7. fs.ts waitGone(MAINT_ABS)で.maintenance消滅を確認 8. afterEach: removeMaint()＋env復帰	削除前に.maintenance生成（auto_maintenance:トークン）＋解除JS出力＋非同期POST1回で自動メンテ解除（応答後に.maintenance消滅） [L1:L1-M0908-012,L1-M0908-013,L1-M0908-014,L1-M0908-015; fixture:SEED-M01-ADMIN@TBD-D5]（要実機=env切替・切替後の分岐/レース較正=§9.1）				
m09-08_admin_content_content_cache	E2E-M0908C-011	IT-16	追加リセット	P1	opcache・APC・WinCacheのリセットが利用可能な関数に限り実行される	ログイン済／プロセス内キャッシュの観測手段（**未契約=実行保留**）	—	（観測手段確定後）1. Webプロセス内でopcache等の状態を観測する手段を確立 2. 削除実行 3. 利用可能な関数のみ呼ばれ、不可の関数は呼ばれないことを確認	cache:clear実行に続けてfunction_existsが真の関数のみリセット（opcache_reset／apc_clear_cache('user')・apc_clear_cache()／wincache_ucache_clear） [L1:L1-M0908-011]（実行保留=プロセス内キャッシュの観測手段未契約）				
m09-08_admin_content_content_cache	E2E-M0908C-012	IT-02	失敗時挙動	P1	削除コマンド失敗時も完了フラッシュは既表示・画面へ成否を通知しない（共通処理委譲）	ログイン済／削除コマンド失敗を誘発できる状態（**誘発手段は一次資料に規定なし=要実機**）	—	（誘発手段確定後）1. 失敗を誘発 2. 押下→「削除しました」既表示を確認 3. 追加のエラー通知が画面に出ないことを確認 4. 例外の扱い（共通処理）をログ側で確認 5. 誘発状態を復元	完了フラッシュは表示済みのまま・本画面は成否を判定して通知しない・失敗はアプリケーション共通処理へ委譲 [L1:L1-M0908-021]（要実機=誘発手段・ログ観測未契約）				
```

### §4.2 補完行（2行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合56行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-08_admin_content_content_cache	E2E-M0908C-013	IT-26	無副作用	P2	GET表示のみではキャッシュ削除・メンテ操作が起こらない	ログイン済／既定env	—	1. fs.ts placeMarker() 2. /content/cacheをGETで2回表示 3. fs.tsでマーカー存在維持・.maintenance不存在・フラッシュ不表示を確認（afterEach: cleanupMarker）	マーカー不変（この時点ではキャッシュ削除を行わない=md:103）＋.maintenance不生成＋フラッシュなし [L1:L1-M0908-002]（補完行・親test_idなし・設計書補完）				
m09-08_admin_content_content_cache	E2E-M0908C-014	IT-20	ログ	P3	コマンド出力の収集と秘密値不出力（実行保留）	ログイン済	—	（ログ観測手段確定後）1. 削除実行 2. アプリケーションログ/コマンド出力バッファを走査	コマンド出力が収集され画面へ返らず、なりすまし対策トークン原値・セッションID完全値・Cookie値・メンテナンスファイルのトークン原値が出ない [L1:L1-M0908-019,L1-M0908-022]（補完行・親test_idなし・設計書補完・観測手段未契約=実行保留。L1-022は設計書由来でコード立証なし）				
```

### §4.3 -EN行（2行。LS=1 claimのlocale多重・対応ja行と同一親）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-08_admin_content_content_cache	E2E-M0908C-002-EN	IT-12	画面レイアウト	P2	表示一式（en）	ログイン済／locale=en	—	同C-002	タイトル/カード見出し "Caches"・サブタイトル "Contents"・説明文 "If you replaced the Twig file on the production server with FTP etc, the UI will not be updated unless you delete the Twig cache."・ボタン "Delete Cache" [L1:L1-M0908-003,L1-M0908-004,L1-M0908-005]				
m09-08_admin_content_content_cache	E2E-M0908C-004-EN	IT-15	削除操作成功	P2	削除受付フラッシュ（en）	ログイン済／locale=en	同C-004	同C-004	"Deleted" 表示＋同一画面200再描画 [L1:L1-M0908-007]				
```

## §5 locale対応表

LS=1: **4claim**（L1-003/004/005/007）→ **-EN 2行**（§4.3。C-002-ENが003/004/005、C-004-ENが007を担当）。
en文言はすべてen一次資料逐語（messages.en.yaml。ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。

## §6 判定手段骨子（候補=未実装）＋観測（fs.ts再利用契約）＋_drafts隔離lint証跡

### §6.1 request契約

- フォーム直POST: `POST /%eccube_admin_route%/content/cache`（application/x-www-form-urlencoded）。
  フィールド=`form[_token]`のみ（フォーム名は`form`=FormType既定・入力項目0=CC:33-34。twig:33の
  `form_widget(form._token)`から確定）。正規tokenは同一contextの画面GETで`input[name="form[_token]"]`から取得。
  改変token=正規値の末尾1文字置換。欠落=空bodyのPOST（フォーム名不在→isSubmitted偽=同じ不成立側に落ちる）。
- UI経由: `button[type=submit]`（文言「キャッシュ削除」）押下（確認ダイアログなし=L1-017）。
- 解除エンドポイント（C-010のみ）: 画面JSが送る`POST /%eccube_admin_route%/disable_maintenance/auto_maintenance`
  （XHR・CSRFは管理共通ajaxSetupのECCUBE-CSRF-TOKENヘッダ=dft:16,83-87）。E2Eから直接叩かず
  **画面JSの発火を観測**する（page.routeで一時block→観測→解放。エンドポイント内部仕様はmd:34で対象外）。
- 未実装・実走なし（候補規律）。ログイン済みcontextのcookie共有で送信（m09-01と同方式）。

### §6.2 観測手段 — fs.ts再利用契約（m09-05 §6.2の共通契約を継承。機能別に変わるのは対象絶対パスのみ）

**位置づけ**: 関数契約はm09-05 §6.2.2のfs.ts共通契約（`exists`/`readFile`/`sha1`/`statOwnerMode`・
docker exec前置・絶対パスのみ・exit>1はthrow黙殺禁止）をそのまま再利用し、本機能は対象定数と追加関数のみ定義する。
実装は`e2e/helpers/fs.ts`（候補=未実装。実装は実装wave）。

**§6.2.1 接続・パス定数（コンテナ実測で確定。2026-07-24実測）**

| 定数 | 確定値 | 確定根拠（実測コマンド） |
|---|---|---|
| `E2E_WEB_CONTAINER` | 既定 `ec-cube-enterprise-ec-cube-1`（稼働実測済み。他環境は環境変数で上書き） | `docker ps --format '{{.Names}}'` に実在 |
| `APP_ROOT` | `/var/ec-cube` | m09-05 §6.2.1実測を継承（Dockerfile ENV PROJECT_ROOT） |
| `CACHE_DIR`（kernel.cache_dir） | **`/var/ec-cube/var/cache/dev`**（APP_ENV=dev実測。**環境パラメータ: prod系では`var/cache/<APP_ENV>`に追随**） | `docker exec … php bin/console debug:container --parameter=kernel.cache_dir`＝`/var/ec-cube/var/cache/dev`。`kernel.build_dir`も同値実測（=CacheClearCommandはuseBuildDir偽の分岐を通る） |
| `MARKER_ABS` | `/var/ec-cube/var/cache/dev/e2e-m0908-marker-<runid>.txt` | `CACHE_DIR`直下。cache dir実測 `drwxrwsrwx root:www-data`（www-data書込可） |
| `MAINT_ABS` | **`/var/ec-cube/.maintenance`** | `debug:container --env-var=ECCUBE_MAINTENANCE_FILE_PATH`＝Processed `"/var/ec-cube/.maintenance"`（env既定`%kernel.project_dir%/.maintenance`=eyml:22）。**現況実測: 不存在（PRE=不存在側）** |
| `CONTAINER_FILE_ABS`（fresh分岐の判定対象） | **`/var/ec-cube/var/cache/dev/Eccube_KernelDevDebugContainer.php`** | コンテナ実測で実在（`ls -l`・`stat -c %Y`=1784800806取得成功）。vccc:113-114の`ReflectionObject($kernel->getContainer())->getFileName()`のコンテナ内実体。**環境パラメータ: APP_ENV/デバッグ有無でファイル名が変わるため実装時はglob（`Eccube_Kernel*Container.php`）で解決し1件一致を機械確認** |
| `eccube_allow_maintenance_mode`現況 | **false** | `debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODE`＝Real `"0"`・Processed `false`（.env:62と一致。C-004〜C-008の「既定env」前提の実測根拠） |
| 管理ルート | `admin` | `debug:container --env-var=ECCUBE_ADMIN_ROUTE`＝Processed `"admin"` |
| docker exec既定ユーザ | `root` | `docker exec … id -un`＝root（アプリ視点の判定が要る場合は`-u www-data`） |

**実測ログ逐語引用（2026-07-24・本草案作成者がホストで実行。codex環境はdocker socket権限なしのため
後日の実機照合はこのコマンド列を再実行して突合すること）**:

```
$ docker ps --format '{{.Names}}'        # ec-cube-enterprise-ec-cube-1 を含む7コンテナ稼働
$ docker exec ec-cube-enterprise-ec-cube-1 sh -c 'echo APP_ENV=$APP_ENV'
APP_ENV=dev
$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --parameter=kernel.cache_dir
  kernel.cache_dir   /var/ec-cube/var/cache/dev
$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --parameter=kernel.build_dir
  kernel.build_dir   /var/ec-cube/var/cache/dev
$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_MAINTENANCE_FILE_PATH
  Default value     "/var/ec-cube/.maintenance"
  Processed value   "/var/ec-cube/.maintenance"
$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --env-var=ECCUBE_ALLOW_MAINTENANCE_MODE
  Real value        "0"
  Processed value   false
$ docker exec ec-cube-enterprise-ec-cube-1 ls -ld /var/ec-cube/var/cache/dev
drwxrwsrwx 10 root www-data 4096 Jul 23 19:00 /var/ec-cube/var/cache/dev
$ docker exec ec-cube-enterprise-ec-cube-1 sh -c 'test -e /var/ec-cube/.maintenance && echo EXISTS || echo ABSENT'
ABSENT
$ docker exec ec-cube-enterprise-ec-cube-1 id -un
root
$ docker exec ec-cube-enterprise-ec-cube-1 ls -l /var/ec-cube/var/cache/dev/Eccube_KernelDevDebugContainer.php
-rw-rw-rw- 1 root www-data 893 Jul 23 19:00 /var/ec-cube/var/cache/dev/Eccube_KernelDevDebugContainer.php
$ docker exec ec-cube-enterprise-ec-cube-1 stat -c %Y /var/ec-cube/var/cache/dev/Eccube_KernelDevDebugContainer.php
1784800806
```

**§6.2.2 追加関数契約（共通契約への本機能分の追加。入出力・失敗時仕様）**

| 関数 | 実体コマンド（`docker exec $E2E_WEB_CONTAINER` 前置） | 入出力 | 失敗時仕様 |
|---|---|---|---|
| `placeMarker()` | `sh -c "echo E2E-M0908-<runid> > <MARKER_ABS>"` → `test -e <MARKER_ABS>` | 配置後の存在を機械確認して返る | 配置失敗・存在確認exit非0→throw=ハーネス失敗（黙殺禁止） |
| `waitGone(abs, timeoutMs)` | `test -e <abs>` を1秒間隔でポーリング | exit1（不存在）になった時点でtrue | timeout超過で存在のまま→throw（**削除未実行=テスト失敗として表面化**。C-005既定90s） |
| `cleanupMarker()` | `rm -f <MARKER_ABS>` | 冪等（不存在でも成功） | exit非0→throw |
| `maintExists()` / `readMaint()` | `test -e <MAINT_ABS>`／`cat <MAINT_ABS>` | 存在bool／内容（`<mode>:<token>`形式。**トークン原値はログへ出力しない**=md:249） | readは不存在→throw（existsで先に確認） |
| `removeMaint()` | `rm -f <MAINT_ABS>` | PRE不存在（実測）への復帰。冪等 | exit非0→throw=**suite abort**（メンテ残留はフロント全体に影響するため）＋手動復旧手順（rm -f）をログ出力 |
| `statMtime(abs)` | `stat -c %Y <abs>` | epoch秒（整数） | exit非0→throw |
| `ensureStale()` | `statMtime(CONTAINER_FILE_ABS)`＝M と現在epoch秒 now を比較 | **now > M（厳密大小）を機械確認して返る**。now <= M なら1.1秒待機→再実測（最大10回・成立まで繰り返し）。C-005/C-007のPOST**直前**に必ず呼ぶ（fresh分岐=vccc:124は`REQUEST_TIME <= filemtime`の秒精度比較のため、同一秒では回避が保証されない=決定化の根拠） | 10回試行でも不成立（mtimeが進み続ける=再コンパイル多発）→throw=ハーネス失敗（黙殺禁止） |

- suite構成: beforeAll=`maintExists()`=falseの確認（**trueなら手動メンテ中と判定しC-004〜C-010を実行しない**=
  SS:150の非force分岐で前提不成立）／各ケースafterEach=`cleanupMarker()`（＋C-010のみ`removeMaint()`）／
  破壊系ケース末尾にウォームアップGET1回（§2）。
- 期待値の正はL1（三段参照）。fs.ts出力はSUT実挙動側の観測値であり期待リテラルにしない。
- **C-005の観測成立条件（vccc実引き・R1是正で決定化）**: cache:clearは非fresh経路で実キャッシュdirを
  退避リネームし旧dirを削除する（vccc:161-190。build_dir=cache_dir実測のためuseBuildDir偽分岐）ため
  マーカーは消える。「Cache is fresh」分岐の条件は`$_SERVER['REQUEST_TIME'] <= filemtime($containerFile)`
  （vccc:124・**秒精度**）で、成立時は**旧dir退避（rename）→削除が行われない**（分岐前の
  `$this->cacheClearer->clear($realCacheDir)`=vccc:107自体は実行されるが、これはカスタムclearer群の実行で
  ありcache_dir全体の削除ではない=マーカーは残存し得る）。ウォームアップGETだけでは同一秒のGET→POSTで
  fresh成立が残るため**決定的でない**（R1 Major指摘）。決定化=`ensureStale()`（上表）で
  **コンテナファイルmtime＜POST時刻の厳密大小を機械確認してからPOST**する。残余リスクは
  「POSTリクエスト処理中のコンテナ再コンパイル」（mtime=REQUEST_TIMEでfresh成立し得る）のみで、
  発生時はwaitGoneのtimeoutで失敗として表面化する（偽成功にはならない・発生率は要実機で較正=§9.1）。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード
   `oracle.ts`の`_drafts`拒否throw〔oracle.ts:16-21実在確認済み〕を除く。ガードは`_drafts`・パス区切り・`..`を
   含むfileKeyの解決をthrowで拒否する機械強制）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は
   `_drafts/`の2ファイル（本md＋oracle草案）のみ。
3. SUT・オラクル（設計書・母集合TSV）への変更なし（読取のみ。E2E実行の絶対規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-002・C-003・C-004・C-007・C-008・C-009・C-013。
- Playwright+FS確認（fs.ts）: C-001・C-005・C-006・C-007・C-008・C-010・C-013。
- 非UI（request契約）: C-006（＋C-001の未認証POST）。
- **要実機**: C-005（「応答が先」の時系列直接観測はレースで非決定・vccc:123鮮度分岐の成立条件較正・
  waitGoneタイムアウト値較正）・C-010（env切替=ECCUBE_ALLOW_MAINTENANCE_MODE=1・切替後の分岐/レース較正）・
  C-012（コマンド失敗の誘発手段が一次資料に規定なし）。
- **実行保留**: C-011（プロセス内キャッシュopcache/APC/WinCacheの観測手段未契約）・C-014（ログ観測手段未契約）・
  -EN 2行（D15）。
- 並行実行: **本機能はserial必須・他suiteとの同時実行不可・suite末尾実行推奨**（cache:clearが環境全体の
  応答性能に影響。§2）。共有ステージングでは実行しない（専用環境前提）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点・前提ラベルはノイズ=前提列は設計書subject名の機械循環。
前提が期待と矛盾する行は§10 C4に記録）。1候補ケース行=1 assertion bundle・多対一は`shared-observation`・
-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み＝56↔候補の期待テキスト突合が
本文内で完結する**。

### 集計（56 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound（完全）** | **50** | 下表（うち**要実機/実行保留マーク: 19**〔env切替系10=002・003・004・007・019・038・042・043・044・055／削除実観測系5=018・025・026・033・053／失敗誘発系2=028・040／観測未契約系2=022・054〕。マークなし31） |
| **読み替えbound（別掲）** | **0** | —（初版の012・015読み替えはcodex R1 Blockerで過剰と裁定→excluded EX-Cへ移動） |
| **partial/unresolved（別掲）** | **0** | — |
| **TBD** | **1** | 052（期待テキストが「要ソース確認であること。」のプレースホルダ・参照先MSG-005が設計書に不存在=DOC-DRAFT-2。§9.1） |
| **excluded** | **5** | EX-A 必須バリ不存在1（009）／EX-B DB相関不存在2（016・017）／EX-C 相関バリ不存在かつエラー表示層不存在2（012・015） |
| 合計 | **56** | **50+0+0+1+5=56**・欠落0・理由なし重複0 → 差分0 |

- 候補ケース行総数**16**（§4.1 bound対応12＋§4.2 補完2＋§4.3 -EN 2）。

### 56対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 本画面のボタン押下で起動するアプリキャッシュの一括削除であること | bound | C-004＋C-005（押下起動・一括削除の実観測） (shared) |
| 002 | キャッシュ削除時に自動でメンテモードへ切り替えるかを決める設定であること | bound(要実機) | C-010（有効側）＋C-008（無効側=切り替えない） (shared) |
| 003 | キャッシュ削除中に一時的に有効化するメンテナンス状態であること | bound(要実機) | C-010（.maintenance生成→解除の全周期観測） |
| 004 | 自動メンテモードを解除するための管理側POSTエンドポイントであること | bound(要実機) | C-010（手順6=解除POSTと.maintenance消滅） |
| 005 | キャッシュ管理画面を表示すること | bound | C-002 |
| 006 | 削除を予約し同一画面を再表示して削除完了フラッシュを表示すること | bound | C-004（＋実行はC-005） |
| 007 | 許可設定が有効なときに限り削除完了画面の表示後に自動送信され解除すること | bound(要実機) | C-010（有効側）＋C-008（「に限り」の否定側=不送信） (shared) |
| 008 | 認証要件によりログインへ誘導され本画面を利用できないこと | bound | C-001 |
| 009 | 必須バリでエラーが表示され、対象処理が完了しないこと | **excluded** EX-A | —（§9.2） |
| 010 | 必須バリでエラーが表示されず、対象処理を継続できること | bound | C-004（入力ゼロでエラーなく削除継続=任意性の実証） (shared) |
| 011 | 本画面はモーダル、確認ダイアログ、トーストを表示しないこと | bound | C-009 |
| 012 | 相関バリでエラーが表示され、対象処理が完了しないこと | **excluded** EX-C | —（§9.2。入力項目ゼロで相関バリ不存在＋「エラーが表示され」の表示層が実装上構成不能。**CSRF拒否側の実挙動は020/032/039/056がC-006で別途bound済み=偽陰性なし**。codex R1裁定で読み替えboundから移動） |
| 013 | 相関バリでエラーが表示されず、対象処理を継続できること | bound | C-004 (shared)。相関バリ不存在の帰結として正規押下はエラーなく継続（肯定側は文字通り成立=再解釈不要） |
| 014 | 相関バリでエラーが表示されず、対象処理を継続できること | bound | C-004 (shared)。前提=MSG-004（内部フラグ）: 既定envでは登録されないがエラーなく継続は成立。有効側はC-010 |
| 015 | 相関バリでエラーが表示され、対象処理が完了しないこと | **excluded** EX-C | —（§9.2。012と同一根拠。前提=MSG-005は設計書に不存在=DOC-DRAFT-2だが除外判定は期待テキスト実内容の構成不能性による） |
| 016 | DBとの相関バリでエラーが表示されず継続 | **excluded** EX-B | —（§9.2） |
| 017 | DBとの相関バリでエラーが表示され完了しない | **excluded** EX-B | —（§9.2） |
| 018 | 押下時は予約のみで実削除はレスポンス送出後のカーネル終了処理で実行すること | bound(要実機) | C-005（応答後のマーカー消滅。「応答が先」の時系列直接観測はレース=要実機・機序自体はCU:47-50,209-213実引き） |
| 019 | 登録内容の対象レコードが追加されること（メンテ連動前提） | bound(要実機) | C-010（肯定側効果=.maintenance生成。C4: 「追加」→ファイル生成へ極性対応=§10） |
| 020 | 追加されないこと（トークン不正・欠落前提） | bound | C-006（否定側=マーカー不変・.maintenance不生成・フラッシュなし） |
| 021 | 追加されること（許可設定が無効前提） | bound | C-004＋C-008 (shared)。無効でも削除のみ予約・実行（md:151） |
| 022 | 利用できないリセット関数は呼ばずコマンド実行のみ行うこと | bound(実行保留) | C-011（観測手段未契約。claimはCU:83-94のfunction_existsガード実引き） |
| 023 | 追加されること（連続押下前提） | bound | C-007（各回予約・各回成功） |
| 024 | 追加されること（参照時点前提） | bound | C-004 (shared)。前提=md:161（業務データを読み取らない）と期待肯定の対応は§10 C4（前提ノイズ判定） |
| 025 | 追加されないこと（削除反映の時点前提） | bound(要実機) | C-005 (shared)。否定側=「応答時点では削除未完了のことがある」（md:162）はレース非決定=要実機。C4記録 |
| 026 | 追加されること（バッチ前提） | bound(要実機) | C-005 (shared)。前提=md:172（バッチ起動なし・カーネル終了処理で内部実行）。肯定側=削除が実行される |
| 027 | 追加されないこと（成功時の扱い前提） | bound | C-004 (shared)。否定側=コマンド実行結果を画面に反映しない・出力を返さない（md:173。C-004手順7） |
| 028 | 追加されること（失敗時の扱い前提） | bound(要実機) | C-012（失敗時の実挙動=md:174。誘発手段なし。C4: 前提と期待肯定の矛盾記録） |
| 029 | 実行結果の対象レコードが追加されること（再実行前提） | bound | C-007 (shared)。再押下=再予約・再実行（md:175） |
| 030 | 入力はGET要求と削除ボタンのPOST要求（トークンのみを伴う）であること | bound | C-003＋C-004手順6（POST body=form[_token]のみ） (shared) |
| 031 | 同一画面を再表示し削除完了フラッシュを表示すること | bound | C-004 |
| 032 | トークンが妥当でない場合は完了フラッシュを表示せず画面を再表示すること | bound | C-006 |
| 033 | レスポンス送出後にアプリキャッシュを削除しopcache等のリセットを行うこと | bound(要実機/実行保留) | C-005（キャッシュ削除側）＋C-011（opcache側=実行保留） (shared) |
| 034 | 本画面は値の入力欄を持たないこと | bound | C-003 |
| 035 | 削除状態にならないこと（未認証前提） | bound | C-001（未認証では削除効果なし=マーカー不変。C4否定側） |
| 036 | 削除状態になること（管理者認証済み前提） | bound | C-004＋C-005 (shared)（認証済みで削除実行） |
| 037 | 同一のキャッシュ管理画面を再表示し削除完了フラッシュを表示すること | bound | C-004 (shared) |
| 038 | 削除状態になること（メンテ解除の非同期要求前提） | bound(要実機) | C-010 (shared)。C4: 「削除状態」=.maintenanceファイルの削除（手順7）へ極性対応 |
| 039 | キャッシュ削除を予約せず画面を再表示すること | bound | C-006 (shared) |
| 040 | アプリケーションの共通処理に委ねるであること（コマンド失敗前提） | bound(要実機) | C-012（誘発手段なし。期待テキストの助詞欠落=母集合生成系の切断だが実内容md:233で判定） |
| 041 | 本画面のボタン押下で起動するアプリキャッシュの一括削除であること | bound | C-004＋C-005 (shared)（001と同文言） |
| 042 | メンテモードへ切り替えるかを決める設定であること | bound(要実機) | C-010＋C-008 (shared)（002と同文言） |
| 043 | 一時的に有効化するメンテナンス状態であること | bound(要実機) | C-010 (shared)（003と同文言） |
| 044 | 解除するための管理側POSTエンドポイントであること | bound(要実機) | C-010 (shared)（004と同文言） |
| 045 | キャッシュ管理画面を表示すること | bound | C-002 (shared) |
| 046 | 削除を予約し同一画面を再表示して完了フラッシュを表示すること | bound | C-004 (shared)（006と同文言） |
| 047 | カード内に見出しと説明文「本番環境にFTPなどで…必要があります」であること | bound | C-002（説明文全文一致。母集合行の引用は末尾切断=実内容で判定） |
| 048 | 管理画面共通のカード・ボタンの装飾を用いること | bound | C-002（card装飾・btn-ec-conversion） (shared) |
| 049 | 画面表示データでエラーが表示されず、対象処理を継続できること | bound | C-002 (shared)（表示にエラーなし・手順5） |
| 050 | キャッシュ削除、メンテ切替、削除後処理はサーバ側で判定すること | bound | C-004 (shared)。クライアントは削除対象を選ばず通常POSTのみ（md:92。手順6=送信値に選択情報なし。サーバ側判定はCC:37-49実引きで根拠づけ） |
| 051 | 画面表示データでエラーが表示されず、対象処理を継続できること | bound | C-004 (shared)。前提=MSG-004: 既定envで未登録でもエラーなく継続 |
| 052 | 要ソース確認であること | **TBD** | —（期待テキストがプレースホルダ・参照先MSG-005が設計書メッセージ表md:122-126に不存在=DOC-DRAFT-2。実ソース確認結果〔解除フラグ=空文字・文言なし=CC:45〕の実挙動はC-008/C-010で別途bound済み→偽陰性なし。§9.1） |
| 053 | Symfonyのキャッシュ削除コマンドによりアプリキャッシュ全体を削除すること | bound(要実機) | C-005（マーカー消滅=全体クリア。vccc:123鮮度分岐の較正=要実機） |
| 054 | opcache・APC・APCキャッシュ・WinCacheを関数が利用可能な環境でのみリセットすること | bound(実行保留) | C-011（観測手段未契約） |
| 055 | 許可設定が有効な場合に限り削除前に切替・表示後にJS非同期要求で解除すること | bound(要実機) | C-010（有効側全周期）＋C-008（無効側=「に限り」の否定） (shared) |
| 056 | キャッシュ削除を予約せず、メンテナンスモードも操作しないこと | bound | C-006（マーカー不変＋.maintenance不生成） |

`func_scope_check` 判定: 親56/56会計済み（bound完全50＋読み替えbound0＋partial0＋TBD1＋excluded5）・
欠落0・理由なし重複0・補完2行は§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。
O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### §9.1 TBD・要実機・実行保留（bound内の保留マークとTBD）

| 対象 | 理由 |
|---|---|
| 052→TBD | 期待テキスト「要ソース確認であること。」はプレースホルダで実行可能な期待を構成しない。参照先MSG-005は設計書メッセージ表（md:122-126）に不存在（DOC-DRAFT-2）。実ソース確認の結果（解除フラグ=空文字登録・画面文言なし=CC:45・md:128）の実挙動はC-008（不出力側）/C-010（出力側）でbound済み=**偽陰性なし**。設計書改訂（MSG-005の実体確定）待ち |
| 002・003・004・007・019・038・042・043・044・055→C-010 | env切替（ECCUBE_ALLOW_MAINTENANCE_MODE=1）が必要（現況実測=false・.env:62）。切替後もSS:150の非force分岐（既存メンテ中は生成しない）・解除JSのレース（page.route blockの実効性）を実機で較正 |
| 018・025・026・033・053→C-005 | 削除実観測はマーカー方式でbound可能だが（vccc:161-190実引き）、（i）「応答が削除完了に先行する」時系列の直接観測はレースで非決定（025のmd:162「まだ実行中または未実行のことがある」は非決定事象そのもの）（ii）「Cache is fresh」分岐（vccc:124=秒精度比較）成立時は旧dir退避（rename）→削除が行われない場合がある（分岐前のcacheClearer->clear=vccc:107自体は実行される）。事前条件は`ensureStale()`（コンテナファイルmtime＜現在epoch秒の**厳密大小**を機械確認・同一秒なら待機再実測=§6.2.2）で決定化済み。**残余=POSTリクエスト処理中にコンテナが再コンパイルされた場合**（mtime=REQUEST_TIMEとなりfresh成立し得る）はwaitGone timeoutで失敗表面化=偽成功なし・発生率は要実機で較正（iii）waitGoneタイムアウト値（既定90s）の較正。033のopcache成分はC-011=実行保留 |
| 028・040→C-012 | 削除コマンド失敗の誘発手段が一次資料に規定なし（cache dirはTERMINATE時点でwww-data実行=権限操作の実効性未確定）。失敗時の「共通処理委譲」の観測（ログ）も未契約 |
| 022・054→C-011 | opcache/APC/WinCacheはWebプロセス内キャッシュで、外部から状態を観測する手段が未契約（CLIからはApacheプロセスのopcacheを観測できない）。claim自体はCU:83-94のfunction_existsガード実引きで根拠済み |
| C-014（補完） | ログ観測手段未契約。L1-022は設計書由来でコード立証なし |
| fs.ts接続定数 | **実測確定済み**（§6.2.1: コンテナ稼働・kernel.cache_dir/.maintenanceパス=debug:container実測）。CACHE_DIRはAPP_ENV追随の環境パラメータ（保留ではない） |
| -EN 2行 | D15（管理画面en切替）待ち |

### §9.2 §9-EX excluded per-ID表（全3件・実引き根拠。範囲一括でなく各IDを個別に正当化）

根拠の実引き:
(a) **必須バリデーション不存在**: フォームは`createBuilder(FormType::class)`の空フォームで項目add呼出0件
（CC:33-34全文実引き）。「本画面は利用者が値を入力するフォーム項目を持たない。」（md:85）「本画面は値の
入力欄を持たない。」（md:200）＝必須制約を課す対象項目が存在せず、必須エラーを表示する層（HTML5 required・
サーバNotBlank）がいずれも構成不能。
(b) **DB不使用**: 「業務テーブルへ保存しないため、DBスキーマを持たない。」（md:9）「本機能に直接関係する
DBカラムは無い。」（md:192）「メンテナンスモードの状態はデータベースではなくファイルで管理する。」（md:48,192）。
CCにRepository/Doctrine業務参照0件（use句=CC:14-22実引き。SystemService注入はメンテファイル操作用）。
(c) **相関バリ不存在＋エラー表示層不存在**（codex R1 Blocker裁定でEX-C新設）: 入力項目ゼロ（根拠a）のため
項目間の相関バリデーションは定義不能。実在するサーバ側検証はFormType既定のCSRFトークン検証のみ（CC:37）だが、
「エラーが**表示され**」の要件を満たす表示層が不存在＝本画面は専用の失敗文言を持たず（「本画面専用の失敗文言は
持たない。」md:185）・twigにform_errors描画なし（twig:31-60実引き0件）・成否は完了フラッシュの**有無**でしか
区別しない（md:232）。よって「エラーが表示され完了しない」は実装上構成不能。**m09-05のような読み替え先
（クライアント注釈制御等）も本画面には存在しない**（本画面専用JSは解除POSTのみ=md:82）＝救済先なし。

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 009 | EX-A | 「必須バリデーションでエラーが表示され、対象処理が完了しないこと。」→必須制約の対象項目が全層に不存在（根拠a）のためエラー側は構成不能。**肯定側（010=エラーなく継続）はC-004でboundし偽陰性を防止** |
| 012 | EX-C | 「相関バリデーションでエラーが表示され、対象処理が完了しないこと。」→相関バリ不存在かつエラー表示層不存在（根拠c）で「エラーが表示され」が構成不能。**CSRF拒否（削除されない側）の実挙動は020/032/039/056がC-006でbound済み・肯定側（013/014=エラーなく継続）もC-004でbound済み=偽陰性なし** |
| 015 | EX-C | 「相関バリデーションでエラーが表示され、対象処理が完了しないこと。」→012と同一（根拠c）。前提=MSG-005の設計書不存在（DOC-DRAFT-2）は付随事実であり、除外判定は期待テキスト実内容の構成不能性による |
| 016 | EX-B | 「DBとの相関バリデーションでエラーが表示されず…」→DB自体を使わない（根拠b）ため「DBとの相関」検証は構成不能 |
| 017 | EX-B | 「DBとの相関バリデーションでエラーが表示され…」→同上（根拠b） |

**偽陰性防御の明示**: 相関バリデーション4行のうち肯定側2行（013・014）は「エラーが表示されず継続」が
正規操作で文字通り成立するため再解釈なしのbound。拒否側2行（012・015）は初版で「唯一のサーバ側検証=
トークン検証」への読み替えboundとしたが、**codex R1で過剰（エラー表示要件を満たせない）と裁定され
excluded（EX-C）へ移動**した。CSRF拒否の実挙動そのもの（予約なし・メンテ不操作・フラッシュなし・200再表示）は
母集合020/032/039/056がC-006で完全boundしており、012/015の除外によって検証されない実挙動は発生しない
（偽陰性なし）。妥当性はD6/正式化時に再裁定する（隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 009/010（必須: 完了しない/継続） | 009=拒否側→**excluded**（必須不存在=構成不能）／010=成功側→C-004 | 拒否側を安易に「エラーが出ない」へ反転bindしない（期待は「エラーが表示され」のため不成立=excludedが正） |
| 012〜015（相関: エラー/継続） | 012,015=拒否側→**excluded EX-C**（相関バリ不存在＋エラー表示層不存在=構成不能・救済先なし。codex R1裁定）／013,014=成功側→C-004 | 拒否側を「エラーが出ない」やCSRF拒否へ反転・読み替えbindしない（期待は「エラーが表示され」のため不成立=excludedが正確）。CSRF拒否の実挙動は020/032/039/056→C-006で完全bound済み=偽陰性なし |
| 019〜029（追加される/されない） | 020,025,027=否定側／他=肯定側 | 本機能にDBレコード不存在（md:192）のため「追加」を**副作用の発生/不発生**へ極性対応: 020=トークン不正→マーカー不変・.maintenance不生成（**不変assert必須**）／025=応答時点の未完了（レース=要実機）／027=コマンド出力を画面へ返さない（否定側=応答走査）／019=.maintenance生成（C-010）／021=無効でも削除実行／023,029=連続・再実行／024=前提（参照時点=md:161）と期待肯定が機械循環ノイズ→期待実内容で C-004へ／026=バッチ前提（md:172=バッチ不起動）→内部実行の肯定側C-005へ／028=失敗時前提と期待肯定が矛盾→実挙動はC-012（要実機）で別途担保 |
| 035〜038（削除状態になる/ならない） | 035=否定側（未認証→効果なし=C-001のマーカー不変assert）／036,038=肯定側 | 「削除状態」の対象を特定して対応: 036=キャッシュ（マーカー消滅=C-005）／038=**.maintenanceファイルの削除**（C-010手順7）。互いに混同しない |
| 039/056（予約せず/操作しない） | 否定側 | C-006はフラッシュ不在だけでなく**マーカー不変＋.maintenance不存在を機械assert**（「表示されない」だけで済ませない） |
| 007/055「〜に限り」 | 条件の両側 | 肯定側C-010（有効時に送信・解除）・否定側C-008（無効時に不出力・不送信）を両方bound。「両側実証済み」とは主張しない（有効側は要実機=env切替） |
| 047の引用切断 | — | 母集合の期待テキストは設計書md:81の引用が末尾で切断（閉じ括弧・句点欠落）。C-002は一次資料逐語（ja:2945）の全文一致でassertし、母集合の切断文字列を期待リテラルにしない |
| 040の助詞欠落 | — | 「共通処理に委ねるであること」=母集合生成系の切断。実内容（md:233）で判定しC-012へ |

機械検査結果（工程6自己検査・実施済み・R1是正後再計算）: §8参照ケースIDの§4実在=全一致（C-001〜C-014・-EN 2行）／
bound完全50＋読み替え0＋partial0＋TBD1＋excluded5=56=母集合件数一致（grep実測56行。012・015はcodex R1
Blocker裁定で読み替えboundからexcluded EX-Cへ移動済み＝§8・§9.2・§10と本行で数値を統一）／補完2行は親空で
母集合会計外／oracle.json草案は本md§1から機械導出・claim数22一致／L1参照の逐語quoteは一次資料file:lineと
突合済み。未検出の極性取り違えが残る可能性は否定しない（codex敵対レビューで検証されたい）。
