#!/usr/bin/env python3
"""2巡目（review/J1〜J3）の指摘の直し。out/<機能ID>.tsv を書き直す。何度流しても同じ。

書き直しで新しく書いた入庫と承認の文を、設計書どおりの型にそろえる（元のシードにあった文は変えない）。
  - 在庫変更CSV登録の承認通知先は、所属選択とメンバー選択の両方を選ぶ（M04-21 L0131・L0132 どちらも必須）
  - 1つの規格で100以上の増減があるときは、「一括登録を実行」のあと確認モーダルで「OK」を押す（M04-21 L0056〜L0058）
  - 承認一覧で「承認する」を押したあと、確認画面で「OK」を押す（M04-32 L0218・L0301）
  - 型から外れていた書き方（M05-10 の「取り込む」だけ、M05-02 の「一括承認して承認する」、F03-01 の「承認一覧で承認する」）は型で書き直す
個別の直し: J1-1 M12-07 DATA-003、J1-2 A06-03 AB-PRODUCT、J2-2 F04-04 INSTORE・F04-02 STORE-CARTS-020/SMAREGI-051、J3-3 M05-10 STORES-001。
直した内容は work/fix_stock_log.tsv に書く。
"""
import pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

A21 = "（M04-21 L0127〜L0135・L0166〜L0168）"
A21_OK = "（M04-21 L0056〜L0058・L0127〜L0135・L0166〜L0168）"
A32 = "（M04-32 L0108・L0110・L0141・L0297）"
A32_OK = "（M04-32 L0108・L0110・L0141・L0218・L0297・L0301）"
OK_APPROVE = "表示された確認画面で「OK」を押す"
BASIS_ADD = "M04-21 L0056〜L0058・L0131・L0132、M04-32 L0218・L0301"


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def originals():
    h, R = rows(P / "targets.tsv")
    i, j = h.index("シードID"), h.index("元の投入方法")
    return {r[i]: r[j] for r in R}


def sentences(text):
    """「。」で切る（「。」は前の文に付けたまま）。括弧の中の「。」では切らない"""
    out, buf, depth = [], "", 0
    for ch in text:
        buf += ch
        depth += {"（": 1, "）": -1}.get(ch, 0)
        if ch == "。" and depth <= 0:
            out.append(buf)
            buf = ""
    if buf:
        out.append(buf)
    return out


def is_old(sent, old):
    s = re.sub(r"^(続けて、|次に、)", "", sent.strip()).rstrip("。")
    return bool(s) and s in old


# ---- 型の直し（新しく書いた文だけに当てる）----

def fix_notice(s):
    """承認通知先は所属選択とメンバー選択の両方を選ぶ"""
    s = s.replace("承認通知先にM05-01試験管理者を選び",
                  "承認通知先（所属選択）でM05-01試験管理者の所属を選び、承認通知先（メンバー選択）でM05-01試験管理者を選び")
    s = re.sub(r"承認通知先に(承認するメンバー(?:（[^（）]*）)?)を選び",
               r"承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で\1を選び", s)
    s = s.replace("承認通知先（所属選択・メンバー選択）に承認できるメンバーを入れ",
                  "承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で承認するメンバーを選び")
    return s


def fix_modal(s):
    """1つの規格で100以上の増減があれば、一括登録のあと確認モーダルで OK を押す"""
    if "「一括登録を実行」を押す" not in s:
        return s
    qs = [abs(int(q)) for q in re.findall(r"在庫増減数「?(-?\d+)", s)]
    if not any(q >= 100 for q in qs):
        return s
    s = s.replace("「一括登録を実行」を押す", "「一括登録を実行」を押し、表示された確認モーダルで「OK」を押す")
    return s.replace(A21, A21_OK)


def fix_approve(s):
    """承認一覧で「承認する」を押したあと、確認画面で OK を押す"""
    s = s.replace("確認モーダルで「承認する」を押す", "確認モーダルで「承認する」を押し、" + OK_APPROVE)
    s = s.replace(A32, A32_OK)
    # M05-09: 在庫編集の承認
    s = s.replace("確認で「承認する」を押し、", "表示された確認モーダルで「承認する」を押し、表示された確認画面で「OK」を押し、")
    # F10-03: 承認一覧で在庫編集を開いて承認する
    s = re.sub(r"の在庫編集を開いて「承認する」を押す(?!し)", "の在庫編集を開いて「承認する」を押し、" + OK_APPROVE, s)
    # F03-01
    s = s.replace("その別の管理者が在庫編集承認一覧で承認する",
                  "その別の管理者で在庫編集承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、"
                  "表示された確認モーダルで「承認する」を押し、" + OK_APPROVE)
    # M05-02
    s = re.sub(r"在庫編集承認一覧画面で(これらの行|その行)を選び一括承認ボタンを押して承認する",
               "在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて"
               "「一括承認」を押し、表示された確認モーダルで「承認する」を押し、" + OK_APPROVE + A32_OK, s)
    s = s.replace("在庫変動理由に任意の文字、承認通知先（所属選択）", "在庫変動理由に「シード作成」、承認通知先（所属選択）")
    return s


# ---- M05-10: 「在庫増減数に10を入れたCSVを取り込む」だけだったものを型で書く ----

M0510 = re.compile(r"在庫変更CSV登録画面で、商品コード((?:「[^」]+」)+)それぞれの在庫増減数に10を入れたCSVを取り込む。")


def m0510_reg(store, codes):
    lines = "／".join(f"商品コード「{c}」・在庫増減数「10」・仕入単価「100」" for c in codes)
    return (f"在庫変更CSV登録画面で、店舗に「{store}」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、"
            f"承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で承認するメンバーを選び、"
            f"{lines}の{len(codes)}行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す{A21}。")


def m0510_approve(stores, n):
    target = "この申請の行" if n == 1 else f"この{n}件の申請（{'・'.join(stores)}）の行"
    return (f"在庫を登録したメンバーとは別の、{'と'.join(stores)}の承認権限を持つメンバーで承認一覧を開き、{target}にチェックを入れて"
            f"「一括承認」を押し、表示された確認モーダルで「承認する」を押し、{OK_APPROVE}{A32_OK}。")


def fix_m0510(sid, new):
    m = M0510.search(new)
    if not m:
        return new
    codes = re.findall(r"「([^」]+)」", m.group(1))
    # 元のシードは「本店の管理者」「支店の管理者」で商品を作り分けていた。支店で買うのは STORES-001 の支店用と SORTBRANCH-026
    if sid == "S-M05-10-STORES-001":
        hq = [c for c in codes if not c.endswith("-S")]
        br = [c for c in codes if c.endswith("-S")]
        rep = m0510_reg("本店", hq) + m0510_reg("支店", br) + m0510_approve(["本店", "支店"], 2)
    elif sid == "S-M05-10-SORTBRANCH-026":
        rep = m0510_reg("支店", codes) + m0510_approve(["支店"], 1)
    else:
        rep = m0510_reg("本店", codes) + m0510_approve(["本店"], 1)
    return new[:m.start()] + rep + new[m.end():]


# ---- 個別の直し ----

A0603_MEMBER = ("在庫の承認に使うメンバーを、管理者「A06-03 AB試験担当」で作る。管理画面のメンバー管理で「新規登録」を押し、"
                "メンバー登録画面で名前に「A06-03 AB承認担当」、所属店舗に「A06-03 AB試験店舗」、所属に「東京店」、"
                "ログインIDに「a0603abapr」、メールアドレスに「a0603abapr@example.com」、パスワードとパスワード(確認)に「Passw0rd-A0603APR」、"
                "権限グループに承認権限を紐づけた権限グループ（権限管理画面で承認権限にチェックが入っている権限グループ）、"
                "編集可能店舗に「A06-03 AB試験店舗」、稼働に「稼働」を入れて「登録」ボタンを押す（M11-03 L0086〜L0089、M04-32 L0108・L0110）。")


def fix_rows(sid, new):
    if sid == "S-A06-03-AB-PRODUCT":
        new = new.replace("承認通知先に承認するメンバー（A06-03試験管理者。S-A06-03-ADM）を選び",
                          "承認通知先（所属選択）で「東京店」を選び、承認通知先（メンバー選択）で「A06-03 AB承認担当」を選び")
        new = new.replace("在庫を登録したメンバーとは別のA06-03試験管理者（S-A06-03-ADM）で承認一覧を開き",
                          "「A06-03 AB承認担当」で管理画面にログインし直して承認一覧を開き")
        if A0603_MEMBER not in new:
            i = new.find("在庫変更CSV登録画面で、店舗に「A06-03 AB試験店舗」")
            if i >= 0:
                new = new[:i] + A0603_MEMBER + new[i:]
    elif sid == "S-M12-07-DATA-003":
        new = new.replace("在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて",
                          "在庫を登録したメンバーとは別の、本店と支店の承認権限を持つメンバーで承認一覧を開き、この2件の申請（本店・支店）の行にチェックを入れて")
    elif sid in ("S-F04-04-INSTORE-023", "S-F04-04-INSTORE-024", "S-F04-04-INSTORE-026", "S-F04-04-INSTORE-028"):
        # 注文店舗は TC東京（ケースの事前準備・シードの状態・属性）
        new = new.replace("在庫変更CSV登録画面で、店舗に「オンラインショップ」", "在庫変更CSV登録画面で、店舗に「TC東京」")
    elif sid == "S-F04-02-STORE-CARTS-020":
        # 本店カートの商品は本店、TC大阪カートの商品は TC大阪
        out = []
        for s in sentences(new):
            if "F0402-TOKYO-020" in s and "在庫変更CSV登録画面" in s:
                s = s.replace("店舗に「TC大阪」", "店舗に「本店」")
            out.append(s)
        new = "".join(out)
    elif sid == "S-F04-02-SMAREGI-051":
        # 支店の店舗ページで買う（元のシードも支店を名指ししていない）
        new = new.replace("在庫変更CSV登録画面で、店舗に「本店」、",
                          "在庫変更CSV登録画面で、店舗に下で商品をカートに入れる支店（フロントの支店の店舗ページの店舗）、")
    elif sid == "S-M05-10-STORES-001":
        new = new.replace("（支店用の1件は支店の商品公開ステータスを1（公開）にし、本店用の2件は0（非公開）にする）", "")
    elif sid.startswith("S-M05-23-"):
        # J2-2 と同じ型。注文は本店のフロントで受ける（状態・属性の受注店舗=本店）。TC東京はケースにもシードにも出てこない
        new = new.replace("在庫変更CSV登録画面で、店舗に「TC東京」", "在庫変更CSV登録画面で、店舗に「本店」")
    return new


def fix(sid, new, old):
    new = fix_rows(sid, new)
    new = fix_m0510(sid, new)
    out = []
    for s in sentences(new):
        if not is_old(s, old):
            s = fix_approve(fix_modal(fix_notice(s)))
        out.append(s)
    return "".join(out)


def main():
    O = originals()
    log = [["機能ID", "シードID", "直し"]]
    changed = 0
    for op in sorted((P / "out").glob("*.tsv")):
        h, R = rows(op)
        assert h == HDR, op
        dirty = False
        for r in R:
            if r[1] != "直す":
                continue
            new = fix(r[0], r[2], O[r[0]])
            if new != r[2]:
                kinds = []
                if "承認通知先（所属選択）" in new and "承認通知先（所属選択）" not in r[2]:
                    kinds.append("所属選択")
                if new.count("確認モーダルで「OK」") > r[2].count("確認モーダルで「OK」"):
                    kinds.append("登録の確認モーダル")
                if new.count(OK_APPROVE) > r[2].count(OK_APPROVE):
                    kinds.append("承認の確認画面")
                if r[0].startswith("S-M05-10-") and "在庫増減数に10を入れたCSVを取り込む" in r[2]:
                    kinds.append("M05-10 入庫の型")
                if r[0] in ("S-A06-03-AB-PRODUCT", "S-M12-07-DATA-003", "S-F04-04-INSTORE-023", "S-F04-04-INSTORE-024",
                            "S-F04-04-INSTORE-026", "S-F04-04-INSTORE-028", "S-F04-02-STORE-CARTS-020",
                            "S-F04-02-SMAREGI-051", "S-M05-10-STORES-001"):
                    kinds.append("個別")
                log.append([op.stem, r[0], "・".join(kinds)])
                r[2] = new
                if BASIS_ADD not in r[4]:
                    r[4] = r[4] + "、" + BASIS_ADD
                if r[0] == "S-A06-03-AB-PRODUCT" and "M11-03 L0086〜L0089" not in r[4]:
                    r[4] = r[4] + "、M11-03 L0086〜L0089"
                dirty = True
                changed += 1
        if dirty:
            assert all("\t" not in c and "\n" not in c for r in R for c in r)
            op.write_text("\n".join("\t".join(x) for x in [h] + R) + "\n", encoding="utf-8")
    if changed:
        lp = P / "work/fix_stock_log.tsv"
        body = log if not lp.exists() else log[1:]
        with open(lp, "a", encoding="utf-8") as f:
            f.write("\n".join("\t".join(x) for x in body) + "\n")
    print(f"直した行 {changed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
