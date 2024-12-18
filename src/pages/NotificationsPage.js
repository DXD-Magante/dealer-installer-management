import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../styles/components/NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (auth.currentUser) {
        try {
          const notificationsQuery = query(
            collection(db, "notifications"),
            where("userId", "==", auth.currentUser.uid)
          );
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const notificationsList = notificationsSnapshot.docs.map(doc => doc.data());
          setNotifications(notificationsList);
        } catch (err) {
          console.error("Error fetching notifications:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
  }, []);

  if (loading) return <p>Loading notifications...</p>;

  return (
    <div className="notifications-container">
      <h1>Notifications</h1>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification.message}</li>
          ))}
        </ul>
      ) : (
        <p>No notifications at the moment.</p>
      )}
    </div>
  );
};

export default NotificationsPage;
