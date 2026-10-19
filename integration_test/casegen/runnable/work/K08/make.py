import re
PH="表示された確認モーダルでアップロードを確定する"
out_dir="kept/out/"
for n in ["M03-02","M03-04","M03-06"]:
    ls=open(f"kept/in/{n}.tsv",encoding="utf-8").read().split("\n")
    rows=[l.split("\t") for l in ls[1:] if l]
    res=[]
    for f in rows:
        item,kind,tid,col,old,cases,hint=f
        new=old; basis=[]; reason=""
        if n=="M03-02":
            a="「CSVファイルのアップロード」ボタンを押す（"
            assert new.count(a)==1,tid
            new=new.replace(a,"「CSVファイルのアップロード」ボタンを押し、"+PH+"（"); basis.append("M03-27 L0092")
        elif n=="M03-06":
            a="「CSVファイルのアップロード」を押す（"
            assert new.count(a)==1,tid
            new=new.replace(a,"「CSVファイルのアップロード」を押し、"+PH+"（"); basis.append("M03-27 L0092")
        else:
            a="「CSVファイルのアップロード」を押し、確認モーダルで実行する"
            if a in new:
                assert new.count(a)==1
                new=new.replace(a,"「CSVファイルのアップロード」を押し、"+PH); basis.append("M03-27 L0092（元は「確認モーダルで実行する」。語句を指定の形に揃えた）")
            b="補助商品10行のCSVをアップロードする。"
            if b in new:
                assert new.count(b)==1
                new=new.replace(b,"補助商品10行のCSVをアップロードし、"+PH+"。"); basis.append("M03-27 L0092（2回目の取込に確認モーダルの確定が無かったので足した）")
            if "割引率" in item:
                c="追加して「商品を登録」ボタン"
                d="を選んで「商品を登録」ボタン"
                if c in new:
                    new=new.replace(c,"追加し、割引率を販売割引率に登録済みのものから選び、「商品を登録」ボタン")
                else:
                    assert new.count(d)==1,tid
                    new=new.replace(d,"を選び、割引率を販売割引率に登録済みのものから選んで「商品を登録」ボタン")
                basis.append("functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）")
        assert new!=old,tid
        for x in (new,): assert "\t" not in x and "\n" not in x
        res.append(["シード",tid,col,"直す",new,"。".join(basis),""])
    with open(out_dir+n+".tsv","w",encoding="utf-8") as fo:
        fo.write("\t".join(["種別","対象ID","列","判定","新しい文","根拠","理由"])+"\n")
        for r in res: fo.write("\t".join(r)+"\n")
    print(n,len(res))
