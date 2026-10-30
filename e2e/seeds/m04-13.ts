/**
 * M04-13 在庫分割結合登録編集の画面シード。正本: cases/M04-13_seed_data.tsv
 *
 * 作り方の型（正本の投入方法の共通部分）:
 * 1. グッズ商品CSV登録で商品を登録する（商品IDは空。そのほかの必須列は M03-01 のグッズ商品CSVの共通の値）。
 *    正本の投入方法は、商品カテゴリを含む「そのほかの必須列」を「任意の有効な値」としか書いていない。商品カテゴリに「サプライ・グッズ」
 *    （カテゴリ登録/編集画面の最上位の一覧で読んだID）を選んだのはE2E側の決めで、根拠は設計書 M03-27（グッズ商品CSV登録）の
 *    「サプライ・グッズ・予約グッズ・情報商材のカテゴリだけを選べる」。空から作ったDBでは、この値をアプリの取込が受け付けない（記録の「範囲と集計」）。
 *    正本が商品コードを決めている商品は、登録の前に商品マスターで同じ商品コードの商品が無いことを確かめる（正本に清掃の手順が無いので、
 *    残っていれば作らずに止める。流し直しは依頼者の判断）。「他のデータと重ならない任意の値」の商品コードは、実行のたびに新しく作る。
 * 2. M04-13作業者で、在庫検索一覧（店舗=試験店舗A（M04-13）・在庫区分・商品コード）から在庫編集を開き、入庫/その他・試験データ準備・在庫増減数・仕入単価・
 *    承認通知先（M04-13承認者）で登録する。M04-13承認者（登録者とは別の、試験店舗A（M04-13）を承認できるメンバー）が在庫編集承認一覧で承認する。
 * 3. M04-13作業者で、在庫検索一覧から在庫分割登録・在庫結合登録を行い、在庫分割結合検索一覧で商品コードを検索して行のIDを控える。
 * 4. 分割先の追加と承認申請、結合元の追加・結合元商品登録・欠品登録・承認申請は、分割先登録画面・結合元登録画面・結合計画承認申請画面で行う。
 *    承認・却下は M04-13承認者で行う。
 * グッズ商品CSVのアップロード後の確認モーダルは、いまの実装には無い（設計書 M03-27 L0092 にはある。依頼者の判断待ち）。モーダルが出なければそのまま進む。
 *
 * 結合元は、結合元登録画面では、ログイン中のセッションにだけ保持される（フッターの結合元商品登録ボタンを押すまで DB に入らない）。
 * シードは別のブラウザセッションで作るので、「結合元商品登録ボタンは押さない」状態はケースのセッションへ持ち越せない（049・051〜054・104 は実装しない）。
 * 結合計画承認申請画面の欠品登録ボタンで仮登録した欠品点数も、同じくセッションにだけ置かれ、承認申請のときにそのセッションから読まれる。
 * 060B・070B・077A のシードは、この理由で正本の状態にならない。作り方は実装してあるが、裁定案6（記録の7章）が決まるまでは、
 * 何も作らずに止める（規約「正本の状態にできないと分かったら作らない」。2026-10-21、060・070・077 を規約の外で流したことのレビューの指摘で足した）。
 */
import { rc } from "../lib/run_marker";
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { csvLine } from "../lib/csv";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import {
  approveStockIns, countProductsByCode, ensureDepartment, ensureMemberWithDepartment, ensureStoreA, expectStock, GoodsSpec, memberStoreChoices,
  readGoodsRootCategoryId, registerGoods, registerStockIns, StockIn, 作業者名, 承認者名, 権限なし名, 試験所属A, 試験店舗A, 連携作業者名,
} from "../pages/admin/m04_13_setup";
import {
  alerts, JoinApprovalPage, JoinEditPage, joinApprovalPath, joinEditPath, joinShortagePath, openJoinNew, openSplitNew,
  SplitApprovalPage, splitApprovalPath, SplitEditPage, splitEditPath, SplitJoinListPage,
} from "../pages/admin/m04_13_split_join";

export const M0413_OP: Account = { loginId: "m0413_operator", password: "Passw0rd!M0413Op" };
export const M0413_APP: Account = { loginId: "m0413_approver", password: "Passw0rd!M0413Ap" };
export const M0413_NOAUTH: Account = { loginId: "m0413_noauth", password: "Passw0rd!M0413No" };
export const M0413L_OP: Account = { loginId: "m0413l_operator", password: "Passw0rd!M0413L" };

/** 分割先CSV（正本のシードが名前を決めて作るファイル）の置き場 */
export const M0413_CSV_DIR = path.join(STATE_DIR, "m04-13");
export const csvPath = (name: string) => path.join(M0413_CSV_DIR, name);

/** 「他のデータと重ならない任意の値」の商品コード。実行のたびに変わる */
const RUN = Date.now().toString(36).toUpperCase();
export const anyCode = (caseNo: string, role: string) => `M0413X${caseNo}${role}-${RUN}`;
const isAnyCode = (code: string) => code.startsWith("M0413X");

// ---------------------------------------------------------------- 共有のシード

defineSeed("S-M04-13-ENV", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureStoreA(page, (m) => reportSeedIssue(seed.シードID, m));
    await ensureDepartment(page, 試験所属A);
  });
  // 在庫区分は、アプリの固定の区分（EC-CUBE・スマレジ）。画面で登録するものではない。在庫検索一覧の在庫区分の欄に2つあることを確かめる
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/product/stock"));
    const labels = await page.locator('input[name="admin_search_stock_list[stock_zone][]"]').evaluateAll((inputs) =>
      inputs.map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
    expect(labels, "在庫検索一覧の在庫区分の選択肢").toEqual(["EC-CUBE", "スマレジ"]);
  });
});

defineSeed("S-M04-13-L-ENV", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureStoreA(page, (m) => reportSeedIssue(seed.シードID, m));
    await ensureDepartment(page, 試験所属A);
  });
});

/** 所属店舗＝試験店舗A（M04-13）・所属＝試験所属A（M04-13）・システム管理者の権限・編集可能店舗＝試験店舗A（M04-13） のメンバー */
async function storeAMember(browser: SeedCtx["browser"], account: Account, 名前: string, email: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberWithDepartment(page, {
    名前, 所属店舗: 試験店舗A, 所属: 試験所属A, ログインID: account.loginId, メールアドレス: email, パスワード: account.password,
    権限: "システム管理者", デフォルト検索表示店舗: 試験店舗A, 編集可能店舗: [試験店舗A],
  }));
  // ログインできる（稼働中）ことを、別のセッションで確かめる
  await withAdminSession(browser, account, async () => undefined);
}

defineSeed("S-M04-13-OP", { needs: ["S-M04-13-ENV"] }, async ({ browser }) => {
  await storeAMember(browser, M0413_OP, 作業者名, "m0413_operator@example.test");
});

defineSeed("S-M04-13-APP", { needs: ["S-M04-13-ENV"] }, async ({ browser }) => {
  await storeAMember(browser, M0413_APP, 承認者名, "m0413_approver@example.test");
});

defineSeed("S-M04-13-L-OP", { needs: ["S-M04-13-L-ENV"] }, async ({ browser }) => {
  await storeAMember(browser, M0413L_OP, 連携作業者名, "m0413l_operator@example.test");
});

defineSeed("S-M04-13-NOAUTH", { needs: ["S-M04-13-ENV"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 試験店舗A（M04-13）を編集可能店舗に含めない。所属店舗・編集可能店舗は、試験店舗A（M04-13）以外で画面の先頭の店舗にする（正本は指定しない）
    const other = (await memberStoreChoices(page)).find((s) => s !== 試験店舗A);
    if (!other) throw new Error(`S-M04-13-NOAUTH: ${試験店舗A}以外の店舗が、メンバー登録の所属店舗の選択肢に無い`);
    await ensureMemberWithDepartment(page, {
      名前: 権限なし名, 所属店舗: other, 所属: 試験所属A, ログインID: M0413_NOAUTH.loginId, メールアドレス: "m0413_noauth@example.test",
      パスワード: M0413_NOAUTH.password, 権限: "システム管理者", デフォルト検索表示店舗: other, 編集可能店舗: [other],
    });
  });
  await withAdminSession(browser, M0413_NOAUTH, async () => undefined);
});

// ---------------------------------------------------------------- ケース専用のシードの作り方

type SplitSpec = {
  /** 控える呼び名（〔在庫分割結合ID-M0413-…〕）。控えないときは省く */
  label?: string;
  source: string;
  qty: number;
  memo?: string;
  /** 分割先（商品コード・分割先在庫数）。この順に追加する */
  dests?: [string, number][];
  /** 承認通知先を選んで承認申請を確定する */
  apply?: boolean;
  /** 承認者の判断（承認、または却下理由つきの却下） */
  decide?: { mode: "approve" } | { mode: "reject"; reason: string };
};

type JoinSpec = {
  label?: string;
  target: string;
  qty: number;
  /** 結合元（商品コード・結合元在庫数。null は数量を入れない）。この順に追加する */
  sources?: [string, number | null][];
  /** フッターの結合元商品登録ボタンを押す */
  footer?: boolean;
  /** 結合計画承認申請画面での欠品登録（商品コード・欠品点数） */
  shortages?: [string, number][];
  apply?: boolean;
  decide?: { mode: "approve" } | { mode: "reject"; reason: string };
};

type CaseSpec = {
  products: GoodsSpec[];
  ins: StockIn[];
  splits?: SplitSpec[];
  joins?: JoinSpec[];
  /** 商品マスターで、該当する商品が無いことを確かめる商品コード */
  unknown?: string[];
  /** 正本が作ると定めた分割先CSV（名前・行） */
  csv?: { name: string; rows: [string, string][] };
  /** 在庫の登録者（既定は M04-13作業者） */
  registrant?: { account: Account; name: string };
  /** 画面では正本の状態を作れない点（報告に「シード作成時の問題」として出す） */
  gaps?: string[];
  /** 正本の状態にならないと分かっている理由。あれば、何も作らずに止める（裁定案6 が決まるまで） */
  blocked?: string;
};

const ec = (code: string, quantity: number, unitPrice = 100): StockIn => ({ code, zone: "EC-CUBE", quantity, unitPrice });
const sm = (code: string, quantity: number, unitPrice: number): StockIn => ({ code, zone: "スマレジ", quantity, unitPrice });

/** 分割先CSVを、見出し「商品コード」「分割先分割在庫数」・UTF-8 で書く */
function writeSplitCsv(name: string, rows: [string, string][]): void {
  fs.mkdirSync(M0413_CSV_DIR, { recursive: true });
  const text = [csvLine(["商品コード", "分割先分割在庫数"]), ...rows.map((r) => csvLine(r))].join("\n") + "\n";
  fs.writeFileSync(csvPath(name), text, "utf8");
}

/** 分割先登録画面で分割先を追加し、承認通知先を選んで承認申請を確定する */
async function applySplit(page: Page, id: string, s: SplitSpec, what: string): Promise<void> {
  const edit = new SplitEditPage(page, id);
  await edit.open();
  for (const [code, qty] of s.dests ?? []) {
    await edit.addDestination(code);
    const r = await edit.setDestinationQuantity(code, String(qty));
    if (r.dialogs.length) throw new Error(`${what}: ${code} の分割先在庫数を入れると警告が出た: ${r.dialogs.join(" / ")}`);
  }
  if (!s.apply) return;
  await edit.chooseApprovalTargets(試験所属A, 承認者名);
  if (!(await edit.pressApplyApproval())) throw new Error(`${what}: 承認申請ボタンが無い`);
  await edit.confirmApplyApproval();
  if (new URL(page.url()).pathname !== splitApprovalPath(id)) {
    throw new Error(`${what}: 承認申請のあと分割承認画面へ移らない（${page.url()}／${(await alerts(page)).join(" / ")}）`);
  }
}

/** 結合元登録画面で結合元を追加し、フッターの結合元商品登録・欠品登録・承認申請を行う */
async function applyJoin(page: Page, id: string, j: JoinSpec, what: string): Promise<void> {
  const edit = new JoinEditPage(page, id);
  await edit.open();
  for (const [code, qty] of j.sources ?? []) {
    await edit.addSource(code);
    if (qty !== null) await edit.setSourceQuantity(code, String(qty));
  }
  if (!j.footer) return;
  await edit.pressFooterSourceRegister();
  if (new URL(page.url()).pathname !== joinShortagePath(id)) {
    throw new Error(`${what}: 結合元商品登録のあと結合計画承認申請画面へ移らない（${page.url()}／${(await alerts(page)).join(" / ")}）`);
  }
  for (const [code, qty] of j.shortages ?? []) {
    await edit.fillShortage(code, String(qty));
    await expect(edit.shortageButton(code), `${what}: ${code} の欠品登録ボタン`).toBeEnabled();
    // 画面は保存の応答を待たずにボタンの文字を変えるので、仮登録されたかは保存の応答の本文で確かめる
    const saved = await edit.pressShortageButton(code);
    if (saved.body?.ok !== true) throw new Error(`${what}: ${code} の欠品点数の保存（仮登録）が成功しない（応答 ${saved.status}・${JSON.stringify(saved.body)}）`);
  }
  if (!j.apply) return;
  await edit.chooseApprovalTargets(試験所属A, 承認者名);
  if (!(await edit.pressApplyApproval())) throw new Error(`${what}: 承認申請ボタンが無い`);
  await edit.confirmApplyApproval();
  if (new URL(page.url()).pathname !== joinApprovalPath(id)) {
    throw new Error(`${what}: 承認申請のあと結合計画承認画面へ移らない（${page.url()}／${(await alerts(page)).join(" / ")}）`);
  }
}

const stockKey = (s: StockIn) => `${s.code}／${s.zone}`;

/**
 * 入庫を「登録→承認」の回に分ける。同じ在庫（商品コード・在庫区分）への入庫は、出てきた順に別の回にする（i 回目に出たものは i 回目）。
 * アプリの入庫の承認は、在庫数を「在庫編集を登録した時点の在庫数＋増減数」にする（入庫の承認の処理の「登録時点の在庫 + 在庫増減数」）。
 * 同じ在庫に未承認の入庫を2件並べてから承認すると、どちらも登録した時点の在庫（0）に足すので、あとの承認が前の分を上書きして在庫数が合わない
 * （1と2を入庫して在庫数2になる。総原価は承認の時点の値に足すので1000になる）。正本の投入方法（106・109）も、1回目を承認してから2回目を登録する。
 * 同じ在庫への入庫が1回だけのシードは、これまでどおり1つの回（全部を登録してからまとめて承認）になる。
 */
function stockInRounds(ins: StockIn[]): StockIn[][] {
  const rounds: StockIn[][] = [];
  const seen = new Map<string, number>();
  for (const s of ins) {
    const n = seen.get(stockKey(s)) ?? 0;
    seen.set(stockKey(s), n + 1);
    (rounds[n] ??= []).push(s);
  }
  return rounds;
}

async function buildCase(ctx: SeedCtx, spec: CaseSpec): Promise<void> {
  const { browser, notes, seed } = ctx;
  const sid = seed.シードID;
  const issue = (m: string) => reportSeedIssue(sid, m);
  // 正本の状態にならないと分かっているシードは、商品・在庫・在庫分割結合を1件も作らずに止める（規約。流すかどうかは依頼者の判断）
  if (spec.blocked) throw new Error(`${sid}: ${spec.blocked}。正本の状態にできないと分かっているので、作らずに止める（裁定案6 が決まるまで）`);
  const registrant = spec.registrant ?? { account: M0413_OP, name: 作業者名 };
  const rounds = stockInRounds(spec.ins);
  if (spec.csv) writeSplitCsv(spec.csv.name, spec.csv.rows);
  await withAdminSession(browser, registrant.account, async (page) => {
    for (const code of spec.unknown ?? []) {
      const n = await countProductsByCode(page, code);
      if (n !== 0) throw new Error(`${sid}: 未登録のはずの商品コード ${code} の商品が ${n} 件ある`);
    }
    for (const p of spec.products.filter((p) => !isAnyCode(p.code))) {
      const n = await countProductsByCode(page, p.code);
      if (n !== 0) throw new Error(`${sid}: 正本が決めた商品コード ${p.code} の商品が既に ${n} 件ある。正本に清掃の手順が無いので、作り直さずに止める（流し直しは依頼者の判断）`);
    }
    if (spec.products.length) {
      const categoryId = await readGoodsRootCategoryId(page);
      await registerGoods(page, `${sid} のグッズ商品CSV登録（${spec.products.length}行）`, categoryId, spec.products, issue);
    }
    if (rounds.length) await registerStockIns(page, rounds[0], 承認者名, issue);
  });
  // 入庫は回ごとに「登録→承認」する。同じ在庫に2回入庫するシード（106・109）は、正本の投入方法のとおり、1回目を承認してから2回目を登録する
  for (let i = 0; i < rounds.length; i++) {
    if (i > 0) await withAdminSession(browser, registrant.account, (page) => registerStockIns(page, rounds[i], 承認者名, issue));
    await withAdminSession(browser, M0413_APP, (page) => approveStockIns(page, rounds[i], registrant.name, issue));
  }
  if (rounds.length > 1) {
    // 同じ在庫に2回以上入庫したものは、出来上がりの在庫数・総原価（正本の「在庫数3・総原価1000になる」など）を在庫検索一覧で確かめる
    await withAdminSession(browser, registrant.account, async (page) => {
      for (const key of new Set(spec.ins.map(stockKey))) {
        const same = spec.ins.filter((s) => stockKey(s) === key);
        if (same.length < 2) continue;
        const stock = same.reduce((a, s) => a + s.quantity, 0);
        const total = same.reduce((a, s) => a + s.quantity * s.unitPrice, 0);
        await expectStock(page, same[0].code, same[0].zone, stock, total, `${sid} の入庫のあと`);
      }
    });
  }

  const decisions: { kind: "split" | "join"; id: string; decide: NonNullable<SplitSpec["decide"]> }[] = [];
  await withAdminSession(browser, registrant.account, async (page) => {
    for (const s of spec.splits ?? []) {
      const what = `${sid} の ${s.source} の在庫分割`;
      const created = await (await openSplitNew(page, s.source)).register(String(s.qty), s.memo ?? null, what);
      const id = await new SplitJoinListPage(page).readSingleId(s.source, what);
      if (id !== created) throw new Error(`${what}: 登録後の画面の在庫分割結合ID ${created} と、一覧で読んだID ${id} が違う`);
      if (s.label) notes.set(s.label, id);
      if (s.dests?.length || s.apply) await applySplit(page, id, s, what);
      if (s.decide) decisions.push({ kind: "split", id, decide: s.decide });
    }
    for (const j of spec.joins ?? []) {
      const what = `${sid} の ${j.target} の在庫結合`;
      const created = await (await openJoinNew(page, j.target)).register(String(j.qty), null, what);
      const id = await new SplitJoinListPage(page).readSingleId(j.target, what);
      if (id !== created) throw new Error(`${what}: 登録後の画面の在庫分割結合ID ${created} と、一覧で読んだID ${id} が違う`);
      if (j.label) notes.set(j.label, id);
      if (j.sources?.length) await applyJoin(page, id, j, what);
      if (j.decide) decisions.push({ kind: "join", id, decide: j.decide });
    }
  });
  if (decisions.length) {
    await withAdminSession(browser, M0413_APP, async (page) => {
      for (const d of decisions) {
        const what = `${sid} の在庫分割結合ID ${d.id} の${d.decide.mode === "approve" ? "承認" : "却下"}`;
        const p = d.kind === "split" ? new SplitApprovalPage(page, d.id) : new JoinApprovalPage(page, d.id);
        await p.open();
        if (d.decide.mode === "reject") {
          await p.却下理由.fill(d.decide.reason);
          await p.pressReject();
          await p.confirm("reject");
        } else {
          await p.pressApprove();
          await p.confirm("approve");
        }
        const landed = d.kind === "split" ? splitEditPath(d.id) : joinEditPath(d.id);
        if (new URL(page.url()).pathname !== landed) throw new Error(`${what}: 処理のあと編集画面へ移らない（${page.url()}／${(await alerts(page)).join(" / ")}）`);
      }
    });
  }
  for (const g of spec.gaps ?? []) issue(g);
}

/** 結合元登録画面の結合元・結合計画承認申請画面の欠品点数は、ログイン中のセッションにだけ置かれる。シードの状態がケースへ持ち越せないことの文 */
const sessionOnly = (what: string) =>
  `${what}は、シードがログインしたセッションにだけ置かれ、DBにもケースのセッションにも無い`;

/** ケース専用のシード（M04-13 の作り方の型）。needs は環境・作業者・承認者 */
function defineCaseSeed(seedId: string, spec: () => CaseSpec, extraNeeds: string[] = []): void {
  defineSeed(seedId, { needs: ["S-M04-13-ENV", "S-M04-13-OP", "S-M04-13-APP", ...extraNeeds] }, (ctx) => buildCase(ctx, spec()));
}

const L = (no: string) => `〔在庫分割結合ID-M0413-${no}〕`;

// ---- 分割元の商品と在庫だけ

for (const [sid, code, name, std] of [
  ["S-M04-13-CASE-001", rc("M0413-SRC-001"), "M04-13分割元-001", 200],
  ["S-M04-13-CASE-002", rc("M0413-SRC-002"), "M04-13分割元-002", 200],
  ["S-M04-13-CASE-003", rc("M0413-SRC-003"), "M04-13分割元-003", 200],
] as const) {
  defineCaseSeed(sid, () => ({ products: [{ code, name, standardPrice: std }], ins: [ec(code, 10)] }));
}
defineCaseSeed("S-M04-13-CASE-004", () => ({ products: [{ code: rc("M0413-SRC-004") }], ins: [ec(rc("M0413-SRC-004"), 10)] }));
defineCaseSeed("S-M04-13-CASE-005", () => ({ products: [{ code: rc("M0413-SRC-005") }], ins: [ec(rc("M0413-SRC-005"), 10)] }));
defineCaseSeed("S-M04-13-CASE-006", () => ({ products: [{ code: rc("M0413-SRC-006") }], ins: [ec(rc("M0413-SRC-006"), 10)] }));
defineCaseSeed("S-M04-13-CASE-007", () => ({ products: [{ code: rc("M0413-SRC-007") }], ins: [ec(rc("M0413-SRC-007"), 10)] }));
defineCaseSeed("S-M04-13-HISTDISP-086", () => ({ products: [{ code: rc("M0413-SRC-086") }], ins: [ec(rc("M0413-SRC-086"), 10)] }));
defineCaseSeed("S-M04-13-SUBHIST-096", () => ({ products: [{ code: rc("M0413-SUB-096") }], ins: [ec(rc("M0413-SUB-096"), 10)] }));
defineCaseSeed("S-M04-13-DPEXACT-101", () => ({ products: [{ code: rc("M0413-SRC-101") }], ins: [ec(rc("M0413-SRC-101"), 10)] }));
defineCaseSeed("S-M04-13-DPSMSRC-105", () => ({
  products: [{ code: rc("M0413-SRC-105") }], ins: [ec(rc("M0413-SRC-105"), 10), sm(rc("M0413-SRC-105"), 7, 120)],
}));
defineCaseSeed("S-M04-13-DPFRAC-106", () => ({
  products: [{ code: rc("M0413-SRC-106") }], ins: [ec(rc("M0413-SRC-106"), 1, 400), ec(rc("M0413-SRC-106"), 2, 300)],
}));
defineCaseSeed("S-M04-13-DPSPLIT2-110", () => ({
  products: [{ code: rc("M0413-SRC-110") }], ins: [ec(rc("M0413-SRC-110"), 10)], splits: [{ source: rc("M0413-SRC-110"), qty: 4 }],
}));

// ---- 新規登録の在庫分割（分割先0件）

/** 分割元（と候補の分割先）を作り、分割数4で在庫分割を登録してIDを控える */
function newSplit(no: string, source: string, others: GoodsSpec[] = [], otherIns: StockIn[] = [], qty = 4): CaseSpec {
  return {
    products: [{ code: source }, ...others],
    ins: [ec(source, 10), ...otherIns],
    splits: [{ label: L(no), source, qty }],
  };
}

defineCaseSeed("S-M04-13-CASE-010", () => newSplit("010", rc("M0413-SRC-010"), [{ code: rc("M0413-DST-A-010") }], [ec(rc("M0413-DST-A-010"), 5)]));
defineCaseSeed("S-M04-13-CASE-011", () => newSplit("011", rc("M0413-SRC-011"), [{ code: rc("M0413-DST-A-011") }], [ec(rc("M0413-DST-A-011"), 5)]));
defineCaseSeed("S-M04-13-CASE-014", () => ({ ...newSplit("014", rc("M0413-SRC-014")), unknown: [rc("M0413-UNKNOWN")] }));
defineCaseSeed("S-M04-13-CASE-015", () => newSplit("015", rc("M0413-SRC-015")));
defineCaseSeed("S-M04-13-CASE-016", () => newSplit("016", rc("M0413-SRC-016"), [{ code: rc("M0413-DST-A-016") }], [ec(rc("M0413-DST-A-016"), 5)]));
defineCaseSeed("S-M04-13-CASE-017", () => newSplit("017", rc("M0413-SRC-017"),
  [{ code: rc("M0413-DST-A-017") }, { code: rc("M0413-DST-B-017") }], [ec(rc("M0413-DST-A-017"), 5), ec(rc("M0413-DST-B-017"), 8)]));
defineCaseSeed("S-M04-13-CASE-018", () => newSplit("018", rc("M0413-SRC-018")));
defineCaseSeed("S-M04-13-CASE-019", () => ({
  ...newSplit("019", anyCode("019", "S"), [{ code: rc("M0413-DST-A-019") }, { code: rc("M0413-DST-B-019") }], [ec(rc("M0413-DST-A-019"), 5), ec(rc("M0413-DST-B-019"), 8)]),
  csv: { name: "split_valid-019.csv", rows: [[rc("M0413-DST-A-019"), "2"], [rc("M0413-DST-B-019"), "2"]] },
}));
defineCaseSeed("S-M04-13-CASE-023", () => {
  const unknown = Array.from({ length: 21 }, (_, i) => rc(`M0413-UNKNOWN-023-${String(i + 1).padStart(2, "0")}`));
  return { ...newSplit("023", anyCode("023", "S")), unknown, csv: { name: "split_21_errors-023.csv", rows: unknown.map((c) => [c, "1"] as [string, string]) } };
});
defineCaseSeed("S-M04-13-CASE-024", () => ({
  ...newSplit("024", anyCode("024", "S"), [{ code: rc("M0413-DST-A-024") }, { code: rc("M0413-DST-C-024") }], [ec(rc("M0413-DST-A-024"), 5), ec(rc("M0413-DST-C-024"), 6)]),
  csv: { name: "split_replace-024.csv", rows: [[rc("M0413-DST-C-024"), "1"]] },
}));
defineCaseSeed("S-M04-13-CASE-025", () => newSplit("025", rc("M0413-SRC-025")));
defineCaseSeed("S-M04-13-CASE-026", () => newSplit("026", rc("M0413-SRC-026"), [{ code: rc("M0413-DST-A-026") }], [ec(rc("M0413-DST-A-026"), 5)]));
defineCaseSeed("S-M04-13-CASE-027", () => newSplit("027", rc("M0413-SRC-027"),
  [{ code: rc("M0413-DST-A-027"), buyPrice: 200, standardPrice: 200 }, { code: rc("M0413-DST-B-027"), buyPrice: 300, standardPrice: 300 }],
  [ec(rc("M0413-DST-A-027"), 5), ec(rc("M0413-DST-B-027"), 8)]));
defineCaseSeed("S-M04-13-CASE-028", () => newSplit("028", rc("M0413-SRC-028"),
  [{ code: rc("M0413-DST-A-028"), buyPrice: 200, standardPrice: 200 }, { code: rc("M0413-DST-B-028"), buyPrice: 300, standardPrice: 300 }],
  [ec(rc("M0413-DST-A-028"), 5), ec(rc("M0413-DST-B-028"), 8)]));
defineCaseSeed("S-M04-13-ERRNAME-084", () => ({
  ...newSplit("084", anyCode("084", "S"), [{ code: rc("M0413-DST-A-084"), name: "M04-13分割先-084" }], [ec(rc("M0413-DST-A-084"), 5)]),
  csv: { name: "split_noqty-084.csv", rows: [[rc("M0413-DST-A-084"), ""]] },
}));
defineCaseSeed("S-M04-13-LINKBACK-087", () => newSplit("087", rc("M0413-SRC-087")));
defineCaseSeed("S-M04-13-DPSPLIT1-098", () => newSplit("098", rc("M0413-SRC-098"),
  [{ code: rc("M0413-DST-A-098"), buyPrice: 200, standardPrice: 200 }], [ec(rc("M0413-DST-A-098"), 5)]));
defineCaseSeed("S-M04-13-DPCSV1-100", () => ({
  ...newSplit("100", rc("M0413-SRC-100"), [{ code: rc("M0413-DST-A-100") }], [ec(rc("M0413-DST-A-100"), 5)]),
  csv: { name: "split_one-100.csv", rows: [[rc("M0413-DST-A-100"), "2"]] },
}));
defineCaseSeed("S-M04-13-DPMIXCSV-103", () => ({
  ...newSplit("103", rc("M0413-SRC-103"),
    [{ code: rc("M0413-DST-A-103") }, { code: rc("M0413-DST-B-103") }, { code: rc("M0413-DST-C-103"), name: "M04-13分割先-103" }],
    [ec(rc("M0413-DST-A-103"), 5), ec(rc("M0413-DST-B-103"), 8), ec(rc("M0413-DST-C-103"), 3)]),
  csv: { name: "split_mixed-103.csv", rows: [[rc("M0413-DST-A-103"), "2"], [rc("M0413-DST-C-103"), ""], [rc("M0413-DST-B-103"), "3"]] },
}));
defineCaseSeed("S-M04-13-DPPRORATE-107", () => newSplit("107", rc("M0413-SRC-107"),
  ["A", "B", "C"].map((x) => ({ code: rc(`M0413-DST-${x}-107`), buyPrice: 200, standardPrice: 200 })),
  ["A", "B", "C"].map((x) => ec(rc(`M0413-DST-${x}-107`), 5)), 1));
defineCaseSeed("S-M04-13-DPCSV2X-111", () => ({
  ...newSplit("111", rc("M0413-SRC-111"), [{ code: rc("M0413-DST-A-111") }, { code: rc("M0413-DST-B-111") }], [ec(rc("M0413-DST-A-111"), 5), ec(rc("M0413-DST-B-111"), 8)]),
  csv: { name: "split_dup-111.csv", rows: [[rc("M0413-DST-A-111"), "2"], [rc("M0413-DST-B-111"), "2"]] },
}));

// ---- 分割承認待ち（分割先を追加して承認申請まで）・入庫完了・却下

/** 分割元（在庫10）と分割先（在庫は指定）を作り、分割数で登録して分割先を追加し、承認申請を確定する */
function pendingSplit(no: string, source: string, dests: { code: string; stock: number; buy?: number; qty: number }[], opt: {
  splitQty?: number; sourceIns?: StockIn[]; decide?: SplitSpec["decide"]; label?: string;
} = {}): CaseSpec {
  return {
    products: [{ code: source }, ...dests.map((d) => ({ code: d.code, buyPrice: d.buy, standardPrice: d.buy }))],
    ins: [...(opt.sourceIns ?? [ec(source, 10)]), ...dests.map((d) => ec(d.code, d.stock))],
    splits: [{ label: opt.label ?? L(no), source, qty: opt.splitQty ?? 4, dests: dests.map((d) => [d.code, d.qty]), apply: true, decide: opt.decide }],
  };
}

const AB = (no: string, buy = true) => [
  { code: rc(`M0413-DST-A-${no}`), stock: 5, buy: buy ? 200 : undefined, qty: 2 },
  { code: rc(`M0413-DST-B-${no}`), stock: 8, buy: buy ? 300 : undefined, qty: 2 },
];
const anyAB = (no: string) => [
  { code: anyCode(no, "D1"), stock: 5, qty: 2 },
  { code: anyCode(no, "D2"), stock: 8, qty: 2 },
];

defineCaseSeed("S-M04-13-CASE-030", () => pendingSplit("030", anyCode("030", "S"), anyAB("030")));
defineCaseSeed("S-M04-13-CASE-031", () => pendingSplit("031", rc("M0413-SRC-031"), AB("031")));
defineCaseSeed("S-M04-13-CASE-032", () => pendingSplit("032", anyCode("032", "S"), anyAB("032")));
defineCaseSeed("S-M04-13-CASE-033", () => pendingSplit("033", rc("M0413-SRC-033"), anyAB("033")));
defineCaseSeed("S-M04-13-CASE-034", () => {
  const a = pendingSplit("034", anyCode("034", "SA"), [{ code: anyCode("034", "DA"), stock: 5, qty: 4 }], { label: L("034A") });
  const b = pendingSplit("034", anyCode("034", "SB"), [{ code: anyCode("034", "DB"), stock: 5, qty: 4 }], { label: L("034B") });
  return { products: [...a.products, ...b.products], ins: [...a.ins, ...b.ins], splits: [...a.splits!, ...b.splits!] };
});
defineCaseSeed("S-M04-13-CASE-035", () => pendingSplit("035", anyCode("035", "S"), [{ code: anyCode("035", "D1"), stock: 5, qty: 4 }]));
defineCaseSeed("S-M04-13-CASE-036", () => {
  const a = pendingSplit("036", anyCode("036", "SA"), [{ code: anyCode("036", "DA"), stock: 5, qty: 4 }], { label: L("036A"), decide: { mode: "approve" } });
  const b = pendingSplit("036", anyCode("036", "SB"), [{ code: anyCode("036", "DB"), stock: 5, qty: 4 }],
    { label: L("036B"), decide: { mode: "reject", reason: "分割内容不一致" } });
  return { products: [...a.products, ...b.products], ins: [...a.ins, ...b.ins], splits: [...a.splits!, ...b.splits!] };
});
defineCaseSeed("S-M04-13-APPRDISP-082", () => pendingSplit("082", rc("M0413-SRC-082"), AB("082")));
defineCaseSeed("S-M04-13-APPRHIST-094", () => pendingSplit("094", rc("M0413-SRC-094"), AB("094")));
defineCaseSeed("S-M04-13-REJHIST-095", () => pendingSplit("095", rc("M0413-SRC-095"), AB("095")));
defineCaseSeed("S-M04-13-DPAPPFRAC-108", () => pendingSplit("108", rc("M0413-SRC-108"), [
  { code: rc("M0413-DST-A-108"), stock: 5, buy: 200, qty: 1 },
  { code: rc("M0413-DST-B-108"), stock: 8, buy: 200, qty: 1 },
  { code: rc("M0413-DST-C-108"), stock: 3, buy: 200, qty: 1 },
], { splitQty: 1 }));
defineCaseSeed("S-M04-13-DPREJFRAC-109", () => pendingSplit("109", rc("M0413-SRC-109"), [{ code: rc("M0413-DST-A-109"), stock: 5, qty: 1 }], {
  splitQty: 1, sourceIns: [ec(rc("M0413-SRC-109"), 1, 400), ec(rc("M0413-SRC-109"), 2, 300)],
}));

// ---- 連携（在庫分割結合検索一覧への反映）

defineSeed("S-M04-13-L-STOCK-080", { needs: ["S-M04-13-L-ENV", "S-M04-13-L-OP", "S-M04-13-APP"] }, async (ctx) => {
  await buildCase(ctx, {
    products: [{ code: rc("M0413L-SRC-001"), name: "M04-13連携分割元-001" }], ins: [ec(rc("M0413L-SRC-001"), 10)],
    registrant: { account: M0413L_OP, name: 連携作業者名 },
  });
  await noSplitJoinFor(ctx, rc("M0413L-SRC-001"));
});
defineSeed("S-M04-13-L-STOCK-081", { needs: ["S-M04-13-L-ENV", "S-M04-13-L-OP", "S-M04-13-APP"] }, async (ctx) => {
  await buildCase(ctx, {
    products: [{ code: rc("M0413L-DST-002"), name: "M04-13連携結合先-002" }], ins: [ec(rc("M0413L-DST-002"), 10)],
    registrant: { account: M0413L_OP, name: 連携作業者名 },
  });
  await noSplitJoinFor(ctx, rc("M0413L-DST-002"));
});

/** 在庫分割結合検索一覧で、商品コードを検索対象「分割元・結合先」「分割先・結合元」のそれぞれで検索し、0件であることを確かめる */
async function noSplitJoinFor(ctx: SeedCtx, code: string): Promise<void> {
  await withAdminSession(ctx.browser, M0413L_OP, async (page) => {
    const list = new SplitJoinListPage(page);
    for (const t of ["分割元・結合先", "分割先・結合元"] as const) {
      await list.open();
      await list.search(code, [t]);
      expect(await list.rows(), `${ctx.seed.シードID}: 検索対象「${t}」で ${code} の在庫分割結合は0件`).toEqual([]);
    }
  });
}

// ---- 在庫結合の結合先の商品と在庫だけ

for (const [sid, code, name, std] of [
  ["S-M04-13-CASE-040", rc("M0413-JOIN-DST-040"), "M04-13結合対象-040", 500],
  ["S-M04-13-CASE-041", rc("M0413-JOIN-DST-041"), "M04-13結合対象-041", 500],
] as const) {
  defineCaseSeed(sid, () => ({ products: [{ code, name, standardPrice: std }], ins: [ec(code, 3)] }));
}
defineCaseSeed("S-M04-13-CASE-042", () => ({ products: [{ code: rc("M0413-JOIN-DST-042"), standardPrice: 500 }], ins: [ec(rc("M0413-JOIN-DST-042"), 3)] }));
defineCaseSeed("S-M04-13-CASE-043", () => ({ products: [{ code: rc("M0413-JOIN-DST-043"), standardPrice: 500 }], ins: [ec(rc("M0413-JOIN-DST-043"), 3)] }));
defineCaseSeed("S-M04-13-CASE-044", () => ({ products: [{ code: rc("M0413-JOIN-DST-044") }], ins: [ec(rc("M0413-JOIN-DST-044"), 3)] }));
defineCaseSeed("S-M04-13-DSTDISP-088", () => ({ products: [{ code: rc("M0413-JOIN-DST-088"), standardPrice: 500 }], ins: [ec(rc("M0413-JOIN-DST-088"), 3)] }));
defineCaseSeed("S-M04-13-HISTDISP-089", () => ({ products: [{ code: rc("M0413-JOIN-DST-089") }], ins: [ec(rc("M0413-JOIN-DST-089"), 3)] }));

// ---- 新規登録の在庫結合（結合元0件）

function newJoin(no: string, target: string, others: GoodsSpec[] = [], otherIns: StockIn[] = []): CaseSpec {
  return { products: [{ code: target }, ...others], ins: [ec(target, 3), ...otherIns], joins: [{ label: L(no), target, qty: 2 }] };
}

defineCaseSeed("S-M04-13-CASE-047", () => newJoin("047", rc("M0413-JOIN-DST-047")));
defineCaseSeed("S-M04-13-CASE-048", () => newJoin("048", rc("M0413-JOIN-DST-048"), [{ code: rc("M0413-JOIN-A-048"), standardPrice: 200 }], [ec(rc("M0413-JOIN-A-048"), 10)]));
defineCaseSeed("S-M04-13-CASE-050", () => newJoin("050", anyCode("050", "T"),
  [{ code: rc("M0413-JOIN-A-050"), standardPrice: 200 }, { code: rc("M0413-JOIN-B-050"), standardPrice: 300 }], [ec(rc("M0413-JOIN-A-050"), 10), ec(rc("M0413-JOIN-B-050"), 8)]));
defineCaseSeed("S-M04-13-CASE-058", () => newJoin("058", anyCode("058", "T"),
  [{ code: rc("M0413-JOIN-A-058") }, { code: rc("M0413-JOIN-B-058") }], [ec(rc("M0413-JOIN-A-058"), 10), ec(rc("M0413-JOIN-B-058"), 8)]));
defineCaseSeed("S-M04-13-SRCSAVE-090", () => newJoin("090", rc("M0413-JOIN-DST-090"),
  [{ code: rc("M0413-JOIN-A-090"), name: "M04-13結合元-090", standardPrice: 200 }], [ec(rc("M0413-JOIN-A-090"), 10)]));
defineCaseSeed("S-M04-13-DPJOIN1-099", () => newJoin("099", rc("M0413-JOIN-T-099"), [{ code: rc("M0413-JOIN-A-099") }], [ec(rc("M0413-JOIN-A-099"), 10)]));

// ---- 結合元登録・結合計画承認待ち・入庫完了・却下

type JoinPlan = {
  label: string; target: string; sources: { code: string; stock: number; qty: number; std?: number }[];
  shortages?: [string, number][]; apply?: boolean; decide?: JoinSpec["decide"];
};

function joins(plans: JoinPlan[], extraProducts: GoodsSpec[] = [], extraIns: StockIn[] = []): CaseSpec {
  return {
    products: [...extraProducts, ...plans.flatMap((p) => [{ code: p.target }, ...p.sources.map((s) => ({ code: s.code, standardPrice: s.std }))])],
    ins: [...extraIns, ...plans.flatMap((p) => [ec(p.target, 3), ...p.sources.map((s) => ec(s.code, s.stock))])],
    joins: plans.map((p) => ({
      label: p.label, target: p.target, qty: 2, sources: p.sources.map((s) => [s.code, s.qty] as [string, number]),
      footer: true, shortages: p.shortages, apply: p.apply, decide: p.decide,
    })),
  };
}

/** 結合元A（在庫10・数量4）とB（在庫8・数量2） */
const srcAB = (a: string, b: string) => [{ code: a, stock: 10, qty: 4 }, { code: b, stock: 8, qty: 2 }];

defineCaseSeed("S-M04-13-CASE-060", () => {
  const spec = joins([{ label: L("060A"), target: anyCode("060", "TA"), sources: srcAB(anyCode("060", "A1"), anyCode("060", "A2")) }]);
  // 2件目は、結合元を入力して、フッターの結合元商品登録ボタンは押さない
  spec.products.push({ code: anyCode("060", "TB") }, { code: anyCode("060", "B1") }, { code: anyCode("060", "B2") });
  spec.ins.push(ec(anyCode("060", "TB"), 3), ec(anyCode("060", "B1"), 10), ec(anyCode("060", "B2"), 8));
  spec.joins!.push({ label: L("060B"), target: anyCode("060", "TB"), qty: 2, sources: [[anyCode("060", "B1"), 4], [anyCode("060", "B2"), 2]] });
  spec.blocked = sessionOnly("060B の結合元（数量4と2。フッターの結合元商品登録ボタンは押さない）");
  return spec;
});
defineCaseSeed("S-M04-13-CASE-061", () => joins([{ label: L("061"), target: anyCode("061", "T"), sources: srcAB(anyCode("061", "A"), anyCode("061", "B")) }]));
defineCaseSeed("S-M04-13-CASE-063", () => joins([{ label: L("063"), target: anyCode("063", "T"), sources: srcAB(rc("M0413-JOIN-A-063"), rc("M0413-JOIN-B-063")) }]));
defineCaseSeed("S-M04-13-CASE-064", () => joins([{ label: L("064"), target: anyCode("064", "T"), sources: [{ code: rc("M0413-JOIN-A-064"), stock: 10, qty: 4 }] }]));
defineCaseSeed("S-M04-13-CASE-065", () => joins([{ label: L("065"), target: anyCode("065", "T"), sources: [{ code: rc("M0413-JOIN-A-065"), stock: 10, qty: 4 }] }]));
defineCaseSeed("S-M04-13-CASE-066", () => joins([{
  label: L("066"), target: anyCode("066", "T"), sources: [{ code: rc("M0413-JOIN-SHORT-MAX-066"), stock: 2000004, qty: 1000002 }],
}]));
defineCaseSeed("S-M04-13-CASE-068", () => joins([{ label: L("068"), target: anyCode("068", "T"), sources: srcAB(rc("M0413-JOIN-A-068"), anyCode("068", "B")) }]));
defineCaseSeed("S-M04-13-CASE-069", () => joins([{ label: L("069"), target: anyCode("069", "T"), sources: srcAB(anyCode("069", "A"), anyCode("069", "B")) }]));
defineCaseSeed("S-M04-13-CASE-070", () => ({
  ...joins([
    { label: L("070A"), target: anyCode("070", "TA"), sources: srcAB(anyCode("070", "A1"), anyCode("070", "A2")), shortages: [[anyCode("070", "A1"), 1]], apply: true },
    { label: L("070B"), target: anyCode("070", "TB"), sources: srcAB(anyCode("070", "B1"), anyCode("070", "B2")), shortages: [[anyCode("070", "B1"), 1]] },
  ]),
  // 070B は承認申請をしないので、欠品登録ボタンで仮登録した欠品1は、承認申請で読まれずにシードのセッションに残るだけになる
  blocked: sessionOnly("070B の仮登録した欠品点数（結合元B1の欠品1。承認申請はしない）"),
}));
for (const no of ["071", "072", "073", "075"] as const) {
  defineCaseSeed(`S-M04-13-CASE-${no}`, () => joins([{
    label: L(no), target: anyCode(no, "T"), sources: srcAB(anyCode(no, "A"), anyCode(no, "B")), shortages: [[anyCode(no, "A"), 1]], apply: true,
  }]));
}
defineCaseSeed("S-M04-13-CASE-074", () => joins([{
  label: L("074"), target: anyCode("074", "T"), sources: srcAB(rc("M0413-JOIN-A-074"), rc("M0413-JOIN-B-074")), shortages: [[rc("M0413-JOIN-A-074"), 1]], apply: true,
}]));
defineCaseSeed("S-M04-13-CASE-076", () => joins([
  { label: L("076A"), target: anyCode("076", "TA"), sources: [{ code: anyCode("076", "A1"), stock: 10, qty: 4 }], apply: true, decide: { mode: "approve" } },
  { label: L("076B"), target: anyCode("076", "TB"), sources: [{ code: anyCode("076", "B1"), stock: 10, qty: 4 }], apply: true, decide: { mode: "reject", reason: "試験データ準備" } },
]));
defineCaseSeed("S-M04-13-CASE-077", () => {
  const spec = joins([
    { label: L("077B"), target: anyCode("077", "TB"), sources: srcAB(anyCode("077", "B1"), anyCode("077", "B2")) },
    { label: L("077C"), target: anyCode("077", "TC"), sources: srcAB(anyCode("077", "C1"), anyCode("077", "C2")), shortages: [[anyCode("077", "C1"), 1]], apply: true },
  ], [{ code: rc("M0413-JOIN-DST-077") }, { code: anyCode("077", "TA") }, { code: rc("M0413-JOIN-A-077") }, { code: rc("M0413-JOIN-B-077") }],
  [ec(rc("M0413-JOIN-DST-077"), 3), ec(anyCode("077", "TA"), 3), ec(rc("M0413-JOIN-A-077"), 10), ec(rc("M0413-JOIN-B-077"), 8)]);
  // 1件目（新規登録）: 結合元に M0413-JOIN-A-077 を数量4で入れ、M0413-JOIN-B-077 は追加せず、フッターの結合元商品登録ボタンも押さない
  spec.joins!.unshift({ label: L("077A"), target: anyCode("077", "TA"), qty: 2, sources: [[rc("M0413-JOIN-A-077"), 4]] });
  spec.blocked = sessionOnly("077A の結合元（M0413-JOIN-A-077・数量4。フッターの結合元商品登録ボタンは押さない）");
  return spec;
});
defineCaseSeed("S-M04-13-SRCPRICE-092", () => joins([{
  label: L("092"), target: rc("M0413-JOIN-DST-092"),
  sources: [{ code: rc("M0413-JOIN-A-092"), stock: 10, qty: 4, std: 200 }, { code: rc("M0413-JOIN-B-092"), stock: 8, qty: 2, std: 300 }],
}]));
defineCaseSeed("S-M04-13-REJHIST-093", () => joins([{
  label: L("093"), target: rc("M0413-JOIN-DST-093"), sources: srcAB(rc("M0413-JOIN-A-093"), rc("M0413-JOIN-B-093")), apply: true,
}]));
defineCaseSeed("S-M04-13-DPNOSHORT-102", () => joins([{ label: L("102"), target: rc("M0413-JOIN-T-102"), sources: srcAB(rc("M0413-JOIN-A-102"), rc("M0413-JOIN-B-102")) }]));

/** ケースのファイルを読む（シードが作った分割先CSV） */
export function readSplitCsv(name: string): Buffer {
  return fs.readFileSync(csvPath(name));
}
