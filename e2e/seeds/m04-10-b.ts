/**
 * M04-10 在庫移動振替CSV出力（003・004・009・010）のシード。正本: cases/M04-10_seed_data.tsv
 * 作り方は seeds/m04-10.ts と同じ（M04-09 の画面操作の部品 runScenario）。シード表の「DBへ直接設定する」在庫振替情報（在庫移動振替ID 410002 など）は、
 * 固定の番号を共有の環境へ書けないので、画面の「在庫振替登録」→ 承認で作り、画面が振った番号に読み替える（ケースは実行の印つきの商品コードから番号を引く）。
 * 正本の外で補ったもの:
 * - 店舗: CSV共通店舗・CSV検索対象店舗 は試験支店、CSV移動先店舗・CSV検索対象外店舗 は本店で読み替える（店舗は作らない 2026-11-13）。
 * - 在庫振替のステータス: シード表の「入庫完了」は、画面の表示名が「入庫済み」（画面の承認で到達する完了の状態）。同じ状態として扱う。
 * - 入庫完了になった日時・入庫日（2026-08-02 12:00。TRANSFER）は画面で指定できないので、E2E の在庫振替の行だけ DB で書く。登録日・登録者は書かない（どのケースも期待結果で見ない）。
 * - 呼び名の寄せ: 固定の番号（410002 など）を控える呼び名はシード表に無いので、在庫振替の番号は呼び名で控えず、商品コードから DB で引く（db/m04_09_move.ts の 商品の在庫移動振替）。
 *   在庫振替の登録は、控えると定められていない番号として控える（seeds/m04-09.ts の transfer の extra）。
 */
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { 在庫区分, 店A, 店B } from "../pages/admin/m04_09_move";
import * as db10 from "../db/m04_10";
import * as dbb from "../db/m04_10_b";
import { 商品の在庫移動振替 } from "../db/m04_09_move";
import { 本店の店舗ID, 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { Op, runScenario } from "./m04-09";

const EC: 在庫区分 = "EC-CUBE";
const SM: 在庫区分 = "スマレジ";
function 在庫の番号(code: string): string {
  const ids = 商品の在庫移動振替(code);
  if (ids.length !== 1) throw new Error(`商品コード ${code} の在庫移動・振替が ${ids.length} 件（1件のはず）`);
  return ids[0];
}
const 完了日時 = "2026-08-02 12:00:00+09";

export const コード = { 共有: () => rc("M0410-P-SHARED"), 共有の振替先: () => rc("M0410-P-SHARED-TO"), 比較: (n: string) => rc(`M0410-P-${n}`) };

function goods(items: { code: string }[], store: string): Op[] {
  return [
    { op: "goods", items: items.map((i) => ({ code: i.code, 基準価格: 1000, 販売価格: 1000, 買取価格: 100 })), free: true },
    { op: "in", items: items.map((i) => ({ code: i.code, store, zone: EC, qty: 10, unit: 100 })), free: true },
  ];
}

async function run(ctx: SeedCtx, note: string, ops: Op[]): Promise<void> {
  reportSeedIssue(ctx.seed.シードID, `${note}。店舗は試験支店・本店で読み替え、固定の番号は画面が振った番号に読み替えた。在庫振替の完了の状態は、画面の表示名が「入庫済み」`);
  await runScenario(ctx, ops);
}

defineSeed("S-M04-10-TRANSFER", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const a = コード.共有(), t = コード.共有の振替先();
  await run(ctx, "基準価格1000の商品を試験支店の EC-CUBE で1点、別の商品へ在庫振替で登録し、承認して入庫済みにした。入庫完了になった日時・入庫日（2026-08-02 12:00）は E2E の在庫振替の行だけ DB で書いた", [
    ...goods([{ code: a }, { code: t }], 店A),
    { op: "transfer", label: "〔在庫移動振替ID-M0410-共有〕", extra: true, store: 店A, zone: EC, lines: [{ code: a, dest: t, qty: 1 }], until: "done", mention: ["在庫移動振替ID=410002", "移動タイプ=在庫振替"] },
    {
      op: "do", run: ({ notes, seed }) => {
        const id = 在庫の番号(a);
        const h = dbb.最新の履歴(id);
        if (!h.履歴ID) throw new Error(`${seed.シードID}: 在庫振替 ${id} のステータス変更履歴が無い`);
        db10.移動中の履歴の日時を整える(`${seed.シードID}: 入庫完了になった日時`, h.履歴ID, 完了日時);
        dbb.入庫日時を書く(`${seed.シードID}: 入庫日`, id, 完了日時);
        const x = db10.控えるIDを読む(id);
        notes.set("〔店舗ID-M0410-共有〕", 試験支店の店舗ID());
        notes.set("〔商品ID-M0410-共有〕", x.明細[0].商品ID);
        notes.set("〔商品在庫ID-M0410-共有〕", x.明細[0].出庫元在庫ID);
      },
    },
  ]);
});

defineSeed("S-M04-10-BASE-004", { needs: ["S-M04-10-REF", "S-M04-10-TRANSFER"] }, async (ctx) => {
  const p = コード.比較("004A");
  await run(ctx, "在庫移動を試験支店 EC-CUBE から本店 スマレジへ1点で登録し、出庫承認し、在庫移動指示を作って送り状No.を登録して移動中にした", [
    ...goods([{ code: p }], 店A),
    { op: "move", label: "〔在庫移動振替ID-M0410-004〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: p, qty: 1 }], until: "transit", mention: ["〔在庫移動振替ID-M0410-004〕", "移動点数=1", "ステータス=移動中"] },
    {
      op: "do", run: ({ notes, seed }) => {
        const id = notes.get("〔在庫移動振替ID-M0410-004〕");
        const x = db10.控えるIDを読む(id);
        if (!x.移動中の履歴ID) throw new Error(`${seed.シードID}: 在庫移動 ${id} に「移動中」のステータス変更履歴が無い`);
        notes.set("〔店舗ID-M0410-004〕", 本店の店舗ID);
        notes.set("〔商品ID-M0410-004〕", x.明細[0].商品ID);
        notes.set("〔明細ID-M0410-004〕", x.明細[0].明細ID);
        notes.set("〔商品在庫ID-M0410-004A〕", x.明細[0].出庫元在庫ID);
        notes.set("〔商品在庫ID-M0410-004B〕", x.明細[0].入庫先在庫ID);
        notes.set("〔移動指示ID-M0410-004〕", x.移動指示ID);
        notes.set("〔ステータス履歴ID-M0410-004〕", x.移動中の履歴ID);
      },
    },
  ]);
});

defineSeed("S-M04-10-FILTER-010", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const [a, b, c] = ["010A", "010B", "010C"].map((n) => コード.比較(n));
  const [ta, tb, tc] = ["010A-TO", "010B-TO", "010C-TO"].map((n) => コード.比較(n));
  await run(ctx, "在庫振替を3件（試験支店で2件・本店で1件）登録し、承認して入庫済みにした（出庫元店舗・入庫先店舗は同じ店舗）", [
    ...goods([{ code: a }, { code: ta }, { code: b }, { code: tb }], 店A),
    ...goods([{ code: c }, { code: tc }], 店B),
    { op: "transfer", label: "〔在庫移動振替ID-M0410-010A〕", extra: true, store: 店A, zone: EC, lines: [{ code: a, dest: ta, qty: 1 }], until: "done", mention: ["在庫移動振替ID 410101010と410102", "移動タイプ=在庫振替"] },
    { op: "transfer", label: "〔在庫移動振替ID-M0410-010B〕", extra: true, store: 店A, zone: EC, lines: [{ code: b, dest: tb, qty: 1 }], until: "done", mention: ["在庫移動振替ID 410101010と410102", "移動タイプ=在庫振替"] },
    { op: "transfer", label: "〔在庫移動振替ID-M0410-010C〕", extra: true, store: 店B, zone: EC, lines: [{ code: c, dest: tc, qty: 1 }], until: "done", mention: ["410103010", "移動タイプ=在庫振替"] },
    {
      op: "do", run: ({ notes }) => {
        notes.set("〔店舗ID-M0410-010A〕", 試験支店の店舗ID());
        notes.set("〔店舗ID-M0410-010B〕", 本店の店舗ID);
        [a, b, c].forEach((code, i) => {
          const x = db10.控えるIDを読む(在庫の番号(code));
          const s = "ABC"[i];
          notes.set(`〔商品ID-M0410-010${s}〕`, x.明細[0].商品ID);
          notes.set(`〔商品在庫ID-M0410-010${s}〕`, x.明細[0].出庫元在庫ID);
        });
      },
    },
  ]);
});
