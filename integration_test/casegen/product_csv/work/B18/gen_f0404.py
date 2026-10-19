import re, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from lib import *

FID = "F04-04"
hdr, rows = read_in(FID)
SEG = re.compile(
    r"管理画面の商品登録画面で、商品名に「(?P<name>[^」]+)」、商品コードに「(?P<code>[^」]+)」、公開状態に「公開」、"
    r"(?P<br>支店の商品公開ステータスに「公開」、)?"
    r"(?P<unl>在庫数無制限にチェックを入れる|在庫数無制限のチェックは外したまま)、"
    r"(?:販売制限数（購入制限数）に「(?P<lim>\d+)」、)?"
    r"(?:売上分析タグにタグID (?P<tag>[\d・ ]+)のタグ、)?"
    r"販売価格など残りの必須項目に任意の有効な値を入れて登録ボタンを押す。"
    r"商品一覧で商品コード「(?P=code)」の行のID列に表示された番号を商品IDとして控える（(?P<lab>〔[^〕]+〕)）。")

out = []
BASIS = ("M03-27 L0092・L0119・L0124・L0129・L0134・L0150・L0194-L0238、M03-02 L0075〜L0077、"
         "M03-09 L0086〜L0087・L0095・L0097・L0155・L0171、M04-21 L0127〜L0135・L0166〜L0168、M04-32 L0108・L0110・L0141・L0297")
for r in rows:
    sid, kind, lab, attr, use, how, share, cases = r
    segs = list(SEG.finditer(how))
    assert segs, sid
    ps = []
    info = []
    for m in segs:
        tags = m.group("tag")
        stag = ",".join(re.findall(r"\d+", tags)) if tags else None
        # 仕入単価（在庫編集で入れる値）があれば原価単価に使う
        p = prod(m.group("code"), name=m.group("name"), branch=1,
                 limit=m.group("lim"), sales_tags=stag, label=m.group("lab"))
        p["unl"] = m.group("unl").startswith("在庫数無制限にチェック")
        ps.append(p)
    block = csv_clause(ps) + "グッズ商品は状態ニアミント・日本語の規格が1件作られる。"
    for i, p in enumerate(ps):
        block += search_sentence(p["code"], p["label"])
        block += open_class_sentence(p["code"], first=True)
        block += class_edit_sentence(unlimited=False)
    for p in ps:
        if p["unl"]:
            block += (f"在庫変更CSV登録画面で、店舗に「オンラインショップ」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、"
                      f"承認通知先に承認するメンバーを選び、商品コード「{p['code']}」・在庫増減数「100」・仕入単価「100」の1行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す。"
                      "在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押す。")
    # 元の文のうち、最初の商品登録の文を新しいブロックに置き換え、2件目以降は消す
    new = how
    first = True
    for m in segs:
        if first:
            new = new.replace(m.group(0), "\x00BLOCK\x00", 1)
            first = False
        else:
            new = new.replace(m.group(0), "", 1)
    new = new.replace("\x00BLOCK\x00", block)
    reasons = []
    if any(not m.group("br") for m in segs):
        reasons.append("元は支店の商品公開ステータスの指定が無く画面の初期値（公開）だったので、CSVの必須列は1（公開）にした")
    reasons.append("元は販売価格などを任意の値としていたので、基準価格・販売価格を1000、買取価格を100、原価単価を10にした"
                   "（買取価格は販売価格を上回れない M03-27 L0119）。サイズ・重量・購入グループも同様に仮の値で、このケースでは使わない")
    reasons.append("グッズ商品CSVには規格の部門と公開ステータスの列が無いので、取り込み後に規格の画面で部門を先頭の選択肢・"
                   "公開ステータスを公開にした（M03-09 L0155・L0171）")
    if any(p["unl"] for p in ps):
        reasons.append("規格の画面に在庫無制限の欄は無い（M03-09 L0095・L0097）ので、元の在庫数無制限は在庫変更CSV登録で100を入庫し別のメンバーが承認する形にした（無制限そのものを確かめるケースかは未確認。承認するメンバーは元のシードに無いので、同じ機能のシードの承認権限を持つ管理者を使う）")
    if any(p["sales_tags"] for p in ps):
        reasons.append("売上分析タグはCSVの売上分析タグ(ID)列で入れた（M03-27 L0146）")
    reasons.append("取り込みで作られる規格は在庫0で、在庫検索一覧の在庫は元のシードの在庫手順のまま")
    if sid == "S-F04-04-UNLIM-050":
        out.append([sid, "直せない", "", "", "M03-09 L0095・L0097、M03-27 L0194-L0238",
                    "在庫無制限を設定する手段が無い（グッズ商品CSVにも規格の画面にも在庫無制限の欄が無い）。ケースが在庫無制限そのものを確かめる。"
                    "ケースに影響: IT-F04-04-050 は在庫無制限・在庫数1の商品で数量3を注文して在庫エラーにならないことを確かめるため、在庫を100入庫する形では代わりにならない"])
        continue
    out.append([sid, "直す", new, "", BASIS, "。".join(reasons)])
write_out(FID, out)
print(len(out))
