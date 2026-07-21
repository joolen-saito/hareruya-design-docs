#!/usr/bin/env python3
"""結合テスト台帳(all_it_cases.tsv)の各行に「実行区分」と「聖域フラグ」を機械付与する。

目的: 26,188行を4人3か月で回すため、実行工数の圧縮可否を定量化する。
台帳(網羅)は一切削らない。付与するのは「どう実行するか」の割当のみ。

決定論的・再実行可能。テストIDは再生成で振り直るため、生成のたびに本スクリプトを
再実行すること(別ファイルに固定値を持たせないので陳腐化しない)。

付与する列:
  実行区分 : manual / automated-UI / automated-API / automated-DB / contract
  聖域     : 1=全数実行必須(サンプリング禁止) / 0=通常
  チャネル : フロント/管理/API/バッチ/その他 (テストID由来)
  観点No   : 観点マスタの No (逆引き結果。トレーサビリティ用)

聖域(sanctuary)は実行区分と直交する。「聖域=手動」ではなく「聖域=全数必ず実行し、
代表・サンプリングで置き換えてはならない」の意味。優先度(P1/P2/P3)は聖域判定に
使わない — ロールバック観点256件が全件P3であり、優先度で層別すると原子性の中核が
黙って落ちるため(fable5実測・codex同旨)。
"""
from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path

# ---- 実行区分の判定キー ----------------------------------------------------
# 決済は実サンドボックス接続が要り、3DS遷移・webhook到達順・タイムアウトを
# 決定的に再現できないため全件手動(fable5/codex一致)。
MANUAL_DAI = {"決済連携"}

# 外部I/Fの重複・順序逆転・再送・部分失敗は consumer/provider 契約 + 障害注入で見る。
# 実接続の自動E2Eに畳むと「観測したいバグクラス」が消える(fable5指摘)。
CONTRACT_DAI = {"外部連携", "通知"}
CONTRACT_CHU = {"Webhook・外部通知", "下流転送", "連携エラー", "WebSocket"}

API_BUNRUI = {"ウェブサービス"}
API_DAI = {"ウェブサービス機能", "API", "API-公開側"}
# DB/バリデーションは functional(WebTestCase)層。pf=MySQL(バイト)/ee=PostgreSQL(文字)の
# 意味論差があるため Form層とDB層の両方をアサートすること(片層省略は不可)。
DB_BUNRUI = {"データベースアクセス", "バリデーション"}
# 「副作用」は参照系でDB/セッション/Cookie/ファイルに書き込みが無いことの検証＝DB層観測。
DB_DAI = {"DB操作", "DB制御", "バリデーション", "数量", "金額・単価", "履歴", "在庫引当",
          "副作用"}
# サーバ側副作用(ファイル/メール/ログ/電文/バッチ)も functional で検証する。
SERVER_BUNRUI = {"ファイル処理", "メール処理", "ログ出力", "バッチアプリケーション",
                 "電文処理", "メッセージング"}

# ---- 聖域(全数実行必須)の判定キー ------------------------------------------
# 原子性・競合・冪等の中核。IT-06=ロールバック(全件P3), IT-07=排他制御, IT-08=二重実行/冪等。
SANCTUARY_ITID = {"IT-06", "IT-07", "IT-08", "IT-33"}
SANCTUARY_DAI = {"決済連携", "外部連携", "在庫引当", "注文・決済・在庫", "買取・査定",
                 "認証・認可", "状態遷移", "冪等・再処理", "非同期連携", "ポイント",
                 "販売価格", "金額計算"}


def channel_of(test_id: str) -> str:
    t = test_id.upper()
    for key, name in (("-FRONT-", "フロント"), ("-ADMIN-", "管理"), ("-API-", "API"),
                      ("-BATCH-", "バッチ"), ("-OTHER-", "その他")):
        if key in t:
            return name
    return "不明"


def load_viewpoints(path: Path) -> dict[tuple[str, str], list[str]]:
    """(IT-ID, 小項目|中項目) -> 観点行。ケース側の I/FID + テスト観点 で逆引きできる。"""
    rows = list(csv.reader(path.open(encoding="utf-8"), delimiter="\t"))[1:]
    index: dict[tuple[str, str], list[str]] = {}
    for r in rows:
        if len(r) < 9:
            continue
        small = (r[5] or "").strip()
        mid = (r[4] or "").strip()
        label = small if small and small != "-" else mid
        index.setdefault((r[1].strip(), label), r)
    return index


def classify(vp: list[str] | None, channel: str) -> str:
    """実行区分を決める。先勝ち。vp が引けない場合は安全側(manual)。"""
    if vp is None:
        return "manual"
    bunrui, dai, chu = vp[2].strip(), vp[3].strip(), vp[4].strip()
    if dai in MANUAL_DAI:
        return "manual"
    if dai in CONTRACT_DAI or chu in CONTRACT_CHU:
        return "contract"
    if bunrui in API_BUNRUI or dai in API_DAI or channel == "API":
        return "automated-API"
    if bunrui in DB_BUNRUI or dai in DB_DAI:
        return "automated-DB"
    # ウェブアプリケーションは catch-all で UI へ。大項目のホワイトリスト方式だと
    # 認証・認可 / エラー表示 のような列挙漏れが黙って manual に落ちるため
    # (初版で861+282件が誤って手動化した)。
    if bunrui == "ウェブアプリケーション":
        return "automated-UI"
    if bunrui in SERVER_BUNRUI:
        return "automated-DB"
    return "manual"


def is_sanctuary(vp: list[str] | None) -> bool:
    """全数実行必須か。優先度は使わない(P3にロールバック256件が埋まっているため)。"""
    if vp is None:
        return True  # 引けない=判断不能。安全側で聖域扱い。
    itid, dai = vp[1].strip(), vp[3].strip()
    memo = vp[8] if len(vp) > 8 else ""
    if "追加(RISK" in memo:
        return True
    if itid in SANCTUARY_ITID or dai in SANCTUARY_DAI:
        return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--inplace", action="store_true",
                    help="all_it_cases.tsv 自体に列を追加する(既定は別ファイル出力)")
    args = ap.parse_args()

    repo = args.repo.resolve()
    it_dir = repo / "integration_test"
    vp_index = load_viewpoints(it_dir / "integration-test-viewpoints.md")

    src = it_dir / "all_it_cases.tsv"
    rows = list(csv.reader(src.open(encoding="utf-8"), delimiter="\t"))
    header, data = rows[0], [r for r in rows[1:] if len(r) >= 10]

    out_rows = []
    mode_c: Counter[str] = Counter()
    sanc_c: Counter[str] = Counter()
    pri_by_mode: dict[str, Counter[str]] = {}
    unresolved = 0

    for r in data:
        ch = channel_of(r[1])
        vp = vp_index.get((r[2].strip(), r[3].strip()))
        if vp is None:
            unresolved += 1
        mode = classify(vp, ch)
        sanc = "1" if is_sanctuary(vp) else "0"
        vpno = vp[0] if vp else ""
        mode_c[mode] += 1
        sanc_c[sanc] += 1
        pri_by_mode.setdefault(mode, Counter())[r[4]] += 1
        out_rows.append(r + [mode, sanc, ch, vpno])

    new_header = header + ["実行区分", "聖域", "チャネル", "観点No"]
    dest = src if args.inplace else it_dir / "execution_assignment.tsv"
    with dest.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(new_header)
        w.writerows(out_rows)

    total = len(data)
    manual = mode_c["manual"]
    auto = total - manual
    print(f"総ケース: {total}  (観点逆引き不能: {unresolved})")
    print(f"出力: {dest.relative_to(repo)}")
    print("\n--- 実行区分 ---")
    for k, v in mode_c.most_common():
        print(f"  {v:6d}  ({v/total*100:5.1f}%)  {k}")
    print(f"\n手動: {manual} ({manual/total*100:.1f}%)  / 自動化可能: {auto} ({auto/total*100:.1f}%)")
    print(f"聖域(全数必須): {sanc_c['1']}  通常: {sanc_c['0']}")
    print("\n--- 実行区分×優先度 ---")
    for m in mode_c:
        c = pri_by_mode[m]
        print(f"  {m:14s} P1={c.get('P1',0):5d} P2={c.get('P2',0):5d} P3={c.get('P3',0):5d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
