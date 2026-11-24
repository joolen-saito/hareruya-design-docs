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
- 判定→実施結果: 合格→合格／不合格→不合格。未判定と、流せないと決まったケース（config/sheet_not_runnable.tsv）は、実施者・実施日・実施結果・備考の4列とも空欄にする（依頼者指示 2026-11-10）。
- 実施者が「齋藤」の行（この道具が前に書いた行）も書き直す。
- Backlog の課題（review/backlog_e2e_ledger.tsv: テストID・課題キー）があれば、備考に課題の URL（https://joolen.backlog.com/view/<課題キー>）を書く。
  結果を書き直さない行（判定が古い・手元の環境の結果）でも、実施結果が不合格で台帳にあれば、備考の「Backlog:」の行だけを URL にする（2026-11-16）。

使い方:
  python tools/sheet_writeback.py <元の.xlsx> <書き出す.xlsx> [--plan <計画.tsv>] [--only <機能ID>...]
  [--blank-ok <一覧.tsv>]  実施者が空欄の行にも「実施不可」「実施不要」を書いてよいケース（列: テストID［cases/ のテストID］・理由［任意。備考に書く］）。
                          2026-11-23 依頼者決定「流せない行は空欄の行にも実施不可と書き戻す」（齋藤の担当の機能だけ）。無ければ従来どおり
  （openpyxl は使わない。標準ライブラリだけで動く）
"""
import argparse
import csv
import html
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
NOT_NEEDED = E2E / "config" / "sheet_not_needed.tsv"  # 移行しない機能のケース（テストID・理由）→ 実施不要
LEDGER = E2E / "review" / "backlog_e2e_ledger.tsv"
SHEET_NAME = "テストケース"
EXECUTOR = "齋藤"
TARGET_EXECUTORS = {"", "E2E（Playwright）", "齋藤"}  # 齋藤＝この道具が前に書いた行（書き直す）
DATE_STYLE = ""  # 実施日の書式の番号。main() で書式表から yyyy/mm/dd の書式を探して入れる
# 実施できなかったもの（未判定・流せないケース）は実施結果を空欄にする（依頼者指示 2026-11-10「実施不可はスプレッドシートの実施結果を空欄のままにして」）
RESULT_OF = {"合格": "合格", "不合格": "不合格", "未判定": ""}
# 11/10（開発環境で流すと決めた日）より前に手元の環境でこちらが流し、項目表に実施者「E2E（Playwright）」で載っていた行。
# 2026-11-16 依頼者指示で実施者を「齋藤」に変えた。備考に「E2EのテストID」が無いので、この一覧で道具が書いた行として扱い、
# 開発環境で流し直して判定したら書き直す
FORMER_E2E_FILE = E2E / "config" / "sheet_former_e2e_rows.tsv"
FORMER_E2E = {r["一覧のテストID"] for r in csv.DictReader(FORMER_E2E_FILE.open(encoding="utf-8"), delimiter="\t")} if FORMER_E2E_FILE.exists() else set()
BACKLOG_VIEW = "https://joolen.backlog.com/view/"  # 課題の URL（lib_backlog の DEFAULT_SPACE と同じスペース）
# 栗野さんの受け持ちの機能のうち、依頼者の指示でこちらが開発環境で流し直して判定・起票したケース（テストID・一覧のテストID・理由）
SPLIT_EXCEPT_FILE = E2E / "config" / "sheet_split_exceptions.tsv"
BLANK_OK: dict[str, str] = {}  # --blank-ok で渡す。空欄の行にも実施不可を書いてよいケース → 備考に書く理由（空なら流せない一覧の理由）


def read_tsv(p: Path) -> list[dict]:
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def excel_serial(d: dt.date) -> int:
    return (d - dt.date(1899, 12, 30)).days


def cell_text(si_xml: str) -> str:
    return re.sub(r"<[^>]+>", "", si_xml)


def backlog_line(key: str) -> str:
    """備考に書く課題の行。課題キーでなく URL を書く（2026-11-16 依頼者指示「バックログURLを備考欄に記入」）"""
    return f"Backlog: {BACKLOG_VIEW}{key}"


def with_backlog_line(note: str, key: str) -> str:
    """備考の「Backlog: …」の行を、課題の URL の行に置き換える。無ければ末尾に足す。ほかの行は変えない"""
    line = backlog_line(key)
    lines = note.split("\n") if note else []
    idx = [i for i, l in enumerate(lines) if l.startswith("Backlog:")]
    if idx:
        lines[idx[0]] = line
        lines = [l for i, l in enumerate(lines) if i not in idx[1:]]
    else:
        while lines and not lines[-1].strip():
            lines.pop()
        lines.append(line)
    return "\n".join(lines)


def build_results(only: set[str]) -> dict[str, dict]:
    """cases/ のテストID → {結果, 日付, 備考}"""
    ledger = {r["テストID"]: r["課題キー"] for r in read_tsv(LEDGER)}
    out: dict[str, dict] = {}
    # 栗野さんの受け持ちの機能（WORK_SPLIT.tsv）は、栗野さんが流して判定し項目表に載せる（2026-11-11 依頼者決定）。ここでは書かない
    split = {r["機能ID"]: r["受け持ち"] for r in read_tsv(E2E / "review" / "WORK_SPLIT.tsv")}
    # ただし、依頼者の指示でこちらが流し直して判定・起票したケース（config/sheet_split_exceptions.tsv）は書く。
    # 当たるのは項目表で実施者「齋藤」の行だけ（fix_row の決まりどおり。栗野さんの行・空欄の行は触らない）
    split_except = {r["テストID"] for r in read_tsv(SPLIT_EXCEPT_FILE)}
    # 流せない・移行しないと決めたケースは、開発環境の判定が「未判定」でも、下の一覧の「実施不可」「実施不要」を書く
    # （2026-11-17。M04-25 の 029・030 など、正本が求める店舗の設定を作れず未判定になったもの）
    listed = {n["テストID"] for n in read_tsv(NOT_RUNNABLE)} | {n["テストID"] for n in read_tsv(NOT_NEEDED)}
    for jf in sorted(JUDG.glob("*.tsv")):
        fid = jf.stem
        if only and fid not in only:
            continue
        kurino = split.get(fid) == "栗野さん"
        if kurino and not any(t[3:9] == fid for t in split_except):
            continue
        for j in read_tsv(jf):
            tid = j["テストID"]
            if kurino and tid not in split_except:
                continue
            rf = EVID / fid / tid / "result.json"
            if not rf.exists():
                continue
            r = json.loads(rf.read_text(encoding="utf-8"))
            if (r.get("環境") or {}).get("E2E_ENV") != "dev":
                continue
            if j["対象の実施日時"] != r["実施日時"]:
                continue  # 古い実施への判定
            if j["判定"] == "未判定" and tid in listed:
                continue
            if j["判定"] not in RESULT_OF:
                continue
            res = RESULT_OF[j["判定"]]
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
                notes.append(backlog_line(ledger[tid]))
            notes.append(f"E2E（Playwright）・開発環境で実施。E2EのテストID {tid}。エビデンス: e2e/evidence/{fid}/{tid}/evidence.html")
            out[tid] = {"結果": res, "日付": day, "備考": "\n".join(notes)}
    # 流せないケースは「実施不可」、移行しない機能のケースは「実施不要」（2026-11-16 依頼者「流せないなら実施不可とし、
    # 移行しない機能は実施不要というルール」）。当てるのは項目表ですでに齋藤の行だけ（空欄の行は人が手で実施できるよう空欄のまま。
    # 2026-11-16 依頼者決定）。fix_row で、実施者が齋藤でない行には書かない
    for path, result, label in ((NOT_NEEDED, "実施不要", "実施しない"), (NOT_RUNNABLE, "実施不可", "実施できない")):
        for n in read_tsv(path):
            tid = n["テストID"]
            if tid in out or (only and tid[3:9] not in only) or split.get(tid[3:9]) == "栗野さん":
                continue
            why = BLANK_OK.get(tid) if result == "実施不可" and BLANK_OK.get(tid) else n["理由"]
            out[tid] = {"結果": result, "日付": dt.date.today(), "備考": f"{label}: {why}\nE2EのテストID {tid}"}
    return out


def date_style_of(styles: str) -> str:
    """書式表（cellXfs）で、表示形式が yyyy/mm/dd の書式の番号。無ければ止める
    （2026-11-16 依頼者指示: 実施日は YYYY/MM/DD の表記にそろえる。ほかの表示形式へは逃がさない）"""
    fmts = dict(re.findall(r'<numFmt numFmtId="(\d+)" formatCode="([^"]*)"', styles))
    xfs = re.findall(r"<xf [^>]*?numFmtId=\"(\d+)\"", re.search(r"<cellXfs[^>]*>(.*?)</cellXfs>", styles, re.S).group(1))
    for want in ("yyyy/mm/dd",):
        for i, n in enumerate(xfs):
            if fmts.get(n) == want:
                return str(i)
    raise SystemExit("実施日に使う日付の書式が、書式表に見つからない（書き戻さない）")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--plan", help="書き換えの計画（行・テストID・前・後）を TSV で書く")
    ap.add_argument("--only", nargs="*", default=[], help="機能IDで絞る")
    ap.add_argument("--blank-ok", help="実施者が空欄の行にも実施不可を書いてよいケースの一覧（TSV: テストID・理由）")
    a = ap.parse_args()
    if a.blank_ok:
        for r in read_tsv(Path(a.blank_ok)):
            BLANK_OK[r["テストID"]] = (r.get("理由") or "").strip()

    list_to_case = {r["一覧のテストID"]: r["cases/のテストID"] for r in read_tsv(ID_MAP)}
    results = build_results(set(a.only))
    ledger_keys = {r["テストID"]: r["課題キー"] for r in read_tsv(LEDGER) if r.get("課題キー")}

    zin = zipfile.ZipFile(a.src)
    wb = zin.read("xl/workbook.xml").decode("utf-8")
    rid = re.search(rf'<sheet [^>]*name="{SHEET_NAME}"[^>]*r:id="([^"]+)"', wb).group(1)
    rels = zin.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    target = re.search(rf'<Relationship [^>]*Id="{rid}"[^>]*Target="([^"]+)"', rels) or re.search(rf'<Relationship [^>]*Target="([^"]+)"[^>]*Id="{rid}"', rels)
    sheet_path = "xl/" + target.group(1).lstrip("/").removeprefix("xl/")
    sis = [cell_text(x) for x in re.findall(r"<si>(.*?)</si>", zin.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]
    sheet = zin.read(sheet_path).decode("utf-8")
    # 実施日の書式は、この .xlsx の書式表から yyyy/mm/dd の書式の番号を探して使う。Google スプレッドシートが書き出し直すと
    # 書式表の番号が振り直されるので、決め打ちの番号（DATE_STYLE）は別の書式に当たることがある（2026-11-16 に 48 が日付でなくなっていた）
    global DATE_STYLE
    DATE_STYLE = date_style_of(zin.read("xl/styles.xml").decode("utf-8"))

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
        # 「齋藤」は人が手で実施した行かもしれない。この道具が書いた行（備考に「E2EのテストID」がある行）と、
        # 手元の環境の E2E の結果で実施者を「E2E（Playwright）」→「齋藤」に変えた行（FORMER_E2E）だけ書き直す
        if executor == EXECUTOR and "E2EのテストID" not in value_of(cells.get("L")) and list_id not in FORMER_E2E:
            return m.group(0)
        tid = list_to_case.get(list_id)
        res = results.get(tid) if tid else None
        if not res:
            # 前にこの道具が書いた行（齋藤・備考に E2EのテストID）で、いま書く結果が無いものは、4列とも空欄に戻す
            # 合格・不合格が書いてある行は、判定が古くなっただけなので残す（流し直して判定したら書き直す）
            if executor == EXECUTOR and value_of(cells.get("K")) in ("", "実施不可", "実施不要"):
                body2 = body
                for col in "IJKL":
                    if col in cells:
                        sm = re.search(r' s="(\d+)"', cells[col])
                        st = DATE_STYLE if col == "J" and not sm else (sm.group(1) if sm else None)
                        body2 = body2.replace(cells[col], f'<c r="{col}{rnum}"' + (f' s="{st}"' if st else "") + '/>', 1)
                changed += 1
                plan.append([rnum, list_id, tid or "", *[value_of(cells.get(c)) for c in "IJKL"], "", "", "", ""])
                return head + body2 + "</row>"
            # 結果を書き直さない行（判定が古い・手元の環境の結果）でも、不合格で起票済みなら備考に課題の URL を書く
            # （2026-11-16 依頼者指示）。備考のほかの行は変えない
            if executor == EXECUTOR and value_of(cells.get("K")) == "不合格" and tid in ledger_keys:
                l_old = html.unescape(value_of(cells.get("L")))
                l_new = with_backlog_line(l_old, ledger_keys[tid])
                if l_new != l_old:
                    old = cells.get("L", "")
                    sm = re.search(r' s="(\d+)"', old)
                    new_l = f'<c r="L{rnum}"' + (f' s="{sm.group(1)}"' if sm else "") + f' t="inlineStr"><is><t xml:space="preserve">{escape(l_new)}</t></is></c>'
                    if old:
                        body2 = body.replace(old, new_l, 1)
                    else:
                        nxt = next((cells[c] for c in sorted(cells) if len(c) == 1 and c > "L"), None)
                        body2 = body.replace(nxt, new_l + nxt, 1) if nxt else body + new_l
                    changed += 1
                    before = [value_of(cells.get(c)) for c in "IJKL"]
                    plan.append([rnum, list_id, tid or "", *before, *before[:3], l_new.replace("\n", " / ")])
                    return head + body2 + "</row>"
            return m.group(0)
        before = [value_of(cells.get(c)) for c in "IJKL"]
        if res["結果"] in ("実施不可", "実施不要") and executor != EXECUTOR:
            # 齋藤の行だけに書く（空欄・ほかの行は触らない。2026-11-16 依頼者決定）。
            # ただし --blank-ok に載ったケースの「実施不可」は、実施者が空欄の行にも書く（2026-11-23 依頼者決定）。
            # 「実施不要」も同じ（A15-15 は課題 2975 で移行しないと決まっていた。2026-11-24 依頼者決定）
            if not (executor == "" and tid in BLANK_OK):
                return m.group(0)
        if res["結果"] == "":
            # 未判定（流したが判定できなかった）は、実施者・実施日・実施結果・備考の4列とも空欄にする（依頼者指示 2026-11-10）
            new = {"I": ("s", ""), "J": ("s", ""), "K": ("s", ""), "L": ("s", "")}
        else:
            day = excel_serial(res["日付"])
            if res["結果"] in ("実施不可", "実施不要") and value_of(cells.get("K")) == res["結果"]:
                # 前に同じ結果を書いた行は、実施日を書いた日のままにする（流すたびに日付が動かないよう）
                jv = value_of(cells.get("J"))
                if re.fullmatch(r"\d+(\.0+)?", jv or ""):
                    day = int(float(jv))
            new = {
                "I": ("s", EXECUTOR),
                "J": ("d", day),
                "K": ("s", res["結果"]),
                "L": ("s", res["備考"]),
            }

        def render(col: str) -> str:
            old = cells.get(col, "")
            sm = re.search(r' s="(\d+)"', old)
            style = DATE_STYLE if col == "J" else (sm.group(1) if sm else None)
            sattr = f' s="{style}"' if style else ""
            kind, val = new[col]
            if kind == "s" and val == "":
                return f'<c r="{col}{rnum}"{sattr}/>'
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
        plan.append([rnum, list_id, tid, *before, *([EXECUTOR, res["日付"].isoformat(), res["結果"], res["備考"].replace("\n", " / ")] if res["結果"] else ["", "", "", ""])])
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
