import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *
from gen_a import rows, write

PROD_SUP = re.compile(r"商品登録画面で商品名\(日\)に「(.+?)」を入れ、カード指定をせず(?:（サプライ品）)?、(?:略称タグに「(.+?)」を選び、)?公開状態を「公開」にし、ほかの必須項目に任意の値を入れて「商品を登録」ボタンを押す")
PROD_CARD = re.compile(r"商品登録画面でカード指定のカード検索からカード名\(日\)「(.+?)」のカード詳細を選び、商品名\(日\)に「(.+?)」を入れ、略称タグに「(.+?)」を選び、公開状態を「公開」にし、ほかの必須項目に任意の値を入れて「商品を登録」ボタンを押す")
SPEC = re.compile(r"続けて商品規格登録画面で言語に「(JP|EN|FR)」、状態に「(NM|HP)」、商品コードに「(.+?)」(.*)を入れ、ほかの必須項目に任意の値を入れて「商品規格を登録」ボタンを押す")


def parse_spec(rest, whole):
    d = {}
    m = re.search(r"基準価格\(円\)に「(\d+)」", whole)
    d["base"] = int(m.group(1)) if m else None
    m = re.search(r"販売価格\(円\)に「(\d+)」", whole)
    d["sale"] = int(m.group(1)) if m else None
    m = re.search(r"買取価格\(円\)に「(\d+)」", whole)
    d["buy"] = int(m.group(1)) if m else (None if "買取価格(円)に任意の値" in whole else None)
    d["buy_any"] = "買取価格(円)に任意の値" in whole
    m = re.search(r"棚番号に「(.+?)」", whole)
    d["shelf"] = m.group(1) if m else None
    return d


def m0709():
    h, I = rows("M07-09")
    ix = {c: i for i, c in enumerate(h)}
    out = []
    for src in I:
        sid, old = src[0], src[ix["投入方法"]]
        sents = old.split("。")
        new = []
        notes = set()
        hp_codes = []
        sale_hit = False
        i = 0
        any_any = False
        while i < len(sents):
            s = sents[i]
            mc, ms_ = PROD_CARD.fullmatch(s), PROD_SUP.fullmatch(s)
            if not (mc or ms_):
                new.append(s)
                i += 1
                continue
            sp_m = SPEC.fullmatch(sents[i + 1])
            assert sp_m, (sid, sents[i + 1])
            lang = LANG_CODE[sp_m.group(1)]
            state = sp_m.group(2)
            code = sp_m.group(3)
            sd = parse_spec(sp_m.group(4), sents[i + 1])
            base = sd["base"] if sd["base"] is not None else 50
            if sd["base"] is None:
                notes.add(f"「{code}」の基準価格は元に定めが無いので50にした")
            if sd["buy_any"]:
                any_any = True
            buy = sd["buy"] if sd["buy"] is not None else 1
            if buy > base:
                raise SystemExit(f"{sid} buy>{base}")
            if mc:
                card = dict(name=mc.group(1), abbr=mc.group(3))
                ja = mc.group(2)
            else:
                card = None
                ja = ms_.group(1)
            if ms_ and ms_.group(2):
                notes.add(f"「{code}」の略称タグ「{ms_.group(2)}」は元の商品登録画面で選んでいた（サプライ品）ので、取り込み後の商品登録編集画面で選ぶ")
            if (sd["sale"] or base) >= 300:
                sale_hit = True
            csv_code = code if state == "NM" else code.rsplit("-", 1)[0] + "-NM" + code.rsplit("-", 1)[1]
            p = dict(code=csv_code, ja=ja, en=ja, lang=lang, base=base, buy=buy)
            new.append(upload_sentence([p]))
            new.append(after_upload([p]))
            new.append(open_edit(p) + ("" if True else ""))
            # 商品登録編集画面での操作
            edit = []
            if card:
                p2 = dict(p, card=card)
                st = card_steps(p2)
                new[-1] = new[-1] + "。" + st[0]
                new.append(st[1])
            elif ms_ and ms_.group(2):
                new.append(f"略称タグに「{ms_.group(2)}」を選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す")
            new.append("商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く")
            if state == "NM":
                spec = dict(lang=lang, shelf=sd["shelf"])
                if sd["sale"] is not None:
                    spec["sale"] = sd["sale"]
                    if sd["sale"] >= 300 > base:
                        notes.add(f"「{code}」は販売価格が基準価格{base}から{sd['sale']}へ300円の閾値を上向きに跨ぎ、スマレジ連携フラグが連携しないなので、スマレジ連携の確認ポップアップが出たら内容を確かめて登録を続ける（M03-09 L0105〜L0108。連携フラグは0）")
                new.append(first_spec(spec))
            else:
                hp_codes.append(code)
                spec = dict(lang=lang, state=state, code=code, base=base, buy=buy, shelf=sd["shelf"])
                new.append(new_spec(spec))
            i += 2
        method = "。".join(new)
        why = ["元は「ほかの必須項目に任意の値」だった商品の必須項目は、サイズ1・重量1・商品カテゴリはサプライ・グッズ・購入グループ名称は既存の購入グループの名称・原価単価10・商品名(英)は商品名(日)と同じ値にした",
               "基準価格・販売価格・買取価格は、元に値があるものはそのまま（販売価格は基準価格と同額 M03-09 L0086〜L0087）、買取価格が元に「任意の値」だったものは1にした（買取価格は販売価格を上回れない M03-27 L0119）"]
        if any_any is False and not any("買取" in n for n in notes):
            pass
        if hp_codes:
            why.append("ケースに影響: 状態HPの規格はグッズ商品CSVでは作れず（CSVは状態ニアミントの規格だけ M03-27 L0124）、取り込みで余るニアミントの規格（商品コード「" + "」「".join(c.rsplit('-', 1)[0] + '-NM' + c.rsplit('-', 1)[1] for c in hp_codes) + "」・在庫0）ができる。商品コードが重複できない（M03-27 L0134）ので、HPの規格の商品コード「" + "」「".join(hp_codes) + "」は商品規格一覧の「新規作成」で足した。実在庫に入れるのは商品コードで選ぶ規格だけなので、余るニアミントの規格が戻しリストに載ることは無い想定（確かめてはいない）。ケースが商品コードで商品検索するので、余る規格には別の商品コードを付けた")
        why.extend(sorted(notes))
        if sale_hit:
            why.append("スマレジ連携に当たる（販売価格が300円以上の規格がある。CSVのスマレジ連携フラグは0、新しく足す規格は連携しないを選んだ）")
        why = "。".join(why)
        basis = "M03-27 L0092・L0119・L0123・L0124・L0134・L0217・L0219、M03-02 L0075〜L0077・L0092・L0105・L0146、M03-09 L0086〜L0087・L0105"
        out.append([sid, "直す", method, "", basis, why])
    write("M07-09", out)


m0709()
