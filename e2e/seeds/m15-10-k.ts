// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-10 アーキタイプ登録CSV（管理画面）のシードの作り方（画面操作）。正本: cases/M15-10_seed_data.tsv
 *
 * - 試験管理者（m1510_admin・m1510l_admin）: メンバー管理で登録する。権限はデッキ管理を操作できる「システム管理者」（正本は権限の名前を定めない。M15-08 と同じ）。
 * - 取込ファイル: シード表の内容で、試験端末（.state/m15-10）に実行のたびに作る（UTF-8。027 だけ BOM 付き・CRLF、ほかは BOM なし・LF）。
 *   値にカンマを含むセル（色）だけを二重引用符で囲む（シード表の「二重引用符で囲んだ」と同じ）。
 * - 取込参照マスタ（S-M15-10-MASTER）: フォーマット Pioneer・Modern が無いときだけ登録する（フォーマット名(日)＝(英)。並び順は 9101・9102。
 *   シード表の「ほかと重ならない1〜10000」は一覧に並び順が出ないので画面で確かめられない。既定の選択にならない大きい値にした）。
 *   UnknownFormat があれば一覧から削除する。カラーは日本語名の行が無いときだけ登録し、未定義色A・未定義色B の行があれば空にする。
 *   フォーマット名(英)が Pioneer のフォーマットが複数あるときは、ID の最も大きいものを使い、注記に残す。
 * - アーキタイプ名: シード表の値のまま。前の実行の残りは、シード表のとおり名前で検索して編集画面の「削除」で消す。
 *   ただし、シード表が「削除済みを含めて0件」とする 041・046 のキーと、連携の 034〜036 の名前（DB での削除の代わり）は、
 *   画面の削除では削除済みが残るので、実行の印を付けた値で作る（決め打ちの値の扱い。ケースの CSV・期待結果の名前も同じ印つきの値として読む）。
 * - 代表カード（S-M15-10-CARD-IMAGES・S-M15-10-CARD-IMAGES-037）: カード名「Test Card」「Test Card M1510-037-A」とカードセット名に実行の印を付ける。
 *   画面の削除はカードを物理的に消し、前の実行のアーキタイプが代表カードとして指している画像があると消せない（シードが止まる）ため。
 *   ケースの CSV の代表カード名も同じ印つきの値で書く。カードNo・略称・画像URL はシード表の値のまま。
 *   レアリティ・レイアウトは Uncommon・Normal（無ければ登録する）。F のプロモ種別は、プロモーションの一覧のうち「プロモなし」（行番号1）以外の先頭の英語名。
 *   画像の言語・表示面を変えたあと、代表カード検索で画像の番号が変わっていないことを確かめる。
 * - 連携のフォーマット（S-M15-10-L-FMT-034〜036）: 名前に実行の印を付けて登録する（並び順 9111〜9113、メタゲーム分析日数は初期値のまま）。
 *
 * 作らないシード（ケースを実装しない）:
 * - S-M15-10-UPDATE-BLANK-007（記事「ART-1」との紐付けが DB での準備）
 */
import fs from "node:fs";
import path from "node:path";
import { Browser, Page } from "@playwright/test";
import { STATE_DIR } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { CardEditPage } from "../pages/admin/m14_04_card_edit";
import {
  カードCSVの行, カードCSVの見出し, カードCSVを組む, カード一覧で探す, カード一覧から消す, シードのCSVを取り込む, フォーマットを英語名で探す, マスターを用意する,
} from "../pages/admin/m14_05_card_csv_upload";
import { フォーマットを一覧から削除する, フォーマットを登録する } from "../pages/admin/m14_09_format_list";
import { ArchetypeSearchPage } from "../pages/admin/m15_08_archetype_search";
import {
  アーキタイプを登録する, カードセットを登録する, フォーマットを英語名で読む, マスターの行を足す, マスターの行を空にする, マスターの行を読む,
  代表カードを検索する, 公開状態の選択肢, 取込ファイルを保存する, 名前で探して消す, 新規登録画面を開く, 検索結果のIDを読む, 画像の言語の選択肢, 登録内容,
  詳細の画像を変える, 編集画面で削除する,
} from "../pages/admin/m15_10_archetype_csv";

export const M1510_ADMIN: Account = { loginId: "m1510_admin", password: "Passw0rd!M1510" };
export const M1510L_ADMIN: Account = { loginId: "m1510l_admin", password: "Passw0rd!M1510L" };

/** 代表カードのカード名（正本の「Test Card」に実行の印を付けた値） */
export const テストカード = rc("Test Card");
export const テストカード037 = rc("Test Card M1510-037-A");
/** 041・046 のキー（削除済みを含めて0件にするため、実行の印を付けた値） */
export const キー041 = { 名日: rc("新規JP-M1510-CB041"), 名英: rc("New EN-M1510-CB041") };
export const キー046 = { 名日: rc("新規JP-M1510-CB046"), 名英: rc("New EN-M1510-CB046") };
/** 連携のフォーマット名・アーキタイプ名（実行の印つき） */
export const 連携 = {
  "034": { フォーマット: rc("FmtM1510L001"), アーキタイプ: rc("ArcM1510L001") },
  "035": { フォーマット: rc("FmtM1510L002"), アーキタイプ: rc("ArcM1510L002") },
  "036": { フォーマット: rc("FmtM1510L003"), アーキタイプ: rc("ArcM1510L003") },
} as const;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = M1510_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 共通 = ["S-M15-10-ADM", "S-M15-10-MASTER"];

/** フォーマット名(英)のフォーマット（複数あれば ID の最も大きいもの。取込はフォーマット名(英)で引く） */
export async function フォーマットを読む(page: Page, 名英: string, what: string, issue?: (m: string) => void): Promise<{ ID: string; 名日: string }> {
  const hit = await フォーマットを英語名で読む(page, 名英);
  if (hit.length === 0) throw new Error(`${what}: フォーマット名(英)が ${名英} のフォーマットが無い`);
  const sorted = [...hit].sort((a, b) => Number(b.ID) - Number(a.ID));
  if (hit.length > 1) issue?.(`フォーマット名(英)が ${名英} のフォーマットが ${hit.length} 件ある（ID ${hit.map((h) => h.ID).join("・")}）。ID ${sorted[0].ID} を使った`);
  return sorted[0];
}

// ---- 取込参照マスタ（共有） ----
const 色 = [["赤", "Red"], ["青", "Blue"], ["白", "White"], ["緑", "Green"], ["黒", "Black"]] as const;

// ---- 代表カード候補（共有） ----

/** カードの CSV を1件ずつ取り込み、取り込むたびに代表カード検索で最も大きいIDを控える */
async function カードを1件ずつ取り込む(
  page: Page, seedId: string, notes: Notes, カード名: string, rows: { 呼び名: string; 行: カードCSVの行; ファイル: string }[],
): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 見出し = await カードCSVの見出し(page);
  const dir = path.join(STATE_DIR, "m15-10");
  fs.mkdirSync(dir, { recursive: true });
  const ids: string[] = [];
  for (const r of rows) {
    const file = path.join(dir, r.ファイル);
    fs.writeFileSync(file, カードCSVを組む(見出し, [r.行]));
    for (const w of await シードのCSVを取り込む(page, file, `${seedId}: ${r.ファイル}`)) issue(`カードCSV ${r.ファイル} の警告「${w}」`);
    await 新規登録画面を開く(page, seedId);
    const found = await 代表カードを検索する(page, カード名, seedId);
    if (found.length === 0) throw new Error(`${seedId}: ${r.ファイル} を取り込んだあと、代表カード検索に「${カード名}」が出ない`);
    const nums = found.map((f) => Number(f.ID));
    const max = String(Math.max(...nums));
    if (found[found.length - 1].ID !== max) issue(`代表カード検索の最後の行（ID ${found[found.length - 1].ID}）が、IDの最も大きい行（${max}）でない。IDの最も大きい行を控えた`);
    notes.set(r.呼び名, max);
    ids.push(max);
  }
  return ids;
}

/** カード一覧でカードを開き、詳細情報の画像の言語・表示面を変えて「登録」を押す。そのあと画像の番号が変わっていないことを確かめる */
async function 画像を直す(page: Page, seedId: string, カード名: string, 変更: { コレクターNo: string; 言語?: string; 表示面?: "表面" | "裏面" }[], ids: string[]): Promise<void> {
  const cards = await カード一覧で探す(page, カード名);
  if (cards.length !== 1) throw new Error(`${seedId}: カード一覧で「${カード名}」のカードが ${cards.length} 件`);
  const edit = new CardEditPage(page);
  await edit.open(cards[0]);
  for (const c of 変更) await 詳細の画像を変える(page, c.コレクターNo, c, seedId);
  const r = await edit.登録を押す();
  if (!r.sent) throw new Error(`${seedId}: カード詳細(編集)画面の「登録」が送られない`);
  await expectSaved(page, `${seedId}: カード「${カード名}」の画像の言語・表示面の登録`);
  await 新規登録画面を開く(page, seedId);
  const after = (await 代表カードを検索する(page, カード名, seedId)).map((f) => f.ID).sort();
  if (JSON.stringify(after) !== JSON.stringify([...ids].sort())) {
    throw new Error(`${seedId}: 画像の言語・表示面を変えたあと、代表カード検索の画像の番号が変わった（前 ${ids.join("・")}、後 ${after.join("・")}）`);
  }
}

defineSeed("S-M15-10-CARD-IMAGES-037", { needs: ["S-M15-10-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const issue = (m: string) => reportSeedIssue(id, m);
  await 管理画面(browser, async (page) => {
    const n = await カード一覧から消す(page, テストカード037);
    if (n) issue(`カード「${テストカード037}」が ${n} 件あったので消した`);
    const setA = rc("M1510-037 Set A");
    const setB = rc("M1510-037 Set B");
    for (const w of await カードセットを登録する(page, { 名: setA, 略称: "M37A", リリース日: "2025-01-01" }, id)) issue(w);
    for (const w of await カードセットを登録する(page, { 名: setB, 略称: "M37B", リリース日: "2025-03-01" }, id)) issue(w);
    if (await マスターを用意する(page, "レアリティ", "Uncommon", id)) issue("レアリティ Uncommon が無かったので登録した");
    if (await マスターを用意する(page, "カードレイアウト", "Normal", id)) issue("カードレイアウト Normal が無かったので登録した");
    const 行 = (k: "A" | "B", set: string): カードCSVの行 => ({
      "カード名(英語)": テストカード037, レアリティ: "Uncommon", レイアウト: "Normal", カードセット: set, カードNo: `M1510-037-${k}`,
      Foil: "0", プロモ種別: "", "画像URL(英語)": `img/m1510/test-card-037-${k.toLowerCase()}.jpg`,
    });
    const ids = await カードを1件ずつ取り込む(page, id, notes, テストカード037, [
      { 呼び名: "〔画像ID-M1510-037A〕", 行: 行("A", setA), ファイル: "card-037-a.csv" },
      { 呼び名: "〔画像ID-M1510-037B〕", 行: 行("B", setB), ファイル: "card-037-b.csv" },
    ]);
    // カードの言語の選択肢にフランス語が無ければ、先に言語のマスターへ足す
    const cards = await カード一覧で探す(page, テストカード037);
    if (cards.length !== 1) throw new Error(`${id}: カード一覧で「${テストカード037}」のカードが ${cards.length} 件`);
    await new CardEditPage(page).open(cards[0]);
    if (!(await 画像の言語の選択肢(page)).includes("フランス語")) {
      await マスターの行を足す(page, "言語", { 日本語名: "フランス語", 英語名: "French", コード: "fr" }, id);
      issue("言語にフランス語が無かったので、MTGマスターデータ管理の言語に登録した");
    }
    await 画像を直す(page, id, テストカード037, [
      { コレクターNo: "M1510-037-A", 言語: "日本語" },
      { コレクターNo: "M1510-037-B", 言語: "フランス語" },
    ], ids);
  });
});

// ---- 取込ファイル・アーキタイプ（ケース専用） ----

type 既存 = Omit<登録内容, "フォーマットID"> & { 呼び名: string; フォーマット英?: string; 登録後に削除?: boolean };

type CSV = { ファイル: string; 行: string[][]; BOM?: boolean; CRLF?: boolean };

/**
 * ケース専用のシード: シード表のとおり、名前で検索した該当を消し、アーキタイプを登録して ID を控え（必要なら控えたあと削除し）、取込ファイルを保存する。
 */
function defineCsvSeed(seedId: string, opt: {
  消す: string[]; 既存?: (notes: Notes) => 既存[]; csv: CSV; needs?: string[]; 管理者?: Account;
}): void {
  defineSeed(seedId, { needs: opt.needs ?? 共通 }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      for (const 語 of opt.消す) {
        const n = await 名前で探して消す(page, 語, seedId);
        if (n) issue(`「${語}」で検索した該当 ${n} 件を、編集画面の「削除」で消した`);
      }
      for (const a of opt.既存?.(notes) ?? []) {
        const f = await フォーマットを読む(page, a.フォーマット英 ?? "Pioneer", seedId);
        await アーキタイプを登録する(page, { ...a, フォーマットID: f.ID }, seedId, issue);
        const aid = await 検索結果のIDを読む(page, { 名日: a.名日, 名英: a.名英, フォーマット日: f.名日 }, seedId);
        notes.set(a.呼び名, aid);
        if (a.登録後に削除) {
          const s = new ArchetypeSearchPage(page);
          await s.開く();
          await s.名前で検索する(a.名日);
          await s.名前を押す(aid);
          await 編集画面で削除する(page, `${seedId}: アーキタイプID ${aid}`);
        }
      }
      取込ファイルを保存する(opt.csv.ファイル, opt.csv.行, { BOM: opt.csv.BOM, 改行: opt.csv.CRLF ? "\r\n" : "\n" });
    }, opt.管理者);
  });
}

const P = "Pioneer";
const 新規だけ = (seedId: string, 語: string[], ファイル: string, 行: string[][], needs?: string[]) => defineCsvSeed(seedId, { 消す: 語, csv: { ファイル, 行 }, needs });

新規だけ("S-M15-10-CSV-NEW-004", ["新規アーキタイプ-004"], "valid-new-004.csv", [["新規アーキタイプ-004", "New Archetype-M1510-004", "", "", P]]);
新規だけ("S-M15-10-CSV-NEW-005", ["新規アーキタイプ-005"], "valid-new-005.csv", [["新規アーキタイプ-005", "New Archetype-005", "", "", P]]);

defineCsvSeed("S-M15-10-UPDATE-BLANK-006", {
  消す: ["既存JP-006"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-006〕", 名日: "既存JP-006", 名英: "Existing EN-006", 公開状態: "非公開" }],
  csv: { ファイル: "update-blank-006.csv", 行: [["既存JP-006", "Existing EN-006", "", "", P]] },
});

defineCsvSeed("S-M15-10-NONMATCH-008", {
  消す: ["基準JP", "相違JP"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-008〕", 名日: "基準JP", 名英: "Base EN" }],
  csv: { ファイル: "key-nonmatch.csv", 行: [["相違JP", "Base EN", "", "", P], ["基準JP", "Different EN", "", "", P], ["基準JP", "Base EN", "", "", "Modern"]] },
});

新規だけ("S-M15-10-CARD-010", ["代表カード試験JP"], "representative-card.csv", [["代表カード試験JP", "Representative Test EN", テストカード, "", P]], [...共通, "S-M15-10-CARD-IMAGES"]);
新規だけ("S-M15-10-CARD-UNKNOWN-011", ["代表未解決JP"], "representative-unknown.csv", [["代表未解決JP", "Representative Unknown EN", "Unknown Card", "", P]], [...共通, "S-M15-10-CARD-IMAGES"]);

defineCsvSeed("S-M15-10-UPDATE-BLANK-012", {
  消す: ["既存JP-M1510-012"],
  既存: (n) => [{ 呼び名: "〔アーキタイプID-M1510-012〕", 名日: "既存JP-M1510-012", 名英: "Existing EN-M1510-012", 代表カード: { カード名: テストカード, 画像ID: n.get("〔画像ID-M1510-共有A〕") } }],
  csv: { ファイル: "update-blank-012.csv", 行: [["既存JP-M1510-012", "Existing EN-M1510-012", "", "", P]] },
  needs: [...共通, "S-M15-10-CARD-IMAGES"],
});

defineCsvSeed("S-M15-10-COLOR-REPLACE-013", {
  消す: ["既存JP-M1510-013"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-013〕", 名日: "既存JP-M1510-013", 名英: "Existing EN-M1510-013", カラー: ["赤"] }],
  csv: { ファイル: "color-replace.csv", 行: [["既存JP-M1510-013", "Existing EN-M1510-013", "", "青,白,青", P]] },
});
defineCsvSeed("S-M15-10-COLOR-PARTIAL-014", {
  消す: ["既存JP-M1510-014"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-014〕", 名日: "既存JP-M1510-014", 名英: "Existing EN-M1510-014", カラー: ["赤"] }],
  csv: { ファイル: "color-partial.csv", 行: [["既存JP-M1510-014", "Existing EN-M1510-014", "", "青,未定義色A,青", P]] },
});
defineCsvSeed("S-M15-10-COLOR-PRESERVE-015", {
  消す: ["空色JP", "カンマ色JP"],
  既存: () => [
    { 呼び名: "〔アーキタイプID-M1510-015A〕", 名日: "空色JP", 名英: "BlankColorEN", カラー: ["緑"] },
    { 呼び名: "〔アーキタイプID-M1510-015B〕", 名日: "カンマ色JP", 名英: "CommaColorEN", カラー: ["黒"] },
  ],
  csv: { ファイル: "color-preserve.csv", 行: [["空色JP", "BlankColorEN", "", "", P], ["カンマ色JP", "CommaColorEN", "", ",,,", P]] },
});
defineCsvSeed("S-M15-10-COLOR-INVALID-016", {
  消す: ["既存JP-016"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-016〕", 名日: "既存JP-016", 名英: "Existing EN-016", カラー: ["赤"] }],
  csv: { ファイル: "color-invalid.csv", 行: [["既存JP-016", "Existing EN-016", "", "未定義色A,未定義色B", P]] },
});

新規だけ("S-M15-10-FORMAT-UNKNOWN-017", ["未登録フォーマットJP-017"], "format-unknown-017.csv", [["未登録フォーマットJP-017", "Unknown Format EN-017", "", "", "UnknownFormat"]]);
新規だけ("S-M15-10-FORMAT-UNKNOWN-018", ["未登録フォーマットJP-018"], "format-unknown-018.csv", [["未登録フォーマットJP-018", "Unknown Format EN-018", "", "", "UnknownFormat"]]);

defineCsvSeed("S-M15-10-NORMALIZED-027", {
  消す: ["正規化JP"],
  csv: { ファイル: "normalized.csv", 行: [["​正規化JP", "Normalized EN", "", "", P]], BOM: true, CRLF: true },
});
新規だけ("S-M15-10-ROLLBACK-028", ["取消確認1行目JP", "取消確認2行目JP"], "rollback-required-error.csv",
  [["取消確認1行目JP", "Rollback First EN", "", "", P], ["取消確認2行目JP", "", "", "", P]]);
新規だけ("S-M15-10-CSRF-MISSING-029", ["トークン欠落JP"], "csrf-missing.csv", [["トークン欠落JP", "Missing Token EN", "", "", P]]);
新規だけ("S-M15-10-CSRF-TAMPER-030", ["トークン改ざんJP"], "csrf-tamper.csv", [["トークン改ざんJP", "Tampered Token EN", "", "", P]]);

新規だけ("S-M15-10-CARD-037", ["代表言語試験JP-M1510-037"], "language-filter-037.csv",
  [["代表言語試験JP-M1510-037", "Language Filter EN-M1510-037", テストカード037, "", P]], [...共通, "S-M15-10-CARD-IMAGES-037"]);

defineCsvSeed("S-M15-10-MIX-038", {
  消す: ["既存混在JP-M1510-038", "新規混在JP-M1510-038"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-038〕", 名日: "既存混在JP-M1510-038", 名英: "Mixed-Existing-EN-M1510-038", 公開状態: "非公開" }],
  csv: { ファイル: "dpm1510-038-mixed.csv", 行: [["既存混在JP-M1510-038", "Mixed-Existing-EN-M1510-038", "", "", P], ["新規混在JP-M1510-038", "Mixed-New-EN-M1510-038", "", "", P]] },
});
defineCsvSeed("S-M15-10-REPL-039", {
  消す: ["既存代表置換JP-M1510-039"],
  既存: (n) => [{ 呼び名: "〔アーキタイプID-M1510-039〕", 名日: "既存代表置換JP-M1510-039", 名英: "Replace-Rep-EN-M1510-039", 代表カード: { カード名: テストカード, 画像ID: n.get("〔画像ID-M1510-共有A〕") } }],
  csv: { ファイル: "dpm1510-039-replace.csv", 行: [["既存代表置換JP-M1510-039", "Replace-Rep-EN-M1510-039", テストカード, "", P]] },
  needs: [...共通, "S-M15-10-CARD-IMAGES"],
});
新規だけ("S-M15-10-TWICE-040", ["重ね取込JP-M1510-040"], "dpm1510-040-twice.csv", [["重ね取込JP-M1510-040", "Twice-EN-M1510-040", "", "", P]]);

// 041・046: キーに実行の印（削除済みを含めて0件）。シード表の「名前で検索して消す」も、印つきの名前で行う
新規だけ("S-M15-10-CBARC-041", [キー041.名日], "m1510-cb041.csv", [[キー041.名日, キー041.名英, "", "青,未定義色A", P]]);
defineCsvSeed("S-M15-10-CBARC-042", {
  消す: ["既存JP-M1510-CB042"],
  既存: () => [{ 呼び名: "〔アーキタイプID-M1510-042〕", 名日: "既存JP-M1510-CB042", 名英: "Existing EN-M1510-CB042", 公開状態: "非公開", カラー: ["赤"] }],
  csv: { ファイル: "m1510-cb042.csv", 行: [["既存JP-M1510-CB042", "Existing EN-M1510-CB042", "Unknown Card", "青,白", P]] },
  needs: [...共通, "S-M15-10-CARD-IMAGES"],
});
defineCsvSeed("S-M15-10-CBARC-043", {
  消す: ["削除済JP-M1510-CB043"],
  既存: (n) => [{
    呼び名: "〔アーキタイプID-M1510-043〕", 名日: "削除済JP-M1510-CB043", 名英: "Deleted EN-M1510-CB043", カラー: ["赤"],
    代表カード: { カード名: テストカード, 画像ID: n.get("〔画像ID-M1510-共有A〕") }, 登録後に削除: true,
  }],
  csv: { ファイル: "m1510-cb043.csv", 行: [["削除済JP-M1510-CB043", "Deleted EN-M1510-CB043", "", ",", P]] },
  needs: [...共通, "S-M15-10-CARD-IMAGES"],
});
for (const [n, card, colors] of [["044", テストカード, "緑,黒"], ["045", "Unknown Card", "緑,未定義色A"]] as const) {
  defineCsvSeed(`S-M15-10-CBARC-${n}`, {
    消す: [`削除済JP-M1510-CB${n}`],
    既存: () => [{ 呼び名: `〔アーキタイプID-M1510-${n}〕`, 名日: `削除済JP-M1510-CB${n}`, 名英: `Deleted EN-M1510-CB${n}`, 登録後に削除: true }],
    csv: { ファイル: `m1510-cb${n}.csv`, 行: [[`削除済JP-M1510-CB${n}`, `Deleted EN-M1510-CB${n}`, card, colors, P]] },
    needs: [...共通, "S-M15-10-CARD-IMAGES"],
  });
}
新規だけ("S-M15-10-CBARC-046", [キー046.名日], "m1510-cb046.csv", [[キー046.名日, キー046.名英, テストカード, "白,未定義色B,青", P]], [...共通, "S-M15-10-CARD-IMAGES"]);

// ---- 連携（034〜036） ----

const 連携の管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) => 管理画面(browser, fn, M1510L_ADMIN);

for (const [n, 並び順] of [["034", "9111"], ["035", "9112"], ["036", "9113"]] as const) {
  defineSeed(`S-M15-10-L-FMT-${n}`, { needs: ["S-M15-10-L-ADM"] }, async ({ browser, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await 連携の管理画面(browser, async (page) => {
      const 名 = 連携[n].フォーマット;
      await フォーマットを登録する(page, { 名日: 名, 名英: 名, 並び順 }, seed.シードID, issue);
    });
  });
}

for (const n of ["034", "035"] as const) {
  defineSeed(`S-M15-10-L-NOARC-${n}`, { needs: ["S-M15-10-L-ADM"] }, async ({ browser, seed }) => {
    reportSeedIssue(seed.シードID, `投入方法の「DB投入で該当名称のアーキタイプを削除」は DB での準備なので行っていない。アーキタイプ名に実行の印を付けた「${連携[n].アーキタイプ}」を使い、削除済みを含めて0件にした`);
    await 連携の管理画面(browser, async (page) => {
      const s = new ArchetypeSearchPage(page);
      await s.開く();
      await s.名前で検索する(連携[n].アーキタイプ);
      if ((await s.結果の行()).length) throw new Error(`${seed.シードID}: 「${連携[n].アーキタイプ}」のアーキタイプがある`);
    });
  });
}

for (const [n, 色の値] of [["034", ""], ["035", "青,白"], ["036", "青,白"]] as const) {
  defineSeed(`S-M15-10-L-CSV-${n}`, async () => {
    const { アーキタイプ: a, フォーマット: f } = 連携[n];
    取込ファイルを保存する(`ArcM1510L${String(Number(n) - 33).padStart(3, "0")}.csv`, [[a, a, "", 色の値, f]]);
  });
}
