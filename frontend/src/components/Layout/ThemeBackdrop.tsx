import { useThemeStore } from '../../store/themeStore';

const EMBERS = Array.from({ length: 22 }, (_, i) => i);

export default function ThemeBackdrop() {
  const { skin } = useThemeStore();
  return (
    <div className="backdrop" aria-hidden="true">
      {skin === 'anime' ? (
        <>
          <span className="neb a" /><span className="neb b" /><span className="neb c" />
          <div className="embers">
            {EMBERS.map(i => (
              <span
                key={i}
                className="ember"
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDuration: `${7 + (i % 9)}s`,
                  animationDelay: `${-(i % 12)}s`,
                  width: `${2 + (i % 4)}px`,
                  height: `${2 + (i % 4)}px`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="speedlines" />
      )}
    </div>
  );
}
