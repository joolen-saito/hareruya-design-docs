#!/usr/bin/env python3
"""REVIVE_PROMPT.md に機能ごとの値を差し込んで prompts/<機能ID>_<担当>.md を作る。 mk_prompt.py"""
import csv, pathlib

R = pathlib.Path(__file__).resolve().parent
SCRATCH = "/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/0cb4fbfd-4cc2-4418-b2cd-85fafbbd5b3a/scratchpad/"
NAME = {"B16-09": "サイトマップ生成処理", "O01-01": "MTGバイヤー 店頭買取", "O01-02": "MTGバイヤー ネット買取", "O01-03": "MTGバイヤー 入庫モード"}
MD = {"O01-01": "functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md",
      "O01-02": "functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md",
      "O01-03": "functions/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md"}

O01_DECISION = "依頼者「**MTGバイヤーの試験端末は準備できます**」。外したケースは、試験端末・試験用のファイル保管先・端末内のデータの置き場所・通信の中継が未整備で、すべて外れていた。今回解けるのは試験端末（とその上の端末内のデータ）と、試験用のファイル保管先（試験環境用の Amazon S3。外部の試験環境）。**通信の中継は引き続き用意しない。**"
O01_SOLVED = "試験端末（S-{FID}-ENV ／ S-O01-03-MTGBUYER）・試験用ファイル保管先（S-{FID}-STORE）・端末内のデータの置き場所"
O01_RULES = """### この機能の直し方（中継を使っていたケース）

外したケースは、アプリとECCUBEの間に中継を置いて通信を記録し、送った要求の中身で確かめていた。中継は用意しないので、次のように直す。

- **要求で送った値**（状態・数量・価格・査定担当者・フラグ・コメントなど）は、ECCUBE に保存された結果で確かめる。ECCUBE の管理画面（店頭買取・ネット買取・在庫・入庫の一覧や編集画面。`functions/todo-list.md` で該当する機能を探し、その機能の既存ケースの画面への入り方と項目名を写す）で確かめ、画面に出ない値だけ DB で確かめる（`ブラウザ+DB確認`）。
- **要求を送らないこと（ECCUBE を更新しないこと）**は、ECCUBE 側の値が事前準備のまま変わらないことで確かめる。
- **取得の要求**（一覧・商品情報・部門など）は、アプリの画面に出た結果で確かめる。
- **要求ヘッダ（認証トークン）・呼び出しの回数や順序・送り先のパスだけ**を確かめていたものは、確かめる中身が実装手段なので「戻さない」。ただし、その結果としてアプリの画面に出るもの・ECCUBE に残るものが設計書で定まっていて、ほかのケースが確かめていなければ、それで確かめて戻す。
- **中継で HTTP 500 を返す・接続を切る・応答を置き換える・応答を空にする**ものは障害の注入なので「戻さない」。
- 端末内のデータ（査定途中のデータ・身分証画像・作業途中データ・出力フォルダ）の置き場所は、試験端末上のアプリの設定（`/home/y-saito/Developments/front-application/MTGBuyer/Configuration/*.config`）で決まる。シードの投入方法に具体的な場所（アプリの配置フォルダからの相対の場所）を書いてよい。暗号化した身分証画像のように手で作れないものは、アプリの操作で作る書き方にする（作れなければ「戻さない」）。
- 試験用保管先（S3）のファイルの有無・中身は、AWS の管理コンソール（S3）で確かめる書き方にする（S-{FID}-STORE）。
- 印刷キュー（PRINT）・カード読み取り（READ）のシードは、プリンター・カメラの選び方が決まっていない（今回の決定に含まれない）。これを使うケースは「戻さない（環境の決定待ち）」。
- 端末A・端末Bの2台を使うケースはそのままでよい（共通の環境シードで2台を用意する）。
- 手順の「中継の記録を空にする／区切る／確認する」は消す。"""
O01_MAT = "ケースを書いたときの報告 `integration_test/casegen/mtgbuyer/gen_{FID}/report.md`（設計書の行とケースの対応・試験環境に要るもの）と `integration_test/casegen/mtgbuyer/README.md`。前回の追加の検討 `integration_test/casegen/fp_gap/cases/{FID}_fg_dispositions.tsv`（読むだけ。新しいケースは作らない）"
O01_IMPL = "`/home/y-saito/Developments/front-application/MTGBuyer`（現行のアプリ）と `/home/y-saito/Developments/ec-cube-enterprise`（刷新後のECCUBE）"

B_DECISION = "依頼者「**B16-09 サイトマップ生成処理: 設計書の内容は実装手段の話です。どの情報がサイトマップに出力されるかが検証できれば良い**」。設計書の Excel由来の本文（トップページからリンクを辿ってファイルを作り S3 に置くバッチ）と現行仕様節（アクセスのたびに組み立てる）の違いは、生成の手段の違いとして扱う。外したケースは、バッチの手動実行・S3・設計書のURLの向け先・専用DB・設定値の変え方・一部のデータの作り方が未確定で、すべて外れていた。"
B_SOLVED = "生成の手段（バッチの手動実行・S3・前日分・実行スケジュール・設計書のURLを試験用サイトへ向けること）を問わなくなったこと、共通の環境シード S-B16-09-WEB の設定値、画面で作れない状態の DB 直接設定"
B_RULES = """### この機能の線引き（依頼元の解釈）

- 確かめるのは **サイトマップにどの情報が出力されるか**: 載るURL・載らないURL、各URLに添える最終更新日時・更新頻度・画像のURL、索引の案内、見つからない旨の応答（404）、応答の種類。
- **生成の手段は確かめない**: リンクを辿って作ること、バッチ、S3 への置き方、前日分との比較、実行スケジュール（毎日4:00）、実行先、ping、組み立てるタイミング。これだけを確かめていたケースは「戻さない（依頼者決定 2026-10-23: 生成の手段）」。
- 出力内容の定めは、現行仕様節（L0055〜L0102）を使う。Excel由来の本文が定める出力内容（L0032〜L0037: 管理ページ・商品検索ページ・カードリスト購入ページ・デッキ検索ページ・イベント情報（日本語・英語）と、それ以降のページは載せない）も使う。両者が同じものの載る・載らないで食い違うときは Excel由来を採る（優先順位 Excel由来 ＞ 現行仕様節）。「トップページからリンクを辿れるか」は生成の手段として扱い、載るかどうかの条件にしない。
- サイトマップは、試験用サイトへの要求（`https://replace-dev.hareruyamtg.com:8443/ja/sitemap.xml` など。現行仕様節 L0055〜L0063 の要求先）で取得し、応答の XML を確かめる。
- **他のデータを隔離しない**（試験環境には他のケースの商品・ページ・カテゴリ・デッキがある）。だから:
  - 「このデータだけが載る」「全体の件数」「ファイルの数」「全体で最も新しい日時（索引の最終更新日時）」は、他のデータに左右され結果が一意に決まらないので、そのまま期待にしない。ケース専用のデータが載る・載らない、そのデータのURLに添える値、ケース専用のデータどうしの前後関係で確かめる形に直す。直せなければ「戻さない」。
  - 商品・買取商品・デッキ詳細は複数のファイルに分かれる。「索引が案内する商品のサイトマップのいずれかに載る／どれにも載らない」の形で書く。前後関係は、案内の順に並べたファイルを通した順で書く。
  - 404 は、他のデータがあっても0件になるページ番号（十分に大きい番号。例 99999）で確かめる。
- 設定値（1ファイルあたりの件数=3、画像の配信の基点）は共通の環境シード S-B16-09-WEB に固定した。言語区分は要求先の先頭の ja ／ en で指定する。
- 元のシードの「未確定: 〜を指定して作る手段が設計書に書かれていない」は、管理画面で作れるなら画面の操作で、作れないなら理由を添えて DB へ直接入れる書き方に直す（実装は作り方を確かめるためにだけ読む）。支店の店舗コード（店舗登録の支店URL欄）は英数字だけで作る（ハイフンは入らない）。
- S-B16-09-ENV（バッチ・S3・URLの向け先）は使わない。使用シードと事前準備から外す。"""
B_MAT = "ケースを書いたときの報告 `integration_test/casegen/sheetmap/gen_B16-09/report.md`。前回の追加の検討 `integration_test/casegen/fp_gap/cases/B16-09_fg_dispositions.tsv`（読むだけ。新しいケースは作らない）"
B_IMPL = "`/home/y-saito/Developments/ec-cube-enterprise`（`src/Eccube/Controller/Front/SitemapController.php` ほか）"


def main():
    tpl = (R / "REVIVE_PROMPT.md").read_text(encoding="utf-8")
    (R / "prompts").mkdir(exist_ok=True)
    for p in csv.DictReader(open(R / "parts.tsv", encoding="utf-8"), delimiter="\t"):
        f, part = p["機能ID"], p["担当"]
        if f == "B16-09":
            v = dict(DECISION=B_DECISION, SOLVED=B_SOLVED, RULES=B_RULES, MATERIALS=B_MAT, IMPL=B_IMPL,
                     DESIGN="`integration_test/casegen/fp_gap/units/B16-09/design.txt`（0416 シート11。Excel由来 L0001〜L0048、現行仕様節 L0051〜L0102）")
        else:
            v = dict(DECISION=O01_DECISION, SOLVED=O01_SOLVED, RULES=O01_RULES, MATERIALS=O01_MAT, IMPL=O01_IMPL,
                     DESIGN=f"`integration_test/casegen/fp_gap/units/{f}/design.txt`（{MD[f]} の写し。O01-01 は 0601 シート3の埋め込み）")
        s = tpl
        for k, x in v.items():
            s = s.replace("{" + k + "}", x)
        s = (s.replace("{FID}", f).replace("{FNAME}", NAME[f]).replace("{PART}", part)
             .replace("{FROM}", f"IT-{f}-{int(p['開始']):03d}").replace("{TO}", f"IT-{f}-{int(p['終了']):03d}").replace("{SCRATCH}", SCRATCH))
        (R / f"prompts/{f}_{part}.md").write_text(s, encoding="utf-8")
        print(f, part)


if __name__ == "__main__":
    main()
