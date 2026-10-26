#!/usr/bin/env bash
# DBの表・列・外部キーの定義を information_schema / pg_catalog から SELECT だけで読み、tools/db_schema/ に写す。DBは変更しない(読み取り専用トランザクション)。
set -e
cd "$(dirname "$0")"
mkdir -p db_schema
C="${E2E_DB_CONTAINER:-ec-cube-enterprise-postgres_primary-1}"
q() { printf 'begin transaction read only;\n%s;\nrollback;\n' "$1" | docker exec -i "$C" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -q -At -F "|" -U "$POSTGRES_USER" -d "${POSTGRES_DB:-eccubedb}" -v ON_ERROR_STOP=1' | grep -v '^BEGIN$\|^ROLLBACK$'; }
q "select table_name,column_name,data_type,is_nullable,coalesce(column_default,'') from information_schema.columns where table_schema='public' order by table_name,ordinal_position" > db_schema/columns.txt
q "select cl.relname, a.attname, cf.relname, af.attname, c.confdeltype from pg_constraint c join pg_class cl on cl.oid=c.conrelid join pg_class cf on cf.oid=c.confrelid join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1] join pg_attribute af on af.attrelid=c.confrelid and af.attnum=c.confkey[1] where c.contype='f' and array_length(c.conkey,1)=1 order by 3,1" > db_schema/fk.txt
q "select table_name from information_schema.tables where table_schema='public' order by 1" > db_schema/tables.txt
