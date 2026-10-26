#!/usr/bin/env python3
"""作ったCSVが、シード表の文の行数・改行数・バイト数・文字コード・改行・BOM・区切りの指定を満たすかを、数えて確かめる。DB・アプリには触らない。"""
import csv, os, re, glob, sys
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seeds = {}
for p in glob.glob(os.path.join(R, '..', 'integration_test', 'casegen', 'cases', '*_seed_data.tsv')):
    for r in list(csv.reader(open(p, encoding='utf-8'), delimiter='\t'))[1:]: seeds[r[0]] = r
MB5 = 5 * 1024 * 1024
checked = bad = 0; detail = []
for idxf in sorted(glob.glob(os.path.join(R, 'seed_files', '*', '_csv_index.tsv'))):
    fid = os.path.basename(os.path.dirname(idxf))
    for l in list(open(idxf, encoding='utf-8'))[1:]:
        c = l.rstrip('\n').split('\t')
        if len(c) < 4 or c[3] not in ('rule', 'text'): continue
        sid, fn, orig = c[0], c[1], c[2]
        data = open(os.path.join(os.path.dirname(idxf), fn), 'rb').read()
        clause = ' '.join(x for x in re.split(r'[／。]', seeds[sid][3]) if orig in x)
        if not clause: continue
        problems = []
        n_nl = data.count(b'\n') + (data.count(b'\r') if b'\n' not in data else 0)
        m = re.search(r'改行数(\d+)|引用符外の改行(\d+)個', clause)
        if m and data.count(b'\n') != int(m.group(1) or m.group(2)): problems.append(f'改行数 {data.count(chr(10).encode())} ≠ {m.group(1) or m.group(2)}')
        for pat in (r'データ行(\d+)(?:行|件)', r'(\d+)データ行', r'(\d+)データレコード', r'(\d+)正常行'):
            m = re.search(pat, clause)
            if m:
                import io
                try: rows = len(list(csv.reader(io.StringIO(data.decode('utf-8-sig').replace('\r\n', '\n'))))) - 1
                except Exception: rows = len([x for x in data.split(b'\n') if x]) - 1
                if rows != int(m.group(1)): problems.append(f'データ行 {rows} ≠ {m.group(1)}')
                break
        size = None
        if re.search(r'5MB\+1バイト|5 ?MBより1バイト大きい', clause): size = MB5 + 1
        elif re.search(r'上限（5 ?MB）とバイト数が同じ|5MBとバイト数が同じ|正確に5MB(?!\+)', clause): size = MB5
        else:
            m = re.search(r'(?<![0-9])([1-9]\d{5,})バイト', clause)
            if m: size = int(m.group(1))
        if size and len(data) != size: problems.append(f'バイト数 {len(data)} ≠ {size}')
        if 'Shift_JIS' in clause:
            try: data.decode('utf-8'); problems.append('Shift_JISの指定だがUTF-8として読める')
            except UnicodeDecodeError: pass
        if 'CRLF' in clause and (b'\r\n' not in data or re.search(rb'(?<!\r)\n', data)): problems.append('CRLFの指定だが改行が揃っていない')
        if re.search(r'バイト順序記号|BOM', clause) and not data.startswith(b'\xef\xbb\xbf') and 'ゼロ幅' not in clause: problems.append('BOMの指定だが先頭にBOMが無い')
        if 'タブ区切り' in clause and b'\t' not in data and len(data) > 0: problems.append('タブ区切りの指定だがタブが無い')
        checked += 1
        if problems: bad += 1; detail.append((sid, orig, problems))
print(f'確かめたファイル {checked}／指定を満たさないもの {bad}')
for d in detail[:30]: print(d)
open(os.path.join(R, 'review', 'csv_verify_result.txt'), 'w', encoding='utf-8').write(f'確かめたファイル {checked}／指定を満たさないもの {bad}\n' + '\n'.join(str(d) for d in detail) + '\n')
