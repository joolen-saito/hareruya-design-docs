// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-07 デッキタグ一覧のシードの作り方（画面操作）。正本: cases/M15-07_seed_data.tsv
 *
 * シード表と違えたところ（解釈）:
 * - 試験管理者（m1507_admin）: メンバー管理で登録する。権限は「システム管理者」（デッキ管理メニューの「デッキタグ一覧」と
 *   MTGマスターデータ管理を閲覧できる。M15-04・M15-05 と同じ部品）。共有可なので、あれば内容を確かめて使う。
 */
import { defineSeed } from "./current_seed";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1507_ADMIN: Account = { loginId: "m1507_admin", password: "Passw0rd!M1507" };
