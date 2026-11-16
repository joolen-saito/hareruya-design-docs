/**
 * 店舗一覧・店舗登録（pages/admin/tenant.ts）の、栗野担当の機能向けの版。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」。lib/store_create_ban.ts）。
 * 共通の部品 tenant.ts（齋藤さんの機能も使う）は変えずに、ここで包む。
 * - createTenant: 必ず止める（店舗登録画面を開かない）。
 * - ensureTenant・ensureFixedTenant: 店舗一覧に同じ店名の店舗があれば使い、無ければ作らずに止める。
 */
import { Page } from "@playwright/test";
import { 店舗の作成は禁止 } from "../../lib/store_create_ban";
import { findTenantId, TenantInput } from "./tenant";

export { findTenantId };
export type { TenantInput };

export async function createTenant(_page: Page, v: TenantInput): Promise<void> {
  店舗の作成は禁止(`pages/admin/tenant_k.ts の createTenant（店舗「${v.店名}」）`);
}

/** 店舗一覧に同じ店名の店舗があれば、その店舗IDを返す。無ければ作らずに止める */
export async function ensureTenant(page: Page, v: TenantInput, _onIssue: (message: string) => void): Promise<string> {
  const id = await findTenantId(page, v.店名);
  if (!id) 店舗の作成は禁止(`pages/admin/tenant_k.ts の ensureTenant（店舗「${v.店名}」）`);
  return id;
}

/** 決まった名前の試験用の店舗を使い回す。無ければ作らずに止める */
export async function ensureFixedTenant(page: Page, v: TenantInput, onIssue: (message: string) => void, _略称候補?: (i: number) => string): Promise<string> {
  const id = await findTenantId(page, v.店名);
  if (!id) 店舗の作成は禁止(`pages/admin/tenant_k.ts の ensureFixedTenant（店舗「${v.店名}」）`);
  onIssue(`試験用の店舗は、決まった名前の店舗「${v.店名}」（店舗ID ${id}）を前の回に作ったものを使い回して使った（店舗は作らない。依頼者 2026-11-15）`);
  return id;
}
