import re, pathlib
R = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable")
NAMES = "M03-01 M03-11 M03-13 M03-17 M03-22 M04-21 M04-23 M04-31 M05-11 M05-18 M05-26 M07-03 M08-05 M08-09 M10-04 M14-04 M14-05 M14-10".split()
DISC = "割引率を販売割引率に登録済みのものから選び、"
INV = ("在庫変更CSV登録画面で店舗に本店を選び、在庫区分にEC-CUBE、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」、"
       "承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で承認するメンバーを選び、"
       "商品コード「{code}」・在庫増減数{qty}・仕入単価100の1行を書いたCSVをファイル選択で選んで「一括登録を実行」を押す（M04-21 L0127〜L0135・L0166〜L0168）。"
       "在庫を登録したメンバー（{reg}）とは別の、その店舗の承認権限を持つメンバー（{app}）で承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押し、表示された確認画面で「OK」を押す（M04-32 L0108・L0110・L0141・L0218・L0297・L0301）。")
INVCFG = {
 "M08-05": ("ポイント付与用管理者(QH)", "M08-05試験管理者"),
 "M08-09": ("配送先編集用管理者(QH)", "M08-09試験管理者"),
 "M10-04": ("M10-04連携試験管理者（支払方法設定を操作する者。ログインIDはm1004qjadmin）", "M10-04連携試験管理者（基本情報設定と商品管理を操作できる者。ログインIDはm1004l-admin）"),
}
DBSTOCK = "DBで、この商品の規格の在庫無制限を有効にする（規格の画面に在庫無制限の入力欄が無いため）。"
UPL = "管理画面のグッズ商品CSV登録画面でそのファイルを選んで取り込む。"
UPLN = "管理画面のグッズ商品CSV登録画面でそのファイルをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する。"
STK = "商品規格登録編集画面でその商品の規格を開き、在庫無制限にチェックを入れて登録ボタンを押す。"
PUB = "商品編集画面でその商品の商品公開ステータスを「公開」にして登録する。"
PUBN = "商品編集画面でその商品の商品公開ステータスを「公開」にし、割引率を販売割引率に登録済みのものから選んで「商品を登録」を押す。"
DUMMY = lambda *a: None

def fix(name, row):
    kind, tid, col, old = row[1], row[2], row[3], row[4]
    items = row[0]
    ok = lambda new, basis, why="": ("直す", new, basis, why)
    no = lambda why, basis="": ("直さない", "", basis, why)
    if name == "M03-01":
        k = "必須項目で未選択のもの（割引率など）"
        assert old.count(k) == 1
        return ok(old.replace(k, DISC + k), "M03-02 識別ID 35・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）", "商品登録編集で「商品を登録」を押す前に割引率を選ぶ操作を書き足した。ほかの文（カード登録CSVの「任意の値」など）は変えていない。")
    if name == "M03-11":
        return no("すでにグッズ商品CSV登録（確認モーダルで確定）で商品を作り、控えた商品の既存の商品登録編集画面を開いて割引率を販売割引率に登録済みのものから選んで「商品を登録」を押している。新規登録の操作は残っていない。", "M03-27 L0092・M03-02 L0075〜L0077")
    if name == "M03-13":
        return no("グッズ商品CSV登録のアップロードには、すでに確認モーダルでの確定が書かれている（②）。③の商品タグ更新CSV登録（M03-28）の設計書に確認モーダルの記述が無いため足さない。", "M03-27 L0092・M03-28 design.txt（モーダルの記述なし）")
    if name == "M03-17":
        return no("商品登録編集画面で「割引率と販売制限でそれぞれ選択肢を1つ選び」と、すでに割引率を選んでから「商品を登録」を押している。", "functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目")
    if name == "M03-22":
        k = "のすべてに有効な値が入った状態にして「商品を登録」"
        assert old.count(k) == 1
        return ok(old.replace(k, "のすべてに有効な値が入った状態（割引率は販売割引率に登録済みのものから選ぶ）にして「商品を登録」"), "M03-02 識別ID 35・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目", "グッズ商品CSVに割引率の列が無く、「有効な値が入った状態」だけでは割引率を選ぶ操作が読み取れないため、選び方を括弧で書き足した。")
    if name in ("M04-21", "M04-23"):
        return no("このシードは在庫変更CSV登録を実行して在庫を入れていない。在庫0の商品を用意し、ケースが画面で取り込む（またはエラーを確かめる）ためのCSVファイルを端末に作る／在庫のDB直接設定／店舗登録だけを行う。在庫を入れる操作が無いので承認は要らない。", "M04-21 L0127〜L0135")
    if name == "M04-31":
        return no("棚卸計画・棚卸商品CSVのシードで、規格の画面で在庫無制限にチェックを入れる書き方は無い（在庫数無制限フラグ0の商品を使うだけ）。商品を作る「商品CSV登録（在庫数・在庫数無制限フラグの列）」という記述は元の文のまま。気づいた誤り: グッズ商品CSVに在庫数・在庫数無制限フラグの列は無く、在庫は在庫変更CSV登録＋承認で入れる（product_csv の決まり）が、項目外のため直していない。", "M03-09 L0095・L0097")
    if name in ("M05-11", "M05-18", "M05-26"):
        new = old
        assert STK in new and PUB in new
        n = new.count(UPL)
        assert n >= 1 and n == new.count(STK) == new.count(PUB), (n,)
        new = new.replace(UPL, UPLN).replace(STK, DBSTOCK).replace(PUB, PUBN)
        return ok(new, "M03-27 L0092（確認モーダル）・M03-09 L0095・L0097（規格の画面に在庫無制限の入力欄なし）・M03-02 編集の割引率必須（functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目）", "グッズ商品CSVのアップロードを確認モーダルで確定する形に、規格画面での在庫無制限チェックをDB直接設定に、商品編集の登録に割引率の選択を直した。商品の新規登録の操作は元からCSV登録に直っており、そこは変えていない。気づいた誤り（直していない）: CSV の「ほかの必須列に入力チェックを通る任意の値」が曖昧。")
    if name == "M07-03":
        return no("在庫変更CSV登録は行わないと書かれている（在庫を入れていない）。", "M04-21 L0127〜L0135")
    if name in INVCFG:
        pat = re.compile(r"在庫変更CSV登録画面で商品コード「([^」]+)」の在庫増減数に(10|1以上)を入れたCSVを取り込む。")
        m = pat.findall(old)
        assert len(m) == 1, (name, tid, m)
        code, q = m[0]
        qty = "10" if q == "10" else "10（1以上）"
        reg, app = INVCFG[name]
        new = pat.sub(lambda _: INV.format(code=code, qty=qty, reg=reg, app=app), old)
        why = "承認するメンバーがシードに無いため、同じ機能の既存シードの管理者のうち在庫を登録したメンバーと別の者を使った（ログイン可否と在庫管理・承認の権限は、シードの状態・属性が「%s」までしか書いていないので試験環境で確かめる）。在庫を入れる店舗は、このシードがフロント（本店）で買うので本店にした。仕入単価は元の文に無く、必須のため100にした。" % ("会員管理を操作できる" if name != "M10-04" else "基本情報設定と商品管理を操作できる")
        return ok(new, "M04-21 L0127〜L0135・L0166〜L0168・M04-32 L0108・L0110・L0141・L0218・L0297・L0301", why)
    if name in ("M14-04", "M14-05"):
        k = "必須項目で未選択のもの（割引率など）"
        assert old.count(k) == 1
        return ok(old.replace(k, DISC + k), "M03-02 識別ID 35・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）", "商品登録編集で「商品を登録」を押す前に割引率を選ぶ操作を書き足した。")
    if name == "M14-10":
        k = "販売制限に日本語・英語の両方で表示する選択肢を選んで「商品を登録」"
        assert old.count(k) == 1
        return ok(old.replace(k, "販売制限に日本語・英語の両方で表示する選択肢を選び、割引率を販売割引率に登録済みのものから選んで「商品を登録」"), "M03-02 識別ID 35・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目", "CSVの割引率(ID)で設定済みでも、編集画面で「商品を登録」する前に割引率を選ぶ操作を書き足した（2回目の決まり）。気づいた誤り（直していない）: 商品をカード商品CSV登録で作っている（product_csv の決まりはグッズ商品CSV）。")
    raise SystemExit("unhandled " + name)

counts = {}
for n in NAMES:
    lines = (R / f"fix2/in/{n}.tsv").read_text(encoding="utf-8").split("\n")
    out = ["\t".join(["種別", "対象ID", "列", "判定", "新しい文", "根拠", "理由"])]
    c = {"直す": 0, "直さない": 0, "直せない": 0}
    for l in lines[1:]:
        if not l.strip(): continue
        p = l.split("\t")
        j, new, basis, why = fix(n, p)
        c[j] += 1
        out.append("\t".join([p[1], p[2], p[3], j, new, basis, why]))
    (R / f"fix2/out/{n}.tsv").write_text("\n".join(out) + "\n", encoding="utf-8")
    counts[n] = c
    print(n, c)
