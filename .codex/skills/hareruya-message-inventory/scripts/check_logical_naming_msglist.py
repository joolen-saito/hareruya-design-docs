#!/usr/bin/env python3
"""メッセージ一覧の説明文列に物理名が再混入していないかを検査する（論理名規約のゲート）。

走査対象は MESSAGE_LIST に出力される説明文の列だけ:
  種別 / どこに(表示位置) / トリガー（条件）(表示条件) / 後続処理

対象外（ユーザー決定 2026-08-19 / [[logical-naming]] の「対象外」）:
  - メッセージ内容・メッセージ内容(英語): 画面に出る表示文字列そのもの（逐語＝捏造ゼロが優先）
  - 根拠(file:line): 出典。実ソース追跡と validate_messages.py の再実行性を担保する
  - 画面 / 要素 / 要素(表示): MESSAGE_LIST に出力されない正本内部の作業列
  - HTTPパス・HTTPメソッド・APIレスポンスのフィールド名・HTMLセレクタ・
    ブラウザ標準API名・ホスト名・言語キーワード(null 等)

ALLOW は「棚卸し済みで残すと決めたトークン」。増やすときは理由をコメントで書くこと。

  python3 check_logical_naming_msglist.py          # 違反があれば非ゼロ終了
  python3 check_logical_naming_msglist.py --list    # 検出内容を一覧表示
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib_messages as L  # noqa: E402

COLS = ("種別", "どこに", "トリガー（条件）", "後続処理")

# 一般英単語・略語（物理名ではない）。
# 実装の変数名・クラス名を隠しうる語（Mail / Template 等）は入れない
# （codex R1 で M10-08-MSG-003 の `Mail`(?MailTemplate $Mail) が Mail 登録により見逃されていた）。
COMMON = {
    "CSV", "OK", "ID", "JSON", "API", "PDF", "HTTP", "JS", "URL", "CSRF", "POST", "PUT",
    "GET", "DELETE", "JWT", "MTG", "TOP", "CSS", "JavaScript", "UI", "FAX", "PNG", "GIF",
    "JPEG", "JPG", "MB", "ZIP", "No", "Twig", "Ajax", "Session", "Referer",
    "Route", "XHR", "SHOP", "n", "NM", "CMC", "OtcBuy",
}
# 規約の対象外として残すと決めたトークン（棚卸し済み）
ALLOW = {
    # APIレスポンスの契約フィールド名（外部IF。HTTPパスと同じ扱い）
    "errors", "code", "success", "true", "false", "redirectUrl",
    # HTTPパスの構成要素
    "eccube_api_v1_route", "admin/buyOrder/", "id", "json", "status.json", "freeComment.json",
    # HTMLセレクタ・要素id/class（論理名を持たず位置情報としてしか使えない）
    "top-banner-upload-error", "payment_image_error", "stockHistoryList", "card-body",
    "form", "form_bulk", "action-submit", "button", "data-class-url",
    # ブラウザ標準API名（コマンド名相当）
    "window.confirm", "confirm",
    # 画面に入力される値（ホスト名）
    "admin.hareruyamtg.com",
    # 言語キーワード（内部識別子でもDB物理名でもない）
    "null",
}

TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_.\-/\\]*")
FID_RE = re.compile(r"^[A-Za-z]\d{2}-\d{2}")
SRC_PATH_RE = re.compile(r"\.(php|twig|yaml|yml|js|xlf)(\b|:)")
SRC_PREFIXES = ("ec-cube-enterprise/", "src/", "functions/", "app/", "html/")


def hits(cell: str) -> list[str]:
    out = []
    for m in TOKEN_RE.finditer(cell):
        t = m.group(0).rstrip(".")
        if t in COMMON or t in ALLOW or FID_RE.match(t):
            continue
        if SRC_PATH_RE.search(t) or t.startswith(SRC_PREFIXES):
            continue  # 出典 file:line は対象外
        out.append(t)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="検出内容を一覧表示する")
    args = ap.parse_args()

    found: list[tuple[str, str, str, list[str]]] = []
    for row in L.read_master_rows():
        # MESSAGE_LIST は 正本∖EE-*。EE-* は機能未割当の退避バケットで一覧に出力されない。
        if row["メッセージID"].startswith("EE-"):
            continue
        for col in COLS:
            cell = row.get(col, "")
            h = hits(cell)
            if h:
                found.append((row["メッセージID"], col, cell, h))

    if args.list:
        for mid, col, cell, h in found:
            print(f"{mid}\t{col}\t{','.join(h)}\t{cell}")

    if found:
        print(f"NG: 物理名の混入 {len(found)} セル", file=sys.stderr)
        for mid, col, _cell, h in found[:20]:
            print(f"  - {mid} [{col}]: {', '.join(h)}", file=sys.stderr)
        return 1
    print("OK: メッセージ一覧の説明文列に物理名の混入なし")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
