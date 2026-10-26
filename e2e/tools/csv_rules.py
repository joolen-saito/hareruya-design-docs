"""機能ごとの読み取りの規則(csv_make.py が使う)。文に書かれた値だけを列に入れる。書かれていない値は入れない(入れる場合は理由を返す)。"""
import re
CTX = {'sid': '', 'next': '', 'setup_rows': []}   # 呼び出し側が入れる: 今のシードID・ファイルの文の次の文
INNER = None    # csv_make が入れる: 形式の指定を外した文を、文から組む読み取り全体で読む関数
NOTES = []   # 文が決めていない値を担当が決めたときの理由(呼び出し側が備考に書く)

def _enc(rows, name, sep=None):
    sep = sep or ('\t' if name.endswith('.tsv') else ',')
    return ('\n'.join(sep.join(r) for r in rows) + '\n').encode('utf-8')

# ---------------- M03-20 部門CSV ----------------
HEAD20 = ['ID', '部門名', '部門コード', '免税区分', 'MTGBuyer表示フラグ']
def sjis(text):
    return text.encode('cp932')
def rule_m0320(clause, name, seed_state, seed_how=''):
    i = clause.find(name); rest = clause[i + len(name):]
    if not rest.startswith('='): return None
    body = rest[1:]
    # 0. 形式の前置き(エンコード・区切り)
    enc = 'shift_jis' if 'Shift_JIS' in body.split('、')[0] else 'utf-8'
    sep = '\t' if re.search(r'タブ区切り', body.split('、')[0]) or name.endswith('.tsv') and 'カンマ区切り' not in body.split('、')[0] else ','
    if re.match(r'^(拡張子\w+・)?(UTF-8|Shift_JIS)?・?(カンマ|タブ)区切り(、|$)', body) or re.match(r'^(UTF-8|Shift_JIS)・(カンマ|タブ)区切り(、|$)', body):
        body = body.split('、', 1)[1] if '、' in body else ''
    body = re.sub(r'^見出し行1行と、', '', body)
    head = list(HEAD20); size = None
    mm = re.match(r'^正確に5MB(\+1バイト)?、(.+)$', body)
    if mm:
        if not mm.group(1):
            mx = re.match(r'^空IDの有効な([\d,]+)行、部門コード(SIZE-)(\d+)〜\2(\d+)、免税区分(\d)、表示フラグ(\d)$', mm.group(2))
            if not mx: return None
            n = int(mx.group(1).replace(',', '')); w = len(mx.group(3)); a = int(mx.group(3)); tax, fl = mx.group(5), mx.group(6)
            if int(mx.group(4)) - a + 1 != n: return None
            size = 5 * 1024 * 1024
            def rows_of(L, extra_rows, tail_ascii):
                out = []
                for k in range(n):
                    nm = f'試験部門{a + k}' + 'あ' * max(0, L + (1 if k < extra_rows else 0) - len(f'試験部門{a + k}')) + ('A' * tail_ascii if k == n - 1 else '')
                    out.append(['', nm, f'SIZE-{str(a + k).zfill(w)}', tax, fl])
                return out
            def total(L, e, t): return len('\n'.join(sep.join(r) for r in [head] + rows_of(L, e, t)).encode('utf-8')) + 1
            L = 20
            while L + 1 <= 128 and total(L + 1, 0, 0) <= size: L += 1
            rest = size - total(L, 0, 0); e, t = rest // 2, 0   # 1文字ふえると、あ(3バイト)-0 = 3バイト
            e, t = rest // 3, rest % 3
            if L + 1 > 128 or e > n or total(L, e, t) != size: return None
            NOTES.append(f'{n}行: 部門名は「試験部門<番号>」+「あ」を{L}文字（一部は{L + 1}文字）にそろえ、最終行の部門名の末尾にASCII{t}文字を足して、正確に{size}バイトにした（投入方法の「最終行の部門名を調整」に沿う。各項目128文字以内）')
            return ('\n'.join(sep.join(r) for r in [head] + rows_of(L, e, t)) + '\n').encode('utf-8')
        size = 5 * 1024 * 1024 + 1; body = mm.group(2)
    if body.startswith('定義済みの5見出しだけでデータ行なし'): return _enc([head], name, sep)
    if body.startswith('部門コード見出しなし、データ行は'):
        v = re.match(r'^部門コード見出しなし、データ行は「?([^」・]+)」?・免税区分(\d)・表示フラグ(\d)$', body)
        if not v: return None
        return _enc([['ID', '部門名', '免税区分', 'MTGBuyer表示フラグ'], ['', v.group(1), v.group(2), v.group(3)]], name, sep)  # ID は文に無いので空(作り方のコードと同じ)
    if body.startswith('MTGBuyer表示フラグの代わりに「表示フラグ」を使用し、'):
        body = body.split('、', 1)[1] if False else body.split('し、', 1)[1]; head[4] = '表示フラグ'
    # 名「X」N文字
    def rep(m): return m.group(1) * int(m.group(2))
    body = re.sub(r'部門名「([^」])」(\d+)文字', lambda m: '「' + rep(m) + '」', body)
    body = re.sub(r'部門コード「([^」])」(\d+)文字', lambda m: rep(m), body)
    # ゼロ幅: 部門名「…」に…、部門コード「…」に…、免税区分0、表示フラグ0
    zw = re.match(r'^部門名「([^」]+)」に[^、]+、部門コード「([^」]+)」に[^、]+、免税区分(\d)、表示フラグ(\d)$', body)
    if zw: return _enc([head, ['', zw.group(1), zw.group(2), zw.group(3), zw.group(4)]], name, sep)
    ids = list(dict.fromkeys(re.findall(r'〔部門ID-[^〕]+〕', seed_state)))
    parts = re.split(r'の行と、|行と、|と、(?=空ID)|(?<=[0-9A-Z])と(?=空ID)|、(?=「)|、(?=空ID)', body)
    rows = []
    for k, p in enumerate(parts):
        p = re.sub(r'(の\d+行|の1行|へ更新する行|を更新する正常行|の行)$', '', p.strip())
        m = re.search(r'(?:(?P<empty>空ID(?:で)?|ID列空|ID列が空)|(?P<same>同じID|同ID)|ID\s*(?P<idv>〔[^〕]+〕|[0-9]+|[A-Za-z]+))?[・、を]*「?(?P<name>[^・「」、]+?)」?・(?P<code>[A-Za-z0-9\-_]+)・(?:免税区分)?(?P<tax>[0-9A-Za-z]+)・(?:MTGBuyer)?表示フラグ(?P<flag>[0-9A-Za-z]+)', p)
        if not m and rows:
            m = re.search(r'「(?P<name>[^」]+)」・(?P<code>[A-Za-z0-9\-_]+)・(?P<tax>[0-9A-Za-z]+)・(?:表示フラグ)?(?P<flag>[0-9A-Za-z]+)', p)
        if not m:
            m = re.search(r'(?:(?P<empty>空ID(?:で)?)|ID\s*(?P<idv>〔[^〕]+〕|[0-9]+|[A-Za-z]+))?[・、を]*「?(?P<name>[^・「」、]+?)」?・(?P<code>[A-Za-z0-9\-_]+)・(?P<tax>[0-9A-Za-z]+)・(?:表示フラグ)?(?P<flag>[0-9A-Za-z]+)', p)
        if not m: return None
        d = m.groupdict()
        if d.get('same'):
            if len(ids) != 1: return None
            idv = ids[0]
        else: idv = '' if d.get('empty') else (d.get('idv') or '')
        rows.append([idv, d['name'], d['code'], d['tax'], d['flag']])
    if not rows: return None
    txt = '\n'.join(sep.join(r) for r in [head] + rows) + '\n'
    if size is not None:
        n = len(txt.encode('utf-8'))
        if n > size: return None
        size_note(size)
        d_ = _pad_to(txt.encode('utf-8'), size)
        NOTES.append(fill_note(size))
        return d_
    return sjis(txt) if enc == 'shift_jis' else txt.encode('utf-8')

# ---------------- 共通: グッズ商品CSVの32列 ----------------
GOODS_HEAD = ['商品ID', '商品コード', '言語(ID)', '商品公開ステータス', '支店の商品公開ステータス', '商品名(日)', '商品名(英)', 'サイズ', '重量', '商品説明(日)', '商品説明(英)',
  '買取商品説明(日)', '買取商品説明(英)', '検索ワード', '規格画像', '商品カテゴリ(ID)', '購入グループ名称', '略称タグ(ID)', '売上分析タグ(ID)', 'タグ(ID)', '発送日目安(ID)',
  'カードセット(ID)', '販売制限数', '基準価格', '販売価格', '買取価格', '原価単価', '地域別販売制限', 'スマレジ連携フラグ', 'スマレジ商品コード', '部門ID', 'フリーエリア']  # アプリの GoodsCsvController の見出し定義の順
def cell(v):
    return '"' + v.replace('"', '""') + '"' if re.search(r'[",\n]', v) else v

# ---------------- M03-27 グッズ商品CSV登録 ----------------
# 共通正常値は、シード表 S-M03-27-CSV-DEFAULT の状態・属性が定める(文の列名→CSVの見出し)
M27_DEFAULT = {'商品ID': '', '言語(ID)': '1', '商品公開ステータス': '1', '支店の商品公開ステータス': '1', 'サイズ': '200', '重量': '148', '商品カテゴリ(ID)': '2,12,27,177',
  '購入グループ名称': '通常商品', '略称タグ(ID)': '1098', '売上分析タグ(ID)': '8,9', 'タグ(ID)': '8,18', '発送日目安(ID)': '1,736', 'カードセット(ID)': '23', '販売制限数': '5',
  '基準価格': '300', '販売価格': '15', '買取価格': '15', '原価単価': '300', '地域別販売制限': '1', '部門ID': '123456789012'}
M27_ALIAS = {'商品ID': '商品ID', '規格コード': '商品コード', '名称(日)': '商品名(日)', '名称(英)': '商品名(英)'}
REQUIRED27 = ['言語(ID)', '商品公開ステータス', '支店の商品公開ステータス', '商品名(日)', '商品名(英)', 'サイズ', '重量', '商品カテゴリ(ID)', '購入グループ名称', '基準価格', '販売価格', '買取価格', '原価単価']   # シード表 S-M03-27-CASE-014 が挙げる必須の13項目
_M27_STATUS = {'公開': '1', '非公開': '2', '廃止': '3'}
def m27_spec(text, base=None):
    """「商品ID=空／1行目は商品コード=…・商品名(日)=…／2行目は…／重量=…／ほかの列は共通正常値…」を行の並びにする。戻り値 (rows|None, notes)"""
    notes = []; common = {}; per = {}; defaults = None; keep_base = False; blanks = []; after = False; desc_tail = None
    for it in [x.strip() for x in text.split('／') if x.strip()]:
        m = re.match(r'^(\d+)行目は(.+)$', it)
        pairs = []
        if re.match(r'^(?:ほかの)?必須項目=有効な値$', it): defaults = 'default'; continue
        if it == '刷新後の必須項目だけに値を入れる': defaults = 'required'; continue
        if re.match(r'^商品コードを含む任意項目=空$', it): continue
        mb = re.match(r'^(.+?)だけ空$', it)
        if mb:
            kk = M27_ALIAS.get(mb.group(1).strip(), mb.group(1).strip())
            if kk in GOODS_HEAD: blanks.append(kk); continue
        if it == '名称・関連情報を更新後の値': after = True; continue
        md = re.match(r'^各説明・検索ワード・フリーエリア=末尾(\d+)の値$', it)
        if md: desc_tail = md.group(1); continue
        if m: rowno = int(m.group(1)); pairs = [(rowno, x) for x in m.group(2).split('・')]
        elif re.match(r'^ほかの列(?:は|=)共通正常値', it): defaults = 'default'; continue
        elif re.match(r'^ほかの列=空', it): defaults = defaults or 'empty'; continue
        elif re.match(r'^ほかの列=②で入れた値', it): keep_base = True; continue
        elif re.match(r'^スマレジ連携フラグ=0・スマレジ商品コードと部門IDは空', it):
            common['スマレジ連携フラグ'] = '0'; common['スマレジ商品コード'] = ''; common['部門ID'] = ''; continue
        else: pairs = [(0, x) for x in it.split('・')]
        for rowno, pr in pairs:
            mm = re.match(r'^([^=]+)=(.*)$', pr.strip())
            if not mm: return None, notes
            k = M27_ALIAS.get(mm.group(1).strip(), mm.group(1).strip()); v = mm.group(2).strip()
            if k not in GOODS_HEAD: return None, notes
            if v == '空': v = ''
            ex = re.match(r'^任意（例: ?([^）]+)）$', v)
            if ex: v = ex.group(1); notes.append(f'{k}: 文は「任意（例: {v}）」。例の値を入れた')
            ms = re.match(r'^(\d)（(公開|非公開|廃止)）$', v)
            if ms and k == '商品公開ステータス':
                if _M27_STATUS[ms.group(2)] != ms.group(1): notes.append(f'{k}: 文は{ms.group(1)}（{ms.group(2)}）。アプリの定義では{ms.group(2)}={_M27_STATUS[ms.group(2)]}なので、アプリの定義の値を入れた')
                v = _M27_STATUS[ms.group(2)]
            if re.search(r'^(末尾|刷新後|任意|取込前)|末尾\d+の値', v): return None, notes
            (common if rowno == 0 else per.setdefault(rowno, {}))[k] = v
    nrows = max(per) if per else 1
    if base is not None and defaults is None: keep_base = True
    rows = []
    for n in range(1, nrows + 1):
        if base is not None and keep_base: r = dict(base)
        elif defaults == 'default': r = dict(M27_DEFAULT)
        elif defaults == 'required': r = {k_: v_ for k_, v_ in M27_DEFAULT.items() if k_ in REQUIRED27}
        else: r = {}
        r.update(common); r.update(per.get(n, {}))
        for b in blanks: r[b] = ''
        if after:
            for c in ('商品名(日)', '商品名(英)'): r[c] = (r.get(c, '') + '-更新後') if r.get(c) else '更新後'
            for c in ('商品説明(日)', '商品説明(英)', '買取商品説明(日)', '買取商品説明(英)', '検索ワード', 'フリーエリア'): r[c] = f'{c}-更新後'
        if desc_tail:
            for c in ('商品説明(日)', '商品説明(英)', '買取商品説明(日)', '買取商品説明(英)', '検索ワード', 'フリーエリア'): r[c] = f'{c}-{desc_tail}'
        if defaults in ('default', 'required') and not r.get('商品名(英)') and r.get('商品名(日)'): r['商品名(英)'] = r['商品名(日)']
        rows.append(r)
    if after: notes.append('名称・関連情報を更新後の値: 文は値を書いていない。商品名は取込前の名前の末尾に「-更新後」を付け、商品説明・買取商品説明・検索ワード・フリーエリアは「<列名>-更新後」にした')
    if desc_tail: notes.append(f'各説明・検索ワード・フリーエリア=末尾{desc_tail}の値: 「<列名>-{desc_tail}」にした（末尾が{desc_tail}の値）')
    if defaults in ('default', 'required') and any(r.get('商品名(英)') and r.get('商品名(英)') == r.get('商品名(日)') for r in rows): notes.append('商品名(英): 文は商品名(日)しか書かない。商品名(日)と同じ文字列にした')
    if defaults == 'required': notes.append('刷新後の必須項目だけに値を入れる: 必須の13項目（言語(ID)・商品公開ステータス・支店の商品公開ステータス・商品名(日)・商品名(英)・サイズ・重量・商品カテゴリ(ID)・購入グループ名称・基準価格・販売価格・買取価格・原価単価）だけに共通正常値を入れ、商品コードを含む任意項目は空。商品コードは文は任意・アプリ（GoodsCsvController）は必須で食い違う。文のとおり空で作った')
    if blanks: notes.append('だけ空: ' + '・'.join(blanks) + ' を空にし、ほかの必須項目は有効な値（共通正常値）')
    if defaults == 'default': notes.append('ほかの列は共通正常値: シード表 S-M03-27-CSV-DEFAULT の状態・属性が書く値')
    return rows, notes

def prep_files(seed_how):
    """M03-27: 「見出し行の下に1行だけ次の値を入れて NAME として保存する: 列=値／…／ほかの列=空」の準備ファイル。戻り値 {ファイル名: (行の辞書, bytes)}"""
    out = {}
    for m in re.finditer(r'見出し行の下に[1-9]行だけ次の値を入れて ?([A-Za-z0-9_\-]+\.csv) ?として保存する[:：]\s*(.+?)。(?!ス)', seed_how):
        if re.search(r'\d行目は', m.group(2)):
            rows_, nts_ = m27_spec(m.group(2))
            if rows_:
                NOTES.extend(nts_)
                out[m.group(1)] = (rows_[0], _m27_rows_csv(rows_))
            continue
        row = {}; ok = True
        for it in [x.strip() for x in m.group(2).split('／') if x.strip()]:
            if it == 'ほかの列=空': continue
            mm = re.match(r'^([^=]+)=(.*)$', it)
            if not mm: ok = False; break
            k = M27_ALIAS.get(mm.group(1).strip(), mm.group(1).strip()); v = mm.group(2).strip()
            ex = re.match(r'^任意（例: ?([^）]+)）$', v)
            if ex: v = ex.group(1); NOTES.append(f'{k}: 文は「任意（例: {v}）」。例の値を入れた')
            if k not in GOODS_HEAD: ok = False; break
            row[k] = '' if v == '空' else v
        if ok:
            data = ('\n'.join(','.join(cell(v) for v in r) for r in [GOODS_HEAD, [row.get(h, '') for h in GOODS_HEAD]]) + '\n').encode('utf-8')
            out[m.group(1)] = (row, data)
    return out

def _cellrow(row): return ','.join(cell(row.get(h, '')) for h in GOODS_HEAD)
def _m27_rows_csv(rows):
    return ('\n'.join(','.join(cell(v) for v in r) for r in [GOODS_HEAD] + [[row.get(h, '') for h in GOODS_HEAD] for row in rows]) + '\n').encode('utf-8')
def rule_m0327_bulk(clause, name):
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^は(?:見出し1行と)?有効な新規商品データ(\d+)行$', rest)
    if m:
        n = int(m.group(1)); codes = expand_range(CTX.get('state', '').replace('規格コード=', ''))
        if not codes or len(codes) != n: return None
        rows = []
        for c in codes:
            r = dict(M27_DEFAULT); r['商品コード'] = c; r['商品名(日)'] = f'{c}-商品'; r['商品名(英)'] = f'{c} Item'; rows.append(r)
        NOTES.append(f'{n}行: 商品コードはシード表の範囲（{codes[0]}〜{codes[-1]}）を展開、商品名(日)は「<商品コード>-商品」・商品名(英)は「<商品コード> Item」（文は「行ごとに別の値」）、ほかの列は共通正常値（S-M03-27-CSV-DEFAULT の値）')
        d = _m27_rows_csv(rows)
        return d if d.count(b'\n') == n + 1 else None
    m = re.match(r'^は必須欠落01〜必須欠落13の13行$', rest)
    if m:
        items = ['言語(ID)', '商品公開ステータス', '支店の商品公開ステータス', '商品名(日)', '商品名(英)', 'サイズ', '重量', '商品カテゴリ(ID)', '購入グループ名称', '基準価格', '販売価格', '買取価格', '原価単価']
        rows = []
        for k_, it in enumerate(items, 1):
            r = dict(M27_DEFAULT); tag = f'必須欠落{k_:02d}'
            r['商品名(日)'] = tag; r['商品名(英)'] = f'{tag} Item'
            r[it] = ''
            if it == '商品名(日)': r['商品名(英)'] = tag    # 日名を空にする行の識別名は英名に書く
            rows.append(r)
        NOTES.append('必須欠落01〜13: 文が挙げる13項目を1行に1項目ずつ空にした。商品名(日)を空にする行の識別名は、商品名(英)に書いた。商品コードは文に無いので空（商品コードは任意項目）。なお文は任意、アプリ（GoodsCsvController）は必須で食い違う。文のとおり空で作った')
        return _m27_rows_csv(rows)
    return None

def rule_m0327_clause(clause, name):
    b = rule_m0327_bulk(clause, name)
    if b is not None: return b
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^は(.+?)(?:の1行)?(?:（[^）]*）)?$', rest)
    if not m: return None
    body = m.group(1)
    if re.search(r'の?\d+行|必須欠落|限度|重複|スマレジコード|取込前|更新を|関連情報|を指定$', body): return None
    items = [x.strip() for x in re.split(r'・|、', body) if x.strip()]
    vals = {}; defaults = False
    for it in items:
        if it in ('共通正常値', '必須項目は有効値', 'ほかの列は共通正常値'): defaults = True; continue
        if it == 'ほかの列=空': defaults = defaults or 'empty'; continue
        if re.fullmatch(r'商品ID空(の1行)?', it) or it in ('商品ID=空',): vals['商品ID'] = ''; continue
        mm = re.match(r'^([^=]+)=(.*)$', it)
        if not mm: return None
        k = M27_ALIAS.get(mm.group(1).strip(), mm.group(1).strip()); v = mm.group(2).strip()
        if k not in GOODS_HEAD: return None
        if v == '空': v = ''
        if re.search(r'末尾|刷新後|任意', v): return None
        vals[k] = v
    if not defaults or not vals: return None
    row = {} if defaults == 'empty' else dict(M27_DEFAULT)
    ms_ = vals.get('商品公開ステータス', '')
    if ms_.startswith('2（公開）'): vals['商品公開ステータス'] = '1'; NOTES.append('商品公開ステータス: 文は2（公開）。アプリの定義では公開=1なので1を入れた')
    row.update(vals)
    NOTES.append('共通正常値・必須項目は有効値: シード表 S-M03-27-CSV-DEFAULT の状態・属性が書く値を、書かれていない列に入れた')
    return ('\n'.join(','.join(cell(v) for v in r) for r in [GOODS_HEAD, [row.get(h, '') for h in GOODS_HEAD]]) + '\n').encode('utf-8')

def rule_m0327(clause, name, seed_state, seed_how=''):
    mp_ = re.search(re.escape(name) + r'（((?:2行。)?[^）]*(?:／|。)[^）]*)）。', seed_how)
    mt_ = re.fullmatch(r'2行。商品名\(日\)=([^、]+?)の正常な新規行と、商品名\(日\)=([^、]+?)で必須項目を空にした行', mp_.group(1)) if mp_ else None
    if mt_:
        ok_, bad_ = dict(M27_DEFAULT), dict(M27_DEFAULT)
        ok_['商品名(日)'] = mt_.group(1); ok_['商品名(英)'] = mt_.group(1); bad_['商品名(日)'] = mt_.group(2); bad_['商品名(英)'] = mt_.group(2); bad_['言語(ID)'] = ''
        NOTES.append('2行（正常行・必須項目を空にした行）: 文は空にする項目を指定しない。必須の先頭の項目「言語(ID)」を空にした。商品名(英)は商品名(日)と同じ。ほかは共通正常値（S-M03-27-CSV-DEFAULT）')
        return _m27_rows_csv([ok_, bad_])
    mt_ = re.fullmatch(r'2行。商品名\(日\)を空にした行と、商品名\(日\)=([^／]+)／商品カテゴリ\(ID\)=(\d+)の行', mp_.group(1)) if mp_ else None
    if mt_:
        a_, b_ = dict(M27_DEFAULT), dict(M27_DEFAULT)
        a_['商品名(日)'] = ''; a_['商品名(英)'] = 'Multiple Errors A'; b_['商品名(日)'] = mt_.group(1); b_['商品名(英)'] = mt_.group(1); b_['商品カテゴリ(ID)'] = mt_.group(2)
        NOTES.append('2行（名称(日)を空にした行・対象外カテゴリの行）: 1行目の商品名(英)は識別のため「Multiple Errors A」（文に無いので担当が決めた）。ほかは共通正常値')
        return _m27_rows_csv([a_, b_])
    if mp_ and not mt_:
        rows_, nts_ = m27_spec(mp_.group(1), None)
        if rows_:
            NOTES.extend(nts_); return _m27_rows_csv(rows_)
    mh = re.search(re.escape(name) + r'\s*(?:を作る|として保存する)[:：]\s*(.+?)。', seed_how)
    if mh:
        sr = CTX.get('setup_rows') or []
        old = next((r for r in sr if str(r.get('商品コード', '')).startswith('GOODS-OLD')), None) or (sr[0] if sr else None)
        txt = mh.group(1)
        mid_ = re.search(r'商品ID=(〔[^〕]+〕)', txt)
        rows_, nts_ = m27_spec(txt, old)
        if rows_:
            for r_ in rows_:
                if 'ID' in str(r_.get('商品ID', '')) or r_.get('商品ID', '').startswith('〔'): pass
            NOTES.extend(nts_)
            if old is not None and any('②で入れた値' in x for x in txt.split('／')): NOTES.append('ほかの列=②で入れた値: 取込前の値は、手順②で取り込む準備用CSV（base ファイル）の行の値')
            return _m27_rows_csv(rows_)
    c2 = rule_m0327_clause(clause, name)
    if c2 is not None: return c2
    m = re.search(re.escape(name) + r'（([^）]*)）', seed_how)
    if not m:
        m = re.search(re.escape(name) + r'\s*(?:は|を作る)\s*[:：]?\s*(.+?)(?:、[A-Za-z0-9_\-]+\.csv\s*は|。|$)', seed_how)
    if not m: return None
    items = [x.strip() for x in m.group(1).split('／') if x.strip()]
    vals = {}; common = False; base = False; no = re.search(r'-(\d+)', name)
    for it in items:
        if it == 'ほかの列=共通正常値': common = True; continue
        if re.match(r'^ほかの列=②で入れた値', it): base = True; continue
        mm = re.match(r'^([^=]+)=(.*)$', it)
        if not mm: return None
        k = M27_ALIAS.get(mm.group(1).strip(), mm.group(1).strip()); v = mm.group(2).strip()
        if k == '名称・関連情報' and v == '更新後の値':
            vals['__after__'] = '1'; continue
        if k == '規格画像' and v == '更新後の値': vals[k] = 'img/goods/L/UGD/11552.jpg'; NOTES.append('規格画像: 文は「更新後の値」。シード表 S-M03-27-CASE-006 が規格画像に書く img/goods/L/UGD/11552.jpg を入れた'); continue
        if k not in GOODS_HEAD or v == '' : return None
        if re.search(r'末尾|刷新後|必須項目|任意', v): return None
        vals[k] = '' if v == '空' else v
    if not common and not base and vals.get('商品ID', '').startswith('〔') and (CTX.get('setup_rows') or []): base = True
    if not common and not base: return None
    if base:
        sr = CTX.get('setup_rows') or []
        old = next((r for r in sr if str(r.get('商品コード', '')).startswith('GOODS-OLD')), None) or (sr[0] if sr else None)
        if old is None: return None
        row = dict(old); row['商品ID'] = ''
        NOTES.append('ほかの列=②で入れた値: 取込前の値は、手順の②で取り込む準備用CSV（.setup）の行の値をそのまま入れた')
    else:
        row = dict(M27_DEFAULT)
    after = vals.pop('__after__', None)
    if after:
        for c in ('商品名(日)', '商品名(英)'): row[c] = (row.get(c, '') + '-更新後') if row.get(c) else f'更新後-M0327-{no.group(1) if no else ""}'
        for c in ('商品説明(日)', '商品説明(英)', '買取商品説明(日)', '買取商品説明(英)', '検索ワード', 'フリーエリア'): row[c] = f'{c}-更新後'
        NOTES.append('名称・関連情報を更新後の値: 文は値を書いていない。商品名は取込前の名前の末尾に「-更新後」を付け、商品説明・買取商品説明・検索ワード・フリーエリアは「<列名>-更新後」にした')
    row.update(vals)
    return ('\n'.join(','.join(cell(v) for v in r) for r in [GOODS_HEAD, [row.get(h, '') for h in GOODS_HEAD]]) + '\n').encode('utf-8')

# ---------------- 取込の鍵が列の並びで書かれる機能の共通の規則 ----------------
GEN = {  # 機能 → (見出し(作り方のコード・設計書の見出し), 文の別名→見出しの列)
  'M03-28': (['商品ID', '商品タグ(ID)'], {'タグID': '商品タグ(ID)', 'タグ': '商品タグ(ID)'}),
  'M03-29': (['商品ID', '売上分析タグ(ID)'], {'タグID': '売上分析タグ(ID)', 'タグ': '売上分析タグ(ID)'}),
  'M03-37': (['商品ID', '略称タグ'], {}),
  'M03-38': (['商品ID', '商品公開ステータス', '支店の商品公開ステータス'], {}),
  'M03-40': (['商品コード', '棚番号名称'], {}),
  'M04-21': (['商品コード', '在庫増減数', '仕入単価'], {}),
  'M03-35': (['商品コード', '部門コード(ID)'], {}),
  'M03-33': (['商品コード', '販売価格', 'セールフラグ', '帯URL', 'タグ(ID)'], {'タグ': 'タグ(ID)', 'タグID': 'タグ(ID)'}),
  'M03-32': (['商品コード', '基準価格'], {}),
  'M03-30': (['商品ID', '言語ID', '基準価格', '買取価格', '原価単価'], {}),
  'M03-31': (['商品ID', '言語ID', '販売価格', '買取価格', 'セールフラグ', '帯URL', 'タグ(ID)'], {'タグ': 'タグ(ID)', 'タグID': 'タグ(ID)'}),
}
def _sjis(text): return text.encode('cp932')
def _split_rows(body):
    m = re.findall(r'\d+行目([^、]*?)(?=、\d+行目|$)', body)
    if len(m) >= 2: return [x.strip() for x in m]
    return [x.strip() for x in re.split(r'および|と(?=〔|[0-9A-Za-z])', body) if x.strip()]
def _cell(v):
    v = re.sub(r'(を持つ|を保持|を持ち|で持つ)$', '', v.strip()).strip()
    mu = re.fullmatch(r'は?「([^」]+)」に英字(.)を(\d+)文字連結した全(\d+)文字', v)
    if mu:
        out = mu.group(1) + mu.group(2) * int(mu.group(3))
        return out if len(out) == int(mu.group(4)) else '\0'
    q = re.fullmatch(r'「([^」]*)」', v)
    if q: return q.group(1)
    return '' if v == '空' else v
def _check_counts(data, clause):
    """文が行数・改行数・サイズを書いているときは、作ったものがそれを満たすかを数えて確かめる(満たさなければ採らない)"""
    m = re.search(r'改行数(\d+)', clause) or re.search(r'引用符外の改行(\d+)個', clause)
    if m and data.count(b'\n') != int(m.group(1)): return False
    return True

# ---------------- 行数・サイズ・範囲の指定(まとめて作る) ----------------
MB5 = 5 * 1024 * 1024   # 「5MB」= 5×1024×1024 バイト。作り方のコード(m03-20.ts 上限のバイト数)の読みに合わせる
def expand_range(text):
    """「LMT-0001-015〜LMT-5009-015」「328200001〜328205009」「3900001012から3905009012まで1000刻み」を展開する。戻り値 list|None"""
    m = re.search(r'(?P<p>[A-Za-z\-]*)(?P<a>\d+)(?P<s>[A-Za-z\-]*(?:-\d+)?)〜(?P=p)(?P<b>\d+)(?P=s)', text)
    if m:
        a, b, w = int(m.group('a')), int(m.group('b')), len(m.group('a'))
        return [f"{m.group('p')}{str(i).zfill(w)}{m.group('s')}" for i in range(a, b + 1)]
    m = re.search(r'(\d+)から(\d+)まで(\d+)刻み', text)
    if m:
        a, b, st = map(int, m.groups())
        return [str(i) for i in range(a, b + 1, st)]
    return None

SIZE_NOTE = 'サイズの差（設計とアプリ）: シード表の「5MB」は5,242,880バイト(1024×1024)として作った。アプリのCSV取込の上限はSymfonyのmaxSize「5M」=5,000,000バイト（src/Eccube/Form/Type/Admin/CsvImportType.php:84、eccube.yaml の eccube_csv_size: 5）なので、5,000,001〜5,242,880バイトのファイルはアプリに拒まれる見込み（設計との差はテストで見える）'
def size_note(size):
    if size and size > 5_000_000 and size <= MB5 + 1: NOTES.append(SIZE_NOTE)

BOM_B = b'\xef\xbb\xbf'; ZW_B = b'\xe2\x80\x8b'
def _pad_to(data, size):
    """サイズを合わせる。改行で埋めると行数の上限（M03-35・M03-38 は改行5009）に触れて狙いが崩れるので、不可視文字で合わせる:
    先頭にBOM(U+FEFF)を1つ、そのあとにゼロ幅スペース(U+200B)を並べ、見出しの前に置く（どちらも3バイト。除去後は文の内容そのまま）。3で割り切れない端数は、行末のLFをCRLFにして1〜2バイト足して合わせる"""
    if len(data) > size: return None
    body = data[3:] if data.startswith(BOM_B) else data
    need = size - 3 - len(body)
    if need < 0: return None
    r = need % 3
    if r:
        lf = [i for i, ch in enumerate(body) if ch == 10 and (i == 0 or body[i - 1] != 13)]
        if len(lf) >= r:
            for i in reversed(lf[-r:]): body = body[:i] + b'\r' + body[i:]
            need -= r
        elif r == 2 and body.endswith(b'\n') and not body.endswith(b'\r\n'):
            body = body[:-1]; need += 1     # LFが1つしかないときの端数2は、最終行の改行を1つ外して合わせる
        else: return None
    return BOM_B + ZW_B * (need // 3) + body

def fill_note(size): return f'サイズ{size}バイト: 文は埋め方を指定していない。改行で埋めると行数の上限（改行5009）に触れるので、先頭のBOMとゼロ幅スペース（どちらも除去後は文の内容そのまま）で合わせた。端数は行末のLFをCRLFにする（LFが足りなければ最終行の改行を外す）ことで合わせた'

def bulk(fid, clause, name, seed_state):
    """行数・サイズの指定があるファイル。作ったあとで、行数・改行数・バイト数を数えて文の指定を満たすことを確かめる"""
    if fid not in CODE_HEADS: return None
    head = CODE_HEADS[fid].split(','); tab = name.endswith('.tsv'); j = '\t' if tab else ','
    i = clause.find(name); body = re.sub(r'^(は|=|の)\s*', '', clause[i + len(name):])
    # サイズの指定
    size = None
    if re.search(r'5MB\+1バイト|5 ?MBより1バイト大きい', body): size = MB5 + 1
    elif re.search(r'上限（5 ?MB）とバイト数が同じ|5MBとバイト数が同じ|正確に5MB(?!\+)', body): size = MB5
    else:
        m = re.search(r'(?<![0-9])([1-9]\d{5,})バイト', body)
        if m: size = int(m.group(1))
    # 行数の指定(データ行)
    n = None
    for pat in (r'データ行(\d+)(?:行|件)', r'(\d+)データ行', r'(\d+)データレコード', r'(\d+)正常行', r'データ行(\d+)'):
        m = re.search(pat, body)
        if m: n = int(m.group(1)); break
    rng = expand_range(seed_state)
    mx = re.search(r'商品ID (\d+)と、(\d+)から(\d+)まで(\d+)刻みの(\d+)件を合わせた(\d+)件', seed_state)
    if mx and rng: rng = [mx.group(1)] + rng
    rows = None
    if re.fullmatch(r'見出し行?と当該(\d+)商品の(PRE)更新データ', body) or (fid == 'M03-37' and n and rng):
        rows = [[c, 'PRE'] for c in (rng or [])]
    elif fid == 'M03-35' and n and rng:
        m = re.search(r'部門コード(\d+)へ更新', body)
        if m: rows = [[c, m.group(1)] for c in rng]
    elif fid in ('M03-28', 'M03-29') and rng:
        m = re.search(r'タグID ?(\d+)', body)
        if m: rows = [[c, m.group(1)] for c in rng]
    elif fid == 'M03-38' and rng:
        m = re.search(r'全行(\d),(\d)', body)
        if m: rows = [[c, m.group(1), m.group(2)] for c in rng]
    if rows is not None:
        if n and len(rows) != n: return None   # 文の件数と範囲の件数が合わない
        text = '\n'.join(j.join(r) for r in [head] + rows) + '\n'
        data = text.encode('utf-8')
        if size: data = _pad_to(data, size)
        if data is None: return None
        size_note(size)
        NOTES.append(f'{len(rows)}行: 文の範囲指定（商品コード/商品ID {rows[0][0]}〜{rows[-1][0]}）を、シード表の状態・属性から展開した' + (f'。サイズ{size}バイトに合わせるため、先頭のBOMとゼロ幅スペースで埋めた（改行で埋めると行数の上限に触れる）' if size else ''))
        return data if _check_counts(data, clause) else None
    # サイズの指定に加えて、文が中身を書いているもの: 中身を文の行にして、サイズは不可視文字で合わせる
    if size and rows is None:
        crow = None
        mm = re.search(r'3列見出しと(.+?)だけになる', body) or re.search(r'不可視文字除去後の正規データは「([^」]+)」', body)
        if mm: crow = [mm.group(1).split(',')]
        else:
            mm = re.search(r'見出し「([^」]+)」・データ「([^」]*)」', body) or re.search(r'見出し=([^、]+)、データ=(.+?)、ファイルのサイズ', body)
            if mm:
                if mm.group(1).split(',') != head: return None
                crow = [r_.split(',') for r_ in mm.group(2).split('および')]
        if crow:
            if any(len(r_) != len(head) for r_ in crow): return None
            data = _pad_to(('\n'.join(j.join(r_) for r_ in [head] + crow) + '\n').encode('utf-8'), size)
            if data is None: return None
            size_note(size); NOTES.append(fill_note(size) + '。中身は文の「' + ' / '.join(j.join(r_) for r_ in crow) + '」の行')
            return data
    # 内容の指定が無い(または行数だけ)ファイルのサイズ指定: 見出しだけの有効な見出し + 改行で埋める
    if size and fid != 'M03-20' and not re.search(r'「|=', re.sub(r'^[^、]*(サイズ|バイト)[^、]*', '', body)) and rows is None:
        base = (j.join(head) + '\n').encode('utf-8')
        data = _pad_to(base, size)
        if data is None: return None
        size_note(size)
        NOTES.append(f'サイズ{size}バイト: 文は内容を指定していない。正しい見出し行だけを置き、先頭のBOMとゼロ幅スペースで{size}バイトに合わせた（改行で埋めると行数の上限に触れる。サイズの検査が内容の検査より先に働く前提）')
        return data
    return None

def generic2(fid, clause, name, seed_state):
    """見出し・データの書き方が定型の、いくつかの形。戻り値 bytes|None"""
    i = clause.find(name); rest = clause[i + len(name):]
    body = re.sub(r'^(は|=|の)\s*', '', rest)
    tab = name.endswith('.tsv')
    j = '\t' if tab else ','
    def out(head, rows): return ('\n'.join(j.join(c if tab or not re.search(r'[",\n]', c) else '"' + c.replace('"', '""') + '"' for c in r) for r in [head] + rows) + '\n').encode('utf-8')
    # P-KV: 「列=値、列=値、…」(見出しの列名ごとに分けて入れる。1欄に写さない)
    m = re.fullmatch(r'「((?:[^=、」]+=[^、」]*)(?:、[^=、」]+=[^、」]*)*)」', body)
    if m and fid in CODE_HEADS:
        head = CODE_HEADS[fid].split(',')
        kv = [x.split('=', 1) for x in m.group(1).split('、')]
        keys = [k for k, _ in kv]
        if sorted(keys) == sorted(head) and len(set(keys)) == len(keys):
            dd = {k: ('' if v == '空' else v) for k, v in kv}
            if keys != head: NOTES.append('列の並び: 文の「列=値」の並びを、見出しの列の順に並べ替えた')
            return out(head, [[dd[h] for h in head]])
    # P-A: 見出し行の列「A」「B」…・データ行の値「v」「v」…
    m = re.match(r'^見出し行の列((?:「[^」]+」)+)・データ行の値((?:「[^」]*」)+)$', body)
    if m:
        head = re.findall(r'「([^」]+)」', m.group(1)); row = ['' if c == '（空）' else c for c in re.findall(r'「([^」]*)」', m.group(2))]
        return out(head, [row]) if len(head) == len(row) else None
    # P-B: 見出し「H」・N行目「R」・N行目「R」
    m = re.match(r'^見出し「([^」]+)」((?:・\d+行目「[^」]*」)+)$', body)
    if m:
        head = m.group(1).split(','); rows = [r.split(',') for r in re.findall(r'\d+行目「([^」]*)」', m.group(2))]
        return out(head, rows)
    # P-D: 見出し1行と「R」のデータ行N行(末尾改行あり、改行数M)
    m = re.match(r'^見出し1行と「([^」]+)」のデータ行(\d+)行', body)
    if m and fid in CODE_HEADS:
        head = CODE_HEADS[fid].split(','); row = m.group(1).split(','); n = int(m.group(2))
        d = out(head, [row] * n)
        return d if _check_counts(d, clause) else None
    # P-E: N行目=A,1,1、N行目=B,... / N件目「A,B」 / データ順「A,B」「C,D」
    if fid in CODE_HEADS:
        head = CODE_HEADS[fid].split(',')
        b2 = re.sub(r'の1行(?:（[^）]*）)?$', '', body)
        items = re.findall(r'\d+[行件]目(?:は|=)?「?([^」、]+?)」?(?=、|$)', b2)
        if len(items) >= 1 and re.fullmatch(r'(?:\d+[行件]目(?:は|=)?「?[^」、]+?」?(?:、|$))+', b2):
            rows = [[('' if c == '空' else c) for c in re.split(r'[,・]', it)] for it in items]
            if all(len(r) == len(head) for r in rows): return out(head, rows)
        m = re.match(r'^(?:データ順|データ)((?:「[^」]*」)+)$', b2)
        if m:
            rows = [[('' if c == '空' else c) for c in x.split(',')] for x in re.findall(r'「([^」]*)」', m.group(1))]
            if all(len(r) == len(head) for r in rows): return out(head, rows)
        m = re.match(r'^((?:[^=・、]+,)+[^=・、]+)(?:と((?:[^=・、]+,)+[^=・、]+))*$', b2)
        if m and fid in ('M03-38',):
            rows = [[('' if c == '空' else c) for c in x.split(',')] for x in re.split(r'と', b2)]
            if all(len(r) == len(head) for r in rows): return out(head, rows)
    # P-M2: 見出し「A」「B」のタブ区切り・データ「x」「y」のタブ区切り
    m = re.fullmatch(r'見出し((?:「[^」]+」)+)の(?:タブ|カンマ)区切り・データ((?:「[^」]*」)+)の(?:タブ|カンマ)区切り', body)
    if m:
        hd = re.findall(r'「([^」]+)」', m.group(1)); rw = re.findall(r'「([^」]*)」', m.group(2))
        sep = '\t' if 'タブ' in body else ','
        if len(hd) == len(rw): return ('\n'.join(sep.join(r) for r in [hd, rw]) + '\n').encode('utf-8')
    # P-38: 3列見出しと行 / 見出しの商品IDを商品番号へ変更し、行を持つ
    if fid == 'M03-38':
        m = re.fullmatch(r'(?:Shift_JISの|先頭にBOMとゼロ幅スペースを持つ)3列見出しと(.+)', body)
        if m:
            row = m.group(1).split(',')
            if len(row) == 3:
                d = out(CODE_HEADS[fid].split(','), [row])
                if 'BOMとゼロ幅スペース' in body:
                    NOTES.append('先頭のBOMとゼロ幅スペース: 文は「先頭に持つ」。ファイルの先頭に BOM（U+FEFF）とゼロ幅スペース（U+200B）をこの順に置いた')
                    return b'\xef\xbb\xbf\xe2\x80\x8b' + d
                return d.decode('utf-8').encode('cp932')
        m = re.fullmatch(r'見出しの商品IDを商品番号へ変更し、(.+)を持つ', body)
        if m:
            hd = [('商品番号' if h == '商品ID' else h) for h in CODE_HEADS[fid].split(',')]
            return out(hd, [m.group(1).split(',')])
    # P-I: 見出しだけ
    if fid in CODE_HEADS and re.fullmatch(r'(?:設計の?\d列の|正規|正しい(?:\d列)?|定義済みの\d列の)?(?:見出し行?|ヘッダ)(?:だけ|のみ)(?:を持つ)?', body):
        return out(CODE_HEADS[fid].split(','), [])
    if fid in CODE_HEADS and re.fullmatch(r'正しい\d列ヘッダだけ|正規見出しだけ|見出しだけ', body):
        return out(CODE_HEADS[fid].split(','), [])
    # P-K: 見出し「H」だけ(見出しが機能の見出しと違う指定)
    m = re.fullmatch(r'の?見出し「([^」]+)」', body)
    if m: return out(m.group(1).split(','), [])
    # P-L: 「A,B」 / データ「A,B,C」 / データ=A,B,C (列数が見出しと違ってよい。文が書いたとおり)
    if fid in CODE_HEADS:
        m = re.fullmatch(r'(?:データ)?[=]?「([^」]*)」', body) or re.fullmatch(r'データ=([^、「」]+)', body) or re.fullmatch(r'のデータ「([^」]*)」', body)
        if m: return out(CODE_HEADS[fid].split(','), [[('' if c == '空' else c) for c in r_.split(',')] for r_ in m.group(1).split('および')])   # 「Aおよび B」は2行
    # P-N: 見出し行(A,B)と1データ行(x,y) / 見出し行（A・B）の次に、1行目x・タグID 21、2行目x・Bは空の2データ行
    m = re.match(r'^見出し行[（(]([^）)]+)[）)](?:と|の次に、)(?:\d+データ行[（(]([^）)]+)[）)])?(?:を持つ.*)?(.*)$', body)
    if m and fid in CODE_HEADS:
        head = CODE_HEADS[fid].split(',')
        hs = re.split(r'[,・]', m.group(1))
        if hs == head:
            def conv(cells, hd):
                out_ = []
                for k_, c in enumerate(cells):
                    c = c.strip()
                    if re.fullmatch(r'.+は空', c) or c == '空': c = ''
                    c = re.sub(r'^(?:タグID|売上分析タグ\(ID\)|商品ID) ?', '', c) if re.match(r'^(?:タグID|売上分析タグ\(ID\)) ?\S', c) else c
                    out_.append(c)
                return out_
            if m.group(2):
                return out(head, [conv(re.split(r'[,]', m.group(2)), head)])
            rr = re.findall(r'\d+行目([^、]*?)(?=、\d+行目|の\d+データ行|$)', m.group(3))
            rows = [conv(re.split(r'・', x), head) for x in rr if x]
            if rows and all(len(r) == len(head) for r in rows): return out(head, rows)
    # P-M: データ1行目「a」「b」・2行目「c」「d」 (見出しは 見出し「A」「B」 で別に書く)
    m = re.match(r'^見出し((?:「[^」]+」)+)、データ((?:\d+行目(?:「[^」]*」)+・?)+)$', body)
    if m:
        head = re.findall(r'「([^」]+)」', m.group(1))
        rows = [re.findall(r'「([^」]*)」', seg) for seg in re.findall(r'\d+行目((?:「[^」]*」)+)', m.group(2))]
        if all(len(r) == len(head) for r in rows): return out(head, rows)
    # P-O: データ行=A,B および C,D (M04-24)
    m = re.match(r'^データ行=(.+)$', body)
    if m and fid in CODE_HEADS:
        head = CODE_HEADS[fid].split(',')
        rows = [x.split(',') for x in re.split(r'および', m.group(1))]
        if all(len(r) == len(head) for r in rows): return out(head, rows)
    # P-C2: 「A・B・Cが V」「列 V」「列=V」「列空」を並べた行(M03-30/31)。商品ID・言語IDは、書かれていなければシード表の状態・属性の同じシードの値
    if fid in ('M03-30', 'M03-31'):
        head = CODE_HEADS[fid].split(',')
        row = {}; ok = True
        for seg in [x for x in re.split(r'、|・(?=[^・]*(?:が|=|空|\d))', body) if x]:
            pass
        segs = [x for x in re.split(r'、', body) if x]
        if len(segs) == 1: segs = [x for x in re.split(r'・', body) if x]
        for seg in segs:
            seg = seg.strip()
            mg = re.fullmatch(r'((?:[^・が=]+・)*[^・が=]+)が(-?\d+)', seg)
            if mg:
                for c in mg.group(1).split('・'):
                    if c not in head: ok = False
                    row[c] = mg.group(2)
                continue
            mv = re.fullmatch(r'(' + '|'.join(map(re.escape, sorted(head, key=len, reverse=True))) + r')\s*[=＝]?\s*(空|-?\d+)', seg)
            if mv: row[mv.group(1)] = '' if mv.group(2) == '空' else mv.group(2); continue
            mt = re.fullmatch(r'(帯URL|タグ)空', seg)
            if mt: row['帯URL' if mt.group(1) == '帯URL' else 'タグ(ID)'] = ''; continue
            ok = False
        if ok and row:
            pid = re.search(r'〔商品ID-[^〕]+〕', seed_state); lang = re.search(r'言語ID=(\d+)', seed_state)
            row.setdefault('商品ID', pid.group(0) if pid else None); row.setdefault('言語ID', lang.group(1) if lang else '1')
            if row['商品ID'] is not None and all(h in row for h in head):
                NOTES.append('商品ID・言語ID: ファイルの文に無いので、シード表の状態・属性が同じシードに書く商品ID（呼び名）・言語IDを入れた')
                return out(head, [[row[h] for h in head]])
    # P-C: 列=値の並びだけ(商品ID・言語IDは、シード表の状態・属性の同じ名前の値)
    if fid in ('M03-30', 'M03-31') and re.fullmatch(r'(?:[^=・]+=-?\d+(?:・|$))+', body + ('' if body.endswith('・') else '')):
        head = CODE_HEADS[fid].split(',')
        given = dict((a, b) for a, b in re.findall(r'([^=・]+)=(-?\d+)', body))
        if any(k not in head for k in given): return None
        pid = re.search(r'〔商品ID-[^〕]+〕', seed_state)
        lang = re.search(r'言語ID=(\d+)', seed_state)
        row = {'商品ID': pid.group(0) if pid else None, '言語ID': lang.group(1) if lang else '1'}
        row.update(given)
        if row['商品ID'] is None or any(h not in row for h in head if h not in ('原価単価',) or fid == 'M03-30'): return None
        NOTES.append('商品ID・言語ID: ファイルの文に無いので、シード表の状態・属性が同じシードに書く商品ID（呼び名）・言語IDを入れた')
        return out(head, [[row[h] for h in head]])
    return None

def _peel(body):
    mods = {'enc': 'utf-8', 'eol': '\n', 'tab': False, 'bom': False}
    if re.search(r'Shift_JIS|シフトJIS', body): mods['enc'] = 'cp932'
    if 'CRLF' in body: mods['eol'] = '\r\n'
    elif re.search(r'(?<![A-Za-z])CR(?![A-Za-z])', body): mods['eol'] = '\r'
    if 'タブ区切り' in body: mods['tab'] = True
    if re.search(r'バイト順序記号|BOM', body): mods['bom'] = True
    b = re.sub(r'(?:拡張子(?:csv|tsv)・)?(?:UTF[-－‐]8のバイト順序記号付き|UTF[-－‐]8|Shift_JIS|シフトJIS|CRLF|(?<![A-Za-z])CR(?![A-Za-z])|(?<![A-Za-z])LF(?![A-Za-z])|カンマ区切り|タブ区切り|バイト順序記号を持ち|先頭にUTF[-－‐]8 BOMを持ち|UTF[-－‐]8のバイト順序記号付き)(?:で|・|、)?', '', body)
    return mods, b.strip('・、 ')

ZW = '\u200b'; BOMC = '\ufeff'
def zw_case(sid, name):
    """ゼロ幅文字の位置の指定があるファイル。位置が文にあるものは文のとおり、無いものは担当が決めて備考に書く"""
    def put(rows, head, sep=',', eol='\n', bom=False, lead=''):
        t = eol.join(sep.join(r) for r in [head] + rows) + eol
        return ((b'\xef\xbb\xbf' if bom else b'') + (lead + t).encode('utf-8'))
    if sid == 'S-M03-35-CASE-014' and name == 'm0335_zwsp-014.csv':
        NOTES.append('ゼロ幅空白の位置: 商品コード FMT-ZWSP-001-014 の「FMT-」の直後、部門コード 32 の「3」と「2」の間（文の指定どおり）。ゼロ幅空白は U+200B')
        return put([[f'FMT-{ZW}ZWSP-001-014', f'3{ZW}2']], ['商品コード', '部門コード(ID)'])
    if sid == 'S-M03-37-DATA-011' and name == 'm0337_bom_zwsp-011.csv':
        NOTES.append('見出し先頭の BOM（U+FEFF）と、略称タグ値「P」と「RE」の間の U+200B は文の指定どおり')
        return put([['〔商品ID-M0337-011〕', f'P{ZW}RE']], ['商品ID', '略称タグ'], bom=True)
    if sid == 'S-M03-33-FORMAT-PRODUCTS-025' and name == 'zero_width-025.csv':
        NOTES.append(f'ゼロ幅空白（U+200B）の位置: 文は「行頭と商品コードの途中」。行頭と、商品コード ZW-001-025 の「ZW」の直後（途中の位置は文に無いので担当が決めた）。7つの値は設計書の並び（商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ・最後の1値）で、書かれない値は空')
        return put([[f'{ZW}ZW{ZW}-001-025', '1200', '700', '1', '', '', '']], ['商品コード', '販売価格', 'セールフラグ', '帯URL', 'タグ(ID)'])
    if sid == 'S-M03-40-DATA-011' and name == 'm0340-bom-zwsp-011.csv':
        NOTES.append('先頭の BOM と、棚番号名称「S-」と「002-011」の間の U+200B は文の指定どおり')
        return put([['34001101', f'S-{ZW}002-011']], ['商品コード', '棚番号名称'], bom=True)
    if sid == 'S-M03-30-DATA-026' and name == 'normalize.tsv':
        NOTES.append(f'ゼロ幅文字の位置: 文は「商品ID・言語ID・基準価格・買取価格の前後に含み」。各値の前に U+200B（ゼロ幅スペース）、後ろに U+FEFF（ゼロ幅ノーブレークスペース）を置いた。原価単価は 350（文のとおり）')
        w = lambda v: f'{ZW}{v}{BOMC}'
        return put([[w('〔商品ID-M0330-026〕'), w('1'), w('1200'), w('500'), '350']], ['商品ID', '言語ID', '基準価格', '買取価格', '原価単価'], sep='\t', eol='\r\n')
    if sid == 'S-M03-31-DATA-054' and name == 'zero-width-space-054.csv':
        NOTES.append('商品ID欄の U+200B: 先頭に1つ置いた。「桁の途中1か所」は、控えた番号の左から2桁目の後ろに U+200B を1つ足してから取り込む（番号の桁数は画面が決めるので、〔…〕の中には入れていない）')
        return put([[f'{ZW}〔商品ID-M0331-054〕', '1', '1500', '500', '1', '', '']], ['商品ID', '言語ID', '販売価格', '買取価格', 'セールフラグ', '帯URL', 'タグ(ID)'])
    if sid == 'S-M03-32-DATA-031' and name == 'invisible-031.csv':
        NOTES.append('見出し「商品コード」の途中の BOM（U+FEFF）は「商」と「品」の間、HIGH-N-0001-031 の途中の U+200B は「HIGH-N-」の直後に置いた（途中の位置は文に無いので担当が決めた）。基準価格は 1500（文のとおり）')
        return put([[f'HIGH-N-{ZW}0001-031', '1500']], [f'商{BOMC}品コード', '基準価格'])
    return None

def generic(fid, clause, name):
    dz = zw_case(CTX.get('sid', ''), name)
    if dz is not None: return dz
    # 「ファイル名=x.csv／見出し行は…／データ行は1行=商品ID 〔L〕・商品タグ(ID) 〔L〕／UTF-8・カンマ区切り」: データ行は、状態・属性の次の項目に書いてある
    if re.fullmatch(r'.*ファイル名=' + re.escape(name), clause) and fid in GEN:
        md = re.search(r'データ行は(?:\d+行)?=(.+?)(?:／|$)', CTX.get('state', ''))
        if md:
            d_ = _generic_core(fid, name + 'は' + md.group(1), name)
            if d_ is not None:
                NOTES.append('データ行: 状態・属性の「ファイル名=…」の次の項目（データ行は…）から読んだ')
                return d_
    d0 = generic2(fid, clause, name, CTX.get('state', ''))
    if d0 is not None: return d0
    i = clause.find(name); head_ = clause[:i + len(name)]; rest = clause[i + len(name):]
    m = re.match(r'^(は|=|の)(.*)$', rest)
    if m and fid in CODE_HEADS and re.search(r'Shift_JIS|シフトJIS|CRLF|(?<![A-Za-z])CR(?![A-Za-z])|LFで|タブ区切り|BOM|バイト順序記号|カンマ区切り|UTF[-－‐]8', m.group(2)):
        if not re.search(r'ゼロ幅|不可視|バイト(?!順序)|MB', m.group(2)):
            mods, b2 = _peel(m.group(2))
            inner = INNER(fid, head_ + '=' + b2, name) if INNER else _generic_core(fid, head_ + '=' + b2, name)
            if inner is None: inner = _generic_core(fid, head_ + '=' + b2, name)
            if inner is not None:
                text = inner.decode('utf-8', 'replace')
                if mods['tab'] and not name.endswith('.tsv'):
                    text = '\n'.join('\t'.join(c.strip('"') for c in row_split(l)) for l in text.split('\n'))
                text = text.replace('\n', mods['eol'])
                data = text.encode('utf-8') if mods['enc'] == 'utf-8' else text.encode('cp932')
                return (b'\xef\xbb\xbf' + data) if mods['bom'] else data
    return _generic_core(fid, clause, name)

def _generic_core(fid, clause, name):
    d2 = generic2(fid, clause, name, CTX.get('state', ''))
    if d2 is not None: return d2
    d3 = bulk(fid, clause, name, CTX.get('state', ''))
    if d3 is not None: return d3
    if fid not in GEN: return None
    head, alias = GEN[fid]
    i = clause.find(name); rest = clause[i + len(name):]
    body = re.sub(r'^(は|=|の)\s*', '', rest)
    # 形式の指定(文字コード・改行・区切り・BOM)を外して、本体を読む
    enc = 'cp932' if 'Shift_JIS' in body else 'utf-8'
    eol = '\r\n' if 'CRLF' in body else ('\r' if re.search(r'CRで|CR・', body) else '\n')
    tab = name.endswith('.tsv') or 'タブ区切り' in body
    bom = 'バイト順序記号' in body or 'BOM' in body
    if re.search(r'ゼロ幅|5009|行|バイト(?!順序)|MB', re.sub(r'\d+行目|行を|1行|の1行|データ行', '', body)) and not re.search(r'\d+行目', body): return None
    body = re.sub(r'Shift_JIS|CRLF|CRで|LFで|UTF-8|バイト順序記号を持ち|BOMを持ち|をタブ区切りで(保持|持つ)|タブ区切りの?|カンマ区切り|・', lambda m_: '・' if m_.group(0) == '・' else '', body)
    body = body.strip('、 ')
    body = re.sub(r'^(正規見出しと|\d+列見出しと|見出しと|の?データ)\s*', '', body)
    body = re.sub(r'^「([^」]*)」$', r'\1', body) if body.count('「') == 1 else body
    if body.startswith('見出し') or '見出し' in body[:4]: return None
    rows = []
    for r_ in _split_rows(body):
        r_ = re.sub(r'^(「)|(」)$', '', r_) if r_.count('「') + r_.count('」') == 1 else r_
        cells = None
        # 列名つき: 商品ID 〔…〕・タグID 〔…〕
        names = sorted(list(head) + list(alias), key=lambda x: -len(x))
        pat = '(' + '|'.join(map(re.escape, names)) + r')\s*[=＝]?\s*((?:〔[^〕]+〕|「[^」]*」|[^・、〔「])+)'
        found = re.findall(pat, r_)
        if found and len(found) >= len(head) and ''.join(a + b for a, b in found).replace(' ', '') != '':
            d = {alias.get(a, a): _cell(b) for a, b in found}
            if any(v_ == '\0' for v_ in d.values()): return None
            if all(h in d for h in head): cells = [d[h] for h in head]
        if cells is None:
            toks = [t for t in re.split(r'[・]', r_) if t.strip() != ''] if '・' in r_ and '"' not in r_ else None
            if toks is None:
                toks = row_split(r_)
            if any(re.search('|'.join(map(re.escape, list(head) + list(alias))), t_) and ('=' in t_ or re.match('|'.join(map(re.escape, list(head) + list(alias))), t_)) for t_ in toks): return None   # 列名つきの語を値として取り込まない
            if len(toks) == len(head) or (fid == 'M03-33' and len(toks) >= len(head)):
                cells = [_cell(t) for t in toks]
        if cells is None: return None
        rows.append(cells)
    if not rows: return None
    # 引用符の外の「,」だけで区切った行(行は ,で区切る)
    j = '\t' if tab else ','
    text = eol.join(j.join(c if not (not tab and re.search(r'[",\n]', c)) else '"' + c.replace('"', '""') + '"' for c in r_) for r_ in [head] + rows) + eol
    data = text.encode('utf-8') if enc == 'utf-8' else _sjis(text)
    return (b'\xef\xbb\xbf' + data) if bom else data
def row_split(txt):
    out = []; cur = ''; q = False
    for ch in txt:
        if ch == '"': q = not q; cur += ch
        elif ch == ',' and not q: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur)
    return [c.strip('"') if c.startswith('"') and c.endswith('"') else c for c in out]

CODE_HEADS = {'M03-16': 'ID,名称,並び順', 'M03-20': 'ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ', 'M03-21': 'ID,名称,並び順', 'M03-28': '商品ID,商品タグ(ID)', 'M03-29': '商品ID,売上分析タグ(ID)', 'M03-30': '商品ID,言語ID,基準価格,買取価格,原価単価', 'M03-31': '商品ID,言語ID,販売価格,買取価格,セールフラグ,帯URL,タグ(ID)', 'M03-32': '商品コード,基準価格', 'M03-37': '商品ID,略称タグ', 'M03-38': '商品ID,商品公開ステータス,支店の商品公開ステータス', 'M03-40': '商品コード,棚番号名称', 'M03-41': 'カテゴリID,表示ランク,カテゴリ名(日),カテゴリ名(英),親カテゴリID,階層,フロント非表示フラグ,支店非表示フラグ,検索パラメータ,最新セット用バナー画像パス,カテゴリアイコン画像パス,対象商品数', 'M04-24': '移動指示ID,送り状No.', 'M04-21': '商品コード,在庫増減数,仕入単価', 'M03-35': '商品コード,部門コード(ID)', 'M03-33': '商品コード,販売価格,セールフラグ,帯URL,タグ(ID)'}
# ---------------- M03-41 カテゴリCSV ----------------
# 新規の行で文が書かない必須の値の既定値は、作り方のコード e2e/seeds/m03-41.ts の newRow・fillerEn(カテゴリ名(英)=「M0341 <ファイル名から .csv を除いたもの>」・親カテゴリID=0・両非表示フラグ=0)に合わせる
HEAD41 = ['カテゴリID', '表示ランク', 'カテゴリ名(日)', 'カテゴリ名(英)', '親カテゴリID', '階層', 'フロント非表示フラグ', '支店非表示フラグ', '検索パラメータ', '最新セット用バナー画像パス', 'カテゴリアイコン画像パス', '対象商品数']
def _path41(prefix, n): return f'{prefix}{"x" * (n - len(prefix) - 4)}.png'   # 作り方のコード(m03-41.ts の pathOf)と同じ。前置きもコードの値
def _before(col): return f'〔取込前の{col}〕'
def rule_m0341_update(clause, name, seed_state, seed_how=''):
    """ID を指定して更新・削除する行。取込前の値を写す列は、呼び名〔取込前の<列名>〕（カテゴリ一覧のCSVダウンロードの、そのカテゴリの行の値）にする"""
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^は(.+)$', rest)
    if not m: return None
    body = m.group(1)
    mself = re.fullmatch(r'ID (〔[^〕]+〕)を自己親に指定|カテゴリIDと親カテゴリIDがともに(〔[^〕]+〕)', body)
    if mself:
        L = mself.group(1) or mself.group(2)
        row = {c: _before(c) for c in HEAD41}; row['カテゴリID'] = L; row['親カテゴリID'] = L
        return ('\n'.join(','.join(cell(row.get(h, '')) for h in HEAD41) if k else ','.join(HEAD41) for k in [0, 1]) + '\n').encode('utf-8')
    mp = re.fullmatch(r'カテゴリIDが(〔[^〕]+〕)の先頭に0を足して(\d+)桁にした値、表示ランク(\d+)、親カテゴリIDが(〔[^〕]+〕)の先頭に0を足して\d+桁にした値|カテゴリIDが(〔[^〕]+〕)の先頭に0を足して(\d+)桁にした値|表示ランク(0\d+)|親カテゴリIDが(〔[^〕]+〕)の先頭に0を足して(\d+)桁にした値', body)
    if mp:
        g = mp.groups(); row = {c: _before(c) for c in HEAD41}
        def pad(L, n): return f'〔{n}桁にしたカテゴリID（{L[1:-1]}の先頭に0を足す）〕'
        if g[0]: row['カテゴリID'] = pad(g[0], g[1]); row['表示ランク'] = g[2]; row['親カテゴリID'] = pad(g[3], g[1])
        elif g[4]: row['カテゴリID'] = pad(g[4], g[5])
        elif g[6]: row['表示ランク'] = g[6]
        elif g[7]: row['親カテゴリID'] = pad(g[7], g[8])
        row = {k_: v for k_, v in row.items()}
        if not row['カテゴリID'].startswith('〔') and not g[6]: pass
        row['カテゴリID'] = row['カテゴリID'] if g[0] or g[4] else (re.search(r'〔カテゴリID-[^〕]+〕', CTX.get('state', '')) or [_before('カテゴリID')])[0] if False else row['カテゴリID']
        NOTES.append('先頭に0を足した桁数の値: 控えた番号の先頭に0を足して指定の桁数にした値に置き換える（〔N桁にしたカテゴリID（…）〕の所）')
        NOTES.append('〔取込前の<列名>〕: カテゴリ一覧の「CSVダウンロード」で出力したCSVの、そのカテゴリIDの行の同じ列の値に置き換えてから取り込む')
        return ('\n'.join(','.join(cell(row.get(h, '')) for h in HEAD41) if k else ','.join(HEAD41) for k in [0, 1]) + '\n').encode('utf-8')
    if not re.match(r'^(?:ID|カテゴリID|更新対象カテゴリID|カテゴリIDが)\s*', body) and not re.match(r'^(?:ID)', body): return None
    row = {c: _before(c) for c in HEAD41}
    toks = [t.strip() for t in re.split(r'、', body) if t.strip()]
    delete = None
    for k_, t in enumerate(toks):
        q = re.match(r'^(?:更新対象)?(?:カテゴリ)?ID\s*(〔[^〕]+〕|\d+|abc)で?(?:、?ほかの値は有効)?$', t) or re.match(r'^ID\s*(〔[^〕]+〕|\d+|abc)(?:かつ表示ランク空)?$', t)
        if q and k_ == 0:
            row['カテゴリID'] = q.group(1)
            if 'かつ表示ランク空' in t: row['表示ランク'] = ''
            continue
        q = re.match(r'^表示ランク(\d+|abc|空)$', t)
        if q: row['表示ランク'] = '' if q.group(1) == '空' else q.group(1); continue
        if t == '表示ランクは登録済みの値': continue   # 〔取込前の表示ランク〕のまま
        q = re.match(r'^(?:名称|カテゴリ名\(日\))(?:「([^」]+)」|(空)|([^「、空]+))$', t)
        if q: row['カテゴリ名(日)'] = q.group(1) or ('' if q.group(2) else q.group(3)); continue
        q = re.match(r'^(?:英名|カテゴリ名\(英\))(.+)$', t)
        if q: row['カテゴリ名(英)'] = q.group(1); continue
        q = re.match(r'^親(?:カテゴリ)?ID\s*(〔[^〕]+〕|\d+|abc)$', t) or re.match(r'^親(0)$', t)
        if q: row['親カテゴリID'] = q.group(1); continue
        q = re.match(r'^(?:CSV上の)?階層(\d+)$', t)
        if q: row['階層'] = q.group(1); continue
        if t == '両非表示フラグ0' or t == '両非表示フラグ1':
            row['フロント非表示フラグ'] = row['支店非表示フラグ'] = t[-1]; continue
        q = re.match(r'^(?:CSV上の)?対象商品数(\d+)$', t)
        if q: row['対象商品数'] = q.group(1); continue
        q = re.match(r'^削除フラグ(\d)で?$', t)
        if q: delete = q.group(1); continue
        q = re.match(r'^検索(?:パラメータ)?(rarity=\d+)$', t)
        if q: row['検索パラメータ'] = q.group(1); continue
        q = re.match(r'^(?:最新セット用)?バナー画像パス(img/\S+)$', t)
        if q: row['最新セット用バナー画像パス'] = q.group(1); continue
        q = re.match(r'^(?:カテゴリ)?アイコン画像パス(img/\S+)$', t)
        if q: row['カテゴリアイコン画像パス'] = q.group(1); continue
        if t == '新画像パス2種':
            no = re.search(r'-(\d+)', name).group(1)
            row['最新セット用バナー画像パス'] = f'img/category/setbanner/m0341-banner-{no}.png'; row['カテゴリアイコン画像パス'] = f'img/category/icon/m0341-icon-{no}.png'
            NOTES.append('新画像パス2種: 文は値を書いていない。同じシード表の CASE-048〜050 が書く名前の付け方（img/category/setbanner/m0341-banner-<番号>.png と img/category/icon/m0341-icon-<番号>.png）に合わせた'); continue
        if t in ('ほかの値は有効', '登録内容に対応する有効値'): continue
        return None
    head = list(HEAD41)
    if delete is not None:
        head.append('削除フラグ'); row['削除フラグ'] = delete
        NOTES.append('削除フラグ: アプリの雛形（12列）に無い列。文が値を書くこのファイルだけ、末尾に列「削除フラグ」を足した（作り方のコード e2e/seeds/m03-41.ts と同じ扱い）')
    if any(v.startswith('〔取込前の') for v in row.values()):
        NOTES.append('〔取込前の<列名>〕: 文が「ほかの値は有効」「取込前の値」とする列。カテゴリ一覧の「CSVダウンロード」で出力したCSVの、そのカテゴリIDの行の同じ列の値に置き換えてから取り込む')
    return ('\n'.join(','.join(cell(row.get(h, '')) for h in head) if k else ','.join(head) for k in [0, 1]) + '\n').encode('utf-8')

def _new41(file, nm, ja=True):
    row = {'カテゴリID': '', '表示ランク': '', 'カテゴリ名(日)': nm, 'カテゴリ名(英)': 'M0341 ' + re.sub(r'\.csv$', '', file), '親カテゴリID': '0', 'フロント非表示フラグ': '0', '支店非表示フラグ': '0'}
    return row
def rule_m0341_040(clause, name):
    m = re.fullmatch(r'.*?は?カテゴリ名\(英\)、カテゴリID、親カテゴリID、カテゴリ名\(日\)の順から始まる全列と新規カテゴリ「([^」]+)」1行', clause[clause.find(name) + len(name):] if name in clause else '')
    if not m: return None
    first = ['カテゴリ名(英)', 'カテゴリID', '親カテゴリID', 'カテゴリ名(日)']
    head = first + [h for h in HEAD41 if h not in first]
    row = {'カテゴリ名(英)': 'Reordered Category-040', 'カテゴリID': '', '親カテゴリID': '0', 'カテゴリ名(日)': m.group(1), 'フロント非表示フラグ': '1', '支店非表示フラグ': '0',
           '検索パラメータ': 'rarity=40', '最新セット用バナー画像パス': 'img/category/setbanner/m0341-banner-040.png', 'カテゴリアイコン画像パス': 'img/category/icon/m0341-icon-040.png', '表示ランク': '', '階層': '', '対象商品数': ''}
    NOTES.append('列順を変えた全列の値: 文は日名しか書かない。ほかの値（英名・フロント非表示フラグ1・支店非表示フラグ0・検索パラメータrarity=40・画像パス）は作り方のコード e2e/seeds/m03-41.ts の M0341_VALUES.列順040 の値')
    return ('\n'.join(','.join(cell(row.get(h, '')) for h in head) if k else ','.join(head) for k in [0, 1]) + '\n').encode('utf-8')

def rule_m0341(clause, name, seed_state, seed_how=''):
    d40 = rule_m0341_040(clause, name)
    if d40 is not None: return d40
    u = rule_m0341_update(clause, name, seed_state, seed_how)
    if u is not None: return u
    i0 = clause.find(name); rest0 = clause[i0 + len(name):]
    m = re.fullmatch(r'は見出し行、正常な新規カテゴリ「([^」]+)」、カテゴリ名\(日\)が空の行の順', rest0)
    if m:
        r1 = _new41(name, m.group(1)); r2 = _new41(name, ''); r2['カテゴリ名(英)'] = r1['カテゴリ名(英)'] + '-2'
        NOTES.append('2行目の英名: 日名を空にする行の識別のため、1行目の英名に「-2」を付けた（作り方のコードと同じ）')
        return ('\n'.join(','.join(cell(r.get(h, '')) for h in HEAD41) if r else ','.join(HEAD41) for r in [None, r1, r2]) + '\n').encode('utf-8')
    m = re.fullmatch(r'は1行目から新規カテゴリ「([^」]+)」のデータ', rest0)
    if m: return (','.join(cell(_new41(name, m.group(1)).get(h, '')) for h in HEAD41) + '\n').encode('utf-8')
    m = re.fullmatch(r'はカテゴリ名\(日\)列を省いた見出しと新規カテゴリ「([^」]+)」の1データ行', rest0)
    if m:
        hd = [h for h in HEAD41 if h != 'カテゴリ名(日)']; r_ = _new41(name, ''); r_['カテゴリ名(英)'] = m.group(1)
        NOTES.append('カテゴリ名(日)列を省いたファイル: 識別用の名前は、カテゴリ名(英)に書いた（作り方のコードと同じ）')
        return ('\n'.join(','.join(cell(r_.get(h, '')) for h in hd) if k else ','.join(hd) for k in [0, 1]) + '\n').encode('utf-8')
    m = re.fullmatch(r'はシフトJIS・CRLF・カンマ区切りで、カテゴリ名\(日\)「([^」]+)」を二重引用符で囲んだ1行', rest0)
    if m:
        r_ = _new41(name, m.group(1)); t = '\r\n'.join([','.join(HEAD41), ','.join(('"' + r_[h] + '"') if h == 'カテゴリ名(日)' else cell(r_.get(h, '')) for h in HEAD41)]) + '\r\n'
        return t.encode('cp932')
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^は(.+)$', rest)
    if not m: return None
    body = m.group(1)
    row = {'カテゴリID': '', '表示ランク': '', 'カテゴリ名(英)': 'M0341 ' + re.sub(r'\.csv$', '', name), '親カテゴリID': '0', 'フロント非表示フラグ': '0', '支店非表示フラグ': '0'}
    # 「NAME」の<列>だけが空 / 「NAME」で<列>… / 「NAME」(識別名)
    mm = re.match(r'^「([^」]+)」の(カテゴリ名\(日\)|カテゴリ名\(英\)|親カテゴリID|フロント非表示フラグ|支店非表示フラグ)だけが空$', body)
    if mm:
        nm, col = mm.groups()
        if col == 'カテゴリ名(日)': row['カテゴリ名(日)'] = ''; row['カテゴリ名(英)'] = nm   # 日名を空にするファイルは識別名を英名に書く(作り方のコードと同じ)
        else: row['カテゴリ名(日)'] = nm; row[col] = ''
    else:
        lead = re.match(r'^「([^」]+)」で(.+)$', body)
        if lead: row['カテゴリ名(日)'] = lead.group(1); body = lead.group(2); lead_name = lead.group(1)
        else: lead_name = None
        body = re.sub(r'の新規カテゴリ$', '', body) if '×' in body else body
        if '×' in body and not lead: row['カテゴリ名(日)'] = None
        toks = [t.strip() for t in re.split(r'、', body) if t.strip()]
        for t in toks:
            q = re.match(r'^新規(?:最上位)?カテゴリ「([^」]+)」(?:で|1行)?(?:（カテゴリIDと表示ランクは空）)?$', t)
            if q: row['カテゴリ名(日)'] = q.group(1); continue
            q = re.match(r'^英名(.+)$', t)
            if q: row['カテゴリ名(英)'] = q.group(1); continue
            if t == '親カテゴリIDが空': row['親カテゴリID'] = ''; continue
            q = re.match(r'^(?:CSV上の)?対象商品数(\d+)$', t)
            if q: row['対象商品数'] = q.group(1); continue
            q = re.match(r'^削除フラグ(\d)$', t)
            if q: row['削除フラグ'] = q.group(1); continue
            q = re.match(r'^カテゴリ名\(日\)(?:「([^」]+)」|(.)×(\d+))$', t)
            if q: row['カテゴリ名(日)'] = q.group(1) if q.group(1) is not None else q.group(2) * int(q.group(3)); continue
            q = re.match(r'^カテゴリ名\(英\)(?:「([^」]+)」|(.)×(\d+))$', t)
            if q: row['カテゴリ名(英)'] = q.group(1) if q.group(1) is not None else q.group(2) * int(q.group(3)); continue
            q = re.match(r'^検索パラメータ(.)×(\d+)$', t)
            if q: row['検索パラメータ'] = q.group(1) * int(q.group(2)); continue
            q = re.match(r'^親カテゴリID\s*(〔[^〕]+〕|\d+|abc)$', t)
            if q: row['親カテゴリID'] = q.group(1); continue
            q = re.match(r'^CSV上の階層(\d+)$', t)
            if q: row['階層'] = q.group(1); continue
            q = re.match(r'^(フロント|支店)非表示フラグ(\d+)$', t)
            if q: row[q.group(1) + '非表示フラグ'] = q.group(2); continue
            q = re.match(r'^(?:最新セット用)?バナー画像パス(\d+)文字$', t)
            if q: row['最新セット用バナー画像パス'] = _path41('img/category/setbanner/', int(q.group(1))); continue
            q = re.match(r'^(?:カテゴリ)?アイコン画像パス(\d+)文字$', t)
            if q: row['カテゴリアイコン画像パス'] = _path41('img/category/icon/', int(q.group(1))); continue
            if re.match(r'^(検索パラメータ|最新セット用バナー画像パス|カテゴリアイコン画像パス)(、.*)?が空$', t) or t in ('カテゴリアイコン画像パスが空', '最新セット用バナー画像パスが空', '検索パラメータ', '最新セット用バナー画像パス', 'カテゴリアイコン画像パス'): continue
            q = re.match(r'^新規カテゴリ「([^」]+)」で$', t)
            if q: row['カテゴリ名(日)'] = q.group(1); continue
            q = re.match(r'^親ID\s*(〔[^〕]+〕|\d+)$', t)
            if q: row['親カテゴリID'] = q.group(1); continue
            q = re.match(r'^検索パラメータ(rarity=\d+)$', t)
            if q: row['検索パラメータ'] = q.group(1); continue
            q = re.match(r'^両非表示フラグ(\d)$', t)
            if q: row['フロント非表示フラグ'] = row['支店非表示フラグ'] = q.group(1); continue
            return None
        if lead_name and row.get('カテゴリ名(日)') not in (lead_name, None):
            row['カテゴリ名(英)'] = lead_name if row['カテゴリ名(英)'].startswith('M0341 ') else row['カテゴリ名(英)']   # 日名を長い値にするファイルは、識別名を英名に書く(作り方のコードと同じ)
        if lead_name and row.get('カテゴリ名(英)') not in (lead_name,) and row['カテゴリ名(日)'] == lead_name and any(t.startswith('カテゴリ名(英)') or t.startswith('検索パラメータ') for t in toks): pass
        if row.get('カテゴリ名(日)') is None: return None
    if row.get('カテゴリ名(日)') is None and not mm: return None
    _del41 = row.pop('削除フラグ', None) if '削除フラグ' in row else None
    if mm is None and '新規' not in body and 'カテゴリ名(日)' not in row: return None
    if row.get('カテゴリ名(日)', 'x') == 'x': return None
    head_ = list(HEAD41)
    if _del41 is not None:
        head_.append('削除フラグ'); row['削除フラグ'] = _del41
        NOTES.append('削除フラグ: アプリの雛形（12列）に無い列。文が値を書くこのファイルだけ、末尾に列「削除フラグ」を足した（作り方のコード e2e/seeds/m03-41.ts と同じ扱い）')
    return ('\n'.join(','.join(cell(row.get(h, '')) for h in head_) if k else ','.join(head_) for k in [0, 1]) + '\n').encode('utf-8')

# ---------------- M03-26 カード商品CSV ----------------
# 列は、アプリの雛形(CardCsvController::getStructuredImportHeaders)の30列。文は「31列」(商品削除フラグを含む)と書くので、文が商品削除フラグの値を書くファイルだけ、末尾に列を足す
CARD_HEAD = ['商品ID', '言語(ID)', '商品公開ステータス', '支店の商品公開ステータス', '商品名(日)', '商品名(英)', 'サイズ', '重量', '商品説明(日)', '商品説明(英)', '買取商品説明(日)', '買取商品説明(英)', '検索ワード', '規格画像', '商品カテゴリ(ID)', '購入グループ名称', '割引率(ID)', '買取減額率(ID)', '略称タグ(ID)', '売上分析タグ(ID)', 'タグ(ID)', '発送日目安(ID)', '販売制限数', '基準価格', '販売価格', '買取価格', '原価単価', 'カード詳細(ID)', '地域別販売制限', 'フリーエリア']
CARD_ALIAS = [('支店の商品公開ステータス', '支店の商品公開ステータス'), ('支店公開', '支店の商品公開ステータス'), ('商品公開ステータス', '商品公開ステータス'), ('公開', '商品公開ステータス'),
  ('言語(ID)', '言語(ID)'), ('言語', '言語(ID)'), ('商品名(日)', '商品名(日)'), ('商品名(英)', '商品名(英)'), ('商品名', '商品名'), ('サイズ', 'サイズ'), ('重量', '重量'),
  ('商品カテゴリ(ID)', '商品カテゴリ(ID)'), ('カテゴリID', '商品カテゴリ(ID)'), ('カテゴリ', '商品カテゴリ(ID)'), ('購入グループ名称', '購入グループ名称'), ('購入グループ', '購入グループ名称'),
  ('割引率', '割引率(ID)'), ('割引', '割引率(ID)'), ('買取減額率', '買取減額率(ID)'), ('略称タグ', '略称タグ(ID)'), ('売上分析タグ', '売上分析タグ(ID)'), ('タグ', 'タグ(ID)'),
  ('発送日目安', '発送日目安(ID)'), ('販売制限数', '販売制限数'), ('基準価格', '基準価格'), ('基準', '基準価格'), ('販売価格', '販売価格'), ('販売', '販売価格'), ('買取価格', '買取価格'), ('買取', '買取価格'),
  ('原価単価', '原価単価'), ('原価', '原価単価'), ('カード詳細ID', 'カード詳細(ID)'), ('地域別販売制限', '地域別販売制限'), ('地域制限', '地域別販売制限'), ('商品削除フラグ', '商品削除フラグ'), ('商品ID', '商品ID')]
CARD_ALIAS = sorted(set(CARD_ALIAS) | {(c, c) for c in CARD_HEAD}, key=lambda x: -len(x[0]))
# 「他項目は正常値」の値は、シード表 M03-26 の LIMIT-032 などが書く正常値(言語1・公開1・支店公開1・サイズ1・重量3・カテゴリ1,177・通常商品・割引5・基準300・販売300・買取100・原価90・地域制限0)
CARD_NORMAL = {'言語(ID)': '1', '商品公開ステータス': '1', '支店の商品公開ステータス': '1', 'サイズ': '1', '重量': '3', '商品カテゴリ(ID)': '1,177', '購入グループ名称': '通常商品', '割引率(ID)': '5',
  '基準価格': '300', '販売価格': '300', '買取価格': '100', '原価単価': '90', '地域別販売制限': '0'}
_STATUS26 = {'公開': '1', '非公開': '2', '廃止': '3'}
import csv as _c26, io as _io26
STATUS_NOTE = '商品公開ステータス: 設計書の値 2（公開）はアプリでは 1 が公開（アプリの定義: 公開=1・非公開=2・廃止=3。2026-10-22 依頼者決定で 1 を公開として扱う）。アプリの値で作った'
def _rows26(data):
    return [r for r in _c26.reader(_io26.StringIO(data.decode('utf-8').replace('\r\n', '\n')))]
def _w26(rows, sep=','):
    return ('\n'.join(sep.join(cell(c) for c in r) for r in rows) + '\n').encode('utf-8')

def rule_m0326(clause, name, seed_state, seed_how=''):
    i = clause.find(name); rest = clause[i + len(name):]
    mb = re.match(r'^は31列の見出しと(\d+)(?:行|件の正常なデータ行)(?:、各行は(.+))?$', rest)
    if mb:
        n = int(mb.group(1))
        nxt = CTX.get('next', '')
        items = mb.group(2) or (nxt.strip() if re.match(r'^(言語|公開)', nxt.strip()) else '')
        if not items: return None
        one = rule_m0326(clause[:i + len(name)] + 'は' + items, name, seed_state, seed_how)
        if one is None: return None
        rr = _rows26(one); head = rr[0]; cells = rr[1]
        jp, en = head.index('商品名(日)'), head.index('商品名(英)')
        out_ = [head]
        for k_ in range(1, n + 1):
            c2 = list(cells); c2[jp] = f'M0326 試験カード-{k_:04d}'; c2[en] = f'M0326 Test Card {k_:04d}'; out_.append(c2)
        NOTES.append(f'{n}行: 商品名(日)は「M0326 試験カード-<4桁の連番>」・商品名(英)は「M0326 Test Card <4桁の連番>」（文は「一意な日英名」）。カード詳細(ID)・商品IDは文に無いので空（この文は行数の上限が主題）')
        return _w26(out_)
    mr = re.match(r'^は(?:\d+データ行で、)?1行目(?:が|は)(.+)$', rest)
    if mr:
        segs = re.split(r'、(?=\d+行目(?:が|は))', '1行目が' + mr.group(1))
        segs = [re.sub(r'^\d+行目(?:が|は)', '', x) for x in segs]
        last = segs[-1]; common = ''
        mcom = re.search(r'(?:の新規行（商品ID空）)?で、どちらも(.+)$', last)
        if mcom and len(segs) >= 2: last, common = last[:mcom.start()], mcom.group(1); segs[-1] = last
        elif '、' in last and len(segs) >= 2 and ('・' in last.split('、')[0]):
            last, common = last.split('、', 1); segs[-1] = last
        elif len(segs) == 1: return None
        rows_ = []; heads_ = None
        for sg in segs:
            toks = sg.replace('の新規行（商品ID空）で', '').strip('、 ')
            clause2 = clause[:i + len(name)] + 'は' + toks + ('、' + common if common else '')
            one = rule_m0326(clause2, name, seed_state, seed_how)
            if one is None: return None
            ls = _rows26(one); hd = ls[0]
            rows_.append(dict(zip(hd, ls[1]))); heads_ = hd if heads_ is None or len(hd) > len(heads_) else heads_
        NOTES.append('N行目: 行ごとの指定と、共通の指定（行の指定の後ろに書かれた列）を、各行に入れた')
        return _w26([heads_] + [[r.get(h, '') for h in heads_] for r in rows_])
    rest = re.split(r'、[A-Za-z0-9_\-]+(?:-[A-Z])?\.csvは', rest)[0]
    nxt0 = CTX.get('next', '').strip()
    # 同じ商品ID・価格・状態を指定: 状態・属性の商品ID・販売価格をそのまま使う
    if rest == 'は同じ商品ID・価格・状態を指定':
        st_ = CTX.get('state', ''); pid = re.search(r'商品ID(〔商品ID-[^〕]+〕)', st_); pr = re.search(r'販売価格(\d+)', st_)
        if not (pid and pr): return None
        NOTES.append('同じ商品ID・価格・状態: 状態・属性の商品ID（呼び名）と販売価格を入れ、他の列は正常値（状態は商品側の属性でCSVの列ではない）')
        return rule_m0326(clause[:i + len(name)] + 'は商品ID' + pid.group(1) + '、販売価格' + pr.group(1) + '、他項目は正常値', name, seed_state, seed_how)
    mm_ = re.fullmatch(r'は商品ID(〔[^〕]+〕)を(廃止|非公開)へ変更する', rest)
    if mm_:
        NOTES.append(f'{mm_.group(2)}へ変更する行: 商品公開ステータスは{_STATUS26[mm_.group(2)]}（アプリの定義: 公開=1・非公開=2・廃止=3）。文が書かない他の列は正常値')
        return rule_m0326(clause[:i + len(name)] + 'は商品ID' + mm_.group(1) + '、商品公開ステータス' + mm_.group(2) + '、他項目は正常値', name, seed_state, seed_how)
    mm_ = re.fullmatch(r'は(〔商品ID-[^〕]+〕)を(非公開|廃止)、(〔商品ID-[^〕]+〕)を(非公開|廃止)へ変更する', rest)
    if mm_:
        a, sa, b_, sb = mm_.groups()
        NOTES.append('非公開・廃止へ変更する2行: 商品公開ステータスは非公開=2・廃止=3（アプリの定義）。文が書かない他の列は正常値')
        return rule_m0326(clause[:i + len(name)] + 'は1行目が商品ID' + a + '・商品公開ステータス' + sa + '、2行目が商品ID' + b_ + '・商品公開ステータス' + sb + '、他項目は正常値', name, seed_state, seed_how)
    mm_ = re.fullmatch(r'は商品ID(〔[^〕]+〕)の行、商品ID(〔[^〕]+〕)の行の順で、どちらも商品公開ステータスは廃止、その他は正常値', rest)
    if mm_:
        return rule_m0326(clause[:i + len(name)] + 'は1行目が商品ID' + mm_.group(1) + '・商品公開ステータス廃止、2行目が商品ID' + mm_.group(2) + '・商品公開ステータス廃止、他項目は正常値', name, seed_state, seed_how)
    mm_ = re.fullmatch(r'は既存カード詳細ID(〔[^〕]+〕)の新規行、未登録カード詳細ID(〔[^〕]+〕)の新規行の順で格納.*', rest)
    if mm_:
        NOTES.append('新規行2行: 商品名は「M0326 試験カード-<呼び名の末尾>」・英名は「M0326 Test Card <同>」（文に無いので担当が決めた）。商品IDは空、他の列は正常値')
        base = rule_m0326(clause[:i + len(name)] + 'は商品ID空、カード詳細ID' + mm_.group(1) + '、他項目は正常値', name, seed_state, seed_how)
        return rule_m0326(clause[:i + len(name)] + 'は1行目が商品ID空・カード詳細ID' + mm_.group(1) + '・商品名「M0326 試験カード-A」「M0326 Test Card A」、2行目が商品ID空・カード詳細ID' + mm_.group(2) + '・商品名「M0326 試験カード-B」「M0326 Test Card B」、他項目は正常値', name, seed_state, seed_how)
    mm_ = re.fullmatch(r'は新規2行（商品ID空、商品削除フラグ0、基準価格300・販売価格300・買取価格100、他項目は正常値）', rest)
    if mm_:
        # 行の中身は投入方法の【CSV】の文が1行目・2行目として書いている(商品名は「M0326-CB087-商品A」など)。その行をそのまま読む
        segs = re.findall(r'\d行目に「(.+?)」(?=、\d行目に「|を\d行)', seed_how)
        if len(segs) != 2: return None
        NOTES.append('新規2行: 投入方法の【CSV】の文（1行目に「…」、2行目に「…」）が書く列を、そのまま入れた（商品名は文の「M0326-CB087-商品A/B」・英名は「…-ItemA/B」。商品削除フラグ0。商品公開ステータスは文の2（公開）をアプリの1にした）')
        return rule_m0326(clause[:i + len(name)] + 'は1行目が' + segs[0] + '、2行目が' + segs[1], name, seed_state, seed_how)
    if rest == 'は定義どおりの31列見出しだけを持ち、データ行0件':
        NOTES.append('見出し行: アプリの雛形の30列（文は「31列」。商品削除フラグを含む書き方）')
        return (','.join(CARD_HEAD) + '\n').encode('utf-8')
    mm_ = re.fullmatch(r'は31列の見出しと(\d+)件の正常なデータ行', rest)
    if mm_:
        n = int(mm_.group(1)); ids_ = expand_range(CTX.get('state', '').replace('カード詳細ID', ''))
        if ids_ and len(ids_) == n:
            rows = []
            for k_, cid in enumerate(ids_, 1):
                r_ = dict(CARD_NORMAL); r_['商品名(日)'] = f'M0326 試験カード-{k_:04d}'; r_['商品名(英)'] = f'M0326 Test Card {k_:04d}'; r_['カード詳細(ID)'] = cid; rows.append(r_)
            NOTES.append(f'{n}行: カード詳細(ID)は状態・属性の範囲（{ids_[0]}〜{ids_[-1]}）を展開、商品名は「M0326 試験カード-<4桁の連番>」、他の列は正常値')
            return ('\n'.join(','.join(cell(r.get(h, '')) for h in CARD_HEAD) if r else ','.join(CARD_HEAD) for r in [None] + rows) + '\n').encode('utf-8')
    m = re.match(r'^(?:は|の)(.+)$', rest)
    if not m: return None
    body = m.group(1)
    nxt = CTX.get('next', '')
    if nxt0.startswith('その他は正常値') or nxt0.startswith('他項目は正常値'): body += '、他項目は正常値'
    if nxt0.startswith('両ファイルとも'): body += '、' + nxt0[len('両ファイルとも'):]
    body = re.sub(r'^の1データ行、', '', body)
    if nxt and not FILE_RE.search(nxt) and re.match(r'^(言語|公開)', nxt.strip()): body += '、' + nxt.strip()
    if re.search(r'1行目|2行目|行持つ|\d+行|13行|～|〜|同じ商品ID', body) and not re.search(r'1データ行|31列の1データ行', body): return None
    body = re.sub(r'^31列(をタブ区切りとし|の見出しと|、)?', '', body).strip('、 ')
    tsv = name.endswith('.tsv')
    row = {}
    normal = bool(re.search(r'他項目は正常値|その他は正常値|その他は正常|ほかは正常値', body))
    toks = [t.strip() for t in re.split(r'、|・', body) if t.strip()]
    idn = CTX.get('sid', '')[-3:]
    for t in toks:
        t = re.sub(r'(?:他項目|その他)は正常値$|^その他は正常値.*$|の正常行$', '', t).strip()
        if not t or t in ('31列', '31列をタブ区切りとし'): continue
        if t.endswith('が空'):
            for part in re.split(r'・', t[:-2]):
                for a, col in CARD_ALIAS:
                    if part.startswith(a): row[col] = ''; break
            continue
        mm = re.match(r'^商品名「([^」]+)」「([^」]+)」$', t)
        if mm: row['商品名(日)'], row['商品名(英)'] = mm.group(1), mm.group(2); continue
        mm = re.match(r'^商品名「([^」]+)」$', t)
        if mm: row['商品名(日)'] = row['商品名(英)'] = mm.group(1); continue
        mm = re.match(r'^(商品公開ステータス|支店の商品公開ステータス)(\d)（(公開|非公開|廃止)）$', t)
        if mm:
            row[mm.group(1)] = _STATUS26[mm.group(3)]
            if mm.group(2) != row[mm.group(1)]: NOTES.append(STATUS_NOTE)
            continue
        mm = re.match(r'^商品公開ステータスと支店の商品公開ステータスは公開を表す値$', t)
        if mm: row['商品公開ステータス'] = row['支店の商品公開ステータス'] = '1'; NOTES.append(STATUS_NOTE); continue
        mm = re.match(r'^商品名\(日\)「([^」]*)」$', t)
        if mm: row['商品名(日)'] = mm.group(1); continue
        mm = re.match(r'^商品名\(英\)「([^」]*)」$', t)
        if mm: row['商品名(英)'] = mm.group(1); continue
        if t == '通常商品': row['購入グループ名称'] = '通常商品'; continue
        if t in ('日英名', '一意な日英名'): continue
        if t == 'その他は正常値' or re.fullmatch(r'状態(?:EX|NM|SP|MT)', t): continue
        for a, col in CARD_ALIAS:
            if t.startswith(a):
                v = t[len(a):].strip().lstrip('=').strip()
                q = re.fullmatch(r'「([^」]*)」', v)
                if q: v = q.group(1)
                if col == '商品公開ステータス' and v in _STATUS26: v = _STATUS26[v]
                elif col == '商品公開ステータス' and v == '2': v = '1'; NOTES.append(STATUS_NOTE)   # 依頼者決定 2026-10-23: 「2」とだけ書くものも設計書の値(2=公開)と読む
                if v == '空': v = ''
                if v == '' and col not in ('商品ID',) and not t.endswith('空'): break
                if re.search(r'[぀-鿿]', re.sub(r'〔[^〕]+〕', '', v)) and col not in ('購入グループ名称', '商品名(日)', '商品名(英)', '商品説明(日)', '買取商品説明(日)', '検索ワード', 'フリーエリア', '規格画像'): return None
                row[col] = v; break
        else:
            return None
    head = list(CARD_HEAD)
    if '商品削除フラグ' in row:
        head.append('商品削除フラグ'); NOTES.append('商品削除フラグ: アプリの雛形は30列で、文は31列（商品削除フラグを含む）。文が値を書くこのファイルだけ、末尾に列「商品削除フラグ」を足した')
    if normal and re.match(r'^〔商品ID-', row.get('商品ID', '')):
        # 更新の行(商品IDが画面で控えた番号): 文は「他項目は正常値」。カード詳細(ID)は状態・属性が結ぶ組、商品名は新規行と同じ付け方にする
        pid = row['商品ID']; st_ = CTX.get('state', '')
        mc = re.search('商品ID' + re.escape(pid) + r'(?:は|が)カード詳細ID(〔[^〕]+〕)', st_)
        if mc and 'カード詳細(ID)' not in row: row['カード詳細(ID)'] = mc.group(1); NOTES.append('カード詳細(ID): 状態・属性が結ぶ「商品ID' + pid + 'はカード詳細ID' + mc.group(1) + '」の組')
        suf = re.sub(r'^〔商品ID-(?:M0326-)?|〕$', '', pid)
        if '商品名(日)' not in row:
            row['商品名(日)'] = f'M0326 試験カード-{suf}'; row['商品名(英)'] = f'M0326 Test Card {suf}'
            NOTES.append('商品名: 文は「他項目は正常値」で名前を書かない。新規行と同じ付け方「M0326 試験カード-<呼び名の末尾>」「M0326 Test Card <同>」にした（担当が決めた）')
    if normal:
        for k, v in CARD_NORMAL.items(): row.setdefault(k, v)
        NOTES.append('他項目は正常値: 文の言う正常値は、シード表 M03-26 の LIMIT-032 などが書く値（言語1・公開1・支店公開1・サイズ1・重量3・カテゴリ1,177・通常商品・割引5・基準300・販売300・買取100・原価90・地域制限0）を、書かれていない列に入れた')
    if '商品名(日)' not in row and any(k in row for k in ('カード詳細(ID)',)) and not row.get('商品ID', ''):
        pass
    if 'カード詳細(ID)' not in row and row.get('商品ID') is None: pass
    sep = '\t' if tsv else ','
    line = sep.join((cell(row.get(h, '')) if not tsv else row.get(h, '')) for h in head)
    return ((sep.join(head) + '\n' + line + '\n').encode('utf-8'))

FILE_RE = re.compile(r'\.(?:csv|tsv|txt)')
# ---------------- M03-16 略称タグCSV(ID,名称,並び順) ----------------
ORDER16 = {'wrong_order_header-026.csv': '72', 'wrong_name_header-026.csv': '73', 'wrong_order_header-027.csv': '74'}
def rule_m0316(clause, name, seed_state, seed_how=''):
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^=(.+)$', rest)
    if not m: return None
    body = m.group(1)
    mods, core = _peel(body)
    tab = mods['tab'] or name.endswith('.tsv')
    zw = re.fullmatch(r'名称内にゼロ幅スペースとゼロ幅ノーブレークスペースを含み正規化後の名称が「([^」]+)」・並び順(\d+)', core)
    rows = None
    if zw:
        nm = zw.group(1)
        nm2 = nm[:2] + '\u200b' + nm[2:4] + '\ufeff' + nm[4:]
        NOTES.append('ゼロ幅文字の位置: 文は「名称内に含む」とだけ書く。名称の2文字目の後ろにゼロ幅スペース(U+200B)、4文字目の後ろにゼロ幅ノーブレークスペース(U+FEFF)を入れた（除去すると文の名称になる）')
        rows = [['', nm2, zw.group(2)]]
    if rows is None:
        mm = re.fullmatch(r'名称「([^」]+)」・並び順(\d+)', core)
        if mm: rows = [['', mm.group(1), mm.group(2)]]
    if rows is None:
        mm = re.fullmatch(r'名称空・並び順(\d+)', core)
        if mm: rows = [['', '', mm.group(1)]]
    if rows is None:
        mm = re.fullmatch(r'名称((?:「[^」]+」)+)の(\d+)行・両行の並び順(\d+)', core)
        if mm:
            names = re.findall(r'「([^」]+)」', mm.group(1))
            if len(names) == int(mm.group(2)): rows = [['', n_, mm.group(3)] for n_ in names]
    if rows is None:
        mm = re.fullmatch(r'空IDの「([^」]+)」並び順(\d+)と「([^」]+)」並び順(\d+)', core)
        if mm: rows = [['', mm.group(1), mm.group(2)], ['', mm.group(3), mm.group(4)]]
    if rows is None:
        mm = re.fullmatch(r'ID空、0、(\d+)の3行・名称((?:「[^」]+」){3})・並び順(\d+)、(\d+)、(\d+)', core)
        if mm:
            names = re.findall(r'「([^」]+)」', mm.group(2))
            rows = [['', names[0], mm.group(3)], ['0', names[1], mm.group(4)], [mm.group(1), names[2], mm.group(5)]]
    hdr = ['ID', '名称', '並び順']
    if rows is None:
        mm = re.fullmatch(r'(?:ファイル上の2行目が|2行目は)?名称「([^」]+)」・末尾の並び順が空', core)
        if mm: rows = [['', mm.group(1), '']]
    if rows is None:
        mm = re.fullmatch(r'(?:ファイル上の)?2行目(?:が|は)名称空・並び順(\d+)', core)
        if mm: rows = [['', '', mm.group(1)]]
    if rows is None:
        mm = re.fullmatch(r'2行目は名称「([^」]+)」・並び順(\d+)', core)
        if mm:
            rows = [['', mm.group(1), mm.group(2)]]
            m3 = re.match(r'^3行目は名称「([^」]+)」・並び順(\d+)$', CTX.get('next', '').strip())
            if m3: rows.append(['', m3.group(1), m3.group(2)])
    if rows is None:
        mm = re.fullmatch(r'見出し行とデータ行の末尾に区切り文字あり・名称「([^」]+)」・並び順(\d+)', core)
        if mm: rows = [['', mm.group(1), mm.group(2), '']]; hdr = hdr + ['']
    if rows is None:
        mm = re.fullmatch(r'2行目でID (〔[^〕]+〕)を名称「([^」]+)」・並び順(\d+)へ更新、3行目で「([^」]+)」・並び順(\d+)を新規登録、4行目は名称空・並び順(\d+)', core)
        if mm: rows = [[mm.group(1), mm.group(2), mm.group(3)], ['', mm.group(4), mm.group(5)], ['', '', mm.group(6)]]
    if rows is None:
        mm = re.fullmatch(r'見出し「ID・並び順・名称」・名称「([^」]+)」', core)
        if mm: rows = [['', ORDER16.get(name, ''), mm.group(1)]]; hdr = ['ID', '並び順', '名称']; NOTES.append('見出し順序不一致: 文は並び順の値を書かない。並び順は作り方のコード e2e/seeds/m03-16.ts（489・495行）が使う値 ' + ORDER16.get(name, '(無し→空)') + ' にした')
    if rows is None:
        mm = re.fullmatch(r'名称見出しを「([^」]+)」とした名称「([^」]+)」', core)
        if mm: rows = [['', mm.group(2), ORDER16.get(name, '')]]; hdr = ['ID', mm.group(1), '並び順']; NOTES.append('見出し内容不一致: 文は並び順の値を書かない。並び順は作り方のコード e2e/seeds/m03-16.ts（490行）が使う値 ' + ORDER16.get(name, '(無し→空)') + ' にした')
    if rows is None: return None
    j = '\t' if tab else ','
    text = mods['eol'].join(j.join(r) for r in [hdr] + rows) + mods['eol']
    data = text.encode('utf-8') if mods['enc'] == 'utf-8' else text.encode('cp932')
    return (b'\xef\xbb\xbf' + data) if mods['bom'] else data

# ---------------- M04-22/M04-23 在庫移動・振替/分割結合CSV ----------------
HEAD_SPLIT = ['分割元商品コード', '分割数', '分割先商品コード', '分割先在庫数']
HEAD_JOIN = ['結合先商品コード', '結合数', '結合元商品コード', '結合元在庫区分', '結合元在庫数']   # fixtures/m04-23 の結合CSVの見出し
HEAD_MOVE = ['商品コード', '移動点数']
def rule_m0423(clause, name, seed_state, seed_how=''):
    i = clause.find(name); rest = clause[i + len(name):]
    m = re.match(r'^=(.+)$', rest)
    if not m: return None
    body = re.sub(r'（[^）]*）$', '', m.group(1)).strip()
    # 1行目に項目名（A・B・C）、2行目にR
    mm = re.fullmatch(r'1行目に項目名（([^）]+)）、2行目に(.+)', body)
    if mm: return ('\n'.join([','.join(mm.group(1).split('・')), mm.group(2)]) + '\n').encode('utf-8')
    head = HEAD_SPLIT if 'split' in name else HEAD_JOIN if 'join' in name else None
    if head is None: return None
    mm = re.fullmatch(r'分割元([^・]+)・分割数(\d+)の行を(\d+)行（(.+)）', body)
    if mm:   # 分割元A・分割数10の行を2行（分割先B・分割先在庫数10、分割先C・分割先在庫数10）
        dst = re.findall(r'分割先([^・、]+)・分割先在庫数(\d+)', mm.group(4))
        if len(dst) != int(mm.group(3)): return None
        rows = [[mm.group(1), mm.group(2), d_, q_] for d_, q_ in dst]
        return ('\n'.join(','.join(r) for r in [head] + rows) + '\n').encode('utf-8')
    body2 = re.sub(r'の\d+行$', '', body)
    rows = [x.split(',') for x in re.split(r'と', body2) if x]
    if rows and all(len(r) == len(head) for r in rows): return ('\n'.join(','.join(r) for r in [head] + rows) + '\n').encode('utf-8')
    return None

# ---------------- M03-33 セール用高額商品価格変更CSV ----------------
# 行は、設計書の7つの値（商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)・最後の1値）を、アプリの雛形の見出し（5列）の下にそのまま置く（作り方のコード m03-33.ts と同じ）
HEAD33 = ['商品コード', '販売価格', 'セールフラグ', '帯URL', 'タグ(ID)']
def rule_m0333(clause, name, seed_state, seed_how=''):
    i = clause.find(name); rest = clause[i + len(name):]
    body = re.sub(r'^(は|=)', '', rest)
    def row7(code, sale, buy, flag, url='', tag='', last=''): return [code, sale, buy, flag, url, tag, last]
    def out7(rows):
        NOTES.append('7つの値: 設計書の並び（商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)・最後の1値）。文が書かない値は空。見出しはアプリの雛形の5列（作り方のコード m03-33.ts と同じ扱い）')
        return ('\n'.join(','.join(cell(c) for c in r) for r in [HEAD33] + rows) + '\n').encode('utf-8')
    m = re.fullmatch(r'([^,]+),(\d+),(\d+),(\d+),(https?://[^,]+),空,(\d+)をUTF-8以外で保存', body)
    if m:
        d = out7([row7(m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), '', m.group(6))])
        NOTES.append('文字コード: 文は「UTF-8以外で保存」。ファイル名が shift_jis-024.csv なので Shift_JIS（cp932）で書いた。文の末尾「をUTF-8以外で保存」は値ではないので入れない')
        return d.decode('utf-8').encode('cp932')
    m = re.fullmatch(r'帯URLを空、他の値を([^,]+),(\d+),(\d+),(\d+),タグ空,(\d+)とする', body)
    if m: return out7([row7(m.group(1), m.group(2), m.group(3), m.group(4), '', '', m.group(5))])
    m = re.fullmatch(r'商品コード(\S+?)、販売価格(\d+)、買取価格(\d+)、セールフラグ(\d)を指定', body)
    if m: return out7([row7(m.group(1), m.group(2), m.group(3), m.group(4))])
    m = re.fullmatch(r'1行目([^、]+)、2行目([^を]+)を価格(\d+)・(\d+)、セール(\d)へ更新する正常行', body)
    if m: return out7([row7(m.group(1), m.group(3), m.group(4), m.group(5)), row7(m.group(2), m.group(3), m.group(4), m.group(5))])
    m = re.fullmatch(r'ヘッダと(\d+)正常行で二重引用符外の改行(\d+)個', body)
    if m:
        mcode = re.search(r'商品コード=([^／]+)', CTX.get('state', ''))
        codes = expand_range(mcode.group(1)) if mcode else None
        pr = re.search(r'各行は価格(\d+)・(\d+)、セール(\d)', CTX.get('state', ''))
        if codes and pr and len(codes) == int(m.group(1)):
            d = out7([row7(c, pr.group(1), pr.group(2), pr.group(3)) for c in codes])
            return d if d.count(b'\n') == int(m.group(2)) else None
    m = re.fullmatch(r'(\d+)正常行の帯URL1件に二重引用符内改行1個を含み、全文改行(\d+)個・引用符外改行(\d+)個', body)
    if m:
        mcode = re.search(r'商品コード=([^／]+)', CTX.get('state', ''))
        codes = expand_range(mcode.group(1)) if mcode else None
        pr = re.search(r'各行は価格(\d+)・(\d+)、セール(\d)', CTX.get('state', ''))
        if codes and not pr:
            class _P:
                def group(self, k): return ('', '1200', '700', '1')[k]
            pr = _P(); NOTES.append('価格・セール: 文は書かない。同じ機能の MASS-026 と同じ「販売価格1200・買取価格700・セール1」')
        if codes and pr and len(codes) == int(m.group(1)):
            rows = [row7(c, pr.group(1), pr.group(2), pr.group(3)) for c in codes]
            rows[0][4] = 'https://replace-dev.hareruyamtg.com:8443/line1\nline2'
            NOTES.append('二重引用符内の改行: 1行目の帯URLに1個（https://replace-dev.hareruyamtg.com:8443/line1 と line2 の間）。どの行かは文に無いので先頭の行にした')
            d = out7(rows)
            return d if d.count(b'\n') == int(m.group(2)) else None
    return None

RULES = {'M03-33': rule_m0333, 'M03-20': rule_m0320, 'M03-27': rule_m0327, 'M03-41': rule_m0341, 'M03-26': rule_m0326, 'M03-16': rule_m0316, 'M04-23': rule_m0423, 'M04-22': rule_m0423}
FIRST = {'M03-27', 'M03-33'}        # 先に規則を当てる機能
SLASH_SPEC = {'M03-27', 'M03-02'}  # ファイルの記述が「／」で区切られた列の並びで書かれている機能(一般の読み取りでは切れてしまう)
