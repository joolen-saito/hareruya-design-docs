/**
 * M04-22 在庫移動・振替CSV登録の画面シード。正本: cases/M04-22_seed_data.tsv
 *
 * テストデータは「既存データ または 画面から作ったデータ」に読み替える（依頼者の方針 2026-11-10）。読み替えは、シードごとに
 * reportSeedIssue で「シード作成時の問題」としてエビデンスに残す。共通の読み替えは次のとおり。
 * - 店舗: 店舗A・店舗B は、M04-23 が画面で作る共有の「試験店舗A（M04-23）」「試験店舗B（M04-23）」に読み替える（店舗を新たに作らない）。
 *   在庫移動のケースは、店舗Aを 試験店舗A、店舗Bを 試験店舗B に読み替える。
 *   在庫振替のケース（承認通知先を使うもの）は、承認者（Approver-A など）を「所属店舗＝試験店舗B」のメンバーとして作るので、
 *   正本の「店舗A」の役を 試験店舗B が務める（試験店舗A には M04-23 の承認者が所属していて、承認通知先の選択肢が正本の
 *   「Approver-A・Approver-B・Approver-Z だけ」にならないため）。この役替えは、そのシードの注記に残す。
 * - 所属: 所属のマスタ（共有のマスタ）に行を足さない。所属A・所属B・所属C は、所属のマスタの既存の名称（画面の並び順の1・2・3番目）に
 *   読み替える。所属の並び順・所属が属する店舗のDBでの設定は行わない（アプリは所属に店舗の項目を持たず、承認通知先の所属の選択肢は
 *   その店舗の承認権限を持つメンバーの所属から作る）。
 * - 権限: 権限のマスターに行を足さない。承認権限なしの権限は、権限管理で承認権限のチェックが外れている既存の権限を使う（M04-23 と同じ）。
 *   正本の「在庫管理の各機能にチェックを入れ」は、権限管理の表に承認権限の列しか無いので、確かめない。
 * - 商品コード: 店舗を共有するので、実行ごとに別の商品にする（末尾に実行の印）。255文字の商品コード（013）は、文字数を変えないよう、
 *   先頭に文字Aを6つ、そのあとに実行の印、残りを文字Aで埋めて255文字にする。
 * - 在庫の入庫: 正本の在庫編集（入庫/その他）を、M04-23 の部品（在庫検索一覧の在庫編集 → 別の承認者が在庫編集承認一覧で承認）で行う。
 * - 在庫区分・移動タイプ・初期ステータス・在庫変動区分: 正本の「DBへ直接設定する」は行わない。在庫区分は画面の選択肢で確かめ、
 *   移動タイプなどは登録の結果で確かめる（共有のマスタの行を足さない）。
 * - 同名CSV取込履歴=0件: 取込履歴を消す画面もDBの書き込みも使わない（ケースは取込履歴を確かめない）。ファイル名は正本のまま。
 * - 受信箱: 開発環境に試験用の受信箱が無い。承認通知メールを確かめるケースは無い。
 */
import fs from "node:fs";
import { Browser, expect, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 在庫の番号, 商品の番号 } from "../db/m04_22_move_transfer_csv";
import { 印つき商品の在庫数を書き換える } from "../db/m04_23_split_join_csv";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { findMemberId } from "../pages/admin/member";
import { syncMemberStores } from "../pages/admin/m04_22_csv_register";
import { ensureMemberWithDept } from "../pages/admin/m04_21_stock_change_csv";
import { createMemberByStoreIds } from "../pages/admin/m04_24_member";
import { readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import { searchStockByCode, stockInRow } from "../pages/admin/m04_02_rc_stock";
import { stockChangeCsvZoneLabels } from "../pages/admin/m04_23_split_join_csv";
import { Actor, M0423Store, m0423Master, REGISTRANT, stockIn, Zone } from "./m04-23";

export const M0422_EDIT: Account = { loginId: "m0422_edit", password: "Passw0rd!M0422" };
export const M0422_VIEW: Account = { loginId: "m0422_view", password: "Passw0rd!View422" };
const EDIT_NAME = "M04-22編集管理者";
const VIEW_NAME = "M04-22参照管理者";

export const APPROVER_A = "Approver-A";
export const APPROVER_B = "Approver-B";
export const APPROVER_Z = "Approver-Z";
const VIEWER_A = "Viewer-A";

/** 在庫を入れる管理者・承認する管理者の組（RD-*） */
export const RD_OP: Actor = { account: { loginId: "m0422rd-op", password: "Passw0rd-M0422RDop" }, 名前: "M04-22 RD作業者" };
export const RD_APR: Actor = { account: { loginId: "m0422rd-apr", password: "Passw0rd-M0422RDapr" }, 名前: "M04-22 RD承認者" };

/** 読み替えた所属・店舗（S-M04-22-APPROVERS が決める） */
export type M0422Master = { A: M0423Store; B: M0423Store; 所属A: string; 所属B: string; 所属C: string };
export function m0422Master(): M0422Master {
  const m = m0423Master();
  if (m.所属の並び.length < 3) throw new Error(`所属のマスタの既存の名称が3つ未満（${m.所属の並び.join("、")}）`);
  return { A: m.A, B: m.B, 所属A: m.所属の並び[0], 所属B: m.所属の並び[1], 所属C: m.所属の並び[2] };
}

const issueOf = (seedId: string) => (m: string) => reportSeedIssue(seedId, m);

// ================================================================ 管理者・店舗・承認者

defineSeed("S-M04-22-ADM-EDIT", { needs: ["S-M04-23-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = issueOf(seed.シードID);
  const m = m0423Master();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const stores = { 所属店舗ID: m.A.id, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id, m.B.id] };
    let id = await findMemberId(page, EDIT_NAME);
    if (!id) {
      id = await createMemberByStoreIds(page, {
        名前: EDIT_NAME, ログインID: M0422_EDIT.loginId, メールアドレス: "m0422_edit@example.test", パスワード: M0422_EDIT.password,
        権限: m.承認権限なしの権限, ...stores,
      });
    } else if (await syncMemberStores(page, id, stores)) {
      issue(`登録済みのメンバー「${EDIT_NAME}」の所属店舗・デフォルト検索表示店舗・編集可能店舗を、メンバー編集で ${m.A.店名}・${m.B.店名} にそろえた（以前は M04-22 が作った店舗A・店舗B だった）`);
    }
    notes.set("〔管理者ID-M0422-共有A〕", id);
  });
  notes.set("〔店舗ID-M0422-共有A〕", m.A.id);
  notes.set("〔店舗ID-M0422-共有B〕", m.B.id);
  issue(`店舗A・店舗B は、画面で新しく作らず、共有の「${m.A.店名}」（店舗ID ${m.A.id}）・「${m.B.店名}」（店舗ID ${m.B.id}）に読み替えた`);
  issue(`権限は、権限のマスターに行を足さず、権限管理で承認権限のチェックが外れている既存の権限「${m.承認権限なしの権限}」にした（正本の「在庫管理の各機能にチェックを入れ」は、権限管理の表に承認権限の列しか無いので確かめない）`);
  issue("メンバーの名前・メールアドレス・所属は正本が「任意の値」とするので、E2Eで決めた（所属は選択肢の先頭）。デフォルト検索表示店舗はシード表に無いが、メンバー登録画面で必須なので所属店舗と同じ");
  await withAdminSession(browser, M0422_EDIT, async (page) => {
    const res = await page.goto(adminUrl("/product/stock/move_transfer"));
    expect(res?.status(), "m0422_edit で在庫移動・振替検索一覧を開ける").toBe(200);
  });
});

defineSeed("S-M04-22-ADM-VIEW", { needs: ["S-M04-23-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = issueOf(seed.シードID);
  const m = m0423Master();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const stores = { 所属店舗ID: m.A.id, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [] as string[] };
    let id = await findMemberId(page, VIEW_NAME);
    if (!id) {
      id = await createMemberByStoreIds(page, {
        名前: VIEW_NAME, ログインID: M0422_VIEW.loginId, メールアドレス: "m0422_view@example.test", パスワード: M0422_VIEW.password,
        権限: m.承認権限なしの権限, ...stores,
      });
    } else if (await syncMemberStores(page, id, stores)) {
      issue(`登録済みのメンバー「${VIEW_NAME}」の所属店舗・デフォルト検索表示店舗・編集可能店舗（なし）を、メンバー編集でそろえた`);
    }
    notes.set("〔管理者ID-M0422-共有B〕", id);
  });
  notes.set("〔店舗ID-M0422-共有A〕", m.A.id);
  notes.set("〔店舗ID-M0422-共有B〕", m.B.id);
  issue(`店舗A・店舗B は ${m.A.店名}・${m.B.店名} に読み替えた。編集可能店舗は何も選ばない。権限は承認権限のチェックが外れている既存の権限「${m.承認権限なしの権限}」`);
  await withAdminSession(browser, M0422_VIEW, async (page) => {
    const res = await page.goto(adminUrl("/product/stock/move_transfer"));
    expect(res?.status(), "m0422_view で在庫移動・振替検索一覧を開ける").toBe(200);
  });
});

defineSeed("S-M04-22-BASES", { needs: ["S-M04-23-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = issueOf(seed.シードID);
  const m = m0423Master();
  notes.set("〔店舗ID-M0422-共有A〕", m.A.id);
  notes.set("〔店舗ID-M0422-共有B〕", m.B.id);
  issue(`店舗A・店舗B は ${m.A.店名}（店舗ID ${m.A.id}）・${m.B.店名}（店舗ID ${m.B.id}）に読み替えた（店舗を新たに作らない）`);
  issue("正本の「DBへ直接設定する」在庫区分・移動タイプ・初期ステータス・在庫変動区分は、共有のマスタなので書き込まない。在庫区分EC-CUBE・スマレジは画面の選択肢で確かめ、移動タイプ・初期ステータス・在庫変動区分はケースの登録の結果（DB確認）で確かめる");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    expect(await stockChangeCsvZoneLabels(page), "在庫変更CSV登録の在庫区分の選択肢").toEqual(["EC-CUBE", "スマレジ"]);
  });
});

defineSeed("S-M04-22-APPROVERS", { needs: ["S-M04-23-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = issueOf(seed.シードID);
  const m = m0422Master();
  const noApproval = m0423Master().承認権限なしの権限;
  const approvers: [string, string, string, string, string, string][] = [
    // 名前, ログインID, メール, パスワード, 所属, 控える呼び名
    [APPROVER_A, "m0422_apr_a", "m0422-apr-a@example.test", "Passw0rd!M0422Aa", m.所属A, "〔管理者ID-M0422-共有C〕"],
    [APPROVER_B, "m0422_apr_b", "m0422-apr-b@example.test", "Passw0rd!M0422Ab", m.所属B, "〔管理者ID-M0422-共有D〕"],
    [APPROVER_Z, "m0422_apr_z", "m0422-apr-z@example.test", "Passw0rd!M0422Az", m.所属A, "〔管理者ID-M0422-共有E〕"],
  ];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const [名前, ログインID, メールアドレス, パスワード, 所属, label] of approvers) {
      notes.set(label, await ensureMemberWithDept(page, {
        名前, ログインID, メールアドレス, パスワード, 権限: "システム管理者", 所属店舗ID: m.B.id, 所属, デフォルト検索表示店舗ID: m.B.id, 編集可能店舗ID: [m.B.id],
      }));
    }
    notes.set("〔管理者ID-M0422-共有F〕", await ensureMemberWithDept(page, {
      名前: VIEWER_A, ログインID: "m0422_viewer_a", メールアドレス: "m0422-viewer-a@example.test", パスワード: "Passw0rd!M0422Va", 権限: noApproval,
      所属店舗ID: m.B.id, 所属: m.所属A, デフォルト検索表示店舗ID: m.B.id, 編集可能店舗ID: [m.B.id],
    }));
    // 正本の「所属店舗が店舗B・所属C・承認権限なしのメンバー1名」。店舗Bの役は 試験店舗A が務める
    await ensureMemberWithDept(page, {
      名前: "M04-22所属Cメンバー", ログインID: "m0422_dept_c", メールアドレス: "m0422-dept-c@example.test", パスワード: "Passw0rd!M0422Dc", 権限: noApproval,
      所属店舗ID: m.A.id, 所属: m.所属C, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id],
    });
  });
  notes.set("〔店舗ID-M0422-共有A〕", m.A.id);
  notes.set("〔店舗ID-M0422-共有B〕", m.B.id);
  issue(`所属A・所属B・所属C は、所属のマスタ（共有のマスタ）に行を足さず、既存の「${m.所属A}」「${m.所属B}」「${m.所属C}」（画面の並び順の1〜3番目）に読み替えた。所属の並び順 10・20・30 と所属が属する店舗のDBでの設定は行わない（アプリの承認通知先の所属は、その店舗の承認権限を持つメンバーの所属から作られる）`);
  issue(`承認者（Approver-A・Approver-B・Approver-Z）と Viewer-A は、「${m.B.店名}」所属で作った。正本の「店舗A」の役を ${m.B.店名} が務める（${m.A.店名} には M04-23 の承認者が所属していて、承認通知先の選択肢が「Approver-A・Approver-B・Approver-Z だけ」にならないため）。正本の「店舗B」（所属Cのメンバーの所属店舗）の役は ${m.A.店名} が務める`);
  issue("承認権限ありの権限は「システム管理者」。Approver の編集可能店舗は所属店舗と同じ（正本は書かない）。名前以外の項目は正本が「任意の値」とするのでE2Eで決めた");
});

// ================================================================ ケース専用のシードの作り方

type Side = "A" | "B";
type Prod = {
  /** 正本の商品コード（シード表に書かれた値。255文字の商品コードは正本の言い方のまま） */
  code: string;
  /** 実際に作る商品コード（無ければ正本の値に実行の印） */
  actual?: string;
  /** 正本の商品名（無ければ「移動商品1」）。実行の印を付けて作る */
  name?: string;
  /** 基準価格（既定1000） */
  base?: string;
  ec?: number; sm?: number;
  /** 画面で指定できない在庫数を、DBで書き換えて設定する（在庫区分と在庫数） */
  db?: [Zone, number];
};
type CaseSpec = {
  caseNo: string;
  /** 在庫を入れる店舗（既定は 試験店舗A） */
  at?: Side;
  /** シード表の「店舗A」「店舗B」が実際にさす店舗（既定は A→試験店舗A・B→試験店舗B） */
  alias?: { A: Side; B: Side };
  products?: Prod[];
  /** CSV: 見出し・データ行（商品コードは正本の値。作った商品コードに置き換える）。raw があればそのまま書く */
  csv: { file: string; head?: string[]; rows?: string[][]; raw?: string };
  unit?: number;
  reg?: Actor; app?: Actor; reason?: string;
  buy?: string;
  needs?: string[];
  notes?: string[];
};

export type M0422CaseData = {
  A: M0423Store; B: M0423Store;
  /** 正本の商品コード → 作った商品コード */
  code: (canonical: string) => string;
  /** 正本の商品名 → 作った商品名 */
  name: (canonical: string) => string;
  csvPath: string;
  csvFile: string;
};
const caseData = new Map<string, M0422CaseData>();
export function m0422Case(caseNo: string): M0422CaseData {
  const d = caseData.get(caseNo);
  if (!d) throw new Error(`ケース ${caseNo} のシードをまだ作っていない`);
  return d;
}

/** 文字Aを255文字連結した商品コード（013）。先頭に文字Aを6つ、実行の印、残りを文字Aで埋める */
const longA = () => `AAAAAA${RUN_MARK}${"A".repeat(255 - 6 - RUN_MARK.length)}`;

/** 状態・属性の文から、〔商品ID-…〕〔商品規格ID-…〕〔在庫ID-…〕が指す商品・在庫を割り出して控える */
function bindLabels(seedId: string, notes: Notes, codes: Map<string, string>, stores: Record<Side, M0423Store>, alias: { A: Side; B: Side }): void {
  const seed = getSeed(seedId);
  const state = seed["状態・属性"];
  const promised = Notes.labelsIn(state + seed.投入方法).filter((l) => !l.includes("…"));
  const bound = new Set<string>();
  const bind = (label: string, value: string) => { notes.set(label, value); bound.add(label); };
  const actual = (canon: string): string => {
    const a = codes.get(canon);
    if (!a) throw new Error(`${seedId}: 商品コード「${canon}」が作る商品に無い（${[...codes.keys()].join("、")}）`);
    return a;
  };
  const storeOf = (letter: string) => stores[alias[letter === "店舗A" ? "A" : "B"]];
  // 状態・属性の文の順に読む: 商品ID・商品規格IDの呼び名は、そのあとの「商品コード=」の商品のもの
  const re = /〔(商品ID-[^〕]+)〕|〔(商品規格ID-[^〕]+)〕|商品コード=([^／・]+)|(店舗[AB])・(EC-CUBE|スマレジ)在庫\d+の在庫IDは[^〔]*〔(在庫ID-[^〕]+)〕/g;
  let pendingProd: string | null = null;
  let pendingClass: string | null = null;
  let current: string | null = null;
  for (const m of state.matchAll(re)) {
    if (m[1]) pendingProd = `〔${m[1]}〕`;
    else if (m[2]) pendingClass = `〔${m[2]}〕`;
    else if (m[3]) {
      current = m[3].trim();
      if (codes.has(current)) {
        const ids = 商品の番号(actual(current));
        if (pendingProd) bind(pendingProd, ids.商品ID);
        if (pendingClass) bind(pendingClass, ids.商品規格ID);
      }
      pendingProd = null; pendingClass = null;
    } else if (m[6] && current) {
      bind(`〔${m[6]}〕`, 在庫の番号(actual(current), storeOf(m[4]).id, m[5] as Zone));
    }
  }
  // 呼び名に商品コードと店舗・在庫区分が書いてある形（044 以降）
  for (const label of promised.filter((l) => !bound.has(l))) {
    let m = /^〔在庫ID-M0422-(.+)-(店舗[AB])・(EC-CUBE|スマレジ)〕$/.exec(label);
    if (m) { bind(label, 在庫の番号(actual(`M0422-${m[1]}`), storeOf(m[2]).id, m[3] as Zone)); continue; }
    m = /^〔商品ID-M0422-(.+)〕$/.exec(label);
    if (m && codes.has(`M0422-${m[1]}`)) { bind(label, 商品の番号(actual(`M0422-${m[1]}`)).商品ID); continue; }
    m = /^〔商品規格ID-M0422-(.+)〕$/.exec(label);
    if (m && codes.has(`M0422-${m[1]}`)) { bind(label, 商品の番号(actual(`M0422-${m[1]}`)).商品規格ID); continue; }
  }
  const missing = promised.filter((l) => !notes.has(l));
  if (missing.length) throw new Error(`${seedId}: シード表の呼び名を控えられない: ${missing.join("、")}`);
}

function defineCaseSeed(seedId: string, spec: CaseSpec): void {
  defineSeed(seedId, { needs: ["S-M04-23-MASTER", ...(spec.needs ?? [])] }, async ({ browser, notes }) => {
    const issue = issueOf(seedId);
    const m = m0423Master();
    const stores: Record<Side, M0423Store> = { A: m.A, B: m.B };
    const alias = spec.alias ?? { A: "A", B: "B" };
    const at = stores[spec.at ?? "A"];
    const products = spec.products ?? [];
    const codes = new Map(products.map((p) => [p.code, p.actual ?? rc(p.code)]));
    const nameOf = (p: Prod) => rc(p.name ?? "移動商品1");
    const names = new Map(products.map((p) => [p.name ?? "移動商品1", nameOf(p)]));
    if (products.length) {
      issue(`店舗は共有の「${m.A.店名}」（店舗ID ${m.A.id}）・「${m.B.店名}」（店舗ID ${m.B.id}）に読み替えた。在庫は「${at.店名}」に入れた`);
      issue(`商品コードは ${[...codes].map(([c, a]) => `${c.length > 20 ? `${c.slice(0, 8)}…` : c}→${a.length > 40 ? `${a.slice(0, 16)}…（${a.length}文字）` : a}`).join("・")} で作った（実行の印を付けた）`);
      issue("在庫の入庫は、正本の在庫編集（入庫/その他）を、在庫検索一覧の在庫編集と在庫編集承認一覧の承認で行った");
    }
    if (spec.csv.file) issue("同名CSV取込履歴=0件は、取込履歴を消す画面もDBの書き込みも使わないので確かめない（ケースは取込履歴を確かめない）");
    for (const n of spec.notes ?? []) issue(n);

    if (products.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        const categoryId = await readSupplyGoodsCategoryId(page);
        await uploadGoodsLines(page, {
          what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: issue,
          lines: products.map((p) => {
            const base = p.base ?? "1000";
            return { 商品コード: codes.get(p.code)!, 商品名: nameOf(p), 基準価格: base, 販売価格: base, 買取価格: spec.buy ?? String(Math.min(100, Number(base))) };
          }),
        });
      });
    }
    for (const p of products) {
      const code = codes.get(p.code)!;
      if (p.ec) await stockIn(browser, issue, { 店名: at.店名, code, zone: "EC-CUBE", qty: p.ec, unit: spec.unit ?? 0, reason: spec.reason, reg: spec.reg, app: spec.app });
      if (p.sm) await stockIn(browser, issue, { 店名: at.店名, code, zone: "スマレジ", qty: p.sm, unit: spec.unit ?? 0, reason: spec.reason, reg: spec.reg, app: spec.app });
      if (p.db) {
        const [zone, qty] = p.db;
        const n = 印つき商品の在庫数を書き換える(code, at.id, zone === "EC-CUBE" ? 1 : 2, qty, RUN_MARK, `${seedId}: ${code} の${zone}在庫数を ${qty} にする（画面で指定できない値）`);
        if (n !== 1) throw new Error(`${code} の${zone}在庫の書き換えが ${n} 行`);
        issue(`DBで在庫数を${qty}に設定した（${code}・${at.店名}・${zone}。正本の在庫数は画面の在庫編集で入れられない大きさ。実行の印つきの商品の在庫の行だけを書き換えた）`);
        await withAdminSession(browser, (spec.reg ?? REGISTRANT).account, async (page) => {
          const list = await searchStockByCode(page, { 商品コード: code, 店舗: at.店名, 在庫区分: zone });
          expect(await stockInRow(list.row(code, at.店名, zone)), `${code} の ${at.店名}・${zone} の在庫は ${qty}`).toBe(qty);
        });
      }
    }
    // 正本のファイル名で、UTF-8 のCSVを作る
    const csvPath = test.info().outputPath(spec.csv.file);
    const cell = (v: string) => codes.get(v) ?? v;
    const text = spec.csv.raw ?? [...(spec.csv.head ? [spec.csv.head.join(",")] : []), ...(spec.csv.rows ?? []).map((r) => r.map(cell).join(","))].join("\n") + "\n";
    fs.writeFileSync(csvPath, text, "utf8");
    caseData.set(spec.caseNo, {
      A: m.A, B: m.B, csvPath, csvFile: spec.csv.file,
      code: (c) => codes.get(c) ?? c,
      name: (n) => names.get(n) ?? n,
    });
    bindLabels(seedId, notes, codes, stores, alias);
  });
}

const MOVE_HEAD = ["商品コード", "移動点数"];
const XFER_HEAD = ["振替元商品コード", "振替先商品コード", "移動点数"];
const one = (file: string, code: string, qty: string) => ({ file, head: MOVE_HEAD, rows: [[code, qty]] });
const P = (code: string, ec = 100): Prod => ({ code, ec });
/** 在庫振替のケース: 承認者は 試験店舗B 所属なので、在庫を入れる店舗・「店舗A」の役は 試験店舗B */
const XFER = { at: "B" as Side, alias: { A: "B" as Side, B: "A" as Side }, needs: ["S-M04-22-APPROVERS"] };

// ---- 在庫移動: 正常 ----
defineCaseSeed("S-M04-22-MOVE-003", { caseNo: "003", products: [P("MOVE-001-003")], csv: one("move-normal-003.csv", "MOVE-001-003", "10") });
defineCaseSeed("S-M04-22-MOVE-004", { caseNo: "004", products: [P("MOVE-001-004")], csv: one("move-normal-004.csv", "MOVE-001-004", "10") });
defineCaseSeed("S-M04-22-MOVE-005", { caseNo: "005", products: [P("MOVE-001-005")], csv: one("move-normal-005.csv", "MOVE-001-005", "10") });
defineCaseSeed("S-M04-22-MOVE-006", { caseNo: "006", products: [P("MOVE-001-006")], csv: one("move-normal-006.csv", "MOVE-001-006", "10") });
defineCaseSeed("S-M04-22-MOVE-007", { caseNo: "007", products: [P("MOVE-001-007")], csv: one("move-normal-007.csv", "MOVE-001-007", "10") });
defineCaseSeed("S-M04-22-MOVE-008", { caseNo: "008", products: [{ code: "MOVE-001-008", ec: 100, sm: 50 }], csv: one("move-internal-008.csv", "MOVE-001-008", "5") });
// ---- 在庫移動: 誤り ----
defineCaseSeed("S-M04-22-MOVE-009", { caseNo: "009", products: [P("MOVE-001-009")], csv: one("move-normal-009.csv", "MOVE-001-009", "10") });
defineCaseSeed("S-M04-22-MOVE-010", { caseNo: "010", products: [P("MOVE-001-010")], csv: one("move-insufficient-010.csv", "MOVE-001-010", "101") });
// ---- 限界値 ----
const CODE255 = "文字Aを255文字連結した値";
defineCaseSeed("S-M04-22-MOVE-CODE255-013", {
  caseNo: "013", products: [{ code: CODE255, actual: longA(), name: "最大長商品", base: "3000", ec: 10 }],
  csv: one("move-code255-013.csv", CODE255, "1"),
  notes: ["商品コード「文字Aを255文字連結した値」は、先頭に文字Aを6つ、実行の印、残りを文字Aで埋めて255文字にした（ほかの実行の商品と重ならないため）"],
});
defineCaseSeed("S-M04-22-MOVE-015", { caseNo: "015", products: [P("MOVE-001-015")], csv: one("move-qty0-015.csv", "MOVE-001-015", "0") });
defineCaseSeed("S-M04-22-MOVE-MAX-016", {
  caseNo: "016", products: [{ code: "MOVE-MAX-001-016", name: "移動上限商品", base: "1", db: ["EC-CUBE", 999999999] }],
  csv: one("move-qty-max-016.csv", "MOVE-MAX-001-016", "999999999"),
});
// ---- 見出し違い・権限 ----
defineCaseSeed("S-M04-22-MOVE-020", { caseNo: "020", csv: { file: "move-wrong-header-020.csv", head: ["商品コード", "振替点数"], rows: [] } });
defineCaseSeed("S-M04-22-MOVE-023", { caseNo: "023", products: [P("MOVE-001-023")], csv: one("move-normal-023.csv", "MOVE-001-023", "10") });
defineCaseSeed("S-M04-22-TRANSFER-ERROR-029", { caseNo: "029", ...XFER, csv: { file: "transfer.txt", raw: "x" } });
defineCaseSeed("S-M04-22-TRANSFER-ERROR-030", { caseNo: "030", ...XFER, csv: { file: "transfer-wrong-header-030.csv", head: ["商品コード", "数量"], rows: [["TRANSFER-001", "1"]] } });
defineCaseSeed("S-M04-22-HDRMOVE-037", {
  caseNo: "037", products: [{ code: "M0422-037-A", ec: 100 }],
  csv: { file: "M0422-037-HDR.csv", head: ["商品コード", "振替点数"], rows: [["M0422-037-A", "10"]] },
});
defineCaseSeed("S-M04-22-XFERPERM-040", {
  caseNo: "040", ...XFER, products: [{ code: "M0422-040-A", ec: 100 }, { code: "M0422-040-B" }],
  csv: { file: "M0422-040-XFER.csv", head: XFER_HEAD, rows: [["M0422-040-A", "M0422-040-B", "10"]] },
});
defineCaseSeed("S-M04-22-HDRXFER-041", {
  caseNo: "041", ...XFER, products: [{ code: "M0422-041-A", ec: 100 }, { code: "M0422-041-B" }],
  csv: { file: "M0422-041-HDR.csv", head: ["振替元商品コード", "振替先商品コード", "数量"], rows: [["M0422-041-A", "M0422-041-B", "5"]] },
});
// ---- 複数行・全数・在庫区分 ----
defineCaseSeed("S-M04-22-MOVE-044", {
  caseNo: "044", products: [P("M0422-044-A"), P("M0422-044-B")],
  csv: { file: "move-two-m0422-044.csv", head: MOVE_HEAD, rows: [["M0422-044-A", "10"], ["M0422-044-B", "20"]] },
});
defineCaseSeed("S-M04-22-MOVE-045", { caseNo: "045", products: [P("M0422-045-A")], csv: one("move-all-m0422-045.csv", "M0422-045-A", "100") });
defineCaseSeed("S-M04-22-MOVE-046", { caseNo: "046", products: [{ code: "M0422-046-A", ec: 100, sm: 50 }], csv: one("move-smaregi-m0422-046.csv", "M0422-046-A", "5") });
defineCaseSeed("S-M04-22-CBMVSM-049", { caseNo: "049", products: [{ code: "M0422-CB049-A", ec: 100, sm: 50 }], csv: one("m0422-cb049-move.csv", "M0422-CB049-A", "5") });
defineCaseSeed("S-M04-22-CBMVSM2-050", { caseNo: "050", products: [{ code: "M0422-CB050-A", ec: 100, sm: 50 }], csv: one("m0422-cb050-move.csv", "M0422-CB050-A", "5") });
defineCaseSeed("S-M04-22-CBXFER1-051", {
  caseNo: "051", ...XFER, products: [P("M0422-CB051-A"), { code: "M0422-CB051-B" }],
  csv: { file: "m0422-cb051-xfer.csv", head: XFER_HEAD, rows: [["M0422-CB051-A", "M0422-CB051-B", "10"]] },
});
defineCaseSeed("S-M04-22-CBXFER2-052", {
  caseNo: "052", ...XFER, products: [P("M0422-CB052-A"), { code: "M0422-CB052-B" }, { code: "M0422-CB052-C" }],
  csv: { file: "m0422-cb052-xfer.csv", head: XFER_HEAD, rows: [["M0422-CB052-A", "M0422-CB052-B", "10"], ["M0422-CB052-A", "M0422-CB052-C", "20"]] },
});
defineCaseSeed("S-M04-22-CBXFER3-053", {
  caseNo: "053", ...XFER, products: [{ code: "M0422-CB053-A", ec: 100, sm: 80 }, { code: "M0422-CB053-B" }],
  csv: { file: "m0422-cb053-xfer.csv", head: XFER_HEAD, rows: [["M0422-CB053-A", "M0422-CB053-B", "10"]] },
});
defineCaseSeed("S-M04-22-CBXFER4-054", {
  caseNo: "054", ...XFER, products: [{ code: "M0422-CB054-A", ec: 100, sm: 80 }, { code: "M0422-CB054-B" }, { code: "M0422-CB054-C" }],
  csv: { file: "m0422-cb054-xfer.csv", head: XFER_HEAD, rows: [["M0422-CB054-A", "M0422-CB054-B", "10"], ["M0422-CB054-A", "M0422-CB054-C", "20"]] },
});

// ================================================================ 他機能への反映（RD-*）

defineSeed("S-M04-22-RD-STORES", { needs: ["S-M04-23-MASTER"] }, async ({ seed }) => {
  const m = m0422Master();
  reportSeedIssue(seed.シードID, `M04-22 RD店舗A・M04-22 RD店舗B は ${m.A.店名}（店舗ID ${m.A.id}）・${m.B.店名}（店舗ID ${m.B.id}）に読み替えた（店舗を新たに作らない）。M04-22 RD所属A は所属のマスタの既存の「${m.所属A}」に読み替えた（所属のマスタに行を足さない。所属の店舗のDBでの設定は行わない）`);
});

async function ensureRdMember(browser: Browser, seedId: string, who: Actor, email: string, 権限: string): Promise<void> {
  const m = m0422Master();
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberWithDept(page, {
    名前: who.名前, ログインID: who.account.loginId, メールアドレス: email, パスワード: who.account.password, 権限,
    所属店舗ID: m.A.id, 所属: m.所属A, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id, m.B.id],
  }));
  await withAdminSession(browser, who.account, async () => undefined);
  reportSeedIssue(seedId, `権限グループは「${権限}」（${権限 === "システム管理者" ? "承認権限あり" : "権限管理で承認権限のチェックが外れている既存の権限"}）。編集可能店舗は ${m.A.店名}・${m.B.店名}`);
}
defineSeed("S-M04-22-RD-OP", { needs: ["S-M04-22-RD-STORES"] }, async ({ browser, seed }) => {
  await ensureRdMember(browser, seed.シードID, RD_OP, "m0422rd-op@example.test", m0423Master().承認権限なしの権限);
});
defineSeed("S-M04-22-RD-APR", { needs: ["S-M04-22-RD-STORES"] }, async ({ browser, seed }) => {
  await ensureRdMember(browser, seed.シードID, RD_APR, "m0422rd-apr@example.test", "システム管理者");
});
const rdSpec = (n: string, caseNo: string): CaseSpec => ({
  caseNo, unit: 100, buy: "100", reg: RD_OP, app: RD_APR, reason: "M04-22 RD結合テスト", needs: ["S-M04-22-RD-OP", "S-M04-22-RD-APR"],
  products: [{ code: `M0422RD-${n}`, name: `M04-22 RD移動商品${n}`, ec: 10 }],
  csv: { file: `rd-move-${n}.csv`, head: MOVE_HEAD, rows: [[`M0422RD-${n}`, "3"]] },
  notes: ["商品コード・商品名は、ほかの実行の行と見分けるため、正本の値の末尾に実行の印を付けた"],
});
defineCaseSeed("S-M04-22-RD-STOCK-047", rdSpec("001", "047"));
defineCaseSeed("S-M04-22-RD-STOCK-048", rdSpec("002", "048"));
