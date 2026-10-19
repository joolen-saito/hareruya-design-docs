#!/usr/bin/env python3
"""書かれたとおりに実行できるようにする直し（kept・fix2・env の out/）の検査。 gate.py [kept|fix2|fix3|env] [ファイル名 ...]

ファイル名は in/ の名前（例 F10-03、B16-10@2）。省くと out/ にある全ファイル。不合格が1件でもあれば終了コード1。
apply.py は、この検査に合格したファイルだけを当てる。env を検査すると、戻るケースの一覧 env/restored.tsv を作り直す。

kept・fix2（ケース一覧にある・戻るケースの直し。fix2 は kept の後に当てる2回目）
  K1 入力の行が1行ずつ同じ順で揃っている。見出し・列数
  K2 判定は 直す／直さない／直せない。直すなら新しい文があり今の文と違う。直さない・直せないなら新しい文は空で理由がある
  K3 直した文に「未確定」「未整備」が無い
  K4 項目「商品」: 商品の新規登録の操作が残っていない。グッズ商品CSVのアップロードを確認モーダルで確定している。
     「商品を登録」するなら割引率を選んでいる。CSV の列に曖昧な値が無い。規格の画面で在庫無制限を入れていない
  K5 項目「控えた番号」: 固定の番号（F10-03 の 9100…、M13-02 の管理者ID 1302）が消えている。
     ケースで使う呼び名〔…〕が、同じ機能のシードの状態・属性か投入方法（直した後）で定義されている。
     期待結果は呼び名の置き換えだけ（呼び名と番号を除いた文が元とほぼ同じ）
  K6 項目「割引率」「規約同意」「確認モーダル」「在庫の承認」だけの行は、書き足しだけ（元の文から削った文字が20字以下）。
     在庫の承認: 承認通知先・承認一覧・確認画面の「OK」がある。在庫無制限: 規格の画面でチェックを入れる書き方が残っていない。
     割引率: 「商品を登録」の前に割引率を選ぶ。規約同意: 「ネット買取規約同意」にチェックし、モーダルの「申込み」を押す。
     確認モーダル: 「確認モーダルでアップロードを確定」が元より増えている（グッズ商品CSVのアップロードごとに1つ。数の過不足はレビューで見る）
  K7 呼び名〔…〕が消えていない
  K8 物理名（dtb_・mtb_ などのテーブル名、英小文字の下線つき識別子）を新しく書いていない
  K9 ケースの期待結果を変えるのは項目「控えた番号」だけ
env（外したケースを止めている項目）
  E1 入力の項目が1行ずつ同じ順で揃っている。見出し・列数
  E2 判定は 環境で解消／解消しない。区分は決まった語。環境で解消なら区分はバッチ・外部の試験環境・メールだけ
  E3 環境で解消のシード: 新しい投入方法があり、「未確定」「未整備」が無く、中継・模擬・時刻の固定・障害の起こし方を使わない。
     商品の新規登録の操作が無い。呼び名が消えていない。物理名を新しく書いていない
  E4 環境で解消の前提: 新しい投入方法の欄に、どう用意するか（解消の書き方）がある
  E5 解消しないなら理由がある
"""
import csv, difflib, glob, pathlib, re, sys, collections

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
csv.field_size_limit(10**9)
KEPT_OUT = ["種別", "対象ID", "列", "判定", "新しい文", "根拠", "理由"]
ENV_OUT = ["種別", "対象ID", "判定", "区分", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
KINDS = {"直す", "直さない", "直せない"}
ENV_KINDS = {"環境で解消", "解消しない"}
ENV_OK = {"バッチ", "外部の試験環境", "メール"}
ENV_CATS = ENV_OK | {"中継・模擬", "時刻", "障害", "作り方", "設計", "分離", "その他"}
UNS = re.compile(r"未確定|未整備")
NEWREG = re.compile(r"product/product/new|商品新規登録|商品の新規登録|商品を新規登録|新規登録状態の商品|商品登録画面（新規）|商品登録編集画面（新規）|新規の商品登録")
VAGUE = re.compile(r"任意|取り込める|登録できる値|有効な値|適当な")
LABEL = re.compile(r"〔[^〔〕]+〕")
PHYS = re.compile(r"(?<![A-Za-z0-9_.@/-])[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?![A-Za-z0-9_@])")  # 英小文字の下線つき識別子（dtb_・mtb_ のテーブル名・列名など）
NOINFRA = re.compile(r"中継|模擬|スタブ|モック|保留して転送|保留・転送|時刻を固定|時計を|日時を固定|業務日を固定|障害を起こ|停止させ|タイムアウトさせ|異常応答")
FIXED = {"F10-03": re.compile(r"(?<![\d〔-])9100\d{5}(?!\d)"), "M13-02": re.compile(r"管理者ID ?1302(?!\d)")}


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def dicts(p):
    h, rs = rows(p)
    return h, [dict(zip(h, r)) for r in rs]


def deleted_chars(old, new):
    sm = difflib.SequenceMatcher(None, old, new, autojunk=False)
    return sum(i2 - i1 for op, i1, i2, _, _ in sm.get_opcodes() if op in ("delete", "replace"))


def csv_parens(text):
    out = []
    for m in re.finditer(r"アップロードを確定する（", text):
        i, depth = m.end(), 1
        while i < len(text) and depth:
            depth += {"（": 1, "）": -1}.get(text[i], 0)
            i += 1
        out.append(text[m.end():i - 1])
    return out


def split_cats(v):
    """区分を語に分ける。「中継・模擬」は1語（中の「・」で割らない）"""
    v = v.replace("中継・模擬", "\0")
    return {c.replace("\0", "中継・模擬") for c in v.split("・") if c}


def new_phys(old, new):
    return sorted(set(PHYS.findall(new)) - set(PHYS.findall(old)))


def product_checks(w, old, new, err):
    old_sents = set(old.split("。"))
    # 元からある説明の語句（「商品の新規登録は…できないためCSV登録で作る」など）は数えない。新しく増えたものだけ誤り
    if len(NEWREG.findall(new)) > len(NEWREG.findall(old)):
        err.append(f"K4 {w}: 商品の新規登録の操作を書いている「{NEWREG.search(new).group(0)}」")
    if "グッズ商品CSV" in new and "アップロード" in new and not re.search(r"確認モーダルでアップロードを確定", new):
        err.append(f"K4 {w}: グッズ商品CSVのアップロードを確認モーダルで確定していない（M03-27 L0092）")
    if "商品を登録」" in new and "割引率" not in new:
        err.append(f"K4 {w}: 「商品を登録」するのに割引率を選んでいない（編集の必須項目）")
    for par in csv_parens(new):
        v = VAGUE.search(par)
        if v:
            err.append(f"K4 {w}: CSV の列に曖昧な値「{par[max(0, v.start() - 15):v.end() + 10]}」")
    for sent in [s for s in new.split("。") if s and s not in old_sents]:
        if re.search(r"在庫(数)?無制限", sent) and not re.search(r"在庫変更CSV登録|在庫編集画面|承認|DB", sent):
            err.append(f"K4 {w}: 規格の画面などで在庫無制限を入れている「{sent[:50]}」")
            break


def seed_texts(fid):
    """機能のシード表（cases/ と外したシード）の 状態・属性＋投入方法 を返す"""
    out = {}
    p = CG / f"cases/{fid}_seed_data.tsv"
    if p.exists():
        for r in dicts(p)[1]:
            out[r["シードID"]] = r["状態・属性"] + "／" + r["投入方法"]
    for r in dicts(CG / "excluded_open_seeds.tsv")[1]:
        if r["機能ID"] == fid:
            out.setdefault(r["シードID"], r["状態・属性"] + "／" + r["投入方法"])
    # env・kept の直しで書いた文も、呼び名の定義として数える（fix2 は1回目の直しを重ねた文に対する2回目）
    for p in sorted((R / "env/out").glob("*.tsv")):
        for r in dicts(p)[1]:
            if r["種別"] == "シード" and r["対象ID"] in out and r["判定"] == "環境で解消":
                out[r["対象ID"]] += "／" + r["新しい状態・属性"] + "／" + r["新しい投入方法"]
    for kind in ("kept", "fix2", "fix3"):
        for p in sorted((R / f"{kind}/out").glob("*.tsv")):
            for r in dicts(p)[1]:
                if r["種別"] == "シード" and r["対象ID"] in out and r["判定"] == "直す":
                    out[r["対象ID"]] += "／" + r["新しい文"]
    return out


def check_fix(kind, name):
    err, note = [], []
    ip, op = R / f"{kind}/in/{name}.tsv", R / f"{kind}/out/{name}.tsv"
    if not op.exists():
        return [f"{name}: out が無い"], note
    ih, I = dicts(ip)
    try:
        oh, O = rows(op)
    except Exception as e:  # noqa
        return [f"{name}: out を読めない {e}"], note
    if oh != KEPT_OUT:
        return [f"K1 {name}: 見出しが違う {oh}"], note
    if [r for r in O if len(r) != len(KEPT_OUT)]:
        return [f"K1 {name}: 列数が違う行がある"], note
    O = [dict(zip(KEPT_OUT, r)) for r in O]
    if [(r["種別"], r["対象ID"], r["列"]) for r in O] != [(r["種別"], r["対象ID"], r["列"]) for r in I]:
        return [f"K1 {name}: 行の並びが入力と違う（入力 {len(I)}・出力 {len(O)}）"], note
    fid = name.split("@")[0]
    sdef = seed_texts(fid)
    for src, r in zip(I, O):
        sid, col = src["対象ID"], src["列"]
        if r["種別"] == "シード":
            sdef[sid] = sdef.get(sid, "") + "／" + (r["新しい文"] if r["判定"] == "直す" else "")
    for src, r in zip(I, O):
        w, old, new, items = f"{name} {src['対象ID']} {src['列']}", src["今の文"], r["新しい文"], set(src["項目"].split(","))
        if r["判定"] not in KINDS:
            err.append(f"K2 {w}: 判定が {r['判定']}"); continue
        if r["判定"] != "直す":
            if new:
                err.append(f"K2 {w}: {r['判定']} なのに新しい文がある")
            if not r["理由"].strip():
                err.append(f"K2 {w}: {r['判定']} の理由が無い")
            continue
        if not new.strip() or new == old:
            err.append(f"K2 {w}: 直すのに新しい文が無い・元と同じ"); continue
        if not r["根拠"].strip():
            err.append(f"K2 {w}: 根拠が無い")
        if UNS.search(new) and not UNS.search(old):
            err.append(f"K3 {w}: 直した文に未確定・未整備がある")
        if "商品" in items:
            product_checks(w, old, new, err)
            if "product_csv で直せない" in src["手がかり"] and "グッズ商品CSV登録" not in new:
                err.append(f"K4 {w}: 商品をグッズ商品CSV登録で作っていない（商品登録画面の新規は使えない）")
        if "控えた番号" in items:
            fx = FIXED.get(fid)
            if fx and fx.search(new):
                err.append(f"K5 {w}: 固定の番号が残っている「{fx.search(new).group(0)}」")
            if src["種別"] == "ケース":
                for lb in set(LABEL.findall(new)) - set(LABEL.findall(old)):
                    if not any(lb in t for t in sdef.values()):
                        err.append(f"K5 {w}: 呼び名 {lb} がシードで定義されていない")
                if src["列"] == "期待結果":
                    # 呼び名と固定の番号を同じ記号に置き換えて比べる（番号だけを置き換え、「管理者ID」などの語は残す）
                    num = re.compile(r"(?<![\d〔-])\d{6,}(?!\d)")
                    a = num.sub("#", LABEL.sub("#", new))
                    b = num.sub("#", LABEL.sub("#", re.sub(r"(管理者ID ?)1302(?!\d)", r"\1#", old)))
                    if difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() < 0.9:
                        err.append(f"K5 {w}: 期待結果が呼び名の置き換え以上に変わっている")
        if "在庫の承認" in items and not ("承認一覧" in new and "確認画面で「OK」" in new and "承認通知先" in new):
            err.append(f"K6 {w}: 在庫変更CSV登録のあとの承認（承認通知先・承認一覧・確認画面の「OK」）が無い（M04-21 L0131〜L0132、M04-32 L0218・L0301）")
        if "在庫無制限" in items:
            for sent in new.split("。"):
                if re.search(r"在庫(数)?無制限", sent) and re.search(r"規格", sent) and re.search(r"チェック", sent) and not re.search(r"DB|在庫変更CSV登録", sent):
                    err.append(f"K6 {w}: 規格の画面で在庫無制限にチェックを入れる書き方が残っている「{sent[:50]}」")
                    break
        if items <= {"割引率", "規約同意", "確認モーダル", "在庫の承認"}:
            dc = deleted_chars(old, new)
            if dc > 20:
                err.append(f"K6 {w}: 書き足しのはずが元の文を{dc}字削っている")
        if "割引率" in items and "割引率" not in new:
            err.append(f"K6 {w}: 割引率を選んでいない")
        if "規約同意" in items and ("ネット買取規約同意" not in new or not re.search(r"モーダルの「申込み」", new)):
            err.append(f"K6 {w}: 「ネット買取規約同意」のチェックか、モーダルの「申込み」が無い")
        if "確認モーダル" in items and len(re.findall(r"確認モーダルでアップロードを確定", new)) <= len(re.findall(r"確認モーダルでアップロードを確定", old)):
            err.append(f"K6 {w}: グッズ商品CSVのアップロードを確認モーダルで確定する操作を足していない（「確認モーダルでアップロードを確定」と書く）")
        lost = set(LABEL.findall(old)) - set(LABEL.findall(new))
        if lost and "控えた番号" not in items:
            err.append(f"K7 {w}: 呼び名が消えた {sorted(lost)[:3]}")
        ph = new_phys(old, new)
        if ph:
            err.append(f"K8 {w}: 物理名を書いている {ph[:3]}")
        if src["種別"] == "ケース" and src["列"] == "期待結果" and "控えた番号" not in items:
            err.append(f"K9 {w}: 期待結果を変えている（控えた番号の置き換え以外は変えない）")
    return err, note


def check_env(name):
    err, note = [], []
    ip, op = R / f"env/in/{name}.tsv", R / f"env/out/{name}.tsv"
    if not op.exists():
        return [f"{name}: out が無い"], note
    ih, I = dicts(ip)
    try:
        oh, O = rows(op)
    except Exception as e:  # noqa
        return [f"{name}: out を読めない {e}"], note
    if oh != ENV_OUT:
        return [f"E1 {name}: 見出しが違う {oh}"], note
    if [r for r in O if len(r) != len(ENV_OUT)]:
        return [f"E1 {name}: 列数が違う行がある"], note
    O = [dict(zip(ENV_OUT, r)) for r in O]
    if [(r["種別"], r["対象ID"]) for r in O] != [(r["種別"], r["対象ID"]) for r in I]:
        return [f"E1 {name}: 項目の並びが入力と違う（入力 {len(I)}・出力 {len(O)}）"], note
    for src, r in zip(I, O):
        w = f"{name} {src['対象ID']}"
        cats = split_cats(r["区分"])
        if r["判定"] not in ENV_KINDS:
            err.append(f"E2 {w}: 判定が {r['判定']}"); continue
        if not cats or not cats <= ENV_CATS:
            err.append(f"E2 {w}: 区分が決まった語でない {r['区分']}")
        if r["判定"] == "解消しない":
            if not r["理由"].strip():
                err.append(f"E5 {w}: 解消しないの理由が無い")
            if r["新しい投入方法"] or r["新しい状態・属性"]:
                err.append(f"E5 {w}: 解消しないのに新しい文がある")
            if cats and cats <= ENV_OK:
                err.append(f"E2 {w}: 解消しないのに区分が環境（{r['区分']}）だけ")
            continue
        if not cats <= ENV_OK:
            err.append(f"E2 {w}: 環境で解消なのに区分に {'・'.join(sorted(cats - ENV_OK))} がある")
        new, old = r["新しい投入方法"], src["今の文"]
        if not new.strip():
            err.append(f"E3 {w}: 新しい投入方法（前提は解消の書き方）が無い"); continue
        if not r["根拠"].strip():
            err.append(f"E3 {w}: 根拠が無い")
        if src["種別"] == "シード":
            if UNS.search(new) or UNS.search(r["新しい状態・属性"]):
                err.append(f"E3 {w}: 新しい文に未確定・未整備が残っている")
            m = NOINFRA.search(new)
            if m:
                err.append(f"E3 {w}: 用意しない手段を使っている「{m.group(0)}」")
            product_checks(w, old, new, err)
            lost = set(LABEL.findall(old + src["状態・属性"])) - set(LABEL.findall(new + (r["新しい状態・属性"] or src["状態・属性"])))
            if lost:
                err.append(f"E3 {w}: 呼び名が消えた {sorted(lost)[:3]}")
            ph = new_phys(old + src["状態・属性"], new + r["新しい状態・属性"])
            if ph:
                err.append(f"E3 {w}: 物理名を書いている {ph[:3]}")
    return err, note


def restored():
    """env/out（合格のもの）で、止めている項目がすべて環境で解消する外したケース"""
    ok = {}
    for op in sorted((R / "env/out").glob("*.tsv")):
        e, _ = check_env(op.stem)
        if e:
            continue
        for r in dicts(op)[1]:
            ok[r["対象ID"]] = r["判定"] == "環境で解消"
    back, stay = [], 0
    for cp in sorted((R / "env/in").glob("*_cases.tsv")):
        for c in dicts(cp)[1]:
            items = [x for x in c["止めている項目"].split(",") if x]
            if items and all(ok.get(x) for x in items):
                back.append({"テストID": c["テストID"], "止めていた項目": c["止めている項目"]})
            else:
                stay += 1
    p = R / "env/restored.tsv"
    p.write_text("".join("\t".join(x) + "\n" for x in [["テストID", "止めていた項目"]] + [[b["テストID"], b["止めていた項目"]] for b in back]), encoding="utf-8")
    return len(back), stay


def main(argv):
    kind = argv[0] if argv and argv[0] in ("kept", "fix2", "fix3", "env") else None
    kinds = [kind] if kind else ["kept", "fix2", "fix3", "env"]
    names = argv[1:] if kind else []
    bad = tot = 0
    for k in kinds:
        ns = names or sorted(p.stem for p in (R / f"{k}/out").glob("*.tsv"))
        for n in ns:
            err, note = (check_env(n) if k == "env" else check_fix(k, n))
            tot += 1
            print(f"{k}/{n}\t{'合格' if not err else '不合格'}")
            for e in err[:40]:
                print("  ", e)
            if len(err) > 40:
                print(f"   ほか {len(err) - 40}件")
            for x in note:
                print("   参考:", x)
            bad += bool(err)
        if k == "env" and not names:
            b, s = restored()
            print(f"戻るケース {b}件（外したまま {s}件）→ env/restored.tsv")
    print(f"合格 {tot - bad} / {tot}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
