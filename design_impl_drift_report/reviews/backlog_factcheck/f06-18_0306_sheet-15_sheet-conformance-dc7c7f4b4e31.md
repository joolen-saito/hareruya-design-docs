# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-dc7c7f4b4e31`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json`
- sourceFindingId: `f06-18_0306_sheet-15_sheet-conformance-dc7c7f4b4e31`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-18_0306_sheet-15_sheet` / F06-18 会員情報変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 1-28『戻る』ボタン・完了画面 2-2『戻る』は押下するとECTOP画面（本店ECTOP＝url('homepage')）へ遷移する。
- implementationActual: change.twig:700 の戻るリンクは href=url('mypage')、change_complete.twig:48 の back_to_mypage も href=url('mypage') で、いずれもマイページTOPへ遷移する。ECTOP(homepage) への戻り導線は存在しない。
- mismatchReason: 設計は 1-28/2-2 の戻る遷移先をECTOP画面(url('homepage'))と規定するが、両twigとも url('mypage') を指す。ChangeController・両twigを確認し homepage への戻り導線は不在。遷移先が設計と異なる実装違い。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (1-28 戻る／完了画面 2-2 戻る:『押下すると、ECTOP画面へ遷移する』)
- implRef: src/Eccube/Resource/template/default/Mypage/change.twig:700 ; src/Eccube/Resource/template/default/Mypage/change_complete.twig:48

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-18_0306_sheet-15_sheet-conformance-dc7c7f4b4e31",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (1-28 戻る／完了画面 2-2 戻る:『押下すると、ECTOP画面へ遷移する』)",
  "designExpectation": "1-28『戻る』ボタン・完了画面 2-2『戻る』は押下するとECTOP画面（本店ECTOP＝url('homepage')）へ遷移する。",
  "designQuote": "1-28『戻る』ボタン・完了画面 2-2『戻る』は押下するとECTOP画面（本店ECTOP＝url('homepage')）へ遷移する。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/change.twig:700 ; src/Eccube/Resource/template/default/Mypage/change_complete.twig:48",
  "implementationActual": "change.twig:700 の戻るリンクは href=url('mypage')、change_complete.twig:48 の back_to_mypage も href=url('mypage') で、いずれもマイページTOPへ遷移する。ECTOP(homepage) への戻り導線は存在しない。",
  "difference": "設計は 1-28/2-2 の戻る遷移先をECTOP画面(url('homepage'))と規定するが、両twigとも url('mypage') を指す。ChangeController・両twigを確認し homepage への戻り導線は不在。遷移先が設計と異なる実装違い。",
  "mismatchReason": "設計は 1-28/2-2 の戻る遷移先をECTOP画面(url('homepage'))と規定するが、両twigとも url('mypage') を指す。ChangeController・両twigを確認し homepage への戻り導線は不在。遷移先が設計と異なる実装違い。",
  "comparisonRows": [
    {
      "item": "1-28 戻る 遷移先",
      "design": "ECTOP画面 (url('homepage'))",
      "implementation": "url('mypage')",
      "mismatch": "マイページTOPへ遷移しECTOPへ遷移しない"
    },
    {
      "item": "2-2 完了画面 戻る 遷移先",
      "design": "ECTOP画面 (url('homepage'))",
      "implementation": "url('mypage')",
      "mismatch": "マイページTOPへ遷移しECTOPへ遷移しない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-18_0306_sheet-15_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/change.twig:700 ; src/Eccube/Resource/template/default/Mypage/change_complete.twig:48",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「1-28『戻る』ボタン・完了画面 2-2『戻る』は押下するとECTOP画面（本店ECTOP＝url('homepage')）へ遷移する。」。実装は「change.twig:700 の戻るリンクは href=url('mypage')、change_complete.twig:48 の back_to_mypage も href=url('mypage') で、いずれもマイページTOPへ遷移する。ECTOP(homepage) への戻り導線は存在しない。」。乖離理由は「設計は 1-28/2-2 の戻る遷移先をECTOP画面(url('homepage'))と規定するが、両twigとも url('mypage') を指す。ChangeController・両twigを確認し homepage への戻り導線は不在。遷移先が設計と異なる実装違い。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4925\n4922:       </section>\n4923:       <!-- function-design-embed:end f06-17-f06-17_front_member_mypage_event_deck_complete -->\n4924: </section>\n4925:       <section class=\"sheet-panel\" id=\"sheet-15\">\n4926:         <div class=\"sheet-heading\">\n4927:           <h2>会員情報変更</h2>\n4928:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/change.twig:700",
    "src/Eccube/Resource/template/default/Mypage/change_complete.twig:48",
    "src/Eccube/Resource/template/default/Mypage/change.twig",
    "src/Eccube/Resource/template/default/Mypage/change_complete.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/change.twig:700\n697:                                 <span>{{ 'common.change_do'|trans }}</span>\n698:                                 <i class=\"icon-hareruya-arrow-right c-hareruya-icon--xs\" aria-hidden=\"true\"></i>\n699:                             </button>\n700:                             <a class=\"c-hareruya-btn c-hareruya-btn--lg\" href=\"{{ url('mypage') }}\">{{ 'common.back'|trans }}</a>\n701:                         </div>\n702:                     </div>\n703:                 </form>",
    "src/Eccube/Resource/template/default/Mypage/change_complete.twig:48\n45:                 <p class=\"p-hareruya-entry-complete__message-text\">{{ 'front.mypage.change_complete.message_line2'|trans }}</p>\n46:             </div>\n47:             <div class=\"p-hareruya-entry-complete__actions\">\n48:                 <a class=\"c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full\" href=\"{{ url('mypage') }}\">{{ 'front.mypage.button.back_to_mypage'|trans }}</a>\n49:             </div>\n50:         </div>\n51:     </div>",
    "src/Eccube/Resource/template/default/Mypage/change.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
