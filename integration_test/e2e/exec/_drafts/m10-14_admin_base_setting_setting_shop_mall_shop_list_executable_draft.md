# B0候補: m10-14 店舗一覧（モール） — 実行可能グレード候補（母集合86全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**／ B0（具体化先行の量産・標準）。
> **codexレビュー: R1要修正（Blocker3+Major2+Minor1）→改訂1で全数是正→R2再監査=Blocker①②・Minor⑥は
> 閉塞／残る4点（Blocker③未閉2件・Major④未閉・Major⑤未閉）→改訂2で是正・R3再確認待ち**。
> **改訂1（codex R1是正）**:
> (1) **Blocker①**: -054（M10-14-MSG-001「please check」対応行）をC-014へboundしていたが、C-014は
> `#btn_bulk`表示切替のみを検証し未選択削除実行/アラートは一切検証しない・§9自身が同メッセージ
> 到達不能と明記しており仕様期待を「到達不能」へ置換したままのbindは不成立→**-054を新設バケット
> 「BC別管理」（bound/TBD/excludedのいずれでもない・BC-DRAFT-M1014-01の追跡対象）へ再分類**。
> 会計をbound72→**71**・BC別管理**1**（新設）に組み替え、86件差分0を再実証（§8）。
> (2) **Blocker②**: 読替bound-031（10桁境界一致）をC-004（既知9桁ID=SEED-M10-14-TENANT）へ対応付けて
> いたが10桁専用SEED・操作が無く成立せず→**専用10桁SEED（SEED-M10-14-BOUNDARY-ID・id=1000000001）
> ＋専用ケースC-004Bを新設**しboundを成立させた（§2・§4・§3の-031行を更新）。
> (3) **Blocker③**: L1-M1014-004の逐語引用が誤り（FormTypeの`label`実値は
> `SearchTenantType.php:32`の`enterprise.admin.shop.shop_name`＝ja「店舗名」・EN資源なし。誤って
> twig側の別ラベルキー`enterprise.admin.shop.tenant.setting.search_title`をFormType値として引用して
> いた）→**訂正**: twigは`form_widget(searchForm.id)`のみでラベル非描画（`form_label`/`form_row`
> 呼出0件=index.twig:158実測）のため**FormTypeの`label`オプションは実際には描画されず死んだ値**。
> 画面上の可視ラベルは別の固定`<label>`タグ（index.twig:157）が使う
> `enterprise.admin.shop.tenant.setting.search_title`（＝これも「店舗名」・EN資源なし）。両キーは
> 偶然同一ja文言のため表示結果への影響は無いが、コード上の対応関係の誤りは是正した。
> **36claim全数を実ソース再照合**した結果、他に3件の行番号引用ずれ（L1-027「46-56」→正しくは
> `.done`ハンドラの実位置`56-66`／L1-028「57-60」→`.fail`の実位置`67-70`／L1-029「61-64」→
> `.always`の実位置`71-76`。3件とも約10行のずれで隣接コードを誤指示していた）と、4件の軽微な
> 行範囲ずれ（L1-012「167-170」→`165-169`／L1-013「258-265」→`257-265`／L1-018「80-95」→`82-95`／
> L1-021「26-45」→`26-47`）を検出し全て是正した。他28claimは完全一致（TenantController.php・
> BaseInfoRepository.php全文再読・BaseInfo.php各列・TenantStatus.php全文・messages.ja/en.yaml
> 該当行・eccube.yaml/security.yaml/EccubeEvents.php該当行を全て直接grep/Read再照合済み）。
> (4) **Major④**: S0復元がdb.ts側にm10-14専用の名前付き関数（読取/UPSERT/root照合）を前提としていたが
> 現存db.tsは汎用関数（queryScalar/queryNumber/queryRows/sqlLiteral/dbNow）のみでm10-14専用関数は
> 0件（実測）→**§2.1に自己完結SQL契約を追加**（汎用関数へ渡す具体SQL文字列を本文に明記）。
> root_base_info_idの取得はDB照会でなく環境変数`BASE_INFO_ID`読取（docker exec環境）に依るため
> DB専用関数の対象外である旨も明記。専用named関数の新設自体はD5待ち（`@TBD-D5`）と明記し、
> 「実行可能グレード」は候補段階のSQL契約自己完結を指すものであり実装済みヘルパの存在を主張しない。
> (5) **Major⑤**: BC-DRAFT-M1014-01の記述に自己矛盾（存在しないC-014内実測への言及）と断定調
> （「欠陥」表記）があった→**「静的コアテンプレート上の発火導線未確認（未解決）」へ抑制**し、C-014への
> 誤った参照を削除、-054はBC別管理バケットへ独立して紐付け、「仕様側期待＝到達不能」という期待値
> でない書き方も是正。
> (6) **Minor⑥**: -015（相関バリデーション・正極性・前提ヒント=M10-14-MSG-001）の除外理由に
> 「相関機構不存在」に加え「現行静的UIでは`please check`経路自体が到達不能（同一のBC-DRAFT-M1014-01
> 前提）」を併記（§8）。C-051の期待文言から「他方の失敗有無に関わらず自身は確定する」という
> 未検証の独立性主張を削除し「通常成功時（両行とも成功）の2件REMOVED」に限定（§4.1）。
> **改訂2（codex R2是正。Blocker①②・Minor⑥は閉塞済＝変更なし）**:
> (1) **Blocker③未閉②点**: 削除API系（L1-023〜026）の行番号引用を`nl -ba`実測で再訂正
> （L1-023の核心処理=397-399ではなく**400-402**〔397-399はメソッド宣言/開き波括弧/コメント〕・
> L1-024の`clearDoctrineCache()`=401-402ではなく**405**〔404はコメント行〕・L1-025のJSON return=
> 405-408ではなく**409**・L1-026の`addSuccess()`=404ではなく**407**）。**36claim最終全数を`nl -ba`で
> 再照合**（TenantController.php index()部分78-193・delete()部分383-410、BaseInfoRepository.php
> 全文、TenantStatus.php全文、index.twig全293行を`nl -ba`で直接出力し1行ずつ突合）した結果、
> 上記4件に加え軽微な2件（L1-012「166-169」〔旧`165-169`は165=検索ボタン行を含み過大〕・
> L1-029「71-75」〔旧`71-76`の76行は`.always`でなく外側`#bulkDelete`クリックハンドラの
> 閉じ波括弧〕）を追加是正。**残存する行番号ずれは0件**（他30claimは完全一致を再確認）。
> (2) **L1-009新表現**: 「表示順は生成順（挿入順/PK順に近い自然順）のみ」は`ORDER BY`不在から
> 論理的に導出できない主張のため撤回し、「**ORDER BY未指定＝返却順は未規定**」に限定した
> （DBMS実装依存の順序を主張しない）。
> (3) **Major④未閉**: §2.1のSEED投入SQLが`(..., ...) VALUES (<id>, ...) ... SET ...`という
> 省略記号のままで実行不能だったため、`dtb_base_info`の**NOT NULL列を含む具体列・具体値**を
> 明記した実行可能SQL（テナントSEED投入・REGISTERED(2)初期化・REMOVED(3)確認・復元UPDATE）へ
> 差し替えた（§2.1）。
> (4) **Major⑤未閉**: §8の-015注記「現行静的UIでは到達不能」およびL1-021「本画面では未到達」が
> 断定調のまま残っており、同文書内の「静的解析だけで全経路を証明し尽くしたとは言えない」という
> 留保と不整合だったため、両箇所を**「静的コアテンプレート上では発火導線未確認」**へ統一
> （到達不能の断定を回避）。**BC-DRAFT-M1014-01の見出しラベル自体**（3箇所）も
> 「静的コアテンプレート上の到達不能候補」から**「静的コアテンプレート上の発火導線未確認」**へ
> 統一改称し、見出しと本文の表現齟齬を解消した。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:336）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本（破壊系・並列DELETE・
> 遷移マトリクス）: `_drafts/m05-12_admin_order_order_bulk_status_change_executable_draft.md`／
> （破壊系S0復元・db.ts三段参照）: `_drafts/m05-13_admin_order_order_tracking_number_executable_draft.md`・
> `_drafts/m05-17_admin_order_order_shipping_memo_executable_draft.md`／（検索/集計read-only観測）:
> `_drafts/m02-02_admin_home_home_sales_status_executable_draft.md`。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝
> `e2e/fixtures/oracle/_drafts/m10-14_admin_base_setting_setting_shop_mall_shop_list_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **最重要検出（本候補作成時の実ソース調査・codex_R1前の一次発見。R1・R2指摘反映済み）**:
> - **BC-DRAFT-M1014-01（静的コアテンプレート上の発火導線未確認・未解決）**: 設計書 M10-14-MSG-001
>   「please check」（対象の店舗が未選択で一括操作を実行しようとしたときの警告）に対応するJS
>   （`#form_bulk .action-submit`クリックハンドラ＝index.twig:98-112）は実在するが、`index.twig`内に
>   `.action-submit`クラスを持つHTML要素が存在しない（grep実測0件・確認済み事実）。実際の削除ボタンは
>   `data-bs-toggle="modal" data-bs-target="#bulkDeleteModal"`（index.twig:185-186）でモーダルを
>   直接開くのみで、選択0件時のガードが無い。`#bulkDelete`クリック時のJS（index.twig:26-47）も
>   `checkedList`が空集合のときは`$.when.apply($, [])`が即時doneし、「完了」表示へ到達する（0件削除に
>   対するエラー表示は無い）。**この静的コード構造からはM10-14-MSG-001の発火導線が見当たらない**
>   （未解決＝発火させる別経路の有無は本書のソース調査の範囲では否定しきれない。母集合行との対応は
>   §8注記のとおり**bound対象化せずBC別管理へ分離**し、C-014等の既存候補ケースにこの状態を
>   検証済みとして混入させない）。期待値は仕様側のまま変更しない（裁定=codex/発注者）。
> - **BC-DRAFT-M1014-02（同型デッドコード・商品規格モーダル）**: `#productClassesModal`・
>   `data-class-url`・`data-product-id`を参照するJS（index.twig:113-135）に対応するHTML要素が
>   テナント一覧テーブル内に存在しない（列は空`colspan="3"`のみ）。この経路は本画面では発火しない。
> - **DOC-DRAFT-M1014-01（検索フォーム無効時の表示分岐）**: 設計書md:106,290「無効なら一覧部を空応答
>   相当で返す専用配列構成にしてレンダリングし、フラグ（has_errors）によりエラー状態のまま視覚要件に
>   合わせた再表示」に対し、`index.twig`は`has_errors`変数を**一切参照しない**（grep実測0件）。
>   実装は`{% if base_info_pagination and base_info_pagination.totalItemCount %}...{% else %}`
>   （index.twig:179,258）のみで分岐しており、コントローラが無効POST時に`base_info_pagination`
>   キーを返さない（Controller:122-128）ため、**エラー状態と真の検索結果ゼロは同一の`{% else %}`
>   ブロック（「検索条件に合致するデータが見つかりませんでした」）に収束し、視覚的に区別されない**。
>   期待値は仕様側のまま（分岐の存在自体は正・視覚差異の主張のみ実装差で不成立）。
> - **DOC-DRAFT-M1014-02（メッセージ表の英語列）**: 設計書の表示メッセージ表（md:170-172）は
>   M10-14-MSG-005/006/007の「画面上の文言(英語)」列にいずれも**日本語文言をそのまま記載**
>   （「保存に失敗しました」「保存しました」「削除しました」）しているが、実際の翻訳キー
>   `admin.common.save_error`/`save_complete`/`delete_complete`には**実在する英語訳**
>   （"Failed to save"/"Saved"/"Deleted"＝messages.en.yaml:1636-1638）がある。設計書側の英語列が
>   実際の翻訳資産を過小記載（逆にMSG-001〜004は真にハードコード/未翻訳でありこちらは設計書の
>   同一表記が正しい）。影響は軽微（ja側の期待に影響なし・enの確定文言のみ本書で訂正）。
> - **画面固有ラベルの英語資源欠落（構造的事実・BCではない）**: `enterprise.admin.shop.*`
>   （28キー）・`enterprise.admin.tenant.*`（7キー）・`admin.setting.shop.shop.is_public_shop*`／
>   `is_open_shop*`（4キー）は**messages.en.yamlに1件も存在しない**（grep実測0件、全キー確認済み）。
>   画面タイトル・検索欄ラベル・列見出し（店名/会社名）・公開/開店フラグ文言・削除確認モーダル文言は
>   **すべてEN資源なし**。共通キー（検索/一括操作/削除/キャンセル/閉じる/保存・削除フラッシュ）のみ
>   EN確認済み。本書は確認できたENのみ-EN行にする（未確認箇所を捏造しない）。
> - **モールルート無防備（テスト側の自衛事項・製品欠陥ではない）**: `TenantController::delete()`
>   （TenantController.php:396-410）に、対象`BaseInfo`がモールルート（`eccube_root_base_info_id`）か
>   どうかのガードは無い（実測・分岐なし）。設計書もそのようなガードを主張していないため矛盾ではないが、
>   **SEED/削除対象にモールルートを絶対含めない（§2）のはテストハーネス側の自衛規律**であり製品側の
>   保証ではないことを明記する。
> **行数集計（改訂1）**: 候補ケース行総数**27**＝bound対応26（ja24＋-EN2）＋補完1。母集合86全数会計＝
> **bound 71／BC別管理 1（-054）／TBD 0／excluded 14**（§8）。読替bound14行の詳細はper-ID明示（§3。
> うち-031は専用10桁SEED新設によりC-004Bへ対応）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md`
  （340行・本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点）。
- ee `/home/y-saito/Developments/ec-cube-enterprise` （作業ツリー現況。コミット固定なしの作業コピーを
  直接読取・grep実測。以下「TenantController.php:NN」等は本書内で実測した行番号）。
- fid_kubun.tsv（D1）: `M10-14｜m10-14_admin_base_setting_setting_shop_mall_shop_list｜店舗一覧｜対象｜標準｜
  ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md｜standard-src+design｜0`
  （fid_kubun.tsv:336）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（機能名列完全一致grep）
  `m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）` 全**86行**
  （IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-001〜086。以下「-nnn」）。
- **判定原則（W0-B0教訓）**: 観点ラベル・前提条件/入力データ列はノイズ（生成器が観点名と無関係な
  設計書用語をランダムに割当てている実態を86行全数通読で確認済み）。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全86行の
  期待要旨を併記）。
- **既存参考資産（本候補の会計外・参考のみ）**: `integration_test/m10_14_admin_base_setting_setting_shop_mall_shop_list_it_cases.md`
  （旧90観点行版・現行all_it_cases.tsvの86行とは母数が異なる＝**現行baseline（86行）を正**とする）・
  `integration_test/e2e/m10_14_admin_base_setting_setting_shop_mall_shop_list_e2e_cases.md`
  （2026-07-xx作成の先行手動分析・セレクタ根拠の相互参照に利用。ただし行番号は本書で全項目
  再実測し直した。旧文書の「90観点行」記載はそちらの母数であり本書の86行会計とは別物）・
  `e2e/pages/admin/m10/m10_14_admin_base_setting_setting_shop_mall_shop_list.page.ts`・
  `e2e/spec/admin/m10/m10_14_admin_base_setting_setting_shop_mall_shop_list.spec.ts`（実装済み・
  本候補は変更しない）。
- 主要一次資料の実測行番号（本書内で全て直接読取・grep確認済み）:
  - Controller = `src/Eccube/Controller/Admin/Mall/TenantController.php`
    （クラス宣言49／ルート78-81・396／検索フォーム初期化83-92／表示件数セッション96-113／
    POST検索115-139／GET resume・初回140-162／QueryBuilder取得・検索イベント164-178／
    KNPページネータ180-193／削除action383-410）
  - Repository = `src/Eccube/Repository/BaseInfoRepository.php`
    （getMallBaseInfo165-167／createSortedQueryBuilder169-172／getTenantData176-181／
    getOpenShops183-192／getPublicTenantShopsForSummary199-212／getMallData214-219／
    getQueryBuilderBySearchDataForAdmin221-240）
  - FormType = `src/Eccube/Form/Type/Admin/Enterprise/SearchTenantType.php`（20-45）
  - Entity = `src/Eccube/Entity/BaseInfo.php`（id49-52／company_name54-55／shop_name87-88／
    tenant_status175-178／is_public_shop1548-1549／is_open_shop1563-1564）・
    `src/Eccube/Entity/Master/Enterprise/TenantStatus.php`（20-32。定数REGISTER_IN_PROGRESS=1・
    REGISTERED=2・REMOVED=3）
  - 構成値 = `app/config/eccube/packages/eccube.yaml`（eccube_admin_route:69・
    eccube_default_page_count:142・eccube_root_base_info_id:303=env(BASE_INFO_ID)）
  - security.yaml = `app/config/eccube/packages/security.yaml`（admin firewall pattern:41・
    login_path:45-46）
  - twig = `src/Eccube/Resource/template/admin/mall/tenant/index.twig`（293行全文実測。
    title:15／sub_title:16／page_count pulldown JS:19-25／bulkDelete JS:26-80／
    action-submit(死角):98-112／productClassesModal(死角):113-149／検索フォーム:151-174／
    テーブル本体:179-258／ゼロ件:258-265／削除モーダル:267-289）
  - messages = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`（本書内で個別grep確認・
    行番号は各L1に記載）
  - mtb_page_max.csv = `src/Eccube/Resource/doctrine/import_csv/ja/mtb_page_max.csv`
    （id/name/sort_no: 10,50,100,300,500,1000,2000,10000,12000）

## §1 L1原子オラクル表

全36claim。en文言はen一次資料逐語（ja翻訳ゼロ・存在しないENは「EN資源なし」と明記し捏造しない）。
BC/DOC印は本文中。期待値の正は本表のオラクルID（SEED値を期待の正にしない三段参照）。

| oracle_id | 観点 | claim | 逐語quote／根拠 | file:line | LS |
|---|---|---|---|---|---|
| L1-M1014-001 | auth_rule | 未認証GET `/%eccube_admin_route%/mall/tenant` はadmin firewall（`^/%eccube_admin_route%/`）により`admin_login`のログイン画面へ誘導され当画面へ到達できない（**母集合86行に明示bindなし＝補完行のみで使用**） | `pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`／`login_path: admin_login` | security.yaml:41,45-46 | 0 |
| L1-M1014-002 | http_status | 一覧=`GET|POST /%eccube_admin_route%/mall/tenant`（route `admin_mall_tenant_index`）・ページ送り=`GET|POST /%eccube_admin_route%/mall/tenant/page/{page_no}`（`admin_mall_tenant_index_page`）・削除=`DELETE /%eccube_admin_route%/mall/tenant/{BaseInfo}/delete`（`admin_mall_tenant_delete`）。**3ルートいずれもrequirements未指定**（`{page_no}`に`\d+`等の制約なし・`{BaseInfo}`はEntityValueResolverでid解決） | `#[Route(path: '/%eccube_admin_route%/mall/tenant', name: 'admin_mall_tenant_index', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/mall/tenant/page/{page_no}', name: 'admin_mall_tenant_index_page', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/mall/tenant/{BaseInfo}/delete', name: 'admin_mall_tenant_delete', methods: ['DELETE'])]` | TenantController.php:78-81,396 | 0 |
| L1-M1014-003 | display | 画面タイトル=`enterprise.admin.shop.mall.shop_list`＝ja「店舗一覧」（**EN資源なし**）。サブタイトル=`admin.setting.basic_info`＝ja「基本情報設定」／en "Basic Information Settings"（設計書用語は「基本情報」＝部分一致で読み替え。完全一致オラクル化しない） | `{% block title %}{{ 'enterprise.admin.shop.mall.shop_list'\|trans }}{% endblock %}`／`{% block sub_title %}{{ 'admin.setting.basic_info'\|trans }}{% endblock %}` | index.twig:15-16／messages.ja.yaml:3834,2973／messages.en.yaml:2660（shop_list en 0件） | 1（サブタイトルのみ）／0（タイトルEN資源なし） |
| L1-M1014-004 | display | 検索フォーム: フィールドid＝Symfony getBlockPrefix `enterprise_admin_search_tenant`＋フィールド名`id`（DOM`#enterprise_admin_search_tenant_id`）。**SearchTenantTypeの`label`オプション実値は`enterprise.admin.shop.shop_name`（ja「店舗名」・EN資源なし）だが、twigは`form_widget(searchForm.id)`のみでラベルを描画せず（`form_label`/`form_row`呼出0件）、このオプションは実際には描画されない死んだ値**。画面上の可視ラベルは別の固定`<label>`タグが使う`enterprise.admin.shop.tenant.setting.search_title`（ja「店舗名」・同じくEN資源なし。両キーは偶然同一ja文言）。検索ボタン=`admin.common.search`＝ja「検索」／en "Search" | `->add('id', TextType::class, ['label' => 'enterprise.admin.shop.shop_name', 'required' => false])`（SearchTenantType.php:32）／`getBlockPrefix(): return 'enterprise_admin_search_tenant';`（:43）／`{{ form_widget(searchForm.id) }}`（form_label/form_row呼出なし＝index.twig:158）／`<label class="col-form-label">{{ 'enterprise.admin.shop.tenant.setting.search_title'\|trans }}</label>`（可視ラベル・index.twig:157）／`<button class="btn btn-ec-conversion px-5" type="submit">{{ 'admin.common.search'\|trans }}</button>`（:165） | SearchTenantType.php:20-45／index.twig:157-158,165／messages.ja.yaml:3839(shop_name),3865(tenant.setting.search_title) | 1（検索ボタンのみ）／0（両ラベルキーともEN資源なし） |
| L1-M1014-005 | validation | `SearchTenantType`に`Symfony\Validator\Constraints`（Assert）系制約は0件（フィールドは`required=>false`のみ）。POST検索の`isValid()`が偽になる現実的な経路は**CSRFトークン不正時のみ**。有効時: page_no=1固定・`FormUtil::getViewData($searchForm)`をセッションキー`eccube.enterprise.admin.mall.tenant.search`へ保存・page_no=1も同時保存。無効時: `['searchForm'=>...,'pagination'=>[],'pageMaxis'=>...,'page_no'=>...,'page_count'=>...,'has_errors'=>true]`を返し**`base_info_pagination`キーは含まれない** | `if ($searchForm->isValid()) { $page_no = 1; ... $this->session->set('eccube.enterprise.admin.mall.tenant.search', FormUtil::getViewData($searchForm)); $this->session->set('...page_no', $page_no); } else { return ['searchForm'=>...,'pagination'=>[],...,'has_errors'=>true]; }` | TenantController.php:115-139／SearchTenantType.php:20-45（Assert 0件） | 0 |
| L1-M1014-006 | behavior | GET分岐: `page_no !== null || request.get('resume') !== null` のとき（ページ送り／resume経由）はセッションから検索条件を復元（`FormUtil::submitAndGetData`）しページ番号もセッションへ再保存（`page_no`がnullのまま=resumeのみ到達時はセッションのpage_noも`null`で上書きされページネータへnullがそのまま渡る）。それ以外（初回到達）は`page_no=1`固定・フォーム既定値でセッションを上書きリセット | `if (null !== $page_no \|\| $request->get('resume') !== null) { $this->session->set('...page_no', $page_no); $viewData = $this->session->get('...search', []); $searchData = FormUtil::submitAndGetData($searchForm, $viewData); } else { $page_no = 1; $viewData = FormUtil::getViewData($searchForm); ...; $this->session->set('...search', $viewData); $this->session->set('...page_no', $page_no); }` | TenantController.php:140-162 | 0 |
| L1-M1014-007 | query_rule | 一覧の基底QueryBuilder（`getTenantData()`）は`bi.id != :root_base_info`で**モールルート（`eccube_root_base_info_id`＝env `BASE_INFO_ID`）を明示除外**。検索を伴わない全件表示でもモールルート行は一覧に出ない | `public function getTenantData(): QueryBuilder { return $this->createQueryBuilder('bi')->where('bi.id != :root_base_info')->setParameter('root_base_info', $this->eccubeConfig->get('eccube_root_base_info_id')); }`／`eccube_root_base_info_id: '%env(BASE_INFO_ID)%'` | BaseInfoRepository.php:176-181／eccube.yaml:303 | 0 |
| L1-M1014-008 | query_rule（読替bound） | 検索条件適用（`getQueryBuilderBySearchDataForAdmin`）: (a) 入力が`/^\d{0,10}$/`（**0〜10桁の数字のみ・空文字も適合**）に一致すればID等価パラメタとして採用、10桁超過かつ値が`2147483647`超かつPostgreSQLなら**id側をnullへ潰す**（32bit整数超過ガード）。(b) 常にID等価と店舗名LIKEを`OR`で結合（`andWhere`単一文字列内、`orWhere()`は不使用）。LIKE値は`%`と`_`をそれぞれ`\%`/`\_`へエスケープしてワイルドカード無効化。(c) 検索欄ラベルは「店舗名」だが実装は**ID/店舗名兼用フィールド**（フォーム名は`id`）。(d) `QueryKey::TENANT_SEARCH_ADMIN`のQueryCustomizationフック呼出があるがコア標準には対応するCustomizer実装なし（プラグイン拡張点のみ・標準環境では実質no-op） | `$id = preg_match('/^\d{0,10}$/', $searchData['id']) ? $searchData['id'] : null; if ($id && $id > '2147483647' && $this->isPostgreSQL()) { $id = null; } $qb->andWhere('bi.id = :id OR bi.shop_name LIKE :likeid')->setParameter('id', $id)->setParameter('likeid', '%'.str_replace(['%', '_'], ['\\%', '\\_'], $searchData['id']).'%'); return $this->queries->customize(QueryKey::TENANT_SEARCH_ADMIN, $qb, $searchData);` | BaseInfoRepository.php:221-240 | 0 |
| L1-M1014-009 | display | 一覧クエリ（`getTenantData()`／`getQueryBuilderBySearchDataForAdmin`）に**ORDER BY句が無い**（grep実測・同ファイル内の別メソッド`createSortedQueryBuilder`/`getPublicTenantShopsForSummary`はorderByを持つが本機能の一覧では使われない）。**codex R2是正**: 表示順は「生成順（挿入順/PK順に近い自然順）」と断定しない。ORDER BY未指定＝**返却順は未規定**（DBMS実装・実行計画に依存し得る。何らかの安定した順序を主張しない） | `getTenantData()`(176-181)・`getQueryBuilderBySearchDataForAdmin()`(221-240)いずれもorderBy/addOrderBy呼出0件（grep実測）。対照: `createSortedQueryBuilder(): return $this->createQueryBuilder('b')->orderBy('b.id', 'ASC');`（未使用の別メソッド。orderBy実行は173行） | BaseInfoRepository.php:170-173,176-181,221-240 | 0 |
| L1-M1014-010 | session | 表示件数: セッションキー`eccube.enterprise.admin.mall.tenant.search.page_count`（既定=`eccube_default_page_count`=10）。リクエスト`page_count`が真値のとき`PageMaxRepository::findAll()`（`mtb_page_max`: 10/50/100/300/500/1000/2000/10000/12000）と緩い等価(`==`)で照合し一致時のみセッション上書き。不一致は無視され既存セッション値のまま | `$page_count = $this->session->get('...page_count', $this->eccubeConfig->get('eccube_default_page_count')); $page_count_param = (int) $request->get('page_count'); if ($page_count_param) { foreach ($pageMaxis as $pageMax) { if ($page_count_param == $pageMax->getName()) { $page_count = $pageMax->getName(); $this->session->set('...page_count', $page_count); break; } } }` | TenantController.php:96-113／eccube.yaml:142／mtb_page_max.csv | 0 |
| L1-M1014-011 | api_contract | 正常時の戻り配列は`searchForm`/`pageMaxis`/`base_info_pagination`/`page_count`のみ（`has_errors`キーなし）。KNPページネータへ`$tenantsQueryBuilder`・`$page_no`・`$page_count`を渡す | `$pagination = $paginator->paginate($tenantsQueryBuilder, $page_no, $page_count); return ['searchForm' => $searchForm->createView(), 'pageMaxis' => $pageMaxis, 'base_info_pagination' => $pagination, 'page_count' => $page_count];` | TenantController.php:180-193 | 0 |
| L1-M1014-012 | display | 検索結果件数="`admin.common.search_result`"（ja「検索結果：%count%件が該当しました」／en "Search Results: %count% item(s) found."）。**`base_info_pagination`が真値のときのみ**表示（テンプレ条件） | `{% if base_info_pagination %}<span class="fw-bold ms-2">{{ 'admin.common.search_result'\|trans({"%count%":base_info_pagination.totalItemCount})\|raw }}</span>{% endif %}` | index.twig:166-169（`nl -ba`実測。165は検索ボタン行＝L1-004の対象で本claimとは別内容）／messages.ja.yaml:1731／messages.en.yaml:1758 | 1 |
| L1-M1014-013 | display（DOC-DRAFT-M1014-01） | ゼロ件・**および無効POST（has_errors=true）の両方**が同一の`{% else %}`ブロックへ収束（`base_info_pagination`が未定義または`totalItemCount`が0のとき）: 「検索条件に合致するデータが見つかりませんでした」＋「検索条件を変えて、再度検索をお試しください」＋「[詳細検索]も試してみましょう」（ja）／en対応（3文言ともEN確認済み） | `{% if base_info_pagination and base_info_pagination.totalItemCount %}...{% else %}<div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'\|trans }}</div><div>{{ 'admin.common.search_try_change_condition'\|trans }}</div><div>{{ 'admin.common.search_try_advanced_search'\|trans }}</div>{% endif %}`／`has_errors`変数のtwig内参照=0件（grep実測） | index.twig:179,257-265 | 1 |
| L1-M1014-014 | display | 一覧テーブル列見出し: チェックボックス列（`#trigger_check_all`）・ID(`admin.product.product_id__short`="ID"/en"ID")・店名(`enterprise.admin.shop.name`="店名"・**EN資源なし**)・会社名(`enterprise.admin.shop.company_name`="会社名"・**EN資源なし**)・公開(`admin.setting.shop.shop.is_public_shop`="公開"・**EN資源なし**)・開店(`admin.setting.shop.shop.is_open_shop`="開店"・**EN資源なし**)。行セル: チェックボックス(`name="ids[]" value={id} id="check_{id}" data-delete-url=削除URL`)・id値・店舗名リンク・会社名・公開/開店文言。右側`colspan="3"`は常に空セル（残骸） | `<th>{{ 'admin.product.product_id__short'\|trans }}</th><th>{{ 'enterprise.admin.shop.name'\|trans }}</th><th>{{ 'enterprise.admin.shop.company_name'\|trans }}</th><th>{{ 'admin.setting.shop.shop.is_public_shop'\|trans }}</th><th>{{ 'admin.setting.shop.shop.is_open_shop'\|trans }}</th><th colspan="3"></th>`／`<input type="checkbox" name="ids[]" value="{{ BaseInfo.id }}" id="check_{{ BaseInfo.id }}" data-delete-url="{{ url('admin_mall_tenant_delete', { BaseInfo: BaseInfo.id }) }}">` | index.twig:206-244 | 1（IDのみEN有）／0（他4列EN資源なし） |
| L1-M1014-015 | display | 公開フラグ: `isPublicShop`真偽で`admin.setting.shop.shop.is_public_shop__open`="公開"／`__non`="非公開"。開店フラグ: `isOpenShop`真偽で`__open`="開店"／`__close`="閉店"。**4キーいずれもEN資源なし**（外部マスタ参照ではなく固定翻訳キーの三項分岐。BaseInfoの2列ともORM上boolean） | `{{ BaseInfo.isPublicShop ? 'admin.setting.shop.shop.is_public_shop__open'\|trans : 'admin.setting.shop.shop.is_public_shop__non'\|trans }}`／`{{ BaseInfo.isOpenShop ? '...is_open_shop__open'\|trans : '...is_open_shop__close'\|trans }}`／`#[ORM\Column(name: 'is_public_shop', type: Types::BOOLEAN, ...)]`／`#[ORM\Column(name: 'is_open_shop', type: Types::BOOLEAN, ...)]` | index.twig:236-241／messages.ja.yaml:3013-3018（en 0件）／BaseInfo.php:1548-1549,1563-1564 | 0（EN資源なし） |
| L1-M1014-016 | nav | 店舗名リンク押下で`admin_mall_tenant_detail`（`{id: BaseInfo.id}`）へ遷移 | `<a href="{{ url('admin_mall_tenant_detail', { id : BaseInfo.id }) }}">{{ BaseInfo.shop_name }}</a>` | index.twig:230-231 | 0 |
| L1-M1014-017 | js_rule | 表示件数プルダウン(`#page_count_pulldown`)は`option value`にURL（`admin_mall_tenant_index_page`・`page_no=1`固定＋選択件数）を埋め込み、`change`で`window.location.href`遷移（単純ナビゲーション。追加のAjaxなし） | `<option value="{{ path('admin_mall_tenant_index_page', {'page_no': 1, 'page_count': pageMax.name}) }}">{{ 'admin.common.count'\|trans({'%count%': pageMax.name}) }}</option>`／`$('#page_count_pulldown').on('change', function () { const targetUrl = $(this).val(); if (targetUrl) { window.location.href = targetUrl; } });` | index.twig:19-25,189-200 | 0 |
| L1-M1014-018 | js_rule | 行チェックボックス（`input[id^="check_"]`）・ヘッダ全選択（`#trigger_check_all`）の変更でいずれも共通関数`toggleBtnBulk('input[id^="check_"]', '#btn_bulk')`を呼び、チェック済みが1件以上あれば`#btn_bulk`（`d-none`初期）を表示、0件で非表示に戻す | `$('input[id^="check_"]').on('change', function() { toggleBtnBulk('input[id^="check_"]', '#btn_bulk'); });`（要旨）／`toggleBtnBulk('input[id^="check_"]', '#btn_bulk');`（82,85,95行）／`$('#trigger_check_all').on('change', function() { ... toggleBtnBulk(...); });`（88行） | index.twig:82-95 | 0 |
| L1-M1014-019 | display | `#btn_bulk`内は見出し`admin.common.bulk_actions`（ja「一括操作」／en "All"）＋削除ボタン`admin.product.permanently_delete`（ja「削除」／en "Delete"。`data-bs-toggle="modal" data-bs-target="#bulkDeleteModal"`） | `<div id="btn_bulk" class="d-none"><label class="me-2">{{ 'admin.common.bulk_actions'\|trans }}</label><button type="button" data-bs-toggle="modal" data-bs-target="#bulkDeleteModal" class="btn btn-ec-delete">{{ 'admin.product.permanently_delete'\|trans }}</button></div>` | index.twig:183-187／messages.ja.yaml:1722,2047／messages.en.yaml:1750,1926 | 1 |
| L1-M1014-020 | display | 削除確認モーダル（`#bulkDeleteModal`）: タイトル`enterprise.admin.tenant.logical_delete_delete__confirm_title`="店舗を削除します"・本文`__confirm_message`="店舗を削除してよろしいですか？"。**`enterprise.admin.tenant.*`はEN資源なし**（7キー全件0件） | `<h5 class="modal-title fw-bold">{{ 'enterprise.admin.tenant.logical_delete_delete__confirm_title'\|trans }}</h5>`／`<p>{{ 'enterprise.admin.tenant.logical_delete_delete__confirm_message'\|trans }}</p>` | index.twig:272,276／messages.ja.yaml:3868-3874（en 0件） | 0（EN資源なし） |
| L1-M1014-021 | behavior（BC-DRAFT-M1014-01） | `#bulkDelete`クリックで: モーダル内ボタンを`disabled`化・本文を`enterprise.admin.tenant.logical_delete_delete__in_progress`="削除中..."へ変更・進捗バー表示・チェック済み各行（`input[type=checkbox][data-delete-url]:checked`）へ並列`$.ajax({type:'delete', data:{'_token': $(this).attr('token-for-anchor')}})`送信。**チェック0件でも警告なくエラー無しで処理継続**（`checkedList`が空配列でも`$.when.apply($, [])`が即done。M10-14-MSG-001の`.action-submit`ガードは別経路＝**静的コアテンプレート上では発火導線未確認**＝BC-DRAFT-M1014-01。到達不能と断定はしない） | `var checkedList = $('input[type=checkbox][data-delete-url]:checked'); var totalCount = checkedList.length; var promises = checkedList.map(function() { return $.ajax({'url': $(this).data('delete-url'), 'type': 'delete', 'data': {'_token': $(this).attr('token-for-anchor')}}).always(...); });` | index.twig:26-47 | 1（進行中文言のみ・EN資源なし） |
| L1-M1014-022 | behavior | チェックボックスに`token-for-anchor`属性は付与されていない（`name`/`value`/`id`/`data-delete-url`の4属性のみ＝index.twig:224-226）。よって送信される`data.'_token'`は常に`undefined`。`delete()`アクション自体もCSRF検証コード（`isCsrfTokenValid`等）を一切呼ばない（実測・design自身も「自動テストはトークンレスのDELETEでも成功確認している」と明記＝BCでなく設計の既知の留保） | チェックボックスHTML属性=`name="ids[]" value="{{ BaseInfo.id }}" id="check_{{ BaseInfo.id }}" data-delete-url="..."`（`token-for-anchor`属性なし）／`delete(BaseInfo $BaseInfo, CacheUtil $cacheUtil): JsonResponse { $tenantStatus = ...find(TenantStatus::REMOVED); $BaseInfo->setTenantStatus($tenantStatus); $this->entityManager->flush(); ... }`（CSRF検証呼出0件・実測） | index.twig:224-226／TenantController.php:396-410／設計書md:213 | 0 |
| L1-M1014-023 | db_effect | `delete()`本体: `TenantStatusRepository::find(TenantStatus::REMOVED)`（定数値=3・`mtb_tenant_status.id=3`）で削除状態マスタ行を取得→`$BaseInfo->setTenantStatus($tenantStatus)`→`$this->entityManager->flush()`（明示`persist()`呼出なし・マネージド状態のエンティティのため）。物理削除・行削除は行わない（`dtb_base_info`の行数不変） | `$tenantStatus = $this->tenantStatusRepository->find(TenantStatus::REMOVED); $BaseInfo->setTenantStatus($tenantStatus); $this->entityManager->flush();`／`public const REMOVED = 3;` | TenantController.php:400-402（`nl -ba`実測。397-399はメソッド宣言/開き波括弧/コメント）／TenantStatus.php:20-32 | 0 |
| L1-M1014-024 | db_effect | 削除完了後`CacheUtil::clearDoctrineCache()`を呼び出す（Doctrineキャッシュクリア。ステータス反映のため） | `$cacheUtil->clearDoctrineCache();`（コメント「店舗ステータスが反映されるようにキャッシュをクリア」） | TenantController.php:405（`nl -ba`実測。404はコメント行） | 0 |
| L1-M1014-025 | api_contract | `delete()`のJSON応答は**常に**`{"success": true, "message": trans('admin.common.delete_complete')}`（`success:false`を返す分岐がコントローラ内に存在しない＝実測。クライアントJS側の`result.success===false`判定は防御的コードで、このコントローラ単体からは到達しない経路） | `return $this->json(['success' => true, 'message' => trans('admin.common.delete_complete')]);`（`success`を偽にする分岐は本メソッド内に0件・実測） | TenantController.php:409（`nl -ba`実測） | 0 |
| L1-M1014-026 | message | フラッシュ`addSuccess('admin.common.delete_complete', 'admin')`＝ja「削除しました」／en "Deleted"（**EN確認済み・設計書表の英語列記載「削除しました」はDOC-DRAFT-M1014-02によりEN実体と不一致だが本書のjs期待には影響しない**） | `$this->addSuccess('admin.common.delete_complete', 'admin');` | TenantController.php:407（`nl -ba`実測。404はコメント行）／messages.ja.yaml:1593／messages.en.yaml:1638 | 1 |
| L1-M1014-027 | behavior | クライアント`done`ハンドラ: 各`result`のうち`result.success === false`のものだけ`addError(result.message)`で`#bulkErrors`へ追記（L1-025によりサーバはsuccess:false を返さないため**本コントローラ単体では到達しない防御的分岐**。到達には別要因（プラグイン等）が必要＝要実機） | `.done(function() { var args = ...; args.filter(function(result) { return result.success === false; }).forEach(function(result) { addError(result.message); }); })` | index.twig:56-66 | — |
| L1-M1014-028 | message | クライアント`fail`ハンドラ（HTTPレベル失敗・ネットワークエラー等）: `enterprise.admin.tenant.logical_delete_delete__system_error`="システムエラーが発生しました"を`#bulkErrors`へ追記（**EN資源なし**） | `.fail(function() { addError("{{ 'enterprise.admin.tenant.logical_delete_delete__system_error'\|trans }}"); })` | index.twig:67-70／messages.ja.yaml:3874（en 0件） | 0（EN資源なし） |
| L1-M1014-029 | display | `always`ハンドラ: 進捗バー非表示・モーダル本文を`enterprise.admin.tenant.logical_delete_delete__complete`="完了"へ変更・ボタンの`disabled`解除＋表示切替（`#bulkDeleteDone`が現れる）。**EN資源なし** | `.always(function() { $('.progress', modal).hide(); $('.modal-body p', modal).text("{{ 'enterprise.admin.tenant.logical_delete_delete__complete'\|trans }}"); modal.find('button').removeAttr('disabled').toggle(); })` | index.twig:71-75（`nl -ba`実測。76は`#bulkDelete`クリックハンドラ自体を閉じる外側の波括弧でありalwaysブロックの一部ではない）／messages.ja.yaml:3873（en 0件） | 0（EN資源なし） |
| L1-M1014-030 | behavior | `#bulkDeleteDone`クリックで`location.reload(true)`（画面全体の強制リロード） | `$('#bulkDeleteDone').on('click', function() { location.reload(true); });` | index.twig:78-80 | 0 |
| L1-M1014-031 | data_rule | 標準の一覧クエリ（`getTenantData`/`getQueryBuilderBySearchDataForAdmin`）は`tenant_status`列を検索条件・除外条件のいずれにも使わない（grep実測・WHERE/andWhere双方に`tenant_status`0出現）。論理削除（`tenant_status`→REMOVED）後も対象行は一覧に残り続ける | `getTenantData()`/`getQueryBuilderBySearchDataForAdmin()`本文に`tenant_status`参照0件（実測） | BaseInfoRepository.php:176-181,221-240 | 0 |
| L1-M1014-032 | data_rule | 検索テキストはDBのどの列にも保存されない（`dtb_base_info`への書込は`delete()`の`tenant_status`更新のみ。検索自体はSELECT系のみで`getQueryBuilderBySearchDataForAdmin`にpersist/flush呼出0件） | `getQueryBuilderBySearchDataForAdmin`本文にpersist/flush呼出0件（実測）。永続化される検索条件は**セッション**のみ（Controller:126,144,158-159） | BaseInfoRepository.php:221-240／TenantController.php:126,144,158-159 | 0 |
| L1-M1014-033 | validation | バリデーションの正規表現`/^\d{0,10}$/`は**空文字にもマッチする**（`{0,10}`は0回反復を許容）。したがって検索欄が空文字のPOSTでも`$id=''`となりID等価パラメタとして束ねられ（同時に店舗名LIKE`'%%'`も束ねられ全件相当に一致）、フォーム側の必須制約が無い（`required=>false`・Assert制約0件）ため空入力POSTはエラーにならず処理が継続する | `preg_match('/^\d{0,10}$/', '')`は真（0回反復の空文字列マッチ・正規表現の性質として直接確認）／`'required' => false`（Assert制約は0件） | BaseInfoRepository.php:229／SearchTenantType.php:20-45 | 0 |
| L1-M1014-034 | edge_rule | 11桁以上の数字入力は`/^\d{0,10}$/`に不一致のため`$id=null`（ID等価条件は使われない）。10桁以内でも値が`2147483647`超かつPostgreSQL環境なら同様に`$id=null`へ潰される（32bit整数オーバーフローガード）。いずれの場合も店舗名LIKE側のみで判定される | `$id = preg_match('/^\d{0,10}$/', $searchData['id']) ? $searchData['id'] : null; if ($id && $id > '2147483647' && $this->isPostgreSQL()) { $id = null; }` | BaseInfoRepository.php:229-231 | 0 |
| L1-M1014-035 | edge_rule | 検索語に`%`または`_`を含むとき`str_replace(['%','_'],['\\%','\\_'], ...)`でエスケープしてからLIKEへ束ねるため、これらの文字はワイルドカードとして機能せず**リテラル一致**として扱われる（全件化しない） | `->setParameter('likeid', '%'.str_replace(['%', '_'], ['\\%', '\\_'], $searchData['id']).'%')` | BaseInfoRepository.php:233-236 | 0 |
| L1-M1014-036 | data_rule | 店舗名リンク押下（詳細画面遷移）自体は`dtb_base_info`のいかなる列も更新しない（本一覧機能スコープは参照のみ。詳細編集画面の永続化手順は別機能scope=md:35で明示除外） | 「店舗新規作成・詳細編集画面の入力項目および永続化手順全体｜実装または別機能の設計を正とする。」 | 設計書md:35／index.twig:230-231（GETリンクのみ・POST/PUT無し） | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`・**破壊系＝論理削除の使い捨て隔離＋復元＋モールルート保護**）

期待値の正は**L1オラクルID**（三段参照: 期待=L1→前提状態=SEED→実測=db.ts観測値）。
本機能の破壊的操作は`dtb_base_info.tenant_status`の更新（論理削除）**のみ**（L1-023。物理削除・行追加は無し）。

1. **書込対象は専用の使い捨てSEEDテナント行のみ**（新設 SEED-M10-14-DELETABLE・id帯 900001400番台）。
   共有シード（SEED-M10-14-BASE／SEED-M10-14-TENANT等の参照専用行）とは**帯を分離**し、
   共有帯・実データ・**モールルート行（`eccube_root_base_info_id`が指すBaseInfo）には絶対に書かない**
   （§0のBC/DOC-DRAFT前文既述のとおり、アプリ側にモールルート削除ガードは無い＝ハーネス側の
   自衛のみで担保する。SEED投入時・削除対象選択時にモールルートidと一致しないことをdb.tsで
   事前検証してから実行する）。
2. **afterEachでtenant_status再UPSERT**（初期値=`TenantStatus::REGISTERED`(id=2)。`BaseInfo.TenantStatus`は
   `nullable:false, options:{default:2}`のためデフォルト値もREGISTERED=2）で復元する。本機能の変更対象は
   `tenant_status`列（外部キー）のみのUPDATEでありINSERT/DELETE副産物は生じない（L1-023）ため、
   UPSERT再適用のみで完全復元できる（m05-12のような別表副産物INSERTは本機能には無い）。
3. **CacheUtil::clearDoctrineCache()の副作用**（L1-024）はプロセス内Doctrineキャッシュのクリアであり、
   afterEachでのDB行復元後に別途キャッシュ影響を残さない（次テストは新規クエリで再取得するため
   実害なし。ただし共有DB・並行実行環境ではキャッシュクリアが他ケースの読み取りタイミングに
   影響し得るため、フレッシュDB/serial前提を厳守する＝`e2e-standard-run-requirements`準拠）。
4. **並列DELETEのレース挙動**（L1-021の`checkedList.map()`＋`$.when.apply`）は、本機能では
   **各行が独立した単一`delete()`呼出**（他の出荷/受注のような相互作用する集約ロジックが無い＝
   L1-023はエンティティ単体のflushのみ）であるため、m05-12のような複数行合成の非決定性は生じない。
   複数行同時削除ケースは行ごとに独立成立を db.ts で個別照合する（1トランザクション化されていない
   ことの検証はJSレベルの並列送信観測に限定し、DB側の非決定観測は要求しない）。

| SEEDセットID | 内容（初期値） | 用途 |
|---|---|---|
| SEED-M10-14-BASE | 管理者ログイン（モール側・SEED-M01-ADMIN流用）＋モールルートBaseInfo（構成値`eccube_root_base_info_id`が指す既存行・**変更しない・参照のみ**） | 全ケースの認証・モールルート除外確認の基準点 |
| SEED-M10-14-TENANT | 参照専用テナント帯（id=900001401〜900001403・run-id prefix付き`shop_name`＝例`E2E-M1014-<runid>-Alpha`／`company_name`／`is_public_shop`/`is_open_shop`混在（true/false各値を含む）／`tenant_status`=REGISTERED(2)固定・**削除しない**） | 検索一致（名前/ID/桁あふれ/ワイルドカード）・列表示・リンク遷移・ページング確認用 |
| SEED-M10-14-DELETABLE | 使い捨てテナント1件（id=900001410・`shop_name`=run-id prefix付き一意値・`tenant_status`=REGISTERED(2)初期） | 論理削除（単体・並列複数件の代表1件）実行対象。afterEachで`tenant_status`をREGISTERED(2)へUPSERT復元 |
| SEED-M10-14-DELETABLE-MULTI | 使い捨てテナント2件（id=900001411,900001412・共にREGISTERED(2)初期） | 複数選択並列DELETEの独立成立確認（各行が個別に`tenant_status`更新されること） |
| SEED-M10-14-BOUNDARY-ID（**改訂1新設**） | 参照専用テナント1件・**id=1000000001（10桁ちょうど・`2147483647`以下でPostgreSQL整数オーバーフローガードに掛からない）**。`shop_name`はrun-id prefix付き一意値・`tenant_status`=REGISTERED(2)固定・**削除しない**。既存SEED-M10-14-TENANT（id=900001401〜900001403・9桁）では-031（10桁境界）を検証できないためcodex R1指摘を受け新設 | -031（読替bound=10桁ちょうどのID等価一致）専用。C-004Bで使用 |

- 期待値にSEED初期値を使わない: 削除後の期待は L1-023（`tenant_status`=REMOVED(3)へ更新）から導出し、
  SEED初期`tenant_status`はあくまで前提状態（三段参照）。
- 全SEEDの`shop_name`/`company_name`にrun-id prefixを付け、他ケース・共有データと衝突しないようにする。
- `dtb_base_info.id`は`GeneratedValue(strategy: 'IDENTITY')`（自動採番）のため、SEED投入時に特定のid値
  （9000014xx・1000000001等）を明示指定するには自動採番を経由しない生SQL INSERT（IDENTITY列への
  明示値指定）を用いる。これは他候補群の既存SEED運用と同一手法（新規契約ではない）。

### §2.1 S0復元・root保護の自己完結SQL契約（**codex R1 Major④是正→R2で省略記号を排し具体値化**）

現存`e2e/helpers/db.ts`は`queryScalar`/`queryNumber`/`queryRows`/`sqlLiteral`/`dbNow`の**汎用関数のみ**を
提供し、m10-14専用の名前付きヘルパ（例: `tenantStatusById()`等）は**0件**（実測・grep確認）。
本書は「実行可能グレード＝m10-14専用ヘルパが実装済み」であることを主張しない。以下は汎用関数へ
そのまま渡せるSQL文字列としての**自己完結契約**であり、専用ヘルパの新設自体は`@TBD-D5`（D5待ち）。

**`dtb_base_info`の実列定義**（`.cursor/db/products.sql:813-885`の`CREATE TABLE public.dtb_base_info`
実測。以下は省略記号なしの正本）: `id integer NOT NULL`（デフォルト無し・明示要）・
`shop_digit character varying(3) NOT NULL`（**デフォルト無し・UNIQUE制約あり・明示要**＝
`BaseInfo.php:172`の`unique: true`と一致）・`update_date timestamp(0) with time zone NOT NULL`
（**デフォルト無し・明示要**）。他の`NOT NULL`列（`tenant_status`・`is_public_shop`・`is_open_shop`・
`option_*`・`rank`・`short_name_jp/en`・`html_class_name`・`shop_color`・`shop_icon`・
`common_setting_flg`・`random_tile_flg`・`test_store_flg`・`is_main_shop`等）は全て`DEFAULT`値を
持つためINSERT時に省略可（PostgreSQLがデフォルト値を補完する）。`shop_name`/`company_name`は
`nullable`（デフォルトNULL）。

| 用途 | SQL（`queryScalar`/`queryRows`へ渡す文字列。**省略記号なし・具体値で実行可能**） | 備考 |
|---|---|---|
| 対象行の`tenant_status`現在値照会（前提確認・afterEach検証） | `SELECT tenant_status FROM dtb_base_info WHERE id = 900001410` | `queryScalar`で単一値取得。`<id>`部分はSEED行ごとの実id（下表） |
| `mtb_tenant_status`のREMOVED(id=3)行の存在・名称確認 | `SELECT id, name FROM mtb_tenant_status WHERE id = 3` | `queryRows`で確認（L1-023裏付け） |
| S0復元（REGISTERED(2)への単純UPDATE。**INSERT ON CONFLICTのUPSERTではなく既存行へのUPDATE**＝本機能はINSERT/DELETE副産物が無いため単純） | `UPDATE dtb_base_info SET tenant_status = 2, update_date = now() WHERE id = 900001410` | `queryScalar`をSQL実行目的で転用（戻り値は使わない）。実行後に上記照会SQLで復元結果を再確認する2段構成 |
| SEED投入（自動採番を経由しない明示id指定・**実行可能な完全形**。例=SEED-M10-14-DELETABLE） | `INSERT INTO dtb_base_info (id, shop_digit, update_date, shop_name, company_name, tenant_status, is_public_shop, is_open_shop) VALUES (900001410, 'D10', now(), 'E2E-M1014-<runid>-Deletable', 'E2E-M1014 Test Co.', 2, true, true) ON CONFLICT (id) DO UPDATE SET shop_digit = EXCLUDED.shop_digit, update_date = now(), shop_name = EXCLUDED.shop_name, company_name = EXCLUDED.company_name, tenant_status = EXCLUDED.tenant_status, is_public_shop = EXCLUDED.is_public_shop, is_open_shop = EXCLUDED.is_open_shop` | `<runid>`はテスト実行ごとの一意prefix（`sqlLiteral()`でエスケープしてから埋め込む）。他SEED行も同型でid/shop_digit/値のみ差し替える（下表） |
| モールルート保護チェック（DB照会ではない） | なし（DB照会では完結しない） | `eccube_root_base_info_id`は環境変数`BASE_INFO_ID`（`app/config/eccube/packages/eccube.yaml:303`が`%env(BASE_INFO_ID)%`と定義）。ハーネスは`docker exec <container> printenv BASE_INFO_ID`等でroot idを取得し、SEED投入・削除対象id と**事前に不一致であることを確認**してから実行する契約とする（値そのものはD5で環境から確定） |

**各SEEDセットのid/shop_digit対応表**（`shop_digit`はUNIQUE制約のため全SEED行で重複させない。§2のSEED表と対応）:

| SEEDセットID | id | shop_digit | is_public_shop/is_open_shop | tenant_status初期値 |
|---|---|---|---|---|
| SEED-M10-14-TENANT（3件） | 900001401／900001402／900001403 | `T01`／`T02`／`T03` | true/true・false/true・true/false（混在） | 2（REGISTERED） |
| SEED-M10-14-DELETABLE | 900001410 | `D10` | true/true | 2（REGISTERED） |
| SEED-M10-14-DELETABLE-MULTI（2件） | 900001411／900001412 | `D11`／`D12` | true/true（両方） | 2（REGISTERED） |
| SEED-M10-14-BOUNDARY-ID | 1000000001 | `BID` | true/true | 2（REGISTERED） |

- 上記SQLは`db.ts`の`queryScalar(sql: string)`/`queryRows(sql: string)`（既存実装・引数は生SQL文字列を
  受け付ける汎用関数）にそのまま渡せば実行可能であり、**新たな関数追加なしに候補段階のSQL契約として
  自己完結する**。ただし可読性・再利用性向上のための名前付きヘルパ（`tenantStatusById()`等）の新設は
  D5成果物として別途行う（`@TBD-D5`。本書はヘルパ実装の存在を主張しない）。
- `shop_digit`はUNIQUE制約列のため、上表の値（`T01`〜`T03`・`D10`〜`D12`・`BID`）を他の既存データ・
  他候補群のSEEDと重複させないこと（run前提の隔離帯として本書で確保する3桁コード）。

## §3 検索条件・読み替えbound マトリクス（per-ID明示）

design書の検索欄ラベルは「店舗名」だが、実装（BaseInfoRepository::getQueryBuilderBySearchDataForAdmin）は
**桁のみ入力をID等価、常に店舗名LIKEもOR結合**する兼用フィールドである（L1-008・md:158「利用者視点での
ラベルと実装側の入力意味は一致しない」と設計書自身が明記）。母集合の「検索条件の該当レコードが
取得結果に含まれる（含まれない）」という汎用的な期待文（-019〜-032）は、以下のとおり**per-ID**で
具体的な検索意味論へ読み替えてbindする（観点ラベル不使用・期待テキストの極性のみそのまま維持）。

| 母集合test_id | 期待極性 | 読み替え後の具体シナリオ | 根拠L1 |
|---|---|---|---|
| -019 | 含まれる | 店舗名の部分一致（LIKE）で対象テナントが結果に含まれる | L1-008 |
| -020 | 含まれない | 一致しない店舗名で検索すると対象は含まれない（該当なし） | L1-008 |
| -021 | 含まれる | 桁のみ入力（テナントID）でID等価一致し対象が含まれる | L1-008 |
| -022 | 含まれない | **モールルート**は検索条件に関わらず常に結果から除外される（一致し得ない） | L1-007 |
| -023 | 含まれる | 論理削除後（`tenant_status`=REMOVED）も一覧クエリは除外しないため対象行は含まれ続ける | L1-031 |
| -024 | 含まれない | 完全に一致しない語での検索は結果ゼロ（該当なし） | L1-008,L1-013 |
| -025 | 含まれる | 検索欄が空文字（桁パターンに適合）のとき、ID側パラメタが空で束ねられつつ店舗名LIKEも`%%`で全件一致し対象が含まれる | L1-033 |
| -026 | 含まれない | 存在しないテナントIDの桁のみ入力では該当なし（ID一致もLIKE一致もしない） | L1-008 |
| -027 | 含まれる | 店舗名に含まれる`%`文字はエスケープされリテラル一致として扱われ、当該文字を含む店舗名の対象が含まれる | L1-035 |
| -028 | 含まれない | ` %`をワイルドカードとして解釈しない（エスケープ）ため、`%`を含まない語の全件化は起きず不一致対象は含まれない | L1-035 |
| -029 | 含まれる | 店舗名に含まれる`_`文字も同様にエスケープされリテラル一致で対象が含まれる | L1-035 |
| -030 | 含まれない | `_`もワイルドカード解釈されないため不一致対象は含まれない | L1-035 |
| -031 | 含まれる | 10桁ちょうど（上限内）の数字入力はID等価として解釈され対象が含まれる（**改訂1**: 既存SEED-M10-14-TENANTは9桁idのため9桁入力では境界を検証できず、専用10桁SEED＝SEED-M10-14-BOUNDARY-ID〔id=1000000001〕＋専用ケースC-004Bを新設して成立させた。§2/§4参照） | L1-008,L1-034 |
| -032 | 含まれない | 11桁以上（桁あふれ）の入力はID側null・店舗名も不一致なら対象は含まれない | L1-034 |

補足（実行結果の重複行）: -033/-034/-035（IT-23「実行結果」3行）は上表の一般化された再確認として、
それぞれ dtb_base_info 一覧反映の一般確認（-033、-019と共有）・`mtb_tenant_status`REMOVED(id=3)行の
存在確認（-034、L1-023のマスタ側裏付け・db.ts単体照会）・検索テキスト一般の再確認（-035、-019と共有）
としてbindする（§8参照）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全27行を実体掲載**）

- 期待値の正は`[L1:...]`（§1）。fixtureは`@TBD-D5`。URLの`%eccube_admin_route%`は環境値。
- **（BC）**印はBC-DRAFT-M1014-01/02の影響下（実走×見込み・期待は仕様側のまま）。
- 破壊系（C-050〜053）は§2の使い捨てSEED＋afterEach復元前提。モールルート行は対象にしない。

### §4.1 bound対応候補行（26行＝ja24＋-EN2。§8の86対応表が参照する全行。改訂1でC-004B新設）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-001	IT-25	初期表示	P1	一覧画面のタイトル・サブタイトル・検索フォームが表示される（ja）	モール管理者ログイン済(SEED-M01-ADMIN)／SEED-M10-14-BASE	—	1. GET /%eccube_admin_route%/mall/tenant 2. タイトル・サブタイトル・検索欄・検索ボタンの文言を読む	タイトル「店舗一覧」・サブタイトルに「基本情報」を含む「基本情報設定」・検索欄ラベル「店舗名」・検索ボタン「検索」が表示され、テナント店舗の検索結果テーブルを持つページとして表示される（エラーなく継続） [L1:L1-M1014-003,L1-M1014-004; fixture:SEED-M10-14-BASE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-001-EN	IT-25	初期表示	P3	検索ボタン等の共通文言（en。画面固有ラベルはEN資源なしのため対象外）	モール管理者ログイン済／locale=en	—	1. en UIで一覧を開く 2. サブタイトル・検索ボタンの文言を読む	サブタイトル"Basic Information Settings"・検索ボタン"Search"が表示される（タイトル・検索欄ラベル・列見出し等はEN資源が無いため本行の対象外＝§9） [L1:L1-M1014-003,L1-M1014-004]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-002	IT-23	検索(店舗名一致)	P1	店舗名の部分一致で対象テナントが結果に含まれる	ログイン済／SEED-M10-14-TENANT	既知テナントの店舗名の一部	1. 検索欄に店舗名の一部を入力し検索ボタン押下	検索結果テーブルに対象テナント行（id/店名リンク/会社名/公開/開店列）が表示され「検索結果：N件が該当しました」が表示される [L1:L1-M1014-008,L1-M1014-012,L1-M1014-014; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-003	IT-23	検索(不一致)	P2	一致しない店舗名で検索すると該当なし（ゼロ件表示）	ログイン済／SEED-M10-14-BASE	どのテナントにも一致しない語	1. 検索欄に不一致語を入力し検索	「検索条件に合致するデータが見つかりませんでした」等のゼロ件案内が表示され対象テナントは含まれない [L1:L1-M1014-008,L1-M1014-013; fixture:SEED-M10-14-BASE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-004	IT-23	検索(ID等価・読替bound)	P1	桁のみ入力はID等価条件として解釈され対象が含まれる	ログイン済／SEED-M10-14-TENANT	既知テナントのID（桁のみ）	1. 検索欄にテナントIDを入力し検索	ラベルは「店舗名」だが桁のみ入力はID等価として解釈され、対象テナント行が結果に含まれる（読替bound=§3 -021） [L1:L1-M1014-008; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-004B	IT-23	検索(10桁境界・読替bound・改訂1新設)	P2	10桁ちょうどの数字入力はID等価として解釈され対象が含まれる	ログイン済／SEED-M10-14-BOUNDARY-ID（id=1000000001・10桁）	1000000001（10桁ちょうど）	1. db.tsでid=1000000001の行が存在しtenant_status=REGISTERED(2)であることを確認 2. 検索欄に1000000001を入力し検索	10桁ちょうど（`/^\d{0,10}$/`の上限内・`2147483647`以下でPostgreSQLオーバーフローガードに掛からない）の入力はID等価条件として解釈され、対象テナント行（id=1000000001）が結果に含まれる（読替bound=§3 -031。9桁のC-004とは別のSEED行で境界を検証） [L1:L1-M1014-008,L1-M1014-034; fixture:SEED-M10-14-BOUNDARY-ID@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-005	IT-23	モールルート除外	P1	モールルートは検索条件に関わらず結果に含まれない	ログイン済／SEED-M10-14-BASE(モールルート参照のみ)	モールルートのid（桁のみ）またはモールルート店舗名の一部	1. モールルートのidまたは店舗名で検索	一致しそうな入力でもモールルート行は結果テーブルに現れない（基底クエリで明示除外・読替bound=§3 -022） [L1:L1-M1014-007; fixture:SEED-M10-14-BASE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-006	IT-25	空検索	P2	空のまま検索してもエラーにならず全件相当が表示される	ログイン済／SEED-M10-14-TENANT	空（未入力） 	1. 検索欄を空のまま検索ボタン押下	必須バリデーションエラーは表示されず処理が継続し、空文字は桁パターンにも適合してID側パラメタが束ねられ店舗名LIKEも`%%`で全件一致し帯テナントが結果に含まれる（読替bound=§3 -025） [L1:L1-M1014-005,L1-M1014-033; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-007	IT-22	桁あふれ	P2	11桁以上の数字はID側nullとなり名前LIKEのみで解釈される	ログイン済／SEED-M10-14-TENANT	11桁の数字（例:99999999999）	1. 検索欄に11桁の数字を入力し検索	エラーにならず処理は継続するが、ID等価条件は使われず（桁あふれでnull）店舗名LIKEのみで判定されるため一致しない対象は含まれない（読替bound=§3 -032） [L1:L1-M1014-034; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-008	IT-23	ワイルドカードエスケープ	P2	検索語に含まれる%/_はワイルドカードとして機能せずリテラル一致する	ログイン済／SEED-M10-14-TENANT（店舗名に`%`または`_`を含む帯データ）	「%」または「_」を含む検索語	1. %または_を含む語で検索	リテラルな%/_を含む対象のみ一致し、無関係な全件化は起きない（読替bound=§3 -027/-029） [L1:L1-M1014-035; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-009	IT-23	論理削除後の再表示	P1	論理削除後も標準の一覧クエリはtenant_statusで除外せず対象行は一覧に残る	ログイン済／SEED-M10-14-DELETABLE（削除済み状態を模擬適用） 	削除済みテナントの店舗名で検索	1. db.tsでtenant_status=REMOVED(3)を確認 2. 一覧を検索	tenant_statusがREMOVEDでも一覧クエリは除外条件を持たないため対象行は結果に含まれ続ける [L1:L1-M1014-031; fixture:SEED-M10-14-DELETABLE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-010	IT-25	表示件数(不一致・変更なし)	P2	マスタに無いpage_countは無視され既定件数のまま	ログイン済／SEED-M10-14-BASE	page_count=99999（マスタ不一致）	1. ?page_count=99999 を付与してGET	不一致値は無視されセッションの表示件数（既定10または既存値）が据え置かれ、プルダウンの選択状態も変化しない [L1:L1-M1014-010; fixture:SEED-M10-14-BASE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-011	IT-25	表示件数(一致・変更)	P2	マスタ一致のpage_countはセッションへ反映されプルダウンに選択状態が現れる	ログイン済／SEED-M10-14-TENANT	表示件数プルダウンを50へ変更	1. #page_count_pulldown を50へ変更（page_no=1へブラウザ遷移） 2. 再訪してプルダウンの選択状態を読む	page_count=50を付与した同一一覧URL（ページ1）へ遷移し、以後のセッション表示件数が50へ更新されプルダウンで選択済み表示になる [L1:L1-M1014-010,L1-M1014-017; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-012	IT-03	ページ送り・resume復元	P1	resume付きGETで直前の検索条件がセッションから復元される	ログイン済／SEED-M10-14-TENANT	既知テナントの店舗名／resume=1	1. 店舗名で検索 2. GET /%eccube_admin_route%/mall/tenant?resume=1	検索欄に直前の入力値が復元され同一の検索結果が再表示される（page_noがセッションから復元されたページで再クエリ） [L1:L1-M1014-006; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-013	IT-03	初回GETのリセット	P2	検索後に一覧基底URLへ再訪すると検索条件がフォーム既定へ上書きリセットされる	ログイン済／SEED-M10-14-TENANT	既知テナントの店舗名	1. 店舗名で検索 2. GET /%eccube_admin_route%/mall/tenant（page_no/resumeなし）で再訪	初期GET分岐によりセッションの検索条件がフォーム既定値で上書きされ、検索欄が空の初期表示に戻る [L1:L1-M1014-006; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-014	IT-25	UI部品(チェック/一括領域)	P1	行チェックで一括操作領域が表示/非表示に切り替わる（ja）	ログイン済／SEED-M10-14-TENANT	—	1. 行のチェックボックスを操作する 2. #btn_bulk の表示状態を読む	0件で非表示（d-none）、1件以上のチェックで見出し「一括操作」＋削除ボタン「削除」を含む領域が表示され、全解除で再び非表示になる [L1:L1-M1014-018,L1-M1014-019; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-014-EN	IT-25	UI部品(一括領域文言)	P3	一括操作領域の共通文言（en）	ログイン済／locale=en	同上	同上	見出し"All"・削除ボタン"Delete"が表示される（common key。enterprise.admin.shop/tenant系はEN資源なし） [L1:L1-M1014-019]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-015	IT-25	確認モーダル(ja)	P1	削除ボタン押下で確認モーダルのタイトル・本文が表示される	ログイン済／SEED-M10-14-TENANT	1件チェック	1. 行をチェックし一括操作の削除ボタンを押下	#bulkDeleteModal にタイトル「店舗を削除します」・本文「店舗を削除してよろしいですか？」が表示される（enterprise.admin.tenant.*はEN資源なし） [L1:L1-M1014-020; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-016	IT-05	店舗名リンク遷移	P1	店舗名リンク押下で店舗詳細編集へ遷移する	ログイン済／SEED-M10-14-TENANT	既知テナントの店舗名	1. 店舗名で検索 2. 結果行の店舗名リンクを押下	admin_mall_tenant_detail（対象id）へ遷移する [L1:L1-M1014-016; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-017	IT-12	画面レイアウト(列/バリデーション)	P2	一覧の列見出し・公開/開店文言・検索欄のバリデーション不在が確認できる	ログイン済／SEED-M10-14-TENANT（公開/非公開・開店/閉店混在）	—	1. 一覧を表示し列見出し・行セルの公開/開店文言を読む 2. SearchTenantTypeにAssert制約が無いことをdb.ts不要でソース確認済みとして受容	列見出しID/店名/会社名/公開/開店が表示され、行の公開/開店セルはtrue/falseに応じ「公開/非公開」「開店/閉店」で表示される。検索テキストにSymfonyフォーム単体の拘束はほぼ無い [L1:L1-M1014-014,L1-M1014-015,L1-M1014-005; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-018	IT-11	検索テキスト非永続化	P2	検索テキストはDBに保存されずセッションのみで保持される	ログイン済／SEED-M10-14-BASE	任意の検索語	1. 検索実行後、db.tsでdtb_base_infoの列に検索語が現れないことを確認	検索テキストはdtb_base_infoのいかなる列にも保存されず、保持先はセッションのみ [L1:L1-M1014-032; fixture:SEED-M10-14-BASE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-019	IT-02	表示順(ソートなし)	P2	一覧にソート機能はなくORDER BY未指定（返却順は未規定）	ログイン済／SEED-M10-14-TENANT（複数件）	—	1. 一覧を表示し行の並び順を確認 2. ソート操作用UIが存在しないことを確認	店舗名やアルファベット順のソート機能は一覧テンプレートに存在せず、一覧クエリはORDER BY未指定のため返却順は未規定である（安定した順序を保証しない・特定の並びを期待しない） [L1:L1-M1014-009; fixture:SEED-M10-14-TENANT@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-050	IT-26	論理削除(単体)	P1	単体の論理削除でtenant_statusがREMOVEDへ更新されJSON成功応答が返る	ログイン済／SEED-M10-14-DELETABLE（tenant_status=REGISTERED(2)）	使い捨てテナント1件チェック→削除確認	1. db.tsでtenant_status=REGISTERED(2)を確認 2. 削除確認モーダルを確定 3. 応答JSONを読む 4. db.tsで再照会（afterEach: tenant_status再UPSERD復元）	HTTP成功応答で{"success":true,"message":"削除しました"}が返り、dtb_base_info.tenant_status（対象id）がREMOVED(3)へ更新される。行は削除されず件数不変 [L1:L1-M1014-023,L1-M1014-025,L1-M1014-026; fixture:SEED-M10-14-DELETABLE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-051	IT-26	論理削除(複数並列)	P1	複数選択の並列DELETEで各行が独立してtenant_statusを更新される	ログイン済／SEED-M10-14-DELETABLE-MULTI（2件ともREGISTERED(2)）	2件チェック→削除確認	1. db.tsで2件ともtenant_status=REGISTERED(2)を確認 2. 削除確認モーダルを確定（並列DELETE Ajax） 3. db.tsで2件とも再照会（afterEach: 両方tenant_status再UPSERD復元）	選択された各行に対応する削除URLへDELETEのAjaxリクエストが並列送信され、**通常成功時（両行とも成功）**は2件とも独立してtenant_status=REMOVED(3)へ更新される（改訂1: 失敗注入を伴わないため「他方が失敗しても自身は確定する」という独立性そのものは本ケースでは観測しない・要実機） [L1:L1-M1014-021,L1-M1014-023; fixture:SEED-M10-14-DELETABLE-MULTI@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-052	IT-26	削除完了後の再読込	P1	削除完了後、閉じる操作で店舗一覧画面が再読込される	ログイン済／SEED-M10-14-DELETABLE	1件チェック→削除確認→完了操作	1. 削除完了後モーダル本文「完了」表示を確認 2. #bulkDeleteDone を押下 3. ページ全体がリロードされることを確認（afterEach: tenant_status再UPSERD復元）	削除完了後モーダル本文が「完了」へ変わり、#bulkDeleteDone押下でlocation.reload(true)により店舗一覧画面が再読込される [L1:L1-M1014-029,L1-M1014-030; fixture:SEED-M10-14-DELETABLE@TBD-D5]				
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-053	IT-26	削除セッション書込抑止確認	P2	検索・チェック操作のみ（削除未確定）ではtenant_statusは変更されない	ログイン済／SEED-M10-14-TENANT	検索・チェックのみ実施し削除は確定しない	1. 検索・チェック操作を行い削除は確定させない 2. db.tsで対象行のtenant_statusが変化していないことを確認	店舗名リンク押下・検索送信・チェック操作単体ではdtb_base_infoのいかなる列も変更されない（本一覧機能スコープでは参照のみ） [L1:L1-M1014-036,L1-M1014-005; fixture:SEED-M10-14-TENANT@TBD-D5]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔md:71「未認証ユーザー」行・
権限・認可表〔md:263〕は一次資料に規定があるが、母集合86行の期待テキストにこれを明示的に主張する行が
存在しない（§0前文参照）〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-14_admin_base_setting_setting_shop_mall_shop_list	E2E-M1014C-060	IT-15	未認証	P1	未認証で一覧URLへ直接アクセスすると管理ログイン画面へ誘導される（HEAD現存）	未ログイン	—	1. GET /%eccube_admin_route%/mall/tenant	admin_login のログイン画面へ誘導され、店舗一覧画面（検索結果テーブル）へ到達できない [L1:L1-M1014-001]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1 claim（8件）: L1-003（サブタイトルのみ）・L1-004（検索ボタンのみ）・L1-012（検索結果件数）・
L1-013（ゼロ件案内）・L1-014（IDヘッダのみ）・L1-019（一括操作/削除ボタン）・L1-021（進行中文言・
ただしEN資源なし）・L1-026（削除完了フラッシュ）。
→ **-EN 2行のみ**（C-001-EN／C-014-EN。§4.1に実体掲載）。

- **画面固有ラベルはEN資源が存在しない**ため-EN行を作らない（捏造禁止）: `enterprise.admin.shop.*`
  （タイトル・検索欄ラベル・店名/会社名列見出し）・`enterprise.admin.tenant.*`（削除確認モーダル・
  進行中/完了/システムエラー文言）・`admin.setting.shop.shop.is_public_shop*`／`is_open_shop*`
  （公開/開店フラグ4文言）は`messages.en.yaml`に0件（本書冒頭で全キー個別grep確認済み）。
  -EN行を作れるのは**共通キー**（`admin.common.search`="Search"・`admin.common.bulk_actions`="All"・
  `admin.product.permanently_delete`="Delete"・`admin.setting.basic_info`="Basic Information Settings"・
  `admin.common.search_no_result`系3件・`admin.common.delete_complete`="Deleted"）に限る。
- **DOC-DRAFT-M1014-02**（§0前文）: 設計書メッセージ表（md:170-172）の英語列がMSG-005/006/007で
  日本語のまま記載されているが、実際のキー（`admin.common.save_error`/`save_complete`/
  `delete_complete`）にはEN実体がある（"Failed to save"/"Saved"/"Deleted"）。本書のL1-026は
  実際のEN実体（"Deleted"）を正として記載する。
- サーバJSON `message`（L1-026等）のlocale解決は管理セッションのロケールに依存（-EN実行前提は
  他候補と同様D15扱い＝実行のみ保留、文言確定は本書で完了）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約（破壊系 C-050/051・非UI観測 C-018）

- 削除URL: `DELETE /%eccube_admin_route%/mall/tenant/{BaseInfo}/delete`（Controller:396。
  requirements未指定＝id形式は実質EntityValueResolverの解決可否に依存）。
- ヘッダ・トークン: **`delete()`アクション自体はCSRF検証を一切呼ばない**（L1-022実測）。
  クライアントJSは`data:{'_token': $(this).attr('token-for-anchor')}`を送るが該当属性がDOMに
  無いため常に`undefined`（L1-022）。よってDELETE成功に正規トークンは不要（設計書自身の留保＝
  md:213「自動テストはトークンレスのDELETEでも成功確認している」と整合）。
- 応答判定: HTTP応答＋JSON body（`success`/`message`キー。L1-025）。
- db.ts照会対象列: `dtb_base_info.tenant_status`（FK先id）・`mtb_tenant_status.id,name`（REMOVED=3の
  確認）。

### §6.2 db.ts状態照会（三段参照の観測層）

- `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ）。照会列: `dtb_base_info.tenant_status`／
  `dtb_base_info`各表示列（id/shop_name/company_name/is_public_shop/is_open_shop）／
  `mtb_tenant_status.id,name`（REMOVED=3の裏付け）。
- **SEED初期値を期待の正にしない**: 削除後の期待値はL1-023（REMOVED=3固定）から導出。SEED初期
  `tenant_status`はREGISTERED(2)の前提状態としてのみ用いる。
- **復元・cleanup**: afterEachで`tenant_status`をREGISTERED(2)へUPSERT再適用する（副産物INSERT無し
  ＝m05-12型の複雑な削除条件は不要。§2参照）。
- オラクル解決: `e2e/helpers/oracle.ts`の`o(id, …)`方式（正式fixtureは未作成。候補段階では消費なし）。

### §6.3 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は`e2e/fixtures/oracle/_drafts/m10-14_admin_base_setting_setting_shop_mall_shop_list_oracle_draft.json`
   のみに生成。**正式パス`e2e/fixtures/oracle/`直下への書込なし**。
2. 正式解決器`e2e/helpers/oracle.ts`の`_drafts`隔離ガード（他候補W0で実在確認済み・本書は再検証せず
   既存確認結果を援用）により正式specから本草案は解決不能という前提を維持する。
3. 本候補はspec/page実装・実走なし。既存`e2e/spec/admin/m10/m10_14_*.spec.ts`・
   `e2e/pages/admin/m10/m10_14_*.page.ts`への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（HEADで成立・非破壊）: C-001(+EN)/002/003/004/004B/005/006/007/008/009/010/011/012/013/
  014(+EN)/015/016/017/018/019。
- 破壊的（使い捨てSEEDのみ更新・afterEach tenant_status再UPSERD・フレッシュDB/serial前提・
  モールルート絶対非対象）: C-050/051/052/053。
- 実行保留: -EN 2行（他候補と同様D15扱い）・L1-027（success:false到達の実機確認・要実機）・
  L1-022のCSRF非検証がSymfony設定変更後も同一かの実環境確認（要実機・§9）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル不使用）。1候補ケース行=1 assertion bundle・
多対一はshared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝86↔候補の期待テキスト突合が本文内で完結する**。

### 集計（86 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **71** | 下表（うち読替bound=14行〔-019〜-032・§3明示。-031は専用SEED新設によりC-004B対応〕） |
| **BC別管理** | **1** | -054（M10-14-MSG-001対応行。bound/TBD/excludedのいずれでもない。下記参照） |
| **TBD** | **0** | ─（全bound行はL1で拘束済み。BC-DRAFT影響・要実機は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **14** | 下記4カテゴリ（各カテゴリの全test_idを実引きし期待テキストで確認済み） |
| 合計 | **86** | 欠落0・理由なし重複0（71+1+0+14=86） |

- **BC別管理の根拠（-054・1件）**: 期待「送信せず店舗一覧画面に留まること」（M10-14-MSG-001対応）。
  現行の静的コアテンプレートからはM10-14-MSG-001（`please check`アラート）の発火導線が見当たらない
  （BC-DRAFT-M1014-01・§0前文）。C-014は`#btn_bulk`表示切替のみを検証しM10-14-MSG-001の発火条件
  （未選択のまま削除実行）を一切検証しないため、C-014へのboundは不成立と判断し撤回した。かといって
  「対象機構が存在しない」ことを実引きで確定できてもいない（`.action-submit`要素が無いことは実測
  済みだが、静的解析だけで全経路の到達不能を証明し尽くしたとは言えない＝excluded化もしない）。
  よって**bound/TBD/excludedのいずれにも分類せずBC別管理として独立保持**し、86件会計の中で
  明示的に1件として計上する（§9のBC-DRAFT-M1014-01が解消・裁定された時点で再分類する）。
- excluded根拠:
  - **EX-A 必須バリデーション（-009・1件）**: 期待「必須バリデーションでエラーが表示され、対象処理が
    完了しない」（正極性）。検索フィールドは`required=>false`でAssert制約0件（SearchTenantType.php実測）
    のため必須バリデーション自体が存在せず本行は過剰生成。**偽陰性なし**: 負極性側（エラーにならず
    継続）は-010でbound済み＝両極性の一方のみ除外する誤りはない。
  - **EX-B 相関・DB相関バリデーション（-012,013,014,015,016,017・6件）**: 期待「相関/DBとの相関
    バリデーションでエラーが表示され（ず）、対象処理が完了しない（継続できる）」。検索欄は単一
    独立フィールド（`id`のみ）であり相関先となる第二フィールドもDB相関ゲートも存在しない
    （SearchTenantType.php:20-45実測・Repository側も単一パラメタのOR結合のみ＝L1-008）。両極性
    （エラーあり/なし）とも該当機構が無く過剰生成。一般の継続確認（負極性相当）は-010/-019等で
    既にbound済み＝偽陰性なし。**-015個別注記（前提ヒント=M10-14-MSG-001・codex R2是正）**: -015は
    「相関機構不存在」に加えて、そのヒントが指す`please check`経路自体も**静的コアテンプレート上では
    発火導線未確認**（BC-DRAFT-M1014-01と同一前提。到達不能と断定はしない）であり、いずれの
    読み替えを取ってもexcluded/BC別管理の外側（＝bound）へ救済できる先が無いことを二重に確認した
    上でexcludedとする。
  - **EX-C 詳細編集画面スコープ外（-036,038・2件）**: 期待「更新内容の対象レコードの値が変更される
    こと」（正極性）。-036（店舗名リンク押下）・-038（検索送信）はいずれも読み取り専用の操作
    （GETリンク遷移／検索POSTはセッションのみ更新しdtb_base_infoへの書込はしない＝L1-005,L1-032,
    L1-036）であり、店舗の値変更を伴う永続化手順は詳細編集画面側の別機能（md:35で明示除外）に
    属する。本機能スコープでの「値が変更される」肯定主張は成立しないため除外。**偽陰性なし**:
    「値が変更されない」（負極性）の一般成立は-037/-044/-053等でbound済み。
  - **EX-D メール件名・本文（-064,065,067,068・4件）**: 期待「件名／本文でエラーが表示され（ず）、
    対象処理が完了しない（継続できる）」。本機能にメール送信・件名・本文入力は一切存在しない
    （設計書に該当節なし・TenantController.php全体にメール送信呼出0件=実測）ため該当フィールド
    自体が不存在。両極性とも過剰生成。**偽陰性なし**（該当機能が無いこと自体を確認済み・代替の
    bound対象も存在しない＝救済先なしでexcluded）。
  - **EX-E 詳細編集画面の保存メッセージスコープ外（-058・1件）**: 期待「要ソース確認であること」
    （更新抑止観点）。前提ヒントM10-14-MSG-006（「保存しました」）は設計書の表示メッセージ表
    （md:171）上は本一覧画面の節に記載されているが、文言の実体は店舗登録・編集画面の保存成功時
    （`admin.common.save_complete`、TenantController::detail()内で使用）に属し、一覧画面自体には
    保存アクションが無い（md:35で永続化手順全体を除外済み）。一覧画面の更新抑止という観点では
    対応する実挙動が無いため除外。**偽陰性なし**: 削除完了メッセージ（MSG-007相当）は-059で
    bound済み。

### 86対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| test_id | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| -001 | 「基本情報」配下メニューで表示されるテナント検索結果テーブルのページであること | bound | C-001 |
| -002 | 検索入力の表示復元・ページネーション状態を保持するセッション名前空間であること | bound | C-012（resume復元で間接実証） |
| -003 | DELETE APIがtenant_statusを削除マスタへ書換えフラッシュすること | bound | C-050 |
| -004 | 検索欄に「店舗名」相当の入力欄が並ぶこと | bound | C-001 |
| -005 | CSRFおよびフォーム項目を含んだ検索送信が処理されること | bound | C-002（shared・POST検索一般成立） |
| -006 | GETでページ番号・表示件数を更新しresume/パスパラメタでセッション条件を復元し再クエリすること | bound | C-012 |
| -007 | 「一括操作」領域が表示/非表示に切り替わること | bound | C-014 |
| -008 | 選択各行の削除URLへDELETE Ajaxを並列送信すること | bound | C-051 |
| -009 | 必須バリデーションでエラー表示・処理未完了 | **excluded** EX-A | ─ |
| -010 | 必須バリデーションでエラーなし・処理継続 | bound | C-006（shared・空入力POST継続） |
| -011 | 表示件数プルダウン変更で同一一覧へブラウザ遷移すること | bound | C-011 |
| -012 | 相関バリデーションでエラー表示・処理未完了 | **excluded** EX-B | ─ |
| -013 | 相関バリデーションでエラーなし・処理継続 | **excluded** EX-B | ─ |
| -014 | 相関バリデーションでエラーなし・処理継続 | **excluded** EX-B | ─ |
| -015 | 相関バリデーションでエラー表示・処理未完了 | **excluded** EX-B | ─ |
| -016 | DBとの相関バリデーションでエラーなし・処理継続 | **excluded** EX-B | ─ |
| -017 | DBとの相関バリデーションでエラー表示・処理未完了 | **excluded** EX-B | ─ |
| -018 | 削除処理完了後、店舗一覧画面を再読込すること | bound | C-052 |
| -019 | 検索条件の該当レコードが含まれること（読替=店舗名LIKE） | bound | C-002 |
| -020 | 検索条件の該当レコードが含まれないこと（読替=不一致） | bound | C-003 |
| -021 | 検索条件の該当レコードが含まれること（読替=ID等価） | bound | C-004 |
| -022 | 検索条件の該当レコードが含まれないこと（読替=モールルート除外） | bound | C-005 |
| -023 | 検索条件の該当レコードが含まれること（読替=論理削除後も残存） | bound | C-009 |
| -024 | 検索条件の該当レコードが含まれないこと（読替=ゼロ件） | bound | C-003（shared） |
| -025 | 検索条件の該当レコードが含まれること（読替=空文字が全件一致） | bound | C-006 |
| -026 | 検索条件の該当レコードが含まれないこと（読替=不存在ID） | bound | C-004（shared・不一致側は同一機構の裏面） |
| -027 | 検索条件の該当レコードが含まれること（読替=%エスケープ） | bound | C-008 |
| -028 | 検索条件の該当レコードが含まれないこと（読替=%非ワイルドカード化） | bound | C-008（shared） |
| -029 | 検索条件の該当レコードが含まれること（読替=_エスケープ） | bound | C-008（shared） |
| -030 | 検索条件の該当レコードが含まれないこと（読替=_非ワイルドカード化） | bound | C-008（shared） |
| -031 | 検索条件の該当レコードが含まれること（読替=10桁境界内ID一致） | bound | C-004B（専用10桁SEED＝SEED-M10-14-BOUNDARY-ID。§2/§3改訂1参照） |
| -032 | 検索条件の該当レコードが含まれないこと（読替=桁あふれnull） | bound | C-007 |
| -033 | 実行結果の該当レコードが含まれること（dtb_base_info一般） | bound | C-002（shared） |
| -034 | 実行結果の該当レコードが含まれること（mtb_tenant_status） | bound | C-050（REMOVED=3裏付け・shared） |
| -035 | 実行結果の該当レコードが含まれること（検索テキスト一般） | bound | C-002（shared） |
| -036 | 更新内容の対象レコードの値が変更されること（店舗名リンク押下） | **excluded** EX-C | ─ |
| -037 | 更新内容の対象レコードの値が変更されないこと（表示件数プルダウン変更） | bound | C-010 |
| -038 | 更新内容の対象レコードの値が変更されること（検索送信） | **excluded** EX-C | ─ |
| -039 | モーダル内リストへエラー文を増やすこと（Ajax DELETE異常応答） | bound | C-051（shared・障害系はL1-027/028の要実機注記付） |
| -040 | 更新内容の対象レコードの値が変更されること（一般） | bound | C-050（shared） |
| -041 | 更新内容の対象レコードの値が変更されること（検索条件セッション） | bound | C-012（shared・セッション状態変化） |
| -042 | 更新内容の対象レコードの値が変更されないこと（読取専用操作一般） | bound | C-053 |
| -043 | 更新内容の対象レコードの値が変更されること（page_count一致時セッション更新） | bound | C-011（shared） |
| -044 | 更新内容の対象レコードの値が変更されないこと（検索POSTはDB非書込） | bound | C-018（shared） |
| -045 | 更新内容の対象レコードの値が変更されること（ページ送りでpage_no更新） | bound | C-012（shared） |
| -046 | 実行結果の対象レコードの値が変更されること（チェック操作起点の削除完了） | bound | C-050（shared） |
| -047 | 選択各行の削除URLへDELETE Ajaxを並列送信すること | bound | C-051 |
| -048 | 店舗詳細編集へ遷移すること | bound | C-016 |
| -049 | 画面上部に検索フォームであること | bound | C-001（shared） |
| -050 | 表示件数プルダウン変更で同一一覧へブラウザ遷移すること | bound | C-011（shared） |
| -051 | 論理削除確認モーダル・進捗バーであること | bound | C-015 |
| -052 | 削除条件の対象レコードが削除状態にならないこと（モーダルキャンセル） | bound | C-053（shared・確認未確定は不変） |
| -053 | 実行結果の対象レコードが削除状態になること | bound | C-050（shared） |
| -054 | 送信せず店舗一覧画面に留まること（M10-14-MSG-001） | **BC別管理** | 対応候補ケースなし（BC-DRAFT-M1014-01。C-014は`#btn_bulk`表示切替のみでこの発火条件を検証しないためbound不成立・撤回。§8冒頭「BC別管理の根拠」参照） |
| -055 | 実行結果の対象レコードが削除状態になること | bound | C-050（shared） |
| -056 | 削除処理を開始し店舗一覧画面に留まること（M10-14-MSG-003） | bound | C-050（shared・削除中...表示） |
| -057 | 要ソース確認（表示順） | bound | C-019 |
| -058 | 要ソース確認（更新抑止） | **excluded** EX-E | ─ |
| -059 | 要ソース確認（内部情報・M10-14-MSG-007） | bound | C-050（shared・削除しました） |
| -060 | DBには保存しないこと（検索テキスト） | bound | C-018 |
| -061 | 標準の一覧クエリはtenant_statusで除外しないこと | bound | C-009（shared） |
| -062 | 「検索結果はありません」系の共通メッセージと案内であること | bound | C-003（shared） |
| -063 | 並列処理の結果配列側で個別文言をリスト表示し処理完了文言へ至ること | bound | C-051（shared） |
| -064 | 件名でエラー表示・処理未完了 | **excluded** EX-D | ─ |
| -065 | 件名でエラーなし・処理継続 | **excluded** EX-D | ─ |
| -066 | GETはページングとresumeであること | bound | C-012（shared） |
| -067 | 本文でエラー表示・処理未完了 | **excluded** EX-D | ─ |
| -068 | 本文でエラーなし・処理継続 | **excluded** EX-D | ─ |
| -069 | 検索条件セッションの更新であること | bound | C-012（shared） |
| -070 | 一覧・検索ID条件・リンク生成に利用（dtb_base_info.id） | bound | C-004（shared） |
| -071 | 一覧に表示および検索のLIKE参照（dtb_base_info.shop_name） | bound | C-002（shared） |
| -072 | DELETEにより削除マスタ参照へ更新（dtb_base_info.tenant_status） | bound | C-050（shared） |
| -073 | 削除を表す行の主キー（mtb_tenant_status.id） | bound | C-050（shared） |
| -074 | Symfonyフォーム単体ではほぼ束縛が無いこと（検索テキスト） | bound | C-017 |
| -075 | 店舗詳細編集であること | bound | C-016（shared） |
| -076 | 同一機能の一覧へGET、ページは1側へ明示付与であること | bound | C-011（shared） |
| -077 | 保存済み入力でクエリであること | bound | C-002（shared・POST検索後の反映） |
| -078 | モーダル内リストへエラー文を増やすこと | bound | C-051（shared） |
| -079 | 画面表示データでエラーなし・処理継続 | bound | C-001（shared） |
| -080 | 検索入力の表示復元・ページネーション状態のセッション名前空間 | bound | C-012（shared） |
| -081 | 画面表示データでエラーなし・処理継続（論理削除文脈） | bound | C-050（shared） |
| -082 | 検索欄に「店舗名」相当の入力欄が並ぶこと | bound | C-001（shared） |
| -083 | CSRFおよびフォーム項目を含んだ検索送信が処理されること | bound | C-002（shared） |
| -084 | GETでページ番号・表示件数を更新しresume等で再クエリすること | bound | C-012（shared） |
| -085 | 店舗詳細編集へ遷移すること | bound | C-016（shared） |
| -086 | 画面上部に検索フォームであること | bound | C-001（shared） |

`func_scope_check`判定: 親86/86会計済み・欠落0・理由なし重複0・補完1行（C-060）は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・BC/DOC-DRAFT・excluded（正直な分離）

- **TBD=0件・BC別管理=1件（-054）**: 全bound行はL1（§1）で期待値拘束済み。excluded 14件は上記4カテゴリ
  で一次資料根拠つき。-054は下記BC-DRAFT-M1014-01に紐づくBC別管理として独立保持（§8参照）。
- **BC-DRAFT（設計書↔実装の乖離候補。正式採番はcodex承認時）**:
  1. **BC-DRAFT-M1014-01（静的コアテンプレート上の発火導線未確認・未解決）**: §0前文参照。
     `.action-submit`/`#form_bulk`のガードJSは実在するが対応HTML要素がテナント一覧に無く、実際の
     削除ボタン（`#bulkDelete`）には未選択時の警告が無い（0件でも無警告で「完了」に到達）。
     **-054（M10-14-MSG-001対応行）はC-014等いずれの候補ケースでも実測・検証しておらず、
     bound/TBD/excludedのいずれでもない「BC別管理」として§8で独立集計する**（改訂1でC-014への
     誤ったbound・断定的な「到達不能」記載を撤回。現状把握できているのは「この静的コード構造からは
     発火導線が見当たらない」という事実のみで、他経路の存在まで否定し尽くしたとは主張しない）。
     裁定（bound化するか・excluded化するか）はcodex/発注者に委ねる。
  2. **BC-DRAFT-M1014-02（productClassesModal残骸）**: §0前文参照。テナント一覧に対応するHTML
     要素が無く発火しない（本機能のオラクルには含めない・除外根拠には使わない＝単なる残骸コード
     の記録）。
- **DOC-DRAFT（設計書内部/設計書↔他資料の矛盾候補）**:
  1. **DOC-DRAFT-M1014-01**: 無効POST（has_errors=true）時の表示は、設計書が示唆する専用エラー
     視覚状態ではなく、真のゼロ件時と同一の`{% else %}`ブロックに収束する（index.twigに
     `has_errors`参照0件）。C-003のオラクルはこの実装挙動を踏まえ「ゼロ件案内と同一表示」で記載。
  2. **DOC-DRAFT-M1014-02**: 設計書メッセージ表の英語列（MSG-005/006/007）が実際のEN翻訳資産
     （"Failed to save"/"Saved"/"Deleted"）と異なる日本語表記のまま。L1-026は実際のEN実体を正として
     採用。
- **要実機（確定は保留）**:
  - L1-022: CSRF非検証が実運用のSymfony設定（本番相当）でも同一かどうか（開発/テスト環境固有の
    差異が無いことの確認）。
  - L1-027: `success:false`分岐はこのコントローラ単体からは到達しない（プラグイン等での到達を
    要実機確認）。
  - -EN 2行（C-001-EN/C-014-EN）: 他候補群と同様、実行はD15前提で保留（文言確定は本書で完了）。
  - モールルート無防備（§0前文）: アプリ側ガードの有無は実測確認済み（無い）が、実際に
    モールルート行へDELETEを送った場合の挙動そのもの（tenant_status変更が成立するか）は、
    ハーネス側の自衛規律により**意図的に検証しない**（本番共通データ保護を優先し実行しない）。
  - C-051（複数並列DELETE）: 改訂1で「他方が失敗しても自身は確定する」という独立性の主張を撤回し
    「通常成功時の2件REMOVED」に限定した。失敗注入下での独立成立の実証は要実機（失敗誘発手段は
    本候補では定義しない）。
  - C-004B（10桁境界）: 専用SEED（SEED-M10-14-BOUNDARY-ID）の投入自体は§2.1のSQL契約で自己完結する
    設計だが、実際のSEED投入・afterEach復元の実行はspec/page実装後（M0）に確認する。

## §10 実行順序・依存関係（メモ）

破壊系ケース（C-050〜053）はSEED-M10-14-DELETABLE系を専有するため、同一SEED行を参照する
非破壊ケース（C-002〜009等のSEED-M10-14-TENANT系）とは独立したテストプロセス/ファイルへ分離し、
フレッシュDB・serial実行前提（`e2e-standard-run-requirements`）を満たす環境でのみ実行する。
