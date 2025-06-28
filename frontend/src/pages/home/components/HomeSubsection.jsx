/** @format */

import PropTypes from "prop-types";

export default function HomeSubsection({ className, children, id }) {
  return (
    <section className={className} id={id}>
      <div className="subsection__container">{children}</div>
    </section>
  );
}

HomeSubsection.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
};
