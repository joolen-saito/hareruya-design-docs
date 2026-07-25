#!/usr/bin/env python3
"""管理画面 template/admin/**.twig の `{{ 'admin.x'|trans }}` 直接描画メッセージを抽出する。

front 版 extract_front_twig_trans.py の admin 版。既存 extract_messages.py は flash/Form制約/
JS のみ走査し twig本文の |trans を取りこぼすため補完抽出する（捏造ゼロ: 文言は yaml 逐語のみ）。
既に正本(message_inventory.tsv)に収録済みの文言は候補から除く。

出力: /tmp/admin_twig_candidates.json = [{key,ja,en,group,occurrences,is_message}]
使い方: python3 extract_admin_twig_trans.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
ADMIN_TPL = EE / "src/Eccube/Resource/template/admin"
MASTER = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
OUT = Path("/tmp/admin_twig_candidates.json")

TRANS_RE = re.compile(r"""['"]((?:admin|common)\.[A-Za-z0-9_.]+)['"]\s*\|\s*trans\b""")
MSG_HINT = re.compile(
    r"(。|！|\!|\？|\?|ください|ました|ません|できません|してください|いたしました|"
    r"お知らせ|完了|失敗|超えました|見つかり|一致し|お待ち|受け付け|送信し|登録し|変更し|"
    r"入力して|選択して|ご確認|恐れ入り|エラー|無効|不正|必要です|できます)"
)
LABEL_KEY = re.compile(
    r"(page_title|\.title$|breadcrumb|nav__|progress_step|_button|button_|_alt$|"
    r"mascot|\.label$|_label$|placeholder|\.link$|back_to_|go_to_|"
    r"\.status$|__col$|_col$|\.header$|_th$|\.menu|_menu\b|\.tab$|_tab$)"
)


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def load_master_contents() -> set[str]:
    """正本に既収録の文言(正規化)集合。重複収録を避ける。"""
    lines = MASTER.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    out = set()
    for l in lines[1:]:
        if not l.strip():
            continue
        f = l.split("\t")
        v = f[ic["メッセージ内容"]].replace("\\n", "").strip()
        if v:
            out.add(v)
    return out


def main() -> None:
    trans_ja = dict(L.load_translations("ja"))
    trans_en = dict(L.load_translations("en"))
    seen_contents = load_master_contents()

    occ: dict[str, list[str]] = {}
    for path in sorted(ADMIN_TPL.rglob("*.twig")):
        text = path.read_text(encoding="utf-8", errors="replace")
        try:
            rel = L.rel_ee(path)
        except ValueError:
            rel = str(path)
        for m in TRANS_RE.finditer(text):
            occ.setdefault(m.group(1), []).append(f"{rel}:{line_of(text, m.start())}")

    cands = []
    already = 0
    for key in sorted(occ):
        ja = trans_ja.get(key, "")
        if not ja:
            continue
        is_msg = bool(MSG_HINT.search(ja)) and not LABEL_KEY.search(key)
        if not is_msg:
            continue
        if ja.replace("\\n", "").strip() in seen_contents:
            already += 1
            continue
        en = trans_en.get(key, "")
        cands.append({
            "key": key,
            "ja": ja,
            "en": en if en and en != ja else "",
            "group": key.split(".")[1] if key.count(".") >= 1 else "",
            "occurrences": sorted(set(occ[key]))[:6],
            "is_message": True,
        })

    OUT.write_text(json.dumps(cands, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"admin twig: 全trans key {len(occ)} / メッセージ性かつ正本未収録 {len(cands)} "
          f"/ 既収録スキップ {already}")
    print(f"→ {OUT}")


if __name__ == "__main__":
    main()
