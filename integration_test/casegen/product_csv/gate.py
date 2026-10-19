#!/usr/bin/env python3
"""担当の書き直し（out/<機能ID>.tsv）の検査。 gate.py [機能ID ...]

機能IDを省くと out/ にある全機能を検査する。不合格が1件でもあれば終了コード1。
apply.py は、この検査に合格した機能だけをケースの正本へ当てる。

検査すること
  G1 入力（in/<機能ID>.tsv）のシードが1行ずつ、同じ順で揃っている。見出しと列数が決まりどおり
  G2 判定が 直す／直さない／直せない のどれか。直すときだけ新しい投入方法がある。直せないときは理由がある
  G3 直したシードは、グッズ商品CSV登録で商品を作っている（カード商品CSV登録は使わない）。アップロードのあとに確認モーダルで確定している
  G4 直したシードに、商品の新規登録の操作（新規の商品登録画面、/admin/product/product/new など）が残っていない。
     「商品を登録」ボタンは編集でも押すので見ない。既存の商品を開かずに商品登録画面で入力しているように読める書き方は参考に出す
  G5 CSV の列を挙げた括弧の中に「任意」「取り込める」のような曖昧な値が無い
  G6 元のシードの呼び名〔…〕が新しい投入方法・状態・属性から消えていない
  G7 元の投入方法の文のうち、商品・規格・カード・CSV に触れない文は、新しい投入方法にそのまま残っている
  G8 取り込んだ商品を商品登録編集画面で「商品を登録」するなら割引率を選んでいる（編集の必須項目。グッズ商品CSVに列が無い）
  G9 CSV の行の基準価格と販売価格が同じ（新しく作る規格はセールフラグ無効で販売価格＝基準価格。M03-09 L0086〜L0087）。違う値が要るなら規格の画面でセールフラグと販売価格を入れる
  G10 新しく書いた文で在庫無制限を入れていない（規格の画面に欄が無い M03-09 L0095・L0097）。在庫は在庫変更CSV登録で入庫し、別のメンバーが承認する
  G11 元が在庫数・在庫無制限を入れていたなら、新しい投入方法に在庫を入れる手順（在庫変更CSV登録など）がある
  G12 新しく書いた在庫変更CSV登録に、承認通知先の所属選択・メンバー選択、仕入単価、「一括登録を実行」がある（M04-21 L0127〜L0135・L0166〜L0168）。
     100以上の増減なら確認モーダルで「OK」を押す（L0056〜L0058）。登録したら承認一覧で承認する
  G13 新しく書いた承認一覧での承認は、「承認する」のあと確認画面で「OK」を押す（M04-32 L0218・L0301）
  参考（不合格にしない）: 新しく増えた呼び名、ケースに影響があると書いた行、スマレジ連携に当たると書いた行
"""
import pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
KINDS = {"直す", "直さない", "直せない"}
# 「商品を登録」ボタンは既存の商品の編集でも押す（M03-02 識別ID 35）ので、ボタン名では判定しない
NEWREG = re.compile(r"product/product/new|商品新規登録|商品の新規登録|商品を新規登録|新規登録状態の商品|商品登録画面（新規）|商品登録編集画面（新規）|新規の商品登録")
# 紛らわしい書き方（既存の商品を開かずに入力しているように読める）。参考として出す
MAYBE = re.compile(r"商品登録(編集)?画面で(、)?(商品名|カード指定|「カード指定)")
VAGUE = re.compile(r"任意|取り込める|登録できる値|有効な値|適当な")
LABEL = re.compile(r"〔[^〔〕]+〕")
TOUCH = re.compile(r"商品|規格|カード|CSV|在庫")


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def clauses(text, key):
    """key の出てくる位置から、次の「。」か、手順番号の前の「／」（「／2.」「／⑤」など）までを返す。
    括弧の中では切らない。CSV の行どうしを区切る「／」でも切らない"""
    out = []
    for m in re.finditer(re.escape(key), text):
        i, depth = m.start(), 0
        while i < len(text):
            ch = text[i]
            depth += {"（": 1, "）": -1}.get(ch, 0)
            if depth <= 0 and (ch == "。" or (ch == "／" and re.match(r"[0-9０-９①-⑳]", text[i + 1:i + 2]))):
                break
            i += 1
        out.append(text[m.start():i])
    return out


def csv_parens(text):
    """「アップロードを確定する（…）」の括弧の中身を返す（入れ子の括弧を数える）"""
    out = []
    for m in re.finditer(r"アップロードを確定する（", text):
        i, depth = m.end(), 1
        while i < len(text) and depth:
            depth += {"（": 1, "）": -1}.get(text[i], 0)
            i += 1
        out.append(text[m.end():i - 1])
    return out


def check(fid):
    err, note = [], []
    ip, op = P / f"in/{fid}.tsv", P / f"out/{fid}.tsv"
    if not op.exists():
        return [f"{fid}: out が無い"], note
    ih, I = rows(ip)
    try:
        oh, O = rows(op)
    except Exception as e:  # noqa
        return [f"{fid}: out を読めない {e}"], note
    if oh != HDR:
        return [f"{fid}: 見出しが違う {oh}"], note
    bad = [r[0] for r in O if len(r) != len(HDR)]
    if bad:
        return [f"{fid}: 列数が違う {bad[:3]}"], note
    if [r[0] for r in O] != [r[0] for r in I]:
        return [f"{fid}: シードの並びが入力と違う（入力 {len(I)}件・出力 {len(O)}件）"], note
    ii = {c: i for i, c in enumerate(ih)}
    for src, r in zip(I, O):
        sid, kind, new, attr, basis, why = r
        old, oattr = src[ii["投入方法"]], src[ii["状態・属性"]]
        w = f"{fid} {sid}"
        if kind not in KINDS:
            err.append(f"G2 {w}: 判定が {kind}")
            continue
        if kind != "直す":
            if new or attr:
                err.append(f"G2 {w}: {kind} なのに新しい投入方法・状態・属性がある")
            if kind == "直せない" and not why.strip():
                err.append(f"G2 {w}: 直せないの理由が無い")
            continue
        if not new.strip() or new == old:
            err.append(f"G2 {w}: 直すのに新しい投入方法が無い・元と同じ")
            continue
        if attr and attr == oattr:
            err.append(f"G2 {w}: 新しい状態・属性が元と同じ（変えないなら空にする）")
        if "グッズ商品CSV登録" not in new:
            err.append(f"G3 {w}: グッズ商品CSV登録で商品を作っていない")
        if "カード商品CSV登録" in new and "カード商品CSV登録" not in old:
            err.append(f"G3 {w}: カード商品CSV登録を使っている（規格の数と価格が割引率の設定で変わるので使わない）")
        # グッズ商品CSVのアップロードは確認モーダルで確定する（M03-27 L0092）。ほかの CSV（カテゴリなど）は数えない
        added_goods = new.count("グッズ商品CSV登録") - old.count("グッズ商品CSV登録")
        added_mods = new.count("確認モーダルでアップロードを確定") - old.count("確認モーダルでアップロードを確定")
        if added_goods > 0 and added_mods < 1:
            err.append(f"G3 {w}: グッズ商品CSVのアップロードを確認モーダルで確定していない")
        if "確定するのは、グッズ商品CSV登録のときだけ" in new:
            err.append(f"G3 {w}: 検査を通すための注記が残っている")
        if not basis.strip():
            err.append(f"G2 {w}: 根拠が無い")
        m = NEWREG.search(new)
        if m:
            err.append(f"G4 {w}: 商品の新規登録の操作が残っている「{m.group(0)}」")
        m = MAYBE.search(new)
        if m:
            note.append(f"新規登録に読める書き方 {w}: 「{new[max(0, m.start() - 30):m.end() + 10]}」")
        for par in csv_parens(new):
            v = VAGUE.search(par)
            if v:
                err.append(f"G5 {w}: CSV の列に曖昧な値「{par[max(0, v.start() - 15):v.end() + 10]}」")
        for par in csv_parens(new):
            if "グッズ" not in new:
                break
            bp = re.findall(r"基準価格(?:は|を|に)?「?(\d+)", par)
            sp = re.findall(r"販売価格(?:は|を|に)?「?(\d+)", par)
            if bp and sp and bp[0] != sp[0] and "セールフラグ" not in new:
                err.append(f"G9 {w}: CSV の基準価格{bp[0]}と販売価格{sp[0]}が違う（新しく作る規格はセールフラグ無効で、販売価格は基準価格になる。違う値が要るなら規格の画面でセールフラグを入れて直す）")
        olds = set(LABEL.findall(old + oattr))
        news = set(LABEL.findall(new + (attr or oattr)))
        lost = olds - news
        if lost:
            err.append(f"G6 {w}: 呼び名が消えた {sorted(lost)[:3]}")
        if news - olds:
            note.append(f"増えた呼び名 {w}: {sorted(news - olds)[:3]}")
        for sent in [s for s in old.split("。") if s.strip()]:
            if not TOUCH.search(sent) and sent not in new:
                err.append(f"G7 {w}: 商品に触れない文が変わった・消えた「{sent[:40]}」")
        if "商品を登録」" in new and "割引率" not in new:
            err.append(f"G8 {w}: 商品登録編集画面で「商品を登録」を押すのに割引率を選んでいない（グッズ商品CSVに割引率の列が無く、編集では必須）")
        # 規格の画面に在庫数・在庫無制限の入力欄は無い（M03-09 L0095・L0097、Excel の画面項目。ee の編集画面も在庫数を表示するだけ）
        old_sents = set(s for s in old.split("。"))
        for sent in [s for s in new.split("。") if s and s not in old_sents]:
            if re.search(r"在庫(数)?無制限", sent) and not re.search(r"在庫変更CSV登録|在庫編集画面|承認", sent):
                err.append(f"G10 {w}: 規格の画面などで在庫無制限を入れている（入力欄が無い。在庫変更CSV登録で入庫し承認する）「{sent[:50]}」")
                break
        # 元が在庫数・在庫無制限を入れていたのに、在庫を入れる手順が無い（CSV で作る規格は在庫0。M03-27 L0129）
        if re.search(r"在庫(数)?無制限|在庫数(に|を|は)?「?[1-9]", old) and not re.search(r"在庫変更CSV登録|在庫編集|在庫一括編集|在庫(数)?を(DB|ＤＢ)|DB[^。]{0,30}在庫|在庫[^。]{0,40}DB", new):
            err.append(f"G11 {w}: 元は在庫数・在庫無制限を入れていたが、新しい投入方法に在庫を入れる手順が無い")
        # 新しく書いた在庫変更CSV登録と承認の型（2巡目 J1〜J3 の指摘。元のシードにあった句は見ない）
        regs = [c for c in clauses(new, "在庫変更CSV登録画面") if c not in old]
        for c in regs:
            lack = [k for k in ("承認通知先（所属選択）", "承認通知先（メンバー選択）", "仕入単価", "「一括登録を実行」") if k not in c]
            if lack:
                err.append(f"G12 {w}: 在庫変更CSV登録に {'・'.join(lack)} が無い（M04-21 L0127〜L0135・L0166〜L0168）「{c[:40]}」")
            if any(abs(int(q)) >= 100 for q in re.findall(r"在庫増減数「?(-?\d+)", c)) and "確認モーダルで「OK」" not in c:
                err.append(f"G12 {w}: 100以上の増減なのに、一括登録のあと確認モーダルで「OK」を押していない（M04-21 L0056〜L0058）「{c[:40]}」")
        if regs and "承認一覧" not in new:
            err.append(f"G12 {w}: 在庫変更CSV登録のあと承認していない（承認されるまで在庫に入らない。M04-21 L0071〜L0072、M04-32 L0112）")
        for c in clauses(new, "承認一覧"):
            if c in old or "承認" not in c[3:]:
                continue
            if "確認画面で「OK」を押" not in c:
                err.append(f"G13 {w}: 承認一覧で承認したあと、確認画面で「OK」を押していない（M04-32 L0218・L0301）「{c[:40]}」")
        if "ケースに影響" in why:
            note.append(f"ケースに影響 {w}")
        if "スマレジ連携" in why:
            note.append(f"スマレジ連携 {w}")
    return err, note


def main(argv):
    fids = argv or sorted(p.stem for p in (P / "out").glob("*.tsv"))
    bad = 0
    for fid in fids:
        err, note = check(fid)
        k = {}
        if not err and (P / f"out/{fid}.tsv").exists():
            for r in rows(P / f"out/{fid}.tsv")[1]:
                k[r[1]] = k.get(r[1], 0) + 1
        print(f"{fid}\t{'合格' if not err else '不合格'}\t{k}")
        for e in err[:40]:
            print("  ", e)
        if len(err) > 40:
            print(f"   ほか {len(err) - 40}件")
        for n in note:
            print("   参考:", n)
        bad += bool(err)
    print(f"合格 {len(fids) - bad} / {len(fids)}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
