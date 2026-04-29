import { logoUrl } from '../../utils/assets';

const AuthShowcase = ({ title, accent, description, stats = [] }) => {
    const statsGridClass = stats.length > 3 ? 'grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3';

    return (
        <section className="auth-brand-panel">
            <div className="auth-brand-backdrop" aria-hidden="true">
                <div className="auth-brand-grid" />
                <div className="auth-orb auth-orb-one" />
                <div className="auth-orb auth-orb-two" />
                <div className="auth-orb auth-orb-three" />
                <div className="auth-orb auth-orb-four" />
            </div>

            <div className="relative z-10 flex h-full w-full max-w-3xl flex-col justify-between gap-12 px-10 py-12 xl:px-16 xl:py-16">
                <div className="space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg shadow-white/5"
                             style={{
                                 backdropFilter: 'blur(8px)',
                                 WebkitBackdropFilter: 'blur(8px)',
                             }}>
                            <img src={logoUrl} alt="ERP logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-200/80">
                                Enterprise Workspace
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">ERP System</h1>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="auth-headline">
                            {title}
                            <br />
                            <span className="text-primary-300">{accent}</span>
                        </h2>
                        <p className="auth-copy">{description}</p>
                    </div>
                </div>

                {stats.length > 0 && (
                    <div className={`grid gap-4 ${statsGridClass}`}>
                        {stats.map((stat) => (
                            <div key={stat.label} className="auth-stat">
                                <p className="auth-stat-value">{stat.value}</p>
                                <p className="auth-stat-label">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AuthShowcase;
