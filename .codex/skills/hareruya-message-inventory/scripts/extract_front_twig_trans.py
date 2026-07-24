#!/usr/bin/env python3
"""フロント template/default/**.twig の `{{ 'key'|trans }}` 直接描画メッセージを抽出する。

既存 extract_messages.py は flash / Form制約 / JS(alert・confirm・data-*) のみ走査し、
twig本文の `|trans` によるメッセージ描画を取りこぼす。フロントはこの描画が主流のため
本スクリプトで補完抽出する（捏造ゼロ: 文言は messages.ja/en.yaml の逐語のみ）。

出力: /tmp/front_twig_candidates.json = [{key, ja, en, group, occurrences:[file:line,...], is_message}]
  is_message: 値が文らしい(文末/助動詞/依頼表現) かの決定的ヒント（最終判定は codex）。

使い方: python3 extract_front_twig_trans.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
FRONT_TPL = EE / "src/Eccube/Resource/template/default"
OUT = Path("/tmp/front_twig_candidates.json")

# {{ 'front.x.y'|trans }} / {{ "front.x"|trans({...}) }} / {{ 'x'| trans }}
TRANS_RE = re.compile(r"""['"]((?:front|common)\.[A-Za-z0-9_.]+)['"]\s*\|\s*trans\b""")
# メッセージ性の決定的ヒント（文末・助動詞・依頼・結果表現）
MSG_HINT = re.compile(
    r"(。|！|\!|\？|\?|ください|ました|ません|できません|してください|いたしました|"
    r"お知らせ|完了|失敗|超えました|見つかり|一致し|お待ち|受け付け|送信し|登録し|変更し|"
    r"入力して|選択して|ご確認|恐れ入り|エラー|無効|不正|必要です|できます)"
)
# 明らかなラベル/ボタン/見出しキー（メッセージではない）
LABEL_KEY = re.compile(
    r"(page_title|\.title$|breadcrumb|nav__|progress_step|_button|button_|_alt$|"
    r"mascot|\.label$|_label$|placeholder|\.link$|back_to_|go_to_|register_deck|"
    r"barcode_notice|\.status$)"
)


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def main() -> None:
    trans_ja = dict(L.load_translations("ja"))
    trans_en = dict(L.load_translations("en"))
    # スペース入り英語キー等は load_translations が拾わないが front.* は dotted なので問題なし

    occ: dict[str, list[str]] = {}
    for path in sorted(FRONT_TPL.rglob("*.twig")):
        text = path.read_text(encoding="utf-8", errors="replace")
        try:
            rel = L.rel_ee(path)
        except ValueError:
            rel = str(path)
        for m in TRANS_RE.finditer(text):
            key = m.group(1)
            occ.setdefault(key, []).append(f"{rel}:{line_of(text, m.start())}")

    cands = []
    for key in sorted(occ):
        ja = trans_ja.get(key, "")
        en = trans_en.get(key, "")
        if not ja:
            continue  # 値が引けないキーは対象外（未定義キーは別問題）
        is_msg = bool(MSG_HINT.search(ja)) and not LABEL_KEY.search(key)
        cands.append({
            "key": key,
            "ja": ja,
            "en": en if en and en != ja else "",
            "group": key.split(".")[1] if key.count(".") >= 1 else "",
            "occurrences": sorted(set(occ[key]))[:6],
            "is_message": is_msg,
        })

    OUT.write_text(json.dumps(cands, ensure_ascii=False, indent=1), encoding="utf-8")
    msg = sum(1 for c in cands if c["is_message"])
    print(f"抽出: 全{len(cands)}キー / メッセージ性ヒント {msg} / ラベル性 {len(cands)-msg}")
    print(f"→ {OUT}")


if __name__ == "__main__":
    main()
