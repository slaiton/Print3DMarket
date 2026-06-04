import './DashboardHeader.css';

interface Props {
  greeting: string;
  fullName?: string;
}

export default function DashboardHeader({
  greeting,
  fullName
}: Props) {

  const firstName =
    fullName?.split(' ')[0] ?? 'Usuario';

  const currentDate =
    new Date().toLocaleDateString(
      'es-CO',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );

  return (
    <div className="dashboard-hero">

      <div>

        <h1 className="hero-title">
          {greeting}, {firstName} 👋
        </h1>

        <p className="hero-subtitle">
          {currentDate}
        </p>

      </div>

      <div className="hero-right">

        <div className="hero-avatar">
          {firstName.charAt(0)}
        </div>

        <div className="hero-badge">
          Print3D Studio
        </div>

      </div>

    </div>
  );
}