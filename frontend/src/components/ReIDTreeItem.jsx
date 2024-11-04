import { useContext, useState } from "react";
import { TreeContext } from "./TreeProvider";
import classNames from "classnames";
import styles from "./ReIDtreeItem.module.css";
import deleteIcon from "../assets/icon-delete.svg";
import renameIcon from "../assets/icon_rename.svg";
import deleteIconOnclick from "../assets/icon-delete_onclick.svg";
import downloadIcon from "../assets/icon-reid-download.svg"; // Import the download icon

export default function ReIDTreeItem({ itemId, label, children, level, onDelete, onRename, onDownload }) {
    const { selected, setSelected } = useContext(TreeContext);
    const [expand, setExpand] = useState(false);

    return (
        <div className={styles.treeItemWrapper}>
            <div
                className={classNames(
                    styles.treeItem,
                    selected === itemId && styles.treeItemActive
                )}
                onClick={() => {
                    setSelected(itemId);
                    if (children) {
                        setExpand(!expand);
                    }
                }}
            >
                <div className={styles.treeItemContent}>
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
                                className={styles.treeItemActionIcon}
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
                                className={styles.treeItemActionIcon}

                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                ></path>
                            </svg>
                        )
                    ) : (
                        <div className={styles.treeItemIconPlaceholder}></div>
                    )}
                    <span className={styles.treeItemLabel}>{label}</span>
                </div>

                <div className={styles.treeItemActions}>
                    {level === 2 && (
                        <>
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(itemId);
                                }}
                            >
                                <img
                                    src={deleteIcon}
                                    alt="Delete"
                                    className={`${styles.deleteIcon} ${styles.defaultDeleteIcon}`}
                                />
                                <img
                                    src={deleteIconOnclick}
                                    alt="Delete"
                                    className={`${styles.deleteIcon} ${styles.hoverDeleteIcon}`}
                                />
                            </button>
                            {/* Download button */}
                            <button
                                className={styles.treeItemButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(itemId); // Handle download logic
                                }}
                            >
                                <img
                                    src={downloadIcon}
                                    alt="Download"
                                    className={styles.treeItemActionIcon}
                                />
                            </button>
                        </>
                    )}

                    {level === 3 && (
                        <button
                            className={styles.treeItemButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log("onRename:", onRename);
                                onRename(itemId, label);
                            }}
                        >
                            <img
                                src={renameIcon}
                                alt="Rename"
                                className={styles.treeItemActionIcon}
                            />
                        </button>
                    )}
                </div>
            </div>
            {expand && <div className={styles.treeItemChild}>{children}</div>}
        </div>
    );
}
