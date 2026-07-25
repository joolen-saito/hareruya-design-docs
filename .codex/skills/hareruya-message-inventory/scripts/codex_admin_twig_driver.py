#!/usr/bin/env python3
"""管理画面 twig `|trans` 候補を codex で判定・機能割当・メタ確定する（捏造ゼロ）。

front 版 codex_front_twig_driver.py の admin 版。各候補について実ソース {EE} と設計書を読み、
1. verdict: message(運用メッセージ) / content(静的説明・注意書き) / label(見出し/ボタン/列名)。
2. message のみ: fid(M系機能ID) を twigパス→Controller(#[Template])→route→設計書 の連鎖で確定。
3. kind/where/disp/trigger/followup を実装から確定。不能なら "要ソース確認"。文言は yaml 逐語。

入力: /tmp/admin_twig_candidates.json / 出力: <out>/batch_NNN.json
使い方: python3 codex_admin_twig_driver.py --cands /tmp/admin_twig_candidates.json --out /tmp/admin_assign --batch 12
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
        "読み取り専用で判定。**創作禁止**。管理画面 twig で `|trans` 描画される候補を分類し、"
        "運用メッセージのみ機能へ割当てメタを確定します。実ソース: " + str(EE) + "\n"
        "設計書(機能ID→内容): " + str(REPO / "functions") + " の m*.md。\n\n"
        "各候補(key=翻訳キー / ja=日本語値 / en=英語値 / occ=描画twig:line):\n"
        + payload + "\n\n"
        "## 手順\n"
        "1. verdict 判定:\n"
        "   - message: 管理者への**運用通知**(入力検証エラー/登録・更新・削除・CSV取込等の完了/確認/"
        "警告/失敗/在庫・数量・状態等の業務エラー/『削除できません』等の制約通知)。\n"
        "   - content: 設定画面の注意書き・説明文・ガイド(HTMLリンク含む案内)等の**静的説明**。\n"
        "   - label: 見出し/ボタン/タブ/列名/メニュー/プレースホルダ。\n"
        "   content/label は以降不要(null)。\n"
        "2. fid: その文言を描画する twig を #[Template] に持つ Controller を特定し、route→設計書 m*.md から"
        " 機能ID(例 m04-12)を確定。occ の twig パス(Stock/Product/Order…)とキー名前空間を根拠に。"
        "共通部品(admin/index.twig 等)で特定不能なら \"要ソース確認\"。\n"
        "3. kind(種別): .error./検証→「エラー」or「バリデーション(エラー)」、完了→「インフォ(成功)」、"
        "確認ダイアログ→「確認」、警告→「警告」、制約通知→「エラー」、それ以外→「インフォ」。\n"
        "4. where(どこに): フォーム項目下→「入力項目付近」、上部通知→「画面上部」、"
        "ダイアログ→「画面中央(ダイアログ)」。disp(要素表示): インライン→「インラインエラー」、"
        "フラッシュ→「フラッシュメッセージ」、JS→「JSダイアログ」、本文→「本文テキスト」。\n"
        "5. trigger(表示条件): 何をしたとき出るかを管理者視点で簡潔に。不能なら\"要ソース確認\"。\n"
        "6. followup(後続処理): 「処理結果＋遷移先/留まる画面」。不能なら\"要ソース確認\"。\n\n"
        "## 出力(JSONLのみ、他文字禁止)\n"
        '{"key":"admin.product.stock.error.x","verdict":"message|content|label",'
        '"fid":"m04-12 or 要ソース確認 or null","kind":"..","where":"..","disp":"..",'
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
            if not res:
                # codex 応答なし(バックエンド503等)。空結果は保存せず後で再試行させる。
                print(f"[{i+1}/{len(batches)}] EMPTY(応答なし=再試行対象、保存せず)", flush=True)
                continue
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            msgs = sum(1 for o in res if o.get("verdict") == "message")
            print(f"[{i+1}/{len(batches)}] rows={len(b)} got={len(res)} message={msgs}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i+1}/{len(batches)}] TIMEOUT", flush=True)
        except Exception as e:
            print(f"[{i+1}/{len(batches)}] ERROR: {e}", flush=True)


if __name__ == "__main__":
    main()
