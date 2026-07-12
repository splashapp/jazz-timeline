import aboutPhoto from "../assets/Title_Alex_01.png";

interface Props {
  onClose: () => void;
}

export function InfoModal({ onClose }: Props) {
  return (
    <div className="info-modal-backdrop" onClick={onClose}>
      {/* stopPropagation so a click inside the modal doesn't bubble up to
          the backdrop and close it — only a genuine click outside should. */}
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="info-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img className="info-modal-photo" src={aboutPhoto} alt="Alexander Rueß" />
        <h2 className="info-modal-title">Jazz Timeline</h2>
        {/* Only this area scrolls if content overflows — photo, title and
            link stay fixed in view regardless of bio length. */}
        <div className="info-modal-bio">
          <p>
            Alexander Rueß, based in Berlin, is a freelance guitarist, composer, and producer. He
            played in the 2018/19 concert band of the BundesJazzOrchester (BuJazzO) and completed
            his Master of Music at the Jazz-Institut Berlin, the HfM Weimar, and the Rytmisk
            Musikkonservatorium in Copenhagen. His playing is marked by lyrical lightness
            contrasted with a nordic melancholy, and concert tours have taken him across Western
            Europe, Japan, Canada, South Korea, China, and the US.
          </p>
          <p>
            In March 2026, Rueß released his debut album Debut on Double Moon Records with Swedish
            trombonist Nils Landgren, reaching over 25,000 streams in its first four weeks. As
            bandleader of the Alexander Rueß Trio, he tours regularly across Germany and Europe. He
            is also the permanent guitarist for jazz singer Atrin Madani, featured on her German
            Jazz Award-nominated debut album, and leads MANKO, an international quintet blending
            electro-urban beats with acoustic instruments.
          </p>
          <p>
            Rueß won the 2019 Lübeck Jazz Prize, the 2018 HfM Dresden ensemble competition, and the
            Frankfurter Musikpreis. Since 2025, he teaches ensemble/band leadership at SRH
            University.
          </p>
        </div>
        <a
          className="info-modal-link"
          href="https://alexruess.wordpress.com/"
          target="_blank"
          rel="noreferrer"
        >
          alexruess.wordpress.com →
        </a>
      </div>
    </div>
  );
}
