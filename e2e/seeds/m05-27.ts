/**
 * M05-27 店頭注文番号札管理の画面シード。正本: cases/M05-27_seed_data.tsv
 *
 * 試験用の店舗（共通の試験データ）:
 *   店舗を新しく登録すると、アプリは全商品の初期在庫を作る（M10-15 で判明）。シードごと・実行ごとに店舗を作ると共有の開発環境に店舗と在庫が増え続けるので、
 *   M05-27 専用の試験用店舗3店（本店・支店・権限外店舗。店名の末尾に固定の印「-M0527P1」〜「-M0527P3」）を使い回す。
 *   店舗一覧で店名を探し、無いときだけ店舗登録画面で作る。シード表の店名（試験本店M527A001 など）は、この3店に読み替える。
 *   番号札の値は10文字までなので実行の印を付けられない。そこで、シードを作るとき、使う店舗の番号札を全件消してから作る
 *   （店舗が M05-27 専用なので、中の番号札は前の実行の試験データだけ。db/m05_27_write.ts）。ケースは直列で流す前提。
 *
 * ハイフン・数字を含む番号札は、画面の登録が半角英字だけなので、画面で英字だけの値（TMP＋英字）で登録してから、
 * シード表の値へ DB で書き換える（db/m05_27_write.ts。M05-27 専用の試験用店舗の番号札だけ。シードの注記に「DBで〜に設定した」を残す）。
 * 番号札ID・店舗IDは画面が振った値（シード表の「527100101」などの固定の番号は画面で指定できないので、振られた値を使う）。
 * 002（TC東京＝店舗ID=1の番号札を全件退避する）は共有の店舗に触れるので実装しない。
 *
 * 管理者 m0527_limit: メンバー登録画面で登録（権限は店頭注文番号札管理を操作できる「システム管理者」）。
 * デフォルト検索表示店舗と編集可能店舗は、各ケースの開始時にメンバー管理画面で設定する（ケースの事前準備②）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { getSeed } from "../lib/catalog";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { setMemberStores, WaitingTagPage } from "../pages/admin/m05_27_waiting_tag";
import { 番号札の値を書き換える, 店舗の番号札を全件消す } from "../db/m05_27_write";
import { createMember, findMemberId } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";

export const M0527_LIMIT: Account = { loginId: "m0527_limit", password: "Passw0rd!M0527L" };
export const M0527_LIMIT_NAME = "M05-27制限管理者";

/** M05-27 専用の試験用店舗（固定の店名・略称・支店URL） */
export const 本店 = "試験本店-M0527P1";
export const 支店 = "試験支店-M0527P2";
export const 権限外 = "試験権限外店舗-M0527P3";
const 店の値: Record<string, { 略称: string; URL: string }> = {
  [本店]: { 略称: "M51", URL: "m0527p1" },
  [支店]: { 略称: "M52", URL: "m0527p2" },
  [権限外]: { 略称: "M53", URL: "m0527p3" },
};

/** 使った試験用店舗の店舗ID */
const storeIds = new Map<string, string>();
export function 店舗ID(店名: string): string {
  const id = storeIds.get(店名);
  if (!id) throw new Error(`店舗「${店名}」はまだ用意していない`);
  return id;
}

/** 試験用店舗を、あれば使い、無ければ作る */
async function ensureStores(browser: Browser, seedId: string, names: string[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const name of names) {
      const v = 店の値[name];
      if (!v) throw new Error(`試験用店舗でない店名: ${name}`);
      const id = await ensureTenant(page, {
        店名: name, 店名カナ: "シケンテンポ", 店名英語: "Test Shop", 支店URL: v.URL, 店名略称3文字: v.略称, ショップ名略称: name.slice(0, 20),
      }, issue);
      storeIds.set(name, id);
    }
  });
}

/** 管理者の編集可能店舗を、店名で設定する（ケースの事前準備② と、シードの登録時の両方で使う） */
export async function 編集可能店舗を設定する(browser: Browser, 所属と既定の店名: string, 編集可能な店名: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await setMemberStores(page, M0527_LIMIT_NAME, { 店舗ID: 店舗ID(所属と既定の店名), 編集可能店舗ID: 編集可能な店名.map(店舗ID) });
  });
}

defineSeed("S-M05-27-ADM-LIMIT", async ({ browser, notes }) => {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 既にいれば使う（編集可能店舗などはケースごとに変えるので、内容は確かめない）。いなければ登録する
    let 管理者ID = await findMemberId(page, M0527_LIMIT_NAME);
    if (!管理者ID) {
      管理者ID = await createMember(page, {
        名前: M0527_LIMIT_NAME, 所属店舗: shop, ログインID: M0527_LIMIT.loginId, メールアドレス: "m0527_limit@example.test",
        パスワード: M0527_LIMIT.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
    notes.set("〔管理者ID-M0527-共有A〕", 管理者ID);
  });
  reportSeedIssue("S-M05-27-ADM-LIMIT", "権限は、店頭注文番号札管理を操作できる「システム管理者」にした（正本に権限の名前が無い）");
});

function noteLabels(seedId: string, notes: Notes, byLabel: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const v = byLabel[label];
    if (!v) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v);
  }
}

// ---------------------------------------------------------------- 番号札のシード（画面で登録し、ハイフン・数字つきの値だけ DB で書き換える）

type TagSeed = {
  /** 使う試験用店舗（1つ目が本店。シード表の A・B の順） */
  店: string[];
  /** 番号札（店の番号 → 番号札の値。登録の順） */
  札: Record<number, string[]>;
  /** 呼び名〔番号札ID-M0527-nnn〕（A・B・なし）に控える番号札の値（なし・A は1つ目、B は2つ目） */
  控える札?: string[];
};

const 英字だけ = (v: string) => /^[A-Za-z]+$/.test(v);

/** 店舗の番号札を、管理者 m0527_limit で登録し、登録した順の番号札IDを返す（英字だけでない値は TMP＋英字で登録する） */
async function registerTags(browser: Browser, 店名: string, 値: string[]): Promise<string[]> {
  const 登録値 = 値.map((v, i) => (英字だけ(v) ? v : `TMP${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`));
  return withAdminSession(browser, M0527_LIMIT, async (page) => {
    const w = new WaitingTagPage(page);
    await w.open();
    for (const v of 登録値) {
      await w.検索店舗を選ぶ(店名);
      const r = await w.登録する(v);
      if (!r.成功の表示) throw new Error(`店舗「${店名}」に番号札「${v}」を登録できない: ${r.エラーの表示.join(" / ") || "成功の表示なし"}`);
    }
    await w.検索店舗を選ぶ(店名);
    const ids: string[] = [];
    for (const v of 登録値) ids.push(await w.番号札ID(v));
    return ids;
  });
}

function defineTagSeed(seedId: string, spec: TagSeed): void {
  defineSeed(seedId, { needs: ["S-M05-27-ADM-LIMIT"] }, async ({ browser, notes }) => {
    await ensureStores(browser, seedId, spec.店);
    // ケースは「その店舗の番号札がこれだけ」を前提にするので、試験用店舗の前の実行の番号札を全件消す
    let 消した = 0;
    for (const 店 of spec.店) 消した += 店舗の番号札を全件消す(店舗ID(店));
    if (消した > 0) reportSeedIssue(seedId, `試験用店舗（M05-27専用）に前の実行の番号札が${消した}件残っていたので、DBで消した`);
    // 番号札を登録する管理者は、その店舗を編集可能店舗に含める（所属・既定の店舗は1つ目）
    await 編集可能店舗を設定する(browser, spec.店[0], spec.店);
    const idByValue = new Map<string, string>();
    let 書き換えた = 0;
    for (const [i, 値] of Object.entries(spec.札)) {
      const ids = await registerTags(browser, spec.店[Number(i)], 値);
      for (const [j, v] of 値.entries()) {
        if (!英字だけ(v)) { 番号札の値を書き換える(ids[j], v); 書き換えた += 1; }
        idByValue.set(v, ids[j]);
      }
    }
    if (書き換えた > 0) {
      reportSeedIssue(seedId, `番号札は半角英字だけしか画面で登録できないので、画面で英字だけの値（TMP＋英字）で登録し、DBで番号札の値をシード表の値（ハイフン・数字つき）に設定した（${書き換えた}件。M05-27専用の試験用店舗の番号札だけ）`);
    }
    reportSeedIssue(seedId, "店舗はシード表の店名ごとに作らず、M05-27専用の試験用店舗（本店・支店・権限外店舗）を使い回す（店舗が増え続けないため）。店名・番号札ID・店舗IDは、登録時の値に読み替える");
    const byLabel: Record<string, string> = {};
    for (const label of Notes.labelsIn(getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法)) {
      const m = /^〔店舗ID-M0527-\d{3}([AB])?〕$/.exec(label);
      if (m) { byLabel[label] = 店舗ID(spec.店[m[1] === "B" ? 1 : 0]); continue; }
      const t = /^〔番号札ID-M0527-\d{3}([AB])?〕$/.exec(label);
      if (t && spec.控える札) byLabel[label] = idByValue.get(spec.控える札[t[1] === "B" ? 1 : 0]) ?? "";
    }
    noteLabels(seedId, notes, byLabel);
  });
}

const 十一件 = (n: string) => "ABCDEFGHIJK".split("").map((c) => `TAG${c}-${n}`);

defineTagSeed("S-M05-27-TAGS-001", { 店: [本店], 札: { 0: ["ALPHA-001", "DELETE", "STALE-001"] }, 控える札: ["DELETE"] });
defineTagSeed("S-M05-27-TAGS-003", { 店: [本店, 支店], 札: { 1: ["BRAVO-003"] } });
// 004 のフロント表示用英字名: 正本は m0527-b-004 だが、画面の入力規則は半角英数字と空白だけ（ハイフン不可）なので、試験用の支店の固定の値（m0527p2）にした
defineTagSeed("S-M05-27-TAGS-004", { 店: [本店, 支店], 札: { 1: ["BRAVO-004"] } });
defineTagSeed("S-M05-27-TAGS-005", { 店: [本店, 権限外], 札: { 0: ["ALPHA-005"], 1: ["CHARLIE"] }, 控える札: ["CHARLIE"] });
defineTagSeed("S-M05-27-TAGS-006", { 店: [本店, 支店], 札: { 1: ["BRAVO-006"] } });
defineTagSeed("S-M05-27-TAGS-007", { 店: [本店, 支店], 札: { 1: ["BRAVO-007"] } });
defineTagSeed("S-M05-27-TAGS-009", { 店: [本店, 支店], 札: { 1: ["BRAVO-009"] } });
defineTagSeed("S-M05-27-DUP-015", { 店: [本店, 支店], 札: { 1: ["DUPLICATE"] }, 控える札: ["DUPLICATE"] });
defineTagSeed("S-M05-27-MANY-016", { 店: [本店], 札: { 0: 十一件("016") } });
defineTagSeed("S-M05-27-MANY-017", { 店: [本店], 札: { 0: 十一件("017") } });
defineTagSeed("S-M05-27-TAGS-018", { 店: [本店], 札: { 0: ["DELETE-018"] } });
defineTagSeed("S-M05-27-TAGS-019", { 店: [本店], 札: { 0: ["DELETE-019"] } });
defineTagSeed("S-M05-27-TAGS-020", { 店: [本店], 札: { 0: ["DELETE-020"] } });
defineTagSeed("S-M05-27-TAGS-021", { 店: [本店], 札: { 0: ["STALE-021"] } });
defineTagSeed("S-M05-27-TAGS-025", { 店: [本店, 権限外], 札: { 0: ["ALPHAZ"], 1: ["CHARLIEZ"] }, 控える札: ["ALPHAZ", "CHARLIEZ"] });
defineTagSeed("S-M05-27-TAGS-026", { 店: [本店, 権限外], 札: { 0: ["ALPHAZ"], 1: ["CHARLIEZ"] }, 控える札: ["ALPHAZ", "CHARLIEZ"] });
defineTagSeed("S-M05-27-DPTAGS-027", { 店: [本店, 支店], 札: { 0: ["TAG-M0527-027-A1", "TAG-M0527-027-A2"], 1: ["TAG-M0527-027-B1"] } });
defineTagSeed("S-M05-27-DPTAGS-028", { 店: [本店, 支店], 札: { 0: ["TAG-M0527-028-A1", "TAG-M0527-028-A2"], 1: ["TAG-M0527-028-B1"] } });
defineTagSeed("S-M05-27-DPTAGS-029", { 店: [本店], 札: { 0: ["TAG-M0527-029-A1", "TAG-M0527-029-A2", "TAG-M0527-029-A3"] } });
