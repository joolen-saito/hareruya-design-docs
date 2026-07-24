# B0候補: m09-05 CSS管理 — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正（Blocker1=fs.ts契約不成立／Major2=L1-011行ずれ・C-023誘発不足）→R1是正版（本版）**
> （会計bound56/TBD0/excluded3・読み替えbound4は**R1で妥当承認・維持**。`REVIEW_LEDGER.md`は承認時に記帳）
> R1是正: **(1) §6.2をfs.ts再利用契約として全面書き直し**（対象絶対パス=コンテナ実測で確定・
> 関数別入出力/失敗時仕様・sha1一覧正規化。m09-02等FS系と共通契約）
> **(2) L1-M0905-011の出典を vfs:640-665→640-669 へ是正**（置換=rename行を含める。md+oracle草案両方）
> **(3) C-023の誘発対象を親ディレクトリ権限へ是正**（dumpFileはtempnam→renameを親dirで行うため
> ファイル単体chmodでは誘発できない可能性。実行ユーザ・復元手順を確認対象に明記）。
> **codex R2: L1-011行ずれ=閉・会計/fs.ts骨格/実機確定値=妥当。残る契約バグ2点→R2是正版（本版）**:
> **(1) `removeCss()`の`|| true`黙殺を除去**（不存在=正常/存在時mv失敗=throwの分岐へ是正）
> **(2) C-023の親dir owner/mode記録・復元を実体コマンド付きで契約化**（`CSS_PARENT`定数＋
> `snapshotParentPerm()`/`restoreParentPerm()`追加・C-023手順に変更前記録→誘発→記録値復元を明記）
> **(3) §6.2.1に2026-07-24実測の根拠コマンドと出力を逐語引用**（codex環境はdocker socket権限なし=
> 後日の実機照合で再現可能にするため）。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-01_admin_content_content_news_executable_draft.md`（候補確定）／
> `m09-02_admin_content_content_file_executable_draft.md`（候補確定・FS観測=fs.ts骨子の先行例）。
> **m09-06（JS管理）とはtextarea保存＋ファイル出力の同型機能**（並行作成・扱いを揃える）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-05_admin_content_content_css_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）には書かない**。
> **本機能の特性**: DB永続化なし（設計書md:9,202）。永続化先は**単一ファイル
> `html/user_data/assets/css/customize.css`＋ファイルストレージ**。観測はファイルシステム（fs.ts骨子・§6.2）と画面。
> db.tsは使わない。**保存=破壊的全文上書き**のため、使い捨て専用SEED（S0）＋afterEach復元＋
> S0スナップショット同値（sha1）を全破壊系ケースに課す（m05-13教訓・§2）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-05_admin_content_content_css.md`（最終コミット ec17cd0・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`／symfony/validator v7.4.3・symfony/filesystem v7.4.0（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁）: CssController.php=`7fcb4ece5d11`／css.twig=`2bfa342c5c05`／
  messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／validators.ja.yaml=`8cc5a327231c`／
  validators.en.yaml=`694fff6cd7b7`／eccube.yaml=`15ea9fd66c6f`／RestrictFileUploadListener.php=`86eac139be94`。
- fid_kubun.tsv（D1）: `M09-05｜標準｜standard-src+design｜区分不明=0`（fid_kubun.tsv:317実引き確認済み）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`）M09-05全**59行**
  （IT-M09-05-ADMIN-CONTENT-CONTENT-CSS-001〜059）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環）。bindは各行の
  **「期待結果」実テキスト**で判定（§8に全59行の期待要旨併記。前提と期待の矛盾はC4=§10で記録）。

パス表記: CC=`src/Eccube/Controller/Admin/Content/CssController.php`／twig=`src/Eccube/Resource/template/admin/Content/css.twig`／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／vja=`validators.ja.yaml`／ven=`validators.en.yaml`／
eyml=`app/config/eccube/packages/eccube.yaml`／RL=`src/Eccube/EventListener/RestrictFileUploadListener.php`／
sec=`app/config/eccube/packages/security.yaml`／AC=`src/Eccube/Controller/AbstractController.php`／
FM=`src/Eccube/Service/Upload/FileManager.php`／vfs=`vendor/symfony/filesystem/Filesystem.php`（v7.4.0）／
vxlf-ja=`vendor/symfony/form/Resources/translations/validators.ja.xlf`／
dft=`src/Eccube/Resource/template/default/default_frame.twig`／
md=`functions/ec-cube-enterprise/m09-05_admin_content_content_css.md`。

## §1 L1原子オラクル表（30claim・全行逐語+file:line）

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0905-001 | auth_rule | 未認証は管理ログインへ誘導され本画面へ到達しない | 「未ログイン（一般利用者）｜管理画面の共通認証により拒否される。」／`pattern: ['^/%eccube_admin_route%/',…] … login_path: admin_login` | md:219-221／sec:41-46 | 0 |
| L1-M0905-002 | http_status | CSS管理はGET/POST同一ルート `/%eccube_admin_route%/content/css`（name=admin_content_css）。GET=HTTP200で画面表示 | `#[Route(path: '/%eccube_admin_route%/content/css', name: 'admin_content_css', methods: ['GET', 'POST'])]` | CC:39-41／md:72-73 | 0 |
| L1-M0905-003 | display_field | カード見出し「CSS設定」/"CSS Settings" | `<span class="card-title">{{ 'admin.content.css__card_title'\|trans }}</span>`／ja「CSS設定」／en "CSS Settings" | twig:81／ja:2937／en:2624／md:84 | 1 |
| L1-M0905-004 | display_field | 画面文言: 項目見出し「コード」/"Codes"・必須バッジ「必須」/"Required"・登録ボタン「登録」/"Register"・戻り導線ラベル「CSS管理」/"CSS"（遷移先はページ管理=L1-025） | twig:95,97,118,125の`\|trans`キー（admin.content.page_source_code／admin.common.required／admin.content.css_management／admin.common.registration） | twig:95,97,118,125／ja:2914,1721,2852,1629／en:2601,1749,2539,1661／md:84 | 1 |
| L1-M0905-005 | message | ツールチップ「カスタマイズ用CSSファイルを編集します。CSSで記述します。」/"Editing the CSS file. Coding has to be with CSS."（コード見出しのtitle属性） | `<div class="d-inline-block" data-bs-toggle="tooltip" … title="{{ 'tooltip.content.css_source_code'\|trans }}">` | twig:94／ja:3642／en:3256／md:263 | 1 |
| L1-M0905-006 | message | 制限案内が全文で**一度だけ**表示（addFlashOnce） | `$this->addInfoOnce('admin.common.restrict_file_upload_info', 'admin');`／ja「この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。」／en "If this feature is used infrequently, disabling it while not in use provides additional security. You can disable this feature by setting the environment variable ECCUBE_RESTRICT_FILE_UPLOAD to 1." | CC:43／AC:152-155,188-193／ja:1795／en:1800／md:107,262 | 1 |
| L1-M0905-007 | display_field | 入力項目はコード1つ: フォーム項目キー`css`・TextareaType・required偽（required属性なし）。実体は非表示div内のtextarea（id=form_css・name=form[css]）で、前面表示はAce | `->add('css', TextareaType::class, [ 'required' => false, ]);`／`<div style="display: none">{{ form_widget(form.css) }}</div>`／`$('#form_css').val(editor.getValue());` | CC:45-49／twig:100-102,66／md:90,152-154 | 0 |
| L1-M0905-008 | display_field | コード入力領域はAce初期化: CSSモード・テーマtomorrow・基本補完/スニペット/ライブ補完/不可視文字有効・初期値=フォームCSS値・リサイズ追従・高さ480px | `editor.session.setMode('ace/mode/css'); editor.setTheme('ace/theme/tomorrow'); editor.setValue('{{ form.css.vars.value\|escape('js') }}'); editor.setOptions({ enableBasicAutocompletion: true, enableSnippets: true, enableLiveAutocompletion: true, showInvisibles: true });`／`<div id="editor" style="height: 480px" …>` | twig:29-45,100／md:85 | 0 |
| L1-M0905-009 | fs_effect | 初期表示: `customize.css`が**存在しかつ書き込み可能なときに限り**、その全文をフォームのコード値へセット（エディタへ初期表示） | `$cssPath = $this->getParameter('eccube_html_dir').'/user_data/assets/css/customize.css'; if (file_exists($cssPath) && is_writable($cssPath)) { $form->get('css')->setData(file_get_contents($cssPath)); }` | CC:52-55／md:109,144 | 0 |
| L1-M0905-010 | fs_effect | 不存在または書き込み不可のときは初期表示せず空のエディタ | 「対象ファイルが存在しない｜初期表示はせず空のエディタとなる。」「存在するが書き込み不可｜初期表示で現行内容を読み込まない（空表示）。」（CC:53-55の条件不成立分岐=setDataなし） | md:160-161／CC:53-55 | 0 |
| L1-M0905-011 | fs_effect | 保存=フォームのコード値で`customize.css`を**全文上書き**（解釈・整形なし・マージなし。無ければ新規作成=dumpFileが親ディレクトリ作成+**親dir内の一時ファイル書込+renameによる置換**） | `$fs->dumpFile($cssPath, $form->get('css')->getData());`／「入力されたコードを解釈・整形せず全文をそのまま保存する。」／`if (!is_dir($dir)) { $this->mkdir($dir); } … $tmpFile = $this->tempnam($dir, basename($filename)); … $this->rename($tmpFile, $filename, true);` | CC:59-61／md:138,143／vfs:640-669（v7.4.0・rename=vfs:669実測） | 0 |
| L1-M0905-012 | message | 保存成功フラッシュ「保存しました」/"Saved" | `$this->addSuccess('admin.common.save_complete', 'admin');` | CC:62／ja:1591／en:1636／md:269,282 | 1 |
| L1-M0905-013 | fs_effect | 保存成功時は同一のCSS管理画面へリダイレクト | `return $this->redirectToRoute('admin_content_css');` | CC:73／md:119,231 | 0 |
| L1-M0905-014 | fs_effect | 保存対象は単一ファイルのみ。保存先絶対パス=`%kernel.project_dir%/html/user_data/assets/css/customize.css`（eccube_html_dir=`%kernel.project_dir%/html`）。他パスへの書込コードなし | `public const CSS_PATH = '/html/user_data/assets/css/';`／`eccube_html_dir: '%kernel.project_dir%/html'`（書込呼出はCC:61の1箇所のみ=実引き） | CC:30,52,61／eyml:95／md:142,152 | 0 |
| L1-M0905-015 | fs_effect | 書込成功後にのみ、defaultファイルアダプタで配信用パス`/html/user_data/assets/css/`へ`customize.css`として同名アップロード（オプション=s3_content_bucket_name）。**ストレージ側の観測手段は未契約=候補では主張しない** | `$fileAdapter = $this->fileManager->getAdapter(); $contentBucketOptions = $this->fileManager->getContentBucketOptions(); $fileAdapter->upload($cssPath, $this::CSS_PATH, 'customize.css', $contentBucketOptions);`／`return ['s3_bucket_name' => $this->eccubeConfig->get('s3_content_bucket_name')];` | CC:64-71／FM:56-71,265-268／md:118,145 | 0 |
| L1-M0905-016 | message | ファイル書込のIOException時: エラーフラッシュ「保存に失敗しました」/"Failed to save"を表示し、**リダイレクトせず同一画面のフォームビューを再描画** | `} catch (IOException $e) { $message = trans('admin.common.save_error'); $this->addError($message, 'admin'); log_error($message, [$cssPath, $e]); }`（catch後にreturnせずCC:81-83のビュー返却へ到達） | CC:74-83／ja:1592／en:1637／md:121-127,270 | 1 |
| L1-M0905-017 | log | 書込失敗時はメッセージ・対象パス・例外をログ記録（**観測手段未契約=実行保留**） | `log_error($message, [$cssPath, $e]);` | CC:77／md:126,290 | 0 |
| L1-M0905-018 | validation_rule | サーバ側検証なし: css項目にconstraints指定なし・required偽・文字数上限なし・CSS構文検証なし→任意テキスト（構文不正含む）が検証成功で保存される | `->add('css', TextareaType::class, [ 'required' => false, ]);`（constraintsオプション指定なし=CC:45-49全文実引き）／「サーバー側でSymfonyの文字数・形式制約を課さない。CSS構文の妥当性検証も行わない。」 | CC:45-49／md:146,210 | 0 |
| L1-M0905-019 | validation_rule | コード空でも検証は成立し保存処理が実行され、空内容で上書きされる（**空送信→null→空バイト書込の同値はPHP実行時意味論=バイト確定は要実機**） | 「コードを空のまま登録｜項目は任意のため検証は妨げない。空内容でファイルを上書きし、空のCSSが保存・反映される。」 | md:132,162／CC:47-49,58-61 | 0 |
| L1-M0905-020 | display_field | エディタ注釈にエラー種別が1件でもあれば`#save-button`をdisabled・エラー種別なし/注釈空なら活性（クライアント側制御。サーバ保存可否に影響しない） | `if (annot[key].type && annot[key].type == 'error') { $save_button.prop('disabled', true); break; } else { $save_button.prop('disabled', false); } … if (typeof(annot) == 'object' && annot.length < 1) { $save_button.prop('disabled', false); }` | twig:47-64／md:86,96,211 | 0 |
| L1-M0905-021 | display_field | フォーム送信時、隠しtextareaへエディタ現在値を書き戻してから送信（送信値=エディタ内容） | `$('#content_css_form').on('submit', function(elem) { $('#form_css').val(editor.getValue()); });` | twig:65-67／md:87,97 | 0 |
| L1-M0905-022 | security_rule | CSRF: フォームは`form[_token]`を持ち（FormType既定CSRF）、token不正はisValid不成立→**保存されず同一画面をHTTP200で再描画・成功フラッシュなし**。CSRFエラー文言（vxlf-ja「CSRFトークンが無効です、再送信してください。」）はルートフォームに付くが、twigは`form_errors(form.css)`のみ描画=**画面には表示されない** | `{{ form_widget(form._token) }}`／`if ($form->isSubmitted() && $form->isValid()) {`／`'csrf_message' => 'The CSRF token is invalid. Please try to resubmit the form.',`／`{{ form_errors(form.css) }}` | twig:72,102／CC:58／vendor/symfony/form/Extension/Csrf/Type/FormTypeCsrfExtension.php:104／vxlf-ja:14-15／md:34 | 0 |
| L1-M0905-023 | auth_rule | `eccube_restrict_file_upload==='1'`かつルートが制限リスト内→HTTP403「この機能は管理者によって制限されています。」/"This functionality is restricted by the administrator."。**admin_content_cssは制限リストに含まれる（eyml:267）**＝GET/POSTとも到達前遮断 | `if ($this->eccubeConfig['eccube_restrict_file_upload'] === '1' && in_array($route, $restrictUrls)) { throw new AccessDeniedHttpException(trans('exception.error_message_restrict_url')); }`／`- admin_content_css` | RL:38-42／eyml:259-269,267／ja:3790／en:3401／md:75,164,222 | 1 |
| L1-M0905-024 | display_field | 当画面はモーダル・確認ダイアログ・トーストを持たない（メッセージはフラッシュと項目エラー表示のみ） | 「当画面はモーダル、確認ダイアログ、トーストを持たない。」（twig:70-133全文にmodal/dialog/toast要素0件=実引き） | md:89／twig:70-133 | 0 |
| L1-M0905-025 | fs_effect | 戻り導線「CSS管理」リンクはページ管理（admin_content_page）へ遷移 | `<a class="c-baseLink" href="{{ url('admin_content_page') }}"> … <span>{{ 'admin.content.css_management'\|trans }}</span>` | twig:116-119／md:74,233 | 0 |
| L1-M0905-026 | fs_effect | GET表示は書込なし（dumpFileはisSubmitted&&isValid分岐内のみ=フォーム未送信のGETでは実行されない） | `$form->handleRequest($request); if ($form->isSubmitted() && $form->isValid()) { … $fs->dumpFile(…)`（書込は当分岐内のみ） | CC:57-61／md:193 | 0 |
| L1-M0905-027 | fs_effect | 同時編集は最後に書き込まれた内容が残る（版管理・楽観ロックなし。CCにロック処理なし=実引き） | 「複数の管理者が同時に保存した場合、最後に書き込まれた内容が残る。版管理・楽観ロックは行わない。」 | md:175,337／CC:41-84 | 0 |
| L1-M0905-028 | api | 保存処理は店舗フロント向け業務APIを呼び出さない（外部呼出はストレージuploadのみ=CC全文実引き。バッチ起動なし） | 「当画面の保存処理は店舗フロント向けの業務APIを呼び出さない。保存後に外部ファイルストレージへのアップロード操作を行う。」 | md:183／CC:41-84 | 0 |
| L1-M0905-029 | display_field | 適用経路: 既定テーマのフレームがuser_data配下`assets/css/customize.css`へのlinkをヘッダ末尾付近に出力（配信キャッシュ・CDN反映は配信側設定=対象外） | `<link rel="stylesheet" href="{{ asset('assets/css/customize.css', 'user_data') }}">` | dft:108／md:305 | 0 |
| L1-M0905-030 | log | ログ禁止事項: パスワード・なりすまし対策トークン・Cookie値・セッションID完全値（**設計書由来・コードで不出力を立証していない・観測未契約=実行保留**） | 「- パスワード ／ - なりすまし対策トークン ／ - Cookie値 ／ - セッションIDの完全値」 | md:294-298（設計書由来のみ） | 0 |

**既知バグ候補（BC-DRAFT）**: なし（本機能で設計書と実装の乖離・実装内不整合は検出していない）。
**設計書側の齟齬（DOC-DRAFT）**: なし。なお「画面上は必須バッジを表示するがフォーム項目は任意」は
設計書自身が明記済み（md:154）のため齟齬に数えない（§8の009 excluded根拠として使用）。

## §2 SEED三段参照設計（使い捨て専用SEED＋afterEach復元＋S0スナップショット同値。全て`@TBD-D5`）

DB不使用のためSEEDは**ファイル配置**である。期待値の正はL1オラクルID（SEEDを期待値の正にしない三段参照。
初期表示・保存の判定は「fs.ts実測のファイル内容との恒等写像」で行い、SEED定義値を期待リテラルにしない）。

| SEED | 内容 | 用途・規律 |
|---|---|---|
| SEED-M0905-S0@TBD-D5 | fs.ts `restoreS0()`（§6.2.2）で `CSS_ABS=/var/ec-cube/html/user_data/assets/css/customize.css`（絶対パス=コンテナ実測で確定）へ既知内容 `CSS_S0`（固定文字列 `/* E2E-M0905-S0 */`+固定1ルール）を`mkdir -p`込みで配置し、`chown www-data`+`chmod 664`（アプリ書込可）。配置直後のsha1を**S0スナップショット**として記録。※現況コンテナは`…/assets/css`ディレクトリ自体が不存在（実測）のためdir作成を含む | 初期表示（C-006）・無副作用（C-008）・全破壊系の基準状態。**破壊系ケースはafterEachで`restoreS0()`を実行し、sha1がS0スナップショットと同値であることを機械確認**（m05-13教訓） |
| NOFILE状態（テスト内遷移） | fs.tsで customize.css を退避（mv）し不存在化 | C-007（空エディタ）・C-013（新規作成）専用。afterEachでS0復元 |
| PRE退避（suite前後） | beforeAllで`exists`+`statOwnerMode`によりPRE状態を記録・退避（不存在なら不存在フラグ記録）→S0配置。afterAllで`restorePre()`（§6.2.2。不存在なら削除・fs.ts作成dirは撤去）。**現況実測はPRE不存在側** | 環境原状回復。**共有ステージングでは実行しない**（保存は店舗フロント表示に影響=専用環境必須） |
| SEED-M01-ADMIN@TBD-D5（既存） | 管理者ログイン資格 | 全ケースのログイン前提（m01系と共通） |

- 破壊系の入力値は `E2E-<runid>-` マーカー入りCSSで衝突回避。並行実行は同一ファイルを奪い合うため**本機能はserial必須**。

## §3 textarea項目マトリクス（任意/最大長/特殊文字×保存反映）

本機能の入力項目は**コード（css）1つ**（L1-007）。DB列は存在しない（md:202）ため、層は
「Form層×ファイル層（fs.ts観測）×表示層（エディタ往復）」で構成する。

| 軸 | 一次資料の確定値 | 検証ケース |
|---|---|---|
| 必須/任意 | **任意**（`'required' => false`=CC:48。required属性なし。画面の必須バッジは表示のみ=md:154） | C-012（空で保存成功）／009はエラー側構成不能=excluded（§9-EX） |
| 最大長 | **Form層制約なし**（constraints指定なし=CC:45-49・md:210「文字数・形式制約を課さない」）。DB層なし（ファイル）。**上限の不在は証明不能のため「最大長+1で拒否」系は前提ノイズとして期待テキストへ再配分**（§8・§10） | 境界ケースなし（拒否層が存在しない）。POSTサイズ上限（php設定）は本機能外=断定しない |
| 特殊文字 | **エスケープ・整形なしで全文そのまま保存**（md:138・CC:61 dumpFile直書き）。表示経路のみ`escape('js')`でAceへ流し込み（twig:33）＝保存バイトには影響しない | C-011（引用符・バックスラッシュ・マルチバイト・改行の往復一致） |
| 構文 | **サーバ側CSS構文検証なし**（L1-018）。クライアント注釈は登録ボタン活性制御のみ（L1-020） | C-014（構文不正でも保存）／C-016（注釈→非活性） |
| 保存反映 | customize.css全文置換（L1-011・マージなし）→ストレージ同名アップロード（L1-015・観測未契約）→フロントはdft:108のlinkで参照（L1-029・配信反映は対象外） | C-010（ファイル反映）／C-025（ストレージ=実行保留）／C-026（フロントlink=補完） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全31行を実体掲載**）

### §4.1 bound対応候補行（21行。§8の59対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-05_admin_content_content_css	E2E-M0905C-001	IT-15	未認証	P1	未ログインでCSS管理URL直接アクセス→管理ログインへ	未ログイン（cookie無しcontext）	—	1. GET /%eccube_admin_route%/content/css	admin_loginのログイン画面へリダイレクトされ本画面は表示されない [L1:L1-M0905-001]				
m09-05_admin_content_content_css	E2E-M0905C-002	IT-12	画面レイアウト	P2	CSS管理画面がHTTP200でカード見出し「CSS設定」を表示	ログイン済(SEED-M01-ADMIN)	—	1. GET /content/css 2. span.card-title文言を読む	HTTP200＋カード見出し「CSS設定」 [L1:L1-M0905-002,L1-M0905-003]				
m09-05_admin_content_content_css	E2E-M0905C-004	IT-15	コードエディタ	P1	コード入力欄がAce（CSSモード・テーマtomorrow）で初期化され送信値は隠しtextarea	ログイン済	—	1. 画面を開く 2. #editorの存在と高さ480pxを確認 3. page.evaluateでace.edit('editor')のsession mode='ace/mode/css'・theme='ace/theme/tomorrow'を読む 4. #form_cssが非表示textareaで1件のみ存在することを確認	#editorがAce初期化（CSSモード・テーマtomorrow）＋送信値保持は隠しtextarea#form_css（name=form[css]） [L1:L1-M0905-008,L1-M0905-007]				
m09-05_admin_content_content_css	E2E-M0905C-006	IT-20	初期表示	P1	保存済みカスタマイズCSSの全文がエディタへ初期表示される（恒等写像）	ログイン済／SEED-M0905-S0（存在かつ書込可）	—	1. fs.tsでcustomize.cssの実内容を取得 2. 画面を開く 3. page.evaluateでeditor.getValue()と#form_css valueを読む	エディタ値・textarea値がfs.ts実内容（S0）と全文一致・画面にエラー表示なし [L1:L1-M0905-009; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-007	IT-02	初期表示	P1	customize.css不存在→初期表示せず空のエディタ	ログイン済／NOFILE状態（fs.tsで退避・afterEach: S0復元）	—	1. fs.tsでcustomize.cssを退避し不存在化 2. 画面を開く 3. editor.getValue()と#form_css valueを読む	エディタ・textareaが空（初期表示されない） [L1:L1-M0905-010; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-008	IT-26	無副作用	P2	GET表示のみではファイルへ何も書き込まれない	ログイン済／SEED-M0905-S0	—	1. fs.tsでsha1記録（S0スナップショット） 2. /content/cssをGETで2回表示 3. fs.tsでsha1再取得し同値確認	sha1がS0と同値（表示のみで追加・変更されない） [L1:L1-M0905-026; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-010	IT-15	保存成功	P1	CSSを入力し登録→全文上書き保存・成功フラッシュ・同一画面リダイレクト・他ファイル差分0	ログイン済／SEED-M0905-S0	css=`/* E2E-<runid>-V1 */ .e2e-m0905 { color: #123456; }`	1. fs.tsでuser_data配下のsha1一覧を記録 2. エディタへ入力し登録押下 3. フラッシュと遷移先URLを読む 4. fs.tsでcustomize.css全文照会（入力値一致・S0断片の残存なし） 5. customize.css以外の差分0を確認 6. リダイレクト後のエディタ初期値=保存値を確認（afterEach: S0復元+sha1同値）	「保存しました」＋/content/cssへリダイレクト＋ファイル=入力値と全文一致（マージなし）＋customize.css以外の差分0＋再表示で保存値が初期表示 [L1:L1-M0905-011,L1-M0905-012,L1-M0905-013,L1-M0905-014,L1-M0905-009; fixture:SEED-M0905-S0@TBD-D5]（ストレージ反映はC-025=実行保留）				
m09-05_admin_content_content_css	E2E-M0905C-012	IT-22	任意	P1	コード空で登録→必須エラーなく保存が継続し空内容で上書き	ログイン済／SEED-M0905-S0	css=空（エディタ全消去）	1. エディタを全消去し登録押下 2. エラー表示が無いこと・フラッシュを読む 3. fs.tsでファイル内容照会（afterEach: S0復元）	必須エラーが表示されず「保存しました」＋customize.cssが空内容へ上書き（空バイト同値の確定は要実機=L1-019注記） [L1:L1-M0905-019,L1-M0905-012; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-013	IT-26	新規作成	P1	不存在状態から登録→customize.cssが新規作成される	ログイン済／NOFILE状態（fs.tsで退避）	css=`/* E2E-<runid>-NEW */`	1. fs.tsで不存在化 2. 画面を開き（空エディタ）入力・登録 3. フラッシュを読む 4. fs.tsで存在と全文一致を確認（afterEach: S0復元）	「保存しました」＋customize.cssが新規作成され内容=入力値と全文一致 [L1:L1-M0905-011,L1-M0905-012; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-014	IT-25	構文検証なし	P1	構文不正CSSでも保存される（サーバ側CSS構文検証なし・非UI直POST）	ログイン済セッション（同一context）／SEED-M0905-S0	§6.1契約: form[css]=`body { color: ; !!broken`・form[_token]=正規値	1. 画面GETで正規tokenを取得 2. 直POST送信 3. 応答（302→/content/css）を確認 4. fs.tsで全文一致（afterEach: S0復元）	検証エラーにならず302リダイレクト＋ファイル=送信値と全文一致＝サーバ側でCSS構文を検証しない [L1:L1-M0905-018,L1-M0905-011; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-015	IT-12	フォーム項目	P2	送信項目はform[css]（textarea・required属性なし）で保存先はhtml/user_data/assets/css/customize.css	ログイン済	—	1. 画面を開く 2. #form_cssのtagName=textarea・name=form[css]・required属性なしを読む 3. 保存先パスはC-010のfs.ts照会先（html/user_data/assets/css/customize.css）として固定	textarea name="form[css]"・required属性なし＋保存先パス=html/user_data/assets/css/customize.css [L1:L1-M0905-007,L1-M0905-014]				
m09-05_admin_content_content_css	E2E-M0905C-016	IT-12	JS活性制御	P2	エラー種別注釈で「登録」ボタン非活性・注釈解消で活性（クライアント制御）	ログイン済	エラー種別注釈を誘発するCSS（**確実な誘発値はAce同梱ワーカー依存=要実機**）	1. page.evaluateでeditor.setValue(エラー誘発CSS) 2. changeAnnotation発火後の#save-button disabled=真を確認 3. 正常CSSへ置換 4. disabled=偽を確認	エラー種別注釈1件以上でdisabled・エラー種別なし/注釈空で活性（サーバのバリデーションではない=相関バリの読み替えbound。§8-012/015） [L1:L1-M0905-020]（要実機=誘発値未確定）				
m09-05_admin_content_content_css	E2E-M0905C-017	IT-12	送信同期	P2	送信直前にエディタ現在値が隠しtextareaへ書き戻され送信値になる	ログイン済／SEED-M0905-S0	css=`/* E2E-<runid>-SYNC */`（editor.setValueのみ・textareaは旧値のまま）	1. editor.setValueで入力 2. 登録押下 3. page.on(request)でPOST bodyのform[css]を読む 4. フラッシュ・fs.tsで保存結果を確認（afterEach: S0復元）	POST送信値form[css]=エディタ現在値＋保存成功（エラーなく処理継続=相関バリの読み替えbound。§8-013） [L1:L1-M0905-021,L1-M0905-011; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-018	IT-25	モーダル	P2	モーダル・確認ダイアログ・トーストを持たない	ログイン済	—	1. 画面を開き登録押下まで操作 2. .modal要素・dialogイベント（page.on('dialog')）・トースト要素の不在を確認	モーダル/確認ダイアログ/トーストが発生しない（メッセージはフラッシュと項目エラー表示のみ） [L1:L1-M0905-024]				
m09-05_admin_content_content_css	E2E-M0905C-019	IT-25	画面遷移	P3	戻り導線「CSS管理」リンク→ページ管理へ遷移	ログイン済	—	1. a.c-baseLink（文言「CSS管理」）を押下 2. 遷移先URLを読む	/content/page（ページ管理=コンテンツ管理一覧）へ遷移 [L1:L1-M0905-025,L1-M0905-004]				
m09-05_admin_content_content_css	E2E-M0905C-020	IT-15	CSRF	P1	token改変POSTは保存されずファイルはS0と同一（非UI）	ログイン済セッション（同一context）／SEED-M0905-S0	§6.1契約: form[_token]=正規値の末尾1文字置換・form[css]=`E2E-<runid>-CSRF`	1. 画面GETで正規tokenを取得し末尾1文字置換 2. 直POST送信 3. 応答=HTTP200再描画・「保存しました」なしを確認 4. fs.tsでsha1がS0と同一であることを確認	保存されずファイル内容はS0と**同一**・成功フラッシュなし（CSRFエラー文言はform.css欄のみ描画のため画面非表示=L1-022） [L1:L1-M0905-022; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-021	IT-23	API	P1	保存処理は店舗フロント向け業務APIを呼び出さない	ログイン済／SEED-M0905-S0	css=有効値	1. page.on(request)で記録開始 2. 保存操作一式 3. 記録を走査（afterEach: S0復元）	ブラウザ発リクエストはadmin_content_cssへのPOST・リダイレクトGET・静的資産のみで業務API呼出なし（サーバ内部の外部呼出はストレージuploadのみ=CC:41-84実引きを根拠とし、ブラウザ観測で補強） [L1:L1-M0905-028; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-022	IT-26	同時編集	P1	同時編集は最後の保存が残る（楽観ロックなし）	ログイン済×2セッション／SEED-M0905-S0	A: css=`/* E2E-<runid>-A */`／B: css=`/* E2E-<runid>-B */`	1. A・B両セッションで画面を開く 2. Aが保存 3. Bが保存 4. fs.tsで全文照会（afterEach: S0復元。並行実行=serial必須）	エラーにならず最後に保存したBの内容が残る [L1:L1-M0905-027; fixture:SEED-M0905-S0@TBD-D5]				
m09-05_admin_content_content_css	E2E-M0905C-023	IT-26	書込失敗	P1	書込失敗時「保存に失敗しました」・リダイレクトせず同一画面に留まる	ログイン済／SEED-M0905-S0／書込失敗を誘発できる状態（**誘発手段は一次資料に規定なし=要実機**。骨子=§6.2.2: **CSS_PARENT=/var/ec-cube/html/user_data/assets/css をroot:root×mode555化**〔dumpFileは親dir内tempnam→rename=vfs:654-669のためファイル単体chmodでは誘発不可の可能性〕）	css=有効値	（誘発手段確定後）0. beforeEach: snapshotParentPerm()でCSS_PARENTのowner/modeを変更前記録 1. chown root:root+chmod 555で誘発 2. 登録押下 3. フラッシュと現在URL（リダイレクトなし）を確認 4. fs.tsで内容不変を確認 5. afterEach: restoreParentPerm()（記録値へchown/chmod復元・stat一致確認）→restoreS0()	「保存に失敗しました」表示・同一画面のフォームビュー再描画・ファイル内容不変（ログ記録はL1-017=観測未契約で別掲C-027） [L1:L1-M0905-016; fixture:SEED-M0905-S0@TBD-D5]（要実機=誘発の実効性・www-data補助グループ・復元後続確認）				
m09-05_admin_content_content_css	E2E-M0905C-024	IT-20	出力抑止	P1	ECCUBE_RESTRICT_FILE_UPLOAD=1でGET/POSTともHTTP403	管理者ログイン済／環境変数=1（**env切替が必要=要実機**）	GET /content/css／POST /content/css（正規token）	（env切替後）1. GETでstatusと文言を確認 2. 正規tokenでPOSTしstatus確認 3. fs.tsでファイル不変を確認	いずれもHTTP403「この機能は管理者によって制限されています。」・画面へ到達せず保存されない（admin_content_cssは制限URL一覧=eyml:267） [L1:L1-M0905-023]（要実機=env切替）				
m09-05_admin_content_content_css	E2E-M0905C-025	IT-15	ストレージ反映	P1	保存成功後にファイルストレージへ同名アップロードされる	ログイン済／SEED-M0905-S0／ストレージ観測手段（**未契約=実行保留**）	css=有効値	（観測手段確定後）1. 保存実行 2. ストレージ側の/html/user_data/assets/css/customize.cssを照会し内容一致を確認	書込成功後にのみdefaultアダプタで同名アップロード（オプション=s3_content_bucket_name） [L1:L1-M0905-015]（実行保留=ストレージ観測手段未契約）				
```

### §4.2 補完行（5行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合59行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-05_admin_content_content_css	E2E-M0905C-003	IT-12	画面レイアウト	P2	表示要素一式（見出し・必須バッジ・ツールチップ・戻り導線・登録ボタン）	ログイン済	—	1. 画面を開く 2. 項目見出し「コード」・バッジ「必須」・ツールチップtitle属性・#editor高さ480px・戻り導線「CSS管理」・登録ボタン「登録」を読む	見出し「コード」＋バッジ「必須」（項目は任意でもバッジ表示=md:154）＋title=「カスタマイズ用CSSファイルを編集します。CSSで記述します。」＋#editor(480px)＋「CSS管理」リンク＋「登録」ボタン [L1:L1-M0905-004,L1-M0905-005,L1-M0905-008]（補完行・親test_idなし・設計書補完）				
m09-05_admin_content_content_css	E2E-M0905C-005	IT-20	情報表示	P2	制限案内が全文で一度だけ表示され再表示で消える	ログイン済（新規セッション）	—	1. 画面を開く 2. 案内全文一致と件数=1を確認 3. 再度同URLを開く 4. 案内の不在を確認	初回表示にL1-006のja全文が1件のみ表示・リロード後は表示されない（addFlashOnce） [L1:L1-M0905-006]（補完行・親test_idなし・設計書補完）				
m09-05_admin_content_content_css	E2E-M0905C-011	IT-22	特殊文字	P2	特殊文字・マルチバイト含むCSSが整形されず全文そのまま保存され再表示も一致	ログイン済／SEED-M0905-S0	css=`/* 日本語コメント "dq" 'sq' \\ */`+改行+`.e2e::after { content: "a'b\"c"; }`	1. 入力し登録 2. fs.tsで全文バイト一致を確認 3. リダイレクト後のエディタ値一致を確認（afterEach: S0復元）	ファイル=入力値と完全一致（解釈・整形・エスケープなし）＋再表示一致（表示経路のescape('js')は往復に影響しない=twig:33） [L1:L1-M0905-011,L1-M0905-009; fixture:SEED-M0905-S0@TBD-D5]（補完行・親test_idなし・設計書補完 md:138）				
m09-05_admin_content_content_css	E2E-M0905C-026	IT-02	適用経路	P2	店舗フロントのHTMLにcustomize.cssへのlinkが出力される	フロント（未ログイン可）	—	1. フロントTOPをGET 2. link[rel=stylesheet]のhref群を走査	user_data配下 assets/css/customize.css へのlink要素が存在（hrefのホスト部はasset設定依存=パス末尾一致で判定。配信キャッシュ/CDNの反映は対象外=md:305） [L1:L1-M0905-029]（補完行・親test_idなし・設計書補完）				
m09-05_admin_content_content_css	E2E-M0905C-027	IT-20	ログ	P3	書込失敗ログ記録と秘密値不出力（実行保留）	ログイン済	—	（ログ観測手段確定後）1. C-023の失敗系操作 2. アプリケーションログを走査	失敗時にメッセージ・対象パス・例外が記録され、パスワード・トークン・Cookie値・セッションID完全値が出ない [L1:L1-M0905-017,L1-M0905-030]（補完行・親test_idなし・設計書補完・観測手段未契約=実行保留。L1-030は設計書由来でコード立証なし）				
```

### §4.3 -EN行（5行。LS=1 claimのlocale多重・対応ja行と同一親）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-05_admin_content_content_css	E2E-M0905C-002-EN	IT-12	画面レイアウト	P2	カード見出し（en）	ログイン済／locale=en	—	同C-002	"CSS Settings" [L1:L1-M0905-003]				
m09-05_admin_content_content_css	E2E-M0905C-003-EN	IT-12	画面レイアウト	P2	表示要素文言（en）	ログイン済／locale=en	—	同C-003	"Codes"・"Required"・"Register"・tooltip="Editing the CSS file. Coding has to be with CSS." [L1:L1-M0905-004,L1-M0905-005]				
m09-05_admin_content_content_css	E2E-M0905C-005-EN	IT-20	情報表示	P2	制限案内（en）	ログイン済／locale=en	—	同C-005	L1-006のen逐語（"If this feature is used infrequently, …"）が一度だけ表示 [L1:L1-M0905-006]				
m09-05_admin_content_content_css	E2E-M0905C-010-EN	IT-15	保存成功	P2	保存成功フラッシュ（en）	ログイン済／SEED-M0905-S0／locale=en	同C-010	同C-010	"Saved" 表示＋同一画面リダイレクト [L1:L1-M0905-012]				
m09-05_admin_content_content_css	E2E-M0905C-019-EN	IT-25	画面遷移	P3	戻り導線ラベル（en）	ログイン済／locale=en	—	同C-019	リンク文言 "CSS"・/content/page へ遷移 [L1:L1-M0905-004,L1-M0905-025]				
```

## §5 locale対応表

LS=1: **7claim**（L1-003/004/005/006/012/016/023）→ **-EN 5行**（§4.3）。
-EN行を作らないLS=1: L1-016（C-023=要実機〔誘発手段未確定〕。ja/en文言は§1で確定済み）・
L1-023（C-024=要実機〔env切替〕。同）。
en文言はすべてen一次資料逐語（messages.en.yaml。ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。

## §6 判定手段骨子（候補=未実装）＋保存先観測（fs.ts骨子）＋_drafts隔離lint証跡

### §6.1 request契約

- フォーム直POST: `POST /%eccube_admin_route%/content/css`（application/x-www-form-urlencoded）。
  フィールド=`form[css]`・`form[_token]`（フォーム名は`form`=FormType既定。twig:66の`#form_css`と
  twig:72の`form_widget(form._token)`から確定）。正規tokenは同一contextの画面GETで`input[name="form[_token]"]`
  から取得。改変token=正規値の末尾1文字置換。
- UI経由: `#editor`（Ace）へ`page.evaluate`で値設定→`#save-button`押下（送信直前同期=twig:65-67が
  `#form_css`へ書き戻す）。
- 未実装・実走なし（候補規律）。ログイン済みcontextのcookie共有で送信（m09-01と同方式）。

### §6.2 保存先観測手段 — fs.ts再利用契約（db.ts同格の観測道具契約。m09-02/m09-03/m09-06のFS系と共通）

**位置づけ**: 本節はdb.tsと同じ**観測道具の再利用契約**である。機能別に変わるのは「対象絶対パスとSEED定義」
のみで、関数契約は全FS系機能（m09-02のuser_data観測を含む）で共通とする。実装は`e2e/helpers/fs.ts`
（候補=未実装。実装は実装wave）。

**§6.2.1 接続・パス定数（コンテナ実測で確定。2026-07-24実測）**

| 定数 | 確定値 | 確定根拠（実測コマンド） |
|---|---|---|
| `E2E_WEB_CONTAINER` | 既定 `ec-cube-enterprise-ec-cube-1`（**稼働実測済み**。他環境は環境変数で上書き） | `docker ps --format '{{.Names}}'` に実在（docker-compose.yml サービス名`ec-cube`） |
| `APP_ROOT` | `/var/ec-cube` | `docker exec ec-cube-enterprise-ec-cube-1 pwd`＝`/var/ec-cube`（Dockerfile:13 `ENV PROJECT_ROOT /var/ec-cube`・同:108 `WORKDIR ${PROJECT_ROOT}`と一致） |
| `HTML_DIR` | `/var/ec-cube/html` | `docker exec … php bin/console debug:container --parameter=eccube_html_dir`＝`/var/ec-cube/html`（eyml:95 `%kernel.project_dir%/html`のコンテナ内解決値） |
| `CSS_ABS`（本機能の対象絶対パス） | **`/var/ec-cube/html/user_data/assets/css/customize.css`** | `HTML_DIR`+CC:52の相対部。※**現況実測: コンテナ内は`…/assets/css`ディレクトリ自体が不存在**（=環境の現在値はNOFILE側。S0配置が`mkdir -p`を含む理由） |
| `CSS_PARENT`（C-023誘発対象の親dir） | **`/var/ec-cube/html/user_data/assets/css`** | `dirname(CSS_ABS)`。dumpFileのtempnam→renameが行われるdir（vfs:654-669） |
| `USER_DATA_ABS` | `/var/ec-cube/html/user_data` | 実測 `drwxrwsrwx ubuntu:ubuntu`（誰でも書込可） |
| アプリ実行ユーザ | `www-data`（apache2ワーカー実測） | `docker exec … ps aux`。docker exec既定ユーザは`root`のため、**アプリ視点の権限判定は`docker exec -u www-data`で行う** |

全コマンドは**絶対パスのみ**を渡す（cwd非依存。`docker exec -w`は使わない）。

**実測ログ逐語引用（2026-07-24・本草案作成者がホストで実行。codex環境はdocker socket権限なしのため
後日の実機照合はこのコマンド列を再実行して突合すること）**:

```
$ docker ps --format '{{.Names}}'
ec-cube-enterprise-caddy-1
ec-cube-enterprise-ec-cube-1
ec-cube-enterprise-postgres_replica-1
ec-cube-enterprise-postgres_primary-1
localstack
ec-cube-enterprise-mailcatcher-1
redis

$ docker exec ec-cube-enterprise-ec-cube-1 pwd
/var/ec-cube

$ docker exec ec-cube-enterprise-ec-cube-1 php bin/console debug:container --parameter=eccube_html_dir
  eccube_html_dir   /var/ec-cube/html

$ docker exec ec-cube-enterprise-ec-cube-1 ls -ld /var/ec-cube/html/user_data/assets/css \
    /var/ec-cube/html/user_data/assets/css/customize.css
ls: cannot access '/var/ec-cube/html/user_data/assets/css': No such file or directory
ls: cannot access '/var/ec-cube/html/user_data/assets/css/customize.css': No such file or directory

$ docker exec ec-cube-enterprise-ec-cube-1 id -un
root

$ docker exec ec-cube-enterprise-ec-cube-1 ls -ld /var/ec-cube/html /var/ec-cube/html/user_data
drwxr-sr-x 8 ubuntu ubuntu 4096 Jun 10 11:37 /var/ec-cube/html
drwxrwsrwx 5 ubuntu ubuntu 4096 Jun 10 11:37 /var/ec-cube/html/user_data

$ docker exec ec-cube-enterprise-ec-cube-1 ps aux   # 抜粋: アプリ実行ユーザ
root       435  … /bin/sh /usr/sbin/apachectl -D FOREGROUND
www-data 50988  … /usr/sbin/apache2 -D FOREGROUND
```

**§6.2.2 関数契約（入出力・失敗時仕様）**

| 関数 | 実体コマンド（`docker exec $E2E_WEB_CONTAINER` 前置） | 入出力 | 失敗時仕様 |
|---|---|---|---|
| `exists(abs)` | `test -e <abs>` | exit0→true／exit1→false | exit>1（docker接続不能等）はthrow=ハーネス失敗（黙殺禁止） |
| `writableAsApp(abs)` | `-u www-data test -w <abs>` | exit0→true／exit1→false | 同上。**root判定は常に真になり得るため`-u www-data`必須** |
| `readFile(abs)` | `base64 <abs>` → ホスト側でdecode | ファイル全バイト（**base64経由=改行・バイナリ・末尾改行の変形ゼロ**） | 不存在等exit非0→throw（存在前提はexistsで先に確認） |
| `sha1(abs)` | `sha1sum <abs>` | 出力先頭40hex | exit非0→throw |
| `statOwnerMode(abs)` | `stat -c '%U:%G %a' <abs>` | `owner:group mode`文字列（復元用記録） | exit非0→throw |
| `snapshotUserData()` | `sh -c "cd /var/ec-cube/html/user_data && find . -type f \| LC_ALL=C sort \| xargs -d '\n' -r sha1sum"` | `Map<相対パス, sha1>`。**正規化: パスは`./`起点相対・順序=LC_ALL=C sortで固定・行区切りLF**。差分0判定=Map完全一致（C-008/C-010手順5の判定器） | exit非0→throw |
| `restoreS0()` | `sh -c "mkdir -p $(dirname CSS_ABS)"`→S0固定バイトを`base64 -d > CSS_ABS`で書込→`chown www-data:www-data CSS_ABS`＋`chmod 664 CSS_ABS` | 書込後に`sha1(CSS_ABS)`が**S0_SHA1（S0配置時に記録したスナップショット）と同値**であることを機械確認して返る | 同値不一致・exit非0→throw。**復元系のthrowはsuite abort**（以降の破壊系ケースを実行しない） |
| `removeCss()` | `sh -c "test -e <CSS_ABS> \|\| exit 0; mv <CSS_ABS> <CSS_ABS>.e2e-bak"` | NOFILE状態への遷移（C-007/C-013前提）。**分岐仕様: 元々不存在=既にNOFILE→exit0（正常）／存在時はmvを実行しmvのexitがそのまま返る** | **存在時のmv失敗（exit非0）→throw**（`\|\| true`による黙殺はしない=R2是正。NOFILE遷移失敗を検知できないとC-007/C-013の前提が崩れるため） |
| `snapshotParentPerm()` | `stat -c '%U:%G %a' <CSS_PARENT>` | 出力（例 `ubuntu:ubuntu 2775`）をパースし `PARENT_PERM={owner,group,mode}` として**変更前に記録**（C-023 beforeEach） | 不存在等exit非0→throw（C-023はS0配置済み=CSS_PARENT実在が前提） |
| `restoreParentPerm()` | `chown <PARENT_PERM.owner>:<PARENT_PERM.group> <CSS_PARENT>` → `chmod <PARENT_PERM.mode> <CSS_PARENT>` → `stat -c '%U:%G %a' <CSS_PARENT>` で記録値一致を機械確認 | C-023 afterEachで**snapshotParentPerm記録値へ復元**（docker exec既定ユーザ=rootのためchown可） | exit非0・記録値不一致→throw=**suite abort**（親dir権限が戻らないと後続の全破壊系が成立しないため）＋手動復旧手順（記録値chown/chmod）をログ出力 |
| `restorePre()` | beforeAll記録に従い（i）PRE存在時: 退避コピー（コンテナ内`/tmp/e2e-m0905-pre.css`）から書き戻し＋`statOwnerMode`記録値でchown/chmod復元（ii）PRE不存在時: `rm -f CSS_ABS`（fs.tsが作成したdirは空ならrmdirで撤去） | 環境の原状回復（afterAll）。**現況実測はPRE不存在側**（`…/assets/css`不存在） | exit非0→throw=suite abort＋手動復旧手順をログ出力 |

- suite構成: beforeAll=`exists`+`statOwnerMode`でPRE記録→退避→`restoreS0()`／破壊系各ケース
  afterEach=`restoreS0()`（sha1同値の機械確認込み）／afterAll=`restorePre()`。
- 期待値の正はL1（三段参照）。fs.ts出力はSUT実挙動側の観測値であり期待リテラルにしない。
- ストレージアダプタ（S3/localstack）側の観測は**手段未契約=候補では主張しない**（C-025を実行保留で分離。
  FS側とフラッシュ表示のみで判定）。
- **C-023の誘発骨子（要実機・親ディレクトリ権限が対象。記録→誘発→復元を契約化=R2是正）**:
  `dumpFile`は**親dir内のtempnam→rename**で書き込む（vfs:654-669）ため、`CSS_ABS`単体のchmodでは
  親dir書込可なら失敗を誘発できない可能性が高い。手順:
  1. beforeEach: `snapshotParentPerm()`で`CSS_PARENT`のowner/modeを**変更前に記録**（`PARENT_PERM`）。
  2. 誘発: `chown root:root <CSS_PARENT>` → `chmod 555 <CSS_PARENT>`（www-data書込不能化。root execで実行）。
  3. 保存操作（C-023本文）。
  4. afterEach: `restoreParentPerm()`（**記録値`PARENT_PERM`へchown/chmodで復元し、statで一致を機械確認。
     不一致=suite abort**）→続けて`restoreS0()`（ファイル内容のS0同値確認）。restoreS0はファイルのみで
     親dir権限を戻さないため、**順序は必ずrestoreParentPerm→restoreS0**。
  確認対象（要実機で確定）: ①www-dataが補助グループ等で書込可にならないこと ②tempnam失敗が
  IOExceptionとしてCC:74へ到達すること ③復元後の後続ケースが全て成立すること。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード自体の
   リテラル`_drafts`〔oracle.ts:16-22実在確認〕を除く。ガードは`_drafts`・パス区切り・`..`を含むfileKeyの
   解決をthrowで拒否する機械強制）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は
   `_drafts/`の2ファイル（本md＋oracle草案）のみ。
3. 既存の参考物（`e2e/spec/admin/m09/m09_05_admin_content_content_css.spec.ts`・
   `integration_test/e2e/m09_05_admin_content_content_css_e2e_cases.md`）は読取参照のみで不変。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-002・C-003・C-004・C-006・C-007・C-012・C-013・C-015・C-017・C-018・C-019・C-026。
- Playwright+FS確認（fs.ts）: C-006〜C-013・C-017・C-021・C-022（保存・復元系はすべてfs.ts併用）。
- 非UI（request契約）: C-001・C-014・C-020（＋C-024のstatus確認）。
- **要実機**: C-016（エラー種別注釈の誘発値=Ace同梱ワーカー依存）・C-023（書込失敗誘発=親dir権限操作の
  実効性。§6.2.2骨子）・C-024（env切替）・L1-019の空バイト同値確認。
  （fs.tsコンテナ名・対象絶対パスは**実測確定済み**=§6.2.1。他環境インスタンスでは`E2E_WEB_CONTAINER`で上書き）
- **実行保留**: C-025（ストレージ観測手段未契約）・C-027（ログ観測手段未契約）・-EN 5行（D15）。
- 並行実行: **本機能はserial必須**（永続化先が単一共有ファイルのため。C-022は2セッション使用）。
  共有ステージングでは実行しない（フロント表示へ影響・§2 PRE退避を含め専用環境前提）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点・前提ラベルはノイズ=前提列は設計書subject名の機械循環。
前提が期待と矛盾する行は§10 C4に記録）。1候補ケース行=1 assertion bundle・多対一は`shared-observation`・
-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が
本文内で完結する**。

### 集計（59 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **56** | 下表（うち**読み替えbound: 4**〔012・013・014・015=相関バリ→クライアント注釈制御/送信同期への再解釈。per-ID明記は下表〕。うち**要実機/実行保留マーク: 6**〔003・043=ストレージ観測未契約／004・008・044=env切替／034=誘発手段未確定〕） |
| **TBD** | **0** | —（保留はboundの要実機/実行保留マークとして§9.1で管理。TBD=0を無条件の完全bindと読ませない） |
| **excluded** | **3** | EX-A 必須バリ不存在1（009）／EX-B DB相関不存在2（016・017） |
| 合計 | **59** | 欠落0・理由なし重複0 |

- 候補ケース行総数**31**（§4.1 bound対応21＋§4.2 補完5＋§4.3 -EN 5）。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 同一であること（CSRF・永続化先前提） | bound | C-020（token改変→ファイルがS0と**同一**=sha1同値） |
| 002 | 画面のコード入力欄に表示されるブラウザ内エディタであること | bound | C-004 |
| 003 | 保存したファイルの配信元となる外部ストレージであること | bound(実行保留) | C-025（ストレージ観測手段未契約） |
| 004 | 環境変数により特定管理URLのファイル更新を一括拒否する仕組みであること | bound(要実機) | C-024（env切替） |
| 005 | 保存済みカスタマイズCSSの全文が初期表示される | bound | C-006 |
| 006 | customize.cssへ全文上書き保存し、続けてストレージへ同名アップロード | bound | C-010（FS側）＋C-025（ストレージ側=実行保留） (shared) |
| 007 | ページ管理（コンテンツ管理一覧）へ遷移すること | bound | C-019 |
| 008 | 制限有効時は当URLがHTTP403で画面に到達しない | bound(要実機) | C-024 |
| 009 | 必須バリでエラーが表示され、対象処理が完了しないこと | **excluded** EX-A | —（§9-EX） |
| 010 | 必須バリでエラーが表示されず、対象処理を継続できること | bound | C-012（空で保存成功=任意の実証） |
| 011 | Aceエディタ初期化・CSSモード・テーマtomorrow | bound | C-004 (shared) |
| 012 | 相関バリでエラーが表示され、対象処理が完了しないこと | bound(**読み替え**) | C-016。**サーバ相関バリは不存在（入力1項目=CC:45-49・制約なし）。期待極性（エラー提示で処理が完了しない）を「エラー種別注釈→登録ボタン非活性=送信不能」（前提=JS挙動〔保存ボタン制御〕と整合）へ再解釈したbind。注釈はエラー文言表示でなくガター注釈+disabled** |
| 013 | 相関バリでエラーが表示されず、対象処理を継続できること | bound(**読み替え**) | C-017。**期待極性（エラーなく継続）を「送信直前同期→送信値=エディタ値→保存成功」（前提=JS挙動〔送信直前の同期〕と整合）へ再解釈したbind** |
| 014 | 相関バリでエラーが表示されず、対象処理を継続できること | bound(**読み替え**) | C-016の活性側 (shared)。**前提=モーダル・ポップアップは期待と不整合（ノイズ）。期待極性（エラーなく継続）を「注釈なし→ボタン活性→送信可能」へ再解釈したbind** |
| 015 | 相関バリでエラーが表示され、対象処理が完了しないこと | bound(**読み替え**) | C-016 (shared)。**前提=入力項目。012と同一の再解釈bind（非活性側）** |
| 016 | DBとの相関バリでエラーが表示されず継続 | **excluded** EX-B | —（§9-EX） |
| 017 | DBとの相関バリでエラーが表示され完了しない | **excluded** EX-B | —（§9-EX） |
| 018 | 単一ファイルcustomize.cssのみであること | bound | C-010（手順5: customize.css以外の差分0） |
| 019 | 登録内容の対象レコードが追加されること（保存方式前提） | bound | C-010 (shared) |
| 020 | 追加されないこと（初期表示の条件前提） | bound | C-008（GET表示は書込なし） |
| 021 | 追加されること（構文検証前提） | bound | C-014（構文不正でも保存される） |
| 022 | ファイルhtml/user_data/assets/css/customize.css（キーcss・TextareaType・required偽）であること | bound | C-015 |
| 023 | 追加されること（対象ファイル不存在前提） | bound | C-013（新規作成） |
| 024 | 追加されること（書込不可前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（書込不可の実挙動はC-023=要実機で別掲） |
| 025 | 追加されないこと（空登録前提=期待と矛盾） | bound | C-020,C-008 (shared)。前提ノイズ判定=§10 C4（空登録の実挙動は保存成功=C-012で肯定側実証） |
| 026 | 追加されること（IO例外前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（IO例外の実挙動はC-023） |
| 027 | 追加されないこと（画面とローカルファイル前提） | bound | C-008 (shared) |
| 028 | 追加されること（店舗フロントとの整合前提） | bound | C-010 (shared)。フロント側リンク出力は補完C-026・配信反映は対象外（md:174） |
| 029 | 実行結果の対象レコードが追加されること（同時編集前提） | bound | C-022（最後勝ち） |
| 030 | 店舗フロント向けの業務APIを呼び出さないこと | bound | C-021 |
| 031 | 更新内容の値が変更されること（失敗時前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（失敗時の実挙動はC-023） |
| 032 | 値が変更されないこと（入力前提） | bound | C-020 (shared・拒否時ファイル不変) |
| 033 | 値が変更されること（成功時出力前提） | bound | C-010 (shared) |
| 034 | 書き込み失敗時はエラーフラッシュを表示し同一画面に留まる | bound(要実機) | C-023（誘発手段の一次資料規定なし） |
| 035 | 値が変更されること（クライアント側エラー注釈前提） | bound | C-010 (shared)。注釈はボタン制御のみでサーバ保存に影響しない（L1-020・C4記録） |
| 036 | 値が変更されること（未ログイン前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（未ログインの実挙動はC-001） |
| 037 | 値が変更されないこと（ログイン済み管理者前提=期待と矛盾） | bound | C-020 (shared)。前提ノイズ判定=§10 C4 |
| 038 | 値が変更されること（制限有効前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（制限有効の実挙動はC-024=403） |
| 039 | 値が変更されないこと（CSS管理を開く前提） | bound | C-008 (shared・GET不変) |
| 040 | 値が変更されること（「登録」で保存成功前提） | bound | C-010 (shared) |
| 041 | 実行結果の値が変更されること（永続化先前提） | bound | C-010 (shared) |
| 042 | ブラウザ内エディタであること | bound | C-004 (shared) |
| 043 | 外部ストレージであること | bound(実行保留) | C-025 (shared) |
| 044 | 一括で拒否する仕組みであること | bound(要実機) | C-024 (shared) |
| 045 | 保存済みCSS全文が初期表示される | bound | C-006 (shared) |
| 046 | 全文上書き保存＋ストレージへ同名アップロード | bound | C-010＋C-025 (shared) |
| 047 | 管理画面の共通ルールに従いアクセスできない | bound | C-001（未ログイン誘導。権限個別拒否の詳細は認証認可実装を正とする=md:47の委譲を踏襲） |
| 048 | カード見出し「CSS設定」であること | bound | C-002(+EN) |
| 049 | 注釈エラー1件でも「登録」非活性・無ければ活性 | bound | C-016 |
| 050 | 送信時に隠しテキストエリアへ現在値を書き戻してから送信 | bound | C-017 |
| 051 | モーダル・確認ダイアログ・トーストを持たないこと | bound | C-018 |
| 052 | 画面表示データでエラーが表示されず継続（入力項目前提） | bound | C-006 (shared・表示にエラーなし) |
| 053 | サーバ側ではCSS構文の妥当性を検証しないこと | bound | C-014 (shared) |
| 054 | 画面表示データでエラーが表示されず継続（フォーム送信前提） | bound | C-010 (shared) |
| 055 | フォームのコード値でファイル全文を上書きすること | bound | C-010（全文一致・S0残存なし=マージなし） |
| 056 | 存在かつ書き込み可能なときに限り初期表示すること | bound | C-006（肯定側）+C-007（不存在側） (shared)。書込不可側の分岐は要実機（C-023骨子と同じ誘発依存=§9.1） |
| 057 | サーバー側でCSS構文の妥当性検証は行わないこと | bound | C-014 (shared) |
| 058 | ファイルcustomize.css（キーcss・TextareaType・required偽）であること | bound | C-015 (shared) |
| 059 | 初期表示はせず空のエディタとなること | bound | C-007 |

`func_scope_check` 判定: 親59/59会計済み（bound56+TBD0+excluded3）・欠落0・理由なし重複0・補完5行は
§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### §9.1 要実機・実行保留（bound内の保留マーク）

| 対象 | 理由 |
|---|---|
| 003・043→C-025 | ストレージアダプタ側の観測手段が未契約（S3等）。upload呼出はCC:64-71の実引きで根拠づくが、外部反映の実測は保留 |
| 004・008・044→C-024 | env切替（ECCUBE_RESTRICT_FILE_UPLOAD=1）が必要 |
| 034→C-023 | 書込失敗（IOException）の誘発手段が一次資料に規定なし。骨子=**親dir（CSS_PARENT）のroot所有×mode555化**（§6.2.2。dumpFileは親dir内tempnam→rename=vfs:654-669のためファイル単体chmodでは不足の可能性）。記録/復元は`snapshotParentPerm()`/`restoreParentPerm()`で契約化済み（変更前記録→誘発→記録値復元→restoreS0）。要実機確認=誘発の実効性・www-data補助グループ・復元後の後続成立 |
| 056の書込不可分岐 | 同上（書込不可状態の誘発が必要。不存在側C-007と肯定側C-006はbound実行可） |
| C-016（049・012・015） | エラー種別注釈を確実に誘発するCSS入力値がAce同梱ワーカー（vendor JS）依存で一次資料から確定できない |
| L1-019の空バイト同値 | 空送信→null→dumpFileの書込バイトはPHP実行時意味論（ソース逐語で空文字を断定できない）＝C-012の内容照会で実測確定 |
| C-027（補完） | ログ観測手段未契約。L1-030は設計書由来でコード立証なし |
| fs.ts接続定数 | **実測確定済み**（§6.2.1: コンテナ`ec-cube-enterprise-ec-cube-1`稼働・`CSS_ABS=/var/ec-cube/html/user_data/assets/css/customize.css`=debug:container実測）。他環境インスタンスでは`E2E_WEB_CONTAINER`で上書き（保留ではなく環境パラメータ） |
| -EN 5行 | D15（管理画面en切替）待ち |

### §9.2 §9-EX excluded per-ID表（全3件・実引き根拠。範囲一括でなく各IDを個別に正当化）

根拠の実引き:
(a) **必須バリデーション不存在**: css項目は`'required' => false`かつconstraints指定なし（CC:45-49全文実引き。
フォームの入力項目はcss1つのみ）。「フォーム項目は任意（`required`は偽）。サーバー側でSymfonyの文字数・
形式制約を課さない。」（md:210）「フォーム項目自体は任意であるが、画面上は必須バッジを表示する。」（md:154）
＝必須エラーを表示する層（HTML5 required属性・サーバNotBlank）がいずれも存在しない。
(b) **DB不使用**: 「本機能はデータベーステーブルへ保存しない。」（md:202）「DBスキーマを持たない。」（md:9）。
CCにEntityManager/Repository/Doctrine参照0件（use句=CC:14-26実引き）。

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 009 | EX-A | 「必須バリデーションでエラーが表示され、対象処理が完了しないこと。」→必須制約が全層に不存在（根拠a）のためエラー側は構成不能。**肯定側（010=エラーなく継続）はC-012でboundし偽陰性を防止**。前提=未ログインの実挙動はC-001が別途bound（047） |
| 016 | EX-B | 「DBとの相関バリデーションでエラーが表示されず…」→DB自体を使わない（根拠b）ため「DBとの相関」検証は構成不能 |
| 017 | EX-B | 「DBとの相関バリデーションでエラーが表示され…」→同上（根拠b） |

**偽陰性防御と読み替えの明示**: 相関バリデーション4行（012〜015）はm09-01のようにexcludedへ落とさず、
実在するクライアント挙動（注釈→ボタン制御=twig:47-64・送信直前同期=twig:65-67。前提列のsubject名とも
整合）への**読み替えbound**とした（m09-02の相関bound方式を踏襲）。読み替えである旨・サーバ相関バリが
不存在である旨はper-IDで§8に明記し、妥当性はD6/正式化時に再裁定する（隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 001「同一であること」 | 否定系（変更されない）の変種=同一性の肯定 | C-020はsha1のS0同値を直接assert（「保存されない」だけで済ませない） |
| 009/010（必須: 完了しない/継続） | 009=拒否側→**excluded**（必須不存在=構成不能）／010=成功側→C-012 | 拒否側を安易に「エラーが出ない」へ反転bindしない（期待は「エラーが表示され」のため不成立=excludedが正） |
| 012〜015（相関: エラー/継続） | 012,015=拒否側→C-016非活性側／013,014=成功側→C-017・C-016活性側 | 4行とも読み替えbound（§8にper-ID明記）。極性は非活性=完了しない／活性・送信成功=継続に対応づけ |
| 019〜028（追加される/されない） | 020,025,027=否定側→C-008/C-020（**ファイル不変assert必須**）／他=肯定側→C-010/C-013/C-014/C-022 | **024（書込不可）・025（空登録）・026（IO例外）は前提と期待が矛盾**→前提列は機械循環ノイズと判定し期待テキスト優先でbind。矛盾前提の実挙動はそれぞれC-023（要実機）・C-012・C-023で別途担保し、否定側への誤bindを回避 |
| 031〜041（変更される/されない） | 032,037,039=否定側（ファイル不変）／他=肯定側 | **031（失敗時）・036（未ログイン）・038（制限有効）は前提と期待が矛盾**→同上ノイズ判定・C4記録。各前提の実挙動はC-023・C-001・C-024が別途bound |
| 035（注釈前提+肯定「変更される」） | 肯定側 | 注釈はクライアントのボタン制御のみでサーバ保存を妨げない（L1-020・md:211）ことを根拠に肯定側C-010へ。注釈で非活性の場合の「変更されない」はC-016側の観測 |
| 056（存在かつ書込可能**に限り**） | 条件の両側 | 肯定側C-006・否定側（不存在）C-007を両方bound。書込不可側は誘発依存=要実機として保留を明示（「両側実証済み」と過大主張しない） |
| 020/039（GET不変） | 否定側 | C-008はsha1同値（差分0）を機械assert |

機械検査結果（工程6自己検査・実施済み）: §8参照ケースIDの§4実在=全一致（C-001〜C-027・-EN 5行）／
bound56+TBD0+excluded3=59=母集合件数一致／補完5行は親空で母集合会計外／oracle.json草案は本md§1から
機械導出・claim数30一致／L1参照の逐語quoteは一次資料file:lineと突合済み。未検出の極性取り違えが残る
可能性は否定しない（codex敵対レビューで検証されたい）。
