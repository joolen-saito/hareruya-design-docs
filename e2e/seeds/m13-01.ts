/**
 * M13-01 イベント一覧 のシード（画面操作）。正本: cases/M13-01_seed_data.tsv
 * - 管理者: 東京店だけに編集権限を持つ。権限は M13-02 と同じ「店舗オーナー」で代える。
 * - 店舗: 東京店を使う。大阪店・名古屋店は手元のDBに同名の店舗が複数あり、画面の選択肢でどれか決められないので使わない
 *   （それを使うケースは実装しない。フィルタのシードの大阪店・名古屋店のイベントは東京店で代えた。注記に残す）。
 * - イベント名・検索語には実行の印を付ける（rc。検索語とイベント名の同じ語は同じ印の値になる）。
 *   シード表の「あれば削除」は、今回の実行の印つきの値なので前の実行の分は無く、行わない。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { EventInput, openEventCreate, registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";
import { 余りを削除する, 日程を足す, 月次イベント } from "../pages/admin/m13_01_event_list";

export const M1301_ADMIN: Account = { loginId: "m1301_admin", password: "Passw0rd!M1301" };

defineSeed("S-M13-01-ADM", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    void notes;
    await ensureTenant(page, { 店名: "東京店", 店名カナ: "トウキョウテン", 店名英語: "Tokyo", 支店URL: "m1301tokyo", 店名略称3文字: "TKY", ショップ名略称: "東京店" }, issue);
    await ensureMember(page, {
      名前: "M13-01試験管理者", 所属店舗: "東京店", ログインID: M1301_ADMIN.loginId, メールアドレス: "m1301_admin@example.test",
      パスワード: M1301_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "東京店", 編集可能店舗: ["東京店"],
    });
  });
});

defineSeed("S-M13-01-MASTER", { needs: ["S-M13-01-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, M1301_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const form = await openEventCreate(page);
    const 求める: [string, string[], string[]][] = [
      ["店舗", ["東京店"], await form.options(form.店舗)],
      ["フォーマット", ["スタンダード", "モダン"], await form.options(form.フォーマット)],
      ["ルール適用度", ["一般", "競技"], await form.options(form.ルール適用度)],
    ];
    for (const [欄, 求める選択肢, ある] of 求める) {
      const 無い = 求める選択肢.filter((x) => !ある.includes(x));
      if (無い.length) issue(`イベント登録画面の${欄}に、シード表の選択肢「${無い.join("」「")}」が無い`);
    }
    issue("大阪店・名古屋店は手元のDBに同名の店舗が複数あるため、登録も確認もしていない（東京店だけを使う）");
  });
});

/** 東京店の管理者で、イベントを登録して番号を返す。日程があれば足す */
async function 登録(browser: import("@playwright/test").Browser, items: { 名日: string; 名英: string; 日程?: string[]; over?: EventInput }[]): Promise<string[]> {
  const ids: string[] = [];
  await withAdminSession(browser, M1301_ADMIN, async (page) => {
    for (const it of items) {
      const id = await registerEvent(page, 月次イベント(it.名日, it.名英, it.over));
      for (const d of it.日程 ?? []) await 日程を足す(page, id, d);
      ids.push(id);
    }
  });
  return ids;
}
const en = (s: string) => `${s} ${RUN_MARK}`;

defineSeed("S-M13-01-SEARCH", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const [id] = await 登録(browser, [{ 名日: rc("M13-01通常イベント"), 名英: en("M13-01 Normal Event") }]);
  notes.set("〔イベントID-M1301-共有-SEARCH〕", id);
});

defineSeed("S-M13-01-DATE", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const k = rc("開催日境界");
  const 日時 = ["2026-08-09 23:59", "2026-08-10 00:00", "2026-08-10 23:59", "2026-08-11 00:00"];
  const ids = await 登録(browser, ["A", "B", "C", "D"].map((x, i) => ({ 名日: `${k}${x}`, 名英: en(`M1301 DATE ${x}`), 日程: [日時[i]] })));
  ["A", "B", "C", "D"].forEach((x, i) => notes.set(`〔イベントID-M1301-共有-DATE-${x}〕`, ids[i]));
});

// 大阪店・名古屋店のイベント（F・G）は東京店で代える（店舗の件を参照）。009・010 はこの2件を確かめない
defineSeed("S-M13-01-FILTER", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const [a, b, c, d, e, f, g] = await 登録(browser, [
    { 名日: `${rc("形式確認")}A`, 名英: en("M1301 FILTER A") },
    { 名日: `${rc("形式確認")}B`, 名英: en("M1301 FILTER B"), over: { フォーマット: ["モダン"] } },
    { 名日: `${rc("ルール確認")}C`, 名英: en("M1301 FILTER C"), over: { ルール適用度: "競技" } },
    { 名日: `${rc("ルール確認")}D`, 名英: en("M1301 FILTER D") },
    { 名日: `${rc("店舗複数確認")}E`, 名英: en("M1301 FILTER E") },
    { 名日: `${rc("店舗複数確認")}F`, 名英: en("M1301 FILTER F") },
    { 名日: `${rc("店舗複数確認")}G`, 名英: en("M1301 FILTER G") },
  ]);
  [a, b, c, d, e, f, g].forEach((id, i) => notes.set(`〔イベントID-M1301-共有-FILTER-${"ABCDEFG"[i]}〕`, id));
});

defineSeed("S-M13-01-SORT", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  // 検索語「SORT」は英語名に含める（印つき）。登録の順（い→あ→う）でイベントIDが大きくなる
  const k = rc("SORT");
  const ids = await 登録(browser, [
    { 名日: `い大会-${RUN_MARK}`, 名英: `${k} A` },
    { 名日: `あ大会-${RUN_MARK}`, 名英: `${k} B` },
    { 名日: `う大会-${RUN_MARK}`, 名英: `${k} C` },
  ]);
  ["A", "B", "C"].forEach((x, i) => notes.set(`〔イベントID-M1301-共有-SORT-${x}〕`, ids[i]));
});

const ページ語 = () => rc("ページ対象");
async function ページ対象10件(browser: import("@playwright/test").Browser): Promise<string[]> {
  return 登録(browser, Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { 名日: `${ページ語()}${n}`, 名英: en(`M1301 PAGING ${n}`) };
  }));
}
defineSeed("S-M13-01-PAGING-COMMON", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  notes.set("〔イベントID-M1301-共有-PAGING〕", (await ページ対象10件(browser)).join(","));
});
function 共通以外を消して1件(seedId: string, 番号: string): void {
  defineSeed(seedId, { needs: ["S-M13-01-PAGING-COMMON"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1301_ADMIN, (page) => 余りを削除する(page, ページ語(), notes.get("〔イベントID-M1301-共有-PAGING〕").split(",")));
    const [id] = await 登録(browser, [{ 名日: `${ページ語()}${番号}`, 名英: en(`M1301 PAGING ${番号}`) }]);
    notes.set(`〔イベントID-M1301-${番号}〕`, id);
  });
}
共通以外を消して1件("S-M13-01-PAGING-017", "017");
共通以外を消して1件("S-M13-01-PAGING-019", "019");
// 024: 本シードのイベントを、共通の10件より先に登録する（IDが11件の中で最小）。共通の10件は登録し直して控え直す
defineSeed("S-M13-01-PAGING-024", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1301_ADMIN, (page) => 余りを削除する(page, ページ語(), []));
  const [id] = await 登録(browser, [{ 名日: `${ページ語()}024`, 名英: en("M1301 PAGING 024") }]);
  notes.set("〔イベントID-M1301-024〕", id);
  // 共通の10件は登録し直す。控えた番号は取り違え防止のため書き直せないので、共有の控えはそのまま残す（ケース024は使わない）
  await ページ対象10件(browser);
});

defineSeed("S-M13-01-DISPLAY", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const [id] = await 登録(browser, [{ 名日: rc("表示確認大会"), 名英: en("Display Event"), 日程: ["2026-09-02 10:00", "2026-09-01 09:00"] }]);
  notes.set("〔イベントID-M1301-共有-DISPLAY〕", id);
});

// B（権限外）は大阪店でなく、東京店の管理者が編集権限を持たない別の店舗（店舗B）のイベントで代える（027〜029・031・035 は B を使わない）
defineSeed("S-M13-01-DELETE-READ", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes, seed }) => {
  const [a, c] = await 登録(browser, [
    { 名日: rc("権限内編集確認"), 名英: en("M1301 DELETE A") },
    { 名日: rc("日程登録済削除確認"), 名英: en("M1301 DELETE C"), 日程: ["2026-09-10 10:00"] },
  ]);
  let b = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureTenant(page, { 店名: "店舗B", 店名カナ: "テンポビー", 店名英語: "Shop B", 支店URL: "m1302b", 店名略称3文字: "テB", ショップ名略称: "店舗B" }, (m) => reportSeedIssue(seed.シードID, m));
    await ensureMember(page, {
      名前: "M13-02 店舗B管理者", 所属店舗: "店舗B", ログインID: "m1302_admin_b", メールアドレス: "m1302_admin_b@example.test",
      パスワード: "Passw0rd!M1302B", 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗B", 編集可能店舗: ["店舗B"],
    });
  });
  await withAdminSession(browser, { loginId: "m1302_admin_b", password: "Passw0rd!M1302B" }, async (page) => {
    b = await registerEvent(page, 月次イベント(rc("権限外削除確認"), en("M1301 DELETE B"), { 店舗: "店舗B" }));
  });
  notes.set("〔イベントID-M1301-共有-DELETE-A〕", a);
  notes.set("〔イベントID-M1301-共有-DELETE-B〕", b);
  notes.set("〔イベントID-M1301-共有-DELETE-C〕", c);
});

function 単独1件(seedId: string, label: string, 語: string, 英: string): void {
  defineSeed(seedId, { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
    const [id] = await 登録(browser, [{ 名日: rc(語), 名英: en(英) }]);
    notes.set(label, id);
  });
}
単独1件("S-M13-01-DELETE-030", "〔イベントID-M1301-030〕", "削除実行確認", "M1301 DELETE 030");
単独1件("S-M13-01-DELETE-031", "〔イベントID-M1301-031〕", "削除遷移確認", "M1301 DELETE 031");
単独1件("S-M13-01-RESETCOND-040", "〔イベントID-M1301-040〕", "M1301-040-DISCARD", "M1301 RESET 040");
単独1件("S-M13-01-RESETCOUNT-041", "〔イベントID-M1301-041〕", "M1301-041-DISCARD", "M1301 RESET 041");

defineSeed("S-M13-01-RESETPAGE-046", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const ids = await 登録(browser, Array.from({ length: 11 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { 名日: `${rc("M1301-046")}-${n}`, 名英: en(`M1301-046-EN-${n}`) };
  }));
  notes.set("〔イベントID-M1301-046A〕", ids[0]);
});

defineSeed("S-M13-01-PAGEKEEP-047", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes }) => {
  const ids = await 登録(browser, Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { 名日: `${rc("M1301-047")}-${n}`, 名英: en(`M1301-047-EN-${n}`) };
  }));
  notes.set("〔イベントID-M1301-047A〕", ids[0]);
  notes.set("〔イベントID-M1301-047B〕", ids[1]);
});
