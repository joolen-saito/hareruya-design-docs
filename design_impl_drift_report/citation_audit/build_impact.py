#!/usr/bin/env python3
"""影響区分(ふるまい・動作・I/Oへの影響)のcodexレビュー用パケットを作る。

2種類つくる:
  ip_*  : 著者(claude)が NO_IMPACT / UNSURE と判定した行の**反証**用（少数・深く）
  sw_*  : 全1034行の**掃き出し**用（著者がIMPACTとした行に見落としが無いかを独立に判定）
"""
import csv, json, os, re, glob

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_final.tsv')
MINE = os.path.join(BASE, 'impact', 'my_verdicts.json')
OUT = os.path.join(BASE, 'impact_packets')

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照', '現実装']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
mine = json.load(open(MINE, encoding='utf-8'))
mymap = {}
for v in mine['NO_IMPACT']:
    mymap[v['rowId']] = ('NO_IMPACT', v['reason'])
for v in mine['UNSURE']:
    mymap[v['rowId']] = ('UNSURE', v['reason'])

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)


def flat(s, n):
    return re.sub(r'[\s　]+', ' ', s or '')[:n]


# --- ip_*: 著者判定の反証 ---
targets = sorted(mymap)
CH = 7
for n in range(0, len(targets), CH):
    part = targets[n:n + CH]
    pid = f"ip_{n // CH + 1:02d}"
    json.dump({'packetId': pid,
               'mode': 'refute',
               'note': '著者(claude)が「ふるまい・動作・I/Oに影響しない(NO_IMPACT)」または'
                       '「判断つかず(UNSURE)」と判定した行。各判定を疑い、外部から観測できる'
                       '影響を1つでも見つけて反証すること。',
               'findings': [dict({'rowId': i, 'authorVerdict': mymap[i][0],
                                  'authorReason': mymap[i][1]},
                                 **{k: rows[i - 1][k] for k in FIELDS})
                            for i in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

# --- sw_*: 全件の掃き出し ---
CH2 = 36
allrows = list(range(1, len(rows) + 1))
for n in range(0, len(allrows), CH2):
    part = allrows[n:n + CH2]
    pid = f"sw_{n // CH2 + 1:02d}"
    json.dump({'packetId': pid,
               'mode': 'sweep',
               'note': '著者はこれらの大半を IMPACT(外部から観測できる) と判定した。'
                       '見落とし＝実は NO_IMPACT な行が無いかを独立に判定すること。',
               'findings': [{'rowId': i,
                             '機能No': rows[i - 1]['機能No'],
                             '指摘区分': rows[i - 1]['指摘区分'],
                             'authorVerdict': mymap.get(i, ('IMPACT', ''))[0],
                             '設計期待値': flat(rows[i - 1]['設計期待値'], 260),
                             '差分内容': flat(rows[i - 1]['差分内容'], 320),
                             '実装参照': flat(rows[i - 1]['実装参照'], 160)}
                            for i in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

ip = len(glob.glob(os.path.join(OUT, 'ip_*.json')))
sw = len(glob.glob(os.path.join(OUT, 'sw_*.json')))
print(f"反証パケット ip_*: {ip}個 ({len(targets)}件)")
print(f"掃き出しパケット sw_*: {sw}個 ({len(allrows)}件)")
sizes = [os.path.getsize(p) for p in glob.glob(os.path.join(OUT, 'sw_*.json'))]
print(f"sw平均 {sum(sizes)//len(sizes)//1024}KB 最大 {max(sizes)//1024}KB")
