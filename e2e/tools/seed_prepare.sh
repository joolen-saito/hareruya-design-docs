#!/usr/bin/env bash
# 手順書(md)・CSV・登録順を作り直す。DB・アプリには触らない。CSV作成が環境の値をDBからSELECTだけで読む(CSV_MAKE_NO_DB=1 で読まない)。
# 順: 分け方 → 作り方の依存を数える → CSVの仕分け → CSV作成 → DB直接設定のSQL → 手順書 → 登録順
set -e
cd "$(dirname "$0")/.."
nice -n 19 node tools/seed_split.mjs
tools/seed_only.sh count
python3 tools/csv_seed_classes.py
python3 tools/csv_make.py
python3 tools/db_sql.py
nice -n 19 node tools/seed_split.mjs
python3 tools/seed_order.py
