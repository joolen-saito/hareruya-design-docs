#!/usr/bin/env python3
"""EE-* 未割当行の『機能候補(要検証)』= 要ソース確認 を、未割当の**理由**で確定する（冪等）。

方針（ユーザー決定に基づく）:
  EE-* は「正本設計書へ載せる先が無い」ためのバケットである。機能を推測で埋めることはしない。
  ただし `要ソース確認`（＝これから調べる）を残すのは実状と異なる。調査は済んでおり、
  「なぜ単一機能へ帰属しないのか」が結論である。よって理由を明記して確定させる。

理由の分類（すべて実ソース/設計書で確認済み）:
  A 設計書不在(デッキ)      フロントのデッキ検索/メタゲーム/デッキ詳細に対応する f*.md が functions/ に無い
  B 全画面共通フレーム       default_frame.twig / admin/index.twig / info.twig / notice_debug_mode.twig
  C 共有フォーム制約         会員登録・会員情報変更・パスワード変更などで共有される制約文言
  D 共有テンプレート         base_csv_upload.twig / csv_product.twig を複数のCSV取込機能が include
  E 設計書不在(管理画面)     /{admin_route}/setting/shop/mail は m10-09 が明示的に対象外と記載
  F プラグイン基盤           EC-CUBE本体のプラグイン管理・オーナーズストア連携。ハレルヤ設計書の対象外
  G 割当候補あり・判断待ち   単一の機能docが特定できるが、ID再採番と設計書追記を伴うため保留

使い方:
  python3 resolve_ee_unassigned.py --dry-run
  python3 resolve_ee_unassigned.py --apply
"""
from __future__ import annotations

import argparse

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

A_DECK = ("未割当(設計書不在): フロントのデッキ機能（デッキ検索/メタゲーム/デッキ詳細）に対応する"
          "正本設計書が functions/ に存在しないため、載せる先が無い。推測での割当は行わない。")
B_FRAME = ("未割当(全画面共通フレーム): {tpl} は全画面共通のフレーム／横断通知テンプレートであり、"
           "特定の機能設計書に帰属しない。")
C_FORM = ("未割当(共有フォーム制約): 会員登録(f06-01)・会員情報変更(f06-18)・パスワード変更など"
          "複数機能のフォームで共有される制約文言のため、単一の機能設計書へ帰属しない。")
D_SHARED = ("未割当(共有テンプレート): {tpl} は複数のCSV取込機能が include する共通テンプレートであり、"
            "単一の機能設計書へ帰属しない。")
F_PLUGIN = ("未割当(プラグイン基盤): EC-CUBE本体のプラグイン管理／オーナーズストア連携（{src}）に属し、"
            "ハレルヤ機能設計書の対象範囲外。")

FIXES: dict[str, str] = {
    # A: デッキ機能（設計書不在）
    "EE-FRONT-MSG-001": A_DECK,
    "EE-FRONT-MSG-002": A_DECK,
    "EE-FRONT-MSG-003": A_DECK,
    "EE-FRONT-MSG-004": A_DECK,
    # B: 全画面共通フレーム／横断通知
    "EE-FRONT-MSG-017": B_FRAME.format(tpl="default/default_frame.twig:120-136"),
    "EE-ADMIN-MSG-001": B_FRAME.format(tpl="admin/index.twig:110（管理画面URLの注意喚起）"),
    "EE-ADMIN-MSG-004": B_FRAME.format(tpl="admin/notice_debug_mode.twig:4"),
    "EE-ADMIN-MSG-005": B_FRAME.format(tpl="admin/info.twig:4"),
    # C: 複数機能で共有されるフォーム制約
    "EE-FRONT-MSG-005": C_FORM,
    "EE-FRONT-MSG-018": C_FORM,
    "EE-FRONT-MSG-019": C_FORM,
    "EE-FRONT-MSG-020": C_FORM,
    "EE-FRONT-MSG-021": C_FORM,
    # D: 複数機能で共有される共通テンプレート
    "EE-ADMIN-MSG-002": D_SHARED.format(tpl="admin/Product/base_csv_upload.twig:43"),
    "EE-ADMIN-MSG-006": D_SHARED.format(tpl="admin/Product/csv_product.twig:292"),
    # E: 設計書不在（管理画面）
    "EE-ADMIN-MSG-007": (
        "未割当(設計書不在): メールテンプレート編集 `/{admin_route}/setting/shop/mail` に対応する"
        "正本設計書が存在しない。m10-09（店舗基本設定のメールアドレス設定）は本文:13 で"
        "「通知メールのテンプレート編集は別パス」と明記し対象外としている。"
    ),
    "EE-ADMIN-MSG-008": (
        "未割当(設計書不在): メールテンプレート編集 `/{admin_route}/setting/shop/mail` に対応する"
        "正本設計書が存在しない。m10-09 は本文:13 で当該パスを対象外と明記している。"
    ),
    # F: プラグイン基盤
    "EE-ADMIN-MSG-009": F_PLUGIN.format(src="admin/Store/plugin_table.twig:142"),
    "EE-ADMIN-MSG-010": F_PLUGIN.format(src="admin/Store/plugin_confirm_panel.twig:36"),
    "EE-ADMIN-MSG-011": F_PLUGIN.format(src="admin/Store/authentication_setting.twig:195"),
    "EE-ERROR-MSG-001": F_PLUGIN.format(src="Service/PluginService.php:340"),
    "EE-ERROR-MSG-002": F_PLUGIN.format(src="Service/PluginService.php:477"),
    # G: 割当候補あり・判断待ち
    "EE-ADMIN-MSG-003": (
        "割当候補あり(判断待ち): 根拠 admin/Order/edit.twig:1604 は受注編集画面であり、"
        "正本設計書 m05-11（受注編集）が実在する。M05-11-MSG-### への再採番と設計書『表示メッセージ』表への"
        "追記を伴うため、実施可否はユーザー判断待ちとして現IDを維持する。"
    ),
    "EE-ERROR-MSG-006": (
        "割当候補あり(判断待ち): 根拠 Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:92 は、"
        "同クラス同メソッド:69 由来の A06-05-MSG-002（a06-05 に割当済み）と同一の店頭買取受注ステータス更新APIに属する。"
        "A06-05-MSG-### への再採番と設計書追記を伴うため、実施可否はユーザー判断待ちとして現IDを維持する。"
    ),
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
    i_cand = header.index("機能候補(要検証)")

    out, changed, skipped = [lines[0]], 0, 0
    seen = set()
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        new = FIXES.get(row[0])
        if new:
            seen.add(row[0])
            if row[i_cand].strip() == "要ソース確認":
                row[i_cand] = new
                changed += 1
                print(f"{row[0]}: 理由を確定")
            elif row[i_cand] == new:
                skipped += 1
            else:
                raise SystemExit(f"想定外: {row[0]} の機能候補が既定値でない -> {row[i_cand][:60]}")
            out.append("\t".join(row))
        else:
            out.append(line)

    missing = set(FIXES) - seen
    if missing:
        raise SystemExit(f"正本に不在のID: {sorted(missing)}")
    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"確定{changed} / 冪等skip{skipped}" + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()
