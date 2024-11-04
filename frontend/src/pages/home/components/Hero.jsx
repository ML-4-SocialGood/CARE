/** @format */

import React, { useContext } from "react";
import HeroVideo from "../../../assets/hero__video.mp4";
import HeroFallbackImage from "../../../assets/hero_fallback.jpg";
import { Heading } from "../../../components/Heading";
import { Button, SignInButton } from "../../../components/Button";
import { AuthContext } from "../../../hook/auth";

export default function Hero() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <section className="hero">
      <div className="hero__overlay" />
      <video className="hero__video" autoPlay loop muted playsInline>
        <source src={HeroVideo} type="video/mp4" />
        <img src={HeroFallbackImage} alt="The New Zealand bush" />
      </video>
      <div className="hero__content">
        <div className="hero__content__text">
          <Heading level={1}>AI-Driven Identification</Heading>
          <Heading level={3} className={`hero__content__subheading`}>
            On the road to a predator-free Waiheke
          </Heading>
          {isAuthenticated ? (
            <Button
              ariaLabel="Get started"
              className="hero__content__button"
              data-cy="hero-sign-in"
              isLink
              href={"/profile"}
              variant="secondary"
            >
              Get started
            </Button>
          ) : (
            <SignInButton
              ariaLabel="Get started"
              className="hero__content__button"
              data-cy="hero-sign-in"
              variant="secondary"
            >
              Get started
            </SignInButton>
          )}
        </div>
      </div>
    </section>
  );
}
