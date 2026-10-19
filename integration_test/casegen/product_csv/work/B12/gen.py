import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P / f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]

def write(fid, O):
    with open(P / f'out/{fid}.tsv', 'w', encoding='utf-8') as fh:
        fh.write("\t".join(HDR) + "\n")
        for x in O:
            assert len(x) == 6 and all('\t' not in c and '\n' not in c for c in x), x[0]
            fh.write("\t".join(x) + "\n")

CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
UP = "グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{body}）。グッズ商品は状態ニアミントの規格が1件作られる"

def cols(code, ja, en, base, sale, buy, lang="日本語のID", code_text=None):
    ct = code_text or f"「{code}」"
    return (f"商品IDは空・商品コードは{ct}・言語(ID)は{lang}・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）"
            f"・商品名(日)は「{ja}」・商品名(英)は「{en}」・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称"
            f"・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def csv1(code, ja, en, base, sale, buy, lang="日本語のID"):
    return UP.format(n="1行", body=cols(code, ja, en, base, sale, buy, lang))

def search(code, label=None):
    if label:
        return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。その行から"
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から"

BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075-L0077・L0092・L0111・L0129、M03-09 L0130-L0134"

# ======================= A07-05 =======================
RC = r"([^」]*)"
P1 = re.compile(r"商品登録画面で商品名に「" + RC + r"」を入れ、「カード指定」でそのカードの詳細情報を選び、公開にして登録し、登録後の商品登録画面のURLに含まれる商品IDを控える（〔([^〕]*)〕）。"
                r"その商品の商品規格登録画面で言語に「日本語」、状態に「NM」、買取価格(?:\(円\)|（円）)に(\d+)を入れて登録し、登録後の画面のURL末尾に含まれる商品規格IDを控える（〔([^〕]*)〕）")
P1X = re.compile(r"商品登録画面で商品名に「" + RC + r"」を入れ、「カード指定」でそのカードの詳細情報を選び、公開にして登録する。"
                 r"その商品の商品規格登録画面で言語に「日本語」、状態に「NM」、買取価格(?:\(円\)|（円）)に(\d+)を入れて登録し、登録後の画面のURL末尾に含まれる商品規格IDを控える（〔([^〕]*)〕）")
P4 = re.compile(r"管理画面の商品登録画面で商品名に「" + RC + r"」を入れ、カード指定をせず公開にして登録し、登録後の商品登録画面のURLに含まれる商品IDを控える（〔([^〕]*)〕）。"
                r"その商品の商品規格登録画面で言語に「日本語」、状態に「NM」、買取価格(?:\(円\)|（円）)に(\d+)を入れて登録し、登録後の画面のURL末尾に含まれる商品規格IDを控える（〔([^〕]*)〕）")
P3 = re.compile(r"申込用のサプライ商品を用意する（管理画面の商品登録画面で商品名に「" + RC + r"」を入れ、カード指定をせず公開にして登録し、その商品の商品規格登録画面で言語に「日本語」、状態に「NM」、買取価格(?:\(円\)|（円）)に(\d+)を入れて登録する）")
P3B = re.compile(r"管理画面の商品登録画面で商品名に「" + RC + r"」を入れ、カード指定をせず公開にして登録し、その商品の商品規格登録画面で言語に「日本語」、状態に「NM」、買取価格(?:\(円\)|（円）)に(\d+)を入れて登録する")

def card_edit(name, plabel=None, reg_label=None, code=None, buy=None):
    return (f"商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカード詳細（カード名「{name}」）の行の決定ボタンを押す。"
            f"続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、"
            f"割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す")

def open_reg(lang="日本語"):
    return f"商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、言語{lang}・状態NMの規格（取り込みで作られた規格）の行を開いて、商品規格登録編集画面の商品規格ID欄に表示された番号を控える"

def code_from(label, n):
    # 商品ID-A0705-036A -> A0705-036A
    return label.replace("商品ID-", "")

def a0705(sid, old):
    n = sid.split('-')[-1]
    new = old
    kinds = []
    def rcard(m):
        name, pl, buy, rl = m.group(1), m.group(2), m.group(3), m.group(4)
        code = code_from(pl, n)
        kinds.append('card')
        return (csv1(code, name, name, buy, buy, buy) + "。" + search(code, pl) + card_edit(name) + "。" + open_reg() + f"（〔{rl}〕）")
    new = P1.sub(rcard, new)
    def rcardx(m):
        name, buy, rl = m.group(1), m.group(2), m.group(3)
        code = "A0705-AC005"
        kinds.append('card')
        return (csv1(code, name, name, buy, buy, buy) + "。" + search(code) + card_edit(name) + "。" + open_reg() + f"（〔{rl}〕）")
    new = P1X.sub(rcardx, new)
    def rnc(m):
        name, pl, buy, rl = m.group(1), m.group(2), m.group(3), m.group(4)
        code = code_from(pl, n)
        kinds.append('goods')
        return (csv1(code, name, name, buy, buy, buy) + "。" + search(code, pl) + "商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開いて、商品規格登録編集画面の商品規格ID欄に表示された番号を控える" + f"（〔{rl}〕）")
    new = P4.sub(rnc, new)
    def rsup(m):
        name, buy = m.group(1), m.group(2)
        code = "A0705-AC-SUP" if sid.endswith('AC-PRODUCT') else f"A0705-SUP-{n}"
        kinds.append('supply')
        return "申込用のサプライ商品を用意する（" + csv1(code, name, name, buy, buy, buy) + "）"
    new = P3.sub(rsup, new)
    def rsup2(m):
        name, buy = m.group(1), m.group(2)
        kinds.append('supply')
        return csv1("A0705-AC-SUP", name, name, buy, buy, buy)
    if sid.endswith('AC-PRODUCT'):
        new = P3B.sub(rsup2, new)
    return new, kinds

# ======================= M04-23 =======================
ITEM = re.compile(r"商品コード(.+?)（商品名は(任意の名称|「[^」]*」)）")
LST = re.compile(r"(①商品マスターで次の商品コードを検索し、無いものは、)商品登録編集で商品名を入れて「商品を登録」ボタンを押し、「規格設定」ボタンから商品規格登録編集を開いて商品コードを入れ、部門などほかの必須項目に有効な値を入れて「商品規格を登録」ボタンを押す: (.+?)(。商品の登録は店舗の登録より先に行う)")

def m0423_first(old):
    m = LST.search(old)
    items = ITEM.findall(m.group(2))
    rows = []
    longs = 0
    for i, (c, nm) in enumerate(items, 1):
        if c.startswith("先頭"):
            mm = re.match(r"先頭6桁(\d+)の後に数字(\d)を249文字連結した255文字の商品コード", c)
            ctext = f"先頭6桁{mm.group(1)}の後に数字{mm.group(2)}を249文字連結した255文字の値"
            name = f"M0423長コード商品{mm.group(1)}-{mm.group(2)}"
            code = None
            longs += 1
        else:
            code = c
            ctext = f"「{c}」"
            name = nm[1:-1] if nm != "任意の名称" else f"M0423商品{c}"
        rows.append((ctext, name))
    body = "／".join(f"{i}行目は" + cols(None, nm, nm, 100, 100, 10, "日本語のID", code_text=ct) for i, (ct, nm) in enumerate(rows, 1))
    if len(rows) == 1:
        body = cols(None, rows[0][1], rows[0][1], 100, 100, 10, "日本語のID", code_text=rows[0][0])
    sent = UP.format(n="無かった商品の行だけ" if len(rows) > 1 else "1行", body=body)
    if len(rows) == 1:
        sent = UP.format(n="1行", body=body)
    sent += ": 対象は" + "、".join(f"商品コード{ct}" for ct, _ in rows)
    new = old[:m.start()] + m.group(1) + sent + m.group(3) + old[m.end():]
    return new, len(rows), longs

M083 = re.compile(r"【商品】商品を登録できるメンバーで管理画面にログインし、商品登録画面で商品名に「([^」]*)」ほか必須項目を入れて登録し、続けて商品規格登録画面で、商品コード=([\w-]+)、スマレジ連携フラグ=連携しない、買取価格=(\d+)、指定のない基準価格ほか必須項目には任意の値を入れて「商品規格を登録」を押す")

def m083(old):
    def r(m):
        name, code, buy = m.group(1), m.group(2), m.group(3)
        return "【商品】グッズ商品CSV登録を操作できるメンバーで管理画面にログインし、" + csv1(code, name, name, buy, buy, buy)
    new, k = M083.subn(r, old)
    assert k == 2
    return new

def m074(old):
    a = old.index("【商品】管理画面の商品登録で")
    b = old.index("【在庫】")
    seg = old[a:b]
    assert seg.count("【分割先商品】") == 1
    body = ("1行目は" + cols(None, "QE0423-001-NAME", "QE0423-001-NAME-EN", 100, 100, 1, code_text="「QE0423-001-CODE」")
            + "／2行目は" + cols(None, "QE0423-001-DST-NAME", "QE0423-001-DST-NAME-EN", 100, 100, 1, code_text="「QE0423-001-DST-CODE」"))
    s = ("【商品】" + UP.format(n="2行", body=body) + "（登録した規格は表示対象になり、開店中の店舗ごとの在庫が0で作られる）。"
         + "商品マスター(検索入力)で商品コードに「QE0423-001-CODE」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔商品ID-M0423-001〕）。")
    return old[:a] + s + old[b:]

# ======================= M06-12 =======================
S1 = re.compile(r"^管理画面の商品登録編集画面で「カード指定 >」からレアリティがR(の別の|の)カードを選び、商品名に「([^」]+)」を入れ、略称タグで「([^」]+)」を選び、商品公開ステータスを公開にして「商品を登録」を押す$")
S2 = re.compile(r"^商品マスター\(検索結果\)で商品名「([^」]+)」の行に表示された商品IDを控える(?:（〔([^〕]+)〕）)?$")
PRE = re.compile(r"^その商品の商品登録編集画面で「規格設定」を押す$")
REG = re.compile(r"^(?:その商品の商品登録編集画面で「規格設定」を押し、)?商品規格一覧で「新規作成」を押し、商品規格登録編集画面で言語に言語ID (\d+) ?の言語、状態に「(\w+)」(?:（査定のための仮の状態）)?、商品コードに「([^」]+)」、基準価格に(\d+)、買取価格に(\d+) ?を入れ、公開ステータスを公開にし、販売価格・部門など残りの必須項目に任意の値を入れて「商品規格を登録」を押す$")
S4 = re.compile(r"^登録後の商品規格登録編集画面に表示された商品規格IDを控える(?:（〔([^〕]+)〕）)?$")

def m0612(old):
    ss = old.split("。")
    out = []
    i = 0
    extra_nm = []
    while i < len(ss):
        m1 = S1.match(ss[i])
        if not m1:
            out.append(ss[i]); i += 1; continue
        other, name, tag = m1.group(1), m1.group(2), m1.group(3)
        j = i + 1
        grp = []
        while j < len(ss) and (S2.match(ss[j]) or PRE.match(ss[j]) or REG.match(ss[j]) or S4.match(ss[j])):
            grp.append(ss[j]); j += 1
        m2 = S2.match(grp[0]); plabel = m2.group(2)
        regs = [(REG.match(g), k) for k, g in enumerate(grp) if REG.match(g)]
        nm_idx = None
        for rm, k in regs:
            if rm.group(2) == "NM":
                nm_idx = k; break
        use = regs[nm_idx is not None and [k for _, k in regs].index(nm_idx) or 0][0]
        lang, state, code, base, buy = use.group(1), use.group(2), use.group(3), use.group(4), use.group(5)
        text = csv1(code, name, name, base, base, buy, lang=lang)
        text += "。" + search(code, plabel)
        text += (f"商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード検索ポップアップでレアリティがRの{'別の' if other=='の別の' else ''}カードの行の決定ボタンを押す。"
                 f"続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、略称タグで「{tag}」を選び、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、"
                 "割引率に販売割引率に登録済みの割引率を選び、商品公開ステータスは「公開」のまま「商品を登録」ボタンを押す")
        out.append(text)
        if nm_idx is None:
            extra_nm.append(name)
        # 規格のぶん
        k = 0
        first_nm_done = False
        while k < len(grp):
            g = grp[k]
            rm = REG.match(g)
            if k == 0:  # S2 consumed
                k += 1; continue
            if PRE.match(g):
                k += 1; continue
            if rm:
                is_csv = (nm_idx is not None and k == nm_idx)
                nxt = grp[k + 1] if k + 1 < len(grp) else ""
                s4 = S4.match(nxt)
                if is_csv:
                    if s4 and s4.group(1):
                        out.append(open_reg_m(rm.group(1)) + f"（〔{s4.group(1)}〕）")
                    elif s4:
                        out.append(open_reg_m(rm.group(1)))
                    k += 2 if s4 else 1
                    continue
                # CSVで作らない規格: 元のとおり
                out.append(g)
                k += 1
                continue
            out.append(g); k += 1
        i = j
    return "。".join(out), extra_nm

def open_reg_m(lang):
    return f"商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、言語ID {lang}の言語・状態NMの規格（取り込みで作られた規格）の行を開いて、商品規格登録編集画面の商品規格ID欄に表示された番号を控える"

def run():
    # ---- A07-05
    hdr, I = load('A07-05'); O = []
    for r in I:
        sid, old = r[0], r[5]
        new, kinds = a0705(sid, old)
        assert new != old, sid
        why = []
        if 'card' in kinds:
            why.append("元は規格の買取価格だけを指定していたので、基準価格・販売価格は買取価格と同額にした（買取価格は販売価格を上回れない M03-27 L0119）。商品カテゴリは元が未指定（商品登録では必須）のため単体カードのカテゴリにした")
        if 'supply' in kinds or 'goods' in kinds:
            why.append("サプライ品・まとめて買取品は商品カテゴリ未指定だったので、CSVの必須列にサプライ・グッズを入れた。基準価格・販売価格は買取価格と同額、商品コードはシード専用の値を足した（元は商品コードなし）。部門は元から指定なし")
        if sid.endswith('DETAILS-027'):
            why.append("状態SPの規格を足す手順は元のまま（元から販売価格・部門などの必須項目の値が書かれていない。気づいた誤りだが直していない）")
        O.append([sid, "直す", new, "", BASIS, "。".join(why)])
    write('A07-05', O)
    # ---- M04-23
    hdr, I = load('M04-23'); O = []
    for r in I:
        sid, old = r[0], r[5]
        if sid.endswith('RD-STOCK-083') or sid.endswith('RD-STOCK-084'):
            new = m083(old); why = "元は基準価格などが「指定のない…任意の値」だったので、基準価格・販売価格・買取価格を100にした（在庫の仕入単価・総原価には使われない）。商品登録の権限を持つメンバー、をグッズ商品CSV登録を操作できるメンバーに書き換えた。部門は空（連携フラグが0のため必須でない M03-27 L0236-L0237）"
        elif sid.endswith('QE-DETAIL-074'):
            new = m074(old); why = "元は商品名(英)・基準価格以外が「任意の値」だったので、商品名(英)は「…-NAME-EN」、買取価格は元の「1以下」から1、サイズ・重量は1、購入グループは既存のもの、原価単価は10にした。カード指定は元から任意（押さない）。部門は空（連携フラグが0のため必須でない）。商品2点を1つのCSVの2行で作るため【商品規格】【分割先商品】の区切りは無くした。販売制限なしは地域別販売制限0（日英の両サイト）で入れた"
        else:
            new, nrows, longs = m0423_first(old)
            why = "元は商品名が「任意の名称」で基準価格などが未指定だったので、商品名は商品コードから作った値、基準価格・販売価格は100、買取価格は10にした（在庫の数量・仕入単価には使わない）。部門は空（連携フラグが0のため必須でない M03-27 L0236-L0237）"
            if longs:
                why += "。255文字の商品コードをCSVの商品コード列に入れる（CSVの商品コード列の最大文字数は M03-27 L0195 に記載が無く、255文字が取り込めるかは実機で確かめる）"
        assert new != old, sid
        O.append([sid, "直す", new, "", BASIS, why])
    write('M04-23', O)
    # ---- M06-12
    hdr, I = load('M06-12'); O = []
    for r in I:
        sid, old = r[0], r[5]
        new, extra = m0612(old)
        assert new != old, sid
        why = "元は販売価格を「任意の値」としていたので、基準価格と同額にした（買取価格は販売価格を上回れない M03-27 L0119）。略称タグは列のID（数値）が分からないため、取り込み後に商品登録編集画面で選ぶ。カード指定で商品名が上書きされるので入れ直す"
        if extra:
            why += "。" + "、".join(f"「{x}」" for x in extra) + "は元が状態SPの規格だけを作っていたが、CSVが状態ニアミントの規格を1件作るため余る（状態SPの規格は元のとおり新規作成で足す）。ケースは買取明細のCSV出力を見るだけで、この余るニアミントの規格は明細に紐づかない"
        O.append([sid, "直す", new, "", BASIS, why])
    write('M06-12', O)

run()
