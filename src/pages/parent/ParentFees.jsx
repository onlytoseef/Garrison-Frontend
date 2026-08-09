import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { FaMoneyBillWave, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Loader from "../components/Loader";

/**
 * The parent's own fee position — what has been paid and what is still owed.
 *
 * Both figures come from the school office's spreadsheet uploads, so this page
 * only ever displays; there is nothing to pay or submit here.
 */

const money = (n) => Number(n || 0).toLocaleString();

const ParentFees = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.PARENT_FEES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const heading = (
    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
      <div
        className="p-2 rounded-xl"
        style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}
      >
        <FaMoneyBillWave className="text-white text-xl" />
      </div>
      Fees{data?.studentName ? ` — ${data.studentName}` : ""}
    </h1>
  );

  if (loading) {
    return <Loader fullscreen={false} />;
  }

  // No payments AND no balance on record means the office has not uploaded
  // anything for this student yet — which is different from "you owe nothing",
  // so it is worded as the absence of information rather than a zero balance.
  if (!data || (data.payments.length === 0 && !data.dues)) {
    return (
      <div className="p-6 min-h-screen">
        {heading}
        <div className="glass-card p-10 text-center text-gray-500">
          <FaMoneyBillWave className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-lg">No fee records available yet.</p>
          <p className="text-sm mt-1">
            Please contact the school office for your fee details.
          </p>
        </div>
      </div>
    );
  }

  const outstanding = Number(data.dues?.totalOutstanding || 0);

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {heading}

      <div className="glass-card overflow-hidden mb-5">
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
          }}
        >
          <div>
            <h3 className="text-white font-bold text-lg">Fee Summary</h3>
            <p className="text-white/70 text-sm">
              {data.studentId} · {data.className}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${
              outstanding > 0
                ? "bg-red-400/20 text-red-100"
                : "bg-green-400/20 text-green-100"
            }`}
          >
            {outstanding > 0 ? <FaExclamationCircle /> : <FaCheckCircle />}
            {outstanding > 0 ? "Dues pending" : "Cleared"}
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-lg font-bold text-gray-800">
                Rs {money(data.totalPaid)}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-lg font-bold text-gray-800">
                Rs {money(outstanding)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-500">Current Due</p>
              <p className="text-lg font-bold text-gray-800">
                Rs {money(data.dues?.dueAmount)}
              </p>
            </div>
          </div>

          {/* The date the office last uploaded balances. Without it, a figure
              from weeks ago reads as today's. */}
          {data.dues?.asOf && (
            <p className="text-xs text-gray-500 mt-4">
              Balance as of {data.dues.asOf}
              {data.dues.voucherNumber &&
                ` · voucher ${data.dues.voucherNumber}`}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div
          className="px-5 py-4"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h3 className="text-white font-bold text-lg">Payment History</h3>
        </div>

        <div className="p-5">
          {data.payments.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No payments recorded yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{p.paidOn}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      Rs {money(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2 font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-gray-800">
                    Rs {money(data.totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentFees;
