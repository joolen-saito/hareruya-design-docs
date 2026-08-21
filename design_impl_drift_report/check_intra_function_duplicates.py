#!/usr/bin/env python3
"""同一機能No内で実質同一の指摘が重複していないかを機械検出する。

判定は行わない。候補ペアを類似度つきで列挙するだけで、採否は人が読む。

  入力 : drift_findings_list_effort.tsv (1034件, 63列)
  出力 : DUPLICATE_CANDIDATES.tsv  候補ペア明細
          DUPLICATE_CANDIDATES.md  サマリ
"""
import csv
import itertools
import re
import sys
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "drift_findings_list_effort.tsv"

# 比較に使う本文列。設計期待値/実装実態/差分内容が指摘の実体。
BODY_COLS = ["設計期待値", "実装実態", "差分内容"]

NOISE = re.compile(r"[\s　]+|[、。，．・「」『』（）()\[\]{}<>:：;；/／\\|,.\-–—_＿\"'`]+")
# 旧根拠などの付記は指摘本体ではないので落とす
TAIL = re.compile(r"(/\s*旧根拠[:：].*|探索範囲[:：].*)", re.S)
PATHNUM = re.compile(r":\d+(?:-\d+)?")


def norm(text: str) -> str:
    t = unicodedata.normalize("NFKC", text or "")
    t = TAIL.sub("", t)
    t = NOISE.sub("", t)
    return t.lower()


def bigrams(t: str) -> set:
    if len(t) < 2:
        return {t} if t else set()
    return {t[i:i + 2] for i in range(len(t) - 1)}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def containment(a: set, b: set) -> float:
    """小さい方がどれだけ大きい方に含まれるか。片方が要約・部分集合の重複を拾う。"""
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def files_of(ref: str) -> set:
    """実装参照から path を取り出す（行番号は落とす）。"""
    out = set()
    for m in re.finditer(r"[\w./\-]+\.(?:php|twig|yaml|yml|js|sql)", ref or ""):
        out.add(PATHNUM.sub("", m.group(0)).split("/")[-1])
    return out


def sites_of(ref: str) -> set:
    """実装参照から file:line を取り出す（同一箇所の指摘かの判定用）。"""
    out = set()
    for m in re.finditer(r"([\w./\-]+\.(?:php|twig|yaml|yml|js|sql)):(\d+)", ref or ""):
        out.add(f"{m.group(1).split('/')[-1]}:{m.group(2)}")
    return out


DOC_SHEET = re.compile(r"([^/\\]+\.html)(?:#(sheet-\d+))?")


def doc_of(ref: str):
    """設計書参照から (HTMLファイル名, シート) を取り出す。"""
    m = DOC_SHEET.search(ref or "")
    if not m:
        return ("", "")
    return (m.group(1), m.group(2) or "")


def main() -> int:
    rows = list(csv.DictReader(SRC.open(encoding="utf-8"), delimiter="\t"))
    for i, r in enumerate(rows):
        r["_row"] = i + 2  # TSV上の行番号(ヘッダ込み)
        body = "".join(r.get(c, "") for c in BODY_COLS)
        r["_body"] = bigrams(norm(body))
        r["_exp"] = bigrams(norm(r.get("設計期待値", "")))
        r["_diff"] = bigrams(norm(r.get("差分内容", "")))
        r["_files"] = files_of(r.get("実装参照", ""))
        r["_sites"] = sites_of(r.get("実装参照", ""))
        r["_doc"], r["_sheet"] = doc_of(r.get("設計書参照", ""))
        r["_exact"] = norm(body)

    groups = {}
    for r in rows:
        groups.setdefault(r["機能No"], []).append(r)

    pairs = []
    for fno, grp in sorted(groups.items()):
        for a, b in itertools.combinations(grp, 2):
            if a["_exact"] and a["_exact"] == b["_exact"]:
                score, kind = 1.0, "完全一致"
            else:
                j_body = jaccard(a["_body"], b["_body"])
                c_body = containment(a["_body"], b["_body"])
                j_exp = jaccard(a["_exp"], b["_exp"])
                j_diff = jaccard(a["_diff"], b["_diff"])
                score = max(j_body, c_body * 0.95, j_exp, j_diff)
                if score >= 0.85:
                    kind = "ほぼ同一"
                elif score >= 0.65:
                    kind = "高類似"
                elif score >= 0.50:
                    kind = "要確認"
                elif (a["_sites"] and a["_sites"] == b["_sites"]
                      and a["観点"] == b["観点"]):
                    # 文面は似ていないが、同じ file:line を同じ観点で指している。
                    # 表現差で類似度が沈む重複を取り逃さないための保険。
                    kind = "同一箇所"
                else:
                    continue
            shared = a["_files"] & b["_files"]
            shared_site = a["_sites"] & b["_sites"]
            same_exp = a["_exp"] == b["_exp"] and bool(a["_exp"])
            if a["_doc"] and a["_doc"] == b["_doc"]:
                doc_rel = "同一シート" if a["_sheet"] == b["_sheet"] else "同一HTML別シート"
            elif a["_doc"] and b["_doc"]:
                doc_rel = "別HTML"
            else:
                doc_rel = ""
            pairs.append({
                "機能No": fno,
                "機能名": a["機能名"],
                "類似度": f"{score:.3f}",
                "判定": kind,
                "設計期待値一致": "Y" if same_exp else "",
                "設計書関係": doc_rel,
                "同一実装箇所": ",".join(sorted(shared_site))[:80],
                "行A": a["_row"],
                "行B": b["_row"],
                "指摘区分A": a["指摘区分"],
                "指摘区分B": b["指摘区分"],
                "観点A": a["観点"],
                "観点B": b["観点"],
                "同一観点": "Y" if a["観点"] == b["観点"] else "",
                "共通実装ファイル": ",".join(sorted(shared)),
                "トリアージA": a["トリアージ区分"],
                "トリアージB": b["トリアージ区分"],
                "優先度A": a["優先度"],
                "優先度B": b["優先度"],
                "工数A": a["codex工数"],
                "工数B": b["codex工数"],
                "設計書参照A": a["設計書参照"],
                "設計書参照B": b["設計書参照"],
                "設計期待値A": a["設計期待値"][:300],
                "設計期待値B": b["設計期待値"][:300],
                "差分内容A": a["差分内容"][:300],
                "差分内容B": b["差分内容"][:300],
            })

    pairs.sort(key=lambda p: (-float(p["類似度"]), p["機能No"]))

    out_tsv = BASE / "DUPLICATE_CANDIDATES.tsv"
    with out_tsv.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(pairs[0].keys()), delimiter="\t",
                           quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writeheader()
        for p in pairs:
            w.writerows([{k: (v if not isinstance(v, str) else v.replace("\t", " ").replace("\n", " "))
                          for k, v in p.items()}])

    # 連結成分でクラスタ化（重複が3件以上に広がる機能を見つける）
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[rx] = ry

    strong = [p for p in pairs if float(p["類似度"]) >= 0.65]
    for p in strong:
        union((p["機能No"], p["行A"]), (p["機能No"], p["行B"]))
    clusters = {}
    for key in list(parent):
        clusters.setdefault(find(key), []).append(key)

    by_kind = {}
    for p in pairs:
        by_kind[p["判定"]] = by_kind.get(p["判定"], 0) + 1

    lines = [
        "# 同一機能内の重複指摘 候補",
        "",
        f"対象: `drift_findings_list_effort.tsv` {len(rows)}件 / {len(groups)}機能",
        "",
        "同一 `機能No` 内の全ペアについて、`設計期待値`＋`実装実態`＋`差分内容` を正規化し",
        "文字2-gram の Jaccard／包含率で類似度を出した。**機械検出であり重複と断定していない。**",
        "",
        "| 判定 | しきい値 | ペア数 |",
        "|---|---|---:|",
        f"| 完全一致 | 正規化後の本文が同一 | {by_kind.get('完全一致', 0)} |",
        f"| ほぼ同一 | 0.85以上 | {by_kind.get('ほぼ同一', 0)} |",
        f"| 高類似 | 0.65以上 | {by_kind.get('高類似', 0)} |",
        f"| 要確認 | 0.50以上 | {by_kind.get('要確認', 0)} |",
        f"| 同一箇所 | 類似度は低いが同じ file:line を同じ観点で指す | {by_kind.get('同一箇所', 0)} |",
        f"| **計** | | **{len(pairs)}** |",
        "",
        f"0.65以上で連結したクラスタ: {len([c for c in clusters.values() if len(c) > 1])}件 / "
        f"関与行 {sum(len(c) for c in clusters.values() if len(c) > 1)}件",
        "",
        "明細: `DUPLICATE_CANDIDATES.tsv`",
        "",
        "## 重複の出どころ（0.65以上のペア）",
        "",
        "| 設計書参照の関係 | ペア数 |",
        "|---|---:|",
    ]
    rel = {}
    for p in strong:
        rel[p["設計書関係"] or "(参照なし)"] = rel.get(p["設計書関係"] or "(参照なし)", 0) + 1
    for k, v in sorted(rel.items(), key=lambda kv: -kv[1]):
        lines.append(f"| {k} | {v} |")
    lines += [
        "",
        f"うち `設計期待値` が完全一致: {sum(1 for p in strong if p['設計期待値一致'])}ペア / "
        f"同一 `file:line` を指す: {sum(1 for p in strong if p['同一実装箇所'])}ペア",
        "",
        "## 0.65以上のペア",
        "",
        "| 機能No | 類似度 | 判定 | 行A | 行B | 指摘区分 | 期待値一致 | 設計書関係 | 共通ファイル | 工数A | 工数B |",
        "|---|---:|---|---:|---:|---|---|---|---|---:|---:|",
    ]
    for p in strong:
        lines.append(
            f"| {p['機能No']} | {p['類似度']} | {p['判定']} | {p['行A']} | {p['行B']} | "
            f"{p['指摘区分A']}/{p['指摘区分B']} | {p['設計期待値一致']} | {p['設計書関係']} | "
            f"{p['共通実装ファイル'][:40]} | {p['工数A']} | {p['工数B']} |"
        )
    (BASE / "DUPLICATE_CANDIDATES.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"pairs={len(pairs)} strong(>=0.65)={len(strong)}")
    for k, v in sorted(by_kind.items()):
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
