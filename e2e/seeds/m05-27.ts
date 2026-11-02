/**
 * M05-27 店頭注文番号札管理の画面シード。正本: cases/M05-27_seed_data.tsv
 *
 * 実装したのは、画面だけで準備できる 015・025・026（S-M05-27-ADM-LIMIT・S-M05-27-DUP-015・S-M05-27-TAGS-025・S-M05-27-TAGS-026）。
 * ほかのシードは、番号札にハイフンと数字を含む値を「画面で指定できないためDBへ直接設定する」ので実装しない
 * （記録 e2e/review/M05-27_progress_2026-10-31.md）。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 管理者 m0527_limit: メンバー登録画面で登録（権限は店頭注文番号札管理を操作できる「システム管理者」）。
 *    デフォルト検索表示店舗と編集可能店舗は、各ケースの開始時にメンバー管理画面で設定する（ケースの事前準備②）。
 * 2. 店舗: 店舗登録画面で登録し、店舗一覧のID欄から店舗IDを控える。
 * 3. 番号札: 店頭注文番号札管理画面で、検索店舗を選んで番号札を登録する（登録する管理者は、その店舗を編集可能店舗に含める）。
 *    番号札IDは、一覧の削除ボタンのURLに含まれる番号。
 *
 * 決め打ちの識別の値（店舗名）には、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。番号札の値は半角英字だけと定められているので、そのまま。
 * 店舗の略称（3文字）・支店URLは、一意でなければ登録できないので、実行の印から作った値にした（正本は任意の値と定める）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { setMemberStores, WaitingTagPage } from "../pages/admin/m05_27_waiting_tag";
import { createMember, findMemberId } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";

export const M0527_LIMIT: Account = { loginId: "m0527_limit", password: "Passw0rd!M0527L" };
export const M0527_LIMIT_NAME = "M05-27制限管理者";

/** 実行の印から作る、3文字の略称（店舗ごとに k で変える） */
function digit3(k: number): string {
  const n = (parseInt(RUN_MARK.slice(-6), 36) * 7 + k * 1297) % (36 ** 3);
  return n.toString(36).toUpperCase().padStart(3, "0");
}

/** 作った店舗の店舗ID（ケースの文の店名＝正本の値から引く） */
const storeIds = new Map<string, string>();
export function 店舗ID(正本の店名: string): string {
  const id = storeIds.get(rc(正本の店名));
  if (!id) throw new Error(`店舗「${正本の店名}」はまだ作っていない`);
  return id;
}

async function makeStores(browser: Browser, seedId: string, names: string[], k0: number): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    let k = k0;
    for (const n of names) {
      const name = rc(n);
      const id = await ensureTenant(page, {
        店名: name, 店名カナ: "シケンテンポ", 店名英語: "Test Shop", 支店URL: `m0527s${RUN_MARK.toLowerCase()}${k}`, 店名略称3文字: digit3(k), ショップ名略称: name.slice(0, 20),
      }, issue);
      storeIds.set(name, id);
      k += 1;
    }
  });
}

/** 管理者の編集可能店舗を、店名で設定する（ケースの事前準備② と、シードの登録時の両方で使う） */
export async function 編集可能店舗を設定する(browser: Browser, 所属と既定の店名: string, 編集可能な店名: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await setMemberStores(page, M0527_LIMIT_NAME, { 店舗ID: 店舗ID(所属と既定の店名), 編集可能店舗ID: 編集可能な店名.map(店舗ID) });
  });
}

async function registerTag(browser: Browser, shopName: string, tag: string): Promise<string> {
  return withAdminSession(browser, M0527_LIMIT, async (page) => {
    const w = new WaitingTagPage(page);
    await w.open();
    await w.検索店舗を選ぶ(rc(shopName));
    const r = await w.登録する(tag);
    if (!r.成功の表示) throw new Error(`店舗「${rc(shopName)}」に番号札「${tag}」を登録できない: ${r.エラーの表示.join(" / ") || "成功の表示なし"}`);
    // 登録後は、管理者の既定の検索店舗の一覧へ戻るので、もう一度その店舗を選んで番号札IDを読む
    await w.検索店舗を選ぶ(rc(shopName));
    return w.番号札ID(tag);
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

defineSeed("S-M05-27-DUP-015", { needs: ["S-M05-27-ADM-LIMIT"] }, async ({ browser, notes }) => {
  const seedId = "S-M05-27-DUP-015";
  await makeStores(browser, seedId, ["試験本店M527A015", "試験支店M527B015"], 1);
  // 登録する管理者は、試験支店を編集可能店舗に含める
  await 編集可能店舗を設定する(browser, "試験本店M527A015", ["試験本店M527A015", "試験支店M527B015"]);
  const tagId = await registerTag(browser, "試験支店M527B015", "DUPLICATE");
  noteLabels(seedId, notes, {
    "〔店舗ID-M0527-015A〕": 店舗ID("試験本店M527A015"), "〔店舗ID-M0527-015B〕": 店舗ID("試験支店M527B015"), "〔番号札ID-M0527-015〕": tagId,
  });
});

async function tagsSeed(seedId: string, browser: Browser, notes: Notes, n: "025" | "026", k0: number): Promise<void> {
  const a = `試験本店M0527-${n}-A`;
  const c = `試験権限外店舗M0527-${n}-C`;
  await makeStores(browser, seedId, [a, c], k0);
  await 編集可能店舗を設定する(browser, a, [a]);
  const idA = await registerTag(browser, a, "ALPHAZ");
  await 編集可能店舗を設定する(browser, c, [c]);
  const idC = await registerTag(browser, c, "CHARLIEZ");
  noteLabels(seedId, notes, {
    [`〔店舗ID-M0527-${n}A〕`]: 店舗ID(a), [`〔店舗ID-M0527-${n}B〕`]: 店舗ID(c),
    [`〔番号札ID-M0527-${n}A〕`]: idA, [`〔番号札ID-M0527-${n}B〕`]: idC,
  });
}

defineSeed("S-M05-27-TAGS-025", { needs: ["S-M05-27-ADM-LIMIT"] }, async ({ browser, notes }) => tagsSeed("S-M05-27-TAGS-025", browser, notes, "025", 11));
defineSeed("S-M05-27-TAGS-026", { needs: ["S-M05-27-ADM-LIMIT"] }, async ({ browser, notes }) => tagsSeed("S-M05-27-TAGS-026", browser, notes, "026", 21));
