/** @format */

import { Heading } from "@renderer/components/Heading";
import PropTypes from "prop-types";

export const SortDropdown = ({ onChange }) => (
  <>
    <Heading level={5}>Sort by</Heading>
    <select className="gallery__sort-select" name="Sort by" onChange={onChange}>
      <option value="oldest">Oldest</option>
      <option value="newest">Newest</option>
    </select>
  </>
);

SortDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
};
