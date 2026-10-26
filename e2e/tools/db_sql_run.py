#!/usr/bin/env python3
"""試し用のDB eccubedb_sqltest だけでSQLを確かめる道具。データベース名は固定で、これ以外は受け付けない。
  - 毎回、先頭で current_database() を確かめ、違えば止める(guard)
  - 資格情報はコンテナの環境変数(出力しない)
  - どの確かめも1つのトランザクションの中で行い、最後に ROLLBACK する(試し用DBの行の中身は変えない。ただし連番(シーケンス)を進める文
    (nextval。番号を文に書かない取込履歴の登録など)があると、連番の値はロールバックしても戻らない)。
    SQLファイルの BEGIN; と COMMIT; は外し、外側のトランザクションの中で文をそのまま流す。
使い方:
  tools/db_sql_run.py counts            ダンプ直後の件数(SELECTのみ)を review/db_dump_counts.json に書く
  tools/db_sql_run.py run [絞り込み語]   確かめて review/db_sql_run_result.tsv に書く

確かめ方(ファイルごと):
  A. 置き換えずに流す: 呼び名〔…〕を存在しない番号(-1)にして流す。画面で作るデータが無いので、確認(RAISE)で止まるか、何も変わらないのが想定。
     止まった確認のメッセージ(どの値が何件だったか)を記録し、「0件(画面で作るデータが無い)」以外で止まったもの・エラーは想定外として数える。
  A の区分: 止まった確認が「0件」でも、そのファイルが引く行を作るシードが無いもの(番号で引く管理者など。画面では番号を指定できず、どのシードのSQLも作らない)
     は「正しく登録しても止まる」、別の機能のシードのSQLだけが作るものは「別の機能のシードを先に登録しないと止まる」と分けて数える。
  B. 用意して流す: そのシードが画面で作るはずの最小の行を試し用に作ってから流す。用意する行の名前(商品コード・店舗名・棚卸計画名・ファイル名・呼び名)は
     シード表の文と手順書の「画面で入れる値」から読み(tools/db_sql_text.py)、SQLの本文からは写さない(写すと名前の間違いを見逃す)。
     流す前後で、文ごとに変わった行(更新前・更新後・消した行・入れた行)を記録し、
       - 変わった行が、用意した行か、このSQLが入れた行だけか(ダンプにある別の行を変えていないか)
       - tools/db_sql_expect.py に書いた期待(正しい行が正しい値になったか)を満たすか
       - もう一度流しても同じ状態か
     を確かめる。
  C. シード全体: tools/db_sql_expect.py の EXPECT_SEED と、シード表の文から作る期待(「同名取込履歴0件」など)があるシードは、全ファイルを流す順
     (db_before → db.sql・db_N の番号順)に流して期待を確かめる。期待はシード表の文から作り、SQLに値があるかどうかで足したり外したりしない。
"""
import json, os, re, subprocess, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_sql_lib import strip_comments_strings
import db_sql_text as T
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = 'eccubedb_sqltest'                      # 固定。引数では変えられない
CONT = 'ec-cube-enterprise-postgres_primary-1'
GUARD = ("DO $$ BEGIN IF current_database() <> '%s' THEN RAISE EXCEPTION 'このSQLは試し用DB %s 以外には流さない(今のDB: %%)', current_database(); END IF; END $$;\n" % (DB, DB))
CMD = ['docker', 'exec', '-i', CONT, 'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -q -At -F "|" -U "$POSTGRES_USER" -d ' + DB + ' -v ON_ERROR_STOP=1']
LABEL = re.compile(r'〔[^〕]+〕')


def psql(sql, timeout=900):
    p = subprocess.run(['nice', '-n', '19'] + CMD, input=GUARD + sql, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout, p.stderr


def counts():
    """渡すダンプを戻した直後の件数(SELECTだけ)。全件削除でしか書けない文の案内(手順書)に使う"""
    tabs = ['dtb_stock_move_transfer', 'dtb_stock_move_transfer_detail', 'dtb_stock_move_transfer_status_history', 'dtb_stock_move_instruction', 'dtb_inventory_plan', 'dtb_inventory_plan_detail', 'dtb_inventory_plan_detail_edit_history', 'dtb_smaregi_platform_api_call_log', 'dtb_csv_import_history']
    out = {}
    for t in tabs:
        rc, o, e = psql('begin transaction read only;\nselect count(*) from %s;\nrollback;\n' % t)
        out[t] = int(o.strip().split('\n')[-1]) if rc == 0 else None
    rc, o, e = psql('begin transaction read only;\nselect t.id, count(h.id) from mtb_csv_import_type t left join dtb_csv_import_history h on h.csv_import_type_id = t.id group by t.id order by t.id;\nrollback;\n')
    out['csv_import_history_by_type'] = {l.split('|')[0]: int(l.split('|')[1]) for l in o.strip().split('\n') if '|' in l} if rc == 0 else None
    json.dump(out, open(os.path.join(R, 'review', 'db_dump_counts.json'), 'w'), ensure_ascii=False)
    print(out)


def files(filt=None):
    fs = sorted(glob.glob(os.path.join(R, 'seed_files', '*', 'S-*', 'db*.sql')) + glob.glob(os.path.join(R, '.runs', 'seed_files_private', '*', 'S-*', 'db*.sql')))
    return [f for f in fs if (not filt or filt in f)]


# ---------------- 文に分ける ----------------
def statements(text):
    """コメント行を除き、DO $$…$$; と、引用符の外の ; で文に分ける"""
    out, cur, i, n = [], '', 0, len(text)
    while i < n:
        if text.startswith('--', i):
            j = text.find('\n', i)
            i = n if j < 0 else j + 1
            continue
        if text.startswith('$$', i):
            j = text.find('$$', i + 2)
            cur += text[i:j + 2]
            i = j + 2
            continue
        c = text[i]
        if c == "'":
            j = i + 1
            while j < n:
                if text[j] == "'" and j + 1 < n and text[j + 1] == "'":
                    j += 2
                    continue
                if text[j] == "'":
                    break
                j += 1
            cur += text[i:j + 1]
            i = j + 1
            continue
        cur += c
        i += 1
        if c == ';':
            if cur.strip():
                out.append(cur.strip())
            cur = ''
    if cur.strip():
        out.append(cur.strip())
    return out


def top_where(stmt):
    """括弧・引用符の外の最後の WHERE の位置"""
    depth, i, q, pos = 0, 0, False, -1
    up = stmt.upper()
    while i < len(stmt):
        c = stmt[i]
        if c == "'":
            q = not q
        elif not q:
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
            elif depth == 0 and up.startswith(' WHERE ', i):
                pos = i
        i += 1
    return pos


def instrument(stmts, tag):
    """変わった行を記録する形にする。UPDATE は前に同じ条件の SELECT(更新前)、UPDATE/DELETE/INSERT に RETURNING を付ける"""
    out = []
    for k, st in enumerate(stmts):
        body = st.rstrip(';').strip()
        u = body.upper()
        if u in ('BEGIN', 'COMMIT', 'ROLLBACK', 'END'):
            continue
        m = re.match(r'(?is)^UPDATE\s+(\w+)\s+SET\s', body)
        if m:
            t = m.group(1)
            w = top_where(body)
            if w >= 0:
                out.append("SELECT '%s|%d|B|%s|' || (to_jsonb(%s.*) || jsonb_build_object('_xmin', %s.xmin::text))::text FROM %s%s;" % (tag, k, t, t, t, t, body[w:]))
            out.append("%s RETURNING '%s|%d|A|%s|' || to_jsonb(%s.*)::text;" % (body, tag, k, t, t))
            continue
        m = re.match(r'(?is)^DELETE\s+FROM\s+(\w+)\s', body)
        if m:
            t = m.group(1)
            out.append("%s RETURNING '%s|%d|D|%s|' || (to_jsonb(%s.*) || jsonb_build_object('_xmin', %s.xmin::text))::text;" % (body, tag, k, t, t, t))
            continue
        m = re.match(r'(?is)^INSERT\s+INTO\s+(\w+)\s', body)
        if m:
            t = m.group(1)
            out.append("%s RETURNING '%s|%d|I|%s|' || to_jsonb(%s.*)::text;" % (body, tag, k, t, t))
            continue
        out.append(body + ';')
    return out


# ---------------- 試し用の行(画面で作るはずの最小の行) ----------------
BASE = {'product': 2100000000, 'class': 2100100000, 'stock': 2100200000, 'hist': 2100300000, 'shop': 2100400000, 'member': 2100500000,
        'plan': 2100600000, 'detail': 2100700000, 'section': 2100800000, 'sellgroup': 2100900000, 'split': 2101000000, 'instr': 2101100000,
        'csvhist': 2101200000, 'dept': 32000}


class Fixture:
    """そのシードが画面で作るはずの行を、シード表の文(と手順書の「画面で入れる値」)から読んで作る。SQLの本文が引く名前は写さない
    (写すと、SQLが間違った名前を引いても用意した行に当たって通ってしまい、間違いを見逃すため)。
    例外: SQLが自分で入れる行(INSERT)は用意しない。番号で引く行(画面では番号を指定できない)は、ダンプにあるか、どれかのシードのSQLが作るときだけ用意する"""

    def __init__(self, texts, dump, seed_text='', enter=(), fid='', sid='', creators=None, fn_text=''):
        self.dump = dump          # ダンプにある値の件数(商品コード・店舗名など)
        self.sql = []
        self.labels = {}
        self.ids = collections.defaultdict(list)   # 種類 → 用意した番号
        self.n = collections.Counter()
        self.problems = []
        self.notes = []
        self.fid, self.sid = fid, sid
        self.creators = creators or {}
        self.seed_text = seed_text
        self.fn_text = fn_text           # 同じ機能のシード表の全部の文(管理者・部門などの名前の出どころ)
        raw = '\n'.join(texts)
        self.raw = raw
        ins = ' '.join(x for x in statements(raw) if re.match(r'(?is)^INSERT\s+INTO\s+dtb_product_class\b', x))
        # このSQLが自分で入れる商品コードは、画面で作るものではないので用意しない
        self.codes = [c for c in dict.fromkeys(T.codes(seed_text) + list(enter)) if "'%s'" % c not in ins]
        self.shops = T.shops(seed_text)
        self.label_list = T.labels(seed_text)
        self.plan_names, self.plan_prefixes = T.plans(seed_text)
        self.files = T.file_names(seed_text)

    @staticmethod
    def _nocomment(t):
        return '\n'.join(l for l in t.split('\n') if not l.lstrip().startswith('--'))

    def nid(self, kind):
        self.n[kind] += 1
        i = BASE[kind] + self.n[kind]
        self.ids[kind].append(i)
        return i

    @staticmethod
    def digit(i):
        # 店舗の桁(3文字・一意)。ダンプの値とぶつからない形(Qで始まる)
        k = i - BASE['shop']
        a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        return 'Q' + a[k // 36 % 36] + a[k % 36]

    @staticmethod
    def suffix(l):
        return re.sub(r'^〔[^-]+ID-', '', l).rstrip('〕')

    def named(self, v):
        """名前(管理者名・部門名など)がシード表の文に完全な語として出てくるか(このシード、または同じ機能のシード)"""
        return T.token_in(v, self.seed_text) or T.token_in(v, self.fn_text)

    def build(self):
        t = self._nocomment(self.raw)
        S = self.sql
        S.append("CREATE TEMP TABLE zz_fx_main AS SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop;")
        main = "(SELECT id FROM zz_fx_main)"
        mem0 = "(SELECT min(id) FROM dtb_member)"
        dep0 = "(SELECT min(id) FROM mtb_department)"
        # 店舗(シード表の文の店舗名)
        shop_ids = {}
        for nm in self.shops:
            c = self.dump.get(('shop', nm), 0)
            if c > 1:
                self.problems.append('店舗名「%s」がダンプに%d件ある' % (nm, c))
                continue
            if c == 1:
                shop_ids[nm] = "(SELECT id FROM dtb_base_info WHERE shop_name = '%s')" % nm.replace("'", "''")
                self.notes.append('店舗「%s」はダンプにあるものを使った' % nm)
                continue
            i = self.nid('shop')
            S.append("INSERT INTO dtb_base_info (id, shop_name, shop_digit, update_date) VALUES (%d, '%s', '%s', now());" % (i, nm.replace("'", "''"), self.digit(i)))
            shop_ids[nm] = str(i)
        for l in self.label_list:
            if l.startswith('〔店舗ID-'):
                i = self.nid('shop')
                S.append("INSERT INTO dtb_base_info (id, shop_name, shop_digit, update_date) VALUES (%d, 'FX-%s', '%s', now());" % (i, self.suffix(l), self.digit(i)))
                self.labels[l] = i
                shop_ids[l] = str(i)
        # 商品・規格(シード表の文の商品コード、規格・商品の呼び名)
        classes = {}   # key → (product_id, class_id)
        for c in self.codes:
            k = self.dump.get(('code', c), 0)
            if k > 0:
                self.notes.append('商品コード%sはダンプに%d件あるので用意しなかった' % (c, k))
                continue
            p, ci = self.nid('product'), self.nid('class')
            classes[('code', c)] = (p, ci)
            S += self._product(p, ci, c, main)
        nz = lambda x: re.sub(r'[-_]', '', x).upper()
        for l in self.label_list:
            if l.startswith('〔商品規格ID-') or l.startswith('〔規格ID-'):
                same = [v for (kk, cc), v in classes.items() if kk == 'code' and nz(cc) == nz(self.suffix(l))]
                if same:
                    # 文の呼び名の末尾が商品コードと同じ(〔商品規格ID-M0430-CB017-OK〕と商品コードM0430-CB017-OK): 同じ規格
                    classes[('label', l)] = same[0]
                    self.labels[l] = same[0][1]
                    continue
                p, ci = self.nid('product'), self.nid('class')
                classes[('label', l)] = (p, ci)
                self.labels[l] = ci
                S += self._product(p, ci, 'FX-' + self.suffix(l), main)
        for l in self.label_list:
            if l.startswith('〔商品ID-'):
                suf = self.suffix(l)
                pair = [v for (kk, ll), v in classes.items() if kk == 'label' and self.suffix(ll) == suf] or \
                    [v for (kk, cc), v in classes.items() if kk == 'code' and nz(cc) == nz(suf)]
                if pair:
                    self.labels[l] = pair[0][0]
                else:
                    p, ci = self.nid('product'), self.nid('class')
                    classes[('plabel', l)] = (p, ci)
                    self.labels[l] = p
                    S += self._product(p, ci, 'FX-' + suf, main)
        # 在庫(規格ごとに、本店とシード表の文の店舗 × 在庫区分 EC-CUBE(1)・スマレジ(2))
        shop_exprs = [main] + [v for v in shop_ids.values()]
        stock_of = {}
        uniq = {}
        for key, v in classes.items():
            uniq.setdefault(v, key)
        for (p, ci), key in uniq.items():
            for sx in dict.fromkeys(shop_exprs):
                for loc in (1, 2):
                    i = self.nid('stock')
                    S.append("INSERT INTO dtb_product_stock (id, product_class_id, base_info_id, stock_location_id, stock, total_cost, create_date, update_date) VALUES (%d, %d, %s, %d, 0, 0, now(), now());" % (i, ci, sx, loc))
                    stock_of[(ci, sx, loc)] = i
        for l in self.label_list:
            if l.startswith('〔在庫ID-'):
                suf = self.suffix(l)
                pair = [v for (kk, ll), v in classes.items() if kk in ('label', 'plabel') and self.suffix(ll) == suf]
                if not pair:
                    p, ci = self.nid('product'), self.nid('class')
                    S += self._product(p, ci, 'FX-' + suf, main)
                    i = self.nid('stock')
                    S.append("INSERT INTO dtb_product_stock (id, product_class_id, base_info_id, stock_location_id, stock, total_cost, create_date, update_date) VALUES (%d, %d, %s, 1, 0, 0, now(), now());" % (i, ci, main))
                    self.labels[l] = i
                else:
                    self.labels[l] = stock_of[(pair[0][1], main, 1)]
        # 価格履歴(規格ごとに1件。取り込みでできる形: 変更前の価格が0)
        hist_of = {}
        hid = {}
        for key, (p, ci) in classes.items():
            if (p, ci) not in hid:
                i = self.nid('hist')
                S.append("INSERT INTO dtb_price_history (id, product_class_id, member_id, sell_price, buy_price, standard_price, old_sell_price, old_buy_price, old_standard_price, create_date) VALUES (%d, %d, NULL, 1000, 400, 1000, 0, 0, 0, now() - interval '1 day');" % (i, ci))
                hid[(p, ci)] = i
            hist_of[key] = hid[(p, ci)]
        for l in self.label_list:
            if re.match(r'〔価格(?:変更)?履歴ID-', l):
                suf = self.suffix(l)
                pair = [k for k in hist_of if k[0] in ('label', 'plabel', 'code') and (self.suffix(k[1]) == suf if k[0] != 'code' else k[1] == suf)]
                if pair:
                    self.labels[l] = hist_of[pair[0]]
        # 棚卸計画と棚卸詳細(シード表の文の棚卸計画の名前。「…」で始まる棚卸名は、その前置きの名前の計画を1件)
        plans = list(self.plan_names) + [p_ + 'FX' for p_ in self.plan_prefixes]
        if plans and not classes:
            p, ci = self.nid('product'), self.nid('class')
            classes[('plan', 'FX')] = (p, ci)
            S += self._product(p, ci, 'FX-PLAN', main)
            i = self.nid('stock')
            S.append("INSERT INTO dtb_product_stock (id, product_class_id, base_info_id, stock_location_id, stock, total_cost, create_date, update_date) VALUES (%d, %d, %s, 1, 0, 0, now(), now());" % (i, ci, main))
            stock_of[(ci, main, 1)] = i
        for nm in dict.fromkeys(plans):
            if self.dump.get(('plan', nm), 0):
                self.problems.append('棚卸計画「%s」がダンプにある' % nm)
                continue
            i = self.nid('plan')
            S.append("INSERT INTO dtb_inventory_plan (id, name, dtype, base_info_id, stock_location_id, create_date, update_date) VALUES (%d, '%s', 'dtbinventoryplan', %s, 1, now() - interval '2 day', now() - interval '2 day');" % (i, nm.replace("'", "''"), main))
            for (p, ci) in dict.fromkeys(classes.values()):
                j = self.nid('detail')
                S.append("INSERT INTO dtb_inventory_plan_detail (id, inventory_plan_id, product_stock_id, dtype, create_date, update_date) VALUES (%d, %d, %d, 'dtbinventoryplandetail', now() - interval '2 day', now() - interval '2 day');" % (j, i, stock_of[(ci, main, 1)]))
        # 管理者・部門・購入グループ: SQLが名前で引くもののうち、名前がシード表の文(このシード・同じ機能のシード)に完全な語として出てくるものだけ作る
        for nm in dict.fromkeys(re.findall(r"dtb_member WHERE name = '([^']+)'", t)):
            if self.dump.get(('member', nm), 0):
                continue
            if not self.named(nm):
                self.notes.append('管理者「%s」はシード表の文に無いので用意しなかった' % nm)
                continue
            i = self.nid('member')
            S.append(self._member(i, nm, dep0, main))
        for lg in dict.fromkeys(re.findall(r"dtb_member WHERE login_id = '([^']+)'", t)):
            if not self.named(lg):
                self.notes.append('ログインID %s はシード表の文に無いので用意しなかった' % lg)
                continue
            i = self.nid('member')
            S.append(self._member(i, 'FX-' + lg, dep0, main, login=lg))
        # 番号で引く管理者・発送日目安: 画面では番号を指定できない。どれかのシードのSQLが作るときだけ、そのシードの代わりに作る
        for mid in dict.fromkeys(re.findall(r"dtb_member WHERE id = (\d+)", t)):
            cr = [c for c in self.creators.get(('dtb_member', mid), []) if c[1] != self.sid]
            if cr:
                S.append(self._member(int(mid), 'FX-member-%s' % mid, dep0, main))
                self.notes.append('管理者（番号%s）は %s のSQLが作るので、試し用に作って流した' % (mid, '・'.join(x[1] for x in cr)))
            else:
                self.notes.append('管理者（番号%s）は、どのシードも作らないので用意しなかった' % mid)
        for nm in dict.fromkeys(re.findall(r"mtb_department WHERE name = '([^']+)'", t)):
            if not self.named(nm):
                continue
            i = self.nid('dept')
            S.append("INSERT INTO mtb_department (id, name, sort_no) VALUES (%d, '%s', 99);" % (i, nm.replace("'", "''")))
        for nm in dict.fromkeys(re.findall(r"mtb_sell_group WHERE name = '([^']+)'", t)):
            if not self.named(nm):
                continue
            i = self.nid('sellgroup')
            S.append("INSERT INTO mtb_sell_group (id, name, name_en, create_date, update_date) VALUES (%d, '%s', 'FX-%d', now(), now());" % (i, nm.replace("'", "''"), i))
        for cd in dict.fromkeys(re.findall(r"mtb_section WHERE code = '([^']+)'", t)):
            if not self.named(cd):
                continue
            i = self.nid('section')
            S.append("INSERT INTO mtb_section (id, name, code) VALUES (%d, 'FX-%s', '%s');" % (i, cd, cd))
        for l in self.label_list:
            if l.startswith('〔部門ID-'):
                i = self.nid('section')
                S.append("INSERT INTO mtb_section (id, name, code, smaregi_category_id) VALUES (%d, 'FX-%s', 'FX-%s', 'FX');" % (i, self.suffix(l), self.suffix(l)))
                self.labels[l] = i
            elif l.startswith('〔購入グループID-'):
                i = self.nid('sellgroup')
                S.append("INSERT INTO mtb_sell_group (id, name, name_en, create_date, update_date) VALUES (%d, 'FX-%s', 'FX-%s', now(), now());" % (i, self.suffix(l), self.suffix(l)))
                self.labels[l] = i
            elif l.startswith('〔在庫分割結合ID-'):
                i = self.nid('split')
                st = self.ids['stock'][0] if self.ids['stock'] else None
                if st is None:
                    p, ci = self.nid('product'), self.nid('class')
                    S += self._product(p, ci, 'FX-' + self.suffix(l), main)
                    st = self.nid('stock')
                    S.append("INSERT INTO dtb_product_stock (id, product_class_id, base_info_id, stock_location_id, stock, total_cost, create_date, update_date) VALUES (%d, %d, %s, 1, 0, 0, now(), now());" % (st, ci, main))
                S.append("INSERT INTO dtb_stock_split_join (id, stock_split_join_status_id, product_stock_id, registered_member_id, update_member_id, split_join_type, standard_price, unit_cost_price, total_cost, stock, split_join_quantity, create_date, update_date) "
                         "VALUES (%d, (SELECT min(id) FROM mtb_stock_split_join_status), %d, %s, %s, 1, 0, 0, 0, 0, 1, now() - interval '1 day', now() - interval '1 day');" % (i, st, mem0, mem0))
                self.labels[l] = i
            elif re.match(r'〔(?:在庫)?移動指示ID-', l):
                i = self.nid('instr')
                S.append("INSERT INTO dtb_stock_move_instruction (id, move_from_base_info_id, move_to_base_info_id, registered_member_id, move_from_price_threshold, standard_total_price, outbound_total_cost, high_total_price, regular_total_price, create_date) "
                         "VALUES (%d, %s, %s, %s, 0, 0, 0, 0, 0, now() - interval '1 day');" % (i, main, main, mem0))
                self.labels[l] = i
        for did in dict.fromkeys(re.findall(r"dtb_delivery_duration WHERE id = (\d+)\)", t)):
            if self.dump.get(('duration', did), 0):
                continue
            cr = [c for c in self.creators.get(('dtb_delivery_duration', did), []) if c[1] != self.sid]
            if cr:
                S.append("INSERT INTO dtb_delivery_duration (id, base_info_id, name, duration, sort_no) VALUES (%s, %s, 'FX', 1, 0) ON CONFLICT (id) DO NOTHING;" % (did, main))
                self.notes.append('発送日目安（番号%s）は %s のSQLが作るので、試し用に作って流した' % (did, '・'.join('%s（%s）' % (x[1], x[0]) for x in cr)))
            else:
                self.notes.append('発送日目安（番号%s）は、どのシードも作らないので用意しなかった' % did)
        # 取込履歴: シード表の文のファイル名 × その機能の画面が使う取込種別(前回の残りとして1件ずつ)
        ty = T.screen_type(self.fid, _NAMES.get((self.fid, self.sid), ''))
        if ty:
            for fn in self.files:
                i = self.nid('csvhist')
                S.append("INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) VALUES (%d, %d, NULL, '%s', now() - interval '1 day');" % (i, ty, fn.replace("'", "''")))
        used = set(LABEL.findall(strip_comments_strings(self.raw)))
        for l in sorted(used):
            if l not in self.label_list:
                self.problems.append('SQLの呼び名 %s がシード表の文に無い' % l)
            elif l not in self.labels:
                self.problems.append('呼び名 %s の行を用意できない（種類が対応外）' % l)
        return self

    def _product(self, p, ci, code, main):
        return ["INSERT INTO dtb_product (id, base_info_id, name, product_status_id, create_date, update_date) VALUES (%d, %s, 'FX-%s', 1, now(), now());" % (p, main, code.replace("'", "''")),
                "INSERT INTO dtb_product_class (id, product_id, base_info_id, product_code, price02, standard_price, buy_price, card_condition_id, language_id, product_status_id, visible, sale_flg, create_date, update_date) "
                "VALUES (%d, %d, %s, '%s', 1000, 1000, 400, 1, 1, 1, true, false, now() - interval '1 day', now() - interval '1 day');" % (ci, p, main, code.replace("'", "''"))]

    @staticmethod
    def _member(i, nm, dep, main, login=None):
        lg = login or ('fx%d' % i)
        return ("INSERT INTO dtb_member (id, name, login_id, email, password, department_id, base_info_id, sort_no, create_date, update_date) "
                "VALUES (%d, '%s', '%s', 'fx%d@example.test', 'x', %s, %s, 0, now(), now()) ON CONFLICT (id) DO NOTHING;" % (i, nm.replace("'", "''"), lg.replace("'", "''"), i, dep, main))


def dump_counts(texts, seed_text=''):
    """ダンプにある値の件数(商品コード・店舗名・棚卸計画名・管理者名・発送日目安)を SELECT で数える。SQLの値とシード表の文の値の両方"""
    t = '\n'.join(texts)
    qs = []
    keys = []
    pn, pp = T.plans(seed_text)
    for c in dict.fromkeys(T.codes(seed_text)):
        keys.append(('code', c)); qs.append("SELECT count(*) FROM dtb_product_class WHERE product_code = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(T.shops(seed_text)):
        keys.append(('shop', c)); qs.append("SELECT count(*) FROM dtb_base_info WHERE shop_name = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(pn + [x + 'FX' for x in pp]):
        keys.append(('plan', c)); qs.append("SELECT count(*) FROM dtb_inventory_plan WHERE name = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(re.findall(r"product_code = '([^']+)'", t)):
        keys.append(('code', c)); qs.append("SELECT count(*) FROM dtb_product_class WHERE product_code = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(re.findall(r"shop_name = '([^']+)'", t)):
        keys.append(('shop', c)); qs.append("SELECT count(*) FROM dtb_base_info WHERE shop_name = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(re.findall(r"dtb_inventory_plan WHERE name = '([^']+)'", t)):
        keys.append(('plan', c)); qs.append("SELECT count(*) FROM dtb_inventory_plan WHERE name = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(re.findall(r"dtb_member WHERE name = '([^']+)'", t)):
        keys.append(('member', c)); qs.append("SELECT count(*) FROM dtb_member WHERE name = '%s'" % c.replace("'", "''"))
    for c in dict.fromkeys(re.findall(r"dtb_delivery_duration WHERE id = (\d+)\)", t)):
        keys.append(('duration', c)); qs.append("SELECT count(*) FROM dtb_delivery_duration WHERE id = %s" % c)
    for tb, c in dict.fromkeys(re.findall(r"FROM (\w+) WHERE id = (\d+)\b", t)):
        keys.append(('id', tb, c)); qs.append("SELECT count(*) FROM %s WHERE id = %s" % (tb, c))
    if not qs:
        return {}
    rc, o, e = psql('BEGIN TRANSACTION READ ONLY;\n' + ''.join("SELECT %d, (%s);\n" % (i, q) for i, q in enumerate(qs)) + 'ROLLBACK;\n')
    out = {}
    if rc == 0:
        for l in o.strip().split('\n'):
            if '|' in l:
                i, c = l.split('|')
                out[keys[int(i)]] = int(c)
    return out


def first_error(e):
    m = re.search(r'ERROR:\s*(.*)', e)
    return (m.group(1).strip() if m else e.strip()[:300])[:300]


def parse_rows(o):
    """tag|k|kind|table|json の行を集める"""
    rows = []
    for l in o.split('\n'):
        p = l.split('|', 4)
        if len(p) == 5 and p[0] in ('R1', 'R2'):
            try:
                rows.append([p[0], int(p[1]), p[2], p[3], json.loads(p[4])])
            except ValueError:
                pass
    return rows


def final_state(rows, tag):
    """そのラン(R1/R2)で最後に残った行(表, 番号)→内容。消した行は None"""
    st = {}
    for t_, k, kind, tab, j in rows:
        if t_ != tag:
            continue
        key = (tab, j.get('id'))
        if kind in ('A', 'I'):
            st[key] = j
        elif kind == 'D':
            st[key] = None
    return st


def norm(j, drop_id):
    if j is None:
        return None
    return json.dumps({k: v for k, v in j.items() if not (drop_id and k == 'id')}, sort_keys=True, ensure_ascii=False)


def classify_stop(msg, refs=None):
    """A(置き換えずに流す)で止まったときの区分。refs: そのファイルが引く行のうち、正しく登録しても無い行(作るシードが無い・別の機能のシードが作る)"""
    m = re.search(r'（(\d+)件）', msg)
    none_ = [r for r in (refs or []) if r[0] == 'none']
    other = [r for r in (refs or []) if r[0] == 'other_fn']
    if m and int(m.group(1)) == 0:
        if none_:
            return '正しく登録しても止まる（作るシードが無い: %s）' % '・'.join(r[1] for r in none_)
        if other:
            return '別の機能のシードを先に登録しないと止まる（%s）' % '・'.join(r[1] for r in other)
        return '想定どおり（画面で作るデータが無い）'
    if m:
        return '想定外（値が1件に決まらない: %s件）' % m.group(1)
    return '想定外（エラー）'


# ---------------- 正しく登録しても無い行(作るシードが無い・別の機能のシードが作る) ----------------
import csv as _csv
_csv.field_size_limit(10 ** 9)
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
_SEEDS = {}
_NAMES = {}   # (機能ID, シードID) → 論理名


def seed_rows(fid):
    if fid not in _SEEDS:
        d = collections.OrderedDict()
        pth = os.path.join(CASES, '%s_seed_data.tsv' % fid)
        if os.path.exists(pth):
            for r in list(_csv.reader(open(pth, encoding='utf-8'), delimiter='\t'))[1:]:
                d.setdefault(r[0], r[3] + '\n' + r[5])
                _NAMES.setdefault((fid, r[0]), r[2])
        _SEEDS[fid] = d
    return _SEEDS[fid]


def creators_index(all_files):
    """どのシードのSQLが、どの表のどの番号の行を入れるか (表, 番号) → [(機能ID, シードID)]"""
    idx = collections.defaultdict(list)
    for f in all_files:
        sid = os.path.basename(os.path.dirname(f))
        fid = os.path.basename(os.path.dirname(os.path.dirname(f)))
        body = '\n'.join(l for l in open(f, encoding='utf-8').read().split('\n') if not l.lstrip().startswith('--'))
        for tb, i in re.findall(r'INSERT INTO (\w+) \(id,[^)]*\) VALUES \((\d+),', body):
            if (fid, sid) not in idx[(tb, i)]:
                idx[(tb, i)].append((fid, sid))
    return idx


def literal_verdicts():
    """tools/db_sql_check.py literals の結果(ファイル → [(列, 値, 判定, 出どころ)])"""
    out = collections.defaultdict(list)
    pth = os.path.join(R, 'review', 'db_sql_literal_check.tsv')
    if os.path.exists(pth):
        for l in open(pth, encoding='utf-8').read().split('\n')[1:]:
            c = l.split('\t')
            if len(c) >= 6:
                out[c[0]].append((c[1], c[3], c[4], c[5]))
    return out


TABLE_JP = {'dtb_member': '管理者', 'dtb_delivery_duration': '発送日目安', 'mtb_department': '所属', 'dtb_base_info': '店舗', 'dtb_product': '商品', 'dtb_product_class': '商品規格'}


def refs_of(rel, text, fid, sid, creators, dump, lits):
    """このファイルが引く行のうち、正しく登録しても無いもの [(区分 none|other_fn, 説明)]。
    番号で引く行(画面では番号を指定できない): ダンプにあるか、どれかのシードのSQLが入れるか。名前で引く行: 値の照合(literals)の結果"""
    body = strip_comments_strings(text)
    raw = '\n'.join(l for l in text.split('\n') if not l.lstrip().startswith('--'))
    # 消す文(DELETE)の条件は、行が無くても止まらない(前回の残りの後始末・「存在しない」状態にする文)。引く行として数えない
    raw = '\n'.join(x for x in raw.split('\n') if not x.lstrip().upper().startswith('DELETE'))
    out = []
    ins_here = set(re.findall(r'INSERT INTO (\w+) \(id,[^)]*\) VALUES \((\d+),', raw))
    for tb, i in dict.fromkeys(re.findall(r"FROM (\w+) WHERE id = (\d+)\b", raw)):
        if (tb, i) in ins_here or dump.get(('id', tb, i), 0):
            continue
        cr = [c for c in creators.get((tb, i), []) if c[1] != sid]
        nm = '%s（番号%s）' % (TABLE_JP.get(tb, tb), i)
        if not cr:
            out.append(('none', nm))
        elif not [c for c in cr if c[0] == fid]:
            out.append(('other_fn', '%s は別の機能のシード %s のSQLが作る' % (nm, '・'.join('%s（%s）' % (c[1], c[0]) for c in cr))))
    for col, v, ok, src in lits.get(rel, []):
        if ok == 'NG':
            out.append(('none', '%s「%s」（シード表の文に完全な語として無い）' % (col, v)))
    return out


def load_expect():
    try:
        import db_sql_expect as X
        return X.EXPECT, getattr(X, 'EXTRA_FIXTURE', {}), getattr(X, 'EXPECT_SEED', {}), getattr(X, 'EXTRA_FIXTURE_SEED', {})
    except ImportError:
        return {}, {}, {}, {}


def text_expect(fid, seed_text, name=''):
    """シード表の文だけから作る期待(SQLを読まない): 取込履歴をDBで直接消して0件にすると書く文があるシードは、
    その文のファイル名(文に無く「同名」とだけ書くときは状態・属性のファイル名)・その機能の画面の取込種別の履歴が0件
    (「履歴に同じファイル名の行が無いことを確かめる」だけのシードは、画面で確かめる手順なので対象にしない)"""
    out = []
    ty = T.screen_type(fid, name)
    if not ty:
        return out
    names = []
    for x in re.split(r'[。／]', seed_text):
        if re.search(r'取込履歴|インポート履歴', x) and re.search(r'削除|0件', x) and re.search(r'DBへ直接|DBで直接|DBから直接', x):
            fs = T.file_names(x)
            if not fs and '同名' in x:
                fs = T.file_names(seed_text)
            names += fs
    for fn in dict.fromkeys(names):
        out.append(('ファイル名%sの取込履歴（取込種別%d＝この機能の画面が使う番号）が0件' % (fn, ty),
                    "SELECT count(*) = 0 FROM dtb_csv_import_history WHERE file_name = '%s' AND csv_import_type_id = %d" % (fn.replace("'", "''"), ty)))
    return out


def file_order(f):
    b = os.path.basename(f)
    if b == 'db_before.sql':
        return (0, 0)
    if b == 'db.sql':
        return (1, 0)
    m = re.match(r'db_(\d+)\.sql$', b)
    return (1, int(m.group(1)) if m else 99)


def run_seed(fx, flist, texts, exp, extra):
    """C: 用意した行のうえで、シードの全ファイルを流す順(db_before → db.sql/db_N の番号順)に流し、期待を確かめる(ROLLBACK)"""
    lab = lambda x: LABEL.sub(lambda m: str(fx.labels.get(m.group(0), -1)), x)
    parts = ['BEGIN;'] + fx.sql + [lab(x) for x in extra] + ["SELECT 'FX|done';"]
    for f, text in zip(flist, texts):
        body = [x for x in statements(text) if x.strip().upper() not in ('BEGIN;', 'COMMIT;')]
        parts += [lab(x) for x in body]
        parts.append("SELECT 'FILE|%s';" % os.path.basename(f))
    for i, (desc, q) in enumerate(exp):
        parts.append("SELECT 'CHK|%d|' || coalesce((%s)::text, 'null');" % (i, lab(q).rstrip(';')))
    parts += ['ROLLBACK;']
    rc, o, e = psql('\n'.join(parts) + '\n')
    if rc != 0:
        done = [l.split('|', 1)[1] for l in o.split('\n') if l.startswith('FILE|')]
        return '流す途中で止まった（%s の次）: %s' % (done[-1] if done else '用意' if 'FX|done' in o else '用意の途中', first_error(e))
    chk = {int(l.split('|')[1]): l.split('|', 2)[2] for l in o.split('\n') if l.startswith('CHK|')}
    fails = [exp[i][0] for i in range(len(exp)) if chk.get(i) != 'true']
    return ('期待%d件すべて合う' % len(exp)) if not fails else ('期待に合わない: ' + '／'.join(fails))


def run(filt=None):
    EXPECT, EXTRA, EXPECT_SEED, EXTRA_SEED = load_expect()
    allf = files()
    creators = creators_index(allf)
    lits = literal_verdicts()
    md = {}
    mdp = os.path.join(R, 'review', 'db_sql_md.json')
    if os.path.exists(mdp):
        md = json.load(open(mdp, encoding='utf-8'))
    fs = files(filt)
    by_seed = collections.OrderedDict()
    for f in fs:
        by_seed.setdefault(os.path.dirname(f), []).append(f)
    rows_out = []
    for d, flist in by_seed.items():
        flist = sorted(flist, key=file_order)
        sid = os.path.basename(d)
        fid = os.path.basename(os.path.dirname(d))
        seed_text = seed_rows(fid).get(sid, '')
        fn_text = '\n'.join(v for k, v in seed_rows(fid).items() if k != sid)
        enter = [v for st in (md.get(sid, {}).get('steps') or []) for v in (st.get('enter') or [])]
        texts = [open(f, encoding='utf-8').read() for f in flist]
        dc = dump_counts(texts, seed_text + '\n' + '\n'.join(enter))
        fx = Fixture(texts, dc, seed_text, enter, fid, sid, creators, fn_text).build()
        # C: シード全体(全ファイルを流す順に)を流して、シード表の文から作った期待を確かめる
        c_res = ''
        exp_seed = EXPECT_SEED.get(sid, []) + text_expect(fid, seed_text, _NAMES.get((fid, sid), ''))
        if exp_seed and not fx.problems:
            c_res = run_seed(fx, flist, texts, exp_seed, EXTRA_SEED.get(sid, []))
        elif exp_seed:
            c_res = '用意できない: ' + '；'.join(fx.problems)
        for f, text in zip(flist, texts):
            rel = os.path.relpath(f, R)
            key = rel.split('seed_files/', 1)[-1].replace('seed_files_private/', '')
            refs = refs_of(rel, text, fid, sid, creators, dc, lits)
            code = strip_comments_strings(text)
            has_label = bool(LABEL.search(code))
            stmts = statements(text)
            bad = [s for s in stmts if re.match(r'(?is)^(COMMIT|ROLLBACK|END)\b', s) and s.strip().upper() not in ('COMMIT;',)]
            body = [s for s in stmts if s.strip().upper() not in ('BEGIN;', 'COMMIT;')]
            if bad:
                rows_out.append([rel, '-', 'ERROR', 'BEGIN/COMMIT 以外のトランザクション文がある', '想定外', '', '', '', '', '', '想定外'])
                continue
            # A: 呼び名を存在しない番号にして流す
            a_sql = 'BEGIN;\n' + '\n'.join(LABEL.sub('-1', s) for s in instrument(body, 'R1')) + '\nROLLBACK;\n'
            rc, o, e = psql(a_sql)
            if rc == 0:
                ch = parse_rows(o)
                ndml = sum(1 for r in ch if r[2] in ('A', 'D', 'I'))
                nu = sum(1 for r in ch if r[2] == 'A')
                nd = sum(1 for r in ch if r[2] == 'D')
                ni = sum(1 for r in ch if r[2] == 'I')
                a_res, a_msg = 'ok', '変わった行 %d（更新%d・削除%d・追加%d）' % (ndml, nu, nd, ni)
                a_cls = '想定どおり（何も変わらない）' if ndml == 0 else ('このSQLが行を入れた（画面のデータに頼らない）' if nu == 0 and nd == 0 else 'ダンプの行を更新・削除した（要確認）')
            else:
                a_msg = first_error(e)
                a_res = 'stop_assert' if 'RAISE' in e or '件）' in a_msg else 'ERROR'
                a_cls = classify_stop(a_msg, refs)
            # B: 用意して流す
            b_res, b_changed, b_scope, b_expect, b_idem, b_note = '-', '', '', '', '', ''
            if fx.problems:
                b_res = '用意できない'
                b_note = '；'.join(fx.problems)
            else:
                lab = lambda s: LABEL.sub(lambda m: str(fx.labels.get(m.group(0), -1)), s)
                exp = EXPECT.get(key, [])
                extra = EXTRA.get(key, [])
                parts = ['BEGIN;'] + fx.sql + [lab(x) for x in extra] + ["SELECT 'FX|done|' || (txid_current() % 4294967296)::text;"]
                parts += [lab(s) for s in instrument(body, 'R1')]
                for i, (desc, q) in enumerate(exp):
                    parts.append("SELECT 'CHK|%d|' || coalesce((%s)::text, 'null');" % (i, lab(q).rstrip(';')))
                wt = sorted({m.group(1) for st in body for m in [re.match(r'(?is)^(?:UPDATE|INSERT\s+INTO)\s+(\w+)\s', st)] if m})
                snap = lambda n: ["SELECT 'SNAP|%s|%s|' || coalesce(md5(string_agg(j, ',' ORDER BY j)), '-') || '|' || count(*) FROM (SELECT (to_jsonb(x.*) - 'id')::text j FROM %s x WHERE x.xmin::text::bigint = txid_current() %% 4294967296) s;" % (n, t, t) for t in wt]
                parts += snap('1')
                parts += [lab(s) for s in instrument(body, 'R2')]
                parts += snap('2')
                parts += ["SELECT 'END|done';", 'ROLLBACK;']
                rc, o, e = psql('\n'.join(parts) + '\n')
                if rc != 0:
                    msg = first_error(e)
                    stage = 'R1' if 'FX|done' in o and 'END|done' not in o else ('用意' if 'FX|done' not in o else 'R2')
                    b_res = 'stop' if '件）' in msg else 'ERROR'
                    b_note = '%sで止まった: %s' % (stage, msg)
                else:
                    rows = parse_rows(o)
                    r1 = [r for r in rows if r[0] == 'R1' and r[2] in ('A', 'D', 'I')]
                    b_changed = '%d' % len(r1)
                    txid = next((l.split('|')[2] for l in o.split('\n') if l.startswith('FX|done|')), None)
                    inserted = {(r[3], r[4].get('id')) for r in rows if r[0] == 'R1' and r[2] == 'I'}
                    # 変えた(更新・削除)行のうち、このトランザクションより前からあった行(ダンプの行)。更新は更新前の行の xmin で見る
                    pre = [r for r in rows if r[0] == 'R1' and r[2] in ('B', 'D')]
                    outside = sorted({'%s#%s' % (r[3], r[4].get('id')) for r in pre if r[4].get('_xmin') != txid})
                    for r in rows:
                        r[4].pop('_xmin', None)
                    b_scope = '用意した行・このSQLが入れた行だけ' if not outside else 'ダンプの行も変えた: ' + ' '.join(outside[:8])
                    chk = {int(l.split('|')[1]): l.split('|', 2)[2] for l in o.split('\n') if l.startswith('CHK|')}
                    if exp:
                        fails = [exp[i][0] for i in range(len(exp)) if chk.get(i) != 'true']
                        b_expect = '期待%d件すべて合う' % len(exp) if not fails else '期待に合わない: ' + '／'.join(fails)
                    s1, s2 = final_state(rows, 'R1'), final_state(rows, 'R2')
                    ins1 = {k for k in inserted}
                    # 2回目: 1回目に入れた行を消して入れ直すのは可。最終の内容(新しく入れた行は番号を除く)が同じか
                    def summary(st, rows_, tag):
                        insk = {(r[3], r[4].get('id')) for r in rows_ if r[0] == tag and r[2] == 'I'}
                        c = collections.Counter()
                        for (tab, i), j in st.items():
                            c[(tab, norm(j, (tab, i) in insk))] += 1
                        return c
                    d2 = [r for r in rows if r[0] == 'R2' and r[2] == 'D' and (r[3], r[4].get('id')) not in ins1]
                    upd2 = [r for r in rows if r[0] == 'R2' and r[2] == 'A']
                    b4 = {(r[1], r[3], r[4].get('id')): r[4] for r in rows if r[0] == 'R2' and r[2] == 'B'}
                    changed2 = [r for r in upd2 if b4.get((r[1], r[3], r[4].get('id'))) != r[4]]
                    same = (summary({k: v for k, v in s1.items() if v is not None}, rows, 'R1') == summary({k: v for k, v in s2.items() if v is not None}, rows, 'R2')) or not s2
                    snaps = {}
                    for l in o.split('\n'):
                        if l.startswith('SNAP|'):
                            _, n_, t_, h_ = l.split('|', 3)
                            snaps[(n_, t_)] = h_
                    snapdiff = [t_ for (n_, t_) in snaps if n_ == '1' and snaps.get(('2', t_)) != snaps[(n_, t_)]]
                    if not d2 and not changed2 and not snapdiff:
                        b_idem = '同じ'
                    else:
                        b_idem = '2回目で変化: 1回目に無かった行を消した%d・値が変わった%d・このトランザクションで書いた行の内容が違う表%s' % (len(d2), len(changed2), ','.join(snapdiff) or 'なし')
                    b_res = 'ok'
                    b_note = '；'.join(fx.notes)
            none_ = [r[1] for r in refs if r[0] == 'none']
            other = [r[1] for r in refs if r[0] == 'other_fn']
            if none_:
                verdict = '正しく登録しても止まる（作るシードが無い: %s）' % '・'.join(none_)
            elif c_res and 'すべて合う' not in c_res:
                verdict = 'シード全体の期待に合わない（%s）' % c_res
            elif b_res == 'ok':
                if b_scope.startswith('用意した') and b_idem == '同じ' and int(b_changed or 0) > 0 and (not b_expect or b_expect.startswith('期待') and 'すべて合う' in b_expect):
                    verdict = '正しく変わった（期待を確認）' if b_expect else '用意した行の中だけが変わった（期待の個別確認なし）'
                elif int(b_changed or 0) == 0:
                    verdict = '用意して流しても何も変わらない'
                else:
                    verdict = '要確認'
            elif b_res == 'stop':
                verdict = '用意して流しても止まった'
            elif b_res == '用意できない':
                verdict = '用意できない（Aの結果だけ）'
            else:
                verdict = '想定外（エラー）'
            if other and not none_:
                verdict += '（前提: %s。そのシードを先に登録して流す）' % '・'.join(other)
            if c_res and c_res.startswith('期待') and 'すべて合う' in c_res and verdict.startswith('用意した行の中だけ'):
                verdict = '正しく変わった（シード全体の期待を確認）'
            rows_out.append([rel, 'あり' if has_label else 'なし', a_res, a_msg, a_cls, b_res, b_changed, b_scope, b_expect, b_idem, b_note, verdict, c_res])
            print(rel.split('/')[-2], rel.split('/')[-1], a_cls[:12], b_res, b_changed, b_expect[:20], b_idem[:12], verdict, flush=True)
    out = os.path.join(R, 'review', 'db_sql_run_result.tsv')
    old = {}
    if filt and os.path.exists(out):
        for l in open(out, encoding='utf-8').read().split('\n')[1:]:
            if l:
                old[l.split('\t')[0]] = l
    for r in rows_out:
        old[r[0]] = '\t'.join(str(x).replace('\t', ' ').replace('\n', ' ') for x in r)
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('\t'.join(['ファイル', '呼び名(コメント・文字列を除く)', 'A 置き換えずに流した結果', 'A メッセージ(止まった確認)', 'A 区分', 'B 用意して流した結果', 'B 変わった行の数',
                            'B 変わった範囲', 'B 期待', 'B 2回目', 'B 備考', '判定', 'C シード全体（全ファイルを順に流す）の期待']) + '\n')
        for k in sorted(old):
            fh.write(old[k] + '\n')


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        run(sys.argv[2] if len(sys.argv) > 2 else None)
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == 'counts':
        counts()
