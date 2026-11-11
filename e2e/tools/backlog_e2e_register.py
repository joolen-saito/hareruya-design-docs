#!/usr/bin/env python3
"""
E2E（開発環境）の不合格を Backlog へ起票する。

依頼者の決定（2026-11-10）:
- 不合格は全部起票する。種別「結合テスト課題」、カテゴリは「結合テスト_Ph1」＋「不具合_XXXX（該当機能）」。
- カスタム属性「不具合解析結果」（実装バグ／設計バグ／テスト設計バグ／保留 など）と「重要度」（P1〜P3）を付ける。
- 課題名・本文・キャプチャは「未実装・実装乖離リスト」の起票と同じ決まり（スキル hareruya-backlog-drift-export の Output Contract、
  課題名の頭は【実装乖離】【未実装】【一部実装】【要確認】の4語）。

起票の下書き: e2e/review/backlog_e2e/<E2EのテストID>.md
  先頭に「---」で囲んだ見出し（1行1項目「名前: 値」）を置き、そのあとに本文（Backlog の記法のまま）。
    ---
    テストID: IT-F06-06-019
    課題名: 【実装乖離】フロント_会員_購入履歴一覧_「この注文内容で再度購入する」ボタンが無い
    分類: 不具合_フロント_会員
    不具合解析結果: 実装バグ
    重要度: P3
    添付: evidence/F06-06/IT-F06-06-019/IT-F06-06-019_1.png, evidence/F06-06/IT-F06-06-019/IT-F06-06-019_3.png
    ---
    # 基本情報【必須】
    …

台帳: e2e/review/backlog_e2e_ledger.tsv（テストID・課題キー・登録日時）。登録できたら1件ずつすぐ書く。
台帳にあるテストIDは二度と登録しない（Backlog の API に冪等性は無い。台帳を消して流すと二重登録になる）。

使い方:
  python3 tools/backlog_e2e_register.py --list                 # 下書きと登録の状態
  python3 tools/backlog_e2e_register.py --show <テストID>        # 送る値と本文を見る
  python3 tools/backlog_e2e_register.py --apply --id <テストID>  # 1件だけ登録（最初は必ずこれ。画面で確かめる）
  python3 tools/backlog_e2e_register.py --apply                # 台帳に無い下書きを全部登録
--apply の前に、登録する内容を依頼者に見せて承認を得る（起票は取り消しにくい）。
"""
import argparse
import re
import datetime as dt
import sys
import time
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
REPO = E2E.parent
sys.path.insert(0, str(REPO / "design_impl_drift_report"))
from lib_backlog import BacklogClient, pick_by_name  # noqa: E402

DRAFTS = E2E / "review" / "backlog_e2e"
LEDGER = E2E / "review" / "backlog_e2e_ledger.tsv"
PROJECT_KEY = "ECCUBE_HARERUYA"
ISSUE_TYPE = "結合テスト課題"
BASE_CATEGORY = "結合テスト_Ph1"
PRIORITY_ID = 3  # 中（既存の起票に合わせる。高は慎重に使われている）
FIELD_ANALYSIS = "不具合解析結果"
FIELD_SEVERITY = "重要度"
PREFIXES = ("【実装乖離】", "【未実装】", "【一部実装】", "【要確認】")
SLEEP = 1.5  # 保存系 API は毎分60回まで


def parse(p: Path) -> dict:
    text = p.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"{p.name}: 先頭に見出し（---）が無い")
    head, body = text[4:].split("\n---\n", 1)
    meta = {}
    for line in head.splitlines():
        if line.strip():
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for k in ("テストID", "課題名", "分類", "不具合解析結果", "重要度"):
        if not meta.get(k):
            raise ValueError(f"{p.name}: 見出しに「{k}」が無い")
    if meta["テストID"] != p.stem:
        raise ValueError(f"{p.name}: テストID {meta['テストID']} がファイル名と違う")
    if not meta["課題名"].startswith(PREFIXES):
        raise ValueError(f"{p.name}: 課題名の頭は {'・'.join(PREFIXES)} のどれか")
    for need in ("# 基本情報【必須】", "# 再現手順【必須】", "# 期待される挙動【必須】", "# 現在の挙動【必須】", "# 根拠"):
        if need not in body:
            raise ValueError(f"{p.name}: 本文に「{need}」が無い")
    meta["添付"] = [s.strip() for s in meta.get("添付", "").split(",") if s.strip()]
    for a in meta["添付"]:
        if not (E2E / a).exists():
            raise ValueError(f"{p.name}: 添付 {a} が無い")
    # 本文に記入例の行（/* 記入例: … */）は出さない（依頼者指示 2026-11-10）
    # 関連のエビデンスは手元のパスでなくキャプチャ（添付）で示す。「- エビデンス: …」の行は出さない（依頼者指示 2026-11-10）
    body = "\n".join(l for l in body.splitlines() if not re.match(r"^\s*/\*\s*記入例", l) and not re.match(r"^\s*[-・]\s*エビデンス\s*[:：]", l))
    meta["本文"] = body.strip() + "\n"
    return meta


def with_captures(body: str, names: list[str]) -> str:
    """添付したキャプチャを本文の中に表示する（依頼者指示 2026-11-11「バックログチケット本人にキャプチャを乗せる」）。
    Backlog の Markdown では「![説明][添付ファイル名]」で添付の画像を本文に出せる。「# 根拠」の前（現在の挙動の終わり）に置く。"""
    if not names or "![" in body:
        return body
    block = "\nキャプチャ:\n" + "\n".join(f"![{n}][{n}]" for n in names) + "\n\n"
    i = body.find("# 根拠")
    return body[:i] + block + body[i:] if i >= 0 else body.rstrip() + "\n" + block


def read_ledger() -> dict[str, str]:
    if not LEDGER.exists():
        return {}
    rows = [l.split("\t") for l in LEDGER.read_text(encoding="utf-8").splitlines()[1:] if l.strip()]
    return {r[0]: r[1] for r in rows}


def append_ledger(tid: str, key: str) -> None:
    new = not LEDGER.exists()
    with LEDGER.open("a", encoding="utf-8") as f:
        if new:
            f.write("テストID\t課題キー\t登録日時\n")
        f.write(f"{tid}\t{key}\t{dt.datetime.now().isoformat(timespec='seconds')}\n")


def resolve(client: BacklogClient, m: dict) -> dict:
    types = client.get_issue_types(PROJECT_KEY)
    cats = client.get_categories(PROJECT_KEY)
    fields = {f["name"]: f for f in client.get_custom_fields(PROJECT_KEY)}
    it = pick_by_name(types, ISSUE_TYPE, label="種別")
    cat_ids = [pick_by_name(cats, BASE_CATEGORY, label="カテゴリ")["id"], pick_by_name(cats, m["分類"], label="カテゴリ")["id"]]
    custom = {}
    for fname, val in ((FIELD_ANALYSIS, m["不具合解析結果"]), (FIELD_SEVERITY, m["重要度"])):
        f = fields[fname]
        if it["id"] not in (f.get("applicableIssueTypes") or []):
            raise ValueError(f"カスタム属性「{fname}」が種別「{ISSUE_TYPE}」に使えない（プロジェクト設定で足す）")
        custom[f["id"]] = pick_by_name(f["items"], val, label=fname)["id"]
    return {"project_id": client.get_project(PROJECT_KEY)["id"], "issue_type_id": it["id"], "category_ids": cat_ids, "custom_fields": custom}


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--list", action="store_true")
    g.add_argument("--show")
    g.add_argument("--apply", action="store_true")
    ap.add_argument("--id")
    a = ap.parse_args()

    drafts = {p.stem: p for p in sorted(DRAFTS.glob("IT-*.md"))}
    ledger = read_ledger()
    if a.list:
        for tid, p in drafts.items():
            try:
                m = parse(p)
                print(f"{tid}\t{ledger.get(tid, '未登録')}\t{m['重要度']}\t{m['不具合解析結果']}\t{m['分類']}\t{m['課題名']}")
            except ValueError as e:
                print(f"{tid}\t下書きの誤り\t{e}")
        return 0
    client = BacklogClient.from_environment(allow_write=a.apply)
    if a.show:
        m = parse(drafts[a.show])
        r = resolve(client, m)
        m["本文"] = with_captures(m["本文"], [Path(x).name for x in m["添付"]])
        print(f"課題名: {m['課題名']}\n種別: {ISSUE_TYPE}（{r['issue_type_id']}）\nカテゴリ: {BASE_CATEGORY}・{m['分類']}（{r['category_ids']}）")
        print(f"不具合解析結果: {m['不具合解析結果']}・重要度: {m['重要度']}（{r['custom_fields']}）\n優先度: 中\n添付: {m['添付']}\n台帳: {ledger.get(a.show, '未登録')}\n---\n{m['本文']}")
        return 0
    todo = [a.id] if a.id else [t for t in drafts if t not in ledger]
    for tid in todo:
        if tid in ledger:
            print(f"skip  {tid}  登録済 {ledger[tid]}")
            continue
        m = parse(drafts[tid])
        r = resolve(client, m)
        att = []
        for path in m["添付"]:
            att.append(client.upload_attachment(E2E / path)["id"])
            time.sleep(SLEEP)
        issue = client.create_issue(project_id=r["project_id"], issue_type_id=r["issue_type_id"], priority_id=PRIORITY_ID,
                                    summary=m["課題名"], description=with_captures(m["本文"], [Path(x).name for x in m["添付"]]), category_ids=r["category_ids"],
                                    attachment_ids=att, custom_fields=r["custom_fields"])
        append_ledger(tid, issue["issueKey"])
        print(f"登録  {tid}  {issue['issueKey']}  {m['課題名']}")
        time.sleep(SLEEP)
    return 0


if __name__ == "__main__":
    sys.exit(main())
