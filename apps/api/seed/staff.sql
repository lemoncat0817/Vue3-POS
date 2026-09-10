-- 示範帳號（P4：規劃書 §9 的身分系統），跟 apps/pos 舊版
-- stores/authorityManagement.ts 裡三個demo帳號的權限設定一一對應，方便
-- 既有的「快速登入」按鈕（見 views/login/index.vue）跟 e2e 測試接得上。
--
-- 三個系統內建權限群組（見 migrations/0020_backfill_staff_role_id.sql 的
-- role-owner／role-duty-manager／role-part-timer），全新環境直接種好，
-- 員工只需指向 role_id，不再各自帶一份 capabilities。
--
-- pin_hash／pin_salt 是離線用跟 src/auth/hash.ts 完全相同的 PBKDF2-SHA256
-- 演算法算出來的（見 scratchpad 的一次性腳本，沒有留在 repo 裡——這份
-- 種子資料本身就是輸出結果，腳本不需要保留）。PIN 明碼只在這份註解裡
-- 出現，方便你知道要輸入什麼：lemon=1234、james=2345、emily=3456。

INSERT INTO roles (id, name, capabilities, is_system) VALUES (
  'role-owner', '店長',
  '["canCompItem","canOpenCashier","canManageShift","canCheckOrder","canEditOrderStatus","canDeleteOrder","canRefundOrVoid","canCheckBackgroundSetting","canSetCategory","canSetProduct","canSetAddOns","canSetOrderCoupon","canSetQuickDiscount","canCheckDataAnalysis","canCheckAuthority","canManageStaff","canManageRoles","canSetPayMethod","canCheckMembers","canManageTables"]',
  1
);

INSERT INTO roles (id, name, capabilities, is_system) VALUES (
  'role-duty-manager', '值班經理',
  '["canCompItem","canOpenCashier","canManageShift","canCheckOrder","canEditOrderStatus","canRefundOrVoid","canCheckBackgroundSetting","canSetCategory","canSetProduct","canSetAddOns","canCheckDataAnalysis"]',
  1
);

INSERT INTO roles (id, name, capabilities, is_system) VALUES (
  'role-part-timer', '工讀生',
  '["canCheckOrder","canEditOrderStatus","canCheckBackgroundSetting"]',
  1
);

INSERT INTO staff (id, name, job_title, account, role_id, pin_hash, pin_salt) VALUES (
  'staff-lemon', 'Lemon', '店長', 'lemon', 'role-owner',
  '6a9d56b3fd4939c6492e2c16531a1f5b43260d0ac8dc89e11f8e365248d2dd0e',
  '53439827c69c581215c737ffa40ee650'
);

INSERT INTO staff (id, name, job_title, account, role_id, pin_hash, pin_salt) VALUES (
  'staff-james', 'James', '值班經理', 'james', 'role-duty-manager',
  'bce969d1e0069bb9e04670d55e7ef2a86f072296c4c0eecca3e4f8a5d1aae86d',
  '927f14e2973c6028bcefbee87f3183df'
);

INSERT INTO staff (id, name, job_title, account, role_id, pin_hash, pin_salt) VALUES (
  'staff-emily', 'Emily', '工讀生', 'emily', 'role-part-timer',
  '05f74eeda9706561763bacb25ee18de521de7b8e67c79b7ce1049604682ff27f',
  '3fae60fca5f18dc4897167a507829d51'
);
