# W2候補: m03-22 購入グループ管理 — 実行可能グレード候補（母集合87全量踏破・現行踏襲=pf挙動オラクル）

> 2026-07-29 ／ **候補グレード（candidate・D6前）・区分=現行踏襲（fid_kubun.tsv:189）** ／
> Gate自己監査体制（`integration_test/CONCRETIZATION_GATES.md` B1-B15）に基づく・codexレビューR1〜R5是正反映。
>
> **母集合87全数会計＝bound 32／TBD 8／excluded 47（欠番0）**。更新系（購入グループ 登録/編集/論理削除）。
>
> **改訂5（codex Gate C R6・Major2件是正。会計不変 bound32/TBD8/excluded47）**:
> - **(M1・source_class純度/原子分離) excel claim を Excel逐語のみに徹底**: L1-014 の逐語 quote に **予約商品フラグ を復元**（Excel 9423 原文はロード対象に (1)名称日 (2)名称英 **(3)予約商品フラグ** (4)メモ (7)支払 (8)配送 を含む）。L1-011/012 の「複数選択（展開チェックボックス）」= pf フォーム事実（SellGroupType.php:60）を excel claim から除去し、当該 pf フォーム挙動（entity expanded multiple）は既存 pf-fallback claim **L1-021（M2M保存）/L1-025（許容外拒否）** に原子分離済み。L1-007/008/010/015 からも pf クロス参照（config一致・pf twig route）を除去し **1claim1source** を徹底（excel=Excel逐語のみ／pf実装事実=pf-fallback）。
> - **(M2・B4 en全キー grep 確定)**: 本機能で使う全メッセージキーを ee `messages.en.yaml`・`validators.en.yaml`・vendor `validators.en.xlf` で grep し en 有無を確定。**admin.register.complete=Registration completed.(1676)／admin.register.failed=Registration failed.(1677)** が実在＝L1-003/004/005 を **LS≠0** 化し §5 に en 逐語追加。sellgroup.delete.failed・admin.confirm.delete は ee en グリップ 0＝英訳なし確定。NotBlank/Length の en は既存維持。
>
> **改訂4（codex Gate C R5・Major2件是正。会計 bound37/TBD3/excluded47 → bound32/TBD8/excluded47＝87不変）**:
> - **(M1・source_class純度/B3/B15) 挙動オラクルをpf実装へ全面是正**: 旧draftのpf-fallback claimが実質 EE（ec-cube-enterprise＝SUT）挙動で、pf現行（回帰オラクル）と食い違っていた。区分=**現行踏襲**につき pf-eccube3 HareruyaEc プラグイン実コードを挙動の正とし、各claimを file:line で再同定した（旧 functions/pf-eccube3/m03-22_…md は EE挙動記述のため挙動オラクルに使わない）。主な是正:
>   - **create/update は同一 update() 処理**（SellGroupServiceProvider.php:20,23／SellGroupController.php:44）。成功時フラッシュ **admin.register.complete『登録が完了しました。』** を積み **編集画面（admin_sell_group_edit＝GET /sell_group/{id}）へリダイレクト**（一覧ではない・Controller:71-75）。
>   - **削除成功はフラッシュ無し**で deleted_at 設定→一覧へ（Controller:103-107）。「削除しました」は EE。
>   - **削除拒否は admin.sellgroup.delete.failed『この購入グループは商品で使用されているため、 %s は削除することができません。』**（Controller:97-101／message.ja.yml:1257）。
>   - **検証失敗は admin.register.failed『登録できませんでした。』→同一テンプレ再表示**（Controller:54-61）。
>   - **削除確認は EC-CUBE3 共通アンカー方式**（data-method="delete"＋csrf_token_for_anchor＋data-message=admin.confirm.delete・sell_group.twig:77）で、EE の Bootstrap モーダル data-url コピーではない。
>   - **member_id は無条件設定**（Controller:66・運用アカウント種別条件は EE）。
>   - **予約商品フラグは pf の twig/form に不在**（SellGroupType/ sell_group.twig に無し）。Excel の★カスタマイズ追加（0204:9433）のみ＝§10隔離（現行pfに実装が無く回帰テスト対象外）。
>   - パスは pf では **/sell_group**（EE の /product/sell_group ではない）。
>   - **pfに無く Excel も規定なしの EEのみ挙動 → TBD**: 既削除ID編集→対象未取得エラー（-060,-078＝pf に該当処理なし）／成功→一覧の一律遷移（-074,-075＝pf create/update は編集画面へ）／配送選択肢の表示フラグ・降順（-018＝pf deliveries は query_builder 無しで無フィルタ）。
> - **(M2・B6) 画面期待と内部検証の分離**: 正確な遷移URL（admin_sell_group_edit 等）・HTTPステータス（200/403/302）は **自動検証(内部)列へ**移し、画面期待は目視可能な画面（フラッシュ文言・編集フォーム・一覧・確認ダイアログ）に限定した（C-005/006/007/008/009/012/016 等）。
>
> **廃番候補（R3〜R5）**: C-002（毎GET再構築・-063 TBD）／C-003（非削除フィルタ・-069 TBD）／C-015（edit_not_found・-060/-078 TBD）／C-020（配送選択肢・-018 TBD）／C-021・C-024（成功→一覧の一律遷移・-074/-075 TBD）。**現行 bound 候補は C-001,C-004〜C-014,C-016〜C-019,C-022,C-023 の18候補**（C-002,003,015,020,021,024 は欠番）。
>
> **Gate B自己監査（B1-B15・R5反映要旨）**:
> - **B3/B15（最重要）**: pf 実コードで裏付く挙動のみ pf-fallback で bound（期待値を pf 実挙動に一致）。pf に無く Excel 規定も無い EE のみ挙動は TBD（8件）。入力項目値（必須・最大長・初期値・予約フラグ追加）は Excel 源。
> - **B6/B9/B10**: 正確URL・HTTPコード・DB照会は自動検証(内部)、操作は純UI、画面期待は目視可能な帰結のみ。
> - **B7**: 検索条件13（019-031）＝一覧に検索機能なし。相関4（012-015）・DB相関の正例（016）＝単項目制約のみ。
> - **B14**: -073（未認証→共通ルール誘導）＝共通認証委譲・M03-01代表。
>
> **実装/実走なし。O5未確定。承認・O6・聖域・多軸join は主張しない**。fixture_version は全て `@TBD-D5`。**著者はレビューしない**（codexが別途レビュー）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m03-22_admin_product_product_sell_group_oracle_draft.json`。

## §0 版固定

- **pf現行実コード（挙動オラクルの正・source_class=pf-fallback）**: `pf-eccube3/app/Plugin/HareruyaEc/` の
  `Controller/Admin/SellGroupController.php`（index/update/delete）・`ServiceProvider/Admin/SellGroupServiceProvider.php`（ルート）・
  `Resource/template/admin/SellGroup/sell_group.twig`（画面）・`Form/Type/Admin/SellGroup/SellGroupType.php`（フォーム）・
  `Entity/MtbSellGroup.php`（create_date 初期化）・`Repository/MtbSellGroupRepository.php`・`Controller/FormValidHelper.php`（CSRF）・
  `Repository/PaymentRepository.php`（支払選択肢）・`Resource/locale/message.ja.yml`・`config.yml`（length）。区分=**現行踏襲**。
  ※`functions/pf-eccube3/m03-22_admin_product_product_sell_group.md` は EE挙動を記述しており**挙動オラクルには使用しない**（R5で判明）。
- **Excel基本設計（入力項目値の正・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html` sheet-38=購入グループ管理
  （機能No M03-22・画面項目一覧 識別ID1〜14=0204:9431-9444）。名称(日/英) 必須・最大255／メモ 任意・最大1024／予約商品フラグ★カスタマイズ追加。
- **ee（SUT・オラクル不使用）**: ec-cube-enterprise は system-under-test。EE挙動を pf-fallback に書かない。共有インフラ（Symfony validator 英訳等）逐語のみ §5 で照合。
- **方針**: 挙動は pf 実コード（file:line）を正、入力項目値は Excel。pf に無く Excel も無い EE のみ挙動は TBD（B15）。standard-src は付与しない。
- 母集合: `integration_test/all_it_cases.tsv` の M03-22 全**87行**（IT-M03-22-ADMIN-PRODUCT-PRODUCT-SELL-GROUP-001〜087・欠番0・重複0）。
- **判定原則**: bind は各行の**「期待結果」実テキスト**で判定（観点ラベルはノイズ＝§8.1観点補正）。

## §1 L1原子オラクル表

全22claim。**source_class列は excel（7件: 007,008,010,011,012,014,015）／pf-fallback（15件）のみ**。挙動claimはpf実コードのfile:line、入力項目値はExcel逐語。
（旧 L1-009 予約フラグ・013 選択肢並び・018 edit_not_found・022 一律遷移・024 行ハイライトは R5 で EE挙動/pf不在のため削除＝欠番）。

| oracle_id | claim_type | claim | 逐語quote | 根拠(file:line) | source_class | LS |
|-----------|-----------|-------|-----------|-----------------|--------------|----|
| L1-M0322-001 | screen_display | GET /{admin_route}/sell_group は上部に新規登録フォーム（名称日/英・メモ・支払方法・配送方法＋登録ボタン）、下部に一覧表（名称日リンク・名称英・メモ・支払方法・配送方法・削除の6列）。行が無ければヘッダのみ | index(): findAll()→sell_group.twig render／ twig 上部form＋下部table（6列）・{% for sellGroup in sellGroups %} | pf SellGroupController.php:21-35／sell_group.twig:14-88 | pf-fallback | ja |
| L1-M0322-002 | screen_display | タイトル「購入グループ管理」・サブタイトル「購入グループ編集」（常時固定）・サブ右に一覧への「新規登録」リンク・ナビは商品管理(product)と購入グループ(sell_group_list)をハイライト | {% set menus = ['product','sell_group_list'] %}／ title 購入グループ管理／ sub_title 購入グループ編集＋新規登録リンク | pf sell_group.twig:3,5,6 | pf-fallback | ja |
| L1-M0322-003 | persist_success | 新規登録(POST /sell_group=admin_sell_group_new→update())が妥当→update_date/member_id設定→persist+flush→admin.register.complete「登録が完了しました。」→編集画面(admin_sell_group_edit)へリダイレクト(一覧でない) | setUpdateDate/setMemberId; persist; flush; addSuccess('admin.register.complete'); redirect(url('admin_sell_group_edit',['id'=>id]))／ 登録が完了しました。 | pf SellGroupController.php:44,64-75／message.ja.yml:83 | pf-fallback | ja+en（§5・messages.en.yaml:1676・oracle ls:1） |
| L1-M0322-004 | persist_success | 編集(POST /sell_group/{id}=admin_sell_group_update)も同一update()。当該id行にupdate_dateのみ現在時刻・member_id設定→flush→登録が完了しました。→編集画面へ(作成日時不変) | 同一update()ハンドラ。id指定はfindOneBy(['id'=>id])。setUpdateDate(now)(createDate触らず)。redirect(admin_sell_group_edit) | pf SellGroupController.php:44,46,64-75 | pf-fallback | ja+en（§5・messages.en.yaml:1676・oracle ls:1） |
| L1-M0322-005 | validation | フォーム不正(名称日/英 未入力=NotBlank違反等)→admin.register.failed「登録できませんでした。」を積み同一テンプレ再表示(リダイレクトせず画面に留まる)・未入力項目直下にNotBlankエラー「入力されていません。」 | if(!isFormValid){addError('admin.register.failed'); return render(sell_group.twig);}／ 登録できませんでした。／ name/name_en NotBlank | pf SellGroupController.php:54-61／message.ja.yml:84／SellGroupType.php:34,47 | pf-fallback | ja+en（§5・messages.en.yaml:1677・oracle ls:1） |
| L1-M0322-006 | validation | 名称日/英が最大255超過→Symfony Length失敗→admin.register.failed「登録できませんでした。」を積み同一テンプレ再表示(保存しない)・フィールド直下にLength超過エラー | SellGroupType name/name_en [Length(max=255),NotBlank](config name=255)。isFormValid=false→addError('admin.register.failed')→再表示 | pf SellGroupType.php:33,45／config.yml:252／SellGroupController.php:54-61 | pf-fallback | ja+en（§5・validators.en.xlf・oracle ls:1） |
| L1-M0322-007 | input_field | 名称（日）は必須で最大255文字（Excel識別ID1） | 名称（日）｜（必須）◯｜（最大値）255文字（識別ID1・0204:9431） | 0204:9431 | excel | ja |
| L1-M0322-008 | input_field | 名称（英）は必須で最大255文字（Excel識別ID2） | 名称（英）｜（必須）◯｜（最大値）255文字（識別ID2・0204:9432） | 0204:9432 | excel | ja |
| L1-M0322-010 | input_field | メモは任意で最大1024文字（Excel識別ID4） | メモ｜（必須）-｜（最大値）1024文字（識別ID4・0204:9434） | 0204:9434 | excel | ja |
| L1-M0322-011 | input_field | 支払方法（識別ID7）は任意で、支払方法設定画面で定めたマスタを参照して表示する | 支払方法｜支払方法設定画面で定めたものをマスターとして参照して表示（識別ID7・0204:9437） | 0204:9437 | excel | ja |
| L1-M0322-012 | input_field | 配送方法（識別ID8）は任意で、配送方法設定画面で定めたマスタを参照して表示する | 配送方法｜配送方法設定画面で定めたものをマスターとして参照して表示（識別ID8・0204:9438） | 0204:9438 | excel | ja |
| L1-M0322-014 | input_field | 名称（日）（識別ID9）を押下すると、名称(日)・名称(英)・予約商品フラグ・メモ・支払方法・配送方法にその行のデータがロードされて編集可能になる | 名称（日）｜押下で(1)~(5)に選択行の内容を反映（識別ID9・0204:9439,9423）／ 名称(日)(9)を押すと、名称(日)(1),名称(英)(2),予約商品フラグ(3),メモ(4),支払方法(7),配送方法(8)にその行のデータがロードされてデータ編集可能になる | 0204:9439,9423 | excel | ja |
| L1-M0322-015 | screen_display | 新規登録ボタン（識別ID5）は、押下で入力内容をクリアし初期表示に戻る | 新規登録ボタン｜入力内容をクリアし初期表示に戻る（識別ID5・0204:9435） | 0204:9435 | excel | ja |
| L1-M0322-016 | delete | 商品未紐づきの削除(DELETE /sell_group/{id}/delete)はdeleted_atを現在時刻に設定しflush(論理削除)、フラッシュは積まず一覧へリダイレクト | delete(): getProductSubs()==0→setDeletedAt(now); flush(); redirect(admin_sell_group_list)（成功addSuccess無し） | pf SellGroupController.php:85,103-107 | pf-fallback | ja |
| L1-M0322-017 | delete | 商品使用中(getProductSubs()>0)は削除せず admin.sellgroup.delete.failed「この購入グループは商品で使用されているため、 %s は削除することができません。」(%s=グループ名)を積み一覧へリダイレクト | if(count(getProductSubs())>0){addError(sprintf(trans('admin.sellgroup.delete.failed'),name)); redirect(admin_sell_group_list);}／ この購入グループは商品で使用されているため、 %s は削除することができません。 | pf SellGroupController.php:97-101／message.ja.yml:1256-1257 | pf-fallback | ja |
| L1-M0322-019 | csrf | 削除要求は先頭で共通CSRFトークン検証し、無効ならAccessDeniedHttpExceptionでアクセス拒否(HTTP403)・削除は実行されない | delete(): checkCsrfValid()／ if(!isTokenValid())throw new AccessDeniedHttpException('CSRF token is invalid.') | pf SellGroupController.php:87／FormValidHelper.php:39-45 | pf-fallback | ja |
| L1-M0322-020 | js | 一覧各行の削除ボタンはEC-CUBE3共通の削除アンカー方式(csrf_token_for_anchor()・data-method="delete"・data-message=admin.confirm.deleteをグループ名整形)で、押下で共通スクリプトが確認ダイアログ表示＋疑似DELETE送信＋CSRF付与(Bootstrapモーダルdata-urlコピーは無い) | twig: <a ... {{ csrf_token_for_anchor() }} data-method="delete" data-message="{{ trans('admin.confirm.delete')|format(sellGroup.name) }}">{{ trans('admin.btn.delete') }}</a> | pf sell_group.twig:77-79 | pf-fallback | ja |
| L1-M0322-021 | persist_mapping | 支払方法・配送方法はentity型の複数選択(expanded multiple)で送信選択集合がMtbSellGroupの関連(中間表 dtb_sell_group_payment/dtb_sell_group_delivery)へ差し替え反映(persist+flushカスケード)・未選択許容 | SellGroupType payments/deliveries entity expanded multiple required=false; controller persist+flush | pf SellGroupType.php:60-79／SellGroupController.php:68-69 | pf-fallback | ja |
| L1-M0322-023 | timestamp | 新規はエンティティ構築時にcreate_dateを現在時刻で初期化し保存時にupdate_dateを現在時刻設定(新規はcreate≒update≒現在時刻)。更新は既存create_date不変でupdate_dateのみ現在時刻 | MtbSellGroup::__construct(): createDate=date(now)／ controller setUpdateDate(now)(createDate触らず) | pf MtbSellGroup.php:80-85／SellGroupController.php:64-65 | pf-fallback | ja |
| L1-M0322-025 | validation | 支払/配送はentity型(表示対象マスタ由来の選択肢に限定)で、選択肢一覧外のidを送信するとSymfonyが許容リスト外拒否→admin.register.failedで同一テンプレ再表示(許容外idは保存されない) | payments entity class Payment query_builder=loadEcPaymentQueryBuilder()(del_flg=0・rank DESC)、deliveries entity class Delivery。entity型は許容リスト外を拒否 | pf SellGroupType.php:60-79／PaymentRepository.php:24-31 | pf-fallback | ja |
| L1-M0322-026 | persist_mapping | 保存(新規/更新)時、member_idにログイン中の管理者(securityトークンのユーザ)のidを無条件に設定してflush | setUpdateDate(now)->setMemberId($app['security']->getToken()->getUser()->getId())(条件分岐なし=無条件) | pf SellGroupController.php:64-66 | pf-fallback | ja |
| L1-M0322-027 | delete | 一覧の削除ボタンからの通常削除要求はEC-CUBE3共通の疑似DELETE送信(data-method="delete")＋csrf_token_for_anchor()のCSRFトークン付与を伴いadmin_sell_group_delete(DELETE /sell_group/{id}/delete)へ送信 | twig: <a href="admin_sell_group_delete" {{ csrf_token_for_anchor() }} data-method="delete">／ ServiceProvider: $app->delete('/sell_group/{id}/delete')->bind('admin_sell_group_delete') | pf sell_group.twig:77／SellGroupServiceProvider.php:27-29 | pf-fallback | ja |

## §2 SEED（fixture）

全fixtureは `@TBD-D5`。SEEDコードは前提/入力から参照。削除拒否ケースのグループ名は**期待に埋め込む既知の実値**。

| SEED | 内容（既知値） | 用途(候補ケース) |
|------|------|------------------|
| SEED-M01-ADMIN | 管理画面の管理者ログインアカウント（共通認証・当ルート到達可・security トークンの Member） | 全bound（ログイン前提） |
| SEED-M0322-SG-1 | 既存購入グループ1件（name=編集元グループ／name_en=EditSource／memo=既存メモ／支払・配送一部選択済） | C-006,C-009,C-010,C-018,C-019,C-022,C-023 |
| SEED-M0322-SG-LIST | 主キーの異なる複数購入グループ（一覧確認用） | C-004 |
| SEED-M0322-SG-EMPTY | 購入グループが0件（一覧が空になる状態） | C-001（空一覧の初期表示） |
| SEED-M0322-SG-DELETABLE | 商品に未使用の削除可能な購入グループ1件（name=削除可能グループ） | C-012,C-013,C-016,C-017 |
| SEED-M0322-SG-INUSE | 商品（getProductSubs参照）が使用する購入グループ（**name=使用中グループ**） | C-014（商品使用中で削除拒否） |
| SEED-M0322-PAY-DLV | del_flg=0 の支払方法（rank降順）・配送方法マスタ複数（＋許容外の非表示/存在しないid） | C-018,C-019 |

## §4 実行可能グレード14列TSV（候補・bound 18候補・自己完結／C-002/003/015/020/021/024は廃番=欠番）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `{admin_route}` は環境値（既定 `admin`）。pf のパスは `/sell_group`（EE の /product/sell_group ではない）。
- テストIDは `E2E-M0322C-NNN`（末尾NNN＝候補 C-NNN。§8対応表の C-ref と一致）。
- 画面期待は目視可能な画面（フラッシュ文言・編集フォーム・一覧・確認ダイアログ）に限定。正確な遷移URL・HTTPステータス・DB照会は `／ 自動検証(内部): …` へ（B6/B9）。操作手順は純UI（B10）。
- pf 挙動: 登録/更新成功＝**「登録が完了しました。」→編集画面**／検証失敗＝**「登録できませんでした。」→同一画面**／削除成功＝**フラッシュ無し→一覧**／削除拒否＝**「…商品で使用されているため、 グループ名 は削除することができません。」→一覧**。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-22_admin_product_product_sell_group	E2E-M0322C-001	IT-M0322	画面表示	P2	空一覧の初期表示（行が無いとき表ヘッダのみ・上部フォームは表示）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-EMPTY（0件）	なし（GET /{admin_route}/sell_group）	1. 購入グループ管理画面を開く 2. 上部フォームと下部一覧を確認	上部に新規登録フォーム（名称(日)・名称(英)・メモ・支払方法・配送方法の入力欄と登録ボタン）が表示され、下部の一覧表はデータ行が無くヘッダ（名称(日)・名称(英)・メモ・支払方法・配送方法・削除）のみで描画される [L1:L1-M0322-001; fixture:SEED-M0322-SG-EMPTY@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-004	IT-M0322	画面表示	P2	画面タイトル「購入グループ管理」・サブタイトル・ナビハイライト	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-LIST	なし（GET /{admin_route}/sell_group）	1. 購入グループ管理画面を開く 2. タイトル・サブタイトル・メニューのハイライトを確認	ページタイトルに「購入グループ管理」、サブタイトルに「購入グループ編集」とその右に「新規登録」リンクが表示され、メニューの商品管理グループおよび購入グループ用ナビ項目がハイライトされる [L1:L1-M0322-002; fixture:SEED-M0322-SG-LIST@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-005	IT-M0322	登録内容	P1	新規購入グループ登録の成功（登録が完了しました。→編集画面・保存）	ログイン済(SEED-M01-ADMIN)	名称(日)=テストグループ／名称(英)=TestGroup／メモ=新規メモ／支払方法・配送方法を各1件選択	1. 新規フォームに上記を入力 2. 登録ボタンを押下 3. メッセージ・遷移先の画面・再表示を確認	「登録が完了しました。」が管理画面上部に表示され、登録した内容（名称(日)「テストグループ」・名称(英)「TestGroup」・メモ・支払/配送の選択）がフォームにロードされた編集画面が表示される（一覧ではなく編集画面） ／ 自動検証(内部): admin.register.complete フラッシュ・admin_sell_group_edit（GET /{admin_route}/sell_group/{id}）へ302リダイレクト・mtb_sell_group に1件追加 [L1:L1-M0322-003,L1-M0322-007,L1-M0322-008,L1-M0322-010; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-006	IT-M0322	更新内容	P1	既存購入グループの編集更新の成功（名称リンク→変更→登録が完了しました。→反映）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	名称(日)=更新後グループ名／メモ=更新後メモ	1. 一覧の名称(日)リンクで当該グループの編集画面に入る 2. 名称(日)・メモを変更 3. 登録ボタンを押下 4. 再表示を確認	「登録が完了しました。」が表示され、更新値（名称(日)「更新後グループ名」・メモ）がフォームに反映された編集画面が表示される ／ 自動検証(内部): admin_sell_group_edit へリダイレクト・当該id行の update_date のみ現在時刻に更新（create_date 不変） [L1:L1-M0322-004; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-007	IT-M0322	必須バリデーション	P1	名称(日/英)必須検証失敗（未入力→非追加・画面に留まる）	ログイン済(SEED-M01-ADMIN)	名称(日)を空（必須違反）／名称(英)は入力	1. 新規フォームで名称(日)を空のまま登録ボタンを押下 2. メッセージ・再描画・一覧を確認	「登録できませんでした。」が管理画面上部に、名称(日)の項目直下に「入力されていません。」が表示され、リダイレクトせず一覧付き同一の購入グループ管理画面に留まり、当該グループは一覧に追加されない ／ 自動検証(内部): admin.register.failed・非リダイレクト（同一テンプレ render・HTTP200）・mtb_sell_group 未追加 [L1:L1-M0322-005,L1-M0322-007,L1-M0322-008; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-008	IT-M0322	文字列長バリデーション	P2	新規: 名称(日)が最大長+1(256文字)で検証エラーとなり追加されない	ログイン済(SEED-M01-ADMIN)	名称(日)=256文字（最大255+1）／名称(英)=TestGroup	1. 新規フォームの名称(日)に256文字を入力し登録ボタンを押下 2. メッセージ・再描画・一覧を確認	「登録できませんでした。」が管理画面上部に、名称(日)の項目直下に最大255超過の検証エラーが表示され、リダイレクトせず同一画面に留まり、当該グループは一覧に追加されない ／ 自動検証(内部): Length(255)違反・非リダイレクト（HTTP200）・未保存 [L1:L1-M0322-006,L1-M0322-007; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-009	IT-M0322	文字列長バリデーション	P2	更新: 名称(日)を最大長+1(256文字)へ変更しても更新されない	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	名称(日)=256文字（最大255+1）	1. 一覧の名称(日)リンクで編集画面に入る 2. 名称(日)を256文字へ変更し登録ボタンを押下 3. メッセージ・再描画を確認	「登録できませんでした。」が管理画面上部に、名称(日)の項目直下に検証エラーが表示され、リダイレクトせず同一画面に留まり、当該グループの名称は更新されない ／ 自動検証(内部): Length(255)違反・非リダイレクト（HTTP200）・当該行 name 不変 [L1:L1-M0322-006,L1-M0322-008; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-010	IT-M0322	画面表示	P1	一覧の名称(日)リンク押下で編集画面（値ロード）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	なし（一覧の名称(日)リンク＝編集元グループ）	1. 一覧の名称(日)リンクを押下 2. 編集画面とフォームへの値ロードを確認	当該グループの編集画面が表示され、名称(日)「編集元グループ」・名称(英)「EditSource」・メモ・支払方法・配送方法にその行のデータがロードされて編集可能になる ／ 自動検証(内部): GET /{admin_route}/sell_group/{id}（admin_sell_group_edit）へ遷移 [L1:L1-M0322-014; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-011	IT-M0322	画面表示	P1	「新規登録」リンクで初期表示（新規入力）に戻る	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	なし（サブタイトル右「新規登録」リンク）	1. 一覧の名称(日)リンクで編集画面に入る（フォームに既存値） 2. 「新規登録」リンクを押下 3. フォーム状態を確認	入力内容がクリアされ初期表示（空の新規入力フォーム）に戻る ／ 自動検証(内部): GET /{admin_route}/sell_group（admin_sell_group_list）へ遷移 [L1:L1-M0322-015; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-012	IT-M0322	削除条件	P1	商品に使用されていない購入グループの削除成功（一覧から消える・成功フラッシュなし）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-DELETABLE	なし（一覧の削除ボタン＝削除可能グループ）	1. 一覧で当該グループの削除ボタンを押下 2. 確認ダイアログでOK 3. 遷移先の画面・一覧を確認	一覧画面が表示され、当該グループが一覧から消える（削除成功のフラッシュメッセージは表示されない） ／ 自動検証(内部): deleted_at が現在時刻に設定される論理削除・admin_sell_group_list へリダイレクト・成功フラッシュなし [L1:L1-M0322-016; fixture:SEED-M0322-SG-DELETABLE@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-013	IT-M0322	削除条件	P2	通常削除要求は疑似DELETE method＋共通CSRFトークンを伴う	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-DELETABLE	なし（一覧の削除ボタン→確認ダイアログOK）	1. 一覧の削除ボタンを押下 2. 確認ダイアログでOK 3. 送信された削除要求を確認	削除が実行され当該グループが一覧から消える ／ 自動検証(内部): 送信要求が data-method="delete"（EC-CUBE3共通スクリプトの疑似DELETE送信）と csrf_token_for_anchor() による共通CSRFトークン付与を伴う（admin_sell_group_delete へ） [L1:L1-M0322-027; fixture:SEED-M0322-SG-DELETABLE@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-014	IT-M0322	削除条件	P1	商品に使用されている購入グループの削除拒否（グループ名含むエラー→一覧へ・非削除）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-INUSE（name=使用中グループ・商品が使用）	なし（一覧の削除ボタン＝使用中グループ）	1. 一覧で「使用中グループ」の削除ボタンを押下 2. 確認ダイアログでOK 3. メッセージ・一覧を確認	削除は拒否され「この購入グループは商品で使用されているため、 使用中グループ は削除することができません。」が管理画面上部に表示され、一覧へ戻り「使用中グループ」は一覧に残る ／ 自動検証(内部): 当該グループの deleted_at は null のまま（削除されず残存） [L1:L1-M0322-017; fixture:SEED-M0322-SG-INUSE@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-016	IT-M0322	入力検証	P3	CSRFトークン無効の削除要求はアクセス拒否（HTTP403）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-DELETABLE	CSRFトークンを無効化した DELETE /{admin_route}/sell_group/{id}/delete 要求	1. CSRFトークンを欠く/改ざんした状態で削除要求を送る 2. 応答を確認	アクセス拒否となり削除は実行されない（当該グループは一覧に残る） ／ 自動検証(内部): checkCsrfValid が AccessDeniedHttpException を投げ HTTP403・deleted_at 不変 [L1:L1-M0322-019; fixture:SEED-M0322-SG-DELETABLE@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-017	IT-M0322	JS挙動	P2	削除確認（共通アンカー方式・data-message にグループ名）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-DELETABLE（name=削除可能グループ）	なし（一覧の削除ボタン）	1. 一覧の削除ボタンを押下 2. 表示された確認ダイアログの文言を確認	押下すると EC-CUBE3 共通スクリプトの確認ダイアログが表示され、本文にグループ名「削除可能グループ」を含む削除確認メッセージ（admin.confirm.delete をグループ名で整形）が出る（キャンセルで閉じる・本テンプレ専用の Bootstrap モーダルは無い） ／ 自動検証(内部): 削除アンカーに data-method="delete"・data-message・csrf_token_for_anchor() が付与されている [L1:L1-M0322-020; fixture:SEED-M0322-SG-DELETABLE@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-018	IT-M0322	更新内容	P1	支払方法・配送方法の選択保存（中間表反映・再表示で選択状態）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1／SEED-M0322-PAY-DLV	支払方法=2件選択／配送方法=1件選択（変更）	1. 一覧の名称(日)リンクで編集画面に入る 2. 支払方法・配送方法のチェックを変更 3. 登録ボタンを押下 4. 再表示で選択状態を確認	「登録が完了しました。」が表示され、再表示された編集フォームで支払方法は選択した2件、配送方法は選択した1件がチェック状態で表示される ／ 自動検証(内部): 中間表 dtb_sell_group_payment／dtb_sell_group_delivery が送信選択集合へ差し替え反映（Many-to-many） [L1:L1-M0322-011,L1-M0322-012,L1-M0322-021; fixture:SEED-M0322-PAY-DLV@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-019	IT-M0322	入力検証	P2	支払/配送に許容外IDを送信すると拒否され保存されない（entity型・NotBlankは満たす）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1／SEED-M0322-PAY-DLV	名称(日)=規格グループ／名称(英)=SpecGroup（NotBlankを満たす妥当値）／支払方法に許容リスト外（非表示/存在しない）payment_id を指定	1. 一覧の名称(日)リンクで SEED-M0322-SG-1 の編集画面に入る 2. 名称(日)(英)を妥当な値のまま、支払方法に許容リスト外のidを含む更新要求を送信する 3. 応答画面と、当該グループの編集画面を再表示して支払方法の選択状態を確認する	名称は妥当なため必須エラーにはならず、「登録できませんでした。」が表示されて同一画面に留まり、編集画面を再表示しても当該グループの支払方法に許容外idの選択は反映されない（元の選択のまま） ／ 自動検証(内部): entity 型が許容リスト外を拒否・admin.register.failed で非保存・中間表 dtb_sell_group_payment の当該グループ行は不変 [L1:L1-M0322-025; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-022	IT-M0322	副作用	P1	作成日時・更新日時の付与規則（新規は両日時現在時刻・更新は更新日時のみ）	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	新規: 名称(日)=日時確認グループ／名称(英)=DateCheck／更新: SEED-M0322-SG-1 の名称(日)を変更	1. 新規登録し「登録が完了しました。」を確認 2. 既存グループを編集更新し「登録が完了しました。」を確認	いずれも「登録が完了しました。」が管理画面上部に表示される（作成日時/更新日時は画面に表示されない） ／ 自動検証(内部・DB): 新規は create_date（エンティティ構築時）と update_date（保存時）が現在時刻、更新の成功保存では create_date は変更せず update_date のみ現在時刻に更新される [L1:L1-M0322-023,L1-M0322-004; fixture:SEED-M0322-SG-1@TBD-D5]				
m03-22_admin_product_product_sell_group	E2E-M0322C-023	IT-M0322	副作用	P1	保存時に更新者列 member_id へログイン管理者を無条件記録	ログイン済(SEED-M01-ADMIN)／SEED-M0322-SG-1	新規: 名称(日)=更新者確認グループ／名称(英)=MemberCheck／更新: SEED-M0322-SG-1 の名称(日)を変更	1. 新規登録し「登録が完了しました。」を確認 2. 既存グループを編集更新し「登録が完了しました。」を確認	いずれも「登録が完了しました。」が管理画面上部に表示される（member_id は画面に表示されない） ／ 自動検証(内部・DB): 保存後の mtb_sell_group.member_id にログイン管理者（SEED-M01-ADMIN の security トークンのユーザ）のidが無条件に記録される [L1:L1-M0322-026,L1-M0322-004; fixture:SEED-M0322-SG-1@TBD-D5]				
```

## §8 母集合87行 全数会計対応表

> 会計: bound 32／TBD 8／excluded 47（=87・欠番0）

| NNN | 区分 | マップ/理由 |
|-----|------|-------------|
| 001 | bound | C-012（期待「deleted_at を現在時刻に更新する論理削除」＝pf削除成功。観点CSRFは誤・B8補正） |
| 002 | excluded | 期待「同一の列名」＝純内部移行事実（画面観測不能・B15②） |
| 003 | bound | C-004（期待「画面上部タイトルは購入グループ管理相当」＝タイトル表示） |
| 004 | bound | C-010（期待「当該行がハイライトされ、フォームが編集状態になる」のうち pf 実挙動＝名称リンクで編集画面に値ロード。行ハイライトは EE のため期待から除外） |
| 005 | bound | C-011（期待「編集中状態を捨て、新規入力に戻る」＝新規登録リンク） |
| 006 | bound | C-005（期待「成功時…成功メッセージ」＝pf新規登録成功。遷移先は pf 実挙動の編集画面に是正） |
| 007 | bound | C-006（期待「同上」＝フォーム送信(更新)は新規と同一 update()＝更新成功） |
| 008 | bound | C-013（期待「共通CSRF付き削除要求」＝pf疑似DELETE＋共通CSRF） |
| 009 | bound | C-007（期待「必須バリデーションでエラーが表示され、対象処理が完了しない」＝名称必須違反） |
| 010 | excluded | 汎用スタブ「必須でエラー表示されず継続できる」＝検証成功継続はC-005被覆（B15④） |
| 011 | bound | C-017（期待は削除確認の JS 挙動＝pf 共通アンカー方式に是正。観点文字列長は誤・B8補正） |
| 012 | excluded | 相関バリデーション＝本機能に項目間相関なし（名称のNotBlank＋最大長のみ）・母集合テンプレ由来（B7） |
| 013 | excluded | 相関バリデーション＝同上 |
| 014 | excluded | 相関バリデーション＝同上 |
| 015 | excluded | 相関バリデーション＝同上 |
| 016 | excluded | DBとの相関バリデーション「該当する値→継続」＝許容内ID選択の正例＝C-018被覆（B15④） |
| 017 | bound | C-019（前提=許容外値＝支払/配送の許容外ID送信→entity型拒否・非保存） |
| 018 | TBD | 期待「配送方法の選択肢を表示フラグ条件で絞り並び項目で降順に並べる」＝配送方法の選択肢に表示対象フィルタや降順並びを適用するかが現行実装で一意に確認できず要仕様確認 |
| 019 | excluded | 検索条件＝一覧に検索機能なし・母集合テンプレ由来（B7） |
| 020 | excluded | 検索条件＝同上 |
| 021 | excluded | 検索条件＝同上 |
| 022 | excluded | 検索条件＝同上 |
| 023 | excluded | 検索条件＝同上 |
| 024 | excluded | 検索条件＝同上 |
| 025 | excluded | 検索条件＝同上 |
| 026 | excluded | 検索条件＝同上 |
| 027 | excluded | 検索条件（汎用スタブ）＝同上 |
| 028 | excluded | 検索条件（汎用スタブ）＝同上 |
| 029 | excluded | 検索条件（汎用スタブ）＝同上 |
| 030 | excluded | 検索条件（汎用スタブ）＝同上 |
| 031 | excluded | 検索条件（汎用スタブ）＝同上 |
| 032 | excluded | 汎用スタブ「実行結果の該当レコードが含まれる」＝登録/更新成功はC-005/C-006被覆（B15②/④） |
| 033 | excluded | 汎用スタブ「実行結果の該当レコードが含まれる」＝内容空虚定型文（B15②） |
| 034 | excluded | 汎用スタブ＝新規/更新/削除成功はC-005/006/012被覆（B15④） |
| 035 | excluded | 汎用スタブ＝同上 |
| 036 | excluded | 汎用スタブ「登録内容が追加される」＝前提フォーム入力不正だが期待は追加される（自己矛盾）・登録成功はC-005被覆（B15②/③） |
| 037 | excluded | 汎用スタブ「追加されない」＝CSRF失敗の実挙動は403（C-016）・期待は汎用スタブで不一致（B15②） |
| 038 | excluded | 汎用スタブ「追加される」＝内容空虚定型文（B15②） |
| 039 | bound | C-014（期待「メッセージキーにより名称込み説明フラッシュのみ」＝pf商品使用中で削除拒否。観点登録内容は誤・B8補正） |
| 040 | excluded | 汎用スタブ「追加される」＝登録成功はC-005被覆（B15④） |
| 041 | excluded | 汎用スタブ「最大長の値→追加される」＝正常登録＝C-005被覆（B15④） |
| 042 | bound | C-008（期待「最大長+1→追加されない」＝新規の名称256文字で文字列長超過拒否。観点登録内容は誤・B8補正） |
| 043 | excluded | 汎用スタブ「最小長→追加される」＝本機能に最小長制約なし・正常登録＝C-005被覆（B15④） |
| 044 | excluded | 汎用スタブ「最小長-1→追加されない」＝空(0文字)＝必須違反はC-007被覆（B15④） |
| 045 | excluded | 汎用スタブ「追加される」＝フォーム送信(新規)成功はC-005被覆（B15④） |
| 046 | excluded | 汎用スタブ「実行結果が追加される」＝フォーム送信(更新)成功はC-006被覆（B15④） |
| 047 | bound | C-013（期待「共通CSRF付き削除要求」＝pf疑似DELETE＋共通CSRF・008の重複） |
| 048 | excluded | 汎用スタブ「更新内容が変更される」＝前提CSRF無効削除だが期待不一致・CSRF無効はC-016（B15②） |
| 049 | excluded | 汎用スタブ「変更されない」＝前提表示要素・内容空虚定型文（B15②） |
| 050 | excluded | 汎用スタブ「変更される」＝前提JS挙動・JS挙動の実はC-017被覆（B15②） |
| 051 | bound | C-013（期待「各行削除はモーダルで文言確認後…HTTP DELETE相当…CSRFヘッダ付与」＝pf疑似DELETE＋共通CSRF。観点更新内容は誤・B8補正） |
| 052 | excluded | 汎用スタブ「変更される」＝前提一覧行数・内容空虚定型文（一覧行数はC-001被覆・B15②） |
| 053 | excluded | 汎用スタブ「最大長の値→変更される」＝正常更新＝C-006被覆（B15④） |
| 054 | bound | C-009（期待「最大長+1→変更されない」＝更新の名称256文字で文字列長超過拒否。観点更新内容は誤・B8補正） |
| 055 | excluded | 汎用スタブ「最小長→変更される」＝正常更新＝C-006被覆（B15④） |
| 056 | excluded | 汎用スタブ「最小長-1→変更されない」＝空＝必須違反はC-007被覆（B15④） |
| 057 | bound | C-018（前提=配送方法の選択肢＝配送選択集合のM2M保存。観点更新内容は正・補正不要） |
| 058 | bound | C-018（前提=支払方法＝支払選択集合のM2M保存。観点実行結果→更新内容・B8補正） |
| 059 | TBD | 期待「flush しない」＝保存処理の内部呼び出し（flush）が行われないことは画面表示やDB状態からは外部観測できず一意に判定できない（計装未整備・要確認） |
| 060 | TBD | 期待「一覧へリダイレクトし、対象未取得のエラーメッセージをフラッシュへ積む」＝既に削除済みの購入グループを編集URLで開いたときの挙動が現行実装で一意に確定できず要仕様/実機確認 |
| 061 | bound | C-007（期待「一覧表は送信処理内でも再クエリ済み…編集/新規状態で検証結果を見せる」＝検証失敗時の一覧付き再表示。観点削除条件→エラー処理・B8補正） |
| 062 | bound | C-001（期待「表はヘッダのみの空データ相当で描画される」＝空一覧の初期表示。観点削除条件→画面表示・B8補正） |
| 063 | TBD | 期待「GET のたびに一覧クエリから組み立てる」＝毎GETクエリ発行はキャッシュ実装と外部観測で区別できず一意判定不能（計装未整備・要確認） |
| 064 | excluded | 汎用スタブ「削除条件が削除状態にならない」＋前提並行編集（楽観ロックなし＝非機能）・削除拒否はC-014被覆（B15②/④） |
| 065 | excluded | 汎用スタブ「実行結果が削除状態になる」＝削除成功はC-012被覆（B15④） |
| 066 | bound | C-007（期待「検証時は一覧付き編集/新規画面のHTTP 200」＝検証失敗の再表示。観点実行結果→エラー処理・B8補正） |
| 067 | excluded | 汎用スタブ「実行結果が削除状態になる」＝削除成功はC-012被覆（B15④） |
| 068 | bound | C-022（期待「新規作成時のみ作成日時を…現在時刻で埋め、それ以外の成功保存で更新日時を現在時刻」＝pf日時列付与規則。観点実行結果→副作用・B8補正） |
| 069 | TBD | 期待「null が一覧・業務運用上の対象外」は実装（削除されていない行を一覧に表示）と逆向きで一次資料内が矛盾し一意判定不能（要確認） |
| 070 | bound | C-023（期待「ログイン主体が…参照を更新」＝pf は member_id を無条件に記録。観点表示順→副作用・B8補正） |
| 071 | bound | C-018（期待「Many-to-many を表現」＝支払/配送選択集合が中間表へ差し替え反映。観点更新抑止→更新内容・B8補正） |
| 072 | excluded | 期待「対象テーブルを直接保存する（不要な削除は含まない）」＝否定命題「不要な削除は含まない」はbound不可（B8）・直接保存はC-005/C-006被覆 |
| 073 | excluded | 期待「共通ルールに従いログインなどへ寄せられる」＝未認証→共通認証誘導・機能固有許可なし＝共通認証機能へ委譲・モジュール代表(M03-01)でカバー（B14） |
| 074 | TBD | 期待「成功後に一覧ルートへ遷移」＝登録/更新/削除の成功後にどの画面へ遷移するかが操作ごとに異なり一律には確定できず要仕様/実機確認 |
| 075 | TBD | 期待「一覧再描画および新規向けフォーム初期表示」＝成功後の遷移先画面とその初期状態が操作ごとに異なり一律には確定できず要仕様/実機確認 |
| 076 | bound | C-007（期待「一覧付きページをHTTP 200で返しフィールド側エラーを出す」＝pf検証失敗の同一テンプレ再表示。観点画面レイアウト→エラー処理・B8補正） |
| 077 | bound | C-016（期待「403」＝削除共通CSRF失敗。観点画面レイアウト→入力検証・B8補正） |
| 078 | TBD | 期待「編集開始はエラー付きフラッシュ後に一覧へ、更新送信も一覧へ戻してデータ不変」＝既に削除済みの購入グループを編集/更新したときの挙動が現行実装で一意に確定できず要仕様/実機確認 |
| 079 | bound | C-014（期待「メッセージキーにより名称込み説明フラッシュのみ」＝pf商品使用中で削除拒否・039の重複。観点画面レイアウト→削除条件・B8補正） |
| 080 | bound | C-012（期待「deleted_at を現在時刻に更新する論理削除」＝pf削除成功・001の重複。観点一覧→削除条件・B8補正） |
| 081 | excluded | 汎用スタブ「画面表示データでエラー表示されず継続できる」＝内容空虚定型文（B15②） |
| 082 | bound | C-004（期待「画面上部タイトルは購入グループ管理相当」＝タイトル表示・003の重複。観点画面表示データ→画面表示・B8補正） |
| 083 | excluded | 汎用スタブ「画面表示データでエラー表示されず継続できる」＝内容空虚定型文（B15②） |
| 084 | bound | C-011（期待「編集中状態を捨て、新規入力に戻る」＝新規登録リンク・005の重複。観点画面表示データ→画面表示・B8補正） |
| 085 | bound | C-005（期待「成功時…成功メッセージ」＝pf新規登録成功・006の重複。観点フォーム送信→登録内容・B8補正） |
| 086 | bound | C-016（期待「アクセス拒否（HTTP 403）」＝CSRF無効削除・077の重複。観点エラー継続→入力検証・B8補正） |
| 087 | bound | C-004（期待「メニューは商品管理グループおよび購入グループ用ナビ項目をハイライト」＝ナビハイライト。観点公開コンテンツ→画面表示・B8補正） |

### §8.1 観点是正対象（emitが concretized.tsv の観点列を是正・母集合all_it_casesは不変）

対象NNN（下記 `## 観点補正` 表と一致・29件）: 001, 003, 004, 005, 006, 007, 008, 011, 039, 042, 047, 051, 054, 058, 061, 062, 066, 068, 070, 071, 076, 077, 079, 080, 082, 084, 085, 086, 087。
（009=必須バリデーション・017=DBとの相関バリデーション・057=更新内容は観点ラベルと期待実内容が整合＝補正不要。）

## §5 メッセージ（画面文言・逐語）

pf 実挙動のメッセージのみ。ja は pf 実コード/locale 逐語、en は **本機能で使う全キーを ee messages.en.yaml・validators.en.yaml・vendor validators.en.xlf で grep し確定**（ヒットあり＝LS≠0、ヒット0のみ英訳なし。R6是正）。

| 鍵/ID | ja（逐語） | en | 出典 |
|-------|-----------|-----|------|
| admin.register.complete / M03-22-MSG-001,002 | 登録が完了しました。 | Registration completed. | ja=pf message.ja.yml:83（登録/更新成功）／en=ee messages.en.yaml:1676 |
| admin.register.failed / M03-22-MSG-003 | 登録できませんでした。 | Registration failed. | ja=pf message.ja.yml:84（検証失敗）／en=ee messages.en.yaml:1677 |
| admin.sellgroup.delete.failed / M03-22-MSG-004 | この購入グループは商品で使用されているため、 %s は削除することができません。 | （英訳なし＝en grep ヒット0） | pf message.ja.yml:1256-1257（商品使用中削除拒否・%s=グループ名 sprintf。pf キー・EE キー admin.product.sell_group.delete.failed とも ee en 未定義） |
| admin.confirm.delete / M03-22-MSG-005 | %s を削除してもよろしいですか？ | （英訳なし＝en grep ヒット0） | ja=ee messages.ja.yaml:1792（削除確認ダイアログ本文・%s=グループ名）／en 未定義 |
| Symfony NotBlank (This value should not be blank.) / M03-22-MSG-006 | 入力されていません。 | No value found. | ja=ee validators.ja.yaml:17／en=ee validators.en.yaml:17（名称未入力のフィールドエラー） |
| Symfony Length (This value is too long) / M03-22-MSG-007 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | This value is too long. It should have {{ limit }} characters or less. | en=vendor validators.en.xlf:79（Length・最大長超過のフィールドエラー） |

※ **en 全キー grep 確定結果（R6）**: register.complete=Registration completed.(1676)／register.failed=Registration failed.(1677)／NotBlank=No value found.(validators.en.yaml:17)／Length=This value is too long.…(validators.en.xlf:79) は **実在＝LS≠0**。sellgroup.delete.failed（pf キー・EE キーとも）／admin.confirm.delete は **ee en グリップ 0＝英訳なし**。EE の「保存しました／削除しました／対象の購入グループが見つかりません／削除に失敗しました／Bootstrapモーダル文言」は pf に存在せず削除（R5是正）。pf 削除成功はフラッシュ無し。en 逐語はここ（§5）でのみ復旧し pf-fallback 原子 claim には混入させない。

## §6 要実機・注記（tsv出力から除去する内容）

- 支払方法の選択肢は pf PaymentRepository.loadEcPaymentQueryBuilder()（del_flg=0・PAYMENT_NOT_FOR_EC 除外・rank DESC）。配送方法は query_builder 無しで全 Delivery を name で表示（フィルタ・降順指定なし）。C-018/C-019 の SEED-M0322-PAY-DLV はこの前提で用意（要D5配線）。
- 削除トリガーは EC-CUBE3 共通アンカー（data-method="delete"＋csrf_token_for_anchor()＋data-message=admin.confirm.delete）で、共通スクリプトが確認ダイアログ→疑似 DELETE 送信。C-012〜C-017 の削除ボタン押下→確認ダイアログの具体セレクタは要実機。C-016（CSRF無効）・C-019（許容外id送信）は要求生成手段が要実機。
- C-018/C-022/C-023 の中間表・日時列・member_id の DB 照会（自動検証・内部）は db.ts 経由（要D5配線）。C-022/C-023 は画面に日時/member_id を表示しないため画面側は成功フラッシュのみ目視。
- 予約商品フラグ（Excel 0204:9433 ★カスタマイズ追加）は現行 pf の twig/form に存在しない（§10隔離）。

## §7 実行対象（bound=Playwright／TBD=手動）

- **Playwright(GUI)主体（14候補）**: C-001,C-004〜C-014,C-016,C-017 のうち C-018/C-019 を除く（空一覧/タイトル・ナビ/登録成功/更新成功/必須失敗/新規文字列長/更新文字列長/編集ロード/新規戻る/削除成功/通常削除要求method・CSRF/削除拒否/CSRF403/削除確認JS を画面・要求で目視）。内部の非保存・論理削除・request method/CSRF・遷移URL・HTTPコードは自動検証(内部)で副次確認。
- **Playwright(GUI)＋自動検証(内部・DB)**: C-018（支払/配送の再表示目視＋中間表DB照会）・C-019（許容外id更新→再表示で選択不変目視＋中間表当該行不変のDB照会）・C-022（成功フラッシュ目視＋create_date/update_date DB照会）・C-023（成功フラッシュ目視＋member_id DB照会）。
- **手動(TBD・8件)**: 018（配送選択肢の表示フラグ/降順＝EE のみ）・059（flush 未呼出＝外部観測不能）・060/078（既削除編集の対象未取得挙動＝EE のみ・pf該当処理なし）・063（毎GETクエリ＝キャッシュと区別不能）・069（null 対象外が実装と矛盾）・074/075（成功→一覧の一律遷移＝EE のみ・pf は編集画面へ）。いずれも pf/EE 食い違い or 計装未整備で要仕様/実機確認。
- **対象外(excluded)**: 検索条件／相関バリデーション／DB相関(許容内正例)／汎用スタブ／未認証(共通認証委譲)／否定命題(072)／純内部移行事実(002)。tsv非出力。

## §9 分類根拠（会計整合）

### §9.1 bound（32行・18候補 C-001,C-004〜C-014,C-016〜C-019,C-022,C-023／C-002/003/015/020/021/024は廃番）
- C-001 空一覧の初期表示←062。C-004 タイトル/ナビ←003,082,087。C-005 新規登録成功(登録が完了しました→編集画面)←006,085。C-006 編集更新成功←007。
- C-007 必須検証失敗(登録できませんでした→同一画面・一覧付き再表示含む)←009,061,066,076。C-008 新規文字列長超過←042。C-009 更新文字列長超過←054。
- C-010 名称リンク→編集画面値ロード←004。C-011 新規登録リンク→初期化←005,084。C-012 削除成功(論理削除・フラッシュ無し)←001,080。
- C-013 通常削除要求(疑似DELETE＋共通CSRF)←008,047,051。C-014 商品使用中で削除拒否(商品で使用…)←039,079。C-016 CSRF無効→403←077,086。
- C-017 削除確認(共通アンカー・data-message)←011。C-018 支払/配送選択保存(中間表M2M)←057,058,071。C-019 支払/配送許容外ID拒否(entity型)←017。
- C-022 create/update日時列付与規則←068。C-023 保存時member_id無条件記録←070。
- 全 bound は pf 実コード（file:line）で裏付く実挙動に対応（期待値は pf 挙動に一致）。

### §9.2 TBD（8行）
- **018**: 配送選択肢の「表示フラグ条件・降順」は EE 記述。pf の deliveries フォームは query_builder が無く全件を name で表示（フィルタ・並び指定なし）＝EE のみ挙動・要確認。
- **059**: 「flush しない」＝保存処理の内部 flush 未呼出は画面/DB から外部観測できず一意判定不能（計装未整備）。
- **060 / 078**: 既削除ID を編集で開いた/更新送信したときの「対象未取得エラー→一覧」＝EE のみ。pf の index/update に該当チェックが無く（404 かそのまま編集）実挙動が食い違い一意判定不能。
- **063**: 「GET のたびに一覧クエリ」＝毎GETクエリ発行はキャッシュ実装と外部観測で区別できず一意判定不能（計装未整備）。
- **069**: 「null が一覧・業務運用上の対象外」は実装（非削除行を一覧表示）と逆向きで一次資料内矛盾・一意判定不能。
- **074 / 075**: 「成功→一覧（一律遷移・一覧初期化）」＝EE。pf は create/update 成功時は編集画面（admin_sell_group_edit）へ遷移し一覧ではない（削除のみ一覧）。一律遷移の主張が pf と食い違い一意判定不能。

### §9.3 excluded（47行）
- 検索条件13（019-031）＝一覧に検索機能なし（B7・母集合テンプレ由来）。
- 相関バリデーション4（012-015）＝名称の単項目制約のみで相関なし（B7）。DB相関の正例（016）＝許容内→継続はC-018被覆。
- 汎用スタブ（実行結果/登録内容/更新内容/画面表示データの内容空虚定型文・被覆済み）: 010,032,033,034,035,036,037,038,040,041,043,044,045,046,048,049,050,052,053,055,056,064,065,067,081,083（B15②/④）。
- 未認証→共通認証委譲: 073（B14・M03-01代表）。否定命題（bound不可・B8）: 072。純内部移行事実（画面観測不能）: 002。
- excluded は tsv 非出力（会計は本§8/§9で管理）。

## §10 隔離メモ（bind根拠に不使用 or 特記）

- **予約商品フラグ（Excel 0204:9433 ★カスタマイズ追加）**: 現行 pf の SellGroupType/ sell_group.twig に存在しない（名称日/英・メモ・支払・配送のみ）。Excel の設計上の追加項目だが現行 pf 実装が無く回帰テスト対象外＝候補化しない（EE=SUT では実装されている可能性があるが、挙動オラクル=pf に無いため bound しない）。
- **pf vs EE の主な食い違い（R5 で判明・オラクル=pf に統一）**: パス /sell_group（EE /product/sell_group）／成功遷移 編集画面（EE 一覧）／成功フラッシュ admin.register.complete「登録が完了しました。」（EE admin.common.save_complete「保存しました」）／削除成功フラッシュ無し（EE「削除しました」）／削除拒否 admin.sellgroup.delete.failed「…商品で使用されているため…」（EE admin.product.sell_group.delete.failed「…商品に使用されているため…」）／検証失敗 admin.register.failed「登録できませんでした。」／削除確認 共通アンカー（EE Bootstrapモーダル）／member_id 無条件（EE 条件付き）／edit_not_found・一律一覧遷移は EE のみ（TBD）。
- **一覧の並び順・非削除フィルタ**: pf controller は findAll()（明示 ORDER BY・deleted_at フィルタは Doctrine 設定依存で不確実）。findAllNative() は deleted_at IS NULL だが controller では未使用。よって「主キー昇順」「非削除のみ」は一意に断定せず候補化しない（-069 は逆記述の矛盾で TBD）。
- **メモ最大長**: Excel=1024（0204:9434）と pf config sellgroup.length.memo=1024 が一致。母集合にメモ最大長を問う行が無いため bound しない。

## 観点補正

| 母集合末尾NNN | 正しい観点 | 根拠・バレNNN |
|---------------|-----------|----------------|
| 001 | 削除条件 | 期待「deleted_at を現在時刻に更新する論理削除」＝pf削除成功・CSRFは誤・001 |
| 003 | 画面表示 | 期待「画面上部タイトルは購入グループ管理相当」＝タイトル表示・対象データは誤・003 |
| 004 | 画面表示 | 期待「フォームが編集状態になる」＝名称リンクで編集画面に値ロード・出力抑止は誤・004 |
| 005 | 画面表示 | 期待「編集中状態を捨て、新規入力に戻る」＝新規登録リンク・識別子は誤・005 |
| 006 | 登録内容 | 期待「成功時…成功メッセージ」＝pf新規登録成功(登録が完了しました→編集画面)・状態変化は誤・006 |
| 007 | 更新内容 | 期待「同上」＝フォーム送信(更新)の更新成功・確認ダイアログは誤・007 |
| 008 | 削除条件 | 期待「共通CSRF付き削除要求」＝pf疑似DELETE＋共通CSRF・HTTPステータスは誤・008 |
| 011 | JS挙動 | 期待は削除確認の JS 挙動(pf共通アンカー)・文字列長バリデーションは誤・011 |
| 039 | 削除条件 | 期待「名称込み説明フラッシュのみ」＝pf商品使用中で削除拒否・登録内容は誤・039 |
| 042 | 文字列長バリデーション | 期待「最大長+1→追加されない」＝新規の名称256文字で拒否・登録内容は誤・042 |
| 047 | 削除条件 | 期待「共通CSRF付き削除要求」＝pf疑似DELETE＋共通CSRF・実行結果は誤・047 |
| 051 | JS挙動 | 期待「モーダルで文言確認後…HTTP DELETE相当…CSRFヘッダ付与」＝pf疑似DELETE＋共通CSRF・更新内容は誤・051 |
| 054 | 文字列長バリデーション | 期待「最大長+1→変更されない」＝更新の名称256文字で拒否・更新内容は誤・054 |
| 058 | 更新内容 | 期待「実行結果の値が変更される」＋前提支払方法＝支払選択集合のM2M保存・実行結果は誤・058 |
| 061 | エラー処理 | 期待「送信処理内でも再クエリ済み…検証結果を見せる」＝検証失敗時の一覧付き再表示・削除条件は誤・061 |
| 062 | 画面表示 | 期待「表はヘッダのみの空データ相当で描画される」＝空一覧の初期表示・削除条件は誤・062 |
| 066 | エラー処理 | 期待「検証時は一覧付き…のHTTP 200」＝pf検証失敗の再表示・実行結果は誤・066 |
| 068 | 副作用 | 期待「新規作成時のみ作成日時…更新日時を現在時刻」＝pf日時列付与規則・実行結果は誤・068 |
| 070 | 副作用 | 期待「ログイン主体が…参照を更新」＝pf member_id無条件記録・表示順は誤・070 |
| 071 | 更新内容 | 期待「Many-to-many を表現」＝支払/配送選択集合のM2M保存・更新抑止は誤・071 |
| 076 | エラー処理 | 期待「一覧付きページをHTTP 200で返しフィールド側エラー」＝pf検証失敗・画面レイアウトは誤・076 |
| 077 | 入力検証 | 期待「403」＝削除共通CSRF失敗・画面レイアウトは誤・077 |
| 079 | 削除条件 | 期待「名称込み説明フラッシュのみ」＝pf商品使用中で削除拒否・画面レイアウトは誤・079 |
| 080 | 削除条件 | 期待「deleted_at を現在時刻に更新する論理削除」＝pf削除成功・一覧は誤・080 |
| 082 | 画面表示 | 期待「画面上部タイトルは購入グループ管理相当」＝タイトル表示・画面表示データは誤・082 |
| 084 | 画面表示 | 期待「編集中状態を捨て、新規入力に戻る」＝新規登録リンク・画面表示データは誤・084 |
| 085 | 登録内容 | 期待「成功時…成功メッセージ」＝pf新規登録成功・フォーム送信は誤・085 |
| 086 | 入力検証 | 期待「アクセス拒否（HTTP 403）」＝CSRF無効削除・エラー継続は誤・086 |
| 087 | 画面表示 | 期待「メニューは商品管理グループおよび購入グループ用ナビ項目をハイライト」＝ナビハイライト・公開コンテンツは誤・087 |
