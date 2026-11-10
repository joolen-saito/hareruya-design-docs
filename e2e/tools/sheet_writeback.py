#!/usr/bin/env python3
"""
開発環境で流した E2E の判定を、共有ドライブの「結合試験項目表.xlsx」の「テストケース」シートへ書き戻す。

依頼者の決定（2026-11-10）:
- 対象は、実施者が空白か「E2E（Playwright）」の行だけ。ほかの行（人が実施した行）は触らない。
- 実施者「齋藤」・実施日（実施した日）・実施結果（合格／不合格／実施不可）・備考（補足）の4列を書く。
- 開発環境（E2E_ENV=dev）で流した結果だけを使う。手元の環境の結果は書かない。

書き方:
- openpyxl で読み書きすると、Google スプレッドシートが書き出した拡張や書式が落ちる。そのためシートの XML を直接書き換え、
  対象の4つのセルだけを置き換える。ほかの部品（共有文字列・書式・ハイパーリンク・ほかのシート）はそのまま写す。
- 判定は e2e/review/judgements/<機能ID>.tsv の行のうち、いまのエビデンス（evidence/<機能ID>/<テストID>/result.json）の
  実施日時と同じ実施への判定で、エビデンスの環境が dev のものだけ。
- 判定→実施結果: 合格→合格／不合格→不合格／未判定→実施不可。
- 流していないが流せないと決まったケース（config/sheet_not_runnable.tsv: テストID・理由）は実施不可。
- Backlog の課題キー（review/backlog_e2e_ledger.tsv: テストID・課題キー）があれば備考に書く。

使い方:
  python tools/sheet_writeback.py <元の.xlsx> <書き出す.xlsx> [--plan <計画.tsv>] [--only <機能ID>...]
  （openpyxl は使わない。標準ライブラリだけで動く）
"""
import argparse
import csv
import datetime as dt
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

E2E = Path(__file__).resolve().parent.parent
REPO = E2E.parent
EVID = E2E / "evidence"
JUDG = E2E / "review" / "judgements"
ID_MAP = REPO / "integration_test" / "casegen" / "all_test_cases_id_map.tsv"
NOT_RUNNABLE = E2E / "config" / "sheet_not_runnable.tsv"
LEDGER = E2E / "review" / "backlog_e2e_ledger.tsv"
SHEET_NAME = "テストケース"
EXECUTOR = "齋藤"
TARGET_EXECUTORS = {"", "E2E（Playwright）"}
DATE_STYLE = "48"  # 既存の E2E の行が実施日に使っている書式（yyyy-mm-dd）
RESULT_OF = {"合格": "合格", "不合格": "不合格", "未判定": "実施不可"}


def read_tsv(p: Path) -> list[dict]:
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def excel_serial(d: dt.date) -> int:
    return (d - dt.date(1899, 12, 30)).days


def cell_text(si_xml: str) -> str:
    return re.sub(r"<[^>]+>", "", si_xml)


def build_results(only: set[str]) -> dict[str, dict]:
    """cases/ のテストID → {結果, 日付, 備考}"""
    ledger = {r["テストID"]: r["課題キー"] for r in read_tsv(LEDGER)}
    out: dict[str, dict] = {}
    for jf in sorted(JUDG.glob("*.tsv")):
        fid = jf.stem
        if only and fid not in only:
            continue
        for j in read_tsv(jf):
            tid = j["テストID"]
            rf = EVID / fid / tid / "result.json"
            if not rf.exists():
                continue
            r = json.loads(rf.read_text(encoding="utf-8"))
            if (r.get("環境") or {}).get("E2E_ENV") != "dev":
                continue
            if j["対象の実施日時"] != r["実施日時"]:
                continue  # 古い実施への判定
            res = RESULT_OF.get(j["判定"])
            if not res:
                continue
            day = dt.datetime.fromisoformat(r["実施日時"]).date()
            notes = []
            if j["判定"] == "合格" and j["区分"] == "条件付き":
                notes.append(f"条件付きの合格: {j['理由']}")
            elif j["判定"] == "不合格":
                notes.append(f"不合格（{j['区分']}）: {j['理由']}")
            elif j["判定"] == "未判定":
                notes.append(f"実施できなかった（{j['区分']}）: {j['理由']}")
            elif j["理由"]:
                notes.append(j["理由"])
            if tid in ledger:
                notes.append(f"Backlog: {ledger[tid]}")
            notes.append(f"E2E（Playwright）・開発環境で実施。E2EのテストID {tid}。エビデンス: e2e/evidence/{fid}/{tid}/evidence.html")
            out[tid] = {"結果": res, "日付": day, "備考": "\n".join(notes)}
    for n in read_tsv(NOT_RUNNABLE):
        tid = n["テストID"]
        if tid in out or (only and tid[3:9] not in only):
            continue
        out[tid] = {"結果": "実施不可", "日付": dt.date.today(), "備考": f"実施できない: {n['理由']}\nE2EのテストID {tid}"}
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--plan", help="書き換えの計画（行・テストID・前・後）を TSV で書く")
    ap.add_argument("--only", nargs="*", default=[], help="機能IDで絞る")
    a = ap.parse_args()

    list_to_case = {r["一覧のテストID"]: r["cases/のテストID"] for r in read_tsv(ID_MAP)}
    results = build_results(set(a.only))

    zin = zipfile.ZipFile(a.src)
    wb = zin.read("xl/workbook.xml").decode("utf-8")
    rid = re.search(rf'<sheet [^>]*name="{SHEET_NAME}"[^>]*r:id="([^"]+)"', wb).group(1)
    rels = zin.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    target = re.search(rf'<Relationship [^>]*Id="{rid}"[^>]*Target="([^"]+)"', rels) or re.search(rf'<Relationship [^>]*Target="([^"]+)"[^>]*Id="{rid}"', rels)
    sheet_path = "xl/" + target.group(1).lstrip("/").removeprefix("xl/")
    sis = [cell_text(x) for x in re.findall(r"<si>(.*?)</si>", zin.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]
    sheet = zin.read(sheet_path).decode("utf-8")

    def value_of(cell_xml: str | None) -> str:
        if not cell_xml:
            return ""
        m = re.search(r'<v>([^<]*)</v>', cell_xml)
        if 't="s"' in cell_xml and m:
            return sis[int(m.group(1))]
        m2 = re.search(r"<t[^>]*>(.*?)</t>", cell_xml, re.S)
        return m2.group(1) if m2 else (m.group(1) if m else "")

    plan = []
    changed = 0

    def fix_row(m: re.Match) -> str:
        nonlocal changed
        rnum, head, body = m.group(1), m.group(0)[: m.start(3) - m.start(0)], m.group(3)
        if rnum == "1":
            return m.group(0)
        cells = {mm.group(1): mm.group(0) for mm in re.finditer(r'<c r="([A-Z]+)' + rnum + r'"[^>]*?(?:/>|>.*?</c>)', body, re.S)}
        list_id = value_of(cells.get("A"))
        executor = value_of(cells.get("I")).strip()
        if not list_id.startswith("IT-") or executor not in TARGET_EXECUTORS:
            return m.group(0)
        tid = list_to_case.get(list_id)
        res = results.get(tid) if tid else None
        if not res:
            return m.group(0)
        before = [value_of(cells.get(c)) for c in "IJKL"]
        new = {
            "I": ("s", EXECUTOR),
            "J": ("d", excel_serial(res["日付"])),
            "K": ("s", res["結果"]),
            "L": ("s", res["備考"]),
        }

        def render(col: str) -> str:
            old = cells.get(col, "")
            sm = re.search(r' s="(\d+)"', old)
            style = DATE_STYLE if col == "J" else (sm.group(1) if sm else None)
            sattr = f' s="{style}"' if style else ""
            kind, val = new[col]
            if kind == "d":
                return f'<c r="{col}{rnum}"{sattr}><v>{val}</v></c>'
            return f'<c r="{col}{rnum}"{sattr} t="inlineStr"><is><t xml:space="preserve">{escape(val)}</t></is></c>'

        for col in "IJKL":
            if col in cells:
                body = body.replace(cells[col], render(col), 1)
            else:
                # セルが無い行: 列の順を保って差し込む（次の列のセルの前か、行の末尾）
                nxt = next((cells[c] for c in sorted(cells) if len(c) == 1 and c > col), None)
                body = body.replace(nxt, render(col) + nxt, 1) if nxt else body + render(col)
        changed += 1
        plan.append([rnum, list_id, tid, *before, EXECUTOR, res["日付"].isoformat(), res["結果"], res["備考"].replace("\n", " / ")])
        return head + body + "</row>"

    sheet2 = re.sub(r'<row r="(\d+)"([^>]*)>(.*?)</row>', fix_row, sheet, flags=re.S)

    with zipfile.ZipFile(a.dst, "w") as zout:
        for info in zin.infolist():
            data = sheet2.encode("utf-8") if info.filename == sheet_path else zin.read(info.filename)
            zout.writestr(info, data, compress_type=info.compress_type)
    if a.plan:
        with open(a.plan, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, delimiter="\t")
            w.writerow(["行", "一覧のテストID", "E2EのテストID", "前_実施者", "前_実施日", "前_実施結果", "前_備考", "実施者", "実施日", "実施結果", "備考"])
            w.writerows(plan)
    print(f"書き換えた行: {changed}（判定のあるケース {len(results)}件）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
