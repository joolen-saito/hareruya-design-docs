# W0候補: m09-01 新着情報管理 — 実行可能グレード候補（母集合88全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正(Blocker3)→R2部分→R3妥当＝候補確定**（`REVIEW_LEDGER.md`と同期）
> 改訂2: codex R2是正＝
> **(1) 088を肯定側（X-051）へ再bind (2) §4を自己完結化＝参照する全候補行を本文に実体掲載**
> （外部参照廃止・補完18行も実体掲載）。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`（L1行数34＝33claim＋L1-033 TBD）。
> パイロット由来行（X-nnn）は**本書§4に全行再掲済み**（自己完結。内容の正は本書。W0-114のみ
> L1参照をL1-048へ差替えの改訂を含む）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/…_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/m09_01_oracle.json` には書かない**。
> **行数訂正**: 前版の「候補70行（パイロット43＋W0 25+2）」は集計誤り。正しくは
> **総数72行＝パイロット43＋W0 29（27＋改訂1追加2）。ja60／-EN12。bound対応54＋補完18**。

## §0 版固定

- 設計書（コミット754a591）／ee `9dbc4dd1…`／symfony/validator v7.4.3／locale yaml SHA=戦略§0.1実測。
- fid_kubun.tsv（D1）: `M09-01｜標準｜standard-src+design｜区分不明=0`（target_sha256=4a2553…・todo_sha256=5452cf…）。
- 母集合: baseline `all_it_cases.tsv`（SHA `7911f1…`）M09-01全**88行**。
- **判定原則**: 観点ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定（§8に全行の期待要旨併記）。

## §1 L1原子オラクル表

**L1-M0901-001〜034はパイロット§1を再利用**（33claim＋L1-033 TBD＝34行）。是正済み事項:
- **L1-021はURL空時のlink_method正規化に限定**（URL有り時の保存はL1-048）。
- **L1-035/036の根拠=SaveEventSubscriber.php**（News.phpは列定義にすぎない）。
- **L1-040は設計書由来に限定**（コードで不出力を立証していない・観測未契約）。

追加・再定義claim（改訂1確定・維持）:

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0901-035（再定義） | db_effect | 新規保存時、prePersistイベントで `create_date`・`update_date` が自動設定される | `if (method_exists($entity, 'setCreateDate')) { $entity->setCreateDate(new \DateTime()); } if (method_exists($entity, 'setUpdateDate')) { $entity->setUpdateDate(new \DateTime()); }`／「永続化直前のDoctrineイベントで、新規時は作成日時・更新日時…が設定される。」 | **SaveEventSubscriber.php:37-55**／m09-01md:194 | 0 |
| L1-M0901-036（再定義） | db_effect | 管理者ログイン下の保存（新規・更新とも）で `creator_id` がログインユーザに設定される | `if (method_exists($entity, 'setCreator')) { $creator = $this->resolveManagedCreator($args); … }`（prePersist/preUpdate両方）／「管理者ログイン下では作成者がログインユーザに設定される。」 | **SaveEventSubscriber.php:37-55,62-74**／m09-01md:194,231 | 0 |
| L1-M0901-037（根拠補強） | db_effect | 更新保存（preUpdate）で設定されるのは `update_date`（と作成者解決）のみ＝`create_date` は更新で変わらない（preUpdateにsetCreateDate呼出なし） | `public function preUpdate(…): void {…setUpdateDate(new \DateTime());…}`（setCreateDate無し） | **SaveEventSubscriber.php:62-74**／m09-01md:194 | 0 |
| L1-M0901-040（再定義） | 非UI(ログ・**設計書由来/未立証**) | ログにパスワード・トークン等秘密値・Cookie値・セッションID完全値を出してはならない（**不出力をコードで立証していない**・観測手段未契約＝実行保留） | 「- パスワード ／ - なりすまし対策トークン…／ - Cookie値 ／ - セッションIDの完全値」 | m09-01md:350-355 | 0 |
| L1-M0901-047（新規） | display_field | 並び替えUI要素は操作できるがサーバ保存の入口が無く、並び替え結果は保存されない（再読込でDB順・DB不変） | 「並び替え用UI要素はあるがサーバー保存の入口は本機能に無い」「サーバ側の保存は行わない。」 | m09-01md:82,93 | 0 |
| L1-M0901-048（新規） | db_effect | 「別ウィンドウで開く」はチェック時に真として保存。**偽への上書きはURL未入力時のみ**（URL有り時はチェック値どおり） | 「`dtb_news.link_method`。チェック時に真。URL未入力時は保存直前に偽へ上書きする。」／`if (!$News->getUrl()) { $News->setLinkMethod(false); }`／`'data_class' => News::class,` | m09-01md:168／NewsController.php:110-112／NewsType.php:70-74,99-101 | 0 |

L1-038（二次キャッシュ・観測未契約）・L1-039（同時更新最後勝ち）・L1-041〜046も改訂1どおり有効
（L1-042必須バッジのみLS=1）。

## §2 SEED三段参照設計

パイロット§2（SEED-M09-01-LIST/EDIT/DELETE/NONE/EMPTY/FKREF）＋SEED-M09-01-EDIT2（同時更新用・
追加行不要）。全て`@TBD-D5`。期待値の正はL1オラクルID（SEEDを期待値の正にしない三段参照）。

## §3 画面項目マトリクス

パイロット§3を再利用（6項目×必須/最大長/メッセージ×層×境界3種・Form200/DB255・Form200/DB4000
段差・description DB=TEXT断定なし。create_date/update_date/creator_id/id は自動設定列=L1-035/036/037/041）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全72行を実体掲載**）

### §4.1 bound対応候補行（54行。§8の88対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-01_admin_content_content_news	E2E-M0901X-001	IT-15	権限	P1	未ログインで一覧URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/content/news	admin_login のログイン画面へリダイレクトされ一覧は表示されない [L1:L1-M0901-001]				
m09-01_admin_content_content_news	E2E-M0901X-002	IT-15	権限	P1	未ログインで編集URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/content/news/900000320/edit	admin_login のログイン画面へリダイレクトされる [L1:L1-M0901-001]				
m09-01_admin_content_content_news	E2E-M0901X-003	IT-15	権限	P2	未ログインで削除URLへDELETE→到達せずログインへ	未ログイン（cookie無しrequest）／SEED-M09-01-DELETE	DELETE /content/news/900000321/delete（§6.1契約・cookie無し）	1. 認証cookie無しでDELETE送信 2. 応答とDBを確認	削除処理へ到達せず admin_login へのリダイレクト応答・行は削除されない [L1:L1-M0901-001,L1-M0901-028]				
m09-01_admin_content_content_news	E2E-M0901X-010	IT-25	UI部品	P2	一覧見出しが公開日時・公開状態・タイトル（ja）	ログイン済(SEED-M01-ADMIN)／SEED-M09-01-LIST	—	1. 一覧を開く 2. 見出し行(li.list-group-item内strong)を読む	HTTP200かつ見出しに「公開日時」「公開状態」「タイトル」が存在 [L1:L1-M0901-005,L1-M0901-002]				
m09-01_admin_content_content_news	E2E-M0901X-010-EN	IT-25	UI部品	P2	一覧見出し（en）	ログイン済／SEED-M09-01-LIST／locale=en	—	1. en UIで一覧を開く 2. 見出し行を読む	見出しに "Published on"・"Display Status"・"Title" が存在 [L1:L1-M0901-005]				
m09-01_admin_content_content_news	E2E-M0901X-011	IT-23	表示順	P1	一覧の全順序が publish_date降順・同値id降順	ログイン済／SEED-M09-01-LIST／dtb_newsが本SEEDのみ（フレッシュDB/全件統制）	—	1. 一覧を開く（2ページ目まで） 2. 全明細行の data-id を文書順に取得	取得id列がSEED投入表の(publish_date DESC, id DESC)ソート結果と全順序で完全一致（900000311が900000310より先） [L1:L1-M0901-003; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-012	IT-23	ページング	P2	1ページ10件で2ページ目に残り1件	ログイン済／SEED-M09-01-LIST(11件)／dtb_newsが本SEEDのみ（共有環境では実行しない）	—	1. 一覧で明細行数を数える 2. /content/news/page/2 で数える	1ページ目=10件・2ページ目=1件 [L1:L1-M0901-004; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-013	IT-25	表示	P3	一覧0件で見出し行のみ・明細行0	ログイン済／SEED-M09-01-EMPTY(フレッシュDB専用)	—	1. 一覧を開く 2. li.sortable-item件数を数える	見出し行のみ・明細行0件 [L1:L1-M0901-006]（前提特殊）				
m09-01_admin_content_content_news	E2E-M0901X-020	IT-13	初期値	P2	新規画面の公開日時初期値=現在日時（ブラケット判定）	ログイン済	—	1. db.tsでT1=SELECT now() 2. /content/news/new を開く 3. T2=SELECT now() 4. #admin_news_publish_date のvalue（yyyy-MM-ddTHH:mm:ss・サーバtz）を読む	T1≦初期値≦T2 [L1:L1-M0901-007]				
m09-01_admin_content_content_news	E2E-M0901X-021	IT-13	初期値	P2	新規画面の公開状態初期選択=公開（設計書md:156が根拠）	ログイン済	—	1. /content/news/new を開く 2. #admin_news_visible の選択値を読む	選択値がtrue側（表示文言はL1-020） [L1:L1-M0901-008]				
m09-01_admin_content_content_news	E2E-M0901X-022	IT-25	初期表示	P1	編集画面に既存値が表示される	ログイン済／SEED-M09-01-EDIT	—	1. /content/news/900000320/edit を開く 2. 各フォーム値を読む	title/url/description/link_method/visible/publish_dateがSEED投入値と一致（恒等写像） [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-023	IT-13	異常系	P2	不存在idの編集URL→HTTP404	ログイン済／SEED-M09-01-NONE	id=900000999	1. GET /content/news/900000999/edit	HTTP404 [L1:L1-M0901-009]				
m09-01_admin_content_content_news	E2E-M0901X-024	IT-13	異常系	P2	不存在idの削除DELETE→HTTP404	ログイン済／SEED-M09-01-NONE	DELETE /content/news/900000999/delete（§6.1契約・正規_token付き）	1. §6.1手順で正規tokenを取得しDELETE送信	HTTP404 [L1:L1-M0901-009]				
m09-01_admin_content_content_news	E2E-M0901X-030	IT-22	必須	P1	タイトル空はHTML5層で送信ブロック	ログイン済	title=空・他は有効値	1. 新規画面で登録押下 2. #admin_news_title のvalidity.valueMissingを読む	送信されず valueMissing=true [L1:L1-M0901-010(HTML5層)]				
m09-01_admin_content_content_news	E2E-M0901X-031	IT-22	必須	P1	タイトル空のサーバ検証メッセージ（ja）	ログイン済	title=空（admin_news[title]=""）を§6.1契約で直接POST	1. POST /content/news/new 2. 応答HTMLを読む	保存されず「入力されていません。」が含まれ成功フラッシュ無し [L1:L1-M0901-010(サーバ層),L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-031-EN	IT-22	必須	P2	タイトル空のサーバ検証メッセージ（en）	ログイン済／locale=en	同上	同上	"No value found." が含まれる [L1:L1-M0901-010]				
m09-01_admin_content_content_news	E2E-M0901X-032	IT-22	最大長	P1	タイトル200字(ascii)が受理されDBへ保存	ログイン済	title=runFill(200,ascii,"E2E-<runid>-")・他有効値	1. 新規登録送信 2. フラッシュ確認 3. リダイレクトURLからid取得 4. db.tsで char_length(title) 照会（afterEach: id削除）	保存成功（「保存しました」）＋/content/news/{id}/edit 遷移＋DB文字長=200 [L1:L1-M0901-011,L1-M0901-013,L1-M0901-014,L1-M0901-023,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901X-033	IT-22	最大長	P1	タイトル201字(ascii)がForm層で拒否（Form200/DB255段差）	ログイン済	title=runFill(201,ascii,"E2E-<runid>-")	1. 新規登録送信 2. エラー表示を読む 3. db.tsでprefix行が無いことを照会	保存されず「長すぎます。この値は200文字以下で入力してください。」表示・DB未到達 [L1:L1-M0901-011,L1-M0901-012,L1-M0901-013,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-033-EN	IT-22	最大長	P2	タイトル201字拒否メッセージ（en）	ログイン済／locale=en	title=runFill(201,ascii,"E2E-<runid>-")	同上	"This value is too long. It should have 200 characters or less." 表示 [L1:L1-M0901-012]				
m09-01_admin_content_content_news	E2E-M0901X-035	IT-22	必須	P2	公開日時空はHTML5層でブロック／サーバ層メッセージ（ja）	ログイン済	publish_date=空（admin_news[publish_date]=""）	1. HTML5層: validity.valueMissing確認 2. サーバ層: §6.1契約で直接POST	HTML5層valueMissing=true／サーバ応答に「入力されていません。」（publish_date欄） [L1:L1-M0901-034]				
m09-01_admin_content_content_news	E2E-M0901X-035-EN	IT-22	必須	P2	公開日時空のサーバ検証メッセージ（en）	ログイン済／locale=en	同上（サーバ層のみ）	1. §6.1契約で直接POST 2. 応答を読む	"No value found." が含まれる（publish_date欄） [L1:L1-M0901-034]				
m09-01_admin_content_content_news	E2E-M0901X-036	IT-22	境界	P1	公開日時0002-12-31は不正日付（ja）	ログイン済	publish_date=0002-12-31T23:59:59	1. 登録送信 2. エラー表示を読む	保存されず「不正な日付です。」表示 [L1:L1-M0901-019,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-036-EN	IT-22	境界	P2	公開日時下限違反（en）	ログイン済／locale=en	同上	同上	"Invalid DateTime." 表示 [L1:L1-M0901-019]				
m09-01_admin_content_content_news	E2E-M0901X-037	IT-22	任意	P1	URL空で保存成功（任意の実証）	ログイン済	url=空・title=`E2E-<runid>-URL任意`等有効値	1. 登録送信 2. フラッシュと遷移を確認（afterEach: リダイレクトid削除）	保存成功＋編集画面へ遷移（URL未入力が拒否されない） [L1:L1-M0901-015,L1-M0901-023,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901X-038	IT-22	形式	P1	URL形式不正が拒否される（ja）	ログイン済	url=not-a-url	1. 登録送信 2. エラー表示を読む	保存されず「有効なURLではありません。」表示 [L1:L1-M0901-016,L1-M0901-025]				
m09-01_admin_content_content_news	E2E-M0901X-038-EN	IT-22	形式	P2	URL形式不正（en）	ログイン済／locale=en	url=not-a-url	同上	"This value is not a valid URL." 表示 [L1:L1-M0901-016]				
m09-01_admin_content_content_news	E2E-M0901X-041	IT-22	整合	P1	URL空+別ウィンドウチェックONで保存→link_method=false（DB層）	ログイン済	url=空・link_method=ON・title=`E2E-<runid>-整合`等	1. 登録送信 2. リダイレクトURLからid取得 3. db.tsでlink_method照会（afterEach: id削除）	保存成功かつ dtb_news.link_method=false（URL空時の正規化） [L1:L1-M0901-021]				
m09-01_admin_content_content_news	E2E-M0901X-042	IT-26	保存	P1	非公開を選択して保存→visible=false＋一覧表示「非公開」	ログイン済／SEED-M09-01-EDIT	visible=非公開	1. 編集画面(900000320)で非公開を選択し登録 2. db.tsでvisible照会 3. 一覧当該行(data-id="900000320")の公開状態文言を読む	dtb_news.visible=false かつ一覧に「非公開」 [L1:L1-M0901-022,L1-M0901-020; fixture:SEED-M09-01-EDIT@TBD-D5]（実行後SEED再適用）				
m09-01_admin_content_content_news	E2E-M0901X-042-EN	IT-26	保存	P2	非公開の一覧表示文言（en）	ログイン済／SEED-M09-01-EDIT(visible=false状態)／locale=en	—	1. en UIで一覧を開く 2. 当該行の公開状態文言を読む	"Hidden"（公開行には "Displayed"） [L1:L1-M0901-020]				
m09-01_admin_content_content_news	E2E-M0901X-043	IT-26	保存成功	P1	保存成功フラッシュと編集画面遷移（ja）	ログイン済／SEED-M09-01-EDIT	有効値一式	1. 編集画面で登録押下 2. 遷移先URLとフラッシュを読む	「保存しました」＋/content/news/900000320/edit へ遷移 [L1:L1-M0901-023,L1-M0901-024; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901X-043-EN	IT-26	保存成功	P2	保存成功フラッシュ（en）	ログイン済／SEED-M09-01-EDIT／locale=en	有効値一式	同上	"Saved" 表示 [L1:L1-M0901-023]				
m09-01_admin_content_content_news	E2E-M0901X-051	IT-26	削除成功	P1	正規トークン付き削除実行で成功フラッシュ・一覧遷移・DB行削除（ja）	ログイン済／SEED-M09-01-DELETE	—	1. モーダル(#delete_900000321)内の削除実行(a.btn-ec-delete・csrf_token_for_anchor〔news.twig:92〕の正規トークン付きDELETE送信)押下 2. 遷移とフラッシュを読む 3. db.tsで id=900000321 の不存在を照会	「削除しました」＋一覧へ遷移＋dtb_newsに id=900000321 が存在しない [L1:L1-M0901-027,L1-M0901-028; fixture:SEED-M09-01-DELETE@TBD-D5]（実行後SEED再適用）				
m09-01_admin_content_content_news	E2E-M0901X-051-EN	IT-26	削除成功	P2	削除成功フラッシュ（en）	ログイン済／SEED-M09-01-DELETE（再適用後）／locale=en	—	同上	"Deleted" 表示＋一覧へ遷移 [L1:L1-M0901-027]				
m09-01_admin_content_content_news	E2E-M0901X-052	IT-03	CSRF	P2	トークン不正のDELETEはアクセス拒否（非UI）	ログイン済セッション（同一BrowserContext）／SEED-M09-01-DELETE	§6.1契約: 正規tokenの末尾1文字を置換した改変値を `_token` で DELETE /content/news/900000321/delete へ送信	1. 改変tokenでDELETE送信 2. 応答とDBを確認	HTTP403（`AccessDeniedHttpException('CSRF token is invalid.')`）かつ行が削除されない [L1:L1-M0901-030,L1-M0901-028]				
m09-01_admin_content_content_news	E2E-M0901X-053	IT-26	削除失敗	P3	関連データ存在時の削除失敗メッセージ	SEED-M09-01-FKREF(**TBD-要実機**)	—	（FK誘発手段確定後）	「関連するデータがあるため「（対象タイトル）」を削除できませんでした」＋一覧遷移＋行残存 [L1:L1-M0901-029,L1-M0901-028]（実行可能グレード対象外=fixme相当・FK誘発根拠なし）				
m09-01_admin_content_content_news	E2E-M0901W0-100	IT-22	登録内容	P1	公開日時の入力値がそのままDBへ保存される	ログイン済	publish_date=2026-07-20T12:34:56・title=`E2E-<runid>-pd`等	1. 新規登録送信 2. id取得 3. db.tsでpublish_date照会（afterEach: id削除）	保存成功＋dtb_news.publish_date=2026-07-20 12:34:56（サーバtz・恒等写像） [L1:L1-M0901-014,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901W0-103	IT-26	登録内容	P1	公開を選択して新規保存→visible=true	ログイン済	visible=公開・title=`E2E-<runid>-vis`等	1. 新規登録送信 2. id取得 3. db.tsでvisible照会（afterEach: id削除）	保存成功＋dtb_news.visible=true [L1:L1-M0901-022]				
m09-01_admin_content_content_news	E2E-M0901W0-104	IT-26	登録内容	P1	新規保存でcreate_date/update_dateが自動設定される	ログイン済	title=`E2E-<runid>-dt`等（日時入力欄は無い）	1. db.tsでT1=now() 2. 新規登録送信 3. id取得 4. db.tsでcreate_date/update_date照会（afterEach: id削除）	両列が設定され T1≦値≦照会時now()（ブラケット法） [L1:L1-M0901-035]				
m09-01_admin_content_content_news	E2E-M0901W0-110	IT-22	更新内容	P1	タイトル更新がDBへ反映される	ログイン済／SEED-M09-01-EDIT	title=`PILOT編集対象W0110`	1. 編集画面でtitle変更し登録 2. db.tsでtitle照会（実行後SEED再適用）	dtb_news.title=更新値と完全一致 [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-111	IT-22	更新内容	P1	公開日時更新がDBへ反映される	ログイン済／SEED-M09-01-EDIT	publish_date=2026-07-21T00:00:00	同上（publish_date変更）	dtb_news.publish_date=2026-07-21 00:00:00 [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-112	IT-22	更新内容	P1	URL更新がDBへ反映される	ログイン済／SEED-M09-01-EDIT	url=`https://example.com/w0-112`	同上（url変更）	dtb_news.url=更新値と完全一致 [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-113	IT-22	更新内容	P1	本文更新（プレーン）がDBへ反映される	ログイン済／SEED-M09-01-EDIT	description=`PILOT本文W0113`	同上（description変更）	dtb_news.description=更新値と完全一致 [L1:L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-114	IT-22	更新内容	P1	URL有りで別ウィンドウONに更新→link_method=true	ログイン済／SEED-M09-01-EDIT(url有り)	link_method=ON	同上（link_methodのみON）	dtb_news.link_method=true（チェック時に真・URL有り時は上書き条件不成立） [L1:**L1-M0901-048**,L1-M0901-014; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-115	IT-26	更新内容	P1	非公開→公開へ更新でvisible=true	ログイン済／SEED-M09-01-EDIT(visible=false状態から)	visible=公開	同上（visible変更）	dtb_news.visible=true＋一覧当該行「公開」表示 [L1:L1-M0901-022,L1-M0901-020; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-116	IT-26	更新内容	P1	更新保存でupdate_dateのみ更新されcreate_dateは不変	ログイン済／SEED-M09-01-EDIT	title変更のみ	1. db.tsで更新前のcreate_date/update_dateを記録 2. 編集保存 3. db.tsで再照会	update_dateが更新され、create_dateが更新前と同値 [L1:L1-M0901-037,L1-M0901-035; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-117	IT-22	更新内容	P1	更新経路でURLを空にするとlink_methodが偽へ揃う	ログイン済／SEED-M09-01-EDIT(url有り・link_method=true)	url=空に変更（link_methodはONのまま）	1. 編集画面でurlを空にして登録 2. db.tsでlink_method照会（実行後SEED再適用）	保存成功＋dtb_news.link_method=false [L1:L1-M0901-021; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-118	IT-22	更新内容	P1	更新経路の検証失敗ではDB値が変更されない	ログイン済／SEED-M09-01-EDIT	title=runFill(201,ascii,"E2E-<runid>-")（更新画面で）	1. db.tsで更新前titleを記録 2. 編集画面でtitleを201字にして登録 3. エラー表示確認 4. db.tsでtitle再照会	「長すぎます。この値は200文字以下で入力してください。」表示＋dtb_news.titleが更新前の値のまま [L1:L1-M0901-011,L1-M0901-012,L1-M0901-025; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-120	IT-22	部分入力	P2	任意項目（URL・別ウィンドウ・本文）を全て省略して保存成功	ログイン済	publish_date・title=`E2E-<runid>-min`・visibleのみ入力	1. 新規登録送信 2. フラッシュと遷移確認 3. db.tsでurl/description=NULL・link_method=false照会（afterEach: id削除）	保存成功＋任意項目が未設定 [L1:L1-M0901-015,L1-M0901-023,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901W0-130	IT-26	更新抑止	P1	同一行の同時編集は最後の保存が残る（楽観ロックなし）	ログイン済×2セッション／SEED-M09-01-EDIT	A: title=`W0130-A`／B: title=`W0130-B`	1. A・B両セッションで同一編集画面を開く 2. Aが保存 3. Bが保存 4. db.tsでtitle照会（SEED再適用。並行実行=serial環境必須）	エラーにならず最後に保存したBの値が残る [L1:L1-M0901-039; fixture:SEED-M09-01-EDIT@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-140	IT-25	画面レイアウト	P2	編集画面に入力部品一式が存在する	ログイン済	—	1. /content/news/new を開く 2. #admin_news_publish_date/_title/_url/_link_method/_description/_visible と登録ボタンの存在を確認	7部品すべて存在 [L1:L1-M0901-044]				
m09-01_admin_content_content_news	E2E-M0901W0-146	IT-25	一覧	P2	一覧の並び替えUI操作はサーバ保存されない	ログイン済／SEED-M09-01-LIST	—	1. 並び替えUI要素を操作 2. ページ再読込 3. 行順とdb.tsでpublish_date/idを照会	再読込後の順序がDB順のまま（並び替えは保存されない・DB不変） [L1:L1-M0901-047,L1-M0901-003; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-151	IT-23	識別子	P1	新規保存でidが自動採番される（非UI/DB層）	ログイン済	title=`E2E-<runid>-id`等	1. 新規登録送信 2. リダイレクトURLのid取得 3. db.tsで行存在とid>0を照会（afterEach: id削除）	idが自動採番され行が存在する [L1:L1-M0901-041,L1-M0901-024]				
m09-01_admin_content_content_news	E2E-M0901W0-160	IT-25	画面表示データ	P2	一覧行に公開日時が表示される	ログイン済／SEED-M09-01-LIST	—	1. 一覧を開く 2. id=900000301行の公開日時表示を読む	SEED投入のpublish_date既知値に対応する日時が表示（恒等写像） [L1:L1-M0901-014,L1-M0901-005; fixture:SEED-M09-01-LIST@TBD-D5]				
m09-01_admin_content_content_news	E2E-M0901W0-162	IT-23	一覧	P2	一覧は公開・非公開を問わず全件表示する	ログイン済／SEED-M09-01-LIST(公開8/非公開3)／dtb_newsが本SEEDのみ	—	1. 一覧を開く（2ページ目まで） 2. 明細行数と各行の公開状態を数える	11件全件（非公開3件含む）表示＝公開日時絞込なしの実証 [L1:L1-M0901-003; fixture:SEED-M09-01-LIST@TBD-D5]（前提特殊）				
```

### §4.2 補完行（18行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定が
あるが、母集合88行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-01_admin_content_content_news	E2E-M0901X-034	IT-22	最大長	P1	タイトル200字マルチバイト混在が受理（文字長意味論）	ログイン済	title=runFill(200,mixed,"E2E-<runid>-")（UTF-8バイト長>200）	1. 新規登録送信 2. id取得 3. db.tsで char_length(title)=200 照会（afterEach: id削除）	保存成功＋DB文字長=200（バイト長でなく文字長） [L1:L1-M0901-011,L1-M0901-013,L1-M0901-014]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-039	IT-22	最大長	P2	URL200字受理・201字拒否（Form200/DB4000段差）	ログイン済	url200=`https://example.com/`+`a`×180／url201=+`a`×181	1. 200字で登録送信→成功確認（afterEach: id削除） 2. 201字で送信→エラー確認	200字保存成功・201字は「長すぎます。この値は200文字以下で入力してください。」でDB未到達 [L1:L1-M0901-017,L1-M0901-012]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-040	IT-22	最大長	P2	本文3000字受理・3001字拒否	ログイン済	description=runFill(3000,mixed,"E2E-<runid>-")／runFill(3001,ascii,…)・title=`E2E-<runid>-本文境界`	1. 3000字で登録→成功+db.tsでchar_length=3000 2. 3001字で送信→エラー（afterEach: id削除）	3000字保存成功・3001字は「長すぎます。この値は3000文字以下で入力してください。」 [L1:L1-M0901-018,L1-M0901-012]（補完行・親test_idなし・設計書補完。浄化対象を含まないプレーン文字列=L1-033回避）				
m09-01_admin_content_content_news	E2E-M0901X-050	IT-03	モーダル	P1	削除モーダルの見出しと対象タイトル差込（ja）	ログイン済／SEED-M09-01-DELETE	—	1. 一覧で削除アイコン(a[data-bs-target="#delete_900000321"])押下 2. #delete_900000321 内の h5.modal-title と .modal-body p を読む	見出し「削除します」・本文「この操作はあとから取り消すことができません。「PILOT削除対象」を削除してよろしいですか？」 [L1:L1-M0901-026; fixture:SEED-M09-01-DELETE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-050-EN	IT-03	モーダル	P2	削除モーダル（en）	ログイン済／SEED-M09-01-DELETE／locale=en	—	同上	"Delete"・"You can not revert this action. Are you sure to delete PILOT削除対象?" [L1:L1-M0901-026]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-054	IT-25	ツールチップ	P3	URL/本文ツールチップ文言（ja）	ログイン済	—	1. 編集画面のURL入力行の div[data-bs-toggle="tooltip"]（news_edit.twig:68）の title属性を読む 2. 本文行（同:88）も同様	title属性がL1-031のja逐語と完全一致 [L1:L1-M0901-031]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-054-EN	IT-25	ツールチップ	P3	ツールチップ文言（en）	ログイン済／locale=en	—	同上	L1-031のen逐語と完全一致 [L1:L1-M0901-031]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901X-060	IT-20	ログ	P3	削除開始・完了ログに対象識別子（非UI）	ログイン済／SEED-M09-01-DELETE	—	1. 削除実行 2. アプリケーションログを確認	「新着情報削除開始」「新着情報削除完了」のログに id=900000321 が含まれる [L1:L1-M0901-032]（補完行・親test_idなし・設計書補完。実行保留=ログ観測手段未契約）				
m09-01_admin_content_content_news	E2E-M0901W0-101	IT-22	登録内容	P1	URLの入力値がそのままDBへ保存される	ログイン済	url=`https://example.com/w0-101`・title=`E2E-<runid>-url`等	1. 新規登録送信 2. id取得 3. db.tsでurl照会（afterEach: id削除）	保存成功＋dtb_news.url=入力値と完全一致 [L1:L1-M0901-014]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-102	IT-22	登録内容	P1	本文（プレーン）の入力値がそのままDBへ保存される	ログイン済	description=`E2E-<runid>-本文W0102`（タグ無し）	1. 新規登録送信 2. id取得 3. db.tsでdescription照会（afterEach: id削除）	保存成功＋dtb_news.description=入力値と完全一致 [L1:L1-M0901-014]（補完行・親test_idなし・設計書補完。タグ入りはL1-033=TBD）				
m09-01_admin_content_content_news	E2E-M0901W0-105	IT-26	登録内容	P1	新規保存でcreator_idがログイン管理者に設定される	ログイン済(SEED-M01-ADMIN)	title=`E2E-<runid>-cr`等	1. 新規登録送信 2. id取得 3. db.tsでcreator_id照会（afterEach: id削除）	dtb_news.creator_id=ログイン中管理者のmember id [L1:L1-M0901-036; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-141	IT-03	画面レイアウト	P2	削除モーダルはキャンセルで閉じ削除されない	ログイン済／SEED-M09-01-DELETE	—	1. 削除アイコン押下でモーダル表示 2. キャンセル(button[data-bs-dismiss=modal])押下 3. db.tsで行存在照会	モーダルが閉じ id=900000321 が残る [L1:L1-M0901-045,L1-M0901-028; fixture:SEED-M09-01-DELETE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-142	IT-25	画面レイアウト	P2	必須項目に「必須」バッジが表示される（ja）	ログイン済	—	1. /content/news/new を開く 2. 公開日時・タイトル見出しのbadge文言を読む	両見出しに「必須」バッジ [L1:L1-M0901-042]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-142-EN	IT-25	画面レイアウト	P2	必須バッジ（en）	ログイン済／locale=en	—	同上	"Required" [L1:L1-M0901-042]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-143	IT-22	画面レイアウト	P2	検証エラーが該当項目の直下に表示される	ログイン済	title=空を§6.1契約で直接POST（またはtitle=201字でUI送信）	1. 検証失敗を発生させる 2. エラー文言の出現位置（title widget直後のform_errors領域）を確認	エラーがタイトル欄直下に表示（他項目位置に出ない） [L1:L1-M0901-043,L1-M0901-010]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-145	IT-26	エラー継続	P3	検証失敗後に修正して再送信すると保存成功する	ログイン済	1回目: title=空／2回目: title=`E2E-<runid>-retry`	1. 空titleで送信し検証失敗 2. 同一画面で修正し再送信 3. フラッシュ・遷移・db.ts確認（afterEach: id削除）	1回目保存されず・2回目「保存しました」＋遷移＋DB保存 [L1:L1-M0901-046,L1-M0901-023,L1-M0901-024]（補完行・親test_idなし・設計書補完）				
m09-01_admin_content_content_news	E2E-M0901W0-150	IT-20	出力抑止	P1	ログに秘密値（パスワード/トークン/Cookie/セッションID完全値）が出ない（非UI）	ログイン済	—	1. ログイン〜保存〜削除の一連操作 2. アプリケーションログを走査	4種の秘密値がログに出現しない [L1:L1-M0901-040]（補完行・親test_idなし・設計書補完。**設計書由来・コードで不出力を立証していない**・実行保留=観測手段未契約）				
m09-01_admin_content_content_news	E2E-M0901W0-161	IT-25	画面表示データ	P2	一覧行のタイトルが当該編集画面へのリンクである	ログイン済／SEED-M09-01-LIST	—	1. 一覧を開く 2. id=900000301行のタイトルリンクhrefを読む	href が /content/news/900000301/edit を指す（news.twig:53-54） [L1:L1-M0901-024; fixture:SEED-M09-01-LIST@TBD-D5]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1: パイロット11claim＋L1-042 → **-EN 12行**（bound親従属9: X-010/031/033/035/036/038/042/043/051
の各-EN／補完従属3: X-050-EN・X-054-EN・W0-142-EN）。追加claim 047/048はLS=0。
en文言はen一次資料逐語（ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

パイロット§6のrequest契約（`admin_news[_token]`・`_token`・urlencoded・同一context）・L1解決器方式を
再利用。候補の追加ケースspec/pageは未実装・実走なし。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages・helpers）に**草案を消費する参照は0件**
   （**隔離ガード自体のリテラル `_drafts`〔oracle.ts:17,20〕を除く**。ガードは草案解決をthrowで
   拒否する機械強制であり、消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/m09_01_oracle.json` は**未変更**（git statusで確認）。
   草案は `_drafts/` のみに生成。
3. `e2e/helpers/oracle.ts` の隔離ガード（実在確認: oracle.ts:16-25）: `loadFile(fileKey)` が
   fileKey に `_drafts`・パス区切り・`..` を含む場合に解決を**throw**する。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

改訂1どおり（Playwright／Playwright+手動確認(GUI+DB・db.ts降格候補)／非UI(request・ログ)／
W0-130=並行実行serial必須／X-053・X-060・W0-150=実行保留）。聖域判定・多軸正式付与はD14後。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による。1候補ケース行=1 assertion bundle・多対一は
`shared-observation`・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝88↔候補の期待テキスト突合が本文内で完結する**。

### 集計（88 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **62** | 下表 |
| **TBD** | **2** | 064（浄化規則沈黙=L1-033）／077（二次キャッシュ観測未契約=L1-038） |
| **excluded** | **24** | EX-A 検索取得系18（019〜036。md:144,152＋twig実測フォーム0件）／EX-B 相関バリ4（012〜015。NewsType実測=相関constraint無し）／EX-C DB相関2（016〜017） |
| 合計 | **88** | 欠落0・理由なし重複0 |

- 候補ケース行総数**72**（§4.1 bound対応54＋§4.2 補完18。ja60／-EN12）。
- **改訂2の変更**: 088のbind先を**X-052→X-051へ是正**（期待=「なりすまし対策トークンを伴う削除
  リクエストが**送信される**」＝**正規トークン付き削除送信の肯定側**。X-052は改変トークン→403の
  否定試験で逆方向。X-051のUI削除実行は `csrf_token_for_anchor()`〔news.twig:92〕による正規トークン
  付きDELETE送信＝期待テキストと一致）。
- 012→EX-B・073→X-036は改訂1どおり維持（codex閉確認済み）。

### 88対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | フロントTOP等に表示する告知1件であること | bound | X-032,W0-151 (shared) |
| 002 | 公開扱いとする日時であること（並び順に使用） | bound | W0-100,X-011 (shared) |
| 003 | フロントへ表示するか否かの区分であること | bound | W0-103,X-042 (shared) |
| 004 | 別ウィンドウで開くか否かの設定であること | bound | W0-114,X-041 (L1-048/021) |
| 005 | 公開日時の新しい順に並ぶこと | bound | X-011 |
| 006 | 1ページ10件単位で表示すること | bound | X-012 |
| 007 | 新規登録用の編集画面が開くこと | bound | X-020,W0-140 (shared) |
| 008 | 既存情報が読み込まれ現行値表示 | bound | X-022 |
| 009 | 必須バリでエラー表示・処理未完了 | bound | X-030,X-031(+EN),X-035(+EN) |
| 010 | 必須バリでエラー表示されず継続できる | bound | X-043,W0-120,X-037 (shared) |
| 011 | 管理画面共通ルールでアクセスできない | bound | X-001,X-002,X-003 |
| 012〜015 | 相関バリでエラー表示/なし | **excluded** EX-B | — |
| 016〜017 | DB相関バリ | excluded EX-C | — |
| 018 | 並び替え保存入口なし・サーバ保存しない | bound | W0-146（L1-047） |
| 019〜036 | 検索条件/実行結果の該当レコードが取得結果に… | excluded EX-A | — |
| 037 | 対象レコードが追加されること | bound | W0-151 (shared) |
| 038 | 追加され**ない**こと | bound | X-033 |
| 039 | 追加されること | bound | X-032 (shared) |
| 040 | GET/POST/DELETE相当のリクエストであること | bound | X-010,X-043,X-052 (shared) |
| 041 | 追加されること | bound | X-032 (shared) |
| 042 | 追加されること | bound | W0-100 (shared) |
| 043 | 追加され**ない**こと | bound | X-038 |
| 044 | 追加されること | bound | W0-103 (shared) |
| 045 | 追加され**ない**こと | bound | X-033 (shared) |
| 046 | 追加されること | bound | X-032 (shared) |
| 047 | 追加されること | bound | X-032,W0-151 (shared) |
| 048 | 現行値が表示されること | bound | X-022 (shared) |
| 049 | 値が変更されること | bound | W0-110 |
| 050 | 値が変更され**ない**こと | bound | W0-118 |
| 051 | 値が変更されること | bound | W0-111 (shared) |
| 052 | 見出し行に公開日時/公開状態/タイトル表示 | bound | X-010(+EN) |
| 053 | 値が変更されること | bound | W0-112 (shared) |
| 054 | 値が変更されること | bound | W0-113 (shared) |
| 055 | 値が変更され**ない**こと | bound | W0-118 (shared) |
| 056 | 値が変更されること | bound | W0-114 (shared) |
| 057 | 値が変更され**ない**こと | bound | W0-118 (shared) |
| 058 | 値が変更されること | bound | W0-115 (shared) |
| 059 | 値が変更されること | bound | W0-116 (shared) |
| 060 | 1ページ10件であること | bound | X-012 (shared) |
| 061 | 新規表示時の現在日時であること | bound | X-020 (shared) |
| 062 | 公開(真)/非公開(偽)の2択であること | bound | X-021,X-042,W0-103 (shared) |
| 063 | URL空なら保存直前に偽へ揃えること | bound | X-041,W0-117 (shared) |
| 064 | 本文は保存時にHTML浄化を通すこと | **TBD**（L1-033） | — |
| 065 | 削除状態にならないこと | bound(要実機) | X-053 |
| 066 | 削除状態になること | bound | X-051(+EN) |
| 067 | dtb_news.link_methodであること（保存先列） | bound | W0-114,X-041 (shared) |
| 068 | 削除状態になること | bound | X-051 (shared) |
| 069 | dtb_news.visibleであること（保存先列） | bound | X-042,W0-103 (shared) |
| 070 | HTTP404となること | bound | X-023,X-024 |
| 071 | 関連データ存在エラーを積み一覧へ | bound(要実機) | X-053 (shared) |
| 072 | 保存直前に偽へ揃えること | bound | X-041,W0-117 (shared) |
| 073 | 不正日付として検証エラー・保存しない | bound | X-036(+EN) |
| 074 | 0件で見出し行のみ | bound | X-013 |
| 075 | 全件を公開日時降順表示 | bound | W0-162,X-011 (shared) |
| 076 | 公開日時による絞り込みをしないこと | bound | W0-162 (shared) |
| 077 | 二次キャッシュを削除すること | **TBD**（L1-038） | — |
| 078 | Doctrineイベントで日時設定されること | bound | W0-104,W0-116 (shared) |
| 079 | 楽観ロックを持たないこと（最後勝ち） | bound | W0-130 |
| 080 | GET/POST/DELETE相当のリクエストであること | bound | X-010,X-043,X-052 (shared) |
| 081 | 告知1件であること | bound | X-032,W0-151 (shared) |
| 082 | エラーなく継続（公開日時表示） | bound | W0-160 |
| 083 | フロントへ表示するか否かの区分 | bound | X-042,W0-103 (shared) |
| 084 | エラーなく継続（別ウィンドウ表示） | bound | X-022 (shared) |
| 085 | 公開日時の新しい順に並ぶこと | bound | X-011 (shared) |
| 086 | 1ページ10件単位で表示すること | bound | X-012 (shared) |
| 087 | 検証成功で保存・成功メッセージ・遷移 | bound | X-043(+EN) |
| 088 | **正規トークンを伴う削除リクエストが送信されること** | bound | **X-051** (shared)（肯定側=是正。news.twig:92 csrf_token_for_anchor） |

`func_scope_check` 判定: 親88/88会計済み・欠落0・理由なし重複0・補完18行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

改訂1どおり: TBD=064（浄化）・077（キャッシュ観測）／要実機=FK誘発（065/071→X-053）・
管理画面en切替（-EN12行・D15）・ログ観測（X-060/W0-150=補完行・実行保留・L1-040は設計書由来で
コード立証なし）／excluded=EX-A18+EX-B4+EX-C2／候補規律=`@TBD-D5`・O5未確定・実装/実走なし。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

改訂1どおり（対象極性対の列挙・claim別判定・codexレビューが069/004等の取り違えを検出した記録）。
**改訂2追記**: 088の極性取り違え（肯定=正規トークン送信 を 否定=改変トークン拒否 X-052 へ誤bind）を
codex R2が検出・X-051へ是正。C4-manualの検出実績として本節に追加記録する（未検出の可能性は残る）。
