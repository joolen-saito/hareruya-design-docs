import re
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
rows = [l.split("\t") for l in open("in/M05-11.tsv", encoding="utf-8").read().split("\n")[1:] if l]
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
COMMON = f"言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称"
TAIL = "・地域別販売制限は0（日英の両サイト）・部門IDは空"
UPL = "グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
DISC = "割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す"
NMSPEC = "。グッズ商品は状態ニアミント・日本語の規格が1件作られる"


def csv1(code, name, price):
    return (UPL.format(n="1行") + f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{name}」・商品名(英)は「{name}」・{COMMON}・基準価格{price}・販売価格{price}・買取価格100・原価単価10{TAIL}）" + NMSPEC[0:0] + NMSPEC.replace("。", "。", 1))


def find(code):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開く"


def spec_edit(code, extra=""):
    return (find(code) + "。「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミント・日本語の規格の行から商品規格登録編集画面を開き、"
            f"{extra}部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す")


def cat_edit(code, cat):
    return find(code) + f"。商品カテゴリはサプライ・グッズの選択を外して「{cat}」を選び、{DISC}"


def img_edit(code):
    return find(code) + f"。商品画像に画像ファイルを1枚アップロードし、{DISC}"


def card_edit(code, name, card):
    return (find(code) + f"。「カード指定 >」ボタンを押し、カード検索ポップアップで登録した{card}のカード詳細の行の決定ボタンを押す。"
            f"カードを選ぶと商品名などが自動で入るため、商品名(日)・商品名(英)に「{name}」を入れ直し、{DISC}")


SPEC = re.compile(r"続けてこの商品の商品規格の登録画面で商品コードに「([^」]+)」、状態に(?:任意の値|「[^」]+」)、言語に(?:任意の値|「[^」]+」(?:（日本語）)?)、基準価格に(任意の額|\d+)、買取価格に任意の額を入れ、(在庫無制限にチェックを入れ、|高額商品コードは空のままにし、|高額商品コードに「([^」]+)」を入れ、)?公開を選んで登録する（販売価格は基準価格と同じ額になる）$")
REG = re.compile(r"管理画面の商品登録画面で商品名に「([^」]+)」、商品名（英語）に任意の値を入れ、(商品画像に画像ファイルを1枚アップロードし、)?公開を選んで登録する$")
CARDREL = re.compile(r"商品登録画面のカード詳細の検索で、(.+)のカード詳細を関連付ける$")
out = []
for c in rows:
    sid, meth = c[0], c[5]
    if sid in ("S-M05-11-QF-ORDER-199", "S-M05-11-QF-ORDER-200"):
        out.append([sid, "直さない", "", "", "M03-27 L0092", "元のシードが既にグッズ商品CSV登録で商品を作っているため直さない"])
        continue
    if sid in ("S-M05-11-NONSTOCK-042", "S-M05-11-DPNONSTK-213"):
        out.append([sid, "直せない", "", "", "M03-09 L0095・L0097、M03-27 L0129、PROMPT.md 在庫と価格", "規格の画面に在庫無制限の欄が無く、グッズ商品CSVが作る規格は在庫無制限なしの在庫0のため、在庫管理なし・在庫値未設定の規格を画面から作れない。ケースが在庫を管理しない商品そのもの（在庫値が変わらない・未設定のまま）を確かめている（IT-M05-11-" + sid[-3:] + "）"])
        continue
    ss = meth.split("。")
    new = []
    i = 0
    reason = "商品名(英)・買取価格・原価単価・サイズ・重量・言語・状態は元のシードで任意の値だったため、CSV必須列の都合で入れた値（言語は日本語・状態はニアミントになる）。グッズ商品CSVは規格の公開ステータス・部門を設定しないため、取り込み後に商品規格登録編集画面で公開に直す"
    effect = ""
    lastname = None
    lastcode = None
    if sid == "S-M05-11-PRODUCT-READ":
        P = [("M0511-PRODUCT-1", "表示確認商品【日/NM】Foil", "Foilが「通常」"),
             ("M0511-PRODUCT-2", "表示確認商品【日/NM】通常", "Foilが「なし」・フレームが「通常」"),
             ("M0511-PRODUCT-3", "表示確認商品【日/NM】特殊Foil", "Foilが「特殊」"),
             ("M0511-PRODUCT-4", "表示確認商品【日/NM】特殊フレーム", "フレームが「特殊」")]
        N5 = ("M0511-PRODUCT-5", "表示確認商品【日/EX】")
        rowsdesc = "・".join(f"商品コード「{a}」の商品名(日)・商品名(英)は「{b}」" for a, b, _ in P) + f"・商品コード「{N5[0]}」の商品名(日)・商品名(英)は「{N5[1]}」"
        ss2 = list(ss)
        assert ss2[2].startswith("管理画面の商品登録画面で、商品名「表示確認商品") and ss2[3].startswith("それぞれの商品規格の登録画面で")
        csv5 = (UPL.format(n="5行") + f"（5行とも商品IDは空・{COMMON}・基準価格1000・販売価格1000・買取価格100・原価単価10{TAIL}。{rowsdesc}）" + NMSPEC)
        specs = "。".join(spec_edit(a) for a, _, _ in P)
        n5 = (spec_edit(N5[0], "").replace("公開ステータスに「公開」を選んで", "公開ステータスに「非公開」を選んで")
              + "。商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態にEXを選び、商品コードに「M0511-PRODUCT-5-EX」、基準価格(円)に1000、販売価格(円)に1000、買取価格(円)に100を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す")
        cards = "。".join(card_edit(a, b, cd) for a, b, cd in P)
        new = ss2[:2] + [csv5, specs, n5, cards] + ss2[4:]
        new = [s.replace("5商品とも、在庫一覧から店舗A", "5商品とも（状態EXの商品は公開のEXの規格M0511-PRODUCT-5-EXで）、在庫一覧から店舗A") for s in new]
        reason = ("元のシードは商品名を1つしか決めていなかったため、ほかの4商品の商品名・商品コードを「表示確認商品【日/NM】…」「M0511-PRODUCT-n」と決めた。"
                  "カード詳細との対応は、元のシードの列挙順（Foil通常・Foilなし通常フレーム・Foil特殊・フレーム特殊）に従い、状態EXの商品はカードを関連付けない。"
                  "状態EXの商品はニアミントの規格が余るため非公開にし、EXの規格を新規作成で足した（グッズ商品CSVはニアミント固定 M03-27 L0124）")
        effect = "ケースに影響: 状態EXの商品にニアミントの非公開の規格が1件余る（受注の明細は公開のEXの規格から作られる前提。IT-M05-11-079）"
        out.append([sid, "直す", "。".join(new), "", "M03-27 L0092・L0123・L0124・L0129・L0134、M03-09 L0130〜L0134、M03-02 L0075〜L0077・L0092", reason + "。" + effect])
        continue
    if sid == "S-M05-11-SEARCH-READ":
        ss2 = list(ss)
        pr = {}
        # 0 login / 1 category (keep) / 2 id note
        ss2[2] = ss2[2].replace("を登録する直前に", "をグッズ商品CSV登録で取り込む直前に")
        assert "グッズ商品CSV" in ss2[2]
        seq = []
        seq += ss2[0:3]
        seq += [csv1("SRCH-A-001", "日本語検索商品A", 1000), spec_edit("SRCH-A-001"), ss2[5], cat_edit("SRCH-A-001", "テストカテゴリA")]
        seq += [csv1("SRCH-A-002", "日本語検索商品B", 1000), spec_edit("SRCH-A-002"), ss2[9], cat_edit("SRCH-A-002", "テストカテゴリA") + "（テストカテゴリAにはこの2商品だけを入れる）"]
        seq += [csv1("ADD-001", "追加確認商品", 1000), spec_edit("ADD-001"), ss2[13]]
        seq += [csv1("ZERO-001", "在庫なし商品", 1000), spec_edit("ZERO-001"), ss2[16]]
        pg = (UPL.format(n="既定の表示件数より1件多い行") + f"（各行とも商品IDは空・{COMMON}・基準価格1000・販売価格1000・買取価格100・原価単価10{TAIL}・商品コードは「SRCH-PG-001」から連番・商品名(日)と商品名(英)は「ページング確認商品001」から連番）" + NMSPEC
              + "。商品マスター(検索入力)で商品コードに「SRCH-PG-」を入れて「検索する >」を押し、商品マスター(検索結果)の行それぞれから商品登録編集画面（既存の商品の編集）を開き、"
              + f"商品カテゴリはサプライ・グッズの選択を外して「ページングカテゴリ」を選び、{DISC}（すべての商品）。これで、カテゴリに「ページングカテゴリ」を選んだ商品を、受注情報編集画面の商品検索ダイアログの1ページの表示件数より1件多く登録した状態になる")
        seq += [pg]
        new = seq
        reason = ("元のシードの商品ID501は、CSVの取り込み直前に次の商品IDを501へ設定して作る（A商品を単独のCSVで取り込む）。ページングカテゴリの商品は元のシードにも規格・在庫の指定が無かったため規格の公開は直していない（CSVがニアミントの規格を1件ずつ作る）。"
                  "ADD-001・ZERO-001・SRCH-A-001/002 の言語・状態は元のシードで任意の値のため日本語・ニアミントにした")
        effect = "ケースに影響: ページングカテゴリの商品に規格が1件ずつ付く（元のシードは商品のみ）。商品検索ダイアログの結果は商品単位のため影響は小さい想定（IT-M05-11-088・089）"
        out.append([sid, "直す", "。".join(new), "", "M03-27 L0092・L0123・L0124・L0129・L0134、M03-09 L0130〜L0134、M03-02 L0075〜L0077", reason + "。" + effect])
        continue
    flags = set()
    while i < len(ss):
        s = ss[i]
        m = REG.match(s)
        if m:
            name, img = m.group(1), m.group(2)
            m2 = SPEC.match(ss[i + 1])
            assert m2, (sid, ss[i + 1])
            code, price, extra, high = m2.group(1), m2.group(2), m2.group(3), m2.group(4)
            p = "1000" if price == "任意の額" else price
            new.append(csv1(code, name, p))
            if img:
                new.append(img_edit(code))
                flags.add("img")
            ex = ""
            if extra == "在庫無制限にチェックを入れ、":
                ex = "在庫無制限にチェックを入れ、"
            elif high:
                ex = f"高額商品コードに「{high}」を入れ、"
            elif extra and "空のまま" in extra:
                ex = "高額商品コードは空のままにし、"
            new.append(spec_edit(code, ex))
            lastname, lastcode = name, code
            i += 2
            continue
        m3 = CARDREL.match(s)
        if m3:
            card = m3.group(1)
            if card.startswith("Foilなし・通常フレーム"):
                card = "Foilが「なし」・フレームが「通常」"
            elif card.startswith("Foilが"):
                card = card
            new.append(card_edit(lastcode, lastname, card))
            flags.add("card")
            i += 1
            continue
        if sid == "S-M05-11-DPNAME-216" and "商品名を「変更後名称216」に変更して登録する" in s:
            s = s.replace("に変更して登録する", "に変更し、割引率に販売割引率に登録済みのものを選んで登録する")
        new.append(s)
        i += 1
    if "card" in flags:
        reason += "。カード指定で商品名が自動で入るため、元のシードの商品名を入れ直した。商品カテゴリは元のシードに指定が無くCSVで入れたサプライ・グッズのまま"
    if "img" in flags:
        reason += "。商品画像はCSVの規格画像（ファイル名の列挙）ではなく商品登録編集画面で上げる（元のシードと同じ操作）"
    if sid == "S-M05-11-DPNAME-216":
        reason += "。商品名変更の操作は編集の必須項目の割引率を足した"
    if sid in ("S-M05-11-NONSTOCK-042", "S-M05-11-DPNONSTK-213"):
        reason += "。在庫無制限は商品規格登録編集画面で入れる"
    out.append([sid, "直す", "。".join(new), "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-09 L0130〜L0134、M03-02 L0075〜L0077", reason])
for r in out:
    for x in r:
        assert "\t" not in x and "\n" not in x, r[0]
assert len(out) == len(rows)
open("out/M05-11.tsv", "w", encoding="utf-8").write("\n".join("\t".join(r) for r in [HDR] + out) + "\n")
print(len(out))
