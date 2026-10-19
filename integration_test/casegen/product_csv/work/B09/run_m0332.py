import re, sys
sys.path.insert(0, '.')
from gen_m0332 import *
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
rows = [l.split('\t') for l in open(P / 'in/M03-32.tsv', encoding='utf8').read().split('\n')]
hdr, rows = rows[0], [r for r in rows[1:] if len(r) >= 8]
BASIS = "M03-27 L0092・L0123・L0124・L0134・L0151・L0224・L0232、M03-02 L0075〜L0077、M03-09 L0122〜L0172（L0131・L0134 編集時は言語・状態を変えられない）"
BASIS_CARD = BASIS + "、M03-02 L0059・L0073・L0092"
out = []
for r in rows:
    sid, kind_, name_, state, use, method = r[:6]
    if sid in ('S-M03-30-QC-MASTERS',):
        out.append([sid, '直さない', '', '', 'M03-27 L0123', '商品を作らない。カテゴリ・購入グループ・部門の用意だけで、グッズ商品CSV登録で選べる「サプライ・グッズ」配下のカテゴリを作る内容のため変更不要']); continue
    if sid.startswith('S-M03-32-RB-DATA'):
        out.append([sid, '直さない', '', '', 'M03-27 L0092・L0123・L0124', '元の投入方法がすでにグッズ商品CSV登録で商品を作り、取り込んだ規格を編集画面で直している（商品登録画面で新規に作っていない）']); continue
    if sid.startswith('S-M03-32-QC-HIGH'):
        n = sid[-3:]
        qc = 'QC001' if n == '063' else 'QC002'
        num = '001' if n == '063' else '002'
        code = 'QC3200' + ('1' if n == '063' else '2')
        nm = 'QC連携M0332' + num
        pat = re.compile(r'管理画面の商品管理＞商品登録で、.*?登録後の画面の「商品規格ID」に表示された番号を控える（(〔商品規格ID-M0332-%s〕)）。' % qc, re.S)
        m = pat.search(method); assert m, sid
        pid = '〔商品ID-M0332-%s〕' % qc; sidl = m.group(1)
        hp = 'HP' + code
        d = dict(base=1000, sell=1000, buy=500)
        row = ("商品IDは空・商品コードは「%s」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「%s」・商品名(英)は「%s」・サイズ1・重量1・商品カテゴリ(ID)は「QC連携カテゴリ」のカテゴリID（〔カテゴリID-M0330-QC共有〕）・購入グループ名称は「QC連携購入グループ」・販売制限数5・基準価格1000・販売価格1000・買取価格500・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空" % (code, nm, nm))
        new_part = (upload([row]) + search(code, pid)
            + "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、割引率に「割引率A」を選んで「商品を登録」ボタンを押す。商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で販売種別に「販売種別A」、高額商品コードに「%s」、セールフラグはチェックなし、基準価格(円)に「1000」、販売価格(円)に「1000」、買取価格(円)に「500」、スマレジ連携フラグは既定の「連携しない」のまま、部門に「ショーケース」、公開状態に「公開」を選んで「商品規格を登録」ボタンを押す。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（%s）。" % (hp, sidl))
        new = method[:m.start()] + new_part + method[m.end():]
        out.append([sid, '直す', new, '', "M03-27 L0092・L0123・L0124・L0134・L0143・L0144・L0150・L0224、M03-02 L0075〜L0077・L0092・L0146、M03-09 L0122〜L0172（L0131・L0134）",
            "元は商品登録画面で商品名・カテゴリ・購入グループ・サイズ・重量・販売制限数・割引率・公開状態を入れて商品を作り、商品規格一覧の「新規登録」で規格を足していたが、グッズ商品CSVが商品と状態ニアミント・日本語の規格を作る。割引率はCSVに列が無いので商品登録編集画面（既存の商品の編集）で選ぶ。販売種別はM03-09の画面項目（L0122〜L0172）に見当たらないが、元のシードのとおり残した（元の誤りは直さない）。カテゴリ「QC連携カテゴリ」はS-M03-30-QC-MASTERSで作る「サプライ・グッズ」の子なのでCSVで選べる"]); continue
    new, prods = build(sid, method)
    # 044: the later product edit that sets 廃止 must pick a discount rate (required item on the edit screen)
    new = new.replace("その商品の「商品登録」を開き、公開状態を「廃止」に変えて「商品を登録」を押す", "その商品の「商品登録」を開き、割引率に販売割引率に登録済みのものを選び、公開状態を「廃止」に変えて「商品を登録」を押す")
    reasons = []
    notes = []
    sp = [d for d in prods if d['state'] != 'NM']
    if any(d.get('rename') for d in prods):
        reasons.append("同じ商品コードの規格を2件作るため、CSVは重複できない（M03-27 L0134）ので別の仮の商品コード（末尾に-A・-B）で取り込み、取り込んだ規格を商品規格登録編集画面で開いて商品コードを「%s」に書き換える。画面側の重複検査の有無は設計書M03-09に定めが無く、元のシードの「登録時にはエラーにならない」を前提にしている" % [d['rename'] for d in prods if d.get('rename')][0])
    if sp:
        reasons.append("状態%sの規格はCSVでは作れず、編集時は状態を変えられない（M03-09 L0134）ため、CSVは仮の商品コード（末尾に-CSV）でニアミント・日本語の規格を作り、商品規格一覧の「新規作成」で状態%sの規格を足した。余るニアミントの規格が1件ある（高額商品コードは空・スマレジ連携なしで、ケースの確認対象の商品コードとは別）" % (sp[0]['state'], sp[0]['state']))
    if any(d['smaregi'] for d in prods):
        reasons.append("スマレジ連携: 規格の保存でスマレジ連携フラグを「連携する」にする操作は元のシードのまま商品規格登録編集画面で行う（CSVのスマレジ連携フラグは0で取り込む）")
    reasons.append("元は言語・状態・販売種別に任意の値を入れていたが、CSVが作る言語日本語・状態ニアミントの規格を使う（元の「販売種別」はM03-09の画面項目に見当たらない）" if any(d['state']=='NM' for d in prods) else "")
    if any(d['card'] for d in prods):
        reasons.append('元の「カード指定」で商品を作る操作は、取り込んだ商品の商品登録編集画面（既存の商品の編集）で「カード指定 >」から行う。カード指定で商品名が書き換わるため商品名を入れ直し、商品カテゴリを単体カードのカテゴリへ付け替え、必須の割引率は販売割引率に登録済みのものを選ぶ（元の投入方法はカードを特に指定していないため、カード検索の一覧から選ぶ操作は元のまま）')
    reasons = [x for x in reasons if x]
    out.append([sid, '直す', new, '', BASIS_CARD if any(d['card'] for d in prods) else BASIS, '。'.join(reasons)])
with open(P / 'work/B09/M03-32_rows.tsv', 'w', encoding='utf8') as f:
    for o in out: f.write('\t'.join(o) + '\n')
print(len(out), sum(1 for o in out if o[1]=='直す'))
