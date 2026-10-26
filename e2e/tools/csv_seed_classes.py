#!/usr/bin/env python3
"""CSVで取り込むシードを、アプリに触らず作れるか（A）／環境の値が要る（B）／前のシードの取込で振られる番号が要る（C）に仕分ける。
静的な仕分け（シード表の文だけ）。DB・アプリには触らない。出力: review/csv_seed_classes.tsv, review/csv_seed_classes_summary.tsv"""
import csv, re, os, collections
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
split = [l.rstrip('\n').split('\t') for l in open(os.path.join(R, 'review', 'seed_split.tsv'), encoding='utf-8')][1:]
fx = {}
for l in list(open(os.path.join(R, 'fixtures', 'named-file-references.tsv'), encoding='utf-8'))[1:]:
    c = l.rstrip('\n').split('\t')
    if len(c) > 9 and c[7] != '未配置':
        for sid in re.split(r'[、,]', c[9]): fx.setdefault(sid.strip(), []).append(c[7])
ENV = re.compile(r'雛形|テンプレート|言語\s*[\(（]ID[\)）]|カテゴリID（|商品カテゴリ\(ID\)|購入グループ名称|試験環境で有効な値|日本語のID|画面から取得')
IMPORT = re.compile(r'アップロード|取込|取り込|インポート|ファイル|CSV|csv|tsv')
LABEL = re.compile(r'〔[^〕]+〕')
FILEWORD = re.compile(r'\.(csv|tsv|txt)|CSV|ファイル|行')
def refs(text):
    out = []
    for cl in re.split(r'[／。]', text):
        for m in LABEL.finditer(cl):
            near = cl[max(0, m.start()-25):m.end()+8]
            if '控え' in near: continue
            if FILEWORD.search(cl): out.append(m.group(0))
    return sorted(set(out))
# 取込の鍵（アプリの実ソース ec-cube-enterprise の取込CSVの必須見出しで確認）
#  商品ID/カテゴリIDが鍵 → 前のシードの取込で振られる番号が要る（グッズ商品CSV登録は「新規登録時は商品IDを入力しない」ため、人が決められない）
#  商品コードが鍵 → 人が決められる値で足りる。ほかの機能は未確認
ID_KEYED = {'M03-26', 'M03-28', 'M03-29', 'M03-30', 'M03-31', 'M03-38', 'M03-41', 'M03-16', 'M03-20', 'M03-21', 'M03-27', 'M03-37', 'M04-24'}  # 後ろ6つは取込CSVの見出しにID列がある(設計書・作り方のコードの見出し)ことで確認
CODE_KEYED = {'M03-32', 'M03-33', 'M03-35', 'M03-40'}
seeds = {}
for fid in sorted({r[0] for r in split}):
    rows = list(csv.reader(open(os.path.join(CASES, f'{fid}_seed_data.tsv'), encoding='utf-8'), delimiter='\t'))[1:]
    for r in rows: seeds[r[0]] = r
out = []
for r in split:
    fid, sid, name, kubun, share, cls, form = r[:7]
    if cls != 'ケースで登録' or not form.startswith('CSV'): continue
    s = seeds[sid]; st, how = s[3], s[5]
    T = st + '\n' + how
    lab = refs(st) + refs(how)
    if lab and fid in CODE_KEYED:
        lab = []; keyed = '鍵は商品コード(ソース確認済み)のため、番号の参照は取込の鍵ではない。'
    else: keyed = ''
    if lab: c, why = 'C 番号が要る', 'ファイルに関わる文が画面の振る番号を参照: ' + '、'.join(sorted(set(lab))[:3])
    elif not IMPORT.search(how): c, why = 'D 取込の記述なし', '投入方法にファイルを取り込む記述が無い(出力確認・状態の用意のみ)'
    elif ENV.search(T): c, why = 'B 環境の値が要る', '雛形・言語ID・カテゴリID・購入グループ名など環境の値を使う'
    else: c, why = 'A アプリに触らず作れる', '文中の値だけでファイルが組める'
    if c.startswith('C'): c = 'C 番号が要る' + ('(ID鍵・ソース確認済み)' if fid in ID_KEYED else '(鍵は未確認)')
    out.append([fid, sid, name, c, keyed + why, '配置済み: ' + '、'.join(fx[sid][:2]) if sid in fx else ''])
h = ['機能ID', 'シードID', '論理名', '仕分け', '根拠', 'fixtures']
w = lambda p, rows: open(p, 'w', encoding='utf-8').write('\n'.join('\t'.join(x) for x in rows) + '\n')
w(os.path.join(R, 'review', 'csv_seed_classes.tsv'), [h] + out)
cnt = collections.defaultdict(collections.Counter); idk = collections.Counter()
for o in out:
    cnt[o[0]][o[3][0]] += 1
    if 'ID鍵' in o[3]: idk[o[0]] += 1
tot = collections.Counter()
rows = [['機能ID', 'CSV候補', 'A作れる', 'B環境の値', 'C番号が要る', 'D取込の記述なし', 'うちC:ID鍵確認済み']]
for f in sorted(cnt):
    c = cnt[f]; tot.update(c); rows.append([f, str(sum(c.values()))] + [str(c[k]) for k in 'ABCD'] + [str(idk[f])])
rows.append(['合計', str(sum(tot.values()))] + [str(tot[k]) for k in 'ABCD'] + [str(sum(idk.values()))])
w(os.path.join(R, 'review', 'csv_seed_classes_summary.tsv'), rows)
print('\n'.join('\t'.join(r) for r in rows[-1:]))
