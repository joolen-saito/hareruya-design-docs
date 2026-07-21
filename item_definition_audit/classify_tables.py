#!/usr/bin/env python3
"""表の種類を宣言的に分類する（`item-table` クラスは画面項目定義以外にも使われている）。

実測: `<table class="item-table">` のヘッダ署名は50種以上あり、
      改訂履歴(Ver/改訂内容/改訂者)、画面遷移(遷移元/遷移先)、処理順序表なども同じクラス。
      「item-table 全数 = 画面項目定義」は誤りだった。

分類:
  ITEM      画面項目定義（識別ID + ラベル + 必須 or 最大文字数 を持つ）… 本調査の対象
  ITEM_CHK  画面項目定義の変種（必須列が無く「入力チェック」列に仕様がある）… 対象。checkから仕様を読む
  CSV       CSV定義表（主キー/入力例を持つ）… 画面項目定義ではない。**明示的に対象外宣言**
  OTHER     改訂履歴・画面遷移・処理順序など … 対象外
"""
from __future__ import annotations
import json, re
from collections import Counter

SP = '/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad'
rows = json.load(open(SP + '/items2.json'))

def table_kind(h):
    hs = h.split('|')
    has = lambda *xs: any(x in hs for x in xs)
    if '主キー' in hs or '入力例' in hs:
        return 'CSV'
    if '識別ID' not in hs and 'No' not in hs:
        return 'OTHER'
    if not has('ラベル', '項目名'):
        return 'OTHER'
    if has('必須') or has('最大文字数または最大値', '最大文字数', '最大値'):
        return 'ITEM'
    if has('入力チェック'):
        return 'ITEM_CHK'
    return 'OTHER'

c = Counter()
for r in rows:
    r['table_kind'] = table_kind(r['hdr'])
    c[r['table_kind']] += 1

# ITEM_CHK: 入力チェック列から必須・文字数を機械的に読む（推測しない。書かれている文字列のみ）
CHK_LEN = re.compile(r'(\d+)\s*文字(?:まで|以内)')
CHK_REQ = re.compile(r'必須')
n_recovered = 0
for r in rows:
    if r['table_kind'] != 'ITEM_CHK':
        continue
    chk = r.get('check') or ''
    m = CHK_LEN.search(chk)
    if m and not r.get('maxlen'):
        r['maxlen'] = f'{m.group(1)}文字'
        r['maxlen_src'] = '入力チェック列から抽出'
        n_recovered += 1
    if CHK_REQ.search(chk) and not r.get('req'):
        # 「チェックを入れた場合のみ必須」は条件付き＝△相当。断定しない
        r['req'] = '△' if '場合' in chk else '◯'
        r['req_src'] = '入力チェック列から抽出'

json.dump(rows, open(SP + '/items2.json', 'w'), ensure_ascii=False)
print('=== 表の種類別 行数 ===')
for k, v in c.most_common():
    print(f'  {v:5d}  {k}')
print(f'\n入力チェック列から最大文字数を回収: {n_recovered}件')
for r in rows:
    if r.get('maxlen_src'):
        print(f"  {r['book']} {r['sheet']} {r['label'][:16]:16s} maxlen={r['maxlen']} req={r['req']!r} ← {r['check'][:40]!r}")
print('\n=== ITEM/ITEM_CHK のうち仕様を持つ行（新しい監査対象） ===')
scope = [r for r in rows if r['table_kind'] in ('ITEM', 'ITEM_CHK')
         and (r['req'] in ('◯', '○', '〇', '△') or re.search(r'\d', r.get('maxlen') or ''))]
print(f'  {len(scope)}件')
