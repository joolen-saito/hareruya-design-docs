#!/usr/bin/env python3
"""期待結果に合わせてテスト項目名（列6）を行ごとに具体化する。

[SKILL.md](../SKILL.md) の手順5。行分割後に実行する。MANUAL 辞書で機能固有の上書きが可能。
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

from format_tsv import (
    COL_EXPECT,
    COL_ITEM_NAME,
    COL_TEST_ID,
    EXPECTED_COLUMNS,
    extract_first_tsv_fence,
    migrate_rows,
    parse_tsv_block,
    rows_to_tsv_block,
    validate_rows,
)

MANUAL: dict[str, str] = {
    "IT-ADMIN-LOGIN-001": "未ログイン時に管理ログイン画面でログインID・パスワード入力欄・送信ボタン・CSRF／なりすまし対策用hiddenが表示され入力・送信に利用できること",
    "IT-ADMIN-LOGIN-002": "未ログイン時に管理ログイン画面へGETしたときHTTP応答がエラー画面にならないこと",
    "IT-ADMIN-LOGIN-007": "一般会員のみログイン状態で管理ログイン画面が開けること",
    "IT-ADMIN-LOGIN-008": "一般会員のみログイン状態でログイン完了後の管理画面に管理者としてアクセスできないこと",
    "IT-ADMIN-LOGIN-003": "ログイン済みでログインURLにアクセスしたとき代表管理画面へ遷移すること",
    "IT-ADMIN-LOGIN-004": "ログイン済みでログインURLにアクセスしても未ログイン扱いにならないこと",
    "IT-ADMIN-LOGIN-005": "未ログインでログイン完了後の管理画面URLへ直接アクセスしたとき管理画面を表示しないこと",
    "IT-ADMIN-LOGIN-006": "未ログインでログイン完了後の管理画面URLへ直接アクセスしたときログイン系画面へ誘導されること",
    "IT-ADMIN-LOGIN-009": "有効なログインID・パスワード送信で認証が成功すること",
    "IT-ADMIN-LOGIN-010": "有効なログインID・パスワード送信でホーム画面へ遷移すること",
    "IT-ADMIN-LOGIN-011": "有効なログインID・パスワード送信でレスポンスHTMLにパスワード平文が含まれないこと",
    "IT-ADMIN-LOGIN-014": "ログイン後の連続操作で途中で未ログイン扱いに落ちないこと",
    "IT-ADMIN-LOGIN-015": "ログイン後の連続操作でログイン完了後の管理画面が閲覧できること",
    "IT-ADMIN-LOGIN-016": "セッション失効後にログイン完了後の管理画面を表示しないこと",
    "IT-ADMIN-LOGIN-017": "セッション失効後に再認証を要するログイン系の画面へ誘導されること",
    "IT-ADMIN-LOGIN-020": "is_auto_logoutがfalseの管理者が無操作時間超過後に未ログイン扱いとなりログイン画面へ誘導されること",
    "IT-ADMIN-LOGIN-021": "is_auto_logoutがfalseの管理者が無操作時間超過後に無許可操作ができないこと",
    "IT-ADMIN-LOGIN-022": "is_auto_logoutがtrueの管理者は無操作時間超過後も自動ログアウトしないこと",
    "IT-ADMIN-LOGIN-023": "is_auto_logoutがtrueの管理者は無操作時間超過後も管理側の操作が継続できること",
    "IT-ADMIN-LOGIN-012": "ログイン成功時にdtb_login_historyへ成功区分の行が追加されること",
    "IT-ADMIN-LOGIN-013": "ログイン成功時にdtb_member.login_dateが更新されること",
    "IT-ADMIN-LOGIN-018": "明示ログアウト後にログイン画面へ遷移すること",
    "IT-ADMIN-LOGIN-019": "明示ログアウト後にログイン完了後の管理画面へ再アクセスするとログインが必要な状態であること",
    "IT-ADMIN-LOGIN-024": "ログインID・パスワード未入力送信で認証失敗として扱われること",
    "IT-ADMIN-LOGIN-025": "ログインID・パスワード未入力送信でログイン画面に留まること",
    "IT-ADMIN-LOGIN-026": "ログインID・パスワード未入力送信で共通の認証エラー表示方針に一致すること",
    "IT-ADMIN-LOGIN-066": "ログイン成功後にブラウザバックしても再ログイン要否・二重送信・権限逆転が許容範囲内であること",
    "IT-ADMIN-LOGIN-089": "正しい資格情報でログイン送信したときPOSTペイロードのキー構成が画面フォームと整合すること",
    "IT-ADMIN-LOGIN-090": "なりすまし対策有効時にPOSTペイロードへ対策フィールドのname属性が画面表示と一致して含まれること",
    "IT-ADMIN-LOGIN-093": "passwordがmax+1のときログインが成立しないこと",
    "IT-ADMIN-LOGIN-094": "passwordがmax+1のとき長さ検証により拒否されること",
    "IT-ADMIN-LOGIN-095": "管理ログインページのCache-Control等がプロジェクト標準と矛盾しないこと",
    "IT-ADMIN-LOGIN-096": "管理ログインページのキャッシュヘッダーが当該環境のセキュリティ方針と整合すること",
    "IT-ADMIN-LOGIN-097": "管理ログイン画面でpasswordが平文表示されないこと",
    "IT-ADMIN-LOGIN-098": "管理ログイン画面で送信ボタン等の主要操作が活性であること",
}


def normalize_expect(cell: str) -> str:
    return cell.lstrip("・").strip()


def derive_prefix(parent: str) -> str:
    """親テスト項目名からシナリオ接頭辞を抽出する。"""
    p = parent.strip()
    if p.endswith("すること"):
        p = p[:-4]
    if "で" in p:
        return p[: p.index("で") + 1]
    m = re.match(
        r"^(.+?(?:時に|後は|場合は|場合|とき|すると|画面|URL|管理者は|会員))",
        p,
    )
    if m:
        return m.group(1)
    if "し" in p:
        return p.split("し", 1)[0]
    return p


def strip_expect_from_parent(parent: str, expects: list[str]) -> str:
    """親テスト項目名から期待結果相当の句を除きシナリオ接頭辞を得る。"""
    p = parent.strip()
    for e in sorted(expects, key=len, reverse=True):
        if e and e in p:
            p = p.replace(e, "")
    p = re.sub(r"[し、]+$", "", p)
    p = re.sub(r"(する|される|できる|ならない|ない)+こと$", "", p).rstrip("、し")
    p = p.strip()
    return p if len(p) >= 8 else derive_prefix(parent)


def join_prefix_expect(prefix: str, expect: str) -> str:
    e = normalize_expect(expect)
    if not prefix:
        return e
    p = prefix.rstrip()
    if e in p or p in e:
        return e
    if p.endswith("で"):
        tail = e.split("で", 1)[-1] if "で" in e else e
        if tail and tail in p:
            return e
        return f"{p}{tail}" if tail != e else f"{p}{e}"
    if p.endswith(("時に", "後は", "場合は", "場合", "とき", "すると")):
        return f"{p}{e}"
    if p.endswith(("に", "は", "が")):
        return f"{p}{e}"
    return f"{p}で{e}"


def refine_item_name(parent: str, expect: str, prefix: str | None = None) -> str:
    e = normalize_expect(expect)
    if prefix is not None:
        return join_prefix_expect(prefix, e)

    p = parent.strip()
    if e in p:
        return p

    if "で" in p and p.endswith("すること"):
        return join_prefix_expect(p[: p.index("で") + 1], e)

    if p.endswith("すること"):
        stem = p[: -len("すること")]
        return join_prefix_expect(stem, e)

    return join_prefix_expect(p, e)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("markdown_file", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    path = args.markdown_file
    text = path.read_text(encoding="utf-8")
    block_start, fence_end, block = extract_first_tsv_fence(text)
    rows = migrate_rows(parse_tsv_block(block))
    validate_rows(rows, context="入力")

    data = [list(r) for r in rows[1:] if len(r) == EXPECTED_COLUMNS]
    groups: dict[str, list[list[str]]] = defaultdict(list)
    for row in data:
        groups[row[COL_ITEM_NAME]].append(row)

    prefixes: dict[str, str] = {}
    for parent, members in groups.items():
        expects = [normalize_expect(m[COL_EXPECT]) for m in members]
        prefixes[parent] = strip_expect_from_parent(parent, expects)

    changes = 0
    for row in data:
        tid = row[COL_TEST_ID]
        parent = row[COL_ITEM_NAME]
        if tid in MANUAL:
            new_name = MANUAL[tid]
        else:
            new_name = refine_item_name(
                parent,
                row[COL_EXPECT],
                prefixes.get(parent) if parent in prefixes else None,
            )
        if new_name != row[COL_ITEM_NAME]:
            changes += 1
            if args.dry_run and changes <= 25:
                print(f"{tid}: {new_name[:75]}")
            row[COL_ITEM_NAME] = new_name

    print(f"変更件数: {changes}/{len(data)}")

    if args.dry_run:
        return 0

    new_rows = rows[:1] + data
    validate_rows(new_rows, context="更新後")
    new_block = rows_to_tsv_block(new_rows)
    path.write_text(text[:block_start] + new_block + text[fence_end:], encoding="utf-8")
    print(f"更新した: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
