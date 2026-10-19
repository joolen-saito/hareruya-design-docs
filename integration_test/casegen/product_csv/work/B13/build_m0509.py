import sys, re
sys.path.insert(0, '/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B13')
from common import *

BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0073・L0075〜L0077・L0091-L0130、M03-09 L0123-L0172・L0197-L0198、M12-10 L0080-L0098（在庫編集の承認）"
QTY = 10

COMMON = ("元のシードは商品名・商品コード・販売価格・在庫数を「入れて」としか書いていない（値の指定が無い）ので、商品コードを M0509-<番号>-P<連番>、商品名は商品コードと同じ、価格は基準1000・販売1000・買取100、在庫数は10にした。"
          "グッズ商品CSVには在庫の列が無く、取り込みで作られる在庫は数量0（M03-27 L0129）なので、在庫数は在庫編集（入庫）の登録と別の管理者による承認で入れる。"
          "商品カテゴリ・サイズ・重量・購入グループ・原価単価・地域別販売制限は元のシードに無いため、サプライ・グッズのカテゴリID・1・1・既存の購入グループ・10・0（日英両サイト）を入れた。"
          "支店の公開は、元のシードが公開と書いたときだけ1（公開）、ほかは0（非公開）にした")


def pcode(n, k, w=1):
    return f"M0509-{n}-P{k:0{w}d}"


def stock_block(items, qty=QTY):
    """items: [(code, [loc,...])]"""
    out = []
    cnt = 0
    for code, locs in items:
        for loc in locs:
            out.append(stock_hq(code, qty, loc))
            cnt += 1
    out.append(f"その別の管理者で管理画面に入り、在庫編集承認一覧で上の{cnt}件の在庫編集を選択して「一括承認」を押し、確認で「承認する」を押し、在庫検索一覧で各商品の在庫数が{qty}であることを確かめる")
    return out


def simple(n, count, branches=None, names=None, prices=None, w=1, locs_for=None):
    branches = branches or [0] * count
    rows, items = [], []
    for k in range(1, count + 1):
        code = pcode(n, k, w)
        nm = (names or {}).get(k, code)
        sale = (prices or {}).get(k, 1000)
        rows.append(csv_row(code, nm, nm if not nm.isascii() else nm, 'JP', branches[k - 1], "", sale, sale, sale // 10))
        items.append((code, ["本店"] + (["TC大阪支店"] if branches[k - 1] else [])))
    return [csv_upload(rows)] + stock_block(items)


CFG = {}  # seed number -> function returning sentences


def cfg(n, **kw):
    CFG[n] = kw


for n, count in [("001", 2), ("002", 2), ("003", 1), ("004", 2), ("007", 1), ("008", 2), ("009", 3), ("010", 2), ("012", 1), ("013", 1), ("014", 2), ("015", 2),
                 ("016", 1), ("018", 1), ("019", 1), ("020", 1), ("021", 1), ("022", 2), ("023", 1), ("024", 2), ("025", 1), ("026", 30), ("027", 31),
                 ("028", 1), ("029", 2), ("041", 1), ("042", 1), ("045", 1)]:
    cfg(n, count=count)
CFG["001"]['branches'] = [1, 1]
CFG["015"]['branches'] = [1, 1]
CFG["022"]['branches'] = [0, 1]
CFG["022"]['prices'] = {1: 1000, 2: 2000}
CFG["025"]['names'] = {1: "受注時商品名"}
CFG["045"]['branches'] = [1]
CFG["026"]['w'] = 2
CFG["027"]['w'] = 2

PRODSENT = re.compile(r"^管理画面の商品登録編集画面で商品名")

# ---- 並び順の種類（カードのカテゴリの商品）
DEF_TAG = "略称タグは選択肢の先頭を選び"


def card_product_steps(n, prods, branch, card_qual, frag):
    out = []
    kcards = sum(1 for p in prods if p.get('card', True))
    q = f"管理画面のカード登録画面で日本語カード名・英語カード名を入れ、カード詳細にカード番号・レアリティ・Foilを入れて登録ボタンを押す（商品ごとに1枚、{kcards}枚を登録する"
    q += ("。" + card_qual) if card_qual else ""
    q += ("。" + frag) if frag else "）"
    out.append(q)
    rows = []
    for p in prods:
        sale = p.get('price', 1000)
        rows.append(csv_row(p['code'], p['name'], p['name'], p.get('lang', 'JP'), branch, "", sale, sale, sale // 10))
    out.append(csv_upload(rows) + "（行は登録の順に並べる）")
    card_i = 0
    for p in prods:
        e = f"商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
        if p.get('card', True):
            card_i += 1
            e += f"「カード指定 >」ボタンを押し、カード検索ポップアップで{card_i}枚目に登録したカード詳細の行の決定ボタンを押す。続けて商品名(日)に「{p['name']}」、商品名(英)に「{p['name']}」を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、"
        e += p.get('tagtext', DEF_TAG) + "、"
        e += DISC + "て「商品を登録」ボタンを押す"
        e = e.replace("選びて", "選んで")
        out.append(search(p['code']))
        out.append(e)
        out.append(SPEC_OPEN_FROM_EDIT)
        lang = p.get('lang', 'JP')
        ex = ""
        if p.get('shelf'):
            ex += f"棚番号に「{p['shelf']}」を入れ、"
        if p.get('state', 'NM') == 'NM':
            out.append(spec_edit(lang, ex))
        else:
            out.append(f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態にHP（ヘビープレイド）、商品コードに「{p['name']}」、基準価格(円)・販売価格(円)に1000円、買取価格(円)に100円を入れ、{ex}部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す")
            out.append("商品規格一覧で状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す")
    return out


def sort_cfg():
    """n -> (prods, branch, card_qual, location)"""
    S = {}
    S['030'] = ([dict(code="M0509-030-GOODS", name="M0509-030-GOODS", card=False, shelf="M0509-030-A01"),
                 dict(code="M0509-030-CARD", name="M0509-030-CARD", shelf="M0509-030-B02")], 0,
                "商品M0509-030-GOODSのカードは登録しない（商品M0509-030-GOODSはカードのカテゴリとカード詳細を付けない）。ほかの値は2件とも同じにする", "本店")
    S['031'] = ([dict(code="M0509-031-JP", name="M0509-031-JP", lang='JP', shelf="M0509-031-B02"),
                 dict(code="M0509-031-EN", name="M0509-031-EN", lang='EN', shelf="M0509-031-A01")], 0, "ほかの値は2枚とも同じにする", "本店")
    S['032'] = ([dict(code="M0509-032-EN", name="M0509-032-EN", lang='EN', shelf="M0509-032-A01"),
                 dict(code="M0509-032-JP", name="M0509-032-JP", lang='JP', shelf="M0509-032-B02")], 1, "ほかの値は2枚とも同じにする", "TC大阪支店")
    S['033'] = ([dict(code="M0509-033-KR", name="M0509-033-KR", lang='KR'), dict(code="M0509-033-EN", name="M0509-033-EN", lang='EN'),
                 dict(code="M0509-033-JP", name="M0509-033-JP", lang='JP')], 0, "ほかの値は3枚とも同じにする", "本店")
    S['034'] = ([dict(code="M0509-034-HP-NM", name="M0509-034-HP", state='HP'), dict(code="M0509-034-NM", name="M0509-034-NM")], 0, "ほかの値は2枚とも同じにする", "本店")
    S['035'] = ([dict(code="M0509-035-FOIL", name="M0509-035-FOIL"), dict(code="M0509-035-PLAIN", name="M0509-035-PLAIN")], 0,
                "商品M0509-035-FOILのカードはFoilあり、商品M0509-035-PLAINのカードはFoilなし、ほかの値は2枚とも同じにする", "本店")
    S['036'] = ([dict(code="M0509-036-B", name="M0509-036-B", tagtext="略称タグに略称タグM0509-036-BBBを選び"),
                 dict(code="M0509-036-A", name="M0509-036-A", tagtext="略称タグに略称タグM0509-036-AAAを選び")], 0, "ほかの値は2枚とも同じにする", "本店")
    S['037'] = ([dict(code="M0509-037-C", name="M0509-037-C"), dict(code="M0509-037-M", name="M0509-037-M")], 0,
                "商品M0509-037-CのカードはレアリティC、商品M0509-037-MのカードはレアリティM、ほかの値は2枚とも同じにする", "本店")
    S['038'] = ([dict(code="M0509-038-B", name="M0509-038-B"), dict(code="M0509-038-W", name="M0509-038-W")], 0,
                "カード登録画面の色の並びで、商品M0509-038-Bのカードに色M0509-038-BLUE、商品M0509-038-Wのカードに色M0509-038-WHITEを選び、ほかの値は2枚とも同じにする", "本店")
    S['039'] = ([dict(code="M0509-039-N10", name="M0509-039-N10", tagtext="略称タグに略称タグM0509-039-TAGを選び"),
                 dict(code="M0509-039-N02", name="M0509-039-N02", tagtext="略称タグに略称タグM0509-039-TAGを選び")], 0,
                "商品M0509-039-N10のカードはカード番号010・英語カード名M0509-039 Alpha Card、商品M0509-039-N02のカードはカード番号002・英語カード名M0509-039 Zulu Card、ほかの値は2枚とも同じにする", "本店")
    S['040'] = ([dict(code="M0509-040-ZULU", name="M0509-040-ZULU", tagtext="略称タグに略称タグM0509-040-TAGを選び"),
                 dict(code="M0509-040-ALPHA", name="M0509-040-ALPHA", tagtext="略称タグに略称タグM0509-040-TAGを選び")], 0,
                "商品M0509-040-ZULUのカードは英語カード名M0509-040 Zulu Card・カード番号002、商品M0509-040-ALPHAのカードは英語カード名M0509-040 Alpha Card・カード番号010、ほかの値は2枚とも同じにする", "本店")
    S['043'] = ([dict(code="M0509-043-A", name="M0509-043-A", price=1500), dict(code="M0509-043-B", name="M0509-043-B", price=2800)], 0, "ほかの値は2枚とも同じにする", "本店")
    S['044'] = ([dict(code="M0509-044-A", name="M0509-044-A", price=1000), dict(code="M0509-044-B", name="M0509-044-B", price=1000)], 0, "ほかの値は2枚とも同じにする", "本店")
    return S


SORT = sort_cfg()


def build_sort(n, frag):
    prods, branch, qual, loc = SORT[n]
    out = card_product_steps(n, prods, branch, qual, frag)
    items = [(p['name'] if p.get('state') == 'HP' else p['code'], [loc]) for p in prods]
    out += stock_block(items)
    return out


def convert(sid, old):
    n = sid.rsplit("-", 1)[1]
    sents = old.split("。")
    trailing = sents[-1] == ""
    if trailing:
        sents = sents[:-1]
    out = []
    i = 0
    done = False
    while i < len(sents):
        s = sents[i]
        if n in SORT and s.startswith("管理画面のカード登録画面で日本語カード名"):
            frag = sents[i + 1] if sents[i + 1].startswith("登録は") else None
            out.extend(build_sort(n, frag))
            i += 2 if frag else 1
            done = True
            continue
        if n in CFG and PRODSENT.match(s) and "その商品を開き" not in s:
            c = CFG[n]
            out.extend(simple(n, c['count'], c.get('branches'), c.get('names'), c.get('prices'), c.get('w', 1)))
            i += 1
            done = True
            continue
        if n == "025" and s.startswith("管理画面の商品登録編集画面でその商品を開き、商品名を「変更後商品名」に変えて登録ボタンを押す"):
            s = s.replace("に変えて登録ボタンを押す", "に変え、" + DISC + "て登録ボタンを押す").replace("選びて", "選んで")
        out.append(s)
        i += 1
    assert done, sid
    return "。".join(out) + ("。" if trailing else "")


def main():
    h, rows = load("M05-09")
    res = ["\t".join(["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"])]
    for r in rows:
        sid = r[0]
        n = sid.rsplit("-", 1)[1]
        new = convert(sid, r[5])
        reason = COMMON
        if n in SORT:
            reason = ("元のシードは1文の中でカード登録・商品登録・商品規格・在庫数をまとめて書いているので、カード登録（商品ごとに1枚）→グッズ商品CSV登録（登録の順に行を並べる）→商品ごとに商品登録編集画面でカード指定・単体カードのカテゴリ・略称タグ・割引率→商品規格の編集（棚番号・部門・公開）→在庫の入庫と承認に分けた。"
                      "カードの名称・番号・レアリティ・Foil・色は元のシードの括弧書きのとおりにし、書かれていないものは「ほかの値は同じ」のままにした。棚番を書いていないシードは棚番を入れない（全商品が未設定で同じ）。略称タグを書いていないシードは選択肢の先頭を選ぶ。"
                      "CSVで商品IDが行の順に大きくなる前提（元のシードの「登録の順が小さい方が後に並ぶ側」）。" + COMMON)
            if n == '034':
                reason += "。ケースに影響: 状態HPの商品M0509-034-HPは、取り込みでできるニアミントの規格を削除して（論理削除 M03-09 L0198）HPの規格だけにした。削除済みのニアミント規格はDBに残る"
            if n == '030':
                reason += "。商品M0509-030-GOODSは元のシードどおりカードを付けず、サプライ・グッズのカテゴリのまま"
        if n == '025':
            reason += "。元のシードの末尾の「商品名を変更後商品名に変えて登録」は、グッズ商品CSVが割引率を持たず編集で割引率が必須になる（M03-02 L0146）ため、割引率を選ぶ手順だけ足した"
        if n in ('026', '027'):
            reason += f"。商品を{'30' if n == '026' else '31'}件作るので、CSVは{'30' if n == '026' else '31'}行、在庫の入庫も同数。ケースに影響: 件数は同じで、商品名・商品コードだけが元のシードで未指定だった"
        if n in ('001', '015', '022', '045', '032') and n not in SORT:
            reason += "。支店で買う商品には支店の在庫（TC大阪支店）も入れた"
        res.append("\t".join([sid, "直す", new, "", BASIS, reason]))
    (P / "out/M05-09.tsv").write_text("\n".join(res) + "\n", encoding="utf-8")


if __name__ == '__main__':
    main()
