import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *

def stock_csv(entries):
    # entries: [(店舗, 商品コード, 数)]
    out = []
    for shop, code, n in entries:
        out.append(f"在庫変更CSV登録画面で、店舗に「{shop}」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、承認通知先に承認するメンバーを選び、商品コード「{code}」・在庫増減数「{n}」・仕入単価「100」の1行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す")
    out.append("在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押す")
    return out


P = pathlib.Path(__file__).resolve().parents[2]


def rows(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write(fid, out):
    hdr = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
    for r in out:
        assert len(r) == 6 and all(("\t" not in x and "\n" not in x) for x in r), r[0]
    with open(P / f"out/{fid}.tsv", "w", encoding="utf-8") as f:
        f.write("\t".join(hdr) + "\n")
        for r in out:
            f.write("\t".join(r) + "\n")


# ---------------- M05-18 ----------------
def m0518():
    h, I = rows("M05-18")
    ix = {c: i for i, c in enumerate(h)}
    out = []
    pat = re.compile(r"管理画面の商品登録画面で商品名に「(.+?)」、販売価格\(円\)に1000を入れ、在庫数無制限にチェックし、公開状態を「公開」にして登録ボタンを押す")
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0146、M03-09 L0095・L0097、M04-21 L0127〜L0135、M04-32 L0108・L0110"
    for src in I:
        sid, old = src[0], src[ix["投入方法"]]
        num = sid.split("-")[-1]
        sents = old.split("。")
        if not any(pat.fullmatch(s) for s in sents):
            out.append([sid, "直さない", "", "", "M03-27 L0092", "すでにグッズ商品CSV登録で商品を作っている（商品新規登録は使っていない）。CSVの必須列に「任意の値」とある曖昧さは商品を作る部分の直しではないので触れない"])
            continue
        new = []
        i = 0
        names = []
        while i < len(sents):
            s = sents[i]
            m = pat.fullmatch(s)
            if m:
                names = [m.group(1)]
                # 018: 次の文「同じ手順で商品名「予約商品」の商品も登録する」も同じ塊で扱う
                if i + 1 < len(sents):
                    m2 = re.fullmatch(r"同じ手順で商品名「(.+?)」の商品も登録する", sents[i + 1])
                    if m2:
                        names.append(m2.group(1))
                        i += 1
                prods = []
                for k, nm in enumerate(names):
                    suf = "" if len(names) == 1 else "NY"[k]
                    prods.append(dict(code=f"M0518-{num}-P{suf}", ja=nm, en=nm, lang="ja", base=1000, buy=100))
                new.append(upload_sentence(prods))
                new.append(after_upload(prods))
                for p in prods:
                    new.append(open_edit(p))
                    new.append("商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く")
                    new.append(first_spec(dict(lang="ja")))
                for p in prods:
                    new.extend(stock_csv([("本店", p["code"], 100)]))
            else:
                new.append(s)
            i += 1
        method = "。".join(new)
        codes = "・".join(f"「{p['code']}」" for p in prods)
        why = (f"元は商品名と販売価格1000だけの指定だったので、CSVの必須列のうち元に定めが無い基準価格（販売価格と同額）・買取価格100・原価単価10・サイズ・重量・商品カテゴリ・購入グループ名称は決めて入れた。"
               f"商品コードはシード専用に{codes}とした。元の「在庫数無制限」は規格の画面では入れられない（M03-09 L0095・L0097）ので、使うケースの注文数より十分多い100を在庫変更CSV登録で入庫して承認する（M04-21 L0127〜L0135、M04-32 L0108・L0110）。店舗は本店のフロントで買うので本店。承認するメンバーは元のシードに無いため、在庫を登録した管理者とは別の承認権限を持つ管理者とした。商品IDは元から控えていないので呼び名は増やさない。")
        out.append([sid, "直す", method, "", basis, why])
    write("M05-18", out)


# ---------------- M12-07 ----------------
def m1207():
    h, I = rows("M12-07")
    ix = {c: i for i, c in enumerate(h)}
    src = I[0]
    sid, old = src[0], src[ix["投入方法"]]
    sents = old.split("。")
    # 先頭の「① 管理画面…。」「登録後の…。」「② …」「登録後の…」を置き換える
    assert sents[0].startswith("① 管理画面の商品登録画面で、商品名に「M1207-003-A」")
    assert sents[2].startswith("② 管理画面の商品登録画面で、商品名に「M1207-003-B」")
    tag = "売上分析タグ(ID)は事前準備で登録済みの売上分析タグ「{}」のID"
    A = dict(code="M1207-003-A", ja="M1207-003-A", en="M1207-003-A", lang="ja", base=1000, buy=100, extra="・" + tag.format("スタンダード"))
    B = dict(code="M1207-003-B", ja="M1207-003-B", en="M1207-003-B", lang="ja", base=200, buy=50, extra="・" + tag.format("モダン"))
    prods = [A, B]
    new = ["① " + upload_sentence(prods), after_upload(prods)]
    for p, lab, sub in ((A, "", "〔商品ID-M1207-003A〕"), (B, "② ", "〔商品ID-M1207-003B〕")):
        new.append(f"{lab}商品マスター(検索入力)で商品コードに「{p['code']}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（{sub}）")
        new.append("商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く")
        new.append(first_spec(dict(lang="ja")))
    new.extend(stock_csv([("本店", "M1207-003-A", 100), ("支店", "M1207-003-B", 100)])[:-1])
    new.append(stock_csv([])[-1])
    # 元の③以降
    rest = sents[4:]
    assert rest[0].startswith("③ ")
    method = "。".join(new + rest)
    # 「① …」の見出し番号は元に合わせるため、先頭の①②は残す
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0220、M03-02 L0075〜L0077・L0092・L0106、M03-09 L0095・L0097、M04-21 L0127〜L0135、M04-32 L0108・L0110"
    why = ("元は商品名・販売価格・売上分析タグだけの指定だったので、CSVの必須列のうち元に定めが無い基準価格（販売価格と同額）・買取価格（A=100・B=50、販売価格以下 M03-27 L0119）・原価単価10・サイズ・重量・商品カテゴリ・購入グループ名称は決めて入れた。"
           "売上分析タグはCSVの列（M03-27 L0220）で入れる。そのタグIDは事前準備（S-M12-07-MASTER）で登録済みのもので、このシードでは呼び名を増やさない。"
           "元の「在庫数を無制限」は規格の画面では入れられない（M03-09 L0095・L0097）ので、注文数1より十分多い100を在庫変更CSV登録で入庫して承認する（A=本店、B=支店で注文するのでその店舗。M04-21 L0127〜L0135、M04-32 L0108・L0110）。承認するメンバーは元のシードに無いため、在庫を登録した管理者とは別の承認権限を持つ管理者とした。商品Bは支店サイトで注文するので支店の商品公開ステータスを1（公開）にした。"
           "商品IDは控える画面を、元の商品登録画面から商品マスター(検索結果)に変えた（呼び名は同じ）。")
    out = [[sid, "直す", method, "", basis, why]]
    write("M12-07", out)


m0518()
m1207()
