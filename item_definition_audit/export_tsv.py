#!/usr/bin/env python3
"""全4,655行の台帳をTSVへ書き出す（これ1本で全件が読めるようにする）。

収録するもの:
  - HTML設計書の生の値（識別ID/ラベル/書式/必須/最大文字数/初期値/画面部品の説明）
  - 三値比較の判定（最大文字数・必須・数値の3トラック）
  - pf/ee の Form 上限と出典 file:line
  - pf/ee の DB列長・型と出典（判定できた行のみ）
  - 文言存在スキャンの結果
  - 各行がなぜ確定不能なのかの理由
"""
from __future__ import annotations
import json, csv
from pathlib import Path

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')
OUT = Path('/home/y-saito/Developments/hareruya-design-docs/item_definition_audit/item_definition_audit.tsv')

ledger = json.load(open(SP / 'ledger.json'))
items = {(x['book'], x['sheet'], x['no']): x for x in json.load(open(SP / 'items.json'))}
exist = {(x['book'], x['sheet'], x['no']): x for x in json.load(open(SP / 'existence.json'))}

rows = []
for x in ledger:
    k = (x['book'], x['sheet'], x['no'])
    it = items.get(k, {})
    ex = exist.get(k, {})
    rows.append({
        # --- HTML設計書の生データ ---
        '書番': x['book'],
        'シートID': x['sheet'],
        'シート名': x['sheetTitle'],
        '識別ID': x['no'],
        'ラベル': x['label'],
        '書式・制限': x['fmt'],
        '必須': x['html_req'],
        '最大文字数または最大値': x['html_maxlen'],
        '初期値': it.get('init', ''),
        '画面部品の説明': (it.get('desc', '') or '').replace('\n', ' / ')[:300],
        # --- 判定 ---
        '判定_最大文字数': x['verdict'],
        '判定_必須': x['req_verdict'],
        '判定_数値': x.get('num_verdict', ''),
        '判定_文言存在': ex.get('status', ''),
        # --- 実装側の値（Form層＝入力できる上限） ---
        'pf_Form上限': x['pf_max'] if x['pf_max'] is not None else '',
        'ee_Form上限': x['ee_max'] if x['ee_max'] is not None else '',
        'pf_Form出典': x['pf_ref'] or '',
        'ee_Form出典': x['ee_ref'] or '',
        'pf_必須(NotBlank)': '' if x['pf_notblank'] is None else x['pf_notblank'],
        'ee_必須(NotBlank)': '' if x['ee_notblank'] is None else x['ee_notblank'],
        # --- 実装側の値（DB層＝保存先の容量。入力上限ではない） ---
        'pf_DB列長': x.get('pf_db_len', '') if x.get('pf_db_len') is not None else '',
        'ee_DB列長': x.get('ee_db_len', '') if x.get('ee_db_len') is not None else '',
        'pf_DB出典': x.get('pf_db_ref', '') or '',
        'ee_DB出典': x.get('ee_db_ref', '') or '',
        # --- 数値トラックの実効上限 ---
        'ee_数値実効上限': x.get('ee_num_effective', ''),
        'ee_数値根拠': x.get('ee_num_expr', '') or '',
        # --- なぜ確定できなかったか ---
        '未確定の理由_pf': x.get('pf_gate', ''),
        '未確定の理由_ee': x.get('ee_gate', ''),
        '備考': x.get('db_note', ''),
    })

# 1行=1レコードを保証する。フィールド内に改行やタブが残ると awk/cut/Excel が壊れる
# （実測: 初期値・画面部品の説明・シート名に改行が入り、S0が4,244→4,194に化けた）。
def flat(v):
    s = '' if v is None else str(v)
    s = s.replace('\r\n', ' / ').replace('\n', ' / ').replace('\r', ' / ').replace('\t', ' ')
    # QUOTE_NONE では " も区切りを壊しうるので全角へ逃がす（設計書の文言に実在する）
    return s.replace('"', '”')

rows = [{k: flat(v) for k, v in r.items()} for r in rows]

with OUT.open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter='\t',
                       quoting=csv.QUOTE_NONE, escapechar=None)
    w.writeheader()
    w.writerows(rows)

# 検算: 物理行数 == データ行数+1 でなければ壊れている
phys = sum(1 for _ in OUT.open(encoding='utf-8'))
assert phys == len(rows) + 1, f'TSVが壊れている: 物理行={phys} 期待={len(rows)+1}'
print(f'物理行数検算: {phys} = {len(rows)}行 + ヘッダ1  OK')

print(f'書き出し: {OUT}  {len(rows)}行 x {len(rows[0])}列')
n = lambda k: sum(1 for r in rows if str(r[k]).strip())
print('\n主要列の充填:')
for k in ['判定_最大文字数', '判定_必須', '判定_文言存在', 'ee_Form上限', 'ee_Form出典',
          'ee_DB列長', '初期値', '画面部品の説明', '未確定の理由_ee']:
    print(f'  {k:18s} {n(k):5d}/{len(rows)}')
