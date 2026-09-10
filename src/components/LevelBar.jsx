export default function LevelBar({ level }) {
  if (level == null) {
    return <span className="text-sm text-neutral-600">–</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-4 rounded-full ${i < level ? "bg-accent" : "bg-neutral-800"}`}
        />
      ))}
    </div>
  );
}
