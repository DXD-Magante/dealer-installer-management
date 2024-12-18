import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/AdminDashboard.css";

const AdminDashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchAdminData = async () => {
        try {
          // Fetch Quotations
          const quotationsSnapshot = await getDocs(collection(db, "quotations"));
          setQuotations(quotationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Fetch Orders
          const ordersSnapshot = await getDocs(collection(db, "orders"));
          setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Fetch Dealers
          const dealersSnapshot = await getDocs(collection(db, "dealers"));
          setDealers(dealersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Fetch Installers
          const installersSnapshot = await getDocs(collection(db, "installers"));
          setInstallers(installersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Generate Reports
          const reportData = {
            totalOrders: ordersSnapshot.docs.length,
            completedOrders: ordersSnapshot.docs.filter(doc => doc.data().status === "Completed").length,
            pendingOrders: ordersSnapshot.docs.filter(doc => doc.data().status === "Pending").length,
            approvedOrders: ordersSnapshot.docs.filter(doc => doc.data().status === "Approved").length,
            dealerCommissions: {
              paid: dealersSnapshot.docs.reduce((sum, dealer) => sum + (dealer.data().commissionPaid || 0), 0),
              pending: dealersSnapshot.docs.reduce((sum, dealer) => sum + (dealer.data().commissionPending || 0), 0),
            },
            installerPerformance: {
              completedProjects: installersSnapshot.docs.reduce(
                (sum, installer) => sum + (installer.data().completedProjects || 0),
                0
              ),
              issues: installersSnapshot.docs.reduce(
                (sum, installer) => sum + (installer.data().issues || 0),
                0
              ),
            },
          };
          setReports(reportData);
        } catch (err) {
          console.error("Error fetching admin data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchAdminData();
    }
  }, [navigate]);

 

  const handleApproveInstaller = async (installerId) => {
    try {
      await updateDoc(doc(db, "installers", installerId), { status: "Approved" });
      setInstallers(prev => prev.map(installer =>
        installer.id === installerId ? { ...installer, status: "Approved" } : installer
      ));
    } catch (err) {
      console.error("Error approving installer:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          {/* Quotation and Order Management */}
          <div className="dashboard-section">
            <h3>Quotations and Orders</h3>
            <div>
              <h4>Quotations</h4>
              {quotations.length > 0 ? (
                quotations.map(quotation => (
                  <div key={quotation.id}>
                    <p><strong>Quotation ID:</strong> {quotation.id}</p>
                    <p><strong>Status:</strong> {quotation.status}</p>
                  </div>
                ))
              ) : (
                <p>No quotations found.</p>
              )}

              <h4>Orders</h4>
              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id}>
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                  </div>
                ))
              ) : (
                <p>No orders found.</p>
              )}
            </div>
          </div>

          {/* Dealer Management */}
          <div className="dashboard-section">
            <h3>Dealer Management</h3>
            {dealers.length > 0 ? (
              dealers.map(dealer => (
                <div key={dealer.id}>
                  <p><strong>Dealer Name:</strong> {dealer.name}</p>
                  <p><strong>Level:</strong> {dealer.level}</p>
                  <p><strong>Commission Paid:</strong> {dealer.commissionPaid || 0}</p>
                  <p><strong>Commission Pending:</strong> {dealer.commissionPending || 0}</p>
                </div>
              ))
            ) : (
              <p>No dealers found.</p>
            )}
          </div>

          {/* Installer Management */}
          <div className="dashboard-section">
            <h3>Installer Management</h3>
            {installers.length > 0 ? (
              installers.map(installer => (
                <div key={installer.id}>
                  <p><strong>Installer Name:</strong> {installer.name}</p>
                  <p><strong>Status:</strong> {installer.status}</p>
                  <button
                    disabled={installer.status === "Approved"}
                    onClick={() => handleApproveInstaller(installer.id)}
                  >
                    Approve
                  </button>
                </div>
              ))
            ) : (
              <p>No installers found.</p>
            )}
          </div>

          {/* Reports */}
          <div className="dashboard-section">
            <h3>Reports</h3>
            <p><strong>Total Orders:</strong> {reports.totalOrders}</p>
            <p><strong>Completed Orders:</strong> {reports.completedOrders}</p>
            <p><strong>Pending Orders:</strong> {reports.pendingOrders}</p>
            <p><strong>Approved Orders:</strong> {reports.approvedOrders}</p>
            <p><strong>Dealer Commissions (Paid):</strong> {reports.dealerCommissions.paid}</p>
            <p><strong>Dealer Commissions (Pending):</strong> {reports.dealerCommissions.pending}</p>
            <p><strong>Installer Performance (Completed Projects):</strong> {reports.installerPerformance.completedProjects}</p>
            <p><strong>Installer Performance (Issues):</strong> {reports.installerPerformance.issues}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
