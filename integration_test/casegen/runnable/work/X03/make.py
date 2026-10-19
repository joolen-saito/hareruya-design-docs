import re,pathlib
R=pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/runnable/fix2")
NAMES="A02-04 A06-08 A17-05 F01-01 F02-02 F03-02 F03-08 F04-02 F04-03 F06-02".split()
DISC="割引率を販売割引率に登録済みのものから選び"
BASIS_D="M03-02 識別ID35、functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目（編集では割引率が必須）"
STOCK_RE=re.compile(r"在庫変更CSV登録画面で、?商品コード「([^」]+)」(?:と「([^」]+)」)?の在庫増減数に(10|1以上)を入れたCSVを取り込む。")
def stock(m):
    codes=[m.group(1)]+([m.group(2)] if m.group(2) else [])
    q="10" if m.group(3)=="10" else "10（1以上の数）"
    rows="・".join(f"商品コード「{c}」・在庫増減数「{ '10' if q=='10' else '10' }」・仕入単価「100」" for c in codes)
    n=len(codes)
    line="の1行" if n==1 else f"の{n}行"
    chk="この申請の行" if n==1 else "この申請の全部の行"
    return ("在庫変更CSV登録画面で、店舗に「本店」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、承認通知先（所属選択）で承認するメンバーの所属を選び、承認通知先（メンバー選択）で承認するメンバー（在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバー）を選び、"
      +rows+f"{line}を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押し、表示された確認モーダルで「OK」を押す（M04-21 L0056〜L0058・L0127〜L0135・L0166〜L0168）。"
      +f"在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、{chk}にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押し、表示された確認画面で「OK」を押す（M04-32 L0108・L0110・L0141・L0218・L0297・L0301）。")
def fix(name,tid,col,old):
    """returns (判定,新しい文,根拠,理由)"""
    new=old
    if name=="A02-04":
        a="の商品登録編集画面で商品公開ステータスに「廃止」"
        assert new.count(a)==1
        new=new.replace(a,"の商品登録編集画面で"+DISC+"、商品公開ステータスに「廃止」")
        return "直す",new,BASIS_D,"CSVの割引率(ID)は取り込み用で、最後の商品登録編集画面で「商品を登録」を押す前に割引率を選ぶ操作が無かったので書き足した"
    if name=="A06-08":
        if tid=="S-A06-08-BASE":
            a="略称タグに「A06-08棚」を選んで「商品を登録」を押す"
            assert new.count(a)==1
            new=new.replace(a,"略称タグに「A06-08棚」を選び、"+DISC+"、「商品を登録」を押す")
        else:
            a="2件目は商品登録編集画面で商品公開ステータスを「廃止」にして「商品を登録」を押し"
            assert new.count(a)==1
            new=new.replace(a,"2件目は商品登録編集画面で"+DISC+"、商品公開ステータスを「廃止」にして「商品を登録」を押し")
        return "直す",new,BASIS_D,"商品登録編集画面で「商品を登録」を押す前に割引率を選ぶ操作が無かったので書き足した（CSVの割引率(ID)列とは別）"
    if name=="A17-05":
        assert "割引率が未選択なら選択肢の先頭を選び" in old and old.index("割引率が未選択なら")<old.index("「商品を登録」を押")
        return "直さない","",BASIS_D,"「商品を登録」を押す前に「割引率が未選択なら選択肢の先頭を選び」が既にある（グッズ商品CSVに割引率の列が無いので未選択になり、先頭を選ぶ書き方で足りる）"
    if name=="F01-01":
        a="から商品画像を選び「商品を登録」を押す"
        n1=new.count(a); assert n1>=1,tid
        new=new.replace(a,"から商品画像を選び、"+DISC+"、「商品を登録」を押す")
        b="のチェックを外して「商品を登録」を押す"
        n2=new.count(b)
        new=new.replace(b,"のチェックを外し、割引率が未選択なら販売割引率に登録済みのものから選び、「商品を登録」を押す")
        return "直す",new,BASIS_D,f"商品登録編集画面の「商品を登録」{n1+n2}か所の前に割引率を選ぶ操作を書き足した（商品画像を入れる編集{n1}か所と、ほかの商品のタグを外す編集{n2}か所。ほかの商品は割引率が入っているか分からないので「未選択なら」とした）"
    if name=="F02-02":
        a="カードセットで「SET-A-008」を選び、商品公開ステータスを公開にして「商品を登録」"
        assert new.count(a)==1
        new=new.replace(a,"カードセットで「SET-A-008」を選び、"+DISC+"、商品公開ステータスを公開にして「商品を登録」")
        return "直す",new,BASIS_D,"割引率を選ぶ操作を書き足した。気づき（直していない）: この文は商品登録編集画面で新規に商品を作っていて、刷新後は商品の新規登録が禁止（M03-02 L0075〜L0077）のため、商品の項目（グッズ商品CSV登録への書き直し）が別に要る"
    if name=="F03-02":
        pat=re.compile(r"(商品ID 〔[^〕]+〕 の商品登録編集画面を開き、)")
        assert len(pat.findall(new))==1,tid
        new=pat.sub(lambda m:m.group(1)+DISC+"、",new)
        return "直す",new,BASIS_D,"商品IDを指定して開く商品登録編集画面（既存の商品の編集）で「商品を登録」を押す前に割引率を選ぶ操作が無かったので書き足した（CSVの割引率(ID)列とは別）"
    if name in("F03-08","F06-02"):
        if name=="F03-08":
            a="「CSVファイルのアップロード」を押す。管理画面の商品マスター"
            assert new.count(a)==1
            new=new.replace(a,"「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する。管理画面の商品マスター")
        else:
            a="「CSVファイルのアップロード」を押し、「CSVファイルをアップロードしました」の表示を確かめる"
            assert new.count(a)==1
            new=new.replace(a,"「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する。そのあと「CSVファイルをアップロードしました」の表示を確かめる")
        return "直す",new,"M03-27 L0092（グッズ商品CSVのアップロード押下後に確認モーダルを表示する）","グッズ商品CSVのアップロード1回に対し、確認モーダルで確定する操作を1か所書き足した"
    if name in("F04-02","F04-03"):
        ms=STOCK_RE.findall(new)
        assert len(ms)==1,(tid,len(ms))
        new=STOCK_RE.sub(stock,new)
        r="在庫変更CSV登録で入れた在庫は承認されるまで在庫に入らないので、product_csv/PROMPT.md「在庫と価格」の型どおりに、店舗・在庫区分・在庫変動区分・在庫変動理由・承認通知先（所属選択・メンバー選択）と、承認一覧での承認を書いた。この機能のシードに管理者のシードは無いので、同じ機能の既存シード（S-F04-02-GUEST-UNREGISTERED-003 など）と同じ「在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバー」の書き方にした。店舗は注文を受ける本店（フロント（本店）で買うため）。仕入単価は型どおり100、増減数は元の10（1以上は10）のまま"
        return "直す",new,"M04-21 L0056〜L0058・L0127〜L0135・L0166〜L0168、M04-32 L0108・L0110・L0141・L0218・L0297・L0301、M04-02 L0190・L0193",r
    raise SystemExit("unhandled "+name)
for n in NAMES:
    lines=(R/"in"/f"{n}.tsv").read_text(encoding="utf-8").split("\n")
    out=["\t".join(["種別","対象ID","列","判定","新しい文","根拠","理由"])]
    for l in lines[1:]:
        if not l: continue
        f=l.split("\t")
        d,new,b,r=fix(n,f[2],f[3],f[4])
        for x in (new,b,r): assert "\t" not in x and "\n" not in x
        out.append("\t".join([f[1],f[2],f[3],d,new,b,r]))
    (R/"out"/f"{n}.tsv").write_text("\n".join(out)+"\n",encoding="utf-8")
    print(n,len(out)-1)
