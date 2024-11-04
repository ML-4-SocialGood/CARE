import { useEffect, useState, useRef, useMemo } from "react";
import ReactPaginate from "react-paginate";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  add_message,
  bannerStatuses,
} from "../../../../features/banner/bannerSlice";
import closeIcon from "../../../assets/close.png";
import { Button } from "../../../components/Button";
import { Heading } from "../../../components/Heading";
import Modal from "../../../components/Modal";
import TreeItem from "../../../components/TreeItem";
import TreeView from "../../../components/TreeView";
import apiClient from "../../../utils/apiClient";
import classNames from "classnames";

export default function UploadsView({ uploads }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const currentFiles = useMemo(
    () => files.filter((item) => item.parent === currentFolder),
    [files, currentFolder]
  );
  const [selected, setSelected] = useState(new Set());
  const [preview, setPreview] = useState(null);

  const [status, setStatus] = useState("");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!currentFolder) return;

    const fetchFiles = async () => {
      setFiles([]);

      const [date, ...paths] = currentFolder.split("/");
      const response = await apiClient(
        `/api/users/images/browse?date=${date}&folderPath=${paths.join("/")}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      const files = data.files
        .filter((item) => !item.isDirectory)
        .map((item) => ({
          ...item,
          parent: currentFolder,
          path: `${date}/${item.path.replaceAll("\\", "/")}`,
        }));

      setFiles(files);
    };

    fetchFiles();
  }, [currentFolder]);

  const handlePreview = async (file) => {
    const [date, ...paths] = file.path.split("/");

    const response = await apiClient(
      `/api/users/images/view?date=${date}&imagePath=${paths.join("/")}`,
      {
        method: "GET",
      }
    );

    const data = await response.blob();
    setPreview({
      path: file.path,
      name: file.name,
      src: URL.createObjectURL(data),
    });
  };

  const handleAnalyse = async () => {
    if (status) return;

    try {
      setStatus(statuses.processing);

      const response = await apiClient("/api/users/images/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedPaths: Array.from(selected),
        }),
      });

      if (!response.ok) {
        setStatus("");
        const body = await response.json();
        throw new Error(body.error);
      }

      const reader = response.body.getReader();
      let done, value;
      while (!done) {
        ({ value, done } = await reader.read());
        if (done) {
          setTimeout(() => navigate("/images"), 1000);
          break;
        }
        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (/PROCESS: (\d+)\/(\d+)/.test(line)) {
            setCompleted(+RegExp.$1);
            setTotal(+RegExp.$2);
          }
        }
      }
    } catch (err) {
      setStatus("");
      console.error(err);
      dispatch(
        add_message({
          message: `${err}`,
          status: bannerStatuses.error,
        })
      );
    }
  };

  const handleSelectAll = async () => {
    const response = await apiClient(
      `/api/users/images/select_all?path=${currentFolder}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const newSelected = new Set(selected);
      data.selectAllPaths.forEach((item) => {
        newSelected.add(item.replaceAll("\\", "/"));
      });
      setSelected(newSelected);
    }
  };

  return (
    <div className="uploads-view">
      <div className="uploads-folder-list">
        <TreeView onSelectedChange={(itemId) => setCurrentFolder(itemId)}>
          <TreeList folders={uploads}></TreeList>
        </TreeView>
      </div>
      <div className="uploads-file-list">
        {currentFolder ? (
          <PaginateItems
            itemsPerPage={10}
            files={currentFiles}
            selected={selected}
            setSelected={setSelected}
            handleAnalyse={handleAnalyse}
            preview={preview}
            handlePreview={handlePreview}
            handleSelectAll={handleSelectAll}
          />
        ) : (
          <div className="uploads-file-list-warning">
            You can check your uploaded images here. <br />
            Please select a folder from the folder tree.
          </div>
        )}
      </div>
      {preview && (
        <div className="uploads-preview">
          <div className="uploads-preview__header">
            <Button
              className="uploads-preview__close-button"
              onClick={() => {
                setPreview(null);
              }}
            >
              <img
                alt="Close preview"
                className="uploads-preview__close-icon"
                src={closeIcon}
              />
            </Button>
          </div>
          <Heading level={2} className="uploads-preview__title">
            {preview.name}
          </Heading>
          <img src={preview.src} className="primary-preview" />
        </div>
      )}
      {status &&
        createPortal(
          <>
            {/* Mask that blocks interaction outside the modal */}
            <div className="modal-mask"></div>
            <Modal
              className="uploader-modal"
              onCloseClick={() => {
                setStatus(""); // Clear the status first
                terminateAIAndRefresh();
              }}
            >
              {generateModalContent(status, completed, total)}
            </Modal>,
          </>,          
          document.body
        )}
    </div>
  );
}

const terminateAIAndRefresh = async () => {
  try {
    const response = await apiClient(
      `/api/users/terminate_ai`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error('(Terminate) AI server error, please contact support.');
    }

    const data = await response.json();
    console.log(data);

    // Once the API call is successful, refresh the page
    window.location.reload();
  } catch (error) {
    console.error('Error during AI termination:', error);
  }
};

function TreeList({ folders, parent = "" }) {
  const list = folders.filter(
    (item) => item.parent === (parent === "" ? parent : parent + "/")
  );

  return list.map((item) => (
    <TreeItem key={item.path} itemId={item.path} label={item.name}>
      {folders.find((subItem) => subItem.parent === item.path + "/") && (
        <TreeList folders={folders} parent={item.path} />
      )}
    </TreeItem>
  ));
}

function PaginateItems({
  itemsPerPage,
  files,
  selected,
  setSelected,
  handleAnalyse,
  preview,
  handlePreview,
  handleSelectAll,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [inputPage, setInputPage] = useState("1");

  const pageCount = Math.ceil(files.length / itemsPerPage);

  const currentItems = files.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const changePage = ({ selected }) => {
    setCurrentPage(selected);
    setInputPage((selected + 1).toString());
  };

  const handleInputPageChange = () => {
    const page = +inputPage;
    if (Number.isNaN(page)) {
      setInputPage("");
      return;
    }

    if (page <= 0) {
      setCurrentPage(0);
      setInputPage("1");
    } else if (page > pageCount) {
      setCurrentPage(pageCount - 1);
      setInputPage(pageCount.toString());
    } else {
      setCurrentPage(page - 1);
      setInputPage(page.toString());
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    setInputPage("1");
  }, [files]);

  return (
    <>
      {currentItems.length === 0 ? (
        <div className="uploads__list__item uploads__list__item_title">
          <div className="uploads__list__item__fileinfo">
            No files found
            <Button
              className="uploads__list__item__button"
              onClick={handleSelectAll}
            >
              Select All with Subfolders
            </Button>
          </div>
        </div>
      ) : (
        <FileItem
          files={files} // Pass the files prop here
          currentItems={currentItems}
          selected={selected}
          setSelected={setSelected}
          preview={preview}
          handlePreview={handlePreview}
          handleSelectAll={handleSelectAll}
        />
      )}

      <div className="pagination-controls">
        <ReactPaginate
          previousLabel={"<"}
          nextLabel={">"}
          breakLabel={"..."}
          forcePage={currentPage}
          pageCount={pageCount}
          pageRangeDisplayed={3}
          onPageChange={changePage}
          containerClassName="paginationBttns"
          pageLinkClassName="page-num"
          previousLinkClassName="page-num"
          nextLinkClassName="page-num"
          activeLinkClassName="active"
          renderOnZeroPageCount={null}
        />
        <div className="paginationNumberChangeGroup">
          <input
            className="paginationNumberChange"
            minLength={1}
            type="text"
            value={inputPage}
            onChange={(event) => setInputPage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleInputPageChange();
              }
            }}
          />
          <Button
            className="paginationNumberChangeButton"
            onClick={handleInputPageChange}
          >
            Go
          </Button>
        </div>
      </div>

      {/* "Run Detection" button always visible */}
      <Button
        className="analyse-button"
        onClick={handleAnalyse}
        disabled={selected.size === 0} // Disable if nothing selected
      >
        Run Detection
        {selected.size > 0 && (
          <span className="upload-button-count">{selected.size}</span>
        )}
      </Button>
    </>
  );
}

function FileItem({
  files,
  currentItems,
  selected,
  setSelected,
  preview,
  handlePreview,
  handleSelectAll,
}) {
  const selectAllRef = useRef();

  useEffect(() => {
    if (selectAllRef.current) {
      const totalFiles = files.length;
      const selectedFilesCount = files.filter((file) =>
        selected.has(file.path)
      ).length;
      selectAllRef.current.indeterminate =
        selectedFilesCount > 0 && selectedFilesCount < totalFiles;
    }
  }, [files, selected]);

  if (currentItems.length === 0) {
    return (
      <div className="uploads__list__item uploads__list__item_title">
        <div className="uploads__list__item__fileinfo">
          No files found
          <Button
            className="uploads__list__item__button"
            onClick={handleSelectAll}
          >
            Select All with Subfolders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul>
      <li className="uploads__list__item uploads__list__item_title">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={files.every((file) => selected.has(file.path))}
          onChange={() => {
            setSelected((prevSelected) => {
              const newSelected = new Set(prevSelected);
              if (files.every((file) => newSelected.has(file.path))) {
                files.forEach((file) => newSelected.delete(file.path));
              } else {
                files.forEach((file) => newSelected.add(file.path));
              }
              return newSelected;
            });
          }}
        />
        <div className="uploads__list__item__fileinfo">
          Select All
          <Button
            className="uploads__list__item__button"
            onClick={handleSelectAll}
          >
            Select All with Subfolders
          </Button>
        </div>
      </li>
      {currentItems.map((file, index) => (
        <li
          className={classNames(
            "uploads__list__item uploads__list__subitem",
            file.path === preview?.path && "file-name-selected"
          )}
          key={`${file.name}-${index}`}
          onClick={() => handlePreview(file)}
        >
          <input
            type="checkbox"
            checked={selected.has(file.path)}
            onChange={(event) => {
              setSelected((selected) => {
                const newSelected = new Set(selected);
                if (event.target.checked) {
                  newSelected.add(file.path);
                } else {
                  newSelected.delete(file.path);
                }
                return newSelected;
              });
            }}
          />
          <span className="file-name">{file.name}</span>
        </li>
      ))}
    </ul>
  );
}

const statuses = {
  initial: "Initial",
  uploading: "Uploading",
  processing: "Processing",
  error: "Error",
  success: "Success",
  done: "Done",
};

function generateModalContent(status, completed, total) {
  if (status === statuses.uploading) {
    return (
      <>
        <span className="loader"></span>
        <Heading className="modal__heading" level={3}>
          Uploading in progress
        </Heading>
        <p>Images are being uploaded to be processed by the AI model...</p>
      </>
    );
  }

  if (status === statuses.error) {
    return (
      <>
        <Heading className="modal__heading" level={3}>
          There has been an error.
        </Heading>
        <p>Please contact an administrator for assistance.</p>
      </>
    );
  }

  if (status === statuses.processing) {
    return (
      <>
        <span className="loader"></span>
        <Heading className="modal__heading" level={3}>
          Detection in progress...
        </Heading>
        <p>
          The detection AI model is processing your selected images. This is a
          long-running task. <br />A progress bar will appear if the AI server
          successfully receives your images. Thanks for your patience.
        </p>

        {total > 0 && (
          <div className="progress-container">
            <span>
              {completed} / {total}
            </span>
            <div className="progress-wrapper">
              <progress
                className="progress"
                value={Math.floor((completed / total) * 100)}
                max="100"
              >
                {Math.floor((completed / total) * 100)}%
              </progress>
              <img
                src="/STOAT.png"
                className="progress-icon"
                style={{
                  left: `${Math.floor((completed / total) * 100) - 2}%`,
                }}
              />
            </div>
            <span>{Math.floor((completed / total) * 100)}%</span>
          </div>
        )}
      </>
    );
  }
}
