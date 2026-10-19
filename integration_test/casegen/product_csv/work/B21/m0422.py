from common import *
import re
R, ids = load("M04-22")
out = []
BASIS = "M03-27 L0092・L0119・L0124・L0129・L0134・L0170・L0225〜L0229、M03-02 L0075〜L0077"
A255 = "文字Aを255文字連結した値"
pat = re.compile(
    r"商品登録画面で商品名に(?:「([^」]*)」|任意の値)を入れ、ほかの必須項目に任意の値を入れて登録ボタンを押す。"
    r"続けて商品規格登録画面で商品コードに(?:「([^」]*)」|(文字Aを255文字連結した値))(?:、基準価格に「(\d+)」)?を入れ、"
    r"ほかの必須項目に任意の値を入れて登録ボタンを押す（店舗が開店中であれば、各店舗・各在庫区分の在庫が在庫数0で作られる）。")
def mk(m):
    nm, code, a255, base = m.group(1), m.group(2), m.group(3), m.group(4)
    code = code or A255
    name = nm or (code if code != A255 else "最大長商品")
    b = int(base or 1000)
    buy = 1 if b == 1 else 100 if b >= 1000 else 10
    return csv_up([row(code, name, name, base=b, buy=buy)]).replace("商品コードは「" + A255 + "」", "商品コードは" + A255) 
# 例外: 043 / 047 / 048 は別処理
pat043 = re.compile(r"【商品】管理画面の商品登録で、「カード指定」は任意.*?商品規格を登録」を押す（登録した規格は表示対象になり、開店中の店舗ごとの在庫が0で作られる）。(?=【在庫】)")
pat047 = re.compile(r"商品登録画面で商品名に「([^」]*)」ほか必須項目を入れて登録し、続けて商品規格登録画面で、商品コード=([A-Z0-9-]+)、スマレジ連携フラグ=連携しない、買取価格=100、指定のない基準価格ほか必須項目には任意の値を入れて「商品規格を登録」を押す。")
for sid in ids:
    r = R[sid]; old = r[5]; why = ""
    if sid.endswith("QE-LIST-043"):
        m = pat043.search(old); assert m, sid
        new_blk = ("【商品】" + csv_up([row("QE0422-001-CODE", "QE0422-001-NAME", "QE0422-001-NAME", base=100, buy=1)], stock_note=False).replace("グッズ商品は状態ニアミントの規格が1件作られる。", "グッズ商品は状態ニアミント・日本語の規格が1件作られ（本店公開・販売制限なし）、開店中の店舗ごとの在庫が0で作られる。") 
                   + "商品一覧でこの商品名の行に表示されたIDを控える（〔商品ID-M0422-001〕）。")
        new = old[:m.start()] + new_blk + old[m.end():]
        # 元の商品IDを控える文はブロック内に含まれていたため上で補った
        why = "元は「カード指定は任意」だったので、カード指定はしない（取り込んだ商品のまま）。販売価格100・買取価格1はCSVの基準価格・販売価格100・買取価格1で表した（買取価格は販売価格を上回れない M03-27 L0119）。"
    elif "RD-STOCK" in sid:
        m = pat047.search(old); assert m, sid
        name, code = m.group(1), m.group(2)
        new = old[:m.start()] + csv_up([row(code, name, name, base=1000, buy=100)], stock_note=False).replace("グッズ商品は状態ニアミントの規格が1件作られる。", "グッズ商品は状態ニアミントの規格が1件作られる（スマレジ連携フラグは連携しない）。") + old[m.end():]
        new = new.replace("【商品】商品を登録できるメンバーで管理画面にログインし、", "【商品】グッズ商品CSV登録を使えるメンバーで管理画面にログインし、")
        why = "元の「指定のない基準価格」は1000にした（買取価格100は元のまま）。「商品を登録できるメンバー」は、CSV登録を使える権限のメンバーと読み替えた（M03-27 の権限は設計書で未確認）。"
    else:
        n = len(pat.findall(old)); assert n >= 1, sid
        new = pat.sub(mk, old)
        assert "商品登録画面で商品名に" not in new, sid
        if A255 in old: why = "CSVの商品コードの最大文字数は設計書に記載が無い（M03-27 L0195）。255文字で取り込めるかは実機で確認が要る。"
        if sid.endswith("MOVE-008") or sid.endswith("MOVE-046"):
            why = "スマレジ連携に当たる（店舗Aのスマレジ在庫を作るが、CSVのスマレジ連携フラグは0で作る。元のシードも規格のスマレジ連携フラグを指定していなかった）。"
        if sid.endswith("MOVE-MAX-016"):
            why = "元の基準価格1に合わせ、基準価格・販売価格を1、買取価格を1にした（買取価格は販売価格を上回れない M03-27 L0119）。"
    out.append([sid, "直す", new, "", BASIS, why])
save("M04-22", out)
print(len(out))
