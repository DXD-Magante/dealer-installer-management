import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { getDoc, doc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/InstallerDashboard.css"; // Import the CSS file

const InstallerDashboard = () => {
  const [installerName, setInstallerName] = useState("");
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [projectStatusCounts, setProjectStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchInstallerData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const { name } = userDoc.data();
            setInstallerName(name);

            const projectsSnapshot = await getDocs(
              collection(db, "projects")
            );
            const projectList = projectsSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(project => project.installerId === auth.currentUser.uid);

            setProjects(projectList);

            // Calculate project status counts
            const statusCounts = projectList.reduce((counts, project) => {
              counts[project.status] = (counts[project.status] || 0) + 1;
              return counts;
            }, {});
            setProjectStatusCounts(statusCounts);

            const notificationsSnapshot = await getDocs(
              collection(db, "notifications")
            );
            const notificationsList = notificationsSnapshot.docs
              .map(doc => doc.data())
              .filter(notification => notification.userId === auth.currentUser.uid);
            setNotifications(notificationsList);
          } else {
            setError("No user data found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchInstallerData();
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      await updateDoc(doc(db, "projects", projectId), { status: newStatus });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, status: newStatus } : project
        )
      );
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  const ProjectItem = ({ project }) => (
    <div className="project-item">
      <p><strong>Project ID:</strong> {project.id}</p>
      <p><strong>Client:</strong> {project.clientName || "N/A"}</p>
      <p><strong>Details:</strong> {project.details || "N/A"}</p>
      <p><strong>Status:</strong> {project.status || "Pending"}</p>
      <div className="project-actions">
        {["Installation Started", "On-Going", "Completed", "Stuck"].map(status => (
          <button
            key={status}
            className={`status-button ${
              project.status === status ? "active" : ""
            }`}
            onClick={() => updateProjectStatus(project.id, status)}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Installer Dashboard</h1>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          <h2>Welcome, {installerName}</h2>

          {/* Projects Section */}
          <div className="dashboard-section projects-section">
            <h3>My Projects</h3>
            <div className="container">
              {projects.length > 0 ? (
                projects.map(project => (
                  <ProjectItem key={project.id} project={project} />
                ))
              ) : (
                <p>No projects assigned.</p>
              )}
            </div>
          </div>

          {/* Project Status Section */}
          <div className="dashboard-section project-status-section">
            <h3>Project Status</h3>
            <div className="status-summary">
              {Object.keys(projectStatusCounts).length > 0 ? (
                Object.entries(projectStatusCounts).map(([status, count]) => (
                  <p key={status}><strong>{status}:</strong> {count}</p>
                ))
              ) : (
                <p>No projects available to display status.</p>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className="dashboard-section reports-section">
            <h3>Reports</h3>
            <p>Total Projects: {projects.length}</p>
            <p>Completed Projects: {projectStatusCounts["Completed"] || 0}</p>
            <p>Ongoing Projects: {projectStatusCounts["On-Going"] || 0}</p>
            <p>Stuck Projects: {projectStatusCounts["Stuck"] || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerDashboard;
