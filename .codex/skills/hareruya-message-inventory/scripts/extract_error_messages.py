#!/usr/bin/env python3
"""codex網羅レビューで検出した「エラー系」未収録メッセージ源を決定的に抽出する（捏造ゼロ）。

対象クラス（flash/フォーム制約/JS/twig|trans では拾えない経路）:
  A) PHP 例外: `throw new *Exception(trans('key') | '和文literal')` … ExceptionListener→error.twig
     や getMessage()→JSON でユーザーに表示され得る。
  B) PHP JSONレスポンス直書き: `JsonResponse([... '和文' ...])` 等の Ajax エラー文言。
  C) twig ハードコード和文: `>…和文…<` でタグ間に直接表示され、`|trans` を持たない“メッセージ性”テキスト
     （純ラベル/見出しは除外）。

文言は**実ソース逐語**。trans キーは yaml 逐語で ja/en 補完。最終判定(message/機能/メタ)は codex。
出力: /tmp/error_msg_candidates.json = [{cls,key,ja,en,occ}]
使い方: python3 extract_error_messages.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
OUT = Path("/tmp/error_msg_candidates.json")
JP = r"[ぁ-んァ-ヶ一-龥々ー]"

PHP_DIRS = [EE / "src/Eccube/Controller", EE / "src/Eccube/Service",
            EE / "src/Eccube/EventListener", EE / "src/Eccube/Form", EE / "app"]
TPL_DIRS = [EE / "src/Eccube/Resource/template/default",
            EE / "src/Eccube/Resource/template/admin",
            EE / "src/Eccube/Resource/template/common"]

THROW_RE = re.compile(r"throw new [A-Za-z_]*Exception\(\s*(.+)")
JSON_LINE = re.compile(r"(JsonResponse|->json\(|setData\()")
TRANS_ARG = re.compile(r"trans\(\s*['\"]([A-Za-z][\w.]+)['\"]")
JP_LIT = re.compile(r"['\"]([^'\"]*" + JP + r"[^'\"]*)['\"]")
# twig タグ間テキスト
TWIG_TEXT = re.compile(r">\s*([^<>{}]*" + JP + r"[^<>{}]*?)\s*<")
MSG_HINT = re.compile(
    r"(ました|ません|ありません|でした|ください|できません|してください|いたしました|"
    r"完了|失敗|見つかり|一致し|超えました|受け付け|無効|不正|必要です|。$|！$)")
# 純ラベル/見出しっぽい短句（メッセージ除外用）: 文末・依頼・否定が無く短い
LABEL_HINT = re.compile(r"^(合計|平均|小計|商品ID|検索|一覧|登録|編集|削除|設定|管理|明細|履歴|詳細)[^。]{0,6}$")


def norm(s: str) -> str:
    return s.replace("\\n", "").strip()


def main() -> None:
    ja_map = dict(L.load_translations("ja"))
    en_map = dict(L.load_translations("en"))

    # master 既収録文言（重複排除）
    lines = (L.DOC_ROOT / "message_inventory/message_inventory.tsv").read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    seen = set()
    for l in lines[1:]:
        if l.strip():
            v = norm(l.split("\t")[ic["メッセージ内容"]])
            if v:
                seen.add(v)

    cands = []
    seen_local = set()

    def add(cls, key, ja, en, occ):
        ja = ja.strip()
        if not ja or norm(ja) in seen:
            return
        k = (cls, ja, occ)
        if k in seen_local:
            return
        seen_local.add(k)
        cands.append({"cls": cls, "key": key or "", "ja": ja, "en": en or "", "occ": occ})

    # A) + B) PHP
    for d in PHP_DIRS:
        if not d.exists():
            continue
        for p in d.rglob("*.php"):
            try:
                rel = L.rel_ee(p)
            except ValueError:
                rel = str(p)
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                s = line.strip()
                if s.startswith(("//", "*", "#")):
                    continue
                m = THROW_RE.search(line)
                if m:
                    arg = m.group(1)
                    tk = TRANS_ARG.search(arg)
                    if tk:
                        key = tk.group(1)
                        ja = ja_map.get(key, "")
                        if ja and re.search(JP, ja):
                            add("php_exception", key, ja, en_map.get(key, "") if en_map.get(key) != ja else "", f"{rel}:{i}")
                    else:
                        for lit in JP_LIT.findall(arg):
                            add("php_exception", "", lit, "", f"{rel}:{i}")
                    continue
                if JSON_LINE.search(line):
                    for lit in JP_LIT.findall(line):
                        # trans('key') 経由は別で拾うのでリテラルのみ
                        if MSG_HINT.search(lit) or re.search(JP, lit):
                            add("php_json_literal", "", lit, "", f"{rel}:{i}")

    # C) twig hardcoded（|trans を含まない行のタグ間テキスト）
    for d in TPL_DIRS:
        if not d.exists():
            continue
        for p in d.rglob("*.twig"):
            try:
                rel = L.rel_ee(p)
            except ValueError:
                rel = str(p)
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                if "trans" in line or "{{" in line or "{%" in line:
                    continue
                for m in TWIG_TEXT.finditer(line):
                    t = m.group(1).strip()
                    if not MSG_HINT.search(t) or LABEL_HINT.search(t):
                        continue
                    add("twig_hardcoded", "", t, "", f"{rel}:{i}")

    OUT.write_text(json.dumps(cands, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter
    print("抽出:", dict(Counter(c["cls"] for c in cands)), "計", len(cands))
    print("→", OUT)


if __name__ == "__main__":
    main()
