#!/usr/bin/env python3
"""CSVで取り込むシード(review/csv_seed_classes.tsv)のCSVファイルを、シード表の文から作る。DB・アプリには触らない。
出力: seed_files/<機能ID>/<シードID>.<n>.<拡張子>、seed_files/<機能ID>/_csv_index.tsv、review/csv_make_result.tsv
作り方(根拠の強い順):
  fixture  e2e/fixtures に正本から検証済みで置いてあるファイルをそのまま写す
  text     シード表の文にある「見出し「…」・データ「…」」「見出し行「…」に続けて…の行」「0バイト」の形から組む(UTF-8・LF・末尾改行1個)
  (どれにも当たらないものは result に理由つきで残す)
番号の列(画面が振る番号)は、文の呼び名〔…〕をそのまま入れる。値は作らない。"""
import csv, os, re, shutil, sys, collections
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
FILE = re.compile(r'([A-Za-z0-9_][A-Za-z0-9_\-.]*\.(?:csv|tsv|txt|xls))')
seeds = {}
cls = [l.rstrip('\n').split('\t') for l in open(os.path.join(R, 'review', 'csv_seed_classes.tsv'), encoding='utf-8')][1:]
for fid in sorted({c[0] for c in cls}):
    for r in list(csv.reader(open(os.path.join(CASES, f'{fid}_seed_data.tsv'), encoding='utf-8'), delimiter='\t'))[1:]:
        seeds[r[0]] = r
fx = collections.defaultdict(dict)  # seed -> name -> path
for l in list(open(os.path.join(R, 'fixtures', 'named-file-references.tsv'), encoding='utf-8'))[1:]:
    c = l.rstrip('\n').split('\t')
    if len(c) > 9 and c[7] != '未配置':
        for sid in re.split(r'[、,]', c[9]):
            fx[sid.strip()][c[1]] = os.path.join(R, 'fixtures', c[7])

# 列名の辞書。アプリの取込CSVの見出し定義(ec-cube-enterprise の Csv コントローラ)と、設計書にある列。長い名前を先に当てる
APP_HEAD = {
  'M03-28': ['商品ID', '商品タグ(ID)'], 'M03-29': ['商品ID', '売上分析タグ(ID)'],
  'M03-30': ['商品ID', '言語ID', '基準価格', '買取価格', '原価単価'], 'M03-31': ['商品ID', '言語ID', '販売価格', '買取価格', 'セールフラグ', '帯URL', 'タグ(ID)'],
  'M03-32': ['商品コード', '基準価格'], 'M03-33': ['商品コード', '販売価格', 'セールフラグ', '帯URL', 'タグ(ID)', '買取価格', '部門ID'],  # 辞書。M03-33 の買取価格・部門IDは設計書の7列の名前
  'M03-35': ['商品コード', '部門コード(ID)'], 'M03-38': ['商品ID', '商品公開ステータス', '支店の商品公開ステータス'], 'M03-40': ['商品コード', '棚番号名称'],
}
def fixture_head(fid):
    d = os.path.join(R, 'fixtures', fid.lower()); c = collections.Counter()
    if os.path.isdir(d):
        for f in os.listdir(d):
            if f.endswith(('.csv', '.tsv')):
                b = open(os.path.join(d, f), 'rb').read()
                if b: c[b.split(b'\n')[0].decode('utf-8', 'replace')] += 1
    return c.most_common(1)[0][0] if c else None
# 作り方のコード(e2e/seeds)が使う見出し。fixtures より優先する
CODE_HEAD = {
  'M03-16': 'ID,名称,並び順', 'M03-20': 'ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ', 'M03-21': 'ID,名称,並び順',
  'M03-29': '商品ID,売上分析タグ(ID)', 'M03-30': '商品ID,言語ID,基準価格,買取価格,原価単価', 'M03-31': '商品ID,言語ID,販売価格,買取価格,セールフラグ,帯URL,タグ(ID)',
  'M03-32': '商品コード,基準価格', 'M03-40': '商品コード,棚番号名称', 'M04-24': '移動指示ID,送り状No.', 'M03-37': '商品ID,略称タグ', 'M03-35': '商品コード,部門コード(ID)',
  'M03-33': '商品コード,販売価格,セールフラグ,帯URL,タグ(ID)',  # 画面の雛形の見出し(5列)。正本の「7列」と違うが、作り方のコードは雛形の見出しの下に7つの値をそのまま入れる
  'M03-38': '商品ID,商品公開ステータス,支店の商品公開ステータス', 'M03-28': '商品ID,商品タグ(ID)',
}
def head_of(fid, ext):
    h = CODE_HEAD.get(fid) or csv_rules.CODE_HEADS.get(fid) or fixture_head(fid)
    if h: return h.split('\t' if '\t' in h else ',')
    return APP_HEAD.get(fid)
COLNAMES = sorted({n for v in APP_HEAD.values() for n in v} | {'ID', '名称', '並び順'}, key=lambda x: -len(x))
def csvcell(v): return '"' + v.replace('"', '""') + '"' if re.search(r'[",\n]', v) else v
def row_from_literal(txt):
    # "2,3" の引用セルを保ったままカンマで分ける
    out = []; cur = ''; q = False
    for ch in txt:
        if ch == '"': q = not q; cur += ch
        elif ch == ',' and not q: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return out
def build(head, rows, tsv):
    j = '\t' if tsv else ','
    def cells(r): return [c.strip('"') if tsv else c for c in r]
    return ('\n'.join(j.join(cells(r)) for r in [head] + rows) + '\n').encode('utf-8')

ENC = re.compile(r'Shift_JIS|SJIS|シフトJIS|BOM|CRLF|CR改行|UTF-?16|UTF－16|バイト|文字化け|不可視|ゼロ幅')
def enc_guard(clause, name):
    if re.search(r'(?<![0-9])0バイト', clause): return None
    m = ENC.search(clause)
    return f'文字コード・改行・サイズの指定（{m.group(0)}）があり、文だけでは組まない' if m else None

def parse_more(fid, clause, name):
    """見出しが文に無い形。戻り値 (bytes|None, 理由)"""
    tsv = name.endswith('.tsv')
    i = clause.find(name); rest = clause[i + len(name):] if i >= 0 else clause
    # (a) 1行目が見出し「H」、2行目が「R」…
    m = re.search(r'1行目が見出し「([^」]+)」、(?:2行目が「([^」]+)」)', clause)
    if m: return build(m.group(1).split(','), [row_from_literal(m.group(2))], tsv), ''
    # (b) 見出し=H、データ=R1およびR2
    m = re.search(r'見出し=([^、]+)、データ=(.+)$', rest)
    if m:
        rows = [row_from_literal(x) for x in re.split(r'および|と', m.group(2)) if x]
        return build(m.group(1).split(','), rows, tsv), ''
    h = head_of(fid, name)
    LIT = re.compile(r'^[\x21-\x7e]*$')
    def lit_cell(c):
        c = c.strip()
        return '' if c == '空' else c
    def plain(c):  # 値として置ける文字だけ(説明文を値にしない)。呼び名〔…〕は可
        return LIT.match(re.sub(r'〔[^〕]*〕', 'L', c)) is not None
    # (c) =データ「a,b」「c,d」 / =「a,b」「c,d」(見出しは機能のCSVの見出し)
    m = re.match(r'\s*=\s*((?:データ)?「[^」]*」(?:「[^」]*」)*)\s*$', rest)
    if m and h: return build(h, [row_from_literal(x) for x in re.findall(r'「([^」]*)」', m.group(1))], tsv), ''
    # (d) =リテラル行(区切りは , または ・)。複数行は「と」「および」。空は空欄
    m = re.match(r'\s*=\s*(.+)$', rest)
    if m and h:
        chunks = [x.strip() for x in re.split(r'と(?=〔)|および', m.group(1)) if x.strip()]
        rows = []
        for ch in chunks:
            if not plain(ch.replace('"', '').replace('・', ',')): rows = None; break
            cells = row_from_literal(ch) if ',' in ch else ch.split('・')
            rows.append([lit_cell(c) for c in cells])
        if rows and (fid == 'M03-33' or all(len(r) == len(h) for r in rows)): return build(h, rows, tsv), ''
        if rows: return None, f'行の列数が見出し({len(h)}列)と合わない'
    # (h) 1行目「…」、2行目「…」(見出しは機能のCSVの見出し)
    if h:
        ms = re.findall(r'\d行目「([^」]*)」', rest)
        if len(ms) >= 2 and ms[0].replace('・', ',').split(',') == h: return build(h, [row_from_literal(x.replace('・', ',') if ',' not in x else x) for x in ms[1:]], tsv), ''
    # (i) 見出し「A・B・C」・A「値」・B空・C数値(1行)
    m = re.search(r'見出し「([^」]+)」・(.+)$', rest)
    if m:
        cols = re.split(r'[,・]', m.group(1)); after = m.group(2); vals = []
        for c in cols:
            mm = re.search(re.escape(c) + r'(?:「([^」]*)」|(空)|[=＝]?([0-9A-Za-z_\-]+))', after)
            if not mm: vals = None; break
            vals.append(mm.group(1) if mm.group(1) is not None else ('' if mm.group(2) else mm.group(3)))
        if vals: return build(cols, [vals], tsv), ''
    if '見出し' in rest: return None, '見出しはあるが値の書き方が表にない'
    # (e) 列名=値・列名値… の並び(1行)。見出しは文に出てくる列名の順。呼び名〔…〕の中の語は列名と取り違えない
    if re.match(r'\s*(は|=)', rest):
        body = re.sub(r'^\s*(は|=)\s*', '', rest)
        labels = re.findall(r'〔[^〕]*〕', body)
        body2 = re.sub(r'〔[^〕]*〕', '\u0001', body)
        pat = '|'.join(re.escape(n) for n in COLNAMES)
        parts = re.split(f'(?:^|[・、,])\\s*({pat})\\s*[=＝]?\\s*', body2)
        if len(parts) >= 3:
            names = parts[1::2]; vals = [re.sub(r'[・、,]\s*$', '', v).strip() for v in parts[2::2]]
            it = iter(labels); vals = [re.sub('\u0001', lambda _: next(it), v) for v in vals]
            vals = ['' if v == '空' else v.strip('「」') for v in vals]
            if all(not re.search(r'[\u3040-\u30ff]', re.sub(r'〔[^〕]*〕', '', v)) for v in vals): return build(names, [vals], tsv), ''
    return None, '文の形が表にない(列名の並び・リテラル行・見出し/データのどれでもない)'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csv_rules
import csv_curated
# 照合専用の静的な控え(.runs/harvest)。作り方のコードを動かして取り出した旧い出力で、ファイルの出どころには使わない。
# 文から組んだ中身との一致を数えるためだけに読む（準備用CSVは読まない）
SNAPSHOT = os.path.join(R, '.runs', 'harvest')
def oracle_snapshot(fid, sid):
    d = os.path.join(SNAPSHOT, fid, sid); files = {}
    if not os.path.isdir(d): return files, []
    for f in sorted(os.listdir(d)):
        if not f.startswith('_'): files[f] = open(os.path.join(d, f), 'rb').read()
    return files, []
def clauses(text):
    return [x for x in re.split(r'[／。]', text) if x.strip()]

def from_text(clause, name):
    """clause: 1文。name: ファイル名。戻り値 (bytes|None, 理由)"""
    if re.search(r'0バイト', clause): return b'', ''
    m = re.search(r'見出し行?「([^」]+)」', clause)
    if not m: return None, '文に見出しの記述が無い'
    head = m.group(1)
    if ',' not in head and '・' in head: head = head.replace('・', ',')
    rows = [r.replace('・', ',') if ',' not in r else r for r in re.findall(r'データ「([^」]*)」', clause)]
    tail = clause.split('データ', 1)[1] if 'データ' in clause else ''
    if tail and re.match(r'^「[^」]*」・', tail.strip()): rows = []
    if not rows and tail and not re.search(r'[（）、]|^\d|行', tail) and not re.fullmatch(r'(「[^」]*」)+', tail.strip()):
        cells = [c.strip().strip('「」') for c in tail.strip().split('・')]
        if cells and all(cells): rows = [','.join(cells)]
    if not rows:
        m2 = re.search(r'に続けて(.+?)の(\d+)行', clause)
        if m2:
            g = m2.group(1)
            codes = [x for x in (re.split(r'・', g) if ',' in g else re.split(r'[・、,]', g)) if x]
            if len(codes) != int(m2.group(2)): return None, '続けて書かれた行数と行の数が合わない'
            if not all(re.fullmatch(r'[A-Za-z0-9_\-,]+', x) for x in codes): return None, '続けて書かれた行が値ではなく説明文'
            rows = codes
        elif re.search(r'見出し(行)?のみ|見出し行だけ|データ行(は)?0', clause): rows = []
        else: return None, '見出しはあるがデータ行の記述の形が表にない'
    if name.endswith('.tsv'):
        head = head.replace(',', '\t'); rows = [r.replace(',', '\t') for r in rows]
    return ('\n'.join([head] + rows) + '\n').encode('utf-8'), ''


# ---- グッズ商品CSV登録で使う「準備のCSV」(投入方法の文から) ----
GOODS_HEAD = ['商品ID', '商品コード', '言語(ID)', '商品公開ステータス', '支店の商品公開ステータス', '商品名(日)', '商品名(英)', 'サイズ', '重量', '商品説明(日)', '商品説明(英)',
  '買取商品説明(日)', '買取商品説明(英)', '検索ワード', '規格画像', '商品カテゴリ(ID)', '購入グループ名称', '略称タグ(ID)', '売上分析タグ(ID)', 'タグ(ID)', '発送日目安(ID)',
  'カードセット(ID)', '販売制限数', '基準価格', '販売価格', '買取価格', '原価単価', '地域別販売制限', 'スマレジ連携フラグ', 'スマレジ商品コード', '部門ID', 'フリーエリア']  # アプリの GoodsCsvController の見出し定義の順
# 公開を表す値は、アプリの見出し定義の説明(商品公開ステータス「1:公開 2:非公開 3:廃止」・支店の商品公開ステータス「0:非公開 1:公開」)から
STATUS_NOTE = csv_rules.STATUS_NOTE
APP_STATUS = {'商品公開ステータス': {'公開': '1', '非公開': '2', '廃止': '3'}, '支店の商品公開ステータス': {'公開': '1', '非公開': '0'}}  # アプリの見出し定義の説明
PUBLISHED = {'商品公開ステータス': '1', '支店の商品公開ステータス': '1'}
GNAMES = sorted(GOODS_HEAD, key=lambda x: -len(x))
def read_env():
    """環境の値をDBから読む(SELECTだけ。読み取り専用トランザクション。資格情報はコンテナの環境変数)"""
    import subprocess
    def q(sql):
        cmd = ['docker', 'exec', '-i', os.environ.get('E2E_DB_CONTAINER', 'ec-cube-enterprise-postgres_primary-1'), 'sh', '-c',
               'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -q -At -U "$POSTGRES_USER" -d "${POSTGRES_DB:-eccubedb}" -v ON_ERROR_STOP=1']
        out = subprocess.run(cmd, input=f'begin transaction read only;\n{sql};\nrollback;\n', capture_output=True, text=True, timeout=60)
        if out.returncode: raise RuntimeError(out.stderr.strip().splitlines()[-1][:200] if out.stderr else 'psql failed')
        return [l for l in out.stdout.split('\n') if l and l not in ('BEGIN', 'ROLLBACK')]
    try:
        lang = q("select id from mtb_language where name_jp='日本語'")
        cat = q("select id from dtb_category where category_name='サプライ・グッズ' and parent_category_id is null and hierarchy=1")
        sell = q("select name from mtb_sell_group where deleted_at is null order by id limit 1")
        nonres = q("select name from mtb_sell_group where deleted_at is null and reservation_flg = 0 order by id limit 1")
        child = q("select id from dtb_category where parent_category_id = (select id from dtb_category where category_name='サプライ・グッズ' and parent_category_id is null and hierarchy=1) order by sort_no desc, id limit 1")
        en = q("select id from mtb_language where name_jp='英語'")
        other = q("select id from mtb_language where name_jp not in ('日本語','英語') order by id limit 1")
        sec = q("select id from mtb_section where visible order by id limit 1")
        if len(lang) != 1 or len(cat) != 1 or len(sell) != 1 or len(child) != 1: return None, f'環境の値を一意に読めない(言語{len(lang)}・カテゴリ{len(cat)}・購入グループ{len(sell)})'
        return {'LANG': lang[0], 'CAT': cat[0], 'SELL': sell[0], 'CHILD': child[0], 'NONRES': nonres[0] if nonres else None, 'LANG_EN': en[0] if en else None, 'LANG_OTHER': other[0] if other else None, 'SECTION': sec[0] if sec else None}, ''
    except Exception as e:
        return None, f'DBを読めない: {e}'
ENV, ENV_ERR = (None, 'skip') if os.environ.get('CSV_MAKE_NO_DB') else read_env()

cur_sid = ['']
def _app_required():
    t = open('/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php', encoding='utf-8').read()
    m = re.search(r'function getCsvHeader\(\)[^{]*\{\s*return \[(.*?)\n        \];', t, re.S)
    return [x[0] for x in re.findall(r"^            '([^']+)' => \[\s*'id' => '[^']*',\s*'description' => '[^']*',\s*'required' => (true)", m.group(1), re.M) if False] or \
           [x for x, req in re.findall(r"^            '([^']+)' => \[\s*'id' => '[^']*',\s*'description' => '[^']*',\s*'required' => (true|false)", m.group(1), re.M) if req == 'true']
REQUIRED = _app_required()
# 値を文が決めていない列の既定値: (a) e2e/pages/admin/m03_01_goods_register.ts registerGoodsCsv の common(サイズ1・重量1・基準価格100・販売価格100・買取価格10・原価単価10)
CODE_DEFAULT = {'サイズ': '1', '重量': '1', '基準価格': '100', '販売価格': '100', '買取価格': '10', '原価単価': '10'}
DESCRIPTIVE = re.compile(r'任意|有効な値|既存|登録済み|を表す|を示す|のID|共有シード|重複しない|とし$|ほかの|そのほか|以上|以下')

def parse_row(sentence, force_req=False):
    """1つのグッズ商品CSV登録の文から、列→値を取り出す。戻り値 (dict|None, notes[], 理由)。文が決めていない値を担当が決めたときは notes に理由を書く"""
    i = sentence.find('商品ID')
    if i < 0: return None, [], '商品ID の列の記述が無い'
    spec = re.split(r'の1行を|を入れた1行|1行のCSV|CSVファイルを選択|1行を持つ|を持つCSV', sentence[i:])[0]
    pat = '|'.join(map(re.escape, GNAMES))
    parts = re.split(r'(?:^|[・、,，（(と／で\s=＝:：])\s*(' + pat + r')\s*(?:は|を|に|が|=|＝)?\s*', spec)
    names = parts[1::2]; raws = parts[2::2]
    vals = {}; notes = []; unresolved = []; pending = []; deferred = []
    for n, raw in zip(names, raws):
        raw = raw.strip()
        raw = re.sub(r'[・、,，／]\s*$', '', raw).strip()
        while raw.count('（') < raw.count('）') or raw.count('(') < raw.count(')'):
            raw = raw[:-1].rstrip()
        raw = re.sub(r'^(は|を|に|が|=|＝)', '', raw).strip()
        raw = re.sub(r'^列(?:は|に|を)?', '', raw).strip() if re.match(r'^列(?:は|に|を|が)', raw) else raw
        raw = raw.split('。')[0].strip()
        raw = re.sub(r'(〕)だけ$', r'\1', raw)
        mq = re.match(r'^(「[^」]*」(?:（[^）]*）)?)', raw)
        if mq: raw = mq.group(1)
        elif '、' in raw: raw = raw.split('、')[0].strip()
        raw = re.sub(r'の1行を持つ.*$|の1行を書いた.*$|を入れた1行の.*$|の1行のCSV.*$|の?行を\d+行持つ.*$|とした行.*$', '', raw).strip()
        if not (n in APP_STATUS and re.fullmatch(r'「?\d+」?（(?:公開|非公開|廃止)）(?:とする)?。?', raw)):
            _ex = re.search(r'（例: ?(\d+)）\s*(?:とする)?。?$', raw)
            raw = re.sub(r'\s*とする。?$', '', re.sub(r'（[^）]*）\s*(とする)?。?$', '', raw)).strip()
            if _ex and raw.startswith('任意の'): raw += f'（例: {_ex.group(1)}）'
        else: raw = re.sub(r'(?:とする)?。?$', '', raw)
        raw = re.sub(r'にし$|にする$|を入れ$|を入れて$|とした$|とし$', '', raw).strip()
        if raw == '': pending.append(n); continue
        v = raw; vals_names = pending + [n]; pending = []
        res = None
        if v in ('空', '列を空', '列を空にし'): res = ''
        elif n.startswith('言語') and re.match(r'^日本語(のID|の言語ID|を(表す|示す)値)?$', v): res = ENV['LANG'] if ENV else None
        elif n in APP_STATUS and (re.match(r'^(公開|非公開|廃止)(の?ID|を(表す|示す)値|を示す\d)?$', v) or re.match(r'^「?(\d+)」?（(公開|非公開|廃止)）$', v)):
            mw = re.match(r'^(?:「?(\d+)」?（)?(公開|非公開|廃止)', v); num_, word = mw.group(1), mw.group(2)
            res = '\0'
            for nn in vals_names:
                if nn not in APP_STATUS: continue
                vals[nn] = APP_STATUS[nn][word]
                if nn == '商品公開ステータス' and word == '公開': notes.append(STATUS_NOTE)
                elif num_ and vals[nn] != num_: notes.append(f'{nn}: 文は{num_}（{word}）、アプリの定義では{word}={vals[nn]}。アプリの定義の値を入れた')
        elif re.match(r'^空欄', v) or (v in ('無効', '無効にする', '無効にし', '有効') and n == 'スマレジ連携フラグ'):
            res = '' if v.startswith('空欄') else ('1' if v == '有効' else '0')
        elif (v in ('登録済みの値', '取り込める値', '有効な値', '任意の有効な値')) and all((nn in CODE_DEFAULT or 'カテゴリ' in nn or '購入グループ' in nn or nn == '販売制限数') for nn in vals_names) and ENV:
            res = '\0'
            for nn in vals_names:
                if nn == '販売制限数': vals[nn] = ''; notes.append('販売制限数: 文は「' + v + '」。任意の列なので空にした')
                elif nn in CODE_DEFAULT: vals[nn] = CODE_DEFAULT[nn]; notes.append(f'{nn}: 文は「登録済みの値」。e2e の registerGoodsCsv の既定値 {vals[nn]} を入れた')
                elif 'カテゴリ' in nn: vals[nn] = ENV['CHILD']; notes.append('商品カテゴリ(ID): 文は「登録済みの値」。サプライ・グッズ直下の先頭のカテゴリのIDを入れた(DBを読んで選んだ)')
                else: vals[nn] = ENV['SELL']; notes.append('購入グループ名称: 文は「登録済みの値」。購入グループ表の有効な行の先頭の名称にした(DBを読んで選んだ)')
        elif n == '言語(ID)' and re.match(r'^登録済みの言語のID$', v): res = ENV['LANG'] if ENV else None
        elif n == '言語(ID)' and v == '英語のID' and ENV: res = ENV['LANG_EN']; notes.append('言語(ID): 英語のID。言語表（mtb_language）の「英語」の行のIDを読んで入れた(DBを読んだ)')
        elif n == '言語(ID)' and v == '日本語・英語以外の言語のID' and ENV: res = ENV['LANG_OTHER']; notes.append('言語(ID): 日本語・英語以外の言語のID。言語表の日本語・英語以外で先頭の行のIDを読んで入れた(DBを読んだ)')
        elif n == '部門ID' and v == '任意の有効な部門' and ENV: res = ENV['SECTION']; notes.append('部門ID: 文は「任意の有効な部門」。部門表（mtb_section）の表示ありの先頭の行のIDを読んで入れた(DBを読んだ)')
        elif re.match(r'^(?:グッズ配下の既存カテゴリ|選択できる商品カテゴリ1件)のID$', v) and ENV:
            res = ENV['CHILD']; notes.append('商品カテゴリ(ID): 文は「' + v + '」。サプライ・グッズ直下の先頭のカテゴリのIDを入れた(カテゴリ表で表示順が大きい先頭の行。DBを読んで選んだ)')
        elif re.match(r'^(?:そのほか|ほか)の必須列', v): res = '\0'   # 必須の列の補い(下)で入れる
        elif re.match(r'^控えた(〔[^〕]+〕)$', v): res = re.match(r'^控えた(〔[^〕]+〕)$', v).group(1)
        elif n == '商品コード' and re.search(r'(重複しない|重ならない).*任意', v) and cur_sid[0]:
            mm_ = re.match(r'S-(M\d\d-\d\d)-(.*?)(\d+)$', cur_sid[0]) or re.match(r'S-(M\d\d-\d\d)-(.*)()$', cur_sid[0]); res = f'{mm_.group(1).replace("-", "")}-SRC-{mm_.group(3) or mm_.group(2)}' if mm_ else None
            if res: notes.append(f'商品コード: 文は「{v[:24]}」。「{res}」にした（機能ID+SRC+ケース番号。ほかのファイルの商品コードと重ならない形）')
        elif re.match(r'^任意の(?:数値|整数)', v) and n in ('サイズ', '重量', '販売制限数'):
            mm = re.search(r'例: ?(\d+)', v); res = mm.group(1) if mm else CODE_DEFAULT.get(n)
            if res: notes.append(f'{n}: 文は「{v[:12]}」。{"文の例の " if mm else "e2e の既定値 "}{res} を入れた')
        elif v.startswith('サプライ・グッズのカテゴリID'): res = ENV['CAT'] if ENV else None
        elif v in ('登録済みのもの', '登録済みのグッズのカテゴリ', '登録済みの購入グループ', 'グッズ配下の登録済みカテゴリのID', '登録済みの購入グループの名称') or v.startswith('既存の購入グループ') or re.match(r'^登録済みの購入グループ\d件の名称$', v):
            res = '\0'
            for nn in vals_names:
                if 'カテゴリ' in nn and ENV:
                    vals[nn] = ENV['CHILD']; notes.append('商品カテゴリ(ID): 文は「登録済みのもの」。e2e の registerGoodsProduct と同じく、サプライ・グッズ直下の先頭のカテゴリのIDを入れた(カテゴリ表のサプライ・グッズ直下で表示順が大きい先頭の行。DBを読んで選んだ)')
                elif '購入グループ' in nn and ENV:
                    vals[nn] = ENV['SELL']; notes.append('購入グループ名称: 文の「既存の購入グループ」は、購入グループ表の有効な行の先頭(id が最小)の名称にした(DBを読んで選んだ)')
                else: res = None
        elif v == '登録済みの購入グループ': res = ENV['SELL'] if ENV else None
        elif v.startswith('予約商品フラグの付いていない既存の購入グループ'): res = ENV['NONRES'] if ENV else None
        elif re.match(r'^(\d+(?:,\d+)*)（[^）]+）$', v): res = re.match(r'^(\d+(?:,\d+)*)', v).group(1)
        elif re.fullmatch(r'「([^」]*)」（[^）]*）', v): res = re.match(r'「([^」]*)」', v).group(1)
        elif re.fullmatch(r'「([^」]*)」', v): res = re.match(r'「([^」]*)」', v).group(1)
        elif re.search(r'共有シード[^〔]*〔[^〕]+〕', v) or re.fullmatch(r'(略称タグ「[^」]*」のID)?〔[^〕]+〕(（[^）]*）)?', v):
            res = re.search(r'〔[^〕]+〕', v).group(0)
        elif n == '商品コード' and v.startswith('他のデータと重ならない任意の値') and cur_sid[0]:
            mm_ = re.match(r'S-(M\d\d-\d\d)-.*?(\d+)$', cur_sid[0]); res = f'{mm_.group(1).replace("-", "")}-SRC-{mm_.group(2)}' if mm_ else None
            if res: notes.append(f'商品コード: 文は「他のデータと重ならない任意の値」。「{res}」にした（機能ID+SRC+ケース番号。ほかのファイルの商品コードと重ならない形）')
        elif re.match(r'^他の商品と重複しない「([^」]+)」', v): res = re.match(r'^他の商品と重複しない「([^」]+)」', v).group(1)
        elif re.match(r'^任意の(?:正の整数|金額|0以上の金額|値|有効な値)', v) and all(nn in CODE_DEFAULT for nn in vals_names):
            mm = re.search(r'例: ?(\d+)', v); res = '\0'
            for nn in vals_names:
                vals[nn] = mm.group(1) if mm else CODE_DEFAULT[nn]
                notes.append(f'{nn}: 文は「{v[:20]}」。{"文の例の " + vals[nn] if mm else "e2e の registerGoodsCsv の既定値 " + vals[nn]}を入れた')
        elif re.match(r'^商品コードと同じ(?:値|文字列)?$', v) and vals.get('商品コード'):
            res = '\0'
            for nn in vals_names: vals[nn] = vals['商品コード']
            notes.append('商品名: 文は「商品コードと同じ値」。商品コードの値をそのまま入れた')
        elif n == '基準価格' and re.match(r'^買取価格以上の任意の値', v): deferred.append((n, 'ge買取'))
        elif re.search(r'のID(（|$)', v) and not DESCRIPTIVE.search(v.replace('のID', '')):
            nm = re.sub(r'^「|」$|のID.*$|を?表示.*$', '', v.replace('」のカテゴリID', '」のID')).strip('「」')
            res = f'〔{nm}のID〕'; notes.append(f'{n}: 文は「{v[:30]}」。その番号は画面で控えるものなので、呼び名〔{nm}のID〕を入れた（取り込む前に控えた番号に置き換える）')
        elif re.fullmatch(r'[\x21-\x7e]+', v): res = v
        elif not DESCRIPTIVE.search(v) and n in ('商品名(日)', '商品名(英)', '購入グループ名称', '商品コード', '検索ワード', '商品説明(日)', '商品説明(英)', 'フリーエリア'): res = v
        if res is None: unresolved.append(f'{n}={v[:30]}')
        elif res != '\0':
            for nn in vals_names: vals[nn] = res
    if vals.get('商品公開ステータス') == '2' and re.search(r'商品公開ステータス(?:は|=|＝)2(?!（)', sentence):
        vals['商品公開ステータス'] = '1'   # 依頼者決定 2026-10-23: 文が「2」とだけ書くものも、設計書の値(2=公開)と読み、アプリの 1(公開)にそろえる
        notes.append(STATUS_NOTE)
    for n, kind in deferred:
        bp = vals.get('買取価格')
        vals[n] = bp if bp and bp.isdigit() else CODE_DEFAULT['基準価格']; notes.append('基準価格: 文は「買取価格以上の任意の値」。買取価格と同じ値にした')
    # 必須の列の補い
    if (force_req or re.search(r'そのほかの必須|ほかの必須|必須の列に有効な値|必須列', sentence)) and ENV and '商品コード' in vals:
        mm = re.match(r'S-([A-Z]\d\d)-(\d\d)-.*?(\d+)$', cur_sid[0])
        suffix = mm.group(3) if mm else vals['商品コード']
        nm = f'M{mm.group(1)[1:]}{mm.group(2)}試験商品{suffix}' if mm else f'試験商品{vals["商品コード"]}'
        fill = {'言語(ID)': ENV['LANG'], '商品公開ステータス': PUBLISHED['商品公開ステータス'], '支店の商品公開ステータス': PUBLISHED['支店の商品公開ステータス'],
                '商品名(日)': nm, '商品名(英)': nm, '商品カテゴリ(ID)': ENV['CHILD'], '購入グループ名称': ENV['SELL'], **CODE_DEFAULT}
        added = []
        for col in REQUIRED:
            if col not in vals and col in fill: vals[col] = fill[col]; added.append(col)
        if added: notes.append('そのほかの必須の列(' + '・'.join(added) + '): 文は「有効な値」。e2e の registerGoodsCsv・registerGoodsProduct が使う値(名前は「M<機能>試験商品<番号>」・サイズ1・重量1・価格は既定値・グッズ直下の先頭カテゴリ・先頭の購入グループ)を入れた')
        unresolved[:] = [u for u in unresolved if not re.match(r'^(ほか|そのほか)', u)]
    unresolved = [u for u in unresolved if not u.split('=')[0] in vals]
    if unresolved: return None, notes, '値を決められない列: ' + '、'.join(unresolved[:4])
    if '商品コード' not in vals or vals['商品コード'] == '': return None, notes, '商品コードの値が読めない'
    return vals, notes, ''


def goods_rows(sentence):
    sentence = re.sub(r'(商品名|商品説明|言語|カテゴリ|タグ)（(日|英|ID)）', r'\1(\2)', sentence)
    """1つのグッズ商品CSV登録の文から、行(列→値の辞書)の並びを取り出す。複数行の書き方: 「／2行目は」「1行目は…、2行目は…」「商品コード「A」…、商品コード「B」…」"""
    if '商品ID' not in sentence and '商品コード' in sentence:
        k_ = sentence.find('商品コード'); sentence = sentence[:k_] + '商品ID空、' + sentence[k_:]
    i = sentence.find('商品ID')
    if i < 0: return None, [], '商品ID の列の記述が無い'
    i0 = sentence.find('商品コード')
    if 0 <= i0 < i and re.match(r'商品コード[=＝]?「?[A-Za-z0-9_\-]*?\d+」?〜', sentence[i0:]): i = i0   # 商品コードの範囲が、商品IDの列の記述より前にある
    m_c = re.search(r'(?:全行|各行)共通の?(?:列|値)は', sentence)
    if m_c and m_c.start() < i: i = m_c.start()
    spec = re.split(r'の1行を|を入れた1行|1行のCSV|CSVファイルを選択|行を2行持つ|を2行持つ|1行を持つ|を書いたCSV|を登録する|を埋めたCSV|を入れたCSV|CSVファイルを選び', sentence[i:])[0]
    spec = re.sub(r'[^／、]*?=((?:基準価格|販売価格|買取価格|原価単価)\d+(?:・(?:基準価格|販売価格|買取価格|原価単価)\d+)+)とし', r'\1', spec)   # 「基準価格・販売価格・…=基準価格1000・販売価格1000…とし」は右辺だけが値
    # 商品コードの範囲: 商品コード=A-001〜A-011の11行 / 商品コード「A-001」〜「A-051」の51行(共通の指定が続く)
    mrg = re.search(r'商品コード[=＝]?「?([A-Za-z0-9_\-]*?)(\d+)」?〜「?\1(\d+)」?の(\d+)行(?:（([^）]*)）)?', spec)
    if mrg:
        pre, a_, b_, n_ = mrg.group(1), mrg.group(2), mrg.group(3), int(mrg.group(4))
        codes = [f'{pre}{str(k).zfill(len(a_))}' for k in range(int(a_), int(b_) + 1)]
        if len(codes) != n_: return None, [], '商品コードの範囲の件数と行数が合わない'
        head_ = spec[:mrg.start()]; tail_ = (mrg.group(5) or '') + spec[mrg.end():]
        spec = '\x00'.join(head_ + f'商品コード「{c_}」、' + tail_ + '、そのほかの必須' for c_ in codes)
        sentence = sentence[:i] + spec
    # 次のN商品（商品コード「A」は基準価格1・販売価格2、商品コード「B」は…）
    mpc = re.search(r'次の(\d+)商品（((?:商品コード「[^」]+」は[^、）]+(?:、|(?=）)))+)）', sentence)
    if mpc and len(re.findall(r'商品コード「', mpc.group(2))) == int(mpc.group(1)):
        its = re.findall(r'商品コード「([^」]+)」は([^、）]+)', mpc.group(2))
        spec = '\x00'.join(f'商品ID空、商品コード「{c_}」、' + v_.replace('・', '、') + '、そのほかの必須' for c_, v_ in its)
        sentence = sentence[:i] + spec
    parts = re.split(r'[／。]\d+行目[は=＝に:：](?!加えて)\s*', spec) if not mrg and not mpc else spec.split('\x00')
    if len(parts) > 1 and not mrg and not mpc and not re.search(r'(?<!スマレジ)商品コード(?:は|=|＝|「)', parts[0]) and all(re.search(r'(?<!スマレジ)商品コード(?:は|=|＝|「)', p_) for p_ in parts[1:]):
        common = re.sub(r'[）)]\s*[:：]?\s*$', '', parts[0].strip()).rstrip('、 ')   # 先頭の部分は全行共通の列だけ
        parts = [common + '、' + p_ for p_ in parts[1:]]
    if len(parts) > 1 and not mrg and not mpc:
        m1 = re.search(r'^(.*?)、?\s*1行目[は=＝](.*)$', parts[0], re.S)
        if m1:   # 「(各行の共通の値は…): 1行目=…／2行目=…」: 共通の指定を各行に付ける
            common = re.sub(r'[）)]\s*[:：]?\s*$', '', m1.group(1).strip()).rstrip('、 ')
            parts = [common + '、' + m1.group(2)] + [common + '、' + p_ for p_ in parts[1:]]
    if len(parts) == 1:
        segs_ = re.split(r'(?:、|。)?\d+行目[は=＝に:：](?!加えて)\s*', spec)
        if len(segs_) >= 2:   # 共通部分 + 「1行目は…」「2行目は…」(1行だけの書き方も)
            tail_c = ''
            mtc = re.search(r'とし、(?:両行|各行|全行|2行)とも(.+)$', segs_[-1])
            if mtc: tail_c = '、' + mtc.group(1); segs_[-1] = segs_[-1][:mtc.start()]   # 最後の行の後ろに書かれた「両行とも…」は全行の共通
            if re.search(r'(?<!スマレジ)商品コード(?:は|=|＝|「)', segs_[0]):   # 先頭の行の「1行目は」が商品IDの記述より前にある書き方
                parts = [sg.strip('、') + tail_c for sg in segs_]
            else:
                common = segs_[0].rstrip('、')
                parts = [(common + '、' + sg.strip('、')).strip('、') + tail_c for sg in segs_[1:]]
    if len(parts) == 1 and len(re.findall(r'(?<!スマレジ)商品コード「', spec)) >= 2:
        pos = [mm.start() for mm in re.finditer(r'(?<!スマレジ)商品コード「', spec)]
        common = spec[:pos[0]]
        parts = [common + spec[a:b] for a, b in zip(pos, pos[1:] + [len(spec)])]
    if os.environ.get('CSV_DEBUG') and cur_sid[0] == os.environ['CSV_DEBUG']: print('DEBUG parts', len(parts), [p_[:400] for p_ in parts])
    rows = []; allnotes = []
    for k, part in enumerate(parts):
        if part.startswith('商品コード'): part = '商品ID空、' + part
        txt = part if part.startswith('商品ID') or k == 0 and part.startswith('商品ID') else ('商品ID' + part if not part.startswith('商品ID') and '商品ID' not in part[:6] else part)
        vals, notes, why = parse_row('商品ID' + txt[len('商品ID'):] if txt.startswith('商品ID') else txt, force_req=bool(re.search(r'そのほかの必須|ほかの必須|必須の列に有効な値|必須列', sentence)))
        if vals is None: return None, allnotes + notes, why + ('' if len(parts) == 1 else f'（{k + 1}行目）')
        rows.append(vals); allnotes += notes
    return rows, allnotes, ''


# ---- 商品CSV登録(CsvImportController の商品CSV。見出しは messages.ja.yaml の admin.product.product_csv.*_col の順) ----
PRODUCT_HEAD = ['商品ID', '公開ステータス(ID)', '商品名', 'ショップ用メモ欄', '商品説明(一覧)', '商品説明(詳細)', '検索ワード', 'フリーエリア', '商品削除フラグ', '商品画像', '商品カテゴリ(ID)', 'タグ(ID)',
  '販売種別(ID)', '規格分類1(ID)', '規格分類2(ID)', '発送日目安(ID)', '商品コード', '在庫数', '在庫数無制限フラグ', '販売制限数', '通常価格', '販売価格', '送料', '税率', '商品規格表示フラグ']
def split_sentences(text):
    """「。」で文に分ける。括弧（）の中の「。」では分けない"""
    out = []; cur = ''; depth = 0
    for ch in text:
        cur += ch
        if ch in '（(': depth += 1
        elif ch in '）)': depth = max(0, depth - 1)
        elif ch == '。' and depth == 0: out.append(cur); cur = ''
    if cur: out.append(cur)
    return out

def product_setups(how, fid):
    """「商品CSV登録で次のN行のCSVをアップロードする(…): 商品名「A」・商品コードC・在庫数N／…」の形。戻り値 [(rows, notes)]"""
    out = []
    for sent in split_sentences(how):
        m = re.search(r'商品CSV登録で次の(\d+)行のCSVをアップロードする（([^）]*)）[:：](.+)$', sent)
        if not m: continue
        n = int(m.group(1)); rows = []; notes = []
        parts = [x for x in m.group(3).split('／') if x.strip()]
        if len(parts) != n: continue
        for p_ in parts:
            code = re.search(r'商品コード([A-Za-z0-9\-_]+)', p_)
            if not code: rows = None; break
            nm = re.search(r'商品名「([^」]+)」', p_)
            st = re.search(r'在庫数(\d+)', p_)
            row = {h: '' for h in PRODUCT_HEAD}
            row['商品コード'] = code.group(1)
            row['商品名'] = nm.group(1) if nm else f'M{fid[1:3]}{fid[4:]}試験商品{code.group(1)}'
            row['在庫数'] = st.group(1) if st else '10'
            rows.append(row)
        if not rows: continue
        notes.append('公開ステータス(ID)=1: 文は「試験環境で有効な値」。公開ステータスの表（公開=1・非公開=2・廃止=3）を読んで、公開の 1 にした')
        notes.append('販売種別(ID)=1: 文は「試験環境で有効な値」。販売種別の表（1=販売種別A・2=販売種別B）を読んで、先頭の 1 にした')
        notes.append('販売価格=1000: 文は「記載が無ければ任意の0以上の金額」。金額は 1000 にした')
        notes.append('在庫数無制限フラグ=0（文のとおり）')
        if any('商品名は任意' in p_ for p_ in parts): notes.append('商品名: 文は「任意」。機能IDの入った「M<機能>試験商品<商品コード>」にした')
        if any('在庫数は任意' in p_ for p_ in parts): notes.append('在庫数: 文は「任意の0以上の数」。10 にした')
        for r in rows: r['公開ステータス(ID)'] = '1'; r['販売種別(ID)'] = '1'; r['在庫数無制限フラグ'] = '0'; r['販売価格'] = '1000'
        out.append((rows, notes))
    return out

def goods_setups(how, fid=''):
    """投入方法の中の「グッズ商品CSV登録」で行を書く文(続きの文を含む)の一覧"""
    out = []
    sents = split_sentences(how)
    for i, sent in enumerate(sents):
        if '雛形ファイルダウンロード' in sent and '保存する' in sent: continue
        if 'グッズ商品CSV登録' not in sent or re.search(r'DBへ直接設定|既存シード', sent): continue
        if fid == 'M03-27' and not ('商品ID' in sent and '商品コード' in sent and re.search(r'アップロード|取り込み|取込', sent)): continue   # M03-27 は取込そのものが試験対象。準備は prep_files が決める
        if re.search(r'見出し行の下に「商品ID=', sent): continue   # kv_setups が読む
        text = sent
        for j in range(i + 1, min(i + 6, len(sents))):
            nx = sents[j].strip()
            if nx.startswith('グッズ商品CSV登録'): break
            if re.match(r'^(行の内容|各行は|各行共通|共通|1行目|2行目|次の|両行|両方|両商品|なお|残りの|そのほかの|ほかの|商品ID)', nx): text += nx
            else: break
        if '商品コード' in text and re.search(r'アップロード|取り込み|取込|作る|書い|登録する|CSVファイル|CSVを', text): out.append(text)
    return out

def kv_setups(how):
    """「…見出し行の下に「商品ID=空、商品コード=…、ほかの列=空」の1行を書いた、UTF-8・カンマ区切りの NAME.csv を作る」の形。戻り値 [(ファイル名, 列→値の辞書, notes)]"""
    out = []
    for m in re.finditer(r'見出し行の下に「(商品ID=[^」]*)」の(\d+)行を書いた、[^の]*?の ?([A-Za-z0-9_\-\.]+\.csv) ?を作る', how):
        vals = {}; notes = []
        for kv in m.group(1).split('、'):
            if '=' not in kv: continue
            k, v = kv.split('=', 1)
            if k == 'ほかの列': continue
            v = v.strip()
            if v == '空': v = ''
            mm = re.fullmatch(r'(\d+)（(公開|非公開|廃止)）', v)
            if mm and k in APP_STATUS:
                v = APP_STATUS[k][mm.group(2)]
                if k == '商品公開ステータス' and mm.group(2) == '公開': notes.append(STATUS_NOTE)
            vals[k] = v
        if '商品コード' in vals: out.append((m.group(3), vals, list(dict.fromkeys(notes))))
    return out

H_CACHE = {}
import csv as _csv, io as _io
_csv.field_size_limit(10**9)
def _cols(data):
    try: t = data.decode('utf-8-sig')
    except UnicodeDecodeError:
        try: t = data.decode('cp932')
        except Exception: return None
    rows = [r for r in _csv.reader(_io.StringIO(t.replace('\r\n', '\n')), delimiter=',') if r]
    return (len(rows[0]), len(rows[1])) if len(rows) > 1 else None
def colcheck(data, f, clause, fid=''):
    """見出しの列数と各行の列数が合うか。合わない行があれば説明を返す。文が列数のずれを意図している(列数・不足・過剰など)ものは問わない"""
    if not f.endswith(('.csv', '.tsv')) or not data or re.search(r'column', f) or (fid == 'M03-33' and _cols(data) == (5, 7)): return ''
    try: t = data.decode('utf-8-sig')
    except UnicodeDecodeError:
        try: t = data.decode('cp932')
        except Exception: return ''
    t = t.replace('\ufeff', '').replace('\u200b', '')
    try: rows = [r for r in _csv.reader(_io.StringIO(t.replace('\r\n', '\n').replace('\r', '\n')), delimiter='\t' if f.endswith('.tsv') else ',') if r]
    except Exception: return ''
    if len(rows) < 2: return ''
    n = len(rows[0]); odd = [i + 1 for i, r in enumerate(rows) if len(r) != n]
    if not odd: return ''
    if re.search(r'列数|列が|列不足|列過|余分|足りない|多い|少ない|不足|過剰|\d+列|列を|列だけ|列の|区切り|カラム|見出し', clause): return ''
    return f'{f}: 見出し{n}列に対し行{odd[:3]}の列数が違う'
H_CACHE_DONE = 1
def has_label(data):
    if '〔'.encode() in data: return 'utf8'
    if '〔'.encode('shift_jis') in data:
        try: data.decode('utf-8')
        except UnicodeDecodeError: return 'sjis'
    return ''
def _head_ok(fid, data, clause):
    """文に見出しの指定が無いのに、見出しが機能の見出し(作り方のコード・設計書)と違うものは、列が足りない読み違いなので採らない"""
    h = csv_rules.CODE_HEADS.get(fid)
    if not h or '見出し' in clause: return True
    try: first = data.decode('utf-8').lstrip('\ufeff').split('\n')[0].split('\r')[0]
    except Exception: return True
    f2 = re.sub('[\u200b\ufeff]', '', first.replace('\t', ','))
    return f2 == h or f2.startswith(h + ',削除フラグ') or f2.startswith(h + ',商品削除フラグ') or data == b''

def _inner(fid, clause, name):
    d, _ = from_text(clause, name)
    if d is None: d, _ = parse_more(fid, clause, name)
    return d
csv_rules.INNER = _inner
LAST_NOTES = []
def text_pipeline(fid, sid, st, how5, f):
    csv_rules.NOTES.clear()
    d_, r_, h_ = _text_pipeline(fid, sid, st, how5, f)
    LAST_NOTES[:] = list(csv_rules.NOTES)
    if d_ is not None:
        cl = ' '.join(x for x in clauses(st) if f in x)
        if f not in csv_rules.CTX.get('curated', {}) and not _head_ok(fid, d_, cl): return None, '読み取った見出しが機能の見出しと違う（列が足りない読み違いのため採らない）', ''
    return d_, r_, h_

def _text_pipeline(fid, sid, st, how5, f):
    """シード表の文だけから組む。戻り値 (bytes|None, 理由, 作り方)"""
    data, reason, how = None, '', ''
    if f in csv_rules.CTX.get('curated', {}):
        d_, nts_ = csv_rules.CTX['curated'][f]
        csv_rules.NOTES.extend(nts_)
        return d_, '', 'rule'
    if f in csv_rules.CTX.get('prep', {}):
        csv_rules.NOTES.append('準備用の取込ファイル: 手順の②が「見出し行の下に1行だけ次の値を入れて保存する」と書く値のとおり')
        return csv_rules.CTX['prep'][f], '', 'rule'
    own = [x for x in clauses(st) if f in x]
    if not own:
        # 範囲で展開したファイル名: 範囲を書いた文の、最初のファイル名を自分の名前に置き換えて読む
        for x in clauses(st):
            mr = re.search(r'([A-Za-z0-9_\-]*?)(\d+)([A-Za-z0-9_\-]*\.(?:csv|tsv|txt))〜\1(\d+)\3', x)
            if mr and f.startswith(mr.group(1)) and f.endswith(mr.group(3)): own.append(x.replace(mr.group(0), f, 1))
    segs = [y for y in re.split(r'[／。]', st) if y.strip()]
    for x in own:
        csv_rules.CTX['sid'] = sid; csv_rules.CTX['state'] = st
        _k = segs.index(x) if x in segs else -1
        csv_rules.CTX['next'] = segs[_k + 1] if 0 <= _k < len(segs) - 1 else ''
        if fid in csv_rules.FIRST:
            data = csv_rules.RULES[fid](x, f, st, how5)
            if data is not None: return data, '', 'rule'
        k_ = segs.index(x) if x in segs else -1
        nxt = segs[k_ + 1] if 0 <= k_ < len(segs) - 1 else ''
        if re.match(r'^(' + '|'.join(map(re.escape, COLNAMES + list(csv_rules.M27_ALIAS))) + r')(=|空|は)', nxt.strip()) and fid in csv_rules.SLASH_SPEC:
            reason = 'ファイルの記述が「／」で区切られた列の並びで、文だけでは組まない'; continue
        def acc(d): return d is not None and _head_ok(fid, d, x)
        data = csv_rules.generic(fid, x, f)
        if acc(data): return data, '', 'rule'
        if fid in csv_rules.RULES:
            data = csv_rules.RULES[fid](x, f, st, how5)
            if acc(data): return data, '', 'rule'
        g = enc_guard(x, f)
        if g and not re.search(r'UTF[-－]8', g): data, reason = None, g; continue
        data, reason = from_text(x, f)
        if acc(data): return data, '', 'text'
        data, r2 = parse_more(fid, x, f)
        if acc(data): return data, '', 'text'
        reason = r2 or reason
    return None, reason, ''

import shutil
for _f in os.listdir(os.path.join(R, 'seed_files')) if os.path.isdir(os.path.join(R, 'seed_files')) else []:   # 前回作ったCSV等だけを消す(手順書 .md は消さない)
    _d = os.path.join(R, 'seed_files', _f)
    if os.path.isdir(_d):
        for _n in os.listdir(_d):
            _p = os.path.join(_d, _n)
            if re.match(r'^S-.+\.(\d+|setup\d+|productcsv\d+)\.(csv|tsv|txt|png|xls)$', _n): os.remove(_p)
            elif re.match(r'^S-[A-Za-z0-9\-]+$', _n) and os.path.isdir(_p): shutil.rmtree(_p)   # シードごとの置き場(<シードID>/)
def make_setups(fid, sid, how, d, idx):
    """投入方法の「グッズ商品CSV登録」「商品CSV登録」の行から、準備用のCSV(seed_files/<機能>/<シード>/setup/)を作る。戻り値 (作ったファイル, 作れなかった理由, 対象の数)"""
    made = []; why = []
    gs = goods_setups(how, fid)
    total = len(gs)
    for nm_, vals_, nts_ in kv_setups(how):
        total += 1
        bad = [k for k in vals_ if k not in GOODS_HEAD]
        if bad: why.append(f'準備のCSV {nm_}: 見出しに無い列 {bad}'); continue
        fn = f'{sid}/setup/{nm_}'
        os.makedirs(os.path.join(d, sid, 'setup'), exist_ok=True)
        data = ('\n'.join(','.join(csvcell(v) for v in r2) for r2 in [GOODS_HEAD, [vals_.get(h, '') for h in GOODS_HEAD]]) + '\n').encode('utf-8')
        open(os.path.join(d, fn), 'wb').write(data); made.append(fn)
        idx[fid].append([sid, fn, nm_ + '(グッズ商品CSV登録の準備。文のファイル名)', 'setup', ' ／ '.join(['値は投入方法の【ファイル】の文の「列=値」のとおり（ほかの列は空）'] + nts_)])
    for k, sent in enumerate(gs, 1):
        cur_sid[0] = sid
        rows_, gnotes, r = goods_rows(sent)
        if rows_ is None: why.append(f'準備のCSV{k}: {r}'); continue
        fn = f'{sid}/setup/setup{k}.csv'
        os.makedirs(os.path.join(d, sid, 'setup'), exist_ok=True)
        data = ('\n'.join(','.join(csvcell(v) for v in r2) for r2 in [GOODS_HEAD] + [[vals.get(h, '') for h in GOODS_HEAD] for vals in rows_]) + '\n').encode('utf-8')
        open(os.path.join(d, fn), 'wb').write(data); made.append(fn)
        idx[fid].append([sid, fn, f'(グッズ商品CSV登録の準備 {k}: 商品コード {"・".join(v["商品コード"] for v in rows_)}。文に名前が無いので setup{k}.csv とした)', 'setup', ' ／ '.join(dict.fromkeys(gnotes))])
    for k2, (prows, pnotes) in enumerate(product_setups(how, fid), 1):
        fn = f'{sid}/setup/productcsv{k2}.csv'; os.makedirs(os.path.join(d, sid, 'setup'), exist_ok=True)
        data = ('\n'.join(','.join(csvcell(v) for v in r2) for r2 in [PRODUCT_HEAD] + [[pr[h] for h in PRODUCT_HEAD] for pr in prows]) + '\n').encode('utf-8')
        open(os.path.join(d, fn), 'wb').write(data); made.append(fn); total += 1
        idx[fid].append([sid, fn, f'(商品CSV登録の準備 {k2}: 商品コード {"・".join(pr["商品コード"] for pr in prows)})', 'setup', ' ／ '.join(pnotes)])
    return made, why, total

ORACLE = collections.Counter(); ORACLE_DIFF = []; CODE_CMP = collections.Counter(); CODE_DIFF = []
out_rows = []
idx = collections.defaultdict(list)
for c in cls:
    fid, sid, name, kind = c[0], c[1], c[2], c[3]
    s = seeds[sid]; st = s[3]
    d = os.path.join(R, 'seed_files', fid); os.makedirs(d, exist_ok=True)
    made = []; why = []
    names = []
    for cl in clauses(st):
        fl = FILE.findall(cl)
        # 「a-1-006.csv〜a-6-006.csv」の範囲: 間のファイル名も数える
        mr = re.search(r'([A-Za-z0-9_\-]*?)(\d+)([A-Za-z0-9_\-]*\.(?:csv|tsv|txt))〜\1(\d+)\3', cl)
        if mr:
            for k_ in range(int(mr.group(2)), int(mr.group(4)) + 1): fl.append(f'{mr.group(1)}{k_}{mr.group(3)}')
        for f in fl:
            if f not in [n for n, _ in names]: names.append((f, cl))
    _cur = csv_curated.build(sid, st, s[5])
    csv_rules.CTX['curated'] = _cur
    for _fn in _cur:
        if _fn not in [n for n, _ in names]: names.append((_fn, ''))
    names[:] = [(n, c) for n, c in names if not any(o != n and o.endswith('-' + n) for o, _ in names)]   # 「A.csv〜D.csv」の「D.csv」のような端の名前は、展開した本来の名前に任せる
    _pf = csv_rules.prep_files(s[5]) if fid == 'M03-27' else {}
    for _fn in _pf:
        if _fn not in [n for n, _ in names]: names.append((_fn, ''))
    csv_rules.CTX['prep'] = {k: v[1] for k, v in _pf.items()}
    _pre = [v[0] for v in _pf.values()]
    for _sent in ([] if _pre else goods_setups(s[5])):
        cur_sid[0] = sid
        _r, _n, _w = goods_rows(_sent)
        if _r: _pre.extend(_r)
    csv_rules.CTX['setup_rows'] = _pre
    for f, cl in names:
        data, reason, how = None, '', ''
        hv_files, _hv_unused = H_CACHE.setdefault(sid, oracle_snapshot(fid, sid))
        if f in fx.get(sid, {}) and False: pass
        if f in fx.get(sid, {}):
            data, how = open(fx[sid][f], 'rb').read(), 'fixture'
            for x in [x for x in clauses(st) if f in x]:   # 検証: 文から組んだものが、検証済みの置き場のファイルと同じか
                t, _ = from_text(x, f)
                if t is None: t, _ = parse_more(fid, x, f)
                if t is not None:
                    ORACLE['同じ' if t == data else '違う'] += 1
                    if t != data: ORACLE_DIFF.append((sid, f))
                    break
            else: ORACLE['文からは組めない'] += 1
        else:
            data, reason, how = text_pipeline(fid, sid, st, s[5], f)
            if f in hv_files:   # 検証だけ: 照合用の静的な控えと比べる。ファイルには使わない
                if data is not None: CODE_CMP['同じ' if data == hv_files[f] else '違う'] += 1; CODE_DIFF.extend([(sid, f)] if data != hv_files[f] else [])
                else: CODE_CMP['文からは組めない'] += 1
            if data is None: why.append(f'{f}: {reason or "文に内容の記述が無い"}')
        if data is not None:
            fn = f'{sid}/{f}'
            os.makedirs(os.path.join(d, sid), exist_ok=True)
            open(os.path.join(d, fn), 'wb').write(data)
            _cc = colcheck(data, f, ' '.join(x for x in clauses(st) if f in x), fid)
            if _cc: why.append('列数が見出しと合わない: ' + _cc)
            _x26 = ['設計は31列（商品削除フラグを含む）、アプリの雛形（カード商品CSV）は30列。30列で作った（列数の差。取込で列数が合わない扱いになる見込みで、試験で見える）'] if fid == 'M03-26' and f.endswith('.csv') and _cols(data) and _cols(data)[0] == 30 and re.search(r'31列|商品削除フラグ', ' '.join(x for x in clauses(st) if f in x)) else []
            _extra = _x26 + (['設計は7列、アプリの雛形（見出し）は5列で、列数エラーになる見込み（設計との差。試験で見える）'] if fid == 'M03-33' and _cols(data) == (5, 7) else [])
            made.append(fn); idx[fid].append([sid, fn, f, how, ' ／ '.join(_extra + (['番号の呼び名を含む' + ('（Shift_JIS。Shift_JIS のまま置き換えて保存する）' if has_label(data) == 'sjis' else '')] if has_label(data) else []) + (LAST_NOTES if how in ('text', 'rule') else []))])
    names_total = len(names)
    made_s, why_s, setups_total = make_setups(fid, sid, s[5], d, idx)
    made += made_s; why += why_s
    if not names and not made: why.append('文にファイル名(.csv/.tsv/.txt)が無く、取り込むCSVの記述も見つからない')
    out_rows.append([fid, sid, name, kind, ('完全' if made and len(made) == names_total + setups_total and not why else '一部' if made else 'なし'), '、'.join(made), ' ／ '.join(why)])
# CSV取込のシード(上の一覧)以外でも、投入方法に「グッズ商品CSV登録」「商品CSV登録」の行があれば、準備用のCSVを作る
done_ids = {c[1] for c in cls}
setup_rows = [['機能ID', 'シードID', '論理名', '対象の行', '作ったファイル', '作れなかった理由']]
for fid in sorted(x for x in os.listdir(os.path.join(R, 'seed_files')) if os.path.isdir(os.path.join(R, 'seed_files', x))):
    pth = os.path.join(CASES, f'{fid}_seed_data.tsv')
    if not os.path.exists(pth): continue
    d = os.path.join(R, 'seed_files', fid)
    for r in list(csv.reader(open(pth, encoding='utf-8'), delimiter='\t'))[1:]:
        sid = r[0]
        if sid in done_ids or not re.search(r'グッズ商品CSV登録|商品CSV登録', r[5]): continue
        seeds[sid] = r
        csv_rules.CTX['state'] = r[3]
        mk, wy, tot_ = make_setups(fid, sid, r[5], d, idx)
        if tot_ or mk or wy: setup_rows.append([fid, sid, r[2], str(tot_), '、'.join(mk), ' ／ '.join(wy)])
open(os.path.join(R, 'review', 'csv_setup_result.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(x) for x in setup_rows) + '\n')
print('準備用CSVだけのシード:', len(setup_rows) - 1, '／うち全部作れた', sum(1 for x in setup_rows[1:] if not x[5]))
for fid, rows in idx.items():
    open(os.path.join(R, 'seed_files', fid, '_csv_index.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(x) for x in [['シードID', '作ったファイル', '正本のファイル名', '作り方', '備考']] + rows) + '\n')
h = ['機能ID', 'シードID', '論理名', '仕分け', 'CSVファイル', 'ファイル', '作れなかった理由']
open(os.path.join(R, 'review', 'csv_make_result.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(x) for x in [h] + out_rows) + '\n')
c = collections.Counter((r[3][0], r[4]) for r in out_rows)
print(sorted(c.items()), sum(1 for r in out_rows if r[4] != 'なし'), len(out_rows))

print('検証(fixture対文から組んだもの):', dict(ORACLE), ORACLE_DIFF[:6]); print('検証(作り方のコード対文から組んだもの):', dict(CODE_CMP), CODE_DIFF)
