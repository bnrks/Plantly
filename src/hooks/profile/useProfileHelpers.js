import { Colors } from "../../../constants/Colors";

export const formatJoinDate = (createdAt, t) => {
  if (!createdAt) return t("profile.member");

  const monthKeys = [
    "months.january",
    "months.february",
    "months.march",
    "months.april",
    "months.may",
    "months.june",
    "months.july",
    "months.august",
    "months.september",
    "months.october",
    "months.november",
    "months.december",
  ];

  let date;
  if (createdAt.toDate) {
    date = createdAt.toDate();
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    date = new Date(createdAt);
  }

  const month = t(monthKeys[date.getMonth()]);
  const year = date.getFullYear();

  return t("profile.memberSinceFormat", { month, year });
};

export const getRarityColor = (rarity) => {
  const map = {
    common: "#4CAF50",
    uncommon: "#7E57C2",
  };
  return map[String(rarity || "").toLowerCase()] || Colors.primary;
};

export const getBadgeIconInfo = (badgeId, rarity) => {
  const iconMap = {
    watering_master: { icon: "water", color: "#2196F3" },
    plant_lover: { icon: "leaf", color: Colors.primary },
    green_thumb: { icon: "flower", color: "#E91E63" },
    expert: { icon: "school", color: "#FF9800" },
  };
  const base = iconMap[badgeId] || { icon: "ribbon", color: Colors.primary };
  return { icon: base.icon, color: getRarityColor(rarity) };
};

export const getProgressForAchievement = (achievementProgressList, achievementId) => {
  return (
    achievementProgressList.find((p) => p.achievementId === achievementId) || {
      current: 0,
      completed: false,
    }
  );
};
