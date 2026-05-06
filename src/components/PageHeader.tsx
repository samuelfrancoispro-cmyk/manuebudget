interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
