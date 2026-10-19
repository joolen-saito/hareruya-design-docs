from common import *
hdr, I = load('M12-03')
O = []
B = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0146（識別ID 35）、M03-09 L0095・L0097・L0130〜L0134・L0159・L0196〜L0198"
WHY0 = ("元の手順は商品登録編集画面で商品名・商品公開ステータスなどを入れて商品を登録し、規格設定の画面で商品コード・販売価格・在庫数無制限を入れていた。"
        "グッズ商品CSVで商品と状態ニアミントの規格（商品コード・販売価格を入れた値）を作り、"
        "元の『任意の名前』は、キーワードに商品コードの一部を足した値にした。商品名(英)は商品名(日)と同じ値、基準価格は販売価格と同額、買取価格は販売価格の半分以下（最大100）、原価単価10、サイズ1、重量1、支店の商品公開ステータスは ee の初期値の1（公開）とした。")

def spec(code, lang="日本語", extra=""):
    return spec_open_edit(code, lang, extra + "")

def spec_loop(extra=""):
    return spec_open_edit(None, "日本語", extra + "").replace("その商品の商品コード", "各商品の商品コード")

def card_edit(code, name, cat=None, card="", extra=""):
    t = open_edit(code) + "、"
    if card:
        t += f"「カード指定 >」ボタンを押し、カード検索ポップアップで{card}の行の決定ボタンを押す。続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、"
    if cat:
        t += f"商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、"
    t += extra + DISC + "「商品を登録」ボタンを押す。"
    return t

def prods_codes(rows_def):
    return "、".join(f"「{c}」" for c, *_ in rows_def)

NEWPROD = re.compile(r'^(【画面】管理画面の商品登録画面で商品名に|商品登録編集画面で商品名に)')
for r in I:
    sid, old = r[0], r[5]
    k = sid[len('S-M12-03-'):]
    s = old.split('。')
    notes = []
    def first_idx():
        return next(i for i, x in enumerate(s) if NEWPROD.match(x))
    i0 = first_idx()
    if k == 'PRODUCT':
        rows = [csv_row("P-001", "商品集計確認・受注時商品A", base=1000, buy=100)]
        s[i0] = csv_upload(rows) + "。" + spec("P-001")
        ie = next(i for i, x in enumerate(s) if x.startswith('2件の購入のあと、商品登録編集画面で商品名を「商品集計確認・現商品A」に変えて「商品を登録」を押す'))
        s[ie] = '2件の購入のあと、商品登録編集画面で商品名を「商品集計確認・現商品A」に変え、' + DISC + '「商品を登録」を押す'
        notes.append("後の手順の商品名の変更は、取り込んだ商品を編集するので割引率の選択が必要（グッズ商品CSVに割引率の列が無い）。その文に割引率を選ぶ操作を足した。")
    elif k in ('CHANNEL', 'DATE', 'CANCEL', 'NULL-DATE', 'AGGREGATE', 'SORT', 'LIMIT', 'MIXCHAN-038'):
        if k == 'CHANNEL':
            d = [("MAIL-001", "集計対象確認-MAIL-001", 100, 0), ("TOKYO-001", "集計対象確認-TOKYO-001", 100, 0), ("OSAKA-001", "集計対象確認-OSAKA-001", 100, 1)]
            drop(s, r'^商品コード「TOKYO-001」「OSAKA-001」の商品も', 1)
        elif k == 'DATE':
            d = [("FROM-BEFORE", "From境界-FROM-BEFORE", 100, 0), ("FROM-EXACT", "From境界-FROM-EXACT", 100, 0), ("TO-BEFORE", "To境界-TO-BEFORE", 100, 0), ("TO-EXACT", "To境界-TO-EXACT", 100, 0)]
            drop(s, r'^商品コード「FROM-EXACT」は商品名に', 1)
        elif k == 'CANCEL':
            d = [("NORMAL-001", "キャンセル判定-NORMAL-001", 100, 0), ("CANCEL-001", "キャンセル判定-CANCEL-001", 100, 0)]
            drop(s, r'^商品コード「CANCEL-001」の商品も', 1)
        elif k == 'NULL-DATE':
            d = [("DATE-VALID", "注文日欠落-DATE-VALID", 100, 0), ("DATE-NULL", "注文日欠落-DATE-NULL", 100, 0)]
            drop(s, r'^商品コード「DATE-NULL」の商品も', 1)
        elif k == 'AGGREGATE':
            d = [("AGG-001", "集計後判定-AGG-001", 90, 0), ("AVG-001", "切捨前判定-AVG-001", 100, 0)]
            drop(s, r'^商品コード「AVG-001」の商品は', 1)
        elif k == 'SORT':
            d = [("SORT-C", "並べ替え確認-SORT-C", 100, 0), ("SORT-A", "並べ替え確認-SORT-A", 100, 0), ("SORT-B", "並べ替え確認-SORT-B", 400, 0)]
            drop(s, r'^商品コード「SORT-A」は販売価格100', 1)
        elif k == 'LIMIT':
            prices = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]
            d = [(f"LIMIT-{n:02d}", f"表示件数確認-LIMIT-{n:02d}", p, 0) for n, p in enumerate(prices, 1)]
            drop(s, r'^商品コード「LIMIT-02」から「LIMIT-11」までの商品も', 1)
        else:  # MIXCHAN-038
            d = [("M1203-038-MAIL", "M1203-038-混在 MAIL", 100, 0), ("M1203-038-TOKYO", "M1203-038-混在 TOKYO", 100, 0)]
            drop(s, r'^商品名「M1203-038-混在 TOKYO」・商品コード', 1)
        rows = [csv_row(c, n, base=p, buy=min(100, p // 2), branch=1) for c, n, p, b in d]
        s[i0] = csv_upload(rows) + "。商品コード" + prods_codes(d) + "のそれぞれについて次を行う。" + spec_loop()
        if k == 'SORT':
            notes.append("登録順は元のシードのとおり SORT-C、SORT-A、SORT-B（CSVの行の順）。")
        if k == 'LIMIT':
            notes.append("販売価格は元のシードのとおりLIMIT-01が100、LIMIT-02から順に200〜1100。")
    elif k in ('CHANNELDEF-034', 'STOREDEF-035'):
        n = k[-3:]; lab = "通販定義" if n == '034' else "店舗定義"
        d = [(f"M1203-{n}-MAIL", f"M1203-{n}-{lab} MAIL"), (f"M1203-{n}-SMOOTH", f"M1203-{n}-{lab} SMOOTH"), (f"M1203-{n}-NONE", f"M1203-{n}-{lab} NONE")]
        rows = [csv_row(c, nm, base=100, buy=50) for c, nm in d]
        s[i0] = ("【画面】" + csv_upload(rows) + "（この順に登録する）。商品コード" + prods_codes(d) + "のそれぞれについて次を行う。" + spec_loop())
        drop(s, r'^同じ操作を商品名', 1)
        notes.append("【DB直接】の『商品登録の直前に商品の採番の次の値を…に合わせる』は元のまま（商品IDを採番するのはCSVのアップロードなので、そのアップロードの直前に合わせる）。商品ID・規格IDの採番の順は、CSVの行の順（MAIL、SMOOTH、NONE）になる。")
    elif k == 'HANDOVER-036':
        d = [("M1203-036-A", "M1203-036-二重計上")]
        s[i0] = "【画面】" + csv_upload([csv_row("M1203-036-A", "M1203-036-二重計上", base=100, buy=50)]) + "。" + spec("M1203-036-A")
        notes.append("【DB直接】の『商品登録の直前に商品の採番の次の値を…に合わせる』は元のまま（商品IDを採番するのはCSVのアップロードなので、そのアップロードの直前に合わせる）。")
    elif k == 'MULTISTORE-037':
        s[i0] = csv_upload([csv_row("M1203-037-A", "M1203-037-合算", base=100, buy=50, branch=1)]) + "。" + spec("M1203-037-A")
    elif k == 'CATEGORY':
        d = [("CHILD-001", "階層確認-CHILD-001", 300, "「カテゴリ子」"), ("MULTI-001", "カテゴリ重複確認-MULTI-001", 500, "「カテゴリ赤」と「カテゴリ青」"), ("NONE-001", "カテゴリ重複確認-NONE-001", 700, None)]
        rows = [csv_row(c, n, base=p, buy=min(100, p // 2)) for c, n, p, _ in d]
        i0 = next(i for i, x in enumerate(s) if NEWPROD.match(x))
        edit = ""
        for c, n, p, cat in d:
            if cat:
                edit += f"{c}: " + card_edit(c, n, cat=cat) + spec_open_edit(c, extras="").split("、", 1)[1].split("開き、", 1)[-1] if False else ""
        parts = []
        for c, n, p, cat in d:
            if cat:
                parts.append(f"商品コード「{c}」: " + open_edit(c) + f"、商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、" + DISC + "「商品を登録」ボタンを押す。" + spec_list_open() + "。" + spec_edit_nm("日本語", ""))
            else:
                parts.append(f"商品コード「{c}」: " + spec_open_edit(c, extras="")
                             + "。商品カテゴリを選ばない状態は画面でもCSVでも作れない（商品カテゴリは必須）ため、DBへ直接設定する（取り込んだ商品のカテゴリの関連を外す）")
        s[i0] = csv_upload(rows) + "。" + "。".join(parts)
        drop(s, r'^商品コード「MULTI-001」は商品名に「カテゴリ重複確認」', 1)
        notes.append("商品カテゴリは必須（CSVの列も商品登録編集画面の項目も）なので、元の『商品カテゴリを選ばず』（NONE-001）は、いったんサプライ・グッズで取り込んだあとカテゴリの関連をDBで外す。カテゴリ子・カテゴリ赤・カテゴリ青はサプライ・グッズの配下でないので、取り込み後に商品登録編集画面で付け替える（M03-27 L0123）。")
    elif k == 'KEYWORD':
        rows = [csv_row("KW-777", "晴れる屋商品片", "Alpha Cards", base=100, buy=50), csv_row("KW-778", "晴れる屋商品片", "Alpha Cards", base=100, buy=50)]
        card = "「Blue Dragon」のカード詳細"
        parts = [f"商品コード「KW-777」: " + card_edit("KW-777", "晴れる屋商品片", card=card, extra="ショップメモ欄（備考）に「特選備考」を入れ、").replace("商品名(英)に「晴れる屋商品片」", "商品名(英)に「Alpha Cards」") + spec_list_open() + "。" + spec_edit_nm("日本語", ""),
                 f"商品コード「KW-778」: " + card_edit("KW-778", "晴れる屋商品片", card=card, extra="ショップメモ欄（備考）に「777通常備考」を入れ、").replace("商品名(英)に「晴れる屋商品片」", "商品名(英)に「Alpha Cards」") + spec_list_open() + "。" + spec_edit_nm("日本語", "")]
        s[i0] = csv_upload(rows) + "。" + "。".join(parts)
        drop(s, r'^商品コード「KW-778」は商品名「晴れる屋商品片」', 1)
    elif k == 'FILTER':
        rows = [csv_row("FILTER-A", "絞込確認-FILTER-A", base=100, buy=50, tag=None), csv_row("FILTER-B", "絞込確認-FILTER-B", base=100, buy=50)]
        rows = [x + "" for x in rows]
        # 売上分析タグ(ID)の列は csv_row に無いので差し込む
        rows[0] = rows[0].replace("・基準価格", "・売上分析タグ(ID)は〔売上分析タグID-M1203-共有FILTER-A〕に控えたタグのID・基準価格", 1)
        rows[1] = rows[1].replace("・基準価格", "・売上分析タグ(ID)は〔売上分析タグID-M1203-共有FILTER-B〕に控えたタグのID・基準価格", 1)
        pa = ("商品コード「FILTER-A」: " + card_edit("FILTER-A", "絞込確認-FILTER-A", cat="「絞込カテゴリ」", card="セットAのカード詳細（〔カード詳細ID-M1203-共有FILTER-A〕）") + spec_list_open() + "。" + spec_edit_nm("日本語", ""))
        pb = ("商品コード「FILTER-B」: " + card_edit("FILTER-B", "絞込確認-FILTER-B", cat="「絞込カテゴリ」", card="セットBのカード詳細（〔カード詳細ID-M1203-共有FILTER-B〕）") + spec_list_open() + "。"
              + "商品規格一覧の「新規作成」を押し、商品規格登録編集画面で商品コードに「FILTER-B」、言語に日本語、状態にSPを選び、基準価格と販売価格に100、買取価格に50を入れ、部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す。"
              + "続けて商品規格一覧で取り込みで作られた状態ニアミント・日本語の規格（商品コード「FILTER-B-NM」）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す（規格が2件になっているので削除できる）")
        rows[1] = rows[1].replace("商品コードは「FILTER-B」", "商品コードは「FILTER-B-NM」")
        s[i0] = csv_upload(rows) + "。" + "売上分析タグは、FILTER-A・FILTER-Bそれぞれの売上分析タグ(ID)の列で入れる。" + pa + "。" + pb
        drop(s, r'^商品コード「FILTER-B」は商品名に', 1)
        notes.append("カードセット（セットA・セットB）は、カード指定で選んだカード詳細のカードセットが入る（カードセットを持つ商品は商品の画面でカードセットを編集できない M03-02 L0073）。FILTER-Bの状態SPは、CSVが作るニアミントの規格（商品コード「FILTER-B-NM」）を残したまま新規作成で足し、あとでニアミントの規格を削除する。売上分析タグはCSVの売上分析タグ(ID)列（M03-27）で入れる。")
    elif k == 'CATMIX-040':
        d = [("M1203-040-DIRECT", "M1203-040-カテゴリ混在 DIRECT", "「M1203-040-親」"), ("M1203-040-CHILD", "M1203-040-カテゴリ混在 CHILD", "「M1203-040-子」"), ("M1203-040-OTHER", "M1203-040-カテゴリ混在 OTHER", "「M1203-040-別」")]
        rows = [csv_row(c, n, base=100, buy=50) for c, n, _ in d]
        parts = [f"商品コード「{c}」: " + open_edit(c) + f"、商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、" + DISC + "「商品を登録」ボタンを押す。" + spec_list_open() + "。" + spec_edit_nm("日本語", "") for c, n, cat in d]
        s[i0] = csv_upload(rows) + "。" + "。".join(parts)
        drop(s, r'^同じ手順で、商品名に「M1203-040-カテゴリ混在 (CHILD|OTHER)」', 2)
        notes.append("M1203-040-親・子・別はサプライ・グッズの配下でないので、取り込み後に商品登録編集画面で商品カテゴリを付け替える（M03-27 L0123）。")
    elif k == 'CATSAME-041':
        d = [("M1203-041-P1", "M1203-041-同一カテゴリ P1", 300), ("M1203-041-P2", "M1203-041-同一カテゴリ P2", 500)]
        rows = [csv_row(c, n, base=p, buy=min(100, p // 2)) for c, n, p in d]
        parts = [f"商品コード「{c}」: " + open_edit(c) + "、商品カテゴリはサプライ・グッズの選択を外して「M1203-041-同一」を選び、" + DISC + "「商品を登録」ボタンを押す。" + spec_list_open() + "。" + spec_edit_nm("日本語", "") for c, n, p in d]
        s[i0] = csv_upload(rows) + "。" + "。".join(parts)
        drop(s, r'^商品名「M1203-041-同一カテゴリ P2」・商品カテゴリ', 1)
        notes.append("M1203-041-同一はサプライ・グッズの配下でないので、取り込み後に商品登録編集画面で商品カテゴリを付け替える（M03-27 L0123）。")
    else:
        raise SystemExit(sid)
    codes_ = [c[:-3] if c.endswith('-NM') else c for c in re.findall(r'商品コードは「([^」]+)」', s[i0])]
    if k == 'MULTISTORE-037':
        stk = "。".join(stock(st, [("M1203-037-A", 100)]) for st in ("TC東京", "大阪店", "名古屋店"))
    elif k == 'CHANNEL':
        stk = stock("TC東京", [(c, 100) for c in codes_ if c != "OSAKA-001"]) + "。" + stock("大阪店", [("OSAKA-001", 100)])
    else:
        stk = stock("TC東京", [(c, 100) for c in codes_])
    s[i0] = s[i0] + "。" + stk
    notes.append("元の『在庫数無制限をチェック』は規格の画面に欄が無い（M03-09 L0095・L0097）ので、在庫変更CSV登録で数量100を入庫し、別の承認権限者が承認する（無制限の代わりに、購入数より十分多い数。承認するメンバーは元のシードに無いので、在庫を登録したメンバーと別の既存の管理者を使う）。在庫が減らないこと自体を確かめるケースは無いと見た。")
    left = [x for x in s if x and re.search(r'商品登録編集画面で商品名に|管理画面の商品登録画面で商品名に|規格設定の画面で商品コード|商品登録画面で商品名に', x)]
    assert not left, (sid, left[0][:60])
    O.append([sid, "直す", joined(s), "", B, WHY0 + "".join(notes)])
write('M12-03', O)
print(len(O))
