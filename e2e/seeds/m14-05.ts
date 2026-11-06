/**
 * M14-05 カード登録CSVアップロード のシードの作り方（画面操作）。正本: cases/M14-05_seed_data.tsv
 * - 試験管理者・参照マスタ: 画面で「あれば使い、無ければ登録する」（マスタは英語名で引く。手元に無かったのはカードタイプ「_enchantment」とプロモ種別「Promotion」）。
 * - 既存カード: カードCSVの取込で作る。カード名(英語)は実行ごとの印を付ける（CSV内の同名は同名として更新・新規が決まるため、前の実行と重ならない）。
 * - カード詳細IDは正本が固定の番号なので、前の実行の残りが同じ番号を持つと取り込めない。取込の前に番号で探し（参照）、
 *   そのカードを画面の削除ボタンで消す（試験専用の番号のカードだけ。シード表の「同じカードを削除」と同じ操作）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { マスターの件数, 詳細IDのカードID } from "../db/m14_05_card_csv";
import { buildCardCsv, uploadCardCsv } from "../pages/admin/card_csv";
import { 雛形の見出し } from "../pages/admin/m14_05_csv";
import { CardSearchPage, ensureMaster } from "../pages/admin/m14_card";
import { 画面でカードを消す } from "./m14-04";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1405_ADMIN: Account = { loginId: "m1405_admin", password: "Passw0rd!M1405" };

defineSeed("S-M14-05-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-05試験管理者", account: M1405_ADMIN, メール: "m1405_admin@example.test" });
});

defineSeed("S-M14-05-MASTERS", async ({ browser, seed }) => {
  const 無い: { 種別: Parameters<typeof ensureMaster>[1]; 名: string; コード?: string }[] = [];
  if (マスターの件数("cardtype", "_enchantment") === 0) 無い.push({ 種別: "カードタイプ", 名: "_enchantment" });
  if (マスターの件数("promotion", "Promotion") === 0) 無い.push({ 種別: "プロモーション", 名: "Promotion", コード: "M1405PROMO" });
  // 画面から足さない種別（カラー・フォーマット・カードセット・色順など）は手元に元からある。無ければ作り方が決まらないので落とす
  const 必須: [Parameters<typeof マスターの件数>[0], string][] = [
    ["color", "White"], ["color", "Blue"], ["subtype", "Adventure"], ["subtype", "Advisor"], ["specialtype", "Basic"], ["specialtype", "Legendary"],
    ["format", "Legacy"], ["format", "Modern"], ["format", "Vintage"], ["format", "Commander"], ["format", "Pioneer"], ["cardset", "Aether Revolt"],
    ["rarity", "Uncommon"], ["illustrator", "Jung Park"], ["layout", "Normal"], ["layout", "Meld"], ["cardtype", "Creature"], ["promotion", "Non Promotion"],
  ];
  for (const [種別, 名] of 必須) if (マスターの件数(種別, 名) === 0) throw new Error(`S-M14-05-MASTERS: 参照マスタ（${種別}）に「${名}」が無い`);
  if (無い.length === 0) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const m of 無い) await ensureMaster(page, m.種別, m.名, m.名, seed.シードID, m.コード);
  });
});

/** 取込前の状態として作る既存カードのCSV行（書かない列は空） */
export type 既存行 = Record<string, string>;
const 既定 = (o: 既存行): 既存行 => ({ rarity: "Uncommon", layout: "Normal", cmc: "1", image_en: `img/m1405/pre-${o.card_detail_id ?? "x"}.jpg`, ...o });

async function 番号のカードを片付ける(browser: Browser, 詳細IDs: string[], what: string): Promise<void> {
  const 対象 = 詳細IDs.map((d) => ({ d, id: 詳細IDのカードID(d) })).filter((x) => x.id);
  if (対象.length === 0) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const done = new Set<string>();
    for (const { d, id } of 対象) {
      if (done.has(id!)) continue;
      done.add(id!);
      await 画面でカードを消す(page, id!, what);
      reportSeedIssue(what, `前の実行で作ったカード（ID ${id}、詳細ID ${d}）を画面の削除ボタンで消してから進めた`);
    }
  });
}

type 専用 = {
  /** 取込の前に空けておく詳細ID（前の実行の残りを消す） */
  詳細IDs: string[];
  /** 取込前の状態として、カードCSVで作る既存カード（1回の取込にまとめる） */
  既存?: () => 既存行[];
  /** 既存カードのカードIDを控える呼び名と、探すカード名(英) */
  控え?: { 呼び名: string; 名: () => string };
};

export const 名E = (n: string) => rc(`M1405X-Existing-${n}`);
const 既存1 = (n: string, extra: 既存行 = {}): 専用 => ({
  詳細IDs: [`1450010${n}`],
  既存: () => [既定({ name_en: 名E(n), card_detail_id: `1450010${n}`, card_no: "1", foil: "0", frame: "Normal", ...extra })],
  控え: { 呼び名: `〔カードID-M1405-0${n}〕`, 名: () => 名E(n) },
});
const 新規のみ = (...詳細IDs: string[]): 専用 => ({ 詳細IDs });

export const CB名 = (n: string) => rc(`M1405-CB${n}-A`);
const CB既存 = (n: string, 既存の詳細: string[], extra: 既存行 = {}, 空ける: string[] = 既存の詳細): 専用 => ({
  詳細IDs: 空ける,
  既存: () => 既存の詳細.map((d) => 既定({ name_en: CB名(n), card_detail_id: d, cmc: "9", ...extra })),
});

export const 専用シード: Record<string, 専用> = {
  "VALID-002": 新規のみ("145101002", "145102002"),
  "VALID-003": 新規のみ("145101003", "145102003"),
  "VALID-004": 既存1("04"),
  "VALID-005": 新規のみ(),
  "VALIDATION-010": 既存1("10"),
  "TRANSACTION-016": 既存1("16"),
  "HEADER-017": 既存1("17"),
  "HEADER-018": 既存1("18"),
  "HEADER-019": 既存1("19"),
  "VALID-021": 既存1("21"),
  "HEADER-022": 既存1("22"),
  "TRANSACTION-024": 新規のみ(),
  "TRANSACTION-025": 新規のみ(),
  "TRANSACTION-026": 既存1("26"),
  "EMPTYRESET-027": {
    詳細IDs: ["145001027", "145002027"],
    // 裏面カード詳細IDは、相手の詳細が先にあるときだけ入れられるので、裏面になる詳細（145002027）を先の行にする
    既存: () => [
      既定({ name_en: 名E("27"), card_detail_id: "145002027", card_no: "1", foil: "0", frame: "Normal" }),
      既定({ name_en: 名E("27"), card_detail_id: "145001027", back_card_detail_id: "145002027", card_no: "1", foil: "0", frame: "Normal" }),
    ],
    控え: { 呼び名: "〔カードID-M1405-027〕", 名: () => 名E("27") },
  },
  "EMPTYRESET-028": 既存1("28", { color_sequence: "マルチ-白青", color: "White,Blue" }),
  "RELATION-029": 既存1("29"),
  "RELATION-030": 既存1("30", { cardtype: "Creature", color: "White", color_identity: "White", subtype: "Adventure", specialtype: "Basic" }),
  "RELATION-031": 既存1("31"),
  "RELATION-032": 既存1("32", { format: "Legacy,Modern" }),
  "RELATION-033": 既存1("33", { format: "Legacy,Modern" }),
  "EMPTYRESET-034": 既存1("34", { promotion_type: "Promotion" }),
  "READING-035": 新規のみ(),
  "TSV-043": 既存1("43"),
  "TSV-044": 新規のみ(),
  "VALID-048": 新規のみ("14520481"),
  "MASTERMISS-049": 新規のみ("14520491"),
  "MASTERMISS-050": 新規のみ("14520501"),
  "MASTERMISS-051": 新規のみ("14520511"),
  "MASTERMISS-052": 新規のみ("14520521"),
  "MASTERMISS-053": 新規のみ("14520531"),
  "MASTERMISS-054": 新規のみ("14520541"),
  "MASTERMISS-055": 新規のみ("14520551"),
  "MASTERMISS-056": 新規のみ("14520561"),
  "VALID-057": 新規のみ("14520571"),
  "VALID-058": 新規のみ("14520581"),
  "VALIDATION-059": 新規のみ("14520591"),
  "VALID-060": 新規のみ("14520601", "14520602"),
  "VALIDATION-061": 新規のみ("14520611"),
  "VALIDATION-062": 新規のみ("14520621"),
  "VALID-063": 新規のみ("14520631"),
  "VALID-064": 新規のみ("14520641"),
  "VALID-065": 新規のみ("14520651"),
  "VALID-066": 新規のみ("14520661"),
  "VALID-067": 新規のみ("14520671"),
  "MIXED-068": {
    詳細IDs: ["14520681", "14520682"],
    既存: () => [既定({ name_en: rc("M1405-068-B"), card_detail_id: "14520682", cmc: "1" })],
    控え: { 呼び名: "〔カードID-M1405-068〕", 名: () => rc("M1405-068-B") },
  },
  "REPEAT-069": 新規のみ("14520691"),
  "SINGLE-070": 新規のみ("14520701"),
  "FORMAT-071": 新規のみ("14520711"),
  "FORMAT-072": 新規のみ("14520721"),
  "CBCSV-074": 新規のみ(), "CBCSV-075": 新規のみ(), "CBCSV-076": 新規のみ(), "CBCSV-077": 新規のみ(),
  "CBCSV-078": CB既存("078", ["14570789"], { specialtype: "Legendary", format: "Pioneer" }),
  "CBCSV-079": CB既存("079", ["14570799"], { format: "Legacy,Modern" }, ["14570799", "14570791"]),
  "CBCSV-082": CB既存("082", ["14570829"], { format: "Legacy,Modern" }, ["14570829", "14570821", "14570822"]),
  "CBCSV-083": 新規のみ("14570831"),
  "CBCSV-084": CB既存("084", ["14570841", "14570842"], { format: "Legacy,Modern", card_no: "1", frame: "Normal" }),
  "CBCSV-085": CB既存("085", ["14570851"], { specialtype: "Legendary", format: "Legacy,Modern", card_no: "1", frame: "Normal" }),
  "CBCSV-086": CB既存("086", ["14570861"], { color: "Blue", format: "Pioneer", card_no: "1", frame: "Normal" }),
  "CBCSV-087": CB既存("087", ["14570871"], { color: "Blue", subtype: "Advisor", format: "Legacy,Modern", card_no: "1", frame: "Normal" }),
  "CBCSV-088": 新規のみ(), "CBCSV-089": 新規のみ(),
};

/** レイアウト Split・Flip（無ければ画面で登録する。Normal・Meld は参照マスタ） */
defineSeed("S-M14-05-CBLAYOUT-SPLITFLIP", async ({ browser, seed }) => {
  const 無い = (["Split", "Flip"] as const).filter((n) => マスターの件数("layout", n) === 0);
  if (無い.length === 0) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 無い) await ensureMaster(page, "カードレイアウト", n, n, seed.シードID);
  });
});

for (const [suffix, c] of Object.entries(専用シード)) {
  defineSeed(`S-M14-05-${suffix}`, { needs: ["S-M14-05-MASTERS"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await 番号のカードを片付ける(browser, c.詳細IDs, seed.シードID);
    if (!c.既存) return;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const csv = buildCardCsv(await 雛形の見出し(page), c.既存!());
      await uploadCardCsv(page, csv, `m14-05-pre-${suffix.toLowerCase()}.csv`, `${seed.シードID} の取込前カードのCSV登録`, issue);
      if (c.控え) {
        const l = new CardSearchPage(page);
        await l.open();
        await l.キーワードで検索する(c.控え.名());
        const ids = await l.表示中のカードID();
        if (ids.length !== 1) throw new Error(`${seed.シードID}: 取込前のカードが一覧で ${ids.length} 件になった`);
        notes.set(c.控え.呼び名, ids[0]);
      }
    });
  });
}
