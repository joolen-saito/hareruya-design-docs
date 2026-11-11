/**
 * M06-04 買取ステータス変更 の画面シード（QG で始まるシードは seeds/m06-04.ts）。正本: cases/M06-04_seed_data.tsv
 *
 * シード表の投入方法が「DB」を含むものも、依頼者の方針（2026-11-10「既存データか、自分で画面から作ったデータに読み替えてよい」）で、
 * 次のように画面で作る。読み替えたことは、シードの報告（エビデンスの「シード作成時の問題」）に残す。DB へは書き込まない。
 * - S-M06-04-MASTER・L-MASTER: 買取店舗A・B は M06-01 と共通の試験店舗（買取店舗A＝支店URL m0601a・買取店舗B＝m0601b）を使い回す。
 *   カード部門は、いまの追加システム設定の固定価格商品部門（既存の部門）に、サプライ部門はそれと違う既存の部門の先頭に読み替える
 *   （共有のマスタに部門を足さない）。店頭買取ステータスマスタは既存のものを使う。担当者 seed_owner はメンバー登録で作る。
 * - S-M06-04-SUMMARY-CONFIG: 共有の設定は書き換えない。いまの固定価格商品部門がカード部門（上の読み替え）であることを確かめるだけ。
 * - ITチーム・経理・買取管理の権限: 権限「システム管理者」（権限管理で、店頭買取のステータス変更・経理払い出し済/入庫済みを許可していることを確かめる）。
 *   ITチーム権限なし・経理権限なし・買取管理（更新）権限なし: 権限管理で、その機能のアクセスURLを拒否し、買取一覧・買取詳細を許可している
 *   既存の権限を探して使う（権限のマスターに行を足さない・既存の権限の設定を変えない）。無ければ止める（判断待ち）。
 * - ケース専用の買取: フロントの店頭買取査定申込（会員登録なし）で申込み（申込者の名に実行の印を付ける）、管理画面の買取一覧で申込者名を検索して
 *   査定IDと店頭買取受注IDを控え、ステータス変更画面（M06-04試験ITメンバーA）でシード表のステータスにする。
 *   DBで入れる値（更新日時・担当者・金額・決め打ちの日時・ステータス変更履歴0件）は入れない（申込・画面の操作で入った値のまま）。
 *   決め打ちの店頭買取受注ID・査定ID（600404014 など）は、画面が振った番号に読み替える（固定IDの読み替え）。
 *   決め打ちの買取成立日が要るものは、ステータスを一度「買取成立」にしてから目的のステータスにする（買取成立日はシードを作った時刻になる）。
 * - 店頭買取受注ID 999999 の不存在: 削除はしない。管理画面でその番号の買取詳細が開けない（見つからない）ことを確かめるだけ。
 *
 * 明細・個別入力商品・金額・買取集計の値がDBでしか入らないシード、MTGバイヤー（買取端末のアプリ）での査定が要るシードは作らない。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { createMemberByStoreIds, expectMemberByStoreIds, M0424MemberInput } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { readFixedPriceSection } from "../pages/admin/m06_04_settings";
import { OtcOrderDetailPage, 一覧から詳細を開く, 申込者名で査定IDを探す, 権限URL, 権限の許可を読む, 拒否している, 許可している } from "../pages/admin/m06_04_status";
import { OtcDetailPage } from "../pages/admin/m06_otc_list";
import { changeMemberAuthority, findMemberId } from "../pages/admin/member";
import { STORE_A, STORE_B } from "./m06-01";
import { 申込を行う, 申込者の } from "./m06-common";

export const M0604_IT_A: Account = { loginId: "m0604_it_a", password: "Passw0rd!M0604ItA" };
export const M0604_IT_B: Account = { loginId: "m0604_it_b", password: "Passw0rd!M0604ItB" };
export const M0604_NONIT: Account = { loginId: "m0604_nonit", password: "Passw0rd!M0604Ni" };
export const M0604_ACCOUNT: Account = { loginId: "m0604_account", password: "Passw0rd!M0604Ac" };
export const M0604_NONACCOUNT: Account = { loginId: "m0604_nonaccount", password: "Passw0rd!M0604Na" };
export const M0604_PURCHASE: Account = { loginId: "m0604_purchase", password: "Passw0rd!M0604Pu" };
export const M0604_NONPURCHASE: Account = { loginId: "m0604_nonpurchase", password: "Passw0rd!M0604Np" };
export const M0604_L_IT: Account = { loginId: "m0604_l_it", password: "Passw0rd!M0604Lit" };
/** 試験中権限変更メンバー。シード表のパスワード「M0604Rv008x」は11文字で、メンバーのパスワードの規則（12文字以上）に合わないので末尾を足した */
export const M0604_REVOKE = (no: "008" | "009"): Account => ({ loginId: `m0604_revoke-${no}`, password: `M0604Rv${no}x-Pass` });

export const M0604_IT_A_NAME = "M06-04試験ITメンバーA";
export const M0604_ACCOUNT_NAME = "M06-04試験経理メンバー";
export const M0604_L_IT_NAME = "M06-04連携試験ITメンバー";

const L_A = "〔店舗ID-M0604-共有A〕";
const L_B = "〔店舗ID-M0604-共有B〕";
const L_L = "〔店舗ID-M0604-共有L〕";
const L_CARD = "〔部門ID-M0604-共有カード〕";

// ---------------------------------------------------------------- 権限とメンバー

type 権限の種類 = "ITチーム・経理・買取管理あり" | "ITチームなし" | "経理・買取管理なし";

/** 権限の種類ごとに使う権限の名前（1回の実行の中で覚えておく） */
const 権限の名前 = new Map<権限の種類, string>();

/**
 * 権限管理の表を読み、権限の種類に合う権限の名前を返す（権限・権限の設定は変えない）。
 * - あり: 「システム管理者」が、買取一覧・買取詳細・ステータス変更画面・経理払い出し済/入庫済みのアクセスURLを許可していること。
 * - なし: その機能のアクセスURLを拒否し、買取一覧・買取詳細を許可している既存の権限（表の上から最初のもの。システム管理者は除く）。
 */
async function 権限を決める(page: Page, 種類: 権限の種類, issue: (m: string) => void): Promise<string> {
  const known = 権限の名前.get(種類);
  if (known) return known;
  const perms = await 権限の許可を読む(page);
  const 見る = [権限URL.買取一覧, 権限URL.買取詳細];
  let name: string | undefined;
  if (種類 === "ITチーム・経理・買取管理あり") {
    if (!許可している(perms.get("システム管理者"), [...見る, 権限URL.ステータス変更画面, 権限URL.経理払い出し済と入庫済み])) {
      throw new Error("権限管理で、権限「システム管理者」が店頭買取のステータス変更・経理払い出し済/入庫済みを許可していない（権限の設定は変えない決まりなので止めた）");
    }
    name = "システム管理者";
  } else {
    const deny = 種類 === "ITチームなし" ? [権限URL.ステータス変更画面] : [権限URL.経理払い出し済と入庫済み];
    name = [...perms.entries()].find(([n, p]) => n !== "システム管理者" && 拒否している(p, deny) && 許可している(p, 見る))?.[0];
    if (!name) {
      throw new Error(`権限管理に「${種類}」に当たる既存の権限（${種類 === "ITチームなし" ? "ステータス変更画面" : "経理払い出し済/入庫済み"}を拒否し、買取一覧・買取詳細を許可しているもの）が無い。`
        + `権限のマスターに足す・既存の権限の設定を変えるのは共有の設定の変更なので止めた（判断待ち。いまある権限: ${[...perms.keys()].join("、")}）`);
    }
  }
  issue(`「${種類}」の権限は、既存の権限「${name}」に読み替えた（権限管理で許可・拒否を確かめた）`);
  権限の名前.set(種類, name);
  return name;
}

/** M06-04 のメンバー: あれば権限をシード表の状態へ戻してから内容を確かめ、無ければ登録する。管理者IDを返す */
async function ensureM0604Member(page: Page, v: M0424MemberInput): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) return createMemberByStoreIds(page, v);
  await changeMemberAuthority(page, found, v.権限);
  await expectMemberByStoreIds(page, found, v);
  return found;
}

type メンバーの定め = { 名前: string; account: Account; 店: string; 種類: 権限の種類 };

/** メンバーを用意する（所属店舗・デフォルト検索表示店舗・編集可能店舗は、店の呼び名で控えた店舗だけ） */
async function メンバーを用意する(browser: Browser, notes: Notes, seedId: string, m: メンバーの定め): Promise<string> {
  const store = notes.get(m.店);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 権限 = await 権限を決める(page, m.種類, (s) => reportSeedIssue(seedId, s));
    return ensureM0604Member(page, {
      名前: m.名前, ログインID: m.account.loginId, メールアドレス: `${m.account.loginId}@example.test`, パスワード: m.account.password,
      権限, 所属店舗ID: store, デフォルト検索表示店舗ID: store, 編集可能店舗ID: [store],
    });
  });
}

/** 共有のメンバーのシード */
function defineMemberSeed(seedId: string, needs: string[], m: メンバーの定め): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => { await メンバーを用意する(browser, notes, seed.シードID, m); });
}

// ---------------------------------------------------------------- 店舗・部門・設定

defineSeed("S-M06-04-MASTER", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set(L_A, await ensureStore(page, STORE_A, issue, "本店"));
    notes.set(L_B, await ensureStore(page, STORE_B, issue, "支店"));
    issue(`買取店舗A・B は、M06-01 と共通の試験店舗（支店URL ${STORE_A.支店URL}・${STORE_B.支店URL}）を使い回した（正本の支店URL m0604_shop_a・m0604_shop_b の店舗は作らない）`);
    const card = await readFixedPriceSection(page);
    if (!card) throw new Error("追加システム設定の固定価格商品部門IDが空。カード部門に読み替える既存の部門が無い（共有の設定は書き換えない決まりなので止めた）");
    const dept = new DepartmentPage(page);
    await dept.openNew();
    const rows = await dept.allRows();
    const c = rows.find((r) => r.ID === card);
    if (!c) throw new Error(`固定価格商品部門ID ${card} の部門が、部門の一覧に無い`);
    const s = rows.find((r) => r.ID !== card);
    if (!s) throw new Error("部門の一覧に、カード部門のほかの部門が無い");
    notes.set(L_CARD, c.ID);
    notes.set("〔部門ID-M0604-共有サプライ〕", s.ID);
    issue(`カード部門は、いまの固定価格商品部門「${c.部門名}」（ID ${c.ID}）に、サプライ部門は既存の部門「${s.部門名}」（ID ${s.ID}）に読み替えた（共有のマスタに部門を足さない）`);
    const a = notes.get(L_A);
    notes.set("〔管理者ID-M0604-共有〕", await ensureM0604Member(page, {
      名前: "seed_owner", ログインID: "m0604_seed_owner", メールアドレス: "m0604_seed_owner@example.test", パスワード: "Passw0rd!M0604Seed",
      権限: await 権限を決める(page, "ITチーム・経理・買取管理あり", issue), 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
    }));
    issue("店頭買取ステータスマスタはDBへ設定せず、既存のものを使った（廃止の状態かどうかは、ステータス変更画面の選択肢に出るかで見る）");
  });
});

defineSeed("S-M06-04-SUMMARY-CONFIG", { needs: ["S-M06-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const now = await readFixedPriceSection(page);
    if (now !== notes.get(L_CARD)) throw new Error(`固定価格商品部門IDが ${now} で、カード部門（${notes.get(L_CARD)}）でない`);
    reportSeedIssue(seed.シードID, `共有の設定は書き換えず、いまの固定価格商品部門ID（${now}）がカード部門（読み替えた既存の部門）であることを確かめただけ`);
  });
});

defineSeed("S-M06-04-L-MASTER", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set(L_L, await ensureStore(page, STORE_A, issue, "本店"));
  });
  issue(`連携ケースの買取店舗A は、M06-01 と共通の試験店舗「買取店舗A」（支店URL ${STORE_A.支店URL}）を使い回した（正本の支店URL m0604_l_shop_a の店舗は作らない）。店頭買取ステータスマスタは既存のものを使った`);
});

defineMemberSeed("S-M06-04-IT-A", ["S-M06-04-MASTER"], { 名前: M0604_IT_A_NAME, account: M0604_IT_A, 店: L_A, 種類: "ITチーム・経理・買取管理あり" });
defineMemberSeed("S-M06-04-IT-B", ["S-M06-04-MASTER"], { 名前: "M06-04試験ITメンバーB", account: M0604_IT_B, 店: L_B, 種類: "ITチーム・経理・買取管理あり" });
defineMemberSeed("S-M06-04-NONIT-A", ["S-M06-04-MASTER"], { 名前: "M06-04非ITメンバー", account: M0604_NONIT, 店: L_A, 種類: "ITチームなし" });
defineMemberSeed("S-M06-04-ACCOUNT-A", ["S-M06-04-MASTER"], { 名前: M0604_ACCOUNT_NAME, account: M0604_ACCOUNT, 店: L_A, 種類: "ITチーム・経理・買取管理あり" });
defineMemberSeed("S-M06-04-NONACCOUNT-A", ["S-M06-04-MASTER"], { 名前: "M06-04非経理メンバー", account: M0604_NONACCOUNT, 店: L_A, 種類: "経理・買取管理なし" });
defineMemberSeed("S-M06-04-PURCHASE-A", ["S-M06-04-MASTER"], { 名前: "M06-04試験買取管理メンバー", account: M0604_PURCHASE, 店: L_A, 種類: "ITチーム・経理・買取管理あり" });
defineMemberSeed("S-M06-04-NONPURCHASE-A", ["S-M06-04-MASTER"], { 名前: "M06-04非買取管理メンバー", account: M0604_NONPURCHASE, 店: L_A, 種類: "経理・買取管理なし" });
defineMemberSeed("S-M06-04-L-IT", ["S-M06-04-L-MASTER"], { 名前: M0604_L_IT_NAME, account: M0604_L_IT, 店: L_L, 種類: "ITチーム・経理・買取管理あり" });

/** 試験中権限変更メンバー（ケース専用）。前の実行でケースが権限を外しているので、毎回ITチームの権限（システム管理者）に戻して使う */
function defineRevokeSeed(seedId: string, no: "008" | "009"): void {
  defineSeed(seedId, { needs: ["S-M06-04-MASTER"] }, async ({ browser, notes, seed }) => {
    const id = await メンバーを用意する(browser, notes, seed.シードID, { 名前: `試験中権限変更メンバー(${no})`, account: M0604_REVOKE(no), 店: L_A, 種類: "ITチーム・経理・買取管理あり" });
    notes.set(`〔管理者ID-M0604-${no}〕`, id);
    reportSeedIssue(seed.シードID, `パスワードはシード表の「M0604Rv${no}x」が11文字でメンバーの規則（12文字以上）に合わないので「${M0604_REVOKE(no).password}」にした。前の実行で権限を外したメンバーは、権限を戻して使う`);
  });
}
defineRevokeSeed("S-M06-04-IT-REVOKE-008", "008");
defineRevokeSeed("S-M06-04-IT-REVOKE-009", "009");

/** ケースが権限を外す先の権限（ITチームなし。権限管理で探した既存の権限）。ケースの手順2で使う */
export async function ITチームなしの権限(page: Page): Promise<string> {
  return 権限を決める(page, "ITチームなし", () => undefined);
}

defineSeed("S-M06-04-NOTFOUND-006", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const status = await new OtcOrderDetailPage(page).open("999999");
    if (status < 400) throw new Error(`店頭買取受注ID 999999 の買取詳細が開いた（応答 ${status}）。データがあるが、共有の環境では消さない決まりなので止めた`);
    reportSeedIssue(seed.シードID, `削除はしない。店頭買取受注ID 999999 の買取詳細が開けない（応答 ${status}）ことで、データが無いことを確かめた`);
  });
});

// ---------------------------------------------------------------- ケース専用の買取

export type 作った買取 = { 査定ID: string; 受注ID: string; 査定番号: string };

/** 決め打ちの店頭買取受注ID・査定ID（正本の 600404014 など）→ 画面が振った番号（1回の実行の中で持ち回す） */
const 固定IDの読み替え = new Map<string, 作った買取>();

/** 画面が振った番号の買取を、正本の決め打ちの査定ID（または呼び名）に結び付ける（DBで整える別のシードファイルから使う） */
export function 読み替えを登録する(固定: string, 買取: 作った買取): void {
  固定IDの読み替え.set(固定, 買取);
}

/** 正本の決め打ちの査定ID（600404014 など）を、シードが作った買取に読み替える */
export function 読み替えた買取(固定: string): 作った買取 {
  const r = 固定IDの読み替え.get(固定);
  if (!r) throw new Error(`査定ID ${固定} に当たる買取をシードが作っていない`);
  return r;
}

/** フロントで買取店舗Aへ申込み（会員登録なし）、管理画面の買取一覧で申込者名から査定ID、買取詳細のアドレスから店頭買取受注IDを読む */
export async function 店舗Aで申込む(browser: Browser, seedId: string, 姓: string, 名: string): Promise<作った買取> {
  const [完了の番号] = await 申込を行う(browser, STORE_A.支店URL, [申込者の(姓, 名, "エムゼロロクゼロヨン", "シケン")]);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 査定ID = await 申込者名で査定IDを探す(page, `${姓} ${名}`, STORE_A.店名);
    if (完了の番号 && 完了の番号 !== 査定ID) reportSeedIssue(seedId, `申込の完了画面の査定番号（${完了の番号}）と、買取一覧の査定ID（${査定ID}）が違う`);
    const 受注ID = await 一覧から詳細を開く(page, 査定ID);
    const 査定番号 = await new OtcOrderDetailPage(page).項目("査定番号");
    return { 査定ID, 受注ID, 査定番号 };
  });
}

/** M06-04試験ITメンバーA で、ステータス変更画面からステータスを順に変える。終わったあとの買取詳細のステータスと履歴（新しい順）を返す */
async function ステータスを順に変える(browser: Browser, 受注ID: string, 順: string[]): Promise<{ ステータス: string; 履歴: { 変更日時: string; ステータス: string; 変更者: string }[] }> {
  return withAdminSession(browser, M0604_IT_A, async (page) => {
    page.setDefaultTimeout(60_000);
    const d = new OtcOrderDetailPage(page);
    for (const s of 順) {
      const st = await d.open(受注ID);
      if (st >= 400) throw new Error(`店頭買取受注ID ${受注ID} の買取詳細が開けない（応答 ${st}）`);
      await new OtcDetailPage(page).ステータスを変える(s);
    }
    await d.open(受注ID);
    return { ステータス: await d.項目("ステータス"), 履歴: await d.履歴() };
  });
}

type 買取の定め = {
  /** 申込者の姓と、名の正本の値（名には実行の印を付ける） */
  姓: string; 名: string;
  /** ステータス変更画面で順に選ぶステータス（無ければ申込のまま＝査定前） */
  順?: string[];
  /** シード表のステータス（作ったあと、買取詳細で確かめる） */
  状態: string;
  /** 控える呼び名（店頭買取受注ID・査定ID・査定番号・履歴変更日時）。無ければ決め打ちの番号の読み替え */
  控え?: { 受注?: string; 査定ID?: string; 査定番号?: string; 履歴変更日時?: string };
  /** 正本の決め打ちの査定ID */
  固定?: string;
  /** 報告に残す読み替え */
  読み替え?: string;
};

/** ケース専用の買取のシード（シード表1行＝1つ） */
function defineOrderSeed(seedId: string, needs: string[], o: 買取の定め): void {
  defineSeed(seedId, { needs: [...needs, ...(o.順?.length ? ["S-M06-04-IT-A"] : [])] }, async ({ browser, notes, seed }) => {
    const r = await 店舗Aで申込む(browser, seed.シードID, o.姓, rc(o.名));
    const after = o.順?.length ? await ステータスを順に変える(browser, r.受注ID, o.順) : undefined;
    if (after && after.ステータス !== o.状態) {
      throw new Error(`ステータス変更画面で「${o.順!.join("」→「")}」と変えたが、ステータスが「${after.ステータス}」で、シード表の「${o.状態}」にならない`);
    }
    if (o.控え?.受注) notes.set(o.控え.受注, r.受注ID);
    if (o.控え?.査定ID) notes.set(o.控え.査定ID, r.査定ID);
    if (o.控え?.査定番号) notes.set(o.控え.査定番号, r.査定番号);
    if (o.控え?.履歴変更日時) {
      const h = after?.履歴[0];
      if (!h || h.ステータス !== o.状態 || h.変更者 !== M0604_IT_A_NAME) throw new Error(`ステータス変更履歴の最新の行が、ステータス「${o.状態}」・変更者「${M0604_IT_A_NAME}」でない（${JSON.stringify(h)}）`);
      notes.set(o.控え.履歴変更日時, h.変更日時);
    }
    if (o.固定) 固定IDの読み替え.set(o.固定, r);
    const parts = [
      o.固定 ? `決め打ちの店頭買取受注ID・査定ID ${o.固定} は、画面が振った店頭買取受注ID ${r.受注ID}・査定ID ${r.査定ID} に読み替えた` : "",
      o.順?.length ? `ステータスはステータス変更画面（${M0604_IT_A_NAME}）で「${o.順.join("」→「")}」と変えて「${o.状態}」にした` : "",
      o.読み替え ?? "",
    ].filter(Boolean);
    if (parts.length) reportSeedIssue(seed.シードID, parts.join("。"));
  });
}

const 店A = ["S-M06-04-MASTER"];
const 店L = ["S-M06-04-L-MASTER"];
const 申込と画面の値 = "DBで入れる値（更新日時・担当者・金額・ステータス変更履歴0件）は入れず、申込で入った値のまま（ステータス変更履歴は申込の「査定前」の1件がある）";
const 基本 = (no: string, 名: string, 読み替え = 申込と画面の値): 買取の定め => ({
  姓: "M0604", 名, 状態: "査定前", 控え: { 受注: `〔店頭買取受注ID-M0604-${no}〕`, 査定ID: `〔査定ID-M0604-${no}〕` }, 読み替え,
});
const 変更つき = (no: string, 姓: string, 名: string, 順: string[], 状態: string, 読み替え?: string): 買取の定め => ({
  姓, 名, 順, 状態, 控え: { 受注: `〔店頭買取受注ID-M0604-${no}〕`, 査定ID: `〔査定ID-M0604-${no}〕` }, 読み替え,
});
const 決め打ち = (固定: string, 名: string, 順: string[], 状態: string, 読み替え: string): 買取の定め => ({ 姓: "M0604", 名, 順, 状態, 固定, 読み替え });
const 成立日つき = "決め打ちの買取成立日はDBで入れず、一度「買取成立」にしたときの日時（シードを作った時刻）にした";
const 入庫の明細なし = "明細・商品・在庫（数量1の買取商品・ECCUBE在庫5）と決め打ちの買取成立日はDBでしか入らないので、明細の無い買取にした（入庫待ちにするだけ）";

defineOrderSeed("S-M06-04-BASE-001", 店A, 基本("001", "BASE001"));
defineOrderSeed("S-M06-04-BASE-002", 店A, 基本("002", "BASE002"));
defineOrderSeed("S-M06-04-BASE-003", 店A, 基本("003", "BASE003"));
defineOrderSeed("S-M06-04-BASE-004", 店A, 基本("004", "BASE004"));
defineOrderSeed("S-M06-04-BASE-005", 店A, 基本("005", "BASE005"));
defineOrderSeed("S-M06-04-BASE-007", 店A, 基本("007", "BASE007", ""));
defineOrderSeed("S-M06-04-BASE-008", 店A, 基本("008", "BASE008", ""));
defineOrderSeed("S-M06-04-BASE-009", 店A, 基本("009", "BASE009", ""));
defineOrderSeed("S-M06-04-ACCOUNTING-PENDING-010", 店A, 変更つき("010", "M0604", "PENDING010", ["経理払い出し待ち"], "経理払い出し待ち", "ステータス変更履歴0件はDBでしか作れないので、画面の操作で入った履歴のまま"));
defineOrderSeed("S-M06-04-ACCOUNTING-PENDING-011", 店A, 変更つき("011", "M0604", "PENDING011", ["経理払い出し待ち"], "経理払い出し待ち", "ステータス変更履歴0件はDBでしか作れないので、画面の操作で入った履歴のまま"));
defineOrderSeed("S-M06-04-ACCOUNTING-WRONG-012", 店A, 基本("012", "WRONG012", ""));
defineOrderSeed("S-M06-04-ACCOUNTING-WRONG-013", 店A, 基本("013", "WRONG013", ""));
defineOrderSeed("S-M06-04-STOCKING-PENDING-014", 店A, 決め打ち("600404014", "STOCK014", ["入庫待ち"], "入庫待ち", 入庫の明細なし));
defineOrderSeed("S-M06-04-STOCKING-PENDING-015", 店A, 決め打ち("600404015", "STOCK015", ["入庫待ち"], "入庫待ち", 入庫の明細なし));
defineOrderSeed("S-M06-04-BASE-016", 店A, 基本("016", "BASE016", ""));
defineOrderSeed("S-M06-04-STOCKED-017", 店A, 変更つき("017", "M0604", "STOCKED017", ["入庫済み"], "入庫済み", "決め打ちの買取成立日・入庫日時とステータス変更履歴0件はDBでしか入らないので、画面の操作で入った値のまま（買取成立日は空・入庫日時はシードを作った時刻）"));
defineOrderSeed("S-M06-04-STOCKED-018", 店A, 変更つき("018", "M0604", "STOCKED018", ["入庫済み"], "入庫済み", "決め打ちの買取成立日・入庫日時とステータス変更履歴0件はDBでしか入らないので、画面の操作で入った値のまま（買取成立日は空・入庫日時はシードを作った時刻）"));
defineOrderSeed("S-M06-04-BASE-019", 店A, 基本("019", "BASE019"));
defineOrderSeed("S-M06-04-BASE-020", 店A, 基本("020", "BASE020"));
defineOrderSeed("S-M06-04-STOCKING-PENDING-021", 店A, 決め打ち("600404021", "STOCK021", ["入庫待ち"], "入庫待ち", 入庫の明細なし));
defineOrderSeed("S-M06-04-COMPLETE-DATED-022", 店A, 変更つき("022", "M0604", "DATED022", ["買取成立", "管理者取消"], "管理者取消", 成立日つき));
defineOrderSeed("S-M06-04-BASE-023", 店A, 基本("023", "BASE023"));
defineOrderSeed("S-M06-04-BASE-024", 店A, 基本("024", "BASE024", "更新日時2026-08-01 09:00:00・担当者seed_owner はDBでしか入らないので、申込で入った更新日時・担当者のまま（ケースは、変更の前の値から変わらないことを見る）"));
defineOrderSeed("S-M06-04-BASE-030", 店A, 基本("030", "BASE030", ""));
defineOrderSeed("S-M06-04-BASE-031", 店A, 基本("031", "BASE031", ""));
defineOrderSeed("S-M06-04-BASE-032", 店A, 基本("032", "BASE032", ""));
defineOrderSeed("S-M06-04-BASE-034", 店A, 基本("034", "BASE034", ""));
defineOrderSeed("S-M06-04-BASE-035", 店A, 基本("035", "BASE035", ""));
defineOrderSeed("S-M06-04-L-ORDER-040", 店L, { 姓: "M0604", 名: "LORDER040", 状態: "査定前", 控え: { 受注: "〔店頭買取受注ID-M0604-040〕", 査定番号: "〔査定番号-M0604-040〕" }, 読み替え: 申込と画面の値 });
defineOrderSeed("S-M06-04-L-ORDER-041", 店L, { 姓: "M0604", 名: "LORDER041", 状態: "査定前", 控え: { 受注: "〔店頭買取受注ID-M0604-041〕", 査定番号: "〔査定番号-M0604-041〕" }, 読み替え: 申込と画面の値 });
defineOrderSeed("S-M06-04-L-ORDER-042", 店L, { 姓: "M0604", 名: "LORDER042", 状態: "査定前", 控え: { 受注: "〔店頭買取受注ID-M0604-042〕", 査定ID: "〔査定ID-M0604-042〕", 査定番号: "〔査定番号-M0604-042〕" }, 読み替え: 申込と画面の値 });
defineOrderSeed("S-M06-04-BASE-045", 店A, 基本("045", "BASE045", ""));
defineOrderSeed("S-M06-04-REPEAT-048", 店A, {
  ...変更つき("048", "M0604-048", "DP-M0604-048", ["査定中"], "査定中", "履歴の変更日時はDBで読まず、買取詳細のステータス変更履歴の最新の行（年/月/日 時:分:秒）から控えた。申込の「査定前」の履歴1件もある（DBでしか消せない）"),
  控え: { 受注: "〔店頭買取受注ID-M0604-048〕", 査定ID: "〔査定ID-M0604-048〕", 履歴変更日時: "〔履歴変更日時-M0604-048〕" },
});
defineOrderSeed("S-M06-04-ACCOUNTING-PENDING-049", 店A, {
  ...変更つき("049", "M0604-049", "DP-M0604-049", ["経理払い出し待ち"], "経理払い出し待ち", "履歴の変更日時はDBで読まず、買取詳細のステータス変更履歴の最新の行（年/月/日 時:分:秒）から控えた。申込の「査定前」の履歴1件もある（DBでしか消せない）"),
  控え: { 受注: "〔店頭買取受注ID-M0604-049〕", 査定ID: "〔査定ID-M0604-049〕", 履歴変更日時: "〔履歴変更日時-M0604-049〕" },
});
defineOrderSeed("S-M06-04-ACCOUNTING-PENDING-050", 店A, {
  ...変更つき("050", "M0604-050", "DP-M0604-050", ["経理払い出し待ち"], "経理払い出し待ち", "履歴の変更日時はDBで読まず、買取詳細のステータス変更履歴の最新の行（年/月/日 時:分:秒）から控えた"),
  控え: { 受注: "〔店頭買取受注ID-M0604-050〕", 査定ID: "〔査定ID-M0604-050〕", 履歴変更日時: "〔履歴変更日時-M0604-050〕" },
});
defineOrderSeed("S-M06-04-CBSTOCKEDABORT-056", 店A, 変更つき("056", "M0604-CB056-A", "M0604-CB056-B", ["入庫済み"], "入庫済み"));
defineOrderSeed("S-M06-04-CBSTOCKEDABORT-057", 店A, 変更つき("057", "M0604-CB057-A", "M0604-CB057-B", ["入庫済み"], "入庫済み"));
defineOrderSeed("S-M06-04-CBSTOCKEDABORT-058", 店A, 変更つき("058", "M0604-CB058-A", "M0604-CB058-B", ["入庫済み"], "入庫済み"));
defineOrderSeed("S-M06-04-CBSTOCKEDBTN-059", 店A, 変更つき("059", "M0604-CB059-A", "M0604-CB059-B", ["入庫済み"], "入庫済み"));
defineOrderSeed("S-M06-04-CBACCTOCANCEL-062", 店A, 変更つき("062", "M0604-CB062-A", "M0604-CB062-B", ["経理払い出し待ち"], "経理払い出し待ち", "決め打ちの買取成立日2027-03-06 10:00:00はDBでしか入らないので入れていない（買取成立日は空のまま。ケースが見るのはステータスと買取キャンセル日）"));
defineOrderSeed("S-M06-04-CBACCTOADMIN-063", 店A, 変更つき("063", "M0604-CB063-A", "M0604-CB063-B", ["買取成立", "経理払い出し待ち"], "経理払い出し待ち", 成立日つき));
defineOrderSeed("S-M06-04-CBACCTOASSESS-064", 店A, 変更つき("064", "M0604-CB064-A", "M0604-CB064-B", ["経理払い出し待ち"], "経理払い出し待ち"));
defineOrderSeed("S-M06-04-CBSUCCESSBTN-068", 店A, 変更つき("068", "M0604-CB068-A", "M0604-CB068-B", ["買取成立"], "買取成立"));
defineOrderSeed("S-M06-04-CBCANCELTOADMIN-070", 店A, 変更つき("070", "M0604-CB070-A", "M0604-CB070-B", ["買取成立", "買取キャンセル"], "買取キャンセル", 成立日つき));
