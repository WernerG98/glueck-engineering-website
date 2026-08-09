import Reveal from "../Reveal";

export default function GallerySection({ title = "Galerie", images, onPreview }) {
  return (
    <section id="galerie" className="mt-16 sm:mt-20 md:mt-24">
      <Reveal>
        <span className="eyebrow">Beispiele</span>
        <h2 className="mb-6 mt-2 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl">{title}</h2>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <Reveal key={`${image}-${index}`} delay={(index % 3) * 100}>
            <button
              onClick={() => onPreview(image)}
              className="group aspect-square w-full overflow-hidden rounded-2xl border border-neutral-800 transition hover:border-neutral-600"
            >
              <img
                src={image}
                alt={`Galeriebild ${index + 1}`}
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
