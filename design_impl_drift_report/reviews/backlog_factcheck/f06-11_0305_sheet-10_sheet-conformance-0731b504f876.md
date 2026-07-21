# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-11_0305_sheet-10_sheet.json#f06-11_0305_sheet-10_sheet-conformance-0731b504f876`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-11_0305_sheet-10_sheet.json`
- sourceFindingId: `f06-11_0305_sheet-10_sheet-conformance-0731b504f876`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-11_0305_sheet-10_sheet` / F06-11 買取履歴一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 処理状態を状態別の『画像』で表示する。マッピング後6状態（受付完了/査定中/査定完了/振込待ち/買取完了/キャンセル）に対応する状態画像を一覧の各行に表示する。
- implementationActual: 一覧Twigは処理状態を <img> ではなく <span class="c-hareruya-label--status c-hareruya-label--status-{completed|cancelled|pending}">{{ row.statusIconAlt }}</span> の色付きテキストラベルで表示し、状態画像を描画しない。CSSモディファイアは3種のみ。StatusMapper::resolveStatusIcon()(StatusMapper.…
- mismatchReason: 設計は処理状態を状態別『画像』表示と一貫して明記（識別ID10=画像、リバース節も状態画像）。実装は一覧では画像を一切描画せず色付きテキストラベル(3配色)に置換。状態画像アセット・パス算出・詳細画面のimg描画は存在するのに一覧側のみ画像描画が欠落。purchase_history.twig / StatusMapper.php / RowBuilder.php を確認し一覧側に画像描画が存在しないことを確認済み。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-10（画面部品説明 識別ID10『処理状態＝画像』／カスタマイズ『処理状態の画像を変更する』『紐付けシート参照』／リバース詳細設計『処理状態は状態識別子に対応する画像で示す』）
- implRef: src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147（特に144）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-11_0305_sheet-10_sheet-conformance-0731b504f876",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-10",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-10（画面部品説明 識別ID10『処理状態＝画像』／カスタマイズ『処理状態の画像を変更する』『紐付けシート参照』／リバース詳細設計『処理状態は状態識別子に対応する画像で示す』）",
  "designExpectation": "処理状態を状態別の『画像』で表示する。マッピング後6状態（受付完了/査定中/査定完了/振込待ち/買取完了/キャンセル）に対応する状態画像を一覧の各行に表示する。",
  "designQuote": "処理状態を状態別の『画像』で表示する。マッピング後6状態（受付完了/査定中/査定完了/振込待ち/買取完了/キャンセル）に対応する状態画像を一覧の各行に表示する。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147（特に144）",
  "implementationActual": "一覧Twigは処理状態を <img> ではなく <span class=\"c-hareruya-label--status c-hareruya-label--status-{completed|cancelled|pending}\">{{ row.statusIconAlt }}</span> の色付きテキストラベルで表示し、状態画像を描画しない。CSSモディファイアは3種のみ。StatusMapper::resolveStatusIcon()(StatusMapper.php:95-127)が6状態の iconPath(assets/img/mypage/*.svg)を返し RowBuilder(RowBuilder.php:104,144)が DTO statusIconPath に詰めるが一覧Twigは statusIconPath を参照しない（死にコード）。詳細画面(purchase_history_detail_net.twig:46-49, _otc.twig:24-27)は d.statusIconPath を <img> 描画する。",
  "difference": "設計は処理状態を状態別『画像』表示と一貫して明記（識別ID10=画像、リバース節も状態画像）。実装は一覧では画像を一切描画せず色付きテキストラベル(3配色)に置換。状態画像アセット・パス算出・詳細画面のimg描画は存在するのに一覧側のみ画像描画が欠落。purchase_history.twig / StatusMapper.php / RowBuilder.php を確認し一覧側に画像描画が存在しないことを確認済み。",
  "mismatchReason": "設計は処理状態を状態別『画像』表示と一貫して明記（識別ID10=画像、リバース節も状態画像）。実装は一覧では画像を一切描画せず色付きテキストラベル(3配色)に置換。状態画像アセット・パス算出・詳細画面のimg描画は存在するのに一覧側のみ画像描画が欠落。purchase_history.twig / StatusMapper.php / RowBuilder.php を確認し一覧側に画像描画が存在しないことを確認済み。",
  "comparisonRows": [
    {
      "item": "処理状態の表示形式",
      "design": "状態別の画像(<img> assets/img/mypage/*.svg 6種)",
      "implementation": "色付きテキストラベル <span class=\"c-hareruya-label--status-*\"> にstatusIconAltを描画",
      "mismatch": "一覧で画像を描画せずテキストラベルに置換（statusIconPathは死にコード）"
    },
    {
      "item": "状態別バリエーション数",
      "design": "6状態それぞれに対応する画像",
      "implementation": "CSSモディファイアはcompleted/cancelled/pendingの3種のみ",
      "mismatch": "6状態→3配色に集約され状態別画像が失われる"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-11_0305_sheet-10_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147（特に144）",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「処理状態を状態別の『画像』で表示する。マッピング後6状態（受付完了/査定中/査定完了/振込待ち/買取完了/キャンセル）に対応する状態画像を一覧の各行に表示する。」。実装は「一覧Twigは処理状態を <img> ではなく <span class=\"c-hareruya-label--status c-hareruya-label--status-{completed|cancelled|pending}\">{{ row.statusIconAlt }}</span> の色付きテキストラベルで表示し、状態画像を描画しない。CSSモディファイアは3種のみ。StatusMapper::resolveStatusIcon()(StatusMapper.php:95-127)が6状態の ico…」。乖離理由は「設計は処理状態を状態別『画像』表示と一貫して明記（識別ID10=画像、リバース節も状態画像）。実装は一覧では画像を一切描画せず色付きテキストラベル(3配色)に置換。状態画像アセット・パス算出・詳細画面のimg描画は存在するのに一覧側のみ画像描画が欠落。purchase_history.twig / StatusMapper.php / RowBuilder.php を確認し一覧側に画像描画が存在しないことを確認済み。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3255\n3252:       </section>\n3253:       <!-- function-design-embed:end f05-06-f05-06_front_online_purchase_buy_shopping_complete -->\n3254: </section>\n3255:       <section class=\"sheet-panel\" id=\"sheet-10\">\n3256:         <div class=\"sheet-heading\">\n3257:           <h2>買取履歴一覧</h2>\n3258:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147",
    "src/Eccube/Resource/template/default/Mypage/purchase_history.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133\n130:                                         {% endif %}\n131:                                     </dd>\n132:                                 </div>\n133:                                 <div class=\"p-hareruya-history-list__order-info-row\">\n134:                                     <dt>{{ 'front.mypage.purchase_history.col.status'|trans }}</dt>\n135:                                     <dd>\n136:                                         {% if row.mappedStatus is not empty %}",
    "src/Eccube/Resource/template/default/Mypage/purchase_history.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
