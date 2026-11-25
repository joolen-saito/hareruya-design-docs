/**
 * M04-09 在庫移動・振替登録/編集の続き（2026-11-26）のシード。正本: cases/M04-09_seed_data.tsv の S-M04-09-MOVE-NEW-036・037・MOVE-DIFF-BOUNDARY-051・
 * MOVE-TRANSIT-057・GF-MOVE-NEW-111・DP-MOVE-NEW-152・DP-MOVE-TRANSIT-154。作り方の部品は seeds/m04-09.ts の runScenario を使う。
 * 商品は出庫元（店舗A・EC-CUBE）に10点・仕入単価100で入庫し、店舗A→店舗B（EC-CUBE）へ登録する。新規登録のまま、または移動中まで進める。
 */
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { 店A, 店B } from "../pages/admin/m04_09_move";
import { MoveUntil, Op, runScenario } from "./m04-09";

const EC = "EC-CUBE" as const;

/** 商品（出庫元に10点・仕入単価100）を1行のCSVまたは複数行のCSVで登録し、店舗A→店舗B へ移動を登録して until まで進める */
function defineMoveSeed(seedId: string, label: string, lines: { code: string; qty: number }[], until: MoveUntil): void {
  const ops: Op[] = [
    { op: "goods", items: lines.map((l) => ({ code: l.code })) },
    { op: "in", items: lines.map((l) => ({ code: l.code, store: 店A, zone: EC, qty: 10, unit: 100 })) },
    { op: "move", label, from: { store: 店A, zone: EC }, to: { store: 店B, zone: EC }, lines, until },
  ];
  defineSeed(seedId, (ctx) => runScenario(ctx, ops));
}

defineMoveSeed("S-M04-09-MOVE-NEW-036", "〔在庫移動ID-M0409-036〕", [{ code: rc("M409-MOV-A-036"), qty: 3 }], "new");
defineMoveSeed("S-M04-09-MOVE-NEW-037", "〔在庫移動ID-M0409-037〕", [{ code: rc("M409-MOV-A-037"), qty: 3 }], "new");
defineMoveSeed("S-M04-09-MOVE-DIFF-BOUNDARY-051", "〔在庫移動ID-M0409-051〕", [{ code: rc("M409-MOV-A-051"), qty: 1 }, { code: rc("M409-MOV-B-051"), qty: 1 }], "transit");
defineMoveSeed("S-M04-09-MOVE-TRANSIT-057", "〔在庫移動ID-M0409-057〕", [{ code: rc("M409-MOV-A-057"), qty: 1 }, { code: rc("M409-MOV-B-057"), qty: 1 }], "transit");
defineMoveSeed("S-M04-09-GF-MOVE-NEW-111", "〔在庫移動ID-M0409-111〕", [{ code: rc("M0409-111-A"), qty: 3 }], "new");
defineMoveSeed("S-M04-09-DP-MOVE-NEW-152", "〔在庫移動ID-M0409-152〕", [{ code: rc("M0409-152-A"), qty: 3 }, { code: rc("M0409-152-B"), qty: 2 }], "new");
defineMoveSeed("S-M04-09-DP-MOVE-TRANSIT-154", "〔在庫移動ID-M0409-154〕", [{ code: rc("M0409-154-A"), qty: 3 }, { code: rc("M0409-154-B"), qty: 3 }], "transit");
