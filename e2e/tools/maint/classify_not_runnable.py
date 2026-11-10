#!/usr/bin/env python3
"""テストの無いケースのうち、開発環境で流せないもの（DBでの準備・外部の試験環境・コマンドでのバッチ起動・環境設定の書き換えと再起動）を仕分ける。
  python3 tools/maint/classify_not_runnable.py <tested.tsv（coverage.mjs --list の出力）> <出力.tsv>
決まりは review/sheet_not_runnable_2026-11-10.md。"""
import csv,sys,glob,os,re,collections
C='../integration_test/casegen/cases'
tested={l.split('\t')[0] for l in open(sys.argv[1])}
listed={r['テストID'] for r in csv.DictReader(open('config/sheet_not_runnable.tsv'),delimiter='\t')}
claims=[l.rstrip('\n').split('\t') for l in open('review/WORK_CLAIMS.tsv')][1:]
other={c[0] for c in claims if c[1]!='実装のセッション'}
skip=re.compile(r'^(F03|F05|F06-1[1-7]|F07|F08|F09|M06|M07|M13|M15|M16-0[678]|A06|A07)')  # 後回しの領域
DB=re.compile(r'DBへ|DBから|DBで直接|DBで削除|DBシード|DBフィク')
EXT=re.compile(r'(スマレジ|ユニサーチ|SPLINKS|GMO|決済代行|ロジレス|GTM|Googleアナリティクス|GA4)[^／。]{0,15}(試験環境|テスト環境|サンドボックス|接続先)|試験用リバースプロキシ|送信元IPアドレスを')
MAIL=re.compile(r'(テスト用|試験用)メール(の)?受信(画面|環境)|受信したメールを(開|確認)|メールが(届|受信され)')
ENVC=re.compile(r'環境設定[^／。]{0,20}(替え|変え|書き換え)|再起動|起こし直')
BATCH=re.compile(r'実行コンソール|コンソールで「|コマンドを(実行|起動)|bin/console|を手動で起動')
REASON={'DB':'シードの投入方法がDBへの直接の設定（画面で作れない状態を使う）。テストデータは画面から作る決まりのため流せない',
 'EXT':'外部の試験環境（スマレジ・ユニサーチ・決済など）や試験用の中継への接続が要り、開発環境から使えない',
 'MAIL':'メール通知の受信そのものを確かめるケース。試験会員の本登録のメールを読む決まり（2026-10-31）の範囲外',
 'BATCH':'バッチをコマンドで起動する手順があり、共有の開発環境ではコマンドを実行できない',
 'ENV':'アプリの環境設定を書き換えて起こし直す手順があり、共有の開発環境では行えない'}
out=[];cnt=collections.Counter();per=collections.Counter();samp=collections.defaultdict(list)
for f in sorted(glob.glob(C+'/*_test_cases.tsv')):
    fid=os.path.basename(f).replace('_test_cases.tsv','')
    if skip.match(fid) or fid in other: continue
    sp=C+f'/{fid}_seed_data.tsv'
    seeds={r['シードID']:r for r in csv.DictReader(open(sp),delimiter='\t')} if os.path.exists(sp) else {}
    for r in csv.DictReader(open(f),delimiter='\t'):
        t=r['テストID']
        if t in tested or t in listed: continue
        used=[s.strip() for s in r['使用シード'].split(',') if s.strip()]
        envlike=lambda s: s.endswith('-ENV') or '試験環境構築時' in seeds[s]['投入方法']
        meth=' '.join(seeds[s]['投入方法'] for s in used if s in seeds and not envlike(s))
        meth_all=' '.join(seeds[s]['投入方法'] for s in used if s in seeds)
        attr=' '.join(seeds[s]['状態・属性'] for s in used if s in seeds)
        k=None
        if DB.search(meth): k='DB'
        elif EXT.search(r['手順']+r['期待結果']) or re.search(r'スマレジ(試験環境)?(の|で)[^／。]{0,30}(確認|開く|販売|取引|画面)', r['手順']): k='EXT'
        elif BATCH.search(r['手順']): k='BATCH'
        elif MAIL.search(r['手順']+r['期待結果']) and not re.search(r'仮会員|本登録|会員登録',r['手順']): k='MAIL'
        elif ENVC.search(r['手順']+meth): k='ENV'
        if k:
            out.append((t,REASON[k])); cnt[k]+=1; per[fid]+=1
            if len(samp[k])<4: samp[k].append((t,(r['手順'] if k!='DB' else meth)[:150]))
print(cnt, len(out), 'functions', len(per))
for k,v in samp.items():
    for x in v: print(k,x)
with open(sys.argv[2],'w') as w:
    for t,rsn in out: w.write(f'{t}\t{rsn}\n')
