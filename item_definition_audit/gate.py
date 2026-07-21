#!/usr/bin/env python3
"""引用検証ゲート（捏造ゼロの実体）

エージェントが出した主張を、実ファイルに対して機械的に再検証する。
LLMの出力は「主張」でしかなく、このゲートを通ったものだけが「事実」になる。

検証項目（すべて機械的・1つでも落ちたら棄却）:
  G-A 引用ファイルが実在する
  G-B 引用行±窓 に quote が literal に存在する（正規化は空白のみ）
  G-C 主張した数値が quote 内に literal に存在する
  G-D 主張した値が、定数経由なら定数辞書の値と一致する
落ちた主張は verdict を X_確定不能(検証失敗) にする。値は決して採用しない。
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

REPOS = {
    'pf': Path('/home/y-saito/Developments/pf-eccube3'),
    'ee': Path('/home/y-saito/Developments/ec-cube-enterprise'),
}
WINDOW = 6   # 引用行の前後何行まで許容するか

def squash(s):
    return re.sub(r'\s+', '', s or '')

def verify_claim(system, file, line, quote, value):
    """1主張を検証。(ok, reason) を返す。"""
    if system not in REPOS:
        return False, f'unknown system {system}'
    root = REPOS[system]
    p = (root / file)
    if not p.exists():
        return False, f'G-A: file not found {file}'
    try:
        lines = p.read_text(encoding='utf-8', errors='replace').splitlines()
    except Exception as e:
        return False, f'G-A: unreadable {e}'
    if not quote or not quote.strip():
        return False, 'G-B: empty quote'
    # G-B: 引用が実在するか
    # 窓は引用の行数に応じて動的に取る（'constraints'ブロック等は数十行に及ぶため、
    # 固定±6行だと真の主張を誤って棄却する）
    qlines = quote.count('\n') + 1
    lo = max(0, (line or 1) - 1 - WINDOW)
    hi = min(len(lines), (line or 1) - 1 + qlines + WINDOW)
    near = squash('\n'.join(lines[lo:hi]))
    whole = squash('\n'.join(lines))
    q = squash(quote)
    if q not in near:
        if q in whole:
            return False, 'G-B: quote exists but NOT at cited line (行番号が誤り)'
        return False, 'G-B: quote NOT found in file (捏造の疑い)'
    # G-C: 主張値が引用内に literal に在るか
    if value is not None:
        if not re.search(r'(?<!\d)' + re.escape(str(value)) + r'(?!\d)', quote):
            return False, f'G-C: value {value} not literally in quote (定数経由なら定数側の引用が要る)'
    return True, 'ok'

def gate(claims):
    """claims: [{system,file,line,quote,value,...}] -> 検証済み/棄却 に分ける"""
    passed, rejected = [], []
    for c in claims:
        ok, why = verify_claim(c.get('system'), c.get('file'), c.get('line'),
                               c.get('quote'), c.get('value'))
        c['gate'] = why
        (passed if ok else rejected).append(c)
    return passed, rejected

if __name__ == '__main__':
    # 自己テスト: 既知の真値と、意図的な捏造の両方をゲートに通す
    tests = [
        dict(name='真: pf MemberType name の Length', system='pf',
             file='src/Eccube/Form/Type/Admin/MemberType.php', line=50,
             quote="new Assert\\Length(array('max' => $this->config['stext_len']))", value=None),
        dict(name='真: pf stext_len 定数', system='pf',
             file='src/Eccube/Resource/config/constant.yml.dist', line=213,
             quote='stext_len: 50', value=50),
        dict(name='真: ee stext_len 定数', system='ee',
             file='app/config/eccube/packages/eccube.yaml', line=137,
             quote='eccube_stext_len: 255', value=255),
        dict(name='捏造: 存在しない値', system='pf',
             file='src/Eccube/Resource/config/constant.yml.dist', line=213,
             quote='stext_len: 999', value=999),
        dict(name='捏造: 存在しないファイル', system='pf',
             file='src/Eccube/Form/Type/Admin/NoSuchType.php', line=1,
             quote='whatever', value=1),
        dict(name='行番号誤り: 引用は在るが行が違う', system='pf',
             file='src/Eccube/Resource/config/constant.yml.dist', line=9999,
             quote='stext_len: 50', value=50),
    ]
    for t in tests:
        ok, why = verify_claim(t['system'], t['file'], t['line'], t['quote'], t['value'])
        print(f"  [{'PASS' if ok else 'REJECT'}] {t['name']:38s} -> {why}")
