import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-6 select-none overflow-hidden font-sans">
      
      {/* Background Ambient Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Soft radial blue and cyan ambient glows */}
        <div className="absolute w-[600px] h-[500px] bg-blue-500/10 rounded-full blur-[130px] animate-splash-glow" />
        <div className="absolute w-[450px] h-[350px] bg-cyan-400/15 rounded-full blur-[100px] animate-splash-glow [animation-delay:1s]" />
      </div>

      {/* Centered Logo with Pulse Glow */}
      <div className="relative z-10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        {/* Pulse glow aura wrapping the logo */}
        <div className="absolute w-72 h-36 sm:w-96 sm:h-48 bg-gradient-to-r from-blue-500/20 via-cyan-400/30 to-blue-600/20 rounded-full blur-3xl opacity-80 animate-splash-glow pointer-events-none" />
        
        {/* Clean Full-Color Logo for White Background */}
        <img
          src="/logo.png"
          alt="WashFlow"
          className="relative z-10 h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(25,93,228,0.18)] select-none"
        />
      </div>

    </div>
  );
};
