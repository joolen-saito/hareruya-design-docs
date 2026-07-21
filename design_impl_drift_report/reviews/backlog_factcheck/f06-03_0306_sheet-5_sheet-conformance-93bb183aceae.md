# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json#f06-03_0306_sheet-5_sheet-conformance-93bb183aceae`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json`
- sourceFindingId: `f06-03_0306_sheet-5_sheet-conformance-93bb183aceae`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-03_0306_sheet-5_sheet` / F06-03 ログイン
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 非準拠パスワードでもログイン自体は成功させ、セッションに『非準拠パスワード』フラグを立て、フラグが立つ間はログイン必須ページへアクセスさせず専用パスワード変更画面へ強制遷移、変更でフラグ解除する。
- implementationActual: LoginPasswordLengthCheckListener が CheckPassportEvent(priority256)で認証前に平文パスワード長を検査し、12桁未満なら CustomUserMessageAuthenticationException('error.customer_login.password_length_required')を投げてログイン自体を失敗させ、パスワード再発行へ誘導する。非準拠フラグのセッション設定・専用変更画面への強制遷移・…
- mismatchReason: 設計は『非準拠でもログイン成立→フラグ→専用変更画面へ強制遷移→変更で解除』。実装は『非準拠ならログインをブロックし再発行誘導』で、ログイン可否・遷移先・フラグ運用が根本的に異なる。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (機能仕様『★ECCUBE4系のポリシーに合わないパスワードについて』／sheet5抽出 L44-50)
- implRef: src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:42-56, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-03_0306_sheet-5_sheet-conformance-93bb183aceae",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (機能仕様『★ECCUBE4系のポリシーに合わないパスワードについて』／sheet5抽出 L44-50)",
  "designExpectation": "非準拠パスワードでもログイン自体は成功させ、セッションに『非準拠パスワード』フラグを立て、フラグが立つ間はログイン必須ページへアクセスさせず専用パスワード変更画面へ強制遷移、変更でフラグ解除する。",
  "designQuote": "非準拠パスワードでもログイン自体は成功させ、セッションに『非準拠パスワード』フラグを立て、フラグが立つ間はログイン必須ページへアクセスさせず専用パスワード変更画面へ強制遷移、変更でフラグ解除する。",
  "implRef": "src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:42-56, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
  "implementationActual": "LoginPasswordLengthCheckListener が CheckPassportEvent(priority256)で認証前に平文パスワード長を検査し、12桁未満なら CustomUserMessageAuthenticationException('error.customer_login.password_length_required')を投げてログイン自体を失敗させ、パスワード再発行へ誘導する。非準拠フラグのセッション設定・専用変更画面への強制遷移・フラグ解除処理は MypageController/EventListener/locale/Mypage配下Twig のいずれにも存在しない。",
  "difference": "設計は『非準拠でもログイン成立→フラグ→専用変更画面へ強制遷移→変更で解除』。実装は『非準拠ならログインをブロックし再発行誘導』で、ログイン可否・遷移先・フラグ運用が根本的に異なる。",
  "mismatchReason": "設計は『非準拠でもログイン成立→フラグ→専用変更画面へ強制遷移→変更で解除』。実装は『非準拠ならログインをブロックし再発行誘導』で、ログイン可否・遷移先・フラグ運用が根本的に異なる。",
  "comparisonRows": [
    {
      "item": "非準拠パスワード時のログイン可否",
      "design": "ログイン成功させる",
      "implementation": "認証前に例外を投げてログイン失敗",
      "mismatch": "可否が逆"
    },
    {
      "item": "非準拠フラグ(セッション)",
      "design": "セッションに非準拠フラグを立てる",
      "implementation": "フラグ設定処理なし",
      "mismatch": "未実装"
    },
    {
      "item": "遷移先",
      "design": "専用パスワード変更画面へ強制遷移",
      "implementation": "パスワード再発行(forgot)へ誘導する文言のみ",
      "mismatch": "遷移/誘導先が異なる"
    },
    {
      "item": "フラグ解除",
      "design": "パスワード変更でフラグを下す",
      "implementation": "解除処理なし",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-03_0306_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:42-56, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「非準拠パスワードでもログイン自体は成功させ、セッションに『非準拠パスワード』フラグを立て、フラグが立つ間はログイン必須ページへアクセスさせず専用パスワード変更画面へ強制遷移、変更でフラグ解除する。」。実装は「LoginPasswordLengthCheckListener が CheckPassportEvent(priority256)で認証前に平文パスワード長を検査し、12桁未満なら CustomUserMessageAuthenticationException('error.customer_login.password_length_required')を投げてログイン自体を失敗させ、パスワード再発行へ誘導する。非準拠フラグのセッション設定・専用変更画面への強制遷移・フラグ解除処理は MypageContr…」。乖離理由は「設計は『非準拠でもログイン成立→フラグ→専用変更画面へ強制遷移→変更で解除』。実装は『非準拠ならログインをブロックし再発行誘導』で、ログイン可否・遷移先・フラグ運用が根本的に異なる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1885\n1882:       </section>\n1883:       <!-- function-design-embed:end f06-02-f06-02_front_member_entry_activate -->\n1884: </section>\n1885:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1886:         <div class=\"sheet-heading\">\n1887:           <h2>ログイン</h2>\n1888:         </div>",
  "implementationRefs": [
    "src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:42-56",
    "src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
    "src/Eccube/EventListener/LoginPasswordLengthCheckListener.php",
    "src/Eccube/Controller/Front/Mypage/MypageController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/MypageController.php:85\n82:     #[Route(path: '/mypage/login', name: 'mypage_login', methods: ['GET', 'POST'])]\n83:     #[Template(template: 'Mypage/login.twig')]\n84:     public function login(Request $request, AuthenticationUtils $utils): RedirectResponse|array\n85:     {\n86:         if ($this->isGranted('IS_AUTHENTICATED_FULLY')) {\n87:             log_info('認証済のためログイン処理をスキップ');\n88: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
