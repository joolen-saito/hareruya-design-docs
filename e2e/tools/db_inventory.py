#!/usr/bin/env python3
"""手順書の文(シード表の状態・属性と投入方法)で「DBシード」「DBへ直接設定」と書かれている箇所を洗い出す。DB・アプリには触らない。SQLは作らない。
出力: review/db_seed_inventory.tsv(1文1行)、review/db_seed_inventory_summary.tsv(種類別の集計)"""
import csv, os, re, collections, sys
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
PAT = re.compile(r'DB[^。／]{0,6}(?:シード|直接|投入|設定|で投入|へ投入|に投入)|直接設定|DBシード|DBを直接|DBで直接|DBへ直接|DB直接')
def split_sentences(text):
    out = []; cur = ''; depth = 0
    for ch in text:
        cur += ch
        if ch in '（(': depth += 1
        elif ch in '）)': depth = max(0, depth - 1)
        elif ch in '。／' and depth == 0: out.append(cur); cur = ''
    if cur: out.append(cur)
    return out
# 対象データの種類(先に当たったもの)
KINDS = [
 ('後始末(退避したデータの復元・DBの直接操作)', r'退避したデータ|復元する|元に戻す'),
 ('棚卸計画・棚卸詳細(作成日・在庫反映日・削除など)', r'棚卸(計画|詳細|名)'),
 ('大量データの一括投入(千件以上・スクリプト)', r'\d{4,}\s*(?:商品|件|行|レコード)|\d{1,3}(?:,\d{3})+|スクリプト|一括投入'),
 ('履歴・承認情報・呼び出し記録の削除/登録', r'履歴|承認情報|承認待ち|ログ|呼び出し記録'),
 ('在庫の数量・総原価・店舗別在庫', r'在庫数|総原価|在庫ID|在庫変動|在庫編集|在庫移動|店舗別在庫|ピッキング|ピック|入出庫|店頭在庫|在庫が|在庫を|在庫の|在庫区分|在庫'),
 ('売上・販売数・価格の実績値', r'販売数|販売実績|売上|価格|仕入'),
 ('スマレジ・外部連携の項目', r'スマレジ|連携|外部連携|GMO|Wordpress|API'),
 ('マスタ・参照データの投入(カテゴリ・タグ・部門・店舗・所属・管理者など)', r'マスタ|カテゴリ|タグ|部門|購入グループ|割引率|減額率|言語|カード状態|支払|配送|店舗|所属|管理者|権限|メンバー'),
 ('商品・規格・カードの項目', r'商品|規格|カード|Foil|セット|レアリティ|プロモ'),
 ('サイト設定・環境', r'サイト設定|環境|ページ|ブロック|設定|メール'),
 ('CSV・ファイルの準備', r'CSV|フィクスチャ|ファイル|画像'),
 ('ID・日時など画面で指定できない値', r'ID|作成日|登録日|日時|更新日|日付|番号'),
]
OPS = [('削除', r'削除'), ('復元', r'復元'), ('一括投入', r'一括投入|スクリプト|\d{4,}'), ('設定(値の指定)', r'設定|変更|更新|上書|空にする|書き換'), ('投入(登録)', r'投入|シード|登録|作成')]
REASON = re.compile(r'([^。／（）、]*(?:画面(?:で|に|が|は)[^。／]{0,24}(?:無い|ない|できない|行えない|作れない|指定できない|削除できない|変更できない|設定できない|入力できない|出せない)|画面が無く|画面が無い|画面に(?:は)?無い|画面では[^。／]{0,20}(?:できない|無い)|削除する画面が無い|値を画面で指定できない|IDの値を画面で指定できない)[^。／]*?ため)')
rows = []; seeds_seen = {}
fids = sorted(d for d in os.listdir(os.path.join(R, 'seed_files')) if os.path.isdir(os.path.join(R, 'seed_files', d)))
for fid in fids:
    for r in list(csv.reader(open(os.path.join(CASES, f'{fid}_seed_data.tsv'), encoding='utf-8'), delimiter='\t'))[1:]:
        sid = r[0]
        if (fid, sid) in seeds_seen: continue
        seeds_seen[(fid, sid)] = 1
        for part, label in ((r[3], '状態・属性'), (r[5], '投入方法')):
            sents = split_sentences(part)
            for k, sent in enumerate(sents):
                if not PAT.search(sent): continue
                kind = next((n for n, p in KINDS if re.search(p, sent)), 'その他')
                tgt = re.findall(r'([^。／（）、「」\s]{2,40}?)(?:は|が|を)画面', sent); target = tgt[-1] if tgt else ''
                op = next((n for n, p in OPS if re.search(p, sent)), '設定')
                mr = REASON.search(sent)
                if not mr:
                    mr = re.search(r'([^。／（）]{0,40}(?:画面|ため)[^。／]{0,40})', sent)
                    reason_ok = '×' if not (mr and 'ため' in mr.group(1) and '画面' in mr.group(1)) else '○'
                    why = mr.group(1)[:90] if reason_ok == '○' else ''
                else: reason_ok = '○'; why = mr.group(1)[:90]
                rows.append([fid, sid, r[2], label, kind, op, target, sent.strip()[:220].replace('\n', ' '), why.replace('\n', ' '), reason_ok])
out = os.path.join(R, 'review', 'db_seed_inventory.tsv')
with open(out, 'w', encoding='utf-8') as f:
    f.write('\t'.join(['機能ID', 'シードID', '論理名', '文の場所', '対象データの種類', '操作', '設定対象(文から)', '文(抜粋)', '画面でできない理由(文から)', '理由が文から読めるか']) + '\n')
    for x in rows: f.write('\t'.join(c.replace('\t', ' ') for c in x) + '\n')
c1 = collections.Counter(); c2 = collections.Counter(); sidset = collections.defaultdict(set)
for x in rows:
    c1[(x[4], x[5])] += 1; sidset[x[4]].add(x[1])
    c2[(x[4], x[9])] += 1
sm = os.path.join(R, 'review', 'db_seed_inventory_summary.tsv')
with open(sm, 'w', encoding='utf-8') as f:
    f.write('\t'.join(['対象データの種類', '文の数', 'シード数', '理由が読める文', '理由が読めない文']) + '\n')
    kinds = [k for k, _ in KINDS] + ['その他']
    for k in kinds:
        n = sum(v for (kk, _), v in c1.items() if kk == k)
        if n: f.write('\t'.join([k, str(n), str(len(sidset[k])), str(c2[(k, '○')]), str(c2[(k, '×')])]) + '\n')
    f.write('\t'.join(['合計', str(len(rows)), str(len({(x[0], x[1]) for x in rows})), str(sum(1 for x in rows if x[9] == '○')), str(sum(1 for x in rows if x[9] == '×'))]) + '\n')
print(open(sm, encoding='utf-8').read())
