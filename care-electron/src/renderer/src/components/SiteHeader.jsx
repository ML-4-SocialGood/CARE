/** @format */

import SiteLogo from "./SiteLogo";
import NavBar from "./Nav";
import "./siteheader.css";

export const SiteHeader = () => {
  return (
    <header className="header">
      <div className="header__wrapper">
        <SiteLogo />
        <NavBar />
      </div>
    </header>
  );
};
