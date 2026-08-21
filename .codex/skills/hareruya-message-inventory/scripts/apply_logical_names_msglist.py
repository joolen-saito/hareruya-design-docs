#!/usr/bin/env python3
"""メッセージ一覧（正本 message_inventory.tsv → MESSAGE_LIST.tsv/.md）の物理名を論理名へ置換する。

規約は [[logical-naming]]（.cursor/skills/logical-naming/SKILL.md）。
対象列は MESSAGE_LIST に現れる説明文の列だけ:
  種別 / どこに(表示位置) / トリガー（条件）(表示条件) / 後続処理
対象外（ユーザー決定 2026-08-19）:
  - メッセージ内容 / メッセージ内容(英語): 画面に出る表示文字列そのもの（逐語＝捏造ゼロ規約が優先）
  - 根拠(file:line): 出典。実ソースへの追跡と validate_messages.py の再実行性を担保する
  - 画面 / 要素 / 要素(表示): MESSAGE_LIST に出力されない正本内部の作業列
  - HTTPパス・HTTPメソッド・APIレスポンスのフィールド名・HTMLセレクタ・ブラウザ標準API名・
    ホスト名・言語キーワード(null 等): 規約の「対象外」

置換は (メッセージID, 列, 旧文字列) の完全一致スパンで行い、
  - 旧文字列がセルに存在しない → 既適用として skip
  - 2箇所以上一致 → エラー終了（曖昧な置換をしない）
とする。冪等。

  python3 apply_logical_names_msglist.py --dry-run
  python3 apply_logical_names_msglist.py
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MASTER = ROOT / "message_inventory" / "message_inventory.tsv"

COL_KIND = "種別"
COL_WHERE = "どこに"
COL_TRIG = "トリガー（条件）"
COL_AFTER = "後続処理"

# (メッセージID群, 列, 旧文字列, 新文字列, 物理名, 論理名の出典)
RULES: list[tuple[list[str], str, str, str, str, str]] = [
    # --- フラッシュキー -------------------------------------------------
    (["M03-04-MSG-001"], COL_WHERE,
     "未表示（eccube.front.error フラッシュに格納）",
     "未表示（フロント向けエラーフラッシュに格納）",
     "eccube.front.error", "src/Eccube/Controller/AbstractController.php:117-119"),
    (["M03-05-MSG-002"], COL_WHERE,
     "管理画面では表示されない（eccube.front.error に格納）",
     "管理画面では表示されない（フロント向けエラーフラッシュに格納）",
     "eccube.front.error", "src/Eccube/Controller/AbstractController.php:117-119"),
    # --- Twig フォーム描画関数 ------------------------------------------
    (["M03-41-MSG-011"], COL_WHERE,
     "入力項目直下（form_errors）",
     "入力項目直下（インラインエラー表示位置）",
     "form_errors", "src/Eccube/Resource/template/admin/Product/csv_product.twig:229"),
    (["M04-24-MSG-019", "M04-24-MSG-020"], COL_WHERE,
     "（form_errors出力位置・インラインエラー）",
     "（インラインエラー表示位置）",
     "form_errors", "src/Eccube/Resource/template/admin/Product/csv_product.twig:229"),
    # --- ルート名 --------------------------------------------------------
    (["M04-21-MSG-002"], COL_TRIG,
     "`admin_stock_change_csv_pre_validate`のJSONエラー",
     "在庫変更CSV事前検証のJSONエラー",
     "admin_stock_change_csv_pre_validate",
     "src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:410"),
    (["F04-04-MSG-001"], COL_AFTER,
     "shopping_error へリダイレクト",
     "購入エラー画面へリダイレクト",
     "shopping_error", "src/Eccube/Controller/Front/ShoppingController.php:1000-1004"),
    # --- エンティティ / DB物理名 ----------------------------------------
    (["A07-03-MSG-002", "A07-04-MSG-001", "A07-05-MSG-001"], COL_TRIG,
     "指定IDのDtbBuyOrderが存在しない",
     "指定IDのネット買取受注が存在しない",
     "DtbBuyOrder(dtb_buy_order)", "src/Eccube/Repository/DtbBuyOrderRepository.php:281"),
    (["A07-04-MSG-003"], COL_TRIG,
     "指定statusのMtbBuyOrderStatusが存在しない",
     "指定ステータスIDの買取注文ステータスマスタが存在しない",
     "MtbBuyOrderStatus(mtb_buy_order_status)",
     "src/Eccube/Entity/Master/MtbBuyOrderStatus.php:102"),
    (["M04-13-MSG-082", "M04-13-MSG-083"], COL_TRIG,
     "対象の`DtbStockSplitJoin`が結合種別ではないとき",
     "対象の在庫分割・結合データが結合種別ではないとき",
     "DtbStockSplitJoin(dtb_stock_split_join)",
     "src/Eccube/Entity/DtbStockSplitJoin.php:25-29"),
    (["A06-03-MSG-002"], COL_TRIG,
     "指定された商品規格IDのProductClassが存在しない場合。",
     "指定された商品規格IDに該当する商品規格が存在しない場合。",
     "ProductClass(dtb_product_class)", "src/Eccube/Entity/ProductClass.php:55-58（商品規格名を含めた商品名を返す）"),
    (["F06-14-MSG-001"], COL_TRIG,
     "支払い会員Customerが存在しないとき",
     "支払い会員が存在しないとき",
     "Customer(dtb_customer)", "src/Eccube/Resource/locale/messages.ja.yaml:2743-2751（会員管理／会員一覧）"),
    (["A06-06-MSG-001"], COL_TRIG,
     "カード詳細ID取得時にログインユーザーがMemberでない",
     "カード詳細ID取得時にログインユーザーが管理者アカウントでない",
     "Member(dtb_member)", "src/Eccube/Entity/Member.php:55-62（ROLE_ADMIN）; src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:40-43（管理者ログイン認証API）"),
    (["A06-07-MSG-001"], COL_TRIG,
     "商品IDリスト取得時にログインユーザーがMemberでない",
     "商品IDリスト取得時にログインユーザーが管理者アカウントでない",
     "Member(dtb_member)", "src/Eccube/Entity/Member.php:55-62（ROLE_ADMIN）; src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:40-43（管理者ログイン認証API）"),
    (["A06-08-MSG-001"], COL_TRIG,
     "カード名検索時にログインユーザーがMemberでない",
     "カード名検索時にログインユーザーが管理者アカウントでない",
     "Member(dtb_member)", "src/Eccube/Entity/Member.php:55-62（ROLE_ADMIN）; src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:40-43（管理者ログイン認証API）"),
    (["A06-13-MSG-004"], COL_TRIG,
     "認証済み利用者を`Member`として取得できないとき",
     "認証済み利用者を管理者アカウントとして取得できないとき",
     "Member(dtb_member)", "src/Eccube/Entity/Member.php:55-62（ROLE_ADMIN）; src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:40-43（管理者ログイン認証API）"),
    (["A07-03-MSG-003"], COL_TRIG,
     "コメント更新処理でgetUser()の結果がMemberではない",
     "コメント更新処理でログイン利用者が管理者アカウントではない",
     "Member(dtb_member) / getUser()", "src/Eccube/Entity/Member.php:55-62; src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:106,146"),
    (["A07-04-MSG-004"], COL_TRIG,
     "ステータス更新処理でgetUser()の結果がMemberではない",
     "ステータス更新処理でログイン利用者が管理者アカウントではない",
     "Member(dtb_member) / getUser()", "src/Eccube/Entity/Member.php:55-62（ROLE_ADMIN）; src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:106,146"),
    # --- フォーム項目名 / リクエストパラメータ名 -------------------------
    (["M03-28-MSG-002", "M03-29-MSG-002", "M03-30-MSG-002", "M03-32-MSG-002",
      "M03-33-MSG-002", "M03-35-MSG-002", "M03-38-MSG-002", "M03-40-MSG-001",
      "M03-44-MSG-002"], COL_TRIG,
     "フォームが有効であるにもかかわらず、import_file が null のとき",
     "フォームが有効であるにもかかわらず、CSVファイルが未指定のとき",
     "import_file", "src/Eccube/Resource/locale/messages.ja.yaml:1779（CSVファイル選択）"),
    (["M04-08-MSG-002", "M04-08-MSG-007"], COL_TRIG,
     "フォーム検証通過後にimport_fileがnullの場合（NotBlank制約により通常到達しない）",
     "フォーム検証通過後にCSVファイルが未指定の場合（必須入力制約により通常到達しない）",
     "import_file / NotBlank", "src/Eccube/Form/Type/Admin/CsvImportType.php:48-53"),
    (["M04-13-MSG-085"], COL_TRIG,
     "編集用分割先CSVアップロードでimport_fileが未送信",
     "編集用分割先CSVアップロードでCSVファイルが未送信",
     "import_file", "src/Eccube/Resource/locale/messages.ja.yaml:4989（CSVファイル選択）"),
    (["A06-01-MSG-001"], COL_TRIG,
     "ログインAPIで`login_id`または`password`が空のとき",
     "ログインAPIでログインIDまたはパスワードが空のとき",
     "login_id / password",
     "src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:48-52（文言に逐語）"),
    (["A07-03-MSG-001"], COL_TRIG,
     "で free_comment が未指定（null）",
     "でコメントが未指定",
     "free_comment",
     "src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:96-98（文言「コメントを入力してください」）"),
    (["A07-04-MSG-002"], COL_TRIG,
     "ステータス更新でstatusが未指定・空文字・数字以外",
     "ステータス更新でステータスIDが未指定・空文字・数字以外",
     "status",
     "src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:137（文言「正しい店頭買取ステータスIDを入力してください」）"),
    (["A06-13-MSG-002"], COL_TRIG,
     "本人確認更新で`identification`フォーム値が未指定のとき",
     "本人確認更新で証明書IDのフォーム値が未指定のとき",
     "identification",
     "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:281-284（文言「正しい証明書IDを入力してください」）"),
    (["A06-13-MSG-003"], COL_TRIG,
     "本人確認更新で指定した`identification`が本人確認証明書マスタに存在しないとき",
     "本人確認更新で指定した証明書IDが本人確認証明書マスタに存在しないとき",
     "identification",
     "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:286-291"),
    # --- 定数名 ----------------------------------------------------------
    (["F08-03-MSG-003"], COL_TRIG,
     "完了URLの register=1 で完了画面を表示したとき",
     "完了URLの会員登録結果が「登録成功」で完了画面を表示したとき",
     "register / ENTRY_SUCCESS",
     "src/Eccube/Controller/Front/Purchase/OtcBuyController.php:66（// 登録成功）"),
    (["F08-03-MSG-004"], COL_TRIG,
     "完了URLの register=2 で完了画面を表示したとき",
     "完了URLの会員登録結果が「登録失敗」で完了画面を表示したとき",
     "register / ENTRY_FAILED",
     "src/Eccube/Controller/Front/Purchase/OtcBuyController.php:67（// 登録失敗（ブラックリスト該当））"),
    (["F08-03-MSG-007"], COL_TRIG,
     "会員仮登録を伴う査定申込みで register=ENTRY_SUCCESS のとき",
     "会員仮登録を伴う査定申込みで会員登録結果が「登録成功」のとき",
     "register / ENTRY_SUCCESS",
     "src/Eccube/Controller/Front/Purchase/OtcBuyController.php:66（// 登録成功）"),
    (["M04-13-MSG-059"], COL_TRIG,
     "結合元登録済み（JOIN_SOURCE_REGISTERED）以外のステータス",
     "結合元登録済み以外のステータス",
     "JOIN_SOURCE_REGISTERED", "src/Eccube/Entity/Master/MtbStockSplitJoinStatus.php:29-30; src/Eccube/Resource/locale/messages.ja.yaml:5109"),
    (["M15-01-MSG-009"], COL_TRIG,
     "サイドボードまたは統率（command）に",
     "サイドボードまたは統率に",
     "command", "src/Eccube/Entity/Master/MtbBoard.php:36; src/Eccube/Resource/locale/messages.ja.yaml:4321-4338"),
    # --- 画面変数 / メソッド名 -------------------------------------------
    (["M07-01-MSG-003"], COL_TRIG,
     "`pagination.totalItemCount`が0のとき",
     "検索結果の総件数が0のとき",
     "pagination.totalItemCount", "src/Eccube/Resource/template/admin/Purchase/index.twig:157-161（検索結果 N件）"),
    (["M06-01-MSG-011"], COL_TRIG,
     "paginationは生成されたがtotalItemCountが0の場合。",
     "ページャは生成されたが総件数が0の場合。",
     "pagination / totalItemCount",
     "src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:155-161（検索結果 N件）"),
    (["M06-05-MSG-003"], COL_TRIG,
     "paginationは生成されたがtotalItemCountが0の場合。",
     "ページャは生成されたが総件数が0の場合。",
     "pagination / totalItemCount",
     "src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:160-166（検索結果 N件）"),
    (["M06-05-MSG-004"], COL_TRIG,
     "`pagination`は存在するが`totalItemCount`が0のとき",
     "ページャは存在するが総件数が0のとき",
     "pagination / totalItemCount",
     "src/Eccube/Resource/template/admin/Purchase/history.twig:192-198（検索結果 N件）"),
    (["M06-08-MSG-002"], COL_TRIG,
     "期間全体・部門別集計結果entirePeriodSummaryが空の場合。",
     "期間全体・部門別集計結果が空の場合。",
     "entirePeriodSummary", "src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:68"),
    (["M06-08-MSG-003"], COL_TRIG,
     "日別集計結果daysSummaryが空の場合。",
     "日別集計結果が空の場合。",
     "daysSummary", "src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:114"),
    (["M12-05-MSG-001"], COL_TRIG,
     "`getAnalysisSummary()`の結果が空のとき",
     "分析集計結果が空のとき",
     "getAnalysisSummary()",
     "src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:90 / src/Eccube/Repository/DtbProductRequestRepository.php:366-377"),
    (["F06-16-MSG-001"], COL_TRIG,
     "ユーザー作成デッキ一覧MyDecksが空",
     "ユーザー作成デッキ一覧が空",
     "MyDecks", "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:368,421-422"),
    (["F03-01-MSG-003", "F03-01-MSG-004"], COL_TRIG,
     "検索語、fallback情報および補正語が存在するとき",
     "検索語が入力され、検索応答に補正語が含まれているとき",
     "fallback",
     "html/template/default/assets/hareruya/js/hareruya-unisearch-list-client-core.js:314-318"),
    # --- codex R1 指摘の是正（2026-08-19） ---
    (["M04-17-MSG-001"], COL_WHERE,
     "先頭に prepend）",
     "の先頭）",
     "prepend（jQueryメソッド名。セレクタではない）",
     "src/Eccube/Resource/template/admin/Stock/history.twig:53"),
    (["M10-08-MSG-003"], COL_TRIG,
     "Mail が未指定のままPOSTしたとき",
     "対象のメールテンプレートが未指定のままPOSTしたとき",
     "Mail（?MailTemplate $Mail）",
     "src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:55,91-93"),
    (["F06-07-MSG-001"], COL_AFTER,
     "（再注文リンクは stockOrder の場合のみ表示）",
     "（再注文リンクは数量マイナスの商品明細を含まない受注の場合のみ表示）",
     "stockOrder", "src/Eccube/Controller/Front/Mypage/MypageController.php:351-361"),
]


def read_master() -> tuple[list[str], list[list[str]]]:
    lines = MASTER.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    rows = [l.split("\t") for l in lines[1:] if l.strip()]
    return header, rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    header, rows = read_master()
    ci = {h: i for i, h in enumerate(header)}
    by_id: dict[str, list[str]] = {r[0]: r for r in rows}

    applied = skipped = 0
    errors: list[str] = []
    log: list[str] = []
    for mids, col, old, new, phys, src in RULES:
        for mid in mids:
            row = by_id.get(mid)
            if row is None:
                errors.append(f"{mid}: 正本に存在しない")
                continue
            cell = row[ci[col]]
            n = cell.count(old)
            if n == 0:
                if new in cell:
                    skipped += 1
                else:
                    errors.append(f"{mid} [{col}]: 旧文字列が見つからない: {old!r} / 現値={cell!r}")
                continue
            if n > 1:
                errors.append(f"{mid} [{col}]: 旧文字列が{n}箇所一致（曖昧）: {old!r}")
                continue
            row[ci[col]] = cell.replace(old, new)
            applied += 1
            log.append(f"{mid}\t{col}\t{phys}\t{old}\t{new}\t{src}")

    for e in errors:
        print(f"ERROR: {e}", file=sys.stderr)
    if errors:
        return 1

    print(f"適用 {applied} 件 / 既適用 {skipped} 件")
    for l in log:
        print("  " + l.replace("\t", " | "))
    if args.dry_run:
        print("(dry-run: 書き出しなし)")
        return 0

    out = "\t".join(header) + "\n" + "\n".join("\t".join(r) for r in rows) + "\n"
    MASTER.write_text(out, encoding="utf-8")
    print(f"書き出し: {MASTER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
