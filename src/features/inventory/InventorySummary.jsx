import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

// Register for Pie charts
ChartJS.register(ArcElement, Tooltip, Legend);


const InventorySummary = ({ inventory }) => {
  const totalProducts = inventory.length;
  const totalInStock = inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
  const lowStockCount = inventory.filter(item => Number(item.quantity) > 0 && Number(item.quantity) < Number(item.minStock)).length;
  const outOfStockCount = inventory.filter(item => Number(item.quantity) === 0).length;

  const chartData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        label: "Inventory",
        data: [
          totalInStock - lowStockCount - outOfStockCount,
          lowStockCount,
          outOfStockCount,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444"],
        borderColor: ["#16a34a", "#ca8a04", "#b91c1c"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-lg font-bold">{totalProducts}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-lg font-bold">{totalInStock}</div>
          <div className="text-sm text-gray-600">Total In Stock</div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-lg font-bold">{lowStockCount}</div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
        <div className="bg-red-50 rounded-xl shadow p-4 flex flex-col items-center">
          <div className="text-lg font-bold">{outOfStockCount}</div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>
      <div className="max-w-sm mx-auto mb-6">
        <Pie data={chartData} />
      </div>
    </>
  );
};

export default InventorySummary;
