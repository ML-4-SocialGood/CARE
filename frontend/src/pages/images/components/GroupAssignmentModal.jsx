/** @format */

import { useDispatch, useSelector } from "react-redux";
import Modal from "../../../components/Modal";
import { getAllStoats } from "../../../../features/stoat/stoatSlice";
import { Button } from "../../../components/Button";
import { useState } from "react";
import PropTypes from "prop-types";
import { Heading } from "../../../components/Heading";
import "./groupAssignmentModal.css";
import {
  add_message,
  bannerStatuses,
} from "../../../../features/banner/bannerSlice";
import { useNavigate } from "react-router-dom";

export default function GroupAssignmentModal({ onCloseClick, onAssign }) {
  const stoats = useSelector((state) => getAllStoats(state));
  const [modalStep, setModalStep] = useState(1);
  const [assignedStoat, setAssignedStoat] = useState(stoats[0]?.id || null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (modalStep === 0) {
    return (
      <Modal onCloseClick={onCloseClick}>
        <Heading level={2} className="group-assign-heading">
          Assignment failed
        </Heading>
        This assignment was unsuccessful. Please contact a developer for more
        information.
      </Modal>
    );
  }

  if (modalStep === 2) {
    const chosenStoat = stoats.find((s) => s.id == assignedStoat);
    return (
      <Modal onCloseClick={onCloseClick}>
        <Heading level={2} className="group-assign-heading">
          Confirm assignment
        </Heading>
        Assigning this group to {chosenStoat.name} will assign all images in the
        group to {chosenStoat.name}.
        <Button
          className="group-assign-confirmation"
          onClick={() => {
            const assignmentSuccess = onAssign(assignedStoat);

            if (assignmentSuccess) {
              dispatch(
                add_message({
                  message: "Images have been assigned successfully.",
                  status: bannerStatuses.success,
                })
              );

              navigate(`/images?stoatId=${chosenStoat.id}`);
              onCloseClick();
            } else {
              setModalStep(0);
            }
          }}
          variant="primary"
        >
          I understand
        </Button>
      </Modal>
    );
  } else {
    return (
      <Modal onCloseClick={onCloseClick}>
        <Heading className="group-assign-heading" level={2}>
          Assign group to stoat
        </Heading>
        <select
          className="group-assign-dropdown"
          name="Sort by"
          onChange={(e) => {
            setAssignedStoat(e.target.value);
          }}
        >
          {stoats.map((stoat) =>
            stoat.id == 0 ? null : (
              <option key={`${stoat.id}-option`} value={stoat.id}>
                {stoat.name}
              </option>
            )
          )}
        </select>

        <Button onClick={() => setModalStep(2)} variant="primary">
          Assign
        </Button>
      </Modal>
    );
  }
}

GroupAssignmentModal.propTypes = {
  onAssign: PropTypes.func,
  onCloseClick: PropTypes.func,
};
