/**
 * M03-33 セール用高額商品価格変更CSV登録の画面シード（その2。価格の分岐・取込履歴・受け付けるファイル・項目の上限）。正本: cases/M03-33_seed_data.tsv
 * - S-M03-33-TAGS: 参照だけのマスタ。正本の投入方法は「DBシードでID 1〜3を登録し、ID 999を削除する」だが、共有の開発環境のタグは書き換えない
 *   （E2E が作った行以外は書かない決まり）ので、画面上のタグの有無をDBの参照で確かめ、名称の違いは裁定案として記録する。
 * - BRANCH・FORMAT-PRODUCTS・VALIDATION: グッズ商品CSV登録で商品を作り、商品規格登録編集画面で正本の状態にする（M03-33 の既存のシードと同じ作り）。
 *   商品コードには実行ごとの印を付け、取込ファイルのデータ行の商品コードにも同じ値を使う。取込ファイルは画面の雛形の見出し行（5列）の下に、
 *   シード表のデータ行（「空」は空の値）を入れる。シード表に行が無いものは、正本の期待結果に出ない列を「取込前と同じ値」にして作り、記録に残す。
 */
import { Browser } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { csvLine } from "../lib/csv";
import { query } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectNoSameNameHistory, createHighPriceGoods } from "./m03-32";
import { dataRowInSeed, M0333_ADMIN, templateHeader, writeRuntime } from "./m03-33";

defineSeed("S-M03-33-TAGS", async ({ seed }) => {
  const rows = query(`select id, name from dtb_tag where id in (1, 2, 3, 999) order by id`);
  const got = new Map(rows.map((r) => [String(r.id), r.name ?? ""]));
  for (const id of ["1", "2", "3"]) if (!got.has(id)) throw new Error(`${seed.シードID}: タグID ${id} が開発環境に無い（共有のタグは書き足さない）`);
  if (got.has("999")) throw new Error(`${seed.シードID}: タグID 999 が登録されている（共有のタグは消さない）`);
  reportSeedIssue(seed.シードID, `正本は「DBシードでID 1〜3を登録し、ID 999を削除する」。共有のタグは書き換えず、開発環境のタグID 1〜3が在り・999が無いことをDBの参照で確かめた` +
    `（名称は ${["1", "2", "3"].map((i) => `${i}=${got.get(i)}`).join("・")}。正本の「取込前タグ・取込後タグA・取込後タグB」とは名称が違い得る）`);
});

type 状態 = { code: string; 基準: string; 販売: string; 買取: string; セール: boolean; 帯URL?: string };

/** シード表の状態・属性から商品の状態を読む（書き写しの誤りを避ける） */
export function readState(seedId: string): 状態 {
  const t = getSeed(seedId)["状態・属性"];
  const pick = (re: RegExp, what: string): string => { const m = re.exec(t); if (!m) throw new Error(`${seedId}: シード表の状態・属性に ${what} が無い`); return m[1]; };
  return {
    code: pick(/商品コード=([^／]+)／/, "商品コード"),
    基準: pick(/基準価格(\d+)／/, "基準価格"), 販売: pick(/販売価格(\d+)／/, "販売価格"), 買取: pick(/買取価格(\d+)／/, "買取価格"),
    セール: pick(/セール(有効|無効)/, "セール") === "有効",
    帯URL: /帯URL=([^／]+)／/.exec(t)?.[1],
  };
}

export const codeOf = (seedId: string): string => rc(readState(seedId).code);

type RowMaker = (base: string, code: string) => { file: string; text: (header: string[]) => string };

async function productSeed(browser: Browser, seedId: string, n: string, notes: Notes, make: RowMaker): Promise<void> {
  const st = readState(seedId);
  const code = rc(st.code);
  const { file, text } = make(st.code, code);
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seedId);
    writeRuntime(file, text(header));
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seedId, file);
    await createHighPriceGoods(page, seedId, {
      商品コード: code, 商品名: `M0333-${n}`,
      CSV: { 基準価格: st.基準, 販売価格: st.販売, 買取価格: st.買取 },
      規格: { 高額商品コード: code, セール: st.セール, 基準価格: st.基準, 販売価格: st.販売, 買取価格: st.買取, ...(st.帯URL ? { 帯URL: st.帯URL } : {}) },
    }, { 商品ID: `〔商品ID-M0333-${n}〕`, 商品規格ID: `〔商品規格ID-M0333-${n}〕` }, notes);
    reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${file} の行が無いことを確かめた。取込ファイルは画面の雛形の見出し行（${header.length}列）の下にシード表のデータ行を入れた`);
  });
}

const 空 = (row: string): string => row.replace(/空/g, "");
const csvRow = (header: string[], row: string): string => `${csvLine(header)}\n${row}\n`;

function seedCsv(seedId: string, file: string): RowMaker {
  return (base, code) => ({ file, text: (h) => csvRow(h, 空(dataRowInSeed(seedId, file)).replace(base, code)) });
}

for (const [n, file] of [["001", "off_on-001.csv"], ["002", "on_on-002.csv"], ["003", "on_off-003.csv"], ["004", "off_off-004.csv"],
  ["013", "off_on-013.csv"], ["017", "off_on-017.csv"], ["018", "on_off-018.csv"], ["035", "numeric_max-035.csv"]] as const) {
  const id = n === "035" ? "S-M03-33-VALIDATION-035" : `S-M03-33-BRANCH-${n}`;
  defineSeed(id, { needs: ["S-M03-33-ADM", "S-M03-33-TAGS"] }, async ({ browser, seed, notes }) => { await productSeed(browser, seed.シードID, n, notes, seedCsv(seed.シードID, file)); });
}

// 022 タブ区切り・023 カンマ区切りのテキスト: シード表に「<ファイル名>は…でCODE,1200,700,1,空,空,0」とある
function inlineRow(seedId: string, file: string): string {
  const m = new RegExp(`${file.replace(/[.]/g, "\\.")}は[^／]*?([A-Z]+-\\d+-\\d+,1200,700,1,空,空,0)`).exec(getSeed(seedId)["状態・属性"]);
  if (!m) throw new Error(`${seedId}: シード表の状態・属性に ${file} のデータ行が無い`);
  return m[1];
}
defineSeed("S-M03-33-FORMAT-PRODUCTS-022", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  const file = "tab_valid-022.tsv";
  await productSeed(browser, seed.シードID, "022", notes, (base, code) => ({ file, text: (h) => `${h.join("\t")}\n${空(inlineRow(seed.シードID, file)).replace(base, code).split(",").join("\t")}\n` }));
});
defineSeed("S-M03-33-FORMAT-PRODUCTS-023", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  const file = "comma_valid-023.txt";
  await productSeed(browser, seed.シードID, "023", notes, (base, code) => ({ file, text: (h) => csvRow(h, 空(inlineRow(seed.シードID, file)).replace(base, code)) }));
});

// 025 ゼロ幅空白: 行頭と商品コードの途中に U+200B を入れる。値は 022 と同じ（価格1200・700・セール1）
defineSeed("S-M03-33-FORMAT-PRODUCTS-025", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  const file = "zero_width-025.csv";
  await productSeed(browser, seed.シードID, "025", notes, (_b, code) => {
    const zw = "​";
    const mid = `${code.slice(0, 3)}${zw}${code.slice(3)}`;
    reportSeedIssue(seed.シードID, "zero_width-025.csv: 行頭と商品コードの3文字目の後ろにゼロ幅空白（U+200B）を入れた。ほかの値は、正本の「価格1200・700、セール1を指定」と、列が決まらない帯URL・タグ・スマレジ連携を空・空・0とした");
    return { file, text: (h) => csvRow(h, `${zw}${mid},1200,700,1,,,0`) };
  });
});

// 037 帯URL128文字: 41文字のhttps://replace-dev.hareruyamtg.com:8443/ にaを87文字。ほかの値は取込前と同じ（販売1500・買取600・セール0・タグ空・スマレジ0）
defineSeed("S-M03-33-FORMAT-PRODUCTS-037", { needs: ["S-M03-33-ADM"] }, async ({ browser, seed, notes }) => {
  const url = `https://replace-dev.hareruyamtg.com:8443/${"a".repeat(87)}`;
  if (url.length !== 128) throw new Error(`${seed.シードID}: 帯URLが128文字でない（${url.length}）`);
  reportSeedIssue(seed.シードID, "belt_128-037.csv: 帯URLは128文字。ほかの値は正本に無いので、取込前と同じ（販売1500・買取600・セール0・タグ空・スマレジ連携0）にした");
  await productSeed(browser, seed.シードID, "037", notes, (_b, code) => ({ file: "belt_128-037.csv", text: (h) => csvRow(h, `${code},1500,600,0,${url},,0`) }));
});
