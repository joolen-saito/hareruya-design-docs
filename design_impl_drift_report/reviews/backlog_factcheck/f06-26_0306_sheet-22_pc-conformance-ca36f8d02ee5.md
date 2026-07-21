# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-26_0306_sheet-22_pc.json#f06-26_0306_sheet-22_pc-conformance-ca36f8d02ee5`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-26_0306_sheet-22_pc.json`
- sourceFindingId: `f06-26_0306_sheet-22_pc-conformance-ca36f8d02ee5`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-26_0306_sheet-22_pc` / F06-26 店頭PC用アカウント制御
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 「支店店内アカウント」(支店店頭PC)のアクセス制限画面は、本店店内アカウントで制限されている 1～22 画面（ネット買取トップ/一覧/詳細/カート/買取手続き、パスワード変更、購入履歴一覧/詳細、入荷待ち商品一覧、お気に入り一覧、ポイント履歴、買取履歴一覧/詳細、まとめて買取査定結果、会員情報変更、退会、お問い合わせ、お問い合わせ履歴、マイイベント・デッキ登録、大会デッキ登録編集、配送先新規登録・変更、大会申込）に加え『本店からの注文』も制限対象とする。
- implementationActual: 支店店内アカウントは顧客グループ id=5『支店用店内アカウント』で shop_front_flg=0 / branch_shop_front_flg=1（Version20260618000009.php:84）。CustomerGroupAccessListener::onKernelRequest の 1～22 画面（SHOP_FRONT_RESTRICTED_ROUTES）遮断分岐は line74 で getShopFrontFlg()（本店店内 id=3 のみ t…
- mismatchReason: 設計は支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記。実装は 1～22 の遮断を getShopFrontFlg()（本店店内 id=3 のみ true）でゲートしており、支店は branch_shop_front_flg 経由の本店注文遮断しか持たないため、支店アカウントに対する 1～22 の制限が実装されていない（部分実装＝実装違い）。DtbCustomerGroup(id=5) の shop_front_flg=0 はseedマイグレ…
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-22（機能仕様「7.アクセス制限がない画面に遷移」／本店・支店の相違点表：支店＝店内アカウント制限画面＋本店注文）
- implRef: src/Eccube/EventListener/CustomerGroupAccessListener.php:74-90, src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:28-149, app/DoctrineMigrations/Version20260618000009.php:84

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-26_0306_sheet-22_pc-conformance-ca36f8d02ee5",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-22",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-22（機能仕様「7.アクセス制限がない画面に遷移」／本店・支店の相違点表：支店＝店内アカウント制限画面＋本店注文）",
  "designExpectation": "「支店店内アカウント」(支店店頭PC)のアクセス制限画面は、本店店内アカウントで制限されている 1～22 画面（ネット買取トップ/一覧/詳細/カート/買取手続き、パスワード変更、購入履歴一覧/詳細、入荷待ち商品一覧、お気に入り一覧、ポイント履歴、買取履歴一覧/詳細、まとめて買取査定結果、会員情報変更、退会、お問い合わせ、お問い合わせ履歴、マイイベント・デッキ登録、大会デッキ登録編集、配送先新規登録・変更、大会申込）に加え『本店からの注文』も制限対象とする。",
  "designQuote": "「支店店内アカウント」(支店店頭PC)のアクセス制限画面は、本店店内アカウントで制限されている 1～22 画面（ネット買取トップ/一覧/詳細/カート/買取手続き、パスワード変更、購入履歴一覧/詳細、入荷待ち商品一覧、お気に入り一覧、ポイント履歴、買取履歴一覧/詳細、まとめて買取査定結果、会員情報変更、退会、お問い合わせ、お問い合わせ履歴、マイイベント・デッキ登録、大会デッキ登録編集、配送先新規登録・変更、大会申込）に加え『本店からの注文』も制限対象とする。",
  "implRef": "src/Eccube/EventListener/CustomerGroupAccessListener.php:74-90, src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:28-149, app/DoctrineMigrations/Version20260618000009.php:84",
  "implementationActual": "支店店内アカウントは顧客グループ id=5『支店用店内アカウント』で shop_front_flg=0 / branch_shop_front_flg=1（Version20260618000009.php:84）。CustomerGroupAccessListener::onKernelRequest の 1～22 画面（SHOP_FRONT_RESTRICTED_ROUTES）遮断分岐は line74 で getShopFrontFlg()（本店店内 id=3 のみ true）を条件とするため支店 id=5 には適用されない。支店に効く分岐は line81-90 のみで、対象は BRANCH_SHOP_FRONT_MAIN_SHOP_RESTRICTED_ROUTES（RouteRegistry の shopping系＝本店注文のみ）かつ isMainShop() 時に限定。結果として支店店内アカウントは 1～22 画面（買取・会員情報変更・退会・お問い合わせ・入荷通知一覧・お気に入り・ポイント履歴・購入/買取履歴・デッキ登録・配送先・大会申込 等）を遮断されず利用できる。src/Eccube・html 全域を grep しても支店を 1～22 画面で遮断する別経路は存在しない。",
  "difference": "設計は支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記。実装は 1～22 の遮断を getShopFrontFlg()（本店店内 id=3 のみ true）でゲートしており、支店は branch_shop_front_flg 経由の本店注文遮断しか持たないため、支店アカウントに対する 1～22 の制限が実装されていない（部分実装＝実装違い）。DtbCustomerGroup(id=5) の shop_front_flg=0 はseedマイグレーション Version20260618000009.php:84 で確定。反証として getBranchShopFrontFlg / getShopFrontFlg / SHOP_FRONT_RESTRICTED_ROUTES の全参照を確認したが、支店を 1～22 で遮断する別 Listener/Service/Twig は不在。",
  "mismatchReason": "設計は支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記。実装は 1～22 の遮断を getShopFrontFlg()（本店店内 id=3 のみ true）でゲートしており、支店は branch_shop_front_flg 経由の本店注文遮断しか持たないため、支店アカウントに対する 1～22 の制限が実装されていない（部分実装＝実装違い）。DtbCustomerGroup(id=5) の shop_front_flg=0 はseedマイグレーション Version20260618…",
  "comparisonRows": [
    {
      "item": "支店店内アカウント(id=5)の判定フラグ",
      "design": "本店店内と同じ 1～22 制限の対象",
      "implementation": "shop_front_flg=0 のため getShopFrontFlg() ゲート(line74)を通過し 1～22 制限が非適用",
      "mismatch": "支店に 1～22 制限が効かない"
    },
    {
      "item": "1～22画面(買取/会員情報変更/退会/お問い合わせ/入荷通知/お気に入り/ポイント/履歴/デッキ/配送先/大会申込)の遮断",
      "design": "支店店内アカウントも遮断",
      "implementation": "遮断なし（利用可能）",
      "mismatch": "未遮断（欠落）"
    },
    {
      "item": "本店からの注文(shopping系)の遮断",
      "design": "支店店内アカウントは本店注文不可",
      "implementation": "branch_shop_front_flg かつ isMainShop() 時に BRANCH_SHOP_FRONT_MAIN_SHOP_RESTRICTED_ROUTES を遮断(line81-90)",
      "mismatch": "一致（この部分のみ実装済み）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-26_0306_sheet-22_pc",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/EventListener/CustomerGroupAccessListener.php:74-90, src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:28-149, app/DoctrineMigrations/Version20260618000009.php:84",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記」。実装は「支店店内アカウントは顧客グループ id=5『支店用店内アカウント』で shop_front_flg=0 / branch_shop_front_flg=1（Version20260618000009.php:84）。CustomerGroupAccessListener::onKernelRequest の 1～22 画面（SHOP_FRONT_RESTRICTED_ROUTES）遮断分岐は line74 で getShopFrontFlg()（本店店内 id=3 のみ true）を条件とするため支店 id=5 …」。乖離理由は「設計は支店店内アカウントの遮断画面＝『店内アカウントの 1～22』＋『本店注文』と明記。実装は 1～22 の遮断を getShopFrontFlg()（本店店内 id=3 のみ true）でゲートしており、支店は branch_shop_front_flg 経由の本店注文遮断しか持たないため、支店アカウントに対する 1～22 の制限が実装されていない（部分実装＝実装違い）。DtbCustomerGroup(id=5) の shop_front_flg=0 はseedマイグレーション Version20260618…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7186\n7183:       </section>\n7184:       <!-- function-design-embed:end f06-25-f06-25_front_member_store_order_call_number -->\n7185: </section>\n7186:       <section class=\"sheet-panel\" id=\"sheet-22\">\n7187:         <div class=\"sheet-heading\">\n7188:           <h2>店頭PC用アカウント制御</h2>\n7189:         </div>",
  "implementationRefs": [
    "src/Eccube/EventListener/CustomerGroupAccessListener.php:74-90",
    "src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:28-149",
    "app/DoctrineMigrations/Version20260618000009.php:84",
    "src/Eccube/EventListener/CustomerGroupAccessListener.php",
    "src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php",
    "app/DoctrineMigrations/Version20260618000009.php"
  ],
  "implementationSnippets": [
    "app/DoctrineMigrations/Version20260618000009.php:84\n81:             ['id' => 2, 'name' => 'SCG取引用', 'point_percentage' => 5, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 05:01:33+00', 'member_id' => null],\n82:             ['id' => 3, 'name' => '店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '1', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-06-26 17:56:17+00', 'member_id' => null],\n83:             ['id' => 4, 'name' => 'Sekappy用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 04:55:23+00', 'member_id' => null],\n84:             ['id' => 5, 'name' => '支店用店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '1', 'create_date' => '2022-06-09 01:00:51+00', 'update_date' => '2022-06-29 22:39:26+00', 'member_id' => null],\n85:             ['id' => 6, 'name' => '海外代理販売用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2022-11-28 20:39:03+00', 'update_date' => '2023-05-23 04:36:09+00', 'member_id' => null],\n86:             ['id' => 9, 'name' => '集換社アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2025-10-27 20:39:04+00', 'update_date' => '2025-10-27 21:22:15+00', 'member_id' => null],\n87:         ];"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
