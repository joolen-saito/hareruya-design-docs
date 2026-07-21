# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-01_0306_sheet-3_sheet.json#f06-01_0306_sheet-3_sheet-conformance-7b0d713f7402`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-01_0306_sheet-3_sheet.json`
- sourceFindingId: `f06-01_0306_sheet-3_sheet-conformance-7b0d713f7402`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-01_0306_sheet-3_sheet` / F06-01 新規会員登録
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 仮会員登録完了時にデッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）を登録する
- implementationActual: PlayerService::setNewDeckUserId は StringUtil::random で8桁を生成し do-while + findOneBy で既存チェックするが、DtbPlayer.php:114-115 の ORM Column に unique:true が無く、クラスレベルの UniqueConstraint も無く、app/DoctrineMigrations にユニークインデックスが存在しない。生成チェックから insert までに時間差が…
- mismatchReason: 設計は deck_user_id を『一意』と要求するが、実装は一意性をアプリ側ベストエフォート照合のみで担保し、DB制約もトランザクション直列化も無く重複可能性を実装自身が認めている。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-3 (仮会員登録完了 機能仕様: デッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）)
- implRef: src/Eccube/Service/PlayerService.php:28-46, src/Eccube/Entity/DtbPlayer.php:114-115

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-01_0306_sheet-3_sheet-conformance-7b0d713f7402",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-3",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-3 (仮会員登録完了 機能仕様: デッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）)",
  "designExpectation": "仮会員登録完了時にデッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）を登録する",
  "designQuote": "仮会員登録完了時にデッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）を登録する",
  "implRef": "src/Eccube/Service/PlayerService.php:28-46, src/Eccube/Entity/DtbPlayer.php:114-115",
  "implementationActual": "PlayerService::setNewDeckUserId は StringUtil::random で8桁を生成し do-while + findOneBy で既存チェックするが、DtbPlayer.php:114-115 の ORM Column に unique:true が無く、クラスレベルの UniqueConstraint も無く、app/DoctrineMigrations にユニークインデックスが存在しない。生成チェックから insert までに時間差があり並行登録で重複可能。PlayerService.php:28-31 の TODO コメント自身が『カラム自体にユニーク制約はついていない』『厳密には重複が発生する可能性がゼロではない』と明記。",
  "difference": "設計は deck_user_id を『一意』と要求するが、実装は一意性をアプリ側ベストエフォート照合のみで担保し、DB制約もトランザクション直列化も無く重複可能性を実装自身が認めている。",
  "mismatchReason": "設計は deck_user_id を『一意』と要求するが、実装は一意性をアプリ側ベストエフォート照合のみで担保し、DB制約もトランザクション直列化も無く重複可能性を実装自身が認めている。",
  "comparisonRows": [
    {
      "item": "deck_user_id 一意性担保",
      "design": "一意 (DBレベルで保証されるべき一意ID)",
      "implementation": "アプリ側 do-while + findOneBy のみ。DBユニーク制約/インデックス無し",
      "mismatch": "一意性の担保レベル不足(重複可能)"
    },
    {
      "item": "桁数/文字種",
      "design": "英数字8文字ランダム",
      "implementation": "StringUtil::random 8桁, DtbPlayer カラム length=8",
      "mismatch": "一致(差異なし)"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-01_0306_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Service/PlayerService.php:28-46, src/Eccube/Entity/DtbPlayer.php:114-115",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「仮会員登録完了時にデッキ登録用ユーザーID（英数字の8文字のランダム文字列で一意）を登録する」。実装は「PlayerService::setNewDeckUserId は StringUtil::random で8桁を生成し do-while + findOneBy で既存チェックするが、DtbPlayer.php:114-115 の ORM Column に unique:true が無く、クラスレベルの UniqueConstraint も無く、app/DoctrineMigrations にユニークインデックスが存在しない。生成チェックから insert までに時間差があり並行登録で重複可能。PlayerSe…」。乖離理由は「設計は deck_user_id を『一意』と要求するが、実装は一意性をアプリ側ベストエフォート照合のみで担保し、DB制約もトランザクション直列化も無く重複可能性を実装自身が認めている。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "DB・保存/更新処理未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:877\n874:           </div>\n875:         </div>\n876:       </section>\n877:       <section class=\"sheet-panel\" id=\"sheet-3\">\n878:         <div class=\"sheet-heading\">\n879:           <h2>新規会員登録</h2>\n880:         </div>",
  "implementationRefs": [
    "src/Eccube/Service/PlayerService.php:28-46",
    "src/Eccube/Entity/DtbPlayer.php:114-115",
    "src/Eccube/Service/PlayerService.php",
    "src/Eccube/Entity/DtbPlayer.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/PlayerService.php:28\n25:     {\n26:     }\n27: \n28:     // TODO: DeckUserIdについての懸念点あり\n29:     // ・カラム自体にユニーク制約はついていない\n30:     // ・カラムの文字数は8桁\n31:     // ・サービスクラスの中でユニークチェックを行っているが、実際にinsertが実行されるのは少し後のController内で行われるため、厳密には重複が発生する可能性がゼロではない",
    "src/Eccube/Entity/DtbPlayer.php:114\n111:     #[ORM\\Column(name: 'nickname', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'ニックネーム'])]\n112:     private ?string $nickname = null;\n113: \n114:     #[ORM\\Column(name: 'deck_user_id', type: Types::STRING, length: 8, nullable: true, options: ['comment' => 'デッキユーザーID'])]\n115:     private ?string $deckUserId = null;\n116: \n117:     #[ORM\\Column(name: 'profile', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'プロフィール'])]",
    "src/Eccube/Service/PlayerService.php:22\n19: use Eccube\\Repository\\DtbPlayerRepository;\n20: use Eccube\\Util\\StringUtil;\n21: \n22: class PlayerService\n23: {\n24:     public function __construct(private readonly DtbPlayerRepository $playerRepository)\n25:     {"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
