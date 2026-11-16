/**
 * M12-01・M12-02 の店舗。店舗は作らない（依頼者 2026-11-15）。lib/store_create_ban.ts の E2Eの店舗 を店舗IDで選び、
 * 正本の店舗の性質（公開・開店・売上集計の検索項目・表示順）に合わないものだけ、ケース（シード）の間だけ店舗登録画面で性質を変え、
 * ケースの終わりに必ず元へ戻す（registerRestore。戻したあと読み直して照合する）。
 */
import { 店舗の作成は禁止 } from "../../lib/store_create_ban";
import { Page } from "@playwright/test";
import { findTenantId as 店舗IDを探す } from "./tenant_k";
import { E2E共用店舗 } from "../../lib/store_create_ban";
import { TenantEditPage, 戻すことを登録する, 押して保存 } from "./m10_15_tenant";
import { 店舗IDで選ぶ } from "./store_pick";

export type 店舗の定め = { 名前: string; 表示順: number; 公開: "公開" | "非公開"; 開店: "開店" | "閉店"; 売上集計: "表示する" | "表示しない"; カナ: string; 英語: string };

export const 店舗の定め一覧: 店舗の定め[] = [
  { 名前: "大阪店", 表示順: 10, 公開: "公開", 開店: "開店", 売上集計: "表示する", カナ: "オオサカテン", 英語: "Osaka" },
  { 名前: "TC東京", 表示順: 20, 公開: "公開", 開店: "開店", 売上集計: "表示する", カナ: "ティーシートウキョウ", 英語: "Tokyo" },
  { 名前: "休業店", 表示順: 30, 公開: "公開", 開店: "閉店", 売上集計: "表示する", カナ: "キュウギョウテン", 英語: "Closed" },
  { 名前: "非集計店", 表示順: 40, 公開: "公開", 開店: "開店", 売上集計: "表示しない", カナ: "ヒシュウケイテン", 英語: "Nosummary" },
  { 名前: "非公開店", 表示順: 50, 公開: "非公開", 開店: "開店", 売上集計: "表示する", カナ: "ヒコウカイテン", 英語: "Private" },
];

/** 正本の店舗 → 使う E2E の店舗の店舗ID（依頼者 2026-11-15） */
export const M12の店舗ID: Record<string, string> = { 大阪店: "221", TC東京: "5006", 休業店: "5007", 非集計店: "4973", 非公開店: "4974" };

export type 整えた店舗 = { id: string; 店名: string; 表示順: number };

type 状態 = { 公開: string; 開店: string; 売上集計: string; 表示順: number; 表示名: string };

async function 状態を読む(page: Page, 店舗ID: string): Promise<状態> {
  const p = new TenantEditPage(page);
  await p.直接開く(店舗ID); await p.待つ();
  const 略称 = (await p.値("ショップ名略称")).trim();
  return {
    公開: await p.選択("公開"), 開店: await p.選択("開店"), 売上集計: await p.選択("売上集計の検索項目"),
    表示順: Number(await p.値("表示順")), 表示名: 略称 !== "" ? 略称 : (await p.値("店名")).trim(),
  };
}

/**
 * 正本の店舗（呼び名）に、E2E の店舗を店舗IDで当て、正本の性質（公開・開店・売上集計の検索項目）に合わないものだけ店舗登録画面で変える。
 * 変える前に全項目を控え、ケースの終わりに元へ戻す（戻したあと読み直して照合する）。
 * 表示順は、大阪店と TC東京 が並んで出るケースで「大阪店が先」になるよう、TC東京 の表示順が大阪店より小さいときだけ大阪店と同じ値にする（同じ値なら店舗IDの順で大阪店が先）。
 * 画面の店舗の表示名はショップ名略称（空なら店名）なので、それを店名として返す。
 */
export async function 店舗を整える(page: Page, 呼び名s: string[], onIssue: (m: string) => void): Promise<Map<string, 整えた店舗>> {
  const defs = 呼び名s.map((n) => {
    const d = 店舗の定め一覧.find((x) => x.名前 === n);
    if (!d) throw new Error(`M12 の店舗の定めに「${n}」が無い`);
    return d;
  });
  const now = new Map<string, 状態>();
  for (const d of defs) {
    const id = M12の店舗ID[d.名前];
    await 店舗IDで選ぶ(page, id, d.名前, onIssue);
    now.set(d.名前, await 状態を読む(page, id));
  }
  const want = new Map<string, Partial<状態>>();
  for (const d of defs) {
    const s = now.get(d.名前)!;
    const w: Partial<状態> = {};
    if (s.公開 !== d.公開) w.公開 = d.公開;
    if (s.開店 !== d.開店) w.開店 = d.開店;
    if (s.売上集計 !== d.売上集計) w.売上集計 = d.売上集計;
    want.set(d.名前, w);
  }
  const osaka = now.get("大阪店"), tokyo = now.get("TC東京");
  if (osaka && tokyo && tokyo.表示順 < osaka.表示順) want.get("TC東京")!.表示順 = osaka.表示順;
  const out = new Map<string, 整えた店舗>();
  for (const d of defs) {
    const id = M12の店舗ID[d.名前];
    const w = want.get(d.名前)!;
    let s = now.get(d.名前)!;
    if (Object.keys(w).length > 0) {
      const p = new TenantEditPage(page);
      await p.直接開く(id); await p.待つ();
      await 戻すことを登録する(page, id, `M12 ${d.名前}`);
      if (w.公開) await p.入れる("公開", w.公開);
      if (w.開店) await p.入れる("開店", w.開店);
      if (w.売上集計) await p.入れる("売上集計の検索項目", w.売上集計);
      if (w.表示順 !== undefined) { const r = await p.入れる("表示順", String(w.表示順)); if (r) throw new Error(`表示順を変えられない: ${r}`); }
      await 押して保存(p, `店舗ID ${id} の性質の変更（${Object.entries(w).map(([k, v]) => `${k}=${v}`).join("・")}）`);
      const after = await 状態を読む(page, id);
      for (const [k, v] of Object.entries(w)) if ((after as Record<string, unknown>)[k] !== v) throw new Error(`店舗ID ${id} の${k}を「${v}」にしたが、読み直すと「${(after as Record<string, unknown>)[k]}」だった`);
      onIssue(`店舗登録画面で店舗ID ${id} の ${Object.entries(w).map(([k, v]) => `${k}を「${(now.get(d.名前) as Record<string, unknown>)[k]}」から「${v}」へ`).join("・")}変えた（ケースの終わりに元へ戻して照合する）`);
      s = after;
    }
    out.set(d.名前, { id, 店名: s.表示名, 表示順: s.表示順 });
  }
  return out;
}

/**
 * 店舗一覧で店名の行の店舗IDを読む。店名は実行の印つきでこの実行の店舗だけなので、同じ店名の行が複数あるとき
 * （登録の応答が遅く、成功の表示を待てないまま登録をやり直して重なったとき）は、最初に登録された（番号の小さい）行を使う。
 */
async function findTenantId(page: Page, 店名: string): Promise<string | null> {
  try { return await 店舗IDを探す(page, 店名); } catch (e) {
    if (!/複数ある/.test((e as Error).message)) throw e;
    const ids = (await page.locator("table.table tbody tr").filter({ has: page.getByRole("link", { name: 店名, exact: true }) }).locator("td:nth-child(2)").allInnerTexts())
      .map((t) => t.trim()).filter((t) => /^\d+$/.test(t)).sort((a, b) => Number(a) - Number(b));
    return ids[0] ?? null;
  }
}

/**
 * E2E の共用店舗（lib/store_create_ban.ts の E2E共用店舗。店舗ID 221）を使う。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止。１個だけを使い回す」）。
 * 求める属性（公開・開店・売上集計）が共用店舗と違えば、使わずに止める（合否を誤らないため）。店舗一覧で店名と店舗IDが合うことを確かめる。
 */
export async function ensureFixedStore(page: Page, d: 店舗の定め, _html_class_name: string, onIssue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  const s = E2E共用店舗;
  const 合わない = [d.公開 !== "公開" && "非公開", d.開店 !== "開店" && "閉店", d.売上集計 !== "表示する" && "売上集計に出さない"].filter(Boolean);
  if (合わない.length) throw new Error(`共用店舗（店舗ID ${s.id}）は 公開・開店・売上集計の対象なので、${合わない.join("・")}の店舗の代わりにならない。店舗は作らない（依頼者 2026-11-15）`);
  const id = await findTenantId(page, s.店名);
  if (id !== s.id) throw new Error(`共用店舗「${s.店名}」が店舗一覧で店舗ID ${s.id} として見つからない（見つかったのは ${id ?? "なし"}）。店舗は作らない（依頼者 2026-11-15）`);
  onIssue(`読み替え: 正本の店舗「${d.名前}」は、E2E の共用店舗「${s.店名}」（店舗ID ${s.id}）で表した（店舗は作らない。依頼者 2026-11-15）`);
  return { id, 店名: s.店名 };
}
