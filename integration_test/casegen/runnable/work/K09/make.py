import re, pathlib
R = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable')
NAMES = "M03-09 M03-10 M03-11 M03-13 M03-26 M03-27 M03-28 M03-30 M03-31 M03-32 M03-33 M03-38".split()
PH = "、表示された確認モーダルでアップロードを確定する"
MODAL_BASIS = "M03-27 L0092（グッズ商品CSV登録の「CSVファイルのアップロード」は押下後に確認モーダルを表示）"
DISC = "割引率を販売割引率に登録済みのものから選んで"

def add_modal(t, start_kw="グッズ商品CSV登録"):
    """グッズ商品CSVのアップロード押下の直後に確認モーダルの確定を足す。最初の1か所"""
    i = t.find(start_kw)
    assert i >= 0
    m = re.compile(r"「CSVファイルのアップロード」(ボタン)?を押す").search(t, i)
    assert m, t[:80]
    return t[:m.end() - 1] + "し" + PH + t[m.end():]

def disc_edit(t):
    n = t.count("を選んで「商品を登録」")
    t = t.replace("を選んで「商品を登録」", "を選び、" + DISC + "「商品を登録」")
    return t, n

def modal_norm(t):
    n = t.count("押して確認モーダルを確定する")
    return t.replace("押して確認モーダルを確定する", "押し" + PH), n

out = {n: [] for n in NAMES}
for n in NAMES:
    for l in open(R / f"kept/in/{n}.tsv", encoding="utf-8").read().split("\n")[1:]:
        if not l: continue
        f = l.split("\t")
        items, kind, sid, col, old = f[0], f[1], f[2], f[3], f[4]
        res = None
        def row(j, new="", basis="", why=""):
            out[n].append([kind, sid, col, j, new, basis, why])
        # --- 商品: M03-09 NEW（規格0件）
        if n == "M03-09" and items == "商品":
            num = sid.split("-")[-1]
            code = f"M0309-NEW-{num}-NM"
            new = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し" + PH +
                   f"（商品IDは空・商品コードは「{code}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「M0309-NEW-{num}」・商品名(英)は「M0309-NEW-{num}」・サイズ1・重量1・"
                   "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）・購入グループ名称は既存の購入グループの名称・基準価格500・販売価格500・買取価格200・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。"
                   f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔商品ID-M0309-{num}〕）。"
                   "取り込みは状態ニアミントの規格を1件作り、その規格に、店舗と在庫場所の組み合わせごとの在庫と、価格の履歴を付ける。"
                   "このケースは規格0件から始めるが、商品の最後の1件の規格は画面で削除できない（不正要求になる）ため、商品IDを控えたあと、DBで、この商品の規格と、その規格に付く在庫・価格の履歴をすべて削除し、この商品の規格を0件にする。")
            row("直す", new,
                "M03-27 L0092・L0119・L0123・L0124、M03-09 L0197、ee ProductGoodsImportHandler::persistProductClass（取り込みが作る規格・在庫・価格履歴）、product_csv/out/M03-09.tsv NEW-001 の型",
                "規格0件はCSV単独では作れないため、規格・在庫・価格履歴をDBで削除する（KEPT_PROMPT の規格0件の型）。元の「割引率を入れる」操作は商品登録編集の必須項目で、このケースは商品の編集をしないため不要（グッズ商品CSVに割引率の列は無い）。商品の販売制限はCSVの地域別販売制限0で入る")
            continue
        if n == "M03-26":
            row("直さない", basis="M03-26 L0094（カード商品CSV登録の「CSVファイルのアップロード」は確認モーダルを表示。元の文は「確認モーダルの確定ボタンを押す」と書いている）",
                why="商品は、このケースが確かめる機能そのものであるカード商品CSV登録で作っており、商品登録画面の新規登録は使っていない（「商品新規登録画面は使えない（アクセスすると404）ため」と明記済み）。拾われたのは見出し「商品の新規登録」の語のみ。カード商品CSVで作ること自体に依るケースなので、グッズ商品CSVへ置き換えない")
            continue
        has_modal = "確認モーダルを確定" in old or "確認モーダルで確定" in old
        goods = "グッズ商品CSV登録" in old
        if items == "確認モーダル":
            if has_modal:
                row("直さない", basis=MODAL_BASIS, why="グッズ商品CSVのアップロードを確認モーダルで確定する操作がすでに書いてある（言い回しは「確認モーダルを確定する」「確認モーダルで確定し」）。商品公開CSV・価格変更CSV・基準価格変更CSV・高額商品価格変更CSV・セール用価格変更CSVのファイルは作って置くだけで、この投入方法ではアップロードしない")
            elif not goods:
                row("直さない", basis="M03-28 設計書にアップロード後の確認モーダルの記述なし（grep モーダル 0件）",
                    why="グッズ商品CSVのアップロードを行わず、商品タグ更新CSV登録だけをアップロードしている。商品タグ更新CSV登録の設計書（M03-28）に確認モーダルの記述が無いので足さない")
            else:
                new = add_modal(old)
                extra = ""
                if "商品タグ更新CSV" in old:
                    extra = "同じ文にある商品タグ更新CSV登録のアップロードには、設計書（M03-28）に確認モーダルの記述が無いので足していない。"
                if "カテゴリ登録CSV" in old:
                    extra = "同じ文にあるカテゴリ登録CSVのアップロードには、設計書（M03-41）に確認モーダルの記述が無いので足していない。"
                row("直す", new, MODAL_BASIS, extra)
            continue
        # 割引率 を含む行
        if "割引率" in items.split(","):
            new = old; why = []
            if n == "M03-11":  # QD-BANNER-044
                new = add_modal(new)
                assert "商品の新規登録画面は使えないため、" in new
                new = new.replace("商品の新規登録画面は使えないため、", "商品登録画面での新規作成は使えないため、")
                assert "を加えて「商品を登録」" in new
                new = new.replace("を加えて「商品を登録」", "を加え、" + DISC + "「商品を登録」")
                why.append("商品は元からグッズ商品CSVで作っていて新規登録画面の操作は無い（「商品の新規登録画面は使えないため」と明記）。機械の検査が否定文の「商品の新規登録」に反応するので、この語だけ「商品登録画面での新規作成は使えないため」に言い換えた")
                basis = MODAL_BASIS + "、M03-02 L0075〜L0077（商品新規登録は禁止）・functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）"
            else:
                new, k = disc_edit(new)
                if k == 0:
                    assert "チェックを外して「商品を登録」" in new, sid
                    new = new.replace("チェックを外して「商品を登録」", "チェックを外し、割引率が未選択なら販売割引率に登録済みのものから選んで「商品を登録」")
                    why.append("タグを外す対象はこのシード以外の既存の商品で、割引率がすでに選ばれていればそのまま、未選択なら選ぶと書いた（編集では割引率が必須）")
                elif "チェックを外して「商品を登録」" in new:
                    new = new.replace("チェックを外して「商品を登録」", "チェックを外し、割引率が未選択なら販売割引率に登録済みのものから選んで「商品を登録」")
                    why.append("タグを外す既存の商品の編集には、割引率が未選択なら選ぶと書いた")
                new, m = modal_norm(new)
                if m:
                    why.append("確認モーダルの確定はすでに書いてあったが、検査の決まりの語句に揃えて「表示された確認モーダルでアップロードを確定する」に言い換えた")
                elif goods and "確認モーダルでアップロードを確定" not in new:
                    new = add_modal(new)
                basis = "M03-02 L0075〜L0077、functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須。グッズ商品CSVに割引率の列は無い M03-27 L0194〜L0238）、" + MODAL_BASIS
            if n == "M03-13":  # QD-PRIORITY-049: 画像を選ぶ編集
                if "商品画像を選び「商品を登録」" in new:
                    new = new.replace("商品画像を選び「商品を登録」", "商品画像を選び、" + DISC + "「商品を登録」")
                    new = new.replace("チェックを外して「商品を登録」", "チェックを外して「商品を登録」") 
                new = add_modal(new) if "確認モーダルでアップロードを確定" not in new else new
            row("直す", new, basis, "；".join(why))
            continue
        raise SystemExit(f"unhandled {n} {sid} {items}")

for n in NAMES:
    # tag-only rows in M03-13 handled above in 確認モーダル branch (goods False)
    p = R / f"kept/out/{n}.tsv"
    p.parent.mkdir(parents=True, exist_ok=True)
    lines = ["\t".join(["種別", "対象ID", "列", "判定", "新しい文", "根拠", "理由"])]
    for r in out[n]:
        assert all("\t" not in x and "\n" not in x for x in r)
        lines.append("\t".join(r))
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    import collections
    c = collections.Counter(r[3] for r in out[n])
    print(n, dict(c))
