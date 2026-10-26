"""DB直接設定のSQLを作る部品(db_sql.py が使う)。DB・アプリには触らない。物理名はSQLの中だけに使う。"""
import re

LABEL = re.compile(r'〔[^〕]+〕')


class Unsupported(Exception):
    """作れない文。理由を持つ。gap=設計と実装の差の候補の区分(現行のDBに設定先が無い・番号の桁など)"""
    def __init__(self, msg, gap=''):
        super().__init__(msg)
        self.gap = gap


class Out:
    def __init__(self, sql, notes=None, tables=None, unmade=None, gap=None):
        self.sql = sql if isinstance(sql, list) else [sql]
        self.unmade = unmade or []   # この文のうち作れなかった部分と理由（あれば「一部だけ作った」）
        self.gap = gap or ''         # 設計と実装の差の候補（現行のDBに設定先が無い・番号の桁など）
        self.when = 'after'   # 'before' = 画面で登録する前に流す(やり直しの後始末) / 'after' = 画面で登録したあとに流す
        self.notes = notes or []
        self.tables = tables or []


def qs(s):
    return "'" + str(s).replace("'", "''") + "'"


def ts(text):
    """'2026/10/10' '2026/10/10 15:30' '2026-10-10 15:30:00' → timestamptz リテラル(日本時間)"""
    m = re.match(r'^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?', text.strip())
    if not m:
        raise Unsupported(f'日時の形を読めない: {text}')
    y, mo, d, h, mi, se = m.groups()
    return "TIMESTAMPTZ '%s-%02d-%02d %02d:%02d:%02d+09'" % (y, int(mo), int(d), int(h or 0), int(mi or 0), int(se or 0))


def assert_one(count_sql, msg):
    """副問い合わせが1行に決まることを確かめる(違えば全体を止める)。止まったときは実際の件数をメッセージの末尾に出す"""
    return ("DO $$ DECLARE n bigint; BEGIN SELECT (%s) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION %s, n; END IF; END $$;" % (count_sql, qs(msg.replace('%', '%%') + '（%件）')))


def assert_ge(count_sql, n, msg):
    return ("DO $$ DECLARE c bigint; BEGIN SELECT (%s) INTO c; IF c < %d THEN RAISE EXCEPTION %s, c; END IF; END $$;" % (count_sql, n, qs(msg.replace('%', '%%') + '（%件）')))


def assert_eq(count_sql, n, msg):
    """件数がちょうど n であることを確かめる(更新する対象の数の確認)"""
    return ("DO $$ DECLARE c bigint; BEGIN SELECT (%s) INTO c; IF c IS DISTINCT FROM %d THEN RAISE EXCEPTION %s, c; END IF; END $$;" % (count_sql, n, qs(msg.replace('%', '%%') + '（%件）')))


def split_sentences(text):
    return [s for s, _ in split_sentences_pos(text)]


def split_sentences_pos(text):
    """文に分け、文の始まりの位置も返す [(文, 位置)]"""
    out = []
    cur = ''
    depth = 0
    start = 0
    for i, ch in enumerate(text):
        if not cur:
            start = i
        cur += ch
        if ch in '（(':
            depth += 1
        elif ch in '）)':
            depth = max(0, depth - 1)
        elif ch in '。／' and depth == 0:
            out.append((cur, start))
            cur = ''
    if cur:
        out.append((cur, start))
    return out


# ---- 副問い合わせの部品 ----
def pc_by_code(code):
    return "(SELECT id FROM dtb_product_class WHERE product_code = %s)" % qs(code)


def shop_by_name(name):
    return "(SELECT id FROM dtb_base_info WHERE shop_name = %s)" % qs(name)


def stock_by(code, shop=None, loc=None):
    w = ["c.product_code = %s" % qs(code)]
    if shop:
        w.append("s.base_info_id = %s" % shop_by_name(shop))
    if loc:
        w.append("s.stock_location_id = %d" % loc)
    return "(SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE %s)" % ' AND '.join(w)


LOC = {'EC-CUBE': 1, 'ECCUBE': 1, 'スマレジ': 2}


def plan_ids(name=None, prefix=None):
    if name is not None:
        return "(SELECT id FROM dtb_inventory_plan WHERE name = %s)" % qs(name)
    return "(SELECT id FROM dtb_inventory_plan WHERE name LIKE %s)" % qs(prefix + '%')


def like_escape(s):
    return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


# ---------------- 表・列・外部キーの定義(tools/db_schema/。information_schema の SELECT の写し) ----------------
import os
_D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db_schema')
COLS = {}
for _l in open(os.path.join(_D, 'columns.txt'), encoding='utf-8'):
    _a = _l.rstrip('\n').split('|')
    COLS.setdefault(_a[0], {})[_a[1]] = (_a[2], _a[3], _a[4] if len(_a) > 4 else '')
CHILDREN = {}
for _l in open(os.path.join(_D, 'fk.txt'), encoding='utf-8'):
    _a = _l.rstrip('\n').split('|')
    CHILDREN.setdefault(_a[2], []).append((_a[0], _a[1], _a[3], _a[4]))


def del_tree(table, where, skip=(), _seen=None):
    """table の where に合う行を消す。外部キーでぶら下がる子を先に(子の where は親の副問い合わせ)。範囲は where に限る"""
    seen = set(_seen or ()) | {table}
    out = []
    for child, col, pcol, typ in CHILDREN.get(table, []):
        if child in seen or child in skip:
            continue
        sub = "%s IN (SELECT %s FROM %s WHERE %s)" % (col, pcol, table, where)
        out += del_tree(child, sub, skip, seen)
    out.append("DELETE FROM %s WHERE %s;" % (table, where))
    return out


def required_cols(table):
    """NOT NULL で既定値の無い列(INSERTで必ず値が要る)"""
    return [c for c, (ty, nl, d) in COLS[table].items() if nl == 'NO' and not d]


_REASON = re.compile(r'([^。／（）、]*(?:画面(?:で|に|が|は)[^。／]{0,24}(?:無い|ない|できない|行えない|作れない|指定できない|削除できない|変更できない|設定できない|入力できない|出せない)|画面が無く|画面が無い|画面に(?:は)?無い|画面では[^。／]{0,20}(?:できない|無い)|削除する画面が無い|値を画面で指定できない|IDの値を画面で指定できない)[^。／]*?ため)')


def reason_readable(sent):
    """「画面でできない理由」が文から読めるか(tools/db_inventory.py と同じ判定)"""
    if _REASON.search(sent):
        return True
    mr = re.search(r'([^。／（）]{0,40}(?:画面|ため)[^。／]{0,40})', sent)
    return bool(mr and 'ため' in mr.group(1) and '画面' in mr.group(1))


def strip_comments_strings(sql):
    """コメント(-- から行末)と文字列リテラル('…')を除いた本文。呼び名の有無の判定などに使う"""
    out = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if c == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'" and j + 1 < n and sql[j + 1] == "'":
                    j += 2
                    continue
                if sql[j] == "'":
                    break
                j += 1
            out.append("''")
            i = j + 1
        elif sql.startswith('--', i):
            j = sql.find('\n', i)
            i = n if j < 0 else j
        else:
            out.append(c)
            i += 1
    return ''.join(out)


# ---------------- 更新・削除する行の確認(更新・削除の前に、同じ表・同じ条件の行の数を確かめる) ----------------
# 更新・削除の文と同じ表・同じ WHERE で数える確認を、その文の前に置く(0件のまま黙って通らないように)。
# 数は文から決まるものはその数(名前で1行を指す=1、N件と書く=N)、決まらないものは1件以上。
ROW_JP = {'dtb_product_class': '商品規格', 'dtb_product': '商品', 'dtb_product_stock': '在庫', 'dtb_price_history': '価格履歴',
          'dtb_inventory_plan': '棚卸計画', 'dtb_inventory_plan_detail': '棚卸詳細', 'dtb_customer': '会員', 'mtb_sell_group': '購入グループ',
          'mtb_section': '部門', 'mtb_department': '所属', 'dtb_stock_split_join': '在庫分割結合', 'dtb_stock_move_instruction': '在庫移動指示'}
GUARD_STATS = {}   # 確認の数の種類 → 件数
# 削除(DELETE)には置かない: 消したあとに流し直すと消す行が0件になり、「消す行がある」確認は2回目で必ず止まる
# (流し直しても同じ状態になる決まりに反する。tools/db_sql_run.py の2回目の確かめで、価格履歴・状態NMの規格・商品規格を消す22本が止まった)。
# 削除はどれも「あれば消す」(残っている分の後始末・0件にする文・外部キーでぶら下がる行の先消し)として扱う。

# 意図して「あれば更新する」更新(確認を置かない)。(表, WHERE の形, 理由)。tools/db_sql_check.py の照合でも使う
UPDATE_IF_PRESENT = [
    ('dtb_product_class', r"^shelf_number_id IN \(SELECT id FROM dtb_shelf_number WHERE name LIKE '[^']*' AND name NOT IN \('[^']*'(?:, '[^']*')*\)\)$",
     '棚番号の後始末: 文は「名称に…を含むほかの棚番号があれば、あわせて削除する」。消す棚番号を指す商品規格の棚番号を先に空にするだけで、該当が0件でも文のとおり'),
    ('dtb_inventory_plan_detail', r"^id IN \(SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id = \(SELECT id FROM dtb_inventory_plan WHERE name = '[^']*'\) ORDER BY id LIMIT 0\)$",
     '状態・属性が「在庫反映済みの棚卸詳細が0件」と書く棚卸計画。更新するのは0件で、何も変えない(文のとおり)'),
]


def _top_level_where(s):
    """引用符・括弧の外の最初の ' WHERE ' の位置"""
    d, q = 0, False
    for i, c in enumerate(s):
        if c == "'":
            q = not q
        elif not q:
            if c == '(':
                d += 1
            elif c == ')':
                d -= 1
            elif d == 0 and s.startswith(' WHERE ', i):
                return i
    return -1


def parse_update(line):
    """'UPDATE 表 [別名] SET … WHERE 条件;' → (表, 別名, 条件)。読めなければ None"""
    m = re.match(r'^UPDATE (\w+)(?: (\w+))? SET ', line)
    if not m or not line.rstrip().endswith(';'):
        return None
    w = _top_level_where(line)
    return (m.group(1), m.group(2), line[w + 7:].rstrip().rstrip(';') if w >= 0 else None)


def parse_delete(line):
    m = re.match(r'^DELETE FROM (\w+)(?: (\w+))?(?: WHERE (.*))?;$', line.rstrip())
    return (m.group(1), m.group(2), m.group(3)) if m else None


GUARD_RX = re.compile(r"SELECT \(SELECT count\(\*\) FROM (\w+)(?: (\w+))? WHERE (.*?)\) INTO [nc]; IF [nc] (?:IS DISTINCT FROM (\d+)|< (\d+)) THEN")


def guard_keys(line):
    """確認(DO $$ … $$;)が数える (表, 別名, 条件, 数) の一覧。数は ('eq', N) か ('ge', N)"""
    if not line.startswith('DO $$'):
        return []
    return [(m.group(1), m.group(2), m.group(3), ('eq', int(m.group(4))) if m.group(4) is not None else ('ge', int(m.group(5)))) for m in GUARD_RX.finditer(line)]


def if_present_reason(table, where):
    for t, rx, why in UPDATE_IF_PRESENT:
        if t == table and where is not None and re.match(rx, where):
            return why
    return None


_DESC_RX = re.compile(r"(?P<pcl>product_id(?: IN \(| = )(?P<pl>〔商品ID-[^〕]+〕))"
                      r"|(?P<lab>〔[^〕]+〕)"
                      r"|(?:\b[a-z]\.)?product_code = '(?P<code>(?:[^']|'')*)'"
                      r"|shop_name = '(?P<shop>(?:[^']|'')*)'"
                      r"|(?P<main>is_main_shop AND is_public_shop)"
                      r"|stock_location_id = (?P<loc>\d+)"
                      r"|mtb_card_condition WHERE code = '(?P<cond>(?:[^']|'')*)'"
                      r"|(?P<ntab>\w+) WHERE name (?:IN \((?P<nlist>'[^)]*')\)|= '(?P<nm>(?:[^']|'')*)')"
                      r"|\bname (?:IN \((?P<nlist2>'[^)]*')\)|= '(?P<nm2>(?:[^']|'')*)')"
                      r"|email = '(?P<mail>(?:[^']|'')*)'"
                      r"|(?<!_)\bcode = '(?P<sec>(?:[^']|'')*)'"
                      r"|LIMIT (?P<lim>\d+)"
                      r"|^id = (?P<num>\d+)$")


def describe_where(table, where):
    """WHERE の条件から、どの行かを論理名で言う(確認のメッセージに使う)"""
    out = []
    for m in _DESC_RX.finditer(where):
        g = m.groupdict()
        if g['pcl']:
            x = '%sの規格' % g['pl'] if table != 'dtb_product' else g['pl']
        elif g['lab']:
            x = g['lab']
        elif g['code'] is not None:
            x = '商品コード%s' % g['code'].replace("''", "'")
        elif g['shop'] is not None:
            x = '店舗「%s」' % g['shop'].replace("''", "'")
        elif g['main']:
            x = '本店'
        elif g['loc']:
            x = {'1': 'EC-CUBE', '2': 'スマレジ'}.get(g['loc'], '在庫区分%s' % g['loc'])
        elif g['cond'] is not None:
            x = '状態%s' % g['cond']
        elif g['ntab'] or g['nlist2'] or g['nm2'] is not None:
            names = re.findall(r"'((?:[^']|'')*)'", g['nlist'] or g['nlist2'] or '') or [g['nm'] if g['nm'] is not None else g['nm2']]
            x = ('' if (g['ntab'] or table) == table else ROW_JP.get(g['ntab'], '')) + ''.join('「%s」' % n.replace("''", "'") for n in names)
        elif g['mail'] is not None:
            x = 'メールアドレス%s' % g['mail']
        elif g['sec'] is not None:
            x = 'コード%s' % g['sec']
        elif g['lim']:
            x = '番号の小さいほうから%s件' % g['lim']
        elif g['num']:
            x = '番号%s' % g['num']
        else:
            continue
        if x and x not in out:
            out.append(x)
    return '・'.join(out) or '文の条件に合う行'


def _whole_paren(s):
    """s 全体が1組の括弧で囲まれているか"""
    if not (s.startswith('(') and s.endswith(')')):
        return False
    d, q = 0, False
    for i, c in enumerate(s):
        if c == "'":
            q = not q
        elif not q:
            if c == '(':
                d += 1
            elif c == ')':
                d -= 1
                if d == 0 and i != len(s) - 1:
                    return False
    return True


def _top_and(where):
    """括弧・引用符の外の AND で分ける"""
    parts, d, q, cur, i = [], 0, False, '', 0
    while i < len(where):
        c = where[i]
        if c == "'":
            q = not q
        elif not q:
            if c == '(':
                d += 1
            elif c == ')':
                d -= 1
            elif d == 0 and where.startswith(' AND ', i):
                parts.append(cur)
                cur = ''
                i += 5
                continue
        cur += c
        i += 1
    parts.append(cur)
    return parts


def update_expect(table, where):
    """更新する行の数が文から決まるか。決まれば数(1 または N)、決まらなければ None(1件以上)"""
    m = re.match(r'^id = (.+)$', where)
    if m and (re.fullmatch(r'〔[^〕]+〕|\d+', m.group(1)) or _whole_paren(m.group(1))):
        return 1   # 番号・呼び名・1行を返す副問い合わせで指す1行
    m = re.match(r'^id IN \(SELECT id FROM \w+ WHERE .* ORDER BY id LIMIT (\d+)\)$', where)
    if m:
        return int(m.group(1))   # 文の「N件だけ」
    m = re.match(r"^id IN \(SELECT id FROM (\w+) WHERE name IN \(('(?:[^']|'')*'(?:, '(?:[^']|'')*')*)\)\)$", where)
    if m and m.group(1) == table:
        return len(re.findall(r"'((?:[^']|'')*)'", m.group(2)))   # 名前で指す N 行(名前ごとに1件と確かめてある)
    parts = _top_and(where)
    cols = sorted(re.match(r'^(\w+) = ', p).group(1) for p in parts if re.match(r'^(\w+) = ', p))
    if table == 'dtb_product_stock' and len(parts) == 3 and cols == ['base_info_id', 'product_class_id', 'stock_location_id']:
        return 1   # 商品規格・店舗・在庫区分で指す1つの在庫
    if len(parts) == 1 and re.fullmatch(r"(?:product_code|email|code|name) = '(?:[^']|'')*'", where):
        return 1   # 名前・コードで指す1行
    return None


def row_guard(table, where, expect, verb, desc=None):
    """table の where に合う行の数を確かめる。expect: 1 / N / None(1件以上)。verb: 「更新する」「消す」"""
    what = '%s%s（%s）' % (verb, ROW_JP.get(table, '行'), desc or describe_where(table, where))
    cnt = "SELECT count(*) FROM %s WHERE %s" % (table, where)
    kind = '1件以上' if expect is None else ('1件' if expect == 1 else 'N件')
    GUARD_STATS[(verb, kind)] = GUARD_STATS.get((verb, kind), 0) + 1
    if expect is None:
        return assert_ge(cnt, 1, what + 'が1件も無い')
    if expect == 1:
        return assert_one(cnt, what + 'が1件に決まらない')
    return assert_eq(cnt, expect, what + 'が%d件に決まらない' % expect)


def guard_updates(sql):
    """更新の文の前に、同じ表・同じ条件の行の数の確認を入れる(既にあれば入れない。意図して「あれば更新する」ものは入れない)"""
    out = []
    for x in sql:
        p = parse_update(x)
        if p and p[2] is not None and not p[1]:
            t, _a, w = p
            have = any(k[0] == t and k[2] == w and not k[1] for y in out for k in guard_keys(y))
            if not have and not if_present_reason(t, w):
                out.append(row_guard(t, w, update_expect(t, w), '更新する'))
        out.append(x)
    return out
