/** @format */

import { Heading } from "../../components/Heading";
import StoatAvatar from "../../components/StoatAvatar";
import "./stoats.css";
import { Link, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Loader from "../../components/Loader";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAllStoats } from "../../../features/stoat/stoatSlice";

const views = {
  all: "All",
  alive: "Alive",
  untracked: "Deceased/archived",
};

export default function Stoats() {
  const { isLoading, isAuthenticated } = useAuth0();

  const stoats = useSelector((state) => getAllStoats(state));

  const [stoatView, setStoatView] = useState(views.all);
  const [filteredStoats, setFilteredStoats] = useState(stoats || []);

  const onOptionChange = useCallback((e) => {
    setStoatView(views[e.target.value]);
  }, []);

  useEffect(() => {
    let filtered = stoats.filter((stoat) => `${stoat.id}` != "0");

    switch (stoatView) {
      case views.untracked:
        filtered = stoats.filter(
          (stoat) => stoat.deceasedFlag || stoat.archivedFlag
        );
        break;
      case views.alive:
        filtered = stoats.filter(
          (stoat) => !stoat.deceasedFlag && !stoat.archivedFlag
        );
        break;
    }

    setFilteredStoats(filtered);
  }, [setFilteredStoats, stoatView, stoats]);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="stoat-index">
      <Heading level={1} className="stoat-index__heading">
        Stoat index
      </Heading>
      <div>
        <div className="index-filters">
          <fieldset className="stoat-radio">
            <legend>View:</legend>

            <div>
              <input
                type="radio"
                id="all"
                name="view-stoats"
                value="all"
                onChange={onOptionChange}
                checked={stoatView === views.all}
              />
              <label htmlFor="all">All stoats</label>
            </div>

            <div>
              <input
                type="radio"
                id="alive"
                name="view-stoats"
                value="alive"
                onChange={onOptionChange}
                checked={stoatView === views.alive}
              />
              <label htmlFor="alive">Alive</label>
            </div>

            <div>
              <input
                type="radio"
                id="untracked"
                name="view-stoats"
                value="untracked"
                checked={stoatView === views.untracked}
                onChange={onOptionChange}
              />
              <label htmlFor="untracked">Deceased/archived</label>
            </div>
          </fieldset>
        </div>
        <div className="avatar-grid">
          <div className="add-stoat-wrapper">
            <Link
              to={"/stoats/new"}
              className="add-stoat-button"
              aria-label="Add stoat"
            />
          </div>
          {filteredStoats?.length
            ? filteredStoats.map((stoat) => {
                return (
                  <Link
                    className="avatar-link"
                    to={`/stoats/${stoat.id}`}
                    key={`${stoat.name}-${stoat.id}`}
                  >
                    <StoatAvatar
                      name={stoat.name}
                      imgLink={stoat.profileImg}
                      stoat={stoat}
                    />
                  </Link>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
