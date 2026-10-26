#!/usr/bin/env python3
"""機能ごとの「登録する順番」の一覧 seed_files/<機能ID>/_order.md を作る。DB・アプリには触らない。
依存の根拠(強い順): ① e2e/seeds の作り方の needs(.runs/seed_only/needs.tsv) ② シード表の文に出てくる他のシードID。
どちらも無いものは、区分(店舗→所属→管理者→参照マスタ→商品→在庫…)からの目安の位置に置く。区分からも決められないものは「順番不明」。"""
import csv, os, re, collections, glob
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
split = [l.rstrip('\n').split('\t') for l in open(os.path.join(R, 'review', 'seed_split.tsv'), encoding='utf-8')][1:]
needs = {}
nf = os.path.join(R, '.runs', 'seed_only', 'needs.tsv')
if os.path.exists(nf):
    for l in list(open(nf, encoding='utf-8'))[1:]:
        a = l.rstrip('\n').split('\t')
        needs[a[1]] = (a[2], [x for x in a[3].split(',') if x])
TIERS = [(0, ['環境設定', '試験環境設定', '外部連携', '外部連携設定', 'メール確認環境', '表示件数設定', '画面表示設定', 'CSV出力設定', '一覧設定', '環境', '設定', '試験環境', 'アプリケーション設定', '画面設定', '外部連携環境', 'メール環境', '採番設定', '基本設定', '出力設定']),
         (1, ['店舗', '支店', '在庫区分', '在庫変動区分']), (2, ['所属']), (3, ['管理者', 'メンバー', '承認者', '管理者アカウント']),
         (4, ['商品タグ', 'マスタ', 'マスター', '参照マスタ', '参照マスター', '各種マスタ', '業務マスタ', '商品関連マスタ', '検索マスタ', 'タグマスタ', '売上分析タグマスタ', 'カテゴリ', '部門', '棚番号', 'タグ', '略称タグ', '売上分析タグ', '購入グループ', '言語']),
         (5, ['商品', '商品規格', '規格', 'カード']), (6, ['在庫結合', '在庫分割', '在庫振替', '在庫変動履歴・在庫編集承認', '在庫変動履歴・在庫移動振替', '在庫変動履歴・在庫分割結合', '在庫変動履歴・店頭買取', '在庫変動履歴・ネット買取', '在庫', '商品在庫', '在庫移動', '在庫移動指示', '棚卸計画', '棚卸詳細']), (7, ['CSVフィクスチャ', 'ファイル', '試験用ファイル', '試験ファイル', '画像', '画像ファイル', 'CSV入力値', 'CSV', 'CSVファイル', '取込ファイル', '入力ファイル', '取込履歴', '会員', 'イベント', '日程', '受注'])]
def tier(kubun):
    best = None
    for t in kubun.split('・'):
        for k, words in TIERS:
            if t in words: best = k if best is None else max(best, k)   # 最も後ろの語に合わせる(例: 支店・商品・管理者・在庫 → 在庫)
    return best
seeds = {}
for fid in sorted({r[0] for r in split}):
    for r in list(csv.reader(open(os.path.join(CASES, f'{fid}_seed_data.tsv'), encoding='utf-8'), delimiter='\t'))[1:]:
        seeds[r[0]] = r
cls = {r[1]: r for r in split}
byf = collections.defaultdict(list)
for r in split: byf[r[0]].append(r[1])
# --- 作り方のコード(e2e/seeds)の中で、ほかのシードIDを直接使っているもの(needs でなく、呼んだり引いたりしている) ---
code_ref = collections.defaultdict(set)
for f in glob.glob(os.path.join(R, 'seeds', '*.ts')):
    src = open(f, encoding='utf-8').read()
    parts = re.split(r'(?=defineSeed\()', src)
    for part in parts:
        m = re.match(r'defineSeed\(\s*"(S-[^"]+)"', part)
        if not m: continue
        me = m.group(1)
        body = re.sub(r'^defineSeed\(\s*"[^"]+"\s*,\s*(\{[^}]*needs[^}]*\}\s*,)?', '', part, count=1)
        for o in set(re.findall(r'"(S-[A-Z]\d\d-\d\d-[A-Za-z0-9\-]+)"', body)):
            if o != me and o in seeds and o not in needs.get(me, ('', []))[1]: code_ref[me].add(o)

# --- 呼び名(〔…〕): 定義するシード(「控える」と書いたシード)が先 ---
LABEL = re.compile(r'〔[^〕]+〕')
definer = {}
for sid, r in seeds.items():
    t = r[3] + '\n' + r[5]
    for m in LABEL.finditer(t):
        near = t[max(0, m.start() - 30): m.end() + 10]
        if '控え' in near and m.group(0) not in definer: definer[m.group(0)] = sid

def _defs_uses(sid):
    t = seeds[sid][3] + '\n' + seeds[sid][5]; d = set(); u = set()
    for m in LABEL.finditer(t):
        near = t[max(0, m.start() - 30): m.end() + 10]
        (d if '控え' in near else u).add(m.group(0))
    return d, u - d
def label_reversed(x, y):
    """x が y より後に登録される、というコード呼び出しの辺が、呼び名の向き(控える側が先)で確かめられないか"""
    dx, ux = _defs_uses(x); dy, uy = _defs_uses(y)
    return not (dy & ux)   # y が控える呼び名を x が使っている、と確かめられた辺だけを採る(確かめられない・逆向きは採らない)

# --- 名前: 店舗・所属を定義するシードが先(その名前を投入方法・状態で選んで使うシードが後) ---
names_of = collections.defaultdict(set)
for sid, r in seeds.items():
    kub = r[1]; st = r[3]
    if '店舗' in kub or '支店' in kub:
        for m in re.finditer(r'([^／・=、（）\s「」]{2,24})=(?:本店|支店)', st): names_of[sid].add(m.group(1))
        for m in re.finditer(r'店(?:舗)?名(?:称)?[=：「]([^／・、（）」]{2,24})', st): names_of[sid].add(m.group(1))
    if '所属' in kub:
        for m in re.finditer(r'(?:=|・|、)(試[^／・、=（）\s]{0,10}所属[^／・、=（）\s]{0,4})|([^／・、=（）\s]{2,12}所属[A-Za-z0-9]{0,3})=', st):
            for g in m.groups():
                if g: names_of[sid].add(g)

CUE = re.compile(r'選んで|に所属|の店舗で|を使う|を使って|を用い|ログイン|前提|を指定|を入れ')
def direction(x, y, mention_pos_text):
    """X の文に Y のIDが出る。戻り値 'Yが先' / 'Xが先' / None(向き不明)"""
    tx, ty = tier(seeds[x][1]), tier(seeds[y][1])
    if mention_pos_text and CUE.search(mention_pos_text) and (tx is None or ty is None or ty <= tx): return 'Yが先'
    if tx is not None and ty is not None:
        if ty < tx: return 'Yが先'
        if ty > tx: return 'Xが先'
    return None

summary = [['機能ID', 'シード数', '作り方のneeds', '作り方のコード呼び出し', '呼び名', '名前', 'シード表の文(向きを決めた)', '区分の目安', '順番不明']]
tot = collections.Counter()
for fid, ids in byf.items():
    local = set(ids)
    dep = {x: {} for x in ids}   # x → {先のシード: 根拠}
    unclear = {x: [] for x in ids}
    def add(x, y, basis):
        if y != x and y in seeds and y not in dep[x]:
            dep[x][y] = basis
    for x in ids:
        for y in needs.get(x, ('', []))[1]: add(x, y, 'needs')
        for y in sorted(code_ref.get(x, ())):
            tx_, ty_ = tier(seeds[x][1]), tier(seeds[y][1])
            if tx_ is not None and ty_ is not None and ty_ > tx_: continue   # 設定が事例データに依存するなどは向きが逆で、メッセージ中のIDの言及と見て採らない
            if label_reversed(me_ := x, y): continue   # 呼び名を控える側が先。y が控える呼び名を x が使う、と確かめられない辺は採らない
            add(x, y, 'コード呼び出し')
        st = seeds[x]; text = st[3] + '\n' + st[5]
        for lab in dict.fromkeys(LABEL.findall(text)):
            d = definer.get(lab)
            if d and d != x:
                # 自分が定義する側なら依存しない(自分の文に「控える」がある)
                near_self = [m for m in LABEL.finditer(text) if m.group(0) == lab and '控え' in text[max(0, m.start() - 30): m.end() + 10]]
                if not near_self: add(x, d, '呼び名')
        if tier(st[1]) is not None and tier(st[1]) >= 3:
            for y, nm in names_of.items():
                if y not in local: continue
                if y != x and any(len(n) >= 3 and n in text for n in nm) and tier(seeds[y][1]) is not None and tier(seeds[y][1]) < tier(st[1]): add(x, y, '名前')
        for y in dict.fromkeys(re.findall(r'S-[A-Z]\d\d-\d\d-[A-Za-z0-9\-]+', text)):
            if y == x or y not in seeds or y in dep[x]: continue
            i = text.find(y); ctx = text[max(0, i - 40): i + len(y) + 10]
            dr = direction(x, y, ctx)
            if dr == 'Yが先': add(x, y, 'シード表の文')
            elif dr == 'Xが先': pass   # 逆向きは y の側の文で扱う(ここでは x に依存を付けない)
            else: unclear[x].append(y)
    # y の側から見た逆向き(文): x が先と決まったものは、y に依存を付ける
    for x in ids:
        st = seeds[x]; text = st[3] + '\n' + st[5]
        for y in dict.fromkeys(re.findall(r'S-[A-Z]\d\d-\d\d-[A-Za-z0-9\-]+', text)):
            if y in local and y != x and y not in dep[x]:
                i = text.find(y); ctx = text[max(0, i - 40): i + len(y) + 10]
                if direction(x, y, ctx) == 'Xが先' and x not in dep[y]: add(y, x, 'シード表の文')
    order = []; state = {}
    def key(z): return ((tier(seeds[z][1]) if tier(seeds[z][1]) is not None else 9), z)
    def visit(x, path):
        if state.get(x) == 2 or x in path: return
        state[x] = 1
        for y in sorted((d for d in dep[x] if d in local), key=key): visit(y, path + [x])
        state[x] = 2; order.append(x)
    for x in sorted(ids, key=key): visit(x, [])
    pos = {x: i for i, x in enumerate(order)}
    c = collections.Counter()
    lines = [f'# {fid} 登録する順番', '',
             '「先に登録するもの」は、そのシードより前に登録しておくもの。根拠は次のとおり。',
             '- needs: e2e/seeds の作り方が先に作ると定めているもの',
             '- コード呼び出し: 作り方のコードが、ほかのシードを直接使っているもの',
             '- 呼び名: 文中の〔…〕（画面が振る番号の呼び名）を、別のシードが控えるもの（控える側が先）',
             '- 名前: 投入方法・状態が選ぶ店舗名・所属名を、別のシードが登録するもの（登録する側が先）',
             '- シード表の文: 文に他のシードIDが出るもので、「選んで」「ログイン」などの使い方か、区分の段（環境・設定 → 店舗 → 所属 → 管理者 → 参照マスタ → 商品 → 在庫…）の低い方を先にしたもの',
             '- 区分の目安: 依存が文から読めないもの。区分の段の位置に置いた（同じ段の前後はどちらでもよい）',
             '- 順番不明: 関係はあるが向きが決まらない、または区分からも決められない', '',
             '| 順 | シードID | 論理名 | 区分 | 分類 | 先に登録するもの | 順番の根拠 |', '|---|---|---|---|---|---|---|']
    shared_qc = [x for x in ('S-M03-30-QC-ENV', 'S-M03-30-QC-MASTERS', 'S-M03-30-QC-ADM') if x in ids]
    if shared_qc:
        lines[1:1] = ['', '注意: ' + '・'.join(shared_qc) + ' は M03-30 / M03-31 / M03-32 の三つのシード表に同じ名前で載っている同一のシード。'
                      '同じシード（M03-30 の表のもの）を一度登録すれば足りる。'
                      + ('' if fid == 'M03-30' else '他の機能で登録済みなら、ここでは登録し直さない。')]
    for sid in order:
        r = cls[sid]; t = tier(seeds[sid][1])
        d = {y: b for y, b in dep[sid].items()}
        local_d = [y for y in d if y in local and pos[y] < pos[sid]]
        ext = [y for y in d if y not in local]
        bases = list(dict.fromkeys(d[y] for y in list(local_d) + ext))
        if bases:
            basis = '・'.join(bases)
            for b in bases: c[b] += 1
        elif unclear[sid]: basis = '順番不明（関係: ' + '、'.join(unclear[sid][:3]) + '、向きが決まらない）'; c['順番不明'] += 1
        elif t is not None: basis = f'区分の目安（段{t}）'; c['区分の目安'] += 1
        else: basis = '順番不明'; c['順番不明'] += 1
        pre = '、'.join(local_d + [f'{y}（他機能）' for y in ext])
        lines.append(f'| {pos[sid] + 1} | {sid} | {r[2]} | {r[3]} | {r[5]} | {pre} | {basis} |')
    open(os.path.join(R, 'seed_files', fid, '_order.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    row = [fid, str(len(ids))] + [str(c[k]) for k in ['needs', 'コード呼び出し', '呼び名', '名前', 'シード表の文', '区分の目安', '順番不明']]
    summary.append(row); tot.update({k: c[k] for k in c})
summary.append(['合計', str(sum(int(r[1]) for r in summary[1:]))] + [str(tot[k]) for k in ['needs', 'コード呼び出し', '呼び名', '名前', 'シード表の文', '区分の目安', '順番不明']])
open(os.path.join(R, 'review', 'seed_order_summary.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(r) for r in summary) + '\n')
print(summary[-1])
