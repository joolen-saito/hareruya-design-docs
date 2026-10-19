import re
M="表示された確認モーダルでアップロードを確定する"
D="割引率を販売割引率に登録済みのものから選び、"
for n in ["F01-01","F02-01","F03-02","F03-05"]:
    L=open(f"kept/in/{n}.tsv",encoding="utf-8").read().split("\n")
    out=["\t".join(["種別","対象ID","列","判定","新しい文","根拠","理由"])]
    for l in L[1:]:
        if not l: continue
        x=l.split("\t"); items=x[0].split(","); t=x[4]; new=t; basis=[]; notes=[]
        if "確認モーダル" in items:
            a=new.count("「CSVファイルのアップロード」を押す")
            new=new.replace("「CSVファイルのアップロード」を押す","「CSVファイルのアップロード」を押し、"+M)
            new=new.replace("CSVファイルをアップロードする","CSVファイルをアップロードし、"+M)
            new=new.replace("「CSVファイルのアップロード」で取り込む","「CSVファイルのアップロード」で取り込み、"+M)
            new=new.replace("を入れた1行のCSVを取り込む","を入れた1行のCSVを取り込み、"+M)
            k=new.count("確認モーダルでアップロードを確定")
            ex=len(re.findall(r"アップロード」を押|アップロードする|アップロード」で取り込|1行のCSVを取り込",t))
            assert k==ex,(x[2],k,ex)
            basis.append("グッズ商品CSV登録 M03-27 L0092"+("・カード商品CSV登録 M03-26 L0094" if "カード商品CSV登録" in t else "")+"（アップロード押下後に確認モーダルを表示）")
        if "割引率" in items:
            n0=new.count("「商品を登録」を押す")
            assert n0==t.count("商品を登録」"),x[2]
            new=re.sub(r"(て|び)(「商品を登録」)",lambda m:m.group(1)+"、"+D+m.group(2),new)
            basis.append("functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）・M03-27にも割引率の列なし")
        if "割引率" not in items and "商品を登録」" in t and "割引率" not in t.replace("割引率(ID)",""):
            notes.append("気づいた誤り: 既存の商品を「商品を登録」で編集する操作があるが割引率を選んでいない（項目に無いため直していない）")
        if "カード商品CSV登録" in t and "割引率(ID)" in t and False: pass
        assert new!=t and "\t" not in new and "\n" not in new
        out.append("\t".join([x[1],x[2],x[3],"直す",new,"。".join(basis) if False else "；".join(basis),"".join(notes)]))
    open(f"kept/out/{n}.tsv","w",encoding="utf-8").write("\n".join(out)+"\n")
    print(n,len(out)-1)
