# B0候補: m02-06 管理画面_トップおすすめプラグイン — 実行可能グレード候補（母集合68全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Blocker1＋Major2）→改訂1で是正・R2再確認待ち**
> （excluded=14妥当・CTA分岐の実装根拠正・外部委譲の偽陰性なし・捏造ゼロ・DOC-DRAFT妥当はcodex確認済み）。
> **改訂1（codex R1是正）**:
> (1) **Blocker=実行可能性会計の是正**: 遷移先がRESP-*契約に無い追加外部APIを呼ぶ事実を会計へ反映
> —— C-006の遷移先レンダ（オーナーズストア検索）は `getCategory()`＝`GET /category`（OwnerStoreCtl:88-92）、
> C-014/C-016のクリック遷移先（インストール確認）は `getPlugin($id)`＝`GET /plugin/{id}`（OwnerStoreCtl:183・
> ApiSvc:183-190。**PluginApiException時は当該URLに留まらず認証キー設定へリダイレクト**=OwnerStoreCtl:192-196）
> に依存 → §2aへ**隣接スタブ契約 RESP-CATEGORY／RESP-PLUGINS／RESP-PLUGIN-DETAIL を追加**し、C-006を
> **実行保留（スタブ要）へ移動**（href同定サブ手順のみ今すぐ可と注記）・C-014/C-016のクリック遷移は
> RESP-PLUGIN-DETAIL前提を明記。C-007は**footer遷移を手順から除去（縮退）**して今すぐ実行可を維持。
> 会計= **今すぐ実行可6行・スタブ要実行保留25行**（§7/§9-3更新）。
> (2) **Major1=C-020重複source上書きの決定的観測**: 旧設計は版関係未固定＋findAll走査順不定で上書きを実証
> 不能だった → **相反version（同一source・L3=API未満/L3b=API以上）＋挿入順・行更新なしのSEED契約
> （SEED-M0206-PLUGIN-DUP=additive・C-020専用）＋単独行フェーズA/Cの決定的対照**へ再設計し、L1-009に
> 「最終状態は最後に評価された一致行に依存・走査順はORDER BY無しfindAll=仕様として固定されない」の意味論を
> 精密化。**有料の後段上書き（status4・順序非依存で決定的）はC-029へ分離**（-031のbind先。C-020は親を
> 持たない補完行へ移動=重複の親候補-030は極性不整合ノイズ）。
> (3) **Major2=BC-DRAFT-m02-06-1の確度強化**: 「実走で×ならBC確定」の未確定化をやめ、
> **ソース確認済みの不具合候補**（Twig字句規則上 `{ }}` はリテラル出力・contact_url真なら必ずHTML出力=静的確定）
> へ格上げ。実走は再現確認（見え方の記録）に位置付け（§9-2/L1-015/C-023/json同期）。
> **改訂1の履歴として本記載を保持し、以降の本文は是正後の内容。**
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:168）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02・m02-01・m02-02・m02-03・m02-04 の各
> `_drafts/*_executable_draft.md`。特に m02-01〜m02-04〔同一ホーム画面の隣接カード・href/route識別・
> read-only裁定・無書込ブラケット〕と同型。**m02-05〔外部連携〕と同時進行＝外部契約の扱いを揃える**:
> 外部API応答の中身を期待値の正にせず、表示契約〔枠・状態別CTA・失敗時表示〕を一次資料から確定し、
> 外部応答自体は要実機/外部スタブへ分離・独立集計〔§9〕）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-06_admin_home_home_recommend_plugins_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**32**＝bound対応27（ja26＋-EN1）＋補完5（ja5）。
> 母集合68=bound54＋TBD0＋excluded14。
> **不具合候補/設計書矛盾候補**: BC-DRAFT-m02-06-1（モーダル内リテラル「{ }}」表示汚染・**ソース確認済み**=§9-2）・
> DOC-DRAFT-m02-06-1（設計書入口表のオーナーズストア遷移先URL例示が実装リンク先routeと不一致=§9-1）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-06_admin_home_home_recommend_plugins.md`（本repo HEAD
  `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点。以下「md:行」）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-B0既候補と同一）。
- fid_kubun.tsv（D1・sha256先頭 `44fbf02f1e4c`）:
  `M02-06｜m02-06_admin_home_home_recommend_plugins｜おすすめプラグイン｜対象｜標準｜ec-cube-enterprise/m02-06_admin_home_home_recommend_plugins.md｜standard-src+design｜0`（fid_kubun.tsv:168）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-06全**68行**
  （IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-001〜068。以下「-nnn」）。
- 本機能はカスタマイズ区分=**標準**（md:17「挙動・画面とも移行先のec-cube-enterpriseの実装を正とする。
  DB関連の記述（テーブル名・列名）もec-cube-enterpriseを正とする」）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全68行の期待要旨併記）。
  例: -001は観点ラベル「CSRF」だが期待テキストは用語「おすすめプラグイン」の定義（外部APIから取得する配列）
  ＝行表示ケースへbind（本機能にアプリ宛フォームPOSTがなくCSRFは非該当）。-011は観点ラベル「文字列長」だが
  期待テキストは「外部URLを別ウィンドウで開く」＝外部リンクケースへbind。
- **★外部連携の扱い（本機能の要点）**: おすすめプラグインは**サーバ側で外部プラグインAPIから取得**する
  （AdminController.php:189→PluginApiService::getRecommended）。サーバ間通信のためブラウザの
  route interception ではモックできない（既存記録の実測知見）。したがって
  (a) **外部API応答の中身（推奨リスト・並び順・各項目値）は期待値の正にしない**（md:171「ホーム画面側では
  推薦順や絞り込みを変更しない」・md:197「返却値を正とする」＝データ通過。応答fixtureは入力再現手段）。
  (b) 期待値の正は**表示契約**（カード枠・行DOM・モーダル項目・状態別CTAの分岐条件と文言・失敗時表示）で、
  設計書md＋twig/実装から確定する（本書で全確定済み=§1）。
  (c) 実行は**サーバ側スタブAPI（env ECCUBE_PACKAGE_API_URL 切替）が未整備**のため、応答状態を要する
  ケースは**実行保留（要実機基盤）**へ正直に分離し§9で独立集計する（偽陰性禁止＝excludedにしない）。
  (d) **遷移先の追加外部API依存（codex R1是正）**: 本機能からの遷移先も同一外部APIの**別エンドポイント**を
  呼ぶ——オーナーズストア検索= `getCategory()`（`GET /category`・失敗はcatchで空=OwnerStoreCtl:88-92／
  ApiSvc:58-67）＋`getPlugins()`（`GET /plugins`・失敗はcatchでエラーメッセージ表示=OwnerStoreCtl:148-154）、
  インストール確認= `getPlugin($id)`（`GET /plugin/{id}`・**失敗時は認証キー設定へリダイレクト**=
  OwnerStoreCtl:183,192-196）。遷移先の**レンダ確認・クリック到達の安定観測**はこれらの隣接スタブ契約
  （§2a RESP-CATEGORY/RESP-PLUGINS/RESP-PLUGIN-DETAIL）が前提＝該当部分もスタブ要へ会計（遷移先画面の
  中身の正はあくまで遷移先機能設計＝委譲。隣接契約は観測を成立させる基盤のみ）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_06_admin_home_home_recommend_plugins_e2e_cases.md`
  （2026-07-06 Codex実走 **4〇/23×**。〇=カード見出し・footerリンク・オーナーズストア遷移・未認証ガード。
  ×の主因は (1) **外部API推奨応答/状態別CTA/API失敗のサーバ側スタブAPI未作成**＝外部契約の要実機規模が
  大きい (2) 縦スクロール確認は waitUntil load の30秒タイムアウト＝ハーネス待機条件（§6.4で是正方針））。
- 既存道具（実装済み・再利用）: `e2e/helpers/db.ts`（psql照会）・`e2e/helpers/oracle.ts`（L1解決器＋_drafts
  隔離ガード）・`e2e/pages/admin/m02/m02_06_admin_home_home_recommend_plugins.page.ts`（#ec-cube-plugin・
  card-title・card-body・オーナーズストアリンク・モーダル起動リンクのセレクタ実装済み・2026-07-06実走4〇で
  カード枠系は実機実績）。サーバ側スタブAPI・SEED実体は**未実装**（§2は設計・D5型契約）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/AdminController.php`
  - ApiSvc = `src/Eccube/Service/PluginApiService.php`
  - twig = `src/Eccube/Resource/template/admin/index.twig`（おすすめプラグインカード=274-302）
  - modal = `src/Eccube/Resource/template/admin/Store/plugin_detail_modal.twig`（全72行）
  - info = `src/Eccube/Resource/template/admin/Store/plugin_detail_info.twig`（12-28）
  - OwnerStoreCtl = `src/Eccube/Controller/Admin/Store/OwnerStoreController.php`
  - Plugin = `src/Eccube/Entity/Plugin.php`（dtb_plugin）／BaseInfo = `src/Eccube/Entity/BaseInfo.php`（dtb_base_info）
  - Constant = `src/Eccube/Common/Constant.php`
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
- **設計書/実装の裁定（詳細§9-1/§9-2）**:
  - **DOC-DRAFT-m02-06-1（オーナーズストア遷移先URLの例示不一致）**: 設計書入口表は
    「カード下部の『オーナーズストア』を押下｜`GET /%eccube_admin_route%/store/plugin`」（md:78）と記すが、
    実装のリンク先は `url('admin_store_plugin_owners_search_page')`（twig:299）＝
    `/%eccube_admin_route%/store/plugin/api/search/page[/{page_no}]`（OwnerStoreCtl:76）であり、
    `/store/plugin` は**別route**（`admin_store_plugin`=プラグイン一覧・PluginController.php:75）。
    設計書自身が「Symfony の route 名、URL パス、Controller 構成は扱わない」（md:14・md:35）と宣言するため、
    **裁定: 遷移先の同定は実装routeを正**とし、利用者観点の期待「管理画面内のオーナーズストア検索へ遷移する」
    （md:78/276）は維持。URL例示の是正は上流（設計書保守）へ申し送り。
  - **read-only（EX-Bの根拠・本設計書は設計内整合）**: DB操作節は「本機能は参照系（検索）であり、DBへの
    登録・更新・削除は行わない」（md:238）と明記し、md:27「本ブロックに固有の DB 更新、キャッシュ更新、専用の
    業務監査ログが無いことの明示」・md:222「ホーム画面表示のみでは DB を更新しない」・md:334「業務トランザク
    ションを張ってプラグインや基本情報を更新しない」と一致。ee実装も取得経路（Controller:186-191／
    ApiSvc getRecommended:122-131／buildPlugins:137-164）に persist/flush **0件**（grep実測。読取は
    pluginRepository->findAll:140 と baseInfoRepository->get:249 のみ）＝m02-04のようなDB操作節テンプレ矛盾は
    **ない**。IT-26/IT-05系の書込肯定7行はこの一次資料でexcluded（§8 EX-B）。

## §1 L1原子オラクル表

全24行=**24claim確定・TBDなし**。LS=locale_sensitive（0は理由コード）。en文言はen一次資料逐語（ja翻訳ゼロ）。
**期待値の正は本表のオラクルID**（スタブ応答fixture・DB照会値は入力再現手段/観測値＝三段参照）。
`%eccube_admin_route%` は環境値（既定 `admin`・env ECCUBE_ADMIN_ROUTE=eccube.yaml:69）。
外部API基底URL=環境値（`eccube_package_api_url`＝env ECCUBE_PACKAGE_API_URL・既定
`https://package-api-c2.ec-cube.net/v43`=eccube.yaml:20,236）。外部ストア基底URL=環境値
（`eccube_owners_store_url`＝env ECCUBE_OWNERS_STORE_URL・既定 `https://www.ec-cube.net`=eccube.yaml:21,166）。
EC-CUBEバージョン=定数 `4.3.0`（Constant.php:26）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0206-001 | auth_rule | 未認証の `GET /%eccube_admin_route%/` は admin firewall（`^/%eccube_admin_route%/`=ROLE_ADMIN必須）の form_login により admin_login のログイン画面へ誘導され、ホーム（おすすめプラグインカード #ec-cube-plugin）へ到達しない | `admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`＋`    form_login:`…`        login_path: admin_login`／「非管理者・未認証｜`GET /%eccube_admin_route%/` 等（到達前にログインへ）｜ホーム画面自体に到達できないため、本カードも利用できない」「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される」 | security.yaml:40-47／EccubeExtension.php:81-88／md:79,260 | 0 `non-translated` |
| L1-M0206-002 | http_status | ホーム=`GET /%eccube_admin_route%/`（route `admin_homepage`・GETのみ）。認証済み管理者にダッシュボードを表示し、おすすめプラグインカードはその一部ブロック。テンプレ変数 `recommendedPlugins` はサーバ側で組み立てて渡す | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`＋`#[Template(template: '@admin/index.twig')]`＋`'recommendedPlugins' => $recommendedPlugins,`／「ホーム画面を開く｜`GET /%eccube_admin_route%/`」 | Controller:102-104,202／md:71 | 0 `non-ui-observable` |
| L1-M0206-003 | display_field | カードDOM一式: `#ec-cube-plugin`（card共通クラス）内に、見出し `.card-title`＝`admin.home.recommend_plugins_title` ja「おすすめのプラグイン」/en "Recommended Plug-ins"（card-header内）、card-body（`max-height: 395px; overflow-y: scroll` のインラインstyle＝縦スクロール領域）に `recommendedPlugins` の各要素を**縦に行表示**（行= `.row`: 画像リンク `a[data-bs-toggle="modal"][data-bs-target="#searchPluginModal-{id}"]`>`img src={{plugin.image}} alt={{plugin.name}}`＋名称リンク（同モーダル属性）＋短い説明 `p`）。行ごとに詳細モーダルを同一HTML内へ `include` 出力。card-footerに「オーナーズストア」リンク ja「オーナーズストア」/en "Owners' Store"＝`url('admin_store_plugin_owners_search_page')` | `<div id="ec-cube-plugin" class="card rounded border-0 h-100">`／`<span class="card-title">{{ 'admin.home.recommend_plugins_title'\|trans }}</span>`／`<div class="card-body py-0" style="max-height: 395px; overflow-y: scroll">`／`{% for plugin in recommendedPlugins %}`＋`<a href="#" data-bs-toggle="modal" data-bs-target="#searchPluginModal-{{ plugin.id }}">`＋`<img src="{{ plugin.image }}" class="w-100" alt="{{ plugin.name }}">`＋`<a href="#" data-bs-toggle="modal" data-bs-target="#searchPluginModal-{{ plugin.id }}">{{ plugin.name }}</a>`＋`{{ plugin.short_description }}`＋`{{ include('@admin/Store/plugin_detail_modal.twig', {'item': plugin} ) }}`／`> <a href="{{ url('admin_store_plugin_owners_search_page') }}">{{ 'admin.home.recommend_plugins.owner_store'\|trans }}</a>`／`admin.home.recommend_plugins_title: おすすめのプラグイン`・`admin.home.recommend_plugins.owner_store: オーナーズストア`／`admin.home.recommend_plugins_title: Recommended Plug-ins`・`admin.home.recommend_plugins.owner_store: Owners' Store`／「表示要素｜おすすめプラグインカードには、見出し、プラグイン画像、プラグイン名、短い説明、カード下部のオーナーズストアリンクを表示する。プラグインごとに詳細モーダルも同一 HTML 内に出力する」「一覧レイアウト｜カード本文は最大高さを持ち、縦スクロールする」 | twig:274-302（card:274・title:277・body:280・for:281・img:284-285・name:289・desc:291・modal include:295・footer:299）／ja:1889-1890／en:1867-1868／md:87-88,59,71 | 1 |
| L1-M0206-004 | ext_api_fetch | おすすめ一覧の取得=サーバ側で `GET {eccube_package_api_url}/plugins/recommended` を実行し、レスポンスJSONを配列として読み込む（クエリ条件なし）。**外部API応答の中身（推薦対象・並び順・各項目値）は本機能の期待値の正にしない**（ホーム側で推薦順・絞り込み・内容の業務的補正をしない＝データ通過。応答は表示契約L1-003/011へ渡る入力） | `$url = $this->getApiUrl().'/plugins/recommended';`＋`$payload = $this->requestApi($url);`＋`$plugins = json_decode($payload, true);`＋`return $this->buildPlugins($plugins);`／`eccube_package_api_url: '%env(ECCUBE_PACKAGE_API_URL)%'`＋`env(ECCUBE_PACKAGE_API_URL): 'https://package-api-c2.ec-cube.net/v43'`／「レスポンスの扱い｜外部 API から返却された JSON を配列として扱い、ホーム画面側では推薦順や絞り込みを変更しない」「外部 API との整合性｜推薦対象、並び順、価格、説明、対応バージョンは外部 API の返却値を正とする。ホーム画面側では返却値の内容を業務的に補正しない」「API｜…GET 通信を行う。…クエリ条件は付与しない」 | ApiSvc:122-131／eccube.yaml:20,236／md:171,197,208,104 | 0 `non-ui-observable` |
| L1-M0206-005 | ext_api_headers | 外部API通信の送信ヘッダ= `X-ECCUBE-KEY`（dtb_base_info.authentication_key）・`X-ECCUBE-URL`（現在のリクエストの scheme+host+basePath）・`X-ECCUBE-VERSION`（定数 4.3.0）の3種。認証キー原値はログ・レポートへ出さない（観測はスタブ受信記録⇔DB値の突合をメモリ内で行い原値を記録しない） | `'X-ECCUBE-KEY: '.$key,`＋`'X-ECCUBE-URL: '.$baseUrl,`＋`'X-ECCUBE-VERSION: '.Constant::VERSION,`＋`$key = $this->baseInfoRepository->get()->getAuthenticationKey();`／`public const VERSION = '4.3.0';`／`#[ORM\Column(name: 'authentication_key', type: Types::STRING, length: 255, nullable: true)]`／「送信ヘッダ｜プラグイン認証キー、現在のサイト URL、EC-CUBE バージョンを送信する。認証キーの原値は表示・記録しない」「ログに出してはいけないもの｜プラグイン認証キーの原値」 | ApiSvc:249-259／Constant.php:26／BaseInfo.php:141-142／md:169,105,310 | 0 `non-ui-observable` |
| L1-M0206-006 | ext_api_failure | 外部API通信は**タイムアウト5000ms**（CURLOPT_TIMEOUT_MS）。HTTPステータスが200でない、または通信結果がfalse（タイムアウト・接続失敗含む）の場合 `PluginApiException` を送出する（=通信失敗・HTTP 200以外・実行結果falseはプラグインAPI例外として扱う）。通信情報（curl info）はアプリケーションログへ出力する | `CURLOPT_TIMEOUT_MS => 5000,`＋`log_info('http get_info', $info);`＋`if ($info['http_code'] !== 200 \|\| $result === false) {`＋`    throw new PluginApiException($info);`／「通信タイムアウト｜外部 API 通信にはタイムアウトが設定されている。タイムアウトまたは HTTP 200 以外はプラグイン API 例外として扱う」「API 失敗時｜通信失敗、HTTP 200 以外、実行結果 false はプラグイン API 例外として扱う」「外部 API 通信後｜HTTP 通信情報をアプリケーションログに出力する」 | ApiSvc:266,277-281／md:170,209,304 | 0 `non-ui-observable` |
| L1-M0206-007 | fail_fallback | ホーム表示処理は `PluginApiException` を**catchして握りつぶし**、`recommendedPlugins` を空配列のままテンプレートへ渡す＝ホーム画面表示は継続し、おすすめプラグイン行は表示されない。**本カード内に取得失敗の専用エラー文言は表示しない**（twig:274-302/modalに失敗分岐・エラー表示要素なし=静的実測） | `$recommendedPlugins = [];`＋`try {`＋`    $recommendedPlugins = $this->pluginApiService->getRecommended();`＋`} catch (PluginApiException) {`＋`}`／「おすすめ一覧の取得に失敗した状態でホーム画面を開く｜ホーム画面の表示は継続し、おすすめプラグインの行は表示されない。取得失敗を示す専用メッセージは本カード内に表示しない」「外部 API 通信失敗｜…例外を捕捉し、おすすめプラグイン配列を空にする。本カード内にエラー文言は表示しない」「HTTP ステータスが 200 ではない｜プラグイン API 例外として扱い、ホーム画面では空配列表示にフォールバックする」 | Controller:186-191／md:72,181-182,286-287,108 | 0 `non-translated` |
| L1-M0206-008 | empty_rule | 外部APIが空配列を返した場合（および失敗フォールバック時）、forループ0回＝プラグイン行・モーダルとも出力されない。**本文内に空表示用の文言は出さず**、カード見出しとcard-footerのオーナーズストアリンクは表示する | `{% for plugin in recommendedPlugins %}`…`{% endfor %}`（else節・空表示文言なし）＋`> <a href="{{ url('admin_store_plugin_owners_search_page') }}">…</a>`／「外部 API が空配列を返す｜おすすめプラグイン行は表示しない。カード下部のオーナーズストアリンクは表示する」「一覧レイアウト｜…プラグインが 0 件の場合、本文内に空表示用の文言は出さず、カード下部のオーナーズストアリンクだけを表示する」 | twig:281-296,298-300／md:180,88 | 0 `non-translated` |
| L1-M0206-009 | status_rule | インストール状態（update_status）の算出: ローカル登録済みプラグインを**全件取得**（findAll・条件なし）し、各おすすめプラグインについて ①初期値 `update_status=1`（未インストール・未購入扱い） ②ローカルの `source` が外部APIの `id` と一致（`==`）→ `2`（インストール済み） ③一致かつ `version_compare(ローカルversion, API version, '<')` → `3`（アップデートあり） ④`purchased == false` かつ `purchase_required == true` → `4`（未購入の有料。**②③の後段で評価され上書き**） の順で決める。**重複時の意味論（改訂1で精密化）**: ループは一致行ごとに `update_status` を**2へ再セットした後に**版比較で3を設定するため、同一sourceの重複ローカル行がある場合、②③の最終状態は**走査で最後に評価された一致行**の版比較結果に依存する。`findAll` はORDER BY指定なし＝**走査順はDB実装依存で仕様として固定されない**（md:184も「一致したものに基づき上書き」とだけ述べ勝者を約束しない。順序自体は非オラクル・C-020は相反version＋単独行対照で「一致に基づく2/3であり1/4でない」までを拘束し、どの行が勝ったかは観測記録） | `$pluginInstalled = $this->pluginRepository->findAll();`＋`// Update_status 1 : not install/purchased 、2 : Installed、 3 : Update、4 : not purchased`＋`$item['update_status'] = 1;`＋`foreach ($pluginInstalled as $plugin) {`＋`    if ($plugin->getSource() == $item['id']) {`＋`        $item['update_status'] = 2;`＋`        if ($this->isUpdate($plugin->getVersion(), $item['version'])) {`＋`            $item['update_status'] = 3;`＋`}`＋`if ($item['purchased'] == false && (isset($item['purchase_required']) && $item['purchase_required'] == true)) {`＋`    $item['update_status'] = 4;`／`return version_compare($pluginVersion, $remoteVersion, '<');`／「インストール状態判定順序」表md:151-158（初期=未インストール・未購入扱い→取得元ID一致=インストール済み→ローカルversionが古い=アップデートあり→未購入かつ購入必要=未購入の有料）＋「この判定はインストール済み・アップデートあり判定の後に評価され、条件に一致した場合は表示状態を上書きする」「同じ取得元 ID のローカルプラグインが複数ある｜実装上は全件を走査し、一致したものに基づき状態を上書きする」「ローカルプラグイン突き合わせ｜ローカルの登録済みプラグイン全件を取得し、外部 API のプラグイン ID とローカルの取得元 ID が一致するかをプラグインごとに確認する」 | ApiSvc:137-164（findAll:140・init:144・match:146-148・update:149-152・purchase:155-158）／ApiSvc:169-171／Plugin.php:24,43-46（dtb_plugin.version/source）／md:113-118,151-158,145,184-185 | 0 `non-translated` |
| L1-M0206-010 | version_check | 対応バージョン判定= `in_array(Constant::VERSION(=4.3.0), item.supported_versions)`。含まれれば `version_check=true`（警告なし）・含まれなければ `false`（詳細モーダルに警告表示=L1-014）。一覧行の表示自体はversion_checkに依存しない（非対応でも行は表示） | `$plugin['version_check'] = false;`＋`if (in_array(Constant::VERSION, $plugin['supported_versions'])) {`＋`    $plugin['version_check'] = true;`／「対応バージョン｜現在の EC-CUBE バージョンが、外部 API 取得値の対応バージョン一覧に含まれるかで判定する」「対応バージョン一覧に現在バージョンが含まれない｜一覧行は表示する。詳細モーダルに非対応警告を表示する」 | ApiSvc:305-313／Constant.php:26／md:173,157-158,186 | 0 `non-translated` |
| L1-M0206-011 | modal_dom | 詳細モーダル `#searchPluginModal-{id}`（行ごとに同一HTML内へ出力・Bootstrap modal）: ヘッダ見出し ja「商品詳細」/en "Product Details"＋閉じる `.btn-close`。本文= 画像（`item.image`。**空ならdefaultで代替画像 `noimage_plugin_list.png`**）・名称h5・短い説明p・販売価格（L1-012）・詳細infoリスト（**無料時のみ**ダウンロード数〔`{% if not item.price %}`・number_format〕・プラグインバージョン・EC-CUBE対応バージョン（supported_versions列挙）・公開日・最終更新日（date_day書式）・ライセンス・制作者〔author.url有ならリンク〕）・contact/manualボタン（L1-015）・警告（L1-014）・長い説明（`long_description\|raw\|purify`）。ラベルja/en: ダウンロード数/Downloads・プラグインバージョン/Plugin Version・EC-CUBE対応バージョン/Supported EC-CUBE Version・公開日/Release Date・最終更新日/Last Updated・ライセンス/License・制作者/Developed by | `<div class="modal fade" id="searchPluginModal-{{ item.id }}"`…／`{{ 'admin.store.plugin_owners_search.modal.header'\|trans }}`／`src="{{ item.image\|default(asset('noimage_plugin_list.png', 'save_image')) }}"`／`{% if not item.price %}`＋`…{{ 'admin.store.plugin.detail.download'\|trans }}</span>{{ item.downloads\|number_format }}`／`{{ item.version }}`／`{% for version in item.supported_versions %}{{ version }} …{% endfor %}`／`{{ item.publish_date\|date_day }}`／`{{ item.update_date\|date_day }}`／`{{ item.license }}`／author節（url有→`<a …>{{ item.author.name }}</a>`）／`{{ item.long_description\|raw\|purify }}`／ja: `admin.store.plugin_owners_search.modal.header: 商品詳細`・`admin.store.plugin.detail.download: ダウンロード数`・`…version: プラグインバージョン`・`…support: EC-CUBE対応バージョン`・`…public_date: 公開日`・`…update_date: 最終更新日`・`…license: ライセンス`・`…develop: 制作者`／en: `Product Details`・`Downloads`・`Plugin Version`・`Supported EC-CUBE Version`・`Release Date`・`Last Updated`・`License`・`Developed by`／「モーダル内容｜画像、名称、短い説明、税込価格、ダウンロード数、バージョン、対応 EC-CUBE バージョン、公開日、最終更新日、ライセンス、制作者、問い合わせ URL、マニュアル URL、長い説明を表示する」「プラグイン画像が空｜一覧の画像は API 取得値をそのまま参照する。詳細モーダルでは代替画像を表示する」「価格表示｜…無料プラグインではダウンロード数も表示する」 | modal:1-48（id:1・header:5・close:6・img default:11-12・name:15・desc:16・info include:22・long:46）／info:12-28（downloads条件:13-15・version:16・support:17・publish:18・update:19・license:20・author:21-27）／ja:3513,3432-3440／en:3127,3046-3054／md:90,188,174,61 | 1 |
| L1-M0206-012 | price_display | モーダルの価格表示= ラベル ja「販売価格」/en "Selling Price"＋ `item.price` を `price` フィルタ（NumberFormatter CURRENCY・locale/currency は環境値・既定 ja/JPY=¥記号付き3桁区切り）で通貨書式表示＋後置 `(税込)`/"(Tax Incl.)"＝**税込表記** | `<span class="fw-bold text-dark">{{ 'admin.store.plugin.price'\|trans }} </span> {{ item.price\|price }}<small> ({{ 'common.tax_include'\|trans }})</small>`／`$formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY);`＋`return $formatter->formatCurrency((float) ($number ?? 0), $currency);`／`env(ECCUBE_LOCALE): 'ja'`＋`env(ECCUBE_CURRENCY): 'JPY'`／ja: `admin.store.plugin.price: 販売価格`・`common.tax_include: 税込`／en: `Selling Price`・`Tax Incl.`／「価格表示｜モーダルでは価格を税込表記として表示する」 | modal:17／EccubeExtension.php:89,178-187／services.yaml:8,10-13／ja:3431,82／en:3045,77／md:174 | 1 |
| L1-M0206-013 | cta_rule | モーダルfooterの主導線はupdate_statusで排他分岐: **1**→ `a href=url('admin_store_plugin_install_confirm',{id})` 文言 ja「入手する」/en "Get It" ／**2**→ `a href="#"` ja「インストール済み」/en "Installed"（**遷移先を持たない状態表示**） ／**3**→ install_confirm へのリンク ja「アップデート」/en "Update" ／**4**→ 外部ストア購入フォームのsubmit ja「購入する」/en "Buy It"（L1-017）。併設: 閉じるボタン ja「一覧に戻る」/en "Go back to All"（data-bs-dismiss） | `{% if item.update_status == 1 %}`＋`<a href="{{ url('admin_store_plugin_install_confirm', {'id': item.id}) }}" class="btn btn-primary">`＋`{{ 'admin.store.plugin_owners_search.install.free'\|trans }}`＋`{% elseif item.update_status == 2 %}`＋`<a href="#" class="btn btn-ec-regular">{{ 'admin.store.plugin.installed'\|trans }}</a>`＋`{% elseif item.update_status == 3 %}`…`{{ 'admin.store.plugin.update'\|trans }}`＋`{% elseif item.update_status == 4 %}`…`value="{{ 'admin.store.plugin_owners_search.install.fee'\|trans }}"`／`<button type="button" class="btn btn-ec-sub" data-bs-dismiss="modal">{{ 'admin.store.plugin_owners_search.modal.cancel'\|trans }}</button>`／ja: `入手する`・`インストール済み`・`アップデート`・`購入する`・`一覧に戻る`／en: `Get It`・`Installed`・`Update`・`Buy It`・`Go back to All`／「画面上の主導線はインストール状態に応じて変わる。未インストール・未購入扱いでは「入手する」、インストール済みでは「インストール済み」、アップデートありでは「アップデート」、未購入の有料プラグインでは「購入する」を表示する」「詳細モーダルで「インストール済み」を表示｜インストール確認や購入には進めず、状態表示として扱う」 | modal:52-67／ja:3510-3511,3380-3381,3517／en:3124-3125,2994-2995,3131／md:160,76,129-132 | 1 |
| L1-M0206-014 | warning | `version_check == 0` のとき、モーダル本文に `.alert.alert-danger` の警告 ja「このプラグインはEC-CUBE 4.3.0をサポートしていないため、正常に動作しない可能性があります。」/en "This plugin does not support EC-CUBE 4.3.0. It may not work properly."（%version%=Constant::VERSION の埋込）を表示。`version_check == 1`（対応）のとき警告ブロックは出力されない | `{% set version_check = item.version_check  %}`＋`{% if version_check == 0 %}`＋`<div class="alert alert-danger border border-danger">`＋`<p class="text-danger mb-1">{{ 'admin.store.plugin_owners_search.modal.note'\|trans({"%version%": constant('Eccube\\\\Common\\\\Constant::VERSION') }) }}</p>`／ja: `admin.store.plugin_owners_search.modal.note: "このプラグインはEC-CUBE %version%をサポートしていないため、正常に動作しない可能性があります。"`／en: `"This plugin does not support EC-CUBE %version%. It may not work properly."`／「対応バージョン警告｜現在の EC-CUBE バージョンが対象プラグインの対応バージョン一覧に含まれない場合、モーダル内に警告を表示する」 | modal:35-40／ja:3516／en:3130／Constant.php:26／md:91,157-158 | 1 |
| L1-M0206-015 | external_links | `contact_url` が非空のとき「資料請求・お問い合わせ」/en "Document Request / Inquiry" ボタン（`a target="_blank" href={{item.contact_url}}`）、`manual_url` が非空のとき「マニュアルダウンロード」/en "Download User Guide" ボタン（同 target=_blank）をモーダルに表示し、押下で**外部URLを別ウィンドウで開く**。**URLが空の項目のボタンは出力されない**（if分岐）。※**ソース確認済みの不具合候補**: contact側閉じタグ直後の `{ }}` はTwig開始記法（`{{`/`{%`/`{#`）のいずれにも該当しない**リテラルテキスト**であり、contact_url真のモーダルHTMLに文字列「{ }}」が**必ず出力される**（静的確定）=BC-DRAFT-m02-06-1（§9-2。期待は設計側=余計な表示なし・実走は再現確認の位置付け） | `{% if item.contact_url %}`＋`<a class="btn btn-ec-regular btn-lg mb-3" href="{{ item.contact_url }}" target="_blank">…{{ 'admin.store.plugin_owners_search.modal.contact'\|trans }}</a>{ }}`＋`{% endif %}`＋`{% if item.manual_url %}`＋`<a … href="{{ item.manual_url }}" target="_blank">…{{ 'admin.store.plugin_owners_search.modal.manual'\|trans }}</a>`／ja: `資料請求・お問い合わせ`・`マニュアルダウンロード`／en: `Document Request / Inquiry`・`Download User Guide`／「詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下｜外部 URL を別ウィンドウで開く。URL が無い項目のボタンは表示しない」「問い合わせ URL またはマニュアル URL が空｜該当する外部リンクボタンは表示しない」 | modal:25-30／ja:3514-3515／en:3128-3129／md:77,133,187 | 1 |
| L1-M0206-016 | nav | card-footerの「オーナーズストア」リンク= route `admin_store_plugin_owners_search_page`（`GET\|POST /%eccube_admin_route%/store/plugin/api/search/page/{page_no}`・page_no省略可）への遷移＝**管理画面内のオーナーズストア検索**（plugin_search.twig）。**前提: dtb_base_info.authentication_key が設定済み**（空の場合、遷移先Controllerが警告を出して認証キー設定 `admin_store_authentication_setting` へリダイレクト=遷移先機能の挙動）。**遷移先レンダの追加外部API依存（改訂1）**: 検索画面は `getCategory()`（`GET /category`・失敗はcatchで空配列）と `getPlugins()`（`GET /plugins`・失敗はcatchでエラーメッセージ表示）を呼ぶ＝画面骨格は外部不達でも成立するが、**安定した遷移先レンダ観測は隣接スタブ RESP-CATEGORY/RESP-PLUGINS（§2a）が前提**（href同定はレンダ非依存）。設計書の例示URL `/store/plugin` は実装と不一致（DOC-DRAFT-m02-06-1・§9-1裁定=実装routeを正） | `<a href="{{ url('admin_store_plugin_owners_search_page') }}">`／`#[Route(path: '/%eccube_admin_route%/store/plugin/api/search/page/{page_no}', name: 'admin_store_plugin_owners_search_page', requirements: ['page_no' => '\d+'], methods: ['GET', 'POST'])]`＋`#[Template(template: '@admin/Store/plugin_search.twig')]`＋`if (empty($this->BaseInfo->getAuthenticationKey())) {`＋`    $this->addWarning('admin.store.plugin.search.not_auth', 'admin');`＋`    return $this->redirectToRoute('admin_store_authentication_setting');`＋`$json = $this->pluginApiService->getCategory();`（getCategoryはPluginApiExceptionをcatchし`return [];`）＋`try { $data = $this->pluginApiService->getPlugins($searchData);`…`} catch (PluginApiException $e) { $this->addError($e->getMessage(), 'admin'); }`／「カード下部の「オーナーズストア」を押下｜管理画面内のオーナーズストア検索へ遷移する」 | twig:299／OwnerStoreCtl:75-84,88-92,148-154／ApiSvc:58-67／md:78,276 | 0 `non-translated` |
| L1-M0206-017 | purchase_form | 未購入の有料（update_status=4）の購入導線= モーダルfooterのform: `action="{eccube_owners_store_url}/gateway/purchase/?product_id={item.id}"`・`method="post"`・`target="_blank"`（**外部ストアを別ウィンドウで開くフォーム送信**）・hidden `mode=link_site`＋hidden `public_key={BaseInfo.authentication_key}`（プラグインIDと公開鍵を送信）。公開鍵の具体値はテスト成果物・ログへ記録しない | `<form action="{{ eccube_config.eccube_owners_store_url }}/gateway/purchase/?product_id={{ item.id }}" method="post" target="_blank">`＋`<input type="hidden" name="mode" value="link_site" />`＋`<input type="hidden" name="public_key" value="{{ BaseInfo.authentication_key }}" />`＋`<input type="submit" class="btn btn-primary" value="{{ 'admin.store.plugin_owners_search.install.fee'\|trans }}" />`／`eccube_owners_store_url: '%env(ECCUBE_OWNERS_STORE_URL)%'`／「詳細モーダルで「購入する」を押下｜外部ストアの購入導線を別ウィンドウで開くフォームを送信する」「未購入の有料プラグインの場合、モーダルの主導線として外部ストア購入用フォームの送信ボタンを表示する。フォームはプラグイン ID と公開鍵を送信し、外部ストアを別ウィンドウで開く」「ログに出してはいけないもの｜外部ストア購入フォームに含まれる公開鍵の具体値」 | modal:51,63-66／eccube.yaml:21,166／md:75,132,252,314 | 0 `non-translated` |
| L1-M0206-018 | nav | 「入手する」（status1）・「アップデート」（status3）の遷移先= route `admin_store_plugin_install_confirm`（`GET /%eccube_admin_route%/store/plugin/api/install/{id}/confirm`・id=対象プラグインID）＝管理画面内のインストール確認（遷移後の処理は遷移先機能の範囲=md:278）。**クリック到達の観測前提（改訂1）**: 遷移先 `doConfirm` は `getPlugin($id)`（`GET /plugin/{id}` 外部呼出）を実行し、**PluginApiException時は当該URLに留まらず認証キー設定へリダイレクト**する＝クリック遷移の安定観測は隣接スタブ RESP-PLUGIN-DETAIL（§2a）が前提。href同定はレンダ非依存 | `<a href="{{ url('admin_store_plugin_install_confirm', {'id': item.id}) }}"`／`#[Route(path: '/%eccube_admin_route%/store/plugin/api/install/{id}/confirm', name: 'admin_store_plugin_install_confirm', requirements: ['id' => '\d+'], methods: ['GET'])]`／`$item = $this->pluginApiService->getPlugin($id);`＋`} catch (PluginApiException $e) {`＋`    $this->addError($e->getMessage(), 'admin');`＋`    return $this->redirectToRoute('admin_store_authentication_setting');`／「詳細モーダルで「入手する」または「アップデート」を押下｜`GET /%eccube_admin_route%/store/plugin/install` 等（対象プラグインに応じルーティング。実装を正とする）｜対象プラグインのインストール確認へ遷移する」 | modal:54,60／OwnerStoreCtl:179,183,192-196／ApiSvc:183-190／md:74,272 | 0 `non-translated` |
| L1-M0206-019 | db_effect(read-only) | ホーム表示（おすすめ取得含む）・モーダル開閉・各導線押下の本機能範囲で `dtb_plugin`・`dtb_base_info` へ**登録/更新/削除を行わない**（取得経路に persist/flush 0件=grep実測。DB操作はfindAll/getの読取のみ）。観測契約: 表示＋モーダル操作（＋footerリンクhref読取・**遷移は含めない**=遷移先は追加外部API依存かつ別機能スコープ・改訂1縮退）の前後で両テーブルの行数・主キー順全列ダイジェスト不変（§6.3）。副作用は外部API通信とその通信ログのみ | 「DB操作｜本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない」「本ブロックに固有の DB 更新、キャッシュ更新、専用の業務監査ログが無いことの明示」「副作用｜ホーム画面表示のみでは DB を更新しない。外部 API へサイト情報と認証キーを含む通信を行い、通信情報をログへ出力する」「本ブロックのホーム画面表示は参照と外部 API 通信のみであり、業務トランザクションを張ってプラグインや基本情報を更新しない」／ApiSvc:122-164（persist/flush不出現=grep 0件）・Controller:186-191 | md:238,27,222,334／ApiSvc:122-164,230-284／Controller:186-191 | 0 `non-ui-observable` |
| L1-M0206-020 | no_js | 本ブロック固有のJavaScriptファイルを持たない（カード#ec-cube-plugin・各モーダル内に script 要素・インラインイベントハンドラ0件=twig/modal grep実測。モーダル開閉は `data-bs-toggle`/`data-bs-dismiss` のBootstrap共通挙動）。おすすめ一覧の非同期再取得・表示中の自動更新は行わない（本ブロック起因のXHR/fetch 0件。画像の外部URL読込はリソース取得でありJSではない） | 「JS 挙動｜本ブロック固有の JavaScript ファイルは持たない。モーダルの開閉は管理画面共通の Bootstrap 挙動に従う。おすすめ一覧の非同期再取得や表示中の自動更新は行わない」／twig:274-302・modal:1-72（script/on*属性 不出現=grep実測。data-bs-toggle:284,289・data-bs-dismiss:6,52のみ） | md:92／twig:274-302／modal:1-72 | 0 `non-translated` |
| L1-M0206-021 | no_form_post(app) | 本ブロックは**登録・更新のためのアプリ宛フォームPOSTを持たない**。カード＋モーダル内のform要素は各モーダルfooterの**外部ストア宛購入フォームのみ**（action=eccube_owners_store_url配下・target=_blank）＝アプリオリジン宛のform action 0件。利用者入力フィールド（input[type=text]等の可編集入力）0件＝必須/相関等の入力バリデーション主語が不存在 | 「入力項目｜本ブロックは登録・更新のためのフォーム POST を持たない。プラグイン画像・名称からモーダルを開く操作、モーダル内の外部 URL ボタン押下、カード下部のオーナーズストア導線のみ」「利用者入力｜本カードは検索フォームや保存フォームを持たない。ホーム画面内で利用者が入力する値はない」／`<form action="{{ eccube_config.eccube_owners_store_url }}/gateway/purchase/…` （カード/モーダル内の唯一のform=modal:51。hidden+submitのみで可編集入力なし） | md:94,250／modal:51,63-66／twig:274-302 | 0 `non-translated` |
| L1-M0206-022 | refresh | 表示中のおすすめ一覧・インストール状態は**自動更新しない**（専用JSなし=L1-020。手動更新ボタンなし）。表示後に外部ストア側・ローカルプラグイン状態が変わっても表示中は不変で、ホーム再表示時に外部APIへの取得処理を**再実行**し、その時点のローカル突合で再算出した内容を表示する | 「参照時点｜おすすめプラグイン一覧はホーム画面表示時に外部 API から取得した結果である。表示後に外部ストア側の推薦内容やローカルプラグイン状態が変わっても、表示中の内容は自動更新しない」「再実行｜ホーム画面を再表示すると、外部 API への取得処理も再度実行する。カード内に手動更新ボタンはない」「ローカルプラグインとの整合性｜…インストール確認以降で状態が変わった場合、次回ホーム表示までカード内表示は更新しない」 | md:196,211,198／Controller:186-191（リクエスト毎に取得） | 0 `data-passthrough` |
| L1-M0206-023 | modal_close | モーダルは閉じるボタン（`.btn-close`）と「一覧に戻る」ボタン（`data-bs-dismiss="modal"`）で閉じてホーム画面へ戻る。**閉じる操作でサーバ通信は発生しない**（両ボタンともdismiss属性のみ・href/フォーム送信なし） | `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`＋`<button type="button" class="btn btn-ec-sub" data-bs-dismiss="modal">{{ 'admin.store.plugin_owners_search.modal.cancel'\|trans }}</button>`／「モーダル表示｜…モーダルは閉じるボタン、キャンセルボタンで閉じる」「利用者が閉じるボタンまたはキャンセルボタンを押下すると、モーダルを閉じてホーム画面へ戻る。サーバ通信は発生しない」 | modal:6,52／md:89,125 | 0 `non-translated` |
| L1-M0206-024 | image_empty | プラグイン画像が空の場合: **一覧行の `img src` はAPI取得値をそのまま参照**（defaultなし=空src）・**詳細モーダルは `default(asset('noimage_plugin_list.png','save_image'))` で代替画像**を表示 | `<img src="{{ plugin.image }}" class="w-100" alt="{{ plugin.name }}">`（一覧・defaultなし）／`src="{{ item.image\|default(asset('noimage_plugin_list.png', 'save_image')) }}"`（モーダル）／「プラグイン画像が空｜一覧の画像は API 取得値をそのまま参照する。詳細モーダルでは代替画像を表示する」 | twig:285／modal:11-12／md:188 | 0 `non-translated` |

## §2 SEED三段参照設計（SEED-M0206系・全て `@TBD-D5`・**スタブAPI/SQL実体は未実装**）

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID@manifest_sha1 → 観測=実値**。
**スタブAPI応答fixtureは入力の再現手段であり期待値の正にしない**（表示突合はL1-003/011の「取得値をそのまま
表示・補正しない」契約に基づき、fixture投入値⇔画面表示の一致で観測する=data-passthrough）。
外部APIはサーバ間通信＝**ブラウザroute interceptionでモック不可**（既存記録実測）。再現は
**サーバ側スタブAPI＋env `ECCUBE_PACKAGE_API_URL` の切替**が必須で、**本候補時点で未整備＝該当ケースは
実行保留（§9独立集計）**。dtb_plugin帯ID=900002600番台・マーカー接頭辞 `E2E-M0206-`。

### 2a. スタブAPI応答セット（SEED-M0206-STUB。応答スキーマは実装消費フィールドから確定=捏造ゼロ）

実装が消費するフィールド（twig:284-292／modal:1-67／info:12-27／ApiSvc:144-160,305-311 のアクセス全列挙）:
`id`・`name`・`image`・`short_description`・`price`・`downloads`・`version`・`supported_versions[]`・
`publish_date`・`update_date`・`license`・`author{name,url}`・`contact_url`・`manual_url`・
`long_description`・`purchased`・`purchase_required`。これ以外のフィールドは契約外（スキーマ全体は
md:42で設計スコープ外）。

| 応答ID | 内容（設計・目的） | 使用ケース |
|---|---|---|
| RESP-FULL | 既知プラグイン**6件**の配列: P1=無料・未インストール（purchased=true相当の無償・purchase_required=false・supported_versionsに4.3.0含む・contact_url/manual_urlあり・downloadsあり・price=0）／P2=インストール済み対（ローカルL2とid一致・version同値）／P3=アップデート対（ローカルL3とid一致・APIversionがローカルより新）／P4=有料未購入（purchased=false・purchase_required=true・priceあり）／P5=バージョン非対応（supported_versionsに4.3.0を**含まない**）／P6=画像空・contact_url空・manual_url空。全件で表示項目フィールドを既知値で充足 | C-010〜C-023,C-027,C-028・補完C-040〜C-043 |
| RESP-EMPTY | `[]`（空配列・HTTP200） | C-024 |
| RESP-500 | HTTP 500（本文任意） | C-026 |
| RESP-FALSE | 通信結果false相当（コネクション切断等） | C-026（shared） |
| RESP-TIMEOUT | 5000ms超の遅延応答（タイムアウト） | C-025 |
| （受信記録） | スタブは受信リクエストのパス（`/plugins/recommended`）と受信ヘッダ（X-ECCUBE-KEY/X-ECCUBE-URL/X-ECCUBE-VERSION）を記録する。**X-ECCUBE-KEYの原値はレポート・ログへ出さず**、DB値との一致判定はメモリ内比較（L1-005） | C-027 |

**隣接スタブ契約（改訂1・codex Blocker是正）——遷移先の観測を成立させるための追加エンドポイント**（遷移先
画面の中身の正は遷移先機能設計＝委譲。ここは観測基盤の契約のみ）:

| 応答ID | エンドポイント | 消費実装（file:line） | 応答契約（消費フィールド由来） | 使用ケース |
|---|---|---|---|---|
| RESP-CATEGORY | `GET /category` | OwnerStoreCtl:88-92（`array_column($data,'name','id')`）／ApiSvc:58-67（失敗はcatchで`[]`） | `[{id, name}, …]` の配列（既知2件程度） | C-006（遷移先レンダ） |
| RESP-PLUGINS | `GET /plugins` | OwnerStoreCtl:148-154（`$data['total']`/`$data['plugins']`・失敗はcatchでaddError表示）／ApiSvc:78-97 | `{total, plugins:[…]}`（pluginsはRESP-FULLと同型フィールド・0件可） | C-006（遷移先レンダ） |
| RESP-PLUGIN-DETAIL | `GET /plugin/{id}` | OwnerStoreCtl:183,192-196（`getPlugin($id)`・**失敗時は認証キー設定へリダイレクト**）／ApiSvc:183-190（buildInfo適用=supported_versions要） | RESP-FULLの該当1件と同一値の単一オブジェクト | C-014,C-016（クリック到達の安定観測） |

### 2b. DB SEED（SQL実体は未実装・D5型契約）

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M02-ADMIN | 2FA OFFの有効管理者 | `config/default.config.ts` の既定（既存共通） | 既存利用・撤去不要 |
| SEED-M0206-AUTHKEY | 認証キー設定 | `dtb_base_info.authentication_key` を非空の既知値へ設定（原値は成果物へ記録しない。C-006の遷移前提＋C-027のヘッダ突合・購入フォームpublic_key） | 元値へ復元（down） |
| SEED-M0206-PLUGIN-LOCAL | 突合一致の実体（基本セット・重複なし） | dtb_plugin 3行: L2（id=900002601・source=P2.id・version=P2.versionと同値→status2）／L3（id=900002602・source=P3.id・**version<P3.version**→status3）／L4（id=900002604・source=P4.id・任意version＝C-029の有料後段上書き用） NOT NULL列全充足・IDENTITY明示id・name/codeマーカー `E2E-M0206-`＝**@TBD-D5** | 帯ID/マーカーDELETE（down） |
| SEED-M0206-PLUGIN-DUP | **重複source上書きの決定的観測（C-020専用・additive・改訂1）** | dtb_plugin 1行: L3b（id=900002603・**L3と同source=P3.id・相反version=P3.version以上**〔L3=API未満と反対の版関係〕）。**SEED契約: L3→L3bのid昇順で投入・投入後に両行を更新しない**（append-only=物理走査順の再現条件。findAllはORDER BY無しのため走査順自体は仕様非固定=L1-009）。**C-020内でのみapply**（常設するとC-016/C-018のP3期待=status3が走査順依存になるため隔離）＝**@TBD-D5** | C-020 teardownで即DELETE |
| SEED-M0206-PLUGIN-EMPTY | ローカル0件 | 実体なし（**状態の不在**=dtb_plugin 0件。共有DBでは保証不能＝**隔離DB/フレッシュDB必須**。C-028の実行前提・§9-6） | — |

- 突合ケース（C-015/C-016/C-018/C-019/C-020/C-028/C-029）は db.ts で dtb_plugin の source/version を事前照会し、スタブ応答の
  id/version との組合せ（=期待update_status）をL1-009の式で独立評価してから、画面CTA表示と突合する
  （fixture値は期待の正でなく入力再現手段）。
- 本機能はdtb_plugin/dtb_base_info以外のテーブルを参照しない（md:230-242）＝帯IDが他機能集計へ与える影響は
  プラグイン一覧系のみ。**フレッシュDB/serial前提・共有環境では実行しない**（`e2e-standard-run-requirements`
  準拠。dtb_pluginへの行追加はプラグイン管理画面の表示に露出する）。

## §3 表示/状態別CTA/API失敗マトリクス（本機能は利用者入力なし＝入力制約マトリクスは非該当）

### 3a. インストール状態×CTA（三値比較: 設計md:151-160 ⇔ ee ApiSvc:137-164＋modal:52-67 ⇔ 観測=スタブ+db.ts）

| 入力状態（API×ローカル） | update_status | モーダル主導線 | 遷移/挙動 | L1 |
|---|---|---|---|---|
| source一致なし・purchase_required=false | 1 | 「入手する」 | install_confirm（/store/plugin/api/install/{id}/confirm）へ遷移 | L1-009,013,018 |
| source一致・version同値以上 | 2 | 「インストール済み」 | href="#"＝遷移なし（状態表示） | L1-009,013 |
| source一致・ローカルversion<APIversion | 3 | 「アップデート」 | install_confirmへ遷移 | L1-009,013,018 |
| purchased=false かつ purchase_required=true（**source一致でも後段上書き**） | 4 | 「購入する」 | 外部ストアへPOST（product_id+mode=link_site+public_key・別ウィンドウ） | L1-009,013,017 |
| 同一sourceのローカル行が複数（相反version） | 一致に基づく2/3のいずれか（**最終状態は最後に評価された一致行に依存・走査順は仕様非固定**=L1-009改訂1） | 「インストール済み」または「アップデート」（1/4にはならない） | 単独行フェーズ対照＋観測記録（C-020） | L1-009 |
| ローカル0件 | 全件1（④該当時のみ4） | 「入手する」（/「購入する」） | — | L1-009 |

### 3b. 対応バージョン×警告

| supported_versions | version_check | モーダル内警告 | 一覧行 | L1 |
|---|---|---|---|---|
| 4.3.0を含む | true | 警告なし | 表示 | L1-010,014 |
| 4.3.0を含まない | false | alert-danger「このプラグインはEC-CUBE 4.3.0をサポートしていないため、正常に動作しない可能性があります。」 | 表示（行は消えない） | L1-010,014 |

### 3c. API結果×カード表示（失敗時マトリクス）

| API結果 | recommendedPlugins | 行表示 | エラー文言 | 見出し/footerリンク | L1 |
|---|---|---|---|---|---|
| 成功・n件 | n件配列 | n行（縦・画像/名称/短説明） | なし | 表示 | L1-003,004 |
| 成功・空配列 | [] | 0行（空表示文言なし） | なし | 表示 | L1-008 |
| HTTP 200以外 | []（例外→catch） | 0行 | **なし**（専用文言なし） | 表示 | L1-006,007 |
| 通信失敗/false | []（例外→catch） | 0行 | なし | 表示 | L1-006,007 |
| タイムアウト（5000ms超） | []（例外→catch） | 0行 | なし | 表示 | L1-006,007 |

### 3d. モーダル内リンク/ボタンの有無

| 条件 | 表示 | L1 |
|---|---|---|
| contact_url非空 | 「資料請求・お問い合わせ」target=_blank（※直後にリテラル`{ }}`が出力される=**ソース確定**のBC-DRAFT-1） | L1-015 |
| contact_url空 | ボタン非表示 | L1-015 |
| manual_url非空 | 「マニュアルダウンロード」target=_blank | L1-015 |
| manual_url空 | ボタン非表示 | L1-015 |
| price falsy（無料） | ダウンロード数行を表示 | L1-011 |
| 画像空 | 一覧=取得値そのまま（空src）／モーダル=noimage代替 | L1-024 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全32行を実体掲載**〔bound対応27=ja26+EN1／補完5〕）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（page実装済み・twig由来・2026-07-06実走4〇で
カード枠系は実機実績）: カード `#ec-cube-plugin`（twig:274）・見出し `.card-title`（:277）・本文
`.card-body`（:280）・行モーダルリンク `a[data-bs-toggle="modal"][data-bs-target^="#searchPluginModal-"]`
（:284,289）・footerリンク `.card-footer a`（:299）・モーダル `#searchPluginModal-{id}`（modal:1）・
閉じる `.btn-close`（modal:6）・CTA `modal-footer` 内（modal:52-67）。
**スタブ必須ケース（C-006・C-010以降=25行）はサーバ側スタブAPI未整備のため実行保留**（§9-3。C-006は遷移先
レンダが隣接エンドポイント /category・/plugins に依存するため保留へ会計〔href同定サブ手順のみ今すぐ可〕・
C-014/C-016のクリック到達は /plugin/{id} スタブ前提=改訂1。ケースは実行可能グレードの手順・判定まで確定済み
＝基盤整備後に即実行可）。**今すぐ実行可=C-001〜C-005・C-007の6行**（-ENはD15）。外部向けナビゲーション（購入POST・外部URL）は
**ブラウザ側routeで外部行きをabortし、リクエスト内容/popupの発生のみ観測**（外部サイトへ実到達しない）。

### §4.1 bound対応候補行（27行=ja26＋-EN1。§8の68対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-001	IT-15	未認証	P1	未認証でホームへアクセスすると管理ログインへ誘導されおすすめプラグインカードを利用できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認 3. #ec-cube-plugin の不在を確認	admin_login のログイン画面へ誘導され、おすすめプラグインカード（#ec-cube-plugin）を含むホーム画面は表示されない（利用不可） [L1:L1-M0206-001]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-002	IT-25	表示	P1	ログイン後ホームにおすすめプラグインカード枠が表示される（ja・API結果に依らない枠の観測）	管理者ログイン済（SEED-M02-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/ 2. #ec-cube-plugin 内の .card-title 文言と .card-footer のオーナーズストアリンクを確認 3. カード内にエラー/フォールバック文言が無いことを確認（行の有無は外部API結果依存のため本ケースでは判定しない）	ホームに #ec-cube-plugin カードが表示され、見出し「おすすめのプラグイン」とカード下部の「オーナーズストア」リンクが表示され、カード内にエラー文言が無い（枠はAPI成功/失敗どちらでも表示=失敗時も画面継続） [L1:L1-M0206-003,L1-M0206-002,L1-M0206-007; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-002-EN	IT-25	表示	P3	おすすめプラグインカード文言（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. カード見出しとfooterリンク文言を読む	見出し="Recommended Plug-ins"・footerリンク="Owners' Store" [L1:L1-M0206-003; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-003	IT-12	レイアウト	P2	カード本文は最大高さを持ち縦スクロールする	管理者ログイン済	—	1. ホームを開く（待機はDOM到達+#ec-cube-plugin可視で判定。waitUntil loadは外部リソース待ちで不安定=既存×の是正） 2. #ec-cube-plugin .card-body の computed style（max-height/overflow-y）を確認	カード本文（.card-body）が max-height: 395px・overflow-y: scroll の縦スクロール領域である（内容が領域を超える場合は縦スクロールで閲覧できる） [L1:L1-M0206-003]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-004	IT-12	JS挙動	P2	本ブロック固有のJavaScriptファイルを持たない	管理者ログイン済	—	1. ネットワーク監視下でホームを開く 2. #ec-cube-plugin 内（出力済みモーダル含む）の script 要素数と on* インライン属性数を数える 3. 表示完了後、本ブロック起因のXHR/fetch（おすすめ再取得等）が発生しないことを確認（プラグイン画像等のリソース読込・他ブロックのsale_chartは除外して評価）	#ec-cube-plugin とその配下モーダルに script 要素・インラインイベントハンドラが存在せず（0件・モーダル開閉は data-bs-* のBootstrap共通挙動のみ）、おすすめ一覧の非同期再取得・自動更新のリクエストも発生しない [L1:L1-M0206-020]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-005	IT-25	フォーム送信	P1	本ブロックは登録・更新のためのアプリ宛フォームPOSTを持たない	管理者ログイン済	—	1. ホームを開く 2. #ec-cube-plugin 配下（モーダル含む）の form 要素を全列挙し action を読む 3. 可編集入力要素（input[type=text]/textarea/select等）の数を数える	アプリオリジン宛の form が0件（存在するformは外部ストア（eccube_owners_store_url配下）宛の購入フォームのみ・target=_blank・hidden+submitのみ）で、利用者が入力する可編集フィールドが0件 [L1:L1-M0206-021]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-006	IT-15	画面遷移	P1	カード下部「オーナーズストア」押下で管理画面内のオーナーズストア検索へ遷移する	管理者ログイン済／dtb_base_info.authentication_key 設定済み（SEED-M0206-AUTHKEY。未設定時は遷移先が認証キー設定へリダイレクト=遷移先機能挙動）／**遷移先レンダの安定観測は隣接スタブ RESP-CATEGORY/RESP-PLUGINS 前提（未整備=実行保留。手順2のhref同定サブ観測のみ今すぐ実行可）**	—	1. ホームを開く 2. footerリンクの href が route admin_store_plugin_owners_search_page（/%eccube_admin_route%/store/plugin/api/search/page 配下）であることを確認（**レンダ非依存=今すぐ実行可のサブ観測**） 3. 押下し遷移先URL到達とオーナーズストア検索画面（plugin_search）の表示を確認（遷移先は getCategory=GET /category・getPlugins=GET /plugins を呼ぶ=隣接スタブ要。画面の中身の正は遷移先機能設計=委譲）	管理画面内のオーナーズストア検索へ遷移する（リンク実体=admin_store_plugin_owners_search_page。設計書例示URL /store/plugin は実装と不一致=DOC-DRAFT-m02-06-1・裁定は実装routeを正） [L1:L1-M0206-016; fixture:SEED-M0206-AUTHKEY@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-007	IT-26	無書込	P1	ホーム表示とモーダル操作は dtb_plugin/dtb_base_info へ登録/更新を行わない	管理者ログイン済／標準環境	—	1. db.tsでT0=§6.3の決定的差分照会（dtb_plugin/dtb_base_info の行数＋主キー順全列ダイジェスト）を記録 2. ホーム表示→（行があれば）モーダル開閉→footerリンクのhref読取（**押下=遷移はしない**。遷移先レンダは追加外部API依存のため本ケースから除外=改訂1縮退。遷移先画面での無書込は遷移先機能スコープ） 3. db.tsでT1を再照会	T0=T1（両テーブルの行数・全列ダイジェスト完全一致=登録/更新/削除なし）。本機能の副作用は外部API通信と通信ログのみでDB書込ではない [L1:L1-M0206-019]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-010	IT-12	行表示	P1	おすすめ行に画像・名称・短い説明が縦に表示され行数がスタブ応答件数と一致する	管理者ログイン済／**サーバ側スタブAPI=RESP-FULL（未整備=実行保留）**	SEED-M0206-STUB RESP-FULL（既知6件）	1. スタブへ切替（env ECCUBE_PACKAGE_API_URL）しホームを開く 2. #ec-cube-plugin .card-body の行数を数える 3. 各行の img src/alt・名称リンク文言・短説明テキストをfixture投入値と突合	行数=応答配列件数（6行）で、各行に応答の image・name・short_description が縦に並んで表示される（表示値の正はL1-003の「取得値をそのまま表示・補正しない」契約であり、fixture値は入力再現手段。並び順も応答順のまま） [L1:L1-M0206-003,L1-M0206-004; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-011	IT-25	モーダル開	P1	プラグイン画像または名称押下で同一画面上に詳細モーダルが開く（Bootstrapモーダル属性）	管理者ログイン済／スタブ=RESP-FULL（実行保留）	—	1. ホームを開く 2. 行の画像リンク・名称リンクの data-bs-toggle="modal"/data-bs-target="#searchPluginModal-{id}" を確認 3. 押下し #searchPluginModal-{id} の表示とURL不変（画面遷移なし）を確認	画像/名称リンクはBootstrapのモーダル属性を持ち、押下で同一画面上に対象プラグインの詳細モーダル（#searchPluginModal-{id}）が開く。ページ遷移・サーバ通信は発生しない [L1:L1-M0206-003,L1-M0206-011; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-012	IT-12	モーダル内容	P1	詳細モーダルに設計の全表示項目が表示される	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P1（無料・全項目充足）	1. P1のモーダルを開く 2. 画像・名称・短説明・販売価格・ダウンロード数（無料時）・プラグインバージョン・EC-CUBE対応バージョン・公開日・最終更新日・ライセンス・制作者・問い合わせ/マニュアルボタン・長い説明の各表示をfixture投入値と突合	モーダルに 画像・名称・短い説明・税込価格・ダウンロード数（price falsy時のみ）・バージョン・対応EC-CUBEバージョン・公開日・最終更新日・ライセンス・制作者・問い合わせURL/マニュアルURLボタン・長い説明 が表示される（ラベルja=「ダウンロード数」「プラグインバージョン」「EC-CUBE対応バージョン」「公開日」「最終更新日」「ライセンス」「制作者」・見出し「商品詳細」） [L1:L1-M0206-011; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-013	IT-16	価格表示	P2	モーダルの価格は税込表記で表示される	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P4（priceあり）	1. P4のモーダルを開く 2. 価格行のラベル・通貨書式・（税込）注記を確認	「販売価格」ラベル＋priceフィルタの通貨書式（既定ja/JPY=¥+3桁区切り）＋「(税込)」注記で表示される（税込表記） [L1:L1-M0206-012; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-014	IT-25	CTA状態1	P1	未インストール（状態1）の主導線「入手する」がインストール確認へ遷移する	管理者ログイン済／スタブ=RESP-FULL＋**RESP-PLUGIN-DETAIL（クリック到達の安定観測前提=改訂1。遷移先doConfirmがGET /plugin/{id}を呼び、失敗時は認証キー設定へリダイレクトされ当該URLに留まらない）**（実行保留）／dtb_pluginにP1のsource一致行なし	P1	1. P1のモーダルを開く 2. 主導線の文言とhref（=admin_store_plugin_install_confirmのURL）を確認 3. RESP-PLUGIN-DETAIL定義済みスタブ下で押下し遷移先URL到達を確認	主導線=「入手する」（a href=admin_store_plugin_install_confirm）で、押下により /%eccube_admin_route%/store/plugin/api/install/{P1.id}/confirm（インストール確認）へ遷移する（遷移後画面の中身は遷移先機能スコープ） [L1:L1-M0206-009,L1-M0206-013,L1-M0206-018; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-015	IT-25	CTA状態2	P1	インストール済み（状態2）は状態表示でインストール確認・購入に進めない	管理者ログイン済／スタブ=RESP-FULL＋SEED-M0206-PLUGIN-LOCAL（L2: source=P2.id・version同値）（実行保留）	P2×L2	1. db.tsでL2のsource/versionを照会しL1-009式で期待状態=2を独立評価 2. P2のモーダルを開く 3. 主導線の文言・href・押下後の画面を確認	主導線=「インストール済み」（href="#"の状態表示）で、押下してもインストール確認・購入へ遷移しない（購入フォームsubmitも出力されない） [L1:L1-M0206-009,L1-M0206-013; fixture:SEED-M0206-PLUGIN-LOCAL@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-016	IT-25	CTA状態3	P1	アップデートあり（状態3）の主導線「アップデート」がインストール確認へ遷移する	管理者ログイン済／スタブ=RESP-FULL＋**RESP-PLUGIN-DETAIL（クリック到達前提=改訂1・C-014と同）**＋SEED-M0206-PLUGIN-LOCAL（L3: source=P3.id・version<API。**DUPは適用しない**=P3期待を決定的に保つ）（実行保留）	P3×L3	1. db.tsでL3のversionとP3応答versionを照会しversion_compare<でL1-009式=3を独立評価 2. P3のモーダルを開く 3. 主導線文言とhref（=admin_store_plugin_install_confirmのURL）を確認 4. RESP-PLUGIN-DETAIL定義済みスタブ下で押下し遷移先URL到達を確認	主導線=「アップデート」（a href=admin_store_plugin_install_confirm）で、押下により対象プラグインのインストール確認へ遷移する（遷移後画面の中身は遷移先機能スコープ） [L1:L1-M0206-009,L1-M0206-013,L1-M0206-018; fixture:SEED-M0206-PLUGIN-LOCAL@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-017	IT-25	CTA状態4	P1	未購入の有料（状態4）の「購入する」が外部ストア購入フォームを別ウィンドウで送信する	管理者ログイン済／スタブ=RESP-FULL（実行保留）／SEED-M0206-AUTHKEY	P4（purchased=false・purchase_required=true）	1. P4のモーダルを開く 2. フォームの action（{eccube_owners_store_url}/gateway/purchase/?product_id={P4.id}）・method=post・target=_blank・hidden mode=link_site/public_key の存在を確認 3. 外部行きリクエストをブラウザ側routeでabortする設定下で「購入する」を押下し、popup発生とPOSTリクエスト（product_id・mode。public_key原値は記録しない）を観測	主導線=「購入する」（submit）で、押下により外部ストアの購入導線（プラグインIDと公開鍵を送信するフォーム）が別ウィンドウで送信される（観測はpopup+リクエスト発生まで。外部サイトへは実到達させない。公開鍵の具体値は成果物へ記録しない） [L1:L1-M0206-009,L1-M0206-013,L1-M0206-017; fixture:SEED-M0206-AUTHKEY@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-018	IT-23	突合一致	P2	ローカル取得元IDが外部APIのプラグインIDと一致するレコードは突合結果（インストール済み/アップデート）として表示に反映される	管理者ログイン済／スタブ=RESP-FULL＋SEED-M0206-PLUGIN-LOCAL（実行保留）	P2×L2・P3×L3	1. db.tsで dtb_plugin の source/version を照会 2. L1-009式（==一致・version_compare）で各おすすめの期待update_statusを独立評価 3. P2/P3のモーダル主導線がそれぞれ「インストール済み」「アップデート」であることを突合	source一致の該当レコード（L2/L3）が突合の取得結果として消費され、表示状態に反映される（P2=インストール済み・P3=アップデート。期待の正はL1-009の判定式でありSEED値ではない） [L1:L1-M0206-009; fixture:SEED-M0206-PLUGIN-LOCAL@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-019	IT-23	突合不一致	P2	ローカル取得元IDが一致しないおすすめプラグインは未インストール扱いのまま表示される	管理者ログイン済／スタブ=RESP-FULL＋SEED-M0206-PLUGIN-LOCAL（実行保留）	P1（一致なし）	1. db.tsで dtb_plugin に P1.id と一致する source が無いことを確認 2. P1のモーダル主導線を確認	一致しないレコードは突合結果に含まれず、P1は初期状態（未インストール・未購入扱い=「入手する」）のまま表示される [L1:L1-M0206-009; fixture:SEED-M0206-PLUGIN-LOCAL@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-029	IT-23	後段上書き	P2	未購入の有料プラグインはローカル取得元ID一致でも主導線が「購入する」に後段上書きされる（順序非依存・決定的）	管理者ログイン済／スタブ=RESP-FULL＋SEED-M0206-PLUGIN-LOCAL（L4: source=P4.id=**一致行あり**）（実行保留）	P4（purchased=false・purchase_required=true）×L4	1. db.tsでL4のsourceがP4.idと一致することを確認（②③なら「インストール済み/アップデート」になる前提状態） 2. P4のモーダル主導線を確認	source一致（②③該当）にもかかわらず、購入要否判定（purchased=false かつ purchase_required=true）が一致走査の**後段**で評価されるため主導線は「購入する」へ上書きされる（④はループ後の単一if=走査順に依存しない決定的観測。C-020の順序依存観測とは分離=改訂1） [L1:L1-M0206-009,L1-M0206-013; fixture:SEED-M0206-PLUGIN-LOCAL@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-021	IT-22	バージョン警告	P2	現在バージョン非対応のプラグインのモーダルに警告が表示される	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P5（supported_versionsに4.3.0非含） 	1. P5のモーダルを開く 2. .alert-danger の警告文言を確認 3. 一覧行にP5が表示されている（行は消えない）ことを確認	モーダル内に警告「このプラグインはEC-CUBE 4.3.0をサポートしていないため、正常に動作しない可能性があります。」（alert-danger）が表示され、一覧行は表示され続ける（現在のEC-CUBEバージョンが対応バージョン一覧に含まれるかで判定=in_array） [L1:L1-M0206-010,L1-M0206-014; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-022	IT-22	バージョン対応	P2	現在バージョン対応のプラグインのモーダルに警告が表示されない	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P1（supported_versionsに4.3.0含む）	1. P1のモーダルを開く 2. .alert-danger（対応バージョン警告）の不在を確認	モーダル内に対応バージョン非対応の警告が表示されない（version_check=true側=判定順序#5） [L1:L1-M0206-010,L1-M0206-014; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-023	IT-25	外部リンク	P2	問い合わせ/マニュアルURLがあるプラグインのボタン押下で外部URLを別ウィンドウで開く	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P1（contact_url/manual_urlあり）	1. P1のモーダルを開く 2. 「資料請求・お問い合わせ」「マニュアルダウンロード」ボタンの href=fixture投入URL・target=_blank を確認 3. 外部行きをabortする設定下で押下しpopup発生を観測 4. 【BC-DRAFT-m02-06-1】contactボタン直後のテキストノードを読む	両ボタンが表示され（href=対応する外部URL・target=_blank）、押下で外部URLを別ウィンドウで開く（観測はpopup発生まで・外部へ実到達しない）。設計期待ではボタン以外の余計な表示はない（**現実装はcontactボタン直後にリテラル「{ }}」が出力される=modal:26のTwig字句規則からソース確定のBC-DRAFT-m02-06-1。本手順4は再現確認〔見え方の記録〕であり確定判定ではない・期待は設計側のまま**） [L1:L1-M0206-015; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-024	IT-12	空応答	P1	外部APIが空配列を返すとプラグイン行を表示せずオーナーズストアリンクのみ表示する	管理者ログイン済／スタブ=RESP-EMPTY（実行保留）	[]	1. スタブをRESP-EMPTYへ切替しホームを開く 2. #ec-cube-plugin .card-body 内の行数=0・空表示文言の不在を確認 3. 見出しとfooterリンクの表示を確認	おすすめプラグイン行は表示されず（本文内に空表示用の文言も出さない）、カード見出しとカード下部のオーナーズストアリンクは表示される [L1:L1-M0206-008; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-025	IT-12	通信失敗	P1	外部API通信失敗（タイムアウト含む）でもホーム表示を継続しプラグイン行を表示しない	管理者ログイン済／スタブ=RESP-TIMEOUT（5000ms超遅延）または接続不能（実行保留）	—	1. スタブを失敗状態へ切替しホームを開く 2. ホーム画面（他カード含む）が表示されることを確認 3. #ec-cube-plugin の行0件・カード内にエラー文言が無いことを確認	ホーム画面の表示は継続し（HTTP200のダッシュボード）、おすすめプラグイン行は表示されず、本カード内に取得失敗の専用エラー文言も表示されない（PluginApiException握りつぶし→空配列） [L1:L1-M0206-006,L1-M0206-007; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-026	IT-12	HTTP非200	P1	HTTPステータス200以外・実行結果falseはプラグインAPI例外として扱われ空配列表示にフォールバックする	管理者ログイン済／スタブ=RESP-500／RESP-FALSE（実行保留）	HTTP500・切断	1. スタブをRESP-500へ切替しホームを開き、行0件・エラー文言なし・画面継続を確認 2. RESP-FALSE（切断）でも同様に確認	通信失敗・HTTP 200以外・実行結果falseはいずれもプラグインAPI例外として扱われ（requestApi: http_code!==200または結果falseでthrow）、ホーム画面では例外を捕捉し空配列表示（行なし・エラー文言なし・表示継続）にフォールバックする [L1:L1-M0206-006,L1-M0206-007; fixture:SEED-M0206-STUB@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-027	IT-25	送信ヘッダ	P1	外部API通信でプラグイン認証キー・サイトURL・EC-CUBEバージョンをヘッダ送信する（スタブ受信観測）	管理者ログイン済／スタブ=RESP-FULL＋受信記録（実行保留）／SEED-M0206-AUTHKEY	—	1. スタブの受信記録をクリアしホームを開く 2. スタブ受信の GET /plugins/recommended リクエストのヘッダ X-ECCUBE-KEY/X-ECCUBE-URL/X-ECCUBE-VERSION を読む 3. KEY=db.tsで照会した dtb_base_info.authentication_key とメモリ内比較（原値は成果物へ書かない）・URL=対象環境のscheme+host・VERSION="4.3.0" を突合	外部APIへ X-ECCUBE-KEY（認証キー・原値非記録）・X-ECCUBE-URL（現在のサイトURL）・X-ECCUBE-VERSION（4.3.0）の3ヘッダが送信される（クエリ条件は付与しない） [L1:L1-M0206-005,L1-M0206-004; fixture:SEED-M0206-AUTHKEY@TBD-D5]				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-028	IT-22	ローカル0件	P2	ローカルプラグイン0件でも突合はエラーなく継続し全おすすめが未インストール扱い（購入要否除く）になる	管理者ログイン済／スタブ=RESP-FULL（実行保留）／SEED-M0206-PLUGIN-EMPTY（dtb_plugin 0件）＝**隔離DB/フレッシュDB必須**	dtb_plugin 0行	1. db.tsで dtb_plugin が0件であることを事前確認（0件でなければskip） 2. ホームを開き行が表示されること・エラーが無いことを確認 3. P1〜P3/P5/P6のモーダル主導線が「入手する」・P4が「購入する」であることを確認	DB照会（全件取得）が0件でもエラーなく処理を継続し、すべてのおすすめプラグインは購入要否判定を除き未インストール・未購入扱い（主導線「入手する」・購入要否一致のみ「購入する」）から判定される [L1:L1-M0206-009; fixture:SEED-M0206-PLUGIN-EMPTY@TBD-D5]				
```

### §4.2 補完行（5行=ja5。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合68行の期待テキストに対応する親が存在しない〕。C-020は改訂1でここへ移動=重複sourceの親候補-030は極性不整合ノイズで-031はC-029の有料後段上書きが正対応のため、重複観測は親なし補完〔md:184〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-020	IT-23	重複source	P3	同一取得元IDの重複ローカル行（相反version）でも一致に基づく状態（インストール済み/アップデート）で表示され、最終状態は最後に評価された一致行に依存する（順序は仕様非固定=観測記録）	管理者ログイン済／スタブ=RESP-FULL＋SEED-M0206-PLUGIN-LOCAL（L3=version<API）＋**SEED-M0206-PLUGIN-DUP（L3b=同source・version>=API・id昇順後入れ・行更新なしのSEED契約）**（実行保留）	P3×{L3,L3b}（相反version）	1. 【フェーズA・単独=決定的】L3のみでP3のモーダル主導線=「アップデート」を確認（db.tsでversion_compare<を独立評価） 2. 【フェーズB・重複】SEED-M0206-PLUGIN-DUPをapplyし（L3→L3bのid昇順・行更新なし=物理走査順の再現条件）、P3の主導線を観測: 「インストール済み」または「アップデート」のいずれか（=一致に基づく2/3）であり「入手する」(1)/「購入する」(4)でないことを判定。どちらの一致行に基づいたかを記録し、一致行ごとに2再セット→版比較の実装（ApiSvc:146-152）=最後に評価された一致行依存と突合（走査順はfindAll・ORDER BY無し=DB依存につき順序自体は合否にしない） 3. 【フェーズC・単独対照=決定的】L3を削除しL3bのみでP3の主導線=「インストール済み」を確認（相反versionの対照） 4. teardown（DUP行・L3復元）	重複登録があっても一致に基づく状態（2または3）で表示され（重複の正規化・一意制約は本機能対象外）、最終状態は最後に評価された一致行の版比較に依存する（勝者は仕様として固定されない=L1-009改訂1。合否判定はフェーズA/Cの決定的期待＋フェーズBの「1/4でない」まで・フェーズBの2/3どちらかは観測記録） [L1:L1-M0206-009; fixture:SEED-M0206-PLUGIN-DUP@TBD-D5]（補完行・親test_idなし・設計書補完=md:184。-030は極性不整合ノイズ・-031はC-029が正対応）				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-040	IT-25	モーダル閉	P3	閉じるボタン・「一覧に戻る」でモーダルが閉じホームへ戻る（サーバ通信なし）	管理者ログイン済／スタブ=RESP-FULL（実行保留）	—	1. モーダルを開く 2. ネットワーク監視下で .btn-close を押下しモーダルが閉じること・リクエスト0件を確認 3. 再度開き「一覧に戻る」で同様に確認	閉じるボタンまたは「一覧に戻る」（data-bs-dismiss）でモーダルが閉じてホーム画面へ戻り、閉じる操作でサーバ通信は発生しない [L1:L1-M0206-023; fixture:SEED-M0206-STUB@TBD-D5]（補完行・親test_idなし・設計書補完=md:89,125）				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-041	IT-25	リンク非表示	P3	問い合わせURL・マニュアルURLが空の項目のボタンは表示されない	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P6（contact_url/manual_url空）	1. P6のモーダルを開く 2. 「資料請求・お問い合わせ」「マニュアルダウンロード」ボタンの不在を確認（P1側の存在=C-023と対）	URLが空の項目の外部リンクボタンは出力されない（if分岐・C-023の対） [L1:L1-M0206-015; fixture:SEED-M0206-STUB@TBD-D5]（補完行・親test_idなし・設計書補完=md:77,187）				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-042	IT-12	画像空	P3	プラグイン画像が空の場合、一覧はAPI取得値のまま・モーダルは代替画像を表示する	管理者ログイン済／スタブ=RESP-FULL（実行保留）	P6（image空）	1. P6の一覧行 img src を読む（取得値そのまま=空） 2. P6のモーダルを開き img src が noimage_plugin_list.png（save_image asset）であることを確認	一覧の画像はAPI取得値をそのまま参照し（default無し）、詳細モーダルでは代替画像（noimage_plugin_list.png）を表示する [L1:L1-M0206-024; fixture:SEED-M0206-STUB@TBD-D5]（補完行・親test_idなし・設計書補完=md:188）				
m02-06_admin_home_home_recommend_plugins	E2E-M0206C-043	IT-12	参照時点	P3	表示中は自動更新されず、ホーム再表示で外部APIへ再取得したその時点の内容を表示する	管理者ログイン済／スタブ=RESP-FULL（応答切替可能な受信記録付きスタブ）（実行保留）	応答切替（6件→別内容）	1. ホームを開き行内容とスタブ受信回数T0を記録・ネットワーク監視開始 2. スタブ応答を別内容へ切替え、無操作で待機: 表示が不変・追加取得リクエストが発生しないことを確認 3. ホームを再表示し、スタブ受信回数がT0+1になり表示が切替後応答の内容になることを確認	表示中のカード内容は自動更新されず（手動更新ボタンもない）、ホーム再表示時に外部APIへの取得処理が再実行され、その時点の応答とローカル突合に基づく内容が表示される [L1:L1-M0206-022; fixture:SEED-M0206-STUB@TBD-D5]（補完行・親test_idなし・設計書補完=md:196,211）				
```

## §5 locale対応表

- **LS=1 claim（6件）**: L1-M0206-003（カード見出し・footerリンク）／L1-M0206-011（モーダル見出し・詳細info
  ラベル）／L1-M0206-012（販売価格・税込）／L1-M0206-013（CTA4種＋一覧に戻る）／L1-M0206-014（非対応警告文）／
  L1-M0206-015（資料請求・マニュアル）。ja/en両文言は§1に一次資料逐語で確定済み（en=messages.en.yaml逐語・
  ja翻訳ゼロ）。
- **-EN行は1行**（C-002-EN=カード枠。実行前提D15）。**モーダル/CTA/警告系（L1-011〜015）のEN観測行は本候補
  では追加しない**: 当該観測はスタブAPI（未整備）とD15（enロケール切替口）の**二重の実行前提**を持ち、現時点で
  行を積んでも全行実行保留になるだけのため、対応jaケース（C-012〜C-023）の実行保留に同梱し、スタブ整備＋D15
  成立後にen再走で同一L1のen文言（§1確定済み）を判定に使う方針を明記する（文言確定は本書で完了・実行のみ保留。
  偽オラクル防止のため判定文言は必ずL1解決器経由）。
- **LS=0（理由コード付き）**:
  - `non-translated`: L1-001/007/008/009/010/016/017/018/020/021/023/024（URL・分岐条件・要素有無・定数）。
  - `non-ui-observable`: L1-002/004/005/006/019（HTTP/外部通信/DB静的事実）。
  - `data-passthrough`: L1-022（表示値は取得値の反映）。
- 日付表示（publish_date/update_date=date_dayフィルタ=Intl 'medium'書式）はロケール依存の**書式**だが、値は
  API取得値のパススルー＝L1-011内でラベルのみLS対象・値書式はIntlExtension.php:29,42-49の実装を正とする
  （固定文字列をオラクル化しない）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 観測契約

- **アプリ宛はGETのみ**: `GET /%eccube_admin_route%/`（admin_homepage）・`GET /store/plugin/api/search/page`
  系（footer遷移）・`GET /store/plugin/api/install/{id}/confirm`（CTA遷移）。アプリ宛POST/CSRF request契約は
  **非該当**（本機能にアプリ宛フォームPOSTなし=L1-021。母集合-001の観点ラベル「CSRF」は期待テキストが用語定義
  ＝ノイズ処理済み・§8）。
- **外部宛の観測規律**: 購入フォームPOST（外部ストア宛）・contact/manual外部リンクは、**ブラウザ側routeで
  外部オリジン行きをabort**し、popup発生とリクエスト内容（product_id・mode）のみ観測する（外部サイトへ実到達
  しない。public_key/X-ECCUBE-KEYの**原値は成果物・ログへ記録しない**=md:308-315）。
- **外部APIの観測規律**: サーバ→外部API通信はブラウザから不可視＝**サーバ側スタブAPI（受信記録付き）**が
  観測面（C-027）。スタブ未整備の間、該当ケースは実行保留（§9-3）。
- **セレクタ**（既存page再利用・twig由来）: §4冒頭に列挙。行とモーダルの対応付けは
  `data-bs-target="#searchPluginModal-{id}"` のid実体で行い、表示文言→行の復元を判定キーにしない
  （m02-01先例の識別子契約。文言はL1-003/011の検証対象として独立に突合）。
- **待機契約（既存×の是正）**: ホーム表示の完了判定は `#ec-cube-plugin` 可視＋DOMContentLoadedで行い、
  `waitUntil: load` を使わない（外部プラグインAPI/外部画像リソース待ちで30秒タイムアウトした2026-07-06実測
  E2E-M02-06-005×への対処）。

### §6.2 スタブAPI切替（SEED-M0206-STUB・未整備=要実機基盤）

1. テスト環境の `ECCUBE_PACKAGE_API_URL` をスタブAPIへ向ける（env切替→キャッシュ反映はD5で手順確定）。
2. スタブは §2a の応答セット（RESP-FULL/EMPTY/500/FALSE/TIMEOUT）＋**隣接エンドポイント**（RESP-CATEGORY=
   `/category`・RESP-PLUGINS=`/plugins`・RESP-PLUGIN-DETAIL=`/plugin/{id}`。改訂1=遷移先レンダ/クリック到達の
   観測基盤）を応答IDで切替可能とし、受信リクエスト（パス・ヘッダ）を記録する。X-ECCUBE-KEY原値はレポート
   出力しない（ハッシュ照合または即時比較）。
3. 応答fixtureのJSONは §2a の消費フィールド全充足・既知値（マーカー文字列 `E2E-M0206-P1` 等）で作る
   （fixture値は入力再現手段・期待の正はL1）。
4. teardown: env復元・受信記録破棄。dtb_plugin帯行はマーカーDELETE。

### §6.3 db.ts照会（三段参照の独立評価。C-007/015/016/018/019/020/027/028で使用）

a. 無書込ブラケット（C-007。決定的差分照会=自己完結・m02-02/m02-04 §6.3cと同方式）:

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_plugin;
SELECT COUNT(*) FROM dtb_base_info;
-- (2) 全列ダイジェスト（主キー順・全列。相殺更新・過去行更新も検知）
SELECT md5(COALESCE(string_agg(t::text, ',' ORDER BY t.id), '')) FROM dtb_plugin t;
SELECT md5(COALESCE(string_agg(t::text, ',' ORDER BY t.id), '')) FROM dtb_base_info t;
```

b. 突合の独立評価（C-015/016/018/019/020/028。期待の正はL1-009の判定式。SQLは式の実体掲載=自己完結）:

```sql
-- おすすめ（API応答の :api_id, :api_version）ごとの期待update_statusの材料
SELECT p.id, p.source, p.version FROM dtb_plugin p WHERE p.source = :api_id;
-- 判定はspec側で L1-009 の式（== 一致・version_compare(local, api, '<')・purchased/purchase_required後段）を
-- そのまま評価する（数値/文言リテラル直書き禁止・o('L1-M0206-009')等のL1解決値で供給）
```

c. ヘッダ突合（C-027）: `SELECT authentication_key FROM dtb_base_info;`（単一行）→ スタブ受信値と
   メモリ内比較・原値を成果物へ書かない。

### §6.4 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m02/m02_06_admin_home_home_recommend_plugins.page.ts` を再利用（カード枠・
  モーダル起動リンク実装済み）。モーダル内部（CTA・警告・infoリスト）のlocatorは追加実装（modal:52-67由来）。
- spec: 既存 `e2e/spec/admin/m02/m02_06_*.spec.ts` は旧ケース表（E2E-M02-06-xxx）1:1の実装であり本候補の実装
  ではない（ログインヘルパ・fixme構造の参考のみ）。本候補の期待値は `o("L1-M0206-xxx", "m02_06_oracle")` 相当の
  L1解決器経由・リテラル直書き禁止（三段参照ゲートD9）。
- 外部行きabort: `context.route('**/*', …)` で対象環境オリジン以外へのナビゲーション/リクエストをabortし、
  `page.waitForEvent('popup')` とリクエスト捕捉で観測（C-017/C-023）。
- スタブ必須ケースは基盤（スタブAPI＋env切替）成立まで `test.fixme` ではなく**未実装のまま**とする
  （本候補は文書グレード。実装着手はD5以降）。

### §6.5 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に本草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m02-06_admin_home_home_recommend_plugins_oracle_draft.json`）の
   出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002(-EN),003,004,005 | Playwright | GUI/HTTP | 枠・静的事実。**スタブ不要=今すぐ実行可**（-ENのみD15） |
| C-007 | Playwright+db.ts（決定的差分） | GUI+DB | §6.3a。**スタブ不要=今すぐ実行可**（改訂1縮退: footer遷移を手順から除去） |
| C-006 | Playwright＋**隣接スタブ RESP-CATEGORY/RESP-PLUGINS（未整備=実行保留）** | GUI | 改訂1: 遷移先レンダが getCategory/getPlugins に依存。**手順2のhref同定サブ観測のみ今すぐ可**（2026-07-06〇は実API到達環境の実績） |
| C-010,011,012,013,021,022,024 | Playwright＋**サーバ側スタブAPI（未整備=実行保留）** | GUI | 応答状態の再現が前提 |
| C-014,016 | Playwright＋スタブ（RESP-FULL＋**RESP-PLUGIN-DETAIL**）（実行保留） | GUI | 改訂1: クリック到達はgetPlugin依存（失敗時は認証キー設定へリダイレクト） |
| C-015,018,019,028,029 | Playwright+db.ts＋スタブ（実行保留） | GUI+DB | L1-009式の独立評価⇔CTA突合。C-028は隔離DB必須。C-029=順序非依存の後段上書き（決定的） |
| C-017,023 | Playwright＋スタブ＋外部行きabort（実行保留） | GUI+network | popup/リクエスト観測・原値非記録。C-023=BC-DRAFT-1再現確認枠（不具合はソース確定済み） |
| C-025,026 | Playwright＋スタブ障害応答（実行保留） | GUI | RESP-TIMEOUT/500/FALSE |
| C-027 | スタブ受信記録+db.ts（実行保留） | network(server)+DB | ヘッダ3種・原値非記録 |
| C-020,040,041,042,043 | Playwright＋スタブ（実行保留） | GUI(+DB/network) | 補完5行。C-020=相反version＋単独行対照フェーズ＋DUP隔離apply（順序は観測記録） |

**実行可能性会計（改訂1・実依存ベース）**: **今すぐ実行可=6行**（C-001〜C-005,C-007。-EN=D15）／
**スタブ要実行保留=25行**（§4.1のC-006,C-010〜C-029の20行＋§4.2補完5行）。

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。観点ラベル・前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝68↔候補の期待テキスト突合が本文内で完結する**。

### 集計（68 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **54** | 下表 |
| **TBD** | **0** | — |
| **excluded** | **14** | EX-A バリデーション主語不存在7（009,010,012,013,014,015,017）＋EX-B read-only機能への書込肯定7（037,039,041,042,044,046,047）。各行の実引き正当化は下記 |
| 合計 | **68** | 欠落0・理由なし重複0 |

- 候補ケース行総数**32**（§4.1 bound対応27＝ja26＋-EN1／§4.2 補完5）。
- **excluded根拠（実引き・偽陰性チェック付き）**:
  - **EX-A（009,010,012,013,014,015,017・7件）**: 期待は「必須／相関／DBとの相関バリデーションでエラーが
    表示され（ず）…」の定型。本ブロックは**利用者入力フォーム・入力値を持たない**（md:250「本カードは検索
    フォームや保存フォームを持たない。ホーム画面内で利用者が入力する値はない」・md:94「登録・更新のための
    フォーム POST を持たない」・md:251「ホーム画面側ではレスポンス項目の詳細バリデーションを行わない」・
    カード/モーダル内の可編集入力0件＝L1-021のtwig/modal実測・Controllerにフォーム生成なし
    〔createForm/createBuilder不出現=index実測〕）＝必須/相関/DB相関バリデーションという観測主語が不存在
    （constraint不存在型=m05-16/m02-02/m02-04 EX-Aと同型）。エラーあり側（009,012,015,017）は発生手段なし・
    エラーなし側（010,013,014）は「〜バリデーションで」の限定が構成不能のため両極性とも過剰生成。
    **017の追加確認**: 「DBとの相関バリデーションでエラーが表示され完了しない」に相当する実仕様は設計書に
    不存在（本機能のDB参照はdtb_plugin全件取得とdtb_base_info取得のみで、DB起因のエラー表示仕様の記述なし。
    外部API起因の失敗系はエラーを**表示しない**仕様=md:181でありエラー表示側の実在対応ではない）。
    偽陰性チェック: DB照会実在に基づく「エラーなし継続」の意味成分は**016をC-028へsemantic bind**して保全
    （excludedにしない）。「エラーなく表示継続」の一般成分は060/062がC-002へ、失敗時の挙動実在分は
    006/040/067/068がC-025/C-026へbound済み＝実在仕様の除外なし。
  - **EX-B（037,039,041,042,044,046,047・7件）**: 期待は「更新内容/実行結果の対象レコードの値が**変更される**
    こと」の肯定定型（047はIT-05だが同型の肯定文）。本機能は**参照系でDBへの登録・更新・削除を行わない**
    （md:238 DB操作節の明記＋md:27/222/334＋取得経路にpersist/flush 0件=grep実測・§0裁定。m02-04と異なり
    設計書内も整合＝DOC-DRAFT不要）＝肯定側の観測対象が不存在で過剰生成。**否定側3行（038,043,045
    「変更されない」）は全行C-007へbound**（無書込ブラケットが期待テキストどおりの観測）＝否定側を除外しない
    （偽陰性ゼロ）。
- **極性・ノイズ処理の明示（C4-manual対象=§10）**:
  - **-040はexcludedにしない**: 観点はIT-26「更新内容」だが期待テキストは「通信失敗、HTTP 200 以外、実行結果
    false はプラグイン API 例外として扱うこと」＝md:209の逐語で実在仕様→C-026へbound（機械的に観点ラベルで
    弾かない）。
  - **IT-23系の定型「検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない）」（019-036・18行）**:
    本機能の「取得」はDB側=ローカルプラグイン全件取得＋**source⇔API idの突合**（md:145・ApiSvc:140-153）。
    突合述語（一致/不一致）が実在し結果がCTA表示に反映されるため「含まれる/含まれない」は**一致反映/不一致
    非反映として実現・反証可能**＝bound（m10-11型の無条件全件取得と異なり、走査後の一致述語が観測面を持つ。
    m02-04 IT-23と同根拠）。前提列が具体機能語と噛み合い極性も一致する行（021=件数→C-010併記・028=通信失敗
    →C-025・031=未購入×一致→C-029）は当該観測へ、それ以外の汎用行・前提と極性が食い違う行（027空配列なのに
    「含まれる」・029 HTTP非200なのに「含まれる」・030重複なのに「含まれない」・032非対応なのに「含まれない」
    等）は**前提語を生成器ノイズと断じ**、極性どおり一致側=C-018・不一致側=C-019へshared bind（各前提語の
    実在挙動はC-024/C-026/補完C-020/C-021で別途構成済み=意味成分の取りこぼしなし）。
  - **001/002/003/004（用語定義行）**: 期待テキストは用語表md:59-63の定義文。定義の観測可能成分へbind
    （001=外部API取得配列の行表示→C-010・002=モーダル定義→C-011/C-012・003=状態算出定義→C-018/C-019・
    004=オーナーズストア定義→C-006/C-017の内外両導線）。
  - **063（送信ヘッダ）はboundだが観測面はサーバ側**: ブラウザからは不可視→スタブ受信記録（C-027）を観測契約
    として構成（対象外にしない。既存記録では「観測外」だった行を実行可能グレードへ引き上げ）。
  - **053（未認証）・055（縦スクロール）・058（JSなし）・059（フォームなし）は静的事実の実観測へ**: C-001/
    C-003/C-004/C-005（既存記録の「静的事実=対象外」を有限の観測契約に変換）。

### 68対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 外部のプラグインAPIから取得するホーム掲載の推奨プラグインの配列であること | bound | C-010（行表示=配列のデータ通過） |
| 002 | 画像/名称から開く、価格・対応バージョン・公開日・制作者・説明・導線を表示するモーダルであること | bound | C-011,C-012 (shared) |
| 003 | 外部APIのID・購入要否・購入済みとローカル登録情報を突き合わせて算出する表示・操作状態であること | bound | C-018,C-019 (shared・突合算出の両面) |
| 004 | プラグイン検索・購入・入手・詳細確認を行う外部ストアおよび管理画面内の関連機能であること | bound | C-006（管理画面内検索）,C-017（外部ストア導線） (shared) |
| 005 | カードに取得できたプラグインの画像・名称・短い説明が縦に表示されること | bound | C-010 |
| 006 | 取得失敗時もホーム表示は継続し、おすすめプラグイン行は表示されないこと | bound | C-025 |
| 007 | 同一画面上で対象プラグインの詳細モーダルを開くこと | bound | C-011 |
| 008 | 対象プラグインのインストール確認へ遷移すること | bound | C-014,C-016 (shared・状態1/3両導線) |
| 009 | 必須バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 010 | 必須バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 011 | 外部URLを別ウィンドウで開くこと | bound | C-023 |
| 012 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 013 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 014 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 015 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 016 | DB相関バリでエラーが表示されず継続できること | bound | C-028（semantic bind: 突合DB照会が0件でもエラーなく継続） |
| 017 | DB相関バリでエラーが表示され完了しないこと | **excluded** EX-A | —（DB起因エラー表示の実仕様なし・§8 EX-A追加確認） |
| 018 | 現在バージョンが対応一覧に含まれない場合モーダル内に警告を表示すること | bound | C-021 |
| 019 | 検索条件の該当レコードが取得結果に含まれること | bound | C-018 (shared・一致反映側) |
| 020 | 含まれないこと | bound | C-019 (shared・不一致側) |
| 021 | 含まれること（前提=おすすめ件数） | bound | C-010,C-018 (shared・行数=配列件数) |
| 022 | 含まれないこと（前提=ローカル突合） | bound | C-019 |
| 023 | 含まれること（前提=外部API取得先） | bound | C-018 (shared) |
| 024 | 含まれないこと（前提=送信ヘッダ） | bound | C-019 (shared・前提語はノイズ。ヘッダ実在分はC-027が063でbound) |
| 025 | 含まれること（前提=対応バージョン） | bound | C-018 (shared・前提語ノイズ。警告実在分はC-021が018でbound) |
| 026 | 含まれないこと（前提=価格表示） | bound | C-019 (shared・前提語ノイズ。価格実在分はC-013が065でbound) |
| 027 | 含まれること（前提=空配列。前提と極性が不整合=ノイズ） | bound | C-018 (shared。空配列の実在挙動はC-024が066でbound) |
| 028 | 含まれないこと（前提=通信失敗） | bound | C-025（semantic: 失敗→空配列→取得結果に含まれない） |
| 029 | 含まれること（前提=HTTP非200。極性不整合=ノイズ） | bound | C-018 (shared。HTTP非200の実在挙動はC-026が068でbound) |
| 030 | 含まれないこと（前提=同一取得元ID複数。極性不整合=ノイズ） | bound | C-019 (shared。重複sourceの実在挙動は補完C-020=順序依存のため親対応にしない・改訂1) |
| 031 | 含まれること（前提=未購入かつ購入必要×ローカル一致） | bound | C-029（有料の後段上書き=順序非依存・決定的。改訂1でC-020から分離） |
| 032 | 含まれないこと（前提=対応バージョン非含。極性不整合=ノイズ） | bound | C-019 (shared。非対応の実在挙動はC-021が018でbound=行は消えない) |
| 033 | 実行結果の該当レコードが取得結果に含まれること（前提=URL空） | bound | C-018 (shared・前提語ノイズ。URL空の実在挙動は補完C-041) |
| 034 | 含まれること（前提=画像空） | bound | C-018 (shared・画像空の実在挙動は補完C-042) |
| 035 | 含まれること（前提=参照時点） | bound | C-018 (shared・参照時点の実在挙動は補完C-043) |
| 036 | 含まれること（前提=ローカル整合性） | bound | C-018 (shared) |
| 037 | 更新内容の対象レコードの値が**変更される**こと | **excluded** EX-B | — |
| 038 | 変更され**ない**こと | bound | C-007（無書込ブラケット） |
| 039 | 変更されること | excluded EX-B | — |
| 040 | 通信失敗・HTTP200以外・実行結果falseはプラグインAPI例外として扱うこと | bound | C-026 |
| 041 | 変更されること | excluded EX-B | — |
| 042 | 変更されること | excluded EX-B | — |
| 043 | 変更され**ない**こと | bound | C-007 (shared) |
| 044 | 変更されること | excluded EX-B | — |
| 045 | 変更され**ない**こと | bound | C-007 (shared) |
| 046 | 変更されること | excluded EX-B | — |
| 047 | 実行結果の対象レコードの値が変更されること | excluded EX-B | — |
| 048 | 対象プラグインのインストール確認へ遷移すること（008と同文） | bound | C-014,C-016 (shared) |
| 049 | 外部ストアの購入導線を別ウィンドウで開くフォームを送信すること | bound | C-017 |
| 050 | インストール確認や購入には進めず状態表示として扱うこと | bound | C-015 |
| 051 | 外部URLを別ウィンドウで開くこと（011と同文） | bound | C-023 (shared) |
| 052 | 管理画面内のオーナーズストア検索へ遷移すること | bound | C-006 |
| 053 | ホーム画面自体に到達できず本カードも利用できないこと | bound | C-001 |
| 054 | カードに見出し・画像・名称・短説明・オーナーズストアリンクを表示すること | bound | C-002（見出し/footer）,C-010（行要素） (shared) |
| 055 | カード本文は最大高さを持ち縦スクロールすること | bound | C-003 |
| 056 | 画像/名称リンクはBootstrapのモーダル属性で詳細モーダルを開くこと | bound | C-011 |
| 057 | モーダルに画像〜長い説明の全項目を表示すること | bound | C-012 |
| 058 | 本ブロック固有のJavaScriptファイルは持たないこと | bound | C-004 |
| 059 | 本ブロックは登録・更新のためのフォームPOSTを持たないこと | bound | C-005 |
| 060 | 画面表示データでエラーが表示されず継続できること | bound | C-002 (shared・正常表示エラーなし) |
| 061 | ローカル全件取得し外部APIのIDと取得元IDの一致をプラグインごとに確認すること | bound | C-018,C-019 (shared・突合の実観測両面) |
| 062 | 画面表示データでエラーが表示されず継続できること | bound | C-002 (shared) |
| 063 | プラグイン認証キー・サイトURL・EC-CUBEバージョンを送信すること | bound | C-027 |
| 064 | 現在バージョンが対応バージョン一覧に含まれるかで判定すること | bound | C-021,C-022 (shared・判定の両側) |
| 065 | モーダルでは価格を税込表記として表示すること | bound | C-013 |
| 066 | おすすめプラグイン行は表示しないこと（空配列） | bound | C-024 |
| 067 | ホーム表示を継続しおすすめプラグイン行は表示しないこと（通信失敗） | bound | C-025 (shared) |
| 068 | プラグインAPI例外として扱い空配列表示にフォールバックすること（HTTP非200） | bound | C-026 (shared) |

`func_scope_check` 判定: 親68/68会計済み（bound54＋TBD0＋excluded14=68・差分0）・欠落0・理由なし重複0・
補完5行（C-020/C-040/C-041/C-042/C-043）は§4.2に実体掲載（親空・設計書補完md:184/89,125/77,187/188/196,211・
母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m02-06-1（オーナーズストア遷移先URL例示の不一致・要修正候補）** | 設計md:78は遷移先を `GET /%eccube_admin_route%/store/plugin` と例示するが、実装リンク先は `admin_store_plugin_owners_search_page`＝`/store/plugin/api/search/page[/{page_no}]`（twig:299／OwnerStoreCtl:76）。`/store/plugin` は別route（admin_store_plugin=プラグイン一覧・PluginController.php:75）。md:14/35がroute名・URLパスをスコープ外宣言→**裁定: 実装routeを正**（C-006）。利用者観点期待（オーナーズストア検索へ遷移）は不変。設計書の例示是正は上流へ申し送り。既存記録=`m02_06_..._e2e_cases.md`付帯表4#1と同根 |
| 2 | **BC-DRAFT-m02-06-1（モーダルのリテラル「{ }}」表示汚染・ソース確認済み・C-023）** | modal:26 は `…{{ 'admin.store.plugin_owners_search.modal.contact'\|trans }}</a>{ }}` で終わり、末尾の `{ }}` はTwigの開始記法（`{{`/`{%`/`{#`）のいずれにも該当しない**リテラルテキスト**（Twig字句規則）。したがって **contact_url真のモーダルHTMLに文字列「{ }}」が出力されることはソースから確定**（テンプレ編集の残骸・改訂1でcodex指摘により「疑い」から格上げ）。設計のモーダル内容（md:90）にそのような表示はなく設計乖離＝**ソース確認済みの不具合候補**として `BUG_CANDIDATE_REGISTER` 系への正式採番対象。**C-023手順4の実走は再現確認（画面上の見え方の記録）に位置付け**、確定判定に依存しない。期待値は設計側のまま（余計な表示なし）。上流EC-CUBE由来かee固有かの切り分けはD5で実施（いずれでも表示汚染の事実は変わらない） |
| 3 | **サーバ側スタブAPI未整備＝外部契約ケースの実行保留（本機能最大の要実機規模・改訂1で実依存へ是正）** | おすすめ取得はサーバ間通信でブラウザmock不可（既存記録実測）。さらに**遷移先も同一外部APIの別エンドポイントを呼ぶ**（検索=GET /category・GET /plugins／インストール確認=GET /plugin/{id}）＝§2aの隣接スタブ契約を追加定義。**スタブAPI＋env切替（§6.2）が整備されるまで実行保留=25行**（§4.1のC-006・C-010〜C-029の20行＋§4.2補完5行）。既存実走4〇/23×の×側とほぼ同集合であり、本候補はそれらを「手動」でなく**スタブ観測契約つきの実行可能グレード**（手順・期待・fixture契約確定済み）へ引き上げた。**今すぐ実行可能=6行**（C-001〜C-005,C-007。C-006はhref同定サブ観測のみ今すぐ可・-ENはD15待ち） |
| 4 | 外部API応答の中身は期待値の正にしない | 推薦対象・並び順・項目値は外部APIの返却値を正とする設計（md:171,197）＝**データ通過**。表示突合はL1-003/011の「取得値をそのまま表示・補正しない」契約に基づくfixture⇔画面の一致観測で、応答内容自体をオラクル化しない（実本番APIの応答内容へのassertは書かない） |
| 5 | C-006の依存の精密化（改訂1） | 遷移先（オーナーズストア検索）は `getCategory()`（失敗catchで空=OwnerStoreCtl:88-92/ApiSvc:58-67）と `getPlugins()`（失敗catchでエラーメッセージ表示=OwnerStoreCtl:148-154）を呼ぶ＝**画面骨格は外部不達でも成立するが、意味あるレンダの安定観測は隣接スタブ RESP-CATEGORY/RESP-PLUGINS が前提**→C-006は実行保留へ会計（hrefのroute同定サブ観測のみレンダ非依存=今すぐ可）。加えて**認証キー設定**（空ならOwnerStoreCtl:80-84が認証キー設定へリダイレクト）が前提=SEED-M0206-AUTHKEY。本機能の期待はリンクと遷移先同定まで（遷移先画面の中身の正は遷移先機能設計） |
| 5b | C-020の順序依存の扱い（改訂1） | 重複source時の最終状態は「最後に評価された一致行」に依存し、走査順（findAll・ORDER BY無し）は**DB実装依存＝仕様として固定されない**（md:184も勝者を約束しない）。SEED契約（id昇順投入・行更新なし）は物理走査順の**再現条件**であり順序保証ではない→C-020の合否は「フェーズA/C（単独行）の決定的期待＋フェーズBが2/3のいずれか（1/4でない）」までに拘束し、フェーズBの勝者は**観測記録**（順序仮定を期待値化しない）。SEED-M0206-PLUGIN-DUPはC-020内のみapply（常設するとC-016/C-018のP3期待が順序依存化するため隔離） |
| 6 | C-028（ローカル0件）の環境前提 | dtb_plugin 0件は「状態の不在」＝共有DBでは保証不能→**隔離DB/フレッシュDB必須**・事前確認0件でなければskip（m02-04 C-017と同型） |
| 7 | 送信ヘッダ観測（C-027）と秘匿 | X-ECCUBE-KEY原値・購入フォームpublic_key原値は**成果物・ログへ記録しない**（md:308-315）。突合はメモリ内比較。スタブ受信記録の保存形式（原値マスク）はD5で契約 |
| 8 | 外部行き遮断（C-017/C-023） | 購入POST・外部リンクはブラウザ側routeでabortしpopup/リクエスト発生のみ観測（外部ストア・外部サイトへ実到達しない。決済・購入完了後の状態反映はmd:40でスコープ外）。abort下でのpopup挙動の安定性は要実機確認 |
| 9 | インストール確認遷移後（C-014/C-016） | 遷移先（install_confirm）の画面内容・API失敗時挙動は遷移先機能の範囲（md:289「遷移先機能のエラー処理に委ねる」・md:278）＝本候補は遷移URLの同定まで。遷移後の観測は対象外（委譲宣言はオラクル化しない） |
| 10 | date_day書式・price書式のロケール依存 | 公開日/最終更新日はIntl 'medium'書式（IntlExtension.php:42-49）・価格はNumberFormatter CURRENCY（EccubeExtension.php:178-187・既定ja/JPY）＝**書式の固定文字列をオラクル化せず**、書式生成関数と同型の期待生成で突合（D5で書式ヘルパ契約）。値はAPI取得値パススルー |
| 11 | 管理画面のenロケール切替口 | 要D15（-EN 1行の実行前提。W0実測を継承）。モーダル/CTA系のen観測はスタブ＋D15の二重前提のため行を追加せず§5の方針で同梱 |
| 12 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。スタブAPI・SEED-M0206系SQLは未実装=§2は設計） |
| 13 | ハーネス待機条件 | 既存×のE2E-M02-06-005（waitUntil load 30秒タイムアウト）は外部リソース待ちが原因＝本候補は待機契約を `#ec-cube-plugin` 可視+DOMContentLoadedへ変更（§6.1）。実機での安定性はD5確認 |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: 実装側BC-DRAFTは**1件**（BC-DRAFT-m02-06-1=モーダルのリテラル「{ }}」表示汚染・**ソース確認済み**・
実走は再現確認・期待は設計側のまま）。設計書側DOC-DRAFTは**1件**（#1オーナーズストアURL例示）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| 含まれる/含まれ**ない** | 019,021,023,025,027,029,031,033,034,035,036（含まれる）vs 020,022,024,026,028,030,032（含まれない） | 含まれる→突合一致反映側（C-018。021はC-010併記・031はC-029の後段上書き）・含まれない→不一致非反映側（C-019。028はC-025のsemantic=失敗で空）。突合述語（source==id・version_compare・purchased/purchase_required）実在のためbound（m10-11型の実現不能とは前提が異なる）。**前提語と極性が食い違う4行（027/029/030/032）は前提語をノイズと断じ極性側でbind**し、前提語の実在挙動は別ケース（C-024/C-026/補完C-020/C-021）が構成済みであることを個別確認（意味成分の取りこぼしなし）。取り違えなし |
| 変更され**る**/され**ない** | 037,039,041,042,044,046,047（肯定）vs 038,043,045（否定） | 肯定=EX-B（本機能にINSERT/UPDATE経路なし=md:238明記+persist/flush grep 0件）・否定=C-007（行数+全列ダイジェスト不変）へbound。**040は同じIT-26帯だが期待テキストが実在仕様（API例外の扱い=md:209逐語）のためexcludedにせずC-026へbound**（観点ラベル機械除外の防止例）。肯定側をboundにする取り違えなし |
| エラー表示され/表示され**ず** | 009,012,015,017（拒否側）vs 010,013,014,016（継続側）vs 060,062（表示データのエラーなし継続） | バリデーション系はフォーム/利用者入力不存在で**両極性とも**EX-A（片極性のみ除外する誤りなし）。016はDB照会（突合）実在によるsemantic bind（C-028=0件でもエラーなく継続）・017はDB起因エラー表示の実仕様が設計書に不存在＝EX-A（m02-04の017がTBDだったのは設計書がDB障害の委譲を明記していたため。本設計書には該当記述がなく「実在仕様のオラクル化不能」ではなく「仕様不存在」＝excludedが正確。API失敗側のエラーなし継続はC-025/C-026がbound済み）。060/062は主語が「画面表示データ」＝正常表示継続としてC-002へbound |
| 表示する/表示し**ない** | 005,054,057（行・項目を表示）vs 006,066,067（行を表示しない）・018（警告を表示）vs（警告なし=64の判定両面） | 表示側→C-010/C-012・非表示側→C-024/C-025（失敗/空でも枠は残る=見出し・footerリンク表示をC-024で対に観測）。警告はC-021（表示）/C-022（不在）の対で、**「警告が出ない」を「行が出ない」と混同しない**（非対応でも一覧行は表示=md:186をC-021手順3で明示）。URLボタンの有/無は C-023/補完C-041 の対。極性反転なし |
| 遷移する/遷移し**ない**（進めない） | 008,048,052（遷移する）vs 050（進めない=状態表示）・007,056（同一画面でモーダル=画面遷移なし） | 遷移側→C-014/C-016（install_confirm URL同定）・C-006（オーナーズストア）。不遷移側→C-015（href="#"・押下後も遷移なし・購入submitも不出力を確認）・C-011（URL不変の明示観測）。**状態2の「インストール済み」を導線と誤読しない**（md:76「インストール確認や購入には進めず、状態表示として扱う」をC-015の期待に逐語で反映） |
| 開く（別ウィンドウ）/開かない | 011,049,051（別ウィンドウで開く） | C-017/C-023はpopup発生の観測契約を有限に限定（外部行きabort・実到達なし・原値非記録）。「開かない」側の母集合行はなし（URLなし非表示=補完C-041が構成的に対） |
| 持た**ない**/行わ**ない**（静的否定） | 058（固有JSなし）,059（フォームPOSTなし） | 否定claimは観測契約を有限に限定して構成（C-004=カード+モーダル内script/on*属性0件＋本ブロック起因XHR/fetch 0件〔画像リソース・他ブロックは除外〕・C-005=アプリ宛form 0件+可編集入力0件〔外部ストア宛formの存在は明記して除外〕）。無限の否定は主張しない。極性反転なし |
| 上書きされる（後段評価・重複走査） | 031（未購入×一致→購入側へ）・（重複source=親なし補完） | 有料後段上書き=**C-029**（④はループ後の単一if=順序非依存で決定的。ApiSvc:155-158・md:117「この判定は…後に評価され…上書きする」を期待に反映し「インストール済み/アップデート」を期待にする誤りを防止=source一致していても4が勝つ）。重複source=**補完C-020**（一致行ごとに2再セット→版比較のため最終状態は最後の一致行依存・走査順は仕様非固定=**順序仮定を期待値化せず**フェーズA/C単独行の決定的対照＋フェーズB「2/3のいずれか・1/4でない」に拘束し勝者は観測記録=codex R1 Major1是正） |
| 定義文（用語表） | 001,002,003,004 | 定義の観測可能成分へbind（§8注記）。「オーナーズストア=外部ストアおよび管理画面内の関連機能」は内外**両方**の導線（C-006+C-017）へsharedし、片側に丸めない |

- 「キャンセルボタン」（md:89）と画面文言「一覧に戻る」（ja:3517）の呼称差は L1-023/013 で画面文言側に確定
  （messages逐語）。
- 見出し「商品詳細」（modal header=ja:3513。プラグインなのに「商品詳細」）は一次資料逐語のまま採用し、
  違和感の是正は判定に持ち込まない（実装文言が正・憶測での書換なし）。
- 外部API応答スキーマは「実装が消費するフィールドの全列挙」（§2a）までを契約とし、スキーマ全体
  （md:42でスコープ外）を捏造しない。
- codex敵対レビュー: **R1=要修正（Blocker1＋Major2。excluded=14・CTA分岐根拠・外部委譲の偽陰性なし・捏造ゼロ・
  DOC-DRAFTは妥当確認済み）→改訂1で是正・R2再確認待ち**。R1検出の記録（C4-manual実効性証跡）:
  ①実行可能性会計が実依存と不一致（遷移先の getCategory/getPlugins/getPlugin=RESP-*契約外の追加外部API依存を
  見落とし「今すぐ7/スタブ後23即実行可」と過大申告＝**観測の前提依存の見落とし検出例**）→隣接スタブ契約追加＋
  C-006保留化＋C-007縮退＋C-014/C-016前提明記で会計を6/25へ是正
  ②C-020が非決定的（版関係未固定＋findAll走査順不定では「上書き」を実証不能＝**反証可能性欠如の検出例**）→
  相反version＋単独行対照＋順序非オラクル化へ再設計・C-029分離
  ③BC-DRAFT-1の不必要な未確定化（ソースから静的確定できる事実を「実走で確定」と弱く扱った＝**確度の過小申告
  検出例**）→ソース確認済み不具合候補へ格上げ・実走は再現確認に位置付け。
  →ヘッダ/§0(d)/§1 L1-009,015,016,018/§2/§3/§4/§7/§8/§9/oracle jsonへ反映済み。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（336行全文）／ee実ソース・設定 15超（AdminController〔index・推奨取得部〕・
  PluginApiService全文〔getRecommended/buildPlugins/isUpdate/requestApi/buildInfo/supportedVersion〕・
  index.twigカード全文・plugin_detail_modal.twig全文・plugin_detail_info.twig全文・OwnerStoreController
  〔search/doConfirm route〕・PluginController〔admin_store_plugin route〕・Plugin.php・BaseInfo.php・
  Constant.php・security.yaml・eccube.yaml・services.yaml〔locale/currency〕・EccubeExtension〔price〕・
  IntlExtension〔date_day〕〕／locale 2（messages ja/en 該当20キー）／母集合・fid_kubun 2／統治・見本 3
  （CFP・ROLLOUT・m02-04草案）／既存資産 3（e2e_cases md・page・spec）。
- L1 claim数: **24確定・TBD 0**。候補ケース行31（ja30・-EN1）。
- おすすめプラグイン特有の難所: (1) **外部API依存の規模が最大**: サーバ間通信でブラウザmock不可＝行表示・
  モーダル・状態別CTA・警告・失敗系に加え、遷移先レンダ/クリック到達も隣接エンドポイント（/category・/plugins・
  /plugin/{id}）依存＝計25行がスタブAPI（未整備）待ちの実行保留（改訂1で実依存へ是正）。ただし表示契約・分岐条件・
  文言はすべて一次資料で確定済み＝基盤整備後に即実行可の水準まで具体化した
  (2) **状態算出の4値と後段上書き**: update_status 1/2/3/4 の判定順（一致→2、古い→3、未購入有料→4が最後に
  勝つ）と重複source走査の「最後の一致行依存・順序非固定」をL1-009に一本化し、CTAケース（C-014〜C-017,C-029,補完C-020）が同一式を参照。重複の決定的観測は相反version＋単独行対照で構成（codex R1是正）
  (3) **外部応答を正にしない規律**: 応答fixtureは入力再現手段・期待はデータ通過契約（md:171/197）＝
  「fixture値とUIの一致」を主張し「本番APIの内容」を主張しない
  (4) 実装検分でBC-DRAFT-1（modal:26のリテラル「{ }}」）とDOC-DRAFT-1（オーナーズストアURL例示不一致）を
  検出。遷移先の認証キーguard（OwnerStoreCtl:80-84）はC-006の前提条件として先回りで契約化
  (5) IT-23系18行の「含まれる/含まれない」は前提語と極性の食い違いが4行あり、ノイズ断定と意味成分の
  別ケース保全（§10）が最大の読解コスト。
