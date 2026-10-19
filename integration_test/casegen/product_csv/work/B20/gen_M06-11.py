import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B20")
from common import *

SENT = re.compile(r"(?:商品登録で|同じ手順で商品名)[^。]*。")
recs = []
for s in read_in("M06-11"):
    sid = s["シードID"]; n = sid.split("-")[-1]
    old = s["投入方法"]
    sents = list(SENT.finditer(old))
    assert sents, sid
    prods = []  # across sentences, in order
    groups = []  # per sentence list of products
    for m in sents:
        t = m.group(0); grp = []
        if t.startswith("同じ手順で"):
            for nm, cd, b in re.findall(r"商品名\(日\)「(.+?)」・商品コード「(.+?)」・基準価格\(円\)「(\d+)」", t):
                grp.append(dict(name=nm, code=cd, base=int(b), card=True, tag=None, lang="JP", state="NM", shelf=None, sale=None))
        elif "操作を、" in t:   # THRESHOLD 形式
            for blk in re.split(r"(?=商品名\(日\)「)", t.split("操作を、")[1])[1:]:
                nm = re.match(r"商品名\(日\)「(.+?)」", blk).group(1)
                b = int(re.search(r"基準価格\(円\)「(\d+)」", blk).group(1))
                sp = re.search(r"販売価格\(円\)「(\d+)」", blk)
                grp.append(dict(name=nm, code=None, base=b, card=True, tag=None, lang="JP", state="NM", shelf=None, sale=int(sp.group(1)) if sp else None))
        else:
            card = "カード指定をせずに" not in t
            nm = re.search(r"商品名\(日\)に「(.+?)」", t).group(1)
            tag = re.search(r"略称タグに「(.+?)」", t)
            lg = re.search(r"言語「(.+?)」", t); st = re.search(r"状態「(.+?)」", t)
            b = int(re.search(r"基準価格\(円\)に?「(\d+)」", t).group(1))
            sp = re.search(r"販売価格\(円\)に?「(\d+)」", t)
            sh = re.search(r"棚番号「(.+?)」", t)
            cd = re.search(r"商品コードに「(.+?)」", t)
            grp.append(dict(name=nm, code=cd.group(1) if cd else None, base=b, card=card, tag=tag.group(1) if tag else None,
                            lang=lg.group(1) if lg else "JP", state=st.group(1) if st else "NM", shelf=sh.group(1) if sh else None,
                            sale=int(sp.group(1)) if sp else None))
        groups.append(grp)
    allp = [p for g in groups for p in g]
    per_name = all((p["name"] + "用") in old for p in allp if p["card"])
    # 001 / 025: 最初の文の商品コードはその文に、続く文は「同じ手順」
    ci = 0
    for p in allp:
        if p["code"] is None:
            p["code"] = p["name"] if p["name"].startswith("M0611-") else f"M0611-{n}-{p['name']}"
        if p["card"]:
            ci += 1
            p["cardph"] = (f"{p['name']}用に登録したカード詳細" if per_name else f"カード管理で{ci}件目に登録したカード詳細")
    # 置換文を作る
    repl = []
    for grp in groups:
        rows = []
        for p in grp:
            lg = p["lang"]
            lang_csv = LANG["EN"] if lg == "EN" else LANG["JP"]
            rows.append(dict(code=p["code"], name_ja=p["name"], name_en=p["name"], base=p["base"], buy=100, lang=lang_csv, br=1))
        txt = csv_step(rows)
        for p in grp:
            if p["card"]:
                txt += card_edit(p["code"], None, p["name"], p["name"], p["cardph"], "単体カードのカテゴリ",
                                 extra=(f"略称タグに「{p['tag']}」を選び、" if p["tag"] else ""))
            else:
                if p["tag"]:
                    txt += open_product(p["code"]) + f"、略称タグに「{p['tag']}」を選び、割引率に販売割引率に登録済みのものを選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。"
            lg = p["lang"]; st = p["state"]
            lang_label = {"JP": "日本語", "EN": "英語"}.get(lg, lg)
            inplace = (st == "NM" and lg in ("JP", "EN"))
            parts = []
            if p["shelf"]:
                parts.append(f"棚番号に{p['shelf']}")
            if inplace:
                fields = ""
                if p["sale"] is not None:
                    fields += f"セールフラグにチェックを入れ、販売価格(円)に{p['sale']}"
                    fields += "を入れ、" if not parts else "、"
                    fields = fields if parts == [] else fields
                if parts:
                    fields = ("セールフラグにチェックを入れ、販売価格(円)に%d、" % p["sale"] if p["sale"] is not None else "") + "、".join(parts) + "を入れ、"
                elif p["sale"] is None:
                    fields = ""
                if parts or p["sale"] is not None:
                    txt += spec_inplace(lang_label, fields + "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで")
            else:
                c2 = p["code"] + "-S"
                f = f"商品コードに「{c2}」、基準価格(円)に{p['base']}、販売価格(円)に{p['base']}、買取価格(円)に100" + ("、" + "、".join(parts) if parts else "") + "を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで"
                txt += spec_new_and_delete(p["code"], lang_label if lg in ("JP","EN") else lg, st, f)
        repl.append(txt)
    # 元の文を順に置換
    new = old
    for m, r in zip(reversed(sents), reversed(repl)):
        new = new[:m.start()] + r + new[m.end():]
    assert "商品登録でカード指定" not in new and "商品規格登録を開いて" not in new, sid
    why = "商品の新規登録はグッズ商品CSV登録にした。元が「任意の値」だった商品コード・商品名(英)（商品名(日)と同じにした）・買取価格(100)・原価単価(100)は具体値にした。商品カテゴリは元の指定が無いので、カード商品は単体カードのカテゴリにした。" \
          "状態・言語は新規登録のときだけ選べる（M03-09 L0130〜L0134）ので、日本語・英語のニアミントは取り込みで作られた規格をそのまま使い、棚番号とセールフラグだけ規格の画面で直す。"
    if any(not (p["state"] == "NM" and p["lang"] in ("JP", "EN")) for p in allp):
        why += "／ケースに影響: 状態がHPまたは日本語・英語以外の言語の商品は、取り込みで作られた日本語・NMの規格を削除して使う（論理削除なら削除済みの規格の行がDBに残る）。買取詳細の商品追加で商品名を検索したときに削除前の規格が出ないことを確かめる。"
    if any(p["sale"] is not None for p in allp):
        why += "／セール中価格は元のとおり規格の画面でセールフラグと販売価格を入れる（CSVでは販売価格＝基準価格になる）。"
    recs.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075〜L0077・L0092・L0105・L0111・L0116・L0129、M03-09 L0085〜L0087・L0130〜L0134・L0157・L0159・L0183・L0196〜L0198", why])
write_out("M06-11", recs)
