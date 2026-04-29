import React from 'react';

const BackgroundOrbs = ({ className = "" }) => {
    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`} aria-hidden="true">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(165,180,252,0.03),transparent_50%)]" />
            
            {/* Animated Orbs */}
            <div className="absolute -top-[10%] -left-[10%] w-[45%] aspect-square rounded-full bg-primary-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-[20%] -right-[5%] w-[35%] aspect-square rounded-full bg-indigo-400/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
            <div className="absolute -bottom-[10%] left-[15%] w-[40%] aspect-square rounded-full bg-violet-400/5 blur-[110px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            
            {/* Subtle Grid - very faint for premium feel */}
            <div className="absolute inset-0 opacity-[0.015]" 
                 style={{ 
                     backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
                     backgroundSize: '40px 40px' 
                 }} 
            />
        </div>
    );
};

export default BackgroundOrbs;
