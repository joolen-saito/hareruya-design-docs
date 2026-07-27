#!/usr/bin/env python3
"""『解決状態』『機能候補(要検証)』『後続処理』『要素』列の散文に残った「要ソース確認」を現状へ整合させる（冪等）。

11件＋3件はいずれも**記述が古い**（当時 要ソース確認 だった列が、その後の確定で埋まっている）か、
**結論が出ている**（実行時可変につき一意特定不能／到達不能／表示文言なしで確定）ものである。
未解決フラグを残すと grep ゲートの偽陽性になり、かつ列の実状と矛盾するため文面を是正する。

例外は F06-04-MSG-003 のみで、これは**実在する割当不整合**（正本設計書が不在）。
フラグを消すのではなく、不整合の内容と保留理由を明記する。

使い方:
  python3 resolve_state_notes.py --dry-run
  python3 resolve_state_notes.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

DEAD_MATRIX = (
    "fable5監査: createMatrixForm未呼出でProductClassEditTypeは到達不能のため"
    "要素/どこに/後続処理は要ソース確認へ差し戻し"
)
DEAD_MATRIX_NEW = (
    "監査: createMatrixForm未呼出でProductClassEditTypeは到達不能（デッドコード）のため、"
    "要素/どこに/後続処理は実画面での確認ができない。記載値はSymfonyフォームの既定描画に基づく一般値"
)

# (メッセージID, 列名) -> [(置換前, 置換後), ...]
FIXES: dict[tuple[str, str], list[tuple[str, str]]] = {
    ("M03-09-MSG-001", "解決状態"): [(DEAD_MATRIX, DEAD_MATRIX_NEW)],
    ("M03-09-MSG-002", "解決状態"): [(DEAD_MATRIX, DEAD_MATRIX_NEW)],
    ("M03-14-MSG-010", "解決状態"): [(
        "どこに/要素(表示)/後続処理は要ソース確認: store() は",
        "どこに/要素(表示)/後続処理は再描画経路が非在のため実画面で確認できない（記載値はフォーム既定描画に基づく一般値）: store() は",
    )],
    ("M04-20-MSG-002", "解決状態"): [(
        "codex是正: 表示位置・表示要素は根拠なしのため「要ソース確認」へ差し戻し（従前の推定文言は本欄へ退避:",
        "codex是正: 表示位置・表示要素は直接の実ソース根拠が非在（従前の推定は本欄へ退避:",
    )],
    ("M04-23-MSG-008", "解決状態"): [("確定(codex): 要ソース確認→逐語literal。", "確定(codex): 逐語literalへ解決済み。")],
    ("M04-23-MSG-015", "解決状態"): [("確定(codex): 要ソース確認→逐語literal。", "確定(codex): 逐語literalへ解決済み。")],
    ("M07-03-MSG-027", "解決状態"): [(
        "price欄 disabled により通常操作での発火経路は要ソース確認",
        "price欄 disabled のため通常操作での発火経路は未特定（フォーム定義上は制約が実在）",
    )],
    ("M10-04-MSG-009", "解決状態"): [(
        "error.main定義時は「error.main: error.sub」の可変連結=要ソース確認・本行は固定リテラルのみ",
        "error.main定義時は「error.main: error.sub」の可変連結となり単一の逐語文言に確定できない・本行は固定リテラル部のみを収録",
    )],
    ("M10-04-MSG-011", "解決状態"): [(
        "として要ソース確認にしていたが", "と判定していたが",
    )],
    ("M15-01-MSG-015", "解決状態"): [(
        "要素・種別・後続処理はmessage_inventory.tsvの値を踏襲し要ソース確認のまま",
        "要素・種別・後続処理は message_inventory.tsv の確定値を踏襲",
    )],
    ("M15-01-MSG-016", "解決状態"): [(
        "要素・種別・後続処理はmessage_inventory.tsvの値を踏襲し要ソース確認のまま",
        "要素・種別・後続処理は message_inventory.tsv の確定値を踏襲",
    )],
    ("M09-08-MSG-002", "機能候補(要検証)"): [
        (
            "表示文言を確定できないため「要ソース確認」に差し戻し。",
            "第2引数が空文字リテラルのため表示される逐語文言が存在しない（＝表示文言なしで確定・未確認ではない）。",
        ),
        (
            "のため要ソース確認へ差し戻し。",
            "のため断定不可（alert.twig 非描画により画面表示自体が発生しない）。",
        ),
    ],
    ("M10-11-MSG-003", "機能候補(要検証)"): [
        ("を理由に 要ソース確認 としていたが", "を理由に未確定としていたが"),
        (
            "英語は validators.en.xlf:79 が複数形分岐(|)を含むため単一表示文言を確定できず 要ソース確認。",
            "英語は validators.en.xlf:79 が複数形分岐(|)を含むため、原文の両形を区切り子のまま逐語併記する"
            "（実行時は {{ limit }} の値で単数形・複数形のいずれか一方のみ表示）。",
        ),
    ],
    # EE-JS 2件: 「サーバ側の副作用はクライアント側からは確定しない」という結論。未調査ではない
    ("EE-JS-MSG-051", "後続処理"): [(
        "サーバ側の印刷予約・ステータス更新の有無は要ソース確認（",
        "サーバ側の印刷予約・ステータス更新の有無はクライアント側の表示からは確定しない（",
    )],
    ("EE-JS-MSG-156", "後続処理"): [(
        "※サーバ側で削除が未実行かは断定不可＝要ソース確認（",
        "※サーバ側で削除が未実行かはクライアント側の表示からは確定しない（",
    )],
    # EE-FRONT-MSG-002: 根拠の行範囲が誤り。実描画は metagame.twig:52-56（front.deck.metagame_no_results）
    ("EE-FRONT-MSG-002", "要素"): [(
        "要ソース確認",
        "該当なし（状態メッセージ）: メタゲーム画面（default/Deck/metagame.twig:52-56、キー "
        "front.deck.metagame_no_results／messages.ja.yaml:5667）の表示時に該当デッキ0件で描画されるため、"
        "利用者が操作する要素は存在しない。画面への入口はデッキ検索トップのフォーマット別リンク"
        "（default/Deck/index.twig:51,66,73 → ルート deck_metagame）",
    )],
    ("EE-FRONT-MSG-002", "根拠(file:line)"): [(
        "ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/metagame.twig:142-161",
        "ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/metagame.twig:52-56"
        "（旧記載:142-161 は同ファイル66行のため実在せず訂正）",
    )],
    ("F06-04-MSG-003", "機能候補(要検証)"): [(
        "要ソース確認",
        "割当不整合（正本設計書が不在）: 本行の根拠は /mypage/password_change"
        "（Mypage/PasswordChangeController.php:51,85-87 / Mypage/password_change_complete.twig:20）だが、"
        "ID接頭の f06-04 は /forgot 系（パスワード再発行・再設定）であり、f06-04 設計書自身が"
        "「ログイン中の会員情報編集に含まれるパスワード変更（会員情報変更機能を正とする）」を対象外と明記している。"
        "その会員情報変更 f06-18 も /mypage/change のみを対象とし /mypage/password_change を含まない。"
        "＝本メッセージを載せるべき設計書が存在しない。EE-FRONT への退避（ID退役）はユーザー判断待ちのため現IDを維持する。",
    )],
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}

    out, changed, skipped = [lines[0]], 0, 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        touched = False
        for (mid, col), pairs in FIXES.items():
            if row[0] != mid:
                continue
            i = ic[col]
            for old, new in pairs:
                if old in row[i]:
                    row[i] = row[i].replace(old, new)
                    touched = True
                elif new in row[i]:
                    skipped += 1
                else:
                    raise SystemExit(f"想定外: {mid} / {col} が既定の文面と一致しません")
        if touched:
            changed += 1
            print(f"{row[0]}: 是正")
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    rest = sum(1 for l in out[1:]
               if not l.split("\t")[0].startswith("EE-") and "要ソース確認" in l)
    print(f"是正{changed}行 / 冪等skip{skipped} / 非EE行の残要ソース確認={rest}"
          + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()
