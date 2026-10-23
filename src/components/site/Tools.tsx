import css from './Tools.module.css';

/** One horizontal row of tool pills that loops forever. The second copy is hidden from assistive tech. */
export function Tools({ tools }: { tools: string[] }) {
  if (!tools.length) return null;
  const group = (hidden: boolean) => (
    <ul
      className={`${css.group} ${hidden ? css.copy : ''}`}
      aria-hidden={hidden || undefined}
      style={{ margin: 0, listStyle: 'none', paddingLeft: 0 }}
    >
      {tools.map((t) => (
        <li key={t} className={css.pill}>
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <section className={css.section} aria-label="Tools">
      <div className={css.head}>
        <h2 className={css.h2} data-rv="lines">
          <span className={css.line}>
            <span className={css.lineIn} data-line="">
              Tools
            </span>
          </span>
        </h2>
      </div>
      <div className={css.marquee} data-rv="up">
        <div className={css.track}>
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  );
}
