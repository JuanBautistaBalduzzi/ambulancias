import type { ScreenKey, Theme } from '../types';

type AppHeaderProps = {
  theme: Theme;
  activeScreen: ScreenKey;
  onChangeScreen: (screen: ScreenKey) => void;
  onToggleTheme: () => void;
};

const labels: Record<ScreenKey, string> = {
  carga: 'Carga',
  operador: 'Operador',
  metricas: 'Metricas',
  facturacion: 'Facturacion',
};

export function AppHeader({ theme, activeScreen, onChangeScreen, onToggleTheme }: AppHeaderProps) {
  return (
    <header className="app-header">
      <h1 className="app-title">Ambulancias</h1>

      <div className="header-actions">
        <nav className="screen-nav" aria-label="Pantallas principales">
          {Object.entries(labels).map(([key, label]) => {
            const screen = key as ScreenKey;
            return (
              <button
                key={screen}
                className={activeScreen === screen ? 'btn active' : 'btn'}
                onClick={() => onChangeScreen(screen)}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <button className="btn" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>
    </header>
  );
}
