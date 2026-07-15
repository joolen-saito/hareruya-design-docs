#!/usr/bin/env python3
"""判定コード自動付与 — 結合テスト再生成パイプライン Phase2。

母集合スタブ（*_it_cases.md の各行: IT-ID・観点）に対し、
  spec_parser の出力（入力項目・明示的否定文・除外ブロック・検索委譲先）＋
  function_dependency_inventory.tsv の externals（I/Fプロファイル）
を用いて、判定コードと file:line 根拠を機械決定する（捏造ゼロ・ゲート準拠）。

判定コード: EXEC / EXEC-UI / EXEC-UI:DDT / EXEC-UI+EXEC-MAN / CONTRACT /
            DELEG-STATIC / MERGE / OUT / 要判定 / NO_IF

規則:
  1. NO_IF : 観点のI/F分類を機能が保有しない（externals非該当）→ 非生成。
  2. OUT   : 観点に対応する明示的否定文がパーサ抽出にある時のみ。無ければ要判定。
  3. MERGE : 検索条件で正本が別機能(admin_search_product等)へ委譲する場合。
  4. 既定 : 観点クラス→コードの写像（下表）。根拠は該当節の行番号。
"""
from __future__ import annotations
import argparse, csv, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import spec_parser as sp

# IT-ID → I/F分類（viewpoints masterの分類より）。NO_IF判定に使う。
# externalsトークン集合で保有を判定。
IF_TOKENS = {
    "mail": ["メール"],
    "file": ["CSV", "PDF", "S3"],
    "external": ["スマレジ", "Webhook", "WordPress", "SPLINKS", "任意門",
                 "ポイントグランター", "ユニサーチ", "プリンター"],
    "batch": ["バッチ"],
}

# 観点(col4) → OUT根拠になり得る否定文キーワード（明示的否定がある時のみOUT）
OUT_NEGATION = {
    "文字列長バリデーション": r"上限は?無|追加制約は?無",
    "文字種バリデーション": r"追加制約は?無|文字種.*(無|制約なし)",
    "バージョニング": r"バージョン.*(無|扱わない|指定.*ない)",
    "同時実行数の制限": r"(同時|接続|回数).*(制限.*無|扱わない)",
}

# 観点(col4) → (既定判定コード, 根拠節の候補リスト)。
# 根拠は候補の先頭から実在する節を採る。どれも無ければ 要判定 に落とす（G2防止）。
FALLBACK = (
    # pf-eccube3 系
    "処理フロー", "入出力", "利用者視点の入口", "データ整合性",
    "業務ルール・計算", "エラー処理", "DBカラム", "DB操作",
    "フロント挙動", "集計条件",
    # ec-cube-enterprise 系（節名が異なる）
    "プロセスフロー", "入出力仕様", "ビジネスロジック", "状態・データ更新",
    "例外処理", "判定条件", "開始条件、終了条件", "機能の目的と役割",
)
VIEWPOINT_DEFAULT = {
    # 権限・認証・CSRF
    "CSRF": ("DELEG-STATIC", ("権限・認可", "エラー処理")),
    "未認証": ("EXEC-UI", ("権限・認可",)),
    "資格情報": ("DELEG-STATIC", ("権限・認可", "入出力")),
    "URL直接アクセス": ("CONTRACT", ("エラー処理", "画面遷移")),
    # HTTP/URL/契約
    "HTTPステータス": ("CONTRACT", ("入出力",)),
    "URL": ("CONTRACT", ("画面遷移", "入出力")),
    "レスポンス": ("CONTRACT", ("入出力",)),
    "リクエスト": ("CONTRACT", ("入出力",)),
    "入力データ": ("CONTRACT", ("入出力",)),
    "受信検証": ("EXEC", ("入出力",)),
    "通信": ("CONTRACT", ("入出力",)),
    "データなし": ("CONTRACT", ("エラー処理", "入出力")),
    # 画面・UI
    "画面遷移": ("EXEC-UI", ("画面遷移",)),
    "UI部品": ("EXEC-UI+EXEC-MAN", ("フロント挙動", "画面表示")),
    "確認ダイアログ": ("EXEC-UI", ("フロント挙動",)),
    "操作起点": ("EXEC-UI", ("フロント挙動",)),
    "外部画面": ("EXEC-UI", ("フロント挙動",)),
    "画面レイアウト": ("EXEC-UI", ("フロント挙動", "画面表示")),
    "画面表示データ": ("EXEC-UI", ("画面表示", "フロント挙動")),
    "送信可否制御": ("EXEC", ("処理フロー",)),
    # 状態・DB
    "状態変化": ("EXEC", ("処理フロー",)),
    "対象データ": ("EXEC", ("入出力",)),
    "識別子": ("EXEC", ("入出力",)),
    "登録内容": ("EXEC", ("DBカラム", "DB操作")),
    "更新内容": ("EXEC", ("DBカラム", "DB操作")),
    "削除条件": ("EXEC", ("DB操作", "DBカラム")),
    "実行結果": ("EXEC", ("処理フロー", "DB操作")),
    "検索条件": ("EXEC", ("処理フロー", "DB操作")),  # 検索委譲があればMERGEへ上書き
    "自動加算": ("EXEC", ("DB操作", "業務ルール・計算")),
    "実数更新": ("EXEC", ("DB操作", "業務ルール・計算")),
    "売上・返品": ("EXEC", ("DB操作", "処理フロー")),
    "区分整合": ("EXEC", ("処理フロー",)),
    "外部取引": ("EXEC", ("処理フロー",)),
    "外部取得": ("EXEC", ("処理フロー",)),
    # バリデーション
    "必須制御": ("EXEC", ("バリデーション",)),
    "必須バリデーション": ("EXEC", ("バリデーション",)),
    "必須条件": ("EXEC", ("バリデーション", "入出力")),
    "数値バリデーション": ("EXEC-UI:DDT", ("入力項目",)),
    "文字列長バリデーション": ("EXEC-UI:DDT", ("入力項目",)),
    "文字種バリデーション": ("EXEC-UI:DDT", ("入力項目",)),
    "相関バリデーション": ("EXEC", ("バリデーション",)),
    "DBとの相関バリデーション": ("EXEC", ("バリデーション",)),
    "その他のバリデーション": ("要判定", ("バリデーション",)),
    "部分入力": ("EXEC", ("バリデーション",)),
    "形式不正": ("EXEC-UI:DDT", ("入力項目", "バリデーション")),
    # 正常/異常/エラー
    "正常": ("EXEC", ("処理フロー",)),
    "正常系": ("EXEC", ("処理フロー",)),
    "異常系": ("EXEC", ("エラー処理", "処理フロー")),
    "エラー": ("EXEC", ("エラー処理",)),
    "障害": ("EXEC", ("エラー処理",)),
    "連携エラー": ("EXEC", ("エラー処理",)),
    "部分失敗": ("EXEC", ("エラー処理",)),
    "重複・順序": ("EXEC", ("処理フロー",)),
    # ファイル/メール/バッチ出力（該当I/F保有時のみここへ来る。非保有はNO_IF）
    "出力内容": ("EXEC", ("入出力", "処理フロー")),
    "出力失敗": ("EXEC", ("エラー処理",)),
    "フォーマット定義": ("EXEC", ("入出力", "処理フロー")),
    "ヘッダ": ("EXEC", ("入出力",)),
    "本文": ("EXEC", ("入出力",)),
    "件名": ("EXEC", ("入出力",)),
    "終了ステータス": ("EXEC", ("処理フロー",)),
    "コマンド": ("EXEC", ("処理フロー",)),
    # ログ
    "出力抑止": ("DELEG-STATIC", ("ログ・監査",)),
}


def load_externals(inv_path: Path, fid: str) -> str:
    for r in csv.DictReader(inv_path.open(encoding="utf-8"), delimiter="\t"):
        if r["id"] == fid:
            return r.get("externals") or ""
    return ""


def load_layer(inv_path: Path, fid: str) -> str:
    for r in csv.DictReader(inv_path.open(encoding="utf-8"), delimiter="\t"):
        if r["id"] == fid:
            return r.get("layer") or ""
    return ""


# 単項目/入力に紐づくバリデーション観点。入力フォーム項目が無ければ非該当（NO_INPUT）。
VALIDATION_VP = {
    "文字列長バリデーション", "数値バリデーション", "文字種バリデーション",
    "必須バリデーション", "相関バリデーション", "DBとの相関バリデーション",
    "その他のバリデーション", "形式不正", "部分入力", "必須制御",
}


def if_class_of_viewpoint(vp: str) -> str | None:
    """観点名からI/F分類を推定（NO_IF用）。該当しなければNone。"""
    if re.search(r"ログ|抑止|追跡|機密", vp):  # ログ系はfile誤判定しない
        return None
    if re.search(r"メール|通知|件名|本文|宛先|差出人", vp):
        return "mail"
    if re.search(r"ファイル|CSV|ダウンロード|アップロード|帳票", vp):
        return "file"
    if re.search(r"電文|Webhook", vp):
        return "external"
    return None


def section_line(parsed, name):
    for s in parsed["sections"]:
        if s["title"] == name:
            return s["line"]
    # 表側でも探す
    if name in parsed.get("tables", {}):
        return parsed["tables"][name]["line"]
    return None


def judge_stub(itid, vp, parsed, externals, html_name, layer=""):
    # 1. NO_IF
    ifc = if_class_of_viewpoint(vp)
    if ifc and not any(t in externals for t in IF_TOKENS[ifc]):
        return "NO_IF", f"externals={externals or '(なし)'}（{ifc} I/F非保有）"
    # 1.5 NO_INPUT（二段判定・D1偽陰性対策）: 入力項目表が無く＆API層でないバリデーション観点。
    #     ただし本文に入力面シグナル（別形式フォーム表/入力語/inputタグ）が在れば
    #     項目表の取りこぼしを疑い NO_INPUT に落とさず「要判定」へ（バリデーション全項目網羅の担保）。
    if vp in VALIDATION_VP and not parsed["input_fields"] and layer != "api":
        sig = parsed.get("input_signal") or []
        if sig:
            return "要判定", f"{html_name}: 入力項目表を抽出できないが入力面シグナル有（{'/'.join(sig)}）＝要人手確認（NO_INPUTにしない）"
        return "NO_INPUT", f"{html_name}: 正本に入力フォーム項目・入力面シグナルなし（該当バリデーション非該当）"
    # 2. OUT（明示的否定文がある時のみ）
    if vp in OUT_NEGATION:
        pat = re.compile(OUT_NEGATION[vp])
        hit = next((n for n in parsed["negations"] if pat.search(n["text"])), None)
        if hit:
            return "OUT", f"{html_name}:{hit['line']}（明示的否定: {hit['text'][:40]}）"
        return "要判定", "明示的否定文なし（OUTにしない）"
    # 3. 検索委譲（MERGE）
    if vp == "検索条件":
        if "admin_search_product" in parsed_text_cache.get(html_name, ""):
            return "MERGE→admin_search_product", f"{html_name}:検索は別機能へ委譲"
    # 4. 既定写像（根拠節を候補＋FALLBACKから実在解決。無ければ要判定＝G2防止）
    if vp in VIEWPOINT_DEFAULT:
        code, secs = VIEWPOINT_DEFAULT[vp]
        if code == "EXEC-UI:DDT":  # DDTは該当入力項目があるときのみ
            has = any(f["flags"]["has_num"] or f["flags"]["has_len"] for f in parsed["input_fields"])
            if not has:
                return "要判定", "対応する入力項目・制約が正本に無い"
        for s in tuple(secs) + FALLBACK:
            ln = section_line(parsed, s)
            if ln:
                return code, f"{html_name}:{ln}"
        return "要判定", "根拠にできる節が正本に無い"
    return "要判定", "既定写像なし"


parsed_text_cache = {}


def run(html_path: Path, it_path: Path, inv_path: Path):
    parsed = sp.parse_html(html_path)
    parsed_text_cache[html_path.name] = html_path.read_text(encoding="utf-8")
    externals = load_externals(inv_path, parsed["meta"]["id"])
    layer = load_layer(inv_path, parsed["meta"]["id"])
    results = []
    for l in it_path.read_text(encoding="utf-8").splitlines():
        if "\tIT-" not in l:
            continue
        p = l.split("\t")
        if len(p) < 4:
            continue
        itid, vp = p[2].strip(), p[3].strip()
        code, root = judge_stub(itid, vp, parsed, externals, html_path.name, layer)
        results.append({"itid": itid, "vp": vp, "code": code, "root": root})
    return parsed, externals, results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", required=True)
    ap.add_argument("--it", required=True)
    ap.add_argument("--inv", default="endpoint_reports/function_dependency_inventory.tsv")
    ap.add_argument("--detail", action="store_true")
    args = ap.parse_args()
    parsed, externals, results = run(Path(args.html), Path(args.it), Path(args.inv))
    from collections import Counter
    print(f"# {parsed['meta']['id']}  externals={externals or '(なし)'}  母集合={len(results)}件")
    c = Counter(r["code"].split("→")[0] for r in results)
    print("判定コード分布:")
    for k, v in c.most_common():
        print(f"  {v:3d}  {k}")
    if args.detail:
        print("\n観点別（先頭から）:")
        for r in results:
            print(f"  {r['itid']:6} {r['vp']:20} → {r['code']:16} {r['root']}")


if __name__ == "__main__":
    main()
