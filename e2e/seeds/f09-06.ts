/**
 * F09-06 デッキリスト詳細 のシードの作り方（画面操作）。正本: cases/F09-06_seed_data.tsv
 *
 * - 操作する管理者: 全権限の管理者（SETUP_ADMIN）。シード表は管理者を定めない。フォーマット・アーキタイプ・デッキ・デッキタグ・
 *   カード・カードセットは店舗に属さないので、編集可能店舗を持たない全権限の管理者で足りる（F09-01・F09-02 と同じ）。
 * - 共通設定（S-F09-06-COMMON）のフォーマット2件は、あれば「MTG ARENAで導入済」がシード表どおりかを確かめて使い、無ければ登録する。
 *   名前はシード表どおり（実行の印を付けない。共有して参照するだけのため）。フォーマット名(英)は「F09SharedArena」「F09SharedNoArena」、
 *   並び順は 9601・9602（シード表は「未使用の値」とだけ定める）。フォーマットコードは名前から作る10文字の英数字（f09_01_setup）。
 * - 決め打ちの識別の値（カード名・アーキタイプ名・デッキ名・大会名・プレイヤー名・タグ名・カードセット名）は、「F0906-001」の
 *   ケースの前半に実行の印を付けて作る（例: F0906-001-山 → F0906-001-<印>-山）。英語名の部分一致の関係
 *   （「F0906-036-EVENT」と「F0906-036-別EVENT」など）は崩れない。
 * - シード表の「敗数『未設定』は画面で指定できないためDBへ直接設定する」は行わない（DB への書き込みはしない）。画面で登録した
 *   デッキの敗数は 0、勝数は未設定のまま。デッキリスト詳細の成績の欄は勝数・敗数の両方があるときだけ「勝-敗」を出す作りで、
 *   このケース群の期待結果は成績の欄を見ないので、期待結果は変わらない（判定は条件付き）。
 * - 開催日はシード表の日付の 0時0分（日時の入力欄のため時刻を補った）。参加人数 64。順位・成績・引用元URLはシード表に無ければ空。
 * - 画像の候補つきのカード（カードCSV登録）:
 *   - カード詳細ID: シード表の固定の番号（5908…）は、2回目の実行で前の実行のカードの詳細に当たり、取込が止まる（ほかのカードの
 *     詳細IDは更新できない）。カード一覧の先頭のカードのCSV出力から未使用の番号を読み、候補の番号の大小をシード表と同じにして
 *     振る（番号の小さい方の候補に小さい番号）。期待結果が見るのは番号の大小だけ。
 *   - 画像URL(英語): 既存のカードにある画像URLの、最後のファイル名だけをシード表のファイル名（f0906-…-w など）に替えたもの
 *     （拡張子は元のまま）。画面が出す画像の取得元のファイル名で確かめる。画像のファイル自体は置かない。
 *   - 点数で見たマナ・コストは 0（シード表は値を定めない。カード新規登録のシードと同じ値）。レアリティ・レイアウトは既存のカードの値。
 *   - カードセットの略称: 「F6」＋ケースの番号＋候補の記号＋実行の印の末尾6文字。
 * - デッキタグの英語名（シード表: 未使用の半角英字）: 「F」＋ケースの番号を英字にしたもの＋「Tag」＋記号＋実行の印を英字にしたもの。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, readExistingPromotionNameEn, uploadCardCsv } from "../pages/admin/card_csv";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { カードを登録する } from "../pages/admin/m14_card";
import { アーキタイプを用意する, デッキを登録する } from "../pages/admin/m15_05_deck_edit";
import { カードセットを登録する, カード一覧のカードID, デッキIDで検索する, デッキを削除する, 共通フォーマットを用意する, 画像の言語を日本語にする } from "../pages/admin/f09_06_setup";

/** 正本の値「F0906-<ケース>-<名>」を、実行の印つきの値にする（印はケースの前半に付ける） */
export const N = (ケース: string, 名: string) => `${rc(`F0906-${ケース}`)}-${名}`;

export const アリーナ対応 = "F09共有-アリーナ対応フォーマット";
export const アリーナ非対応 = "F09共有-アリーナ非対応フォーマット";

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 英字 = (s: string) => s.replace(/[0-9]/g, (d) => "abcdefghij"[Number(d)]);
const 印の末尾 = RUN_MARK.slice(-6).toUpperCase();

const 敗数の注記 = "シード表の「敗数『未設定』をDBへ直接設定する」は行わない（DB への書き込みはしない）。画面で登録したため敗数は 0。"
  + "成績の欄は勝数・敗数の両方があるときだけ表示する作りで勝数は未設定のため、表示は変わらない。このケースの期待結果は成績の欄を見ない（判定は条件付き）";

// ---------------------------------------------------------------------------
// 共通設定
// ---------------------------------------------------------------------------

defineSeed("S-F09-06-COMMON", async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-F09-06-COMMON", m);
  await 管理画面(browser, async (page) => {
    await 共通フォーマットを用意する(page, { 名: アリーナ対応, 名英: "F09SharedArena", 並び順: "9601", アリーナ対応: true }, issue);
    await 共通フォーマットを用意する(page, { 名: アリーナ非対応, 名英: "F09SharedNoArena", 並び順: "9602", アリーナ対応: false }, issue);
    // デッキ種別・表示区分は、デッキ編集画面の選択肢に既にあるものを使う（デッキの登録で選ぶときに、選択肢が無ければ止まる）
  });
});

// ---------------------------------------------------------------------------
// ケースごとのデッキ
// ---------------------------------------------------------------------------

type 候補 = {
  /** 画像のファイル名の末尾の記号（w・x・a・b） */
  記号: string;
  /** シード表のカード詳細IDの大小の順（1 が小さい） */
  順: number;
  特殊: boolean; プロモ: boolean; 発売日: string; Foil: boolean;
  /** カード編集画面で画像の言語を「日本語」に変える */
  日本語: boolean;
  /** カードセット名の記号（省略は記号の大文字） */
  セット?: string;
};
type カード = {
  /** カード名(日)の後半（「山」「術A」など） */
  名: string;
  /** カード名(英)の後半（省略は 名＋"EN"） */
  英?: string;
  種類?: ("土地" | "クリーチャー")[];
  控え: string;
  /** 画像の候補（カードCSV登録で作る）。省略はカード新規登録（カード詳細なし） */
  候補?: 候補[];
};
type 枚 = [number, string];
type デッキ = {
  名: string; 控え: string;
  種別?: "user"; 表示?: "公開" | "非公開" | "限定公開"; リスト非公開?: boolean; 非対応?: boolean;
  アーキ: string; 大会: string; 大会英: string; 選手?: string;
  /** 「yyyy/mm/dd」 */
  開催日?: string;
  タグ?: string[]; 引用元?: string;
  統率?: 枚[]; メイン?: 枚[]; サイド?: 枚[];
  /** カードの名ではなく、そのまま書く行（「1 UNKNOWN」） */
  メインの文?: string;
};
type 計画 = { ケース: string; カード?: カード[]; タグ?: string[]; デッキ: デッキ[]; 存在しないデッキID?: string };

/** 画像URL: 既存の画像URLの最後のファイル名だけを替える（拡張子は元のまま） */
function 画像URL(元: string, ファイル名: string): string {
  const u = 元.split(/[?#]/)[0];
  const i = u.lastIndexOf("/");
  const ext = /\.[A-Za-z0-9]+$/.exec(u.slice(i + 1))?.[0] ?? ".jpg";
  return `${u.slice(0, i + 1)}${ファイル名}${ext}`;
}

async function 画像つきのカードを登録する(page: Page, seedId: string, ケース: string, c: カード, issue: (m: string) => void, notes: { set: (k: string, v: string) => void }): Promise<void> {
  const 名日 = N(ケース, c.名), 名英 = N(ケース, c.英 ?? `${c.名}EN`);
  const 候補 = [...c.候補!].sort((a, b) => a.順 - b.順);
  for (const k of 候補) {
    const s = k.セット ?? k.記号.toUpperCase();
    await カードセットを登録する(page, { 名: N(ケース, `SET-${s}`), 略称: `F6${ケース}${s}${印の末尾}`, リリース日: k.発売日, 特殊: k.特殊 }, issue);
  }
  const 既存 = await readExistingCardValues(page);
  const promo = 候補.some((k) => k.プロモ) ? await readExistingPromotionNameEn(page) : "";
  const headers = await downloadCardCsvTemplate(page);
  const rows = 候補.map((k, i) => ({
    name_jp: 名日, name_en: 名英, cmc: "0", cardtype: "",
    set: N(ケース, `SET-${k.セット ?? k.記号.toUpperCase()}`), rarity: 既存.rarity, layout: 既存.layout,
    promotion_type: k.プロモ ? promo : "", foil: k.Foil ? "1" : "0",
    image_en: 画像URL(既存.imageEn, `f0906-${ケース}-${k.記号}`), card_detail_id: String(既存.nextUnusedDetailId + i),
  }));
  issue(`カード「${名日}」の候補のカード詳細IDは、未使用の番号 ${rows.map((r) => r.card_detail_id).join("・")} を、シード表の番号の小さい順に振った（シード表の固定の番号は2回目の実行で使えないため）`);
  await uploadCardCsv(page, buildCardCsv(headers, rows), `f0906_${ケース}_cards.csv`, `${seedId}: カードCSVアップロード（${名日}）`, (w) => issue(`カードCSVの警告「${w}」`));
  const id = await カード一覧のカードID(page, 名日);
  const jp = 候補.filter((k) => k.日本語).map((k) => `f0906-${ケース}-${k.記号}`);
  if (jp.length) await 画像の言語を日本語にする(page, id, jp, issue);
  notes.set(c.控え, id);
}

function definePlanSeed(seedId: string, p: 計画): void {
  defineSeed(seedId, { needs: ["S-F09-06-COMMON"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const n = (名: string) => N(p.ケース, 名);
    await 管理画面(browser, async (page) => {
      for (const c of p.カード ?? []) {
        if (c.候補) { await 画像つきのカードを登録する(page, seedId, p.ケース, c, issue, notes); continue; }
        notes.set(c.控え, await カードを登録する(page, {
          カード名日: n(c.名), カード名英: n(c.英 ?? `${c.名}EN`), 点数で見たマナ: "0", カードタイプ: c.種類, 詳細: false,
        }, seedId, issue));
      }
      for (const [i, t] of (p.タグ ?? []).entries()) {
        await 行を用意する(page, "デッキタグ", n(t), `F${英字(p.ケース)}Tag${"ABCDEFGH"[i]}${英字(RUN_MARK)}`, `${seedId} のデッキタグ`);
      }
      const 作った = new Set<string>();
      for (const d of p.デッキ) {
        const f = d.非対応 ? アリーナ非対応 : アリーナ対応;
        if (!作った.has(d.アーキ)) {
          await アーキタイプを用意する(page, { 名日: n(d.アーキ), 名英: n(d.アーキ.replace("アーキ", "ARCH")), フォーマット: f }, issue);
          作った.add(d.アーキ);
        }
        const 行 = (xs?: 枚[]) => xs?.length ? xs.map(([k, c]) => `${k} ${n(c)}`).join("\n") : undefined;
        notes.set(d.控え, await デッキを登録する(page, {
          デッキ名: n(d.名), デッキリスト非公開: !!d.リスト非公開, デッキ種別: d.種別 ?? "event",
          フォーマット: f, アーキタイプ: n(d.アーキ), 公開状態: d.表示 ?? "公開",
          プレイヤー名: n(d.選手 ?? "選手"), イベント名日: n(d.大会), イベント名英: n(d.大会英),
          開催日: `${d.開催日 ?? "2026/03/05"} 00:00`, 参加人数: "64",
          タグ: d.タグ?.map(n), 引用元URL: d.引用元,
          統率: 行(d.統率), メイン: d.メインの文 ?? 行(d.メイン), サイド: 行(d.サイド),
        }, issue));
      }
      if (p.存在しないデッキID) {
        const hit = await デッキIDで検索する(page, p.存在しないデッキID);
        for (const id of hit.filter((x) => x === p.存在しないデッキID)) {
          issue(`デッキID ${id} のデッキがあったので、シード表どおりデッキの削除で消した`);
          await デッキを削除する(page, id);
        }
        const again = await デッキIDで検索する(page, p.存在しないデッキID);
        if (again.includes(p.存在しないデッキID)) throw new Error(`デッキID ${p.存在しないデッキID} のデッキが残っている`);
      }
      issue(敗数の注記);
    });
  });
}

/** 1枚のカードと1つのデッキの基本の形（ケース001〜の多くがこの形） */
function 基本(ケース: string, o: {
  カード?: Partial<カード> & { 名: string }; 板?: "メイン" | "サイド" | "統率"; 枚数?: number;
  デッキ?: Partial<デッキ>; 追加カード?: カード[]; 追加メイン?: 枚[]; タグ?: string[]; 存在しないデッキID?: string;
} = {}): 計画 {
  const c: カード = { 名: "山", 種類: ["土地"], 控え: `〔カードID-F0906-${ケース}〕`, ...o.カード } as カード;
  const 枚: 枚[] = [[o.枚数 ?? 4, c.名]];
  const 板 = o.板 ?? "メイン";
  return {
    ケース, タグ: o.タグ, 存在しないデッキID: o.存在しないデッキID,
    カード: [c, ...(o.追加カード ?? [])],
    デッキ: [{
      名: "デッキ", 控え: `〔デッキID-F0906-${ケース}〕`, アーキ: "アーキ", 大会: "大会", 大会英: "EVENT",
      統率: 板 === "統率" ? 枚 : undefined, メイン: 板 === "メイン" ? [...枚, ...(o.追加メイン ?? [])] : o.追加メイン, サイド: 板 === "サイド" ? 枚 : undefined,
      ...o.デッキ,
    }],
  };
}

const 術 = (ケース: string, 候補?: 候補[]): Partial<カード> & { 名: string } => ({ 名: "術", 種類: [], 控え: `〔カードID-F0906-${ケース}〕`, 候補 });

// ---- 表示の可否 ----
definePlanSeed("S-F09-06-EMPTYID-001", 基本("001"));
definePlanSeed("S-F09-06-NOTFOUND-002", 基本("002", { 存在しないデッキID: "590600299" }));
definePlanSeed("S-F09-06-HIDDEN-003", 基本("003", { デッキ: { 表示: "非公開" } }));
definePlanSeed("S-F09-06-USERDECK-004", 基本("004", { デッキ: { 種別: "user" } }));
definePlanSeed("S-F09-06-LIMITED-005", 基本("005", { デッキ: { 表示: "限定公開" } }));
definePlanSeed("S-F09-06-LISTPRIV-006", 基本("006", { デッキ: { リスト非公開: true } }));
definePlanSeed("S-F09-06-LISTHIDE-007", 基本("007", {
  カード: { 名: "山", 種類: ["土地"], 控え: "〔カードID-F0906-007A〕" },
  追加カード: [{ 名: "熊", 種類: ["クリーチャー"], 控え: "〔カードID-F0906-007B〕" }], 追加メイン: [[3, "熊"]],
  デッキ: { リスト非公開: true },
}));
definePlanSeed("S-F09-06-LISTMSG-008", 基本("008", { デッキ: { リスト非公開: true } }));

// ---- カードリストの区画 ----
definePlanSeed("S-F09-06-CLSSIDE-009", 基本("009", { 板: "サイド", 枚数: 2 }));
definePlanSeed("S-F09-06-CLSCMD-010", 基本("010", { カード: { 名: "熊", 種類: ["クリーチャー"] }, 板: "統率", 枚数: 1 }));
definePlanSeed("S-F09-06-CLSLAND-011", 基本("011", { カード: { 名: "森熊", 種類: ["土地", "クリーチャー"] } }));
definePlanSeed("S-F09-06-CLSCRT-012", 基本("012", { カード: { 名: "熊", 種類: ["クリーチャー"] }, 枚数: 3 }));
definePlanSeed("S-F09-06-CLSSPELL-013", 基本("013", { カード: { 名: "術", 種類: [] }, 枚数: 2 }));
definePlanSeed("S-F09-06-CLSUNK-014", { ...基本("014", { デッキ: { メインの文: "1 UNKNOWN" } }), カード: [] });
definePlanSeed("S-F09-06-NOCMD-015", 基本("015"));
definePlanSeed("S-F09-06-HASCMD-016", 基本("016", {
  カード: { 名: "将", 種類: ["クリーチャー"], 控え: "〔カードID-F0906-016A〕" }, 板: "統率", 枚数: 1,
  追加カード: [{ 名: "山", 種類: ["土地"], 控え: "〔カードID-F0906-016B〕" }], 追加メイン: [[4, "山"]],
}));
definePlanSeed("S-F09-06-NOUNK-017", 基本("017"));
definePlanSeed("S-F09-06-MAINSEC-058", 基本("058", { カード: { 名: "森熊", 種類: ["土地", "クリーチャー"] } }));
definePlanSeed("S-F09-06-UNKROW-059", { ...基本("059", { デッキ: { メインの文: "1 UNKNOWN" } }), カード: [] });

// ---- 画像 ----
const 候補なし = (o: Partial<候補> & { 記号: string; 順: number }): 候補 => ({ 特殊: false, プロモ: false, 発売日: "2025-01-01", Foil: false, 日本語: false, ...o });
definePlanSeed("S-F09-06-IMGID-023", 基本("023", {
  カード: 術("023", [候補なし({ 記号: "w", 順: 1, 日本語: true }), 候補なし({ 記号: "x", 順: 2, 日本語: true })]), 枚数: 2,
}));
definePlanSeed("S-F09-06-NOIMGLINK-025", 基本("025", { カード: 術("025"), 枚数: 2 }));
definePlanSeed("S-F09-06-CACHEKEY-057", {
  ケース: "057",
  カード: [
    { 名: "術A", 控え: "〔カードID-F0906-057A〕", 候補: [候補なし({ 記号: "a", 順: 1, 日本語: true })] },
    { 名: "術B", 控え: "〔カードID-F0906-057B〕", 候補: [候補なし({ 記号: "b", 順: 2, 日本語: true })] },
  ],
  デッキ: [
    { 名: "デッキA", 控え: "〔デッキID-F0906-057A〕", アーキ: "アーキA", 大会: "大会A", 大会英: "EVENTA", 選手: "選手A", メイン: [[2, "術A"]] },
    { 名: "デッキB", 控え: "〔デッキID-F0906-057B〕", アーキ: "アーキB", 大会: "大会B", 大会英: "EVENTB", 選手: "選手B", メイン: [[2, "術B"]] },
  ],
});
definePlanSeed("S-F09-06-CACHELANG-065", 基本("065", {
  カード: 術("065", [候補なし({ 記号: "x", 順: 1 }), 候補なし({ 記号: "w", 順: 2, 日本語: true })]), 枚数: 2,
}));

/** 066〜075: 候補W（詳細ID 02）・候補X（詳細ID 01） */
function 選択順(ケース: string, w: Partial<候補>, x: Partial<候補>): 計画 {
  return 基本(ケース, { カード: 術(ケース, [候補なし({ 記号: "x", 順: 1, ...x }), 候補なし({ 記号: "w", 順: 2, ...w })]), 枚数: 2 });
}
// 特殊セット: W=特殊でない・プロモ・2024・Foil／X=特殊・プロモでない・2026・Foilでない
definePlanSeed("S-F09-06-CBSPECJA-066", 選択順("066", { プロモ: true, 発売日: "2024-01-01", Foil: true }, { 特殊: true, 発売日: "2026-01-01", 日本語: true }));
definePlanSeed("S-F09-06-CBSPECEN-067", 選択順("067", { プロモ: true, 発売日: "2024-01-01", Foil: true, 日本語: true }, { 特殊: true, 発売日: "2026-01-01" }));
// プロモーション: W=プロモでない・2024・Foil／X=プロモ・2026・Foilでない
definePlanSeed("S-F09-06-CBPROMOJA-068", 選択順("068", { 発売日: "2024-01-01", Foil: true }, { プロモ: true, 発売日: "2026-01-01", 日本語: true }));
definePlanSeed("S-F09-06-CBPROMOEN-069", 選択順("069", { 発売日: "2024-01-01", Foil: true, 日本語: true }, { プロモ: true, 発売日: "2026-01-01" }));
// 発売日: W=2026・Foil／X=2025・Foilでない
definePlanSeed("S-F09-06-CBDATEJA-070", 選択順("070", { 発売日: "2026-01-01", Foil: true }, { 日本語: true }));
definePlanSeed("S-F09-06-CBDATEEN-071", 選択順("071", { 発売日: "2026-01-01", Foil: true, 日本語: true }, {}));
// Foil: W=Foilでない／X=Foil
definePlanSeed("S-F09-06-CBFOILJA-072", 選択順("072", {}, { Foil: true, 日本語: true }));
definePlanSeed("S-F09-06-CBFOILEN-073", 選択順("073", { 日本語: true }, { Foil: true }));
// 言語: 日本語表示なら W=日本語／英語表示なら W=英語
definePlanSeed("S-F09-06-CBLANGJA-074", 選択順("074", { 日本語: true }, {}));
definePlanSeed("S-F09-06-CBLANGEN-075", 選択順("075", {}, { 日本語: true }));
// 詳細ID: W=詳細ID 01・X=02（ほかは同じ。どちらも英語）
definePlanSeed("S-F09-06-CBIDJA-076", 基本("076", { カード: 術("076", [候補なし({ 記号: "w", 順: 1 }), 候補なし({ 記号: "x", 順: 2 })]), 枚数: 2 }));
definePlanSeed("S-F09-06-CBIDEN-077", 基本("077", { カード: 術("077", [候補なし({ 記号: "w", 順: 1 }), 候補なし({ 記号: "x", 順: 2 })]), 枚数: 2 }));
definePlanSeed("S-F09-06-CBNOIMGJA-078", 基本("078", { カード: 術("078"), 枚数: 2 }));
definePlanSeed("S-F09-06-CBNOIMGEN-079", 基本("079", { カード: 術("079"), 枚数: 2 }));

// ---- 情報欄 ----
definePlanSeed("S-F09-06-INFO-028", 基本("028", { デッキ: { 引用元: "https://replace-dev.hareruyamtg.com:8443/f0906-028" } }));
definePlanSeed("S-F09-06-NOTAG-030", 基本("030"));
definePlanSeed("S-F09-06-NOSRC-031", 基本("031"));
definePlanSeed("S-F09-06-ENTEVENT-032", 基本("032"));
definePlanSeed("S-F09-06-ENTARCH-033", 基本("033"));
definePlanSeed("S-F09-06-ENTPLAYER-034", 基本("034"));
definePlanSeed("S-F09-06-ENTTAG-035", 基本("035", { タグ: ["タグA", "タグB"], デッキ: { タグ: ["タグA", "タグB"] } }));
definePlanSeed("S-F09-06-TAGJOIN-060", 基本("060", { タグ: ["タグA", "タグB"], デッキ: { タグ: ["タグA", "タグB"] } }));
definePlanSeed("S-F09-06-TAGB-061", 基本("061", { タグ: ["タグA", "タグB"], デッキ: { タグ: ["タグA", "タグB"] } }));

// ---- 画面下部の導線・戻る・一括購入 ----
const 山デッキ = (ケース: string) => 基本(ケース).デッキ[0];
definePlanSeed("S-F09-06-SAMEEVENT-036", {
  ...基本("036"),
  デッキ: [
    { ...山デッキ("036"), 控え: "〔デッキID-F0906-036A〕" },
    { 名: "デッキ2", 控え: "〔デッキID-F0906-036B〕", アーキ: "アーキ2", 大会: "大会", 大会英: "EVENT" },
    { 名: "デッキ3", 控え: "〔デッキID-F0906-036C〕", アーキ: "アーキ3", 大会: "別大会", 大会英: "別EVENT" },
  ],
});
definePlanSeed("S-F09-06-SAMEEVENTCOND-037", 基本("037"));
definePlanSeed("S-F09-06-SAMEARCHCOND-038", 基本("038"));
definePlanSeed("S-F09-06-SAMEARCH-039", {
  ...基本("039"),
  デッキ: [
    { ...山デッキ("039"), 控え: "〔デッキID-F0906-039A〕" },
    { 名: "デッキ2", 控え: "〔デッキID-F0906-039B〕", アーキ: "アーキ", 大会: "大会2", 大会英: "EVENT2" },
    { 名: "デッキ3", 控え: "〔デッキID-F0906-039C〕", アーキ: "アーキ3", 大会: "大会3", 大会英: "EVENT3" },
  ],
});
definePlanSeed("S-F09-06-SAMEEVENTDATE-062", {
  ...基本("062"),
  デッキ: [
    { ...山デッキ("062"), 控え: "〔デッキID-F0906-062A〕" },
    { 名: "デッキ2", 控え: "〔デッキID-F0906-062B〕", アーキ: "アーキ2", 大会: "大会2", 大会英: "EVENT", 開催日: "2026/02/12" },
    { 名: "デッキ3", 控え: "〔デッキID-F0906-062C〕", アーキ: "アーキ3", 大会: "別大会", 大会英: "OTHER" },
  ],
});
definePlanSeed("S-F09-06-BULK-040", 基本("040", { カード: { 名: "山", 英: "MOUNTAIN", 種類: ["土地"] } }));
definePlanSeed("S-F09-06-BACK-041", 基本("041"));

// ---- 書き出し ----
const 山M = { 名: "山", 英: "MOUNTAIN", 種類: ["土地" as const] };
definePlanSeed("S-F09-06-EXPMO-042", 基本("042", { カード: 山M }));
definePlanSeed("S-F09-06-EXPNONE-043", 基本("043", { カード: 山M, デッキ: { リスト非公開: true } }));
definePlanSeed("S-F09-06-EXPARENA-044", 基本("044", { カード: 山M }));
definePlanSeed("S-F09-06-EXPNOARENA-045", 基本("045", { カード: 山M, デッキ: { 非対応: true } }));
definePlanSeed("S-F09-06-EXPMOGO-046", 基本("046", { カード: 山M }));
definePlanSeed("S-F09-06-EXPARENAGO-047", 基本("047", { カード: 山M }));
definePlanSeed("S-F09-06-EXPJPGO-048", 基本("048", { カード: 山M }));
definePlanSeed("S-F09-06-EXPDONE-049", 基本("049", { カード: 山M }));
definePlanSeed("S-F09-06-EXPJPROUTE-055", 基本("055", { カード: 山M }));
definePlanSeed("S-F09-06-EXPJPDONE-056", 基本("056", { カード: 山M }));

// ---- 参照だけで変わらないこと・旧URL ----
definePlanSeed("S-F09-06-NOUPD-050", 基本("050"));
definePlanSeed("S-F09-06-OLDCUR-052", 基本("052"));
definePlanSeed("S-F09-06-OLDNONE-053", 基本("053"));
