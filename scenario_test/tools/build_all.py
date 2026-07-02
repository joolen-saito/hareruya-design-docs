#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_all.py — 「正」シート集合(在庫優先マージ)を全てMarkdown化し index.md を作る。"""
import os, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_to_md as X

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F_ZAIKO = os.path.join(BASE, '在庫に関連する_業務一覧_業務フロー.xlsx')
F_02 = os.path.join(BASE, '02_業務一覧_業務フロー.xlsx')
OUT = os.path.join(BASE, 'markdown')

# 出力順と採用元。(連番, シート名, 出典file, 出典ラベル, 同一性メモ)
PLAN = [
    ('01', '業務フロー画面マトリクス', F_ZAIKO, '在庫', '在庫版で新規追加（業務フロー番号→画面の対応表）'),
    ('02', '業務一覧',              F_02,    '02',  '02のみ（全社の業務カタログ）'),
    ('03', '表紙',                  F_02,    '02',  '02のみ'),
    ('04', '全体図',                F_02,    '02',  '02のみ'),
    ('05', '店頭受取受注管理',       F_ZAIKO, '在庫', '02とほぼ同一（注記1セル追加のみ）'),
    ('06', '店頭買取',              F_ZAIKO, '在庫', '02から実質改訂（asisフロー編集あり）'),
    ('07', '店頭買取 (tobe)',       F_ZAIKO, '在庫', '在庫版で新規追加（将来像）'),
    ('08', 'イベント管理',          F_02,    '02',  '02のみ'),
    ('09', '商品登録・編集',        F_ZAIKO, '在庫', '02とほぼ同一（注記1セル追加のみ）'),
    ('10', '商品登録・編集 (tobe)', F_ZAIKO, '在庫', '在庫版で新規追加（将来像）'),
    ('11', '価格管理',              F_02,    '02',  '02のみ'),
    ('12', '在庫管理',              F_ZAIKO, '在庫', '02からほぼ全面書き換え（大幅拡張）'),
    ('13', '在庫管理 (tobe)',       F_ZAIKO, '在庫', '在庫版で新規追加（将来像・本命）'),
    ('14', 'ネット買取',            F_ZAIKO, '在庫', '02とほぼ同一（注記1セル追加のみ）'),
    ('15', '仕入れ業務',            F_ZAIKO, '在庫', '02とほぼ同一（追加7セル・一部修正）'),
    ('16', '通販受注管理',          F_ZAIKO, '在庫', '02とほぼ同一（注記2セル追加のみ）'),
    ('17', '通販受注管理（tobe）',   F_ZAIKO, '在庫', '在庫版で新規追加（将来像）'),
    ('18', 'デッキ登録',            F_02,    '02',  '02のみ'),
    ('19', '資料一覧',              F_ZAIKO, '在庫', '02と完全一致'),
    ('20', '凡例',                  F_ZAIKO, '在庫', '02と完全一致'),
]

def safe(name):
    return name.replace('/', '_').replace('・', '・').replace(' ', '').replace('（', '_').replace('）', '').replace('(', '_').replace(')', '')

def main():
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    index = ['# 業務フロー Markdown 索引',
             '',
             '晴れる屋 業務フロー(2ファイル)を「正＝在庫ファイル優先マージ」で書き起こした一式。',
             'シートの正本は **在庫に関連する_業務一覧_業務フロー.xlsx** を優先し、そこに無いシートは **02_業務一覧_業務フロー.xlsx** を採用。',
             '',
             '| # | シート | 出典 | ファイル | 同一性メモ |',
             '|---|---|---|---|---|']
    for num, name, fpath, label, note in PLAN:
        if fpath not in cache:
            z = zipfile.ZipFile(fpath)
            cache[fpath] = (z, X.load_shared(z), {n: t for n, t in X.workbook_sheets(z)})
        z, shared, smap = cache[fpath]
        if name not in smap:
            print(f'  !! sheet not found: {name} in {os.path.basename(fpath)}')
            continue
        md = X.sheet_to_md(z, name, smap[name], shared, source_label=f'{label}ファイル')
        fn = f'{num}_{safe(name)}.md'
        with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as f:
            f.write(md)
        print(f'  wrote {fn}')
        index.append(f'| {num} | {name} | {label} | [{fn}](./{fn}) | {note} |')
    index += ['', '## 凡例(記法)',
              '- **種別**: 手作業 / 判断 / データ-DB / 帳票-書類 / 定義済み処理(サブフロー) / 注釈(吹き出し) など prstGeom 由来。',
              '- **フェーズ**: asis=現行 / Tobe=将来像（図形の区切りラベルで判定）。',
              '- **実行主体(レーン)**: 図形ボックスの絶対座標(EMU)を最寄りのスイムレーン見出しへマップして推定。',
              '- **遷移**: 業務フロー線(実線) / データ遷移線(点線) を区別。`*n` は同一レコード参照。',
              '- ふりがな(rPh)は除去済み。',
              '']
    with open(os.path.join(OUT, 'index.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(index))
    print('  wrote index.md')

if __name__ == '__main__':
    main()
