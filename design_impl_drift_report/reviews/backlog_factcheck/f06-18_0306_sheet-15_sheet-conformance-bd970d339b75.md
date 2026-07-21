# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-bd970d339b75`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json`
- sourceFindingId: `f06-18_0306_sheet-15_sheet-conformance-bd970d339b75`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-18_0306_sheet-15_sheet` / F06-18 会員情報変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 国と都道府県の組み合わせが不正（国が日本かつ都道府県が海外、または国が海外かつ都道府県が国内）のとき、フォーム送信後の検証で更新せず国の項目直下に組み合わせ不整合エラーを表示する。
- implementationActual: 海外(非Japan)時は pref を Pref::PREF_ABROAD へ強制上書き(EntryType.php:205)、日本時は pref===null の必須チェックのみ。国=日本かつ都道府県=国外／国=海外かつ都道府県=国内の組み合わせを拒否せず、国欄へ不整合エラーを付与する処理が無い。
- mismatchReason: 設計は国・都道府県の不整合を送信後検証で拒否し国欄にエラーを表示すると規定するが、実装は海外→PREF_ABROAD強制・日本→null判定のみで組み合わせ整合検証・国欄エラー付与を行わない。ChangeController・EntryType・AddressType を確認したが該当検証は不在。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (表示メッセージ『国と都道府県の組み合わせが不正である旨のエラー…国の項目直下…国にエラーを付す』／エラー処理『国・都道府県の不整合→国にエラーを付し再描画』)
- implRef: src/Eccube/Form/Type/Front/EntryType.php:197-207,219-231 (不在)

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-18_0306_sheet-15_sheet-conformance-bd970d339b75",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (表示メッセージ『国と都道府県の組み合わせが不正である旨のエラー…国の項目直下…国にエラーを付す』／エラー処理『国・都道府県の不整合→国にエラーを付し再描画』)",
  "designExpectation": "国と都道府県の組み合わせが不正（国が日本かつ都道府県が海外、または国が海外かつ都道府県が国内）のとき、フォーム送信後の検証で更新せず国の項目直下に組み合わせ不整合エラーを表示する。",
  "designQuote": "国と都道府県の組み合わせが不正（国が日本かつ都道府県が海外、または国が海外かつ都道府県が国内）のとき、フォーム送信後の検証で更新せず国の項目直下に組み合わせ不整合エラーを表示する。",
  "implRef": "src/Eccube/Form/Type/Front/EntryType.php:197-207,219-231 (不在)",
  "implementationActual": "海外(非Japan)時は pref を Pref::PREF_ABROAD へ強制上書き(EntryType.php:205)、日本時は pref===null の必須チェックのみ。国=日本かつ都道府県=国外／国=海外かつ都道府県=国内の組み合わせを拒否せず、国欄へ不整合エラーを付与する処理が無い。",
  "difference": "設計は国・都道府県の不整合を送信後検証で拒否し国欄にエラーを表示すると規定するが、実装は海外→PREF_ABROAD強制・日本→null判定のみで組み合わせ整合検証・国欄エラー付与を行わない。ChangeController・EntryType・AddressType を確認したが該当検証は不在。",
  "mismatchReason": "設計は国・都道府県の不整合を送信後検証で拒否し国欄にエラーを表示すると規定するが、実装は海外→PREF_ABROAD強制・日本→null判定のみで組み合わせ整合検証・国欄エラー付与を行わない。ChangeController・EntryType・AddressType を確認したが該当検証は不在。",
  "comparisonRows": [
    {
      "item": "国・都道府県の組み合わせ整合検証",
      "design": "不整合を送信後検証で拒否し国欄にエラー",
      "implementation": "海外はPREF_ABROAD強制/日本はnull判定のみ",
      "mismatch": "組み合わせ不整合の検証・国欄エラー付与が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-18_0306_sheet-15_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Form/Type/Front/EntryType.php:197-207,219-231 (不在)",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「国と都道府県の組み合わせが不正（国が日本かつ都道府県が海外、または国が海外かつ都道府県が国内）のとき、フォーム送信後の検証で更新せず国の項目直下に組み合わせ不整合エラーを表示する。」。実装は「海外(非Japan)時は pref を Pref::PREF_ABROAD へ強制上書き(EntryType.php:205)、日本時は pref===null の必須チェックのみ。国=日本かつ都道府県=国外／国=海外かつ都道府県=国内の組み合わせを拒否せず、国欄へ不整合エラーを付与する処理が無い。」。乖離理由は「設計は国・都道府県の不整合を送信後検証で拒否し国欄にエラーを表示すると規定するが、実装は海外→PREF_ABROAD強制・日本→null判定のみで組み合わせ整合検証・国欄エラー付与を行わない。ChangeController・EntryType・AddressType を確認したが該当検証は不在。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Form・入力項目",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4925\n4922:       </section>\n4923:       <!-- function-design-embed:end f06-17-f06-17_front_member_mypage_event_deck_complete -->\n4924: </section>\n4925:       <section class=\"sheet-panel\" id=\"sheet-15\">\n4926:         <div class=\"sheet-heading\">\n4927:           <h2>会員情報変更</h2>\n4928:         </div>",
  "implementationRefs": [
    "src/Eccube/Form/Type/Front/EntryType.php:197-207,219",
    "src/Eccube/Form/Type/Front/EntryType.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Form/Type/Front/EntryType.php:197\n194:                 $form['email']['first']->addError(new FormError(trans('form_error.customer_already_exists')));\n195:             }\n196: \n197:             if ($Customer->getCountry() === null || $Customer->getCountry()->isJapan()) {\n198:                 if (empty($form->get('postalCode')->get('postalCode01')->getData()) || empty($form->get('postalCode')->get('postalCode02')->getData())) {\n199:                     $form->get('postalCode')->addError(new FormError(trans('front.entry.error.postal_code_required')));\n200:                 }",
    "src/Eccube/Form/Type/Front/EntryType.php:45\n42: use Symfony\\Component\\OptionsResolver\\OptionsResolver;\n43: use Symfony\\Component\\Validator\\Constraints as Assert;\n44: \n45: class EntryType extends AbstractType\n46: {\n47:     /**\n48:      * EntryType constructor."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
