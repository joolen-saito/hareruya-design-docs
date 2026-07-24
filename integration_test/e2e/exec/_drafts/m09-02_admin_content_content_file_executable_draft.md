# B0候補: m09-02 ファイル管理 — 実行可能グレード候補（母集合111全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正（Blockerなし・Major複数）→R1是正版（本版）**（`REVIEW_LEDGER.md`と同期）
> R1是正: **(1) 相関bound 013-016は「読み替えbound」であることをper-ID明記**（§8・§9.3。93 bound/TBD=0の
> 過剰主張を訂正=bound93のうち読み替えbound5〔013-016・082〕を別掲）
> **(2) BC-DRAFT-M0902-01を要実機へ降格**（生キー表示は実走未確認=確定不具合でなく要確認候補）
> **(3) DOC-DRAFT-M0902-02の再帰削除根拠にvendor実装（symfony/filesystem v7.4.0 Filesystem.php:145-203）を追加**
> **(4) 082「移動・リネーム」読み替えは厳格には要確認/TBD候補である旨を当該行に明記**。
> excluded=18・相関boundの方向（入力×既存FS状態）・DOC-01/03・捏造ゼロ根拠はcodex妥当確認済み=維持。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-01_admin_content_content_news_executable_draft.md`（候補確定・REVIEW_LEDGER同期）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-02_admin_content_content_file_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`）には書かない**。
> **本機能の特性**: DB永続化なし（設計書md:282）。観測対象は**ファイルシステム（user_data配下）**と画面。
> db.tsは使わず、FS観測手段（§6.2）を別途定義する。破壊的操作は**使い捨て作業ディレクトリWORK限定＋afterEach削除**（§2）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-02_admin_content_content_file.md`（最終コミット ea56f47・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`／symfony/validator v7.4.3（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁）: FileController.php=`143e35a666a1`／file.twig=`dbfeb728fe36`／
  messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／validators.ja.yaml=`8cc5a327231c`／validators.en.yaml=`694fff6cd7b7`。
- fid_kubun.tsv（D1）: `M09-02｜標準｜standard-src+design｜区分不明=0`（実引き確認済み）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`）M09-02全**111行**（IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-001〜111）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環）。bindは各行の**「期待結果」実テキスト**で判定（§8に全111行の期待要旨併記）。

## §1 L1原子オラクル表（52claim・全行逐語+file:line）

パス表記: FC=`src/Eccube/Controller/Admin/Content/FileController.php`／twig=`src/Eccube/Resource/template/admin/Content/file.twig`／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／vja=`validators.ja.yaml`／ven=`validators.en.yaml`／
md=`functions/ec-cube-enterprise/m09-02_admin_content_content_file.md`／fnjs=`html/template/admin/assets/js/function.js`／
eyml=`app/config/eccube/packages/eccube.yaml`／AC=`src/Eccube/Controller/AbstractController.php`。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0902-001 | auth_rule | 未認証は管理ログインへ誘導され本画面へ到達しない | 「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される。」／`pattern: ['^/%eccube_admin_route%/',…] … login_path: admin_login` | md:302／security.yaml:41-50 | 0 |
| L1-M0902-002 | http_status | file_manager GET=HTTP200で画面表示 | `#[Route(path: '/%eccube_admin_route%/content/file_manager', name: 'admin_content_file', methods: ['GET', 'POST'])]` | FC:66-68,117-129 | 0 |
| L1-M0902-003 | display_field | 初期表示=追加カード・パンくず・一覧・ツリーの4要素 | 「画面上部に「ファイル・フォルダを追加」カード…その下にパンくず、左側に「このフォルダ内のファイル」一覧、右側に「フォルダ構成」ツリーを表示する。」 | md:88／twig:127-131,169,176,318,325 | 0 |
| L1-M0902-004 | display_field | カード見出し3種の文言 | ja「ファイル・フォルダを追加」「このフォルダ内のファイル」「フォルダ構成」／en "Add File / Directory"・"Files in This Directory"・"Directories" | ja:2859,2863,2865／en:2546,2550,2552／twig:131,169,318 | 1 |
| L1-M0902-005 | message | 情報メッセージ全文が表示時に**一度だけ**表示 | `$this->addInfoOnce('admin.common.restrict_file_upload_info', 'admin');`／ja「この機能の利用頻度が低い場合、…ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。」／en "If this feature is used infrequently, … setting the environment variable ECCUBE_RESTRICT_FILE_UPLOAD to 1." | FC:70／AC:152-155／ja:1795／en:1800／md:171 | 1 |
| L1-M0902-006 | display_field | 一覧行=アイコン・名前・サイズ・更新日時・操作。更新日時は「（日時）更新」（date_sec=medium/medium） | 「一覧の各行はアイコン、名前、サイズ、更新日時、操作ボタンで構成する。」／`{{ file.file_time\|date_sec }} {{ 'admin.content.file.updated'\|trans }}`／ja「更新」／en "Update" | md:88／twig:187-223,219／IntlExtension.php:72-77／ja:2864／en:2551 | 1 |
| L1-M0902-007 | display_field | フォルダ行=フォルダアイコン+名前リンク(js-dir-move)・操作は削除のみ。ファイル行=パスコピー・表示・DL・削除の4操作。画像拡張子はサムネイル背景・他は拡張子アイコン | 「フォルダ行はフォルダアイコンと名前リンク（押下で移動）を表示し、操作は削除のみとする。ファイル行は拡張子に応じたアイコン（画像拡張子はサムネイル背景）と、パスコピー・表示・ダウンロード・削除の操作を表示する。」 | md:89／twig:190-203,207-211,224-302 | 0 |
| L1-M0902-008 | display_field | トップ階層以外は一覧先頭に親ディレクトリへ戻る行 | `{% if tpl_is_top_dir != false %}`（※変数名はトップ判定。トップ以外で戻る行=md:89）「トップ階層以外では、一覧先頭に親ディレクトリへ戻る行を表示する。」 | md:89／twig:178-186／FC:97-98,121 | 0 |
| L1-M0902-009 | display_field | ファイル選択欄はmultiple（複数選択可） | `'multiple' => true, 'attr' => ['multiple' => 'multiple']`／「複数ファイル選択に対応する（`multiple`）。」 | FC:73-78／twig:137／md:90 | 0 |
| L1-M0902-010 | display_field | フォルダ名はテキスト入力・プレースホルダ「フォルダ名」/"Folder Name" | `->add('create_file', TextType::class)`／`{{ form_widget(form.create_file, {attr: {placeholder: 'admin.content.file.directory_name'}}) }}` | FC:79／twig:149／ja:2862／en:2549 | 1 |
| L1-M0902-011 | fs_effect | カレント決定: tree_select_fileがuser_data配下ならそこ・領域外/不存在はトップへフォールバック | `$nowDir = $this->checkDir(…) ? $this->normalizePath(…) : $topDir;`／「配下でなければトップを起点に戻す。」「領域外として扱い、user_data領域のトップを起点に表示する。」 | FC:90-92／md:125,235 | 0 |
| L1-M0902-012 | security_rule | パス防御: `..`を含めば拒否・realpathがuser_data実パス前方一致でなければ拒否 | `if (str_contains($targetDir, '..')) { return false; } … return str_starts_with($targetDir, (string) $topDir);`／「対象パスに`..`を含む場合は領域外とみなして拒否する。実パスがuser_data領域の実パスで始まらない場合も領域外として拒否する。」 | FC:532-541／md:210 | 0 |
| L1-M0902-013 | http_status | file_view: 配下ファイル=内容返却(BinaryFileResponse=200)・領域外/不存在=HTTP404 | `if ($this->checkDir($file, $this->getUserDataDir())) { … return new BinaryFileResponse($file); } throw new NotFoundHttpException();` | FC:135-146／md:75,155 | 0 |
| L1-M0902-014 | http_status | file_download: 配下かつ非ディレクトリ=添付DL・フォルダ/領域外=HTTP404 | `if ($this->checkDir($file, $topDir)) { if (!is_dir($file)) { … } } throw new NotFoundHttpException();` | FC:256-284／md:76,161 | 0 |
| L1-M0902-015 | message | DLファイル名分岐: 正規表現でASCII英数・記号類を全除去した残りが空→ファイル名指定なし添付／残存あり→`filename*=UTF-8''`+rawurlencode。**ASCIIのみの名前は全除去され無名側になる（md:160の条件記述と逆向きの疑い=DOC-DRAFT-M0902-03）** | `$str = preg_replace($patterns, '', $pathParts['basename']); if (strlen((string) $str) === 0) { return (new BinaryFileResponse($file))->setContentDisposition(…ATTACHMENT); } else { … "attachment; filename*=UTF-8\'\'".rawurlencode(…)` | FC:264-279／md:160,243 | 0 |
| L1-M0902-016 | validation_rule | フォルダ名必須（NotBlank）→ja「入力されていません。」/en "No value found."（validatorsドメイン既定文言） | `new Assert\NotBlank(),`／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | FC:164／vja:17／ven:17／md:213 | 1 |
| L1-M0902-017 | validation_rule | フォルダ名は英数字・`_`・`.`・`-`のみ→違反で「使用できない文字が含まれています。」/"The folder name contains invalid characters."（キーはtwig側`\|trans`でmessagesドメイン解決） | `'pattern' => '/[^[:alnum:]_.\\-]/', 'match' => false, 'message' => 'admin.content.file.folder_name_symbol_error'`／`{{ error.message\|trans }}` | FC:165-169／twig:157-159／ja:2868／en:2555／md:211 | 1 |
| L1-M0902-018 | validation_rule | フォルダ名先頭ピリオド禁止→「ピリオド(.)で始まる名前は使用できません。」/"Folder names beginning with a period(.) are not allowed." | `'pattern' => "/^\.(.*)$/", 'match' => false, 'message' => 'admin.content.file.folder_name_period_error'` | FC:170-174／ja:2869／en:2556／md:212 | 1 |
| L1-M0902-019 | validation_rule | 作成先に同名の**ファイルまたはフォルダ**が既存（file_exists）→「%file_name% は既に使用されています。別のフォルダ名を入力してください」/"%file_name% is already exists." | `if (file_exists($newFilePath)) { throw new IOException(trans('admin.content.file.dir_exists', ['%file_name%' => $filename])); }` | FC:197-199／ja:2870／en:2557／md:141,227 | 1 |
| L1-M0902-020 | fs_effect | 重複なしならmkdir実行＋「作成しました」/"Created" | `$fs->mkdir($newFilePath); $this->addSuccess('admin.common.create_complete', 'admin');` | FC:206-208／ja:1606／en:1652／md:142,193 | 1 |
| L1-M0902-021 | validation_rule | ファイル未選択（NotBlank・message指定）→「選択されていません」/"Not selected" | `new Assert\NotBlank(['message' => 'admin.common.file_select_empty',])` | FC:292-295／ja:1753／en:1773／md:179 | 1 |
| L1-M0902-022 | fs_effect | now_dirが領域外→エラー行追加のみで保存なし。**エラーキー`file.text.error.invalid_upload_folder`はmessages.{ja,en}.yamlに不存在（grep実測0件）。当該環境の翻訳器がキー原文を返すなら画面には生キー文字列が出るが、実走未確認=要実機（BC-DRAFT-M0902-01は確定不具合でなく要確認候補。設計書md:236「アップロード先不正のエラーを表示」の文言は未定義）** | `if (!$this->checkDir($nowDir, $topDir)) { $this->errors[] = ['message' => 'file.text.error.invalid_upload_folder']; return; }` | FC:314-318／twig:157-159／ja・en全文grep不一致（実測）／md:131,236 | 0 |
| L1-M0902-023 | validation_rule | アップロード検証順=①同名フォルダ→②ファイル名文字→③先頭ピリオド→④拡張子（違反ファイルはスキップ） | `// フォルダの存在チェック … // 英数字, 半角スペース, _-.() のみ許可 … // dotファイルはアップロード不可 … // 許可した拡張子以外アップロード不可`／「順序は、同名フォルダ存在チェック、ファイル名の使用可能文字チェック、先頭ピリオド禁止チェック、拡張子の許可チェックとする。」 | FC:326-348／md:132 | 0 |
| L1-M0902-024 | validation_rule | 同名フォルダ存在→「ファイルと同じ名前のフォルダが存在するためアップロードできません。」/"Cannot upload because a folder with the same name as the file exists." | `if (is_dir(rtrim($nowDir, '/\\').\DIRECTORY_SEPARATOR.$filename)) { throw new UnsupportedMediaTypeHttpException(trans('admin.content.file.same_name_folder_exists')); }` | FC:328-330／ja:2871／en:2558／md:183,217 | 1 |
| L1-M0902-025 | validation_rule | ファイル名は英数字・半角スペース・`_-.()`のみ→違反で「使用できない文字が含まれています。」/"The folder name contains invalid characters." | `if (!preg_match('/\A[a-zA-Z0-9_\-\.\(\) ]+\Z/', $filename)) { throw new UnsupportedMediaTypeHttpException(trans('admin.content.file.folder_name_symbol_error')); }` | FC:331-334／ja:2868／en:2555／md:214 | 1 |
| L1-M0902-026 | validation_rule | 先頭ピリオドファイル拒否→「.で始まるファイルはアップロードできません。」/"Dot files cannot be uploaded." | `if (str_starts_with($filename, '.')) { throw new UnsupportedMediaTypeHttpException(trans('admin.content.file.dotfile_error')); }` | FC:335-338／ja:2873／en:2560／md:184,215 | 1 |
| L1-M0902-027 | validation_rule | 拡張子は小文字化して許可13種（jpg,jpeg,png,gif,webp,svg,ico,html,htm,js,css,txt,pdf）のみ→違反で「アップロードできないファイル拡張子です。」/"File extension cannot be uploaded." | `if (!in_array(strtolower($file->getClientOriginalExtension()), $this->eccubeConfig['eccube_file_uploadable_extensions'], true))`／eyml列挙13種 | FC:339-342／eyml:270-283／ja:2874／en:2561／md:185,216 | 1 |
| L1-M0902-028 | message | 同一エラー文言は1回だけ表示（重複排除） | `if (!in_array($e->getMessage(), array_column($this->errors, 'message'))) { $this->errors[] = …; }`／「同一文言は1回だけ表示する。」 | FC:343-347／md:238 | 0 |
| L1-M0902-029 | fs_effect | 検証通過ファイルはnow_dirへ**原ファイル名**で保存＋ストレージアダプタへupload。一部が検証外でも通過分は保存され成功件数は実保存数 | `$file->move($nowDir, $filename); … $fileAdapter->upload(…); $successCount++;`／「外れたファイルのみスキップし、通ったファイルは保存する。」 | FC:349-361／md:133,226,237 | 0 |
| L1-M0902-030 | message | 成功件数フラッシュ「%success%件のファイルをアップロードしました。(%success%/%count%)」/"%success% file upload completed. (%success%/%count%)"（1件以上成功時のみ） | `if ($successCount > 0) { $this->addSuccess(trans('admin.content.file.upload_complete', ['%success%' => $successCount, '%count%' => $uploadCount,]), 'admin'); }` | FC:369-374／ja:2866／en:2553／md:134,192 | 1 |
| L1-M0902-031 | fs_effect | 同名**ファイル**の再アップロードは拒否されず上書き保存（同名チェックはフォルダのみ・`move`で置換） | 「ファイル名の重複を妨げず、同名で上書き保存する（同名フォルダがある場合のみ拒否）。」（FC:326-342の検証4種に同名ファイルチェックは無い=実引き） | md:239,254／FC:326-350 | 0 |
| L1-M0902-032 | auth_rule | 削除はDELETE+`_token`検証。token不正=HTTP403 `AccessDeniedHttpException('CSRF token is invalid.')`。UI削除は`token-for-anchor`属性+`_method=delete`の裏フォームPOST | `$this->isTokenValid();`／`throw new AccessDeniedHttpException('CSRF token is invalid.');`／`_token: $this.attr('token-for-anchor'), _method: data.method` | FC:217-220／AC:252-263／fnjs:161-177／twig:246,293／md:147,340 | 0 |
| L1-M0902-033 | fs_effect | select_fileが空・null・`/`→削除せずファイル管理画面へリダイレクト | `if ($selectFile === '' \|\| $selectFile === null \|\| $selectFile == '/') { return $this->redirectToRoute('admin_content_file'); }`／「空・未指定・`/`の選択は削除しない。」 | FC:222-225／md:148,218,242 | 0 |
| L1-M0902-034 | fs_effect | 配下かつFS存在→アダプタ削除+`$fs->remove`+「削除しました」/"Deleted"。リダイレクトは`tree_select_file=dirname(select_file)`（対象の親を表示） | `$fs->remove($file); $this->addSuccess('admin.common.delete_complete', 'admin'); … return $this->redirectToRoute('admin_content_file', ['tree_select_file' => dirname((string) $selectFile)]);` | FC:229-250／ja:1593／en:1638／md:149-150,194 | 1 |
| L1-M0902-035 | display_field | 空でないフォルダの削除ボタンは`disabled`（UI無効化）。**サーバ側deleteに空フォルダ再判定は無い（判定はtoken・空/`/`・checkDir・fs存在のみ=FC:220-247実引き）。`$fs->remove($file)`（FC:240）はディレクトリを再帰削除する＝再帰の根拠はvendor実装: symfony/filesystem v7.4.0 `Filesystem.php:145-203`（`remove()`→`doRemove()`が`is_dir`をFilesystemIteratorで再帰処理）。md:105「ディレクトリ空判定…サーバ側で再判定する」と実装が齟齬（DOC-DRAFT-M0902-02。md:218はUI無効化のみで実装整合）** | `class="btn btn-ec-actionIcon action-delete {% if file.is_empty == false %}disabled{% endif %}"`／`public function remove(string\|iterable $files): void`→`private static function doRemove(…)`（is_dir分岐でFilesystemIterator再帰） | twig:229／FC:217-247,240／vendor/symfony/filesystem/Filesystem.php:145-203（v7.4.0=composer.lock実測）／md:95,105,218,241 | 0 |
| L1-M0902-036 | message | 削除モーダル: 見出し「削除します」/"Delete"・本文「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」/"You can not revert this action. Are you sure to delete %name%?"（対象名差込）・キャンセル(data-bs-dismiss)で閉じる。`data-confirm="false"`でJS confirmは出さない | `{{ 'admin.common.delete_modal__message'\|trans({ '%name%': file.file_name }) }}`／`<button class="btn btn-ec-sub" type="button" data-bs-dismiss="modal">` | twig:237-248,284-295／ja:1785-1786／en:1793-1794／md:95,173 | 1 |
| L1-M0902-037 | display_field | jailパス=user_data実パスの絶対部分を除去した相対表現（空は`/`）。一覧`file_path`・公開URL欄value=`asset('','user_data')`+jailパス（絶対パス非露出） | `$jailPath = str_replace((string) realpath($this->getUserDataDir()), '', $realpath); return $jailPath ?: '/';`／`value="{{asset('', 'user_data')}}{{ file.file_path\|slice(1) }}"` | FC:566-572／twig:221／md:58 | 0 |
| L1-M0902-038 | display_field | ツリー=user_dataを根に**フォルダのみ**（Finder::directories）。JSONでクライアントへ渡しJSで構築 | `$finder = Finder::create()->in($topDir)->directories()->sortByName();`／`'tpl_javascript' => json_encode($tree),`／`arrTree = {{ tpl_javascript\|raw }};`／「フォルダのみ表示し、ファイルは含めない。」 | FC:112,119,417-451／twig:31,111,325-328／md:57,92 | 0 |
| L1-M0902-039 | display_field | パンくず=カレントパスを分解し各階層をリンク表示・最終階層はactive（リンクなし） | `$li = $('<li class="breadcrumb-item active" />').text(…)`（最終）／`$a = $('<a href="#" class="js-open-folder" …')`（中間）／「各階層をリンクとして表示する。」 | twig:34-49／md:93 | 0 |
| L1-M0902-040 | display_field | パスコピー押下=公開URL入力欄(.copy-file-path)を表示しfocus・サーバ送信なし。コピー成功でツールチップが「パスをコピー」→「パスをコピーしました」/"Copy a path"→"Copied path"へ切替 | `$(copy_file_path).show(); $(copy_file_path).find('input:first').focus();`／`action_copy.attr('title', '{{ 'admin.common.copy_path_complete'\|trans }}');`／「再検証なし。…送信値は更新しない。」 | twig:72-107／ja:1635-1636／en:1666-1667／md:94,104 | 1 |
| L1-M0902-041 | auth_rule | `eccube_restrict_file_upload==='1'`かつルートが制限リスト内→403（`exception.error_message_restrict_url`=ja「この機能は管理者によって制限されています。」/en "This functionality is restricted by the administrator."）。**制限リストに本機能で含まれるのは`admin_content_file`のみ＝file_view/file_download/file_deleteは含まれない（md:77「上記の各URL」と齟齬=DOC-DRAFT-M0902-01）** | `if ($this->eccubeConfig['eccube_restrict_file_upload'] === '1' && in_array($route, $restrictUrls)) { throw new AccessDeniedHttpException(trans('exception.error_message_restrict_url')); }`／eyml列挙（本機能分は`admin_content_file`のみ） | RestrictFileUploadListener.php:38-42／eyml:259-269／ja:3790／en:3401／md:77,304 | 1 |
| L1-M0902-042 | display_field | 一覧=カレント直下（depth 0）のみ・名前順（sortByName）・フォルダ群→ファイル群の順・各フォルダにis_empty付与 | `Finder::create()->filter($filter)->in($nowDir)->ignoreDotFiles(false)->sortByName()->depth(0);`／「一覧はカレントディレクトリ直下（深さ0）のフォルダとファイルを名前順に並べる。各フォルダには空かどうかの判定を付与する。」 | FC:456-521／md:118 | 0 |
| L1-M0902-043 | log | 保存失敗・フォルダ作成失敗・アダプタ側不存在削除はログ記録（**観測手段未契約=実行保留**） | `log_error($e->getMessage());`（作成/UL失敗）／`log_error($this::FILE_PATH.$file.' はS3に存在しません');` | FC:210,237,363／md:353-357 | 0 |
| L1-M0902-044 | log | ログ禁止事項: トークン原値・セッションID完全値・Cookie値・ファイル内容（**設計書由来・コードで不出力を立証していない・観測未契約=実行保留**） | 「- なりすまし対策トークンの原値 ／ - セッション識別子の完全値 ／ - Cookie値 ／ - ファイル内容そのもの」 | md:359-364（設計書由来のみ） | 0 |
| L1-M0902-045 | fs_effect | フォルダ移動=`mode`空POST（tree_select_file設定）→当該フォルダをカレントに同画面再表示。一覧は移動先の内容へ切替（旧カレントのエントリは表示されない=一覧はnowDir直下のみ〔L1-042〕からの帰結） | 「選択したフォルダをカレントディレクトリとして同画面を再表示する。`mode`は空（移動）で送信する。」／`default: break;`（mode空は表示のみ） | md:71,124-126／FC:90-113 | 0 |
| L1-M0902-046 | fs_effect | GET表示は副作用なし（書込はPOSTのmode=create/uploadと削除DELETEのみ） | `if ('POST' === $request->getMethod()) { switch ($request->get('mode')) { case 'create': … case 'upload': … default: break; } }` | FC:100-111 | 0 |
| L1-M0902-047 | TBD/security_rule | tree_select_fileにuser_data配下の**ファイル**パスを指定した場合の挙動は立証不能: checkDirは通過（実在パスかつ配下）し、`Finder::in`に非ディレクトリを渡す経路になる＝md:103「ファイル指定はサーバ側で排除する」を実装から立証できない（**BC-DRAFT-M0902-02・要実機**） | `Finder::create()->filter($filter)->in($nowDir)`（nowDirがファイルの場合の排除コードなし=FC:90-92,456-471実引き） | FC:90-92,456-471／md:103 | 0 |
| L1-M0902-048 | request_contract | 送信契約: form1=POST・multipart/form-data・hidden `mode`/`now_file`/`now_dir`/`tree_select_file`/`tree_status`/`select_file`＋`_token`（form._token）。削除=`admin_content_file_delete?select_file=…`へ`_token`+`_method=delete`のPOST（Symfonyメソッド上書きでDELETE） | `<form name="form1" id="form1" method="post" action="?" enctype="multipart/form-data">`＋hidden6種＋`{{ form_widget(form._token) }}`／fnjs裏フォーム生成 | twig:117-124,246／fnjs:161-177 | 0 |
| L1-M0902-049 | display_field | 操作文言: 「アップロード」/"Upload"・「新規作成」/"Create New"・ツールチップ「パスをコピー」「表示」「ダウンロード」「削除」「キャンセル」/"Copy a path"・"Display"・"Download"・"Delete"・"Cancel" | twig:140,152,260,265,270,275の`\|trans`キー | ja:1634-1638,1647,1651／en:1665-1669,1678,1681／twig:140,152,260-275 | 1 |
| L1-M0902-050 | fs_effect | 表示・DLのレスポンス内容=FS実体そのもの（BinaryFileResponseが実ファイルを返す） | `return new BinaryFileResponse($file);`（view）／`return new BinaryFileResponse($file, Response::HTTP_OK, […])`（download） | FC:142,274-279／md:155,160 | 0 |
| L1-M0902-051 | display_field | 表示リンクは別タブ（`target="_blank"`・href=file_view?file=jailパス） | `<a href="{{ url('admin_content_file_view') }}?file={{ file.file_path\|e('url') }}" target="_blank" class="btn btn-ec-actionIcon action-view"` | twig:265／md:154,317 | 0 |
| L1-M0902-052 | message | 保存失敗時「%file_name% のアップロードに失敗しました。」/"Failed to upload %file_name%. "（**失敗誘発手段は一次資料に規定なし=要実機**） | `catch (FileException $e) { log_error(…); $this->errors[] = ['message' => trans('admin.content.file.upload_error', ['%file_name%' => $filename,])]; }` | FC:362-367／ja:2867／en:2554／md:186 | 1 |

**既知バグ候補（BC-DRAFT・仕様側を期待値の正とし分離）**:
- **BC-DRAFT-M0902-01（要実機・未確定）**: `file.text.error.invalid_upload_folder` の訳がmessages.{ja,en}.yamlに不存在（grep実測0件・FC:315がerrorsへ格納しtwig:158が`|trans`することは確認済み）。**「生キーが画面表示される」は当該環境の翻訳器フォールバックの実走確認が未了のためソースだけでは未確定＝要実機（実走で生キー表示を確認するまで確定不具合と主張しない）**。期待値の正=設計書md:236「アップロード先不正のエラーを表示」（文言未定義）。
- **BC-DRAFT-M0902-02**: tree_select_fileにファイルパス指定時、md:103「ファイル指定はサーバ側で排除」を保証するコードが無い（L1-047）。実挙動（例外/500の可能性）は要実機。

**設計書側の齟齬（DOC-DRAFT・正典=ee標準ソース）**:
- **DOC-DRAFT-M0902-01**: md:77「上記の各URL」へのアクセス拒否 vs eyml:259-269の制限対象は`admin_content_file`ルートのみ（view/download/deleteは非対象）。
- **DOC-DRAFT-M0902-02**: md:105「ディレクトリ空判定…サーバ側で再判定する」 vs delete()に空判定なし（L1-035）。再帰削除の根拠はcontrollerでなくvendor実装=**symfony/filesystem v7.4.0 `Filesystem.php:145-203`**（`remove()`→`doRemove()`のis_dir再帰。FC:240は呼出のみ）。
- **DOC-DRAFT-M0902-03**: md:160「通常文字以外しか含まれない場合…空になる」 vs 実装はASCII英数・記号を全除去（ASCIIのみの名前が空側になる。L1-015）。

## §2 SEED三段参照設計（FS版・使い捨て作業ディレクトリ＋cleanup）

DBを使わないため、SEEDは**user_data配下のファイル/フォルダ配置**である。期待値の正はL1オラクルID（SEEDを期待値の正にしない三段参照）。全て`@TBD-D5`。

| SEED | 内容 | 用途・規律 |
|---|---|---|
| SEED-M0902-BASE@TBD-D5 | `user_data/e2e_m0902_seed/` 配下: `sub_empty/`（空フォルダ）・`sub_full/keep.txt`（非空フォルダ）・`sample.txt`（内容=固定文字列 `E2E-M0902-SAMPLE`）・`pic.png`（1x1固定バイトPNG。fixture実体は `e2e/fixtures/files/` へ外出し） | **読取専用**（表示・移動・DL・表示・disabled判定・ツリー/JSON検証）。破壊的操作に使わない。適用はfs.ts（§6.2）による配置スクリプト |
| WORK-M0902-`<runid>`（テスト内生成） | `user_data/e2e_m0902_<runid>/` をテスト冒頭にUIフォルダ作成（または前提手順）で作成 | **全破壊的操作（UL/作成/削除/上書き）をこの配下に限定**。afterEachでfs.ts `rm -rf`（自己作成物限定。非空フォルダはUI削除がdisabled〔L1-035〕のためUI経由で撤去できない→fs.ts必須） |

- アップロード素材はfixture外出し: `e2e/fixtures/files/e2e_ok.png`（許可拡張子）・`e2e_ok2.txt`・`e2e_invalid.exe`（許可外）等。ファイル名は衝突回避に`E2E-<runid>-`接頭辞を`setInputFiles`のname指定で付与。
- SEED再適用: BASE読取専用運用のため原則不要。BASE汚染検知時のみ再配置。

## §3 操作×防御マトリクス（画面項目マトリクスのFS版）

| 操作 | 未認証 | CSRF | `..`含み | 領域外実パス | 不存在パス | ファイル指定 | 制限(env=1) |
|---|---|---|---|---|---|---|---|
| 表示GET file_manager | L1-001（ログインへ） | —（GET） | L1-011/012（トップfallback） | 同左 | 同左（realpath false→fallback） | **L1-047=未確定（BC-DRAFT-02）** | L1-041=403 |
| 移動POST(mode空) | L1-001 | form._token（twig:124） | L1-011/012 | L1-011/012 | fallback | 同上 | L1-041=403 |
| アップロード(mode=upload) | L1-001 | 同上 | L1-022（now_dir検査→エラー・未保存） | L1-022 | L1-022 | —（now_dirはdir前提検査） | L1-041=403 |
| フォルダ作成(mode=create) | L1-001 | 同上 | now_dir外はトップ起点（FC:194-196） | 同左 | 同左 | — | L1-041=403 |
| 削除DELETE | L1-001 | **L1-032=403** | L1-012（checkDir false→無処理redirect） | 同左 | fs不存在→無処理（FC:231） | —（ファイルは正当対象） | **対象外（DOC-DRAFT-01）** |
| 表示GET file_view | L1-001 | — | **L1-013=404** | L1-013=404 | 404 | —（ファイルが正当対象） | 対象外（DOC-DRAFT-01） |
| DL GET file_download | L1-001 | — | **L1-014=404** | 404 | 404 | フォルダ指定=404 | 対象外（DOC-DRAFT-01） |

入力項目検証（md:224-227・L1-016〜027）: フォルダ名=必須/文字種/先頭ピリオド/重複、ファイル=未選択/同名フォルダ/文字種/先頭ピリオド/拡張子13種（順序=L1-023）。文字数上限はフォーム上なし（md:227「文字数の上限はフォーム上で課さない」=最大長マトリクス対象外・FSの制限に依存で断定しない）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全70行を実体掲載**）

### §4.1 bound対応候補行（45行。§8の111対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-02_admin_content_content_file	E2E-M0902C-002	IT-15	初期表示	P1	ファイル管理画面がHTTP200で一覧・ツリー・パンくず・追加カードを表示	ログイン済(SEED-M01-ADMIN)／SEED-M0902-BASE	—	1. GET /%eccube_admin_route%/content/file_manager 2. 4要素(#form1内 追加カード・#bread・一覧table・#directory_userdata)の存在を確認	HTTP200＋追加カード・パンくず・一覧・ツリーが存在 [L1:L1-M0902-002,L1-M0902-003]				
m09-02_admin_content_content_file	E2E-M0902C-003	IT-25	画面レイアウト	P2	カード見出し3種（ja）	ログイン済	—	1. 画面を開く 2. card-title文言を読む	「ファイル・フォルダを追加」「このフォルダ内のファイル」「フォルダ構成」が存在 [L1:L1-M0902-004]				
m09-02_admin_content_content_file	E2E-M0902C-004	IT-25	情報表示	P2	情報メッセージが全文で一度だけ表示され再表示で消える	ログイン済	—	1. 画面を開く 2. 情報メッセージ全文一致と件数=1を確認 3. 再度同URLを開く 4. 情報メッセージ不在を確認	初回表示に全文（L1-005 ja逐語）が1件のみ・リロード後は表示されない（addFlashOnce） [L1:L1-M0902-005]				
m09-02_admin_content_content_file	E2E-M0902C-005	IT-25	画面表示データ	P2	一覧行構成と「（日時）更新」表示	ログイン済／SEED-M0902-BASE	—	1. 画面を開く 2. sample.txt行のセル（アイコン・名前・サイズ・更新日時・操作）を読む 3. 更新日時セルのspan.updated文言を読む	行が5要素で構成され、更新日時が「（date_sec形式日時） 更新」で表示・エラーなし [L1:L1-M0902-006; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-006	IT-25	一覧	P2	フォルダ行とファイル行の表示分け	ログイン済／SEED-M0902-BASE	—	1. 画面を開く 2. sub_empty行=フォルダアイコン+a.js-dir-move+操作は.action-deleteのみ を確認 3. pic.png行=サムネイル背景div+.action-copy/.action-view/.action-download/.action-delete の4操作を確認	フォルダ行は名前リンク+削除のみ・ファイル行は4操作＋画像はサムネイル背景 [L1:L1-M0902-007; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-008	IT-16	ファイル選択	P2	ファイル選択欄がmultiple対応	ログイン済	—	1. 画面を開く 2. input[type=file]のmultiple属性を読む	multiple属性が存在 [L1:L1-M0902-009]				
m09-02_admin_content_content_file	E2E-M0902C-009	IT-12	画面レイアウト	P2	フォルダ名はtext入力・プレースホルダ「フォルダ名」	ログイン済	—	1. 画面を開く 2. create_file widgetのtype/placeholder属性を読む	type=text かつ placeholder=「フォルダ名」 [L1:L1-M0902-010]				
m09-02_admin_content_content_file	E2E-M0902C-011	IT-27	JSON	P1	ツリーJSON（arrTree/paths）がフォルダのみでSEED構成と一致	ログイン済／SEED-M0902-BASE	—	1. 画面を開く 2. page.evaluateでarrTree/pathsを取得 3. SEEDフォルダ（/e2e_m0902_seed,/…/sub_empty,/…/sub_full）のjailパスが含まれ、sample.txt等ファイルのパスが含まれないことを確認 4. ツリーUIが構築されuser_data根であることを確認	arrTree/pathsがSEEDフォルダ構成と一致（フォルダのみ・ファイル不含・user_data根） [L1:L1-M0902-038; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-012	IT-25	画面レイアウト	P2	パンくずが各階層リンク・最終階層active	ログイン済／SEED-M0902-BASE	—	1. sub_fullへ移動 2. #bread内のli構成を読む	中間階層はa.js-open-folderリンク・最終階層はli.active（リンクなし） [L1:L1-M0902-039; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-014	IT-27	移動	P1	一覧フォルダ名リンクで移動→同画面再表示・一覧が移動先内容へ切替	ログイン済／SEED-M0902-BASE	—	1. トップでsub_fullのa.js-dir-move押下（mode空POST） 2. 再表示後の一覧を読む	同画面が再表示されカレント=sub_full。一覧にkeep.txtが表示され、旧カレント（トップ）のsample.txt等は表示されない。パンくず・now_dir hiddenが現在位置を示す [L1:L1-M0902-045,L1-M0902-011,L1-M0902-042; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-015	IT-27	移動	P1	ツリーのフォルダ押下で移動（カレント変更）	ログイン済／SEED-M0902-BASE	—	1. ツリーのsub_empty押下（tree_select_file設定→送信） 2. 一覧とパンくずを読む	カレントがsub_emptyへ変更され一覧は空（親戻り行のみ） [L1:L1-M0902-045,L1-M0902-038; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-016	IT-15	パス防御	P1	tree_select_file改変（../・領域外・不存在）→トップfallback（非UI）	ログイン済／SEED-M0902-BASE	GET /content/file_manager?tree_select_file=../../ ほか /etc・/notexist の3種（§6.1契約）	1. 各値でGET 2. HTTP statusと一覧・ツリー起点を確認	いずれもHTTP200・カレント=user_dataトップとして一覧（sample.txt等トップ内容）を表示（例外にならない）。※配下ファイルパス指定はL1-047未確定=BC-DRAFT-M0902-02（要実機・本行の対象外） [L1:L1-M0902-011,L1-M0902-012; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-017	IT-27	移動	P1	パンくず押下で当該階層へ移動	ログイン済／SEED-M0902-BASE	—	1. sub_fullへ移動 2. パンくずの上位階層（e2e_m0902_seed）押下 3. 一覧を読む	カレントが押下階層へ変更され一覧が当該階層の内容（sub_empty/sub_full/sample.txt…）へ切替 [L1:L1-M0902-039,L1-M0902-045; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-020	IT-33	ファイル登録	P1	許可拡張子ファイルのアップロード成功（フラッシュ・一覧・FS実体一致）	ログイン済／WORK-M0902作成済み	file=e2e_ok.png（name=E2E-<runid>-ok.png）	1. WORKへ移動 2. ファイル選択しアップロード押下（mode=upload） 3. フラッシュを読む 4. 一覧に当該行が現れることを確認 5. fs.tsでWORK配下の実体存在とバイト一致を確認（afterEach: WORK削除）	「1件のファイルをアップロードしました。(1/1)」＋一覧に表示＋FS実体がfixtureとバイト一致・エラー表示なし [L1:L1-M0902-029,L1-M0902-030,L1-M0902-050; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-021	IT-27	配置先	P1	サブフォルダへ移動してアップロード→配置先の一覧・FSに含まれる	ログイン済／WORK-M0902配下にサブフォルダ作成済み	file=e2e_ok2.txt（name=E2E-<runid>-sub.txt）	1. WORK/subへ移動 2. アップロード 3. 一覧とfs.tsでWORK/sub配下を確認（afterEach: WORK削除）	保存先=カレント（WORK/sub）でその一覧に含まれ、fs.tsで実体確認 [L1:L1-M0902-029,L1-M0902-011; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-022	IT-15	jailパス	P1	一覧・公開URL欄のパスがjail相対（絶対パス非露出）	ログイン済／SEED-M0902-BASE	—	1. 画面を開く 2. pic.png行の.copy-file-path input valueとdata-file-path群を読む	公開URL欄value=asset(user_data)+`/e2e_m0902_seed/pic.png`（jail相対）で、サーバ絶対パス（/var/www等）が画面のどこにも出ない [L1:L1-M0902-037; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-023	IT-26	登録内容	P1	複数ファイルの一部が検証外→通過分のみ保存・件数(1/2)	ログイン済／WORK-M0902作成済み	file=[E2E-<runid>-ok.png, E2E-<runid>-bad.exe]	1. WORKで2件選択しアップロード 2. フラッシュ・エラー表示を読む 3. fs.tsでok.pngのみ存在・bad.exe不存在を確認（afterEach: WORK削除）	「1件のファイルをアップロードしました。(1/2)」＋「アップロードできないファイル拡張子です。」併記＋FSは通過分のみ [L1:L1-M0902-029,L1-M0902-030,L1-M0902-027; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-024	IT-26	登録内容	P1	同一検証エラーの複数ファイルは文言1回のみ・FS追加なし	ログイン済／WORK-M0902作成済み	file=[E2E-<runid>-a.exe, E2E-<runid>-b.exe]	1. WORKで2件アップロード 2. p.errormsg件数と文言を数える 3. fs.tsで両ファイル不存在を確認（afterEach: WORK削除）	「アップロードできないファイル拡張子です。」が1回だけ表示・成功フラッシュなし・FS追加なし [L1:L1-M0902-028,L1-M0902-027; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-025	IT-26	更新内容	P1	同名ファイル再アップロードは上書き保存（内容変更・エントリ数不変・エラーなし）	ログイン済／WORK-M0902作成済み	同名name=E2E-<runid>-dup.txtで内容V1→V2の2回	1. V1をアップロードしfs.tsで内容確認 2. 同名でV2をアップロード 3. フラッシュ・一覧件数・fs.ts内容を確認（afterEach: WORK削除）	2回目もエラーなく「1件のファイルをアップロードしました。(1/1)」・一覧の当該名は1行のまま・FS内容がV2へ変更 [L1:L1-M0902-031,L1-M0902-030; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-026	IT-22	必須	P1	ファイル未選択でアップロード→「選択されていません」	ログイン済	file=未選択	1. 未選択のままアップロード押下 2. p.errormsgを読む	「選択されていません」表示・成功フラッシュなし [L1:L1-M0902-021]				
m09-02_admin_content_content_file	E2E-M0902C-027	IT-22	フォーマット	P1	許可外拡張子（.exe）拒否・FS追加なし	ログイン済／WORK-M0902作成済み	file=E2E-<runid>-bad.exe	1. WORKでアップロード 2. エラー表示を読む 3. fs.tsで不存在確認（afterEach: WORK削除）	「アップロードできないファイル拡張子です。」表示・FS追加なし（サーバ側検証） [L1:L1-M0902-027; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-028	IT-22	フォーマット	P2	ファイル名に許可外文字（@）→拒否	ログイン済／WORK-M0902作成済み	file名=E2E-<runid>-@ng.png	1. WORKでアップロード 2. エラー表示 3. fs.ts不存在確認（afterEach: WORK削除）	「使用できない文字が含まれています。」表示・FS追加なし [L1:L1-M0902-025; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-029	IT-22	フォーマット	P2	先頭ピリオドのファイル→拒否・FS追加なし	ログイン済／WORK-M0902作成済み	file名=.e2e-<runid>.png	1. WORKでアップロード 2. エラー表示 3. fs.ts不存在確認（afterEach: WORK削除）	「.で始まるファイルはアップロードできません。」表示・FS追加なし [L1:L1-M0902-026; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-030	IT-22	相関	P1	同名フォルダ存在時のファイルアップロード拒否	ログイン済／WORK-M0902配下にフォルダE2E-<runid>-dir作成済み	file名=E2E-<runid>-dir（フォルダと同名。拡張子なし可=検証順①が先）	1. WORKでアップロード 2. エラー表示 3. fs.tsで当該名がフォルダのままであることを確認（afterEach: WORK削除）	「ファイルと同じ名前のフォルダが存在するためアップロードできません。」表示・FS変化なし [L1:L1-M0902-024,L1-M0902-023; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-031	IT-27	パス防御	P1	now_dir改変（領域外）で保存されずエラー（非UI直POST）	ログイン済／SEED-M0902-BASE	POST /content/file_manager: mode=upload・now_dir=/../・file=e2e_ok.png（multipart・_token正規・§6.1契約）	1. hidden改変相当の直接POST 2. 応答HTMLのエラー領域を読む 3. fs.tsでuser_data直下・親側に保存されていないことを確認	保存されない＋エラー領域に文言表示（仕様期待=「アップロード先不正のエラーを表示」md:236）。※訳キー欠落（実測）により生キー`file.text.error.invalid_upload_folder`が表示される可能性=BC-DRAFT-M0902-01（**要実機・実走で表示文言を確認するまで生キー表示を確定としない**）。既存一覧表示は維持 [L1:L1-M0902-022,L1-M0902-012]				
m09-02_admin_content_content_file	E2E-M0902C-032	IT-26	無副作用	P2	画面表示（GET）のみではFSに何も追加されない	ログイン済／SEED-M0902-BASE	—	1. fs.tsでuser_data配下のエントリ一覧を記録 2. file_managerをGETで2回表示 3. fs.tsで再取得し差分0を確認	表示のみでFS不変（追加されない） [L1:L1-M0902-046; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-035	IT-26	登録内容	P1	有効フォルダ名で作成→「作成しました」・一覧/ツリー反映・FS実体	ログイン済／WORK-M0902作成済み	create_file=E2E-<runid>-newdir	1. WORKで入力し作成押下（mode=create） 2. フラッシュ 3. 一覧・ツリーへの出現 4. fs.tsでディレクトリ実在確認（afterEach: WORK削除）	「作成しました」＋一覧・ツリーに追加表示＋fs.tsでdirectory実在・エラーなし [L1:L1-M0902-020,L1-M0902-038; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-036	IT-22	必須	P1	フォルダ名空で作成→「入力されていません。」	ログイン済	create_file=空	1. 空のまま作成押下 2. p.errormsgを読む	「入力されていません。」表示・作成されない [L1:L1-M0902-016]				
m09-02_admin_content_content_file	E2E-M0902C-037	IT-22	フォーマット	P2	フォルダ名に許可外文字→「使用できない文字が含まれています。」	ログイン済	create_file=e2e@ng	1. 作成押下 2. エラー表示 3. fs.ts不存在確認	「使用できない文字が含まれています。」表示・FS追加なし [L1:L1-M0902-017]				
m09-02_admin_content_content_file	E2E-M0902C-038	IT-22	フォーマット	P2	先頭ピリオドのフォルダ名→「ピリオド(.)で始まる名前は使用できません。」	ログイン済	create_file=.e2ehidden	1. 作成押下 2. エラー表示 3. fs.ts不存在確認	「ピリオド(.)で始まる名前は使用できません。」表示・FS追加なし [L1:L1-M0902-018]				
m09-02_admin_content_content_file	E2E-M0902C-039	IT-22	相関	P1	既存同名（フォルダ・ファイル両方）でフォルダ作成拒否	ログイン済／WORK-M0902配下にフォルダE2E-<runid>-dirとファイルE2E-<runid>-f.txt配置済み	create_file=E2E-<runid>-dir／2回目=E2E-<runid>-f.txt	1. 既存フォルダ同名で作成押下→エラー確認 2. 既存ファイル同名で作成押下→エラー確認 3. fs.tsで新規作成なしを確認（afterEach: WORK削除）	いずれも「（名前） は既に使用されています。別のフォルダ名を入力してください」表示・作成されない（file_existsはファイルも対象） [L1:L1-M0902-019; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-040	IT-12	パスコピー	P1	パスコピー押下→URL欄表示・focus・値=公開URL・サーバ送信なし・ツールチップ切替	ログイン済／SEED-M0902-BASE	—	1. pic.png行の.action-copy押下 2. .copy-file-pathの表示とfocus・input値を読む 3. page.on(request)でfile_managerへのPOSTが発生しないことを確認 4. ツールチップtitleの切替（「パスをコピーしました」）を確認（execCommandコピー成否はブラウザ依存=切替まで観測）	URL欄が表示されfocus・値=公開URL（jail相対）・ネットワーク送信なし・コピー成功時title=「パスをコピーしました」 [L1:L1-M0902-040,L1-M0902-037; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-045	IT-25	表示	P1	file_viewはSEEDファイル内容を返し・UIリンクは別タブ	ログイン済／SEED-M0902-BASE	GET /content/file_view?file=/e2e_m0902_seed/sample.txt（request契約）	1. UIでsample.txt行の.action-viewのhref/target属性を読む 2. request APIで同URLをGETしbodyを取得 3. fs.ts catの内容と比較	target=_blank・HTTP200・レスポンスbody=FS実体（E2E-M0902-SAMPLE）と一致 [L1:L1-M0902-013,L1-M0902-050,L1-M0902-051; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-046	IT-15	パス防御	P1	file_viewで領域外（../etc/passwd等）→HTTP404	ログイン済	GET /content/file_view?file=/../../etc/passwd ほか不存在パス	1. request APIでGET 2. statusを読む	HTTP404（専用文言なし・領域内に限定） [L1:L1-M0902-013,L1-M0902-012]				
m09-02_admin_content_content_file	E2E-M0902C-047	IT-24	出力内容	P2	file_downloadの内容がFS実体と一致・添付ヘッダ	ログイン済／SEED-M0902-BASE	GET /content/file_download?select_file=/e2e_m0902_seed/sample.txt	1. request APIでGET 2. body・Content-Dispositionヘッダを読む 3. fs.ts catと比較	HTTP200・body=FS実体と一致・Content-Dispositionはattachment（ファイル名分岐はL1-015/C-049） [L1:L1-M0902-014,L1-M0902-050,L1-M0902-015; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-048	IT-15	パス防御	P1	file_downloadでフォルダ・領域外→HTTP404	ログイン済／SEED-M0902-BASE	GET /content/file_download?select_file=/e2e_m0902_seed/sub_empty ほか /../../etc/passwd	1. request APIで各GET 2. statusを読む	いずれもHTTP404（フォルダ・領域外は見つからない扱い） [L1:L1-M0902-014,L1-M0902-012; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-055	IT-05	削除	P1	ファイル削除実行→「削除しました」・FS消滅・一覧から消える・親dir表示	ログイン済／WORK-M0902配下にE2E-<runid>-del.txtをアップロード済み	—	1. 当該行の削除アイコン押下→モーダル内「削除」押下（token-for-anchor正規トークン+_method=delete） 2. フラッシュとリダイレクト先（tree_select_file=親dir）を読む 3. 一覧から消えたことを確認 4. fs.tsで不存在確認（afterEach: WORK削除）	「削除しました」＋一覧に含まれない＋fs.ts不存在＋カレント=対象の親ディレクトリ [L1:L1-M0902-034,L1-M0902-032; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-056	IT-05	削除	P1	空フォルダの削除成功	ログイン済／WORK-M0902配下に空フォルダ作成済み	—	1. 空フォルダ行の削除ボタン（disabledでない）→モーダル削除実行 2. フラッシュ 3. fs.ts不存在確認（afterEach: WORK削除）	削除ボタン有効・「削除しました」・FSからフォルダ消滅 [L1:L1-M0902-034,L1-M0902-035; fixture:WORK-M0902@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-057	IT-25	確認ダイアログ	P2	削除モーダルに見出しと対象名差込本文	ログイン済／SEED-M0902-BASE	—	1. sample.txt行の削除アイコン押下 2. モーダルのh5.modal-titleと本文pを読む	見出し「削除します」・本文「この操作はあとから取り消すことができません。「sample.txt」を削除してよろしいですか？」（JS confirmは出ない=data-confirm:false） [L1:L1-M0902-036; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-058	IT-25	確認ダイアログ	P2	モーダルはキャンセルで閉じ削除されない	ログイン済／SEED-M0902-BASE	—	1. sample.txt行の削除アイコン押下 2. キャンセル(data-bs-dismiss)押下 3. モーダルが閉じることを確認 4. fs.tsでsample.txt残存確認	モーダルが閉じ・FS残存（削除状態にならない） [L1:L1-M0902-036,L1-M0902-034; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-059	IT-25	更新抑止	P1	空でないフォルダの削除ボタンはdisabled	ログイン済／SEED-M0902-BASE	—	1. 画面を開く 2. sub_full行の.action-deleteのclassを読む 3. sub_empty行と対比	sub_full=disabledあり・sub_empty=disabledなし（UI抑止。サーバ側空再判定なし=DOC-DRAFT-M0902-02のため非空フォルダのサーバ直DELETEは本行で試験しない） [L1:L1-M0902-035; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-060	IT-15	CSRF	P1	token不正のDELETE→HTTP403・FS残存（非UI）	ログイン済セッション（同一context）／SEED-M0902-BASE	DELETE /content/file_delete?select_file=/e2e_m0902_seed/sample.txt（_token=正規値の末尾1文字置換・§6.1契約）	1. 改変tokenでDELETE送信 2. statusを読む 3. fs.tsでsample.txt残存確認	HTTP403（AccessDeniedHttpException 'CSRF token is invalid.'）・削除されない [L1:L1-M0902-032; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-061	IT-05	削除条件	P1	select_fileが空・/のDELETEは削除せずリダイレクト（非UI・正規token）	ログイン済／SEED-M0902-BASE	DELETE /content/file_delete: select_file=""／"/" の2種（正規_token・§6.1契約）	1. 各値でDELETE送信 2. 応答（admin_content_fileへのリダイレクト）を確認 3. fs.tsでuser_data配下の差分0を確認	削除処理へ入らず一覧へリダイレクト・FS不変（値も変更されない） [L1:L1-M0902-033; fixture:SEED-M0902-BASE@TBD-D5]				
m09-02_admin_content_content_file	E2E-M0902C-062	IT-05	削除条件	P1	領域外select_fileのDELETEは削除されない（非UI・正規token）	ログイン済	DELETE /content/file_delete?select_file=/../../etc/hosts（正規_token）	1. DELETE送信 2. リダイレクト応答確認 3. fs.tsで/etc/hosts残存（コンテナ内）確認	checkDir拒否により削除実行されずリダイレクトのみ（操作領域=user_data固定） [L1:L1-M0902-012,L1-M0902-033]				
m09-02_admin_content_content_file	E2E-M0902C-068	IT-27	出力失敗	P1	保存失敗時「（ファイル名） のアップロードに失敗しました。」（要実機）	ログイン済／保存失敗を誘発できる状態（**誘発手段は一次資料に規定なし**）	—	（誘発手段確定後: 書込不能状態でアップロード）	「%file_name% のアップロードに失敗しました。」表示・成功件数に数えない [L1:L1-M0902-052]（実行可能グレード対象外=fixme相当・要実機）				
```

### §4.2 補完行（7行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合111行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-02_admin_content_content_file	E2E-M0902C-001	IT-15	未認証	P1	未認証で各URL直接アクセス→管理ログインへ	未ログイン	GET file_manager／GET file_view?file=/x／DELETE file_delete（cookie無し）	1. 認証cookie無しで各URLへアクセス 2. 応答を確認	いずれもadmin_loginへ誘導され本機能へ到達しない [L1:L1-M0902-001]（補完行・親test_idなし・設計書補完）				
m09-02_admin_content_content_file	E2E-M0902C-007	IT-25	一覧	P2	トップ階層以外で一覧先頭に親へ戻る行	ログイン済／SEED-M0902-BASE	—	1. sub_fullへ移動 2. 一覧先頭行（fa-reply付きtr）を確認 3. トップでは同行が無いことを確認	トップ以外で親ディレクトリへ戻る行が先頭に表示・トップでは非表示 [L1:L1-M0902-008; fixture:SEED-M0902-BASE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-02_admin_content_content_file	E2E-M0902C-010	IT-02	表示順	P2	一覧はカレント直下のみ・名前順・フォルダ→ファイルの順	ログイン済／SEED-M0902-BASE	—	1. e2e_m0902_seedへ移動 2. 一覧行の名前列を文書順に取得	順序=sub_empty,sub_full（フォルダ名前順）→pic.png,sample.txt（ファイル名前順）。sub_full/keep.txt（深さ1）は表示されない [L1:L1-M0902-042; fixture:SEED-M0902-BASE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-02_admin_content_content_file	E2E-M0902C-049	IT-24	出力内容	P2	DLファイル名分岐（ASCII名→ファイル名指定なし添付）	ログイン済／SEED-M0902-BASE	GET /content/file_download?select_file=/e2e_m0902_seed/sample.txt	1. request APIでGET 2. Content-Dispositionを読む	attachmentだがfilename指定なし（ASCII英数記号は全除去→空）。※md:160の条件記述は実装と逆向きの疑い=DOC-DRAFT-M0902-03。非ASCII残存名のfilename*=UTF-8''分岐はSEEDへのFS直接配置が必要=要実機 [L1:L1-M0902-015; fixture:SEED-M0902-BASE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-02_admin_content_content_file	E2E-M0902C-065	IT-15	権限	P1	ECCUBE_RESTRICT_FILE_UPLOAD=1でfile_manager 403（要実機=env切替）	管理者ログイン済／環境変数=1（**env切替が必要**）	GET /content/file_manager	（env切替後）1. GETしstatusを確認 2. メニュー非表示を確認	HTTP403「この機能は管理者によって制限されています。」・メニューからファイル管理が消える。※制限対象はadmin_content_fileルートのみ（view/download/delete非対象=DOC-DRAFT-M0902-01） [L1:L1-M0902-041]（補完行・親test_idなし・設計書補完・要実機）				
m09-02_admin_content_content_file	E2E-M0902C-069	IT-20	ログ	P3	失敗系ログ記録と秘密値不出力（実行保留）	ログイン済	—	（ログ観測手段確定後）1. 失敗系操作 2. アプリケーションログを走査	作成/保存失敗・アダプタ不存在削除がログ記録され、トークン原値・セッションID完全値・Cookie値・ファイル内容が出ない [L1:L1-M0902-043,L1-M0902-044]（補完行・親test_idなし・設計書補完・観測手段未契約=実行保留。L1-044は設計書由来でコード立証なし）				
m09-02_admin_content_content_file	E2E-M0902C-070	IT-22	検証順序	P2	アップロード検証順=同名フォルダが最優先	ログイン済／WORK-M0902配下にフォルダE2E-<runid>-dir.exe作成済み	file名=E2E-<runid>-dir.exe（同名フォルダ違反+拡張子違反の複合）	1. WORKでアップロード 2. エラー文言を読む（afterEach: WORK削除）	表示は「ファイルと同じ名前のフォルダが存在するためアップロードできません。」（順序①が④より先に発火） [L1:L1-M0902-023,L1-M0902-024; fixture:WORK-M0902@TBD-D5]（補完行・親test_idなし・設計書補完）				
```

### §4.3 -EN行（18行。LS=1 claimのlocale多重・対応ja行と同一親）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-02_admin_content_content_file	E2E-M0902C-003-EN	IT-25	画面レイアウト	P2	カード見出し（en）	ログイン済／locale=en	—	同C-003	"Add File / Directory"・"Files in This Directory"・"Directories" [L1:L1-M0902-004]				
m09-02_admin_content_content_file	E2E-M0902C-004-EN	IT-25	情報表示	P2	情報メッセージ（en）	ログイン済／locale=en	—	同C-004	L1-005のen逐語（"If this feature is used infrequently, …"）が一度だけ表示 [L1:L1-M0902-005]				
m09-02_admin_content_content_file	E2E-M0902C-005-EN	IT-25	画面表示データ	P2	更新日時ラベル（en）	ログイン済／SEED-M0902-BASE／locale=en	—	同C-005	更新日時に続き "Update" が表示 [L1:L1-M0902-006]				
m09-02_admin_content_content_file	E2E-M0902C-009-EN	IT-12	画面レイアウト	P2	プレースホルダ（en）	ログイン済／locale=en	—	同C-009	placeholder="Folder Name" [L1:L1-M0902-010]				
m09-02_admin_content_content_file	E2E-M0902C-020-EN	IT-33	ファイル登録	P2	アップロード成功フラッシュ（en）	ログイン済／WORK-M0902／locale=en	同C-020	同C-020	"1 file upload completed. (1/1)" [L1:L1-M0902-030]				
m09-02_admin_content_content_file	E2E-M0902C-026-EN	IT-22	必須	P2	未選択（en）	ログイン済／locale=en	同C-026	同C-026	"Not selected" [L1:L1-M0902-021]				
m09-02_admin_content_content_file	E2E-M0902C-027-EN	IT-22	フォーマット	P2	拡張子拒否（en）	ログイン済／WORK-M0902／locale=en	同C-027	同C-027	"File extension cannot be uploaded." [L1:L1-M0902-027]				
m09-02_admin_content_content_file	E2E-M0902C-028-EN	IT-22	フォーマット	P2	ファイル名文字拒否（en）	ログイン済／WORK-M0902／locale=en	同C-028	同C-028	"The folder name contains invalid characters." [L1:L1-M0902-025]				
m09-02_admin_content_content_file	E2E-M0902C-029-EN	IT-22	フォーマット	P2	dotファイル拒否（en）	ログイン済／WORK-M0902／locale=en	同C-029	同C-029	"Dot files cannot be uploaded." [L1:L1-M0902-026]				
m09-02_admin_content_content_file	E2E-M0902C-030-EN	IT-22	相関	P2	同名フォルダ拒否（en）	ログイン済／WORK-M0902／locale=en	同C-030	同C-030	"Cannot upload because a folder with the same name as the file exists." [L1:L1-M0902-024]				
m09-02_admin_content_content_file	E2E-M0902C-035-EN	IT-26	登録内容	P2	作成成功フラッシュ（en）	ログイン済／WORK-M0902／locale=en	同C-035	同C-035	"Created" [L1:L1-M0902-020]				
m09-02_admin_content_content_file	E2E-M0902C-036-EN	IT-22	必須	P2	フォルダ名空（en）	ログイン済／locale=en	同C-036	同C-036	"No value found." [L1:L1-M0902-016]				
m09-02_admin_content_content_file	E2E-M0902C-037-EN	IT-22	フォーマット	P2	フォルダ名文字拒否（en）	ログイン済／locale=en	同C-037	同C-037	"The folder name contains invalid characters." [L1:L1-M0902-017]				
m09-02_admin_content_content_file	E2E-M0902C-038-EN	IT-22	フォーマット	P2	先頭ピリオド（en）	ログイン済／locale=en	同C-038	同C-038	"Folder names beginning with a period(.) are not allowed." [L1:L1-M0902-018]				
m09-02_admin_content_content_file	E2E-M0902C-039-EN	IT-22	相関	P2	同名重複（en）	ログイン済／WORK-M0902／locale=en	同C-039	同C-039	"（名前） is already exists." [L1:L1-M0902-019]				
m09-02_admin_content_content_file	E2E-M0902C-040-EN	IT-12	パスコピー	P2	コピーツールチップ（en）	ログイン済／SEED-M0902-BASE／locale=en	—	同C-040	"Copy a path"→"Copied path" へ切替 [L1:L1-M0902-040]				
m09-02_admin_content_content_file	E2E-M0902C-055-EN	IT-05	削除	P2	削除成功フラッシュ（en）	ログイン済／WORK-M0902／locale=en	同C-055	同C-055	"Deleted" [L1:L1-M0902-034]				
m09-02_admin_content_content_file	E2E-M0902C-057-EN	IT-25	確認ダイアログ	P2	削除モーダル（en）	ログイン済／SEED-M0902-BASE／locale=en	—	同C-057	"Delete"・"You can not revert this action. Are you sure to delete sample.txt?" [L1:L1-M0902-036]				
```

## §5 locale対応表

LS=1: 21claim（L1-004/005/006/010/016/017/018/019/020/021/024/025/026/027/030/034/036/040/041/049/052）→ **-EN 18行**（§4.3）。
-EN行を作らないLS=1: L1-041（要実機=env切替・文言はja/en確定済み）・L1-052（要実機=誘発不能・文言確定済み）・L1-049（単独caseなし=C-040等の部品文言。ja/en逐語は§1に確定）。
en文言はすべてen一次資料逐語（messages.en.yaml/validators.en.yaml。ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。

## §6 判定手段骨子（候補=未実装）＋FS観測手段＋_drafts隔離lint証跡

### §6.1 request契約

- フォーム直POST: `POST /%eccube_admin_route%/content/file_manager`（multipart/form-data）。フィールド=`mode`・`now_dir`・`tree_select_file`・`tree_status`・`select_file`・`create_file`・`file[]`・`form[_token]`相当（form._token。twig:117-124）。tree_select_file改変はGETクエリでも可（FC:90 `$request->get`）。
- 削除: `DELETE`相当=`POST /content/file_delete?select_file=…` with `_token`＋`_method=delete`（fnjs:161-177の裏フォーム再現）。token改変=正規値の末尾1文字置換。
- file_view/file_download: Playwright request APIのGET（status・headers・body取得）。
- 未実装・実走なし（候補規律）。m09-01と同じくログイン済みcontextのcookie共有で送信。

### §6.2 FS観測手段（db.ts相当のfs.ts骨子・新規）

- 観測: `docker exec $E2E_WEB_CONTAINER test -e/-d <path>`・`cat`・`ls -1`・`stat`（読取専用）。書込は**WORK-M0902削除のcleanupのみ**（`rm -rf 'html/user_data/e2e_m0902_<runid>'`。自己作成物限定）。
- 既定コンテナ名: `ec-cube-enterprise-ec-cube-1`（docker-compose.ymlのサービス名`ec-cube`＋db.tsの既定`ec-cube-enterprise-postgres_primary-1`と同一プロジェクト接頭辞から推定。**実コンテナ名は要実機確認**・環境変数`E2E_WEB_CONTAINER`で上書き）。
- 期待値の正はL1（三段参照）。fs.ts出力はSUT実挙動側の観測値。ストレージアダプタ（S3/localstack）側の観測は**手段未契約=候補では主張しない**（FS側とフラッシュ表示のみで判定。アダプタ連携主張はL1-029/034のクレーム根拠に留める）。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード自体のリテラル`_drafts`〔oracle.ts:17,20実在確認〕を除く。ガードは`_drafts`・パス区切り・`..`を含むfileKeyの解決をthrowで拒否する機械強制）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は`_drafts/`の2ファイルのみ。
3. 既存の参考物（`e2e/spec/admin/m09/m09_02_admin_content_content_file.spec.ts`・`integration_test/e2e/m09_02_admin_content_content_file_e2e_cases.md`）は読取参照のみで不変。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-002〜C-017・C-026・C-036〜C-038・C-057〜C-059。
- Playwright+FS確認（fs.ts）: C-020〜C-025・C-027〜C-032・C-035・C-039・C-055・C-056・C-061・C-062。
- 非UI（request契約）: C-001・C-016・C-031・C-045〜C-049・C-060〜C-062。
- **要実機**: C-068（保存失敗誘発根拠なし）・C-065（env切替）・C-049の非ASCII名分岐（FS直接配置要）・BC-DRAFT-M0902-02の実挙動確認・fs.tsコンテナ名確定。
- **実行保留**: C-069（ログ観測手段未契約）・-EN 18行（D15）。
- 並行実行注意: WORK-M0902はrunid分離で並行可。SEED-M0902-BASEは読取専用のため共有可（C-032のFS差分0検査のみ、他テストの並行書込と衝突するためserial推奨）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点・前提ラベルはノイズ=前提列は設計書subject名の機械循環。前提が実在の設計subjectと期待テキストに整合する場合のみ配分に利用）。1候補ケース行=1 assertion bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み＝111↔候補の期待テキスト突合が本文内で完結する**。

### 集計（111 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **93** | 下表（うち要実機マーク: 001。**うち読み替えbound: 5〔013・014・015・016・082〕**=期待極性を実在の観測へ再解釈したbind。per-ID明記は下表・082はさらに要確認/TBD候補） |
| **TBD** | **0** | —（L1-047はbound行100の部分保留として§9で管理。読み替えbound5は「bound93」に含めるが上記のとおり別掲し、TBD=0を無条件の完全bindと読ませない） |
| **excluded** | **18** | EX-A 検索条件14（020〜033）／EX-B DB相関2（017〜018）／EX-C 機能不存在2（088入力JSON・090スキーマ） |
| 合計 | **111** | 欠落0・理由なし重複0 |

- 候補ケース行総数**70**（§4.1 bound対応45＋§4.2 補完7＋§4.3 -EN 18）。

### 111対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗の出力内容/取り込み結果が対象データと一致 | bound(要実機) | C-068（保存失敗文言=L1-052。誘発根拠なし） |
| 002 | CSRFの出力内容/取り込み結果が一致 | bound | C-060（token検証=改変時403・FS不変） |
| 003 | user_data絶対パスを取り除いた相対表現であること | bound | C-022（jailパス） |
| 004 | user_data起点に一覧・ツリー・パンくず表示 | bound | C-002 |
| 005 | 選択フォルダをカレントとして同画面再表示 | bound | C-014 |
| 006 | mode=uploadで選択ファイルをカレントへ保存 | bound | C-020 (shared) |
| 007 | mode=createでカレント配下に新規フォルダ作成 | bound | C-035 (shared) |
| 008 | トークン検証後user_data配下なら削除し一覧へ戻る | bound | C-055 |
| 009 | 配下ファイルなら別タブで内容返却 | bound | C-045 |
| 010 | 必須バリでエラー表示・完了しない | bound | C-036,C-026 |
| 011 | 必須バリでエラーなく継続 | bound | C-020,C-035 (shared) |
| 012 | フォルダ行=アイコン+名前リンク・操作は削除のみ | bound | C-006 (shared) |
| 013 | 相関バリでエラー・完了しない | bound(**読み替え**) | C-030（入力名×既存フォルダの相関）。**母集合前提の入力対象=「ファイル選択欄」。元の入力条件とは一致しないが、期待極性（相関エラーで完了しない）をFS相関〔同名フォルダ拒否〕へ再解釈したbind** |
| 014 | 相関バリでエラーなく継続 | bound(**読み替え**) | C-020 (shared・同名フォルダ非存在で成功)。**母集合前提の入力対象=「フォルダ作成欄」。元の入力条件とは一致しないが、期待極性（相関エラーなく継続）をFS相関非該当時のアップロード成功へ再解釈したbind** |
| 015 | 相関バリでエラーなく継続 | bound(**読み替え**) | C-035 (shared・重複なしで成功)。**母集合前提の入力対象=「ディレクトリツリー」。元の入力条件とは一致しないが、期待極性（相関エラーなく継続）を重複なしフォルダ作成成功へ再解釈したbind** |
| 016 | 相関バリでエラー・完了しない | bound(**読み替え**) | C-039（入力名×既存名の相関）。**母集合前提の入力対象=「パンくず」。元の入力条件とは一致しないが、期待極性（相関エラーで完了しない）をFS相関〔既存名重複拒否〕へ再解釈したbind** |
| 017 | DBとの相関バリでエラーなく継続 | **excluded** EX-B | — |
| 018 | DBとの相関バリでエラー・完了しない | **excluded** EX-B | — |
| 019 | 対象パスが許可ルート配下か・存在するか・操作可能かをサーバ判定 | bound | C-016 (shared) |
| 020〜033 | 検索条件の該当レコードが取得結果に含まれる/含まれない | **excluded** EX-A | — |
| 034 | 実行結果の該当レコードが取得結果に含まれる | bound | C-020 (shared・UL後一覧反映) |
| 035 | 実行結果の該当レコードが取得結果に含まれる | bound | C-035 (shared・作成後一覧反映) |
| 036 | 実行結果の該当レコードが取得結果に含まれる（領域外`..`前提） | bound | C-016 (shared・fallback後トップ一覧表示) |
| 037 | 実行結果の該当レコードが取得結果に含まれる（now_dir領域外前提） | bound | C-031（エラー表示+既存一覧維持。C4記録=§10） |
| 038 | 登録内容の対象レコードが追加される | bound | C-023（通過分保存） |
| 039 | 登録内容の対象レコードが追加されない | bound | C-024（拒否分未保存） |
| 040 | 登録内容の対象レコードが追加される（同名再UL前提） | bound | C-025（上書き保存） |
| 041 | user_data配下の現在位置であること（カレント定義） | bound | C-014 (shared) |
| 042 | 追加される（ツリー前提） | bound | C-035 (shared・ツリー反映) |
| 043 | 追加される（jail前提） | bound | C-020,C-022 (shared・jailパスで一覧追加) |
| 044 | 追加されない（画面を開く前提） | bound | C-032（GET表示はFS不変） |
| 045 | 追加される（移動前提） | bound | C-014 (shared・移動先内容が一覧に現れる) |
| 046 | 追加されない（アップロード前提） | bound | C-029,C-027 (shared・拒否でFS追加なし) |
| 047 | 追加される（作成前提） | bound | C-035 (shared) |
| 048 | 実行結果の対象レコードが追加される（削除前提=ノイズ） | bound | C-020,C-035 (shared。前提ノイズ判定=§10 C4記録) |
| 049 | 配下ファイルなら別タブで内容返却 | bound | C-045 (shared) |
| 050 | 更新内容の値が変更される | bound | C-025（上書きで内容変更） |
| 051 | 値が変更されない | bound | C-060 (shared・拒否時FS不変) |
| 052 | 値が変更される（一覧の表示分け前提） | bound | C-014 (shared・一覧表示切替) |
| 053 | 複数ファイル選択に対応（multiple） | bound | C-008 |
| 054 | 値が変更される（フォルダ作成欄前提） | bound | C-035 (shared・一覧/FSが変わる) |
| 055 | 値が変更される（ツリー前提） | bound | C-015 (shared・カレント変更) |
| 056 | 値が変更されない（パンくず前提） | bound | C-061 (shared・no-op削除でFS不変) |
| 057 | 値が変更される（パスコピー前提） | bound | C-040（ツールチップ文言切替） |
| 058 | 値が変更されない（削除モーダル前提） | bound | C-058（キャンセルで不変） |
| 059 | 値が変更される（ツリー押下前提） | bound | C-015 (shared) |
| 060 | 実行結果の値が変更される（パンくず押下前提） | bound | C-017（カレント変更） |
| 061 | 再検証なしであること | bound | C-040 (shared・サーバ送信なし) |
| 062 | 対象の存在・空判定・権限・トークンをサーバ側で再判定 | bound | C-060,C-062 (shared。空判定はDOC-DRAFT-M0902-02=再判定なしを§1に記録) |
| 063 | サイズ・拡張子・保存先・上書き可否はサーバ側で検証 | bound | C-027,C-031 (shared・直POSTでも拒否=サーバ層) |
| 064 | 情報メッセージを一度だけ表示 | bound | C-004 |
| 065 | 一覧の各行で更新日時に続けて表示 | bound | C-005 |
| 066 | 削除条件の対象レコードが削除状態にならない | bound | C-060,C-058,C-061 (shared) |
| 067 | 削除状態になる | bound | C-055 (shared) |
| 068 | 削除に成功したとき（「削除しました」の条件） | bound | C-055 (shared・成功時のみフラッシュ) |
| 069 | 削除状態になる | bound | C-056（空フォルダ削除） |
| 070 | 全操作の対象ルートをuser_data領域に固定 | bound | C-046,C-048,C-062,C-016 (shared) |
| 071 | 実行結果の出力内容が対象データと一致 | bound | C-047（DL内容=FS実体） |
| 072 | フォーマット定義でエラーなく継続 | bound | C-020 (shared・許可拡張子/許可文字で成功) |
| 073 | フォーマット定義でエラー・完了しない | bound | C-027,C-028,C-037,C-038（形式違反4種） |
| 074 | 出力内容が対象データと一致（ファイル追加前提） | bound | C-020 (shared・FSバイト一致) |
| 075 | 出力内容が対象データと一致（フォルダ追加前提） | bound | C-035 (shared・FS実体) |
| 076 | 出力内容が一致（領域外`..`前提） | bound | C-016 (shared・トップ内容表示) |
| 077 | 出力内容が一致（now_dir領域外前提） | bound | C-031 |
| 078 | 出力内容が一致（一部検証外前提） | bound | C-023 (shared) |
| 079 | 出力内容が一致（同一エラー複数前提） | bound | C-024 (shared・文言1回) |
| 080 | 出力内容でエラーなく継続（同名再UL前提） | bound | C-025 (shared) |
| 081 | 削除の該当レコードが取得結果に含まれない | bound | C-055 (shared・削除後一覧から消える) |
| 082 | 移動・リネームの該当レコードが取得結果に含まれない | bound(**読み替え・要確認**) | C-014 (shared・移動後、旧カレントのエントリは一覧に含まれない)。**「移動・リネーム」をカレント移動へ読み替え＝原文どおりの機能検証ではない（ファイル移動/リネーム操作自体は本機能に不存在=md:96・FCにエンドポイントなし）。厳格には要確認/TBD候補であり、読み替えの妥当性はD6/正式化時に再裁定する（隠さない）。読み替えは§10 C4記録** |
| 083 | コピーの出力内容が対象データと一致 | bound | C-040 (shared・公開URL値一致) |
| 084 | ファイル登録の出力内容が一致 | bound | C-020 (shared) |
| 085 | ファイル出力の出力内容が一致 | bound | C-047 (shared) |
| 086 | JSONの出力内容が対象データと一致 | bound | C-011（ツリーJSON=arrTree/paths） |
| 087 | 同名ファイルの出力内容が一致（フォルダ作成前提） | bound | C-039 (shared・同名ファイル既存でも拒否=file_exists) |
| 088 | 入力JSONの値が変更されない | **excluded** EX-C | — |
| 089 | 配置先の該当レコードが取得結果に含まれる | bound | C-021 |
| 090 | スキーマの出力内容が一致 | **excluded** EX-C | — |
| 091 | 追加カード・パンくず・一覧・ツリーを表示 | bound | C-003,C-002 (shared) |
| 092 | フォルダ行=名前リンク・操作は削除のみ | bound | C-006 |
| 093 | 更新抑止の出力内容が一致 | bound | C-059（非空フォルダdisabled=更新系抑止） |
| 094 | フォルダ名のテキスト入力であること | bound | C-009 |
| 095 | ツリーデータをもとにJSでフォルダ階層構築 | bound | C-011 (shared) |
| 096 | パンくず各階層をリンク表示 | bound | C-012 |
| 097 | コピー押下でURL欄表示・focus・コピー実行 | bound | C-040 (shared) |
| 098 | 削除ボタン押下でモーダル・対象名含む確認文 | bound | C-057 |
| 099 | 対象パスのサーバ側判定（ツリー押下前提） | bound | C-016 (shared) |
| 100 | 許可ルート外・不存在・ファイル指定をサーバ側で排除 | bound(部分) | C-016（許可ルート外・不存在=bound。**ファイル指定はBC-DRAFT-M0902-02=立証不能・要実機**） |
| 101 | 再検証なしであること | bound | C-040 (shared) |
| 102 | 存在・空判定・権限・トークンのサーバ側再判定 | bound | C-060,C-062 (shared・062と同一期待=shared-observation) |
| 103 | 画面表示データでエラーなく継続 | bound | C-020 (shared) |
| 104 | 情報メッセージを一度だけ表示 | bound | C-004 (shared) |
| 105 | 画面表示データでエラーなく継続（更新日時前提） | bound | C-005 (shared) |
| 106 | 削除モーダル内に対象名を差し込んで表示 | bound | C-057 (shared) |
| 107 | アップロードで1件以上保存に成功したとき（フラッシュ条件） | bound | C-020 (shared) |
| 108 | ファイル選択の出力内容が一致 | bound | C-020 (shared・選択ファイル=FS保存内容) |
| 109 | 専用文言なしでHTTP404として扱う | bound | C-046,C-048 |
| 110 | 対象ルートをuser_data領域に固定 | bound | C-046,C-048,C-062 (shared) |
| 111 | 空・未指定・`/`の選択は削除しない | bound | C-061 |

`func_scope_check` 判定: 親111/111会計済み（bound93+excluded18+TBD0）・欠落0・理由なし重複0・補完7行は§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### §9.1 要実機・実行保留（bound/補完内の保留マーク）

| 対象 | 理由 |
|---|---|
| 001→C-068 | 保存失敗の誘発手段が一次資料に規定なし（fixme相当） |
| C-065（補完） | env切替（ECCUBE_RESTRICT_FILE_UPLOAD=1）が必要 |
| C-049の非ASCII名分岐 | 非ASCII名ファイルはUI経由で配置不可（ファイル名検証L1-025）→FS直接配置が必要 |
| 100の「ファイル指定」部分 | BC-DRAFT-M0902-02（実装に排除コードなし・実挙動未確定） |
| C-031の表示文言（BC-DRAFT-M0902-01） | 訳キー不存在は実測済みだが**生キー表示は実走未確認**（翻訳器フォールバックの実機確認が必要=要実機） |
| 082の読み替えbound | 「移動・リネーム」→カレント移動への読み替えは原文どおりの機能検証でない（**要確認/TBD候補**・D6/正式化時に再裁定） |
| C-069（補完） | ログ観測手段未契約。L1-044は設計書由来でコード立証なし |
| fs.tsコンテナ名 | `ec-cube-enterprise-ec-cube-1`は推定（E2E_WEB_CONTAINERで上書き・要実機確認） |
| -EN 18行 | D15（管理画面en切替）待ち |
| ストレージアダプタ側観測 | 手段未契約（S3/localstack）。FS側+フラッシュのみで判定 |

### §9.2 §9-EX excluded per-ID表（全18件・実引き根拠。範囲一括でなく各IDを個別に正当化）

各行の期待テキストは母集合実引き（§8に要旨併記）。根拠の実引き:
(a) **検索機能不存在**: file.twigのform1にはhidden6種+`_token`+`file`+`create_file`以外の入力が無い（twig:117-124,137,149全列挙・検索入力0件）。FileController indexが読むリクエスト値は`tree_select_file`・`tree_status`・`mode`・`now_dir`のみ（FC:90,95,101,112,193,312・検索パラメータ0件）。設計書にも検索の規定なし（md:64-80 入口表に検索なし）。
(b) **DB不使用**: 「本機能はファイル・フォルダをデータベースに保存しない。…当機能に直接対応するテーブル・列は持たない。」（md:282）。FileControllerにEntityManager/Repository参照0件（use句=FC:14-36実引き・Doctrine系なし）。
(c) **JSON入力・スキーマ不存在**: 入力は「表示要求・POST・削除のDELETE・表示/DLのGET。アップロードはmultipart形式」のみ（md:273）。リクエストをJSONとして解釈する経路なし（FC全メソッド=`$request->get`とform handleRequestのみ）。スキーマ定義（DBスキーマ/JSONスキーマ）は本機能に存在しない（md:282・(b)同根拠）。

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 017 | EX-B | 「DBとの相関バリデーションでエラーが表示されず…」→DB自体を使わない（根拠b）ため「DBとの相関」検証は構成不能 |
| 018 | EX-B | 「DBとの相関バリデーションでエラーが表示され…」→同上（根拠b） |
| 020 | EX-A | 「検索条件の該当レコードが取得結果に含まれること」→検索条件を受ける入力・パラメータが不存在（根拠a） |
| 021 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 022 | EX-A | 「…含まれること」→同上（根拠a） |
| 023 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 024 | EX-A | 「…含まれること」→同上（根拠a） |
| 025 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 026 | EX-A | 「…含まれること」→同上（根拠a） |
| 027 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 028 | EX-A | 「…含まれること」→同上（根拠a） |
| 029 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 030 | EX-A | 「…含まれること」→同上（根拠a） |
| 031 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 032 | EX-A | 「…含まれること」→同上（根拠a） |
| 033 | EX-A | 「…含まれないこと」→同上（根拠a） |
| 088 | EX-C | 「入力JSONの対象レコードの値が変更されないこと」→JSON入力経路が不存在（根拠c）。なお一覧の非取得系（ディレクトリ一覧）はFS走査でありJSON入力でない |
| 090 | EX-C | 「スキーマのファイル出力内容…一致」→スキーマ（DB/JSON）が本機能に不存在（根拠b・c） |

**偽陰性防御と読み替えの明示**: 「取得結果に含まれる」系のうち検索条件を要しない行（034〜037・081・082・089）は一覧反映として**bound**へ回した（excludedに落としていない。082は読み替え=要確認を§8に明記）。「相関バリデーション」（013〜016）も入力×既存FS状態の相関として**bound**（m09-01のEX-B機械踏襲をしない=本機能には実在の相関検証があるため）。ただし**013〜016の各行は母集合前提の入力対象（ファイル選択欄／フォルダ作成欄／ディレクトリツリー／パンくず）とbind先の操作が一致しない「読み替えbound」であり、per-IDの明記は§8対応表の当該行に掲載**（期待文言優先の再解釈であることを隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 010/011（必須: 完了しない/継続） | 010=拒否側→C-036,C-026／011=成功側→C-020,C-035 | 取り違えなし（エラー行と成功行を別ケースへ） |
| 013〜016（相関: エラー/継続） | 013,016=拒否側／014,015=成功側 | 成功側は「相関条件に触れない入力での成功」へbind（C-020/C-035）。**4行とも母集合前提の入力対象と不一致の読み替えbound（§8にper-ID明記・R1是正）** |
| 038〜048（追加される/されない） | 039,044,046=否定側→C-024,C-032,C-029等（FS不変assert必須）／他=肯定側 | **048は前提（削除）と期待（追加される）が矛盾**→前提列は機械循環ノイズと判定し期待テキスト優先で肯定側C-020/C-035へbind（削除ケースへの誤bindを回避） |
| 050〜060（変更される/されない） | 051,056,058=否定側（FS/画面不変）／他=肯定側 | 057は「ツールチップ文言の変更」という画面値変更へbind（FS変更は発生しない機能のため） |
| 037（now_dir領域外なのに肯定「含まれる」） | エラーケースだが期待は肯定 | 「エラー表示＋既存一覧の維持（既存レコードは含まれ続ける）」として肯定側観測を明示（C-031手順3） |
| 082（移動・リネーム＋否定「含まれない」） | 本機能にファイル移動/リネーム不存在（md:96・FCにエンドポイント0） | 「フォルダ移動（カレント変更）後、旧カレントのエントリが一覧に含まれない」へ読み替えbind。読み替えである旨と**厳格には要確認/TBD候補である旨**を§8に明記（excluded偽陰性よりも観測可能な否定側実証を優先しつつ、原文どおりの機能検証でないことを隠さない） |
| 066（削除状態にならない） | 否定側 | C-060/C-058/C-061すべてにFS残存assertを明記 |
| 100（排除する=拒否側） | 拒否側だがファイル指定は実装が拒否を保証しない | 部分bound＋BC-DRAFT-M0902-02へ分離（「拒否される」と断定する期待を立てない） |
| 111（削除しない） | 否定側 | C-061はリダイレクトとFS差分0の両方をassert |

機械検査結果（工程6自己検査・実施済み）: §8参照ケースIDの§4実在=全一致／bound93+TBD0+excluded18=111=母集合件数一致／補完7行は親空で母集合会計外／oracle.json草案は本md§1から導出・claim数52一致。未検出の極性取り違えが残る可能性は否定しない（codex敵対レビューで検証されたい）。
