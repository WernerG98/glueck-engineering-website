import { Link } from "react-router-dom";

export default function Footer() {
  const contactEmail = "info@glueckengineering.com";
  const contactLink = `mailto:${contactEmail}`;

  return (
    <footer className="mt-20 border-t border-neutral-800/80 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 py-10 text-neutral-500 sm:px-6">
        <div className="flex flex-col items-center gap-5 text-center md:grid md:grid-cols-3 md:items-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <img
              src="/logo.png"
              alt="Glück Engineering Logo"
              className="h-10 w-10 object-contain opacity-90 md:h-12 md:w-12"
            />
            <span className="text-sm text-neutral-400">© Glück Engineering</span>
          </div>

          <div className="text-center text-sm leading-relaxed">
            <div className="text-neutral-300">Inhaber M.Eng. Werner Glück</div>
            <div className="text-neutral-500">94424 Arnstorf</div>
          </div>

          <div className="flex justify-center md:justify-end">
            <a href={contactLink} className="text-sm text-neutral-400 transition hover:text-white">
              {contactEmail}
            </a>
          </div>
        </div>

        <div className="mt-8 flex justify-center border-t border-neutral-900 pt-6 md:justify-start">
          <Link to="/impressum" className="text-xs text-neutral-500 transition hover:text-white">
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
