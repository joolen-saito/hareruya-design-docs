# B0候補: m09-06 JavaScript管理 — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正（Blocker=DOC-DRAFT-M0906-1の003/043をboundに算入〔未解決矛盾の期待変換〕／
> Major=L1-002・C-002のGET=HTTP200無条件断定）→R1是正版（本版）**
> （excluded3・読み替えbound4・保存先絶対パス実測・fs.ts確立解流用はR1で妥当承認）。
> R1是正: **(1) 003/043をbound会計から外しTBD（DOC-DRAFT別掲）へ分離**（m09-03確立規律の適用。
> 設計vs実装の配置先不一致はD6裁定・実装挙動を期待の正にしない。C-025はD6裁定前は
> **探索・証跡収集**に変更=期待結果を実装配置先で断定しない。会計=bound完全50+読替4+TBD(DOC)2+excluded3=59再実証）
> **(2) L1-M0906-002/C-002を条件付きへ修正**（制限無効〔ECCUBE_RESTRICT_FILE_UPLOAD≠1〕かつ認証済みの
> 条件下でのみGET=HTTP200。ルート定義はGET受付を示すだけで200を保証しない=制限有効時は403=L1-023。md/oracle両方）。
> **m09-05 CSS管理（codex R1-R2承認済み・双子機能）の確立解を最初から適用**:
> (1) §6.2=fs.ts再利用契約（db.ts同格・絶対パスのみ・test系exit1=false/exit>1=throw・
> snapshot正規化LC_ALL=C sort・base64バイト変形ゼロ・復元系throw=suite abort）。
> 対象絶対パスは**コンテナ実測で確定**（§6.2.1に2026-07-24実測コマンドと出力を逐語引用）。
> (2) `removeJs()`は`test -e <ABS> || exit 0; mv …`（`|| true`黙殺なし・存在時mv失敗=throw）。
> (3) C-023書込失敗誘発=**親dir権限**（root所有×mode555。dumpFileは親dir内tempnam→rename=vfs:654-669）。
> `snapshotParentPerm()`/`restoreParentPerm()`で変更前記録→誘発→記録値復元。
> afterEach順序=**restoreParentPerm→restoreS0**。要実機3点（§6.2.2）。
> (4) L1のvendor出典行は現物照合（vfs dumpFile=640-669・rename=669行を`nl -ba`実測）。
> (5) 会計分離（m09-03 R1でcodexが要求）: 読み替えbound・部分/保留マークは**別掲会計**に最初から分離。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-05_admin_content_content_css_executable_draft.md`（**双子機能・R2是正版**。
> textarea保存＋ファイル出力の同型。本書は§構成・契約・規律をそのまま踏襲し、js固有値のみ差し替え）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-06_admin_content_content_js_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）には書かない**。
> **本機能の特性**: DB永続化なし（設計書md:9,224）。永続化先は**単一ファイル
> `html/user_data/assets/js/customize.js`＋ファイルストレージ（フロント公開先）**。
> 観測はファイルシステム（fs.ts契約・§6.2）と画面。db.tsは使わない。**保存=破壊的全文上書き**のため、
> 使い捨て専用SEED（S0）＋afterEach復元＋S0スナップショット同値（sha1）を全破壊系ケースに課す（m05-13教訓・§2）。
> **m09-06固有**: 設計書がフロント公開先を`eccube_theme_front_dir`配下と定義するが実装から立証できない
> **設計・実装矛盾を検出=DOC-DRAFT-M0906-1（未解決・§1末尾）**。m09-05には無かった差異。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-06_admin_content_content_js.md`（最終コミット ec17cd0・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`／symfony/validator v7.4.3・symfony/filesystem v7.4.0（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁）: JsController.php=`26b23b22b9d0`／js.twig=`5b4782659ccf`／
  messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／validators.ja.yaml=`8cc5a327231c`／
  validators.en.yaml=`694fff6cd7b7`／eccube.yaml=`15ea9fd66c6f`／RestrictFileUploadListener.php=`86eac139be94`。
- fid_kubun.tsv（D1）: `M09-06｜標準｜standard-src+design｜区分不明=0`（fid_kubun.tsv:318実引き確認済み）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`）M09-06全**59行**
  （IT-M09-06-ADMIN-CONTENT-CONTENT-JS-001〜059。col1完全一致grep=59行実測）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環）。bindは各行の
  **「期待結果」実テキスト**で判定（§8に全59行の期待要旨併記。前提と期待の矛盾はC4=§10で記録）。

パス表記: JC=`src/Eccube/Controller/Admin/Content/JsController.php`／twig=`src/Eccube/Resource/template/admin/Content/js.twig`／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／
eyml=`app/config/eccube/packages/eccube.yaml`／RL=`src/Eccube/EventListener/RestrictFileUploadListener.php`／
sec=`app/config/eccube/packages/security.yaml`／AC=`src/Eccube/Controller/AbstractController.php`／
FM=`src/Eccube/Service/Upload/FileManager.php`／LSA=`src/Eccube/Service/Upload/Adapters/LocalSystemFileAdapter.php`／
S3A=`src/Eccube/Service/Upload/Adapters/S3FileAdapter.php`／vfs=`vendor/symfony/filesystem/Filesystem.php`（v7.4.0）／
vxlf-ja=`vendor/symfony/form/Resources/translations/validators.ja.xlf`／
dft=`src/Eccube/Resource/template/default/default_frame.twig`／
md=`functions/ec-cube-enterprise/m09-06_admin_content_content_js.md`。

## §1 L1原子オラクル表（30claim・全行逐語+file:line）

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0906-001 | auth_rule | 未認証は管理ログインへ誘導され本画面へ到達しない | 「未ログイン（一般利用者）｜管理画面の共通認証により拒否」／`pattern: ['^/%eccube_admin_route%/',…] … login_path: admin_login` | md:242,74／sec:41-46 | 0 |
| L1-M0906-002 | http_status | JavaScript管理はGET/POST同一ルート `/%eccube_admin_route%/content/js`（name=admin_content_js）。**認証済みかつ制限無効（eccube_restrict_file_upload≠'1'）の条件下で**GET=HTTP200で画面表示（**無条件保証ではない**: 制限有効時はGETも403=L1-023・未認証はL1-001） | `#[Route(path: '/%eccube_admin_route%/content/js', name: 'admin_content_js', methods: ['GET', 'POST'])]`（ルート定義はGET受付のみを示す）／`if ($this->eccubeConfig['eccube_restrict_file_upload'] === '1' && in_array($route, $restrictUrls)) { throw new AccessDeniedHttpException(…)` | JC:41-43／RL:38-42／eyml:259-269,268／md:71-72 | 0 |
| L1-M0906-003 | display_field | 見出し「JavaScript管理」/"JavaScript"・サブ見出し「コンテンツ管理」/"Contents"・カード見出し「JavaScript設定」/"JavaScript Settings" | `{% block title %}{{ 'admin.content.js_management'\|trans }}{% endblock %}`／`{% block sub_title %}{{ 'admin.content.contents_management'\|trans }}{% endblock %}`／`<span class="card-title">{{ 'admin.content.js__card_title'\|trans }}</span>` | twig:12-13,78／ja:2853,2847,2938／en:2541,2534,2629／md:82 | 1 |
| L1-M0906-004 | display_field | 画面文言: 項目見出し「コード」/"Codes"・必須バッジ「必須」/"Required"・登録ボタン「登録」/"Register"・戻り導線ラベル「JavaScript管理」/"JavaScript"（遷移先はページ管理=L1-025） | twig:92,94,122,115の`\|trans`キー（admin.content.page_source_code／admin.common.required／admin.common.registration／admin.content.js_management） | twig:92,94,122,115／ja:2914,1721,1629,2853／en:2601,1749,1661,2541／md:82 | 1 |
| L1-M0906-005 | message | ツールチップ「カスタマイズ用JavaScriptファイルを編集します。JavaScriptで記述します。」/"Editing the JavaScript file. Coding has to be with JavaScript."（コード見出しのtitle属性） | `<div class="d-inline-block" data-bs-toggle="tooltip" … title="{{ 'tooltip.content.js_source_code'\|trans }}">` | twig:91／ja:3643／en:3255／md:141 | 1 |
| L1-M0906-006 | message | 制限案内が全文で**一度だけ**表示（addFlashOnce） | `$this->addInfoOnce('admin.common.restrict_file_upload_info', 'admin');`／ja「この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。」／en "If this feature is used infrequently, disabling it while not in use provides additional security. You can disable this feature by setting the environment variable ECCUBE_RESTRICT_FILE_UPLOAD to 1." | JC:45／AC:152-155,188-193／ja:1795／en:1800／md:106,140 | 1 |
| L1-M0906-007 | display_field | 入力項目はコード1つ: フォーム項目キー`js`・TextareaType・required偽（required属性なし）。実体は非表示div内のtextarea（id=form_js・name=form[js]）で、前面表示はAce | `->add('js', TextareaType::class, [ 'required' => false, ]);`／`<div style="display: none">{{ form_widget(form.js) }}</div>`／`$('#form_js').val(editor.getValue());` | JC:47-51／twig:98,63／md:84,107,180 | 0 |
| L1-M0906-008 | display_field | コード入力領域はAce初期化: JavaScriptモード・テーマtomorrow・基本補完/スニペット/ライブ補完/不可視文字有効・初期値=フォームjs値・リサイズ追従・高さ480px | `editor.session.setMode('ace/mode/javascript'); editor.setTheme('ace/theme/tomorrow'); editor.setValue('{{ form.js.vars.value\|escape('js') }}'); editor.setOptions({ enableBasicAutocompletion: true, enableSnippets: true, enableLiveAutocompletion: true, showInvisibles: true });`／`<div id="editor" style="height: 480px" …>` | twig:26-42,97／md:83 | 0 |
| L1-M0906-009 | fs_effect | 初期表示: `customize.js`が**存在しかつ書き込み可能なときに限り**、その全文をフォームのコード値へセット（エディタへ初期表示） | `$jsPath = $this->getParameter('eccube_html_dir').'/user_data/assets/js/customize.js'; if (file_exists($jsPath) && is_writable($jsPath)) { $form->get('js')->setData(file_get_contents($jsPath)); }` | JC:53-56／md:108,167 | 0 |
| L1-M0906-010 | fs_effect | 不存在または書き込み不可のときは初期表示せず空のエディタ | 「編集対象ファイルが存在しない｜エディタは空で表示する。」「存在するが書き込み不可｜既存内容を初期表示しない（空表示）。」（JC:54-56の条件不成立分岐=setDataなし） | md:186-187,167／JC:54-56 | 0 |
| L1-M0906-011 | fs_effect | 保存=フォームのコード値で`customize.js`を**全文上書き**（解釈・整形なし・マージなし。無ければ新規作成=dumpFileが親ディレクトリ作成+**親dir内の一時ファイル書込+renameによる置換**） | `$fs->dumpFile($jsPath, $form->get('js')->getData());`／「コード入力1つの内容をそのまま1ファイルへ書き出す。…常に全文上書きである。」／`if (!is_dir($dir)) { $this->mkdir($dir); } … $tmpFile = $this->tempnam($dir, basename($filename)); … $this->rename($tmpFile, $filename, true);` | JC:60-62／md:115,168／vfs:640-669（v7.4.0・rename=vfs:669実測） | 0 |
| L1-M0906-012 | message | 保存成功フラッシュ「保存しました」/"Saved"（ロケールキー`admin.common.save_complete`） | `$this->addSuccess('admin.common.save_complete', 'admin');` | JC:63／ja:1591／en:1636／md:147,160 | 1 |
| L1-M0906-013 | fs_effect | 保存成功時は同一のJavaScript管理画面へリダイレクト | `return $this->redirectToRoute('admin_content_js');` | JC:74／md:118,255 | 0 |
| L1-M0906-014 | fs_effect | 保存対象は単一ファイルのみ。保存先絶対パス=`%kernel.project_dir%/html/user_data/assets/js/customize.js`（eccube_html_dir=`%kernel.project_dir%/html`）。他パスへの書込コードなし | `public const JS_PATH = '/html/user_data/assets/js/';`／`eccube_html_dir: '%kernel.project_dir%/html'`（書込呼出はJC:62の1箇所のみ=実引き） | JC:30,53,62／eyml:95／md:47,60,178 | 0 |
| L1-M0906-015 | fs_effect | 書込成功後にのみ、defaultファイルアダプタで配置用パス`/html/user_data/assets/js/`へ`customize.js`として同名アップロード（オプション=s3_content_bucket_name・既定アダプタ=S3）。**ストレージ側の観測手段は未契約=候補では主張しない**。設計書の「eccube_theme_front_dir配下」定義は実装から立証できない=**DOC-DRAFT-M0906-1** | `$fileAdapter = $this->fileManager->getAdapter(); $contentBucketOptions = $this->fileManager->getContentBucketOptions(); $fileAdapter->upload($jsPath, $this::JS_PATH, 'customize.js', $contentBucketOptions);`／`default_file_adapter: 'S3'`／`return ['s3_bucket_name' => $this->eccubeConfig->get('s3_content_bucket_name')];` | JC:65-72／FM:56-72,265-268／eyml:288-289／md:117,169 | 0 |
| L1-M0906-016 | message | ファイル書込のIOException時: エラーフラッシュ「保存に失敗しました」/"Failed to save"を表示し、**リダイレクトせず同一画面のフォームビューを再描画** | `} catch (IOException $e) { $message = trans('admin.common.save_error'); $this->addError($message, 'admin'); log_error($message, [$jsPath, $e]); }`（catch後にreturnせずJC:82-84のビュー返却へ到達） | JC:75-84／ja:1592／en:1637／md:122-125,148 | 1 |
| L1-M0906-017 | log | 書込失敗時はメッセージ・対象パス・例外をログ記録（**観測手段未契約=実行保留**） | `log_error($message, [$jsPath, $e]);` | JC:78／md:124,281 | 0 |
| L1-M0906-018 | validation_rule | サーバ側検証なし: js項目にconstraints指定なし・required偽・文字数上限なし・JavaScript構文検証なし→任意テキスト（構文不正含む）が検証成功で保存される | `->add('js', TextareaType::class, [ 'required' => false, ]);`（constraintsオプション指定なし=JC:47-51全文実引き）／「フォーム側で必須指定・Length制約・形式制約を付与しない。…サーバ側でJavaScript構文の妥当性を検証しない。」 | JC:47-51／md:232,171 | 0 |
| L1-M0906-019 | validation_rule | コード空でも検証は成立し保存処理が実行され、空内容で上書きされる（**空送信→null→空バイト書込の同値はPHP実行時意味論=バイト確定は要実機**） | 「コードを空文字で登録｜フォーム検証を通過し、空内容でファイルを上書きする。フロント公開先も空内容で配置する。」 | md:188,170／JC:49-51,58-62 | 0 |
| L1-M0906-020 | display_field | エディタ注釈にエラー種別が1件でもあれば`#save-button`をdisabled・エラー種別なし/注釈空なら活性（クライアント側制御。サーバ保存可否に影響しない） | `if (annot[key].type && annot[key].type == 'error') { $save_button.prop('disabled', true); break; } else { $save_button.prop('disabled', false); } … if (typeof(annot) == 'object' && annot.length < 1) { $save_button.prop('disabled', false); }` | twig:44-61／md:85,95,233 | 0 |
| L1-M0906-021 | display_field | フォーム送信時、隠しtextareaへエディタ現在値を書き戻してから送信（送信値=エディタ内容） | `$('#content_js_form').on('submit', function(elem) { $('#form_js').val(editor.getValue()); });` | twig:62-64／md:87,96 | 0 |
| L1-M0906-022 | security_rule | CSRF: フォームは`form[_token]`を持ち（FormType既定CSRF）、token不正はisValid不成立→**保存されず同一画面をHTTP200で再描画・成功フラッシュなし**。CSRFエラー文言（vxlf-ja「CSRFトークンが無効です、再送信してください。」）はルートフォームに付くが、twigは`form_errors(form.js)`のみ描画=**画面には表示されない** | `{{ form_widget(form._token) }}`／`if ($form->isSubmitted() && $form->isValid()) {`／`'csrf_message' => 'The CSRF token is invalid. Please try to resubmit the form.',`／`{{ form_errors(form.js) }}` | twig:69,98-99／JC:59／vendor/symfony/form/Extension/Csrf/Type/FormTypeCsrfExtension.php:104／vxlf-ja:14-15／md:234,215 | 0 |
| L1-M0906-023 | auth_rule | `eccube_restrict_file_upload==='1'`かつルートが制限リスト内→HTTP403「この機能は管理者によって制限されています。」/"This functionality is restricted by the administrator."。**admin_content_jsは制限リストに含まれる（eyml:268）**＝GET/POSTとも到達前遮断。※設計書はmd:36で本挙動を「扱わない」と委譲=**標準ソースのみを根拠とするclaim** | `if ($this->eccubeConfig['eccube_restrict_file_upload'] === '1' && in_array($route, $restrictUrls)) { throw new AccessDeniedHttpException(trans('exception.error_message_restrict_url')); }`／`- admin_content_js` | RL:38-42／eyml:259-269,268／ja:3790／en:3401／（md:36=委譲のみ） | 1 |
| L1-M0906-024 | display_field | 当画面はモーダル・ポップアップ・確認ダイアログを持たない（メッセージはフラッシュと項目エラー表示のみ） | 「本機能はモーダル、ポップアップ、確認ダイアログを表示しない。」（twig:67-130全文にmodal/dialog/toast要素0件=実引き） | md:89／twig:67-130 | 0 |
| L1-M0906-025 | fs_effect | 戻り導線「JavaScript管理」リンクはページ管理（admin_content_page）へ遷移 | `<a class="c-baseLink" href="{{ url('admin_content_page') }}"> … <span>{{ 'admin.content.js_management'\|trans }}</span>` | twig:113-116／md:73,257 | 0 |
| L1-M0906-026 | fs_effect | GET表示は書込なし（dumpFileはisSubmitted&&isValid分岐内のみ=フォーム未送信のGETでは実行されない） | `$form->handleRequest($request); if ($form->isSubmitted() && $form->isValid()) { … $fs->dumpFile(…)`（書込は当分岐内のみ） | JC:58-62／md:103-109 | 0 |
| L1-M0906-027 | fs_effect | 同時編集は最後に書き込まれた内容が残る（版管理・楽観ロックなし。JCにロック処理なし=実引き） | 「複数管理者が同時に登録した場合、最後に書き込んだ内容がファイルに残る。版管理・楽観ロックは持たない。」 | md:200,295／JC:43-85 | 0 |
| L1-M0906-028 | api | 保存処理は店舗フロント向け業務API・バッチを呼び出さない（外部呼出はファイルアダプタuploadのみ=JC全文実引き） | 「本機能ではAPI呼び出し・バッチ実行を扱わない。フロント公開先への配置はファイルアダプタによるファイル出力であり、外部API実行ではない。」 | md:207／JC:43-85 | 0 |
| L1-M0906-029 | display_field | 適用経路: 既定テーマのフレームがuser_data配下`assets/js/customize.js`へのscriptタグを出力し、フロント全ページで読み込まれる（配信キャッシュ・CDN反映は管理範囲外） | `<script src="{{ asset('assets/js/customize.js', 'user_data') }}"></script>` | dft:303／md:129-130,201 | 0 |
| L1-M0906-030 | log | ログ禁止事項: パスワード・なりすまし対策トークン・Cookie値・セッションID完全値（**設計書由来・コードで不出力を立証していない・観測未契約=実行保留**） | 「- パスワード ／ - なりすまし対策トークン ／ - Cookie値 ／ - セッションIDの完全値」 | md:286-289（設計書由来のみ） | 0 |

**既知バグ候補（BC-DRAFT）**: なし（実装内不整合は検出していない）。
**設計書側の齟齬（DOC-DRAFT）**: 1件。
**DOC-DRAFT-M0906-1（設計・実装矛盾・未解決・実装を期待の正にしない）**:
設計書はフロント公開先を「フロントのテーマ公開ディレクトリ `eccube_theme_front_dir` 配下
`/html/user_data/assets/js/customize.js`」と定義する（md:61。md:47も「配置先は /html/user_data/assets/js/customize.js」）。
しかし実装は
(i) `eccube_theme_front_dir` を一切参照しない（JC全文に参照0件。アダプタへ渡すのは定数
`JS_PATH='/html/user_data/assets/js/'`とファイル名`customize.js`のみ=JC:30,65-72）、
(ii) `eccube_theme_front_dir`の解決値は`%eccube_theme_app_dir%/%eccube.theme%`＝
`%kernel.project_dir%/app/template/%eccube.theme%`（eyml:85,91）で`/html/user_data`配下とは**別ディレクトリ**、
(iii) 既定アダプタはS3（eyml:289）でKey=`html/user_data/assets/js/customize.js`のオブジェクト書込
（S3A:71-87・bucket=s3_content_bucket_name=FM:265-268）、LocalSystemFileAdapter選択時も
`uploadDir`設定値配下への連結（LSA:33-54・連結=41,47）。
→設計書の「eccube_theme_front_dir配下」という位置づけは一次資料（実装）から立証できない。
**断定を避け未解決のまま記録**し、C-025の探索実測（証跡収集）とD6/正式裁定で解消する。
母集合003/043は**未解決矛盾を期待に変換しないためboundに算入せずTBD（DOC-DRAFT別掲）**とする
（R1是正・m09-03確立規律。§8集計・§9.4 per-ID表）。
なお「画面上は必須バッジを表示するがフォーム項目は任意」は設計書自身が明記済み（md:170）のため
齟齬に数えない（§8の009 excluded根拠として使用）。

## §2 SEED三段参照設計（使い捨て専用SEED＋afterEach復元＋S0スナップショット同値。全て`@TBD-D5`）

DB不使用のためSEEDは**ファイル配置**である。期待値の正はL1オラクルID（SEEDを期待値の正にしない三段参照。
初期表示・保存の判定は「fs.ts実測のファイル内容との恒等写像」で行い、SEED定義値を期待リテラルにしない）。

| SEED | 内容 | 用途・規律 |
|---|---|---|
| SEED-M0906-S0@TBD-D5 | fs.ts `restoreS0()`（§6.2.2）で `JS_ABS=/var/ec-cube/html/user_data/assets/js/customize.js`（絶対パス=コンテナ実測で確定）へ既知内容 `JS_S0`（固定文字列 `/* E2E-M0906-S0 */`+固定1文=`window.__e2eM0906S0 = true;`）を`mkdir -p`込みで配置し、`chown www-data`+`chmod 664`（アプリ書込可）。配置直後のsha1を**S0スナップショット**として記録。※現況コンテナは`…/assets/js`ディレクトリ自体が不存在（実測）のためdir作成を含む | 初期表示（C-006）・無副作用（C-008）・全破壊系の基準状態。**破壊系ケースはafterEachで`restoreS0()`を実行し、sha1がS0スナップショットと同値であることを機械確認**（m05-13教訓） |
| NOFILE状態（テスト内遷移） | fs.tsで customize.js を退避（mv）し不存在化 | C-007（空エディタ）・C-013（新規作成）専用。afterEachでS0復元 |
| PRE退避（suite前後） | beforeAllで`exists`+`statOwnerMode`によりPRE状態を記録・退避（不存在なら不存在フラグ記録）→S0配置。afterAllで`restorePre()`（§6.2.2。不存在なら削除・fs.ts作成dirは撤去）。**現況実測はPRE不存在側** | 環境原状回復。**共有ステージングでは実行しない**（保存は店舗フロント全ページのJS実行に影響=専用環境必須。CSSより影響が重い点に注意） |
| SEED-M01-ADMIN@TBD-D5（既存） | 管理者ログイン資格 | 全ケースのログイン前提（m01系と共通） |

- 破壊系の入力値は `E2E-<runid>-` マーカー入りJS（コメント+無害な代入文）で衝突回避。並行実行は同一ファイルを
  奪い合うため**本機能はserial必須**。m09-05（customize.css）と同一コンテナの隣接ディレクトリを扱うが対象パスは
  独立（css/とjs/）。ただし**C-023の親dir権限操作はuser_data共通祖先に触れない**（JS_PARENTのみ変更）。

## §3 textarea項目マトリクス（任意/最大長/特殊文字×保存反映）

本機能の入力項目は**コード（js）1つ**（L1-007）。DB列は存在しない（md:224）ため、層は
「Form層×ファイル層（fs.ts観測）×表示層（エディタ往復）」で構成する。

| 軸 | 一次資料の確定値 | 検証ケース |
|---|---|---|
| 必須/任意 | **任意**（`'required' => false`=JC:50。required属性なし。画面の必須バッジは表示のみ=md:170） | C-012（空で保存成功）／009はエラー側構成不能=excluded（§9-EX） |
| 最大長 | **Form層制約なし**（constraints指定なし=JC:47-51・md:232「Length制約を付与しない」）。DB層なし（ファイル）。**上限の不在は証明不能のため「最大長+1で拒否」系は構成せず**（拒否層が存在しない）。POSTサイズ上限（php設定）は本機能外=断定しない | 境界ケースなし |
| 特殊文字 | **エスケープ・整形なしで全文そのまま保存**（md:168・JC:62 dumpFile直書き）。表示経路のみ`escape('js')`でAceへ流し込み（twig:30）＝保存バイトには影響しない | C-011（引用符・バックスラッシュ・マルチバイト・改行の往復一致） |
| 構文 | **サーバ側JavaScript構文検証なし**（L1-018）。クライアント注釈は登録ボタン活性制御のみ（L1-020） | C-014（構文不正でも保存）／C-016（注釈→非活性） |
| 保存反映 | customize.js全文置換（L1-011・マージなし）→ファイルアダプタで公開先へ同名配置（L1-015・観測未契約・DOC-DRAFT-1）→フロントはdft:303のscriptタグで参照（L1-029・配信反映は対象外） | C-010（ファイル反映）／C-025（公開先配置=実行保留）／C-026（フロントscriptタグ） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全31行を実体掲載**）

### §4.1 bound対応候補行（22行。§8の59対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-06_admin_content_content_js	E2E-M0906C-001	IT-15	未認証	P1	未ログインでJavaScript管理URL直接アクセス→管理ログインへ	未ログイン（cookie無しcontext）	—	1. GET /%eccube_admin_route%/content/js	admin_loginのログイン画面へリダイレクトされ本画面は表示されない [L1:L1-M0906-001]				
m09-06_admin_content_content_js	E2E-M0906C-002	IT-12	画面レイアウト	P2	JavaScript管理画面がHTTP200で見出し「JavaScript管理」・サブ見出し「コンテンツ管理」・カード見出し「JavaScript設定」を表示	ログイン済(SEED-M01-ADMIN)／**制限無効（ECCUBE_RESTRICT_FILE_UPLOAD≠1）**	—	1. GET /content/js 2. ページ見出し・サブ見出し・span.card-title文言を読む	（認証済みかつ制限無効の条件下で）HTTP200＋見出し「JavaScript管理」＋サブ見出し「コンテンツ管理」＋カード見出し「JavaScript設定」（無条件200ではない: 制限有効時403はC-024） [L1:L1-M0906-002,L1-M0906-003]				
m09-06_admin_content_content_js	E2E-M0906C-003	IT-12	画面レイアウト	P2	コード見出しに必須バッジを表示するがフォーム項目は必須指定なし（表示と検証の差）＋ツールチップ	ログイン済	—	1. 画面を開く 2. 項目見出し「コード」・バッジ「必須」の表示を読む 3. #form_jsにrequired属性が無いことを確認 4. ツールチップtitle属性を読む	見出し「コード」＋バッジ「必須」が表示され、かつ#form_jsはrequired属性なし（画面表示は必須・フォームは任意=md:170の明記どおり）＋title=「カスタマイズ用JavaScriptファイルを編集します。JavaScriptで記述します。」 [L1:L1-M0906-004,L1-M0906-005,L1-M0906-007]				
m09-06_admin_content_content_js	E2E-M0906C-004	IT-15	コードエディタ	P1	コード入力欄がAce（JavaScriptモード・テーマtomorrow・高さ480px）で初期化され送信値は隠しtextarea	ログイン済	—	1. 画面を開く 2. #editorの存在と高さ480pxを確認 3. page.evaluateでace.edit('editor')のsession mode='ace/mode/javascript'・theme='ace/theme/tomorrow'を読む 4. #form_jsが非表示textareaで1件のみ存在することを確認	#editorがAce初期化（JavaScriptモード・テーマtomorrow・高さ480px）＋送信値保持は隠しtextarea#form_js（name=form[js]） [L1:L1-M0906-008,L1-M0906-007]				
m09-06_admin_content_content_js	E2E-M0906C-005	IT-20	情報表示	P2	制限案内が全文で一度だけ表示され、画面はエラーなく表示継続	ログイン済（新規セッション）	—	1. 画面を開く 2. 案内全文一致と件数=1を確認 3. 画面にエラー表示が無いことを確認 4. 再度同URLを開く 5. 案内の不在を確認	初回表示にL1-006のja全文が1件のみ表示・画面はエラーなく表示・リロード後は表示されない（addFlashOnce） [L1:L1-M0906-006]				
m09-06_admin_content_content_js	E2E-M0906C-006	IT-20	初期表示	P1	保存済みカスタマイズJSの全文がエディタへ初期表示される（恒等写像）	ログイン済／SEED-M0906-S0（存在かつ書込可）	—	1. fs.tsでcustomize.jsの実内容を取得 2. 画面を開く 3. page.evaluateでeditor.getValue()と#form_js valueを読む	エディタ値・textarea値がfs.ts実内容（S0）と全文一致・画面にエラー表示なし [L1:L1-M0906-009; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-007	IT-02	初期表示	P1	customize.js不存在→初期表示せず空のエディタ	ログイン済／NOFILE状態（fs.tsで退避・afterEach: S0復元）	—	1. fs.tsでcustomize.jsを退避し不存在化 2. 画面を開く 3. editor.getValue()と#form_js valueを読む	エディタ・textareaが空（初期表示されない） [L1:L1-M0906-010; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-008	IT-26	無副作用	P2	GET表示のみではファイルへ何も書き込まれない（再表示でも不変）	ログイン済／SEED-M0906-S0	—	1. fs.tsでsha1記録（S0スナップショット） 2. /content/jsをGETで2回表示 3. fs.tsでsha1再取得し同値確認	sha1がS0と同値（表示のみで追加・変更されない） [L1:L1-M0906-026; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-010	IT-15	保存成功	P1	JSを入力し登録→全文上書き保存・成功フラッシュ・同一画面リダイレクト・他ファイル差分0	ログイン済／SEED-M0906-S0	js=`/* E2E-<runid>-V1 */ window.__e2eM0906 = 'V1';`	1. fs.tsでuser_data配下のsha1一覧を記録 2. エディタへ入力し登録押下 3. フラッシュと遷移先URLを読む 4. fs.tsでcustomize.js全文照会（入力値一致・S0断片の残存なし） 5. customize.js以外の差分0を確認 6. リダイレクト後のエディタ初期値=保存値を確認（afterEach: S0復元+sha1同値）	「保存しました」（ロケールキーadmin.common.save_completeの解決値）＋/content/jsへリダイレクト＋ファイル=入力値と全文一致（マージなし・1ファイルのみ）＋customize.js以外の差分0＋再表示で保存値が初期表示 [L1:L1-M0906-011,L1-M0906-012,L1-M0906-013,L1-M0906-014,L1-M0906-009; fixture:SEED-M0906-S0@TBD-D5]（公開先配置はC-025=実行保留）				
m09-06_admin_content_content_js	E2E-M0906C-012	IT-22	任意	P1	コード空で登録→必須エラーなく保存が継続し空内容で上書き	ログイン済／SEED-M0906-S0	js=空（エディタ全消去）	1. エディタを全消去し登録押下 2. エラー表示が無いこと・フラッシュを読む 3. fs.tsでファイル内容照会（afterEach: S0復元）	必須エラーが表示されず「保存しました」＋customize.jsが空内容へ上書き（空バイト同値の確定は要実機=L1-019注記） [L1:L1-M0906-019,L1-M0906-012; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-013	IT-26	新規作成	P1	不存在状態から登録→customize.jsが新規作成される	ログイン済／NOFILE状態（fs.tsで退避）	js=`/* E2E-<runid>-NEW */`	1. fs.tsで不存在化 2. 画面を開き（空エディタ）入力・登録 3. フラッシュを読む 4. fs.tsで存在と全文一致を確認（afterEach: S0復元）	「保存しました」＋customize.jsが新規作成され内容=入力値と全文一致 [L1:L1-M0906-011,L1-M0906-012; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-014	IT-25	構文検証なし	P1	構文不正JSでも保存される（サーバ側JavaScript構文検証なし・非UI直POST）	ログイン済セッション（同一context）／SEED-M0906-S0	§6.1契約: form[js]=`function ( { !!broken`・form[_token]=正規値	1. 画面GETで正規tokenを取得 2. 直POST送信 3. 応答（302→/content/js）を確認 4. fs.tsで全文一致（afterEach: S0復元）	検証エラーにならず302リダイレクト＋ファイル=送信値と全文一致＝サーバ側でJavaScript構文を検証しない [L1:L1-M0906-018,L1-M0906-011; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-015	IT-12	フォーム項目	P2	送信項目はform[js]（textarea・required属性なし）で保存先はhtml/user_data/assets/js/customize.js	ログイン済	—	1. 画面を開く 2. #form_jsのtagName=textarea・name=form[js]・required属性なしを読む 3. 保存先パスはC-010のfs.ts照会先（html/user_data/assets/js/customize.js=eccube_html_dir配下/user_data/assets/js/customize.js）として固定	textarea name="form[js]"・required属性なし＋保存先パス=html/user_data/assets/js/customize.js（管理サーバ上のeccube_html_dir配下） [L1:L1-M0906-007,L1-M0906-014]				
m09-06_admin_content_content_js	E2E-M0906C-016	IT-12	JS活性制御	P2	エラー種別注釈で「登録」ボタン非活性・注釈解消で活性（クライアント制御）	ログイン済	エラー種別注釈を誘発するJS（**確実な誘発値はAce同梱ワーカー依存=要実機**。候補=`function ( {`）	1. page.evaluateでeditor.setValue(エラー誘発JS) 2. changeAnnotation発火後の#save-button disabled=真を確認 3. 正常JSへ置換 4. disabled=偽を確認	エラー種別注釈1件以上でdisabled（送信不能=処理が完了しない）・エラー種別なし/注釈空で活性（サーバのバリデーションではない=相関バリの読み替えbound。§8-012/013/015） [L1:L1-M0906-020]（要実機=誘発値未確定）				
m09-06_admin_content_content_js	E2E-M0906C-017	IT-12	送信同期	P2	送信直前にエディタ現在値が隠しtextareaへ書き戻され送信値になる	ログイン済／SEED-M0906-S0	js=`/* E2E-<runid>-SYNC */`（editor.setValueのみ・textareaは旧値のまま）	1. editor.setValueで入力 2. 登録押下 3. page.on(request)でPOST bodyのform[js]を読む 4. フラッシュ・fs.tsで保存結果を確認（afterEach: S0復元）	POST送信値form[js]=エディタ現在値＋保存成功（エラーなく処理継続=相関バリの読み替えbound。§8-014） [L1:L1-M0906-021,L1-M0906-011; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-018	IT-25	モーダル	P2	モーダル・ポップアップ・確認ダイアログを持たない	ログイン済	—	1. 画面を開き登録押下まで操作 2. .modal要素・dialogイベント（page.on('dialog')）・トースト要素の不在を確認	モーダル/ポップアップ/確認ダイアログが発生しない（メッセージはフラッシュと項目エラー表示のみ） [L1:L1-M0906-024]				
m09-06_admin_content_content_js	E2E-M0906C-020	IT-15	CSRF	P1	token改変POSTは保存されずファイルはS0と同一（非UI）	ログイン済セッション（同一context）／SEED-M0906-S0	§6.1契約: form[_token]=正規値の末尾1文字置換・form[js]=`E2E-<runid>-CSRF`	1. 画面GETで正規tokenを取得し末尾1文字置換 2. 直POST送信 3. 応答=HTTP200再描画・「保存しました」なしを確認 4. fs.tsでsha1がS0と同一であることを確認	保存されずファイル内容はS0と**同一**（変更されない）・成功フラッシュなし（CSRFエラー文言はform.js欄のみ描画のため画面非表示=L1-022） [L1:L1-M0906-022; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-022	IT-26	同時編集	P1	同時編集は最後の保存が残る（楽観ロックなし）	ログイン済×2セッション／SEED-M0906-S0	A: js=`/* E2E-<runid>-A */`／B: js=`/* E2E-<runid>-B */`	1. A・B両セッションで画面を開く 2. Aが保存 3. Bが保存 4. fs.tsで全文照会（afterEach: S0復元。並行実行=serial必須）	エラーにならず最後に保存したBの内容が残る [L1:L1-M0906-027; fixture:SEED-M0906-S0@TBD-D5]				
m09-06_admin_content_content_js	E2E-M0906C-023	IT-26	書込失敗	P1	書込失敗時「保存に失敗しました」・リダイレクトせず同一画面・ファイル不変	ログイン済／SEED-M0906-S0／書込失敗を誘発できる状態（**誘発手段は一次資料に規定なし=要実機**。骨子=§6.2.2: **JS_PARENT=/var/ec-cube/html/user_data/assets/js をroot:root×mode555化**〔dumpFileは親dir内tempnam→rename=vfs:654-669のためファイル単体chmodでは誘発不可の可能性〕）	js=有効値	（誘発手段確定後）0. beforeEach: snapshotParentPerm()でJS_PARENTのowner/modeを変更前記録 1. chown root:root+chmod 555で誘発 2. 登録押下 3. フラッシュと現在URL（リダイレクトなし）を確認 4. fs.tsで内容不変を確認 5. afterEach: restoreParentPerm()（記録値へchown/chmod復元・stat一致確認）→restoreS0()	「保存に失敗しました」表示・保存完了メッセージなし・同一画面のフォームビュー再描画・ファイル内容不変（追加・変更されない）（ログ記録はL1-017=観測未契約でC-027へ分離） [L1:L1-M0906-016; fixture:SEED-M0906-S0@TBD-D5]（要実機=誘発の実効性・www-data補助グループ・復元後続確認）				
m09-06_admin_content_content_js	E2E-M0906C-025	IT-15	公開先配置（**探索**）	P1	保存成功後のファイルアダプタ配置の**証跡収集**（D6裁定前は配置先を期待値として断定しない）	ログイン済／SEED-M0906-S0／ストレージ観測手段（**未契約=実行保留**）	js=有効値	（観測手段確定後・探索手順）1. 保存実行 2. upload呼出に対応する配置証跡を収集（S3/localstack側のKey=html/user_data/assets/js/customize.js の有無・eccube_theme_front_dir配下 app/template/%eccube.theme% の変化有無を**両方**記録） 3. 収集した証跡をDOC-DRAFT-M0906-1の裁定材料としてD6へ提出	**検証点は「書込成功後にのみアダプタupload呼出経路が実行されること」（JC:65-72実引き）のみ**。配置先の実体（設計書定義=eccube_theme_front_dir配下 vs 実装定数=JS_PATH=/html/user_data/assets/js/）は**期待値として断定せず実測記録に留める**=DOC-DRAFT-M0906-1（未解決・D6裁定・実装を期待の正にしない） [L1:L1-M0906-015]（実行保留=ストレージ観測手段未契約・D6裁定前は探索）				
m09-06_admin_content_content_js	E2E-M0906C-026	IT-02	適用経路	P2	店舗フロントの全ページHTMLにcustomize.jsへのscriptタグが出力される（利用者定義JSの読込経路）	フロント（未ログイン可）	—	1. フロントTOPをGET 2. script[src]のsrc群を走査 3. 別のフロントページでも同様に確認	user_data配下 assets/js/customize.js へのscript要素が存在（srcのホスト部はasset設定依存=パス末尾一致で判定。配信キャッシュ/CDNの反映は管理範囲外=md:201） [L1:L1-M0906-029]				
m09-06_admin_content_content_js	E2E-M0906C-027	IT-20	ログ	P3	書込失敗時のログ記録と秘密値不出力（実行保留）	ログイン済	—	（ログ観測手段確定後）1. C-023の失敗系操作 2. アプリケーションログを走査	失敗時にメッセージ・対象パス・例外が記録され、パスワード・トークン・Cookie値・セッションID完全値が出ない [L1:L1-M0906-017,L1-M0906-030]（観測手段未契約=実行保留。L1-030は設計書由来でコード立証なし）				
```

### §4.2 補完行（4行。**親test_idなし・母集合会計に算入しない**。理由=一次資料に規定があるが母集合59行の期待テキストに対応する親が存在しない）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-06_admin_content_content_js	E2E-M0906C-011	IT-22	特殊文字	P2	特殊文字・マルチバイト含むJSが整形されず全文そのまま保存され再表示も一致	ログイン済／SEED-M0906-S0	js=`/* 日本語コメント "dq" 'sq' \\ */`+改行+`var s = "a'b\"c\\n";`	1. 入力し登録 2. fs.tsで全文バイト一致を確認 3. リダイレクト後のエディタ値一致を確認（afterEach: S0復元）	ファイル=入力値と完全一致（解釈・整形・エスケープなし）＋再表示一致（表示経路のescape('js')は往復に影響しない=twig:30） [L1:L1-M0906-011,L1-M0906-009; fixture:SEED-M0906-S0@TBD-D5]（補完行・親test_idなし・設計書補完 md:168）				
m09-06_admin_content_content_js	E2E-M0906C-019	IT-25	画面遷移	P3	戻り導線「JavaScript管理」リンク→ページ管理へ遷移	ログイン済	—	1. a.c-baseLink（文言「JavaScript管理」）を押下 2. 遷移先URLを読む	/content/page（ページ管理=コンテンツ管理一覧）へ遷移（リンクラベルは画面名と同じ「JavaScript管理」だが遷移先はページ管理=twig:113-115実引き） [L1:L1-M0906-025,L1-M0906-004]（補完行・親test_idなし・設計書補完 md:73）				
m09-06_admin_content_content_js	E2E-M0906C-021	IT-23	API	P2	保存処理は店舗フロント向け業務API・バッチを呼び出さない	ログイン済／SEED-M0906-S0	js=有効値	1. page.on(request)で記録開始 2. 保存操作一式 3. 記録を走査（afterEach: S0復元）	ブラウザ発リクエストはadmin_content_jsへのPOST・リダイレクトGET・静的資産のみで業務API呼出なし（サーバ内部の外部呼出はファイルアダプタuploadのみ=JC:43-85実引きを根拠とし、ブラウザ観測で補強） [L1:L1-M0906-028; fixture:SEED-M0906-S0@TBD-D5]（補完行・親test_idなし・設計書補完 md:207）				
m09-06_admin_content_content_js	E2E-M0906C-024	IT-20	出力抑止	P1	ECCUBE_RESTRICT_FILE_UPLOAD=1でGET/POSTともHTTP403	管理者ログイン済／環境変数=1（**env切替が必要=要実機**）	GET /content/js／POST /content/js（正規token）	（env切替後）1. GETでstatusと文言を確認 2. 正規tokenでPOSTしstatus確認 3. fs.tsでファイル不変を確認	いずれもHTTP403「この機能は管理者によって制限されています。」・画面へ到達せず保存されない（admin_content_jsは制限URL一覧=eyml:268） [L1:L1-M0906-023]（補完行・親test_idなし・**標準ソース補完**=設計書はmd:36で本挙動を扱わないと委譲。根拠はRL:38-42+eyml:268の実引き。要実機=env切替）				
```

### §4.3 -EN行（5行。LS=1 claimのlocale多重・対応ja行と同一親。C-019-ENの親は補完行=同じく会計外）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-06_admin_content_content_js	E2E-M0906C-002-EN	IT-12	画面レイアウト	P2	見出し・カード見出し（en）	ログイン済／locale=en	—	同C-002	"JavaScript"・"Contents"・"JavaScript Settings" [L1:L1-M0906-003]				
m09-06_admin_content_content_js	E2E-M0906C-003-EN	IT-12	画面レイアウト	P2	表示要素文言（en）	ログイン済／locale=en	—	同C-003	"Codes"・"Required"・tooltip="Editing the JavaScript file. Coding has to be with JavaScript." [L1:L1-M0906-004,L1-M0906-005]				
m09-06_admin_content_content_js	E2E-M0906C-005-EN	IT-20	情報表示	P2	制限案内（en）	ログイン済／locale=en	—	同C-005	L1-006のen逐語（"If this feature is used infrequently, …"）が一度だけ表示 [L1:L1-M0906-006]				
m09-06_admin_content_content_js	E2E-M0906C-010-EN	IT-15	保存成功	P2	保存成功フラッシュ（en）	ログイン済／SEED-M0906-S0／locale=en	同C-010	同C-010	"Saved" 表示＋同一画面リダイレクト [L1:L1-M0906-012]				
m09-06_admin_content_content_js	E2E-M0906C-019-EN	IT-25	画面遷移	P3	戻り導線ラベル（en）	ログイン済／locale=en	—	同C-019	リンク文言 "JavaScript"・/content/page へ遷移 [L1:L1-M0906-004,L1-M0906-025]				
```

## §5 locale対応表

LS=1: **7claim**（L1-003/004/005/006/012/016/023）→ **-EN 5行**（§4.3）。
-EN行を作らないLS=1: L1-016（C-023=要実機〔誘発手段未確定〕。ja/en文言は§1で確定済み）・
L1-023（C-024=要実機〔env切替〕。同）。
en文言はすべてen一次資料逐語（messages.en.yaml。ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。

## §6 判定手段骨子（候補=未実装）＋保存先観測（fs.ts再利用契約）＋_drafts隔離lint証跡

### §6.1 request契約

- フォーム直POST: `POST /%eccube_admin_route%/content/js`（application/x-www-form-urlencoded）。
  フィールド=`form[js]`・`form[_token]`（フォーム名は`form`=FormType既定。twig:63の`#form_js`と
  twig:69の`form_widget(form._token)`から確定）。正規tokenは同一contextの画面GETで`input[name="form[_token]"]`
  から取得。改変token=正規値の末尾1文字置換。
- UI経由: `#editor`（Ace）へ`page.evaluate`で値設定→`#save-button`押下（送信直前同期=twig:62-64が
  `#form_js`へ書き戻す。フォームid=`content_js_form`=twig:68）。
- 未実装・実走なし（候補規律）。ログイン済みcontextのcookie共有で送信（m09-01と同方式）。

### §6.2 保存先観測手段 — fs.ts再利用契約（db.ts同格の観測道具契約。m09-02/m09-05/m09-06のFS系と共通）

**位置づけ**: 本節はdb.tsと同じ**観測道具の再利用契約**である。機能別に変わるのは「対象絶対パスとSEED定義」
のみで、関数契約はm09-05 §6.2（R2是正版）と**同一**（全FS系機能で共通。実装は`e2e/helpers/fs.ts`＝
候補=未実装。実装は実装wave）。本節はm09-06の対象定数と、契約の全文（自己完結のため再掲）を示す。

**§6.2.1 接続・パス定数（コンテナ実測で確定。2026-07-24実測）**

| 定数 | 確定値 | 確定根拠（実測コマンド） |
|---|---|---|
| `E2E_WEB_CONTAINER` | 既定 `ec-cube-enterprise-ec-cube-1`（**稼働実測済み**。他環境は環境変数で上書き） | `docker ps --format '{{.Names}}'` に実在（docker-compose.yml サービス名`ec-cube`） |
| `APP_ROOT` | `/var/ec-cube` | `docker exec ec-cube-enterprise-ec-cube-1 pwd`＝`/var/ec-cube` |
| `HTML_DIR` | `/var/ec-cube/html` | `docker exec … php bin/console debug:container --parameter=eccube_html_dir`＝`/var/ec-cube/html`（eyml:95 `%kernel.project_dir%/html`のコンテナ内解決値） |
| `JS_ABS`（本機能の対象絶対パス） | **`/var/ec-cube/html/user_data/assets/js/customize.js`** | `HTML_DIR`+JC:53の相対部。※**現況実測: コンテナ内は`…/assets/js`ディレクトリ自体が不存在**（=環境の現在値はNOFILE側。S0配置が`mkdir -p`を含む理由） |
| `JS_PARENT`（C-023誘発対象の親dir） | **`/var/ec-cube/html/user_data/assets/js`** | `dirname(JS_ABS)`。dumpFileのtempnam→renameが行われるdir（vfs:654-669） |
| `USER_DATA_ABS` | `/var/ec-cube/html/user_data` | 実測 `drwxrwsrwx ubuntu:ubuntu`（誰でも書込可） |
| アプリ実行ユーザ | `www-data`（apache2ワーカー実測） | `docker exec … ps aux`。docker exec既定ユーザは`root`のため、**アプリ視点の権限判定は`docker exec -u www-data`で行う** |

全コマンドは**絶対パスのみ**を渡す（cwd非依存。`docker exec -w`は使わない）。

**実測ログ逐語引用（2026-07-24・本草案作成者がホストで実行。後日の実機照合はこのコマンド列を
再実行して突合すること）**:

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

$ docker exec ec-cube-enterprise-ec-cube-1 ls -ld /var/ec-cube/html/user_data/assets/js \
    /var/ec-cube/html/user_data/assets/js/customize.js
ls: cannot access '/var/ec-cube/html/user_data/assets/js': No such file or directory
ls: cannot access '/var/ec-cube/html/user_data/assets/js/customize.js': No such file or directory

$ docker exec ec-cube-enterprise-ec-cube-1 id -un
root

$ docker exec ec-cube-enterprise-ec-cube-1 ls -ld /var/ec-cube/html /var/ec-cube/html/user_data
drwxr-sr-x 8 ubuntu ubuntu 4096 Jun 10 11:37 /var/ec-cube/html
drwxrwsrwx 5 ubuntu ubuntu 4096 Jun 10 11:37 /var/ec-cube/html/user_data

$ docker exec ec-cube-enterprise-ec-cube-1 ps aux   # 抜粋: アプリ実行ユーザ
root       435  … /bin/sh /usr/sbin/apachectl -D FOREGROUND
www-data 50988  … /usr/sbin/apache2 -D FOREGROUND
```

**§6.2.2 関数契約（入出力・失敗時仕様。m09-05 R2是正版と同一契約・対象定数のみJS系）**

| 関数 | 実体コマンド（`docker exec $E2E_WEB_CONTAINER` 前置） | 入出力 | 失敗時仕様 |
|---|---|---|---|
| `exists(abs)` | `test -e <abs>` | exit0→true／exit1→false | exit>1（docker接続不能等）はthrow=ハーネス失敗（黙殺禁止） |
| `writableAsApp(abs)` | `-u www-data test -w <abs>` | exit0→true／exit1→false | 同上。**root判定は常に真になり得るため`-u www-data`必須** |
| `readFile(abs)` | `base64 <abs>` → ホスト側でdecode | ファイル全バイト（**base64経由=改行・バイナリ・末尾改行の変形ゼロ**） | 不存在等exit非0→throw（存在前提はexistsで先に確認） |
| `sha1(abs)` | `sha1sum <abs>` | 出力先頭40hex | exit非0→throw |
| `statOwnerMode(abs)` | `stat -c '%U:%G %a' <abs>` | `owner:group mode`文字列（復元用記録） | exit非0→throw |
| `snapshotUserData()` | `sh -c "cd /var/ec-cube/html/user_data && find . -type f \| LC_ALL=C sort \| xargs -d '\n' -r sha1sum"` | `Map<相対パス, sha1>`。**正規化: パスは`./`起点相対・順序=LC_ALL=C sortで固定・行区切りLF**。差分0判定=Map完全一致（C-008/C-010手順5の判定器） | exit非0→throw |
| `restoreS0()` | `sh -c "mkdir -p $(dirname JS_ABS)"`→S0固定バイトを`base64 -d > JS_ABS`で書込→`chown www-data:www-data JS_ABS`＋`chmod 664 JS_ABS` | 書込後に`sha1(JS_ABS)`が**S0_SHA1（S0配置時に記録したスナップショット）と同値**であることを機械確認して返る | 同値不一致・exit非0→throw。**復元系のthrowはsuite abort**（以降の破壊系ケースを実行しない） |
| `removeJs()` | `sh -c "test -e <JS_ABS> \|\| exit 0; mv <JS_ABS> <JS_ABS>.e2e-bak"` | NOFILE状態への遷移（C-007/C-013前提）。**分岐仕様: 元々不存在=既にNOFILE→exit0（正常）／存在時はmvを実行しmvのexitがそのまま返る** | **存在時のmv失敗（exit非0）→throw**（`\|\| true`による黙殺はしない=m09-05 R2確立解。NOFILE遷移失敗を検知できないとC-007/C-013の前提が崩れるため） |
| `snapshotParentPerm()` | `stat -c '%U:%G %a' <JS_PARENT>` | 出力（例 `ubuntu:ubuntu 2775`）をパースし `PARENT_PERM={owner,group,mode}` として**変更前に記録**（C-023 beforeEach） | 不存在等exit非0→throw（C-023はS0配置済み=JS_PARENT実在が前提） |
| `restoreParentPerm()` | `chown <PARENT_PERM.owner>:<PARENT_PERM.group> <JS_PARENT>` → `chmod <PARENT_PERM.mode> <JS_PARENT>` → `stat -c '%U:%G %a' <JS_PARENT>` で記録値一致を機械確認 | C-023 afterEachで**snapshotParentPerm記録値へ復元**（docker exec既定ユーザ=rootのためchown可） | exit非0・記録値不一致→throw=**suite abort**（親dir権限が戻らないと後続の全破壊系が成立しないため）＋手動復旧手順（記録値chown/chmod）をログ出力 |
| `restorePre()` | beforeAll記録に従い（i）PRE存在時: 退避コピー（コンテナ内`/tmp/e2e-m0906-pre.js`）から書き戻し＋`statOwnerMode`記録値でchown/chmod復元（ii）PRE不存在時: `rm -f JS_ABS`（fs.tsが作成したdirは空ならrmdirで撤去） | 環境の原状回復（afterAll）。**現況実測はPRE不存在側**（`…/assets/js`不存在） | exit非0→throw=suite abort＋手動復旧手順をログ出力 |

- suite構成: beforeAll=`exists`+`statOwnerMode`でPRE記録→退避→`restoreS0()`／破壊系各ケース
  afterEach=`restoreS0()`（sha1同値の機械確認込み）／afterAll=`restorePre()`。
- 期待値の正はL1（三段参照）。fs.ts出力はSUT実挙動側の観測値であり期待リテラルにしない。
- ストレージアダプタ（S3/localstack）側の観測は**手段未契約=候補では主張しない**（C-025を実行保留で分離。
  FS側とフラッシュ表示のみで判定。C-025実測時にDOC-DRAFT-M0906-1も裁定）。
- **C-023の誘発骨子（要実機・親ディレクトリ権限が対象。記録→誘発→復元を契約化=m09-05 R2確立解）**:
  `dumpFile`は**親dir内のtempnam→rename**で書き込む（vfs:654-669）ため、`JS_ABS`単体のchmodでは
  親dir書込可なら失敗を誘発できない可能性が高い。手順:
  1. beforeEach: `snapshotParentPerm()`で`JS_PARENT`のowner/modeを**変更前に記録**（`PARENT_PERM`）。
  2. 誘発: `chown root:root <JS_PARENT>` → `chmod 555 <JS_PARENT>`（www-data書込不能化。root execで実行。
     **JS_PARENTのみ変更しuser_data共通祖先には触れない**=隣接機能m09-05のcss/へ波及させない）。
  3. 保存操作（C-023本文）。
  4. afterEach: `restoreParentPerm()`（**記録値`PARENT_PERM`へchown/chmodで復元し、statで一致を機械確認。
     不一致=suite abort**）→続けて`restoreS0()`（ファイル内容のS0同値確認）。restoreS0はファイルのみで
     親dir権限を戻さないため、**順序は必ずrestoreParentPerm→restoreS0**。
  確認対象（要実機で確定）: ①www-dataが補助グループ等で書込可にならないこと ②tempnam失敗が
  IOExceptionとしてJC:75へ到達すること ③復元後の後続ケースが全て成立すること。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード自体の
   リテラル`_drafts`〔oracle.ts:16-22実在確認〕を除く。ガードは`_drafts`・パス区切り・`..`を含むfileKeyの
   解決をthrowで拒否する機械強制）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は
   `_drafts/`の2ファイル（本md＋oracle草案）のみ。
3. 既存の参考物（`e2e/spec/admin/m09/m09_06_admin_content_content_js.spec.ts`・
   `e2e/pages/admin/content_content_js.page.ts`）は読取参照のみで不変。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-002・C-003・C-004・C-005・C-006・C-007・C-012・C-013・C-015・C-017・C-018・C-019・C-026。
- Playwright+FS確認（fs.ts）: C-006〜C-013・C-017・C-021・C-022・C-023（保存・復元系はすべてfs.ts併用）。
- 非UI（request契約）: C-001・C-014・C-020（＋C-024のstatus確認）。
- **要実機**: C-016（エラー種別注釈の誘発値=Ace同梱ワーカー依存）・C-023（書込失敗誘発=親dir権限操作の
  実効性。§6.2.2骨子）・C-024（env切替）・L1-019の空バイト同値確認・055の書込不可側分岐。
  （fs.tsコンテナ名・対象絶対パスは**実測確定済み**=§6.2.1。他環境インスタンスでは`E2E_WEB_CONTAINER`で上書き）
- **実行保留**: C-025（ストレージ観測手段未契約。**D6裁定前は探索・証跡収集**=DOC-DRAFT-M0906-1の裁定材料収集）・
  C-027（ログ観測手段未契約）・-EN 5行（D15）。
- 並行実行: **本機能はserial必須**（永続化先が単一共有ファイルのため。C-022は2セッション使用）。
  **m09-05（CSS管理）suiteとも並行不可**（C-023の親dir権限操作は独立だが、フロント表示・restrict env等の
  共有状態があるため同一コンテナ上ではFS系suiteを直列実行とする）。
  共有ステージングでは実行しない（保存はフロント全ページのJS実行に影響・§2 PRE退避を含め専用環境前提）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点・前提ラベルはノイズ=前提列は設計書subject名の機械循環。
前提が期待と矛盾する行は§10 C4に記録）。1候補ケース行=1 assertion bundle・多対一は`shared-observation`・
-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が
本文内で完結する**。

### 集計（59 test_id 全数会計・差分0。会計分離=m09-03 R1方式）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound（完全）** | **50** | 下表のうち読み替え・TBDマークなしの行 |
| **bound（読み替え・別掲）** | **4** | 012・013・014・015=相関バリ→クライアント注釈制御/送信同期への再解釈（per-ID明示は下表・§9.3） |
| **TBD（DOC-DRAFT別掲）** | **2** | **003・043=DOC-DRAFT-M0906-1未裁定**（設計md:61,47の`eccube_theme_front_dir`配下 vs 実装JC:30,65-72の`JS_PATH`。**未解決矛盾を期待に変換しない**=boundに算入しない。D6裁定後にbind再判定。per-ID表=§9.4。R1是正・m09-03確立規律） |
| **TBD（その他）** | **0** | —（保留はboundの要実機/実行保留マークとして§9.1で管理。TBD最小を無条件の完全bindと読ませない） |
| **excluded** | **3** | EX-A 必須バリ不存在1（009）／EX-B DB相関不存在2（016・017） |
| 合計 | **59** | 50+4+2+0+3=59・欠落0・理由なし重複0 |

**bound内の保留マーク別掲（§9.1で管理・「実行可能」と過大主張しない）**:
実行保留=**2**（004・044→C-025〔D6裁定前は探索・証跡収集〕）／
要実機=**5**（027・030・037→C-023〔030はログ部がC-027=実行保留〕・048・059→C-016）／
部分保留=**3**（051・057=配置側C-025のみ実行保留〔書込側C-010は実行可〕・055=書込不可側のみ要実機）／
読み替え4のうち**012・013・015はC-016=要実機**。

- 候補ケース行総数**31**（§4.1 bound対応22＋§4.2 補完4＋§4.3 -EN 5）。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | フロント全ページの共通テンプレートから読み込まれる利用者定義のJavaScriptであること | bound | C-026（dft:303のscriptタグ実証。定義文=md:59） |
| 002 | 管理サーバ上の eccube_html_dir 配下 /user_data/assets/js/customize.jsであること | bound | C-015（保存先パス確定=L1-014） |
| 003 | フロントのテーマ公開ディレクトリ eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること | **TBD(DOC-DRAFT別掲)** | —（bindしない。設計書定義のeccube_theme_front_dir配下は実装から立証できない=DOC-DRAFT-M0906-1未裁定。C-025の探索手順で証跡収集しD6裁定後にbind再判定=§9.4） |
| 004 | 保存済みファイルを公開先へ配置する出力部品であること | bound(実行保留) | C-025（アダプタが配置部品であることはJC:65-72実引きで根拠づく。配置実測はD6裁定前=探索・証跡収集） |
| 005 | 存在し書き込み可能なら内容をエディタへ読み込んで表示すること | bound | C-006 |
| 006 | エディタ内容をフォームに反映して送信すること | bound | C-017 |
| 007 | 管理画面の共通ルールに従いアクセスできないこと | bound | C-001（未ログイン誘導。権限個別拒否の詳細は認証認可実装を正とする=md:74の委譲を踏襲） |
| 008 | 見出し「JavaScript管理」、サブ見出し「コンテンツ管理」であること | bound | C-002(+EN) |
| 009 | 必須バリでエラーが表示され、対象処理が完了しないこと | **excluded** EX-A | —（§9-EX） |
| 010 | 必須バリでエラーが表示されず、対象処理を継続できること | bound | C-012（空で保存成功=任意の実証） |
| 011 | フォーム送信時にエディタ現在値を非表示textareaへ書き戻してから送信すること | bound | C-017（期待そのもの=送信同期。観点「文字列長バリ」はノイズ） |
| 012 | 相関バリでエラーが表示され、対象処理が完了しないこと | bound(**読み替え**・要実機) | C-016非活性側。**サーバ相関バリは不存在（入力1項目=JC:47-51・制約なし）。期待極性（エラー提示で処理が完了しない）を「エラー種別注釈→登録ボタン非活性=送信不能」へ再解釈したbind。前提=モーダル・ポップアップは期待と不整合（ノイズ）** |
| 013 | 相関バリでエラーが表示されず、対象処理を継続できること | bound(**読み替え**・要実機) | C-016活性側。**期待極性（エラーなく継続）を「注釈なし/エラー種別なし→ボタン活性→送信可能」へ再解釈したbind（前提=エディタ注釈変更と整合）** |
| 014 | 相関バリでエラーが表示されず、対象処理を継続できること | bound(**読み替え**) | C-017。**期待極性（エラーなく継続）を「送信直前同期→送信値=エディタ値→保存成功」へ再解釈したbind（前提=フォーム送信と整合）** |
| 015 | 相関バリでエラーが表示され、対象処理が完了しないこと | bound(**読み替え**・要実機) | C-016非活性側 (shared)。**012と同一の再解釈bind（前提=案内は期待と不整合=ノイズ）** |
| 016 | DBとの相関バリでエラーが表示されず継続 | **excluded** EX-B | —（§9-EX） |
| 017 | DBとの相関バリでエラーが表示され完了しない | **excluded** EX-B | —（§9-EX） |
| 018 | JavaScript管理画面に遷移すること（MSG-002後続） | bound | C-010（保存成功→/content/jsへリダイレクト=L1-013） |
| 019 | 登録内容の対象レコードが追加されること（読み込み条件前提） | bound | C-010 (shared)。レコード=ファイル効果（DB無し=md:224・§10 C4） |
| 020 | 追加されないこと（保存単位前提） | bound | C-008（GET表示は書込なし） |
| 021 | 追加されること（保存経路前提） | bound | C-010 (shared) |
| 022 | コード見出しに必須バッジを表示するがフォーム側は必須指定を付与しないこと | bound | C-003（バッジ表示）＋C-015（required属性なし） (shared) |
| 023 | 追加されること（構文チェックの扱い前提） | bound | C-014（構文不正でも保存される） |
| 024 | 追加されること（フロント反映前提） | bound | C-010 (shared)。配置側の実測はC-025=実行保留（§10 C4） |
| 025 | 追加されないこと（コード=入力項目前提=期待と矛盾） | bound | C-020,C-008 (shared)。前提ノイズ判定=§10 C4（入力して登録すれば追加される=C-010が肯定側実証） |
| 026 | 追加されること（対象ファイル不存在前提） | bound | C-013（新規作成） |
| 027 | 追加されないこと（書込不可前提） | bound(要実機) | C-023（書込失敗→ファイル不変。前提と期待が整合する数少ない行=誘発は要実機） |
| 028 | 追加されること（空文字登録前提） | bound | C-012（空でも書込は実行され上書きされる=前提と期待整合） |
| 029 | 実行結果の対象レコードが追加されること（ブラウザ側構文エラー検知前提） | bound | C-014 (shared)。注釈はクライアントのボタン制御のみ・サーバは検証せず保存する（L1-020/018・§10 C4） |
| 030 | 保存完了メッセージを積まず、保存失敗メッセージを表示し、アプリケーションログにエラーを記録すること | bound(要実機+ログ部実行保留) | C-023（フラッシュ・同一画面・成功メッセージなし）＋C-027（ログ記録=観測未契約・実行保留） (shared) |
| 031 | 更新内容の値が変更されること（編集対象とフロント公開先前提） | bound | C-010 (shared)。配置段階の不一致（md:198）の実測はC-025=実行保留（§10 C4） |
| 032 | 値が変更されないこと（画面表示と保存値前提） | bound | C-008 (shared)。表示・再表示は変更しない |
| 033 | 値が変更されること（同時編集前提） | bound | C-022（最後勝ち） |
| 034 | フロントは各ページ表示時にフロント公開先のアセットを読み込むであること | bound | C-026（scriptタグ=読み込み経路。配信キャッシュ/CDNは管理範囲外=md:201） |
| 035 | 値が変更されること（入力前提） | bound | C-010 (shared) |
| 036 | 値が変更されること（成功時出力前提） | bound | C-010 (shared) |
| 037 | 値が変更されないこと（失敗時出力前提） | bound(要実機) | C-023（失敗時ファイル不変=前提と期待整合） |
| 038 | 値が変更されること（構文チェック前提） | bound | C-014 (shared)。サーバは構文を検証せず保存する |
| 039 | 値が変更されないこと（なりすまし対策トークン前提） | bound | C-020（token不正→変更されない=前提と期待整合） |
| 040 | 値が変更されること（ナビから開く前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（開くだけの実挙動はC-008=不変） |
| 041 | 実行結果の値が変更されること（カスタマイズ用JS前提） | bound | C-010 (shared) |
| 042 | 管理サーバ上の eccube_html_dir 配下 /user_data/assets/js/customize.jsであること | bound | C-015 (shared) |
| 043 | eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること | **TBD(DOC-DRAFT別掲)** | —（bindしない。003と同一=DOC-DRAFT-M0906-1未裁定・§9.4） |
| 044 | 保存済みファイルを公開先へ配置する出力部品であること | bound(実行保留) | C-025 (shared)。004と同一（探索・証跡収集） |
| 045 | 存在し書き込み可能なら内容をエディタへ読み込んで表示すること | bound | C-006 (shared) |
| 046 | エディタ内容をフォームに反映して送信すること | bound | C-017 (shared) |
| 047 | Aceエディタを高さ480pxの領域に生成すること | bound | C-004 |
| 048 | 注釈にエラー種別が1件でもあれば登録ボタンを非活性にすること | bound(要実機) | C-016（誘発値未確定） |
| 049 | モーダル、ポップアップ、確認ダイアログを表示しないこと | bound | C-018 |
| 050 | サーバ側ではJavaScript構文の妥当性を検証しないこと | bound | C-014 (shared) |
| 051 | 保存先ファイルへの書き込み可否とフロント公開先への配置可否をサーバ側で処理すること | bound(部分=配置側実行保留) | C-010（書込側の実処理） (shared)＋配置側はC-025（実行保留） |
| 052 | 画面表示データでエラーが表示されず継続（案内前提） | bound | C-005（案内表示・画面はエラーなく継続） |
| 053 | ロケールキー admin.common.save_completeであること | bound | C-010 (shared)。フラッシュ実文言「保存しました」=キーの解決値（ja:1591。キー→文言の対応はL1-012出典） |
| 054 | 画面表示データでエラーが表示されず継続（保存に失敗しました前提=期待と矛盾） | bound | C-010 (shared)。前提ノイズ判定=§10 C4（失敗側の実挙動はC-023） |
| 055 | 存在かつ書き込み可能なときに限り初期表示すること | bound(部分=書込不可側要実機) | C-006（肯定側）+C-007（不存在側） (shared)。書込不可側の分岐は要実機（C-023骨子と同じ誘発依存=§9.1） |
| 056 | コード入力1つの内容をそのまま1ファイルへ書き出すこと | bound | C-010（全文一致・customize.js以外の差分0=単一ファイル） |
| 057 | まず編集対象ファイルへ書き出し、続いてアダプタでフロント公開先へ配置する2段の経路であること | bound(部分=2段目実行保留) | C-010（1段目=FS実測） (shared)＋2段目はC-025（実行保留） |
| 058 | コード見出しに必須バッジを表示するがフォーム側は必須指定を付与しないこと | bound | C-003＋C-015 (shared)。022と同一 |
| 059 | 構文エラーの検知と登録ボタン非活性はブラウザ側のエディタ機能であること | bound(要実機) | C-016 (shared)。サーバ非検証側はC-014が補強 |

`func_scope_check` 判定: 親59/59会計済み（bound完全50+読み替え4+TBD(DOC-DRAFT別掲)2+TBDその他0+excluded3=59）・
欠落0・理由なし重複0・補完4行（C-011/C-019/C-021/C-024）は§4.2に実体掲載（親空・母集合会計外）
→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### §9.1 要実機・実行保留（bound内の保留マーク）

| 対象 | 理由 |
|---|---|
| 004・044→C-025 | ストレージアダプタ側の観測手段が未契約（既定S3=eyml:289・localstack稼働は実測済みだが観測契約なし）。upload呼出はJC:65-72の実引きで根拠づくが、配置先の実測は保留。**C-025はD6裁定前は探索・証跡収集**（配置先を期待値として断定しない）。※003/043はboundでなくTBD（DOC-DRAFT別掲）=§9.4 |
| 027・037→C-023 | 書込失敗（IOException）の誘発手段が一次資料に規定なし。骨子=**親dir（JS_PARENT）のroot所有×mode555化**（§6.2.2。dumpFileは親dir内tempnam→rename=vfs:654-669のためファイル単体chmodでは不足の可能性）。記録/復元は`snapshotParentPerm()`/`restoreParentPerm()`で契約化済み。要実機確認=誘発の実効性・www-data補助グループ・復元後の後続成立 |
| 030→C-023+C-027 | 上記に加え、ログ記録部分（アプリケーションログの観測手段）が未契約=C-027実行保留 |
| 048・059・（読み替え012/013/015）→C-016 | エラー種別注釈を確実に誘発するJS入力値がAce同梱ワーカー（vendor JS）依存で一次資料から確定できない |
| 055の書込不可分岐 | 書込不可状態の誘発が必要（C-023と同じ親dir権限骨子）。不存在側C-007と肯定側C-006はbound実行可 |
| 051・057の配置側 | C-025と同じ（書込側C-010は実行可） |
| L1-019の空バイト同値 | 空送信→null→dumpFileの書込バイトはPHP実行時意味論（ソース逐語で空文字を断定できない）＝C-012の内容照会で実測確定 |
| C-024（補完） | env切替（ECCUBE_RESTRICT_FILE_UPLOAD=1）が必要 |
| C-027（030のログ部） | ログ観測手段未契約。L1-030は設計書由来でコード立証なし |
| fs.ts接続定数 | **実測確定済み**（§6.2.1: コンテナ`ec-cube-enterprise-ec-cube-1`稼働・`JS_ABS=/var/ec-cube/html/user_data/assets/js/customize.js`=debug:container実測+JC:53相対部）。他環境インスタンスでは`E2E_WEB_CONTAINER`で上書き（保留ではなく環境パラメータ） |
| -EN 5行 | D15（管理画面en切替）待ち |

### §9.2 §9-EX excluded per-ID表（全3件・実引き根拠。範囲一括でなく各IDを個別に正当化）

根拠の実引き:
(a) **必須バリデーション不存在**: js項目は`'required' => false`かつconstraints指定なし（JC:47-51全文実引き。
フォームの入力項目はjs1つのみ）。「フォーム側で必須指定・Length制約・形式制約を付与しない。空文字を含めて
任意の文字列を受け付ける。」（md:232）「画面のコード見出しには必須バッジを表示するが、フォーム側のコード入力は
必須指定を付与しない。」（md:170）＝必須エラーを表示する層（HTML5 required属性・サーバNotBlank）が
いずれも存在しない。
(b) **DB不使用**: 「本機能では入力内容をデータベースに保存しない。…当機能に直接関係するDB列は持たない。」
（md:224）「DBスキーマを持たない。」（md:9）。JCにEntityManager/Repository/Doctrine参照0件
（use句=JC:16-26全文実引き: AbstractController/FileManager/Template/IOException/Filesystem/FormType/
TextareaType/FormView/RedirectResponse/Request/Routeのみ）。

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 009 | EX-A | 「必須バリデーションでエラーが表示され、対象処理が完了しないこと。」→必須制約が全層に不存在（根拠a）のためエラー側は構成不能。**肯定側（010=エラーなく継続）はC-012でboundし偽陰性を防止**。前提=コードエディタの表示自体はC-004が別途bound（047） |
| 016 | EX-B | 「DBとの相関バリデーションでエラーが表示されず…」→DB自体を使わない（根拠b）ため「DBとの相関」検証は構成不能 |
| 017 | EX-B | 「DBとの相関バリデーションでエラーが表示され…」→同上（根拠b） |

### §9.4 TBD（DOC-DRAFT別掲）per-ID表（全2件・R1是正で新設。範囲一括でなく各IDを個別に正当化）

| No | 個別正当化（期待テキスト×根拠） |
|---|---|
| 003 | 「フロントのテーマ公開ディレクトリ eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること。」→期待の前段（eccube_theme_front_dir配下）が**DOC-DRAFT-M0906-1（設計md:61,47 vs 実装JC:30,65-72・eyml:85,91,289）で未裁定**。設計・実装のどちらを正とするか未決のまま期待に変換するとどちらかを暗黙に正としてしまうため**bindしない**（実装挙動を期待の正にしない原則）。C-025の探索手順（配置証跡の両方収集）を裁定材料としてD6へ提出し、裁定後にbind再判定 |
| 043 | 同一期待テキスト（用語表の再掲）→003と同一根拠 |

**過剰除外防御**: 003/043の後段パス（/html/user_data/assets/js/customize.js）は実装のJS_PATH+ファイル名と一致
しており、アダプタが配置部品であること自体（004/044）はbound（実行保留）で維持=**TBDは矛盾部分を含む2行に限定**し、
偽陰性（検証可能な内容の取りこぼし）を防止する。

### §9.3 偽陰性防御と読み替えの明示

相関バリデーション4行（012〜015）はexcludedへ落とさず、実在するクライアント挙動
（注釈→ボタン制御=twig:44-61・送信直前同期=twig:62-64）への**読み替えbound**とした
（m09-05でcodex R1が妥当承認した方式を同型適用）。読み替えである旨・サーバ相関バリが不存在である旨は
per-IDで§8に明記し、会計も完全boundと分離して別掲（§8集計）。妥当性はD6/正式化時に再裁定する（隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 002/042・003/043・004/044（定義文「〜であること」） | 同一性の肯定（実体の所在・部品の定義） | 002/042はC-015の保存先パス一致で直接assert。003/043は**DOC-DRAFT-M0906-1により期待の前段（eccube_theme_front_dir配下）が実装から立証できない**→**boundに算入せずTBD（DOC-DRAFT別掲）**（R1是正。未解決矛盾を期待に変換しない・実装を期待の正にしない=§9.4）。004/044はアダプタ実引きでbound（実行保留・C-025は探索） |
| 009/010（必須: 完了しない/継続） | 009=拒否側→**excluded**（必須不存在=構成不能）／010=成功側→C-012 | 拒否側を安易に「エラーが出ない」へ反転bindしない（期待は「エラーが表示され」のため不成立=excludedが正） |
| 012〜015（相関: エラー/継続） | 012,015=拒否側→C-016非活性側／013=成功側→C-016活性側／014=成功側→C-017 | 4行とも読み替えbound（§8にper-ID明記・§9.3）。極性は非活性=完了しない／活性・送信成功=継続に対応づけ |
| 019〜029（追加される/されない） | 020,025=否定側→C-008/C-020（**ファイル不変assert必須**）／027=否定側→C-023（書込不可=整合前提・要実機）／他=肯定側→C-010/C-013/C-014/C-012 | **025（コード入力前提×追加されない）・040（開く前提×変更される）・054（失敗メッセージ前提×エラーなし継続）は前提と期待が矛盾**→前提列は機械循環ノイズと判定し期待テキスト優先でbind。矛盾前提の実挙動はそれぞれC-010・C-008・C-023で別途担保し、誤bindを回避 |
| 031〜041（変更される/されない） | 032,037,039=否定側（ファイル不変）／他=肯定側 | 037（失敗時×変更されない）・039（token×変更されない）は**前提と期待が整合**→それぞれC-023・C-020の不変assertへ直接bind（m09-05では矛盾ノイズだった行が本母集合では整合している=前提列を機械的に無視せず毎行判定した証跡） |
| 029（構文エラー検知前提+肯定「追加される」） | 肯定側 | 注釈はクライアントのボタン制御のみでサーバ保存を妨げない（L1-020・md:233）ことを根拠に肯定側C-014（直POST=UI迂回で保存実証）へ。UI上の非活性側の観測はC-016 |
| 055（存在かつ書込可能**に限り**） | 条件の両側 | 肯定側C-006・否定側（不存在）C-007を両方bound。書込不可側は誘発依存=要実機として保留を明示（「両側実証済み」と過大主張しない） |
| 020/032（GET・再表示不変） | 否定側 | C-008はsha1同値（差分0）を機械assert |
| 030（積まず/表示し/記録する=三連） | 否定+肯定+肯定の複合 | C-023が「保存完了メッセージなし」（否定側）と「失敗メッセージ表示・同一画面」（肯定側）を同時assert・ログ記録はC-027へ分離（実行保留を隠さない） |

機械検査結果（工程6自己検査・R1是正後に再実施）: §8参照ケースIDの§4実在=全一致（C-001〜C-027〔C-009欠番=excluded対応〕・
-EN 5行）／bound完全50+読み替え4+TBD(DOC-DRAFT別掲)2+TBDその他0+excluded3=59=母集合件数一致
（grep -c実測59）／補完4行は親空で母集合会計外／oracle.json草案は本md§1から機械導出・claim数30一致／
L1参照の逐語quoteは一次資料file:lineと突合済み（vfs:640-669はnl -ba実測・翻訳キーはgrep -n実測）。
未検出の極性取り違えが残る可能性は否定しない（codex R2再監査で検証されたい）。
