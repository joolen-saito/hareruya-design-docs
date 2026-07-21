# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-06_0305_sheet-9_sheet.json#f05-06_0305_sheet-9_sheet-conformance-b85abb812e39`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-06_0305_sheet-9_sheet.json`
- sourceFindingId: `f05-06_0305_sheet-9_sheet-conformance-b85abb812e39`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-06_0305_sheet-9_sheet` / F05-06 買取依頼完了
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 買取依頼完了画面の画面部品ID3「オンライン本人確認について」は画像で、押下時に別ウィンドウでオンライン本人確認について画面へ遷移する（sheet-9 画面部品表／カスタマイズ説明「・別ウィンドウでオンライン本人確認について画面に遷移する」）。
- implementationActual: complete.twig:64 は `<a href="{{ path('mypage_identification') }}">{{ 'front.mypage.nav__identification'|trans }}</a>`（文言はテキスト「オンライン本人確認」= messages.ja.yaml:646）のテキストリンクのみ。アンカーに target="_blank" が無く同一ウィンドウ遷移。設計が求める画像（QRコード）は complete.twig:63 …
- mismatchReason: 設計は『別ウィンドウでオンライン本人確認について画面に遷移する』と明記するが、実装のアンカーには target="_blank" が無く同一ウィンドウ遷移で別ウィンドウ要件を満たさない。加えて設計の部品種別は『画像』だが実装はテキストリンクで、意図する画像（QRコード）は complete.twig:63 の TODO で未実装。Purchase/complete.twig のみに当該アンカーが存在し JS 等での別ウィンドウ化も無いことを確認した上での判定。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-9（画面部品ID3・カスタマイズ説明）
- implRef: src/Eccube/Resource/template/default/Purchase/complete.twig:62-64

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-06_0305_sheet-9_sheet-conformance-b85abb812e39",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-9",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-9（画面部品ID3・カスタマイズ説明）",
  "designExpectation": "買取依頼完了画面の画面部品ID3「オンライン本人確認について」は画像で、押下時に別ウィンドウでオンライン本人確認について画面へ遷移する（sheet-9 画面部品表／カスタマイズ説明「・別ウィンドウでオンライン本人確認について画面に遷移する」）。",
  "designQuote": "買取依頼完了画面の画面部品ID3「オンライン本人確認について」は画像で、押下時に別ウィンドウでオンライン本人確認について画面へ遷移する（sheet-9 画面部品表／カスタマイズ説明「・別ウィンドウでオンライン本人確認について画面に遷移する」）。",
  "implRef": "src/Eccube/Resource/template/default/Purchase/complete.twig:62-64",
  "implementationActual": "complete.twig:64 は `<a href=\"{{ path('mypage_identification') }}\">{{ 'front.mypage.nav__identification'|trans }}</a>`（文言はテキスト「オンライン本人確認」= messages.ja.yaml:646）のテキストリンクのみ。アンカーに target=\"_blank\" が無く同一ウィンドウ遷移。設計が求める画像（QRコード）は complete.twig:63 の TODO コメント『デザインタスク QRコード画像を表示する』のとおり未表示。遷移先 mypage_identification（/mypage/identification）自体は設計の遷移先と一致。",
  "difference": "設計は『別ウィンドウでオンライン本人確認について画面に遷移する』と明記するが、実装のアンカーには target=\"_blank\" が無く同一ウィンドウ遷移で別ウィンドウ要件を満たさない。加えて設計の部品種別は『画像』だが実装はテキストリンクで、意図する画像（QRコード）は complete.twig:63 の TODO で未実装。Purchase/complete.twig のみに当該アンカーが存在し JS 等での別ウィンドウ化も無いことを確認した上での判定。",
  "mismatchReason": "設計は『別ウィンドウでオンライン本人確認について画面に遷移する』と明記するが、実装のアンカーには target=\"_blank\" が無く同一ウィンドウ遷移で別ウィンドウ要件を満たさない。加えて設計の部品種別は『画像』だが実装はテキストリンクで、意図する画像（QRコード）は complete.twig:63 の TODO で未実装。Purchase/complete.twig のみに当該アンカーが存在し JS 等での別ウィンドウ化も無いことを確認した上での判定。",
  "comparisonRows": [
    {
      "item": "部品種別",
      "design": "画像（オンライン本人確認について）",
      "implementation": "テキストリンク（QRコード画像は complete.twig:63 の TODO で未表示）",
      "mismatch": "画像→テキストリンク"
    },
    {
      "item": "遷移ウィンドウ",
      "design": "別ウィンドウでオンライン本人確認について画面に遷移",
      "implementation": "アンカーに target=\"_blank\" 無し＝同一ウィンドウ遷移",
      "mismatch": "別ウィンドウ要件未充足"
    },
    {
      "item": "遷移先",
      "design": "オンライン本人確認について画面",
      "implementation": "mypage_identification (/mypage/identification)",
      "mismatch": "一致（差異なし）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-06_0305_sheet-9_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Purchase/complete.twig:62-64",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「買取依頼完了画面の画面部品ID3「オンライン本人確認について」は画像で、押下時に別ウィンドウでオンライン本人確認について画面へ遷移する（sheet-9 画面部品表／カスタマイズ説明「・別ウィンドウでオンライン本人確認について画面に遷移する」）。」。実装は「complete.twig:64 は `<a href=\"{{ path('mypage_identification') }}\">{{ 'front.mypage.nav__identification'|trans }}</a>`（文言はテキスト「オンライン本人確認」= messages.ja.yaml:646）のテキストリンクのみ。アンカーに target=\"_blank\" が無く同一ウィンドウ遷移。設計が求める画像（QRコード）は complete.twig:63 の TODO コメント『デザインタスク …」。乖離理由は「設計は『別ウィンドウでオンライン本人確認について画面に遷移する』と明記するが、実装のアンカーには target=\"_blank\" が無く同一ウィンドウ遷移で別ウィンドウ要件を満たさない。加えて設計の部品種別は『画像』だが実装はテキストリンクで、意図する画像（QRコード）は complete.twig:63 の TODO で未実装。Purchase/complete.twig のみに当該アンカーが存在し JS 等での別ウィンドウ化も無いことを確認した上での判定。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Service・業務ルール",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3055\n3052:       </section>\n3053:       <!-- function-design-embed:end f05-06-f05-06_front_online_purchase_buy_shopping_complete -->\n3054: </section>\n3055:       <section class=\"sheet-panel\" id=\"sheet-9\">\n3056:         <div class=\"sheet-heading\">\n3057:           <h2>買取依頼完了</h2>\n3058:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Purchase/complete.twig:62-64",
    "src/Eccube/Resource/template/default/Purchase/complete.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Purchase/complete.twig:62\n59:                     </tbody>\n60:                 </table>\n61: \n62:                 <p class=\"ec-para\">\n63:                     {# TODO: デザインタスク QRコード画像を表示する #}\n64:                     <a href=\"{{ path('mypage_identification') }}\">{{ 'front.mypage.nav__identification'|trans }}</a>\n65:                 </p>",
    "src/Eccube/Resource/template/default/Purchase/complete.twig:1\n1: {#\n2: 買取依頼完了\n3: #}\n4: {% extends 'default_frame.twig' %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
