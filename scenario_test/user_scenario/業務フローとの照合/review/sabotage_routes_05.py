"""業務パターンの表（tools/build_route_table.py）の止まる条件を、routes/05_店頭受取受注管理.tsv をメモリの上で壊して確かめる（業務フロー05 の試作用）。
ファイルは書き換えない。全部の壊し方で止まれば「16/16 止まった」と出る。
使い方（scenario_test/user_scenario で）：python3 -I 業務フローとの照合/review/sabotage_routes_05.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
import build_route_table as b  # noqa: E402

orig = b.tsv
CASES = {
    "ピック完了を黙って飛ばす": ("05-2-A", lambda r: r.update({"Excelの行": r["Excelの行"].replace("R96・", "")})),
    "終わりの夜間削除を落とす": ("05-2-A", lambda r: r.update({"Excelの行": r["Excelの行"].replace("・R142", "")})),
    "キャンセルの工程を落とす": ("05-1-B", lambda r: r.update({"Excelの行": r["Excelの行"].replace("R51・", "")})),
    "途中から始まる": ("05-1-C", lambda r: r.update({"Excelの行": "R51・R53・R57・R73"})),
    "判断の両側": ("05-3-A", lambda r: r.update({"Excelの行": "R152・R158・R163・R168・R174・R180・R191・R197・R203"})),
    "理由を消す": ("05-4-A", lambda r: r.update({"飛ばす工程": ""})),
    "支店の工程を本店に": ("05-4-A", lambda r: r.update({"Excelの行": r["Excelの行"].replace("R229・", "R229・R235・")})),
    "支店の工程を落とす": ("05-4-B", lambda r: r.update({"Excelの行": r["Excelの行"].replace("R235・R237・", "")})),
    "空の理由で決済を飛ばす": ("05-4-A", lambda r: r.update({"Excelの行": r["Excelの行"].replace("R269・", ""), "飛ばす工程": r["飛ばす工程"] + "／R269："})),
    "シナリオの順を逆に": ("05-1-A", lambda r: r.update({"通すシナリオ": "UOR-09 → UOR-02 → UOR-01"})),
    "前後のテストを消す": ("05-1-A", lambda r: r.update({"前後のテスト": ""})),
    "前後のテストの列名違い": ("05-1-A", lambda r: r.update({"前後のテスト": "UOR-01：店舗=本店"})),
    "逆の側の値": ("05-2-B", lambda r: r.update({"業務条件の値": "B2-1"})),
    "違うシナリオ": ("05-3-A", lambda r: r.update({"通すシナリオ": "UOR-01 → UOR-04 → UOR-09"})),
    "相反する値": ("05-1-A", lambda r: r.update({"業務条件の値": "B1-1・B1-2"})),
    "空の文": ("05-1-A", lambda r: r.update({"業務パターン": ""})),
}
stopped = 0
for name, (rid, fn) in CASES.items():
    def fake(n, rid=rid, fn=fn):
        rows = orig(n)
        if n == "routes/05_店頭受取受注管理.tsv":
            for r in rows:
                if r["道筋"] == rid:
                    fn(r)
        return rows
    b.tsv = fake
    _, _, errors = b.build()
    stopped += bool(errors)
    print(f"{name} → " + (f"止まった（{errors[0][:60]}）" if errors else "止まらない"))
print(f"{stopped}/{len(CASES)} 止まった")
sys.exit(0 if stopped == len(CASES) else 1)
