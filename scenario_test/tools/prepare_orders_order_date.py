#!/usr/bin/env python3
"""期限試験用の既存受注の注文日補正SQLを生成する（DB接続・実行なし）。

実受注ID＋受注番号の両一致に限定し、更新前後を保存する。使用先は試験DB。
採番済み受注を作り直さない。CLI自体は更新を一切実行しない。
"""
from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/".codex/skills/hareruya-scenario-test-cases/scripts"))
from execution_repairs_orders import pickup_dates


def recipe(scenario, order_id, order_no, as_of):
    if not re.fullmatch(r"SCN-ORDER-.+-(00[1-8])",scenario):
        raise ValueError("店頭受取8経路のSCN IDを指定する")
    if not isinstance(order_id,int) or order_id<=0 or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}",order_no):
        raise ValueError("採番済みの内部ID(正整数)と受注番号を指定する")
    values=pickup_dates(scenario,as_of)
    where=f"id = {order_id} AND order_no = '{order_no}'"
    before=f"SELECT id, order_no, order_date, customer_id, order_status_id FROM dtb_order WHERE {where}"
    # 更新対象と変更前値を同じ文で固定し、更新結果1件をオペレータが照合する。
    update=(f"WITH old AS MATERIALIZED (SELECT id, order_date FROM dtb_order WHERE {where} FOR UPDATE), "
            f"changed AS (UPDATE dtb_order SET order_date = '{values['注文日']} 09:00:00+09' "
            f"WHERE id IN (SELECT id FROM old) RETURNING id, order_no, order_date) "
            "SELECT changed.id, changed.order_no, old.order_date AS before_order_date, "
            "changed.order_date AS after_order_date, "
            "format('UPDATE dtb_order SET order_date = %L WHERE id = %s AND order_no = %L AND order_date = %L RETURNING id, order_no, order_date', "
            "old.order_date, changed.id, changed.order_no, changed.order_date) AS restore_sql "
            "FROM changed JOIN old USING (id)")
    sql=[before,update,before]
    return {"scenario_id":scenario,"runtime_executed":False,"usage":"接続先が指定試験DBであることを確認した担当者が、EC-CUBEプロジェクトの試験コンテナで順に実行する。出力0件/複数件なら中止。UPDATEは注文日だけを変更する。変更前日時とUPDATE結果のrestore_sqlを試験記録へ保存する。",
            "restoration":"期限判定と証跡保存後、UPDATE結果のrestore_sqlを同じ試験コンテナのdbal:run-sql --force-fetchで実行する。戻り値1件と最後のSELECTで元日時への復元を確認する。復元はID・受注番号・補正後日時が一致する1件に限定する。0件なら他の変更を上書きせず調査する。",
            "expected_values":values,"sql":sql,"commands":["docker compose exec ec-cube php bin/console dbal:run-sql --force-fetch "+shlex.quote(x) for x in sql],
            "evidence":["../ec-cube-enterprise/vendor/doctrine/dbal/src/Tools/Console/Command/RunSqlCommand.php:43-49","../ec-cube-enterprise/vendor/doctrine/doctrine-bundle/config/dbal.php:121-125","../ec-cube-enterprise/src/Eccube/Entity/Order.php:600-601","../ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:931-932"]}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--scenario",required=True);p.add_argument("--order-id",type=int,required=True)
    p.add_argument("--order-no",required=True);p.add_argument("--as-of",required=True)
    a=p.parse_args()
    print(json.dumps(recipe(a.scenario,a.order_id,a.order_no,a.as_of),ensure_ascii=False,indent=2))


if __name__=="__main__":main()
