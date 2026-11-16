#!/usr/bin/env python3
"""
項目表（結合試験項目表.xlsx の「テストケース」シート）で、実施者「齋藤」・実施結果「不合格」の行が
Backlog に起票され、備考に課題の URL が書かれているかを確かめ、残りを起票の待ち行列にする。

依頼者の指示（2026-11-16）:「私が担当した分について、実施結果が不具合についてはバックログに起票して、
バックログURLを備考欄に記入するように仕組化してください」
- 対象は、実施者が「齋藤」の行のうち、この仕組みが書いた行（備考に「E2EのテストID」がある行と、
  config/sheet_former_e2e_rows.tsv の行）。人が手で書いた「齋藤」の行は数えるだけで扱わない。
- 起票はスキル hareruya-e2e-backlog-register の手順（1件ずつ調べて下書き → 検査 → 登録 → 台帳）。
  開発環境のエビデンスでしか起票しない（手元の環境の結果は、開発環境で流し直して判定してから）。
- 備考の URL は e2e/tools/sheet_writeback.py が台帳（review/backlog_e2e_ledger.tsv）から書く。

仕分け（状態）:
  起票済み            台帳に課題キーがある（まとめ先・既存の課題を含む）
  起票済み・備考にURLなし  起票済みだが、項目表の備考に課題の URL がまだ無い → sheet_writeback.py を流して書き戻す
  保留                review/backlog_e2e/pending.tsv にある（起票しない理由を書いたもの）
  下書きあり・未登録     review/backlog_e2e/<E2EのテストID>.md があり台帳に無い → 検査して --apply
  起票待ち            開発環境で不合格と判定済み・下書きなし → 1件ずつ調べて下書き（queue_sheet.tsv）
  流し直し待ち         開発環境の判定が無い（手元の環境の結果だけ）→ 開発環境で流して判定（queue_rerun_dev.tsv）

書き出すもの（review/backlog_e2e/）:
  sheet_fail_status.tsv  不合格の行と状態の全部
  queue_sheet.tsv        起票待ち（queue*.tsv と同じ列: E2EのテストID・項目表のテストID・区分・理由・記録）
  queue_rerun_dev.tsv    流し直し待ち（E2EのテストID・項目表のテストID・機能ID・受け持ち・実施日・理由）

使い方:
  python3 tools/sheet_fail_backlog.py <項目表の写し.xlsx>
  終わりの状態: 起票待ち・下書きあり・未登録・流し直し待ち・起票済み・備考にURLなし が全部0件なら 0 で終わる。残りがあれば 1。
"""
import argparse
import collections
import csv
import datetime as dt
import html
import json
import re
import sys
import zipfile
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
REPO = E2E.parent
EVID = E2E / "evidence"
JUDG = E2E / "review" / "judgements"
DRAFTS = E2E / "review" / "backlog_e2e"
LEDGER = E2E / "review" / "backlog_e2e_ledger.tsv"
PENDING = DRAFTS / "pending.tsv"
FORMER = E2E / "config" / "sheet_former_e2e_rows.tsv"
SPLIT = E2E / "review" / "WORK_SPLIT.tsv"
ID_MAP = REPO / "integration_test" / "casegen" / "all_test_cases_id_map.tsv"
SHEET_NAME = "テストケース"
EXECUTOR = "齋藤"
URL_RE = re.compile(r"https://joolen\.backlog\.com/view/(ECCUBE_HARERUYA-\d+)")


def read_tsv(p: Path) -> list[dict]:
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def sheet_rows(xlsx: str):
    """テストケースシートの行を (行番号, {列: 値}) で返す（A・I・J・K・L 列だけ）"""
    z = zipfile.ZipFile(xlsx)
    wb = z.read("xl/workbook.xml").decode("utf-8")
    rid = re.search(rf'<sheet [^>]*name="{SHEET_NAME}"[^>]*r:id="([^"]+)"', wb).group(1)
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    tgt = re.search(rf'<Relationship [^>]*Id="{rid}"[^>]*Target="([^"]+)"', rels) or re.search(
        rf'<Relationship [^>]*Target="([^"]+)"[^>]*Id="{rid}"', rels)
    sheet = z.read("xl/" + tgt.group(1).lstrip("/").removeprefix("xl/")).decode("utf-8")
    ss = [html.unescape(re.sub(r"<[^>]+>", "", re.sub(r"<rPh\b.*?</rPh>", "", x, flags=re.S)))
          for x in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]

    def val(cx: str) -> str:
        if 't="s"' in cx:
            m = re.search(r"<v>(\d+)</v>", cx)
            return ss[int(m.group(1))] if m else ""
        if 't="inlineStr"' in cx:
            m = re.search(r"<is>(.*?)</is>", cx, re.S)
            return html.unescape(re.sub(r"<[^>]+>", "", m.group(1))) if m else ""
        m = re.search(r"<v>([^<]*)</v>", cx)
        return html.unescape(m.group(1)) if m else ""

    for rm in re.finditer(r'<row r="(\d+)"[^>]*>(.*?)</row>', sheet, re.S):
        rnum = rm.group(1)
        cells = {c.group(1): val(c.group(0)) for c in re.finditer(r'<c r="([AIJKL])' + rnum + r'"[^>]*?(?:/>|>.*?</c>)', rm.group(2), re.S)}
        yield int(rnum), cells


def dev_judgement(fid: str, tid: str, judg: dict) -> dict | None:
    """いまのエビデンスが開発環境で、その実施への判定があれば返す"""
    j = judg.get(tid)
    rf = EVID / fid / tid / "result.json"
    if not j or not rf.exists():
        return None
    r = json.loads(rf.read_text(encoding="utf-8"))
    if (r.get("環境") or {}).get("E2E_ENV") != "dev" or j["対象の実施日時"] != r["実施日時"]:
        return None
    return j


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx")
    ap.add_argument("--out-dir", default=str(DRAFTS))
    a = ap.parse_args()
    out = Path(a.out_dir)

    idmap = {r["一覧のテストID"]: r["cases/のテストID"] for r in read_tsv(ID_MAP)}
    ledger = {r["テストID"]: r for r in read_tsv(LEDGER) if r.get("課題キー")}
    pending = {l.split("\t")[0]: l.rstrip("\n").split("\t")[1] if "\t" in l else ""
               for l in PENDING.read_text(encoding="utf-8").splitlines() if l.strip()} if PENDING.exists() else {}
    drafts = {p.stem for p in DRAFTS.glob("IT-*.md")}
    former = {r["一覧のテストID"]: r for r in read_tsv(FORMER)}
    split = {r["機能ID"]: r["受け持ち"].split("（")[0] for r in read_tsv(SPLIT)}
    judg: dict[str, dict] = {}
    for jf in sorted(JUDG.glob("*.tsv")):
        for j in read_tsv(jf):
            judg[j["テストID"]] = j  # 同じテストIDは後の行（新しい判定）を使う

    status_rows, q_sheet, q_rerun = [], [], []
    count = collections.Counter()
    human = 0
    for rnum, c in sheet_rows(a.xlsx):
        lid = c.get("A", "")
        if not lid.startswith("IT-") or c.get("I", "").strip() != EXECUTOR or c.get("K", "").strip() != "不合格":
            continue
        note = c.get("L", "")
        if "E2EのテストID" not in note and lid not in former:
            human += 1  # 人が手で書いた「齋藤」の行
            continue
        tid = idmap.get(lid, "")
        fid = tid[3:9]
        key = ledger.get(tid, {}).get("課題キー", "")
        url_keys = URL_RE.findall(note)
        j = dev_judgement(fid, tid, judg) if tid else None
        if key:
            st = "起票済み" if key in url_keys else "起票済み・備考にURLなし"
        elif tid in pending:
            st = "保留"
        elif tid in drafts:
            st = "下書きあり・未登録"
        elif j and j["判定"] == "不合格":
            st = "起票待ち"
            q_sheet.append([tid, lid, j["区分"], j["理由"], j.get("記録", "")])
        else:
            st = "流し直し待ち"
            why = "手元の環境の結果だけ（11/10 より前）" if lid in former else (
                f"開発環境の判定が「{j['判定']}」で項目表と違う" if j else "開発環境の判定が無い・古い")
            q_rerun.append([tid, lid, fid, split.get(fid, "?"), c.get("J", ""), why])
        count[st] += 1
        status_rows.append([rnum, lid, tid, split.get(fid, "?"), "手元の環境" if lid in former else "開発環境",
                            st, key, ledger.get(tid, {}).get("登録日時", ""), pending.get(tid, ""), " ".join(url_keys)])

    def write(name: str, header: list[str], rows: list[list]):
        with (out / name).open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, delimiter="\t")
            w.writerow(header)
            w.writerows(rows)

    write("sheet_fail_status.tsv", ["行", "項目表のテストID", "E2EのテストID", "受け持ち", "結果の出どころ", "状態", "課題キー",
                                    "台帳の登録日時・メモ", "保留の理由", "備考にある課題のURL"], status_rows)
    write("queue_sheet.tsv", ["E2EのテストID", "項目表のテストID", "区分", "理由", "記録"], q_sheet)
    write("queue_rerun_dev.tsv", ["E2EのテストID", "項目表のテストID", "機能ID", "受け持ち", "実施日", "理由"], q_rerun)
    total = sum(count.values())
    print(f"{dt.date.today()} 実施者「齋藤」・実施結果「不合格」: {total}行（人が手で書いた齋藤の不合格 {human}行は対象外）")
    for st in ("起票済み", "起票済み・備考にURLなし", "保留", "下書きあり・未登録", "起票待ち", "流し直し待ち"):
        print(f"  {st}: {count.get(st, 0)}")
    by_owner = collections.Counter((r[3], r[5]) for r in status_rows if r[5] in ("起票待ち", "流し直し待ち", "下書きあり・未登録"))
    if by_owner:
        print("  残りの受け持ち:", dict(by_owner))
    print(f"書き出し: {out}/sheet_fail_status.tsv・queue_sheet.tsv・queue_rerun_dev.tsv")
    left = sum(count.get(s, 0) for s in ("起票済み・備考にURLなし", "下書きあり・未登録", "起票待ち", "流し直し待ち"))
    return 0 if left == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
