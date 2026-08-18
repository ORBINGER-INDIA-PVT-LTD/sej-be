import db from "../models/index.js";
async function run() {
  const q = async (s) => { const [r] = await db.sequelize.query(s); return r; };
  const [pi] = await q("SELECT id FROM ppe_inspections WHERE permit_number='P-SUP'");
  if (pi) {
    await q("DELETE FROM ppe_inspection_items WHERE ppe_inspection_employee_id IN (SELECT id FROM ppe_inspection_employees WHERE ppe_inspection_id = ?)", {replacements:[pi.id]});
    await q("DELETE FROM ppe_inspection_employees WHERE ppe_inspection_id = ?", {replacements:[pi.id]});
  }
  const [tl] = await q("SELECT id FROM tools_lists WHERE permit_number='P-SUP2'");
  if (tl) {
    await q("DELETE FROM tools_list_items WHERE tools_list_id = ?", {replacements:[tl.id]});
  }
  await q("DELETE FROM ppe_inspections WHERE permit_number IN ('P-SUP','P-SUP2')");
  await q("DELETE FROM tools_lists WHERE permit_number IN ('P-SUP','P-SUP2')");
  await q("DELETE FROM users WHERE emp_id='TEST_SUP5'");
  const [u] = await q("SELECT COUNT(*) c FROM users");
  const [r] = await q("SELECT COUNT(*) c FROM roles WHERE role_name='supervisor'");
  console.log(`users now=${u.c}, supervisor role present=${r.c===1}`);
  await db.sequelize.close();
}
run();
