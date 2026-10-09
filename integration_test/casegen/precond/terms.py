#!/usr/bin/env python3
"""用語の置き換え（依頼者決定 2026-10-06）。

AWS Step Functions は使わないので、テストケースでは「バッチ」と書く。
非同期処理ダッシュボードの「Messenger ジョブ」という表現も書かない。

基線（precond/baseline/）は書き換えない。ゲートは基線にこの置き換えを当ててから照合する。
適用: python3 precond/terms.py   （cases/・step_changes/・open_preconditions.tsv に当てる。何度流しても同じ）
"""
import csv, glob, io, pathlib, re

SF = r"(?:AWS ?)?Step ?Functions"
FID = r"[A-Z]\d{2}-\d{2}"
RULES = [
    # 「Step Functions で <バッチ名> を起動する」→ バッチ名を主語にする
    (re.compile(SF + r"で(" + FID + r")「"), r"バッチ\1「"),
    (re.compile(SF + r"の(" + FID + r")「"), r"バッチ\1「"),
    (re.compile(SF + r"で(「[^」]*バッチ」|同バッチ|[^\s／、。「」]{1,14}バッチを)"), r"\1"),
    (re.compile(SF + r"の(買取自動入庫バッチ)"), r"\1"),
    (re.compile(SF + r"に(「[^」]*バッチ」を起動するタスク)"), r"\1"),
    # 「Step Functions から <バッチ> を手動起動できる」
    (re.compile(SF + r"から(" + FID + r")"), r"バッチ\1"),
    (re.compile(r"(バッチ)を" + SF + r"から"), r"\1を"),
    (re.compile(SF + r"から(「[^」]*バッチ」)"), r"\1"),
    (re.compile(SF + r"から手動起動できる状態"), "バッチを手動起動できる状態"),
    (re.compile(r"(" + FID + r"「[^」]*」を実行する)" + SF + r"が"), r"\1バッチが"),
    (re.compile(r"同じ" + SF + r"を"), "同じバッチを"),
    (re.compile(r"(" + FID + r")を" + SF + r"から"), r"バッチ\1を"),
    (re.compile(r"(" + FID + r") " + SF + r"実行環境"), r"\1 バッチ実行環境"),
    (re.compile(SF + r"と実行コンソールから"), "実行コンソールから"),
    # 残りは語の置き換え
    (re.compile(SF), "バッチ"),
    (re.compile(r"バッチのバッチ"), "バッチ"),
    # Step Functions を前提にした周辺の語
    (re.compile(r"対象(?:ステートマシン|ワークフロー)"), "対象バッチ"),
    (re.compile(r"ステートマシンの定義"), "バッチ起動の定義"),
    (re.compile(r"(" + FID + r")のワークフローを"), r"\1のバッチを"),
    (re.compile(r"AWS(?:管理)?コンソール"), "実行コンソール"),
    # 非同期処理ダッシュボードの「Messenger ジョブ」
    (re.compile(r"「スマレジ Webhook」と「Messenger ジョブ」の"), "「スマレジ Webhook」の"),
    (re.compile(r"ダッシュボードの「Messenger ジョブ」の"), "ダッシュボードの"),
    (re.compile(r"非同期処理（Messenger）"), "非同期処理"),
    # 「非同期処理ダッシュボード」という画面は設計書に無い。画面名を書かず、状態だけを書く（依頼者決定 2026-10-06）
    (re.compile(r"(?:非同期処理)?ダッシュボードの「スマレジ Webhook」の"), "受信したスマレジWebhookと非同期処理のジョブの"),
    (re.compile(r"非同期処理ダッシュボードのWebhook 一覧に(手順\d+の操作の後に受信したWebhook)が表示されるまで待ち"),
     r"\1が受信済みとして確認できるまで待ち"),
    (re.compile(r"非同期処理ダッシュボードの待機中・実行中が"), "非同期処理の待機中・実行中のジョブが"),
    (re.compile(r"(?:管理画面の)?非同期処理のジョブ一覧で、?待機中・実行中のジョブが"), "非同期処理の待機中・実行中のジョブが"),
    (re.compile(r"非同期処理ダッシュボードを見るため"), "非同期処理のジョブの状態を確認するため"),
    (re.compile(r"非同期処理ダッシュボード閲覧者"), "非同期処理の状態確認者"),
    (re.compile(r"非同期処理ダッシュボードを見る"), "非同期処理のジョブの状態を確認する"),
    (re.compile(r"(?:管理画面の)?非同期処理ダッシュボードを参照できる"), "非同期処理のジョブの状態を確認できる"),
    (re.compile(r"非同期処理ダッシュボードで(該当)?ジョブが"), r"非同期処理の\1ジョブが"),
    (re.compile(r"非同期処理ダッシュボードのジョブに現れない"), "非同期処理のジョブとして現れない"),
    (re.compile(r"非同期処理ダッシュボード"), "非同期処理の状態"),
    (re.compile(r"(?:管理画面の)?非同期処理の状態で待機中・実行中のジョブが"), "非同期処理の待機中・実行中のジョブが"),
    (re.compile(r"非同期処理の状態のジョブ"), "非同期処理のジョブ"),
    (re.compile(r"（ダッシュボードでジョブが"), "（非同期処理のジョブが"),
]


def T(s):
    for r, to in RULES:
        s = r.sub(to, s)
    return s


def rewrite(p, cols=None):
    rows = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t"))
    if not rows:
        return 0
    hdr, n = rows[0], 0
    for r in rows[1:]:
        for i, v in enumerate(r):
            if cols and (i >= len(hdr) or hdr[i] not in cols):
                continue
            w = T(v)
            if w != v:
                r[i] = w; n += 1
    if n:
        b = io.StringIO()
        csv.writer(b, delimiter="\t", lineterminator="\n").writerows(rows)
        pathlib.Path(p).write_text(b.getvalue(), encoding="utf-8")
    return n


def main():
    CG = pathlib.Path(__file__).resolve().parents[1]
    n = 0
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        n += rewrite(p, {"事前準備", "手順", "期待結果"})
    for p in sorted(glob.glob(str(CG / "cases/*_seed_data.tsv"))):
        n += rewrite(p, {"区分", "論理名", "状態・属性", "用途", "投入方法"})
    for p in sorted(glob.glob(str(CG / "precond/step_changes/*.tsv"))):
        n += rewrite(p, {"新手順", "理由"})
    n += rewrite(CG / "precond/open_preconditions.tsv", {"対象", "未確定の内容", "手がかり"})
    # 合流前の作業ファイル（link/cases）にも当てておく
    for p in sorted(glob.glob(str(CG / "link/cases/*_link_test_cases.tsv"))):
        n += rewrite(p, {"事前準備", "手順", "期待結果"})
    for p in sorted(glob.glob(str(CG / "link/cases/*_link_seed_data.tsv"))):
        n += rewrite(p, {"区分", "論理名", "状態・属性", "用途", "投入方法"})
    print(f"置き換えたセル {n}")


if __name__ == "__main__":
    main()
