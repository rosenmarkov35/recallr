import { Flame } from "lucide-react";

const getGlobalStreak = (activityData: Record<string, number>) => {
  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    if (activityData[dateStr] > 0) {
      streak++;
    } else {
      // Allow streak to persist if user hasn't studied YET today
      if (i > 0) break;
    }
  }
  return streak;
};

export default function NavbarStreak({ activityData }: { activityData: any }) {
  const streak = getGlobalStreak(activityData || {});

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-default group">
      <div className="relative">
        <Flame
          size={16}
          className={`${streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"} transition-all group-hover:scale-110`}
        />
        {streak > 0 && (
          <div className="absolute inset-0 bg-orange-500 blur-sm opacity-40 animate-pulse" />
        )}
      </div>
      <span
        className={`text-xs font-black tracking-tight ${streak > 0 ? "text-white" : "text-muted-foreground"}`}
      >
        {streak}
      </span>
    </div>
  );
}
