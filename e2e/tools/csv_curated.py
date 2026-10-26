"""シード表が名前・ファイル名・狙いしか書いていないファイルを、そのシードを使うケース(事前準備・手順・期待結果)を読んで、狙いが成り立つ中身に決めて作る。
各ファイルに、決めた中身と読んだケースIDを備考(notes)で返す。値のでっち上げはしない: 文に値があればそれを使い、無い所だけ担当が決めて備考に書く。"""
import re, struct, zlib
import csv_rules as R
cell = R.cell
GH = R.GOODS_HEAD

def png(w, h, px):
    """px: 行ごとの 0/1 の並び(1=白)。黒地に白の8bitグレーPNG"""
    raw = b''.join(b'\x00' + bytes(255 if v else 0 for v in row) for row in px)
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')
FONT = {'Q': ['010', '101', '101', '111', '011'], 'A': ['010', '101', '111', '101', '101'], '8': ['111', '101', '111', '101', '111']}
def text_png(txt, scale=6):
    rows = [''.join(FONT[c][r] + '0' for c in txt) for r in range(5)]
    px = []
    for r in rows:
        line = [int(c) for c in '0' + r]
        for _ in range(scale): px.append([v for v in line for _ in range(scale)])
    return png(len(px[0]), len(px), [[0] * len(px[0])] + px + [[0] * len(px[0])])

def csvb(head, rows, sep=','):
    return ('\n'.join(sep.join(cell(c) if sep == ',' else c for c in r) for r in [head] + rows) + '\n').encode('utf-8')

def m27row(**kw):
    r = dict(R.M27_DEFAULT); r.update(kw); return r
def m27csv(rows): return ('\n'.join(','.join(cell(v) for v in r) for r in [GH] + [[x.get(h, '') for h in GH] for x in rows]) + '\n').encode('utf-8')

def build(sid, st, how):
    """戻り値 {ファイル名: (bytes, [備考])}"""
    out = {}
    no = (re.search(r'(\d+)$', sid) or [None, ''])[1]
    mid = sid[2:8]
    ids = lambda pre: list(dict.fromkeys(re.findall(r'〔' + pre + r'[^〕]+〕', st)))
    def add(fn, data, *notes): out[fn] = (data, list(notes))
    # ---- M03-16 ----
    if sid in ('S-M03-16-CASE-017', 'S-M03-16-CASE-018'):
        add(f'column_count_mismatch-{no}.csv', csvb(['ID', '名称', '並び順'], [['', f'列数正常略称-{no}', '60'], ['', f'列数不足略称-{no}']]),
            f'ケース IT-M03-16-{no} を読んだ。3行目は「名称までの2列」（ID・名称だけ、並び順の列なし）。1行目の見出しは3列なので、3行目の列数だけが見出しと合わない', 'ID列は文に無いので空')
    # ---- M03-20 ----
    if sid == 'S-M03-20-CASE-007':
        L = ids('部門ID-')[0]
        add('same_master_values.csv', csvb(R.HEAD20, [[L, '既存部門A-M03-20-007', 'DPT-020-007', '2', '1']]), 'ケース IT-M03-20-007 を読んだ。「同じID・部門名・部門コード」は、状態・属性の既存部門（ID呼び名・既存部門A-M03-20-007・DPT-020-007）の値。免税区分2・表示フラグ1は文のとおり')
    if sid == 'S-M03-20-CASE-008':
        L = ids('部門ID-')[0]
        add('required_empty.csv', csvb(R.HEAD20, [[L, '必須空欄確認更新部門-008', '93200801', '1', '1'], ['', '', '93200802', '0', '0'], ['', '必須空欄確認部門B-008', '', '0', '0'], ['', '必須空欄確認部門C-008', '93200804', '', '0']]),
            'ケース IT-M03-20-008 を読んだ。正常行と空欄の各行の値は、作り方のコード e2e/seeds/m03-20.ts の「解釈の値」（"008"）と同じ。空欄は部門名・部門コード・免税区分を1行に1つ')
    if sid == 'S-M03-20-CASE-011':
        add('id_11_digits.csv', csvb(R.HEAD20, [['12345678901', '11桁ID更新部門', 'LONG-011', '0', '0']]), 'ケース IT-M03-20-011 を読んだ。IDは状態・属性の12345678901（11桁）')
    if sid == 'S-M03-20-CASE-033':
        add('old_display_header.csv', csvb(['ID', '部門名', '部門コード', '免税区分', '表示フラグ'], [['', '旧表示フラグ部門', 'OLDFLAG-033', '0', '0']]), 'ケース IT-M03-20-033 を読んだ。見出しの5列目だけ「MTGBuyer表示フラグ」の代わりに「表示フラグ」')
    if sid == 'S-M03-20-CASE-034':
        add('column_count_mismatch.csv', csvb(R.HEAD20, [['', '列数正常部門', 'COL-OK-034', '0', '0'], ['', '列数不足部門', 'COL-NG-034', '0']]), 'ケース IT-M03-20-034 を読んだ。正常行の免税区分・表示フラグは0・0、列数不足の行は表示フラグ列を欠き免税区分は0（値は文に無いので、作り方のコード m03-20.ts の「解釈の値」（"034"）と同じ）')
    if sid == 'S-M03-20-CASE-035':
        L = ids('部門ID-')[0]
        add('duplicate_id.csv', csvb(R.HEAD20, [[L, 'ID重複更新部門A-035', '93203501', '1', '1'], [L, 'ID重複更新部門B-035', '93203502', '2', '0']]), 'ケース IT-M03-20-035 を読んだ。同じIDを異なる更新内容で2行。値は作り方のコード m03-20.ts の「解釈の値」（"035"）と同じ')
    if sid == 'S-M03-20-CASE-045':
        add('dept_text.xls', csvb(R.HEAD20, [['', '表計算種別部門', 'XLS-001', '0', '0']]), 'ケース IT-M03-20-045 を読んだ。拡張子xls、中身はUTF-8・カンマ区切りのテキスト（見出し行+1行）。送信時の形式種別 application/vnd.ms-excel は取込の操作側の設定')
    if sid == 'S-M03-20-DP-053':
        add('new-053.csv', csvb(R.HEAD20, [['', 'M0320-053再取込新規部門', 'M0320-053-NEW', '0', '1']]), 'ケース IT-M03-20-053 を読んだ。ID列は空。同じファイルを2回取り込む')
    # ---- M03-21 ----
    if sid == 'S-M03-21-CSV-046':
        L = ids('棚番号ID-')[0]
        add('m03-21-atomic-046.csv', csvb(['ID', '名称', '並び順'], [[L, 'M-111', '111'], ['', 'N-112', '112'], ['', 'n-113', '113']]), 'ケース IT-M03-21-046 を読んだ。1行目はIDを控えた〔棚番号ID-M0321-046A〕で更新、2行目は新規（正常）、3行目は小文字nで名称の形式エラー')
    if sid == 'S-M03-21-DPCSV-070':
        add('m03-21-bulk-new-070.csv', csvb(['ID', '名称', '並び順'], [['', 'E-870', '101'], ['', 'F-870', '102'], ['', 'G-870', '103']]), 'ケース IT-M03-21-070 を読んだ。状態・属性の2〜4行目のとおり')
    # ---- 画像 ----
    if sid == 'S-M03-02-QA-IMAGE': add('qa8.png', text_png('QA8'), 'ケース IT-M03-02-071 を読んだ。文は「黒地に白文字で「QA8」と描いた小さなPNG」。5×3ドットの字を6倍にした画像を書いた（ファイル名は文に無いので qa8.png）')
    if sid == 'S-M03-31-FILE-027': add('unsupported.png', png(1, 1, [[1]]), 'ケース IT-M03-31-027 を読んだ。CSV・TSV・テキスト・表計算のいずれでもない画像。有効な1ピクセルのPNG')
    if sid == 'S-M03-32-DATA-016': add('invalid.png', png(1, 1, [[1]]), 'ケース IT-M03-32-016 を読んだ。文は「有効な1ピクセルPNG画像」')
    if sid == 'S-M03-35-CASE-021': add('m0335_invalid-021.png', png(1, 1, [[1]]), 'ケース IT-M03-35-021 を読んだ。文は「有効なPNGバイナリ」。1ピクセルのPNG')
    if sid == 'S-M03-41-ASSETS':
        for kind, dirn in (('banner', 'setbanner'), ('icon', 'icon')):
            for n in ('048', '049', '050'):
                add(f'{dirn}__m0341-{kind}-{n}.png', text_png(n[-1] if False else '8'), f'ケース IT-M03-41-{n} を読んだ。配置先は img/category/{dirn}/m0341-{kind}-{n}.png（ファイル名はこの場所の名前の「/」を「__」にした）。内容は読み取り可能な小さなPNG')
    # ---- M03-26 (複数ファイル) ----
    if sid == 'S-M03-26-MASTER-ERROR-042':
        labels = [f'〔カード詳細ID-M0326-042{c}〕' for c in 'ABCDEFGH']
        cols = ['言語(ID)', '商品カテゴリ(ID)', '割引率(ID)', '買取減額率(ID)', '略称タグ(ID)', '売上分析タグ(ID)', 'タグ(ID)', '購入グループ名称']   # 投入方法の【CSV】の文の並び（999999042の7項目、購入グループ名称が最後）
        for k_, (c, lab) in enumerate(zip(cols, labels)):
            r_ = dict(R.CARD_NORMAL); r_['商品名(日)'] = f'M0326 試験カード-042{"ABCDEFGH"[k_]}'; r_['商品名(英)'] = f'M0326 Test Card 042{"ABCDEFGH"[k_]}'; r_['カード詳細(ID)'] = lab
            r_[c] = '未登録グループ-042' if c == '購入グループ名称' else '999999042'
            add(f'master-error-{k_ + 1:02d}.csv', ('\n'.join(','.join(cell(r.get(h, '')) for h in R.CARD_HEAD) if r else ','.join(R.CARD_HEAD) for r in [None, r_]) + '\n').encode('utf-8'),
                f'ケース IT-M03-26-042 を読んだ。8ファイルで「{c}」だけを未登録値にした（順番は投入方法の【CSV】の文の並び。ファイル名は文の master-error-01.csv〜master-error-08.csv）。他の列は正常値')
    out.update(build2(sid, st, how))
    out.update(build3(sid, st, how))
    return out


# ================= 追加: ケースを読んで中身を決めたもの =================
def _pad(data, size): return R._pad_to(data, size)
URL = 'https://replace-dev.hareruyamtg.com:8443/'

def build2(sid, st, how):
    out = {}
    no = (re.search(r'(\d+)$', sid) or [None, ''])[1]
    def add(fn, data, *notes): out[fn] = (data, list(notes))
    L = lambda pre: list(dict.fromkeys(re.findall(r'〔' + pre + r'[^〕]*〕', st)))
    CASE = lambda c: f'ケース {c} を読んだ。'
    # ---- M03-26 ----
    if sid == 'S-M03-26-OPTIONAL-009':
        r = dict(R.CARD_NORMAL); r.update({'商品名(日)': 'M0326 試験カード-009', '商品名(英)': 'M0326 Test Card 009', '原価単価': '15', '買取価格': '15', 'カード詳細(ID)': '〔カード詳細ID-M0326-009〕', '割引率(ID)': '5'})
        add('optional-empty.csv', ('\n'.join(','.join(cell(x.get(h, '')) for h in R.CARD_HEAD) if x else ','.join(R.CARD_HEAD) for x in [None, r]) + '\n').encode('utf-8'), CASE('IT-M03-26-009') + '必須項目だけを入れ、任意項目（商品ID・説明4項目・検索ワード・規格画像・買取減額率・略称タグ・売上分析タグ・タグ・発送日目安・販売制限数・地域別販売制限・フリーエリア）は空。日英商品名は文に値が無いので「M0326 試験カード-009」「M0326 Test Card 009」')
    if sid == 'S-M03-26-UPDATE-012':
        r = dict(R.CARD_NORMAL); r.update({'商品ID': '〔商品ID-M0326-012〕', '支店の商品公開ステータス': '0', '商品カテゴリ(ID)': '178', 'タグ(ID)': '3', '売上分析タグ(ID)': '29', '基準価格': '400', '販売価格': '350', '買取価格': '120', '原価単価': '90', '地域別販売制限': '1',
                                            '商品名(日)': '更新後商品名-012', '商品名(英)': 'After Name 012', '商品説明(日)': '更新後商品説明(日)-012', '商品説明(英)': '更新後商品説明(英)-012', '買取商品説明(日)': '更新後買取商品説明(日)-012', '買取商品説明(英)': '更新後買取商品説明(英)-012', '検索ワード': '更新後検索ワード-012', '規格画像': 'img/goods/L/UGD/11552.jpg', 'フリーエリア': '更新後フリーエリア-012', 'カード詳細(ID)': '〔カード詳細ID-M0326-012〕'})
        add('update-normal-012.csv', ('\n'.join(','.join(cell(x.get(h, '')) for h in R.CARD_HEAD) if x else ','.join(R.CARD_HEAD) for x in [None, r]) + '\n').encode('utf-8'), CASE('IT-M03-26-012') + '「更新後文字列」の中身は文に無いので、商品名・説明・検索ワード・フリーエリアは「更新後…-012」の形にした。規格画像は同じシード表（M03-27 CASE-006）が規格画像に書く img/goods/L/UGD/11552.jpg。支店公開・カテゴリ・タグ・価格は文のとおり、ほかの列は正常値')
    if sid == 'S-M03-26-QB-CSV-071' or sid == 'S-M03-26-QB-CSV-072':
        pass
    # ---- M03-27 ----
    if sid in ('S-M03-27-CASE-051', 'S-M03-27-CASE-052'):
        r = m27row(**{'商品コード': f'GOODS-NEW-001-{no}', '商品名(日)': f'CSV新規グッズ-{no}', '商品名(英)': f'CSV New Goods-{no}'})
        add(f'full-new-{no}.csv', m27csv([r]), CASE(f'IT-M03-27-{no}') + '規格コード=商品コード、名称(日)は文のとおり。名称(英)は文に無いので同じシード表の CASE-006 の付け方に合わせて「CSV New Goods-' + no + '」。ほかは共通正常値')
    # ---- M03-29 ----
    if sid in ('S-M03-29-L-041', 'S-M03-29-L-042'):
        n = 'L-041' if sid.endswith('041') else 'L-042'
        pid = L('商品ID-')[0]; tag = L('売上分析タグID-')[0]
        add('link-M0329L-001.csv' if sid.endswith('041') else 'link-M0329L-002.csv', csvb(['商品ID', '売上分析タグ(ID)'], [[pid, tag if sid.endswith('041') else '']]), CASE(f'IT-M03-29-0{n[-2:]}') + ('見出し行と1データ行（商品ID・売上分析タグID）' if sid.endswith('041') else '見出し行と1データ行（売上分析タグ(ID)は空）'))
    if sid == 'S-M03-29-CBEMPTY-047':
        pid = L('商品ID-')[0]
        add('cbtwice-M0329-047.csv', csvb(['商品ID', '売上分析タグ(ID)'], [[pid, '21'], [pid, '']]), CASE('IT-M03-29-047') + '1行目は〔商品ID〕・タグID 21、2行目は同じ商品IDで売上分析タグ(ID)が空')
    # ---- M03-30 ----
    H30 = ['商品ID', '言語ID', '基準価格', '買取価格', '原価単価']
    def t30(rows): return ('\n'.join('\t'.join(r) for r in [H30] + rows) + '\n').encode('utf-8')
    pid30 = (L('商品ID-')[:1] or [''])[0]
    if sid == 'S-M03-30-DATA-007': add('max.tsv', t30([[pid30, '1', '999999999', '999999999', '999999999']]), CASE('IT-M03-30-007') + '基準価格・買取価格・原価単価が999999999（言語ID=1）')
    if sid == 'S-M03-30-DATA-009': add('zero.tsv', t30([[pid30, '1', '0', '0', '0']]), CASE('IT-M03-30-009') + '基準価格・買取価格・原価単価が0（言語ID=1）')
    if sid == 'S-M03-30-DATA-021':
        ls = L('商品ID-'); add('rollback.tsv', t30([[ls[0], '1', '1200', '500', '350'], ['999999999', '1', '1200', '500', '350'], [ls[1], '1', '1300', '600', '400']]), CASE('IT-M03-30-021') + '1行目=A・2行目=存在しない商品ID 999999999・3行目=B。値はケースの手順2のとおり')
    if sid == 'S-M03-30-DATA-022': add('cutoff.tsv', t30([['999999999', '1', '1200', '500', '350'], [pid30, '1', '1000', '1001', '350']]), CASE('IT-M03-30-022') + '1行目=商品不存在、2行目=買取価格1001（基準価格1000を超える）。値はケースの手順2のとおり')
    if sid in ('S-M03-30-DATA-023', 'S-M03-30-DATA-024'):
        nl = 5009 if sid.endswith('023') else 5010
        d = t30([[pid30, '1', '1200', '500', '350']] * (nl - 1))
        add(f'rows_{nl}-0{sid[-2:]}.tsv', d, CASE('IT-M03-30-0' + sid[-2:]) + f'引用符外の改行が{nl}個（見出し+データ{nl - 1}行）。各データ行は文のとおり（商品ID・言語ID=1・基準価格1200・買取価格500・原価単価350）。改行数を数えて確かめた')
    if sid == 'S-M03-30-DATA-025':
        d = t30([['1', '1', '1000', '500', '350']] * 5009)
        add('rows_5010-025.tsv', d, CASE('IT-M03-30-025') + '文は「引用符外の改行5010個・設計の5列の見出しと数値のデータ行」。見出し+データ5009行。データ行の値は文に無いので、数値の「1,1,1000,500,350」を繰り返した（行数の上限の検査が主題）')
    if sid == 'S-M03-30-DATA-029': add('unchanged.tsv', t30([[pid30, '1', '1000', '400', '300']]), CASE('IT-M03-30-029') + '基準価格1000・買取価格400・原価単価300は、状態・属性の取込前の値と同じ')
    if sid == 'S-M03-30-DATA-033': add('wrong_columns_transition.tsv', t30([[pid30, '1', '1200', '500', '350', 'EXTRA']]), CASE('IT-M03-30-033') + '見出しは5列、データ行は6列。値は文に無いので、他のM03-30のファイルと同じ「1,1200,500,350」に余分な「EXTRA」を足した')
    # ---- M03-31 ----
    H31 = ['商品ID', '言語ID', '販売価格', '買取価格', 'セールフラグ', '帯URL', 'タグ(ID)']
    pid31 = (L('商品ID-')[:1] or [''])[0]
    if sid == 'S-M03-31-DATA-020': add('history-success-020.csv', csvb(H31, [[pid31, '1', '1500', '500', '1', '', '']]), CASE('IT-M03-31-020') + '状態・属性の同CSVの定義のとおり')
    if sid == 'S-M03-31-DATA-029': add('rows-5009-029.csv', csvb(H31, [[pid31, '1', '2000', '500', '0', '', '']] * 5008), CASE('IT-M03-31-029') + '見出し1行+データ5008行（改行数5009）')
    if sid == 'S-M03-31-DATA-057': add('max-values-057.csv', csvb(H31, [['999999999', '999999999', '999999999', '999999999', '1', '', '']]), CASE('IT-M03-31-057') + '商品ID・言語ID・販売価格・買取価格が999999999、セールフラグ1')
    if sid in ('S-M03-31-DATA-049', 'S-M03-31-DATA-050', 'S-M03-31-DATA-051'):
        ls = L('商品ID-'); a, b = ls[0], ls[1]; tag = '〔タグID-M0331-共有B〕'
        good = lambda p: [p, '1', '1500', '600', '1', '', '']
        if sid.endswith('049'):
            rows = [[a, '1', '1500', '600', URL + 'sale', '', '']]; rows = [[a, '1', '1500', '600', '1', URL + 'sale', tag], [a, '1', '', '', '', '', '933049'], good(b)]
            nt = '1行目=商品A（販売価格1500・買取価格600・帯URL・セールフラグ1・タグ）、2行目=商品A・存在しないタグID 933049、3行目=商品B（正常値）。2行目は他の列を空にして、タグID だけを書いた'
        elif sid.endswith('050'):
            rows = [good(a), [a, '1', '', '', '', '', '933050'], [b, '1', '1500', '600', '1', '', tag]]
            nt = '1行目=商品A（正常値）、2行目=商品A・存在しないタグID 933050、3行目=商品B（販売価格1500・買取価格600・セールフラグ1・タグ）。正常値は他のM03-31のファイルと同じ「言語ID=1・販売価格1500・買取価格600・セールフラグ1」'
        else:
            rows = [good(a), [a, '1', '', '', '', '', '933051'], good(b)]
            nt = '1行目=商品A（正常値）、2行目=商品A・存在しないタグID 933051、3行目=商品B（正常値）。正常値は他のM03-31のファイルと同じ「言語ID=1・販売価格1500・買取価格600・セールフラグ1」'
        add(f'rollback-{no}.csv', csvb(H31, rows), CASE(f'IT-M03-31-{no}') + nt)
    if sid == 'S-M03-31-DPDATA-077':
        a, b, c = L('商品ID-')[:3]
        add('multi-rows-077.csv', csvb(H31, [[a, '1', '1300', '700', '1', '', ''], [b, '1', '1400', '800', '1', '', ''], [c, '1', '1500', '900', '1', '', '']]), CASE('IT-M03-31-077') + '3行（言語ID=1・セールフラグ1・帯URL空・タグ空）')
    # ---- M03-32 ----
    if sid == 'S-M03-32-DATA-022':
        add('bad_columns-022.csv', csvb(['商品コード', '基準価格'], [['HIGH-N-0002-022', '2500'], ['HIGH-N-0001-022', '1500', 'EXTRA']]), CASE('IT-M03-32-022') + '2行目の3列目が余分（不正な列数）')
    # ---- M03-33 ----
    H33 = ['商品コード', '販売価格', 'セールフラグ', '帯URL', 'タグ(ID)']
    def c33(rows): return ('\n'.join(','.join(cell(x) for x in r) for r in [H33] + rows) + '\n').encode('utf-8')
    code33 = (re.search(r'商品コード=([A-Za-z0-9\-]+)', st) or [None, ''])[1]
    NT33 = '価格・セールは文（または同じ機能の他のファイルと同じ「販売価格1200・買取価格700・セール1」）。7つの値は設計書の並びで、書かれない値は空。見出しはアプリの雛形の5列（作り方のコード m03-33.ts と同じ扱い）'
    if sid == 'S-M03-33-FORMAT-PRODUCTS-037': add('belt_128-037.csv', c33([[code33, '1200', '700', '1', URL + 'a' * 87, '', '']]), CASE('IT-M03-33-037') + '帯URLは41文字の「' + URL + '」+ aを87文字=128文字。' + NT33)
    if sid == 'S-M03-33-VALIDATION-039': add('unknown_tag-039.csv', c33([[code33, '1200', '700', '1', '', '999', '']]), CASE('IT-M03-33-039') + 'タグID 999（未登録）を指定。' + NT33)
    if sid in ('S-M03-33-TARGETS-042', 'S-M03-33-TARGETS-044'):
        add(('no_high_price_code-042.csv' if sid.endswith('042') else 'duplicate_product_code-044.csv'), c33([[code33, '1200', '700', '1', '', '', '']]), CASE('IT-M03-33-' + sid[-3:]) + NT33)
    if sid == 'S-M03-33-TARGETS-043':
        add('deleted_product-043.csv', c33([['DEL-PROD-001-043', '1200', '700', '1', '', '', '']]), CASE('IT-M03-33-043') + NT33)
        add('deleted_class-043.csv', c33([['DEL-CLASS-001-043', '1200', '700', '1', '', '', '']]), CASE('IT-M03-33-043') + NT33)
    # ---- M03-35 ----
    H35 = ['商品コード', '部門コード(ID)']
    if sid == 'S-M03-35-CASE-036': add('m0335_rollback-036.csv', csvb(H35, [['RB-A-036', '32'], ['RB-UNKNOWN-036', '32'], ['RB-B-036', '32']]), CASE('IT-M03-35-036') + '順序は文のとおり')
    if sid == 'S-M03-35-CASE-037': add('m0335_duplicate-037.csv', csvb(H35, [['DUP-001-037', '32'], ['DUP-001-037', '33']]), CASE('IT-M03-35-037') + '順序は文のとおり')
    if sid == 'S-M03-35-CASE-049':
        base = csvb(H35, [['SEC-A-001-049', '32'], ['SEC-B-001-049', '31']]); d = _pad(base, R.MB5)
        add('m0335_exact-049.csv', d, CASE('IT-M03-35-049') + '見出し+2行（SEC-A-001-049,32 と SEC-B-001-049,31）を、5,242,880バイト（5×1024×1024）ちょうどになるまで、先頭のBOMとゼロ幅スペース（除去後は文の内容そのまま）で埋めた（改行で埋めると行数の上限に触れる。端数は行末のLFをCRLFにして合わせた）', R.SIZE_NOTE)
    # ---- M03-37 ----
    H37 = ['商品ID', '略称タグ']
    if sid in ('S-M03-37-DATA-027', 'S-M03-37-DATA-028'):
        a, b = L('商品ID-')[:2]; add(f'm0337_error_on_third_line-{no}.csv', csvb(H37, [[a, 'PRE'], [b, '']]), CASE(f'IT-M03-37-{no}') + '2行目=商品A・PRE、3行目=商品B・略称タグ空（見出しを1行目として数えて3行目がエラー）')
    if sid == 'S-M03-37-DATA-044':
        a, b = L('商品ID-')[:2]; add('m0337_two_errors-044.csv', csvb(H37, [[a, 'PRE'], [b, ''], [a, 'POR'], ['M0337-044-ABC', 'PRE']]), CASE('IT-M03-37-044') + '2行目=商品A・PRE、3行目=略称タグ空、4行目=商品A・POR、5行目=商品IDが数値でない')
    # ---- M03-40 ----
    if sid == 'S-M03-40-DATA-033': add('m0340-three-columns-033.csv', csvb(['商品コード', '棚番号名称'], [['34003301', 'S-002-033', 'EXTRA']]), CASE('IT-M03-40-033') + '正規2列に追加列を足した3列。値は同じファイル群の bad-header-033 の「34003301,S-002-033」に追加列「EXTRA」')
    # ---- M03-38 ----
    H38 = ['商品ID', '商品公開ステータス', '支店の商品公開ステータス']
    mdata = re.search(r'見出し行=([^／]+)／データ行は1行=([^／（]+)', st)
    if mdata and sid.startswith('S-M03-38-') and not st.count('.csv'):
        fnm = {'S-M03-38-CBCSV-046': 'cbm0338-046.csv', 'S-M03-38-CBCSV-047': 'cbm0338-047.csv'}.get(sid, f'm03-38-{sid[9:].lower()}.csv')
        add(fnm, csvb(H38, [mdata.group(2).split(',')]), CASE(f'IT-M03-38-0{no[-2:]}') + ('ファイル名はケースの手順1のとおり。' if sid in ('S-M03-38-CBCSV-046', 'S-M03-38-CBCSV-047') else 'ファイル名は文にもケースにも無いので ' + fnm + ' とした。') + '見出しと1データ行は状態・属性のとおり')
    if sid.startswith('S-M03-38-QB-CSV-'):
        mm = re.search(r'データ行は1行=([^（／]+)', st); fn = re.search(r'ファイル名=([^／]+)', st).group(1)
        add(fn, csvb(H38, [mm.group(1).split(',')]), CASE(f'IT-M03-38-0{no[-2:]}') + '見出し・データ行は状態・属性のとおり')
    return out


def named_items(data, cols):
    """「商品ID 〔L〕・言語(ID)1・…」を {列: 値} にする(列名は cols の完全な名前、長い順に当てる)"""
    out = {}
    names = sorted(cols, key=lambda x: -len(x))
    for it in [x.strip() for x in re.split(r'・(?![^「]*」)', data) if x.strip()]:
        if re.match(r'^商品公開ステータスと支店の商品公開ステータスは公開を表す値', it): out['商品公開ステータス'] = '1'; out['支店の商品公開ステータス'] = '1'; continue
        hit = None
        for n in names:
            if it.startswith(n): hit = n; break
        if hit is None: return None
        v = it[len(hit):].strip()
        v = re.sub(r'^は', '', v)
        v = re.sub(r'（[^）]*）$', '', v).strip()
        if v == '日本語を表す値': v = '1'
        q = re.fullmatch(r'「([^」]*)」', v)
        if q: v = q.group(1)
        out[hit] = v
    return out

def build3(sid, st, how):
    out = {}
    no = (re.search(r'(\d+)$', sid) or [None, ''])[1]
    def add(fn, data, *notes): out[fn] = (data, list(notes))
    L = lambda pre: list(dict.fromkeys(re.findall(r'〔' + pre + r'[^〕]*〕', st)))
    CASE = lambda c: f'ケース {c} を読んだ。'
    H41 = R.HEAD41
    def n41(fn, jp, **kw):
        r = {'カテゴリ名(日)': jp, 'カテゴリ名(英)': 'M0341 ' + fn.replace('.csv', ''), '親カテゴリID': '0', 'フロント非表示フラグ': '0', '支店非表示フラグ': '0'}; r.update(kw); return r
    def c41(rows, head=H41, header=True): return ('\n'.join(','.join(cell(r.get(h, '')) for h in head) if r else ','.join(head) for r in ([None] if header else []) + rows) + '\n').encode('utf-8')
    B41 = lambda c: f'〔取込前の{c}〕'
    # ---- M03-26 ----
    CN = dict(R.CARD_NORMAL)
    def crow(**kw):
        r = dict(CN); r.update(kw); return r
    def cardcsv(rows, head=None):
        head = head or R.CARD_HEAD
        return ('\n'.join(','.join(cell(r.get(h, '')) for h in head) if r else ','.join(head) for r in [None] + rows) + '\n').encode('utf-8')
    if sid == 'S-M03-26-ROLLBACK-047':
        a, b = L('カード詳細ID-')[:2]
        add('rollback.csv', cardcsv([crow(**{'商品名(日)': 'M0326 試験カード-047A', '商品名(英)': 'M0326 Test Card 047A', 'カード詳細(ID)': a, '販売価格': '300', '買取価格': '100'}), crow(**{'商品名(日)': 'M0326 試験カード-047B', '商品名(英)': 'M0326 Test Card 047B', 'カード詳細(ID)': b, '販売価格': '300', '買取価格': '301'})]),
            CASE('IT-M03-26-047') + '1行目は販売価格300・買取価格100の正常行、2行目は買取価格301（販売価格300を上回る）。その他は正常値。商品名は文に無いので「M0326 試験カード-047A/B」')
    if sid == 'S-M03-26-CATEGORY-054':
        add('M0326-054-multi.csv', cardcsv([crow(**{'商品名(日)': 'M0326-054-商品', '商品名(英)': 'M0326-054-Item', '商品カテゴリ(ID)': '177,178', '基準価格': '300', '販売価格': '300', 'カード詳細(ID)': L('カード詳細ID-')[0], '買取価格': '100'})]), CASE('IT-M03-26-054') + '31列の1データ行。商品カテゴリ(ID)は「177,178」（引用符で囲む）。値は状態・属性のとおり')
    if sid == 'S-M03-26-LIMIT-034':
        m = re.search(r'カード詳細ID(\d+)〜(\d+)', st); a, b = int(m.group(1)), int(m.group(2))
        rows = [crow(**{'商品名(日)': f'M0326 試験カード-{k:04d}', '商品名(英)': f'M0326 Test Card {k:04d}', 'カード詳細(ID)': str(i)}) for k, i in enumerate(range(a, b + 1), 1)]
        add('limit-5010-034.csv', cardcsv(rows), CASE('IT-M03-26-034') + f'見出し+データ{len(rows)}行。カード詳細(ID)は状態・属性の範囲 {a}〜{b}、商品名は連番、ほかは正常値')
    if sid == 'S-M03-26-SMARTSTATE-060':
        for X in 'ABCD':
            lab = f'〔カード詳細ID-M0326-060{X}〕'
            add(f'M0326-060-{X}.csv', cardcsv([crow(**{'商品名(日)': 'M0326-060-商品', '商品名(英)': 'M0326-060-Item', '商品カテゴリ(ID)': '1,177', 'カード詳細(ID)': lab, '基準価格': '300', '販売価格': '300', '買取価格': '100', '地域別販売制限': '0'})]),
                CASE('IT-M03-26-060') + f'ファイル{X}の1行。カード詳細ID は状態・属性の〔060{X}〕。値は状態・属性のとおり')
    if sid in ('S-M03-26-QB-CSV-071', 'S-M03-26-QB-CSV-072'):
        fn = re.search(r'ファイル名=([^／]+)', st).group(1); dat = re.search(r'データ行は1行=(.+?)(?:／|$)', st).group(1)
        it = named_items(dat, R.CARD_HEAD)
        if it: add(fn, cardcsv([it]), CASE('IT-M03-26-0' + no[-2:]) + '見出し=アプリの雛形の30列。データ行は状態・属性のとおり（公開を表す値=1、アプリの定義）')
    # ---- M03-27 ----
    if sid in ('S-M03-27-QB-CSV-068', 'S-M03-27-QB-CSV-069', 'S-M03-27-QB-CSV-070'):
        fn = re.search(r'ファイル名=([^／]+)', st).group(1); dat = re.search(r'データ行は1行=(.+?)(?:／|$)', st).group(1)
        it = named_items(dat, GH)
        if it:
            it['言語(ID)'] = '1'; add(fn, m27csv([it]), CASE('IT-M03-27-0' + no[-2:]) + '見出し=アプリの雛形の32列。データ行は状態・属性のとおり（言語(ID)の「日本語を表す値」=1、公開を表す値=1。DBの言語表・アプリの定義）。文が書かない列は空')
    # ---- M04-13 ----
    H_SPLIT13 = ['商品コード', '分割先分割在庫数']; H_JOIN13 = ['商品コード', '結合元在庫数']
    SRC13 = 'アプリの取込定義（分割: 作り方のコード m04-13.ts writeSplitCsv の見出し／結合元: src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php の2列「商品コード・結合元在庫数」）'
    if sid == 'S-M04-13-DPCSV1-100': add('split_one-100.csv', csvb(H_SPLIT13, [['M0413-DST-A-100', '2']]), CASE('IT-M04-13-100') + '見出しは' + SRC13)
    if sid == 'S-M04-13-DPMIXCSV-103': add('split_mixed-103.csv', csvb(H_SPLIT13, [['M0413-DST-A-103', '2'], ['M0413-DST-C-103', ''], ['M0413-DST-B-103', '3']]), CASE('IT-M04-13-103') + '順序は文のとおり（Cの数量は空）。見出しは' + SRC13)
    if sid == 'S-M04-13-DPCSV2X-111': add('split_dup-111.csv', csvb(H_SPLIT13, [['M0413-DST-A-111', '2'], ['M0413-DST-B-111', '2']]), CASE('IT-M04-13-111') + '両商品を数量2。見出しは' + SRC13)
    if sid in ('S-M04-13-CBCSV-118', 'S-M04-13-CBCSV-119'): add(f'M0413-CB{no}.csv', csvb(H_JOIN13, [[f'M0413-CB{no}-B', '2']]), CASE(f'IT-M04-13-{no}') + 'M0413-CB' + no + '-B を結合元在庫数2。見出しは' + SRC13)
    # ---- M04-21 ----
    H21 = ['商品コード', '在庫増減数', '仕入単価']
    NT21 = '文が書かない列の値は、同じ機能の他のファイル（例: inbound-valid-012.csv の「3・200」、FORM-006 の「1・100」）に合わせて在庫増減数1・仕入単価100'
    if sid == 'S-M04-21-VALIDATION-016': add('required-columns-016.csv', csvb(H21, [['', '1', '100'], ['M421-IN-016', '', '100'], ['M421-IN-016', '1', '']]), CASE('IT-M04-21-016') + '2行目=商品コード空、3行目=在庫増減数空、4行目=仕入単価空。' + NT21)
    if sid == 'S-M04-21-VALIDATION-026': add('db-errors-026.csv', csvb(H21, [[c, '1', '100'] for c in ('UNKNOWN-M421-026', 'M421-VALID-026', 'DUP-M421-026', 'DEL-P-M421-026', 'DEL-C-M421-026')]), CASE('IT-M04-21-026') + '2〜6行目の商品コードは文のとおり。' + NT21)
    if sid == 'S-M04-21-LARGEFILE-039': add('rows-9999-039.csv', csvb(H21, [['M0421-039-A', '1', '100']] * 9999), CASE('IT-M04-21-039') + 'ヘッダー3列+データ9999行（改行数10000）')
    if sid == 'S-M04-21-WASTEBLANK-053': add('waste-blank-m0421-053.csv', csvb(H21, [['M0421-053-A', '-2', '']]), CASE('IT-M04-21-053') + '仕入単価の列は空')
    if sid == 'S-M04-21-CBMAIL-063': add('M0421-CB063.csv', csvb(H21, [['M0421-CB063-A', '3', '200'], ['M0421-CB063-NONE', '1', '200']]), CASE('IT-M04-21-063') + '文の「M0421-CB063-A・3・200・M0421-CB063-NONE・1・200」を2行にした（未登録の商品コードの行を含む）')
    # ---- M04-22 / M04-23 / M04-24 ----
    H_MV = ['商品コード', '移動点数']; H_XF = ['振替元商品コード', '振替先商品コード', '移動点数']
    SRC22 = '見出しは fixtures/m04-22 の在庫移動・振替CSVと同じ（移動: 商品コード,移動点数／振替: 振替元商品コード,振替先商品コード,移動点数）'
    mv = {'S-M04-22-MOVE-044': ('move-two-m0422-044.csv', [['M0422-044-A', '10'], ['M0422-044-B', '20']]), 'S-M04-22-MOVE-045': ('move-all-m0422-045.csv', [['M0422-045-A', '100']]), 'S-M04-22-MOVE-046': ('move-smaregi-m0422-046.csv', [['M0422-046-A', '5']]),
          'S-M04-22-CBMVSM-049': ('m0422-cb049-move.csv', [['M0422-CB049-A', '5']]), 'S-M04-22-CBMVSM2-050': ('m0422-cb050-move.csv', [['M0422-CB050-A', '5']])}
    if sid in mv: add(mv[sid][0], csvb(H_MV, mv[sid][1]), CASE('IT-M04-22-' + no) + 'CSV内容は状態・属性のとおり。' + SRC22)
    xf = {'S-M04-22-CBXFER1-051': ('m0422-cb051-xfer.csv', [['M0422-CB051-A', 'M0422-CB051-B', '10']]), 'S-M04-22-CBXFER2-052': ('m0422-cb052-xfer.csv', [['M0422-CB052-A', 'M0422-CB052-B', '10'], ['M0422-CB052-A', 'M0422-CB052-C', '20']]),
          'S-M04-22-CBXFER3-053': ('m0422-cb053-xfer.csv', [['M0422-CB053-A', 'M0422-CB053-B', '10']]), 'S-M04-22-CBXFER4-054': ('m0422-cb054-xfer.csv', [['M0422-CB054-A', 'M0422-CB054-B', '10'], ['M0422-CB054-A', 'M0422-CB054-C', '20']])}
    if sid in xf: add(xf[sid][0], csvb(H_XF, xf[sid][1]), CASE('IT-M04-22-' + no) + 'ヘッダー・データ行は状態・属性のとおり')
    if sid == 'S-M04-23-DPS-075': add('M0423-075-split-2dst.csv', csvb(R.HEAD_SPLIT, [['M0423-075-A', '10', 'M0423-075-B', '10'], ['M0423-075-A', '10', 'M0423-075-C', '10']]), CASE('IT-M04-23-075') + '分割CSVの見出し（fixtures/m04-23 と同じ）')
    H24 = ['移動指示ID', '送り状No.']
    if sid in ('S-M04-24-CSV-036', 'S-M04-24-CSV-037'):
        n_ = 65535 if sid.endswith('036') else 65536
        add(f'M04-24-length-{"max" if n_ == 65535 else "over"}-{no}.csv', csvb(H24, [[L('移動指示ID-')[0], 'A' * n_]]), CASE('IT-M04-24-' + no) + f'送り状No.は半角英字Aを{n_}文字。ID列は状態・属性の〔移動指示ID〕。見出しは作り方のコード m04-24.ts の「移動指示ID,送り状No.」')
    if sid == 'S-M04-24-DPS-048': add('M04-24-errors-3-048.csv', csvb(H24, [[f'4240480{k}', f'TRACK-M0424-048-{k}'] for k in (1, 2, 3)]), CASE('IT-M04-24-048') + '移動指示ID 42404801〜42404803（未登録）と一意の送り状No.')
    # ---- M03-41 ----
    if sid == 'S-M03-41-CASE-005':
        A, Bb = L('カテゴリID-M0341-005A')[0], L('カテゴリID-M0341-005B')[0]
        r1 = n41('multi_success-005.csv', 'CSV新規カテゴリ-005-1', **{'親カテゴリID': A, 'カテゴリ名(英)': 'M0341 multi_success-005-1'}); r2 = n41('multi_success-005.csv', 'CSV新規カテゴリ-005-2', **{'親カテゴリID': A, 'カテゴリ名(英)': 'M0341 multi_success-005-2'})
        upd = {h: B41(h) for h in H41}; upd.update({'カテゴリID': Bb, 'カテゴリ名(日)': '更新後カテゴリ-005'})
        add('multi_success-005.csv', c41([r1, r2, upd]), CASE('IT-M03-41-005') + '新規2行の名称・更新後の名称は作り方のコード m03-41.ts の M0341_VALUES（新規005・更新後005）。更新行の他の列は〔取込前の…〕', '〔取込前の<列名>〕: カテゴリ一覧の「CSVダウンロード」で出力したCSVの、そのカテゴリIDの行の同じ列の値に置き換えてから取り込む')
    if sid == 'S-M03-41-CASE-020':
        upd = {h: B41(h) for h in H41}; upd['カテゴリID'] = L('カテゴリID-')[0]; upd['削除フラグ'] = '2'
        add('delete_flag_invalid-020.csv', c41([upd], H41 + ['削除フラグ']), CASE('IT-M03-41-020') + '削除フラグ2（不正値）。ほかの値は「登録内容に対応する有効値」=登録済みの値なので〔取込前の…〕', '削除フラグ: アプリの雛形（12列）に無い列。文が値を書くこのファイルだけ、末尾に列「削除フラグ」を足した（作り方のコード m03-41.ts と同じ扱い）', '〔取込前の<列名>〕: カテゴリ一覧の「CSVダウンロード」で出力したCSVの、そのカテゴリIDの行の同じ列の値に置き換えてから取り込む')
    if sid == 'S-M03-41-DEPTH5-052':
        add('depth_five-052.csv', c41([n41('depth_five-052.csv', '第5階層カテゴリ-052', **{'カテゴリ名(英)': 'Depth Five Category-052', '親カテゴリID': L('カテゴリID-M0341-052D')[0], '階層': '99'})]), CASE('IT-M03-41-052') + 'CSV上の階層は99（文のとおり。階層はアプリが親から計算する）')
    if sid == 'S-M03-41-NOPARENT-054':
        add('parent_blank_depth3-054.csv', c41([n41('parent_blank_depth3-054.csv', '親未指定階層3カテゴリ-054', **{'カテゴリ名(英)': 'No Parent Category-054', '親カテゴリID': '', '階層': '3'})]), CASE('IT-M03-41-054') + '親カテゴリIDは空、階層3（文のとおり）')
    if sid == 'S-M03-41-QD-ENNAME-056':
        r = {'カテゴリID': L('カテゴリID-M0341-QD001B')[0], '表示ランク': '39', 'カテゴリ名(日)': 'QD英語名子001', 'カテゴリ名(英)': 'QDEnNew001', '親カテゴリID': L('カテゴリID-M0341-QD001A')[0], 'フロント非表示フラグ': '0', '支店非表示フラグ': '0'}
        add('english-update-001.csv', c41([r]), CASE('IT-M03-41-056') + '1行（カテゴリID・表示ランク39・日名・英名・親ID・両フラグ0）。文が書かない列は空')
    if sid == 'S-M03-41-DP-REPEAT-057':
        h7 = ['カテゴリID', '表示ランク', 'カテゴリ名(日)', 'カテゴリ名(英)', '親カテゴリID', 'フロント非表示フラグ', '支店非表示フラグ']
        add('repeat_new-057.csv', c41([{'カテゴリ名(日)': '重ね新規-M0341-057', 'カテゴリ名(英)': 'M0341-Category-057', '親カテゴリID': '0', 'フロント非表示フラグ': '0', '支店非表示フラグ': '0'}], h7), CASE('IT-M03-41-057') + '見出し7列は文のとおり（階層・検索・画像・対象商品数の列は無い）。同じファイルを2回取り込む')
    if sid == 'S-M03-41-DP-SEMI-059':
        add('semicolon_new-059.csv', ('カテゴリID;表示ランク;カテゴリ名(日);カテゴリ名(英);親カテゴリID;フロント非表示フラグ;支店非表示フラグ\n;;セミコロン取込-M0341-059;M0341-Category-059;0;0;0\n').encode('utf-8'), CASE('IT-M03-41-059') + 'セミコロン区切り。見出しとデータ行は文のとおり')
    if sid in ('S-M03-41-CBNEWTOP-062', 'S-M03-41-CBNEWDEPTH3-066'):
        top = sid.endswith('062'); nm = '新規最上位M0341-CB062' if top else '新規子M0341-CB066N'; en = 'M0341-CB062-New' if top else 'M0341-CB066-New'
        par = '0' if top else L('カテゴリID-M0341-066H')[0]
        fn = 'new_top-M0341-CB062.csv' if top else 'new_depth3-M0341-CB066.csv'
        r = n41(fn, nm, **{'カテゴリ名(英)': en, '親カテゴリID': par, '階層': '99', '対象商品数': '999', '削除フラグ': '0'})
        add(fn, c41([r], H41 + ['削除フラグ']), CASE('IT-M03-41-' + no) + 'CSV上の階層99・対象商品数999は文のとおり（アプリは使わない）。削除フラグ0', '削除フラグ: アプリの雛形（12列）に無い列。文が値を書くこのファイルだけ、末尾に列「削除フラグ」を足した（作り方のコード m03-41.ts と同じ扱い）')
    if sid == 'S-M03-41-CASE-040':
        d40 = R.rule_m0341_040('reordered_columns-040.csvはカテゴリ名(英)、カテゴリID、親カテゴリID、カテゴリ名(日)の順から始まる全列と新規カテゴリ「列順変更カテゴリ-040」1行', 'reordered_columns-040.csv')
        if d40: add('reordered_columns-040.csv', d40, CASE('IT-M03-41-040') + '列順を変えた全列と新規カテゴリ1行。日名以外の値は作り方のコード e2e/seeds/m03-41.ts の M0341_VALUES.列順040（英名 Reordered Category-040・フロント非表示フラグ1・支店非表示フラグ0・検索パラメータ rarity=40・画像パス）')
    if sid == 'S-M03-41-CASE-042':
        ub = {h: B41(h) for h in H41}
        add('no_header-042.csv', ('\n'.join([','.join(cell(n41('no_header-042.csv', '見出しなしカテゴリ-042').get(h, '')) for h in H41)]) + '\n').encode('utf-8'), CASE('IT-M03-41-042') + '見出し行なしで新規カテゴリ1行だけ（文は「見出しなし」とだけ書く。データ行は担当が決めた）')
        add('parent_id_missing-042.csv', c41([n41('parent_id_missing-042.csv', '親ID不存在カテゴリ-042', **{'親カテゴリID': '341999042'})]), CASE('IT-M03-41-042') + '新規カテゴリ1行、親ID 341999042（文のとおり。名称は担当が決めた）')
        add('depth_over-042.csv', c41([n41('depth_over-042.csv', '第6階層カテゴリ-042', **{'親カテゴリID': L('カテゴリID-M0341-042G')[0]})]), CASE('IT-M03-41-042') + '新規カテゴリ1行、親ID〔042G〕（名称は担当が決めた）')
        for fn, label, extra in (('delete_with_child-042.csv', '042H', {}), ('delete_name_blank-042.csv', '042J', {'カテゴリ名(日)': ''})):
            r = dict(ub); r['カテゴリID'] = f'〔カテゴリID-M0341-{label}〕'; r['削除フラグ'] = '1'; r.update(extra)
            add(fn, c41([r], H41 + ['削除フラグ']), CASE('IT-M03-41-042') + '削除指定（削除フラグ1）。ほかの値は〔取込前の…〕' + ('、カテゴリ名(日)は空' if extra else ''), '削除フラグ: アプリの雛形（12列）に無い列。末尾に列「削除フラグ」を足した', '〔取込前の<列名>〕: カテゴリ一覧の「CSVダウンロード」で出力したCSVの、そのカテゴリIDの行の同じ列の値に置き換えてから取り込む')
    # ---- M03-20-033 の見出し(表示フラグ)は curated 済み: 見出しの確認を避ける ----
    return out
