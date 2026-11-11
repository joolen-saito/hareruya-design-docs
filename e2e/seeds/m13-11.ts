/**
 * M13-11 イベント申込登録（検索入力）のシード（画面操作）。正本: cases/M13-11_seed_data.tsv
 * - 店舗A・B・C: M13-02 と同じ店名。あればそれを使う。
 * - 管理者: m1311_admin_a は店舗A・店舗Bに編集権限（権限は「モールオペレーター」で代える。下の S-M13-11-ADM-A）。店舗Cのイベントは店舗Cの管理者 m1311_admin_c で登録する。
 * - 日程: 開催日はシード表のとおり（2099年）。オンライン受付は開始時間より前の日時で足す。
 * - イベント名・検索語には実行の印を付ける（rc）。
 * - 秒の指定・略称の指定が要るシード（007〜009・013）はDBでの準備が要るので作らない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { EventInput, registerEvent } from "../pages/admin/event";
import { changeMemberAuthority, ensureMember, findMemberId } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { ensureTenant } from "../pages/admin/tenant";

export const M1311_ADMIN: Account = { loginId: "m1311_admin_a", password: "Passw0rd!M1311A" };
export const M1311_L_ADMIN: Account = { loginId: "m1311_l_admin", password: "Passw0rd!M1311L" };

const 店 = (n: string, kana: string, eng: string, url: string, ryaku: string) => ({ 店名: `店舗${n}`, 店名カナ: kana, 店名英語: eng, 支店URL: url, 店名略称3文字: ryaku, ショップ名略称: `店舗${n}` });

defineSeed("S-M13-11-STORES", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1311-共有A〕", await ensureTenant(page, 店("A", "テンポエー", "Shop A", "m1302a", "テA"), issue));
    notes.set("〔店舗ID-M1311-共有B〕", await ensureTenant(page, 店("B", "テンポビー", "Shop B", "m1302b", "テB"), issue));
    notes.set("〔店舗ID-M1311-共有C〕", await ensureTenant(page, 店("C", "テンポシー", "Shop C", "m1311c", "テC"), issue));
  });
});

// 権限は「モールオペレーター」で代える。「店舗オーナー」は所属店舗の店舗しか見えず（DBの行の制限）、
// 編集可能店舗に店舗Bがあってもイベント登録・検索の店舗の選択肢に店舗Bが出ない（2026-11-09 に確かめた）。
const M1311_ADMIN_権限 = "モールオペレーター";
defineSeed("S-M13-11-ADM-A", { needs: ["S-M13-11-STORES"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 名前 = "M13-11試験管理者";
    // 前に「店舗オーナー」で登録したメンバーが残っていれば、権限だけ画面で変える
    const found = await findMemberId(page, 名前);
    if (found) await changeMemberAuthority(page, found, M1311_ADMIN_権限);
    notes.set("〔管理者ID-M1311-共有〕", await ensureMember(page, {
      名前, 所属店舗: "店舗A", ログインID: M1311_ADMIN.loginId, メールアドレス: "m1311_admin_a@example.test",
      パスワード: M1311_ADMIN.password, 権限: M1311_ADMIN_権限, デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A", "店舗B"],
    }));
  });
});

/** 店舗Cのイベントを登録する管理者（全権限の管理者の店舗の選択肢には店舗Cが無い）。店舗Cだけに編集権限 */
export const M1311_C_ADMIN: Account = { loginId: "m1311_admin_c", password: "Passw0rd!M1311C" };
async function 店舗C管理者を用意(browser: import("@playwright/test").Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-11店舗C管理者", 所属店舗: "店舗C", ログインID: M1311_C_ADMIN.loginId, メールアドレス: "m1311_admin_c@example.test",
      パスワード: M1311_C_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗C", 編集可能店舗: ["店舗C"],
    });
  });
}

const 開始日時 = (s: string) => s;
const オンライン = { 開始: "2098-01-01 10:00", 終了: "2098-12-31 10:00" };
const en = (s: string) => `${s} ${RUN_MARK}`;
type Ev = { 名日: string; 名英: string; 店舗?: string; 日程: { 開始: string; オンライン?: boolean }[]; over?: EventInput };

/** 店舗A・Bは試験管理者、店舗Cは店舗Cの管理者でイベントと日程を登録し、[イベントID, 日程ID[]] を返す */
async function 登録(browser: import("@playwright/test").Browser, items: Ev[]): Promise<[string, string[]][]> {
  const out: [string, string[]][] = [];
  for (const it of items) {
    const 店舗 = it.店舗 ?? "店舗A";
    if (店舗 === "店舗C") await 店舗C管理者を用意(browser);
    await withAdminSession(browser, 店舗 === "店舗C" ? M1311_C_ADMIN : M1311_ADMIN, async (page) => {
      const id = await registerEvent(page, {
        イベント名日: it.名日, イベント名英: it.名英, 店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0", ...it.over,
      });
      const 日程: string[] = [];
      for (const d of it.日程) {
        日程.push(await registerSchedule(page, id, {
          開始時間: 開始日時(d.開始), 受付あり: false, デッキ登録あり: false, ...(d.オンライン === false ? {} : { オンライン受付: オンライン }), 公開状態: "公開",
        }));
      }
      out.push([id, 日程]);
    });
  }
  return out;
}

defineSeed("S-M13-11-PAGING", { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
  const k = rc("ページング大会");
  const r = await 登録(browser, Array.from({ length: 11 }, (_, i) => ({ 名日: `${k}9${String(i + 1).padStart(2, "0")}`, 名英: en("Paging Tournament"), 日程: [{ 開始: "2099-05-01 10:00" }] })));
  r.forEach(([e, [d]], i) => {
    const n = String(i + 1).padStart(2, "0");
    notes.set(`〔イベントID-M1311-共有ページ${n}〕`, e);
    // シード表が控えると定めた日程IDは01・02・11だけ（途中は範囲の書き方）
    if (n === "01" || n === "02" || n === "11") notes.set(`〔日程ID-M1311-共有ページ${n}〕`, d);
  });
});

defineSeed("S-M13-11-GROUPED", { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
  // 旧（B）のイベントIDがA より小さい（先に登録する）
  const [b, a] = await 登録(browser, [
    { 名日: `${rc("並び順大会")}旧`, 名英: en("Ordering Old"), 日程: [{ 開始: "2099-04-01 10:00" }] },
    { 名日: rc("並び順大会"), 名英: "Ordering Tournament", 日程: [{ 開始: "2099-04-10 10:00" }, { 開始: "2099-04-11 10:00" }, { 開始: "2099-04-12 10:00" }], over: { フォーマット: ["スタンダード", "モダン"] } },
  ]);
  notes.set("〔イベントID-M1311-共有並びA〕", a[0]);
  a[1].forEach((d, i) => notes.set(`〔日程ID-M1311-共有並びA${i + 1}〕`, d));
  notes.set("〔イベントID-M1311-共有並びB〕", b[0]);
  notes.set("〔日程ID-M1311-共有並びB1〕", b[1][0]);
});

function 権限確認(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
    const k = rc("権限確認大会");
    const r = await 登録(browser, [
      { 名日: `${k}A`, 名英: en(`Permission A ${n}`), 店舗: "店舗A", 日程: [{ 開始: "2099-01-10 10:00" }] },
      { 名日: `${k}B`, 名英: en(`Permission B ${n}`), 店舗: "店舗B", 日程: [{ 開始: "2099-01-11 10:00" }] },
      { 名日: `${k}C`, 名英: en(`Permission C ${n}`), 店舗: "店舗C", 日程: [{ 開始: "2099-01-12 10:00" }] },
    ]);
    ["A", "B", "C"].forEach((x, i) => { notes.set(`〔イベントID-M1311-${n}${x}〕`, r[i][0]); notes.set(`〔日程ID-M1311-${n}${x}〕`, r[i][1][0]); });
  });
}
権限確認("S-M13-11-PERMISSION-EVENTS-002", "002");
権限確認("S-M13-11-PERMISSION-EVENTS-003", "003");

defineSeed("S-M13-11-COMBINATION-EVENTS-011", { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
  const r = await 登録(browser, [
    // 手順の検索語「結合対象」がイベント名に部分一致する関係を保つため、印は検索語の側に付ける（「結合対象-<印>大会」）
    { 名日: `${rc("結合対象")}大会`, 名英: en("Combo A"), 店舗: "店舗A", 日程: [{ 開始: "2099-08-15 10:00" }] },
    { 名日: `${rc("結合対象")}大会`, 名英: en("Combo B"), 店舗: "店舗B", 日程: [{ 開始: "2099-08-15 10:00" }] },
    { 名日: `${rc("比較対象")}大会`, 名英: en("Combo C"), 店舗: "店舗A", 日程: [{ 開始: "2099-08-15 10:00" }] },
    { 名日: `${rc("結合対象")}大会`, 名英: en("Combo D"), 店舗: "店舗A", 日程: [{ 開始: "2099-08-16 10:00" }] },
  ]);
  ["A", "B", "C", "D"].forEach((x, i) => { notes.set(`〔イベントID-M1311-011${x}〕`, r[i][0]); notes.set(`〔日程ID-M1311-011${x}〕`, r[i][1][0]); });
});

defineSeed("S-M13-11-ONLINE-EVENT-014", { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
  const [[e, [a, b]]] = await 登録(browser, [{ 名日: rc("受付判定大会"), 名英: en("Online Judge"), 日程: [{ 開始: "2099-09-01 10:00" }, { 開始: "2099-09-02 10:00", オンライン: false }] }]);
  notes.set("〔イベントID-M1311-014〕", e);
  notes.set("〔日程ID-M1311-014A〕", a);
  notes.set("〔日程ID-M1311-014B〕", b);
});

function 単一(seedId: string, label: string, dLabel: string, 語: string, 開始: string, 店舗: string = "店舗A"): void {
  defineSeed(seedId, { needs: ["S-M13-11-ADM-A"] }, async ({ browser, notes }) => {
    // イベント名(英)には検索語・イベント名を含めない（シード表の指定）
    const [[e, [d]]] = await 登録(browser, [{ 名日: rc(語), 名英: en(`Single Seed ${seedId.slice(-3)}`), 店舗, 日程: [{ 開始 }] }]);
    notes.set(label, e);
    notes.set(dLabel, d);
  });
}
単一("S-M13-11-TRANSITION-022", "〔イベントID-M1311-022〕", "〔日程ID-M1311-022〕", "遷移確認大会", "2099-12-01 10:00");
単一("S-M13-11-TRANSITION-023", "〔イベントID-M1311-023〕", "〔日程ID-M1311-023〕", "遷移確認大会", "2099-12-01 10:00");
単一("S-M13-11-NODECIDE-025", "〔イベントID-M1311-025〕", "〔日程ID-M1311-025〕", "決定非表示確認大会", "2099-12-01 10:00");
単一("S-M13-11-STOREC-026", "〔イベントID-M1311-026〕", "〔日程ID-M1311-026〕", "M1311-026大会", "2099-01-20 10:00", "店舗C");

defineSeed("S-M13-11-L-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔店舗ID-M1311-共有L〕", await ensureTenant(page, 店("A", "テンポエー", "Shop A", "m1302a", "テA"), (m) => reportSeedIssue(seed.シードID, m)));
  });
});
defineSeed("S-M13-11-L-ADM", { needs: ["S-M13-11-L-STORE"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔管理者ID-M1311-共有L〕", await ensureMember(page, {
      名前: "M13-11連携確認管理者", 所属店舗: "店舗A", ログインID: M1311_L_ADMIN.loginId, メールアドレス: "m1311_l_admin@example.test",
      パスワード: M1311_L_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗A", 編集可能店舗: ["店舗A"],
    }));
  });
});
defineSeed("S-M13-11-L-EVENT-024", { needs: ["S-M13-11-L-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1311_L_ADMIN, async (page) => {
    const id = await registerEvent(page, {
      イベント名日: rc("連携確認大会001"), イベント名英: "Link Check 001", 店舗: "店舗A", フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "2500",
      // オンライン受付ありで有料のときは支払方法が要る（シード表に書かれていない。画面の求めに従い代えた）
      支払方法: ["クレジットカード決済"],
    });
    const a = await registerSchedule(page, id, { 開始時間: "2099-12-01 10:00", 受付あり: false, デッキ登録あり: false, オンライン受付: オンライン, 公開状態: "公開" });
    const b = await registerSchedule(page, id, { 開始時間: "2099-12-02 14:30", 受付あり: false, デッキ登録あり: false, オンライン受付: オンライン, 公開状態: "公開" });
    notes.set("〔イベントID-M1311-024〕", id);
    notes.set("〔日程ID-M1311-024A〕", a);
    notes.set("〔日程ID-M1311-024B〕", b);
  });
});
