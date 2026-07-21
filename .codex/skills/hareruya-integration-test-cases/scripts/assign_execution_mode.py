#!/usr/bin/env python3
"""結合テスト台帳(all_it_cases.tsv)の各行に多軸の実行属性を機械付与する。

ユーザーゴール: 26,188件を各ケース「手動なのかPlaywrightなのか区別できる」ようにする。
codexレビュー反映: 単一排他の実行区分は誤り。多軸を正本とし、対外用に派生列
`UI実行`(手動/Playwright/Playwright+手動確認/非UI)を出す。

## 区分の考え方(GUI観測モデル・ユーザー指摘)
入り口がGUIの機能(FRONT/ADMIN)はPlaywrightで駆動できる。分かれ目は「駆動できるか」
でなく「期待値をGUI上で観測して合否判定できるか」:
  - GUIに出る値(一覧の登録値/エラーメッセージ/画面表示/遷移) → Playwright(駆動も判定も自動)
  - GUIに出ない値(DB内部値/pf・ee桁数差/暗号化・マスキング/履歴/ログ/ファイル/メール/外部状態)
    → Playwright+手動確認(GUI駆動+DB等で判定) または 手動
  - GUIで再現できない(実決済3DS/並行競合/タイムアウト) → 手動/専用
  - 入り口がGUIでない(API/バッチ) → 非UI(API駆動・CLI。Playwrightの画面操作ではない)

## 逆引きは使わない
ケースID→観点は生成器由来のtrace(一意)で解決する。(IT-ID,小項目)の逆引きは
187キー中55衝突・67%該当・行順で反転するため禁止(codex指摘)。trace未生成なら
本スクリプトが生成器を読み込みメモリ上で決定論的に再計算する(既存台帳とID一致を検証済)。
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import Counter
from pathlib import Path

GEN_PATH = ".codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py"


def load_generator(repo: Path):
    spec = importlib.util.spec_from_file_location("gen_mod", repo / GEN_PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["gen_mod"] = mod
    spec.loader.exec_module(mod)
    return mod


def compute_trace(repo: Path) -> dict:
    """testID -> Viewpoint。生成器のmake_rowsで決定論的に算出(既存台帳とID一致)。"""
    gen = load_generator(repo)
    vps = gen.read_viewpoints(repo / "integration_test" / "integration-test-viewpoints.md")
    trace = {}
    for h in gen.discover_html(repo):
        doc = gen.read_html(h)
        rows, selected, _ = gen.make_rows(doc, vps, 90, {"結合"})
        for row, vp in zip(rows, selected):
            trace[row[1]] = vp
    return trace


def channel_of(test_id: str) -> str:
    t = test_id.upper()
    for k, v in (("-FRONT-", "FRONT"), ("-ADMIN-", "ADMIN"), ("-API-", "API"),
                 ("-BATCH-", "BATCH"), ("-OTHER-", "OTHER")):
        if k in t:
            return v
    return "?"


# 視覚回帰(初回VRT承認が人手)になる観点キーワード
VISUAL = ("レイアウト", "表示位置", "表示サイズ", "フォント", "文字サイズ", "文字スタイル",
          "文字色", "見切れ", "画像の表示", "バナー", "ランダム表示", "活性", "非活性",
          "二度押し", "ウィンドウサイズ", "レイアウト崩れ", "UI部品", "ページング")
# GUIに出ない=DB/ログ等の直接確認が要る観点キーワード
NON_GUI_VALUE = ("暗号化", "マスキング", "エンコーディング", "サニタイジング", "ログ",
                 "機密情報", "履歴", "サロゲート", "文字列長", "最大長", "最小長", "桁")
# 聖域(全数実行必須)ドメイン
SANCTUARY_ITID = {"IT-06", "IT-07", "IT-08", "IT-33"}
SANCTUARY_LARGE = {"決済連携", "外部連携", "在庫引当", "注文・決済・在庫", "買取・査定",
                   "認証・認可", "状態遷移", "冪等・再処理", "非同期連携", "ポイント",
                   "販売価格", "金額計算", "通知"}


def classify(vp, channel: str) -> dict:
    cat, large, small = vp.category, vp.large, vp.label
    text = f"{large} {small} {vp.text}"
    is_visual = any(k in text for k in VISUAL)
    non_gui = any(k in text for k in NON_GUI_VALUE)
    # 聖域(RISK観点No.517-528・原子性/競合のIT-ID・上位ドメイン)
    try:
        is_risk = 517 <= int(vp.no) <= 528
    except (TypeError, ValueError):
        is_risk = False
    sanctuary = vp.it_id in SANCTUARY_ITID or large in SANCTUARY_LARGE or is_risk

    # --- 実行方法(UI実行) ---
    ui = "非UI"
    obs = "GUI"
    env = "なし"
    vrt = "0"
    fault = "0"

    if cat == "ウェブサービス":
        ui, obs = "非UI", "API応答"
        if large == "決済連携":
            ui, env = "手動", "実決済"
        elif large in ("外部連携", "通知"):
            ui, obs, fault = "非UI", "外部", "1"
    elif cat == "バッチアプリケーション" or channel == "BATCH":
        ui, obs = "非UI", "DB"
    elif cat in ("電文処理", "メッセージング"):
        ui, obs = "非UI", "外部"
    elif cat == "ファイル処理":
        if is_visual:  # 帳票の見た目
            ui, obs, vrt = "手動", "ファイル", "1"
        else:
            ui, obs = "非UI", "ファイル"
    elif cat == "メール処理":
        ui, obs = "非UI", "メール"
    elif cat == "ログ出力":
        ui, obs = "非UI", "ログ"
    elif cat == "バリデーション":
        # フォーム検証エラーはGUIに出る
        ui, obs = ("Playwright", "GUI")
        if channel in ("API", "BATCH"):
            ui, obs = "非UI", "API応答"
    elif cat == "ウェブアプリケーション":
        if channel in ("API", "BATCH", "OTHER") and channel != "?":
            ui, obs = "非UI", "DB"
        elif large == "決済連携":
            ui, env, obs = "手動", "実決済", "外部"
        elif large in ("在庫引当", "注文・決済・在庫", "冪等・再処理", "非同期連携") \
                or vp.it_id in ("IT-07", "IT-08"):
            ui, obs, fault = "手動", "DB+外部", "1"  # 並行・障害注入=専用ハーネス
        elif large == "通知":
            ui, obs = "非UI", "通知"
        elif large == "副作用" or "更新" in small and "抑止" in text:
            ui, obs = "Playwright+手動確認", "DB"  # 参照系で更新が無いことはGUIに出ない
        elif is_visual:
            ui, obs, vrt = "Playwright", "GUI", "1"
        elif large in ("状態遷移", "数量・金額", "履歴", "販売価格", "金額計算", "ポイント"):
            ui, obs = "Playwright+手動確認", "GUI+DB"
        else:
            ui, obs = "Playwright", "GUI"
    elif cat == "データベースアクセス":
        if channel in ("API", "BATCH"):
            ui, obs = "非UI", "DB"
        elif large == "DB制御" and any(k in text for k in ("排他", "ロック", "ロールバック")):
            ui, obs, fault = "手動", "DB", "1"  # 競合・障害注入=専用
        elif large in ("数量", "金額・単価", "履歴", "在庫引当") \
                or any(k in text for k in ("同時", "競合", "並行", "引当")):
            ui, obs = "Playwright+手動確認", "GUI+DB"
        elif large == "DB操作" and "検索" in text:
            ui, obs = "Playwright", "GUI"  # 検索結果は一覧で観測可
        elif non_gui:
            ui, obs = "Playwright+手動確認", "GUI+DB"  # 桁数/暗号化/履歴はGUIに出ない
        else:
            ui, obs = "Playwright+手動確認", "GUI+DB"  # 登録/更新の永続化はDB確認併用

    return {"UI実行": ui, "必須観測層": obs, "実環境依存": env,
            "VRT初回": vrt, "障害注入": fault, "聖域": "1" if sanctuary else "0"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--inject", action="store_true",
                    help="all_it_cases.tsv 自体に UI実行 列を追加する")
    args = ap.parse_args()
    repo = args.repo.resolve()
    it = repo / "integration_test"

    trace = compute_trace(repo)
    cases = list(csv.reader((it / "all_it_cases.tsv").open(encoding="utf-8"), delimiter="\t"))
    header, data = cases[0], [r for r in cases[1:] if len(r) >= 10]

    # trace台帳を永続化(契約ファイル。逆引きの代替)
    with (it / "case_viewpoint_trace.tsv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["テストID", "観点No", "IT-ID", "分類", "大項目", "中項目", "小項目"])
        for tid, vp in trace.items():
            w.writerow([tid, vp.no, vp.it_id, vp.category, vp.large, vp.middle, vp.small])

    # 実行属性を全ケースに付与(多軸台帳)
    ui_c, sanc_c, obs_c = Counter(), Counter(), Counter()
    assign_rows, ui_by_tid = [], {}
    unresolved = 0
    for r in data:
        tid = r[1]
        vp = trace.get(tid)
        ch = channel_of(tid)
        if vp is None:
            unresolved += 1
            attrs = {"UI実行": "手動", "必須観測層": "?", "実環境依存": "なし",
                     "VRT初回": "0", "障害注入": "0", "聖域": "1"}
            vpno = ""
        else:
            attrs = classify(vp, ch)
            vpno = vp.no
        ui_c[attrs["UI実行"]] += 1
        sanc_c[attrs["聖域"]] += 1
        obs_c[attrs["必須観測層"]] += 1
        ui_by_tid[tid] = attrs["UI実行"]
        assign_rows.append([tid, r[0], ch, vpno, attrs["UI実行"], attrs["必須観測層"],
                            attrs["実環境依存"], attrs["VRT初回"], attrs["障害注入"], attrs["聖域"]])

    with (it / "execution_assignment.tsv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["テストID", "機能名", "チャネル", "観点No", "UI実行", "必須観測層",
                    "実環境依存", "VRT初回", "障害注入", "聖域"])
        w.writerows(assign_rows)

    if args.inject:
        with (it / "all_it_cases.tsv").open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter="\t", lineterminator="\n")
            w.writerow(header + ["実行方法"])
            for r in data:
                w.writerow(r + [ui_by_tid.get(r[1], "手動")])

    total = len(data)
    print(f"総ケース: {total}  (trace未解決: {unresolved})")
    print("\n--- UI実行(手動/Playwright区別) ---")
    for k, v in ui_c.most_common():
        print(f"  {v:6d}  ({v/total*100:5.1f}%)  {k}")
    pw = ui_c["Playwright"] + ui_c["Playwright+手動確認"]
    manual = ui_c["手動"]
    nonui = ui_c["非UI"]
    print(f"\nPlaywright系(GUI): {pw} ({pw/total*100:.1f}%) / 手動: {manual} ({manual/total*100:.1f}%)"
          f" / 非UI(API・バッチ): {nonui} ({nonui/total*100:.1f}%)")
    print(f"聖域(全数必須): {sanc_c['1']}")
    print("\n--- 必須観測層 ---")
    for k, v in obs_c.most_common():
        print(f"  {v:6d}  {k}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
