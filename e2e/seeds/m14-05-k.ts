// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M14-05 カード登録CSVアップロード のシードの作り方（画面操作）。正本: cases/M14-05_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で「あれば使い、無ければ登録する」（システム管理者の権限。カード管理を操作できる）。
 * - CSV参照マスタ: MTGマスターデータ管理・フォーマット登録・カードセット詳細で、英語名（色順は名称）が無いものだけ登録する。
 *   「残りの列も埋めて」の値は正本で決まらないので、日本語名は英語名と同じ、コードは英数字の短い値、並び順は既存の最大＋1 とする。
 * - 取込ファイル: 見出し行は画面の「雛形ファイルダウンロード」で得る（シード S-M14-05-VALID-057 の作り方。ほかのシードは見出しを定めない）。
 *   実行のたびに .state/m14-05 に作る（中身は正本の値。書かない項目は空。文字コード UTF-8・改行 LF。035 だけ BOM 付き・CRLF）。
 * - カードの「未登録」: カード一覧で名前を検索し、カード名がちょうど一致する行だけを削除ボタンで消す（カード詳細も併せて消える）。
 * - 既存カード: 登録用のCSVをカード登録CSVアップロードで取り込み、カード一覧で検索してカードIDを控える。
 *
 * 正本で値が決まらず、ここで決めたもの（記録の「シードでの解釈」に書く）:
 * - 登録用のCSV・「正常行」・「更新行」の必須のレアリティ・レイアウトは S-M14-05-MASTERS の Uncommon・Normal、
 *   画像URL(英語)は任意の値 m14-05-<番号>-pre-en.jpg（正常行は m14-05-<番号>-<a|b>-en.jpg）。更新用のCSVは登録用と同じ必須の値を書く。
 * - 029・030・031 の更新用のCSVのカード詳細IDは、登録済みのカード詳細ID（1450010xx）を書く（新しいカード詳細を足さない）。
 * - 024 の「列数不足」は2行目の末尾の1列を除く。025 の「必須項目が空」は2行目の必須4項目（カード名(英語)・レアリティ・レイアウト・画像URL(英語)）をすべて空にする。
 * - 035 のゼロ幅スペースは「M1405 BOM」と「 Card」の間に入れる。必須のレアリティ・レイアウト・画像URL(英語) は Uncommon・Normal・m14-05-035-en.jpg。
 * - 044 の「登録可能な1データ行」は、カード名(英語)と必須の Uncommon・Normal・m14-05-044-en.jpg。
 *
 * 作らないシード（ケースを実装しない）: VALID-002・003・004（全採用列・更新行の値が決まらない）、HEADER-017・018・019・022・VALID-021・TSV-043
 * （削除する列・追加する列の名前・更新行の値が決まらない）、VALID-020・TRANSACTION-026（DB での準備）、RJ-ADM・RJ-CARD-073（記録の判断待ち）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page } from "@playwright/test";
import { STATE_DIR } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { Account, withAdminSession } from "../lib/session";
import {
  カードCSVの行, カードCSVの形, カードCSVの見出し, カードCSVを組む, カードセットを消す, カードセットを用意する, カード一覧で探す, カード一覧から消す,
  シードのCSVを取り込む, フォーマットを用意する, マスターの行を消す, マスターを用意する, マスター種別,
} from "../pages/admin/m14_05_card_csv_upload";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1405_ADMIN: Account = { loginId: "m1405_admin", password: "Passw0rd!M1405" };

const DIR = path.join(STATE_DIR, "m14-05");

/** シードが作った取込ファイルの置き場所（無ければ止める） */
export function m1405File(name: string): string {
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) throw new Error(`取込ファイル ${name} が無い（シードが作っていない）`);
  return p;
}

/** 必須のレアリティ・レイアウト（S-M14-05-MASTERS の値） */
const 必須 = { レアリティ: "Uncommon", レイアウト: "Normal" } as const;

async function ファイルを作る(page: Page, name: string, rows: カードCSVの行[], 形: カードCSVの形 = {}): Promise<string> {
  const 見出し = await カードCSVの見出し(page);
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, name);
  fs.writeFileSync(file, カードCSVを組む(見出し, rows, 形));
  return file;
}

type 用意 = {
  /** 未登録にするカード名(英語)（カード一覧で検索して消す） */
  消す?: (string | { 名: string; 検索語: string })[];
  /** 登録済みにするカード（登録用のCSVを取り込む）。控える: カードIDを控える呼び名 */
  既存?: { ファイル: string; 行: カードCSVの行[]; 名: string; 控える?: string };
  /** 手元に置く取込ファイル */
  ファイル: { 名: string; 行: カードCSVの行[]; 形?: カードCSVの形 };
  /** マスターの準備（カードの準備の前に行う） */
  マスター?: (page: Page, seedId: string) => Promise<void>;
};

/** ケース専用のシード: 消す → マスター → 既存カードを登録してカードIDを控える → 取込ファイルを作る */
function defineCaseSeed(seedId: string, v: 用意, needs: string[] = ["S-M14-05-ADM", "S-M14-05-MASTERS"]): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1405_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const issue = (m: string) => reportSeedIssue(seedId, m);
      for (const c of v.消す ?? []) {
        const { 名, 検索語 } = typeof c === "string" ? { 名: c, 検索語: c } : c;
        const n = await カード一覧から消す(page, 名, 検索語);
        if (n) issue(`前の実行の残りのカード「${名}」を ${n} 件、カード一覧の削除ボタンで消した`);
      }
      if (v.マスター) await v.マスター(page, seedId);
      if (v.既存) await 既存カードを登録する(page, notes, seedId, v.既存);
      await ファイルを作る(page, v.ファイル.名, v.ファイル.行, v.ファイル.形);
    });
  });
}

async function 既存カードを登録する(page: Page, notes: Notes, seedId: string, e: NonNullable<用意["既存"]>): Promise<void> {
  const file = await ファイルを作る(page, e.ファイル, e.行);
  for (const w of await シードのCSVを取り込む(page, file, `${seedId}: ${e.ファイル} の取込`)) reportSeedIssue(seedId, w);
  const ids = await カード一覧で探す(page, e.名);
  if (ids.length !== 1) throw new Error(`${seedId}: 取り込んだカード「${e.名}」がカード一覧に ${ids.length} 件ある（1件のはず）`);
  if (e.控える) notes.set(e.控える, ids[0]);
}

const マスターの値: [マスター種別, string[]][] = [
  ["カードタイプ", ["Creature", "_enchantment"]],
  ["カラー", ["White", "Blue"]],
  ["サブタイプ", ["Adventure", "Advisor"]],
  ["特殊タイプ", ["Basic", "Legendary"]],
  ["レアリティ", ["Uncommon"]],
  ["イラストレーター", ["Jung Park"]],
  ["カードレイアウト", ["Normal", "Meld"]],
  ["プロモーション", ["Non Promotion", "Promotion"]],
  ["色順", ["マルチ-白青"]],
];

// ---------------------------------------------------------------------------
// ケース専用のシード
// ---------------------------------------------------------------------------

const 既存名 = (n: string) => `M1405X-Existing-${n}`;
const 登録用画像 = (n: string) => `m14-05-${n}-pre-en.jpg`;

/** 「カード名(英語)=M1405X-Existing-nnn、カード詳細ID=1450010nn」の既存カードを持つシード */
function defineExistingCardSeed(seedId: string, n: string, 登録の追加: カードCSVの行, ファイル: string, 更新行: (base: カードCSVの行) => カードCSVの行[], 追加で消す: string[] = []): void {
  const 名 = 既存名(n);
  const base: カードCSVの行 = { "カード名(英語)": 名, カード詳細ID: `145001${n}`, ...必須, "画像URL(英語)": 登録用画像(n) };
  defineCaseSeed(seedId, {
    消す: [名, ...追加で消す],
    既存: { ファイル: `m14-05_${n}-pre.csv`, 行: [{ ...base, ...登録の追加 }], 名, 控える: `〔カードID-M1405-${n}〕` },
    ファイル: { 名: ファイル, 行: 更新行(base) },
  });
}

defineCaseSeed("S-M14-05-VALID-005", {
  消す: ["M1405 Required Only"],
  ファイル: { 名: "m14-05_optional_empty-005.csv", 行: [{ "カード名(英語)": "M1405 Required Only", ...必須, "画像URL(英語)": "m14-05-required-only-en-005.jpg" }] },
});

defineExistingCardSeed("S-M14-05-VALIDATION-010", "010", { 点数で見たマナコスト: "1", カードNo: "1", Foil: "0" }, "m14-05_numeric_max-010.csv",
  (b) => [{ ...b, 点数で見たマナコスト: "10", カードNo: "16", Foil: "1" }]);

defineExistingCardSeed("S-M14-05-TRANSACTION-016", "016", {}, "m14-05_master_rollback-016.csv", () => [
  { "カード名(英語)": "M1405X-MasterRollbackA-016", ...必須, "画像URL(英語)": "m14-05-016-a-en.jpg" },
  { "カード名(英語)": "M1405X-MasterRollbackB-016", カードタイプ: "NotRegistered-016", ...必須, "画像URL(英語)": "m14-05-016-b-en.jpg" },
], ["M1405X-MasterRollbackA-016", "M1405X-MasterRollbackB-016"]);

defineCaseSeed("S-M14-05-TRANSACTION-024", {
  消す: ["M1405X-RowMismatchA-024", "M1405X-RowMismatchB-024"],
  ファイル: { 名: "m14-05_row_mismatch-024.csv", 行: [
    { "カード名(英語)": "M1405X-RowMismatchA-024", ...必須, "画像URL(英語)": "m14-05-024-a-en.jpg" },
    { "カード名(英語)": "M1405X-RowMismatchB-024", ...必須, "画像URL(英語)": "m14-05-024-b-en.jpg", 末尾の列を除く: 1 },
  ] },
});

defineCaseSeed("S-M14-05-TRANSACTION-025", {
  消す: ["M1405X-RequiredRollbackA-025", "M1405X-RequiredRollbackB-025"],
  ファイル: { 名: "m14-05_required_rollback-025.csv", 行: [
    { "カード名(英語)": "M1405X-RequiredRollbackA-025", ...必須, "画像URL(英語)": "m14-05-025-a-en.jpg" },
    { "カード名(日本語)": "M1405X-RequiredRollbackB-025" },
  ] },
});

// 027: 登録用のCSVは2データ行（1行目=裏面のカード詳細145002027、2行目=カード詳細145001027・裏面145002027）
defineCaseSeed("S-M14-05-EMPTYRESET-027", {
  消す: [既存名("027")],
  既存: { ファイル: "m14-05_027-pre.csv", 名: 既存名("027"), 控える: "〔カードID-M1405-027〕", 行: [
    { "カード名(英語)": 既存名("027"), カード詳細ID: "145002027", ...必須, "画像URL(英語)": 登録用画像("027") },
    { "カード名(英語)": 既存名("027"), カード詳細ID: "145001027", 裏面カード詳細ID: "145002027", ...必須, "画像URL(英語)": 登録用画像("027") },
  ] },
  ファイル: { 名: "m14-05_back_empty-027.csv", 行: [{ "カード名(英語)": 既存名("027"), カード詳細ID: "145001027", ...必須, "画像URL(英語)": 登録用画像("027") }] },
});

defineExistingCardSeed("S-M14-05-EMPTYRESET-028", "028", { 色順: "マルチ-白青" }, "m14-05_color_order_empty-028.csv", (b) => [{ ...b }]);

defineExistingCardSeed("S-M14-05-RELATION-029", "029", {}, "m14-05_relation_dedupe-029.csv", (b) => [{
  ...b, カードタイプ: "Creature,Creature/_enchantment", カラー: "White,White/Blue", 固有色: "White,White/Blue",
  サブタイプ: "Adventure,Adventure/Advisor", 特殊タイプ: "Basic,Basic/Legendary",
}]);

defineExistingCardSeed("S-M14-05-RELATION-030", "030", { カードタイプ: "Creature", カラー: "White", 固有色: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic" },
  "m14-05_relation_empty-030.csv", (b) => [{ ...b }]);

defineExistingCardSeed("S-M14-05-RELATION-031", "031", {}, "m14-05_relation_duplicate_name-031.csv", (b) => [
  { ...b, カードタイプ: "Creature", カラー: "White", 固有色: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic" },
  { ...b, カードタイプ: "_enchantment", カラー: "Blue", 固有色: "Blue", サブタイプ: "Advisor", 特殊タイプ: "Legendary" },
]);

defineExistingCardSeed("S-M14-05-RELATION-032", "032", { 使用可能フォーマット: "Legacy,Modern" }, "m14-05_format_replace-032.csv", (b) => [{ ...b, 使用可能フォーマット: "Modern" }]);
defineExistingCardSeed("S-M14-05-RELATION-033", "033", { 使用可能フォーマット: "Legacy,Modern" }, "m14-05_format_empty-033.csv", (b) => [{ ...b }]);
defineExistingCardSeed("S-M14-05-EMPTYRESET-034", "034", { プロモ種別: "Promotion" }, "m14-05_promotion_empty-034.csv", (b) => [{ ...b }]);

defineCaseSeed("S-M14-05-READING-035", {
  消す: ["M1405 BOM Card"],
  ファイル: {
    名: "m14-05_bom_zwsp_crlf-035.csv",
    行: [{ "カード名(英語)": "M1405 BOM​ Card", ...必須, "画像URL(英語)": "m14-05-035-en.jpg" }],
    形: { BOM: true, 改行: "\r\n" },
  },
});

defineCaseSeed("S-M14-05-TSV-044", {
  消す: ["M1405X-TSVCard-044"],
  ファイル: { 名: "m14-05_valid-044.tsv", 行: [{ "カード名(英語)": "M1405X-TSVCard-044", ...必須, "画像URL(英語)": "m14-05-044-en.jpg" }], 形: { 区切り: "\t" } },
});

/** 「カード名(英語)=M1405-nnn-A、カード詳細ID=1452nnn1、…、他の列は空」の1データ行の新規カード */
function defineNewRowSeed(seedId: string, n: string, ファイル: string, 値: カードCSVの行, マスター?: 用意["マスター"]): void {
  const 名 = `M1405-${n}-A`;
  defineCaseSeed(seedId, {
    消す: [名], マスター,
    ファイル: { 名: ファイル, 行: [{ "カード名(英語)": 名, カード詳細ID: `1452${n}1`, ...必須, "画像URL(英語)": `m14-05-${n}-en.jpg`, ...値 }] },
  });
}

defineNewRowSeed("S-M14-05-VALID-048", "048", "m14-05_power_toughness-048.csv", { パワー: "3", タフネス: "4" });

const マスターから消す = (種別: マスター種別, 値: string) => async (page: Page, seedId: string) => {
  if (await マスターの行を消す(page, 種別, 値, seedId)) reportSeedIssue(seedId, `${種別}に「${値}」の行があったので、値をすべて消して登録した（行の削除）`);
};

defineNewRowSeed("S-M14-05-MASTERMISS-049", "049", "m14-05_master_missing-049.csv", { カラー: "M1405-049-NoColor" }, マスターから消す("カラー", "M1405-049-NoColor"));
defineNewRowSeed("S-M14-05-MASTERMISS-050", "050", "m14-05_master_missing-050.csv", { サブタイプ: "M1405-050-NoSub" }, マスターから消す("サブタイプ", "M1405-050-NoSub"));
defineNewRowSeed("S-M14-05-MASTERMISS-051", "051", "m14-05_master_missing-051.csv", { 特殊タイプ: "M1405-051-NoSpecial" }, マスターから消す("特殊タイプ", "M1405-051-NoSpecial"));
defineNewRowSeed("S-M14-05-MASTERMISS-052", "052", "m14-05_master_missing-052.csv", { カードセット: "M1405-052-NoSet" }, async (page, seedId) => {
  const n = await カードセットを消す(page, "M1405-052-NoSet", seedId);
  if (n) reportSeedIssue(seedId, `カードセット「M1405-052-NoSet」を ${n} 件、カードセット一覧の削除ボタンで消した`);
});
defineNewRowSeed("S-M14-05-MASTERMISS-053", "053", "m14-05_master_missing-053.csv", { レアリティ: "M1405-053-NoRarity" }, マスターから消す("レアリティ", "M1405-053-NoRarity"));
defineNewRowSeed("S-M14-05-MASTERMISS-054", "054", "m14-05_master_missing-054.csv", { レイアウト: "M1405-054-NoLayout" }, マスターから消す("カードレイアウト", "M1405-054-NoLayout"));
defineNewRowSeed("S-M14-05-MASTERMISS-055", "055", "m14-05_master_missing-055.csv", { プロモ種別: "M1405-055-NoPromo" }, マスターから消す("プロモーション", "M1405-055-NoPromo"));
defineNewRowSeed("S-M14-05-MASTERMISS-056", "056", "m14-05_master_missing-056.csv", { 色順: "M1405-056-NoOrder" }, マスターから消す("色順", "M1405-056-NoOrder"));

// 057: 固有色はカラーのマスタを共用する。Black・Red・Green・Colorless が無いときだけ、日本語名（黒・赤・緑・無色）と英語名を入れて登録する
defineCaseSeed("S-M14-05-VALID-057", {
  消す: [{ 名: "M1405-057-A", 検索語: "M1405-057" }],
  マスター: async (page, seedId) => {
    for (const [en, jp] of [["Black", "黒"], ["Red", "赤"], ["Green", "緑"], ["Colorless", "無色"]]) {
      if (await マスターを用意する(page, "カラー", en, seedId, jp)) reportSeedIssue(seedId, `カラー「${en}」が無かったので登録した`);
    }
  },
  ファイル: { 名: "m14-05_unique_color-057.csv", 行: [{ "カード名(英語)": "M1405-057-A", カード詳細ID: "14520571", 固有色: "Black,Red,Green,Colorless", ...必須, "画像URL(英語)": "m14-05-057-en.jpg" }] },
});

defineNewRowSeed("S-M14-05-VALID-058", "058", "m14-05_illustrator_new-058.csv", { イラストレーター: "M1405-058-Illustrator" }, マスターから消す("イラストレーター", "M1405-058-Illustrator"));
defineNewRowSeed("S-M14-05-VALIDATION-059", "059", "m14-05_layout_blank-059.csv", { レイアウト: "" });

defineCaseSeed("S-M14-05-VALID-060", {
  消す: ["M1405-060-A", "M1405-060-B"],
  ファイル: { 名: "m14-05_frame_values-060.csv", 行: [
    { "カード名(英語)": "M1405-060-A", カード詳細ID: "14520601", フレーム: "Normal", ...必須, "画像URL(英語)": "m14-05-060-a-en.jpg" },
    { "カード名(英語)": "M1405-060-B", カード詳細ID: "14520602", フレーム: "Special", ...必須, "画像URL(英語)": "m14-05-060-b-en.jpg" },
  ] },
});

defineNewRowSeed("S-M14-05-VALIDATION-061", "061", "m14-05_unique_color_invalid-061.csv", { 固有色: "Purple" });
defineNewRowSeed("S-M14-05-VALIDATION-062", "062", "m14-05_frame_invalid-062.csv", { フレーム: "Rainbow" });
defineNewRowSeed("S-M14-05-VALID-063", "063", "m14-05_cardset_registered-063.csv", { カードセット: "Aether Revolt" });
defineNewRowSeed("S-M14-05-VALID-064", "064", "m14-05_rarity_registered-064.csv", {});
defineNewRowSeed("S-M14-05-VALID-065", "065", "m14-05_layout_registered-065.csv", {});
defineNewRowSeed("S-M14-05-VALID-066", "066", "m14-05_promo_registered-066.csv", { プロモ種別: "Promotion" });
defineNewRowSeed("S-M14-05-VALID-067", "067", "m14-05_color_order_registered-067.csv", { 色順: "マルチ-白青" });

defineCaseSeed("S-M14-05-MIXED-068", {
  消す: ["M1405-068-A", "M1405-068-B"],
  既存: { ファイル: "m14-05_068-pre.csv", 名: "M1405-068-B", 控える: "〔カードID-M1405-068〕", 行: [
    { "カード名(英語)": "M1405-068-B", カード詳細ID: "14520682", 点数で見たマナコスト: "1", ...必須, "画像URL(英語)": "m14-05-068-old-en.jpg" },
  ] },
  ファイル: { 名: "m14-05_mixed-068.csv", 行: [
    { "カード名(英語)": "M1405-068-A", カード詳細ID: "14520681", 点数で見たマナコスト: "2", ...必須, "画像URL(英語)": "m14-05-068-en.jpg" },
    { "カード名(英語)": "M1405-068-B", カード詳細ID: "14520682", 点数で見たマナコスト: "5", ...必須, "画像URL(英語)": "m14-05-068-en.jpg" },
  ] },
});

defineNewRowSeed("S-M14-05-REPEAT-069", "069", "m14-05_repeat-069.csv", { 点数で見たマナコスト: "3" });
defineNewRowSeed("S-M14-05-SINGLE-070", "070", "m14-05_single_value-070.csv", { カードタイプ: "Creature", カラー: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic" });
defineNewRowSeed("S-M14-05-FORMAT-071", "071", "m14-05_format_restricted-071.csv", { 使用制限フォーマット: "Modern" });
defineNewRowSeed("S-M14-05-FORMAT-072", "072", "m14-05_format_banned-072.csv", { 使用禁止フォーマット: "Modern" });

// ---------------------------------------------------------------------------
// CSV取込の組合せ（074〜089）。値はシード表のとおり（書かない列は空）
// ---------------------------------------------------------------------------

const CB = (n: string) => `M1405-CB${n}-A`;
const CB_SPLITFLIP = ["S-M14-05-ADM", "S-M14-05-MASTERS", "S-M14-05-CBLAYOUT-SPLITFLIP"];
const CB_MASTERS = ["S-M14-05-ADM", "S-M14-05-MASTERS"];
const 共通 = (n: string): カードCSVの行 => ({ "カード名(英語)": CB(n), レアリティ: "Uncommon", "画像URL(英語)": `m14-05-cb${n}-en.jpg` });
/** 取込前の状態の登録用CSV（m14-05_cb-nnn-pre.csv）の共通の値 */
const 取込前 = (n: string): カードCSVの行 => ({ "カード名(英語)": CB(n), レアリティ: "Uncommon", レイアウト: "Normal", 点数で見たマナコスト: "9", "画像URL(英語)": `m14-05-cb${n}-pre.jpg` });
const 白 = { カードタイプ: "Creature", カラー: "White", 固有色: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic" };

function defineCbSeed(seedId: string, n: string, needs: string[], 行: カードCSVの行[], 前?: カードCSVの行[]): void {
  defineCaseSeed(seedId, {
    消す: [CB(n)],
    既存: 前 ? { ファイル: `m14-05_cb-${n}-pre.csv`, 名: CB(n), 行: 前 } : undefined,
    ファイル: { 名: `m14-05_cb-${n}.csv`, 行 },
  }, needs);
}

defineCbSeed("S-M14-05-CBCSV-074", "074", CB_SPLITFLIP, [{ ...共通("074"), カードタイプ: "Creature", 固有色: "White", 特殊タイプ: "Basic", 使用可能フォーマット: "Legacy,Modern", レイアウト: "Split", 点数で見たマナコスト: "2/3" }]);
defineCbSeed("S-M14-05-CBCSV-075", "075", CB_SPLITFLIP, [
  { ...共通("075"), ...白, 使用制限フォーマット: "Vintage", 使用禁止フォーマット: "Commander", レイアウト: "Flip", 点数で見たマナコスト: "3" },
  { ...共通("075"), カラー: "Blue", サブタイプ: "Advisor", 使用制限フォーマット: "Vintage", 使用禁止フォーマット: "Commander", レイアウト: "Flip", 点数で見たマナコスト: "3" },
]);
defineCbSeed("S-M14-05-CBCSV-076", "076", CB_MASTERS, [{ ...共通("076"), カラー: "White", 固有色: "White", サブタイプ: "Adventure", 使用可能フォーマット: "Legacy,Modern", レイアウト: "Double Faced" }]);
defineCbSeed("S-M14-05-CBCSV-077", "077", CB_MASTERS, [{ ...共通("077"), カードタイプ: "Creature", カラー: "White", 特殊タイプ: "Basic", 使用制限フォーマット: "Vintage", 使用禁止フォーマット: "Commander", レイアウト: "Normal" }]);
defineCbSeed("S-M14-05-CBCSV-078", "078", CB_SPLITFLIP,
  [{ ...共通("078"), カードタイプ: "Creature", カラー: "White", 固有色: "White", サブタイプ: "Adventure", 使用制限フォーマット: "Vintage", レイアウト: "Split", 点数で見たマナコスト: "3/4" }],
  [{ ...取込前("078"), カード詳細ID: "14570789", 特殊タイプ: "Legendary", 使用可能フォーマット: "Pioneer" }]);
defineCbSeed("S-M14-05-CBCSV-079", "079", CB_SPLITFLIP,
  [{ ...共通("079"), ...白, 使用可能フォーマット: "Modern", レイアウト: "Flip", 点数で見たマナコスト: "5", カード詳細ID: "14570791", カードNo: "7", フレーム: "Special" }],
  [{ ...取込前("079"), カード詳細ID: "14570799", 使用可能フォーマット: "Legacy,Modern" }]);
defineCbSeed("S-M14-05-CBCSV-082", "082", CB_SPLITFLIP, [
  { ...共通("082"), ...白, 使用可能フォーマット: "Modern", レイアウト: "Split", カード詳細ID: "14570821", カードNo: "7", フレーム: "Special" },
  { ...共通("082"), カードタイプ: "_enchantment", サブタイプ: "Advisor", 特殊タイプ: "Legendary", 使用可能フォーマット: "Modern", レイアウト: "Split", カード詳細ID: "14570822", カードNo: "7", フレーム: "Special" },
], [{ ...取込前("082"), カード詳細ID: "14570829", 使用可能フォーマット: "Legacy,Modern" }]);
defineCbSeed("S-M14-05-CBCSV-083", "083", CB_MASTERS, [{ ...共通("083"), ...白, 使用制限フォーマット: "Vintage", 使用禁止フォーマット: "Commander", レイアウト: "Double Faced", 点数で見たマナコスト: "6", カード詳細ID: "14570831", カードNo: "7", フレーム: "Special" }]);
defineCbSeed("S-M14-05-CBCSV-084", "084", CB_MASTERS, [
  { ...共通("084"), ...白, 使用可能フォーマット: "Modern", レイアウト: "Double Faced", 点数で見たマナコスト: "2", カード詳細ID: "14570841", カードNo: "7", フレーム: "Special" },
  { ...共通("084"), カラー: "Blue", 特殊タイプ: "Legendary", 使用可能フォーマット: "Modern", レイアウト: "Double Faced", 点数で見たマナコスト: "2", カード詳細ID: "14570842", カードNo: "7", フレーム: "Special" },
], [
  { ...取込前("084"), カード詳細ID: "14570841", カードNo: "1", フレーム: "Normal", 使用可能フォーマット: "Legacy,Modern" },
  { ...取込前("084"), カード詳細ID: "14570842", カードNo: "1", フレーム: "Normal", 使用可能フォーマット: "Legacy,Modern" },
]);
defineCbSeed("S-M14-05-CBCSV-085", "085", CB_MASTERS,
  [{ ...共通("085"), カードタイプ: "Creature", カラー: "White", 固有色: "White", サブタイプ: "Adventure", 使用可能フォーマット: "Modern", レイアウト: "Normal", 点数で見たマナコスト: "7", カード詳細ID: "14570851", カードNo: "7", フレーム: "Special" }],
  [{ ...取込前("085"), カード詳細ID: "14570851", カードNo: "1", フレーム: "Normal", 特殊タイプ: "Legendary", 使用可能フォーマット: "Legacy,Modern" }]);
defineCbSeed("S-M14-05-CBCSV-086", "086", CB_SPLITFLIP,
  [{ ...共通("086"), カードタイプ: "Creature", 固有色: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic", 使用制限フォーマット: "Vintage", 使用禁止フォーマット: "Commander", レイアウト: "Split", 点数で見たマナコスト: "6", カード詳細ID: "14570861", カードNo: "7", フレーム: "Special" }],
  [{ ...取込前("086"), カード詳細ID: "14570861", カードNo: "1", フレーム: "Normal", カラー: "Blue", 使用可能フォーマット: "Pioneer" }]);
defineCbSeed("S-M14-05-CBCSV-087", "087", CB_SPLITFLIP,
  [{ ...共通("087"), カードタイプ: "Creature", 固有色: "White", 特殊タイプ: "Basic", 使用可能フォーマット: "Modern", レイアウト: "Flip", カード詳細ID: "14570871", カードNo: "7", フレーム: "Special" }],
  [{ ...取込前("087"), カード詳細ID: "14570871", カードNo: "1", フレーム: "Normal", カラー: "Blue", サブタイプ: "Advisor", 使用可能フォーマット: "Legacy,Modern" }]);
defineCbSeed("S-M14-05-CBCSV-088", "088", CB_SPLITFLIP, [{ ...共通("088"), カラー: "White", 固有色: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic", 使用可能フォーマット: "Legacy,Modern", レイアウト: "Split", 点数で見たマナコスト: "1/2" }]);
defineCbSeed("S-M14-05-CBCSV-089", "089", CB_SPLITFLIP, [{ ...共通("089"), カードタイプ: "Creature", カラー: "White", サブタイプ: "Adventure", 特殊タイプ: "Basic", 使用可能フォーマット: "Legacy,Modern", レイアウト: "Flip", 点数で見たマナコスト: "4/2" }]);
