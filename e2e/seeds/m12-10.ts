/**
 * M12-10 特集タグ編集CSVダウンロード(検索項目) のシードの作り方（画面操作）。正本: cases/M12-10_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で登録。権限は、分析・集計管理を操作できる「システム管理者」。
 * - 専用フォーマット: 各シードがフォーマット一覧の「新規登録」から登録する。名前は実行ごとの印を付けて作る（同じ名前の前回のフォーマットを選ばないため）。
 * - カード・商品・アーキタイプ・デッキ: M12-09 と同じ流れ（seeds/m12-data.ts）。
 * 作らないシード: ONE-RESULT-001・002・005・011・VALUES-014（在庫の入庫と承認を含む）、NOPERM-007（分析・集計管理を許可しない権限が要る）。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { DataSpec, cb, defineDataSeed, fixed } from "./m12-data";
import { ensureAnalysisAdmin } from "./m12-common";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerFormat } from "../pages/admin/m12_09_used_card";

export const M1210_ADMIN: Account = { loginId: "m1210_admin", password: "Passw0rd!M1210" };

defineSeed("S-M12-10-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-10試験管理者", account: M1210_ADMIN, メール: "m1210_admin@example.test" });
});
defineSeed("S-M12-10-SESSION-006", { needs: ["S-M12-10-ADM"] }, async () => { /* ケースの新しいブラウザの状態で、試験管理者のログインを行う */ });

defineSeed("S-M12-10-NO-RESULT-013", { needs: ["S-M12-10-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔フォーマットID-M1210-013〕", await registerFormat(page, { 名日: rc("試験フォーマットB-013"), 名英: rc("M1210 Format 013"), 並び順: "9013", メタ日数: "30" }, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

const fn = (n: string) => `試験フォーマットM1210-CB${n}-F`;
const newFmt = (n: string) => [{ key: `CB${n}`, 名日: fn(n), 名英: `M1210-CB${n}-FORMATE`, 並び順: `91${n.slice(1)}` }];
const archOf = (n: string) => ({ 名日: `M1210-CB${n}-ARCHJ`, 名英: `M1210-CB${n}-ARCHE`, format: fn(n) });
const deck = (n: string, lines: { n: number; card: number }[]) => ({
  key: `CB${n}A`, format: fn(n), archetype: `M1210-CB${n}-ARCHJ`, eventJ: `M1210-CB${n}-EVENTJ-A`, eventE: `M1210-CB${n}-EVENTE-A`, date: fixed("2026/06/15 00:00"), lines,
});
const cbc = (n: string, x: string, 特殊: string[]) => cb(n, x, 特殊, "M1210");

const SPECS: Record<string, DataSpec> = {
  "S-M12-10-CBDECK-015": { prefix: "M1210", newFormats: newFmt("015"), clear: [], cards: [{ keys: ["CB015X"], def: cbc("015", "X", ["基本", "伝説"]) }], archetypes: [archOf("015")], decks: [deck("015", [{ n: 5, card: 0 }])] },
  "S-M12-10-CBDECK-016": { prefix: "M1210", newFormats: newFmt("016"), clear: [], cards: [{ keys: ["CB016X"], def: cbc("016", "X", ["基本"]) }, { keys: ["CB016Y"], def: cbc("016", "Y", []) }], archetypes: [archOf("016")], decks: [deck("016", [{ n: 5, card: 0 }, { n: 3, card: 1 }])] },
  "S-M12-10-CBDECK-017": { prefix: "M1210", newFormats: newFmt("017"), clear: [], cards: [{ keys: ["CB017Y"], def: cbc("017", "Y", []) }], archetypes: [archOf("017")], decks: [deck("017", [{ n: 4, card: 0 }])] },
  "S-M12-10-CBDECK-018": {
    prefix: "M1210", newFormats: newFmt("018"), clear: [],
    cards: [{ keys: ["CB018Y"], def: cbc("018", "Y", []) }, { keys: ["CB018Z"], def: { ...cbc("018", "Z", []), 商品: null } }],
    archetypes: [archOf("018")], decks: [deck("018", [{ n: 3, card: 0 }, { n: 6, card: 1 }])],
  },
};
for (const [id, spec] of Object.entries(SPECS)) defineDataSeed(id, spec, ["S-M12-10-ADM"]);

// 008: 専用フォーマットに、イベントデッキ（公開2件・非公開1件）と利用者作成のデッキ（公開）を登録する
const f8 = "試験フォーマットB-008";
const d8 = (key: string, type: "イベントデッキ" | "ユーザーデッキ", 公開: "公開" | "非公開", ev: string, date: string, lines: { n: number; card: number }[]) => ({
  key, format: f8, archetype: "M12-10アーキタイプ008", type, 公開, eventJ: `M12-10イベント008${ev}`, eventE: `M1210 Event 008${ev}`, date: fixed(`${date} 00:00`), lines,
});
defineDataSeed("S-M12-10-USED-008", {
  prefix: "M1210",
  newFormats: [{ key: "008", 名日: f8, 名英: "M1210 Format 008", 並び順: "9008" }],
  clear: [],
  cards: [
    { keys: ["008A"], def: { カード名: "M1210CARD008P", セット名日: "M12-10セット008P", セット名英: "M1210 Set 008P", セット略称: "M12081", 特殊タイプ: [], 商品: { 商品コード: "M1210-P-008-P", 商品名日: "M12-10商品008P", 商品名英: "M1210 Product 008P" } } },
    { keys: ["008B"], def: { カード名: "M1210CARD008Q", セット名日: "M12-10セット008Q", セット名英: "M1210 Set 008Q", セット略称: "M12082", 特殊タイプ: ["基本"], 商品: { 商品コード: "M1210-P-008-Q", 商品名日: "M12-10商品008Q", 商品名英: "M1210 Product 008Q" } } },
  ],
  archetypes: [{ 名日: "M12-10アーキタイプ008", 名英: "M1210 Archetype 008", format: f8 }],
  decks: [
    d8("008A", "イベントデッキ", "公開", "A", "2026/06/10", [{ n: 4, card: 0 }, { n: 10, card: 1 }]),
    d8("008B", "イベントデッキ", "公開", "B", "2026/06/20", [{ n: 2, card: 0 }]),
    d8("008C", "ユーザーデッキ", "公開", "C", "2026/06/15", [{ n: 5, card: 0 }]),
    d8("008D", "イベントデッキ", "非公開", "D", "2026/06/15", [{ n: 7, card: 0 }]),
  ],
}, ["S-M12-10-ADM"]);
