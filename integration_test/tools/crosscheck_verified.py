#!/usr/bin/env python3
"""既知の確定課題(impl_check/verified 500件)と付帯表4バグ候補を突合。

【fable5+codex レビュー反映版】
- 旧版の欠陥: A基準(basename+行±25+Jaccard0.05)が緩すぎ、除外298件の99%がこれ依存で
  別課題を誤除外(f06-02 ロールバック欠陥←登録済みチェック欠如 等)。B/Cは文長非対称で発火せず。
- 是正:
  1. **症状固有トークン**(数値/HTTPコード/識別子/カラム名/引用文字列)の共有>=2 を必須化。
     行番号近接・ファイル一致は「補強証拠」に降格(単独では一致にしない)。
  2. **非対称包含率** |候補∩既知|/|候補| を採用(既知側=タイトル+課題行に限定)。Jaccardの文長非対称を除去。
  3. **自動除外しない三値化**: 確定重複 / 重複疑い(要レビュー) / 新規。
  4. **対象範囲の層別**: verifiedが扱う機能ID(181)の内/外を分離。範囲外は「未突合」であり新規ではない。
  5. **監査可能な対照表**: 既知タイトル・適用ルール・包含率・共有症状トークンを出力。
"""
import csv, re, json, sys, glob
from pathlib import Path
from collections import defaultdict

V = "/home/y-saito/Developments/ec-cube-enterprise/.cursor/docs/impl_check/verified"
FID_RE = re.compile(r'\b([A-Z]\d{2}-\d{2})\b')
FL_RE  = re.compile(r'([\w./-]+\.(?:php|twig|js|xml|yaml|yml)):(\d+)')
FILE_RE= re.compile(r'([\w./-]+\.(?:php|twig|js|xml|yaml|yml))')
STOP = set('する ある こと もの ため よう この その れる られる いる など および また ただし 場合 実装 設計 機能 画面 項目 処理 対象 以下 上記 設定 表示 記載 規定 確認 内容 使用 利用 参照 存在 必要 可能 乖離 実機 確認 要実 候補'.split())

# 症状固有トークン: 数値+単位 / HTTPコード / snake_case・camelCase識別子 / dtb_/mtb_ / 引用語
SYMPTOM = re.compile(r'(?:[a-z][a-zA-Z0-9]*_[a-z0-9_]+'      # snake_case
                     r'|[a-z]+[A-Z][a-zA-Z0-9]*'              # camelCase
                     r'|\b[45]\d{2}\b'                        # HTTPコード
                     r'|\d+(?:秒|分|時間|日|件|桁|文字|px|ミリ秒)'
                     r'|\b\d{2,}\b'                           # 2桁以上の数値
                     r'|「[^」]{2,20}」)')                     # 引用文字列

def words(t):
    t = re.sub(r'[（）()\[\]「」【】、。・／/:：,\.\|\-–—]', ' ', t)
    return {w for w in re.findall(r'[\wぁ-んァ-ヶ一-龠]{2,}', t) if w not in STOP}
def symptoms(t): return {m.group(0) for m in SYMPTOM.finditer(t)}
def pathkey(p):
    parts = Path(p).parts
    return '/'.join(parts[-2:]) if len(parts) >= 2 else Path(p).name

# ---- 既知課題 ----
name2fid = {}
for mx in glob.glob(f"{V}/*/*_verification_matrix.md"):
    for l in Path(mx).read_text(encoding='utf-8').splitlines():
        m = re.match(r'\|\s*([A-Z]\d{2}-\d{2})\s+(.+?)\s*\|', l)
        if m: name2fid.setdefault(m.group(2).strip(), m.group(1))

known, SCOPE = [], set()
for r in csv.DictReader(open(f"{V}/ALL_issues.tsv", encoding='utf-8'), delimiter='\t'):
    body = r['本文'] or ''; title = r['タイトル'] or ''
    fids = set(FID_RE.findall(title + ' ' + body))
    fn = re.search(r'機能：(.+)', body)
    if fn:  # 画面名→ID(正規化した包含・双方向substrの誤対応を抑制)
        nm = re.sub(r'\s+', '', fn.group(1).strip())
        for k, v in name2fid.items():
            kk = re.sub(r'\s+', '', k)
            if nm and (nm == kk or (len(nm) >= 6 and nm in kk) or (len(kk) >= 6 and kk in nm)):
                fids.add(v)
    kadai = re.search(r'課題：(.+)', body)
    core = title + ' ' + (kadai.group(1) if kadai else '')   # 既知側は「タイトル+課題行」に限定
    known.append({'title': title, 'fids': fids,
                  'fl': [(pathkey(m.group(1)), int(m.group(2))) for m in FL_RE.finditer(body)],
                  'files': {pathkey(x) for x in FILE_RE.findall(body)},
                  'w': words(core), 'sym': symptoms(core + ' ' + body[:1200])})
    SCOPE |= fids
SCOPE |= set(name2fid.values())
by_fid = defaultdict(list)
for k in known:
    for f in k['fids']: by_fid[f].append(k)

# ---- 突合 ----
cands = json.load(open(sys.argv[1], encoding='utf-8'))
dup, susp, new, oos = [], [], [], []
for c in cands:
    if c['cat'] == '一致(非バグ)': continue
    fid = c['fid'].upper()
    if fid not in SCOPE:            # verifiedの対象範囲外＝未突合
        oos.append(c); continue
    cw, csym = words(c['fulltext']), symptoms(c['fulltext'])
    cpaths = {p for p, _ in c['fl']}
    best = None
    for k in by_fid.get(fid, []):
        cont = len(cw & k['w']) / len(cw) if cw else 0        # 非対称包含率
        shared_sym = csym & k['sym']
        near = any(p1 == p2 and abs(l1 - l2) <= 25 for p1, l1 in c['fl'] for p2, l2 in k['fl'])
        share = bool(cpaths & k['files'])
        if len(shared_sym) >= 2 and cont >= 0.15:   rule, tier, sc = f'症状トークン{len(shared_sym)}共有+包含{cont:.2f}', 'dup', 3 + cont
        elif cont >= 0.35:                          rule, tier, sc = f'高包含{cont:.2f}', 'dup', 2 + cont
        elif len(shared_sym) >= 2 and (near or share): rule, tier, sc = f'症状トークン{len(shared_sym)}共有+実装箇所一致', 'susp', 1.5 + cont
        elif cont >= 0.22 and (near or share):      rule, tier, sc = f'包含{cont:.2f}+実装箇所一致', 'susp', 1 + cont
        else: continue
        if not best or sc > best[0]:
            best = (sc, tier, rule, k['title'], sorted(shared_sym)[:4], round(cont, 2))
    if not best: new.append(c); continue
    c2 = dict(c); c2['tier'], c2['rule'], c2['known_title'], c2['shared_sym'], c2['cont'] = best[1], best[2], best[3], best[4], best[5]
    (dup if best[1] == 'dup' else susp).append(c2)

tot = len(dup) + len(susp) + len(new) + len(oos)
print(f"既知確定課題 {len(known)}件 / verified対象の機能ID {len(SCOPE)}件")
print(f"バグ候補(一致(非バグ)除く) {tot}")
print(f"  ① 確定重複→除外        : {len(dup)}")
print(f"  ② 重複疑い(要レビュー)  : {len(susp)}")
print(f"  ③ 新規(対象範囲内)      : {len(new)}")
print(f"  ④ 対象範囲外(未突合)    : {len(oos)}")
json.dump({'dup': dup, 'susp': susp, 'new': new, 'oos': oos, 'scope': sorted(SCOPE)},
          open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
