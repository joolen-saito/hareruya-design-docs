#!/usr/bin/env python3
import json
import re
import shutil
import hashlib
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DOCS_ROOT = ROOT.parent
WORKSPACE = DOCS_ROOT.parent
IMPL_ROOT = WORKSPACE / "ec-cube-enterprise"
DATA = ROOT / "findings.json"
HTML_CACHE = {}

STANDARD_AUDIT_EVIDENCE = (
    "標準観点: 設計HTML / ルート・Controller / Form・入力 / Service・業務ルール / "
    "Repository・Entity・DB / Twig・表示 / CSV・API・Batch・PDF・印刷(該当時) / "
    "ラベル・メッセージ・翻訳キー / 権限・セッション・副作用・エラー・ログ"
)

CRITICAL_REQUIREMENT_TRACE_POLICY = (
    "処理概要・図形内テキスト・項目表・業務ルール・エッジケース・画面遷移・エラー処理にある "
    "must/shall 相当の個別要求は、ルートや画面の存在確認とは別に requirementTrace として照合する。"
    "秒・分などの時間条件、自動遷移、タイマー、店内アカウント/キオスク向けの強制遷移も個別要求として扱う。"
    "対象要求が未照合のまま残る場合、同一機能に他の所見があっても要求単位の監査完了とはみなしてはならない。"
)

DESIGN_REQUIREMENT_SECTION_PATTERN = re.compile(
    r"処理概要|業務ルール|入力項目|エッジケース|画面遷移|エラー処理|セッション|Cookie|"
    r"DB操作|データ整合性|入出力|API/バッチ結果|ログ・監査|排他制御|トランザクション|表示メッセージ"
)

DESIGN_REQUIREMENT_TEXT_PATTERN = re.compile(
    r"場合|押下|遷移|登録|更新|保存|表示|非表示|エラー|必須|任意|チェック|作成|削除|"
    r"送信|出力|入力|判定|計算|連携|保持|リダイレクト|戻す|再表示|不可|許可|確認|"
    r"切り替え|切替|エリア|誘導|問い合わせ|問合せ|お問い合わせ|お問合せ|"
    r"タイムアウト|経過|超過|未満|以上|以下|一致|不一致|"
    r"自動|自動的|自動遷移|秒後|分後|タイマー|一定秒数|画面を表示してから"
)
NON_REQUIREMENT_LINE_PATTERN = re.compile(
    r"^(作成日|更新日|改訂日|版数|バージョン|作成者|更新者|承認者|レビュー|目次|概要\s*$|機能名\s|機能No|シート名|"
    r"基本設計仕様書|Copyright|Page\s*\d+|[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2})"
)
DESIGN_NON_IMPLEMENTATION_PATTERN = re.compile(
    r"実装しない|実装不要|実装対象外|コード実装しない|プログラム実装しない"
)

EXPLICIT_REQUIREMENT_TRACE_CONFIG = {
    "f04-02_0304_sheet-4_sheet": [
        {
            "id": "f04-02-order-submit-30min-timeout",
            "category": "状態遷移・業務ルール",
            "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663-1664",
            "designRequirement": "注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。",
            "requiredImplementationEvidence": [
                "注文確定POST経路（shopping_confirm または shopping_checkout）で処理中受注の作成日時を参照している",
                "現在時刻との差分または期限日時により30分超過を判定している",
                "超過時に cart へリダイレクトしている",
                "超過時にカート商品を削除しないこと、必要なら pre_order_id/注文途中状態だけをリセットすることを確認している",
            ],
            "implSearchHints": [
                "ShoppingController::confirm",
                "ShoppingController::checkout",
                "OrderHelper::getPurchaseProcessingOrder",
                "OrderHelper::initializeOrder",
                "CartService::getPreOrderId",
                "Order::getCreateDate",
                "redirectToRoute('cart')",
                "modify('-30 minutes') / 1800 / interval",
            ],
            "findingWhenMissing": {
                "id": "f04-02-order-submit-30min-timeout-missing-01",
                "dimension": "②業務ルール・タイムアウト未実装",
                "severity": "high",
                "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663-1664",
                "designQuote": "注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移する。カート内の商品は保持する。",
                "implRef": "src/Eccube/Controller/Front/ShoppingController.php:289-380 / src/Eccube/Controller/Front/ShoppingController.php:405-615 / src/Eccube/Service/OrderHelper.php:242-313",
                "difference": "設計は、受注データ作成後30分を超えて注文するボタンを押下した場合にタイムアウト扱いとしてカート画面へ戻し、カート商品は保持することを要求している。実装の shopping_confirm / shopping_checkout / OrderHelper では処理中受注の作成日時と現在時刻を比較する30分超過判定、およびその場合に cart へ戻す分岐が確認できない。",
                "designExpectation": "注文するボタン押下時、注文方法指定画面表示後（受注データ作成後）30分を経過していれば、タイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。",
                "implementationActual": "ShoppingController::confirm と ShoppingController::checkout は cart/preOrderId/処理中受注の存在確認後に注文検証・決済検証・注文確定へ進むが、Order::getCreateDate などで受注作成日時を参照して30分経過を判定する処理がない。OrderHelper::getPurchaseProcessingOrder と initializeOrder も pre_order_id と PROCESSING ステータスで処理中受注を取得・再利用するだけで、有効期限判定を行わない。",
                "comparisonRows": [
                    {
                        "item": "30分超過判定",
                        "design": "受注データ作成後30分を経過している場合はタイムアウトと判定する。",
                        "implementation": "shopping_confirm / shopping_checkout では処理中受注を取得するが、受注作成日時と現在時刻の差分、1800秒、30 minutes 等による判定がない。",
                        "mismatch": "設計の時間条件を評価する業務ロジックが未実装。"
                    },
                    {
                        "item": "タイムアウト時の遷移先",
                        "design": "30分超過時はカート画面へ遷移する。",
                        "implementation": "cart へ戻る分岐はカート空・preOrderId 不在などの異常時であり、30分超過を理由に redirectToRoute('cart') する分岐はない。",
                        "mismatch": "設計が要求するタイムアウト専用の状態遷移が存在しない。"
                    },
                    {
                        "item": "カート商品の保持",
                        "design": "タイムアウト時もカート内の商品は保持する。",
                        "implementation": "タイムアウト分岐自体がないため、pre_order_id/注文途中状態だけをリセットしカート商品を保持する処理も確認できない。cartService->clear() は注文完了後の成功パスで実行される。",
                        "mismatch": "30分超過時にどの状態だけを破棄し、カート商品を保持するかが実装されていない。"
                    }
                ],
                "comparisonSummary": "設計は受注データ作成後30分超過でカートへ戻しカート商品を保持する。実装は処理中受注を取得して注文処理へ進むが、受注作成日時による30分判定とタイムアウト遷移がない。",
                "mismatchReason": "注文確定POST経路である ShoppingController::confirm / checkout と、処理中受注を返す OrderHelper に、設計が要求する30分経過判定・カート画面へのタイムアウト遷移・カート保持処理が確認できないため。",
                "impact": "注文方法指定画面を表示してから30分を超えても注文確定処理へ進める可能性があり、設計上タイムアウトさせるべき古い処理中受注、配送・支払条件、金額検証の扱いが実装挙動と一致しない。",
                "fixTarget": "src/Eccube/Controller/Front/ShoppingController.php の shopping_confirm / shopping_checkout、または共通の注文タイムアウト判定ヘルパー",
                "requiredChange": "処理中受注取得後、$Order->getCreateDate() 等を基準に30分超過を判定し、超過時はカート商品を消さずに注文途中状態または pre_order_id を適切にリセットして cart へリダイレクトする。shopping_confirm と direct POST の shopping_checkout の両経路で同じ判定を通す。",
                "implementationRefs": [
                    "src/Eccube/Controller/Front/ShoppingController.php:289",
                    "src/Eccube/Controller/Front/ShoppingController.php:310",
                    "src/Eccube/Controller/Front/ShoppingController.php:405",
                    "src/Eccube/Controller/Front/ShoppingController.php:426",
                    "src/Eccube/Service/OrderHelper.php:242",
                    "src/Eccube/Service/OrderHelper.php:289",
                    "src/Eccube/Service/OrderHelper.php:316"
                ],
                "implementationSearches": [
                    "rg -n \"getCreateDate|30 minutes|30分|1800|タイムアウト|timeout|shopping_confirm|shopping_checkout|redirectToRoute\\('cart'\\)|getPurchaseProcessingOrder|resetShoppingState\" src/Eccube/Controller/Front/ShoppingController.php src/Eccube/Service/OrderHelper.php",
                    "rg -n \"modify\\('-30 minutes'\\)|DateInterval|interval|expired|expire|timeout|タイムアウト|pre_order_id|PROCESSING\" src/Eccube/Controller/Front src/Eccube/Service src/Eccube/Resource/template/default/Shopping"
                ],
                "absenceConclusion": "注文確定の直接経路と近傍ヘルパーを確認したが、30分超過を条件にしたタイムアウト分岐は未検出。既存の cart リダイレクトはカート空や preOrderId 不在などの異常時であり、設計の時間経過条件とは一致しない。",
                "evidence": "設計HTML:1663-1664 は30分経過時のカート遷移とカート保持を定義。ShoppingController.php:310 と :426 は処理中受注を取得するが作成日時の期限判定がなく、OrderHelper.php:242 は pre_order_id と PROCESSING ステータスで取得するのみ。OrderHelper.php:289 は既存処理中受注を再利用し、:316 の resetShoppingState は30分超過判定から呼ばれていない。"
            },
        },
        {
            "id": "f04-02-otc-contact-link-area",
            "category": "画面表示・条件分岐",
            "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258",
            "designRequirement": "店頭受取、スムーズ店頭受取の場合、画面の表示切り替えをし、備考欄を非表示、お問合せフォームはこちらエリアを表示する。店頭受取、スムーズ店頭受取以外の場合は備考欄を表示し、お問合せフォームはこちらを非表示にする。",
            "requiredImplementationEvidence": [
                "配送方法が店頭受取またはスムーズ店頭受取かを判定している",
                "店頭受取またはスムーズ店頭受取では備考欄セクションまたは message 入力欄を表示しない",
                "店頭受取またはスムーズ店頭受取では contact ルート等への問い合わせフォーム誘導エリアを表示する",
                "店頭受取またはスムーズ店頭受取以外では備考欄を表示し、問い合わせフォーム誘導エリアを表示しない",
            ],
            "implSearchHints": [
                "Shopping/index.twig",
                "isDeliveryOTC",
                "data-js-shipping-remarks",
                "front.shopping.message_info",
                "front.shopping.message_placeholder",
                "front.shopping.otc_notice",
                "path('contact') / url('contact')",
                "hareruya-checkout.js",
            ],
        },
    ],
    "f04-04_0304_sheet-7_sheet": [
        {
            "id": "f04-04-store-account-complete-1min-auto-redirect",
            "category": "業務ルール・画面自動遷移",
            "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452",
            "designRequirement": "店内アカウントの場合、画面を表示してから1分後に注文した店舗のTOP画面へ自動的に遷移する。",
            "requiredImplementationEvidence": [
                "購入完了画面で注文または顧客の購入グループが店内アカウント/支店用店内アカウントかを判定している",
                "店内アカウントの場合だけ画面表示後1分（60秒/60000ms）のタイマーを開始している",
                "タイマー満了時に注文した店舗のTOP画面URLへ location.href/location.assign/redirect 等で自動遷移している",
                "通常のTOPボタンだけでなく、ユーザー操作なしの強制遷移が実装されている",
            ],
            "implSearchHints": [
                "ShoppingController::complete",
                "Shopping/complete.twig",
                "waitingNumber",
                "DtbCustomerGroup::OTC / OTC_SHITEN / isOtcGroup",
                "setTimeout / setInterval / 60000 / 60 * 1000",
                "window.location / location.href / location.assign / location.replace",
                "url('homepage') / 注文した店舗のTOP",
            ],
            "findingWhenMissing": {
                "id": "f04-04-store-account-complete-1min-auto-redirect-missing-01",
                "dimension": "②業務ルール・画面自動遷移未実装",
                "severity": "med",
                "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452",
                "designQuote": "店内アカウントの場合、画面を表示してから1分後に注文した店舗のTOP画面へ自動的に遷移する",
                "implRef": "src/Eccube/Controller/Front/ShoppingController.php:615-670 / src/Eccube/Resource/template/default/Shopping/complete.twig:80-118 / html/template/default/assets/hareruya/js/hareruya-checkout.js",
                "difference": "設計は、店内アカウントの購入完了画面で表示開始から1分後に注文した店舗のTOPへユーザー操作なしで自動遷移することを要求している。実装は購入完了画面を表示し、店内注文番号（waitingNumber）と通常のTOPページへ戻るボタンを出すが、店内アカウント判定に基づく60秒タイマーと自動 location 遷移が確認できない。",
                "designExpectation": "店内アカウントの場合だけ、購入完了画面を表示してから1分後に、注文した店舗のTOP画面へ自動的に遷移する。",
                "implementationActual": "ShoppingController::complete は受注ID取得、待ち番号取得、セッションクリア後に Order/hasNextCart/products/waitingNumber をテンプレートへ渡す。Shopping/complete.twig は waitingNumber があればTC注文番号相当の表示を切り替え、TOPページへ戻るボタンを href=\"{{ url('homepage') }}\" で表示するが、app.user/Order.Customer の店内アカウント条件、setTimeout/setInterval/60000、注文店舗TOP URLへの自動遷移処理がない。",
                "comparisonRows": [
                    {
                        "item": "対象条件",
                        "design": "店内アカウントの場合に限定して自動遷移する。",
                        "implementation": "WaitingNumberProcessor には isOtcGroup 判定があり店内注文番号は発番されるが、ShoppingController::complete と Shopping/complete.twig では購入グループを判定して自動遷移の有無を切り替えていない。",
                        "mismatch": "設計の店内アカウント条件が購入完了画面の自動遷移制御に使われていない。"
                    },
                    {
                        "item": "タイマー",
                        "design": "画面を表示してから1分後に遷移する。",
                        "implementation": "complete.twig と関連 checkout JS に setTimeout/setInterval、60000、60 * 1000 などの1分タイマー処理がない。",
                        "mismatch": "表示開始から1分を測るクライアント側またはサーバー側のタイマー処理が未実装。"
                    },
                    {
                        "item": "遷移方法と遷移先",
                        "design": "注文した店舗のTOP画面へ自動的に遷移する。項目表のTOPページへ戻るボタンも注文した店舗のTOP画面へ遷移する。",
                        "implementation": "画面上には href=\"{{ url('homepage') }}\" の手動TOPボタンだけがあり、注文した店舗のTOP URLを算出して location.href/location.assign 等で自動遷移する処理はない。",
                        "mismatch": "通常TOPへの手動リンクはあるが、注文店舗TOPへの自動遷移という設計要求を満たしていない。"
                    }
                ],
                "comparisonSummary": "設計は店内アカウントの購入完了画面で1分後に注文店舗TOPへ自動遷移する。実装は待ち番号表示と通常TOPボタンのみで、店内アカウント条件・60秒タイマー・注文店舗TOPへの自動遷移が存在しない。",
                "mismatchReason": "購入完了画面の Controller/Twig/関連JSを確認したが、設計が要求する店内アカウント限定の1分タイマーと注文店舗TOPへの強制遷移処理が確認できないため。",
                "impact": "店内アカウントで購入完了画面が店舗端末に残り続ける可能性があり、設計上想定している店舗TOPへの自動復帰と次操作への復帰導線が実装挙動と一致しない。",
                "fixTarget": "src/Eccube/Controller/Front/ShoppingController.php、src/Eccube/Resource/template/default/Shopping/complete.twig、必要に応じて hareruya-checkout.js",
                "requiredChange": "購入完了画面へ店内アカウント判定結果と注文店舗TOP URLを渡し、該当時だけ 60000ms の setTimeout でそのURLへ自動遷移する。TOPページへ戻るボタンも設計どおり注文した店舗のTOPを向くようにする。",
                "implementationRefs": [
                    "src/Eccube/Controller/Front/ShoppingController.php:615",
                    "src/Eccube/Controller/Front/ShoppingController.php:645",
                    "src/Eccube/Controller/Front/ShoppingController.php:665",
                    "src/Eccube/Resource/template/default/Shopping/complete.twig:88",
                    "src/Eccube/Resource/template/default/Shopping/complete.twig:100",
                    "src/Eccube/Resource/template/default/Shopping/complete.twig:115",
                    "src/Eccube/Entity/DtbCustomerGroup.php:34",
                    "src/Eccube/Entity/DtbCustomerGroup.php:235",
                    "src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:44"
                ],
                "implementationSearches": [
                    "rg -n \"setTimeout|setInterval|60000|60\\\\s*\\\\*\\\\s*1000|window\\\\.location|location\\\\.href|location\\\\.assign|location\\\\.replace|url\\\\('homepage'\\\\)|path\\\\('homepage'\\\\)\" src/Eccube/Resource/template/default/Shopping/complete.twig html/template/default/assets/hareruya/js/hareruya-checkout.js html/template/default/assets/hareruya/js/hareruya-shopping-point.js",
                    "rg -n \"店内アカウント|1分|１分|注文した店舗|自動的に遷移|自動遷移|shopping_complete|p-hareruya-complete\" src/Eccube/Controller/Front src/Eccube/Resource/template/default html/template/default/assets/hareruya/js",
                    "rg -n \"isOtcGroup|OTC|OTC_SHITEN|waitingNumber|店内注文\" src/Eccube/Controller/Front/ShoppingController.php src/Eccube/Entity src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php"
                ],
                "absenceConclusion": "購入完了の直接実装である ShoppingController::complete、Shopping/complete.twig、および関連 checkout JS を確認したが、店内アカウント限定の60秒自動遷移は未検出。既存の url('homepage') はユーザーが押す通常TOPボタンであり、設計の自動遷移ではない。",
                "evidence": "設計HTML:2452 は店内アカウントの1分後自動遷移を定義し、:2464 はTOPボタンの遷移先を注文店舗TOPとする。ShoppingController.php:645 は店内注文番号を取得するが、:665-670 でテンプレートへ渡す値に店内アカウント判定や注文店舗TOP URLがない。complete.twig:88-102 は waitingNumber 表示だけを切り替え、:115 は通常の homepage リンクを表示するのみ。関連JS検索でも setTimeout/setInterval/60000 と自動 location 遷移は確認できない。"
            },
        },
    ],
}


def normalize_requirement_text(text):
    text = re.sub(r"\s+", "", str(text or ""))
    text = re.sub(r"^[★☆・●○■□※]+", "", text)
    text = re.sub(r"[。．.、，,「」『』（）()【】\\[\\]]", "", text)
    return text


def strip_html(text):
    text = re.sub(r"<(script|style)\b.*?</\1>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</(?:p|li|tr|div|h[1-6]|td|th)>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    entities = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&#39;": "'",
    }
    for src, dst in entities.items():
        text = text.replace(src, dst)
    return text


def resolve_design_html_anchor(design_html):
    if not design_html:
        return None, None
    path_text, _, anchor = design_html.partition("#")
    path = DOCS_ROOT / path_text
    return path, anchor or None


def extract_sheet_html(path, anchor):
    if not path or not path.exists():
        return ""
    if path not in HTML_CACHE:
        HTML_CACHE[path] = path.read_text(encoding="utf-8", errors="ignore")
    html = HTML_CACHE[path]
    if not anchor:
        return html
    marker = f'id="{anchor}"'
    start = html.find(marker)
    if start < 0:
        return html
    # Move back to the opening section tag so headings immediately before the id
    # are kept when the id appears inside the opening tag.
    section_start = html.rfind("<section", 0, start)
    if section_start >= 0:
        start = section_start
    end = html.find('<section class="sheet-panel"', start + 1)
    if end < 0:
        end = html.find("<!-- function-design-embed:end", start + 1)
    if end < 0:
        end = len(html)
    return html[start:end]


def extract_design_requirements(function_entry, limit=120):
    path, anchor = resolve_design_html_anchor(function_entry.get("designHtml"))
    html = extract_sheet_html(path, anchor)
    if not html:
        return []
    text = strip_html(html)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    requirements = []
    current_section = ""
    for line in lines:
        if not line or len(line) < 8:
            continue
        if NON_REQUIREMENT_LINE_PATTERN.search(line):
            continue
        if DESIGN_REQUIREMENT_SECTION_PATTERN.search(line) and len(line) < 80:
            current_section = line
            continue
        if not DESIGN_REQUIREMENT_TEXT_PATTERN.search(line):
            continue
        if re.search(r"base64|data:image|mxGraphModel|Copyright", line):
            continue
        if line in {r["designRequirement"] for r in requirements}:
            continue
        requirements.append({
            "id": stable_requirement_id(function_entry["functionId"], line),
            "category": current_section or "設計要求",
            "designRef": function_entry.get("designHtml"),
            "designRequirement": clean_claim(line, limit=500),
            "source": "html_requirement_extractor",
            "requiredImplementationEvidence": [
                "設計要求に対応する Controller/Form/Service/Repository/Twig/Command/API/CSV/PDF の実装箇所",
                "設計条件を満たす分岐・判定・保存・遷移・表示・副作用のコード証跡",
                "設計値と実装値が一致する、または乖離所見として記録済みであること",
            ],
        })
        if len(requirements) >= limit:
            break
    return requirements


def stable_requirement_id(function_id, text):
    digest = hashlib.sha1(f"{function_id}:{text}".encode("utf-8")).hexdigest()[:10]
    return f"{function_id}-req-{digest}"


def requirement_trace_is_covered(requirement, findings):
    haystack_parts = []
    for finding in findings:
        haystack_parts.extend(
            str(finding.get(key, ""))
            for key in [
                "id",
                "dimension",
                "designRef",
                "designQuote",
                "designExpectation",
                "implementationActual",
                "difference",
                "comparisonSummary",
                "mismatchReason",
                "requiredChange",
                "evidence",
                "implementationRefs",
                "implementationSnippets",
            ]
        )
    haystack = normalize_requirement_text(" ".join(haystack_parts))
    needles = [
        requirement.get("id", ""),
        requirement.get("designRequirement", ""),
        requirement.get("designRef", ""),
    ]
    # Long Japanese requirements are often paraphrased in findings, so require
    # either the stable id/design ref or several characteristic terms from the row.
    if any(normalize_requirement_text(needle) and normalize_requirement_text(needle) in haystack for needle in needles):
        return True
    terms = re.findall(r"[一-龥ぁ-んァ-ヶA-Za-z0-9_/-]{2,}", requirement.get("designRequirement", ""))
    important_terms = [
        t for t in terms
        if DESIGN_REQUIREMENT_TEXT_PATTERN.search(t) or re.search(r"カート|注文|受注|会員|商品|在庫|CSV|API|PDF|バッチ", t)
    ]
    matched = sum(1 for term in important_terms[:12] if normalize_requirement_text(term) in haystack)
    return matched >= max(3, min(5, len(important_terms)))


def upsert_reaudit_finding(function_entry, item, source="reaudit_harness"):
    item = dict(item)
    item["verdict"] = "CONFIRMED"
    item["confidence"] = "CONFIRMED"
    item["source"] = source
    item.setdefault("functionId", function_entry["functionId"])
    expected_id = item.get("id")
    for existing in function_entry.get("findings", []):
        same_id = expected_id and existing.get("id") == expected_id
        same_design_slot = (
            existing.get("dimension") == item.get("dimension")
            and norm_ref(existing.get("designRef")) == norm_ref(item.get("designRef"))
        )
        if same_id or same_design_slot:
            existing.update(item)
            function_entry["auditStatus"] = "AUDITED_WITH_FINDINGS"
            return existing
    function_entry.setdefault("findings", []).append(item)
    function_entry["auditStatus"] = "AUDITED_WITH_FINDINGS"
    return item


def add_missing_explicit_requirement_findings(function_entry):
    """Promote configured material requirements to findings when no finding covers them."""
    added = []
    for requirement in EXPLICIT_REQUIREMENT_TRACE_CONFIG.get(function_entry["functionId"], []):
        template = requirement.get("findingWhenMissing")
        if not template:
            continue
        if requirement_trace_is_covered(requirement, function_entry.get("findings", [])):
            continue
        finding = dict(template)
        finding.setdefault("requirementTrace", [
            {
                "requirementId": requirement.get("id"),
                "designRef": requirement.get("designRef"),
                "designRequirement": requirement.get("designRequirement"),
                "implementationSearchTerms": requirement.get("implSearchHints", []),
                "implementationRefs": template.get("implementationRefs") or split_refs(template.get("implRef")),
                "implementationActual": template.get("implementationActual"),
                "traceVerdict": "NOT_FOUND",
                "traceReason": template.get("mismatchReason") or template.get("difference"),
            }
        ])
        added.append(upsert_reaudit_finding(function_entry, finding, source="explicit_requirement_trace_gate"))
    if added:
        function_entry.setdefault("requirementTraceGatePromotedFindings", [])
        for finding in added:
            ref = {
                "id": finding.get("id"),
                "dimension": finding.get("dimension"),
                "designRef": finding.get("designRef"),
            }
            if ref not in function_entry["requirementTraceGatePromotedFindings"]:
                function_entry["requirementTraceGatePromotedFindings"].append(ref)
    return added


def apply_requirement_trace_gate(function_entry, source_index=None):
    explicit_requirements = EXPLICIT_REQUIREMENT_TRACE_CONFIG.get(function_entry["functionId"], [])
    extracted_requirements = extract_design_requirements(function_entry)
    merged = {}
    for requirement in extracted_requirements + explicit_requirements:
        if requirement in explicit_requirements:
            requirement = dict(requirement)
            requirement.setdefault("source", "explicit_requirement_trace_config")
        key = normalize_requirement_text(requirement.get("designRequirement"))
        if key:
            merged[key] = requirement
    requirements = list(merged.values())
    if not requirements:
        function_entry.pop("requirementTraceGate", None)
        function_entry.pop("requirementConformanceAudit", None)
        return

    findings = function_entry.get("findings", [])
    traces = []
    missing = []
    for requirement in requirements:
        covered = requirement_trace_is_covered(requirement, findings)
        trace = dict(requirement)
        trace.pop("findingWhenMissing", None)
        trace["coveredByFinding"] = covered
        traces.append(trace)
        if not covered:
            missing.append(trace)

    function_entry["requirementTraceGate"] = {
        "policy": CRITICAL_REQUIREMENT_TRACE_POLICY,
        "extractedRequirementCount": len(extracted_requirements),
        "explicitRequirementCount": len(explicit_requirements),
        "requirements": traces,
        "missingRequirementCount": len(missing),
        "noDriftAllowed": len(missing) == 0,
    }
    function_entry.pop("requirementImplementationAudit", None)
    # 全要求に判定を付ける（判定漏れ0の網羅監査）。未照合を静かに捨てない。
    build_requirement_conformance_audit(function_entry, traces, source_index)
    if missing:
        function_entry["auditQualityGateFailure"] = (
            "設計書の個別必須要求が未照合のため、他の所見の有無に関わらず要求単位の監査完了とは扱わない。"
        )
        function_entry["auditQualityGateMissingRequirements"] = missing
        build_focused_untraced_requirement_audit(function_entry, missing, source_index or {"sources": [], "termIndex": {}})
    else:
        function_entry.pop("auditQualityGateFailure", None)
        function_entry.pop("auditQualityGateMissingRequirements", None)
        function_entry.pop("focusedUntracedRequirementAudit", None)


def implementation_gap_type(finding):
    text = " ".join(
        str(finding.get(key, ""))
        for key in [
            "dimension",
            "implRef",
            "difference",
            "mismatchReason",
            "implementationActual",
            "absenceConclusion",
        ]
    )
    if not re.search(r"未実装|不在|未検出|存在しない|ロジック自体が存在しない|コメントアウト|一切実行されない|一切設定されない|未呼出", text):
        return None
    if re.search(r"ルート|HTTPメソッド|エンドポイント|path|パス", str(finding.get("dimension", ""))) and re.search(r"未実装|不在|存在しない|未検出", text):
        return "設計エンドポイント未実装"
    if re.search(r"ルート未実装|機能/ルート未実装|バッチ未実装|機能/バッチ未実装", text):
        return "機能・ルート・バッチ未実装"
    if re.search(r"CSV|列定義|入出力|フォーマット|API入出力|PDF|印刷ログ|副作用", text):
        return "入出力・列定義・副作用未実装"
    if re.search(r"DB|カラム|テーブル|保存先|登録処理|更新処理", text):
        return "DB・保存/更新処理未実装"
    if re.search(r"業務ルール|計算|判定|分岐|連携|外部連携", text):
        return "業務ロジック・外部連携未実装"
    return "その他の明確な実装漏れ"


def phase2_not_implemented_exclusion_reason(function_entry, finding):
    if function_entry.get("phase2Verdict") != "NOT_IMPLEMENTED_CONFIRMED":
        return None
    text = " ".join(
        str(finding.get(key, ""))
        for key in [
            "dimension",
            "designQuote",
            "designExpectation",
            "implRef",
            "difference",
            "mismatchReason",
            "implementationActual",
            "absenceConclusion",
            "evidence",
        ]
    )
    if not re.search(r"未実装|不在|未検出|見当たらない|存在しない|確認できない|実装されていない|実装がない|対応していない|Ph1では実装しない|フェーズ1では実装しない", text):
        return None
    return "HTML設計書がフェーズ2実装・フェーズ1未実装を明記しており、未実装であること自体は設計との乖離ではないため差分所見から除外。"


def finding_audit_aspects(finding):
    text = " ".join(
        str(finding.get(key, ""))
        for key in [
            "dimension",
            "designQuote",
            "difference",
            "mismatchReason",
            "implementationActual",
            "comparisonSummary",
        ]
    )
    aspects = []
    rules = [
        ("ラベル・メッセージ・翻訳キー", r"ラベル|文言|メッセージ|翻訳|locale|messages\.(ja|en)|trans|ボタン名|ボタン文言|表示文言|フラッシュ"),
        ("ルート・Controller", r"ルート|HTTP|Controller|エンドポイント|パス|Route"),
        ("Form・入力項目", r"Form|フォーム|入力|必須|任意|バリデーション|validation"),
        ("Service・業務ルール", r"Service|業務ルール|計算|判定|状態遷移|外部連携"),
        ("Repository・Entity・DB", r"Repository|Entity|DB|テーブル|カラム|保存|更新|登録|削除"),
        ("Twig・画面表示", r"Twig|画面|表示|一覧|列|初期表示"),
        ("CSV・API・Batch・PDF・印刷", r"CSV|API|Batch|バッチ|PDF|印刷|入出力|レスポンス|リクエスト"),
        ("権限・セッション・副作用・エラー・ログ", r"権限|認可|セッション|副作用|エラー|ログ|監査|例外"),
    ]
    for label, pattern in rules:
        if re.search(pattern, text, re.IGNORECASE):
            aspects.append(label)
    return aspects or ["設計HTML"]


SOURCE_EXTENSIONS = {".php", ".twig", ".yaml", ".yml", ".js", ".csv"}
SOURCE_ROOT_PREFIXES = (
    "src/Eccube/",
    "app/Customize/",
    "app/DoctrineMigrations/",
    "app/config/",
    "app/template/",
    "app/Plugin/",
    "html/template/default/assets/hareruya/",
)
SOURCE_SKIP_PARTS = {
    ".git",
    "vendor",
    "node_modules",
    "var",
    "cache",
    "coverage",
    "tests",
    "e2e-tests",
    "zap",
    "plugin_repos",
    "dockerbuild",
    "proxy",
    "PluginData",
    ".composer",
}
SOURCE_SKIP_FILE_PATTERNS = re.compile(
    r"(^|/)(bundle|select2|jquery|bootstrap|chart|filepond|ladda|popper|moment)(\.min)?\.js$|"
    r"\.min\.js$|\.map$|dummy[0-9a-f]{8,}/",
    re.IGNORECASE,
)
GENERIC_DESIGN_TERMS = {
    "基本設計仕様書",
    "シート",
    "機能",
    "画面",
    "一覧",
    "登録",
    "編集",
    "検索",
    "確認",
    "完了",
    "管理",
    "処理",
    "データ",
    "ファイル",
    "エラー",
    "入力",
    "出力",
    "項目",
    "表示",
    "更新",
    "削除",
    "作成",
}
GENERIC_REQUIREMENT_SEARCH_TERMS = GENERIC_DESIGN_TERMS | {
    "する",
    "した",
    "される",
    "できる",
    "について",
    "として",
    "および",
    "または",
    "ならない",
    "ください",
    "一覧表示",
    "詳細表示",
    "入力する",
    "表示する",
    "登録する",
    "更新する",
    "削除する",
    "エラー表示",
}
HIGH_RISK_REQUIREMENT_PATTERN = re.compile(
    r"未実装|新規追加|押下|遷移|リダイレクト|戻す|保持|保存|登録|更新|削除|作成|"
    r"送信|出力|取込|インポート|エクスポート|CSV|API|PDF|印刷|バッチ|Command|"
    r"連携|スマレジ|Slack|S3|メール|通知|ログ|監査|セッション|Cookie|権限|認可|"
    r"決済|支払|配送|出荷|受注|注文|在庫|会員|顧客|ポイント|ブラックリスト|"
    r"タイムアウト|期限|経過|超過|判定|チェック|計算|必須|エラー|非表示|表示切り替え|エリア"
)
FOCUSED_UNTRACED_REQUIREMENT_PATTERN = re.compile(
    r"画面を表示してから|自動的に遷移|自動で[^。]*遷移|自動再遷移|"
    r"自動遷移秒数|完了画面の自動遷移秒数|[0-9０-９]+(?:分|秒)後[^。]*遷移|"
    r"タイムアウト[^。]*(?:遷移|カート|保持|注文|受注)|"
    r"(?:経過|超過)[^。]*タイムアウト"
)
FOCUSED_UNTRACED_REQUIREMENT_EXCLUDE_PATTERN = re.compile(
    r"自動では遷移しない|自動遷移しない|仕様確定せず|本書では仕様確定せず|"
    r"別機能の設計を正とする|実装または別機能の設計を正とする|対象外"
)
# 網羅監査で「上位表示・指摘化する」テスト可能な挙動要求か（materiality）。
# ここに当たる未実装候補/要確認だけを指摘票・レポート上位に出す。非materialも判定はする（JSONに残す）。
MATERIAL_REQUIREMENT_PATTERN = re.compile(
    r"リンク|ボタン|押下|クリック|タップ|遷移|リダイレクト|戻す|再表示|"
    r"表示|非表示|切り替え|切替|メッセージ|文言|ダイアログ|モーダル|ポップアップ|"
    r"エラー|必須|入力|チェック|バリデーション|検証|"
    r"登録|更新|保存|削除|作成|送信|出力|取込|インポート|エクスポート|ダウンロード|アップロード|"
    r"連携|通知|メール|権限|認可|ログイン|ログアウト|検索|絞り込み|並び替え|ソート|"
    r"ページング|ページ送り|チェックボックス|プルダウン|セレクト|ラジオ|タブ|"
    r"CSV|API|PDF|印刷|バッチ|Command|自動遷移|タイマー|秒後|分後|"
    r"問い合わせ|問合せ|お問い合わせ|ヘルプ|誘導|遷移先|一覧|明細|"
    r"許可|不可|判定|計算|付与|割引|クーポン|ポイント|在庫|決済|支払|配送|出荷"
)
# 利用者が直接目にする要素（リンク/ボタン/文言/画面/メニュー等）。
# 実装ソースに一切の痕跡が無い element-level 要求は、内部ロジックより「未実装」の疑いが濃い。
ELEMENT_LEVEL_REQUIREMENT_PATTERN = re.compile(
    r"リンク|ボタン|メニュー|タブ|ラベル|見出し|文言|メッセージ|ダイアログ|モーダル|ポップアップ|"
    r"アイコン|バナー|画像|ヘルプ|ツールチップ|プレースホルダ|"
    r"画面へ遷移|画面に遷移|ページへ遷移|遷移先|誘導|表示する|非表示|チェックボックス|"
    r"プルダウン|セレクトボックス|ラジオボタン|入力欄|項目を表示"
)
# 要求文でなく見出し・概要・凡例・注記の頭に来やすい語（材料性から除外）。
NON_MATERIAL_REQUIREMENT_LEAD_PATTERN = re.compile(
    r"^(概要|本機能|本画面|本節|前提|補足|備考|注記|注意|凡例|以下|上記|参照|なお|※|"
    r"目的|背景|対象範囲|用語|改訂履歴|画面イメージ|画面レイアウト|項目名|項番|No\.?$)"
)
# audit_requirement_source_signal の verdict → 網羅監査バケット。
CONFORMANCE_VERDICT_BUCKET = {
    "COVERED_BY_FINDING": "実装済み",
    "SOURCE_SIGNAL_FOUND_REQUIREMENT_UNTRACED": "要確認",
    "WEAK_SOURCE_SIGNAL_FOUND": "要確認",
    "NO_SOURCE_SIGNAL_FOUND": "未実装候補",
    "PHASE2_NONIMPLEMENTATION_EXPECTED": "対象外",
    "DESIGN_NONIMPLEMENTATION_EXPECTED": "対象外",
}
ROUTE_NAME_PATTERN = re.compile(
    r"\b(?:admin|shopping|cart|entry|mypage|contact|api|front|ajax|smaregi|stock|order|product|customer|otc|buy)[a-z0-9_]{2,}\b",
    re.IGNORECASE,
)
TRANSLATION_KEY_PATTERN = re.compile(r"\b(?:admin|front|common|tooltip|validator)\.[a-z0-9_.]+", re.IGNORECASE)
CLASS_NAME_PATTERN = re.compile(
    r"\b[A-Z][A-Za-z0-9]+(?:Controller|Service|Repository|Command|Type|Handler|Action|Exporter|Importer|Csv|Pdf|Processor|Manager|Helper)\b"
)
URL_PATH_PATTERN = re.compile(r"/(?:\{admin_route\}|[A-Za-z0-9_.{}-]+)(?:/[A-Za-z0-9_.{}-]+){0,6}")
JAPANESE_TERM_PATTERN = re.compile(r"[一-龥ぁ-んァ-ヶーA-Za-z0-9]{3,24}")


def source_role(rel):
    rel = str(rel)
    rules = [
        ("Controller", "/Controller/"),
        ("Command/Batch", "/Command/"),
        ("Form", "/Form/"),
        ("Service", "/Service/"),
        ("Repository", "/Repository/"),
        ("Entity", "/Entity/"),
        ("Migration", "/Migration/"),
        ("Twig", "/Resource/template/"),
        ("Locale", "/Resource/locale/"),
        ("CSV", "/Csv/"),
        ("PDF/Print", "/Pdf/"),
        ("JavaScript", ".js"),
        ("CSS", ".css"),
        ("Config", ".yaml"),
    ]
    padded = "/" + rel
    for label, needle in rules:
        if needle in padded or rel.endswith(needle):
            return label
    return "Source"


def iter_source_files():
    if not IMPL_ROOT.exists():
        return []
    files = []
    for path in IMPL_ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SOURCE_EXTENSIONS:
            continue
        rel = path.relative_to(IMPL_ROOT).as_posix()
        parts = set(path.relative_to(IMPL_ROOT).parts)
        if parts & SOURCE_SKIP_PARTS:
            continue
        if SOURCE_SKIP_FILE_PATTERNS.search(rel):
            continue
        if not rel.startswith(SOURCE_ROOT_PREFIXES):
            continue
        try:
            if path.stat().st_size > 350_000:
                continue
        except OSError:
            continue
        files.append(path)
    return files


def build_source_index():
    sources = []
    term_index = defaultdict(list)
    for path in iter_source_files():
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = path.relative_to(IMPL_ROOT).as_posix()
        source = {
            "path": path,
            "rel": rel,
            "role": source_role(rel),
            "lines": text.splitlines(),
        }
        sources.append(source)
        add_source_terms_to_index(source, term_index)
    return {"sources": sources, "termIndex": term_index}


def add_term_match(term_index, term, source, line_no, snippet):
    term = re.sub(r"\s+", " ", str(term or "")).strip().strip("/").lower()
    if not term or len(term) < 3:
        return
    bucket = term_index[term]
    if len(bucket) >= 40:
        return
    ref = f"{source['rel']}:{line_no}"
    if any(item["ref"] == ref for item in bucket):
        return
    bucket.append({
        "role": source["role"],
        "ref": ref,
        "snippet": clean_claim(snippet, limit=220),
    })


def source_line_terms(line):
    terms = set()
    for pattern in [ROUTE_NAME_PATTERN, TRANSLATION_KEY_PATTERN, CLASS_NAME_PATTERN]:
        terms.update(pattern.findall(line))
    for path in URL_PATH_PATTERN.findall(line):
        normalized = path.replace("{admin_route}", "").strip("/")
        if normalized:
            terms.add(normalized)
            for part in normalized.split("/"):
                if len(part) >= 3:
                    terms.add(part)
    for value in JAPANESE_TERM_PATTERN.findall(line):
        if value not in GENERIC_DESIGN_TERMS and len(value) >= 3:
            terms.add(value)
    return terms


def add_source_terms_to_index(source, term_index):
    rel = source["rel"]
    for part in re.split(r"[/_.-]+", rel):
        if len(part) >= 3:
            add_term_match(term_index, part, source, 1, rel)
    for idx, line in enumerate(source["lines"], 1):
        if not line.strip():
            continue
        for term in source_line_terms(line):
            add_term_match(term_index, term, source, idx, line)


def add_unique_term(bucket, term, limit=None):
    term = re.sub(r"\s+", " ", str(term or "")).strip()
    term = term.strip("、。，．:：;；()（）[]【】<>「」『』\"'")
    if not term or len(term) < 3 or term in GENERIC_DESIGN_TERMS:
        return
    if term not in bucket:
        bucket.append(term)
    if limit and len(bucket) > limit:
        del bucket[limit:]


def split_title_terms(text):
    text = re.sub(r"^[A-Z]\d{2}-\d{2}\s*", "", str(text or ""), flags=re.IGNORECASE)
    text = re.sub(r"[（(].*?[）)]", " ", text)
    text = re.sub(r"[_/\\-]+", " ", text)
    terms = []
    for raw in JAPANESE_TERM_PATTERN.findall(text):
        raw = raw.strip()
        if raw and raw not in GENERIC_DESIGN_TERMS:
            terms.append(raw)
    return terms


def extract_design_search_profile(function_entry):
    path, anchor = resolve_design_html_anchor(function_entry.get("designHtml"))
    html = extract_sheet_html(path, anchor)
    text = strip_html(html)
    title_text = " ".join([
        str(function_entry.get("featureNo") or ""),
        str(function_entry.get("title") or ""),
        str(function_entry.get("sheetName") or ""),
    ])
    profile = {
        "routeNames": [],
        "translationKeys": [],
        "classNames": [],
        "paths": [],
        "businessTerms": [],
    }
    for value in ROUTE_NAME_PATTERN.findall(text):
        add_unique_term(profile["routeNames"], value, limit=30)
    for value in TRANSLATION_KEY_PATTERN.findall(text):
        add_unique_term(profile["translationKeys"], value, limit=30)
    for value in CLASS_NAME_PATTERN.findall(text):
        add_unique_term(profile["classNames"], value, limit=30)
    for value in URL_PATH_PATTERN.findall(text):
        if re.search(r"\.(png|jpg|jpeg|gif|svg|css|js)$", value, re.IGNORECASE):
            continue
        add_unique_term(profile["paths"], value.replace("{admin_route}", "").strip("/"), limit=30)
    for value in split_title_terms(title_text):
        add_unique_term(profile["businessTerms"], value, limit=12)
    # Add a few high-signal Japanese terms from the first material design lines.
    for line in strip_html(html).splitlines()[:220]:
        line = re.sub(r"\s+", " ", line).strip()
        if not line or re.search(r"作成日|更新日|Copyright|base64|mxGraphModel", line):
            continue
        for value in JAPANESE_TERM_PATTERN.findall(line):
            if value in GENERIC_DESIGN_TERMS or len(value) < 4:
                continue
            if re.search(r"店頭|在庫|受注|注文|商品|会員|顧客|配送|出荷|買取|ポイント|CSV|API|バッチ|PDF|スマレジ|カテゴリ|ログ|権限|支払|決済", value):
                add_unique_term(profile["businessTerms"], value, limit=24)
    profile["searchTerms"] = (
        [(t, "routeName", 5) for t in profile["routeNames"]]
        + [(t, "translationKey", 4) for t in profile["translationKeys"]]
        + [(t, "className", 5) for t in profile["classNames"]]
        + [(t, "path", 4) for t in profile["paths"]]
        + [(t, "businessTerm", 2) for t in profile["businessTerms"]]
    )
    return profile


def first_matching_line(source, term):
    needle = term.lower()
    for idx, line in enumerate(source["lines"], 1):
        if needle in line.lower():
            return idx, clean_claim(line, limit=220)
    return 1, ""


def find_implementation_candidates(profile, source_index, per_term_limit=4, total_limit=18):
    matches = []
    seen = set()
    search_terms = sorted(profile.get("searchTerms", []), key=lambda item: -item[2])[:45]
    term_index = source_index.get("termIndex", {})
    for term, term_type, weight in search_terms:
        lookup_terms = [term.lower().strip("/")]
        if "/" in term:
            lookup_terms.extend(part.lower() for part in term.strip("/").split("/") if len(part) >= 3)
        per_term = 0
        for lookup_term in lookup_terms:
            if len(lookup_term) < 3:
                continue
            for hit in term_index.get(lookup_term, [])[:per_term_limit]:
                key = (hit["ref"], lookup_term, term_type)
                if key in seen:
                    continue
                seen.add(key)
                role_bonus = 2 if hit["role"] in {"Controller", "Command/Batch", "Form", "Service", "Repository", "Twig", "CSV", "PDF/Print"} else 0
                matches.append({
                    "term": term,
                    "termType": term_type,
                    "role": hit["role"],
                    "ref": hit["ref"],
                    "snippet": hit["snippet"],
                    "weight": weight + role_bonus,
                })
                per_term += 1
                if per_term >= per_term_limit:
                    break
            if per_term >= per_term_limit:
                break
        if per_term:
            continue
    matches.sort(key=lambda m: (-m["weight"], m["ref"], m["term"]))
    return matches[:total_limit]


def split_requirement_search_terms(text):
    terms = []
    for value in ROUTE_NAME_PATTERN.findall(text):
        add_unique_term(terms, value, limit=40)
    for value in TRANSLATION_KEY_PATTERN.findall(text):
        add_unique_term(terms, value, limit=40)
    for value in CLASS_NAME_PATTERN.findall(text):
        add_unique_term(terms, value, limit=40)
    for value in URL_PATH_PATTERN.findall(text):
        if not re.search(r"\.(png|jpg|jpeg|gif|svg|css|js)$", value, re.IGNORECASE):
            add_unique_term(terms, value.replace("{admin_route}", "").strip("/"), limit=40)
    for value in JAPANESE_TERM_PATTERN.findall(text):
        value = value.strip("、。，．:：;；()（）[]【】<>「」『』\"'")
        if len(value) < 3 or value in GENERIC_REQUIREMENT_SEARCH_TERMS:
            continue
        if re.fullmatch(r"[0-9]+", value):
            continue
        add_unique_term(terms, value, limit=40)
    for value in re.findall(r"[0-9]+(?:分|秒|時間|日|ヶ月|回|件|円|%)", text):
        add_unique_term(terms, value, limit=40)
    return terms


def extract_requirement_search_profile(requirement):
    text = str(requirement.get("designRequirement") or "")
    route_names = []
    translation_keys = []
    class_names = []
    paths = []
    business_terms = []
    for value in ROUTE_NAME_PATTERN.findall(text):
        add_unique_term(route_names, value, limit=20)
    for value in TRANSLATION_KEY_PATTERN.findall(text):
        add_unique_term(translation_keys, value, limit=20)
    for value in CLASS_NAME_PATTERN.findall(text):
        add_unique_term(class_names, value, limit=20)
    for value in URL_PATH_PATTERN.findall(text):
        add_unique_term(paths, value.replace("{admin_route}", "").strip("/"), limit=20)
    for value in split_requirement_search_terms(text):
        if value in route_names or value in translation_keys or value in class_names or value in paths:
            continue
        add_unique_term(business_terms, value, limit=24)
    return {
        "routeNames": route_names,
        "translationKeys": translation_keys,
        "classNames": class_names,
        "paths": paths,
        "businessTerms": business_terms,
        "searchTerms": (
            [(t, "routeName", 5) for t in route_names]
            + [(t, "translationKey", 4) for t in translation_keys]
            + [(t, "className", 5) for t in class_names]
            + [(t, "path", 4) for t in paths]
            + [(t, "businessTerm", 2) for t in business_terms]
        ),
    }


def requirement_risk(requirement):
    text = " ".join([
        str(requirement.get("category") or ""),
        str(requirement.get("designRequirement") or ""),
    ])
    if requirement.get("source") == "explicit_requirement_trace_config":
        return "high"
    return "high" if HIGH_RISK_REQUIREMENT_PATTERN.search(text) else "normal"


def focused_untraced_requirement_reason(requirement):
    text = " ".join([
        str(requirement.get("category") or ""),
        str(requirement.get("designRequirement") or ""),
    ])
    if FOCUSED_UNTRACED_REQUIREMENT_EXCLUDE_PATTERN.search(text):
        return None
    if FOCUSED_UNTRACED_REQUIREMENT_PATTERN.search(text):
        return "時間条件・自動遷移・タイムアウト遷移に関する要求は、ルート/画面の存在とは別に実装証跡が必要。"
    return None


def build_focused_untraced_requirement_audit(function_entry, missing_requirements, source_index):
    rows = []
    for requirement in missing_requirements:
        reason = focused_untraced_requirement_reason(requirement)
        if not reason:
            continue
        row = audit_requirement_source_signal(function_entry, requirement, source_index, covered=False)
        row["focusReason"] = reason
        row["reportingPolicy"] = (
            "確定所見ではないため個別要求差分件数には含めない。"
            "ただし自動遷移・タイムアウト系の要求漏れを防ぐため、実装ソース確認対象としてHTMLに表示する。"
        )
        rows.append(row)
    if rows:
        function_entry["focusedUntracedRequirementAudit"] = {
            "policy": (
                "未照合要求のうち、時間条件・自動遷移・タイムアウト遷移など、"
                "ルート/画面存在だけでは実装済みと判断できないものを重点確認対象として保持する。"
                "確定差分にするには Controller/Twig/JS/Service 等の直接証跡で設計値と実装値を比較する。"
            ),
            "untracedFocusedRequirementCount": len(rows),
            "rows": rows,
        }
    else:
        function_entry.pop("focusedUntracedRequirementAudit", None)


def is_material_requirement(requirement):
    text = str(requirement.get("designRequirement") or "").strip()
    if not text:
        return False
    if NON_MATERIAL_REQUIREMENT_LEAD_PATTERN.match(text):
        return False
    return bool(MATERIAL_REQUIREMENT_PATTERN.search(text))


def build_requirement_conformance_audit(function_entry, requirement_traces, source_index):
    """抽出した全要求に判定を付ける（判定漏れ0）。

    実装済み / 要確認 / 未実装候補 / 対象外(理由付き) のいずれかへ必ず分類し、
    未判定が残らないことを機械保証する。material な未実装候補・要確認は
    codex+実機レビューで実装済/未実装/実装違いを確定する候補として上位に出す。
    """
    source_index = source_index or {"sources": [], "termIndex": {}}
    # 機能レベルの実装入口シグナル。要求粒度で無シグナルでも、機能自体に実装入口が
    # あれば「未実装候補」ではなく「要確認」に落とし、真に入口不明のものだけ未実装候補にする。
    fn_profile = extract_design_search_profile(function_entry)
    fn_candidates = find_implementation_candidates(fn_profile, source_index)
    fn_entry_verdict = function_implementation_verdict(function_entry, fn_candidates)
    function_has_strong_entry = fn_entry_verdict in {
        "IMPLEMENTATION_ENTRY_FOUND",
        "IMPLEMENTATION_CANDIDATE_FOUND",
        "CONFIRMED_IMPLEMENTATION_GAP",
    }
    rows = []
    counts = {"実装済み": 0, "要確認": 0, "未実装候補": 0, "対象外": 0}
    material_gap_rows = []
    unverdicted = 0
    for trace in requirement_traces:
        covered = bool(trace.get("coveredByFinding"))
        material = is_material_requirement(trace)
        if covered:
            row = {
                "requirementId": trace.get("id"),
                "category": trace.get("category"),
                "designRef": trace.get("designRef"),
                "designRequirement": trace.get("designRequirement"),
                "source": trace.get("source"),
                "risk": requirement_risk(trace),
                "verdict": "COVERED_BY_FINDING",
                "candidateCount": 0,
                "strongSignalCount": 0,
                "candidateRefs": [],
                "auditNote": "確定所見が本要求をカバー済み。",
            }
        else:
            row = audit_requirement_source_signal(function_entry, trace, source_index, covered=False)
        verdict = row.get("verdict")
        element_level = bool(
            ELEMENT_LEVEL_REQUIREMENT_PATTERN.search(str(trace.get("designRequirement") or ""))
        )
        bucket = CONFORMANCE_VERDICT_BUCKET.get(verdict)
        if bucket is None:
            unverdicted += 1
            bucket = "要確認"
        elif bucket == "未実装候補" and function_has_strong_entry and not element_level:
            # 内部ロジック要求は日本語→コード識別子の検索が弱く未実装と断定できない。
            # 機能入口がある場合は要確認へ落とす。element-level（利用者が見る要素）は落とさない。
            bucket = "要確認"
            row["auditNote"] = (
                "機能の実装入口は存在するが、本要求粒度の実装証跡が検索で確認できない。"
                "実機/コードで実装済/未実装/実装違いを確定する（未実装確定なら指摘化）。"
            )
        row["conformanceBucket"] = bucket
        row["material"] = material
        row["elementLevel"] = element_level
        counts[bucket] = counts.get(bucket, 0) + 1
        if material and bucket in {"未実装候補", "要確認"}:
            material_gap_rows.append(row)
        rows.append(row)

    coverage_complete = unverdicted == 0 and len(rows) == len(requirement_traces)
    if not coverage_complete:
        # 判定漏れは本監査の存在意義に反するため、静かに続行せず失敗させる。
        raise RuntimeError(
            f"requirement conformance verdict gap in {function_entry.get('functionId')}: "
            f"rows={len(rows)} requirements={len(requirement_traces)} unverdicted={unverdicted}"
        )
    function_entry["requirementConformanceAudit"] = {
        "policy": (
            "設計書から抽出した全要求に判定を付ける（判定漏れ0）。"
            "実装済み/要確認/未実装候補/対象外(理由付き)のいずれかへ必ず分類する。"
            "未実装候補・要確認は、codex批判的レビューと実機確認で実装済/未実装/実装違いを確定する候補。"
        ),
        "requirementCount": len(requirement_traces),
        "verdictedCount": len(rows),
        "unverdictedCount": unverdicted,
        "coverageComplete": coverage_complete,
        "functionEntryVerdict": fn_entry_verdict,
        "counts": counts,
        "materialGapCount": len(material_gap_rows),
        "rows": rows,
        "materialGapRows": material_gap_rows,
    }


def audit_requirement_source_signal(function_entry, requirement, source_index, covered):
    profile = extract_requirement_search_profile(requirement)
    candidates = find_implementation_candidates(profile, source_index, per_term_limit=3, total_limit=8)
    strong_count = sum(
        1 for c in candidates
        if c["termType"] in {"routeName", "className", "translationKey", "path"} or c["weight"] >= 6
    )
    if covered:
        verdict = "COVERED_BY_FINDING"
        note = "既存または自動昇格所見で要求がカバーされている。"
    elif function_entry.get("phase2Verdict") == "NOT_IMPLEMENTED_CONFIRMED":
        verdict = "PHASE2_NONIMPLEMENTATION_EXPECTED"
        note = "HTML設計書がフェーズ2/Ph1未実装相当を明記しているため、未実装自体は差分候補から除外。"
    elif function_entry.get("designNonImplementationScope") == "FUNCTION_SCOPE":
        verdict = "DESIGN_NONIMPLEMENTATION_EXPECTED"
        note = "HTML設計書が機能全体を非実装対象としているため、未実装自体は差分候補から除外。"
    elif not candidates:
        verdict = "NO_SOURCE_SIGNAL_FOUND"
        note = "要求文から抽出した検索語に対する実装ソース上のヒットがない。未実装の可能性が高く、個別確認が必要。"
    elif strong_count == 0:
        verdict = "WEAK_SOURCE_SIGNAL_FOUND"
        note = "業務語レベルの弱いヒットはあるが、ルート・クラス・翻訳キー・パス等の強い実装証跡はない。未実装または実装場所不明の可能性がある。"
    else:
        verdict = "SOURCE_SIGNAL_FOUND_REQUIREMENT_UNTRACED"
        note = "実装候補はあるが、要求を満たす具体的な分岐・保存・表示・副作用までは未照合。"
    return {
        "requirementId": requirement.get("id"),
        "category": requirement.get("category"),
        "designRef": requirement.get("designRef"),
        "designRequirement": requirement.get("designRequirement"),
        "source": requirement.get("source"),
        "risk": requirement_risk(requirement),
        "verdict": verdict,
        "searchTerms": [term for term, _term_type, _weight in profile.get("searchTerms", [])][:24],
        "candidateCount": len(candidates),
        "strongSignalCount": strong_count,
        "candidateRefs": candidates[:5],
        "auditNote": note,
    }


def design_nonimplementation_scope(reason):
    if not reason:
        return None
    if re.search(r"Ph2|フェーズ2|Ph1では実装しない|フェーズ1では実装しない", reason, re.IGNORECASE):
        return "SCOPED_OR_PHASE2"
    if re.search(r"現行で動いているwordpressサーバー|Enterprise版Dockerイメージ|Auroraのパラメータグループ", reason):
        return "FUNCTION_SCOPE"
    if re.fullmatch(r"実装しない[。.]?", reason.strip()):
        return "FUNCTION_SCOPE"
    return "SCOPED_REQUIREMENT"


def function_implementation_verdict(function_entry, candidates):
    if function_entry.get("phase2Verdict") == "NOT_IMPLEMENTED_CONFIRMED":
        return "PHASE2_NONIMPLEMENTATION_EXPECTED"
    if any(f.get("implementationGap") for f in function_entry.get("findings", [])):
        return "CONFIRMED_IMPLEMENTATION_GAP"
    if function_entry.get("designNonImplementationScope") == "FUNCTION_SCOPE":
        return "DESIGN_NONIMPLEMENTATION_EXPECTED"
    strong = [
        c for c in candidates
        if c["termType"] in {"routeName", "className", "translationKey", "path"} or c["weight"] >= 6
    ]
    if strong:
        return "IMPLEMENTATION_ENTRY_FOUND"
    if candidates:
        return "IMPLEMENTATION_CANDIDATE_FOUND"
    return "NO_IMPLEMENTATION_ENTRY_FOUND"


def apply_function_implementation_audit(function_entry, source_index):
    profile = extract_design_search_profile(function_entry)
    candidates = find_implementation_candidates(profile, source_index)
    function_entry["designNonImplementationReason"] = design_nonimplementation_reason(function_entry)
    function_entry["designNonImplementationScope"] = design_nonimplementation_scope(function_entry.get("designNonImplementationReason"))
    verdict = function_implementation_verdict(function_entry, candidates)
    if verdict == "CONFIRMED_IMPLEMENTATION_GAP":
        note = "差分所見の中に明確な実装漏れが確認済み。下記候補は周辺実装の参照用。"
    elif verdict == "NO_IMPLEMENTATION_ENTRY_FOUND":
        note = "設計書から抽出したルート名・クラス名・パス・主要業務語で実装入口候補が見つからない。自動判定では確定欠陥にせず、追加レビュー対象とする。"
    elif verdict == "IMPLEMENTATION_ENTRY_FOUND":
        note = "設計書由来のルート名・クラス名・翻訳キー・パスに対応する実装入口候補を検出。個別要求の一致は requirementTrace/finding で別途判断する。"
    elif verdict == "PHASE2_NONIMPLEMENTATION_EXPECTED":
        note = "HTML設計書にフェーズ2/Ph1未実装相当の記載があり、入口未実装自体は差分所見として扱わない。"
    elif verdict == "DESIGN_NONIMPLEMENTATION_EXPECTED":
        note = f"HTML設計書に非実装指示があるため、入口未実装自体は差分所見として扱わない: {function_entry.get('designNonImplementationReason')}"
    else:
        note = "業務語レベルの実装候補はあるが、ルート名・クラス名などの強い入口証跡は不足。追加レビュー対象とする。"
    if function_entry.get("designNonImplementationScope") in {"SCOPED_REQUIREMENT", "SCOPED_OR_PHASE2"}:
        note += f" 限定的な非実装記載あり（機能全体の非実装判定には使わない）: {function_entry.get('designNonImplementationReason')}"
    function_entry["functionImplementationAudit"] = {
        "verdict": verdict,
        "designDerivedTerms": {
            key: profile.get(key, [])
            for key in ["routeNames", "translationKeys", "classNames", "paths", "businessTerms"]
        },
        "candidateCount": len(candidates),
        "strongSignalCount": sum(
            1 for c in candidates
            if c["termType"] in {"routeName", "className", "translationKey", "path"} or c["weight"] >= 6
        ),
        "candidateRefs": candidates,
        "searchedAreas": [
            "src/Eccube Controller/Form/Service/Repository/Entity/Command/Resource/template/Resource/locale",
            "app",
            "html/template/default/assets/hareruya",
            "html/template/admin/assets",
        ],
        "auditNote": note,
    }


def design_nonimplementation_reason(function_entry):
    path, anchor = resolve_design_html_anchor(function_entry.get("designHtml"))
    html = extract_sheet_html(path, anchor)
    if not html:
        return None
    for line in strip_html(html).splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if not line:
            continue
        if DESIGN_NON_IMPLEMENTATION_PATTERN.search(line):
            return clean_claim(line, limit=260)
    return None


ADDITIONAL_FINDINGS = [
    {
        "functionId": "f06-27_0306_sheet-23_sheet",
        "dimension": "①機能/ルート未実装",
        "severity": "high",
        "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7530-7552",
        "designQuote": "新規追加画面。リニューアル後のパスワードポリシーに準拠していないパスワードでログインした会員に対し、当画面に遷移させ、パスワードの変更を促す。変更完了まではログインが必要な画面へのリンクをクリックしても当画面へ遷移し、ログイン時に設定したポリシー違反セッション情報を参照する。変更完了時はそのセッション情報を削除する。",
        "implRef": "不在 / src/Eccube/Controller/Front/ForgotController.php:146 / src/Eccube/Form/Type/Front/PasswordResetType.php:27 / src/Eccube/Controller/Front/Mypage/ChangeController.php:68 / src/Eccube/Resource/template/default/Mypage/change.twig:89",
        "difference": "設計はパスワードポリシー違反ユーザー専用の新規パスワード設定画面、ログイン成功後の専用画面強制遷移、ログイン必須画面アクセス時の再誘導、ポリシー違反セッション情報の参照・削除を要求している。実装には忘れたパスワード再設定と会員情報変更はあるが、ポリシー違反専用画面・ルート・セッション制御・ログイン後リダイレクトが見当たらない。",
        "designExpectation": "F06-27 は、ポリシー違反パスワードでログインした会員を専用のパスワード設定画面へ遷移させ、変更完了までログイン必須画面からも同画面へ戻し、変更完了時に違反セッション情報を削除する。",
        "implementationActual": "Front 配下には ForgotController の /forgot/reset/{reset_key} と Mypage/ChangeController の /mypage/change が存在するが、どちらもリセットキーまたは通常会員情報変更の処理であり、ログイン成功時にパスワードポリシー違反セッションを設定・参照して専用画面へ強制遷移する入口ではない。ソース検索でも「パスワード設定（ポリシー違反用）」「ポリシー違反」「PasswordPolicy」「password_policy」に対応するルート、Controller、Twig、Service は未検出。",
        "comparisonRows": [
            {
                "item": "専用画面・ルート",
                "design": "ポリシー違反のパスワード再設定を促す「新規追加画面」を用意する。",
                "implementation": "ForgotController::reset と Mypage/ChangeController::index はあるが、ポリシー違反用の専用 Controller/Route/Twig は見当たらない。",
                "mismatch": "設計が要求する専用画面入口が実装されていない。既存の忘れたパスワード再設定や通常会員情報変更では代替できない。"
            },
            {
                "item": "ログイン後の強制遷移",
                "design": "パスワードポリシーに準拠していないパスワードでログインした会員を当画面へ遷移させる。",
                "implementation": "ログイン成功時にポリシー違反を判定して専用画面へ redirect する処理やセッション設定が未検出。",
                "mismatch": "ログイン済みユーザーを専用画面へ誘導する状態遷移が実装されていない。"
            },
            {
                "item": "セッション制御",
                "design": "ログイン時に設定したポリシー違反セッション情報を参照し、変更完了時に削除する。",
                "implementation": "該当セッションキー、参照処理、削除処理が未検出。",
                "mismatch": "変更完了まで他ログイン必須画面から戻すための状態管理が存在しない。"
            }
        ],
        "comparisonSummary": "設計はポリシー違反パスワード専用の画面・強制遷移・セッション制御を要求するが、実装は忘れたパスワード再設定と通常会員情報変更のみで、専用フローが存在しない。",
        "mismatchReason": "HTML設計書では F06-27 を新規追加画面として定義しているのに対し、実装ソースには対応するルート、テンプレート、セッション判定、ログイン後リダイレクトが確認できないため。",
        "impact": "リニューアル後のパスワードポリシーに合わない既存会員がログインできた場合でも、設計どおりパスワード変更を強制できない。ポリシー違反状態の解消が利用者任せになり、ログイン必須画面へのアクセス制御も設計と異なる。",
        "fixTarget": "Front ログイン後フロー / F06-27 専用 Controller・Twig・Form / パスワードポリシー違反セッション制御",
        "requiredChange": "ログイン成功時にパスワードポリシー違反を判定してセッションへ記録し、F06-27 専用画面へ遷移させる。ログイン必須画面アクセス時は同セッションを参照して専用画面へ戻し、パスワード変更完了時にセッションを削除する。画面項目は設計のメッセージ、パスワード、確認、変更する、TOPへ戻るに合わせる。",
        "requirementTrace": [
            {
                "requirementId": "f06-27-policy-password-dedicated-screen",
                "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7530-7540",
                "designRequirement": "パスワードポリシー違反ユーザー向けの新規追加画面を用意し、ログイン後およびログイン必須画面アクセス時に当画面へ遷移させ、違反セッション情報を参照・削除する。",
                "implementationSearchTerms": ["パスワード設定", "ポリシー違反", "PasswordPolicy", "password_policy", "policy password", "forgot_reset", "mypage_change"],
                "implementationRefs": ["src/Eccube/Controller/Front/ForgotController.php:146", "src/Eccube/Form/Type/Front/PasswordResetType.php:27", "src/Eccube/Controller/Front/Mypage/ChangeController.php:68", "src/Eccube/Resource/template/default/Mypage/change.twig:89"],
                "implementationActual": "既存のパスワードリセット・会員情報変更はあるが、ポリシー違反用の専用画面とログイン後強制遷移・セッション制御は未検出。",
                "traceVerdict": "NOT_FOUND",
                "traceReason": "設計の専用フローに対応するルート、テンプレート、セッション処理が実装側にない。"
            }
        ],
        "implementationRefs": [
            "src/Eccube/Controller/Front/ForgotController.php:146",
            "src/Eccube/Form/Type/Front/PasswordResetType.php:27",
            "src/Eccube/Controller/Front/Mypage/ChangeController.php:68",
            "src/Eccube/Resource/template/default/Mypage/change.twig:89"
        ],
        "implementationSnippets": [
            "ForgotController.php:146 は /forgot/reset/{reset_key} のリセットキー付き再設定で、ログイン済みの場合は 404 とするため、ログイン後のポリシー違反強制変更画面ではない。",
            "PasswordResetType.php:27 は login_email と password を持つ忘れたパスワード用フォームで、ポリシー違反セッション参照はない。",
            "Mypage/ChangeController.php:68 と Mypage/change.twig:89 は通常の会員情報変更画面で、F06-27 専用メッセージ常時表示や強制遷移制御ではない。"
        ],
        "implementationSearches": [
            "rg -n \"パスワード設定|ポリシー違反|PasswordPolicy|password_policy|policy.*password|password.*policy|再設定を促す\" src/Eccube app/Customize app/template",
            "rg -n \"forgot_reset|mypage_change|PasswordResetType|ForgotController|ChangeController\" src/Eccube/Controller/Front src/Eccube/Form/Type/Front src/Eccube/Resource/template/default"
        ],
        "absenceConclusion": "該当機能そのものは不在。近傍のパスワードリセットと会員情報変更を確認したが、設計のポリシー違反専用画面・強制遷移・セッション参照/削除とは一致しない。",
        "evidence": "設計HTML:7530-7540 は新規追加画面、ポリシー違反ログイン会員の当画面遷移、ログイン必須画面からの再誘導、セッション情報参照・削除を定義。設計HTML:7548-7552 はメッセージ、パスワード、確認、変更する、TOPへ戻るを項目定義。実装検索ではポリシー違反用ルート/Controller/Twig/Service が未検出で、ForgotController.php:146 は未ログイン前提のリセットキー再設定、Mypage/ChangeController.php:68 は通常会員情報変更である。",
    },
    {
        "functionId": "b16-05_0416_sheet-7_waf",
        "dimension": "①機能/バッチ未実装",
        "severity": "high",
        "designRef": "excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html:998-1060",
        "designQuote": "WAF不正アクセスログ集計処理。晴れる屋EC-CUBEのWAFで不正アクセスと判断されたログを取得し、処理結果をS3にアップロードおよびSlack通知を行う。前日分のログ統合・集計を行い、S3 の WAFLogs 配下から取得、YYMMDD_result.gz と YYMMDD_attach を S3 に保存し、Slack通知用メールサービスでSlackチャンネルに通知する。毎日4時に Step Functions で起動する。",
        "implRef": "不在 / src/Eccube/Command/*.php / src/Eccube/Service/S3AccessService.php:24 / src/Eccube/Command/TestS3UploadDemoCommand.php:22 / src/Eccube/Service/UniSearch/UniSearchExportService.php:31",
        "difference": "設計は WAF ログ取得、前日分統合、gzip圧縮、ブロックIP集計、S3保存、Slack通知、毎日4時起動を行うバッチを要求している。監査対象の ec-cube-enterprise 実装には S3 汎用サービスやデモアップロード、UniSearch の gzip 出力はあるが、WAF ログ集計専用の Command/Service、WAFLogs パス処理、IP集計、Slack通知処理は見当たらない。なお Step Functions/Lambda 等の外部インフラリポジトリは今回のソース照合対象外であり、そこに実装があるかは未確認。",
        "designExpectation": "B16-05 は Step Functions から毎日4時に起動され、AWS S3 の WAFLogs から前日分ログを取得し、1日分の gzip 結果と集計結果ファイルを S3 に保存し、Slackチャンネルへ通知する処理を持つ。",
        "implementationActual": "監査対象の ec-cube-enterprise では、src/Eccube/Command に複数の AsCommand バッチがあるが、WAF、不正アクセスログ、IP_Block_List、YYMMDD_result.gz、YYMMDD_attach、Slack通知用メールサービスに該当する Command は未検出。S3AccessService はカード画像等のS3汎用アクセス、TestS3UploadDemoCommand は固定キーへ Hello world を putObject するデモ、UniSearchExportService はUniSearch用TSV gzip/SFTP出力であり、WAFログ集計を実行しない。外部の Step Functions/Lambda/インフラ管理リポジトリは未照合。",
        "comparisonRows": [
            {
                "item": "バッチ入口",
                "design": "WAF不正アクセスログ集計処理を毎日4時に Step Functions から起動する。",
                "implementation": "監査対象の ec-cube-enterprise/src/Eccube/Command に WAF ログ集計用の AsCommand が未検出。外部インフラ側の実装有無は未確認。",
                "mismatch": "ec-cube-enterprise 内には設計のバッチ入口が見つからない。ただし実行基盤が別リポジトリの場合は追加確認が必要。"
            },
            {
                "item": "入力取得",
                "design": "S3://[ログ保存先バケット]/AWSLogs/641007440821/WAFLogs/ap-northeast-1/IP_Block_List/[YYYY]/[MM]/[DD] 配下の時刻ディレクトリを取得する。",
                "implementation": "S3AccessService や S3 利用箇所はあるが、WAFLogs/IP_Block_List の前日分ログを列挙・取得する処理は未検出。",
                "mismatch": "設計の入力パスと取得対象に対応する処理が存在しない。"
            },
            {
                "item": "集計・出力・通知",
                "design": "1日分ログを gzip で S3 に保存し、ブロックIPと出現回数を集計して YYMMDD_attach を保存し、Slackチャンネルへ通知する。",
                "implementation": "WAFログの gzip 結果作成、IP集計、YYMMDD_attach 保存、Slack通知用メールサービス呼び出しが未検出。",
                "mismatch": "設計の主要処理と副作用がまとめて未実装。"
            }
        ],
        "comparisonSummary": "設計は WAF ログ集計処理の起動、S3入力、gzip/S3出力、IP集計、Slack通知を要求するが、監査対象の ec-cube-enterprise 内では近傍のS3汎用処理だけで、専用処理がない。",
        "mismatchReason": "HTML設計書は B16-05 を具体的な入出力・実行時刻まで定義しているが、監査対象ソースである ec-cube-enterprise に対応する Command/Service と業務処理が確認できないため。外部インフラリポジトリや Step Functions/Lambda 側の実装有無は今回未照合。",
        "impact": "ec-cube-enterprise 内だけを見る限り、不正アクセスログの前日分集計、S3成果物保存、Slack通知が実行されず、WAF ブロック状況の監視・共有が設計どおり行われない。外部インフラ側で実装済みの場合は、その配置・責務を設計/運用台帳に紐づける必要がある。",
        "fixTarget": "src/Eccube/Command または外部バッチ実行基盤 / WAFログ集計Service / S3入出力 / Slack通知用メール連携",
        "requiredChange": "ec-cube-enterprise 側で実装するなら WAFログ集計用 Command/Service を追加し、設計の S3 WAFLogs パスから前日分を取得、日次 gzip 結果とIP集計結果をS3保存、Slack通知用メールサービスで通知する。外部インフラ側で実装する方針なら、そのリポジトリ/Step Functions/Lambda/スケジュール設定を確認し、監査レポートの implRef に追加して所見を解消またはスコープ外へ更新する。",
        "requirementTrace": [
            {
                "requirementId": "b16-05-waf-log-aggregate-batch",
                "designRef": "excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html:1011-1060",
                "designRequirement": "WAFログをS3から取得し、前日分を統合・集計して gzip 結果と集計ファイルを S3 に保存し、Slack通知を行う毎日4時起動バッチ。",
                "implementationSearchTerms": ["WAF", "不正アクセス", "WAFLogs", "IP_Block_List", "YYMMDD_result", "YYMMDD_attach", "Slack", "AsCommand", "S3"],
                "implementationRefs": ["src/Eccube/Service/S3AccessService.php:24", "src/Eccube/Command/TestS3UploadDemoCommand.php:22", "src/Eccube/Service/UniSearch/UniSearchExportService.php:31"],
                "implementationActual": "監査対象の ec-cube-enterprise では S3汎用処理や別用途のgzip出力はあるが、WAFログ集計バッチ入口と処理本体は未検出。外部インフラ側は未照合。",
                "traceVerdict": "NOT_FOUND",
                "traceReason": "監査対象の ec-cube-enterprise には、設計の専用バッチに対応する Command/Service、WAFLogs 入力、IP集計、Slack通知処理がない。外部インフラ実装がある場合は追加証跡が必要。"
            }
        ],
        "implementationRefs": [
            "src/Eccube/Service/S3AccessService.php:24",
            "src/Eccube/Command/TestS3UploadDemoCommand.php:22",
            "src/Eccube/Service/UniSearch/UniSearchExportService.php:31",
            "src/Eccube/Command/CreateLatestArticleListCommand.php:34"
        ],
        "implementationSnippets": [
            "S3AccessService.php:24 は汎用S3クライアントサービスで、WAFLogs の前日分集計やSlack通知は実装していない。",
            "TestS3UploadDemoCommand.php:22 は eccube:demo:s3-upload のデモコマンドで、固定キー test/1/hello.txt へ putObject するのみ。",
            "UniSearchExportService.php:31 は UniSearch 用の gzip 圧縮定数で、WAF 不正アクセスログ集計ではない。",
            "CreateLatestArticleListCommand.php:34 は Wordpress記事取得バッチで、B16-05 の WAFログ集計とは対象が異なる。"
        ],
        "implementationSearches": [
            "rg -n \"WAF|不正アクセス|アクセスログ|aws-waf|waf|blocked IP|Slack|gzip\" src/Eccube app/Customize app/config",
            "rg -n \"AsCommand|S3|Slack|YYMMDD|deadlock|デッドロック|WAF|gzip\" src/Eccube/Command src/Eccube/Service app/Customize"
        ],
        "absenceConclusion": "監査対象の ec-cube-enterprise 内では該当機能そのものは不在。S3汎用サービス、S3アップロードデモ、UniSearch gzip 出力などの近似実装を確認したが、設計のWAFログ入力・IP集計・S3成果物・Slack通知を満たさない。外部インフラ実装は未確認のため、実装場所が別なら追加証跡が必要。",
        "evidence": "設計HTML:1011-1012 は WAF ログ取得、S3アップロード、Slack通知を定義。設計HTML:1017 は前日分ログ統合・集計、:1049-1058 は S3 取得、gzip保存、IP集計、S3保存、Slack通知、:1059-1060 は毎日4時起動と入出力先を定義。ec-cube-enterprise の実装検索では WAF/IP_Block_List/YYMMDD_result/YYMMDD_attach に対応する Command/Service が未検出で、近傍の S3AccessService、TestS3UploadDemoCommand、UniSearchExportService は別用途である。Step Functions/Lambda 等の外部インフラ実装は今回未照合。",
    },
    {
        "functionId": "f04-02_0304_sheet-4_sheet",
        "dimension": "⑤画面表示・条件分岐",
        "severity": "med",
        "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258,1702",
        "designQuote": "店頭受取、スムーズ店頭受取の場合、画面の表示切り替えをする。備考欄を非表示とする。お問合せフォームはこちらエリアを表示する。図形テキストにも「配送方法を『店頭受取』『スムーズ店頭受取』に切り替えた場合は備考欄を消し、問い合わせフォームへの誘導とする」とある。",
        "implRef": "src/Eccube/Resource/template/default/Shopping/index.twig:128,374-385,557-678 / html/template/default/assets/hareruya/js/hareruya-checkout.js:1 / src/Eccube/Resource/locale/messages.ja.yaml:1412-1415,1484-1485",
        "difference": "設計は店頭受取・スムーズ店頭受取では備考欄を非表示にし、代わりに「お問合せフォームはこちら」エリアを表示する要求。実装は isDeliveryOTC の判定を持つが、備考欄セクションと message テキストエリアは店頭受取でも常に描画され、問い合わせフォームへのリンクエリアも Shopping/index.twig 内に存在しない。",
        "designExpectation": "店頭受取・スムーズ店頭受取の注文方法指定画面では、備考欄を消して、お問合せフォームへの誘導エリアを表示する。通常配送では備考欄を表示し、問い合わせ誘導は非表示にする。",
        "implementationActual": "Shopping/index.twig は delivery.id が Delivery::OTC_GROUP かどうかを isDeliveryOTC に設定し、同日受取チェックと「店頭受取」「スムーズ店頭受取」についての注意文だけを条件表示する。一方、備考欄 section は isDeliveryOTC で囲われておらず、front.shopping.message_info の「備考欄」ラベルと message textarea を常に描画する。読み込み JS は備考欄の配置をレスポンシブに移動するだけで、店頭受取時に非表示化しない。Shopping/index.twig には contact ルートへのリンクまたは「お問合せフォームはこちら」エリアがない。",
        "comparisonRows": [
            {
                "item": "店頭受取時の備考欄",
                "design": "店頭受取、スムーズ店頭受取の場合は「備考欄を非表示とする」。",
                "implementation": "備考欄 section と message textarea は isDeliveryOTC 条件の外で常に描画される。isDeliveryOTC で分岐しているのは一部説明文と店頭受取注意文のみ。",
                "mismatch": "店頭受取時に備考欄を消す条件分岐が実装されていない。"
            },
            {
                "item": "店頭受取時の問い合わせ誘導",
                "design": "店頭受取、スムーズ店頭受取の場合は「お問合せフォームはこちらエリアを表示する」。",
                "implementation": "Shopping/index.twig と関連翻訳キーには contact ルートへのリンク、または「お問合せフォームはこちら」に相当する注文方法指定画面内エリアがない。",
                "mismatch": "備考欄の代替として表示すべき問い合わせフォーム誘導エリアが未実装。"
            },
            {
                "item": "通常配送時の逆条件",
                "design": "店頭受取、スムーズ店頭受取以外の場合は備考欄を表示し、お問合せフォームはこちらを非表示とする。",
                "implementation": "備考欄は通常配送でも店頭受取でも表示され、問い合わせ誘導エリアはどちらにも表示されない。",
                "mismatch": "配送方法による表示切替が設計どおりの二分岐になっていない。"
            }
        ],
        "comparisonSummary": "設計は店頭受取系配送で「備考欄を非表示」「問い合わせフォーム誘導を表示」の切替を要求するが、実装は備考欄を常時表示し、問い合わせ誘導を未実装としている。",
        "mismatchReason": "実装は isDeliveryOTC を判定しているものの、その判定を備考欄 section の表示可否と contact ルート誘導エリアの表示に使っていないため、設計の条件付き画面切替を満たさない。",
        "impact": "店頭受取・スムーズ店頭受取の利用者に、設計で意図した問い合わせフォーム誘導が出ず、代わりに設計上非表示の備考欄入力が残る。問い合わせ導線と注文時入力導線が設計と異なる。",
        "fixTarget": "src/Eccube/Resource/template/default/Shopping/index.twig / src/Eccube/Resource/locale/messages.ja.yaml / 必要に応じて hareruya-checkout.js",
        "requiredChange": "isDeliveryOTC が true の場合は備考欄 section または message textarea を非表示にし、contact ルートへの「お問合せフォームはこちら」誘導エリアを表示する。isDeliveryOTC が false の場合は現行どおり備考欄を表示し、問い合わせ誘導を出さない。",
        "requirementTrace": [
            {
                "requirementId": "f04-02-otc-contact-link-area",
                "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258",
                "designRequirement": "店頭受取、スムーズ店頭受取の場合、備考欄を非表示にし、お問合せフォームはこちらエリアを表示する。",
                "implementationSearchTerms": ["isDeliveryOTC", "data-js-shipping-remarks", "front.shopping.message_info", "path('contact')", "url('contact')", "お問合せフォームはこちら"],
                "implementationRefs": ["src/Eccube/Resource/template/default/Shopping/index.twig:128", "src/Eccube/Resource/template/default/Shopping/index.twig:374-385", "src/Eccube/Resource/template/default/Shopping/index.twig:557-678", "html/template/default/assets/hareruya/js/hareruya-checkout.js:1"],
                "implementationActual": "店頭受取判定と注意文表示はあるが、備考欄は常時描画され、問い合わせフォーム誘導エリアは未検出。",
                "traceVerdict": "DRIFT",
                "traceReason": "設計が要求する二つの表示切替のうち、備考欄非表示と問い合わせ誘導表示が実装されていない。"
            }
        ],
        "implementationRefs": [
            "src/Eccube/Resource/template/default/Shopping/index.twig:128",
            "src/Eccube/Resource/template/default/Shopping/index.twig:374-385",
            "src/Eccube/Resource/template/default/Shopping/index.twig:557-678",
            "html/template/default/assets/hareruya/js/hareruya-checkout.js:1",
            "src/Eccube/Resource/locale/messages.ja.yaml:1412-1415",
            "src/Eccube/Resource/locale/messages.ja.yaml:1484-1485"
        ],
        "implementationSnippets": [
            "128: {% set isDeliveryOTC = delivery.id is defined and delivery.id in constant('Eccube\\\\Entity\\\\Delivery::OTC_GROUP') %}",
            "374-385: isDeliveryOTC では pickup_today と front.shopping.otc_notice.* だけを表示",
            "557-678: 備考欄 section と message textarea は isDeliveryOTC 条件の外で描画",
            "hareruya-checkout.js: data-js-shipping-remarks は配置移動のみで、店頭受取条件による非表示処理はない"
        ],
        "implementationSearches": [
            "rg -n \"お問合せフォームはこちら|お問い合わせフォームはこちら|問合せフォーム|お問い合わせフォーム|path\\('contact|url\\('contact|front\\.contact\" src/Eccube/Resource/template/default src/Eccube/Resource/locale/messages.ja.yaml",
            "rg -n \"shipping-remarks|data-js-shipping-remarks|isDeliveryOTC|pickup_today|otc_notice|contact\" src/Eccube/Resource/template/default/Shopping html/template/default/assets/hareruya/js"
        ],
        "absenceConclusion": "注文方法指定画面内には、店頭受取時だけ表示される問い合わせフォーム誘導エリアが未検出。contact ルート自体は存在するが、F04-02 の画面条件分岐としては使われていない。",
        "evidence": "設計HTML:1253-1258 は店頭受取系で備考欄非表示・お問合せフォームエリア表示、通常配送で逆条件を定義。設計HTML:1702 も問い合わせフォームへの誘導を明記。Shopping/index.twig:128 は isDeliveryOTC を設定し、:374-385 は店頭受取注意文を表示するが、:557-678 の備考欄 section は isDeliveryOTC 条件外。hareruya-checkout.js:1 の data-js-shipping-remarks 処理はレスポンシブ配置移動のみ。Shopping/index.twig 内に contact ルートリンクや「お問合せフォームはこちら」エリアは見つからない。",
    },
    {
        "functionId": "m03-01_0204_sheet-4_sheet",
        "dimension": "⑤画面表示・ラベル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0204_基本設計仕様書(商品管理).html:1388",
        "designQuote": "識別ID:12 のラベルは「表示データ切替え」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2209 / src/Eccube/Resource/template/admin/Product/index.twig:529",
        "difference": "設計は商品一覧の表示データ選択ラベルを「表示データ切替え」とする。実装は Product/index.twig で admin.product.list_display_data__title を表示し、messages.ja.yaml の値が「表示データ切り替え」になっているため、漢字表記の「切替え」とひらがな混じりの「切り替え」で画面ラベルが一致しない。",
        "designExpectation": "商品一覧の表示データ選択ラベルは「表示データ切替え」。",
        "implementationActual": "実装の翻訳キー admin.product.list_display_data__title は「表示データ切り替え」。Product/index.twig がこのキーを label として表示する。",
        "comparisonRows": [
            {
                "item": "ラベル文言",
                "design": "表示データ切替え",
                "implementation": "表示データ切り替え",
                "mismatch": "設計は「切替え」、実装は「切り替え」で表記が一致しない。"
            }
        ],
        "mismatchReason": "設計HTMLの項目表と実装の日本語翻訳値でラベル表記が異なる。",
        "impact": "商品一覧画面の表示ラベルが設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2209",
        "requiredChange": "admin.product.list_display_data__title の日本語文言を設計に合わせて「表示データ切替え」に修正する。",
        "evidence": "設計HTML:1388 は項目ラベルを「表示データ切替え」と定義。Product/index.twig:529 は admin.product.list_display_data__title を表示。messages.ja.yaml:2209 の翻訳値は「表示データ切り替え」。",
    },
    {
        "functionId": "m08-01_0207_sheet-3_sheet",
        "dimension": "⑤画面表示・エラーメッセージ文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:1147",
        "designQuote": "検索パターン名未入力時の表示文言は「検索パターン名を入力してください。」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:1756 / src/Eccube/Controller/Admin/SearchControllerTrait.php:246-247",
        "difference": "設計は会員検索一覧で検索パターン名未入力時のエラー文言を「検索パターン名を入力してください。」とする。実装は SearchControllerTrait で admin.common.save_pattern.error.name_empty を addError し、messages.ja.yaml の値が「検索パターン名を入力して下さい。」になっているため、「ください」と「下さい」で表記が一致しない。",
        "designExpectation": "検索パターン名未入力時は「検索パターン名を入力してください。」を表示する。",
        "implementationActual": "実装の共通翻訳キー admin.common.save_pattern.error.name_empty は「検索パターン名を入力して下さい。」。SearchControllerTrait が会員検索を含む共通検索パターン保存でこのキーを表示する。",
        "comparisonRows": [
            {
                "item": "エラーメッセージ文言",
                "design": "検索パターン名を入力してください。",
                "implementation": "検索パターン名を入力して下さい。",
                "mismatch": "設計はひらがな「ください」、実装は漢字「下さい」で表記が一致しない。"
            }
        ],
        "mismatchReason": "設計HTMLの表示メッセージ表と実装の日本語翻訳値で表記が異なる。",
        "impact": "会員検索一覧のエラーメッセージが設計書・文言仕様と一致しない。共通キーのため他画面にも同表記が波及する可能性がある。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:1756",
        "requiredChange": "admin.common.save_pattern.error.name_empty の日本語文言を設計に合わせて「検索パターン名を入力してください。」に修正する。",
        "evidence": "設計HTML:1147 は表示文言を「検索パターン名を入力してください。」と定義。SearchControllerTrait.php:246-247 は未入力時に admin.common.save_pattern.error.name_empty を addError。messages.ja.yaml:1756 の翻訳値は「検索パターン名を入力して下さい。」。",
    },
    {
        "functionId": "m03-11_0204_sheet-25_sheet",
        "dimension": "⑤画面表示・ラベル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0204_基本設計仕様書(商品管理).html:6157",
        "designQuote": "識別ID:8 のラベルは「フロント非表示フラグ」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2108 / src/Eccube/Form/Type/Admin/CategoryType.php:64-65 / src/Eccube/Resource/template/admin/Product/category.twig:275-276",
        "difference": "設計はカテゴリ登録画面の識別ID:8を「フロント非表示フラグ」と表示する。実装は CategoryType の front_search_hide_flg の label に admin.product.category_front_search_hide を使い、messages.ja.yaml でその値が「フロント非表フラグ」になっているため、画面ラベルが「非表示」ではなく「非表」と表示される。",
        "designExpectation": "カテゴリ登録画面のフロント表示制御チェック項目は「フロント非表示フラグ」と表示する。",
        "implementationActual": "実装の翻訳キー admin.product.category_front_search_hide は「フロント非表フラグ」。CategoryType がこのキーを front_search_hide_flg のラベルに使い、category.twig が form_label で表示する。",
        "comparisonRows": [
            {
                "item": "ラベル文言",
                "design": "フロント非表示フラグ",
                "implementation": "フロント非表フラグ",
                "mismatch": "「非表示」の「示」が欠落しており、設計書のラベル名と画面表示が一致しない。"
            }
        ],
        "mismatchReason": "設計の項目表は「フロント非表示フラグ」だが、実装の日本語翻訳値が「フロント非表フラグ」になっている。",
        "impact": "管理画面の商品管理 > カテゴリ登録で、設計書・手順書・CSV列名と画面ラベルが一致せず、利用者が項目名を誤認する可能性がある。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2108",
        "requiredChange": "admin.product.category_front_search_hide の日本語文言を「フロント非表示フラグ」に修正する。",
        "evidence": "設計HTML:6157 は項目ラベルを「フロント非表示フラグ」と定義。CategoryType.php:64-65 は front_search_hide_flg の label に admin.product.category_front_search_hide を指定。category.twig:275-276 は form_label でその翻訳値を表示。messages.ja.yaml:2108 の翻訳値は「フロント非表フラグ」。",
    },
    {
        "functionId": "m03-11_0204_sheet-25_sheet",
        "dimension": "⑤画面表示・ラベル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0204_基本設計仕様書(商品管理).html:6165",
        "designQuote": "識別ID:16 のラベルは「検索パラメータ」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2115 / src/Eccube/Form/Type/Admin/CategoryType.php:131-133 / src/Eccube/Resource/template/admin/Product/category.twig:369",
        "difference": "設計はカテゴリ登録画面の検索パラメータ項目を「検索パラメータ」と表示する。実装は CategoryType の search_parameters の label に admin.product.category_search_parameters を使い、messages.ja.yaml の値が「検索パラメーター」になっているため、長音符の有無が一致しない。",
        "designExpectation": "カテゴリ登録画面の検索パラメータ項目は「検索パラメータ」と表示する。",
        "implementationActual": "実装の翻訳キー admin.product.category_search_parameters は「検索パラメーター」。CategoryType が search_parameters のラベルに使い、category.twig が form_row で表示する。",
        "comparisonRows": [
            {
                "item": "ラベル文言",
                "design": "検索パラメータ",
                "implementation": "検索パラメーター",
                "mismatch": "設計は末尾に長音符なし、実装は「メーター」で長音符あり。"
            }
        ],
        "mismatchReason": "設計HTMLの項目表と実装の日本語翻訳値でラベル表記が異なる。",
        "impact": "カテゴリ登録画面の項目名が設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2115",
        "requiredChange": "admin.product.category_search_parameters の日本語文言を設計に合わせて「検索パラメータ」に修正する。",
        "evidence": "設計HTML:6165 は項目ラベルを「検索パラメータ」と定義。CategoryType.php:131-133 は search_parameters の label に admin.product.category_search_parameters を指定。category.twig:369 は form_row で表示。messages.ja.yaml:2115 の翻訳値は「検索パラメーター」。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "⑤画面表示・ボタン文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4885",
        "designQuote": "識別ID:6-17 のボタン文言は「商品の追加」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2464 / src/Eccube/Resource/template/admin/Order/edit.twig:1147,1152",
        "difference": "設計は受注情報編集の商品検索ダイアログを開くボタンを「商品の追加」とする。実装は Order/edit.twig で admin.order.add_product_item を表示し、messages.ja.yaml の値が「商品を追加」になっているため、助詞と語順が一致しない。",
        "designExpectation": "受注情報編集画面の商品追加ボタンは「商品の追加」。",
        "implementationActual": "実装の翻訳キー admin.order.add_product_item は「商品を追加」。Order/edit.twig のボタンとモーダルタイトルで同じキーを表示する。",
        "comparisonRows": [
            {
                "item": "ボタン文言",
                "design": "商品の追加",
                "implementation": "商品を追加",
                "mismatch": "設計は名詞句「商品の追加」、実装は動詞句「商品を追加」。"
            }
        ],
        "mismatchReason": "設計HTMLの項目表と実装の日本語翻訳値でボタン文言が異なる。",
        "impact": "受注情報編集画面のボタン名が設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2464",
        "requiredChange": "admin.order.add_product_item の日本語文言を設計に合わせて「商品の追加」に修正する。モーダルタイトルも同じキーを使うため表示影響を確認する。",
        "evidence": "設計HTML:4885 はボタン文言を「商品の追加」と定義。Order/edit.twig:1147 と :1152 は admin.order.add_product_item を表示。messages.ja.yaml:2464 の翻訳値は「商品を追加」。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "⑤画面表示・ラベル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4895",
        "designQuote": "識別ID:6-27 のラベルは「お支払合計」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2478 / src/Eccube/Resource/template/admin/Order/edit.twig:1214-1216",
        "difference": "設計は受注情報編集の支払合計ラベルを「お支払合計」とする。実装は Order/edit.twig で admin.order.payment_total を表示し、messages.ja.yaml の値が「お支払い合計」になっているため、送り仮名の有無が一致しない。",
        "designExpectation": "受注情報編集画面の支払合計ラベルは「お支払合計」。",
        "implementationActual": "実装の翻訳キー admin.order.payment_total は「お支払い合計」。Order/edit.twig が支払合計行のラベルとして表示する。",
        "comparisonRows": [
            {
                "item": "ラベル文言",
                "design": "お支払合計",
                "implementation": "お支払い合計",
                "mismatch": "設計は「支払」、実装は送り仮名ありの「支払い」。"
            }
        ],
        "mismatchReason": "設計HTMLの項目表と実装の日本語翻訳値でラベル表記が異なる。",
        "impact": "受注情報編集画面の金額ラベルが設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2478",
        "requiredChange": "admin.order.payment_total の日本語文言を設計に合わせて「お支払合計」に修正する。共通キーの場合は他画面への影響を確認する。",
        "evidence": "設計HTML:4895 はラベルを「お支払合計」と定義。Order/edit.twig:1214-1216 は admin.order.payment_total を表示。messages.ja.yaml:2478 の翻訳値は「お支払い合計」。",
    },
    {
        "functionId": "m03-01_0204_sheet-3_sheet",
        "dimension": "⑤画面表示・検索条件ラベル",
        "severity": "low",
        "designRef": "excel_to_html/output/0204_基本設計仕様書(商品管理).html:1081",
        "designQuote": "検索条件の項目名は「プロモ」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2161 / src/Eccube/Form/Type/Admin/SearchProductType.php:185,196 / src/Eccube/Resource/template/admin/Product/index.twig:307",
        "difference": "設計は商品マスター検索入力の検索条件ラベルを「プロモ」とする。実装は SearchProductType の promotion ラベルに admin.product.promotion を使い、messages.ja.yaml の値が「プロモ種別」になっているため、画面ラベルが設計より長い名称になる。",
        "designExpectation": "商品マスター検索入力のプロモーション検索条件は「プロモ」と表示する。",
        "implementationActual": "実装の翻訳キー admin.product.promotion は「プロモ種別」。SearchProductType が promotion の label に使い、Product/index.twig が form_label(searchForm.promotion) で表示する。",
        "comparisonRows": [
            {
                "item": "検索条件ラベル",
                "design": "プロモ",
                "implementation": "プロモ種別",
                "mismatch": "設計は「プロモ」、実装は「種別」を付けた「プロモ種別」。"
            }
        ],
        "mismatchReason": "設計HTMLの検索条件項目名と実装の日本語翻訳値でラベルが異なる。",
        "impact": "商品マスター検索入力画面の検索条件名が設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2161",
        "requiredChange": "admin.product.promotion の日本語文言を設計に合わせて「プロモ」に修正する。カード詳細側の別キー admin.card_detail.promotion_type とは別扱いで確認する。",
        "evidence": "設計HTML:1081 は検索条件項目名を「プロモ」と定義。SearchProductType.php:185 と :196 は promotion の label に admin.product.promotion を指定。Product/index.twig:307 は form_label(searchForm.promotion) を表示。messages.ja.yaml:2161 の翻訳値は「プロモ種別」。",
    },
    {
        "functionId": "m04-24_0202_sheet-32_sheet",
        "dimension": "⑤画面表示・ラベル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:4343",
        "designQuote": "検索条件の項目名は「送り状No.」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:5228 / src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:35 / src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:194,262",
        "difference": "設計は在庫移動指示検索で送り状番号の項目名を「送り状No.」とする。実装は admin.stock.move_instruction.tracking_no の翻訳値が「送り状No」で、一覧ヘッダと登録モーダルラベルにそのキーを表示するため、末尾のピリオドが欠落する。",
        "designExpectation": "在庫移動指示検索の送り状番号項目は「送り状No.」と表示する。",
        "implementationActual": "実装の翻訳キー admin.stock.move_instruction.tracking_no は「送り状No」。stock_move_instruction_index.twig の一覧ヘッダと登録モーダルラベルがこのキーを表示する。",
        "comparisonRows": [
            {
                "item": "ラベル文言",
                "design": "送り状No.",
                "implementation": "送り状No",
                "mismatch": "設計は末尾にピリオドあり、実装はピリオドなし。"
            }
        ],
        "mismatchReason": "設計HTMLの項目名と実装の翻訳値で記号の有無が異なる。同じ在庫移動指示CSV系の翻訳キーは「送り状No.」で揃っているため、このキーだけ表記がずれている。",
        "impact": "在庫移動指示検索・登録モーダルの項目名が設計書およびCSV列名と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:5228",
        "requiredChange": "admin.stock.move_instruction.tracking_no の日本語文言を設計に合わせて「送り状No.」に修正する。",
        "evidence": "設計HTML:4343 は項目名を「送り状No.」と定義。stock_move_instruction_index.twig:194 と :262 は admin.stock.move_instruction.tracking_no を表示。messages.ja.yaml:5228 の翻訳値は「送り状No」。",
    },
    {
        "functionId": "m04-09_0202_sheet-15_sheet",
        "dimension": "⑤画面表示・リンク文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:6410",
        "designQuote": "フッターリンクは「在庫移動・振替検索一覧」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:4737 / src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:228 / src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:186",
        "difference": "設計は在庫移動・振替登録編集（振替）のフッターリンクを「在庫移動・振替検索一覧」とする。実装は admin.stock.transfer.back_to_list の翻訳値が「在庫振替検索一覧へ」で、transfer_approval.twig と transfer_complete.twig がそのキーを表示するため、「移動・」がなく末尾に「へ」が付く。",
        "designExpectation": "振替画面の一覧戻りリンクは「在庫移動・振替検索一覧」。",
        "implementationActual": "実装の翻訳キー admin.stock.transfer.back_to_list は「在庫振替検索一覧へ」。承認画面と完了画面のフッターリンクで表示される。",
        "comparisonRows": [
            {
                "item": "リンク文言",
                "design": "在庫移動・振替検索一覧",
                "implementation": "在庫振替検索一覧へ",
                "mismatch": "実装は「移動・」が欠落し、設計にない「へ」が末尾に付く。"
            }
        ],
        "mismatchReason": "設計HTMLのフッター項目名と実装の日本語翻訳値でリンク文言が異なる。",
        "impact": "在庫移動・振替系の画面遷移先名称が設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:4737",
        "requiredChange": "admin.stock.transfer.back_to_list の日本語文言を設計に合わせて「在庫移動・振替検索一覧」に修正する。リンク文言として「へ」が必要かは設計側へ確認する。",
        "evidence": "設計HTML:6410 はフッターリンクを「在庫移動・振替検索一覧」と定義。transfer_approval.twig:228 と transfer_complete.twig:186 は admin.stock.transfer.back_to_list を表示。messages.ja.yaml:4737 の翻訳値は「在庫振替検索一覧へ」。",
    },
    {
        "functionId": "m04-12_0202_sheet-17_sheet",
        "dimension": "⑤画面表示・一覧列見出し",
        "severity": "low",
        "designRef": "excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:7330",
        "designQuote": "一覧列見出しは「分割元 / 結合先商品名」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:4878 / src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:312",
        "difference": "設計は在庫分割結合検索一覧の結果列を「分割元 / 結合先商品名」とする。実装は stock_split_join_index.twig で admin.stock.split_join.list.source_destination_product を表示し、messages.ja.yaml の値が「分割元・結合先商品」になっているため、区切り記号と末尾の「名」が一致しない。",
        "designExpectation": "在庫分割結合検索一覧の結果列見出しは「分割元 / 結合先商品名」。",
        "implementationActual": "実装の翻訳キー admin.stock.split_join.list.source_destination_product は「分割元・結合先商品」。stock_split_join_index.twig が一覧ヘッダとして表示する。",
        "comparisonRows": [
            {
                "item": "一覧列見出し",
                "design": "分割元 / 結合先商品名",
                "implementation": "分割元・結合先商品",
                "mismatch": "設計はスラッシュ区切りで「商品名」まで含む。実装は中黒区切りで「商品」止まり。"
            }
        ],
        "mismatchReason": "設計HTMLの結果一覧列名と実装の日本語翻訳値で列見出しが異なる。",
        "impact": "在庫分割結合検索一覧の列名が設計書・画面仕様と一致しない。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:4878",
        "requiredChange": "admin.stock.split_join.list.source_destination_product の日本語文言を設計に合わせて「分割元 / 結合先商品名」に修正する。",
        "evidence": "設計HTML:7330 は列見出しを「分割元 / 結合先商品名」と定義。stock_split_join_index.twig:312 は admin.stock.split_join.list.source_destination_product を表示。messages.ja.yaml:4878 の翻訳値は「分割元・結合先商品」。",
    },
    {
        "functionId": "m08-05_0207_sheet-12_sheet",
        "dimension": "⑤画面表示・タイトル文言",
        "severity": "low",
        "designRef": "excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:2992",
        "designQuote": "シート見出しは「ポイント付与（余剰入金へのご返金、注文金額変更によるご返金」。",
        "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:2780 / src/Eccube/Controller/Admin/Customer/CustomerPointController.php:108-110",
        "difference": "設計のシート見出しと監査台帳上の機能名は「注文金額変更によるご返金」とする。実装は CustomerPointController が admin.customer.point_update.purchase を画面タイトル用キーとして選択し、messages.ja.yaml の値が「注文金額変更によるご送金」になっているため、返金と送金で意味が異なる。なお同じHTMLシート内の機能名欄には「ご送金」表記もあり、設計側にも表記揺れがある。",
        "designExpectation": "ポイント付与（余剰入金へのご返金、注文金額変更によるご返金）として表示する。",
        "implementationActual": "実装の翻訳キー admin.customer.point_update.purchase は「ポイント履歴追加（余剰入金へのご返金、注文金額変更によるご送金）」。CustomerPointController が通常付与以外のポイント履歴追加でこのキーを使う。",
        "comparisonRows": [
            {
                "item": "タイトル文言",
                "design": "注文金額変更によるご返金",
                "implementation": "注文金額変更によるご送金",
                "mismatch": "「返金」と「送金」で業務意味が異なる。"
            },
            {
                "item": "設計内表記揺れ",
                "design": "シート見出しは「ご返金」、機能名欄には「ご送金」も存在",
                "implementation": "ご送金",
                "mismatch": "設計内の揺れを解消したうえで、正となる画面タイトルを確定する必要がある。"
            }
        ],
        "mismatchReason": "設計HTMLのシート見出し・監査台帳名と実装の日本語翻訳値で、返金/送金の業務語が異なる。",
        "impact": "ポイント履歴追加画面のタイトルが、返金処理なのか送金処理なのか利用者に異なる意味で伝わる可能性がある。",
        "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:2780 / excel_to_html/output/0207_基本設計仕様書(会員管理機能).html:3004",
        "requiredChange": "設計の正表記を「ご返金」へ統一する場合は admin.customer.point_update.purchase を「ポイント履歴追加（余剰入金へのご返金、注文金額変更によるご返金）」に修正する。設計側の機能名欄の揺れも同時に解消する。",
        "evidence": "設計HTML:2992 はシート見出しを「...ご返金」と表示。設計HTML:3004 には「...ご送金」も存在。CustomerPointController.php:108-110 は admin.customer.point_update.purchase を選択。messages.ja.yaml:2780 の翻訳値は「...ご送金」。messages.ja.yaml:2787-2788 の内訳キーはどちらも「ご返金」。",
    },
    {
        "functionId": "a05-01_0505_sheet-3_sheet",
        "dimension": "④DBカラム・DB操作",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:312",
        "designQuote": "DB操作節は本機能を参照系とし、DBへの登録・更新・削除は行わないとする。",
        "implRef": "src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87,90,99",
        "difference": "設計のDB操作節は注文印刷APIを参照系としているが、実装はSetResponseで受注を更新し、印刷済み相当の日時を保存する。既存の日時列差分に加え、DB更新の有無そのものが設計節と衝突している。",
        "impact": "API利用時に設計上は副作用なしと読める処理が受注を更新するため、再実行性・監査・障害時リカバリの前提がずれる。",
        "evidence": "codex_review.md の再監査で確認。UpdatePrintedOrderStatusAction.php:87-99 に更新処理がある。",
    },
    {
        "functionId": "a05-02_0505_sheet-4_sheet",
        "dimension": "④DBカラム・DB操作",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html:311-313",
        "designQuote": "DB操作節はDBへの登録・更新・削除は行わない、検索のみとする。",
        "implRef": "src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87,90,93,96,99",
        "difference": "設計のDB操作節は検索のみとするが、実装は印刷応答後に受注へ日時を設定してflushする。処理フロー側の更新要求とも設計内で揺れており、実装者はどの節を正にするか確認が必要。",
        "impact": "プリンタ連携の再送・重複実行時に、設計より早いタイミングで受注状態が変わる可能性がある。",
        "evidence": "codex_review.md の再監査で確認。UpdatePrintedOrderStatusAction.php:87-99 が更新経路。",
    },
    {
        "functionId": "a05-04_0505_sheet-6_sheet",
        "dimension": "⑪ログ・監査",
        "severity": "high",
        "designRef": "function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:292",
        "designQuote": "連携用ヘッダ/Cookieの完全値をログ出力しない。",
        "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:44,52",
        "difference": "設計は連携ヘッダとCookieの完全値をログに出さないことを要求するが、実装は受信時・認証失敗時にheadersとcontentをログ出力する。X_access_token、Cookie、秘密ヘッダが混入し得る。",
        "impact": "認証情報や連携ペイロードがログへ残り、運用者・ログ基盤経由の情報漏えいリスクになる。",
        "evidence": "WebhookController.php:44 と :52 のログ出力を再確認。",
    },
    {
        "functionId": "a05-04_0505_sheet-6_sheet",
        "dimension": "⑦エラー処理・応答",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:257",
        "designQuote": "取引ヘッダ不足はエラーとして扱う。",
        "implRef": "src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89 / src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47 / src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:104",
        "difference": "設計は取引ヘッダ不足をエラー扱いにするが、実装はtransactionHeadIds欠落時に後段で警告してreturnし、受信時点のHTTP応答は200になり得る。",
        "impact": "スマレジ側から見ると成功扱いになり、欠落イベントの再送・障害検知が設計どおり働かない可能性がある。",
        "evidence": "TransactionEventDispatcher.php:89、CreatedHandler.php:47、SmaregiWebhookEventMessageHandler.php:104 を確認。",
    },
    {
        "functionId": "a05-04_0505_sheet-6_sheet",
        "dimension": "⑫排他制御・トランザクション",
        "severity": "low",
        "designRef": "function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:297",
        "designQuote": "明示的な悲観/楽観ロックなしとする。",
        "implRef": "src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:99 / src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:132",
        "difference": "設計は明示ロックなしとするが、実装は会員ポイント更新でトランザクションとPESSIMISTIC_WRITEを使う。",
        "impact": "高並行時の待機・デッドロック・再試行条件が設計と異なる。",
        "evidence": "SmaregiOrderPointApplier.php:99 と SmaregiPointAdjustmentApplier.php:132 を確認。",
    },
    {
        "functionId": "m03-33_0204_sheet-50_csv",
        "dimension": "⑤画面表示・CSVフォーマット表",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html:233-235",
        "designQuote": "設計は7列のCSVフォーマット表示を要求する。",
        "implRef": "src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:83-88 / src/Eccube/Resource/template/admin/Product/Csv/base_csv_upload.twig:95-107",
        "difference": "設計は7列のフォーマット表を表示するが、実装はheaders配列5列をbase_csv_upload.twigで描画するため、画面上のフォーマット表も5行しか表示されない。",
        "impact": "利用者が設計上必要な買取価格・スマレジ連携フラグ列を画面で確認できず、CSV作成時に列不足を見落とす。",
        "evidence": "ProductSaleHighPriceCsvController.php:83-88 と base_csv_upload.twig:95-107 を確認。",
    },
    {
        "functionId": "m03-33_0204_sheet-50_csv",
        "dimension": "⑧CSV入出力・取込列定義",
        "severity": "high",
        "designRef": "function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html:238-239",
        "designQuote": "ヘッダ列名および列順は取込ハンドラが期待する日本語列名と揃える。",
        "implRef": "src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:51-55,165-173",
        "difference": "設計は買取価格とスマレジ連携フラグを含む列定義を要求するが、実装の取込ハンドラも商品コード/販売価格/セールフラグ/帯URL/タグ(ID)の5列だけを期待しており、設計列を取り込まない。",
        "impact": "CSV雛形だけでなく実取込処理でも設計列が無視されるため、価格更新・外部連携フラグ更新が実行されない。",
        "evidence": "SaleHighPriceImportHandler.php:51-55 と :165-173 を確認。",
    },
    {
        "functionId": "m05-06_0203_sheet-9_sheet",
        "dimension": "④DBカラム・送信履歴",
        "severity": "low",
        "designRef": "function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:221",
        "designQuote": "移行先履歴紐付けにcreator_idを含める。",
        "implRef": "src/Eccube/Service/MailService.php:2092,2107,2115,2122",
        "difference": "設計は送信履歴へ操作会員creator_idを紐付ける前提だが、実装はsaveUserMailHistory()に操作会員を渡さず、既定値nullのままsetCreator($creator)する。",
        "impact": "一括メール送信履歴から実行した管理者を追跡できない。",
        "evidence": "MailService.php:2092,2107,2115,2122 を確認。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "②業務ルール・DB更新",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244,246",
        "designQuote": "登録経路では未出荷の配送に出荷日時、status_change経路では受注および全配送に出荷日時を設定する。",
        "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:623-628,775-779",
        "difference": "設計は経路ごとに出荷日時更新対象を分けるが、実装は登録経路でShippingのみ、status_change経路でOrderとShippingを更新する。出荷完了へ変更する入口によってdtb_order.shipping_dateの更新有無が変わる。",
        "impact": "一覧・検索・帳票が受注本体の出荷日を参照する場合、登録経路で出荷完了にした注文だけ未設定として扱われる。",
        "evidence": "EditController.php:623-628 と :775-779 を確認。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "⑦エラー処理・ステータス遷移",
        "severity": "med",
        "designRef": "function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html:150-151,292",
        "designQuote": "許可されない遷移先は受注編集画面を再表示し、ステータス変更不可エラーを表示する。",
        "implRef": "src/Eccube/Form/Type/Admin/OrderType.php:523-531 / src/Eccube/Controller/Admin/Order/EditController.php:768-769",
        "difference": "設計は不許可遷移時に編集画面再表示とエラー表示を要求するが、実装はOrderTypeでフォームエラーを付けた後、tryCommitOrderStatusChange()の!$form->isValid()でリダイレクトするため、インラインエラーが失われる可能性が高い。",
        "impact": "不正なステータス遷移を送信した利用者が、何が不許可だったか画面上で確認できない。",
        "evidence": "OrderType.php:523-531 と EditController.php:768-769 を確認。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "⑤画面表示・メッセージ",
        "severity": "low",
        "designRef": "function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html:142-144",
        "designQuote": "admin.order.cancel.complete の英語表示は '-' とする。",
        "implRef": "src/Eccube/Resource/locale/messages.en.yaml:2361",
        "difference": "設計は英語ロケール資源なしとして '-' を定義するが、実装には英語文言 'Order cancellation completed.' が存在する。",
        "impact": "英語管理画面・英語ログ確認時の表示が設計書と異なる。",
        "evidence": "messages.en.yaml:2361 を確認。",
    },
    {
        "functionId": "m05-11_0203_sheet-15_sheet",
        "dimension": "⑤画面入力・出荷用メモ",
        "severity": "high",
        "designRef": "function_spec_html_preview/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.html:241,260",
        "designQuote": "GET/POST /order/new でも出荷情報ブロックに空の出荷用メモ欄を表示・保存する。",
        "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:146-149 / src/Eccube/Resource/template/admin/Order/edit.twig:1579-1776 / src/Eccube/Form/Type/Admin/ShippingType.php:207-212",
        "difference": "設計は受注新規登録画面でも出荷用メモの表示・入力・保存を要求するが、実装は新規/編集共通のedit.twigにform.Shipping.noteを描画していない。ShippingTypeにはnoteがあるが画面に入口がない。",
        "impact": "新規受注登録時に出荷用メモを入力できず、設計上保存されるべき出荷情報が欠落する。",
        "evidence": "EditController.php:146-149、edit.twig:1579-1776、ShippingType.php:207-212 を確認。",
    },
    {
        "functionId": "m05-24_0203_sheet-11_csv",
        "dimension": "⑤画面表示・ボタン文言",
        "severity": "low",
        "designRef": "function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:222",
        "designQuote": "画面上のボタン文言は admin.order.output_labels_Export = 送り状出力。",
        "implRef": "src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130 / src/Eccube/Resource/locale/messages.ja.yaml:2450,5236",
        "difference": "受注一覧側は設計どおりだが、出荷指示編集画面では admin.stock.move_instruction.csv_download_invoice = 送り状CSVダウンロード を使用しており、設計のボタン文言と異なる。",
        "impact": "同一機能の画面間でボタン名が揺れ、手順書・教育資料と画面表示が一致しない。",
        "evidence": "ShippingStandby/edit.twig:130、messages.ja.yaml:2450,5236 を確認。",
    },
    {
        "functionId": "m05-24_0203_sheet-23_csv",
        "dimension": "③バリデーション・処理フロー",
        "severity": "low",
        "designRef": "function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:236",
        "designQuote": "キー一覧を整数IDの並びとして解釈する。",
        "implRef": "src/Eccube/Controller/Admin/Order/OrderCsvController.php:202-213 / src/Eccube/Repository/OrderRepository.php:1460-1461",
        "difference": "設計はキー一覧を整数IDとして扱うが、実装はarray_keys($rawOrderIds)を整数キャストせず、そのままDQLのo IN (:orders)へ渡す。",
        "impact": "不正なキーや数値文字列の扱いが設計より曖昧になり、入力検証の責務がDB/ORM側へ流れる。",
        "evidence": "OrderCsvController.php:202-213 と OrderRepository.php:1460-1461 を確認。",
    },
    {
        "functionId": "m05-26_0203_sheet-25_csv",
        "dimension": "③バリデーション・注文番号突合",
        "severity": "med",
        "designRef": "function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html:69,98",
        "designQuote": "sprintfで桁埋めされた注文番号でサブ注文情報を検索する。",
        "implRef": "src/Eccube/Service/Csv/OrderCsv.php:112",
        "difference": "設計は桁埋め済み注文番号でサブ注文情報を検索するが、実装はCSV値をそのままorder_numberにfindOneByしており、桁埋めもサブ注文検索も行わない。",
        "impact": "CSV上の注文番号フォーマットが設計と異なる場合、既存注文を見つけられず出荷実績登録が失敗する。",
        "evidence": "OrderCsv.php:112 を確認。",
    },
]


def norm_ref(ref):
    return re.sub(r"\s+", "", ref or "")


def stable_id(function_id, finding, index):
    seed = f"{function_id}:{finding.get('dimension')}:{finding.get('designRef')}:{finding.get('implRef')}:{finding.get('difference')}"
    slug = re.sub(r"[^a-z0-9]+", "-", function_id.lower()).strip("-")
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:10]
    return f"{slug}-{digest}-{index:02d}"


def split_refs(ref):
    if not ref or ref == "不在":
        return []
    text = ref.replace("`", "")
    patterns = [
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?src/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css):\d+(?:-\d+)?(?:,\d+)*",
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?app/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css):\d+(?:-\d+)?(?:,\d+)*",
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?html/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css):\d+(?:-\d+)?(?:,\d+)*",
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?src/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css)",
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?app/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css)",
        r"(?:/home/y-saito/Developments/ec-cube-enterprise/)?html/[A-Za-z0-9_./-]+\.(?:php|twig|yaml|yml|js|css)",
    ]
    refs = []
    for pat in patterns:
        refs.extend(re.findall(pat, text))
    if refs:
        return list(dict.fromkeys(refs))
    return [text.strip()] if text.strip() else []


def first_line_number(ref):
    if not ref:
        return None
    m = re.search(r":(\d+)", ref)
    if m:
        return int(m.group(1))
    return None


def resolve_design_path(ref):
    if not ref:
        return None, None
    ref = ref.strip().strip("`")
    if "#" in ref and ":" not in ref.rsplit("#", 1)[-1]:
        path_text, anchor = ref.split("#", 1)
        path = DOCS_ROOT / path_text
        if path.exists():
            needle = f'id="{anchor}"'
            for idx, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if needle in line:
                    return path, idx
        return path, None
    m = re.match(r"(.+?):(\d+)", ref)
    if not m:
        return DOCS_ROOT / ref, None
    path_text, line_text = m.group(1), m.group(2)
    path = Path(path_text)
    if not path.is_absolute():
        path = DOCS_ROOT / path_text
    return path, int(line_text)


def file_excerpt(path, line=None, radius=3):
    # line/None を先に見る。designRef/implRef に説明文が混じり得るため、
    # 長すぎる/不正なパスでの stat 例外(File name too long 等)を握りつぶす。
    if line is None or not path:
        return ""
    try:
        if not path.exists():
            return ""
    except OSError:
        return ""
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    start = max(1, line - radius)
    end = min(len(lines), line + radius)
    try:
        rel = path.relative_to(WORKSPACE)
    except ValueError:
        rel = path
    body = []
    for n in range(start, end + 1):
        body.append(f"{n}: {lines[n - 1]}")
    return f"{rel}:{line}\n" + "\n".join(body)


def design_excerpt(ref):
    path, line = resolve_design_path(ref)
    return file_excerpt(path, line, radius=3)


def resolve_impl_path(ref):
    ref = ref.strip().strip("`")
    if ref.startswith("/"):
        if re.search(r":\d+", ref):
            path_text, _, line_text = ref.rpartition(":")
        else:
            path_text, line_text = ref, "1"
        path = Path(path_text)
    else:
        m = re.match(r"(.+?):(\d+)", ref)
        if m:
            path = IMPL_ROOT / m.group(1)
            line_text = m.group(2)
        else:
            path = IMPL_ROOT / ref
            line_text = "1"
    if path.exists() and line_text == "1":
        class_name = path.stem
        try:
            for idx, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if re.search(rf"\b(class|final class|interface|trait)\s+{re.escape(class_name)}\b", line):
                    line_text = str(idx)
                    break
        except Exception:
            pass
    try:
        return path, int(re.match(r"\d+", line_text).group(0))
    except Exception:
        return None, None


def code_excerpt(ref, radius=3):
    path, line = resolve_impl_path(ref)
    if not path or not path.exists():
        return ""
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    start = max(1, line - radius)
    end = min(len(lines), line + radius)
    rel = path
    try:
        rel = path.relative_to(IMPL_ROOT)
    except ValueError:
        pass
    body = []
    for n in range(start, end + 1):
        body.append(f"{n}: {lines[n - 1]}")
    return f"{rel}:{line}\n" + "\n".join(body)


def clean_claim(text, limit=260):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    text = re.sub(r" / 旧根拠:.*$", "", text)
    if len(text) > limit:
        return text[:limit - 1] + "…"
    return text


ABSENCE_EVIDENCE = {
    "m04-06_0202_sheet-10_csv": {
        "refs": [
            "src/Eccube/Controller/Admin/Stock/StockJoinController.php:957",
            "src/Eccube/Controller/Admin/Stock/StockJoinController.php:973",
            "src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:68",
        ],
        "searches": [
            "rg -n 'stock.*short|short.*stock|在庫切れ|shortage' src/Eccube/Controller/Admin/Stock src/Eccube/Service src/Eccube/Resource/template/admin",
            "近似ヒットは在庫分割結合/移動の欠品CSV（admin_stock_join_shortage_csv_export/import 等）で、出力対象店舗を選ぶ在庫切れリストCSV画面/ルートではない。",
        ],
    },
    "m04-07_0202_sheet-12_csv": {
        "refs": [
            "src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35",
            "src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:334",
            "src/Eccube/Controller/Admin/Stock/StockJoinController.php:957",
        ],
        "searches": [
            "rg -n 'stock.*warning|warning.*stock|在庫警戒|StockWarning|StockAlert|閾値' src/Eccube/Controller src/Eccube/Service src/Eccube/Command src/Eccube/Resource/template/admin",
            "近似ヒットは週間在庫履歴更新や在庫レコメンドCSVで、設計の在庫警戒リストCSV出力（毎朝8時集計、店舗指定なし、16列）ではない。",
        ],
    },
    "m08-11_0207_sheet-19_sheet": {
        "refs": [
            "src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:41",
            "src/Eccube/Service/EntityManager/CustomerGroupEntityManager.php:27",
            "src/Eccube/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:24",
        ],
        "searches": [
            "rg -n 'CustomerGroup|顧客分析|analysis.*tag|customer.*tag|タグ' src/Eccube/Controller/Admin/Customer src/Eccube/Service src/Eccube/Resource/template/admin/Customer",
            "顧客グループ管理と商品向け売上分析タグ取込は存在するが、顧客分析タグのマスターCSV取込処理は確認できない。",
        ],
    },
    "b01-02_0402_sheet-3_sheet": {
        "refs": [
            "src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35",
            "src/Eccube/Command/InitialStockRegistrationCommand.php:35",
            "src/Eccube/Command/SmaregiStockBackfillCommand.php:32",
        ],
        "searches": [
            "rg -n 'stock.*short|shortage|在庫切れ|AsCommand' src/Eccube/Command src/Eccube/Service/Admin/Stock src/Eccube/Service/Csv",
            "在庫関連Commandは存在するが、在庫数0の商品規格を店舗別に抽出してCSV保存する在庫切れバッチCommand/Serviceは確認できない。",
        ],
    },
    "b01-03_0402_sheet-4_sheet": {
        "refs": [
            "src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35",
            "src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:334",
            "src/Eccube/Command/AggregateStockUpCommand.php:34",
        ],
        "searches": [
            "rg -n 'stock.*warning|warning.*stock|在庫警戒|StockWarning|StockAlert|閾値|AsCommand' src/Eccube/Command src/Eccube/Service",
            "在庫履歴/入庫集計/レコメンド系は存在するが、指定閾値以下の在庫情報を抽出してCSV保存する在庫警戒バッチは確認できない。",
        ],
    },
    "a05-04_0505_sheet-6_sheet": {
        "refs": [
            "src/Eccube/Controller/Smaregi/WebhookController.php:41",
            "src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47",
            "src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:26",
        ],
        "searches": [
            "rg -n 'branch|支店|transfer|転送|order_sub|sub_order|shipping.*complete|出荷完了' src/Eccube/Service/Smaregi src/Eccube/Controller/Smaregi src/Eccube/Repository",
            "スマレジ受信処理はWebhook入口と取引ハンドラが中心で、支店転送時の専用計算・注文サブ/出荷完了反映に対応する明示処理は確認できない。",
        ],
    },
}


def enrich_absence_evidence(function_id, finding):
    impl_ref = str(finding.get("implRef") or "")
    if "不在" not in impl_ref and "未検出" not in impl_ref:
        return
    info = ABSENCE_EVIDENCE.get(function_id)
    if not info:
        return
    finding["implementationSearches"] = info["searches"]
    refs = finding.get("implementationRefs") or []
    for ref in info["refs"]:
        if ref not in refs:
            refs.append(ref)
    finding["implementationRefs"] = refs
    finding["absenceConclusion"] = "該当機能そのものは不在。下記の近似実装を確認したが、設計の入口・対象データ・列定義・副作用とは一致しない。"


def split_design_impl_from_difference(diff):
    diff = clean_claim(diff, limit=1200)
    m = re.search(r"設計(?:は|の[^、。]*は)?(.+?)(?:。|$).*?実装(?:は|の[^、。]*は)?(.+?)(?:。|$)", diff)
    if not m:
        return None, None
    return clean_claim(m.group(1)), clean_claim(m.group(2))


def infer_comparison_row(finding):
    explicit_design, explicit_impl = split_design_impl_from_difference(finding.get("difference", ""))
    design = clean_claim(finding.get("designExpectation") or finding.get("designQuote") or explicit_design)
    implementation = clean_claim(finding.get("implementationActual") or explicit_impl or finding.get("difference"))
    if explicit_design and len(design) > 220:
        design = explicit_design
    if explicit_impl and len(implementation) > 260:
        implementation = explicit_impl

    reason = clean_claim(finding.get("mismatchReason"))
    if not reason:
        reason = clean_claim(finding.get("difference"), limit=420)
    if not reason:
        reason = f"設計要求と実装挙動が {finding.get('dimension')} の観点で一致していない。"

    item = finding.get("comparisonItem") or finding.get("dimension") or "仕様差分"
    return {
        "item": clean_claim(item, 120),
        "design": design,
        "implementation": implementation,
        "mismatch": reason,
    }


def enforce_concrete_fields(finding):
    row = infer_comparison_row(finding)
    finding["comparisonRows"] = finding.get("comparisonRows") or [row]
    finding["comparisonSummary"] = (
        f"{row['item']}：設計は「{row['design']}」。実装は「{row['implementation']}」。"
        f"乖離理由は「{row['mismatch']}」。"
    )
    finding["mismatchReason"] = row["mismatch"]
    finding["requiredChange"] = finding.get("requiredChange") or (
        "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。"
    )


def build_requirement_difference_audit(function_entry):
    rows = []
    for finding in function_entry.get("findings", []):
        trace_rows = []
        for trace in finding.get("requirementTrace", []) or []:
            verdict = str(trace.get("traceVerdict") or "").upper()
            if verdict in {"DRIFT", "NOT_FOUND"}:
                trace_rows.append({
                    "findingId": finding.get("id"),
                    "dimension": finding.get("dimension"),
                    "severity": finding.get("severity"),
                    "implementationGap": bool(finding.get("implementationGap")),
                    "implementationGapType": finding.get("implementationGapType"),
                    "traceVerdict": verdict,
                    "designRef": trace.get("designRef") or finding.get("designRef"),
                    "designRequirement": trace.get("designRequirement") or finding.get("designExpectation") or finding.get("designQuote"),
                    "implementationActual": trace.get("implementationActual") or finding.get("implementationActual"),
                    "mismatchReason": trace.get("traceReason") or finding.get("mismatchReason"),
                    "implementationRefs": trace.get("implementationRefs") or finding.get("implementationRefs") or [],
                    "comparisonRows": finding.get("comparisonRows", []),
                })
        if trace_rows:
            rows.extend(trace_rows)
            continue

        comparison_rows = finding.get("comparisonRows") or []
        if comparison_rows:
            for row in comparison_rows:
                rows.append({
                    "findingId": finding.get("id"),
                    "dimension": finding.get("dimension"),
                    "severity": finding.get("severity"),
                    "implementationGap": bool(finding.get("implementationGap")),
                    "implementationGapType": finding.get("implementationGapType"),
                    "traceVerdict": "NOT_FOUND" if finding.get("implementationGap") else "DRIFT",
                    "designRef": finding.get("designRef"),
                    "designRequirement": row.get("design") or finding.get("designExpectation") or finding.get("designQuote"),
                    "implementationActual": row.get("implementation") or finding.get("implementationActual"),
                    "mismatchReason": row.get("mismatch") or finding.get("mismatchReason"),
                    "implementationRefs": finding.get("implementationRefs") or [],
                    "comparisonRows": [row],
                })
        else:
            rows.append({
                "findingId": finding.get("id"),
                "dimension": finding.get("dimension"),
                "severity": finding.get("severity"),
                "implementationGap": bool(finding.get("implementationGap")),
                "implementationGapType": finding.get("implementationGapType"),
                "traceVerdict": "NOT_FOUND" if finding.get("implementationGap") else "DRIFT",
                "designRef": finding.get("designRef"),
                "designRequirement": finding.get("designExpectation") or finding.get("designQuote"),
                "implementationActual": finding.get("implementationActual") or finding.get("difference"),
                "mismatchReason": finding.get("mismatchReason") or finding.get("difference"),
                "implementationRefs": finding.get("implementationRefs") or [],
                "comparisonRows": finding.get("comparisonRows", []),
            })
    function_entry["requirementDifferenceAudit"] = {
        "policy": (
            "確定所見から逆引きできる個別要求の未実装・実装違いのみを掲載する。"
            "検索ヒットなし等の未確認候補は件数に含めず、HTML主レポートにも表示しない。"
        ),
        "confirmedDifferenceCount": len(rows),
        "implementationGapRequirementCount": sum(1 for row in rows if row.get("implementationGap")),
        "rows": rows,
    }


def main():
    backup = ROOT / f"findings_backup_before_concrete_reaudit_{date.today().isoformat()}.json"
    if not backup.exists():
        shutil.copy2(DATA, backup)

    data = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {fn["functionId"]: fn for fn in data["functions"]}
    phase2_excluded_findings = []
    source_index = build_source_index()

    for item in ADDITIONAL_FINDINGS:
        upsert_reaudit_finding(by_id[item["functionId"]], item)

    for fn in data["functions"]:
        add_missing_explicit_requirement_findings(fn)

    for fn in data["functions"]:
        legacy_evidence = fn.get("auditEvidence")
        if legacy_evidence and legacy_evidence != STANDARD_AUDIT_EVIDENCE:
            fn["auditEvidenceLegacy"] = legacy_evidence
        fn["auditEvidence"] = STANDARD_AUDIT_EVIDENCE
        fn["designNonImplementationReason"] = design_nonimplementation_reason(fn)
        fn["designNonImplementationScope"] = design_nonimplementation_scope(fn.get("designNonImplementationReason"))
        kept_findings = []
        for finding in fn.get("findings", []):
            exclusion_reason = phase2_not_implemented_exclusion_reason(fn, finding)
            if exclusion_reason:
                phase2_excluded_findings.append({
                    "functionId": fn["functionId"],
                    "featureNo": fn.get("featureNo"),
                    "title": fn.get("title"),
                    "dimension": finding.get("dimension"),
                    "designRef": finding.get("designRef"),
                    "reason": exclusion_reason,
                })
                continue
            kept_findings.append(finding)
        fn["findings"] = kept_findings
        apply_requirement_trace_gate(fn, source_index)
        if kept_findings:
            fn["auditStatus"] = "AUDITED_WITH_FINDINGS"
        elif fn.get("auditQualityGateFailure"):
            fn["auditStatus"] = "AUDIT_INCOMPLETE_REQUIREMENT_TRACE"
        else:
            fn["auditStatus"] = "AUDITED_NO_DRIFT_FOUND"
        for i, finding in enumerate(fn.get("findings", []), 1):
            finding.setdefault("id", stable_id(fn["functionId"], finding, i))
            conf = str(finding.get("confidence", finding.get("verdict", "CONFIRMED"))).upper()
            if conf == "HIGH":
                conf = "CONFIRMED"
            if conf not in {"CONFIRMED", "UNCERTAIN"}:
                conf = "CONFIRMED" if finding.get("verdict") == "CONFIRMED" else "UNCERTAIN"
            finding["confidence"] = conf
            finding["verdict"] = conf
            finding.setdefault("impact", "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。")
            finding.setdefault("designExpectation", finding.get("designQuote") or finding.get("difference", "").split("実装", 1)[0])
            finding.setdefault("implementationActual", finding.get("difference"))
            finding.setdefault("fixTarget", finding.get("implRef") or "不在")
            enforce_concrete_fields(finding)
            impl_ref_text = str(finding.get("implRef") or "")
            if "不在" not in impl_ref_text and "未検出" not in impl_ref_text:
                finding.pop("implementationSearches", None)
                finding.pop("absenceConclusion", None)
            enrich_absence_evidence(fn["functionId"], finding)
            gap_type = implementation_gap_type(finding)
            if gap_type:
                finding["implementationGap"] = True
                finding["implementationGapType"] = gap_type
                finding["implementationGapLabel"] = "明確な実装漏れ"
            else:
                finding.pop("implementationGap", None)
                finding.pop("implementationGapType", None)
                finding.pop("implementationGapLabel", None)
            finding["auditAspects"] = finding_audit_aspects(finding)
            finding["designSnippet"] = design_excerpt(finding.get("designRef"))
            refs = finding.get("implementationRefs") or split_refs(finding.get("implRef"))
            finding["implementationRefs"] = refs
            snippets = [s for s in (code_excerpt(r) for r in refs[:3]) if s]
            if finding.get("implementationSearches"):
                snippets.append("実装検索証跡\n" + "\n".join(f"- {s}" for s in finding["implementationSearches"]))
            if finding.get("absenceConclusion"):
                snippets.append("不在判定\n" + finding["absenceConclusion"])
            finding["implementationSnippets"] = snippets
            finding["auditChecklist"] = [
                "設計HTMLの該当節を確認",
                "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
                "比較項目ごとに設計値・実装値・乖離理由を明文化",
                "実装者が修正対象を追えるよう、file:line とコード断片を添付",
            ]
        build_requirement_difference_audit(fn)
        apply_function_implementation_audit(fn, source_index)
        out = ROOT / "findings" / f"{fn['functionId']}.json"
        out.write_text(json.dumps(fn, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    statuses = {fn["auditStatus"] for fn in data["functions"]}
    scope = data.setdefault("scope", {})
    scope["concreteReauditUpdatedAt"] = date.today().isoformat()
    scope["concreteFindingsMode"] = True
    scope["labelMessageAuditMode"] = (
        "HTML設計書の項目名・ボタン名・メッセージ文言と、messages.ja.yaml 等の翻訳値、"
        "FormType/Twig/Controller の表示経路を照合。近似文字列検索とcodexレビュー候補は候補生成に限定し、"
        "設計値・実装値・表示経路を確認できたものだけ CONFIRMED 所見として登録する。"
    )
    scope["concreteFindingFields"] = [
        "designExpectation",
        "implementationActual",
        "impact",
        "fixTarget",
        "implementationRefs",
        "implementationSnippets",
        "comparisonRows",
        "comparisonSummary",
        "mismatchReason",
        "requiredChange",
        "designSnippet",
    ]
    scope["requirementTracePolicy"] = CRITICAL_REQUIREMENT_TRACE_POLICY
    scope["requirementTraceGateMode"] = (
        "明示要求またはHTML抽出要求が未照合の場合、同じ機能に別所見が存在しても要求単位の監査未完了として扱う。"
        "明示要求に findingWhenMissing が設定されている場合は、未カバー時に確定所見へ自動昇格する。"
        "時間条件・自動遷移・タイムアウト遷移などの重点要求は、確定所見でなくても重点未照合台帳へ出す。"
    )
    scope["requirementTraceGatePromotedFindings"] = sum(
        len(fn.get("requirementTraceGatePromotedFindings", []))
        for fn in data["functions"]
    )
    for old_key in [
        "requirementImplementationAuditMode",
        "requirementImplementationUnresolvedRows",
        "requirementImplementationNoSourceSignalRows",
        "requirementImplementationWeakSourceSignalRows",
        "requirementImplementationSourceSignalUntracedRows",
        "requirementImplementationHighRiskUnresolvedRows",
        "requirementImplementationNoSourceSignalFunctions",
        "requirementImplementationWeakSourceSignalFunctions",
    ]:
        scope.pop(old_key, None)
    requirement_difference_audits = [fn.get("requirementDifferenceAudit", {}) for fn in data["functions"]]
    scope["requirementDifferenceAuditMode"] = (
        "確定所見から逆引きできる個別要求の未実装・実装違いのみを掲載する。"
        "検索ヒットなし等の未確認候補は、確定差分として集計しない。"
    )
    scope["requirementDifferenceRows"] = sum(
        audit.get("confirmedDifferenceCount", 0) for audit in requirement_difference_audits
    )
    scope["requirementDifferenceImplementationGapRows"] = sum(
        audit.get("implementationGapRequirementCount", 0) for audit in requirement_difference_audits
    )
    scope["requirementDifferenceFunctions"] = sum(
        1 for fn in data["functions"]
        if fn.get("requirementDifferenceAudit", {}).get("confirmedDifferenceCount", 0)
    )
    scope["requirementTraceFunctions"] = sum(
        1 for fn in data["functions"] if fn.get("requirementTraceGate")
    )
    scope["requirementTraceGateFailures"] = sum(
        1 for fn in data["functions"] if fn.get("auditQualityGateFailure")
    )
    focused_untraced_audits = [fn.get("focusedUntracedRequirementAudit", {}) for fn in data["functions"]]
    scope["focusedUntracedRequirementMode"] = (
        "未照合要求のうち、画面表示後の秒/分条件、自動遷移、タイムアウト遷移などを重点確認対象として抽出する。"
        "この台帳は確定差分件数には含めず、ソース確認漏れを防ぐための監査キューとして表示する。"
    )
    scope["focusedUntracedRequirementRows"] = sum(
        audit.get("untracedFocusedRequirementCount", 0) for audit in focused_untraced_audits
    )
    scope["focusedUntracedRequirementFunctions"] = sum(
        1 for audit in focused_untraced_audits if audit.get("untracedFocusedRequirementCount", 0)
    )
    conformance_audits = [fn.get("requirementConformanceAudit", {}) for fn in data["functions"]]
    scope["requirementConformanceMode"] = (
        "設計書から抽出した全要求に判定を付ける（判定漏れ0）。"
        "実装済み/要確認/未実装候補/対象外(理由付き)のいずれかへ必ず分類し、"
        "material な未実装候補・要確認は codex 批判的レビューと実機確認で実装済/未実装/実装違いを確定する。"
    )
    scope["requirementConformanceRequirements"] = sum(a.get("requirementCount", 0) for a in conformance_audits)
    scope["requirementConformanceUnverdicted"] = sum(a.get("unverdictedCount", 0) for a in conformance_audits)
    scope["requirementConformanceComplete"] = all(
        a.get("coverageComplete", True) for a in conformance_audits
    )
    scope["notImplementedCandidateRows"] = sum(a.get("counts", {}).get("未実装候補", 0) for a in conformance_audits)
    scope["needsCheckRows"] = sum(a.get("counts", {}).get("要確認", 0) for a in conformance_audits)
    scope["conformanceImplementedRows"] = sum(a.get("counts", {}).get("実装済み", 0) for a in conformance_audits)
    scope["conformanceOutOfScopeRows"] = sum(a.get("counts", {}).get("対象外", 0) for a in conformance_audits)
    scope["conformanceMaterialGapRows"] = sum(a.get("materialGapCount", 0) for a in conformance_audits)
    scope["conformanceFunctions"] = sum(1 for a in conformance_audits if a.get("requirementCount", 0))
    scope["requirementTraceGateFailureRefs"] = [
        {
            "functionId": fn.get("functionId"),
            "featureNo": fn.get("featureNo"),
            "title": fn.get("title"),
            "missingRequirementCount": fn.get("requirementTraceGate", {}).get("missingRequirementCount"),
            "sampleMissingRequirements": [
                r.get("designRequirement")
                for r in fn.get("auditQualityGateMissingRequirements", [])[:5]
            ],
        }
        for fn in data["functions"]
        if fn.get("auditQualityGateFailure")
    ]
    scope["targetHtmlSpecs"] = len(data["functions"])
    scope["targetAuditedFunctions"] = len(data["functions"])
    implementation_verdicts = Counter(
        fn.get("functionImplementationAudit", {}).get("verdict", "NOT_AUDITED")
        for fn in data["functions"]
    )
    scope["functionImplementationAuditMode"] = (
        "HTML設計書からルート名・パス・翻訳キー・クラス名・主要業務語を抽出し、"
        "ec-cube-enterprise の Controller/Form/Service/Repository/Twig/Command/CSV/API/PDF/locale/JS を横断検索。"
        "機能単位で実装入口候補の有無を記録し、候補ゼロは自動確定欠陥ではなく追加レビュー対象として台帳化する。"
    )
    scope["functionImplementationAuditFunctions"] = len(data["functions"])
    scope["functionImplementationSourceFilesIndexed"] = len(source_index.get("sources", []))
    scope["functionImplementationVerdicts"] = dict(implementation_verdicts)
    scope["functionImplementationNoEntryCandidates"] = implementation_verdicts.get("NO_IMPLEMENTATION_ENTRY_FOUND", 0)
    scope["functionImplementationConfirmedGapFunctions"] = implementation_verdicts.get("CONFIRMED_IMPLEMENTATION_GAP", 0)
    scope["functionImplementationStrongEntryFunctions"] = implementation_verdicts.get("IMPLEMENTATION_ENTRY_FOUND", 0)
    scope["functionImplementationWeakCandidateFunctions"] = implementation_verdicts.get("IMPLEMENTATION_CANDIDATE_FOUND", 0)
    scope["auditedWithFindingsFunctions"] = sum(1 for f in data["functions"] if f.get("auditStatus") == "AUDITED_WITH_FINDINGS")
    scope["auditedNoDriftFunctions"] = sum(1 for f in data["functions"] if f.get("auditStatus") == "AUDITED_NO_DRIFT_FOUND")
    scope["pendingAuditFunctions"] = len(data["functions"]) - scope["auditedWithFindingsFunctions"] - scope["auditedNoDriftFunctions"]
    scope["auditComplete"] = scope["pendingAuditFunctions"] == 0
    scope["note"] = (
        "全407シートに functionImplementationAudit を付与し、機能入口候補の有無を横断照合した。"
        f"ただし要求トレースゲート未通過が {scope['pendingAuditFunctions']} シート残っているため、"
        "全要求レベルの監査完了とは扱わない。"
    )
    scope["auditCoverageStatus"] = (
        "FUNCTION_ENTRY_AUDITED_REQUIREMENT_TRACE_INCOMPLETE"
        if scope["pendingAuditFunctions"]
        else "FUNCTION_AND_REQUIREMENT_AUDITED"
    )
    scope["implementationGapFindings"] = sum(
        1 for fn in data["functions"] for f in fn.get("findings", []) if f.get("implementationGap")
    )
    scope["implementationGapFunctions"] = sum(
        1 for fn in data["functions"] if any(f.get("implementationGap") for f in fn.get("findings", []))
    )
    scope["phase2NotImplementedExcludedFindings"] = len(phase2_excluded_findings)
    scope["phase2NotImplementedExclusionPolicy"] = (
        "HTML設計書がフェーズ2実装・フェーズ1未実装を明記している機能については、"
        "未実装であること自体を差分・明確な実装漏れとして集計しない。"
    )
    scope["phase2NotImplementedExcludedFindingRefs"] = phase2_excluded_findings
    scope["concreteReauditBackup"] = str(backup.relative_to(DOCS_ROOT))
    data["generatedFunctions"] = len(data["functions"])

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "functions": len(data["functions"]),
        "findings": sum(len(f.get("findings", [])) for f in data["functions"]),
        "withFindings": scope["auditedWithFindingsFunctions"],
        "pending": scope["pendingAuditFunctions"],
        "functionImplementationVerdicts": scope["functionImplementationVerdicts"],
        "sourceFilesIndexed": scope["functionImplementationSourceFilesIndexed"],
        "statuses": sorted(statuses),
        "backup": scope["concreteReauditBackup"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
