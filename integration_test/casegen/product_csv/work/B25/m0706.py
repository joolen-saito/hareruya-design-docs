import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("M07-06")
PP = re.compile(r"商品登録編集で商品名に「(?P<n>[^」]+)」を入れ、(?:レアリティ「(?P<r>.)」で登録したカード詳細を選び、略称タグに「(?P<t>TAG.)」を選び、)?登録する")
PC = re.compile(r"商品「(?P<n>[^」]+)」の商品規格登録編集で言語に「(?P<lang>[^」]+)」、状態に「NM」、商品コードに「(?P<code>[^」]+)」、基準価格に「(?P<base>\d+)」、買取価格に「600」（ネット買取商品詳細に「カートに入れる」を表示させるため500以上の値）を入れ、公開ステータスを「公開」にして商品規格を登録ボタンを押す")
def by_code(code):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、{OPEN_EDIT}"
out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    cls = {m.group("n"): m.groupdict() for m in PC.finditer(old)}
    assert cls, sid
    def fp(m):
        n = m.group("n"); c = cls[n + ""]
        s = csv_sentence([row(c["code"], n, n, int(c["base"]), 600, lang=c["lang"])]) + "。買取価格は、ネット買取商品詳細に「カートに入れる」を表示させるため500以上の値にする"
        if m.group("r"):
            s += "。" + by_code(c["code"]) + "、「カード指定 >」ボタンを押し、カード検索ポップアップでレアリティ「" + m.group("r") + "」で登録したカード詳細の行の決定ボタンを押す。続けて商品名(日)に「" + n + "」、商品名(英)に「" + n + "」を入れ（カード指定で自動で入った値は書き換える）、略称タグに「" + m.group("t") + "」を選び、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す"
        return s
    def fc(m):
        c = m.groupdict()
        return f"商品「{c['n']}」の商品規格を直す。{by_code(c['code'])}、「規格設定」ボタンから商品規格一覧を開く。" + nm_edit(c["lang"])
    new, k1 = PP.subn(fp, old)
    new, k2 = PC.subn(fc, new)
    assert k1 == k2 and k1 >= 1, (sid, k1, k2)
    assert "商品登録編集で商品名" not in new
    why = "商品名・商品コード・言語・基準価格・買取価格600円（ネット買取商品詳細に「カートに入れる」を出すため500以上）は元のシードの値。部門と公開ステータスは、CSVに入れられないので取り込み後に規格を開いて入れた。"
    if "略称タグ" in old:
        why += "カード詳細と略称タグは取り込み後に商品登録編集画面（既存の商品の編集）でカード指定して選ぶ。割引率は販売割引率に登録済みのものから選ぶ。商品カテゴリは元が定めていないのでサプライ・グッズのまま。"
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0105・L0111・L0128・L0129、M03-09 L0077・L0130〜L0134"
    out.append([sid, "直す", new, "", basis, why])
write("M07-06", out)
