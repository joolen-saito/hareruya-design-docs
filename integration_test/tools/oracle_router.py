#!/usr/bin/env python3
"""オラクル・ルーター — 機能区分に応じて正しいオラクル源を選ぶ（Phase2.5）。

当初「詳細設計HTML=唯一の正」は誤り（実装から導いた期待＝トートロジー／詳細設計は
ハルシネーションし得る）。機能区分（詳細設計HTMLの「カスタマイズ区分」）で分岐:

  標準       → 実ソース（../ec-cube-enterprise 等。標準ec-cube挙動が仕様）
  新規実装   → Excel基本設計のみ（excel_spec_parser の機能ID索引）
  現行踏襲   ┐
  カスタマイズ┘→ Excel（言及あれば正）＋ 詳細設計HTML（Excel沈黙部を補完）

実ソースはオラクルにしない（新規実装/現行踏襲/カスタマイズでは付帯表4=乖離検出専用）。
"""
from __future__ import annotations
import argparse, glob, html, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import excel_spec_parser as ex

KUBUN_RE = re.compile(r"(?:カスタマイズ区分|機能区分)\s*(?:は)?\s*(標準|新規実装|現行踏襲|カスタマイズ)")


def kubun_of(detail_html: Path) -> str:
    t = html.unescape(re.sub(r"<[^>]+>", " ", detail_html.read_text(encoding="utf-8")))
    m = KUBUN_RE.search(t)
    return m.group(1) if m else "不明"


def fid_excel(fid: str) -> str:
    """a01-01 → A01-01（Excel索引キー）。"""
    m = re.match(r"([a-z])0?(\d+)-(\d+)", fid.lower())
    return f"{m.group(1).upper()}{int(m.group(2)):02d}-{m.group(3)}" if m else fid.upper()


def route(fid: str, detail_html: Path, excel_index=None):
    excel_index = excel_index if excel_index is not None else ex.build_index()
    kubun = kubun_of(detail_html)
    exkey = fid_excel(fid)
    excel_ok = exkey in excel_index
    if kubun == "標準":
        oracle = "実ソース"
    elif kubun == "新規実装":
        oracle = "Excelのみ" if excel_ok else "Excel(索引欠落=要確認)"
    elif kubun in ("現行踏襲", "カスタマイズ"):
        oracle = "Excel優先+詳細設計補完" if excel_ok else "詳細設計(+Excel該当なし)"
    else:
        oracle = "要判定(機能区分不明)"
    return {"fid": fid, "kubun": kubun, "oracle": oracle,
            "excel_key": exkey, "excel_ok": excel_ok,
            "excel_doc": Path(excel_index[exkey][0][0]).name if excel_ok else "",
            "detail": str(detail_html)}


def _detail_html_of_itcase(it: Path):
    m = re.search(r"(?:元設計|正本)[^`]*`([^`]+\.html)`", it.read_text(encoding="utf-8"))
    return Path(m.group(1)) if m and Path(m.group(1)).exists() else None


def _fid_of_itcase(it: Path):
    m = re.match(r"([a-z0-9]+)(\d+)_(\d+)_", it.name)
    return f"{m.group(1)}{m.group(2)}-{m.group(3)}" if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fid", nargs="?")
    ap.add_argument("--report", action="store_true", help="全機能のルーティング分布")
    args = ap.parse_args()
    idx = ex.build_index()
    if args.fid:
        # 母集合from fid
        for it in glob.glob("integration_test/*_it_cases.md"):
            if _fid_of_itcase(Path(it)) == args.fid:
                dh = _detail_html_of_itcase(Path(it))
                if dh:
                    print(route(args.fid, dh, idx))
                return
        print(f"{args.fid}: 母集合it_cases無し")
        return
    if args.report:
        from collections import Counter
        by_kubun = Counter(); by_oracle = Counter(); missing_excel = []
        for it in glob.glob("integration_test/*_it_cases.md"):
            dh = _detail_html_of_itcase(Path(it))
            fid = _fid_of_itcase(Path(it))
            if not dh or not fid:
                continue
            r = route(fid, dh, idx)
            by_kubun[r["kubun"]] += 1
            by_oracle[r["oracle"]] += 1
            if r["kubun"] in ("新規実装",) and not r["excel_ok"]:
                missing_excel.append(fid)
        print("=== 機能区分 ===")
        for k, n in by_kubun.most_common():
            print(f"  {n:4d}  {k}")
        print("=== オラクル源のルーティング ===")
        for k, n in by_oracle.most_common():
            print(f"  {n:4d}  {k}")
        if missing_excel:
            print(f"=== 新規実装だがExcel索引に無い(要確認): {len(missing_excel)} ===")
            print("  " + ", ".join(missing_excel[:12]))
        return
    print("fid または --report を指定")


if __name__ == "__main__":
    main()
