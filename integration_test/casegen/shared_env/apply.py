#!/usr/bin/env python3
"""共有の開発環境で1件しかない設定を書き換えるシードに、後片付け（または「手元の環境で行う」）の文を書き足す。 apply.py

依頼者決定（2026-10-26）: 送料無料条件のような共有の設定を安易に変えると、開発環境を触っているほかの人が混乱する。
- 変えないと試せない設定は、変える前に今の値を控え、ケースが終わったら控えた値へ戻す（戻す先は ee の標準値でなく開発環境の今の値）。
- 店舗ID 1 の会社名・店名・メールアドレスなど、一時的にでも変えるとほかの人に大きく影響するものは、共有の開発環境では行わず手元の環境で行う。
- IP 許可リストは1行でも入れるとリストに無い人が全員入れなくなるので、空なら設定しない・空でなければ1行書き足して後で消す。
ケースの手順・期待結果は変えない。シードの「投入方法」の末尾に「／〔共有の設定〕…」を書き足すだけ。

- 書き足す文は decisions.tsv（シードID・判定・設定・書き足す文・理由）。文は判定ごとの決まった形（TEMPLATES）に限る。
  1つのシードに種類の違う書き換えが混ざるときは、同じシードIDの行を複数書く（表の順に続けて書き足す。同じ判定は1行まで）。
- 当てる先: ../cases/*_seed_data.tsv と、外した表（../excluded_*_seeds.tsv）。同じシードが複数の表にあれば全部。
- 何度流しても同じ。前に書き足した文（「／〔共有の設定〕」から末尾まで）は今の決定の文に置き換える。決定から外れたシードは書き足しを消す。
- 流す順: datapattern/conflicts/apply_rulings.py の最後（dummy_url/apply.py の後）から呼ぶ。書き足しは常に末尾なので、
  前段の直し（product_csv・runnable・dummy_url）の照合には効かない。
"""
import csv, glob, pathlib, re, sys

S = pathlib.Path(__file__).resolve().parent
CG = S.parent
MARK = "〔共有の設定〕"
SEP = "／"
TEMPLATES = {
    "戻す": "〔共有の設定〕{設定}は共有の開発環境で全員が使う1件だけの設定なので、書き換える前に今の値を控え、このシードを使うケースが終わるたびに控えた値へ戻す。",
    "手元だけ": "〔共有の設定〕{設定}を書き換えると共有の開発環境を使うほかの人に影響するため、共有の開発環境では行わず手元の環境で行う。",
    "IP": "〔共有の設定〕IP許可リストは1行でも入れるとリストに無い人が全員アクセスできなくなる。リストが空のときは設定しない。空でないときは今の行を残したまま試験端末のIPを1行書き足し、このシードを使うケースが終わったら書き足した行だけを消す。",
    # 2026-10-26 依頼者「設定済みの値を使う」: 共有の認証の秘密値・署名方式は書き換えない
    "API設定済み": "〔共有の設定〕共有の開発環境ではAPIの認証の秘密値・署名方式を書き換えず、環境に設定済みの値を使う（値は環境の管理者から受け取る）。手元の環境では記載の値を設定してよい。試験端末のIPを許可するときは、IP許可リストが空なら設定せず、空でなければ今の行を残したまま1行書き足し、このシードを使うケースが終わったら書き足した行だけを消す。",
    # 2026-10-26: 外部の接続先・資格情報・メール送信先も、API の秘密値の決定（「設定済みの値を使う」）にそろえる
    "設定済み": "〔共有の設定〕共有の開発環境では{設定}を書き換えず、環境に設定済みの値を使う（値は環境の管理者から受け取る）。手元の環境では記載の値を設定してよい。",
    # 2026-10-26 依頼者「終わったら消す」（税率）。足すと全員の一覧・選択肢に出て効くもの（codex R3 で選択肢にも使う）
    "消す": "〔共有の設定〕{設定}は共有の開発環境で全員の一覧や選択肢に出て全員に効くため、このシードを使うケースが終わったら、このシードで足したものを削除する。",
}


def read(p):
    with open(p, encoding="utf-8", newline="") as f:
        rs = [l.rstrip("\n").split("\t") for l in f]
    return rs[0], [r for r in rs[1:] if r and r != [""]]


def write(p, h, rs):
    pathlib.Path(p).write_text("".join("\t".join(r) + "\n" for r in [h] + rs), encoding="utf-8")


def strip_mark(t):
    i = t.find(SEP + MARK)
    if i < 0 and t.startswith(MARK):
        i = 0
    return t if i < 0 else t[:i]


def load(err):
    h, rs = read(S / "decisions.tsv")
    ix = {c: i for i, c in enumerate(h)}
    dec, kinds = {}, {}
    for r in rs:
        sid, kind, setting, add = r[ix["シードID"]], r[ix["判定"]], r[ix["設定"]], r[ix["書き足す文"]]
        if kind in ("変えない", "要相談"):
            if add:
                err.append(f"{sid}: 判定「{kind}」なのに書き足す文がある")
            continue
        if kind not in TEMPLATES:
            err.append(f"{sid}: 判定が不正: {kind!r}")
            continue
        want = TEMPLATES[kind].replace("{設定}", setting)
        if add != want:
            err.append(f"{sid}: 書き足す文が決まった形でない: {add[:50]}")
            continue
        if "\t" in add or "\n" in add:
            err.append(f"{sid}: 書き足す文にタブ・改行がある")
            continue
        kinds.setdefault(sid, [])
        if kind in kinds[sid]:
            err.append(f"{sid}: 同じ判定「{kind}」が2行ある")
        kinds[sid].append(kind)
        dec[sid] = dec[sid] + add if sid in dec else add
    return dec


def main():
    err = []
    dec = load(err)
    if err:
        print("\n".join("  誤り: " + e for e in err))
        return 1
    found, changed, removed = set(), 0, 0
    tables = sorted(glob.glob(str(CG / "cases/*_seed_data.tsv"))) + sorted(glob.glob(str(CG / "excluded_*_seeds.tsv")))
    for p in tables:
        h, rs = read(p)
        si, mi = h.index("シードID"), h.index("投入方法")
        dirty = False
        for r in rs:
            sid = r[si]
            base = strip_mark(r[mi])
            new = base + SEP + dec[sid] if sid in dec else base
            if sid in dec:
                found.add(sid)
            if new != r[mi]:
                if sid not in dec:
                    removed += 1
                else:
                    changed += 1
                r[mi] = new
                dirty = True
        if dirty:
            write(p, h, rs)
    missing = sorted(set(dec) - found)
    for m in missing:
        print(f"  誤り: {m} がシード表にも外した表にも無い")
    print(f"shared_env: 決定 {len(dec)} 件・書き足し/置き換え {changed} 件・書き足しを消した {removed} 件")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
