from common import *
ix,rows=load("M04-02")
R={r[0]:r for r in rows}
res=[]
def cut(old, a, b):
    i=old.index(a); j=old.index(b,i)
    return old[:i], old[i:j], old[j:]

for r in rows:
    sid=r[0]; old=r[ix["投入方法"]]
    if sid=="S-M04-02-REPIMAGE-050":
        res.append(keep(sid,"既存の商品を開いて画像を足し、商品規格を追加しているだけ（商品登録画面で開く商品は S-M04-02-MASTER で作る〔商品ID-M0402-共有〕の既存の商品）。商品を新しく作っていない。","")); continue
    if sid=="S-M04-02-MASTER":
        o="③ 商品登録画面で商品名に「在庫試験商品A」を入れ、カードの検索で②のカードを選び、商品画像に画像ファイルを1点アップロードして登録ボタンを押す（この画像を各ケースの商品規格の代表画像に使う）。登録後の商品登録画面に表示された商品IDを控える（〔商品ID-M0402-共有〕）。"
        assert o in old
        code="M0402-MASTER-CSV"
        n=("③ "+csv_one(code,"在庫試験商品A","在庫試験商品A",1000,1000,100)+open_prod(code)
           +"「カード指定 >」ボタンを押し、カード検索ポップアップで②のカードの詳細情報を選ぶ。続けて商品名(日)・商品名(英)に「在庫試験商品A」を入れ（カード指定で自動で入った値は書き換える）、商品画像に画像ファイルを1点アップロードし、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す（この画像を各ケースの商品規格の代表画像に使う）。"
           +"元のシードはこの商品に商品規格を作らない（各ケースが規格を足す）ので、「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミント・日本語の規格（商品コード「M0402-MASTER-CSV」）の行を開いて「商品規格を削除」ボタンを押す。"
           +"商品登録編集画面に表示された商品IDを控える（〔商品ID-M0402-共有〕）。")
        new=old.replace(o,n)
        why=("元のシードは商品登録画面で商品を作り、規格は作らなかった。商品はグッズ商品CSV登録で作り、取り込みで必ず作られるニアミント・日本語の規格は、規格を作らない元のシードに合わせて削除する。"
             "ケースに影響: 各ケースが同じ商品へ言語日本語・状態NMの規格を足すので、取り込みの規格を残すと同じ言語・状態の規格が重なる。このため削除したが、規格が1件も無い商品になることが商品規格の削除で許されるかは設計書に書かれていない（M03-09 に削除の条件の記述なし）。実機で削除できなければ直せない。"
             "商品コードは元に無いので『M0402-MASTER-CSV』（削除する規格にだけ使う）にした。買取価格・商品名(英)・原価単価はCSVの必須列の都合で入れた値。元のシードの商品カテゴリの指定は無いので、サプライ・グッズのまま。")
        res.append([sid,"直せない","","","M03-09 L0197、M03-27 L0124","元のシードは商品に規格を作らない（各ケースが同じ商品へ言語日本語・状態NMの規格を足す）。グッズ商品CSVは必ずニアミント・日本語の規格を1件作り、その規格が最後の1件のときは削除できない（不正要求HTTP400。M03-09 L0197）ので、規格が1件も無い商品は画面とCSVだけでは作れない。ケースに影響: 取り込みの規格を残すと各ケースが足す同じ言語・状態の規格と重なる。"]); continue
    if sid.startswith("S-M04-02-QE-") or sid.startswith("S-M04-02-RC-STOCK"):
        # 商品〜商品規格 の範囲を差し替える
        if sid.startswith("S-M04-02-RC-STOCK"):
            a="【商品】管理画面の商品登録で"; b="申請者（rc0402-"
        else:
            a="【商品】管理画面の商品登録で"; b="【商品規格】"
        pre,mid,post=cut(old,a,b)
        # 値を拾う
        import re as _re
        name=_re.search(r"商品名\(日\)に「([^」]+)」",mid).group(1)
        code=_re.search(r"商品コードに「([^」]+)」",old).group(1)
        sale="セールフラグ=チェックする" in old
        tag=_re.search(r"タグの「([^」]+)」にチェック",mid)
        m_ = _re.search(r"(商品一覧でこの商品名の行に表示されたIDを控える（[^）]+）。)",mid)
        idsent=m_.group(1) if m_ else ""
        branch="支店の商品公開ステータス=公開" in mid
        # 既存文の「商品を登録」押下以降は商品一覧で控える文だけ
        csvs=csv_one(code,name,name,1 if sale else (1 if sid.startswith("S-M04-02-RC") else 100),1 if sale else (1 if sid.startswith("S-M04-02-RC") else 100),1 if (sale or sid.startswith("S-M04-02-RC")) else 100)
        if tag:
            tg=tag.group(1)
            edit=open_prod(code)+f"タグの「{tg}」にチェックを入れ、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
        else: edit=""
        newmid="【商品】"+csvs+edit+idsent
        if sid.startswith("S-M04-02-RC-STOCK"):
            # RCは規格文が mid に含まれる（【商品規格】の見出しなし）
            lang_state_sentence=_re.search(r"商品の「規格設定」から商品規格登録を開き.*?「商品規格を登録」を押す（[^）]+）。",mid).group(0)
            newspec=open_prod(code) if not tag else ""
            newspec+= spec_fix("販売種別は既定のまま、高額商品コードは空のまま、スマレジ連携フラグは連携しない、")[:-1]+"（取り込みで作られた規格は、公開中の店舗ごとの在庫が0で作られる）。"
            newspec=newspec.replace("取り込みで作られた規格","取り込みで作られた規格")
            newmid=newmid.replace(idsent,idsent)
            newmid+=newspec
            new=pre+newmid+post
        else:
            spec_fix_txt=spec_fix(("販売種別は既定のまま、"+("セールフラグにチェックを入れ、販売価格に1を入れ、" if sale else "")+"高額商品コードは空のまま、スマレジ連携フラグは連携しない、"))
            specsent="【商品規格】"+open_prod(code)+spec_fix_txt[:-1]+"（取り込みで作られた規格は表示対象になり、公開中の店舗ごとの在庫が0で作られる）。"
            # 【商品規格】節の末尾（…在庫が0で作られる）。）までを置換
            j=post.index("在庫が0で作られる）。")+len("在庫が0で作られる）。")
            new=pre+newmid+specsent+post[j:]
        assert "商品登録で" not in new and "商品規格登録を開き" not in new and "商品規格登録で" not in new, sid
        pre_note="元のシードは商品登録と商品規格登録で商品を作っていた。商品はグッズ商品CSV登録で作り、取り込みで作られたニアミント・日本語の規格を規格の画面で直す形にした。"
        w=pre_note
        w+="商品名(英)は元のシードで任意だったため商品名(日)と同じ値にした。買取価格・原価単価・サイズ・重量はCSVの必須列の都合で入れた値"+("（買取価格は販売価格を上回れない M03-27 L0119 ので1）" if sale else "")+"。"
        w+="元のシードの『カード指定は任意』はカードを付けない側にした。元のシードの『カテゴリを1つ以上選び』は、取り込みがサプライ・グッズのカテゴリを入れるので満たす。"
        if sale: w+="CSVの販売価格は基準価格と同じ1で、元のシードのセールフラグ=チェックは規格の画面で入れる（M03-09 L0086〜L0087）。"
        if not branch and not sid.startswith("S-M04-02-QE-SALE"): w+="元のシードは支店の商品公開ステータスを指定していないが、CSVの必須列なので公開にした。"
        w+="取り込みが在庫を作るのは公開中の店舗（M03-27 L0129）。"
        res.append([sid,"直す",new,"",BASIS+"、M03-02 L0075〜L0077・L0081、M03-09 L0086〜L0087・L0123・L0124",w]); continue
    raise SystemExit(sid)
write_out("M04-02",res)
