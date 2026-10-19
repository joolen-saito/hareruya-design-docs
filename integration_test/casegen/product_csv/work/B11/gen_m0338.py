import pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
ls = [l.rstrip('\n').split('\t') for l in open(P/'in/M03-38.tsv', encoding='utf-8')]
rows = [x for x in ls[1:] if x and x != ['']]
BAS = "M03-27 L0092・L0124、M03-02 L0075〜L0077"
out = []
for r in rows:
    sid, old = r[0], r[5]
    n = int(sid.split('-')[-1])
    if sid in ('S-M03-38-IMPORT-012','S-M03-38-IMPORT-013','S-M03-38-IMPORT-014'):
        why = "商品はDBシードで直接登録しており、商品登録画面は使っていない。"
        b = BAS
    elif '-QB-CSV-' in sid:
        why = "CSVフィクスチャのファイルを作るだけで、商品は作らない。"
        b = "M03-38（取込CSV）"
    elif 'L-PROD' in sid:
        why = "商品はすでにグッズ商品CSV登録で作っており、商品登録編集画面は既存の商品の公開ステータスを変えるだけ。"
        b = BAS
    elif '-QB-PROD-' in sid:
        why = "商品はすでにグッズ商品CSV登録で作っている。商品登録編集画面（タグ外し・割引率）と商品規格登録編集画面は既存の商品・規格の編集だけ。" if n in (43,44) else "商品はすでにグッズ商品CSV登録で作っている。商品登録編集画面は他の商品のタグを外す編集だけ。"
        b = BAS
        if n in (43,44):
            why += "なお「必須の部門に任意の選択肢を選んで」は曖昧な書き方だが、元のシードの別の部分なので直さない。"
    else:
        why = "商品はすでにグッズ商品CSV登録で作っており、商品登録編集画面は既存の商品の公開ステータスを変えるだけ。"
        b = BAS
        if '商品を登録」を押す' in old:
            why += "なお編集の「商品を登録」は割引率なども必須の項目だが書かれていない（元のシードの別の部分なので直さない）。"
    out.append([sid, "直さない", "", "", b, why])
with open(P/'out/M03-38.tsv','w',encoding='utf-8') as f:
    f.write("\t".join(HDR)+"\n")
    for r in out: f.write("\t".join(r)+"\n")
