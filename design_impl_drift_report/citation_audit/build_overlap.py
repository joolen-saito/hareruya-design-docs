#!/usr/bin/env python3
"""Backlogチケット(C) と 設計書乖離リスト(A) の重複を突合し、Markdown を出す。

突合の手掛かり:
  1. チケット本文の「設計書：0301_....xlsx」→ 書籍コード(4桁)
  2. 本文/件名に現れる機能No（例 F01-01）
  3. 「期待される挙動」「現在の挙動」と、乖離側の 設計期待値/差分内容 の文字列類似度

確度を3段階に分けて出す。機械突合なので、確度Cは人の確認が要る。
"""
import csv, json, os, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ISSUES = os.path.join(REPORT, 'backlog_wip', 'issues.json')
BLTSV = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
MD = os.path.join(REPORT, 'OVERLAP_ANALYSIS.md')
OUT = os.path.join(REPORT, 'backlog_wip', 'overlap_map.tsv')

SIM_STRONG = 0.42     # この類似度以上なら内容も一致とみなす
SIM_WEAK = 0.28

FNO = re.compile(r'\b([A-Z]\d{2}-\d{2})\b')
BOOK = re.compile(r'(\d{4})_基本設計仕様書')


def norm(s):
    s = re.sub(r'[\s　]+', '', s or '')
    return re.sub(r'[「」『』（）()【】\[\]:：・,、。/\-_]', '', s)


def sim(a, b):
    return SequenceMatcher(None, a[:600], b[:600]).ratio()


def main():
    iss = json.load(open(ISSUES, encoding='utf-8'))
    bl = {r['課題キー']: r for r in csv.DictReader(open(BLTSV, encoding='utf-8'), delimiter='\t')}
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    live = [(i, r) for i, r in enumerate(F, 1) if not r['トリアージ区分'].endswith('クローズ')]

    # 乖離側の索引
    by_fno = defaultdict(list)
    by_book = defaultdict(list)
    for i, r in live:
        by_fno[r['機能No']].append((i, r))
        m = BOOK.search(r['設計書参照'])
        if m:
            by_book[m.group(1)].append((i, r))

    def num(v):
        try:
            return float(v or 0)
        except ValueError:
            return 0.0

    results = []
    for it in iss:
        key = it['issueKey']
        text = (it['summary'] or '') + '\n' + (it.get('description') or '')
        fnos = set(FNO.findall(text))
        books = set(BOOK.findall(text))
        # 突合本文: 期待される挙動＋現在の挙動
        m = re.search(r'#\s*期待される挙動.*?\n(.*?)(?=\n#|\Z)', text, re.S)
        n = re.search(r'#\s*現在の挙動.*?\n(.*?)(?=\n#|\Z)', text, re.S)
        body = norm((m.group(1) if m else '') + (n.group(1) if n else '') or text)

        cands = []
        for f in fnos:
            cands += by_fno.get(f, [])
        tier_base = 'A' if cands else ''
        if not cands:
            for b in books:
                cands += by_book.get(b, [])
            tier_base = 'B' if cands else ''
        seen, uniq = set(), []
        for i, r in cands:
            if i not in seen:
                seen.add(i)
                uniq.append((i, r))

        best, bs = None, 0.0
        for i, r in uniq:
            s = sim(body, norm(r['設計期待値'] + r['差分内容']))
            if s > bs:
                best, bs = (i, r), s

        if not uniq:
            tier, matched = 'なし', None
        elif tier_base == 'A' and bs >= SIM_WEAK:
            tier, matched = '確度A(機能No+内容一致)', best
        elif tier_base == 'A':
            tier, matched = '確度B(機能Noのみ一致)', best
        elif bs >= SIM_STRONG:
            tier, matched = '確度B(書籍+内容一致)', best
        elif bs >= SIM_WEAK:
            tier, matched = '確度C(書籍一致・内容は弱い)', best
        else:
            tier, matched = 'なし', None

        b = bl.get(key, {})
        results.append({
            '課題キー': key, '件名': re.sub(r'\s+', ' ', it['summary'])[:100],
            '種別': it['issueType']['name'],
            'Backlog工数': b.get('工数', ''), 'Backlog区分': b.get('改修区分名', ''),
            '突合確度': tier,
            '乖離row': matched[0] if matched else '',
            '乖離機能No': matched[1]['機能No'] if matched else '',
            '乖離工数': matched[1]['codex工数'] if matched else '',
            '類似度': f'{bs:.2f}' if matched else '',
            '候補数': len(uniq),
        })

    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()), delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(results)

    tc = Counter(r['突合確度'] for r in results)
    dup_a = [r for r in results if r['突合確度'].startswith('確度A')]
    dup_b = [r for r in results if r['突合確度'].startswith('確度B')]
    dup_c = [r for r in results if r['突合確度'].startswith('確度C')]
    none = [r for r in results if r['突合確度'] == 'なし']

    def bsum(rs):
        return sum(num(r['Backlog工数']) for r in rs)

    total_bl = sum(num(r['Backlog工数']) for r in results)
    nd_bl = sum(1 for k, v in bl.items() if v['仕様確定要'] == 'YES')

    L, A = [], lambda x: L.append(x)
    A('# Backlogチケットと設計書乖離リストの重複突合\n')
    A('Backlog「不具合（バグ）」対応中 255件 と、設計書乖離リスト 1,007件（クローズ済を除く）を'
      '機械突合した結果。\n')
    A('突合の手掛かりは ①チケット本文の「設計書：〇〇.xlsx」→書籍コード ②本文中の機能No '
      '③「期待される挙動／現在の挙動」と乖離側の設計期待値・差分内容の文字列類似度。\n')
    A(f'出力: `backlog_wip/overlap_map.tsv`（{len(results)}行）\n')

    A('## 突合結果\n')
    A('| 確度 | 意味 | 件数 | Backlog側工数 |')
    A('|---|---|---:|---:|')
    A(f'| 確度A | 機能Noが一致し、内容も一致 | {len(dup_a)} | {bsum(dup_a):.1f} |')
    A(f'| 確度B | 機能Noのみ一致、または書籍＋内容が一致 | {len(dup_b)} | {bsum(dup_b):.1f} |')
    A(f'| 確度C | 書籍は一致するが内容の一致が弱い | {len(dup_c)} | {bsum(dup_c):.1f} |')
    A(f'| なし | 対応する乖離指摘が見つからない | {len(none)} | {bsum(none):.1f} |')
    A(f'| **計** | | **{len(results)}** | **{total_bl:.1f}** |')

    A('\n## 重複を除いた増分\n')
    A('「重複」をどこまで認めるかで、Backlog側の実質的な増分が変わる。')
    A('')
    A('| 重複の範囲 | 重複件数 | C の実質増分（件） | 同（人日） |')
    A('|---|---:|---:|---:|')
    for label, dup in [('確度Aのみ重複とみなす', dup_a),
                       ('確度A＋Bを重複とみなす', dup_a + dup_b),
                       ('確度A＋B＋Cを重複とみなす', dup_a + dup_b + dup_c)]:
        rest = [r for r in results if r not in dup]
        A(f'| {label} | {len(dup)} | {len(rest)} | {sum(num(r["Backlog工数"]) for r in rest):.1f} |')

    A('\n## 総工数への反映\n')
    A('素の見積（見積不可を1人日で計上済み）は A 実装 693.2 / B 設計書 100.4 / C Backlog 176.2 = 969.8人日。')
    A('C のうち重複ぶんを引くと次のようになる。')
    A('')
    A('| 重複の範囲 | A+B | C増分 | 素の合計 | 保守シナリオ(×1.5×1.6) |')
    A('|---|---:|---:|---:|---:|')
    ab = 693.2 + 100.4
    for label, dup in [('重複なしとして全部足す', []),
                       ('確度Aのみ重複', dup_a),
                       ('確度A＋B', dup_a + dup_b),
                       ('確度A＋B＋C', dup_a + dup_b + dup_c)]:
        rest = [r for r in results if r not in dup]
        c_inc = sum(num(r['Backlog工数']) for r in rest) + \
            sum(1 for r in rest if bl.get(r['課題キー'], {}).get('仕様確定要') == 'YES')
        # 見積不可1人日はすでに Backlog工数=0 なので別途加算
        raw = ab + c_inc
        A(f'| {label} | {ab:.1f} | {c_inc:.1f} | {raw:.1f} | {raw*1.5*1.6:.0f} |')

    A('\n## 対応が見つからなかったチケット（新規の指摘）\n')
    A(f'{len(none)}件。乖離リストに対応する行が無く、**Backlog固有の指摘**である可能性が高い。')
    A('')
    A('| 課題キー | 区分 | 人日 | 件名 |')
    A('|---|---|---:|---|')
    for r in sorted(none, key=lambda x: -num(x['Backlog工数']))[:20]:
        A(f'| {r["課題キー"]} | {r["Backlog区分"]} | {num(r["Backlog工数"]):.2f} | {r["件名"][:70]} |')
    if len(none) > 20:
        A(f'| … | | | 他 {len(none)-20}件 |')

    A('\n## 種別別の突合状況\n')
    A('| 種別 | 件数 | 確度A | 確度B | 確度C | なし |')
    A('|---|---:|---:|---:|---:|---:|')
    for t, n in Counter(r['種別'] for r in results).most_common():
        g = [r for r in results if r['種別'] == t]
        A(f'| {t} | {n} | '
          f'{sum(1 for r in g if r["突合確度"].startswith("確度A"))} | '
          f'{sum(1 for r in g if r["突合確度"].startswith("確度B"))} | '
          f'{sum(1 for r in g if r["突合確度"].startswith("確度C"))} | '
          f'{sum(1 for r in g if r["突合確度"] == "なし")} |')

    A('\n## この突合の限界\n')
    A('- **機械突合であり、人もcodexも検証していない。** 特に確度Bと確度Cは誤対応を含む。')
    A(f'- 機能Noが本文に現れるチケットは {sum(1 for r in results if r["突合確度"].startswith("確度A") or r["突合確度"] == "確度B(機能Noのみ一致)")}件'
      'にとどまり、残りは書籍コードと文字列類似度に頼っている。')
    A('- 乖離リスト側の1行とチケット1枚が1対1とは限らない。'
      '1枚に複数の不具合をまとめたチケットがあり、この突合では最も似た1行しか対応づけていない。')
    A('- 確度Cを重複とみなすかで合計が大きく変わる。**確定させたいなら、'
      '確度B・Cのチケットをcodexに1件ずつ検証させるのが次の手。**')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}\n      {OUT}\n')
    for k, v in tc.most_common():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
