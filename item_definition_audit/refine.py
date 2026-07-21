#!/usr/bin/env python3
"""fable5推奨の再判定 — ラベル結合を捨て、台帳の per-row ee_ref/pf_ref を使う。

やること:
  (1) 数値トラック(S1 146件): 台帳の ee_ref/pf_ref が指す ->add( ブロックから
      Range/LessThanOrEqual の max を決定的に読む。Length(桁数) は 10^n-1 に換算し
      「設計上限 > 実装上限 = 入力不能」「設計上限 < 実装上限 = 実装が緩い」の片側判定。
  (2) X_確定不能(pf) 71件: 正典は ee なので pf 未解決は判定を阻まない。HTML vs ee の二値へ落とす。
  (3) S1誤振り分け: 「3文字」等の明示的な文字数指定が数値トラックへ混入している分を戻す。

値はすべてパーサがソースから読む。エージェントの主張は使わない。
"""
from __future__ import annotations
import json, re
from pathlib import Path
from collections import Counter

PF = Path('/home/y-saito/Developments/pf-eccube3')
EE = Path('/home/y-saito/Developments/ec-cube-enterprise')
SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')

def load_cfg(p):
    d = {}
    for ln in Path(p).read_text(encoding='utf-8').splitlines():
        m = re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(-?[0-9]+)\s*(#.*)?$', ln)
        if m:
            d[m.group(1)] = int(m.group(2))
    return d

PF_CFG = load_cfg(PF / 'src/Eccube/Resource/config/constant.yml.dist')
EE_CFG = load_cfg(EE / 'app/config/eccube/packages/eccube.yaml')

def block_at(system, ref):
    """ref='file:line' が指す ->add( ブロックの本文を返す。"""
    if not ref or ':' not in ref:
        return None
    file, _, line = ref.rpartition(':')
    try:
        line = int(line)
    except ValueError:
        return None
    p = (PF if system == 'pf' else EE) / file
    if not p.exists():
        return None
    lines = p.read_text(encoding='utf-8', errors='replace').splitlines()
    start = max(0, line - 1)
    buf = []
    for i in range(start, min(len(lines), start + 40)):
        if i > start and re.search(r"->add\(\s*'", lines[i]):
            break
        buf.append(lines[i])
    return '\n'.join(buf)

def resolve(expr, cfg):
    if expr is None:
        return None, None
    e = expr.strip()
    m = re.search(r"\[\s*'([A-Za-z0-9_]+)'\s*\]", e)
    if m and m.group(1) in cfg:
        return cfg[m.group(1)], m.group(1)
    lit = re.match(r'\s*(-?\d+)', e)
    if lit:
        return int(lit.group(1)), 'literal'
    return None, e.split('\n')[0][:40]

RANGE_MAX = re.compile(r"Range\(\s*(?:array\(|\[)(.{0,200}?)'max'\s*=>\s*(.{0,80})", re.S)
LTE = re.compile(r"LessThanOrEqual\(\s*(?:array\(|\[)?\s*(?:'value'\s*=>\s*)?(.{0,80})", re.S)
LEN_MAX = re.compile(r"Length\(\s*(?:array\(|\[)(?:.{0,120}?)'max'\s*=>\s*(.{0,80})", re.S)

def numeric_max(system, ref):
    """(値, 種別, 式) を返す。種別: range=値の上限 / digits=桁数上限"""
    blk = block_at(system, ref)
    if not blk:
        return None, None, None
    cfg = PF_CFG if system == 'pf' else EE_CFG
    m = RANGE_MAX.search(blk)
    if m:
        v, s = resolve(m.group(2), cfg)
        if v is not None:
            return v, 'range', s
    m = LTE.search(blk)
    if m:
        v, s = resolve(m.group(1), cfg)
        if v is not None:
            return v, 'range', s
    m = LEN_MAX.search(blk)
    if m:
        v, s = resolve(m.group(1), cfg)
        if v is not None:
            return v, 'digits', s
    return None, None, None

def upper(s):
    """上限値を取る。ハイフンは範囲区切りであって負号ではない（`0-999999999`）。
    負号として扱ってよいのは、直前が数字でない場合のみ（`-99999999～99999999`）。"""
    if not s:
        return None
    t = s.replace(',', '').replace('，', '')
    ns = [int(m.group(0)) for m in re.finditer(r'(?<![\d])-?\d+', t)]
    return max(ns) if ns else None

CHARSPEC = re.compile(r'\d+\s*文字')   # 「3文字」等の明示的な文字数指定
# 値の範囲指定（`0-999999999` `0~999999999` `-99999999～99999999`）。
# 単独の数値（`5`）は「最大値」でなく「最大文字数」の可能性が高い＝桁数換算してはいけない。
RANGESPEC = re.compile(r'\d\s*[-~〜～]\s*-?\d')

ledger = json.load(open(SP / 'ledger.json'))
stats = Counter()
new_findings = []

for r in ledger:
    v = r['verdict']

    # ---- (3) S1 誤振り分けの是正: 「N文字」と書いてあるものは文字数トラック ----
    if v.startswith('S1') and CHARSPEC.search(r['html_maxlen'] or ''):
        h, pv, ev = r['html_max'], r['pf_max'], r['ee_max']
        # aggregate.py と同一の分類ロジックを使う。
        # （以前ここに C 分岐が無く、HTML=pf≠ee を D と誤分類していた。
        #   実例: 0203 海外用郵便番号 設計50文字 / pf=50 / ee=10 は C が正しい）
        if pv is None and ev is None:
            r['verdict'] = 'X_確定不能(両系)'
        elif pv is None:
            r['verdict'] = 'X_確定不能(pf)'
        elif ev is None:
            r['verdict'] = 'X_確定不能(ee)'
        elif h == pv == ev:
            r['verdict'] = 'A_一致(HTML=pf=ee)'
        elif h == ev and ev != pv:
            r['verdict'] = 'B_リニューアル変更(HTML=ee≠pf)'
        elif h == pv and pv != ev:
            r['verdict'] = 'C_HTML=pf≠ee(設計書がpf値のまま未更新 or ee未実装。方向は要判断)'
        else:
            r['verdict'] = 'D_HTML孤立(≠pf かつ ≠ee)=経路確認待ち候補'
        stats['S1→文字数トラックへ是正'] += 1
        continue

    # ---- (1) 数値トラックの再判定 ----
    if v.startswith('S1'):
        h = upper(r['html_maxlen'])
        ev, ekind, eexpr = numeric_max('ee', r['ee_ref'])
        pv, pkind, pexpr = numeric_max('pf', r['pf_ref'])
        r['ee_num'], r['ee_num_kind'], r['ee_num_expr'] = ev, ekind, eexpr
        r['pf_num'], r['pf_num_kind'], r['pf_num_expr'] = pv, pkind, pexpr
        if h is None or ev is None:
            r['num_verdict'] = 'NX_確定不能(eeの数値制約を特定できず)'
            stats['数値: 確定不能'] += 1
            continue
        is_range = bool(RANGESPEC.search(r['html_maxlen'] or ''))
        if ekind == 'range':
            eff = ev                       # 実装も値範囲 → そのまま比較
        elif is_range:
            eff = 10 ** ev - 1             # 設計=値範囲 / 実装=桁数 → 桁数を値へ換算
        else:
            # 設計が単独数値（＝最大文字数の可能性が高い）で実装も桁数 → 桁数同士で比較。
            # 換算すると `電話番号1 設計=5` vs `Length(5)` を 5 vs 99999 と誤比較する。
            eff = ev
        r['ee_num_effective'] = eff
        r['ee_num_compare'] = ('値' if (ekind == 'range' or is_range) else '桁数')
        if h == eff:
            r['num_verdict'] = 'NA_一致(HTML=ee)'
            stats['数値: 一致'] += 1
        elif h > eff:
            r['num_verdict'] = 'ND1_設計上限>実装上限=設計値が入力不能'
            stats['数値: 設計値が入力不能'] += 1
            new_findings.append(('ND1', r, eff, ekind, eexpr))
        else:
            r['num_verdict'] = 'ND2_設計上限<実装上限=実装が設計より緩い'
            stats['数値: 実装が緩い'] += 1
            new_findings.append(('ND2', r, eff, ekind, eexpr))
        continue

    # ---- (2) X_確定不能(pf) を HTML vs ee の二値へ ----
    if v.startswith('X_確定不能(pf)') and r['ee_max'] is not None and r['html_max'] is not None:
        if r['html_max'] == r['ee_max']:
            r['verdict'] = 'A2_HTML=ee(pfは未解決だが正典はeeなので判定可)'
            stats['X(pf)→一致'] += 1
        else:
            r['verdict'] = 'D2_HTML≠ee(pf未解決。乖離候補)'
            stats['X(pf)→乖離候補'] += 1
            new_findings.append(('D2', r, r['ee_max'], 'chars', None))

json.dump(ledger, open(SP / 'ledger.json', 'w'), ensure_ascii=False)
print('=== 再判定の内訳 ===')
for k, n in sorted(stats.items()):
    print(f'  {n:4d}  {k}')
print(f'\n=== 最終分類（最大文字数トラック） ===')
for k, n in sorted(Counter(x['verdict'] for x in ledger).items()):
    print(f'  {n:5d}  {k}')
print(f'\n=== 数値トラック ===')
for k, n in sorted(Counter(x.get('num_verdict') for x in ledger if x.get('num_verdict')).items()):
    print(f'  {n:5d}  {k}')

print(f'\n=== 新たに浮上した乖離候補 {len(new_findings)}件 ===')
for tag, r, eff, kind, expr in new_findings[:30]:
    if tag == 'D2':
        print(f"  [D2] {r['book']} {r['sheetTitle'][:12]:12s} {r['label'][:16]:16s} 設計={r['html_max']} vs ee={r['ee_max']}  {r['ee_ref']}")
    else:
        print(f"  [{tag}] {r['book']} {r['sheetTitle'][:12]:12s} {r['label'][:14]:14s} 設計={r['html_maxlen'][:16]:16s} vs ee実効={eff} ({kind}:{expr})")

# ============================================================
# 追加の決定的絞り込み（fable5指摘の反映）
# ============================================================
pv_set = set(PF_CFG.values())
ev_set = set(EE_CFG.values())
# 複合型: 設計の単一項目に対し実装が複数フィールドへ分割している型。
# 設計「郵便番号 10」と ee SplitPostalType.postalCode01 Length(3) は単位が違う（前半のみ）。
COMPOSITE = re.compile(r'SplitPostalType|SplitPhoneNumberType|RepeatedEmailType|'
                       r'RepeatedPasswordType|AddressType|NameType|KanaType')

extra = Counter()
for r in ledger:
    if r['verdict'].startswith('D2') and r['html_max'] in pv_set and r['html_max'] not in ev_set:
        # 設計値が「pf固有の定数値」＝設計書がpf時代の値のまま更新されていない疑い
        r['verdict'] = 'C2_HTML=pf固有定数≠ee(設計書が未更新の疑い)'
        extra['D2→C2(設計値がpf固有定数と一致)'] += 1
    ref = r.get('ee_ref') or ''
    if r.get('num_verdict', '').startswith('ND') and COMPOSITE.search(ref):
        r['num_verdict'] = 'NX_確定不能(複合型。設計の単一項目と実装の分割フィールドで単位が違う)'
        extra['ND→確定不能(複合型のため断定せず)'] += 1

json.dump(ledger, open(SP / 'ledger.json', 'w'), ensure_ascii=False)
print('\n=== 追加絞り込み ===')
for k, n in sorted(extra.items()):
    print(f'  {n:4d}  {k}')
print('\n=== 確定後の最終分類（最大文字数トラック） ===')
for k, n in sorted(Counter(x['verdict'] for x in ledger).items()):
    print(f'  {n:5d}  {k}')
print('\n=== 確定後の数値トラック ===')
for k, n in sorted(Counter(x.get('num_verdict') for x in ledger if x.get('num_verdict')).items()):
    print(f'  {n:5d}  {k}')
