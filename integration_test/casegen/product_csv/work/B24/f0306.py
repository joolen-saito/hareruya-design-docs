from common import *
hdr, I = load('F03-06')
O = []
B = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0216〜L0232、M03-02 L0075〜L0077・L0092・L0146（識別ID 35）、M03-09 L0086〜L0087・L0130〜L0134・L0159・L0196〜L0198"
C0 = re.compile(r'^管理画面の商品登録画面（新規）でカード指定ボタンを押し、(?P<rest>.+)$')
C1 = re.compile(r'^(?:続けて|管理画面の商品登録画面（新規）で)商品名\(日\)に(?P<nm>.+?)を入れ、商品画像に(?P<img>.+?)、販売制限で「(?P<lim>[^」]+)」、支店の商品公開ステータスで「(?P<br>[^」]+)」、公開状態で「(?P<pub>[^」]+)」を選び、そのほかの必須項目に有効な値を入れて「商品を登録」ボタンを押す$')
S1 = re.compile(r'^(?P<nm>.+?)の商品登録画面の「規格設定」から商品規格一覧を開いて新規登録ボタンを押し、商品規格登録画面で状態に「(?P<st>[^」]+)」、販売価格\(円\)に(?P<pr>\d+)を入れ、(?P<mid>.*)そのほかの必須項目に有効な値を入れて「商品規格を登録」ボタンを押す$')
REG = {"制限なし": 0, "日本国内のみ": 1, "海外のみ": 2}
for r in I:
    sid, old = r[0], r[5]
    k = sid[len('S-F03-06-'):]
    s = old.split('。')
    notes = []
    if k == 'LIMIT-007':
        i1 = next(i for i, x in enumerate(s) if x.startswith('管理画面の商品登録画面（新規）で商品名(日)にその商品名'))
        i2 = next(i for i, x in enumerate(s) if x.startswith('その商品の商品登録画面の「規格設定」'))
        codes = [f"F0306-007-{n:02d}" for n in range(1, 17)]
        rows = [csv_row(c, f"履歴商品{n:02d}", pub=2, branch=1, base=100, region=1, buy=50) for n, c in enumerate(codes, 1)]
        s[i1] = (csv_upload(rows) + "。16商品それぞれについて次の編集を行う。" + open_edit(None)
                 + "、商品名(日)にその商品名（履歴商品01〜履歴商品16）を入れ、商品画像に画像ファイルを1件追加し、" + DISC + "「商品を登録」ボタンを押す")
        s[i2] = ("その商品の商品登録画面の「規格設定」から商品規格一覧を開き、" + spec_edit_nm("日本語").replace("商品規格登録編集画面", "商品規格登録画面"))
        notes.append("16商品の商品コードはシード専用に「F0306-007-01」〜「F0306-007-16」とした（元のシードに商品コードは無い）。")
    else:
        pend = {}
        for i, x in enumerate(s):
            m = C1.match(x)
            if not m:
                continue
            nm = m['nm']
            code = nm if nm.startswith('F0306') else 'F0306-' + nm
            # 後ろの規格の文
            j = next(j for j in range(i + 1, len(s)) if S1.match(s[j]) and S1.match(s[j])['nm'] == nm)
            ms = S1.match(s[j])
            pr = int(ms['pr']); mid = ms['mid']
            card = C0.match(s[i - 1]) if i > 0 else None
            sale = 'セールフラグにチェックを入れ、' in mid
            lang = "日本語"
            base = 1000 if sale else pr
            row = csv_row(code, nm, pub=2 if m['pub'] == '公開' else 1, branch=1 if m['br'] == '公開' else 0,
                          base=base, sale=base, buy=min(100, pr // 2), region=REG[m['lim']])
            t = csv_upload([row]) + "。" + open_edit(code)
            if card:
                t += "、「カード指定 >」ボタンを押し、" + card['rest'] + f"。続けて商品名(日)に{nm}、商品名(英)に{nm}を入れ（カード指定で自動で入った値は書き換える）、"
                s[i - 1] = None
            else:
                t += f"、"
            t += f"商品画像に{m['img']}、" + DISC + "「商品を登録」ボタンを押す"
            s[i] = t
            extras = ""
            if sale:
                extras = f"セールフラグにチェックを入れて販売価格(円)に{pr}を入れ、"
            elif 'セールフラグにチェックを入れず' in mid:
                extras = "セールフラグにチェックを入れず、"
            if m['pub'] == '公開' or True:
                pass
            if ms['st'] == 'スライトリープレイド':
                newcode = code + '-EX'
                s[j] = (f"{nm}の商品登録画面の「規格設定」から商品規格一覧を開き、商品規格一覧の「新規作成」を押し、商品規格登録編集画面で商品コードに「{newcode}」、状態に「スライトリープレイド」、言語に日本語を選び、"
                        f"基準価格と販売価格に{pr}を入れ、部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す"
                        )
                assert s[j + 1].startswith('登録後の商品規格登録画面の商品規格ID欄') and s[j + 2].startswith('商品画像IDは画面に表示されないため')
                s[j + 2] = s[j + 2] + f"。続けて商品規格一覧で取り込みで作られた状態ニアミント・日本語の規格（商品コード「{code}」）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す（規格が2件になっているので削除できる）"
                notes.append("EX-ONLY-010は状態スライトリープレイドの規格だけを持つので、取り込みで作られたニアミントの規格は、スライトリープレイドの規格を足したあとで削除する（最後の1件は削除できない M03-09 L0197）。新しく足す規格の商品コードは「" + newcode + "」とした（元のシードに規格の商品コードは無い）。")
            else:
                s[j] = f"{nm}の商品登録画面の「規格設定」から商品規格一覧を開き、" + spec_edit_nm(lang, extras).replace("商品規格登録編集画面", "商品規格登録画面")
            if sale:
                notes.append(f"{nm}はセールフラグ付きで販売価格{pr}。CSVの基準価格・販売価格は1000にし、取り込み後に規格の画面でセールフラグにチェックを入れて販売価格を{pr}にする（元のシードは基準価格を書いていない）。")
        assert any(True for x in s), sid
    left = [x for x in s if x and re.search(r'商品登録画面（新規）|新規登録ボタンを押し', x)]
    assert not left, (sid, left[0][:80])
    reason = ("元の手順は商品登録画面（新規）で商品を登録していた。グッズ商品CSVで商品と状態ニアミントの規格を作り、取り込んだ商品を商品登録編集画面（既存の商品の編集）で開いて商品画像（CSVに商品画像の列は無い）・カード指定・商品名を入れる。"
              "販売制限はCSVの地域別販売制限（制限なし=0、日本国内のみ=1、海外のみ=2）、公開状態は商品公開ステータス、支店の商品公開ステータスは支店の商品公開ステータスの列で入れる。"
              "元のシードに無い商品コードはシード専用に「F0306-商品名」とし、商品名(英)は商品名(日)と同じ値、サイズ1・重量1・原価単価10・既存の購入グループ・サプライ・グッズのカテゴリにした（元は『そのほかの必須項目に有効な値』）。"
              "買取価格は元のシードに無いので販売価格の半分以下にした。元の手順の状態ニアミントの規格は、CSVが作る規格を使う。") + "".join(notes)
    O.append([sid, "直す", joined(s), "", B, reason])
write('F03-06', O)
print(len(O))
