#!/usr/bin/env python3
"""drift_findings_list_final.tsv の機械的事実確認。

人手・LLMの判断を挟まずに検証できるものだけを判定する:

1. 正本根拠/設計書参照の引用文字列が、参照先HTMLの **Excel正本領域** に実在するか
   (function-design-embed:start〜end の内側はリバース詳細設計＝正本ではない)
2. 設計書参照の #sheet-N と行番号がそのシートの範囲に収まっているか
3. 実装参照・現実装の `path:line` が現HEADの新実装に実在するか
4. 再確認HEAD 以降に、参照先実装ファイルが変更されていないか(陳腐化検知)
"""
import csv, json, os, re, subprocess, sys
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ROOT = os.path.dirname(REPORT)
DOCS = os.path.join(ROOT, 'excel_to_html', 'output')
EE = '/home/y-saito/Developments/ec-cube-enterprise'
SRC = os.path.join(REPORT, 'drift_findings_list_final.tsv')
OUT = os.path.join(BASE, 'mech_check.json')

TAG = re.compile(r'<[^>]+>')
IMGDATA = re.compile(r'data:image/[a-z]+;base64,[A-Za-z0-9+/=]+')


def norm(s):
    """比較用正規化: タグ除去済みテキストから空白・記号ゆれを落とす。"""
    s = s.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    s = s.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
    return re.sub(r'[\s　]+', '', s)


class Doc:
    """設計書HTMLを Excel正本領域 / embed領域 に切り分けて保持する。"""

    def __init__(self, path):
        self.path = path
        lines = open(path, encoding='utf-8', errors='replace').read().split('\n')
        self.total = len(lines)
        depth = 0
        excel, embed = [], []
        self.embed_flag = []          # 行ごと: True=embed領域
        self.excel_ref_lines = set()  # data-excel-ref を持つ行
        for i, ln in enumerate(lines, 1):
            if 'function-design-embed:start' in ln and '<!--' in ln:
                depth += 1
            in_embed = depth > 0
            self.embed_flag.append(in_embed)
            if 'function-design-embed:end' in ln and '<!--' in ln:
                depth = max(0, depth - 1)
            txt = TAG.sub('', IMGDATA.sub('', ln))
            (embed if in_embed else excel).append(txt)
            if 'data-excel-ref' in ln and not in_embed:
                self.excel_ref_lines.add(i)
        self.excel_text = norm(''.join(excel))
        self.embed_text = norm(''.join(embed))
        self.line_text = [norm(TAG.sub('', IMGDATA.sub('', ln))) for ln in lines]
        # data-excel-ref を持つ要素だけを連結したテキスト(より厳格な正本判定)
        raw = '\n'.join(lines)
        self.has_image = 'image-layer-img' in raw or 'image-stack-img' in raw
        # sheet 範囲
        self.sheets = {}
        starts = []
        for i, ln in enumerate(lines, 1):
            for m in re.finditer(r'<section[^>]*id="(sheet-\d+)"', ln):
                starts.append((m.group(1), i))
        for j, (sid, s) in enumerate(starts):
            e = starts[j + 1][1] - 1 if j + 1 < len(starts) else self.total
            self.sheets[sid] = (s, e)

    def locate(self, q):
        """正規化引用 q の所在を返す。"""
        if len(q) < 6:
            return 'TOO_SHORT'
        if q in self.excel_text:
            return 'EXCEL'
        if q in self.embed_text:
            return 'EMBED_ONLY'
        return 'NOT_FOUND'


DOCCACHE = {}


def doc(fname):
    if fname not in DOCCACHE:
        p = os.path.join(DOCS, fname)
        DOCCACHE[fname] = Doc(p) if os.path.exists(p) else None
    return DOCCACHE[fname]


# 引用抽出: 「」『』"" `` で囲まれた部分
QUOTE = re.compile(r'「([^」]{4,120})」|『([^』]{4,120})』|`([^`]{4,120})`|"([^"]{4,120})"')
REF = re.compile(r'(\d{4}[^/\s,、]*?\.html)(?:#(sheet-\d+))?(?::([\d,\-\s]+))?')
IMPLREF = re.compile(r'((?:/[\w\-.()]+)*(?:src|app|tests?|bin)/[\w\-./()]+\.(?:php|twig|yaml|yml|js|sql|json))(?::(\d+))?')


def sheet_of(fname, sid, nums):
    d = doc(fname)
    if d is None:
        return 'FILE_MISSING', None
    if sid and sid not in d.sheets:
        return 'SHEET_MISSING', None
    if not sid or not nums:
        return 'NO_LINES', None
    lo, hi = d.sheets[sid]
    out = [n for n in nums if not (lo <= n <= hi)]
    if not out:
        return 'OK', None
    return ('ALL_OUT' if len(out) == len(nums) else 'PARTIAL_OUT'), out


def parse_nums(s):
    nums = []
    for part in re.split(r'[,\s]+', (s or '').strip()):
        if not part:
            continue
        if '-' in part:
            a, _, b = part.partition('-')
            if a.isdigit() and b.isdigit():
                nums += [int(a), int(b)]
        elif part.isdigit():
            nums.append(int(part))
    return nums


def git_changed_since(rev):
    try:
        o = subprocess.run(['git', '-C', EE, 'diff', '--name-only', f'{rev}..HEAD'],
                           capture_output=True, text=True, timeout=120)
        if o.returncode != 0:
            return None
        return set(o.stdout.split())
    except Exception:
        return None


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    changed = {}
    results = []
    for i, r in enumerate(rows, 1):
        rec = {'rowId': i, '機能No': r['機能No'], 'ドメイン': r['ドメイン'],
               '指摘区分': r['指摘区分'], '重要度': r['重要度'],
               '根拠区分': r['根拠区分'], 'レビュー結果': r['レビュー結果']}

        # --- 1. 設計書参照の整合 ---
        refstat, files = [], []
        for m in REF.finditer(r['設計書参照']):
            fname, sid, lines = m.group(1), m.group(2), m.group(3)
            fname = os.path.basename(fname)
            files.append(fname)
            st, out = sheet_of(fname, sid, parse_nums(lines))
            refstat.append({'file': fname, 'sheet': sid, 'status': st, 'outOfRange': out})
        rec['refCheck'] = refstat
        sts = [x['status'] for x in refstat]
        rec['refVerdict'] = ('NO_REF' if not sts else
                             'FILE_MISSING' if 'FILE_MISSING' in sts else
                             'SHEET_MISSING' if 'SHEET_MISSING' in sts else
                             'OUT_OF_RANGE' if any(s in ('ALL_OUT', 'PARTIAL_OUT') for s in sts) else
                             'NO_LINES' if all(s == 'NO_LINES' for s in sts) else 'OK')

        # --- 2. 正本根拠の引用実在(Excel正本領域か) ---
        # 参照先候補ファイル: 設計書参照 + 正本根拠中に現れる .html
        cand = list(dict.fromkeys(files + [os.path.basename(m.group(1))
                                           for m in REF.finditer(r['正本根拠'])]))
        quotes = []
        for m in QUOTE.finditer(r['正本根拠']):
            q = next(g for g in m.groups() if g is not None)
            if q.endswith('.html') or q.endswith('.php') or '/' in q:
                continue          # パス断片は引用ではない
            quotes.append(q)
        qres = []
        for q in quotes[:12]:
            nq = norm(q)
            best = 'NOT_FOUND'
            where = None
            for fn in cand:
                d = doc(fn)
                if d is None:
                    continue
                v = d.locate(nq)
                if v == 'EXCEL':
                    best, where = 'EXCEL', fn
                    break
                if v == 'EMBED_ONLY' and best == 'NOT_FOUND':
                    best, where = 'EMBED_ONLY', fn
                if v == 'TOO_SHORT':
                    best = 'TOO_SHORT'
            qres.append({'quote': q[:80], 'found': best, 'file': where})
        # 正本根拠が自ら示す file:line が、その引用を実際に含むか
        cites = []
        for m in REF.finditer(r['正本根拠']):
            fn, nums = os.path.basename(m.group(1)), parse_nums(m.group(3))
            if doc(fn) and nums:
                cites.append((fn, min(nums), max(nums)))
        lc = 'NO_CITE'
        if cites and qres:
            hit = False
            for fn, lo, hi in cites:
                d = doc(fn)
                seg = norm(''.join(d.line_text[max(0, lo - 3):min(d.total, hi + 3)]))
                if any(norm(x['quote']) in seg for x in qres if x['found'] == 'EXCEL'):
                    hit = True
                    break
            lc = 'LINE_OK' if hit else 'LINE_MISMATCH'
        rec['lineCite'] = lc
        rec['quotes'] = qres
        found = Counter(x['found'] for x in qres)
        rec['quoteVerdict'] = ('NO_QUOTE' if not qres else
                               'EXCEL' if found['EXCEL'] else
                               'EMBED_ONLY' if found['EMBED_ONLY'] else
                               'NOT_FOUND' if found['NOT_FOUND'] else 'TOO_SHORT')
        rec['docHasImage'] = any(doc(f).has_image for f in cand if doc(f))

        # --- 3. 実装参照の実在 ---
        impl = []
        seen = set()
        for field in ('実装参照', '現実装', '対応の根拠(現develop)'):
            for m in IMPLREF.finditer(r.get(field, '')):
                p, ln = m.group(1), m.group(2)
                rel = p.split('ec-cube-enterprise/')[-1].lstrip('/')
                key = (rel, ln)
                if key in seen:
                    continue
                seen.add(key)
                full = os.path.join(EE, rel)
                if not os.path.exists(full):
                    impl.append({'path': rel, 'line': ln, 'status': 'FILE_MISSING'})
                    continue
                st = 'OK'
                if ln:
                    try:
                        total = sum(1 for _ in open(full, encoding='utf-8', errors='replace'))
                        if int(ln) > total:
                            st = f'LINE_OUT(総{total}行)'
                    except Exception:
                        st = 'UNREADABLE'
                impl.append({'path': rel, 'line': ln, 'status': st})
        rec['implRefs'] = impl[:20]
        rec['implVerdict'] = ('NO_REF' if not impl else
                              'FILE_MISSING' if any(x['status'] == 'FILE_MISSING' for x in impl) else
                              'LINE_OUT' if any(x['status'].startswith('LINE_OUT') for x in impl) else 'OK')

        # --- 4. 再確認HEAD以降の変更(陳腐化) ---
        rev = (r.get('再確認HEAD') or '').strip()
        if rev and rev not in changed:
            changed[rev] = git_changed_since(rev)
        ch = changed.get(rev)
        if ch is None:
            rec['staleVerdict'] = 'UNKNOWN'
            rec['staleFiles'] = []
        else:
            sf = sorted({x['path'] for x in impl if x['path'] in ch})
            rec['staleFiles'] = sf
            rec['staleVerdict'] = 'CHANGED' if sf else 'UNCHANGED'

        results.append(rec)

    json.dump(results, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print(f'検査 {len(results)} 件  (新実装HEAD={subprocess.run(["git","-C",EE,"rev-parse","--short","HEAD"],capture_output=True,text=True).stdout.strip()})')
    for key in ('refVerdict', 'quoteVerdict', 'lineCite', 'implVerdict', 'staleVerdict'):
        print(f'\n=== {key} ===')
        for k, v in Counter(x[key] for x in results).most_common():
            print(f'  {k:16s} {v:5d}')

    print('\n=== 根拠区分 × quoteVerdict ===')
    m = defaultdict(Counter)
    for x in results:
        m[x['根拠区分']][x['quoteVerdict']] += 1
    for k in sorted(m):
        print(f'  {k:14s} ' + '  '.join(f'{a}={b}' for a, b in m[k].most_common()))


if __name__ == '__main__':
    main()
