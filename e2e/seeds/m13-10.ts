/**
 * M13-10 イベント申込詳細・編集のシード（画面操作）。正本: cases/M13-10_seed_data.tsv
 *
 * - 店舗A・店舗B（S-M13-10-MASTER）: 店舗登録画面の店名「店舗A」「店舗B」の店舗（M13-02・M13-12 と同じ店舗。あれば使う）。
 *   フォーマット「スタンダード」はイベント登録画面の選択肢にあることを確かめる。支払方法「管理画面登録」と申込状況6種は、
 *   イベント申込詳細・編集画面にだけ出る値なので、ケースの画面で確かめる（022 は6種を選ぶ）。DB へは書かない。
 * - 管理者（ADM-A・ADM-B・ADM-DPA）: 管理者ID 913101 などは画面では決められないので、画面が振る番号のまま使う。
 *   権限は「モールオペレーター」で代える（「店舗オーナー」は所属店舗の行しか見えず、ADM-B が店舗Aの申込を開けない。M13-11 の記録 2026-11-09）。
 *   編集可能店舗はシード表のとおり（ADM-A・ADM-DPA は店舗Aだけ、ADM-B は店舗Bだけ）。
 * - 申込の会員: シード表は申込ごとにフロントの会員登録で会員を作ると定めるが、開発環境では本登録のメールを読めない。
 *   E2E_MEMBER_NAMES の会員（会員登録済み）を使い、与えなければ試験用の会員2人（seeds/members.ts。local だけ登録できる）を使う。
 *   日程はケースごとに作るので、同じ会員を別のケースの申込に使っても重ならない。プレイヤー検索にはその会員の氏名を入れる。
 * - 画面で代えられない DB の設定（支払番号・支払会員を別の会員にする・チーム人数・会場名）は行わない。支払会員は、
 *   画面の登録で決まる参加者の会員のままにし、〔支払会員ID〕にはその会員の会員IDを控える（シードの問題として報告に出す）。
 * - 申込履歴IDは画面に出ないので、DB の参照（SELECT）で控える（F07-04 の前例。依頼者決定 2026-11-03）。
 * - 未登録のID（申込ID 9131005・9131039、プレイヤーID 9131026・9131027、申込状況ID 9131030・9131031）は、
 *   DB での削除を行わず、確かめもしない（F07-03 の036 の前例）。登録されていれば、ケースの期待結果が満たされず不合格に出る。
 * - 決め打ちの識別の値（イベント名・QK の会員のメールアドレスと名）には実行の印を付ける（rc）。
 * - チーム人数: アプリにチーム人数を持つ項目が無い（イベントのチーム戦の印だけ）。「チーム人数N人」は設定できないので、行わない。
 *   既存の参加者が複数のシード（DATA-004・KEEPSWAP-042・CBKEEPALL-044・CBREMOVEONLY-045）は、1人目を画面で申込み、2人目以降を
 *   実行の印つきの申込にだけ DB で足す（db/m13_10.ts の 申込に参加者を足す。依頼者の承認 2026-11-10）。
 * - 作らないシード（ケースを書かない）: DATA-002（会員・プレイヤーを削除済みにする。共有の会員に触れる）、DATA-019（検索結果11人。会員11人が要る）、
 *   GF-DATA-038（会員の氏名・プレイヤー名(英)を指定の値で作れない）。
 * - S-M13-02-QK-ADM・QK-MASTERS は seeds/m13-02-qk.ts（M13-13 の担当が書いたもの）をそのまま使う。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, MEMBER_NAMES, SETUP_ADMIN } from "../config/env";
import { 申込に参加者を足す, 申込の申込履歴ID } from "../db/m13_10";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { openEventCreate, registerEvent } from "../pages/admin/event";
import { プレイヤーIDを読んで申込する, 会員IDを氏名から, 何も変えずに登録する } from "../pages/admin/m13_10_entry_edit";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";
import { FrontMember, registerFrontMember } from "../pages/front/member_entry";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";
import { entryMemberNames } from "./members";
import { customerStateByEmail } from "../pages/admin/customer";
import { 管理画面で本会員にする, 管理画面で本会員にした注記, 本登録のメールを読める } from "../pages/admin/member_activate";

export const M1310_ADMIN_A: Account = { loginId: "m1310_admin_a", password: "Passw0rd!M1310A" };
export const M1310_ADMIN_B: Account = { loginId: "m1310_admin_b", password: "Passw0rd!M1310B" };
export const M1310_ADMIN_DPA: Account = { loginId: "m1310_dp_admin_a", password: "Passw0rd!M1310DP" };

// ---- 店舗・マスタ・管理者 ----

const 店 = (n: string, kana: string, eng: string, url: string, ryaku: string) => ({ 店名: `店舗${n}`, 店名カナ: kana, 店名英語: eng, 支店URL: url, 店名略称3文字: ryaku, ショップ名略称: `店舗${n}` });

defineSeed("S-M13-10-MASTER", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔店舗ID-M1310-共有A〕", await ensureTenant(page, 店("A", "テンポエー", "Shop A", "m1302a", "テA"), issue));
    notes.set("〔店舗ID-M1310-共有B〕", await ensureTenant(page, 店("B", "テンポビー", "Shop B", "m1302b", "テB"), issue));
    const form = await openEventCreate(page);
    const have = await form.options(form.フォーマット);
    if (!have.includes("スタンダード")) throw new Error(`${seed.シードID}: イベント登録画面のフォーマットに「スタンダード」が無い（ある選択肢: ${have.join("、")}）`);
  });
  issue("フォーマット「スタンダード」はイベント登録画面の選択肢にあることを確かめた。支払方法「管理画面登録」・申込状況6種はイベント申込詳細・編集画面にだけ出るので、ケースの画面で確かめる（DB へは書かない）");
});

type 管理者 = { 名前: string; account: Account; 店舗: "店舗A" | "店舗B"; メール: string };

function defineAdminSeed(seedId: string, v: 管理者): void {
  defineSeed(seedId, { needs: ["S-M13-10-MASTER"] }, async ({ browser, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await ensureMember(page, {
        名前: v.名前, 所属店舗: v.店舗, ログインID: v.account.loginId, メールアドレス: v.メール, パスワード: v.account.password,
        権限: "モールオペレーター", デフォルト検索表示店舗: v.店舗, 編集可能店舗: [v.店舗],
      });
    });
    // ログインでき（稼働中・ロックされていない）、イベント管理の画面を開けること
    await withAdminSession(browser, v.account, async (page) => { page.setDefaultTimeout(120_000); await openEventCreate(page); });
    reportSeedIssue(seed.シードID, `管理者IDは画面が振る番号のまま。権限は「モールオペレーター」（編集可能店舗は${v.店舗}だけ）で代えた（「店舗オーナー」は所属店舗の申込しか見えない）`);
  });
}
defineAdminSeed("S-M13-10-ADM-A", { 名前: "M13-10店舗A管理者", account: M1310_ADMIN_A, 店舗: "店舗A", メール: "m1310_admin_a@example.test" });
defineAdminSeed("S-M13-10-ADM-B", { 名前: "M13-10店舗B管理者", account: M1310_ADMIN_B, 店舗: "店舗B", メール: "m1310_admin_b@example.test" });
defineAdminSeed("S-M13-10-ADM-DPA", { 名前: "M13-10追加ケース店舗A管理者", account: M1310_ADMIN_DPA, 店舗: "店舗A", メール: "m1310_dp_admin_a@example.test" });

// ---- イベント・日程・申込 ----

/** イベント名(日)（印つき）。ケースは控えた番号で引くので、名前そのものは見ない */
export const イベント名 = (n: string) => rc(`M1310-${n}イベント`);

/** イベントと日程（2026-09-10 10:00・公開）を登録する。[イベントID, 日程ID] */
async function イベントと日程を登録する(browser: Browser, account: Account, v: { 名日: string; 名英: string; 店舗: string; 参加費?: string }): Promise<[string, string]> {
  return withAdminSession(browser, account, async (page) => {
    page.setDefaultTimeout(120_000);
    const id = await registerEvent(page, {
      イベント名日: v.名日, イベント名英: v.名英, 店舗: v.店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: v.参加費 ?? "0",
    });
    const d = await registerSchedule(page, id, {
      開始時間: "2026-09-10 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false, 公開状態: "公開",
      ...(v.参加費 ? { 参加費: v.参加費 } : {}),
    });
    return [id, d];
  });
}

async function 会員IDを読む(browser: Browser, 氏名: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを氏名から(page, 氏名));
}

async function 申込する(browser: Browser, account: Account, 名日: string, 日程ID: string, 氏名: string): Promise<{ プレイヤーID: string; 申込ID: string }> {
  return withAdminSession(browser, account, async (page) => {
    page.setDefaultTimeout(120_000);
    const r = await プレイヤーIDを読んで申込する(page, 名日, 日程ID, 氏名, true);
    return { プレイヤーID: r.プレイヤーID, 申込ID: r.申込ID! };
  });
}

/** 申込の申込履歴を DB の参照で控える。件数がシード表と違えば落とす */
function 履歴IDを控える(notes: { set: (l: string, v: string) => void }, 申込ID: string, labels: string[]): void {
  const ids = 申込の申込履歴ID(申込ID);
  if (ids.length !== labels.length) throw new Error(`申込 ${申込ID} の申込履歴が ${ids.length} 件（シード表では ${labels.length} 件）`);
  labels.forEach((l, i) => notes.set(l, ids[i]));
}

type 申込シード = {
  n: string;
  /** 参加費（シード表が定めるときだけ） */
  参加費?: string;
  /** 申込履歴を2件にする（何も変えずに1回登録する）。控える呼び名の末尾 A・B */
  履歴2件?: boolean;
  /** 申込履歴（登録時の1件）を控える */
  履歴1件?: boolean;
  /** 支払会員IDを控える（シード表が支払会員を作ると定めるもの） */
  支払会員?: boolean;
  /** シードの問題として報告する、画面で代えなかった DB の設定 */
  DB: string[];
  account?: Account;
  needs?: string;
};

/**
 * 店舗Aのイベントと日程を登録し、会員（1人目）で申込を1件登録して、イベントID・日程ID・申込ID・プレイヤーID・会員IDを控える。
 */
function defineEntrySeed(seedId: string, v: 申込シード): void {
  const needs = v.needs ?? "S-M13-10-ADM-A";
  defineSeed(seedId, { needs: [needs] }, async ({ browser, notes, seed }) => {
    const n = v.n; const account = v.account ?? M1310_ADMIN_A;
    const [氏名] = await entryMemberNames(browser, 1);
    const 名日 = イベント名(n);
    const [e, d] = await イベントと日程を登録する(browser, account, { 名日, 名英: `M1310-${n} Event`, 店舗: "店舗A", 参加費: v.参加費 });
    notes.set(`〔イベントID-M1310-${n}〕`, e);
    notes.set(`〔イベント日程ID-M1310-${n}〕`, d);
    const 会員ID = await 会員IDを読む(browser, 氏名);
    notes.set(`〔会員ID-M1310-${n}〕`, 会員ID);
    const r = await 申込する(browser, account, 名日, d, 氏名);
    notes.set(`〔プレイヤーID-M1310-${n}〕`, r.プレイヤーID);
    notes.set(`〔イベント申込ID-M1310-${n}〕`, r.申込ID);
    if (v.支払会員 !== false) notes.set(`〔支払会員ID-M1310-${n}〕`, 会員ID);
    if (v.履歴2件) {
      await withAdminSession(browser, account, (page) => 何も変えずに登録する(page, r.申込ID));
      履歴IDを控える(notes, r.申込ID, [`〔申込履歴ID-M1310-${n}A〕`, `〔申込履歴ID-M1310-${n}B〕`]);
    }
    if (v.履歴1件) 履歴IDを控える(notes, r.申込ID, [`〔申込履歴ID-M1310-${n}A〕`]);
    reportSeedIssue(seed.シードID, `参加者の会員は、シード表の「参加者姓${n}」の会員を作らず、会員登録済みの会員「${氏名}」で代えた（開発環境では会員登録の本登録メールを読めない）`);
    if (v.DB.length) reportSeedIssue(seed.シードID, `画面で代えられない DB の設定（${v.DB.join("・")}）は行っていない${v.支払会員 !== false ? "。支払会員は参加者の会員のままで、〔支払会員ID〕にはその会員の会員IDを控えた" : ""}`);
  });
}

const 支払 = (n: string) => [`支払番号「PAY-100-${n}」`, "支払会員を別の会員にする"];
defineEntrySeed("S-M13-10-DATA-007", { n: "007", 参加費: "3000", DB: [...支払("007"), "チーム人数「2」"] });
defineEntrySeed("S-M13-10-DATA-009", { n: "009", 参加費: "3000", DB: 支払("009") });
defineEntrySeed("S-M13-10-DATA-013", { n: "013", DB: [...支払("013"), "チーム人数「2」"] });
defineEntrySeed("S-M13-10-DATA-020", { n: "020", DB: 支払("020") });
defineEntrySeed("S-M13-10-DATA-021", { n: "021", DB: 支払("021") });
defineEntrySeed("S-M13-10-DATA-022", { n: "022", DB: 支払("022") });
defineEntrySeed("S-M13-10-DATA-023", { n: "023", DB: 支払("023") });
defineEntrySeed("S-M13-10-DATA-025", { n: "025", 履歴2件: true, DB: 支払("025") });
defineEntrySeed("S-M13-10-DATA-026", { n: "026", 履歴2件: true, DB: [...支払("026"), "プレイヤーID 9131026 を削除して未登録にする"] });
defineEntrySeed("S-M13-10-DATA-027", { n: "027", DB: [...支払("027"), "プレイヤーID 9131027 を削除して未登録にする"] });
defineEntrySeed("S-M13-10-DATA-030", { n: "030", 履歴2件: true, DB: [...支払("030"), "申込状況ID 9131030 を未登録にする"] });
defineEntrySeed("S-M13-10-DATA-031", { n: "031", DB: [...支払("031"), "申込状況ID 9131031 を未登録にする"] });
defineEntrySeed("S-M13-10-DATA-032", { n: "032", 履歴2件: true, DB: 支払("032") });
defineEntrySeed("S-M13-10-DATA-033", { n: "033", 履歴2件: true, DB: 支払("033") });
defineEntrySeed("S-M13-10-GF-DATA-037", { n: "037", DB: [...支払("037"), "チーム人数「2」", "会場名「M1310-037-会場名」（会場の項目は設計書で無くなった。設計書 L0079）"] });
defineEntrySeed("S-M13-10-GF-DATA-039", { n: "039", DB: [...支払("039"), "申込ID 9131039 を削除して未登録にする"] });
defineEntrySeed("S-M13-10-HISTTWICE-043", { n: "043", 履歴1件: true, 支払会員: false, DB: [], account: M1310_ADMIN_DPA, needs: "S-M13-10-ADM-DPA" });

defineSeed("S-M13-10-DATA-005", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "イベント申込ID 9131005 は削除も確認もしていない（シード表の投入方法は DB での削除。E2E は DB を書き換えない）。登録されていれば、ケースの期待結果（404）が満たされず不合格に出る");
});

// 008: 店舗Aの申込（更新の対象）と店舗Bの申込（編集画面を開く）
defineSeed("S-M13-10-DATA-008", { needs: ["S-M13-10-ADM-A", "S-M13-10-ADM-B"] }, async ({ browser, notes, seed }) => {
  const [氏名A, 氏名B] = await entryMemberNames(browser, 2);
  const 名A = イベント名("008"); const 名B = rc("M1310-008店舗Bイベント");
  const [ea, da] = await イベントと日程を登録する(browser, M1310_ADMIN_A, { 名日: 名A, 名英: "M1310-008 Event", 店舗: "店舗A" });
  notes.set("〔店舗AイベントID-M1310-008〕", ea);
  notes.set("〔店舗Aイベント日程ID-M1310-008〕", da);
  notes.set("〔店舗A会員ID-M1310-008〕", await 会員IDを読む(browser, 氏名A));
  const a = await 申込する(browser, M1310_ADMIN_A, 名A, da, 氏名A);
  notes.set("〔店舗AプレイヤーID-M1310-008〕", a.プレイヤーID);
  notes.set("〔店舗Aイベント申込ID-M1310-008〕", a.申込ID);
  const [eb, db] = await イベントと日程を登録する(browser, M1310_ADMIN_B, { 名日: 名B, 名英: "M1310-008 Shop B Event", 店舗: "店舗B" });
  notes.set("〔店舗BイベントID-M1310-008〕", eb);
  notes.set("〔店舗Bイベント日程ID-M1310-008〕", db);
  notes.set("〔店舗B会員ID-M1310-008〕", await 会員IDを読む(browser, 氏名B));
  const b = await 申込する(browser, M1310_ADMIN_B, 名B, db, 氏名B);
  notes.set("〔店舗BプレイヤーID-M1310-008〕", b.プレイヤーID);
  notes.set("〔店舗Bイベント申込ID-M1310-008〕", b.申込ID);
  reportSeedIssue(seed.シードID, `店舗Aと店舗Bを編集できる管理者はシード表に無いので、店舗Aの申込は店舗Aの管理者、店舗Bの申込は店舗Bの管理者で登録した。参加者の会員は「${氏名A}」「${氏名B}」で代えた（会員を作らない）。支払番号「PAY-100-008」の DB の設定は行っていない`);
});

// 024: 更新前の参加者（1人目の会員）で申込し、検索用の会員（2人目）はプレイヤーIDだけ控える
defineSeed("S-M13-10-DATA-024", { needs: ["S-M13-10-ADM-A"] }, async ({ browser, notes, seed }) => {
  const [氏名1, 氏名2] = await entryMemberNames(browser, 2);
  const 名日 = イベント名("024");
  const [e, d] = await イベントと日程を登録する(browser, M1310_ADMIN_A, { 名日, 名英: "M1310-024 Event", 店舗: "店舗A" });
  notes.set("〔イベントID-M1310-024〕", e);
  notes.set("〔イベント日程ID-M1310-024〕", d);
  const 会員1 = await 会員IDを読む(browser, 氏名1);
  notes.set("〔更新前会員ID-M1310-024〕", 会員1);
  notes.set("〔支払会員ID-M1310-024〕", 会員1);
  notes.set("〔検索会員ID-M1310-024〕", await 会員IDを読む(browser, 氏名2));
  const r = await 申込する(browser, M1310_ADMIN_A, 名日, d, 氏名1);
  notes.set("〔更新前プレイヤーID-M1310-024〕", r.プレイヤーID);
  notes.set("〔イベント申込ID-M1310-024〕", r.申込ID);
  const s = await withAdminSession(browser, M1310_ADMIN_A, (page) => プレイヤーIDを読んで申込する(page, 名日, d, 氏名2, false));
  notes.set("〔検索プレイヤーID-M1310-024〕", s.プレイヤーID);
  reportSeedIssue(seed.シードID, `更新前の参加者は「${氏名1}」、検索用の会員（シード表の「佐藤会員姓一-024 検索名024」）は「${氏名2}」で代えた（会員を作らない）。画面で代えられない DB の設定（支払番号「PAY-100-024」・支払会員を別の会員にする・チーム人数「1」）は行っていない。支払会員は参加者の会員のままで、〔支払会員ID〕にはその会員の会員IDを控えた`);
});

/** 028・029: 編集中の申込（1人目の会員）と、同じ日程の別の申込（2人目の会員＝重複プレイヤー） */
function defineDupSeed(seedId: string, n: string, 履歴2件: boolean): void {
  defineSeed(seedId, { needs: ["S-M13-10-ADM-A"] }, async ({ browser, notes, seed }) => {
    const [氏名1, 氏名2] = await entryMemberNames(browser, 2);
    const 名日 = イベント名(n);
    const [e, d] = await イベントと日程を登録する(browser, M1310_ADMIN_A, { 名日, 名英: `M1310-${n} Event`, 店舗: "店舗A" });
    notes.set(`〔イベントID-M1310-${n}〕`, e);
    notes.set(`〔イベント日程ID-M1310-${n}〕`, d);
    notes.set(`〔編集中会員ID-M1310-${n}〕`, await 会員IDを読む(browser, 氏名1));
    const a = await 申込する(browser, M1310_ADMIN_A, 名日, d, 氏名1);
    notes.set(`〔編集中プレイヤーID-M1310-${n}〕`, a.プレイヤーID);
    notes.set(`〔編集中イベント申込ID-M1310-${n}〕`, a.申込ID);
    notes.set(`〔重複会員ID-M1310-${n}〕`, await 会員IDを読む(browser, 氏名2));
    const b = await 申込する(browser, M1310_ADMIN_A, 名日, d, 氏名2);
    notes.set(`〔重複プレイヤーID-M1310-${n}〕`, b.プレイヤーID);
    notes.set(`〔同日程イベント申込ID-M1310-${n}〕`, b.申込ID);
    if (履歴2件) {
      // シード表の「何も変えずに登録ボタンを1回押し」は、申込履歴を2件とする編集中の申込で行う
      await withAdminSession(browser, M1310_ADMIN_A, (page) => 何も変えずに登録する(page, a.申込ID));
      履歴IDを控える(notes, a.申込ID, [`〔申込履歴ID-M1310-${n}A〕`, `〔申込履歴ID-M1310-${n}B〕`]);
    }
    reportSeedIssue(seed.シードID, `編集中の申込の参加者は「${氏名1}」、同じ日程の別の申込の参加者（重複プレイヤー）は「${氏名2}」で代えた（会員を作らない）。支払番号「PAY-100-${n}」の DB の設定は行っていない${履歴2件 ? "。「何も変えずに登録ボタンを1回押す」は、申込履歴を2件とする編集中の申込で行った" : ""}`);
  });
}
defineDupSeed("S-M13-10-DATA-028", "028", true);
defineDupSeed("S-M13-10-DATA-029", "029", false);

// ---- 040（QK連携: マイイベント・デッキ登録の前後） ----

export const QK1310会員 = (x: "A" | "B") => ({
  姓: "試験", 名: rc(`QK1310-001${x}`), メール: `${rc(`qk1310-001${x.toLowerCase()}`)}@example.test`.toLowerCase(), パスワード: `QkPw1310001${x}!`,
});
export const QK1310イベント名 = () => rc("QK申込編集大会-1310-001");

defineSeed("S-M13-10-QK-ENTRY-040", { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, notes }) => {
  for (const x of ["A", "B"] as const) {
    const m = QK1310会員(x);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      await registerFrontMember(page, { 姓: m.姓, 名: m.名, セイ: "シケン", メイ: "キューケー", メール: m.メール, パスワード: m.パスワード });
    } finally {
      await context.close();
    }
  }
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    const id = await registerEvent(page, {
      イベント名日: QK1310イベント名(), イベント名英: "QK Edit 1310-001", 店舗: QK連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "500",
    });
    notes.set("〔イベントID-M1310-QK001〕", id);
    // 受付あり・デッキ登録ありは外し、オンライン受付ありはチェックを入れない。定員・参加費・公開状態は初期表示のまま
    const d = await registerSchedule(page, id, { 開始時間: "2030-10-22 10:00", 受付あり: false, デッキ登録あり: false });
    const a = QK1310会員("A");
    const r = await プレイヤーIDを読んで申込する(page, QK1310イベント名(), d, `${a.姓} ${a.名}`, true);
    notes.set("〔申込ID-M1310-QK001〕", r.申込ID!);
  });
});


// ---- 2人目以降の参加者・別の日程（002〜045 の追加ケース） ----

/** 3人目・4人目の試験用の会員（E2E_MEMBER_NAMES が無いときだけ使う。3人目は M13-07 と同じ会員） */
const 追加の会員: FrontMember[] = [
  { 姓: "試験会員", 名: "申込三", セイ: "シケンカイイン", メイ: "モウシコミサン", メール: "e2e-m1307-entry-3@example.test", パスワード: "Passw0rd!E2EEntry3" },
  { 姓: "試験会員", 名: "申込四", セイ: "シケンカイイン", メイ: "モウシコミヨン", メール: "e2e-m1310-entry-4@example.test", パスワード: "Passw0rd!E2EEntry4" },
];

/** 申込に使う会員の氏名（先頭から n 人。5人目以降は無い） */
export async function 申込の会員(browser: Browser, n: number): Promise<string[]> {
  if (MEMBER_NAMES.length || n <= 2) return entryMemberNames(browser, n);
  if (n > 4) throw new Error(`申込に会員が ${n} 人要る（このファイルで用意するのは4人まで）`);
  const names = await entryMemberNames(browser, 2);
  for (const m of 追加の会員.slice(0, n - 2)) {
    const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
    if (state === "仮会員") {
      if (本登録のメールを読める()) throw new Error(`試験用の会員 ${m.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
      await 管理画面で本会員にする(browser, m.メール);
      reportCurrentSeedIssue(`${管理画面で本会員にした注記}。会員 ${m.メール}（仮会員のまま残っていた）`);
    }
    if (state === null) {
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        const page = await context.newPage();
        page.setDefaultTimeout(60_000);
        await registerFrontMember(page, m);
      } finally {
        await context.close();
      }
      const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
      if (after !== "本会員") throw new Error(`試験用の会員 ${m.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
    }
  }
  return [...names, ...追加の会員.slice(0, n - 2).map((m) => `${m.姓} ${m.名}`)];
}

async function プレイヤーIDだけ読む(browser: Browser, account: Account, 名日: string, 日程ID: string, 氏名: string): Promise<string> {
  return withAdminSession(browser, account, async (page) => {
    page.setDefaultTimeout(120_000);
    return (await プレイヤーIDを読んで申込する(page, 名日, 日程ID, 氏名, false)).プレイヤーID;
  });
}

const 追加の注記 = "画面で代えられない DB の設定（チーム人数。アプリに項目が無い・支払番号・支払会員を別の会員にする）は行っていない";

/**
 * 複数の参加者の申込。1人目（会員1）は画面で申込み、2人目以降（会員2〜）は申込の参加者として DB で足す（実行の印つきの申込だけ）。
 * 控える: 〔イベント申込ID〕・〔参加者プレイヤーID-A〕（1人目）・〔参加者プレイヤーID-B〕（2人目）・〔参加者プレイヤーID-C〕（3人目）・
 * 〔追加プレイヤーID〕（足さずに検索で選ぶ会員。追加が有るときだけ）・申込履歴
 */
function defineMultiSeed(seedId: string, v: { n: string; 参加者: number; 追加検索: boolean; 履歴1件?: boolean; account: Account; needs: string }): void {
  defineSeed(seedId, { needs: [v.needs] }, async ({ browser, notes, seed }) => {
    const names = await 申込の会員(browser, v.参加者 + (v.追加検索 ? 1 : 0));
    const 名日 = イベント名(v.n);
    const [e, d] = await イベントと日程を登録する(browser, v.account, { 名日, 名英: `M1310-${v.n} Event`, 店舗: "店舗A" });
    notes.set(`〔イベントID-M1310-${v.n}〕`, e);
    notes.set(`〔イベント日程ID-M1310-${v.n}〕`, d);
    const r = await 申込する(browser, v.account, 名日, d, names[0]);
    notes.set(`〔イベント申込ID-M1310-${v.n}〕`, r.申込ID);
    notes.set(`〔参加者プレイヤーID-M1310-${v.n}A〕`, r.プレイヤーID);
    for (let i = 1; i < v.参加者; i++) {
      const pid = await プレイヤーIDだけ読む(browser, v.account, 名日, d, names[i]);
      申込に参加者を足す(r.申込ID, pid, i + 1, RUN_MARK);
      notes.set(`〔参加者プレイヤーID-M1310-${v.n}${"ABC"[i]}〕`, pid);
    }
    if (v.追加検索) notes.set(`〔追加プレイヤーID-M1310-${v.n}〕`, await プレイヤーIDだけ読む(browser, v.account, 名日, d, names[v.参加者]));
    if (v.履歴1件) 履歴IDを控える(notes, r.申込ID, [`〔申込履歴ID-M1310-${v.n}A〕`]);
    reportSeedIssue(seed.シードID, `参加者の会員は、シード表の姓の会員を作らず、会員登録済みの会員「${names.join("」「")}」で代えた（会員を作らない）。${追加の注記}${v.参加者 > 1 ? `。2人目以降の参加者は、DBで申込（実行の印つき）に足した` : ""}`);
  });
}

defineMultiSeed("S-M13-10-DATA-003", { n: "003", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-004", { n: "004", 参加者: 3, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-006", { n: "006", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-010", { n: "010", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-011", { n: "011", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-012", { n: "012", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-014", { n: "014", 参加者: 1, 追加検索: true, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-DATA-018", { n: "018", 参加者: 1, 追加検索: false, account: M1310_ADMIN_A, needs: "S-M13-10-ADM-A" });
defineMultiSeed("S-M13-10-KEEPSWAP-042", { n: "042", 参加者: 3, 追加検索: true, account: M1310_ADMIN_DPA, needs: "S-M13-10-ADM-DPA" });
defineMultiSeed("S-M13-10-CBKEEPALL-044", { n: "044", 参加者: 3, 追加検索: false, 履歴1件: true, account: M1310_ADMIN_DPA, needs: "S-M13-10-ADM-DPA" });
defineMultiSeed("S-M13-10-CBREMOVEONLY-045", { n: "045", 参加者: 3, 追加検索: false, 履歴1件: true, account: M1310_ADMIN_DPA, needs: "S-M13-10-ADM-DPA" });

// 017: 編集中の申込（会員1）と、同じ日程の別の申込（会員2＝重複選手）。028・029 と同じ作り
defineDupSeed("S-M13-10-DATA-017", "017", false);

// 041: 同じイベントの2つの日程。編集中の申込は日程X（会員1）、会員2は日程Yの別の申込にだけ登録
defineSeed("S-M13-10-OTHERDATE-041", { needs: ["S-M13-10-ADM-DPA"] }, async ({ browser, notes, seed }) => {
  const [氏名1, 氏名2] = await entryMemberNames(browser, 2);
  const 名日 = イベント名("041");
  const [e, x, y] = await withAdminSession(browser, M1310_ADMIN_DPA, async (page) => {
    page.setDefaultTimeout(120_000);
    const id = await registerEvent(page, { イベント名日: 名日, イベント名英: "M1310-041 Event", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0" });
    const dx = await registerSchedule(page, id, { 開始時間: "2026-09-10 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false, 公開状態: "公開" });
    const dy = await registerSchedule(page, id, { 開始時間: "2026-09-11 10:00", 受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false, 公開状態: "公開" });
    return [id, dx, dy];
  });
  notes.set("〔イベントID-M1310-041〕", e);
  notes.set("〔イベント日程ID-M1310-041X〕", x);
  notes.set("〔イベント日程ID-M1310-041Y〕", y);
  const a = await 申込する(browser, M1310_ADMIN_DPA, 名日, x, 氏名1);
  notes.set("〔編集中イベント申込ID-M1310-041〕", a.申込ID);
  notes.set("〔編集中プレイヤーID-M1310-041〕", a.プレイヤーID);
  const b = await 申込する(browser, M1310_ADMIN_DPA, 名日, y, 氏名2);
  notes.set("〔別日程イベント申込ID-M1310-041〕", b.申込ID);
  notes.set("〔別日程プレイヤーID-M1310-041〕", b.プレイヤーID);
  reportSeedIssue(seed.シードID, `編集中の申込の参加者は「${氏名1}」、別の日程の申込の参加者（別日程プレイヤー）は「${氏名2}」で代えた（会員を作らない）。${追加の注記}`);
});
