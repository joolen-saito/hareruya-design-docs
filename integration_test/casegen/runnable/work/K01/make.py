import re
names="A02-01 A02-04 A02-05 A07-02 A07-04 A07-05 A07-06".split()
MOD="し、表示された確認モーダルでアップロードを確定する"
APPLY="にチェックを入れて「申込み」を押し、表示されたモーダルの「申込み」ボタンを押す"
for n in names:
    out=["種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由"]
    rows=[l.split('\t') for l in open(f'kept/in/{n}.tsv',encoding='utf-8').read().split('\n')[1:] if l]
    for c in rows:
        item,kind,tid,col,old=c[:5]; new=old; basis=[]; 
        if n.startswith("A02"):
            new,k=re.subn(r"(「CSVファイルのアップロード」(?:ボタン)?を押)す",r"\1"+MOD,new)
            assert k==1,(tid,k)
            basis.append("M03-27 L0092（CSVファイルのアップロード押下後、確認モーダルを表示）")
            if "割引率" in item:
                new,k=re.subn(r"のカード詳細を選んで「商品を登録」を押す","のカード詳細を選び、割引率を販売割引率に登録済みのものから選んで「商品を登録」を押す",new)
                assert k==1,(tid,'d',k)
                basis.append("functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（商品編集では割引率が必須。グッズ商品CSVに割引率の列は無い）")
        else:
            if n=="A07-02":
                new,k=re.subn(r"規約同意にチェックして「申込み」を押す","「ネット買取規約同意」"+APPLY,new)
            elif n=="A07-04":
                new,k=re.subn(r"）、「申込み」を押す。買取依頼完了","）、「ネット買取規約同意」"+APPLY+"。買取依頼完了",new)
            elif n=="A07-05":
                new,k=re.subn(r"口座情報を入れて「申込み」を押す","口座情報を入れ、「ネット買取規約同意」"+APPLY,new)
            else:
                new,k=re.subn(r"ネット買取規約に同意して「申込み」を押す","「ネット買取規約同意」"+APPLY,new)
            assert k>=1,(n,tid)
            basis.append("F05-06 L0060・L0062〜L0066・L0108（規約同意チェックが無いと画面遷移せず、申込み押下後のモーダルの「申込み」で申込処理）")
        assert new!=old and '\t' not in new and '\n' not in new
        out.append("\t".join([kind,tid,col,"直す",new,"；".join(basis),""]))
    open(f'kept/out/{n}.tsv','w',encoding='utf-8').write("\n".join(out)+"\n")
    print(n,len(rows))
