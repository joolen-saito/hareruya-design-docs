import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B20")
from common import *

S2 = re.compile(r"管理画面の商品登録画面で「カード指定」を押し.*?（〔商品ID-(M0326-\w+)〕）。")
S3 = re.compile(r"商品編集画面の「この商品の規格を確認」から商品規格一覧を開いて「新規登録」を押し、商品規格登録画面で.*?「商品規格を登録」を押す。")
S4 = re.compile(r"【画面4 2件目】[^【]*")

def num(x, default):
    return int(x) if re.fullmatch(r"\d+", x) else default

def parse_spec(seg3):
    st = re.search(r"状態=([A-Z]+|任意の1つ)", seg3).group(1)
    b = num(re.search(r"基準価格\(円\)=(\S+?)、", seg3).group(1), 300)
    s = num(re.search(r"販売価格\(円\)=(\S+?)、", seg3).group(1), b)
    k = num(re.search(r"買取価格\(円\)=(\S+?)、", seg3).group(1), 100)
    fl = re.search(r"セールフラグ=(\S+?)、", seg3).group(1) == "チェックする"
    showcase = "部門=ショーケース品" in seg3
    sm = "スマレジ連携フラグ=連携する" in seg3
    return dict(state="NM" if st == "任意の1つ" else st, base=b, sale=s, buy=k, saleflag=fl, showcase=showcase, smaregi=sm)

def build_product(sid, lbl, card_lbl, text2, spec, cost=100, code_suffix="CODE", nm_default=None):
    """画面2 + 画面3 の新しい文を返す（画面2側, 画面3側の2つ）"""
    m = re.search(r"商品名に「(.+?)」(で始まる任意の名前)?", text2)
    base_name = m.group(1)
    name_ja = base_name + "-商品" if m.group(2) else base_name
    if nm_default: name_ja = nm_default
    me = re.search(r"商品名\(英\)に「(.+?)」", text2)
    name_en = me.group(1) if me else f"{base_name}-Item"
    code = f"{lbl}-{code_suffix}"
    cats = re.search(r"カテゴリ=カテゴリID(\d+)と(\d+)", text2)
    catph = f"カテゴリID{cats.group(1)}とカテゴリID{cats.group(2)}のカテゴリ" if cats else "単体カードのカテゴリ"
    extra_csv = []
    tg = re.search(r"タグ=タグID(\d+)", text2); sa = re.search(r"売上分析タグ=売上分析タグID(\d+)", text2)
    if sa: extra_csv.append(f"売上分析タグ(ID)は{sa.group(1)}")
    if tg: extra_csv.append(f"タグ(ID)は{tg.group(1)}")
    ds = re.search(r"商品説明に「(.+?)」", text2)
    if ds: extra_csv.append(f"商品説明(日)は「{ds.group(1)}」")
    grp = re.search(r"購入グループ=(通常商品)", text2)
    rt = re.search(r"割引率=ID(\d+)", text2)
    tagname = re.search(r"タグ=「(.+?)」", text2)
    row = dict(code=code, name_ja=name_ja, name_en=name_en, base=spec["base"], buy=spec["buy"], lang="1", cost=cost,
               extra="・".join(extra_csv), group=(f"「{grp.group(1)}」" if grp else "既存の購入グループの名称"))
    t2 = csv_step([row]).replace("言語(ID)は1", "言語(ID)は1")
    t2 += card_edit(code, f"商品ID-{lbl}", name_ja, name_en, f"画面1で登録したカードをカード名で検索して〔カード詳細ID-{card_lbl}〕のカード詳細", catph,
                    extra=(f"タグに「{tagname.group(1)}」を選び、" if tagname else ""),
                    rate=(f"ID{rt.group(1)}の割引率" if rt else "販売割引率に登録済みのもの"))
    return t2, row, code

def spec_text(spec, code, smaregi_tail=""):
    """画面3側の新しい文と、末尾に足す文(削除)を返す"""
    st = spec["state"]
    bu = "部門はショーケース品を選び" if spec["showcase"] else "部門は選択肢の先頭を選び"
    sm = "スマレジ連携フラグに「連携する」を選び、" if spec["smaregi"] else "スマレジ連携フラグは「連携しない」のまま、"
    sale = f"セールフラグにチェックを入れ、" if spec["saleflag"] else ""
    if st == "NM":
        # CSV の規格(言語ID1・NM)を使う
        need = spec["saleflag"] or spec["smaregi"] or spec["showcase"]
        if not need:
            return (spec_list_open() + f"商品規格一覧で言語が言語ID1に当たる言語・状態NMの規格（取り込みで作られた規格。基準価格{spec['base']}・販売価格{spec['sale']}・買取価格{spec['buy']}）の公開ステータスが「公開」であることを確かめる（異なるときは規格の行を開き、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す）。"), ""
        fields = (f"{sale}" + (f"販売価格(円)に{spec['sale']}、" if spec["saleflag"] else "") + f"{sm}{bu}、公開ステータスに「公開」を選んで")
        return spec_inplace("（言語ID1に当たる言語）", fields.replace("、、", "、")), ""
    # 非NM: 新しい規格 + 削除
    fields = (f"商品コードは空のまま、基準価格(円)に{spec['base']}、販売価格(円)に{spec['sale']}、" + (f"セールフラグにチェックを入れ、" if spec["saleflag"] else "セールフラグはチェックせず、") +
              f"買取価格(円)に{spec['buy']}を入れ、{bu}、{sm}公開ステータスに「公開」を選んで")
    new = spec_list_open() + f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に言語ID1に当たる言語、状態に{st}を選び、{fields}「商品規格を登録」ボタンを押す。"
    delete = (f"商品規格一覧で言語が言語ID1に当たる言語・状態NMの規格（取り込みで作られた規格。商品コード「{code}」）の行を開き、商品規格登録編集画面の「商品規格を削除」ボタンを押して削除する（規格が最後の1件のときは削除できないので、新しい規格を先に作る）。")
    return new, delete

recs = []
for s in read_in("M03-26"):
    sid = s["シードID"]; old = s["投入方法"]; n = sid.replace("S-M03-26-", "")
    if "ABOLISHMIX" in sid:
        recs.append([sid, "直さない", "", "", "M03-02 L0075〜L0077、M03-26 L0165",
                     "商品登録画面ではなくカード商品CSV登録で商品を作る書き方に、すでに直してある。直さない。ただし商品の規格の数・価格は選んだ割引率に登録されたカード状態ごとに決まる（M03-26 L0150・L0165）ので、ケースの前提（状態NM・基準価格250の規格が商品ごとに1件）と合うかは実行して確かめる。"])
        continue
    m2 = S2.search(old); lbl = m2.group(1)
    cardm = re.search(r"〔カード詳細ID-(M0326-\w+)〕のカード詳細を選ぶ", m2.group(0)); card_lbl = cardm.group(1)
    m3 = S3.search(old)
    seg3 = re.search(r"【画面3 商品規格】.*?(?=【|$)", old)
    cost = 120 if "COST-057" in sid else 100
    effect = []
    if m3 is None:
        # 029: 規格なし
        spec = dict(state="NM", base=300, sale=300, buy=100, saleflag=False, showcase=False, smaregi=False)
        t2, row, code = build_product(sid, lbl, card_lbl, m2.group(0), spec, cost)
        new = old[:m2.start()] + t2 + old[m2.end():]
        effect.append("元は商品に規格が無かったが、グッズ商品CSVは状態ニアミントの規格を1件作るので、商品に規格が1件付く（このケースは別の商品が持つカード詳細の行を飛ばすことを確かめるので影響は小さい）")
    else:
        spec = parse_spec(seg3.group(0))
        if "025" in sid and "SMART" in sid: spec.update(state="NM")
        t2, row, code = build_product(sid, lbl, card_lbl, m2.group(0), spec, cost, nm_default=("M0326-025-商品A" if sid.endswith("SMART-025") else None))
        t3, delete = spec_text(spec, code)
        # 画面3 の先頭の1文を置換、削除文は画面3の末尾へ
        new = old[:m2.start()] + t2 + old[m2.end():]
        m3 = S3.search(new)
        new = new[:m3.start()] + t3 + new[m3.end():]
        if delete:
            seg = re.search(r"【画面3 商品規格】.*?(?=【|$)", new)
            new = new[:seg.end()] + delete + new[seg.end():]
            effect.append("状態がNM以外の規格は、取り込みで作られた言語ID1・NMの規格を、新しい規格を足したあとで削除して、ケースの前提（その状態の規格1件）に合わせる。削除が論理削除なら削除済みの規格の行がDBに残る")
    # 025 の画面4（2件目）
    m4 = S4.search(new)
    if m4 and "2件目" in m4.group(0):
        bl = re.search(r"〔商品ID-(M0326-\w+)〕", m4.group(0)).group(1)
        cl = re.search(r"〔カード詳細ID-(M0326-\w+)〕", m4.group(0)).group(1)
        m2b = m2.group(0).replace(f"〔カード詳細ID-{card_lbl}〕", f"〔カード詳細ID-{cl}〕").replace(f"〔商品ID-{lbl}〕", f"〔商品ID-{bl}〕")
        t2b, rowb, codeb = build_product(sid, bl, cl, m2b, spec, cost, nm_default="M0326-025-商品B")
        t3b, delb = spec_text(spec, codeb)
        new = new[:m4.start()] + "【画面4 2件目】画面2・画面3と同じ操作をもう一度行う（商品コードと商品名は1件目と重ならない値にする）。" + t2b + t3b + delb + new[m4.end():]
    # 検査
    assert "商品登録画面で「カード指定」" not in new and "「新規登録」を押し、商品規格登録画面" not in new, sid
    why = "商品の新規登録はグッズ商品CSV登録にした（商品コード・商品名(日)(英)・原価単価は元が任意だったので具体値、商品名は元の接頭辞に「-商品」を足した）。カードはグッズ商品の取り込み後に商品登録編集画面の「カード指定 >」で付ける。" \
          "商品カテゴリ・タグ・売上分析タグ・商品説明は元の値（カテゴリはCSVでは選べないので編集画面で付け替える。M03-27 L0123）。"
    if spec["state"] != "NM":
        pass
    if effect:
        why += "／ケースに影響: " + "。".join(effect) + "。"
    if "SMART" in sid or spec.get("smaregi"):
        why += "／スマレジ連携: 連携する規格は元どおり規格の画面で連携フラグを入れて作る（取り込みでは連携フラグ0で作るため）。スマレジ商品コードの採番はこの操作で行われる。"
    recs.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075〜L0077・L0092・L0111・L0116・L0129、M03-09 L0085〜L0087・L0130〜L0134・L0159・L0183・L0196〜L0198", why])
write_out("M03-26", recs)
