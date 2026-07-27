#!/usr/bin/env python3
"""日本語文言が解決するロケールキーと、英語列が対応しているかを検査する。

## 背景（codex敵対的レビュー 2026-07-27）
`validate_messages.py` は英語列も「ソースのどこかに逐語存在するか」しか見ない。
そのため **別キーの英語を流用**していても PASS する。実例:
  form_error.numeric_only  ja=「数字で入力してください。」 en=`Entry must be numbers.`(validators.en.yaml:32)
  しかし棚卸しには `Please enter with numbers.` が入っていた
  （これは別キー admin.setting.shop.delivery.fee.invalid の英語 / messages.en.yaml:2757）。

## 判定
ja 候補が **ちょうど1つのロケールキー**の ja 値と完全一致し、かつそのキーに en 定義がある行について、
英語列がその en 値と一致するかを検査する。不一致＝EN_MISMATCH。

判定できない行（ja が複数キーに一致 / ja がハードコード直リテラル / en 未定義 /「（英訳なし）」）は
SKIP とし、誤検出を出さない。

使い方:
  python3 check_en_pairing.py [--out mismatch.tsv]
終了コード非0で EN_MISMATCH あり（CIゲート用）。
"""
from __future__ import annotations

import argparse
import csv
import re
import sys

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
SKIP_EN = {"", "（英訳なし）", "—", "-"}
FILE_LINE = re.compile(r"([\w./-]+\.(?:php|twig|js))[: ](\d+)")
_fcache: dict[str, list[str]] = {}


def evidence_blob(ev: str, window: int = 4) -> str:
    """根拠の file:line が指すソース行の周辺テキストを連結して返す（キー一意化用）。"""
    parts = []
    for rel, line in FILE_LINE.findall(ev):
        rel = re.sub(r"^(?:\./)?ec-cube-enterprise/", "", rel)
        p = L.EE_ROOT / rel
        if not p.is_file():
            hits = [h for h in L.EE_ROOT.glob(f"src/**/{rel.split('/')[-1]}") if h.is_file()]
            if len(hits) != 1:
                continue
            p = hits[0]
        key = str(p)
        if key not in _fcache:
            _fcache[key] = p.read_text(encoding="utf-8", errors="replace").splitlines()
        lines = _fcache[key]
        n = int(line)
        parts.append("\n".join(lines[max(0, n - 1 - window):n + window]))
    return "\n".join(parts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--apply", action="store_true",
                    help="検出した不一致を正しい en へ是正する（ロケール定義が唯一の正）")
    args = ap.parse_args()

    ja = L.load_translations("ja")
    en = L.load_translations("en")
    # Symfony 同梱 xlf は <source>=英語原文 / <target>=日本語 の対で、これも正当な ja/en 対応。
    # ee のロケールキーと ja 値が偶然一致することがあるため、xlf 対を先に許容しないと誤検出になる。
    xlf_pairs: dict[str, set[str]] = {}
    for p in L.EE_ROOT.glob("vendor/symfony/*/Resources/translations/validators.ja.xlf"):
        txt = p.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r"<source>(.*?)</source>\s*<target>(.*?)</target>", txt, re.S):
            xlf_pairs.setdefault(m.group(2).strip(), set()).add(m.group(1).strip())
    # ja値 -> keys（一意に決まるものだけ使う）
    ja2keys: dict[str, list[str]] = {}
    for k, v in ja.items():
        ja2keys.setdefault(v.strip(), []).append(k)

    rows = L.read_master_rows(TSV)
    checked = bad = 0
    out: list[dict] = []

    for r in rows:
        ja_cands = [c.strip() for c in r["メッセージ内容"].split("／") if c.strip()]
        en_cands = [c.strip() for c in r["メッセージ内容(英語)"].split("／") if c.strip()]
        if len(ja_cands) != len(en_cands):
            continue  # 候補数が対応しない行は対象外
        for jv, ev in zip(ja_cands, en_cands):
            if ev in SKIP_EN:
                continue
            jv_n = jv.replace("\\n", "\n").strip()
            # Symfony xlf の対として成立していれば正（ee キーと ja 値が衝突しても誤検出しない）
            if ev.replace("\\n", "\n").strip() in xlf_pairs.get(jv_n, set()):
                continue
            keys = ja2keys.get(jv_n, []) or ja2keys.get(jv, [])
            if not keys:
                continue  # ja がロケール値に落ちない（ハードコード直リテラル等）
            # 複数キーに一致する場合、根拠でキーを一意化する
            #   (1) 根拠/解決状態の本文にキー名が書かれている
            #   (2) 根拠の file:line が指すソース行の周辺に 'key' が書かれている
            named = [k for k in keys if k in r["根拠(file:line)"] or k in r["解決状態"]]
            if not named:
                blob = evidence_blob(r["根拠(file:line)"])
                named = [k for k in keys if f"'{k}'" in blob or f'"{k}"' in blob]
            if named:
                keys = named
            # 複数キーに一致しても、en が全キーで一致するなら期待値は一意に定まる
            exps = {en[k].strip() for k in keys if en.get(k)}
            if len(exps) != 1:
                continue  # en 未定義 / キーによって en が割れる
            expect = exps.pop()
            checked += 1
            if ev.replace("\\n", "\n").strip() != expect:
                bad += 1
                out.append({"メッセージID": r["メッセージID"], "キー": "|".join(sorted(keys)),
                            "ja": jv[:44], "en(記載)": ev[:70], "en(正)": expect[:70]})

    print(f"照合可能 {checked}件 / EN_MISMATCH={bad}（{len({o['メッセージID'] for o in out})}行）")
    for o in out[:40]:
        print(f"  {o['メッセージID']:18s} {o['キー'][:42]:44s}")
        print(f"      記載: {o['en(記載)']}")
        print(f"      正  : {o['en(正)']}")
    if args.out and out:
        with open(args.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(out[0]), delimiter="\t")
            w.writeheader()
            w.writerows(out)
        print(f"→ {args.out}")

    if args.apply and out:
        # 同一IDの複数候補にも対応できるよう「記載→正」の逐語置換で適用する
        fixes: dict[str, list[tuple[str, str]]] = {}
        for o in out:
            fixes.setdefault(o["メッセージID"], []).append((o["en(記載)"], o["en(正)"]))
        lines = TSV.read_text(encoding="utf-8").splitlines()
        header = lines[0].split("\t")
        i_en = header.index("メッセージ内容(英語)")
        new_lines, n = [lines[0]], 0
        for line in lines[1:]:
            if not line.strip():
                continue
            cells = line.split("\t")
            for old_en, new_en in fixes.get(cells[0], []):
                if old_en in cells[i_en]:
                    cells[i_en] = cells[i_en].replace(old_en, new_en)
                    n += 1
                    print(f"  是正 {cells[0]}: 「{old_en}」→「{new_en}」")
            new_lines.append("\t".join(cells))
        TSV.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        print(f"是正 {n}件 → generate_message_list.py / sync_doc_tables.py / HTML再生成 を実行すること")
        return 0
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main())
