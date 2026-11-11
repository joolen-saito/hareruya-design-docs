/**
 * M14-01 カード検索（一覧・条件抽出） のシードの作り方（画面操作）。正本: cases/M14-01_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で登録する。権限は、カード管理を操作できる「システム管理者」（正本は権限の名前を定めない。M12 と同じ）。
 * - 試験マスター: MTGマスターデータ管理・カードセット登録・フォーマット登録で「あれば使い、無ければ登録する」。名称は正本のとおり（実行の印は付けない。共有可）。
 * - 並びや件数を確かめるカード: カード詳細(登録)画面で正本の順に1件ずつ登録する。カード名・検索語は実行ごとの印を付ける
 *   （検索語 T は rc(T) に、カード名の中の T も同じ rc(T) にする。ケース側も同じ置き換えをするので、前の実行のカードと混ざらない）。
 * FILTER・DELETE-READ: 画面で作り、更新日時だけ DB で設定する（印つきのカードに限る。db/m14_01.ts）。
 * LISTFILES・BATCH-006/007・LISTFMT-066/079・DPNOCODE-084・CBLIST-102: カードは画面で作る。カード名リストのファイルは消さない（共有のデータ）。
 * 作らないシード: PAGING（12001件）・CSV-045（共有のマスターへ試験の値を足す）・LISTOW-064/LISTALL-065/CBLIST-101/103（ファイルの書き換え・特別サジェストの追加）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { Notes } from "../lib/notes";
import { ensureCardset } from "../pages/admin/product_masters";
import { CardSearchPage, カード入力, カードを登録する, ensureFormatByName, ensureMaster } from "../pages/admin/m14_card";
import { ensureAnalysisAdmin } from "./m12-common";
import { カードの更新日時を設定する } from "../db/m14_01";

export const M1401_ADMIN: Account = { loginId: "m1401_admin", password: "Passw0rd!M1401" };

defineSeed("S-M14-01-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-01試験管理者", account: M1401_ADMIN, メール: "m1401_admin@example.test" });
});

defineSeed("S-M14-01-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const m = (種別: Parameters<typeof ensureMaster>[1], 日: string, 英: string) => ensureMaster(page, 種別, 日, 英, seed.シードID);
    for (const [日, 英] of [["試験カードタイプ", "M1401 Test Cardtype"], ["クリーチャー", "Creature"], ["ソーサリー", "Sorcery"]]) await m("カードタイプ", 日, 英);
    for (const [日, 英] of [["試験サブタイプ", "M1401 Test Subtype"], ["ウィザード", "Wizard"], ["秘儀", "Arcane"]]) await m("サブタイプ", 日, 英);
    for (const [日, 英] of [["試験特殊タイプ", "M1401 Test Specialtype"], ["伝説", "Legendary"], ["氷雪", "Snow"]]) await m("特殊タイプ", 日, 英);
    for (const n of ["試験イラストレーター", "Artist A", "Artist B"]) await m("イラストレーター", n, n === "試験イラストレーター" ? "M1401 Test Illustrator" : n);
    for (const n of ["試験プロモ種別", "Promo A", "Promo B"]) await m("プロモーション", n, n === "試験プロモ種別" ? "M1401 Test Promo" : n);
    for (const [日, 英] of [["レア", "Rare"], ["アンコモン", "Uncommon"]]) await m("レアリティ", 日, 英);
    for (const [日, 英] of [["通常", "Normal"], ["分割", "Split"]]) await m("カードレイアウト", 日, 英);
    for (const [n, code] of [["試験カードセット", "M1401TST"], ["SET-A", "M1401SA"], ["SET-B", "M1401SB"]]) await ensureCardset(page, n, n === "試験カードセット" ? "M1401 Test Cardset" : n, code, issue);
    let rank = 9100;
    for (const [日, 英, code] of [["試験フォーマット", "M1401 Test Format", ""], ["スタンダード", "Standard", "St"], ["モダン", "Modern", "Mo"], ["コマンダー", "Commander", "Cm"]]) {
      await ensureFormatByName(page, { 名日: 日, 名英: 英, コード: code, 並び順: String(rank++) }, seed.シードID, issue);
    }
  });
});

// ---------------------------------------------------------------------------
// 件数・並びを確かめるカードの組
// ---------------------------------------------------------------------------

type 札 = { 日?: string; 英: string; cmc?: string; マナ?: string; Foil?: string; リーガリティ?: カード入力["リーガリティ"]; フォーマット所属?: string[]; 追加?: Partial<カード入力> };

/** 検索語 token の置き換え（正本の文字列 s の中の token を、実行の印つきにする） */
export function 印(token: string, s: string): string { return s.split(token).join(rc(token)); }

const 英字 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * カードを正本の順に1件ずつ登録し、検索語で絞った一覧が件数どおりであること・カードIDが登録順に大きいことを確かめて、
 * 呼び名（labels[i]）でカードIDを控える。
 */
async function カードの組を作る(browser: Browser, seedId: string, notes: Notes, tokenOrTokens: string | string[], cards: 札[], labels: string[]): Promise<void> {
  const tokens = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
  const 印す = (s: string) => tokens.reduce((acc, t) => 印(t, acc), s);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seedId, m);
    for (const c of cards) {
      await カードを登録する(page, {
        カード名日: c.日 === undefined ? undefined : 印す(c.日), カード名英: 印す(c.英), 点数で見たマナ: c.cmc ?? "0", マナ・コスト: c.マナ === undefined ? undefined : c.マナ,
        リーガリティ: c.リーガリティ, 詳細: { Foil: c.Foil ?? "なし", フレーム: "通常" }, ...c.追加,
      }, `${seedId} ${印す(c.英)}`, issue);
    }
    const list = new CardSearchPage(page);
    const shown: { カードID: string; カード名: string }[] = [];
    for (const t of tokens) {
      await list.open();
      await list.キーワードで検索する(rc(t));
      const n = (await list.検索結果件数()) ?? 0;
      if (n > 10) await list.表示件数を選ぶ(100);
      const rows = await list.表示行();
      if (rows.length !== n) throw new Error(`${seedId}: 検索語「${rc(t)}」の検索結果 ${n} 件のうち ${rows.length} 件しか読めない`);
      shown.push(...rows);
    }
    const uniq = [...new Map(shown.map((r) => [r.カードID, r])).values()];
    if (uniq.length !== cards.length) throw new Error(`${seedId}: 検索語で ${uniq.length} 件出た（${cards.length} 件のはず）`);
    const ids: number[] = [];
    cards.forEach((c, i) => {
      const hit = uniq.filter((r) => r.カード名.includes(印す(c.英)));
      if (hit.length !== 1) throw new Error(`${seedId}: 「${印す(c.英)}」の行が ${hit.length} 件ある`);
      notes.set(labels[i], hit[0].カードID);
      ids.push(Number(hit[0].カードID));
    });
    for (let i = 1; i < ids.length; i++) {
      if (!(ids[i] > ids[i - 1])) throw new Error(`${seedId}: 控えたカードIDが登録した順に大きくなっていない（${ids.join("、")}）`);
    }
  });
}

/** 〔カードID-<prefix>A〕〜 の呼び名 */
const 呼び名 = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `〔カードID-${prefix}${英字[i]}〕`);

/** 「T-A」〜「T-K」のように名前が連番の n 件 */
const 連番札 = (token: string, n: number, 日?: (i: number, c: string) => string): 札[] =>
  Array.from({ length: n }, (_, i) => ({ 英: `${token}-${英字[i]}`, 日: 日?.(i, 英字[i]) }));

const 呼び名単独 = (label: string) => [`〔カードID-${label}〕`];

// 11件（カードID降順・10件表示で2ページ目に1件）
for (const [id, token, prefix] of [
  ["S-M14-01-LASTPAGE-READ", "M1401LPREAD", "M1401-共有LPREAD-"],
  ["S-M14-01-RETAIN-061", "M1401-061", "M1401-061"],
  ["S-M14-01-RETAIN-077", "M1401-077", "M1401-077"],
  ["S-M14-01-NOCOND-063", "M1401-063", "M1401-063"],
  ["S-M14-01-NOCOND-078", "M1401-078", "M1401-078"],
  ["S-M14-01-PREVHIDE-071", "M1401-071", "M1401-071"],
  ["S-M14-01-NEXTHIDE-072", "M1401-072", "M1401-072"],
  ["S-M14-01-LASTPAGE-043", "M1401LP043", "M1401-043"],
] as const) {
  defineSeed(id, async ({ browser, notes }) => {
    const cards = id === "S-M14-01-LASTPAGE-READ"
      ? Array.from({ length: 11 }, (_, i) => ({ 英: `${token}-${String(i + 1).padStart(2, "0")}` }))
      : id === "S-M14-01-LASTPAGE-043"
        ? Array.from({ length: 11 }, (_, i) => ({ 英: `${token}-${String(i + 1).padStart(2, "0")}` }))
        : 連番札(token, 11);
    await カードの組を作る(browser, id, notes, token, cards, 呼び名(prefix, 11));
  });
}

// マナ・コスト 4,1,3,2 の4件（並び順の表示確認）
for (const [id, token] of [["S-M14-01-SORTBTN-067", "M1401-067"], ["S-M14-01-SORTBTN-068", "M1401-068"], ["S-M14-01-SORTKEYS-069", "M1401-069"], ["S-M14-01-SORTDIR-070", "M1401-070"], ["S-M14-01-SORTKEEP-062", "M1401-062"]] as const) {
  defineSeed(id, async ({ browser, notes }) => {
    const cmc = ["4", "1", "3", "2"];
    await カードの組を作る(browser, id, notes, token, 連番札(token, 4).map((c, i) => ({ ...c, cmc: cmc[i] })), 呼び名(token, 4));
  });
}

// Foil なし・通常・特殊・特殊
defineSeed("S-M14-01-FOIL-059", async ({ browser, notes }) => {
  const token = "M1401-059";
  const foil = ["なし", "通常", "特殊", "特殊"];
  await カードの組を作る(browser, "S-M14-01-FOIL-059", notes, token, 連番札(token, 4).map((c, i) => ({ ...c, Foil: foil[i] })), 呼び名(token, 4));
});

// 削除試験カード（カード名(日)に「削除試験カード」を含む）
for (const [id, token, n] of [
  ["S-M14-01-DELETE-049", "M1401DEL049", 3], ["S-M14-01-DELETE-050", "M1401DEL050", 3], ["S-M14-01-DELETE-053", "M1401DEL053", 1], ["S-M14-01-DELETE-056", "M1401DEL056", 1],
] as const) {
  defineSeed(id, async ({ browser, notes }) => {
    const num = id.slice(-3);
    const cards: 札[] = n === 1
      ? [{ 日: `削除試験カード${num}`, 英: `${token}-A` }]
      : Array.from({ length: n }, (_, i) => ({ 日: `削除試験カード${num}${英字[i]}`, 英: `${token}-${英字[i]}` }));
    // 日本語名の「削除試験カード」は共通の語。検索語は英語名の側（token）で絞る
    const labels = n === 1 ? 呼び名単独(`M1401-${num}`) : 呼び名(`M1401-${num}`, n);
    await カードの組を作る(browser, id, notes, token, cards, labels);
  });
}

// ケースが同じ組を使う、重複削除・CSV・ページ送りの小さな組
defineSeed("S-M14-01-DPDEL1-080", async ({ browser, notes }) => {
  await カードの組を作る(browser, "S-M14-01-DPDEL1-080", notes, "M1401DP080", 連番札("M1401DP080", 3), 呼び名("M1401-080", 3));
});
defineSeed("S-M14-01-DPPAGE1-082", async ({ browser, notes }) => {
  await カードの組を作る(browser, "S-M14-01-DPPAGE1-082", notes, "M1401DP082", 連番札("M1401DP082", 5), 呼び名("M1401-082", 5));
});
defineSeed("S-M14-01-DPCSV1-081", async ({ browser, notes }) => {
  await カードの組を作る(browser, "S-M14-01-DPCSV1-081", notes, "M1401DP081", 連番札("M1401DP081", 2), 呼び名("M1401-081", 2));
});
defineSeed("S-M14-01-DPLAST2-083", async ({ browser, notes }) => {
  const token = "M1401DP083";
  await カードの組を作る(browser, "S-M14-01-DPLAST2-083", notes, token, Array.from({ length: 12 }, (_, i) => ({ 英: `${token}-${String(i + 1).padStart(2, "0")}` })), 呼び名("M1401-083", 12));
});

// 検索語の書き換え・削除の確認（CB）
defineSeed("S-M14-01-CBDEL-097", async ({ browser, notes }) => {
  const token = "M1401-CB097";
  await カードの組を作る(browser, "S-M14-01-CBDEL-097", notes, token, Array.from({ length: 11 }, (_, i) => ({ 英: `${token}-${String(i + 1).padStart(2, "0")}` })), 呼び名("M1401-097", 11));
});
defineSeed("S-M14-01-CBDEL1-098", async ({ browser, notes }) => {
  await カードの組を作る(browser, "S-M14-01-CBDEL1-098", notes, "M1401-CB098", [{ 英: "M1401-CB098-A" }], 呼び名("M1401-098", 1));
});
for (const n of ["099", "100"]) {
  defineSeed(`S-M14-01-CBCOND-${n}`, async ({ browser, notes }) => {
    const token = `M1401-CB${n}`;
    await カードの組を作る(browser, `S-M14-01-CBCOND-${n}`, notes, [`${token}-ALPHA`, `${token}-BRAVO`], [
      { 英: `${token}-ALPHA-A` }, { 英: `${token}-ALPHA-B` }, { 英: `${token}-BRAVO-C` }, { 英: `${token}-BRAVO-D` },
    ], 呼び名(`M1401-${n}`, 4));
  });
}

// 並び順と表示件数の組合せ（12件。マナ・コストと日英の名前の表）
const CB: [string, string, string][] = [
  ["7", "04", "10"], ["3", "09", "02"], ["11", "01", "07"], ["1", "12", "05"], ["9", "06", "12"], ["5", "03", "01"],
  ["12", "10", "04"], ["2", "07", "09"], ["10", "02", "06"], ["4", "11", "03"], ["8", "05", "11"], ["6", "08", "08"],
];
for (const n of ["085", "086", "087", "088", "089", "090", "091", "092", "093", "094", "095", "096"]) {
  defineSeed(`S-M14-01-CBSORT-${n}`, async ({ browser, notes }) => {
    const token = `M1401-CB${n}`;
    const mana = n === "092" || n === "093";
    await カードの組を作る(browser, `S-M14-01-CBSORT-${n}`, notes, token, CB.map(([cmc, j, e]) => ({
      日: `${token}-J${j}`, 英: `${token}-E${e}`, cmc, マナ: mana ? cmc.padStart(2, "0") : undefined,
    })), 呼び名(`M1401-${n}`, 12));
  });
}

// リーガリティ検索（スタンダードの使用可・制限・禁止）
defineSeed("S-M14-01-LEGALITY", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes }) => {
  const token = "M1401LEGALITY";
  const rs = ["使用可", "制限", "禁止"];
  await カードの組を作る(browser, "S-M14-01-LEGALITY", notes, token, rs.map((r, i) => ({
    英: `${token}-${英字[i]}`, リーガリティ: [{ フォーマット: "スタンダード", リーガリティ: r }],
  })), 呼び名("M1401-共有LEGALITY-", 3));
});

// 保持値の確認だけの小さなマスター（クリア確認用）
defineSeed("S-M14-01-CLEAR-060", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const sid = seed.シードID;
    await ensureMaster(page, "カードタイプ", rc("M1401-060-TYPE"), rc("M1401-060-TYPE"), sid);
    await ensureMaster(page, "サブタイプ", rc("M1401-060-SUB"), rc("M1401-060-SUB"), sid);
    await ensureMaster(page, "特殊タイプ", rc("M1401-060-SPC"), rc("M1401-060-SPC"), sid);
    await ensureMaster(page, "イラストレーター", rc("M1401-060-ART"), rc("M1401-060-ART"), sid);
    await ensureMaster(page, "プロモーション", rc("M1401-060-PROMO"), rc("M1401-060-PROMO"), sid);
    await ensureCardset(page, rc("M1401-060-SET"), rc("M1401-060-SET"), `M14060${RUN_MARK}`, issue);
  });
});

// 画面の固定の選択肢・検索条件の入力保持だけを見るシード（カードを登録しない）
for (const id of ["S-M14-01-COLOROPT-073", "S-M14-01-IDCOLOROPT-074", "S-M14-01-FOILOPT-075"]) {
  defineSeed(id, async () => { /* カードを登録しない。固定の選択肢を見る */ });
}

// カード名リスト作成の確認モーダルをキャンセルするだけのケース用（カードを1件。リストのファイルは作らない）
defineSeed("S-M14-01-BATCH-008", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes }) => {
  await カードの組を作る(browser, "S-M14-01-BATCH-008", notes, "M1401Card008", [{
    日: "カード名リスト試験008A", 英: "M1401Card008A",
    リーガリティ: [{ フォーマット: "スタンダード", リーガリティ: "使用可" }, { フォーマット: "モダン", リーガリティ: "使用可" }],
  }], 呼び名単独("M1401-008"));
});

// ---------------------------------------------------------------------------
// 検索条件確認カード（FILTER）・削除試験カード（DELETE-READ）。更新日時は DB で設定する
// ---------------------------------------------------------------------------

const 更新日時 = "2026-09-01 00:00:00+09";

defineSeed("S-M14-01-FILTER", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
  const T = "M1401FILTER";
  const 以外 = { レアリティ: ["レア", "アンコモン"], レイアウト: ["通常", "分割"], プロモ種別: ["Promo A", "Promo B"] };
  const 札群: 札[] = [
    { 日: "蒼天の探索者", 英: "Azure Alpha", 追加: {
      ルールテキスト日: "警戒を持つ", ルールテキスト英: 印(T, `${T} Bravo vigilance`), カラー: ["白"], 固有色: ["白"],
      カードタイプ: ["クリーチャー"], サブタイプ: ["ウィザード"], 特殊タイプ: ["伝説"],
      リーガリティ: [{ フォーマット: "スタンダード", リーガリティ: "使用可" }],
      詳細: { カードセット: "SET-A", レアリティ: "レア", レイアウト: "通常", イラストレーター: "Artist A", プロモ種別: "Promo A", Foil: "なし", フレーム: "通常" },
    } },
    { 日: "白銀の守護者", 英: "Alpha Sentinel", 追加: {
      ルールテキスト日: "先制攻撃", ルールテキスト英: 印(T, `${T} First strike`), カラー: ["青"], 固有色: ["白", "青"],
      カードタイプ: ["ソーサリー"], サブタイプ: ["秘儀"], 特殊タイプ: ["氷雪"],
      リーガリティ: [{ フォーマット: "モダン", リーガリティ: "使用可" }],
      詳細: { カードセット: "SET-B", レアリティ: "アンコモン", レイアウト: "分割", イラストレーター: "Artist B", プロモ種別: "Promo B", Foil: "通常", フレーム: "特殊" },
    } },
    { 日: "紅蓮の破壊者", 英: "Crimson Ruin", 追加: {
      ルールテキスト日: "速攻", ルールテキスト英: 印(T, `${T} Bravo haste`), カラー: ["赤"], 固有色: ["青"],
      詳細: { 以外, Foil: "特殊", フレーム: "通常" },
    } },
    { 日: "無色の観測者", 英: "Colorless Watcher", 追加: {
      ルールテキスト英: 印(T, T), カラー: ["無色"], 固有色: ["無色"],
      詳細: { 以外, Foil: "特殊", フレーム: "特殊" },
    } },
  ];
  const labels = 呼び名("M1401-共有FILTER-", 4);
  await カードの組を作る(browser, seed.シードID, notes, T, 札群, labels);
  カードの更新日時を設定する(labels.map((l) => notes.get(l)), 更新日時, "検索専用カードの更新日時（2026-09-01 00:00:00 JST）は画面で指定できないため");
  reportSeedIssue(seed.シードID, "シード作成時の問題: 更新日時（2026-09-01 00:00:00 JST）は画面で指定できないため、DBで画面から作った印つきの4件の更新日時を設定した。レアリティ・レイアウト・プロモ種別は、既存の選択肢から正本が除く名前以外のものを選んだ（マスターには足していない）。検索語M1401FILTERは実行の印つきにした。");
});

defineSeed("S-M14-01-DELETE-READ", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
  const T = "M1401DELREAD";
  const labels = 呼び名("M1401-共有DELREAD-", 3);
  await カードの組を作る(browser, seed.シードID, notes, T, 英字.slice(0, 3).split("").map((c) => ({ 日: `削除試験カード${c}`, 英: `${T}-${c}` })), labels);
  カードの更新日時を設定する(labels.map((l) => notes.get(l)), 更新日時, "削除試験カードの更新日時（2026-09-01 00:00:00 JST）は画面で指定できないため");
  reportSeedIssue(seed.シードID, "シード作成時の問題: 更新日時（2026-09-01 00:00:00 JST）は画面で指定できないため、DBで画面から作った印つきの3件の更新日時を設定した。検索語M1401DELREADは実行の印つきにした。");
});

// ---------------------------------------------------------------------------
// カード名リスト作成（ファイルは消さない・書き換えない。作成後の内容だけを確かめる）
// ---------------------------------------------------------------------------

defineSeed("S-M14-01-LISTFILES", async () => { /* カード名リストのファイルは共有のデータなので、消さない・書き換えない（ケースは作成後の内容だけを確かめる） */ });

const 標準 = { フォーマット: "スタンダード", リーガリティ: "使用可" };
const 現代 = { フォーマット: "モダン", リーガリティ: "使用可" };

for (const n of ["006", "007"]) {
  defineSeed(`S-M14-01-BATCH-${n}`, { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
    const T = `M1401Card${n}`;
    await カードの組を作る(browser, seed.シードID, notes, T, ["A", "B"].map((c) => ({
      日: rc(`カード名リスト試験${n}${c}`), 英: `${T}${c}`, リーガリティ: [標準, 現代],
    })), 呼び名(`M1401-${n}`, 2));
    reportSeedIssue(seed.シードID, "シード作成時の問題: カード名リストのファイルを開始時に消す操作は、共有のデータのため行わない。カード名は実行の印つきにし、作成後のファイルに印つきの名前が入ることで確かめた。");
  });
}

for (const n of ["066", "079"]) {
  defineSeed(`S-M14-01-LISTFMT-${n}`, { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
    const T = `M1401-${n}`;
    await カードの組を作る(browser, seed.シードID, notes, T, [
      { 日: rc(`カード名リスト試験${n}A`), 英: `${T}-A`, リーガリティ: [標準] },
      { 日: rc(`カード名リスト試験${n}B`), 英: `${T}-B`, リーガリティ: [現代] },
    ], 呼び名(`M1401-${n}`, 2));
    reportSeedIssue(seed.シードID, "シード作成時の問題: カード名リストのファイルを開始時に消す操作は、共有のデータのため行わない。カード名は実行の印つきにした。");
  });
}

defineSeed("S-M14-01-DPNOCODE-084", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
  const T = "M1401DP084";
  await カードの組を作る(browser, seed.シードID, notes, T, [{ 英: `${T}-A`, リーガリティ: [{ フォーマット: "試験フォーマット", リーガリティ: "使用可" }] }], 呼び名("M1401-084", 1));
  reportSeedIssue(seed.シードID, "シード作成時の問題: フォーマット「コード無し試験フォーマット084」は新しく登録せず、S-M14-01-MASTER で登録済みのコードが空の「試験フォーマット」を使った。ファイルの削除は共有のデータのため行わない。");
});

defineSeed("S-M14-01-CBLIST-102", { needs: ["S-M14-01-MASTER"] }, async ({ browser, notes, seed }) => {
  const T = "M1401-CB102";
  await カードの組を作る(browser, seed.シードID, notes, T, [
    { 日: `カード名リスト試験${T}-X`, 英: `${T}/${T}-X`, リーガリティ: [現代] },
    { 日: `カード名リスト試験${T}-Y`, 英: `${T}-Y`, リーガリティ: [標準] },
  ], 呼び名("M1401-102", 2));
  reportSeedIssue(seed.シードID, "シード作成時の問題: カード名リストのファイルを開始時に消す操作は、共有のデータのため行わない。カード名（英）は実行の印つきにした（スラッシュを含む名前も、印を付けた形で登録した）。");
});
