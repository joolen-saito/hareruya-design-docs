# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json#f06-17_0306_sheet-14_sheet-conformance-3036c065c8ff`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json`
- sourceFindingId: `f06-17_0306_sheet-14_sheet-conformance-3036c065c8ff`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-17_0306_sheet-14_sheet` / F06-17 大会デッキ登録確認～完了
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 更新確定(update)でメイン・サイドのカードリストを解析し、書式エラー（解析結果が整数のエラーコード）があれば入力テキストとエラー内容をセッションに保持してデッキ編集画面(edit)へリダイレクトし、デッキは保存しない。編集画面表示時にセッションから入力/エラーを復元する。
- implementationActual: entry() はトークン検証・選手/イベント詳細/フォーマット確認後、deckMain/deckSide を生文字列のまま DeckEntryInput に詰めて handle() を呼び無条件に persist/flush で即保存し、メール送信後 check へリダイレクト。カードリスト解析・書式エラー判定・セッション保存・edit へのリダイレクト・保存中止のいずれも無い。edit(index) 側にもセッションからの入力/エラー復元処理が無い。 設計要求に対応する…
- mismatchReason: 設計は書式エラー時『保存せず入力保持でデッキ編集画面へ戻す』を利用者可視の中核挙動として複数の機能節（処理フロー・画面遷移・エラー処理・セッション・エッジケース）で明記するが、実装の更新確定フローには解析・エラー分岐・セッション保存・edit リダイレクトが全く無く、書式不正入力でもデッキが保存され完了画面へ遷移する。『実装詳細は要確認』のハッジはDB永続化詳細を対象とする文脈であり、書式エラー時の遷移・入力保持という機能挙動要求はハッジ対象外。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14（処理フロー『メイン・サイドのカードリストを解析する。書式エラー…セッションに保持し、デッキ編集画面へリダイレクトする。デッキは保存しない。』／画面遷移『更新時に書式エラー→デッキ編集画面へリダイレクト（入力保持）』／セッション節／エラー処理節／エッジケース節）
- implRef: src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99-154（entry）／src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83（handle）／DeckEntryController.php:51-93（edit index）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-17_0306_sheet-14_sheet-conformance-3036c065c8ff",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14（処理フロー『メイン・サイドのカードリストを解析する。書式エラー…セッションに保持し、デッキ編集画面へリダイレクトする。デッキは保存しない。』／画面遷移『更新時に書式エラー→デッキ編集画面へリダイレクト（入力保持）』／セッション節／エラー処理節／エッジケース節）",
  "designExpectation": "更新確定(update)でメイン・サイドのカードリストを解析し、書式エラー（解析結果が整数のエラーコード）があれば入力テキストとエラー内容をセッションに保持してデッキ編集画面(edit)へリダイレクトし、デッキは保存しない。編集画面表示時にセッションから入力/エラーを復元する。",
  "designQuote": "更新確定(update)でメイン・サイドのカードリストを解析し、書式エラー（解析結果が整数のエラーコード）があれば入力テキストとエラー内容をセッションに保持してデッキ編集画面(edit)へリダイレクトし、デッキは保存しない。編集画面表示時にセッションから入力/エラーを復元する。",
  "implRef": "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99-154（entry）／src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83（handle）／DeckEntryController.php:51-93（edit index）",
  "implementationActual": "entry() はトークン検証・選手/イベント詳細/フォーマット確認後、deckMain/deckSide を生文字列のまま DeckEntryInput に詰めて handle() を呼び無条件に persist/flush で即保存し、メール送信後 check へリダイレクト。カードリスト解析・書式エラー判定・セッション保存・edit へのリダイレクト・保存中止のいずれも無い。edit(index) 側にもセッションからの入力/エラー復元処理が無い。 設計要求に対応する実装が見当たらない（未実装）。",
  "difference": "設計は書式エラー時『保存せず入力保持でデッキ編集画面へ戻す』を利用者可視の中核挙動として複数の機能節（処理フロー・画面遷移・エラー処理・セッション・エッジケース）で明記するが、実装の更新確定フローには解析・エラー分岐・セッション保存・edit リダイレクトが全く無く、書式不正入力でもデッキが保存され完了画面へ遷移する。『実装詳細は要確認』のハッジはDB永続化詳細を対象とする文脈であり、書式エラー時の遷移・入力保持という機能挙動要求はハッジ対象外。",
  "mismatchReason": "設計は書式エラー時『保存せず入力保持でデッキ編集画面へ戻す』を利用者可視の中核挙動として複数の機能節（処理フロー・画面遷移・エラー処理・セッション・エッジケース）で明記するが、実装の更新確定フローには解析・エラー分岐・セッション保存・edit リダイレクトが全く無く、書式不正入力でもデッキが保存され完了画面へ遷移する。『実装詳細は要確認』のハッジはDB永続化詳細を対象とする文脈であり、書式エラー時の遷移・入力保持という機能挙動要求はハッジ対象外。",
  "comparisonRows": [
    {
      "item": "書式エラー時の保存可否",
      "design": "保存しない（デッキは保存しない）",
      "implementation": "無条件に persist/flush で保存",
      "mismatch": "未実装（保存中止なし）"
    },
    {
      "item": "書式エラー時の遷移",
      "design": "デッキ編集画面(edit)へリダイレクト（入力保持）",
      "implementation": "常に完了画面(check)へリダイレクト",
      "mismatch": "未実装（edit リダイレクトなし）"
    },
    {
      "item": "入力/エラーのセッション保持・復元",
      "design": "セッションに保持し編集画面で復元・消去",
      "implementation": "セッション保存も復元も無し",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-17_0306_sheet-14_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99-154（entry）／src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83（handle）／DeckEntryController.php:51-93（edit index）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「更新確定(update)でメイン・サイドのカードリストを解析し、書式エラー（解析結果が整数のエラーコード）があれば入力テキストとエラー内容をセッションに保持してデッキ編集画面(edit)へリダイレクトし、デッキは保存しない。編集画面表示時にセッションから入力/エラーを復元する。」。実装は「entry() はトークン検証・選手/イベント詳細/フォーマット確認後、deckMain/deckSide を生文字列のまま DeckEntryInput に詰めて handle() を呼び無条件に persist/flush で即保存し、メール送信後 check へリダイレクト。カードリスト解析・書式エラー判定・セッション保存・edit へのリダイレクト・保存中止のいずれも無い。edit(index) 側にもセッションからの入力/エラー復元処理が無い。 設計要求に対応する実装が見当たらない（未実装）。」。乖離理由は「設計は書式エラー時『保存せず入力保持でデッキ編集画面へ戻す』を利用者可視の中核挙動として複数の機能節（処理フロー・画面遷移・エラー処理・セッション・エッジケース）で明記するが、実装の更新確定フローには解析・エラー分岐・セッション保存・edit リダイレクトが全く無く、書式不正入力でもデッキが保存され完了画面へ遷移する。『実装詳細は要確認』のハッジはDB永続化詳細を対象とする文脈であり、書式エラー時の遷移・入力保持という機能挙動要求はハッジ対象外。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "入出力・列定義・副作用未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Form・入力項目",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4650\n4647:       </section>\n4648:       <!-- function-design-embed:end f06-16-f06-16_front_member_mypage_event_deck_edit -->\n4649: </section>\n4650:       <section class=\"sheet-panel\" id=\"sheet-14\">\n4651:         <div class=\"sheet-heading\">\n4652:           <h2>大会デッキ登録確認～完了</h2>\n4653:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99-154",
    "src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37-83",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php",
    "src/Eccube/Service/Front/Mypage/DeckEntryAction.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:99\n96:      * @throws \\Exception\n97:      */\n98:     #[Route(path: '/deckentry/{eventDetailId}/update', name: 'mypage_deckentry_update', requirements: ['eventDetailId' => '\\d+'], methods: ['POST'])]\n99:     public function entry(Request $request, int $eventDetailId): RedirectResponse\n100:     {\n101:         $this->isTokenValid();\n102: ",
    "src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37\n34:     /**\n35:      * @throws \\Exception\n36:      */\n37:     public function handle(DeckEntryInput $input): DtbDeck\n38:     {\n39:         $now = new \\DateTime();\n40: ",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:35\n32: use Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException;\n33: use Symfony\\Component\\Routing\\Attribute\\Route;\n34: \n35: class DeckEntryController extends AbstractController\n36: {\n37:     public function __construct(\n38:         private readonly DtbEventDetailRepository $eventDetailRepository,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
