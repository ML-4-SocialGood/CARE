/** @format */

import Hero from "./components/Hero";
import "./home.css";
import { Divider } from "./components/Divider";
import HomeSubsectionOne from "./components/HomeSubsectionOne";
import HomeSubsectionTwo from "./components/HomeSubsectionTwo";

export default function Home() {
  return (
    <>
      <Hero />
      <Divider />
      <HomeSubsectionOne />
      <HomeSubsectionTwo />
      <Divider />
    </>
  );
}
