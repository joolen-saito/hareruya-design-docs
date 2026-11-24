#!/usr/bin/env python3
"""MTGバイヤー（試験端末のアプリ）の手動試験の手順書を作る（O01-01・O01-02。項目表の「実施不可」のうち端末の行 177件）。

読むもの:
  integration_test/casegen/cases/O01-0{1,2}_test_cases.tsv ・ _seed_data.tsv   ケースの正本（事前準備・手順・期待結果）
  data/項目表対応.tsv                項目表のテストIDと cases のテストIDの対応
  data/控えた番号.tsv                 データを作ったときに控えた番号（呼び名と値）
  data/準備結果.tsv                   ケースごとのデータの準備の結果（作成済み／作れなかった）
作るもの（このフォルダ）: 01_O01-01_ケース表.md／.tsv, 02_O01-02_ケース表.md／.tsv
手順・期待結果・事前準備の文は正本のとおり。変えるのは、〔…〕の呼び名を控えた番号に置き換えることだけ（控えていない呼び名はそのまま残す）。
物理名（表名・列名）は出さない。DB・アプリには触らない。
"""
import csv
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CASES = HERE.parents[2] / "integration_test" / "casegen" / "cases"
DATA = HERE / "data"

LABEL = re.compile(r"〔[^〕]+〕")


def tsv(p):
    with open(p, encoding="utf-8", newline="") as f:
        return list(csv.reader(f, delimiter="\t"))


def load_notes():
    notes = {}
    p = DATA / "控えた番号.tsv"
    if p.exists():
        for r in tsv(p)[1:]:
            if len(r) >= 3 and r[1]:
                notes[r[1]] = r[2]
    return notes


def load_prep():
    prep = {}
    p = DATA / "準備結果.tsv"
    if p.exists():
        for r in tsv(p)[1:]:
            if len(r) >= 4:
                prep[r[0]] = {"結果": r[1], "注記": r[2], "番号": r[3], "時刻": r[4] if len(r) > 4 else ""}
    return prep


def sub(text, notes):
    return LABEL.sub(lambda m: notes.get(m.group(0), m.group(0)), text)


# 項目表の対応（casesのテストID -> (項目表のテストID, 項目表の行)）
def load_map():
    m = {}
    for r in tsv(DATA / "項目表対応.tsv")[1:]:
        m[r[1]] = (r[0], r[3])
    return m


# 作れなかったケースの理由（準備結果に無いものの既知の理由）。準備を流したら準備結果.tsv の値が優先される
KNOWN_NG = {}
KNOWN_NG_FILE = DATA / "作れないケース.tsv"
if KNOWN_NG_FILE.exists():
    for r in tsv(KNOWN_NG_FILE)[1:]:
        KNOWN_NG[r[0]] = r[1]


HUMAN_SEED = re.compile(r"^S-O01-0[12]-(TERM|ID|FILE)-\d+$")
SHARED_PREP_HUMAN = re.compile(r"^S-O01-0[12]-(ENV|STORE|BULKSET)$")


def reading_notes(fid, case_text):
    """原文は変えず、読み替えを別の欄に書く（店舗・職業・国・部門ID）"""
    out = []
    if fid == "O01-01":
        if "O0101試験店舗" in case_text:
            out.append("店舗名「O0101試験店舗」（店舗ID 9010001）→ 試験支店（店舗ID 1574）。店舗は作らない決まり（2026-11-13）")
        if "O0101試験職業" in case_text or "O0101試験国" in case_text:
            out.append("職業「O0101試験職業」・国「O0101試験国」→ 作っていない。申込時の既存の選択肢（職業は先頭・国は日本）。端末の画面にも出ないはず")
        if re.search(r"部門ID 9011\d{3}", case_text):
            out.append("部門ID 9011001・9011002・9011009 → 画面が振った番号（data/控えた番号.tsv の「部門ID（シード表の…）」）。部門名はそのまま")
    else:
        if "トーナメントセンター 東京" in case_text:
            out.append("所属店舗名「トーナメントセンター 東京」は既存の店舗（店舗ID 1。本店）")
    return out


def build(fid, notes, prep, mp):
    cases = {r[0]: r for r in tsv(CASES / f"{fid}_test_cases.tsv")[1:]}
    seeds = {r[0]: r for r in tsv(CASES / f"{fid}_seed_data.tsv")[1:]}
    rows = []
    for cid, c in cases.items():
        if cid not in mp:
            continue
        item_id, item_row = mp[cid]
        seed_ids = [s.strip() for s in c[6].split(",") if s.strip()]
        p = prep.get(cid)
        data_list = []
        status = "未作成"
        remark = ""
        if p:
            status = p["結果"]
            data_list = [x for x in p["番号"].split("；") if x]
            if status != "作成済み":
                remark = p["注記"]
        elif cid in KNOWN_NG:
            status = "作れない"
            remark = KNOWN_NG[cid]
        if not p and cid not in KNOWN_NG and fid == "O01-02":
            ords = [x for x in seed_ids if "-ORD-" in x and x in seeds]
            fixed = [x for x in ords if "登録時に画面が振る" not in seeds[x][3]]
            status = "未作成"
            remark = ("受注・商品・規格の番号がシード表で固定（例: 受注ID 9102006）。画面では振れない番号で、DBへ番号指定の直接登録が要る（E2E の行だけに書く決まりの範囲外。依頼者の判断待ち）"
                      if fixed else "ネット買取の受注（会員登録→申込→状態変更→DB設定）の作り方が未実装。今回は作っていない")
        # 準備したデータ: 準備結果の控えた番号。無ければ、控えた番号の表から、ケースの文に出てくる呼び名を引く
        if not data_list:
            labels = LABEL.findall(c[7] + c[8] + c[9])
            data_list = [f"{l}={notes[l]}" for l in dict.fromkeys(labels) if l in notes]
        human = []
        for s in seed_ids:
            if HUMAN_SEED.match(s) and s in seeds:
                human.append(f"({s}) " + sub(seeds[s][5], notes))
        case_text = c[7] + c[8] + c[9]
        rd = reading_notes(fid, case_text)
        reusable = "使い捨て（実施で状態が変わる。やり直すときは「03_データの作り直し方」）" if any("状態を変える" in seeds[s][4] for s in seed_ids if s in seeds) else "状態を変えない"
        rows.append({
            "項目表のテストID": item_id, "項目表の行": item_row, "casesのテストID": cid,
            "データの状態": status, "準備したデータ（番号）": "／".join(data_list),
            "使い捨てか": reusable, "読み替え": "／".join(rd), "準備の備考": remark,
            "事前準備": sub(c[7], notes), "端末で人がする準備": "／".join(human),
            "手順": sub(c[8], notes), "期待結果": sub(c[9], notes),
            "実施者": "", "実施日": "", "実施結果": "", "備考": "",
        })
    return rows


COLS = ["項目表のテストID", "項目表の行", "casesのテストID", "データの状態", "準備したデータ（番号）", "使い捨てか", "読み替え", "準備の備考",
        "事前準備", "端末で人がする準備", "手順", "期待結果", "実施者", "実施日", "実施結果", "備考"]


def write_outputs(fid, no, rows):
    stem = f"{no}_{fid}_ケース表"
    with open(HERE / f"{stem}.tsv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(COLS)
        for r in rows:
            w.writerow([r[c].replace("\r", " ").replace("\n", " ") for c in COLS])
    lines = [f"# {fid} 試験端末（MTGバイヤー）の手動試験 ケース表（{len(rows)}件）", "",
             "- 手順・期待結果・事前準備は、ケースの正本のとおり（変えたのは、〔…〕の呼び名を控えた番号にしたことだけ）。",
             "- 共通の準備（端末の設定・ログイン）は `00_共通の準備.md`、データの作り直しは `03_データの作り直し方.md`。",
             "- Excel で開くときは同じ名前の `.tsv`（UTF-8・タブ区切り）。記入欄（実施者・実施日・実施結果・備考）は空のまま渡す。", ""]
    for r in rows:
        lines += [f"## {r['項目表のテストID']}（{r['casesのテストID']}・項目表の行 {r['項目表の行']}）", ""]
        lines += [f"- データの状態: **{r['データの状態']}**" + (f"（{r['準備の備考']}）" if r["準備の備考"] else ""),
                  f"- 準備したデータ（番号）: {r['準備したデータ（番号）'] or '（なし）'}",
                  f"- 使い捨てか: {r['使い捨てか']}"]
        if r["読み替え"]:
            lines.append(f"- 読み替え（原文は変えていない）: {r['読み替え']}")
        lines += ["", "**事前準備**", "", r["事前準備"], ""]
        if r["端末で人がする準備"]:
            lines += ["**端末で人がする準備**", "", r["端末で人がする準備"], ""]
        steps = re.split(r"／(?=\d+\.\s)", r["手順"])
        lines += ["**手順**", ""] + [f"- {s.strip()}" for s in steps] + ["", "**期待結果**", "", r["期待結果"], "",
                  "| 実施者 | 実施日 | 実施結果 | 備考 |", "| --- | --- | --- | --- |", "|  |  |  |  |", ""]
    (HERE / f"{stem}.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    notes, prep, mp = load_notes(), load_prep(), load_map()
    summary = []
    for no, fid in [("01", "O01-01"), ("02", "O01-02")]:
        rows = build(fid, notes, prep, mp)
        write_outputs(fid, no, rows)
        n = {}
        for r in rows:
            n[r["データの状態"]] = n.get(r["データの状態"], 0) + 1
        summary.append((fid, len(rows), n))
    for s in summary:
        print(*s)


if __name__ == "__main__":
    sys.exit(main())
