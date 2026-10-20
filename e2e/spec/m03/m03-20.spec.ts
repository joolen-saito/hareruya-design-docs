/**
 * M03-20 部門CSV入力（部門登録CSVアップロード画面）。正本: cases/M03-20_test_cases.tsv
 *
 * 正本の「部門登録CSVアップロード画面」は、部門登録/編集画面の「CSV入力」で開く画面（小見出し「部門登録CSVアップロード」）とした。
 * 取込ファイルは、シード（seeds/m03-20.ts）が試験用端末に作ったもの（または e2e/fixtures/m03-20/ のもの）を選ぶ。
 * 実装していないケース: 011・012・021（シードがDBで部門を置く・消す）、023（シードが画像ファイルを置く）。
 */
import { expect, Page, test } from "@playwright/test";
import { 保存された部門, 部門, 部門の総件数, 部門コードの部門, 部門名の部門 } from "../../db/m03_20_department";
import { CaseBody, CaseCtx, caseTest } from "../../lib/case";
import { csvRecords } from "../../lib/csv";
import { Account, loginAdmin } from "../../lib/session";
import { DepartmentPage } from "../../pages/admin/m03_18_department";
import {
  DepartmentCsvImportPage, UploadResult, departmentCsvUploadPath, 画面の小見出し, 登録完了,
} from "../../pages/admin/m03_20_department_csv";
import { M0320_ADMIN, M0320L_ADMIN, m0320File, ゼロ幅を含む部門コード, ゼロ幅を含む部門名 } from "../../seeds/m03-20";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本の事前準備①「管理者m0320_adminを稼働中・ロックなしにする」の管理者でログインする */
async function signIn(page: Page, account: Account = M0320_ADMIN): Promise<DepartmentCsvImportPage> {
  await loginAdmin(page, account);
  return new DepartmentCsvImportPage(page);
}

/** アップロードボタンを押した結果（応答・戻った画面・画面上部の帯）を注記に残す */
async function noteUpload(u: DepartmentCsvImportPage, r: UploadResult, when: string): Promise<void> {
  if (!r.sent) {
    note(`${when}: ブラウザの入力チェックが送信を止めた（取込の要求は送られていない）: ${r.止めた項目.join(" / ")}`);
    return;
  }
  const m = await u.messages();
  note(`${when}: 取込の要求の応答 ${r.status}、戻った画面 ${r.path}。画面上部の成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}`);
}

/** 手順の途中の「登録完了のメッセージが表示されることを確かめる」 */
async function expectComplete(u: DepartmentCsvImportPage, r: UploadResult, what: string): Promise<void> {
  if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
  const m = await u.messages();
  expect(m.エラー, `${what}: 画面上部の誤りの帯`).toEqual([]);
  expect(m.成功.join(" / "), `${what}: 登録完了のメッセージ`).toContain(登録完了);
}

/** 正本の手順1〜3（部門登録CSVアップロード画面を開く／ファイルを選択する／CSVファイルのアップロードボタンを押す） */
async function upload3(ctx: CaseCtx, fileName: string): Promise<{ u: DepartmentCsvImportPage; r: UploadResult }> {
  const { page, step } = ctx;
  const u = await signIn(page);
  let r: UploadResult = { sent: false, 止めた項目: [] };
  await step(1, async () => { await u.open(); });
  await step(2, async () => {
    const f = m0320File(fileName);
    await u.choose(f);
    note(`${f.name}（${f.buffer.length} バイト・送る形式種別 ${f.mimeType}）を選んだ`);
  });
  await step(3, async () => { r = await u.pressUpload(); await noteUpload(u, r, "アップロードのあと"); });
  return { u, r };
}

/** 誤りの帯の1文に当てる条件 */
type 文の条件 = (t: string) => boolean;
/** すべての正規表現に当たる文 */
const すべて = (...res: RegExp[]): 文の条件 => (t) => res.every((re) => re.test(t));
/** N行目のことを言う文（アプリの文は「2 行目の …」と「… 2 行目のデータを確認してください。」の2つの形がある） */
const 行 = (n: number): RegExp => new RegExp(`(^|[^0-9])${n}\\s*行目`);
/** 取込ファイルの列（見出しの順） */
const 値の列 = ["部門名", "部門コード", "免税区分", "MTGBuyer表示フラグ"];

/** 誤りの帯の1文の形（注記に出す説明つき） */
type 誤りの形 = { 説明: string; 文: 文の条件 };
/** N行目のどの誤りでも */
const N行目の誤り = (n: number): 誤りの形 => ({ 説明: `${n}行目の誤り（取込は行を上から検査し、最初の誤りで止まる）`, 文: すべて(行(n)) });
/** N行目の、挙げた列の値の誤り */
const N行目の列の誤り = (n: number, 列: string[]): 誤りの形 => ({
  説明: `${n}行目の${列.join("・")}の誤り（取込は1行の列を左から検査し、最初の誤りで止まる）`,
  文: (t) => 行(n).test(t) && 列.some((c) => t.includes(c)),
});
/** 部門コードが0以上の整数でない誤り（アプリの取込は部門コードを数字だけに限る。設計書の中で書式が食い違う。記録の裁定案2） */
const 数字でない部門コード = (n: number): 誤りの形 => ({
  説明: `${n}行目の部門コードが数字でない誤り（記録の裁定案2）`,
  文: すべて(行(n), /部門コード.*0以上の数値を設定してください/),
});

/** 期待結果が「〜のため、追加されない・更新されないこと」と定める理由1つ */
type 止まる理由 = {
  説明: string;
  /** その理由で止まったときの誤りの帯の文（どれか1文が当たれば、理由を確かめたことにする） */
  文: 文の条件;
  /** 取込の要求の応答の状態だけで理由を確かめられるとき（なりすまし対策トークンの拒否） */
  応答?: number;
  /**
   * アプリの検査の順で、この理由の検査より先にある誤り（アプリのソースで確かめたもの）。
   * 誤りの帯がどれもこれなら、理由の検査まで届いていないので合否未判定にする。無ければ、理由が帯に出ないときは落とす。
   */
  先の誤り?: 誤りの形[];
};

/**
 * 期待結果の理由（「ID列が数字のみでないため」など）を、アップロードのあとの画面上部の誤りの帯で1つずつ確かめる（期待結果の中で呼ぶ）。
 * 取込は、なりすまし対策トークン・ファイルの大きさを検査したあと、行を上から、1行の中は列を左から
 * （ID・部門名・部門コード・免税区分・MTGBuyer表示フラグの順に）検査し、最初の誤りで止まる。帯に出る誤りは1つだけ。
 * - 帯に理由の文が出ていれば、その理由は確かめた（注記に残す）。
 * - 出ていないとき、帯の誤りがどれも、アプリの検査の順でその理由より先にある誤り（理由.先の誤り）なら、理由の検査まで届いていない。
 *   「追加されない・更新されないこと」は理由によらず満たされるので、合格に数えず合否未判定とする（M03-41 の020 と同じ扱い）。
 *   その注記の文を返し、呼んだ側が期待結果のあとでスキップする。
 * - それ以外（帯が無い・別の誤り）は、理由で止まっていないので落とす。
 */
async function expectStoppedFor(u: DepartmentCsvImportPage, r: UploadResult, 理由たち: 止まる理由[]): Promise<string[]> {
  if (!r.sent) {
    expect.soft(r.sent, `${理由たち.map((x) => x.説明).join("・")}で止まった（取込の要求が送られていない）`).toBe(true);
    return [];
  }
  const m = await u.messages();
  const 帯 = m.エラー.join(" / ") || "なし";
  const 届いていない: string[] = [];
  for (const 理由 of 理由たち) {
    if (理由.応答 !== undefined && r.status === 理由.応答) {
      note(`期待結果の理由「${理由.説明}」は、取込の要求の応答 ${r.status} で確かめた`);
      continue;
    }
    const 当たった文 = m.エラー.find(理由.文);
    if (当たった文) {
      note(`期待結果の理由「${理由.説明}」は、誤りの帯「${当たった文}」で確かめた`);
      continue;
    }
    const 先 = m.エラー.map((t) => (理由.先の誤り ?? []).find((f) => f.文(t)));
    if (先.length > 0 && 先.every((f) => f !== undefined)) {
      const 説明 = [...new Set(先.map((f) => f!.説明))].join("・");
      const 裁定案2 = m.エラー.some((t) => /部門コード.*0以上の数値を設定してください/.test(t))
        ? "。先に止めた誤りは部門コードが数字でないことで、部門コードを数字に限るアプリと、数字でない正本の部門コードの食い違いによる（記録の裁定案2）" : "";
      届いていない.push(`期待結果の理由「${理由.説明}」は、取込がアプリの検査の順でそれより先にある誤り（${説明}）で止まったので、検査まで届いていない（誤りの帯「${帯}」）${裁定案2}`);
      continue;
    }
    expect.soft(false, `画面上部の誤りの帯に「${理由.説明}」を示す文がある${理由.応答 ? `、または取込の要求の応答が ${理由.応答}` : ""}（誤りの帯「${帯}」、取込の要求の応答 ${r.status}）`).toBe(true);
  }
  return 届いていない;
}

/** expectStoppedFor が届いていない理由を返したら、期待結果の確かめのあとで、注記を残してスキップする（ほかの確かめが落ちていれば不合格のまま） */
function skipIfUnverified(reasons: string[]): void {
  if (!reasons.length) return;
  const text = `合否未判定。${reasons.join("。")}。「追加されない・更新されないこと」は理由によらず満たされるので、合格に数えない`;
  note(text);
  if (test.info().errors.length === 0) test.skip(true, text);
}

/** 1行目のデータ（ファイルの2行目）の、IDに該当する部門の検査より先にある誤り（列の値の検査。取込は列の値を検査してから、IDを検査する） */
const 二行目の列の誤り = N行目の列の誤り(2, 値の列);

/** 比べる値（部門IDを除く）。免税区分は保存された値（0:対象外・1:一般品・2:消耗品）、MTGBuyer表示フラグは表示=true */
type 部門の値 = { 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: boolean };
const 値 = (d: 保存された部門): 部門の値 => ({ 部門名: d.部門名, 部門コード: d.部門コード, 免税区分: d.免税区分, MTGBuyer表示フラグ: d.MTGBuyer表示フラグ });
const 期待 = (部門名: string, 部門コード: string, 免税区分: string, MTGBuyer表示フラグ: boolean): 部門の値 => ({ 部門名, 部門コード, 免税区分, MTGBuyer表示フラグ });
const 名とコード = (d: 保存された部門) => ({ 部門名: d.部門名, 部門コード: d.部門コード });

// ---- 新規追加・更新 ----

caseTest("IT-M03-20-001", async (ctx) => {
  await upload3(ctx, "bulk_new.csv");
  let got: 保存された部門[][] = [];
  await ctx.step(4, async () => { got = ["CSV新規部門A", "CSV新規部門B", "CSV新規部門C"].map((n) => 部門名の部門(n)); });
  await ctx.expected(async () => {
    expect.soft(got[0].map(値), "部門名「CSV新規部門A」の部門").toEqual([期待("CSV新規部門A", "M0320-NEW-A-001", "0", false)]);
    expect.soft(got[1].map(値), "部門名「CSV新規部門B」の部門").toEqual([期待("CSV新規部門B", "M0320-NEW-B-001", "1", true)]);
    expect.soft(got[2].map(値), "部門名「CSV新規部門C」の部門").toEqual([期待("CSV新規部門C", "M0320-NEW-C-001", "2", true)]);
  });
});

caseTest("IT-M03-20-002", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-002〕");
  await upload3(ctx, "update-002.csv");
  let got = null as 保存された部門 | null;
  await ctx.step(4, async () => { got = 部門(id); });
  await ctx.expected(async () => {
    expect(got && 値(got), `ID ${id} の部門`).toEqual(期待("CSV更新部門", "DPT-020", "2", true));
  });
});

caseTest("IT-M03-20-003", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-003〕");
  await upload3(ctx, "mixed.csv");
  let updated = null as 保存された部門 | null;
  let added: 保存された部門[] = [];
  await ctx.step(4, async () => { updated = 部門(id); added = 部門名の部門("混在新規部門"); });
  await ctx.expected(async () => {
    expect.soft(updated?.部門名, `ID ${id} の部門の部門名`).toBe("混在更新部門");
    expect.soft(added.length, "部門名「混在新規部門」の部門の件数").toBe(1);
  });
});

caseTest("IT-M03-20-004", async (ctx) => {
  const { u, r } = await upload3(ctx, "unknown_id.csv");
  let byId = null as 保存された部門 | null;
  let byName: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { byId = 部門("999999"); byName = 部門名の部門("未登録ID部門"); });
  await ctx.expected(async () => {
    expect.soft(byId, "部門ID 999999 の部門").toBeNull();
    expect.soft(byName.map(値), "部門名「未登録ID部門」の部門").toEqual([]);
    // 「刷新後の表示メッセージ仕様に従い」: 設計書の表示メッセージは、部門ID列の値に該当する部門が無いとき「更新対象の部門IDが存在しません。…空で登録」を出して中止する。
    // 意味（2行目のID 999999 に該当する部門が無い旨）と、文言（設計書は「…」で途中を省くので、前後の固定の部分）を分けて確かめる。文言が違えば落とす
    unverified = await expectStoppedFor(u, r, [
      {
        説明: "2行目のID 999999 に該当する部門が無いこと",
        文: すべて(行(2), /\bID\b/, /999999/, /(マスターから取得できません|存在しません)/),
        先の誤り: [二行目の列の誤り],
      },
      {
        説明: "刷新後の表示メッセージの文言「更新対象の部門IDが存在しません。…空で登録」",
        文: すべて(/更新対象の部門IDが存在しません。.*空で登録/),
        先の誤り: [二行目の列の誤り],
      },
    ]);
  });
  skipIfUnverified(unverified);
});

caseTest("IT-M03-20-005", async (ctx) => {
  await upload3(ctx, "no_id_header.csv");
  let got: 保存された部門[] = [];
  await ctx.step(4, async () => { got = 部門名の部門("ID列なし部門"); });
  await ctx.expected(async () => {
    expect(got.map((d) => d.部門名), "部門名「ID列なし部門」の部門（1件追加）").toEqual(["ID列なし部門"]);
  });
});

caseTest("IT-M03-20-006", async (ctx) => {
  await upload3(ctx, "blank_ids.csv");
  let a: 保存された部門[] = [];
  let b: 保存された部門[] = [];
  await ctx.step(4, async () => { a = 部門名の部門("空ID部門A"); b = 部門名の部門("空ID部門B"); });
  await ctx.expected(async () => {
    expect.soft(a.map((d) => d.部門名), "部門名「空ID部門A」の部門（1件）").toEqual(["空ID部門A"]);
    expect.soft(b.map((d) => d.部門名), "部門名「空ID部門B」の部門（1件）").toEqual(["空ID部門B"]);
  });
});

caseTest("IT-M03-20-007", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-007〕");
  await upload3(ctx, "same_master_values.csv");
  let got = null as 保存された部門 | null;
  await ctx.step(4, async () => { got = 部門(id); });
  await ctx.expected(async () => {
    // 部門名・部門コードは元のまま（重複として扱われず取り込まれる）、免税区分2・MTGBuyer表示フラグ1（表示）へ更新される
    expect(got && 値(got), `ID ${id} の部門`).toEqual(期待("既存部門A-M03-20-007", "DPT-020-007", "2", true));
  });
});

// ---- 項目の値の検証 ----

caseTest("IT-M03-20-008", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-008〕");
  const { u, r } = await upload3(ctx, "required_empty.csv");
  // ファイル内の新規行の部門名・部門コード（正本が値を書いていないので解釈で入れた値。seeds/m03-20.ts の 解釈の値）
  const 新規の部門名 = ["必須空欄確認部門B-008", "必須空欄確認部門C-008"];
  const 新規の部門コード = ["93200802", "93200804"];
  let got = null as 保存された部門 | null;
  let byName: 保存された部門[] = [];
  let byCode: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => {
    got = 部門(id);
    byName = 新規の部門名.flatMap((n) => 部門名の部門(n));
    byCode = 新規の部門コード.flatMap((c) => 部門コードの部門(c));
  });
  await ctx.expected(async () => {
    expect.soft(got && 値(got), `ID ${id} の部門（更新されない）`).toEqual(期待("既存部門A-M03-20-008", "DPT-020-008", "0", false));
    expect.soft(byName.map(値), `部門名「${新規の部門名.join("」「")}」の部門（追加されない）`).toEqual([]);
    expect.soft(byCode.map(値), `部門コード ${新規の部門コード.join("・")} の部門（追加されない）`).toEqual([]);
    // 「部門名・部門コード・免税区分の空欄を含むため」: ファイルの3行目が部門名、4行目が部門コード、5行目が免税区分の空欄（seeds/m03-20.ts の 解釈の値）。
    // 取込は最初の誤りで止まるので、後の行の空欄の理由は、前の行の誤りがあれば届かない（合否未判定。記録の裁定案6）
    unverified = await expectStoppedFor(u, r, [
      { 説明: "3行目の部門名が空欄であること", 文: すべて(行(3), /部門名/, /(必須|空)/), 先の誤り: [N行目の誤り(2)] },
      { 説明: "4行目の部門コードが空欄であること", 文: すべて(行(4), /部門コード/, /(必須|空)/), 先の誤り: [N行目の誤り(2), N行目の誤り(3)] },
      { 説明: "5行目の免税区分が空欄であること", 文: すべて(行(5), /免税区分/, /(必須|空)/), 先の誤り: [N行目の誤り(2), N行目の誤り(3), N行目の誤り(4)] },
    ]);
  });
  skipIfUnverified(unverified);
});

const 名128 = "名".repeat(128), C128 = "C".repeat(128), 名129 = "名".repeat(129), C129 = "C".repeat(129);

caseTest("IT-M03-20-009", async (ctx) => {
  await upload3(ctx, "text_length_128.csv");
  let got: 保存された部門[] = [];
  await ctx.step(4, async () => { got = 部門名の部門(名128); });
  await ctx.expected(async () => {
    expect(got.map(名とコード), "部門名「名」128文字の部門（部門コード「C」128文字で1件）").toEqual([{ 部門名: 名128, 部門コード: C128 }]);
  });
});

caseTest("IT-M03-20-010", async (ctx) => {
  const { u, r } = await upload3(ctx, "text_length_129.csv");
  let byName: 保存された部門[] = [];
  let byCode: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { byName = 部門名の部門(名129); byCode = 部門コードの部門(C129); });
  await ctx.expected(async () => {
    expect.soft(byName.map(名とコード), "部門名「名」129文字の部門").toEqual([]);
    expect.soft(byCode.map(名とコード), "部門コード「C」129文字の部門").toEqual([]);
    // 「部門名と部門コードが最大文字数を1文字超えるため」: 部門名と部門コードの理由を分けて確かめる。
    // 取込は1行の列を左から検査して最初の誤りで止まり、部門コードは数字の検査を文字数の検査より先に行うので、
    // 部門コードの文字数の誤りは、部門名の誤りか部門コードの数字の誤りがあれば帯に出ない（合否未判定。記録の裁定案2・裁定案6）
    unverified = await expectStoppedFor(u, r, [
      { 説明: "2行目の部門名が最大文字数128を1文字超えること", 文: すべて(行(2), /部門名/, /128\s*文字以内/) },
      {
        説明: "2行目の部門コードが最大文字数128を1文字超えること",
        文: すべて(行(2), /部門コード/, /128\s*文字以内/),
        先の誤り: [N行目の列の誤り(2, ["部門名"]), 数字でない部門コード(2)],
      },
    ]);
  });
  skipIfUnverified(unverified);
});

/**
 * 手順1〜3のあと、手順4で部門名の部門を読み、期待結果で「追加されないこと」（0件）を確かめる形。
 * 期待結果が理由（「〜のため」）を定めるケースは、理由も渡して誤りの帯で確かめる（expectStoppedFor）。
 */
function 追加されない(fileName: string, 部門名: string, 理由たち: 止まる理由[]): CaseBody {
  return async (ctx) => {
    const { u, r } = await upload3(ctx, fileName);
    let got: 保存された部門[] = [];
    let unverified: string[] = [];
    await ctx.step(4, async () => { got = 部門名の部門(部門名); });
    await ctx.expected(async () => {
      expect.soft(got.map(値), `部門名「${部門名}」の部門（追加されない）`).toEqual([]);
      unverified = await expectStoppedFor(u, r, 理由たち);
    });
    skipIfUnverified(unverified);
  };
}

caseTest("IT-M03-20-013", 追加されない("id_text.csv", "文字ID部門", [{
  説明: "2行目のID列が数字のみでないこと",
  // アプリの文（「… ID は0以上の数値を設定してください。」）か、設計書の表示メッセージ（数字のみでないとき「◯行目の部門IDが存在しません。」）
  文: (t) => 行(2).test(t) && /\bID\b/.test(t) && /(数値|数字|部門IDが存在しません)/.test(t),
  先の誤り: [二行目の列の誤り],
}]));

caseTest("IT-M03-20-014", async (ctx) => {
  await upload3(ctx, "tax_values.csv");
  let got: 保存された部門[][] = [];
  await ctx.step(4, async () => { got = ["免税区分0部門", "免税区分1部門", "免税区分2部門"].map((n) => 部門名の部門(n)); });
  await ctx.expected(async () => {
    expect.soft(got[0].map((d) => d.免税区分), "「免税区分0部門」の免税区分（0:対象外で1件）").toEqual(["0"]);
    expect.soft(got[1].map((d) => d.免税区分), "「免税区分1部門」の免税区分（1:一般品で1件）").toEqual(["1"]);
    expect.soft(got[2].map((d) => d.免税区分), "「免税区分2部門」の免税区分（2:消耗品で1件）").toEqual(["2"]);
  });
});

/** 2行目のその列の値が範囲を超える・数値でない誤り（アプリは選択肢に無い値を「… の値が異常です。」、数値でない値を「… は0以上の数値を設定してください。」とする） */
const 範囲外の値 = (列: string): 文の条件 => (t) => 行(2).test(t) && t.includes(列) && /(値が異常|範囲|最大|以下|選択)/.test(t);
const 数値でない値 = (列: string): 文の条件 => (t) => 行(2).test(t) && t.includes(列) && /(数値|数字|値が異常)/.test(t);

caseTest("IT-M03-20-015", 追加されない("tax_value_3.csv", "免税区分3部門", [{
  説明: "2行目の免税区分3が最大値2を超えること", 文: 範囲外の値("免税区分"), 先の誤り: [N行目の列の誤り(2, ["部門名", "部門コード"])],
}]));
caseTest("IT-M03-20-016", 追加されない("tax_text.csv", "免税区分文字部門", [{
  説明: "2行目の免税区分が数値でないこと", 文: 数値でない値("免税区分"), 先の誤り: [N行目の列の誤り(2, ["部門名", "部門コード"])],
}]));

caseTest("IT-M03-20-017", async (ctx) => {
  await upload3(ctx, "buyer_flags.csv");
  let hidden: 保存された部門[] = [];
  let shown: 保存された部門[] = [];
  await ctx.step(4, async () => { hidden = 部門名の部門("Buyer非表示部門"); shown = 部門名の部門("Buyer表示部門"); });
  await ctx.expected(async () => {
    expect.soft(hidden.map((d) => d.MTGBuyer表示フラグ), "「Buyer非表示部門」のMTGBuyer表示フラグ（非表示で1件）").toEqual([false]);
    expect.soft(shown.map((d) => d.MTGBuyer表示フラグ), "「Buyer表示部門」のMTGBuyer表示フラグ（表示で1件）").toEqual([true]);
  });
});

caseTest("IT-M03-20-018", 追加されない("buyer_flag_2.csv", "Buyerフラグ2部門", [{
  説明: "2行目のMTGBuyer表示フラグ2が最大値1を超えること",
  文: 範囲外の値("MTGBuyer表示フラグ"),
  先の誤り: [N行目の列の誤り(2, ["部門名", "部門コード", "免税区分"])],
}]));
caseTest("IT-M03-20-019", 追加されない("buyer_flag_text.csv", "Buyerフラグ文字部門", [{
  説明: "2行目のMTGBuyer表示フラグが数値でないこと",
  文: 数値でない値("MTGBuyer表示フラグ"),
  先の誤り: [N行目の列の誤り(2, ["部門名", "部門コード", "免税区分"])],
}]));

// ---- ファイルの検証・読み取り ----

caseTest("IT-M03-20-020", async ({ page, step, expected }) => {
  const u = await signIn(page);
  await step(1, async () => { await u.open(); });
  await step(2, async () => {
    await expect(u.ファイル, "ファイル選択欄が空（ファイルを選んでいない）").toHaveValue("");
    const r = await u.pressUpload();
    await noteUpload(u, r, "アップロードボタンを押したあと");
  });
  await expected(async () => {
    expect.soft(u.path(), "ボタンを押したあとに開いている画面").toBe(departmentCsvUploadPath());
    await expect.soft(u.小見出し, "ボタンを押したあとの画面の小見出し").toHaveText(画面の小見出し);
  });
});

caseTest("IT-M03-20-022", async (ctx) => {
  const { u, r } = await upload3(ctx, "configured_limit_plus_1.csv");
  let got: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門コードの部門("OVER-SIZE-001"); });
  await ctx.expected(async () => {
    expect.soft(got.map(値), "部門コード OVER-SIZE-001 の部門（追加されない）").toEqual([]);
    // 「設定されたファイルサイズ上限を1バイト超えるため」: 大きさの検査は、行の値の検査より先にある（アプリは取込の前のフォームの検査で大きさを見る）。
    // 行の値の誤り（部門コードが数字でない など）が帯に出れば、大きさの検査を通ってしまったので落とす（先の誤りは無い）
    unverified = await expectStoppedFor(u, r, [{
      説明: "ファイルの大きさが上限を超えること",
      文: (t) => /(ファイルのサイズが大きすぎ|サイズ.*(上限|以下|超え)|大きさ.*(上限|超え))/.test(t),
    }]);
  });
  skipIfUnverified(unverified);
});

/** 手順1〜3のあと、手順4で部門名の部門を読み、期待結果で「追加されること」（1件）を確かめる形 */
function 追加される(fileName: string, 部門名: string): CaseBody {
  return async (ctx) => {
    await upload3(ctx, fileName);
    let got: 保存された部門[] = [];
    await ctx.step(4, async () => { got = 部門名の部門(部門名); });
    await ctx.expected(async () => {
      expect(got.map((d) => d.部門名), `部門名「${部門名}」の部門（1件追加）`).toEqual([部門名]);
    });
  };
}

caseTest("IT-M03-20-024", 追加される("comma_text.txt", "テキスト形式部門"));
caseTest("IT-M03-20-025", 追加される("tab_file.tsv", "タブ区切り部門"));
// 文字化けしていれば、部門名が「文字コード変換部門」と一致しない
caseTest("IT-M03-20-026", 追加される("shift_jis.csv", "文字コード変換部門"));

caseTest("IT-M03-20-027", async (ctx) => {
  await upload3(ctx, "zero_width.csv");
  let got: 保存された部門[] = [];
  let left: 保存された部門[] = [];
  await ctx.step(4, async () => {
    got = 部門コードの部門("ZEROWIDTH");
    left = [...部門名の部門(ゼロ幅を含む部門名), ...部門コードの部門(ゼロ幅を含む部門コード)];
  });
  await ctx.expected(async () => {
    expect.soft(got.map(名とコード), "部門コード ZEROWIDTH の部門（部門名「ゼロ幅部門」で1件）").toEqual([{ 部門名: "ゼロ幅部門", 部門コード: "ZEROWIDTH" }]);
    expect.soft(left.map(名とコード), "ゼロ幅文字を含んだままの部門名・部門コードの部門（取り除かれていれば無い）").toEqual([]);
  });
});

// ---- 見出し行・データ行・列数 ----

/** 手順1〜3のあと、期待結果で部門登録CSVアップロード画面へ戻ったことを確かめる形（ブラウザのみ） */
function 画面へ戻る(fileName: string): CaseBody {
  return async (ctx) => {
    const { u, r } = await upload3(ctx, fileName);
    await ctx.expected(async () => {
      // 「戻る」は、取込の要求を送ったうえで、この画面へ戻ってくること（ブラウザが送信を止めて元の画面に留まったのでは戻ったことにならない）
      expect.soft(r.sent, "取込の要求が送られた").toBe(true);
      expect.soft(u.path(), "アップロードのあとに開いている画面").toBe(departmentCsvUploadPath());
      await expect.soft(u.小見出し, "アップロードのあとの画面の小見出し").toHaveText(画面の小見出し);
    });
  };
}

caseTest("IT-M03-20-028", 画面へ戻る("empty-028.csv"));

caseTest("IT-M03-20-029", async (ctx) => {
  const ids = ["029A", "029B", "029C", "029D"].map((n) => ctx.notes.get(`〔部門ID-M0320-${n}〕`));
  // 事前準備③の「4部門をシード表の値に戻し、現在の部門総件数を控え」（シードを作ったあと、手順の前）
  const before = { 件数: 部門の総件数(), 値: ids.map((id) => 部門(id)) };
  expect(before.値.map((d) => d && 値(d)), "取込前の4部門がシード表の値であること（事前準備）").toEqual([
    期待("既存部門A-029", "DPT-020-029", "0", false), 期待("既存部門B-029", "DPT-021-029", "1", true),
    期待("重複既存名-029", "DPT-022-029", "0", false), 期待("既存部門C-029", "DUP-CODE-029", "0", false),
  ]);
  note(`取込前の部門の総件数: ${before.件数}`);
  await upload3(ctx, "empty-M0320-029.csv");
  let after = { 件数: -1, 値: [] as (保存された部門 | null)[] };
  await ctx.step(4, async () => { after = { 件数: 部門の総件数(), 値: ids.map((id) => 部門(id)) }; });
  await ctx.expected(async () => {
    expect.soft(after.件数, "部門の総件数（取込前と同じ）").toBe(before.件数);
    expect.soft(after.値, `ID ${ids.join("・")} の部門（取込前と同じ）`).toEqual(before.値);
  });
});

caseTest("IT-M03-20-030", 画面へ戻る("missing_code_header-030.csv"));
/** 見出しの誤り（アプリは見出しの読み取りの誤りを、行番号の無い「CSVのフォーマットが一致しません。」とする） */
const 見出しの誤り: 文の条件 = (t) => /^CSVのフォーマットが一致しません。$/.test(t);

// 「必須の部門コード見出しがないため」: 見出しの誤りか、部門コードの列（見出し）が無い旨の文で確かめる。
// 設計書の取込の判定順序では、見出し名が定義と一致することの判定（順序4）が、データ行の列の数の判定（順序5）とそのあとの行の検査より先にあるので、
// 先の誤りは置かない（行の列の数の誤りなど、別の誤りで止まれば落とす）
caseTest("IT-M03-20-031", 追加されない("missing_code_header-031.csv", "見出し不足部門", [{
  説明: "部門コードの見出しが無いこと",
  文: (t) => 見出しの誤り(t) || (t.includes("部門コード") && /(見出し|ヘッダ|データを取得できません)/.test(t)),
}]));

caseTest("IT-M03-20-032", async (ctx) => {
  // 事前準備③の「現在の部門総件数を控える」（手順の前）
  const before = 部門の総件数();
  note(`取込前の部門の総件数: ${before}`);
  const { u, r } = await upload3(ctx, "header_only.csv");
  let after = -1;
  let unverified: string[] = [];
  await ctx.step(4, async () => { after = 部門の総件数(); });
  await ctx.expected(async () => {
    expect.soft(after, "部門の総件数（取込前と同じ）").toBe(before);
    // 「2行目以降にデータ行がないため」: データ行が無い旨の誤りの帯で確かめる。データ行の有無の検査は見出し行の読み取りのすぐあとで、
    // 行の値の検査より前にある（先の誤りは置かない。見出しの誤りなど別の誤りで止まれば落とす）
    unverified = await expectStoppedFor(u, r, [{
      説明: "2行目以降にデータ行が無いこと",
      文: (t) => /(CSVデータが存在しません|データ行が(無い|ありません|存在しません))/.test(t),
    }]);
  });
  skipIfUnverified(unverified);
});

// 「刷新前の見出し「表示フラグ」は定義と一致しないため」: 見出しの誤りか、MTGBuyer表示フラグの列（見出し）が無い旨の文で確かめる。
// 設計書の取込の判定順序では、見出し名が定義と一致することの判定（順序4）が、データ行の検査より先にある。設計書の順なら、
// 2行目の値（部門コードの書式など。記録の裁定案2）によらず見出しの誤りで止まるので、031 と同じく先の誤りは置かない
// （2行目の値の誤りなど、別の誤りで止まれば落とす）
caseTest("IT-M03-20-033", 追加されない("old_display_header.csv", "旧表示フラグ部門", [{
  説明: "見出し「表示フラグ」が定義（MTGBuyer表示フラグ）と一致しないこと",
  文: (t) => 見出しの誤り(t) || (t.includes("表示フラグ") && /(見出し|ヘッダ|データを取得できません)/.test(t)),
}]));

caseTest("IT-M03-20-034", async (ctx) => {
  const { u, r } = await upload3(ctx, "column_count_mismatch.csv");
  let ok: 保存された部門[] = [];
  let ng: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { ok = 部門名の部門("列数正常部門"); ng = 部門名の部門("列数不足部門"); });
  await ctx.expected(async () => {
    expect.soft(ok.map(値), "部門名「列数正常部門」の部門（追加されない）").toEqual([]);
    expect.soft(ng.map(値), "部門名「列数不足部門」の部門（追加されない）").toEqual([]);
    // 「データ行の列数が見出しの列数と一致しないため」: 列数が足りないのはファイルの3行目。取込は行を上から検査するので、2行目の誤りが先に出れば届かない
    unverified = await expectStoppedFor(u, r, [{
      説明: "3行目の列の数が見出しの列の数と一致しないこと",
      文: すべて(行(3), /(フォーマットが一致しません|列数|列の数)/),
      先の誤り: [N行目の誤り(2)],
    }]);
  });
  skipIfUnverified(unverified);
});

// ---- 重複 ----

caseTest("IT-M03-20-035", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-035〕");
  const { u, r } = await upload3(ctx, "duplicate_id.csv");
  let got = null as 保存された部門 | null;
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門(id); });
  await ctx.expected(async () => {
    expect.soft(got && 値(got), `ID ${id} の部門（「既存部門A」から更新されない）`).toEqual(期待("既存部門A", "DPT-020-035", "0", false));
    // 「同一ファイル内でIDが重複するため」: 重複するのはファイルの3行目。取込は2行目と、3行目の列の値を検査してから重複を検査する
    unverified = await expectStoppedFor(u, r, [{ 説明: "3行目のIDがファイル内で重複すること", ...ファイル内の重複(3, /\bID\b/) }]);
  });
  skipIfUnverified(unverified);
});

/** N行目のその列がファイル内で重複する誤りと、その検査より先にある誤り（前の行の誤り、N行目の列の値の誤り） */
function ファイル内の重複(n: number, 列: RegExp): Pick<止まる理由, "文" | "先の誤り"> {
  return {
    文: すべて(行(n), 列, /重複/),
    先の誤り: [...Array.from({ length: n - 2 }, (_, i) => N行目の誤り(i + 2)), { ...N行目の列の誤り(n, 値の列), 文: (t) => N行目の列の誤り(n, 値の列).文(t) && !/重複/.test(t) }],
  };
}

caseTest("IT-M03-20-036", 追加されない("duplicate_name.csv", "ファイル内重複名", [
  { 説明: "3行目の部門名がファイル内で重複すること", ...ファイル内の重複(3, /部門名/) },
]));

caseTest("IT-M03-20-037", async (ctx) => {
  const { u, r } = await upload3(ctx, "duplicate_code.csv");
  let got: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門コードの部門("FILE-DUP-CODE"); });
  await ctx.expected(async () => {
    expect.soft(got.map(値), "部門コード FILE-DUP-CODE の部門（追加されない）").toEqual([]);
    unverified = await expectStoppedFor(u, r, [{ 説明: "3行目の部門コードがファイル内で重複すること", ...ファイル内の重複(3, /部門コード/) }]);
  });
  skipIfUnverified(unverified);
});

/**
 * N行目のその列が既存の部門と重複する誤り（設計書の取込の判定順序の7「重複があれば、列名と行番号を示すエラーを表示して全体を中止する」）。
 * ファイル内の重複の文（アプリの「N 行目の〔列名〕がCSV内で重複しています。」）は、既存の部門との重複の理由に数えない。
 */
const 既存の部門と重複 = (n: number, 列: RegExp): 文の条件 => (t) => 行(n).test(t) && 列.test(t) && /重複/.test(t) && !/(CSV内|ファイル内)/.test(t);
/** N行目の列の値の誤り（重複の文を除く）。取込は1行の列の値を検査してから重複を検査するので、既存の部門との重複の検査より先にある */
const N行目の列の値の誤り = (n: number): 誤りの形 => ({ ...N行目の列の誤り(n, 値の列), 文: (t) => N行目の列の誤り(n, 値の列).文(t) && !/重複/.test(t) });

caseTest("IT-M03-20-038", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-038〕");
  const { u, r } = await upload3(ctx, "duplicate_master_name.csv");
  let got: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門名の部門("重複既存名"); });
  await ctx.expected(async () => {
    expect.soft(got.map((d) => d.部門ID), "部門名「重複既存名」の部門（既存の1件だけ）").toEqual([id]);
    // 「既存の部門と部門名が重複するため」: 部門名が既存の部門と重複するのはファイルの2行目。
    // 2行目の列の値の誤り（部門コードが数字でない など）で先に止まれば、重複の検査まで届いていない（合否未判定）。誤りの帯が無い・別の誤りなら落とす
    unverified = await expectStoppedFor(u, r, [{
      説明: "2行目の部門名が既存の部門と重複すること",
      文: 既存の部門と重複(2, /部門名/),
      先の誤り: [N行目の列の値の誤り(2)],
    }]);
  });
  skipIfUnverified(unverified);
});

caseTest("IT-M03-20-039", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-039〕");
  const { u, r } = await upload3(ctx, "duplicate_master_code.csv");
  let got: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門コードの部門("DUP-CODE"); });
  await ctx.expected(async () => {
    expect.soft(got.map((d) => d.部門ID), "部門コード DUP-CODE の部門（既存の1件だけ）").toEqual([id]);
    // 「既存の部門と部門コードが重複するため」: 部門コードが既存の部門と重複するのはファイルの2行目。038 と同じ確かめ方
    unverified = await expectStoppedFor(u, r, [{
      説明: "2行目の部門コードが既存の部門と重複すること",
      文: 既存の部門と重複(2, /部門コード/),
      先の誤り: [N行目の列の値の誤り(2)],
    }]);
  });
  skipIfUnverified(unverified);
});

caseTest("IT-M03-20-040", async (ctx) => {
  const id = ctx.notes.get("〔部門ID-M0320-040〕");
  const { u, r } = await upload3(ctx, "atomic_error.csv");
  let got = null as 保存された部門 | null;
  let added: 保存された部門[] = [];
  let unverified: string[] = [];
  await ctx.step(4, async () => { got = 部門(id); added = 部門名の部門("原子性新規部門"); });
  await ctx.expected(async () => {
    expect.soft(got && 値(got), `ID ${id} の部門（更新されない）`).toEqual(期待("既存部門A-040", "DPT-020-040", "0", false));
    expect.soft(added.map(値), "部門名「原子性新規部門」の部門（追加されない）").toEqual([]);
    // 「後続行に免税区分の空欄があるため」: 免税区分が空欄なのはファイルの4行目。取込は行を上から検査するので、2・3行目の誤りが先に出れば届かない
    unverified = await expectStoppedFor(u, r, [{
      説明: "4行目の免税区分が空欄であること",
      文: すべて(行(4), /免税区分/, /(必須|空)/),
      先の誤り: [N行目の誤り(2), N行目の誤り(3)],
    }]);
  });
  skipIfUnverified(unverified);
});

// ---- なりすまし対策トークン ----

/** 手順1〜5（開く／選ぶ／開発者ツールでトークンを変える／アップロード／DBで確かめる）のあと、部門が更新されないことを確かめる形 */
function トークンを変えて取込(n: "041" | "042", token: "なし" | string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔部門ID-M0320-${n}〕`);
    const u = await signIn(page);
    let r: UploadResult = { sent: false, 止めた項目: [] };
    let got = null as 保存された部門 | null;
    let unverified: string[] = [];
    await step(1, async () => { await u.open(); });
    await step(2, async () => { await u.choose(m0320File(`update-${n}.csv`)); });
    await step(3, async () => {
      if (token === "なし") await u.removeToken();
      else await u.changeToken(token);
    });
    await step(4, async () => { r = await u.pressUpload(); await noteUpload(u, r, "アップロードのあと"); });
    await step(5, async () => { got = 部門(id); });
    await expected(async () => {
      expect.soft(got && 値(got), `ID ${id} の部門（「既存部門A-${n}」から更新されない）`).toEqual(期待(`既存部門A-${n}`, `DPT-OLD-${n}`, "0", false));
      // 「なりすまし対策トークンが欠落している・不正なため」: トークンの検査は取込の最初にある（先の誤りは無い）。
      // 拒否の応答（403）か、トークンの誤りの帯で確かめる。行の値の誤り（部門コードが数字でない など）が帯に出れば、トークンの検査を通ってしまったので落とす
      unverified = await expectStoppedFor(u, r, [{
        説明: token === "なし" ? "なりすまし対策トークンが欠落していること" : "なりすまし対策トークンが不正であること",
        文: (t) => /(CSRF|トークン)/i.test(t),
        応答: 403,
      }]);
    });
    skipIfUnverified(unverified);
  };
}

caseTest("IT-M03-20-041", トークンを変えて取込("041", "なし"));
caseTest("IT-M03-20-042", トークンを変えて取込("042", "invalid-token"));

// ---- 確定・形式種別 ----

caseTest("IT-M03-20-043", async (ctx) => {
  const { u, r } = await upload3(ctx, "new_single.csv");
  await ctx.expected(async () => {
    const m = await u.messages();
    expect.soft(r.sent, "取込の要求が送られた").toBe(true);
    expect.soft(m.成功.join(" / "), "登録完了のメッセージ").toContain(登録完了);
    expect.soft(m.エラー, "画面上部の誤りの帯").toEqual([]);
    expect.soft(u.path(), "アップロードのあとに開いている画面").toBe(departmentCsvUploadPath());
    await expect.soft(u.小見出し, "アップロードのあとの画面の小見出し").toHaveText(画面の小見出し);
  });
});

caseTest("IT-M03-20-045", 追加される("dept_text.xls", "表計算種別部門"));

// ---- 機能間の連携（部門CSV出力） ----

caseTest("IT-M03-20-051", async ({ page, step, expected }) => {
  const name = "リンク出力部門-002";
  const u = await signIn(page, M0320L_ADMIN);
  const s = new DepartmentPage(page);
  let id = "";
  let text = "";
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await u.open(); });
  await step(2, async () => { await u.choose(m0320File("linkm0320-002.csv")); });
  await step(3, async () => {
    const r = await u.pressUpload();
    await noteUpload(u, r, "アップロードのあと");
    await expectComplete(u, r, "取込");
  });
  await step(4, async () => {
    await s.openNew();
    id = await s.idOfName(name);
    note(`部門一覧の「${name}」の行のID: ${id}`);
  });
  await step(5, async () => { const csv = await s.downloadCsv(); text = csv.text; note(`ダウンロードしたファイル: ${csv.fileName}`); });
  await step(6, async () => { rows = csvRecords(text).filter((r) => r["部門名"] === name); });
  await expected(async () => {
    expect(rows.map((r) => ({ ID: r["ID"], 部門コード: r["部門コード"], 免税区分: r["免税区分"], MTGBuyer表示フラグ: r["MTGBuyer表示フラグ"] })), `CSVの「${name}」の行`)
      .toEqual([{ ID: id, 部門コード: "9320022", 免税区分: "2", MTGBuyer表示フラグ: "0" }]);
  });
});

// ---- 同じファイルの再取込・複数行の更新 ----

caseTest("IT-M03-20-052", async (ctx) => {
  const a = ctx.notes.get("〔部門ID-M0320-052A〕");
  const b = ctx.notes.get("〔部門ID-M0320-052B〕");
  await upload3(ctx, "update-052.csv");
  let got: (保存された部門 | null)[] = [];
  await ctx.step(4, async () => { got = [部門(a), 部門(b)]; });
  await ctx.expected(async () => {
    expect.soft(got[0] && 値(got[0]), `ID ${a} の部門`).toEqual(期待("M0320-052更新部門A", "M0320-052-UPD-A", "2", true));
    expect.soft(got[1] && 値(got[1]), `ID ${b} の部門`).toEqual(期待("M0320-052更新部門B", "M0320-052-UPD-B", "0", false));
  });
});

caseTest("IT-M03-20-053", async ({ page, step, expected }) => {
  const name = "M0320-053再取込新規部門";
  const code = "M0320-053-NEW";
  const u = await signIn(page);
  let second: UploadResult = { sent: false, 止めた項目: [] };
  let m2 = { 成功: [] as string[], エラー: [] as string[] };
  let byName: 保存された部門[] = [];
  let byCode: 保存された部門[] = [];
  await step(1, async () => { await u.open(); });
  await step(2, async () => { await u.choose(m0320File("new-053.csv")); });
  await step(3, async () => {
    const r = await u.pressUpload();
    await noteUpload(u, r, "1回目のアップロードのあと");
    await expectComplete(u, r, "1回目の取込");
  });
  await step(4, async () => {
    expect(u.path(), "部門登録CSVアップロード画面にいる").toBe(departmentCsvUploadPath());
    await u.choose(m0320File("new-053.csv"));
  });
  await step(5, async () => {
    second = await u.pressUpload();
    await noteUpload(u, second, "2回目のアップロードのあと");
    m2 = await u.messages();
  });
  await step(6, async () => { byName = 部門名の部門(name); byCode = 部門コードの部門(code); });
  await expected(async () => {
    // 2回目の取込が中止された（要求は送られ、登録完了のメッセージが出ない）
    expect.soft(second.sent, "2回目の取込の要求が送られた").toBe(true);
    expect.soft(m2.成功, "2回目の取込の成功の帯（中止されたので出ない）").toEqual([]);
    // 「部門名・部門コード重複で中止され」: 設計書の取込の判定順序の7は、既存の部門との重複について「列名と行番号を示すエラーを表示して全体を中止する」と定める。
    // 誤りの帯に、2行目の部門名か部門コードが既存の部門と重複する旨の文があることで確かめる（誤りの帯があるだけでは中止の理由を確かめたことにしない）。
    // 先の誤りは置かない: 同じファイルは手順3で登録完了になっている（2行目の列の値は検査を通っている）ので、2回目に列の値の誤りが出ても、重複の検査まで届かなかった理由にはならない
    await expectStoppedFor(u, second, [{
      説明: "2行目の部門名か部門コードが既存の部門と重複すること",
      文: 既存の部門と重複(2, /(部門名|部門コード)/),
    }]);
    expect.soft(byName.map(値), `部門名「${name}」の部門（1回目に登録した1件のまま）`).toEqual([期待(name, code, "0", true)]);
    expect.soft(byCode.map((d) => d.部門名), `部門コード「${code}」の部門（1件のまま）`).toEqual([name]);
  });
});

caseTest("IT-M03-20-054", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔部門ID-M0320-054〕");
  const name = "M0320-054更新部門";
  const u = await signIn(page);
  let second: UploadResult = { sent: false, 止めた項目: [] };
  let m2 = { 成功: [] as string[], エラー: [] as string[] };
  let got = null as 保存された部門 | null;
  let byName: 保存された部門[] = [];
  await step(1, async () => { await u.open(); });
  await step(2, async () => { await u.choose(m0320File("update-054.csv")); });
  await step(3, async () => {
    const r = await u.pressUpload();
    await noteUpload(u, r, "1回目のアップロードのあと");
    await expectComplete(u, r, "1回目の取込");
  });
  await step(4, async () => {
    expect(u.path(), "部門登録CSVアップロード画面にいる").toBe(departmentCsvUploadPath());
    await u.choose(m0320File("update-054.csv"));
  });
  await step(5, async () => {
    second = await u.pressUpload();
    await noteUpload(u, second, "2回目のアップロードのあと");
    m2 = await u.messages();
  });
  await step(6, async () => { got = 部門(id); byName = 部門名の部門(name); });
  await expected(async () => {
    // 2回目の取込が重複扱いにならず受理された（登録完了のメッセージが出て、誤りの帯が無い）
    expect.soft(second.sent, "2回目の取込の要求が送られた").toBe(true);
    expect.soft(m2.成功.join(" / "), "2回目の取込の登録完了のメッセージ").toContain(登録完了);
    expect.soft(m2.エラー, "2回目の取込の誤りの帯").toEqual([]);
    expect.soft(got && 値(got), `ID ${id} の部門`).toEqual(期待(name, "M0320-054-UPD", "2", true));
    expect.soft(byName.map((d) => d.部門ID), `部門名「${name}」の部門（ID ${id} の1件だけ）`).toEqual([id]);
  });
});
