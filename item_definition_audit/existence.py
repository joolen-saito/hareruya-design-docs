#!/usr/bin/env python3
"""表示専用要素（ラベル/ボタン/リンク等）の文言 存在スキャン。

重要な限定（過大主張を避けるため明記）:
  - これは「一致」を主張しない。文言が実装に literal に現れるかの存在確認のみ。
  - ヒットしない = 誤り ではない。実装が翻訳キー/別表記の場合があるため「未確認」に留める。
    （実例: 「2段階認証」は ee に literal に無いが TwoFactorAuthType として実在する）
  - よって出力は 存在確認済 / 未確認 の2値であり、乖離判定には使わない。
"""
from __future__ import annotations
import json, re, unicodedata
from pathlib import Path
from collections import Counter

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')
PF = Path('/home/y-saito/Developments/pf-eccube3')
EE = Path('/home/y-saito/Developments/ec-cube-enterprise')

def blob(root, globs):
    parts = []
    for g in globs:
        for f in root.glob(g):
            if f.is_file() and f.stat().st_size < 4_000_000:
                try:
                    parts.append(f.read_text(encoding='utf-8', errors='replace'))
                except Exception:
                    pass
    return unicodedata.normalize('NFKC', '\n'.join(parts))

print('索引構築中...')
pf_blob = blob(PF, ['src/Eccube/Resource/template/**/*.twig',
                    'app/Plugin/*/Resource/template/**/*.twig',
                    'src/Eccube/Resource/locale/*.yml',
                    'app/Plugin/*/Resource/locale/*.yml',
                    'src/Eccube/Form/**/*.php', 'app/Plugin/*/Form/**/*.php'])
ee_blob = blob(EE, ['src/Eccube/Resource/template/**/*.twig',
                    'src/Eccube/Resource/locale/*.yaml',
                    'src/Eccube/Resource/locale/*.yml',
                    'src/Eccube/Form/**/*.php'])
print(f'  pf索引 {len(pf_blob):,}文字 / ee索引 {len(ee_blob):,}文字')

def norm(s):
    return unicodedata.normalize('NFKC', (s or '').strip())

items = json.load(open(SP / 'items.json'))
DISPLAY = re.compile(r'ラベル|ボタン|リンク|画像|^-$')
out = []
for it in items:
    lab = norm(it['label'])
    if not lab or len(lab) < 2:
        hit_pf = hit_ee = None
    else:
        hit_pf = lab in pf_blob
        hit_ee = lab in ee_blob
    if hit_pf is None:
        st = 'E_短すぎ/空(対象外)'
    elif hit_pf and hit_ee:
        st = 'E1_両系で文言確認'
    elif hit_ee and not hit_pf:
        st = 'E2_eeのみで文言確認(新機能の可能性)'
    elif hit_pf and not hit_ee:
        st = 'E3_pfのみで文言確認(ee未移行の可能性)'
    else:
        st = 'E4_未確認(翻訳キー/別表記の可能性。誤りとは限らない)'
    out.append(dict(book=it['book'], sheet=it['sheet'], no=it['no'], label=it['label'],
                    fmt=it['fmt'], display=bool(DISPLAY.search(it['fmt'])), status=st))

json.dump(out, open(SP / 'existence.json', 'w'), ensure_ascii=False)
print(f'\n=== 全 {len(out)} 行 文言存在スキャン ===')
for k, n in sorted(Counter(x['status'] for x in out).items()):
    print(f'  {n:5d}  {k}')
print('\n=== 表示専用要素のみ ===')
for k, n in sorted(Counter(x['status'] for x in out if x['display']).items()):
    print(f'  {n:5d}  {k}')
