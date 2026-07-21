#!/usr/bin/env python3
"""全書番の解決結果を集約 → 引用ゲート → 三値分類 → 全4655行の台帳を出す。

捏造ゼロの保証:
  - エージェントの主張は gate.verify_claim を通ったものだけ採用
  - ゲート棄却・found:false は X_確定不能 として残し、値を決して採用しない
  - 「判定漏れ0」のために偽の一致へ落とすことをしない（確定不能は正当な分類）
"""
from __future__ import annotations
import json, re, glob
from pathlib import Path
from collections import Counter, defaultdict
from gate import verify_claim

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')

CHAR = re.compile(r'全角|半角|文字|メール|パスワード|テキスト|文字列')
def upper(s):
    if not s: return None
    ns = [int(x) for x in re.findall(r'\d+', s.replace(',', ''))]
    if not ns: return None
    return max(ns) if re.search(r'[〜~]', s) else ns[0]

def gate_side(side, system):
    """1系statementを検証。(value, notblank, ref, why) を返す。値はゲート通過時のみ。"""
    if not side or not side.get('found'):
        return None, None, None, (side or {}).get('reason', 'found:false')
    # attr_only = max_length/maxlength などの表示属性のみでサーバ側検証が無い。
    # 「入力できる最大長」を決めるのは Assert\Length であり、表示属性はクライアントで回避できる。
    # 値として採用してはいけない（実例: 0308 CustomerLoginType は pf `max_length=>320 //todo`,
    # ee `maxlength=>eccube_stext_len` でどちらも Assert\Length を持たない）。
    if side.get('attr_only') is True:
        return None, side.get('notblank'), \
            f"{side.get('form_file')}:{side.get('form_line')}", \
            'attr_only(表示属性のみ・サーバ側検証なし)'
    ok1, w1 = verify_claim(system, side.get('form_file'), side.get('form_line'),
                           side.get('form_quote'), None)
    if not ok1:
        return None, None, None, f'GATE棄却: {w1}'
    val = side.get('value')
    if val is not None:
        if side.get('const_quote'):
            ok2, w2 = verify_claim(system, side.get('const_file'), side.get('const_line'),
                                   side.get('const_quote'), val)
        else:
            ok2, w2 = verify_claim(system, side.get('form_file'), side.get('form_line'),
                                   side.get('form_quote'), val)
        if not ok2:
            return None, None, None, f'GATE棄却: {w2}'
    ref = f"{side.get('form_file')}:{side.get('form_line')}"
    return val, side.get('notblank'), ref, 'ok'

def main():
    items = json.load(open(SP / 'items.json'))
    resolved = {}
    stats = Counter()
    files = sorted(glob.glob(str(SP / 'out' / '*.json'))) + [str(SP / 'pilot_0209_result.json')]
    for f in files:
        book = Path(f).stem.replace('_result', '').replace('pilot_', '')
        try:
            data = json.load(open(f))
        except Exception as e:
            stats[f'読込失敗 {book}: {e}'] += 1
            continue
        for r in data:
            # (book, sheet, no) のみを鍵にする。
            # book内で no は 825/1746 がシートをまたいで重複するため、
            # sheet を無視した fallback は別シートの解決結果を誤って結合する。
            resolved[(book, r.get('sheet'), r.get('no'))] = r

    ledger = []
    for it in items:
        h = upper(it['maxlen'])
        r = resolved.get((it['book'], it['sheet'], it['no']))
        pv = ev = None; pnb = enb = None; pref = eref = None; pwhy = ewhy = '未解決(担当エージェント対象外)'
        if r:
            pv, pnb, pref, pwhy = gate_side(r.get('pf'), 'pf')
            ev, enb, eref, ewhy = gate_side(r.get('ee'), 'ee')
            if pwhy.startswith('GATE棄却'): stats['pf_GATE棄却'] += 1
            if ewhy.startswith('GATE棄却'): stats['ee_GATE棄却'] += 1

        # ---- 最大文字数トラック ----
        if h is None:
            v = 'S0_HTMLに数値制約なし'
        elif not CHAR.search(it['fmt']):
            v = 'S1_数値型の最大値(文字数と別トラック)'
        elif pv is None and ev is None:
            v = 'X_確定不能(両系)'
        elif pv is None:
            v = 'X_確定不能(pf)'
        elif ev is None:
            v = 'X_確定不能(ee)'
        elif h == pv == ev:
            v = 'A_一致(HTML=pf=ee)'
        elif h == ev and ev != pv:
            v = 'B_リニューアル変更(HTML=ee≠pf)'
        elif h == pv and pv != ev:
            # 方向は機械的に決められない。同じ定数変更(stext_len 50→255)を
            # B では「意図的リニューアル」、C では「ee実装漏れ」と読むのは非対称で論理矛盾。
            # 「設計書がpf値のまま未更新」の可能性が同等にある。方向は人が判断する。
            v = 'C_HTML=pf≠ee(設計書がpf値のまま未更新 or ee未実装。方向は要判断)'
        else:
            v = 'D_HTML孤立(≠pf かつ ≠ee)=経路確認待ち候補'

        # ---- 必須トラック ----
        hreq = it['req'] in ('◯', '○', '〇')
        hopt = it['req'] in ('-', '')
        if it['req'] in ('△',):
            rv = 'R_条件付き必須(判定保留)'
        elif pnb is None and enb is None:
            rv = 'RX_確定不能'
        elif hreq and (pnb is True or enb is True):
            rv = 'RA_必須で一致'
        elif hopt and (pnb is False and enb is False):
            rv = 'RA_任意で一致'
        elif hreq and pnb is False and enb is False:
            rv = 'RD_HTML必須だが両系で任意'
        elif hopt and (pnb is True or enb is True):
            rv = 'RD_HTML任意だが実装は必須'
        else:
            rv = 'RX_確定不能'

        ledger.append(dict(
            book=it['book'], sheet=it['sheet'], sheetTitle=it.get('sheetTitle', ''),
            no=it['no'], label=it['label'], fmt=it['fmt'],
            html_maxlen=it['maxlen'], html_max=h, html_req=it['req'],
            pf_max=pv, ee_max=ev, pf_notblank=pnb, ee_notblank=enb,
            pf_ref=pref, ee_ref=eref, pf_gate=pwhy, ee_gate=ewhy,
            verdict=v, req_verdict=rv,
        ))

    json.dump(ledger, open(SP / 'ledger.json', 'w'), ensure_ascii=False)
    print(f'=== 全 {len(ledger)} 行 最大文字数トラック ===')
    for k, n in sorted(Counter(x['verdict'] for x in ledger).items()):
        print(f'  {n:5d}  {k}')
    print(f'\n=== 必須トラック（制約対象のみ意味を持つ） ===')
    for k, n in sorted(Counter(x['req_verdict'] for x in ledger).items()):
        print(f'  {n:5d}  {k}')
    print(f'\nゲート棄却: {dict(stats)}')
    # 未判定漏れの機械保証
    assert all(x['verdict'] for x in ledger), '判定漏れあり'
    print('\n判定漏れ: 0 （全行に分類あり。確定不能も正当な分類として計上）')

if __name__ == '__main__':
    main()
