"""tools/db_sql_run.py が「用意して流す」ときに確かめる期待(正しい行が正しい値になったか)。
キー: seed_files/ からの相対パス。値: [(説明, 真偽を返すSQL)]。SQLの中の〔…〕は、試し用に用意した行の番号に置き換えて流す。
用意する行の既定値(tools/db_sql_run.py の Fixture): 規格は 販売価格1000・基準価格1000・買取価格400・状態NM(1)・言語1・公開(1)・表示する／
在庫は 本店と引かれる店舗 × 在庫区分 EC-CUBE(1)・スマレジ(2) で 在庫0・総原価0／価格履歴は規格ごとに1件(取り込みでできる形: 変更前の3つの価格が0)。
EXTRA_FIXTURE: その確かめに要る行を足す(既定の行だけでは「消さない行が残るか」を確かめられないもの)。値は文に書かれたシードの状態に合わせる。"""


def pc(code):
    return "(SELECT id FROM dtb_product_class WHERE product_code = '%s')" % code


def hist_n(expr, n):
    return "SELECT count(*) = %d FROM dtb_price_history WHERE product_class_id = %s" % (n, expr)


def price(expr, v):
    return "SELECT price02 = %d FROM dtb_product_class WHERE id = %s" % (v, expr)


def cond(expr, code):
    return "SELECT card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = '%s') FROM dtb_product_class WHERE id = %s" % (code, expr)


def hist_date(expr, d):
    return "SELECT bool_and(create_date = TIMESTAMPTZ '%s+09') FROM dtb_price_history WHERE product_class_id = %s" % (d, expr)


def csv_edit_hist(expr, old_sell=None, old_buy=None):
    """規格の編集・価格変更CSVでできる価格履歴(変更前の価格が0でない)"""
    return ("INSERT INTO dtb_price_history (product_class_id, member_id, sell_price, old_sell_price, buy_price, old_buy_price, standard_price, old_standard_price, create_date) "
            "VALUES (%s, NULL, %s, %s, %s, %s, 1000, 1000, now());" % (expr, 'NULL' if old_sell is None else old_sell + 100, 'NULL' if old_sell is None else old_sell,
                                                                   'NULL' if old_buy is None else old_buy + 100, 'NULL' if old_buy is None else old_buy))


def stock_at(expr, shop_sql, loc):
    return "(SELECT s.id FROM dtb_product_stock s WHERE s.product_class_id = %s AND s.base_info_id = %s AND s.stock_location_id = %d)" % (expr, shop_sql, loc)


SHOP_A = "(SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A')"
MAIN = "(SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop)"

EXPECT = {}
EXTRA_FIXTURE = {}
# シード単位: そのシードの全ファイルを流す順に流したあとの期待(tools/db_sql_run.py の C)。シード表の文だけから作る(SQLに値があるかどうかで足したり外したりしない)
EXPECT_SEED = {}
EXTRA_FIXTURE_SEED = {}
import csv as _csv
_csv.field_size_limit(10 ** 9)


def _seed_rows(fid):
    import os as _o
    pth = _o.path.join(_o.path.dirname(_o.path.dirname(_o.path.dirname(_o.path.abspath(__file__)))), 'integration_test', 'casegen', 'cases', '%s_seed_data.tsv' % fid)
    return {r[0]: r for r in list(_csv.reader(open(pth, encoding='utf-8'), delimiter='\t'))[1:]}

# ---------------- R1 対象の商品規格 ----------------
EXPECT['M03-30/S-M03-30-MIX-079/db.sql'] = [
    ('商品Aの規格の販売価格が900', price('〔商品規格ID-M0330-079A〕', 900)),
    ('商品Bの規格の販売価格は変わらない(用意した1000のまま)', price('〔商品規格ID-M0330-079B〕', 1000)),
    ('両規格の価格履歴が0件', "SELECT count(*) = 0 FROM dtb_price_history WHERE product_class_id IN (〔商品規格ID-M0330-079A〕, 〔商品規格ID-M0330-079B〕)")]
EXPECT['M03-30/S-M03-30-DATA-021/db.sql'] = [
    ('Aの規格の販売価格が900', price('〔商品規格ID-M0330-021A〕', 900)),
    ('Bの規格の販売価格は変わらない(1000)', price('〔商品規格ID-M0330-021B〕', 1000)),
    ('両規格の価格履歴が0件', "SELECT count(*) = 0 FROM dtb_price_history WHERE product_class_id IN (〔商品規格ID-M0330-021A〕, 〔商品規格ID-M0330-021B〕)")]
for k, labs in (('DATA-004', 'ABCD'), ('DATA-005', 'AB'), ('DATA-006', 'AB')):
    EXPECT['M03-30/S-M03-30-%s/db.sql' % k] = [('%s規格の販売価格が900' % x, price('〔商品規格ID-M0330-%s%s〕' % (k[-3:], x), 900)) for x in labs]
    if k != 'DATA-004':
        EXPECT['M03-30/S-M03-30-%s/db.sql' % k] += [('%s規格の価格履歴が0件' % x, hist_n('〔商品規格ID-M0330-%s%s〕' % (k[-3:], x), 0)) for x in labs]
for k in ('MULTI-077', 'MULTIH-078'):
    n = k[-3:]
    EXPECT['M03-30/S-M03-30-%s/db.sql' % k] = [('%s規格の価格履歴が0件' % x, hist_n('〔商品規格ID-M0330-%s%s〕' % (n, x), 0)) for x in 'AB'] + \
        [('%s規格の販売価格は変わらない' % x, price('〔商品規格ID-M0330-%s%s〕' % (n, x), 1000)) for x in 'AB']
# M03-23-CORE: 取り込みでできた履歴(変更前0)と規格の編集でできた履歴の2件を持つ HIST-DISPLAY-001、登録時とCSVの2件を持つ MULTI-001
EXTRA_FIXTURE['M03-23/S-M03-23-CORE/db_1.sql'] = [
    "INSERT INTO dtb_price_history (product_class_id, member_id, sell_price, old_sell_price, buy_price, old_buy_price, standard_price, old_standard_price, create_date) VALUES (%s, NULL, 1200, 1000, NULL, NULL, 1000, NULL, now());" % pc('HIST-DISPLAY-001'),
    # MULTI-001 の規格と登録時の履歴(取り込みの形)は、シード表の文の商品コードから用意される。CSVでできた履歴の1件をここで足す(計2件)
    csv_edit_hist(pc('MULTI-001'), old_sell=1000)]
# M03-23-INBOUND: 文「1件目の商品には…状態SP・商品コード INBOUND-A-SP、同じ要領で HP・INBOUND-A-HP の規格も足す」。〔商品ID-M0323-共有A〕の商品に SP・HP の規格を付ける(NMは呼び名の規格)
EXTRA_FIXTURE['M03-23/S-M03-23-INBOUND/db.sql'] = [
    "UPDATE dtb_product_class SET product_id = 〔商品ID-M0323-共有A〕, card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'SP') WHERE product_code = 'INBOUND-A-SP';",
    "UPDATE dtb_product_class SET product_id = 〔商品ID-M0323-共有A〕, card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'HP') WHERE product_code = 'INBOUND-A-HP';"]
EXPECT['M03-23/S-M03-23-INBOUND/db.sql'] = [
    ('〔商品ID-M0323-共有A〕の%sの規格の価格履歴の日時が%s' % (c, d), "SELECT bool_and(h.create_date = TIMESTAMPTZ '%s+09') FROM dtb_price_history h JOIN dtb_product_class pc ON pc.id = h.product_class_id WHERE pc.product_id = 〔商品ID-M0323-共有A〕 AND pc.card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = '%s')" % (d, c))
    for c, d in (('NM', '2026-08-31 12:00:00'), ('SP', '2026-08-31 12:00:00'), ('HP', '2026-08-30 12:00:00'))]
EXPECT['M03-23/S-M03-23-CORE/db_1.sql'] = [
    ('HIST-DISPLAY-001の価格履歴が1件(取り込みでできた1件だけ消えた)', hist_n(pc('HIST-DISPLAY-001'), 1)),
    ('残った履歴の変更後基準価格1000・販売価格1200・買取価格600', "SELECT standard_price = 1000 AND sell_price = 1200 AND buy_price = 600 FROM dtb_price_history WHERE product_class_id = %s" % pc('HIST-DISPLAY-001')),
    ('残った履歴の変更前基準価格900・販売価格1100・買取価格500と登録日時', "SELECT old_standard_price = 900 AND old_sell_price = 1100 AND old_buy_price = 500 AND create_date = TIMESTAMPTZ '2026-08-31 12:34:00+09' FROM dtb_price_history WHERE product_class_id = %s" % pc('HIST-DISPLAY-001')),
    ('MULTI-001の履歴は2件のまま(登録時とCSVの2件。消さない)', hist_n(pc('MULTI-001'), 2)),
    ('HIST-DISPLAY-001とMULTI-001の販売価格は変わらない(販売価格のUPDATEが無い)', "SELECT bool_and(price02 = 1000) FROM dtb_product_class WHERE product_code IN ('HIST-DISPLAY-001','MULTI-001')")]
EXTRA_FIXTURE['M03-23/S-M03-23-CORE/db_3.sql'] = [csv_edit_hist(pc('HIST-BUY-ONLY-001'), old_buy=300), csv_edit_hist(pc('HIST-SELL-ONLY-001'), old_sell=1300)]
EXPECT['M03-23/S-M03-23-CORE/db_3.sql'] = [
    ('HIST-BUY-ONLY-001は取り込みの履歴が消えCSVの1件だけ', "SELECT count(*) = 1 AND bool_and(old_buy_price = 300) FROM dtb_price_history WHERE product_class_id = %s" % pc('HIST-BUY-ONLY-001')),
    ('HIST-SELL-ONLY-001は取り込みの履歴が消えCSVの1件だけ', "SELECT count(*) = 1 AND bool_and(old_sell_price = 1300) FROM dtb_price_history WHERE product_class_id = %s" % pc('HIST-SELL-ONLY-001'))]
EXTRA_FIXTURE['M03-23/S-M03-23-RANGE/db.sql'] = [csv_edit_hist(pc(c), old_sell=1400) for c in ('SALE-MATCH-001', 'SALE-OLD-001', 'BUY-ONLY-RANGE-001', 'BUY-MATCH-001', 'BUY-OLD-001', 'SELL-ONLY-RANGE-001')]
EXPECT['M03-23/S-M03-23-RANGE/db.sql'] = [
    ('6商品とも取り込みの履歴が消え、CSVの履歴1件だけ残る', "SELECT count(*) = 6 AND bool_and(old_sell_price = 1400) FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code IN ('SALE-MATCH-001','SALE-OLD-001','BUY-ONLY-RANGE-001','BUY-MATCH-001','BUY-OLD-001','SELL-ONLY-RANGE-001'))")]
# M03-04: 状態NMの規格0件(商品Aだけ。Aの別の状態の規格と、商品Bの規格は消さない)
for k, n in (('CBCARDNONE-033', '033'), ('CBNONNM-034', '034')):
    EXTRA_FIXTURE['M03-04/S-M03-04-%s/db.sql' % k] = [
        "INSERT INTO dtb_product_class (id, product_id, base_info_id, product_code, price02, card_condition_id, language_id, product_status_id, visible, create_date, update_date) VALUES (2109000001, 〔商品ID-M0304-%sA〕, %s, 'FX-%s-A-SP', 1000, 2, 1, 1, true, now(), now());" % (n, MAIN, n),
        "INSERT INTO dtb_product (id, base_info_id, name, create_date, update_date) VALUES (2109000002, %s, 'FX-B', now(), now());" % MAIN,
        "INSERT INTO dtb_product_class (id, product_id, base_info_id, product_code, price02, card_condition_id, language_id, product_status_id, visible, create_date, update_date) VALUES (2109000003, 2109000002, %s, 'FX-%s-B-NM', 1000, 1, 1, 1, true, now(), now());" % (MAIN, n)]
    EXPECT['M03-04/S-M03-04-%s/db.sql' % k] = [
        ('商品Aの状態NMの規格が0件', "SELECT count(*) = 0 FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-%sA〕 AND card_condition_id = 1" % n),
        ('商品Aの状態SPの規格は残る', "SELECT count(*) = 1 FROM dtb_product_class WHERE id = 2109000001"),
        ('商品B(名指しされない別の商品)の状態NMの規格は残る', "SELECT count(*) = 1 FROM dtb_product_class WHERE id = 2109000003")]
for i, x in ((1, 'A'), (2, 'B'), (3, 'C')):
    others = [y for y in 'ABC' if y != x]
    EXPECT['M03-31/S-M03-31-DPDATA-077/db_%d.sql' % i] = [('%sの規格だけ状態SP' % x, cond('〔商品規格ID-M0331-077%s〕' % x, 'SP'))] + \
        [('%sの規格は状態NMのまま' % y, cond('〔商品規格ID-M0331-077%s〕' % y, 'NM')) for y in others]
EXPECT['M03-31/S-M03-31-DPDATA-080/db.sql'] = [('%s規格が状態SP' % x, cond('〔商品規格ID-M0331-080%s〕' % x, 'SP')) for x in 'AB'] + \
    [('%s規格の価格履歴0件' % x, hist_n('〔商品規格ID-M0331-080%s〕' % x, 0)) for x in 'AB']
EXPECT['M03-32/S-M03-32-DPDATA-065/db.sql'] = [('%s規格の価格履歴0件' % x, hist_n('〔商品規格ID-M0332-065%s〕' % x, 0)) for x in 'AB']
EXPECT['M03-33/S-M03-33-ROLLBACK-052/db.sql'] = [('%s規格の価格履歴0件' % x, hist_n('〔商品規格ID-M0333-052%s〕' % x, 0)) for x in 'AB']
EXPECT['M03-04/S-M03-04-RICH-002/db.sql'] = [
    ('規格の販売価格が900', price('〔規格ID-M0304-002〕', 900)),
    ('規格の発送日目安が736(翌日)', "SELECT c.delivery_duration_id = 736 AND d.name = '翌日' AND d.duration = 1 FROM dtb_product_class c JOIN dtb_delivery_duration d ON d.id = c.delivery_duration_id WHERE c.id = 〔規格ID-M0304-002〕")]
EXPECT['M03-01/S-M03-01-CAL-055/db.sql'] = [
    ('商品の規格の更新日時が2026-09-03 12:00:00', "SELECT update_date = TIMESTAMPTZ '2026-09-03 12:00:00+09' FROM dtb_product_class WHERE product_id = 〔商品ID-M0301-055〕")]
EXPECT['M03-27/S-M03-27-CASE-031/db.sql'] = [
    ('規格の発送日目安が736', "SELECT delivery_duration_id = 736 FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕"),
    ('本店・EC-CUBEの在庫が1・総原価50(原価単価50)', "SELECT stock = 1 AND total_cost = 50 FROM dtb_product_stock WHERE id = %s" % stock_at("(SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕)", MAIN, 1))]
EXPECT['M03-27/S-M03-27-CASE-036/db.sql'] = [('規格の発送日目安が736', "SELECT delivery_duration_id = 736 FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-036〕")]
EXPECT['M03-27/S-M03-27-CASE-033/db.sql'] = [('この商品の規格の価格履歴0件', hist_n("(SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-033〕)", 0))]
EXPECT['M03-27/S-M03-27-CASE-034/db.sql'] = [('本店・EC-CUBEの在庫の総原価÷在庫数が50', "SELECT total_cost / stock = 50 FROM dtb_product_stock WHERE id = %s" % stock_at("(SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-034〕)", MAIN, 1))]
for k in ('CBSALE-085', 'CBSMSTK-088', 'CBPRICE-092'):
    EXPECT['M03-27/S-M03-27-%s/db.sql' % k] = [('この商品の規格の価格履歴0件', hist_n("(SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-%s〕)" % k[-3:], 0))]

# ---------------- R2 スマレジ商品コードを商品コードと取り違えない(M04-30)。シード表の文から作る ----------------
import glob as _glob, os as _os, re as _re
_R = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
for _sid, _r in _seed_rows('M04-30').items():
    if '-CB' not in _sid:
        continue
    _t = _r[5]
    _codes = _re.findall(r'商品コードは「([^」]+)」', _t)
    _sm = _re.findall(r'スマレジ商品IDは画面で指定できないためDBへ直接設定する（「([^」]+)」）', _t)
    _dates = _re.findall(r'価格変更履歴1件を「([^」]+)」', _t)
    _ex = []
    for _c in _codes:
        if _c in _sm:
            _ex.append(('%s のスマレジ商品IDが文の値「%s」' % (_c, _c), "SELECT smaregi_product_id = '%s' FROM dtb_product_class WHERE id = %s" % (_c, pc(_c))))
        else:
            _ex.append(('%s のスマレジ商品IDは空のまま(文がDBで設定しない)' % _c, "SELECT smaregi_product_id IS NULL FROM dtb_product_class WHERE id = %s" % pc(_c)))
    if len(_dates) == len(_codes):
        for _c, _d in zip(_codes, _dates):
            _ex.append(('%s の価格変更履歴の日時が %s' % (_c, _d), hist_date(pc(_c), _d)))
    if '言語を未設定' in _t:
        _ex.append(('規格の言語が空', "SELECT language_id IS NULL FROM dtb_product_class WHERE id = %s" % pc(_codes[0])))
    if '状態を未設定' in _t:
        _ex.append(('規格の状態が空', "SELECT card_condition_id IS NULL FROM dtb_product_class WHERE id = %s" % pc(_codes[0])))
    EXPECT_SEED[_sid] = _ex

# ---------------- R3 文の節(①②)ごとの対象(M04-08)。シード表の文から作る ----------------
# 試し用の行: 文のとおり、②の商品は「取り込みの規格(状態NM・商品コード=文の値)を削除(論理削除)し、新規作成の規格(状態EX)だけが残る」形にする。
# 新規作成の規格の商品コードは文に無い(画面で必須)ため、手順書が決めた値(<商品コード>-EX)で用意する。状態EXはアプリの状態の選択肢に無い(下の備考)ので、状態はその他(OT)で代える
for _sid, _r in _seed_rows('M04-08').items():
    _t = _r[3] + '\n' + _r[5]
    _pairs = _re.findall(r'【(M0408-\d{3}-[AB])】[^／]*?／[^（]*?スマレジ商品ID=(\d+)', _r[3])
    if len(_pairs) != 2:
        continue
    _secs = _re.split(r'[①②]', _r[5])
    _ex = []
    _fx = []
    for _c, _v in _pairs:
        _sec = next((x for x in _secs if '商品コードは「%s」' % _c in x), '')
        _deleted = '新規作成' in _sec and '商品規格を削除' in _sec
        if _deleted:
            _new = _c + '-EX'
            _prod = "(SELECT product_id FROM dtb_product_class WHERE product_code = '%s')" % _c
            _fx += ["UPDATE dtb_product_class SET product_id = %s, card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'OT') WHERE product_code = '%s';" % (_prod, _new),
                    "UPDATE dtb_product_class SET product_status_id = 3, visible = false WHERE product_code = '%s';" % _c]
            _live = "(SELECT id FROM dtb_product_class WHERE product_code = '%s')" % _new
            _ex.append(('%s の削除済み(論理削除)の規格のスマレジ商品IDは空のまま' % _c, "SELECT smaregi_product_id IS NULL FROM dtb_product_class WHERE id = %s" % pc(_c)))
            _ex.append(('%s の削除済みの規格の試験店舗A・EC-CUBEの在庫は0のまま' % _c, "SELECT stock = 0 FROM dtb_product_stock WHERE id = %s" % stock_at(pc(_c), SHOP_A, 1)))
        else:
            _live = pc(_c)
        _ex.append(('%s の商品の残っている規格のスマレジ商品IDが%s' % (_c, _v), "SELECT smaregi_product_id = '%s' FROM dtb_product_class WHERE id = %s" % (_v, _live)))
        _ex.append(('%s の商品の残っている規格の試験店舗A・EC-CUBEの在庫が1以上' % _c, "SELECT stock >= 1 FROM dtb_product_stock WHERE id = %s" % stock_at(_live, SHOP_A, 1)))
    EXPECT_SEED[_sid] = _ex
    if _fx:
        EXTRA_FIXTURE_SEED[_sid] = _fx
        EXTRA_FIXTURE.update({'M04-08/%s/%s' % (_sid, _os.path.basename(_f)): _fx for _f in _glob.glob(_os.path.join(_R, 'seed_files', 'M04-08', _sid, 'db*.sql'))})

# ---------------- R4 入荷通知依頼(会員ごと・依頼ごと) ----------------
NOTIFY = {'NOTIFY2-156': [('m0431-156-a@example.test', 2, 'M0431156P1'), ('m0431-156-b@example.test', 2, 'M0431156P1')],
          'NOTIFYINC-133': [('m0431-133-a@example.test', 2, 'M0431133P1'), ('m0431-133-b@example.test', 2, 'M0431133P2')],
          'NOTIFYPUB-134': [('m0431-134-a@example.test', 2, 'M0431134P1'), ('m0431-134-b@example.test', 2, 'M0431134P2'), ('m0431-134-c@example.test', 2, 'M0431134P3')],
          'NOTIFYSHOP-132': [('m0431-132-a@example.test', 2, 'M0431132P1'), ('m0431-132-b@example.test', 2, 'M0431132P2')],
          'NOTIFYTMP-135': [('m0431-135-a@example.test', 1, 'M0431135P1'), ('m0431-135-b@example.test', 2, 'M0431135P2')]}
for k, lst in NOTIFY.items():
    ex = []
    for em, st, code in lst:
        ex.append(('%s の会員が1件・顧客状態%d' % (em, st), "SELECT count(*) = 1 AND bool_and(customer_status_id = %d) FROM dtb_customer WHERE email = '%s'" % (st, em)))
        ex.append(('%s の入荷通知依頼が %s の規格に1件(通知待ち)・ほかの規格には無い' % (em, code),
                   "SELECT count(*) FILTER (WHERE r.product_class_id = %s AND r.deleted_at IS NULL) = 1 AND count(*) = 1 FROM dtb_product_request r JOIN dtb_player p ON p.id = r.player_id WHERE p.email = '%s'" % (pc(code), em)))
    EXPECT['M04-31/S-M04-31-%s/db.sql' % k] = ex

# ---------------- R5 取込履歴の日時・作業者・件数 ----------------
for k, n, t0, t1 in (('PAGING-003', 50, '2026-08-03 10:00:00', '2026-08-03 10:00:49'), ('PAGING-004', 50, '2026-08-04 10:00:00', '2026-08-04 10:00:49'), ('PAGING-005', 10, '2026-08-05 10:00:00', '2026-08-05 10:00:09')):
    a = {'PAGING-003': 329015001, 'PAGING-004': 329016001, 'PAGING-005': 329017001}[k]
    EXPECT['M03-29/S-M03-29-HISTORY-%s/db.sql' % k] = [
        ('履歴%d件(番号%d〜)・種別4' % (n, a), "SELECT count(*) = %d AND bool_and(csv_import_type_id = 4) FROM dtb_csv_import_history WHERE id BETWEEN %d AND %d" % (n, a, a + n - 1)),
        ('最初が%s・最後が%s(1秒間隔)' % (t0, t1), "SELECT min(create_date) = TIMESTAMPTZ '%s+09' AND max(create_date) = TIMESTAMPTZ '%s+09' AND count(DISTINCT create_date) = %d FROM dtb_csv_import_history WHERE id BETWEEN %d AND %d" % (t0, t1, n, a, a + n - 1)),
        ('作業者がM03-29試験管理者', "SELECT bool_and(member_id = (SELECT id FROM dtb_member WHERE name = 'M03-29試験管理者')) FROM dtb_csv_import_history WHERE id BETWEEN %d AND %d" % (a, a + n - 1))]
EXPECT['M03-30/S-M03-30-HISTORY-039/db.sql'] = [
    ('履歴11件(33003901〜33003911)・種別5(基準価格変更CSVの画面が使う番号)', "SELECT count(*) = 11 AND bool_and(csv_import_type_id = 5) FROM dtb_csv_import_history WHERE id BETWEEN 33003901 AND 33003911"),
    ('10:10の履歴(33003911)の作業者が管理者ID=33003999', "SELECT member_id = 33003999 AND create_date = TIMESTAMPTZ '2026-09-01 10:10:00+09' FROM dtb_csv_import_history WHERE id = 33003911"),
    ('ほかの10件の作業者がM03-30試験管理者', "SELECT bool_and(member_id = (SELECT id FROM dtb_member WHERE name = 'M03-30試験管理者')) FROM dtb_csv_import_history WHERE id BETWEEN 33003901 AND 33003910")]
EXPECT['M03-27/S-M03-27-HISTORY-001/db.sql'] = [
    ('グッズ商品CSVの専用履歴51件(ファイル名 GHI-001-001.csv〜GHI-051-001.csv)', "SELECT count(*) = 51 FROM dtb_csv_import_history WHERE csv_import_type_id = 2 AND file_name ~ '^GHI-[0-9]{3}-001\\.csv$'"),
    ('作成日時は番号順に1分ずつ昇順', "SELECT max(create_date) - min(create_date) = interval '50 minutes' FROM dtb_csv_import_history WHERE csv_import_type_id = 2 AND file_name ~ '^GHI-[0-9]{3}-001\\.csv$'"),
    ('カード商品CSV取込履歴2件(このシードの行)', "SELECT count(*) = 2 FROM dtb_csv_import_history WHERE csv_import_type_id = 1 AND file_name LIKE 'S-M03-27-HISTORY-001-card-%'")]
EXPECT['M03-28/S-M03-28-HISTORY-001/db.sql'] = [
    ('商品タグ更新の履歴11件(指定の番号)・作業者は利用者ID=328000001', "SELECT count(*) = 11 AND bool_and(member_id = 328000001) AND bool_and(csv_import_type_id = 3) FROM dtb_csv_import_history WHERE id IN (328101001,328102001,328103001,328104001,328105001,328106001,328107001,328108001,328109001,328110001,328111001)"),
    ('日時が2026-09-01 10:00〜10:10の1分間隔', "SELECT min(create_date) = TIMESTAMPTZ '2026-09-01 10:00:00+09' AND max(create_date) = TIMESTAMPTZ '2026-09-01 10:10:00+09' FROM dtb_csv_import_history WHERE id BETWEEN 328101001 AND 328111001")]
EXPECT['M03-41/S-M03-41-CASE-009/db.sql'] = [
    ('最初の番号が2099-09-09 10:11・最後が10:01(1分ずつ古くなる)', "SELECT (SELECT create_date FROM dtb_csv_import_history WHERE id = 341900901) = TIMESTAMPTZ '2099-09-09 10:11:00+09' AND (SELECT create_date FROM dtb_csv_import_history WHERE id = 341900911) = TIMESTAMPTZ '2099-09-09 10:01:00+09'")]
EXPECT['M03-38/S-M03-38-COUNT-038/db.sql'] = [
    ('001〜006の6件は2026-08-04 10:01:00', "SELECT bool_and(create_date = TIMESTAMPTZ '2026-08-04 10:01:00+09') FROM dtb_csv_import_history WHERE id BETWEEN 338038001 AND 338038006"),
    ('007〜010は10:02〜10:05', "SELECT min(create_date) = TIMESTAMPTZ '2026-08-04 10:02:00+09' AND max(create_date) = TIMESTAMPTZ '2026-08-04 10:05:00+09' FROM dtb_csv_import_history WHERE id BETWEEN 338038007 AND 338038010"),
    ('011〜016の6件は10:06:00', "SELECT bool_and(create_date = TIMESTAMPTZ '2026-08-04 10:06:00+09') FROM dtb_csv_import_history WHERE id BETWEEN 338038011 AND 338038016"),
    ('017〜023は10:07〜10:13', "SELECT min(create_date) = TIMESTAMPTZ '2026-08-04 10:07:00+09' AND max(create_date) = TIMESTAMPTZ '2026-08-04 10:13:00+09' FROM dtb_csv_import_history WHERE id BETWEEN 338038017 AND 338038023")]

# ---------------- R9 1件確認 ----------------
EXPECT['M04-01/S-M04-01-SAVE-017/db.sql'] = [
    ('STK-PART-001-017の在庫は東京本店・EC-CUBEの1行だけ残る', "SELECT count(*) = 1 AND bool_and(base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '東京本店') AND stock_location_id = 1) FROM dtb_product_stock WHERE product_class_id = %s" % pc('STK-PART-001-017'))]
EXPECT['M04-31/S-M04-31-CSVCOLS-054/db.sql'] = [
    ('棚卸計画M0431-054-AのM0431054P1の棚卸詳細の最終更新日', "SELECT bool_and(d.update_date = TIMESTAMPTZ '2026-10-12 09:30:00+09') FROM dtb_inventory_plan_detail d JOIN dtb_product_stock s ON s.id = d.product_stock_id WHERE s.product_class_id = %s AND d.inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-054-A')" % pc('M0431054P1'))]
EXPECT['M04-31/S-M04-31-CSVROW-055/db.sql'] = [
    ('M0431055P1の棚卸詳細の最終更新日', "SELECT bool_and(d.update_date = TIMESTAMPTZ '2026-10-12 09:30:00+09') FROM dtb_inventory_plan_detail d JOIN dtb_product_stock s ON s.id = d.product_stock_id WHERE s.product_class_id = %s AND d.inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-055-A')" % pc('M0431055P1')),
    ('M0431055P2の棚卸詳細の最終更新日', "SELECT bool_and(d.update_date = TIMESTAMPTZ '2026-10-13 10:45:10+09') FROM dtb_inventory_plan_detail d JOIN dtb_product_stock s ON s.id = d.product_stock_id WHERE s.product_class_id = %s AND d.inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-055-A')" % pc('M0431055P2'))]
EXPECT['M04-31/S-M04-31-CSVCOLS-054/db_before.sql'] = [('棚卸名がM0431-054-で始まる計画だけが消える', "SELECT count(*) = 0 FROM dtb_inventory_plan WHERE name LIKE 'M0431-054-%'")]

# ---------------- B 規格の削除済み・発送日目安 ----------------
EXPECT['M03-13/S-M03-13-PRIORITY-CODES/db.sql'] = [('DEL-001の規格が論理削除(廃止・表示しない)', "SELECT product_status_id = 3 AND visible = false FROM dtb_product_class WHERE id = %s" % pc('DEL-001'))]
EXPECT['M04-21/S-M04-21-VALIDATION-026/db.sql'] = [
    ('商品ID 142102612(削除されていない)と、論理削除の商品規格ID 142102613(DEL-C-M421-026)がある', "SELECT count(*) = 1 FROM dtb_product_class c JOIN dtb_product p ON p.id = c.product_id WHERE c.id = 142102613 AND p.id = 142102612 AND c.product_code = 'DEL-C-M421-026' AND c.product_status_id = 3 AND c.visible = false")]

# 同じ形の文(両規格の価格履歴0件)
for _k in ('066', '067', '068', '069', '075'):
    EXPECT['M03-32/S-M03-32-DPDATA-%s/db.sql' % _k] = [('%s規格の価格履歴0件' % x, hist_n('〔商品規格ID-M0332-%s%s〕' % (_k, x), 0)) for x in 'AB']
# M03-40-DATA-029: 文「商品コード=4099・商品と商品規格は削除済み」(シード単位。SQLに値があるかどうかで足し外ししない)
EXPECT_SEED['S-M03-40-DATA-029'] = [('商品コード4099の規格が論理削除(廃止・表示しない)', "SELECT product_status_id = 3 AND visible = false FROM dtb_product_class WHERE id = %s" % pc('4099'))]
