/**
 * F06-25 店頭モニターの画面シード。正本: cases/F06-25_seed_data.tsv
 * 店舗（SHOPS）: シード表は店舗ID 1 を「TC東京」・本店、店舗ID 5 を「大阪」・支店（支店URL osaka）に登録し直すと定める。
 * 手元の環境では店舗ID 1 は本店「Hareruya」、店舗ID 5 は「トーナメントセンター 大阪」で、支店URL osaka の画面が開く。店名はこのシードを使うケースの確かめに現れないので書き換えず、
 * 本店・支店の区別と支店URLが成り立つことをDBの参照と画面で確かめるだけにした（正本の外の補い。条件付き）。
 */
import { 店舗 } from "../db/f06_25";
import { BASE_URL } from "../config/env";
import { available } from "../lib/db";
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 番号札の値を書き換える, 店舗の番号札を全件消す } from "../db/f06_25_write";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { createMember, findMemberId } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { setMemberStores, WaitingTagPage } from "../pages/admin/m05_27_waiting_tag";
import { ensureTenant } from "../pages/admin/tenant";

defineSeed("S-F06-25-SHOPS", async () => {
  if (available) {
    const a = 店舗(1), b = 店舗(5);
    if (!a?.本店) throw new Error("店舗ID 1 が本店でない");
    if (!b || b.本店) throw new Error("店舗ID 5 が支店でない");
    reportSeedIssue("S-F06-25-SHOPS", `店名は書き換えていない（店舗ID 1「${a.店名}」・店舗ID 5「${b.店名}」。シード表は「TC東京」「大阪」）`);
  }
  const res = await fetch(`${BASE_URL}/ja/osaka/waiting_number`);
  if (res.status !== 200) throw new Error(`支店URL osaka の店頭モニター画面が開かない（${res.status}）`);
});

// ---------------------------------------------------------------- 番号札を使う定期取得のシード（試験店舗で作る）
//
// 読み替え（依頼者方針 2026-11-10。共有の店舗ID 1・5の番号札は消さない・書き換えない）:
//  - シード表の「店舗ID 1（TC東京・本店）」「店舗ID 5（大阪）」の番号札の状態は、M05-27 専用の試験店舗（試験本店-F0625P1・試験支店-F0625P2。店名に固定の印「-F0625P」）に作る。
//    店頭モニターの番号札の取得・音を鳴らす判定は店舗ごとに同じ作りなので、ケースは試験店舗の店頭モニター（/ja/<支店URL>/waiting_number）で確かめる。
//  - 番号札は半角英字しか画面で登録できないので、ハイフン・数字つきの値（KEEP-009 など）は、画面で英字だけの値（TMP＋英字）で登録してから、DBで値を設定する（印つきの試験店舗の番号札だけ）。
//  - 英字札ID・管理者IDは画面が振る値（シード表の固定の番号 627009001 などは画面で指定できないので使わない）。
//  - 番号札の値は10文字までなので、KEEP-F0625-020 は KEEP-020 にした。
//  - 受注・数字札（ピック完了の受注）を投入するシード（BASE-*・MAX25・GAP-*）は、DBで受注を作る作りになるので書かない。

/** 試験店舗の店頭モニターのアドレス（店名 → 支店URL） */
/** F06-25 専用の試験店舗（M05-27 の試験店舗とは別。流れを並べても番号札を互いに消さない）。固定の店名・略称・支店URL */
export const 本店 = "試験本店-F0625P1";
export const 支店 = "試験支店-F0625P2";
const 店の値: Record<string, { 略称: string; URL: string }> = {
  [本店]: { 略称: "F61", URL: "f0625p1" },
  [支店]: { 略称: "F62", URL: "f0625p2" },
};
export const モニターのパス = (店名: string): string => `/ja/${店の値[店名].URL}/waiting_number`;

const storeIds = new Map<string, string>();
function 店舗ID(店名: string): string {
  const id = storeIds.get(店名);
  if (!id) throw new Error(`店舗「${店名}」はまだ用意していない`);
  return id;
}
/** 試験店舗を、あれば使い、無ければ作る */
async function ensureStores(browser: Browser, seedId: string, names: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const name of names) {
      const v = 店の値[name];
      const id = await ensureTenant(page, {
        店名: name, 店名カナ: "シケンテンポ", 店名英語: "Test Shop", 支店URL: v.URL, 店名略称3文字: v.略称, ショップ名略称: name.slice(0, 20),
      }, (m) => reportSeedIssue(seedId, m));
      storeIds.set(name, id);
    }
  });
}

export const F0625_ADMIN: Account = { loginId: "f06-25-admin@example.test", password: "F0625AdminPass01" };
const F0625_ADMIN_NAME = "F06-25試験管理者";

async function ensureAdmin(browser: Browser, seedId: string): Promise<string> {
  await ensureStores(browser, seedId, [本店, 支店]);
  const shop = await 本店の店名(browser);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let id = await findMemberId(page, F0625_ADMIN_NAME);
    if (!id) {
      id = await createMember(page, {
        名前: F0625_ADMIN_NAME, 所属店舗: shop, ログインID: F0625_ADMIN.loginId, メールアドレス: F0625_ADMIN.loginId,
        パスワード: F0625_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
    // 試験店舗の番号札を扱えるよう、所属・デフォルト検索表示店舗を試験本店、編集可能店舗を試験本店と試験支店にする（この管理者はこの機能の専用）
    await setMemberStores(page, F0625_ADMIN_NAME, { 店舗ID: 店舗ID(本店), 編集可能店舗ID: [店舗ID(本店), 店舗ID(支店)] });
    return id;
  });
}

defineSeed("S-F06-25-ADM", async ({ browser, notes }) => {
  const id = await ensureAdmin(browser, "S-F06-25-ADM");
  for (const label of Notes.labelsIn(getSeed("S-F06-25-ADM")["状態・属性"] + getSeed("S-F06-25-ADM").投入方法)) {
    if (label === "〔管理者ID-F0625-共有〕") notes.set(label, id);
    else throw new Error(`S-F06-25-ADM: 呼び名 ${label} の種類が未対応`);
  }
  reportSeedIssue("S-F06-25-ADM", "権限は「システム管理者」にした（正本に権限の名前が無い）。編集可能店舗は、シード表の店舗ID 1・5（共有の店舗）でなく、試験店舗（試験本店-F0625P1・試験支店-F0625P2）にした");
});

const 英字だけ = (v: string) => /^[A-Za-z]+$/.test(v);

type 札のシード = {
  /** 試験本店の番号札（登録の順）。試験支店には作らない（空） */
  札: string[];
  /** 英字札IDを控える（呼び名の数字3桁＋英字 → 番号札の値） */
  控える?: Record<string, string>;
};

function defineTagSeed(sfx: string, spec: 札のシード): void {
  const seedId = sfx;
  defineSeed(seedId, { needs: ["S-F06-25-ADM"] }, async ({ browser, notes }) => {
    await ensureStores(browser, seedId, [本店, 支店]);
    let 消した = 0;
    for (const 店 of [本店, 支店]) 消した += 店舗の番号札を全件消す(店舗ID(店));
    if (消した > 0) reportSeedIssue(seedId, `試験店舗に前の実行の番号札が${消した}件残っていたので、DBで消した（F06-25専用の試験店舗の番号札だけ）`);
    const 登録値 = spec.札.map((v, i) => (英字だけ(v) ? v : `TMP${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`));
    const ids: string[] = [];
    if (登録値.length > 0) {
      await withAdminSession(browser, F0625_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        const w = new WaitingTagPage(page);
        await w.open();
        await w.検索店舗を選ぶ(本店);
        for (const v of 登録値) {
          const r = await w.登録する(v);
          if (!r.成功の表示) throw new Error(`${seedId}: 試験本店に番号札「${v}」を登録できない: ${r.エラーの表示.join(" / ") || "成功の表示なし"}`);
        }
        await w.検索店舗を選ぶ(本店);
        for (const v of 登録値) ids.push(await w.番号札ID(v));
      });
    }
    let 書き換えた = 0;
    spec.札.forEach((v, i) => { if (!英字だけ(v)) { 番号札の値を書き換える(ids[i], v); 書き換えた += 1; } });
    if (書き換えた > 0) reportSeedIssue(seedId, `番号札は半角英字だけしか画面で登録できないので、画面で英字だけの値（TMP＋英字）で登録し、DBで番号札の値をシード表の値（ハイフン・数字つき）に設定した（${書き換えた}件。試験店舗の番号札だけ）`);
    reportSeedIssue(seedId, "店舗ID 1（TC東京）・5（大阪）は共有の店舗なので番号札を消さず、試験店舗（試験本店-F0625P1・試験支店-F0625P2）に作った。受注・数字札は作っていない（数字札0件の状態）");
    for (const label of Notes.labelsIn(getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法)) {
      const m = /^〔英字札ID-F0625-(\d{3}[A-Z]?)〕$/.exec(label);
      const value = m ? spec.控える?.[m[1]] : undefined;
      const i = value === undefined ? -1 : spec.札.indexOf(value);
      if (i < 0) throw new Error(`${seedId}: 呼び名 ${label} に当たる番号札が無い`);
      notes.set(label, ids[i]);
    }
  });
}

defineTagSeed("S-F06-25-EMPTY-008", { 札: [] });
defineTagSeed("S-F06-25-POLL-009", { 札: ["KEEP-009", "OLD"], 控える: { "009": "OLD" } });
defineTagSeed("S-F06-25-POLL-010", { 札: ["KEEP-010", "OLD"], 控える: { "010": "OLD" } });
defineTagSeed("S-F06-25-EMPTY-011", { 札: [] });
defineTagSeed("S-F06-25-EMPTY-012", { 札: [] });
defineTagSeed("S-F06-25-POLL-013", { 札: ["KEEP-013", "OLD"], 控える: { "013": "OLD" } });
defineTagSeed("S-F06-25-DPPOLL-020", { 札: ["KEEP-020"] });
const 英字26 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
defineTagSeed("S-F06-25-ALPHA26-017", { 札: 英字26, 控える: Object.fromEntries(英字26.map((c) => [`017${c}`, c])) });
