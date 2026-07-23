# PILOT: m09-01 新着情報管理 — 実行可能グレード完成見本

> 2026-07-23 ／ 状態: **pre-実行（環境停止中のため手順9=実行は未実施）**。改訂1: codex敵対レビュー
> （要修正・採用不可）の全数是正（出典誤り4件・過大主張・request契約・seed隔離・EN網羅・粒度）。
> 本書は E2E_ENABLEMENT_STRATEGY.md の手順1〜8を1機能ぶん実物化した**「実行可能グレード」のDoD見本**。
> 母体: `integration_test/e2e/m09_01_admin_content_content_news_e2e_cases.md`（読めるグレードの現状。上書きしない）。
>
> **グレードの正直な定義（codex是正）**: 本書が達成するのは**ケース表グレード**＝前提/入力/操作/期待が
> 実値で具体化され、**道具（M0成果物）が揃えば**そのまま単体判定できる粒度。
> **実行時実行可能性**は次のM0成果物の完成が前提であり、本書単体では「今すぐ実行可能」ではない:
> L1オラクル解決器＋外部化lint（D8）／三段参照ゲート（D9）／`e2e/helpers/db.ts`／
> M09-01 SEEDのmanifest契約（D5型・fixture_version発行）／直接request契約の共通ヘルパ。

## 0. 版固定（この見本の根拠が指す版）

- 設計書正本: `functions/ec-cube-enterprise/m09-01_admin_content_content_news.md`（本repo・コミット754a591時点）
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （locale yaml 4ファイルのSHA-256は戦略書§0.1のbaseline実測値と同一）
- **vendor翻訳（Symfony既定バリデータ文言）**: `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`
  ＝ **symfony/validator v7.4.3**（composer.lock記載のインストール版・実測）。版固定対象に含める。
- fixture_version: `SEED-M09-01-*@<manifest_sha1>` の manifest_sha1 は **TBD-D5**
  （manifest.jsonへのM09-01セット登録＝D5型SEED契約の成立後に確定。本書では `@TBD-D5` と表記）。
- 本機能は**カスタマイズ区分=標準**（設計書L11「挙動・DBともにec-cube-enterpriseの新着情報管理を正とする」）。
  source_class は `standard-src`（ee実ソース直接可）＋`設計書md`。
  pf-eccube3 に対応mdは存在しない（`functions/pf-eccube3/` に news 該当なし・実測）→ `pf現行回帰` は不適用。

母集合の位置づけ（実測）: M09-01 = 88行（Playwright 49 / Playwright+手動確認 37 / 非UI 2）、
聖域3行、観測層 GUI 49 / GUI+DB 36 / DB 1 / ログ 2（`all_it_cases.tsv`・`execution_assignment.tsv`）。

---

## 1. L1原子オラクル表

規約: claim は検査可能な期待実値まで分解（汎用文言禁止）。quote は一次資料の逐語。
`unit` は文字数系のみ必須（ee=PostgreSQL/Symfony Length＝**文字長**が正典）。
`LS` = locale_sensitive（1/0。0は理由コード必須）。**期待値の正は本表のオラクルIDであり、SEED値ではない**。

| oracle_id | 観点(claim_type) | claim（検査可能な期待） | source_class | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M0901-001 | auth_rule | 未ログインで本機能の各URL（一覧GET・編集GET・削除DELETE）へアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へリダイレクト**され、対象画面・処理へ到達しない。**観測範囲=一覧/編集/削除の3URL** | 設計書md＋standard-src | 「未ログイン（一般利用者）｜管理画面の共通認証により拒否」／`admin:`…`pattern: ['^/%eccube_admin_route%/',…]`…`form_login:`…`login_path: admin_login` | m09-01md:294／security.yaml:40-47 | — | 0 `non-translated` |
| L1-M0901-002 | http_status | 一覧URLは `GET /%eccube_admin_route%/content/news`（ページングは `/page/{page_no}`）でHTTP200 | standard-src | `#[Route(path: '/%eccube_admin_route%/content/news', name: 'admin_content_news', methods: ['GET'])]` | NewsController.php:46-47 | — | 0 `non-ui-observable` |
| L1-M0901-003 | display_field | 一覧は公開・非公開を問わず全件を「publish_date降順・同値はid降順」で表示。**全順序**（同時刻ペアの相対順だけでなく全行の順序）が投入データのソート結果と一致 | 設計書md＋standard-src | 「公開日時の降順を主、識別子の降順を従とする」／`->orderBy('n.publish_date', 'DESC')->addOrderBy('n.id', 'DESC')` | m09-01md:153／NewsRepository.php:77-78 | — | 0 `data-passthrough` |
| L1-M0901-004 | display_field | 一覧のページング単位は1ページ10件 | 設計書md＋standard-src | 「1ページ10件（既定ページ件数の確認値）」／`eccube_default_page_count: 10` | m09-01md:154／eccube.yaml:142 | — | 0 `data-passthrough` |
| L1-M0901-005 | display_field | 一覧見出し行に「公開日時」「公開状態」「タイトル」（ja）／"Published on"・"Display Status"・"Title"（en）を表示 | 設計書md＋standard-src | 「一覧見出し｜公開日時／公開状態／タイトル」／`admin.content.news.publish_date: 公開日時`・`Published on` | m09-01md:265／news.twig:40,44／messages.ja.yaml:2947-2951・messages.en.yaml:2634-2638 | — | 1 |
| L1-M0901-006 | display_field | 一覧0件時は見出し行のみ表示し明細行を出さない | 設計書md | 「0件なら見出し行のみ表示する」 | m09-01md:66,183 | — | 0 `data-passthrough` |
| L1-M0901-007 | display_field | 新規登録画面の公開日時初期値は「画面表示処理時点の現在日時」。**判定はブラケット法**: フォーム表示要求の直前T1・応答受領直後T2（いずれもDBサーバ時計 `SELECT now()` で取得・サーバtz）に対し T1≦初期値≦T2 | 設計書md＋standard-src | 「新規は現在日時」／`$News->setPublishDate(new \DateTime());` | m09-01md:155,165／NewsController.php:90-91 | — | 0 `data-passthrough` |
| L1-M0901-008 | display_field | 新規画面の公開状態は公開/非公開の2択で**初期選択は公開**。**根拠は設計書md:156を正とする**（News.php:71のDB default trueは参考情報であり初期選択の根拠にしない＝codex是正）。UI観測はこの仕様の検証に限定 | 設計書md | 「公開状態｜公開（保存値は真）／非公開（保存値は偽）の2択。新規の初期選択は公開（DB既定が真）」 | m09-01md:156 | — | 0 `data-passthrough`（選択肢**文言**はL1-020・LS=1） |
| L1-M0901-009 | http_status | 不存在識別子はHTTP404。**観測範囲=編集GET・削除DELETEの両URL**（新規相当の扱いにならない） | 設計書md＋standard-src | 「編集対象の識別子が存在しない｜見つからない扱い（HTTP404）」「削除対象の識別子が存在しない｜見つからない扱い（HTTP404）」／`throw new NotFoundHttpException();` | m09-01md:178-179,329／NewsController.php:86-88 | — | 0 `non-ui-observable` |
| L1-M0901-010 | validation_rule | **タイトル**は必須（NotBlank）。サーバ層エラーメッセージ ja「入力されていません。」／en "No value found." | standard-src＋設計書md | `new Assert\NotBlank(),`／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | NewsType.php:59／m09-01md:249／validators.ja.yaml:17・validators.en.yaml:17 | — | 1 |
| L1-M0901-011 | validation_rule | タイトルの最大長はForm層200**文字**（`eccube_mtext_len`）。200受理・201拒否 | standard-src＋設計書md | `new Assert\Length(['max' => $this->eccubeConfig['eccube_mtext_len']]),`／`eccube_mtext_len: 200`／「最大200文字」 | NewsType.php:60／eccube.yaml:118／m09-01md:166,249 | **文字** | 0 `non-translated`（超過時の**文言**はL1-012・LS=1） |
| L1-M0901-012 | message | Length超過時のエラー文言（Symfony既定カタログ・**choice形式**＝codex是正）。**カタログ原文（逐語）**: source=`This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.`。**ja target（choiceなし・単一形）**=`長すぎます。この値は{{ limit }}文字以下で入力してください。`。**en target（choice形式）**=`This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.`。**解決規則**: Symfony Translatorの複数形選択はCLDR準拠＝jaは複数区別なし（常に単一target）、enは one/other で limit=200/3000→other→**複数側 "characters"** が選択される。**解決後の期待実値**: ja「長すぎます。この値は200文字以下で入力してください。」（3000境界では200→3000）／en "This value is too long. It should have 200 characters or less."（同3000） | standard-src（vendor翻訳 symfony/validator **v7.4.3**）＋設計書md | 上記choice原文＋ja/en target（trans-unit id=19） | m09-01md:255,278／**vendor/symfony/validator/Resources/translations/validators.ja.xlf:78-79・validators.en.xlf:78-79** | — | 1 |
| L1-M0901-013 | db_effect | タイトルのDB列 `dtb_news.title` は STRING **255文字**（Form200<DB255の段差が実在。Form層通過値は常にDB制約内） | standard-src＋設計書md | `#[ORM\Column(name: 'title', type: Types::STRING, length: 255)]`／「DB列は255文字だが、フォーム検証は200文字」 | News.php:47／m09-01md:166,224 | **文字** | 0 `non-ui-observable` |
| L1-M0901-014 | db_effect | Form受理された入力タイトルはそのままDBへ保存される（恒等写像。設計書: 保存先`dtb_news.title`） | 設計書md | 「タイトル｜必須｜200文字｜…｜`dtb_news.title`」（入力項目表＝入力値の保存先明記） | m09-01md:166 | 文字 | 0 `data-passthrough` |
| L1-M0901-015 | validation_rule | URLは**任意**（NotBlank無し・required:false）。未入力でも保存できる | standard-src＋設計書md | `'required' => false,`（constraints に NotBlank 不在）／「URL｜任意」 | NewsType.php:63-68／m09-01md:167,250 | — | 0 `non-translated` |
| L1-M0901-016 | validation_rule | URL入力時はURL形式制約。違反時 ja「有効なURLではありません。」／en "This value is not a valid URL." | standard-src＋設計書md | `new Assert\Url(),`／ja target=`有効なURLではありません。`・en target=`This value is not a valid URL.`（trans-unit id=27） | NewsType.php:66／m09-01md:250／**vendor/symfony/validator/Resources/translations/validators.ja.xlf:110-111・validators.en.xlf:110-111** | — | 1 |
| L1-M0901-017 | validation_rule | URLの最大長はForm層200**文字**（mtext_len）。DB列 `dtb_news.url` は4000文字（Form200<DB4000の段差） | standard-src＋設計書md | `new Assert\Length(['max' => $this->eccubeConfig['eccube_mtext_len']]),`／`#[ORM\Column(name: 'url', type: Types::STRING, length: 4000, nullable: true)]`／「DB列は4000文字。…フォーム検証は200文字」 | NewsType.php:67／News.php:53／m09-01md:167,226 | **文字** | 0 `non-translated` |
| L1-M0901-018 | validation_rule | 本文は任意・最大3000**文字**（`eccube_ltext_len`）。DB列はTEXT（**長さ制約の記載なし＝「制約なし」とは断定しない**） | standard-src＋設計書md | `new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),`／`eccube_ltext_len: 3000`／`type: Types::TEXT, nullable: true` | NewsType.php:82／eccube.yaml:114／News.php:50／m09-01md:169,252 | **文字** | 0 `non-translated` |
| L1-M0901-019 | validation_rule | 公開日時の下限は 0003-01-01（未満は拒否）。違反文言 ja「不正な日付です。」／en "Invalid DateTime." | standard-src＋設計書md | `new Assert\Range(['min' => '0003-01-01', 'minMessage' => 'form_error.out_of_range',])`／`form_error.out_of_range: 不正な日付です。`／`form_error.out_of_range: Invalid DateTime.` | NewsType.php:50-53／m09-01md:165,248,277／validators.ja.yaml:60・validators.en.yaml:47 | — | 1 |
| L1-M0901-020 | display_field(文言) | 公開状態の選択肢文言 ja「公開」「非公開」／en "Displayed"・"Hidden"（編集画面の選択肢・一覧の各行表示の両方） | standard-src＋設計書md | `'choices' => ['admin.content.news.display_status__show' => true, 'admin.content.news.display_status__hide' => false],`／`公開`・`非公開`／`Displayed`・`Hidden` | NewsType.php:87／m09-01md:266／messages.ja.yaml:2949-2950・messages.en.yaml:2636-2637／news.twig:52 | — | 1 |
| L1-M0901-021 | db_effect | URL未入力（空）で保存すると「別ウィンドウで開く」は保存直前に偽へ揃えられ `dtb_news.link_method=false` で保存される | 設計書md＋standard-src | 「リンクURLが空の場合、保存直前に『別ウィンドウで開く』を無効（偽）へ揃える」／`if (!$News->getUrl()) { $News->setLinkMethod(false); }` | m09-01md:157,181／NewsController.php:110-112 | — | 0 `non-ui-observable` |
| L1-M0901-022 | db_effect | 公開状態は公開=true／非公開=false を `dtb_news.visible` へ保存 | 設計書md | 「`dtb_news.visible`。公開で真、非公開で偽を保存する」 | m09-01md:170,228 | — | 0 `non-ui-observable` |
| L1-M0901-023 | message | 登録・編集の保存成功時フラッシュ ja「保存しました」／en "Saved"（キー`admin.common.save_complete`） | 設計書md＋standard-src | 「保存しました｜登録・編集の保存成功時｜キー`admin.common.save_complete`」／`admin.common.save_complete: 保存しました`／`Saved` | m09-01md:284／NewsController.php:124／messages.ja.yaml:1591・messages.en.yaml:1636 | — | 1 |
| L1-M0901-024 | status_transition | 保存成功時は当該新着情報の編集画面（識別子付き `/content/news/{id}/edit`）へリダイレクト | 設計書md＋standard-src | 「編集で登録に成功｜当該新着情報の編集画面（識別子付き）」／`return $this->redirectToRoute('admin_content_news_edit', ['id' => $News->getId()]);` | m09-01md:309／NewsController.php:129 | — | 0 `non-translated` |
| L1-M0901-025 | status_transition | 検証失敗時は同一編集画面に留まり、成功メッセージは積まない | 設計書md | 「検証失敗時、同一編集テンプレートを再描画する。成功メッセージは積まない」 | m09-01md:129-130,310 | — | 0 `non-ui-observable` |
| L1-M0901-026 | message | 削除確認モーダル 見出し ja「削除します」／en "Delete"、本文 ja「この操作はあとから取り消すことができません。「（対象タイトル）」を削除してよろしいですか？」／en "You can not revert this action. Are you sure to delete %name%?"（%name%=対象タイトル差込） | 設計書md＋standard-src | 「削除します」「この操作はあとから取り消すことができません。…」／`admin.common.delete_modal__title: 削除します`・`delete_modal__message:"この操作は…"` | m09-01md:267-268／news.twig:79,86／messages.ja.yaml:1785-1786・messages.en.yaml:1793-1794 | — | 1 |
| L1-M0901-027 | message | 削除成功時フラッシュ ja「削除しました」／en "Deleted"、遷移先は一覧 | 設計書md＋standard-src | 「削除しました｜削除成功時｜キー`admin.common.delete_complete`」／`admin.common.delete_complete: 削除しました`・`Deleted`／`redirectToRoute('admin_content_news')` | m09-01md:285,312／NewsController.php:154,167／messages.ja.yaml:1593・messages.en.yaml:1638 | — | 1 |
| L1-M0901-028 | db_effect | 削除成功時、対象行はentity remove＋flushにより `dtb_news` から物理削除される（削除失敗時は物理削除は完了しない） | standard-src＋設計書md | `public function delete($News): void { $em = $this->getEntityManager(); $em->remove($News); $em->flush(); }`／「物理削除は完了しない」（失敗時） | **NewsRepository.php:67-72**／m09-01md:180,212 | — | 0 `non-ui-observable` |
| L1-M0901-029 | message | 削除中に例外（関連データ存在等）発生時 ja「関連するデータがあるため「（対象タイトル）」を削除できませんでした」／en "Sorry, we are unable to delete %name%, because it has related data." を積み一覧へ | 設計書md＋standard-src | 「関連するデータがあるため『（対象タイトル）』を削除できませんでした」／`admin.common.delete_error_foreign_key: "関連するデータがあるため「%name%」を削除できませんでした"`／`trans('admin.common.delete_error_foreign_key', ['%name%' => $News->getTitle()])` | m09-01md:286,331／NewsController.php:160-162／messages.ja.yaml:1595・messages.en.yaml:1642 | — | 1 |
| L1-M0901-030 | auth_rule | 削除はCSRFトークン検証を伴い、不正時は `AccessDeniedHttpException('CSRF token is invalid.')`（HTTP403系のアクセス拒否）。トークンのパラメータ名は `_token`（`Constant::TOKEN_NAME`）またはヘッダ `ECCUBE-CSRF-TOKEN` | 設計書md＋standard-src | 「なりすまし対策トークン不正（削除）｜アクセス拒否（HTTP例外）」／`$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN'); if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) { throw new AccessDeniedHttpException('CSRF token is invalid.'); }`／`public const TOKEN_NAME = '_token';` | m09-01md:330／NewsController.php:144／AbstractController.php:252-263／Constant.php:41 | — | 0 `non-ui-observable` |
| L1-M0901-031 | display_field(文言) | 編集画面ツールチップ URL ja「この新着情報の詳細な内容を記したウェブページある場合、URLを入力します。外部サイトのURLなどを利用することもできます。」／en "If there is a page which provides the details of this news, enter its URL. You can also enter external URLs."、本文 ja「HTMLタグが利用可能です。」／en "You can use HTML tags." | 設計書md＋standard-src | （設計書 表示メッセージ表の逐語）／`tooltip.content.news.url: この新着情報の…`・`tooltip.content.news.body: HTMLタグが利用可能です。` | m09-01md:269-270／news_edit.twig:68,88／messages.ja.yaml:3633-3634・messages.en.yaml:3246-3247 | — | 1 |
| L1-M0901-032 | 非UI(ログ) | 削除開始時・完了時に対象識別子を含むログ、失敗時に識別子と例外情報を含むエラーログを出力 | 設計書md＋standard-src | 「削除開始時｜対象の識別子を含む削除開始ログ」／`log_info('新着情報削除開始', [$News->getId()]);` | m09-01md:345-347／NewsController.php:146,156,164 | — | 0 `non-ui-observable` |
| L1-M0901-033 | **TBD** | 本文のHTML浄化（purify）の**具体除去規則**は正本に規定がない（「一部の記述は除去・整形される」のみ）→ 具体オラクル化不能。**未確定オラクル台帳へ**（浄化規則の仕様確定待ち。「何が除去されるか」を捏造しない） | 設計書md | 「HTMLタグの利用は可能だが、浄化により一部の記述は除去・整形される」／`'purify_html' => true,` | m09-01md:158／NewsType.php:77 | — | — |
| L1-M0901-034 | validation_rule | **公開日時**は必須（NotBlank・タイトルとは別項目の独立claim＝codex是正）。サーバ層エラーメッセージ ja「入力されていません。」／en "No value found."（カタログkeyはL1-010と同一だが項目別オラクル） | standard-src＋設計書md | `new Assert\NotBlank(),`（publish_date側）／`This value should not be blank.: 入力されていません。`・`No value found.` | NewsType.php:49／m09-01md:165,248／validators.ja.yaml:17・validators.en.yaml:17 | — | 1 |

**観測層の指定（文字数・必須系claimの必須付記）**:
- L1-M0901-010/034（必須）: title は `required: true`（NewsType.php:57）、DateTimeType既定requiredのため
  **第一観測層=HTML5（valueMissing。ブラウザが送信前ブロック）**。サーバ層NotBlankメッセージ（ja/en文言）の
  観測は**HTML5をバイパスした直接POST（§6.1のrequest契約）**で行う（m01-01実績の教訓）。両層を別ケースにする。
- L1-M0901-011/017/018（最大長）: Form層Lengthはサーバ検証（`maxlength`属性の出力有無はtwig未確認=要実機）。
  観測層=**サーバ検証エラー文言（L1-012）＋保存不成立**。DB層はdb.tsで保存後の文字長を検証。

---

## 2. SEEDセット設計（fixture。**期待値の正はL1オラクルID＝三段参照**）

三段参照: `L1恒等写像claim（passthrough_basis=設計書md入力項目表:166-170） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。
下表の固定値は**入力の再現手段**であり、期待値の正にしない。ID帯: 既存規約（固定IDバンド・UPSERT・
seed_resync・.down.sql）。**id-bands.mdへの登録と帯衝突検査はD5型SEED契約に従う（`@TBD-D5`）**。

| SEEDセットID | 目的 | 固定値（dtb_news） | 後始末 |
|---|---|---|---|
| SEED-M09-01-LIST | 一覧表示・並び順・ページング | 11件: id=900000301..900000311。publish_date は 2026-07-01 10:00:00 から1日刻みで既知（サーバtz）。**id=900000310/900000311 は同一publish_date（2026-07-10 10:00:00）**＝識別子降順の従キー検証用。visible は公開8件/非公開3件混在（管理一覧は全件表示=L1-003）。title=`PILOT一覧{連番}` | .down.sql（帯内delete） |
| SEED-M09-01-EDIT | 編集初期表示・更新系 | 1件: id=900000320, publish_date=2026-07-15 09:30:00, title=`PILOT編集対象`, url=`https://example.com/pilot-edit`, link_method=true, description=`PILOT本文`, visible=true | 更新系ケース後に同値へ再適用（UPSERTべき等） |
| SEED-M09-01-DELETE | 削除成功 | 1件: id=900000321, title=`PILOT削除対象`, visible=false（他テーブルから参照されない独立行） | 削除されるため再適用で復元 |
| SEED-M09-01-NONE | 404誘発 | データ無し。id=900000999 を**存在させない**（帯内予約・投入しない） | 不要 |
| SEED-M09-01-EMPTY | 一覧0件（L1-006） | `dtb_news` 全行退避が必要＝**フレッシュDB専用手順**（共有環境では実行しない。前提特殊） | スナップショット復元 |
| SEED-M09-01-FKREF | 削除失敗（L1-029） | **TBD-要実機**: `dtb_news.id` を参照するFK列は ee実ソース（Entity走査）で確認できず、`delete_error_foreign_key` の実誘発手段は現時点で根拠なし。**捏造せず要実機確認** | — |

### 2.1 作成行の隔離・一意特定・cleanup（codex是正）

- **ページング/並び順（012/011）は「既存件数の除外集計」を廃止**（一覧は全dtb_newsをページングするため
  除外は不可能）。前提を**フレッシュDBまたは全件統制SEED**（dtb_newsの全行がSEED-M09-01-LISTのみ）とする。
  共有環境ではこの2ケースは実行しない（前提特殊としてskip・理由記録）。
- **新規作成系（032/034/037/040/041等）の作成行の一意特定**は2段構え:
  1. **主特定=保存成功時のリダイレクトURL** `/content/news/{id}/edit` から id を取得し、db.ts照会・
     afterEach削除は**このid指定**で行う（決定的）。
  2. **安全網=run-id prefix**: 境界値でないフィールドには `E2E-<runid>-` prefix（runid=実行ごとの一意値）を
     含め、afterEachの取りこぼし時に prefix 検索で残骸を掃除する。
     **境界長フィールド自体**は `runFill(n, repertoire, prefix)`＝`prefix + charFill(n-len(prefix), repertoire)`
     （**合計ちょうどn文字**）で生成し、境界の文字数を汚さずに一意性を確保する。
     旧 `charFill(10,ascii)` 検索（誤検出源）は廃止。

---

## 3. 画面項目マトリクス（項目×制約種別。**各セル=個別アサーション**）

三値比較: 設計書md（入力項目表:165-170）／ee Form（NewsType.php）／ee DB（News.php）。
pf は本機能に対応実装なし（§0）＝比較対象外。**段差はFormとDBの層間**に実在する。

| 項目 | 任意/必須（アサーション） | 最大文字数（Form層/DB層・unit=文字） | メッセージ（ja/en・L1参照） |
|---|---|---|---|
| 公開日時 | **必須**（md:165=Form NotBlank:49 一致）。HTML5層+サーバ層の2アサーション（**項目別claim=L1-034**） | —（日時。下限0003-01-01=Range:50-53） | 空: L1-034文言／下限: L1-019「不正な日付です。」/"Invalid DateTime." |
| タイトル | **必須**（md:166=NotBlank:59 一致）。2層（L1-010） | **Form 200**（:60+yaml:118）**／DB 255**（News:47）→ **段差55文字**: 201..255字はFormで拒否されDBに到達しない（201字拒否アサーションが段差の実証）。境界3種: `runFill(200,ascii,prefix)`受理／`runFill(201,ascii,prefix)`拒否／`runFill(200,mixed,prefix)`受理＋**DB保存後の文字長=200**（mixed主体=「あ」等3バイト字→UTF-8バイト長は200超でも**文字長200でPG保存成功**＝文字長意味論の実証） | 超過: L1-012／空: L1-010 |
| URL | **任意**（md:167=required:false:64・NotBlank無し）。「空で保存成功」を正のアサーションで実証 | **Form 200**（:67）**／DB 4000**（News:53）→段差3800文字。境界: 200字URL受理／201字拒否 | 形式: L1-016「有効なURLではありません。」/"This value is not a valid URL."／超過: L1-012 |
| 別ウィンドウで開く | 任意（checkbox:70-74）。**URL空→保存直前false**（L1-021）はDB層アサーション | —（boolean） | —（ラベル文言=messages ja:2955/en:2642・LS=1） |
| 本文 | 任意（required:false:76） | **Form 3000**（:82+yaml:114）**／DB TEXT**＝長さ制約の**記載なし（「制約なし」と断定しない**＝委譲型の証明不能）。境界: 3000受理／3001拒否／`runFill(3000,mixed,prefix)`受理+DB文字長3000 | 超過: L1-012。浄化規則はL1-033=TBD |
| 公開状態 | **必須**（md:170=required:88） | —（boolean。公開=true/非公開=false=L1-022） | 選択肢文言: L1-020（LS=1） |

---

## 4. 実行可能グレード14列具体TSV（ケース表グレード＝道具完成後に判定可能）

記法: 期待結果セルは **三段参照** `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
境界値は決定的生成 `runFill(n, repertoire, prefix)`（§2.1。NFC）。enケース（LS=1のみ）はテストID末尾
`-EN`・前提条件に `locale=en`。直接POST/DELETE行は §6.1 のrequest契約に従う。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタは page object（§6）のtwig由来値。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-01_admin_content_content_news	E2E-M0901X-001	IT-15	権限	P1	未ログインで一覧URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/content/news	admin_login のログイン画面へリダイレクトされ一覧は表示されない [L1:L1-M0901-001]				
m09-01_admin_content_content_news	E2E-M0901X-002	IT-15	権限	P1	未ログインで編集URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/content/news/900000320/edit	admin_login のログイン画面へリダイレクトされる [L1:L1-M0901-001]				
m09-01_admin_content_content_news	E2E-M0901X-003	IT-15	権限	P2	未ログインで削除URLへDELETE→到達せずログインへ	未ログイン（cookie無しrequest）／SEED-M09-01-DELETE	DELETE /content/news/900000321/delete（§6.1契約・cookie無し）	1. 認証cookie無しでDELETE送信 2. 応答とDBを確認	削除処理へ到達せず admin_login へのリダイレクト応答・行は削除されない [L1:L1-M0901-001,L1-M0901-028]				
m09-01_admin_content_content_news	E2E-M0901X-010	IT-25	UI部品	P2	一覧見出しが公開日時・公開状態・タイトル（ja）	ログイン済(SEED-M01-ADMIN)／SEED-M09-01-LIST	—	1. 一覧を開く 2. 見出し行(li.list-group-item内strong)を読む	HTTP200かつ見出しに「公開日時」「公開状態」「タイトル」が存在 [L1:L1-M0901-005,L1-M0901-002]				
m09-01_admin_content_content_news	E2E-M0901X-010-EN	IT-25	UI部品	P2	一覧見出し（en）	ログイン済／SEED-M09-01-LIST／locale=en	—	1. en UIで一覧を開く 2. 見出し行を読む	見出しに "Published on"・"Display Status"・"Title" が存在 [L1:L1-M0901-005]				
m09-01_admin_content_content_news	E2E-M0901X-011	IT-23	表示順	P1	一覧の全順序が publish_date降順・同値id降順	ログイン済／SEED-M09-01-LIST／**dtb_newsが本SEEDのみ**（フレッシュDBまたは全件統制）	—	1. 一覧を開く（2ページ目まで） 2. 全明細行の data-id（li.sortable-item[data-id]）を文書順に取得	取得したid列が、SEED-M09-01-LIST投入表を (publish_date DESC, id DESC) でソートした期待id列と**全順序で完全一致**（配列equal。900000311が900000310より先=同時刻の従キー検証を含む） [L1:L1-M0901-003; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-012	IT-23	ページング	P2	1ページ10件で2ページ目に残り1件	ログイン済／SEED-M09-01-LIST(11件)／**dtb_newsが本SEEDのみ**（フレッシュDBまたは全件統制。共有環境では実行しない）	—	1. 一覧を開き明細行数を数える 2. /content/news/page/2 を開き明細行数を数える	1ページ目=10件・2ページ目=1件 [L1:L1-M0901-004; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-013	IT-25	表示	P3	一覧0件で見出し行のみ・明細行0	ログイン済／SEED-M09-01-EMPTY(フレッシュDB専用)	—	1. 一覧を開く 2. li.sortable-item件数を数える	見出し行のみ表示・明細行0件 [L1:L1-M0901-006]（前提特殊: 共有環境で実行しない）				
m09-01_admin_content_content_news	E2E-M0901X-020	IT-13	初期値	P2	新規画面の公開日時初期値=現在日時（ブラケット判定）	ログイン済	—	1. db.tsで T1=SELECT now() を取得 2. /content/news/new を開く 3. db.tsで T2=SELECT now() を取得 4. #admin_news_publish_date のvalue（形式 yyyy-MM-ddTHH:mm:ss・サーバtz）を読む	初期値vをサーバtzの日時として解釈し T1≦v≦T2 [L1:L1-M0901-007]				
m09-01_admin_content_content_news	E2E-M0901X-021	IT-13	初期値	P2	新規画面の公開状態初期選択=公開（設計書md:156が根拠）	ログイン済	—	1. /content/news/new を開く 2. #admin_news_visible の選択値を読む	選択値がtrue側（=「公開」。表示文言の照合はL1-020） [L1:L1-M0901-008]				
m09-01_admin_content_content_news	E2E-M0901X-022	IT-25	初期表示	P1	編集画面に既存値が表示される	ログイン済／SEED-M09-01-EDIT	—	1. /content/news/900000320/edit を開く 2. 各フォーム値を読む	title/url/description/link_method/visible/publish_dateがSEED-M09-01-EDIT投入値と一致（恒等写像） [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-023	IT-13	異常系	P2	不存在idの編集URL→HTTP404	ログイン済／SEED-M09-01-NONE	id=900000999	1. GET /content/news/900000999/edit	HTTP404 [L1:L1-M0901-009]				
m09-01_admin_content_content_news	E2E-M0901X-024	IT-13	異常系	P2	不存在idの削除DELETE→HTTP404	ログイン済／SEED-M09-01-NONE	DELETE /content/news/900000999/delete（§6.1契約・正規_token付き）	1. §6.1手順で正規tokenを取得しDELETE送信	HTTP404 [L1:L1-M0901-009]				
m09-01_admin_content_content_news	E2E-M0901X-030	IT-22	必須	P1	タイトル空はHTML5層で送信ブロック	ログイン済	title=空・他は有効値	1. 新規画面で登録押下 2. #admin_news_title のvalidity.valueMissingを読む	送信されず valueMissing=true（フォームは同一画面のまま） [L1:L1-M0901-010(HTML5層)]				
m09-01_admin_content_content_news	E2E-M0901X-031	IT-22	必須	P1	タイトル空のサーバ検証メッセージ（ja）	ログイン済	title=空（admin_news[title]=""）を§6.1契約で直接POST	1. §6.1手順でPOST /content/news/new 2. 応答HTMLを読む	保存されず応答に「入力されていません。」が含まれ成功フラッシュ無し [L1:L1-M0901-010(サーバ層),L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-031-EN	IT-22	必須	P2	タイトル空のサーバ検証メッセージ（en）	ログイン済／locale=en	同上	同上	応答に "No value found." が含まれる [L1:L1-M0901-010]				
m09-01_admin_content_content_news	E2E-M0901X-032	IT-22	最大長	P1	タイトル200字(ascii)が受理されDBへ保存	ログイン済	title=runFill(200,ascii,"E2E-<runid>-")・他有効値	1. 新規登録を送信 2. フラッシュ確認 3. リダイレクトURLからid取得 4. db.tsで当該idの char_length(title) を照会（afterEach: 当該id削除）	保存成功（「保存しました」）＋/content/news/{id}/edit へ遷移＋DB文字長=200 [L1:L1-M0901-011,L1-M0901-013,L1-M0901-014,L1-M0901-023,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901X-033	IT-22	最大長	P1	タイトル201字(ascii)がForm層で拒否（Form200/DB255段差の実証）	ログイン済	title=runFill(201,ascii,"E2E-<runid>-")	1. 新規登録を送信 2. エラー表示を読む 3. db.tsで prefix "E2E-<runid>-" のtitle行が無いことを照会	保存されず「長すぎます。この値は200文字以下で入力してください。」表示・DB未到達（201≦255でもFormが拒否） [L1:L1-M0901-011,L1-M0901-012,L1-M0901-013,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-033-EN	IT-22	最大長	P2	タイトル201字拒否メッセージ（en）	ログイン済／locale=en	title=runFill(201,ascii,"E2E-<runid>-")	同上	"This value is too long. It should have 200 characters or less." 表示 [L1:L1-M0901-012]				
m09-01_admin_content_content_news	E2E-M0901X-034	IT-22	最大長	P1	タイトル200字マルチバイト混在が受理（文字長意味論）	ログイン済	title=runFill(200,mixed,"E2E-<runid>-")（「あ」主体・UTF-8バイト長>200）	1. 新規登録を送信 2. リダイレクトURLからid取得 3. db.tsで char_length(title)=200 を照会（afterEach: 当該id削除）	保存成功＋DB文字長=200（バイト長でなく文字長で判定される） [L1:L1-M0901-011,L1-M0901-013,L1-M0901-014]				
m09-01_admin_content_content_news	E2E-M0901X-035	IT-22	必須	P2	公開日時空はHTML5層でブロック／サーバ層メッセージ（ja）	ログイン済	publish_date=空（admin_news[publish_date]=""）	1. HTML5層: validity.valueMissing確認 2. サーバ層: §6.1契約で直接POST	HTML5層valueMissing=true／サーバ応答に「入力されていません。」（publish_date欄のエラーとして） [L1:L1-M0901-034]				
m09-01_admin_content_content_news	E2E-M0901X-035-EN	IT-22	必須	P2	公開日時空のサーバ検証メッセージ（en）	ログイン済／locale=en	同上（サーバ層のみ）	1. §6.1契約で直接POST 2. 応答を読む	応答に "No value found." が含まれる（publish_date欄） [L1:L1-M0901-034]				
m09-01_admin_content_content_news	E2E-M0901X-036	IT-22	境界	P1	公開日時0002-12-31は不正日付（ja）	ログイン済	publish_date=0002-12-31T23:59:59	1. 登録送信 2. エラー表示を読む	保存されず「不正な日付です。」表示 [L1:L1-M0901-019,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-036-EN	IT-22	境界	P2	公開日時下限違反（en）	ログイン済／locale=en	同上	同上	"Invalid DateTime." 表示 [L1:L1-M0901-019]				
m09-01_admin_content_content_news	E2E-M0901X-037	IT-22	任意	P1	URL空で保存成功（任意の実証）	ログイン済	url=空・title=`E2E-<runid>-URL任意`等有効値	1. 登録送信 2. フラッシュと遷移を確認（afterEach: リダイレクトid削除）	保存成功＋編集画面へ遷移（URL未入力が拒否されない） [L1:L1-M0901-015,L1-M0901-023,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901X-038	IT-22	形式	P1	URL形式不正が拒否される（ja）	ログイン済	url=not-a-url	1. 登録送信 2. エラー表示を読む	保存されず「有効なURLではありません。」表示 [L1:L1-M0901-016,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-038-EN	IT-22	形式	P2	URL形式不正（en）	ログイン済／locale=en	url=not-a-url	同上	"This value is not a valid URL." 表示 [L1:L1-M0901-016]				
m09-01_admin_content_content_news	E2E-M0901X-039	IT-22	最大長	P2	URL200字受理・201字拒否（Form200/DB4000段差）	ログイン済	url200=`https://example.com/`+`a`×180（200字）／url201=`https://example.com/`+`a`×181（201字）	1. 200字で登録送信→成功確認（afterEach: リダイレクトid削除） 2. 201字で送信→エラー確認	200字は保存成功・201字は保存されず「長すぎます。この値は200文字以下で入力してください。」表示でDB未到達 [L1:L1-M0901-017,L1-M0901-012]				
m09-01_admin_content_content_news	E2E-M0901X-040	IT-22	最大長	P2	本文3000字受理・3001字拒否	ログイン済	description=runFill(3000,mixed,"E2E-<runid>-")／runFill(3001,ascii,"E2E-<runid>-")・title=`E2E-<runid>-本文境界`	1. 3000字で登録送信→成功+リダイレクトid取得+db.tsでchar_length(description)=3000 2. 3001字で送信→エラー（afterEach: id削除）	3000字は保存成功（DB文字長3000）・3001字は保存されず「長すぎます。この値は3000文字以下で入力してください。」表示 [L1:L1-M0901-018,L1-M0901-012]（浄化対象を含まないプレーン文字列=L1-033のTBDを回避）				
m09-01_admin_content_content_news	E2E-M0901X-041	IT-22	整合	P1	URL空+別ウィンドウチェックONで保存→link_method=false（DB層）	ログイン済	url=空・link_method=ON・title=`E2E-<runid>-整合`等	1. 登録送信 2. リダイレクトURLからid取得 3. db.tsで当該idのlink_methodを照会（afterEach: id削除）	保存成功かつ dtb_news.link_method=false（保存直前に偽へ上書き） [L1:L1-M0901-021]				
m09-01_admin_content_content_news	E2E-M0901X-042	IT-26	保存	P1	非公開を選択して保存→visible=false＋一覧表示「非公開」	ログイン済／SEED-M09-01-EDIT	visible=非公開	1. 編集画面(900000320)で非公開を選択し登録 2. db.tsでvisible照会 3. 一覧の当該行(li.sortable-item[data-id="900000320"])の公開状態文言を読む	dtb_news.visible=false かつ一覧当該行に「非公開」 [L1:L1-M0901-022,L1-M0901-020; fixture:SEED-M09-01-EDIT@TBD-D5]（実行後SEED再適用で復元）				
m09-01_admin_content_content_news	E2E-M0901X-042-EN	IT-26	保存	P2	非公開の一覧表示文言（en）	ログイン済／SEED-M09-01-EDIT(visible=false状態)／locale=en	—	1. en UIで一覧を開く 2. 当該行(data-id="900000320")の公開状態文言を読む	当該行に "Hidden"（公開行には "Displayed"） [L1:L1-M0901-020]				
m09-01_admin_content_content_news	E2E-M0901X-043	IT-26	保存成功	P1	保存成功フラッシュと編集画面遷移（ja）	ログイン済／SEED-M09-01-EDIT	有効値一式	1. 編集画面で登録押下 2. 遷移先URLとフラッシュを読む	「保存しました」表示＋ /content/news/900000320/edit へ遷移 [L1:L1-M0901-023,L1-M0901-024; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-043-EN	IT-26	保存成功	P2	保存成功フラッシュ（en）	ログイン済／SEED-M09-01-EDIT／locale=en	有効値一式	同上	"Saved" 表示 [L1:L1-M0901-023]				
m09-01_admin_content_content_news	E2E-M0901X-050	IT-03	モーダル	P1	削除モーダルの見出しと対象タイトル差込（ja）	ログイン済／SEED-M09-01-DELETE	—	1. 一覧で id=900000321 行の削除アイコン(a[data-bs-target="#delete_900000321"])押下 2. **#delete_900000321 内の** h5.modal-title と .modal-body p を読む	見出し「削除します」・本文「この操作はあとから取り消すことができません。「PILOT削除対象」を削除してよろしいですか？」 [L1:L1-M0901-026; fixture:SEED-M09-01-DELETE@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-050-EN	IT-03	モーダル	P2	削除モーダル（en）	ログイン済／SEED-M09-01-DELETE／locale=en	—	同上	見出し "Delete"・本文 "You can not revert this action. Are you sure to delete PILOT削除対象?" [L1:L1-M0901-026]				
m09-01_admin_content_content_news	E2E-M0901X-051	IT-26	削除成功	P1	削除実行で成功フラッシュ・一覧遷移・DB行削除（ja）	ログイン済／SEED-M09-01-DELETE	—	1. モーダル(#delete_900000321)内の削除実行(a.btn-ec-delete)押下 2. 遷移とフラッシュを読む 3. db.tsで id=900000321 の不存在を照会	「削除しました」＋一覧へ遷移＋dtb_newsに id=900000321 が存在しない [L1:L1-M0901-027,L1-M0901-028; fixture:SEED-M09-01-DELETE@TBD-D5]（実行後SEED再適用で復元）				
m09-01_admin_content_content_news	E2E-M0901X-051-EN	IT-26	削除成功	P2	削除成功フラッシュ（en）	ログイン済／SEED-M09-01-DELETE（再適用後）／locale=en	—	同上	"Deleted" 表示＋一覧へ遷移 [L1:L1-M0901-027]				
m09-01_admin_content_content_news	E2E-M0901X-052	IT-03	CSRF	P2	トークン不正のDELETEはアクセス拒否（非UI）	ログイン済セッション（同一BrowserContextのcookie）／SEED-M09-01-DELETE	§6.1契約: 正規tokenの**末尾1文字を別の英数字へ置換**した改変値を `_token` パラメータで DELETE /content/news/900000321/delete へ送信	1. §6.1手順で改変tokenのDELETE送信 2. 応答とDBを確認	HTTP403（`AccessDeniedHttpException('CSRF token is invalid.')`）かつ行が削除されない [L1:L1-M0901-030,L1-M0901-028]				
m09-01_admin_content_content_news	E2E-M0901X-053	IT-26	削除失敗	P3	関連データ存在時の削除失敗メッセージ	SEED-M09-01-FKREF(**TBD-要実機**)	—	（FK誘発手段確定後）	「関連するデータがあるため「（対象タイトル）」を削除できませんでした」＋一覧遷移＋行残存 [L1:L1-M0901-029,L1-M0901-028]（**実行可能グレード対象外=fixme相当。理由: FK誘発根拠なし**）				
m09-01_admin_content_content_news	E2E-M0901X-054	IT-25	ツールチップ	P3	URL/本文ツールチップ文言（ja）	ログイン済	—	1. 編集画面のURL入力行の div[data-bs-toggle="tooltip"]（news_edit.twig:68のURL見出しブロック）の title属性を読む 2. 本文入力行（同:88）も同様	title属性がL1-031のja逐語と完全一致 [L1:L1-M0901-031]				
m09-01_admin_content_content_news	E2E-M0901X-054-EN	IT-25	ツールチップ	P3	ツールチップ文言（en）	ログイン済／locale=en	—	同上	title属性がL1-031のen逐語と完全一致 [L1:L1-M0901-031]				
m09-01_admin_content_content_news	E2E-M0901X-060	IT-20	ログ	P3	削除開始・完了ログに対象識別子（非UI）	ログイン済／SEED-M09-01-DELETE	—	1. 削除実行 2. アプリケーションログを確認	「新着情報削除開始」「新着情報削除完了」のログに id=900000321 が含まれる [L1:L1-M0901-032]（**実行可能グレード対象外=fixme相当。理由: ログ観測手段〔ログファイルパス・フォーマット〕が未契約**）				
```

---

## 5. locale ja/en の分岐整理

決定表（戦略§2.7.2）適用結果:
- **LS=1の全claimと対応`-EN`行の実在対応（宣言とTSVの一致＝codex是正）**:
  L1-005→010-EN／L1-010→031-EN／L1-012→033-EN／L1-016→038-EN／L1-019→036-EN／
  **L1-020→042-EN**／L1-023→043-EN／L1-026→050-EN／**L1-027→051-EN**／L1-031→054-EN／
  **L1-034（公開日時必須・項目別claim）→035-EN**。
  例外はL1-029（削除失敗msg）のみ＝**ja側053ごと実行可能グレード対象外（FK誘発TBD）のため`-EN`行なし。
  文言オラクル（ja/en）は確定済みで、FK手段確定時に053/053-ENを同時に解禁**する（不一致ではなく保留）。
- en文言は `messages.en.yaml`/`validators.en.yaml`/`validators.en.xlf` の逐語（**jaからの翻訳・流用ゼロ**）。
- **LS=0（jaのみ・理由コード付き）**: HTTP status/URL/404(`non-ui-observable`)・並び順/件数/初期値
  (`data-passthrough`)・DB列値(`non-ui-observable`)・制約自体(`non-translated`。文言のみLS=1で別claim)。
- en切替の前提: フロントは `ECCUBE_FRONT_LOCALE`。**管理画面のen切替口は未実測（D15の実機PoC対象）**。
  `-EN`行はD15成功が実行前提（不能時は戦略§2.7.2の停止/決裁ルール）。

## 6. 判定手段（spec/page骨子。期待値リテラル直書き禁止=三段参照）

page: 既存 `e2e/pages/admin/m09/m09_01_admin_content_content_news.page.ts` を再利用。
**注意（実行時実行可能性の前提）**: 下記骨子の `o()`（L1解決器）・`runFill()`・`db`（db.ts）は
**M0 D8/D9成果物として未実装**。本骨子は「完成後にこう書く」契約であり、現時点では走らない。

```ts
import { o, runFill } from "../../../helpers/oracle"; // M0 D8/D9で実装（未実装）
test("E2E-M0901X-033 タイトル201字はForm層で拒否（Form200/DB255段差）", async ({ page }) => {
  const news = new ContentContentNewsPage(page);
  const prefix = `E2E-${runId}-`;
  await news.gotoNew();
  await news.title.fill(runFill(o("L1-M0901-011").max + 1, "ascii", prefix)); // max=200はL1解決
  await news.fillValidExcept("title");                                         // 有効値はfixture(入力側)
  await news.submit();
  await expect(page.getByText(o("L1-M0901-012").ja({ limit: 200 }))).toBeVisible(); // 文言はL1解決
  await expect(db.newsCountByTitlePrefix(prefix)).toBe(0);                     // run-id prefixでDB未到達を確認
});
```

### 6.1 直接POST/DELETEのrequest契約（003/024/031/035/052が依存）

1. **トークン取得**: 同一BrowserContext（ログイン済みcookie/session共有）で対象画面をGETし、
   - 登録POST用: `{{ form_widget(form._token) }}`（news_edit.twig:22-23）が出力する hidden の value。
     **POSTフィールド名は `admin_news[_token]`**（getBlockPrefix 'admin_news'＝NewsType.php:108-111由来）。
   - 削除DELETE用: 一覧の削除アンカーのCSRFトークン（`csrf_token_for_anchor()`＝news.twig:92／
     CsrfExtension.php:37,41-43。token名 `Constant::TOKEN_NAME`='_token'＝Constant.php:41）。
     **送信パラメータ名は `_token`**（AbstractController.php:256 が `$request->get('_token')` で読む。
     代替: ヘッダ `ECCUBE-CSRF-TOKEN`）。
2. **必須フィールドの列挙（登録POST）**: `admin_news[publish_date]`（yyyy-MM-ddTHH:mm:ss）・
   `admin_news[title]`・`admin_news[visible]`（choice値）・`admin_news[_token]` を必ず送信。
   任意: `admin_news[url]`・`admin_news[link_method]`・`admin_news[description]`。
   検証対象フィールドのみ意図的に空/不正にし、他は有効値。
3. **セッション**: Playwright `request` は同一BrowserContextから生成し、ログインcookieを再利用する
   （新規contextの裸requestはfirewallで302になり観測が偽る。003のみ意図的にcookie無し）。
4. **Content-Type**: `application/x-www-form-urlencoded`（フォーム同等送信）。
5. **052の不正トークン具体**: 手順1で取得した正規トークンの**末尾1文字を別の英数字へ置換**した値を
   `_token` に載せ、`DELETE /%eccube_admin_route%/content/news/900000321/delete` へ送信。
   期待: HTTP403（AccessDeniedHttpException・AbstractController.php:258-260）＋DB行残存。

## 7. 多軸属性・実行区分（本見本ケースの付与）

| ケース群 | 実行区分 | 観測層 | 備考 |
|---|---|---|---|
| 001,002,010-023,030,033,036-039,043,050,054（＋EN） | Playwright | GUI（エラーはサーバ検証文言。030/035第1層のみHTML5=valueMissing） | 011/012/013は前提特殊（フレッシュDB/全件統制） |
| 032,034,040,041,042,051（＋EN） | Playwright+手動確認→**db.ts実装後Playwright単独へ降格候補** | GUI+DB | 母集合の GUI+DB 36行に対応する型 |
| 003,024,031,035(サーバ層),052（＋EN） | 非UI（Playwright request。§6.1契約） | HTTP応答+DB | HTML5バイパス・CSRF・未ログインDELETE |
| 053 | **実行可能グレード対象外**（fixme相当・手動） | GUI+DB | FK誘発根拠なし（§9-2） |
| 060 | **実行可能グレード対象外**（fixme相当・非UI） | ログ | ログ観測手段が未契約（§9-7） |

M09-01の聖域3行は execution_assignment 上の該当観点への充足をD14 v2完成後にマトリクスで会計する。

## 8. 本見本が固定する「実行可能グレード」DoD（全機能展開の受入基準）

1. L1原子オラクル表: 全claimに source_class・逐語quote・根拠file:line・（文字数系）unit・
   locale_sensitive（0は理由コード）。汎用文言ゼロ。TBDは分離（本機能: L1-033）。
   **vendor由来文言はchoice原文＋複数形解決規則＋解決後実値まで記載**（L1-012の型）。
2. SEEDが帯内固定値で定義され、期待値は三段参照。SEED値を期待値の正にしない。
   **作成行の一意特定（リダイレクトid主・run-id prefix安全網）とcleanupが規定**されている。
3. 画面項目×制約種別が項目ごとに個別アサーション化（**必須系は項目別oracle_id**）。
   最大長はForm層+DB層＋境界3種、層間段差の明示。「制約なし」の断定なし。
4. LS=1の**全claim**にja/enケースが実在（保留はclaim単位で理由明記）。en文言はen一次資料の逐語。
5. **ケース表グレード**: 14列TSVの各行が前提=SEEDセットID／入力=実値or決定的生成式／
   手順=URL・セレクタ・操作（直接送信は§6.1のrequest契約参照）／期待=実値+L1参照、で
   **道具が揃えば**単体判定可能。**実行時実行可能性の前提（=M0成果物: L1解決器/外部化lint D8/
   三段参照ゲート D9/db.ts/SEED manifest契約 D5型/request契約ヘルパ）をDoDに明記**し、
   「今すぐ実行可能」とは主張しない。
6. spec/page骨子で期待値リテラル直書きがない（L1解決器経由。ヘルパ未実装であることを明記）。
7. 各ケースに実行区分・観測層・聖域該非。**対象外（fixme相当）は理由付きで明確分離**。
8. 実行（手順9）: 本書では未実施（環境停止）。実施時は§4実施管理欄に記録し、
   失敗は戦略§2.6.2の5分類トリアージへ。

## 9. 未確定・要実機（捏造しなかったもの）

| # | 事項 | 状態 |
|---|---|---|
| 1 | 本文HTML浄化(purify)の具体除去規則 | 正本に規定なし=L1-033 TBD（未確定オラクル台帳へ） |
| 2 | 削除失敗(FK)の実誘発手段 | dtb_news.idへの参照FKが実ソースで確認できず要実機（053は実行可能グレード対象外・文言オラクルja/enは確定済み） |
| 3 | 管理画面のenロケール切替口 | 未実測（D15実機PoC。`-EN`全行の実行前提） |
| 4 | titleへのmaxlength属性出力有無（HTML5層の最大長ブロック） | twig未確認=要実機（現claimはサーバ層観測で自立） |
| 5 | manifest_sha1（fixture_version確定） | M09-01セットのmanifest登録=D5型契約後（現状`@TBD-D5`） |
| 6 | 一覧0件（EMPTY）・全件統制（011/012）の共有環境での実行可否 | フレッシュDB/全件統制SEED専用手順が前提（勝手に全行削除しない） |
| 7 | 削除ログの観測手段（ログファイルパス・フォーマット・ローテーション） | 未契約=060は実行可能グレード対象外 |
| 8 | 実行時実行可能性の道具 | L1解決器・外部化lint(D8)・三段参照ゲート(D9)・db.ts・request契約ヘルパ＝M0成果物として未実装（§8-5） |
