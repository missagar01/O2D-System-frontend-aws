export const runtime = "nodejs"; // 👈 REQUIRED for Thick mode

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";

export async function GET() {
  const query = `
    select t.vrdate + interval '15' minute as planned_timestamp,
           t.order_vrno,
           t.vrno,
           lhs_utility.get_name('acc_code', t.acc_code) as party_name,
           t.truckno,
           t.driver_name,
           t.driver_mobile,
           t.driver_driving_license
      from view_gatetran_engine t
     where t.entity_code ='SR'
       and t.order_tcode = 'O'
       and (select distinct a.div_code from view_order_engine a where a.vrno = t.order_vrno) = 'PM'
       and t.Wslip_No is null
       and t.vrdate >= trunc(sysdate)
  order by t.vrdate + interval '15' minute asc
  `;

  try {
    const rows = await executeQuery(query);
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    console.error("Oracle error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Oracle DB is not available in this deployment.",
        detail: err?.message || String(err),
      },
      { status: 501 },
    );
  }
}
