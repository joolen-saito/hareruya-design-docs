import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("M04-03")
STOCK0 = "この取り込みで、公開中の店舗と在庫場所の組み合わせぶんの在庫が在庫数0・総原価0で作られるので、"
PROD_A = r"商品登録編集画面で商品名に「(?P<n>[^」]+)」を入れ（その他の必須項目は任意の有効な値）、登録ボタンを押す。登録後に開いた商品編集画面のURLに含まれる番号を商品IDとして控える（(?P<pl>〔[^〕]+〕)）。"
CL_TAIL = r"登録後に開いた商品規格編集画面のURL末尾の番号を商品規格IDとして控える（(?P<cl>〔[^〕]+〕)）。この登録で全店舗・全在庫区分の在庫が在庫数0・総原価0で作られるので、"
PAT_ANY = re.compile(PROD_A + r"商品マスター（検索結果）で商品「(?P=n)」の商品規格一覧を開き、商品規格登録編集画面で商品コードに任意の半角文字、言語に「日本語」、状態に「NM」を入れ（基準価格などその他の必須項目は任意の有効な値）、登録ボタンを押す。" + CL_TAIL)
PAT_CODE = re.compile(PROD_A + r"商品マスター（検索結果）で商品「(?P=n)」の商品規格一覧を開き、商品規格登録編集画面で商品コードに「(?P<c>[^」]+)」を入れ（言語・状態・基準価格などその他の必須項目は任意の有効な値）、登録ボタンを押す。" + CL_TAIL)

def single(m, extra_class=None):
    n, pl, cl = m.group("n"), m.group("pl"), m.group("cl")
    if "c" in m.groupdict() and m.group("c"):
        code = m.group("c")
    else:
        code = None
    return n, pl, cl, code

out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    num = sid.split("-")[-1]
    new = old; why = ""; basis = ""
    BASIC = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077、M03-09 L0077・L0130〜L0134・L0160"
    if sid in ("S-M04-03-CASE-006", "S-M04-03-CASE-007", "S-M04-03-CASE-013"):
        def f(m):
            n, pl, cl = m.group("n"), m.group("pl"), m.group("cl")
            code = f"M0403-{num}-A"
            s = csv_sentence([row(code, n, n, 100, 10)]) + "。" + idnote(code, pl) + "。" + OPEN_EDIT + "、" + SPEC_LIST.replace("商品登録編集画面の", "") + "。"
            s += "商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面の商品規格ID欄に表示された番号を控える（" + cl + "）。" + STOCK0
            return s
        new, k = PAT_ANY.subn(f, old); assert k == 1, sid
        why = f"日本語・NMの規格は取り込みで作られる規格を使い（商品コードはシード専用の「M0403-{num}-A」・基準価格100円・買取価格10円）、英語・NMと日本語・SPの規格は元のとおり商品規格一覧から足す。取り込みの規格はセールフラグ無効で販売価格が基準価格と同額になる。"
    elif sid in ("S-M04-03-CASE-031", "S-M04-03-CASE-032", "S-M04-03-CASE-033", "S-M04-03-CASE-034"):
        def f(m):
            n, pl, cl, code = single(m)
            s = csv_sentence([row(code, n, n, 100, 10)]) + "。" + idnote(code, pl) + "。" + OPEN_EDIT + "、「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面の商品規格ID欄に表示された番号を控える（" + cl + "）。" + STOCK0
            return s
        new, k = PAT_CODE.subn(f, old); assert k == 1, sid
        why = "商品コードは元のシードの値。元の「言語・状態・基準価格などは任意」は、言語日本語・状態NM・基準価格100円・買取価格10円にした。"
    elif sid in ("S-M04-03-CASE-044", "S-M04-03-CASE-045"):
        def f(m):
            n, pl, cl, code = single(m)
            base = f"M0403-{num}-BASE"
            s = csv_sentence([row(base, n, n, 100, 10)]) + "。" + idnote(base, pl) + "。" + OPEN_EDIT + "、「規格設定」ボタンから商品規格一覧を開く。"
            s += new_class("日本語", "スライトリープレイド（SP）", code, 100, 100, 10, label=cl) + "。この登録で全店舗・全在庫区分の在庫が在庫数0・総原価0で作られるので、"
            return s
        new, k = PAT_CODE.subn(f, old); assert k == 1, sid
        why = (f"商品は取り込み（商品コード「M0403-{num}-BASE」のニアミント規格）で作り、元のシードの規格「{'DELETE-A-'+num}」は商品規格一覧の「新規作成」から足した。"
               "参考: 元は規格が1件だけの商品で、ケースが削除する規格はその最後の1件になり削除できない（M03-09 L0197）。新しい投入方法では規格が2件になり、ケースが削除する規格は最後の1件ではない。")
        if num == "045":
            why += "シード前半の一括商品Aへの規格の追加は既存の商品への操作なので変えていない。一括商品AにはS-M04-03-MASTERの取り込みで日本語・ニアミントの規格が1件余計にあるが、規格を足すだけなので影響しない。"
    elif sid == "S-M04-03-MASTER":
        rows = [row("M0403-MASTER-A", "一括商品A", "一括商品A", 100, 10), row("M0403-MASTER-B", "一括商品B", "一括商品B", 100, 10), row("M0403-MASTER-C", "大阪商品", "大阪商品", 100, 10)]
        pat = re.compile(r"商品登録編集画面で商品名に「一括商品A」を入れ.*?番号を商品IDとして控える（〔商品ID-M0403-共有C〕）。")
        s = csv_sentence(rows) + "。"
        s += idnote("M0403-MASTER-A", "〔商品ID-M0403-共有A〕") + "。" + idnote("M0403-MASTER-B", "〔商品ID-M0403-共有B〕") + "。" + idnote("M0403-MASTER-C", "〔商品ID-M0403-共有C〕") + "。"
        s += card_edit("一括商品A", "一括商品A", "Foil「通常」のカード詳細（カード登録編集画面でFoilに「通常」を選んで登録したもの）", extra="商品画像はファイルをアップロードでbulk-a.pngを選び、").replace(OPEN_EDIT, "商品マスター(検索結果)の一括商品Aの行から商品登録編集画面（既存の商品の編集）を開き", 1) + "。"
        s += card_edit("一括商品B", "一括商品B", "Foil「特殊」のカード詳細（カード登録編集画面でFoilに「特殊」を選んで登録したもの）", extra="商品画像はファイルをアップロードでbulk-b.pngを選び、").replace(OPEN_EDIT, "商品マスター(検索結果)の一括商品Bの行から商品登録編集画面（既存の商品の編集）を開き", 1) + "。"
        new, k = pat.subn(lambda m: s, old); assert k == 1
        why = ("商品コードはシード専用の値（M0403-MASTER-A/B/C）。元が価格を書いていないので基準価格・販売価格100円・買取価格10円にした。カードと商品画像はCSVの列に無いので、取り込み後に商品登録編集画面（既存の商品の編集）でカード指定とファイルのアップロードをする。"
               "ケースに影響: 元は規格を持たない商品だったが、取り込みで3商品とも日本語・ニアミントの規格（在庫0）が1件ずつ余る。商品名で在庫を探すケースでは余分な行が出うる（規格を持たない商品は作れない。最後の規格は削除できない M03-09 L0197）。")
        basis = BASIC + "、M03-02 L0092・L0098・L0111・L0128・L0129"
    elif sid == "S-M04-03-L-MASTER":
        rows = [row("M0403-LM-A", "一括商品A", "一括商品A", 100, 10), row("M0403-LM-B", "一括商品B", "一括商品B", 100, 10)]
        pat = re.compile(r"商品登録編集画面で商品名に「一括商品A」を入れ（その他の必須項目は任意の有効な値）、登録ボタンを押す。商品登録編集画面で商品名に「一括商品B」を入れ（その他の必須項目は任意の有効な値）、登録ボタンを押す。")
        new, k = pat.subn(lambda m: csv_sentence(rows) + "。", old); assert k == 1
        why = "商品コードはシード専用の値（M0403-LM-A/B。在庫履歴の検索語「L002」に当たらない値）。価格は100円・買取価格10円にした。ケースに影響: 元は規格を持たない商品だったが、取り込みで日本語・ニアミントの規格（在庫0）が1件ずつ余る。"
    elif sid.startswith("S-M04-03-QE-"):
        k0 = {"NEW-058": "001", "LIST-059": "002", "DETAIL-060": "003"}[sid.split("S-M04-03-QE-")[1]]
        code = f"QE0403-{k0}-CODE"; name = f"QE0403-{k0}-NAME"
        pat = re.compile(r"【商品】管理画面の商品登録で、.*?「商品規格を登録」を押す（[^）]*）。", re.S)
        tag = (k0 == "001")
        s = "【商品】" + csv_sentence([row(code, name, name, 100, 1)]) + "。"
        s += idnote(code, f"〔商品ID-M0403-{k0}〕") + "。"
        if tag:
            s += OPEN_EDIT + "、タグの「最新入荷アイテム」にチェックを入れ、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
        s += "【商品規格】" + (SPEC_LIST if tag else OPEN_EDIT + "、「規格設定」ボタンから商品規格一覧を開く") + "。" + nm_edit("日本語") + "（規格は表示対象になり、公開中の店舗ごとの在庫が0で作られる）。"
        new, k = pat.subn(lambda m: s, old); assert k == 1, sid
        why = ("言語日本語・NM・基準価格100円・販売価格100円・買取価格1円・商品公開ステータス公開・本店公開はCSVで入れ、スマレジ連携フラグはCSVの0（連携しない）、販売種別は取り込みの既定（通常）、部門と公開状態は規格を開いて入れた。"
               + ("タグ「最新入荷アイテム」は取り込み後に商品登録編集画面（既存の商品の編集）でチェックして割引率を選ぶ。" if tag else "")
               + "元の「カード指定は任意」はカード指定を押さない形にした。商品カテゴリは元が「1つ以上」としか書いていないのでサプライ・グッズのまま。")
        basis = BASIC + "、M03-02 L0121"
    elif sid == "S-M04-03-RC-STOCK-063":
        code, name = "RC0403001CODE", "RC0403-001-NAME"
        pat = re.compile(r"【商品】管理画面の商品登録で、.*?「商品規格を登録」を押す（[^）]*）。", re.S)
        s = "【商品】" + csv_sentence([row(code, name, name, 1, 1)]) + "。" + OPEN_EDIT + "、「規格設定」ボタンから商品規格一覧を開く。" + nm_edit("日本語") + "（規格は公開中の店舗ごとの在庫が0で作られる）。"
        new, k = pat.subn(lambda m: s, old); assert k == 1
        why = "商品名・商品コード・基準価格1円・販売価格1円・買取価格1円・日本語・ニアミント・公開は元のシードの値。部門と公開状態は規格を開いて入れた。元の「カード指定は任意」は押さない形にした。商品カテゴリは元が「1つ以上」としか書いていないのでサプライ・グッズのまま。"
        basis = BASIC
    else:
        raise SystemExit(sid)
    assert "商品登録編集画面で商品名" not in new and "管理画面の商品登録で" not in new, sid
    out.append([sid, "直す", new, "", basis or BASIC, why])
write("M04-03", out)
