/** @format */
import PropTypes from "prop-types";
import { SiteHeader } from "./SiteHeader";
import { Footer } from "./Footer";
import Banner from "./Banner";
import { useDispatch, useSelector } from "react-redux";
import { remove_message } from "../utils/bannerSlice";

export default function SitePage({ component, withHeader, wrapperClass }) {
  const dispatch = useDispatch();
  const bannerMessages = useSelector((state) => state.banner.messages);
  return (
    <div className={wrapperClass}>
      {bannerMessages?.length
        ? bannerMessages.map((bannerObject, idx) => (
            <Banner
              key={`${bannerObject.message}-${idx}`}
              message={bannerObject.message}
              onDismiss={() => {
                dispatch(remove_message(bannerObject.message));
              }}
              style={{
                top: `calc(var(--header-height) + var(--space-32) + var(--space-16) + ${
                  idx * 16
                }px)`,
              }}
              status={bannerObject.status}
            />
          ))
        : null}

      {withHeader && <SiteHeader />}
      {component}
      <Footer />
    </div>
  );
}

SitePage.propTypes = {
  component: PropTypes.node,
  withHeader: PropTypes.bool,
  wrapperClass: PropTypes.string,
};
