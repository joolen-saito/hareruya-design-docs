# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-6_sheet.json#f04-03_0304_sheet-6_sheet-conformance-c95aecfc90e2`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-6_sheet.json`
- sourceFindingId: `f04-03_0304_sheet-6_sheet-conformance-c95aecfc90e2`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-03_0304_sheet-6_sheet` / F04-03 配送先の新規登録_確認
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として国の項目にエラーを付与し編集画面を再表示する。エラー文言『The combination of country and region is incorrect.』（キー form.country.error.invalid）を国の項目直下に表示する。
- implementationActual: 国と都道府県の不整合を検出して国にエラーを付与する検証が存在しない。CustomerAddressType.php:160-181 の POST_SUBMIT は郵便番号必須チェックと、国が海外の場合に pref を PREF_ABROAD(48) へ強制設定する片方向の是正のみで、国=日本かつ都道府県=国外 の逆方向の不整合は検出しない。PrefType.php:24-55 はフィルタ無しで全 Pref（国外 id48 含む）を選択肢に出す。翻訳キー form.count…
- mismatchReason: 設計が指定する利用者向けの国・都道府県整合バリデーションエラー（国項目直下の指定文言表示）が実装に存在しない。国=日本＋都道府県=国外 の不整合入力が PrefType（フィルタ無し）で構造的に可能であり、CustomerAddressType の POST_SUBMIT や ShippingType にも整合検証が無く、メッセージキー form.country.error.invalid・文言も messages.ja.yaml/en.yaml に不在。海外時の pref…
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-6（フロント挙動 国・都道府県の連動／業務ルール 国と都道府県の整合／エラー・警告インライン form.country.error.invalid／エラー処理 国と都道府県の不整合）
- implRef: 不在。探索: src/Eccube/Form/Type/Front/CustomerAddressType.php:145-181(POST_SUBMIT), src/Eccube/Form/Type/Front/EntryType.php:197-231, src/Eccube/Form/Type/Shopping/ShippingType.php, src/Eccube/Form/Type/AddressType.php, src/Eccube/Form/Type/Ma…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-03_0304_sheet-6_sheet-conformance-c95aecfc90e2",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-6",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-6（フロント挙動 国・都道府県の連動／業務ルール 国と都道府県の整合／エラー・警告インライン form.country.error.invalid／エラー処理 国と都道府県の不整合）",
  "designExpectation": "国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として国の項目にエラーを付与し編集画面を再表示する。エラー文言『The combination of country and region is incorrect.』（キー form.country.error.invalid）を国の項目直下に表示する。",
  "designQuote": "国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として国の項目にエラーを付与し編集画面を再表示する。エラー文言『The combination of country and region is incorrect.』（キー form.country.error.invalid）を国の項目直下に表示する。",
  "implRef": "不在。探索: src/Eccube/Form/Type/Front/CustomerAddressType.php:145-181(POST_SUBMIT), src/Eccube/Form/Type/Front/EntryType.php:197-231, src/Eccube/Form/Type/Shopping/ShippingType.php, src/Eccube/Form/Type/AddressType.php, src/Eccube/Form/Type/Master/PrefType.php:24-55, src/Eccube/Resource/locale/messages.ja.yaml, src/Eccube/Resource/locale/messages.en.yaml, validators.*.yaml",
  "implementationActual": "国と都道府県の不整合を検出して国にエラーを付与する検証が存在しない。CustomerAddressType.php:160-181 の POST_SUBMIT は郵便番号必須チェックと、国が海外の場合に pref を PREF_ABROAD(48) へ強制設定する片方向の是正のみで、国=日本かつ都道府県=国外 の逆方向の不整合は検出しない。PrefType.php:24-55 はフィルタ無しで全 Pref（国外 id48 含む）を選択肢に出す。翻訳キー form.country.error.invalid および文言『The combination of country and region is incorrect.』はロケール・フォーム双方に存在せず、国項目への addError も src 全域に無い。",
  "difference": "設計が指定する利用者向けの国・都道府県整合バリデーションエラー（国項目直下の指定文言表示）が実装に存在しない。国=日本＋都道府県=国外 の不整合入力が PrefType（フィルタ無し）で構造的に可能であり、CustomerAddressType の POST_SUBMIT や ShippingType にも整合検証が無く、メッセージキー form.country.error.invalid・文言も messages.ja.yaml/en.yaml に不在。海外時の pref 強制上書き(CustomerAddressType.php:179)は片方向是正に過ぎず、設計の『国にエラーを付与』とは挙動が異なる。反証で実装不在を再確認済み。",
  "mismatchReason": "設計が指定する利用者向けの国・都道府県整合バリデーションエラー（国項目直下の指定文言表示）が実装に存在しない。国=日本＋都道府県=国外 の不整合入力が PrefType（フィルタ無し）で構造的に可能であり、CustomerAddressType の POST_SUBMIT や ShippingType にも整合検証が無く、メッセージキー form.country.error.invalid・文言も messages.ja.yaml/en.yaml に不在。海外時の pref 強制上書き(CustomerAddre…",
  "comparisonRows": [
    {
      "item": "国=日本＋都道府県=国外 の不整合検出",
      "design": "不整合として国項目にエラーを付与し編集画面再表示",
      "implementation": "検出処理なし（POST_SUBMIT に該当検証なし、PrefType もフィルタ無し）",
      "mismatch": "逆方向の整合バリデーションが未実装"
    },
    {
      "item": "エラー文言/キー",
      "design": "『The combination of country and region is incorrect.』 / form.country.error.invalid",
      "implementation": "messages.ja.yaml・messages.en.yaml・validators.*.yaml のいずれにも該当キー・文言なし",
      "mismatch": "翻訳キー・文言が不在"
    },
    {
      "item": "国以外→日本以外時の pref 是正",
      "design": "不整合として国にエラー付与",
      "implementation": "CustomerAddressType.php:179 で pref を PREF_ABROAD へ強制上書き（エラー付与せず補正）",
      "mismatch": "片方向補正のみで設計のエラー提示挙動と異なる"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-03_0304_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在。探索: src/Eccube/Form/Type/Front/CustomerAddressType.php:145-181(POST_SUBMIT), src/Eccube/Form/Type/Front/EntryType.php:197-231, src/Eccube/Form/Type/Shopping/ShippingType.php, src/Eccube/Form/Type/AddressType.php, src/Eccube/Form/Type/Master/PrefType.php:24-55, src/Eccube/Resource/locale/messages.ja.yaml, src/Eccube/Resource/locale/messages.en.yaml, validators.*.yaml",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「国が日本で都道府県が国外、または国が日本以外で都道府県が国外でない場合は不整合として国の項目にエラーを付与し編集画面を再表示する。エラー文言『The combination of country and region is incorrect.』（キー form.country.error.invalid）を国の項目直下に表示する。」。実装は「国と都道府県の不整合を検出して国にエラーを付与する検証が存在しない。CustomerAddressType.php:160-181 の POST_SUBMIT は郵便番号必須チェックと、国が海外の場合に pref を PREF_ABROAD(48) へ強制設定する片方向の是正のみで、国=日本かつ都道府県=国外 の逆方向の不整合は検出しない。PrefType.php:24-55 はフィルタ無しで全 Pref（国外 id48 含む）を選択肢に出す。翻訳キー form.country.error.invalid および…」。乖離理由は「設計が指定する利用者向けの国・都道府県整合バリデーションエラー（国項目直下の指定文言表示）が実装に存在しない。国=日本＋都道府県=国外 の不整合入力が PrefType（フィルタ無し）で構造的に可能であり、CustomerAddressType の POST_SUBMIT や ShippingType にも整合検証が無く、メッセージキー form.country.error.invalid・文言も messages.ja.yaml/en.yaml に不在。海外時の pref 強制上書き(CustomerAddre…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Form・入力項目",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2143\n2140:       </section>\n2141:       <!-- function-design-embed:end f04-03-f04-03_front_cart_shopping_delivery_edit -->\n2142: </section>\n2143:       <section class=\"sheet-panel\" id=\"sheet-6\">\n2144:         <div class=\"sheet-heading\">\n2145:           <h2>配送先の新規登録_確認</h2>\n2146:         </div>",
  "implementationRefs": [
    "src/Eccube/Form/Type/Front/CustomerAddressType.php:145-181",
    "src/Eccube/Form/Type/Front/EntryType.php:197-231",
    "src/Eccube/Form/Type/Master/PrefType.php:24-55",
    "src/Eccube/Form/Type/Front/CustomerAddressType.php",
    "src/Eccube/Form/Type/Front/EntryType.php",
    "src/Eccube/Form/Type/Shopping/ShippingType.php",
    "src/Eccube/Form/Type/AddressType.php",
    "src/Eccube/Form/Type/Master/PrefType.php",
    "src/Eccube/Resource/locale/messages.ja.yaml",
    "src/Eccube/Resource/locale/messages.en.yaml"
  ],
  "implementationSnippets": [
    "src/Eccube/Form/Type/Front/CustomerAddressType.php:145\n142:             }\n143:         });\n144: \n145:         $builder->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event): void {\n146:             $form = $event->getForm();\n147:             /** @var CustomerAddress $CustomerAddress */\n148:             $CustomerAddress = $event->getData();",
    "src/Eccube/Form/Type/Front/EntryType.php:197\n194:                 $form['email']['first']->addError(new FormError(trans('form_error.customer_already_exists')));\n195:             }\n196: \n197:             if ($Customer->getCountry() === null || $Customer->getCountry()->isJapan()) {\n198:                 if (empty($form->get('postalCode')->get('postalCode01')->getData()) || empty($form->get('postalCode')->get('postalCode02')->getData())) {\n199:                     $form->get('postalCode')->addError(new FormError(trans('front.entry.error.postal_code_required')));\n200:                 }",
    "src/Eccube/Form/Type/Master/PrefType.php:24\n21: /**\n22:  * Class PrefType\n23:  */\n24: class PrefType extends AbstractType\n25: {\n26:     /**\n27:      * {@inheritdoc}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
