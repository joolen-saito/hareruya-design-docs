#!/usr/bin/env python3
"""ee リポジトリの FP を概算FP法で算定し、IPA基準値から結合テスト規模を導く。

入力（すべて実体からの機械抽出。手入力の値は data/ 配下の出典付きTSVのみ）:
  - data/routes.json                 : ee の Symfony ルータ実出力（README の手順で採取）
  - EE_ROOT の Entity ソース          : ILF（内部論理ファイル）の抽出元
  - data/eif_external_systems.tsv    : EIF（外部インタフェースファイル）
  - data/ipa_2022_benchmark.tsv      : IPA ソフトウェア開発分析データ集2022 の基準値
  - data/qsm_gearing.tsv             : QSM SLOC/FP 換算値（バックファイア検算用）

出力: out/*.tsv
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
OUT = HERE / "out"
EE_ROOT = Path(os.environ.get("EE_ROOT", "/home/y-saito/Developments/ec-cube-enterprise"))

# ---------------------------------------------------------------- FP の重み
# IFPUG 未調整ファンクションポイント。概算FP法のため全項目を「平均」複雑度で数える。
# 感度分析のために全単純／全複雑の重みも併記する。
WEIGHTS = {
    "平均": {"EI": 4, "EO": 5, "EQ": 4, "ILF": 10, "EIF": 7},
    "単純": {"EI": 3, "EO": 4, "EQ": 3, "ILF": 7, "EIF": 5},
    "複雑": {"EI": 6, "EO": 7, "EQ": 6, "ILF": 15, "EIF": 10},
}

# ------------------------------------------------- トランザクション分類ルール
# 上から順に評価し、最初に当たったルールで確定する。判定根拠を1件ずつ記録する。
# 取込語は出力語より先に見る。ee の CSV 取込ルートは名称に csv を含むため、
# 出力語を先に当てると取込が EO へ誤分類される。
IMPORT_TOKENS = ("import", "upload")
EO_TOKENS = ("export", "download", "csv", "pdf", "print", "output", "invoice", "receipt")
EI_TOKENS = (
    "new", "edit", "delete", "update", "insert", "save", "upload", "import", "bulk",
    "regist", "cancel", "approve", "execute", "copy", "sync", "complete",
    "activate", "enable", "disable", "sort", "move", "add", "remove", "apply",
)
WRITE_METHODS = ("POST", "PUT", "PATCH", "DELETE")

# 業務機能でないルート（フレームワーク／プロファイラ／エラー）は母数から外す。
EXCLUDED_CONTROLLER_PREFIX = (
    "Symfony\\Bundle\\FrameworkBundle\\Controller\\RedirectController",
    "Symfony\\Bundle\\FrameworkBundle\\Controller\\TemplateController",
    "Symfony\\Bundle\\WebProfilerBundle\\",
    "web_profiler.controller",
    "error_controller",
)


def tokens_of(name: str, path: str) -> set[str]:
    return set(re.split(r"[^a-z0-9]+", (name + " " + path).lower()))


def classify(name: str, path: str, methods: list[str]) -> tuple[str, str]:
    tk = tokens_of(name, path)
    hit = sorted(tk & set(IMPORT_TOKENS))
    if hit:
        return "EI", f"取込語 {','.join(hit)}"
    hit = sorted(tk & set(EO_TOKENS))
    if hit:
        return "EO", f"出力語 {','.join(hit)}"
    hit = sorted(tk & set(EI_TOKENS))
    if hit:
        return "EI", f"更新語 {','.join(hit)}"
    w = [m for m in methods if m in WRITE_METHODS]
    if w:
        return "EI", f"更新メソッド {','.join(w)}"
    return "EQ", "参照のみ（GET/HEAD、更新語・出力語なし）"


def area_of(path: str, controller: str) -> str:
    if "/admin" in path or "%eccube_admin_route%" in path or "\\Admin\\" in controller:
        return "管理画面"
    if "/api" in path or "webhook" in path.lower():
        return "API"
    if "install" in path.lower() or "\\Install\\" in controller:
        return "インストーラ"
    if "\\Plugin\\" in controller or "/plugin" in path:
        return "プラグイン"
    return "フロント"


# ------------------------------------------------------------------ 入力読み
def load_routes() -> list[dict]:
    raw = json.loads((DATA / "routes.json").read_text(encoding="utf-8"))
    rows = []
    for name, r in raw.items():
        ctrl = (r.get("defaults") or {}).get("_controller", "")
        methods = [m for m in (r.get("method") or "ANY").split("|") if m and m != "ANY"]
        rows.append({
            "route": name,
            "path": r.get("path", ""),
            "controller": ctrl,
            "methods": methods or ["ANY"],
        })
    return rows


def load_tables() -> list[tuple[str, str]]:
    """Doctrine Entity から ee が保有するテーブル名を採る。(table, 定義ファイル)"""
    found: dict[str, str] = {}
    roots = [EE_ROOT / "src" / "Eccube" / "Entity", EE_ROOT / "app" / "Plugin",
             EE_ROOT / "plugin_repos" / "SlnPayment42"]
    pat = re.compile(r"#\[ORM\\Table\(name:\s*'([^']+)'")
    for root in roots:
        if not root.exists():
            continue
        for php in root.rglob("*.php"):
            if "/vendor/" in str(php) or "/Tests/" in str(php):
                continue
            text = php.read_text(encoding="utf-8", errors="ignore")
            if "MappedSuperclass" in text:
                continue
            for m in pat.finditer(text):
                found.setdefault(m.group(1), str(php.relative_to(EE_ROOT)))
    return sorted(found.items())


def read_tsv(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    head = lines[0].lstrip("﻿").split("\t")
    return [dict(zip(head, ln.split("\t"))) for ln in lines[1:] if ln.strip()]


# --------------------------------------------------------------------- SLOC
COMMENT_BLOCK = re.compile(r"/\*.*?\*/", re.S)
TWIG_COMMENT = re.compile(r"\{#.*?#\}", re.S)
HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)


def ncloc(text: str, kind: str) -> int:
    if kind in ("php", "js"):
        text = COMMENT_BLOCK.sub("", text)
        drop = ("//", "#", "*")
    elif kind == "twig":
        text = TWIG_COMMENT.sub("", HTML_COMMENT.sub("", text))
        drop = ()
    else:
        drop = ()
    n = 0
    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        if drop and s.startswith(drop):
            continue
        n += 1
    return n


SLOC_SCOPE = [
    # (区分, ルート, glob, kind, 主計測に含めるか, 除外パターン)
    ("本体PHP", "src", "**/*.php", "php", True, ()),
    ("カスタマイズPHP", "app/Customize", "**/*.php", "php", True, ()),
    ("プラグインPHP", "app/Plugin", "**/*.php", "php", True, ()),
    ("決済プラグインPHP", "plugin_repos/SlnPayment42", "**/*.php", "php", True, ("/vendor/", "/Tests/")),
    ("テンプレート(Twig)", "src/Eccube/Resource/template", "**/*.twig", "twig", True, ()),
    ("テンプレート(Twig)", "app/template", "**/*.twig", "twig", True, ()),
    ("フロントJS", "src/Eccube/Resource/assets", "**/*.js", "js", True, (".min.js",)),
    ("フロントJS", "html/template", "**/*.js", "js", True, (".min.js", "/vendor/")),
    ("マイグレーション", "app/DoctrineMigrations", "*.php", "php", False, ()),
]


def measure_sloc() -> list[dict]:
    agg: dict[str, dict] = {}
    for label, rel, glob, kind, primary, excl in SLOC_SCOPE:
        root = EE_ROOT / rel
        files = 0
        lines = 0
        if root.exists():
            for f in root.glob(glob):
                sp = str(f)
                if any(e in sp for e in excl):
                    continue
                if "/proxy/" in sp or "/node_modules/" in sp:
                    continue
                files += 1
                lines += ncloc(f.read_text(encoding="utf-8", errors="ignore"), kind)
        a = agg.setdefault(label, {"区分": label, "ファイル数": 0, "NCLOC": 0,
                                   "主計測": "含む" if primary else "参考(除外)", "対象": []})
        a["ファイル数"] += files
        a["NCLOC"] += lines
        a["対象"].append(rel)
    for a in agg.values():
        a["対象"] = ",".join(a.pop("対象"))
    return list(agg.values())


# --------------------------------------------------------------------- main
def main() -> int:
    OUT.mkdir(exist_ok=True)

    # 1) トランザクション型ファンクション -----------------------------------
    routes = load_routes()
    kept, dropped = [], []
    for r in routes:
        if r["route"].startswith("_") or any(r["controller"].startswith(p) for p in EXCLUDED_CONTROLLER_PREFIX):
            dropped.append(r)
            continue
        kept.append(r)

    # 基本機能プロセスは「1コントローラアクション = 1」で数える。
    # 同一アクションに張られた別ルート（ページング等）は同じ基本機能プロセスとみなす。
    by_action: dict[str, list[dict]] = defaultdict(list)
    for r in kept:
        key = r["controller"] or f"(route){r['route']}"
        by_action[key].append(r)

    tx_rows = []
    for action, rs in sorted(by_action.items()):
        rs.sort(key=lambda x: x["route"])
        names = ",".join(x["route"] for x in rs)
        paths = ",".join(sorted({x["path"] for x in rs}))
        methods = sorted({m for x in rs for m in x["methods"]})
        # 分類は代表ルート（最短名）で行い、更新メソッドは全ルートの和を見る。
        rep = min(rs, key=lambda x: len(x["route"]))
        kind, reason = classify(rep["route"], rep["path"], methods)
        tx_rows.append({
            "基本機能プロセスID": f"TX-{len(tx_rows)+1:04d}",
            "コントローラアクション": action,
            "ルート名": names,
            "ルート数": len(rs),
            "パス": paths,
            "HTTPメソッド": ",".join(methods),
            "領域": area_of(rep["path"], action),
            "FP種別": kind,
            "判定根拠": reason,
        })

    write_tsv(OUT / "fp_transactions.tsv", tx_rows)
    write_tsv(OUT / "fp_excluded_routes.tsv",
              [{"ルート名": r["route"], "パス": r["path"], "コントローラ": r["controller"],
                "除外理由": "フレームワーク／プロファイラ／エラー用ルート"} for r in dropped])

    # 2) データ型ファンクション ---------------------------------------------
    tables = load_tables()
    ilf_rows = [{"ファイルID": f"ILF-{i+1:03d}", "種別": "ILF", "名称": t,
                 "根拠": src} for i, (t, src) in enumerate(tables)]
    eif_src = read_tsv(DATA / "eif_external_systems.tsv")
    eif_rows = [{"ファイルID": f"EIF-{i+1:03d}", "種別": "EIF", "名称": e["外部システム"],
                 "根拠": e["出典"]} for i, e in enumerate(eif_src)]
    write_tsv(OUT / "fp_files.tsv", ilf_rows + eif_rows)

    # 3) FP 集計 -------------------------------------------------------------
    cnt = Counter(r["FP種別"] for r in tx_rows)
    cnt["ILF"] = len(ilf_rows)
    cnt["EIF"] = len(eif_rows)

    fp_rows = []
    totals = {}
    for grade, w in WEIGHTS.items():
        total = 0
        for k in ("EI", "EO", "EQ", "ILF", "EIF"):
            fp = cnt[k] * w[k]
            total += fp
            fp_rows.append({"複雑度前提": grade, "FP種別": k, "件数": cnt[k],
                            "重み": w[k], "FP": fp})
        fp_rows.append({"複雑度前提": grade, "FP種別": "合計(未調整FP)", "件数": "",
                        "重み": "", "FP": total})
        totals[grade] = total
    write_tsv(OUT / "fp_summary.tsv", fp_rows)

    # 領域別の内訳（どこにFPが偏っているか）
    area_rows = []
    for area in sorted({r["領域"] for r in tx_rows}):
        c = Counter(r["FP種別"] for r in tx_rows if r["領域"] == area)
        w = WEIGHTS["平均"]
        area_rows.append({"領域": area, "EI": c["EI"], "EO": c["EO"], "EQ": c["EQ"],
                          "基本機能プロセス数": sum(c.values()),
                          "FP(平均複雑度)": sum(c[k] * w[k] for k in ("EI", "EO", "EQ"))})
    write_tsv(OUT / "fp_by_area.tsv", area_rows)

    # 4) SLOC 実測とバックファイア検算 ---------------------------------------
    sloc_rows = measure_sloc()
    write_tsv(OUT / "sloc.tsv", sloc_rows)
    primary_sloc = sum(r["NCLOC"] for r in sloc_rows if r["主計測"] == "含む")

    gearing = {g["言語"]: g for g in read_tsv(DATA / "qsm_gearing.tsv")}
    # 言語群ごとに代用言語を割り当てる。QSM 5.0 に PHP / Twig の行は無いため、
    # QSM 自身の指針「類似言語の gearing factor を代用してよい」に従う。
    LAYERS = [
        ("ロジック層(PHP)", ["本体PHP", "カスタマイズPHP", "プラグインPHP", "決済プラグインPHP"],
         ["J2EE", "Java"], "サーバサイドのオブジェクト指向Webアプリ"),
        ("表現層(Twig)", ["テンプレート(Twig)"], ["HTML", "ASP"], "テンプレート／マークアップ"),
        ("クライアント層(JS)", ["フロントJS"], ["JavaScript"], "同一言語"),
    ]
    sloc_by_label = {r["区分"]: r["NCLOC"] for r in sloc_rows}
    bf_rows = []
    tot_lo = tot_hi = 0
    logic_lo = logic_hi = 0
    for layer, labels, subs, why in LAYERS:
        n = sum(sloc_by_label.get(l, 0) for l in labels)
        meds = sorted(float(gearing[x]["Median"]) for x in subs)
        lo, hi = round(n / meds[-1]), round(n / meds[0])
        tot_lo += lo
        tot_hi += hi
        if layer.startswith("ロジック層"):
            logic_lo, logic_hi = lo, hi
        bf_rows.append({"層": layer, "NCLOC": n, "代用言語": "/".join(subs),
                        "SLOC/FP(Median)": "〜".join(str(m) for m in meds),
                        "バックファイアFP": f"{lo}〜{hi}", "代用の理由": why})
    bf_rows.append({"層": "合計(表現層を含む)", "NCLOC": primary_sloc, "代用言語": "―",
                    "SLOC/FP(Median)": "―", "バックファイアFP": f"{tot_lo}〜{tot_hi}",
                    "代用の理由": "テンプレート行数が過半を占めるため上限側の目安"})
    bf_rows.append({"層": "参考:ロジック層のみ",
                    "NCLOC": sum(sloc_by_label.get(l, 0) for l in LAYERS[0][1]),
                    "代用言語": "J2EE/Java", "SLOC/FP(Median)": "49.0〜53.0",
                    "バックファイアFP": f"{logic_lo}〜{logic_hi}",
                    "代用の理由": "概算FP法との比較に使う主系列"})
    write_tsv(OUT / "backfire.tsv", bf_rows)

    # 5) IPA 基準値の適用 ----------------------------------------------------
    bench = read_tsv(DATA / "ipa_2022_benchmark.tsv")
    fp_for_scale = totals["平均"]
    scale_rows = []
    for b in bench:
        if b["規模基準"] != "FP":
            continue
        row = {"開発種別": b["開発種別"], "指標": b["指標"], "IPA_N": b["N"],
               "採用FP": fp_for_scale}
        for col in ("P25", "中央", "P75"):
            v = b[col]
            row[f"{col}(件/KFP)"] = v
            row[f"導出値_{col}"] = "―" if v == "―" else round(fp_for_scale / 1000 * float(v))
        row["出典"] = b["出典"]
        scale_rows.append(row)

    # 感度分析: 全単純／全複雑のFPを使った場合の結合テストケース数（全開発種別・中央値）
    med = next(b for b in bench if b["規模基準"] == "FP" and b["開発種別"] == "全開発種別"
               and b["指標"] == "結合テスト(テストケース)")
    for grade in ("単純", "平均", "複雑"):
        scale_rows.append({
            "開発種別": f"[感度分析] 全開発種別・中央値・{grade}複雑度前提",
            "指標": "結合テスト(テストケース)", "IPA_N": med["N"], "採用FP": totals[grade],
            "P25(件/KFP)": med["P25"], "導出値_P25": round(totals[grade] / 1000 * float(med["P25"])),
            "中央(件/KFP)": med["中央"], "導出値_中央": round(totals[grade] / 1000 * float(med["中央"])),
            "P75(件/KFP)": med["P75"], "導出値_P75": round(totals[grade] / 1000 * float(med["P75"])),
            "出典": med["出典"],
        })
    write_tsv(OUT / "test_scale.tsv", scale_rows)

    print(f"基本機能プロセス {len(tx_rows)} 件 / 除外ルート {len(dropped)} 件")
    print(f"EI={cnt['EI']} EO={cnt['EO']} EQ={cnt['EQ']} ILF={cnt['ILF']} EIF={cnt['EIF']}")
    print(f"未調整FP 単純={totals['単純']} 平均={totals['平均']} 複雑={totals['複雑']}")
    print(f"主計測NCLOC={primary_sloc}")
    return 0


def write_tsv(path: Path, rows: list[dict]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    cols: list[str] = []
    for r in rows:
        for k in r:
            if k not in cols:
                cols.append(k)
    with path.open("w", encoding="utf-8") as f:
        f.write("\t".join(cols) + "\n")
        for r in rows:
            f.write("\t".join(str(r.get(c, "")) for c in cols) + "\n")


if __name__ == "__main__":
    sys.exit(main())
