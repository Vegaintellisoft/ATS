interface PageHeaderProps {
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageHeader({ icon, title, description, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="page-header-icon">{icon}</div>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>
        {children && <div>{children}</div>}
      </div>
    </header>
  );
}
