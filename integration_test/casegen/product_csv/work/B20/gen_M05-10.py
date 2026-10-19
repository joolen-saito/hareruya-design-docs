import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B20")
from common import *

STOCK = "在庫変更CSV登録画面で、商品コード{codes}それぞれの在庫増減数に10を入れたCSVを取り込む。"
LANGMAP = {"日本語": ("JP", "日本語"), "英語": ("EN", "英語"), "中国語": ("ZH", "中国語")}
recs = []

def stock(codes):
    return STOCK.format(codes="".join(f"「{c}」" for c in codes))

for s in read_in("M05-10"):
    sid = s["シードID"]; n = sid.split("-")[-1]
    old = s["投入方法"]
    parts = re.split(r"(?<=。)(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫])", old)
    new = []; note = []; effect = []
    for p in parts:
        if not (("商品登録編集画面" in p) and p[0] in "③④"):
            if p.startswith("⑤") and "続けて管理画面の商品登録編集画面で③の商品を開き" in p:
                p = p.replace("「変更後商品A」に書き換えて「商品を登録」を押す", "「変更後商品A」に書き換え、割引率に販売割引率に登録済みのものを選んで「商品を登録」を押す")
                note.append("⑤の商品名の書き換え（既存の商品の編集）に、編集で必須の割引率の選択を足した")
            new.append(p); continue
        mark = p[0]
        if mark == "③":
            # 通常商品（カード指定なし）
            m = re.search(r"商品名に(?:他の商品と区別できる任意の値|「(.+?)」)、販売価格に(\d+)、在庫数に購入できる数を入れ", p)
            price = int(m.group(2)); fixed = m.group(1)
            cnt = re.search(r"計(\d+)件", p)
            cnt = int(cnt.group(1)) if cnt else 1
            has_branch = "支店の管理者でログイン" in p
            rows = []
            if fixed:
                rows.append(dict(code=f"M0510-{n}-A", name_ja=fixed, name_en=f"M0510-{n}-A", base=price, buy=10, br=0))
            else:
                for k in range(cnt):
                    tag = f"{k+1:02d}" if cnt > 3 else "ABCDEFGH"[k]
                    rows.append(dict(code=f"M0510-{n}-P{tag}", name_ja=f"M0510-{n}-商品{tag}", name_en=f"M0510-{n}-Item{tag}", base=price, buy=10, br=0))
            if has_branch:
                m2 = re.search(r"支店の管理者でログインした管理画面の商品登録編集画面でも、商品名に他の商品と区別できる任意の値、販売価格に(\d+)", p)
                rows.append(dict(code=f"M0510-{n}-S", name_ja=f"M0510-{n}-支店商品", name_en=f"M0510-{n}-BranchItem", base=int(m2.group(1)), buy=10, br=1))
            lead = "③ 商品を" + (f"{len(rows)}件" if len(rows) > 1 else "1件") + "作る。"
            if has_branch:
                lead = "③ 商品を本店用に2件、支店用に1件作る（支店用の1件は支店の商品公開ステータスを1（公開）にし、本店用の2件は0（非公開）にする）。"
            txt = lead + csv_step(rows) + stock([r["code"] for r in rows])
            new.append(txt)
            effect.append(f"通常商品{len(rows)}件")
            continue
        # ④ カード指定あり/なし混在の並び確認商品
        admin = "本店の管理者でログインした" if "本店の管理者でログインした" in p else "支店の管理者でログインした"
        items = []
        for it in re.split(r"(?=商品名に「)", p)[1:]:
            name = re.match(r"商品名に「(.+?)」", it).group(1)
            card = "「カード指定 >」で③のカードを選び" in it
            cat = re.search(r"商品カテゴリに(カード|グッズ)", it).group(1)
            tagm = re.search(r"略称タグに(TAG-[AB]-M0510-\d+)", it)
            lm = re.search(r"言語に(日本語|英語|中国語)", it)
            sm = re.search(r"状態に(NM|HP)", it)
            sh = re.search(r"棚番号に([AB]-0\d-M0510-\d+)", it).group(1)
            items.append(dict(name=name, card=card, cat=cat, tag=tagm.group(1) if tagm else None,
                              lang=lm.group(1) if lm else "日本語", state=sm.group(1) if sm else "NM", shelf=sh))
        br = 1 if admin.startswith("支店") else 0
        rows = []
        for i, it in enumerate(items):
            lk = LANGMAP[it["lang"]][0]
            it["code"] = f"M0510-{n}-" + "ABCDEFGH"[i]
            rows.append(dict(code=it["code"], name_ja=it["name"], name_en=it["name"], base=100, buy=10, br=br,
                             lang=LANG.get(lk, LANG["JP"])))
        txt = f"{mark} {admin}管理画面で商品を作る（商品登録画面は使えないので、グッズ商品CSV登録で取り込んで既存の商品として編集する）。" + csv_step(rows)
        final_codes = []
        for it in items:
            lk = LANGMAP[it["lang"]][0]
            inplace = (it["state"] == "NM" and lk in ("JP", "EN"))
            if it["card"]:
                txt += card_edit(it["code"], None, it["name"], it["name"], f"③で登録した{it['name']}用のカードのカード詳細", "カテゴリ「カード」", extra=f"略称タグに「{it['tag']}」を選び、")
            else:
                txt += open_product(it["code"]) + f"、商品カテゴリはサプライ・グッズの選択を外してカテゴリ「グッズ」を選び、割引率に販売割引率に登録済みのものを選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。"
            if inplace:
                txt += spec_inplace(it["lang"], f"棚番号に{it['shelf']}を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで")
                final_codes.append(it["code"])
            else:
                c2 = it["code"] + "-S"
                txt += spec_new_and_delete(it["code"], it["lang"], it["state"],
                                           f"商品コードに「{c2}」、基準価格(円)に100、販売価格(円)に100、買取価格(円)に10、棚番号に{it['shelf']}を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで")
                final_codes.append(c2)
        txt += stock(final_codes)
        new.append(txt)
        effect.append(f"並び確認商品{len(items)}件（カード{sum(1 for i in items if i['card'])}）")
    nn = "".join(new)
    assert "商品登録編集画面で商品を登録" not in nn
    why = "商品の新規登録はグッズ商品CSV登録にした。商品名・価格・公開は元のとおりで、元が「任意の値」だった商品名・商品コード・買取価格(10)・原価単価(100)は具体値にした。" \
          "元は商品登録画面で在庫数を入れていたが、規格の画面では在庫数を変えられない（M03-09 L0097）ので在庫変更CSV登録で入れる（承認の要否は設計書未確認）。" \
          "棚番号と状態・言語は元は商品登録画面の入力だったが、刷新後は規格の項目（M03-09 識別ID23、L0130〜L0134）なので規格の画面で入れる。"
    if note: why += "／" + "／".join(note)
    if "規格を先に作る" in nn or "最後の1件のときは削除できない" in nn and "「新規作成」を押し" in nn:
        why += "／ケースに影響: 状態がHPまたは日本語以外の言語の商品は、取り込みで作られた日本語・NMの規格を削除して使う（論理削除なら削除済みの規格の行がDBに残る）。受注明細の規格はこの新しい規格を追加する。"
    recs.append([sid, "直す", nn, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075〜L0077・L0092・L0105・L0111・L0116・L0129、M03-09 L0097・L0130〜L0134・L0157・L0159・L0183・L0196〜L0198", why])
write_out("M05-10", recs)
