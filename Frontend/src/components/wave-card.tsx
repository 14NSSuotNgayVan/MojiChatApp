import { MojiLogo } from '@/components/brand/moji-logo';

export const WaveCard = () => {
  return (
    <div className="e-card playing">
      <div className="image"></div>

      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>

      <div className="text-center font-semibold text-2xl absolute top-1/3 left-0 right-0 -translate-y-1/2">
        <MojiLogo size="lg" className="my-8" />
        <h2 className="text-5xl mb-3 text-primary">Moji</h2>
        <div className="text-center w-full text-muted-foreground text-sm font-light">
          By @Vananhdamm
        </div>
      </div>
    </div>
  );
};
