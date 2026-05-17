import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function OwnerAnalytics() {
  const { id } = useParams();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadStats = async () => {
      const q = query(collection(db, "menu"), where("restaurantId", "==", id));
      const snap = await getDocs(q);

      let totalLikes = 0;
      let totalRatings = 0;

      snap.forEach(d => {
        totalLikes += d.data().likes || 0;
        totalRatings += d.data().ratingCount || 0;
      });

      setStats({
        dishes: snap.size,
        totalLikes,
        totalRatings
      });
    };
    loadStats();
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Restaurant Analytics</h2>

      <div style={{ display:"flex", gap:20 }}>
        <StatCard title="Total Dishes" value={stats.dishes} />
        <StatCard title="Total Likes" value={stats.totalLikes} />
        <StatCard title="Total Ratings" value={stats.totalRatings} />
      </div>
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div style={{ padding:20, border:"1px solid #ddd", borderRadius:8 }}>
    <h3>{title}</h3>
    <p style={{ fontSize:22 }}>{value}</p>
  </div>
);
