from common import *
hdr, I = load('M06-05')
O = []
B = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0146（識別ID 35）、M03-09 L0086〜L0087・L0130〜L0134・L0159・L0196〜L0198"
PAT = re.compile(r'^管理画面の商品管理＞商品登録で、カード詳細情報の「カード指定」から登録済みのカードを選び、(?P<props>.+)、ほかの必須項目を入れて「商品を登録」を押す$')
LANGJ = {"日本語": "日本語", "英語": "英語", "フランス語": "フランス語", "ドイツ語": "ドイツ語"}

def block(code, name, lang, state, base, sale, buy):
    csv_code = code if state == "NM" else code + "-NM"
    row = csv_row(csv_code, name, name, lang=lang, base=base, sale=base, buy=buy)
    t = (csv_upload([row]) + "。" + open_edit(csv_code)
         + "、「カード指定 >」ボタンを押し、カード検索ポップアップで登録済みのカードの行を選んで決定ボタンを押す。"
         + f"続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、" + DISC + "「商品を登録」ボタンを押す。"
         + spec_list_open() + "。")
    if state == "NM":
        extra = f"セールフラグにチェックを入れて販売価格(円)に{sale}を入れ、" if sale != base else ""
        t += spec_edit_nm(lang, extra)
    else:
        sal = f"セールフラグにチェックを入れて販売価格(円)に{sale}を入れ、" if sale != base else ""
        t += (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で商品コードに「{code}」、言語に{lang}、状態に{state}を選び、基準価格に{base}、{sal}買取価格に{buy}を入れ、部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す。"
              f"続けて商品規格一覧で取り込みで作られた状態ニアミント・{lang}の規格（商品コード「{csv_code}」）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す（規格が2件になっているので削除できる）")
    return t

for r in I:
    sid, old = r[0], r[5]
    k = sid[len('S-M06-05-'):]
    s = old.split('。')
    notes = []
    state_specs = []
    for i, x in enumerate(s):
        m = PAT.match(x)
        if not m:
            continue
        props = m['props']
        code = None
        if k == 'BASE' and 'M6501-A-NM' in props:
            s[i] = block("M6501-A-NM", "Alpha%_Beta", "日本語", "NM", 2200, 2500, 1400)
            notes.append("M6501-A-NMは販売価格2500が基準価格2200と違うので、CSVの基準価格・販売価格は2200にし、取り込み後に規格の画面でセールフラグにチェックを入れて販売価格を2500にする。")
        elif k == 'BASE':
            s[i] = block("M6501-B-SP", "AlphaXYBeta", "英語", "SP", 2500, 2200, 1000)
            notes.append("M6501-B-SPは状態SPなので、CSVが作るニアミントの規格（商品コード「M6501-B-SP-NM」）を残したまま、商品規格一覧の「新規作成」で状態SPの規格（商品コード「M6501-B-SP」）を足し、そのあとニアミントの規格を削除する。販売価格2200は基準価格2500と違うので、新しい規格でセールフラグにチェックを入れて入れる。")
        elif k == 'LANG-STATE':
            mm = re.search(r'言語に(日本語|英語|フランス語|ドイツ語)、状態に(NM|SP|MP|HP)を選び', props)
            n = {("日本語", "NM"): "A", ("英語", "SP"): "B", ("フランス語", "NM"): "C", ("ドイツ語", "MP"): "D", ("日本語", "HP"): "E"}[(mm[1], mm[2])]
            code = f"M0605-LANG-{n}"
            s[i] = block(code, code, mm[1], mm[2], 1000, 1000, 500)
            if mm[2] != 'NM':
                state_specs.append(code)
        else:
            mc = re.search(r'商品コードに「([^」]+)」', props)
            if mc:
                code = mc[1]
            else:
                code = f"M0605-{k}-P"
            base = 1800 if k == 'PRICE-048' else (9999 if k == 'COUNTS' else 1000)
            buy = 9000 if k == 'COUNTS' else base // 2
            s[i] = block(code, code, "日本語", "NM", base, base, buy)
            if k in ('NAMES', 'STATUSES', 'DATES'):
                notes.append(f"元の商品名・商品コード・言語・状態・基準価格・販売価格・買取価格は『任意の値』なので、商品コード・商品名は「{code}」、日本語・ニアミント、基準価格・販売価格1000、買取価格500とした。")
    if state_specs:
        notes.append("状態がニアミント以外の商品（" + "、".join(state_specs) + "）は、CSVが作るニアミントの規格（商品コードは末尾に「-NM」を付けた値）を残したまま、商品規格一覧の「新規作成」で元の状態の規格を足し、そのあとニアミントの規格を削除する（同じカード・言語のニアミントの規格が査定画面の検索に残らないようにするため。最後の1件は削除できない M03-09 L0197）。商品名・商品コードは元の『任意の値』なので「M0605-LANG-A〜E」とし、基準価格・販売価格1000、買取価格500にした。")
    left = [x for x in s if '商品管理＞商品登録' in x]
    assert not left, (sid, left[0][:50])
    if k not in ('BASE', 'LANG-STATE', 'NAMES', 'STATUSES', 'DATES'):
        notes.append(f"元の商品名・言語・状態・価格は『任意の値』なので、商品名は商品コードと同じ値、日本語・ニアミント、基準価格・販売価格{'1800' if k=='PRICE-048' else ('9999' if k=='COUNTS' else '1000')}（買取価格は" + ("9000" if k == 'COUNTS' else ("900" if k == 'PRICE-048' else "500")) + "）とした。")
    reason = ("元の手順は商品管理＞商品登録でカード指定から商品を新規登録していた。グッズ商品CSVで商品と状態ニアミントの規格を作り、取り込んだ商品を商品登録編集画面（既存の商品の編集）でカード指定して商品名を入れ直し、割引率を選んで「商品を登録」を押す。"
              "規格は元の値（商品コード・言語・基準価格・買取価格）をCSVで入れ、部門は選択肢の先頭、公開ステータスは公開にする（元のシードは規格の部門・公開ステータスに触れていない）。サイズ1・重量1・原価単価10・支店の商品公開ステータスは1（ee の初期値は公開）とした。") + "".join(notes)
    O.append([sid, "直す", joined(s), "", B, reason])
write('M06-05', O)
print(len(O))
