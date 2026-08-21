#!/usr/bin/env python3
"""Backlog: カテゴリ「不具合（バグ）」の課題を状態つきで取得する。

状態名は決め打ちしない。プロジェクトの状態マスタを引いて、
「対応中」に一致するものがあればそれで絞り、無ければ全状態を出して呼び出し側に判断させる。
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib_backlog import BacklogClient, pick_by_name  # noqa: E402

PROJECT = 'ECCUBE_HARERUYA'
CATEGORY = '不具合（バグ）'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'backlog_wip', 'issues_bug_all.json')


def main():
    c = BacklogClient.from_environment()
    proj = c.get_project(PROJECT)
    pid = proj['id']
    cats = c.get(f'/projects/{PROJECT}/categories')
    sts = c.get_statuses(PROJECT)
    print(f'project {PROJECT} id={pid}')
    print('--- categories ---')
    for x in cats:
        print(f"  {x['id']}\t{x['name']}")
    print('--- statuses ---')
    for x in sts:
        print(f"  {x['id']}\t{x['name']}")

    cat = pick_by_name(cats, CATEGORY, label='カテゴリ')
    print(f'\nカテゴリ確定: {cat["id"]} {cat["name"]}')

    # カテゴリ配下を全状態ぶん取得する（状態での絞り込みは後段で行う）
    got, off = [], 0
    while True:
        b = c.get('/issues', {'projectId[]': [pid], 'categoryId[]': [cat['id']],
                              'count': 100, 'offset': off,
                              'sort': 'created', 'order': 'asc'}) or []
        got += b
        if len(b) < 100:
            break
        off += len(b)
    print(f'カテゴリ配下の全課題: {len(got)}件')

    from collections import Counter
    for k, v in Counter(i['status']['name'] for i in got).most_common():
        print(f'  {k}: {v}')

    json.dump(got, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n保存: {OUT}')


if __name__ == '__main__':
    main()
