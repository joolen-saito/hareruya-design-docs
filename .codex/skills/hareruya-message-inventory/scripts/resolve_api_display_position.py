#!/usr/bin/env python3
"""A系(API)行の『どこに』『要素』= 要ソース確認 を実ソース根拠で確定する（捏造ゼロ・冪等）。

背景:
  A系機能は画面ではなくJSON応答を返すため『どこに(表示位置)』に画面上の位置は存在しない。
  ec-cube-enterprise の API 例外は BaseApiException 派生 → ExceptionListener が
  `JsonResponse(['code' => ..., 'errors' => [...]])` へ変換して返す。
  すなわち表示位置は一意に「API応答JSON（errors配列）」で確定する（推測ではない）。

根拠(実ソース):
  src/Eccube/Exception/App/BaseApiException.php:20-49   errors配列/statusCode を保持
  src/Eccube/EventListener/ExceptionListener.php:72-83  isAppApi() かつ BaseApiException で errors を採用
  src/Eccube/EventListener/ExceptionListener.php:136-138 JsonResponse(['code'=>..., 'errors'=>$errors])

『要素』(＝発火元のUI要素) も同様に、A系は画面を持たないため確定的に「該当なし」となる。
利用者が操作する画面要素は存在せず、発火契機は当該エンドポイントへのHTTPリクエストである。
※ A02-05 のように管理画面UIから発火する行は『要素』が実在するため対象外（既に確定済み）。

対象:
  メッセージID が ^A\\d で始まり、かつ『どこに』『要素』に「要ソース確認」を含む行のみ。
  既に確定済み(A17-04/A06-06〜08)で使われている正典値をそのまま踏襲する。

使い方:
  python3 resolve_api_display_position.py --dry-run
  python3 resolve_api_display_position.py --apply
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"

CANON_WHERE = "API応答JSON（errors配列）"
CANON_ELEMENT = "該当なし（画面要素を持たないAPI。発火契機は当該エンドポイントへのリクエスト）"
EVIDENCE = (
    "; 表示位置根拠 src/Eccube/EventListener/ExceptionListener.php:72-83,136-138"
    "（BaseApiException→JsonResponse(code,errors)）"
)
TARGET_ID = re.compile(r"^A\d")


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
    i_where, i_elem, i_evid = ic["どこに"], ic["要素"], ic["根拠(file:line)"]

    out = [lines[0]]
    n_where = n_elem = 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        if not TARGET_ID.match(row[0]):
            out.append(line)
            continue
        touched = False
        if "要ソース確認" in row[i_where]:
            print(f"{row[0]} どこに: 「{row[i_where]}」→「{CANON_WHERE}」")
            row[i_where] = CANON_WHERE
            n_where += 1
            touched = True
        if "要ソース確認" in row[i_elem]:
            print(f"{row[0]} 要素  : 「{row[i_elem]}」→「{CANON_ELEMENT}」")
            row[i_elem] = CANON_ELEMENT
            n_elem += 1
            touched = True
        if touched and EVIDENCE not in row[i_evid]:
            row[i_evid] = row[i_evid] + EVIDENCE
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"確定: どこに{n_where}件 / 要素{n_elem}件" + ("  (dry-run)" if not args.apply else ""))


if __name__ == "__main__":
    main()
