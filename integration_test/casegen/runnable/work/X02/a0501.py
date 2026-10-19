import re
rows=open("fix2/in/A05-01.tsv",encoding="utf-8").read().split("\n")[1:]
out=["種別\t対象ID\t列\t判定\t新しい文\t根拠\t理由"]
pat=re.compile(r"在庫変更CSV登録画面で、この商品の在庫増減数を(\d+)にしたCSVを取り込み、この店舗の在庫を\d+にする。")
for r in rows:
    if not r: continue
    c=r.split("\t"); t=c[4]
    # tokens in order
    ev=[]
    for m in re.finditer(r"店名に「([^」]+)」|商品コードは「([^」]+)」|"+pat.pattern,t):
        ev.append(m)
    store=code=None; res=[]; pos=0; n=0
    for m in ev:
        if m.group(1): store=m.group(1)
        elif m.group(2): code=m.group(2)
        else:
            N=m.group(3)
            new=(f"在庫変更CSV登録画面で、店舗に「{store}」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、"
                 f"承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で承認するメンバー（在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバー）を選び、"
                 f"この商品（商品コード「{code}」）の在庫増減数を{N}にした（仕入単価「100」の1行の）CSVを「ファイルを選択」で選んで「一括登録を実行」を押して取り込み、この店舗の在庫を{N}にする。"
                 f"在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押し、表示された確認画面で「OK」を押す。")
            res.append(t[pos:m.start()]); res.append(new); pos=m.end(); n+=1
    res.append(t[pos:]); new="".join(res)
    assert n>=1 and store and code, c[2]
    out.append("\t".join(["シード",c[2],"投入方法","直す",new,"M04-21 L0127・L0131・L0132・L0135・L0166・L0168、M04-32 L0108・L0110・L0141・L0218・L0297・L0301（product_csv/PROMPT.md「在庫と価格」の型）","承認するメンバーのシードが同機能に無いため、在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーとだけ書いた（新規登録した店舗の承認権限の付与は元の文に無く、実行者が既存のメンバーから選ぶ）。仕入単価は型に合わせ100"]))
open("out_a0501.tsv","w").write("\n".join(out)+"\n") if False else None
import pathlib
pathlib.Path("fix2/out").mkdir(exist_ok=True)
open("fix2/out/A05-01.tsv","w",encoding="utf-8").write("\n".join(out)+"\n")
print(len(out)-1)
