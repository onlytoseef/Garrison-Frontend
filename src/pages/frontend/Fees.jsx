import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FaFileExcel,
  FaSearch,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaEye,
  FaTimes,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import {
  fetchFees,
  fetchStudentFees,
  clearDues,
  clearSelectedFees,
} from "../../store/slices/feeSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import ImportFeesModal from "../components/ImportFeesModal";

/**
 * Fee overview: what each student has paid and what they still owe.
 *
 * Both numbers come from the office's Excel uploads — nothing on this page
 * calculates a balance, and nothing here records a payment. That is why the
 * only actions are the two imports and a clear.
 */

const money = (n) => Number(n || 0).toLocaleString();


const SkeletonTable = () => (
  <div className="glass-card overflow-hidden border border-gray-100">
    <div className="h-12 bg-gray-200 animate-pulse" />
    {[...Array(8)].map((_, i) => (
      <div key={i} className="h-14 border-t border-gray-100 bg-gray-50 animate-pulse" />
    ))}
  </div>
);

const Fees = () => {
  const dispatch = useDispatch();
  const { students, pagination, summary, status, selected, detailStatus } =
    useSelector((state) => state.fees);
  const { classes } = useSelector((state) => state.classes);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [importKind, setImportKind] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = () =>
    dispatch(
      fetchFees({
        page: currentPage,
        limit: 50,
        search: appliedSearch,
        classId: filterClass,
      })
    );

  useEffect(() => {
    load();
  }, [dispatch, currentPage, appliedSearch, filterClass]);

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleSearch = () => {
    if (searchTerm !== appliedSearch) {
      setAppliedSearch(searchTerm);
      setCurrentPage(1);
    }
  };

  const openDetail = (id) => {
    setDetailOpen(true);
    dispatch(fetchStudentFees(id));
  };

  const closeDetail = () => {
    setDetailOpen(false);
    dispatch(clearSelectedFees());
  };

  const handleClearDues = async () => {
    setClearing(true);
    try {
      const res = await dispatch(clearDues()).unwrap();
      toast.success(`Cleared ${res.removed} balance record(s)`);
      setConfirmClear(false);
      load();
    } catch (err) {
      toast.error(err?.message || "Could not clear dues");
    } finally {
      setClearing(false);
    }
  };

  const stats = [
    {
      label: "Collected",
      value: `Rs ${money(summary.totalPaid)}`,
      icon: <FaMoneyBillWave />,
      gradient: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
    },
    {
      label: "Outstanding",
      value: `Rs ${money(summary.totalOutstanding)}`,
      icon: <FaExclamationCircle />,
      gradient: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
    },
    {
      label: "Students with dues",
      value: summary.studentsWithDues || 0,
      icon: <FaUsers />,
      gradient: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-5">
          <div
            className="p-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
            }}
          >
            <FaMoneyBillWave className="text-white text-xl" />
          </div>
          Fees
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-5 flex items-center gap-4">
              <div
                className="p-3 rounded-xl text-white text-lg"
                style={{ background: s.gradient }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The date the balances were last uploaded. Without it a stale figure
            reads as today's truth — and a student who cleared their fees drops
            out of the client's export, so their row can go stale silently. */}
        {summary.duesAsOf && (
          <p className="text-xs text-gray-500 mb-4">
            Outstanding balances as of {summary.duesAsOf}
          </p>
        )}

        <div className="glass-card p-4 mb-5 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
              onClick={handleSearch}
            />
            <input
              type="text"
              placeholder="Search by name or student ID... (Press Enter)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.grade} - {c.section}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setImportKind("payments")}
              title="Import the Payment Detail spreadsheet"
              className="flex items-center justify-center bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
            >
              <FaFileExcel className="mr-2 text-green-600" />
              Payments
            </button>
            <button
              onClick={() => setImportKind("dues")}
              title="Import the Dues List spreadsheet"
              className="flex items-center justify-center bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
            >
              <FaFileExcel className="mr-2 text-red-500" />
              Dues
            </button>
            <button
              onClick={() => setConfirmClear(true)}
              title="Remove every outstanding balance in this campus"
              className="flex items-center justify-center px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-white"
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
              }}
            >
              <FaTrash />
            </button>
          </div>
        </div>

        {status === "loading" ? (
          <SkeletonTable />
        ) : (
          <div className="glass-card overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
                  }}
                  className="text-white"
                >
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Class</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Last payment</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Outstanding</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <FaMoneyBillWave className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p>No fee data yet. Import the Payment Detail and Dues List files to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    students.map((s, index) => (
                      <tr
                        key={s._id}
                        className={`${
                          index % 2 === 0 ? "bg-white/40" : "bg-white/20"
                        } hover:bg-green-100/40 transition-all duration-200`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-medium text-gray-800">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.studentId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {s.classId?.grade} - {s.classId?.section}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">
                          {money(s.paid)}
                          {s.paymentCount > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({s.paymentCount})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {s.lastPaidOn || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          {Number(s.outstanding) > 0 ? (
                            <span
                              className="px-3 py-1.5 rounded-full font-semibold text-white text-xs"
                              style={{
                                background:
                                  "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                              }}
                            >
                              {money(s.outstanding)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetail(s._id)}
                            title="View payment history"
                            className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                            }}
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="glass-card px-6 py-4 mt-5 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pagination.pages} ({pagination.total} students)
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.pages, p + 1))
              }
              disabled={currentPage === pagination.pages}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {importKind && (
        <ImportFeesModal
          kind={importKind}
          onClose={() => setImportKind(null)}
          onImported={load}
        />
      )}

      {/* ---------- payment history ---------- */}
      {detailOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div
              className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
              }}
            >
              <div>
                <h2 className="text-lg font-bold">
                  {selected?.student?.name || "Payment history"}
                </h2>
                {selected?.student && (
                  <p className="text-white/70 text-sm">
                    {selected.student.studentId} ·{" "}
                    {selected.student.classId?.grade} -{" "}
                    {selected.student.classId?.section}
                  </p>
                )}
              </div>
              <button
                onClick={closeDetail}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailStatus === "loading" ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : selected ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="text-lg font-bold text-gray-800">
                        Rs {money(selected.totalPaid)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className="text-lg font-bold text-gray-800">
                        Rs {money(selected.dues?.totalOutstanding)}
                      </p>
                    </div>
                  </div>

                  {selected.dues?.asOf && (
                    <p className="text-xs text-gray-500 mb-4">
                      Balance as of {selected.dues.asOf}
                      {selected.dues.voucherNumber &&
                        ` · voucher ${selected.dues.voucherNumber}`}
                    </p>
                  )}

                  {selected.payments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No payments recorded for this student.
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
                        {selected.payments.map((p) => (
                          <tr key={p._id} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-700">{p.paidOn}</td>
                            <td className="px-4 py-2 text-right text-gray-800 font-medium">
                              {money(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">
                  Could not load this student's fee history.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- clear dues ---------- */}
      {confirmClear && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Clear all outstanding balances?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This removes every balance record in this campus. Payment history
              is not touched.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Use this before importing a fresh Dues List: a student who has
              cleared their fees drops out of that file, and a file that never
              mentions them cannot replace their old balance.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDues}
                disabled={clearing}
                className="px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                }}
              >
                {clearing ? "Clearing..." : "Clear balances"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
