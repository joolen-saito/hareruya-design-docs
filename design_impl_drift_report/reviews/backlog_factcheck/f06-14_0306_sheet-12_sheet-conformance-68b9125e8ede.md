# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json#f06-14_0306_sheet-12_sheet-conformance-68b9125e8ede`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json`
- sourceFindingId: `f06-14_0306_sheet-12_sheet-conformance-68b9125e8ede`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-14_0306_sheet-12_sheet` / F06-14 マイイベント・デッキ登録
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 開催日の23:59:59を過ぎたイベントは処理状態に「イベント終了」と表示する。
- implementationActual: hasFinished() は `return $this->startDate < new \DateTime();` で、開催開始日時(start_date)を過ぎた瞬間に true → 処理状態が『イベント終了』になる。
- mismatchReason: 設計は開催日当日の終端(23:59:59)を基準とするが、実装は開催開始日時そのものを基準にしている。開催当日で開始時刻経過後（例:10:00開始を当日12:00閲覧）は設計上まだ終了表示すべきでないのにイベント終了となる。開催日終端やend_date基準の終了判定は他に存在しない。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12 機能仕様
- implRef: src/Eccube/Entity/DtbEventDetail.php:554-556 hasFinished(); 呼び出し src/Eccube/Resource/template/default/Mypage/event_history.twig:95,118-119

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-14_0306_sheet-12_sheet-conformance-68b9125e8ede",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12 機能仕様",
  "designExpectation": "開催日の23:59:59を過ぎたイベントは処理状態に「イベント終了」と表示する。",
  "designQuote": "開催日の23:59:59を過ぎたイベントは処理状態に「イベント終了」と表示する。",
  "implRef": "src/Eccube/Entity/DtbEventDetail.php:554-556 hasFinished(); 呼び出し src/Eccube/Resource/template/default/Mypage/event_history.twig:95,118-119",
  "implementationActual": "hasFinished() は `return $this->startDate < new \\DateTime();` で、開催開始日時(start_date)を過ぎた瞬間に true → 処理状態が『イベント終了』になる。",
  "difference": "設計は開催日当日の終端(23:59:59)を基準とするが、実装は開催開始日時そのものを基準にしている。開催当日で開始時刻経過後（例:10:00開始を当日12:00閲覧）は設計上まだ終了表示すべきでないのにイベント終了となる。開催日終端やend_date基準の終了判定は他に存在しない。",
  "mismatchReason": "設計は開催日当日の終端(23:59:59)を基準とするが、実装は開催開始日時そのものを基準にしている。開催当日で開始時刻経過後（例:10:00開始を当日12:00閲覧）は設計上まだ終了表示すべきでないのにイベント終了となる。開催日終端やend_date基準の終了判定は他に存在しない。",
  "comparisonRows": [
    {
      "item": "イベント終了判定の基準",
      "design": "開催日の23:59:59を過ぎたら終了",
      "implementation": "start_date（開催開始日時）を過ぎたら終了",
      "mismatch": "終了判定の時点が早まる"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-14_0306_sheet-12_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Entity/DtbEventDetail.php:554-556 hasFinished(); 呼び出し src/Eccube/Resource/template/default/Mypage/event_history.twig:95,118-119",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「開催日の23:59:59を過ぎたイベントは処理状態に「イベント終了」と表示する。」。実装は「hasFinished() は `return $this->startDate < new \\DateTime();` で、開催開始日時(start_date)を過ぎた瞬間に true → 処理状態が『イベント終了』になる。」。乖離理由は「設計は開催日当日の終端(23:59:59)を基準とするが、実装は開催開始日時そのものを基準にしている。開催当日で開始時刻経過後（例:10:00開始を当日12:00閲覧）は設計上まだ終了表示すべきでないのにイベント終了となる。開催日終端やend_date基準の終了判定は他に存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3940\n3937:       </section>\n3938:       <!-- function-design-embed:end f06-13-f06-13_front_member_mypage_online_identification -->\n3939: </section>\n3940:       <section class=\"sheet-panel\" id=\"sheet-12\">\n3941:         <div class=\"sheet-heading\">\n3942:           <h2>マイイベント・デッキ登録</h2>\n3943:         </div>",
  "implementationRefs": [
    "src/Eccube/Entity/DtbEventDetail.php:554-556",
    "src/Eccube/Resource/template/default/Mypage/event_history.twig:95,118",
    "src/Eccube/Entity/DtbEventDetail.php",
    "src/Eccube/Resource/template/default/Mypage/event_history.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Entity/DtbEventDetail.php:554\n551:     /**\n552:      * 終了済みのイベントか\n553:      */\n554:     public function hasFinished(): bool\n555:     {\n556:         return $this->startDate < new \\DateTime();\n557:     }",
    "src/Eccube/Resource/template/default/Mypage/event_history.twig:95\n92:                                 <dt class=\"p-hareruya-deckentry-list__card-label\">{{ 'front.mypage.event_history.label__deck'|trans }}</dt>\n93:                                 <dd class=\"p-hareruya-deckentry-list__card-value{{ deckId is null ? ' p-hareruya-deckentry-list__card-value--warning' : '' }}\">{{ deckId is not null ? 'front.mypage.event_history.deck__registered'|trans : 'front.mypage.event_history.deck__not_registered'|trans }}</dd>\n94:                             </div>\n95:                         </dl>\n96:                         <div class=\"p-hareruya-deckentry-list__card-action\">\n97:                             {% if not isFinished %}\n98:                                 <a class=\"c-hareruya-btn c-hareruya-btn--md{{ deckId is null ? ' c-hareruya-btn--primary' : '' }} p-hareruya-deckentry-list__card-btn\" href=\"{{ path('mypage_deckentry_edit', {'eventDetailId': detail.getId()}) }}\">{{ deckId is not null ? 'front.mypage.event_history.btn__deck_edit'|trans : 'front.mypage.event_history.btn__deck_register'|trans }}</a>",
    "src/Eccube/Entity/DtbEventDetail.php:31\n28: #[ORM\\Table(name: 'dtb_event_detail')]\n29: #[ORM\\HasLifecycleCallbacks]\n30: #[ORM\\Entity(repositoryClass: DtbEventDetailRepository::class)]\n31: class DtbEventDetail extends AbstractEntity\n32: {\n33:     // 申込可\n34:     public const JOINABLE = 1;"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
