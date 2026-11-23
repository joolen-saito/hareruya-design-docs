/**
 * M04-10 在庫移動振替CSV出力 の画面シード。正本: cases/M04-10_seed_data.tsv
 *
 * 作り方は M04-09・M04-08 のシード（seeds/m04-09.ts の runScenario）と同じ画面操作で、在庫移動を画面から登録する。
 * 2026-11-23 依頼者了承（メモリ e2e-finish-saito-blank-rows-1123）で、シード表の「DBへ直接設定する」は E2E の行だけ db_write で書く。
 *
 * 正本の外で補ったもの（エビデンスの注記に出る）:
 * - 店舗: シード表は「CSV共通店舗-NNN」「CSV移動先店舗-NNN」を店舗登録で作る。店舗は作らない決まり（2026-11-13）なので、
 *   出庫元を試験支店（1574）、入庫先を本店（店舗ID 1）で読み替える。
 * - 管理者: M04-10試験管理者（m0410_admin）・CSV登録者A の代わりに、M04-09 のシードの作業者・承認者（決まった印つき・1度だけ作る）を使う。
 *   CSV の登録者の列は「M04-09作業者」になる（どのケースも登録者の値を期待結果で見ない）。
 * - 商品: グッズ商品CSV登録で、実行の印つきの商品コードで作り、在庫編集で入庫して承認する（入庫10点・仕入単価100）。
 * - 日時: 移動中になった日時（ステータス変更履歴）・出庫日（007）は、画面で操作した日時になるので、E2E の在庫移動の行だけ DB で書く。
 *   登録日（どのケースも期待結果で見ない）は書かない。
 */
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { 在庫区分, 店A, 店B } from "../pages/admin/m04_09_move";
import * as dbx from "../db/m04_09_x";
import * as db10 from "../db/m04_10";
import { 本店の店舗ID, 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { ensureOperator, NAMES, Op, runScenario } from "./m04-09";

const EC: 在庫区分 = "EC-CUBE";
const SM: 在庫区分 = "スマレジ";

defineSeed("S-M04-10-ADM", async ({ browser, notes, seed }) => {
  reportSeedIssue(seed.シードID, "M04-10試験管理者（m0410_admin）の代わりに、M04-09 のシードの作業者（決まった印つき・1度だけ作る）を使った。店舗は試験支店と本店で読み替えた（店舗は作らない 2026-11-13）");
  await ensureOperator(browser, "S-M04-09-OP-A");
  notes.set("〔管理者ID-M0410-共有〕", db10.メンバーID(NAMES.作業者));
});

defineSeed("S-M04-10-REF", { needs: ["S-M04-10-ADM"] }, async ({ notes, seed }) => {
  reportSeedIssue(seed.シードID, "在庫区分（EC-CUBE・スマレジ）は製品に組み込みの値をそのまま使う。CSV登録者A の代わりに M04-09作業者 が在庫移動を登録する（CSV の登録者の列はどのケースの期待結果にも出ない）。〔管理画面ユーザID-M0410-共有〕は M04-09作業者 のメンバーIDを控えた");
  notes.set("〔管理画面ユーザID-M0410-共有〕", db10.メンバーID(NAMES.作業者));
});

async function run(ctx: SeedCtx, note: string, ops: Op[]): Promise<void> {
  reportSeedIssue(ctx.seed.シードID, `${note}。出庫元は試験支店（シード表の CSV共通店舗）、入庫先は本店（シード表の CSV移動先店舗）で読み替えた。商品は実行の印つきの商品コードでグッズ商品CSV登録で作り、入庫して承認した`);
  await runScenario(ctx, ops);
}

/**
 * シード表が控えると定める番号を控える（店舗ID は読み替えた試験支店・本店の番号。商品ID・商品在庫ID・明細ID・移動指示ID・ステータス履歴ID は DB で読む）。
 * 商品在庫ID は、明細の順に「出庫元の在庫・入庫先の在庫」（商品が2つなら A・B が商品A、C・D が商品B）。
 * 日時: 渡すと「移動中」のステータス変更履歴の日時を、E2E の行だけ DB で書く。
 */
function noteIds(n: string, o: { 指示?: boolean; 移動中の日時?: string } = {}): Op {
  return {
    op: "do", run: ({ notes, seed }) => {
      const id = notes.get(`〔在庫移動振替ID-M0410-${n}〕`);
      const x = db10.控えるIDを読む(id);
      notes.set(`〔店舗ID-M0410-${n}A〕`, 試験支店の店舗ID());
      notes.set(`〔店舗ID-M0410-${n}B〕`, 本店の店舗ID);
      const many = x.明細.length > 1;
      x.明細.forEach((d, i) => {
        const s = many ? String.fromCharCode(65 + i) : "";
        notes.set(`〔商品ID-M0410-${n}${s}〕`, d.商品ID);
        notes.set(`〔明細ID-M0410-${n}${s}〕`, d.明細ID);
        notes.set(`〔商品在庫ID-M0410-${n}${String.fromCharCode(65 + i * 2)}〕`, d.出庫元在庫ID);
        notes.set(`〔商品在庫ID-M0410-${n}${String.fromCharCode(66 + i * 2)}〕`, d.入庫先在庫ID);
      });
      if (o.指示) notes.set(`〔移動指示ID-M0410-${n}〕`, x.移動指示ID);
      if (!x.移動中の履歴ID) throw new Error(`${seed.シードID}: 在庫移動 ${id} に「移動中」のステータス変更履歴が無い`);
      if (o.移動中の日時) db10.移動中の履歴の日時を整える(`${seed.シードID}: 移動中になった日時`, x.移動中の履歴ID, o.移動中の日時);
      notes.set(`〔ステータス履歴ID-M0410-${n}〕`, x.移動中の履歴ID);
    },
  };
}

/** 商品を作り、試験支店の EC-CUBE に10点入庫する */
function goodsIn(items: { code: string; 基準価格?: number }[]): Op[] {
  return [
    { op: "goods", items: items.map((i) => ({ code: i.code, 基準価格: i.基準価格, 販売価格: i.基準価格, 買取価格: i.基準価格 !== undefined ? 100 : undefined })), free: true },
    { op: "in", items: items.map((i) => ({ code: i.code, store: 店A, zone: EC, qty: 10, unit: 100 })), free: true },
  ];
}

defineSeed("S-M04-10-BASE-002", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const p = rc("M0410-P-002");
  await run(ctx, "在庫移動を試験支店 EC-CUBE から本店 スマレジへ1点で登録し、出庫承認し、在庫移動指示を作って送り状No.を登録して移動中にした", [
    ...goodsIn([{ code: p }]),
    { op: "move", label: "〔在庫移動振替ID-M0410-002〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: p, qty: 1 }], until: "transit", mention: ["〔在庫移動振替ID-M0410-002〕", "移動点数=1", "ステータス=移動中"] },
    noteIds("002", { 指示: true }),
  ]);
});

defineSeed("S-M04-10-AGGREGATE-005", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const a = rc("M0410-A-005"), b = rc("M0410-B-005");
  await run(ctx, "商品A・商品Bを1点ずつの2明細で在庫移動を登録し、出庫承認して移動中にした", [
    ...goodsIn([{ code: a }, { code: b }]),
    { op: "move", label: "〔在庫移動振替ID-M0410-005〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: a, qty: 1 }, { code: b, qty: 1 }], until: "transit", mention: ["〔在庫移動振替ID-M0410-005〕", "移動点数1"] },
    noteIds("005"),
  ]);
});

defineSeed("S-M04-10-AGGREGATE-006", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const a = rc("M0410-A-006"), b = rc("M0410-B-006");
  await run(ctx, "基準価格1000の商品Aと2000の商品Bを1点ずつの2明細で在庫移動を登録し、出庫承認して移動中にした", [
    ...goodsIn([{ code: a, 基準価格: 1000 }, { code: b, 基準価格: 2000 }]),
    { op: "move", label: "〔在庫移動振替ID-M0410-006〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: a, qty: 1 }, { code: b, qty: 1 }], until: "transit", mention: ["〔在庫移動振替ID-M0410-006〕", "移動点数1"] },
    noteIds("006"),
  ]);
});

defineSeed("S-M04-10-BASE-007", { needs: ["S-M04-10-REF"] }, async (ctx) => {
  const p = rc("M0410-P-007");
  await run(ctx, "在庫移動を1点で登録し、出庫承認して移動中にした。移動中になった日時・出庫日（シード表 2026-08-01 10:00）は画面で操作した日時になるので、E2E の在庫移動の行だけ DB で書いた", [
    ...goodsIn([{ code: p }]),
    { op: "move", label: "〔在庫移動振替ID-M0410-007〕", from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: p, qty: 1 }], until: "transit", mention: ["〔在庫移動振替ID-M0410-007〕", "2026-08-01 10:00"] },
    { op: "do", run: ({ notes, seed }) => { dbx.移動の日時を整える(`${seed.シードID}: 出庫日`, notes.get("〔在庫移動振替ID-M0410-007〕"), { 出庫日時: "2026-08-01 10:00:00+09" }); } },
    noteIds("007", { 指示: true, 移動中の日時: "2026-08-01 10:00:00+09" }),
  ]);
});

function defineSingleSeed(seedId: string, n: string, qty: number): void {
  defineSeed(seedId, { needs: ["S-M04-10-REF"] }, async (ctx) => {
    const a = rc(`M0410-A-${n}`);
    await run(ctx, `基準価格1000の商品Aを${qty}点の1明細で在庫移動を登録し、出庫承認して移動中にした`, [
      ...goodsIn([{ code: a, 基準価格: 1000 }]),
      { op: "move", label: `〔在庫移動振替ID-M0410-${n}〕`, from: { store: 店A, zone: EC }, to: { store: 店B, zone: SM }, lines: [{ code: a, qty }], until: "transit", mention: [`〔在庫移動振替ID-M0410-${n}〕`, `移動点数${qty}`] },
      noteIds(n),
    ]);
  });
}

defineSingleSeed("S-M04-10-SINGLE-014", "014", 1);
defineSingleSeed("S-M04-10-SINGLE-015", "015", 3);
defineSingleSeed("S-M04-10-SINGLE-016", "016", 1);
