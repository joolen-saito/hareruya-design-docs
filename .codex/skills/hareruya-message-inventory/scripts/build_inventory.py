#!/usr/bin/env python3
"""raw_messages.jsonl から 9列メッセージ一覧TSV（Stage1）を組み立てる。

Stage1は決定的に埋められる列だけを確定し、コードフロー依存の列
（要素[トリガー]/トリガー条件/後続処理）と変数・未解決文言は
「要ソース確認」プレースホルダにして後段(codex/fable5)へ渡す（捏造ゼロ）。

9列:
  メッセージID / 画面 / 要素 / トリガー（条件） / 種別 / どこに / 要素 / メッセージ内容 / 後続処理

メッセージIDは機能ID単位の連番。機能未割当は EE-<area> 単位で採番。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import lib_messages as L

RAW = L.DOC_ROOT / "message_inventory" / "raw_messages.jsonl"
OUT_TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
ID_MAP = L.DOC_ROOT / "message_inventory" / "id_map.tsv"  # 安定ID台帳: key<TAB>MSG-ID
TODO = "要ソース確認"  # 後段codex/fable5が実ソースで確定する


def load_id_map() -> dict[str, str]:
    """安定ID台帳を読む（key=area|file|line|occ → MSG-ID）。無ければ空。"""
    m: dict[str, str] = {}
    if ID_MAP.exists():
        for line in ID_MAP.read_text(encoding="utf-8").splitlines():
            if "\t" in line:
                k, v = line.split("\t", 1)
                m[k] = v
    return m


def save_id_map(m: dict[str, str]) -> None:
    with ID_MAP.open("w", encoding="utf-8") as fh:
        for k in sorted(m):
            fh.write(f"{k}\t{m[k]}\n")

COLUMNS = ["メッセージID", "画面", "要素", "トリガー（条件）", "種別", "どこに", "要素(表示)", "メッセージ内容", "後続処理", "根拠(file:line)", "解決状態", "機能候補(要検証)"]


def humanize_controller(rel: str, ns: str) -> str:
    """controllerパス→暫定画面名（クラス名由来・推測なし）。"""
    m = re.search(r"Controller/(.+?)Controller\.php$", rel)
    stem = m.group(1) if m else rel
    parts = [p for p in stem.split("/") if p]
    prefix = "管理画面" if ("Admin" in parts or ns == "admin") else ("フロント" if ns == "front" else "アプリ")
    tail = parts[-1] if parts else stem
    tail = re.sub(r"(?<!^)(?=[A-Z])", "_", tail)
    return f"{prefix}_{tail}"


def screen_for(row: dict, meta: dict) -> tuple[str, str]:
    """(画面ラベル, 機能ID or '') を返す。"""
    fids = row.get("candidate_fids") or []
    if fids:
        fid = fids[0]
        title = meta.get(fid, {}).get("title") or fid
        return f"{fid} {title}", fid
    if row["source_type"] == "js":
        # Twig由来: ファイル名から画面を推測せず、テンプレ名を出す（codexが機能へ紐付け）
        base = Path(row["file"]).stem
        return f"[要機能紐付け] {base}", ""
    return humanize_controller(row["file"], row.get("namespace", "")), ""


def id_area(row: dict, fid: str) -> str:
    if fid:
        return fid.upper().replace("_", "-")
    if row["source_type"] == "js":
        return "EE-JS"
    # 未割当フラッシュ/フォーム: controllerクラス単位で安定採番
    return L.controller_area(row["file"])


def trigger_element(row: dict) -> str:
    """要素（トリガー）の暫定。確定はcodex。"""
    st = row["source_type"]
    if st == "form":
        return "入力フォーム(送信)"
    if st == "js":
        return "ボタン/リンク(押下)"
    return TODO  # flash: どのボタン/操作かはcodexが確定


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="出力先TSV（既定: message_inventory.tsv）。"
                                  "確定済みマスタを壊さず差分を取る用途では一時ファイルを指定する")
    a = ap.parse_args()
    global OUT_TSV
    out_override = Path(a.out) if a.out else None

    _f2f, _r2f, meta = L.load_function_map()
    rows = [json.loads(l) for l in RAW.read_text(encoding="utf-8").splitlines() if l.strip()]

    # 機能/エリア単位で採番（安定ID台帳で再生成不変・追加分のみ末尾採番）
    id_map = load_id_map()
    # 台帳＋現行マスタの area 別 使用済み番号を先読み（再利用防止）。
    # マスタにはレビューで追記された抽出外メッセージも居るため、必ず両方から予約する。
    used: dict[str, set[int]] = {}

    def reserve(mid: str) -> None:
        a, _, num = mid.rpartition("-MSG-")
        if a and num.isdigit():
            used.setdefault(a, set()).add(int(num))

    for mid in id_map.values():
        reserve(mid)
    if OUT_TSV.exists():
        for line in OUT_TSV.read_text(encoding="utf-8").splitlines()[1:]:
            if line:
                reserve(line.split("\t", 1)[0])
    occ: dict[tuple, int] = {}
    out: list[list[str]] = []
    # 安定ソート: file, line
    rows.sort(key=lambda r: (r["file"], r["line"]))
    for r in rows:
        screen, fid = screen_for(r, meta)
        area = id_area(r, fid)
        okey = (area, r["file"], r["line"])
        occ[okey] = occ.get(okey, 0) + 1
        key = f"{area}|{r['file']}|{r['line']}|{occ[okey] - 1}"
        mid = id_map.get(key)
        if not mid:
            aused = used.setdefault(area, set())
            n = (max(aused) if aused else 0) + 1
            aused.add(n)
            mid = f"{area}-MSG-{n:03d}"
            id_map[key] = mid
        content = r["resolved"] if r["resolved"] else f"{TODO}（{r['resolve_kind']}: {r.get('key') or r.get('arg_raw')}）"
        out.append([
            mid,
            screen,
            trigger_element(r),
            TODO,  # トリガー条件: codex
            r["kind_label"],
            r["display_where"],
            r["display_element"],
            content,
            TODO,  # 後続処理: codex
            f"{r['file']}:{r['line']}",
            r["resolve_kind"] if r["resolved"] else f"UNRESOLVED/{r['resolve_kind']}",
            (r.get("heuristic_fid") or "") if not fid else "",
        ])

    dest = out_override or OUT_TSV
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as fh:
        fh.write("\t".join(COLUMNS) + "\n")
        for o in out:
            fh.write("\t".join(c.replace("\t", " ").replace("\n", "\\n") for c in o) + "\n")
    save_id_map(id_map)
    print(f"wrote {len(out)} rows -> {dest}  (id_map={len(id_map)})")
    resolved = sum(1 for o in out if not o[-1].startswith("UNRESOLVED"))
    mapped = sum(1 for o in out if o[1] and not o[1].startswith("[要機能紐付け]") and "_" not in o[0].split("-MSG")[0][:3])
    print(f"resolved content: {resolved}/{len(out)}  | rows needing codex(トリガー/後続/未解決): all rows for those 2 cols")


if __name__ == "__main__":
    main()
