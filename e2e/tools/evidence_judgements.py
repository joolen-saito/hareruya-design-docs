#!/usr/bin/env python3
"""エビデンスの判定の表（e2e/review/judgements/<機能ID>.tsv）を扱う。

  python3 tools/evidence_judgements.py todo <機能ID>...
      判定が要るケースを出す（不合格・未判定・注記のある合格で、判定が無いか古いもの）。
  python3 tools/evidence_judgements.py accept-clean <機能ID> --record <e2e/review の記録のパス>
      注記の無い合格（手順の注記・シード作成時の問題・記録の注意が1つも無く、正本と一致するもの）を「合格」として判定の表に書く。
      注記のある合格・不合格・未判定は書かない（人が読んで判定する）。
  python3 tools/evidence_judgements.py set <機能ID> <テストID> <判定> <区分> <理由> --record <記録のパス>
      1件の判定を書く（同じテストIDの行は置き換える）。対象の実施日時はいまのエビデンスから取る。
  python3 tools/evidence_judgements.py sync <機能ID>... [--apply]
      判定済みの結果を合否の一覧（integration_test/casegen/playwright_cases.tsv）へ反映する差分を出す。--apply で書き込む。
      載せるのは「合格（区分が空）」と「不合格（区分が条件付きでない）」だけ（依頼者決定 2026-10-20〜21: 一覧の Playwright は
      条件の付かない合格、不合格は正本の外の補いの上に成り立たないもの）。未判定・条件付きは載せない。既にある行は消さない
      （消すべきものは注意として出す）。

判定の表の列: テストID・判定・区分・理由・対象の実施日時・判定日・記録
  判定と区分の決まりは tools/evidence_check.mjs の「区分の決まり」と同じ。
  対象の実施日時はエビデンスの実施日時（result.json）。流し直すと合わなくなり、「判定が古い」になる。
  記録は e2e/review の進み具合の記録（MD）のパス。判定の理由の詳しい説明はそこに書く。
"""
import csv
import datetime
import json
import os
import sys

E2E = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(E2E)
EVID = os.path.abspath(os.environ.get("E2E_EVIDENCE_DIR") or os.path.join(E2E, "evidence"))
JUDGE = os.path.join(E2E, "review", "judgements")
PWC = os.path.join(REPO, "integration_test", "casegen", "playwright_cases.tsv")
HEAD = ["テストID", "判定", "区分", "理由", "対象の実施日時", "判定日", "記録"]
RULES = {
    "合格": ["", "条件付き"],
    "不合格": ["実装差異", "設計と実装の差異", "設計書の中の食い違い", "正本の問題", "条件付き"],
    "未判定": ["環境", "ハーネス不良", "開発用データ", "正本の問題", "シード"],
}
NOTE_TYPES = {"手順の注記", "シード作成時の問題", "記録の注意"}


def read_tsv(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


def write_tsv(path, head, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write("\t".join(head) + "\n")
        for r in rows:
            f.write("\t".join(" ".join(str(r.get(h, "")).split()) if h == "理由" else str(r.get(h, "")) for h in head) + "\n")
    os.replace(tmp, path)


def records(fid):
    d = os.path.join(EVID, fid)
    out = {}
    if not os.path.isdir(d):
        return out
    for name in sorted(os.listdir(d)):
        f = os.path.join(d, name, "result.json")
        if name.startswith("IT-") and ".tmp-" not in name and os.path.exists(f):
            with open(f, encoding="utf-8") as fh:
                out[name] = json.load(fh)
    return out


def freshness(fid):
    """evidence_index.mjs が決めた正本との一致（results.tsv）"""
    os.system(f'node "{os.path.join(E2E, "tools", "evidence_index.mjs")}" --quiet {fid} >/dev/null')
    return {r["テストID"]: r for r in read_tsv(os.path.join(EVID, fid, "results.tsv"))}


def judgements(fid):
    return {r["テストID"]: r for r in read_tsv(os.path.join(JUDGE, f"{fid}.tsv"))}


def save_judgements(fid, js):
    write_tsv(os.path.join(JUDGE, f"{fid}.tsv"), HEAD, sorted(js.values(), key=lambda r: r["テストID"]))


def check_record(rec_path):
    if not rec_path:
        sys.exit("--record <e2e/review の記録のパス> を与える（判定の理由の説明を書いた MD）")
    if not os.path.exists(os.path.join(REPO, rec_path)):
        sys.exit(f"記録 {rec_path} が無い（リポジトリからの相対パスで与える）")


def notes_of(rec):
    return [n for n in rec.get("注記", []) if n.get("種類") in NOTE_TYPES]


def cmd_todo(fids):
    n = 0
    for fid in fids:
        recs, js, fr = records(fid), judgements(fid), freshness(fid)
        for tid, rec in recs.items():
            j = js.get(tid)
            current = j and j.get("対象の実施日時") == rec["実施日時"]
            if current:
                continue
            notes = notes_of(rec)
            if rec["結果"] == "合格" and not notes:
                continue  # accept-clean で書ける
            if rec["結果"] == "スキップ":
                continue
            n += 1
            why = rec.get("落ちた場面") and f"{rec['落ちた場面']}で停止" or ""
            fails = [k["項目"] for k in rec.get("確かめ", []) if k["結果"] != "合格"]
            print("\t".join([tid, rec["結果"], "判定が古い" if j else "判定なし", fr.get(tid, {}).get("正本との一致", ""), why,
                             " / ".join("✗" + f for f in fails)[:200], f"注記{len(notes)}件" if notes else "",
                             os.path.relpath(os.path.join(EVID, fid, tid, "evidence.html"), REPO)]))
    print(f"要判定 {n}件", file=sys.stderr)


def cmd_accept_clean(fid, rec_path):
    check_record(rec_path)
    recs, js, fr = records(fid), judgements(fid), freshness(fid)
    today = datetime.date.today().isoformat()
    added = 0
    for tid, rec in recs.items():
        if rec["結果"] != "合格" or rec.get("Playwrightの結果") != "passed" or notes_of(rec) or fr.get(tid, {}).get("正本との一致") != "一致":
            continue
        j = js.get(tid)
        if j and j.get("対象の実施日時") == rec["実施日時"]:
            continue
        js[tid] = {"テストID": tid, "判定": "合格", "区分": "", "理由": "", "対象の実施日時": rec["実施日時"], "判定日": today, "記録": rec_path}
        added += 1
    save_judgements(fid, js)
    print(f"{fid}: 注記の無い合格 {added}件を判定の表に書いた")


def cmd_set(fid, tid, verdict, kind, reason, rec_path):
    check_record(rec_path)
    if verdict not in RULES:
        sys.exit(f"判定「{verdict}」は決まりの値でない（{'／'.join(RULES)}）")
    if kind not in RULES[verdict]:
        sys.exit(f"区分「{kind}」は判定「{verdict}」に使えない（{'／'.join(x or '空' for x in RULES[verdict])}）")
    if (verdict == "不合格" or kind) and not reason.strip():
        sys.exit("理由を書く")
    recs = records(fid)
    if tid not in recs:
        sys.exit(f"{tid} のエビデンスが無い（先に流す）")
    auto = recs[tid]["結果"]
    if verdict != "未判定" and verdict != auto:
        sys.exit(f"{tid} の自動判定は「{auto}」。合格・不合格は自動判定と同じときだけ書ける"
                 "（落ちた実施を合格にしない。E2E の不備なら直して流し直す。合格した実施を不合格にしたいなら、テストの確かめが足りない）")
    js = judgements(fid)
    js[tid] = {"テストID": tid, "判定": verdict, "区分": kind, "理由": reason, "対象の実施日時": recs[tid]["実施日時"],
               "判定日": datetime.date.today().isoformat(), "記録": rec_path}
    save_judgements(fid, js)
    print(f"{tid}: {verdict}{f'（{kind}）' if kind else ''} を書いた")


def cmd_sync(fids, apply):
    with open(PWC, encoding="utf-8", newline="") as f:
        head = f.readline().rstrip("\n").split("\t")
    assert head == ["テストID", "結果", "記録"], f"playwright_cases.tsv の見出しが想定と違う: {head}"
    rows = {r["テストID"]: r for r in read_tsv(PWC)}
    order = [r["テストID"] for r in read_tsv(PWC)]
    changes = []
    for fid in fids:
        recs, js, fr = records(fid), judgements(fid), freshness(fid)
        for tid, j in sorted(js.items()):
            rec = recs.get(tid)
            if not rec or j.get("対象の実施日時") != rec["実施日時"]:
                continue  # 古い判定は使わない
            if fr.get(tid, {}).get("正本との一致") != "一致":
                print(f"飛ばす: {tid} は{fr.get(tid, {}).get('正本との一致', '鮮度が不明')}（流し直してから判定する）", file=sys.stderr)
                continue
            if j["判定"] != "未判定" and j["判定"] != rec["結果"]:
                print(f"飛ばす: {tid} の判定「{j['判定']}」が自動判定「{rec['結果']}」と違う（合格・不合格は自動判定と同じときだけ）", file=sys.stderr)
                continue
            listed = (j["判定"] == "合格" and j["区分"] == "") or (j["判定"] == "不合格" and j["区分"] != "条件付き")
            old = rows.get(tid)
            if listed:
                new = {"テストID": tid, "結果": j["判定"], "記録": j["記録"]}
                if not old:
                    changes.append(("追加", new)); rows[tid] = new; order.append(tid)
                elif old["結果"] != new["結果"] or old["記録"] != new["記録"]:
                    what = f"結果の変更（{old['結果']}→{new['結果']}）" if old["結果"] != new["結果"] else "記録の変更"
                    changes.append((what, new)); rows[tid] = new
            elif old:
                print(f"注意: {tid} は合否の一覧に「{old['結果']}」で載っているが、いまの判定は {j['判定']}"
                      f"{'（' + j['区分'] + '）' if j['区分'] else ''}。載せる条件に当たらないので、消すかは人が決める", file=sys.stderr)
    for what, r in changes:
        print(f"{what}\t{r['テストID']}\t{r['結果']}\t{r['記録']}")
    print(f"合否の一覧への反映: {len(changes)}件{'（書き込んだ）' if apply and changes else '（--apply で書き込む）' if changes else ''}", file=sys.stderr)
    if apply and changes:
        write_tsv(PWC, ["テストID", "結果", "記録"], [rows[t] for t in order])
        print("このあと integration_test/casegen/build_all_test_cases.py を流して一覧を作り直す（nice -n 19 で）", file=sys.stderr)


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd, rest = argv[1], argv[2:]
    rec = None
    if "--record" in rest:
        i = rest.index("--record"); rec = rest[i + 1]; rest = rest[:i] + rest[i + 2:]
    apply = "--apply" in rest
    rest = [a for a in rest if a != "--apply"]
    if cmd == "todo":
        cmd_todo(rest)
    elif cmd == "accept-clean" and len(rest) == 1:
        cmd_accept_clean(rest[0], rec)
    elif cmd == "set" and len(rest) == 5:
        cmd_set(*rest, rec)
    elif cmd == "sync" and rest:
        cmd_sync(rest, apply)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
