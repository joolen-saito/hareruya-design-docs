#!/usr/bin/env python3
"""フロント twig `|trans` 候補を codex で判定・機能割当・メタ確定する（捏造ゼロ）。

各候補(key/ja/en/描画箇所)について実ソース {EE} と設計書を読み、
1. 判定 verdict: message(運用メッセージ=flash/検証/完了/確認/エラー通知) /
   content(規約・プライバシー・SEO・案内本文等の静的ページ文) / label(見出し/ボタン/ナビ)。
2. message のみ: fid(F系機能ID) を twigパス→Controller(#[Template])→route→設計書 の連鎖で確定。
3. kind(種別)/where(どこに)/disp(要素表示)/trigger(表示条件)/followup(後続処理) を実装から確定。
   不能なら "要ソース確認"。文言(ja/en)は yaml 逐語で確定済みなので検証のみ。

入力: /tmp/front_new_msgs.json （バッチ分割は --start/--count）
出力: <out>/<batch>.json = [{key,verdict,fid,kind,where,disp,trigger,followup,note}]

使い方: python3 codex_front_twig_driver.py --cands /tmp/front_new_msgs.json --out /tmp/front_assign --batch 12
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT


def build_prompt(rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return (
        "読み取り専用で判定。**創作禁止**。フロント twig で `|trans` 描画される候補を分類し、"
        "運用メッセージのみ機能へ割当てメタを確定します。実ソース: " + str(EE) + "\n"
        "設計書(機能ID→内容): " + str(REPO / "functions") + " の f*.md。\n\n"
        "各候補(key=翻訳キー / ja=日本語値 / en=英語値 / occ=描画twig:line):\n"
        + payload + "\n\n"
        "## 手順\n"
        "1. verdict 判定:\n"
        "   - message: 利用者への**運用通知**(入力検証エラー/登録・変更・送信の完了/確認/警告/失敗/"
        "在庫・数量・ポイント等の業務エラー)。フォーム項目のエラー文やフラッシュ相当も message。\n"
        "   - content: 規約・プライバシーポリシー・SEO説明・案内本文・注意書き等の**静的ページ文**。\n"
        "   - label: 見出し/ボタン/ナビ/パンくず/ステップ表示。\n"
        "   content/label は以降不要(null)。\n"
        "2. fid: その文言を描画する twig を #[Template] に持つ Controller を特定し、route→設計書 f*.md から"
        " 機能ID(例 f06-01)を確定。occ の twig パスとキー名前空間(front.entry/mypage/shopping…)を根拠に。"
        "断定不能なら \"要ソース確認\"。\n"
        "3. kind(種別): .error./検証→「エラー」or「バリデーション(エラス)」、完了→「インフォ(成功)」、"
        "確認ダイアログ→「確認」、警告→「警告」、それ以外の通知→「インフォ」。\n"
        "4. where(どこに): フォーム項目下→「入力項目付近」、ページ上部通知→「画面上部」、"
        "完了画面本文→「完了画面本文」。disp(要素表示): インライン→「インラインエラー」、"
        "フラッシュ→「フラッシュメッセージ」、本文→「本文テキスト」。\n"
        "5. trigger(表示条件): 何をしたとき出るかを利用者視点で簡潔に(内部用語禁止)。不能なら\"要ソース確認\"。\n"
        "6. followup(後続処理): 「処理結果＋遷移先/留まる画面」。不能なら\"要ソース確認\"。\n\n"
        "## 出力(JSONLのみ、他文字禁止)\n"
        '{"key":"front.entry.error.name01_required","verdict":"message|content|label",'
        '"fid":"f06-01 or 要ソース確認 or null","kind":"..","where":"..","disp":"..",'
        '"trigger":"..","followup":"..","note":"根拠file:line"}'
    )


def run_codex(prompt: str, timeout: int):
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = []
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "key" in o and "verdict" in o:
                    out.append(o)
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cands", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", type=int, default=12)
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    cands = json.load(open(args.cands, encoding="utf-8"))
    # occ を短縮して渡す
    for c in cands:
        c["occ"] = c.pop("occurrences", [])[:4]
        c.pop("is_message", None)
        c.pop("group", None)
    batches = [cands[i:i + args.batch] for i in range(0, len(cands), args.batch)]
    for i, b in enumerate(batches):
        rp = outdir / f"batch_{i:03d}.json"
        if rp.exists():
            print(f"[{i+1}/{len(batches)}] skip", flush=True)
            continue
        try:
            res = run_codex(build_prompt(b), args.timeout)
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            msgs = sum(1 for o in res if o.get("verdict") == "message")
            print(f"[{i+1}/{len(batches)}] rows={len(b)} got={len(res)} message={msgs}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i+1}/{len(batches)}] TIMEOUT", flush=True)
        except Exception as e:
            print(f"[{i+1}/{len(batches)}] ERROR: {e}", flush=True)


if __name__ == "__main__":
    main()
