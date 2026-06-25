import { site } from '../config/site';

export function PageHero({ title, sub, image }: { title: string; sub?: string; image?: string }) {
  const img = image || site.hero;
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-24 text-center text-white overflow-hidden">
      <img src={`/images/${img}`} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative container-x">
        <h1 className="display text-white">{title}</h1>
        {sub && <p className="mt-3 text-white/80 uppercase tracking-[0.2em] text-xs font-sans not-italic">{sub}</p>}
      </div>
    </section>
  );
}
