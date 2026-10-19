import re, pathlib, sys
sys.path.insert(0,'.')
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = "シードID\t判定\t新しい投入方法\t新しい状態・属性\t根拠\t理由"
def load(fid):
    return [l.split('\t') for l in open(P/f'in/{fid}.tsv',encoding='utf8').read().split('\n')[1:] if l.count('\t')>=7]
# --- M03-32
m = {l.split('\t')[0]: l.rstrip('\n').split('\t') for l in open(P/'work/B09/M03-32_rows.tsv',encoding='utf8')}
inp = load('M03-32')
with open(P/'out/M03-32.tsv','w',encoding='utf8') as f:
    f.write(HDR+'\n')
    for r in inp: f.write('\t'.join(m[r[0]])+'\n')
# --- F01-01
CARD = 'カード商品CSV登録'
with open(P/'out/F01-01.tsv','w',encoding='utf8') as f:
    f.write(HDR+'\n')
    for r in load('F01-01'):
        meth = r[5]
        why = '元の投入方法は商品を商品登録画面で新規に作っていない。商品はCSV登録で作り、商品登録編集では既存の商品に画像・タグを設定する操作だけ'
        if CARD in meth:
            why += '。カード商品CSV登録（M03-26）で商品を作っている部分は本件の対象外のため変更しない（規格の数・価格が割引率の設定で変わる恐れがある点は、元のシードの別の論点として残す）'
        f.write('\t'.join([r[0],'直さない','','','M03-27 L0092・L0123、M03-02 L0075〜L0077',why])+'\n')
# --- M08-09
with open(P/'out/M08-09.tsv','w',encoding='utf8') as f:
    f.write(HDR+'\n')
    for r in load('M08-09'):
        n = r[0][-3:]  # 038 / 040
        code = re.search(r'商品コードに「(QH0809-P-\d+)」', r[5]).group(1)
        nm = re.search(r'商品名に「([^」]+)」', r[5]).group(1)
        cat = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
        new_clause = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（商品IDは空・商品コードは「%s」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「%s」・商品名(英)は「%s」・サイズ1・重量1・商品カテゴリ(ID)は%s・購入グループ名称は既存の購入グループの名称・基準価格1000・販売価格1000・買取価格500・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。" % (code, nm, nm, cat))
        old_clause = "管理画面の商品登録編集画面で、商品名に「%s」、商品コードに「%s」、販売価格に1000円を入れ、公開を選んで登録し、" % (nm, code)
        assert old_clause in r[5], r[0]
        new = r[5].replace(old_clause, new_clause)
        f.write('\t'.join([r[0],'直す',new,'','M03-27 L0092・L0123・L0124・L0134・L0151・L0152・L0232、M03-02 L0075〜L0077',
          '元は商品登録編集画面の新規で商品名・商品コード・販売価格・公開だけを入れていたが、CSVの必須列（サイズ・重量・商品カテゴリ・購入グループ・買取価格・原価単価など）に具体値を足した。値は元のシードが定めていないため、買取価格は販売価格以下（M03-27 L0119）の500とした。公開側のフロント（本店）で見えるよう商品公開ステータス2・支店の商品公開ステータス1・地域別販売制限0（日英両サイト）にした。ニアミント・日本語の規格が1件でき、在庫変更CSVはその商品コードで取り込む。元のシードの商品IDは控えていないので呼び名は増やさない。'])+'\n')
