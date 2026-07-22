import React from "react";
import { FaCalendarDay } from "react-icons/fa";
import PropTypes from "prop-types";

const DailyFeeTable = ({
  labels,
  paid,
  pending,
  title = "Daily Fee Collection Details",
}) => {
  // Calculate totals
  const totalPaid = paid.reduce((sum, amount) => sum + amount, 0);
  const totalPending = pending.reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center text-gray-500">
          <FaCalendarDay className="mr-2" />
          <span>
            {labels[0]} - {labels[labels.length - 1]}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collected (Rs.)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending (Rs.)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total (Rs.)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 bg-transparent">
            {labels.map((label, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  {paid[index].toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                  {pending[index].toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                  {(paid[index] + pending[index]).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Totals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                Rs. {totalPaid.toLocaleString()}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                Rs. {totalPending.toLocaleString()}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Rs. {(totalPaid + totalPending).toLocaleString()}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

DailyFeeTable.propTypes = {
  labels: PropTypes.array.isRequired,
  paid: PropTypes.array.isRequired,
  pending: PropTypes.array.isRequired,
  title: PropTypes.string,
};

export default DailyFeeTable;

