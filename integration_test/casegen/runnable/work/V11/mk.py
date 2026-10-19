import re
rows=[l.split("\t") for l in open("runnable/env/in/B16-09@1.tsv",encoding="utf8").read().split("\n")[1:] if l]
SH="設計書 0416 sheet-11"
CRAWL="ee実装にはクローラーによるサイトマップ生成バッチもS3への出力も無く、サイトマップは SitemapController がその場でXMLを返す方式のみ（infra・script にも該当なし）"
BATCH_DESIGN="前日分サイトマップの保存場所とS3バケット名・閲覧権限が設計書に無い（L0038・L0043。L0044〜L0048は見出しだけで空）。実行トリガーが Eventbridge+Lamdba（L0042）と書かれる一方、実行環境はバッチ処理用EC2インスタンス（L0020）で食い違う。S3バケットそのものは試験用に作るクラウド資源で、用意できるのはバッチを動かす手段まで"
info={}
info["S-B16-09-ENV"]=("バッチ・設計・その他",f"{SH} L0019-L0020・L0038・L0042-L0044、SitemapController",BATCH_DESIGN+"。"+CRAWL)
info["S-B16-09-SCHEDULE-001"]=("バッチ・時刻・設計・その他",f"{SH} L0038・L0042",BATCH_DESIGN+"。さらに試験開始を当日3:50とし4:00の起動を待つ前提で、時刻の固定は用意しない。"+CRAWL)
pg=("バッチ・作り方・設計・その他",f"{SH} L0028-L0038・L0043、SitemapController",
 "試験用サイトのトップページに任意のリンクを足し、任意のパスの公開ページを作る手段が設計書にもee実装にも無い（管理画面のページ作成はユーザーデータ配下のURLになり、/B1609-xxx-P のようなパスは作れない）。"+BATCH_DESIGN+"。"+CRAWL)
for k in ["UPLOAD-002","TOPURL-003","BRANCH-004","ADMIN-005","PRODUCT-006","CARDLIST-007","DECK-008","EVENT-009","REPLACE-010"]:
    info["S-B16-09-"+k]=pg
info["S-B16-09-HOST-011"]=("バッチ・設計・その他",f"{SH} L0019-L0020、infra/lib",
 "バッチ処理用EC2インスタンスの識別名と、実行履歴に実行先が出る手段が設計書に無い（L0020は名称のみ）。EC2はバッチを動かす手段でなく本番相当のクラウド資源。"+CRAWL)
info["S-B16-09-WEB"]=("作り方・分離",f"{SH} L0055・L0070・L0083、app/config/eccube/packages/eccube.yaml（eccube_sitemap_products_per_page=1000）",
 "言語区分・1ファイルあたりの件数・配信の基点を試験用の値に設定する手段（件数は設定ファイルの値で管理画面に項目が無く、変更に配備・再起動が要るか不明）と、他のケースと分けた専用DBの用意が残る。用意できる3つ（バッチ・外部の試験環境・メール）では決まらない")
PUR="買取価格・表示対象・高額買取のコード・予約扱いの販売グループを指定して商品を作る手段が設計書に無い"
DEC="デッキの種別・公開状態・削除状態を指定してデッキを作る手段が設計書に無い"
def mk(c,e,r): return (c,e,r+"。用意できる3つ（バッチ・外部の試験環境・メール）では決まらない")
PE=f"{SH} L0085-L0090、ProductRepository の買取サイトマップ条件・DtbDeckRepository"
for k in ["ROUTES-014","IDXORDER-019","BRIDX-031","BR404-035"]:
    pass
info["S-B16-09-ROUTES-014"]=mk("作り方",PE,PUR+"。"+DEC)
info["S-B16-09-ZERO-016"]=mk("作り方",PE,PUR+"。"+DEC)
info["S-B16-09-IDXORDER-019"]=mk("作り方",PE,PUR+"。"+DEC)
info["S-B16-09-PURCHCNT-022"]=mk("作り方",PE,PUR)
info["S-B16-09-DECKCNT-023"]=mk("作り方",PE,DEC)
info["S-B16-09-LMCOPY-025"]=mk("作り方",f"{SH} L0068・L0074",
 "他のページの複製元を持つページを作る手段が設計書に無い")
info["S-B16-09-LMPURCH-028"]=mk("作り方",PE,PUR)
info["S-B16-09-LMDECKD-029"]=mk("作り方",PE,DEC)
info["S-B16-09-LMDECKL-030"]=mk("作り方",PE,DEC)
info["S-B16-09-BRIDX-031"]=mk("作り方",PE+"・L0072",PUR+"。"+DEC+"。支店（店舗コード付き）を作る手段と、支店で商品の公開可否を設定する手段が設計書に無い")
info["S-B16-09-PURCH0-032"]=mk("作り方",PE,PUR)
info["S-B16-09-DECKD0-034"]=mk("作り方",PE,DEC)
info["S-B16-09-BR404-035"]=mk("作り方",PE+"・L0072",PUR+"。"+DEC+"。支店（店舗コード付き）を作る手段と、支店で商品の公開可否を設定する手段が設計書に無い")
info["S-B16-09-PURCH404-037"]=mk("作り方",PE,PUR)
info["S-B16-09-DECKD404-038"]=mk("作り方",PE,DEC)
info["S-B16-09-PAGECOPY-040"]=mk("作り方",f"{SH} L0068・L0074",
 "他のページの複製元を持つページを作る手段が設計書に無い")
info["S-B16-09-PRODORDER-045"]=mk("作り方",f"{SH} L0080",
 "商品の色順・カード英語名を指定して作る手段が設計書に無い")
out=["\t".join(["種別","対象ID","判定","区分","新しい投入方法","新しい状態・属性","根拠","理由"])]
for r in rows:
    if r[0]=="シード": sid=r[1]
    else:
        m=re.search(r"対象: (S-[A-Z0-9-]+)",r[6]); sid=m.group(1)
    c,e,why=info[sid]
    out.append("\t".join([r[0],r[1],"解消しない",c,"","",e,why]))
open("runnable/env/out/B16-09@1.tsv","w",encoding="utf8").write("\n".join(out)+"\n")
print(len(out)-1)
