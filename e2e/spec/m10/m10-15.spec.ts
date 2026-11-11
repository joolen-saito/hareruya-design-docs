/**
 * M10-15 店舗登録。正本: integration_test/casegen/cases/M10-15_test_cases.tsv
 *
 * 読み替え・解釈（エビデンスの「手順の注記」にも残す）:
 * - 「画面先頭の店舗選択で店舗を選ぶ」: 店舗登録画面に店舗選択の欄は無い。店舗一覧で店舗IDを検索し、店名のリンクを押して開く。
 * - 店舗は M10-15 の試験用店舗を使い回す（seeds/m10-15.ts）。店名には試験用店舗の印（「-M1015P1」など）が付くので、
 *   ケースの店名の値（入れる値・期待する値）にも同じ印を付けて読む。
 * - 「住所=東京都千代田区一丁目」は、都道府県「東京都」と住所（市区町村名）「千代田区一丁目」の欄に分けて入れる。
 * - 新規登録のケースは、店名・支店URL に実行ごとの印、店名略称（3文字）に実行とケースで決まる3文字を使う。
 *   シード表に値の無い必須の項目（郵便番号・番地）は入力チェックを通る値を入れる。
 */
import { Browser, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { RUN_MARK } from "../../lib/run_marker";
import { Account } from "../../lib/session";
import {
  TenantEditPage, 店舗の値, 試験店名, 店舗の印, 店名で探す, 新しいセッション, 問い合わせ画面, 在庫検索一覧を開く, 在庫検索一覧の店舗の選択肢を開く, 集計一覧画面, 項目, ラジオ項目,
} from "../../pages/admin/m10_15_tenant";
import { BranchNavPage } from "../../pages/front/f02_03_nav";
import { BranchTopCheck } from "../../pages/front/m10_15_branch";
import { 画像ファイル, JPEG } from "../../fixtures/m10-15/images";
import { 店舗の保存値, 店名の店舗, 採番, 在庫の様子, メンバーの所属店舗, 都道府県の番号 } from "../../db/m10_15";
import { M1015_ADMIN, M1015_VIEW, M1015_L_ADMIN, M1015_AGG, M1015_QJ_ADMIN, 新規の店名 } from "../../seeds/m10-15";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 印の注記 = () => note(`店舗は M10-15 の試験用店舗を使い回すので、店名の値には試験用店舗の印（「${店舗の印("P1")}」など）を末尾に付けて読む`);
const 選択の注記 = () => note("店舗登録画面に店舗選択の欄は無いので、店舗一覧で店舗IDを検索し、店名のリンクを押してその店舗の店舗登録画面を開いた（＝選んだ）");
const P1 = (店名: string) => 試験店名("P1", 店名);

async function 押す(p: TenantEditPage): Promise<{ sent: boolean }> {
  const r = await p.登録を押す();
  if (!r.sent) note(`ブラウザの入力チェックが送信を止めた: ${r.止めた項目.join(" / ")}`);
  else {
    const errs = await p.エラーの文();
    if (errs.length) note(`登録後の画面のエラー: ${errs.join(" / ")}`);
  }
  return r;
}
async function 入れて注記(p: TenantEditPage, v: 店舗の値): Promise<void> {
  for (const m of await p.入れる全部(v)) note(m);
}
/** DB の値を比べるための形（数値の欄は小数点以下の0を外す・null は空） */
const 数値の項目 = new Set(["送料無料条件（金額）", "送料無料条件（数量）", "高額商品閾値1", "高額商品閾値2", "高額商品閾値3", "ピッキングリスト分割しきい値価格", "スタック用紙高額商品しきい値価格", "スマレジ店舗ID", "表示順", "席数"]);
const 形 = (k: string, s: string | null | undefined): string => {
  if (s === null || s === undefined) return "";
  if (数値の項目.has(k) && /^-?\d+(\.\d+)?$/.test(s)) return String(Number(s));
  return s;
};
const 保存値 = (id: string): Record<string, string | null> => {
  const v = 店舗の保存値(id);
  if (!v) throw new Error(`店舗ID ${id} の店舗が DB に無い`);
  return v;
};

/** 3文字の店名略称（実行の印とケースで決まる。頭の1文字は正本の値の頭） */
function 略称(頭: string, 番号: string): string {
  let h = 0;
  for (const c of `${RUN_MARK}${番号}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return 頭 + L[h % 24] + L[(h >>> 7) % 24];
}

// ---- 新規登録の入力値（S-M10-15-NEW・REQINPUT。店名・支店URL・店名略称は実行ごとに変える） ----
function 新規の値(番号: string): 店舗の値 {
  return {
    会社名: "結合試験商事", "会社名(カナ)": "ケツゴウシケンショウジ", 店名: 新規の店名("結合試験店舗", 番号), "店名(カナ)": "ケツゴウシケンテンポ",
    "店名(英語表記)": "Integration Test Shop", 支店URL: `integrationtest${RUN_MARK.toLowerCase()}${番号}`, 店舗種別: "支店", 公開: "公開", 開店: "開店",
    郵便番号: "1000001", 都道府県: "東京都", 住所: "千代田区一丁目", 番地: "1-1", "住所(英語表記)": "1 Chiyoda Tokyo", "Google map埋め込みURL": "https://maps.example.com/shop",
    電話番号: "0312345678", 店舗営業時間: "10時から20時", "店舗営業時間(英語表記)": "10AM to 8PM",
    送信元メールアドレス: "from@example.com", 返信先メールアドレス: "reply@example.com", 送信エラー通知メールアドレス: "error@example.com", 問い合わせ専用メールアドレス: "contact@example.com",
    高額商品閾値1: "100000", 高額商品閾値2: "200000", 高額商品閾値3: "300000", スマレジ店舗ID: "1234567890", スマレジ店舗コード: "ABC123",
    取り扱い商品説明文: "結合試験取扱商品", 店舗からのメッセージ: "結合試験メッセージ", "店名略称（3文字）": 略称("N", 番号), ショップ名略称: "結合試験支店",
    "ショップ名略称（英語表記）": "IntegrationShop", 表示順: "15", 席数: "20", ピッキングリスト分割しきい値価格: "10000", スタック用紙高額商品しきい値価格: "50000",
    店頭用アカウントIPアドレス: "192.0.2.10,198.51.100.20", "送料無料条件（金額）": "10000", "送料無料条件（数量）": "10", 適格請求書発行事業者登録番号: "T1234567890123",
  };
}
const 任意の項目: 項目[] = ["住所(英語表記)", "Google map埋め込みURL", "店舗営業時間", "店舗営業時間(英語表記)", "高額商品閾値1", "高額商品閾値2", "高額商品閾値3",
  "スマレジ店舗ID", "スマレジ店舗コード", "取り扱い商品説明文", "店舗からのメッセージ", "ショップ名略称（英語表記）", "席数", "ピッキングリスト分割しきい値価格",
  "スタック用紙高額商品しきい値価格", "X公式アカウントURL", "店頭用アカウントIPアドレス", "送料無料条件（金額）", "送料無料条件（数量）", "適格請求書発行事業者登録番号"];
function 必須の値(番号: string): 店舗の値 {
  return {
    会社名: "必須項目会社", "会社名(カナ)": "ヒッスコウモクガイシャ", 店名: 新規の店名("必須項目店舗", 番号), "店名(カナ)": "ヒッスコウモクテンポ",
    "店名(英語表記)": "Required Shop", 支店URL: `requiredshop${RUN_MARK.toLowerCase()}${番号}`, 郵便番号: "1040061", 都道府県: "東京都", 住所: "中央区一丁目", 番地: "1-1",
    電話番号: "0311112222", 送信元メールアドレス: "from@example.com", 返信先メールアドレス: "reply@example.com", 送信エラー通知メールアドレス: "error@example.com",
    問い合わせ専用メールアドレス: "contact@example.com", "店名略称（3文字）": 略称("R", 番号), ショップ名略称: "必須項目支店", 表示順: "16",
    ...Object.fromEntries(任意の項目.map((k) => [k, ""])),
  };
}
const 新規の注記 = (v: 店舗の値) => note(`新規登録の入力値は、店名「${v.店名}」・支店URL「${v.支店URL}」・店名略称（3文字）「${v["店名略称（3文字）"]}」（同じ環境で何度でも流せるよう、実行ごとの値に読み替えた）。郵便番号・番地はシード表に値が無いので入力チェックを通る値を入れた`);

/** 新規登録の手順（1 開く・2 入れる・3 登録）。管理者情報の欄があるかも見る */
async function 新規登録の手順(ctx: CaseCtx, v: 店舗の値): Promise<{ p: TenantEditPage; 管理者情報の欄: number }> {
  const { page, step } = ctx;
  const p = new TenantEditPage(page);
  let 欄 = 0;
  新規の注記(v);
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => {
    await 入れて注記(p, v);
    欄 = await page.locator('[name*="login_id"], [name*="plain_password"]').count();
    if (欄 === 0) note("管理者情報（ログインID・パスワード・パスワード（確認））の入力欄は店舗登録画面に無い");
  });
  await step(3, async () => { await 押す(p); });
  return { p, 管理者情報の欄: 欄 };
}

// ---- 新規登録状態の画面 ----

caseTest("IT-M10-15-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  let 数 = -1; let 欄 = -1;
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => {
    数 = await p.form.getByText("テスト用店舗").count();
    欄 = await page.locator('[name$="[test_store_flg]"], [name*="test_store"]').count();
  });
  await expected(async () => {
    expect.soft(数, "画面の「テスト用店舗」の表示の数").toBe(0);
    expect.soft(欄, "テスト用店舗の入力欄の数").toBe(0);
  });
});

caseTest("IT-M10-15-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const got: Record<string, string> = {};
  await step(1, async () => {
    await p.新規を開く();
    for (const k of ["店舗種別", "公開", "開店"] as ラジオ項目[]) got[k] = await p.選択(k);
  });
  await expected(async () => {
    expect.soft(got["店舗種別"], "店舗種別の選択").toBe("支店");
    expect.soft(got["公開"], "公開の選択").toBe("非公開");
    expect.soft(got["開店"], "開店の選択").toBe("閉店");
  });
});

caseTest("IT-M10-15-077", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  let 選択 = "";
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => { 選択 = await p.選択("売上集計の検索項目"); });
  await expected(async () => { expect.soft(選択, "売上集計の検索項目の選択").toBe("表示しない"); });
});

// ---- 店舗の選択・切替・存在しないID・権限 ----

caseTest("IT-M10-15-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-004〕");
  印の注記(); 選択の注記();
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => { await p.選ぶ(id); });
  await expected(async () => {
    expect.soft(p.店舗ID(), "開いた店舗登録画面の店舗ID").toBe(id);
    expect.soft(await p.値("会社名"), "会社名").toBe("更新前会社");
    expect.soft(await p.値("店名"), "店名").toBe(P1("更新前店舗"));
    expect.soft(await p.値("店名略称（3文字）"), "店名略称（3文字）").toBe("OLD");
    expect.soft(await p.値("表示順"), "表示順").toBe("15004");
  });
});

caseTest("IT-M10-15-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const a = notes.get("〔店舗ID-M1015-005A〕"); const b = notes.get("〔店舗ID-M1015-005B〕");
  選択の注記();
  await step(1, async () => { await p.選ぶ(a); });
  await step(2, async () => { await 入れて注記(p, { 会社名: "保存前入力会社" }); });
  await step(3, async () => {
    page.once("dialog", (d) => { note(`画面を移る前の確認「${d.message()}」に応じた`); void d.accept(); });
    await p.選ぶ(b);
  });
  await expected(async () => {
    expect.soft(p.店舗ID(), "開いた店舗登録画面の店舗ID").toBe(b);
    expect.soft(await p.値("会社名"), "会社名（重複確認会社が表示され、保存前入力会社が表示されない）").toBe("重複確認会社");
    expect.soft(await p.form.locator(`input[value="保存前入力会社"]`).count(), "「保存前入力会社」の入った欄の数").toBe(0);
  });
});

caseTest("IT-M10-15-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-006〕");
  let status = 0;
  選択の注記();
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => {
    const url = page.url().replace(new RegExp(`/mall/tenant/detail/${id}$`), "/mall/tenant/detail/999999");
    if (url === page.url()) throw new Error(`画面のURLに店舗ID ${id} が無い（${page.url()}）`);
    const res = await page.goto(url, { timeout: 60_000 });
    await page.waitForLoadState("load");
    status = res?.status() ?? 0;
    note(`店舗ID 999999 の画面の応答: ${status}`);
  });
  await expected(async () => {
    expect.soft(await p.欄("店名").count(), "店舗ID 999999 の店舗登録画面（店名の欄）の数").toBe(0);
    expect.soft(status, "店舗ID 999999 の画面の応答（正常に表示されない）").not.toBe(200);
  });
});

caseTest("IT-M10-15-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_VIEW);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-007〕");
  await step(1, async () => {
    const res = await page.goto(adminUrl("/mall/tenant/create"), { timeout: 60_000 });
    await page.waitForLoadState("load");
    note(`店舗登録画面（新規）の応答: ${res?.status() ?? "なし"}`);
  });
  await step(2, async () => {
    try {
      await p.選ぶ(id);
      選択の注記();
    } catch (e) {
      note(`店舗一覧から店舗を選べなかった（${String(e).split("\n")[0].slice(0, 120)}）。店舗ID ${id} の店舗登録画面をURLで開いた`);
      note(`店舗ID ${id} の店舗登録画面の応答: ${await p.直接開く(id)}`);
    }
  });
  await expected(async () => {
    await expect.soft(p.欄("店名"), "店舗登録画面（店名の欄）が表示されている").toBeVisible();
    await expect.soft(p.登録ボタン, "登録ボタンが表示されている").toBeVisible();
    await expect.soft(p.登録ボタン, "登録ボタンが押せない状態").toBeDisabled();
  });
});

// ---- 新規登録 ----

caseTest("IT-M10-15-008", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M1015_ADMIN);
  const v = 新規の値("008");
  const { 管理者情報の欄 } = await 新規登録の手順(ctx, v);
  let ids: string[] = []; let got: Record<string, string | null> = {};
  await step(4, async () => {
    ids = 店名の店舗(v.店名!);
    if (ids.length) got = 保存値(ids[0]);
  });
  await expected(async () => {
    expect.soft(ids.length, `店名「${v.店名}」の店舗の数`).toBe(1);
    for (const [k, want] of Object.entries(v)) expect.soft(形(k, got[k]), `保存された${k}`).toBe(形(k, want ?? ""));
    expect.soft(管理者情報の欄, "管理者情報（ログインID・パスワード）の入力欄の数（管理者情報を入れて保存するため）").toBeGreaterThan(0);
  });
});

caseTest("IT-M10-15-012", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M1015_ADMIN);
  const v = 必須の値("012");
  await 新規登録の手順(ctx, v);
  let ids: string[] = []; let got: Record<string, string | null> = {};
  await step(4, async () => { ids = 店名の店舗(v.店名!); if (ids.length) got = 保存値(ids[0]); });
  await expected(async () => {
    expect.soft(ids.length, `店名「${v.店名}」の店舗の数`).toBe(1);
    for (const k of 任意の項目) expect.soft(形(k, got[k]), `任意項目「${k}」は空`).toBe("");
    for (const k of ["会社名", "店名", "店名略称（3文字）", "表示順"]) expect.soft(形(k, got[k]), `保存された${k}`).toBe(形(k, v[k as 項目] ?? ""));
  });
});

caseTest("IT-M10-15-063", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M1015_ADMIN);
  const v = 新規の値("063");
  await 新規登録の手順(ctx, v);
  let ids: string[] = []; let n = { 注文番号: [] as string[], 店頭注文番号: [] as string[] };
  await step(4, async () => { ids = 店名の店舗(v.店名!); if (ids.length) n = 採番(ids[0]); });
  await expected(async () => {
    expect.soft(ids.length, `店名「${v.店名}」の新しい店舗の数`).toBe(1);
    expect.soft(n.注文番号, "新しい店舗の注文番号の採番値").toEqual(["0"]);
    expect.soft(n.店頭注文番号, "新しい店舗の店頭注文番号の採番値").toEqual(["0"]);
  });
});

caseTest("IT-M10-15-064", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M1015_ADMIN);
  const v = 新規の値("064");
  note("基準店舗（TC東京）の在庫は、開発環境に既にある在庫をそのまま使った（SKU-INIT-A・B の値は確かめない）");
  await 新規登録の手順(ctx, v);
  let ids: string[] = []; let 件数 = 0;
  await step(4, async () => { ids = 店名の店舗(v.店名!); if (ids.length) 件数 = 在庫の様子(ids[0]).件数; });
  await expected(async () => {
    expect.soft(ids.length, `店名「${v.店名}」の新しい店舗の数`).toBe(1);
    expect.soft(件数, "新しい店舗に紐づく在庫の件数").toBeGreaterThan(0);
  });
});

caseTest("IT-M10-15-066", async (ctx) => {
  const { page, expected } = ctx;
  await loginAdmin(page, M1015_ADMIN);
  const v = 新規の値("066");
  const { p } = await 新規登録の手順(ctx, v);
  await expected(async () => {
    expect.soft(p.店舗ID(), "移った画面が店舗の店舗登録画面（URL に店舗ID がある）").not.toBeNull();
    await expect.soft(p.欄("店名"), "移った画面の店名").toHaveValue(v.店名!);
    await expect.soft(p.登録ボタン, "移った画面の登録ボタンが押せる").toBeEnabled();
    await expect.soft(p.成功の表示, "保存しましたの表示").toBeVisible();
  });
});

caseTest("IT-M10-15-068", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const v = 必須の値("068");
  新規の注記(v);
  let ids: string[] = []; let 所属: string | null = null; let 欄 = 0;
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => { await 入れて注記(p, v); });
  await step(3, async () => {
    欄 = await page.locator('[name*="login_id"], [name*="plain_password"]').count();
    if (欄 === 0) note("管理者情報のログインID・パスワード・パスワード（確認）の入力欄が店舗登録画面に無いので、「m1015_owner」「Passw0rd!M1015」を入れられなかった");
  });
  await step(4, async () => { await 押す(p); });
  await step(5, async () => {
    ids = 店名の店舗(v.店名!);
    所属 = メンバーの所属店舗("m1015_owner");
    note("店舗のシステム管理者は、ログインID m1015_owner のメンバーの所属店舗が新しい店舗であることで確かめた（店舗の側にシステム管理者の項目は無い）");
  });
  await expected(async () => {
    expect.soft(ids.length, `店名「${v.店名}」の店舗の数`).toBe(1);
    expect.soft(欄, "管理者情報（ログインID・パスワード）の入力欄の数").toBeGreaterThan(0);
    expect.soft(所属, "m1015_owner の所属店舗（新しい店舗のシステム管理者）").toBe(ids[0] ?? "（店舗が無い）");
  });
});

caseTest("IT-M10-15-069", async ({ page, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const v = 必須の値("069");
  新規の注記(v);
  let ids: string[] = [];
  await step(1, async () => { await p.新規を開く(); });
  await step(2, async () => { await 入れて注記(p, v); });
  await step(3, async () => {
    const 欄 = await page.locator('[name*="login_id"], [name*="plain_password"]').count();
    if (欄 === 0) note("管理者情報のログインID・パスワード・パスワード（確認）の入力欄が店舗登録画面に無いので、「missing_m1015」「Passw0rd!Missing」を入れられなかった");
  });
  await step(4, async () => { await 押す(p); });
  await step(5, async () => { ids = 店名の店舗(v.店名!); });
  await expected(async () => { expect.soft(ids, `店名「${v.店名}」の店舗（追加されない）`).toEqual([]); });
});

// ---- 登録済みの店舗の更新（選ぶ・入れる・登録・DBで確かめる） ----

type 更新 = {
  入れる: 店舗の値 | (() => Promise<店舗の値> | 店舗の値);
  /** 更新される値（DB の項目名 → 値）。無ければ「更新前のまま」を確かめる */
  期待?: Record<string, string>;
  /** 更新前のままを確かめる項目 */
  そのまま?: string[];
  注記?: string[];
};
function 更新して確かめる(番号: string, u: 更新) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_ADMIN);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    選択の注記();
    for (const m of u.注記 ?? []) note(m);
    const before = 保存値(id);
    let after: Record<string, string | null> = {};
    await step(1, async () => { await p.選ぶ(id); });
    await step(2, async () => { await 入れて注記(p, typeof u.入れる === "function" ? await u.入れる() : u.入れる); });
    await step(3, async () => { await 押す(p); });
    await step(4, async () => { after = 保存値(id); });
    await expected(async () => {
      for (const [k, want] of Object.entries(u.期待 ?? {})) expect.soft(形(k, after[k]), `${k}（更新後の値）`).toBe(形(k, want));
      for (const k of u.そのまま ?? []) expect.soft(形(k, after[k]), `${k}（更新前の値「${形(k, before[k]).slice(0, 30)}」のまま）`).toBe(形(k, before[k]));
    });
  };
}
const 四つのメール = ["送信元メールアドレス", "返信先メールアドレス", "送信エラー通知メールアドレス", "問い合わせ専用メールアドレス"];

caseTest("IT-M10-15-009", 更新して確かめる("009", {
  入れる: { 会社名: "更新後会社", 店名: P1("更新後店舗"), 店舗種別: "本店", 公開: "公開", 表示順: "25" },
  期待: { 会社名: "更新後会社", 店名: P1("更新後店舗"), 店舗種別: "本店", 公開: "公開", 表示順: "25" }, 注記: [`店名には試験用店舗の印「${店舗の印("P1")}」を付けた`],
}));
caseTest("IT-M10-15-010", 更新して確かめる("010", {
  入れる: Object.fromEntries(["会社名", "会社名(カナ)", "店名", "店名(カナ)", "店名(英語表記)", "支店URL", "住所", "電話番号", ...四つのメール, "店名略称（3文字）", "ショップ名略称", "表示順"].map((k) => [k, ""])),
  そのまま: ["会社名", "会社名(カナ)", "店名", "店名(カナ)", "店名(英語表記)", "支店URL", "住所", "電話番号", ...四つのメール, "店名略称（3文字）", "ショップ名略称", "表示順", "最終更新日時"],
  注記: ["住所は市区町村名の欄（住所1）を空にした", "管理者情報のログインID・パスワード・パスワード（確認）の入力欄は店舗登録画面に無いので空にできない"],
}));
caseTest("IT-M10-15-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-011〕");
  選択の注記();
  let r = { sent: false };
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => { await 入れて注記(p, { 会社名: "", 店名: "", 表示順: "" }); });
  await step(3, async () => { r = await 押す(p); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.endsWith(`/mall/tenant/detail/${id}`), `店舗ID ${id} の店舗登録画面に留まっている（${new URL(page.url()).pathname}）`).toBe(true);
    await expect.soft(p.成功の表示, "保存しましたの表示（出ない）").toHaveCount(0);
    await expect.soft(p.欄("店名"), "店舗登録画面の店名の欄").toBeVisible();
    if (!r.sent) note("登録は送られず、画面はそのまま（ブラウザの入力チェック）");
  });
});
caseTest("IT-M10-15-013", 更新して確かめる("013", { 入れる: { 店舗種別: "本店" }, 期待: { 店舗種別: "本店" } }));
caseTest("IT-M10-15-014", 更新して確かめる("014", { 入れる: { 公開: "公開" }, 期待: { 公開: "公開" } }));
caseTest("IT-M10-15-015", 更新して確かめる("015", { 入れる: { 開店: "閉店" }, 期待: { 開店: "閉店" }, そのまま: ["店名", "会社名"] }));
caseTest("IT-M10-15-016", 更新して確かめる("016", { 入れる: { 開店: "開店" }, 期待: { 開店: "開店" } }));

const 九 = (n: number) => {
  const tag = 店舗の印("P1");
  return {
    会社名: "あ".repeat(n), "会社名(カナ)": "ア".repeat(n), 店名: "あ".repeat(n - tag.length) + tag, "店名(カナ)": "ア".repeat(n), "店名(英語表記)": "A".repeat(n),
    支店URL: "a".repeat(n), "Google map埋め込みURL": "https://maps.example.com/" + "a".repeat(n - 25), 店舗営業時間: "あ".repeat(n), "店舗営業時間(英語表記)": "A".repeat(n),
  };
};
const 九の注記 = (n: number) => [`各書式で許容される ${n} 文字は、会社名・店舗営業時間は「あ」、カナは「ア」、英語表記は「A」、支店URLは「a」、Google map埋め込みURLは「https://maps.example.com/」に「a」を続けた値、店名は「あ」に試験用店舗の印を続けた値にした`];
caseTest("IT-M10-15-023", 更新して確かめる("023", { 入れる: 九(255), 期待: 九(255), 注記: 九の注記(255) }));
caseTest("IT-M10-15-024", 更新して確かめる("024", { 入れる: 九(256), そのまま: Object.keys(九(256)), 注記: 九の注記(256) }));
const 三十二 = (n: number) => ({ 住所: "あ".repeat(n), ショップ名略称: "あ".repeat(n), "ショップ名略称（英語表記）": "A".repeat(n) });
caseTest("IT-M10-15-025", 更新して確かめる("025", { 入れる: 三十二(32), 期待: 三十二(32), 注記: ["住所は市区町村名の欄（住所1）に入れた"] }));
caseTest("IT-M10-15-026", 更新して確かめる("026", { 入れる: 三十二(33), そのまま: Object.keys(三十二(33)), 注記: ["住所は市区町村名の欄（住所1）に入れた"] }));
caseTest("IT-M10-15-027", 更新して確かめる("027", { 入れる: { "住所(英語表記)": "A".repeat(512) }, 期待: { "住所(英語表記)": "A".repeat(512) } }));
caseTest("IT-M10-15-029", 更新して確かめる("029", { 入れる: { 電話番号: "1".repeat(14) }, 期待: { 電話番号: "1".repeat(14) } }));
const メール = (n: number) => Object.fromEntries(四つのメール.map((k) => [k, "a".repeat(n) + "@example.com"]));
caseTest("IT-M10-15-031", 更新して確かめる("031", { 入れる: メール(80), 期待: メール(80) }));
caseTest("IT-M10-15-032", 更新して確かめる("032", { 入れる: メール(81), そのまま: 四つのメール }));
caseTest("IT-M10-15-033", 更新して確かめる("033", { 入れる: { スマレジ店舗ID: "1".repeat(10), スマレジ店舗コード: "A".repeat(10) }, 期待: { スマレジ店舗ID: "1".repeat(10), スマレジ店舗コード: "A".repeat(10) } }));
caseTest("IT-M10-15-034", 更新して確かめる("034", { 入れる: { スマレジ店舗ID: "1".repeat(11), スマレジ店舗コード: "A".repeat(11) }, そのまま: ["スマレジ店舗ID", "スマレジ店舗コード"] }));
const 五つの金額 = ["高額商品閾値1", "高額商品閾値2", "高額商品閾値3", "ピッキングリスト分割しきい値価格", "スタック用紙高額商品しきい値価格"];
const 金額 = (s: string) => Object.fromEntries(五つの金額.map((k) => [k, s]));
caseTest("IT-M10-15-035", 更新して確かめる("035", { 入れる: 金額("2147483647"), 期待: 金額("2147483647") }));
caseTest("IT-M10-15-036", 更新して確かめる("036", { 入れる: 金額("2147483648"), そのまま: 五つの金額 }));
const 説明 = (n: number) => ({ 取り扱い商品説明文: "あ".repeat(n), 店舗からのメッセージ: "あ".repeat(n) });
caseTest("IT-M10-15-037", 更新して確かめる("037", { 入れる: 説明(4000), 期待: 説明(4000) }));
caseTest("IT-M10-15-038", 更新して確かめる("038", { 入れる: 説明(4001), そのまま: Object.keys(説明(4001)) }));
caseTest("IT-M10-15-039", 更新して確かめる("039", { 入れる: { "店名略称（3文字）": "新店A" }, 期待: { "店名略称（3文字）": "新店A" } }));
caseTest("IT-M10-15-041", 更新して確かめる("041", { 入れる: { 表示順: "99999" }, 期待: { 表示順: "99999" } }));
caseTest("IT-M10-15-043", 更新して確かめる("043", { 入れる: { 店頭用アカウントIPアドレス: "192.0.2.1,".repeat(30) }, 期待: { 店頭用アカウントIPアドレス: "192.0.2.1,".repeat(30) } }));
caseTest("IT-M10-15-045", 更新して確かめる("045", {
  入れる: { "会社名(カナ)": "けつごうしけんがいしゃ", "店名(カナ)": "けつごうしけんてんぽ" },
  期待: { "会社名(カナ)": "ケツゴウシケンガイシャ", "店名(カナ)": "ケツゴウシケンテンポ" },
}));
const 英の五つ = ["店名(英語表記)", "支店URL", "住所(英語表記)", "スマレジ店舗コード", "ショップ名略称（英語表記）"];
caseTest("IT-M10-15-046", 更新して確かめる("046", { 入れる: Object.fromEntries(英の五つ.map((k) => [k, "ＡＢＣ"])), そのまま: 英の五つ }));
caseTest("IT-M10-15-047", 更新して確かめる("047", {
  入れる: { 電話番号: "abc", スマレジ店舗ID: "abc", 表示順: "abc", ...金額("1.5") },
  そのまま: ["電話番号", "スマレジ店舗ID", "表示順", ...五つの金額],
}));
caseTest("IT-M10-15-048", 更新して確かめる("048", { 入れる: Object.fromEntries(四つのメール.map((k) => [k, "invalid-address"])), そのまま: 四つのメール }));
caseTest("IT-M10-15-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const a = notes.get("〔店舗ID-M1015-050A〕");
  notes.get("〔店舗ID-M1015-050B〕");
  選択の注記(); 印の注記();
  let after: Record<string, string | null> = {};
  await step(1, async () => { await p.選ぶ(a); });
  await step(2, async () => { await 入れて注記(p, { 店名: P1("重複入力店舗"), "店名略称（3文字）": "ABC" }); });
  await step(3, async () => { await 押す(p); });
  await step(4, async () => { after = 保存値(a); });
  await expected(async () => {
    expect.soft(after["店名"], "店名（更新前店舗のまま）").toBe(P1("更新前店舗"));
    expect.soft(after["店名略称（3文字）"], "店名略称（3文字）（OLD のまま）").toBe("OLD");
  });
});
caseTest("IT-M10-15-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const a = notes.get("〔店舗ID-M1015-051A〕");
  notes.get("〔店舗ID-M1015-051B〕");
  選択の注記();
  let sent = false;
  await step(1, async () => { await p.選ぶ(a); });
  await step(2, async () => { await 入れて注記(p, { "店名略称（3文字）": "ABC" }); });
  await step(3, async () => { sent = (await 押す(p)).sent; });
  await expected(async () => {
    expect.soft(sent, "登録の送信が送られた").toBe(true);
    expect.soft(new URL(page.url()).pathname.endsWith(`/mall/tenant/detail/${a}`), `店舗ID ${a} の店舗登録画面に留まっている（${new URL(page.url()).pathname}）`).toBe(true);
    await expect.soft(p.成功の表示, "保存しましたの表示（出ない）").toHaveCount(0);
    await expect.soft(p.欄("店名略称（3文字）"), "店名略称（3文字）の欄（入れた値が残る画面）").toBeVisible();
  });
});
caseTest("IT-M10-15-052", 更新して確かめる("052", {
  入れる: { "店名略称（3文字）": "OLD", 店名: P1("自己略称更新店舗") }, 期待: { 店名: P1("自己略称更新店舗"), "店名略称（3文字）": "OLD" },
  注記: [`店名には試験用店舗の印「${店舗の印("P1")}」を付けた`],
}));

// ---- ショップアイコン ----
type アイコンの型 = "JPEG" | "GIF" | "PNGへ差し替え" | "PNGを新しく" | "選ばずに維持" | "選ばずに未設定のまま";
function アイコン(番号: string, 型: アイコンの型) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_ADMIN);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    選択の注記();
    const before = 保存値(id)["ショップアイコン"] ?? "";
    let after = "";
    await step(1, async () => { await p.選ぶ(id); });
    await step(2, async () => {
      if (型 === "選ばずに維持" || 型 === "選ばずに未設定のまま") {
        await 入れて注記(p, { 会社名: 型 === "選ばずに維持" ? "画像維持会社" : "画像未設定維持会社" });
        return;
      }
      const f = 型 === "JPEG" ? await JPEG(page, "shop-icon.jpg", 1_000_000) : 型 === "GIF" ? 画像ファイル["shop-icon.gif"]() : 画像ファイル["shop-icon.png"]();
      note(`「${f.name}」（${f.mimeType}・${f.buffer.length} バイト）を選んだ。アプリは保存するファイル名を付け直すので、DB では拡張子と、更新前の画像から変わったことで確かめる`);
      await p.画像を選ぶ("アイコン", f);
    });
    await step(3, async () => { await 押す(p); });
    await step(4, async () => { after = 保存値(id)["ショップアイコン"] ?? ""; note(`ショップアイコンの保存値: 更新前「${before}」→ 更新後「${after}」`); });
    await expected(async () => {
      const 拡張子 = after.toLowerCase().replace(/^.*\./, "");
      if (型 === "JPEG" || 型 === "GIF" || 型 === "PNGへ差し替え") expect.soft(after, "ショップアイコンが更新前の画像から変わった").not.toBe(before);
      if (型 === "PNGへ差し替え" || 型 === "選ばずに維持") expect.soft(before, "更新前のショップアイコン（old-icon.png を選んだ画像）が設定されていた").not.toBe("");
      if (型 === "PNGを新しく" || 型 === "選ばずに未設定のまま") expect.soft(before, "更新前のショップアイコンは未設定").toBe("");
      if (型 === "JPEG") expect.soft(["jpg", "jpeg"].includes(拡張子), `ショップアイコンが JPEG 画像（${after}）`).toBe(true);
      if (型 === "GIF") expect.soft(拡張子, `ショップアイコンが GIF 画像（${after}）`).toBe("gif");
      if (型 === "PNGへ差し替え" || 型 === "PNGを新しく") expect.soft(拡張子, `ショップアイコンが PNG 画像（${after}）`).toBe("png");
      if (型 === "選ばずに維持") expect.soft(after, "ショップアイコン（更新前の画像のまま）").toBe(before);
      if (型 === "選ばずに未設定のまま") expect.soft(after, "ショップアイコン（未設定のまま）").toBe("");
    });
  };
}
caseTest("IT-M10-15-053", アイコン("053", "JPEG"));
caseTest("IT-M10-15-054", アイコン("054", "GIF"));
caseTest("IT-M10-15-058", アイコン("058", "PNGへ差し替え"));
caseTest("IT-M10-15-059", アイコン("059", "選ばずに維持"));
caseTest("IT-M10-15-095", アイコン("095", "PNGを新しく"));
caseTest("IT-M10-15-098", アイコン("098", "選ばずに未設定のまま"));

// ---- 在庫・採番・遷移・都道府県 ----

caseTest("IT-M10-15-065", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-065〕");
  選択の注記();
  const before = 在庫の様子(id);
  note(`店舗の在庫を SKU-A=7・SKU-B=3 の2件だけにする前提は DB で入れるものなので、登録の前に DB で読んだこの店舗の在庫（${before.件数} 件・数量の合計 ${before.合計}）が作り直されずに残ることに読み替えた`);
  let after = before;
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => { await 入れて注記(p, { 会社名: "在庫維持更新会社" }); });
  await step(3, async () => { await 押す(p); });
  await step(4, async () => { after = 在庫の様子(id); });
  await expected(async () => {
    expect.soft(after.件数, "在庫の件数（登録の前と同じ）").toBe(before.件数);
    expect.soft(after.合計, "在庫の数量の合計（登録の前と同じ）").toBe(before.合計);
    expect.soft(after.指紋, "在庫の行（番号・数量・作成日時。作り直されていない）").toBe(before.指紋);
  });
});

caseTest("IT-M10-15-096", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-096〕");
  選択の注記(); 印の注記();
  const before = 採番(id);
  note(`採番値を 5・3 にする前提は DB で入れるものなので、登録の前に DB で読んだ採番値（注文番号 ${JSON.stringify(before.注文番号)}・店頭注文番号 ${JSON.stringify(before.店頭注文番号)}）のままで新たに作られないことに読み替えた`);
  let after = before;
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => { await 入れて注記(p, { 会社名: "更新後会社M1015-096-A" }); });
  await step(3, async () => { await 押す(p); });
  await step(4, async () => { after = 採番(id); });
  await expected(async () => {
    expect.soft(after.注文番号, "注文番号の採番値（登録の前のまま・新たに作られない）").toEqual(before.注文番号);
    expect.soft(after.店頭注文番号, "店頭注文番号の採番値（登録の前のまま・新たに作られない）").toEqual(before.店頭注文番号);
  });
});

caseTest("IT-M10-15-067", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-067〕");
  選択の注記(); 印の注記();
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => { await 入れて注記(p, { 会社名: "遷移確認更新会社" }); });
  await step(3, async () => { await 押す(p); });
  await expected(async () => {
    expect.soft(p.店舗ID(), "移った店舗登録画面の店舗ID").toBe(id);
    await expect.soft(p.欄("店名"), "移った画面の店名（更新前店舗）").toHaveValue(P1("更新前店舗"));
  });
});

caseTest("IT-M10-15-070", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1015_ADMIN);
  const p = new TenantEditPage(page);
  const id = notes.get("〔店舗ID-M1015-070〕");
  選択の注記();
  let got: string | null = null; let 東京都: string | null = null;
  await step(1, async () => { await p.選ぶ(id); });
  await step(2, async () => { await 入れて注記(p, { 都道府県: "東京都", 住所: "千代田区一丁目" }); });
  await step(3, async () => { await 押す(p); });
  await step(4, async () => { got = 保存値(id)["都道府県の番号"]; 東京都 = 都道府県の番号("東京都"); });
  await expected(async () => {
    expect.soft(東京都, "都道府県の東京都の番号").not.toBeNull();
    expect.soft(got, "保存された都道府県の番号（東京都）").toBe(東京都);
  });
});

// ---- 選び直して画面で確かめる（ショップカラー・売上集計の検索項目・席数） ----

type 選び直しの項目 = "ショップカラー" | "売上集計の検索項目" | "席数";
function 選び直す(番号: string, 項: 選び直しの項目, 値: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_ADMIN);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    選択の注記();
    await step(1, async () => { await p.選ぶ(id); });
    await step(2, async () => {
      await 入れて注記(p, { [項]: 値 });
      await 押す(p);
    });
    await step(3, async () => { await p.選ぶ(id); });
    await expected(async () => {
      if (項 === "売上集計の検索項目") { expect.soft(await p.選択(項), `${項}の選択`).toBe(値); return; }
      expect.soft(await p.欄(項).count(), `${項}の入力欄の数`).toBe(1);
      if (await p.欄がある(項)) expect.soft(await p.値(項), 項).toBe(値);
    });
  };
}
caseTest("IT-M10-15-020", 選び直す("020", "ショップカラー", "#1A2B3C"));
caseTest("IT-M10-15-078", 選び直す("078", "売上集計の検索項目", "表示する"));
caseTest("IT-M10-15-081", 選び直す("081", "席数", "24"));

caseTest("IT-M10-15-082", 更新して確かめる("082", {
  入れる: { X公式アカウントURL: "https://x.example.com/" + "a".repeat(233) },
  期待: { X公式アカウントURL: "https://x.example.com/" + "a".repeat(233) },
}));

// ---- 連携: お問い合わせの店舗選択・在庫検索一覧の店舗の選択肢 ----

const 件名 = "店舗でのお買い物・イベントに関するお問い合わせ";
function 問い合わせ(番号: string, 正本の店名: string, 入れる: 店舗の値, 表示: boolean) {
  return async ({ page, browser, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_L_ADMIN);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    const 店名 = P1(正本の店名);
    選択の注記(); 印の注記();
    let 選択肢: { 値: string; 表示: string }[] = [];
    const ctx = await 新しいセッション(browser, { width: 1280, height: 900 });
    try {
      const front = new 問い合わせ画面(await ctx.newPage());
      await step(1, async () => { await p.選ぶ(id); });
      await step(2, async () => {
        await 入れて注記(p, 入れる);
        await 押す(p);
        await expect(p.成功の表示, "「保存しました」の表示").toBeVisible();
      });
      await step(3, async () => { await front.開く(); });
      await step(4, async () => { await front.件名を選ぶ(件名); });
      await step(5, async () => { await front.詳細を選ぶ("店舗でのお買い物について"); });
      await step(6, async () => { await front.店舗の選択肢を開く(); 選択肢 = await front.店舗の選択肢(); });
      await expected(async () => {
        expect.soft(選択肢.length, "お問い合わせ店舗選択の選択肢が読めた（1件以上）").toBeGreaterThan(0);
        const 名前 = 選択肢.map((o) => o.表示);
        if (表示) expect.soft(名前, `お問い合わせ店舗選択の選択肢に「${店名}」がある`).toContain(店名);
        else expect.soft(名前, `お問い合わせ店舗選択の選択肢に「${店名}」が無い`).not.toContain(店名);
        // 選択肢の表示名が店名でない作りでも取り違えないよう、店舗IDの選択肢の有無も見る
        const ids = 選択肢.map((o) => o.値);
        if (表示) expect.soft(ids, `お問い合わせ店舗選択に店舗ID ${id} の選択肢がある`).toContain(id);
        else expect.soft(ids, `お問い合わせ店舗選択に店舗ID ${id} の選択肢が無い`).not.toContain(id);
      });
    } finally { await ctx.close(); }
  };
}
caseTest("IT-M10-15-072", 問い合わせ("072", "連携店L001M1015n072", { 公開: "公開" }, true));
caseTest("IT-M10-15-073", 問い合わせ("073", "連携店L002M1015n073", { 開店: "閉店" }, false));
caseTest("IT-M10-15-074", 問い合わせ("074", "連携店L003M1015n074", { 公開: "非公開" }, false));

function 在庫検索(番号: string, 正本の店名: string, 入れる: 店舗の値, 表示: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_L_ADMIN);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    const 店名 = P1(正本の店名);
    選択の注記(); 印の注記();
    let 選択肢: { 値: string; 表示: string }[] = [];
    await step(1, async () => { await p.選ぶ(id); });
    await step(2, async () => {
      await 入れて注記(p, 入れる);
      await 押す(p);
      await expect(p.成功の表示, "「保存しました」の表示").toBeVisible();
    });
    await step(3, async () => { await 在庫検索一覧を開く(page); });
    await step(4, async () => { 選択肢 = await 在庫検索一覧の店舗の選択肢を開く(page); });
    await expected(async () => {
      expect.soft(選択肢.length, "在庫検索一覧の店舗の選択肢が読めた（1件以上）").toBeGreaterThan(0);
      const 名前 = 選択肢.map((o) => o.表示);
      if (表示) expect.soft(名前, `在庫検索一覧の店舗の選択肢に「${店名}」がある`).toContain(店名);
      else expect.soft(名前, `在庫検索一覧の店舗の選択肢に「${店名}」が無い`).not.toContain(店名);
      const ids = 選択肢.map((o) => o.値);
      if (表示) expect.soft(ids, `店舗ID ${id} の選択肢がある`).toContain(id);
      else expect.soft(ids, `店舗ID ${id} の選択肢が無い`).not.toContain(id);
    });
  };
}
caseTest("IT-M10-15-075", 在庫検索("075", "連携店L004M1015n075", { 開店: "開店" }, true));
caseTest("IT-M10-15-076", 在庫検索("076", "連携店L005", { 開店: "閉店" }, false));

// ---- 連携: 日別・月別集計の集計対象(各店舗) ----

function 集計対象(番号: string, 正本の店名: string, 入れる: 店舗の値, 表示: boolean, 月別: boolean) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M1015_AGG);
    const p = new TenantEditPage(page);
    const id = notes.get(`〔店舗ID-M1015-${番号}〕`);
    const 店名 = P1(正本の店名);
    選択の注記(); 印の注記();
    const s = new 集計一覧画面(page);
    let 対象: { 値: string; 表示: string }[] = [];
    const 開く = async () => {
      await s.日別を開く();
      if (月別) note(`集計タイプの「${await s.月別を選ぶ()}」を選んだ（正本の「月別」）`);
      await s.検索枠を開く();
    };
    await step(1, async () => { await p.選ぶ(id); });
    if (Object.keys(入れる).length > 1) {
      // 097: 開店で「閉店」を選ぶ（手順2）と、登録ボタンを押す（手順3）が分かれている
      await step(2, async () => { await 入れて注記(p, 入れる); });
      await step(3, async () => { await 押す(p); await expect(p.成功の表示, "「保存しました」の表示").toBeVisible(); });
      await step(4, async () => { await 開く(); });
      await step(5, async () => { 対象 = await s.集計対象の店舗(); });
    } else {
      await step(2, async () => { await 入れて注記(p, 入れる); await 押す(p); await expect(p.成功の表示, "「保存しました」の表示").toBeVisible(); });
      await step(3, async () => { await 開く(); });
      await step(4, async () => { 対象 = await s.集計対象の店舗(); });
    }
    await expected(async () => {
      expect.soft(対象.length, "集計対象(各店舗)のチェック欄が読めた（1件以上）").toBeGreaterThan(0);
      const 名前 = 対象.map((o) => o.表示);
      if (表示) expect.soft(名前, `集計対象(各店舗)に「${店名}」がある`).toContain(店名);
      else expect.soft(名前, `集計対象(各店舗)に「${店名}」が無い`).not.toContain(店名);
      const ids = 対象.map((o) => o.値);
      if (表示) expect.soft(ids, `集計対象(各店舗)に店舗ID ${id} のチェック欄がある`).toContain(id);
      else expect.soft(ids, `集計対象(各店舗)に店舗ID ${id} のチェック欄が無い`).not.toContain(id);
    });
  };
}
caseTest("IT-M10-15-079", 集計対象("079", "集計反映店舗M1015-079-A", { 売上集計の検索項目: "表示する" }, true, false));
caseTest("IT-M10-15-080", 集計対象("080", "集計非表示店舗M1015-080-A", { 売上集計の検索項目: "表示しない" }, false, false));
caseTest("IT-M10-15-089", 集計対象("089", "月別集計反映店舗M1015-089-A", { 売上集計の検索項目: "表示する" }, true, true));
caseTest("IT-M10-15-090", 集計対象("090", "月別集計非表示店舗M1015-090-A", { 売上集計の検索項目: "表示しない" }, false, true));
caseTest("IT-M10-15-097", 集計対象("097", "閉店集計店舗M1015-097-A", { 開店: "閉店", 売上集計の検索項目: "表示する" }, false, false));

// ---- 連携: 支店サイト（QJ。ブラウザA＝フロント、ブラウザB＝管理画面） ----

async function QJの店舗を選ぶ(page: Page, 正本の店名: string): Promise<TenantEditPage> {
  const 店名 = P1(正本の店名);
  const found = (await 店名で探す(page, 店名)).filter((f) => f.店名 === 店名);
  if (found.length !== 1) throw new Error(`店名「${店名}」の店舗が ${found.length} 件`);
  const p = new TenantEditPage(page);
  await p.選ぶ(found[0].店舗ID);
  return p;
}
async function 管理画面を開く(page: Page, account: Account): Promise<void> {
  await loginAdmin(page, account);
  await new TenantEditPage(page).新規を開く();
}
async function フロント(browser: Browser, viewport: { width: number; height: number }) {
  const ctx = await 新しいセッション(browser, viewport);
  return { ctx, nav: new BranchNavPage(await ctx.newPage()) };
}
const テキスト = async (nav: BranchNavPage, l: ReturnType<BranchNavPage["店舗情報の電話"]>): Promise<string> => ((await l.count()) ? nav.テキスト(l) : "（表示なし）");

function QJ店舗情報(n: "1" | "2", viewport: { width: number; height: number }, 前: { 電話: string; 時間: string }, 後: { 電話: string; 時間: string }, 画像: boolean) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const url = `qjbr00${n}`;
    const 店名 = `M1015QJ00${n}連携支店`;
    印の注記(); 選択の注記();
    const { ctx, nav } = await フロント(browser, viewport);
    try {
      const before = 画像ファイル["qj001-before.png"]().buffer; const afterImg = 画像ファイル["qj001-after.png"]();
      let 後の電話 = ""; let 後の時間 = ""; let 後の画像: Buffer | null = null;
      await step(1, async () => { note(`支店ECTOPの応答: ${await nav.支店トップを開く(url)}`); });
      await step(2, async () => {
        expect.soft(await テキスト(nav, nav.店舗情報の電話()), "手順2: 店舗情報の電話番号").toContain(前.電話);
        expect.soft(await テキスト(nav, nav.店舗情報の営業時間()), "手順2: 店舗情報の営業時間").toContain(前.時間);
        if (画像) expect.soft((await nav.ご当地晴れる屋くんのバイト列())?.equals(before) ?? false, "手順2: ご当地晴れる屋くんが赤一色の画像（qj001-before.png）").toBe(true);
      });
      let p: TenantEditPage | null = null;
      await step(3, async () => { await 管理画面を開く(page, M1015_QJ_ADMIN); });
      await step(4, async () => { p = await QJの店舗を選ぶ(page, 店名); });
      await step(5, async () => {
        await 入れて注記(p!, { 電話番号: 後.電話, 店舗営業時間: 後.時間 });
        if (画像) await p!.画像を選ぶ("晴れる屋くん", afterImg);
        await 押す(p!);
        await expect(p!.成功の表示, "「保存しました」の表示").toBeVisible();
      });
      await step(6, async () => {
        await nav.支店トップを開く(url);
        後の電話 = await テキスト(nav, nav.店舗情報の電話());
        後の時間 = await テキスト(nav, nav.店舗情報の営業時間());
        if (画像) 後の画像 = await nav.ご当地晴れる屋くんのバイト列();
      });
      await expected(async () => {
        expect.soft(後の電話, "店舗情報の電話番号（更新後）").toContain(後.電話);
        expect.soft(後の電話, "店舗情報の電話番号（手順2の値は出ない）").not.toContain(前.電話);
        expect.soft(後の時間, "店舗情報の営業時間（更新後）").toContain(後.時間);
        expect.soft(後の時間, "店舗情報の営業時間（手順2の値は出ない）").not.toContain(前.時間);
        if (画像) {
          expect.soft(後の画像?.equals(afterImg.buffer) ?? false, "ご当地晴れる屋くんが青一色の画像（qj001-after.png）").toBe(true);
          expect.soft(後の画像?.equals(before) ?? false, "ご当地晴れる屋くんが赤一色の画像でない").toBe(false);
        }
      });
    } finally { await ctx.close(); }
  };
}
caseTest("IT-M10-15-091", QJ店舗情報("1", { width: 1280, height: 900 }, { 電話: "0312345601", 時間: "10:00-20:00" }, { 電話: "0398765401", 時間: "11:00-21:00" }, true));
caseTest("IT-M10-15-092", QJ店舗情報("2", { width: 390, height: 844 }, { 電話: "0312345602", 時間: "9:00-19:00" }, { 電話: "0398765402", 時間: "12:00-22:00" }, false));

caseTest("IT-M10-15-093", async ({ page, browser, step, expected }) => {
  印の注記(); 選択の注記();
  const { ctx, nav } = await フロント(browser, { width: 1280, height: 900 });
  try {
    const top = new BranchTopCheck(nav.page);
    let 後 = { status: 0, 表示: true };
    await step(1, async () => {
      const st = await nav.支店トップを開く("qjbr003");
      expect.soft(st, "手順1: 支店ECTOPの応答").toBe(200);
      expect.soft(await top.支店ECTOPか(), "手順1: 支店ECTOPが表示された").toBe(true);
    });
    await step(2, async () => { await 管理画面を開く(page, M1015_QJ_ADMIN); });
    let p: TenantEditPage | null = null;
    await step(3, async () => { p = await QJの店舗を選ぶ(page, "M1015QJ003連携支店"); });
    await step(4, async () => {
      await 入れて注記(p!, { 公開: "非公開" });
      await 押す(p!);
      await expect(p!.成功の表示, "「保存しました」の表示").toBeVisible();
    });
    await step(5, async () => { 後 = { status: await nav.支店トップを開く("qjbr003"), 表示: await top.支店ECTOPか() }; note(`開き直した支店ECTOPの応答: ${後.status}`); });
    await expected(async () => { expect.soft(後.表示, "支店URL「qjbr003」の支店ECTOPが表示されない").toBe(false); });
  } finally { await ctx.close(); }
});

caseTest("IT-M10-15-094", async ({ page, browser, step, expected }) => {
  印の注記(); 選択の注記();
  const { ctx, nav } = await フロント(browser, { width: 1280, height: 900 });
  try {
    const top = new BranchTopCheck(nav.page);
    let 後 = "";
    await step(1, async () => { note(`支店ECTOPの応答: ${await nav.支店トップを開く("qjbr004")}`); });
    await step(2, async () => { expect.soft(await top.XのQRコードを読む(), "手順2: 読み取ったX公式アカウントのURL").toBe("https://x.com/hareruyaqj004a"); });
    await step(3, async () => { await 管理画面を開く(page, M1015_QJ_ADMIN); });
    let p: TenantEditPage | null = null;
    await step(4, async () => { p = await QJの店舗を選ぶ(page, "M1015QJ004連携支店"); });
    await step(5, async () => {
      await 入れて注記(p!, { X公式アカウントURL: "https://x.com/hareruyaqj004b" });
      await 押す(p!);
      await expect(p!.成功の表示, "「保存しました」の表示").toBeVisible();
    });
    await step(6, async () => { await nav.支店トップを開く("qjbr004"); 後 = await top.XのQRコードを読む(); });
    await expected(async () => {
      expect.soft(後, "読み取ったX公式アカウントのURL（更新後）").toBe("https://x.com/hareruyaqj004b");
      expect.soft(後, "読み取ったURLが手順2の値でない").not.toBe("https://x.com/hareruyaqj004a");
    });
  } finally { await ctx.close(); }
});
