import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
def csvsent(code, ja, en, base, sale, buy, cost):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
            f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）"
            f"・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価{cost}・地域別販売制限は0（日英の両サイト）・部門IDは空）。"
            "グッズ商品は状態ニアミント・日本語の規格が1件作られる。")
def search(code, label):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。"
def cardedit(detail_label, ja, en, pick="カード検索ポップアップで〔{d}〕のカード詳細の行の決定ボタンを押す"):
    return ("商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、"
            + pick.format(d=detail_label) + "。"
            f"続けて商品名(日)に「{ja}」、商品名(英)に「{en}」を入れ（カード指定で自動で入った値は書き換える）、"
            "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。")
out = []
hdr, rows = load('M14-04')
BAS = "M03-27 L0092・L0123・L0124・L0134、M03-02 L0075〜L0077・L0092・L0111、M14-04 L0094"
for r in rows:
    sid, old = r[0], r[5]
    n = sid.split('-')[-1]
    if sid.startswith('S-M14-04-PRODUCT-LINKED-'):
        m = re.search(r"商品名に「(.+?)」、商品名\(英\)に「(.+?)」を入れ", old)
        ja, en = m.group(1), m.group(2)
        a = old.index("商品登録編集画面で「カード指定 >」を押し")
        b = old.index("控える（〔商品ID-M1404-%s〕）。" % n) + len("控える（〔商品ID-M1404-%s〕）。" % n)
        code = f"M1404-PL{n}"
        new = (old[:a] + csvsent(code, ja, en, 100, 100, 10, 10) + search(code, f"商品ID-M1404-{n}")
               + cardedit(f"カード詳細ID-M1404-{n}", ja, en, pick="カード検索ポップアップで〔{d}〕のカード詳細を選ぶ").replace("の行の決定ボタンを押す","を選ぶ") + old[b:])
        out.append([sid, "直す", new, "", BAS, "ケースへの影響は無い（商品名・商品サブIDとカード詳細への紐づきは同じ。元は商品カテゴリの指定が無かったが、CSVのためサプライ・グッズを入れたあと単体カードのカテゴリへ付け替えた）"])
    elif sid == 'S-M14-04-QL-CARDPROD-059':
        a = old.index("（商品）管理画面のカード商品CSV登録画面で")
        ja = en = "連携カード商品-M1404QL001"
        new = (old[:a] + "（商品）" + csvsent("M1404QL-001", ja, en, 1500, 1500, 100, 100)
               + search("M1404QL-001", "商品ID-M1404-001")
               + cardedit("カード詳細ID-M1404-001", ja, en))
        out.append([sid, "直す", new, "", BAS + "、M03-26 L0150・L0165",
                    "カード商品CSVは割引率の状態ごとに規格を作るため使わない。グッズ商品CSVは状態ニアミント・日本語の規格を1件だけ作るので、元の「NM以外の規格を削除する」操作は不要。販売価格・基準価格1,500・買取価格100は取込時に入れた。ケースへの影響は無い（NMの規格1件・在庫0・本店と支店の公開・同じカード詳細の商品はこの1件だけ、の状態は同じ）"])
    elif sid == 'S-M14-04-MIXED-LINK-063':
        ja, en = "M1404-063-商品", "M1404-063-Product"
        a = old.index("商品登録編集画面で「カード指定 >」を押し")
        k = "控える（〔商品ID-M1404-063〕）。"
        b = old.index(k) + len(k)
        new = (old[:a] + csvsent("M1404-ML063", ja, en, 100, 100, 10, 10) + search("M1404-ML063", "商品ID-M1404-063")
               + cardedit("カード詳細ID-M1404-063A", ja, en, pick="カード検索ポップアップで〔{d}〕のカード詳細を選ぶ").replace("の行の決定ボタンを押す","を選ぶ") + old[b:])
        out.append([sid, "直す", new, "", BAS, "ケースへの影響は無い（カード詳細Aだけが商品に紐づく状態は同じ）"])
    elif sid == 'S-M14-04-RJ-CARD-066':
        out.append([sid, "直さない", "", "", "M03-27 L0092・L0124、M03-02 L0092", "商品はすでにグッズ商品CSV登録で作り、商品登録編集画面では既存の商品にカード指定するだけ。なお編集の「商品を登録」は割引率なども必須だが「任意の値を選んで」とだけ書かれている（元のシードの誤りではなく曖昧さ。直さない）"])
    else:
        raise SystemExit(sid)
with open(P/'out/M14-04.tsv','w',encoding='utf-8') as f:
    f.write("\t".join(HDR)+"\n")
    for r in out:
        assert all('\t' not in c and '\n' not in c for c in r)
        f.write("\t".join(r)+"\n")
