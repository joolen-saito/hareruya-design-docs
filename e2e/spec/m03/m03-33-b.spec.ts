/**
 * M03-33 セール用高額商品価格変更CSV登録（その2）。正本: cases/M03-33_test_cases.tsv
 * 実装したのは、価格の分岐（001〜004）・取込履歴（013）・取込後の画面（017・018）・受け付けるファイル（022・023・025）・項目の上限（035・037）。
 *
 * 取込ファイルの列: 画面の雛形と設計書の項目定義は5列（商品コード・販売価格・セールフラグ・帯URL・タグ(ID)）で、正本のデータ行は7列
 * （買取価格・スマレジ連携フラグを含む）。正本どおり、雛形の見出し行の下に正本のデータ行をそのまま入れて取り込む（既存の 006・009〜012 と同じ。
 * ECCUBE_HARERUYA-4071）。期待結果は正本どおり書き、アプリの動きに合わせて弱めない。
 */
import { Page, test } from "@playwright/test";
import { 商品規格の状態, 取込種別 } from "../../db/m03_32_high_price";
import { メンバーID } from "../../db/m03_30_x";
import { ファイル名の取込履歴 } from "../../db/m03_33_b";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { HighPriceCsvUploadPage, pathOf, SubmitResult, uploadPath } from "../../pages/admin/m03_32_high_price_csv";
import { M0333_ADMIN, m0333FilePath } from "../../seeds/m03-33";
import { readState } from "../../seeds/m03-33-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";

async function signIn(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0333_ADMIN);
  return new HighPriceCsvUploadPage(page, "セール用高額商品価格変更");
}

type 商品 = NonNullable<ReturnType<typeof 商品規格の状態>>;
const URL_BASE = "https://replace-dev.hareruyamtg.com:8443";

/** 取込の準備と、手順ごとの操作（正本の手順の数に合わせてケースが割り振る）。期待結果の確かめはケースに書く */
async function prepare(ctx: CaseCtx, n: string, file: string, seedId = `S-M03-33-BRANCH-${n}`) {
  const { page, notes, db } = ctx;
  const code = rc(readState(seedId).code);
  const classId = notes.get(`〔商品規格ID-M0333-${n}〕`);
  const withDb = ctx.c.実行区分 !== "ブラウザのみ";
  const before = withDb ? 商品規格の状態(classId) : null;
  if (withDb) {
    expect(before, `商品規格ID ${classId} の商品規格`).not.toBeNull();
    note(`取込前（DBの参照）: 基準価格 ${before!.基準価格}・販売価格 ${before!.販売価格}・買取価格 ${before!.買取価格}・セール ${before!.セール}・帯URL ${before!.帯URL ?? "なし"}・スマレジ連携 ${before!.スマレジ連携 ?? "なし"}`);
  }
  const upload = await signIn(page);
  const t = {
    code, before: before as 商品, after: null as 商品 | null,
    sent: false, path: "", 見出し: "",
    open: async () => { await upload.open(); },
    importFile: async () => {
      await upload.choose(m0333FilePath(file));
      expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([file]);
      const r: SubmitResult = await upload.submit();
      t.sent = r.sent;
      if (!r.sent) note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）`);
      else note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
      const m = await upload.messages();
      t.path = pathOf(page.url());
      t.見出し = ((await upload.見出し.textContent().catch(() => "")) ?? "").trim();
      note(`押したあとの画面上部のメッセージ: 成功「${list(m.成功)}」・警告「${list(m.警告)}」・エラー「${list(m.エラー)}」`);
    },
    readDb: async () => {
      expect(db.available, "DB確認の接続先").toBe(true);
      t.after = 商品規格の状態(classId);
      note(`取込後（DBの参照）: 基準価格 ${t.after?.基準価格}・販売価格 ${t.after?.販売価格}・買取価格 ${t.after?.買取価格}・セール ${t.after?.セール}・帯URL ${t.after?.帯URL ?? "なし"}・スマレジ連携 ${t.after?.スマレジ連携 ?? "なし"}`);
    },
  };
  return t;
}

caseTest("IT-M03-33-001", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "001", "off_on-001.csv");
  await step(1, async () => { await t.open(); });
  await step(2, async () => { await t.importFile(); });
  await step(3, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1200");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("700");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
    expect.soft(t.after!.帯URL, "取込後の帯URL").toBe(`${URL_BASE}/new`);
    expect.soft(t.after!.スマレジ連携, "取込後のスマレジ連携").toBe("1");
    expect.soft(t.after!.基準価格, "取込後の基準価格").toBe("1500");
    expect.soft(t.after!.更新日時, "更新日時が取込時点に変わる").not.toBe(t.before.更新日時);
  });
});

caseTest("IT-M03-33-002", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "002", "on_on-002.csv");
  await step(1, async () => { await t.open(); });
  await step(2, async () => { await t.importFile(); });
  await step(3, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1100");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("650");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
    expect.soft(t.after!.帯URL, "取込後の帯URL").toBe(`${URL_BASE}/on`);
    expect.soft(t.after!.スマレジ連携, "取込後のスマレジ連携").toBe("1");
    expect.soft(t.after!.基準価格, "取込後の基準価格").toBe("1600");
  });
});

caseTest("IT-M03-33-003", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "003", "on_off-003.csv");
  await step(1, async () => { await t.open(); });
  await step(2, async () => { await t.importFile(); });
  await step(3, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1500");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("650");
    expect.soft(t.after!.セール, "取込後のセール").toBe(false);
    expect.soft(t.after!.基準価格, "取込後の基準価格").toBe("1500");
    expect.soft(t.after!.販売価格, "CSVの販売価格900が保存されない").not.toBe("900");
  });
});

caseTest("IT-M03-33-004", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "004", "off_off-004.csv");
  await step(1, async () => { await t.open(); });
  await step(2, async () => { await t.importFile(); });
  await step(3, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1500");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("650");
    expect.soft(t.after!.セール, "取込後のセール").toBe(false);
    expect.soft(t.after!.基準価格, "取込後の基準価格").toBe("1500");
  });
});

caseTest("IT-M03-33-013", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "013", "off_on-013.csv");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    const rows = ファイル名の取込履歴("off_on-013.csv");
    note(`取込履歴（DBの参照。ファイル名 off_on-013.csv）: ${JSON.stringify(rows)}`);
    expect.soft(rows.length, "取込履歴が1件追加される（ファイル名 off_on-013.csv）").toBe(1);
    expect.soft(rows[0]?.ファイル名, "取込履歴のファイル名").toBe("off_on-013.csv");
    expect.soft(rows[0]?.利用者ID, "取込履歴の登録者がM03-33試験管理者").toBe(メンバーID(M0333_ADMIN.loginId));
  });
});

caseTest("IT-M03-33-017", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "017", "off_on-017.csv");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await expected(async () => {
    expect.soft(t.sent, "取込の要求が送られた").toBe(true);
    expect.soft(t.path, "取込のあとの画面").toBe(uploadPath("セール用高額商品価格変更"));
    expect.soft(t.見出し, "取込のあとの画面の見出し").toBe("セール用高額商品価格変更CSVアップロード");
  });
});

caseTest("IT-M03-33-018", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "018", "on_off-018.csv");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await expected(async () => {
    expect.soft(t.sent, "取込の要求が送られた").toBe(true);
    expect.soft(t.path, "取込のあとの画面").toBe(uploadPath("セール用高額商品価格変更"));
    expect.soft(t.見出し, "取込のあとの画面の見出し").toBe("セール用高額商品価格変更CSVアップロード");
  });
});

caseTest("IT-M03-33-022", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "022", "tab_valid-022.tsv", "S-M03-33-FORMAT-PRODUCTS-022");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1200");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("700");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
  });
});

caseTest("IT-M03-33-023", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "023", "comma_valid-023.txt", "S-M03-33-FORMAT-PRODUCTS-023");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1200");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("700");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
  });
});

caseTest("IT-M03-33-025", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "025", "zero_width-025.csv", "S-M03-33-FORMAT-PRODUCTS-025");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("1200");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("700");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
  });
});

caseTest("IT-M03-33-035", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "035", "numeric_max-035.csv", "S-M03-33-VALIDATION-035");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.販売価格, "取込後の販売価格").toBe("999999999");
    expect.soft(t.after!.買取価格, "取込後の買取価格").toBe("999999999");
    expect.soft(t.after!.セール, "取込後のセール").toBe(true);
    expect.soft(t.after!.スマレジ連携, "取込後のスマレジ連携").toBe("1");
  });
});

caseTest("IT-M03-33-037", async (ctx) => {
  const { step, expected } = ctx;
  const t = await prepare(ctx, "037", "belt_128-037.csv", "S-M03-33-FORMAT-PRODUCTS-037");
  await step(1, async () => { await t.open(); await t.importFile(); });
  await step(2, async () => { await t.readDb(); });
  await expected(async () => {
    expect(t.after, "取込後の商品規格").not.toBeNull();
    expect.soft(t.after!.商品コード, "商品規格の商品コード").toBe(t.code);
    expect.soft(t.after!.帯URL, "取込後の帯URL").toBe(`${URL_BASE}/${"a".repeat(87)}`);
  });
});
