import PropTypes from "prop-types";

const FinancialSummary = ({
  monthlyPaid,
  monthlyPending,
  admissionPaid,
  admissionPending,
  staffSalaryPaid,
  staffSalaryPending,
  totalStudents,
  totalStaff,
  title = "Financial Summary",
}) => {
  // Guard on the actual denominator (sum of paid + pending), not the head-count.
  // Students/staff can exist with no fees/salary generated yet, which would make
  // the denominator 0 and render "NaN%" and a broken progress bar.
  const feeDenominator =
    monthlyPaid + monthlyPending + admissionPaid + admissionPending;
  const totalCollectionRate =
    feeDenominator > 0
      ? Math.round(((monthlyPaid + admissionPaid) / feeDenominator) * 100)
      : 0;

  const salaryDenominator = staffSalaryPaid + staffSalaryPending;
  const staffSalaryCollectionRate =
    salaryDenominator > 0
      ? Math.round((staffSalaryPaid / salaryDenominator) * 100)
      : 0;

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Fee Collection Progress</h3>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">
              Collection Rate
            </span>
            <span className="text-sm font-medium text-gray-600">
              {totalCollectionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${totalCollectionRate}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-600">Total Fees Paid</p>
              <p className="text-2xl font-bold text-green-700">
                Rs. {(monthlyPaid + admissionPaid).toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600">Total Fees Pending</p>
              <p className="text-2xl font-bold text-orange-700">
                Rs. {(monthlyPending + admissionPending).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Salary Payment Progress</h3>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">
              Payment Rate
            </span>
            <span className="text-sm font-medium text-gray-600">
              {staffSalaryCollectionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${staffSalaryCollectionRate}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600">Total Salary Paid</p>
              <p className="text-2xl font-bold text-blue-700">
                Rs. {staffSalaryPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-600">Total Salary Pending</p>
              <p className="text-2xl font-bold text-amber-700">
                Rs. {staffSalaryPending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FinancialSummary.propTypes = {
  monthlyPaid: PropTypes.number.isRequired,
  monthlyPending: PropTypes.number.isRequired,
  admissionPaid: PropTypes.number.isRequired,
  admissionPending: PropTypes.number.isRequired,
  staffSalaryPaid: PropTypes.number.isRequired,
  staffSalaryPending: PropTypes.number.isRequired,
  totalStudents: PropTypes.number.isRequired,
  totalStaff: PropTypes.number.isRequired,
  title: PropTypes.string,
};

export default FinancialSummary;

