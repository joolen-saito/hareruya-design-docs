/**
 * M12-09 特集タグ編集CSVダウンロード(検索項目) のシードの作り方（画面操作）。正本: cases/M12-09_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で登録する。権限は、分析・集計管理を操作できる「システム管理者」（正本は権限の名前を定めない。M05 の試験管理者と同じ）。
 *   所属店舗・デフォルト検索表示店舗・編集可能店舗は本店（店舗ID 1）の店名。
 * - ブラウザセッション: 専用ブラウザプロファイルは、ケースごとの新しいブラウザの状態（保存された出力条件なし）で成り立つ。作るものは無い。
 * - フォーマット: フォーマット登録で A・B・C を登録する（あれば使う。共有可）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { seedsOf } from "../lib/catalog";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { ensureMember } from "../pages/admin/member";
import { ensureFormat } from "../pages/admin/m12_09_used_card";
import { DataSpec, arch, cb, defineDataSeed, fixed, dayOffset, old, oldArch } from "./m12-data";
import { デッキを一括削除する } from "../pages/admin/m12_deck_seed";

export const M1209_ADMIN: Account = { loginId: "m1209_admin", password: "Passw0rd!M1209" };

defineSeed("S-M12-09-ADM", async ({ browser }) => {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前: "M12-09試験管理者", 所属店舗: shop, ログインID: M1209_ADMIN.loginId, メールアドレス: "m1209_admin@example.test",
      パスワード: M1209_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
});

defineSeed("S-M12-09-FORMATS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const [k, 日, 英, 順] of [["A", "試験フォーマットA", "M1209 Format A", "9001"], ["B", "試験フォーマットB", "M1209 Format B", "9002"], ["C", "試験フォーマットC", "M1209 Format C", "9003"]]) {
      notes.set(`〔フォーマットID-M1209-共有${k}〕`, await ensureFormat(page, { 名日: 日, 名英: 英, 並び順: 順, メタ日数: "30" }, issue));
    }
  });
});

for (const id of seedsOf("M12-09").keys()) {
  if (/^S-M12-09-(CB)?SESSION-/.test(id)) defineSeed(id, async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });
}

// ---- 集計の対象になるカード・商品・デッキのシード ----

const FA = "試験フォーマットA", FB = "試験フォーマットB", FC = "試験フォーマットC";
const SPECS: Record<string, Omit<DataSpec, "prefix">> = {
  "S-M12-09-ONE-RESULT-008": {
    clear: [{ formats: [FA], range: { from: "2026/04/01", to: "2026/04/30" } }],
    cards: [{ keys: ["008"], def: old("008", "", { 略称: "T08" }) }],
    archetypes: [oldArch("008", "", FA)],
    decks: [{ key: "008", format: FA, archetype: "M1209試験アーキタイプ008", eventJ: "M1209試験イベント008", eventE: "M1209 Event 008", date: fixed("2026/04/15 00:00"), lines: [{ n: 1, card: 0, key: "008" }] }],
  },
  "S-M12-09-ONE-RESULT-011": {
    clear: [{ formats: [FA], range: { from: "2026/04/01", to: "2026/04/30" } }],
    cards: [{ keys: ["011"], def: old("011", "", { 略称: "T11" }) }],
    archetypes: [oldArch("011", "", FA)],
    decks: [{ key: "011", format: FA, archetype: "M1209試験アーキタイプ011", eventJ: "M1209試験イベント011", eventE: "M1209 Event 011", date: fixed("2026/04/15 00:00"), lines: [{ n: 1, card: 0, key: "011" }] }],
  },
  "S-M12-09-USED-012": {
    clear: [{ formats: [FB, FC] }],
    cards: [{ keys: ["012A"], def: old("012", "X", { 略称: "T12X" }) }, { keys: ["012B"], def: old("012", "Y", { 略称: "T12Y", 特殊タイプ: ["基本"], 商品番号: "P002" }) }],
    archetypes: [oldArch("012", "C", FC), oldArch("012", "B", FB)],
    decks: [
      { key: "012A", format: FC, archetype: "M1209試験アーキタイプ012 C", eventJ: "M1209試験イベント012 1", eventE: "M1209 Event 012 1", date: fixed("2026/06/15 00:00"), lines: [{ n: 4, card: 0, key: "012A" }, { n: 10, card: 1, key: "012B" }] },
      { key: "012B", format: FC, archetype: "M1209試験アーキタイプ012 C", eventJ: "M1209試験イベント012 2", eventE: "M1209 Event 012 2", date: fixed("2026/07/01 00:00"), lines: [{ n: 2, card: 0, key: "012C" }] },
      { key: "012C", format: FB, archetype: "M1209試験アーキタイプ012 B", eventJ: "M1209試験イベント012 3", eventE: "M1209 Event 012 3", date: fixed("2026/06/15 00:00"), lines: [{ n: 3, card: 0, key: "012D" }] },
    ],
  },
  "S-M12-09-PERIOD-016": {
    clear: [{ formats: [FA] }],
    cards: ["A", "B", "C", "D"].map((x, i) => ({ keys: [`016${x}`], def: old("016", x, { 略称: `T16${x}`, 商品番号: `P00${i + 1}` }) })),
    archetypes: [oldArch("016", "", FA)],
    decks: [["A", "2026/06/09", 7], ["B", "2026/06/10", 3], ["C", "2026/06/20", 5], ["D", "2026/06/21", 9]].map(([x, d, n], i) => ({
      key: `016${x}`, format: FA, archetype: "M1209試験アーキタイプ016", eventJ: `M1209試験イベント016 ${x}`, eventE: `M1209 Event 016 ${x}`, date: fixed(`${d} 00:00`), lines: [{ n: n as number, card: i, key: `016${x}` }],
    })),
  },
  "S-M12-09-NOTO-018": {
    clear: [{ formats: [FA] }],
    cards: ["A", "B", "C"].map((x, i) => ({ keys: [`018${x}`], def: old("018", x, { 略称: `T18${x}`, 商品番号: `P00${i + 1}` }) })),
    archetypes: [oldArch("018", "", FA)],
    decks: [["A", fixed("2026/05/01 00:00"), 2], ["B", dayOffset(0), 6], ["C", dayOffset(1), 4]].map(([x, d, n], i) => ({
      key: `018${x}`, format: FA, archetype: "M1209試験アーキタイプ018", eventJ: `M1209試験イベント018 ${x}`, eventE: `M1209 Event 018 ${x}`, date: d as () => string, lines: [{ n: n as number, card: i, key: `018${x}` }],
    })),
  },
  "S-M12-09-NOPROD-019": {
    clear: [{ formats: [FA] }],
    cards: [
      { keys: ["019A"], subKeys: ["019"], def: old("019", "X", { 略称: "T19X" }) },
      { keys: ["019B"], subKeys: [], def: old("019", "Y", { 略称: "T19Y", 詳細なし: true, 商品: null }) },
    ],
    archetypes: [oldArch("019", "", FA)],
    decks: [{ key: "019", format: FA, archetype: "M1209試験アーキタイプ019", eventJ: "M1209試験イベント019", eventE: "M1209 Event 019", date: fixed("2026/06/15 00:00"), lines: [{ n: 4, card: 0, key: "019A" }, { n: 7, card: 1, key: "019B" }] }],
  },
  "S-M12-09-TWOFMT-020": {
    clear: [{ formats: [FB, FC] }],
    cards: [{ keys: ["020A"], def: old("020", "A", { 略称: "M1209020A" }) }, { keys: ["020B"], def: old("020", "B", { 略称: "M1209020B", 商品番号: "P002" }) }],
    archetypes: [oldArch("020", "C", FC), oldArch("020", "B", FB)],
    decks: [
      { key: "020A", format: FC, archetype: "M1209試験アーキタイプ020 C", eventJ: "M1209試験イベント020 A", eventE: "M1209 Event 020 A", date: fixed("2026/06/15 00:00"), lines: [{ n: 4, card: 0, key: "020A" }] },
      { key: "020B", format: FB, archetype: "M1209試験アーキタイプ020 B", eventJ: "M1209試験イベント020 B", eventE: "M1209 Event 020 B", date: fixed("2026/06/15 00:00"), lines: [{ n: 3, card: 1, key: "020B" }] },
    ],
  },
  "S-M12-09-BASICMIX-021": {
    clear: [{ formats: [FC] }],
    cards: [{ keys: ["021A"], def: old("021", "A", { 略称: "M1209021A", 特殊タイプ: ["基本", "伝説"] }) }],
    archetypes: [oldArch("021", "", FC)],
    decks: [{ key: "021A", format: FC, archetype: "M1209試験アーキタイプ021", eventJ: "M1209試験イベント021", eventE: "M1209 Event 021", date: fixed("2026/06/15 00:00"), lines: [{ n: 5, card: 0, key: "021A" }] }],
  },
  "S-M12-09-CBDECK-022": {
    clear: [{ formats: [FA] }],
    cards: [{ keys: ["022X"], def: cb("022", "X", ["基本"]) }, { keys: ["022Y"], def: cb("022", "Y", []) }],
    archetypes: [arch("022", "A", FA)],
    decks: [{ key: "022A", format: FA, archetype: "M1209-CB022-ARCHJ-A", eventJ: "M1209-CB022-EVENTJ-A", eventE: "M1209-CB022-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 4, card: 0 }, { n: 3, card: 1 }] }],
  },
  "S-M12-09-CBDECK-023": {
    clear: [{ formats: [FB] }, { formats: [FC] }],
    cards: [{ keys: ["023X"], def: cb("023", "X", ["基本"]) }],
    archetypes: [arch("023", "B", FB), arch("023", "C", FC)],
    decks: [
      { key: "023A", format: FB, archetype: "M1209-CB023-ARCHJ-B", eventJ: "M1209-CB023-EVENTJ-B", eventE: "M1209-CB023-EVENTE-B", date: fixed("2026/06/15 00:00"), lines: [{ n: 5, card: 0 }] },
      { key: "023B", format: FC, archetype: "M1209-CB023-ARCHJ-C", eventJ: "M1209-CB023-EVENTJ-C", eventE: "M1209-CB023-EVENTE-C", date: fixed("2026/06/20 00:00"), lines: [{ n: 2, card: 0 }] },
    ],
  },
  "S-M12-09-CBDECK-024": {
    clear: [{ formats: [FA] }],
    cards: [{ keys: ["024X"], def: cb("024", "X", ["基本", "伝説"]) }],
    archetypes: [arch("024", "A", FA)],
    decks: [{ key: "024A", format: FA, archetype: "M1209-CB024-ARCHJ-A", eventJ: "M1209-CB024-EVENTJ-A", eventE: "M1209-CB024-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 5, card: 0 }] }],
  },
  "S-M12-09-CBDECK-025": {
    clear: [{ formats: [FC] }],
    cards: [{ keys: ["025X"], def: cb("025", "X", ["基本"]) }, { keys: ["025Y"], def: cb("025", "Y", []) }],
    archetypes: [arch("025", "A", FC)],
    decks: [{ key: "025A", format: FC, archetype: "M1209-CB025-ARCHJ-A", eventJ: "M1209-CB025-EVENTJ-A", eventE: "M1209-CB025-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 5, card: 0 }, { n: 3, card: 1 }] }],
  },
  "S-M12-09-CBDECK-026": {
    clear: [{ formats: [FB] }],
    cards: [{ keys: ["026Y"], def: cb("026", "Y", []) }, { keys: ["026Z"], def: cb("026", "Z", []) }],
    archetypes: [arch("026", "A", FB)],
    decks: [
      { key: "026A", format: FB, archetype: "M1209-CB026-ARCHJ-A", eventJ: "M1209-CB026-EVENTJ-A", eventE: "M1209-CB026-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 3, card: 0 }] },
      { key: "026B", format: FB, archetype: "M1209-CB026-ARCHJ-A", 公開: "非公開", eventJ: "M1209-CB026-EVENTJ-A", eventE: "M1209-CB026-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 6, card: 1 }] },
    ],
  },
  "S-M12-09-CBDECK-027": {
    clear: [{ formats: [FC] }],
    cards: [{ keys: ["027Y"], def: cb("027", "Y", []) }, { keys: ["027Z"], def: cb("027", "Z", []) }],
    archetypes: [arch("027", "A", FC)],
    decks: [
      { key: "027A", format: FC, archetype: "M1209-CB027-ARCHJ-A", eventJ: "M1209-CB027-EVENTJ-A", eventE: "M1209-CB027-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 3, card: 0 }] },
      { key: "027B", format: FC, archetype: "M1209-CB027-ARCHJ-A", type: "ユーザーデッキ", eventJ: "M1209-CB027-EVENTJ-A", eventE: "M1209-CB027-EVENTE-A", date: fixed("2026/06/15 00:00"), lines: [{ n: 6, card: 1 }] },
    ],
  },
};

for (const [seedId, spec] of Object.entries(SPECS)) defineDataSeed(seedId, { prefix: "M1209", ...spec }, ["S-M12-09-ADM", "S-M12-09-FORMATS"]);

defineSeed("S-M12-09-NO-RESULT-009", { needs: ["S-M12-09-ADM", "S-M12-09-FORMATS"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(90_000);
    const n = await デッキを一括削除する(page, [FA], { from: "2026/04/01", to: "2026/04/30" }, (m) => reportSeedIssue(seed.シードID, m));
    if (n) reportSeedIssue(seed.シードID, `既存のデッキを${n}件一括削除した（${FA}・開催日 2026/04/01〜2026/04/30）`);
  });
});
