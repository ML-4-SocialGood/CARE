/** @format */

import HeroVideo from "../../../assets/stoat-4.mp4";
import HeroFallbackImage from "../../../assets/hero_fallback.jpg";
import { Heading } from "../../../components/Heading";
import { Button } from "../../../components/Button";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__overlay" />
      <video className="hero__video" autoPlay loop muted playsInline>
        <source src={HeroVideo} type="video/mp4" />
        <img src={HeroFallbackImage} alt="The New Zealand bush" />
      </video>
      <div className="hero__content">
        <div className="hero__content__text">
          <Heading level={1}>CARE Toolkit</Heading>
          <Heading level={3} className={`hero__content__subheading`}>
            Towards AI-driven conservation
          </Heading>
          <Button
            ariaLabel="Get started"
            className="hero__content__button"
            data-cy="hero-sign-in"
            isLink
            href={"/upload"}
            variant="secondary"
          >
            Get started
          </Button>
        </div>
      </div>
    </section>
  );
}
