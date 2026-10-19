rows=open("fix2/in/B02-05.tsv",encoding="utf-8").read().split("\n")[1:]
out=["種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由"]
A="入れて「商品を登録」ボタンを押し"
B="入れ、割引率を販売割引率に登録済みのものから選んで「商品を登録」ボタンを押し"
for r in rows:
    if not r: continue
    c=r.split("\t"); t=c[4]
    k=t.count(A); assert k>=1 and "割引率" not in t
    out.append("\t".join(["シード",c[2],"投入方法","直す",t.replace(A,B),"functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（割引率は未選択では登録できない必須項目）","元のシードは割引率の指定が無いので特定の値は決めず、販売割引率に登録済みのものから選ぶと書いた（%d箇所）。なお元の文は商品登録画面で商品を新規登録しており、刷新後は新規登録が禁止（M03-02 L0075〜L0077）。項目「商品」はこの担当に含まれないため直していない。「任意の値」の曖昧な書き方も同様" % k]))
open("fix2/out/B02-05.tsv","w",encoding="utf-8").write("\n".join(out)+"\n"); print(len(out)-1)
