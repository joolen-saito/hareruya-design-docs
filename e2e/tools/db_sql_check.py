#!/usr/bin/env python3
"""作ったSQL(seed_files/*/*/db.sql と .runs/seed_files_private/*/*/db.sql)の、構文の見かけと、表・列の照合。
SQLをDBに流さない(psqlにも流さない)。確かめること:
  - BEGIN/COMMIT が1組、文末の「;」、括弧・引用符の対応、〔…〕以外の未置換の記号が無い
  - 使った表が information_schema(tools/db_schema/columns.txt)にある
  - INSERT の列、UPDATE の SET の列、別名.列、WHERE などの裸の列が、その文で使った表のどれかにある
  - INSERT は NOT NULL で既定値の無い列をすべて入れている(SELECT で入れるものも列数で確かめる)
  - UPDATE の前に、同じ表・同じ WHERE の行の数を確かめる確認(DO $$ … count(*) …)がある。意図して「あれば更新する」もの
    (tools/db_sql_lib.py の UPDATE_IF_PRESENT。理由つき)は除く
出力: review/db_sql_check_result.tsv(問題の一覧)、標準出力に件数。"""
import os, re, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_sql_lib import COLS, required_cols, LABEL, parse_update, guard_keys, if_present_reason
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KEYWORDS = set('''select from where and or not in is null as on join left right inner outer group by order having limit offset insert into values update set delete
case when then else end exists like escape between true false now interval timestamptz timestamp date lpad md5 coalesce greatest least max min count sum substring
generate_series asc desc distinct union all using conflict do nothing excluded returning begin commit do raise exception if lower upper trim regexp_replace
setval nextval pg_get_serial_sequence text int integer numeric bigint boolean varchar char to_char cast g format length concat row_number over partition for'''.split())


def strip_literals(sql):
    """文字列リテラル・コメントを消す"""
    out = []
    i = 0
    n = len(sql)
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


def statements(sql):
    """DO $$ ... $$; を1文として、; で分ける"""
    sql = re.sub(r'DO \$\$.*?\$\$;', lambda m: 'DO_BLOCK;', sql, flags=re.S)
    return [s.strip() for s in strip_literals(sql).split(';') if s.strip()]


def top_level_split(txt):
    out, depth, cur = [], 0, ''
    for ch in txt:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            out.append(cur)
            cur = ''
        else:
            cur += ch
    out.append(cur)
    return out


def insert_arity(low, cols):
    """INSERT ... VALUES (...) / INSERT ... SELECT ... FROM の列数が、列の指定と合うか"""
    mv = re.search(r'(?is)\)\s*VALUES\s*\((.*)\)\s*(?:ON\s+CONFLICT.*)?$', low)
    if mv:
        return len(top_level_split(mv.group(1))) == len(cols)
    ms = re.search(r'(?is)\)\s*SELECT\s+', low)
    if ms:
        rest = low[ms.end():]
        depth = 0
        end = len(rest)
        for i, ch in enumerate(rest):
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
            elif depth == 0 and re.match(r'(?is)\s(?:FROM|WHERE)\s', rest[i:i + 7]):
                end = i
                break
        return len(top_level_split(rest[:end])) == len(cols)
    return True


ALLOWED_SEEN = []   # 確認を置かない許可の一覧に当たった UPDATE (ファイル, 理由)


def update_guard_problems(path, raw):
    """UPDATE ごとに、それより前に同じ表・同じ WHERE の確認があるか(許可の一覧に当たるものは除く)"""
    out = []
    keys = set()
    for ln, line in enumerate(raw.split('\n'), 1):
        for t, a, w, _n in guard_keys(line):
            if not a:
                keys.add((t, w))
        if not line.startswith('UPDATE '):
            continue
        p = parse_update(line)
        if not p or p[2] is None:
            out.append('UPDATEを読めない（%d行目）' % ln)
            continue
        t, a, w = p
        if a:
            out.append('UPDATEに別名がある（%d行目。確認と照らせない）' % ln)
            continue
        if (t, w) in keys:
            continue
        why = if_present_reason(t, w)
        if why:
            ALLOWED_SEEN.append((os.path.relpath(path, R), ln, why))
            continue
        out.append('UPDATEの前に同じ表・同じ条件の行の数の確認が無い（%d行目）' % ln)
    return out


def check_file(path):
    problems = []
    raw = open(path, encoding='utf-8').read()
    problems += update_guard_problems(path, raw)
    body = LABEL.sub('0', raw)
    code = strip_literals(re.sub(r'DO \$\$.*?\$\$;', 'DO_BLOCK;', body, flags=re.S))
    if len(re.findall(r'(?m)^BEGIN;', body)) != 1 or len(re.findall(r'(?m)^COMMIT;', body)) != 1:
        problems.append('BEGIN/COMMITが1組でない')
    if code.count('(') != code.count(')'):
        problems.append('括弧の数が合わない')
    if body.count("'") % 2 and "''" not in body:
        problems.append('引用符の数が合わない')
    # DOブロック内の SQL も表を照合するため、元の本文から表を拾う
    all_text = strip_literals(body)
    tables_used = set(re.findall(r'(?i)\b(?:FROM|JOIN|INTO|UPDATE)\s+((?:dtb|mtb|plg)_[a-z0-9_]+|doctrine_[a-z_]+|login_[a-z_]+)', all_text))
    for t in tables_used:
        if t not in COLS:
            problems.append('表が無い: ' + t)
    for st in statements(body):
        low = st
        stm = re.match(r'(?is)^(INSERT\s+INTO|UPDATE|DELETE\s+FROM|BEGIN|COMMIT|DO_BLOCK|SELECT|CREATE\s+TEMP\s+TABLE|DROP\s+TABLE\s+IF\s+EXISTS\s+zz_)', low)
        if not stm:
            problems.append('文の先頭を読めない: ' + low[:50])
            continue
        kind = stm.group(1).split()[0].upper()
        tabs = re.findall(r'(?i)\b(?:FROM|JOIN|INTO|UPDATE)\s+((?:dtb|mtb|plg)_[a-z0-9_]+)(?:\s+(?:AS\s+)?([a-z][a-z0-9_]*))?', low)
        alias = {}
        tset = []
        for t, a in tabs:
            if t in COLS:
                tset.append(t)
                alias[t] = t
                if a and a.lower() not in KEYWORDS and a.lower() not in ('set', 'where', 'values', 'select'):
                    alias[a] = t
        # 別名.列
        for a, c in re.findall(r'\b([a-z][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b', low):
            if a in alias and c not in COLS[alias[a]]:
                problems.append('列が無い: %s.%s' % (alias[a], c))
        # INSERT 列
        if kind == 'INSERT':
            mi = re.match(r'(?is)^INSERT\s+INTO\s+([a-z0-9_]+)\s*\(([^)]*)\)', low)
            if mi and mi.group(1) in COLS:
                cols = [x.strip() for x in mi.group(2).split(',')]
                for c in cols:
                    if c not in COLS[mi.group(1)]:
                        problems.append('列が無い: %s.%s' % (mi.group(1), c))
                if not insert_arity(low, cols):
                    problems.append('INSERTの列の数と値の数が合わない: %s' % mi.group(1))
                for rc in required_cols(mi.group(1)):
                    if rc not in cols:
                        problems.append('NOT NULLで既定値の無い列を入れていない: %s.%s' % (mi.group(1), rc))
        # UPDATE SET 列
        if kind == 'UPDATE':
            mu = re.match(r'(?is)^UPDATE\s+([a-z0-9_]+)(?:\s+(?:AS\s+)?[a-z][a-z0-9_]*)?\s+SET\s+(.*?)(?:\s+(?:WHERE|FROM)\s|$)', low)
            if mu and mu.group(1) in COLS:
                for c in re.findall(r'(?:^|,)\s*([a-z_][a-z0-9_]*)\s*=', mu.group(2)):
                    if c not in COLS[mu.group(1)]:
                        problems.append('列が無い: %s.%s' % (mu.group(1), c))
        # 裸の列(WHERE/ON/SELECT の中の英小文字語)
        cols_all = set()
        for t in tset:
            cols_all |= set(COLS[t])
        no_str = re.sub(r'\b[a-z][a-z0-9_]*\.[a-z_][a-z0-9_]*\b', ' ', low)
        no_str = re.sub(r'(?i)\b(?:dtb|mtb|plg)_[a-z0-9_]+\b', ' ', no_str)
        for w in set(re.findall(r'\b[a-z_][a-z0-9_]*\b', no_str)):
            if w in KEYWORDS or w in cols_all or w in alias or w in ('seed', 'bk', 'temp', 'drop', 'commit') or w.startswith('zz_') or w.isdigit():
                continue
            if re.fullmatch(r'[a-z]', w):
                continue
            # 大文字小文字を無視するキーワード
            if w.upper() in {k.upper() for k in KEYWORDS}:
                continue
            problems.append('未知の語(列名の可能性): %s' % w)
    return problems


def main():
    files = sorted(glob.glob(os.path.join(R, 'seed_files', '*', 'S-*', 'db*.sql')) + glob.glob(os.path.join(R, '.runs', 'seed_files_private', '*', 'S-*', 'db*.sql')))
    rows = []
    bad = 0
    for f in files:
        pr = sorted(set(check_file(f)))
        if pr:
            bad += 1
            for p in pr:
                rows.append([os.path.relpath(f, R), p])
    with open(os.path.join(R, 'review', 'db_sql_check_result.tsv'), 'w', encoding='utf-8') as fh:
        fh.write('ファイル\t問題\n' + '\n'.join('\t'.join(r) for r in rows) + '\n')
    print('db.sql %d本／問題のある本 %d／問題の件数 %d' % (len(files), bad, len(rows)))
    nupd = sum(1 for f in files for l in open(f, encoding='utf-8').read().split('\n') if l.startswith('UPDATE '))
    print('UPDATE %d 文／前に同じ表・同じ条件の確認があるもの %d／許可の一覧（あれば更新する）に当たるもの %d' % (nupd, nupd - len(ALLOWED_SEEN) - sum(1 for r in rows if r[1].startswith('UPDATE')), len(ALLOWED_SEEN)))
    for f_, ln, why in ALLOWED_SEEN:
        print('  許可: %s %d行目: %s' % (f_, ln, why))
    c = collections.Counter(re.sub(r':.*', '', r[1]) for r in rows)
    for k, v in c.most_common(10):
        print(v, k)
    return rows


# ---------------- 値の照合: WHERE で引く名前・コード・ファイル名が、シード表の文か手順書の「画面で入れる値」にある完全な語か ----------------
import csv as _csv, json as _json
_csv.field_size_limit(10 ** 9)
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
LIT_COLS = ('product_code', 'shop_name', 'file_name', 'name', 'name_en', 'login_id', 'email', 'code', 'smaregi_product_id', 'smaregi_product_code', 'high_price_code')
PARTICLE = set('とのをはがにでもへや')
JP = re.compile(r'[ぁ-んァ-ヶー一-龥々]')
ASCII_TOKEN = re.compile(r'[A-Za-z0-9_\-]')
_seed_text_cache = {}


def seed_texts(fid):
    if fid not in _seed_text_cache:
        d = {}
        p = os.path.join(CASES, '%s_seed_data.tsv' % fid)
        if os.path.exists(p):
            for r in list(_csv.reader(open(p, encoding='utf-8'), delimiter='\t'))[1:]:
                d.setdefault(r[0], r[3] + '\n' + r[5])
        _seed_text_cache[fid] = d
    return _seed_text_cache[fid]


def all_fids():
    return sorted(f[:-len('_seed_data.tsv')] for f in os.listdir(CASES) if f.endswith('_seed_data.tsv'))


def _occ_ok(lit, text, i):
    """text の i にある lit が、前後で切れた完全な語か(語の断片でないか)"""
    a = text[i - 1] if i > 0 else ''
    b = text[i + len(lit)] if i + len(lit) < len(text) else ''
    if all(ord(c) < 128 for c in lit):
        if a and ASCII_TOKEN.match(a):
            return False
        if b and (ASCII_TOKEN.match(b) or (b == '.' and i + len(lit) + 1 < len(text) and ASCII_TOKEN.match(text[i + len(lit) + 1]))):
            return False
        return True
    # 日本語を含む: 前後が語の続き(助詞以外のかな・漢字)でない
    if a and JP.match(a) and a not in PARTICLE:
        return False
    if b and JP.match(b) and b not in PARTICLE and not lit.endswith(('店', '者', 'リー')):
        return False
    return True


def lit_fragment(lit):
    """値そのものが語の断片の形(助詞で始まる・「N件とも」を含む・助詞で終わる)"""
    if not lit:
        return '空'
    if lit[0] in PARTICLE or lit[0] in '、・':
        return '助詞・区切りで始まる'
    if re.search(r'件とも|とも[^\s]', lit) or re.search(r'(?:ファイル名|履歴に|画面の)', lit):
        return '文の断片を含む'
    if JP.search(lit) and lit[-1] in PARTICLE - {'も'} and len(lit) > 1:
        return '助詞で終わる'
    return ''


def token_in(lit, text, quoted_only=False):
    if quoted_only:
        return ('「%s」' % lit) in text
    i = text.find(lit)
    while i >= 0:
        if _occ_ok(lit, text, i):
            return True
        i = text.find(lit, i + 1)
    return False


def _strip_assign(st):
    """UPDATE の SET 〜 WHERE、INSERT の VALUES/SELECT の値の並びを外す(WHERE で使う値だけを残す)"""
    s = st
    m = re.match(r'(?is)^UPDATE\s+\w+\s+SET\s', s)
    if m:
        depth, q, i = 0, False, m.end()
        while i < len(s):
            c = s[i]
            if c == "'":
                q = not q
            elif not q:
                if c == '(':
                    depth += 1
                elif c == ')':
                    depth -= 1
                elif depth == 0 and s[i:i + 7].upper() == ' WHERE ':
                    break
            i += 1
        s = s[:m.start()] + s[i:]
    m = re.match(r'(?is)^INSERT\s+INTO\s+\w+\s*\([^)]*\)\s*(VALUES\s*\(.*?\)\s*(?:ON\s+CONFLICT.*)?$|SELECT\s.*?\sFROM\s)', s)
    if m:
        if m.group(1).upper().startswith('VALUES'):
            return ''
        s = s[m.end():]
    return s


def sql_literals(raw):
    """SQLファイルの本文(コメント・RAISE のメッセージを除く)から、WHERE で使う名前・コード・ファイル名の値 [(列, 種類, 値)]"""
    body = '\n'.join(l for l in raw.split('\n') if not l.lstrip().startswith('--'))
    body = re.sub(r"RAISE EXCEPTION '(?:[^']|'')*'", 'RAISE EXCEPTION', body)
    out = []
    for st in re.split(r';\s*\n', body):
        s = _strip_assign(st.strip())
        for col, op, v in re.findall(r"\b(?:[a-z]\.)?(%s)\s*(=|<>|LIKE|~)\s*'((?:[^']|'')*)'" % '|'.join(LIT_COLS), s):
            out.append((col, op, v.replace("''", "'")))
        for col, lst in re.findall(r"\b(?:[a-z]\.)?(%s)\s+(?:NOT\s+)?IN\s*\(((?:\s*'(?:[^']|'')*'\s*,?)+)\)" % '|'.join(LIT_COLS), s):
            for v in re.findall(r"'((?:[^']|'')*)'", lst):
                out.append((col, '=', v.replace("''", "'")))
        for col, lst in re.findall(r"\b(?:[a-z]\.)?(%s)\s*=\s*ANY\(ARRAY\[([^\]]*)\]\)" % '|'.join(LIT_COLS), s):
            for v in re.findall(r"'((?:[^']|'')*)'", lst):
                out.append((col, '=', v.replace("''", "'")))
    return out


def _regex_ok(pat, text):
    try:
        rx = re.compile(pat.replace('\\\\', '\\'))
    except re.error:
        return False
    toks = re.findall(r'[A-Za-z0-9_\-\.]+', text) + re.findall(r'「([^」]+)」', text)
    return any(rx.fullmatch(t) or rx.search(t) and pat.startswith('^') and pat.endswith('$') and rx.fullmatch(t) for t in toks)


def literal_check():
    """全SQLの WHERE の値を照合する。出力 review/db_sql_literal_check.tsv"""
    md = {}
    p = os.path.join(R, 'review', 'db_sql_md.json')
    if os.path.exists(p):
        md = _json.load(open(p, encoding='utf-8'))
    files = sorted(glob.glob(os.path.join(R, 'seed_files', '*', 'S-*', 'db*.sql')) + glob.glob(os.path.join(R, '.runs', 'seed_files_private', '*', 'S-*', 'db*.sql')))
    rows = []
    fids = all_fids()
    for f in files:
        fid = os.path.basename(os.path.dirname(os.path.dirname(f)))
        sid = os.path.basename(os.path.dirname(f))
        own = seed_texts(fid).get(sid, '')
        enter = '\n'.join(v for st in (md.get(sid, {}).get('steps') or []) for v in (st.get('enter') or []))
        seen = set()
        raw = open(f, encoding='utf-8').read()
        ins = ' '.join(x for x in re.split(r';\s*\n', '\n'.join(l for l in raw.split('\n') if not l.lstrip().startswith('--'))) if re.match(r'(?is)^\s*INSERT\s', x))
        for col, op, v in sql_literals(raw):
            if (col, op, v) in seen:
                continue
            seen.add((col, op, v))
            frag = lit_fragment(v) if op in ('=', '<>') else ''
            where = ''
            if op in ('=', '<>'):
                quoted = col in ('product_code', 'file_name') and not re.search(r'\d', v) and all(ord(c) < 128 for c in v)
                if frag:
                    where = ''
                elif token_in(v, own, quoted):
                    where = 'このシードの文'
                elif enter and token_in(v, enter, False):
                    where = '手順書の画面で入れる値'
                elif ("'%s'" % v.replace("'", "''")) in ins:
                    where = 'このSQLが自分で入れる値（同じファイルのINSERT。前回の分を消してから入れ直す）'
                else:
                    for g in (fids if col in ('shop_name', 'name', 'name_en', 'login_id', 'email', 'code') else [fid]):
                        hit = [s for s, t in seed_texts(g).items() if s != sid and token_in(v, t, quoted)]
                        if hit:
                            where = ('同じ機能のシードの文（%s）' if g == fid else '別の機能のシードの文（%s）') % '・'.join(hit[:3])
                            break
            elif op == 'LIKE':
                core = v.strip('%').replace('\\_', '_').replace('\\%', '%').replace('\\\\', '\\')
                where = 'このシードの文' if core and core in own else ''
            elif op == '~':
                where = 'このシードの文' if _regex_ok(v, own) else ''
            rows.append([os.path.relpath(f, R), col, op, v, 'OK' if where else 'NG', where or ('語の断片: ' + frag if frag else 'シード表の文にも手順書の画面で入れる値にも、完全な語として無い')])
    with open(os.path.join(R, 'review', 'db_sql_literal_check.tsv'), 'w', encoding='utf-8') as fh:
        fh.write('ファイル\t列\t比較\t値\t判定\t出どころ・理由\n' + '\n'.join('\t'.join(x.replace('\t', ' ').replace('\n', '↵') for x in r) for r in rows) + '\n')
    ng = [r for r in rows if r[4] == 'NG']
    print('WHERE の値 %d 件（ファイル %d 本）／完全な語として出どころがあるもの %d／無いもの %d' % (len(rows), len({r[0] for r in rows}), len(rows) - len(ng), len(ng)))
    for r in ng[:40]:
        print('  NG', r[0], r[1], r[2], repr(r[3]), r[5])
    return rows


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'literals':
        literal_check()
        sys.exit(0)
    rows = main()
    for r in rows[:int(sys.argv[1]) if len(sys.argv) > 1 else 15]:
        print(r)
