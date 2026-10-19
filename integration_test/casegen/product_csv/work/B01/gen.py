import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
FID = 'M07-03'
ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{FID}.tsv', encoding='utf-8')]
H, I = ls[0], [x for x in ls[1:] if x and x != ['']]

CAT = "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
UPL = "グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{cols}）。グッズ商品は状態ニアミント・日本語の規格が{n}件ずつ作られる。"

def rowcols(code, name, base, sale, buy, region=False):
    s = (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{name}」・商品名(英)は「{name}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・"
         f"サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10")
    if region: s += "・地域別販売制限は0（日英の両サイト）"
    return s + "・部門IDは空"

def csv_one(code, name, base, sale, buy, region=False):
    return UPL.format(n=1, cols=rowcols(code, name, base, sale, buy, region))

def csv_many(items):
    # items: list of (code,name,base,sale,buy); 複数行
    rows = "。".join(f"{i+1}行目は{rowcols(*it)}" for i, it in enumerate(items))
    return UPL.format(n=len(items), cols=rows)

def card_edit(code, name, cardsel):
    s = (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
         f"「カード指定 >」ボタンを押し、カード検索ポップアップで{cardsel}、決定ボタンを押す。続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、")
    return s

def card_tail(tag=None):
    s = "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、"
    if tag: s += f"略称タグに「{tag}」を選び、"
    s += "割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
    return s

# --- 規格つき商品ブロック（元の2文）
BLK = re.compile(
    r"管理画面の商品登録編集（新規）で、(?P<card>カード指定はしないで|「カード指定」を押してカード検索ポップアップから(?P<sel>[^、]*?)を1件選び、)"
    r"商品名に「(?P<name>[^」]+)」を入れ、(?:略称タグに「(?P<tag>[^」]+)」を選び、)?商品公開ステータスを「公開」にして「商品を登録」を押す。"
    r"同じ画面の「規格設定」から商品規格一覧の「新規作成」を押し、商品規格登録編集で言語に「JP」、状態に「NM」、商品コードに(?P<code>\S+?)、"
    r"販売価格に(?P<sale>\d+)、基準価格に(?P<base>\d+)、買取価格に(?P<buy>\d+)、部門に任意の部門、公開ステータスに「公開」を入れて「商品規格を登録」を押す。")

def blk_sub(m):
    code, name = m['code'], m['name']
    if m['card'].startswith('カード指定はしない'):
        return csv_one(code, name, m['base'], m['sale'], m['buy'])
    sel = "検索結果の1件目のカードを選び" if m['sel'] == 'カード' else "レアリティがRのカードの1件目を選び"
    return (csv_one(code, name, m['base'], m['sale'], m['buy'], region=True)
            + card_edit(code, name, sel) + card_tail(m['tag']))

# --- QG
QG = re.compile(r"管理画面の商品登録編集画面で商品名に「(?P<n>QG0703-\d+-[A-Z])」、カード指定はせず、ほかの必須項目に任意の値を入れて登録し、「規格設定」ボタンから商品規格登録編集画面を開いて、言語に日本語、状態にニアミント、買取価格に(?P<buy>\d+)、ほかの必須項目に任意の値を入れて「商品規格を登録」ボタンを押し、商品登録編集画面で商品公開ステータスを公開にして登録する。")
def qg_sub(m):
    return csv_one(m['n'], m['n'], 5000, 5000, m['buy'])

# --- PAGE-SUP loop
LOOP = ("商品コードPAGE-SUP-001からPAGE-SUP-011までの11件を、次の操作を11回繰り返して1件ずつ登録する（商品名と商品コードには、その回の商品コードを入れる）。"
        "管理画面の商品登録編集（新規）で、カード指定はしないで商品名にその回の商品コードを入れ、商品公開ステータスを「公開」にして「商品を登録」を押す。"
        "同じ画面の「規格設定」から商品規格一覧の「新規作成」を押し、商品規格登録編集で言語に「JP」、状態に「NM」、商品コードにその回の商品コード（PAGE-SUP-001〜PAGE-SUP-011）、販売価格に1000、基準価格に1000、買取価格に100、部門に任意の部門、公開ステータスに「公開」を入れて「商品規格を登録」を押す。")
LOOP_NEW = "商品コードPAGE-SUP-001からPAGE-SUP-011までの11件を、1つのCSVに行を並べて登録する。" + csv_many([(f"PAGE-SUP-{i:03d}", f"PAGE-SUP-{i:03d}", 1000, 1000, 100) for i in range(1, 12)])

# --- フォールバック（既存の商品が無いとき）
FB = re.compile(r"無ければ商品登録編集(?P<mid>と|の「カード指定」と)商品規格登録編集で(?P<sup>サプライ品を1点)?登録する）")

def fb_factory(seed_n, counter):
    def sub(m):
        counter[0] += 1
        k = counter[0]
        code = f"M0703-{seed_n}-FB" + ("" if k == 1 else f"{k}")
        base = csv_one(code, code, 1000, 1000, 100, region=('カード指定' in m['mid']))
        s = "無ければ" + base.replace("。グッズ商品は", "。グッズ商品は", 1)
        if 'カード指定' in m['mid']:
            s += card_edit(code, code, "検索結果の1件目のカードを選び") + card_tail()
        s += f"その商品を使う）"
        return s
    return sub

def convert(sid, old):
    new = old
    n = sid.split('-')[-1]
    new = BLK.sub(blk_sub, new)
    new = QG.sub(qg_sub, new)
    new = new.replace(LOOP, LOOP_NEW)
    cnt = [0]
    new = FB.sub(fb_factory(n, cnt), new)
    return new

out = []
for r in I:
    sid, old, oattr = r[0], r[5], r[3]
    new = convert(sid, old)
    out.append((sid, old, new, r))

if __name__ == '__main__':
    import collections
    res = collections.Counter()
    for sid, old, new, r in out:
        res['changed' if new != old else 'same'] += 1
        if new == old: print('SAME', sid)
        if re.search(r"商品登録編集（新規）|商品規格一覧の「新規作成」|規格設定」ボタン|無ければ商品登録", new): print('RESID', sid)
    print(res)

def write():
    L = ["\t".join(["シードID","判定","新しい投入方法","新しい状態・属性","根拠","理由"])]
    for sid, old, new, r in out:
        card = 'カード指定 >' in new
        basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192〜L0238、M03-02 L0075〜L0077"
        if card: basis += "・L0092"
        reason = ""
        if card:
            reason = "カードはカード検索ポップアップの1件目（元のシードは「カードを1件選び」としか書いていない）。カード指定の商品は商品登録編集画面で付け直すため、規格は取り込みで作られたニアミント・日本語のもののまま使う。"
        if 'PAGE-SUP-001' in new and 'SEARCH-PAGING' in sid: reason = "11件を1つのCSVの11行で取り込む。"
        if 'QG0703' in new and 'QG-ORDER' in sid: reason = "元のシードは販売価格・基準価格を「任意の値」としていたため、買取価格（最大3000）を上回らない5000にした（買取価格は販売価格を上回れない M03-27 L0119）。商品コードは元に無いので商品名と同じ値にした。"
        if 'FB' in new and not card and not reason: reason = "「どれでもよい。無ければ登録する」の無ければの側だけ、グッズ商品CSV登録に置き換えた（商品コードはシード専用の値）。"
        for f in (new, reason, basis): assert '\t' not in f and '\n' not in f
        L.append("\t".join([sid, "直す", new, "", basis, reason]))
    (P/f'out/{FID}.tsv').write_text("\n".join(L)+"\n", encoding='utf-8')
write()
