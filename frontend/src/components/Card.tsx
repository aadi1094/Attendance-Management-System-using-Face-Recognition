type CardProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export function Card({ children, title, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm ${className}`}
    >
      {title && (
        <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
