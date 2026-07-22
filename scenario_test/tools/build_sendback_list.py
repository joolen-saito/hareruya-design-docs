#!/usr/bin/env python3
"""優先差し戻しリスト生成器。

全 SCN-*.md の `## データ連鎖` 表から、金銭・在庫・受注ステータスに関わる高リスク連鎖だけを
抽出し、業務側が A/B/C に仕分ける差し戻しリスト（md + tsv）を生成する。

- 目的: データのつながりオラクルを「実行可能なテスト」へ昇格させるための業務判断依頼。
- 捏造ゼロ: 内容は生成済み SCN のデータ連鎖行をそのまま集約するだけ。新たな結線・キーは作らない。
- 判定列(業務記入用): A=受け渡しあり(キー確認) / B=終端・テスト不要 / C=図の引き忘れ(原典補記)。

分類（高リスク観点）:
  金銭   : 返金/決済/入金/出金/振込/売上/請求/ポイント/買取金額
  在庫   : 在庫/入庫/出庫/棚卸/欠品/移動/補充/仕入/引当
  受注状態: 受注/注文/出荷/配送/対応状況/発送/ピッキング
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

CATEGORIES: dict[str, tuple[str, ...]] = {
    "金銭": ("返金", "決済", "入金", "出金", "振込", "売上", "請求", "ポイント", "買取"),
    "在庫": ("在庫", "入庫", "出庫", "棚卸", "欠品", "移動", "補充", "仕入", "引当"),
    "受注状態": ("受注", "注文", "出荷", "配送", "対応状況", "発送", "ピッキング", "ピック"),
}
# 金銭・在庫・受注状態のどれにも該当しない連鎖は本リストの対象外（帳票印刷・軽微データ等）。

DL_RE = re.compile(r"^\|\s*DL-\d+\s*\|")
TITLE_RE = re.compile(r"^#\s*(SCN-\S+)\s+(.*)$")


def categorize(text: str) -> str | None:
    for cat, words in CATEGORIES.items():
        if any(w in text for w in words):
            return cat
    return None


def parse_scn(path: Path) -> tuple[str, str, str, list[tuple[str, str, str, str, str]]]:
    sid = business = title = ""
    rows: list[tuple[str, str, str, str, str]] = []
    in_chain = False
    for line in path.read_text(encoding="utf-8").splitlines():
        m = TITLE_RE.match(line)
        if m and not sid:
            sid, title = m.group(1), m.group(2).strip()
            continue
        if line.startswith("- **親業務フローパターン**:") and not business:
            business = line.split(":", 1)[1].split("/")[0].strip()
            continue
        if line.startswith("## データ連鎖"):
            in_chain = True
            continue
        if in_chain and line.startswith("## "):
            in_chain = False
            continue
        if in_chain and DL_RE.match(line):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if len(cells) >= 7:
                _dl, producer, artifact, consumer, _expected, key, verdict = cells[:7]
                rows.append((producer, artifact, consumer, key, verdict))
    return sid, business, title, rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    args = ap.parse_args()
    repo = Path(args.repo).resolve()
    scen_dir = repo / "scenario_test" / "scenario"

    # 同じデータ受け渡しが経路違いの複数SCNに現れるため、ユニークな受け渡し単位で集約する
    # （業務側が同じ判断を何度もせずに済む）。図形番号(#N)は経路で変わるので除いて正規化する。
    def strip_no(s: str) -> str:
        return re.sub(r"#\d+\s*", "", s).strip()

    grouped: dict[tuple, dict] = {}
    for path in sorted(scen_dir.glob("SCN-*.md")):
        sid, business, title, rows = parse_scn(path)
        for producer, artifact, consumer, key, verdict in rows:
            cat = categorize(f"{producer} {artifact} {consumer}")
            if cat is None:
                continue
            has_key = bool(re.search(r"=(ST-|晴)", key))
            key_field = key.split("=", 1)[0] if has_key else "（未定義）"
            prod_n, art_n, cons_n = strip_no(producer), strip_no(artifact), strip_no(consumer)
            gkey = (cat, business, prod_n, art_n, cons_n, verdict, key_field)
            g = grouped.setdefault(gkey, {
                "priority": "P2" if ("連鎖あり" in verdict and has_key) else "P1",
                "category": cat, "business": business,
                "producer": prod_n, "artifact": art_n, "consumer": cons_n,
                "key": key_field, "verdict": verdict, "scenarios": set(),
            })
            g["scenarios"].add(sid)

    items = list(grouped.values())
    for it in items:
        it["count"] = len(it["scenarios"])
        it["example"] = sorted(it["scenarios"])[0]
    order_cat = {"金銭": 0, "在庫": 1, "受注状態": 2}
    items.sort(key=lambda x: (x["priority"], order_cat[x["category"]], x["business"], -x["count"], x["artifact"]))

    # tsv
    tsv = scen_dir / "12_優先差し戻しリスト.tsv"
    cols = ["優先度", "観点", "業務", "産出工程", "データ/帳票", "消費工程", "既定照合キー", "判定",
            "該当SCN数", "代表SCN", "業務判定(A/B/C)", "確定照合キー", "消費先/備考"]
    with tsv.open("w", encoding="utf-8") as f:
        f.write("\t".join(cols) + "\n")
        for it in items:
            f.write("\t".join([
                it["priority"], it["category"], it["business"],
                it["producer"], it["artifact"], it["consumer"], it["key"], it["verdict"],
                str(it["count"]), it["example"], "", "", "",
            ]) + "\n")

    # md
    p1 = [it for it in items if it["priority"] == "P1"]
    p2 = [it for it in items if it["priority"] == "P2"]
    by_cat: dict[str, int] = {}
    for it in items:
        by_cat[it["category"]] = by_cat.get(it["category"], 0) + 1

    md = scen_dir / "12_優先差し戻しリスト.md"
    lines: list[str] = []
    lines.append("# 優先差し戻しリスト（データ連鎖の業務判断依頼）")
    lines.append("")
    lines.append("- 生成元: 全 `SCN-*.md` の `## データ連鎖` 表（`tools/build_sendback_list.py` で機械抽出）")
    lines.append("- 対象: **金銭・在庫・受注状態**に関わる高リスク連鎖のみ（帳票印刷等の軽微データは除外）")
    lines.append("- 捏造ゼロ: 生成済みシナリオの連鎖行をそのまま集約。新たな結線・キーは作っていない。")
    lines.append("")
    lines.append("## この表で業務側にお願いすること")
    lines.append("")
    lines.append("各行の **業務判定(A/B/C)** 列を埋めてください。それ以外は記入不要です。")
    lines.append("")
    lines.append("| 判定 | 意味 | 記入例 |")
    lines.append("|---|---|---|")
    lines.append("| **A** | このデータは次工程で本当に使われる。**既定照合キーで正しい**（違えば「確定照合キー」欄に正しいキーを記入） | A |")
    lines.append("| **B** | 印刷して保管／外部で完結など**終端**。連鎖テスト不要 | B |")
    lines.append("| **C** | 本当は繋がっているのに業務フロー図が**線を引き忘れ**ている（消費工程を備考へ） | C: 消費先=◯◯ |")
    lines.append("")
    lines.append("- **A** と判定された行は、既定照合キーで「産出→消費を同一キーで追跡」する実行可能テストに昇格します。")
    lines.append("- **C** は業務フロー原典を補記のうえ再生成すると、連鎖が自動で復活します。")
    lines.append("")
    lines.append("## サマリ")
    lines.append("")
    total_scn = sum(it["count"] for it in items)
    lines.append(f"- ユニークな受け渡し: **{len(items)}件**（延べ {total_scn} SCN）。P1=業務判断が必要な穴 {len(p1)} / P2=実行可能・キー妥当性のみ {len(p2)}")
    lines.append("- 観点別(ユニーク): " + " / ".join(f"{c} {by_cat.get(c,0)}" for c in ("金銭", "在庫", "受注状態")))
    lines.append("- 同じデータ受け渡しは経路違いの複数SCNで共通なので、**1行に集約**（該当SCN数を併記）。1行に回答すれば全該当SCNへ反映されます。")
    lines.append("")

    def emit(title: str, rows: list[dict[str, str]]) -> None:
        lines.append(f"## {title}（{len(rows)}件）")
        lines.append("")
        lines.append("| 観点 | 業務 | 産出工程 | データ/帳票 | 消費工程 | 既定照合キー | 判定 | 該当SCN数 | 代表SCN | 業務判定(A/B/C) |")
        lines.append("|---|---|---|---|---|---|---|---:|---|---|")
        for it in rows:
            lines.append("| " + " | ".join([
                it["category"], it["business"],
                it["producer"], it["artifact"], it["consumer"], it["key"], it["verdict"],
                str(it["count"]), it["example"], " ",
            ]) + " |")
        lines.append("")

    emit("P1: 業務判断が必要な穴（消費先未定義／照合キー未定義）", p1)
    emit("P2: 実行可能（既定照合キーの妥当性チェックのみ）", p2)

    md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {md} ({len(items)} items: P1={len(p1)} P2={len(p2)})")
    print(f"wrote {tsv}")


if __name__ == "__main__":
    main()
