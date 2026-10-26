#!/usr/bin/env python3
"""手順書(シード表の状態・属性/投入方法)の「DBへ直接設定する」文から、SQLファイルを作る。DB・アプリには触らない(SQLは流さない)。
出力:
  seed_files/<機能ID>/<シードID>/db.sql          (パスワード・ハッシュを含むものは .runs/seed_files_private/<機能ID>/<シードID>/db.sql)
  review/db_sql_result.tsv                        (文ごとの結果: 作った/作れない+理由)
  review/db_sql_summary.tsv                       (集計)
物理名(表・列)はSQLの中だけ。説明は論理名。表・列の照合は tools/db_sql_check.py。"""
import csv, os, re, sys, collections, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_sql_lib import *
from db_sql_lib import split_sentences_pos, strip_comments_strings
import db_sql_handlers as H
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES = os.path.join(R, '..', 'integration_test', 'casegen', 'cases')
PAT = re.compile(r'DB[^。／]{0,6}(?:シード|直接|投入|設定|で投入|へ投入|に投入)|直接設定|DBシード|DBを直接|DBで直接|DBへ直接|DB直接')
PASSWORD = re.compile(r'パスワード|password|ハッシュ')

fids = sorted(d for d in os.listdir(os.path.join(R, 'seed_files')) if os.path.isdir(os.path.join(R, 'seed_files', d)) and os.path.exists(os.path.join(CASES, f'{d}_seed_data.tsv')))
results = []   # (fid, sid, 文, 結果, 理由/備考, 表, 区分)
per_seed = collections.OrderedDict()
seen = set()
GAP_FALLBACK = ('現行のDBに', '番号の型')
for fid in fids:
    for r in list(csv.reader(open(os.path.join(CASES, f'{fid}_seed_data.tsv'), encoding='utf-8'), delimiter='\t'))[1:]:
        sid = r[0]
        if (fid, sid) in seen:
            continue
        seen.add((fid, sid))
        ctx = H.Ctx(fid, sid, r[2], r[3], r[5])
        items = []
        for place, text in (('状態・属性', r[3]), ('投入方法', r[5])):
            sents = split_sentences_pos(text)
            for k, (sent, pos) in enumerate(sents):
                if not PAT.search(sent):
                    continue
                prev = sents[k - 1][0].strip() if k > 0 else ''
                nxt = sents[k + 1][0].strip() if k + 1 < len(sents) else ''
                ctx.begin(place, sent, prev, text, pos)
                try:
                    out = H.run(ctx)
                    if not reason_readable(sent):
                        out.notes.append('画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）')
                    st = 'ok'
                    items.append((place, sent, prev, st, out, k, nxt))
                    status = '一部だけ作った' if out.unmade else '作った'
                    why = '；'.join(out.notes + ['作れない部分: ' + u for u in out.unmade])
                    results.append([fid, sid, sent.strip()[:200], status, why[:600], ','.join(sorted(set(out.tables))), out.gap])
                except Unsupported as e:
                    items.append((place, sent, prev, 'ng', e, k, nxt))
                    results.append([fid, sid, sent.strip()[:200], '作れない', str(e), '', getattr(e, 'gap', '')])
                ctx.db_pos.setdefault(place, []).append(pos + len(sent))
        if items:
            per_seed[(fid, sid)] = (ctx, items)

# ---- シードをまたぐ参照: 番号で引く行(画面では番号を指定できない)を、どのシードのSQLが作るか ----
_ins_index = collections.defaultdict(list)   # (表, 番号) → [(機能ID, シードID)]
for (fid, sid), (ctx, items) in per_seed.items():
    for it in items:
        if it[3] != 'ok':
            continue
        for x in it[4].sql:
            for t, i in re.findall(r'INSERT INTO (\w+) \(id,[^)]*\) VALUES \((\d+),', x):
                if (fid, sid) not in _ins_index[(t, i)]:
                    _ins_index[(t, i)].append((fid, sid))
TABLE_JP = {'dtb_delivery_duration': '発送日目安', 'dtb_member': '管理者'}


def creators_text(fid, sid, t, i):
    cs = [c for c in _ins_index.get((t, i), []) if c != (fid, sid)]
    nm = '%s（番号%s）' % (TABLE_JP.get(t, t), i)
    if not cs:
        return '%sを作るシードは無い（どのシードのSQLも作らず、画面では番号を指定できない）。正しく登録してもこのSQLは確認で止まる' % nm
    same = [c for c in cs if c[0] == fid]
    if same:
        return '%sは、同じ機能のシード %s のSQLが作る。そのシードを先に登録して流す' % (nm, '・'.join(c[1] for c in same))
    return '%sは、この機能（%s）のシードは作らない。別の機能のシード %s のSQLが作る。そのシードを先に登録して流さないと、このSQLは確認で止まる' % (nm, fid, '・'.join('%s（%s）' % (c[1], c[0]) for c in cs))


def _resolve(fid, sid, txt):
    return re.sub(r'\{\{作るシード:(\w+):(\d+)\}\}', lambda m: creators_text(fid, sid, m.group(1), m.group(2)), txt)


for (fid, sid), (ctx, items) in per_seed.items():
    for it in items:
        if it[3] == 'ok':
            it[4].notes = [_resolve(fid, sid, n) for n in it[4].notes]
            it[4].unmade = [_resolve(fid, sid, n) for n in it[4].unmade]

# ---- 店舗名で引く店舗のうち、複数の機能のシードが同じ名前で登録するもの(1つの環境に全部入れると「2件以上」で止まる) ----
_all_seed_rows = []
for _f in sorted(os.listdir(CASES)):
    if _f.endswith('_seed_data.tsv'):
        for _r in list(csv.reader(open(os.path.join(CASES, _f), encoding='utf-8'), delimiter='\t'))[1:]:
            _all_seed_rows.append((_f[:-len('_seed_data.tsv')], _r))
_shop_reg_cache = {}


def shop_registrants(nm):
    """店舗名 nm の店舗を登録するシード(区分に「店舗」を含み、状態・属性が店舗名をその名前で書くもの)"""
    if nm not in _shop_reg_cache:
        e = re.escape(nm)
        end = r'(?![A-Za-z0-9（(])'
        pats = [r'(?:店舗名|店名|店舗名称)[=＝「]' + e + end, r'〔店舗ID-[^〕]+〕[=＝]' + e + end, r'(?:^|／)' + e + r'[=＝]', r'店舗[=＝]' + e + end]
        _shop_reg_cache[nm] = [(f, r[0]) for f, r in _all_seed_rows if '店舗' in r[1] and any(re.search(p_, r[3]) for p_ in pats)]
    return _shop_reg_cache[nm]


# ---- 前回の db.sql / db_before.sql のうち、今回対象でないものを消す ----
import glob as _g
_keep = {(f, sd) for (f, sd) in per_seed}
for _pat in ('db*.sql',):
    for _p in _g.glob(os.path.join(R, 'seed_files', '*', 'S-*', _pat)) + _g.glob(os.path.join(R, '.runs', 'seed_files_private', '*', 'S-*', _pat)):
        _d = os.path.dirname(_p)
        if (os.path.basename(os.path.dirname(_d)), os.path.basename(_d)) not in _keep:
            os.remove(_p)

CRED = re.compile(r'\$2[aby]\$|パスワード|ハッシュ|password\s*=')
HEAD_BEFORE = '-- 流す時点: 画面で登録する前に流す（やり直しのときの後始末。前回の残りだけを消す。登録のあとに流すと、作った行まで消えるので流さない）。'
LABEL_NOTE = '-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。'


def code_lines(sql_lines):
    """コメントを除いたSQLの行"""
    return [x for x in sql_lines if not x.lstrip().startswith('--')]


def timing(place, sent, prev, nxt, o):
    if o is not None and getattr(o, 'when', '') == 'before':
        return '画面で登録する前（やり直しのときの後始末）'
    if place == '投入方法':
        a = ('投入方法の「' + prev.strip()[:50] + ('…' if len(prev.strip()) > 50 else '') + '」を終えたあと') if prev else '投入方法の最初（画面の操作より前）'
        if nxt:
            a += '、次の「' + nxt.strip()[:40] + ('…' if len(nxt.strip()) > 40 else '') + '」より前'
        return a
    return '投入方法の画面の操作をひととおり終えたあと（状態・属性に書かれた文のため、投入方法の中に時点が無い）'


n_files = 0
md_info = {}
PRIV_MD = {}
for (fid, sid), (ctx, items) in per_seed.items():
    for _pp in _g.glob(os.path.join(R, 'seed_files', fid, sid, 'db*.sql')) + _g.glob(os.path.join(R, '.runs', 'seed_files_private', fid, sid, 'db*.sql')):
        os.remove(_pp)
    steps = []
    files = {}
    # 「画面で登録する前」と、それ以外(投入方法で連続するDB文は同じ時点でまとめて流す。間に別の操作の文が挟まるものは時点が違うので別ファイル。状態・属性の文はまとめて最後)
    group_of = {}
    cur = 0
    last = None
    state_group = None
    for i, (place, sent, prev, st, o, kk, nxt) in enumerate(items, 1):
        if st != 'ok' or o.when == 'before':
            continue
        if place == '状態・属性':
            if state_group is None:
                cur += 1
                state_group = cur
            group_of[i] = state_group
            continue
        if last is None or kk != last + 1:
            cur += 1
        group_of[i] = cur
        last = kk
    ngroups = cur
    first_of = {}
    for i, g in sorted(group_of.items()):
        first_of.setdefault(g, i)
    fname_of = {}
    for i, (place, sent, prev, st, o, kk, nxt) in enumerate(items, 1):
        if st == 'ok' and o.when == 'before':
            fname = 'db_before.sql'
        elif st == 'ok':
            fname = 'db.sql' if ngroups == 1 else 'db_%d.sql' % first_of[group_of[i]]
        else:
            fname = None
        fname_of[i] = fname
        files.setdefault(fname, []).append((i, place, sent, prev, st, o, nxt))
    where = {}
    fwhen = {}
    for fname in sorted(f for f in files if f):
        lst = files[fname]
        oks = [x for x in lst if x[4] == 'ok']
        if not oks:
            continue
        kind = 'before' if fname == 'db_before.sql' else 'after'
        not_own = [getattr(x[5], 'not_own', '') for x in oks]
        priv = any(CRED.search(' '.join(code_lines(x[5].sql))) for x in oks)
        base = os.path.join(R, '.runs', 'seed_files_private', fid, sid) if priv else os.path.join(R, 'seed_files', fid, sid)
        os.makedirs(base, exist_ok=True)
        body_has_label = any(LABEL.search(strip_comments_strings(x)) for (_i, _p, _s, _pv, _st, _o, _n) in lst if _st == 'ok' for x in code_lines(_o.sql))
        f0 = lst[0]
        fl = lst[-1]
        when = HEAD_BEFORE[len('-- 流す時点: '):].rstrip('。') if kind == 'before' else timing(f0[1], f0[2], f0[3], fl[6], f0[5])
        if kind == 'before' and all(not_own):
            when = '画面で登録する前に流す（消すのは %s だけ。状態・属性が「存在しない」と書く行で、このシードは画面で作らない。そのため登録のあとに流しても、このシードが作った行は消えない）' % '・'.join(dict.fromkeys(not_own))
        fwhen[fname] = when
        lines = ['-- %s（%s）' % (sid, ctx.name), '-- 流す時点: ' + when + '。手順書（%s.md）の「DBへ直接設定する部分（SQL）」と同じ。' % sid]
        if body_has_label:
            lines.append(LABEL_NOTE)
        if os.path.exists(os.path.join(R, '.runs', 'seed_files_private', fid, sid + '.md')) and not os.path.exists(os.path.join(R, 'seed_files', fid, sid + '.md')):
            lines.append('-- 手順書: e2e/.runs/seed_files_private/%s/%s.md（シード表の文にパスワードを含むため非公開側に置いてある。git に入れない）' % (fid, sid))
            PRIV_MD[sid] = fid
        lines += ['BEGIN;', '']
        for (i, place, sent, prev, st, o, nxt) in lst:
            lines.append('-- [%d] 文（%s）: %s' % (i, place, sent.strip()[:150]))
            for n in o.notes:
                lines.append('--     備考: %s' % n)
            for u in o.unmade:
                lines.append('--     作れない部分（SQLに入れていない）: %s' % u)
            lines += o.sql
            lines.append('')
        lines += ['COMMIT;', '']
        open(os.path.join(base, fname), 'w', encoding='utf-8').write('\n'.join(lines))
        where[fname] = 'private' if priv else 'public'
        n_files += 1
    labs = []
    for i, (place, sent, prev, st, o, kk, nxt) in enumerate(items, 1):
        if st == 'ok':
            for x in code_lines(o.sql):
                for l in LABEL.findall(strip_comments_strings(x)):
                    if l not in labs:
                        labs.append(l)
        after = timing(place, sent, prev, nxt, o if st == 'ok' else None)
        steps.append({'n': i, 'place': place, 'sent': sent.strip()[:200], 'after': after, 'status': st, 'file': fname_of[i] or '',
                      'reason': (str(o) if st == 'ng' else ''), 'gap': (getattr(o, 'gap', '') or ''), 'notes': (o.notes if st == 'ok' else []),
                      'unmade': (o.unmade if st == 'ok' else []), 'handler': (getattr(o, 'handler', '') if st == 'ok' else ''),
                      'enter': (list(getattr(o, 'enter', []) or []) if st == 'ok' else [])})
    shop_names = sorted({n for x in items if x[3] == 'ok' for l in code_lines(x[4].sql) for n in re.findall(r"shop_name = '([^']+)'", l)})
    dups = {n: shop_registrants(n) for n in shop_names}
    dups = {n: v for n, v in dups.items() if len({f for f, _ in v}) > 1}
    md_info[sid] = {'fid': fid, 'where': where, 'when': fwhen, 'labels': labs, 'steps': steps, 'private_md': sid in PRIV_MD, 'shop_dups': dups}
json.dump(md_info, open(os.path.join(R, 'review', 'db_sql_md.json'), 'w', encoding='utf-8'), ensure_ascii=False)

with open(os.path.join(R, 'review', 'db_sql_result.tsv'), 'w', encoding='utf-8') as f:
    f.write('\t'.join(['機能ID', 'シードID', '文(抜粋)', '結果', '理由・備考', '使った表', '区分（設計と実装の差の候補）']) + '\n')
    for x in results:
        f.write('\t'.join(c.replace('\t', ' ').replace('\n', ' ') for c in x) + '\n')
c = collections.Counter(x[3] for x in results)
print('文:', dict(c), ' db*.sql:', n_files)


# ---- 集計(review/db_sql_summary.tsv) ----
def _cat(reason):
    for k, v in (('全件削除', '全件削除（範囲を絞れない。手順書にダンプ直後の件数を書いた）'), ('範囲を絞れない', '全件削除（範囲を絞れない。手順書にダンプ直後の件数を書いた）'),
                 ('退避した行', '退避・復元（保管先と手順が文に無い）'),
                 ('所属と店舗の関係', '現行のDBに設定先の表・列が無い'), ('削除済みを表す列', '現行のDBに設定先の表・列が無い'), ('番号の型', '番号が現行のDBの型の上限を超える'),
                 ('API呼出履歴', '範囲を絞れない（結び付く列が無い）'),
                 ('販売数・入庫数', '行の意味づけ（販売場所・在庫区分との対応）が文に無い'), ('登録する行', '登録する行・値が文に無い'), ('登録する行の中身', '登録する行・値が文に無い'),
                 ('管理者の行', '登録する行・値が文に無い'), ('商品の行の中身', '登録する行・値が文に無い'),
                 ('在庫の承認', '複数の表にまたがり、行を決められない'), ('各参照商品', '対象の範囲が文に無い'), ('連番の最終値', '設定先が特定できない'),
                 ('商品画像', 'ファイルの置き場が文に無い'), ('文の形が個別', '文の形が個別で、機械的に決められない')):
        if k in reason:
            return v
    return 'その他（個別の読み取り失敗）'


cnt = collections.Counter(_cat(x[4]) for x in results if x[3] == '作れない')
gapc = collections.Counter(g for x in results if x[6] for g in x[6].split('／'))
info_ = md_info
full = sum(1 for v in info_.values() if all(s['status'] == 'ok' and not s['unmade'] for s in v['steps']))
none_ = sum(1 for v in info_.values() if all(s['status'] == 'ng' for s in v['steps']))
part = len(info_) - full - none_
before = sum(1 for v in info_.values() for s in v['steps'] if s['status'] == 'ok' and s['file'] == 'db_before.sql')
with open(os.path.join(R, 'review', 'db_sql_summary.tsv'), 'w', encoding='utf-8') as f:
    f.write('区分\t項目\t件数\n')
    f.write('文\t作った\t%d\n' % c.get('作った', 0))
    f.write('文\t一部だけ作った（作れない部分は手順書に理由）\t%d\n' % c.get('一部だけ作った', 0))
    f.write('文\t作れない\t%d\n' % c.get('作れない', 0))
    f.write('シード\t全部の文のSQLを作れた\t%d\n' % full)
    f.write('シード\t一部だけ作れた\t%d\n' % part)
    f.write('シード\tSQLを作れなかった\t%d\n' % none_)
    f.write('ファイル\tSQLファイルの数（db.sql・db_before.sql・db_N.sql）\t%d\n' % n_files)
    f.write('文\tやり直し用（画面で登録する前に流す）db_before.sql に入れた文\t%d\n' % before)
    for k, v in cnt.most_common():
        f.write('作れない理由\t%s\t%d\n' % (k, v))
    for k, v in gapc.most_common():
        f.write('設計と実装の差の候補（文の数。作った・作れないを含む）\t%s\t%d\n' % (k, v))
print('シード 全部/一部/なし:', full, part, none_, ' 作れない理由別:', dict(cnt), ' 差の候補:', dict(gapc))
