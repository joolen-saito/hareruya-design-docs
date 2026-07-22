#!/usr/bin/env python3
"""EEスライスの機能割当を codex CLI 直接呼び出しで行う（Claudeサブエージェント不使用）。

fable5 レビューを外し codex 単独レビューにする運用。各テンプレ/ファイル群ごとに
codex exec(read-only) を1回呼び、JSONL で行ごとの帰属機能・逐語確定・要素等を得て
slices/ee/<slug>.resolved.tsv を書く。捏造ゼロと『割当先は実在設計書のみ』を機械ゲート。

resumable: resolved.tsv が既にあり --force でなければスキップ。

使い方:
  python3 codex_assign_driver.py --groups /tmp/ee_todo.json
  python3 codex_assign_driver.py --groups /tmp/ee_todo.json --only Controller_Admin_Card_004
  python3 codex_assign_driver.py --groups /tmp/ee_todo.json --force
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT
EE_DIR = REPO / "message_inventory" / "slices" / "ee"
FUNCTIONS = REPO / "functions"
FID_RE = re.compile(r"^[a-z]\d{2}-\d{2}$")
TODO = "要ソース確認"


def existing_fids() -> set[str]:
    return {m.group(1) for md in FUNCTIONS.rglob("*.md")
            if (m := re.match(r"([a-z]\d{2}-\d{2})_", md.name))}


def doc_title(fid: str) -> str:
    for md in FUNCTIONS.rglob(f"{fid}_*.md"):
        for line in md.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
        return fid
    return fid


def source_has(text: str) -> bool:
    frag = max(re.split(r"%[^%]+%|\{[^}]*\}|\\n", text), key=len).strip()
    if len(frag) < 4:
        frag = text.strip()[:20]
    if not frag:
        return True
    targets = [str(EE / "src/Eccube"), str(EE / "app"), str(EE / "html")]
    targets += [str(p) for p in sorted(EE.glob("vendor/symfony/*/Resources/translations")) if p.is_dir()]
    return subprocess.run(["grep", "-rqF", "--", frag, *targets], capture_output=True).returncode == 0


def build_prompt(slug: str, files: list[str]) -> str:
    return f"""読み取り専用で調査してください。創作・推測は禁止。出力は指定のJSONLのみ。

対象スライス: {REPO}/message_inventory/slices/ee/{slug}.tsv （1列目=メッセージID、根拠列=根拠(file:line)）
関係ソース: {', '.join(files)}
正本: {EE}  設計書: {REPO}/functions/**/*.md

各行について:
(a) 根拠の実コードを読み、そのメッセージを出すメソッドを特定し直上の #[Route(name:, path:)] を取る。
    FormType制約なら、そのFormTypeを使うController/ルートまで辿る。
(b) そのルート/URLパス/画面に対応する機能ID(例 m09-03)を {REPO}/functions の設計書から特定。
    設計書のURL・ルート名・画面名・処理内容を根拠にする。実在する機能IDのみ。無ければ null。
(c) メッセージ内容が根拠に逐語存在するか。変数/例外由来で単一literalに確定できなければ null。
同一controllerに複数機能がぶら下がる場合は行ごとにメソッド単位で切り分ける。

各行1オブジェクトのJSONL(他の文字を混ぜない):
{{"id":"EE-...","fid":"m09-03 or null","route":"名","evidence":"file:line の鎖","content_fixed":"逐語文言 or null","element":"操作要素","trigger":"表示条件","followup":"後続処理","note":"根拠 or 判定不能理由"}}"""


def run_codex(prompt: str, timeout: int) -> list[dict]:
    r = subprocess.run(
        ["codex", "exec", "--sandbox", "read-only", prompt],
        cwd=str(REPO), capture_output=True, text=True, timeout=timeout,
    )
    out = []
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o:
                    out.append(o)
            except json.JSONDecodeError:
                pass
    return out


def process(slug: str, files: list[str], docs: set[str], timeout: int) -> dict:
    slice_p = EE_DIR / f"{slug}.tsv"
    out_p = EE_DIR / f"{slug}.resolved.tsv"
    lines = slice_p.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    codex_out = run_codex(build_prompt(slug, files), timeout)
    by_id = {o["id"]: o for o in codex_out}

    assigned = unassigned = fixed = ghost = 0
    for r in rows:
        r[:] = (r + [""] * len(hdr))[: len(hdr)]
        o = by_id.get(r[0])
        if not o:
            unassigned += 1
            continue
        # メッセージ内容: 逐語確定できたものだけ反映（捏造ゼロ）
        cf = o.get("content_fixed")
        if cf and source_has(cf):
            if r[ic["メッセージ内容"]] != cf:
                r[ic["メッセージ内容"]] = cf
                fixed += 1
        # 機能割当: 実在設計書のみ
        fid = (o.get("fid") or "").strip()
        if FID_RE.match(fid) and fid in docs:
            r[ic["機能候補(要検証)"]] = fid
            r[ic["画面"]] = f"{fid} {doc_title(fid)}"
            assigned += 1
        else:
            if FID_RE.match(fid) and fid not in docs:
                ghost += 1
            r[ic["機能候補(要検証)"]] = f"未割当（{o.get('note', '')[:60]}）"
            unassigned += 1
        # 補助列（根拠が取れた範囲で）
        for col, key in (("要素", "element"), ("トリガー（条件）", "trigger"), ("後続処理", "followup")):
            v = (o.get(key) or "").strip()
            if v and r[ic[col]] in ("", TODO):
                r[ic[col]] = v
        ev = (o.get("evidence") or "").strip()
        if ev:
            r[ic["根拠(file:line)"]] = (r[ic["根拠(file:line)"]] + " | codex: " + ev)[:400]

    out_p.write_text("\t".join(hdr) + "\n" + "\n".join("\t".join(r) for r in rows) + "\n", encoding="utf-8")
    return {"slug": slug, "rows": len(rows), "assigned": assigned, "unassigned": unassigned,
            "fixed": fixed, "ghost": ghost, "codex_lines": len(codex_out)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--groups", required=True)
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--timeout", type=int, default=560)
    args = ap.parse_args()

    groups = json.load(open(args.groups, encoding="utf-8"))
    if args.only:
        groups = [g for g in groups if g["slug"] == args.only]
    docs = existing_fids()

    for i, g in enumerate(groups, 1):
        slug = g["slug"]
        out_p = EE_DIR / f"{slug}.resolved.tsv"
        if out_p.exists() and not args.force:
            print(f"[{i}/{len(groups)}] skip(既存) {slug}", flush=True)
            continue
        try:
            res = process(slug, g.get("files", []), docs, args.timeout)
            print(f"[{i}/{len(groups)}] {slug}  assigned={res['assigned']} "
                  f"unassigned={res['unassigned']} fixed={res['fixed']} ghost={res['ghost']} "
                  f"codex={res['codex_lines']}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(groups)}] TIMEOUT {slug}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(groups)}] ERROR {slug}: {e}", flush=True)


if __name__ == "__main__":
    main()
