import { useContext, useEffect, useState } from "react";
import "./treeItem.css";
import { TreeContext } from "./TreeProvider";
import classNames from "classnames";

export default function TreeItem({ itemId, label, children }) {
  const { selected, setSelected } = useContext(TreeContext);
  const [expand, setExpand] = useState(false);

  return (
    <>
      <div
        className={classNames(
          "tree-item",
          selected === itemId && "tree-item-active"
        )}
        onClick={() => {
          setSelected(itemId);
          if (children) {
            setExpand(!expand);
          }
        }}
      >
        {children ? (
          expand ? (
            <svg
              data-slot="icon"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="tree-item-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              ></path>
            </svg>
          ) : (
            <svg
              data-slot="icon"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="tree-item-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              ></path>
            </svg>
          )
        ) : (
          <div className="tree-item-icon"></div>
        )}

        <span>{label}</span>
      </div>
      {expand && <div className="tree-item-child">{children}</div>}
    </>
  );
}
